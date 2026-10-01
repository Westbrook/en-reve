import { expect, test, type Page } from '@playwright/test';

const tooltip = (page: Page) => page.locator('#tooltip');
const surface = (page: Page) => tooltip(page).locator('[part~="surface"]');
const trigger = (page: Page) => page.getByRole('button', { name: 'Tooltip details', exact: true });
const info = (page: Page) => page.evaluate(() => (window as any).motion.info('tooltip'));
const enhanced = (page: Page) => page.evaluate(() => CSS.supports('transition-behavior', 'allow-discrete') && CSS.supports('overlay', 'auto'));
const expectedDescription = 'Project history. Supplemental motion guidance.';

async function hydrate(page: Page) {
  await page.evaluate(() => (window as any).hydrateMotionFixture());
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
}

test.beforeEach(async ({ page, browser }, testInfo) => {
  testInfo.annotations.push({ type: 'browser-version', description: browser.version() });
  await page.goto('/fixture');
});

test('tooltip keyboard focus bypasses hover delay; fade keeps description, focus and SSR surface identity', async ({ page, browserName }, testInfo) => {
  await expect(surface(page)).toBeHidden();
  await page.evaluate(() => {
    (window as any).tooltipOriginal = document.getElementById('tooltip')!.shadowRoot!.querySelector('[part~="surface"]');
    (window as any).tooltipContentOriginal = document.getElementById('tooltip-content');
  });
  await hydrate(page);
  await page.evaluate(() => { (document.getElementById('tooltip') as any).showDelay = 2000; });
  await page.locator('#tooltip-before').focus();
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
  await expect(trigger(page)).toBeFocused();
  await expect(tooltip(page)).toHaveJSProperty('open', true, { timeout: 1000 });
  await expect(trigger(page)).toHaveAccessibleDescription(expectedDescription);
  const entered = await info(page);
  expect(entered.shown).toBe(true);
  expect(entered.activeInside).toBe(false);
  expect(entered.translate).toBe('none');
  expect(entered.scale).toBe('none');
  if (await enhanced(page)) expect(entered.animations.some((a: any) => a.property === 'opacity' && a.duration > 0)).toBe(true);
  // The fixture deliberately uses 400ms so the retained exit can be observed.
  await page.waitForTimeout(450);
  await page.keyboard.press('Escape');
  await expect(tooltip(page)).toHaveJSProperty('open', false);
  const exiting = await info(page);
  expect(exiting.shown).toBe(false);
  expect(exiting.activeInside).toBe(false);
  await expect(trigger(page)).toBeFocused();
  await expect(trigger(page)).toHaveAccessibleDescription(expectedDescription);
  if (await enhanced(page)) {
    expect(await surface(page).evaluate(node => getComputedStyle(node).pointerEvents)).toBe('none');
    expect(exiting.display).not.toBe('none');
    expect(exiting.animations.some((a: any) => a.property === 'opacity' && a.duration > 0)).toBe(true);
  }
  await page.waitForTimeout(450);
  await expect(surface(page)).toBeHidden();
  await expect(tooltip(page)).toHaveJSProperty('open', false); // Focus alone does not undo Escape.
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
  await expect(page.locator('#after')).toBeFocused();
  expect(await page.evaluate(() => ({
    surface: (window as any).tooltipOriginal === (window as any).motion.surface('tooltip'),
    content: (window as any).tooltipContentOriginal === document.getElementById('tooltip-content'),
    contentInert: document.getElementById('tooltip-content')!.hasAttribute('inert'),
  }))).toEqual({ surface: true, content: true, contentInert: false });
  await testInfo.attach('tooltip-keyboard-motion.json', { body: JSON.stringify({ entered, exiting }, null, 2), contentType: 'application/json' });
});

