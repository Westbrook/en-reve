import { test, expect } from '@playwright/test';

test('the production sticker sheet restores a newly assigned fallback after removing slotted help', async ({ page }) => {
  await page.goto('/');
  await page.locator('en-sticker-app').evaluate(async element => {
    await customElements.whenDefined('en-sticker-app');
    await (element as any).updateComplete;
  });
  const host = page.locator('[data-specimen="text-fields"] en-text-field').first();
  const input = host.getByRole('textbox', { name: 'Project name', exact: true });
  await host.evaluate(async element => {
    (element as any).description = 'New fallback for the project name.';
    await (element as any).updateComplete;
  });
  await expect(input).toHaveAccessibleDescription('A name your collaborators will recognize. Review this field.');
  await host.locator(':scope > [slot="description"]').evaluate(element => element.remove());
  await expect(input).toHaveAccessibleDescription('New fallback for the project name.');
  await expect(host.getByText('New fallback for the project name.', { exact: true })).toBeVisible();
  await host.evaluate(async element => {
    (element as any).description = '';
    await (element as any).updateComplete;
  });
  await expect(input).toHaveAccessibleDescription('');
  await expect(host.locator('[part~="description"]')).toBeHidden();
  await host.evaluate(async element => {
    element.setAttribute('description', 'Restored fallback in the production build.');
    await (element as any).updateComplete;
  });
  await expect(input).toHaveAccessibleDescription('Restored fallback in the production build.');
});

/** These fixtures use real server-rendered DSD and the existing production hydration adapter. */
test('slot-only descriptions and absent-help layout work before any client JavaScript', async ({ browser }, testInfo) => {
  testInfo.annotations.push({ type: 'browser-version', description: browser.version() });
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto('/fixture');
    const section = page.locator('#description-fixture');
    const field = section.getByRole('textbox', { name: 'SSR project name', exact: true });
    await expect(field).toHaveValue('Server description draft');
    await expect(field).toHaveAccessibleDescription('Shared with collaborators. Naming guidance');
    await expect(section.getByRole('link', { name: 'Naming guidance', exact: true })).toBeVisible();
    await expect(section.getByRole('checkbox', { name: 'SSR notifications', exact: true })).toHaveAccessibleDescription('Send updates to your team.');
    await expect(section.getByRole('slider', { name: 'SSR opacity', exact: true })).toHaveAccessibleDescription('The exact percentage is optional.');
    await expect(section.getByRole('spinbutton', { name: 'SSR opacity Exact value', exact: true })).toHaveAccessibleDescription('The exact percentage is optional.');
    await expect(section.getByRole('group', { name: 'SSR usefulness', exact: true })).toHaveAccessibleDescription('Rate this version, not the whole project.');
    const absent = section.locator('#ssr-description-absent');
    await expect(absent.locator('[part~="control"]')).toHaveAccessibleDescription('');
    await expect(absent.locator('[part~="description"]')).toBeHidden();
    const trailingSpace = await absent.locator('[part~="field"]').evaluate(field => {
      const control = field.querySelector('[part~="control"]')!;
      return field.getBoundingClientRect().bottom - control.getBoundingClientRect().bottom;
    });
    expect(Math.abs(trailingSpace)).toBeLessThanOrEqual(1);
    // Assigned empty content wins over fallback; native assignment may retain its ordinary layout space.
    await expect(section.locator('#ssr-description-empty [part~="control"]')).toHaveAccessibleDescription('');
    await expect(section.locator('#ssr-description-hidden [slot="description"]')).toBeHidden();
    await expect(section.locator('#ssr-description-hidden [part~="control"]')).toHaveAccessibleDescription('');
    expect(await page.evaluate(() => Boolean(customElements.get('en-text-field')))).toBe(false);
    await testInfo.attach('server-description-semantics', { contentType: 'application/json', body: JSON.stringify({
      javaScriptEnabled: false, nativeFieldRegistered: false, absentDescriptionTrailingSpace: trailingSpace,
      assignedEmptyFallbackSuppressed: true,
    }, null, 2) });
  } finally { await context.close(); }
});

test('hydration keeps slot relationships, native draft, node identity, focus and selection', async ({ page, browser }, testInfo) => {
  testInfo.annotations.push({ type: 'browser-version', description: browser.version() });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/fixture');
  const host = page.locator('#ssr-description-field');
  const input = host.locator('[part~="control"]');
  await expect(input).toHaveAccessibleName('SSR project name');
  await expect(input).toHaveAccessibleDescription('Shared with collaborators. Naming guidance');
  await input.fill('A draft entered before hydration');
  await input.evaluate(element => {
    (window as any).__descriptionBeforeHydration = element;
    (element as HTMLInputElement).setSelectionRange(2, 10);
  });
  await page.evaluate(() => (window as any).hydrateFixture());
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
  await expect(input).toHaveAccessibleName('SSR project name');
  await expect(input).toHaveAccessibleDescription('Shared with collaborators. Naming guidance');
  await expect(input).toHaveValue('A draft entered before hydration');
  await expect(input).toBeFocused();
  const retained = await input.evaluate(element => ({
    identical: element === (window as any).__descriptionBeforeHydration,
    selection: [(element as HTMLInputElement).selectionStart, (element as HTMLInputElement).selectionEnd],
  }));
  expect(retained).toEqual({ identical: true, selection: [2, 10] });
  await host.locator(':scope > [slot="description"]').evaluate(element => { element.firstChild!.textContent = 'Only your team can see this. '; });
  await expect(input).toHaveAccessibleDescription('Only your team can see this. Naming guidance');
  await expect(input).toBeFocused();
  await host.locator(':scope > [slot="description"]').evaluate(element => element.remove());
  await expect(input).toHaveAccessibleDescription('');
  await expect(host.locator('[part~="description"]')).toBeHidden();
  await host.evaluate(async element => {
    (element as any).description = 'Fallback added after hydration.';
    await (element as any).updateComplete;
  });
  await expect(input).toHaveAccessibleDescription('Fallback added after hydration.');
  await expect(host.getByText('Fallback added after hydration.', { exact: true })).toBeVisible();
  await host.evaluate(async element => {
    (element as any).description = '';
    await (element as any).updateComplete;
    element.setAttribute('description', 'Fallback restored through the attribute.');
    await (element as any).updateComplete;
  });
  await expect(input).toHaveAccessibleDescription('Fallback restored through the attribute.');
  await expect(input).toBeFocused();
  await expect(input).toHaveValue('A draft entered before hydration');
  expect(errors).toEqual([]);
  await testInfo.attach('hydrated-description-retention', { contentType: 'application/json', body: JSON.stringify(retained, null, 2) });
});
