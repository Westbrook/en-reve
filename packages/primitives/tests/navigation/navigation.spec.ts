import { test, expect, type Page } from '@playwright/test';

const fixture = 'fixture';
async function ready(page: Page, suffix = '') {
  await page.goto(fixture + suffix);
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await frames(page);
}
async function frames(page: Page) {
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))));
}
const tabKey = (engine: string) => engine === 'webkit' ? 'Alt+Tab' : 'Tab';
async function aligned(page: Page, id = 'primary-two', scope = 'primary') {
  await expect.poll(() => page.evaluate(({ id, scope }) => {
    const target = document.getElementById(id)!.getBoundingClientRect();
    const nav = document.querySelector(`#${scope} .en-section-nav`)!.getBoundingClientRect();
    return target.top >= nav.bottom - 1 && target.top < nav.bottom + 100;
  }, { id, scope })).toBe(true);
}
async function settledScroll(page: Page) {
  await page.evaluate(() => new Promise<void>(resolve => {
    let last = scrollY;
    let stable = 0;
    function sample() {
      stable = Math.abs(scrollY - last) < 0.5 ? stable + 1 : 0;
      last = scrollY;
      if (stable >= 4) resolve();
      else requestAnimationFrame(sample);
    }
    requestAnimationFrame(sample);
  }));
}
async function takeOverScroll(page: Page) {
  await page.mouse.move(300, 500);
  const before = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 430);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before + 200);
  await settledScroll(page);
}

