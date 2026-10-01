import { test, expect } from '@playwright/test';
import { resolveTheme, emitThemeCSS, colorFromHex, restoreDerived } from '../../dist/index.js';
import { stabilizePreview } from './stable-page.mjs';

const control = (page, selector) => page.locator(selector).locator('[part="control"]');
const pageControl = page => control(page, '#scopes [data-specimen="theme-scopes"] .scope-sample:not([data-en-theme]) en-button');
const childControl = page => control(page, '#scopes [data-specimen="theme-scopes"] [data-en-theme="inverse"] en-button');
const localControl = page => page.locator('#scopes').getByRole('button', {name:'Local customization',exact:true});
const chooseDark = page => page.locator('en-segmented-control[label="Appearance"]').getByText('Dark', {exact:true}).click();
const pageCard = page => page.locator('#scopes [data-specimen="theme-scopes"] .scope-sample:not([data-en-theme]) en-card [part="base"]');
const childCard = page => page.locator('#scopes [data-specimen="theme-scopes"] [data-en-theme="inverse"] en-card [part="base"]');

async function values(locator) {
  return locator.evaluate(element => {
    const style = getComputedStyle(element);
    return Object.fromEntries(['backgroundColor', 'color', 'borderRadius', 'minBlockSize', 'fontSize', 'paddingInlineStart', 'paddingBlockStart', 'gap'].map(name => [name, style[name]]));
  });
}

async function record(testInfo, browser, label, measurements) {
  await testInfo.attach(`${label}.json`, {
    body: JSON.stringify({ engine: testInfo.project.name, version: browser.version(), measurements }, null, 2),
    contentType: 'application/json',
  });
}

test.beforeEach(async ({ page, baseURL }) => {
  await stabilizePreview(page,baseURL);
  await page.goto('/');
  await expect(pageControl(page)).toBeVisible();
  // Avoid hover-affordance color changes while measuring authored normal states.
  await page.mouse.move(0, 0);
});

test('page theme, full child theme and local component styling reach real shadow controls', async ({ page, browser }, testInfo) => {
  await expect(pageControl(page)).toHaveCSS('background-color', 'rgb(36, 87, 214)');
  await expect(page.locator('.wordmark')).toHaveCSS('color', 'rgb(36, 87, 214)');
  await expect(page.locator('.wordmark .mark')).toHaveCSS('background-color', 'rgb(36, 87, 214)');
  await expect(childControl(page)).toHaveCSS('background-color', 'rgb(170, 193, 255)');
  await expect(pageCard(page)).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(childCard(page)).toHaveCSS('background-color', 'rgb(28, 33, 39)');
  await expect(pageControl(page)).toHaveCSS('border-radius', '8px');
  await expect(localControl(page)).toHaveCSS('border-radius', '0px');
  await expect(pageControl(page)).toHaveCSS('min-block-size', '40px');
  await expect(pageControl(page)).toHaveCSS('font-size', '16px');
  await record(testInfo, browser, 'initial-scopes', {
    page: await values(pageControl(page)), child: await values(childControl(page)), local: await values(localControl(page)),
  });
  await page.locator('#scopes').screenshot({ path: testInfo.outputPath('initial-scopes.png') });
});

