import { test, expect } from '@playwright/test';
import { resolveTheme, emitThemeCSS, colorFromHex, validateManagedValue } from '../../dist/index.js';
import { stabilizePreview } from './stable-page.mjs';
import { installFocusFixture, control, focusFrame, keyboardFocus, focusPaint, sameBox, completeOutline,
  expectUnclippedOutline, accentPaint, sampleAccentTransition, armImmediateFocusCapture,
  freezeNextAccentTransition, waitForFrozenAccent, freezeNextTransition, sampleHaloTransition } from './focus-recipes.fixture.mjs';

const scope = ':where(#focus-recipes)';
const px = value => ({ value, unit: 'px' });
const fluentPins = {
  'component.input.focus-accent-width': px(2),
  'component.input.focus-accent-color': '{palette.accent}',
  'duration.focus-enter': { value: 200, unit: 'ms' },
  'duration.focus-exit': { value: 50, unit: 'ms' },
  'ease.focus-enter': [0, 0, 0, 1],
  'ease.focus-exit': [1, 0, 1, 1],
};
async function applyTheme(page, pins = {}, options = {}) {
  const baseline = resolveTheme(options);
  for (const [id, value] of Object.entries(pins)) validateManagedValue(baseline, id, value);
  const theme = resolveTheme({ ...options, pins });
  const content = emitThemeCSS(theme, { selector: scope });
  const existing = page.locator('style[data-focus-recipe-theme]');
  if (await existing.count()) await existing.evaluate((node, css) => { node.textContent = css; }, content);
  else await (await page.addStyleTag({ content })).evaluate(node => { node.dataset.focusRecipeTheme = ''; });
  return theme;
}
async function record(info, name, value) {
  await info.attach(name, { body: JSON.stringify(value, null, 2), contentType: 'application/json' });
}
async function assertImmediate(locator, width = 2) {
  const capture = await locator.evaluate(node => node.__focusRecipeImmediate);
  expect(capture.focusVisible).toBe(true);
  expect(capture.outlineStyle).toBe('solid');
  expect(capture.outlineWidth).toBeGreaterThanOrEqual(width);
  expect(capture.outlineColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(capture.properties.filter(property => ['outline', 'outline-width', 'outline-color', 'opacity'].includes(property))).toEqual([]);
  return capture;
}

test.beforeEach(async ({ page, baseURL }) => {
  await stabilizePreview(page, baseURL);
  await page.goto('/');
  await installFocusFixture(page);
  await page.emulateMedia({ reducedMotion: 'no-preference', forcedColors: 'none' });
});

test('a field focus frame preserves native select layout and enhanced single-line height', async ({ page, browserName }, info) => {
  await applyTheme(page);
  const select = control(page, 'select');
  const geometry = await select.evaluate(node => {
    // Compare actual native layout with and without the new wrapper, using
    // the same shadow styles and options rather than prescribing UA display.
    const baseline = node.cloneNode(true);
    baseline.removeAttribute('id'); baseline.removeAttribute('name');
    baseline.value = node.value;
    node.getRootNode().append(baseline);
    try {
      const framed = node.getBoundingClientRect(), unwrapped = baseline.getBoundingClientRect();
      return { framedHeight: framed.height, unwrappedHeight: unwrapped.height,
        enhanced: getComputedStyle(node).appearance === 'base-select',
        display: getComputedStyle(node).display };
    } finally { baseline.remove(); }
  });
  expect(Math.abs(geometry.framedHeight - geometry.unwrappedHeight)).toBeLessThanOrEqual(1);
  if (geometry.enhanced) {
    const textHeight = await control(page, 'text').evaluate(node => node.getBoundingClientRect().height);
    expect(Math.abs(geometry.framedHeight - textHeight)).toBeLessThanOrEqual(1);
  }
  const identity = await select.elementHandle();
  await keyboardFocus(page, 'select', browserName);
  expect(await select.evaluate(node => node.getBoundingClientRect().height)).toBe(geometry.framedHeight);
  expect(await select.evaluate((node, original) => node === original, identity)).toBe(true);
  await expect(select).toHaveValue('alpha');
  await record(info, 'framed-native-select-layout', geometry);
  await identity.dispose();
});

test('unpinned and empty family hooks retain the immediate default contour and stable native controls', async ({ page, browserName }, info) => {
  await applyTheme(page);
  const target = control(page, 'text');
  const frame = focusFrame(page, 'text');
  await expect(frame).toHaveCount(1);
  await target.scrollIntoViewIfNeeded();
  const node = await target.elementHandle();
  const before = await focusPaint(target);
  await armImmediateFocusCapture(target);
  await keyboardFocus(page, 'text', browserName);
  const immediate = await assertImmediate(target);
  const focused = await focusPaint(target);
  completeOutline(focused); sameBox(before, focused);
  expect((await accentPaint(frame)).accentWidth).toBe(0);
  expect(await frame.evaluate(element => element.getAnimations({ subtree: true }).some(animation => animation instanceof CSSTransition && animation.transitionProperty === 'transform'))).toBe(false);
  await expectUnclippedOutline(target);
  await page.locator('#focus-before-text').focus();
  await page.locator('#focus-text').evaluate(host => {
    // CSS-wide initial is a guaranteed-invalid custom-property value, exercising
    // fallback behavior rather than inheriting the page's already emitted tokens.
    for (const name of ['--en-input-focus-width', '--en-input-focus-offset', '--en-input-focus-color',
      '--en-input-focus-halo-width', '--en-input-focus-halo-color', '--en-focus-width', '--en-focus-offset', '--en-color-focus']) host.style.setProperty(name, 'initial');
  });
  await keyboardFocus(page, 'text', browserName);
  const fallback = await focusPaint(target);
  completeOutline(fallback); sameBox(before, fallback);
  expect(await target.evaluate((element, initial) => element === initial, node)).toBe(true);
  await expect(target).toHaveValue('Shared canvas');
  await expect(target).toHaveAccessibleDescription('Keep a recognizable name.');
  await record(info, 'default-and-fallback', { before, immediate, focused, fallback });

  // A visible global halo must not return a rectangular ring to ranges whose
  // native thumb owns focus. This is independent of input-family overrides.
  await applyTheme(page, { 'focus.halo-width': px(3), 'color.focus-halo': colorFromHex('#7352a6') });
  const range = control(page, 'range');
  await range.scrollIntoViewIfNeeded(); const rangeBefore = await focusPaint(range);
  const rangeNode = await range.elementHandle();
  await keyboardFocus(page, 'range', browserName);
  const rangeFocused = await focusPaint(range);
  const thumb = await range.evaluate(node => {
    const pseudo = CSS.supports('selector(input::-moz-range-thumb)') ? '::-moz-range-thumb'
      : CSS.supports('selector(input::-webkit-slider-thumb)') ? '::-webkit-slider-thumb' : null;
    if (!pseudo) return { exposed: false };
    // Native pseudo computed-style exposure differs between engines. Record it
    // without treating a host-style reflection as actual thumb pixel evidence.
    const css = getComputedStyle(node, pseudo);
    return { exposed: true, pseudo, observedOutline: css.outlineStyle, observedColor: css.outlineColor };
  });
  if (thumb.exposed) {
    expect(rangeFocused.shadow).toBe('none'); expect(rangeFocused.outlineStyle).toBe('none');
  } else completeOutline(rangeFocused);
  sameBox(rangeBefore, rangeFocused);
  await range.press('ArrowRight'); await expect(range).toHaveValue('51');
  await expect(page.locator('#focus-range')).toHaveJSProperty('value', 51);
  expect(await page.locator('#focus-form').evaluate(form => new FormData(form).get('opacity'))).toBe('51');
  expect(await range.evaluate((element, initial) => element === initial, rangeNode)).toBe(true);
  sameBox(rangeFocused, await focusPaint(range));
  await page.locator('#focus-range').screenshot({ path: info.outputPath('native-thumb-focus.png') });
  await record(info, 'native-range-halo-ownership', { before: rangeBefore, focused: rangeFocused, thumb });
  await rangeNode.dispose();
});

test('family hooks customize buttons, fields, active options and overlay surfaces independently', async ({ page, browserName }, info) => {
  const pins = {};
  const families = { button: '#7352a6', input: '#28633a', option: '#9b2d30', overlay: '#155d85' };
  for (const [family, color] of Object.entries(families)) {
    pins[`component.${family}.focus-width`] = px(3);
    pins[`component.${family}.focus-color`] = colorFromHex(color);
    pins[`component.${family}.focus-offset`] = px(family === 'option' ? -3 : 2);
  }
  pins['component.button.focus-halo-width'] = px(3);
  pins['component.button.focus-halo-color'] = { ...colorFromHex('#7352a6'), alpha: .5 };
  pins['component.input.focus-halo-width'] = px(3);
  pins['component.input.focus-halo-color'] = { ...colorFromHex('#28633a'), alpha: .5 };
  await applyTheme(page, pins);
  const observed = {};
  for (const [id, color] of [['button', 'rgb(115, 82, 166)'], ['text', 'rgb(40, 99, 58)'], ['color', 'rgb(40, 99, 58)']]) {
    const target = control(page, id);
    await target.scrollIntoViewIfNeeded(); const before = await focusPaint(target);
    await armImmediateFocusCapture(target); await keyboardFocus(page, id, browserName);
    await assertImmediate(target, 3);
    const focused = await focusPaint(target); observed[id] = focused;
    completeOutline(focused, 3); sameBox(before, focused);
    expect(focused.outlineColor).toBe(color);
    const expectedHalo = await page.evaluate(color => {
      const probe = document.createElement('span');
      const alphaColor = color.replace('rgb(', 'rgba(').replace(')', ', 0.5)');
      probe.style.boxShadow = `0 0 0 3px ${alphaColor}, 0 0 0 0 transparent`;
      document.body.append(probe); const shadow = getComputedStyle(probe).boxShadow; probe.remove(); return shadow;
    }, color);
    expect(focused.shadow).toBe(expectedHalo);
    await expectUnclippedOutline(target);
  }
  const combo = await keyboardFocus(page, 'combo', browserName);
  await combo.press('ArrowDown'); await combo.press('ArrowDown');
  const active = page.locator('#focus-combo [part~="option-active"]');
  await expect(active).toHaveAccessibleName('Beta project');
  await expect(combo).toBeFocused();
  observed.option = await focusPaint(active);
  completeOutline(observed.option, 3);
  expect(observed.option.outlineColor).toBe('rgb(155, 45, 48)');
  expect(observed.option.outlineOffset).toBe(-3);
  await expectUnclippedOutline(active);
  await combo.press('Escape');
  await page.locator('#focus-open-dialog').focus();
  await page.keyboard.press('Enter');
  const dialog = page.locator('#focus-dialog').getByRole('dialog', { name: 'Focus review' });
  await expect(dialog).toBeVisible(); await expect(dialog).toBeFocused();
  observed.overlay = await focusPaint(dialog);
  completeOutline(observed.overlay, 3);
  expect(observed.overlay.outlineColor).toBe('rgb(21, 93, 133)');
  await expectUnclippedOutline(dialog);
  await record(info, 'independent-focus-families', observed);
});

test('Fluent accent and Shadcn halo enter and exit while the primary outline is immediate and geometry stays fixed', async ({ page, browserName }, info) => {
  await applyTheme(page, fluentPins);
  const target = control(page, 'text'), frame = focusFrame(page, 'text');
  await target.scrollIntoViewIfNeeded();
  const before = await focusPaint(target), restAccent = await accentPaint(frame);
  expect(restAccent.scale).toBe(0); expect(restAccent.accentWidth).toBe(2);
  expect(restAccent.pointerEvents).toBe('none');
  await armImmediateFocusCapture(target); await freezeNextAccentTransition(frame);
  await keyboardFocus(page, 'text', browserName); await waitForFrozenAccent(frame);
  const immediate = await assertImmediate(target);
  const zeroPaint = await focusPaint(target); completeOutline(zeroPaint); sameBox(before, zeroPaint);
  const enter = await sampleAccentTransition(frame);
  expect(enter.duration).toBe(200); expect(enter.zero.scale).toBeCloseTo(0, 4);
  expect(enter.middle.scale).toBeGreaterThan(0); expect(enter.middle.scale).toBeLessThan(1);
  expect(enter.end.scale).toBeCloseTo(1, 4);
  completeOutline(await focusPaint(target)); sameBox(before, await focusPaint(target));
  await expectUnclippedOutline(target);
  await page.locator('#focus-text').screenshot({ path: info.outputPath('focus-accent-complete.png') });
  await freezeNextAccentTransition(frame);
  await page.locator('#focus-before-text').focus();
  await waitForFrozenAccent(frame);
  const exit = await sampleAccentTransition(frame);
  expect(exit.duration).toBe(50); expect(exit.zero.scale).toBeCloseTo(1, 4);
  expect(exit.middle.scale).toBeGreaterThan(0); expect(exit.middle.scale).toBeLessThan(1);
  expect(exit.end.scale).toBeCloseTo(0, 4);
  sameBox(before, await focusPaint(target));
  expect(await target.evaluate(node => node.matches(':focus-visible'))).toBe(false);
  await expect(target).toHaveValue('Shared canvas');
  await record(info, 'native-focus-timeline', { before, immediate, zeroPaint, restAccent, enter, exit });

  await applyTheme(page, {
    'component.button.focus-halo-width': px(3),
    'component.button.focus-halo-color': { ...colorFromHex('#7352a6'), alpha: .3 },
    'duration.focus-enter': { value: 200, unit: 'ms' },
    'duration.focus-exit': { value: 200, unit: 'ms' },
    'ease.focus-enter': [.4, 0, .2, 1],
    'ease.focus-exit': [.4, 0, .2, 1],
  });
  const button = control(page, 'button');
  await button.scrollIntoViewIfNeeded(); const buttonBefore = await focusPaint(button);
  await armImmediateFocusCapture(button); await freezeNextTransition(button, 'box-shadow');
  await keyboardFocus(page, 'button', browserName); await waitForFrozenAccent(button);
  const buttonImmediate = await assertImmediate(button);
  completeOutline(await focusPaint(button)); sameBox(buttonBefore, await focusPaint(button));
  const haloEnter = await sampleHaloTransition(button);
  expect(haloEnter.duration).toBe(200); expect(haloEnter.zero.spread).toBe(0);
  expect(haloEnter.middle.spread).toBeGreaterThan(0); expect(haloEnter.middle.spread).toBeLessThan(3);
  expect(haloEnter.end.spread).toBe(3);
  for (const moment of [haloEnter.zero, haloEnter.middle, haloEnter.end]) {
    expect(moment.outlineStyle).toBe('solid'); expect(moment.outlineWidth).toBeGreaterThanOrEqual(2);
    expect(moment.outlineColor).toBe(buttonImmediate.outlineColor);
  }
  // Focus motion composes with the actual button's existing paint transitions.
  expect(await button.evaluate(node => getComputedStyle(node).transitionProperty.split(',').map(value => value.trim())))
    .toEqual(expect.arrayContaining(['background-color', 'border-color', 'box-shadow']));
  await freezeNextTransition(button, 'box-shadow');
  await page.locator('#focus-before-button').focus(); await waitForFrozenAccent(button);
  const haloExit = await sampleHaloTransition(button);
  expect(haloExit.duration).toBe(200); expect(haloExit.zero.spread).toBe(3);
  expect(haloExit.middle.spread).toBeGreaterThan(0); expect(haloExit.middle.spread).toBeLessThan(3);
  expect(haloExit.end.spread).toBe(0); sameBox(buttonBefore, await focusPaint(button));
  await record(info, 'native-halo-timeline', { buttonBefore, buttonImmediate, haloEnter, haloExit });
});

for (const forced of [false, true]) {
  test(`${forced ? 'forced colors' : 'reduced motion'} keeps a complete contour without animated accent or halo reliance`, async ({ page, browserName }, info) => {
    await applyTheme(page, { ...fluentPins,
      'component.input.focus-halo-width': px(3),
      'component.input.focus-halo-color': { ...colorFromHex('#28633a'), alpha: .5 } });
    await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: forced ? 'active' : 'none' });
    if (forced && !await page.evaluate(() => matchMedia('(forced-colors: active)').matches)) {
      test.skip(true, 'This installed engine does not emulate forced colors; physical system-palette review remains outstanding.');
    }
    const target = control(page, 'text'), frame = focusFrame(page, 'text');
    await target.scrollIntoViewIfNeeded(); const before = await focusPaint(target);
    await armImmediateFocusCapture(target); await keyboardFocus(page, 'text', browserName);
    const immediate = await assertImmediate(target);
    const focused = await focusPaint(target), accent = await accentPaint(frame);
    completeOutline(focused); sameBox(before, focused); await expectUnclippedOutline(target);
    expect(accent.scale).toBe(1); expect(accent.duration.split(',').every(value => parseFloat(value) === 0)).toBe(true);
    expect(await frame.evaluate(node => node.getAnimations({ subtree: true }).some(animation => animation instanceof CSSTransition && animation.transitionProperty === 'transform'))).toBe(false);
    expect(await target.evaluate(node => node.getAnimations().some(animation => animation instanceof CSSTransition && animation.transitionProperty === 'box-shadow'))).toBe(false);
    if (forced) {
      const highlight = await page.evaluate(() => {
        const probe = document.createElement('span'); probe.style.cssText = 'color:Highlight;forced-color-adjust:none';
        document.body.append(probe); const result = getComputedStyle(probe).color; probe.remove(); return result;
      });
      expect(focused.outlineColor).toBe(highlight); expect(focused.shadow).toBe('none'); expect(accent.color).toBe(highlight);
    }
    await page.locator('#focus-before-text').focus();
    expect((await accentPaint(frame)).scale).toBe(0);
    await record(info, 'focus-preferences', { forced, before, immediate, focused, accent });
  });
}

