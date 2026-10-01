// Manual diagnostic only. Keep frozen production assets and normal APIs unchanged.
const params=new URLSearchParams(location.search),study=window.study;
if(!study)throw Error('Production fixture did not initialize');
const settle=params.get('opening')==='settle';
window.manualReview={variant:settle?'settle':'baseline',cache:params.get('cache')==='no-store'?'no-store':'private, no-cache',pageshows:[],stages:[],userAgent:navigator.userAgent};
const review=window.manualReview;
window.addEventListener('pageshow',event=>review.pageshows.push({persisted:event.persisted,navigationType:performance.getEntriesByType('navigation')[0]?.type,value:document.querySelector('[name="draft"]').value}));
for(const [index,record]of study.records.entries()){
 const activate=record.island.activate.bind(record.island);
 record.island.activate=async(...args)=>{
  await activate(...args);
  review.stages.push({index,stage:'hydrated',at:performance.now()});
  if(settle){
   // Allow a rendering opportunity with connected, hydrated, still-closed content.
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   if(!record.host.isConnected||record.island.state!=='ready')throw Error('Island no longer ready');
   review.stages.push({index,stage:'settled-before-opening',at:performance.now()});
  }
 };
}
const intro=document.createElement('p');intro.id='review-variant';intro.textContent=settle?'Review variant: wait two animation frames after hydration, then open normally.':'Review variant: original production opening order.';
document.querySelector('h1').after(intro);
const history=document.createElement('p'),link=document.createElement('a');link.id='history-away';link.textContent='Leave this page to test Back restoration';link.href='/away'+(params.has('progress-report')?'?progress-report':'');history.append(link);document.querySelector('form').after(history);
