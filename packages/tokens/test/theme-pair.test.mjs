import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveTheme, createThemePair, emitThemePairCSS, createReviewDraft,
  exportThemeReviewPair, reopenThemeReviewPair, colorFromHex, sha256,
} from '../dist/index.js';

const themePair = (light = {}, dark = {}) => createThemePair({
  name: 'paired-review',
  light: resolveTheme({mode:'light',...light}),
  dark: resolveTheme({mode:'dark',...dark}),
});
const enhancement = css => css.split('@supports (color: light-dark(white, black))')[1] ?? '';

test('pair identity retains independently authored branches and is immutable', () => {
  const light = resolveTheme({mode:'light',pins:{'palette.action':colorFromHex('#123456')}});
  const dark = resolveTheme({mode:'dark',pins:{'palette.action':colorFromHex('#abcdef')}});
  const pair = createThemePair({name:'independent',light,dark});
  assert.equal(pair.light, light);
  assert.equal(pair.dark, dark);
  assert.equal(pair.density, 'comfortable');
  assert.ok(Object.isFrozen(pair));
  assert.notEqual(pair.sourceHash, light.sourceHash);
  assert.equal(createThemePair({name:'independent',light,dark}).sourceHash, pair.sourceHash);
  assert.notEqual(createThemePair({name:'another-name',light,dark}).sourceHash, pair.sourceHash);
  assert.notDeepEqual(pair.light.pins, pair.dark.pins);
});

test('rejects mismatched modes, density, names, compiler and token schema', () => {
  const light = resolveTheme({mode:'light'}), dark = resolveTheme({mode:'dark'});
  for (const name of ['', 'Wrong name', undefined]) assert.throws(() => createThemePair({name,light,dark}), {code:'invalid-theme-name'});
  assert.throws(() => createThemePair({name:'x',light:dark,dark:light}), {code:'invalid-pair-mode'});
  assert.throws(() => themePair({}, {density:'compact'}), {code:'pair-density'});
  assert.throws(() => createThemePair({name:'x',light,dark:{...dark,compilerVersion:'different'}}), {code:'pair-compiler'});
  assert.throws(() => themePair({}, {source:{extra:{$type:'number',$value:1}}}), {code:'pair-schema'});
  assert.throws(() => themePair({source:{extra:{$type:'number',$value:1}}}, {source:{extra:{$type:'dimension',$value:{value:1,unit:'px'}}}}), {code:'pair-schema'});
});

test('concrete colors join only within a support guard and preserve media/explicit fallback', () => {
  const pair = themePair({pins:{'palette.action':colorFromHex('#123456')}}, {pins:{'palette.action':colorFromHex('#abcdef')}});
  const css = emitThemePairCSS(pair, {scope:'root'});
  const light = pair.light.tokens['palette.action'].cssExpression;
  const dark = pair.dark.tokens['palette.action'].cssExpression;
  assert.ok(enhancement(css).includes(`--en-palette-action: light-dark(${light}, ${dark});`));
  const fallback = css.split('@supports')[0];
  assert.ok(fallback.includes(`--en-palette-action: ${light};`));
  assert.ok(fallback.includes(`--en-palette-action: ${dark};`));
  assert.match(fallback, /@media \(prefers-color-scheme: dark\)/);
  assert.match(fallback, /:not\(\[data-en-appearance="light"\], \[data-en-appearance="dark"\]\)/);
  assert.match(fallback, /\[data-en-appearance="light"\]\) \{ color-scheme: light;/);
  assert.match(fallback, /\[data-en-appearance="dark"\]\) \{\n    color-scheme: dark;/);
});

