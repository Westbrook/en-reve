import test from 'node:test';
import assert from 'node:assert/strict';
import { colorFromHex, createThemeCompanion, resolveTheme, tokenDocument } from '../dist/index.js';
import { assertCompanionBoundary } from './companion-boundary-support.mjs';

// Independent source expectations, not imported from candidate definitions,
// their updater, emitted CSS, or the compiler's presentation registry.
const statuses = ['info', 'success', 'warning', 'danger'];
// Web Awesome 3.13.0 Default theme/palette: quiet fill, quiet outline, on-quiet icon.
const wa = {
  light: {
    info: ['#e8f3ff', '#d1e8ff', '#0053c0'],
    success: ['#e3f9e3', '#c2f2c1', '#036730'],
    warning: ['#fef3cd', '#ffe495', '#8c4602'],
    danger: ['#fff0ef', '#ffdedc', '#b30532'],
  },
  dark: {
    info: ['#001a4e', '#002d77', '#3e96ff'],
    success: ['#052310', '#0a3a1d', '#00ac49'],
    warning: ['#331600', '#532600', '#da7e00'],
    danger: ['#3e0913', '#631323', '#f3676c'],
  },
};
const dimension = (value, unit = 'px') => ({$type: 'dimension', $value: {value, unit}});
const number = value => ({$type: 'number', $value: value});
const weight = value => ({$type: 'fontWeight', $value: value});
const rgb = hex => `rgb(${[1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16)).join(' ')} / 1)`;
const tokenId = role => `theme.alert.${role.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`;

function fixture(mode = 'light', metrics = {}, palette = wa[mode]) {
  const tokens = {...metrics};
  for (const status of statuses) {
    const [background, border, icon] = palette[status];
    for (const [suffix, value] of Object.entries({
      Background: background, Color: mode === 'light' ? '#1b1d26' : '#f1f2f3',
      BorderColor: border, IconColor: icon,
    })) tokens[status + suffix] = {$type: 'color', $value: colorFromHex(value)};
  }
  const source = tokenDocument(Object.fromEntries(Object.entries(tokens).map(([role, value]) => [tokenId(role), value])));
  return {
    theme: resolveTheme({mode, source}),
    roles: Object.fromEntries(Object.keys(tokens).map(role => [role, tokenId(role)])),
  };
}

function compile(presentation, mode = 'light', metrics = {}, palette = wa[mode]) {
  const {theme, roles} = fixture(mode, metrics, palette);
  return createThemeCompanion(theme, {
    schemaVersion: 1, id: 'independent-source-alert', rules: [{
      target: 'source-alert', presentation, tokens: {}, roles,
    }],
  }, {name: 'source-alert-review'}).css;
}

function rules(css) {
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({
    selector: selector.trim(),
    declarations: Object.fromEntries(body.split(';').map(entry => entry.trim()).filter(Boolean).map(entry => {
      const colon = entry.indexOf(':');
      return [entry.slice(0, colon).trim(), entry.slice(colon + 1).trim()];
    })),
  }));
}

function surfaces(css, name, native) {
  return rules(css).filter(({selector}) => native
    ? name === 'base'
      ? /\.en-alert(?![\w-])/.test(selector) && !/\.en-alert__/.test(selector)
      : selector.includes(`.en-alert__${name}`)
    : selector.includes(`::part(${name})`));
}

function hasDeclaration(css, name, native, property, value) {
  const actual = surfaces(css, name, native).map(rule => rule.declarations[property]).filter(value => value !== undefined);
  assert.ok(actual.includes(value), `${native ? 'native' : 'custom'} ${name} ${property}: expected ${value}; got ${JSON.stringify(actual)}`);
}

function statusRules(css, name, native, status) {
  return surfaces(css, name, native).filter(({selector}) => selector.includes(`${native ? 'data-variant' : 'variant'}="${status}"`)
    || selector.includes(`${native ? 'data-variant' : 'variant'}='${status}'`));
}

