import { createServer } from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';

/** Fresh pages first, immutable historical report assets as a read-only fallback. */
export async function startOwnedReport({directory,fallback}) {
 const roots=[await realpath(directory),await realpath(fallback)];
 const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2'};
 const server=createServer(async(request,response)=>{
  if(!['GET','HEAD'].includes(request.method)){response.writeHead(405).end();return;}
  try{
   const pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname);
   for(const base of roots){
    const file=resolve(base,'.'+pathname);
    if(!file.startsWith(base+sep)){response.writeHead(403).end();return;}
    try{
     const actual=await realpath(file);
     if(!actual.startsWith(base+sep)){response.writeHead(403).end();return;}
     const bytes=await readFile(actual);
     response.writeHead(200,{'Content-Type':mime[extname(file)]??'application/octet-stream','Cache-Control':'no-store'});
     response.end(request.method==='HEAD'?undefined:bytes);return;
    }catch(error){if(error.code!=='ENOENT')throw error;}
   }
   response.writeHead(404).end();
  }catch{response.writeHead(400).end();}
 });
 await new Promise((yes,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',yes);});
 return {url:`http://127.0.0.1:${server.address().port}`,close:()=>new Promise((yes,no)=>server.close(error=>error?no(error):yes()))};
}
