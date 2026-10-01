import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/packages/elements/src/accordion/tests/fixture.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('accordion preserves trigger focus and honors cancellation and authoritative writes', async ({ page }) => {
  const layers = page.getByRole('button', { name: 'Layers', exact: true });
  const history = page.getByRole('button', { name: 'History', exact: true });
  await expect(page.getByRole('button', { name: 'New layer' })).toBeVisible();
  await history.focus();
  await history.press('Enter');
  await expect(history).toBeFocused();
  await expect(history).toHaveAttribute('aria-expanded', 'true');
  await expect(layers).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('button', { name: 'Restore version' })).toBeVisible();
  await page.locator('#sections').evaluate((element) => {
    element.addEventListener('en-change', (event) => event.preventDefault(), { once: true });
  });
  await layers.click();
  await expect(history).toHaveAttribute('aria-expanded', 'true');
  await expect(layers).toHaveAttribute('aria-expanded', 'false');
  await page.locator('#sections').evaluate((element: any) => { element.addEventListener('en-change', (event: Event) => event.preventDefault(), { once: true }); });
  await layers.click();
  await expect(layers).toHaveAttribute('aria-expanded', 'false');
  await page.locator('#sections').evaluate((element: any) => {
    element.addEventListener('en-change', (event: any) => { event.preventDefault(); element.value = event.detail.proposed; }, { once: true });
  });
  await layers.click();
  await expect(layers).toHaveAttribute('aria-expanded', 'true');
});

test('accordion label slot names its native trigger and restores attribute fallback when removed', async ({ page }) => {
  const layers = page.getByRole('button', { name: 'Layers', exact: true });
  await expect(layers).toHaveAccessibleName('Layers');
  await layers.focus();
  await layers.press('Enter');
  await expect(layers).toHaveAttribute('aria-expanded', 'false');
  await page.locator('en-accordion-item[value="layers"] [slot="label"]').evaluate((element) => { element.remove(); });
  const fallback = page.getByRole('button', { name: 'Layers fallback', exact: true });
  await expect(fallback).toBeFocused();
  await fallback.press('Enter');
  await expect(fallback).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('button', { name: 'New layer' })).toBeVisible();
});

