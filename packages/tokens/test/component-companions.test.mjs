import test from 'node:test';
import assert from 'node:assert/strict';
import { transform } from 'lightningcss';
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

test('public companion compiler binds typed tooltip roles to documented surfaces and local hooks', () => {
  const result = compile();
  assert.equal(result.kind, 'theme-companion');
  assert.equal(result.sourceHash, theme.sourceHash);
  assert.match(result.css, /--en-overlay-background: rgb\(18 52 86 \/ 1\);/);
  assert.match(result.css, /--en-overlay-color: rgb\(255 255 255 \/ 1\);/);
  assert.match(result.css, /--en-overlay-radius: 6px;/);
  assert.match(result.css, /::part\(surface\)\s*\{[^}]*font-size: 0\.875rem;[^}]*line-height: 1\.5;[^}]*font-weight: 500;/);
  assertPublicInset(result.css, 'en-tooltip', 'content', 'padding-inline', '0.75rem', '--en-overlay-padding');
  assertPublicInset(result.css, 'en-tooltip', 'content', 'padding-block', '0.25rem', '--en-overlay-padding');
  assert.match(result.css, /@media \(forced-colors: none\)/);
  assert.match(result.css, /:where\(\.en-tooltip\)/, 'The documented native helper receives the same presentation.');
  assert.doesNotMatch(result.css, /outline:\s*(?:none|0)(?:;|\s)/);
});

test('optional roles preserve absent declarations and legacy hook rules remain usable', () => {
  const css = compile([{...rule, roles: {paddingInline: 'theme.tooltip.padding-inline'}}]).css;
  assertPublicInset(css, 'en-tooltip', 'content', 'padding-inline', '0.75rem', '--en-overlay-padding');
  assert.doesNotMatch(css, /(?:--en-overlay-radius|--en-overlay-background|padding-block|font-size):/);
  const legacy = compile([{target: 'button', variant: 'ghost', tokens: {'--en-button-rest-background': 'color.selected'}}]);
  assert.match(legacy.css, /en-button\[variant="ghost"\]/);
  assert.match(legacy.css, /\.en-button\[data-variant="ghost"\]/);
  assert.match(legacy.css, /--en-button-rest-background:/);
});

test('public exports register distinct surface presentations rather than silently dropping their roles', () => {
  const css = compile([
    {target: 'dialog', presentation: 'sectioned', tokens: {}, roles: {sectionInlinePadding: 'theme.tooltip.padding-inline'}},
    {target: 'drawer', presentation: 'sectioned', tokens: {}, roles: {bodyBlockEndPadding: 'theme.tooltip.padding-block'}},
    {target: 'popover', presentation: 'sectioned', tokens: {}, roles: {padding: 'theme.tooltip.padding-inline'}},
    {target: 'card', presentation: 'sectioned', tokens: {}, roles: {bodyPadding: 'theme.tooltip.padding-block'}},
    {target: 'menu', presentation: 'compact-surface', tokens: {}, roles: {radius: 'theme.tooltip.radius'}},
  ]).css;
  assertPublicInset(css, 'en-dialog', 'header', 'padding-inline', '0.75rem', '--en-overlay-padding');
  assertPublicInset(css, 'en-drawer', 'body', 'padding-block-end', '0.25rem', '--en-overlay-padding', true);
  assertPublicInset(css, 'en-popover', 'body', 'padding', '0.75rem', '--en-overlay-padding', true);
  assertPublicInset(css, 'en-card', 'content', 'padding-block', '0.25rem', '--en-surface-padding');
  assert.match(css, /en-menu[^{]*\{[^}]*--en-option-list-radius: 6px;/);
});

test('public compiler connects control, feedback, navigation and collection presentations', () => {
  const css = compile([
    {target: 'checkbox', presentation: 'solid', tokens: {}, roles: {gap: 'theme.tooltip.padding-inline'}},
    {target: 'badge', presentation: 'badge-subtle', tokens: {}, roles: {'inline-padding': 'theme.tooltip.padding-block'}},
    {target: 'tabs', presentation: 'line', tokens: {}, roles: {gap: 'theme.tooltip.padding-inline'}},
    {target: 'calendar', presentation: 'solid-date-selection', tokens: {}, roles: {'heading-weight': 'theme.tooltip.font-weight'}},
  ]).css;
  assert.match(css, /en-checkbox[^\n]*::part\(label\)[^{]*\{[^}]*gap: 0\.75rem;/);
  assert.match(css, /en-badge[^\n]*::part\(base\)[^{]*\{[^}]*padding-inline: 0\.25rem;/);
  assert.match(css, /en-tabs[^\n]*::part\(tab-list\)[^{]*\{[^}]*gap: 0\.75rem;/);
  assert.match(css, /en-calendar[^\n]*::part\(heading\)[^{]*\{[^}]*font-weight: 500;/);
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
  assertPublicInset(next.css, 'en-tooltip', 'content', 'padding-inline', '1.25rem', '--en-overlay-padding');
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
      ? /--en-overlay-background: rgb\(18 52 86 \/ 1\);/
      : /--en-overlay-background: rgb\(171 205 239 \/ 1\);/);
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
  assertPublicInset(edited.css, 'en-tooltip', 'content', 'padding-inline', '1rem', '--en-overlay-padding');
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
