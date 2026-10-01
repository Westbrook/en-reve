import {test,expect,type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const url='/api-examples/rich-text.html';
const host=(page:Page)=>page.locator('#rich-brief');
const box=(page:Page)=>host(page).getByRole('textbox');
const bar=(page:Page)=>page.locator('#brief-toolbar');
const contextual=(page:Page)=>page.locator('#selection-toolbar');
const errors=new WeakMap<Page,string[]>();
test.beforeEach(({page})=>{const list:string[]=[];errors.set(page,list);page.on('pageerror',e=>list.push(e.message));});
test.afterEach(({page})=>expect(errors.get(page)).toEqual([]));
async function load(page:Page){await page.goto(url);await expect(box(page)).toHaveAttribute('contenteditable','true');await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');await page.waitForFunction(()=>document.documentElement.hasAttribute('data-example-standalone'));}
async function select(page:Page,text='Alpha beta',backwards=false){
 // Finish author/viewport setup before the single focus-and-native-selection action.
 await host(page).evaluate((el:any,text)=>{el.value=text;},text);await expect(host(page)).toHaveJSProperty('value',text);await box(page).scrollIntoViewIfNeeded();
 const selected=await box(page).evaluate((el,backwards)=>{
  const root=el.getRootNode() as ShadowRoot,editor=root.host as any;
  editor.focus();
  if(root.activeElement!==el||editor.shadowRoot!==root||!el.isConnected)throw new Error('Public focus must reach the current mounted editor control');
  const node=el.querySelector('p')!.firstChild!,text=node.textContent!,length=text.length;
  const selection=el.ownerDocument.getSelection()!;
  selection.setBaseAndExtent(node,backwards?length:0,node,backwards?0:length);
  const ranges=(selection as any).getComposedRanges({shadowRoots:[root]}) as StaticRange[];
  return {text,length,revision:editor.revision,native:{text:selection.toString(),direction:(selection as any).direction,ranges:ranges.map(range=>({sameStart:range.startContainer===node,sameEnd:range.endContainer===node,start:range.startOffset,end:range.endOffset}))}};
 },backwards);
 expect(selected.native).toEqual({text:selected.text,direction:backwards?'backward':'forward',ranges:[{sameStart:true,sameEnd:true,start:0,end:selected.length}]});
 // Native selection adoption is asynchronous; observe the public model without rewriting it.
 await expect.poll(()=>host(page).evaluate((el:any)=>el.captureRange())).toEqual({coordinate:'structured',from:1,to:selected.length+1,expectedText:selected.text,revision:selected.revision});
 await expect(host(page)).toHaveJSProperty('hasSelection',true);
 await expect(contextual(page).locator('.base')).toBeVisible();
}
test('pointer-selected text keeps its range and shows focus on keyboard toolbar entry',async({page})=>{
 await page.setViewportSize({width:390,height:844});await load(page);
 await host(page).evaluate((editor:any)=>{editor.value='Alpha beta';});await expect(box(page)).toHaveText('Alpha beta');
 const paragraph=box(page).locator('p');await paragraph.scrollIntoViewIfNeeded();
 await paragraph.evaluate(async node=>{await node.ownerDocument.fonts.ready;});
 const point=await paragraph.evaluate(node=>{
  const text=node.firstChild!;const range=node.ownerDocument.createRange();range.setStart(text,0);range.setEnd(text,5);
  const rect=range.getBoundingClientRect();return{x:rect.x+rect.width/2,y:rect.y+rect.height/2};
 });
 const revision=await host(page).evaluate((editor:any)=>editor.revision);
 // Establish pointer modality and a real native word selection before the shortcut.
 await page.mouse.dblclick(point.x,point.y);await expect(box(page)).toBeFocused();
 const before={coordinate:'structured',from:1,to:6,expectedText:'Alpha',revision};
 await expect.poll(()=>host(page).evaluate((editor:any)=>editor.captureRange())).toEqual(before);
 await expect(host(page)).toHaveJSProperty('hasSelection',true);
 await page.keyboard.press('Alt+F10');
 const bold=bar(page).getByRole('button',{name:'Bold',exact:true});await expect(bold).toBeFocused();
 // Observe paint after the focus request settles, before any follow-up key can change modality.
 const paint=await bold.evaluate(node=>{const style=getComputedStyle(node);return{visible:node.matches(':focus-visible'),style:style.outlineStyle,width:parseFloat(style.outlineWidth),color:style.outlineColor};});
 expect(paint.visible).toBe(true);expect(paint.style).toBe('solid');expect(paint.width).toBeGreaterThan(0);
 expect(paint.color).not.toBe('rgba(0, 0, 0, 0)');expect(paint.color).not.toBe('transparent');
 expect(await host(page).evaluate((editor:any)=>editor.captureRange())).toEqual(before);
 await page.keyboard.press('Escape');await expect(box(page)).toBeFocused();
 expect(await host(page).evaluate((editor:any)=>editor.captureRange())).toEqual(before);
});
test('hydrated formatting commands expose one Tab stop before keyboard use',async({page,browserName})=>{
 await load(page);
 const commands=bar(page).getByRole('button');
 await expect.poll(()=>commands.evaluateAll(nodes=>nodes.filter(node=>(node as HTMLButtonElement).tabIndex===0&&!(node as HTMLButtonElement).disabled).length)).toBe(1);
 const bold=bar(page).getByRole('button',{name:'Bold',exact:true});await expect(bold).toHaveAttribute('tabindex','0');
 await bold.focus();await page.keyboard.press(browserName==='webkit'?'Alt+Tab':'Tab');await expect(box(page)).toBeFocused();
});
test('semantic SSR content is readable before hydration and initial formatting survives',async({page,browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false});try{const p=await context.newPage();await p.goto(url);await expect(host(p).getByRole('heading',{name:'A new direction'})).toBeVisible();await expect(host(p).locator('strong')).toHaveText('Make it yours.');await expect(box(p)).not.toHaveAttribute('contenteditable','true');await expect(contextual(p).locator('en-toolbar')).toHaveCount(1);await expect(contextual(p).locator('en-toolbar')).toBeHidden();}finally{await context.close();}
 await load(page);await expect(host(page).getByRole('heading',{name:'A new direction'})).toBeVisible();await expect(host(page).locator('strong')).toHaveText('Make it yours.');
});
test('persistent and contextual commands preserve backward selection and share undo history',async({page})=>{
 await load(page);await select(page,'Alpha beta',true);await contextual(page).getByRole('button',{name:'Bold',exact:true}).click();await expect(host(page).locator('strong')).toHaveText('Alpha beta');
 await bar(page).getByRole('button',{name:'Undo',exact:true}).click();await expect(host(page).locator('strong')).toHaveCount(0);
 await bar(page).getByRole('button',{name:'Redo',exact:true}).click();await expect(host(page).locator('strong')).toHaveText('Alpha beta');
 await bar(page).getByRole('button',{name:'Heading',exact:true}).click();await expect(host(page).getByRole('heading',{name:'Alpha beta'})).toBeVisible();
 await bar(page).getByRole('button',{name:'Paragraph',exact:true}).click();await expect(host(page).locator('p')).toHaveText('Alpha beta');
});
test('link editor retains a bookmark, validates URLs and Escape restores focus',async({page})=>{
 await load(page);await select(page);await bar(page).getByRole('button',{name:'Link',exact:true}).click();await bar(page).getByRole('textbox',{name:'Link URL'}).fill('javascript:alert(1)');await bar(page).getByRole('button',{name:'Apply link'}).click();await expect(bar(page).getByRole('alert')).toBeVisible();
 await bar(page).getByRole('textbox',{name:'Link URL'}).fill('https://example.com/brief');await bar(page).getByRole('button',{name:'Apply link'}).click();await expect(host(page).locator('a')).toHaveAttribute('href','https://example.com/brief');
 await box(page).press('Alt+F10');await expect(bar(page).getByRole('button',{name:'Bold',exact:true})).toBeFocused();await page.keyboard.press('Escape');await expect(box(page)).toBeFocused();
});
test('same providers insert in token, standalone rich and composer; action-only completion and snapshot',async({page})=>{
 await load(page);
 for(const id of ['rich-brief','rich-reply','plain-reply']){
  const editor=page.locator('#'+id);await editor.evaluate((el:any)=>{el.value='';el.focus();});const input=editor.getByRole('textbox');await input.pressSequentially('@Cov');await editor.getByRole('option',{name:'Cover study',exact:true}).waitFor();await input.press('Enter');await expect(editor.locator('[data-token]')).toHaveCount(1);await expect(editor).toHaveJSProperty('value','@Cover study');await expect(editor.locator('[part~=token-content]')).toHaveText('@Cover study');
  await editor.evaluate((el:any)=>{el.value='';el.focus();});await input.pressSequentially('/rev');await editor.getByRole('option',{name:'Review tool',exact:true}).waitFor();await input.press('Enter');await expect(editor.locator('[part~=token-content]')).toHaveText('/review');await expect(editor).toHaveJSProperty('value','/review');
 }
 await page.locator('#rich-reply').evaluate((el:any)=>{el.value='';el.focus();});const reply=page.locator('#rich-reply').getByRole('textbox');await reply.pressSequentially('/out');await reply.press('Enter');await expect(page.getByRole('status',{name:'Editor result'})).toContainText('outline');await expect(page.locator('#rich-reply')).toHaveJSProperty('value','');
 await reply.pressSequentially('Rich message');await page.getByRole('button',{name:'Send message',exact:true}).click();await expect(page.getByRole('status',{name:'Editor result'})).toContainText('Rich message');
});
test('demo action feedback preserves edited brief content and history until explicit reset',async({page})=>{
 await load(page);
 const input=box(page);
 await input.click();await input.press('ControlOrMeta+a');await input.pressSequentially('My edited brief ');
 await expect(host(page)).toHaveJSProperty('value','My edited brief ');
 await input.pressSequentially('/out');
 await host(page).getByRole('option',{name:'Outline action',exact:true}).click();
 await expect(page.getByRole('status',{name:'Editor result'})).toContainText('outline');
 await expect(host(page)).toHaveJSProperty('value','My edited brief ');
 await bar(page).getByRole('button',{name:'Undo',exact:true}).click();
 await expect(host(page)).toHaveJSProperty('value','My edited brief /out');
 await bar(page).getByRole('button',{name:'Redo',exact:true}).click();
 await input.pressSequentially('/rev');await input.press('Enter');
 await expect(host(page)).toHaveJSProperty('value','My edited brief /review');
 const saved=await host(page).evaluate((el:any)=>el.document);
 const reply=page.locator('#rich-reply').getByRole('textbox');
 await reply.click();await reply.pressSequentially('Reply /out');await reply.press('Enter');
 await expect(page.locator('#rich-reply')).toHaveJSProperty('value','Reply ');
 await page.getByRole('button',{name:'Send message',exact:true}).click();
 await expect(page.getByRole('status',{name:'Editor result'})).toContainText('Snapshot ready');
 await expect(host(page)).toHaveJSProperty('document',saved);
 await page.getByRole('button',{name:'Reset brief',exact:true}).click();
 await expect(host(page).getByRole('heading',{name:'A new direction'})).toBeVisible();
});
test('triple-click selects the whole rich document for copy and replacement without changing history',async({page})=>{
 await load(page);
 await host(page).evaluate((el:any)=>{
  el.document={type:'en-rich-text',version:1,doc:{type:'doc',content:[
   {type:'heading',attrs:{level:2},content:[{type:'text',text:'Draft title'}]},
   {type:'paragraph',content:[{type:'text',text:'Select this paragraph '},{type:'token',attrs:{run:{kind:'token',id:'review-token',type:'tool',text:'/review',label:'Review',data:{tool:'review'}}}}]},
   {type:'bullet_list',content:[{type:'list_item',content:[{type:'paragraph',content:[{type:'text',text:'Final list item'}]}]}]},
  ]}};
  el.changeCount=0;el.addEventListener('en-change',()=>el.changeCount++);
 });
 const saved=await host(page).evaluate((el:any)=>el.document);
 const text=await host(page).evaluate((el:any)=>el.value);
 await host(page).locator('.mount p').first().click({clickCount:3,position:{x:25,y:8}});
 await expect(box(page)).toBeFocused();await expect(host(page)).toHaveJSProperty('hasSelection',true);
 await expect(host(page)).toHaveJSProperty('changeCount',0);
 expect(await host(page).evaluate((el:any)=>el.getCommandState('undo').enabled)).toBe(false);
 const copied=await box(page).evaluate(el=>{
  const data=new DataTransfer();const event=new Event('copy',{bubbles:true,composed:true,cancelable:true});
  Object.defineProperty(event,'clipboardData',{value:data});el.dispatchEvent(event);return {text:data.getData('text/plain'),html:data.getData('text/html')};
 });
 expect(copied.text).toBe(text);expect(copied.html).toContain('Draft title');expect(copied.html).toContain('Final list item');
 await box(page).pressSequentially('Replacement');await expect(host(page)).toHaveJSProperty('value','Replacement');
 await bar(page).getByRole('button',{name:'Undo',exact:true}).click();await expect(host(page)).toHaveJSProperty('document',saved);
});
test('triple-click includes offscreen content in readonly drafts; single and double clicks stay local',async({page})=>{
 await load(page);await page.getByRole('button',{name:'Load long drafts',exact:true}).click();
 const paragraph=host(page).locator('.mount p').first();
 await paragraph.dblclick({position:{x:25,y:8}});
 const word=await box(page).evaluate(()=>document.getSelection()?.toString()??'');expect(word.length).toBeGreaterThan(0);expect(word).not.toContain('Paragraph 40');
 // A new pointer position starts a separate click sequence.
 await paragraph.click({position:{x:120,y:8}});await expect(host(page)).toHaveJSProperty('hasSelection',false);
 await host(page).evaluate((el:any)=>el.readOnly=true);
 await expect(box(page)).toHaveAttribute('contenteditable','false');
 await paragraph.click({clickCount:3,position:{x:200,y:8}});
 const selected=await box(page).evaluate(()=>document.getSelection()?.toString()??'');expect(selected).toContain('Paragraph 1:');expect(selected).toContain('Paragraph 40:');
 await expect(host(page).getByRole('listbox')).not.toBeVisible();
});
test('authoritative writes and canceled commits reject stale bookmarks; unsafe documents are rejected',async({page})=>{
 await load(page);await select(page);
 const result=await host(page).evaluate((el:any)=>{
  const bookmark=el.captureBookmark();el.value='Author replacement';const stale=el.execute('bold',undefined,bookmark);
  el.addEventListener('en-change',(event:Event)=>event.preventDefault(),{once:true});const cancel=el.execute('heading');const afterCancel=el.document;
  el.addEventListener('en-change',()=>{el.value='Latest author';},{once:true});el.execute('heading');
  let unsafe=false;try{el.document={type:'en-rich-text',version:1,doc:{type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'bad',marks:[{type:'link',attrs:{href:'javascript:alert(1)'}}]}]}]}};}catch{unsafe=true;}
  return {stale,cancel,afterCancel,final:el.value,unsafe};
 });
 expect(result.stale).toBe(false);expect(result.cancel).toBe(false);expect(result.afterCancel.doc.content[0].type).toBe('paragraph');expect(result.final).toBe('Latest author');expect(result.unsafe).toBe(true);
});
test('late async providers cannot overwrite new input or author content',async({page})=>{
 await load(page);await host(page).evaluate((el:any)=>{el.value='';el.registerExtension({id:'async',trigger:'!',label:'Delayed',provide:({signal}:any)=>new Promise(resolve=>{el.finish=()=>resolve([{id:'old',label:'Old',insert:[{kind:'text',text:'wrong'}]}]);el.signal=signal;})});el.focus();});
 await box(page).pressSequentially('!');await expect(host(page).getByRole('status')).toContainText('Loading');await host(page).evaluate((el:any)=>{el.value='New author content';el.finish();});await expect(host(page)).toHaveJSProperty('value','New author content');await expect(host(page).getByRole('option')).toHaveCount(0);expect(await host(page).evaluate((el:any)=>el.signal.aborted)).toBe(true);
});
test('readonly, disabled, composition guards and disconnect clean up editor state',async({page})=>{
 await load(page);await host(page).evaluate((el:any)=>el.readOnly=true);await expect(box(page)).toHaveAttribute('contenteditable','false');expect(await host(page).evaluate((el:any)=>el.execute('heading'))).toBe(false);
 await host(page).evaluate((el:any)=>{el.readOnly=false;el.disabled=true;});await expect(box(page)).toHaveAttribute('tabindex','-1');
 await host(page).evaluate((el:any)=>{el.disabled=false;el.value='Before';el.focus();});await box(page).dispatchEvent('compositionstart');expect(await host(page).evaluate((el:any)=>el.execute('bold'))).toBe(false);await host(page).evaluate((el:any)=>el.value='After IME');await box(page).dispatchEvent('compositionend');await expect(host(page)).toHaveJSProperty('value','After IME');
 await host(page).evaluate(el=>{const parent=el.parentNode!,next=el.nextSibling;el.remove();parent.insertBefore(el,next);});await expect(box(page)).toHaveText('After IME');
});
test('mobile contextual docking stays in viewport across themes; accessibility baseline',async({page})=>{
 await page.setViewportSize({width:390,height:844});await load(page);await select(page,'Mobile selection');await expect(contextual(page).locator('.base')).toHaveAttribute('data-placement','docked');
 const theme=page.getByRole('combobox',{name:'Inspired theme'});
 for(const value of ['holotable-inspired','shadcn-inspired','astryx-inspired','fluent-inspired','spectrum-inspired']){
  await theme.selectOption(value);await expect(page.getByRole('status',{name:'Theme result'})).not.toBeEmpty();await box(page).focus();await select(page,'Mobile selection');
  const bounds=await contextual(page).locator('.base').boundingBox();expect(bounds!.x).toBeGreaterThanOrEqual(0);expect(bounds!.x+bounds!.width).toBeLessThanOrEqual(391);
 }
 await page.locator('[data-rich-text-demo]').screenshot({path:test.info().outputPath(`en-rich-mobile-${test.info().project.name}.png`)});
 expect((await new AxeBuilder({page}).include('[data-rich-text-demo]').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
});
test('lists and multi-paragraph selection format without losing semantic content',async({page})=>{
 await load(page);await select(page,'First\nSecond');await box(page).press('ControlOrMeta+a');await bar(page).getByRole('button',{name:'Bullet list'}).click();await expect(host(page).locator('ul li')).toHaveCount(2);await expect(host(page)).toHaveJSProperty('value','First\nSecond');
 await bar(page).getByRole('button',{name:'Undo',exact:true}).click();await expect(host(page).locator('ul')).toHaveCount(0);
});
test('interactive tokens reopen by keyboard and adjacent deletion; Escape retains literal trigger text',async({page})=>{
 await load(page);await host(page).evaluate((el:any)=>{el.value='';el.focus();});await box(page).pressSequentially('@Cov');await box(page).press('Enter');
 const token=host(page).getByRole('button',{name:'Cover study',exact:true});await token.focus();await token.press('Enter');await expect(host(page).getByRole('listbox',{name:'Project references'})).toBeVisible();await box(page).press('Escape');await expect(host(page).getByRole('listbox')).not.toBeVisible();
 await host(page).evaluate((el:any)=>{el.value='';el.focus();});await box(page).pressSequentially('@Al');await box(page).press('Escape');await expect(host(page)).toHaveJSProperty('value','@Al');await expect(host(page).getByRole('listbox')).not.toBeVisible();
});
test('contextual Escape stays dismissed, stale link target closes, declaration retargets between backends',async({page})=>{
 await load(page);await select(page);await contextual(page).getByRole('button',{name:'Bold',exact:true}).focus();await page.keyboard.press('Escape');await expect(box(page)).toBeFocused();await expect(contextual(page).locator('.base')).not.toBeVisible();
 await bar(page).getByRole('button',{name:'Link',exact:true}).click();await expect(bar(page).getByRole('textbox',{name:'Link URL'})).toBeVisible();await host(page).evaluate((el:any)=>el.value='New draft');await expect(bar(page).getByRole('textbox',{name:'Link URL'})).not.toBeVisible();
 await page.evaluate(async()=>{
  // The same registered definition is already loaded by the existing token-editor examples.
  const trigger=document.createElement('en-editor-trigger') as any;
  trigger.id='shared-trigger';trigger.for='rich-brief';trigger.extension={id:'declared',trigger:'!',label:'Declared provider',provide:()=>[{id:'choice',label:'Shared choice',insert:[{kind:'text',text:'shared'}]}]};document.querySelector('[data-rich-text-demo]')!.append(trigger);
 });
 // Explicitly load the public definition through the example's registration closure.
 await expect(page.locator('#shared-trigger')).toHaveJSProperty('hasUpdated',true);
 await host(page).evaluate((el:any)=>{el.value='';el.focus();});await box(page).pressSequentially('!');await expect(host(page).getByRole('option',{name:'Shared choice'})).toBeVisible();
 await page.locator('#shared-trigger').evaluate((el:any)=>el.for='plain-reply');await expect(host(page).getByRole('listbox')).not.toBeVisible();
 const comparison=page.locator('#plain-reply');await comparison.evaluate((el:any)=>{el.value='';el.focus();});await comparison.getByRole('textbox').pressSequentially('!');await expect(comparison.getByRole('option',{name:'Shared choice'})).toBeVisible();
});
test('external paste sanitizes supported formatting and formatted-token history uses one transaction stream',async({page})=>{
 await load(page);await select(page,'Emphasis');await bar(page).getByRole('button',{name:'Italic',exact:true}).click();await box(page).press('ArrowRight');await box(page).pressSequentially(' @Cov');await box(page).press('Enter');await expect(host(page).locator('[data-token]')).toHaveCount(1);
 await bar(page).getByRole('button',{name:'Undo',exact:true}).click();await expect(host(page).locator('[data-token]')).toHaveCount(0);await expect(host(page).locator('em')).not.toHaveCount(0);
 await host(page).evaluate((el:any)=>{el.value='';el.focus();});await box(page).evaluate(el=>{const data=new DataTransfer();data.setData('text/plain','Safe text');data.setData('text/html','<img src=x onerror=alert(1)><b>Injected</b>');const event=new Event('paste',{bubbles:true,cancelable:true,composed:true});Object.defineProperty(event,'clipboardData',{value:data});el.dispatchEvent(event);});await expect(host(page)).toHaveJSProperty('value','Injected');await expect(host(page).locator('img')).toHaveCount(0);await expect(host(page).locator('strong')).toHaveText('Injected');
});

test('contextual link editing dismisses on outside interaction or cleared selection without restoring it',async({page})=>{
 await load(page);
 for(const placement of ['floating','docked']){
  await contextual(page).evaluate((el:any,placement)=>el.placement=placement,placement);
  await select(page);await contextual(page).getByRole('button',{name:'Link',exact:true}).click();
  await contextual(page).getByRole('textbox',{name:'Link URL'}).fill('https://example.com/cancelled');
  // Non-focusable content must dismiss even when the browser retains input focus.
  await page.getByRole('heading',{name:'Project brief',exact:true}).click();
  await expect(contextual(page).locator('.base')).not.toBeVisible();
  await expect(host(page).locator('a')).toHaveCount(0);
  await select(page,'Fresh selection');
  await expect(contextual(page).getByRole('textbox',{name:'Link URL'})).toHaveCount(0);
  await contextual(page).getByRole('button',{name:'Link',exact:true}).click();
  await box(page).click();
  await expect(contextual(page).locator('.base')).not.toBeVisible();
  await expect(host(page)).toHaveJSProperty('hasSelection',false);
  await expect(box(page)).toBeFocused();
  await select(page,'Keyboard selection');await contextual(page).getByRole('button',{name:'Link',exact:true}).click();
  await box(page).press('ArrowRight');
  await expect(contextual(page).locator('.base')).not.toBeVisible();
  await expect(host(page)).toHaveJSProperty('hasSelection',false);
  await select(page,'Leave the toolbar');await contextual(page).getByRole('button',{name:'Link',exact:true}).click();
  await page.getByRole('button',{name:'Reset brief',exact:true}).focus();
  await expect(contextual(page).locator('.base')).not.toBeVisible();
  // Using the URL field and Apply must retain the editor bookmark.
  await select(page,'Apply this link');await contextual(page).getByRole('button',{name:'Link',exact:true}).click();
  await contextual(page).getByRole('textbox',{name:'Link URL'}).fill('https://example.com/applied');
  await contextual(page).getByRole('button',{name:'Apply link'}).click();
  await expect(host(page).locator('a')).toHaveText('Apply this link');
  await expect(host(page).locator('a')).toHaveAttribute('href','https://example.com/applied');
 }
});


test('contextual link validation preserves the draft and document before a corrected Apply',async({page})=>{
 await page.setViewportSize({width:390,height:844});await load(page);
 for(const placement of ['floating','docked']){
  await contextual(page).evaluate((toolbar:any,placement)=>toolbar.placement=placement,placement);
  await select(page,'Link target');
  await expect(contextual(page).locator('.base')).toHaveAttribute('data-placement',placement);
  const before=await host(page).evaluate((editor:any)=>({document:editor.document,range:editor.captureRange()}));
  await contextual(page).getByRole('button',{name:'Link',exact:true}).click();
  const field=contextual(page).getByRole('textbox',{name:'Link URL'});
  await field.fill('ftp://example.com');
  await contextual(page).getByRole('button',{name:'Apply link',exact:true}).click();
  await expect(contextual(page).getByRole('alert')).toBeVisible();
  await expect(field).toBeVisible();await expect(field).toHaveValue('ftp://example.com');
  expect(await host(page).evaluate((editor:any)=>({document:editor.document,range:editor.captureRange()}))).toEqual(before);
  await expect(host(page).locator('a')).toHaveCount(0);
  await field.fill('https://example.com/brief');
  await contextual(page).getByRole('button',{name:'Apply link',exact:true}).click();
  await expect(host(page).locator('a')).toHaveText('Link target');
  await expect(host(page).locator('a')).toHaveAttribute('href','https://example.com/brief');
  await expect(host(page)).toHaveJSProperty('value','Link target');
  await expect(field).toHaveCount(0);await expect(contextual(page).getByRole('alert')).toHaveCount(0);
 }
});

test('contextual link Cancel discards the draft and restores the backward selection',async({page})=>{
 await page.setViewportSize({width:390,height:844});await load(page);
 for(const placement of ['floating','docked']){
  await contextual(page).evaluate((toolbar:any,placement)=>toolbar.placement=placement,placement);
  await select(page,'Keep this selection',true);
  await expect(contextual(page).locator('.base')).toHaveAttribute('data-placement',placement);
  const before=await host(page).evaluate((editor:any)=>({document:editor.document,range:editor.captureRange()}));
  await contextual(page).getByRole('button',{name:'Link',exact:true}).click();
  const field=contextual(page).getByRole('textbox',{name:'Link URL'});
  await field.fill('https://example.com/discarded');
  await contextual(page).getByRole('button',{name:'Cancel',exact:true}).click();
  await expect(box(page)).toBeFocused();await expect(contextual(page).locator('.base')).not.toBeVisible();
  await expect(field).toHaveCount(0);await expect(host(page).locator('a')).toHaveCount(0);
  expect(await host(page).evaluate((editor:any)=>({document:editor.document,range:editor.captureRange()}))).toEqual(before);
  const selection=await box(page).evaluate(control=>{const selected=control.ownerDocument.getSelection();return{text:selected?.toString(),direction:(selected as any)?.direction};});
  expect(selection).toEqual({text:'Keep this selection',direction:'backward'});
 }
});

test('contextual controls preserve the editor and retain controls and link drafts across presentation updates',async({page})=>{
 await load(page);
 await expect(contextual(page).locator('en-toolbar')).toHaveCount(1);
 await expect(contextual(page).locator('.base')).not.toBeVisible();
 await expect(bar(page).getByRole('button',{name:'Bold',exact:true})).toBeVisible();
 await host(page).evaluate((editor:any)=>editor.deliveryControl=editor.shadowRoot.querySelector('[contenteditable=true]'));
 await select(page,'Selected passage',true);
 await expect(contextual(page).getByRole('button',{name:'Bold',exact:true})).toBeVisible();
 expect(await host(page).evaluate((editor:any)=>editor.deliveryControl===editor.shadowRoot.querySelector('[contenteditable=true]'))).toBe(true);
 await contextual(page).evaluate((toolbar:any)=>toolbar.deliveryControls=toolbar.shadowRoot.querySelector('en-toolbar'));
 await contextual(page).getByRole('button',{name:'Link',exact:true}).click();
 const field=contextual(page).getByRole('textbox',{name:'Link URL'});
 await field.fill('https://example.com/draft');
 await contextual(page).evaluate(async(toolbar:any)=>{
  toolbar.deliveryField=toolbar.shadowRoot.querySelector('en-text-field');
  toolbar.placement='docked';await toolbar.updateComplete;
  toolbar.placement='floating';await toolbar.updateComplete;
 });
 await expect(field).toHaveValue('https://example.com/draft');
 expect(await contextual(page).evaluate((toolbar:any)=>toolbar.deliveryField===toolbar.shadowRoot.querySelector('en-text-field'))).toBe(true);
 await field.press('Escape');await expect(box(page)).toBeFocused();
 await expect(contextual(page).locator('.base')).not.toBeVisible();
 await expect(contextual(page).locator('en-toolbar')).toHaveCount(1);
 await select(page,'Fresh selection');
 expect(await contextual(page).evaluate((toolbar:any)=>toolbar.deliveryControls===toolbar.shadowRoot.querySelector('en-toolbar'))).toBe(true);
 await expect(contextual(page).getByRole('textbox',{name:'Link URL'})).toHaveCount(0);
 await contextual(page).getByRole('button',{name:'Bold',exact:true}).click();
 await expect(host(page).locator('strong')).toHaveText('Fresh selection');
});

test('persistent controls remain visible while eager contextual siblings follow their own editor selection',async({page})=>{
 await load(page);
 await page.evaluate(async()=>{
  const parent=document.querySelector('[data-rich-text-demo]')!;
  for(const [id,mode] of [['delivery-eager','contextual'],['delivery-persistent','persistent'],['delivery-sibling','contextual']]){
   const toolbar:any=document.createElement('en-editor-toolbar');toolbar.id=id;toolbar.mode=mode;
   toolbar.editor=document.querySelector('#rich-reply');parent.append(toolbar);await toolbar.updateComplete;
  }
 });
 await expect(page.locator('#delivery-eager en-toolbar')).toHaveCount(1);
 await expect(page.locator('#delivery-persistent en-toolbar')).toHaveCount(1);
 await expect(page.locator('#delivery-persistent .base')).toBeVisible();
 await expect(page.locator('#delivery-sibling en-toolbar')).toHaveCount(1);
 await expect(page.locator('#delivery-sibling .base')).not.toBeVisible();
 await page.locator('#delivery-eager').evaluate(async(toolbar:any)=>{toolbar.deliveryControls=toolbar.shadowRoot.querySelector('en-toolbar');toolbar.label='Reply formatting';await toolbar.updateComplete;});
 expect(await page.locator('#delivery-eager').evaluate((toolbar:any)=>toolbar.deliveryControls===toolbar.shadowRoot.querySelector('en-toolbar'))).toBe(true);
 await select(page);
 await expect(contextual(page).locator('en-toolbar')).toHaveCount(1);
 await expect(page.locator('#delivery-sibling en-toolbar')).toHaveCount(1);
 await expect(page.locator('#delivery-sibling .base')).not.toBeVisible();
 await page.locator('#delivery-sibling').evaluate(async(toolbar:any)=>{toolbar.mode='persistent';await toolbar.updateComplete;});
 await expect(page.locator('#delivery-sibling en-toolbar')).toHaveCount(1);
 await expect(page.locator('#delivery-sibling .base')).toBeVisible();
});

test('contextual toolbar retains authored controls and releases stale link ownership on retarget and reconnect',async({page})=>{
 await load(page);
 await contextual(page).evaluate((toolbar:any)=>{
  const custom=document.createElement('button');custom.textContent='Custom formatting';custom.dataset.deliveryCustom='';
  toolbar.append(custom);toolbar.deliveryCustom=custom;
 });
 await expect(contextual(page).locator('en-toolbar')).toHaveCount(1);
 await expect(contextual(page).locator('.base')).not.toBeVisible();
 expect(await contextual(page).evaluate((toolbar:any)=>toolbar.querySelector('[data-delivery-custom]')===toolbar.deliveryCustom)).toBe(true);
 await select(page);
 await expect(contextual(page).getByRole('button',{name:'Custom formatting',exact:true})).toBeVisible();
 await expect(contextual(page).locator('en-toolbar')).not.toBeVisible();
 expect(await contextual(page).evaluate((toolbar:any)=>toolbar.shadowRoot.querySelector('slot').assignedElements()[0]===toolbar.deliveryCustom)).toBe(true);
 await contextual(page).evaluate((toolbar:any)=>toolbar.deliveryCustom.remove());
 await select(page);
 await contextual(page).getByRole('button',{name:'Link',exact:true}).click();
 await contextual(page).getByRole('textbox',{name:'Link URL'}).fill('https://example.com/stale');
 await contextual(page).evaluate(async(toolbar:any)=>{toolbar.for='rich-reply';await toolbar.updateComplete;});
 await expect(contextual(page).getByRole('textbox',{name:'Link URL'})).toHaveCount(0);
 await expect(contextual(page).locator('.base')).not.toBeVisible();
 await expect(host(page).locator('a')).toHaveCount(0);
 await contextual(page).evaluate((toolbar:any)=>{const parent=toolbar.parentNode,next=toolbar.nextSibling;toolbar.remove();toolbar.for='rich-brief';parent.insertBefore(toolbar,next);});
 await expect(contextual(page).getByRole('textbox',{name:'Link URL'})).toHaveCount(0);
 await select(page,'Current passage');
 await contextual(page).getByRole('button',{name:'Link',exact:true}).click();
 await contextual(page).getByRole('textbox',{name:'Link URL'}).fill('https://example.com/current');
 await contextual(page).getByRole('button',{name:'Apply link',exact:true}).click();
 await expect(host(page).locator('a')).toHaveText('Current passage');
 await expect(host(page).locator('a')).toHaveAttribute('href','https://example.com/current');
});
