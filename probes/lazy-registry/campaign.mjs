import {chromium,firefox,webkit} from '@playwright/test';
import {mkdir,readFile,writeFile,appendFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {serve} from './server.mjs';
import {exclusiveBrowserWork} from '../../showcases/performance/src/lock.mjs';
import {rng,shuffle,sha,json} from '../../showcases/performance/src/config.mjs';
const qualify=process.argv.includes('--qualify');
const out=resolve(process.env.EN_LAZY_CAMPAIGN_OUT ?? resolve('artifacts/scoped-registry-phase-3',qualify?'lazy-qualification':'lazy-campaign'));
await mkdir(out,{recursive:true});await writeFile(resolve(out,'started.json'),json({at:new Date().toISOString(),qualify}),{flag:'wx'});
const packed=resolve(process.env.EN_LAZY_OUT ?? 'artifacts/scoped-registry-phase-3/packed');
const receipt=JSON.parse(await readFile(resolve(packed,'receipt.json')));
const cells=[];
for(const browser of ['chromium','webkit','firefox'])for(const mode of ['auto','global'])for(const delivery of ['csr','ssr'])for(const arm of ['eager','lazy'])cells.push({browser,mode,delivery,arm,profile:'desktop',kind:'timing'});
for(const mode of ['auto','global'])for(const arm of ['eager','lazy'])cells.push({browser:'chromium',mode,delivery:'csr',arm,profile:'constrained',kind:'timing'});
const random=rng(20260927),jobs=[];
for(let block=0;block<(qualify?1:30);block++)for(const cell of shuffle(cells,random))jobs.push({...cell,block});
const retention=[];for(const mode of ['auto','global'])for(const arm of ['eager','lazy'])retention.push({browser:'chromium',mode,arm,delivery:'csr',profile:'desktop',kind:'retention'});
for(let block=0;block<(qualify?1:5);block++)for(const cell of shuffle(retention,random))jobs.push({...cell,block});
const manifest={createdAt:new Date().toISOString(),qualify,jobs,receiptSha256:sha(await readFile(resolve(packed,'receipt.json'))),fixtureHashes:receipt.hashes,baseCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),host:{cpu:os.cpus()[0].model,platform:os.platform(),release:os.release(),node:process.version},methodology:'Serial fresh browser and cold context per sample; randomized complete paired blocks, seed 20260927. 30 successful timing samples per configuration; 5 separate retention repeats with forced GC checkpoints. Desktop loopback with no throttling; constrained Chromium CDP CPU 4x, 150ms network latency, 1.6Mbps download / 750Kbps upload. Uncompressed HTTP and emitted JS bytes, not gzip/field or physical-device measurements. First-use time includes import, registration, render readiness and one frame opportunity. Module-evaluated time includes navigation, network, parse and evaluation; not isolated parse time. SSR prerendering excluded. Retention cycles open and dispose the full real settings workflow.'};
await writeFile(resolve(out,'manifest.json'),json(manifest));
await exclusiveBrowserWork(async()=>{
 const server=await serve(0),origin=`http://127.0.0.1:${server.address().port}`;
 try{
  for(const [index,job] of jobs.entries()){
   const browser=await ({chromium,firefox,webkit})[job.browser].launch();let context;
   const errors=[];
   try{
    context=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    const cdp=job.browser==='chromium'?await context.newCDPSession(page):null;
    if(job.profile==='constrained'){
     await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
     await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:1600000/8,uploadThroughput:750000/8});
    }
    await page.goto(`${origin}/${job.arm}${job.delivery==='ssr'?'-ssr':''}.html?mode=${job.mode}`,{waitUntil:'load'});
    await page.waitForFunction(()=>!!window.fixture,{},{timeout:30000});
    const startup=await page.evaluate(()=>({...fixture.startup,resources:performance.getEntriesByType('resource').filter(r=>r.initiatorType==='script').map(r=>({name:r.name.split('/').pop(),bytes:r.encodedBodySize}))}));
    if(startup.paletteDefined!==(job.arm==='eager'))throw Error('Unexpected startup registration');
    let metrics,checkpoints;
    if(job.kind==='timing'){
     metrics=await page.evaluate(async()=>({...fixture.startup,...await fixture.open()}));
     metrics.startupJSBytes=startup.resources.reduce((sum,r)=>sum+r.bytes,0);
     metrics.totalJSBytes=await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>r.initiatorType==='script').reduce((sum,r)=>sum+r.encodedBodySize,0));
     if(!Object.values(metrics).filter(v=>typeof v==='number').every(Number.isFinite))throw Error('Invalid metrics');
    }else{
     checkpoints=[];
     for(let cycle=0;cycle<=100;cycle++){
      if(cycle>0)await page.evaluate(()=>fixture.cycle());
      if([0,10,50,100].includes(cycle)){
       await cdp.send('HeapProfiler.collectGarbage');await cdp.send('HeapProfiler.collectGarbage');
       const heap=await cdp.send('Runtime.getHeapUsage'),dom=await cdp.send('Memory.getDOMCounters');
       checkpoints.push({cycle,heapBytes:heap.usedSize,dom,state:await page.evaluate(()=>fixture.state())});
      }
     }
     if(checkpoints.some(p=>p.state.disposedUpdates))throw Error('Updates after disposal');
    }
    if(errors.length)throw Error(errors.join('\n'));
    const row={...job,status:'ok',browserVersion:browser.version(),effectiveMode:startup.mode,metrics,checkpoints,startupResources:startup.resources,errors};
    await appendFile(resolve(out,'samples.jsonl'),JSON.stringify(row)+'\n');
    console.log(`${index+1}/${jobs.length} ${job.kind} ${job.browser}/${job.mode}/${job.delivery}/${job.profile}/${job.arm}`);
   }catch(error){await writeFile(resolve(out,'failure.json'),json({job,errors,error:String(error)}));throw error;}
   finally{await context?.close();await browser.close();}
  }
 }finally{await new Promise(resolve=>server.close(resolve));}
});
for(const [file,hash] of Object.entries(receipt.hashes))if(sha(await readFile(resolve(packed,file)))!==hash)throw Error('Fixture changed during capture');
await writeFile(resolve(out,'summary.json'),json({passed:jobs.length,failed:0,timing:jobs.filter(j=>j.kind==='timing').length,retention:jobs.filter(j=>j.kind==='retention').length,configurations:cells.length,retentionConfigurations:retention.length,qualify}));
