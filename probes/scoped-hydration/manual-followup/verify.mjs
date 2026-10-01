import {chromium,firefox,webkit} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {exclusiveBrowserWork} from '../../../showcases/performance/src/lock.mjs';
const results=[],base='http://127.0.0.1:4232',out='artifacts/scoped-registry-phase-5-manual-followup';
await exclusiveBrowserWork(async()=>{for(const [name,type]of Object.entries({chromium,firefox,webkit})){
 const browser=await type.launch();try{
  for(const cache of ['no-store','revalidate']){
   const context=await browser.newContext(),page=await context.newPage();
   const response=await page.goto(`${base}/?cache=${cache}&progress-report`);await page.waitForFunction(()=>!!window.manualReview);
   const draft=page.getByRole('textbox',{name:'Draft',exact:true});await draft.fill('History draft '+name);await page.locator('#history-away').click();await page.waitForURL('**/away*');await page.goBack();await page.waitForFunction(()=>!!window.manualReview);
   const value=await draft.inputValue();const restored=value==='History draft '+name;
   const before=await page.evaluate(()=>window.manualReview.pageshows);
   // Whatever the browser restored, optional hydration must not alter it.
   await page.getByRole('button',{name:'Search commands',exact:true}).click();await page.waitForFunction(()=>window.study.records[0].island.state==='ready');await page.getByRole('dialog').waitFor({state:'visible'});assert.equal(await draft.inputValue(),value);
   results.push({browser:name,version:browser.version(),kind:'history',cache,responseCacheControl:response.headers()['cache-control'],restored,value,pageshows:before,activationPreservesRestoredValue:true});
   await context.close();
  }
  for(const opening of ['baseline','settle'])for(const fail of [false,true]){
   const context=await browser.newContext(),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(`${base}/?delay&opening=${opening}${fail?'&fail':''}&progress-report`);await page.waitForFunction(()=>!!window.manualReview);
   const trigger=page.getByRole('button',{name:'Search commands',exact:true}),draft=page.getByRole('textbox',{name:'Draft',exact:true});await draft.fill('Edited while loading');await trigger.click();
   if(fail){await page.getByText('Commands could not load. Activate Search commands to retry.').waitFor();await trigger.click();}
   await page.getByRole('dialog').waitFor({state:'visible'});
   assert(await page.locator('#en-command-search').first().evaluate(el=>el.matches(':focus')));assert.equal(await draft.inputValue(),'Edited while loading');
   await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});assert(await trigger.evaluate(el=>el.matches(':focus')));
   const stages=await page.evaluate(()=>window.manualReview.stages);assert.equal(stages.some(s=>s.stage==='settled-before-opening'),opening==='settle');assert.deepEqual(errors,[]);
   results.push({browser:name,kind:'dialog',opening,fail,domFocus:true,draftPreserved:true,escapeRestoration:true,stages});await context.close();
  }
  const context=await browser.newContext(),page=await context.newPage();await page.goto(`${base}/native?progress-report`);await page.getByRole('button',{name:'Open native dialog'}).click();await page.getByRole('dialog').waitFor({state:'visible'});assert(await page.getByRole('textbox',{name:'Native search'}).evaluate(el=>el.matches(':focus')));await page.keyboard.press('Escape');assert(await page.getByRole('button',{name:'Open native dialog'}).evaluate(el=>el.matches(':focus')));results.push({browser:name,kind:'native-control',domFocus:true,escapeRestoration:true});await context.close();
  console.log(name,JSON.stringify(results.filter(r=>r.browser===name&&r.kind==='history')));
 }finally{await browser.close();}
}});
await writeFile(out+'/browser.json',JSON.stringify({at:new Date().toISOString(),results,limits:['Automation verifies DOM focus only, never VoiceOver cursor.','Headless Playwright history behavior may differ from retail browser and user profile.','No HTTP routing interception; server headers differ; no script restoration.']},null,2)+'\n');
