import {chromium,firefox,webkit} from '@playwright/test';import {writeFile} from 'node:fs/promises';import assert from 'node:assert/strict';
import {serve} from './server.mjs';import {exclusiveBrowserWork} from '../../../showcases/performance/src/lock.mjs';
const base=process.env.PHASE5_CAPTURE_ROOT??'artifacts/scoped-registry-phase-5/production',results=[];
await exclusiveBrowserWork(async()=>{const server=await serve('cold',0,base);try{for(const [browserName,type]of Object.entries({chromium,firefox,webkit})){
 const browser=await type.launch();try{
  for(const scenario of ['delayed-chunk','failed-chunk','no-js']){
   const context=await browser.newContext({ignoreHTTPSErrors:true,javaScriptEnabled:scenario!=='no-js'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));let requests=0,release;const gate=new Promise(r=>release=r);
   if(scenario!=='no-js')await page.route('**/island-*.js',async route=>{requests++;if(requests===1){if(scenario==='failed-chunk'){await route.abort('failed');return;}await gate;}await route.continue();});
   await page.goto(server.url);const field=page.getByRole('textbox',{name:'Draft',exact:true});await field.fill('Keep this production draft');
   if(scenario==='no-js'){assert.equal(await field.inputValue(),'Keep this production draft');assert.equal(await page.locator('en-command-palette').count(),0);assert(await page.getByRole('button',{name:'Native save'}).isEnabled());}
   else{
    await page.waitForFunction(()=>!!window.study);await page.getByRole('button',{name:'Search commands',exact:true}).press('Enter');
    if(scenario==='delayed-chunk'){
     await page.getByRole('status').filter({hasText:'Loading commands'}).waitFor();await field.fill('Editing during load');release();const action=await page.evaluate(()=>study.action);assert(action.focusInside);await page.keyboard.press('Escape');assert.equal(await field.inputValue(),'Editing during load');assert(await field.evaluate(el=>el===document.activeElement));
     await page.getByRole('button',{name:'Other commands',exact:true}).press('Enter');assert((await page.evaluate(()=>study.action)).focusInside);await page.keyboard.press('Escape');
    }else{
     const rejected=await page.evaluate(()=>study.action.then(()=>false,()=>true));assert(rejected);assert.equal(await field.inputValue(),'Keep this production draft');assert.match(await page.getByRole('status').textContent(),/could not load/);assert.equal(await page.getByRole('button',{name:'Search commands',exact:true}).getAttribute('aria-busy'),'false');
     await page.getByRole('button',{name:'Search commands',exact:true}).press('Enter');const retry=await page.evaluate(()=>study.action.then(()=>true,()=>false));results.push({browserName,scenario:'retry-result',retry,requests});if(retry)await page.keyboard.press('Escape');assert.equal(await field.inputValue(),'Keep this production draft');
    }
   }
   assert.deepEqual(errors,[]);results.push({browserName,scenario,status:'passed',requests});await context.close();
  }
 }finally{await browser.close();}
}}finally{await server.close();}});
await writeFile(base+'/functional.json',JSON.stringify({at:new Date().toISOString(),results},null,2)+'\n');console.log(JSON.stringify(results));
