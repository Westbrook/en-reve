import { test, expect } from '@playwright/test';
import { resolveTheme, emitThemeCSS, colorFromHex } from '../../dist/index.js';
import { stabilizePreview } from './stable-page.mjs';

test.describe.configure({ mode: 'serial' });
const items = [
  { value: 'alpha', label: 'Alpha project' }, { value: 'beta', label: 'Beta project' },
  { value: 'gamma', label: 'Gamma project' }, { value: 'delta', label: 'Delta unavailable', disabled: true },
];
const colors = {
  rest: ['#fffaf0', '#302c24'], selected: ['#d9e6ff', '#143d73'],
  active: ['#f4e1ff', '#573273'], hover: ['#e0f2e9', '#174c35'],
  pressed: ['#ffebcd', '#623d13'], disabled: ['#eeeeee', '#686868'], broad: ['#f4d8e7', '#4b2039'],
};
const rgb = hex => `rgb(${[1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16)).join(', ')})`;
const combo = page => page.locator('#menu-combo');
const input = page => combo(page).getByRole('combobox', { name: 'Project catalog', exact: true });
const row = (page, label) => combo(page).locator('[part~="option"]').filter({ hasText: label });
const nativeSelect = page => page.locator('#menu-select [part~="control"]');
const option = (page, label) => nativeSelect(page).getByRole('option', { name: label, exact: true });
const popup = page => combo(page).locator('[part~="popup"]');
const pinsFor = states => Object.fromEntries(states.flatMap(state => [
  [`component.option.${state}-background`, colorFromHex(colors[state][0])],
  [`component.option.${state}-color`, colorFromHex(colors[state][1])],
]));
async function applyTheme(page, pins = {}) {
  const theme = resolveTheme({ pins });
  await page.addStyleTag({ content: emitThemeCSS(theme, { selector: ':where(#menu-customization)' }) });
  return theme.sourceHash;
}
async function statePaint(locator, state) {
  await expect(locator).toHaveCSS('background-color', rgb(colors[state][0]));
  await expect(locator).toHaveCSS('color', rgb(colors[state][1]));
}
async function paint(locator) {
  return locator.evaluate(element => {
    const style = getComputedStyle(element), box = element.getBoundingClientRect();
    return { background: style.backgroundColor, color: style.color, outline: style.outlineStyle,
      outlineColor: style.outlineColor, outlineWidth: parseFloat(style.outlineWidth),
      fontWeight: style.fontWeight, width: box.width, height: box.height, parts: element.getAttribute('part') };
  });
}
async function accepted(page) {
  return page.locator('#menu-form').evaluate(form => Object.fromEntries(new FormData(form)));
}
async function openWithBetaActive(page) {
  await page.locator('#menu-before').focus(); await page.keyboard.press('Tab');
  await expect(input(page)).toBeFocused();
  await input(page).press('ArrowDown'); await expect(input(page)).toHaveAttribute('aria-expanded', 'true');
  await input(page).press('ArrowDown');
  await expect(input(page)).toHaveAttribute('aria-activedescendant', await row(page, 'Beta project').getAttribute('id'));
}
async function record(info, name, value) {
  await info.attach(name, { body: JSON.stringify(value, null, 2), contentType: 'application/json' });
}

test.beforeEach(async ({ page, baseURL }) => {
  await stabilizePreview(page, baseURL); await page.goto('/');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(async suppliedItems => {
    await Promise.all(['en-combobox', 'en-select'].map(tag => customElements.whenDefined(tag)));
    const section = document.createElement('section'); section.id = 'menu-customization';
    section.innerHTML = `<h2>Option state customization</h2><button type="button" id="menu-before">Before catalog</button>
      <form id="menu-form">
        <en-combobox id="menu-combo" label="Project catalog" description="Choose one existing project." name="project" value="alpha" required></en-combobox>
        <en-select id="menu-select" label="Native project" name="nativeProject" value="alpha" required></en-select>
        <button type="submit" id="menu-submit">Save choices</button><button type="reset" id="menu-reset">Reset choices</button>
      </form><output id="menu-receipt"></output>`;
    section.querySelector('#menu-combo').items = suppliedItems;
    section.querySelector('#menu-select').items = suppliedItems;
    section.querySelector('form').addEventListener('submit', event => {
      event.preventDefault(); section.querySelector('output').value = JSON.stringify(Object.fromEntries(new FormData(event.currentTarget)));
    });
    document.body.append(section);
    await Promise.all([...section.querySelectorAll('*')].map(element => element.updateComplete));
    section.scrollIntoView({ block: 'start' });
  }, items);
  await page.addStyleTag({ content: `#menu-customization { box-sizing:border-box; inline-size:min(100%,38rem); min-block-size:100vh; margin:2rem auto; padding:1rem; }
    #menu-form { display:grid; gap:1rem; min-inline-size:0; } #menu-before { margin-block:1rem; }` });
  await page.locator('#menu-customization').evaluate(element => element.scrollIntoView({ block: 'start' }));
  await page.mouse.move(0, 0);
});

