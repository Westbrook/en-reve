import { expect, test, type Page } from '@playwright/test';
import { actions, frames, item, menu, menuTrigger, option, palette, paletteTrigger, placed, search, settle } from './helpers.js';
const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page, browser }, info) => {
  const messages: string[] = []; errors.set(page, messages); page.on('pageerror', error => messages.push(error.message));
  page.on('response', response => { if (response.status() >= 400) messages.push(`${response.status()} ${response.url()}`); });
  info.annotations.push({ type: 'browser-version', description: browser.version() });
  await page.goto('/fixture'); await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
});
test.afterEach(async ({ page }, info) => {
  const messages = errors.get(page) ?? [];
  if (messages.length) await info.attach('runtime-errors', { body: JSON.stringify(messages), contentType: 'application/json' });
  expect(messages).toEqual([]);
  expect(await page.evaluate(() => (window as any).commandsFixture.submissions)).toEqual([]);
});

test('trusted menu and palette taps honor unavailable commands and cancellation on phone/tablet profiles', async ({ page }, info) => {
  await menuTrigger(page).tap(); await placed(item(page, 'Copy'));
  const disabled = (await item(page, 'Delete').boundingBox())!;
  await page.touchscreen.tap(disabled.x + disabled.width / 2, disabled.y + disabled.height / 2);
  await expect(menu(page)).toHaveJSProperty('open', true); expect(await actions(page)).toEqual([]);
  await item(page, 'Copy').tap(); await expect(menu(page)).toHaveJSProperty('open', false);
  expect((await actions(page)).map((event: any) => event.action)).toEqual(['copy']);
  await paletteTrigger(page).tap(); await expect(search(page)).toBeFocused(); await placed(option(page, 'Copy document'));
  const inputMetrics = await search(page).evaluate(element => ({ font: parseFloat(getComputedStyle(element).fontSize), rect: element.getBoundingClientRect().toJSON() }));
  expect(inputMetrics.font).toBeGreaterThanOrEqual(16);
  const unavailable = (await option(page, 'Delete document').boundingBox())!;
  await page.touchscreen.tap(unavailable.x + unavailable.width / 2, unavailable.y + unavailable.height / 2);
  expect(await actions(page)).toHaveLength(1);
  await palette(page).evaluate(element => { element.addEventListener('en-action', event => event.preventDefault(), { once: true }); });
  await option(page, 'Copy document').tap(); await expect(palette(page)).toHaveJSProperty('open', true);
  expect((await actions(page))[1]).toMatchObject({ action: 'copy', canceled: true });
  await expect(search(page)).toBeFocused();
  const row = (await option(page, 'Copy document').boundingBox())!;
  expect(row.width).toBeGreaterThanOrEqual(44); expect(row.height).toBeGreaterThanOrEqual(44);
  await option(page, 'Copy document').tap(); await expect(palette(page)).toHaveJSProperty('open', false);
  expect((await actions(page)).map((event: any) => [event.action, event.canceled])).toEqual([['copy', false], ['copy', true], ['copy', false]]);
  await info.attach('emulated-touch-targets', { body: JSON.stringify({ inputMetrics, paletteOption: row, limits: 'Configured default coarse targets only; desktop engine device emulation, no physical keyboard/AT result.' }), contentType: 'application/json' });
});

test('trusted Chromium list swipe and pointer cancellation scroll without executing a command', async ({ page, context, browserName }, info) => {
  test.skip(browserName !== 'chromium', 'The maintained WebKit driver supports trusted taps, not the equivalent native touch-swipe protocol.');
  await palette(page).evaluate(element => {
    (element as any).commands = Array.from({ length: 60 }, (_, index) => ({ action: `item-${index}`, label: `Review command ${index + 1}` }));
    (window as any).commandTouchEvents = [];
    for (const type of ['touchmove', 'pointercancel', 'click']) element.addEventListener(type, (event: Event) => {
      (window as any).commandTouchEvents.push({ type, trusted: event.isTrusted, pointerType: (event as PointerEvent).pointerType });
    }, { capture: true, passive: true });
  });
  await settle(page); await paletteTrigger(page).tap(); await placed(option(page, 'Review command 1'));
  const scrollingPart = await palette(page).locator('[part~="listbox"], [part~="body"]').evaluateAll(elements => {
    const target = elements.find(element => element.scrollHeight > element.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(element).overflowY));
    return target?.getAttribute('part')?.split(/\s+/).find(part => part === 'listbox' || part === 'body') ?? null;
  });
  expect(scrollingPart, 'A public listbox/body region must actually scroll when the catalog exceeds the viewport').not.toBeNull();
  const panel = palette(page).locator(`[part~="${scrollingPart}"]`);
  const box = (await panel.boundingBox())!; expect(box.height).toBeGreaterThan(80);
  const session = await context.newCDPSession(page);
  try {
    const x = box.x + box.width / 2, start = box.y + box.height - 24, travel = Math.min(140, box.height - 48);
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: start, id: 1 }] });
    for (let step = 1; step <= 6; step++) {
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: start - travel * step / 6, id: 1 }] });
      await frames(page);
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(() => panel.evaluate(element => element.scrollTop)).toBeGreaterThan(20);
    await expect(palette(page)).toHaveJSProperty('open', true); expect(await actions(page)).toEqual([]);
    const scrolled = await page.evaluate(() => (window as any).commandTouchEvents);
    expect(scrolled.some((event: any) => event.type === 'touchmove' && event.trusted)).toBe(true);
    expect(scrolled.some((event: any) => event.type === 'pointercancel' && event.trusted)).toBe(true);
    await frames(page, 8);
    await page.evaluate(() => { (window as any).commandTouchEvents = []; });
    const current = (await panel.boundingBox())!;
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: current.x + current.width / 2, y: current.y + current.height / 2, id: 2 }] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    await frames(page);
    const canceled = await page.evaluate(() => (window as any).commandTouchEvents);
    expect(canceled.some((event: any) => event.type === 'pointercancel' && event.trusted)).toBe(true);
    expect(canceled.filter((event: any) => event.type === 'click')).toEqual([]);
    expect(await actions(page)).toEqual([]); await expect(search(page)).toBeFocused();
    await info.attach('trusted-scroll-and-cancel', { body: JSON.stringify({ scrollingPart, scrollTop: await panel.evaluate(element => element.scrollTop), scrolled, canceled, limits: 'Chromium gesture recognizer; not physical Android hardware or WebKit scrolling.' }), contentType: 'application/json' });
  } finally { await session.detach(); }
});