test('SSR native skip and breadcrumb semantics work with JavaScript disabled', async ({ browser, browserName, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto(fixture);
  const skip = page.getByRole('link', { name: 'Skip to main content' });
  await page.keyboard.press(tabKey(browserName));
  await expect(skip).toBeFocused();
  const box = await skip.boundingBox();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  await page.keyboard.press('Enter');
  await expect(page.locator('#primary-main')).toBeFocused();
  await page.keyboard.press(tabKey(browserName));
  await expect(page.getByRole('button', { name: 'primary action 1' })).toBeFocused();
  const breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb', exact: true });
  await expect(breadcrumb.getByRole('list')).toBeVisible();
  await expect(breadcrumb.getByRole('listitem')).toHaveCount(2);
  await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText('Navigation');
  await expect(breadcrumb.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/fixture');
  const nav = page.getByRole('navigation', { name: 'Primary sections' });
  await expect(nav).toHaveCSS('position', 'static');
  await expect(page.getByRole('tab')).toHaveCount(0);
  await nav.getByRole('link', { name: 'Second section', exact: true }).click();
  await expect(page).toHaveURL(/#primary-two$/);
  await expect(page.locator('#primary-two')).toBeFocused();
  await context.close();
});

test('ordinary keyboard fragments preserve native focus, next Tab and history', async ({ page, browserName }) => {
  await ready(page);
  const nav = page.getByRole('navigation', { name: 'Primary sections' });
  const marker = await page.evaluate(() => (window as any).navigationFixture.marker);
  const first = nav.getByRole('link', { name: 'First section', exact: true });
  await first.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#primary-one')).toBeFocused();
  await aligned(page, 'primary-one');
  const second = nav.getByRole('link', { name: 'Second section', exact: true });
  await second.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#primary-two$/);
  await expect(page.locator('#primary-two')).toBeFocused();
  await aligned(page);
  await page.keyboard.press(tabKey(browserName));
  await expect(page.getByRole('button', { name: 'primary action 2' })).toBeFocused();
  await page.goBack();
  await expect(page).toHaveURL(/#primary-one$/);
  // Settle native history scrolling before the next navigation or fresh gesture.
  // The separate late-follow case deliberately tests user interruption.
  await settledScroll(page);
  await page.goForward();
  await expect(page).toHaveURL(/#primary-two$/);
  await settledScroll(page);
  expect(await page.evaluate(() => (window as any).navigationFixture.marker)).toBe(marker);
  // Reactivating the same href remains a native action, with no extra history entry promised.
  await takeOverScroll(page);
  await second.click();
  await aligned(page);
});

test('wrapped RTL navigation measures its actual height and keeps complete focus contours', async ({ page, browserName }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 1000 });
  await ready(page, '?dir=rtl#primary-three');
  await aligned(page, 'primary-three');
  const nav = page.getByRole('navigation', { name: 'Primary sections' });
  const first = nav.getByRole('link', { name: 'First section', exact: true });
  const third = nav.getByRole('link', { name: 'Third section with a longer translated label' });
  const before = (await nav.boundingBox())!.height;
  expect((await third.boundingBox())!.y).toBeGreaterThan((await first.boundingBox())!.y);
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; });
  await page.setViewportSize({ width: 780, height: 1100 });
  await frames(page);
  await aligned(page, 'primary-three');
  await expect.poll(() => page.evaluate(() => {
    const root = document.getElementById('primary')!;
    const height = root.querySelector('.en-section-nav')!.getBoundingClientRect().height;
    return Math.abs(parseFloat(root.style.getPropertyValue('--en-navigation-height')) - height);
  })).toBeLessThan(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await first.focus();
  await page.keyboard.press(tabKey(browserName));
  const focused = page.locator(':focus');
  await expect(focused).toHaveClass(/en-navigation-link/);
  const contour = await focused.evaluate(element => {
    const style = getComputedStyle(element);
    const box = element.getBoundingClientRect();
    return { width: parseFloat(style.outlineWidth), style: style.outlineStyle, left: box.left, right: box.right,
      overflow: getComputedStyle(element.parentElement!).overflow, direction: style.direction };
  });
  expect(contour.width).toBeGreaterThan(0);
  expect(contour.style).not.toBe('none');
  expect(contour.direction).toBe('rtl');
  expect(contour.overflow).toBe('visible');
  expect(contour.left).toBeGreaterThanOrEqual(contour.width);
  expect(contour.right).toBeLessThanOrEqual(780 - contour.width);
  await testInfo.attach('wrapped-rtl-navigation', { body: await page.screenshot(), contentType: 'image/png' });
  expect(before).toBeGreaterThan(40);
});

test('manual wheel and keyboard interaction cannot be undone by refresh or late initial follow', async ({ page }) => {
  await ready(page, '#primary-two');
  await aligned(page);
  await takeOverScroll(page);
  const before = await page.evaluate(() => scrollY);
  await page.evaluate(() => {
    (window as any).navigationFixture.refresh();
    (window as any).navigationFixture.followInitial();
  });
  await frames(page);
  expect(Math.abs(await page.evaluate(() => scrollY) - before)).toBeLessThan(2);
  await page.setViewportSize({ width: 1180, height: 760 });
  await frames(page);
  expect(await page.locator('#primary-two').evaluate(element => element.getBoundingClientRect().top)).toBeLessThan(0);
  await page.getByRole('navigation', { name: 'Primary sections' }).getByRole('link', { name: 'Second section', exact: true }).click();
  await aligned(page);
  await page.keyboard.press('PageDown');
  await expect.poll(() => page.locator('#primary-two').evaluate(element => element.getBoundingClientRect().top)).toBeLessThan(0);
  await settledScroll(page);
  const afterKey = await page.evaluate(() => scrollY);
  await page.evaluate(() => (window as any).navigationFixture.refresh());
  await frames(page);
  expect(Math.abs(await page.evaluate(() => scrollY) - afterKey)).toBeLessThan(2);
});

test('new-tab, modified and ancestor-canceled clicks do not hijack the current page', async ({ page, context }) => {
  await ready(page, '#primary-one');
  await aligned(page, 'primary-one');
  await takeOverScroll(page);
  const nav = page.getByRole('navigation', { name: 'Primary sections' });
  const url = page.url();
  const scroll = await page.evaluate(() => scrollY);
  // Locator.click's automatic scrollIntoView moves Chromium's sticky nav by
  // 8px before input. Measure native navigation with real input on a link that
  // is already fully visible, without an automation-induced setup scroll.
  async function clickVisibleLink(name: string, modified = false) {
    const link = nav.getByRole('link', { name, exact: true });
    await expect(link).toBeVisible();
    const box = (await link.boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    if (modified) await page.keyboard.down(modifier);
    try { await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2); }
    finally { if (modified) await page.keyboard.up(modifier); }
  }
  for (const modified of [false, true]) {
    const popupPromise = context.waitForEvent('page');
    await clickVisibleLink(modified ? 'Second section' : 'Open second in new tab', modified);
    const popup = await popupPromise;
    await popup.waitForURL(/#primary-two$/);
    await popup.close();
    await page.bringToFront();
    await frames(page);
    expect(page.url()).toBe(url);
    expect(Math.abs(await page.evaluate(() => scrollY) - scroll)).toBeLessThan(2);
  }
  await clickVisibleLink('Canceled navigation');
  await frames(page);
  expect(page.url()).toBe(url);
  expect(Math.abs(await page.evaluate(() => scrollY) - scroll)).toBeLessThan(2);
  const marker = await page.evaluate(() => (window as any).navigationFixture.marker);
  await nav.getByRole('link', { name: 'Different query document' }).click();
  await expect(page).toHaveURL(/copy=other#primary-two$/);
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  expect(await page.evaluate(() => (window as any).navigationFixture.marker)).not.toBe(marker);
});

test('nested scrolling follows native ancestors and scoped attachments clean up ownership', async ({ page }) => {
  await ready(page, '?mode=nested');
  const nav = page.getByRole('navigation', { name: 'Primary sections' });
  await nav.getByRole('link', { name: 'Second section', exact: true }).click();
  await aligned(page);
  expect(await page.locator('#primary').evaluate(element => element.scrollTop)).toBeGreaterThan(500);
  // scrollIntoView may also move the document: there is no outer-scroll isolation contract.
  await ready(page, '?mode=two');
  await expect.poll(() => page.evaluate(() => ['primary', 'secondary'].every(id => {
    const root = document.getElementById(id)!;
    const navHeight = root.querySelector('.en-section-nav')!.getBoundingClientRect().height;
    return Math.abs(parseFloat(root.style.getPropertyValue('--en-navigation-height')) - navHeight) < 1;
  }))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.style.getPropertyValue('--en-navigation-height'))).toBe('');
  const own = await page.evaluate(() => {
    const api = (window as any).navigationFixture;
    api.disconnect();
    const root = document.getElementById('primary')!;
    root.style.setProperty('--en-navigation-height', '17px', 'important');
    root.style.setProperty('--en-navigation-position', 'relative');
    api.attach('primary');
    return root.style.getPropertyValue('--en-navigation-height');
  });
  expect(own).toBe('17px');
  await frames(page);
  expect(await page.locator('#primary').evaluate(element => {
    const root = element as HTMLElement;
    return { priority: root.style.getPropertyPriority('--en-navigation-height'),
      measured: Math.abs(parseFloat(root.style.getPropertyValue('--en-navigation-height')) - root.querySelector('.en-section-nav')!.getBoundingClientRect().height) < 1 };
  })).toEqual({ priority: '', measured: true });
  await page.evaluate(() => (window as any).navigationFixture.disconnect());
  await expect(page.locator('#primary')).toHaveCSS('--en-navigation-height', '17px');
  expect(await page.locator('#primary').evaluate(element => (element as HTMLElement).style.getPropertyPriority('--en-navigation-height'))).toBe('important');
  await expect(page.locator('#primary')).toHaveCSS('--en-navigation-position', 'relative');
  await page.evaluate(() => (window as any).navigationFixture.attach('primary'));
  await frames(page);
  await page.evaluate(() => {
    document.getElementById('primary')!.style.setProperty('--en-navigation-height', '333px');
    (window as any).navigationFixture.disconnect();
  });
  await expect(page.locator('#primary')).toHaveCSS('--en-navigation-height', '333px');
  await page.evaluate(() => {
    document.getElementById('primary')!.style.removeProperty('--en-navigation-height');
    (window as any).navigationFixture.replace('primary');
  });
  await frames(page);
  await expect(page.getByRole('navigation', { name: 'Primary sections' })).toHaveCount(1);
  await expect(page.getByRole('navigation', { name: 'Secondary sections' })).toHaveCount(1);
  await page.getByRole('navigation', { name: 'Primary sections' }).getByRole('link', { name: 'Second section', exact: true }).click();
  await aligned(page);
});

test('a full child theme resets navigation overrides while preserving measured geometry', async ({ page }) => {
  await ready(page);
  const nav = page.getByRole('navigation', { name: 'Primary sections' });
  const link = nav.getByRole('link', { name: 'First section', exact: true });
  await page.evaluate(() => {
    document.documentElement.style.setProperty('--en-navigation-color', 'rgb(190, 20, 30)');
    document.documentElement.style.setProperty('--en-navigation-gap', '31px');
  });
  await expect(link).toHaveCSS('color', 'rgb(190, 20, 30)');
  await expect(nav).toHaveCSS('gap', '31px');
  const expected = await page.evaluate(async () => {
    const { resolveTheme, emitThemeCSS } = await import('/packages/tokens/dist/index.js');
    const theme = resolveTheme({ name: 'navigation-test', mode: 'dark', density: 'compact' });
    const style = document.createElement('style');
    style.textContent = emitThemeCSS(theme, { selector: '#primary' });
    document.head.append(style);
    const reference = document.createElement('span');
    reference.style.color = theme.tokens['color.text-muted'].cssValue;
    document.body.append(reference);
    const color = getComputedStyle(reference).color;
    reference.remove();
    return color;
  });
  await expect(link).toHaveCSS('color', expected);
  await expect(nav).not.toHaveCSS('gap', '31px');
  await expect.poll(() => page.locator('#primary').evaluate(root => {
    const navigation = root.querySelector('.en-section-nav')!;
    return Math.abs(parseFloat((root as HTMLElement).style.getPropertyValue('--en-navigation-height')) - navigation.getBoundingClientRect().height);
  })).toBeLessThan(1);
  await expect(nav).toHaveCSS('position', 'sticky');
});
