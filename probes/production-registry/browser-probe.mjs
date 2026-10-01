// Identical external measurement code for every production page. No app/bundle edits.
export function installProbe(){
 const frame=()=>new Promise(r=>requestAnimationFrame(r));
 async function ready(root){for(let pass=0;pass<4;pass++){const promises=[];function visit(node){
  // Dormant SSR hosts can contain defined children with deferred hydration.
  // Their readiness belongs to activation, not to initial workflow readiness.
  if(node.localName?.includes('-')&&!customElements.get(node.localName))return;
  if(node.updateComplete)promises.push(node.updateComplete);if(node.shadowRoot)visit(node.shadowRoot);for(const child of node.children??[])visit(child);
 }visit(root);await Promise.all(promises);}await frame();await frame();}
 const probe={ready,startup:null,actionStart:null,actionPromise:null,errors:[],longTasks:[]};
 try{new PerformanceObserver(list=>probe.longTasks.push(...list.getEntries().map(e=>({startTime:e.startTime,duration:e.duration})))).observe({type:'longtask',buffered:true});}catch{}
 const resources=()=>performance.getEntriesByType('resource').map(r=>({name:new URL(r.name).pathname,protocol:r.nextHopProtocol,initiatorType:r.initiatorType,startMs:r.startTime,endMs:r.responseEnd,duration:r.duration,encodedBytes:r.encodedBodySize,decodedBytes:r.decodedBodySize,transferBytes:r.transferSize}));
 probe.resources=resources;
 probe.snapshot=()=>{const entries=resources(),js=entries.filter(r=>r.name.endsWith('.js'));return {atMs:performance.now(),jsBytes:js.reduce((s,r)=>s+r.encodedBytes,0),jsDecodedBytes:js.reduce((s,r)=>s+r.decodedBytes,0),jsRequests:js.length,resources:entries};};
 async function commandReady(start){const palette=document.querySelector('#settings-command-palette');const deadline=start+15000;while(!palette?.open){if(performance.now()>deadline)throw Error('Command failed to open');await frame();}await ready(document.querySelector('en-workflows-app'));const resources=probe.resources().filter(r=>r.startMs>=start);return {firstUseMs:performance.now()-start,resources,paletteOpen:palette.open,focusInside:palette.contains(document.activeElement)||document.activeElement===palette};}
 document.addEventListener('keydown',event=>{if(event.key==='Enter'&&event.composedPath().some(n=>n?.id==='settings-command-trigger')){probe.actionStart=performance.now();probe.actionPromise=commandReady(probe.actionStart);probe.actionPromise.catch(e=>probe.errors.push(String(e)));}},true);
 probe.remount=async()=>{const old=document.querySelector('en-workflows-app');old.remove();const app=document.createElement('en-workflows-app');document.body.append(app);await ready(app);};
 probe.openSynthetic=async()=>{const start=performance.now();document.querySelector('#settings-command-trigger').click();return commandReady(start);};
 probe.close=async()=>{document.querySelector('#settings-command-palette').open=false;await ready(document.querySelector('en-workflows-app'));};
 window.__deliveryProbe=probe;
 (async()=>{await customElements.whenDefined('en-workflows-app');if(document.readyState==='loading')await new Promise(r=>document.addEventListener('DOMContentLoaded',r,{once:true}));const app=document.querySelector('en-workflows-app');await ready(app);const nav=performance.getEntriesByType('navigation')[0];probe.startup={...probe.snapshot(),readyMs:performance.now(),fcpMs:performance.getEntriesByName('first-contentful-paint')[0]?.startTime??null,htmlBytes:nav.encodedBodySize,paletteDefined:!!customElements.get('en-command-palette'),paletteCount:document.querySelectorAll('#settings-command-palette').length,triggerCount:document.querySelectorAll('#settings-command-trigger').length,ssrMarkerRemoved:!app.hasAttribute('data-ssr')};})().catch(e=>probe.errors.push(String(e)));
}
