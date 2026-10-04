import test from 'node:test';
import assert from 'node:assert/strict';
import { createThemeCompanion, resolveTheme, tokenDocument } from '../dist/index.js';
import { assertCompanionBoundary } from './companion-boundary-support.mjs';

// Rhea a87a63b2ca25143d26c8bd0903e4e9bc77b3f824, style-rhea.css
// Dialog 714–741 and Popover 1164–1182. The selected 10px base radius
// gives rounded-3xl = 22px; dialog corners cap at 24px independently of root
// text growth. Tailwind 4 backdrop-blur-sm defaults to 8px.
// These independent source constants exercise public compiler export, while
// the docs browser suite checks actual Parts/native helpers and local overrides.
const dimension = (value, unit = 'px') => ({ $type: 'dimension', $value: { value, unit } });
const source = tokenDocument({
  'theme.overlay.dialog-padding': dimension(1.5, 'rem'),
  'theme.overlay.dialog-radius-cap': dimension(24),
  'theme.overlay.dialog-fill': dimension(28, 'rem'),
  'theme.overlay.dialog-breakpoint': dimension(40, 'rem'),
  'theme.overlay.popover-padding': dimension(1, 'rem'),
  'theme.overlay.popover-radius': dimension(1.375, 'rem'),
  'theme.overlay.footer-gap': dimension(.5, 'rem'),
  'theme.overlay.blur': dimension(8),
  'theme.overlay.title-size': dimension(1, 'rem'),
  'theme.overlay.dialog-title-line': { $type: 'number', $value: 1 },
  'theme.overlay.popover-title-line': { $type: 'number', $value: 1.5 },
  'theme.overlay.title-weight': { $type: 'fontWeight', $value: 500 },
});
const theme = resolveTheme({ source });
const bind = (target, roles) => ({ target, presentation: 'padded', tokens: {}, roles });
const compile = rules => createThemeCompanion(theme, {
  schemaVersion: 1, id: 'source-overlay-check', rules,
}, { name: 'source-overlay-check' }).css;

