import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {articleRoute,articleGroups,articleWords,publishedArticles} from './articles.mjs';
import {overallRating} from './review-template.mjs';
import {renderDocument} from './document-template.mjs';

const decode=s=>s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
export async function checkSeo({config,output,records,articleRecords=[]}){
 const site=JSON.parse(await readFile('content/site.json','utf8'));
 const policies=JSON.parse(await readFile('content/policies.json','utf8'));
 const absolute=p=>`${config.origin}${config.basePath}/${p}`;
 const published=records.filter(r=>r.status==='published'&&r.published<=new Intl.DateTimeFormat('en-CA',{timeZone:config.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()));
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:config.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const articles=publishedArticles(articleRecords,today),groups=articleGroups(articles),articleByRoute=new Map(articles.map(a=>[articleRoute(a),a]));
 const reviewByRoute=new Map(published.map(r=>[`${r.brandSlug}/${r.modelSlug}/`,r]));
 const titles=new Set(),descriptions=new Set(),pageRoutes=[];
 for(const file of output.filter(f=>f.endsWith('.html'))){
  const html=await readFile(file,'utf8'),route=path.relative('docs',file).split(path.sep).join('/').replace(/index\.html$/,'');
  const title=decode(html.match(/<title>(.*?)<\/title>/s)?.[1]??'');
  const metas=new Map();
  for(const match of html.matchAll(/<meta\s+([^>]+)>/g)){
   const attrs=Object.fromEntries([...match[1].matchAll(/([\w:-]+)="([^"]*)"/g)].map(m=>[m[1],decode(m[2])]));
   const key=attrs.name??attrs.property;if(!key)continue;
   assert.ok(!metas.has(key),`${file}: duplicate ${key}`);metas.set(key,attrs.content);
  }
  assert.ok(title.length>=20&&title.length<=90,`${file}: focused title (${title.length} characters)`);
  assert.ok(!/undefined|\{[^}]*\}|lorem ipsum|TODO/i.test(title+' '+metas.get('description')),`${file}: actual metadata values`);
  assert.ok(!titles.has(title),`${file}: duplicate title`);titles.add(title);
  assert.ok(!descriptions.has(metas.get('description')),`${file}: duplicate description`);descriptions.add(metas.get('description'));
  assert.ok(metas.get('description')?.length>=(route==='404.html'?20:60)&&metas.get('description').length<=200,`${file}: useful description`);
  for(const key of ['og:title','twitter:title'])assert.equal(metas.get(key),title,`${file}: ${key}`);
  for(const key of ['og:description','twitter:description'])assert.equal(metas.get(key),metas.get('description'),`${file}: ${key}`);
  assert.equal(metas.get('og:url'),absolute(route));assert.equal(metas.get('og:site_name'),'RC Car King');
  assert.equal(metas.get('twitter:card'),'summary_large_image');assert.equal(metas.get('twitter:image'),metas.get('og:image'));
  assert.ok(metas.get('og:image:alt')&&metas.get('twitter:image:alt'));
  const preview=config.origin!==config.production.origin;
  assert.match(metas.get('robots'),preview||route==='404.html'?/noindex,follow/:/index,follow,max-image-preview:large/);
  for(const p of ['about/','privacy-policy/','terms-of-service/','sitemap/'])assert.ok(html.includes(`href="${config.basePath}/${p}"`),`${file}: shared footer discovers ${p}`);
  assert.ok(html.includes(`rel="sitemap" type="application/xml" href="${config.basePath}/sitemap_index.xml"`));
  assert.ok(html.includes('itemscope itemtype="https://schema.org/SiteNavigationElement"'),`${file}: navigation microdata`);
  if(route==='404.html')continue;
  pageRoutes.push(route);
  const data=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)?.[1]??'null');
  assert.equal(data?.['@context'],'https://schema.org');assert.ok(data['@graph'].length>=6);
  const graph=data['@graph'],org=graph.find(x=>x['@id']===absolute('#organization'));
  assert.equal(org?.name,site.publisher);assert.equal(org.logo.width,512);
  const founder=graph.find(x=>x['@type']==='Person');assert.equal(founder?.name,site.founder.name);assert.deepEqual(founder.sameAs,[site.founder.source]);
  const ids=new Set();
  function gather(value){if(Array.isArray(value))return value.forEach(gather);if(!value||typeof value!=='object')return;if(value['@id']&&Object.keys(value).length>1)ids.add(value['@id']);Object.values(value).forEach(gather);}
  function checkReferences(value){if(Array.isArray(value))return value.forEach(checkReferences);if(!value||typeof value!=='object')return;if(value['@id']&&Object.keys(value).length===1)assert.ok(ids.has(value['@id']),`${file}: unresolved schema reference ${value['@id']}`);Object.values(value).forEach(checkReferences);}
  gather(graph);checkReferences(graph);
  if(route){
   const crumbs=graph.find(x=>x['@type']==='BreadcrumbList');
   const microdata=html.match(/<nav class="breadcrumbs"[^>]*>(.*?)<\/nav>/s);
   assert.ok(microdata,`${file}: visible breadcrumb microdata`);
   assert.ok(microdata[0].includes(`itemid="${crumbs['@id']}"`),`${file}: same breadcrumb identity in both formats`);
   const items=[...microdata[1].matchAll(/<li\b[^>]*>(.*?)<\/li>/gs)].map(m=>({
    name:decode(m[1].match(/<span itemprop="name">(.*?)<\/span>/s)?.[1]??''),
    item:decode(m[1].match(/itemprop="item" href="([^"]*)"/)?.[1]??''),
    position:Number(m[1].match(/itemprop="position" content="(\d+)"/)?.[1])
   }));
   assert.deepEqual(items,crumbs.itemListElement.map(({name,item,position})=>({name,item,position})),`${file}: microdata agrees with JSON-LD`);
  }
  const policy=policies.pages.find(p=>p.path===route);
  if(policy){
   assert.equal(title,policy.title);assert.equal(metas.get('description'),policy.description);
   assert.equal(graph.find(x=>x['@id']===absolute(route+'#webpage')).dateModified,policies.updated);
   assert.ok(html.includes(policies.contact.url));
  }
  const a=articleByRoute.get(route);
  if(a){
   assert.equal(title,a.seo.title);assert.equal(metas.get('description'),a.seo.description);assert.equal(metas.get('og:type'),'article');
   assert.ok(!graph.some(n=>['Product','Review','HowTo'].includes(n['@type'])),'Guides have no fabricated vehicle review or search eligibility');
   const article=graph.find(n=>n['@type']==='Article'),faq=graph.find(n=>n['@type']==='FAQPage');
   assert.equal(article.headline,a.title);assert.equal(article.abstract,a.answer);assert.equal(article.wordCount,articleWords(a));
   assert.equal(article.author['@id'],absolute('about/#garage-editor'));assert.equal(article.publisher['@id'],absolute('#organization'));
   assert.equal(article.datePublished,a.publishedAt);assert.equal(article.dateModified,a.updatedAt);
   assert.equal(metas.get('article:published_time'),a.publishedAt);assert.equal(metas.get('article:modified_time'),a.updatedAt);
   assert.equal(metas.get('article:section'),a.kind==='guide'?'RC car guides':'RC car lists');
   assert.deepEqual(article.citation,[...new Set(a.sources.map(s=>s.url))]);assert.deepEqual(faq.mainEntity.map(q=>({question:q.name,answer:q.acceptedAnswer.text})),a.faqs);
   for(const f of a.faqs)for(const value of [f.question,f.answer]){assert.ok(html.includes(value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))));}
   assert.ok(html.includes('datetime="'+a.publishedAt+'"')&&html.includes('datetime="'+a.updatedAt+'"'));
   for(const review of a.reviewLinks)assert.ok(html.includes('href="'+config.basePath+'/'+review.route+'"'));
   for(const image of article.image)assert.ok(image.width>0&&image.height>0);
   assert.ok(!html.includes('data-amazon-offer='),'Article has no fabricated vehicle offer box');
    const picks=graph.find(n=>n['@type']==='ItemList');
    if(a.picks?.length){
     assert.ok(picks);assert.equal(picks.numberOfItems,a.picks.length);assert.equal(picks.itemListOrder,'https://schema.org/ItemListUnordered');assert.equal(article.mainEntity['@id'],picks['@id']);
     assert.deepEqual(picks.itemListElement.map(p=>({position:p.position,name:p.name,identifier:p.identifier,url:p.url})),a.picks.map((p,i)=>({position:i+1,name:p.title,identifier:p.sku,url:absolute(p.route)})));
     assert.equal((html.match(/class="listicle-pick"/g)??[]).length,a.picks.length);assert.ok(html.includes('Affiliate disclosure:'));
     for(const p of a.picks){const r=reviewByRoute.get(p.route);assert.ok(html.includes('data-pick-sku="'+p.sku+'"'));assert.ok(html.includes(r.amazon.asin));assert.ok(html.includes('data-pick-route="'+p.route+'"'));}
     for(const m of html.matchAll(/<a\b([^>]+)>/g)){const attrs=Object.fromEntries([...m[1].matchAll(/([\w:-]+)="([^"]*)"/g)].map(v=>[v[1],decode(v[2])]));if(!attrs.href?.startsWith('https://www.amazon.com/'))continue;const target=new URL(attrs.href);assert.equal(target.searchParams.get('tag'),'coffeedant03-20');assert.match(attrs.rel,/nofollow/);assert.match(attrs.rel,/sponsored/);}
    }else assert.ok(!picks,'No product pick list invented for a guide');
  }
  const group=groups.find(g=>g.directory+'/'===route);
  if(group){const list=graph.find(n=>n['@type']==='ItemList');assert.equal(list.numberOfItems,group.entries.length);assert.deepEqual(list.itemListElement.map(i=>i.url),group.entries.map(a=>absolute(articleRoute(a))));}
  const r=reviewByRoute.get(route);
  if(r){
   assert.equal(title,r.seo.title);assert.equal(metas.get('description'),r.seo.description);
   assert.equal(metas.get('og:type'),'article');assert.equal(metas.get('og:image:alt'),r.imageAlt);
   const product=graph.find(x=>x['@type']==='Product'),article=graph.find(x=>x['@type']==='Article'),faq=graph.find(x=>x['@type']==='FAQPage');
   assert.equal(product.name,`${r.brand} ${r.model}`);assert.equal(product.sku,r.sku);assert.equal(product.mpn,r.sku);assert.equal(product.brand.name,r.brand);
   assert.equal(product.identifier.value,r.amazon.asin);assert.equal(product.review.reviewRating.ratingValue,overallRating(r));
   assert.equal(product.review.author.name,site.editorialName);assert.equal(product.review.reviewBody,r.verdictText);
   assert.deepEqual(product.review.positiveNotes.itemListElement.map(x=>x.name),r.pros);
   assert.deepEqual(product.review.negativeNotes.itemListElement.map(x=>x.name),r.cons);
   assert.deepEqual(product.additionalProperty,r.specs.map(([name,value])=>({'@type':'PropertyValue',name,value})));
   assert.ok(!product.offers&&!product.aggregateRating,'No stale offers or fabricated customer ratings in static schema');
   assert.equal(article.datePublished,r.publishedAt);assert.equal(article.dateModified,r.updatedAt);
   assert.equal(product.review.datePublished,r.publishedAt);assert.equal(product.review.dateModified,r.updatedAt);
   assert.equal(metas.get('article:published_time'),r.publishedAt);assert.equal(metas.get('article:modified_time'),r.updatedAt);
   assert.deepEqual(article.citation,[...new Set(r.sources.map(s=>s.url))]);
   assert.deepEqual(faq.mainEntity.map(q=>({question:q.name,answer:q.acceptedAnswer.text})),r.faqs);
   for(const img of product.image){assert.ok(img.width>0&&img.height>0,'Use actual image dimensions');assert.equal(new URL(img.url).protocol,'https:');}
   for(const m of html.matchAll(/<a\b([^>]+)>/g)){
    const attrs=Object.fromEntries([...m[1].matchAll(/([\w:-]+)="([^"]*)"/g)].map(a=>[a[1],decode(a[2])]));
    if(!attrs.href?.startsWith('https://www.amazon.com/'))continue;
    const url=new URL(attrs.href);assert.equal(url.searchParams.get('tag'),r.amazon.partnerTag,`${file}: affiliate tag`);
    assert.match(attrs.rel,/\bsponsored\b/);assert.match(attrs.rel,/\bnofollow\b/);
   }
   assert.ok(html.includes('As an Amazon Associate I earn from qualifying purchases.'));
  }
 }
 const index=await readFile('docs/sitemap_index.xml','utf8');
 assert.match(index,/<sitemapindex xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9">/);
 const children=[...index.matchAll(/<sitemap><loc>(.*?)<\/loc><lastmod>(.*?)<\/lastmod><\/sitemap>/g)];
 assert.equal(children.length,1);assert.equal(decode(children[0][1]),absolute('pages-sitemap.xml'));
 assert.equal(await readFile('docs/sitemap.xml','utf8'),index,'Existing sitemap.xml subscribers discover the same index');
 const sitemap=await readFile('docs/pages-sitemap.xml','utf8');
 assert.match(sitemap,/xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9"/);
 const urls=[...sitemap.matchAll(/<url>(.*?)<\/url>/gs)].map(m=>({loc:decode(m[1].match(/<loc>(.*?)<\/loc>/)?.[1]??''),lastmod:m[1].match(/<lastmod>(.*?)<\/lastmod>/)?.[1]}));
 assert.deepEqual(urls.map(x=>x.loc).sort(),pageRoutes.map(absolute).sort());assert.equal(new Set(urls.map(x=>x.loc)).size,urls.length);
 for(const url of urls){assert.match(url.lastmod,/^\d{4}-\d{2}-\d{2}$/);assert.ok(url.lastmod<=new Date().toLocaleDateString('en-CA',{timeZone:config.timezone}));}
 for(const r of published)assert.equal(urls.find(u=>u.loc===absolute(`${r.brandSlug}/${r.modelSlug}/`)).lastmod,r.updated);
 for(const p of policies.pages)assert.equal(urls.find(u=>u.loc===absolute(p.path)).lastmod,policies.updated);
 assert.equal(children[0][2],urls.reduce((last,u)=>u.lastmod>last?u.lastmod:last,''),'Index date reflects its child sitemap');
 assert.equal((sitemap.match(/<image:image>/g)??[]).length,published.reduce((n,r)=>n+1+r.gallery.length,0)+articles.filter(a=>a.image).length);
 const robots=await readFile('docs/robots.txt','utf8');assert.ok(robots.includes(`Sitemap: ${absolute('sitemap_index.xml')}`));assert.match(robots,/User-agent: \*\nAllow: \//);assert.ok(!robots.includes('LLM-Policy'));
 const feed=await readFile('docs/feed.xml','utf8'),llms=await readFile('docs/llms.txt','utf8');
 for(const a of articles){assert.ok(feed.includes(absolute(articleRoute(a))));assert.ok(llms.includes(absolute(articleRoute(a))));assert.equal(urls.find(u=>u.loc===absolute(articleRoute(a))).lastmod,a.updated);}
 for(const group of groups)assert.ok(llms.includes(absolute(group.directory+'/')));
 for(const a of articleRecords.filter(a=>!articles.includes(a))){assert.ok(!feed.includes(absolute(articleRoute(a)))&&!llms.includes(absolute(articleRoute(a)))&&!urls.some(u=>u.loc===absolute(articleRoute(a))));}
 for(const r of published)assert.ok(llms.includes(absolute(`${r.brandSlug}/${r.modelSlug}/`)));
 for(const p of [...policies.pages.map(p=>p.path),'sitemap_index.xml','pages-sitemap.xml'])assert.ok(llms.includes(absolute(p)),`AI directory discovers ${p}`);
 const htmlSitemap=await readFile('docs/sitemap/index.html','utf8');
 for(const p of pageRoutes)assert.ok(htmlSitemap.includes(`href="${config.basePath}/${p}"`),`HTML sitemap discovers ${p}`);
 const redirects=await readFile('docs/_redirects','utf8');assert.ok(redirects.includes('/llm.txt /llms.txt 301'));assert.ok(redirects.includes('/tos/ /terms-of-service/ 301'));
 assert.ok((await readFile('docs/about/index.html','utf8')).includes(site.founder.name));
 const escaped=renderDocument({title:'Example',description:'Example',body:'',href:p=>'/'+p,absolute:p=>'https://example.com/'+p,esc:String,schema:{'@context':'https://schema.org',name:'</script><script>bad()</script>'}});
 const parsed=JSON.parse(escaped.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);assert.equal(parsed.name,'</script><script>bad()</script>');
 console.log(`Verified ${pageRoutes.length} sitemap URLs, metadata uniqueness, schema facts/references, ${published.length} affiliate review pages and optional AI directory.`);
}