test('focus width leaves checkbox artwork and tab indicator thickness unchanged until their own tokens change', async ({ page, browserName }, info) => {
  await applyTheme(page);
  const checkbox = control(page, 'checkbox');
  const tab = page.locator('#focus-tabs en-tab').first().locator('[part~="base"]');
  const artwork = async () => ({
    checkbox: await checkbox.evaluate(node => { const css = getComputedStyle(node, '::before'); return { right: css.borderRightWidth, bottom: css.borderBottomWidth, width: css.width, height: css.height }; }),
    tab: await tab.evaluate(node => getComputedStyle(node).borderBottomWidth),
  });
  const before = await artwork();
  await applyTheme(page, { 'focus.width': px(4) });
  const afterFocus = await artwork(); expect(afterFocus).toEqual(before);
  await keyboardFocus(page, 'text', browserName);
  completeOutline(await focusPaint(control(page, 'text')), 4);
  await applyTheme(page, { 'focus.width': px(4), 'size.choice-mark-stroke': px(3), 'size.tab-indicator': px(3) });
  const afterArtwork = await artwork();
  expect(afterArtwork.checkbox.right).toBe('3px'); expect(afterArtwork.checkbox.bottom).toBe('3px');
  expect(afterArtwork.tab).toBe('3px');
  expect(afterArtwork.checkbox.width).toBe(before.checkbox.width); expect(afterArtwork.checkbox.height).toBe(before.checkbox.height);
  await expect(checkbox).toBeChecked();
  await expect(page.locator('#focus-tabs en-tab').first()).toHaveAttribute('aria-selected', 'true');
  await record(info, 'independent-artwork', { before, afterFocus, afterArtwork });
});

