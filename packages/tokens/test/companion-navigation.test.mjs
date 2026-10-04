import test from 'node:test';
import assert from 'node:assert/strict';
import { assertCompanionBoundary } from './companion-boundary-support.mjs';
import { colorFromHex, createThemeCompanion, resolveTheme, tokenDocument } from '../dist/index.js';

test('source line tabs preserve local padding and every public paint state hook', () => {
  const theme = resolveTheme();
  const { css } = createThemeCompanion(theme, {
    schemaVersion: 1, id: 'line-tab-hooks', rules: [{
      target: 'tab', presentation: 'line', tokens: {}, roles: {
        inlinePadding: 'space.4', restColor: 'color.text',
        selectedColor: 'color.action-text', indicatorColor: 'color.action',
      },
    }, {
      target: 'vertical-tab', presentation: 'line', tokens: {},
      roles: { indicatorColor: 'color.action' },
    }],
  });
  assert.match(css, /padding-inline: var\(--en-control-inline-padding, 1rem\);/);
  for (const name of ['background', 'color', 'selected-background', 'selected-color',
    'hover-background', 'hover-color', 'pressed-background', 'pressed-color', 'indicator-color']) {
    assert.ok(css.includes(`var(--en-tab-${name},`), `${name} remains a local override above source defaults`);
  }
  for (const edge of ['block', 'inline']) {
    assert.ok(css.includes(`border-${edge}-end-color: var(--en-tab-indicator-color, ${theme.tokens['color.action'].cssValue});`));
  }
  assertCompanionBoundary(css, theme.name, theme.mode);
  assert.match(css, /:not\(\[aria-disabled="true"\]\):not\(\[disabled\]\)\[aria-selected="true"\]:active:not\(:where\(\[data-en-theme\]\)\)::part\(base\)/);
  assert.match(css, /@media \(forced-colors: none\)/);
  assert.match(css, /@media \(hover: hover\)/);
});

// Independent WA 3.13.0 tab-group.styles (chunk.NMA53WZH.js): zero gap,
// protected .125rem rail, brand-fill-loud indicator and space-xl panel insets.
// Default palette/default theme supply these literal rail and indicator colors.
// Candidate definitions and the updater are deliberately not imported.
const waDimension = value => ({ $type: 'dimension', $value: { value, unit: 'rem' } });
function waTabsTheme(mode) {
  return resolveTheme({ mode, source: tokenDocument({
    'theme.wa-tabs.zero': waDimension(0),
    'theme.wa-tabs.rail-width': waDimension(.125),
    'theme.wa-tabs.panel-inset': waDimension(2),
    'theme.wa-tabs.rail-color': { $type: 'color', $value: colorFromHex(mode === 'light' ? '#e4e5e9' : '#2f323f') },
    'theme.wa-tabs.indicator-color': { $type: 'color', $value: colorFromHex('#0071ec') },
  }) });
}
const waRailRoles = { gap: 'theme.wa-tabs.zero', trackWidth: 'theme.wa-tabs.rail-width', trackColor: 'theme.wa-tabs.rail-color' };
const waIndicatorRoles = { trackWidth: 'theme.wa-tabs.rail-width', indicatorColor: 'theme.wa-tabs.indicator-color' };
const waProtectedRail = 'max(0.5px, round(0.125rem, 0.5px))';
function compileWaTabs(rules, mode = 'light') {
  return createThemeCompanion(waTabsTheme(mode), {
    schemaVersion: 1, id: 'web-awesome-tabs-source',
    rules: rules.map(([target, roles]) => ({ target, presentation: 'line', tokens: {}, roles })),
  }, { name: 'wa-tabs-source' }).css;
}
function assertWaRoute(css, mode, surface, part, expected) {
  const boundary = assertCompanionBoundary(css, 'wa-tabs-source', mode);
  for (const guard of [boundary.descendant, boundary.root]) {
    const selector = surface + guard + (part ? `::part(${part})` : '');
    assert.ok(boundary.rules.some(rule => rule.selector.includes(selector)
      && Object.entries(expected).every(([property, value]) => rule.declarations.includes(`${property}: ${value};`))),
    `Both full-boundary and descendant delivery retain ${selector}: ${JSON.stringify(expected)}`);
  }
}

