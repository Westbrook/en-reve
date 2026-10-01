import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { readFile,writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { root,registry,json,sha } from '../src/config.mjs';
import { startServers } from '../src/server.mjs';
import { exclusiveBrowserWork } from '../src/lock.mjs';
import { startupInteraction as current } from '../scenarios/startup.mjs';
const priorPath=resolve(root,'runs/pass2-startup-v1/harness/scenarios/startup.mjs');
const {startupInteraction:prior}=await import(pathToFileURL(priorPath));
await exclusiveBrowserWork(async()=>{
 const stop=await startServers({systems:[registry[0]]});const browser=await chromium.launch({args:['--ignore-certificate-errors']});const samples=[];
 try{
  for(const [name,probe] of [['v1',prior],['v3',current]]){
   const context=await browser.newContext({ignoreHTTPSErrors:true});await context.addInitScript({path:resolve(root,'.cache/startup-collector.js')});const page=await context.newPage();await page.goto('https://127.0.0.1:4610/__perf/calibration');
   await page.evaluate(()=>{document.body.innerHTML='<section id="showcase-actions"><button style="display:none">Landscape</button></section><section id="showcase-asset"><div data-layout="portrait">Preview</div></section>';const b=document.querySelector('button');b.onclick=()=>document.querySelector('[data-layout]').setAttribute('data-layout','landscape');setTimeout(()=>{b.style.display='';window.__shownAt=performance.now();},350);});
   const result=await probe(page,'radix-react');const shownAt=await page.evaluate(()=>window.__shownAt);samples.push({name,shownAt,...result,discoveryDelay:result.visibleObserved-shownAt});await context.close();
  }
 }finally{await browser.close();await stop();}
 assert.ok(samples[1].discoveryDelay>=0&&samples[1].discoveryDelay<100);
 assert.ok(samples[1].discoveryDelay<samples[0].discoveryDelay);
 const data={at:new Date().toISOString(),status:'passed',priorSourceSha256:sha(await readFile(priorPath)),currentSourceSha256:sha(await readFile(resolve(root,'scenarios/startup.mjs'))),samples,note:'Synthetic control appears 350ms after setup. Both send one trusted click. V3 must detect within 100ms and earlier than backoff-based V1. This calibrates discovery, not library speed.'};
 await writeFile(resolve(root,'reports/startup-discovery-calibration-pass2.json'),json(data));console.log(samples.map(s=>({version:s.name,discoveryDelay:s.discoveryDelay,probeDurationMs:s.probeDurationMs})));
});
