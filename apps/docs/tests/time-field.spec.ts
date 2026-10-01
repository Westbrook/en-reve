import {test,expect,type Locator} from '@playwright/test';

async function typeTime(input:Locator,text:string){await input.focus();await input.press('ControlOrMeta+A');await input.pressSequentially(text);}

test.beforeEach(async({page})=>{await page.goto('/api-examples/calendar.html');await page.locator('#specimen-time-field input').waitFor();});
test('localized edits commit canonical values and real date/time FormData; draft invalidity never rounds',async({page})=>{
 const field=page.locator('#specimen-time-field'),input=field.locator('input');
 await expect(input).toHaveValue('09:30 AM');await typeTime(input,'9:45 AM');await expect(field).toHaveJSProperty('value','09:30');await input.press('Enter');await expect(field).toHaveJSProperty('value','09:45');
 await page.locator('#time-appointment-form').getByRole('button',{name:'Submit appointment'}).click();await expect(page.locator('[data-time-receipt]')).toContainText('"appointment-time": "09:45"');await expect(page.locator('[data-time-receipt]')).toContainText('"appointment-date": "2026-09-18"');
 await typeTime(input,'9:37 AM');await input.press('Tab');await expect(input).toHaveValue('9:37 AM');await expect(field).toHaveJSProperty('value','09:45');expect(await field.evaluate((el:any)=>el.checkValidity())).toBe(false);expect(await page.locator('#time-appointment-form').evaluate((form:any)=>new FormData(form).has('appointment-time'))).toBe(false);
 await input.focus();await input.press('Escape');await expect(input).toHaveValue('09:45 AM');expect(await field.evaluate((el:any)=>el.checkValidity())).toBe(true);
});
test('veto and authoritative writes own both display and provisional submission',async({page})=>{
 const field=page.locator('#specimen-time-field'),input=field.locator('input');
 await field.evaluate((el:any)=>el.addEventListener('en-change',(e:any)=>{el.dataset.provisional=new FormData(el.form).get('appointment-time');e.preventDefault();},{once:true}));
 await typeTime(input,'10:00 AM');await input.press('Enter');await expect(field).toHaveAttribute('data-provisional','10:00');await expect(field).toHaveJSProperty('value','09:30');await expect(input).toHaveValue('09:30 AM');
 await field.evaluate((el:any)=>el.addEventListener('en-change',(e:any)=>{el.value='11:00';e.preventDefault();},{once:true}));await typeTime(input,'10:00 AM');await input.press('Enter');await expect(field).toHaveJSProperty('value','11:00');await expect(input).toHaveValue('11:00 AM');
 await field.evaluate((el:any)=>el.addEventListener('en-input',()=>{el.value='12:00';},{once:true}));await input.evaluate(el=>{(el as HTMLInputElement).value='10:00 AM';el.dispatchEvent(new InputEvent('input',{bubbles:true,composed:true,inputType:'insertText'}));});await expect(input).toHaveValue('12:00 PM');
});
test('seconds, explicit wrap and boundaries share keyboard stepping',async({page})=>{
 const night=page.locator('en-time-field[name=start-time]'),input=night.locator('input');await typeTime(input,'11:45 PM');await input.press('Enter');await input.evaluate((el:HTMLInputElement)=>el.setSelectionRange(4,4));await input.press('ArrowUp');await expect(night).toHaveJSProperty('value','00:00');await input.press('ArrowDown');await expect(night).toHaveJSProperty('value','23:45');
 await night.evaluate((el:any)=>el.value='02:00');await input.press('ArrowUp');await expect(night).toHaveJSProperty('value','02:00');await typeTime(input,'12:00 PM');await input.press('Enter');expect(await night.evaluate((el:any)=>el.checkValidity())).toBe(false);await input.press('Escape');
 const seconds=page.locator('en-time-field[name=end-time]');await expect(seconds.locator('input')).toHaveValue('01:30:15 AM');await typeTime(seconds.locator('input'),'1:30:45 AM');await seconds.locator('input').press('Enter');await seconds.locator('input').evaluate((el:HTMLInputElement)=>el.setSelectionRange(7,7));await seconds.locator('input').press('ArrowUp');await expect(seconds).toHaveJSProperty('value','01:31:00');
 await page.locator('#time-period-form').getByRole('button',{name:'Submit date and time range'}).click();await expect(page.locator('[data-time-receipt]')).toContainText('"end-time": "01:31:00"');await expect(page.locator('[data-time-receipt]')).toContainText('"start-date": "2026-09-16"');
});
test('locale, 12/24 display, localized digits and RTL preserve canonical accepted time',async({page})=>{
 const field=page.locator('#specimen-time-field'),input=field.locator('input');await field.evaluate(async(el:any)=>{el.locale='ar-u-nu-arab';el.hourCycle='12';el.value='13:30';await el.updateComplete;});await expect(input).toHaveValue(/٠١:٣٠/);await input.evaluate(el=>{(el as HTMLInputElement).value='٠٢:٣٠ م';el.dispatchEvent(new InputEvent('input',{bubbles:true,composed:true,inputType:'insertText'}));});await input.press('Enter');await expect(field).toHaveJSProperty('value','14:30');
 await field.evaluate((el:any)=>{el.locale='de-DE';el.hourCycle='24';el.dir='rtl';});await expect(input).toHaveValue('14:30');await expect(field).toHaveJSProperty('value','14:30');
 // A locale switch cannot reinterpret an unfinished draft in a different format.
 await field.evaluate((el:any)=>{el.locale='en-US';el.hourCycle='12';});await typeTime(input,'3:30 PM');await field.evaluate((el:any)=>{el.locale='de-DE';el.hourCycle='24';});await input.press('Enter');await expect(field).toHaveJSProperty('value','15:30');await expect(input).toHaveValue('15:30');
});
test('reset, restoration, required, readonly, fieldset disable and invalid author values',async({page})=>{
 const field=page.locator('#specimen-time-field'),input=field.locator('input');await field.evaluate((el:any)=>el.value='10:30');await page.locator('#time-appointment-form').getByRole('button',{name:'Reset',exact:true}).click();await expect(field).toHaveJSProperty('value','09:30');
 await field.evaluate((el:any)=>el.formStateRestoreCallback('11:30','restore'));await expect(input).toHaveValue('11:30 AM');await field.evaluate((el:any)=>el.readOnly=true);await expect(input).toHaveAttribute('readonly','');await input.press('ArrowUp');await expect(field).toHaveJSProperty('value','11:30');expect(await field.evaluate((el:any)=>new FormData(el.form).get('appointment-time'))).toBe('11:30');
 await field.evaluate((el:any)=>{el.readOnly=false;el.value='';});expect(await field.evaluate((el:any)=>el.checkValidity())).toBe(false);await field.evaluate((el:any)=>el.value='24:00');expect(await field.evaluate((el:any)=>new FormData(el.form).has('appointment-time'))).toBe(false);
 await field.evaluate((el:any)=>{el.value='10:30';const fs=document.createElement('fieldset');el.before(fs);fs.append(el);fs.disabled=true;});await expect(input).toBeDisabled();expect(await field.evaluate((el:any)=>new FormData(el.form).has('appointment-time'))).toBe(false);
});
test('mobile layout, accessible labels and focus stay stable across invalid input',async({page})=>{
 await page.setViewportSize({width:390,height:844});const field=page.locator('#specimen-time-field');const input=field.getByRole('textbox',{name:'Appointment time'});await typeTime(input,'25:00');await input.press('Enter');await expect(input).toBeFocused();await expect(input).toHaveAttribute('aria-invalid','true');await expect(field.locator('[part~=error]')).toBeVisible();await input.press('Escape');await expect(input).not.toHaveAttribute('aria-invalid','true');
 expect(await page.locator('#time-entry-example').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);await expect(field).toMatchAriaSnapshot(`- text: Appointment time\n- textbox "Appointment time": 09:30 AM\n- text: /09:00.*17:00.*Example:/`);
});
test('composition preserves drafts and same-value author writes take precedence',async({page})=>{
 const field=page.locator('#specimen-time-field'),input=field.locator('input');await input.focus();
 await input.evaluate(el=>{el.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}));(el as HTMLInputElement).value='10:45 AM';el.dispatchEvent(new InputEvent('input',{bubbles:true,isComposing:true}));});await expect(field).toHaveJSProperty('value','09:30');await input.press('Enter');await expect(field).toHaveJSProperty('value','09:30');
 await field.evaluate((el:any)=>el.value='09:30');await input.evaluate(el=>el.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true})));await expect(input).toHaveValue('09:30 AM');
 await typeTime(input,'10:45 AM');await field.evaluate((el:any)=>el.addEventListener('en-change',()=>el.min='11:00',{once:true}));await input.press('Enter');await expect(field).toHaveJSProperty('value','09:30');expect(await field.evaluate((el:any)=>el.checkValidity())).toBe(false);
});
test('early server-rendered editing survives hydration',async({page})=>{
 let release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;});await page.route('**/assets/*.js',async route=>{await gate;await route.continue();});
 try {
  await page.goto('/api-examples/calendar.html',{waitUntil:'commit'});const input=page.locator('#specimen-time-field input');await input.waitFor();await typeTime(input,'10:45 AM');release();
  await page.waitForFunction(()=>customElements.get('en-time-field') && (document.querySelector('#specimen-time-field') as any)?.hasUpdated);await expect(input).toHaveValue('10:45 AM');await input.press('Enter');await expect(page.locator('#specimen-time-field')).toHaveJSProperty('value','10:45');
 } finally {release();}
});
test('caret chooses hours, minutes, seconds and AM/PM and retains selection',async({page})=>{
 const field=page.locator('en-time-field[name=end-time]'),input=field.locator('input');
 await field.evaluate((el:any)=>{el.hourCycle='12';el.step=15;el.value='13:30:15';});await input.focus();
 const at=async(start:number,end=start)=>input.evaluate((el:HTMLInputElement,p:number[])=>el.setSelectionRange(p[0],p[1]),[start,end]);
 const selection=()=>input.evaluate((el:HTMLInputElement)=>[el.selectionStart,el.selectionEnd]);
 await at(1);await input.press('ArrowUp');await expect(field).toHaveJSProperty('value','14:30:15');expect(await selection()).toEqual([0,2]);await input.press('ArrowUp');await expect(field).toHaveJSProperty('value','15:30:15');
 await at(4);await input.press('ArrowDown');await expect(field).toHaveJSProperty('value','15:29:15');expect(await selection()).toEqual([3,5]);
 await at(7);await input.press('ArrowUp');await expect(field).toHaveJSProperty('value','15:29:30');expect(await selection()).toEqual([6,8]);
 await at(10);await input.press('ArrowUp');await expect(field).toHaveJSProperty('value','03:29:30');expect(await selection()).toEqual([9,11]);await input.press('ArrowDown');await expect(field).toHaveJSProperty('value','15:29:30');
 await at(2);await input.press('ArrowDown');await expect(field).toHaveJSProperty('value','14:29:30');
 await at(3,8);await input.press('ArrowUp');await expect(field).toHaveJSProperty('value','14:30:30');
 await field.evaluate((el:any)=>el.stepUp());await expect(field).toHaveJSProperty('value','14:30:45');
});
test('segment movement keeps step constraints, bounds, veto and invalid drafts',async({page})=>{
 const field=page.locator('#specimen-time-field'),input=field.locator('input');await input.focus();
 await input.evaluate((el:HTMLInputElement)=>el.setSelectionRange(1,1));await input.press('ArrowUp');await expect(field).toHaveJSProperty('value','10:30');
 await input.evaluate((el:HTMLInputElement)=>el.setSelectionRange(4,4));await input.press('ArrowUp');await expect(field).toHaveJSProperty('value','10:45');
 await input.evaluate((el:HTMLInputElement)=>el.setSelectionRange(7,7));await input.press('ArrowUp');await expect(field).toHaveJSProperty('value','10:45');
 await field.evaluate((el:any)=>el.addEventListener('en-change',(e:Event)=>e.preventDefault(),{once:true}));await input.evaluate((el:HTMLInputElement)=>el.setSelectionRange(1,1));await input.press('ArrowUp');await expect(field).toHaveJSProperty('value','10:45');
 await field.evaluate((el:any)=>el.addEventListener('en-change',()=>{el.value='12:00';},{once:true}));await input.press('ArrowUp');await expect(field).toHaveJSProperty('value','12:00');
 await typeTime(input,'bad time');await input.press('ArrowUp');await expect(input).toHaveValue('bad time');await expect(field).toHaveJSProperty('value','12:00');
});
test('localized prefix day periods and RTL digits map to their actual caret ranges',async({page})=>{
 const field=page.locator('en-time-field[name=end-time]'),input=field.locator('input');
 await field.evaluate((el:any)=>{el.locale='zh-CN';el.hourCycle='12';el.value='13:30:15';});await input.focus();await input.evaluate((el:HTMLInputElement)=>el.setSelectionRange(0,0));await input.press('ArrowUp');await expect(field).toHaveJSProperty('value','01:30:15');expect(await input.evaluate((el:HTMLInputElement)=>el.value.slice(el.selectionStart!,el.selectionEnd!))).toBe('上午');
 await field.evaluate((el:any)=>{el.locale='ar-u-nu-arab';el.hourCycle='24';el.dir='rtl';el.value='13:30:15';});await expect(input).toHaveValue(/١٣:٣٠:١٥/);await input.evaluate((el:HTMLInputElement)=>{const p=el.value.indexOf('٣٠');el.setSelectionRange(p+1,p+1);});await input.press('ArrowDown');await expect(field).toHaveJSProperty('value','13:29:15');expect(await input.evaluate((el:HTMLInputElement)=>el.value.slice(el.selectionStart!,el.selectionEnd!))).toBe('٢٩');
});
test('stepping a typed draft is one cancelable change and retains the typed segment',async({page})=>{
 const field=page.locator('#specimen-time-field'),input=field.locator('input');await typeTime(input,'9:45 AM');await input.evaluate((el:HTMLInputElement)=>el.setSelectionRange(0,1));
 await field.evaluate((el:any)=>{el.dataset.changes='0';el.addEventListener('en-change',(event:Event)=>{el.dataset.changes=String(+el.dataset.changes+1);event.preventDefault();},{once:true});});await input.press('ArrowUp');await expect(field).toHaveJSProperty('value','09:30');await expect(field).toHaveAttribute('data-changes','1');
 await typeTime(input,'9:45 AM');await input.evaluate((el:HTMLInputElement)=>el.setSelectionRange(0,1));await input.press('ArrowUp');await expect(field).toHaveJSProperty('value','10:45');expect(await input.evaluate((el:HTMLInputElement)=>[el.selectionStart,el.selectionEnd])).toEqual([0,2]);
});
