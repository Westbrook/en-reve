import test from 'node:test';
import assert from 'node:assert/strict';
import { colorFromHex, createThemeCompanion, resolveTheme, tokenDocument } from '../dist/index.js';
import { assertCompanionBoundary } from './companion-boundary-support.mjs';

const recipe = roles => ({ schemaVersion: 1, id: 'avatar-source-profile', rules: [{
  target: 'avatar', presentation: 'avatar-subtle', tokens: {}, roles,
}] });

test('avatar source initials follow actual diameter on custom and native public surfaces', () => {
  // Pinned WA3.13 avatar.styles.ts uses --size * .4, regular inherited type,
  // neutral-fill-normal and neutral-on-normal. These are independent literals.
  for (const [mode, background, color, expectedPaint] of [
    ['light', '#e4e5e9', '#424554', 'background: rgb(228 229 233 / 1); color: rgb(66 69 84 / 1);'],
    ['dark', '#2f323f', '#abaeb9', 'background: rgb(47 50 63 / 1); color: rgb(171 174 185 / 1);'],
  ]) {
    const theme = resolveTheme({ mode, source: tokenDocument({
      'theme.avatar.background': { $type: 'color', $value: colorFromHex(background) },
      'theme.avatar.color': { $type: 'color', $value: colorFromHex(color) },
      'theme.avatar.ratio': { $type: 'number', $value: 0.4 },
      'theme.avatar.weight': { $type: 'fontWeight', $value: 400 },
    }) });
    const { css } = createThemeCompanion(theme, recipe({
      background: 'theme.avatar.background', color: 'theme.avatar.color',
      'diameter-font-scale': 'theme.avatar.ratio', 'font-weight': 'theme.avatar.weight',
    }));
    const boundary = assertCompanionBoundary(css, theme.name, mode);
    const formula = 'font-size: calc(var(--en-avatar-size, var(--_en-sized-size-avatar, var(--en-size-avatar))) * 0.4);';
    assert.ok(css.includes(formula), 'Initials use the same selected diameter and public size override as the frame.');
    for (const guard of [boundary.descendant, boundary.root]) {
      for (const selector of [
        `:where(en-avatar)${guard}::part(fallback)`,
        `.en-avatar > .en-avatar__fallback:not([data-en-theme])${guard}`,
      ]) assert.ok(boundary.rules.some(rule => rule.selector.includes(selector) && rule.declarations.includes(formula)),
        'Custom and native fallback text receive the diameter ratio through guarded public surfaces.');
    }
    assert.match(css, /font-weight: 400; line-height: 1; text-transform: uppercase;/);
    assert.ok(css.includes(expectedPaint));
    assert.match(css, /@media \(forced-colors: none\)/, 'System-color avatar paint stays component-owned.');
    assert.doesNotMatch(css, /(?:inline-size|block-size|border-radius|content):/,
      'The presentation does not replace frame hooks, fallback content or image behavior.');
  }
});

test('avatar text-relative recipes remain compatible when the diameter ratio is omitted', () => {
  const theme = resolveTheme({ source: tokenDocument({
    'theme.avatar.scale': { $type: 'number', $value: 1.2 },
  }) });
  const { css } = createThemeCompanion(theme, recipe({ 'font-scale': 'theme.avatar.scale' }));
  assert.match(css, /font-size: calc\(1em \* 1\.2\);/);
  assert.doesNotMatch(css, /--en-avatar-size/);
});
