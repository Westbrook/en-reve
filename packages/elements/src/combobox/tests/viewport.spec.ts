import { expect, test, type Page } from '@playwright/test';

const input = (page: Page) => page.locator('#asset').getByRole('combobox');
const errors = new WeakMap<Page, string[]>();
async function settle(page: Page) {
  await page.evaluate(async () => {
    await (window as any).comboboxFixture.settle();
    // The popup measures a changed width after layout before exposing wrapped rows.
    for (let count = 0; count < 5; count++) await new Promise(requestAnimationFrame);
    await (window as any).comboboxFixture.settle();
  });
}
async function metrics(page: Page, values: { offsetLeft: number; offsetTop: number; width: number; height: number; scale: number }) {
  await page.evaluate(values => {
    const target = (window as any).testViewport ?? new EventTarget();
    Object.assign(target, values);
    Object.defineProperty(window, 'visualViewport', { value: target, configurable: true });
    (window as any).testViewport = target;
    // Explicitly synthetic viewport geometry. The existing window observer causes
    // a fresh read; this neither emulates nor proves OS keyboard event timing.
    window.dispatchEvent(new Event('resize'));
  }, values);
  await settle(page);
}
async function snapshot(page: Page) {
  return page.locator('#asset').evaluate(host => {
    const input = host.shadowRoot!.querySelector('input')!;
    const popup = host.shadowRoot!.querySelector<HTMLElement>('[part="popup"]')!;
    return {
      value: (host as any).value, draft: input.value, expanded: input.getAttribute('aria-expanded'),
      active: input.getAttribute('aria-activedescendant'), candidate: host.shadowRoot!.querySelector<HTMLElement>('[data-active]')?.dataset.value ?? null,
      visibility: getComputedStyle(popup).visibility, popover: popup.matches(':popover-open'),
      rect: popup.getBoundingClientRect().toJSON(), inputRect: input.getBoundingClientRect().toJSON(),
      focused: host.shadowRoot!.activeElement === input,
      form: new FormData(host.closest('form')!).get('asset'),
      sameInput: (window as any).savedInput === input, samePopup: (window as any).savedPopup === popup,
    };
  });
}
test.beforeEach(async ({ page, browser }, info) => {
  const messages: string[] = []; errors.set(page, messages);
  page.on('pageerror', error => messages.push(error.message));
  page.on('response', response => { if (response.status() >= 400) messages.push(`${response.status()} ${response.url()}`); });
  info.annotations.push({ type: 'browser-version', description: browser.version() });
  info.annotations.push({ type: 'scope', description: 'Synthetic VisualViewport metrics and actual desktop resizing; no physical keyboard, pinch gesture or mobile Safari claim.' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/fixture');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await page.locator('#asset').evaluate(host => {
    (host as HTMLElement).style.cssText = 'position:fixed;left:30px;top:160px;width:300px;z-index:2';
    (window as any).savedInput = host.shadowRoot!.querySelector('input');
    (window as any).savedPopup = host.shadowRoot!.querySelector('[part="popup"]');
  });
});
test.afterEach(async ({ page }, info) => {
  await info.attach('viewport-state', { body: JSON.stringify(await snapshot(page)), contentType: 'application/json' });
  expect(errors.get(page)).toEqual([]);
});

test('first ArrowDown opens a usable phone-width popup and activates the first option', async ({ page }) => {
  await input(page).press('ArrowDown'); await settle(page);
  const state = await snapshot(page);
  expect(state).toMatchObject({ expanded: 'true', candidate: 'forest', value: 'forest', focused: true, sameInput: true, samePopup: true });
  expect(state.rect.height).toBeGreaterThan(40);
  expect(state.rect.y).toBeGreaterThanOrEqual(0);
  expect(state.rect.bottom).toBeLessThanOrEqual(845);
});

test('insufficient space suspends every painted descendant including the selected check', async ({ page }) => {
  await input(page).press('ArrowDown'); await settle(page);
  const before = await snapshot(page);
  await metrics(page, { offsetLeft: 0, offsetTop: before.inputRect.top - 20, width: 390, height: before.inputRect.height + 40, scale: 1 });
  const state = await snapshot(page);
  expect(state).toMatchObject({ expanded: 'false', active: null, visibility: 'hidden', value: 'forest', form: 'forest', candidate: 'forest' });
  expect(await page.locator('#asset').evaluate(host => {
    const popup = host.shadowRoot!.querySelector<HTMLElement>('[part="popup"]')!;
    const check = popup.querySelector<SVGElement>('[aria-selected="true"] svg')!;
    const box = check.getBoundingClientRect();
    return {
      checkVisibility: getComputedStyle(check).visibility,
      visibleDescendants: [...popup.querySelectorAll('*')].filter(node => getComputedStyle(node).visibility === 'visible').length,
      optionHit: host.shadowRoot!.elementsFromPoint(box.x + box.width / 2, box.y + box.height / 2).some(node => node.matches('[role="option"]') || Boolean(node.closest('[role="option"]'))),
    };
  })).toEqual({ checkVisibility: 'hidden', visibleDescendants: 0, optionHit: false });
});