test('field frame composition remains noninteractive and stable across sizes, RTL, candidate changes and exact drafts', async ({ page, browserName }, info) => {
  await page.setViewportSize({ width: 420, height: 900 });
  await page.locator('#focus-recipes').evaluate(node => { node.dir = 'rtl'; });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await applyTheme(page, fluentPins);
  await control(page, 'text').fill('Keep this exact draft');
  const native = await control(page, 'text').elementHandle();
  const observations = [];
  for (const size of ['small', null, 'large']) {
    await page.locator('#focus-recipes').evaluate((region, value) => {
      for (const host of region.querySelectorAll('en-text-field,en-textarea,en-select,en-number-field,en-combobox')) {
        if (value === null) host.removeAttribute('size'); else host.setAttribute('size', value);
      }
    }, size);
    for (const id of ['text', 'textarea', 'select', 'number', 'combo']) {
      const frame = focusFrame(page, id);
      await expect(frame).toHaveCount(1);
      expect(await frame.evaluate(node => ({ tabIndex: node.tabIndex, role: node.getAttribute('role'), ariaHidden: node.getAttribute('aria-hidden') }))).toEqual({ tabIndex: -1, role: null, ariaHidden: null });
      await control(page, id).scrollIntoViewIfNeeded();
      // Keyboard helper may scroll; compare after entry with a blur that keeps scroll fixed.
      const target = await keyboardFocus(page, id, browserName);
      const focused = await focusPaint(target); completeOutline(focused);
      await expectUnclippedOutline(target);
      const frameBox = await frame.boundingBox(), controlBox = await control(page, id).boundingBox();
      expect(frameBox.width).toBeGreaterThanOrEqual(controlBox.width - .5);
      expect(frameBox.height).toBeGreaterThanOrEqual(controlBox.height - .5);
      await page.locator(`#focus-before-${id}`).evaluate(node => node.focus({ preventScroll: true }));
      sameBox(focused, await focusPaint(target));
      observations.push({ size: size ?? 'implicit-medium', id, focused, frameBox });
    }
  }
  await keyboardFocus(page, 'text', browserName);
  await applyTheme(page, { ...fluentPins, 'component.input.focus-color': colorFromHex('#7352a6') }, { mode: 'dark', density: 'compact' });
  await expect(control(page, 'text')).toBeFocused();
  await expect(control(page, 'text')).toHaveCSS('outline-color', 'rgb(115, 82, 166)');
  await expect(control(page, 'text')).toHaveValue('Keep this exact draft');
  expect(await control(page, 'text').evaluate((node, initial) => node === initial, native)).toBe(true);
  const overflowing = await page.locator('#focus-recipes').evaluate(node => node.scrollWidth > node.clientWidth + 1);
  expect(overflowing).toBe(false);
  await record(info, 'field-frame-sizes-and-draft', observations);

  // Modal search uses the same public frame, while result content remains outside
  // it. A short viewport must shrink the result list rather than its native input.
  const opener = page.locator('#focus-open-palette');
  await opener.focus(); await opener.press('Enter');
  const palette = page.locator('#focus-palette');
  const query = palette.getByRole('combobox', { name: 'Find a review command', exact: true });
  const queryFrame = focusFrame(page, 'palette');
  await expect(query).toBeFocused(); await expect(queryFrame).toHaveCount(1);
  await query.fill('Review command');
  const queryNode = await query.elementHandle();
  const list = palette.getByRole('listbox'); const listNode = await list.elementHandle();
  const initialQuery = await focusPaint(query); completeOutline(initialQuery);
  const queryAccent = await accentPaint(queryFrame);
  expect(queryAccent.accentWidth).toBe(2); expect(queryAccent.scale).toBe(1);
  expect(await queryFrame.evaluate(node => ({
    queryInside: node.contains(node.getRootNode().querySelector('[part~="control"]')),
    listInside: node.contains(node.getRootNode().querySelector('[part~="listbox"]')),
    statusInside: node.contains(node.getRootNode().querySelector('[part~="status"]')),
    tabIndex: node.tabIndex,
  }))).toEqual({ queryInside: true, listInside: false, statusInside: false, tabIndex: -1 });
  await page.setViewportSize({ width: 420, height: 360 });
  await expect(query).toBeFocused(); await expect(query).toHaveValue('Review command');
  await expect(queryFrame).toHaveCSS('flex-shrink', '0');
  await expect.poll(async () => (await focusPaint(query)).height).toBeCloseTo(initialQuery.height, 1);
  const constrainedQuery = await focusPaint(query); completeOutline(constrainedQuery);
  await expectUnclippedOutline(query);
  expect(await query.evaluate((node, initial) => node === initial, queryNode)).toBe(true);
  expect(await list.evaluate((node, initial) => node === initial, listNode)).toBe(true);
  await expect(palette.getByRole('option')).toHaveCount(30);
  expect(await list.evaluate(node => node.scrollHeight > node.clientHeight)).toBe(true);
  await query.press('ArrowDown');
  await expect(query).toBeFocused();
  const active = palette.locator('[part~="option"][data-active]');
  await expect(active).toHaveCount(1);
  expect(await query.getAttribute('aria-activedescendant')).toBe(await active.getAttribute('id'));
  await query.press('Escape'); await expect(palette).toHaveJSProperty('open', false);
  await expect(opener).toBeFocused();
  await expect(control(page, 'text')).toHaveValue('Keep this exact draft');
  await record(info, 'modal-query-frame', { initialQuery, constrainedQuery, queryAccent, nativeQueryAndListRetained: true });
  await queryNode.dispose(); await listNode.dispose();
});