test('selected, keyboard-active, hovered and pressed rows retain different meanings and paint', async ({ page }, info) => {
  const sourceHash = await applyTheme(page, pinsFor(['rest', 'selected', 'active', 'hover', 'pressed', 'disabled']));
  await openWithBetaActive(page); await row(page, 'Gamma project').hover();
  await statePaint(row(page, 'Alpha project'), 'selected');
  await statePaint(row(page, 'Beta project'), 'active');
  await statePaint(row(page, 'Gamma project'), 'hover');
  await expect(row(page, 'Alpha project')).toHaveAttribute('aria-selected', 'true');
  await expect(row(page, 'Beta project')).toHaveAttribute('aria-selected', 'false');
  await expect(input(page)).toBeFocused();
  const active = await paint(row(page, 'Beta project'));
  expect(active.outline).toBe('solid'); expect(active.outlineWidth).toBeGreaterThanOrEqual(2);
  const indicator = row(page, 'Alpha project').locator('[part~="option-indicator"]');
  await expect(indicator).toHaveCSS('visibility', 'visible');
  expect(await accepted(page)).toEqual({ project: 'alpha', nativeProject: 'alpha' });
  await page.mouse.down();
  await statePaint(row(page, 'Gamma project'), 'pressed');
  expect(await accepted(page)).toEqual({ project: 'alpha', nativeProject: 'alpha' });
  await page.mouse.up();
  await expect(combo(page)).toHaveJSProperty('value', 'gamma'); await expect(input(page)).toBeFocused();
  await expect(input(page)).toHaveValue('Gamma project');
  await record(info, 'distinct-option-states', { sourceHash, active, settled: await accepted(page) });
});

test('disabled hover and press remain inert while keyboard navigation skips the unavailable value', async ({ page }) => {
  await applyTheme(page, pinsFor(['rest', 'selected', 'active', 'hover', 'pressed', 'disabled']));
  await openWithBetaActive(page); const disabled = row(page, 'Delta unavailable');
  await disabled.hover(); await statePaint(disabled, 'disabled');
  await page.mouse.down(); await statePaint(disabled, 'disabled'); await page.mouse.up();
  await expect(disabled).toHaveAttribute('aria-disabled', 'true');
  await expect(combo(page)).toHaveJSProperty('value', 'alpha'); await expect(input(page)).toBeFocused();
  await input(page).press('ArrowDown'); await input(page).press('ArrowDown');
  await expect(input(page)).toHaveAttribute('aria-activedescendant', await row(page, 'Gamma project').getAttribute('id'));
  await input(page).press('Enter'); await expect(combo(page)).toHaveJSProperty('value', 'gamma');
});

test('explicit state pins override legacy broad paint and preserve selected-plus-hover precedence', async ({ page }, info) => {
  await combo(page).evaluate((host, broad) => {
    host.style.setProperty('--en-option-background', broad[0]); host.style.setProperty('--en-option-color', broad[1]);
  }, colors.broad);
  await applyTheme(page); await openWithBetaActive(page); await row(page, 'Gamma project').hover();
  for (const label of ['Alpha project', 'Beta project', 'Gamma project']) await statePaint(row(page, label), 'broad');
  await applyTheme(page, pinsFor(['selected', 'hover', 'active']));
  await statePaint(row(page, 'Alpha project'), 'selected'); await statePaint(row(page, 'Beta project'), 'active');
  await statePaint(row(page, 'Gamma project'), 'hover');
  await row(page, 'Alpha project').hover(); await statePaint(row(page, 'Alpha project'), 'hover');
  await expect(row(page, 'Alpha project')).toHaveAttribute('aria-selected', 'true');
  await expect(row(page, 'Alpha project').locator('[part~="option-indicator"]')).toHaveCSS('visibility', 'visible');
  await page.mouse.move(0, 0); await statePaint(row(page, 'Alpha project'), 'selected');
  await input(page).press('ArrowUp'); await statePaint(row(page, 'Alpha project'), 'active');
  await expect(row(page, 'Alpha project')).toHaveAttribute('aria-selected', 'true');
  // A later full theme with no state pins restores the legacy broad override.
  await applyTheme(page); await statePaint(row(page, 'Alpha project'), 'broad');
  await input(page).press('Escape'); await expect(input(page)).toHaveValue('Alpha project');
  await record(info, 'broad-and-state-precedence', { settled: await accepted(page) });
});

