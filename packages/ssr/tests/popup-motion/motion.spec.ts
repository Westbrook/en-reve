import { expect, test, type Page } from '@playwright/test';
const ids=['dialog','drawer','popover','menu','palette','combobox'];
const run=(page:Page,method:string,id:string)=>page.evaluate(async({method,id})=>(window as any).motion[method](id),{method,id});
const info=(page:Page,id:string)=>run(page,'info',id);
async function hydrate(page:Page) {
  await page.evaluate(()=>(window as any).hydrateMotionFixture());
  await expect(page.locator('html')).toHaveAttribute('data-hydrated','true');
}
test.beforeEach(async({page,browser},testInfo)=>{
  testInfo.annotations.push({type:'browser-version',description:browser.version()});
  await page.goto('/fixture');
});
for(const id of ids) test(`${id}: native entry and exit paint preserve state, focus participation and the same surface`,async({page,browserName},testInfo)=>{
  await page.evaluate((id)=>{(window as any).originalSurface=document.getElementById(id)!.shadowRoot!.querySelector(id==='combobox'?'[part="popup"]':'[part~="surface"]');},id);
  await hydrate(page);
  await run(page,'open',id);
  const opened=await info(page,id);
  expect(opened.shown).toBe(true);expect(opened.inert).toBe(false);
  if(!['combobox','popover'].includes(id)) expect(opened.opacity).toBe(1);
  const enhanced=await page.evaluate(()=>CSS.supports('transition-behavior','allow-discrete')&&CSS.supports('overlay','auto'));
  if(enhanced) expect(opened.animations.some((a:any)=>a.duration>0)).toBe(true);
  if(['popover','menu','combobox'].includes(id)) {
    expect(opened.translate).toBe('none');expect(opened.scale).toBe('none');
  }
  // Settle entry before proving a full, rather than reversal-shortened, exit.
  await page.waitForTimeout(450);
  await run(page,'close',id);
  const closed=await info(page,id);
  expect(closed.shown).toBe(false);expect(closed.modal).toBe(false);expect(closed.inert).toBe(true);
  if(enhanced) {
    expect(closed.animations.some((a:any)=>a.duration>0)).toBe(true);
    expect(closed.display).not.toBe('none');
  }
  await page.evaluate(id=>{
    const surface=(window as any).motion.surface(id);
    const child=surface.querySelector('button,input,[tabindex]');child?.focus();
    surface.focus();
  },id);
  expect((await info(page,id)).activeInside).toBe(false);
  await page.keyboard.press(browserName==='webkit'?'Alt+Tab':'Tab');
  expect((await info(page,id)).activeInside).toBe(false);
  await page.keyboard.press(browserName==='webkit'?'Alt+Shift+Tab':'Shift+Tab');
  expect((await info(page,id)).activeInside).toBe(false);
  expect(await page.evaluate((id)=>(window as any).originalSurface===(window as any).motion.surface(id),id)).toBe(true);
  await page.waitForTimeout(450);
  expect((await info(page,id)).display).toBe('none');
  await testInfo.attach(`${id}-motion.json`,{body:JSON.stringify({enhanced,opened,closed},null,2),contentType:'application/json'});
});
test('veto and equal authoritative open writes never start exit or remove focus participation',async({page})=>{
  await hydrate(page);
  for(const id of ['dialog','menu']) {
    await run(page,'open',id);
    await page.evaluate(id=>document.getElementById(id)!.addEventListener('en-change',event=>{
      if(!(event as CustomEvent).detail.proposed) event.preventDefault();
    },{once:true}),id);
    await run(page,'close',id);expect((await info(page,id)).shown).toBe(true);expect((await info(page,id)).inert).toBe(false);
    await page.evaluate(id=>document.getElementById(id)!.addEventListener('en-change',event=>{
      event.preventDefault();(event.currentTarget as any).open=true;
    },{once:true}),id);
    await run(page,'close',id);expect((await info(page,id)).shown).toBe(true);expect((await info(page,id)).inert).toBe(false);
    await run(page,'close',id);
  }
});
test('close then immediate reopen has no stale completion, duplicated native node or late focus restoration',async({page})=>{
  await hydrate(page);
  for(const id of ids) {
    await run(page,'open',id);await run(page,'close',id);await run(page,'open',id);
    if(!['combobox','popover'].includes(id)) expect((await info(page,id)).opacity).toBe(1);
    await page.waitForTimeout(450);
    expect((await info(page,id)).shown).toBe(true);expect((await info(page,id)).inert).toBe(false);
    await run(page,'close',id);
  }
});
test('native Escape and external native close produce inert exiting surfaces without delaying dismissal',async({page})=>{
  await hydrate(page);await run(page,'open','dialog');await page.keyboard.press('Escape');
  await expect(page.locator('#dialog')).toHaveJSProperty('open',false);
  expect((await info(page,'dialog')).inert).toBe(true);
  await run(page,'open','palette');
  await page.evaluate(()=>{(window as any).motion.surface('palette').close();});
  expect((await info(page,'palette')).inert).toBe(true);
  await expect(page.locator('#palette')).toHaveJSProperty('open',false);
});
test('reduced motion and duration changes during exit leave no pending focus or top-layer work',async({page})=>{
  await hydrate(page);await run(page,'open','dialog');await run(page,'close','dialog');
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect.poll(async()=> (await info(page,'dialog')).display).toBe('none');
  for(const id of ids) {
    await run(page,'open',id);expect((await info(page,id)).animations).toEqual([]);
    await run(page,'close',id);expect((await info(page,id)).display).toBe('none');
  }
  await page.emulateMedia({reducedMotion:'no-preference'});
  await run(page,'open','menu');await run(page,'close','menu');
  await page.evaluate(()=>document.documentElement.style.setProperty('--en-duration-exit','0ms'));
  await expect.poll(async()=> (await info(page,'menu')).display).toBe('none');
  expect((await info(page,'menu')).inert).toBe(true);
});
test('disconnect during exit and trigger removal do not reopen or move focus later',async({page})=>{
  await hydrate(page);await run(page,'open','popover');await run(page,'close','popover');
  await page.evaluate(()=>{
    const host=document.getElementById('popover')!;(window as any).detached=host;host.remove();
    document.getElementById('after')!.focus();
  });
  await page.waitForTimeout(450);await expect(page.locator('#after')).toBeFocused();
  await page.evaluate(()=>document.getElementById('fixture')!.append((window as any).detached));
  expect((await info(page,'popover')).shown).toBe(false);
  await run(page,'open','menu');
  const command=page.locator('#menu-content').locator('button');
  await expect(command).toBeFocused();
  await page.evaluate(async()=>{
    (window as any).anchorChanges=[];
    document.getElementById('menu')!.addEventListener('en-change',event=>(window as any).anchorChanges.push((event as CustomEvent).detail));
    document.getElementById('menu-trigger')!.remove();
    await (window as any).motion.settle();await (window as any).motion.frames();
  });
  // The established for contract retains an already visible surface when its
  // anchor disappears. Removal is not an implicit user dismissal transaction.
  await expect(page.locator('#menu')).toHaveJSProperty('open',true);
  expect((await info(page,'menu')).shown).toBe(true);
  expect((await info(page,'menu')).inert).toBe(false);
  await expect(command).toBeFocused();
  expect(await page.evaluate(()=>(window as any).anchorChanges)).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(page.locator('#menu')).toHaveJSProperty('open',false);
  expect((await info(page,'menu')).inert).toBe(true);
  await page.locator('#after').focus();
  await page.waitForTimeout(450);await expect(page.locator('#after')).toBeFocused();
});
test('SSR closed surfaces are hidden and retain native nodes through hydration',async({page})=>{
  for(const id of ids) {
    const native=page.locator(`#${id}`).locator(id==='combobox'?'[part="popup"]':'[part~="surface"]');
    await expect(native).toHaveAttribute('inert','');await expect(native).toBeHidden();
  }
  await hydrate(page);
  for(const id of ids) expect((await info(page,id)).shown).toBe(false);
});

