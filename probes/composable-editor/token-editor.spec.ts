import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
async function fill(page:any,text:string){const field=page.getByRole('textbox',{name:'Draft'});await field.click();await field.press('ControlOrMeta+a');await field.press('Backspace');if(text)await field.pressSequentially(text);}
test.beforeEach(async({page})=>{await page.goto('/probes/composable-editor/token-editor.html');await page.waitForFunction(()=>(window as any).ready);});
test('typed reference opens suggestions; inserts atom; undo and redo cover typing and insertion',async({page})=>{
 const field=page.getByRole('textbox',{name:'Draft'});await fill(page,'Hello @mi');await expect(page.getByRole('option',{name:'Mira'})).toBeVisible();await field.press('Enter');await expect(field).toContainText('Hello @Mira');expect(await field.locator('[data-token]').count()).toBe(1);await field.press('Control+z');await expect(page.locator('en-token-editor')).toHaveJSProperty('value','Hello @mi');await field.press('Control+Shift+z');await expect(page.locator('en-token-editor')).toHaveJSProperty('value','Hello @Mira');await field.press('x');await expect(page.locator('en-token-editor')).toHaveJSProperty('value','Hello @Mirax');await expect(field.locator('[data-token]')).toHaveText('@Mira');
});
test('tools can execute without tokens; Escape preserves typed trigger and permits later activation',async({page})=>{
 const field=page.getByRole('textbox',{name:'Draft'});await fill(page,'/');await expect(page.getByRole('option')).toBeVisible();await field.press('Escape');await expect(page.getByRole('option')).not.toBeVisible();await expect(page.locator('en-token-editor')).toHaveJSProperty('value','/');await field.press('s');await expect(page.getByRole('option')).toBeVisible();await field.press('Enter');await expect(page.locator('en-token-editor')).toHaveJSProperty('value','');await expect(page.locator('#result')).toHaveText('summarize');
});
test('multiline paste stays text; atomic deletion and grapheme history remain stable',async({page})=>{
 const field=page.getByRole('textbox',{name:'Draft'});await fill(page,'one');await field.press('Enter');await field.press('x');await expect(page.locator('en-token-editor')).toHaveJSProperty('value','one\nx');
 await field.evaluate(el=>{const data=new DataTransfer();data.setData('text/plain','<b>two</b>\nthree');const event=new Event('paste',{bubbles:true,cancelable:true,composed:true});Object.defineProperty(event,'clipboardData',{value:data});el.dispatchEvent(event);});await expect(field).toContainText('<b>two</b>\nthree');expect(await field.locator('b').count()).toBe(0);
 await page.evaluate(()=>{const e=(window as any).editor;e.document={version:1,runs:[{kind:'text',text:'👩🏽‍💻'},{kind:'token',id:'t',type:'ref',text:'@Mira',label:'Mira',data:{}}]};e.focus();e.replaceSelection([],{anchor:12,focus:12});});await field.press('End');await field.press('Backspace');expect(await field.locator('[data-token]').count()).toBe(0);await field.press('Control+z');expect(await field.locator('[data-token]').count()).toBe(1);
});
test('canceling a commit rolls back document and undo; author writes win',async({page})=>{
 const field=page.getByRole('textbox',{name:'Draft'});await fill(page,'Keep');await page.evaluate(()=>{(window as any).editor.addEventListener('en-change',(e:Event)=>e.preventDefault(),{once:true});});await field.press('x');await expect(page.locator('en-token-editor')).toHaveJSProperty('value','Keep');await page.evaluate(()=>{const e=(window as any).editor;e.addEventListener('en-change',(event:Event)=>{e.value='author';event.preventDefault();},{once:true});});await field.press('x');await expect(page.locator('en-token-editor')).toHaveJSProperty('value','author');
});
test('composition defers mutation and author reset until commit',async({page})=>{
 const field=page.getByRole('textbox',{name:'Draft'});await field.focus();await field.dispatchEvent('compositionstart',{bubbles:true,composed:true});expect(await page.evaluate(()=>(window as any).editor.replaceSelection([{kind:'text',text:'bad'}]))).toBe(false);await page.evaluate(()=>(window as any).editor.value='author');await field.dispatchEvent('compositionend',{bubbles:true,composed:true});await expect(page.locator('en-token-editor')).toHaveJSProperty('value','author');
});
test('stale providers, removed extensions, and rejected command choices do not replace drafts',async({page})=>{
 const field=page.getByRole('textbox',{name:'Draft'});await page.evaluate(()=>{const e=(window as any).editor;(window as any).remove=e.registerExtension({id:'slow',trigger:'!',label:'Slow',provide:()=>new Promise(resolve=>{(window as any).resolve=resolve;})});});await fill(page,'!');await page.waitForFunction(()=>!!(window as any).resolve);await fill(page,'newer');await page.evaluate(()=>(window as any).resolve([{id:'late',label:'Late',insert:[{kind:'text',text:'late'}]}]));await expect(page.getByRole('option',{name:'Late'})).not.toBeVisible();await expect(page.locator('en-token-editor')).toHaveJSProperty('value','newer');await page.evaluate(()=>(window as any).remove());
 await page.evaluate(()=>(window as any).editor.addEventListener('en-action',(e:Event)=>e.preventDefault()));await fill(page,'/');await expect(page.getByRole('option')).toBeVisible();await field.press('Enter');await expect(page.locator('en-token-editor')).toHaveJSProperty('value','/');
});
test('label and active suggestions pass baseline accessibility',async({page})=>{
 await fill(page,'@');await expect(page.getByRole('option')).toBeVisible();expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
});
test('read-only and disabled editors reject edits and extensions without altering their document',async({page})=>{
 const editor=page.locator('en-token-editor');await fill(page,'Keep');
 await editor.evaluate((e:any)=>{e.readOnly=true;});await expect(page.getByRole('textbox',{name:'Draft'})).toHaveAttribute('contenteditable','false');
 expect(await editor.evaluate((e:any)=>[e.replaceSelection([{kind:'text',text:'bad'}]),e.openExtension('refs'),e.undo()])).toEqual([false,false,false]);
 await editor.evaluate((e:any)=>{e.readOnly=false;e.disabled=true;});await expect(page.getByRole('textbox',{name:'Draft'})).toHaveAttribute('tabindex','-1');await expect(editor).toHaveJSProperty('value','Keep');
});

