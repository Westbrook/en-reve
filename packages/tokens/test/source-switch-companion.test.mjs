import test from 'node:test';
import assert from 'node:assert/strict';
import { colorFromHex, createThemeCompanion, resolveTheme, tokenDocument } from '../dist/index.js';
import { assertCompanionBoundary } from './companion-boundary-support.mjs';

// Independent Spectrum 2 @react-spectrum/s2 1.7.1 source values:
// src/Switch.tsx:142–177; dist/private/Switch.mjs:218–266 and
// dist/private/Switch.css:212–217,260–273. baseColor() advances one palette
// stop for hover, keyboard focus and press. The selected thumb stays gray-25.
const palette = {
  light: { surface: '#ffffff', rest: '#292929', interaction: '#131313', disabled: '#c6c6c6' },
  dark: { surface: '#111111', rest: '#dbdbdb', interaction: '#f2f2f2', disabled: '#444444' },
};
const rgb = hex => `rgb(${[1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16)).join(' ')} / 1)`;
const roleTokens = {
  background: 'surface', borderColor: 'rest', checkedBackground: 'rest', checkedBorderColor: 'transparent',
  thumbBackground: 'rest', checkedThumbBackground: 'surface',
  hoverBackground: 'surface', hoverBorderColor: 'interaction', hoverCheckedBackground: 'interaction', hoverCheckedBorderColor: 'transparent',
  hoverThumbBackground: 'interaction', hoverCheckedThumbBackground: 'surface',
  focusBackground: 'surface', focusBorderColor: 'interaction', focusCheckedBackground: 'interaction', focusCheckedBorderColor: 'transparent',
  focusThumbBackground: 'interaction', focusCheckedThumbBackground: 'surface',
  pressedBackground: 'surface', pressedBorderColor: 'interaction', pressedCheckedBackground: 'interaction', pressedCheckedBorderColor: 'transparent',
  pressedThumbBackground: 'interaction', pressedCheckedThumbBackground: 'surface',
  disabledBackground: 'surface', disabledBorderColor: 'disabled', disabledThumbBackground: 'disabled',
  disabledCheckedBackground: 'disabled', disabledCheckedBorderColor: 'transparent', disabledCheckedThumbBackground: 'surface',
};

function compile(mode = 'light', selectedRoles = roleTokens) {
  const source = tokenDocument(Object.fromEntries([
    ...Object.entries(palette[mode]).map(([name, hex]) => [`theme.switch.${name}`, { $type: 'color', $value: colorFromHex(hex) }]),
    ['theme.switch.transparent', { $type: 'color', $value: { ...colorFromHex('#000000'), alpha: 0 } }],
  ]));
  return createThemeCompanion(resolveTheme({ mode, source }), {
    schemaVersion: 1, id: 'source-switch', rules: [{ target: 'stateful-switch', presentation: 'stateful', tokens: {},
      roles: Object.fromEntries(Object.entries(selectedRoles).map(([role, name]) => [role, name.startsWith('theme.') || name.startsWith('space.') ? name : `theme.switch.${name}`])),
    }],
  }, { name: 'source-switch-review' }).css;
}

function rules(css) {
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({
    selector: selector.trim(),
    declarations: Object.fromEntries(body.split(';').map(entry => entry.trim()).filter(Boolean).map(entry => {
      const colon = entry.indexOf(':');
      return [entry.slice(0, colon).trim(), entry.slice(colon + 1).trim()];
    })),
  }));
}

function assertPaint(css, selector, expected) {
  assert.ok(rules(css).some(rule => rule.selector.includes(selector)
    && Object.entries(expected).every(([property, value]) => rule.declarations[property] === value)),
  `Expected ${selector} with ${JSON.stringify(expected)}`);
}

const guard = ':not(:where([data-en-theme]))';
const custom = `:where(en-switch):not(:disabled):not([aria-disabled="true"])${guard}::part(control):enabled`;
const native = '.en-switch:not([aria-disabled="true"]):enabled';

test('Spectrum switch source colors reach normal and selected controls in both appearances', () => {
  for (const mode of ['light', 'dark']) {
    const css = compile(mode), colors = palette[mode];
    assertCompanionBoundary(css, 'source-switch-review', mode);
    for (const selector of [custom, `${native}${guard}`]) {
      assertPaint(css, selector, { background: rgb(colors.surface), 'border-color': rgb(colors.rest) });
    }
    for (const selector of [`${custom}:checked`, `${native}:checked${guard}`]) {
      assertPaint(css, selector, { background: rgb(colors.rest), 'border-color': 'rgb(0 0 0 / 0)' });
    }
    assertPaint(css, `${custom}::before`, { background: rgb(colors.rest) });
    assertPaint(css, `${custom}:checked::before`, { background: rgb(colors.surface) });
  }
});

