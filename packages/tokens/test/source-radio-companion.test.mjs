import test from 'node:test';
import assert from 'node:assert/strict';
import { colorFromHex, createThemeCompanion, resolveTheme, tokenDocument } from '../dist/index.js';
import { assertCompanionBoundary } from './companion-boundary-support.mjs';

// Independent Spectrum 2 v1.7.1 literals, traced through RadioGroup.tsx:265–306,
// RadioGroup.mjs:298–305,344–369 and RadioGroup.css:207–216,351–380. Selected
// non-emphasized radios inherit neutral wrapper currentColor; selected invalid
// radios use the same explicit negative border branch as unchecked radios.
const palette = {
  light: {surface: '#ffffff', rest: '#292929', interactive: '#131313', invalid: '#d73220', invalidInteractive: '#b72818', disabled: '#c6c6c6'},
  dark: {surface: '#111111', rest: '#dbdbdb', interactive: '#f2f2f2', invalid: '#fc432e', invalidInteractive: '#ff6756', disabled: '#444444'},
};
const stateRoles = [
  'hoverBorder', 'focusBorder', 'pressedBorder',
  'selectedHoverBackground', 'selectedFocusBackground', 'selectedPressedBackground',
  'invalidBorder', 'invalidHoverBorder', 'invalidFocusBorder', 'invalidPressedBorder',
  'invalidSelectedBackground', 'invalidSelectedHoverBackground', 'invalidSelectedFocusBackground', 'invalidSelectedPressedBackground',
  'disabledSelectedBackground',
];
const rgb = hex => `rgb(${[1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16)).join(' ')} / 1)`;
const id = role => `theme.radio.${role.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`;
const selected = hex => `var(--en-radio-selected-color, ${rgb(hex)})`;
const pressed = color => `var(--en-radio-pressed-border-color, ${color})`;

function fixture(mode = 'light', replacements = {}) {
  const p = palette[mode];
  const values = {
    background: p.surface, border: p.rest, selectedBackground: p.rest, selectedDotColor: p.surface,
    hoverBorder: p.interactive, focusBorder: p.interactive, pressedBorder: p.interactive,
    selectedHoverBackground: p.interactive, selectedFocusBackground: p.interactive, selectedPressedBackground: p.interactive,
    invalidBorder: p.invalid, invalidSelectedBackground: p.invalid,
    invalidHoverBorder: p.invalidInteractive, invalidFocusBorder: p.invalidInteractive, invalidPressedBorder: p.invalidInteractive,
    invalidSelectedHoverBackground: p.invalidInteractive, invalidSelectedFocusBackground: p.invalidInteractive, invalidSelectedPressedBackground: p.invalidInteractive,
    disabledBackground: p.surface, disabledSelectedBackground: p.disabled, disabledBorder: p.disabled, disabledDotColor: p.surface,
    ...replacements,
  };
  return {
    theme: resolveTheme({mode, source: tokenDocument(Object.fromEntries(Object.entries(values).map(([role, value]) =>
      [id(role), {$type: 'color', $value: colorFromHex(value)}])))}),
    roles: Object.fromEntries(Object.keys(values).map(role => [role, id(role)])),
  };
}
function compile({theme, roles} = fixture()) {
  return createThemeCompanion(theme, {
    schemaVersion: 1, id: 'independent-source-radio', rules: [{target: 'filled-radio', presentation: 'filled', tokens: {}, roles}],
  }, {name: 'source-radio-review'}).css;
}
function splitSelectors(list) {
  const selectors = [];
  let depth = 0, start = 0;
  for (let index = 0; index < list.length; index++) {
    if (list[index] === '(' || list[index] === '[') depth++;
    if (list[index] === ')' || list[index] === ']') depth--;
    if (list[index] === ',' && depth === 0) { selectors.push(list.slice(start, index).trim()); start = index + 1; }
  }
  return [...selectors, list.slice(start).trim()];
}
function rules(css) {
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].flatMap(([, selectors, body]) => {
    const declarations = Object.fromEntries(body.split(';').map(entry => entry.trim()).filter(Boolean).map(entry => {
      const colon = entry.indexOf(':');
      return [entry.slice(0, colon).trim(), entry.slice(colon + 1).trim()];
    }));
    return splitSelectors(selectors).map(selector => ({selector, declarations}));
  });
}
function stateRules(css, {native, invalid = false, checked = false, state}) {
  return rules(css).filter(({selector}) => {
    if (native ? selector.includes('::part(') || !selector.startsWith('.en-radio') : !selector.includes(`::part(${invalid ? 'control-invalid' : 'control'})`)) return false;
    if (native && selector.includes(':is([aria-invalid="true"], :user-invalid)') !== invalid) return false;
    if (!selector.includes(':enabled')) return false;
    if (checked ? selector.includes(':not(:checked)') || !selector.includes(':checked') : !selector.includes(':not(:checked)')) return false;
    if (state) return selector.includes(`:${state}`);
    return !/:hover|:focus-visible|:active/.test(selector);
  });
}
function hasPaint(css, options, property, value) {
  const found = stateRules(css, options);
  assert.ok(found.length >= 2, `Expected descendant and direct-root ${JSON.stringify(options)} delivery.`);
  for (const rule of found) assert.equal(rule.declarations[property], value, `${rule.selector}: ${property}`);
  return found;
}

