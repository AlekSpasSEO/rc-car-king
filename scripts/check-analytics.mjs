import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=await readFile('public/assets/analytics.js','utf8');
function page(saved, {hostname='rccarking.com', blockedStorage=false}={}) {
 const appended=[], cookies=[], storage=new Map(saved?[['rcck-analytics-consent-v1',JSON.stringify(saved)]]:[]);
 const elements=[];
 const document={referrer:'https://example.com/article?email=private#secret',head:{append:e=>appended.push(e)},body:{append:e=>elements.push(e)},querySelector:()=>null,createElement(tag){const e={tag,dataset:{},handlers:{},setAttribute(){},addEventListener(type,fn){this.handlers[type]=fn;},querySelector(){return {focus(){}};},focus(){}};elements.push(e);return e;}};
 Object.defineProperty(document,'cookie',{get:()=> '_ga=test; _ga_8VSLEXNZTW=test; necessary=keep',set:v=>cookies.push(v)});
 const location={hostname,origin:`https://${hostname}`,pathname:'/review/',search:'?q=private',hash:'#secret'};
 const localStorage={getItem:k=>{if(blockedStorage)throw Error('Blocked');return storage.get(k)??null;},setItem:(k,v)=>{if(blockedStorage)throw Error('Blocked');storage.set(k,v);}};
 const window={};vm.runInNewContext(source,{document,window,location,localStorage,URL,Date});
 const panel=elements.find(e=>e.className==='analytics-consent');
 return {window,panel,appended,cookies,storage,choose(value){panel.handlers.click({target:{closest:()=>({dataset:{choice:value}})}});}};
}
const fresh=page();assert.equal(fresh.appended.length,0);assert.equal(fresh.panel.hidden,false);
fresh.choose('denied');assert.equal(fresh.appended.length,0);assert.equal(fresh.window['ga-disable-G-8VSLEXNZTW'],true);
fresh.choose('granted');assert.equal(fresh.appended.length,1);assert.match(fresh.appended[0].src,/G-8VSLEXNZTW$/);
const config=fresh.window.dataLayer.find(args=>args[0]==='config')[2];assert.equal(config.page_location,'https://rccarking.com/review/');assert.equal(config.page_referrer,'https://example.com/article');
fresh.choose('granted');assert.equal(fresh.appended.length,1,'No duplicate tags');
fresh.choose('denied');assert.equal(fresh.window['ga-disable-G-8VSLEXNZTW'],true);assert.ok(fresh.cookies.some(v=>v.startsWith('_ga=')));assert.ok(fresh.cookies.every(v=>!v.startsWith('necessary=')));
assert.equal(page({value:'granted',time:Date.now()}).appended.length,1);
assert.equal(page({value:'denied',time:Date.now()}).appended.length,0);
assert.equal(page({value:'granted',time:0}).appended.length,0,'Expired consent must not load Google');
const blocked=page(null,{blockedStorage:true});blocked.choose('granted');assert.equal(blocked.appended.length,1,'Consent works without local storage');
assert.equal(page(null,{hostname:'alekspasseo.github.io'}).appended.length,0);
console.log('Analytics consent checked: default, accept, reject, revoke, persisted/expired choices, blocked storage, query stripping and preview exclusion.');
