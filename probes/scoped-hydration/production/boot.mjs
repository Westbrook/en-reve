import {create,createElementScope} from './selected.mjs';
const policy=__POLICY__,params=new URLSearchParams(location.search),records=[],errors=[];
const status=document.querySelector('#status'),triggers=[...document.querySelectorAll('[data-trigger]')];
let current,action,serial=0;
const longTasks=[],shifts=[];
try{new PerformanceObserver(list=>longTasks.push(...list.getEntries().map(e=>({start:e.startTime,duration:e.duration})))).observe({type:'longtask',buffered:true});}catch{}
try{new PerformanceObserver(list=>shifts.push(...list.getEntries().filter(e=>!e.hadRecentInput).map(e=>e.value))).observe({type:'layout-shift',buffered:true});}catch{}
function make(host){
 const template=host.querySelector('template'),scope=createElementScope({document}),root=scope.mode==='scoped'?scope.attachShadow(host):host;
 const manifest=JSON.parse(document.querySelector('#manifest').textContent),snapshot=JSON.parse(document.querySelector('#snapshot').textContent);
 manifest.id=host.id;
 const island=create({root,template,manifest,snapshot,scope});
 const record={host,root,island,mode:scope.mode};records.push(record);return record;
}
for(const host of document.querySelectorAll('[data-island]'))make(host);
const inertSource=records[0].host.querySelector('template').cloneNode(true);
function snapshot(){
 let liveNodes=0,liveCustom=0,upgraded=0,inertNodes=0;
 function walk(node,inert=false){for(const child of node.childNodes){if(inert)inertNodes++;else liveNodes++;if(child.nodeType===1){if(!inert&&child.localName.includes('-')){liveCustom++;if(child.matches(':defined'))upgraded++;}if(child.localName==='template')walk(child.content,true);if(child.shadowRoot)walk(child.shadowRoot,inert);}walk(child,inert);}}
 walk(document.body);const resources=performance.getEntriesByType('resource').filter(e=>new URL(e.name).pathname.endsWith('.js'));
 return {at:performance.now(),liveNodes,liveCustom,upgraded,inertNodes,jsBytes:resources.reduce((n,e)=>n+e.encodedBodySize,0),jsRequests:resources.length,protocols:[...new Set(resources.map(e=>e.nextHopProtocol))],longTaskMs:longTasks.reduce((n,e)=>n+e.duration,0),cls:shifts.reduce((n,x)=>n+x,0)};
}
async function open(index=0){
 const record=records[index],trigger=triggers[index],start=performance.now();trigger.focus();trigger.setAttribute('aria-busy','true');status.textContent='Loading commands…';
 try{await record.island.activate({retry:true});const hydrated=performance.now();const palette=record.root.querySelector('en-command-palette');palette.show();await palette.updateComplete;
  for(let i=0;i<60&&!palette.shadowRoot.querySelector('input')?.matches(':focus');i++)await new Promise(requestAnimationFrame);
  const focused=palette.shadowRoot.querySelector('input')?.matches(':focus');if(!focused)throw Error('Command input did not receive focus');
  current=record;status.textContent='';return {start,hydratedMs:hydrated-start,firstUseMs:performance.now()-start,focusInside:focused};
 }catch(e){status.textContent='Commands could not load. Activate Search commands to retry.';throw e;}finally{trigger.setAttribute('aria-busy','false');}
}
async function close(){if(current){const p=current.root.querySelector('en-command-palette');p.hide();await p.updateComplete;current=undefined;}}
for(const [index,trigger]of triggers.entries())trigger.addEventListener('click',()=>{action=open(index);action.catch(e=>{if(!params.has('fail'))errors.push(String(e));});});
const shellReady=performance.now();
window.study={policy,records,errors,shellReady,snapshot,get action(){return action;},open,close,async settle(){await Promise.all(preparations);},async cycle(){
 const host=document.createElement('section');host.id='retained-'+(++serial);host.append(inertSource.cloneNode(true));document.querySelector('main').append(host);const record=make(host);
 try{await record.island.activate();const p=record.root.querySelector('en-command-palette');p.show();await p.updateComplete;p.hide();await p.updateComplete;}finally{record.island.dispose();host.remove();records.pop();}
}};
const preparations=policy==='eager'?records.map(r=>r.island.activate()):policy==='prepared'?records.map(r=>r.island.load()):[];
for(const p of preparations)p.catch(e=>{if(!params.has('fail'))errors.push(String(e));});
if(params.has('progress-report')){const a=document.createElement('a');a.href='http://127.0.0.1:4177';a.textContent='Progress Report';a.style.cssText='position:fixed;bottom:12px;right:12px;background:white;padding:8px;border:1px solid';document.body.append(a);}