test('a one-branch optional pin remains a real initial mask and never enters light-dark', () => {
  const pair = themePair({pins:{'component.button.background':colorFromHex('#aabbcc')}}, {});
  const css = emitThemePairCSS(pair);
  assert.ok(css.includes(`--en-button-background: ${pair.light.tokens['component.button.background'].cssExpression};`));
  assert.match(css, /--en-button-background: initial;/);
  assert.doesNotMatch(enhancement(css), /--en-button-background:/);
  assert.doesNotMatch(css, /light-dark\([^;]*initial/);
});

test('non-color differences and same public aliases keep their existing CSS semantics', () => {
  const source = {pairtest:{base:{$type:'color',$value:colorFromHex('#112233')},alias:{$type:'color',$value:'{pairtest.base}'}}};
  const pair = themePair({source,pins:{'component.button.radius':{value:4,unit:'px'}}}, {source,pins:{'component.button.radius':{value:12,unit:'px'}}});
  const css = emitThemePairCSS(pair);
  assert.match(css, /--en-button-radius: 4px;/);
  assert.match(css, /--en-button-radius: 12px;/);
  assert.doesNotMatch(enhancement(css), /--en-button-radius:/);
  assert.equal(css.match(/--en-pairtest-alias: var\(--en-pairtest-base\);/g)?.length, 1);
  assert.doesNotMatch(enhancement(css), /--en-pairtest-alias:/);
});

test('individually acyclic opposite alias graphs are not joined into a CSS variable cycle', () => {
  const light = {pairtest:{a:{$type:'color',$value:'{pairtest.b}'},b:{$type:'color',$value:colorFromHex('#112233')}}};
  const dark = {pairtest:{a:{$type:'color',$value:colorFromHex('#ddeeff')},b:{$type:'color',$value:'{pairtest.a}'}}};
  const css = emitThemePairCSS(themePair({source:light},{source:dark}));
  assert.match(css, /--en-pairtest-a: var\(--en-pairtest-b\);/);
  assert.match(css, /--en-pairtest-b: var\(--en-pairtest-a\);/);
  assert.doesNotMatch(enhancement(css), /--en-pairtest-[ab]:/);
});

test('partial output selects only requested tokens while full scopes reset finite overrides', () => {
  const pair = themePair();
  const partial = emitThemePairCSS(pair, {selector:'.preview',kind:'partial',tokenIds:['palette.action']});
  assert.match(partial, /:where\(\.preview\)/);
  assert.doesNotMatch(partial, /--en-button-background:/);
  assert.doesNotMatch(partial, /--en-font-ui-size:/);
  assert.match(emitThemePairCSS(pair), /--en-button-background: initial;/);
  assert.throws(() => emitThemePairCSS(pair,{kind:'partial'}), {code:'missing-selection'});
  assert.throws(() => emitThemePairCSS(pair,{selector:'div {color:red}'}), {code:'invalid-selector'});
});

function editablePair() {
  const light = createReviewDraft({mode:'light'});
  const dark = createReviewDraft({mode:'dark'});
  light.setToken('component.button.radius', '{radius.pill}');
  dark.setToken('component.button.radius', '{radius.control}');
  return {name:'editable-pair',light,dark};
}
const metadata = {title:'Independently authored pair',rationale:'Two reviewed branches.',evidence:[{kind:'browser',status:'pending'}]};

test('paired review export/reopen preserves each complete branch history and source', () => {
  const pair = editablePair();
  const beforeLight = pair.light.exportJSON(metadata), beforeDark = pair.dark.exportJSON(metadata);
  const json = exportThemeReviewPair(pair, metadata);
  const opened = reopenThemeReviewPair(json, {baseOptions:{light:{mode:'light'},dark:{mode:'dark'}}});
  assert.equal(pair.light.exportJSON(metadata), beforeLight);
  assert.equal(pair.dark.exportJSON(metadata), beforeDark);
  assert.equal(opened.light.exportJSON(metadata), beforeLight);
  assert.equal(opened.dark.exportJSON(metadata), beforeDark);
  assert.equal(exportThemeReviewPair(opened, metadata), json);
  assert.equal(opened.theme.sourceHash, JSON.parse(json).pairSourceHash);
  assert.equal(opened.title, metadata.title);
  assert.equal(opened.light.canUndo, true);
  assert.equal(opened.dark.canUndo, true);
  const darkHash = opened.dark.theme.sourceHash;
  assert.equal(opened.light.undo(), true);
  assert.equal(opened.dark.theme.sourceHash, darkHash);
});

test('pair import rejects changed CSS even when the supplied CSS hash is recomputed', () => {
  const input = JSON.parse(exportThemeReviewPair(editablePair(),metadata));
  input.artifacts['theme.css'] += '\nbody { color:red; }';
  input.artifactHashes.css = `sha256:${sha256(input.artifacts['theme.css'])}`;
  assert.throws(() => reopenThemeReviewPair(JSON.stringify(input)), {code:'review-artifact'});
});

test('pair import rejects malformed schema, branch swaps and stale base expectations', () => {
  const text = exportThemeReviewPair(editablePair(),metadata);
  const schema = JSON.parse(text); schema.unexpected = true;
  assert.throws(() => reopenThemeReviewPair(JSON.stringify(schema)), {code:'review-schema'});
  const swapped = JSON.parse(text); [swapped.branches.light,swapped.branches.dark] = [swapped.branches.dark,swapped.branches.light];
  assert.throws(() => reopenThemeReviewPair(JSON.stringify(swapped)), {code:'invalid-pair-mode'});
  assert.throws(() => reopenThemeReviewPair(text,{baseOptions:{light:{mode:'light',density:'compact'},dark:{mode:'dark'}}}), {code:'stale-base'});
});
