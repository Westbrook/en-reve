import { test, expect } from '@playwright/test';
for (const delivery of ['shadow','global','template']) test(`production field references survive ${delivery} SSR/hydration`, async ({page,browser},info) => {
  info.annotations.push({type:'browser-version',description:browser.version()});
  const errors: string[] = [];page.on('pageerror', error => errors.push(error.message));
  await page.goto(`/probes/reference-target/island-${delivery}.html`);
  await expect(page.locator('body')).toHaveAttribute('data-ready','true');
  const input = page.locator('#island-field input');
  if (delivery !== 'template') {
    await input.fill('Before hydration');
    await input.evaluate((node: HTMLInputElement) => { (window as any).originalField = node;node.setSelectionRange(3,7); });
  }
  await page.evaluate(() => (window as any).fieldIsland.activate());
  expect(await page.evaluate(() => (window as any).fieldIsland.state)).toBe('ready');
  if (delivery !== 'template') {
    await expect(input).toHaveValue('Before hydration');
    expect(await input.evaluate((node:HTMLInputElement) => ({same:node===(window as any).originalField,selection:[node.selectionStart,node.selectionEnd]}))).toEqual({same:true,selection:[3,7]});
  }
  const relationship = async () => input.evaluate((node: HTMLInputElement) => Array.from(node.ariaLabelledByElements ?? node.labels ?? [], label => label.textContent?.trim()));
  await expect.poll(relationship).toEqual(['Island account','Internal account']);
  await page.locator('#island-label').click();await expect(input).toBeFocused();
  const hasNative = await input.evaluate(node => 'referenceTarget' in node.getRootNode());
  if (hasNative) expect(await input.evaluate(node => (node.getRootNode() as any).referenceTarget)).toBe('control');
  await input.fill('Accepted island');
  expect(await page.locator('#island-form').evaluate(form => new FormData(form as HTMLFormElement).get('account'))).toBe('Accepted island');
  const notes = page.locator('#notes textarea');await page.locator('#notes-label').click();await expect(notes).toBeFocused();
  for(const [id,label] of [['choice','choice'],['switch','switch'],['radio','radio']]) {
    const choice=page.locator(`#island-${id} input`);
    await expect.poll(()=>choice.evaluate((node:HTMLInputElement)=>Array.from(node.ariaLabelledByElements??[],label=>label.textContent?.trim()))).toEqual([`Island ${label}`,`Internal ${label}`]);
    await page.locator(`#${id}-label`).click();await expect(choice).toBeChecked();await expect(choice).toBeFocused();
    expect(await page.locator('#island-form').evaluate((form,id)=>new FormData(form as HTMLFormElement).get(id),id)).toBe('yes');
  }
  expect(errors).toEqual([]);
});
