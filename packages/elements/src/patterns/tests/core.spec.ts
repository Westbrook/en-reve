import {test,expect,type Page} from '@playwright/test';
async function mount(page:Page,html:string){await page.goto('/packages/elements/src/patterns/tests/fixture.html');await page.waitForFunction(()=>!!customElements.get('en-multiselect'));await page.locator('#fixture').evaluate((el,html)=>{el.innerHTML=html},html);}
const items=[{value:'a',label:'Alpha'},{value:'b',label:'Beta'},{value:'c',label:'Gamma',disabled:true}];
test('toggle native semantics, mixed, cancellation and authoritative writes',async({page})=>{
 await mount(page,'<en-toggle-button>Bold</en-toggle-button>');const host=page.locator('en-toggle-button'),button=host.locator('button');
 await expect(button).toHaveAttribute('aria-pressed','false');await button.click();await expect(button).toHaveAttribute('aria-pressed','true');
 await host.evaluate((el:any)=>el.pressed='mixed');await button.press('Space');await expect(button).toHaveAttribute('aria-pressed','true');
 await host.evaluate(el=>el.addEventListener('en-change',event=>event.preventDefault(),{once:true}));await button.click();await expect(button).toHaveAttribute('aria-pressed','true');
 await host.evaluate(el=>el.addEventListener('en-change',event=>{(el as any).pressed='mixed';event.preventDefault()},{once:true}));await button.click();await expect(button).toHaveAttribute('aria-pressed','mixed');
 await host.evaluate((el:any)=>el.disabled=true);await expect(button).toBeDisabled();
});
for(const tag of ['en-toggle-group','en-checkbox-group','en-multiselect'])test(`${tag}: values, tentative form data, veto, reset and fieldset disabled`,async({page})=>{
 await mount(page,`<form><fieldset><${tag} name="choice" label="Choices" value='["a"]'></${tag}></fieldset><button type="reset">Reset</button></form>`);
 const host=page.locator(tag);await host.evaluate((el:any,items)=>{el.items=items;el.multiple=true},items);
 const pick=async()=>{if(tag==='en-multiselect')await host.locator('#query').click();await (tag==='en-checkbox-group'?host.locator('label').filter({hasText:'Beta'}):host.getByRole(tag==='en-multiselect'?'option':'button',{name:'Beta',exact:true})).click()};
 await host.evaluate(el=>el.addEventListener('en-change',event=>{(window as any).tentative=new FormData(document.querySelector('form')!).getAll('choice');event.preventDefault()},{once:true}));await pick();
 expect(await page.evaluate(()=>(window as any).tentative)).toEqual(['a','b']);expect(await host.evaluate((el:any)=>el.value)).toEqual(['a']);
 await pick();expect(await host.evaluate((el:any)=>el.value)).toEqual(['a','b']);if(tag==='en-multiselect')await host.getByRole('combobox').press('Escape');await page.getByRole('button',{name:'Reset',exact:true}).click();expect(await host.evaluate((el:any)=>el.value)).toEqual(['a']);
 await page.locator('fieldset').evaluate((el:any)=>el.disabled=true);expect(await page.evaluate(()=>new FormData(document.querySelector('form')!).getAll('choice'))).toEqual([]);
});
test('multiselect query and removal preserve selection and return focus',async({page})=>{
 await mount(page,'<en-multiselect label="People"></en-multiselect>');const host=page.locator('en-multiselect');await host.evaluate((el:any,items)=>{el.items=items;el.value=['a','b']},items);
 const input=host.getByRole('combobox');await input.fill('Gam');await expect(host.getByRole('option')).toHaveCount(1);expect(await host.evaluate((el:any)=>el.value)).toEqual(['a','b']);
 await host.getByRole('button',{name:'Remove Alpha'}).click();await expect(input).toBeFocused();expect(await host.evaluate((el:any)=>el.value)).toEqual(['b']);
 await input.fill('');await input.press('Backspace');expect(await host.evaluate((el:any)=>el.value)).toEqual([]);
});
test('confirmation semantics, explicit initial focus and static callout',async({page})=>{
 await mount(page,'<button id="open">Delete</button><en-dialog for="open" kind="alertdialog" label="Delete file?" description="This action removes the file." initial-focus="cancel"><button id="cancel" slot="footer">Cancel</button><button slot="footer">Confirm</button></en-dialog><en-alert announcement="none">Static information</en-alert>');
 await page.locator('#open').click();const dialog=page.getByRole('alertdialog');await expect(dialog).toBeVisible();await expect(dialog).toHaveAccessibleName('Delete file?');await expect(dialog).toHaveAccessibleDescription('This action removes the file.');await expect(page.locator('#cancel')).toBeFocused();
 await page.keyboard.press('Escape');await expect(page.locator('#open')).toBeFocused();await expect(page.locator('en-alert [part=content]')).not.toHaveAttribute('role');
});
test('adornment actions remain separately named and fields retain labels',async({page})=>{
 await mount(page,'<en-text-field label="Amount" adorned><span slot="prefix" aria-hidden="true">$</span><button slot="help-action">Explain amount</button></en-text-field>');await expect(page.getByRole('textbox',{name:'Amount',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Explain amount'})).toBeEnabled();
});
test('authored choice metadata reacts to live label, insertion and removal',async({page})=>{
 await mount(page,'<en-checkbox-group name="choice" label="Choices"><en-choice-option value="a">Alpha</en-choice-option><en-choice-option value="b">Beta</en-choice-option></en-checkbox-group>');
 const host=page.locator('en-checkbox-group');await expect(host.getByRole('checkbox')).toHaveCount(2);await host.getByRole('checkbox',{name:'Beta'}).check();
 await host.locator('en-choice-option[value="b"]').evaluate(el=>el.textContent='Bravo');await expect(host.getByRole('checkbox',{name:'Bravo'})).toBeChecked();
 await host.evaluate(el=>el.insertAdjacentHTML('beforeend','<en-choice-option value="c">Charlie</en-choice-option>'));await expect(host.getByRole('checkbox')).toHaveCount(3);
 await host.locator('en-choice-option[value="b"]').evaluate(el=>el.remove());await expect(host.getByRole('checkbox')).toHaveCount(2);expect(await host.evaluate((el:any)=>el.checkValidity())).toBe(false);
});
test('context menu pointer and keyboard invocation reuse menu keys and focus return',async({page})=>{
 await mount(page,'<div id="target" tabindex="0" style="padding:40px">File</div><en-context-menu for="target" label="File actions"><en-menu-item action="rename">Rename</en-menu-item><en-menu-item action="delete">Delete</en-menu-item></en-context-menu>');
 const target=page.locator('#target');await target.click({button:'right'});await expect(page.getByRole('menu')).toBeVisible();await expect(page.getByRole('menuitem',{name:'Rename'})).toBeFocused();await page.keyboard.press('ArrowDown');await expect(page.getByRole('menuitem',{name:'Delete'})).toBeFocused();await page.keyboard.press('Escape');await expect(target).toBeFocused();
 await target.press('Shift+F10');await expect(page.getByRole('menu')).toBeVisible();expect(await page.locator('en-context-menu').evaluate((el:any)=>el.contextTarget.id)).toBe('target');
});
test('interval endpoints obey collision, keyboard, reset and tentative form values',async({page})=>{
 await mount(page,'<form><en-range-slider name="price" label="Price" value="[20,80]" min-gap="10"></en-range-slider><button type="reset">Reset</button></form>');
 const host=page.locator('en-range-slider'),lower=host.getByRole('slider',{name:'Minimum',exact:true}),upper=host.getByRole('slider',{name:'Maximum',exact:true});
 await lower.press('End');await expect(lower).toHaveAttribute('aria-valuenow','70');await expect(upper).toHaveAttribute('aria-valuemin','80');
 await host.evaluate(el=>el.addEventListener('en-change',event=>{(window as any).pair=new FormData(document.querySelector('form')!).getAll('price');event.preventDefault()},{once:true}));await lower.press('ArrowLeft');expect(await page.evaluate(()=>(window as any).pair)).toEqual(['69','80']);await expect(lower).toHaveAttribute('aria-valuenow','70');
 await page.getByRole('button',{name:'Reset',exact:true}).click();expect(await host.evaluate((el:any)=>el.value)).toEqual([20,80]);await upper.press('Home');await expect(upper).toHaveAttribute('aria-valuenow','30');
});
test('OTP is one form value and circular progress remains native task progress',async({page})=>{
 await mount(page,'<form><en-otp-field name="code" label="Verification code" required></en-otp-field></form><en-progress-bar label="Uploading" shape="circle" value="25" max="100"></en-progress-bar>');
 const input=page.getByRole('textbox',{name:'Verification code'});await input.fill('001234');await input.press('Tab');expect(await page.evaluate(()=>new FormData(document.querySelector('form')!).get('code'))).toBe('001234');expect(await page.locator('en-otp-field').evaluate((el:any)=>el.checkValidity())).toBe(true);
 await expect(page.getByRole('progressbar',{name:'Uploading'})).toHaveAttribute('value','25');await expect(page.locator('en-progress-bar svg')).toHaveAttribute('aria-hidden','true');
});
test('selection focus recovers when a focused choice is removed and reset restores native state',async({page})=>{await mount(page,'<form><en-checkbox-group label="Choices" name="choice" value=\'["a"]\'></en-checkbox-group><button type="reset">Reset</button></form>');const host=page.locator('en-checkbox-group');await host.evaluate((el:any)=>el.items=[{value:'a',label:'Alpha'},{value:'b',label:'Beta'}]);await host.getByRole('checkbox',{name:'Beta'}).check();await page.getByRole('button',{name:'Reset',exact:true}).click();await expect(host.getByRole('checkbox',{name:'Beta'})).not.toBeChecked();await host.getByRole('checkbox',{name:'Beta'}).focus();await host.evaluate((el:any)=>el.items=[{value:'a',label:'Alpha'}]);await expect(host.getByRole('checkbox',{name:'Alpha'})).toBeFocused();});
test('context long press cancels after motion and consumes its following click',async({page})=>{await mount(page,'<button id="target">File</button><en-context-menu for="target" label="Actions"><en-menu-item action="open">Open</en-menu-item></en-context-menu>');const target=page.locator('#target');await target.evaluate(el=>el.addEventListener('click',()=>{(window as any).activated=true}));await target.dispatchEvent('pointerdown',{pointerType:'touch',pointerId:4,isPrimary:true,button:0,clientX:20,clientY:20});await target.dispatchEvent('pointermove',{pointerType:'touch',pointerId:4,isPrimary:true,clientX:40,clientY:20});await page.waitForTimeout(700);await expect(page.getByRole('menu')).not.toBeVisible();await target.dispatchEvent('pointerdown',{pointerType:'touch',pointerId:5,isPrimary:true,button:0,clientX:20,clientY:20});await expect(page.getByRole('menu')).toBeVisible();await target.dispatchEvent('pointerup',{pointerType:'touch',pointerId:5,isPrimary:true});await target.dispatchEvent('click');expect(await page.evaluate(()=>(window as any).activated)).toBeUndefined();});
test('multiselect can remove an unavailable selection and dismiss on a nonfocusable outside click',async({page})=>{await mount(page,'<en-multiselect label="People" value=\'["missing"]\'></en-multiselect><div id="outside" style="padding:30px;margin-top:250px">Outside</div>');const host=page.locator('en-multiselect');await host.evaluate((el:any)=>el.items=[{value:'a',label:'Ada'}]);expect(await host.evaluate((el:any)=>el.checkValidity())).toBe(false);await host.getByRole('button',{name:'Remove missing'}).click();expect(await host.evaluate((el:any)=>el.checkValidity())).toBe(true);await host.getByRole('combobox').click();await expect(host.getByRole('listbox')).toBeVisible();await page.locator('#outside').click();await expect(host.getByRole('listbox')).not.toBeVisible();});

test('rich checkbox children retain nodes, expose separate descriptions and own one form value',async({page})=>{
 await mount(page,`<form><en-checkbox-group cards name="teams" label="Teams" value='["a"]'><en-choice-option value="a"><span aria-hidden="true">★</span><strong id="rich-label">Alpha</strong><span slot="description"><em>First</em> team</span></en-choice-option><en-choice-option value="b" label="Beta" description="Second team"></en-choice-option></en-checkbox-group><button type="reset">Reset</button></form>`);
 const host=page.locator('en-checkbox-group'),alpha=host.getByRole('checkbox',{name:'Alpha',exact:true}),beta=host.getByRole('checkbox',{name:'Beta',exact:true});
 await expect(alpha).toHaveAccessibleDescription('First team');await expect(beta).toHaveAccessibleDescription('Second team');
 await page.locator('#rich-label').evaluate(el=>{(window as any).richNode=el;(window as any).richClicks=0;el.addEventListener('click',()=>{(window as any).richClicks++})});
 await page.locator('#rich-label').click();await expect(alpha).not.toBeChecked();expect(await page.evaluate(()=>(window as any).richClicks)).toBe(1);
 await beta.focus();await beta.press('Space');expect(await page.evaluate(()=>new FormData(document.querySelector('form')!).getAll('teams'))).toEqual(['b']);
 await host.evaluate(el=>el.addEventListener('en-change',event=>event.preventDefault(),{once:true}));await page.locator('#rich-label').click();await expect(alpha).not.toBeChecked();
 await page.getByRole('button',{name:'Reset',exact:true}).click();await expect(alpha).toBeChecked();await expect(beta).not.toBeChecked();
 await page.locator('#rich-label').evaluate(el=>el.textContent='Alpine');await expect(host.getByRole('checkbox',{name:'Alpine',exact:true})).toBeChecked();
 await host.locator('[slot=description]').evaluate(el=>el.textContent='Updated description');await expect(host.getByRole('checkbox',{name:'Alpine'})).toHaveAccessibleDescription('Updated description');
 expect(await page.locator('#rich-label').evaluate(el=>el===(window as any).richNode)).toBe(true);
 await host.locator('en-choice-option[value=b]').evaluate((el:any)=>el.description='Changed fallback');await expect(beta).toHaveAccessibleDescription('Changed fallback');
 await host.evaluate((el:any)=>el.readOnly=true);await page.locator('#rich-label').click();await expect(host.getByRole('checkbox',{name:'Alpine'})).toBeChecked();
 await host.evaluate((el:any)=>{el.readOnly=false;el.disabled=true});await expect(beta).toBeDisabled();
});

test('rich checkbox projection survives reorder, transfer, hidden and data fallback',async({page})=>{
 await mount(page,'<en-checkbox-group id="one" label="One"><en-choice-option value="a"><strong id="alpha">Alpha</strong></en-choice-option><en-choice-option value="b">Beta</en-choice-option></en-checkbox-group><en-checkbox-group id="two" label="Two"></en-checkbox-group>');
 const one=page.locator('#one'),two=page.locator('#two');await one.getByRole('checkbox',{name:'Alpha'}).check();
 await one.evaluate(el=>{const child=el.querySelector('en-choice-option')!;(window as any).originalChild=child;el.append(child)});await expect(one.getByRole('checkbox').last()).toHaveAccessibleName('Alpha');await expect(one.getByRole('checkbox').last()).toBeChecked();
 await page.evaluate(()=>document.querySelector('#two')!.append((window as any).originalChild));await expect(two.getByRole('checkbox',{name:'Alpha'})).toBeVisible();await page.locator('#alpha').click();await expect(two.getByRole('checkbox')).toBeChecked();
 await two.locator('en-choice-option').evaluate(el=>el.setAttribute('hidden',''));await expect(two.getByRole('checkbox')).toHaveCount(0);await two.locator('en-choice-option').evaluate(el=>el.removeAttribute('hidden'));await expect(two.getByRole('checkbox')).toBeChecked();
 await two.evaluate((el:any)=>{el.items=[{value:'data',label:'Data fallback'}];el.querySelector('en-choice-option').remove()});await expect(two.getByRole('checkbox',{name:'Data fallback'})).toBeVisible();
});

test('rich checkbox rejects nested controls and recovers after content correction',async({page})=>{
 await mount(page,'<en-checkbox-group label="Teams"><en-choice-option value="a"><button>Nested action</button></en-choice-option></en-checkbox-group>');const host=page.locator('en-checkbox-group');
 await expect(host.getByRole('checkbox')).toHaveCount(0);expect(await host.evaluate((el:any)=>el.checkValidity())).toBe(false);
 await host.locator('en-choice-option').evaluate(el=>el.innerHTML='<strong>Alpha</strong><span slot="description">First team</span>');await expect(host.getByRole('checkbox',{name:'Alpha'})).toBeVisible();expect(await host.evaluate((el:any)=>el.checkValidity())).toBe(true);
 await host.locator('strong').evaluate(el=>el.setAttribute('tabindex','0'));await expect(host.getByRole('checkbox')).toHaveCount(0);
 await host.locator('strong').evaluate(el=>el.removeAttribute('tabindex'));await expect(host.getByRole('checkbox')).toHaveCount(1);
});
