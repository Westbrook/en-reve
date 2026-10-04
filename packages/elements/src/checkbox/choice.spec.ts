import { test, expect, type Locator } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createReviewDraft, emitThemeCSS, resolveTheme, colorFromHex, contrastRatio } from '@en-reve/tokens';
import { controlStyles } from '@en-reve/styles/controls.js';

test.beforeEach(async ({ page }) => {
  await page.goto('/packages/elements/src/checkbox/choice-fixture.html');
  await expect(page.getByRole('checkbox', { name: 'Notify collaborators' })).toBeVisible();
});

for (const tag of ['en-checkbox', 'en-radio', 'en-switch']) {
  test(`${tag}: invalid control Part follows application and reported constraint feedback`, async ({ page }) => {
    await page.evaluate(async tag => {
      const form = document.createElement('form'); form.id = 'invalid-choice-form';
      const choice = document.createElement(tag) as HTMLElement & { required: boolean; checked: boolean; updateComplete: Promise<unknown> };
      choice.id = 'invalid-choice'; choice.textContent = 'Validation choice'; choice.setAttribute('name', 'choice'); choice.required = true; choice.checked = false;
      form.append(choice); document.body.append(form); await choice.updateComplete;
    }, tag);
    const host = page.locator('#invalid-choice'), control = host.locator('input[part~="control"]');
    const feedback = async (visible: boolean) => {
      await expect(host.locator('input[part~="control"]')).toHaveCount(1);
      await expect(host.locator('[part~="control-invalid"]')).toHaveCount(visible ? 1 : 0);
      await expect(host.locator('[part~="error"]')).toHaveCount(visible ? 1 : 0);
      if (visible) await expect(control).toHaveAttribute('aria-invalid', 'true');
      else await expect(control).not.toHaveAttribute('aria-invalid', 'true');
    };
    await expect(control).toBeVisible(); const original = await control.elementHandle();
    await feedback(false);
    expect(await host.evaluate(element => (element as HTMLElement & { validity: ValidityState }).validity.valueMissing)).toBe(true);
    await control.focus();
    for (const error of ['Application choice error', '']) {
      await host.evaluate(async (element, error) => { const choice = element as HTMLElement & { error: string; updateComplete: Promise<unknown> }; choice.error = error; await choice.updateComplete; }, error);
      await feedback(Boolean(error)); await expect(control).not.toBeChecked(); await expect(control).toBeFocused();
      expect(await control.evaluate((element, original) => element === original, original)).toBe(true);
    }
    expect(await host.evaluate(element => (element as HTMLElement & { reportValidity(): boolean }).reportValidity())).toBe(false);
    await feedback(true); await expect(control).toBeFocused();
    await control.press('Space'); await expect(control).toBeChecked(); await feedback(false);
    expect(await host.evaluate(element => (element as HTMLElement & { validity: ValidityState }).validity.valid)).toBe(true);
    await host.evaluate(async element => { const choice = element as HTMLElement & { error: string; updateComplete: Promise<unknown> }; choice.error = 'Selected application error'; await choice.updateComplete; });
    await feedback(true); await expect(control).toBeChecked();
    await host.evaluate(async element => { const choice = element as HTMLElement & { error: string; updateComplete: Promise<unknown> }; choice.error = ''; await choice.updateComplete; });
    await feedback(false); await expect(control).toBeChecked(); await expect(control).toBeFocused();
    await page.locator('#invalid-choice-form').evaluate(form => (form as HTMLFormElement).reset());
    await expect(control).not.toBeChecked(); await feedback(false); await expect(control).toBeFocused();
    expect(await host.evaluate(element => (element as HTMLElement & { validity: ValidityState }).validity.valueMissing)).toBe(true);
    expect(await control.evaluate((element, original) => element === original, original)).toBe(true);
    await original?.dispose();
  });
}

test('checkbox tentative checked state and FormData agree during one cancelable event', async ({ page }) => {
  const host = page.locator('en-checkbox');
  const checkbox = page.getByRole('checkbox', { name: 'Notify collaborators' });
  await host.evaluate((element: any) => {
    element.attempts = [];
    element.addEventListener('en-change', (event: CustomEvent) => {
      element.attempts.push({ checked: element.checked, entry: new FormData(element.closest('form')).get('notifications'),
        ...event.detail, cancelable: event.cancelable, bubbles: event.bubbles, composed: event.composed });
    });
  });
  expect(await host.evaluate(element => 'controlled' in element)).toBe(false);
  await page.getByText('Notify collaborators', { exact: true }).click();
  await expect(checkbox).toBeChecked();
  expect(await page.locator('form').evaluate((form: HTMLFormElement) => new FormData(form).get('notifications'))).toBe('yes');
  await host.evaluate((element: any) => element.addEventListener('en-change', (event: Event) => event.preventDefault(), { once: true }));
  await checkbox.press('Space');
  await expect(checkbox).toBeChecked();
  await expect(checkbox).toBeFocused();
  expect(await host.evaluate((element: any) => element.attempts)).toEqual([
    expect.objectContaining({ checked: true, entry: 'yes', previous: false, proposed: true, cancelable: true, bubbles: true, composed: true }),
    expect.objectContaining({ checked: false, entry: null, previous: true, proposed: false, cancelable: true }),
  ]);
  await host.evaluate((element: any) => {
    element.checked = false;
    element.addEventListener('en-change', (event: Event) => { event.preventDefault(); element.checked = element.checked; }, { once: true });
  });
  expect(await host.evaluate((element: any) => element.attempts.length)).toBe(2);
  await checkbox.press('Space');
  await expect(checkbox).toBeChecked();
  expect(await host.evaluate((element: any) => element.attempts.length)).toBe(3);
  expect(await page.locator('form').evaluate((form: HTMLFormElement) => new FormData(form).get('notifications'))).toBe('yes');
});

