import {test,expect,type Page} from '@playwright/test';
import {descriptionCases,descriptionOverlays} from '../fixtures/description-content-template.mjs';
const url='/description-content-fixture';
const slotText='Shared guidance. Read guide';
async function hydrate(page:Page) {
  await page.goto(url);
  await page.evaluate(()=>(window as any).hydrateDescriptions());
  await expect(page.locator('html')).toHaveAttribute('data-hydrated','true');
  await expect(page.locator('#en-rich-text-editor .editor')).toHaveAttribute('contenteditable','true');
}
async function setDescription(page:Page,id:string,text:string) {
  await page.locator('#'+id).evaluate(async (el:any,text)=>{el.description=text;await el.updateComplete;},text);
}

test('server-rendered descriptions reach all same-shadow targets before JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();
 try {
  await page.goto(url);
  for(const [tag,selector] of descriptionCases){
   const host=page.locator('#'+tag);const targets=host.locator(selector);
   expect(await targets.count(),tag).toBeGreaterThan(0);
   for(const target of await targets.all()) await expect(target).toHaveAccessibleDescription(new RegExp('^'+slotText.replaceAll('.','\\.')));
   await expect(host.locator(':scope > [slot=description]')).toBeVisible();
  }
  for(const tag of descriptionOverlays){
   const host=page.locator('#'+tag);
   await expect(host.locator('dialog')).toHaveAttribute('aria-describedby','en-overlay-description');
   await expect(host.locator('[part~=description] > slot')).toHaveAttribute('name','description');
  }
  await expect(page.locator('#projected input').nth(0)).toHaveAccessibleDescription('');
  await expect(page.locator('#projected input').nth(1)).toHaveAccessibleDescription('');
  await expect(page.locator('#projected input').nth(2)).toHaveAccessibleDescription('Plain guidance');
 } finally {await context.close();}
});

test('the common description contract survives hydration and native slot updates across families',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await hydrate(page);
 for(const [tag,selector] of descriptionCases) await test.step(tag,async()=>{
  const host=page.locator('#'+tag);const targets=host.locator(selector);
  for(const target of await targets.all())await expect(target).toHaveAccessibleDescription(new RegExp('^'+slotText.replaceAll('.','\\.')));
  await setDescription(page,tag,'Latest fallback.');
  await expect(targets.first()).toHaveAccessibleDescription(/Shared guidance/);
  await host.locator(':scope > [slot=description]').evaluate(el=>{el.textContent='Changed guidance.';});
  for(const target of await targets.all())await expect(target).toHaveAccessibleDescription(/^Changed guidance\./);
  await host.locator(':scope > [slot=description]').evaluate(el=>{el.textContent='';});
  await expect(targets.first()).not.toHaveAccessibleDescription(/Latest fallback/);
  await host.locator(':scope > [slot=description]').evaluate(el=>{el.setAttribute('hidden','');el.textContent='Hidden text';});
  await expect(targets.first()).not.toHaveAccessibleDescription(/Hidden text|Latest fallback/);
  await host.locator(':scope > [slot=description]').evaluate(el=>el.remove());
  for(const target of await targets.all())await expect(target).toHaveAccessibleDescription(/^Latest fallback\./);
  await setDescription(page,tag,'');
  await expect(host.locator('[part~=description]').first()).toBeHidden();
  await host.evaluate(async(el:any)=>{el.setAttribute('description','Restored attribute.');await el.updateComplete;});
  await expect(targets.first()).toHaveAccessibleDescription(/^Restored attribute\./);
  expect(await host.locator('.en-description-fallback').evaluate(el=>parseFloat(getComputedStyle(el).marginBlockStart)),tag+' help gap').toBeGreaterThan(0);
 });
 expect(errors).toEqual([]);
});

