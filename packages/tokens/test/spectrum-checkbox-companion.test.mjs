import test from 'node:test';
import assert from 'node:assert/strict';
import { colorFromHex, createThemeCompanion, resolveTheme, tokenDocument } from '../dist/index.js';
import { assertCompanionBoundary } from './companion-boundary-support.mjs';

// Independent Spectrum S2 literals, retained in the spectrum-react showcase:
// @react-spectrum/s2/src/Checkbox.tsx:155–185 (paint), :241–243 (checked/mixed),
// style/spectrum-theme.ts:241–249 (hover/focus-visible/press), and
// dist/private/Checkbox.css:300–366 (resolved light/dark values).
// No candidate definition, updater, emitted CSS, or presentation registry is imported.
const source = {
  light: { surface: '#ffffff', neutral: '#292929', interactive: '#131313', invalid: '#d73220', invalidInteractive: '#b72818', disabled: '#c6c6c6' },
  dark: { surface: '#111111', neutral: '#dbdbdb', interactive: '#f2f2f2', invalid: '#fc432e', invalidInteractive: '#ff6756', disabled: '#444444' },
};
const legacyRoles = ['background', 'borderColor', 'selectedBackground', 'selectedColor', 'invalidBorderColor', 'invalidBackground', 'invalidSelectedColor'];
const addedRoles = ['interactiveBorderColor', 'interactiveSelectedBackground', 'invalidInteractiveBorderColor', 'invalidInteractiveBackground', 'disabledBackground', 'disabledBorderColor', 'disabledSelectedBackground', 'disabledSelectedColor'];
const tokenId = role => `theme.checkbox.${role.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`;
const rgb = hex => `rgb(${[1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16)).join(' ')} / 1)`;
const dimension = value => ({ $type: 'dimension', $value: { value, unit: 'px' } });

function fixture(mode = 'light', sentinels = false) {
  const palette = source[mode];
  const values = {
    background: palette.surface, borderColor: palette.neutral,
    selectedBackground: palette.neutral, selectedColor: palette.surface,
    invalidBorderColor: palette.invalid, invalidBackground: palette.invalid, invalidSelectedColor: palette.surface,
    interactiveBorderColor: palette.interactive, interactiveSelectedBackground: palette.interactive,
    invalidInteractiveBorderColor: palette.invalidInteractive, invalidInteractiveBackground: palette.invalidInteractive,
    disabledBackground: palette.surface, disabledBorderColor: palette.disabled,
    disabledSelectedBackground: palette.disabled, disabledSelectedColor: palette.surface,
  };
  // Distinct fixture colors expose omissions that equal source aliases would hide.
  if (sentinels) addedRoles.forEach((role, index) => { values[role] = `#1234${(index + 32).toString(16)}`; });
  const tokens = Object.fromEntries(Object.entries(values).map(([role, value]) => [tokenId(role), { $type: 'color', $value: colorFromHex(value) }]));
  tokens['theme.checkbox.dimension'] = dimension(2);
  tokens['theme.checkbox.dimension-small'] = dimension(1);
  tokens['theme.checkbox.dimension-large'] = dimension(3);
  const theme = resolveTheme({ mode, source: tokenDocument(tokens) });
  const roles = Object.fromEntries(Object.keys(values).map(role => [role, tokenId(role)]));
  return { theme, roles, values };
}

function compile(fixture, roles = fixture.roles) {
  return createThemeCompanion(fixture.theme, {
    schemaVersion: 1, id: 'independent-spectrum-checkbox',
    rules: [{ target: 'spectrum-checkbox', presentation: 'neutral-selected', tokens: {}, ...(roles === null ? {} : { roles }) }],
  }, { name: 'spectrum-checkbox-review' }).css;
}

