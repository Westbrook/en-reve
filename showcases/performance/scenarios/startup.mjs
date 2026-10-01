/** Installed before navigation. Poll on animation frames in the page, so host-side
 * locator backoff cannot turn a control appearing at 700ms into 1000ms readiness.
 * The injected probe remains exclusive to the startup lane, never primary load.
 */
export function installStartupProbe() {
  const state = { frames: 0, probeDurationMs: 0, found: false };
  window.__startupProbe = state;
  const tick = () => {
    const start = performance.now();state.frames++;
    const card = document.querySelector('#showcase-actions');
    if (card) for (const element of card.querySelectorAll('button,en-button,fluent-button,fluent-menu-button,sp-button,swc-button,swc-action-button,sp-action-button,wa-button,[role="button"]')) {
      const label = (element.getAttribute('aria-label') || element.textContent).replace(/\s+/g,' ').trim();
      if (label !== 'Landscape') continue;
      if (!element.checkVisibility({opacityProperty:true,visibilityProperty:true})) continue;
      const box=element.getBoundingClientRect();
      const point={x:box.x+box.width/2,y:box.y+box.height/2};
      if (!box.width || !box.height || point.x<0 || point.y<0 || point.x>=innerWidth || point.y>=innerHeight) continue;
      window.__startupProbeTarget=element;state.found=true;state.visibleObserved=performance.now();state.point=point;state.tag=element.localName;
      break;
    }
    state.probeDurationMs+=performance.now()-start;
    if(!state.found)requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
export async function startupInteraction(page,id) {
  // The calibration installs its synthetic control after navigation. Real runs
  // install this probe as an init script, before the application can create it.
  if (!(await page.evaluate(()=>Boolean(window.__startupProbe)))) await page.evaluate(installStartupProbe);
  await page.waitForFunction(()=>window.__startupProbe?.found,null,{polling:'raf',timeout:12000});
  const probe=await page.evaluate(()=>{
    const state=window.__startupProbe,target=window.__startupProbeTarget;
    if(!target?.isConnected||!target.checkVisibility({opacityProperty:true,visibilityProperty:true}))throw new Error('Startup control lost visibility before dispatch');
    const box=target.getBoundingClientRect();const point={x:box.x+box.width/2,y:box.y+box.height/2};
    if(!box.width||!box.height||point.x<0||point.y<0||point.x>=innerWidth||point.y>=innerHeight)throw new Error('Startup control moved outside the viewport');
    state.initialPoint=state.point;state.point=point;state.dispatchGeometryAt=performance.now();state.geometryChanged=Math.abs(point.x-state.initialPoint.x)>1||Math.abs(point.y-state.initialPoint.y)>1;
    window.addEventListener('pointerdown',event=>{state.targetHit=event.composedPath().includes(target);},{capture:true,once:true});
    window.__perf.arm('startup-landscape',{target:'#showcase-asset [data-layout]',attribute:'data-layout',value:'landscape'});
    return state;
  });
  await page.mouse.click(probe.point.x,probe.point.y);
  if(!(await page.evaluate(()=>window.__startupProbe.targetHit)))throw new Error('Startup input missed its observed control; invalid geometry probe');
  await page.waitForFunction(()=>window.__perf.state.actions.at(-1)?.completed,null,{polling:'raf',timeout:3000});
  const action=await page.evaluate(()=>window.__perf.state.actions.at(-1));
  return {...probe,targetHit:true,inputAt:action.eventStart,resultAt:action.semanticReady,frameAt:action.frameOpportunity,
    dispatchLag:action.eventStart-probe.visibleObserved,semanticMs:action.semanticReady-action.eventStart,
    frameMs:action.frameOpportunity-action.eventStart,status:'ok',
    interpretation:'Animation-frame-observed geometry, fresh dispatch coordinates and one verified-target trusted click. Navigation timestamps include exposed dispatch overhead. No claim of minimal readiness, field first-input time or compositor presentation.',
  };
}
