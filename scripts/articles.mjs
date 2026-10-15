import {readFile,readdir} from 'node:fs/promises';

export const articleFormats={
 guide:{directory:'guides',label:'Guides',singular:'Guide',title:'RC Car Guides: Setup, Controls & Ownership | RC Car King',description:'Practical RC car guides with model-specific setup advice, clear explanations, troubleshooting and checklists, backed by dated manufacturer sources.'},
 listicle:{directory:'listicles',label:'Listicles',singular:'Listicle',title:'RC Car Lists & Buying Shortlists | RC Car King',description:'Focused RC car shortlists and useful numbered articles, with clear selection criteria, exact vehicle packages, required equipment and dated sources.'}
};
export const articleRoute=a=>`${articleFormats[a.kind].directory}/${a.slug}/`;
export const articleWords=a=>[a.answer,a.scope,...a.sections.flatMap(s=>[...(s.paragraphs??[]),...(s.steps??[]).flatMap(step=>step.paragraphs)])].join(' ').trim().split(/\s+/).length;
export const publishedArticles=(records,today)=>records.filter(a=>a.status==='published'&&a.published<=today).sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt));
export const articleGroups=articles=>Object.entries(articleFormats).map(([kind,format])=>({kind,...format,entries:articles.filter(a=>a.kind===kind)})).filter(g=>g.entries.length);
export async function loadArticles(directory='content/articles'){
 let files;try{files=await readdir(directory);}catch(error){if(error.code==='ENOENT')return [];throw error;}
 return Promise.all(files.filter(f=>f.endsWith('.json')).map(async file=>JSON.parse(await readFile(`${directory}/${file}`,'utf8'))));
}
