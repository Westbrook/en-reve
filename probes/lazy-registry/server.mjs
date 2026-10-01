import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
export function serve(port=4201) {
 const root=resolve(import.meta.dirname,'../..',process.env.EN_LAZY_OUT ?? 'artifacts/scoped-registry-phase-3/packed');
 const server=createServer(async(req,res)=>{
  try {const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!path.startsWith(root+'/'))throw Error('path');
   const bytes=await readFile(path);res.writeHead(200,{'content-type':({'.js':'text/javascript','.html':'text/html','.json':'application/json'})[extname(path)]??'application/octet-stream','cache-control':'no-store'});res.end(bytes);
  }catch{res.writeHead(404);res.end('Not found');}
 });return new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',()=>resolve(server));});
}
if(process.argv[1]===new URL(import.meta.url).pathname)await serve();
