import test from 'node:test';
import assert from 'node:assert/strict';
import { colorFromHex, createThemeCompanion, resolveTheme, tokenDocument } from '../dist/index.js';
import { assertCompanionBoundary } from './companion-boundary-support.mjs';

// Independent Web Awesome 3.13.0 Default-theme source constants. These are
// authored here, without importing the candidate updater or generated catalogue:
// tooltip chunk.DJLBC7Q4.js (.body), dialog chunk.XTG2LNFG.js (.dialog/.header/
// .title/.body/.footer), default.css 195–219, 233–235, 247, 254 and 335–364;
// Default palette neutral gray 10/95/05 = #1b1d26/#f1f2f3/#101219.
// The source small-font scale rounds (root rem / 1.125) to whole CSS pixels;
// 16px and 20px roots therefore produce 14px and 18px. The large dialog title
// rounds (root rem * 1.125 * 1.125): 16px and 32px roots give 20px and 41px.
// The close glyph is not asserted.
const dim = (value, unit = 'rem') => ({ $type: 'dimension', $value: { value, unit } });
const number = value => ({ $type: 'number', $value: value });
const weight = value => ({ $type: 'fontWeight', $value: value });
const paint = value => ({ $type: 'color', $value: colorFromHex(value) });
const zero = { value: 0, unit: 'px' };
const transparentShadow = {
  $type: 'shadow', $value: {
    color: { ...colorFromHex('#000000'), alpha: 0 },
    offsetX: zero, offsetY: zero, blur: zero, spread: zero,
  },
};
const tooltipRoles = {
  fontSize: 'theme.tooltip.font', fontSizeDivisor: 'theme.tooltip.divisor', lineHeight: 'theme.tooltip.leading',
  fontWeight: 'theme.tooltip.weight', paddingInlineEm: 'theme.tooltip.inline-em',
  paddingBlockEm: 'theme.tooltip.block-em', maxInlineCharacters: 'theme.tooltip.characters',
  radius: 'theme.tooltip.radius', borderWidth: 'theme.tooltip.border',
  background: 'theme.tooltip.plate', borderColor: 'theme.tooltip.plate',
  color: 'theme.tooltip.ink', shadow: 'theme.tooltip.shadow',
};
const dialogRoles = {
  inlineSize: 'theme.dialog.width', viewportGutter: 'theme.dialog.gutter',
  borderWidth: 'theme.dialog.border', sectionInlinePadding: 'theme.dialog.section',
  headerBlockStartPadding: 'theme.dialog.section', headerBlockEndPadding: 'theme.dialog.zero',
  headerControlPaddingEm: 'theme.dialog.control-padding', headerGap: 'theme.dialog.section',
  bodyBlockStartPadding: 'theme.dialog.section', bodyBlockEndPadding: 'theme.dialog.section',
  footerBlockStartPadding: 'theme.dialog.zero', footerBlockEndPadding: 'theme.dialog.section',
  footerGap: 'theme.dialog.footer-gap', titleFontSize: 'theme.dialog.title',
  titleFontSizeMultiplier: 'theme.dialog.title-multiplier',
  titleLineHeight: 'theme.dialog.title-leading', titleFontWeight: 'theme.dialog.title-weight',
};
function compile(target, roles, mode = 'light', extra = {}) {
  const source = tokenDocument({
    'theme.tooltip.font': dim(1), 'theme.tooltip.divisor': number(1.125),
    'theme.tooltip.leading': number(1.6),
    'theme.tooltip.weight': weight(400), 'theme.tooltip.inline-em': number(.5),
    'theme.tooltip.block-em': number(.25), 'theme.tooltip.characters': number(30),
    'theme.tooltip.radius': dim(.1875), 'theme.tooltip.border': dim(.0625),
    'theme.tooltip.plate': paint(mode === 'light' ? '#1b1d26' : '#f1f2f3'),
    'theme.tooltip.ink': paint(mode === 'light' ? '#ffffff' : '#101219'),
    'theme.tooltip.shadow': transparentShadow,
    'theme.dialog.width': dim(31), 'theme.dialog.gutter': dim(2.5),
    'theme.dialog.section': dim(1.5), 'theme.dialog.zero': dim(0),
    'theme.dialog.control-padding': number(.75), 'theme.dialog.footer-gap': dim(.5),
    'theme.dialog.title': dim(1), 'theme.dialog.title-multiplier': number(1.265625),
    'theme.dialog.title-leading': number(1.2),
    'theme.dialog.title-weight': weight(600), 'theme.dialog.border': dim(0, 'px'),
    'theme.legacy.inline': dim(9), 'theme.legacy.block': dim(8),
    ...extra,
  });
  return createThemeCompanion(resolveTheme({ source, mode }), {
    schemaVersion: 1, id: 'web-awesome-overlay-source', rules: [{
      target, presentation: target === 'tooltip' ? 'compact' : 'sectioned', tokens: {}, roles,
    }],
  }, { name: 'web-awesome-overlay-source' }).css;
}
function selectorsIn(list) {
  const result = [];
  let start = 0, depth = 0;
  for (let index = 0; index < list.length; index++) {
    if (list[index] === '(' || list[index] === '[') depth++;
    if (list[index] === ')' || list[index] === ']') depth--;
    if (list[index] === ',' && depth === 0) {
      result.push(list.slice(start, index).trim()); start = index + 1;
    }
  }
  result.push(list.slice(start).trim());
  return result;
}
function rulesIn(css) {
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .map(([, selectors, body]) => ({ selectors: selectorsIn(selectors), body }));
}
function surface(css, selector) {
  const declarations = rulesIn(css).filter(rule => rule.selectors.some(target => selector.test(target)))
    .map(rule => rule.body).join(' ');
  assert.ok(declarations, `Expected public surface ${selector}.`);
  return declarations;
}
function outsideAuthorPaint(css) {
  const marker = '@media (forced-colors: none)';
  assert.ok(css.includes(marker), 'Source paint has a forced-colors guard.');
  for (let start = css.indexOf(marker); start >= 0; start = css.indexOf(marker)) {
    const opening = css.indexOf('{', start);
    let depth = 1, end = opening + 1;
    for (; end < css.length && depth > 0; end++) {
      if (css[end] === '{') depth++;
      if (css[end] === '}') depth--;
    }
    assert.equal(depth, 0, 'The author-paint media block is balanced.');
    css = css.slice(0, start) + css.slice(end);
  }
  return css;
}
const tooltipSurface = /^:where\(en-tooltip\)[^{}]*::part\(surface\)$/;
// A native element has no shadow Part; matching an emitted .en-tooltip::part(...)
// selector would incorrectly count ineffective CSS as native-helper coverage.
const nativeTooltip = /^\.en-tooltip(?![a-z-])(?!.*::part\()(?!.* > )/;
const dialogSurface = /^:where\(en-dialog\)[^{}]*::part\(surface\)$/;
const nativeDialog = /^\.en-dialog(?![a-z-])(?!.*::part\()(?!.* > )/;
const section = part => new RegExp(`^:where\\(en-dialog\\)[^{}]*::part\\(${part}\\)$`);

for (const mode of ['light', 'dark']) {
  test(`Web Awesome ${mode} tooltip exports intrinsic 30ch geometry, relative insets and inverse paint`, () => {
    const css = compile('tooltip', tooltipRoles, mode);
    assertCompanionBoundary(css, 'web-awesome-overlay-source', mode);
    const [plate, ink] = mode === 'light' ? ['27 29 38', '255 255 255'] : ['241 242 243', '16 18 25'];
    for (const selector of [tooltipSurface, nativeTooltip]) {
      const styles = surface(css, selector);
      assert.match(styles, /font-size: round\(calc\(1rem \/ max\(0\.01, 1\.125\)\), 1px\); line-height: 1\.6; font-weight: 400;/);
      assert.match(styles, /max-inline-size: min\(var\(--en-overlay-max-inline-size, calc\(max\(1, 30\) \* 1ch\)\), calc\(100% - var\(--en-space-8\)\)\);/);
      assert.match(styles, /border-radius: var\(--en-overlay-radius, 0\.1875rem\);/);
      assert.match(styles, /border-width: 0\.0625rem;/);
      assert.ok(styles.includes(`background: var(--en-overlay-background, rgb(${plate} / 1));`));
      assert.doesNotMatch(styles, /background-color: var\(--en-overlay-background/,
        'The public background accepts gradients, layers and the full background shorthand.');
      assert.ok(styles.includes(`border-color: var(--en-overlay-border-color, rgb(${plate} / 1));`));
      assert.ok(styles.includes(`color: var(--en-overlay-color, rgb(${ink} / 1));`));
      assert.ok(styles.includes('box-shadow: var(--en-shadow-overlay, 0px 0px 0px 0px rgb(0 0 0 / 0));'));
    }
    for (const selector of [/^:where\(en-tooltip\)[^{}]*::part\(content\)$/, nativeTooltip]) {
      const styles = surface(css, selector);
      assert.match(styles, /padding: var\(--en-overlay-padding, calc\(max\(0, 0\.25\) \* 1em\) calc\(max\(0, 0\.5\) \* 1em\)\);/);
    }
    assert.match(css, /--en-shadow-overlay: 0px 0px 0px 0px rgb\(0 0 0 \/ 0\);/,
      'The source has no elevation; the semantic shadow token must not retain its global elevation.');
    assert.doesNotMatch(outsideAuthorPaint(css), /(?:^|[;{}]\s*)(?:background(?:-color)?|color|border-color|border-width|box-shadow|fill|stroke|stroke-width|--en-shadow-overlay):/m,
      'Every source paint declaration yields to the component forced-colors presentation.');
    assert.doesNotMatch(css, /--en-overlay-(?:max-inline-size|radius|background|border-color|color):/,
      'Source defaults must not locally mask inherited public width, corner or paint overrides.');
    assert.doesNotMatch(css, /(?:^|[;{}]\s*)inline-size:|overflow:|white-space: nowrap|outline:/m,
      'A tooltip maximum preserves intrinsic wrapping and owned clipping/focus behavior.');
  });
}

test('tooltip em padding takes precedence while dimension-only bindings remain compatible', () => {
  const css = compile('tooltip', {
    ...tooltipRoles, paddingInline: 'theme.legacy.inline', paddingBlock: 'theme.legacy.block',
    maxInlineSize: 'theme.dialog.width',
  });
  assert.match(css, /padding: var\(--en-overlay-padding, calc\(max\(0, 0\.25\) \* 1em\) calc\(max\(0, 0\.5\) \* 1em\)\);/);
  assert.doesNotMatch(css, /9rem|8rem|31rem/);
  assert.match(css, /calc\(max\(1, 30\) \* 1ch\)/);
  const legacy = compile('tooltip', {
    paddingInline: 'theme.legacy.inline', paddingBlock: 'theme.legacy.block',
    maxInlineSize: 'theme.dialog.width',
  });
  assert.match(legacy, /padding: var\(--en-overlay-padding, 8rem 9rem\);/);
  assert.match(legacy, /var\(--en-overlay-max-inline-size, 31rem\)/);
  assert.doesNotMatch(legacy, /--en-overlay-max-inline-size:/);
});

test('sparse tooltip padding preserves each unassigned axis in plain and arrow content', () => {
  for (const [roles, plain, inset] of [
    [{ paddingInline: 'theme.legacy.inline' }, '0px 9rem', 'var(--en-space-2) 9rem'],
    [{ paddingBlock: 'theme.legacy.block' }, '8rem 0px', '8rem var(--en-space-2)'],
  ]) {
    const css = compile('tooltip', roles);
    assert.ok(surface(css, /^:where\(en-tooltip\)(?!\[arrow\])[^{}]*::part\(content\)$/)
      .includes(`padding: var(--en-overlay-padding, ${plain});`),
      'The custom plain content wrapper retains zero on an omitted axis.');
    for (const selector of [
      /^:where\(en-tooltip\)\[arrow\][^{}]*::part\(content\)$/,
      /^\.en-tooltip:not\(\[data-arrow\]\)/,
      /^\.en-tooltip\[data-arrow\] > \.en-overlay-content:not\(\[data-en-theme\]\)/,
    ]) assert.ok(surface(css, selector).includes(`padding: var(--en-overlay-padding, ${inset});`),
      'Arrow content and native helpers retain their ordinary core inset on an omitted axis.');
  }
  assert.doesNotMatch(compile('tooltip', {}), /padding: var\(--en-overlay-padding/,
    'An absent padding recipe preserves ordinary wrapper insets.');
});

test('tooltip arrows keep one padding owner and share their source surface paint', () => {
  const css = compile('tooltip', tooltipRoles);
  const plain = surface(css, /\.en-tooltip[^{}]*:not\(\[data-arrow\]\)/);
  assert.match(plain, /padding: var\(--en-overlay-padding, calc\(max\(0, 0\.25\) \* 1em\) calc\(max\(0, 0\.5\) \* 1em\)\);/);
  // Inspect exact native surface subjects separately from their child wrapper.
  const rootRules = rulesIn(css).filter(rule => rule.selectors.some(selector =>
    selector.startsWith('.en-tooltip[data-arrow]') && !selector.includes(' > ')));
  assert.ok(rootRules.length > 0);
  for (const { body } of rootRules) {
    assert.match(body, /padding: 0;/);
    assert.doesNotMatch(body, /padding-inline:|padding-block:/);
  }
  const wrapper = surface(css, /\.en-tooltip\[data-arrow\] > \.en-overlay-content:not\(\[data-en-theme\]\)/);
  assert.match(wrapper, /padding: var\(--en-overlay-padding, calc\(max\(0, 0\.25\) \* 1em\) calc\(max\(0, 0\.5\) \* 1em\)\);/);
  for (const selector of [/^:where\(en-tooltip\)[^{}]*::part\(arrow\)$/, /\.en-overlay-arrow:not\(\[data-en-theme\]\)/]) {
    const paint = surface(css, selector);
    assert.match(paint, /fill: var\(--en-overlay-background, rgb\(27 29 38 \/ 1\)\);/);
    assert.match(paint, /stroke: var\(--en-overlay-border-color, rgb\(27 29 38 \/ 1\)\);/);
    assert.match(paint, /stroke-width: 0\.0625rem;/);
  }
});

test('tooltip small typography preserves whole-pixel source scaling and legacy sizes', () => {
  const css = compile('tooltip', { fontSize: 'theme.tooltip.font', fontSizeDivisor: 'theme.tooltip.divisor' });
  for (const selector of [tooltipSurface, nativeTooltip]) {
    assert.match(surface(css, selector), /font-size: round\(calc\(1rem \/ max\(0\.01, 1\.125\)\), 1px\);/);
  }
  const legacy = compile('tooltip', { fontSize: 'theme.tooltip.font' });
  assert.match(legacy, /font-size: 1rem;/);
  assert.doesNotMatch(legacy, /round\(/);
  const noBase = compile('tooltip', { fontSizeDivisor: 'theme.tooltip.divisor' });
  assert.doesNotMatch(noBase, /font-size:/, 'An omitted base size retains the existing component typography.');
});

test('finite relative tooltip geometry clamps invalid negative lengths without accepting arbitrary CSS', () => {
  const css = compile('tooltip', {
    maxInlineCharacters: 'theme.tooltip.characters', paddingInlineEm: 'theme.tooltip.inline-em',
  }, 'light', { 'theme.tooltip.characters': number(-4), 'theme.tooltip.inline-em': number(-2) });
  assert.match(css, /calc\(max\(1, -4\) \* 1ch\)/);
  assert.match(css, /calc\(max\(0, -2\) \* 1em\)/);
});

test('sectioned dialog retains source title and section geometry in logical directions', () => {
  for (const mode of ['light', 'dark']) {
    const css = compile('dialog', dialogRoles, mode);
    assertCompanionBoundary(css, 'web-awesome-overlay-source', mode);
    const header = surface(css, section('header'));
    const compensated = 'max(0px, calc(1.5rem - 0.75 * 1em))';
    assert.ok(header.includes(`padding: var(--en-overlay-padding, ${compensated} ${compensated} 0rem 1.5rem);`));
    assert.match(header, /gap: 1\.5rem;/);
    for (const selector of [/^:where\(en-dialog\):dir\(rtl\)[^{}]*::part\(header\)$/,
      /^\.en-dialog > \.en-overlay-header:not\(\[data-en-theme\]\):dir\(rtl\)/]) {
      assert.ok(surface(css, selector).includes(`padding: var(--en-overlay-padding, ${compensated} 1.5rem 0rem ${compensated});`),
        'Only source inline fallbacks swap in RTL; authored shorthand keeps physical CSS semantics.');
    }
    for (const selector of [section('heading'), /^\.en-dialog[^{}]* > \.en-overlay-header:not\(\[data-en-theme\]\) > \.en-heading-small/]) {
      assert.match(surface(css, selector), /font-size: round\(calc\(1rem \* max\(0, 1\.265625\)\), 1px\); line-height: 1\.2; font-weight: 600;/);
    }
    const body = surface(css, section('body'));
    assert.ok(body.includes('padding: var(--en-overlay-padding, max(0px, 1.5rem,'),
      'The complete public shorthand stays outside source focus-clearance arithmetic.');
    assert.match(body, /var\(--en-focus-width\)/);
    const bodyRules = rulesIn(css).filter(rule => rule.selectors.some(selector => section('body').test(selector)));
    for (const { body: declaration } of bodyRules) assert.equal((declaration.match(/max\(0px, 1\.5rem,/g) ?? []).length, 4,
      'All four source body axes retain their 1.5rem inset and focus clearance.');
    const footer = surface(css, section('footer'));
    assert.ok(footer.includes('padding: var(--en-overlay-padding, 0rem 1.5rem 1.5rem 1.5rem);'));
    assert.match(footer, /gap: 0\.5rem;/);
    assert.match(surface(css, dialogSurface), /border-width: 0px;/);
    for (const native of ['.en-overlay-header', '.en-overlay-body', '.en-overlay-footer']) {
      assert.ok(css.includes(`${native}:not([data-en-theme])`),
        'Native authored regions preserve independent full-theme boundaries.');
    }
    assert.doesNotMatch(css, /padding-(?:left|right|top|bottom):|(?:^|[;{}]\s*)(?:width|height):/m,
      'The fallback shorthand handles RTL without issuing physical longhand overrides.');
    assert.doesNotMatch(css, /::part\(close\)|overflow:|outline:|--en-overlay-padding:/,
      'The source maps geometry without replacing close, scrollport, focus or inherited padding ownership.');
  }
});

test('ordinary dialog width and viewport caps retain public overrides and responsive ownership', () => {
  const css = compile('dialog', dialogRoles);
  for (const selector of [dialogSurface, nativeDialog]) {
    const styles = surface(css, selector);
    assert.match(styles, /(?:^|;)\s*inline-size: min\(var\(--en-overlay-max-inline-size, 31rem\), calc\(100% - 2\.5rem\)\);/);
    assert.match(styles, /max-inline-size: min\(var\(--en-overlay-max-inline-size, 31rem\), calc\(100% - 2\.5rem\)\);/);
    assert.match(styles, /max-block-size: var\(--en-overlay-max-block-size, calc\(100dvh - 2\.5rem\)\);/);
  }
  assert.doesNotMatch(css, /--en-overlay-max-(?:inline|block)-size:/,
    'Inherited public size constraints cannot be replaced by local source hook assignments.');
  const sizing = rulesIn(css).filter(({ body }) => /(?:^|;)\s*(?:inline-size|max-inline-size|max-block-size):/.test(body));
  assert.ok(sizing.length > 0);
  for (const { selectors } of sizing) for (const selector of selectors) {
    if (selector.startsWith(':where(en-dialog)')) assert.ok(selector.includes(':not([presentation="responsive"])'),
      'Every custom dialog sizing subject preserves responsive drawer ownership.');
    if (selector.startsWith('.en-dialog')) assert.ok(selector.includes(':not(:where(.en-drawer))'),
      'Native dialog maxima do not constrain a native drawer.');
  }
});

test('source dialog width reaches wide responsive surfaces without masking the public maximum', () => {
  // Fluent and Radix both supply 600px source widths. This checks the compiler
  // handoff to the owned responsive layout; actual narrow/wide behavior is a
  // browser assertion, not a result inferred from emitted CSS.
  const css = compile('dialog', { inlineSize: 'theme.dialog.width' }, 'light', {
    'theme.dialog.width': dim(600, 'px'),
  });
  const defaults = rulesIn(css).filter(({ body }) => body.includes('--_en-source-overlay-max-inline-size: 600px;'));
  assert.ok(defaults.length > 0, 'Source width is retained as a library-owned surface default.');
  const custom = defaults.flatMap(rule => rule.selectors).filter(selector => selector.startsWith(':where(en-dialog)'));
  assert.ok(custom.length > 0);
  for (const selector of custom) {
    assert.ok(selector.endsWith('::part(surface)'), 'The width default belongs to the public surface.');
    assert.ok(!selector.includes('[presentation="responsive"]'),
      'A responsive dialog must retain its source width when the core presents it as a centered modal.');
  }
  assert.doesNotMatch(css, /--en-overlay-max-inline-size:/,
    'Source width must not locally mask the consumer maximum.');
  const dimensions = rulesIn(css).filter(({ body }) => /(?:^|;)\s*(?:inline-size|max-inline-size):/.test(body));
  for (const selector of dimensions.flatMap(rule => rule.selectors).filter(value => value.startsWith(':where(en-dialog)'))) {
    assert.ok(selector.includes(':not([presentation="responsive"])'),
      'Direct source sizing must leave the responsive modal-to-drawer change to the core.');
  }
});

test('sectioned dialog hides only empty authored footers', () => {
  const css = compile('dialog', dialogRoles);
  const hidden = rulesIn(css).filter(({ body }) => /display: none;/.test(body)).flatMap(rule => rule.selectors);
  assert.ok(hidden.some(selector => selector.startsWith(':where(en-dialog)')));
  assert.ok(hidden.some(selector => selector.startsWith('.en-dialog')));
  for (const selector of hidden) {
    if (selector.startsWith(':where(en-dialog)')) {
      assert.ok(selector.includes(':not(:has(> [slot="footer"]))'));
      assert.ok(selector.endsWith('::part(footer)'));
    } else {
      assert.ok(selector.startsWith('.en-dialog'));
      assert.ok(selector.includes(' > .en-overlay-footer:not([data-en-theme]):empty'));
    }
  }
});

test('optional source overlay roles leave omitted geometry to existing components', () => {
  const tooltip = compile('tooltip', { fontSize: 'theme.tooltip.font' });
  assert.match(tooltip, /font-size: 1rem;/);
  assert.doesNotMatch(tooltip, /round\(|1\.125|padding: var\(--en-overlay-padding/);
  assert.doesNotMatch(tooltip, /max-inline-size:|border-radius:|padding-inline:|padding-block:|background:|box-shadow:/);
  const dialog = compile('dialog', { titleFontWeight: 'theme.dialog.title-weight' });
  assert.match(dialog, /font-weight: 600;/);
  assert.doesNotMatch(dialog, /padding: var\(--en-overlay-padding/);
  assert.doesNotMatch(dialog, /(?:^|[;{}]\s*)(?:inline-size|max-inline-size|max-block-size|padding-inline(?:-end|-start)?|padding-block-start|padding-block-end):|1em|100dvh/m);
  const title = compile('dialog', { titleFontSize: 'theme.dialog.title' });
  assert.match(surface(title, section('heading')), /font-size: 1rem;/);
  assert.doesNotMatch(title, /round\(/, 'An omitted multiplier preserves the existing title size.');
  const noTitleBase = compile('dialog', { titleFontSizeMultiplier: 'theme.dialog.title-multiplier' });
  assert.doesNotMatch(noTitleBase, /font-size:/, 'A title multiplier cannot invent an omitted base size.');
  const header = compile('dialog', { sectionInlinePadding: 'theme.dialog.section' });
  assert.match(surface(header, section('header')), /padding: var\(--en-overlay-padding, 0px 1\.5rem 0px 1\.5rem\);/);
  assert.doesNotMatch(header, /padding-inline-end:|padding-block-start:|1em|100dvh/);
});

test('source overlay roles reject type confusion and unregistered styling inputs', () => {
  for (const [target, roles] of [
    ['tooltip', { maxInlineCharacters: 'theme.dialog.width' }],
    ['tooltip', { paddingInlineEm: 'theme.legacy.inline' }],
    ['tooltip', { paddingBlockEm: 'theme.legacy.block' }],
    ['tooltip', { fontSizeDivisor: 'theme.tooltip.font' }],
    ['dialog', { viewportGutter: 'theme.tooltip.characters' }],
    ['drawer', { viewportGutter: 'theme.dialog.gutter' }],
    ['dialog', { headerControlPaddingEm: 'theme.dialog.section' }],
    ['dialog', { titleFontSizeMultiplier: 'theme.dialog.title' }],
    ['tooltip', { selector: 'theme.tooltip.font' }],
    ['dialog', { headerInlineEndPadding: 'theme.dialog.section' }],
  ]) assert.throws(() => compile(target, roles), { code: 'invalid-companion' });
});
