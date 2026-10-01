import {test,expect} from '@playwright/test';
test('public decorations preserve selection and multiple accepted passages are one undo transaction',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));await page.goto('/probes/rich-ranges/fixture.html');
 const editor=page.locator('en-rich-text-editor');await expect(editor.getByRole('textbox')).toHaveAttribute('contenteditable','true');
 const results=await editor.evaluate((el:any)=>{
  el.value='Alpha beta gamma';el.focus();const bookmark=el.captureBookmark();const selection=el.selectionKey;const revision=el.revision;
  const first={coordinate:'text',from:0,to:5,expectedText:'Alpha',revision},last={coordinate:'text',from:11,to:16,expectedText:'gamma',revision};
  const decorated=el.decorateRanges([{id:'first',range:first},{id:'last',range:last}]);const selected=el.selectionKey===selection;
  const overlap=el.replaceRanges([{range:first,runs:[{kind:'text',text:'bad'}]},{range:first,runs:[{kind:'text',text:'bad'}]}]);
  const replaced=el.replaceRanges([{range:first,runs:[{kind:'text',text:'One'}]},{range:last,runs:[{kind:'text',text:'three'}]}]);const value=el.value;const stale=el.replaceRanges([{range:first,runs:[{kind:'text',text:'bad'}]}]);const staleBookmark=el.restoreBookmark(bookmark);const undo=el.undo();const original=el.value;const redo=el.redo();
  return {decorated,selected,overlap,replaced,value,stale,staleBookmark,undo,original,redo,final:el.value};
 });
 expect(results).toEqual({decorated:true,selected:true,overlap:false,replaced:true,value:'One beta three',stale:false,staleBookmark:false,undo:true,original:'Alpha beta gamma',redo:true,final:'One beta three'});expect(errors).toEqual([]);
});
test('cancelled change leaves content/history intact and formatting survives replacement',async({page})=>{
 await page.goto('/probes/rich-ranges/fixture.html');const editor=page.locator('en-rich-text-editor');await expect(editor.getByRole('textbox')).toHaveAttribute('contenteditable','true');
 const result=await editor.evaluate((el:any)=>{
  el.document={type:'en-rich-text',version:1,doc:{type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'Alpha beta',marks:[{type:'strong'}]}]}]}};
  const range={coordinate:'text',from:0,to:5,expectedText:'Alpha',revision:el.revision};const cancel=(event:Event)=>event.preventDefault();el.addEventListener('en-change',cancel);const cancelled=el.replaceRanges([{range,runs:[{kind:'text',text:'One'}]}]);const before=el.value;el.removeEventListener('en-change',cancel);const accepted=el.replaceRanges([{range,runs:[{kind:'text',text:'One'}]}]);return {cancelled,before,accepted,marks:el.document.doc.content[0].content[0].marks};
 });expect(result).toEqual({cancelled:false,before:'Alpha beta',accepted:true,marks:[{type:'strong'}]});
});

test('whole-document keyboard selection captures the structural endpoints',async({page})=>{
 await page.goto('/probes/rich-ranges/fixture.html');const editor=page.locator('en-rich-text-editor');await expect(editor.getByRole('textbox')).toHaveAttribute('contenteditable','true');
 await editor.evaluate((el:any)=>{el.value='Alpha\nBeta';el.focus();});await editor.getByRole('textbox').press('ControlOrMeta+a');
 expect(await editor.evaluate((el:any)=>el.captureRange())).toMatchObject({coordinate:'structured',from:0,to:13,expectedText:'Alpha\nBeta'});
});
test('replacement at plain-to-bold boundary inherits selected text marks',async({page})=>{
 await page.goto('/probes/rich-ranges/fixture.html');const editor=page.locator('en-rich-text-editor');await expect(editor.getByRole('textbox')).toHaveAttribute('contenteditable','true');
 const result=await editor.evaluate((el:any)=>{el.document={type:'en-rich-text',version:1,doc:{type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'Plain '},{type:'text',text:'Bold',marks:[{type:'strong'}]}]}]}};const ok=el.replaceRanges([{range:{coordinate:'text',from:6,to:10,expectedText:'Bold',revision:el.revision},runs:[{kind:'text',text:'New'}]}]);return {ok,content:el.document.doc.content[0].content};});
 expect(result).toEqual({ok:true,content:[{type:'text',text:'Plain '},{type:'text',text:'New',marks:[{type:'strong'}]}]});
});

