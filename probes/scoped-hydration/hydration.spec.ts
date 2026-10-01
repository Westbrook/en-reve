import {test,expect} from '@playwright/test';
async function open(page:any,path='shadow.html'){await page.goto('/'+path);await page.waitForFunction(()=>!!(window as any).fixture);}
for(const delivery of ['shadow','global'])test(`${delivery}: preserve pre-hydration draft, focus, selection, form and shadow identity`,async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await open(page,`${delivery}.html?hold`);
 const field=page.getByRole('textbox',{name:'Draft',exact:true});await field.fill('User draft');await field.evaluate((el:any)=>el.setSelectionRange(2,5));
 await page.evaluate(()=>{const f=(window as any).fixture;f.input=f.roots[0].querySelector('input');f.message=f.roots[0].querySelector('test-scoped-message');f.shadow=f.message.shadowRoot;f.button=f.roots[0].querySelector('en-button').shadowRoot.querySelector('button');f.pending=f.islands[0].activate();f.snapshots[0].message='Mutation after submission';});
 await expect(field).toHaveValue('User draft');await page.evaluate(()=>{(window as any).fixture.release();return (window as any).fixture.pending;});
 await expect(field).toBeFocused();await expect(field).toHaveValue('User draft');
 expect(await page.evaluate(()=>{const f=(window as any).fixture;return {sameInput:f.input===f.roots[0].querySelector('input'),sameShadow:f.shadow===f.message.shadowRoot,sameButton:f.button===f.roots[0].querySelector('en-button').shadowRoot.querySelector('button'),selection:[f.input.selectionStart,f.input.selectionEnd],value:new FormData(f.roots[0].querySelector('form')).get('draft'),valid:f.input.checkValidity(),state:f.islands[0].state};})).toEqual({sameInput:true,sameShadow:true,sameButton:true,selection:[2,5],value:'User draft',valid:true,state:'ready'});
 await expect(page.getByText('Version one: Initial')).toBeVisible();expect(errors).toEqual([]);
 await page.evaluate(()=>{(window as any).fixture.roots[0].querySelector('form').reset();});await expect(field).toHaveValue('Initial');
});
test('two versions hydrate independently when native scopes are available',async({page})=>{
 await open(page,'shadow-dual.html');test.skip(await page.evaluate(()=>(window as any).fixture.islands[0].mode!=='scoped'),'Native registry unavailable; global version isolation is deliberately unsupported.');
 await page.evaluate(()=>(window as any).fixture.islands[0].activate());
 expect(await page.evaluate(()=>{const f=(window as any).fixture;return [f.roots[0].querySelector('test-scoped-message').matches(':defined'),f.roots[1].querySelector('test-scoped-message').matches(':defined')];})).toEqual([true,false]);
 await page.evaluate(()=>(window as any).fixture.islands[1].activate());await expect(page.getByText('Version one: Initial')).toBeVisible();await expect(page.getByText('Version two: Second')).toBeVisible();
});
test('load failure preserves native content and explicit retry hydrates once',async({page})=>{
 await open(page,'shadow.html?fail');await page.getByRole('textbox',{name:'Draft',exact:true}).fill('Keep me');
 expect(await page.evaluate(()=>(window as any).fixture.islands[0].activate().then(()=>'',(e:Error)=>e.message))).toContain('Intentional');
 await expect(page.getByRole('textbox',{name:'Draft',exact:true})).toHaveValue('Keep me');await page.evaluate(()=>(window as any).fixture.islands[0].activate({retry:true}));
 expect(await page.evaluate(()=>(window as any).fixture.attempts)).toBe(2);await expect(page.getByRole('textbox',{name:'Draft',exact:true})).toHaveValue('Keep me');
});
test('disposal during delayed loading never upgrades the boundary',async({page})=>{
 await open(page,'shadow.html?hold');await page.evaluate(()=>{const f=(window as any).fixture;f.pending=f.islands[0].activate().catch((e:Error)=>e.name);});
 await expect.poll(()=>page.evaluate(()=>(window as any).fixture.attempts)).toBe(1);
 expect(await page.evaluate(async()=>{const f=(window as any).fixture;f.islands[0].dispose();return await f.pending;})).toBe('AbortError');
 expect(await page.evaluate(()=>(window as any).fixture.roots[0].querySelector('test-scoped-message').matches(':defined'))).toBe(false);
});
test('native content and validation remain available with JavaScript disabled',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false}),page=await context.newPage();try{await page.goto('http://127.0.0.1:4225/shadow.html');await expect(page.getByRole('textbox',{name:'Draft',exact:true})).toHaveValue('Initial');await expect(page.getByText('Version one: Initial')).toBeVisible();}finally{await context.close();}
});

