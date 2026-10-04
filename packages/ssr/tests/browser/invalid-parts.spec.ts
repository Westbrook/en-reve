import { test, expect, type Locator } from '@playwright/test';

const cases = [
  ['checkbox'], ['radio'], ['switch'], ['search'], ['otp'], ['textarea'],
  ['number', 'stepper'], ['combobox'], ['select'], ['text'], ['adorned', 'focus-frame'],
  ['otp-adorned', 'focus-frame'],
] as const;
const fixture = '/invalid-parts-fixture';

function control(host: Locator) {
  // Generated number stepper buttons have their own control Parts; retain the
  // actual native form editor as the identity and validation subject.
  return host.locator('input[part~="control"], textarea[part~="control"], select[part~="control"]');
}

async function feedback(host: Locator, invalid: boolean, extraPart?: string) {
  const editor = control(host);
  await expect(editor).toHaveCount(1);
  await expect(host.locator('[part~="control-invalid"]')).toHaveCount(invalid ? 1 : 0);
  if (invalid) await expect(editor).toHaveAttribute('aria-invalid', 'true');
  else await expect(editor).not.toHaveAttribute('aria-invalid', 'true');
  if (extraPart) {
    await expect(host.locator(`[part~="${extraPart}"]`)).toHaveCount(1);
    await expect(host.locator(`[part~="${extraPart}-invalid"]`)).toHaveCount(invalid ? 1 : 0);
  }
}

test('SSR exposes invalid Parts for application feedback without marking pristine required controls', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto(fixture);
    for (const [name, extraPart] of cases) {
      await feedback(page.locator(`#application-${name}`), true, extraPart);
      if (name === 'otp' || name === 'otp-adorned') {
        await expect(control(page.locator(`#application-${name}`))).toHaveValue('012345');
        await expect(control(page.locator(`#application-${name}`))).toHaveAttribute('pattern', '[0-9]{6}');
      }
      const pristine = page.locator(`#pristine-${name}`);
      await feedback(pristine, false, extraPart);
      // Combobox required state belongs to its accepted value and FACE owner.
      // Grouped radio validation belongs to en-radio-group; its nameless
      // shadow input does not establish a native required radio group.
      if (name === 'combobox') {
        await expect(control(pristine)).toHaveAttribute('aria-required', 'true');
      } else if (name === 'radio') {
        await expect(control(pristine)).toHaveAttribute('required', '');
        expect(await control(pristine).evaluate(element => (element as HTMLInputElement).name), 'pristine radio native name').toBe('');
        await expect(control(pristine)).not.toBeChecked();
      } else {
        expect(await control(pristine).evaluate(element =>
          (element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).validity.valueMissing), name).toBe(true);
      }
    }
  } finally { await context.close(); }
});

test('hydration and authoritative error clearing retain native controls and invalid Part containers', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(fixture);
  const originals = [];
  for (const [name, extraPart] of cases) for (const mode of ['application', 'pristine']) {
    const host = page.locator(`#${mode}-${name}`);
    await feedback(host, mode === 'application', extraPart);
    expect(await host.evaluate(element => Boolean(customElements.get(element.localName))), `${mode}-${name} starts unregistered`).toBe(false);
    const editor = control(host);
    const node = await editor.elementHandle();
    const container = extraPart ? await host.locator(`[part~="${extraPart}"]`).elementHandle() : null;
    const state = await editor.evaluate(element => ({
      value: (element as HTMLInputElement).value,
      checked: element instanceof HTMLInputElement && ['checkbox', 'radio'].includes(element.type) ? element.checked : null,
    }));
    originals.push({ name, mode, extraPart, host, editor, node, container, state });
  }
  await page.evaluate(() => (window as any).hydrateInvalidParts());
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
  for (const original of originals) {
    const { name, mode, extraPart, host, editor, node, container, state } = original;
    await feedback(host, mode === 'application', extraPart);
    expect(await editor.evaluate((element, previous) => element === previous, node), `${mode}-${name} hydration identity`).toBe(true);
    if (extraPart) expect(await host.locator(`[part~="${extraPart}"]`).evaluate((element, previous) => element === previous, container), `${mode}-${name} container identity`).toBe(true);
    if (mode === 'application') {
      await host.evaluate(async element => {
        const field = element as HTMLElement & { error: string; updateComplete: Promise<unknown> };
        field.error = '';
        await field.updateComplete;
      });
      await feedback(host, false, extraPart);
    }
    expect(await editor.evaluate((element, previous) => element === previous, node), `${mode}-${name} error-clear identity`).toBe(true);
    expect(await editor.evaluate(element => ({
      value: (element as HTMLInputElement).value,
      checked: element instanceof HTMLInputElement && ['checkbox', 'radio'].includes(element.type) ? element.checked : null,
    })), `${mode}-${name} native state`).toEqual(state);
    if (extraPart) expect(await host.locator(`[part~="${extraPart}"]`).evaluate((element, previous) => element === previous, container), `${mode}-${name} cleared container identity`).toBe(true);
    await node?.dispose(); await container?.dispose();
  }
  expect(errors).toEqual([]);
});
