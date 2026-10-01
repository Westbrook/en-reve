import {test,expect} from '@playwright/test';

for(const id of ['rich-brief','plain-reply'])test(`${id} suggestions track their trigger in long scrolled drafts`,async({page})=>{
 await page.goto('/api-examples/rich-text.html?progress-report');
 await page.waitForFunction(()=>!!customElements.get('en-rich-text-editor')&&!!customElements.get('en-token-editor'));
 const host=page.locator('#'+id),input=host.getByRole('textbox');await expect(input).toHaveAttribute('contenteditable','true');
 await host.evaluate(async(el:any)=>{await el.updateComplete;el.value=Array.from({length:40},(_,i)=>`Line ${i+1} project notes for the draft.`).join('\n');el.style.setProperty('--en-editor-max-size','18rem');el.focus();});
 await input.scrollIntoViewIfNeeded();
 await input.evaluate(async el=>{
  const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let node:Node|null;
  while(node=walker.nextNode()){const text=node.textContent??'',start=text.indexOf('Line 36 project notes for the draft.');if(start<0)continue;const range=document.createRange();range.setStart(node,start+'Line 36 project notes for the draft.'.length);range.collapse(true);document.getSelection()!.setBaseAndExtent(node,range.startOffset,node,range.startOffset);document.dispatchEvent(new Event('selectionchange'));const rect=range.getBoundingClientRect(),box=el.getBoundingClientRect();el.scrollTop+=rect.top-box.top-el.clientHeight/2;break;}
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 });
 await input.pressSequentially(' @Cov');
 expect(await host.evaluate((el:any)=>el.value)).toContain('Line 36 project notes for the draft. @Cov');
 const popup=host.getByRole('listbox',{name:'Project references'});await expect(host.getByRole('option',{name:'Cover study',exact:true})).toBeVisible();
 const geometry=()=>host.evaluate((el:any)=>{
  const input=el.shadowRoot.querySelector('[contenteditable=true]'),popup=el.shadowRoot.querySelector('.popup');
  const session=el.session;const caret=(el.pickerRect?el.pickerRect(session):el.pickerAnchorRect(session));
  const box=popup.getBoundingClientRect(),editor=input.getBoundingClientRect();return {gap:Math.min(Math.abs(box.top-caret.bottom),Math.abs(box.bottom-caret.top)),popup:{x:box.x,y:box.y,width:box.width,height:box.height},editor:{height:editor.height,y:editor.y},scroll:input.scrollTop};
 });
 await expect.poll(async()=> (await geometry()).gap).toBeLessThan(7);
 const before=await geometry();expect(before.scroll).toBeGreaterThan(0);
 await input.evaluate(el=>el.scrollTop-=20);
 await expect.poll(async()=>Math.abs((await geometry()).popup.y-before.popup.y)).toBeGreaterThan(10);
 expect((await geometry()).editor.height).toBeCloseTo(before.editor.height,1);
 await page.setViewportSize({width:390,height:844});
 await host.evaluate((el:any)=>{el.dir='rtl';el.style.inlineSize='100%';});
 await expect.poll(async()=>{const b=await popup.boundingBox();return !!b&&b.x>=0&&b.x+b.width<=391;}).toBe(true);
 await input.press('Escape');await expect(popup).not.toBeVisible();
 expect(await host.evaluate((el:any)=>el.value)).toContain('@Cov');
});

