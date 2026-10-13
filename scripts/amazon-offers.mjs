import {matchesVehicle} from './amazon-client.mjs';

// Start every refresh without old commercial data. Failed identities keep only
// the affiliate URL already verified in the review's evidence record.
export async function refreshOffers({reviews,client,checkedAt=new Date().toISOString(),pause=ms=>new Promise(resolve=>setTimeout(resolve,ms))}){
 const items=new Map(),failedRequests=new Set();
 const asins=[...new Set(reviews.map(r=>r.amazon.asin))];
 function collect(result){for(const item of result.itemsResult?.items??[])items.set(item.asin,item);}
 for(let start=0;start<asins.length;start+=10){
  if(start)await pause(1200);
  const batch=asins.slice(start,start+10);
  try{collect(await client.get(batch));}
  catch{
   // A rejected batch must not discard valid neighbors. Retry its members
   // independently; successful batches already isolate missing-item responses.
   for(const asin of batch){
    await pause(1200);
    try{collect(await client.get([asin]));}catch{failedRequests.add(asin);}
   }
  }
 }
 const offers={};
 for(const review of reviews){
  const asin=review.amazon.asin,item=items.get(asin);
  const offer={asin,sku:review.sku,brand:review.brand,variant:review.amazon.variant,checkedAt,status:'unavailable',reason:null,price:null,currency:null,priceDisplay:null,availability:'UNKNOWN',seller:null,detailPageUrl:review.amazon.detailPageUrl};
  if(!item)offer.reason=failedRequests.has(asin)?'REQUEST_FAILED':'ITEM_UNAVAILABLE';
  else if(!matchesVehicle(item,review))offer.reason='IDENTITY_MISMATCH';
  else{
   offer.status='verified';
   const listing=item.offersV2?.listings?.find(l=>l.isBuyBoxWinner)??item.offersV2?.listings?.[0];
   const price=listing?.price?.money;
   if(Number.isFinite(price?.amount)&&price.amount>0&&price.currency&&price.displayAmount){
    offer.price=price.amount;offer.currency=price.currency;offer.priceDisplay=price.displayAmount;
   }
   offer.availability=listing?.availability?.type?.startsWith('IN_STOCK')?'IN_STOCK':'UNKNOWN';
   offer.seller=listing?.merchantInfo?.name??null;
  }
  offers[asin]=offer;
 }
 return {schemaVersion:1,provider:'Amazon Creators API',marketplace:'www.amazon.com',checkedAt,maxAgeHours:24,offers};
}
