import test from 'node:test';
import assert from 'node:assert/strict';
import { colorFromHex, createThemeCompanion, resolveTheme, tokenDocument } from '../dist/index.js';
import { assertCompanionBoundary } from './companion-boundary-support.mjs';

// Independent recipe values exercise the public compiler, including generic
// recipes that omit the hover source role. Bundled Fluent theme pins are not
// an input to this override contract.
const source = tokenDocument({
  'theme.field-check.rest': { $type: 'color', $value: colorFromHex('#112233') },
  'theme.field-check.hover': { $type: 'color', $value: colorFromHex('#445566') },
});
const theme = resolveTheme({ source });
const targets = ['fluent-field', 'fluent-number-field'];
const both = { bottom: 'theme.field-check.rest', 'bottom-hover': 'theme.field-check.hover' };
const restColor = 'rgb(17 34 51 / 1)', hoverColor = 'rgb(68 85 102 / 1)';
const invalidPaint = 'var(--en-input-invalid-border-color, var(--en-color-danger-text))';
const compile = (target, roles) => createThemeCompanion(theme, {
  schemaVersion: 1, id: 'fluent-field-hooks',
  rules: [{ target, presentation: 'bottom-edge', tokens: {}, roles }],
}, { name: 'fluent-field-hooks' }).css;

function edgeRules(css) {
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].flatMap(([, selector, declarations]) => {
    const value = declarations.match(/border-block-end-color:\s*([^;]+);/)?.[1];
    return value ? [{ selector: selector.trim(), value }] : [];
  });
}
const isInvalid = rule => /::part\([^)]*-invalid\)/.test(rule.selector);

function assertSurfaces(rules, target) {
  const compound = target === 'fluent-number-field';
  assert.ok(rules.some(rule => rule.selector.includes(`::part(${compound ? 'stepper' : 'control'})`)),
    'Source edge paint reaches the public custom field frame.');
  for (const native of compound ? ['.en-number-group'] : ['.en-input', '.en-textarea', '.en-select']) {
    assert.ok(rules.some(rule => rule.selector.startsWith(native)), `Source edge paint reaches ${native}.`);
  }
  if (!compound) assert.ok(rules.some(rule => rule.selector.includes('::part(focus-frame)')),
    'An adorned field uses its exposed outer frame.');
}

test('generic Fluent source roles defer to inherited bottom hooks even when the hover role is omitted', () => {
  for (const target of targets) {
    for (const [roles, expectedRest, expectedHover] of [
      [both, restColor, hoverColor],
      [{ bottom: both.bottom }, restColor, restColor],
      [{ 'bottom-hover': both['bottom-hover'] }, undefined, hoverColor],
    ]) {
      const css = compile(target, roles);
      assertCompanionBoundary(css, 'fluent-field-hooks', 'light');
      const ordinary = edgeRules(css).filter(rule => !isInvalid(rule));
      const rest = ordinary.filter(rule => !rule.selector.includes(':hover'));
      const hover = ordinary.filter(rule => rule.selector.includes(':hover'));
      if (expectedRest) {
        assertSurfaces(rest, target);
        for (const rule of rest) assert.equal(rule.value, `var(--en-input-bottom-border-color, ${expectedRest})`);
      } else assert.equal(rest.length, 0, 'A hover-only recipe adds no resting bottom paint.');
      assertSurfaces(hover, target);
      for (const rule of hover) assert.equal(rule.value,
        `var(--en-input-hover-bottom-border-color, var(--en-input-bottom-border-color, ${expectedHover}))`,
        'An explicit hover hook wins; otherwise the rest hook precedes the optional source fallback.');
      assert.doesNotMatch(css, /--en-input-(?:hover-)?bottom-border-color\s*:/,
        'A presentation consumes public overrides without assigning over inherited values.');
    }
  }
});

test('omitted Fluent bottom roles invent no ordinary edge paint and preserve the owned invalid contour', () => {
  for (const target of targets) {
    const css = compile(target, { perimeter: both.bottom });
    const rules = edgeRules(css);
    assert.ok(rules.length > 0, 'The existing invalid Part contour remains present.');
    assert.ok(rules.every(isInvalid), 'A perimeter-only recipe emits no ordinary rest or hover bottom paint.');
    for (const rule of rules) assert.equal(rule.value, invalidPaint);
    assert.ok(rules.some(rule => rule.selector.includes(':hover')), 'Invalid hover retains danger paint.');
    assert.doesNotMatch(css, /--en-input-(?:hover-)?bottom-border-color/);
  }
});

test('Fluent hook delivery preserves visible invalid states, primary-control guards and forced colors', () => {
  for (const target of targets) {
    const css = compile(target, both), rules = edgeRules(css);
    const invalid = rules.filter(isInvalid);
    assert.ok(invalid.length > 0 && invalid.some(rule => rule.selector.includes(':hover')));
    for (const rule of invalid) {
      assert.equal(rule.value, invalidPaint,
        'Ordinary rest and hover hooks cannot replace the visible invalid contour.');
      const ordinaryIndex = rules.findIndex(candidate => candidate.selector === rule.selector.replace('-invalid)', ')'));
      assert.ok(ordinaryIndex >= 0 && ordinaryIndex < rules.indexOf(rule),
        'The additive invalid Part follows matching rest or hover paint at equal specificity.');
    }
    for (const rule of rules.filter(rule => rule.selector.includes('::part('))) {
      assert.ok(rule.selector.includes(':not(:disabled):not([aria-disabled="true"])'),
        'Disabled custom hosts remain outside generic source paint.');
    }
    const native = rules.filter(rule => !rule.selector.includes('::part('));
    assert.ok(native.length > 0);
    for (const rule of native) {
      if (target === 'fluent-number-field') {
        assert.ok(rule.selector.includes(':not([data-invalid]):not([aria-invalid="true"]):not([aria-disabled="true"])'));
        assert.ok(rule.selector.includes(':has(> .en-number-input:enabled:not([aria-disabled="true"]):not([aria-invalid="true"]):not(:user-invalid))'),
          'A disabled auxiliary step button cannot suppress an enabled primary input.');
        assert.ok(!rule.selector.includes(':not(:has(:disabled))'));
      } else assert.ok(rule.selector.includes(':enabled:not([aria-disabled="true"]):not([aria-invalid="true"]):not(:user-invalid)'),
        'Native source paint excludes disabled and visibly invalid controls.');
    }
    assert.doesNotMatch(css, /:invalid\b/, 'Pristine required controls retain normal source paint.');
    const paintStart = css.indexOf('@media (forced-colors: none)');
    assert.ok(paintStart >= 0);
    let depth = 0, paintEnd = -1;
    for (let index = css.indexOf('{', paintStart); index < css.length; index++) {
      if (css[index] === '{') depth++;
      if (css[index] === '}' && --depth === 0) { paintEnd = index; break; }
    }
    assert.ok(paintEnd > paintStart, 'The author-paint wrapper closes.');
    assert.doesNotMatch(css.slice(0, paintStart) + css.slice(paintEnd + 1), /border-block-end-color:/,
      'Every source edge declaration yields to core system colors.');
    assert.doesNotMatch(css, /(?:outline|box-shadow|border-width|padding|forced-color-adjust):|::after/,
      'The new color hooks leave focus decoration and field geometry with their existing owners.');
  }
});
