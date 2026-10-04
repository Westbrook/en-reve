import test from 'node:test';
import assert from 'node:assert/strict';
import { transform } from 'lightningcss';
import { assertCompanionBoundary } from './companion-boundary-support.mjs';
import {
  colorFromHex, createReviewDraft, createThemeCompanion, createThemePair,
  reopenReviewDraft, resolveTheme, tokenDocument,
} from '../dist/index.js';

// Exercise the public compiler with independently authored values. The tests do
// not import helper registries or require a generated documentation catalogue.
const source = tokenDocument({
  'theme.tooltip.background': {$type: 'color', $value: colorFromHex('#123456')},
  'theme.tooltip.color': {$type: 'color', $value: colorFromHex('#ffffff')},
  'theme.tooltip.radius': {$type: 'dimension', $value: {value: 6, unit: 'px'}},
  'theme.tooltip.padding-inline': {$type: 'dimension', $value: {value: 0.75, unit: 'rem'}},
  'theme.tooltip.padding-block': {$type: 'dimension', $value: {value: 0.25, unit: 'rem'}},
  'theme.tooltip.font-size': {$type: 'dimension', $value: {value: 0.875, unit: 'rem'}},
  'theme.tooltip.line-height': {$type: 'number', $value: 1.5},
  'theme.tooltip.font-weight': {$type: 'fontWeight', $value: 500},
});
const baseOptions = {source};
const theme = resolveTheme(baseOptions);
const roles = {
  background: 'theme.tooltip.background', color: 'theme.tooltip.color',
  radius: 'theme.tooltip.radius', paddingInline: 'theme.tooltip.padding-inline',
  paddingBlock: 'theme.tooltip.padding-block', fontSize: 'theme.tooltip.font-size',
  lineHeight: 'theme.tooltip.line-height', fontWeight: 'theme.tooltip.font-weight',
};
const rule = {target: 'tooltip', presentation: 'compact', tokens: {}, roles};
const recipe = rules => ({schemaVersion: 1, id: 'component-surfaces', rules});
const compile = (rules = [rule], resolved = theme) => createThemeCompanion(resolved, recipe(rules), {name: 'component-review'});
const invalid = input => assert.throws(() => createThemeCompanion(theme, input), {code: 'invalid-companion'});

function parsedStyleRules(css) {
  const rules = [];
  const parsed = transform({
    filename: 'component-companions.css', code: Buffer.from(css), errorRecovery: false,
    visitor: {Rule: {style(rule) { rules.push(rule.value); }}},
  });
  assert.deepEqual(parsed.warnings, [], 'Companion selectors and declarations must parse without recovery.');
  return rules;
}

// :not(:where(...)) excludes a boundary without adding specificity.
const zeroWeight = item => item.type === 'pseudo-class' && (item.kind === 'where'
  || item.kind === 'not' && item.selectors.every(selector => selector.every(zeroWeight)));

function assertPublicInset(css, target, part, property, value, hook, focusClearance = false) {
  const block = css.match(new RegExp(`${target}[^{}]*::part\\(${part}\\)[^{}]*\\{([^}]*)\\}`));
  assert.ok(block, `Expected the public ${target} ${part} surface.`);
  const declaration = block[1].match(new RegExp(`(?:^|;)\\s*${property}:([^;]+);`));
  assert.ok(declaration, `Expected ${property} on the public ${part} surface.`);
  assert.ok(declaration[1].includes(value), 'The authored role contributes its resolved value.');
  assert.ok(declaration[1].includes(hook), 'The documented padding hook remains available to consumers.');
  if (focusClearance) assert.ok(declaration[1].includes('--en-focus-width'),
    'Scrollable body padding retains the public focus-clearance inputs.');
}

function assertFullOverlayPadding(css) {
  const prefix = 'var(--en-overlay-padding, ';
  const consumed = [...css.matchAll(/([\w-]+)\s*:\s*([^;{}]+);/g)]
    .filter(([, , value]) => value.includes('var(--en-overlay-padding'));
  assert.ok(consumed.length > 0, 'The presentation retains its public padding override.');
  assert.doesNotMatch(css, /--en-overlay-padding\s*:/, 'Source defaults cannot replace an inherited padding override.');
  assert.doesNotMatch(css, /(?:^|[;{}]\s*)padding-[a-z-]+\s*:/m,
    'Source longhands cannot override individual sides of the public padding shorthand.');
  for (const [, property, value] of consumed) {
    assert.equal(property, 'padding', 'A one-to-four-value padding override must be consumed as a complete shorthand.');
    assert.ok(value.startsWith(prefix), 'Source arithmetic belongs inside the fallback, after the public override.');
    let depth = 0;
    for (let index = value.indexOf('('); index < value.length; index++) {
      if (value[index] === '(') depth++;
      if (value[index] === ')') depth--;
      if (depth === 0) assert.equal(index, value.length - 1,
        'The hook must supply the whole shorthand without trailing source operands.');
    }
    assert.equal(depth, 0, 'The padding fallback must have balanced functions.');
    assert.ok(!value.slice(prefix.length).includes('--en-overlay-padding'),
      'The full padding override cannot be reused as a scalar inside fallback arithmetic.');
  }
}

