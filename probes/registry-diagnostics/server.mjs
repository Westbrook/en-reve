import {createServer} from 'node:http';import {readFile} from 'node:fs/promises';import {join,resolve} from 'node:path';import {pathToFileURL} from 'node:url';
const allowed=new Set(['index.html','api.js','disabled.js','ui.js','comparison.html','comparison.js','measurements.json']);
export async function startServer({output,port=0,runId}) {
 const server=createServer(async(req,res)=>{
  const name=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';
  if(name==='diagnostic-run.json'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({runId}));return;}
  if(!allowed.has(name)){res.writeHead(404).end();return;}
  try{res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.json')?'application/json':'text/html');res.end(await readFile(join(output,'site',name)));}catch{res.writeHead(404).end();}
 });
 await new Promise((ready,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',ready);});
 return {url:`http://127.0.0.1:${server.address().port}`,close:()=>new Promise((done,reject)=>server.close(e=>e?reject(e):done()))};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const {configuration}=await import('./config.mjs');const config=configuration();const marker=JSON.parse(await readFile(join(config.output,'.diagnostics-run.json'),'utf8'));const server=await startServer({...config,runId:marker.id});console.log(server.url);
}
