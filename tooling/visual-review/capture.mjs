import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname,basename} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {chromium,firefox,webkit,expect} from '@playwright/test';
import {inspectBuild} from '../offline-review/build.mjs';
import {CaptureCacheBatch} from './cache-batch.mjs';
import {executionRuntimeIdentity} from '../testing/runtime-identity.mjs';
import {EvidenceCache} from '../evidence/cache.ts';
import {digestBytes,digestJson,renderingIdentity,comparisonIdentity,reviewIdentity} from '../evidence/identity.ts';
import {selectCandidateImpact} from '../evidence/impact-client.mjs';
import {readEnvelope,createPlan,comparisonSettings,captureExitCode} from './plan.mjs';
import {fontInventory,environmentIdentity} from './environment.mjs';
import {comparePixels} from './pixels.mjs';

const types={chromium,firefox,webkit};
const origin='https://en-reve-review.invalid';
const scaffold='<!doctype html><html><head><style>html,body{margin:0;width:100%;height:100%;overflow:hidden}iframe{display:block;border:0;width:100%;height:100%}</style></head><body><iframe title="Candidate capture"></iframe></body></html>';
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.webp':'image/webp','.ico':'image/x-icon'};
const fixedTime='2026-09-15T12:00:00.000Z';
const readiness={hydrated:true,fonts:'document.fonts.ready',images:'decode',settleFrames:2,fixedTime};
const captureOptions={animations:'disabled',caret:'hide',scale:'css',type:'png',timeout:20000};
const producerFiles=['capture.mjs','plan.mjs','environment.mjs','cache-batch.mjs'];