test('Web Awesome default callout paint preserves independent status body and icon colors in both deliveries', () => {
  for (const mode of ['light', 'dark']) {
    const css = compile('callout', mode, {
      paddingEm: number(1), gap: dimension(0), radius: dimension(.75, 'rem'), borderWidth: dimension(.0625, 'rem'),
      lineHeight: number(1.6), weight: weight(400), iconFontScale: number(1.25), iconMarginEndEm: number(1),
    });
    assertCompanionBoundary(css, 'source-alert-review', mode);
    for (const native of [false, true]) {
      const defaultBase = surfaces(css, 'base', native).filter(rule => !/\[(?:data-)?variant=/.test(rule.selector));
      assert.ok(defaultBase.some(rule => rule.declarations.background === `var(--en-alert-background, ${rgb(wa[mode].info[0])})`),
        'An omitted variant receives the source default info/brand paint.');
      for (const status of statuses) {
        const base = statusRules(css, 'base', native, status).map(rule => rule.declarations);
        const icon = statusRules(css, 'icon', native, status).map(rule => rule.declarations);
        const [background, border, iconColor] = wa[mode][status];
        assert.ok(base.some(rule => rule.background === `var(--en-alert-background, ${rgb(background)})`
          || rule['background-color'] === `var(--en-alert-background, ${rgb(background)})`), `${mode} ${status}: fill remains publicly overridable`);
        assert.ok(base.some(rule => rule.color === `var(--en-alert-color, ${rgb(mode === 'light' ? '#1b1d26' : '#f1f2f3')})`));
        assert.ok(base.some(rule => rule['border-color'] === `var(--en-alert-border-color, ${rgb(border)})`));
        assert.ok(icon.some(rule => rule.color?.includes(rgb(iconColor))), `${mode} ${status}: separate source icon ink`);
      }
      hasDeclaration(css, 'base', native, 'gap', '0px');
      hasDeclaration(css, 'base', native, 'padding-block', '1em');
      hasDeclaration(css, 'base', native, 'padding-inline', '1em');
      hasDeclaration(css, 'base', native, 'border-radius', '0.75rem');
      hasDeclaration(css, 'base', native, 'border-width', '0.0625rem');
      hasDeclaration(css, 'base', native, 'line-height', '1.6');
      hasDeclaration(css, 'base', native, 'font-weight', '400');
      hasDeclaration(css, 'icon', native, 'font-size', 'calc(1em * 1.25)');
      hasDeclaration(css, 'icon', native, 'margin-inline-end', '1em');
      hasDeclaration(css, 'icon', native, 'align-self', 'stretch');
      hasDeclaration(css, 'icon', native, 'align-items', 'center');
    }
    assert.doesNotMatch(css, /(?:^|[;{]\s*)font-size:\s*(?:14|16|20)px/m,
      'Callout sizing inherits the local absolute size contract; source s/m/l sizes are not imposed silently.');
  }
});

// These metrics are selected from the reviewed default counterparts. They are
// source fixtures for compiler delivery, not proof of a rendered candidate.
const geometry = [
  ['Spectrum', 'outlined-trailing', {
    paddingBlock: dimension(24), paddingInline: dimension(24), borderWidth: dimension(2), radius: dimension(.625, 'rem'),
    fontSize: dimension(.875, 'rem'), lineHeight: number(1.5), weight: weight(400), iconSize: dimension(1.25, 'rem'),
  }, {'padding-block': '24px', 'padding-inline': '24px', 'border-width': '2px', 'border-radius': '0.625rem', 'font-size': '0.875rem', 'font-weight': '400', 'line-height': '1.5'}, {'inline-size': '1.25rem', 'block-size': '1.25rem'}],
  ['Fluent', 'outlined', {
    paddingBlock: dimension(7), paddingInline: dimension(12), gap: dimension(8), minHeight: dimension(36), radius: dimension(4),
    borderWidth: dimension(1), fontSize: dimension(.875, 'rem'), lineHeight: number(10 / 7), weight: weight(400), iconSize: dimension(1.25, 'rem'),
  }, {'padding-block': '7px', 'padding-inline': '12px', gap: '8px', 'min-block-size': '36px', 'border-radius': '4px', 'font-size': '0.875rem', 'font-weight': '400'}, {'inline-size': '1.25rem', 'block-size': '1.25rem'}],
  ['Astryx', 'plate', {
    paddingBlock: dimension(12), paddingInline: dimension(16), gap: dimension(8), radius: dimension(16), borderWidth: dimension(0),
    fontSize: dimension(.875, 'rem'), lineHeight: number(10 / 7), weight: weight(600), iconSize: dimension(1.25, 'rem'),
  }, {'padding-block': '12px', 'padding-inline': '16px', gap: '8px', 'border-radius': '16px', 'font-size': '0.875rem', 'font-weight': '600'}, {'inline-size': '1.25rem', 'block-size': '1.25rem'}],
  ['Rhea', 'outlined', {
    paddingBlock: dimension(.75, 'rem'), paddingInline: dimension(1, 'rem'), gap: dimension(.625, 'rem'), radius: dimension(1.125, 'rem'),
    borderWidth: dimension(1), fontSize: dimension(.875, 'rem'), lineHeight: number(10 / 7), weight: weight(400),
    iconSize: dimension(1, 'rem'), iconBlockOffset: dimension(.125, 'rem'),
  }, {'padding-block': '0.75rem', 'padding-inline': '1rem', gap: '0.625rem', 'border-radius': '1.125rem', 'font-size': '0.875rem', 'font-weight': '400'}, {'inline-size': '1rem', 'block-size': '1rem', 'margin-block-start': '0.125rem'}],
  ['Radix', 'plate', {iconLineHeight: dimension(1.25, 'rem')}, {}, {'block-size': '1.25rem'}],
];

for (const [name, presentation, metrics, base, icon] of geometry) {
  test(`${name} default source geometry reaches custom Parts and matching native children`, () => {
    const css = compile(presentation, 'light', metrics);
    for (const native of [false, true]) {
      for (const [property, value] of Object.entries(base)) hasDeclaration(css, 'base', native, property, value);
      for (const [property, value] of Object.entries(icon)) hasDeclaration(css, 'icon', native, property, value);
      if (metrics.lineHeight?.$value === 10 / 7) assert.ok(surfaces(css, 'base', native)
        .some(rule => Math.abs(Number(rule.declarations['line-height']) - 10 / 7) < .00001),
      'Twenty-pixel leading over fourteen-pixel type retains its unitless ratio.');
    }
    if (presentation === 'plate') {
      for (const native of [false, true]) {
        hasDeclaration(css, 'base', native, 'border-width', '0');
        hasDeclaration(css, 'base', native, 'box-shadow', 'inset 0 0 0 1px var(--en-alert-border-color, transparent)');
      }
    }
    if (presentation === 'outlined-trailing') {
      for (const native of [false, true]) {
        hasDeclaration(css, 'icon', native, 'order', '1');
        hasDeclaration(css, 'content', native, 'order', '0');
        hasDeclaration(css, 'close', native, 'order', '2');
      }
    }
  });
}

test('source alert paint is forced-color guarded and descendants retain their full-theme boundaries', () => {
  for (const presentation of ['outlined', 'outlined-trailing', 'plate', 'callout']) {
    const css = compile(presentation);
    const paintStart = css.indexOf('@media (forced-colors: none)');
    assert.ok(paintStart >= 0);
    assert.doesNotMatch(css.slice(0, paintStart), /(?:^|[;{]\s*)(?:background(?:-color)?|color|border-color|box-shadow):/m,
      'Source paint never precedes the forced-color guard.');
    assert.doesNotMatch(css, /--en-alert-(?:background|color|border-color):/,
      'All existing public paint hooks remain overrides, not assigned companion defaults.');
    assert.doesNotMatch(css, /::part\((?:control|label|title|description)\)|\[role=|aria-|tabindex|pointer-events:|outline(?:-\w+)?:|forced-color-adjust:|--en-size-target|--en-focus-/,
      'Presentation does not manufacture semantics or change controls, focus, target floors or system-color ownership.');
    for (const {selector, declarations} of rules(css)) {
      for (const child of ['icon', 'content', 'close']) {
        if (selector.includes(`.en-alert__${child}`)) assert.ok(new RegExp(`> \\.en-alert__${child}(?:\\[hidden\\])?:not\\(\\[data-en-theme\\]\\)`).test(selector),
          'Native presentation addresses immediate public children and excludes new theme boundaries.');
      }
      if (selector.includes('::part(close)') || selector.includes('.en-alert__close')) {
        assert.deepEqual(declarations, {order: '2'}, 'Only trailing-icon order may affect the close Part.');
      }
    }
  }
});

test('omitted optional metrics preserve existing layout and the finite schema rejects arbitrary presentation data', () => {
  for (const presentation of ['outlined', 'plate']) {
    const css = compile(presentation);
    assert.doesNotMatch(css, /(?:^|[;{]\s*)(?:padding(?:-block|-inline)?|gap|border-radius|min-block-size|font-size|font-weight|line-height|inline-size|block-size|margin-block-start):/m,
      'Omitted metric roles leave ordinary layout and typography intact.');
  }
  const {theme, roles} = fixture('light', {paddingBlock: dimension(7), lineHeight: number(1.6)});
  const invalid = patch => createThemeCompanion(theme, {schemaVersion: 1, id: 'invalid-source-alert', rules: [{
    target: 'source-alert', presentation: 'outlined', tokens: {}, roles: {...roles, ...patch},
  }]}).css;
  assert.throws(() => invalid({paddingBlock: tokenId('infoBackground')}), {code: 'invalid-companion'});
  assert.throws(() => invalid({lineHeight: tokenId('paddingBlock')}), {code: 'invalid-companion'});
  assert.throws(() => invalid({selector: tokenId('infoBackground')}), {code: 'invalid-companion'});
  assert.throws(() => invalid({infoBackground: 'theme.alert.missing'}), {code: 'invalid-companion'});
});
