import {test,expect,type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const url='/api-examples/chat-patterns.html';
const errors=new WeakMap<Page,string[]>();
test.beforeEach(({page})=>{const list:string[]=[];errors.set(page,list);page.on('pageerror',error=>list.push(error.message));page.on('console',message=>{if(message.type()==='error')list.push(message.text());});});
test.afterEach(({page})=>{expect(errors.get(page)).toEqual([]);});
const demo=(page:Page)=>page.locator('[data-chat-patterns-demo]');
const editor=(page:Page)=>demo(page).getByRole('textbox',{name:'Message',exact:true});
const composer=(page:Page)=>demo(page).locator('en-chat-composer');
async function load(page:Page){await page.goto(url);await expect(page.locator('en-api-example-app')).not.toHaveAttribute('data-ssr');await expect(editor(page)).toBeVisible();await page.waitForFunction(()=>document.documentElement.hasAttribute('data-example-standalone'));await expect(composer(page)).toHaveJSProperty('hasUpdated',true);}
test('SSR includes the initial message, optional slots and editable draft',async({page,browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false});try{const server=await context.newPage();await server.goto(url);await expect(demo(server).locator('en-chat-message')).toContainText('cover image');await expect(editor(server)).toBeVisible();await expect(demo(server).getByRole('button',{name:'Use suggestion'})).toBeVisible();}finally{await context.close();}
 await load(page);await expect(demo(page).getByRole('article')).toHaveCount(1);await expect(editor(page)).toHaveValue('');
});
test('multiline editing and send snapshot preserve a newer draft through completion',async({page})=>{
 await load(page);await editor(page).fill('First line');await editor(page).press('Enter');await editor(page).press('End');await editor(page).press('x');await expect(editor(page)).toHaveValue('First line\nx');
 await editor(page).press('Control+Enter');await expect(composer(page)).toHaveJSProperty('sending',true);
 await editor(page).fill('My next draft');await demo(page).getByRole('button',{name:'Complete send'}).click();await expect(editor(page)).toHaveValue('My next draft');await expect(demo(page).getByRole('article')).toHaveCount(2);await expect(demo(page).locator('en-chat-message').last()).toContainText('First line');
 await expect(demo(page).getByRole('button',{name:'Complete send'})).toBeDisabled();
});
test('failed attachment send stays in the transcript and local retry preserves the composer',async({page})=>{
 await load(page);await editor(page).fill('Please review');await demo(page).locator('input[type=file]').setInputFiles({name:'study.pdf',mimeType:'application/pdf',buffer:Buffer.from('local fixture')});
 await demo(page).getByRole('button',{name:'Send message',exact:true}).click();await demo(page).getByRole('button',{name:'Fail send'}).click();await expect(editor(page)).toHaveValue('Please review');await expect(composer(page).getByRole('status')).toContainText('retained');
 expect(await demo(page).locator('en-file-upload').evaluate((el:any)=>el.files.map((f:File)=>f.name))).toEqual(['study.pdf']);
 await expect(demo(page).locator('en-chat-message').last()).toContainText('Not sent');await demo(page).getByRole('button',{name:'Retry message',exact:true}).click();await expect(demo(page).locator('en-chat-message').last()).toContainText('Retrying');await demo(page).getByRole('button',{name:'Complete send'}).click();await expect(editor(page)).toHaveValue('Please review');await expect(demo(page).locator('en-chat-message')).toHaveCount(2);await expect(demo(page).locator('en-chat-message').last()).toContainText('study.pdf');expect(await demo(page).locator('en-file-upload').evaluate((el:any)=>el.files.length)).toBe(1);
});
test('canceling send and IME guards never clear or submit a draft',async({page})=>{
 await load(page);await editor(page).fill('日本語');await composer(page).evaluate((el:any)=>{el.count=0;el.addEventListener('en-action',(e:Event)=>{el.count++;e.preventDefault();});});
 await editor(page).dispatchEvent('compositionstart',{bubbles:true,composed:true});await editor(page).dispatchEvent('keydown',{key:'Enter',ctrlKey:true,bubbles:true,composed:true,isComposing:true});await demo(page).getByRole('button',{name:'Send message',exact:true}).click();await expect(composer(page)).toHaveJSProperty('count',0);
 await editor(page).dispatchEvent('compositionend',{bubbles:true,composed:true});await editor(page).press('Meta+Enter');await expect(composer(page)).toHaveJSProperty('count',1);await expect(composer(page)).toHaveJSProperty('sending',false);await expect(editor(page)).toHaveValue('日本語');await expect(composer(page).getByRole('status')).toContainText('declined');
});
test('sending, validation and disabled/read-only native editors guard requests; dynamic replacement works',async({page})=>{
 await load(page);
 const result=await composer(page).evaluate(async(el:any)=>{
  const native=document.createElement('textarea');native.slot='editor';native.setAttribute('aria-label','Native draft');native.required=true;el.querySelector('en-textarea').replaceWith(native);await new Promise(r=>requestAnimationFrame(r));
  const outcomes=[el.requestSend()];native.value='Native text';native.readOnly=true;outcomes.push(el.requestSend());native.readOnly=false;native.disabled=true;outcomes.push(el.requestSend());native.disabled=false;el.sending=true;outcomes.push(el.requestSend());el.sending=false;
  el.addEventListener('en-action',(event:Event)=>event.preventDefault(),{once:true});outcomes.push(el.requestSend());return {outcomes,value:el.value};
 });expect(result).toEqual({outcomes:[false,false,false,false,false],value:'Native text'});
 await composer(page).evaluate((el:any)=>el.focus());await expect(demo(page).getByRole('textbox',{name:'Native draft'})).toBeFocused();
});
test('contextual action is explicit and messages do not steal focus',async({page})=>{
 await load(page);await demo(page).getByRole('button',{name:'Use suggestion'}).click();await expect(editor(page)).toBeFocused();await expect(editor(page)).toHaveValue(/60%/);
 await editor(page).press('Control+Enter');await editor(page).fill('Keep my focus');await demo(page).getByRole('button',{name:'Complete send'}).evaluate((el:HTMLElement)=>el.click());await expect(editor(page)).toBeFocused();await expect(editor(page)).toHaveValue('Keep my focus');
});
test('message slots accept later rich content without empty-region reservation',async({page})=>{
 await load(page);const message=demo(page).locator('#chat-message-example');await message.evaluate(el=>{const node=document.createElement('blockquote');node.slot='attachments';node.textContent='Quoted study brief';el.append(node);});await expect(message.getByRole('blockquote')).toContainText('Quoted study brief');
 await message.locator('blockquote').evaluate(el=>el.remove());expect(await message.evaluate(el=>el.shadowRoot!.querySelector('[part=attachments]')!.getBoundingClientRect().height)).toBe(0);
});
test('inspired themes stay bounded on narrow RTL layouts and pass baseline accessibility',async({page})=>{
 await page.setViewportSize({width:390,height:844});await load(page);await demo(page).evaluate(el=>el.setAttribute('dir','rtl'));await demo(page).locator('input[type=file]').setInputFiles([{name:'cover.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90"><rect width="160" height="90" fill="#2457d6"/></svg>')},{name:'brief.pdf',mimeType:'application/pdf',buffer:Buffer.from('local fixture')}]);
 await editor(page).fill('Review these attachments');await demo(page).getByRole('button',{name:'Send message',exact:true}).click();await demo(page).getByRole('button',{name:'Fail send'}).click();
 const theme=page.getByRole('combobox',{name:'Inspired theme'});
 for(const name of ['spectrum','fluent','astryx','shadcn','holotable']){
  await theme.selectOption(name+'-inspired');await expect(page.getByRole('status',{name:'Theme result'})).not.toBeEmpty();
  const bounds=await composer(page).evaluate(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,scroll:document.documentElement.scrollWidth,width:innerWidth};});expect(bounds.left).toBeGreaterThanOrEqual(0);expect(bounds.right).toBeLessThanOrEqual(391);expect(bounds.scroll).toBeLessThanOrEqual(bounds.width+1);
 }
 await demo(page).screenshot({path:test.info().outputPath('en-chat-mobile-'+test.info().project.name+'.png')});
 expect((await new AxeBuilder({page}).include('[data-chat-patterns-demo]').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
});
test('full source and both API guides include state and slot ownership',async({page})=>{
 await load(page);await expect(page.getByText('View example code',{exact:false})).toBeVisible();
 for(const tag of ['en-chat-message','en-chat-composer']){await page.goto(`/api-reference.html?component=${tag}`);await expect(page.locator('#api-chat-guide')).toContainText('requestSend()');await expect(page.locator('#api-chat-guide')).toContainText('slot');}
});
test('forwarded editors retain identity and send follows later assignment',async({page})=>{
 await load(page);await page.evaluate(()=>{const wrapper=document.createElement('div');wrapper.id='forward-composer';wrapper.attachShadow({mode:'open'}).innerHTML='<en-chat-composer><slot name="draft" slot="editor"></slot></en-chat-composer>';wrapper.innerHTML='<textarea slot="draft" aria-label="Forwarded draft">Original</textarea>';document.body.append(wrapper);});
 const wrapper=page.locator('#forward-composer');const forwarded=wrapper.locator('en-chat-composer');await forwarded.evaluate((el:any)=>{el.addEventListener('en-action',(event:CustomEvent)=>{el.sent=event.detail.data.value;event.preventDefault();});});
 await wrapper.getByRole('textbox',{name:'Forwarded draft'}).fill('Through a slot');await wrapper.getByRole('button',{name:'Send message'}).click();await expect(forwarded).toHaveJSProperty('sent','Through a slot');
 await wrapper.locator('textarea').evaluate(el=>{const next=document.createElement('textarea');next.slot='draft';next.value='Replacement';next.setAttribute('aria-label','Replacement draft');el.replaceWith(next);});await wrapper.getByRole('button',{name:'Send message'}).click();await expect(forwarded).toHaveJSProperty('sent','Replacement');
});
test('attachment-only sends are allowed while selected and blank requests are blocked again after clearing',async({page})=>{
 await load(page);await demo(page).locator('input[type=file]').setInputFiles({name:'attachment.pdf',mimeType:'application/pdf',buffer:Buffer.from('local')});await expect(composer(page)).toHaveJSProperty('allowEmpty',true);await demo(page).getByRole('button',{name:'Send message',exact:true}).click();await expect(composer(page)).toHaveJSProperty('sending',true);await demo(page).getByRole('button',{name:'Complete send'}).click();await expect(composer(page)).toHaveJSProperty('allowEmpty',false);expect(await composer(page).evaluate((el:any)=>el.requestSend())).toBe(false);await expect(demo(page).locator('en-chat-message').last()).toContainText('attachment.pdf');
});
test('custom send slot has one accessible action in initial HTML and reacts to removal',async({page,browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false});try{const server=await context.newPage();await server.goto('/workflows/chat');await expect(server.locator('#chat en-chat-composer').first().getByRole('button',{name:'Send message',exact:true})).toHaveCount(1);}finally{await context.close();}
 await load(page);await composer(page).evaluate(el=>{const button=document.createElement('button');button.slot='send';button.textContent='Custom send';el.append(button);});await expect(composer(page).getByRole('button',{name:'Send message',exact:true})).toHaveCount(0);await expect(composer(page).getByRole('button',{name:'Custom send'})).toHaveCount(1);await composer(page).locator('button[slot=send]').evaluate(el=>el.remove());await expect(composer(page).getByRole('button',{name:'Send message',exact:true})).toHaveCount(1);
});
const cover={name:'cover.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90"><rect width="160" height="90" fill="#2457d6"/></svg>')};
test('selected and sent attachments show visual tiles with local preview and focus recovery',async({page})=>{
 await load(page);await demo(page).locator('input[type=file]').setInputFiles([cover,{name:'brief.pdf',mimeType:'application/pdf',buffer:Buffer.from('local fixture')}]);
 const selected=composer(page).getByRole('list',{name:'Selected attachments'});await expect(selected.locator('img')).toBeVisible();await expect.poll(()=>selected.locator('img').evaluate((img:HTMLImageElement)=>img.naturalWidth)).toBe(160);await expect(selected).toContainText('brief.pdf');await expect(selected).toContainText('PDF');
 const preview=selected.getByRole('button',{name:'Preview cover.svg',exact:true});await preview.click();const dialog=demo(page).getByRole('dialog',{name:'Attachment preview: cover.svg'});await expect(dialog).toBeVisible();await expect(demo(page).locator('en-dialog img')).toHaveAttribute('alt','cover.svg');await expect(demo(page).getByRole('link',{name:'Download cover.svg'})).toHaveAttribute('download','cover.svg');await page.keyboard.press('Escape');await expect(preview).toBeFocused();
 await selected.getByRole('button',{name:'Remove brief.pdf',exact:true}).click();await expect(selected).not.toContainText('brief.pdf');await expect(demo(page).locator('input[type=file]')).toBeFocused();await editor(page).fill('Visual study');await demo(page).getByRole('button',{name:'Send message',exact:true}).click();const message=demo(page).locator('en-chat-message').last();await expect(message.locator('img')).toBeVisible();await expect(message.getByRole('button',{name:/Remove/})).toHaveCount(0);await demo(page).getByRole('button',{name:'Complete send'}).click();await message.getByRole('button',{name:'Preview cover.svg',exact:true}).click();await expect(dialog).toBeVisible();
});
test('retry uses the original message and files while a newer draft and selection stay intact',async({page})=>{
 await load(page);await editor(page).fill('Original message');await demo(page).locator('input[type=file]').setInputFiles(cover);await demo(page).getByRole('button',{name:'Send message',exact:true}).click();await demo(page).getByRole('button',{name:'Fail send'}).click();const message=demo(page).locator('en-chat-message').last();
 await editor(page).fill('Newer draft');await demo(page).locator('input[type=file]').setInputFiles({name:'new.pdf',mimeType:'application/pdf',buffer:Buffer.from('new')});const retry=message.getByRole('button',{name:'Retry message',exact:true});await retry.click();await expect(retry).toBeFocused();await expect(retry).toBeDisabled();await retry.press('Enter');await expect(demo(page).locator('en-chat-message')).toHaveCount(2);await demo(page).getByRole('button',{name:'Complete send'}).evaluate((el:HTMLElement)=>el.click());await expect(message.getByRole('article')).toBeFocused();await expect(message).toContainText('Original message');await expect(message).toContainText('cover.svg');await expect(message).not.toContainText('new.pdf');await expect(message).toContainText('Sent locally');await expect(editor(page)).toHaveValue('Newer draft');expect(await demo(page).locator('en-file-upload').evaluate((el:any)=>el.files.map((file:File)=>file.name))).toEqual(['new.pdf']);
});
test('broken images keep filename fallback and unused blob URLs are released',async({page})=>{
 await load(page);await page.evaluate(()=>{const original=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL);(window as any).created=[];(window as any).revoked=[];URL.createObjectURL=(file:Blob)=>{const url=original(file);(window as any).created.push(url);return url;};URL.revokeObjectURL=(url:string)=>{(window as any).revoked.push(url);revoke(url);};});
 await demo(page).locator('input[type=file]').setInputFiles({name:'broken.png',mimeType:'image/png',buffer:Buffer.from('not an image')});const selected=composer(page).getByRole('list',{name:'Selected attachments'});await expect(selected).toContainText('Image preview unavailable');await expect(selected).toContainText('broken.png');await selected.getByRole('button',{name:'Remove broken.png'}).click();expect(await page.evaluate(()=>(window as any).revoked.length)).toBe(1);
 await demo(page).locator('input[type=file]').setInputFiles(cover);await expect(selected.locator('img')).toBeVisible();await page.getByRole('button',{name:'Reset example',exact:true}).click();await expect.poll(()=>page.evaluate(()=>({created:(window as any).created,revoked:(window as any).revoked}))).toEqual(await page.evaluate(()=>({created:(window as any).created,revoked:(window as any).created})));
 await demo(page).locator('input[type=file]').setInputFiles(cover);await expect(composer(page).locator('img')).toBeVisible();await page.locator('en-api-example-app').evaluate(el=>el.remove());await expect.poll(()=>page.evaluate(()=>({created:(window as any).created,revoked:(window as any).revoked}))).toEqual(await page.evaluate(()=>({created:(window as any).created,revoked:(window as any).created})));
});
