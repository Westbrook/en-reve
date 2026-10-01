const phase6Base=process.env.PHASE6_BASE??'artifacts/scoped-registry-phase-6';
import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {serve} from '../scoped-hydration/production/server.mjs';
import {exclusiveBrowserWork} from '../../showcases/performance/src/lock.mjs';
const results=[];
await exclusiveBrowserWork(async()=>{for(const arm of ['parent/eager','candidate/dom']){const server=await serve(arm,0,phase6Base),browser=await chromium.launch();try{const context=await browser.newContext({ignoreHTTPSErrors:true,serviceWorkers:'block'}),page=await context.newPage();await page.goto(server.url+'/?mode=scoped');await page.waitForFunction(()=>!!window.study);await page.goto(server.url+'/index.html?mode=scoped');await page.waitForFunction(()=>!!window.study);const resources=await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>/\.js$/.test(new URL(r.name).pathname)).map(r=>({path:new URL(r.name).pathname,transferSize:r.transferSize,encodedBodySize:r.encodedBodySize,deliveryType:r.deliveryType})));assert(resources.length>0);assert(resources.every(r=>r.transferSize===0),'warm JS must come from cache');results.push({arm,resources,status:'pass'});}finally{await browser.close();await server.close();}}});await writeFile((phase6Base+'/warm-cache-proof.json'),JSON.stringify({results},null,2));
