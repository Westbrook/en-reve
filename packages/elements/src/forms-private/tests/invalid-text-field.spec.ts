import { test, expect, type Locator, type Page } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { emitThemeCSS, resolveTheme } from '@en-reve/tokens';
import type { ThemeDensity } from '@en-reve/tokens';

const fixture = `/@fs${fileURLToPath(new URL('./index.html', import.meta.url))}`;
const profiles = [
  { density: 'comfortable', size: 'medium', direction: 'ltr' },
  { density: 'compact', size: 'small', direction: 'rtl', inlinePadding: '19px' },
  { density: 'spacious', size: 'large', direction: 'ltr', inlinePadding: '23px', customBorder: true },
] as const;
async function prepare(page: Page, profile: typeof profiles[number]) {
  await page.goto(fixture);
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  const custom = 'customBorder' in profile && profile.customBorder;
  await page.addStyleTag({ content: emitThemeCSS(resolveTheme({ density: profile.density as ThemeDensity,
    ...(custom ? { source: {
      border: { width: { $type: 'dimension', $value: { value: 3, unit: 'px' } } },
      space: { 'control-block': { $type: 'dimension', $value: { value: 12, unit: 'px' } } },
    } } : {}),
  }), { scope: 'root' }) });
  const host = page.locator('#controlled');
  await host.evaluate(async (element: any, profile) => {
    element.size = profile.size;
    element.dir = profile.direction;
    element.style.inlineSize = '360px';
    if ('inlinePadding' in profile) element.style.setProperty('--en-control-inline-padding', profile.inlinePadding);
    await element.updateComplete;
  }, profile);
  return { host, input: page.getByRole('textbox', { name: 'Controlled text', exact: true }) };
}
async function geometry(input: Locator) {
  return input.evaluate((node: HTMLInputElement) => {
    const box = node.getBoundingClientRect(); const style = getComputedStyle(node);
    const border = ['Top', 'Right', 'Bottom', 'Left'].map(side => parseFloat(style.getPropertyValue(`border-${side.toLowerCase()}-width`)));
    const padding = ['Top', 'Right', 'Bottom', 'Left'].map(side => parseFloat(style.getPropertyValue(`padding-${side.toLowerCase()}`)));
    return {
      outer: [box.left + scrollX, box.top + scrollY, box.width, box.height],
      // Actual content edges determine the text/caret inset in either direction.
      content: [box.left + scrollX + border[3] + padding[3], box.top + scrollY + border[0] + padding[0], box.right + scrollX - border[1] - padding[1], box.bottom + scrollY - border[2] - padding[2]],
      border, padding, color: style.borderTopColor,
      text: [style.fontFamily, style.fontSize, style.lineHeight, style.letterSpacing, style.textIndent, style.textAlign, style.direction],
      selection: [node.selectionStart, node.selectionEnd, node.selectionDirection], scrollLeft: node.scrollLeft,
    };
  });
}
function sameTextGeometry(before: Awaited<ReturnType<typeof geometry>>, after: Awaited<ReturnType<typeof geometry>>) {
  for (const key of ['outer', 'content'] as const) after[key].forEach((value, index) => expect(Math.abs(value - before[key][index]), `${key}[${index}]`).toBeLessThanOrEqual(0.1));
  expect(after.text).toEqual(before.text);
  expect(after.scrollLeft).toBe(before.scrollLeft);
}

