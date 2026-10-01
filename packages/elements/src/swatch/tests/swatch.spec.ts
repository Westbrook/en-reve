import { expect, test, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const fixture = '/packages/elements/src/swatch/tests/index.html';
type FixtureEvent = { id: string; type: string; detail: unknown; cancelable: boolean; composed: boolean; bubbles: boolean };
type FixtureWindow = Window & {
  swatchEvents: FixtureEvent[];
  swatchClicks: { trusted: boolean; prevented: boolean }[];
  clipboardCalls: string[];
  consumerCalls: number;
  originalButton: HTMLButtonElement;
};
type SwatchHost = HTMLElement & {
  updateComplete: Promise<unknown>;
  token: string;
  color: string;
  size: string;
  label: string;
  disabled: boolean;
};

// Every case uses a fresh document; clipboard behavior belongs to the docs consumer.
test.beforeEach(async ({ page, browser }, info) => {
  info.annotations.push({ type: 'browser-version', description: browser.version() });
  await page.goto(fixture);
  await page.locator('en-swatch').evaluateAll(async hosts => {
    await customElements.whenDefined('en-swatch');
    await Promise.all(hosts.map(host => (host as SwatchHost).updateComplete));
  });
  await expect(page.locator('#primary').getByRole('button')).toHaveAccessibleName('Choose action color');
});

async function events(page: Page, type: string, id = 'primary'): Promise<FixtureEvent[]> {
  return page.evaluate(({ type, id }) => (window as unknown as FixtureWindow).swatchEvents
    .filter(event => event.type === type && event.id === id), { type, id });
}

async function sampleHeight(host: Locator): Promise<number> {
  return host.locator('[part~="sample"]').evaluate(sample => sample.getBoundingClientRect().height);
}

async function writePaint(host: Locator, paint: { token?: string; color?: string }): Promise<void> {
  await host.evaluate(async (element, paint) => {
    Object.assign(element, paint);
    await (element as SwatchHost).updateComplete;
  }, paint);
}

test('pointer, Enter and Space emit one neutral action with a stable authored name and native control', async ({ page }) => {
  const host = page.locator('#primary');
  const button = host.getByRole('button', { name: 'Choose action color', exact: true });
  // Measure native Shadow DOM focus under the browser's current keyboard preference.
  await page.evaluate(() => {
    const comparison = document.createElement('div');
    comparison.id = 'native-focus-baseline';
    comparison.innerHTML = '<div id="native-shadow-host"></div><button id="native-after">Native after</button><input id="native-input" aria-label="Native after field">';
    comparison.querySelector('#native-shadow-host')!.attachShadow({ mode: 'open' }).innerHTML = '<button type="button">Native shadow sample</button>';
    document.querySelector('main')!.append(comparison);
  });
  const baseline = page.getByRole('button', { name: 'Native shadow sample', exact: true });
  await baseline.focus();
  await baseline.click();
  const nativePointerFocus = await baseline.evaluate(control => control.matches(':focus'));
  await baseline.focus();
  await baseline.press('Tab');
  const nativeTabTarget = await page.evaluate(() => document.activeElement?.id);
  expect(['native-after', 'native-input']).toContain(nativeTabTarget);
  await page.locator('#native-focus-baseline').evaluate(element => element.remove());
  await page.evaluate(() => {
    const state = window as unknown as FixtureWindow;
    state.swatchClicks = []; state.clipboardCalls = [];
    state.originalButton = document.getElementById('primary')!.shadowRoot!.querySelector('button')!;
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: (text: string) => { state.clipboardCalls.push(text); return Promise.resolve(); },
    } });
    document.addEventListener('click', event => {
      if (event.composedPath().includes(document.getElementById('primary')!)) {
        state.swatchClicks.push({ trusted: event.isTrusted, prevented: event.defaultPrevented });
      }
    });
  });
  for (const [index, action] of ['pointer', 'Enter', 'Space'].entries()) {
    await button.focus();
    if (action === 'pointer') await button.click(); else await button.press(action);
    if (action === 'pointer') expect(await button.evaluate(control => control.matches(':focus'))).toBe(nativePointerFocus);
    else await expect(button).toBeFocused();
    await expect(button).toHaveAccessibleName('Choose action color');
    expect(await events(page, 'en-action')).toHaveLength(index + 1);
  }
  const actionEvents = await events(page, 'en-action');
  for (const event of actionEvents) {
    expect(event.detail).toEqual({ action: 'activate', data: undefined });
    expect({ cancelable: event.cancelable, composed: event.composed, bubbles: event.bubbles }).toEqual({ cancelable: true, composed: true, bubbles: true });
  }
  expect(await page.evaluate(() => (window as unknown as FixtureWindow).swatchClicks)).toEqual(Array.from({ length: 3 }, () => ({ trusted: true, prevented: false })));
  expect(await page.evaluate(() => (window as unknown as FixtureWindow).clipboardCalls)).toEqual([]);
  expect(await button.evaluate(control => control === (window as unknown as FixtureWindow).originalButton)).toBe(true);
  await expect(host.getByRole('button')).toHaveCount(1);
  await expect(host.getByRole('status')).toHaveCount(0);
  await expect(host.locator('[part~="reference"], [part~="action"]')).toHaveCount(0);
  await expect(button).toHaveAccessibleDescription('');
  await button.press('Tab');
  await expect(page.locator(nativeTabTarget === 'native-after' ? '#after' : '#after-field')).toBeFocused();
  expect(await host.evaluate(element => element.shadowRoot!.activeElement)).toBeNull();
});

