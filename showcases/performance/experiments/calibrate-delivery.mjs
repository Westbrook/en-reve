import { writeExperimentReceipt } from './receipt-output.mjs';
import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { root,registry,profiles,json } from '../src/config.mjs';
import { startServers } from '../src/server.mjs';
import { exclusiveBrowserWork } from '../src/lock.mjs';
import { describe } from '../src/analysis.mjs';
await exclusiveBrowserWork(async()=>{
 const stop=await startServers({systems:[registry[0]]});const samples=[];
 try {
  for(let block=0;block<3;block++) for(const name of block%2 ? ['mobile','desktop']:['desktop','mobile']) {
   const b=await chromium.launch({args:['--ignore-certificate-errors']});
   try {
    const page=await b.newPage({ignoreHTTPSErrors:true});const cdp=await page.context().newCDPSession(page);const p=profiles[name];
    await cdp.send('Network.enable');await cdp.send('Emulation.setCPUThrottlingRate',{rate:p.cpuRate});
    await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:p.latency,downloadThroughput:p.download,uploadThroughput:p.upload});
    await page.goto('https://127.0.0.1:4610/__perf/calibration');
    const data=await page.evaluate(async()=>{
     let sum=0;for(let i=0;i<100000;i++)sum+=Math.sqrt(i); // JIT warm-up is outside the measured loop.
     const cpuStart=performance.now();for(let i=0;i<5000000;i++)sum+=Math.sqrt(i);const cpuMs=performance.now()-cpuStart;globalThis.__cpuSink=sum;
     const network=[];
     for(const bytes of [1024,1000000]) {const url=`/__perf/network-calibration?bytes=${bytes}`;const start=performance.now();const r=await fetch(url,{cache:'no-store'});const headersAt=performance.now();const body=await r.arrayBuffer();network.push({bytes:body.byteLength,headersMs:headersAt-start,totalMs:performance.now()-start,entry:performance.getEntriesByType('resource').at(-1)?.toJSON()});}
     return {cpuMs,network,navigation:performance.getEntriesByType('navigation')[0].toJSON()};
    });samples.push({block,profile:name,browser:b.version(),...data});
   }finally{await b.close();}
  }
 }finally{await stop();}
 const summary=Object.fromEntries(Object.keys(profiles).map(profile=>[profile,{cpuMs:describe(samples.filter(s=>s.profile===profile).map(s=>s.cpuMs)),smallFetchMs:describe(samples.filter(s=>s.profile===profile).map(s=>s.network[0].totalMs)),megabyteFetchMs:describe(samples.filter(s=>s.profile===profile).map(s=>s.network[1].totalMs)),navigationTTFB:describe(samples.filter(s=>s.profile===profile).map(s=>s.navigation.responseStart))}]));
 const receipt={at:new Date().toISOString(),profiles,samples,summary,note:'Three fresh browsers per profile. HTTP/2 loopback, same CDP commands as native runner. CPU loop ratio is diagnostic, not physical-device calibration. Header timestamps can exclude emulation delay; compare body completion too.'};
 await writeExperimentReceipt('reports/delivery-calibration-pass2.json',json(receipt));console.log(JSON.stringify(summary,null,2));
});
