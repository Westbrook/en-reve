// Additive external observations. The original readiness probe stays unchanged.
export function installMilestones(){
 const records=[];let current=null,observer;
 const frameMark=(record,key,valid=()=>true)=>requestAnimationFrame(()=>{if(valid())record[key]=performance.now()-record.start;});
 const start=event=>{
  if(!event.composedPath().some(n=>n?.id==='settings-command-trigger'))return;
  current={start:performance.now(),focusMs:null,focusFrameMs:null,feedbackMs:null,feedbackFrameMs:null,definedMs:customElements.get('en-command-palette')?0:null};records.push(current);
  const record=current;
  if(record.definedMs===null)customElements.whenDefined('en-command-palette').then(()=>{record.definedMs=performance.now()-record.start;});
 };
 document.addEventListener('keydown',event=>{if(event.key==='Enter')start(event);},true);
 document.addEventListener('click',event=>{if(window.__studyInput==='touch'&&event.isTrusted)start(event);},true);
 document.addEventListener('focusin',event=>{
  if(!current||current.focusMs!==null||event.composedPath()[0]?.id!=='en-command-search')return;
  const record=current;record.focusMs=performance.now()-record.start;frameMark(record,'focusFrameMs');
 },true);
 window.__activationMilestones={attach(){
  const trigger=document.querySelector('#settings-command-trigger'),status=document.querySelector('#settings-command-status');
  const busy=()=>trigger?.getAttribute('aria-busy')==='true'&&!!status?.textContent?.trim();
  observer=new MutationObserver(()=>{if(!current||current.feedbackMs!==null||!busy())return;const record=current;record.feedbackMs=performance.now()-record.start;frameMark(record,'feedbackFrameMs',busy);});
  observer.observe(trigger,{attributes:true,attributeFilter:['aria-busy']});observer.observe(status,{childList:true,characterData:true,subtree:true});
 },finish(){const result=current;current=null;return result;},detach(){observer?.disconnect();observer=null;current=null;},records};
}
