import test from 'node:test';
import assert from 'node:assert/strict';
import { colorFromHex, createThemeCompanion, resolveTheme, tokenDocument } from '../dist/index.js';
import { assertCompanionBoundary } from './companion-boundary-support.mjs';

// Independently authored from Web Awesome 3.13.0 rating/icon source: s/m/l use
// 14/16/20px; the icon canvas is 1.25em by 1em; gap and padding are .125em.
// No updater, candidate definition or generated catalogue supplies expectations.
const metrics = {
  glyphSize: [14, 16, 20],
  glyphInlineSize: [17.5, 20, 25],
  glyphBlockSize: [14, 16, 20],
  gap: [1.75, 2, 2.5],
  padding: [1.75, 2, 2.5],
  targetSize: [21, 24, 30],
};
const roles = {
  'filled-color': 'theme.rating.filled',
  'disabled-filled-color': 'theme.rating.filled',
  'empty-color': 'theme.rating.empty',
  'disabled-opacity': 'theme.rating.disabled-opacity',
  'pressed-background': 'theme.rating.pressed-background',
  'pressed-scale': 'theme.rating.pressed-scale',
  'pressed-offset': 'theme.rating.pressed-offset',
  'pressed-shadow': 'shadow.none',
};
const dimensions = {};
for (const [stem, values] of Object.entries(metrics)) {
  for (const [index, size] of ['Small', 'Medium', 'Large'].entries()) {
    // Companion roles use camelCase; source token segments use kebab-case.
    const id = `theme.rating.${stem.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}-${size.toLowerCase()}`;
    dimensions[id] = {$type: 'dimension', $value: {value: values[index], unit: 'px'}};
    roles[stem + size] = id;
  }
}

function themeFor(mode = 'light') {
  return resolveTheme({mode, source: tokenDocument({
    ...dimensions,
    'theme.rating.filled': {$type: 'color', $value: colorFromHex('#ef9d00')},
    'theme.rating.empty': {$type: 'color', $value: colorFromHex(mode === 'light' ? '#545868' : '#9194a2')},
    'theme.rating.disabled-opacity': {$type: 'number', $value: .5},
    'theme.rating.pressed-background': {$type: 'color', $value: {...colorFromHex('#000000'), alpha: 0}},
    'theme.rating.pressed-scale': {$type: 'number', $value: 1},
    'theme.rating.pressed-offset': {$type: 'dimension', $value: {value: 0, unit: 'px'}},
  })});
}

function compile(mode = 'light', selectedRoles = roles) {
  return createThemeCompanion(themeFor(mode), {
    schemaVersion: 1, id: 'web-awesome-rating-source', rules: [{
      target: 'rating', presentation: 'compact', tokens: {}, roles: selectedRoles,
    }],
  }, {name: 'rating-review'}).css;
}

// Inspect the compiler's leaf rules without depending on whitespace or
// declaration order; native and custom selectors are emitted separately.
function rulesOf(css) {
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({
    selector: selector.trim(),
    declarations: Object.fromEntries(body.split(';').map(entry => entry.trim()).filter(Boolean).map(entry => {
      const separator = entry.indexOf(':');
      return [entry.slice(0, separator).trim(), entry.slice(separator + 1).trim()];
    })),
  }));
}

function surfaceRules(css, surface, native) {
  return rulesOf(css).filter(({selector}) => {
    if (!native) return selector.includes(`::part(${surface})`);
    if (selector.includes('::part(') || !selector.includes('.en-rating')) return false;
    // The disabled :has() predicate also names child classes. Inspect only the
    // final public surface so its state predicate cannot be mistaken for paint.
    const className = surface === 'star-option' ? 'en-rating-item' : surface === 'star-options' ? 'en-rating-values' : 'en-rating-star';
    const tail = selector.match(new RegExp(`\\.${className}(?![\\w-])[^>]*$`))?.[0];
    return Boolean(tail && (surface !== 'star-filled' || tail.includes('[data-filled]')));
  });
}

function assertDeclaration(css, surface, native, property, expected) {
  const values = surfaceRules(css, surface, native).map(rule => rule.declarations[property]).filter(value => value !== undefined);
  assert.ok(values.includes(expected), `${native ? 'Native' : 'Custom'} ${surface} must receive ${property}: ${expected}; got ${JSON.stringify(values)}`);
}

const glyph = 'calc(14px * var(--_en-size-small, 0) + 16px * var(--_en-size-medium, 1) + 20px * var(--_en-size-large, 0))';
const canvas = 'calc(17.5px * var(--_en-size-small, 0) + 20px * var(--_en-size-medium, 1) + 25px * var(--_en-size-large, 0))';
const spacing = 'calc(1.75px * var(--_en-size-small, 0) + 2px * var(--_en-size-medium, 1) + 2.5px * var(--_en-size-large, 0))';
const target = 'max(var(--en-size-target-min), calc(21px * var(--_en-size-small, 0) + 24px * var(--_en-size-medium, 1) + 30px * var(--_en-size-large, 0)))';