test('WA line tab lists emit independent source rails in both orientations and appearances', () => {
  for (const mode of ['light', 'dark']) {
    const css = compileWaTabs([['tabs', waRailRoles], ['tab-list', waRailRoles]], mode);
    const color = mode === 'light' ? 'rgb(228 229 233 / 1)' : 'rgb(47 50 63 / 1)';
    assertWaRoute(css, mode, ':where(en-tabs)', 'tab-list', { gap: '0rem' });
    assertWaRoute(css, mode, '.en-tab-list', '', { gap: '0rem' });
    for (const [surface, part, edge] of [
      [':where(en-tabs):where(:not([orientation="vertical"]))', 'tab-list', 'block'],
      [':where(en-tabs):where([orientation="vertical"])', 'tab-list', 'inline'],
      ['.en-tab-list:not(:is([aria-orientation="vertical"], [data-orientation="vertical"]))', '', 'block'],
      ['.en-tab-list:is([aria-orientation="vertical"], [data-orientation="vertical"])', '', 'inline'],
    ]) {
      assertWaRoute(css, mode, surface, part, { [`border-${edge}-end-width`]: waProtectedRail });
      assertWaRoute(css, mode, surface, part, { [`border-${edge}-end-color`]: color });
    }
    assert.match(css, /@media \(forced-colors: none\)/, 'Source rail paint yields to the component system-color rules.');
    assert.doesNotMatch(css, /border-(?:left|right|top|bottom)(?:-width|-color|-style)?:/,
      'Rail edges remain logical, including vertical RTL compositions.');
  }
});

test('WA selected indicators share the protected source rail width and keep public overrides', () => {
  for (const mode of ['light', 'dark']) {
    const css = compileWaTabs([
      ['tab', { ...waIndicatorRoles, inlinePadding: 'space.4' }],
      ['vertical-tab', waIndicatorRoles],
    ], mode);
    const indicator = 'var(--en-tab-indicator-color, rgb(0 113 236 / 1))';
    for (const surface of [':where(en-tab)', '.en-tab']) {
      const part = surface.startsWith(':where(en-tab)') ? 'base' : '';
      assertWaRoute(css, mode, surface, part, {
        'border-block-end-width': waProtectedRail, 'margin-block-end': `calc(-1 * ${waProtectedRail})`,
        'padding-inline': 'var(--en-control-inline-padding, 1rem)',
      });
      assertWaRoute(css, mode, surface + '[aria-selected="true"]', part, { 'border-block-end-color': indicator });
    }
    for (const [surface, part] of [
      [':where(en-tabs[orientation="vertical"] > en-tab)', 'base'],
      [':where(.en-tab-list[aria-orientation="vertical"] > .en-tab).en-tab', ''],
      [':where(.en-tab-list[data-orientation="vertical"] > .en-tab).en-tab', ''],
    ]) {
      assertWaRoute(css, mode, surface, part, {
        'border-block-end-width': '0px', 'border-inline-end-width': waProtectedRail,
        'margin-block-end': '0px', 'margin-inline-end': `calc(-1 * ${waProtectedRail})`,
      });
      assertWaRoute(css, mode, surface + '[aria-selected="true"]', part, { 'border-inline-end-color': indicator });
    }
    assert.doesNotMatch(css, /--en-tab-indicator-color\s*:/,
      'The source indicator remains a fallback, never an assignment that can shadow an inherited public hook.');
    assert.doesNotMatch(css, /(?:border|margin)-(?:left|right)(?:-width|-color|-style)?:/);
  }
});

