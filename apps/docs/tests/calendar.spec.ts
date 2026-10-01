import { expect, test, type Page } from '@playwright/test';
const path='/api-examples/calendar.html';
const calendar=(page:Page)=>page.locator('#specimen-calendar');
const picker=(page:Page)=>page.locator('#specimen-date-picker');
const day=(host:ReturnType<typeof calendar>,value:string)=>host.locator(`button[data-date="${value}"]`);
async function load(page:Page) {
  await page.goto(path);
  await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
}
test('calendar owns one date Tab stop and keyboard navigation does not select',async({page})=>{
 await load(page);const c=calendar(page);const first=day(c,'2026-09-18');await first.focus();
 await first.press('ArrowRight');await expect(day(c,'2026-09-19')).toBeFocused();await expect(c).toHaveJSProperty('value','2026-09-18');
 await day(c,'2026-09-19').press('PageDown');await expect(day(c,'2026-10-19')).toBeFocused();
 await expect(c.locator('button[data-date][tabindex="0"]')).toHaveCount(1);
 await day(c,'2026-10-19').press('Home');await expect(day(c,'2026-10-18')).toBeFocused();
 await day(c,'2026-10-18').press('Enter');await expect(c).toHaveJSProperty('value','2026-10-18');
});
test('calendar cancellation and author writes preserve owned selection',async({page})=>{
 await load(page);const c=calendar(page);
 await c.evaluate((el:any)=>el.addEventListener('en-change',(e:any)=>{(window as any).tentative=el.value;e.preventDefault();},{once:true}));
 await day(c,'2026-09-20').click();await expect(c).toHaveJSProperty('value','2026-09-18');expect(await page.evaluate(()=>(window as any).tentative)).toBe('2026-09-20');
 await c.evaluate((el:any)=>el.addEventListener('en-change',(e:any)=>{e.preventDefault();el.value='2026-09-25';},{once:true}));
 await day(c,'2026-09-21').click();await expect(c).toHaveJSProperty('value','2026-09-25');
});
test('explicit month wins, limits are discoverable and month controls retain focus',async({page})=>{
 await load(page);const c=calendar(page);
 await c.evaluate((el:any)=>{el.value='2026-09-20';el.month='2026-10-01';});
 await expect(c.locator('[part=heading]')).toHaveText('October 2026');
 await c.getByRole('button',{name:'Previous month',exact:true}).focus();await c.getByRole('button',{name:'Previous month',exact:true}).press('Enter');await expect(c.getByRole('button',{name:'Previous month',exact:true})).toBeFocused();
 await expect(day(c,'2026-09-13')).toHaveAttribute('aria-disabled','true');await day(c,'2026-09-13').click({force:true});await expect(c).toHaveJSProperty('value','2026-09-20');
 await c.evaluate((el:any)=>{el.min='';el.max='';el.month='0001-01-01';});await expect(c.getByRole('button',{name:'Previous month',exact:true})).toBeDisabled();
});
test('picker commits one coherent form change and restores trigger focus',async({page})=>{
 await load(page);const p=picker(page);const trigger=p.locator('#picker-trigger').getByRole('button');
 await p.evaluate((el:any)=>{(window as any).changes=[];el.addEventListener('en-change',(e:any)=>(window as any).changes.push({value:el.value,form:new FormData(el.form).get(el.name),detail:e.detail}));});
 await trigger.click();await expect(p.locator('en-dialog')).toHaveJSProperty('open',true);await expect(day(p,'2026-09-18')).toBeFocused();
 await day(p,'2026-09-22').click();await expect(p).toHaveJSProperty('value','2026-09-22');await expect(p.locator('en-dialog')).toHaveJSProperty('open',false);await expect(trigger).toBeFocused();
 const changes=await page.evaluate(()=>(window as any).changes);expect(changes).toHaveLength(1);expect(changes[0].value).toBe('2026-09-22');expect(changes[0].form).toBe('2026-09-22');
 await trigger.click();await day(p,'2026-09-22').click();await expect(p.locator('en-dialog')).toHaveJSProperty('open',false);
});
test('picker cancellation stays open; Escape closes without changing date',async({page})=>{
 await load(page);const p=picker(page);const trigger=p.locator('#picker-trigger').getByRole('button');
 await p.evaluate((el:any)=>el.addEventListener('en-change',(e:Event)=>e.preventDefault()));await trigger.click();
 await day(p,'2026-09-23').click();await expect(p).toHaveJSProperty('value','2026-09-18');await expect(p.locator('en-dialog')).toHaveJSProperty('open',true);
 await day(p,'2026-09-23').press('Escape');await expect(p.locator('en-dialog')).toHaveJSProperty('open',false);await expect(trigger).toBeFocused();
});
test('picker respects step, optional clearing, form reset and disabled fieldsets',async({page})=>{
 await load(page);const p=picker(page);
 await p.evaluate((el:any)=>{el.required=false;el.step=2;});await p.locator('#picker-trigger').click();
 await expect(day(p,'2026-09-15')).toHaveAttribute('aria-disabled','true');await day(p,'2026-09-15').click({force:true});await expect(p).toHaveJSProperty('value','2026-09-18');
 await p.evaluate((el:any)=>el.hidePicker());const input=p.locator('input');await input.fill('');await input.dispatchEvent('change');await expect(p).toHaveJSProperty('value','');
 await p.evaluate((el:any)=>el.form.reset());await expect(p).toHaveJSProperty('value','2026-09-18');
 await p.evaluate(el=>{const fieldset=document.createElement('fieldset');fieldset.disabled=true;el.before(fieldset);fieldset.append(el);});
 await expect(p.locator('#picker-trigger').getByRole('button')).toBeDisabled();
});
test('calendar supports localized headers and RTL navigation at phone width',async({page})=>{
 await page.setViewportSize({width:390,height:844});await load(page);const c=calendar(page);
 await c.evaluate((el:any)=>{el.locale='ja-JP';el.dir='rtl';el.firstDayOfWeek=1;});await expect(c.locator('[part=heading]')).toContainText('2026');
 await day(c,'2026-09-18').focus();await day(c,'2026-09-18').press('ArrowRight');await expect(day(c,'2026-09-17')).toBeFocused();
 expect(await c.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
 await picker(page).locator('#picker-trigger').click();expect(await picker(page).locator('en-dialog').locator('dialog').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
});
test('SSR dates and source are present before hydration',async({browser,baseURL})=>{
 const context=await browser.newContext({baseURL,javaScriptEnabled:false});try {const page=await context.newPage();await page.goto(path);
 await expect(calendar(page).locator('[role=grid]')).toBeVisible();await expect(calendar(page).locator('button[data-date]')).toHaveCount(42);
 await expect(picker(page).locator('input')).toHaveValue('2026-09-18');
 const source=page.locator('details.code-disclosure');await source.locator('summary').click();await expect(source.locator('code')).toContainText('<en-calendar');
 } finally {await context.close();}
});
test('theme changes preserve date state and usable calendar targets',async({page},info)=>{
 await load(page);const c=calendar(page);await day(c,'2026-09-22').click();
 if(info.project.name==='chromium') await page.locator('.calendar-demo').screenshot({path:info.outputPath('calendar-desktop.png')});
 await page.setViewportSize({width:390,height:844});
 for(const theme of ['spectrum-inspired','fluent-inspired','astryx-inspired','shadcn-inspired','holotable-inspired']) {
  await page.getByRole('combobox',{name:'Inspired theme',exact:true}).selectOption(theme);
  await expect(page.getByRole('status',{name:'Theme result'})).toContainText('applied');
  await expect(c).toHaveJSProperty('value','2026-09-22');await day(c,'2026-09-22').focus();
  expect(await day(c,'2026-09-22').evaluate(el=>{const b=el.getBoundingClientRect();return b.width>=24&&b.height>=24;})).toBe(true);
  expect(await c.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
 }
 if(info.project.name==='chromium') await page.locator('.calendar-demo').screenshot({path:info.outputPath('calendar-mobile.png')});
});
test('live constraint edits during picker dispatch invalidate the proposed date',async({page})=>{
 await load(page);const p=picker(page);
 await p.evaluate((el:any)=>el.addEventListener('en-change',()=>{el.step=2;},{once:true}));await p.locator('#picker-trigger').click();
 await day(p,'2026-09-21').click();await expect(p).toHaveJSProperty('value','2026-09-18');await expect(p.locator('en-dialog')).toHaveJSProperty('open',true);
 await p.evaluate((el:any)=>el.addEventListener('en-change',(e:Event)=>{e.preventDefault();el.value='2026-09-24';},{once:true}));
 await day(p,'2026-09-22').click();await expect(p).toHaveJSProperty('value','2026-09-24');
});
test('demo preferences and application veto are usable controls',async({page})=>{
 await load(page);await page.getByRole('combobox',{name:'Display locale',exact:true}).selectOption('ja-JP');
 await expect(calendar(page)).toHaveJSProperty('locale','ja-JP');await page.getByRole('combobox',{name:'First day of week',exact:true}).selectOption('1');
 await expect(calendar(page)).toHaveJSProperty('firstDayOfWeek',1);
 await page.getByRole('checkbox',{name:'Application declines date changes'}).check();await day(calendar(page),'2026-09-20').click();await expect(calendar(page)).toHaveJSProperty('value','2026-09-18');
 await expect(picker(page).locator('#picker-trigger en-icon svg rect')).toHaveCount(1);
 expect(await picker(page).locator('#picker-trigger en-icon svg').evaluate(el=>el.getBoundingClientRect().width)).toBeGreaterThan(0);
});
test('API pages expose calendar and picker controls and date guidance',async({page})=>{
 for(const component of ['en-calendar','en-date-picker']) {
  await page.goto(`/api-reference.html?component=${component}`);
  await expect(page.locator('#api-calendar-guide')).toContainText('One cancelable selection event');
  await expect(page.locator('#api-calendar-guide')).toContainText('YYYY-MM-DD');
  await expect(page.locator('#api-cssParts')).toContainText(component==='en-calendar'?'weekday':'picker-layout');
 }
});
test('choosing an adjacent-month day keeps focus on that date after redraw',async({page})=>{
 await load(page);const c=calendar(page);await day(c,'2026-10-01').focus();await day(c,'2026-10-01').press('Enter');
 await expect(c).toHaveJSProperty('value','2026-10-01');await expect(c.locator('[part=heading]')).toHaveText('October 2026');await expect(day(c,'2026-10-01')).toBeFocused();
});
test('Showcase review date uses the picker without widening a phone layout',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/showcase.html');const p=page.locator('#project-date');
 await expect(p).toHaveJSProperty('value','2026-09-18');await p.locator('#picker-trigger').click();await day(p,'2026-09-24').click();await expect(p).toHaveJSProperty('value','2026-09-24');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
test('month controls share square icon-button geometry with the dialog close action across themes',async({page})=>{
 await load(page);const p=picker(page);
 for(const theme of ['','spectrum-inspired','fluent-inspired','astryx-inspired','shadcn-inspired','holotable-inspired']) {
  if(theme) {await page.getByRole('combobox',{name:'Inspired theme',exact:true}).selectOption(theme);await expect(page.getByRole('status',{name:'Theme result'})).toContainText('applied');}
  await p.locator('#picker-trigger').click();
  const controls=[p.locator('en-calendar en-button[exportparts="control:previous"]').getByRole('button'),p.locator('en-calendar en-button[exportparts="control:next"]').getByRole('button'),p.locator('en-dialog .en-overlay-close').getByRole('button')];
  const boxes=await Promise.all(controls.map(control=>control.boundingBox()));
  for(const box of boxes) {expect(box).not.toBeNull();expect(Math.abs(box!.width-box!.height)).toBeLessThanOrEqual(1);expect(Math.abs(box!.height-boxes[2]!.height)).toBeLessThanOrEqual(1);}
  await p.evaluate((el:any)=>el.hidePicker());
 }
});
test('focusable unavailable month button suppresses activation and forwards its native state',async({page})=>{
 await load(page);const c=calendar(page);const host=c.locator('en-button[exportparts="control:previous"]');const control=host.getByRole('button');
 await expect(control).toHaveAttribute('aria-disabled','true');await control.focus();await expect(control).toBeFocused();
 await host.evaluate(el=>{(window as any).monthClicks=0;el.addEventListener('click',()=>{(window as any).monthClicks++;});});
 await control.press('Enter');expect(await page.evaluate(()=>(window as any).monthClicks)).toBe(0);await expect(c.locator('[part=heading]')).toHaveText('September 2026');
 await c.evaluate((el:any)=>el.min='');await expect(control).toHaveAttribute('aria-disabled','false');await control.press('Enter');
 await expect(c.locator('[part=heading]')).toHaveText('August 2026');await expect(control).toBeFocused();expect(await page.evaluate(()=>(window as any).monthClicks)).toBe(1);
});

test('picker exposes one labeled dismissal action and returns focus without editing',async({page})=>{
 await load(page);const p=picker(page);const trigger=p.locator('#picker-trigger').getByRole('button');
 await trigger.click();const close=p.getByRole('button',{name:'Close calendar',exact:true});
 await expect(close).toHaveCount(1);await expect(p.locator('en-dialog > [slot="footer"]')).toHaveCount(0);
 await close.click();await expect(p.locator('en-dialog')).toHaveJSProperty('open',false);await expect(p).toHaveJSProperty('value','2026-09-18');await expect(trigger).toBeFocused();
});
test('date targets stay square across themes and viewport widths',async({page})=>{
 await load(page);const c=calendar(page);
 for(const theme of ['','spectrum-inspired','fluent-inspired','astryx-inspired','shadcn-inspired','holotable-inspired']) {
  if(theme) {await page.getByRole('combobox',{name:'Inspired theme',exact:true}).selectOption(theme);await expect(page.getByRole('status',{name:'Theme result'})).toContainText('applied');}
  for(const width of [1440,390,320]) {
   await page.setViewportSize({width,height:900});
   const boxes=await c.locator('button[data-date]').evaluateAll(els=>els.map(el=>{const b=el.getBoundingClientRect();return {w:b.width,h:b.height};}));
   for(const b of boxes) {expect(Math.abs(b.w-b.h)).toBeLessThanOrEqual(1);expect(b.w).toBeGreaterThanOrEqual(24);expect(Math.abs(b.w-boxes[0].w)).toBeLessThanOrEqual(1);}
   expect(await c.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
  }
 }
});
test('date hover refinements include selected days, restore selection and skip unavailable dates',async({page})=>{
 await load(page);const c=calendar(page);
 await c.evaluate(el=>{el.style.setProperty('--en-option-hover-background','rgb(12, 34, 56)');el.style.setProperty('--en-option-hover-color','rgb(245, 246, 247)');});
 const available=day(c,'2026-09-20');await available.hover();
 await expect(available).toHaveCSS('background-color','rgb(12, 34, 56)');await expect(available).toHaveCSS('color','rgb(245, 246, 247)');
 const selected=day(c,'2026-09-18');const selection=await selected.evaluate(el=>getComputedStyle(el).backgroundColor);await selected.hover();await expect(selected).toHaveCSS('background-color','rgb(12, 34, 56)');await page.mouse.move(0,0);await expect(selected).toHaveCSS('background-color',selection);
 const today=day(c,'2026-09-14');await today.hover();expect(await today.evaluate(el=>getComputedStyle(el).borderTopColor)).not.toBe('rgba(0, 0, 0, 0)');
 const unavailable=day(c,'2026-09-13');const rest=await unavailable.evaluate(el=>getComputedStyle(el).backgroundColor);await unavailable.hover({force:true});await expect(unavailable).toHaveCSS('background-color',rest);
 await c.evaluate(el=>el.style.setProperty('--en-calendar-day-radius','50%'));await expect(available).toHaveCSS('border-radius','50%');
 await c.evaluate(el=>el.style.setProperty('--en-calendar-day-radius','0px'));await expect(available).toHaveCSS('border-radius','0px');
});
test('touch date targets remain square and fit a phone picker',async({browser,baseURL})=>{
 const context=await browser.newContext({baseURL,hasTouch:true,viewport:{width:390,height:844},reducedMotion:'reduce'});
 try {
  const page=await context.newPage();await load(page);const p=picker(page);await p.locator('#picker-trigger').click();
  const date=day(p,'2026-09-18');const box=await date.boundingBox();expect(box).not.toBeNull();expect(Math.abs(box!.width-box!.height)).toBeLessThanOrEqual(1);expect(box!.width).toBeGreaterThanOrEqual(24);
  expect(await p.locator('dialog').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
  await date.tap();await expect(p.locator('en-dialog')).toHaveJSProperty('open',false);
 } finally {await context.close();}
});
test('picker date hover is distinct from its dialog surface in light and dark modes',async({page},info)=>{
 await load(page);const p=picker(page);
 for(const colorScheme of ['light','dark'] as const) {
  await page.emulateMedia({colorScheme});await p.locator('#picker-trigger').click();
  const available=day(p,'2026-09-20');await available.hover();
  const tint=await available.evaluate(el=>getComputedStyle(el).backgroundImage);
  expect(tint).toContain('linear-gradient');expect(tint).toContain('0.1');
  if(info.project.name==='chromium') await p.locator('dialog').screenshot({path:info.outputPath(`calendar-hover-${colorScheme}.png`)});
  await p.evaluate((el:any)=>el.hidePicker());
 }
});
test('date columns and weekday labels align with navigation edges in either direction',async({page})=>{
 await load(page);const p=picker(page);
 for(const width of [1440,390,320]) {
  await page.setViewportSize({width,height:900});
  for(const dir of ['ltr','rtl']) {
   await p.evaluate((el,dir)=>el.dir=dir,dir);await p.locator('#picker-trigger').click();
   const c=p.locator('en-calendar');
   const first=c.locator('tbody tr').first().locator('td').first().locator('button');const last=c.locator('tbody tr').first().locator('td').last().locator('button');
   const previous=c.locator('en-button[exportparts="control:previous"]').getByRole('button');const next=c.locator('en-button[exportparts="control:next"]').getByRole('button');
   const [f,l,prev,n,fh,lh]=await Promise.all([first,last,previous,next,c.locator('.en-calendar-weekday').first(),c.locator('.en-calendar-weekday').last()].map(x=>x.boundingBox()));
   const start=(b:NonNullable<typeof f>)=>dir==='ltr'?b.x:b.x+b.width;const end=(b:NonNullable<typeof f>)=>dir==='ltr'?b.x+b.width:b.x;
   expect(Math.abs(start(f!)-start(prev!))).toBeLessThanOrEqual(1);expect(Math.abs(end(l!)-end(n!))).toBeLessThanOrEqual(1);
   expect(Math.abs((fh!.x+fh!.width/2)-(f!.x+f!.width/2))).toBeLessThanOrEqual(1);expect(Math.abs((lh!.x+lh!.width/2)-(l!.x+l!.width/2))).toBeLessThanOrEqual(1);
   await expect(first).toHaveCSS('display','inline-flex');await expect(first).toHaveCSS('margin-left','0px');await expect(first).toHaveCSS('margin-right','0px');
   expect(await p.locator('dialog').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
   await p.evaluate((el:any)=>el.hidePicker());
  }
 }
});

test('date tint survives matching fills while selected hover follows explicit refinements',async({page})=>{
 // This sweep exercises six themes in both modes, including pointer transitions.
 test.setTimeout(45_000);
 await load(page);const p=picker(page);
 for(const theme of ['','spectrum-inspired','fluent-inspired','astryx-inspired','shadcn-inspired','holotable-inspired']) {
  if(theme) {await page.getByRole('combobox',{name:'Inspired theme',exact:true}).selectOption(theme);await expect(page.getByRole('status',{name:'Theme result'})).toContainText('applied');}
  for(const colorScheme of ['light','dark'] as const) {
   await page.emulateMedia({colorScheme});await p.locator('#picker-trigger').click();const c=p.locator('en-calendar');
   await c.evaluate(el=>{el.style.setProperty('--en-option-rest-background','var(--en-color-surface-raised)');el.style.setProperty('--en-option-hover-background','var(--en-color-surface-raised)');});
   const available=day(p,'2026-09-20');await available.hover();const hover=await available.evaluate(el=>getComputedStyle(el).backgroundImage);expect(hover).toContain('0.1');
   await page.mouse.down();expect(await available.evaluate(el=>getComputedStyle(el).backgroundImage)).toContain('0.16');
   await page.mouse.move(0,0);await page.mouse.up();
   const selected=day(p,'2026-09-18');const fill=await selected.evaluate(el=>getComputedStyle(el).backgroundColor);await selected.hover();await expect(selected).toHaveCSS('background-color',await available.evaluate(el=>getComputedStyle(el).backgroundColor));expect(await selected.evaluate(el=>getComputedStyle(el).backgroundImage)).toContain('0.1');await page.mouse.move(0,0);await expect(selected).toHaveCSS('background-color',fill);
   const today=day(p,'2026-09-14');await today.hover();expect(await today.evaluate(el=>getComputedStyle(el).borderTopColor)).not.toBe('rgba(0, 0, 0, 0)');
   const unavailable=day(p,'2026-09-13');await unavailable.hover({force:true});await expect(unavailable).toHaveCSS('background-image','none');
   await p.evaluate((el:any)=>el.hidePicker());
  }
 }
});
test('consumers can use filled resting dates and opt out of the default tint',async({page})=>{
 await load(page);const c=calendar(page);const available=day(c,'2026-09-20');
 await c.evaluate(el=>{el.style.setProperty('--en-option-rest-background','rgb(12, 34, 56)');el.style.setProperty('--en-option-hover-background','transparent');el.style.setProperty('--en-calendar-hover-opacity','0');el.style.setProperty('--en-calendar-pressed-opacity','0');});
 await page.mouse.move(0,0);await expect(available).toHaveCSS('background-color','rgb(12, 34, 56)');await available.hover();await expect(available).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
 const tint=await available.evaluate(el=>getComputedStyle(el).backgroundImage);expect(tint).toMatch(/\/ 0[) ]|rgba\([^)]*, 0\)/);
});
test('forced-color dates retain hover feedback without a color tint',async({page})=>{
 await page.emulateMedia({forcedColors:'active'});await load(page);const available=day(calendar(page),'2026-09-20');await available.hover();
 expect(await available.evaluate(el=>getComputedStyle(el).borderTopColor)).not.toBe('rgba(0, 0, 0, 0)');await expect(available).toHaveCSS('background-image','none');
});
