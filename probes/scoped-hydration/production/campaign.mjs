import {chromium,firefox,webkit} from '@playwright/test';
import {mkdir,readFile,writeFile,appendFile} from 'node:fs/promises';
import {resolve} from 'node:path';import os from 'node:os';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
import {serve} from './server.mjs';
import {exclusiveBrowserWork} from '../../../showcases/performance/src/lock.mjs';
import {rng,shuffle} from '../../../showcases/performance/src/config.mjs';
const qualify=process.argv.includes('--qualify'),policies=['eager','prepared','cold'];
const run=process.argv.find(a=>a.startsWith('--run='))?.slice(6)??(qualify?'qualification':'campaign');
const base=resolve(process.env.PHASE5_CAPTURE_ROOT??'artifacts/scoped-registry-phase-5/production'),out=resolve(base,run);await mkdir(out,{recursive:true});
await writeFile(resolve(out,'started.json'),JSON.stringify({at:new Date().toISOString(),qualify}),{flag:'wx'});
const sha=b=>createHash('sha256').update(b).digest('hex');
const receipts=await Promise.all(policies.map(async policy=>({...JSON.parse(await readFile(resolve(base,policy,'receipt.json'))),policy})));
async function verify(){for(const r of receipts)for(const a of r.assets)assert.equal(sha(await readFile(resolve(base,r.policy,'site',a.path))),a.sha256,'Build mutated');}await verify();
const configs=[...['chromium','firefox','webkit'].map(browser=>({browser,profile:'desktop',input:'keyboard'})),{browser:'chromium',profile:'constrained',input:'keyboard'},{browser:'chromium',profile:'constrained-mobile',input:'touch'},{browser:'chromium',profile:'constrained',input:'unused'}];
const cells=policies.flatMap(policy=>configs.map(c=>({...c,policy}))),random=rng(20260921),jobs=[];
for(let block=0;block<(qualify?1:30);block++)jobs.push(...shuffle(cells,random).map(x=>({...x,block,kind:'timing'})));
for(let block=0;block<(qualify?1:5);block++)jobs.push(...shuffle(policies,random).map(policy=>({policy,browser:'chromium',profile:'desktop',input:'keyboard',block,kind:'retention'})));
await writeFile(resolve(out,'manifest.json'),JSON.stringify({at:new Date().toISOString(),qualify,jobs,host:{cpu:os.cpus()[0].model,platform:os.platform(),release:os.release(),node:process.version},receipts,protocol:await readFile(resolve(import.meta.dirname,'protocol.md'),'utf8'),harness:await Promise.all(['campaign.mjs','server.mjs','boot.mjs','phase4.mjs','phase5.mjs','island.mjs','settle-before-focus.mjs'].map(async name=>({name,sha256:sha(await readFile(resolve(import.meta.dirname,name)))})))},null,2)+'\n');
await exclusiveBrowserWork(async()=>{const servers=new Map();for(const policy of policies)servers.set(policy,await serve(policy,0,base));try{for(const [index,job]of jobs.entries()){
 const browser=await ({chromium,firefox,webkit})[job.browser].launch(),errors=[],failures=[];let page;
 try{
  const mobile=job.input==='touch';const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:900},...(mobile?{hasTouch:true,isMobile:true}:{}),serviceWorkers:'block',ignoreHTTPSErrors:true});page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failures.push({url:r.url(),status:r.status()});});page.on('requestfailed',r=>failures.push({url:r.url(),error:r.failure()?.errorText}));
  const cdp=job.browser==='chromium'?await context.newCDPSession(page):null;
  if(job.profile.startsWith('constrained')){await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:1600000/8,uploadThroughput:750000/8});}
  const response=await page.goto(servers.get(job.policy).url,{waitUntil:'domcontentloaded',timeout:60000});await page.waitForFunction(()=>!!window.study,{},{timeout:30000});
  assert.equal(response.headers()['content-encoding'],'gzip');const startup=await page.evaluate(()=>({...study.snapshot(),shellReadyMs:study.shellReady,mode:study.records[0].mode,fcpMs:performance.getEntriesByName('first-contentful-paint')[0]?.startTime??null,htmlBytes:performance.getEntriesByType('navigation')[0]?.encodedBodySize??null}));
  const trigger=page.getByRole('button',{name:'Search commands',exact:true});let action=null,second=null,unused=null,checkpoints=null;
  if(job.input==='unused'){await page.waitForTimeout(500);unused=await page.evaluate(()=>study.snapshot());}
  else{
   if(mobile)await trigger.tap();else await trigger.press('Enter');action=await page.evaluate(()=>study.action);assert(action?.focusInside);
   await page.keyboard.press('Escape');await page.waitForFunction(()=>!study.records[0].root.querySelector('en-command-palette').open);assert(await trigger.evaluate(el=>el===document.activeElement),'Focus restoration');
   if(mobile)await trigger.tap();else await trigger.press('Enter');second=await page.evaluate(()=>study.action);assert(second?.focusInside);await page.evaluate(()=>study.close());
  }
  const after=await page.evaluate(()=>study.snapshot());assert(after.protocols.every(p=>p==='h2'));
  if(job.input==='unused')await page.evaluate(()=>study.settle());
  const settled=job.input==='unused'?await page.evaluate(()=>study.snapshot()):null;
  const isolated=await page.evaluate(()=>study.records[1].root.querySelectorAll('en-command-palette').length);assert.equal(isolated,job.policy==='eager'?1:0);
  if(job.kind==='retention'){
   await page.evaluate(()=>study.settle());checkpoints=[];
   for(let cycle=0;cycle<=100;cycle++){if(cycle)await page.evaluate(()=>study.cycle());if([0,10,50,100].includes(cycle)){await cdp.send('HeapProfiler.collectGarbage');await cdp.send('HeapProfiler.collectGarbage');checkpoints.push({cycle,heapBytes:(await cdp.send('Runtime.getHeapUsage')).usedSize,dom:await cdp.send('Memory.getDOMCounters'),snapshot:await page.evaluate(()=>study.snapshot())});}}
  }
  errors.push(...await page.evaluate(()=>study.errors));assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
  const metrics={fcpMs:startup.fcpMs,htmlBytes:startup.htmlBytes,shellReadyMs:startup.shellReadyMs,firstUseMs:action?.firstUseMs??null,hydratedMs:action?.hydratedMs??null,navigationToFocusMs:action?action.start+action.firstUseMs:null,preparationLeadMs:action?action.start-startup.shellReadyMs:null,secondUseMs:second?.firstUseMs??null,jsBytes:after.jsBytes,jsRequests:after.jsRequests,liveNodes:after.liveNodes,inertNodes:after.inertNodes,upgraded:after.upgraded,longTaskMs:job.browser==='chromium'?after.longTaskMs:null,cls:job.browser==='chromium'?after.cls:null,unusedJSBytes:unused?.jsBytes??null,unusedLiveNodes:unused?.liveNodes??null,unusedInertNodes:unused?.inertNodes??null,unusedUpgraded:unused?.upgraded??null,unusedWindowMs:unused?unused.at-startup.at:null,settledUnusedJSBytes:settled?.jsBytes??null,settledUnusedLiveNodes:settled?.liveNodes??null,settledUnusedInertNodes:settled?.inertNodes??null,settledUnusedUpgraded:settled?.upgraded??null};
  await appendFile(resolve(out,'samples.jsonl'),JSON.stringify({...job,status:'ok',browserVersion:browser.version(),metrics,startup,action,second,after,unused,settled,checkpoints,errors,failures})+'\n');console.log(`${index+1}/${jobs.length} ${job.policy}/${job.browser}/${job.profile}/${job.input}/${job.kind} shell=${metrics.shellReadyMs.toFixed(1)} first=${metrics.firstUseMs?.toFixed(1)??'-'}`);
 }catch(error){await writeFile(resolve(out,'failure.json'),JSON.stringify({job,error:String(error),stack:error.stack,errors,failures},null,2));if(page)await page.screenshot({path:resolve(out,'failure.png')}).catch(()=>{});throw error;}finally{await browser.close();}
 }}finally{for(const s of servers.values())await s.close();}});
await verify();await writeFile(resolve(out,'summary.json'),JSON.stringify({at:new Date().toISOString(),passed:jobs.length,failed:0,timing:jobs.filter(j=>j.kind==='timing').length,retention:jobs.filter(j=>j.kind==='retention').length,configurations:cells.length,qualify},null,2)+'\n');
