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
