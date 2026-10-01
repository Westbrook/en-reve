import assert from 'node:assert/strict';
import { createServer, request } from 'node:http';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { chromium, firefox, webkit } from '@playwright/test';
import { build } from 'esbuild';
import { LifecycleReceipts } from '../src/lifecycle-receipt.mjs';
import { exclusiveBrowserWork } from '../src/lock.mjs';
const root=resolve(import.meta.dirname,'..'), output=resolve(process.env.EN_LIFECYCLE_TEST_OUTPUT??resolve(root,'.cache',`lifecycle-browser-${randomUUID()}`));
await mkdir(dirname(output),{recursive:true});
await mkdir(output,{recursive:false});
const records=[],transportErrors=[],receipt={schemaVersion:1,protocol:'ack-v1',kind:'delivery-qualification-not-performance-samples',startedAt:new Date().toISOString(),status:'running',records,transportErrors};
const started=performance.now();
try {await exclusiveBrowserWork(async()=>{
 const bundle=resolve(output,'collector.js');await build({entryPoints:[resolve(root,'src/collector.js')],outfile:bundle,bundle:true,format:'iife',platform:'browser',minify:true});
 const collector=await readFile(bundle,'utf8'), broker=new LifecycleReceipts(), plans=new Map();
 const partialReceived=Promise.withResolvers(),abortHandled=Promise.withResolvers();
 const server=createServer(async(req,res)=>{
  if(req.url==='/__perf/collect') {
   let body='';
   try {
    for await(const chunk of req){body+=chunk;if(req.headers['x-en-abort-control'])partialReceived.resolve();}
    const payload=JSON.parse(body), plan=plans.get(payload.documentId);
    if(plan) {
     plan.received.push(structuredClone(payload));
     const deliver=()=>{
      if(plan.mode==='missing')return;
      const sent=structuredClone(payload);
      if(plan.mode==='wrong-document')sent.documentId='unrelated-document';
      if(plan.mode==='incomplete')sent.terminal=false;
      plan.deliveries.push(broker.deliver(sent));
      if(plan.mode==='duplicate')plan.deliveries.push(broker.deliver(sent));
     };
     if(plan.mode==='delayed')setTimeout(deliver,150);else deliver();
    }
    res.writeHead(204).end();
   } catch(error) {
    const record={code:error.code??error.name,message:error.message,complete:req.complete,bodyBytes:Buffer.byteLength(body),control:Boolean(req.headers['x-en-abort-control'])};
    transportErrors.push(record);
    if(record.control)abortHandled.resolve(record);
    if(!res.destroyed)res.writeHead(400).end();
   }
  } else {
   res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'}).end('<!doctype html><html lang="en"><title>Lifecycle receipt fixture</title><h1>Receipt qualification</h1><button>Navigate after trusted input</button><script>document.querySelector("button").onclick=()=>{const end=performance.now()+60;while(performance.now()<end){};document.querySelector("h1").textContent="Input completed"}</script></html>');
  }
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${server.address().port}`;
 try {
  // A context can close while its destination document sends a beacon. A
  // partial upload must neither crash this server nor acknowledge a document.
  const partial=request(origin+'/__perf/collect',{method:'POST',headers:{'Content-Length':'1000','x-en-abort-control':'1'}});
  partial.on('error',()=>{});
  let timer;
  try {
   const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Aborted-upload control did not complete')),1000);});
   partial.write('{"documentId":"partial');
   await Promise.race([partialReceived.promise,deadline]);partial.destroy();
   const aborted=await Promise.race([abortHandled.promise,deadline]);
   assert.equal(aborted.code,'ECONNRESET');assert.equal(aborted.complete,false);assert(aborted.bodyBytes>0);assert.equal(broker.pending,0);
   receipt.abortedUploadControl={passed:true,...aborted};
  } finally {clearTimeout(timer);partial.destroy();}
  for(const [name,engine] of Object.entries({chromium,firefox,webkit})) {
   const browser=await engine.launch();
   try {
    for(const mode of ['normal','delayed','duplicate','wrong-document','missing','incomplete']) {
     const context=await browser.newContext();
     try {
      await context.addInitScript({content:`globalThis.__perfLifecycleProtocol="ack-v1";\n${collector}`});
      const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
      await page.goto(origin);await page.getByRole('button').click();
      await page.waitForFunction(()=>window.__perf && document.querySelector('h1')?.textContent==='Input completed');
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      const snapshot=await page.evaluate(()=>window.__perf.snapshot()),plan={mode,received:[],deliveries:[]};plans.set(snapshot.documentId,plan);
      const waiting=broker.expect(snapshot,1000),begin=performance.now();
      await page.goto(origin+'/away');
      if(['normal','delayed','duplicate'].includes(mode)) {
       const final=await waiting.promise;assert.equal(final.terminal,true);assert.equal(final.visibility,'hidden');assert.equal(final.documentId,snapshot.documentId);
       if(mode==='delayed')assert(performance.now()-begin>=150,'The acknowledgement must wait for actual delayed delivery.');
       assert.deepEqual(plan.deliveries,mode==='duplicate'?[true,false]:[true]);
      } else await assert.rejects(waiting.promise,/Missing valid lifecycle receipt/);
      assert.equal(plan.received.length,1,'Exactly one terminal payload after both lifecycle events');assert.equal(broker.pending,0);assert.deepEqual(errors,[]);
      records.push({browser:name,version:browser.version(),mode,passed:true,wallMs:performance.now()-begin,received:plan.received,deliveries:plan.deliveries});
     } finally {await context.close();}
    }
   } finally {await browser.close();}
  }
 } finally {await new Promise(resolve=>server.close(resolve));}
});receipt.status='passed';}
catch(error){receipt.status='failed';receipt.error=String(error.stack);process.exitCode=1;}
receipt.wallMs=performance.now()-started;receipt.finishedAt=new Date().toISOString();await writeFile(resolve(output,'receipt.json'),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({status:receipt.status,cases:records.length,output}));
