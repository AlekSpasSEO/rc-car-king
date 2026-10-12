import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
const {basePath} = JSON.parse(await readFile('site.config.json','utf8'));
const root=path.resolve('docs');
const port=Number(process.env.PORT || 4318);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.png':'image/png','.svg':'image/svg+xml','.xml':'application/xml','.txt':'text/plain'};
const server=createServer(async(req,res)=>{
 try {
  let url=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(url===basePath) {res.writeHead(302,{Location:basePath+'/'});res.end();return;}
  if(basePath && url.startsWith(basePath+'/')) url=url.slice(basePath.length);
  let file=path.resolve(root,'.'+url);
  if(!file.startsWith(root+path.sep) && file!==root) throw Error('Invalid path');
  if((await stat(file)).isDirectory()) file=path.join(file,'index.html');
  const data=await readFile(file);
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(data);
 } catch {res.writeHead(404,{'Content-Type':'text/html'});res.end(await readFile(path.join(root,'404.html')));}
});
server.listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}${basePath}/`));
