import assert from 'node:assert/strict';
import {access,readFile} from 'node:fs/promises';
import {articleRoute,articleFormats,articleGroups,articleWords,publishedArticles} from './articles.mjs';

export async function checkArticleRecords({articles,records,config,today}){
 const routes=new Set(),intents=new Set(),reviewRoutes=new Set(records.filter(r=>r.status==='published'&&r.published<=today).map(r=>`${r.brandSlug}/${r.modelSlug}/`));
 for(const a of articles){
  assert.ok(articleFormats[a.kind]);assert.match(a.slug,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);assert.ok(['published','draft'].includes(a.status));
  const route=articleRoute(a);assert.ok(!routes.has(route),'Duplicate article route');routes.add(route);
  if(a.status!=='published')continue;
  for(const field of ['title','dek','answer','scope','intentKey','evidenceNote','revisionNote'])assert.ok(typeof a[field]==='string'&&a[field].trim(),`${route}: ${field}`);
  assert.ok(!intents.has(a.intentKey),`${route}: overlapping article intent`);intents.add(a.intentKey);
  for(const [timestamp,date] of [['publishedAt','published'],['updatedAt','updated']]){
   assert.match(a[timestamp],/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/);const instant=new Date(a[timestamp]);assert.ok(Number.isFinite(instant.getTime()));
   assert.equal(new Intl.DateTimeFormat('en-CA',{timeZone:config.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(instant),a[date]);
  }
  assert.ok(new Date(a.updatedAt)>=new Date(a.publishedAt));assert.ok(a.seo?.title&&a.seo?.description);
  assert.ok(a.prerequisites.length&&a.sections.length>=3&&a.checklist?.items.length>=3&&a.reviewLinks.length&&a.faqs.length>=3);
  const words=articleWords(a);assert.ok(words>=(a.kind==='guide'?1200:1800),`${route}: substantive article depth (${words})`);
  assert.ok(!a.rating&&!a.amazon&&!a.sku,'Informational articles are not vehicle review records');
  assert.ok(a.sources.filter(s=>/manufacturer/i.test(s.kind)).length>=2);
  for(const source of a.sources){assert.equal(new URL(source.url).protocol,'https:');assert.match(source.checked,/^\d{4}-\d{2}-\d{2}$/);assert.ok(source.checked<=today);assert.ok(!/(^|\.)amazon\./.test(new URL(source.url).hostname),'Use internally linked verified reviews for buying context; article sources are citations');}
  const ids=new Set(['scope','checklist','related-reviews','faq','sources','quick-answer']);
  for(const section of a.sections){assert.match(section.id,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);assert.ok(!ids.has(section.id));ids.add(section.id);assert.ok(section.heading);assert.ok(section.paragraphs?.length||section.steps?.length);for(const text of [...(section.paragraphs??[]),...(section.steps??[]).flatMap(s=>s.paragraphs)])assert.ok(typeof text==='string'&&text.trim());for(const i of section.sourceIndexes??[])assert.ok(Number.isInteger(i)&&a.sources[i]);if(section.table)for(const row of section.table.rows)assert.equal(row.length,section.table.columns.length);}
  for(const f of a.faqs)assert.ok(f.question&&f.answer);
  for(const link of a.reviewLinks)assert.ok(reviewRoutes.has(link.route),`${route}: link to an actual published complete-vehicle review`);
  if(a.image){assert.ok(a.imageAlt&&a.imageCaption&&a.imageCredit?.name);assert.equal(new URL(a.imageCredit.url).protocol,'https:');await access('public/assets/'+a.image);}
 }
 // Guard publication eligibility independently of modified dates, and omit empty archives.
 const fixture=[{kind:'guide',slug:'old',status:'published',published:'2026-10-14',updated:'2026-10-15',publishedAt:'2026-10-14T12:00:00Z'},{kind:'guide',slug:'future',status:'published',published:'2026-10-16',publishedAt:'2026-10-16T12:00:00Z'},{kind:'guide',slug:'draft',status:'draft',published:'2026-10-15',publishedAt:'2026-10-15T12:00:00Z'},{kind:'guide',slug:'today',status:'published',published:'2026-10-15',publishedAt:'2026-10-15T12:00:00Z'}];
 const eligible=publishedArticles(fixture,'2026-10-15');assert.deepEqual(eligible.map(a=>a.slug),['today','old']);assert.equal(eligible.filter(a=>a.published==='2026-10-15').length,1);assert.deepEqual(articleGroups(eligible).map(g=>g.directory),['guides']);assert.deepEqual(articleGroups([]),[]);
 const visible=publishedArticles(articles,today),groups=articleGroups(visible);
 for(const group of groups){const html=await readFile(`docs/${group.directory}/index.html`,'utf8');for(const a of group.entries)assert.ok(html.includes(`href="${config.basePath}/${articleRoute(a)}"`));}
 for(const a of articles.filter(a=>!visible.includes(a))){await assert.rejects(access(`docs/${articleRoute(a)}index.html`));}
 return {articles:visible,groups};
}
