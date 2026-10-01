import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
const root=resolve('artifacts/scoped-registry-phase-5/production/cold/site');
const files=new URL('./',import.meta.url);
const returnLink='<a id="review-report-return" href="http://127.0.0.1:4177" style="position:fixed;bottom:12px;right:12px;background:white;padding:8px;border:1px solid">Progress Report</a>';
const header='<meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{font:17px system-ui;max-width:65rem;margin:2rem;color:#23372f;background:#f7faf7}button,input,a{font:inherit}button,input{padding:.6rem;margin:.3rem}label{display:block}dialog{max-width:32rem}dialog::backdrop{background:#0006}</style>';
const server=createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://127.0.0.1:4232');
 const policy=url.searchParams.get('cache')==='no-store'?'no-store':'private, no-cache';
 let body,type='text/html; charset=utf-8';
 if(url.pathname==='/away')body=`<!doctype html><html lang="en">${header}<title>History test destination</title><h1>History test destination</h1><p>Use your browser’s Back command to return to the draft. Do not reload or submit the form.</p>${url.searchParams.has('progress-report')?returnLink:''}</html>`;
 else if(url.pathname==='/native')body=`<!doctype html><html lang="en">${header}<title>Native dialog control</title><h1>Native dialog control</h1><p>This page uses a native dialog and input, without Lit, custom elements, shadow DOM or hydration.</p><button id="native-open" aria-haspopup="dialog">Open native dialog</button><p id="native-status" role="status"></p><dialog aria-labelledby="native-heading"><h2 id="native-heading">Native test dialog</h2><label>Native search<input autofocus></label><form method="dialog"><button>Close</button></form></dialog><script type="module">const button=document.querySelector('#native-open'),status=document.querySelector('#native-status'),dialog=document.querySelector('dialog');button.addEventListener('click',async()=>{button.focus();status.textContent='Loading native dialog…';await new Promise(r=>setTimeout(r,1500));status.textContent='';dialog.showModal();});</script>${url.searchParams.has('progress-report')?returnLink:''}</html>`;
 else if(url.pathname==='/review.js'){body=await readFile(new URL('review.mjs',files));type='text/javascript';}
 else {
  const file=resolve(root,'.'+(url.pathname==='/'?'/index.html':url.pathname));
  if(!file.startsWith(root+'/'))throw Error('Invalid path');
  body=await readFile(file);type=extname(file)==='.js'?'text/javascript':'text/html; charset=utf-8';
  if(url.pathname==='/'||url.pathname==='/index.html'){
   const text=body.toString();const match=text.match(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/);
   if(!match)throw Error('Missing production entry');
   // Chain review code after the original Vite entry evaluates; do not rewrite frozen assets.
   body=text.replace(match[0],`<script type="module">import ${JSON.stringify(match[1])};import '/review.js';</script>`);
  }
 }
 res.writeHead(200,{'content-type':type,'cache-control':policy});res.end(body);
 }catch(error){res.writeHead(404).end('Not found');}});
server.listen(4232,'127.0.0.1',()=>console.log('Phase 5 diagnostic review: http://127.0.0.1:4232/?delay&progress-report'));