test('all modal variants expose slot-only guidance with no empty flex gap and preserve focus',async({page})=>{
 await hydrate(page);
 for(const tag of descriptionOverlays) await test.step(tag,async()=>{
  const host=page.locator('#'+tag);
  await setDescription(page,tag,'');await host.evaluate((el:any)=>el.show());
  const dialog=host.locator('dialog');await expect(dialog).toBeVisible();await expect(dialog).toHaveAccessibleDescription(slotText);
  const close=host.getByRole('button',{name:'Close',exact:true});await close.focus();
  await setDescription(page,tag,'Fallback after removal.');await expect(close).toBeFocused();
  await host.locator(':scope > [slot=description]').evaluate(el=>el.remove());await expect(dialog).toHaveAccessibleDescription('Fallback after removal.');
  await setDescription(page,tag,'');await expect(dialog).toHaveAccessibleDescription('');
  const geometry=await dialog.evaluate(el=>{
   const header=el.querySelector('.en-overlay-header')!, body=el.querySelector('.en-overlay-body')!;
   return {space:body.getBoundingClientRect().top-header.getBoundingClientRect().bottom,gap:parseFloat(getComputedStyle(el).rowGap),margin:parseFloat(getComputedStyle(body).marginTop)};
  });
  expect(geometry.space).toBeCloseTo(geometry.gap+geometry.margin,0);
  await host.evaluate((el:any)=>el.hide());await expect(dialog).not.toBeVisible();
 });
});

