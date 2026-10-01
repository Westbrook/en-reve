import assert from 'node:assert/strict';
import {writeFile,mkdir,appendFile} from 'node:fs/promises';
import {appendFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {connect} from 'node:http2';
import os from 'node:os';
import {chromium,firefox,webkit} from '@playwright/test';
import {serve} from '../scoped-hydration/production/server.mjs';
import {exclusiveBrowserWork} from '../../showcases/performance/src/lock.mjs';
import {executionRuntimeIdentity} from '../../tooling/testing/runtime-identity.mjs';
import {acquisitionInstallation} from '../lazy-delivery-families/performance-common.mjs';
import {digest,digestFile} from '../lazy-delivery-performance/source-seal.mjs';
import {root,route,arg,randomizer,loadPreparation,requiredHarnessPaths,waitUntilReady,settle,routeEntry,observedScripts} from './common.mjs';

assert(arg('prepared'),'Supply --prepared with frozen actual-docs arms');
const prepared=resolve(arg('prepared')),outArgument=arg('out',process.env.EN_EXECUTION_OUTPUT);
assert(outArgument,'Supply a fresh --out or EN_EXECUTION_OUTPUT');const out=resolve(outArgument);
assert(!existsSync(out),'Output must not exist');await mkdir(out,{recursive:true});
const qualification=process.argv.includes('--qualification'),n=Number(arg('n',qualification?'1':'100'));
assert(Number.isSafeInteger(n)&&n>0&&(qualification||n>=100),'Timing evidence requires at least 100 samples per cell');
const seed=Number(arg('seed','20260928'));assert(Number.isSafeInteger(seed));const shuffled=randomizer(seed);
const allConfigs=[...['chromium','firefox','webkit'].flatMap(browser=>['desktop','phone'].map(profile=>({browser,profile}))),{browser:'chromium',profile:'constrained'}];
const selected=arg('configs','all'),configs=allConfigs.filter(config=>selected==='all'||selected.split(',').includes(`${config.browser}:${config.profile}`));
assert(configs.length,'No configurations selected');if(selected!=='all')assert.equal(configs.length,new Set(selected.split(',')).size,'Unknown/repeated configuration');
const jobs=[];
const script='probes/lazy-delivery-editor/timing.mjs';
const paths=[...new Set([script,...requiredHarnessPaths,'probes/lazy-delivery-families/family-adapters.mjs','probes/lazy-delivery-families/browser-probe.mjs','probes/lazy-delivery-families/command-probe.mjs','probes/lazy-delivery-families/pagination-probe.mjs'])];
const harnessIdentity=async()=>{
 const observations=await Promise.allSettled(paths.map(async path=>({path,sha256:await digestFile(resolve(root,path))})));
 const errors=observations.flatMap(observation=>observation.status==='rejected'?[observation.reason]:[]);
 if(errors.length)throw new AggregateError(errors,'Could not fingerprint every timing harness file');
 return observations.map(observation=>observation.value);
};
const runtimeConfigurations=[{config:script,discovery:{projects:[...new Set(configs.map(config=>config.browser))].map(browserName=>({use:{browserName}}))}}];
const raw=resolve(out,'samples.jsonl');let activeJob=null,activeBrowser=null,aborted=false,succeeded=0,terminal=0;const verification={};
const record=value=>appendFile(raw,JSON.stringify({at:new Date().toISOString(),...value})+'\n');
const interrupted=signal=>{aborted=true;appendFileSync(raw,JSON.stringify({at:new Date().toISOString(),status:'aborted',signal,job:activeJob})+'\n');void activeBrowser?.close();};
const sigint=()=>interrupted('SIGINT'),sigterm=()=>interrupted('SIGTERM');process.once('SIGINT',sigint);process.once('SIGTERM',sigterm);
async function warm(url){const client=connect(url,{rejectUnauthorized:false});try{await new Promise((done,reject)=>{client.once('error',reject);const request=client.request({':path':route});request.on('data',()=>{});request.once('error',reject);request.once('end',done);request.end();});}finally{client.close();}}
async function installStudy(page){await page.addInitScript(()=>{
 performance.setResourceTimingBufferSize(2000);
 const study=window.editorTiming={startup:null,placementRevision:0};
 const deepActive=()=>{let node=document.activeElement;while(node?.shadowRoot?.activeElement)node=node.shadowRoot.activeElement;return node;};
 const count=root=>{let total=0;const visit=node=>{total++;for(const child of node.childNodes)visit(child);if(node.shadowRoot)visit(node.shadowRoot);};if(root)visit(root);return total;};
 const descendantsSettled=root=>{const roots=[root];while(roots.length)for(const element of roots.pop().querySelectorAll('*')){if(element.isUpdatePending)return false;if(element.shadowRoot)roots.push(element.shadowRoot);}return true;};
 const elements=()=>{const editor=document.querySelector('#rich-brief'),toolbar=document.querySelector('#selection-toolbar'),live=editor?.shadowRoot?.querySelector('[contenteditable=true]'),base=toolbar?.shadowRoot?.querySelector('.base'),command=toolbar?.shadowRoot?.querySelector('en-button'),button=command?.shadowRoot?.querySelector('button');return {editor,toolbar,live,base,command,button};};
 const resources=()=>performance.getEntriesByType('resource').map(entry=>({name:entry.name,initiatorType:entry.initiatorType,startTime:entry.startTime,duration:entry.duration,encodedBodySize:entry.encodedBodySize,decodedBodySize:entry.decodedBodySize,transferSize:entry.transferSize,nextHopProtocol:entry.nextHopProtocol}));
 study.resources=resources;
 const initial=()=>{
  const {editor,toolbar,live}=elements(),app=document.querySelector('en-api-example-app');
  if(!live||!app||app.hasAttribute('data-ssr')||!document.documentElement.hasAttribute('data-example-standalone')||!toolbar?.hasUpdated||!descendantsSettled(document)){requestAnimationFrame(initial);return;}
  const startupMs=performance.now();const registry=toolbar.shadowRoot.customElementRegistry;
  new MutationObserver(()=>{study.placementRevision++;}).observe(toolbar.shadowRoot.querySelector('.base'),{attributes:true,attributeFilter:['style']});
  study.startup={startupMs,startupRouteNodes:count(document),startupToolbarNodes:count(toolbar),generatedNodes:count(toolbar.shadowRoot.querySelector('en-toolbar')),contentRendering:toolbar.contentRendering??'baseline-eager',actualRegistry:registry===undefined?'global-not-exposed':registry===customElements?'global':'unexpected-scoped',nativeEditable:live.getAttribute('contenteditable'),resources:resources()};
 };
 requestAnimationFrame(initial);
 const observe=(start,ready,deadline=20000)=>new Promise((done,reject)=>{const check=()=>{try{if(ready())done(performance.now()-start);else if(performance.now()-start>deadline)reject(new Error('Action readiness timeout'));else requestAnimationFrame(check);}catch(error){reject(error);}};requestAnimationFrame(check);});
 const commandsReady=()=>{const {toolbar,base,command,button}=elements();if(!toolbar||!base||!command||!button)return false;const box=base.getBoundingClientRect();return base.matches(':popover-open')&&base.style.left!==''&&base.style.top!==''&&box.width>0&&box.height>0&&getComputedStyle(base).visibility!=='hidden'&&!command.disabled&&!button.disabled&&descendantsSettled(toolbar.shadowRoot);};
 study.select=async backward=>{
  const {editor,toolbar,live}=elements();if(!live)throw new Error('Real editor not ready');const node=live.querySelector('p')?.firstChild;if(!node)throw new Error('Missing text node');const length=node.textContent.length,selection=document.getSelection(),placementBefore=study.placementRevision,start=performance.now();
  selection.setBaseAndExtent(node,backward?length:0,node,backward?0:length);
  const elapsed=await observe(start,()=>editor.hasSelection&&study.placementRevision>placementBefore&&commandsReady());
  if(deepActive()!==live)throw new Error('Selection activation stole editor focus');
  if(elements().live!==live)throw new Error('Selection activation replaced the editor');
  const generated=toolbar.shadowRoot.querySelector('en-toolbar');if(study.controls&&study.controls.deref()!==generated)throw new Error('Repeat replaced the generated toolbar');study.controls??=new WeakRef(generated);
  return {elapsed,selection:selection.toString(),focusedEditor:true,position:toolbar.shadowRoot.querySelector('.base').getBoundingClientRect().toJSON(),placement:toolbar.shadowRoot.querySelector('.base').dataset.placement};
 };
 study.coldFocus=async()=>{
  const {editor,toolbar,live}=elements(),node=live.querySelector('p')?.firstChild;if(!node)throw new Error('Missing real editor text');
  const selectionStart=performance.now(),placementBefore=study.placementRevision;let requested=false,timer;
  return new Promise((done,reject)=>{
   const cleanup=()=>{clearTimeout(timer);editor.removeEventListener('en-editor-state',request);};
   const request=()=>{
    if(requested||!editor.hasSelection)return;requested=true;cleanup();
    const controlsPresentAtRequest=!!toolbar.shadowRoot.querySelector('en-toolbar'),start=performance.now();
    toolbar.focus({preventScroll:true});
    observe(start,()=>study.placementRevision>placementBefore&&commandsReady()&&deepActive()===elements().button).then(elapsed=>{
     if(elements().live!==live)throw new Error('First focus replaced the editor');
     done({elapsed,selectionToFocusMs:performance.now()-selectionStart,controlsPresentAtRequest,action:'en-editor-toolbar.focus({preventScroll:true}) in first eligible en-editor-state event',focusedFirstCommand:true});
    }).catch(reject);
   };
   editor.addEventListener('en-editor-state',request);timer=setTimeout(()=>{cleanup();reject(new Error('Eligible editor-state event timeout'));},20000);
   document.getSelection().setBaseAndExtent(node,0,node,node.textContent.length);request();
  });
 };
});}
async function setupSelection(page,text){
 const editor=page.locator('#rich-brief'),textbox=editor.getByRole('textbox');
 await editor.evaluate((element,value)=>{element.value=value;element.focus();},text);
 await textbox.scrollIntoViewIfNeeded();await settle(page);
 assert.equal(await editor.evaluate(element=>element.hasSelection),false,'Setup must leave no eligible selection');
}
try{
 await exclusiveBrowserWork(async()=>{
  let input,harness,runtime,installation,installationPreparedBefore=false;
  try{
   const before=await Promise.allSettled([loadPreparation(prepared),harnessIdentity(),executionRuntimeIdentity(root,runtimeConfigurations),acquisitionInstallation(script,root)]);
   const preflightErrors=[];
   for(const [index,name] of ['preparation','harness','runtime','installation'].entries())if(before[index].status==='rejected'){
    verification[name+'BeforeError']={message:String(before[index].reason),stack:before[index].reason?.stack};preflightErrors.push(before[index].reason);
   }
   input=before[0].status==='fulfilled'?before[0].value:undefined;
   harness=before[1].status==='fulfilled'?before[1].value:undefined;
   runtime=before[2].status==='fulfilled'?before[2].value:undefined;
   installation=before[3].status==='fulfilled'?before[3].value:undefined;
   if(input&&installation)try{await input.verifyInstallation(installation);installationPreparedBefore=true;}
   catch(error){verification.installationPreparedBeforeError={message:String(error),stack:error.stack};preflightErrors.push(error);}
   const arms=input?.arms??[];
   for(let block=0;block<n;block++)for(const config of shuffled(configs))for(const arm of shuffled(arms))jobs.push({id:`${block}-${config.browser}-${config.profile}-${arm.id}`,arm:arm.id,browser:config.browser,profile:config.profile,block});
   const manifest={schemaVersion:1,kind:'timing',startedAt:new Date().toISOString(),qualification,n,seed,route,requestedRegistry:'production-global',actualRegistry:'global',registryApplicability:'The real consumer explicitly registers globally. Auto/scoped component evidence is separate; no inert query modes.',configs,jobs,arms,preparation:input?.identity??null,harness:harness??null,runtime:runtime??null,installation:installation??null,host:{node:process.version,cpu:os.cpus()[0]?.model,platform:os.platform(),release:os.release(),arch:os.arch()},protocol:{readiness:'Native selection to visible, positioned, enabled contextual commands with original editor focus; a separate fresh page requests native toolbar.focus during the first eligible editor-state event before deferred rendering.',startup:'Navigation time origin to real editable editor, updated toolbars and activated route; count nodes after readiness.',unusedObservationMs:500,settledObservationMs:500,constrained:{cpuRate:4,network:'unchanged local HTTP/2; editor protocol specifies CPU-only constraint'},input:'Desktop native Selection/Range plus native focus API. Phone is a viewport cell, not physical-device or touch-selection evidence.',sources:input?.preparation.sources??null}};
   await writeFile(resolve(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
   if(preflightErrors.length)throw new AggregateError(preflightErrors,'Timing preflight identity verification failed; no browsers were launched');
   assert(installationPreparedBefore,'Timing installation must match the fresh prepared runtime before acquisition');
   assert(!aborted,'Acquisition aborted');
   const {receiptFor}=input;
   const servers=new Map();try{
   for(const arm of arms){const server=await serve(arm.root??arm.id,0,prepared);servers.set(arm.id,server);await warm(server.url);}
   for(const job of jobs){
    assert(!aborted,'Acquisition aborted');activeJob=job;await record({status:'started',job});let page;const errors=[],failures=[];
    try{
     const arm=arms.find(arm=>arm.id===job.arm),receipt=receiptFor(arm),entry=routeEntry(receipt),server=servers.get(job.arm);
     const browser=activeBrowser=await ({chromium,firefox,webkit})[job.browser].launch();
     const context=await browser.newContext({ignoreHTTPSErrors:true,serviceWorkers:'block',viewport:job.profile==='phone'?{width:390,height:844}:{width:1280,height:900},reducedMotion:'reduce'});
     page=await context.newPage();page.setDefaultTimeout(20000);page.on('pageerror',error=>errors.push(error.message));page.on('requestfailed',request=>failures.push({url:request.url(),error:request.failure()?.errorText}));page.on('response',response=>{if(response.status()>=400)failures.push({url:response.url(),status:response.status()});});
     if(job.profile==='constrained'){const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});}
     await installStudy(page);await page.goto(server.url+route,{waitUntil:'domcontentloaded'});await waitUntilReady(page);await page.waitForFunction(()=>window.editorTiming?.startup);
     const initial=await page.evaluate(()=>editorTiming.startup);assert(['global','global-not-exposed'].includes(initial.actualRegistry),'Actual route scope changed');
     assert.equal(initial.contentRendering,job.arm==='candidate'?'on-demand':job.arm==='reference'?'baseline-eager':'eager','Unexpected arm policy');
     if(job.arm==='candidate')assert.equal(initial.generatedNodes,0,'Candidate constructed unused controls');else assert(initial.generatedNodes>100,'Eager control absent');
     await page.waitForTimeout(500);const unused=observedScripts(await page.evaluate(()=>editorTiming.resources()),receipt,server.url);
     await setupSelection(page,'Alpha beta');const first=await page.evaluate(()=>editorTiming.select(false));
     await page.locator('#selection-toolbar').evaluate(toolbar=>toolbar.focus());await page.keyboard.press('Escape');
     await page.locator('#rich-brief').getByRole('textbox').press('ArrowRight');
     await setupSelection(page,'Gamma delta');const second=await page.evaluate(()=>editorTiming.select(true));
     await page.waitForTimeout(500);const settled=observedScripts(await page.evaluate(()=>editorTiming.resources()),receipt,server.url);
     // Cold explicit focus owns a separate fresh browser/context; the first page's
     // automatic selection construction must not turn this metric into warm focus.
     await activeBrowser.close();activeBrowser=null;
     const focusBrowser=activeBrowser=await ({chromium,firefox,webkit})[job.browser].launch();
     const focusContext=await focusBrowser.newContext({ignoreHTTPSErrors:true,serviceWorkers:'block',viewport:job.profile==='phone'?{width:390,height:844}:{width:1280,height:900},reducedMotion:'reduce'});
     page=await focusContext.newPage();page.setDefaultTimeout(20000);page.on('pageerror',error=>errors.push(error.message));page.on('requestfailed',request=>failures.push({url:request.url(),error:request.failure()?.errorText}));page.on('response',response=>{if(response.status()>=400)failures.push({url:response.url(),status:response.status()});});
     if(job.profile==='constrained'){const cdp=await focusContext.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});}
     await installStudy(page);await page.goto(server.url+route,{waitUntil:'domcontentloaded'});await waitUntilReady(page);await page.waitForFunction(()=>window.editorTiming?.startup);
     const focusInitial=await page.evaluate(()=>editorTiming.startup);await setupSelection(page,'Cold focus passage');
     const focus=await page.evaluate(()=>editorTiming.coldFocus());
     assert.equal(focus.controlsPresentAtRequest,job.arm!=='candidate','Explicit focus must measure the cold generated-control branch');
     assert.deepEqual(errors,[],'Browser error');assert.deepEqual(failures,[],'Request failure');
     assert(settled.resources.filter(resource=>resource.name.endsWith('.js')).every(resource=>resource.nextHopProtocol==='h2'),'Expected HTTP/2 scripts');
     const metrics={startupMs:initial.startupMs,firstSelectionMs:first.elapsed,focusMs:focus.elapsed,repeatSelectionMs:second.elapsed,startupToolbarNodes:initial.startupToolbarNodes,startupRouteNodes:initial.startupRouteNodes,entryGzipBytes:entry.gzipBytes,settledGzipBytes:settled.gzipBytes,entryRequests:entry.requests,settledRequests:settled.requests};
     await record({status:'ok',job,requestedRegistry:'production-global',actualRegistry:'global',browserVersion:browser.version(),metrics,initial,entry,unused,first,focusInitial,focus,second,settled,errors,failures});succeeded++;terminal++;console.log(`${succeeded}/${jobs.length} ${job.arm} ${job.browser}/${job.profile}`);
    }catch(error){terminal++;await record({status:aborted?'aborted':'failed',job,requestedRegistry:'production-global',actualRegistry:'global',error:String(error),stack:error.stack,errors,failures});if(page)await page.screenshot({path:resolve(out,'failure.png')}).catch(()=>{});throw error;}
    finally{await activeBrowser?.close();activeBrowser=null;activeJob=null;}
   }
   }finally{for(const server of servers.values())await server.close();}
  }catch(error){verification.acquisitionError={message:String(error),stack:error.stack};process.exitCode=1;}
  finally{
   const after=await Promise.allSettled([input?input.verify():loadPreparation(prepared),harnessIdentity(),executionRuntimeIdentity(root,runtimeConfigurations),acquisitionInstallation(script,root)]);
   for(const [index,name] of ['preparation','harness','runtime','installation'].entries())if(after[index].status==='rejected'){
    verification[name+'Error']=String(after[index].reason);process.exitCode=1;
   }
   if(after[0].status==='fulfilled')try{assert(input,'No verified preparation baseline is available');verification.preparationUnchanged=true;}
   catch(error){verification.preparationError=String(error);process.exitCode=1;}
   if(after[1].status==='fulfilled')try{verification.harnessAfter=after[1].value;assert(harness,'No verified harness baseline is available');assert.equal(digest(verification.harnessAfter),digest(harness),'Harness changed');verification.harnessUnchanged=true;}
   catch(error){verification.harnessError=String(error);process.exitCode=1;}
   if(after[2].status==='fulfilled')try{verification.runtimeAfter=after[2].value;assert(runtime,'No verified runtime baseline is available');assert.equal(verification.runtimeAfter.digest,runtime.digest,'Runtime changed');verification.runtimeUnchanged=true;}
   catch(error){verification.runtimeError=String(error);process.exitCode=1;}
   if(after[3].status==='fulfilled'){
    verification.installationAfter=after[3].value;
    try{assert(installation,'No verified installation baseline is available');assert.equal(verification.installationAfter.digest,installation.digest,'Installed acquisition driver closure changed');verification.installationUnchanged=true;}
    catch(error){verification.installationError=String(error);process.exitCode=1;}
    try{
     const preparedAfter=input??(after[0].status==='fulfilled'?after[0].value:undefined);
     assert(preparedAfter,'No verified preparation is available for the post-run installation binding');
     await preparedAfter.verifyInstallation(verification.installationAfter);
     assert(installationPreparedBefore,'Installation was not bound to the prepared runtime before acquisition');verification.installationPreparedMatch=true;
    }catch(error){verification.installationPreparedError=String(error);process.exitCode=1;}
   }
   const status=aborted?'aborted':verification.acquisitionError||verification.preparationError||verification.harnessError||verification.runtimeError||verification.installationError||verification.installationPreparedError?'incomplete':'complete';
   if(status!=='complete')process.exitCode=1;
   await writeFile(resolve(out,'summary.json'),JSON.stringify({status,qualification,planned:jobs.length,succeeded,terminal,verification,finishedAt:new Date().toISOString()},null,2)+'\n');
  }
 },{workspaceRoot:root});
}finally{
 process.removeListener('SIGINT',sigint);process.removeListener('SIGTERM',sigterm);
}
