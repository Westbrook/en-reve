import test from 'node:test';
import assert from 'node:assert/strict';
import { createThemeCompanion, resolveTheme } from '../dist/index.js';
import { assertCompanionBoundary } from './companion-boundary-support.mjs';

test('Spectrum static tab schema composes public states and nested-theme boundaries', () => {
  const theme = resolveTheme();
  const { css } = createThemeCompanion(theme, { schemaVersion: 1, id: 'spectrum-static-tabs', rules: [
    { target: 'spectrum-tabs', presentation: 'static-line', tokens: {}, roles: { horizontalGap: 'space.8', verticalGap: 'space.0', verticalInsetStart: 'space.3', verticalInsetEnd: 'space.5' } },
    { target: 'spectrum-tab', presentation: 'static-line', tokens: {}, roles: {
      minBlockSize: 'space.12', inlinePadding: 'space.0', blockPadding: 'space.0', disabledColor: 'color.text-muted', disabledIndicatorColor: 'color.surface-subtle',
      indicatorSize: 'size.tab-indicator', indicatorRadius: 'radius.pill', indicatorColor: 'color.text',
      restColor: 'color.text-muted', interactionColor: 'color.text', selectedColor: 'color.text', selectedInteractionColor: 'color.action-text',
    } },
    { target: 'spectrum-vertical-tab', presentation: 'static-line', tokens: {}, roles: { indicatorSize: 'size.tab-indicator', indicatorOffset: 'space.3' } },
  ] });
  assertCompanionBoundary(css, theme.name, theme.mode);
  for (const hook of ['background', 'color', 'selected-background', 'selected-color', 'hover-background', 'hover-color', 'pressed-background', 'pressed-color', 'indicator-color']) {
    assert.ok(css.includes(`var(--en-tab-${hook},`), `${hook} is consumed at the public paint surface`);
  }
  assert.ok(css.includes(':not([orientation="vertical"])::part(tab-list)') || css.includes(':not([orientation="vertical"]):not(:where([data-en-theme]))::part(tab-list)'));
  for (const attribute of ['aria-orientation', 'data-orientation']) assert.ok(css.includes(`[${attribute}="vertical"]`));
  assert.match(css, /\[aria-selected="true"\]:not\(:where\(\[data-en-theme\]\)\)::part\(base\)::after/);
  assert.match(css, /\.en-tab\.en-tab:not\(\[aria-disabled="true"\]\):not\(\[disabled\]\)\[aria-selected="true"\]:active/);
  assert.match(css, /:focus-visible/);
  assert.doesNotMatch(css, /:focus-within|outline:|box-shadow:|transform:/);
  assert.match(css, /@media \(hover: hover\)/);
  assert.match(css, /@media \(forced-colors: none\)/);
});
