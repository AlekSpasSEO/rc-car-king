import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {overallRating} from './review-template.mjs';
import {renderDocument} from './document-template.mjs';

const decode=s=>s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
export async function checkSeo({config,output,records}){
 const site=JSON.parse(await readFile('content/site.json','utf8'));
 const absolute=p=>`${config.origin}${config.basePath}/${p}`;
 const published=records.filter(r=>r.status==='published'&&r.published<=new Intl.DateTimeFormat('en-CA',{timeZone:config.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()));
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
   assert.equal(article.datePublished,r.published);assert.equal(article.dateModified,r.updated);
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
 const sitemap=await readFile('docs/sitemap.xml','utf8');
 assert.match(sitemap,/xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9"/);
 const urls=[...sitemap.matchAll(/<url>(.*?)<\/url>/gs)].map(m=>({loc:decode(m[1].match(/<loc>(.*?)<\/loc>/)?.[1]??''),lastmod:m[1].match(/<lastmod>(.*?)<\/lastmod>/)?.[1]}));
 assert.deepEqual(urls.map(x=>x.loc).sort(),pageRoutes.map(absolute).sort());assert.equal(new Set(urls.map(x=>x.loc)).size,urls.length);
 for(const url of urls){assert.match(url.lastmod,/^\d{4}-\d{2}-\d{2}$/);assert.ok(url.lastmod<=new Date().toLocaleDateString('en-CA',{timeZone:config.timezone}));}
 for(const r of published)assert.equal(urls.find(u=>u.loc===absolute(`${r.brandSlug}/${r.modelSlug}/`)).lastmod,r.updated);
 assert.equal((sitemap.match(/<image:image>/g)??[]).length,published.reduce((n,r)=>n+1+r.gallery.length,0));
 const robots=await readFile('docs/robots.txt','utf8');assert.ok(robots.includes(`Sitemap: ${absolute('sitemap.xml')}`));assert.match(robots,/User-agent: \*\nAllow: \//);assert.ok(!robots.includes('LLM-Policy'));
 const llms=await readFile('docs/llms.txt','utf8');for(const r of published)assert.ok(llms.includes(absolute(`${r.brandSlug}/${r.modelSlug}/`)));
 assert.ok((await readFile('docs/about/index.html','utf8')).includes(site.founder.name));
 const escaped=renderDocument({title:'Example',description:'Example',body:'',href:p=>'/'+p,absolute:p=>'https://example.com/'+p,esc:String,schema:{'@context':'https://schema.org',name:'</script><script>bad()</script>'}});
 const parsed=JSON.parse(escaped.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);assert.equal(parsed.name,'</script><script>bad()</script>');
 console.log(`Verified ${pageRoutes.length} sitemap URLs, metadata uniqueness, schema facts/references, ${published.length} affiliate review pages and optional AI directory.`);
}
