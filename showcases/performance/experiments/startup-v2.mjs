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
    if (card) for (const element of card.querySelectorAll('button,en-button,fluent-button,fluent-menu-button,sp-button,sp-action-button,[role="button"]')) {
      const label = (element.getAttribute('aria-label') || element.textContent).replace(/\s+/g,' ').trim();
      if (label !== 'Landscape') continue;
      if (!element.checkVisibility({opacityProperty:true,visibilityProperty:true})) continue;
      const box=element.getBoundingClientRect();
      const point={x:box.x+box.width/2,y:box.y+box.height/2};
      if (!box.width || !box.height || point.x<0 || point.y<0 || point.x>=innerWidth || point.y>=innerHeight) continue;
      state.found=true;state.visibleObserved=performance.now();state.point=point;state.tag=element.localName;
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
  const probe=await page.evaluate(()=>window.__startupProbe);
  await page.evaluate(()=>window.__perf.arm('startup-landscape',{
    target:'#showcase-asset [data-layout]',attribute:'data-layout',value:'landscape',
  }));
  await page.mouse.click(probe.point.x,probe.point.y);
  await page.waitForFunction(()=>window.__perf.state.actions.at(-1)?.completed,null,{polling:'raf',timeout:3000});
  const action=await page.evaluate(()=>window.__perf.state.actions.at(-1));
  return {...probe,inputAt:action.eventStart,resultAt:action.semanticReady,frameAt:action.frameOpportunity,
    dispatchLag:action.eventStart-probe.visibleObserved,semanticMs:action.semanticReady-action.eventStart,
    frameMs:action.frameOpportunity-action.eventStart,status:'ok',
    interpretation:'Animation-frame-observed visible-control geometry and one trusted click. Navigation timestamps include exposed dispatch overhead. No claim of minimal readiness, field first-input time or compositor presentation.',
  };
}
