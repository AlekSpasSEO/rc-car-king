import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {createAmazonClient} from './amazon-client.mjs';
import {refreshOffers} from './amazon-offers.mjs';
const i=process.argv.indexOf('--credentials');const credentialsPath=i>=0?process.argv[i+1]:null;
const records=await Promise.all((await readdir('content/reviews')).filter(f=>f.endsWith('.json')).map(async f=>JSON.parse(await readFile(`content/reviews/${f}`,'utf8'))));
const eligible=records.filter(r=>r.status==='published'&&r.amazon);
if(!eligible.length){console.log('No published Amazon-linked vehicles.');process.exit(0);}
const tags=new Set(eligible.map(r=>r.amazon.partnerTag));if(tags.size!==1)throw Error('Refresh expects one account tag; split marketplaces explicitly before adding another.');
const client=await createAmazonClient({credentialsPath,partnerTag:eligible[0].amazon.partnerTag});
const snapshot=await refreshOffers({reviews:eligible,client});
await mkdir('public/data',{recursive:true});
await writeFile('public/data/amazon-offers.json',JSON.stringify(snapshot,null,2)+'\n');
const unavailable=Object.values(snapshot.offers).filter(o=>o.status==='unavailable');
console.log(`Refreshed ${eligible.length-unavailable.length} SKU-verified complete-car offers; ${unavailable.length} unavailable listings retain verified links with prices hidden. Credentials stayed in memory.`);
for(const offer of unavailable)console.log(`${offer.brand} ${offer.sku}: ${offer.reason}.`);