test('WA source panels pad both appropriate edges across custom and native full-theme boundaries', () => {
  for (const mode of ['light', 'dark']) {
    const css = compileWaTabs([
      ['tab-panel', { padding: 'theme.wa-tabs.panel-inset', paddingEnd: 'theme.wa-tabs.panel-inset', inlinePadding: 'theme.wa-tabs.zero' }],
      ['vertical-tab-panel', { padding: 'theme.wa-tabs.panel-inset', paddingEnd: 'theme.wa-tabs.panel-inset' }],
    ], mode);
    for (const [surface, part] of [[':where(en-tab-panel)', 'base'], ['.en-tab-panel', '']]) {
      assertWaRoute(css, mode, surface, part, { 'padding-block-start': '2rem', 'padding-block-end': '2rem', 'padding-inline': '0rem' });
    }
    for (const [surface, part] of [
      [':where(en-tabs[orientation="vertical"] > en-tab-panel)', 'base'],
      [':where(.en-tabs[data-orientation="vertical"] > .en-tab-panel).en-tab-panel', ''],
    ]) {
      assertWaRoute(css, mode, surface, part, { 'padding-block': '0px', 'padding-inline-start': '2rem', 'padding-inline-end': '2rem' });
    }
    assert.doesNotMatch(css, /padding-(?:left|right|top|bottom):/,
      'Panel insets follow the source orientation without hard-coding LTR sides.');
  }
});