test('forced colors preserve selected markers and active contours over authored state colors', async ({ page }, info) => {
  await applyTheme(page, pinsFor(['rest', 'selected', 'active', 'hover', 'pressed', 'disabled']));
  await page.emulateMedia({ forcedColors: 'active' });
  if (!await page.evaluate(() => matchMedia('(forced-colors: active)').matches)) {
    test.skip(true, 'This installed engine does not emulate forced colors; no system-palette claim.');
  }
  const system = await page.evaluate(() => {
    const probe = document.createElement('span'); probe.style.forcedColorAdjust = 'none'; document.body.append(probe);
    const values = Object.fromEntries(['Canvas', 'CanvasText', 'Highlight', 'HighlightText', 'GrayText'].map(name => {
      probe.style.color = name; return [name, getComputedStyle(probe).color];
    })); probe.remove(); return values;
  });
  await openWithBetaActive(page); await page.mouse.move(0, 0);
  await expect(popup(page)).toHaveCSS('background-color', system.Canvas);
  await expect(row(page, 'Alpha project')).toHaveCSS('background-color', system.Highlight);
  await expect(row(page, 'Alpha project')).toHaveCSS('color', system.HighlightText);
  const beta = await paint(row(page, 'Beta project'));
  expect(beta.outline).toBe('solid'); expect(beta.outlineWidth).toBeGreaterThanOrEqual(2);
  expect(beta.outlineColor).toBe(system.Highlight);
  await expect(row(page, 'Delta unavailable')).toHaveCSS('color', system.GrayText);
  await input(page).press('ArrowUp');
  const both = await paint(row(page, 'Alpha project'));
  expect(both.outline).toBe('solid'); expect(both.outlineWidth).toBeGreaterThanOrEqual(2);
  expect(both.outlineColor).toBe(system.HighlightText);
  await expect(row(page, 'Alpha project').locator('[part~="option-indicator"]')).toHaveCSS('visibility', 'visible');
  await record(info, 'system-palette-state-cues', { system, active: beta, selectedAndActive: both });
  await combo(page).screenshot({ path: info.outputPath('forced-color-field.png') });
  await popup(page).screenshot({ path: info.outputPath('forced-color-options.png') });
});

test('the enhanced native picker shares row paint while its explicit platform fallback remains usable', async ({ page }, info) => {
  await applyTheme(page, pinsFor(['rest', 'selected', 'hover', 'pressed', 'disabled']));
  const select = nativeSelect(page);
  const capability = await select.evaluate(control => ({
    enhanced: CSS.supports('appearance', 'base-select') && CSS.supports('selector(::picker(select))'),
    appearance: getComputedStyle(control).appearance,
  }));
  if (capability.enhanced) {
    expect(capability.appearance).toBe('base-select'); await select.click();
    await expect(option(page, 'Alpha project')).toBeVisible(); await page.mouse.move(0, 0);
    const selected = option(page, 'Alpha project');
    await expect(selected).toHaveJSProperty('selected', true);
    const highlighted = await selected.evaluate(element => element.matches(':hover, :focus-visible'));
    await statePaint(selected, highlighted ? 'hover' : 'selected');
    await option(page, 'Gamma project').hover(); await statePaint(option(page, 'Gamma project'), 'hover');
    await option(page, 'Delta unavailable').hover(); await statePaint(option(page, 'Delta unavailable'), 'disabled');
    await expect(option(page, 'Delta unavailable')).toBeDisabled();
    await page.keyboard.press('Escape'); await expect(select).toHaveValue('alpha');
    await select.click(); await option(page, 'Beta project').click(); await expect(select).toHaveValue('beta');
    expect((await accepted(page)).nativeProject).toBe('beta');
  } else {
    expect(capability.appearance).not.toBe('base-select');
    info.annotations.push({ type: 'native-select', description: 'Enhanced picker styling unavailable; the platform picker path is still exercised below.' });
  }
  await page.locator('#menu-select').evaluate(host => host.style.setProperty('--en-select-appearance', 'auto'));
  expect(await select.evaluate(control => getComputedStyle(control).appearance)).not.toBe('base-select');
  await select.focus(); await page.keyboard.press('g'); await page.keyboard.press('Tab');
  await expect(select).toHaveValue('gamma');
  await page.locator('#menu-submit').click();
  await expect(page.locator('#menu-receipt')).toHaveJSProperty('value', JSON.stringify({ project: 'alpha', nativeProject: 'gamma' }));
  await page.locator('#menu-reset').click(); await expect(select).toHaveValue('alpha');
  await record(info, 'native-picker-capability', capability);
});

