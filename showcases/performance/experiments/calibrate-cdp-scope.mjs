import { writeExperimentReceipt } from './receipt-output.mjs';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { root,registry,json } from '../src/config.mjs';
import { startServers } from '../src/server.mjs';
import { exclusiveBrowserWork } from '../src/lock.mjs';
await exclusiveBrowserWork(async()=>{
 const stop=await startServers({systems:[registry[0]]});
 let browser, failure; let failed=false;
 try{
  browser=await chromium.launch({args:['--ignore-certificate-errors']});
  const context=await browser.newContext({ignoreHTTPSErrors:true});const page=await context.newPage();const cdp=await context.newCDPSession(page);await cdp.send('Performance.enable');
  const metrics=async()=>Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
  const samples=[];
  for(let i=0;i<3;i++){
   await page.goto('https://127.0.0.1:4610/__perf/calibration');
   await page.evaluate(()=>{const script=document.createElement('script');script.textContent='const end=performance.now()+150;while(performance.now()<end){}';document.body.append(script);});
   const before=await metrics();await page.goto('https://127.0.0.1:4610/__perf/away');const after=await metrics();
   samples.push({before,after});assert.ok(before.TaskDuration>.1);assert.ok(after.TaskDuration<before.TaskDuration*.5,'Counters must reset for the new document in this pinned browser');
  }
  await writeExperimentReceipt('reports/cdp-scope-calibration-pass2.json',json({at:new Date().toISOString(),browser:browser.version(),status:'passed',samples,note:'Pinned browser calibration: 150ms inline work followed by a fresh same-origin document. Confirms final-document task counters exclude the priming document in this navigation pattern; do not assume the same behavior across browser changes.'}));console.log('CDP navigation scope calibration passed');
 } catch (error) {
   failed = true;
   failure = error;
   throw error;
 } finally {
   const cleanupErrors = [];
   for (const release of [() => browser?.close(), () => stop()]) {
     try { await release(); } catch (error) { cleanupErrors.push(error); }
   }
   if (cleanupErrors.length) throw new AggregateError(failed ? [failure, ...cleanupErrors] : cleanupErrors, "CDP calibration resource cleanup failed");
 }
});