test('public caret, structured/text coordinates, boundaries and stale revisions',async({page})=>{
 await page.goto('/probes/rich-ranges/fixture.html');const editor=page.locator('en-rich-text-editor');await expect(editor.getByRole('textbox')).toHaveAttribute('contenteditable','true');
 const result=await editor.evaluate((el:any)=>{
  el.value='A👩🏽‍💻e\u0301\nBeta';el.focus();const caret=el.captureRange();const make=(from:number,to:number,expectedText:string,coordinate='text')=>({from,to,expectedText,coordinate,revision:el.revision});
  const checks=[el.validateRange(make(0,1,'A')),el.validateRange(make(1,8,'👩🏽‍💻')),el.validateRange(make(2,8,'x')),el.validateRange(make(8,9,'e')),el.validateRange(make(-1,1,'A')),el.validateRange(make(0,100,'A')),el.validateRange(make(0,1,'wrong')),el.validateRange(make(0,0,'')),el.validateRange(make(15,15,'')),el.validateRange(make(10,11,'\n'))];
  el.document={type:'en-rich-text',version:1,doc:{type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'Hi '},{type:'token',attrs:{run:{kind:'token',id:'one',type:'ref',text:'@Name',label:'Name',data:null}}},{type:'text',text:'!'}]}]}};
  const tokens=[el.validateRange(make(3,8,'@Name')),el.validateRange(make(4,8,'Name')),el.validateRange(make(3,3,'')),el.validateRange(make(8,8,'')),el.validateRange(make(0,9,'Hi @Name!'))];
  const stale=make(0,2,'Hi');el.value=el.value;return {caret,checks,tokens,stale:el.validateRange(stale)};
 });
 expect(result.caret).toMatchObject({from:1,to:1,expectedText:'',coordinate:'structured'});
 expect(result.checks).toEqual([true,true,false,false,false,false,false,true,true,true]);expect(result.tokens).toEqual([true,false,true,true,true]);expect(result.stale).toBe(false);
});
test('decorations preserve focus, mapped selection, revision and real undo/redo history',async({page})=>{
 await page.goto('/probes/rich-ranges/fixture.html');const editor=page.locator('en-rich-text-editor');await expect(editor.getByRole('textbox')).toHaveAttribute('contenteditable','true');
 await editor.evaluate((el:any)=>{el.value='Alpha beta';el.focus();});await editor.getByRole('textbox').press('ControlOrMeta+a');await editor.getByRole('textbox').press('ArrowRight');
 await expect.poll(()=>editor.evaluate((el:any)=>el.captureRange()?.from)).toBe(11);
 const result=await editor.evaluate((el:any)=>{
  const revision=el.revision,selection=el.captureRange(),range={coordinate:'text',from:0,to:5,expectedText:'Alpha',revision};
  const undoBefore=el.getCommandState('undo').enabled;el.decorateRanges([{id:'review',range}]);const highlighted=el.shadowRoot.querySelectorAll('[data-range-id]').length;
  const unchanged=el.revision===revision&&JSON.stringify(el.captureRange())===JSON.stringify(selection)&&el.shadowRoot.activeElement?.getAttribute('role')==='textbox'&&el.getCommandState('undo').enabled===undoBefore;
  el.clearRangeDecorations();const cleared=!el.shadowRoot.querySelector('[data-range-id]');el.decorateRanges([{id:'review',range}]);el.replaceRanges([{range,runs:[{kind:'text',text:'A'}]}]);const mapped=el.captureRange();const inactive=!el.shadowRoot.querySelector('[data-range-id]');
  const undo=el.undo(),original=el.value,secondUndo=el.undo(),redo=el.redo();return {highlighted,unchanged,cleared,inactive,mapped,undo,original,secondUndo,redo,value:el.value};
 });expect(result).toMatchObject({highlighted:1,unchanged:true,cleared:true,inactive:true,mapped:{from:7,to:7},undo:true,original:'Alpha beta',secondUndo:false,redo:true,value:'A beta'});
});
test('cancelled and invalid final-document replacements preserve an existing redo branch',async({page})=>{
 await page.goto('/probes/rich-ranges/fixture.html');const editor=page.locator('en-rich-text-editor');await expect(editor.getByRole('textbox')).toHaveAttribute('contenteditable','true');
 const result=await editor.evaluate((el:any)=>{
  el.value='Alpha';const range=()=>({coordinate:'text',from:0,to:5,expectedText:'Alpha',revision:el.revision});el.replaceRanges([{range:range(),runs:[{kind:'text',text:'Beta'}]}]);el.undo();
  const before=JSON.stringify(el.document),revision=el.revision;const cancel=(e:Event)=>e.preventDefault();el.addEventListener('en-change',cancel);const cancelled=el.replaceRanges([{range:range(),runs:[{kind:'text',text:'No'}]}]);el.removeEventListener('en-change',cancel);
  const token={kind:'token',id:'same',type:'ref',text:'@R',label:'R',data:null};const invalid=el.replaceRanges([{range:{...range(),to:1,expectedText:'A'},runs:[token]},{range:{...range(),from:4,expectedText:'a'},runs:[token]}]);
  const unchanged=before===JSON.stringify(el.document)&&revision===el.revision;const undo=el.undo(),redo=el.redo();return {cancelled,invalid,unchanged,undo,redo,value:el.value};
 });expect(result).toEqual({cancelled:false,invalid:false,unchanged:true,undo:false,redo:true,value:'Beta'});
});
test('editability, composition and mark-boundary policy',async({page})=>{
 await page.goto('/probes/rich-ranges/fixture.html');const editor=page.locator('en-rich-text-editor');await expect(editor.getByRole('textbox')).toHaveAttribute('contenteditable','true');
 const result=await editor.evaluate((el:any)=>{
  el.value='Alpha';const replace=()=>el.replaceRanges([{range:{coordinate:'text',from:0,to:5,expectedText:'Alpha',revision:el.revision},runs:[{kind:'text',text:'No'}]}]);el.disabled=true;const disabled=replace();el.disabled=false;el.readOnly=true;const readOnly=replace();el.readOnly=false;
  el.shadowRoot.querySelector('[role=textbox]').dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}));const composition=replace(),capture=el.captureRange();el.shadowRoot.querySelector('[role=textbox]').dispatchEvent(new CompositionEvent('compositionend',{bubbles:true}));
  const results=[];for(const [from,to] of [[0,6],[4,7],[2,5],[4,4]]){el.document={type:'en-rich-text',version:1,doc:{type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'Bold',marks:[{type:'strong'}]},{type:'text',text:' plain'}]}]}};const expectedText=el.value.slice(from,to);el.replaceRanges([{range:{coordinate:'text',from,to,expectedText,revision:el.revision},runs:[{kind:'text',text:'X'}]}]);results.push(el.document.doc.content[0].content.find((n:any)=>n.text.includes('X')).marks??[]);}
  return {disabled,readOnly,composition,capture,results};
 });expect(result).toEqual({disabled:false,readOnly:false,composition:false,capture:undefined,results:[[{type:'strong'}],[],[{type:'strong'}],[{type:'strong'}]]});
});
test('whole-document ranges replace structured blocks and whole tokens as one transaction',async({page})=>{
 await page.goto('/probes/rich-ranges/fixture.html');const editor=page.locator('en-rich-text-editor');await expect(editor.getByRole('textbox')).toHaveAttribute('contenteditable','true');
 await editor.evaluate((el:any)=>{el.document={type:'en-rich-text',version:1,doc:{type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'Alpha'}]},{type:'paragraph',content:[{type:'token',attrs:{run:{kind:'token',id:'t',type:'ref',text:'@R',label:'R',data:null}}}]}]}};el.focus();});await editor.getByRole('textbox').press('ControlOrMeta+a');
 expect(await editor.evaluate((el:any)=>{const range=el.captureRange();const replaced=el.replaceRanges([{range,runs:[{kind:'text',text:'New'}]}]);const value=el.value;const undo=el.undo();return {expected:range?.expectedText,replaced,value,undo,original:el.value};})).toEqual({expected:'Alpha\n@R',replaced:true,value:'New',undo:true,original:'Alpha\n@R'});
});