test('inert fallback isolates same-tag instances after the global definition exists',async({page})=>{
 await open(page,'template-dual.html');await page.getByRole('textbox',{name:'Essential draft'}).fill('Untouched');
 await page.evaluate(()=>(window as any).fixture.islands[0].activate());
 expect(await page.evaluate(()=>{const f=(window as any).fixture;return [f.roots[0].querySelectorAll('test-scoped-message').length,f.roots[1].querySelectorAll('test-scoped-message').length];})).toEqual([1,0]);
 await page.evaluate(()=>(window as any).fixture.islands[1].activate());await expect(page.getByText('Version one: Initial')).toBeVisible();await expect(page.getByText('Version one: Second')).toBeVisible();
 await expect(page.getByRole('textbox',{name:'Essential draft'})).toHaveValue('Untouched');
});
test('incremental HTML retains user edits and synthetic composition through hydration',async({page})=>{
 await page.goto('/stream.html?hold',{waitUntil:'commit'});const field=page.getByRole('textbox',{name:'Draft',exact:true});await field.fill('Early edit');
 const handle=await field.elementHandle();await field.evaluate((el:any)=>{el.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true,composed:true}));el.setSelectionRange(1,4);});
 await page.waitForFunction(()=>!!(window as any).fixture);await page.evaluate(()=>{const f=(window as any).fixture;f.release();return f.islands[0].activate();});
 await expect(field).toHaveValue('Early edit');await expect(field).toBeFocused();expect(await field.evaluate((el,original)=>el===original,handle)).toBe(true);
 expect(await field.evaluate((el:any)=>[el.selectionStart,el.selectionEnd])).toEqual([1,4]);await field.evaluate(el=>el.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true,composed:true,data:'Early edit'})));
});
test('real failed chunk preserves editing and qualifies explicit retry',async({page,browserName},info)=>{
 let requests=0;await page.route('**/one-*.js',async route=>{requests++;if(requests===1)await route.abort('failed');else await route.continue();});
 await open(page);const field=page.getByRole('textbox',{name:'Draft',exact:true});await field.fill('Retain after failure');
 expect(await page.evaluate(()=>(window as any).fixture.islands[0].activate().then(()=>false,()=>true))).toBe(true);
 await expect(field).toHaveValue('Retain after failure');
 const retry=await page.evaluate(()=>(window as any).fixture.islands[0].activate({retry:true}).then(()=>true,()=>false));
 await expect(field).toHaveValue('Retain after failure');await expect(page.getByRole('button',{name:'Native save'})).toBeEnabled();
 await info.attach('network-retry',{body:JSON.stringify({browserName,retry,requests}),contentType:'application/json'});
 expect(await page.evaluate(()=>(window as any).fixture.islands[0].state)).toBe(retry?'ready':'error');
});

test('load-only preparation coalesces and scoped template activation contains upgrades',async({page})=>{
 await open(page,'template-dual.html?scoped-template');
 await page.evaluate(()=>Promise.all([(window as any).fixture.islands[0].load(),(window as any).fixture.islands[0].load()]));
 expect(await page.evaluate(()=>{const f=(window as any).fixture;return {attempts:f.attempts,states:f.islands.map((x:any)=>x.state),live:f.roots.map((r:any)=>r.querySelectorAll('en-button').length)};})).toEqual({attempts:1,states:['dormant','dormant'],live:[0,0]});
 await page.evaluate(()=>(window as any).fixture.islands[0].activate());await expect(page.getByText('Version one: Initial')).toBeVisible();
 expect(await page.evaluate(()=>(window as any).fixture.roots[1].querySelectorAll('en-button').length)).toBe(0);
 expect(await page.locator('#first > template[data-en-island-template]').count()).toBe(0);
 await page.evaluate(()=>(window as any).fixture.islands[1].activate());await expect(page.getByText('Version one: Second')).toBeVisible();
});