test('suspended Arrow and Enter preserve query, candidate and accepted form value', async ({ page }) => {
  await input(page).fill('study'); await input(page).press('ArrowDown'); await settle(page);
  const before = await snapshot(page);
  expect(before.candidate).toBe('fjord');
  await metrics(page, { offsetLeft: 0, offsetTop: before.inputRect.top - 20, width: 390, height: before.inputRect.height + 40, scale: 1 });
  await input(page).press('ArrowDown'); await input(page).press('Enter'); await settle(page);
  expect(await snapshot(page)).toMatchObject({ expanded: 'false', active: null, candidate: 'fjord', value: 'forest', form: 'forest', draft: 'study', focused: true, sameInput: true, samePopup: true });
  expect(await page.evaluate(() => (window as any).comboboxFixture.submissions)).toEqual([]);
  await metrics(page, { offsetLeft: 15, offsetTop: 60, width: 350, height: 420, scale: 1.1 });
  const restored = await snapshot(page);
  expect(restored).toMatchObject({ expanded: 'true', candidate: 'fjord', draft: 'study', focused: true, sameInput: true, samePopup: true });
  expect(restored.rect.x).toBeGreaterThanOrEqual(14);
  expect(restored.rect.right).toBeLessThanOrEqual(366);
  expect(restored.rect.y).toBeGreaterThanOrEqual(59);
  expect(restored.rect.bottom).toBeLessThanOrEqual(481);
  expect(restored.rect.bottom <= restored.inputRect.top || restored.rect.top >= restored.inputRect.bottom).toBe(true);
});

test('offscreen suspension preserves draft and explicit Escape prevents later reopening', async ({ page }) => {
  await input(page).fill('study'); await input(page).press('ArrowDown'); await settle(page);
  await metrics(page, { offsetLeft: 0, offsetTop: 450, width: 390, height: 300, scale: 1 });
  expect(await snapshot(page)).toMatchObject({ expanded: 'false', active: null, visibility: 'hidden', draft: 'study', value: 'forest' });
  await input(page).press('Escape');
  await metrics(page, { offsetLeft: 0, offsetTop: 0, width: 390, height: 844, scale: 1 });
  expect(await snapshot(page)).toMatchObject({ expanded: 'false', popover: false, candidate: null, draft: 'Forest canvas', value: 'forest' });
});

test('tablet-sized lower placement selects the usable space above the input', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.locator('#asset').evaluate(host => { (host as HTMLElement).style.left = '650px'; (host as HTMLElement).style.top = '570px'; });
  await input(page).press('ArrowDown'); await settle(page);
  const state = await snapshot(page);
  expect(state.expanded).toBe('true');
  expect(state.rect.bottom).toBeLessThanOrEqual(state.inputRect.top);
  expect(state.rect.x).toBeGreaterThanOrEqual(0);
  expect(state.rect.right).toBeLessThanOrEqual(1025);
  expect(state.rect.y).toBeGreaterThanOrEqual(0);
});

test('an authored height ceiling cannot expose a partial result row', async ({ page }) => {
  await input(page).press('ArrowDown'); await settle(page);
  await page.locator('#asset').evaluate(host => (host as HTMLElement).style.setProperty('--en-overlay-max-block-size', '20px')); await settle(page);
  expect(await snapshot(page)).toMatchObject({ expanded: 'false', visibility: 'hidden', candidate: 'forest', value: 'forest' });
  await page.locator('#asset').evaluate(host => (host as HTMLElement).style.removeProperty('--en-overlay-max-block-size')); await settle(page);
  expect(await snapshot(page)).toMatchObject({ expanded: 'true', candidate: 'forest', sameInput: true, samePopup: true });
});

