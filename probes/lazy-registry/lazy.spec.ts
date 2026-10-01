import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
async function boot(page:any,url='/lazy.html') {
 const errors:string[]=[];page.on('pageerror',(e:Error)=>errors.push(e.message));
 await page.goto(url);await page.waitForFunction(()=>!!(window as any).fixture);
 if(!url.includes('human-review'))await expect(page.locator('[data-human-review]')).toHaveCount(0);
 await expect(page.locator('#settings-command-palette input[role="combobox"], #settings-command-palette [role="listbox"], #settings-command-palette [role="option"], #settings-command-palette [part~="status"]')).toHaveCount(0);
 return errors;
}
for(const root of ['light','shadow'])for(const mode of ['auto','global'])test(`${root}/${mode}: first keyboard action upgrades only its registry`,async({page,browserName})=>{
 const errors=await boot(page,`/lazy.html?root=${root}&mode=${mode}`);
 expect(await page.evaluate(()=>(window as any).fixture.startup.paletteDefined)).toBe(false);
 const trigger=page.locator('#settings-command-trigger');await trigger.locator('button').focus();await trigger.locator('button').press('Enter');
 await expect(page.getByRole('dialog',{name:'Settings commands'})).toBeVisible();
 await expect(page.getByRole('combobox',{name:'Find a settings command'})).toBeFocused();
 const state=await page.evaluate(()=>({scoped:(window as any).fixture.scope.mode,global:!!customElements.get('en-command-palette')}));
 expect(state.global).toBe(mode==='global'||browserName==='firefox');
 await page.keyboard.press('Escape');await expect(trigger.locator('button')).toBeFocused();expect(errors).toEqual([]);
});
for(const mode of ['auto','global'])test(`${mode}: SSR keeps settings usable before optional upgrade`,async({page,browserName})=>{
 const errors=await boot(page,`/lazy-ssr.html?mode=${mode}`);
 expect(await page.evaluate(()=>(window as any).fixture.startup.paletteDefined)).toBe(false);
 await expect(page.getByRole('heading',{name:'Creative output settings'})).toHaveCount(1);
 await expect(page.getByRole('button',{name:'Search commands',exact:true})).toHaveCount(1);
 if(browserName==='firefox')await page.getByRole('button',{name:'Search commands',exact:true}).click();
 else await page.getByRole('button',{name:'Search commands',exact:true}).tap();
 await expect(page.getByRole('dialog',{name:'Settings commands'})).toBeVisible();expect(errors).toEqual([]);
});
test('failed first use is announced, retry succeeds without losing settings',async({page})=>{
 const errors=await boot(page,'/lazy.html?fail');await page.locator('#settings-command-trigger').click();
 await expect(page.locator('#settings-command-status')).toContainText('could not load');
 await expect(page.locator('#settings-save-trigger')).toBeVisible();
 await page.locator('#settings-command-trigger').click();await expect(page.getByRole('dialog',{name:'Settings commands'})).toBeVisible();expect(errors).toEqual([]);
});
for(const cancel of ['escape','focus','reset','dispose'])test(`delayed import respects ${cancel}`,async({page})=>{
 const errors=await boot(page,'/lazy.html?hold');await page.evaluate(()=>(window as any).unusedPalette=(window as any).fixture.palette);await page.locator('#settings-command-trigger').click();
 await expect(page.locator('#settings-command-status')).toContainText('Loading');
 if(cancel==='escape')await page.keyboard.press('Escape');
 if(cancel==='focus')await page.locator('#settings-save-trigger button').focus();
 if(cancel==='reset'||cancel==='dispose')await page.evaluate(cancel=>(window as any).fixture[cancel](),cancel);
 await expect.poll(()=>page.evaluate(()=>!!(window as any).fixture.scope.get('en-command-palette'))).toBe(true);
 await page.evaluate(async()=>{await (window as any).unusedPalette.updateComplete;});
 await expect(page.getByRole('dialog',{name:'Settings commands'})).not.toBeVisible();
 expect(await page.evaluate(()=>(window as any).fixture.state().disposedUpdates)).toBe(0);
 expect(await page.evaluate(()=>({connected:(window as any).unusedPalette.isConnected,constructed:!!(window as any).unusedPalette.shadowRoot?.querySelector('input[role="combobox"]')}))).toEqual({connected:cancel!=='dispose',constructed:cancel!=='dispose'});expect(errors).toEqual([]);
});
test('optional startup has no palette network request and first use is accessible',async({page,browserName})=>{
 const errors=await boot(page);
 const before=await page.evaluate(()=>performance.getEntriesByType('resource').map((r:any)=>r.name));
 expect(before.some(url=>url.includes('command-palette-'))).toBe(false);
 await expect(page.getByRole('button',{name:'Search commands',exact:true})).toHaveCount(1);
 if(browserName==='firefox')await page.getByRole('button',{name:'Search commands',exact:true}).click();
 else await page.getByRole('button',{name:'Search commands',exact:true}).tap();await expect(page.getByRole('dialog',{name:'Settings commands'})).toBeVisible();
 const after=await page.evaluate(()=>performance.getEntriesByType('resource').map((r:any)=>r.name));
 expect(after.some(url=>url.includes('command-palette-'))).toBe(true);
 const result=await new AxeBuilder({page}).include('en-command-palette').analyze();expect(result.violations).toEqual([]);expect(errors).toEqual([]);
});
test('full manifest stays inert; connected ordinary trees upgrade only when their registry is defined',async({page,browserName})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/library.html');await page.waitForFunction(()=>!!(window as any).library);
 const result=await page.evaluate(async()=>{
  const {createElementLoader,createElementScope,elementLoaders}=(window as any).library;
  const a=createElementScope({document}),b=createElementScope({document});
  const ah=a.createElement('section'),bh=b.createElement('section');document.body.append(ah,bh);
  const one=a.createElement('en-command-palette'),two=b.createElement('en-command-palette');ah.append(one);bh.append(two);
  const before=[one.shadowRoot,two.shadowRoot,customElements.get('en-command-palette')].every(x=>!x);
  const loader=createElementLoader(a.registry);await loader.load(['en-command-palette']);
  const inert=!one.shadowRoot&&!a.get('en-command-palette');await loader.ensure(['en-command-palette']);await one.updateComplete;
  const isolated=b.mode==='global'||!two.shadowRoot;
  await createElementLoader(b.registry).ensure(['en-command-palette']);await two.updateComplete;
  return {before,inert,isolated,both:!!one.shadowRoot&&!!two.shadowRoot,global:!!customElements.get('en-command-palette'),size:Object.keys(elementLoaders).length};
 });expect(result).toEqual({before:true,inert:true,isolated:true,both:true,global:browserName==='firefox',size:96});expect(errors).toEqual([]);
});
test('opt-in keyboard shortcut loads within a shadow-owned settings workflow',async({page})=>{
 const errors=await boot(page,'/lazy.html?root=shadow');
 await page.getByText('Command access and keyboard shortcut',{exact:true}).click();
 await page.getByRole('checkbox',{name:'Enable Ctrl/⌘+K command shortcut'}).check();
 await page.locator('#settings-command-trigger button').focus();await page.keyboard.press('Control+k');
 await expect(page.getByRole('dialog',{name:'Settings commands'})).toBeVisible();expect(errors).toEqual([]);
});

