const phase6Base=process.env.PHASE6_BASE??'artifacts/scoped-registry-phase-6';
import {chromium,firefox,webkit,expect} from '@playwright/test';
import {serve} from '../../scoped-hydration/production/server.mjs';
import {exclusiveBrowserWork} from '../../../showcases/performance/src/lock.mjs';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const results=[];
await exclusiveBrowserWork(async()=>{const server=await serve('ssr',0,phase6Base);try{
for(const [name,type]of Object.entries({chromium,firefox,webkit})){const browser=await type.launch();try{for(const delivery of ['global','shadow']){const page=await browser.newPage({ignoreHTTPSErrors:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(server.url+'/'+delivery+'.html');await page.waitForFunction(()=>!!window.ssrStudy);assert.equal(await page.locator('en-calendar').count(),0);
await page.evaluate(()=>{const p=ssrStudy.root.querySelector('en-date-picker'),input=p.shadowRoot.querySelector('input');window.original=input;input.value='2026-09-20';});
assert.equal(await page.evaluate(()=>new FormData(ssrStudy.root.querySelector('form')).get('eventDate')),null);
await page.evaluate(()=>ssrStudy.activate());assert(await page.evaluate(()=>ssrStudy.root.querySelector('en-date-picker').shadowRoot.querySelector('input')===original));assert.equal(await page.evaluate(()=>new FormData(ssrStudy.root.querySelector('form')).get('eventDate')),'2026-09-20');assert.equal(await page.locator('en-calendar').count(),0);
await page.locator('#picker-trigger').getByRole('button').click();await expect(page.locator('en-calendar button[data-date="2026-09-20"]')).toBeFocused();await page.keyboard.press('Escape');assert.deepEqual(errors,[]);results.push({browser:name,delivery,status:'pass',mode:await page.evaluate(()=>ssrStudy.island.mode)});await page.close();}}finally{await browser.close();}}
}finally{await server.close();}});await writeFile((phase6Base+'/ssr/verification.json'),JSON.stringify({results},null,2));
