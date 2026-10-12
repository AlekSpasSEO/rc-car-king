import {readFile} from 'node:fs/promises';
export const resources=['itemInfo.title','itemInfo.byLineInfo','itemInfo.features','itemInfo.manufactureInfo','itemInfo.productInfo','images.primary.large','images.variants.large','offersV2.listings.price','offersV2.listings.availability','offersV2.listings.merchantInfo','offersV2.listings.isBuyBoxWinner'];
function csvRow(line){let cell='',quoted=false;const row=[];for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(quoted&&line[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(cell);cell='';}else cell+=c;}row.push(cell);return row;}
export async function createAmazonClient({credentialsPath,partnerTag='coffeedant03-20',marketplace='www.amazon.com'}={}){
 let credentials={};
 if(credentialsPath){const lines=(await readFile(credentialsPath,'utf8')).replace(/^\uFEFF/,'').split(/\r?\n/).filter(Boolean);if(lines.length<2)throw Error('Credential CSV has no data row');const values=csvRow(lines[1]);credentials=Object.fromEntries(csvRow(lines[0]).map((h,i)=>[h,values[i]]));}
 const id=process.env.AMAZON_CREATORS_CREDENTIAL_ID||credentials['Credential Id'];
 const secret=process.env.AMAZON_CREATORS_CREDENTIAL_SECRET||credentials.Secret;
 const version=process.env.AMAZON_CREATORS_CREDENTIAL_VERSION||credentials.Version;
 if(!id||!secret||!version)throw Error('Missing Amazon API credentials. Set AMAZON_CREATORS_* variables or use --credentials with a local CSV. Never commit credentials.');
 const tokenEndpoint=version.startsWith('3.2')?'https://api.amazon.co.uk/auth/o2/token':version.startsWith('3.3')?'https://api.amazon.co.jp/auth/o2/token':'https://api.amazon.com/auth/o2/token';
 const auth=await fetch(tokenEndpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({grant_type:'client_credentials',client_id:id,client_secret:secret,scope:'creatorsapi::default'}),signal:AbortSignal.timeout(20000)});
 if(!auth.ok)throw Error(`Amazon authentication HTTP ${auth.status}`);
 const {access_token}=await auth.json();if(!access_token)throw Error('No Amazon access token returned');
 async function request(operation,body){
  for(let attempt=0;attempt<4;attempt++){
   const response=await fetch(`https://creatorsapi.amazon/catalog/v1/${operation}`,{method:'POST',headers:{authorization:`Bearer ${access_token}`,'content-type':'application/json','x-marketplace':marketplace},body:JSON.stringify({marketplace,partnerTag:process.env.AMAZON_ASSOCIATE_TAG||partnerTag,condition:'New',resources,...body}),signal:AbortSignal.timeout(25000)});
   if(response.ok)return response.json();
   if(response.status!==429||attempt===3)throw Error(`Amazon ${operation} HTTP ${response.status}`);
   await new Promise(resolve=>setTimeout(resolve,1500*2**attempt));
  }
 }
 return {search:keywords=>request('searchItems',{keywords,itemCount:10,searchIndex:'All'}),get:itemIds=>request('getItems',{itemIds,itemIdType:'ASIN'})};
}
export function normalizeItem(item){return {asin:item.asin,title:item.itemInfo?.title?.displayValue,brand:item.itemInfo?.byLineInfo?.brand?.displayValue,model:item.itemInfo?.manufactureInfo,features:item.itemInfo?.features?.displayValues??[],detailPageUrl:item.detailPageURL,primaryImage:item.images?.primary?.large,variantImages:item.images?.variants?.map(x=>x.large)??[],listings:item.offersV2?.listings??[]};}
export function matchesVehicle(item,review){
 const sku=item.itemInfo?.manufactureInfo?.itemPartNumber?.displayValue;
 const brand=item.itemInfo?.byLineInfo?.brand?.displayValue;
 return item.asin===review.amazon.asin && sku===review.sku && brand?.toLowerCase()===review.brand.toLowerCase();
}