test('custom rendered picker remains an alternative with keyboard cancellation and commit',async({page})=>{
 await page.evaluate(()=>{const w=window as any;w.editor.registerExtension({id:'custom',trigger:'!',label:'Custom picker',render:(session:any)=>w.template`<button tabindex="0" @click=${()=>session.commit({id:'picked',label:'Picked',insert:[{kind:'text',text:'Picked'}]})}>Apply choice</button><button tabindex="0" @click=${()=>session.cancel()}>Cancel choice</button>`});});
 const field=page.getByRole('textbox',{name:'Draft'});await fill(page,'!');await expect(page.getByRole('dialog',{name:'Custom picker'})).toBeVisible();await field.press('ArrowDown');await expect(page.getByRole('button',{name:'Apply choice'})).toBeFocused();await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'Cancel choice'})).toBeFocused();await page.keyboard.press('Escape');await expect(field).toBeFocused();await expect(page.locator('en-token-editor')).toHaveJSProperty('value','!');
 await fill(page,'!');await field.press('ArrowDown');await page.getByRole('button',{name:'Apply choice'}).click();await expect(page.locator('en-token-editor')).toHaveJSProperty('value','Picked');await expect(field).toBeFocused();
});
test('external picker opens synchronously, can own focus, and aborts on removal',async({page})=>{
 expect(await page.evaluate(()=>{const w=window as any;let returned=false;w.remove=w.editor.registerExtension({id:'external',trigger:'!',label:'External picker',open:(session:any)=>{w.session=session;w.wasSynchronous=!returned;}});w.editor.openExtension('external');returned=true;return w.wasSynchronous;})).toBe(true);
 await page.getByRole('button',{name:'Outside'}).click();expect(await page.evaluate(()=>(window as any).session.signal.aborted)).toBe(false);
 await page.evaluate(()=>(window as any).remove());expect(await page.evaluate(()=>{const s=(window as any).session;return [s.signal.aborted,s.commit({id:'stale',label:'Stale',insert:[{kind:'text',text:'Stale'}]})];})).toEqual([true,false]);await expect(page.locator('en-token-editor')).toHaveJSProperty('value','');
});