function selectorList(value) {
  const selectors = [];
  let start = 0, depth = 0;
  for (let index = 0; index < value.length; index++) {
    if (value[index] === '(' || value[index] === '[') depth++;
    if (value[index] === ')' || value[index] === ']') depth--;
    if (value[index] === ',' && depth === 0) { selectors.push(value.slice(start, index).trim()); start = index + 1; }
  }
  selectors.push(value.slice(start).trim());
  return selectors;
}

function rules(css) {
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].flatMap(match => {
    const declarations = Object.fromEntries(match[2].split(';').map(entry => entry.trim()).filter(Boolean).map(entry => {
      const colon = entry.indexOf(':');
      return [entry.slice(0, colon).trim(), entry.slice(colon + 1).trim()];
    }));
    return selectorList(match[1]).map(selector => ({ selector, declarations, index: match.index }));
  }).filter(({ selector }) => selector.includes('en-checkbox'));
}

const isCustom = selector => selector.includes('::part(');
const isInvalid = selector => /::part\(control-invalid\)|:is\(\[aria-invalid="true"\], :user-invalid\)/.test(selector);
const isSelected = selector => selector.includes(':is(:checked, :indeterminate)');
const isMark = selector => selector.endsWith('::before');
const isUnchecked = selector => selector.includes(':not(:checked):not(:indeterminate)');
const isDisabled = selector => selector.includes(':is(:disabled, :enabled[aria-disabled="true"])')
  || selector.includes('::part(control):disabled')
  || selector.includes('[aria-disabled="true"]') && !selector.includes(':not([aria-disabled="true"])');
const hasInteraction = (selector, state) => selector.replaceAll(':not(:active)', '').includes(state);
const hasPaint = declarations => Object.keys(declarations).some(property => ['background', 'background-color', 'border-color', 'color'].includes(property));

function expectRule(css, predicate, expected, label) {
  const candidates = rules(css).filter(rule => predicate(rule.selector));
  const matching = candidates.filter(rule => Object.entries(expected).every(([property, value]) => rule.declarations[property] === value));
  assert.ok(matching.length, `${label}: expected ${JSON.stringify(expected)}; got ${JSON.stringify(candidates)}`);
  assert.ok(matching.some(rule => rule.selector.includes(':not(:where([data-en-theme]))')), `${label}: ordinary descendants receive the paint`);
  assert.ok(matching.some(rule => /:where\(\[data-en-theme="spectrum-checkbox-review"\]\[data-en-appearance="(?:light|dark)"\]\)/.test(rule.selector)), `${label}: a matching full-theme boundary receives the paint directly`);
  return matching;
}

function mediaRanges(css, pattern) {
  const guards = [];
  for (const match of css.matchAll(pattern)) {
    let depth = 1, end = match.index + match[0].length;
    for (; depth && end < css.length; end++) {
      if (css[end] === '{') depth++;
      if (css[end] === '}') depth--;
    }
    guards.push([match.index, end]);
  }
  return guards;
}

