import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {pathToFileURL} from 'node:url';
const root=resolve('artifacts/scoped-registry-phase-5-form-review/site');
const away=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>History destination</title><style>body{font:18px/1.6 system-ui;max-width:45rem;margin:3rem auto;padding:1rem;background:#f7faf7;color:#23372f}button{font:inherit;padding:.5rem 1rem}</style><h1>Return with the browser’s Back command</h1><p>This is a separate document. Use Back to return to the form, then inspect the return-path diagnostic and values. Do not reload or open a fresh copy for this step.</p><button onclick="history.back()">Go Back</button><a id="report-return" href="http://127.0.0.1:4177" hidden>Progress Report</a><script>if(new URLSearchParams(location.search).has('progress-report'))document.querySelector('#report-return').hidden=false;</script></html>`;
export async function serve(port=4233) {
 const server=createServer(async(req,res)=>{
  // Never parse, persist, log or reflect submitted field values.
  if(req.method!=='GET'&&req.method!=='HEAD'){req.resume();res.writeHead(405,{'content-type':'text/plain','allow':'GET, HEAD'}).end('Submissions disabled. Enable JavaScript for a local form check.');return;}
  try {
   const url=new URL(req.url,'http://localhost'),path=url.pathname==='/'?'/shadow.html':decodeURIComponent(url.pathname);
   let body,type='text/html; charset=utf-8';
   if(path==='/away')body=away;
   else {const file=resolve(root,'.'+path);if(!file.startsWith(root+'/'))throw Error('Invalid path');body=await readFile(file);if(extname(file)==='.js')type='text/javascript';}
   res.writeHead(200,{'content-type':type,'cache-control':'private, no-cache'}).end(req.method==='HEAD'?undefined:body);
  } catch {res.writeHead(404,{'content-type':'text/plain'}).end('Not found');}
 });
 await new Promise((ok,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',ok);});
 return {url:`http://127.0.0.1:${server.address().port}`,close:()=>new Promise(resolve=>server.close(resolve))};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){const server=await serve();console.log(`${server.url}/?progress-report`);}
