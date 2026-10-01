import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolveTheme, createThemePair, emitThemeCSS, emitThemePairCSS, emitPropertyRegistrations, densityNames, resolveTokens } from '../dist/index.js';
import { defaultCSSValues, defaultCSSValue } from '../dist/defaults.js';

test('the generated root stylesheet is the adaptive comfortable pair, with a static fallback', async () => {
  const light=resolveTheme(),dark=resolveTheme({mode:'dark'});
  const pair=createThemePair({name:'default',light,dark});
  const css=await readFile(new URL('../dist/default.css',import.meta.url),'utf8');
  assert.equal(css,emitPropertyRegistrations(light)+emitThemePairCSS(pair,{scope:'root'}));
  assert.match(css,/color-scheme: light dark;/);
  assert.match(css,/@media \(prefers-color-scheme: dark\)/);
  assert.match(css,/@supports \(color: light-dark\(white, black\)\)/);
  assert.match(css,/data-en-appearance="light"/);
  assert.match(css,/data-en-appearance="dark"/);
  assert.match(css,/--en-button-background: initial;/);
  assert.doesNotMatch(css,/--_en-size-|--_en-combobox-|--en-progress-value:/);
});

test('all six generated named scopes fix their own scheme and retain their complete density graph', async () => {
  for(const mode of ['light','dark'])for(const density of densityNames){
    const theme=resolveTheme({mode,density});
    const css=await readFile(new URL(`../dist/themes/${theme.name}.css`,import.meta.url),'utf8');
    assert.equal(css,emitThemeCSS(theme,{colorScheme:true}));
    assert.ok(css.includes(`:where([data-en-theme="${theme.name}"])`));
    assert.ok(css.includes(`color-scheme: ${mode};`));
    assert.equal((css.match(/color-scheme:/g)??[]).length,1);
    assert.ok(css.includes(`--en-size-control-min: ${theme.tokens['size.control-min'].cssExpression};`));
    assert.match(css,/--en-button-background: initial;/);
    assert.doesNotMatch(css,/@media|light-dark\(|data-en-appearance/);
  }
});

test('single-theme native-scheme opt-in leaves existing candidate output unchanged by default', () => {
  for(const mode of ['light','dark']){
    const theme=resolveTheme({mode}),before=emitThemeCSS(theme);
    assert.doesNotMatch(before,/color-scheme:/);
    assert.equal(emitThemeCSS(theme,{colorScheme:false}),before);
    assert.equal(emitThemeCSS(theme,{colorScheme:true}).replace(`    color-scheme: ${mode};\n`,''),before);
    assert.equal(emitThemeCSS(theme,{scope:'root',colorScheme:true}).replace(`    color-scheme: ${mode};\n`,''),emitThemeCSS(theme,{scope:'root'}));
  }
});

test('partial single-theme overrides keep inherited native appearance', () => {
  const theme=resolveTheme({mode:'dark'}),options={kind:'partial',tokenIds:['color.action']};
  assert.doesNotMatch(emitThemeCSS(theme,options),/color-scheme:/);
  assert.equal(emitThemeCSS(theme,{...options,colorScheme:false}),emitThemeCSS(theme,options));
  assert.throws(()=>emitThemeCSS(theme,{...options,colorScheme:true}),{code:'partial-color-scheme'});
});

test('pure defaults and default JSON remain deterministic light authoring snapshots', async () => {
  const theme=resolveTheme();
  assert.equal(theme.mode,'light');assert.equal(theme.density,'comfortable');
  assert.ok(Object.isFrozen(defaultCSSValues));
  const expected=Object.fromEntries(Object.values(theme.tokens).filter(token=>!token.id.startsWith('component.')).map(token=>[token.cssName,token.cssValue]));
  assert.deepEqual(defaultCSSValues,expected);
  for(const [name,value] of Object.entries(expected))assert.equal(defaultCSSValue(name),value);
  assert.equal(defaultCSSValue('--en-layout-dialog-collapse'),theme.tokens['layout.dialog-collapse'].cssValue);
  assert.throws(()=>defaultCSSValue('--en-button-background'),RangeError);
  const portable=JSON.parse(await readFile(new URL('../dist/tokens.json',import.meta.url),'utf8'));
  const graph=resolveTokens(portable);
  assert.deepEqual(graph.tokens['color.canvas'].value,theme.tokens['color.canvas'].value);
  assert.deepEqual(graph.tokens['size.control-min'].value,theme.tokens['size.control-min'].value);
});
