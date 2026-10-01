import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const path='/api-examples/composable-chat.html';
// The OS chooser is outside Playwright's DOM. Stub only its opening boundary;
// exercise real editor events, session state, native input changes and token DOM.
async function load(page:any){await page.addInitScript(()=>{(window as any).pickerCalls=[];(window as any).pickerAnchors=[];HTMLInputElement.prototype.showPicker=function(){(window as any).pickerCalls.push(this.value);(window as any).pickerAnchors.push(this.getBoundingClientRect().toJSON());};});await page.goto(path);await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');await expect(page.getByRole('textbox',{name:'Structured message'})).toBeVisible();await page.getByRole('combobox',{name:'Color entry',exact:true}).selectOption('native');}
async function choose(page:any,color:string){await page.locator('[data-native-color]').evaluate((input:HTMLInputElement,value:string)=>{input.value=value;input.dispatchEvent(new Event('change',{bubbles:true}));},color);}
async function calls(page:any){return page.evaluate(()=>(window as any).pickerCalls);}
async function type(page:any,value:string){const field=page.getByRole('textbox',{name:'Structured message'});await field.click();await field.pressSequentially(value);return field;}
test('live reference, tool and color extensions capture and restore structured content',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));await load(page);
 const field=await type(page,'@mi');await expect(page.getByRole('option',{name:/Mira/})).toBeVisible();await field.press('Enter');await expect(field.locator('[data-token]')).toHaveText('@Mira');
 await page.getByRole('button',{name:'Tools',exact:true}).click();await page.getByRole('option',{name:/Summarize/}).click();await expect(field.locator('[data-token]')).toHaveText(['@Mira','/Summarize']);
 await page.getByRole('button',{name:'Colors',exact:true}).click();expect(await calls(page)).toEqual(['#5577cc']);await choose(page,'#112233');await expect(field.locator('[data-token]')).toHaveCount(3);await page.getByRole('button',{name:'Send message',exact:true}).click();await expect(page.locator('en-composable-chat-demo')).toContainText('Captured message');
 await field.click();await field.press('ControlOrMeta+a');await field.press('Backspace');await page.getByRole('button',{name:'Restore draft'}).click();await expect(field.locator('[data-token]')).toHaveCount(3);await expect(page.locator('en-token-editor')).toHaveJSProperty('value','@Mira/Summarize#112233');expect(errors).toEqual([]);
});
test('hash opens the native chooser directly; cancel preserves the trigger and focus',async({page})=>{
 await load(page);const field=await type(page,'#');expect(await calls(page)).toEqual(['#5577cc']);await expect(page.getByRole('dialog',{name:'Color picker'})).toHaveCount(0);
 await page.locator('[data-native-color]').dispatchEvent('cancel');await expect(field).toBeFocused();await expect(page.locator('en-token-editor')).toHaveJSProperty('value','#');await choose(page,'#112233');await expect(field.locator('[data-token]')).toHaveCount(0);
 await field.press('Escape');await field.press('Backspace');await field.press('#');expect(await calls(page)).toHaveLength(2);await field.press('Escape');await field.pressSequentially('draft');await expect(page.locator('en-token-editor')).toHaveJSProperty('value','#draft');expect(await calls(page)).toHaveLength(2);
});
test('declarative removal aborts the provider and reattachment restores behavior',async({page})=>{
 await load(page);const field=await type(page,'@');await expect(page.locator('en-token-editor').getByRole('option')).toHaveCount(2);await page.locator('en-editor-trigger').first().evaluate(el=>{(window as any).removedTrigger={el,parent:el.parentNode};el.remove();});await expect(page.locator('en-token-editor').getByRole('option')).toHaveCount(0);await field.press('m');await expect(page.locator('en-token-editor').getByRole('option')).toHaveCount(0);await page.evaluate(()=>{const {el,parent}=(window as any).removedTrigger;parent.append(el);});await field.press('i');await expect(page.locator('en-token-editor').getByRole('option',{name:/Mira/})).toBeVisible();
});
test('initial HTML stays readable without JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false});try{const page=await context.newPage();await page.goto(path);await expect(page.getByRole('heading',{name:'Composable editor extensions',exact:true,level:2})).toBeVisible();await expect(page.getByRole('textbox',{name:'Structured message'})).toBeVisible();}finally{await context.close();}
});
test.describe('themed touch input',()=>{
 test.use({hasTouch:true});
 test('narrow themed swatches are bounded, named and have touch targets',async({page},testInfo)=>{
 await load(page);await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Colors',exact:true}).click();await choose(page,'#112233');
 const chip=page.getByRole('button',{name:'Edit color #112233',exact:true});
 for(const theme of ['spectrum','fluent','astryx','shadcn','holotable']){
  await page.getByRole('combobox',{name:'Inspired theme',exact:true}).selectOption(theme+'-inspired');
  const box=await chip.boundingBox();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(391);expect(box!.height).toBeGreaterThanOrEqual(31.99);await expect(chip).toHaveText('');
 }
 expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);await page.screenshot({path:test.info().outputPath(`en-color-chip-${testInfo.project.name}.png`),fullPage:true});
});
});
test('swatch click and keyboard activation edit the same occurrence, preserve focus and undo',async({page})=>{
 await load(page);const field=await type(page,'#');await choose(page,'#112233');const chip=field.getByRole('button',{name:'Edit color #112233'});const id=await chip.getAttribute('data-token');
 await chip.click();expect(await calls(page)).toEqual(['#5577cc','#112233']);await choose(page,'#445566');let updated=field.getByRole('button',{name:'Edit color #445566'});await expect(updated).toBeFocused();await expect(updated).toHaveAttribute('data-token',id!);await expect(field.locator('[data-token]')).toHaveCount(1);await expect(updated).toHaveText('');
 await updated.press('Enter');expect(await calls(page)).toHaveLength(3);await page.keyboard.press('Escape');await expect(updated).toBeFocused();await updated.press('Space');expect(await calls(page)).toHaveLength(4);await page.locator('[data-native-color]').dispatchEvent('cancel');await expect(updated).toBeFocused();
 await expect(page.locator('en-composable-chat-demo')).not.toContainText('Captured message');await page.keyboard.press('ControlOrMeta+z');await expect(field.getByRole('button',{name:'Edit color #112233'})).toBeVisible();
 await field.focus();await page.keyboard.press('Tab');await expect(field.getByRole('button',{name:'Edit color #112233'})).toBeFocused();
});
test('native picker cleanup rejects late changes and disabled tokens cannot reopen',async({page})=>{
 await load(page);await type(page,'#');await page.locator('en-token-editor').evaluate((el:any)=>el.document={version:1,runs:[{kind:'text',text:'Reset'}]});await choose(page,'#112233');await expect(page.locator('en-token-editor')).toHaveJSProperty('value','Reset');
 await page.getByRole('button',{name:'Colors',exact:true}).click();await choose(page,'#112233');await page.locator('en-token-editor').evaluate((el:any)=>el.readOnly=true);await expect(page.getByRole('button',{name:'Edit color #112233'})).toBeDisabled();expect(await page.locator('en-token-editor').evaluate((el:any)=>el.openExtension('colors'))).toBe(false);await page.locator('en-token-editor').evaluate((el:any)=>{el.readOnly=false;el.disabled=true;});await expect(page.getByRole('button',{name:'Edit color #112233'})).toBeDisabled();
});
test('native picker falls back to input activation when showPicker throws',async({page})=>{
 await load(page);await page.locator('[data-native-color]').evaluate((input:HTMLInputElement)=>{input.showPicker=()=>{throw new DOMException('Unavailable');};input.click=()=>{(window as any).fallbackClicked=true;};});await type(page,'#');expect(await page.evaluate(()=>(window as any).fallbackClicked)).toBe(true);await choose(page,'#abcdef');await expect(page.getByRole('button',{name:'Edit color #abcdef'})).toBeVisible();
});
test('edits before hydration survive the editor upgrade',async({page})=>{
 let release!:()=>void;const ready=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/*.js',async route=>{await ready;await route.continue();});
 await page.goto(path,{waitUntil:'commit'});const field=page.getByRole('textbox',{name:'Structured message'});await expect(field).toBeVisible();await field.focus();await field.pressSequentially('Before upgrade');release();await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');await expect(page.locator('en-token-editor')).toHaveJSProperty('value','Before upgrade');await expect(field).toContainText('Before upgrade');
});
test('typed tool query accepts the active choice with Enter and inserts an undoable tool token',async({page})=>{
 await load(page);const field=await type(page,'Use /sum');await expect(page.locator('en-token-editor').getByRole('option',{name:/Summarize/})).toHaveAttribute('aria-selected','true');await page.keyboard.press('Enter');await expect(field.locator('[data-token]')).toHaveText('/Summarize');await expect(page.locator('en-token-editor')).toHaveJSProperty('value','Use /Summarize');await expect(page.locator('en-token-editor').getByRole('option')).toHaveCount(0);await page.keyboard.press('ControlOrMeta+z');await expect(page.locator('en-token-editor')).toHaveJSProperty('value','Use /sum');
});
test('toolbar-opened tools move focus to the editor and Enter accepts the keyboard-selected option',async({page})=>{
 await load(page);const field=await type(page,'Use ');await page.getByRole('button',{name:'Tools',exact:true}).click();await expect(field).toBeFocused();await expect(page.locator('en-token-editor').getByRole('option')).toHaveCount(2);await page.keyboard.press('ArrowDown');await expect(page.locator('en-token-editor').getByRole('option',{name:/Outline/})).toHaveAttribute('aria-selected','true');await page.keyboard.press('Enter');await expect(field.locator('[data-token]')).toHaveText('/Outline');await expect(page.locator('en-token-editor')).toHaveJSProperty('value','Use /Outline');await expect(page.locator('en-composable-chat-demo')).not.toContainText('Captured message');
});
test('toolbar tool insertion replaces the retained selection and can be canceled',async({page})=>{
 await load(page);const field=await type(page,'Use this later');for(let i=0;i<6;i++)await page.keyboard.press('ArrowLeft');for(let i=0;i<4;i++)await page.keyboard.press('Shift+ArrowLeft');
 await page.getByRole('button',{name:'Tools',exact:true}).click();await expect(field).toBeFocused();await expect(page.locator('en-token-editor').getByRole('option')).toHaveCount(2);
 await page.locator('en-token-editor').evaluate(el=>el.addEventListener('en-change',event=>event.preventDefault(),{once:true}));await page.keyboard.press('Enter');await expect(page.locator('en-token-editor')).toHaveJSProperty('value','Use this later');await expect(field.locator('[data-token]')).toHaveCount(0);
 await page.keyboard.press('Enter');await expect(page.locator('en-token-editor')).toHaveJSProperty('value','Use /Summarize later');await page.keyboard.press('ControlOrMeta+z');await expect(page.locator('en-token-editor')).toHaveJSProperty('value','Use this later');
});

test.describe('touch swatches',()=>{
 test.use({hasTouch:true,viewport:{width:390,height:844}});
 test('color chip exposes a touch-sized activation target',async({page})=>{
  await load(page);await type(page,'#');await choose(page,'#112233');const chip=page.getByRole('button',{name:'Edit color #112233'});const box=await chip.boundingBox();expect(box!.width).toBeGreaterThanOrEqual(44);expect(box!.height).toBeGreaterThanOrEqual(44);await chip.tap();expect(await calls(page)).toEqual(['#5577cc','#112233']);
 });
});

test('adjacent deletion restores the trigger and suggestions; query text can be edited',async({page})=>{
 await load(page);const field=await type(page,'@mi');await expect(page.getByRole('option',{name:/Mira/})).toBeVisible();await field.press('Enter');await field.press('End');await field.press('Backspace');await expect(page.locator('en-token-editor')).toHaveJSProperty('value','@');await expect(field.locator('[data-token]')).toHaveCount(0);await expect(page.getByRole('option',{name:/Mira/})).toBeVisible();await field.pressSequentially('co');await expect(page.getByRole('option',{name:/Cover study/})).toBeVisible();await field.press('Enter');await expect(field.locator('[data-token]')).toHaveText('@Cover study');await field.press('End');await field.press('Backspace');await field.press('Escape');await expect(page.locator('en-token-editor')).toHaveJSProperty('value','@');await field.press('ControlOrMeta+z');await expect(field.locator('[data-token]')).toHaveText('@Cover study');
});
test('explicit query editing, cancellation, range deletion and forward deletion retain their contracts',async({page})=>{
 await load(page);await page.getByRole('button',{name:'Load sample chips'}).click();const editor=page.locator('en-token-editor');const field=page.getByRole('textbox',{name:'Structured message'});
 await editor.evaluate((el:any)=>el.addEventListener('en-change',(event:Event)=>event.preventDefault(),{once:true}));expect(await editor.evaluate((el:any)=>el.editToken('sample-reference',{query:'Co'}))).toBe(false);await expect(field.locator('[data-token]')).toHaveCount(3);await expect(editor.getByRole('option')).toHaveCount(0);
 expect(await editor.evaluate((el:any)=>el.editToken('sample-reference',{query:'Co'}))).toBe(true);await expect(editor).toHaveJSProperty('value','Ask @Co to use /Summarize with #5577cc.');await expect(page.getByRole('option',{name:/Cover study/})).toBeVisible();await field.press('Escape');await field.press('ControlOrMeta+z');await expect(field.locator('[data-token]')).toHaveCount(3);
 await field.press('ControlOrMeta+a');await field.press('Backspace');await expect(editor).toHaveJSProperty('value','');await expect(editor.getByRole('option')).toHaveCount(0);
 await type(page,'/sum');await expect(page.getByRole('option',{name:/Summarize/})).toBeVisible();await field.press('Enter');for(let i=0;i<5&&(await editor.evaluate((el:any)=>el.selection?.focus))!==0;i++)await field.press('ArrowLeft');expect(await editor.evaluate((el:any)=>el.selection?.focus)).toBe(0);await field.press('Delete');await expect(editor).toHaveJSProperty('value','/');await expect(page.getByRole('option',{name:/Summarize/})).toBeVisible();
});
test('color deletion opens native picker and one undo restores the swatch',async({page})=>{
 await load(page);const field=await type(page,'#');await choose(page,'#112233');await field.press('End');await field.press('Backspace');await expect(page.locator('en-token-editor')).toHaveJSProperty('value','#');expect(await calls(page)).toHaveLength(2);await field.press('Escape');await field.press('ControlOrMeta+z');await expect(field.getByRole('button',{name:'Edit color #112233'})).toBeVisible();
});
test('token parts are consistent, themeable and bounded across light and dark themes',async({page},testInfo)=>{
 await load(page);await page.getByRole('button',{name:'Load sample chips'}).click();const field=page.getByRole('textbox',{name:'Structured message'});await page.setViewportSize({width:640,height:1000});
 for(const theme of ['','spectrum','fluent','astryx','shadcn','holotable']){
  await page.getByRole('combobox',{name:'Inspired theme',exact:true}).selectOption(theme?theme+'-inspired':'default');
  if(theme)await expect(page.getByRole('status',{name:'Theme result'})).toContainText(new RegExp((theme==='spectrum'?'Spectrum 2':theme==='fluent'?'Fluent 2':theme==='shadcn'?'shadcn/ui':theme)+'-inspired.*applied','i'));
  else await expect(page.locator('style[data-example-theme]')).toHaveCount(0);
  for(const mode of ['light','dark']){
   await page.getByRole('combobox',{name:'Appearance',exact:true}).selectOption(mode);await expect(page.locator('html')).toHaveAttribute('data-example-mode',mode);
   const chips=field.locator('[part~="token"]');await expect(chips).toHaveCount(3);
   const shapes=await chips.evaluateAll(nodes=>nodes.map(node=>{const s=getComputedStyle(node),r=node.getBoundingClientRect();return {height:r.height,radius:s.borderRadius,border:s.borderStyle,parts:node.getAttribute('part'),text:node.textContent};}));
   expect(new Set(shapes.map(s=>s.height)).size).toBe(1);expect(new Set(shapes.map(s=>s.radius)).size).toBe(1);expect(shapes.every(s=>s.border==='solid')).toBe(true);expect(shapes[2].text).toBe('');
   await page.keyboard.press('Tab');await chips.first().focus();await expect(chips.first()).toHaveCSS('outline-style','solid');
   const contrast=()=>chips.first().evaluate(node=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const c=canvas.getContext('2d')!;const style=getComputedStyle(node);const backgrounds:string[]=[];for(let current:Element|null=node;current;current=current.parentElement??(current.getRootNode() as ShadowRoot).host??null)backgrounds.push(getComputedStyle(current).backgroundColor);for(const background of backgrounds.reverse()){c.fillStyle=background;c.fillRect(0,0,1,1);}const bg=[...c.getImageData(0,0,1,1).data].slice(0,3);c.fillStyle=style.color;c.fillRect(0,0,1,1);const fg=[...c.getImageData(0,0,1,1).data].slice(0,3);const lum=(rgb:number[])=>rgb.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);return (Math.max(lum(bg),lum(fg))+.05)/(Math.min(lum(bg),lum(fg))+.05);});
   expect(await contrast()).toBeGreaterThanOrEqual(4.5);await chips.first().hover();expect(await contrast()).toBeGreaterThanOrEqual(4.5);await page.mouse.down();expect(await contrast()).toBeGreaterThanOrEqual(4.5);await page.mouse.move(1,1);await page.mouse.up();
   await page.locator('en-composable-chat-demo').screenshot({path:test.info().outputPath(`en-token-theme-${theme||'default'}-${mode}-${testInfo.project.name}.png`)});
  }
 }
 await page.locator('en-token-editor').evaluate(el=>el.setAttribute('dir','rtl'));await page.setViewportSize({width:390,height:844});expect(await field.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
 await page.locator('en-composable-chat-demo').evaluate(el=>{const style=document.createElement('style');style.textContent='en-token-editor::part(reference-token) { border-radius: 0; }';el.shadowRoot!.append(style);});await expect(field.locator('[part~="reference-token"]')).toHaveCSS('border-radius','0px');await expect(field.locator('[part~="tool-token"]')).not.toHaveCSS('border-radius','0px');
});


test('suggestion guidance does not resize the composer at wide or narrow widths',async({page})=>{
 await load(page);
 for(const width of [1280,390]){
  await page.setViewportSize({width,height:900});
  const composer=page.locator('en-composable-chat-demo en-chat-composer');
  const field=page.getByRole('textbox',{name:'Structured message'});
  const height=(await composer.boundingBox())!.height;
  for(const name of ['References','Tools']){
   await page.getByRole('button',{name,exact:true}).click();
   await expect(page.locator('en-token-editor').getByRole('option')).toHaveCount(2);
   expect((await composer.boundingBox())!.height).toBeCloseTo(height,1);
   await expect(field).toHaveAccessibleDescription('Up/Down to choose, Enter to insert, Escape to dismiss.');
   await field.press('Escape');
   expect((await composer.boundingBox())!.height).toBeCloseTo(height,1);
   await expect(field).toHaveAttribute('aria-describedby','description');
   await expect(field).toHaveAccessibleDescription('');
  }
 }
});
test('native color picker input is anchored at the activated chip or typed trigger',async({page})=>{
 await load(page);
 for(const width of [1280,390]){
  await page.setViewportSize({width,height:800});
  await page.getByRole('button',{name:'Load sample chips'}).click();
  const chip=page.getByRole('button',{name:'Edit color #5577cc'});
  await chip.scrollIntoViewIfNeeded();await chip.click();
  const anchor=await page.evaluate(()=>(window as any).pickerAnchors.at(-1));const box=(await chip.boundingBox())!;
  for(const key of ['x','y','width','height'] as const)expect(anchor[key]).toBeCloseTo(box[key],1);
  await page.keyboard.press('Escape');
  await page.locator('en-token-editor').evaluate((el:any)=>el.value='');
  const field=await type(page,'A color #');
  const anchorRect=await page.evaluate(()=>(window as any).pickerAnchors.at(-1));
  const triggerRect=await field.evaluate(el=>{
   const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let node:Node|null;
   while(node=walker.nextNode()){const offset=node.textContent!.indexOf('#');if(offset<0)continue;const range=document.createRange();range.setStart(node,offset);range.setEnd(node,offset+1);return range.getBoundingClientRect().toJSON();}
  });
  for(const key of ['x','y','width','height'] as const)expect(anchorRect[key]).toBeCloseTo(triggerRect[key],1);
  await page.keyboard.press('Escape');
 }
});

async function colorTypeahead(page:any){
 await page.getByRole('combobox',{name:'Color entry',exact:true}).selectOption('typeahead');
 await expect(page.locator('en-composable-chat-demo')).toContainText('Type #blu for named colors');
}
test('color typeahead filters named colors, normalizes hex and offers recent accepted colors',async({page})=>{
 await load(page);await colorTypeahead(page);const field=await type(page,'#blu');const editor=page.locator('en-token-editor');
 await expect(editor.getByRole('option',{name:'Blue',exact:true})).toBeVisible();await expect(editor.getByRole('option',{name:'Sky blue',exact:true})).toBeVisible();expect(await calls(page)).toHaveLength(0);
 await field.press('Enter');await expect(field.getByRole('button',{name:'Edit color #336699'})).toBeVisible();await expect(editor).toHaveJSProperty('value','#336699');
 await field.press('End');await field.pressSequentially(' #abc');await expect(editor.getByRole('option',{name:'Use #aabbcc'})).toBeVisible();await field.press('Enter');await expect(editor).toHaveJSProperty('value','#336699 #aabbcc');
 await field.press('End');await field.pressSequentially(' #');await expect(editor.getByRole('option',{name:'Recent #aabbcc'})).toBeVisible();await field.press('Escape');
 await field.pressSequentially('336699');await expect(editor.getByRole('option',{name:'Use #336699'})).toBeVisible();await field.press('Enter');await expect(editor).toHaveJSProperty('value','#336699 #aabbcc #336699');
});
test('color typeahead hands off to native picker without losing its query range or undo history',async({page})=>{
 await load(page);await colorTypeahead(page);const field=await type(page,'Use #unknown');const editor=page.locator('en-token-editor');
 await expect(editor.getByRole('option')).toHaveCount(1);await field.press('Enter');expect(await calls(page)).toHaveLength(1);await expect(editor.getByRole('option')).toHaveCount(0);await expect(field).toHaveAttribute('aria-haspopup','dialog');
 await choose(page,'#123456');await expect(editor).toHaveJSProperty('value','Use #123456');await field.press('ControlOrMeta+z');await expect(editor).toHaveJSProperty('value','Use #unknown');
 await field.press('ArrowRight');await field.pressSequentially('x');await expect(editor).toHaveJSProperty('value','Use #unknownx');await expect(editor.getByRole('option',{name:'Choose another color…'})).toBeVisible();await editor.getByRole('option',{name:'Choose another color…'}).click();await page.locator('[data-native-color]').dispatchEvent('cancel');await expect(editor).toHaveJSProperty('value','Use #unknownx');
});
test('typeahead edits a chip in place and changing modes cancels a pending native result',async({page})=>{
 await load(page);await colorTypeahead(page);await page.getByRole('button',{name:'Load sample chips'}).click();const editor=page.locator('en-token-editor');
 await page.getByRole('button',{name:'Edit color #5577cc'}).click();await editor.getByRole('option',{name:'Red',exact:true}).click();const chip=page.getByRole('button',{name:'Edit color #dc2626'});await expect(chip).toHaveAttribute('data-token','sample-color');await expect(chip).toBeFocused();
 await chip.click();await editor.getByRole('option',{name:'Choose another color…'}).click();await page.getByRole('combobox',{name:'Color entry',exact:true}).selectOption('native');await choose(page,'#112233');await expect(chip).toBeVisible();await expect(editor).not.toHaveJSProperty('value','Ask @Mira to use /Summarize with #112233.');
 await chip.click();expect(await calls(page)).toHaveLength(2);await choose(page,'#445566');await expect(page.getByRole('button',{name:'Edit color #445566'})).toHaveAttribute('data-token','sample-color');
});
test('custom swatch suggestions keep accessible names and keyboard behavior across themes',async({page},testInfo)=>{
 await load(page);await page.setViewportSize({width:390,height:844});await colorTypeahead(page);const field=page.getByRole('textbox',{name:'Structured message'});const editor=page.locator('en-token-editor');
 for(const theme of ['default','spectrum','fluent','astryx','shadcn','holotable']){
  await page.getByRole('combobox',{name:'Inspired theme',exact:true}).selectOption(theme==='default'?theme:theme+'-inspired');
  if(theme!=='default')await expect(page.getByRole('status',{name:'Theme result'})).toContainText(new RegExp((theme==='spectrum'?'Spectrum 2':theme==='fluent'?'Fluent 2':theme==='shadcn'?'shadcn/ui':theme)+'-inspired.*applied','i'));
  await editor.evaluate((el:any)=>el.value='');await type(page,'#blu');const option=editor.getByRole('option',{name:'Blue',exact:true});await expect(option).toHaveAccessibleName('Blue');await expect(option.locator('[aria-hidden=true]')).toHaveCount(1);await expect(option.getByRole('button')).toHaveCount(0);
  await field.press('ArrowDown');await expect(editor.getByRole('option',{name:'Sky blue'})).toHaveAttribute('aria-selected','true');await field.press('Enter');await expect(editor).toHaveJSProperty('value','#38bdf8');
 }
 await field.press('End');await field.pressSequentially(' #blu');expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);await page.screenshot({path:test.info().outputPath(`en-color-typeahead-${testInfo.project.name}.png`),fullPage:true});
});

test('color swatch geometry is customizable through parts without inline overrides',async({page})=>{
 await load(page);await page.getByRole('button',{name:'Load sample chips'}).click();const swatch=page.locator('en-token-editor [part="color-swatch"]');
 expect(await swatch.evaluate((el:HTMLElement)=>[...el.style])).toEqual([]);
 await expect(swatch).toHaveCSS('background-image',/repeating-conic-gradient/);
 await page.locator('en-composable-chat-demo').evaluate(el=>{const style=document.createElement('style');style.textContent='en-token-editor::part(color-swatch),en-token-editor::part(color-option-swatch){border-radius:50%;inline-size:24px;block-size:24px}';el.shadowRoot!.append(style);});
 await expect(swatch).toHaveCSS('border-radius','50%');await expect(swatch).toHaveCSS('width','24px');await expect(swatch.locator('[part=color-swatch-paint]')).toHaveCSS('background-color','rgb(85, 119, 204)');
 await colorTypeahead(page);await page.getByRole('button',{name:'Colors',exact:true}).click();const preview=page.locator('en-token-editor [part="color-option-swatch"]').first();await expect(preview).toHaveCSS('width','24px');await expect(preview).toHaveCSS('border-radius','50%');expect(await preview.evaluate((el:HTMLElement)=>[...el.style])).toEqual(['background-color']);
});

test('review selects keep long labels on one line with room for the caret',async({page},testInfo)=>{
 await load(page);await page.setViewportSize({width:390,height:844});
 const select=page.getByRole('combobox',{name:'Inspired theme',exact:true});const host=page.locator('en-select').filter({has:select});
 for(const theme of ['spectrum','fluent','astryx','shadcn','holotable']){
  await select.selectOption(theme+'-inspired');await expect(page.getByRole('status',{name:'Theme result'})).toContainText(new RegExp((theme==='spectrum'?'Spectrum 2':theme==='fluent'?'Fluent 2':theme==='shadcn'?'shadcn/ui':theme)+'-inspired.*applied','i'));
  expect((await host.boundingBox())!.width).toBeGreaterThan(300);
  const wide=(await select.boundingBox())!.height;
  await host.evaluate(el=>{(el as HTMLElement).style.cssText='flex:none;inline-size:160px';});
  for(const dir of ['ltr','rtl']){
   await host.evaluate((el,dir)=>el.setAttribute('dir',dir),dir);
   await expect(select).toHaveCSS('white-space','nowrap');expect((await select.boundingBox())!.height).toBeCloseTo(wide,1);
   const measurement=await select.evaluate(el=>{
    const native=el as HTMLSelectElement;const label=el.querySelector('selectedcontent')!;const r=el.getBoundingClientRect(),l=label.getBoundingClientRect(),s=getComputedStyle(el),icon=getComputedStyle(el,'::picker-icon');
    return {enhanced:CSS.supports('appearance','base-select')&&CSS.supports('selector(::picker(select))'),value:native.value,label:native.selectedOptions[0].textContent,hostWidth:(el.getRootNode() as ShadowRoot).host.getBoundingClientRect().width,width:r.width,height:r.height,labelHeight:l.height,labelWidth:l.width,overflow:getComputedStyle(label).textOverflow,space:s.direction==='rtl'?l.left-r.left:r.right-l.right,icon:parseFloat(icon.width)||0};
   });
   expect(measurement.width).toBeLessThanOrEqual(measurement.hostWidth+.01);expect(measurement.value).toBe(theme+'-inspired');expect(measurement.label).toContain('inspired');
   if(measurement.enhanced){expect(measurement.overflow).toBe('ellipsis');expect(measurement.labelWidth).toBeGreaterThan(30);expect(measurement.labelHeight).toBeLessThan(measurement.height);expect(measurement.space).toBeGreaterThanOrEqual(measurement.icon);}
  }
  await host.screenshot({path:test.info().outputPath(`en-select-overflow-${theme}-${testInfo.project.name}.png`)});
  await host.evaluate(el=>{el.removeAttribute('style');el.removeAttribute('dir');});
 }
 await host.evaluate((el:any)=>{el.items=el.items.map((item:any)=>item.value===el.value?{...item,label:'Renamed <theme> & palette'}:item);});
 await expect.poll(()=>select.evaluate((el:HTMLSelectElement)=>el.selectedOptions[0].textContent)).toBe('Renamed <theme> & palette');
 await expect(select).toHaveValue('holotable-inspired');
 expect(await select.evaluate(el=>el.querySelector('option:checked')!.childNodes.length)).toBe(1);
 await expect(select).toHaveAccessibleName('Inspired theme');await select.focus();await page.keyboard.press('Tab');await expect(page.getByRole('combobox',{name:'Appearance',exact:true})).toBeFocused();
});

// The production route registers color controls eagerly; popup DOM is session-conditional.
async function loadInlineColor(page:any) {
 await page.goto(path);
 await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');
 await expect(page.getByRole('textbox',{name:'Structured message'})).toBeVisible();
 await expect(page.getByRole('combobox',{name:'Color entry',exact:true})).toHaveValue('picker');
 expect(await page.locator('en-token-editor').evaluate((editor:any)=>{
  const root=editor.shadowRoot;const registry=root.customElementRegistry??editor.ownerDocument.defaultView.customElements;
  return ['en-color-picker','en-swatch','en-tab','en-tab-panel','en-tabs'].every(tag=>Boolean(registry.get(tag)));
 })).toBe(true);
 await expect(page.locator('en-color-picker')).toHaveCount(0);
}
test('eager color registration leaves popup DOM absent until the first session',async({page})=>{
 await loadInlineColor(page);
 const field=page.getByRole('textbox',{name:'Structured message'});await field.focus();
 await expect(page.locator('en-color-picker')).toHaveCount(0);await expect(field).toBeFocused();
 await page.getByRole('button',{name:'Colors',exact:true}).click();
 await expect(page.getByRole('textbox',{name:'Hex color',exact:true})).toHaveValue('#5577cc');
 await expect(page.locator('en-color-picker')).toHaveCount(1);
 await page.getByRole('button',{name:'Cancel',exact:true}).click();
 await expect(page.locator('en-color-picker')).toHaveCount(0);await expect(field).toBeFocused();
});
test('the chat workflow wrapper registers inline color controls before the first session',async({page})=>{
 await page.goto('/workflows/chat.html');
 await expect(page.locator('en-workflows-app')).not.toHaveAttribute('data-ssr');
 await page.getByText('Composable message editor',{exact:true}).click();
 const demo=page.locator('en-composable-chat-demo');const field=demo.getByRole('textbox',{name:'Structured message'});
 await expect(field).toBeVisible();
 expect(await demo.locator('en-token-editor').evaluate((editor:any)=>{
  const root=editor.shadowRoot;const registry=root.customElementRegistry??editor.ownerDocument.defaultView.customElements;
  return ['en-color-picker','en-swatch','en-tab','en-tab-panel','en-tabs'].every(tag=>Boolean(registry.get(tag)));
 })).toBe(true);
 await expect(demo.locator('en-color-picker')).toHaveCount(0);
 await demo.getByRole('button',{name:'Colors',exact:true}).click();
 await expect(demo.getByRole('textbox',{name:'Hex color',exact:true})).toHaveValue('#5577cc');
 await demo.getByRole('button',{name:'Cancel',exact:true}).click();
 await expect(demo.locator('en-color-picker')).toHaveCount(0);await expect(field).toBeFocused();
});
test('inline color Enter focuses ready controls and rerenders preserve an invalid draft',async({page})=>{
 await loadInlineColor(page);
 const field=await type(page,'#');const hex=page.getByRole('textbox',{name:'Hex color',exact:true});
 await expect(hex).toBeVisible();await field.press('Enter');await expect(hex).toBeFocused();
 await hex.fill('#a');await hex.evaluate(input=>{(window as any).inlineColorDraft=input;});
 await page.locator('en-composable-chat-demo').evaluate(async(demo:any)=>{demo.requestUpdate();const editor=demo.shadowRoot.querySelector('en-token-editor');editor.requestUpdate();await Promise.all([demo.updateComplete,editor.updateComplete]);});
 await expect(hex).toHaveValue('#a');await expect(hex).toBeFocused();
 expect(await hex.evaluate(input=>input===(window as any).inlineColorDraft)).toBe(true);
 await page.getByRole('button',{name:'Apply color',exact:true}).click();
 await expect(hex).toHaveValue('#a');await expect(hex).toBeFocused();
 await expect(field.locator('[data-token]')).toHaveCount(0);
 await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(field).toBeFocused();
 await expect(page.locator('en-token-editor')).toHaveJSProperty('value','#');
 await expect(page.locator('en-color-picker')).toHaveCount(0);
});
test('inline color Apply preserves the edited occurrence and Cancel discards the next draft',async({page})=>{
 await loadInlineColor(page);await page.getByRole('button',{name:'Load sample chips'}).click();
 const chip=page.getByRole('button',{name:'Edit color #5577cc',exact:true});
 await expect(chip).toHaveAttribute('data-token','sample-color');await chip.click();
 const hex=page.getByRole('textbox',{name:'Hex color',exact:true});await hex.fill('#123456');
 await page.getByRole('button',{name:'Apply color',exact:true}).click();
 const accepted=page.getByRole('button',{name:'Edit color #123456',exact:true});
 await expect(accepted).toHaveAttribute('data-token','sample-color');await expect(accepted).toBeFocused();
 await expect(page.locator('en-color-picker')).toHaveCount(0);await accepted.click();
 await expect(hex).toHaveValue('#123456');await hex.fill('#abcdef');
 await page.getByRole('button',{name:'Cancel',exact:true}).click();
 await expect(accepted).toHaveAttribute('data-token','sample-color');await expect(accepted).toBeFocused();
 await expect(page.getByRole('button',{name:'Edit color #abcdef',exact:true})).toHaveCount(0);
 await expect(page.locator('en-color-picker')).toHaveCount(0);
 await accepted.click();await expect(hex).toHaveValue('#123456');
});
test('typing an inline color query updates ready controls without moving editor focus',async({page})=>{
 await loadInlineColor(page);const field=await type(page,'#');
 const hex=page.getByRole('textbox',{name:'Hex color',exact:true});await expect(hex).toHaveValue('#5577cc');
 await field.pressSequentially('336699');await expect(hex).toHaveValue('#336699');
 await expect(field).toBeFocused();await expect(page.locator('en-color-picker')).toHaveCount(1);
 await field.press('ArrowDown');await expect(hex).toBeFocused();await hex.press('Escape');
 await expect(page.locator('en-token-editor')).toHaveJSProperty('value','#336699');
 await expect(page.locator('en-color-picker')).toHaveCount(0);await expect(field).toBeFocused();
});