test('preview controls apply accent, rhythm, density and mode while preserving local overrides', async ({ page, browser }, testInfo) => {
  await page.getByRole('combobox', { name: 'Density', exact: true }).selectOption('compact');
  await page.getByRole('combobox', { name: 'Layout rhythm', exact: true }).selectOption('0.5');
  // Playwright edits the native DOM input; native OS picker interaction remains manual.
  await page.getByLabel('Accent seed', { exact: true }).fill('#a13698');
  await expect(pageControl(page)).toHaveCSS('background-color', 'rgb(161, 54, 152)');
  await expect(page.locator('.wordmark')).toHaveCSS('color', 'rgb(161, 54, 152)');
  await expect(page.locator('.wordmark').getByText('en-reve', { exact: true })).toHaveCSS('color', 'rgb(161, 54, 152)');
  await expect(page.locator('.wordmark .mark')).toHaveCSS('background-color', 'rgb(161, 54, 152)');
  await expect(childControl(page)).toHaveCSS('background-color', 'rgb(170, 193, 255)');
  await expect(pageControl(page)).toHaveCSS('min-block-size', '50px');
  await expect(childControl(page)).toHaveCSS('min-block-size', '38px');
  await expect(pageControl(page)).toHaveCSS('font-size', '16px');
  await expect(pageCard(page)).toHaveCSS('padding-block-start', '32px');
  await expect(childCard(page)).toHaveCSS('padding-block-start', '16px');
  await expect(localControl(page)).toHaveCSS('border-radius', '0px');
  await record(testInfo, browser, 'custom-preview', {
    page: await values(pageControl(page)), child: await values(childControl(page)),
    pageCard: await values(pageCard(page)), childCard: await values(childCard(page)), local: await values(localControl(page)),
  });
  await chooseDark(page);
  await page.mouse.move(0, 0);
  await expect(pageCard(page)).toHaveCSS('background-color', 'rgb(28, 33, 39)');
  await expect(childCard(page)).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(pageControl(page)).toHaveCSS('background-color', 'rgb(161, 54, 152)');
  await expect(childControl(page)).toHaveCSS('background-color', 'rgb(36, 87, 214)');
  await expect(localControl(page)).toHaveCSS('border-radius', '0px');
  await page.getByRole('button', { name: 'Reset preview', exact: true }).click();
  await page.mouse.move(0, 0);
  await expect(pageControl(page)).toHaveCSS('background-color', 'rgb(36, 87, 214)');
  await expect(page.locator('.wordmark').getByText('en-reve', { exact: true })).toHaveCSS('color', 'rgb(36, 87, 214)');
  await expect(page.locator('.wordmark .mark')).toHaveCSS('background-color', 'rgb(36, 87, 214)');
  await expect(page.locator('.wordmark .mark')).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(pageControl(page)).toHaveCSS('min-block-size', '40px');
  await expect(pageCard(page)).toHaveCSS('padding-block-start', '24px');
  await expect(localControl(page)).toHaveCSS('border-radius', '0px');
});

test('a full child boundary resets inherited component pins; a partial region preserves unrelated inheritance', async ({ page, browser }, testInfo) => {
  const full = resolveTheme({ name: 'token-full', mode: 'dark' });
  const partial = resolveTheme({ pins: { 'color.action': colorFromHex('#006400') } });
  await page.addStyleTag({ content:
    emitThemeCSS(full) +
    emitThemeCSS(partial, { kind: 'partial', tokenIds: ['color.action'], selector: ':where([data-token-partial])' }),
  });
  await page.evaluate(() => {
    const fixture = document.createElement('section');
    fixture.id = 'token-fixture';
    fixture.style.setProperty('--en-button-background', 'rgb(200, 0, 0)');
    const addButton = (parent, id) => {
      const button = document.createElement('en-button'); button.id = id; button.textContent = id; parent.append(button); return button;
    };
    addButton(fixture, 'token-inherited');
    const full = document.createElement('article'); full.dataset.enTheme = 'token-full'; fixture.append(full);
    addButton(full, 'token-rebased');
    const partial = document.createElement('section'); partial.dataset.tokenPartial = ''; full.append(partial);
    addButton(partial, 'token-partial');
    const local = addButton(partial, 'token-local');
    local.style.setProperty('--en-button-background', 'rgb(0, 0, 200)');
    document.body.append(fixture);
  });
  await expect(control(page, '#token-inherited')).toHaveCSS('background-color', 'rgb(200, 0, 0)');
  await expect(control(page, '#token-rebased')).toHaveCSS('background-color', 'rgb(170, 193, 255)');
  await expect(control(page, '#token-partial')).toHaveCSS('background-color', 'rgb(0, 100, 0)');
  await expect(control(page, '#token-partial')).toHaveCSS('color', 'rgb(16, 27, 57)');
  await expect(control(page, '#token-local')).toHaveCSS('background-color', 'rgb(0, 0, 200)');
  await record(testInfo, browser, 'rebase-and-partial', Object.fromEntries(await Promise.all(
    ['inherited', 'rebased', 'partial', 'local'].map(async id => [id, await values(control(page, `#token-${id}`))]),
  )));
});

test('primitive overrides require a complete boundary to rebase inherited aliases', async ({ page, browser }, testInfo) => {
  await page.evaluate(() => {
    const fixture = document.createElement('section'); fixture.id = 'token-primitive';
    fixture.style.setProperty('--en-rhythm-base', '.5rem');
    const button = document.createElement('en-button'); button.textContent = 'Primitive boundary'; fixture.append(button);
    document.body.append(fixture);
  });
  const button = control(page, '#token-primitive en-button');
  // An inherited semantic alias was computed at the page root: this descendant
  // primitive declaration alone does not re-evaluate that inherited value.
  await expect(button).toHaveCSS('padding-inline-start', '12px');
  await page.addStyleTag({ content: emitThemeCSS(resolveTheme({ name: 'rebase' }), { selector: ':where(#token-primitive)' }) });
  // The full boundary declares the graph beside the same .5rem primitive pin.
  await expect(button).toHaveCSS('padding-inline-start', '24px');
  await record(testInfo, browser, 'primitive-rebase', { afterRebase: await values(button), beforePadding: '12px' });
});