test('closed exiting command and suggestion nodes cannot accept stale scripted activation',async({page})=>{
  await hydrate(page);
  await page.evaluate(()=>{(window as any).actions=[];document.addEventListener('en-action',event=>(window as any).actions.push((event as CustomEvent).detail));});
  await run(page,'open','menu');await run(page,'close','menu');
  await page.evaluate(()=>document.getElementById('menu-content')!.shadowRoot!.querySelector('button')!.click());
  expect(await page.evaluate(()=>(window as any).actions)).toEqual([]);
  await run(page,'open','combobox');await run(page,'close','combobox');
  await page.evaluate(()=>((window as any).motion.surface('combobox').querySelector('[data-value="b"]') as HTMLElement).click());
  await expect(page.locator('#combobox')).toHaveJSProperty('value','a');
});

for(const viewport of [{name:'desktop',width:1100,height:800},{name:'compact',width:390,height:400}]) {
  for(const direction of ['ltr','rtl']) test(`dialog and palette keep the same centered motion in ${viewport.name} ${direction}`,async({page},testInfo)=>{
    await page.setViewportSize(viewport);
    await page.evaluate(direction=>document.documentElement.dir=direction,direction);
    await hydrate(page);
    const enhanced=await page.evaluate(()=>CSS.supports('transition-behavior','allow-discrete')&&CSS.supports('overlay','auto'));
    const receipts=[];
    for(const recipe of [{scale:.95,offset:4},{scale:.98,offset:4},{scale:1,offset:4},{scale:.95,offset:0}]) {
      const samples:Record<string,any>={};
      for(const id of ['dialog','palette']) {
        await page.evaluate(({id,recipe})=>{
          const host=document.getElementById(id)!;
          host.style.setProperty('--en-motion-surface-scale',String(recipe.scale));
          host.style.setProperty('--en-motion-surface-offset',`${recipe.offset}px`);
          host.style.setProperty('--en-ease-enter','linear');host.style.setProperty('--en-ease-exit','linear');
        },{id,recipe});
        await run(page,'open',id);
        const sample=await page.evaluate(id=>{
          const surface=(window as any).motion.surface(id),animations=surface.getAnimations();
          const measure=(fraction:number)=>{
            for(const animation of animations){animation.pause();animation.currentTime=Number(animation.effect!.getTiming().duration)*fraction;}
            const box=surface.getBoundingClientRect();
            return {cx:box.x+box.width/2,cy:box.y+box.height/2,width:box.width,height:box.height};
          };
          return {start:measure(0),middle:measure(.5),end:measure(1)};
        },id);
        if(id==='palette') {
          const center=await page.evaluate(()=>({
            x:(visualViewport?.offsetLeft??0)+(visualViewport?.width??innerWidth)/2,
            y:(visualViewport?.offsetTop??0)+(visualViewport?.height??innerHeight)/2,
          }));
          expect(sample.end.cx).toBeCloseTo(center.x,1);expect(sample.end.cy).toBeCloseTo(center.y,1);
        }
        for(const [frame,fraction] of [['start',0],['middle',.5],['end',1]] as const) {
          expect(sample[frame].cx,`${id} horizontal center at ${frame}`).toBeCloseTo(sample.end.cx,1);
          expect(sample[frame].cy-sample.end.cy,`${id} vertical travel at ${frame}`).toBeCloseTo(enhanced?recipe.offset*(1-fraction):0,1);
          const size=enhanced?recipe.scale+(1-recipe.scale)*fraction:1;
          expect(sample[frame].width/sample.end.width).toBeCloseTo(size,3);
        }
        samples[id]=sample;
        await page.evaluate(id=>{for(const animation of (window as any).motion.surface(id).getAnimations())animation.finish();},id);
        await run(page,'close',id);
        await page.evaluate(async id=>{
          for(const animation of (window as any).motion.surface(id).getAnimations())animation.finish();
          await (window as any).motion.frames();
        },id);
      }
      expect(samples.palette.start.cy-samples.palette.end.cy).toBeCloseTo(samples.dialog.start.cy-samples.dialog.end.cy,1);
      receipts.push({recipe,samples});
    }
    await testInfo.attach('modal-centers.json',{body:JSON.stringify({viewport,direction,enhanced,receipts},null,2),contentType:'application/json'});
  });
}