test('hover, keyboard focus and press change the source rim, off thumb and selected fill without recoloring the selected thumb', () => {
  for (const mode of ['light', 'dark']) {
    const css = compile(mode), colors = palette[mode];
    for (const state of [':hover', ':focus-visible', ':active']) {
      const nativeState = state === ':focus-visible'
        ? ':is(:focus-visible, .en-choice > .en-switch:focus-visible)'
        : `:is(${state}, .en-choice${state} > .en-switch)`;
      const rim = state === ':active' ? `var(--en-switch-pressed-border-color, ${rgb(colors.interaction)})` : rgb(colors.interaction);
      const selectedRim = state === ':active' ? 'var(--en-switch-pressed-border-color, rgb(0 0 0 / 0))' : 'rgb(0 0 0 / 0)';
      for (const selector of [`${custom}${state}`, `${native}${nativeState}${guard}`]) {
        assertPaint(css, selector, { background: rgb(colors.surface), 'border-color': rim });
      }
      for (const selector of [`${custom}${state}:checked`, `${native}${nativeState}:checked${guard}`]) {
        assertPaint(css, selector, { background: rgb(colors.interaction), 'border-color': selectedRim });
      }
      assertPaint(css, `${custom}${state}::before`, { background: rgb(colors.interaction) });
      assertPaint(css, `${native}${nativeState}${guard}::before`, { background: rgb(colors.interaction) });
      assertPaint(css, `${custom}${state}:checked::before`, { background: rgb(colors.surface) });
      assertPaint(css, `${native}${nativeState}:checked${guard}::before`, { background: rgb(colors.surface) });
      if (state !== ':focus-visible') {
        const host = `:where(en-switch):not(:disabled):not([aria-disabled="true"])${state}${guard}::part(control):enabled`;
        assertPaint(css, host, { 'border-color': rim });
        assertPaint(css, `${host}:checked`, { background: rgb(colors.interaction), 'border-color': selectedRim });
      }
    }
    assert.doesNotMatch(css, /:focus-within|--en-switch-pressed-border-color\s*:/,
      'Keyboard paint follows the focused input, and the public held-border hook remains an override.');
  }
});

test('source disabled switch paint retains its distinct off and selected thumb while interaction remains enabled-only', () => {
  for (const mode of ['light', 'dark']) {
    const css = compile(mode), colors = palette[mode];
    const disabledCustom = `:where(en-switch)${guard}::part(control):disabled`;
    const disabledNative = '.en-switch:is(:disabled, [aria-disabled="true"])';
    const ariaHost = `:where(en-switch)[aria-disabled="true"]${guard}::part(control)`;
    for (const selector of [disabledCustom, `${disabledNative}${guard}`, ariaHost]) {
      assertPaint(css, selector, { background: rgb(colors.surface), 'border-color': rgb(colors.disabled) });
    }
    for (const selector of [`${disabledCustom}:checked`, `${disabledNative}:checked${guard}`, `${ariaHost}:checked`]) {
      assertPaint(css, selector, { background: rgb(colors.disabled), 'border-color': 'rgb(0 0 0 / 0)' });
    }
    assertPaint(css, `${disabledCustom}::before`, { background: rgb(colors.disabled) });
    assertPaint(css, `${disabledCustom}:checked::before`, { background: rgb(colors.surface) });
    const ariaHeld = '.en-switch[aria-disabled="true"]:enabled:is(:active, .en-choice:active > .en-switch)';
    assertPaint(css, `${ariaHeld}${guard}`, { background: rgb(colors.surface), 'border-color': rgb(colors.disabled) });
    assertPaint(css, `${ariaHeld}:checked${guard}`, { background: rgb(colors.disabled), 'border-color': 'rgb(0 0 0 / 0)' });
    assertPaint(css, `${ariaHeld}${guard}::before`, { background: rgb(colors.disabled) });
    assertPaint(css, `${ariaHeld}:checked${guard}::before`, { background: rgb(colors.surface) });
    for (const rule of rules(css).filter(rule => Object.hasOwn(rule.declarations, 'background') || Object.hasOwn(rule.declarations, 'border-color'))) {
      if (!rule.selector.includes(ariaHeld) && (rule.selector.includes(':hover') || rule.selector.includes(':focus-visible') || rule.selector.includes(':active'))) {
        assert.ok(rule.selector.includes('.en-switch:not([aria-disabled="true"]):enabled'));
        if (rule.selector.includes('::part(control)')) assert.ok(rule.selector.includes(':not(:disabled):not([aria-disabled="true"])'));
      }
    }
    assert.match(css, /@media \(forced-colors: none\)[\s\S]*background:/);
    assert.doesNotMatch(css.slice(css.indexOf('@media (forced-colors: active)')), /(?:background|border-color):|outline:|forced-color-adjust:/,
      'Shared system colors and focus geometry remain authoritative.');
  }
});

test('omitted switch state roles add no focus paint and preserve shared disabled fallback', () => {
  const css = compile('light', { background: 'surface', checkedBackground: 'rest', disabledBackground: 'disabled', disabledThumbBackground: 'disabled' });
  assert.doesNotMatch(css, /:focus-visible|--en-switch-pressed-border-color/);
  assertPaint(css, `:where(en-switch)${guard}::part(control):disabled:checked`, { background: rgb(palette.light.disabled) });
  assertPaint(css, `:where(en-switch)${guard}::part(control):disabled:checked::before`, { background: rgb(palette.light.disabled) });
  for (const role of ['hoverBorderColor', 'hoverCheckedBorderColor', 'focusBackground', 'focusCheckedBackground', 'focusBorderColor', 'focusCheckedBorderColor', 'focusThumbBackground', 'focusCheckedThumbBackground', 'pressedBorderColor', 'pressedCheckedBorderColor', 'disabledCheckedBackground', 'disabledCheckedBorderColor', 'disabledCheckedThumbBackground']) {
    assert.throws(() => compile('light', { [role]: 'space.2' }), { code: 'invalid-companion' });
  }
});