test('Web Awesome rating source geometry reaches native and custom positive stars with inherited size selection', () => {
  for (const mode of ['light', 'dark']) {
    const css = compile(mode);
    assertCompanionBoundary(css, 'rating-review', mode);
    for (const native of [false, true]) {
      assertDeclaration(css, 'star', native, 'font-size', glyph);
      assertDeclaration(css, 'star', native, 'inline-size', canvas);
      assertDeclaration(css, 'star', native, 'block-size', glyph);
      assertDeclaration(css, 'star-options', native, 'gap', spacing);
      assertDeclaration(css, 'star-option', native, 'padding', spacing);
      assertDeclaration(css, 'star-option', native, 'inline-size', target);
      assertDeclaration(css, 'star-option', native, 'block-size', target);
    }
    assert.match(css, /@media \(any-pointer: coarse\)/);
    assert.match(css, /min-inline-size:[^;]*var\(--en-size-target-touch\)/);
    assert.match(css, /min-block-size:[^;]*var\(--en-size-target-touch\)/);
    assert.doesNotMatch(css, /\[(?:data-)?size=/,
      'Shared size selection includes default and inherit; the recipe must not depend on explicit host size attributes.');
    assert.doesNotMatch(css, /::part\((?:option|clear-option|control)\)|\.en-rating-clear/,
      'Positive-star refinements leave the clear choice and native input presentation alone.');
    assert.ok(rulesOf(css).every(({selector}) => !selector.includes('.en-rating') || !selector.includes('::part(')),
      'Native helpers receive their own direct-child surfaces, never shadow Parts.');
    for (const {selector} of rulesOf(css).filter(rule => rule.selector.includes('.en-rating'))) {
      assert.doesNotMatch(selector, /> \.en-rating-(?:values|item|star|input)(?![\w-]|:not\(\[data-en-theme\]\))/,
        'Every native child surface preserves a newly declared full-theme boundary.');
    }
  }
});

test('Web Awesome rating gold, quiet press and disabled fade are guarded paint on positive stars only', () => {
  for (const mode of ['light', 'dark']) {
    const css = compile(mode);
    const paintStart = css.indexOf('@media (forced-colors: none)');
    assert.ok(paintStart >= 0, 'Source paint must leave forced colors authoritative.');
    const paint = css.slice(paintStart);
    assert.doesNotMatch(css.slice(0, paintStart), /--en-color-action-text:|--en-color-text-muted:|opacity:|--_en-source-rating-pressed-background:|--_en-source-rating-pressed-shadow:/);
    for (const native of [false, true]) {
      assertDeclaration(paint, 'star', native, '--en-color-action-text', 'rgb(239 157 0 / 1)');
      assertDeclaration(paint, 'star', native, '--en-color-text-muted', mode === 'light' ? 'rgb(84 88 104 / 1)' : 'rgb(145 148 162 / 1)');
      assertDeclaration(paint, 'star-option', native, '--_en-source-rating-pressed-background', 'rgb(0 0 0 / 0)');
      assertDeclaration(css, 'star-option', native, '--_en-source-rating-pressed-scale', '1');
      assertDeclaration(css, 'star-option', native, '--_en-source-rating-pressed-offset', '0px');
      assertDeclaration(paint, 'star-option', native, '--_en-source-rating-pressed-shadow', '0px 0px 0px 0px rgb(0 0 0 / 0)');
      assertDeclaration(paint, 'star-filled', native, '--en-color-text-muted', 'rgb(239 157 0 / 1)');
      const disabledFilled = surfaceRules(paint, 'star-filled', native);
      assert.ok(disabledFilled.every(({selector}) => selector.includes(':disabled')),
        'The semantic filled-state surface preserves source gold when effectively disabled.');
      const disabled = surfaceRules(paint, 'star-options', native).filter(({declarations}) => declarations.opacity === '0.5');
      assert.ok(disabled.length > 0, 'Disabled opacity must affect the visible positive-star row.');
      assert.ok(disabled.every(({selector}) => selector.includes(':disabled')),
        'Effective form disability must work without a reflected disabled attribute.');
    }
    assert.doesNotMatch(paint, /::part\((?:option|clear-option|control)\)|\.en-rating-clear/);
    assert.doesNotMatch(css, /--en-rating-pressed-(?:background|scale|offset|shadow):/,
      'Source defaults leave the existing public press hooks available to local author overrides.');
    assert.doesNotMatch(css, /outline(?:-width|-style)?:\s*(?:none|0)(?:;|\s)|forced-color-adjust:\s*none/,
      'This source presentation does not replace native keyboard focus or system-color ownership.');
  }
});

test('rating geometry and state roles are optional and retain the compact presentation fallback', () => {
  const css = compile('light', {'filled-color': roles['filled-color'], 'empty-color': roles['empty-color']});
  for (const native of [false, true]) {
    assertDeclaration(css, 'star-options', native, 'gap', '0');
    assertDeclaration(css, 'star-option', native, 'inline-size', 'auto');
    assertDeclaration(css, 'star-option', native, 'block-size', 'auto');
    assertDeclaration(css, 'star-option', native, 'padding', '0');
  }
  assert.doesNotMatch(css, /font-size:|--_en-size-small|opacity:|--_en-source-rating-pressed-|::part\(star-filled\)|\.en-rating-star[^{}]*\[data-filled\]/,
    'Omitted new roles do not manufacture source dimensions, fading or press overrides.');
});

test('rating source geometry and state roles reject incompatible token types', () => {
  for (const role of Object.keys(roles)) {
    const wrongType = role === 'filled-color' || role === 'disabled-filled-color' || role === 'empty-color' || role === 'pressed-background'
      ? roles.glyphSizeMedium
      : 'theme.rating.filled';
    assert.throws(() => compile('light', {[role]: wrongType}), {code: 'invalid-companion'},
      `${role} must reject an incompatible token type.`);
  }
  assert.throws(() => compile('light', {glyphSizeMedium: 'theme.rating.missing'}), {code: 'invalid-companion'});
  assert.throws(() => compile('light', {selector: roles.glyphSizeMedium}), {code: 'invalid-companion'});
});