for(const ssr of [false,true])test(`${ssr?'SSR':'CSR'}: loading feedback stays local through unrelated renders`,async({page})=>{
 const errors=await boot(page,`/lazy${ssr?'-ssr':''}.html?manual-hold`);
 const trigger=page.locator('#settings-command-trigger'),status=page.locator('#settings-command-status');
 const before=await page.evaluate(()=>(window as any).fixture.state().updates);
 await trigger.locator('button').press('Enter');
 await expect(status).toHaveText('Loading command search…');await expect(trigger).toHaveAttribute('aria-busy','true');
 expect(await page.evaluate(()=>(window as any).fixture.state().updates)).toBe(before);
 await page.evaluate(()=>(window as any).fixture.rerender());
 await expect(status).toHaveText('Loading command search…');await expect(trigger).toHaveAttribute('aria-busy','true');
 await page.evaluate(()=>(window as any).fixture.releaseLoad());
 await expect(page.getByRole('combobox',{name:'Find a settings command'})).toBeFocused();
 await expect(status).toBeEmpty();await expect(trigger).toHaveAttribute('aria-busy','false');
 expect(await page.evaluate(()=>(window as any).fixture.state().updates)).toBe(before+1);
 await page.getByRole('combobox',{name:'Find a settings command'}).fill('opacity');
 await expect(page.getByRole('option',{name:'Restore saved opacity'})).toBeVisible();
 expect(errors).toEqual([]);
});
test('unchanged command capabilities preserve the catalog and typed query; changed capabilities update',async({page})=>{
 const errors=await boot(page);await page.locator('#settings-command-trigger').click();
 await expect(page.getByRole('combobox',{name:'Find a settings command'})).toBeFocused();
 await page.evaluate(()=>{(window as any).savedCatalog=(window as any).fixture.palette.commands;});
 await page.getByRole('combobox',{name:'Find a settings command'}).fill('opacity');
 await page.evaluate(()=>(window as any).fixture.rerender());
 expect(await page.evaluate(()=>(window as any).savedCatalog===(window as any).fixture.palette.commands)).toBe(true);
 await expect(page.getByRole('combobox',{name:'Find a settings command'})).toHaveValue('opacity');
 await page.keyboard.press('Escape');await page.locator('#settings-save-trigger').click();
 await expect.poll(()=>page.evaluate(()=>(window as any).fixture.palette.commands.find((c:any)=>c.action==='settings.cancel-save').disabled)).toBe(false);
 expect(await page.evaluate(()=>(window as any).savedCatalog===(window as any).fixture.palette.commands)).toBe(false);
 expect(errors).toEqual([]);
});
test('Escape clears local busy feedback and a later activation works',async({page})=>{
 const errors=await boot(page,'/lazy.html?manual-hold');const trigger=page.locator('#settings-command-trigger');
 await trigger.locator('button').press('Enter');await expect(trigger).toHaveAttribute('aria-busy','true');await page.keyboard.press('Escape');
 await expect(trigger).toHaveAttribute('aria-busy','false');await expect(page.locator('#settings-command-status')).toBeEmpty();
 await page.evaluate(()=>(window as any).fixture.releaseLoad());await page.waitForFunction(()=>(window as any).fixture.palette.updateComplete!==undefined);
 await expect(page.getByRole('dialog',{name:'Settings commands'})).not.toBeVisible();
 await expect(page.locator('#settings-command-palette input[role="combobox"], #settings-command-palette [role="listbox"]')).toHaveCount(2);
 await trigger.locator('button').press('Enter');await expect(page.getByRole('combobox',{name:'Find a settings command'})).toBeFocused();expect(errors).toEqual([]);
});