test('granular rhythm and hover pins survive system changes and restore rejoins the derived graph', async ({ page, browser }, testInfo) => {
  const pins = {
    'rhythm.base': { value: .5, unit: 'rem' },
    'space.3': { value: .3, unit: 'rem' },
    'color.action': colorFromHex('#a13698'),
    'color.action-hover': colorFromHex('#202020'),
  };
  await page.evaluate(() => {
    const fixture = document.createElement('section'); fixture.id = 'token-pin';
    const button = document.createElement('en-button'); button.textContent = 'Pinned control'; fixture.append(button);
    document.body.append(fixture);
  });
  const style = await page.addStyleTag({ content: emitThemeCSS(resolveTheme({ pins }), { selector: ':where(#token-pin)' }) });
  const button = control(page, '#token-pin en-button');
  await expect(button).toHaveCSS('background-color', 'rgb(161, 54, 152)');
  await expect(button).toHaveCSS('padding-inline-start', '4.8px');
  await button.hover();
  await expect(button).toHaveCSS('background-color', 'rgb(32, 32, 32)');
  await page.mouse.move(0, 0);
  const restored = resolveTheme({ pins: restoreDerived(pins, 'space.3') });
  await style.evaluate((element, css) => { element.textContent = css; }, emitThemeCSS(restored, { selector: ':where(#token-pin)' }));
  await expect(button).toHaveCSS('padding-inline-start', '24px');
  await expect(button).toHaveCSS('background-color', 'rgb(161, 54, 152)');
  await record(testInfo, browser, 'pin-and-restore', { afterRestore: await values(button), pinnedPadding: '4.8px', pinnedHover: 'rgb(32, 32, 32)' });
});

test('unlayered author overrides follow the CSS cascade and survive a theme refresh', async ({ page, browser }, testInfo) => {
  await page.addStyleTag({ content: '#scopes [data-specimen="theme-scopes"] [data-en-theme="inverse"] { --en-color-action: rgb(10, 80, 90); }' });
  await expect(childControl(page)).toHaveCSS('background-color', 'rgb(10, 80, 90)');
  await chooseDark(page);
  await page.mouse.move(0, 0);
  await expect(childControl(page)).toHaveCSS('background-color', 'rgb(10, 80, 90)');
  await expect(pageControl(page)).toHaveCSS('background-color', 'rgb(170, 193, 255)');
  await record(testInfo, browser, 'author-cascade', { child: await values(childControl(page)) });
});

test('derived accent roles render their resolved colors in surfaces and real hover and pressed states', async ({ page, browser }, testInfo) => {
  // Measure pointer colors with the supported reduced-motion preference so an
  // ongoing smooth scroll cannot move the button away between hover and press.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const roleIds = ['color.brand', 'color.on-brand', 'color.action', 'color.action-hover', 'color.action-pressed', 'color.accent-subtle', 'color.accent-border', 'color.on-action', 'color.danger-text'];
  async function verify(theme, label) {
    const expectedAndActual = await page.evaluate(tokens => {
      const measurements = {};
      // Compare published CSS consumed by the browser against independently
      // resolved token values parsed by the same browser's CSS color parser.
      for (const token of tokens) {
        const expected = document.createElement('i'); expected.style.backgroundColor = token.cssValue;
        const actual = document.createElement('i'); actual.style.backgroundColor = `var(${token.cssName})`;
        document.body.append(expected, actual);
        measurements[token.id] = { expected: getComputedStyle(expected).backgroundColor, actual: getComputedStyle(actual).backgroundColor };
        expected.remove(); actual.remove();
      }
      return measurements;
    }, roleIds.map(id => theme.tokens[id]));
    for (const role of roleIds) expect(expectedAndActual[role].actual, role).toBe(expectedAndActual[role].expected);
    for (const role of ['color.action-hover', 'color.action-pressed', 'color.accent-subtle', 'color.accent-border']) {
      expect(expectedAndActual[role].actual, role).not.toBe(expectedAndActual['color.action'].actual);
    }
    const button = pageControl(page);
    await button.hover();
    await expect(button).toHaveCSS('background-color', expectedAndActual['color.action-hover'].expected);
    await page.mouse.down();
    await expect(button).toHaveCSS('background-color', expectedAndActual['color.action-pressed'].expected);
    await page.mouse.up();
    await page.mouse.move(0, 0);
    await expect(button).toHaveCSS('background-color', expectedAndActual['color.action'].expected);
    const danger = page.locator('#actions en-button[variant="danger"] [part="control"]');
    await expect(danger).toHaveCSS('color', expectedAndActual['color.danger-text'].expected);
    await expect(danger).toHaveCSS('border-top-color', expectedAndActual['color.danger-text'].expected);
    await record(testInfo, browser, label, { roles: expectedAndActual, danger: await values(danger) });
  }
  await verify(resolveTheme(), 'default-accent-recipes');
  await page.getByLabel('Accent seed', { exact: true }).fill('#a13698');
  await verify(resolveTheme({ pins: { 'palette.accent': colorFromHex('#a13698') } }), 'custom-accent-recipes');
});

