import test from 'node:test';
import assert from 'node:assert/strict';
import { colorFromHex, createThemeCompanion, resolveTheme, tokenDocument } from '../dist/index.js';
import { assertCompanionBoundary } from './companion-boundary-support.mjs';

// Independent pinned Astryx defaults: Button.tsx destructive outline and
// Card.tsx 16px border-inclusive inset at d2daa25689f6e7552df17b10194eec4ad34f7575.
// Do not import the presentation registry, candidate definition or its updater.
const button = roles => ({ target: 'button', variant: 'danger', presentation: 'compact', tokens: {}, roles });
const card = roles => ({ target: 'inset-card', presentation: 'inset', tokens: {}, roles });
const focusRole = 'theme.astryx-check.focus';
const insetRole = 'theme.astryx-check.inset';
function fixture(mode = 'light') {
  return resolveTheme({ mode, source: tokenDocument({
    [focusRole]: { $type: 'color', $value: colorFromHex(mode === 'light' ? '#e3193b' : '#f5394f') },
    [insetRole]: { $type: 'dimension', $value: { value: 16, unit: 'px' } },
  }) });
}
function compile(theme, rules) {
  return createThemeCompanion(theme, { schemaVersion: 1, id: 'astryx-defaults', rules }, { name: 'astryx-defaults-review' }).css;
}

test('destructive focus paint reaches both button Parts and native helpers without replacing public focus hooks', () => {
  for (const mode of ['light', 'dark']) {
    const css = compile(fixture(mode), [button({ 'focus-color': focusRole })]);
    const boundary = assertCompanionBoundary(css, 'astryx-defaults-review', mode);
    const color = mode === 'light' ? 'rgb(227 25 59 / 1)' : 'rgb(245 57 79 / 1)';
    const declaration = `outline-color: var(--en-button-focus-color, ${color});`;
    for (const guard of [boundary.descendant, boundary.root]) {
      for (const selector of [
        `:where(en-button[variant="danger"])${guard}::part(control):focus-visible`,
        `:where(en-toggle-button[variant="danger"])${guard}::part(control):focus-visible`,
        `.en-button[data-variant="danger"]:focus-visible${guard}`,
      ]) assert.ok(boundary.rules.some(rule => rule.selector === selector && rule.declarations.trim() === declaration),
        `Expected only the source outline color on ${selector}`);
    }
    const paintStart = css.indexOf('@media (forced-colors: none)');
    assert.ok(paintStart >= 0, 'Source focus paint retains the author-paint guard.');
    let depth = 0, paintEnd = -1;
    for (let index = css.indexOf('{', paintStart); index < css.length; index++) {
      if (css[index] === '{') depth++;
      if (css[index] === '}' && --depth === 0) { paintEnd = index; break; }
    }
    assert.ok(paintEnd > paintStart, 'The author-paint block is complete.');
    assert.doesNotMatch(css.slice(0, paintStart) + css.slice(paintEnd + 1), /outline-color:/,
      'Every source focus declaration is inside the forced-colors exclusion.');
    assert.doesNotMatch(css, /(?:--en-button-focus-color|outline|outline-width|outline-offset|box-shadow|forced-color-adjust):/,
      'Public focus overrides, geometry, halo and system-color ownership remain intact.');
    assert.ok(boundary.rules.every(rule => rule.selector.includes(':focus-visible')),
      'The focus role supplies no resting or pointer-hover paint.');
  }
});

test('default Card inset subtracts its public border width at the final custom and native surfaces', () => {
  for (const mode of ['light', 'dark']) {
    const css = compile(fixture(mode), [card({ paddingInset: insetRole })]);
    const boundary = assertCompanionBoundary(css, 'astryx-defaults-review', mode);
    const declaration = 'padding: var(--en-surface-padding, max(0px, calc(16px - var(--en-border-width))));';
    for (const guard of [boundary.descendant, boundary.root]) {
      for (const selector of [`:where(en-card)${guard}::part(base)`, `.en-card${guard}`]) {
        assert.ok(boundary.rules.some(rule => rule.selector.split(/,\s*/).includes(selector) && rule.declarations.trim() === declaration),
          'Source inset stays nonnegative and existing surface-padding overrides remain authoritative.');
      }
    }
    assert.doesNotMatch(css, /::part\(header\)|\.en-card__header/,
      'A padding-only recipe does not change the authored Card header layout.');
    assert.doesNotMatch(css, /(?:--en-surface-padding|--en-border-width|border-width):/,
      'The fallback consumes public inputs without pinning them or changing the border.');
  }
});

test('omitted optional defaults leave button and Card presentation surfaces untouched', () => {
  const css = compile(fixture(), [button({}), card({})]);
  assert.doesNotMatch(css, /::part\(|\.en-button|\.en-card|outline-color:|padding:/,
    'Empty role maps emit no focus, padding or header-layout declarations.');
});

test('new default roles reject wrong types, unknown roles and unknown token references', () => {
  const theme = fixture();
  for (const [makeRule, role, compatible, wrongType] of [
    [button, 'focus-color', focusRole, insetRole],
    [card, 'paddingInset', insetRole, focusRole],
  ]) {
    for (const roles of [
      { [role]: wrongType },
      { [role]: 'theme.astryx-check.missing' },
      { unsupported: compatible },
      { [role]: '16px' },
      { [role]: { value: 16, unit: 'px' } },
    ]) assert.throws(() => compile(theme, [makeRule(roles)]), { code: 'invalid-companion' });
  }
});
