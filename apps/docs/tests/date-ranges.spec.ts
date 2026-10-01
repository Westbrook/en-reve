import {expect,test} from '@playwright/test';
test.beforeEach(async({page})=>{await page.goto('/api-examples/calendar.html');await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');});
const date=(host:any,value:string)=>host.locator(`button[data-date="${value}"]`);
test('inline range drafts, reverse endpoints, same day, preview and unavailable interiors are atomic',async({page})=>{
 const host=page.locator('#range-calendar');
 await date(host,'2026-09-20').click();
 await expect.poll(()=>host.evaluate((el:any)=>el.rangeValue)).toEqual({start:'2026-09-16',end:'2026-09-18'});
 await expect(date(host,'2026-09-20').locator('..')).toHaveAttribute('aria-selected','true');
 await date(host,'2026-09-18').focus();await expect(host.locator('[part~="preview"]')).toHaveCount(3);
 await date(host,'2026-09-18').click();
 await expect.poll(()=>host.evaluate((el:any)=>el.rangeValue)).toEqual({start:'2026-09-18',end:'2026-09-20'});
 await date(host,'2026-09-20').click();await date(host,'2026-09-24').click();
 await expect(host.getByRole('status')).toContainText('2026-09-22');
 await expect.poll(()=>host.evaluate((el:any)=>el.rangeValue)).toEqual({start:'2026-09-18',end:'2026-09-20'});
 await page.keyboard.press('Escape');
 await date(host,'2026-09-25').click();await date(host,'2026-09-25').click();
 await expect.poll(()=>host.evaluate((el:any)=>el.rangeValue)).toEqual({start:'2026-09-25',end:'2026-09-25'});
 await expect(host.locator('button[data-date][tabindex="0"]')).toHaveCount(1);
});
test('picker draft fields, cancel, Apply and multi-name form data with reset and restoration',async({page})=>{
 const picker=page.locator('#range-picker');
 await picker.locator('#picker-trigger').click();
 await date(picker,'2026-09-25').click();
 await expect(picker.getByRole('button',{name:'Apply range',exact:true})).toBeDisabled();
 await expect(picker.getByLabel('Start date',{exact:true})).toHaveValue('2026-09-25');
 await expect.poll(()=>picker.evaluate((el:any)=>Object.fromEntries(new FormData(el.closest('form'))))).toEqual({'project-start':'2026-09-16','project-end':'2026-09-18'});
 await date(picker,'2026-09-28').click();await picker.getByRole('button',{name:'Cancel',exact:true}).click();
 await expect.poll(()=>picker.evaluate((el:any)=>el.rangeValue)).toEqual({start:'2026-09-16',end:'2026-09-18'});
 await picker.locator('#picker-trigger').click();
 await picker.getByLabel('Start date',{exact:true}).fill('2026-09-24');await picker.getByLabel('Start date',{exact:true}).blur();
 await picker.getByLabel('End date',{exact:true}).fill('2026-09-26');await picker.getByLabel('End date',{exact:true}).blur();
 await picker.getByRole('button',{name:'Apply range',exact:true}).click();await expect(picker.locator('dialog')).not.toBeVisible();
 await expect.poll(()=>picker.evaluate((el:any)=>Object.fromEntries(new FormData(el.closest('form'))))).toEqual({'project-start':'2026-09-24','project-end':'2026-09-26'});
 await picker.evaluate((el:any)=>el.closest('form').reset());await expect.poll(()=>picker.evaluate((el:any)=>el.rangeValue)).toEqual({start:'2026-09-16',end:'2026-09-18'});
 await picker.evaluate((el:any)=>el.formStateRestoreCallback(JSON.stringify({start:'2026-09-25',end:'2026-09-29'}),'restore'));
 await expect.poll(()=>picker.evaluate((el:any)=>el.rangeValue)).toEqual({start:'2026-09-25',end:'2026-09-29'});
 await picker.evaluate((el:any)=>{el.clearRange();});await expect.poll(()=>picker.evaluate((el:any)=>el.validity.valueMissing)).toBe(true);
 await expect.poll(()=>picker.evaluate((el:any)=>Object.fromEntries(new FormData(el.closest('form'))))).toEqual({});
});
test('veto and author writes win atomically; availability changes invalidate; display calendars preserve pairs',async({page})=>{
 const picker=page.locator('#range-picker');
 await picker.evaluate((el:any)=>{el.addEventListener('en-change',(event:Event)=>event.preventDefault(),{once:true});});
 await picker.locator('#picker-trigger').click();await date(picker,'2026-09-25').click();await date(picker,'2026-09-26').click();await picker.getByRole('button',{name:'Apply range',exact:true}).click();
 await expect.poll(()=>picker.evaluate((el:any)=>el.rangeValue)).toEqual({start:'2026-09-16',end:'2026-09-18'});
 await picker.evaluate((el:any)=>{el.addEventListener('en-change',(event:Event)=>{event.preventDefault();el.rangeValue={start:'2026-09-28',end:'2026-09-29'};},{once:true});});
 await date(picker,'2026-09-25').click();await date(picker,'2026-09-26').click();await picker.getByRole('button',{name:'Apply range',exact:true}).click();
 await expect.poll(()=>picker.evaluate((el:any)=>el.rangeValue)).toEqual({start:'2026-09-28',end:'2026-09-29'});
 await picker.getByRole('button',{name:'Cancel',exact:true}).click();
 await page.getByRole('combobox',{name:'Display calendar',exact:true}).selectOption('buddhist');
 await page.getByRole('combobox',{name:'Display locale',exact:true}).selectOption('th-TH');await expect(picker.locator('[part="range-summary"]')).toContainText('2569');
 await expect.poll(()=>picker.evaluate((el:any)=>el.rangeValue)).toEqual({start:'2026-09-28',end:'2026-09-29'});
 await picker.evaluate((el:any)=>{el.unavailableDate=(value:string)=>value==='2026-09-29';el.rangeValue=el.rangeValue;});
 await expect.poll(()=>picker.evaluate((el:any)=>el.checkValidity())).toBe(false);
 await picker.evaluate((el:any)=>{el.disabled=true;});await expect.poll(()=>picker.evaluate((el:any)=>Object.fromEntries(new FormData(el.closest('form'))))).toEqual({});
});
test('availability caches whole proposals, explicit invalidation and predicate replacement revalidate immediately',async({page})=>{
 const picker=page.locator('#range-picker');
 const result=await picker.evaluate((el:any)=>{
  let calls=0,unavailable=false;
  el.unavailableDate=()=>{calls++;return unavailable;};el.rangeValue={start:'2026-09-16',end:'2026-09-18'};
  const initial=calls;el.checkValidity();el.checkValidity();const cached=calls;
  unavailable=true;el.invalidateAvailability();const invalid=!el.checkValidity();
  el.unavailableDate=()=>false;el.rangeValue=el.rangeValue;const replaced=el.checkValidity();
  return {initial,cached,invalid,replaced};
 });
 expect(result.initial).toBe(3);expect(result.cached).toBe(result.initial);expect(result.invalid).toBe(true);expect(result.replaced).toBe(true);
});
test('range keyboard focus, readonly/required semantics and narrow layout remain usable',async({page})=>{
 await page.setViewportSize({width:390,height:844});const picker=page.locator('#range-picker');
 await picker.evaluate((el:any)=>{el.rangeValue={start:'',end:''};el.focus();});
 await expect(picker.locator('#picker-trigger button')).toBeFocused();
 await picker.evaluate((el:any)=>el.reportValidity());await expect(picker.locator('#picker-trigger button')).toBeFocused();
 await picker.locator('#picker-trigger').click();await date(picker,'2026-09-18').click();await page.keyboard.press('ArrowRight');
 await expect(date(picker,'2026-09-19')).toBeFocused();await page.keyboard.press('Enter');
 await expect.poll(()=>picker.evaluate((el:any)=>el.rangeValue)).toEqual({start:'',end:''});
 await page.keyboard.press('Escape');await expect(picker.getByLabel('Start date',{exact:true})).toHaveValue('');
 await picker.getByRole('button',{name:'Cancel',exact:true}).click();
 await picker.evaluate((el:any)=>{el.readOnly=true;});await expect(picker.locator('#picker-trigger button')).toBeDisabled();
 const width=await picker.evaluate(el=>el.getBoundingClientRect().width);expect(width).toBeLessThanOrEqual(390);
});

test('initial hydrated complete range can Apply immediately and close without editing',async({page})=>{
 const picker=page.locator('#range-picker');await picker.locator('#picker-trigger').click();
 const apply=picker.getByRole('button',{name:'Apply range',exact:true});await expect(apply).toBeEnabled();
 await expect(picker.getByLabel('Start date',{exact:true})).toHaveValue('2026-09-16');await expect(picker.getByLabel('End date',{exact:true})).toHaveValue('2026-09-18');
 await apply.click();await expect(picker.locator('dialog')).not.toBeVisible();
 await expect.poll(()=>picker.evaluate((el:any)=>el.rangeValue)).toEqual({start:'2026-09-16',end:'2026-09-18'});
});

test('range bands join across cells and week breaks, with caps aligned to endpoint buttons in LTR and RTL',async({page})=>{
 const host=page.locator('#range-calendar');
 for(const dir of ['ltr','rtl']){
  await host.evaluate((el:any,dir)=>el.dir=dir,dir);
  for(const [start,end] of [['2026-09-16','2026-09-19'],['2026-09-24','2026-09-28'],['2026-09-26','2026-09-26'],['2026-09-27','2026-09-27']]){
   await host.evaluate((el:any,pair)=>el.rangeValue=pair,{start,end});
   await expect(host.locator('[part~="range-band-start"]')).toHaveCount(1);
   await expect(host.locator('[part~="range-band-end"]')).toHaveCount(1);
   const geometry=await host.evaluate((el:any)=>[...el.shadowRoot.querySelectorAll('[part~="range-band"]')].map((band:any)=>{
    const rect=band.getBoundingClientRect(),button=band.parentElement.querySelector('button').getBoundingClientRect();return {left:rect.left,right:rect.right,top:rect.top,height:rect.height,buttonLeft:button.left,buttonRight:button.right,buttonHeight:button.height,start:band.part.contains('range-band-start'),end:band.part.contains('range-band-end')};
   }));
   for(let i=0;i<geometry.length;i++){
    const band=geometry[i],prev=geometry[i-1];
    expect(Math.abs(band.height-band.buttonHeight)).toBeLessThan(1);
    if(band.start)expect(Math.abs((dir==='ltr'?band.left:band.right)-(dir==='ltr'?band.buttonLeft:band.buttonRight))).toBeLessThan(1);
    if(band.end)expect(Math.abs((dir==='ltr'?band.right:band.left)-(dir==='ltr'?band.buttonRight:band.buttonLeft))).toBeLessThan(1);
    if(prev&&prev.top===band.top)expect(Math.abs(dir==='ltr'?prev.right-band.left:prev.left-band.right)).toBeLessThan(1);
   }
  }
 }
});

test('reverse hover preview joins without altering selected semantics and keyboard focus stays above the band',async({page})=>{
 const host=page.locator('#range-calendar');await date(host,'2026-09-28').click();await date(host,'2026-09-24').hover();
 await expect(host.locator('[part~="range-band-preview"]')).toHaveCount(5);
 await expect(host.locator('[part~="range-band-start"]').locator('..').locator('button')).toHaveAttribute('data-date','2026-09-24');
 await expect(host.locator('td[aria-selected="true"]')).toHaveCount(1);
 await expect(host.locator('[part~="range-band"]:not([aria-hidden="true"])')).toHaveCount(0);
 await date(host,'2026-09-24').focus();await page.keyboard.press('ArrowRight');
 await expect(date(host,'2026-09-25')).toBeFocused();
 await expect.poll(()=>date(host,'2026-09-25').evaluate(el=>getComputedStyle(el).zIndex)).toBe('1');
 await page.keyboard.press('Escape');await expect(host.locator('[part~="range-band-preview"]')).toHaveCount(0);
});