for (const mode of ['light', 'dark']) test(`Spectrum ${mode} radio states use verified neutral/negative paint on custom and native inputs`, () => {
  const {theme, roles} = fixture(mode);
  const css = compile({theme, roles});
  const p = palette[mode];
  assertCompanionBoundary(css, 'source-radio-review', mode);
  for (const native of [false, true]) {
    for (const state of ['hover', 'focus-visible', 'active']) {
      const border = rgb(p.interactive);
      const fill = selected(p.interactive);
      hasPaint(css, {native, state}, 'border-color', state === 'active' ? pressed(border) : border);
      hasPaint(css, {native, state, checked: true}, 'background', fill);
      hasPaint(css, {native, state, checked: true}, 'border-color', state === 'active' ? pressed(fill) : fill);
      const invalid = rgb(p.invalidInteractive);
      hasPaint(css, {native, state, invalid: true}, 'border-color', state === 'active' ? pressed(invalid) : invalid);
      const invalidSelected = selected(p.invalidInteractive);
      hasPaint(css, {native, state, invalid: true, checked: true}, 'background', invalidSelected);
      hasPaint(css, {native, state, invalid: true, checked: true}, 'border-color', state === 'active' ? pressed(invalidSelected) : invalidSelected);
    }
    hasPaint(css, {native, invalid: true}, 'border-color', rgb(p.invalid));
    hasPaint(css, {native, invalid: true, checked: true}, 'background', selected(p.invalid));
    const disabled = rules(css).filter(({selector}) => native
      ? selector.startsWith('.en-radio') && selector.includes(':disabled')
      : selector.includes('::part(control):disabled'));
    assert.ok(disabled.some(({selector, declarations}) => !selector.includes(':checked') && declarations.background === rgb(p.surface) && declarations['border-color'] === rgb(p.disabled)));
    assert.ok(disabled.some(({selector, declarations}) => selector.includes(':checked') && !selector.includes('::before') && declarations.background === rgb(p.disabled)));
    assert.ok(disabled.some(({selector, declarations}) => selector.includes(':checked') && selector.endsWith('::before') && declarations.background === rgb(p.surface)));
  }
});