test('branding and actions share a seed while independent pins and restoration stay isolated', async ({ page, browser }, testInfo) => {
  const seed = { 'palette.accent': colorFromHex('#a13698') };
  const style = await page.addStyleTag({ content: emitThemeCSS(resolveTheme({ pins: seed }), { scope: 'root' }) });
  const wordmark = page.locator('.wordmark');
  const mark = wordmark.locator('.mark');
  const button = pageControl(page);
  async function apply(pins) {
    const theme = resolveTheme({ pins });
    await style.evaluate((element, css) => { element.textContent = css; }, emitThemeCSS(theme, { scope: 'root' }));
    return theme;
  }
  async function verify(theme, label) {
    const expected = await page.evaluate(tokens => Object.fromEntries(tokens.map(token => {
      const sample = document.createElement('span'); sample.style.color = token.cssValue;
      document.body.append(sample); const color = getComputedStyle(sample).color; sample.remove();
      return [token.id, color];
    })), ['color.brand', 'color.on-brand', 'color.action', 'color.on-action', 'color.action-text'].map(id => theme.tokens[id]));
    // The link uses the readable action-text role; its mark carries the brand.
    await expect(wordmark).toHaveCSS('color', expected['color.action-text']);
    await expect(wordmark.getByText('en-reve', { exact: true })).toHaveCSS('color', expected['color.action-text']);
    await expect(mark).toHaveCSS('background-color', expected['color.brand']);
    await expect(mark).toHaveCSS('color', expected['color.on-brand']);
    await expect(button).toHaveCSS('background-color', expected['color.action']);
    await expect(button).toHaveCSS('color', expected['color.on-action']);
    await record(testInfo, browser, label, { expected, wordmark: await values(wordmark), mark: await values(mark), button: await values(button) });
    return expected;
  }
  const shared = await verify(resolveTheme({ pins: seed }), 'brand-shared-seed');
  expect(shared['color.brand']).toBe('rgb(161, 54, 152)');
  expect(shared['color.action']).toBe(shared['color.brand']);

  // Distinct light branding and dark action fills require independently chosen text colors.
  const separatePins = { ...seed, 'color.brand': colorFromHex('#f4df37'), 'color.action': colorFromHex('#153b68') };
  const separate = await verify(await apply(separatePins), 'brand-action-independent-pins');
  expect(separate['color.brand']).toBe('rgb(244, 223, 55)');
  expect(separate['color.action']).toBe('rgb(21, 59, 104)');
  expect(separate['color.on-brand']).toBe('rgb(16, 27, 57)');
  expect(separate['color.on-action']).toBe('rgb(255, 255, 255)');

  const changedSeed = { ...separatePins, 'palette.accent': colorFromHex('#307f52') };
  expect(await verify(await apply(changedSeed), 'brand-action-pins-survive-seed')).toEqual(separate);
  const brandRestored = restoreDerived(changedSeed, 'color.brand');
  const restoredBrand = await verify(await apply(brandRestored), 'brand-only-restored');
  expect(restoredBrand['color.brand']).toBe('rgb(48, 127, 82)');
  expect(restoredBrand['color.action']).toBe(separate['color.action']);
  expect(restoredBrand['color.on-action']).toBe(separate['color.on-action']);

  const bothRestored = restoreDerived(brandRestored, 'color.action');
  const restored = await verify(await apply(bothRestored), 'brand-action-rejoined-seed');
  expect(restored['color.action']).toBe(restored['color.brand']);
  const palettePin = { ...bothRestored, 'palette.action': colorFromHex('#d56103') };
  const independentPalette = await verify(await apply(palettePin), 'action-palette-override');
  expect(independentPalette['color.action']).toBe('rgb(213, 97, 3)');
  expect(independentPalette['color.brand']).toBe(restored['color.brand']);
  expect(independentPalette['color.on-brand']).toBe(restored['color.on-brand']);
});

