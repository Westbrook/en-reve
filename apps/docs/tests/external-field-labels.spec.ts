import { test, expect } from '@playwright/test';
test('published field example connects its external label without changing native editing', async ({page,browserName}) => {
  await page.goto('/api-examples/text-fields.html?progress-report');
  const input = page.locator('#example-project-code input');
  await expect(input).toHaveValue('STUDIO');
  await page.locator('label[for="example-project-code"]').click();
  await expect(input).toBeFocused();
  await expect.poll(() => input.evaluate((input:HTMLInputElement) => Array.from(input.ariaLabelledByElements ?? input.labels ?? [], label => label.textContent?.trim()))).toEqual(['Workspace','Project code']);
  await input.fill('UPDATED');await expect(page.locator('#example-project-code')).toHaveJSProperty('value','UPDATED');
  if (browserName === 'chromium') {
    const session = await page.context().newCDPSession(page);
    const {nodes} = await session.send('Accessibility.getFullAXTree');
    expect(nodes.filter(node => !node.ignored && node.role?.value === 'textbox').map(node => node.name?.value)).toContain('Workspace Project code');
    await session.detach();
  }
});


test('published external choice label activates exactly one cancelable transaction', async ({page}) => {
  await page.goto('/api-examples/checkboxes-switches.html?progress-report');
  const host=page.locator('#example-include-drafts'),input=host.locator('input');
  await expect(input).not.toBeChecked();
  await host.evaluate(host=>{(window as any).choiceChanges=[];host.addEventListener('en-change',event=>(window as any).choiceChanges.push((event as CustomEvent).detail));});
  await page.locator('label[for="example-include-drafts"]').click();await expect(input).toBeChecked();await expect(input).toBeFocused();
  expect(await page.evaluate(()=>(window as any).choiceChanges)).toEqual([{previous:false,proposed:true,reason:'toggle'}]);
  await host.evaluate(host=>host.addEventListener('en-change',event=>event.preventDefault(),{once:true}));
  await page.locator('label[for="example-include-drafts"]').click();await expect(input).toBeChecked();
});
