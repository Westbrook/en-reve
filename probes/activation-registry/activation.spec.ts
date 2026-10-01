import {test,expect} from '@playwright/test';
for(const variant of ['group','dormant','fallback']){
 test(`${variant}: load only and selected activation contain same-tag upgrades`,async({page})=>{
  await page.goto('/?policy='+variant+(variant==='fallback'?'&global':''));await page.waitForFunction(()=>!!(window as any).fixture);
  const start=await page.evaluate(()=>{const f=(window as any).fixture;f.add(5);f.add(5);return f.state();});expect(start.constructed).toBe(0);
  await page.evaluate(()=>(window as any).fixture.load(0));let s=await page.evaluate(()=>(window as any).fixture.state());expect(s.imports).toBe(1);expect(s.constructed).toBe(0);expect(s.entries[0].defined).toBe(false);
  expect(await page.evaluate(()=>(window as any).fixture.activate(0))).toEqual({ok:true});s=await page.evaluate(()=>(window as any).fixture.state());expect(s.constructed).toBe(5);expect(s.entries[0].state).toBe('ready');expect(s.entries[1].upgraded).toBe(0);expect(s.entries[1].nodes).toBe(s.native?5:0);expect(s.entries[0].identity).toBe(true);
  await page.evaluate(async()=>{const f=(window as any).fixture;await Promise.all([f.activate(1),f.activate(1)]);});s=await page.evaluate(()=>(window as any).fixture.state());expect(s.imports).toBe(1);expect(s.constructed).toBe(10);expect(s.renders).toBe(2);
  expect(await page.locator('input[name=name]').inputValue()).toBe('Preserved draft');expect(await page.locator('form').evaluate((f:HTMLFormElement)=>f.checkValidity())).toBe(true);
 });
 test(`${variant}: canceled/disconnected/disposed loads never activate late`,async({page})=>{
  await page.goto('/?policy='+variant+(variant==='fallback'?'&global':''));await page.waitForFunction(()=>!!(window as any).fixture);
  await page.evaluate(()=>{const f=(window as any).fixture;f.hold();for(let i=0;i<3;i++)f.add();(window as any).pending=[0,1,2].map(i=>f.activate(i));});
  await page.evaluate(()=>{const f=(window as any).fixture;f.cancel(0);f.remove(1);f.dispose(2);f.release();});
  const result=await page.evaluate(async()=>({results:await Promise.all((window as any).pending),state:(window as any).fixture.state()}));expect(result.results.every((r:any)=>!r.ok&&r.name==='AbortError')).toBe(true);expect(result.state.constructed).toBe(0);expect(result.state.entries[2].state).toBe('disposed');expect((await page.evaluate(()=>(window as any).fixture.activate(2))).ok).toBe(false);
  expect(await page.evaluate(()=>(window as any).fixture.activate(0))).toEqual({ok:true});
 });
 test(`${variant}: failure requires explicit retry and preserves eager form/focus`,async({page})=>{
  await page.goto('/?policy='+variant+(variant==='fallback'?'&global':''));await page.waitForFunction(()=>!!(window as any).fixture);await page.locator('input[name=name]').focus();
  await page.evaluate(()=>{const f=(window as any).fixture;f.add();f.fail(true);});expect((await page.evaluate(()=>(window as any).fixture.activate(0))).ok).toBe(false);
  expect(await page.locator('input[name=name]').evaluate(e=>e===document.activeElement)).toBe(true);await page.evaluate(()=>(window as any).fixture.fail(false));expect((await page.evaluate(()=>(window as any).fixture.activate(0))).ok).toBe(false);expect(await page.evaluate(()=>(window as any).fixture.activate(0,true))).toEqual({ok:true});expect((await page.evaluate(()=>(window as any).fixture.state())).imports).toBe(2);
 });
}
test('individual dormant host and explicitly nested shadow roots activate independently',async({page,browserName})=>{
 await page.goto('/?policy=dormant');await page.waitForFunction(()=>!!(window as any).fixture);const native=await page.evaluate(()=>(window as any).fixture.state().native);if(!native){expect(browserName).not.toBe('chromium');return;}
 await page.evaluate(()=>{const f=(window as any).fixture;f.add(0,true);f.add(1,false,true);f.add(2);});await page.evaluate(()=>(window as any).fixture.activate(0));expect((await page.evaluate(()=>(window as any).fixture.state())).constructed).toBe(1);await page.evaluate(()=>(window as any).fixture.activate(1));const s=await page.evaluate(()=>(window as any).fixture.state());expect(s.constructed).toBe(3);expect(s.entries[2].upgraded).toBe(0);
});
test('invalid ownership and changed fallback content reject before global registration',async({page})=>{
 await page.goto('/?global');await page.waitForFunction(()=>!!(window as any).fixture);
 const result=await page.evaluate(async()=>{const f=(window as any).fixture;f.add();f.hold();const pending=f.activate(0);f.entries[0].root.append(document.createElement('p'));f.release();return {result:await pending,state:f.state()};});expect(result.result.ok).toBe(false);expect(result.state.constructed).toBe(0);expect(result.state.entries[0].defined).toBe(false);
});
test('readiness cancellation rejects once and retry preserves materialized input',async({page})=>{
 await page.goto('/?global');await page.waitForFunction(()=>!!(window as any).fixture);
 await page.evaluate(()=>{const f=(window as any).fixture;const root=document.createElement('section'),template=document.createElement('template');template.innerHTML='<en-activation-probe></en-activation-probe>';document.querySelector('#islands')!.append(root);let release:any;let wait=true;const ready=new Promise<void>(r=>release=r);const a=f.api.createElementActivation({scope:f.api.createElementScope({document,registry:'global'}),root,template,loaders:f.api.loaders,tags:['en-activation-probe'],policy:'dormant',ready:()=>wait?ready:undefined});(window as any).readyCase={a,root,release:()=>{wait=false;release();},pending:a.activate().then(()=>true,()=>false)};});
 await expect(page.getByRole('textbox',{name:'Optional draft'})).toBeVisible();await page.getByRole('textbox',{name:'Optional draft'}).fill('Keep me');
 const result=await page.evaluate(async()=>{const t=(window as any).readyCase;const input=t.root.querySelector('input');t.a.cancel();const state=t.a.state;const canceled=await t.pending;t.release();await t.a.activate();return {state,canceled,identity:t.root.querySelector('input')===input,value:input.value,ready:t.a.state};});expect(result).toEqual({state:'canceled',canceled:false,identity:true,value:'Keep me',ready:'ready'});
});
test('global fallback discloses connected same-tag upgrade scope',async({page})=>{
 await page.goto('/?global');await page.waitForFunction(()=>!!(window as any).fixture);const result=await page.evaluate(async()=>{const f=(window as any).fixture;f.add(1);f.add(1);const outside=document.createElement('en-activation-probe');document.body.append(outside);await f.activate(0);return f.state();});expect(result.constructed).toBe(2);expect(result.entries[1].nodes).toBe(0);
});

for(const policy of ['group','dormant','fallback'])test(`${policy}: cross-document adoption while loading rejects before registration`,async({page})=>{
 await page.goto('/?policy='+policy+(policy==='fallback'?'&global':''));await page.waitForFunction(()=>!!(window as any).fixture);
 const result=await page.evaluate(async()=>{const f=(window as any).fixture;f.add();f.hold();const pending=f.activate(0);const frame=document.createElement('iframe');document.body.append(frame);frame.contentDocument!.body.append(f.entries[0].root);f.release();return {result:await pending,state:f.state()};});expect(result.result.ok).toBe(false);expect(result.result.message).toContain('changed documents');expect(result.state.entries[0].defined).toBe(false);expect(result.state.constructed).toBe(0);
});
