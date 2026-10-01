// Diagnostic interventions on frozen production assets; not a replacement campaign.
import {chromium} from '@playwright/test';
import {readFile,writeFile,mkdir,appendFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {serve} from './server.mjs';
import {installProbe} from './browser-probe.mjs';
import {exclusiveBrowserWork} from '../../showcases/performance/src/lock.mjs';
import {rng,shuffle} from '../../showcases/performance/src/config.mjs';
const out=resolve('artifacts/scoped-registry-phase-3-first-use-audit');await mkdir(out,{recursive:true});
const run=process.argv.find(v=>v.startsWith('--run='))?.slice(6)??'profile';const dir=resolve(out,run);await mkdir(dir,{recursive:true});
const variants=[{phase:3,mode:'cold'},{phase:3,mode:'imported'}];
const random=rng(20260930),jobs=[];for(let block=0;block<1;block++)jobs.push(...shuffle(variants,random).map(v=>({...v,block})));
const artifact=resolve('artifacts/scoped-registry-production-v1');
const original=JSON.parse((await readFile(resolve(artifact,'campaign/samples.jsonl'),'utf8')).split('\n').find(l=>l&&JSON.parse(l).phase===3&&JSON.parse(l).profile==='constrained'));
const wrapper=original.action.resources.find(r=>r.decodedBytes<200).name;
const receipts=await Promise.all([2,3].map(async phase=>({phase,...JSON.parse(await readFile(resolve(artifact,`phase-${phase}/receipt.json`)))})));
const sha=b=>createHash('sha256').update(b).digest('hex');
async function verifyAssets(){for(const r of receipts)for(const a of r.assets)if(sha(await readFile(resolve(artifact,`phase-${r.phase}/site`,a.path)))!==a.sha256)throw Error('Frozen production assets changed');}
await verifyAssets();await writeFile(resolve(dir,'manifest.json'),JSON.stringify({at:new Date().toISOString(),jobs,wrapper,assets:receipts.map(r=>({phase:r.phase,digest:r.assetsDigest})),instrumentation:'Prototype timing wrappers, focus/open and update markers. One profiled repeat per variant, diagnostic only, not equivalent to frozen campaign. Imported and registered interventions move work before activation.',throttle:{cpu:4,latencyMs:150,downloadBps:1600000,uploadBps:750000}},null,2),{flag:'wx'});
function installDiagnostic(){
 const d=window.__firstUse={marks:[],ssr:null};const mark=(name,extra={})=>{performance.mark(name);d.marks.push({name,at:performance.now(),...extra});};
 d.mark=mark;
 const define=CustomElementRegistry.prototype.define;
 CustomElementRegistry.prototype.define=function(name,ctor,options){
  if(['en-command-palette','en-workflows-app'].includes(name)){
   const update=ctor.prototype.performUpdate;
   ctor.prototype.performUpdate=function(...args){mark(`${name}:update:start`,{open:this.open,hasUpdated:this.hasUpdated});try{return update.apply(this,args);}finally{mark(`${name}:update:end`,{open:this.open,hasUpdated:this.hasUpdated});}};
  }
  if(name==='en-command-palette')mark('palette:define:start');
  const result=define.call(this,name,ctor,options);
  if(name==='en-command-palette')mark('palette:define:end');
  return result;
 };
 const show=HTMLDialogElement.prototype.showModal;
 HTMLDialogElement.prototype.showModal=function(...args){const palette=this.getRootNode().host?.id==='settings-command-palette';if(palette)mark('native:show:start');try{return show.apply(this,args);}finally{if(palette)mark('native:show:end');}};
 document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.composedPath().some(n=>n?.id==='settings-command-trigger'))mark('activation:keydown');},true);
 document.addEventListener('click',e=>{if(e.composedPath().some(n=>n?.id==='settings-command-trigger'))mark('activation:click');},true);
 document.addEventListener('focusin',e=>{if(e.composedPath().some(n=>n?.id==='settings-command-palette'))mark('palette:focus',{target:e.composedPath()[0]?.localName,id:e.composedPath()[0]?.id});},true);
 d.start=()=>{
  const p=document.querySelector('#settings-command-palette');d.ssr={root:p.shadowRoot,dialog:p.shadowRoot?.querySelector('dialog'),input:p.shadowRoot?.querySelector('input')};
  d.marks=[];
  new MutationObserver(()=>mark('status:mutation',{text:document.querySelector('#settings-command-status')?.textContent})).observe(document.querySelector('#settings-command-status')??document.querySelector('#settings-command-trigger'),{childList:true,subtree:true,characterData:true});
 };
 d.result=()=>{
  const start=d.marks.find(m=>m.name==='activation:keydown').at,p=document.querySelector('#settings-command-palette');
  const marks=d.marks.filter(m=>m.at>=start).map(m=>({...m,offset:m.at-start}));
  const resources=performance.getEntriesByType('resource').filter(r=>r.startTime>=start).map(r=>({name:new URL(r.name).pathname,start:r.startTime-start,fetch:r.fetchStart-start,request:r.requestStart-start,responseStart:r.responseStart-start,end:r.responseEnd-start,duration:r.duration,connect:r.connectEnd-r.connectStart,tls:r.secureConnectionStart>0?r.connectEnd-r.secureConnectionStart:0,encoded:r.encodedBodySize,decoded:r.decodedBodySize,protocol:r.nextHopProtocol}));
  return {marks,resources,longTasks:__deliveryProbe.longTasks.filter(t=>t.startTime+t.duration>=start).map(t=>({...t,offset:t.startTime-start})),ssrPreserved:{root:!!d.ssr.root&&d.ssr.root===p.shadowRoot,dialog:!!d.ssr.dialog&&d.ssr.dialog===p.shadowRoot?.querySelector('dialog'),input:!!d.ssr.input&&d.ssr.input===p.shadowRoot?.querySelector('input')},paletteCount:document.querySelectorAll('en-command-palette').length,commands:p.commands.length};
 };
}
await exclusiveBrowserWork(async()=>{
 const servers=new Map();for(const phase of [2,3])servers.set(phase,await serve(phase));
 try{for(const [i,job] of jobs.entries()){
  const browser=await chromium.launch();const errors=[];
  try{
   const context=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:'block',ignoreHTTPSErrors:true});await context.addInitScript(installDiagnostic);await context.addInitScript(installProbe);
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));const cdp=await context.newCDPSession(page);
   await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:1600000/8,uploadThroughput:750000/8});
   await page.goto(servers.get(job.phase).url+'/workflows/settings.html',{waitUntil:'load',timeout:60000});await page.waitForFunction(()=>!!window.__deliveryProbe.startup);
   if(job.mode!=='cold')await page.evaluate(async({wrapper,mode})=>{
    const {commandPaletteDefinition:definition}=await import(wrapper);
    if(mode==='registered'){const add=d=>{for(const child of d.dependencies??[])add(child);if(!customElements.get(d.tagName))customElements.define(d.tagName,d.elementClass);};add(definition);await __deliveryProbe.ready(document.querySelector('en-workflows-app'));}
    if(!!customElements.get('en-command-palette')!==(mode==='registered'))throw Error('Wrong intervention registry state');
   },{wrapper,mode:job.mode});
   const trace=[];cdp.on('Tracing.dataCollected',e=>trace.push(...e.value));await cdp.send('Profiler.enable');await cdp.send('Profiler.start');await cdp.send('Tracing.start',{categories:'devtools.timeline,blink.user_timing,v8',options:'record-as-much-as-possible'});await page.evaluate(()=>__firstUse.start());await page.getByRole('button',{name:'Search commands',exact:true}).press('Enter');const action=await page.evaluate(async()=>{const a=await __deliveryProbe.actionPromise;__firstUse.mark('benchmark:ready');return a;});
   if(!action.focusInside||!action.paletteOpen)throw Error('No focus/open');
   const profile=await cdp.send('Profiler.stop');const finished=new Promise(r=>cdp.once('Tracing.tracingComplete',r));await cdp.send('Tracing.end');await finished;await writeFile(resolve(dir,`p${job.phase}-${job.mode}.cpuprofile`),JSON.stringify(profile.profile));await writeFile(resolve(dir,`p${job.phase}-${job.mode}.trace.json`),JSON.stringify({traceEvents:trace}));const diagnostic=await page.evaluate(()=>__firstUse.result());if(errors.length)throw Error(errors.join('\n'));
   const row={...job,status:'passed',browserVersion:browser.version(),firstUseMs:action.firstUseMs,...diagnostic,errors};await appendFile(resolve(dir,'samples.jsonl'),JSON.stringify(row)+'\n');console.log(`${i+1}/${jobs.length} p${job.phase}/${job.mode} ${action.firstUseMs.toFixed(2)}ms`);
  }finally{await browser.close();}
 }}finally{for(const s of servers.values())await s.close();}
});
await verifyAssets();await writeFile(resolve(dir,'summary.json'),JSON.stringify({at:new Date().toISOString(),passed:jobs.length,assetsUnchanged:true},null,2)+'\n');
