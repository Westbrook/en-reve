import {createElementScope} from '@en-reve/elements/element-scope.js';
import {definition} from './selected.mjs';
const params=new URLSearchParams(location.search),policy=__POLICY__,scope=createElementScope({document,registry:params.get('mode')==='global'?customElements:'auto'}),fields=document.querySelector('#fields');
const records=[],errors=[];let shellReady,action;
const observations={longtask:null,layoutShift:null};
for(const [type,key] of [['longtask','longtask'],['layout-shift','layoutShift']])if(PerformanceObserver.supportedEntryTypes.includes(type)){observations[key]=[];new PerformanceObserver(list=>{for(const e of list.getEntries())observations[key].push({start:e.startTime,duration:e.duration,value:e.value??null,hadRecentInput:e.hadRecentInput??null});}).observe({type,buffered:true});}
let accepted;


function census(){let nodes=0,elements=0,shadows=0,inert=0;const visit=node=>{nodes++;if(node.nodeType===1){elements++;if(node.shadowRoot){shadows++;visit(node.shadowRoot);}if(node instanceof HTMLTemplateElement)inert+=node.content.querySelectorAll('*').length;}for(const child of node.childNodes)visit(child);};visit(document);return {nodes,elements,shadows,inert};}
function snapshot(){const resources=performance.getEntriesByType('resource').filter(r=>r.initiatorType==='script'||/\.js(?:\?|$)/.test(r.name));return {at:performance.now(),...census(),observations:structuredClone(observations),jsBytes:resources.reduce((n,r)=>n+r.encodedBodySize,0),jsRequests:resources.length,protocols:[...new Set(resources.map(r=>r.nextHopProtocol))]};}
async function settle(el){for(let pass=0;pass<3;pass++){const all=[];function visit(root){for(const child of root.querySelectorAll('*')){if(child.updateComplete)all.push(child.updateComplete);if(child.shadowRoot)visit(child.shadowRoot);}}visit(el.shadowRoot);await Promise.all(all);await el.updateComplete;}}
function mount(){const picker=scope.createElement('en-date-picker');picker.label='Event date';picker.name='eventDate';picker.value='2026-09-15';picker.defaultValue='2026-09-15';picker.today='2026-09-22';picker.min='2026-01-01';picker.max='2026-12-31';picker.required=true;if(policy!=='eager')picker.calendarLoading='deferred';fields.append(picker);records.push(picker);return picker;}
scope.register([definition]);
const picker=mount();await picker.updateComplete;await settle(picker);
const trigger=picker.shadowRoot.querySelector('#picker-trigger');
picker.addEventListener('en-change',()=>{const start=performance.now();accepted=picker.updateComplete.then(()=>({updateMs:performance.now()-start,value:picker.value}));});
let pendingFocus;
function observe(event){if(!event.composedPath().includes(trigger))return;const start=performance.now();action=new Promise(resolve=>pendingFocus={start,resolve});}
trigger.addEventListener('click',observe,{capture:true});
picker.shadowRoot.addEventListener('focusin',event=>{if(!pendingFocus||!event.composedPath().some(el=>el.localName==='en-calendar'))return;const pending=pendingFocus;pendingFocus=undefined;const focused=performance.now();requestAnimationFrame(()=>pending.resolve({start:pending.start,focusMs:focused-pending.start,nextFrameMs:performance.now()-pending.start,focusInside:true,open:!!picker.shadowRoot.querySelector('en-dialog')?.open}));},{capture:true});
let preparedAt=null,preparationEnd=null;
function prepare(){if(!picker.preparePicker)return;preparedAt??=performance.now();return picker.preparePicker().then(()=>{preparationEnd=performance.now();}).catch(e=>errors.push(String(e)));}
if(policy==='intent'){trigger.addEventListener('focusin',prepare);trigger.addEventListener('pointerenter',prepare);}
if(policy==='route')void prepare();
shellReady=performance.now();
window.study={picker,records,scope,policy,mode:scope.mode,shellReady,errors,snapshot,settle:()=>settle(picker),get action(){return action;},get accepted(){return accepted;},get preparation(){return {start:preparedAt,end:preparationEnd};},async open(){const start=performance.now();await picker.showPicker();await settle(picker);return performance.now()-start;},async close(){picker.hidePicker();await settle(picker);},async cycle(){const el=mount();await el.updateComplete;await el.showPicker();el.hidePicker();await settle(el);el.remove();records.pop();}};
document.querySelector('#form').addEventListener('submit',e=>{e.preventDefault();document.querySelector('#result').textContent=JSON.stringify(Object.fromEntries(new FormData(e.currentTarget)),null,2);});
if(params.has('progress-report'))document.querySelector('#report-return').hidden=false;
