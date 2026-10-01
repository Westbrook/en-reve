import {test,expect,type Locator} from '@playwright/test';

async function boundary(input:Locator,side:'before'|'after'){
 await input.evaluate((el,side)=>{
  (el as HTMLElement).focus();const token=el.querySelector('[data-token]')!,parent=token.parentNode!,offset=[...parent.childNodes].indexOf(token)+(side==='after'?1:0);
  document.getSelection()!.setBaseAndExtent(parent,offset,parent,offset);document.dispatchEvent(new Event('selectionchange'));
 },side);
}
for(const id of ['rich-brief','rich-reply','plain-reply'])for(const trigger of ['@','/'])test(`${id} deletes into ${trigger} from either side without selecting the chip`,async({page})=>{
 await page.goto('/api-examples/rich-text.html');const host=page.locator('#'+id),input=host.getByRole('textbox');await expect(input).toHaveAttribute('contenteditable','true');
 for(const side of ['after','before'] as const){
  await host.evaluate((el:any)=>{el.value='';el.focus();});await input.pressSequentially('Before '+trigger+(trigger==='@'?'Cov':'rev'));await expect(host.getByRole('option')).toHaveCount(1);await input.press('Enter');await expect(input.locator('[data-token]')).toHaveCount(1);
  await input.pressSequentially(' tail');const committed=await host.evaluate((el:any)=>el.value);
  await boundary(input,side);await page.keyboard.press(side==='after'?'Backspace':'Delete');
  await expect(host).toHaveJSProperty('value','Before '+trigger+' tail');await expect(input.locator('[data-token]')).toHaveCount(0);await expect(host.getByRole('listbox')).toBeVisible();
  await input.press('Escape');await input.press('ControlOrMeta+z');await expect(host).toHaveJSProperty('value',committed);await expect(input.locator('[data-token]')).toHaveCount(1);
  await boundary(input,side);await page.keyboard.press(side==='after'?'Backspace':'Delete');await input.press('Backspace');
  await expect(host).toHaveJSProperty('value','Before  tail');await expect(host.getByRole('listbox')).not.toBeVisible();
 }
});

test('rich token deletion honors veto, explicit editing, native input and removal policy',async({page})=>{
 await page.goto('/api-examples/rich-text.html');const host=page.locator('#rich-brief'),input=host.getByRole('textbox');await expect(input).toHaveAttribute('contenteditable','true');
 const seed=async()=>{
  await host.evaluate((el:any)=>{el.value='';el.focus();});await input.pressSequentially('@Cov');await expect(host.getByRole('option')).toHaveCount(1);await input.press('Enter');await expect(input.locator('[data-token]')).toHaveCount(1);
 };
 await seed();await boundary(input,'after');
 await host.evaluate((el:any)=>el.addEventListener('en-change',(event:Event)=>event.preventDefault(),{once:true}));await page.keyboard.press('Backspace');await expect(host).toHaveJSProperty('value','@Cover study');await expect(input.locator('[data-token]')).toHaveCount(1);
 expect(await host.evaluate((el:any)=>el.editToken(el.shadowRoot.querySelector('[data-token]').dataset.token,{query:'Al'}))).toBe(true);await expect(host).toHaveJSProperty('value','@Al');await expect(host.getByRole('option',{name:'Alex Kim',exact:true})).toBeVisible();await input.press('Escape');await input.press('ControlOrMeta+z');await expect(host).toHaveJSProperty('value','@Cover study');
 await boundary(input,'after');
 expect(await input.evaluate(el=>!el.dispatchEvent(new InputEvent('beforeinput',{bubbles:true,cancelable:true,inputType:'deleteContentBackward'})))).toBe(true);await expect(host).toHaveJSProperty('value','@');
 await seed();const chip=input.locator('[data-token]');await chip.focus();await chip.press('Delete');await expect(host).toHaveJSProperty('value','@');await expect(input).toBeFocused();
 await seed();await host.evaluate((el:any)=>el.registerToken('reference',(run:any)=>document.createTextNode(run.text),{extension:'references',deleteBehavior:'remove'}));await boundary(input,'after');await page.keyboard.press('Backspace');await expect(host).toHaveJSProperty('value','');await expect(host.getByRole('listbox')).not.toBeVisible();await input.press('ControlOrMeta+z');await expect(host).toHaveJSProperty('value','@Cover study');
 await host.evaluate((el:any)=>el.readOnly=true);expect(await host.evaluate((el:any)=>el.editToken(el.shadowRoot.querySelector('[data-token]').dataset.token))).toBe(false);await expect(host).toHaveJSProperty('value','@Cover study');
});
