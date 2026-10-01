import { expect, test, type Page } from '@playwright/test';
const base='--en-button-background:rgb(90,60,120);--en-button-color:rgb(255,255,255);--en-duration-fast:0ms;';
const states='--en-button-rest-background:rgb(100,60,130);--en-button-rest-color:rgb(250,240,255);--en-button-hover-background:rgb(70,40,100);--en-button-hover-color:rgb(240,220,255);--en-button-pressed-background:rgb(45,20,70);--en-button-pressed-color:rgb(230,210,250);';
const selectors=['#native','#leaf button','#aggregate button'];
async function mount(page:Page,variant='primary',style=base+states){
 await page.evaluate(async({variant,style})=>{
  document.querySelector('#fixture')!.innerHTML=`<section id="scope" style="${style}"><div class="row"><button id="native" class="en-button" data-variant="${variant}">Save native</button><en-button id="leaf" variant="${variant}">Save leaf</en-button><en-aggregate-button id="aggregate" variant="${variant}">Save aggregate</en-aggregate-button></div></section>`;
  await Promise.all(['leaf','aggregate'].map(id=>(document.getElementById(id) as any).updateComplete));
 },{variant,style});
}
async function paint(page:Page,selector:string,bg:string,color?:string){
 const node=page.locator(selector);await expect(node).toHaveCSS('background-color',bg);
 if(color)await expect(node).toHaveCSS('color',color);
}
test.beforeEach(async({page})=>{await page.goto('/packages/styles/tests/state-paint/fixture.html');await expect(page.locator('body')).toHaveAttribute('data-ready','true');});
for(const variant of ['primary','secondary','ghost','danger']) test(`${variant}: explicit states refine base with native/leaf/aggregate parity`,async({page})=>{
 await mount(page,variant);
 for(const selector of selectors){
  const node=page.locator(selector);await page.mouse.move(0,0);
  await paint(page,selector,'rgb(100, 60, 130)','rgb(250, 240, 255)');
  await node.hover();await paint(page,selector,'rgb(70, 40, 100)','rgb(240, 220, 255)');
  await page.mouse.down();await paint(page,selector,'rgb(45, 20, 70)','rgb(230, 210, 250)');
  await page.mouse.up();await paint(page,selector,'rgb(70, 40, 100)');
  await page.mouse.move(0,0);await paint(page,selector,'rgb(100, 60, 130)');
 }
});
test('existing broad pins and transparent ghost rest retain compatibility; optional states fall back independently',async({page})=>{
 for(const variant of ['primary','secondary','ghost','danger']){
  await mount(page,variant,base);
  for(const selector of selectors){
   await page.mouse.move(0,0);await paint(page,selector,variant==='ghost'?'rgba(0, 0, 0, 0)':'rgb(90, 60, 120)');
   await page.locator(selector).hover();await paint(page,selector,'rgb(90, 60, 120)');
   await page.mouse.down();await paint(page,selector,'rgb(90, 60, 120)');await page.mouse.up();
  }
 }
 await mount(page,'primary',base+'--en-button-rest-background:rgb(1,2,3);--en-button-hover-color:rgb(4,5,6)');
 await page.locator('#leaf button').hover();await paint(page,'#leaf button','rgb(90, 60, 120)','rgb(4, 5, 6)');
 await page.mouse.down();await paint(page,'#leaf button','rgb(90, 60, 120)','rgb(255, 255, 255)');await page.mouse.up();
});
test('disabled, aria-disabled and loading retain disabled paint and suppress activation',async({page})=>{
 for(const mode of ['disabled','aria-disabled','loading']){
  await mount(page);
  await page.locator('#leaf').evaluate((node,mode)=>{node.setAttribute(mode,mode==='aria-disabled'?'true':'');(window as any).clicks=0;node.addEventListener('click',()=>{(window as any).clicks++;});},mode);
  const button=page.locator('#leaf button');
  const disabled=await button.evaluate(node=>({background:getComputedStyle(node).backgroundColor,color:getComputedStyle(node).color}));
  expect(disabled.background).not.toBe('rgb(100, 60, 130)');
  await button.hover({force:true});await page.mouse.down();
  await paint(page,'#leaf button',disabled.background,disabled.color);await page.mouse.up();
  expect(await page.evaluate(()=>(window as any).clicks)).toBe(0);
 }
});
test('keyboard pressed state and focus visibility coexist; motion and forced colors retain their contracts',async({page})=>{
 await mount(page);await page.bringToFront();await page.mouse.move(0,0);await page.keyboard.press('Tab');
 // Match the engine's native Space/:active behavior; some platform builds activate
 // on keyup without exposing :active during keydown. No synthetic key state.
 await page.locator('#fixture').evaluate(node=>node.insertAdjacentHTML('beforeend','<button id="reference">Native reference</button>'));
 await page.locator('#reference').focus();await page.keyboard.down('Space');
 const nativeActive=await page.locator('#reference').evaluate(node=>node.matches(':active'));await page.keyboard.up('Space');
 const button=page.locator('#native');await button.focus();await expect(button).toBeFocused();
 await button.evaluate(node=>{(window as any).keyboardClicks=0;node.addEventListener('click',()=>{(window as any).keyboardClicks++;});});
 const focus=await button.evaluate(node=>({outline:getComputedStyle(node).outlineStyle,shadow:getComputedStyle(node).boxShadow}));
 expect(focus.outline!=='none'||focus.shadow!=='none').toBeTruthy();
 await page.keyboard.down('Space');expect(await button.evaluate(node=>node.matches(':active'))).toBe(nativeActive);
 await paint(page,'#native',nativeActive?'rgb(45, 20, 70)':'rgb(100, 60, 130)');await page.keyboard.up('Space');
 expect(await page.evaluate(()=>(window as any).keyboardClicks)).toBe(1);
 await paint(page,'#native','rgb(100, 60, 130)');
 await page.emulateMedia({reducedMotion:'reduce'});await expect(button).toHaveCSS('transition-duration','0s');
 await page.emulateMedia({forcedColors:'active'});
 if(await page.evaluate(()=>matchMedia('(forced-colors:active)').matches)){
  await expect(button).not.toHaveCSS('background-color','rgb(100, 60, 130)');
  await button.hover();await expect(button).not.toHaveCSS('background-color','rgb(70, 40, 100)');
 }
});
test('Parts, nested full reset, partial inheritance and compatible property registrations compose',async({page})=>{
 await mount(page);
 await page.addStyleTag({content:'#leaf::part(control){--en-button-hover-background:rgb(10,20,30)}'});
 await page.locator('#leaf button').hover();await paint(page,'#leaf button','rgb(10, 20, 30)');
 await page.evaluate(()=>{const api=window as any;const sheet=document.createElement('style');sheet.textContent=api.emitPropertyRegistrations(api.resolveTheme());document.head.append(sheet);});
 await page.locator('#aggregate button').hover();await paint(page,'#aggregate button','rgb(70, 40, 100)');
 await page.evaluate(()=>{const api=window as any;const sheet=document.createElement('style');sheet.id='child-theme';sheet.textContent=api.emitThemeCSS(api.resolveTheme(),{selector:'#aggregate'});document.head.append(sheet);});
 await expect(page.locator('#aggregate button')).not.toHaveCSS('background-color','rgb(70, 40, 100)');
 await page.evaluate(()=>{const api=window as any;document.querySelector('#child-theme')!.textContent=api.emitThemeCSS(api.resolveTheme(),{kind:'partial',tokenIds:['color.action'],selector:'#aggregate'});});
 await paint(page,'#aggregate button','rgb(70, 40, 100)');
});
test('touch has no hover paint; pressed paint and minimum targets survive',async({browser})=>{
 const context=await browser.newContext({hasTouch:true});const page=await context.newPage();
 try{
  await page.goto('http://127.0.0.1:4483/packages/styles/tests/state-paint/fixture.html');await expect(page.locator('body')).toHaveAttribute('data-ready','true');await mount(page);
  await page.locator('#leaf button').tap();await paint(page,'#leaf button','rgb(100, 60, 130)');
  expect(await page.locator('#leaf button').evaluate(node=>node.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
 }finally{await context.close();}
});


test('unpinned variants preserve semantic defaults and icon-only geometry',async({page})=>{
 const semantic='--en-color-action:rgb(10,20,30);--en-color-action-hover:rgb(20,30,40);--en-color-action-pressed:rgb(30,40,50);--en-color-surface-subtle:rgb(40,50,60);--en-color-selected:rgb(50,60,70);--en-color-surface:rgb(60,70,80);--en-duration-fast:0ms;';
 const expected={primary:['rgb(10, 20, 30)','rgb(20, 30, 40)','rgb(30, 40, 50)'],secondary:['rgb(40, 50, 60)','rgb(50, 60, 70)','rgb(50, 60, 70)'],ghost:['rgba(0, 0, 0, 0)','rgb(50, 60, 70)','rgb(50, 60, 70)'],danger:['rgb(60, 70, 80)','rgb(40, 50, 60)','rgb(40, 50, 60)']};
 for(const [variant,paints] of Object.entries(expected)){
  await mount(page,variant,semantic);await page.mouse.move(0,0);await paint(page,'#leaf button',paints[0]);
  await page.locator('#leaf button').hover();await paint(page,'#leaf button',paints[1]);
  await page.mouse.down();if(variant==='primary')await paint(page,'#leaf button',paints[2]);else await expect(page.locator('#leaf button')).not.toHaveCSS('background-color',paints[1]);await page.mouse.up();
 }
 await mount(page);await page.locator('#leaf').evaluate(node=>node.setAttribute('icon-only',''));
 const button=page.locator('#leaf button');const before=await button.boundingBox();
 await button.hover();await paint(page,'#leaf button','rgb(70, 40, 100)');await page.mouse.down();await paint(page,'#leaf button','rgb(45, 20, 70)');await page.mouse.up();
 const after=await button.boundingBox();expect(after!.width).toBe(before!.width);expect(after!.height).toBe(before!.height);expect(Math.abs(after!.width-after!.height)).toBeLessThan(1);
});