test('canceling the semantic action cancels the original click without stopping consumer observation', async ({ page }) => {
  const host = page.locator('#primary');
  await host.evaluate(element => {
    const state = window as unknown as FixtureWindow;
    state.consumerCalls = 0; state.swatchClicks = [];
    element.addEventListener('en-action', event => event.preventDefault());
    element.addEventListener('click', event => {
      state.swatchClicks.push({ trusted: event.isTrusted, prevented: event.defaultPrevented });
      if (!event.defaultPrevented) state.consumerCalls += 1;
    });
  });
  const button = host.getByRole('button');
  await button.click();
  await button.focus();
  await button.press('Enter');
  expect(await events(page, 'en-action')).toHaveLength(2);
  expect(await page.evaluate(() => (window as unknown as FixtureWindow).swatchClicks)).toEqual([
    { trusted: true, prevented: true }, { trusted: true, prevented: true },
  ]);
  expect(await page.evaluate(() => (window as unknown as FixtureWindow).consumerCalls)).toBe(0);
  await expect(button).toBeFocused();
  await expect(button).toBeEnabled();
});

test('authored hidden label slots override and recover to the full label fallback', async ({ page }) => {
  const host = page.locator('#scoped');
  const button = host.getByRole('button');
  await expect(button).toHaveAccessibleName('Choose scoped action color');
  await host.locator('[slot="label"]').evaluate(node => { node.textContent = 'Apply collaboration accent'; });
  await expect(button).toHaveAccessibleName('Apply collaboration accent');
  await host.evaluate(async element => { (element as SwatchHost).label = 'Choose alternate accent'; await (element as SwatchHost).updateComplete; });
  await expect(button).toHaveAccessibleName('Apply collaboration accent');
  await host.locator('[slot="label"]').evaluate(node => node.remove());
  await expect(button).toHaveAccessibleName('Choose alternate accent');
  const [hostBox, controlBox] = await Promise.all([host.boundingBox(), button.boundingBox()]);
  expect(hostBox!.width).toBeCloseTo(controlBox!.width, 4);
  expect(hostBox!.height).toBeCloseTo(controlBox!.height, 4);
});