test('a full child theme resets brand and action roles while a partial brand region preserves actions', async ({ page, browser }, testInfo) => {
  const parent = resolveTheme({ name: 'brand-parent', pins: {
    'palette.accent': colorFromHex('#a13698'), 'color.brand': colorFromHex('#f4df37'), 'color.action': colorFromHex('#153b68'),
  } });
  const child = resolveTheme({ name: 'brand-child', mode: 'dark' });
  const partial = resolveTheme({ mode: 'dark', pins: { 'color.brand': colorFromHex('#f4df37') } });
  const parentStyle = await page.addStyleTag({ content: emitThemeCSS(parent) });
  await page.addStyleTag({ content: emitThemeCSS(child) +
    emitThemeCSS(partial, { kind: 'partial', tokenIds: ['color.brand', 'color.on-brand'], selector: ':where([data-brand-partial])' }) +
    '[data-brand-mark] { display:inline-block; background-color:var(--en-color-brand); color:var(--en-color-on-brand); padding:1rem; }',
  });
  await page.evaluate(() => {
    const fixture = document.createElement('section'); fixture.id = 'brand-scope-fixture'; fixture.dataset.enTheme = 'brand-parent';
    const addSurface = (region, id) => {
      const mark = document.createElement('span'); mark.dataset.brandMark = ''; mark.id = `${id}-brand`; mark.textContent = 'Brand sample';
      const button = document.createElement('en-button'); button.id = `${id}-action`; button.textContent = 'Action sample';
      region.append(mark, button);
    };
    addSurface(fixture, 'parent');
    const child = document.createElement('article'); child.dataset.enTheme = 'brand-child'; fixture.append(child); addSurface(child, 'child');
    const partial = document.createElement('section'); partial.dataset.brandPartial = ''; child.append(partial); addSurface(partial, 'partial');
    document.body.append(fixture);
  });
  await expect(page.locator('#parent-brand')).toHaveCSS('background-color', 'rgb(244, 223, 55)');
  await expect(control(page, '#parent-action')).toHaveCSS('background-color', 'rgb(21, 59, 104)');
  await expect(page.locator('#child-brand')).toHaveCSS('background-color', 'rgb(170, 193, 255)');
  await expect(page.locator('#child-brand')).toHaveCSS('color', 'rgb(16, 27, 57)');
  await expect(control(page, '#child-action')).toHaveCSS('background-color', 'rgb(170, 193, 255)');
  await expect(page.locator('#partial-brand')).toHaveCSS('background-color', 'rgb(244, 223, 55)');
  await expect(control(page, '#partial-action')).toHaveCSS('background-color', 'rgb(170, 193, 255)');
  await expect(control(page, '#partial-action')).toHaveCSS('color', 'rgb(16, 27, 57)');
  const changedParent = resolveTheme({ name: 'brand-parent', pins: { 'palette.accent': colorFromHex('#307f52') } });
  await parentStyle.evaluate((element, css) => { element.textContent = css; }, emitThemeCSS(changedParent));
  await expect(page.locator('#parent-brand')).toHaveCSS('background-color', 'rgb(48, 127, 82)');
  await expect(control(page, '#parent-action')).toHaveCSS('background-color', 'rgb(48, 127, 82)');
  await expect(page.locator('#child-brand')).toHaveCSS('background-color', 'rgb(170, 193, 255)');
  await expect(control(page, '#child-action')).toHaveCSS('background-color', 'rgb(170, 193, 255)');
  await expect(page.locator('#partial-brand')).toHaveCSS('background-color', 'rgb(244, 223, 55)');
  await expect(control(page, '#partial-action')).toHaveCSS('background-color', 'rgb(170, 193, 255)');
  await record(testInfo, browser, 'brand-scoped-reset', Object.fromEntries(await Promise.all(
    ['parent', 'child', 'partial'].map(async id => [id, { mark: await values(page.locator(`#${id}-brand`)), action: await values(control(page, `#${id}-action`)) }]),
  )));
});