for(const tag of ['en-rich-text-editor','en-token-editor']) {
 test(`${tag} slotted shadow content preserves rejected drafts and scroll`,async({page})=>{
  await hydrate(page);const host=page.locator('#'+tag),box=host.locator('.editor');
  await host.evaluate(async(el:any)=>{
   el.value=Array.from({length:40},(_,i)=>`Line ${i+1}`).join('\n');await el.updateComplete;
   el.addEventListener('en-change',(event:Event)=>event.preventDefault());
  });
  await box.focus();await box.press('End');await box.pressSequentially(' rejected');
  const before=await host.evaluate(async(el:any)=>{
   // Native caret scrolling can animate after the final key even with instant scrollTo.
   const box=el.shadowRoot.querySelector('.editor');let previous=box.scrollTop,stable=0;
   for(let frame=0;frame<180 && stable<4;frame++){
    await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
    stable=box.scrollTop===previous?stable+1:0;previous=box.scrollTop;
   }
   if(stable<4)throw new Error('Native caret scrolling did not settle');
   box.scrollTo({top:60,behavior:'instant'});
   await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
   return {text:box.textContent,value:el.value,revision:el.revision,scroll:box.scrollTop};
  });
  expect(before.scroll).toBe(60);
  await host.evaluate((el:any)=>{
   customElements.define('description-shadow-help',class extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'}).innerHTML='<strong>Shadow guidance.</strong>';}});
   el.querySelector('[slot=description]').remove();const help=document.createElement('description-shadow-help');help.slot='description';el.append(help);
   el.description='Suppressed fallback';
  });
  await expect(box).toHaveAccessibleDescription(/^Shadow guidance\./);
  expect(await host.evaluate((el:any)=>{const box=el.shadowRoot.querySelector('.editor');return {text:box.textContent,value:el.value,revision:el.revision,scroll:box.scrollTop};})).toEqual(before);
  await host.locator(':scope > [slot=description]').evaluate(el=>el.remove());
  await setDescription(page,tag,'   ');
  await expect(host.locator('.en-description-fallback')).toHaveText('   ',{useInnerText:false});
 });
 test(`${tag} help updates preserve live state, history, bookmarks and composition`,async({page})=>{
  await hydrate(page);const host=page.locator('#'+tag),box=host.locator('.editor');
  await box.focus();await box.pressSequentially('Draft!');await expect(host).toHaveJSProperty('value','Draft!');
  const before=await host.evaluate((el:any)=>{
   const box=el.shadowRoot.querySelector('.editor');(window as any).descriptionEditorNode=box;
   (window as any).descriptionBookmark=el.captureBookmark();
   (window as any).descriptionEvents=[];
   for(const type of ['en-input','en-change','en-action','en-editor-state'])el.addEventListener(type,()=>(window as any).descriptionEvents.push(type));
   return {value:el.value,document:JSON.stringify(el.document),revision:el.revision,selection:el.selectionKey??el.selection};
  });
  await setDescription(page,tag,'Updated help.');await host.locator(':scope > [slot=description]').evaluate(el=>el.remove());
  await expect(box).toBeFocused();
  expect(await host.evaluate((el:any)=>({value:el.value,document:JSON.stringify(el.document),revision:el.revision,selection:el.selectionKey??el.selection}))).toEqual(before);
  expect(await box.evaluate(el=>el===(window as any).descriptionEditorNode)).toBe(true);
  expect(await page.evaluate(()=>(window as any).descriptionEvents)).toEqual([]);
  expect(await host.evaluate((el:any)=>el.restoreBookmark((window as any).descriptionBookmark))).toBe(true);
  await box.dispatchEvent('compositionstart',{data:''});
  await expect(host).toHaveJSProperty('composing',true);
  await setDescription(page,tag,'Help during composition.');await expect(host).toHaveJSProperty('composing',true);await expect(box).toBeFocused();
  await expect(box).toHaveAccessibleDescription(/^Help during composition\./);
  await box.dispatchEvent('compositionend',{data:''});
  await expect(host).toHaveJSProperty('composing',false);
  await host.evaluate((el:any)=>el.localName==='en-rich-text-editor'?el.execute('undo'):el.undo());
  await expect(host).not.toHaveJSProperty('value',before.value);
  await host.evaluate((el:any)=>el.localName==='en-rich-text-editor'?el.execute('redo'):el.redo());
  await expect(host).toHaveJSProperty('value',before.value);
  for(const prop of ['readOnly','disabled']){
   await host.evaluate(async(el:any,prop)=>{el[prop]=true;await el.updateComplete;},prop);
   await setDescription(page,tag,'Available while unavailable.');await expect(box).toHaveAccessibleDescription(/^Available while unavailable\./);
   await host.evaluate(async(el:any,prop)=>{el[prop]=false;await el.updateComplete;},prop);
  }
  await host.evaluate((el:any)=>{const parent=el.parentElement;el.remove();parent.append(el);});
  await expect(box).toHaveAttribute('contenteditable','true');await expect(box).toHaveAccessibleDescription(/^Available while unavailable\./);
 });
 test(`${tag} guidance leaves open suggestions and their descriptions intact`,async({page})=>{
  await hydrate(page);const host=page.locator('#'+tag),box=host.locator('.editor');
  await host.evaluate((el:any)=>{el.registerExtension({id:'references',trigger:'@',label:'References',provide:()=>[{id:'alpha',label:'Alpha',description:'Option detail',insert:[{kind:'text',text:'Alpha'}]}]});el.openExtension('references');});
  const option=host.getByRole('option',{name:'Alpha',exact:true});await expect(option).toBeVisible();await expect(option).toHaveAccessibleDescription('Option detail');
  await setDescription(page,tag,'Help while picking.');await host.locator(':scope > [slot=description]').evaluate(el=>el.remove());
  await expect(option).toBeVisible();await expect(box).toHaveAccessibleDescription(/Help while picking\./);await expect(box).toHaveAttribute('aria-describedby',/.*(?:rich-hint|editor-hint)/);
  await expect(option).toHaveAccessibleDescription('Option detail');await box.press('Escape');await expect(option).not.toBeVisible();
 });
}

test('group help links keep keyboard activation and projected empty/hidden descriptions suppress fallback',async({page})=>{
 await hydrate(page);
 for(const tag of ['en-multiselect','en-toggle-group','en-checkbox-group']){
  const host=page.locator('#'+tag);const link=host.getByRole('link',{name:'Read guide'});await link.focus();await link.press('Enter');
  await expect(page).toHaveURL(/#guide$/);await expect(host).toHaveJSProperty('value',[]);await page.evaluate(()=>history.replaceState(null,'',location.pathname));
 }
 const group=page.locator('#projected');
 await expect(group.locator('input').nth(0)).toHaveAccessibleDescription('');await expect(group.locator('input').nth(1)).toHaveAccessibleDescription('');
 await group.locator('en-choice-option').first().evaluate((el:any)=>{el.description='Updated item fallback';el.querySelector('[slot=description]').remove();});
 await expect(group.locator('input').nth(0)).toHaveAccessibleDescription('Updated item fallback');
 const summary=page.locator('#summary');await expect(summary.locator('slot[part=description]')).toHaveAttribute('name','description');await expect(summary.getByText('Summary guidance.')).toBeVisible();
 await summary.evaluate((el:any)=>el.items=[]);await expect(summary.locator('section')).toHaveCount(0);
});

test('production-minified editor hydration restores an initially empty description repeatedly',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/minification-fixture');await expect(page.locator('html')).toHaveAttribute('data-hydrated','true');
 for(const id of ['minified-rich','minified-token']){
  const host=page.locator('#'+id);await expect(host.locator('.editor')).toHaveAttribute('contenteditable','true');
  for(const text of ['First help.','','Restored help.']){await setDescription(page,id,text);if(text)await expect(host.locator('.editor')).toHaveAccessibleDescription(new RegExp('^'+text));else await expect(host.locator('[part=description]')).toBeHidden();}
 }
 expect(errors).toEqual([]);
});

test('composite audit resolves shared color help and date-range trigger references',async({page})=>{
 await hydrate(page);
 const color=page.locator('#en-color-slider');await color.evaluate(async(el:any)=>{el.editable=true;await el.updateComplete;});
 await expect(color.locator('input[type=range]')).toHaveAccessibleDescription(slotText);
 // Playwright's synthesized description does not inspect element-reference properties.
 await expect.poll(()=>color.evaluate((el:any)=>{
  const input=el.shadowRoot.querySelector('en-text-field').shadowRoot.querySelector('input');
  return input.ariaDescribedByElements?.[0]===el.shadowRoot.querySelector('#description');
 })).toBe(true);
 const range=page.locator('#range-date');
 expect(await range.evaluate((el:any)=>{
  const trigger=el.shadowRoot.querySelector('#picker-trigger');const control=trigger.shadowRoot.querySelector('button');
  return control.ariaDescribedByElements?.map((node:Element)=>node===el.shadowRoot.querySelector('#description'));
 })).toEqual([true]);
 // Date endpoints have their own native-edit instructions, not outer field help.
 await expect(range.locator('en-dialog input[type=date]').first()).not.toHaveAttribute('aria-describedby',/description/);
});

test('editor help follows shared sizing, RTL wrapping, empty spacing and focused link behavior',async({page})=>{
 await hydrate(page);
 for(const tag of ['en-rich-text-editor','en-token-editor']){
  const host=page.locator('#'+tag);const control=host.locator('.editor');
  const label=await control.getAttribute('aria-label');
  await host.evaluate((el:any)=>{el.style.inlineSize='260px';el.dir='rtl';el.querySelector('[slot=description]').remove();el.description='';});
  await expect(host.locator('[part=description]')).toBeHidden();
  expect(await host.evaluate((el:any)=>el.shadowRoot.querySelector('[part=description]').getBoundingClientRect().height)).toBe(0);
  for(const size of ['small','medium','large']){
   await host.evaluate(async(el:any,size)=>{el.size=size;el.description='إرشادات للمشروع · This long supporting description wraps naturally across several lines.';await el.updateComplete;},size);
   const sizes=await host.evaluate((el:any)=>{const d=el.shadowRoot.querySelector('[part=description]');return {width:d.getBoundingClientRect().width,overflow:d.scrollWidth>d.clientWidth+1,direction:getComputedStyle(d).direction};});
   expect(sizes.overflow).toBe(false);expect(sizes.direction).toBe('rtl');await expect(control).toHaveAccessibleName(label!);
  }
  await host.evaluate((el:any)=>{const a=document.createElement('span');a.slot='description';a.innerHTML='<strong>First block.</strong> <a href="#guide">Independent help</a>';const b=document.createElement('span');b.slot='description';b.textContent='Second block.';el.append(a,b);});
  await expect(control).toHaveAccessibleDescription(/^First block\. Independent help Second block\./);
  const roots=host.locator(':scope > [slot=description]');const first=await roots.nth(0).boundingBox();const second=await roots.nth(1).boundingBox();expect(second!.y).toBeGreaterThanOrEqual(first!.y+first!.height);
  const link=host.getByRole('link',{name:'Independent help'});await link.focus();await setDescription(page,tag,'Updated while link focused.');await expect(link).toBeFocused();
 }
 await page.emulateMedia({forcedColors:'active'});
 await expect(page.locator('#en-rich-text-editor [part=description]')).toBeVisible();
});