for(const ssr of [false,true])test(`${ssr?'SSR':'CSR'}: native diagnostic release preserves newer focus and accepted settings`,async({page})=>{
 const errors=await boot(page,`/lazy${ssr?'-ssr':''}.html?manual-hold&human-review&progress-report`);
 const controls=page.getByRole('region',{name:'Command loading companion diagnostic'});
 const release=controls.getByRole('button',{name:'Release held command load',exact:true});
 const trigger=page.locator('#settings-command-trigger'),status=page.locator('#settings-command-status');
 const current=await page.locator('[data-settings-current]').textContent();
 const saved=await page.locator('[data-settings-saved]').textContent();
 expect(await controls.evaluate(node=>!(window as any).fixture.root.contains(node))).toBe(true);
 await expect(controls.getByRole('link',{name:'Progress Report',exact:true})).toHaveAttribute('href','http://127.0.0.1:4177');
 // Early release is not a stored permission that could bypass the later hold.
 await release.press('Enter');expect(await page.evaluate(()=>(window as any).fixture.attempts)).toBe(0);
 await trigger.locator('button').press('Enter');
 await expect(status).toHaveText('Loading command search…');await expect(trigger).toHaveAttribute('aria-busy','true');
 expect(await page.evaluate(()=>(window as any).fixture.startup.paletteDefined)).toBe(false);
 await release.press('Enter');
 await expect(status).toBeEmpty();await expect(trigger).toHaveAttribute('aria-busy','false');
 await expect(release).toBeFocused();await expect(page.getByRole('dialog',{name:'Settings commands'})).not.toBeVisible();
 await expect(page.locator('#settings-command-palette input[role="combobox"]')).toHaveCount(1);
 await release.press('Enter');expect(await page.evaluate(()=>(window as any).fixture.attempts)).toBe(1);
 await expect(page.locator('[data-settings-current]')).toHaveText(current!);
 await expect(page.locator('[data-settings-saved]')).toHaveText(saved!);
 await trigger.locator('button').press('Enter');
 await expect(page.getByRole('combobox',{name:'Find a settings command'})).toBeFocused();
 expect(await page.evaluate(()=>(window as any).fixture.attempts)).toBe(1);
 await expect(page.locator('[data-settings-current]')).toHaveText(current!);
 await expect(page.locator('[data-settings-saved]')).toHaveText(saved!);
 expect(errors).toEqual([]);
});
