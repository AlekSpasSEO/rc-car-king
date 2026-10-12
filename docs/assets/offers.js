const freshnessMs=24*60*60*1000;
function isFresh(offer,now=Date.now()) {const checked=Date.parse(offer?.checkedAt);return Number.isFinite(checked)&&now>=checked&&now-checked<freshnessMs;}
async function updateOffers(){
 const boxes=[...document.querySelectorAll('[data-amazon-offer]')];if(!boxes.length)return;
 try{
  const source=new URL('../data/amazon-offers.json',document.currentScript?.src??[...document.scripts].find(s=>s.src.endsWith('/offers.js')).src);
  const response=await fetch(source,{cache:'no-store'});if(!response.ok)return;
  const {offers}=await response.json();
  function paint(){
   for(const box of boxes){
    const offer=offers[box.dataset.amazonOffer];
    const price=box.querySelector('[data-amazon-price]');
    const status=box.querySelector('[data-amazon-status]');
    const checked=box.querySelector('[data-amazon-checked]');
    if(!offer||!isFresh(offer)){price.textContent='Check Amazon price';status.textContent='Verified complete-car listing · current price on Amazon';checked.textContent='Price and availability are shown live by Amazon.';continue;}
    price.textContent=offer.priceDisplay??'Check Amazon price';
    status.textContent=[offer.availability==='IN_STOCK'?'Available at last check':'Check availability',offer.seller?`Seller: ${offer.seller}`:''].filter(Boolean).join(' · ');
    checked.textContent=`API checked ${new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Skopje',timeZoneName:'short'}).format(new Date(offer.checkedAt))}. Price and availability can change.`;
   }
  }
  paint();setInterval(paint,60000);
 }catch{/* The verified exact-product link works without a current offer snapshot. */}
}
updateOffers();
