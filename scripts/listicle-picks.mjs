import assert from 'node:assert/strict';

export const pickWords=a=>(a.picks??[]).flatMap(p=>[p.fit,p.strength,p.reservation,p.included,p.required,p.startupNote]);

export function validateListiclePicks(a,records,today){
 if(!a.picks?.length)return;
 assert.equal(a.kind,'listicle','Vehicle picks belong to a listicle');
 assert.ok(a.selectionMethod?.trim(),'Listicle selection method required');
 assert.ok(a.picks.length>=2&&a.picks.length<=8,'Use a focused set of complete vehicles');
 const routes=new Set(),sections=new Set();
 for(const p of a.picks){
  assert.ok(!routes.has(p.route)&&!sections.has(p.sectionId),'Duplicate listicle pick');routes.add(p.route);sections.add(p.sectionId);
  const r=records.find(r=>`${r.brandSlug}/${r.modelSlug}/`===p.route&&r.status==='published'&&r.published<=today);
  assert.ok(r&&r.vehicleScope==='Complete RC car','Pick must identify a published complete vehicle');
  assert.equal(p.sku,r.sku,'Pick SKU must match the reviewed vehicle');assert.equal(p.title,`${r.brand} ${r.model}`,'Exact pick title');
  assert.ok(a.sections.some(s=>s.id===p.sectionId),'Pick needs a visible article section');
  assert.ok(a.reviewLinks.some(l=>l.route===p.route),'Pick needs a full-review link');
  for(const key of ['fit','strength','reservation','included','required','startupNote'])assert.ok(typeof p[key]==='string'&&p[key].trim(),`Pick ${key} required`);
  assert.ok(Number.isFinite(p.reference?.amount)&&p.reference.amount>0);assert.equal(p.reference.currency,'USD');
  assert.match(p.reference.checked,/^\d{4}-\d{2}-\d{2}$/);assert.ok(p.reference.checked<=today);assert.ok(p.reference.basis);
  const source=new URL(p.reference.source);assert.equal(source.protocol,'https:');assert.ok(!/(^|\.)amazon\./.test(source.hostname),'Static reference must not be an Amazon offer');
  assert.ok(a.sources.some(s=>s.url===p.reference.source),'Reference must cite an article source');
  assert.ok(r.amazon.verifiedAt&&r.amazon.asin,'Reuse an existing exact-product identity');
 }
}

export function listiclePickSchema(a,absolute){
 if(!a.picks?.length)return null;
 return {'@type':'ItemList','@id':absolute(`listicles/${a.slug}/#picks`),name:a.title,description:a.selectionMethod,itemListOrder:'https://schema.org/ItemListUnordered',numberOfItems:a.picks.length,itemListElement:a.picks.map((p,i)=>({'@type':'ListItem',position:i+1,name:p.title,identifier:p.sku,url:absolute(p.route)}))};
}

export function renderListiclePick(p,{reviews,href,esc,date,imageAttributes,heroImage}){
 if(!p)return '';
 const r=reviews.find(r=>`${r.brandSlug}/${r.modelSlug}/`===p.route);if(!r)throw Error('Missing complete-vehicle pick '+p.route);
 const photo=r.image===heroImage?'':`<figure class="guide-photo"><img src="${href('assets/'+r.image)}" alt="${esc(r.imageAlt)}" ${imageAttributes(r.image)} loading="lazy" decoding="async"><figcaption>${esc(r.imageCaption)} ${p.photoNote?esc(p.photoNote):''} <a href="${esc(r.imageCredit.url)}" target="_blank" rel="noopener noreferrer">${esc(r.imageCredit.name)} ↗</a></figcaption></figure>`;
 const amount=new Intl.NumberFormat('en-US',{style:'currency',currency:p.reference.currency}).format(p.reference.amount);
 return `<div class="listicle-pick" data-pick-sku="${esc(p.sku)}" data-pick-route="${esc(p.route)}"><p class="eyebrow">EXACT COMPLETE VEHICLE / ${esc(p.sku)}</p><h3>${esc(p.title)}</h3>${photo}<dl class="pick-facts">${[['Driving fit',p.fit],['Why it belongs',p.strength],['Main reservation',p.reservation],['Included',p.included],['Still needed',p.required]].map(([k,v])=>`<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl><p class="pick-reference"><strong>${amount} USD reference</strong> · ${esc(p.reference.basis)} · checked ${date(p.reference.checked)}. <a href="${esc(p.reference.source)}" target="_blank" rel="noopener noreferrer">Manufacturer reference ↗</a></p><p>${esc(p.startupNote)}</p><div class="pick-actions"><a class="text-link" href="${href(p.route)}">Read the full ${esc(r.model)} review ↗</a><a class="button" href="${esc(r.amazon.detailPageUrl)}" target="_blank" rel="nofollow sponsored noopener noreferrer">Check price on Amazon ↗</a></div><small class="pick-identity">${esc(r.amazon.variant)} · listing identity recorded ${date(r.amazon.verifiedAt.slice(0,10))}; current seller, price and availability can change.</small></div>`;
}