test('scoped popup and row tokens update a live filtered draft without replacing its native input', async ({ page }, info) => {
  await openWithBetaActive(page); await input(page).fill('project');
  await expect(input(page)).toHaveAttribute('aria-expanded', 'true');
  const original = await input(page).elementHandle();
  await input(page).evaluate(control => control.setSelectionRange(1, 5));
  const sourceHash = await applyTheme(page, {
    ...pinsFor(['rest', 'hover', 'selected']),
    'component.option-list.background': colorFromHex('#f8f4ed'),
    'component.option-list.color': colorFromHex('#302c24'),
    'component.option-list.border-color': colorFromHex('#665844'),
    'component.option-list.padding': { value: .5, unit: 'rem' },
    'component.option-list.radius': { value: .75, unit: 'rem' },
    'component.option.inline-padding': { value: 1, unit: 'rem' },
    'component.option.block-padding': { value: .5, unit: 'rem' },
  });
  await expect(popup(page)).toHaveCSS('background-color', 'rgb(248, 244, 237)');
  await expect(popup(page)).toHaveCSS('border-top-color', 'rgb(102, 88, 68)');
  await expect(popup(page)).toHaveCSS('padding-top', '8px'); await expect(popup(page)).toHaveCSS('border-radius', '12px');
  await expect(row(page, 'Alpha project')).toHaveCSS('padding-inline-start', '16px');
  await expect(row(page, 'Alpha project')).toHaveCSS('padding-block-start', '8px');
  expect(await input(page).evaluate((current, earlier) => current === earlier, original)).toBe(true);
  await expect(input(page)).toBeFocused(); await expect(input(page)).toHaveValue('project');
  expect(await input(page).evaluate(control => [control.selectionStart, control.selectionEnd])).toEqual([1, 5]);
  expect((await accepted(page)).project).toBe('alpha');
  await input(page).press('ArrowDown'); await input(page).press('Enter');
  await expect(input(page)).toHaveValue('Alpha project');
  await record(info, 'live-theme-and-draft', { sourceHash, settled: await accepted(page) });
  await original.dispose();
});

test('full child themes reset option hooks while a partial child preserves inherited state paint', async ({ page }, info) => {
  await page.evaluate(async suppliedItems => {
    const scopes = document.createElement('section'); scopes.id = 'option-state-scopes';
    scopes.innerHTML = `<div id="option-state-parent">
      <en-combobox id="scope-parent" label="Parent catalog" value="alpha"></en-combobox>
      <div id="option-state-full"><en-combobox id="scope-full" label="Full child catalog" value="alpha"></en-combobox></div>
      <div id="option-state-partial"><en-combobox id="scope-partial" label="Partial child catalog" value="alpha"></en-combobox></div>
      </div><div id="option-state-baseline"><en-combobox id="scope-baseline" label="Baseline catalog" value="alpha"></en-combobox></div>`;
    for (const field of scopes.querySelectorAll('en-combobox')) field.items = suppliedItems;
    document.querySelector('#menu-customization').append(scopes);
    await Promise.all([...scopes.querySelectorAll('en-combobox')].map(field => field.updateComplete));
  }, items);
  const parent = resolveTheme({ pins: { ...pinsFor(['rest', 'selected']),
    'component.option-list.background': colorFromHex('#f8f4ed'),
  } });
  const defaults = resolveTheme();
  const partial = resolveTheme({ pins: { 'component.option.inline-padding': { value: 1.5, unit: 'rem' } } });
  await page.addStyleTag({ content: emitThemeCSS(parent, { selector: ':where(#option-state-parent)' })
    + emitThemeCSS(defaults, { selector: ':where(#option-state-full)' })
    + emitThemeCSS(defaults, { selector: ':where(#option-state-baseline)' })
    + emitThemeCSS(partial, { kind: 'partial', tokenIds: ['component.option.inline-padding'], selector: ':where(#option-state-partial)' }) });
  const measurements = {};
  for (const id of ['baseline', 'parent', 'full', 'partial']) {
    const field = page.locator(`#scope-${id}`), editor = field.getByRole('combobox');
    await field.scrollIntoViewIfNeeded(); await editor.focus(); await editor.press('ArrowDown');
    await expect(editor).toHaveAttribute('aria-expanded', 'true'); await page.mouse.move(0, 0);
    const selected = field.locator('[part~="option"]').filter({ hasText: 'Alpha project' });
    measurements[id] = {
      popup: await field.locator('[part~="popup"]').evaluate(element => getComputedStyle(element).backgroundColor),
      selected: await paint(selected), padding: await selected.evaluate(element => getComputedStyle(element).paddingInlineStart),
    };
    if (id === 'parent' || id === 'partial') {
      await statePaint(selected, 'selected'); expect(measurements[id].popup).toBe('rgb(248, 244, 237)');
    }
    await editor.press('Escape'); await expect(editor).toHaveValue('Alpha project');
  }
  expect(measurements.full.popup).toBe(measurements.baseline.popup);
  expect(measurements.full.selected.background).toBe(measurements.baseline.selected.background);
  expect(measurements.full.selected.color).toBe(measurements.baseline.selected.color);
  expect(measurements.full.selected.background).not.toBe(measurements.parent.selected.background);
  expect(measurements.partial.padding).toBe('24px');
  await record(info, 'option-hook-scope-isolation', measurements);
});