for(const tag of ['en-rich-text-editor','en-token-editor'])for(const trigger of ['@','/'])test(`${tag} ${trigger} anchors at the glyph through typing, wrapping and scrolling`,async({page})=>{
 await page.setViewportSize({width:1280,height:900});
 await page.goto('/api-examples/rich-text.html?progress-report');
 await page.waitForFunction(tag=>!!customElements.get(tag),tag);
 await page.evaluate(async({tag,trigger})=>{
  const fixture=document.createElement('div');fixture.style.cssText='position:fixed;inset:120px auto auto 200px;width:480px;z-index:1000;background:Canvas';
  const editor:any=document.createElement(tag);editor.id='geometry-fixture';fixture.append(editor);document.body.append(fixture);await editor.updateComplete;
  editor.registerExtension({id:'geometry',trigger,label:'Geometry choices',provide:()=>[{id:'result',label:'Insert result',insert:[{kind:'text',text:'RESULT'}]}]});
  editor.value='Draft notes for planning ';await editor.updateComplete;
 },{tag,trigger});
 const host=page.locator('#geometry-fixture'),input=host.getByRole('textbox'),popup=host.getByRole('listbox');
 await expect(input).toHaveAttribute('contenteditable','true');
 await host.evaluate((editor:any)=>{
  const input=editor.shadowRoot.querySelector('[contenteditable=true]');input.style.cssText='font:16px/24px monospace;white-space:pre-wrap;overflow-wrap:anywhere;max-height:144px;min-height:144px;overflow:auto';
  editor.focus();const walker=document.createTreeWalker(input,NodeFilter.SHOW_TEXT);let node:Node|null,last:Node|null=null;while(node=walker.nextNode())last=node;
  document.getSelection()!.setBaseAndExtent(last!,last!.textContent!.length,last!,last!.textContent!.length);
 });
 const geometry=()=>host.evaluate((editor:any)=>{
  const input=editor.shadowRoot.querySelector('[contenteditable=true]'),popup=editor.shadowRoot.querySelector('.popup');
  const walker=document.createTreeWalker(input,NodeFilter.SHOW_TEXT);let node:Node|null,first:DOMRect|undefined,last:DOMRect|undefined;
  while(node=walker.nextNode()){
   const text=node.textContent??'',offset=text.search(/[@/]/);
   const range=document.createRange();if(offset>=0){range.setStart(node,offset);range.setEnd(node,offset+1);first=range.getBoundingClientRect();}
   const end=text.replace(/\u200b+$/,'').length;if(end){range.setStart(node,end-1);range.setEnd(node,end);last=range.getBoundingClientRect();}
  }
  const box=popup.getBoundingClientRect(),bounds=input.getBoundingClientRect();
  return {trigger:first!.toJSON(),caret:last!.toJSON(),popup:box.toJSON(),bounds:bounds.toJSON(),scroll:input.scrollTop,rtl:getComputedStyle(input).direction==='rtl'};
 });
 const expectTriggerAlignment=async()=>{
  await expect.poll(async()=>{const g=await geometry();const x=g.rtl?g.trigger.right-g.popup.width:g.trigger.left;return Math.abs(g.popup.left-Math.max(8,Math.min(x,1272-g.popup.width)));}).toBeLessThan(2);
 };
 await input.pressSequentially(trigger+'abc');await expect(popup).toBeVisible();await expectTriggerAlignment();
 const initial=await geometry();await input.pressSequentially('defgh');await expectTriggerAlignment();
 expect(Math.abs((await geometry()).popup.left-initial.popup.left)).toBeLessThan(2);
 await input.pressSequentially('x'.repeat(55));await expectTriggerAlignment();
 await expect.poll(async()=>{const g=await geometry();return g.caret.top-g.trigger.top;}).toBeGreaterThan(20);
 await expect.poll(async()=>{const g=await geometry();return g.popup.bottom<=g.caret.top||g.popup.top>=g.caret.bottom||g.popup.left>g.caret.right||g.popup.right<g.caret.left;}).toBe(true);
 const beforeResize=await geometry();
 await host.evaluate(el=>el.parentElement!.style.width='240px');await expectTriggerAlignment();
 await expect.poll(async()=> (await geometry()).trigger.top-beforeResize.trigger.top).toBeGreaterThan(20);
 await input.pressSequentially('x'.repeat(220));
 await expect.poll(async()=>{const g=await geometry();return g.trigger.bottom<g.bounds.top;}).toBe(true);
 await expect.poll(async()=>{const g=await geometry();return Math.abs(g.popup.left-Math.max(8,Math.min(g.caret.right,1272-g.popup.width)));}).toBeLessThan(2);
 // Returning to the trigger restores its alignment; both-offscreen caret geometry must not move selection.
 await input.evaluate(el=>el.scrollTop=0);await expectTriggerAlignment();
 await host.evaluate(el=>{el.dir='rtl';el.parentElement!.style.width='260px';});await expectTriggerAlignment();
 await input.press('Escape');await expect(popup).not.toBeVisible();
 expect(await host.evaluate((el:any)=>el.value)).toBe('Draft notes for planning '+trigger+'abcdefgh'+'x'.repeat(275));
 // A fresh query commits only its trigger/query, preserving the preceding draft.
 await input.pressSequentially(' '+trigger+'go');await expect(popup).toBeVisible();await input.press('Enter');
 expect(await host.evaluate((el:any)=>el.value)).toBe('Draft notes for planning '+trigger+'abcdefgh'+'x'.repeat(275)+' RESULT');
});

test('long draft controls expose a reviewable comparison without submitting',async({page})=>{
 await page.goto('/api-examples/rich-text.html?progress-report');
 await page.getByRole('button',{name:'Load long drafts',exact:true}).click();
 for(const id of ['rich-brief','rich-reply','plain-reply'])expect(await page.locator('#'+id).evaluate((el:any)=>el.value)).toContain('Paragraph 40:');
 await expect(page.getByRole('status',{name:'Editor result'})).toHaveText('Nothing is sent outside this page.');
});
