import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  resolveTheme, colorFromHex, contrastRatio, affectedTokens, restoreDerived,
  createCandidate, emitThemeCSS, flattenTokens, densityNames, valueCSS,
} from '../dist/index.js';
import { defaultCSSValue } from '../dist/defaults.js';

const value = (theme, id) => theme.tokens[id].value;

test('brand and action share the initial seed in all six contexts without changing existing mode colors', async () => {
  for (const mode of ['light','dark']) for (const density of densityNames) {
    const theme = resolveTheme({mode,density});
    const expected = colorFromHex(mode === 'light' ? '#2457d6' : '#aac1ff');
    for (const id of ['palette.accent','palette.action','color.brand','color.action']) assert.deepEqual(value(theme,id),expected);
    assert.equal(theme.tokens['color.on-brand'].cssValue,valueCSS('color',colorFromHex(mode === 'light' ? '#ffffff' : '#101b39')));
    assert.deepEqual(value(theme,'palette.foreground-dark'),colorFromHex('#101b39'));
    assert.deepEqual(value(theme,'color.on-action'),value(theme,'color.on-brand'));
    const source = flattenTokens(theme.source);
    assert.equal(source['palette.action'].$value,'{palette.accent}');
    assert.equal(source['color.action'].$value,'{palette.action}');
    assert.equal(source['color.brand'].$value,'{palette.accent}');
    const snapshot = JSON.parse(await readFile(new URL(`../dist/themes/${theme.name}.tokens.json`,import.meta.url),'utf8'));
    assert.deepEqual(snapshot.color.brand.$value,expected);
    assert.deepEqual(snapshot.color['on-brand'].$value,value(theme,'color.on-brand'));
  }
  assert.equal(defaultCSSValue('--en-color-brand'),resolveTheme().tokens['color.brand'].cssValue);
  assert.equal(defaultCSSValue('--en-color-on-brand'),resolveTheme().tokens['color.on-brand'].cssValue);
});

test('a common accent seed drives both unpinned branches and records their transitive impacts', () => {
  const seed = colorFromHex('#a13698');
  const theme = resolveTheme({pins:{'palette.accent':seed}});
  assert.deepEqual(value(theme,'color.brand'),seed);
  assert.deepEqual(value(theme,'color.action'),seed);
  const affected = affectedTokens(theme,['palette.accent']);
  for (const id of ['color.brand','color.on-brand','color.action','color.action-hover','color.action-pressed','color.on-action']) assert.ok(affected.includes(id),id);
  assert.ok(!affected.includes('color.surface'));
  assert.ok(!affected.includes('color.danger-text'));
});

test('legacy palette.action and semantic action overrides leave the brand branch independent', () => {
  const seed = colorFromHex('#a13698'); const action = colorFromHex('#006400');
  const shared = resolveTheme({pins:{'palette.accent':seed}});
  for (const id of ['palette.action','color.action']) {
    const theme = resolveTheme({pins:{'palette.accent':seed,[id]:action}});
    assert.deepEqual(value(theme,'color.action'),action);
    assert.deepEqual(value(theme,'color.brand'),seed);
    assert.deepEqual(value(theme,'color.on-brand'),value(shared,'color.on-brand'));
    assert.ok(!affectedTokens(theme,[id]).includes('color.brand'));
    assert.ok(!affectedTokens(theme,[id]).includes('color.on-brand'));
    assert.ok(!affectedTokens(theme,['palette.accent']).includes('color.action'));
  }
  const fromSource = resolveTheme({pins:{'palette.accent':seed},source:{palette:{action:{$type:'color',$value:action}}}});
  assert.deepEqual(value(fromSource,'color.action'),action);
  assert.deepEqual(value(fromSource,'color.brand'),seed);
});

test('brand overrides detach only brand identity and restoration rejoins the shared seed', () => {
  const seed = colorFromHex('#a13698'); const brand = colorFromHex('#ffffff');
  const pins = {'palette.accent':seed,'color.brand':brand};
  const shared = resolveTheme({pins:{'palette.accent':seed}});
  const theme = resolveTheme({pins});
  assert.deepEqual(value(theme,'color.brand'),brand);
  for (const id of ['color.action','color.action-hover','color.action-pressed','color.on-action']) assert.deepEqual(value(theme,id),value(shared,id));
  assert.deepEqual(affectedTokens(theme,['color.brand']),['color.brand','color.on-brand']);
  assert.ok(!affectedTokens(theme,['palette.accent']).includes('color.brand'));
  assert.ok(affectedTokens(theme,['palette.accent'],{potential:true}).includes('color.brand'));
  assert.deepEqual(value(resolveTheme({pins:restoreDerived(pins,'color.brand')}),'color.brand'),seed);
  const fromSource = resolveTheme({pins:{'palette.accent':seed},source:{color:{brand:{$type:'color',$value:brand}}}});
  assert.deepEqual(value(fromSource,'color.brand'),brand);
  assert.deepEqual(value(fromSource,'color.action'),seed);
});

test('on-brand responds only to its effective brand background and shared foreground candidates', () => {
  const dark = colorFromHex('#000000'); const light = colorFromHex('#ffffff');
  const first = resolveTheme({pins:{'color.brand':light,'color.action':dark,'color.action-hover':dark,'color.action-pressed':dark}});
  assert.equal(first.tokens['color.on-brand'].cssValue,valueCSS('color',colorFromHex('#101b39')));
  assert.deepEqual(value(first,'color.on-action'),light);
  const second = resolveTheme({pins:{'color.brand':dark,'color.action':light,'color.action-hover':light,'color.action-pressed':light}});
  assert.deepEqual(value(second,'color.on-brand'),light);
  assert.equal(second.tokens['color.on-action'].cssValue,valueCSS('color',colorFromHex('#101b39')));
  assert.deepEqual(second.dependencies['color.on-brand'],['color.brand','palette.foreground-dark','palette.foreground-light']);
});

test('on-brand pins receive pair diagnostics and can restore their recipe without altering brand color', () => {
  const white = colorFromHex('#ffffff');
  const pins = {'color.brand':white,'color.on-brand':white};
  const theme = resolveTheme({pins});
  const diagnostic = theme.diagnostics.find(item => item.tokens[0] === 'color.on-brand' && item.tokens[1] === 'color.brand');
  assert.equal(diagnostic?.code,'text-contrast');
  assert.equal(diagnostic?.measured,1);
  const restored = resolveTheme({pins:restoreDerived(pins,'color.on-brand')});
  assert.deepEqual(value(restored,'color.brand'),white);
  assert.ok(!restored.diagnostics.some(item => item.tokens[0] === 'color.on-brand'));
  const candidate = createCandidate({base:resolveTheme(),theme,title:'Review independent brand foreground'});
  const reopened = resolveTheme(JSON.parse(candidate.artifacts['source.json']).options);
  assert.equal(reopened.sourceHash,theme.sourceHash);
  assert.equal(emitThemeCSS(reopened),candidate.artifacts['theme.css']);
});

test('a bright shared brand seed stays exact even when used as low-contrast text on a light surface', () => {
  const yellow = colorFromHex('#ffff00');
  const theme = resolveTheme({pins:{'palette.accent':yellow}});
  assert.deepEqual(value(theme,'color.brand'),yellow);
  assert.deepEqual(value(theme,'color.action'),yellow);
  assert.ok(contrastRatio(value(theme,'color.brand'),value(theme,'color.surface')) < 4.5);
  assert.equal(theme.tokens['color.on-brand'].cssValue,valueCSS('color',colorFromHex('#101b39')));
});