test('focused token default deletion removes it, and missing extensions disable chip actions',async({page})=>{
 await page.evaluate(()=>{const e=(window as any).editor;e.registerToken('ref',(token:any)=>document.createTextNode(token.text),{extension:'references',part:'reference-token'});e.document={version:1,runs:[{kind:'token',id:'r1',type:'ref',text:'@Mira',label:'Edit Mira',data:{id:'mira'}}]};});const chip=page.getByRole('button',{name:'Edit Mira'});await chip.focus();await chip.press('Delete');await expect(page.locator('en-token-editor')).toHaveJSProperty('value','');await page.keyboard.press('ControlOrMeta+z');await expect(chip).toBeVisible();
 await page.evaluate(()=>{const e=(window as any).editor;e.registerToken('ref',(token:any)=>document.createTextNode(token.text),{extension:'missing'});});await expect(chip).toBeDisabled();await page.evaluate(()=>{const e=(window as any).editor;(window as any).remove=e.registerExtension({id:'missing',trigger:'!',label:'Choices',provide:()=>[]});});await expect(chip).toBeEnabled();await expect(chip).toHaveAttribute('aria-haspopup','listbox');await page.evaluate(()=>(window as any).remove());await expect(chip).toBeDisabled();
});

test('token and extension registrations can be configured before connection',async({page})=>{
 expect(await page.evaluate(()=>{const editor=document.createElement('en-token-editor') as any;const dispose=editor.registerExtension({id:'pre',trigger:'!',label:'Preconfigured',provide:()=>[]});editor.registerToken('ref',(token:any)=>document.createTextNode(token.text),{extension:'pre'});editor.document={version:1,runs:[{kind:'token',id:'r1',type:'ref',text:'@Mira',label:'Mira',data:{}}]};dispose();return editor.value;})).toBe('@Mira');
});

test('un-themed tokens retain a visible default surface and border',async({page})=>{
 await page.evaluate(()=>{(window as any).editor.document={version:1,runs:[{kind:'token',id:'plain',type:'unknown',text:'Plain token',label:'Plain token',data:{}}]};});const token=page.locator('en-token-editor').locator('[part~="token"]');await expect(token).toHaveCSS('background-color','rgb(238, 241, 245)');await expect(token).toHaveCSS('border-top-style','solid');await expect(token).toHaveCSS('color','rgb(27, 31, 36)');
});

test('custom option selection can hand off synchronously and stale sessions cannot reopen',async({page})=>{
 await page.evaluate(()=>{const w=window as any;w.remove=w.editor.registerExtension({id:'custom',trigger:'!',label:'Custom',provide:()=>[{id:'pick',label:'Choose externally'}],renderOption:()=>w.template`<span aria-hidden="true">Decorative preview</span>`,select:(_choice:any,session:any)=>{w.retained=session;let returned=false;session.openPicker((picker:any)=>{w.synchronous=!returned;w.retained=picker;});returned=true;}});});
 await fill(page,'!');const choice=page.getByRole('option',{name:'Choose externally'});await expect(choice).toHaveAccessibleName('Choose externally');await page.getByRole('textbox',{name:'Draft'}).press('Enter');expect(await page.evaluate(()=>(window as any).synchronous)).toBe(true);await expect(choice).toHaveCount(0);
 await page.evaluate(()=>{const w=window as any;w.editor.addEventListener('en-change',(event:Event)=>event.preventDefault(),{once:true});w.canceled=w.retained.commit({id:'x',label:'X',insert:[{kind:'text',text:'X'}]});});expect(await page.evaluate(()=>(window as any).canceled)).toBe(false);await expect(page.locator('en-token-editor')).toHaveJSProperty('value','!');
 await page.evaluate(()=>(window as any).remove());expect(await page.evaluate(()=>{const w=window as any;return [w.retained.signal.aborted,w.retained.openPicker(()=>{throw new Error('Must not open stale picker');})];})).toEqual([true,false]);
});