test('structure sizes default to medium and inherit only when explicitly requested', async ({ page }) => {
  const layers = page.getByRole('button', { name: 'Layers', exact: true });
  const history = page.getByRole('button', { name: 'History', exact: true });
  const historyItem = page.locator('en-accordion-item[value="history"]');
  const medium = await history.evaluate((element) => element.getBoundingClientRect().height);
  await expect(historyItem).not.toHaveAttribute('size');
  expect(await historyItem.evaluate((element: any) => element.size)).toBe('medium');
  await page.locator('#sections').evaluate((element: any) => { element.size = 'small'; });
  await expect(page.locator('#sections')).toHaveAttribute('size', 'small');
  expect(await history.evaluate((element) => element.getBoundingClientRect().height)).toBe(medium);
  await historyItem.evaluate((element: any) => { element.size = 'inherit'; });
  await expect(historyItem).toHaveAttribute('size', 'inherit');
  const small = await history.evaluate((element) => element.getBoundingClientRect().height);
  expect(small).toBeLessThan(medium);
  await page.locator('en-accordion-item[value="layers"]').evaluate((element: any) => { element.size = 'large'; });
  await expect(page.locator('en-accordion-item[value="layers"]')).toHaveAttribute('size', 'large');
  expect(await layers.evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThan(small);
  expect(await history.evaluate((element) => element.getBoundingClientRect().height)).toBe(small);
  await page.locator('en-accordion-item[value="layers"]').evaluate((element: any) => { element.size = 'inherit'; });
  await expect(page.locator('en-accordion-item[value="layers"]')).toHaveAttribute('size', 'inherit');
  expect(await layers.evaluate((element) => element.getBoundingClientRect().height)).toBe(small);
  await historyItem.evaluate((element) => { element.removeAttribute('size'); });
  await expect(historyItem).not.toHaveAttribute('size');
  expect(await historyItem.evaluate((element: any) => element.size)).toBe('medium');
  expect(await history.evaluate((element) => element.getBoundingClientRect().height)).toBe(medium);
});

test('tabs use one keyboard stop, skip disabled tabs and expose named persistent panels', async ({ page }) => {
  const design = page.getByRole('tab', { name: 'Design', exact: true });
  const inspect = page.getByRole('tab', { name: 'Inspect', exact: true });
  await expect(page.getByRole('tablist', { name: 'Settings categories' })).toBeVisible();
  await expect(page.getByRole('tabpanel', { name: 'Design', exact: true })).toBeVisible();
  await design.focus();
  await design.press('ArrowRight');
  await expect(inspect).toBeFocused();
  await expect(inspect).toHaveAttribute('aria-selected', 'true');
  await expect(design).toHaveAttribute('tabindex', '-1');
  await expect(page.getByRole('tabpanel', { name: 'Inspect', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Change color' })).toBeHidden();
  await page.locator('#settings').evaluate((element: any) => { element.activation = 'manual'; });
  await inspect.press('Home');
  await expect(design).toBeFocused();
  await expect(inspect).toHaveAttribute('aria-selected', 'true');
  await design.press('Enter');
  await expect(design).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('button', { name: 'Change color' })).toBeVisible();
});

test('canceling tab selection preserves its selected panel while allowing focus movement', async ({ page }) => {
  const design = page.getByRole('tab', { name: 'Design', exact: true });
  const inspect = page.getByRole('tab', { name: 'Inspect', exact: true });
  await page.locator('#settings').evaluate((element) => {
    element.addEventListener('en-change', (event) => event.preventDefault());
  });
  await design.focus();
  await design.press('ArrowRight');
  await expect(inspect).toBeFocused();
  await expect(design).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel', { name: 'Design', exact: true })).toBeVisible();
});

test('splitter supports keyboard bounds and canceled resize proposals', async ({ page }) => {
  const handle = page.getByRole('separator', { name: 'Resize library pane' });
  await handle.focus();
  await handle.press('ArrowRight');
  await expect(handle).toHaveAttribute('aria-valuenow', '51');
  await handle.press('End');
  await expect(handle).toHaveAttribute('aria-valuenow', '80');
  await handle.press('Home');
  await expect(handle).toHaveAttribute('aria-valuenow', '20');
  await page.locator('#workspace').evaluate((element) => {
    element.addEventListener('en-change', (event) => event.preventDefault());
  });
  await handle.press('ArrowRight');
  await expect(handle).toHaveAttribute('aria-valuenow', '20');
});

test('only dragging the handle resizes and pointer release stops resizing', async ({ page }) => {
  const handle = page.getByRole('separator', { name: 'Resize library pane' });
  const pane = await page.getByRole('button', { name: 'Browse library' }).boundingBox();
  if (!pane) throw new Error('Primary pane control has no bounds.');
  await page.mouse.move(pane.x + 2, pane.y + 2);
  await page.mouse.down();
  await page.mouse.move(pane.x + 80, pane.y + 2);
  await page.mouse.up();
  await expect(handle).toHaveAttribute('aria-valuenow', '50');
  const bounds = await handle.boundingBox();
  if (!bounds) throw new Error('Resize handle has no bounds.');
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width / 2 + 60, bounds.y + bounds.height / 2, { steps: 4 });
  await page.mouse.up();
  const accepted = Number(await handle.getAttribute('aria-valuenow'));
  expect(accepted).toBeGreaterThan(50);
  await page.mouse.move(bounds.x + 150, bounds.y + 20);
  await expect(handle).toHaveAttribute('aria-valuenow', String(accepted));
});

for (const target of [
  { title: 'accordion group', host: '#sections', role: 'button', name: 'History', property: 'value', initial: ['layers'], accepted: ['history'], key: 'Enter', attribute: 'aria-expanded', initialAttribute: 'false', acceptedAttribute: 'true' },
  { title: 'standalone accordion item', host: '#standalone-section', role: 'button', name: 'Standalone details', property: 'open', initial: false, accepted: true, key: 'Enter', attribute: 'aria-expanded', initialAttribute: 'false', acceptedAttribute: 'true' },
  { title: 'tabs', host: '#settings', role: 'tab', name: 'Inspect', property: 'value', initial: 'design', accepted: 'inspect', key: 'Enter', attribute: 'aria-selected', initialAttribute: 'false', acceptedAttribute: 'true' },
  { title: 'split view', host: '#workspace', role: 'separator', name: 'Resize library pane', property: 'value', initial: 50, accepted: 51, key: 'ArrowRight', attribute: 'aria-valuenow', initialAttribute: '50', acceptedAttribute: '51' },
  { title: 'standalone splitter', host: '#standalone-splitter', role: 'separator', name: 'Resize standalone pane', property: 'value', initial: 50, accepted: 51, key: 'ArrowRight', attribute: 'aria-valuenow', initialAttribute: '50', acceptedAttribute: '51' },
] as const) {
  test(`${target.title}: tentative state is cancelable and author writes supersede rollback`, async ({ page }) => {
    const host = page.locator(target.host);
    expect(await host.evaluate(element => 'controlled' in element)).toBe(false);
    await host.evaluate((element: any, property) => {
      element.attempts = [];
      element.addEventListener('en-change', (event: CustomEvent) => {
        element.attempts.push({ value: element[property], ...event.detail,
          cancelable: event.cancelable, bubbles: event.bubbles, composed: event.composed });
      });
      element.addEventListener('en-change', (event: Event) => event.preventDefault(), { once: true });
    }, target.property);
    const control = page.getByRole(target.role, { name: target.name, exact: true });
    await control.focus();
    await control.press(target.key);
    expect(await host.evaluate((element: any) => element.attempts)).toEqual([
      expect.objectContaining({ value: target.accepted, previous: target.initial, proposed: target.accepted,
        cancelable: true, bubbles: true, composed: true }),
    ]);
    await expect(host).toHaveJSProperty(target.property, target.initial);
    await expect(control).toHaveAttribute(target.attribute, target.initialAttribute);
    await expect(control).toBeFocused();

    // A same-value write sees the tentative value and is authoritative even after cancellation.
    await host.evaluate((element: any, property) => {
      element.addEventListener('en-change', (event: Event) => {
        event.preventDefault(); element[property] = element[property];
      }, { once: true });
    }, target.property);
    await control.press(target.key);
    await expect(host).toHaveJSProperty(target.property, target.accepted);
    await expect(control).toHaveAttribute(target.attribute, target.acceptedAttribute);
    expect(await host.evaluate((element: any) => element.attempts.length)).toBe(2);

    // Application assignments are silent, and can explicitly restore the former value during dispatch.
    await host.evaluate((element: any, { property, initial }) => {
      element[property] = initial;
      element.addEventListener('en-change', (event: CustomEvent) => { element[property] = event.detail.previous; }, { once: true });
    }, { property: target.property, initial: target.initial });
    expect(await host.evaluate((element: any) => element.attempts.length)).toBe(2);
    await expect(control).toHaveAttribute(target.attribute, target.initialAttribute);
    await control.focus();
    await control.press(target.key);
    await expect(host).toHaveJSProperty(target.property, target.initial);
    await expect(control).toHaveAttribute(target.attribute, target.initialAttribute);
    expect(await host.evaluate((element: any) => element.attempts.length)).toBe(3);

    await control.press(target.key);
    await expect(host).toHaveJSProperty(target.property, target.accepted);
    await expect(control).toHaveAttribute(target.attribute, target.acceptedAttribute);
    expect(await host.evaluate((element: any) => element.attempts.length)).toBe(4);
  });
}

for (const direction of ['ltr', 'rtl'] as const) {
  test(`top/bottom split view resizes by keyboard and pointer in ${direction}`, async ({ page }) => {
    const host = page.locator('#workspace-vertical');
    await host.scrollIntoViewIfNeeded();
    await host.evaluate((element, dir) => { element.setAttribute('dir', dir); }, direction);
    const handle = page.getByRole('separator', { name: 'Resize top pane', exact: true });
    await expect(handle).toHaveAttribute('aria-orientation', 'horizontal');
    const pane = host.locator('[part="primary"]');
    const bottom = host.locator('[part="secondary"]');
    const topBounds = await pane.boundingBox();
    const bottomBounds = await bottom.boundingBox();
    if (!topBounds || !bottomBounds) throw new Error('Stacked panes have no bounds.');
    expect(topBounds.y + topBounds.height).toBeLessThan(bottomBounds.y);
    await handle.focus();
    await handle.press('ArrowDown');
    await expect(handle).toHaveAttribute('aria-valuenow', '41');
    expect((await pane.boundingBox())!.height).toBeGreaterThan(topBounds.height);
    await handle.press('ArrowUp');
    await expect(handle).toHaveAttribute('aria-valuenow', '40');
    await handle.press('End');
    await expect(handle).toHaveAttribute('aria-valuenow', '80');
    await handle.press('Home');
    await expect(handle).toHaveAttribute('aria-valuenow', '20');
    await host.evaluate((element: any) => { element.value = 40; });
    await expect(handle).toHaveAttribute('aria-valuenow', '40');
    const bounds = await handle.boundingBox();
    if (!bounds) throw new Error('Horizontal resize handle has no bounds.');
    const x = bounds.x + bounds.width / 2;
    const y = bounds.y + bounds.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    // Horizontal pointer travel must not change the top/bottom ratio.
    await page.mouse.move(x + 30, y);
    await expect(handle).toHaveAttribute('aria-valuenow', '40');
    await page.mouse.move(x + 30, y + 50, { steps: 4 });
    await page.mouse.up();
    const accepted = Number(await handle.getAttribute('aria-valuenow'));
    expect(accepted).toBeGreaterThan(40);
    expect((await pane.boundingBox())!.height).toBeGreaterThan(topBounds.height);
    await page.mouse.move(x, y + 100);
    await expect(handle).toHaveAttribute('aria-valuenow', String(accepted));
  });
}


test('split view exposes one owned change even to an ancestor capture listener', async ({ page }) => {
  const host = page.locator('#workspace');
  await host.evaluate(element => {
    (window as any).capturedSplitChanges = [];
    element.parentElement!.addEventListener('en-change', event => {
      (window as any).capturedSplitChanges.push(event.composedPath()[0] === element);
    }, { capture: true });
  });
  const handle = page.getByRole('separator', { name: 'Resize library pane', exact: true });
  await handle.focus();
  await handle.press('ArrowRight');
  await expect(host).toHaveJSProperty('value', 51);
  expect(await page.evaluate(() => (window as any).capturedSplitChanges)).toEqual([true]);
});