test('radio interaction delivery covers label whitespace, guarded control state and invalid Part precedence', () => {
  const css = compile();
  for (const state of ['hover', 'active']) {
    for (const invalid of [false, true]) {
      for (const checked of [false, true]) {
        const custom = stateRules(css, {native: false, state, invalid, checked});
        assert.ok(custom.some(({selector}) => selector.indexOf(`:${state}`) < selector.indexOf('::part(')), 'Host state covers label whitespace.');
        assert.ok(custom.some(({selector}) => selector.indexOf(`:${state}`) > selector.indexOf('::part(')), 'The exposed control also carries direct pointer state.');
        for (const {selector} of custom) assert.ok(selector.includes(':not(:disabled):not([aria-disabled="true"])') && selector.includes(':enabled'), 'Input :enabled excludes fieldset/group disabling, alongside host ARIA disabling.');
        for (const {selector} of stateRules(css, {native: true, state, invalid, checked})) {
          assert.ok(selector.includes(':enabled:not([aria-disabled="true"])'));
          assert.ok(selector.includes(`:is(:${state}, .en-choice:${state} > .en-radio)`), 'The native label path reaches the core held-state specificity.');
        }
        const normal = stateRules(css, {native: false, state, invalid: false, checked});
        const errors = stateRules(css, {native: false, state, invalid: true, checked});
        for (const error of errors) {
          const ordinary = error.selector.replace('::part(control-invalid)', '::part(control)');
          assert.ok(normal.some(({selector}) => selector === ordinary), 'Invalid selectors mirror ordinary specificity.');
          assert.ok(css.indexOf(error.selector) > css.indexOf(ordinary), 'Overlapping invalid Parts follow ordinary paint.');
        }
      }
    }
  }
  for (const {selector} of stateRules(css, {native: false, state: 'focus-visible'})) assert.ok(selector.includes('::part(control):enabled:not(:checked):focus-visible'));
  for (const {selector} of stateRules(css, {native: true, state: 'focus-visible'})) assert.ok(selector.includes(':is(:focus-visible, .en-choice > .en-radio:focus-visible)'), 'Focus keeps hover specificity so later state order is effective.');
  assert.doesNotMatch(css, /\[checked\]|(?<!-):invalid\b|pointer-events:|forced-color-adjust:|outline(?:-\w+)?:|--en-radio-(?:selected-color|pressed-border-color):/);
  const paint = css.indexOf('@media (forced-colors: none)');
  assert.ok(paint >= 0);
  assert.doesNotMatch(css.slice(0, paint), /(?:^|[;{]\s*)(?:background|border-color):/m);
  assert.ok(css.includes('@media (hover: hover)'));
});

test('ARIA-disabled radio paint overrides source interactions and native held paint without changing semantics', () => {
  const css = compile();
  const disabled = rules(css).filter(({selector}) => selector.includes('[aria-disabled="true"]')
    && !selector.includes(':not([aria-disabled="true"])'));
  const host = disabled.filter(({selector}) => selector.includes('::part(control)'));
  const native = disabled.filter(({selector}) => selector.startsWith('.en-radio'));
  for (const surface of [host, native]) {
    assert.ok(surface.some(({selector, declarations}) => !selector.includes(':checked') && declarations.background === rgb(palette.light.surface) && declarations['border-color'] === rgb(palette.light.disabled)));
    assert.ok(surface.some(({selector, declarations}) => selector.includes(':checked') && !selector.includes('::before') && declarations.background === rgb(palette.light.disabled)));
    assert.ok(surface.some(({selector, declarations}) => selector.includes(':checked') && selector.endsWith('::before') && declarations.background === rgb(palette.light.surface)));
  }
  assert.ok(native.some(({selector}) => selector.includes('[aria-disabled="true"]:not(:disabled):is(:active, .en-choice:active > .en-radio)')), 'ARIA disabled paint matches the existing core native held-state specificity.');
  for (const {selector} of host) assert.ok(selector.indexOf('[aria-disabled="true"]') < selector.indexOf('::part('), 'ARIA attributes remain on the public host, never after its Part.');
  assert.doesNotMatch(css, /pointer-events:|cursor:|tabindex|forced-color-adjust:/);
});

test('radio state roles remain independent and invalid rest paint supplies only its own missing state defaults', () => {
  const source = fixture('light', {
    hoverBorder: '#112233', focusBorder: '#223344', pressedBorder: '#334455',
    selectedHoverBackground: '#445566', selectedFocusBackground: '#556677', selectedPressedBackground: '#667788',
  });
  const css = compile(source);
  for (const [state, border, fill] of [['hover', '#112233', '#445566'], ['focus-visible', '#223344', '#556677'], ['active', '#334455', '#667788']]) {
    for (const native of [false, true]) {
      hasPaint(css, {native, state}, 'border-color', state === 'active' ? pressed(rgb(border)) : rgb(border));
      hasPaint(css, {native, state, checked: true}, 'background', selected(fill));
    }
  }
  const ordinaryOnly = compile({...source, roles: Object.fromEntries(Object.entries(source.roles).filter(([role]) => !role.startsWith('invalid')))});
  assert.doesNotMatch(ordinaryOnly, /aria-invalid|user-invalid|control-invalid/, 'Omitting all invalid roles preserves ordinary paint equally for custom and native inputs.');
  const roles = Object.fromEntries(Object.entries(source.roles).filter(([role]) => !/^invalid(?:Hover|Focus|Pressed|Selected(?:Hover|Focus|Pressed))/.test(role)));
  const fallback = compile({...source, roles});
  for (const native of [false, true]) for (const state of ['hover', 'focus-visible', 'active']) {
    hasPaint(fallback, {native, state, invalid: true}, 'border-color', state === 'active' ? pressed(rgb(palette.light.invalid)) : rgb(palette.light.invalid));
    hasPaint(fallback, {native, state, invalid: true, checked: true}, 'background', selected(palette.light.invalid));
  }
});

test('omitted radio state roles preserve legacy filled themes and every new role is color-typed', () => {
  const source = fixture();
  const roles = Object.fromEntries(Object.entries(source.roles).filter(([role]) => !stateRoles.includes(role)));
  const css = compile({...source, roles});
  assert.doesNotMatch(css, /:enabled|:hover|:focus-visible|control-invalid|--en-radio-pressed-border-color/);
  assert.ok(css.includes(`background: ${selected(palette.light.rest)}; border-color: ${selected(palette.light.rest)};`));
  assert.ok(!rules(css).some(({selector}) => selector.includes(':disabled') && selector.includes(':checked') && !selector.includes('::before')), 'An omitted disabled selected role retains the legacy shared disabled fill.');
  for (const role of stateRoles) assert.throws(() => compile({...source, roles: {[role]: 'space.2'}}), {code: 'invalid-companion'});
  assert.throws(() => compile({...source, roles: {unknownRadioState: 'color.text'}}), {code: 'invalid-companion'});
});