test('public text-field errors use a 2px border without moving the text inset, focus or selection', async ({ page, browser }, info) => {
  info.annotations.push({ type: 'browser-version', description: browser.version() });
  const samples = [];
  for (const profile of profiles) {
    const { host, input } = await prepare(page, profile);
    await input.focus();
    await input.evaluate((node: HTMLInputElement) => node.setSelectionRange(1, 5, 'backward'));
    const original = await input.elementHandle();
    const valid = await geometry(input);
    expect(valid.border).toEqual(Array(4).fill('customBorder' in profile ? 3 : 1));
    if ('inlinePadding' in profile) expect(valid.padding[1]).toBe(parseFloat(profile.inlinePadding));
    const reported = await host.evaluate(async (element: any) => { element.error = 'This name is reserved.'; await element.updateComplete; const valid = element.reportValidity(); await element.updateComplete; return valid; });
    expect(reported).toBe(false);
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(host.locator('[part~="error"]')).toHaveText('This name is reserved.');
    const invalid = await geometry(input);
    expect(invalid.border).toEqual([2, 2, 2, 2]);
    expect(invalid.color).toBe(await host.locator('[part~="error"]').evaluate(node => getComputedStyle(node).color));
    sameTextGeometry(valid, invalid);
    expect(invalid.selection).toEqual(valid.selection);
    await expect(input).toBeFocused();await expect(input).toHaveValue('accepted');
    expect(await input.evaluate((node, previous) => node === previous, original)).toBe(true);
    expect(await host.evaluate(async (element: any) => { element.error = ''; await element.updateComplete; return element.reportValidity(); })).toBe(true);
    await expect(input).not.toHaveAttribute('aria-invalid', 'true');
    const recovered = await geometry(input);
    expect(recovered.border).toEqual(valid.border);expect(recovered.color).toBe(valid.color);
    sameTextGeometry(valid, recovered);expect(recovered.selection).toEqual(valid.selection);
    await expect(input).toBeFocused();await expect(input).toHaveValue('accepted');
    samples.push({ profile, valid, invalid, recovered });
  }
  await info.attach('invalid-text-field-geometry', { body: JSON.stringify(samples, null, 2), contentType: 'application/json' });
});

test('native user-invalid feedback preserves the controlled draft inset before application validation', async ({ page, browser }, info) => {
  info.annotations.push({ type: 'browser-version', description: browser.version() });
  const { host, input } = await prepare(page, profiles[1]);
  const supports = await page.evaluate(() => CSS.supports('selector(:user-invalid)'));
  test.skip(!supports, 'This browser does not expose the native :user-invalid selector.');
  // A plain input distinguishes missing native activation from component behavior.
  await page.evaluate(() => {
    const label = document.createElement('label');label.textContent = 'Native validation baseline';
    const control = document.createElement('input');control.pattern = '[a-z]+';control.value = 'accepted';
    label.append(control);document.querySelector('#fixture')!.append(label);
  });
  const baseline = page.getByRole('textbox', { name: 'Native validation baseline', exact: true });
  await baseline.selectText();await baseline.pressSequentially('123');await baseline.press('Tab');
  const activated = await baseline.evaluate(node => node.matches(':user-invalid'));
  test.skip(!activated, 'A real edit and blur did not activate :user-invalid on a plain native input in this engine.');
  await host.evaluate(async (element: any) => { element.pattern = '[a-z]+'; await element.updateComplete; });
  await input.focus();const valid = await geometry(input);
  await input.selectText();await input.pressSequentially('123');await input.press('Tab');
  await expect.poll(() => input.evaluate(node => node.matches(':user-invalid'))).toBe(true);
  await expect(input).not.toHaveAttribute('aria-invalid', 'true');
  await expect(input).toHaveValue('123');
  expect(await host.evaluate((element: any) => element.value)).toBe('accepted');
  await input.focus();const invalid = await geometry(input);
  expect(invalid.border).toEqual([2, 2, 2, 2]);sameTextGeometry(valid, invalid);
  await expect(input).toBeFocused();await expect(input).toHaveValue('123');
  await input.fill('accepted');await input.press('Tab');
  await expect.poll(() => input.evaluate(node => node.matches(':user-invalid'))).toBe(false);
  await input.focus();const recovered = await geometry(input);
  expect(recovered.border).toEqual(valid.border);sameTextGeometry(valid, recovered);
  await expect(input).toBeFocused();await expect(input).toHaveValue('accepted');
  await info.attach('native-user-invalid-geometry', { body: JSON.stringify({ valid, invalid, recovered }, null, 2), contentType: 'application/json' });
});


// Native single-line editors center their line box. Compare that independently
// measured center with the textarea's first line, rather than only comparing two
// computed padding declarations. Glyph rasterization remains a visual review.
async function lineBoxGeometry(control: Locator) {
  return control.evaluate((node: HTMLInputElement | HTMLTextAreaElement) => {
    const style = getComputedStyle(node);
    const height = node.getBoundingClientRect().height;
    const lineHeight = parseFloat(style.lineHeight);
    const borderStart = parseFloat(style.borderTopWidth);
    const paddingStart = parseFloat(style.paddingTop);
    return {
      height, lineHeight, borderStart, paddingStart,
      firstLineInset: borderStart + paddingStart,
      centeredLineInset: (height - lineHeight) / 2,
      font: [style.fontFamily, style.fontSize, style.fontWeight, style.lineHeight, style.letterSpacing],
      resize: style.resize,
      coarsePointer: matchMedia('(pointer: coarse)').matches,
    };
  });
}

