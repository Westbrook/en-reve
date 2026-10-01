import {chromium,firefox,webkit} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {serve} from './server.mjs';
import {installProbe} from './browser-probe.mjs';
import {exclusiveBrowserWork} from '../../showcases/performance/src/lock.mjs';
const base='artifacts/scoped-registry-production-v1',checks=[];
const rows=(await readFile(`${base}/qualification/samples.jsonl`,'utf8')).trim().split('\n').map(JSON.parse);
assert.equal(rows.length,20);assert.ok(rows.every(r=>r.status==='ok'));
for(const row of rows.filter(r=>r.phase===3&&r.kind==='timing')){
 const chunks=row.action.resources.filter(r=>/\/command-palette-.*\.js$/.test(r.name));
 assert.equal(chunks.length,2,'Expected definition facade and implementation requests');
 const startGapMs=Math.abs(chunks[0].startMs-chunks[1].startMs);assert.ok(startGapMs<100,'Unexpected serial chunk discovery');
 assert.ok(!row.startup.resources.some(r=>/\/command-palette-/.test(r.name)));
 checks.push({kind:'parallel-lazy-chunks',browser:row.browser,profile:row.profile,startGapMs,chunks});
}
await exclusiveBrowserWork(async()=>{for(const phase of [0,1,2,3]){const s=await serve(phase);try{
 for(const [name,type] of Object.entries({chromium,firefox,webkit})){
  const browser=await type.launch();try{
   const context=await browser.newContext({javaScriptEnabled:false,ignoreHTTPSErrors:true});const page=await context.newPage();await page.goto(s.url+'/workflows/settings.html');
   assert.equal(await page.locator('en-workflows-app[data-ssr]').count(),1);assert.equal(await page.locator('#settings-command-trigger').count(),1);assert.equal(await page.getByRole('button',{name:'Search commands',exact:true}).count(),1);
   checks.push({kind:'no-JS-SSR',phase,browser:name,passed:true});
  }finally{await browser.close();}
 }
 if(phase===3)for(const [name,type]of Object.entries({chromium,webkit})){
  const browser=await type.launch();try{
   const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,ignoreHTTPSErrors:true,serviceWorkers:'block'});await context.addInitScript(installProbe);const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(s.url+'/workflows/settings.html');await page.waitForFunction(()=>!!__deliveryProbe.startup);
   await page.getByRole('button',{name:'Search commands',exact:true}).tap();await page.getByRole('dialog',{name:'Settings commands'}).waitFor({state:'visible'});assert.deepEqual(errors,[]);
   checks.push({kind:'mobile-touch-first-use',phase,browser:name,passed:true});
  }finally{await browser.close();}
 }
}finally{await s.close();}}});
await writeFile(`${base}/functional-verification.json`,JSON.stringify({at:new Date().toISOString(),qualificationTiming:16,qualificationRetention:4,checks,passed:checks.length,failed:0},null,2)+'\n');console.log(JSON.stringify({passed:checks.length}));