test('public companion compiler binds typed tooltip roles to documented surfaces and local hooks', () => {
  const result = compile();
  assert.equal(result.kind, 'theme-companion');
  assert.equal(result.sourceHash, theme.sourceHash);
  assert.match(result.css, /background: var\(--en-overlay-background, rgb\(18 52 86 \/ 1\)\);/);
  assert.doesNotMatch(result.css, /background-color:\s*var\(--en-overlay-background(?:,|\))/,
    'The public background hook accepts gradients as well as colors.');
  assert.match(result.css, /color: var\(--en-overlay-color, rgb\(255 255 255 \/ 1\)\);/);
  assert.match(result.css, /border-radius: var\(--en-overlay-radius, 6px\);/);
  assert.doesNotMatch(result.css, /--en-overlay-(?:background|color|radius):/, 'Source defaults must not mask inherited public overrides.');
  assert.match(result.css, /::part\(surface\)\s*\{[^}]*font-size: 0\.875rem;[^}]*line-height: 1\.5;[^}]*font-weight: 500;/);
  assertPublicInset(result.css, 'en-tooltip', 'content', 'padding', '0.25rem 0.75rem', '--en-overlay-padding');
  assert.match(result.css, /@media \(forced-colors: none\)/);
  assert.match(result.css, /:where\(\.en-tooltip\)/, 'The documented native helper receives the same presentation.');
  assert.doesNotMatch(result.css, /outline:\s*(?:none|0)(?:;|\s)/);
});

test('optional roles preserve absent declarations and legacy hook rules remain usable', () => {
  const css = compile([{...rule, roles: {paddingInline: 'theme.tooltip.padding-inline'}}]).css;
  assertPublicInset(css, 'en-tooltip', 'content', 'padding', '0px 0.75rem', '--en-overlay-padding');
  assert.doesNotMatch(css, /(?:--en-overlay-radius|--en-overlay-background|padding-block|font-size):/);
  const legacy = compile([{target: 'button', variant: 'ghost', tokens: {'--en-button-rest-background': 'color.selected'}}]);
  assert.match(legacy.css, /en-button\[variant="ghost"\]/);
  assert.match(legacy.css, /\.en-button\[data-variant="ghost"\]/);
  assert.match(legacy.css, /--en-button-rest-background:/);
});

test('tooltip and modal padding hooks preserve the full one-to-four-value shorthand grammar', () => {
  for (const tooltipRoles of [roles, {paddingInline: roles.paddingInline}, {paddingBlock: roles.paddingBlock}]) {
    assertFullOverlayPadding(compile([{...rule, roles: tooltipRoles}]).css);
  }
  for (const target of ['dialog', 'drawer']) {
    const modalRoles = {
      sectionInlinePadding: 'theme.tooltip.padding-inline',
      headerBlockStartPadding: 'theme.tooltip.padding-inline',
      headerBlockEndPadding: 'theme.tooltip.padding-block',
      headerControlPaddingEm: 'theme.tooltip.line-height',
      bodyBlockStartPadding: 'theme.tooltip.padding-block',
      bodyBlockEndPadding: 'theme.tooltip.padding-inline',
      footerBlockStartPadding: 'theme.tooltip.padding-block',
      footerBlockEndPadding: 'theme.tooltip.padding-inline',
    };
    const modalRule = {target, presentation: 'sectioned', tokens: {}, roles: modalRoles};
    const css = compile([modalRule]).css;
    assertFullOverlayPadding(css);
    for (const part of ['header', 'body', 'footer', 'description']) {
      assertPublicInset(css, `en-${target}`, part, 'padding', '0.75rem', '--en-overlay-padding', part === 'body');
    }
    for (const name of ['sectionInlinePadding', 'headerBlockStartPadding', 'bodyBlockEndPadding', 'footerBlockStartPadding']) {
      assertFullOverlayPadding(compile([{...modalRule, roles: {[name]: modalRoles[name]}}]).css);
    }
  }
});