test('only explicit disabled blocks activation; missing or invalid paint still exposes an enabled action', async ({ page }) => {
  const disabled = page.locator('#disabled');
  await expect(disabled.getByRole('button')).toBeDisabled();
  // Native DOM click on a disabled button is inert; no forced Playwright click is used.
  await disabled.getByRole('button').evaluate((button: HTMLButtonElement) => button.click());
  expect(await events(page, 'en-action', 'disabled')).toEqual([]);
  await disabled.evaluate(async element => { (element as SwatchHost).disabled = false; await (element as SwatchHost).updateComplete; });
  await disabled.getByRole('button').click();
  expect(await events(page, 'en-action', 'disabled')).toHaveLength(1);
  const empty = page.locator('#invalid');
  await expect(empty.getByRole('button')).toBeEnabled();
  await empty.getByRole('button').click();
  await writePaint(empty, { token: 'var(--en-color-action)' });
  await expect(empty.getByRole('button')).toBeEnabled();
  await empty.getByRole('button').click();
  expect(await events(page, 'en-action', 'invalid')).toHaveLength(2);
});

test('literal color updates clear invalid paint, while any nonempty token retains precedence', async ({ page }) => {
  const host = page.locator('#invalid');
  const fill = host.locator('[part="color"]');
  await writePaint(host, { color: '#336699' });
  await expect(fill).toHaveCSS('background-color', 'rgb(51, 102, 153)');
  await writePaint(host, { color: 'not-a-color' });
  await expect(fill).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await writePaint(host, { color: 'rgb(10 20 30 / 50%)' });
  await expect(fill).toHaveCSS('background-color', 'rgba(10, 20, 30, 0.5)');
  await writePaint(host, { token: '--en-color-action', color: '#ffffff' });
  await expect(fill).toHaveCSS('background-color', 'rgb(36, 87, 214)');
  await writePaint(host, { token: 'var(--en-color-action)' });
  await expect(fill).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await writePaint(host, { token: '' });
  await expect(fill).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  for (const color of ['red; position: fixed', 'red !important', 'red}', 'r\\65 d']) {
    await writePaint(host, { color });
    await expect(fill).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(fill).not.toHaveCSS('position', 'fixed');
  }
});

test('color scopes stay live while medium defaults, explicit inheritance and size overrides remain independent', async ({ page }) => {
  const primary = page.locator('#primary');
  const scoped = page.locator('#scoped');
  await expect(primary.locator('[part="color"]')).toHaveCSS('background-color', 'rgb(36, 87, 214)');
  await expect(scoped.locator('[part="color"]')).toHaveCSS('background-color', 'rgb(148, 47, 183)');
  expect(await scoped.evaluate(element => (element as SwatchHost).size)).toBe('medium');
  expect(await scoped.getAttribute('size')).toBeNull();
  const mediumHeight = await sampleHeight(scoped);
  await scoped.evaluate(async element => {
    // Public foundation styles opt this ordinary fixture wrapper into size scopes.
    const modulePath = '/packages/styles/src/foundations.ts';
    const { foundationStyles } = await import(modulePath);
    const style = document.createElement('style');
    style.textContent = foundationStyles.cssText;
    document.head.append(style);
    element.parentElement!.classList.add('en-foundation');
    element.parentElement!.dataset.size = 'large';
  });
  expect(await sampleHeight(scoped)).toBeCloseTo(mediumHeight, 4);
  await scoped.evaluate(async element => { (element as SwatchHost).size = 'inherit'; await (element as SwatchHost).updateComplete; });
  const inheritedHeight = await sampleHeight(scoped);
  expect(inheritedHeight).toBeGreaterThan(mediumHeight);
  await scoped.evaluate(async element => { (element as SwatchHost).size = 'small'; await (element as SwatchHost).updateComplete; });
  expect(await sampleHeight(scoped)).toBeLessThan(mediumHeight);
  await scoped.evaluate(async element => { (element as SwatchHost).size = 'large'; await (element as SwatchHost).updateComplete; });
  expect(await sampleHeight(scoped)).toBeCloseTo(inheritedHeight, 4);
  await scoped.evaluate(async element => { element.removeAttribute('size'); await (element as SwatchHost).updateComplete; });
  expect(await scoped.evaluate(element => (element as SwatchHost).size)).toBe('medium');
  expect(await sampleHeight(scoped)).toBeCloseTo(mediumHeight, 4);
  await scoped.evaluate(async element => { element.setAttribute('size', 'invalid'); await (element as SwatchHost).updateComplete; });
  expect(await scoped.evaluate(element => (element as SwatchHost).size)).toBe('medium');
  expect(await sampleHeight(scoped)).toBeCloseTo(mediumHeight, 4);
  await scoped.evaluate(element => {
    element.style.setProperty('--en-swatch-size', '96px');
    element.parentElement!.style.setProperty('--en-color-action', '#167344');
  });
  expect(await sampleHeight(scoped)).toBeCloseTo(96, 4);
  await expect(scoped.locator('[part="color"]')).toHaveCSS('background-color', 'rgb(22, 115, 68)');
  await expect(primary.locator('[part="color"]')).toHaveCSS('background-color', 'rgb(36, 87, 214)');
});


