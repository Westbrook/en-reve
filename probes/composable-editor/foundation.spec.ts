import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{await page.goto('/probes/composable-editor/index.html');await page.waitForFunction(()=>!!(window as any).probe);});
test('registered shadow editor forwards focus and captures detached structured snapshots',async({page})=>{
 const field=page.getByRole('textbox',{name:'Structured draft'});await page.evaluate(()=>(window as any).probe.composer.focus());await expect(field).toBeFocused();await field.fill('Hello ');await page.getByRole('button',{name:'Insert reference'}).click();await field.press('Control+Enter');
 const snapshot=await page.evaluate(()=>(window as any).probe.sends[0]);expect(snapshot.value).toContain('@Mira');expect(snapshot.content.runs.find((run:any)=>run.kind==='token').data.entityId).toBe('person-1');
 await field.fill('New draft');expect(await page.evaluate(()=>(window as any).probe.sends[0])).toEqual(snapshot);expect(await page.evaluate(()=>Object.isFrozen((window as any).probe.sends[0].content.runs))).toBe(true);
});
test('adapter availability, IME, validation, canceled sends and ordinary values',async({page})=>{
 const results=await page.evaluate(()=>{const {editor,composer,sends}= (window as any).probe;editor.editable.textContent='Draft';const checks=[];for(const key of ['disabled','readOnly','composing']){editor[key]=true;checks.push(composer.requestSend());editor[key]=false;}editor.valid=false;checks.push(composer.requestSend());editor.valid=true;composer.addEventListener('en-action',(e:Event)=>e.preventDefault(),{once:true});checks.push(composer.requestSend());const fake=document.createElement('div');fake.slot='editor';(fake as any).value='not an editor';editor.replaceWith(fake);return {checks,count:sends.length};});expect(results.checks).toEqual([false,false,false,false,false]);
 expect(await page.evaluate(()=>(window as any).probe.composer.requestSend())).toBe(false);
});
test('replacement registration and callback reentrancy cannot duplicate requests',async({page})=>{
 const results=await page.evaluate(()=>{const {editor,composer,registerChatEditor,sends}=(window as any).probe;const old=registerChatEditor(editor,{value:'old',focus(){},getSnapshot:()=>({value:'old'})});registerChatEditor(editor,{value:'new',focus(){},getSnapshot(){const nested=composer.requestSend();if(nested)throw Error('reentrant send');return {value:'new',content:{version:1}};}});old();const accepted=composer.requestSend();return {accepted,sends};});expect(results.accepted).toBe(true);expect(results.sends).toEqual([{value:'new',content:{version:1}}]);
});
test('snapshot callback replacing the editor aborts an obsolete send',async({page})=>{
 const result=await page.evaluate(()=>{const {editor,composer,registerChatEditor,sends}=(window as any).probe;registerChatEditor(editor,{value:'old',focus(){},getSnapshot(){const next=document.createElement('textarea');next.slot='editor';next.value='new';editor.replaceWith(next);return {value:'old'};}});return {accepted:composer.requestSend(),count:sends.length};});expect(result).toEqual({accepted:false,count:0});
});
test('invalid snapshots release the send guard and registration changes invalidate capture',async({page})=>{
 const result=await page.evaluate(()=>{const {editor,composer,registerChatEditor,sends}=(window as any).probe;
  const valid={value:'safe',focus(){},getSnapshot:()=>({value:'safe'})};
  registerChatEditor(editor,{...valid,getSnapshot:()=>({value:'invalid',content:{date:new Date()}})});
  let invalid=false;try{composer.requestSend();}catch(error){invalid=error instanceof TypeError;}
  registerChatEditor(editor,{...valid,getSnapshot(){registerChatEditor(editor,valid);return {value:'obsolete'};}});
  const stale=composer.requestSend();const accepted=composer.requestSend();return {invalid,stale,accepted,sends};
 });expect(result).toEqual({invalid:true,stale:false,accepted:true,sends:[{value:'safe'}]});
});
test('native-history candidate restores token identity through undo and redo',async({page})=>{
 const field=page.getByRole('textbox',{name:'Structured draft'});await field.fill('Before ');await page.getByRole('button',{name:'Insert reference'}).click();await expect(field).toContainText('@Mira');const before=await page.evaluate(()=>(window as any).probe.editor.snapshot());
 await page.getByRole('button',{name:'Undo insertion'}).click();await expect(field).not.toContainText('@Mira');await page.getByRole('button',{name:'Redo insertion'}).click();await expect(field).toContainText('@Mira');expect(await page.evaluate(()=>(window as any).probe.editor.snapshot())).toEqual(before);
});
test('native-history candidate allows typing after adjacent tokens',async({page})=>{
 await page.getByRole('button',{name:'Insert reference'}).click();await page.getByRole('button',{name:'Insert reference'}).click();const field=page.getByRole('textbox',{name:'Structured draft'});await field.press('x');expect(await field.locator('[data-token]').allTextContents()).toEqual(['@Mira','@Mira']);await expect(field).toContainText('x');
});