test('public exports register distinct surface presentations rather than silently dropping their roles', () => {
  const css = compile([
    {target: 'dialog', presentation: 'sectioned', tokens: {}, roles: {sectionInlinePadding: 'theme.tooltip.padding-inline'}},
    {target: 'drawer', presentation: 'sectioned', tokens: {}, roles: {bodyBlockEndPadding: 'theme.tooltip.padding-block'}},
    {target: 'popover', presentation: 'sectioned', tokens: {}, roles: {padding: 'theme.tooltip.padding-inline'}},
    {target: 'card', presentation: 'sectioned', tokens: {}, roles: {bodyPadding: 'theme.tooltip.padding-block'}},
    {target: 'menu', presentation: 'compact-surface', tokens: {}, roles: {radius: 'theme.tooltip.radius'}},
  ]).css;
  assertPublicInset(css, 'en-dialog', 'header', 'padding', '0.75rem', '--en-overlay-padding');
  assertPublicInset(css, 'en-drawer', 'body', 'padding', '0.25rem', '--en-overlay-padding', true);
  assertPublicInset(css, 'en-popover', 'body', 'padding', '0.75rem', '--en-overlay-padding', true);
  assertPublicInset(css, 'en-card', 'content', 'padding-block', '0.25rem', '--en-surface-padding');
  assert.match(css, /en-menu[^{]*\{[^}]*--en-option-list-radius: 6px;/);
});

test('public compiler connects control, feedback, navigation and collection presentations', () => {
  const css = compile([
    {target: 'checkbox', presentation: 'solid', tokens: {}, roles: {gap: 'theme.tooltip.padding-inline'}},
    {target: 'badge', presentation: 'badge-subtle', tokens: {}, roles: {'inline-padding': 'theme.tooltip.padding-block', radius: 'theme.tooltip.radius'}},
    {target: 'avatar', presentation: 'avatar-subtle', tokens: {}, roles: {radius: 'theme.tooltip.radius'}},
    {target: 'dialog', presentation: 'sectioned', tokens: {}, roles: {radius: 'theme.tooltip.radius'}},
    {target: 'popover', presentation: 'sectioned', tokens: {}, roles: {radius: 'theme.tooltip.radius', maxInlineSize: 'theme.tooltip.padding-inline'}},
    {target: 'hover-card', presentation: 'sectioned', tokens: {}, roles: {radius: 'theme.tooltip.radius', maxInlineSize: 'theme.tooltip.padding-inline'}},
    {target: 'progress-bar', presentation: 'progress-rounded', tokens: {}, roles: {trackColor: 'theme.tooltip.background'}},
    {target: 'tabs', presentation: 'line', tokens: {}, roles: {gap: 'theme.tooltip.padding-inline'}},
    {target: 'calendar', presentation: 'solid-date-selection', tokens: {}, roles: {'heading-weight': 'theme.tooltip.font-weight'}},
  ]).css;
  assert.match(css, /en-checkbox[^\n]*::part\(label\)[^{]*\{[^}]*gap: 0\.75rem;/);
  assert.match(css, /en-badge[^\n]*::part\(base\)[^{]*\{[^}]*padding-inline: 0\.25rem;/);
  assert.match(css, /en-tabs[^\n]*::part\(tab-list\)[^{]*\{[^}]*gap: 0\.75rem;/);
  assert.match(css, /en-calendar[^\n]*::part\(heading\)[^{]*\{[^}]*font-weight: 500;/);
  for (const [target, hook] of [['en-avatar', 'avatar'], ['en-badge', 'badge'], ['en-popover', 'overlay'], ['en-hover-card', 'overlay']]) {
    assert.match(css, new RegExp(`${target}[^{}]*::part\\((?:base|surface)\\)[^{}]*\\{[^}]*border-radius: var\\(--en-${hook}-radius, 6px\\);`));
    assert.ok(!css.includes(`--en-${hook}-radius:`), 'Finite defaults must not mask inherited public radius overrides.');
  }
  assert.match(css, /en-dialog\):not\(\[presentation="responsive"\]\):not\(:where\(\[data-en-theme\]\)\)::part\(surface\)[^{}]*\{ border-radius: var\(--en-overlay-radius, 6px\);/);
  assert.match(css, /\.en-dialog:is\(dialog\):not\(:where\(\[data-en-theme\]\)\) \{ border-radius: var\(--en-overlay-radius, 6px\);/);
  assert.ok(css.includes('max-inline-size: min(var(--en-overlay-max-inline-size, 0.75rem), calc(100% - var(--en-space-8)));'));
  const maximumOnly = compile([{target: 'popover', presentation: 'sectioned', tokens: {}, roles: {maxInlineSize: 'theme.tooltip.padding-inline'}}]).css;
  assert.doesNotMatch(maximumOnly, /(?:^|[;{}\s])inline-size:/, 'A popup maximum must not turn intrinsic content into a fixed-width popup.');
  assert.ok(!css.includes('--en-overlay-max-inline-size:'), 'Inherited public popup maxima remain authoritative.');
  assert.ok(css.includes('--_en-source-progress-track-color: rgb(18 52 86 / 1);'));
  assert.ok(!css.includes('--en-progress-track-color:'), 'The source rail default must not replace a public override.');
  const railRules = assertCompanionBoundary(css, 'component-review', theme.mode).rules
    .filter(({ declarations }) => declarations.includes('--_en-source-progress-track-color:'));
  assert.equal(railRules.length, 2, 'The rail default reaches both descendant and direct-boundary controls.');
  for (const { selector } of railRules) for (const target of ['en-progress-bar', 'progress.en-progress', '.en-progress-track']) {
    assert.ok(selector.includes(`:where(${target})`),
      'The private rail default belongs to delivered controls, not a theme container.');
  }
  assert.match(css, /@media \(forced-colors: none\) \{ @container --en-theme-companion style\(--en-companion-component-review-light: 1\) \{\n:where\(en-progress-bar\):not\(:where\(\[data-en-theme\]\)\),[^{}]*\{ --_en-source-progress-track-color:/,
    'The source rail paint remains inside the author-paint guard.');
  for (const bad of [
    {target: 'avatar', presentation: 'avatar-subtle', roles: {radius: 'color.text'}},
    {target: 'badge', presentation: 'badge-subtle', roles: {radius: 'color.text'}},
    {target: 'dialog', presentation: 'sectioned', roles: {radius: 'color.text'}},
    {target: 'drawer', presentation: 'sectioned', roles: {radius: 'radius.dialog'}},
    {target: 'popover', presentation: 'sectioned', roles: {maxInlineSize: 'color.text'}},
    {target: 'progress-bar', presentation: 'progress-rounded', roles: {trackColor: 'space.2'}},
  ]) invalid(recipe([{...bad, tokens: {}}]));

});

test('Radix material fallback composites public alpha paint over an opaque panel in both no-blur branches', () => {
  const resolved = resolveTheme({source: tokenDocument({
    'theme.panel.paint': {$type: 'color', $value: {...colorFromHex('#123456'), alpha: .25}},
    'theme.panel.opaque': {$type: 'color', $value: colorFromHex('#f0e0d0')},
    'theme.panel.blur': {$type: 'dimension', $value: {value: 64, unit: 'px'}},
  })});
  const css = compile([{
    target: 'radix-material-card', presentation: 'translucent', tokens: {},
    roles: {background: 'theme.panel.paint', opaqueBackground: 'theme.panel.opaque', blur: 'theme.panel.blur'},
  }], resolved).css;
  const paint = 'var(--en-card-background, var(--en-surface-background, rgb(18 52 86 / 0.25)))';
  const fallback = `background: linear-gradient(${paint}, ${paint}), rgb(240 224 208 / 1);`;
  const unsupportedStart = css.indexOf('@supports not');
  const reducedStart = css.indexOf('@media (prefers-reduced-transparency: reduce)');
  const forcedStart = css.indexOf('@media (forced-colors: active)');
  assert.ok(unsupportedStart > 0 && reducedStart > unsupportedStart && forcedStart > reducedStart);
  const normal = css.slice(0, unsupportedStart);
  assert.ok(normal.includes(`background: ${paint};`), 'Ordinary material paint retains the public hook cascade.');
  assert.ok(!normal.includes('linear-gradient('), 'The opaque composition is confined to fallback branches.');
  for (const branch of [css.slice(unsupportedStart, reducedStart), css.slice(reducedStart, forcedStart)]) {
    assert.ok(branch.includes(fallback), 'The resolved alpha paint sits above a fully opaque backing color.');
    assert.ok(branch.includes('en-card') && branch.includes('.en-card'), 'Custom and native card surfaces share the fallback.');
    assert.ok(branch.includes('backdrop-filter: none;') && branch.includes('-webkit-backdrop-filter: none;'));
  }
  assert.doesNotMatch(css.slice(forcedStart), /(?:background|linear-gradient):/, 'Forced colors keep their owned system paint.');
});

test('native progress, code and keycap presentations parse with tag guards and class-only specificity', () => {
  const css = compile([
    {target: 'progress-bar', presentation: 'progress-rounded', tokens: {}, roles: {radius: 'theme.tooltip.radius'}},
    {target: 'code', presentation: 'code-subtle', tokens: {}, roles: {'font-size': 'theme.tooltip.font-size'}},
    {target: 'keycap', presentation: 'keycap-raised', tokens: {}, roles: {'font-size': 'theme.tooltip.font-size'}},
  ]).css;
  const selectors = [];
  const parsed = transform({
    filename: 'native-companions.css', code: Buffer.from(css), errorRecovery: false,
    visitor: {Rule: {style(rule) {
      if (rule.value.declarations.declarations.length) selectors.push(...rule.value.selectors);
    }}},
  });
  assert.deepEqual(parsed.warnings, [], 'Invalid selectors must fail parsing rather than silently lose their declarations.');
  for (const [tag, name] of [['progress', 'en-progress'], ['code', 'en-code'], ['kbd', 'en-keycap']]) {
    const native = selectors.filter(selector => selector.some(item => item.type === 'class' && item.name === name));
    assert.ok(native.length > 0, `${tag} retains a parsed native presentation.`);
    for (const selector of native) {
      assert.ok(selector.some(item => item.type === 'pseudo-class' && item.kind === 'where'
        && item.selectors.some(inner => inner.length === 1 && inner[0].type === 'type' && inner[0].name === tag)),
      `${tag} remains guarded without adding type specificity.`);
      assert.deepEqual(selector.filter(item => !zeroWeight(item)),
        [{type: 'class', name}], 'Only the documented native helper class contributes specificity.');
    }
  }
});

test('malformed recipe and rule maps fail with a companion diagnostic', () => {
  for (const value of [null, [], 'css', 3]) invalid(value);
  for (const value of [null, [], 'css', 3]) invalid(recipe([value]));
  for (const value of [null, [], 'color: red', 3]) {
    invalid(recipe([{...rule, tokens: value}]));
    invalid(recipe([{...rule, roles: value}]));
  }
  invalid({...recipe([rule]), rules: {first: rule}});
  invalid({...recipe([rule]), schemaVersion: 2});
});

test('finite role grammar rejects CSS, selectors, unsupported combinations and type confusion', () => {
  for (const replacement of [
    {target: 'body'}, {target: 'tooltip; body'}, {presentation: 'sectioned'},
    {presentation: 'compact; color: red'}, {variant: 'primary'},
    {roles: {padding: 'space.2'}}, {roles: {paddingInline: 'missing.token'}},
    {roles: {paddingInline: 'color.text'}}, {roles: {background: 'space.2'}},
    {roles: {fontWeight: 'font.body.line-height'}},
    {roles: {paddingInline: '0.75rem; } body { display: none'}},
    {roles: {paddingInline: {value: 12, unit: 'px'}}},
    {roles: {paddingInline: 12}}, {roles: {paddingInline: null}},
    {selector: 'body'}, {css: 'body { display: none; }'},
    {part: 'surface'}, {properties: {'padding-inline': 'space.2'}},
  ]) invalid(recipe([{...rule, ...replacement}]));
  const {presentation, ...withoutPresentation} = rule;
  invalid(recipe([withoutPresentation]));
  invalid({...recipe([rule]), css: 'body { display: none; }'});
  invalid({...recipe([rule]), selector: 'body'});
});

test('prototype property names cannot select targets, presentations, roles or token values', () => {
  for (const key of ['__proto__', 'constructor', 'toString']) {
    invalid(recipe([{...rule, target: key}]));
    invalid(recipe([{...rule, presentation: key}]));
    invalid(recipe([{...rule, roles: JSON.parse(`{"${key}":"color.text"}`)}]));
    invalid(recipe([{...rule, roles: {paddingInline: key}}]));
    invalid(recipe([{...rule, tokens: JSON.parse(`{"${key}":"color.text"}`)}]));
  }
});

test('role key order is immaterial while a changed consumed value changes CSS and identity', () => {
  const first = compile();
  const reordered = {...rule, roles: Object.fromEntries(Object.entries(roles).reverse())};
  const second = compile([reordered]);
  const cloned = compile(structuredClone([rule]));
  assert.equal(second.css, first.css);
  assert.equal(second.identity, first.identity);
  assert.equal(cloned.css, first.css);
  assert.equal(cloned.identity, first.identity);
  const changed = resolveTheme({...baseOptions, pins: {'theme.tooltip.padding-inline': {value: 1.25, unit: 'rem'}}});
  const next = compile([rule], changed);
  assertPublicInset(next.css, 'en-tooltip', 'content', 'padding', '0.25rem 1.25rem', '--en-overlay-padding');
  assert.notEqual(next.css, first.css);
  assert.notEqual(next.identity, first.identity);
  assert.ok(Object.isFrozen(first) && Object.isFrozen(first.recipe.rules[0].roles));
});

test('paired branches compile their own values at the shared boundary and exclude nested themes', () => {
  const pair = createThemePair({
    name: 'paired-components', light: theme,
    dark: resolveTheme({...baseOptions, mode: 'dark', pins: {'theme.tooltip.background': colorFromHex('#abcdef')}}),
  });
  const markers = new Set();
  for (const mode of ['light', 'dark']) {
    const result = createThemeCompanion(pair[mode], recipe([rule]), {name: pair.name});
    const { descendant, root, rules } = assertCompanionBoundary(result.css, pair.name, mode);
    for (const guard of [descendant, root]) {
      assert.ok(result.css.includes(`:where(en-tooltip)${guard}`),
        'Component targets retain zero-specificity hook defaults in both delivery paths.');
      assert.ok(result.css.includes(`.en-tooltip${guard}`),
        'Native presentation targets retain the documented helper class weight in both delivery paths.');
      assert.ok(rules.some(({ selector }) => selector.includes(`:where(en-tooltip)${guard}::part(surface)`)),
        'Part selectors guard the originating host before selecting the public surface.');
    }
    const scope = `[data-en-theme="paired-components"][data-en-appearance="${mode}"]`;
    const marker = `--en-companion-paired-components-${mode}`;
    markers.add(marker);
    assert.ok(result.css.includes(`:where([data-en-theme]) { container-name: --en-theme-companion; ${marker}: initial; }`),
      'Every full boundary resets this branch, including boundaries with the same theme name.');
    assert.ok(result.css.includes(`${scope} { ${marker}: 1; }`),
      'Exact branch activation outranks later zero-specificity automatic-appearance resets.');
    assert.ok(result.css.includes(`@container --en-theme-companion style(${marker}: 1)`));
    assert.ok(result.css.includes(':where(en-tooltip):not(:where([data-en-theme]))::part(content)'),
      'A descendant Part uses the nearest named boundary and excludes a full-boundary host.');
    assert.ok(result.css.includes(`:where(en-tooltip):where(${scope})::part(content)`),
      'A matching full-boundary component receives its own branch directly.');
    assert.ok(result.css.includes('.en-tooltip:not(:where([data-en-theme]))'));
    assert.ok(result.css.includes(`.en-tooltip:where(${scope})`),
      'Native presentation targets preserve class weight and include a matching boundary.');
    assert.doesNotMatch(result.css, /@scope|:scope|container-type:/);
    parsedStyleRules(result.css);
    assert.match(result.css, mode === 'light'
      ? /background: var\(--en-overlay-background, rgb\(18 52 86 \/ 1\)\);/
      : /background: var\(--en-overlay-background, rgb\(171 205 239 \/ 1\)\);/);
  }
  assert.equal(markers.size, 2, 'Light and dark branches do not reset each other’s marker.');
  const other = createThemeCompanion(pair.light, recipe([rule]), {name: 'another-pair'});
  assert.match(other.css, /--en-companion-another-pair-light/);
  assert.doesNotMatch(other.css, /--en-companion-paired-components-/,
    'An independently installed pair cannot clear this pair’s activity.');
});

test('trusted role source survives managed edit, undo and draft export reopening', () => {
  const draft = createReviewDraft(baseOptions);
  const before = compile([rule], draft.theme);
  draft.setToken('theme.tooltip.padding-inline', '{space.4}');
  const edited = compile([rule], draft.theme);
  assertPublicInset(edited.css, 'en-tooltip', 'content', 'padding', '0.25rem 1rem', '--en-overlay-padding');
  assert.notEqual(edited.identity, before.identity);
  const metadata = {title: 'Component role source', rationale: 'Preserve trusted typed roles through managed editing.'};
  const reopened = reopenReviewDraft(draft.exportJSON(metadata), {baseOptions});
  assert.equal(compile([rule], reopened.theme).css, edited.css);
  assert.equal(compile([rule], reopened.theme).identity, edited.identity);
  assert.equal(draft.undo(), true);
  assert.equal(compile([rule], draft.theme).css, before.css);
  assert.equal(compile([rule], draft.theme).identity, before.identity);
});

test('finite feedback roles supply CSS-only hook defaults without promoting arbitrary hook maps', () => {
  const variants = ['neutral', 'accent', 'success', 'warning', 'danger'];
  const rules = variants.map(variant => ({
    target: 'badge', variant, presentation: 'badge-subtle', tokens: {},
    roles: {background: 'theme.tooltip.background', color: 'theme.tooltip.color'},
  }));
  rules.push(
    {target: 'skeleton', presentation: 'skeleton-pulse', tokens: {}, roles: {background: 'theme.tooltip.background'}},
    {target: 'progress-steps', presentation: 'steps-indicators', tokens: {}, roles: {gap: 'theme.tooltip.padding-inline'}},
  );
  const css = compile(rules).css;
  assert.match(css, /--en-badge-background: rgb\(18 52 86 \/ 1\);/);
  assert.match(css, /--en-badge-color: rgb\(255 255 255 \/ 1\);/);
  assert.match(css, /--en-skeleton-color: rgb\(18 52 86 \/ 1\);/);
  assert.match(css, /--en-progress-steps-gap: 0\.75rem;/);
  for (const variant of variants) {
    assert.ok(css.includes(`:where(en-badge[variant="${variant}"])`));
    assert.ok(css.includes(`:where(.en-badge[data-variant="${variant}"])`));
  }
  const expectedHooks = new Set(['--en-badge-background', '--en-badge-color', '--en-skeleton-color', '--en-progress-steps-gap']);
  const seenHooks = new Set();
  const hookBlocks = parsedStyleRules(css).filter(block =>
    (block.declarations?.declarations ?? []).some(declaration => declaration.property === 'custom'
      && expectedHooks.has(declaration.value.name)));
  assert.ok(hookBlocks.length > 0);
  for (const block of hookBlocks) {
    for (const declaration of block.declarations.declarations) {
      if (declaration.property === 'custom' && expectedHooks.has(declaration.value.name)) seenHooks.add(declaration.value.name);
    }
    for (const selector of block.selectors) {
      assert.ok(selector.every(zeroWeight),
        'Both descendant and direct-boundary hook defaults leave consumer classes and inline properties authoritative.');
    }
  }
  assert.deepEqual(seenHooks, expectedHooks, 'Every finite CSS-only hook has an emitted default.');
  for (const property of ['badge-background', 'skeleton-color']) {
    assert.match(css, new RegExp(`@media \\(forced-colors: none\\) \\{\\s*@container [^{]+\\{\\s*[^{]+\\{\\s*--en-${property}:`),
      'Themed paint defaults leave forced-color handling to the component.');
  }
});

test('feedback role defaults retain strict finite names and token types', () => {
  for (const candidate of [
    {target: 'badge', variant: 'neutral', presentation: 'badge-subtle', tokens: {}, roles: {background: 'space.2'}},
    {target: 'badge', variant: 'neutral', presentation: 'badge-subtle', tokens: {}, roles: {color: 'space.2'}},
    {target: 'skeleton', presentation: 'skeleton-pulse', tokens: {}, roles: {background: 'space.2'}},
    {target: 'progress-steps', presentation: 'steps-indicators', tokens: {}, roles: {gap: 'color.text'}},
    {target: 'skeleton', presentation: 'skeleton-pulse', tokens: {}, roles: {'--en-arbitrary-background': 'color.text'}},
    {target: 'badge', variant: 'neutral', tokens: {'--en-badge-background': 'color.surface'}},
    {target: 'badge', variant: 'neutral', tokens: {'--en-badge-color': 'color.text'}},
    {target: 'skeleton', tokens: {'--en-skeleton-color': 'color.surface'}},
    {target: 'progress-steps', tokens: {'--en-progress-steps-gap': 'space.2'}},
  ]) invalid(recipe([candidate]));
});

test('omitted feedback roles do not assign CSS-only hook defaults', () => {
  const css = compile([
    {target: 'badge', presentation: 'badge-subtle', tokens: {}, roles: {'inline-padding': 'theme.tooltip.padding-block'}},
    {target: 'skeleton', presentation: 'skeleton-pulse', tokens: {}, roles: {}},
    {target: 'progress-steps', presentation: 'steps-indicators', tokens: {}, roles: {'control-gap': 'theme.tooltip.padding-inline'}},
  ]).css;
  assert.doesNotMatch(css, /--en-(?:badge-background|badge-color|skeleton-color|progress-steps-gap):/);
  assert.match(css, /::part\(control\)[^{]*\{[^}]*gap: 0\.75rem;/,
    'The step control gap remains independent of the public list-gap override.');
});

test('source toast rail preserves status paint hooks, logical geometry and native delivery', () => {
  // Independently transcribed Web Awesome3.13 Default fill-loud palette values.
  const railTheme = resolveTheme({source: tokenDocument({
    'theme.toast.width': {$type: 'dimension', $value: {value: 4, unit: 'px'}},
    'theme.toast.gap': {$type: 'dimension', $value: {value: 1, unit: 'rem'}},
    'theme.toast.icon-scale': {$type: 'number', $value: 1.25},
    'theme.toast.plate': {$type: 'color', $value: colorFromHex('#ffffff')},
    ...Object.fromEntries(Object.entries({info: '#0071ec', success: '#00883c', warning: '#b45f04', danger: '#dc3146'})
      .map(([variant, value]) => [`theme.toast.${variant}`, {$type: 'color', $value: colorFromHex(value)}])),
  })});
  const railRule = {target: 'toast', presentation: 'toast-accent-rail', tokens: {}, roles: {
    accentWidth: 'theme.toast.width', background: 'theme.toast.plate',
    iconScale: 'theme.toast.icon-scale', gap: 'theme.toast.gap',
    infoAccent: 'theme.toast.info', successAccent: 'theme.toast.success',
    warningAccent: 'theme.toast.warning', dangerAccent: 'theme.toast.danger',
  }};
  const css = compile([railRule], railTheme).css;
  assertCompanionBoundary(css, 'component-review', 'light');
  assert.match(css, /@media \(forced-colors: none\)/);
  assert.match(css, /column-gap: 1rem;/);
  for (const size of ['', '-small', '-medium', '-large']) assert.ok(css.includes(`--en-size-icon${size}: calc(1em * 1.25);`));
  assert.ok(css.includes('inline-size: var(--en-icon-size, calc(1em * 1.25)); block-size: var(--en-icon-size, calc(1em * 1.25));'));
  assert.doesNotMatch(css, /--en-icon-size\s*:/, 'Inherited explicit icon-size overrides remain first.');
  assert.match(css, /:not\(:has\(> \.en-toast__icon\)\) > \.en-toast__body:not\(\[data-en-theme\]\) > \.en-toast__(?:content|actions)[^{}]*\{ grid-column: 1 \/ 3; margin-inline-start: 4px;/);
  assert.match(css, /en-toast[^{}]*::part\(base\)[^{}]*\{ grid-template-columns: minmax\(4px, auto\) minmax\(0, 1fr\) auto;/);
  assert.match(css, /en-toast[^{}]*::part\(icon\)[^{}]*\{ margin-inline-start: 4px;/);
  assert.match(css, /\.en-toast__icon:not\(\[data-en-theme\]\)[^{}]*\{ margin-inline-start: 4px;/);
  assert.match(css, /:dir\(rtl\)[^{}]*::part\(base\)[^{}]*\{ background: linear-gradient\([^;]+ right top \/ 4px 100% no-repeat padding-box,/);
  assert.match(css, /\.en-toast[^{}]*:dir\(rtl\)[^{}]*\{ background: linear-gradient\([^;]+ right top \/ 4px 100% no-repeat padding-box,/);
  for (const [variant, channels] of Object.entries({info: '0 113 236', success: '0 136 60', warning: '180 95 4', danger: '220 49 70'})) {
    assert.ok(css.includes(`linear-gradient(rgb(${channels} / 1), rgb(${channels} / 1)) left top / 4px 100% no-repeat padding-box, var(--en-toast-${variant}-background, var(--en-toast-background, rgb(255 255 255 / 1)));`));
    assert.ok(css.includes(`[variant="${variant}"]`));
    assert.ok(css.includes(`[data-variant="${variant}"]`));
  }
  // Color-or-gradient overrides stay intact in the last background layer.
  // Geometry must never calc or locally assign the arbitrary padding shorthand.
  assert.doesNotMatch(css, /--en-toast-(?:padding|background|(?:info|success|warning|danger)-background)\s*:/);
  assert.doesNotMatch(css, /padding(?:-[a-z-]+)?\s*:|::(?:before|after)|box-shadow\s*:|border(?:-[a-z-]+)?\s*:|display\s*:/);
  const omitted = compile([{...railRule, roles: {infoAccent: 'theme.toast.info'}}], railTheme).css;
  assert.doesNotMatch(omitted, /linear-gradient|margin-inline-start|grid-template-columns/);
  assert.throws(() => compile([{...railRule, roles: {...railRule.roles, accentWidth: 'theme.toast.info'}}], railTheme), {code: 'invalid-companion'});
});