test('the default square sample stretches only when the consumer sets its host width', async ({ page }) => {
  const host = page.locator('#primary');
  const button = host.getByRole('button');
  const initial = await button.boundingBox();
  expect(initial!.width).toBeCloseTo(initial!.height, 4);
  await host.evaluate(element => { element.style.inlineSize = '100%'; });
  const [hostBox, controlBox] = await Promise.all([host.boundingBox(), button.boundingBox()]);
  expect(controlBox!.width).toBeGreaterThan(initial!.width);
  expect(controlBox!.width).toBeCloseTo(hostBox!.width, 4);
  expect(controlBox!.height).toBeCloseTo(initial!.height, 4);
});

test('Chromium forced colors preserve the sample while its boundary and keyboard focus adapt', async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== 'chromium', 'This focused forced-colors rendering check is intentionally Chromium-only.');
  await page.emulateMedia({ forcedColors: 'active' });
  const host = page.locator('#primary');
  const button = host.getByRole('button', { name: 'Choose action color', exact: true });
  await page.locator('#before').focus();
  await page.keyboard.press('Tab');
  await expect(button).toBeFocused();
  await expect(host.locator('[part="color"]')).toHaveCSS('background-color', 'rgb(36, 87, 214)');
  await expect(host.locator('[part="color"]')).toHaveCSS('forced-color-adjust', 'none');
  await expect(button).toHaveCSS('forced-color-adjust', 'auto');
  const system = await page.evaluate(() => {
    const sample = document.createElement('span');
    sample.style.cssText = 'border:1px solid ButtonText;outline:1px solid Highlight';
    document.body.append(sample);
    const style = getComputedStyle(sample);
    const result = { border: style.borderTopColor, focus: style.outlineColor };
    sample.remove();
    return result;
  });
  await expect(host.locator('[part~="sample"]')).toHaveCSS('border-top-color', system.border);
  await expect(button).toHaveCSS('outline-color', system.focus);
  expect(await button.evaluate(control => control.matches(':focus-visible') && parseFloat(getComputedStyle(control).outlineWidth) > 0)).toBe(true);
  await testInfo.attach('swatch-forced-colors', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
});

test('the fixture has no applicable automated WCAG A/AA findings before and after a consumer update', async ({ page }) => {
  const audit = () => new AxeBuilder({ page }).include('main').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect((await audit()).violations).toEqual([]);
  const host = page.locator('#primary');
  await host.getByRole('button').click();
  await host.evaluate(async element => {
    const swatch = element as SwatchHost;
    swatch.label = 'Choose revised action color';
    swatch.token = ''; swatch.color = 'rejected-color';
    await swatch.updateComplete;
  });
  await expect(host.getByRole('button')).toHaveAccessibleName('Choose revised action color');
  await expect(host.getByRole('button')).toBeEnabled();
  expect((await audit()).violations).toEqual([]);
});