test('fading tooltip preserves bidirectional safe pointer transit and Escape does not move focus', async ({ page }, testInfo) => {
  await hydrate(page);
  await page.evaluate(() => {
    const host = document.getElementById('tooltip') as any;
    host.style.setProperty('--en-space-2', '64px');
    host.showDelay = 0; host.hideDelay = 25; host.transitDuration = 1200;
  });
  await page.locator('#after').focus();
  await trigger(page).hover();
  await expect(tooltip(page)).toHaveJSProperty('open', true);
  await page.waitForTimeout(450);
  const source = (await trigger(page).boundingBox())!;
  const destination = (await surface(page).boundingBox())!;
  const start = { x: source.x + source.width / 2, y: source.y + source.height / 2 };
  const end = { x: destination.x + destination.width / 2, y: destination.y + destination.height / 2 };
  await page.mouse.move(start.x, start.y);
  for (const [from, to] of [[start, end], [end, start]]) {
    for (let step = 1; step <= 6; step++) {
      await page.mouse.move(from.x + (to.x - from.x) * step / 6, from.y + (to.y - from.y) * step / 6);
      await page.waitForTimeout(50); // Each segment exceeds hideDelay; corridor/endpoint ownership must preserve it.
      await expect(tooltip(page)).toHaveJSProperty('open', true);
    }
  }
  await expect(page.locator('#after')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(tooltip(page)).toHaveJSProperty('open', false);
  await expect(page.locator('#after')).toBeFocused();
  await page.waitForTimeout(450);
  await expect(surface(page)).toBeHidden();
  await testInfo.attach('tooltip-hover-path.json', { body: JSON.stringify({ source, destination, start, end }, null, 2), contentType: 'application/json' });
});

test('tooltip close veto, rapid refocus and disconnect preserve current description ownership', async ({ page }) => {
  await hydrate(page);
  await trigger(page).focus();
  await expect(tooltip(page)).toHaveJSProperty('open', true);
  await page.waitForTimeout(450);
  await page.evaluate(() => {
    const host = document.getElementById('tooltip')!;
    (window as any).tooltipOriginal = (window as any).motion.surface('tooltip');
    host.addEventListener('en-change', event => { if (!(event as CustomEvent).detail.proposed) event.preventDefault(); }, { once: true });
  });
  await page.keyboard.press('Escape');
  await expect(tooltip(page)).toHaveJSProperty('open', true);
  expect((await info(page)).opacity).toBe(1);
  await expect(trigger(page)).toHaveAccessibleDescription(expectedDescription);
  await page.keyboard.press('Escape');
  await expect(tooltip(page)).toHaveJSProperty('open', false);
  await page.locator('#after').focus();
  await trigger(page).focus();
  await expect(tooltip(page)).toHaveJSProperty('open', true);
  await page.waitForTimeout(450);
  expect((await info(page)).shown).toBe(true);
  await expect(trigger(page)).toBeFocused();
  expect(await page.evaluate(() => (window as any).tooltipOriginal === (window as any).motion.surface('tooltip'))).toBe(true);
  await page.evaluate(async () => {
    const host = document.getElementById('tooltip') as any;
    host.hide(); await host.updateComplete;
    host.remove(); document.getElementById('after')!.focus();
  });
  await page.waitForTimeout(450);
  await expect(page.locator('#after')).toBeFocused();
  await expect(trigger(page)).toHaveAttribute('aria-describedby', 'tooltip-existing-description');
  expect(await page.evaluate(() => (window as any).tooltipOriginal.matches(':popover-open'))).toBe(false);
});

test('reduced motion makes tooltip paint immediate while focus and description stay intact', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await hydrate(page);
  await trigger(page).focus();
  await expect(tooltip(page)).toHaveJSProperty('open', true);
  const opened = await info(page);
  expect(opened.opacity).toBe(1);
  expect(opened.animations).toEqual([]);
  expect(opened.translate).toBe('none'); expect(opened.scale).toBe('none');
  await expect(trigger(page)).toHaveAccessibleDescription(expectedDescription);
  await page.keyboard.press('Escape');
  await expect(tooltip(page)).toHaveJSProperty('open', false);
  expect((await info(page)).display).toBe('none');
  await expect(trigger(page)).toBeFocused();
  await expect(trigger(page)).toHaveAccessibleDescription(expectedDescription);
});
