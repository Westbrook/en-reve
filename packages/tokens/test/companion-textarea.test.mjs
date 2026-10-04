import test from 'node:test';
import assert from 'node:assert/strict';
import { createThemeCompanion, resolveTheme, tokenDocument } from '../dist/index.js';
import { assertCompanionBoundary } from './companion-boundary-support.mjs';

// Source-size values are independently authored so this delivery regression does
// not merely compare generated candidate CSS with the same candidate definition.
const source = tokenDocument({
  'theme.textarea.leading': { $type: 'number', $value: 1.6 },
  'theme.textarea.inset': { $type: 'dimension', $value: { value: 0.45, unit: 'rem' } },
  'theme.textarea.relative-inset': { $type: 'number', $value: 0.45 },
});

test('textarea companions deliver multiline metrics to custom and native public surfaces', () => {
  for (const mode of ['light', 'dark']) {
    const theme = resolveTheme({ mode, source });
    const { css } = createThemeCompanion(theme, {
      schemaVersion: 1, id: 'multiline-delivery', rules: [{
        target: 'textarea', presentation: 'compact',
        tokens: { '--en-font-input-line-height': 'theme.textarea.leading' },
        roles: { 'block-padding-em': 'theme.textarea.relative-inset' },
      }],
    }, { name: 'multiline-review' });

    const boundary = assertCompanionBoundary(css, 'multiline-review', mode);
    for (const guard of [boundary.descendant, boundary.root]) {
      for (const selector of [`:where(en-textarea)${guard}`, `:where(.en-textarea)${guard}`]) {
        assert.ok(boundary.rules.some(rule => rule.selector.includes(selector) && rule.declarations.includes('--en-font-input-line-height: 1.6;')),
          'Both public targets receive the same low-specificity typography default.');
      }
      for (const selector of [`:where(en-textarea)${guard}::part(control)`, `.en-textarea${guard}`]) {
        assert.ok(boundary.rules.some(rule => rule.selector.includes(selector) && rule.declarations.includes('padding-block: 0.45em; scroll-padding-block-end: 0.45em;')),
          'Custom control Parts and native textarea surfaces receive the multiline padding directly.');
      }
    }
    assert.doesNotMatch(css, /\.en-textarea[^{}]*::part\(/);
    assert.doesNotMatch(css, /:where\((?:en-text-field|\.en-input)\)/,
      'The multiline refinement does not change single-line controls.');
  }
});

test('relative textarea padding is optional and dimension recipes retain their contract', () => {
  const theme = resolveTheme({ source });
  const compile = roles => createThemeCompanion(theme, {
    schemaVersion: 1, id: 'multiline-padding', rules: [{
      target: 'textarea', presentation: 'compact', tokens: {}, roles,
    }],
  }).css;
  const dimension = compile({ 'block-padding': 'theme.textarea.inset' });
  assert.match(dimension, /padding-block: 0\.45rem; scroll-padding-block-end: 0\.45rem;/);
  assert.doesNotMatch(dimension, /0\.45em/);
  assert.doesNotMatch(compile({}), /(?:padding-block|scroll-padding-block-end):/,
    'Omitting either role leaves ordinary component padding intact.');
  assert.throws(() => compile({ 'block-padding-em': 'theme.textarea.inset' }), { code: 'invalid-companion' },
    'Relative padding accepts a typed number, not an arbitrary CSS dimension.');
});
