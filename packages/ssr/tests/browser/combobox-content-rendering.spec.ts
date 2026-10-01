import { expect, test } from '@playwright/test';

test('eager SSR retains native editing, accepted labels and hidden option rows', async ({ browser, baseURL }, info) => {
  info.annotations.push({ type: 'browser-version', description: browser.version() });
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto(`${baseURL}/combobox-content-fixture`);
    await expect(page.locator('#content-eager [role="option"]')).toHaveCount(4);
    for (const id of ['content-active', 'content-unused']) {
      const host = page.locator(`#${id}`);
      await expect(host.locator('[role="option"]')).toHaveCount(4);
      await expect(host.getByRole('option')).toHaveCount(0);
      await expect(host.locator('[role="combobox"]')).toHaveAttribute('aria-expanded', 'false');
      await expect(host.locator('[part="popup"]')).toHaveCount(1);
      await expect(host.locator('[part="listbox"]')).toHaveCount(1);
      await expect(host.locator('[part="status"]')).toHaveCount(1);
      await expect(host.locator('[part="space-status"]')).toHaveCount(1);
    }
    await expect(page.locator('#content-active').getByRole('combobox')).toHaveValue('Forest canvas');
    await expect(page.locator('#content-active').getByRole('combobox')).toHaveAccessibleDescription('Choose a catalog asset.');
  } finally { await context.close(); }
});

test('matching eager hydration keeps a pre-upgrade query and shell identity without opening another instance', async ({ page, browser }, info) => {
  info.annotations.push({ type: 'browser-version', description: browser.version() });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/combobox-content-fixture');
  const host = page.locator('#content-active');
  const control = host.getByRole('combobox', { name: 'Active asset', exact: true });
  await expect(host.locator('[role="option"]')).toHaveCount(4);
  await control.fill('Fjord');
  await host.evaluate(element => {
    const root = element.shadowRoot!;
    const input = root.querySelector('input')!;
    input.setSelectionRange(1, 4, 'backward');
    (window as any).comboboxBefore = {
      root, input, popup: root.querySelector('[part="popup"]'), listbox: root.querySelector('[part="listbox"]'),
      status: root.querySelector('[part="status"]'), description: input.getAttribute('aria-describedby'),
    };
  });
  await page.evaluate(() => (window as any).hydrateComboboxContent());
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
  await expect(control).toHaveValue('Fjord');
  await expect(control).toBeFocused();
  await expect(control).toHaveAttribute('aria-expanded', 'false');
  await expect(host.locator('[role="option"]')).toHaveCount(1);
  expect(await host.evaluate(element => {
    const before = (window as any).comboboxBefore, root = element.shadowRoot!, input = root.querySelector('input')!;
    return {
      root: root === before.root, input: input === before.input, popup: root.querySelector('[part="popup"]') === before.popup,
      listbox: root.querySelector('[part="listbox"]') === before.listbox, status: root.querySelector('[part="status"]') === before.status,
      selection: [input.selectionStart, input.selectionEnd, input.selectionDirection],
      description: input.getAttribute('aria-describedby') === before.description, value: (element as any).value,
    };
  })).toEqual({ root: true, input: true, popup: true, listbox: true, status: true, selection: [1, 4, 'backward'], description: true, value: 'forest' });
  expect(await page.locator('form').evaluate(form => Object.fromEntries(new FormData(form as HTMLFormElement)))).toEqual({ eager: 'forest', asset: 'forest', unused: 'sunset' });
  await control.press('ArrowDown');
  const option = host.getByRole('option', { name: 'Fjord study', exact: true });
  await expect(option).toBeVisible();
  await expect(control).toHaveAttribute('aria-activedescendant', (await option.getAttribute('id'))!);
  await expect(control).toBeFocused();
  const retained = await option.elementHandle();
  await control.press('Enter');
  await expect(host).toHaveJSProperty('value', 'fjord');
  await expect(host.locator('[role="option"]')).toHaveCount(4);
  await expect(page.locator('#content-unused [role="option"]')).toHaveCount(4);
  expect(await host.locator('[role="option"][data-value="fjord"]').evaluate((node, previous) => node === previous, retained)).toBe(true);
  await page.getByRole('button', { name: 'Reset assets', exact: true }).click();
  await expect(host).toHaveJSProperty('value', 'forest');
  await expect(control).toHaveValue('Forest canvas');
  await expect(host.locator('[role="option"]')).toHaveCount(4);
  await expect(page.locator('#content-unused [role="option"]')).toHaveCount(4);
  expect(errors).toEqual([]);
  await retained?.dispose();
});
