import {test,expect} from '@playwright/test';
const value='color(display-p3 1 0.2 0.1 / 0.65)';
for(const backend of ['token','rich'])test(`${backend} editor preserves P3 through apply, reopen, cancel, undo and clipboard`,async({page})=>{
 await page.goto('/api-examples/color-picker.html');
 const host=page.locator(`#color-${backend}-editor`),box=host.getByRole('textbox');
 await expect(box).toHaveAttribute('contenteditable','true');
 await box.focus();await box.pressSequentially('#');
 const dialog=host.getByRole('dialog',{name:'Color picker'});await expect(dialog).toBeVisible();
 await expect(dialog.locator('en-color-picker')).toHaveJSProperty('value',value);
 await dialog.getByRole('button',{name:'Apply color',exact:true}).click();
 const chip=box.locator('[data-token]');await expect(chip).toHaveCount(1);
 await expect(chip.locator('[part=color-swatch]')).toHaveCSS('background-image',/repeating-conic-gradient/);
 await expect(chip.locator('[part=color-swatch-paint]')).toHaveCSS('background-color',/0\.65/);
 const id=await chip.getAttribute('data-token');await expect(host).toHaveJSProperty('value',value);
 await chip.click();await expect(dialog.locator('en-color-picker')).toHaveJSProperty('value',value);
 await dialog.locator('en-color-picker').evaluate((el:any)=>el.value='color(display-p3 .3 .4 .5 / .25)');
 await dialog.getByRole('button',{name:'Cancel',exact:true}).click();await expect(host).toHaveJSProperty('value',value);
 await chip.click();await dialog.locator('en-color-picker').evaluate((el:any)=>el.value='color(display-p3 .3 .4 .5 / .25)');
 await dialog.getByRole('button',{name:'Apply color',exact:true}).click();await expect(chip).toHaveAttribute('data-token',id!);
 await host.evaluate((el:any)=>el.undo());await expect(host).toHaveJSProperty('value',value);
 await box.focus();await box.press('ControlOrMeta+a');
 const copied=await box.evaluate(el=>{const values:Record<string,string>={};const event=new Event('copy',{bubbles:true,cancelable:true});Object.defineProperty(event,'clipboardData',{value:{setData:(key:string,value:string)=>values[key]=value}});el.dispatchEvent(event);return values;});
 expect(copied['application/x-en-editor+json']).toContain(value);
 const other=page.locator(`#color-${backend==='token'?'rich':'token'}-editor`),otherBox=other.getByRole('textbox');await otherBox.focus();
 await otherBox.evaluate((el,values)=>{const event=new Event('paste',{bubbles:true,cancelable:true});Object.defineProperty(event,'clipboardData',{value:{getData:(key:string)=>values[key]??''}});el.dispatchEvent(event);},copied);
 await expect(other).toHaveJSProperty('value',value);await expect(otherBox.locator('[data-token]')).toHaveCount(1);
 await otherBox.locator('[data-token]').click();await expect(other.getByRole('dialog').locator('en-color-picker')).toHaveJSProperty('value',value);
});
test('invalid color payload remains readable and never becomes an inline style',async({page})=>{
 await page.goto('/api-examples/color-picker.html');
 for(const backend of ['token','rich']){
  const host=page.locator(`#color-${backend}-editor`),box=host.getByRole('textbox');await expect(box).toHaveAttribute('contenteditable','true');await box.focus();
  await box.evaluate(el=>{const event=new Event('paste',{bubbles:true,cancelable:true});Object.defineProperty(event,'clipboardData',{value:{getData:(type:string)=>type==='application/x-en-editor+json'?JSON.stringify({type:'en-editor-clipboard',version:1,runs:[{kind:'token',id:'bad-color',type:'demo/color',text:'Unrecognized color',label:'Unrecognized color',data:{color:'url(https://example.invalid/x)'}}]}):''}});el.dispatchEvent(event);});
  await expect(box).toContainText('Unrecognized color');await expect(box.locator('[part~=color-swatch]')).toHaveCount(0);
 }
});
