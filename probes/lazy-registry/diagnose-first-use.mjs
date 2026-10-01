// Supplemental experiment; does not modify the frozen Phase 3 campaign.
import {chromium} from '@playwright/test';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {serve} from './server.mjs';
import {exclusiveBrowserWork} from '../../showcases/performance/src/lock.mjs';
const out = 'artifacts/scoped-registry-phase-3/first-use-diagnostic';
await mkdir(out,{recursive:true});
const receipt=JSON.parse(await readFile('artifacts/scoped-registry-phase-3/packed/receipt.json'));
const verify=async()=>{for(const [file,hash] of Object.entries(receipt.hashes))if(createHash('sha256').update(await readFile(`artifacts/scoped-registry-phase-3/packed/${file}`)).digest('hex')!==hash)throw Error(`Changed fixture: ${file}`);};
await verify();
const rows=[];
await exclusiveBrowserWork(async()=>{
 const server=await serve(4204);
 try {for(let block=0;block<5;block++)for(const arm of (block%2?['prefetched','parallel-at-click','cold']:['cold','parallel-at-click','prefetched'])) {
  const browser=await chromium.launch();
  try {
   const context=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   const cdp=await context.newCDPSession(page);
   await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await cdp.send('Network.enable');
   await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:1600000/8,uploadThroughput:750000/8});
   await page.goto('http://127.0.0.1:4204/lazy.html?mode=auto');await page.waitForFunction(()=>!!window.fixture);
   const result=await page.evaluate(async arm=>{
    const before=performance.now();let preloadMs=0;
    if(arm==='prefetched'){await fixture.loader.load(['en-command-palette']);preloadMs=performance.now()-before;}
    const definedBeforeClick=!!fixture.scope.registry.get('en-command-palette');
    const start=performance.now();
    if(arm==='parallel-at-click')for(const path of ['command-palette-CHXKNBHM.js','chunk-VAVPCKYI.js']){
     const link=document.createElement('link');link.rel='modulepreload';link.href=`/chunks/${path}`;document.head.append(link);
    }
    const metrics=await fixture.open();
    return {preloadMs,definedBeforeClick,metrics,elapsedFromHintsMs:performance.now()-start,resources:performance.getEntriesByType('resource').filter(r=>r.startTime>=before&&r.name.endsWith('.js')).map(r=>({name:r.name.split('/').pop(),startMs:r.startTime-before,responseStartMs:r.responseStart-before,endMs:r.responseEnd-before,duration:r.duration,bytes:r.encodedBodySize,initiatorType:r.initiatorType}))};
   },arm);
   if(result.definedBeforeClick||errors.length)throw Error(JSON.stringify({result,errors}));
   rows.push({block,arm,browserVersion:browser.version(),...result,errors});console.log(JSON.stringify({block,arm,...result.metrics}));
  }finally{await browser.close();}
 }}finally{await new Promise(resolve=>server.close(resolve));}
});
await verify();
const median=a=>{a.sort((a,b)=>a-b);return a[a.length>>1];};
const summary=Object.fromEntries(['cold','parallel-at-click','prefetched'].map(arm=>{const r=rows.filter(x=>x.arm===arm);return [arm,{samples:r.length,...Object.fromEntries(['firstUseMs','loadMs','defineMs'].map(k=>[k,median(r.map(x=>x.metrics[k]))])),preloadMs:median(r.map(x=>x.preloadMs))}];}));
await writeFile(`${out}/results.json`,JSON.stringify({at:new Date().toISOString(),method:'Supplemental diagnostic, 5 repeats per arm, alternating order, fresh Chromium/context, CSR native auto registry, same sealed Phase 3 assets and CDP 4x CPU/150ms/1.6Mbps. Preload arm finishes load before click; parallel arm adds two modulepreload hints at click. Not a replacement campaign or field measurement.',summary,rows},null,2)+'\n');
console.log(JSON.stringify(summary,null,2));