test('checkbox mixed state clears only after an accepted change', async ({ page }) => {
  const host = page.locator('en-checkbox');
  const checkbox = page.getByRole('checkbox', { name: 'Notify collaborators' });
  await host.evaluate((element: any) => {
    element.indeterminate = true;
    element.attempts = [];
    element.addEventListener('en-change', () => {
      element.attempts.push({ checked: element.checked, indeterminate: element.indeterminate });
    });
    element.addEventListener('en-change', (event: Event) => event.preventDefault(), { once: true });
  });
  await checkbox.press('Space');
  await expect(host).toHaveJSProperty('checked', false);
  await expect(host).toHaveJSProperty('indeterminate', true);
  await expect(checkbox).toHaveAttribute('aria-checked', 'mixed');
  expect(await host.evaluate((element: any) => element.attempts)).toEqual([{ checked: true, indeterminate: true }]);
  await checkbox.press('Space');
  await expect(host).toHaveJSProperty('checked', true);
  await expect(host).toHaveJSProperty('indeterminate', false);
  await expect(checkbox).not.toHaveAttribute('aria-checked', 'mixed');
  expect(await host.evaluate((element: any) => element.attempts)).toEqual([
    { checked: true, indeterminate: true }, { checked: true, indeterminate: true },
  ]);
});

test('switch supports cancellation and synchronous author acceptance without echo', async ({ page }) => {
  const host = page.locator('en-switch');
  const control = page.getByRole('switch', { name: 'Live preview' });
  await host.evaluate((element: any) => {
    element.attempts = 0;
    element.addEventListener('en-change', () => element.attempts++);
    element.addEventListener('en-change', (event: Event) => event.preventDefault(), { once: true });
  });
  await control.press('Space');
  await expect(control).toBeChecked();
  await host.evaluate((element: any) => {
    element.addEventListener('en-change', (event: CustomEvent) => { event.preventDefault(); element.checked = event.detail.proposed; }, { once: true });
  });
  await control.press('Space');
  await expect(control).not.toBeChecked();
  await expect(control).toBeFocused();
  expect(await host.evaluate((element: any) => element.attempts)).toBe(2);
});

test('radio group skips disabled options, wraps and retains focus on a rejected selection', async ({ page }) => {
  const group = page.getByRole('radiogroup', { name: 'Export format' });
  await expect(group).toBeVisible();
  // Slot distribution is represented in the accessibility tree; DOM descendant queries start at the public host.
  const png = page.locator('en-radio-group').getByRole('radio', { name: 'PNG', exact: true });
  const svg = page.locator('en-radio-group').getByRole('radio', { name: 'SVG', exact: true });
  await png.focus();
  await png.press('ArrowRight');
  await expect(svg).toBeFocused();
  await expect(svg).toBeChecked();
  await expect(png).not.toBeChecked();
  expect(await page.locator('form').evaluate((form: HTMLFormElement) => new FormData(form).getAll('format'))).toEqual(['svg']);
  await svg.press('ArrowRight');
  await expect(png).toBeChecked();
  await png.press('End');
  await expect(svg).toBeChecked();
  await page.locator('en-radio-group').evaluate((element: any) => element.addEventListener('en-change', (event: Event) => event.preventDefault(), { once: true }));
  await svg.press('Home');
  await expect(png).toBeFocused();
  await expect(png).not.toBeChecked();
  await expect(svg).toBeChecked();
  await png.press('Tab');
  // The next native Tab stop follows the browser/OS keyboard preference; the group must release focus.
  expect(await page.locator('en-radio-group').evaluate((element) => element.matches(':focus-within'))).toBe(false);
});

test('slider keyboard precision, cancellation and reset retain the accepted numeric value', async ({ page }) => {
  const slider = page.getByRole('slider', { name: 'Opacity' });
  await slider.focus();
  await slider.press('ArrowRight');
  await expect(slider).toHaveValue('0.3');
  await expect(page.locator('en-slider output')).toHaveText('0.3');
  expect(await page.locator('form').evaluate((form: HTMLFormElement) => new FormData(form).get('opacity'))).toBe('0.3');
  await page.locator('en-slider').evaluate((element: any) => element.addEventListener('en-change', (event: Event) => event.preventDefault(), { once: true }));
  await slider.press('ArrowRight');
  await expect(slider).toHaveValue('0.3');
  await expect(slider).toBeFocused();
  await page.getByRole('button', { name: 'Reset settings' }).click();
  await expect(slider).toHaveValue('0.2');
});

