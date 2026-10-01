import {test,expect} from '@playwright/test';
for(const ssr of [false,true])for(const mode of ['global','auto']){
 test(`intent prepares code only: ${ssr?'SSR':'CSR'} ${mode}`,async({page})=>{
  await page.goto(`/lazy${ssr?'-ssr':''}.html?intent&mode=${mode}`);await page.waitForFunction(()=>!!(window as any).fixture);const trigger=page.getByRole('button',{name:'Search commands',exact:true});
  await trigger.focus();await expect.poll(()=>page.evaluate(()=>(window as any).fixture.state().preloads)).toBe(1);
  await page.evaluate(()=>(window as any).fixture.loader.load(['en-command-palette']));
  expect(await page.evaluate(()=>!!(window as any).fixture.scope.get('en-command-palette'))).toBe(false);expect(await trigger.getAttribute('aria-busy')).toBe('false');expect(await page.locator('#settings-command-status').textContent()).toBe('');
  await expect(page.locator('#settings-command-palette input[role="combobox"], #settings-command-palette [role="listbox"], #settings-command-palette [role="option"], #settings-command-palette [part~="status"]')).toHaveCount(0);
  await trigger.press('Enter');await expect(page.getByRole('dialog',{name:'Settings commands',exact:true})).toBeVisible();const search=page.getByRole('combobox',{name:'Find a settings command'});await search.fill('opacity');await expect(search).toHaveValue('opacity');await page.keyboard.press('Escape');await expect(trigger).toBeFocused();
 });
}
test('failed preparation is quiet; explicit activation remains usable',async({page})=>{
 await page.goto('/lazy.html?intent&fail-intent&mode=global');await page.waitForFunction(()=>!!(window as any).fixture);const trigger=page.getByRole('button',{name:'Search commands',exact:true});await trigger.hover();await expect.poll(()=>page.evaluate(()=>(window as any).fixture.state().preloads)).toBe(1);expect(await page.locator('#settings-command-status').textContent()).toBe('');await trigger.click();await expect(page.getByRole('dialog',{name:'Settings commands',exact:true})).toBeVisible();
});
