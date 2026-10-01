import {test,expect,type Page,type Locator} from '@playwright/test';
import {tokenEditorStyles} from '@en-reve/styles/token-editor.js';
import {readFile} from 'node:fs/promises';
import {resolveTheme,emitThemeCSS,colorFromHex,createReviewDraft} from '@en-reve/tokens';
const styles=(await Promise.all(['controls','selection','combobox','navigation','calendar','tree','buttons'].map(name=>readFile(new URL(`../../../packages/styles/dist/${name}.css`,import.meta.url),'utf8')))).join('\n')+tokenEditorStyles.cssText;
const families=['segmented','accordion','tab','rating','combobox-trigger','navigation','editor-token','option','calendar','checkbox','radio','switch','select','number-step'];
async function mount(page:Page,mode:'light'|'dark'='light'){
 await page.goto('/showcase');await expect(page.getByRole('button',{name:'Download JSON',exact:true})).toBeEnabled();
 await page.evaluate(()=>{document.body.innerHTML=`<main class="en-foundation" data-en-theme="press-test" data-en-appearance="light" style="padding:40px;display:grid;gap:16px;max-width:650px">
 <en-segmented-control id="segments" label="View" value="one"><en-segmented-item value="one">One</en-segmented-item><en-segmented-item value="two">Two</en-segmented-item><en-segmented-item value="three" disabled>Disabled</en-segmented-item></en-segmented-control>
 <en-segmented-control id="items" label="Items"></en-segmented-control>
 <en-accordion><en-accordion-item id="accordion" value="details" label="More">Content</en-accordion-item></en-accordion>
 <en-tabs><en-tab id="tab" slot="tab" value="tab">Tab</en-tab><en-tab-panel slot="panel" value="tab">Panel</en-tab-panel></en-tabs>
 <en-rating id="rating" label="Rating" value="2"></en-rating>
 <en-combobox id="combo" label="Search"></en-combobox>
 <en-switch id="switch" checked>Switch</en-switch><en-checkbox id="checkbox" checked>Checkbox</en-checkbox><en-radio id="radio" checked>Radio</en-radio>
 <en-select id="select" label="Select"><en-select-option value="one">One</en-select-option></en-select>
 <en-number-field id="number" label="Count" value="2"></en-number-field>
 <a id="navigation" class="en-navigation-link" href="#target" aria-current="page">Current page</a>
 <button id="editor-token" data-token>Editable chip</button>
 <button id="option" class="en-option" aria-selected="true">Selected option</button>
 <div class="en-calendar"><button id="calendar" class="en-calendar-day">12</button></div>
 <div class="en-tree-item"><div id="drag" class="en-tree-option" data-reorderable>Drag row</div></div>
 <en-slider id="slider" label="Range" value="40"></en-slider>
 <en-color-plane id="plane" label="Color" value="#ff0000"></en-color-plane>
 </main>`;
 (document.querySelector('#items') as HTMLElement & {items:unknown[]}).items=[{value:'a',label:'Alpha'},{value:'b',label:'Beta'}];});
 const pins:Record<string,unknown>={};for(const family of families){pins[`component.${family}.pressed-scale`]=.94;pins[`component.${family}.pressed-offset`]={value:2,unit:'px'};pins[`component.${family}.press-duration`]={value:0,unit:'ms'};pins[`component.${family}.release-duration`]={value:0,unit:'ms'};}
 for(const family of ['segmented','accordion','tab','rating','combobox-trigger','navigation','editor-token','select','number-step'])pins[`component.${family}.pressed-background`]=colorFromHex('#123456');
 pins['component.switch.thumb-pressed-size']={value:22,unit:'px'};pins['component.slider-thumb.pressed-scale']=1.2;pins['component.color-plane-thumb.pressed-scale']=1.2;
 await page.addStyleTag({content:styles+emitThemeCSS(resolveTheme({name:'press-test',mode,pins}))});
 await page.locator('main').evaluate((el,mode)=>el.setAttribute('data-en-appearance',mode),mode);
 await expect(page.locator('#segments [part~=option]').first()).toBeVisible();
}
const targets:Record<string,string>={segmented:'#segments [part~=option]',accordion:'#accordion button',tab:'#tab .en-tab',rating:'#rating .en-rating-item','combobox-trigger':'#combo .en-combobox-trigger',navigation:'#navigation','editor-token':'#editor-token',option:'#option',calendar:'#calendar',checkbox:'#checkbox input',radio:'#radio input',switch:'#switch input',select:'#select select','number-step':'#number .en-number-step'};
async function geometry(el:Locator){return el.evaluate(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return {width:r.width,height:r.height,x:r.x,y:r.y,layoutWidth:(el as HTMLElement).offsetWidth,scale:s.scale,translate:s.translate,bg:s.backgroundColor,shadow:s.boxShadow,outline:s.outlineStyle};});}
async function release(page:Page){await page.mouse.up();await page.mouse.move(5,5);await page.keyboard.press('Escape');}
for(const mode of ['light','dark'] as const)test(`${mode}: independent family motion transforms complete surfaces, preserves selection and supports reduced motion`,async({page})=>{
 await mount(page,mode);
 for(const [family,selector] of Object.entries(targets)){
  // Native select may hand the gesture to the operating-system picker; covered by paint/export checks.
  if(family==='select')continue;
  // Isolate styling from Firefox's native radio-to-checkbox focus-transfer :active bug.
  const el=page.locator(selector).first();if(['checkbox','radio','switch'].includes(family))await el.focus();await el.scrollIntoViewIfNeeded();await el.hover();const before=await geometry(el);expect(before.scale,family+JSON.stringify(before)).toBe('none');await page.mouse.down();
  await expect.poll(async()=> (await geometry(el)).scale, family).toBe('0.94');
  await expect.poll(async()=> (await geometry(el)).width,family).toBeCloseTo(before.width*.94,1);expect((await geometry(el)).layoutWidth).toBe(before.layoutWidth);
  if(['segmented','accordion','tab','rating','combobox-trigger','navigation','editor-token','number-step'].includes(family))await expect.poll(async()=> (await geometry(el)).bg,family).toBe('rgb(18, 52, 86)');
  if(family==='segmented'){
   expect(await el.locator('.en-segmented-label').evaluate(el=>getComputedStyle(el).scale)).toBe('none');
   expect((await geometry(page.locator('#segments [part~=option]').nth(1))).scale).toBe('none');
   await expect(el).toHaveAttribute('data-selected','');
  }
  await release(page);
  await page.emulateMedia({reducedMotion:'reduce'});await el.hover();await page.mouse.down();expect((await geometry(el)).scale,family).toBe('none');await release(page);await page.emulateMedia({reducedMotion:'no-preference'});
 }
 const item=page.locator('#items [part~=option]').first();await item.hover();await page.mouse.down();expect((await geometry(item)).scale).toBe('0.94');await release(page);
 const disabled=page.locator('#segments [part~=option]').nth(2);await disabled.hover();await page.mouse.down();expect((await geometry(disabled)).scale).toBe('none');await release(page);
 const drag=page.locator('#drag');await drag.hover();await page.mouse.down();expect((await geometry(drag)).scale).toBe('none');await release(page);
});
test('switch thumb elongates within a stationary track and plane feedback preserves pointer coordinates',async({page})=>{
 await mount(page);
 const control=page.locator('#switch input');await control.evaluate(el=>(el as HTMLElement).style.setProperty('--en-switch-pressed-scale','1'));await control.evaluate(el=>(el as HTMLElement).style.setProperty('--en-switch-pressed-offset','0px'));
 const thumb=()=>control.evaluate(el=>{const s=getComputedStyle(el,'::before');return {width:parseFloat(s.width),left:parseFloat(s.insetInlineStart)};});
 await control.hover();const before=await geometry(control);const rest=await thumb();await page.mouse.down();await expect.poll(async()=> (await thumb()).width).toBe(22);expect((await thumb()).left).toBeLessThan(rest.left);expect((await geometry(control)).width).toBe(before.width);await release(page);
 const plane=page.locator('#plane [part=plane]');await plane.scrollIntoViewIfNeeded();const box=await geometry(plane);await plane.hover();await page.mouse.down();await expect.poll(()=>page.locator('#plane [part=thumb]').evaluate(el=>getComputedStyle(el).scale)).toBe('1.2');expect(await geometry(plane)).toEqual(box);await release(page);
});
test('family authoring values round-trip into exported theme CSS without enabling other family motion',()=>{
 const draft=createReviewDraft();draft.setToken('component.segmented.pressed-scale',.98);draft.setToken('component.segmented.press-duration',{value:120,unit:'ms'});
 const css=emitThemeCSS(draft.theme);expect(css).toContain('--en-segmented-pressed-scale:');expect(css).toContain('0.98');expect(css).toMatch(/--en-accordion-pressed-scale:\s*initial/);
});
test('disabled surfaces do not animate; scoped overrides and keyboard focus remain independent',async({page})=>{
 await mount(page);
 for(const [family,selector] of Object.entries(targets)){
  const el=page.locator(selector).first();
  if(family==='segmented')await page.locator('#segments').evaluate(el=>(el as HTMLElement & {disabled:boolean}).disabled=true);
  else if(family==='rating')await page.locator('#rating').evaluate(el=>(el as HTMLElement & {disabled:boolean}).disabled=true);
  else if(family==='tab')await page.locator('#tab').evaluate(el=>el.setAttribute('aria-disabled','true'));
  else await el.evaluate(el=>{if('disabled' in el)(el as HTMLButtonElement).disabled=true;else el.setAttribute('aria-disabled','true');});
  await el.hover();await page.mouse.down();expect((await geometry(el)).scale,family).toBe('none');await release(page);
 }
 // A new mount restores enabled controls through their public API.
 await mount(page);await page.locator('#segments').evaluate(el=>(el as HTMLElement).style.setProperty('--en-segmented-pressed-scale','.98'));
 const option=page.locator('#segments [part~=option]').first();await option.hover();await page.mouse.down();expect((await geometry(option)).scale).toBe('0.98');await release(page);
 const accordion=page.locator('#accordion button');await accordion.hover();await page.mouse.down();expect((await geometry(accordion)).scale).toBe('0.94');await release(page);
 const wasExpanded=await accordion.getAttribute('aria-expanded');await page.keyboard.press('Tab');await accordion.focus();await page.keyboard.down('Space');expect((await geometry(accordion)).outline).not.toBe('none');await page.keyboard.up('Space');await expect(accordion).toHaveAttribute('aria-expanded',wasExpanded==='true'?'false':'true');
 await page.locator('#accordion').evaluate(el=>el.setAttribute('data-press','none'));await accordion.hover();await page.mouse.down();expect((await geometry(accordion)).scale).toBe('none');expect((await geometry(accordion)).bg).toBe('rgb(18, 52, 86)');await release(page);
});
test('forced colors preserve system feedback and visible keyboard focus',async({page},info)=>{
 if(info.project.name==='webkit'){test.skip(true,'WebKit does not emulate forced colors.');return;}
 await mount(page);await page.emulateMedia({forcedColors:'active'});
 const option=page.locator('#segments [part~=option]').first();await option.hover();await page.mouse.down();expect((await geometry(option)).bg).not.toBe('rgb(18, 52, 86)');expect((await geometry(option)).shadow).toBe('none');await release(page);
 await page.keyboard.press('Tab');await page.locator('#segments input').first().focus();expect((await geometry(option)).outline).not.toBe('none');
});
for(const theme of ['vellum','signal','kinetic'])for(const appearance of ['light','dark'])test(`${theme} ${appearance}: delivered presets have distinct family feedback`,async({page})=>{
 await page.goto(`/showcase?theme=${theme}&appearance=${appearance}`);await expect(page.getByRole('button',{name:'Download CSS',exact:true})).toBeEnabled();
 if(theme==='kinetic'){
  const control=page.locator('en-switch input').first();await control.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));await control.hover();const before=await geometry(control);await page.mouse.down();
  await expect.poll(()=>control.evaluate(el=>getComputedStyle(el,'::before').width)).toBe('28px');expect((await geometry(control)).width).toBe(before.width);await page.mouse.up();
 }
 const trigger=page.locator('en-accordion-item button').first();await trigger.hover();await page.mouse.down();
 await expect.poll(async()=> (await geometry(trigger)).scale).toBe(theme==='kinetic'?'0.96':'1');
 await expect.poll(async()=> (await geometry(trigger)).translate).toBe(theme==='vellum'?'0px 1px':'0px');
 if(theme==='vellum'||theme==='signal')expect((await geometry(trigger)).shadow).toContain('inset');
 await page.mouse.up();
 const segment=page.locator('en-segmented-control[label="Activity period"] [part~=option]').first();await segment.hover();await page.mouse.down();expect((await geometry(segment)).scale).toBe('1');expect((await geometry(segment)).translate).toBe('0px');await page.mouse.up();

});
test('dragging out of a disclosure trigger cancels activation and releases its pressed transform',async({page})=>{
 await mount(page);const trigger=page.locator('#accordion button');const initial=await trigger.getAttribute('aria-expanded');
 await trigger.hover();await page.mouse.down();expect((await geometry(trigger)).scale).toBe('0.94');await page.mouse.move(2,2);await page.mouse.up();
 await expect(trigger).toHaveAttribute('aria-expanded',initial!);await expect.poll(async()=> (await geometry(trigger)).scale).toBe('none');
});
test('the full native choice label supplies feedback to its input surface',async({page})=>{
 await mount(page);
 for(const family of ['checkbox','radio','switch']){
  const label=page.locator(`#${family} .en-choice`);const input=page.locator(`#${family} input`);
  await label.hover();await page.mouse.down();await expect.poll(async()=> (await geometry(input)).scale).toBe('0.94');await page.mouse.up();
 }
});