test('rating uses meaningful native score choices and restores canceled changes', async ({ page }) => {
  const group = page.getByRole('group', { name: 'Quality' });
  const three = group.getByRole('radio', { name: '3 of 5 stars', exact: true });
  const four = group.getByRole('radio', { name: '4 of 5 stars', exact: true });
  await three.focus();
  await three.press('ArrowRight');
  await expect(four).toBeChecked();
  expect(await page.locator('form').evaluate((form: HTMLFormElement) => new FormData(form).get('quality'))).toBe('4');
  await page.locator('en-rating').evaluate((element: any) => element.addEventListener('en-change', (event: Event) => event.preventDefault(), { once: true }));
  await four.press('ArrowLeft');
  await expect(three).toBeFocused();
  await expect(three).not.toBeChecked();
  await expect(four).toBeChecked();
  await group.getByText('No rating', { exact: true }).click();
  expect(await page.locator('en-rating').evaluate((element: any) => element.value)).toBe(0);
});

test('fieldset disability and form reset apply to the real controls', async ({ page }) => {
  await page.getByRole('checkbox', { name: 'Notify collaborators' }).check();
  await page.getByRole('radio', { name: 'SVG', exact: true }).check();
  await page.locator('#controls').evaluate((element: HTMLFieldSetElement) => { element.disabled = true; });
  await expect(page.getByRole('checkbox', { name: 'Notify collaborators' })).toBeDisabled();
  await expect(page.getByRole('switch', { name: 'Live preview' })).toBeDisabled();
  await expect(page.getByRole('slider', { name: 'Opacity' })).toBeDisabled();
  await expect(page.getByRole('radio', { name: '3 of 5 stars' })).toBeDisabled();
  expect(await page.locator('form').evaluate((form: HTMLFormElement) => [...new FormData(form).entries()])).toEqual([]);
  await page.locator('#controls').evaluate((element: HTMLFieldSetElement) => { element.disabled = false; });
  await page.getByRole('button', { name: 'Reset settings' }).click();
  await expect(page.getByRole('checkbox', { name: 'Notify collaborators' })).not.toBeChecked();
  await expect(page.getByRole('switch', { name: 'Live preview' })).toBeChecked();
  await expect(page.getByRole('radio', { name: 'PNG', exact: true })).toBeChecked();
  await expect(page.getByRole('radio', { name: 'SVG', exact: true })).not.toBeChecked();
});

test('required group validation focuses an option and synchronous author selection stays authoritative', async ({ page }) => {
  const png = page.getByRole('radio', { name: 'PNG', exact: true });
  const svg = page.getByRole('radio', { name: 'SVG', exact: true });
  await page.locator('en-radio-group').evaluate(async (element: any) => {
    element.required = true;
    element.value = '';
    await element.updateComplete;
  });
  expect(await page.locator('en-radio-group').evaluate((element: any) => element.reportValidity())).toBe(false);
  await expect(png).toBeFocused();
  await page.locator('en-radio-group').evaluate((element: any) => {
    element.attempts = 0;
    element.addEventListener('en-change', () => element.attempts++);
    element.addEventListener('en-change', (event: CustomEvent) => { event.preventDefault(); element.value = event.detail.proposed; });
  });
  await png.press('ArrowRight');
  await expect(svg).toBeChecked();
  expect(await page.locator('en-radio-group').evaluate((element: any) => element.checkValidity())).toBe(true);
  expect(await page.locator('en-radio-group').evaluate((element: any) => element.attempts)).toBe(1);
  await page.locator('en-radio[value="png"]').evaluate((element: any) => { element.checked = true; });
  await expect(png).not.toBeChecked();
  await expect(svg).toBeChecked();
});

test('form reset preserves application-owned state until the application handles the reset', async ({ page }) => {
  await page.locator('en-checkbox').evaluate((element: any) => { element.checked = true; });
  await page.locator('en-radio-group').evaluate((element: any) => { element.value = 'svg'; });
  await page.locator('en-slider').evaluate((element: any) => { element.value = 0.8; });
  await page.locator('form').evaluate(form => form.addEventListener('reset', event => event.preventDefault()));
  await page.getByRole('button', { name: 'Reset settings' }).click();
  await expect(page.getByRole('checkbox', { name: 'Notify collaborators' })).toBeChecked();
  await expect(page.getByRole('radio', { name: 'SVG', exact: true })).toBeChecked();
  await expect(page.getByRole('slider', { name: 'Opacity' })).toHaveValue('0.8');
  await page.locator('form').evaluate((form) => {
    form.addEventListener('reset', () => {
      (form.querySelector('en-checkbox') as any).checked = false;
      (form.querySelector('en-radio-group') as any).value = 'png';
      (form.querySelector('en-slider') as any).value = 0.2;
    });
  });
  await page.getByRole('button', { name: 'Reset settings' }).click();
  await expect(page.getByRole('checkbox', { name: 'Notify collaborators' })).not.toBeChecked();
  await expect(page.getByRole('radio', { name: 'PNG', exact: true })).toBeChecked();
  await expect(page.getByRole('slider', { name: 'Opacity' })).toHaveValue('0.2');
});

test('segmented choices have one Tab entry, named labels and wrapping RTL-aware navigation', async ({ page }) => {
  const group = page.getByRole('group', { name: 'Appearance', exact: true });
  const light = group.getByRole('radio', { name: 'Light', exact: true });
  const dark = group.getByRole('radio', { name: 'Dark', exact: true });
  const dim = group.getByRole('radio', { name: 'Dim', exact: true });
  await page.getByRole('textbox', { name: 'Before appearance' }).focus();
  await page.keyboard.press('Tab');
  await expect(light).toBeFocused();
  await expect(light).toBeChecked();
  await light.press('ArrowRight');
  await expect(dark).toBeFocused();
  await expect(dark).toBeChecked();
  await dark.press('End');
  await expect(dim).toBeChecked();
  await dim.press('ArrowRight');
  await expect(light).toBeChecked();
  await page.locator('en-segmented-control').evaluate((element: HTMLElement) => { element.dir = 'rtl'; });
  await light.press('ArrowRight');
  await expect(dim).toBeChecked();
  await dim.press('Tab');
  await expect(page.getByRole('textbox', { name: 'After appearance' })).toBeFocused();
  await page.locator('en-segmented-control').evaluate((element) => {
    const label = document.createElement('span'); label.slot = 'label'; label.textContent = 'Display appearance'; element.append(label);
  });
  await expect(page.getByRole('group', { name: 'Display appearance' })).toBeVisible();
});

