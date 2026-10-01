// Separate Phase 2 diagnostics; does not change the matched Phase 0/1 workflow protocol.
import {chromium,firefox,webkit} from '@playwright/test';
import {createServer} from 'node:http';
import {mkdir,readFile,writeFile,appendFile,cp} from 'node:fs/promises';
import {resolve} from 'node:path';
import os from 'node:os';
import {root,rng,shuffle,json,sha} from './config.mjs';
import {exclusiveBrowserWork} from './lock.mjs';
const qualify=process.argv.includes('--qualify');
const timingSamples=qualify?1:30,retentionRuns=qualify?1:5;
const id=process.argv.find(arg=>arg.startsWith('--id='))?.slice(5);
if(!id||!/^[a-zA-Z0-9_-]+$/.test(id))throw new Error('Use --id=<unique-run-id> [--qualify]. Build the packed fixture first.');
const directory=resolve(root,'runs',id);await mkdir(directory,{recursive:true});
await writeFile(resolve(directory,'run-started.json'),json({at:new Date().toISOString(),qualify}),{flag:'wx'});
const fixture=resolve(root,'../../artifacts/scoped-registry-phase-2/packed');
const code=await readFile(resolve(fixture,'fixture.js'));
await cp(fixture,resolve(directory,'fixture'),{recursive:true});
const jobs=[];const random=rng(20260921);
for(let block=0;block<timingSamples;block++)jobs.push(...shuffle(['chromium','firefox','webkit'].flatMap(browser=>['auto','global'].flatMap(mode=>['factory','delayed'].map(kind=>({browser,mode,kind,block})))),random));
// Retention is separate: no timing claims or timing collector during forced-GC runs.
for(let block=0;block<retentionRuns;block++)jobs.push(...shuffle(['auto','global'].map(mode=>({browser:'chromium',mode,kind:'retention',block})),random));
await writeFile(resolve(directory,'manifest.json'),json({id,jobs,seed:20260921,timingSamples,retentionRuns,qualify,fixtureSha256:sha(code),runnerSha256:sha(await readFile(new URL(import.meta.url))),host:{platform:os.platform(),release:os.release(),cpu:os.cpus()[0]?.model,node:process.version},methodology:'Serial fresh headless browsers; desktop 1280×900; unthrottled loopback; packed packages. Factory sync return and ready; delayed radio registration to semantic readiness. These are new diagnostic configurations, not Phase 1 deltas or startup/field latency. Retention repeats the factory plus a never-defined child subscription at 0/10/50/100 cycles after forced GC.'}));
const server=createServer((request,response)=>{
 response.setHeader('Cache-Control','no-store');
 if(request.url==='/fixture.js'){response.setHeader('Content-Type','text/javascript');response.end(code);}
 else{response.setHeader('Content-Type','text/html');response.end('<!doctype html><html lang="en"><title>Ownership performance</title><body><script type="module" src="/fixture.js"></script></body></html>');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url=`http://127.0.0.1:${server.address().port}`;
async function prepare(page,mode){
 return page.evaluate(mode=>{
  const {createElementScope,definitions,EnElement,ChildUpgrades}=window.ownershipTest;
  const scope=createElementScope({document,registry:mode});
  scope.register([definitions['en-toast-region'],{...definitions['en-radio-group'],dependencies:[]}]);
  let staleCallbacks=0;
  class PendingOwner extends EnElement {upgrades=new ChildUpgrades(this,()=>{staleCallbacks++;});}
  scope.register([{tagName:'ownership-pending-owner',elementClass:PendingOwner}]);
  window.ownershipBench={scope,definitions,stale:()=>staleCallbacks};
  return {effectiveMode:scope.mode};
 },mode);
}
async function cycle(page,kind){
 return page.evaluate(async kind=>{
  const {scope,definitions}=window.ownershipBench;
  const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
  if(kind==='delayed'){
   const group=scope.createElement('en-radio-group');group.value='b';group.name='choice';group.label='Choice';
   const form=document.createElement('form');form.append(group);document.body.append(form);
   const radios=['a','b'].map(value=>{const child=scope.createElement('en-radio');child.value=value;child.textContent=value;group.append(child);return child;});
   await group.updateComplete;await tick();
   if(radios.some(child=>child.matches(':defined')))throw new Error('Delayed fixture already upgraded');
   const start=performance.now();scope.register([definitions['en-radio']]);await Promise.all(radios.map(child=>child.updateComplete));await tick();await group.updateComplete;await Promise.all(radios.map(child=>child.updateComplete));
   if(!radios[1].checked||radios[0].checked||new FormData(form).get('choice')!=='b')throw new Error('Delayed ownership failed');
   const readyMs=performance.now()-start;form.remove();return {readyMs,correct:true};
  }
  const region=scope.createElement('en-toast-region');document.body.append(region);await region.updateComplete;
  const start=performance.now();const toast=region.notify({message:'Measured notification',priority:'off',duration:0});const returnMs=performance.now()-start;
  if(!(toast instanceof scope.get('en-toast'))||typeof toast.dismiss!=='function')throw new Error('Wrong synchronous factory result');
  await region.updateComplete;await toast.updateComplete;
  if(!toast.isConnected||toast.customElementRegistry!==region.customElementRegistry)throw new Error('Factory escaped ownership');
  const readyMs=performance.now()-start;region.remove();
  if(kind==='retention'){
   const owner=scope.createElement('ownership-pending-owner');document.body.append(owner);await owner.updateComplete;await tick();
   const child=scope.createElement('ownership-never-defined');owner.append(child);owner.upgrades.watch([child]);owner.remove();
  }
  await tick();return {returnMs,readyMs,correct:true};
 },kind);
}
const rows=[];
try{await exclusiveBrowserWork(async()=>{
 for(const job of jobs){
  const browser=await ({chromium,firefox,webkit}[job.browser]).launch({headless:true});const row={...job,status:'running',browserVersion:browser.version(),errors:[]};
  try{
   const page=await browser.newPage({viewport:{width:1280,height:900}});page.on('pageerror',error=>row.errors.push(error.message));await page.goto(url);await page.waitForFunction(()=>Boolean(window.ownershipTest));Object.assign(row,await prepare(page,job.mode));
   if(job.kind==='retention'){
    const cdp=await page.context().newCDPSession(page);await cdp.send('Performance.enable');row.checkpoints=[];let count=0;
    for(const target of [0,10,50,100]){
     while(count<target){await cycle(page,'retention');count++;}
     await cdp.send('HeapProfiler.collectGarbage');const metrics=(await cdp.send('Performance.getMetrics')).metrics;
     row.checkpoints.push({cycle:target,heapBytes:metrics.find(m=>m.name==='JSHeapUsedSize')?.value,dom:await cdp.send('Memory.getDOMCounters')});
    }
   }else row.metrics=await cycle(page,job.kind);
   if(row.errors.length)throw new Error(row.errors.join('\n'));row.status='ok';
  }catch(error){row.status='failed';row.errors.push(String(error.stack??error));}
  finally{await browser.close();}
  rows.push(row);await appendFile(resolve(directory,'samples.jsonl'),JSON.stringify(row)+'\n');console.log(`${rows.length}/${jobs.length} ${job.kind} ${job.browser}/${job.mode}: ${row.status}`);
 }
});}finally{await new Promise(resolve=>server.close(resolve));}
const summary={id,total:rows.length,passed:rows.filter(r=>r.status==='ok').length,failed:rows.filter(r=>r.status!=='ok').length,qualify,timingSamplesPerConfiguration:timingSamples,separateRetentionRunsPerConfiguration:retentionRuns};
await writeFile(resolve(directory,'summary.json'),json(summary));console.log(json(summary));if(summary.failed)process.exitCode=1;
