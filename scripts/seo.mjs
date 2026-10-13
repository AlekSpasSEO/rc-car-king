import {readFile} from 'node:fs/promises';
import {overallRating} from './review-template.mjs';

export function dimensions(bytes){
 if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return {width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20)};
 if(bytes[0]===255&&bytes[1]===216){
  let pos=2;
  while(pos+8<bytes.length){
   if(bytes[pos++]!==255)continue;
   while(bytes[pos]===255)pos++;
   const marker=bytes[pos++];
   if(marker===217||marker===218)break;
   if(marker===1||(marker>=208&&marker<=215))continue;
   const length=bytes.readUInt16BE(pos);
   if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker))return {width:bytes.readUInt16BE(pos+5),height:bytes.readUInt16BE(pos+3)};
   if(length<2)break;pos+=length;
  }
 }
 return null;
}

export async function createSeo({config,origin,base,reviews,site}){
 const absolute=p=>/^https:\/\//i.test(p)?p:`${origin}${base}/${p}`;
 const route=r=>`${r.brandSlug}/${r.modelSlug}/`;
 const sizes=new Map();
 const assets=[...new Set(['night-drift.png',...reviews.flatMap(r=>[r.image,...r.gallery.map(g=>g.image)])])];
 await Promise.all(assets.map(async asset=>{if(!/^https:\/\//.test(asset))sizes.set(asset,dimensions(await readFile(`public/assets/${asset}`)));}));
 const imageAttributes=asset=>{const size=sizes.get(asset);return size?`width="${size.width}" height="${size.height}"`:'';};
 const image=(asset,caption)=>({'@type':'ImageObject',url:absolute(/^https:\/\//.test(asset)?asset:`assets/${asset}`),...(sizes.get(asset)??{}),...(caption?{caption}:{} )});
 const org={'@type':'Organization','@id':absolute('#organization'),name:site.publisher,url:absolute(''),logo:{'@type':'ImageObject',url:absolute('assets/publisher-logo.svg'),width:512,height:512},founder:{'@id':absolute('about/#aleksandar-spasevski')}};
 const founder={'@type':'Person','@id':absolute('about/#aleksandar-spasevski'),name:site.founder.name,url:absolute('about/#aleksandar-spasevski'),jobTitle:site.founder.role,description:site.founder.bio,sameAs:[site.founder.source]};
 const editorial={'@type':'Organization','@id':absolute('about/#garage-editor'),name:site.editorialName,alternateName:site.editorialVoice,url:absolute('about/#garage-editor'),parentOrganization:{'@id':org['@id']}};
 const website={'@type':'WebSite','@id':absolute('#website'),name:config.name,url:absolute(''),description:'Research-led RC car reviews covering specifications, setup, terrain, ownership costs and exact complete-vehicle packages.',inLanguage:'en',publisher:{'@id':org['@id']}};
 const shared=()=>[org,founder,editorial,website];
 const breadcrumb=(p,items)=>({'@type':'BreadcrumbList','@id':absolute(p+'#breadcrumbs'),itemListElement:items.map(([name,url],i)=>({'@type':'ListItem',position:i+1,name,item:absolute(url)}))});
 const graph=nodes=>({'@context':'https://schema.org','@graph':[...shared(),...nodes]});
 function collection(p,title,description,entries){
  const list={'@type':'ItemList','@id':absolute(p+'#reviews'),numberOfItems:entries.length,itemListElement:entries.map((r,i)=>({'@type':'ListItem',position:i+1,url:absolute(route(r)),name:`${r.brand} ${r.model} review`}))};
  const crumbs=breadcrumb(p,p?[['Reviews',''],[title,p]]:[['Reviews','']]);
  return graph([{'@type':'CollectionPage','@id':absolute(p+'#webpage'),url:absolute(p),name:title,description,isPartOf:{'@id':website['@id']},mainEntity:{'@id':list['@id']},breadcrumb:{'@id':crumbs['@id']},inLanguage:'en'},list,crumbs]);
 }
 function review(r){
  const p=route(r),url=absolute(p),author={'@type':'Organization','@id':editorial['@id'],name:site.editorialName,url:editorial.url};
  const images=[image(r.image,r.imageCaption),...r.gallery.map(g=>image(g.image,g.caption))];
  const notes=values=>({'@type':'ItemList',itemListElement:values.map((name,i)=>({'@type':'ListItem',position:i+1,name}))});
  const review={'@type':'Review','@id':url+'#review',name:r.title,author,publisher:{'@id':org['@id']},datePublished:r.published,dateModified:r.updated,inLanguage:'en',reviewBody:r.verdictText,reviewRating:{'@type':'Rating',ratingValue:overallRating(r),bestRating:10,worstRating:1},positiveNotes:notes(r.pros),negativeNotes:notes(r.cons)};
  const product={'@type':'Product','@id':url+'#product',name:`${r.brand} ${r.model}`,description:r.overview,sku:r.sku,mpn:r.sku,model:r.model,brand:{'@type':'Brand',name:r.brand},image:images,identifier:{'@type':'PropertyValue',name:'ASIN',value:r.amazon.asin},additionalProperty:r.specs.map(([name,value])=>({'@type':'PropertyValue',name,value})),review};
  const crumbs=breadcrumb(p,[['Reviews',''],[r.brand,r.brandSlug+'/'],[`${r.model} review`,p]]);
  const faq={'@type':'FAQPage','@id':url+'#faq',isPartOf:{'@id':url+'#webpage'},mainEntity:r.faqs.map(f=>({'@type':'Question',name:f.question,acceptedAnswer:{'@type':'Answer',text:f.answer}}))};
  const article={'@type':'Article','@id':url+'#article',headline:`${r.brand} ${r.model} review`,description:r.seo.description,abstract:r.overview,datePublished:r.published,dateModified:r.updated,author,publisher:{'@id':org['@id']},mainEntityOfPage:{'@id':url+'#webpage'},about:{'@id':product['@id']},image:images,articleSection:'RC car reviews',inLanguage:'en',isAccessibleForFree:true,citation:[...new Set(r.sources.map(s=>s.url))],wordCount:r.sections.flatMap(s=>s.paragraphs).join(' ').trim().split(/\s+/).length};
  return graph([{'@type':'WebPage','@id':url+'#webpage',url,name:r.seo.title,description:r.seo.description,isPartOf:{'@id':website['@id']},mainEntity:{'@id':article['@id']},primaryImageOfPage:images[0],breadcrumb:{'@id':crumbs['@id']},hasPart:{'@id':faq['@id']},inLanguage:'en'},article,product,crumbs,faq]);
 }
 function information(p,title,description,type='WebPage'){
  const crumbs=breadcrumb(p,[['Reviews',''],[title,p]]);
  return graph([{'@type':type,'@id':absolute(p+'#webpage'),url:absolute(p),name:title,description,isPartOf:{'@id':website['@id']},publisher:{'@id':org['@id']},...(type==='AboutPage'?{mainEntity:{'@id':org['@id']},about:{'@id':founder['@id']}}:{}),dateModified:site.updated,inLanguage:'en',breadcrumb:{'@id':crumbs['@id']}},crumbs]);
 }
 return {collection,review,information,imageAttributes,images:sizes,site,absolute};
}