test('list surface text reaches rows without changing the input or unrelated overlay geometry', async ({ page }) => {
  const field = input(page);
  const before = await field.evaluate(element => ({color:getComputedStyle(element).color, padding:getComputedStyle(element).padding}));
  await applyTheme(page, {
    'component.option-list.color': colorFromHex('#513358'),
    'component.option-list.padding': {value:.5,unit:'rem'},
    'component.option-list.radius': {value:.625,unit:'rem'},
  });
  await openWithBetaActive(page); await page.mouse.move(0, 0);
  for (const label of ['Alpha project','Beta project','Gamma project']) await expect(row(page,label)).toHaveCSS('color','rgb(81, 51, 88)');
  expect(await field.evaluate(element => ({color:getComputedStyle(element).color, padding:getComputedStyle(element).padding}))).toEqual(before);
  const semantic = await combo(page).evaluate(element => ({
    dialog:getComputedStyle(element).getPropertyValue('--en-radius-dialog').trim(),
    overlay:getComputedStyle(element).getPropertyValue('--en-overlay-padding').trim(),
  }));
  expect(semantic).toEqual({dialog:'1.25rem',overlay:''});
  await field.press('Escape');
  if (await page.evaluate(() => CSS.supports('appearance','base-select') && CSS.supports('selector(::picker(select))'))) {
    await nativeSelect(page).click();
    await expect(option(page,'Gamma project')).toBeVisible();
    await expect(option(page,'Gamma project')).toHaveCSS('color','rgb(81, 51, 88)');
    const picker = await nativeSelect(page).evaluate(control => {
      const style=getComputedStyle(control,'::picker(select)');
      return {radius:style.borderRadius,padding:style.padding,color:style.color};
    });
    expect(picker).toEqual({radius:'10px',padding:'8px',color:'rgb(81, 51, 88)'});
    await page.keyboard.press('Escape');
  }
});


test('default light and dark densities retain usable option targets and keyboard selection', async ({ page }) => {
  for (const mode of ['light','dark']) for (const density of ['compact','comfortable','spacious']) {
    const theme=resolveTheme({mode,density});
    await page.addStyleTag({content:emitThemeCSS(theme,{selector:':where(#menu-customization)'})});
    await openWithBetaActive(page); await page.mouse.move(0,0);
    const selected=row(page,'Alpha project'), active=row(page,'Beta project');
    await expect(selected).toHaveAttribute('aria-selected','true');
    await expect(active).toHaveAttribute('aria-selected','false');
    await expect(selected.locator('[part~="option-indicator"]')).toHaveCSS('visibility','visible');
    const selectedPaint=await paint(selected), activePaint=await paint(active);
    expect(selectedPaint.height).toBeGreaterThanOrEqual(24);
    expect(activePaint.outlineWidth).toBeGreaterThanOrEqual(2);
    expect(activePaint.outline).toBe('solid');
    expect(activePaint.color).not.toBe(activePaint.background);
    await input(page).press('Escape');
    await expect(input(page)).toHaveValue('Alpha project');
    expect((await accepted(page)).project).toBe('alpha');
  }
});
