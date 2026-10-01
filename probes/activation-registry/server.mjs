import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
export function serve(port=4210){
 const root=resolve(process.env.EN_ACTIVATION_OUT??'artifacts/scoped-registry-phase-4/activation-packed');
 const server=createServer(async(req,res)=>{
  try{
   const path=new URL(req.url,'http://localhost').pathname,name=path==='/'?'index.html':path.slice(1);
   if(!['index.html','fixture.js'].includes(name)){res.writeHead(404).end();return;}
   res.setHeader('Content-Type',name.endsWith('.js')?'application/javascript':'text/html');
   res.end(await readFile(resolve(root,name)));
  }catch{res.writeHead(500).end();}
 });
 return new Promise((yes,no)=>{server.once('error',no);server.listen(port,'127.0.0.1',()=>yes(server));});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const server=await serve();
 console.log(`Activation fixture ready: http://127.0.0.1:${server.address().port}`);
 for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
}