test('width changes remeasure wrapped result text before resuming presentation', async ({ page }) => {
  await input(page).press('ArrowDown'); await settle(page);
  await page.locator('#asset').evaluate(host => {
    (host as HTMLElement).style.width = '140px';
    (host as any).items = [{ value: 'forest', label: 'Forest canvas with a deliberately long descriptive title wrapping onto several narrow lines' }];
  }); await settle(page);
  const rowHeight = await page.locator('#asset').evaluate(host => host.shadowRoot!.querySelector('[role="option"]')!.getBoundingClientRect().height);
  await page.locator('#asset').evaluate((host, height) => (host as HTMLElement).style.setProperty('--en-overlay-max-block-size', `${height - 5}px`), rowHeight); await settle(page);
  expect(await snapshot(page)).toMatchObject({ expanded: 'false', visibility: 'hidden' });
  await page.locator('#asset').evaluate(host => (host as HTMLElement).style.width = '300px'); await settle(page);
  expect(await snapshot(page)).toMatchObject({ expanded: 'true', sameInput: true, samePopup: true });
});


test('opening with the trigger retains an immediate ArrowUp during pending layout', async ({ page }) => {
  await page.locator('#asset').evaluate(host => {
    (host as any).items = Array.from({ length: 60 }, (_, index) => ({ value: `item-${index}`, label: `Review item ${index + 1}` }));
    (host as any).value = 'item-0';
  });
  await page.locator('#asset').getByRole('button', { name: 'Show options', exact: true }).click();
  await input(page).press('ArrowUp');
  await expect(input(page)).toHaveAttribute('aria-expanded', 'true');
  await expect(input(page)).toHaveAttribute('aria-activedescendant', 'option-59');
  expect(await snapshot(page)).toMatchObject({ candidate: 'item-59', value: 'item-0', form: 'item-0' });
});

test('visual viewport resize and scroll listeners suspend and resume only while open', async ({ page }) => {
  // Install before opening so the controller subscribes to this exact EventTarget.
  await page.evaluate(() => {
    const viewport = Object.assign(new EventTarget(), { offsetLeft: 0, offsetTop: 0, width: 390, height: 844, scale: 1 });
    Object.defineProperty(window, 'visualViewport', { value: viewport, configurable: true });
    (window as any).testViewport = viewport;
  });
  await input(page).press('ArrowDown'); await settle(page);
  expect(await snapshot(page)).toMatchObject({ expanded: 'true', candidate: 'forest' });
  const anchor = (await snapshot(page)).inputRect;
  await page.evaluate(anchor => {
    const viewport = (window as any).testViewport;
    Object.assign(viewport, { offsetTop: anchor.top - 20, height: anchor.height + 40 });
    viewport.dispatchEvent(new Event('resize'));
  }, anchor); await settle(page);
  expect(await snapshot(page)).toMatchObject({ expanded: 'false', active: null, candidate: 'forest', visibility: 'hidden' });
  await page.evaluate(() => {
    const viewport = (window as any).testViewport;
    Object.assign(viewport, { offsetTop: 0, height: 300 });
    viewport.dispatchEvent(new Event('resize'));
  }); await settle(page);
  expect(await snapshot(page)).toMatchObject({ expanded: 'true', candidate: 'forest' });
  await page.evaluate(() => {
    const viewport = (window as any).testViewport;
    viewport.offsetTop = 450;
    viewport.dispatchEvent(new Event('scroll'));
  }); await settle(page);
  expect(await snapshot(page)).toMatchObject({ expanded: 'false', visibility: 'hidden', candidate: 'forest' });
  await page.evaluate(() => {
    const viewport = (window as any).testViewport;
    viewport.offsetTop = 0;
    viewport.dispatchEvent(new Event('scroll'));
  }); await settle(page);
  expect(await snapshot(page)).toMatchObject({ expanded: 'true', candidate: 'forest', focused: true, sameInput: true, samePopup: true });
  await input(page).press('Escape'); await settle(page);
  const closedStyle = await page.locator('#asset').locator('[part="popup"]').getAttribute('style');
  await page.evaluate(() => {
    const viewport = (window as any).testViewport;
    Object.assign(viewport, { offsetTop: 100, height: 500 });
    viewport.dispatchEvent(new Event('scroll'));
    viewport.dispatchEvent(new Event('resize'));
  }); await settle(page);
  expect(await snapshot(page)).toMatchObject({ expanded: 'false', popover: false, candidate: null, draft: 'Forest canvas', value: 'forest' });
  expect(await page.locator('#asset').locator('[part="popup"]').getAttribute('style')).toBe(closedStyle);
});