function guardedPaint(css) {
  // Inspect nesting, not merely a preceding media string: later unguarded paint
  // must fail too, including the direct full-theme-boundary delivery branch.
  const guards = mediaRanges(css, /@media\s*\(forced-colors:\s*none\)\s*\{/g);
  const hover = mediaRanges(css, /@media\s*\(hover:\s*hover\)\s*\{/g);
  const paint = rules(css).filter(rule => hasPaint(rule.declarations));
  assert.ok(paint.length);
  for (const rule of paint) assert.ok(guards.some(([start, end]) => rule.index > start && rule.index < end),
    `Author paint stays inside forced-colors:none: ${rule.selector}`);
  for (const rule of paint.filter(rule => hasInteraction(rule.selector, ':hover'))) assert.ok(hover.some(([start, end]) => rule.index > start && rule.index < end),
    `Hover paint stays inside hover:hover: ${rule.selector}`);
}

for (const mode of ['light', 'dark']) {
  test(`Spectrum checkbox ${mode} preserves independent neutral, invalid and selected source paint`, () => {
    const data = fixture(mode);
    const css = compile(data);
    const palette = source[mode];
    assertCompanionBoundary(css, 'spectrum-checkbox-review', mode);
    guardedPaint(css);
    for (const custom of [true, false]) {
      const delivery = selector => isCustom(selector) === custom;
      const rest = selector => delivery(selector) && !isDisabled(selector) && !/:hover|:focus-visible|:active/.test(selector) && !isSelected(selector) && !isMark(selector) && selector.includes(':enabled');
      expectRule(css, selector => rest(selector) && !isInvalid(selector), { background: rgb(palette.surface), 'border-color': rgb(palette.neutral) }, `${mode} ${custom ? 'custom' : 'native'} unchecked`);
      expectRule(css, selector => rest(selector) && isInvalid(selector), { 'border-color': rgb(palette.invalid) }, `${mode} ${custom ? 'custom' : 'native'} invalid`);
      for (const invalid of [false, true]) {
        const selected = selector => delivery(selector) && !isDisabled(selector) && isSelected(selector) && isInvalid(selector) === invalid && selector.includes(':enabled') && !/:hover|:focus-visible|:active/.test(selector);
        // En Reve draws its CSS mark inside a fill-colored perimeter. This is the
        // retained paint-equivalent adaptation of Spectrum's transparent border.
        const fill = rgb(invalid ? palette.invalid : palette.neutral);
        expectRule(css, selector => selected(selector) && !isMark(selector), { background: fill, 'border-color': fill }, `${mode} selected, invalid=${invalid}`);
        expectRule(css, selector => selected(selector) && isMark(selector), { 'border-color': rgb(palette.surface) }, `${mode} selected mark, invalid=${invalid}`);
      }
    }
    assert.doesNotMatch(css, /:invalid(?![\w-])/, 'Pristine native constraint validity never activates source invalid paint.');
    assert.doesNotMatch(css, /::part\((?:label|description|error)\)|outline(?:-\w+)?:|forced-color-adjust:|pointer-events:|--en-checkbox-pressed-border-color\s*:/,
      'Paint does not alter label typography, focus/system-color ownership, events, or assign the public pressed hook.');
  });
}

test('Spectrum checkbox optional roles remain independently optional and consume only their typed value', () => {
  const data = fixture('light', true);
  const legacy = Object.fromEntries(legacyRoles.map(role => [role, data.roles[role]]));
  const full = compile(data);
  const routes = {
    interactiveBorderColor: { properties: ['border-color'], selected: false, invalid: false, disabled: false },
    interactiveSelectedBackground: { properties: ['background', 'border-color'], selected: true, invalid: false, disabled: false },
    invalidInteractiveBorderColor: { properties: ['border-color'], selected: false, invalid: true, disabled: false },
    invalidInteractiveBackground: { properties: ['background', 'border-color'], selected: true, invalid: true, disabled: false },
    disabledBackground: { properties: ['background'], selected: false, invalid: false, disabled: true },
    disabledBorderColor: { properties: ['border-color'], selected: false, invalid: false, disabled: true },
    disabledSelectedBackground: { properties: ['background', 'border-color'], selected: true, invalid: false, disabled: true },
    disabledSelectedColor: { properties: ['border-color'], selected: true, invalid: false, disabled: true, mark: true },
  };
  for (const role of addedRoles) {
    const value = rgb(data.values[role]);
    assert.ok(full.includes(value), `${role}: the full recipe consumes its independent sentinel`);
    const omitted = { ...data.roles };
    delete omitted[role];
    assert.ok(!compile(data, omitted).includes(value), `${role}: absence preserves ordinary paint instead of inventing a default`);
    const alone = compile(data, { [role]: data.roles[role] });
    const route = routes[role];
    for (const rule of rules(alone)) {
      assert.deepEqual(Object.keys(rule.declarations).sort(), [...route.properties].sort(), `${role}: only its intended paint properties are emitted`);
      assert.equal(isSelected(rule.selector), route.selected, `${role}: checked and mixed routing`);
      if (!route.selected) assert.ok(isUnchecked(rule.selector), `${role}: unchecked routing`);
      assert.equal(isInvalid(rule.selector), route.invalid, `${role}: visible-invalid routing`);
      assert.equal(isDisabled(rule.selector), route.disabled, `${role}: disabled routing`);
      assert.equal(isMark(rule.selector), route.mark ?? false, `${role}: mark routing`);
      for (const [property, actual] of Object.entries(rule.declarations)) {
        const expected = !route.disabled && property === 'border-color' && hasInteraction(rule.selector, ':active')
          ? `var(--en-checkbox-pressed-border-color, ${value})` : value;
        assert.equal(actual, expected, `${role}: its independent typed color is delivered exactly`);
      }
    }
    for (const custom of [true, false]) {
      const ordinaryValue = Object.fromEntries(route.properties.map(property => [property, value]));
      expectRule(alone, selector => isCustom(selector) === custom && !hasInteraction(selector, ':active'), ordinaryValue,
        `${role}: a single optional role reaches ${custom ? 'custom Parts' : 'native helpers'}`);
    }
    assertCompanionBoundary(alone, 'spectrum-checkbox-review', 'light');
    guardedPaint(alone);
  }
  const prior = compile(data, legacy);
  for (const role of addedRoles) assert.ok(!prior.includes(rgb(data.values[role])), `${role}: legacy recipes remain unchanged`);
  assert.ok(rules(prior).filter(rule => hasPaint(rule.declarations)).every(rule => !/:hover|:focus-visible|:active/.test(rule.selector)),
    'A legacy recipe does not acquire interaction paint from omitted optional roles.');
  for (const roles of [{}, null]) assert.equal(rules(compile(data, roles)).length, 0,
    'Empty or omitted roles emit only theme-boundary bookkeeping, never component defaults.');
});

test('Spectrum checkbox rejects type-confused, missing, unknown and raw CSS role data', () => {
  const data = fixture();
  for (const role of [...legacyRoles, ...addedRoles]) {
    assert.throws(() => compile(data, { [role]: 'theme.checkbox.dimension' }), { code: 'invalid-companion' }, `${role} requires a color`);
    assert.throws(() => compile(data, { [role]: 'theme.checkbox.missing' }), { code: 'invalid-companion' }, `${role} requires an existing token`);
    assert.throws(() => compile(data, { [role]: '#123456' }), { code: 'invalid-companion' }, `${role} does not accept raw CSS`);
  }
  for (const role of ['radiusSmall', 'radiusMedium', 'radiusLarge']) {
    assert.throws(() => compile(data, { [role]: data.roles.background }), { code: 'invalid-companion' }, `${role} remains a dimension`);
  }
  assert.throws(() => compile(data, { arbitrarySelector: data.roles.background }), { code: 'invalid-companion' });
  assert.throws(() => compile(data, { interactiveBorderColor: { $type: 'color', $value: colorFromHex('#123456') } }), { code: 'invalid-companion' },
    'Imported recipes bind existing token IDs, not inline token objects.');
});

for (const mode of ['light', 'dark']) {
  test(`Spectrum checkbox ${mode} source interactions cover the input and label with invalid paint last`, () => {
    const css = compile(fixture(mode));
    const palette = source[mode];
    for (const custom of [true, false]) {
      for (const state of [':hover', ':focus-visible', ':active']) {
        for (const selected of [false, true]) {
          const base = selector => isCustom(selector) === custom && !isDisabled(selector) && !isMark(selector)
            && (selected ? isSelected(selector) : isUnchecked(selector)) && hasInteraction(selector, state);
          const colors = invalid => {
            const source = rgb(invalid ? palette.invalidInteractive : palette.interactive);
            return {
              background: selected ? source : rgb(palette.surface),
              'border-color': state === ':active' ? `var(--en-checkbox-pressed-border-color, ${source})` : source,
            };
          };
          const neutral = expectRule(css, selector => base(selector) && !isInvalid(selector), colors(false), `${mode} ${custom ? 'custom' : 'native'} ${state} selected=${selected}`);
          const invalid = expectRule(css, selector => base(selector) && isInvalid(selector), colors(true), `${mode} invalid ${state} selected=${selected}`);
          assert.ok(Math.max(...neutral.map(rule => rule.index)) < Math.min(...invalid.map(rule => rule.index)),
            'Visible-invalid interaction paint follows matching neutral interaction paint.');
          for (const error of [false, true]) {
            const predicate = selector => base(selector) && isInvalid(selector) === error;
            if (state === ':active') {
              const earlier = rules(css).filter(rule => isCustom(rule.selector) === custom && !isDisabled(rule.selector) && !isMark(rule.selector)
                && isInvalid(rule.selector) === error && (selected ? isSelected(rule.selector) : isUnchecked(rule.selector))
                && [':hover', ':focus-visible'].some(prior => hasInteraction(rule.selector, prior)));
              const held = error ? invalid : neutral;
              assert.ok(earlier.length && Math.max(...earlier.map(rule => rule.index)) < Math.min(...held.map(rule => rule.index)),
                'Held border paint follows hover/focus so the public pressed-color override retains precedence.');
            }
            if (custom) {
              expectRule(css, selector => predicate(selector) && selector.indexOf(state) > selector.indexOf('::part('), colors(error), 'The native control Part owns direct input interaction');
              if (state !== ':focus-visible') expectRule(css, selector => predicate(selector) && selector.indexOf(state) < selector.indexOf('::part('), colors(error), 'The associated label is represented by host interaction');
            } else if (state !== ':focus-visible') {
              expectRule(css, selector => predicate(selector) && selector.includes(`:is(${state}, .en-choice${state} > .en-checkbox)`), colors(error), 'Native input and direct-child label interactions share source paint');
              if (state === ':hover') expectRule(css, selector => predicate(selector) && selector.startsWith('.en-choice-group .en-choice:hover:not(:active) > .en-checkbox'), colors(error), 'Native grouped-choice hover has its own matching-specificity branch');
            }
          }
        }
      }
    }
    for (const { selector } of rules(css).filter(rule => hasPaint(rule.declarations) && !isDisabled(rule.selector))) {
      if (isCustom(selector)) {
        assert.ok(selector.includes(':not(:disabled):not([aria-disabled="true"])'), `Host disabled states gate enabled paint: ${selector}`);
        assert.match(selector, /::part\(control(?:-invalid)?\):enabled/, 'The real native Part must also be enabled.');
        if (selector.includes(':focus-visible')) assert.ok(selector.indexOf(':focus-visible') > selector.indexOf('::part('),
          'Visible focus belongs to the native input, never the host or label.');
      } else assert.ok(selector.includes(':enabled:not([aria-disabled="true"])'), `Native disabled/fieldset and ARIA-disabled gate enabled paint: ${selector}`);
    }
    assert.ok(rules(css).filter(rule => isMark(rule.selector)).every(rule => !/:hover|:focus-visible|:active/.test(rule.selector)),
      'Hover, focus and press retain the selected surface-colored mark; state-specific icon colors are not invented.');
  });

  test(`Spectrum checkbox ${mode} disabled paint owns native, fieldset and ARIA-disabled states after invalid paint`, () => {
    const css = compile(fixture(mode));
    const palette = source[mode];
    const invalid = rules(css).filter(rule => isInvalid(rule.selector) && hasPaint(rule.declarations));
    const disabled = rules(css).filter(rule => isDisabled(rule.selector) && hasPaint(rule.declarations));
    assert.ok(invalid.length && disabled.length);
    assert.ok(Math.min(...disabled.map(rule => rule.index)) > Math.max(...invalid.map(rule => rule.index)),
      'Disabled source paint follows every neutral/invalid state, including grouped label interactions.');
    for (const custom of [true, false]) {
      for (const state of [undefined, ':hover', ':focus-visible', ':active']) {
        for (const selected of [false, true]) {
          const predicate = selector => isCustom(selector) === custom && isDisabled(selector) && !isMark(selector)
            && (selected ? isSelected(selector) : isUnchecked(selector))
            && (state ? hasInteraction(selector, state) : !/:hover|:focus-visible|:active/.test(selector));
          const expected = { background: rgb(selected ? palette.disabled : palette.surface), 'border-color': rgb(palette.disabled) };
          expectRule(css, predicate, expected, `${mode} disabled ${custom ? 'custom' : 'native'} ${state ?? 'rest'} selected=${selected}`);
          if (custom) {
            expectRule(css, selector => predicate(selector) && selector.includes('::part(control):disabled'), expected, 'Actual native disabled state includes disabled fieldsets');
            expectRule(css, selector => predicate(selector) && selector.includes('[aria-disabled="true"]'), expected, 'Host ARIA-disabled has its own delivery');
            if (state && state !== ':focus-visible') expectRule(css, selector => predicate(selector) && selector.indexOf(state) < selector.indexOf('::part('), expected,
              'Disabled label hover and press retain source disabled paint');
          } else {
            expectRule(css, selector => predicate(selector) && selector.includes(':is(:disabled, :enabled[aria-disabled="true"])'), expected, 'Native actual-disabled and ARIA-disabled inputs both receive source paint');
            if (state === ':hover') expectRule(css, selector => predicate(selector) && selector.startsWith('.en-choice-group .en-choice:hover:not(:active) > .en-checkbox'), expected, 'Disabled grouped-choice label hover cannot recover enabled paint');
          }
        }
      }
      expectRule(css, selector => isCustom(selector) === custom && isDisabled(selector) && isSelected(selector) && isMark(selector),
        { 'border-color': rgb(palette.surface) }, `${mode} disabled checked/mixed mark retains source surface ink`);
    }
    for (const { selector, declarations } of disabled) {
      assert.ok(!isInvalid(selector), 'Disabled paint does not require validation or an invalid Part.');
      assert.ok(!Object.values(declarations).some(value => value.includes('--en-checkbox-pressed-border-color')),
        'Enabled pressed-color overrides do not leak into disabled paint.');
    }
  });
}

test('Spectrum checkbox legacy radius roles still accept dimensions with explicit medium fallback', () => {
  const data = fixture();
  const radius = value => `calc(${value} * var(--_en-size-small, 0) + ${value} * var(--_en-size-medium, 1) + ${value} * var(--_en-size-large, 0))`;
  const medium = compile(data, { radiusMedium: 'theme.checkbox.dimension' });
  const full = compile(data, { radiusSmall: 'theme.checkbox.dimension-small', radiusMedium: 'theme.checkbox.dimension', radiusLarge: 'theme.checkbox.dimension-large' });
  for (const custom of [true, false]) {
    expectRule(medium, selector => isCustom(selector) === custom, { 'border-radius': radius('2px') }, 'Omitted size roles retain the explicit medium radius');
    expectRule(full, selector => isCustom(selector) === custom, {
      'border-radius': 'calc(1px * var(--_en-size-small, 0) + 2px * var(--_en-size-medium, 1) + 3px * var(--_en-size-large, 0))',
    }, 'All three typed radius roles retain absolute size selection');
  }
  for (const role of ['radiusSmall', 'radiusLarge']) assert.equal(rules(compile(data, { [role]: 'theme.checkbox.dimension' })).length, 0,
    'Small or large radius alone does not invent the required medium fallback.');
});
