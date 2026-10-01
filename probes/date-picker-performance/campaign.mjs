import {chromium,firefox,webkit} from '@playwright/test';
import {readFile,writeFile,mkdir,appendFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {serve} from '../scoped-hydration/production/server.mjs';
import {exclusiveBrowserWork} from '../../showcases/performance/src/lock.mjs';
import {rng,shuffle} from '../../showcases/performance/src/config.mjs';
const get=(name,fallback)=>process.argv.find(x=>x.startsWith(`--${name}=`))?.split('=')[1]??fallback;
const base=resolve(process.env.PHASE6_BASE??'artifacts/scoped-registry-phase-6'),run=get('run','baseline'),n=Number(get('n','30')),retention=Number(get('retention','5')),warm=process.argv.includes('--warm'),qualify=process.argv.includes('--qualify');
const arms=get('arms','parent/eager').split(',').flatMap(path=>['global','scoped'].map(mode=>({path,mode,key:path.replace('/','-')+'-'+mode})));
assert(/^[a-z0-9][a-z0-9-]*$/.test(run),'Use a unique run slug');assert(Number.isInteger(n)&&n>0);assert(Number.isInteger(retention)&&retention>=0);assert(arms.every(a=>/^(parent\/eager|candidate\/(eager|dom|cold|intent|route))$/.test(a.path)));
const out=resolve(base,run);await mkdir(out,{recursive:true});await writeFile(resolve(out,'started.json'),JSON.stringify({at:new Date().toISOString(),n,retention,warm,qualify}),{flag:'wx'});
const allConfigs=[...['chromium','firefox','webkit'].map(browser=>({browser,profile:'desktop',input:'keyboard'})),{browser:'chromium',profile:'constrained',input:'keyboard'},{browser:'chromium',profile:'constrained-mobile',input:'touch'},{browser:'chromium',profile:'constrained',input:'unused'}];
const configs=get('configs','all')==='all'?allConfigs:allConfigs.filter(c=>get('configs','').split(',').includes(c.browser+':'+c.profile+':'+c.input));
assert(configs.length>0,'No configurations selected');if(get('configs','all')!=='all')assert.equal(configs.length,new Set(get('configs','').split(',')).size,'Unknown configuration');
const random=rng(20260922),jobs=[];for(let block=0;block<n;block++)jobs.push(...shuffle(arms.flatMap(arm=>configs.map(config=>({...arm,...config,block,kind:'timing'}))),random));
for(let block=0;block<retention;block++)jobs.push(...shuffle(arms.map(arm=>({...arm,browser:'chromium',profile:'desktop',input:'keyboard',block,kind:'retention'})),random));
const sha=b=>createHash('sha256').update(b).digest('hex'),receipts=[];
for(const path of new Set(arms.map(a=>a.path)))receipts.push({path,...JSON.parse(await readFile(resolve(base,path,'receipt.json')))});
async function verify(){for(const r of receipts){for(const a of r.assets)assert.equal(sha(await readFile(resolve(base,r.path,'site',a.path))),a.sha256);for(const p of r.packages)assert.equal(sha(await readFile(p.path)),p.sha256);}}
const environment={power:'unavailable',thermal:'unavailable'};try{environment.power=execFileSync('pmset',['-g','batt'],{encoding:'utf8'});environment.thermal=execFileSync('pmset',['-g','therm'],{encoding:'utf8'});}catch{}
const harnessFiles=['campaign.mjs','app/boot.mjs','app/index.html','prepare.py','protocol.md','../scoped-hydration/production/server.mjs','../../showcases/performance/src/lock.mjs','../../showcases/performance/src/config.mjs'];const harness=await Promise.all(harnessFiles.map(async path=>({path,sha256:sha(await readFile(resolve('probes/date-picker-performance',path)))})));
await verify();await writeFile(resolve(out,'manifest.json'),JSON.stringify({at:new Date().toISOString(),jobs,receipts,harness,environment,host:{cpu:os.cpus()[0].model,release:os.release(),node:process.version},protocol:await readFile('probes/date-picker-performance/protocol.md','utf8')},null,2));
await exclusiveBrowserWork(async()=>{
 const servers=new Map();for(const path of new Set(arms.map(a=>a.path)))servers.set(path,await serve(path,0,base));
 try {for(const [i,job] of jobs.entries()){
  const browser=await({chromium,firefox,webkit})[job.browser].launch();let page;const errors=[],failures=[];
  try{
   const touch=job.input==='touch';const context=await browser.newContext({ignoreHTTPSErrors:true,serviceWorkers:'block',viewport:touch?{width:390,height:844}:{width:1280,height:900},...(touch?{hasTouch:true,isMobile:true}:{})});page=await context.newPage();page.setDefaultTimeout(20000);
   page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failures.push(r.failure()?.errorText));page.on('response',r=>{if(r.status()>=400)failures.push(r.url()+':'+r.status());});
   const cdp=job.browser==='chromium'?await context.newCDPSession(page):null;
   if(job.profile.startsWith('constrained')){await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:1600000/8,uploadThroughput:750000/8});}
   const url=servers.get(job.path).url+'/?mode='+job.mode;
   if(warm){await page.goto(url);await page.waitForFunction(()=>!!window.study);await page.goto(servers.get(job.path).url+'/index.html?mode='+job.mode);}
   else await page.goto(url,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>!!window.study);
   const startup=await page.evaluate(()=>({...study.snapshot(),shellReadyMs:study.shellReady,mode:study.mode}));
   const trigger=page.locator('en-date-picker #picker-trigger').getByRole('button');let first=null,second=null,unused=null,abandoned=null,checkpoints=null,selection=null;
   if(job.input==='unused'){
    await page.waitForTimeout(500);unused=await page.evaluate(()=>study.snapshot());await trigger.focus();await page.locator('#submit').focus();await page.waitForTimeout(500);abandoned=await page.evaluate(()=>study.snapshot());
   }else{
    if(touch)await trigger.tap();else await trigger.press('Enter');
    first=await page.evaluate(()=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('First focus timeout')),15000);Promise.resolve(study.action).then(value=>{clearTimeout(timer);resolve(value);},reject);} ));assert(first?.focusInside&&first.open);
    await page.keyboard.press('Escape');await page.waitForFunction(()=>!study.picker.shadowRoot.querySelector('en-dialog').open);
    assert(await trigger.evaluate(el=>el.shadowRoot?.activeElement?.localName==='button'||el.matches(':focus')),'trigger focus restored');
    if(touch)await trigger.tap();else await trigger.press('Enter');second=await page.evaluate(()=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Second focus timeout')),15000);Promise.resolve(study.action).then(value=>{clearTimeout(timer);resolve(value);},reject);} ));assert(second?.focusInside);await page.locator('en-calendar button[data-date="2026-09-16"]').click();selection=await page.evaluate(()=>study.accepted);assert.equal(selection.value,'2026-09-16');await page.evaluate(()=>study.close());
   }
   const after=await page.evaluate(()=>study.snapshot()),preparation=await page.evaluate(()=>study.preparation);
   assert(after.protocols.every(p=>p==='h2'));
   if(job.kind==='retention'){
    checkpoints=[];for(let cycle=0;cycle<=100;cycle++){if(cycle)await page.evaluate(()=>study.cycle());if([0,10,50,100].includes(cycle)){await page.waitForTimeout(300);await cdp.send('HeapProfiler.collectGarbage');await cdp.send('HeapProfiler.collectGarbage');checkpoints.push({cycle,heapBytes:(await cdp.send('Runtime.getHeapUsage')).usedSize,dom:await cdp.send('Memory.getDOMCounters')});}}
   }
   errors.push(...await page.evaluate(()=>study.errors));assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
   const metrics={selectionUpdateMs:selection?.updateMs??null,shellReadyMs:startup.shellReadyMs,startupNodes:startup.nodes,startupElements:startup.elements,startupJSBytes:startup.jsBytes,firstFocusMs:first?.focusMs??null,firstFrameMs:first?.nextFrameMs??null,navigationToFocusMs:first?first.start+first.focusMs:null,secondFocusMs:second?.focusMs??null,afterJSBytes:after.jsBytes,afterNodes:after.nodes,unusedBytes:unused?.jsBytes??null,unusedNodes:unused?.nodes??null,abandonedBytes:abandoned?.jsBytes??null};
   await appendFile(resolve(out,'samples.jsonl'),JSON.stringify({...job,status:'ok',browserVersion:browser.version(),metrics,startup,first,second,selection,unused,abandoned,after,preparation,checkpoints})+'\n');console.log(`${i+1}/${jobs.length} ${job.key} ${job.browser}/${job.profile}/${job.input} ${job.kind} focus=${metrics.firstFocusMs?.toFixed(2)??'-'}`);
  }catch(error){await writeFile(resolve(out,'failure.json'),JSON.stringify({job,error:String(error),stack:error.stack,errors,failures},null,2));if(page)await page.screenshot({path:resolve(out,'failure.png')}).catch(()=>{});throw error;}finally{await browser.close();}
 }}finally{for(const s of servers.values())await s.close();}
});
await verify();for(const h of harness)assert.equal(sha(await readFile(resolve('probes/date-picker-performance',h.path))),h.sha256);await writeFile(resolve(out,'summary.json'),JSON.stringify({at:new Date().toISOString(),successful:jobs.length,n,retention,arms:arms.length,configs:configs.length,warm,qualify},null,2));
