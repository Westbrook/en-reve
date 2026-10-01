import { writeExperimentReceipt } from './receipt-output.mjs';
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { build } from 'esbuild';
import { root,registry,json } from '../src/config.mjs';
import { exclusiveBrowserWork } from '../src/lock.mjs';
import { startServers } from '../src/server.mjs';
import { startupInteraction } from '../scenarios/startup.mjs';
await exclusiveBrowserWork(async()=>{
 await build({entryPoints:[resolve(root,'src/collector.js')],outfile:resolve(root,'.cache/startup-collector.js'),bundle:true,format:'iife',minify:true});
 const stop=await startServers({systems:[registry[0]]});const b=await chromium.launch({args:['--ignore-certificate-errors']});const cases=[];
 try {for(const active of [true,false]) {
  const context=await b.newContext({ignoreHTTPSErrors:true});await context.addInitScript({path:resolve(root,'.cache/startup-collector.js')});const page=await context.newPage();await page.goto('https://127.0.0.1:4610/__perf/calibration');
  await page.evaluate(active=>{document.body.innerHTML='<section id="showcase-actions"><button>Landscape</button></section><section id="showcase-asset"><div data-layout="portrait">Preview</div></section>';const button=document.querySelector('button');globalThis.__clicks=0;button.addEventListener('click',()=>globalThis.__clicks++);const bind=()=>button.addEventListener('click',()=>{const begin=performance.now();while(performance.now()-begin<60){};document.querySelector('[data-layout]').setAttribute('data-layout','landscape');});if(active)bind();else setTimeout(bind,500);},active);
  let result,error;try{result=await startupInteraction(page,'radix-react');}catch(e){error=e.message;}
  const clicks=await page.evaluate(()=>globalThis.__clicks);assert.equal(clicks,1);
  if(active){assert.ok(result.semanticMs>=55);assert.equal(result.status,'ok');}else{assert.ok(error);assert.equal(await page.locator('[data-layout]').getAttribute('data-layout'),'portrait');}
  cases.push({activeAtClick:active,clicks,result,error,passed:true});await context.close();
 }}finally{await b.close();await stop();}
 await writeExperimentReceipt('reports/spectrum-gen2/startup-calibration.json',json({at:new Date().toISOString(),cases,status:'passed',note:'Native one-click probe verifies known 60ms work and rejects a click lost before a delayed handler is attached; no retry converts the failure to success.'}));console.log('Startup probe calibration passed');
});
