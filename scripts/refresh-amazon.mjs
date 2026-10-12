import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {createAmazonClient,matchesVehicle} from './amazon-client.mjs';
const i=process.argv.indexOf('--credentials');const credentialsPath=i>=0?process.argv[i+1]:null;
const records=await Promise.all((await readdir('content/reviews')).filter(f=>f.endsWith('.json')).map(async f=>JSON.parse(await readFile(`content/reviews/${f}`,'utf8'))));
const eligible=records.filter(r=>r.status==='published'&&r.amazon);
if(!eligible.length){console.log('No published Amazon-linked vehicles.');process.exit(0);}
const tags=new Set(eligible.map(r=>r.amazon.partnerTag));if(tags.size!==1)throw Error('Refresh expects one account tag; split marketplaces explicitly before adding another.');
const client=await createAmazonClient({credentialsPath,partnerTag:eligible[0].amazon.partnerTag});
const items=[];const asins=[...new Set(eligible.map(r=>r.amazon.asin))];
for(let start=0;start<asins.length;start+=10){
 if(start)await new Promise(resolve=>setTimeout(resolve,1200));
 const result=await client.get(asins.slice(start,start+10));items.push(...(result.itemsResult?.items??[]));
}
const checkedAt=new Date().toISOString();const offers={};
for(const review of eligible){
 const item=items.find(i=>i.asin===review.amazon.asin);
 if(!item||!matchesVehicle(item,review))throw Error(`Amazon product identity mismatch or missing item for ${review.brand} ${review.sku}; retained previous offer snapshot.`);
 const listing=item.offersV2?.listings?.find(l=>l.isBuyBoxWinner)??item.offersV2?.listings?.[0];
 const price=listing?.price?.money;
 offers[item.asin]={asin:item.asin,sku:review.sku,brand:review.brand,variant:review.amazon.variant,checkedAt,price:price?.amount??null,currency:price?.currency??null,priceDisplay:price?.displayAmount??null,availability:listing?.availability?.type?.startsWith('IN_STOCK')?'IN_STOCK':'UNKNOWN',seller:listing?.merchantInfo?.name??null,detailPageUrl:item.detailPageURL};
}
await mkdir('public/data',{recursive:true});
await writeFile('public/data/amazon-offers.json',JSON.stringify({schemaVersion:1,provider:'Amazon Creators API',marketplace:'www.amazon.com',checkedAt,maxAgeHours:24,offers},null,2)+'\n');
console.log(`Refreshed ${Object.keys(offers).length} SKU-verified complete-car offers. Credentials stayed in memory.`);
