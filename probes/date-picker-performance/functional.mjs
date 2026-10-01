const phase6Base=process.env.PHASE6_BASE??'artifacts/scoped-registry-phase-6';
import {chromium,firefox,webkit,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {serve} from '../scoped-hydration/production/server.mjs';
import {exclusiveBrowserWork} from '../../showcases/performance/src/lock.mjs';
const out=(phase6Base+'/functional');await mkdir(out,{recursive:true});const results=[];
await exclusiveBrowserWork(async()=>{const server=await serve('candidate/cold',0,phase6Base);try{
 for(const [browserName,type] of Object.entries({chromium,firefox,webkit})){
  const browser=await type.launch();try{for(const mode of ['global','scoped'])for(const scenario of ['normal','hide','escape','reset','disabled','readonly','remove','focus-away','latest-value','failed-load','conflict']){
   const context=await browser.newContext({ignoreHTTPSErrors:true}),page=await context.newPage(),errors=[];page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
   let release,entered=false;const gate=new Promise(r=>release=r);let requests=0;
   if(!['normal','conflict'].includes(scenario))await page.route('**/calendar-*.js',async route=>{requests++;entered=true;if(scenario==='failed-load'&&requests===1){await route.abort();return;}await gate;await route.continue();});
   try {
    await page.goto(server.url+'/?mode='+mode);await page.waitForFunction(()=>!!window.study);
    assert.equal(await page.locator('en-calendar').count(),0);
    assert.equal(await page.evaluate(()=>new FormData(document.querySelector('form')).get('eventDate')),'2026-09-15');
    const trigger=page.locator('#picker-trigger').getByRole('button');
    if(scenario==='normal'){
     // Import-only preparation must not define or construct optional elements.
     await page.evaluate(()=>study.picker.preparePicker());assert.equal(await page.locator('en-calendar').count(),0);
     assert.equal(await page.evaluate(()=>!!study.scope.registry.get('en-calendar')),false);
     // Shared scope registration for one picker must not materialize its neighbor.
     await page.evaluate(async()=>{const sibling=study.scope.createElement('en-date-picker');sibling.calendarLoading='deferred';sibling.label='Other date';document.querySelector('#fields').append(sibling);window.sibling=sibling;await sibling.updateComplete;});
     await trigger.first().click();await page.waitForFunction(()=>study.picker.shadowRoot.querySelector('en-dialog').open);
     await expect(page.locator('en-calendar button[data-date="2026-09-15"]')).toBeFocused();assert.equal(await page.evaluate(()=>sibling.shadowRoot.querySelector('en-calendar')),null);
     await page.keyboard.press('Escape');await expect(trigger.first()).toBeFocused();
     assert(await page.evaluate(()=>{try{study.picker.selection='range';return false;}catch{return study.picker.selection==='single';}}));
     assert(await page.evaluate(()=>{try{study.picker.calendarLoading='eager';return false;}catch{return true;}}));
     await page.evaluate(async()=>{let count=0;study.picker.addEventListener('en-change',e=>{count++;e.preventDefault();},{once:true});await study.picker.showPicker();window.transactionCount=()=>count;});
     await page.locator('en-calendar button[data-date="2026-09-16"]').click();assert.equal(await page.evaluate(()=>study.picker.value),'2026-09-15');assert.equal(await page.evaluate(()=>transactionCount()),1);
     await page.evaluate(()=>study.picker.hidePicker());
    }else if(scenario==='conflict'){
     await page.evaluate(()=>study.scope.registry.define('en-calendar',class extends HTMLElement{}));
     const failure=await page.evaluate(()=>study.picker.showPicker().then(()=>false,()=>true));assert(failure);assert.equal(await page.locator('en-calendar').count(),0);
    }else{
     await trigger.click();await expect.poll(()=>entered).toBe(true);
     if(scenario==='failed-load'){
      await expect(page.locator('[part="calendar-status"]')).toContainText('could not load');
      assert.equal(await page.evaluate(()=>new FormData(document.querySelector('form')).get('eventDate')),'2026-09-15');
      release();const retry=await page.evaluate(()=>study.picker.showPicker().then(()=>true,()=>false));results.push({browserName,mode,scenario:'failed-import-retry-observation',retry,requests});
     }else{
      await page.evaluate(scenario=>{const p=study.picker;switch(scenario){case'hide':p.hidePicker();break;case'reset':document.querySelector('form').reset();break;case'disabled':p.disabled=true;break;case'readonly':p.readOnly=true;break;case'remove':p.remove();break;case'focus-away':document.querySelector('#submit').focus();break;case'latest-value':p.value='2026-10-20';p.max='2026-10-25';p.locale='fr';break;}},scenario);
      if(scenario==='escape')await page.keyboard.press('Escape');
      release();await page.waitForTimeout(120);await page.evaluate(()=>study.picker.updateComplete);
      if(scenario==='latest-value'){
       await page.waitForFunction(()=>study.picker.shadowRoot.querySelector('en-dialog').open);await expect(page.locator('en-calendar button[data-date="2026-10-20"]')).toBeFocused();
      }else{assert.equal(await page.evaluate(()=>study.picker.shadowRoot.querySelector('en-dialog').open),false);assert.equal(await page.locator('en-calendar').count(),0);}
     }
    }
    assert.deepEqual(errors,[]);results.push({browserName,mode,scenario,status:'pass',actualMode:await page.evaluate(()=>study.mode)});console.log(browserName,mode,scenario,'pass');
   }catch(error){await page.screenshot({path:`${out}/failure.png`});await writeFile(`${out}/failure.json`,JSON.stringify({browserName,mode,scenario,error:String(error),stack:error.stack,errors},null,2));throw error;}finally{release();await context.close();}
  }}finally{await browser.close();}
 }
}finally{await server.close();}});
await writeFile(`${out}/verification.json`,JSON.stringify({at:new Date().toISOString(),results},null,2));
