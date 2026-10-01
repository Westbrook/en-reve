const phase6Base=process.env.PHASE6_BASE??'artifacts/scoped-registry-phase-6';
import {chromium,firefox,webkit,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {serve} from '../scoped-hydration/production/server.mjs';
import {exclusiveBrowserWork} from '../../showcases/performance/src/lock.mjs';
const results=[];
await exclusiveBrowserWork(async()=>{for(const policy of ['eager','dom','cold']){const server=await serve('candidate/'+policy,0,phase6Base);try{for(const [name,type]of Object.entries({chromium,firefox,webkit})){const browser=await type.launch();try{for(const mode of ['global','scoped']){
const page=await browser.newPage({ignoreHTTPSErrors:true,viewport:{width:390,height:844},reducedMotion:'reduce',forcedColors:name==='chromium'?'active':'none'}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(server.url+'/?mode='+mode);await page.waitForFunction(()=>!!window.study);
// Concurrent open requests, connected-after-policy assignment, accepted close veto, reset.
if(policy!=='eager')assert(await page.evaluate(()=>{const a=study.picker.showPicker(),b=study.picker.showPicker();window.opening=a;return a===b;}));else await page.evaluate(()=>study.picker.showPicker());
if(policy!=='eager')await page.evaluate(()=>opening);
await expect(page.locator('en-calendar button[data-date="2026-09-15"]')).toBeFocused();
await page.evaluate(()=>{const d=study.picker.shadowRoot.querySelector('en-dialog');d.addEventListener('en-change',e=>{if(!e.detail.proposed)e.preventDefault();},{once:true});study.picker.hidePicker();});assert(await page.evaluate(()=>study.picker.shadowRoot.querySelector('en-dialog').open));
await page.evaluate(()=>study.picker.hidePicker());await page.evaluate(()=>{study.picker.value='2026-10-20';document.querySelector('form').reset();});assert.equal(await page.evaluate(()=>study.picker.value),'2026-09-15');
await page.evaluate(()=>{const fs=document.createElement('fieldset');document.querySelector('form').append(fs);fs.append(study.picker);fs.disabled=true;});await page.evaluate(()=>study.picker.showPicker());assert.equal(await page.evaluate(()=>study.picker.shadowRoot.querySelector('en-dialog').open),false);await page.evaluate(()=>{study.picker.parentElement.disabled=false;});await page.evaluate(()=>study.picker.showPicker());await expect(page.locator('en-calendar button[data-date="2026-09-15"]')).toBeFocused();
assert(await page.locator('en-calendar button[data-date="2026-09-15"]').evaluate(el=>el.getBoundingClientRect().width>=24));
assert.deepEqual(errors,[]);results.push({policy,name,mode,status:'pass'});await page.close();
}}finally{await browser.close();}}}finally{await server.close();}}});
await writeFile((phase6Base+'/extended.json'),JSON.stringify({results},null,2));
