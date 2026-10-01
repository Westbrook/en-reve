import {chromium,firefox,webkit,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {serve} from './server.mjs';
import {exclusiveBrowserWork} from '../../../showcases/performance/src/lock.mjs';
const out='artifacts/scoped-registry-phase-5-form-review',results=[];
await exclusiveBrowserWork(async()=>{
 const server=await serve(0);
 try {
  const response=await fetch(server.url);assert.equal(response.headers.get('cache-control'),'private, no-cache');
  assert.equal((await fetch(server.url+'/blocked-submit',{method:'POST',body:'discarded-test-data'})).status,405);
  for(const [name,type] of Object.entries({chromium,firefox,webkit})) {
   const browser=await type.launch();
   try {for(const delivery of ['shadow','global']) {
    const context=await browser.newContext(),page=await context.newPage(),errors=[];
    console.log('Checking',name,delivery);page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(15000);
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`${server.url}/${delivery}.html?progress-report`);
    await page.waitForFunction(()=>!!window.formReview);
    const managed=page.locator('#managed'),native=page.locator('#native-form');
    await expect(page.locator('#report-return')).toBeVisible();
    assert.equal(await page.evaluate(()=>formReview.island.state),'dormant');
    const field=managed.getByRole('textbox',{name:'Full name',exact:true});
    await field.fill('Before hydration');await field.evaluate(el=>el.setSelectionRange(2,7));
    // Eventless value assignment qualifies preservation mechanics, never actual autofill.
    await managed.getByRole('textbox',{name:'Email',exact:true}).evaluate(el=>el.value='synthetic@example.test');
    await page.evaluate(()=>formReview.hydrate());
    assert.deepEqual(await page.evaluate(()=>formReview.lastPreservation),{checks:['name','email','street','city','postal'].map(field=>({field,sameInput:true,valuePreserved:true,selectionPreserved:true})),focusPreserved:true});
    await expect(field).toHaveValue('Before hydration');
    await managed.getByRole('button',{name:'Check managed form values'}).click();
    await expect(page.locator('#managed-result')).toContainText('Form entries match all visible input values.');
    await expect(page.locator('#managed-result')).toContainText('synthetic@example.test');
    await field.fill('After hydration');await managed.getByRole('button',{name:'Check managed form values'}).click();
    await expect(page.locator('#managed-result')).toContainText('After hydration');
    await native.getByRole('textbox',{name:'Full name',exact:true}).fill('Native history marker');
    await native.getByRole('button',{name:'Check native form values'}).click();
    await expect(page.locator('#native-result')).toContainText('Native history marker');
    // Exercise browser Back without injecting a replacement value on return.
    await page.locator('#away').click();await expect(page).toHaveURL(/\/away\?progress-report/);
    await page.goBack();await page.waitForFunction(()=>!!window.formReview&&!!window.reviewPageShow);
    const historyAfter=await page.evaluate(()=>({navigation:reviewPageShow,state:formReview.island.state,managedValue:formReview.fields()[0].input.value,nativeValue:document.querySelector('#native-form input').value}));
    if(historyAfter.state==='dormant')await page.evaluate(()=>formReview.hydrate());
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    historyAfter.valueAfterActivation=await field.inputValue();
    assert(['','After hydration'].includes(historyAfter.valueAfterActivation));
    await managed.getByRole('button',{name:'Check managed form values'}).click();
    await expect(page.locator('#managed-result')).toContainText('Form entries match all visible input values.');
    // Separate fresh document: depart before initial hydration.
    await page.goto(`${server.url}/${delivery}.html?progress-report`);await page.waitForFunction(()=>!!window.formReview);
    await field.fill('Dormant history marker');
    await page.locator('#away').click();await page.goBack();await page.waitForFunction(()=>!!window.formReview&&!!window.reviewPageShow);
    const historyBefore=await page.evaluate(()=>({navigation:reviewPageShow,state:formReview.island.state,value:formReview.fields()[0].input.value}));
    assert.equal(historyBefore.state,'dormant');
    await page.evaluate(()=>formReview.hydrate());
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    historyBefore.valueAfterActivation=await field.inputValue();
    assert(['','Dormant history marker'].includes(historyBefore.valueAfterActivation));
    // Actual delay control: continuing focus and selection must survive activation.
    await page.goto(`${server.url}/${delivery}.html`);await page.waitForFunction(()=>!!window.formReview);
    await expect(page.locator('#report-return')).toBeHidden();
    await page.getByRole('button',{name:'Hydrate in 5 seconds'}).click();await field.fill('During delay');await field.evaluate(el=>el.setSelectionRange(1,5));
    await page.waitForFunction(()=>formReview.island.state==='ready',{},{timeout:15000});
    await expect(field).toBeFocused();await expect(field).toHaveValue('During delay');
    assert.equal(await page.evaluate(()=>formReview.lastPreservation.focusPreserved),true);
    await page.setViewportSize({width:390,height:844});
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    if(delivery==='shadow')await page.screenshot({path:`${out}/${name}-mobile.png`,fullPage:true});
    await page.setViewportSize({width:1280,height:1000});
    if(delivery==='shadow')await page.screenshot({path:`${out}/${name}-desktop.png`,fullPage:true});
    assert.deepEqual(errors,[]);
    results.push({browser:name,delivery,registry:await page.evaluate(()=>formReview.island.mode),preservation:true,localFormData:true,delayedFocus:true,historyAfter,historyBefore,layout:true,pageErrors:errors});
    await context.close();
   }} finally {await browser.close();}
  }
 } finally {await server.close();}
});
const hashes=[];
for(const name of (await readdir('probes/scoped-hydration/form-review')).sort()){
 const bytes=await readFile(`probes/scoped-hydration/form-review/${name}`);hashes.push({name,sha256:createHash('sha256').update(bytes).digest('hex')});
}
await mkdir(out,{recursive:true});
const data={status:'fixture_mechanics_verified_manual_acceptance_pending',sourceVersion:createHash('sha256').update(JSON.stringify(hashes)).digest('hex'),sources:hashes,checks:results,limitations:['Eventless assignments are synthetic, not actual saved-profile autofill.','Automated browser Back observations do not certify regular-profile history behavior.','Actual IME/autofill/history review remains user-reported evidence.']};
await writeFile(`${out}/verification.json`,JSON.stringify(data,null,2)+'\n');console.log(JSON.stringify(data,null,2));
