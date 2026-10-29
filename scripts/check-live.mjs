import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {loadArticles,articleRoute} from './articles.mjs';

// Read-only verification: never follows purchase links or calls the Amazon API.
const args=process.argv.slice(2);
const option=name=>{const i=args.indexOf(name);return i<0?undefined:args[i+1];};
const config=JSON.parse(await readFile('site.config.json','utf8'));
const preview=args.includes('--preview');
const origin=preview?config.origin:config.production.origin;
const base=preview?config.basePath:'';
const absolute=route=>new URL(base+'/'+route.replace(/^\//,''),origin).href;
const today=new Intl.DateTimeFormat('en-CA',{timeZone:config.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const files=(await readdir('content/reviews')).filter(f=>f.endsWith('.json'));
const reviews=(await Promise.all(files.map(f=>readFile('content/reviews/'+f,'utf8').then(JSON.parse)))).filter(r=>r.status==='published'&&r.published<=today);
const articles=(await loadArticles()).filter(a=>a.status==='published'&&a.published<=today);
const date=option('--date')??reviews.map(r=>r.published).sort().at(-1);
assert.match(date,/^\d{4}-\d{2}-\d{2}$/,'Use --date YYYY-MM-DD');
const selected=[...reviews.filter(r=>r.published===date).map(r=>({record:r,route:`${r.brandSlug}/${r.modelSlug}/`,kind:'review'})),...articles.filter(a=>a.published===date).map(a=>({record:a,route:articleRoute(a),kind:a.kind}))];
assert(selected.length,'No published records for '+date);
const pages=new Map();
async function get(route){if(pages.has(route))return pages.get(route);const url=absolute(route);const response=await fetch(url,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(20000)});assert.equal(response.status,200,url+' must return200');const html=await response.text();pages.set(route,html);return html;}
const results=[];
for(const {record:r,route,kind}of selected){
 const html=await get(route),url=absolute(route);
 assert(html.includes(`<link rel="canonical" href="${url}">`),url+' canonical');
 assert.equal(html.includes('noindex,follow'),preview,url+' indexing profile');
 const script=html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
 assert(script,url+' structured data');const graph=JSON.parse(script[1])['@graph'];
 const article=graph.find(n=>n['@type']==='Article');assert(article,url+' Article');
 assert.equal(article.datePublished,r.publishedAt,url+' publication timestamp');
 assert.equal(article.dateModified,r.updatedAt,url+' revision timestamp');
 if(kind==='review'){
  const product=graph.find(n=>n['@type']==='Product');assert.equal(product?.sku,r.sku,url+' exactSKU');
  const links=[...html.matchAll(/<a\b([^>]+)>/g)].filter(m=>/amazon\.com\/dp\//.test(m[1]));assert(links.length,url+' purchase link');
  for(const m of links){const href=m[1].match(/href="([^"]+)"/)?.[1]?.replaceAll('&amp;','&');const target=new URL(href);assert.equal(target.searchParams.get('tag'),r.amazon.partnerTag,url+' affiliate tag');assert(target.pathname.includes('/dp/'+r.amazon.asin),url+' exactASIN');assert(/\brel="[^"]*\bsponsored\b/.test(m[1])&&/\brel="[^"]*\bnofollow\b/.test(m[1]),url+' affiliate attributes');}
  const image=await fetch(absolute('assets/'+r.image),{method:'HEAD',signal:AbortSignal.timeout(20000)});assert.equal(image.status,200,url+' official photo');assert(image.headers.get('content-type')?.startsWith('image/'),url+' image type');
 }
 const archives=['','sitemap/','pages-sitemap.xml','feed.xml','llms.txt',kind==='review'?r.brandSlug+'/':kind==='guide'?'guides/':'listicles/'];
 for(const archive of archives)assert((await get(archive)).includes('/'+route),absolute(archive)+' must discover '+route);
 results.push({url,kind,status:200,canonical:true,schema:true,discovery:true});
}
console.log(JSON.stringify({profile:preview?'github-preview':'production',date,checkedAt:new Date().toISOString(),results},null,2));
