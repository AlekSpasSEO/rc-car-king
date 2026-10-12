import assert from 'node:assert/strict';
import {readFile,readdir,access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import {matchesVehicle} from './amazon-client.mjs';
import {overallRating} from './review-template.mjs';
const config=JSON.parse(await readFile('site.config.json','utf8'));
const files=(await readdir('content/reviews')).filter(f=>f.endsWith('.json'));
const slugs=new Set();
for(const f of files){
 const r=JSON.parse(await readFile(`content/reviews/${f}`,'utf8'));
 for(const key of ['brand','brandSlug','model','modelSlug','sku','title','dek','published','updated','reviewType','type','use','motor','power','drive','scale','format','skill','verdict','verdictText']) assert.equal(typeof r[key],'string',`${f}: missing ${key}`);
 for(const key of ['brandSlug','modelSlug']) assert.match(r[key],/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
 for(const key of ['published','updated']) assert.match(r[key],/^\d{4}-\d{2}-\d{2}$/);
 assert.ok(['published','draft'].includes(r.status));
 const slug=`${r.brandSlug}/${r.modelSlug}`;assert.ok(!slugs.has(slug),'Duplicate route');slugs.add(slug);
 assert.ok(Number.isFinite(r.price.amount)&&r.price.amount>0);assert.match(r.price.currency,/^[A-Z]{3}$/);
 assert.ok(r.price.basis&&r.price.checked&&r.price.source);
 assert.ok(r.sources.length>=2,'Require two primary sources');
 assert.ok(r.sections.length>=4&&r.specs.length>=8);
 assert.ok(r.pros.length&&r.cons.length&&r.terrain.length);
 if(!r.handsOn) assert.match(r.reviewType,/specification|research-led/i);
 if(r.status==='published'){
  assert.equal(r.vehicleScope,'Complete RC car','Only complete RC cars are currently published');
  assert.ok(r.overview&&r.quickSpecs.length>=6&&r.bestFor.length&&r.avoidIf.length);
  assert.ok(r.amazon?.asin&&r.amazon.sku===r.sku);
  assert.equal(new URL(r.amazon.detailPageUrl).hostname,'www.amazon.com');
  assert.equal(new URL(r.amazon.detailPageUrl).searchParams.get('tag'),r.amazon.partnerTag);
  assert.equal(r.rating.dimensions.length,5);assert.ok(r.rating.disclosure&&r.rating.audience);
  for(const d of r.rating.dimensions)assert.ok(d.score>=1&&d.score<=10&&d.reason);
  assert.ok(overallRating(r)>=1&&overallRating(r)<=10);
  const words=r.sections.flatMap(s=>s.paragraphs).join(' ').trim().split(/\s+/).length;
  assert.ok(words>=1800,`${f}: a full review needs substantive buying analysis`);
  assert.ok(r.imageCredit&&r.faqs.length>=5&&r.gallery.length>=2);
 }
 for(const s of r.sources){assert.equal(new URL(s.url).protocol,'https:');assert.ok(s.checked);}
 await access(`public/assets/${r.image}`);
}
async function walk(dir){return(await Promise.all((await readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]))).flat();}
const output=await walk('docs');
for(const file of output.filter(f=>f.endsWith('.html'))){
 const html=await readFile(file,'utf8');
 assert.equal((html.match(/<h1\b/g)||[]).length,1,`${file}: one H1`);
 assert.ok(html.includes('<title>')&&html.includes('name="description"'));
 for(const m of html.matchAll(/(?:href|src)="([^"#?]+)[^"]*"/g)){
  const url=m[1];if(!url.startsWith(config.basePath+'/')) continue;
  const local=url.slice(config.basePath.length+1).split('?')[0];
  await access(path.join('docs',local,local.endsWith('/')?'index.html':''));
 }
 const schema=html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);if(schema) JSON.parse(schema[1]);
}
// Test the actual filter event logic with boundary prices, combined fields and search.
const controls={brand:{tagName:'SELECT',options:[{value:''},{value:'Tamiya'}],value:''},price:{tagName:'SELECT',options:[],value:''},use:{tagName:'SELECT',options:[],value:''},q:{tagName:'INPUT',value:''}};
const events={};const form={elements:{namedItem:n=>controls[n]},addEventListener:(n,f)=>events[n]=f,reset(){for(const c of Object.values(controls))c.value='';events.reset();}};
const rows=[['Tamiya',227,'Drifting','tamiya tt-02d brushed 4wd'],['Other',150,'Bashing','other truck brushless'],['Other',300,'Racing','other racer']].map(([brand,price,use,search])=>({dataset:{brand,price:String(price),use,search},hidden:false}));
const count={},empty={},reset={addEventListener(){}};
const document={querySelector:s=>({'#filters':form,'#review-count':count,'#empty-state':empty,'#reset-empty':reset}[s]),querySelectorAll:()=>rows};
class FormDataMock{constructor(){this.values=Object.entries(controls).map(([k,v])=>[k,v.value]);}[Symbol.iterator](){return this.values[Symbol.iterator]();}}
vm.runInNewContext(await readFile('public/assets/filters.js','utf8'),{document,URL,URLSearchParams,location:{href:'https://example.com/',search:''},history:{replaceState(){}},FormData:FormDataMock,window:{addEventListener(){}},queueMicrotask:f=>f()});
controls.price.value='150-300';events.change();assert.deepEqual(rows.map(r=>!r.hidden),[true,true,false]);
controls.brand.value='Tamiya';controls.use.value='Drifting';controls.q.value='tt-02d brushed';events.input();assert.deepEqual(rows.map(r=>!r.hidden),[true,false,false]);
controls.use.value='Bashing';events.change();assert.ok(empty.hidden===false&&rows.every(r=>r.hidden));
form.reset();assert.equal(count.textContent,'3 REVIEWS IN THE GARAGE');assert.ok(rows.every(r=>!r.hidden));
console.log(`Verified ${files.length} content records, ${output.filter(f=>f.endsWith('.html')).length} pages, internal links, metadata and filter behavior.`);
const offerContext={document:{querySelectorAll:()=>[]}};
vm.runInNewContext(await readFile('public/assets/offers.js','utf8'),offerContext);
const now=Date.parse('2026-10-13T09:00:00Z');
assert.equal(offerContext.isFresh({checkedAt:new Date(now-23*3600000).toISOString()},now),true);
assert.equal(offerContext.isFresh({checkedAt:new Date(now-24*3600000).toISOString()},now),false);
assert.equal(offerContext.isFresh({checkedAt:new Date(now+1000).toISOString()},now),false);
assert.equal(offerContext.isFresh({checkedAt:'invalid'},now),false);
const vehicle={sku:'105247-4',brand:'Traxxas',amazon:{asin:'B0H88LPTT1'}};
const validItem={asin:'B0H88LPTT1',itemInfo:{manufactureInfo:{itemPartNumber:{displayValue:'105247-4'}},byLineInfo:{brand:{displayValue:'Traxxas'}}}};
assert.equal(matchesVehicle(validItem,vehicle),true);
assert.equal(matchesVehicle({...validItem,itemInfo:{...validItem.itemInfo,manufactureInfo:{itemPartNumber:{displayValue:'10515-BLK'}}}},vehicle),false);
assert.equal(matchesVehicle({...validItem,asin:'OTHER'},vehicle),false);
assert.equal(matchesVehicle({...validItem,itemInfo:{...validItem.itemInfo,byLineInfo:{brand:{displayValue:'Other'}}}},vehicle),false);
console.log('Verified Amazon offer expiry, wrong-SKU/body exclusion and editorial-rating content requirements.');
