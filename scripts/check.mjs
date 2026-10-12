import assert from 'node:assert/strict';
import {readFile,readdir,access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
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
 if(!r.handsOn) assert.match(r.reviewType,/specification/i);
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