test('segmented cancellation and authoritative writes preserve focus and form state', async ({ page }) => {
  const group = page.getByRole('group', { name: 'Appearance', exact: true });
  const light = group.getByRole('radio', { name: 'Light', exact: true });
  const dark = group.getByRole('radio', { name: 'Dark', exact: true });
  await page.locator('en-segmented-control').evaluate((element: any) => {
    element.attempts = 0; element.addEventListener('en-change', () => element.attempts++);
    element.addEventListener('en-change', (event: Event) => event.preventDefault(), { once: true });
  });
  await light.focus();
  await light.press('ArrowRight');
  await expect(dark).toBeFocused();
  await expect(dark).not.toBeChecked();
  await expect(light).toBeChecked();
  expect(await page.locator('form').evaluate((form: HTMLFormElement) => new FormData(form).get('appearance'))).toBe('light');
  await dark.press('Tab');
  await expect(page.getByRole('textbox', { name: 'After appearance' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(light).toBeFocused();
  await page.locator('en-segmented-control').evaluate((element: any) => {
    element.addEventListener('en-change', () => { element.value = 'light'; }, { once: true });
  });
  await dark.focus();
  await dark.press('Space');
  await expect(dark).not.toBeChecked();
  expect(await page.locator('en-segmented-control').evaluate((element: any) => element.attempts)).toBe(2);
  await page.locator('en-segmented-control').evaluate((element: any) => {
    element.addEventListener('en-change', (event: CustomEvent) => { event.preventDefault(); element.value = event.detail.proposed; });
  });
  await group.getByText('Dark', { exact: true }).click();
  await expect(dark).toBeChecked();
  expect(await page.locator('en-segmented-control').evaluate((element: any) => element.attempts)).toBe(3);
  expect(await page.locator('form').evaluate((form: HTMLFormElement) => new FormData(form).get('appearance'))).toBe('dark');
});

test('segmented padding and gaps activate the nearest option once', async ({ page }) => {
  const host = page.locator('en-segmented-control');
  const options = host.locator('[part=options]');
  const item = (label: string) => host.locator('[part~=option]').filter({ hasText: label });
  await host.evaluate((element: any) => {
    element.attempts = 0;
    element.addEventListener('en-change', () => element.attempts++);
  });
  // Use a generous themed gap so subpixel pointer rounding cannot change the intended nearest item.
  await page.addStyleTag({ content: 'en-segmented-control::part(options) { column-gap: 8px; }' });
  const points = [
    { label: 'Dark', edge: 'top', value: 'dark' },
    { label: 'Light', edge: 'bottom', value: 'light' },
    { label: 'Dim', edge: 'right', value: 'dim' },
    { label: 'Light', edge: 'left', value: 'light' },
    { label: 'Dark', edge: 'before', value: 'dark' },
  ];
  for (const point of points) {
    // Selection changes font weight and can move the gaps; measure the current layout.
    const outer = (await options.boundingBox())!;
    const box = (await item(point.label).boundingBox())!;
    const x = point.edge === 'left' ? outer.x + 2 : point.edge === 'right' ? outer.x + outer.width - 2
      : point.edge === 'before' ? box.x - 2 : box.x + box.width / 2;
    const y = point.edge === 'top' ? outer.y + 2 : point.edge === 'bottom' ? outer.y + outer.height - 2 : box.y + box.height / 2;
    await page.mouse.click(x, y);
    await expect(host.locator(`input[value="${point.value}"]`)).toBeChecked();
    await expect(host.locator(`input[value="${point.value}"]`)).toBeFocused();
    expect(await page.locator('form').evaluate((form: HTMLFormElement) => new FormData(form).get('appearance'))).toBe(point.value);
  }
  await item('Light').click();
  expect(await host.evaluate((element: any) => element.attempts)).toBe(6);
  // The legend/host are outside the option surface; a coordinate-free click has no nearest item.
  await host.locator('legend').click();
  await options.evaluate((element: HTMLElement) => element.click());
  expect(await host.evaluate((element: any) => element.attempts)).toBe(6);
});

test('segmented nearest-option hit testing follows RTL and wrapped rows', async ({ page }) => {
  const host = page.locator('en-segmented-control');
  const options = host.locator('[part=options]');
  await host.evaluate((element: HTMLElement) => { element.dir = 'rtl'; });
  let outer = (await options.boundingBox())!;
  let dim = (await host.locator('[part~=option]').filter({ hasText: 'Dim' }).boundingBox())!;
  await page.mouse.click(outer.x + 2, dim.y + dim.height / 2);
  await expect(host.getByRole('radio', { name: 'Dim', exact: true })).toBeChecked();
  await page.addStyleTag({ content: 'en-segmented-control::part(options) { width: 160px; row-gap: 12px; } en-segmented-control::part(option) { flex-basis: 100%; }' });
  await host.evaluate(async (element: any) => { element.value = 'light'; await element.updateComplete; });
  outer = (await options.boundingBox())!;
  const dark = (await host.locator('[part~=option]').filter({ hasText: 'Dark' }).boundingBox())!;
  dim = (await host.locator('[part~=option]').filter({ hasText: 'Dim' }).boundingBox())!;
  expect(dim.y).toBeGreaterThan(dark.y + dark.height);
  await page.mouse.click(dark.x + dark.width / 2, dark.y - 1);
  await expect(host.getByRole('radio', { name: 'Dark', exact: true })).toBeChecked();
  await page.mouse.click(dim.x + dim.width / 2, outer.y + outer.height - 2);
  await expect(host.getByRole('radio', { name: 'Dim', exact: true })).toBeChecked();
});

test('segmented gap activation preserves disabled and canceled selection with author acceptance', async ({ page }) => {
  const host = page.locator('en-segmented-control');
  const outer = (await host.locator('[part=options]').boundingBox())!;
  const pointFor = async (label: string) => {
    const box = (await host.locator('[part~=option]').filter({ hasText: label }).boundingBox())!;
    return { x: box.x + box.width / 2, y: outer.y + 2 };
  };
  const clickAbove = async (label: string) => { const point = await pointFor(label); await page.mouse.click(point.x, point.y); };
  await host.evaluate((element: any) => {
    element.attempts = 0;
    element.addEventListener('en-change', () => element.attempts++);
  });
  await clickAbove('System');
  expect(await host.evaluate((element: any) => element.attempts)).toBe(0);
  await host.evaluate((element: any) => element.addEventListener('en-change', (event: Event) => event.preventDefault(), { once: true }));
  await clickAbove('Dark');
  await expect(host.getByRole('radio', { name: 'Dark', exact: true })).toBeFocused();
  await expect(host.getByRole('radio', { name: 'Light', exact: true })).toBeChecked();
  await host.evaluate((element: any) => element.addEventListener('en-change', (event: Event) => event.preventDefault(), { once: true }));
  await clickAbove('Dark');
  await expect(host.getByRole('radio', { name: 'Light', exact: true })).toBeChecked();
  await host.evaluate((element: any) => element.addEventListener('en-change', (event: CustomEvent) => { event.preventDefault(); element.value = event.detail.proposed; }, { once: true }));
  await clickAbove('Dark');
  await expect(host.getByRole('radio', { name: 'Dark', exact: true })).toBeChecked();
  expect(await host.evaluate((element: any) => element.attempts)).toBe(3);
  await page.locator('#controls').evaluate((fieldset: HTMLFieldSetElement) => { fieldset.disabled = true; });
  await clickAbove('Light');
  expect(await host.evaluate((element: any) => element.attempts)).toBe(3);
});

test('segmented reset and unavailable selections preserve explicit application authority', async ({ page }) => {
  const group = page.getByRole('group', { name: 'Appearance', exact: true });
  await group.getByText('Dark', { exact: true }).click();
  await page.getByRole('button', { name: 'Reset settings' }).click();
  await expect(group.getByRole('radio', { name: 'Light', exact: true })).toBeChecked();
  await page.locator('en-segmented-control').evaluate((element: any) => {
    element.value = 'dark'; element.required = true;
  });
  await page.locator('form').evaluate(form => form.addEventListener('reset', event => event.preventDefault(), { once: true }));
  await page.getByRole('button', { name: 'Reset settings' }).click();
  await expect(group.getByRole('radio', { name: 'Dark', exact: true })).toBeChecked();
  await page.locator('en-segmented-control').evaluate((element: any) => {
    element.items = element.items.map((item: any) => item.value === 'dark' ? { ...item, disabled: true } : item);
  });
  await expect(group.getByRole('radio', { name: 'Dark', exact: true })).toBeDisabled();
  await expect(group.getByRole('radio', { name: 'Dark', exact: true })).toBeChecked();
  await test.info().attach('disabled-selection-accessibility', { body: await group.ariaSnapshot(), contentType: 'text/plain' });
  await test.info().attach('disabled-selection-state', { body: JSON.stringify(await page.locator('en-segmented-control').evaluate((element: any) => ({
    value: element.value,
    controls: [...element.shadowRoot.querySelectorAll('input')].map((input: HTMLInputElement) => ({
      value: input.value, checked: input.checked, disabled: input.disabled, name: input.name, tabIndex: input.tabIndex,
    })),
  })), null, 2), contentType: 'application/json' });
  expect(await page.locator('en-segmented-control').evaluate((element: any) => element.value)).toBe('dark');
  expect(await page.locator('form').evaluate((form: HTMLFormElement) => new FormData(form).get('appearance'))).toBe(null);
  expect(await page.locator('en-segmented-control').evaluate((element: any) => element.checkValidity())).toBe(false);
  await page.getByRole('textbox', { name: 'Before appearance' }).focus();
  await page.keyboard.press('Tab');
  await expect(group.getByRole('radio', { name: 'Light', exact: true })).toBeFocused();
  await page.locator('en-segmented-control').evaluate((element: any) => {
    element.items = element.items.filter((item: any) => item.value !== 'dark');
  });
  await expect(group.getByRole('radio', { name: 'Dark', exact: true })).toHaveCount(0);
  expect(await page.locator('en-segmented-control').evaluate((element: any) => element.value)).toBe('dark');
  expect(await page.locator('form').evaluate((form: HTMLFormElement) => new FormData(form).get('appearance'))).toBe(null);
  expect(await page.locator('en-segmented-control').evaluate((element: any) => element.checkValidity())).toBe(false);
});

test('segmented disabled choice recovery keeps truthful state and an actionable keyboard entry', async ({ page }) => {
  const group = page.getByRole('group', { name: 'Appearance', exact: true });
  const light = group.getByRole('radio', { name: 'Light', exact: true });
  const dark = group.getByRole('radio', { name: 'Dark', exact: true });
  await group.getByText('Dark', { exact: true }).click();
  await dark.focus();
  await page.locator('en-segmented-control').evaluate((element: any) => {
    element.items = element.items.map((item: any) => ({ ...item, disabled: true }));
  });
  await expect(dark).toBeDisabled();
  await expect(dark).toBeChecked();
  await page.getByRole('textbox', { name: 'Before appearance' }).focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('textbox', { name: 'After appearance' })).toBeFocused();
  expect(await page.locator('en-segmented-control').evaluate((element: any) => element.value)).toBe('dark');
  await page.locator('en-segmented-control').evaluate((element: any) => {
    element.items = element.items.map((item: any) => ({ ...item, disabled: item.value === 'system' }));
  });
  await expect(dark).toBeEnabled();
  await expect(dark).toBeChecked();
  await test.info().attach('reenabled-selection-accessibility', { body: await group.ariaSnapshot(), contentType: 'text/plain' });
  await page.keyboard.press('Shift+Tab');
  await expect(dark).toBeFocused();
  await page.locator('en-segmented-control').evaluate((element: any) => {
    element.items = element.items.map((item: any) => item.value === 'dark' ? { ...item, disabled: true } : item);
    element.required = true;
  });
  await expect(dark).toBeChecked();
  expect(await page.locator('en-segmented-control').evaluate((element: any) => element.reportValidity())).toBe(false);
  await expect(light).toBeFocused();
  expect(await page.locator('en-segmented-control').evaluate((element: any) => element.validationMessage)).toBe('Please select an option.');
  await light.press('Space');
  await expect(light).toBeChecked();
  await expect(dark).not.toBeChecked();
  expect(await page.locator('en-segmented-control').evaluate((element: any) => element.checkValidity())).toBe(true);
  expect(await page.locator('form').evaluate((form: HTMLFormElement) => new FormData(form).get('appearance'))).toBe('light');
});

test('named choice labels preserve fallback and medium size with explicit inheritance', async ({ page }) => {
  await page.locator('#controls').evaluate((element) => { element.setAttribute('size', 'large'); });
  await page.locator('en-checkbox').evaluate((element) => {
    const label = document.createElement('span'); label.slot = 'label'; label.textContent = 'Collaborator notifications'; element.append(label);
  });
  await expect(page.getByRole('checkbox', { name: 'Collaborator notifications', exact: true })).toBeVisible();
  await page.getByText('Collaborator notifications', { exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Collaborator notifications', exact: true })).toBeChecked();
  await page.locator('en-checkbox [slot="label"]').evaluate((element) => element.remove());
  await expect(page.getByRole('checkbox', { name: 'Notify collaborators', exact: true })).toBeChecked();
  for (const name of ['en-checkbox', 'en-switch', 'en-radio-group', 'en-radio', 'en-slider', 'en-rating', 'en-segmented-control']) {
    expect(await page.locator(name).first().evaluate((element: any) => element.size)).toBe('medium');
  }
  await page.locator('en-segmented-control').evaluate((element: any) => { element.size = 'small'; });
  await expect(page.locator('en-segmented-control')).toHaveAttribute('size', 'small');
  await page.locator('en-segmented-control').evaluate((element) => element.removeAttribute('size'));
  expect(await page.locator('en-segmented-control').evaluate((element: any) => element.size)).toBe('medium');
  await page.locator('en-segmented-control').evaluate((element: any) => { element.size = 'inherit'; });
  await expect(page.locator('en-segmented-control')).toHaveAttribute('size', 'inherit');
  expect(await page.locator('en-segmented-control').evaluate((element: any) => element.size)).toBe('inherit');
});

test('painted choices keep visible keyboard focus across forced-colors changes', async ({ page }) => {
  const rating = page.getByRole('group', { name: 'Quality', exact: true });
  const score = rating.getByRole('radio', { name: '3 of 5 stars', exact: true });
  await score.focus();
  await expect(score).toBeFocused();
  await page.locator('en-rating').screenshot({ path: test.info().outputPath('rating-focus.png') });
  await rating.getByRole('radio', { name: 'No rating', exact: true }).focus();
  await page.locator('en-rating').screenshot({ path: test.info().outputPath('rating-clear-focus.png') });
  const dark = page.getByRole('group', { name: 'Appearance', exact: true }).getByRole('radio', { name: 'Dark', exact: true });
  await dark.focus();
  await dark.press('Space');
  await expect(dark).toBeChecked();
  await expect(dark).toBeFocused();
  await page.locator('en-segmented-control').screenshot({ path: test.info().outputPath('segmented-focus.png') });
  await page.emulateMedia({ forcedColors: 'active' });
  await expect(dark).toBeFocused();
  await expect(dark).toBeChecked();
  await test.info().attach('forced-color-selected-text', { body: JSON.stringify(await page.locator('en-segmented-control').evaluate((element) => {
    const item = element.shadowRoot?.querySelector('[data-selected]');
    const label = item?.querySelector('[part="option-label"]');
    return [item, label].map((node) => {
      if (!node) return null;
      const style = getComputedStyle(node);
      return { text: node.textContent?.trim(), color: style.color, background: style.backgroundColor, forcedColorAdjust: style.forcedColorAdjust };
    });
  }), null, 2), contentType: 'application/json' });
  await page.locator('en-segmented-control').screenshot({ path: test.info().outputPath('segmented-focus-forced-colors.png') });
  await score.focus();
  await expect(score).toBeFocused();
  await page.locator('en-rating').screenshot({ path: test.info().outputPath('rating-focus-forced-colors.png') });
  for (const forcedColors of ['none', 'active'] as const) {
    await page.emulateMedia({ forcedColors });
    const checkbox = page.getByRole('checkbox', { name: 'Notify collaborators', exact: true });
    await checkbox.focus();
    await checkbox.press('Space');
    await expect(checkbox).toBeFocused();
    await page.locator('#controls').screenshot({ path: test.info().outputPath(`checkbox-focus-${forcedColors}.png`) });
    const radio = page.getByRole('radio', { name: 'PNG', exact: true });
    await radio.focus();
    await radio.press('Space');
    await expect(radio).toBeFocused();
    await page.locator('#controls').screenshot({ path: test.info().outputPath(`radio-focus-${forcedColors}.png`) });
    const slider = page.getByRole('slider', { name: 'Opacity', exact: true });
    await slider.focus();
    await slider.press('ArrowRight');
    await expect(slider).toBeFocused();
    await page.locator('#controls').screenshot({ path: test.info().outputPath(`slider-focus-${forcedColors}.png`) });
  }
  await page.locator('en-segmented-control').evaluate((element: any) => {
    element.items = element.items.map((item: any) => item.value === 'dark' ? { ...item, disabled: true } : item);
  });
  await expect(dark).toBeChecked();
  await expect(dark).toBeDisabled();
  const light = page.getByRole('group', { name: 'Appearance', exact: true }).getByRole('radio', { name: 'Light', exact: true });
  await light.focus();
  await expect(light).toBeFocused();
  await expect(light).not.toBeChecked();
  await page.locator('en-segmented-control').screenshot({ path: test.info().outputPath('segmented-selected-disabled-forced-colors.png') });
});

function fluentRadioDraft() {
  const draft = createReviewDraft();
  const edits = JSON.parse(readFileSync(new URL('./fixtures/fluent-radio.dark.json', import.meta.url), 'utf8'));
  for (const edit of edits) {
    if (edit.type === 'context') draft.setContext({mode: edit.mode, density: edit.density});
    else if (edit.type === 'token') draft.setToken(edit.id, edit.value);
    else if (edit.type === 'restore') draft.restoreToken(edit.id);
    else throw new Error(`Unexpected candidate edit ${edit.type}`);
  }
  return draft;
}

async function paintedRadio(control: Locator) {
  return control.evaluate(element => {
    const ordinary = getComputedStyle(element);
    const dot = getComputedStyle(element, '::before');
    const rectangle = element.getBoundingClientRect();
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d')!;
    const color = (value: string) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = value;
      context.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
      return {colorSpace: 'srgb' as const, components: [r / 255, g / 255, b / 255] as const, alpha: a / 255};
    };
    return {
      dot: dot.backgroundColor, interior: ordinary.backgroundColor, rim: ordinary.borderTopColor,
      content: dot.content, dotColor: color(dot.backgroundColor), interiorColor: color(ordinary.backgroundColor),
      rimColor: color(ordinary.borderTopColor), outline: ordinary.outlineColor,
      outlineStyle: ordinary.outlineStyle, outlineWidth: parseFloat(ordinary.outlineWidth),
      width: rectangle.width, height: rectangle.height,
    };
  });
}

test('Fluent dark checked radio paint is distinct from action fill and survives keyboard/disabled transitions', async ({page}) => {
  const draft = fluentRadioDraft();
  draft.restoreToken('component.radio.selected-color');
  const stylesheet = await page.addStyleTag({content: emitThemeCSS(draft.theme, {scope: 'root', colorScheme: true})});
  await page.addStyleTag({content: `${controlStyles.cssText}\nbody {background: var(--en-color-surface);color: var(--en-color-text)} #controls {background: var(--en-color-surface-raised)}`});
  await page.locator('#after').evaluate(element => element.classList.add('en-button'));
  const filledButton = page.getByRole('button', {name: 'After settings'});
  const checkbox = page.getByRole('checkbox', {name: 'Notify collaborators'});
  const toggle = page.getByRole('switch', {name: 'Live preview'});
  const png = page.locator('en-radio-group').getByRole('radio', {name: 'PNG', exact: true});
  const svg = page.locator('en-radio-group').getByRole('radio', {name: 'SVG', exact: true});
  await checkbox.click();
  const before = await paintedRadio(png);
  const uncheckedRim = (await paintedRadio(svg)).rim;
  const actionPaint = async () => Promise.all([filledButton, checkbox, toggle].map(control => control.evaluate(element => getComputedStyle(element).backgroundColor)));
  // Adding the native button recipe starts its normal background transition.
  await expect.poll(actionPaint).toEqual(['rgb(17, 94, 163)', 'rgb(17, 94, 163)', 'rgb(17, 94, 163)']);
  const beforeActionPaint = await actionPaint();
  expect(beforeActionPaint).toEqual(['rgb(17, 94, 163)', 'rgb(17, 94, 163)', 'rgb(17, 94, 163)']);
  expect(contrastRatio(before.dotColor, before.interiorColor)).toBeLessThan(3);
  draft.setToken('component.radio.selected-color', '{palette.accent}');
  await stylesheet.evaluate((element, css) => {element.textContent = css;}, emitThemeCSS(draft.theme, {scope: 'root', colorScheme: true}));
  const after = await paintedRadio(png);
  expect(after.dot).toBe('rgb(71, 158, 245)');
  expect(after.rim).toBe(after.dot);
  expect(after.interior).toBe('rgb(41, 41, 41)');
  expect(contrastRatio(after.dotColor, after.interiorColor)).toBeGreaterThanOrEqual(3);
  expect(after.width).toBe(before.width);
  expect(after.height).toBe(before.height);
  expect(await actionPaint()).toEqual(beforeActionPaint);
  for (const surface of ['#292929', '#1f1f1f']) {
    // The rim sits against this actually painted surrounding fieldset surface.
    await page.locator('#controls').evaluate((element, value) => {element.style.backgroundColor = value;}, surface);
    expect(contrastRatio(after.rimColor, colorFromHex(surface))).toBeGreaterThanOrEqual(3);
  }
  await png.focus();
  await png.press('ArrowRight');
  await expect(svg).toBeChecked();
  await expect(svg).toBeFocused();
  await expect(png).not.toBeChecked();
  const moved = await paintedRadio(svg);
  expect(moved.dot).toBe(after.dot);
  expect(moved.outlineStyle).not.toBe('none');
  expect(moved.outlineWidth).toBeGreaterThan(0);
  expect(moved.outline).toBe('rgb(255, 255, 255)');
  expect((await paintedRadio(png)).content).toBe('none');
  expect((await paintedRadio(png)).rim).toBe(uncheckedRim);
  expect(await page.locator('form').evaluate((form: HTMLFormElement) => new FormData(form).get('format'))).toBe('svg');
  await page.locator('en-radio[value="svg"]').evaluate((element: any) => {element.disabled = true;});
  await expect(svg).toBeDisabled();
  expect((await paintedRadio(svg)).dot).toBe('rgb(173, 173, 173)');
});

test('checked radio customization follows partial inheritance and resets at a full child theme', async ({page}) => {
  const draft = fluentRadioDraft();
  await page.addStyleTag({content: emitThemeCSS(draft.theme, {scope: 'root', colorScheme: true})});
  const png = page.locator('en-radio-group').getByRole('radio', {name: 'PNG', exact: true});
  expect((await paintedRadio(png)).dot).toBe('rgb(71, 158, 245)');
  const child = resolveTheme({mode: 'light', pins: {'palette.action': colorFromHex('#2457d6')}});
  const boundary = await page.addStyleTag({content: emitThemeCSS(child, {selector: '#controls', kind: 'partial', tokenIds: ['color.text']})});
  expect((await paintedRadio(png)).dot).toBe('rgb(71, 158, 245)');
  await boundary.evaluate((element, css) => {element.textContent = css;}, emitThemeCSS(child, {selector: '#controls', colorScheme: true}));
  expect((await paintedRadio(png)).dot).toBe('rgb(36, 87, 214)');
  await page.locator('en-radio[value="png"]').evaluate((element: HTMLElement) => {element.style.setProperty('--en-radio-selected-color', '#005a9c');});
  expect((await paintedRadio(png)).dot).toBe('rgb(0, 90, 156)');
  await page.locator('en-radio[value="png"]').evaluate((element: HTMLElement) => {element.style.removeProperty('--en-radio-selected-color');});
  expect((await paintedRadio(png)).dot).toBe('rgb(36, 87, 214)');
});

test('system radio colors override the optional selected color and retain disabled distinction', async ({page, browserName}) => {
  test.skip(browserName !== 'chromium', 'This focused system-palette probe requires Chromium forced-colors emulation.');
  const draft = fluentRadioDraft();
  await page.addStyleTag({content: emitThemeCSS(draft.theme, {scope: 'root', colorScheme: true})});
  await page.emulateMedia({forcedColors: 'active'});
  const system = await page.evaluate(() => {
    const probe = document.createElement('span');
    document.body.append(probe);
    const read = (value: string) => {probe.style.color = value; return getComputedStyle(probe).color;};
    const colors = {text: read('CanvasText'), disabled: read('GrayText'), canvas: read('Canvas')};
    probe.remove();
    return colors;
  });
  const png = page.locator('en-radio-group').getByRole('radio', {name: 'PNG', exact: true});
  await png.focus();
  await png.press('Space');
  const checked = await paintedRadio(png);
  expect(checked.dot).toBe(system.text);
  expect(checked.rim).toBe(system.text);
  expect(checked.interior).toBe(system.canvas);
  expect(checked.outline).toBe(system.text);
  await page.locator('en-radio[value="png"]').evaluate((element: any) => {element.disabled = true;});
  await expect(png).toBeDisabled();
  const disabled = await paintedRadio(png);
  expect(disabled.dot).toBe(system.disabled);
  expect(disabled.rim).toBe(system.disabled);
});
