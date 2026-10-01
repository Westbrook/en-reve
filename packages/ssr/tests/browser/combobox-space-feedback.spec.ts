import {expect,test} from '@playwright/test';

test('SSR keeps an empty feedback region and hydrates it in place before delayed localized feedback',async({page,browser},info)=>{
  info.annotations.push({type:'browser-version',description:browser.version()});
  info.annotations.push({type:'scope',description:'Actual @en-reve/ssr render and deferred hydration; CSS ceiling after hydration, no physical keyboard or assistive-technology announcement claim.'});
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize({width:390,height:844});await page.goto('/fixture');
  const host=page.locator('#ssr-space-feedback');
  const input=host.getByRole('combobox');
  const status=host.locator('[part="space-status"]');
  await expect(input).toHaveValue('Forest canvas');await expect(input).toHaveAccessibleName('SSR asset');
  await expect(status).toBeEmpty();expect(await status.evaluate(region=>region.getBoundingClientRect().height)).toBe(0);
  expect(await host.evaluate(element=>element.shadowRoot!.querySelector('[part="popup"]')!.contains(element.shadowRoot!.querySelector('[part="space-status"]')))).toBe(false);
  await input.fill('Fjord');
  await host.evaluate(element=>{
    const native=element.shadowRoot!.querySelector('input')!;native.setSelectionRange(1,4);
    (window as any).spaceBeforeHydration={native,region:element.shadowRoot!.querySelector('[part="space-status"]'),description:native.getAttribute('aria-describedby')};
  });
  await page.evaluate(()=>(window as any).hydrateFixture());
  await expect(page.locator('html')).toHaveAttribute('data-hydrated','true');
  await expect(input).toHaveValue('Fjord');await expect(input).toBeFocused();await expect(status).toBeEmpty();
  expect(await host.evaluate(element=>{
    const native=element.shadowRoot!.querySelector('input')!,before=(window as any).spaceBeforeHydration;
    return {native:native===before.native,region:element.shadowRoot!.querySelector('[part="space-status"]')===before.region,
      selection:[native.selectionStart,native.selectionEnd],description:native.getAttribute('aria-describedby')===before.description,value:(element as any).value};
  })).toEqual({native:true,region:true,selection:[1,4],description:true,value:'forest'});
  await host.evaluate(element=>{
    // This fixture is unnamed for the older form serialization tests; associate
    // it here without moving the hydrated field or changing its native focus.
    (element as any).name='asset';(element as any).noRoomText='Pas assez de place pour les suggestions.';
    (element as HTMLElement).style.cssText='position:fixed;left:30px;top:160px;width:300px;--en-option-list-max-block-size:20px';
  });
  await input.press('ArrowDown');
  await expect(status).toHaveText('Pas assez de place pour les suggestions.');
  await expect(input).toHaveValue('Fjord');await expect(input).toBeFocused();await expect(input).toHaveAttribute('aria-expanded','false');
  expect(await page.locator('#project-form').evaluate(form=>new FormData(form as HTMLFormElement).get('asset'))).toBe('forest');
  await expect(input).toHaveAccessibleDescription('Choose a catalog asset.');
  await host.evaluate(element=>(element as HTMLElement).style.removeProperty('--en-option-list-max-block-size'));
  await expect(input).toHaveAttribute('aria-expanded','true');await expect(status).toBeEmpty();
  expect(await status.evaluate(region=>region.getBoundingClientRect().height)).toBeGreaterThan(0);
  await input.press('Escape');await expect(status).toBeEmpty();
  expect(await status.evaluate(region=>region.getBoundingClientRect().height)).toBe(0);
  expect(await host.evaluate(element=>element.shadowRoot!.querySelector('input')===(window as any).spaceBeforeHydration.native)).toBe(true);
  expect(errors).toEqual([]);
});