test('adopting a pending boundary into another document prevents later upgrade',async({page})=>{
 await open(page,'shadow.html?hold');await page.evaluate(()=>{const f=(window as any).fixture;f.pending=f.islands[0].activate().then(()=>'',(e:Error)=>e.name);});
 await expect.poll(()=>page.evaluate(()=>(window as any).fixture.attempts)).toBe(1);
 expect(await page.evaluate(async()=>{const f=(window as any).fixture,other=document.implementation.createHTMLDocument();other.body.append(other.adoptNode(document.getElementById('first')));f.release();return await f.pending;})).toBe('AbortError');
 expect(await page.evaluate(()=>(window as any).fixture.islands[0].state)).toBe('error');
});

test('ordinary element scopes materialize independently and adopt static styles',async({page})=>{
 await open(page,'template-dual.html?light-template');await page.evaluate(()=>(window as any).fixture.islands[0].activate());
 expect(await page.evaluate(()=>{const f=(window as any).fixture,b=f.roots[0].querySelector('en-button');return {rootIsElement:f.roots[0].nodeType===1,secondDormant:!f.roots[1].querySelector('en-button'),sheets:b.shadowRoot.adoptedStyleSheets.length>0,message:getComputedStyle(f.roots[0].querySelector('test-scoped-message')).color};})).toEqual({rootIsElement:true,secondDormant:true,sheets:true,message:'rgb(21, 90, 60)'});
 await page.evaluate(()=>(window as any).fixture.islands[1].activate());
 expect(await page.evaluate(()=>{const f=(window as any).fixture;return f.roots[0].querySelector('en-button').shadowRoot.adoptedStyleSheets[0]===f.roots[1].querySelector('en-button').shadowRoot.adoptedStyleSheets[0];})).toBe(true);
});
test('restored native field state without input events survives hydration and reset',async({page})=>{
 await open(page,'shadow.html?hold');const field=page.getByRole('textbox',{name:'Draft',exact:true});
 await field.evaluate((el:any)=>{el.value='Restored draft';el.setSelectionRange(3,7);});
 await page.evaluate(()=>{const f=(window as any).fixture;f.release();return f.islands[0].activate();});
 await expect(field).toHaveValue('Restored draft');expect(await field.evaluate((el:any)=>[el.selectionStart,el.selectionEnd])).toEqual([3,7]);
 await field.fill('');expect(await field.evaluate((el:any)=>el.checkValidity())).toBe(false);
 await page.evaluate(()=>(window as any).fixture.roots[0].querySelector('form').reset());await expect(field).toHaveValue('Initial');
});

for(const delivery of ['shadow','global'])test(`${delivery}: managed text field keeps native identity, editing and accepted form value`,async({page})=>{
 await open(page,`form-${delivery}.html?hold`);const field=page.getByRole('textbox',{name:'Project',exact:true});await field.fill('Before enhancement');
 const original=await field.elementHandle();await field.evaluate((el:any)=>el.setSelectionRange(2,6));
 await page.evaluate(()=>{const f=(window as any).fixture;f.release();return f.islands[0].activate();});
 await expect(field).toHaveValue('Before enhancement');await expect(field).toBeFocused();expect(await field.evaluate((el,prior)=>el===prior,original)).toBe(true);
 expect(await field.evaluate((el:any)=>[el.selectionStart,el.selectionEnd])).toEqual([2,6]);
 expect(await page.evaluate(()=>new FormData((window as any).fixture.roots[0].querySelector('form')).get('project'))).toBe('Before enhancement');
 await page.evaluate(()=>(window as any).fixture.roots[0].querySelector('form').reset());await expect(field).toHaveValue('Initial');
});