test('omitted source rail and panel roles retain the earlier line presentation', () => {
  const lists = compileWaTabs([['tabs', { gap: 'space.1' }], ['tab-list', { gap: 'space.1' }]]);
  assert.match(lists, /gap: 0\.25rem;/);
  assert.doesNotMatch(lists, /border-(?:block|inline)-end-(?:width|color):|round\(/,
    'A gap-only recipe does not acquire an authored rail width or paint.');
  const panels = compileWaTabs([['tab-panel', { padding: 'space.4' }], ['vertical-tab-panel', { padding: 'space.4' }]]);
  assert.match(panels, /padding-block-start: 1rem; padding-block-end: 0px;/);
  assert.match(panels, /padding-block: 0px; padding-inline-start: 1rem;/);
  assert.doesNotMatch(panels, /padding-inline:|padding-inline-end:|padding-block-end: 2rem;/,
    'Unspecified end/inline padding preserves the previous one-sided profile.');
  const indicators = compileWaTabs([['tab', { indicatorWidth: 'theme.wa-tabs.rail-width' }], ['vertical-tab', { indicatorWidth: 'theme.wa-tabs.rail-width' }]]);
  assert.match(indicators, /border-block-end-width: 0\.125rem; margin-block-end: -1px;/);
  assert.match(indicators, /margin-inline-end: -1px;/);
  assert.doesNotMatch(indicators, /round\(|calc\(-1 \*/,
    'Protected source rail geometry is opt-in, not a change to every line-tab theme.');
});

test('optional source rail and panel roles reject incompatible types and arbitrary inputs', () => {
  for (const [target, dimensionRoles, colorRoles] of [
    ['tabs', ['trackWidth'], ['trackColor']], ['tab-list', ['trackWidth'], ['trackColor']],
    ['tab', ['trackWidth'], []], ['vertical-tab', ['trackWidth'], []],
    ['tab-panel', ['paddingEnd', 'inlinePadding'], []], ['vertical-tab-panel', ['paddingEnd'], []],
  ]) {
    for (const role of dimensionRoles) assert.throws(() => compileWaTabs([[target, { [role]: 'color.text' }]]), { code: 'invalid-companion' }, `${target}.${role} requires a dimension`);
    for (const role of colorRoles) assert.throws(() => compileWaTabs([[target, { [role]: 'space.4' }]]), { code: 'invalid-companion' }, `${target}.${role} requires a color`);
    assert.throws(() => compileWaTabs([[target, { selector: 'space.4' }]]), { code: 'invalid-companion' });
  }
  assert.throws(() => compileWaTabs([['tabs', { trackWidth: 'theme.wa-tabs.missing' }]]), { code: 'invalid-companion' });
});


// Retained Themes 3.3.0 BaseTabList default size 2 plus independently pinned
// space7 = 40px and --tab-active-letter-spacing = -.01em. No candidate imports.
function compileRadixDefaultTabs(rules, mode = 'light') {
  const theme = resolveTheme({ mode, source: tokenDocument({
    'theme.radix-tabs.zero': { $type: 'dimension', $value: { value: 0, unit: 'px' } },
    'theme.radix-tabs.minimum': { $type: 'dimension', $value: { value: 40, unit: 'px' } },
    'theme.radix-tabs.selected-tracking': { $type: 'number', $value: -.01 },
  }) });
  return createThemeCompanion(theme, {
    schemaVersion: 1, id: 'radix-default-tabs-source',
    rules: rules.map(([target, roles]) => ({ target, presentation: 'line', tokens: {}, roles })),
  }, { name: 'radix-default-tabs-source' }).css;
}
function assertRadixTabRoute(boundary, surface, part, declaration) {
  for (const guard of [boundary.descendant, boundary.root]) {
    const selector = surface + guard + (part ? `::part(${part})` : '');
    assert.ok(boundary.rules.some(rule => rule.selector.includes(selector) && rule.declarations.includes(declaration)),
      `Both direct and descendant source delivery preserve ${selector}: ${declaration}`);
  }
}

test('Radix default tabs preserve literal gap, minimum and selected tracking through public surfaces', () => {
  for (const mode of ['light', 'dark']) {
    const css = compileRadixDefaultTabs([
      ['tabs', { gap: 'theme.radix-tabs.zero' }],
      ['tab-list', { gap: 'theme.radix-tabs.zero' }],
      ['tab', { minBlockSize: 'theme.radix-tabs.minimum', selectedTracking: 'theme.radix-tabs.selected-tracking' }],
    ], mode);
    const boundary = assertCompanionBoundary(css, 'radix-default-tabs-source', mode);
    assertRadixTabRoute(boundary, ':where(en-tabs)', 'tab-list', 'gap: 0px;');
    assertRadixTabRoute(boundary, '.en-tab-list', '', 'gap: 0px;');
    for (const [surface, part] of [[':where(en-tab)', 'base'], ['.en-tab', '']]) {
      assertRadixTabRoute(boundary, surface, part,
        'min-block-size: max(var(--en-size-target-min), var(--en-control-min-size, 40px));');
      assertRadixTabRoute(boundary, surface, part,
        'min-block-size: max(var(--en-size-target-min), var(--en-size-target-touch), var(--en-control-min-size, 40px));');
      assertRadixTabRoute(boundary, surface + ':where([aria-selected="true"])', part,
        'letter-spacing: calc(1em * -0.01);');
    }
    for (const rule of boundary.rules.filter(rule => rule.declarations.includes('letter-spacing:'))) {
      assert.ok(rule.selector.includes(':where([aria-selected="true"])'),
        'Tracking applies only to selection and adds no attribute specificity above public Part styling.');
    }
    assert.match(css, /@media \(any-pointer: coarse\)/);
    assert.doesNotMatch(css, /--en-control-min-size\s*:/,
      'Source defaults never shadow an inherited consumer minimum with a local hook assignment.');
    assert.doesNotMatch(css, /(?:height|block-size):\s*40px|border-(?:left|right)|letter-spacing:\s*-0\.14px/,
      'The source is a growing logical minimum with font-relative tracking, not fixed height or assumed font pixels.');
  }
});

test('line tab minimum and selected tracking remain optional and typed', () => {
  const css = compileRadixDefaultTabs([['tab', {}]]);
  assert.doesNotMatch(css, /min-block-size:|letter-spacing:|@media \(any-pointer: coarse\)/);
  for (const roles of [
    { minBlockSize: 'theme.radix-tabs.selected-tracking' },
    { selectedTracking: 'theme.radix-tabs.minimum' },
  ]) assert.throws(() => compileRadixDefaultTabs([['tab', roles]]), { code: 'invalid-companion' });
});