test('Rhea dialog refinement exports source metrics without replacing the core scrollport or description flow', () => {
  const css = compile([bind('padded-dialog', {
    padding: 'theme.overlay.dialog-padding', gap: 'theme.overlay.dialog-padding',
    footerGap: 'theme.overlay.footer-gap', maxRadius: 'theme.overlay.dialog-radius-cap',
    titleFontSize: 'theme.overlay.title-size', titleLineHeight: 'theme.overlay.dialog-title-line',
    titleWeight: 'theme.overlay.title-weight', backdropBlur: 'theme.overlay.blur',
    descriptionColor: 'color.text-muted',
  })]);
  assert.match(css, /padding: var\(--en-overlay-padding, 1\.5rem\); gap: 1\.5rem;/);
  assert.match(css, /border-radius: var\(--en-overlay-radius, min\(var\(--_en-sized-radius-dialog, var\(--en-radius-dialog\)\), 24px\)\);/);
  assert.match(css, /:not\(\[presentation="responsive"\]\):not\(:where\(\[data-en-theme\]\)\)::part\(surface\)[^{]*\{ border-radius:/);
  assert.match(css, /\.en-dialog:where\(dialog\):not\(:where\(\.en-drawer\)\)[^{]*\{ border-radius:/);
  assert.doesNotMatch(css, /--en-overlay-radius:/,
    'Inherited author overrides remain outside the source cap.');
  assert.match(css, /font-size: 1rem; line-height: 1; font-weight: 500;/);
  assert.match(css, /\.en-dialog:is\(dialog\)/, 'Native modal declarations match the owned recipe specificity.');
  assert.match(css, /::part\(footer\)[^{]*\{ gap: 0\.5rem; \}/);
  assert.match(css, /:not\(:has\(> \[slot="footer"\]\)\):not\(:where\(\[data-en-theme\]\)\)::part\(footer\)/);
  assert.match(css, /@media \(forced-colors: none\)[\s\S]*backdrop-filter: blur\(8px\)/);
  assert.doesNotMatch(css, /::part\(body\)|::part\(close\)|::part\(description\)[^{]*\{[^}]*display:/,
    'The renderer must not replace body focus clearance, close layout or empty-description flow.');
  assertCompanionBoundary(css, 'source-overlay-check', 'light');
});

test('Rhea card cap preserves selected semantic radii and public overrides', () => {
  const rule = roles => ({ target: 'inset-card', presentation: 'inset', tokens: {}, roles });
  const css = compile([rule({ maxRadius: 'theme.overlay.dialog-radius-cap' })]);
  assert.match(css, /border-radius: var\(--en-surface-radius, min\(var\(--_en-sized-radius-container, var\(--en-radius-container, 1rem\)\), 24px\)\);/);
  assert.match(css, /::part\(base\)[^{]*\{ border-radius:/);
  assert.match(css, /\.en-card[^{}]*\{ border-radius:/);
  assert.doesNotMatch(css, /--en-surface-radius:/,
    'The source cap applies only to the semantic fallback, so public overrides win.');
  assert.doesNotMatch(compile([rule({})]), /border-radius:/,
    'An omitted cap preserves other presentations and managed radius choices.');
  assert.throws(() => compile([rule({ maxRadius: 'color.text' })]), { code: 'invalid-companion' });
  assertCompanionBoundary(css, 'source-overlay-check', 'light');
});


test('Rhea ordinary dialogs fill narrow viewports and use the source wide maximum without shadowing public overrides', () => {
  const css = compile([bind('padded-dialog', {
    fillInlineSize: 'theme.overlay.dialog-fill', fillBreakpoint: 'theme.overlay.dialog-breakpoint',
  })]);
  assert.match(css, /inline-size: 100%; max-inline-size: min\(var\(--en-overlay-max-inline-size, 100%\), calc\(100% - var\(--en-space-8, 2rem\)\)\);/);
  assert.match(css, /@media \(width >= 40rem\) \{[\s\S]*max-inline-size: min\(var\(--en-overlay-max-inline-size, 28rem\), calc\(100% - var\(--en-space-8, 2rem\)\)\);/);
  assert.doesNotMatch(css, /@media[^{}]*var\(/, 'Media conditions consume resolved dimensions, not CSS custom properties.');
  assert.match(css, /:not\(\[presentation="responsive"\]\):not\(:where\(\[data-en-theme\]\)\)::part\(surface\)[^{]*\{ inline-size:/);
  assert.match(css, /\.en-dialog:where\(dialog\):not\(:where\(\.en-drawer\)\)[^{]*\{ inline-size:/);
  assert.doesNotMatch(css, /--en-overlay-max-inline-size:|@media \(forced-colors: none\)/,
    'The public maximum remains inherited and geometry remains active in forced colors.');
  const always = compile([bind('padded-dialog', { fillInlineSize: 'theme.overlay.dialog-fill' })]);
  assert.match(always, /inline-size: 100%; max-inline-size: min\(var\(--en-overlay-max-inline-size, 28rem\)/);
  assert.doesNotMatch(always, /@media/);
  assertCompanionBoundary(css, 'source-overlay-check', 'light');
});

test('Rhea popover refinement assigns one padding owner for arrow and plain surfaces', () => {
  const css = compile([bind('padded-popover', {
    padding: 'theme.overlay.popover-padding', gap: 'theme.overlay.popover-padding',
    radius: 'theme.overlay.popover-radius', titleFontSize: 'theme.overlay.title-size',
    titleLineHeight: 'theme.overlay.popover-title-line', titleWeight: 'theme.overlay.title-weight',
  })]);
  assert.match(css, /row-gap: 1rem; border-radius: var\(--en-overlay-radius, 1\.375rem\);/);
  assert.match(css, /:not\(\[arrow\]\):not\(:where\(\[data-en-theme\]\)\)::part\(surface\)[^{]*\{ padding: var\(--en-overlay-padding, 1rem\); \}/);
  assert.match(css, /\[arrow\]:not\(:where\(\[data-en-theme\]\)\)::part\(content\)[^{]*\{ padding: var\(--en-overlay-padding, 1rem\); \}/);
  assert.match(css, /\.en-popover\[data-arrow\] > \.en-overlay-content:not\(\[data-en-theme\]\)/);
  assert.match(css, /font-size: 1rem; line-height: 1\.5; font-weight: 500;/);
  assert.doesNotMatch(css, /::part\(body\)|::part\(close\)|display:|margin:/,
    'The source refinement preserves core arrow content, dismissal layout and scrollport geometry.');
});

test('overlay presentation roles remain optional and enforce typed dimensions', () => {
  const css = compile([bind('padded-popover', { titleFontSize: 'theme.overlay.title-size' })]);
  assert.doesNotMatch(css, /padding:|row-gap:|border-radius:|line-height:/);
  assert.doesNotMatch(compile([bind('padded-dialog', { titleFontSize: 'theme.overlay.title-size' })]), /border-radius:/,
    'An omitted cap leaves the core radius unchanged.');
  assert.doesNotMatch(compile([bind('padded-dialog', { fillBreakpoint: 'theme.overlay.dialog-breakpoint' })]), /inline-size:|@media/,
    'A breakpoint alone does not opt into filled width.');
  assert.throws(() => compile([bind('padded-dialog', { backdropBlur: 'color.text' })]), { code: 'invalid-companion' });
  assert.throws(() => compile([bind('padded-dialog', { maxRadius: 'color.text' })]), { code: 'invalid-companion' });
  for (const role of ['fillInlineSize', 'fillBreakpoint']) assert.throws(() => compile([bind('padded-dialog', { [role]: 'color.text' })]), { code: 'invalid-companion' });
});
