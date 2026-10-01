import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const fixture = `/@fs${fileURLToPath(new URL('./index.html', import.meta.url))}`;
const accepted = (page: Page, id: string) => page.locator(`#${id}`).evaluate((element: any) => element.value);
const write = (page: Page, id: string, value: string) => page.locator(`#${id}`).evaluate(async (element: any, value) => { element.value = value; await element.updateComplete; }, value);
const events = (page: Page, id: string, type: string) => page.evaluate(({ id, type }) => (window as any).formFixture.events.filter((event: any) => event.id === id && event.type === type), { id, type });

test.beforeEach(async ({ page, browser }, testInfo) => {
  testInfo.annotations.push({ type: 'browser-version', description: browser.version() });
  await page.goto(fixture);
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
});

test('all seven native controls render their accepted values and accessible labels', async ({ page }) => {
  for (const id of ['email', 'notes', 'search', 'date', 'format', 'number', 'color']) {
    expect(await page.locator(`#${id}`).evaluate(element => 'controlled' in element)).toBe(false);
  }
  await expect(page.getByRole('textbox', { name: 'Contact email', exact: true })).toHaveValue('first@example.com');
  await expect(page.getByRole('textbox', { name: 'Contact email', exact: true })).toHaveAccessibleDescription('Use your work email.');
  await expect(page.getByRole('textbox', { name: 'Project notes', exact: true })).toHaveValue('Initial notes');
  await expect(page.getByRole('searchbox', { name: 'Asset search', exact: true })).toHaveValue('linen');
  await expect(page.getByLabel('Publish date', { exact: true })).toHaveValue('2026-09-18');
  await expect(page.getByRole('combobox', { name: 'Export format', exact: true })).toHaveValue('png');
  await expect(page.getByRole('spinbutton', { name: 'Corner radius', exact: true })).toHaveValue('12');
  await expect(page.getByLabel('Accent color', { exact: true })).toHaveValue('#336699');
  await page.getByText('Contact email', { exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Contact email', exact: true })).toBeFocused();
});

test('native user edits commit strings and submit accepted data; reset restores initial values', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Contact email', exact: true }).fill('next@example.com');
  await page.getByRole('textbox', { name: 'Project notes', exact: true }).fill('A new direction');
  await page.getByRole('searchbox', { name: 'Asset search', exact: true }).fill('wool');
  await page.getByLabel('Publish date', { exact: true }).fill('2026-10-10');
  await page.getByRole('combobox', { name: 'Export format', exact: true }).selectOption('svg');
  await page.getByRole('button', { name: 'Increase value', exact: true }).click();
  await expect(page.getByRole('spinbutton', { name: 'Corner radius', exact: true })).toHaveValue('14');
  await page.getByRole('button', { name: 'Submit settings', exact: true }).click();
  expect(await page.evaluate(() => (window as any).formFixture.submissions)).toEqual([{ email: 'next@example.com', notes: 'A new direction', search: 'wool', date: '2026-10-10', format: 'svg', radius: '14', accent: '#336699' }]);
  for (const id of ['email', 'notes', 'search', 'date', 'format', 'number']) {
    expect(await events(page, id, 'en-request-change')).toHaveLength(0);
    expect((await events(page, id, 'en-change')).length).toBeGreaterThan(0);
  }
  await page.getByRole('button', { name: 'Reset settings', exact: true }).click();
  expect(await accepted(page, 'email')).toBe('first@example.com');
  await expect(page.getByRole('textbox', { name: 'Project notes', exact: true })).toHaveValue('Initial notes');
  await expect(page.getByRole('combobox', { name: 'Export format', exact: true })).toHaveValue('png');
  await expect(page.getByRole('spinbutton', { name: 'Corner radius', exact: true })).toHaveValue('12');
});

test('controlled and canceled native drafts preserve editing; explicit property writes reconcile silently', async ({ page }) => {
  const input = page.getByRole('textbox', { name: 'Controlled text', exact: true });
  await input.fill('draft text');
  await input.press('ArrowLeft');
  const selection = await input.evaluate((element: HTMLInputElement) => [element.selectionStart, element.selectionEnd]);
  await page.locator('#controlled').evaluate(async (element: any) => { element.description = 'Unrelated render'; await element.updateComplete; });
  await expect(input).toHaveValue('draft text');
  expect(await input.evaluate((element: HTMLInputElement) => [element.selectionStart, element.selectionEnd])).toEqual(selection);
  expect(await accepted(page, 'controlled')).toBe('accepted');
  expect(await events(page, 'controlled', 'en-change')).toHaveLength(1);
  await write(page, 'controlled', 'accepted');
  await expect(input).toHaveValue('accepted');
  expect(await events(page, 'controlled', 'en-change')).toHaveLength(1);
  const canceled = page.getByRole('textbox', { name: 'Canceled text', exact: true });
  await canceled.fill('unaccepted draft');
  expect(await accepted(page, 'canceled')).toBe('stable');
  await expect(canceled).toHaveValue('unaccepted draft');
  expect(await events(page, 'canceled', 'en-change')).toHaveLength(1);
  await write(page, 'canceled', 'stable');
  await expect(canceled).toHaveValue('stable');
  const notes = page.getByRole('textbox', { name: 'Controlled notes', exact: true });
  await notes.fill('multiline draft\nsecond line');
  expect(await accepted(page, 'controlled-notes')).toBe('accepted notes');
  await write(page, 'controlled-notes', 'accepted notes');
  await expect(notes).toHaveValue('accepted notes');
});

test('canceled select restores native selection and step buttons await acceptance', async ({ page }) => {
  const select = page.getByRole('combobox', { name: 'Controlled format', exact: true });
  await select.selectOption('svg');
  expect(await accepted(page, 'controlled-select')).toBe('png');
  await expect(select).toHaveValue('png');
  await write(page, 'controlled-select', 'png');
  await expect(select).toHaveValue('png');
  await page.getByRole('button', { name: 'Increase controlled radius', exact: true }).click();
  const number = page.getByRole('spinbutton', { name: 'Controlled radius', exact: true });
  await expect(number).toHaveValue('10');
  expect(await accepted(page, 'controlled-number')).toBe('10');
  const changes = await events(page, 'controlled-number', 'en-change');
  expect(changes.at(-1).detail).toEqual({ previous: '10', proposed: '11', reason: 'increment' });
  expect(changes).toHaveLength(1);
  await write(page, 'controlled-number', '11');
  await expect(number).toHaveValue('11');
});

test('native required/type/range constraints block invalid data and errors recover', async ({ page }) => {
  const email = page.getByRole('textbox', { name: 'Contact email', exact: true });
  await email.fill('not-an-email');
  await page.getByRole('button', { name: 'Submit settings', exact: true }).click();
  expect(await page.evaluate(() => (window as any).formFixture.submissions)).toHaveLength(0);
  expect(await page.locator('#email').evaluate((element: any) => element.validity.typeMismatch)).toBe(true);
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await email.fill('valid@example.com');
  await expect(email).not.toHaveAttribute('aria-invalid', 'true');
  await page.getByRole('spinbutton', { name: 'Corner radius', exact: true }).fill('50');
  expect(await page.locator('#number').evaluate((element: any) => element.checkValidity())).toBe(false);
  await page.getByRole('spinbutton', { name: 'Corner radius', exact: true }).fill('16');
  await email.fill('');
  expect(await page.locator('#email').evaluate((element: any) => element.checkValidity())).toBe(false);
  await email.fill('valid@example.com');
  await page.getByRole('button', { name: 'Submit settings', exact: true }).click();
  expect(await page.evaluate(() => (window as any).formFixture.submissions)).toHaveLength(1);
});

test('disabled fieldsets disable all native controls and exclude accepted form data', async ({ page }) => {
  await page.locator('#fields').evaluate((element: HTMLFieldSetElement) => { element.disabled = true; });
  for (const name of ['Contact email', 'Project notes', 'Asset search', 'Publish date', 'Export format', 'Corner radius', 'Accent color']) await expect(page.getByLabel(name, { exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Submit settings', exact: true }).click();
  expect(await page.evaluate(() => (window as any).formFixture.submissions)).toEqual([{}]);
  await page.locator('#fields').evaluate((element: HTMLFieldSetElement) => { element.disabled = false; });
  await expect(page.getByRole('textbox', { name: 'Contact email', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Submit settings', exact: true }).click();
  expect(await page.evaluate(() => (window as any).formFixture.submissions[1].email)).toBe('first@example.com');
});

test('named label slots replace attribute names and restore fallbacks across the field family', async ({ page }) => {
  const names = { email: 'Contact email', notes: 'Project notes', search: 'Asset search', date: 'Publish date', format: 'Export format', number: 'Corner radius', color: 'Accent color' };
  for (const [id, fallback] of Object.entries(names)) {
    await page.locator(`#${id}`).evaluate((element, text) => {
      const label = document.createElement('span');
      label.slot = 'label';
      label.textContent = text;
      element.append(label);
    }, `Slotted ${fallback}`);
    // getByLabel currently reads label DOM text rather than the flattened slot text.
    // The public control Part lets this assertion check the native control's actual accessible name.
    const control = page.locator(`#${id}`).locator('[part=control]');
    await expect(control).toHaveAccessibleName(`Slotted ${fallback}`);
    if (id === 'email' || id === 'notes') {
      await page.locator(`#${id} [slot=label]`).click();
      await expect(control).toBeFocused();
    }
    await page.locator(`#${id} [slot=label]`).evaluate((label, text) => { label.textContent = text; }, `Revised ${fallback}`);
    await expect(control).toHaveAccessibleName(`Revised ${fallback}`);
    await page.locator(`#${id} [slot=label]`).evaluate(label => label.remove());
    await expect(control).toHaveAccessibleName(fallback);
  }
  await page.locator('#number').evaluate(element => {
    const label = document.createElement('span');
    label.slot = 'increment-label';
    label.textContent = 'Make corners rounder';
    element.append(label);
  });
  await page.getByRole('button', { name: 'Make corners rounder', exact: true }).click();
  await expect(page.getByRole('spinbutton', { name: 'Corner radius', exact: true })).toHaveValue('14');
});

test('DOM color input edits preserve controlled drafts and submit/reset accepted colors', async ({ page }, testInfo) => {
  testInfo.annotations.push({ type: 'color-selection-evidence', description: 'Playwright fill drives the DOM input adapter; native OS chooser selection is not exercised.' });
  const color = page.getByLabel('Accent color', { exact: true });
  await color.fill('#aa5577');
  expect(await accepted(page, 'color')).toBe('#aa5577');
  expect((await events(page, 'color', 'en-input')).length).toBeGreaterThan(0);
  expect((await events(page, 'color', 'en-change')).length).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Submit settings', exact: true }).click();
  expect(await page.evaluate(() => (window as any).formFixture.submissions[0].accent)).toBe('#aa5577');
  await page.getByRole('button', { name: 'Reset settings', exact: true }).click();
  await expect(color).toHaveValue('#336699');
  const controlled = page.getByLabel('Controlled color', { exact: true });
  await controlled.fill('#abcdef');
  expect(await accepted(page, 'controlled-color')).toBe('#334455');
  await expect(controlled).toHaveValue('#abcdef');
  expect((await events(page, 'controlled-color', 'en-change')).length).toBeGreaterThan(0);
  await write(page, 'controlled-color', '#334455');
  await expect(controlled).toHaveValue('#334455');
  await write(page, 'controlled-color', '#AABBCC');
  expect(await accepted(page, 'controlled-color')).toBe('#aabbcc');
});

test('the compound number field joins its segments and preserves native keyboard stepping', async ({ page }, testInfo) => {
  const number = page.getByRole('spinbutton', { name: 'Corner radius', exact: true });
  const decrease = page.getByRole('button', { name: 'Decrease value', exact: true });
  const increase = page.getByRole('button', { name: 'Increase value', exact: true });
  const [left, center, right] = await Promise.all([decrease.boundingBox(), number.boundingBox(), increase.boundingBox()]);
  expect(Math.abs(left!.x + left!.width - center!.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(center!.x + center!.width - right!.x)).toBeLessThanOrEqual(1);
  await number.focus();
  await number.press('ArrowUp');
  await expect(number).toHaveValue('14');
  await number.press('ArrowDown');
  await expect(number).toHaveValue('12');
  await decrease.click();
  await expect(number).toHaveValue('10');
  await page.locator('#number').screenshot({ path: testInfo.outputPath('compound-number.png') });
});

test('select enhancement preserves real popup and keyboard operation with a platform fallback', async ({ page }, testInfo) => {
  const select = page.getByRole('combobox', { name: 'Export format', exact: true });
  const capabilities = await select.evaluate(control => ({
    enhanced: CSS.supports('appearance', 'base-select') && CSS.supports('selector(::picker(select))'),
    appearance: getComputedStyle(control).appearance,
  }));
  testInfo.annotations.push({ type: 'select-rendering', description: JSON.stringify(capabilities) });
  if (capabilities.enhanced) {
    expect(capabilities.appearance).toBe('base-select');
    await select.click();
    await expect(select.getByRole('option', { name: 'SVG image', exact: true })).toBeVisible();
    await expect(select.getByRole('option', { name: 'PDF document', exact: true })).toBeDisabled();
    await page.keyboard.press('Escape');
    await expect(select).toHaveValue('png');
    await select.click();
    await select.getByRole('option', { name: 'SVG image', exact: true }).click();
    await expect(select).toHaveValue('svg');
  } else {
    expect(capabilities.appearance).not.toBe('base-select');
    await select.focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('Escape');
    await expect(select).toHaveValue('png');
  }
  await select.focus();
  await page.keyboard.press('p');
  await page.keyboard.press('Tab');
  await expect(select).toHaveValue('png');
  await select.focus();
  if (capabilities.enhanced) {
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
  } else {
    // Typeahead is exercised in the platform control. Native popup-key parity is tested separately.
    await page.keyboard.press('s');
  }
  await page.keyboard.press('Tab');
  await expect(select).toHaveValue('svg');
  expect(await accepted(page, 'format')).toBe('svg');
  await page.locator('#format').evaluate(element => { (element as HTMLElement).style.setProperty('--en-select-appearance', 'auto'); });
  expect(await select.evaluate(control => getComputedStyle(control).appearance)).not.toBe('base-select');
  await select.selectOption('png');
  await page.getByRole('button', { name: 'Submit settings', exact: true }).click();
  expect(await page.evaluate(() => (window as any).formFixture.submissions[0].format)).toBe('png');
});

test('controlled form data and validity follow accepted value while readonly prevents native editing', async ({ page }) => {
  await page.locator('#email').evaluate(element => element.addEventListener('en-change', event => event.preventDefault()));
  const email = page.getByRole('textbox', { name: 'Contact email', exact: true });
  await email.fill('not-accepted');
  expect(await page.locator('#email').evaluate((element: any) => element.checkValidity())).toBe(true);
  await page.getByRole('button', { name: 'Submit settings', exact: true }).click();
  expect(await page.evaluate(() => (window as any).formFixture.submissions[0].email)).toBe('first@example.com');
  await write(page, 'email', '');
  await email.fill('unaccepted@example.com');
  expect(await page.locator('#email').evaluate((element: any) => element.checkValidity())).toBe(false);
  await page.getByRole('button', { name: 'Submit settings', exact: true }).click();
  expect(await page.evaluate(() => (window as any).formFixture.submissions)).toHaveLength(1);
  await write(page, 'email', 'first@example.com');
  await page.locator('#email').evaluate(async (element: any) => { element.readOnly = true; await element.updateComplete; });
  await expect(email).not.toBeEditable();
  await email.focus();
  await email.press('End');
  await email.press('x');
  await expect(email).toHaveValue('first@example.com');
});

test('the actual sticker sheet renders all seven forms and supports native interaction', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('textbox', { name: 'Project name', exact: true }).first()).toHaveValue('Studio studies');
  await expect(page.getByRole('textbox', { name: 'Creative direction', exact: true })).toHaveValue('Explore softer materials and a warmer palette.');
  await page.getByRole('searchbox', { name: 'Find an asset', exact: true }).fill('materials');
  await page.locator('[data-specimen="structured-values"]').getByRole('combobox', { name: 'Export format', exact: true }).selectOption('svg');
  await expect(page.locator('[data-specimen="structured-values"]').getByRole('combobox', { name: 'Export format', exact: true })).toHaveValue('svg');
  await expect(page.locator('[data-specimen="structured-values"]').getByLabel('Review date', { exact: true })).toHaveValue('2026-09-18');
  await page.getByRole('spinbutton', { name: 'Corner radius', exact: true }).fill('18');
  await expect(page.getByRole('spinbutton', { name: 'Corner radius', exact: true })).toHaveValue('18');
  await expect(page.getByRole('textbox', { name: 'Shared workspace', exact: true })).toBeDisabled();
  const accent = page.getByLabel('Accent seed', { exact: true });
  await accent.fill('#7055aa');
  await expect(accent).toHaveValue('#7055aa');
  await expect.poll(() => page.locator('en-color-field').first().evaluate((element: any) => element.value)).toBe('#7055aa');
});

test('a canceled field change exposes tentative property, validity and FormData, then restores submission state', async ({ page }) => {
  await page.locator('#email').evaluate(element => {
    element.addEventListener('en-change', event => {
      const host = element as any;
      (window as any).fieldTransaction = {
        value: host.value, formValue: new FormData(host.form).get('email'),
        typeMismatch: host.validity.typeMismatch, cancelable: event.cancelable,
        bubbles: event.bubbles, composed: event.composed, detail: (event as CustomEvent).detail,
      };
      event.preventDefault();
    });
  });
  const input = page.getByRole('textbox', { name: 'Contact email', exact: true });
  // A single physical key edit tests ordinary input independently of engine-specific fill/composition paths.
  await input.focus();
  await input.press('ControlOrMeta+A');
  await input.press('r');
  expect(await page.evaluate(() => (window as any).fieldTransaction)).toEqual({
    value: 'r', formValue: 'r', typeMismatch: true,
    cancelable: true, bubbles: true, composed: true,
    detail: { previous: 'first@example.com', proposed: 'r', reason: 'input' },
  });
  await expect(input).toHaveValue('r');
  await expect(input).toBeFocused();
  expect(await accepted(page, 'email')).toBe('first@example.com');
  expect(await page.locator('#email').evaluate((element: any) => ({
    value: new FormData(element.form).get('email'), valid: element.validity.valid,
  }))).toEqual({ value: 'first@example.com', valid: true });
  expect(await events(page, 'email', 'en-change')).toHaveLength(1);
  expect(await events(page, 'email', 'en-request-change')).toHaveLength(0);
});

for (const authoritative of ['proposed', 'previous', 'replacement'] as const) test(`a ${authoritative} author write during cancellation determines the field's settled value`, async ({ page }) => {
  await page.locator('#email').evaluate((element, authoritative) => {
    element.addEventListener('en-change', event => {
      const detail = (event as CustomEvent).detail;
      event.preventDefault();
      // Assigning the already-staged proposed value is still an authoritative write.
      (element as any).value = authoritative === 'replacement' ? 'owner@example.com' : detail[authoritative];
    }, { once: true });
  }, authoritative);
  const input = page.getByRole('textbox', { name: 'Contact email', exact: true });
  await input.fill('next@example.com');
  const expected = authoritative === 'proposed' ? 'next@example.com' : authoritative === 'previous' ? 'first@example.com' : 'owner@example.com';
  await expect(input).toHaveValue(expected);
  await expect(input).toBeFocused();
  expect(await accepted(page, 'email')).toBe(expected);
  expect(await page.locator('#managed-form').evaluate(form => new FormData(form as HTMLFormElement).get('email'))).toBe(expected);
  expect(await events(page, 'email', 'en-change')).toHaveLength(1);
});
