import {test,expect,type Page} from '@playwright/test';
const textFile=(name='brief.txt',body='Draft')=>({name,mimeType:'text/plain',buffer:Buffer.from(body)});
async function drop(page:Page,files:{name:string;type:string;body:string}[]){const transfer=await page.evaluateHandle(files=>{const d=new DataTransfer();for(const f of files)d.items.add(new File([f.body],f.name,{type:f.type}));return d;},files);const zone=page.locator('#uploads .en-file-drop');await zone.dispatchEvent('dragover',{dataTransfer:transfer});await zone.dispatchEvent('drop',{dataTransfer:transfer});await transfer.dispose();}
for(const delivery of ['lit','css'])test.describe(delivery,()=>{
 test.beforeEach(async({page})=>{await page.goto('/?delivery='+delivery);await expect(page.locator('body')).toHaveAttribute('data-ready','true');});
 test('steps project rich labels, native disabled/current semantics and cancelable selection',async({page})=>{
  const host=page.locator('#steps'),review=host.getByRole('button',{name:'Review brief pending'});
  await expect(host.getByRole('listitem')).toHaveCount(3);await expect(host.getByRole('button',{name:'Project details complete'})).toHaveAttribute('aria-current','step');await expect(host.getByRole('button',{name:'Publish pending'})).toBeDisabled();
  await review.focus();await review.press('Enter');await expect(review).toHaveAttribute('aria-current','step');
  await host.evaluate(node=>node.addEventListener('en-change',e=>{(window as any).tentative=(node as any).value;e.preventDefault();},{once:true}));
  await host.getByRole('button',{name:'Project details complete'}).click();await expect(review).toHaveAttribute('aria-current','step');expect(await page.evaluate(()=>(window as any).tentative)).toBe('details');
  await expect(page.locator('#other').getByRole('button')).toHaveAttribute('aria-current','step');
 });
 test('steps preserve focused controls and label identity across mutations and silent author writes',async({page})=>{
  const host=page.locator('#steps'),first=host.getByRole('button',{name:'Project details complete'});await first.focus();await first.evaluate(n=>(window as any).control=n);
  await host.evaluate(n=>{(window as any).label=n.firstElementChild;n.firstElementChild!.querySelector('strong')!.textContent='Working';n.children[1]!.setAttribute('status','error');});
  const renamed=host.getByRole('button',{name:'Working details complete'});await expect(renamed).toBeFocused();expect(await renamed.evaluate(n=>n===(window as any).control)).toBe(true);expect(await host.evaluate(n=>n.firstElementChild===(window as any).label)).toBe(true);
  await expect(host.getByRole('button',{name:'Review brief error'})).toHaveAttribute('data-status','error');
  await host.evaluate(n=>{(window as any).changes=0;n.addEventListener('en-change',()=>((window as any).changes++));(n as any).value='review';});await expect(host.getByRole('button',{name:'Review brief error'})).toHaveAttribute('aria-current','step');expect(await page.evaluate(()=>(window as any).changes)).toBe(0);
 });
 test('steps reject invalid labels and stale transactions, then recover',async({page})=>{
  const host=page.locator('#steps');await host.evaluate(n=>n.addEventListener('en-change',()=>n.children[1]!.setAttribute('disabled',''),{once:true}));await host.getByRole('button',{name:'Review brief pending'}).click();await expect(host.getByRole('button',{name:'Project details complete'})).toHaveAttribute('aria-current','step');
  await host.evaluate(n=>{const b=document.createElement('button');b.textContent='Nested action';n.firstElementChild!.append(b);});await expect(host.getByRole('status')).toContainText('noninteractive');await expect(host.getByRole('listitem')).toHaveCount(0);
  await host.evaluate(n=>n.querySelector('button')!.remove());await expect(host.getByRole('listitem')).toHaveCount(3);
  await host.evaluate(n=>n.children[1]!.setAttribute('value','details'));await expect(host.getByRole('status')).toContainText('unique');await host.evaluate(n=>n.children[1]!.setAttribute('value','review'));await expect(host.getByRole('listitem')).toHaveCount(3);
 });
 test('authored steps hide, reorder, disconnect and transfer without retaining foreign slots',async({page})=>{
  const host=page.locator('#steps');await host.evaluate(n=>{n.children[1]!.setAttribute('hidden','');(window as any).detached=n;});await expect(host.getByRole('listitem')).toHaveCount(2);
  await host.evaluate(n=>n.remove());expect(await page.evaluate(()=>[...(window as any).detached.children].every(n=>!n.hasAttribute('slot')))).toBe(true);
  await page.evaluate(()=>{const n=(window as any).detached;n.children[1].removeAttribute('hidden');n.prepend(n.children[1]);document.querySelector('main')!.prepend(n);});await expect(host.getByRole('button').first()).toHaveAccessibleName('Review brief pending');
  await page.locator('#other').evaluate(n=>n.append((window as any).detached.lastElementChild));await expect(page.locator('#other').getByRole('button',{name:'Publish pending'})).toBeDisabled();await expect(host.getByRole('button',{name:'Publish pending'})).toHaveCount(0);
 });
 test('validation projection preserves native anchor activation, focus, listeners and authored history',async({page,browserName})=>{
  const host=page.locator('#errors'),first=host.getByRole('link',{name:'Project name is required'});await first.evaluate(n=>(window as any).originalError=n);await first.focus();await first.press('Enter');await expect(page).toHaveURL(/#project-name$/);await expect(page.getByRole('textbox',{name:'Project name',exact:true})).toBeFocused();await expect(first).toHaveAttribute('data-clicks','1');
  await first.focus();await first.press(browserName==='webkit'?'Alt+Tab':'Tab');await expect(host.getByRole('link',{name:'Email is required'})).toBeFocused();
  await host.evaluate(n=>n.firstElementChild!.querySelector('strong')!.textContent='Brief title');expect(await host.getByRole('link',{name:'Brief title is required'}).evaluate(n=>n===(window as any).originalError)).toBe(true);
  await host.getByRole('link').last().evaluate(n=>n.addEventListener('click',e=>e.preventDefault(),{once:true}));await host.getByRole('link').last().click();await expect(page).toHaveURL(/#project-name$/);
 });
 test('validation projection handles hidden, invalid href and reconnect without cloning anchors',async({page})=>{
  const host=page.locator('#errors');await host.evaluate(n=>n.lastElementChild!.setAttribute('hidden',''));await expect(host.getByRole('link')).toHaveCount(1);
  await host.evaluate(n=>n.firstElementChild!.setAttribute('href','https://example.test'));await expect(host.getByRole('status')).toContainText('same-document');await expect(host.getByRole('link')).toHaveCount(0);
  await host.evaluate(n=>{n.firstElementChild!.setAttribute('href','#email');(window as any).errors=n;n.remove();});expect(await page.evaluate(()=>[...(window as any).errors.children].every(n=>!n.hasAttribute('slot')))).toBe(true);
  await page.evaluate(()=>document.querySelector('main')!.append((window as any).errors));await host.getByRole('link',{name:'Project name is required'}).click();await expect(page.getByRole('textbox',{name:'Email',exact:true})).toBeFocused();
 });
 test('native file picker accepts batches and submits actual File bytes with independent reset',async({page})=>{
  const host=page.locator('#uploads');await host.getByLabel('Choose project files', {exact:true}).setInputFiles([textFile(),{name:'cover.PNG',mimeType:'image/png',buffer:Buffer.from('PNG')}]);await expect(host.locator('.en-file-name')).toHaveText(['brief.txt','cover.PNG']);
  expect(await host.evaluate(async n=>Promise.all([...new FormData(n.shadowRoot!.querySelector('form')!).getAll('uploads')].map(async f=>[(f as File).name,await (f as File).text()])))).toEqual([['brief.txt','Draft'],['cover.PNG','PNG']]);
  await host.getByRole('button',{name:'Send files',exact:true}).click();await expect(host.getByLabel('Submitted files')).toHaveText('brief.txt, cover.PNG');await expect(page.locator('#backup .en-file-list')).toBeHidden();
  await host.getByRole('button',{name:'Reset files',exact:true}).click();await expect(host.locator('.en-file-list')).toBeHidden();expect(await host.evaluate(n=>new FormData(n.shadowRoot!.querySelector('form')!).getAll('uploads').length)).toBe(0);
 });
 test('file constraints reject the whole mixed batch and report every applicable reason',async({page})=>{
  const host=page.locator('#uploads');await host.locator('input').setInputFiles(textFile());await drop(page,[{name:'good.TXT',type:'text/plain',body:'ok'},{name:'bad.bin',type:'application/octet-stream',body:'too large file'}]);await expect(host.locator('.en-file-name')).toHaveText(['brief.txt']);await expect(host.locator('#rejection')).toHaveText('bad.bin: accept; bad.bin: max-file-size');
  await host.evaluate(n=>n.setAttribute('single',''));await drop(page,[{name:'a.txt',type:'text/plain',body:'a'},{name:'b.txt',type:'text/plain',body:'b'}]);await expect(host.locator('#rejection')).toContainText('a.txt: multiple');await expect(host.locator('#rejection')).toContainText('b.txt: multiple');await expect(host.locator('.en-file-name')).toHaveText(['brief.txt']);
  await host.evaluate(n=>{n.setAttribute('accept','nonsense');n.removeAttribute('single');});await drop(page,[{name:'allowed.bin',type:'application/octet-stream',body:'ok'}]);await expect(host.locator('.en-file-name')).toHaveText(['allowed.bin']);await expect(host.locator('#rejection')).toBeEmpty();
 });
 test('native file transactions stage FormData, veto, honor author authority and remove separately',async({page})=>{
  const host=page.locator('#uploads');await host.locator('input').setInputFiles(textFile());
  await host.evaluate(n=>n.addEventListener('en-change',e=>{(window as any).staged=new FormData(n.shadowRoot!.querySelector('form')!).getAll('uploads').map(f=>(f as File).name);e.preventDefault();},{once:true}));await host.locator('input').setInputFiles(textFile('second.txt'));expect(await page.evaluate(()=>(window as any).staged)).toEqual(['second.txt']);await expect(host.locator('.en-file-name')).toHaveText(['brief.txt']);
  await host.evaluate(n=>n.addEventListener('en-change',e=>{(n as any).files=[new File(['App'],'author.txt',{type:'text/plain'})];e.preventDefault();},{once:true}));await host.locator('input').setInputFiles(textFile('ignored.txt'));await expect(host.locator('.en-file-name')).toHaveText(['author.txt']);
  await host.getByRole('button',{name:'Remove author.txt',exact:true}).click();await expect(host.locator('.en-file-list')).toBeHidden();await host.locator('input').setInputFiles(textFile());await expect(host.locator('.en-file-name')).toHaveText(['brief.txt']);
 });
 test('disabled file control rejects drop and submission; reset remains authoritative',async({page})=>{
  const host=page.locator('#uploads');await host.locator('input').setInputFiles(textFile());await host.evaluate(n=>{n.setAttribute('disabled','');(n as any).requestUpdate();});await expect(host.locator('input')).toBeDisabled();await drop(page,[{name:'ignored.txt',type:'text/plain',body:'a'}]);await expect(host.locator('.en-file-name')).toHaveText(['brief.txt']);expect(await host.evaluate(n=>new FormData(n.shadowRoot!.querySelector('form')!).getAll('uploads').length)).toBe(0);await expect(host.locator('.en-file-drop')).not.toHaveAttribute('data-dragging');await host.getByRole('button',{name:'Reset files',exact:true}).click();await expect(host.locator('.en-file-list')).toBeHidden();
 });
 test('portable and Lit styles honor scoped pins, native focus and drag feedback',async({page,browserName})=>{
  const host=page.locator('#uploads'),zone=host.locator('.en-file-drop');await expect(zone).toHaveCSS('border-radius','12px');await expect(zone).toHaveCSS('border-top-style','dashed');await expect(page.locator('#errors .en-validation-summary')).toHaveCSS('border-radius','10px');await expect(page.locator('#errors .en-validation-summary')).toHaveCSS('padding-top','16px');
  await host.locator('input').focus();await page.keyboard.press(browserName==='webkit'?'Alt+Tab':'Tab');await page.keyboard.press(browserName==='webkit'?'Alt+Shift+Tab':'Shift+Tab');await expect(host.locator('input')).toBeFocused();expect(await zone.evaluate(n=>{const s=getComputedStyle(n);return s.outlineStyle!=='none'||s.boxShadow!=='none';})).toBe(true);
  await zone.dispatchEvent('dragover');await expect(zone).toHaveCSS('border-top-style','solid');await zone.dispatchEvent('dragleave');await expect(zone).toHaveCSS('border-top-style','dashed');
  await host.evaluate(n=>n.style.setProperty('--en-control-radius','3px'));await expect(zone).toHaveCSS('border-radius','3px');await expect(page.locator('#backup .en-file-drop')).toHaveCSS('border-radius','12px');
  expect(await host.locator('link').count()).toBe(delivery==='css'?1:0);
 });
 test('long names remain readable at enlarged narrow RTL with visible forced-color boundaries',async({page})=>{
  await page.setViewportSize({width:320,height:800});await page.evaluate(()=>{document.documentElement.dir='rtl';document.documentElement.style.fontSize='24px';});await page.locator('#uploads input').setInputFiles(textFile('a-very-long-project-file-name-that-must-wrap-around.txt'));expect(await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth,overflow:[...document.querySelectorAll('main,main>*,input')].filter(n=>n.getBoundingClientRect().right>innerWidth+1||n.getBoundingClientRect().left< -1).map(n=>n.tagName+'#'+n.id)}))).toMatchObject({scroll:320,width:320,overflow:[]});await page.emulateMedia({forcedColors:'active'});await expect(page.locator('#uploads .en-file-drop')).toHaveCSS('border-top-style','dashed');expect(await page.locator('#uploads .en-file-drop').evaluate(n=>getComputedStyle(n).borderTopWidth)).not.toBe('0px');
 });
});