async function routedContext(browser,snapshot,viewport,appearance) {
 const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},deviceScaleFactor:1,locale:'en-US',timezoneId:'UTC',colorScheme:appearance,reducedMotion:'reduce',forcedColors:'none',serviceWorkers:'block'});
 const failures=[];const assets=new Map(snapshot.assets.map(a=>[a.path,a]));
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.origin!==origin){failures.push('External request blocked: '+url.href);await route.abort();return;}
  if(url.pathname==='/__visual-review'){await route.fulfill({contentType:'text/html',body:scaffold});return;}
  let path=decodeURIComponent(url.pathname).replace(/^\//,'')||'index.html';
  if(!assets.has(path)&&assets.has(path+'.html'))path+='.html';
  const asset=assets.get(path);
  if(!asset){failures.push('Unknown build asset: '+url.pathname);await route.abort();return;}
  const bytes=await readFile(resolve(snapshot.buildRoot,path));
  if(digestBytes(bytes)!==asset.sha256){failures.push('Build changed: '+path);await route.abort();return;}
  await route.fulfill({contentType:mime[extname(path)]??'application/octet-stream',body:bytes});
 });
 context.on('page',page=>page.on('pageerror',error=>failures.push(error.message)));
 return {context,failures};
}
async function validateInBuild(browser,snapshot,candidate) {
 const {context,failures}=await routedContext(browser,snapshot,{width:1280,height:900},candidate.appearances[0]);
 try {
  const page=await context.newPage();await page.goto(origin+'/theme-review');
  await expect(page.getByRole('button',{name:'Export candidate',exact:true})).toBeEnabled();
  await page.getByLabel('Reopen candidate',{exact:true}).setInputFiles({name:'candidate.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(candidate.envelope))});
  await expect(page.getByText('Candidate reopened. Undo returns to your previous draft.',{exact:true})).toBeVisible();
  if(failures.length)throw new Error(failures.join('\n'));
 } finally {await context.close();}
}
async function screenshot(browser,snapshot,candidate,row) {
 const {context,failures}=await routedContext(browser,snapshot,row.viewport,row.appearance);
 try {
  const page=await context.newPage();await page.clock.setFixedTime(new Date(fixedTime));await page.goto(origin+'/__visual-review');
  const path=snapshot.build.pages.find(p=>p.id===row.fixture.page).path;
  await page.evaluate(({path,request})=>{
   const frame=document.querySelector('iframe');window.captureReply=null;
   addEventListener('message',event=>{
    if(event.source!==frame.contentWindow||event.origin!==location.origin)return;
    if(event.data.type==='en-theme-preview-listening')frame.contentWindow.postMessage(request,location.origin);
    else if(event.data.requestId===request.requestId)window.captureReply=event.data;
   });const url=new URL(path,location.origin);url.searchParams.set('theme-preview','');frame.src=url.href;
  },{path,request:{type:'en-theme-preview',requestId:'visual-capture',draftJSON:JSON.stringify(candidate.envelope.draft),appearance:row.appearance,direction:'ltr',buildFingerprint:snapshot.build.fingerprint}});
  await page.waitForFunction(()=>window.captureReply!==null,{},{timeout:20000});
  const reply=await page.evaluate(()=>window.captureReply);
  if(reply.type!=='en-theme-preview-ready'||reply.sourceHash!==candidate.sourceHash||reply.buildFingerprint!==snapshot.build.fingerprint||reply.effectiveMode!==row.appearance)throw new Error('Preview did not accept the exact candidate: '+JSON.stringify(reply));
  const frame=page.frames().find(f=>f.parentFrame()===page.mainFrame());
  const target=frame.locator(row.fixture.selector);await expect(target).toHaveCount(1);await target.scrollIntoViewIfNeeded();
  // Scroll activates the real lazy specimens; wait for rendered custom controls,
  // rather than capturing SSR placeholders and calling them hydrated evidence.
  await target.evaluate(async root=>{
   const visit=async element=>{if(element.localName.includes('-')){await customElements.whenDefined(element.localName);if(element.updateComplete)await element.updateComplete;}for(const child of element.children)await visit(child);if(element.shadowRoot)for(const child of element.shadowRoot.children)await visit(child);};
   await Promise.race([visit(root),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Custom-element readiness timed out.')),20000))]);
  });
  for(const action of row.fixture.actions){const element=frame.locator(action.selector);if(['fill','press','select'].includes(action.kind))await element[action.kind==='select'?'selectOption':action.kind](action.value,{timeout:10000});else await element[action.kind]({timeout:10000});}
  await frame.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(image=>image.currentSrc).map(image=>image.decode()));await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
  const box=await target.boundingBox();if(!box||box.width*box.height>32_000_000)throw new Error('Capture target is absent or exceeds32 million pixels.');
  const bytes=await target.screenshot(captureOptions);
  if(failures.length)throw new Error(failures.join('\n'));
  return {bytes,reply,box};
 } finally {await context.close();}
}

/** Reusable producer. CLI owns leases; Playwright tests call it under their lease. */
export async function captureReview({buildDirectory,baselineFile,candidateFile,outputDirectory,cacheDirectory,options={},browsers={}}) {
 const output=resolve(outputDirectory),buildRoot=resolve(buildDirectory);
 if(output===buildRoot||output.startsWith(buildRoot+'/')||buildRoot.startsWith(output+'/'))throw new Error('Output must be separate from the build.');
 const cachePath=resolve(cacheDirectory??output+'/cache');
 if(cachePath===buildRoot||cachePath.startsWith(buildRoot+'/'))throw new Error('Cache must be outside the immutable build.');
 const snapshot=await inspectBuild(buildRoot);
 const baseline=readEnvelope(await readFile(baselineFile,'utf8'),snapshot.build),candidate=readEnvelope(await readFile(candidateFile,'utf8'),snapshot.build);
 const plan=createPlan(snapshot.build,baseline,candidate,options),settings=comparisonSettings(options.comparison);
 const impact=JSON.parse(await readFile(resolve(buildRoot,'impact.json'),'utf8'));
 const changed=[...new Set([baseline,candidate].flatMap(value=>value.envelope.schemaVersion===2?Object.values(value.envelope.draft.branches).flatMap(branch=>branch.candidate.changedTokens):value.envelope.draft.candidate.changedTokens))].map(id=>'token:'+id);
 const selection=selectCandidateImpact(impact,changed);
 await mkdir(output);await mkdir(resolve(output,'artifacts'));
 const cache=new EvidenceCache(cachePath);const pendingEvidence=new CaptureCacheBatch(cache);
 const run=basename(output);const artifacts=new Map();
 const copyArtifact=async artifact=>{const bytes=await cache.readArtifact(artifact);const path='artifacts/'+artifact.digest.slice(7)+(artifact.mediaType==='image/png'?'.png':'.json');await writeFile(resolve(output,path),bytes);const value={...artifact,path};artifacts.set(path,value);return value;};
 const add=async(bytes,details)=>copyArtifact(await cache.storeArtifact(bytes,details));
 const selectionArtifact=await cache.storeArtifact(JSON.stringify(selection),{label:'Source impact selection',mediaType:'application/json'});
 const inputs=Object.fromEntries(await Promise.all(producerFiles.map(async name=>[name,digestBytes(await readFile(new URL(name,import.meta.url)))])));
 const dependencies=Object.fromEntries(await Promise.all(['../../package-lock.json','../evidence/identity.ts','../evidence/cache.ts','../evidence/impact-client.mjs','../evidence/graph-core.ts','../offline-review/build.mjs','../offline-review/runtime.mjs','../testing/runtime-identity.mjs','../testing/browser-products.mjs','../evidence/setup.mjs'].map(async name=>[name,digestBytes(await readFile(new URL(name,import.meta.url)))])));
 const runtimeConfig=[{config:'tooling/visual-review/capture.mjs',discovery:{projects:plan.engines.map(browserName=>({use:{browserName}}))}}];
 const runtime=await executionRuntimeIdentity(fileURLToPath(new URL('../../',import.meta.url)),runtimeConfig);
 const fonts=await fontInventory();
 const report={schema:'en-reve/candidate-visual-evidence',schemaVersion:1,run,createdAt:new Date().toISOString(),status:'running',buildFingerprint:snapshot.build.fingerprint,candidate:{sourceHash:candidate.sourceHash,envelopeIntegrity:candidate.integrity},baseline:{sourceHash:baseline.sourceHash,envelopeIntegrity:baseline.integrity},scope:{cases:plan.cases,selected:plan.selected,engines:plan.engines,viewports:plan.viewports,policy:'All declared rows retained; an unselected or unsupported row is not passed. Default inventory covers initial states only.'},environments:{},results:plan.rows.map(({selected,...row})=>row),artifacts:[],comparisonSettings:settings,manualAcceptance:'not-run',reviewIdentity:/** @type {ReturnType<typeof reviewIdentity>|null} */(null)};
 const persist=async()=>{report.artifacts=[...artifacts.values()];const body={...report};await writeFile(resolve(output,'evidence.json'),JSON.stringify({...body,integrity:digestJson(body)},null,2)+'\n');};
 await add(await readFile(baselineFile),{label:'Baseline export',mediaType:'application/json'});await add(await readFile(candidateFile),{label:'Candidate export',mediaType:'application/json'});await copyArtifact(selectionArtifact);await add(JSON.stringify(fonts),{label:'System font inventory',mediaType:'application/json'});await add(JSON.stringify(runtime),{label:'Installed browser runtime inventory',mediaType:'application/json'});await add(JSON.stringify(snapshot.assets),{label:'Build asset inventory',mediaType:'application/json'});await persist();
 try {
  for(const engine of plan.engines){
   const owned=!browsers[engine];let browser;
   try {
    browser=browsers[engine]??await types[engine].launch();
    const environment=await environmentIdentity(browser,types[engine],fonts,runtime);report.environments[engine]=environment;
    await validateInBuild(browser,snapshot,baseline);await validateInBuild(browser,snapshot,candidate);
    const compareContext=await browser.newContext();const comparePage=await compareContext.newPage();
    try {for(let index=0;index<plan.rows.length;index++){
     const row=plan.rows[index];if(row.engine!==engine||!row.selected||row.status==='unsupported')continue;
     const result=report.results[index];
     if(!baseline.appearances.includes(row.appearance)||!candidate.appearances.includes(row.appearance)){result.status='unsupported';result.reason='The baseline and candidate do not both supply this appearance.';continue;}
     try {
      const captures={};result.captures=captures;
      for(const [variant,subject] of [['expected',baseline],['actual',candidate]]){
       const identity=renderingIdentity({artifacts:{build:snapshot.build.fingerprint},fixture:digestJson(row.fixture),testCode:digestJson(inputs),resolvedDependencies:dependencies,theme:subject.sourceHash,assets:{inventory:digestJson(snapshot.assets)},environment,locale:'en-US',direction:'ltr',preferences:{colorScheme:row.appearance,reducedMotion:'reduce',forcedColors:'none',timezoneId:'UTC'},viewport:row.viewport,readiness,capture:captureOptions});
       const hit=fonts.complete&&options.reuse!==false?await cache.lookup(identity):{status:'miss',reason:fonts.complete?'disabled':'unverified-fonts'};
       if(hit.status==='hit')captures[variant]={identity,artifact:await copyArtifact(hit.evidence.artifacts[0]),reused:true,originatingRun:hit.evidence.originatingRun,details:hit.evidence.result};
       else{
        try {const captured=await screenshot(browser,snapshot,subject,row);const artifact=await cache.storeArtifact(captured.bytes,{label:'Rendered case',mediaType:'image/png'});const details={reply:captured.reply,box:captured.box};pendingEvidence.stage({schemaVersion:1,identity,originatingRun:run,selectionReceipt:selectionArtifact,artifacts:[artifact],outcome:'passed',result:details});captures[variant]={identity,artifact:await copyArtifact(artifact),reused:false,originatingRun:run,cacheMiss:hit.reason,details};}
        catch(error){const artifact=await cache.storeArtifact(JSON.stringify({error:String(error)}),{label:'Capture failure',mediaType:'application/json'});pendingEvidence.stage({schemaVersion:1,identity,originatingRun:run,selectionReceipt:selectionArtifact,artifacts:[artifact],outcome:'failed',result:{error:String(error)}});result.captureFailure={variant,identity,artifact:await copyArtifact(artifact),originatingRun:run};throw error;}
       }
      }
      result.captures=captures;
      const implementation=digestJson({code:digestBytes(await readFile(new URL('./pixels.mjs',import.meta.url))),decoder:environment});
      const identity=comparisonIdentity({candidateImage:captures.actual.artifact.digest,baselineImage:captures.expected.artifact.digest,implementation,settings});
      const hit=options.reuse!==false?await cache.lookup(identity):{status:'miss',reason:'disabled'};
      if(hit.status==='hit')result.comparison={identity,artifact:await copyArtifact(hit.evidence.artifacts[0]),stats:hit.evidence.result,reused:true,originatingRun:hit.evidence.originatingRun};
      else {const compared=await comparePage.evaluate(comparePixels,{expected:Buffer.from(await cache.readArtifact(captures.expected.artifact)).toString('base64'),actual:Buffer.from(await cache.readArtifact(captures.actual.artifact)).toString('base64'),settings});const {diff,...stats}=compared;const artifact=await cache.storeArtifact(Buffer.from(diff,'base64'),{label:'Pixel difference',mediaType:'image/png'});pendingEvidence.stage({schemaVersion:1,identity,originatingRun:run,selectionReceipt:selectionArtifact,artifacts:[artifact],outcome:stats.match?'passed':'failed',result:stats});result.comparison={identity,artifact:await copyArtifact(artifact),stats,reused:false,originatingRun:run,cacheMiss:hit.reason};}
      result.status=result.comparison.stats.match?'passed':'different';delete result.reason;
     }catch(error){result.status='failed';result.reason=String(error);}
     await persist();
    }}finally{await compareContext.close();}
   }catch(error){for(const row of report.results.filter((row,index)=>row.engine===engine&&plan.rows[index].selected&&row.status==='not-run')){row.status='failed';row.reason='Engine or candidate validation failed: '+String(error);}}
   finally{if(owned)await browser?.close();}
  }
  // Catch changes during capture; rendered bytes were also checked at every route.
  const finalSnapshot=await inspectBuild(buildRoot);
  if(digestJson(finalSnapshot.assets)!==digestJson(snapshot.assets))throw new Error('Build changed during capture.');
  const finalFonts=await fontInventory(),finalRuntime=await executionRuntimeIdentity(fileURLToPath(new URL('../../',import.meta.url)),runtimeConfig);
  if(fonts.digest!==finalFonts.digest||fonts.complete!==finalFonts.complete||runtime.digest!==finalRuntime.digest)throw new Error('Fonts or browser runtime changed during capture; entries were not made reusable.');
  for(const row of report.results)if(Object.values(row.captures??{}).some(capture=>pendingEvidence.unstable.has(capture.identity.digest))){row.status='failed';row.reason='Repeated identical rendering inputs produced different pixels; cache reuse is disabled for that identity.';}
  await pendingEvidence.commit();
  report.status=report.results.every(r=>r.status==='passed')?'passed':report.results.every(r=>['passed','different'].includes(r.status))?'different':'incomplete';
  report.reviewIdentity=reviewIdentity({candidate:candidate.integrity,baseline:baseline.integrity,scope:report.scope,evidence:report.results.flatMap(r=>r.comparison?[r.comparison.identity.digest]:[])});
 }catch(error){report.status='failed';report.error=String(error);}
 await persist();return report;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [buildDirectory,baselineFile,candidateFile,outputDirectory,configFile]=process.argv.slice(2);
 if(!outputDirectory)throw new Error('Usage: node tooling/visual-review/capture.mjs <original-build> <baseline.json> <candidate.json> <fresh-output> [config.json]');
 const options=configFile?JSON.parse(await readFile(configFile,'utf8')):{};
 const {withMachineOwner}=await import('../testing/machine-owner.mjs');const {withExecutionOwner}=await import('../testing/execution-owner.mjs');
 await withMachineOwner(()=>withExecutionOwner(fileURLToPath(new URL('../../',import.meta.url)),async()=>{const result=await captureReview({buildDirectory,baselineFile,candidateFile,outputDirectory,cacheDirectory:options.cacheDirectory,options});console.log(JSON.stringify({output:resolve(outputDirectory),status:result.status,counts:Object.fromEntries(['passed','different','failed','not-run','unsupported'].map(s=>[s,result.results.filter(r=>r.status===s).length]))}));process.exitCode=captureExitCode(result);}));
}
