import { expect, test, type Page } from '@playwright/test';
const placements=['left','right','top','bottom','start','end'] as const;
const motionSupported=(page:Page)=>page.evaluate(()=>CSS.supports('transition-behavior','allow-discrete')&&CSS.supports('overlay','auto'));
async function prepare(page:Page,placement:string,direction='ltr',offset=4) {
  await page.evaluate(async({placement,direction,offset})=>{
    const host=document.getElementById('drawer') as any;
    host.placement=placement;host.dir=direction;
    for(const [name,value] of Object.entries({'--en-duration-enter':'400ms','--en-duration-exit':'400ms','--en-ease-enter':'linear','--en-ease-exit':'linear','--en-motion-surface-offset':`${offset}px`,'--en-motion-surface-scale':'.95'})) host.style.setProperty(name,value);
    await host.updateComplete;
  },{placement,direction,offset});
}
async function frame(page:Page,fraction:number) {
  return page.evaluate(fraction=>{
    const surface=(window as any).motion.surface('drawer') as HTMLDialogElement;
    const animations=surface.getAnimations();
    const translation=animations.find(animation=>(animation as CSSTransition).transitionProperty==='translate');
    for(const animation of animations) { animation.pause();animation.currentTime=Number(animation.effect!.getTiming().duration)*fraction; }
    const box=surface.getBoundingClientRect(),style=getComputedStyle(surface);
    return {x:box.x,y:box.y,width:box.width,height:box.height,right:box.right,bottom:box.bottom,
      translation:Boolean(translation),scale:style.scale,opacity:Number(style.opacity),open:surface.open,inert:surface.inert,
      focusWithin:surface.matches(':focus-within'),viewport:[document.documentElement.clientWidth,innerWidth,document.documentElement.clientHeight,innerHeight]};
  },fraction);
}
async function finish(page:Page) {
  await page.evaluate(()=>{for(const animation of (window as any).motion.surface('drawer').getAnimations()) animation.finish();});
}
test.beforeEach(async({page,browser},info)=>{
  info.annotations.push({type:'browser-version',description:browser.version()});
  await page.goto('/fixture');await page.evaluate(()=>(window as any).hydrateMotionFixture());
  await expect(page.locator('html')).toHaveAttribute('data-hydrated','true');
});
for(const direction of ['ltr','rtl']) test(`drawer shares dialog travel distance for all four edges and logical aliases in ${direction}`,async({page},info)=>{
  const enhanced=await motionSupported(page);const receipts=[];
  for(const placement of placements) {
    await prepare(page,placement,direction);
    await page.evaluate(()=>(window as any).motion.open('drawer'));
    const start=await frame(page,0),middle=await frame(page,.5),end=await frame(page,1);
    const edge=placement==='start'?(direction==='rtl'?'right':'left'):placement==='end'?(direction==='rtl'?'left':'right'):placement;
    expect(start.open).toBe(true);expect(start.inert).toBe(false);expect(start.opacity).toBe(1);
    expect(end.scale).toBe(enhanced?'1':'none');
    if(enhanced) {
      expect(start.translation).toBe(true);expect(start.scale).toBe('1');expect(middle.scale).toBe('1');
      const dx=edge==='left'?-4:edge==='right'?4:0;
      const dy=edge==='top'?-4:edge==='bottom'?4:0;
      expect(Math.abs(start.x-end.x-dx)).toBeLessThan(1);
      expect(Math.abs(start.y-end.y-dy)).toBeLessThan(1);
      expect(Math.abs(middle.x-end.x-dx/2)).toBeLessThan(1);
      expect(Math.abs(middle.y-end.y-dy/2)).toBeLessThan(1);
      expect(start.width).toBeCloseTo(end.width,1);expect(start.height).toBeCloseTo(end.height,1);
    }
    if(edge==='left') expect(Math.abs(end.x)).toBeLessThan(1);
    if(edge==='right') expect(Math.min(...end.viewport.slice(0,2).map((width:number)=>Math.abs(end.right-width)))).toBeLessThan(1);
    if(edge==='top') expect(Math.abs(end.y)).toBeLessThan(1);
    if(edge==='bottom') expect(Math.min(...end.viewport.slice(2).map((height:number)=>Math.abs(end.bottom-height)))).toBeLessThan(1);
    await finish(page);
    await page.evaluate(()=>(window as any).motion.close('drawer'));
    const exitStart=await frame(page,0),exitMiddle=await frame(page,.5);
    expect(exitStart.open).toBe(false);expect(exitStart.inert).toBe(true);
    if(enhanced) {
      expect(Math.abs(exitMiddle.x-middle.x)).toBeLessThan(1);
      expect(Math.abs(exitMiddle.y-middle.y)).toBeLessThan(1);
    }
    await finish(page);
    receipts.push({placement,edge,start,middle,end,exitStart,exitMiddle});
  }
  await info.attach(`drawer-${direction}-geometry.json`,{body:JSON.stringify({enhanced,receipts},null,2),contentType:'application/json'});
});
test('zero shared offset leaves every drawer edge stationary during entry and exit',async({page})=>{
  const enhanced=await motionSupported(page);
  for(const placement of placements) {
    await prepare(page,placement,'ltr',0);
    await page.evaluate(()=>(window as any).motion.open('drawer'));
    const start=await frame(page,0),end=await frame(page,1);
    expect(start.translation).toBe(false);
    expect(start.x).toBeCloseTo(end.x,1);expect(start.y).toBeCloseTo(end.y,1);
    expect(start.open).toBe(true);expect(start.inert).toBe(false);expect(start.opacity).toBe(1);
    await finish(page);await page.evaluate(()=>(window as any).motion.close('drawer'));
    const exiting=await frame(page,.5);
    expect(exiting.translation).toBe(false);
    if(enhanced) {
      expect(exiting.x).toBeCloseTo(end.x,1);expect(exiting.y).toBeCloseTo(end.y,1);
    } else {
      expect(await page.evaluate(()=>getComputedStyle((window as any).motion.surface('drawer')).display)).toBe('none');
    }
    expect(exiting.open).toBe(false);expect(exiting.inert).toBe(true);
    await finish(page);
  }
});
test('edge entry preserves document scroll and allows native keyboard editing before animation settles',async({page,browserName})=>{
  await prepare(page,'right');
  await page.evaluate(async()=>{
    const host=document.getElementById('drawer') as any;
    const input=document.createElement('input');input.id='drawer-editor';input.setAttribute('aria-label','Draft notes');host.append(input);
    (window as any).drawerEditor=input;
    document.body.style.minHeight='1800px';scrollTo(0,250);
    document.getElementById('drawer-trigger')!.focus({preventScroll:true});
    (window as any).beforeDrawerScroll=scrollY;
    host.show();await (window as any).motion.settle();await (window as any).motion.frames();
  });
  const entered=await frame(page,.5);
  expect(entered.open).toBe(true);expect(entered.inert).toBe(false);expect(entered.opacity).toBe(1);
  const close=page.locator('#drawer').getByRole('button',{name:'Close',exact:true});
  const tab=browserName==='webkit'?'Alt+Tab':'Tab';
  // Native dialog focusing steps may stop at the surface (Firefox/WebKit)
  // or enter the close button's shadow root (Chromium).
  const surfaceFocused=await page.evaluate(()=>{
    const host=document.getElementById('drawer')!;
    return host.shadowRoot!.activeElement===(window as any).motion.surface('drawer');
  });
  if(surfaceFocused)await page.keyboard.press(tab);
  await expect(close).toBeFocused();
  await page.keyboard.press(tab);
  await expect(page.locator('#drawer-content')).toBeFocused();
  await page.keyboard.press(tab);
  await expect(page.locator('#drawer-editor')).toBeFocused();
  await page.keyboard.type('Keep this draft');
  await expect(page.locator('#drawer-editor')).toHaveValue('Keep this draft');
  expect(await page.evaluate(()=>scrollY===(window as any).beforeDrawerScroll)).toBe(true);
  await finish(page);await page.evaluate(()=>(window as any).motion.close('drawer'));
  expect((await frame(page,.5)).inert).toBe(true);await finish(page);
  await page.evaluate(()=>(window as any).motion.open('drawer'));
  expect(await page.evaluate(()=>document.getElementById('drawer-editor')===(window as any).drawerEditor)).toBe(true);
  await expect(page.locator('#drawer-editor')).toHaveValue('Keep this draft');
});
test('veto and interrupted edge exit preserve native authority without restarting at the full offset',async({page})=>{
  await prepare(page,'left');await page.evaluate(()=>(window as any).motion.open('drawer'));
  await frame(page,.5);
  await page.evaluate(()=>document.getElementById('drawer')!.addEventListener('en-change',event=>event.preventDefault(),{once:true}));
  await page.evaluate(()=>(window as any).motion.close('drawer'));
  expect(await page.evaluate(()=>(window as any).motion.surface('drawer').open)).toBe(true);
  expect(await page.evaluate(()=>(window as any).motion.surface('drawer').inert)).toBe(false);
  await finish(page);
  await page.evaluate(()=>(window as any).motion.close('drawer'));await frame(page,.5);
  const progress=await page.evaluate(async()=>{
    const motion=(window as any).motion,host=document.getElementById('drawer') as any,surface=motion.surface('drawer');
    const before=surface.getBoundingClientRect().x;
    host.show();await motion.settle();
    const after=surface.getBoundingClientRect().x;
    return {before,after,open:surface.open,inert:surface.inert,opacity:getComputedStyle(surface).opacity};
  });
  expect(progress.open).toBe(true);expect(progress.inert).toBe(false);expect(progress.opacity).toBe('1');
  if(await motionSupported(page)) expect(Math.abs(progress.before-progress.after)).toBeLessThan(1);
  await page.waitForTimeout(450);
  await expect(page.locator('#drawer')).toHaveJSProperty('open',true);
});
test('reduced motion keeps all edges at their final position and completes close immediately',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  for(const direction of ['ltr','rtl']) for(const placement of placements) {
    await prepare(page,placement,direction);await page.evaluate(()=>(window as any).motion.open('drawer'));
    const result=await page.evaluate(()=>{
      const surface=(window as any).motion.surface('drawer'),style=getComputedStyle(surface);
      return {translate:style.translate,scale:style.scale,animations:surface.getAnimations().length};
    });
    expect(result).toEqual({translate:'none',scale:'none',animations:0});
    await page.evaluate(()=>(window as any).motion.close('drawer'));
    expect(await page.evaluate(()=>getComputedStyle((window as any).motion.surface('drawer')).display)).toBe('none');
  }
});
test('responsive dialog uses the same native view for bottom-edge motion and centered presentation',async({page})=>{
  await page.evaluate(async()=>{
    const host=document.getElementById('dialog') as any;
    (window as any).responsiveNative=(window as any).motion.surface('dialog');
    host.presentation='responsive';host.responsiveQuery='(min-width: 0px)';
    host.style.setProperty('--en-duration-enter','400ms');host.style.setProperty('--en-duration-exit','400ms');
    host.style.setProperty('--en-ease-enter','linear');host.style.setProperty('--en-motion-surface-offset','4px');
    host.style.setProperty('--en-motion-surface-scale','.95');
    await (window as any).motion.settle();await (window as any).motion.open('dialog');
  });
  const result=await page.evaluate(()=>{
    const surface=(window as any).motion.surface('dialog') as HTMLDialogElement;
    const animations=surface.getAnimations();
    for(const animation of animations){animation.pause();animation.currentTime=0;}
    const start=surface.getBoundingClientRect();
    for(const animation of animations)animation.currentTime=Number(animation.effect!.getTiming().duration);
    const end=surface.getBoundingClientRect();
    return {same:surface===(window as any).responsiveNative,drawer:surface.classList.contains('en-drawer'),placement:surface.dataset.placement,
      start:{x:start.x,y:start.y},end:{x:end.x,y:end.y,width:end.width,height:end.height},scale:getComputedStyle(surface).scale};
  });
  expect(result.same).toBe(true);expect(result.drawer).toBe(true);expect(result.placement).toBe('bottom');
  if(await motionSupported(page)) {
    expect(Math.abs(result.start.y-result.end.y-4)).toBeLessThan(1);
    expect(Math.abs(result.start.x-result.end.x)).toBeLessThan(1);expect(result.scale).toBe('1');
  }
  await page.evaluate(async()=>{
    const motion=(window as any).motion,host=document.getElementById('dialog') as any;
    for(const animation of motion.surface('dialog').getAnimations())animation.finish();
    await motion.close('dialog');for(const animation of motion.surface('dialog').getAnimations())animation.finish();
    // Commit the completed native exit before measuring a fresh presentation.
    await motion.frames();
    host.presentation='dialog';host.style.setProperty('--en-motion-surface-scale','1');
    await motion.settle();await motion.open('dialog');
  });
  expect(await page.evaluate(()=>{
    const surface=(window as any).motion.surface('dialog');
    return surface===(window as any).responsiveNative&&surface.classList.contains('en-dialog')&&surface.open&&!surface.inert;
  })).toBe(true);
  if(await motionSupported(page)) {
    const dialogTravel=await page.evaluate(()=>{
      const surface=(window as any).motion.surface('dialog'),animations=surface.getAnimations();
      for(const animation of animations){animation.pause();animation.currentTime=0;}
      const start=surface.getBoundingClientRect().y;
      for(const animation of animations)animation.currentTime=Number(animation.effect!.getTiming().duration);
      return start-surface.getBoundingClientRect().y;
    });
    expect(dialogTravel).toBeCloseTo(4,1);
    expect(result.start.y-result.end.y).toBeCloseTo(dialogTravel,1);
  }
});
