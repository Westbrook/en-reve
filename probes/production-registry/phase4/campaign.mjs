import {chromium,firefox,webkit} from '@playwright/test';
import {mkdir,readFile,writeFile,appendFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {serve} from './server.mjs';
import {installMilestones} from '../cleanup/milestones.mjs';
import {installProbe} from '../browser-probe.mjs';
import {exclusiveBrowserWork} from '../../../showcases/performance/src/lock.mjs';
import {rng,shuffle} from '../../../showcases/performance/src/config.mjs';
const qualify=process.argv.includes('--qualify'),phases=['control','candidate'];
const run=process.argv.find(a=>a.startsWith('--run='))?.slice(6)??(qualify?'qualification':'campaign');
const base=resolve('artifacts/scoped-registry-phase-4'),out=resolve(base,run);await mkdir(out,{recursive:true});
await writeFile(resolve(out,'started.json'),JSON.stringify({at:new Date().toISOString(),qualify}),{flag:'wx'});
const sha=b=>createHash('sha256').update(b).digest('hex');
const receipts=await Promise.all(phases.map(async phase=>({...JSON.parse(await readFile(resolve(phase==='control'?'artifacts/scoped-registry-phase-3-cleanup/candidate':base+'/candidate','receipt.json'))),phase})));
for(const r of receipts)for(const a of r.assets)if(sha(await readFile(resolve(r.phase==='control'?'artifacts/scoped-registry-phase-3-cleanup/candidate/site':base+'/candidate/site',a.path)))!==a.sha256)throw Error('Build mutated');
const cells=phases.flatMap(phase=>[{phase,browser:'chromium',profile:'desktop'},{phase,browser:'webkit',profile:'desktop'},{phase,browser:'firefox',profile:'desktop'},{phase,browser:'chromium',profile:'constrained'}].flatMap(cell=>['immediate','focus500'].map(intent=>({...cell,intent}))));
const random=rng(20261001),jobs=[];for(let block=0;block<(qualify?1:30);block++)jobs.push(...shuffle(cells,random).map(x=>({...x,block,kind:'timing'})));
for(let block=0;block<(qualify?1:5);block++)jobs.push(...shuffle(phases,random).map(phase=>({phase,browser:'chromium',profile:'desktop',intent:'immediate',block,kind:'retention'})));
await writeFile(resolve(out,'manifest.json'),JSON.stringify({createdAt:new Date().toISOString(),qualify,jobs,receipts:receipts.map(r=>({phase:r.phase,sourceDigest:r.sourceDigest,assetsDigest:r.assetsDigest,viteConfigSha256:r.viteConfigSha256,dependencyLockSha256:r.dependencyLockSha256})),host:{cpu:os.cpus()[0].model,platform:os.platform(),release:os.release(),node:process.version},protocolSha256:sha(await readFile(resolve(base,'protocol.md'))),harness:await Promise.all(['campaign.mjs','server.mjs','../cleanup/milestones.mjs','../browser-probe.mjs'].map(async name=>({name,sha256:sha(await readFile(resolve(import.meta.dirname,name)))})))},null,2)+'\n');
await exclusiveBrowserWork(async()=>{
 const servers=new Map();for(const phase of phases)servers.set(phase,await serve(phase));
 try{for(const [index,job]of jobs.entries()){
  const browser=await ({chromium,firefox,webkit})[job.browser].launch();const errors=[],failures=[];
  try{
   const context=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:'block',ignoreHTTPSErrors:true});await context.addInitScript(installProbe);await context.addInitScript(installMilestones);
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failures.push({url:r.url(),status:r.status()});});page.on('requestfailed',r=>failures.push({url:r.url(),error:r.failure()?.errorText}));
   const cdp=job.browser==='chromium'?await context.newCDPSession(page):null;
   if(job.profile==='constrained'){await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:1600000/8,uploadThroughput:750000/8});}
   const response=await page.goto(servers.get(job.phase).url+'/workflows/settings.html',{waitUntil:'load',timeout:60000});
   await page.waitForFunction(()=>!!window.__deliveryProbe.startup,{},{timeout:30000});
   const startup=await page.evaluate(()=>__deliveryProbe.startup);
   if(startup.paletteDefined!==false||startup.paletteCount!==1||startup.triggerCount!==1||!startup.ssrMarkerRemoved)throw Error('Unexpected startup '+JSON.stringify(startup));
   if(response.headers()['content-encoding']!=='gzip')throw Error('Missing gzip');
   if(startup.resources.filter(r=>r.name.endsWith('.js')).some(r=>r.protocol!=='h2'))throw Error('Expected HTTP/2 for all executable requests');
   await page.evaluate(()=>__activationMilestones.attach());
   const trigger=page.getByRole('button',{name:'Search commands',exact:true});
   const intentStart=await page.evaluate(()=>performance.now());
   if(job.intent==='focus500'){await trigger.focus();await page.waitForTimeout(500);}
   const beforeAction=await page.evaluate(()=>__deliveryProbe.snapshot());
   const intentElapsedMs=job.intent==='focus500'?beforeAction.atMs-intentStart:0;
   if(await page.evaluate(()=>!!customElements.get('en-command-palette')))throw Error('Intent registered palette');
   await trigger.press('Enter');const action=await page.evaluate(()=>__deliveryProbe.actionPromise);const activation=await page.evaluate(()=>__activationMilestones.finish());if(activation.focusMs===null||activation.focusFrameMs===null)throw Error('Missing input focus milestones');
   await page.getByRole('dialog',{name:'Settings commands',exact:true}).waitFor({state:'visible'});
   if(!action||!action.focusInside)throw Error('Missing command readiness or focus '+JSON.stringify(action));
   const after=await page.evaluate(()=>__deliveryProbe.snapshot());
   await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#settings-command-palette').open);
   await trigger.press('Enter');const second=await page.evaluate(()=>__deliveryProbe.actionPromise);const secondActivation=await page.evaluate(()=>__activationMilestones.finish());await page.evaluate(()=>{__activationMilestones.detach();return __deliveryProbe.close();});
   let checkpoints;
   if(job.kind==='retention'){
    checkpoints=[];for(let cycle=0;cycle<=100;cycle++){
     if(cycle>0)await page.evaluate(async()=>{await __deliveryProbe.remount();await __deliveryProbe.openSynthetic();await __deliveryProbe.close();});
     if([0,10,50,100].includes(cycle)){await cdp.send('HeapProfiler.collectGarbage');await cdp.send('HeapProfiler.collectGarbage');const heap=await cdp.send('Runtime.getHeapUsage'),dom=await cdp.send('Memory.getDOMCounters');checkpoints.push({cycle,heapBytes:heap.usedSize,dom,apps:await page.locator('en-workflows-app').count()});}
    }
   }
   errors.push(...await page.evaluate(()=>__deliveryProbe.errors));if(errors.length||failures.length)throw Error(JSON.stringify({errors,failures}));
   const metrics={intentElapsedMs,preActionJSBytes:beforeAction.jsBytes,preActionJSDecodedBytes:beforeAction.jsDecodedBytes,preActionJSRequests:beforeAction.jsRequests,preparedJSBytes:beforeAction.jsBytes-startup.jsBytes,firstFocusMs:activation.focusMs,firstFocusFrameMs:activation.focusFrameMs,firstFeedbackMs:activation.feedbackMs,firstFeedbackFrameMs:activation.feedbackFrameMs,firstDefinedMs:activation.definedMs,readyMs:startup.readyMs,fcpMs:startup.fcpMs,firstUseMs:action.firstUseMs,secondUseMs:second.firstUseMs,startupJSBytes:startup.jsBytes,startupJSDecodedBytes:startup.jsDecodedBytes,totalJSBytes:after.jsBytes,totalJSDecodedBytes:after.jsDecodedBytes,startupJSRequests:startup.jsRequests,totalJSRequests:after.jsRequests,htmlBytes:startup.htmlBytes};
   const row={...job,status:'ok',browserVersion:browser.version(),metrics,startup,beforeAction,action,activation,second,secondActivation,checkpoints,errors,failures};await appendFile(resolve(out,'samples.jsonl'),JSON.stringify(row)+'\n');console.log(`${index+1}/${jobs.length} ${job.kind} phase${job.phase}/${job.browser}/${job.profile}/${job.intent} ready=${metrics.readyMs.toFixed(1)} first=${metrics.firstUseMs.toFixed(1)}`);
  }catch(error){await writeFile(resolve(out,'failure.json'),JSON.stringify({job,error:String(error),errors,failures},null,2));throw error;}finally{await browser.close();}
 }}finally{for(const s of servers.values())await s.close();}
});
for(const r of receipts)for(const a of r.assets)if(sha(await readFile(resolve(r.phase==='control'?'artifacts/scoped-registry-phase-3-cleanup/candidate/site':base+'/candidate/site',a.path)))!==a.sha256)throw Error('Build mutated');
await writeFile(resolve(out,'summary.json'),JSON.stringify({at:new Date().toISOString(),passed:jobs.length,failed:0,timing:jobs.filter(j=>j.kind==='timing').length,retention:jobs.filter(j=>j.kind==='retention').length,configurations:cells.length,qualify},null,2)+'\n');
