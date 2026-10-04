import { test, expect } from '@playwright/test';

test('pre-hydration availability writes reconcile the retained native buttons quietly', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/fixture');
  const enabled = page.locator('#ssr-disabled-action');
  const disabled = page.locator('#ssr-enabled-action');
  await expect(enabled.locator('button')).toBeDisabled();
  await expect(disabled.locator('button')).toBeEnabled();
  await page.evaluate(() => {
    const ids = ['ssr-disabled-action', 'ssr-enabled-action'];
    (window as any).availabilityNodes = ids.map(id => {
      const host = document.getElementById(id)!;
      const control = host.shadowRoot!.querySelector('button')!;
      const label = host.shadowRoot!.querySelector('[part="label"]')!;
      let activations = 0;
      control.addEventListener('click', () => { host.dataset.activations = String(++activations); });
      host.dataset.activations = '0';
      return { host, control, label };
    });
    (window as any).availabilityEvents = [];
    for (const type of ['en-input', 'en-change']) document.addEventListener(type, event => {
      (window as any).availabilityEvents.push(event.type);
    });
  });
  const beforeRelease = await page.evaluate(() => (window as any).hydrateFixture({ buttonStates: [
    { id: 'ssr-disabled-action', disabled: false },
    { id: 'ssr-enabled-action', disabled: true },
  ] }));
  // Both writes happened after upgrade but before the first hydration render;
  // the source and current properties intentionally differ at this checkpoint.
  expect(beforeRelease).toEqual([
    { id: 'ssr-disabled-action', defined: true, hasUpdated: false, deferred: true, disabled: false, nativeDisabled: true },
    { id: 'ssr-enabled-action', defined: true, hasUpdated: false, deferred: true, disabled: true, nativeDisabled: false },
  ]);
  await expect(enabled).not.toHaveAttribute('disabled');
  await expect(disabled).toHaveAttribute('disabled', '');
  await expect(enabled.locator('button')).toBeEnabled();
  await expect(disabled.locator('button')).toBeDisabled();
  for (const host of [enabled, disabled]) await expect(host.locator('button')).toHaveAttribute('aria-busy', 'false');
  expect(await page.evaluate(() => (window as any).availabilityNodes.every(({ host, control, label }: {
    host: HTMLElement; control: HTMLButtonElement; label: Element;
  }) => host.shadowRoot!.querySelector('button') === control && host.shadowRoot!.querySelector('[part="label"]') === label))).toBe(true);
  expect(await page.evaluate(() => (window as any).availabilityEvents)).toEqual([]);
  await enabled.evaluate(element => (element as HTMLElement).focus());
  await expect(enabled.locator('button')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(enabled).toHaveAttribute('data-activations', '1');
  await disabled.evaluate(element => (element as HTMLElement).focus());
  await expect(enabled.locator('button')).toBeFocused();
  await disabled.locator('button').evaluate(element => (element as HTMLButtonElement).click());
  await expect(disabled).toHaveAttribute('data-activations', '0');
  expect(await page.evaluate(() => (window as any).availabilityEvents)).toEqual([]);
  expect(errors).toEqual([]);
});
