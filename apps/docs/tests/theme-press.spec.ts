import {test,expect,type Locator} from '@playwright/test';
async function frame(button:Locator){return button.evaluate(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,layoutWidth:(el as HTMLElement).offsetWidth,layoutHeight:(el as HTMLElement).offsetHeight,scale:s.scale,translate:s.translate,transition:s.transitionProperty,duration:s.transitionDuration};});}
for(const theme of ['astryx-inspired','shadcn-inspired'])for(const appearance of ['light','dark'])test(`${theme} ${appearance}: Create and Preview transform their complete surfaces with source-specific popup behavior`,async({page},info)=>{
 await page.goto(`/showcase?theme=${theme}&appearance=${appearance}`);
 await expect(page.locator('html')).toHaveAttribute('data-en-theme',theme);
 await expect(page.getByRole('button',{name:'Download CSS',exact:true})).toBeEnabled();
 const create=page.locator('#showcase-create-trigger button');const preview=page.getByRole('button',{name:'Preview',exact:true});
 await expect(create).toHaveAttribute('aria-haspopup','dialog');
 for(const [name,button] of [['Create',create],['Preview',preview]] as const){
  const scale=theme==='astryx-inspired'?.98:1;const offset=theme==='shadcn-inspired'&&name==='Preview'?1:0;
  await button.hover();const before=await frame(button);await page.mouse.down();
  await expect.poll(async()=> (await frame(button)).scale).toBe(String(scale));
  await expect.poll(async()=> (await frame(button)).translate).toBe(offset?'0px 1px':'0px');
  await expect.poll(async()=> (await frame(button)).width).toBeCloseTo(before.width*scale,1);
  await expect.poll(async()=> (await frame(button)).y).toBeCloseTo(before.y+before.height*(1-scale)/2+offset,1);
  const held=await frame(button);expect(held.layoutWidth).toBe(before.layoutWidth);expect(held.layoutHeight).toBe(before.layoutHeight);
  expect(held.transition).toContain('scale');expect(held.transition).toContain('translate');expect(held.duration).toContain(theme==='astryx-inspired'?'0.175s':'0.15s');
  expect(await button.locator('.en-button__label').evaluate(el=>({scale:getComputedStyle(el).scale,translate:getComputedStyle(el).translate}))).toEqual({scale:'none',translate:'none'});
  await page.screenshot({path:info.outputPath(`${name.toLowerCase()}-held.png`)});
  // Await the actual dialog cycle before another gesture.
  const dialog=page.locator(name==='Create'?'#showcase-create-dialog dialog':'#showcase-preview-dialog dialog');
  const closeDialog=async()=>{await expect(dialog).toBeVisible();await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();};
  await page.mouse.up();await closeDialog();await expect.poll(async()=> (await frame(button)).width).toBeCloseTo(before.width,1);
  await page.keyboard.press('Tab');await button.focus();await expect(button).toBeFocused();await page.keyboard.down('Space');const nativeSpaceActive=await button.evaluate(el=>el.matches(':active'));await info.attach(`${name}-keyboard-active`,{body:JSON.stringify({nativeSpaceActive}),contentType:'application/json'});await expect.poll(async()=> (await frame(button)).scale).toBe(nativeSpaceActive?String(scale):'none');
  expect(await button.evaluate(el=>getComputedStyle(el).outlineStyle)).not.toBe('none');await page.keyboard.up('Space');await closeDialog();
  await page.emulateMedia({reducedMotion:'reduce'});await button.hover();await page.mouse.down();expect((await frame(button)).scale).toBe('none');expect((await frame(button)).translate).toBe('none');await page.mouse.up();await closeDialog();await page.emulateMedia({reducedMotion:'no-preference'});

 }
});