test('textarea rows preserve the input first-line inset across size, density and border profiles', async ({ page, browser }, info) => {
  info.annotations.push({ type: 'browser-version', description: browser.version() });
  const samples = [];
  // Allow one CSS pixel for native rows/line-box rounding across the engines.
  // The old textarea padding misses the shared input envelope by several pixels.
  const tolerance = 1;
  for (const profile of profiles) {
    const { host, input } = await prepare(page, profile);
    const notes = page.locator('#controlled-notes');
    await notes.evaluate(async (element: any, profile) => {
      element.size = profile.size;
      element.dir = profile.direction;
      element.style.inlineSize = '360px';
      if ('inlinePadding' in profile) element.style.setProperty('--en-control-inline-padding', profile.inlinePadding);
      element.rows = 1;
      element.value = 'First line';
      await element.updateComplete;
    }, profile);
    const textarea = page.getByRole('textbox', { name: 'Controlled notes', exact: true });
    const original = await textarea.elementHandle();
    await textarea.focus();
    await textarea.evaluate((node: HTMLTextAreaElement) => node.setSelectionRange(1, 5, 'backward'));
    const inputValid = await lineBoxGeometry(input);
    expect(Number.isFinite(inputValid.lineHeight)).toBe(true);
    expect(inputValid.borderStart).toBe('customBorder' in profile ? 3 : 1);
    const rows1 = await lineBoxGeometry(textarea);
    expect(rows1.font).toEqual(inputValid.font);
    expect(rows1.borderStart).toBe(inputValid.borderStart);
    // Firefox serializes the horizontal-writing-mode block axis as vertical.
    expect(['block', 'vertical']).toContain(rows1.resize);
    expect(Math.abs(rows1.height - inputValid.height), `${profile.density}: one-row outer height`).toBeLessThanOrEqual(tolerance);
    expect(Math.abs(rows1.firstLineInset - inputValid.centeredLineInset), `${profile.density}: first-line inset`).toBeLessThanOrEqual(tolerance);

    await notes.evaluate(async (element: any) => { element.rows = 3; await element.updateComplete; });
    const rows3 = await lineBoxGeometry(textarea);
    expect(Math.abs(rows3.firstLineInset - inputValid.centeredLineInset), `${profile.density}: three-row first-line inset`).toBeLessThanOrEqual(tolerance);
    expect(Math.abs(rows3.height - rows1.height - 2 * rows3.lineHeight), `${profile.density}: native rows growth`).toBeLessThanOrEqual(tolerance);
    expect(rows3.resize).toBe(rows1.resize);
    await expect(textarea).toBeFocused();
    await expect(textarea).toHaveValue('First line');
    expect(await textarea.evaluate((node: HTMLTextAreaElement) => [node.selectionStart, node.selectionEnd, node.selectionDirection])).toEqual([1, 5, 'backward']);
    expect(await textarea.evaluate((node, previous) => node === previous, original)).toBe(true);

    await notes.evaluate(async (element: any) => { element.rows = 1; await element.updateComplete; });
    const rows1Restored = await lineBoxGeometry(textarea);
    expect(Math.abs(rows1Restored.height - rows1.height)).toBeLessThanOrEqual(0.1);
    expect(Math.abs(rows1Restored.firstLineInset - rows1.firstLineInset)).toBeLessThanOrEqual(0.1);

    // A stronger invalid input border must retain the same centered line and
    // alignment, including when the authored valid border is thicker (3px).
    await host.evaluate(async (element: any) => {
      element.error = 'This name is reserved.';
      await element.updateComplete;
      element.reportValidity();
      await element.updateComplete;
    });
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    const inputInvalid = await lineBoxGeometry(input);
    expect(inputInvalid.borderStart).toBe(2);
    expect(Math.abs(inputInvalid.height - inputValid.height)).toBeLessThanOrEqual(0.1);
    expect(Math.abs(inputInvalid.firstLineInset - inputValid.firstLineInset)).toBeLessThanOrEqual(0.1);
    expect(Math.abs(rows1Restored.firstLineInset - inputInvalid.centeredLineInset)).toBeLessThanOrEqual(tolerance);
    samples.push({ profile, inputValid, rows1, rows3, rows1Restored, inputInvalid });
  }
  await info.attach('textarea-input-line-box-geometry', { body: JSON.stringify(samples, null, 2), contentType: 'application/json' });
});
