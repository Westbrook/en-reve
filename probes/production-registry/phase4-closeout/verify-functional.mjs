import {chromium,firefox,webkit,expect} from '@playwright/test';
import {writeFile,readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {serve} from '../phase4-followup/server.mjs';
import {exclusiveBrowserWork} from '../../../showcases/performance/src/lock.mjs';
// Run against the isolated integrated build, including the accepted dismissal-ordering follow-up.
const report={at:new Date().toISOString(),filters:{engine:process.env.ENGINE??null,scenario:process.env.SCENARIO??null},expectedChecks:process.env.ENGINE&&process.env.SCENARIO?1:20,basis:'Isolated integrated route-entry build, including accepted dismissal ordering; deterministic request holds/failures, not performance measurements',checks:[]};
const receipt=JSON.parse(await readFile('artifacts/scoped-registry-phase-4-closeout/integrated/receipt.json'));
let optional;
for(const asset of receipt.assets.filter(a=>/assets\/command-palette-.*\.js$/.test(a.path))){
 const source=await readFile('artifacts/scoped-registry-phase-4-closeout/integrated/site/'+asset.path,'utf8');
 if(source.includes('as commandPaletteDefinition')&&source.length<300)optional='/'+asset.path;
}
assert(optional);
await exclusiveBrowserWork(async()=>{
 const server=await serve('../scoped-registry-phase-4-closeout/integrated');
 try{for(const [engineName,engine] of Object.entries({chromium,firefox,webkit})){
  if(process.env.ENGINE&&process.env.ENGINE!==engineName)continue;
  const browser=await engine.launch();
  try{for(const scenario of ['pending-dedup','escape','move-focus','disconnect','navigate','failed-preparation-retry',...(engineName==='firefox'?[]:['touch-pending'])]){
   if(process.env.SCENARIO&&process.env.SCENARIO!==scenario)continue;
   const context=await browser.newContext({ignoreHTTPSErrors:true,...(scenario==='touch-pending'?{viewport:{width:390,height:844},hasTouch:true,isMobile:true}:{})});
   await context.addInitScript(()=>{window.__retryClicks=0;window.__retryErrors=[];document.addEventListener('click',e=>{if(e.composedPath().some(n=>n?.id==='settings-command-trigger'))window.__retryClicks++;},true);window.addEventListener('vite:preloadError',e=>window.__retryErrors.push(String(e.payload)));});
   const page=await context.newPage(),errors=[];page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));
   let release,seen,handled;const gate=new Promise(r=>release=r),requested=new Promise(r=>seen=r),settled=new Promise(r=>handled=r);let requests=0,recovery;
   await page.route('**'+optional,async route=>{requests++;seen();if(requests===1){await gate;if(scenario==='failed-preparation-retry')await route.abort('failed');else await route.continue();handled();}else await route.continue();});
   try{
    await page.goto(server.url+'/workflows/settings.html',{waitUntil:'domcontentloaded'});
    await requested;
    await page.waitForFunction(()=>customElements.get('en-workflows-app')&&!document.querySelector('en-workflows-app')?.hasAttribute('data-ssr'));
    await page.evaluate(async()=>{await document.querySelector('en-workflows-app').updateComplete;window.__paletteForReview=document.querySelector('#settings-command-palette');});
    const trigger=page.getByRole('button',{name:'Search commands',exact:true}),status=page.locator('#settings-command-status'),host=page.locator('#settings-command-trigger');
    const press=async()=>{const before=await page.evaluate(()=>window.__retryClicks);await trigger.press('Enter');await page.waitForFunction(n=>window.__retryClicks>n,before);};
    assert.equal(await page.evaluate(()=>!!customElements.get('en-command-palette')),false);
    await expect(status).toBeEmpty();await expect(host).toHaveAttribute('aria-busy','false');
    if(scenario==='failed-preparation-retry'){
     release();await settled;await page.waitForTimeout(100);
     // A speculative failure is quiet. First explicit action may report the cached
     // failure; a further explicit action retries it. Do not synthesize recovery.
     await expect(status).toBeEmpty();await expect(host).toHaveAttribute('aria-busy','false');
     await press();
     await page.waitForFunction(()=>document.querySelector('#settings-command-palette')?.open||document.querySelector('#settings-command-status')?.textContent.includes('could not load'));
     let importerFailuresBeforeRetry;
     if(!await page.evaluate(()=>document.querySelector('#settings-command-palette').open)){
      importerFailuresBeforeRetry=await page.evaluate(()=>window.__retryErrors.length);
      await expect(host).toHaveAttribute('aria-busy','false');await press();
     }
     await page.waitForFunction(()=>document.querySelector('#settings-command-palette')?.open||document.querySelector('#settings-command-status')?.textContent.includes('could not load'));
     if(await page.evaluate(()=>document.querySelector('#settings-command-palette').open)){
      recovery='explicit retry recovered';assert.equal(requests,2);
     }else{
      await expect(host).toHaveAttribute('aria-busy','false');await expect(trigger).toBeFocused();await expect(page.getByRole('button',{name:'Save settings',exact:true})).toBeEnabled();
      // Explicit retry must re-execute the production importer, not merely
      // redisplay a library-cached rejection. Some import paths still reject
      // without issuing another fetch; that platform boundary is reported.
      const importerFailures=await page.evaluate(()=>window.__retryErrors);
      assert(importerFailures.length>importerFailuresBeforeRetry,'Explicit retry never re-executed the production importer');
      assert.equal(requests,1,'Recovery transport is healthy; unexpected fresh request failure');
      recovery={kind:'production import path rejected again without a new fetch',importerFailures,requestsBeforeReload:requests};
      // This navigation is a TEST action, never automatic production recovery.
      await page.reload({waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>customElements.get('en-workflows-app')&&!document.querySelector('en-workflows-app')?.hasAttribute('data-ssr'));
      await page.evaluate(async()=>{await document.querySelector('en-workflows-app').updateComplete;});
      await press();
      await page.waitForFunction(()=>document.querySelector('#settings-command-palette')?.open||document.querySelector('#settings-command-status')?.textContent.includes('could not load'));
      if(await page.evaluate(()=>document.querySelector('#settings-command-palette').open))recovery.documentReload='recovered';
      else{
       recovery.documentReload='still rejected';
       await expect(host).toHaveAttribute('aria-busy','false');await expect(page.getByRole('button',{name:'Save settings',exact:true})).toBeEnabled();
       const fresh=await browser.newContext({ignoreHTTPSErrors:true});
       try{const fp=await fresh.newPage();await fp.goto(server.url+'/workflows/settings.html');await fp.waitForFunction(()=>customElements.get('en-workflows-app')&&!document.querySelector('en-workflows-app')?.hasAttribute('data-ssr'));await fp.evaluate(async()=>{await document.querySelector('en-workflows-app').updateComplete;});const ft=fp.getByRole('button',{name:'Search commands',exact:true});await ft.press('Enter');await expect(fp.getByRole('combobox',{name:'Find a settings command'})).toBeFocused();await fp.keyboard.press('Escape');await expect(ft).toBeFocused();recovery.freshBrowsingContext='recovered';}finally{await fresh.close();}
      }
     }
     if(recovery?.documentReload!=='still rejected')await expect(page.getByRole('combobox',{name:'Find a settings command'})).toBeFocused();
    }else{
     if(scenario==='touch-pending')await trigger.tap();else await trigger.press('Enter');
     await expect(status).toHaveText('Loading command search…');await expect(host).toHaveAttribute('aria-busy','true');
     if(scenario==='pending-dedup')await trigger.press('Enter');
     if(scenario==='escape')await page.keyboard.press('Escape');
     if(scenario==='move-focus')await page.getByRole('button',{name:'Save settings',exact:true}).focus();
     if(scenario==='disconnect')await page.evaluate(()=>document.querySelector('en-workflows-app').remove());
     if(scenario==='navigate'){
      await page.goto('about:blank');release();await settled;await page.waitForTimeout(100);assert.equal(await page.locator('en-workflows-app').count(),0);
     }else{
      release();await settled;await page.waitForFunction(()=>!!customElements.get('en-command-palette'));
      await page.evaluate(async()=>{await window.__paletteForReview.updateComplete;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
      if(['pending-dedup','touch-pending'].includes(scenario))await expect(page.getByRole('combobox',{name:'Find a settings command'})).toBeFocused();
      else{await expect(page.getByRole('dialog',{name:'Settings commands'})).not.toBeVisible();assert.equal(await page.evaluate(()=>!!window.__paletteForReview.open),false);}
      if(scenario!=='disconnect'){await expect(host).toHaveAttribute('aria-busy','false');await expect(status).toBeEmpty();}
      if(scenario==='move-focus')await expect(page.getByRole('button',{name:'Save settings',exact:true})).toBeFocused();
      if(scenario==='escape'){await trigger.press('Enter');await expect(page.getByRole('combobox',{name:'Find a settings command'})).toBeFocused();}
     }
     assert.equal(requests,1,'Preparation and activation share a single import request');
    }
    if(['pending-dedup','touch-pending','escape','failed-preparation-retry'].includes(scenario)&&recovery?.documentReload!=='still rejected'){
     await page.getByRole('combobox',{name:'Find a settings command'}).fill('opacity');await expect(page.getByRole('option',{name:'Restore saved opacity'})).toBeVisible();
     await page.keyboard.press('Escape');await expect(trigger).toBeFocused();
    }
    assert.deepEqual(errors,[]);
    report.checks.push({engine:engineName,scenario,status:'passed',optionalRequests:requests,...(recovery?{recovery}:{})});console.log(engineName,scenario,'passed');
   }catch(error){report.checks.push({engine:engineName,scenario,status:'failed',optionalRequests:requests,state:await page.evaluate(()=>({clicks:window.__retryClicks,preloadErrors:window.__retryErrors,status:document.querySelector('#settings-command-status')?.textContent,busy:document.querySelector('#settings-command-trigger')?.getAttribute('aria-busy'),defined:!!customElements.get('en-command-palette'),open:document.querySelector('#settings-command-palette')?.open})).catch(()=>null),error:String(error)});throw error;}finally{release();await context.close();}
  }}finally{await browser.close();}
 }}finally{await server.close();}
}).finally(async()=>{report.passed=report.checks.filter(x=>x.status==='passed').length;report.failed=report.checks.filter(x=>x.status==='failed').length;report.status=report.failed?'failed':report.checks.length===report.expectedChecks?'passed':'not_run';await writeFile('artifacts/scoped-registry-phase-4-closeout/functional.json',JSON.stringify(report,null,2)+'\n');});
