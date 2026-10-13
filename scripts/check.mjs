import assert from 'node:assert/strict';
import {readFile,readdir,access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import {matchesVehicle} from './amazon-client.mjs';
import {refreshOffers} from './amazon-offers.mjs';
import {overallRating} from './review-template.mjs';
import {checkSeo} from './check-seo.mjs';
const config=JSON.parse(await readFile('site.config.json','utf8'));
config.basePath=process.env.BASE_PATH??config.basePath;
config.origin=process.env.SITE_ORIGIN??config.origin;
const today=new Intl.DateTimeFormat('en-CA',{timeZone:config.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const expectedPages=[];
const files=(await readdir('content/reviews')).filter(f=>f.endsWith('.json'));
const slugs=new Set();const publishedAsins=new Set();const paragraphsSeen=new Map();
const records=[],publishedBrands=new Set();
for(const f of files){
 const r=JSON.parse(await readFile(`content/reviews/${f}`,'utf8'));
 records.push(r);
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
  for(const [timestamp,dateField] of [['publishedAt','published'],['updatedAt','updated']]){
   assert.match(r[timestamp]??'',/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/,`${f}: actual timezone-aware ${timestamp}`);
   const instant=new Date(r[timestamp]);assert.ok(Number.isFinite(instant.getTime()),`${f}: valid ${timestamp}`);
   assert.equal(new Intl.DateTimeFormat('en-CA',{timeZone:config.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(instant),r[dateField],`${f}: date matches ${timestamp}`);
  }
  assert.ok(new Date(r.updatedAt)>=new Date(r.publishedAt),`${f}: revision follows publication`);
  assert.ok(r.seo?.title&&r.seo?.description,`${f}: authored SEO metadata is required`);
  assert.equal(r.vehicleScope,'Complete RC car','Only complete RC cars are currently published');
  assert.ok(r.overview&&r.quickSpecs.length>=6&&r.bestFor.length&&r.avoidIf.length);
  assert.ok(r.amazon?.asin&&r.amazon.sku===r.sku);
  assert.notEqual(new URL(r.price.source).hostname,'www.amazon.com',`${f}: use independent static price references; Amazon prices belong in the expiring offer display`);
  if(r.amazon.apiSku&&r.amazon.apiSku!==r.sku)assert.ok(r.amazon.identityNote,`${f}: document the API manufacturer-part mapping`);
  assert.ok(!publishedAsins.has(r.amazon.asin),`${f}: duplicate reviewed Amazon vehicle`);publishedAsins.add(r.amazon.asin);
  assert.ok(['Drifting','Bashing','Crawling','Racing','Trail driving'].includes(r.use),`${f}: unsupported use label`);
  assert.ok(['Brushed','Brushless','Nitro','Gas','Not included','Unknown'].includes(r.motor),`${f}: unsupported motor label`);
  assert.ok(r.sources.filter(s=>/manufacturer/i.test(s.kind??'')).length>=2,`${f}: two primary manufacturer sources required`);
  assert.deepEqual(r.sections.map(s=>s.id),['overview','package','drivetrain','controls','steering','terrain','body','cost','alternatives','verdict'],`${f}: complete article structure`);
  assert.equal(new URL(r.amazon.detailPageUrl).hostname,'www.amazon.com');
  assert.equal(new URL(r.amazon.detailPageUrl).searchParams.get('tag'),r.amazon.partnerTag);
  assert.equal(r.rating.dimensions.length,5);assert.ok(r.rating.disclosure&&r.rating.audience);
  for(const d of r.rating.dimensions)assert.ok(d.score>=1&&d.score<=10&&d.reason);
  assert.ok(overallRating(r)>=1&&overallRating(r)<=10);
  const words=r.sections.flatMap(s=>s.paragraphs).join(' ').trim().split(/\s+/).length;
  assert.ok(words>=2000,`${f}: a full review needs at least 2,000 words of substantive buying analysis (found ${words})`);
  for(const section of r.sections){
   assert.ok(section.paragraphs.length&&section.paragraphs.every(p=>typeof p==='string'&&p.trim()),`${f}: empty section`);
   for(const index of section.sourceIndexes??[])assert.ok(Number.isInteger(index)&&r.sources[index],`${f}: invalid source index`);
   for(const paragraph of section.paragraphs){
    const normalized=paragraph.toLowerCase().replace(/\s+/g,' ').trim();
    if(normalized.split(' ').length>=45){assert.ok(!paragraphsSeen.has(normalized),`${f}: repeated article paragraph also in ${paragraphsSeen.get(normalized)}`);paragraphsSeen.set(normalized,f);}
   }
  }
  assert.ok(r.imageCredit&&r.faqs.length>=5&&r.gallery.length>=2);
  if(r.published<=today){expectedPages.push(`docs/${r.brandSlug}/${r.modelSlug}/index.html`);publishedBrands.add(r.brandSlug);}
 }
 for(const s of r.sources){assert.equal(new URL(s.url).protocol,'https:');assert.ok(s.checked);}
 for(const asset of [r.image,...(r.gallery??[]).map(g=>g.image)]){
  if(/^https:\/\//i.test(asset))assert.equal(new URL(asset).protocol,'https:');else await access(`public/assets/${asset}`);
 }
}
async function walk(dir){return(await Promise.all((await readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]))).flat();}
const output=await walk('docs');
expectedPages.push('docs/about/index.html',...[...publishedBrands].map(brand=>`docs/${brand}/index.html`));
assert.equal(output.filter(f=>f.endsWith('.html')).length,expectedPages.length+3,'Generated archive must include reviews, brand archives, About, homepage, methodology and404');
await Promise.all(expectedPages.map(file=>access(file)));
for(const file of output.filter(f=>f.endsWith('.html'))){
 const html=await readFile(file,'utf8');
 assert.equal((html.match(/<h1\b/g)||[]).length,1,`${file}: one H1`);
 assert.ok(html.includes('<title>')&&html.includes('name="description"'));
 const pageRoute=path.relative('docs',file).split(path.sep).join('/').replace(/index\.html$/,'');
 assert.ok(html.includes(`<link rel="canonical" href="${config.origin}${config.basePath}/${pageRoute}">`),`${file}: canonical must match the deployment origin and route`);
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
const mappedVehicle={sku:'58354',brand:'Tamiya',amazon:{asin:'FROG',apiSku:'TAM58354',identityNote:'Documented manufacturer/distributor prefix'}};
const mappedItem={asin:'FROG',itemInfo:{manufactureInfo:{itemPartNumber:{displayValue:'TAM58354'}},byLineInfo:{brand:{displayValue:'TAMIYA'}}}};
assert.equal(matchesVehicle(mappedItem,mappedVehicle),true);
assert.equal(matchesVehicle({...mappedItem,itemInfo:{...mappedItem.itemInfo,manufactureInfo:{itemPartNumber:{displayValue:'TAM58365'}}}},mappedVehicle),false);
console.log('Verified Amazon offer expiry, wrong-SKU/body exclusion and editorial-rating content requirements.');

// Regression: one inaccessible or mismatched listing cannot hold the archive's
// other offers hostage, and an old price must never survive the failed record.
const offerReviews=Array.from({length:50},(_,i)=>({sku:`SKU-${i}`,brand:'Test Brand',amazon:{asin:`ASIN-${i}`,variant:'Complete car',detailPageUrl:`https://www.amazon.com/dp/ASIN-${i}?tag=coffeedant03-20`}}));
const itemFor=r=>({asin:r.amazon.asin,itemInfo:{manufactureInfo:{itemPartNumber:{displayValue:r.sku}},byLineInfo:{brand:{displayValue:r.brand}}},offersV2:{listings:[{price:{money:{amount:199,currency:'USD',displayAmount:'$199.00'}},availability:{type:'IN_STOCK'},merchantInfo:{name:'Test seller'}}]}});
const fixedCheck=new Date().toISOString(),noPause=async()=>{};
const partial=await refreshOffers({reviews:offerReviews,checkedAt:fixedCheck,pause:noPause,client:{get:async asins=>({itemsResult:{items:offerReviews.filter(r=>asins.includes(r.amazon.asin)&&r.amazon.asin!=='ASIN-7').map(itemFor)},errors:[{code:'ItemNotAccessible'}]})}});
assert.equal(Object.values(partial.offers).filter(o=>o.status==='verified').length,49);
assert.equal(Object.values(partial.offers).filter(o=>o.status==='unavailable').length,1);
const unavailable=partial.offers['ASIN-7'];
assert.equal(unavailable.reason,'ITEM_UNAVAILABLE');assert.equal(unavailable.detailPageUrl,offerReviews[7].amazon.detailPageUrl);
for(const key of ['price','priceDisplay','currency','seller'])assert.equal(unavailable[key],null);
const mismatch=await refreshOffers({reviews:[offerReviews[0]],pause:noPause,client:{get:async()=>({itemsResult:{items:[{...itemFor(offerReviews[0]),itemInfo:validItem.itemInfo}]}})}});
assert.equal(mismatch.offers['ASIN-0'].reason,'IDENTITY_MISMATCH');assert.equal(mismatch.offers['ASIN-0'].price,null);
const recovered=await refreshOffers({reviews:offerReviews.slice(0,3),pause:noPause,client:{get:async asins=>{
 if(asins.length>1||asins[0]==='ASIN-1')throw Error('Simulated request failure');
 return {itemsResult:{items:[itemFor(offerReviews.find(r=>r.amazon.asin===asins[0]))]}};
}}});
assert.equal(recovered.offers['ASIN-0'].status,'verified');assert.equal(recovered.offers['ASIN-2'].status,'verified');
assert.equal(recovered.offers['ASIN-1'].reason,'REQUEST_FAILED');assert.equal(recovered.offers['ASIN-1'].price,null);
const noListing=await refreshOffers({reviews:[offerReviews[0]],pause:noPause,client:{get:async()=>({itemsResult:{items:[{...itemFor(offerReviews[0]),offersV2:{listings:[]}}]}})}});
assert.equal(noListing.offers['ASIN-0'].price,null);

// Exercise the shipped display code against the same partial refresh. Include
// a poisoned old price to prove unavailable status overrides cached data.
const boxFor=asin=>({dataset:{amazonOffer:asin},fields:Object.fromEntries(['price','status','checked'].map(k=>[k,{textContent:'old value'}])),querySelector(selector){return this.fields[selector.match(/amazon-(\w+)/)[1]];}});
const offerBoxes=[boxFor('ASIN-0'),boxFor('ASIN-7')];
const displayContext={document:{querySelectorAll:()=>[],currentScript:{src:'https://example.com/assets/offers.js'}},URL,Date,Intl,setInterval(){},fetch:async()=>({ok:true,json:async()=>({offers:{...partial.offers,'ASIN-7':{...unavailable,price:999,priceDisplay:'$999.00'}}})})};
vm.runInNewContext(await readFile('public/assets/offers.js','utf8'),displayContext);
displayContext.document.querySelectorAll=()=>offerBoxes;
await displayContext.updateOffers();
assert.equal(offerBoxes[0].fields.price.textContent,'$199.00');
assert.equal(offerBoxes[1].fields.price.textContent,'Check Amazon price');
assert.match(offerBoxes[1].fields.status.textContent,/unavailable/);
assert.equal(unavailable.detailPageUrl,offerReviews[7].amazon.detailPageUrl);
console.log('Verified partial Amazon refresh, batch recovery, unavailable/mismatched price removal and browser fallback.');
await checkSeo({config,output,records});
