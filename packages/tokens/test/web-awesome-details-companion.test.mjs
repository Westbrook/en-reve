import test from 'node:test';
import assert from 'node:assert/strict';
import { createThemeCompanion, resolveTheme, tokenDocument } from '../dist/index.js';
import { assertCompanionBoundary } from './companion-boundary-support.mjs';

// Independent Web Awesome 3.13.0 source values: chunk.W62SLQ7P.js:14–20,
// 60–66, 97–110, 122–128; themes/default.css:196,208,219,232,247,256.
// These literals do not import the candidate updater or generated definition.
const dim = value => ({ $type: 'dimension', $value: { value, unit: 'rem' } });
const source = tokenDocument({
  'theme.details.border': dim(.0625), 'theme.details.radius': dim(.75),
  'theme.details.padding': dim(1), 'theme.details.font': dim(1),
  'theme.details.leading': { $type: 'number', $value: 1.6 },
  'theme.details.weight': { $type: 'fontWeight', $value: 400 },
  'theme.details.disabled': { $type: 'number', $value: .5 },
  'theme.details.icon-inline': dim(1.25), 'theme.details.icon-block': dim(1),
  // The finite local chevron is an explicit asset adaptation, not a source metric.
  'theme.details.mark': dim(.375), 'theme.details.stroke': dim(.125),
  'theme.details.duration': { $type: 'duration', $value: { value: 150, unit: 'ms' } },
});
const binding = {
  borderWidth: 'theme.details.border', radius: 'theme.details.radius',
  padding: 'theme.details.padding', gap: 'theme.details.padding',
  fontSize: 'theme.details.font', lineHeight: 'theme.details.leading', weight: 'theme.details.weight',
  disabledOpacity: 'theme.details.disabled', background: 'color.surface', borderColor: 'color.line',
  color: 'color.text', indicatorColor: 'color.text-muted',
  indicatorInlineSize: 'theme.details.icon-inline', indicatorBlockSize: 'theme.details.icon-block',
  indicatorMarkSize: 'theme.details.mark', indicatorStroke: 'theme.details.stroke',
  indicatorDuration: 'theme.details.duration',
};
function compile(roles = binding, mode = 'light') {
  return createThemeCompanion(resolveTheme({ source, mode }), {
    schemaVersion: 1, id: 'source-details-check',
    rules: [{ target: 'source-details', presentation: 'outlined', tokens: {}, roles }],
  }, { name: 'source-details-check' }).css;
}

test('outlined Details exports individual custom and native enclosures with source insets', () => {
  for (const mode of ['light', 'dark']) {
    const css = compile(binding, mode);
    assertCompanionBoundary(css, 'source-details-check', mode);
    assert.match(css, /border-width: 0\.0625rem; border-style: solid; border-radius: 0\.75rem; overflow: visible;/);
    assert.match(css, /::part\(control\)[^{]*[\s\S]*padding-inline: var\(--en-control-inline-padding, 1rem\); padding-block: 1rem; gap: 1rem;/);
    assert.match(css, /border-radius: max\(0px, calc\(0\.75rem - 0\.0625rem\)\)/);
    assert.match(css, /font-size: 1rem; line-height: 1\.6; font-weight: 400;/);
    assert.match(css, /::part\(panel\),[^{]*\.en-accordion-panel:not\(\[data-en-theme\]\):not\(:where\(\[data-en-theme\]\)\) \{ padding-block: 1rem; padding-inline: var\(--en-control-inline-padding, 1rem\); \}/);
    assert.match(css, /\[open\]:not\(:where\(\[data-en-theme\]\)\)::part\(control\)[\s\S]*border-end-start-radius: 0; border-end-end-radius: 0;/);
    assert.doesNotMatch(css, /:first-child|:last-child|:where\(en-accordion\)|\.en-accordion\s*\{/,
      'A source Details item keeps its whole border; no group enclosure is invented.');
  }
});

test('semantic native Details pads its actual content box without touching authored descendants', () => {
  const css = compile();
  assert.match(css, /:where\(details\)\.en-recipe-disclosure:not\(\.en-accordion-item\) > summary:first-of-type:not\(\[data-en-theme\]\)/);
  assert.match(css, /@supports selector\(details::details-content\)/);
  assert.match(css, /:where\(details\)\.en-recipe-disclosure:not\(\.en-accordion-item\)\[open\]:not\(:where\(\[data-en-theme\]\)\)::details-content \{ box-sizing: border-box; padding-block: 1rem; padding-inline: var\(--en-control-inline-padding, 1rem\); \}/);
  assert.doesNotMatch(css, /::details-content[^{}]*\{[^}]*(?:content-visibility|display|height|block-size):/,
    'The browser retains native closed-content hiding and sizing.');
  assert.doesNotMatch(css, />\s*(?:p|div|\*|:not\(summary\))\b|overflow: hidden/,
    'No arbitrary child receives padding, display changes or focus clipping.');
  assert.match(css, /margin-block: calc\(0px - 1rem\); margin-inline: calc\(0px - var\(--en-control-inline-padding, 1rem\)\);/,
    'The safe plain-content fallback uses the parent inset, not per-child insets.');
  assert.match(css, /\[open\][^{]*> summary:first-of-type[^{}]*\{ margin: 0; \}/,
    'The modern content box replaces the fallback summary spacing when open.');
});

test('Details state paint preserves pressed hooks, one disabled fade and visible focus ownership', () => {
  const css = compile();
  assert.match(css, /@media \(hover: hover\)/);
  assert.match(css, /background: transparent; text-decoration: none;/);
  assert.match(css, /background: var\(--en-accordion-pressed-background, transparent\); color: var\(--en-accordion-pressed-color,/);
  assert.match(css, /\[disabled\]:not\(:where\(\[data-en-theme\]\)\)::part\(base\)[^{]*[\s\S]*opacity: 0\.5; cursor: not-allowed;/);
  assert.match(css, /opacity: 1; color:[^;]*; cursor: not-allowed;/,
    'A disabled trigger is not faded again inside its disabled enclosure.');
  assert.match(css, /var\(--en-control-min-size, var\(--en-size-control-min, 2\.5rem\)\)/);
  assert.match(css, /@media \(any-pointer: coarse\)/);
  assert.match(css, /@media \(forced-colors: active\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(css, /outline:|outline-offset:|:focus-visible|:focus-within|pointer-events:|text-decoration: underline/,
    'Native focus, author focus/halo hooks and interaction ownership stay intact.');
  assert.match(css, /\[open\]:dir\(rtl\):not\(:where\(\[data-en-theme\]\)\)::part\(indicator\)::before[^{}]*\{ rotate: -45deg; \}/);
});

test('Details roles are optional and reject type-confused or arbitrary presentation inputs', () => {
  const css = compile({ lineHeight: 'theme.details.leading' });
  assert.match(css, /line-height: 1\.6;/);
  assert.doesNotMatch(css, /padding-block:|padding-inline:|border-radius:|::details-content|::part\(indicator\)::before/);
  assert.throws(() => compile({ borderWidth: 'color.text' }), { code: 'invalid-companion' });
  assert.throws(() => compile({ selector: 'theme.details.font' }), { code: 'invalid-companion' });
});
