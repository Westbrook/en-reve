import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {
  resolveTokens,resolveTheme,restoreDerived,affectedTokens,deriveRhythm,deriveInsetRadius,
  deriveAccent,colorFromHex,contrastRatio,mixOklab,createCandidate,assertCandidateBase,
  emitThemeCSS,editorDescriptor,validateManagedValue,managedEditors,sha256,stableStringify,
  flattenTokens,tokenDocument,sourceTokens,valueCSS,densityNames,componentSizes,sizingRoles,sizingRoleCSS
} from '../dist/index.js';
import {srgbToOklab,oklabToSrgb,gamutMapOklab} from '../dist/color.js';
import {defaultCSSValue} from '../dist/defaults.js';
const dimension = value => ({value,unit:'rem'});
const errorCode = code => error => error.code === code;

test('author a typed group, chained alias, and imported metadata without mutating source', () => {
  const source = {space:{$type:'dimension',unit:{$value:dimension(.25),$extensions:{'example.editor':{label:'Step'}}},small:{$value:'{space.unit}'},inset:{$value:'{space.small}'}}};
  const before = structuredClone(source);
  const result = resolveTokens(source);
  assert.deepEqual(result.tokens['space.inset'].value,dimension(.25));
  assert.equal(result.tokens['space.inset'].type,'dimension');
  assert.deepEqual(result.dependencies['space.inset'],['space.small']);
  assert.deepEqual(source,before);
  assert.deepEqual(flattenTokens(tokenDocument(flattenTokens(source)))['space.unit'].$extensions,{'example.editor':{label:'Step'}});
});

test('source validation catches missing references, alias cycles, unsupported fields and type mismatch', () => {
  assert.throws(() => resolveTokens({x:{$type:'number',$value:'{missing}'}}),errorCode('missing-reference'));
  assert.throws(() => resolveTokens({a:{$type:'number',$value:'{b}'},b:{$value:'{a}'}}),errorCode('cycle'));
  assert.throws(() => resolveTokens({x:{$type:'number',$value:'{y}'},y:{$type:'dimension',$value:dimension(1)}}),errorCode('type-mismatch'));
  assert.throws(() => resolveTokens({x:{$value:2}}),errorCode('missing-type'));
  assert.throws(() => resolveTokens({x:{$type:'dimension',$value:'calc(1rem + 1px)'}}),errorCode('invalid-value'));
  assert.throws(() => resolveTokens({x:{$type:'color',$value:{colorSpace:'oklch',components:[.5,.1,90]}}}),errorCode('invalid-value'));
  assert.throws(() => resolveTokens({x:{$extends:'y'}}),errorCode('unsupported-field'));
});

test('public CSS name collisions and dangerous path names are rejected', () => {
  assert.throws(() => resolveTokens({'a-b':{$type:'number',$value:1},a:{b:{$type:'number',$value:2}}}),errorCode('css-name-collision'));
  assert.throws(() => tokenDocument({'constructor.value':{$type:'number',$value:1}}),errorCode('invalid-name'));
});

test('recipe reads are limited to declared dependencies for trustworthy impact analysis', () => {
  const document = {input:{$type:'number',$value:1},output:{$type:'number',$value:0}};
  assert.throws(() => resolveTokens(document,{recipes:{output:{version:'example/1',dependencies:[],evaluate:get=>get('input')}}}),errorCode('undeclared-dependency'));
});

test('changing rhythm updates downstream layout while a pin stays fixed; restore rejoins the system', () => {
  const pins = {'rhythm.base':dimension(.5),'space.2':dimension(.3)};
  const changed = resolveTheme({pins});
  assert.deepEqual(changed.tokens['space.4'].value,dimension(2));
  assert.deepEqual(changed.tokens['space.2'].value,dimension(.3));
  assert.deepEqual(changed.tokens['space.icon-label'].value,dimension(.3));
  assert.equal(changed.tokens['space.2'].provenance,'pin');
  const restored = resolveTheme({pins:restoreDerived(pins,'space.2')});
  assert.deepEqual(restored.tokens['space.icon-label'].value,dimension(1));
  assert.deepEqual(pins['space.2'],dimension(.3));
  assert.ok(!affectedTokens(changed,['rhythm.base']).includes('space.icon-label'));
  assert.ok(affectedTokens(changed,['rhythm.base'],{potential:true}).includes('space.icon-label'));
});

test('pins participate in dependency validation and cannot introduce a cycle or unknown output', () => {
  assert.throws(() => resolveTheme({pins:{'space.2':'{space.icon-label}'}}),errorCode('cycle'));
  assert.throws(() => resolveTheme({pins:{'not-a-token':3}}),errorCode('unknown-token'));
});

test('context changes are isolated and compact density leaves typography unchanged', () => {
  const light = resolveTheme(); const dark = resolveTheme({mode:'dark'}); const compact = resolveTheme({density:'compact'});
  assert.notDeepEqual(light.tokens['color.canvas'].value,dark.tokens['color.canvas'].value);
  assert.deepEqual(light.tokens['font.body.size'].value,compact.tokens['font.body.size'].value);
  assert.deepEqual(light.tokens['size.control-min'].value,dimension(2.5));
  assert.deepEqual(compact.tokens['size.control-min'].value,dimension(2));
  assert.deepEqual(resolveTheme().tokens['color.canvas'].value,light.tokens['color.canvas'].value);
  assert.throws(() => { light.tokens['color.canvas'].value.components[0] = 0; },TypeError);
});

test('all six color/density contexts retain typography and expose denser action grouping', async () => {
  const baseline = resolveTheme();
  const names = [];
  for (const mode of ['light','dark']) for (const density of densityNames) {
    const theme = resolveTheme({mode,density}); names.push(theme.name);
    for (const [id,token] of Object.entries(theme.tokens)) if (id.startsWith('font.')) assert.deepEqual(token.value,baseline.tokens[id].value,`${density}: ${id}`);
    const value = id => theme.tokens[id].value.value;
    assert.ok(value('space.actions') < value('space.rows'));
    assert.deepEqual(theme.tokens['size.target-min'].value,{value:24,unit:'px'});
    const snapshot = JSON.parse(await readFile(new URL(`../dist/themes/${theme.name}.tokens.json`,import.meta.url),'utf8'));
    assert.deepEqual(resolveTokens(snapshot).tokens['space.actions'].value,theme.tokens['space.actions'].value);
  }
  assert.deepEqual(names,['light-compact','light','light-spacious','dark-compact','dark','dark-spacious']);
  assert.equal(resolveTheme().density,'comfortable');
  const spacious = resolveTheme({density:'spacious'});
  assert.deepEqual(spacious.tokens['size.control-min'].value,dimension(3));
  assert.deepEqual(spacious.tokens['space.panel'].value,dimension(2));
  assert.deepEqual(spacious.tokens['space.actions'].value,dimension(.5));
});

test('size families share geometry and type systems without scaling interactive floors', () => {
  const theme = resolveTheme();
  const scaled = resolveTheme({pins:{'size.scale-small':0.75,'size.type-scale-small':1.0625}});
  for (const role of Object.keys(sizingRoles)) for (const size of componentSizes) assert.ok(theme.tokens[`${role}-${size}`],`${role}-${size}`);
  for (const [role,base] of Object.entries(sizingRoles)) assert.deepEqual(theme.tokens[`${role}-medium`].value,theme.tokens[base].value);
  assert.deepEqual(scaled.tokens['size.avatar-small'].value,dimension(1.875));
  assert.deepEqual(scaled.tokens['size.control-small'].value,dimension(1.875));
  assert.deepEqual(scaled.tokens['font.ui.size-small'].value,dimension(1.0625));
  assert.deepEqual(theme.tokens['font.metadata.size-small'].value,dimension(.8125));
  assert.deepEqual(scaled.tokens['size.target-min'].value,theme.tokens['size.target-min'].value);
  assert.deepEqual(scaled.tokens['size.target-touch'].value,theme.tokens['size.target-touch'].value);
  assert.equal(new Set(sizingRoleCSS.map(role => role.role)).size,Object.keys(sizingRoles).length);
  assert.throws(()=>resolveTheme({pins:{'size.scale-small':0}}),errorCode('invalid-size-scale'));
});

test('size output pins remain independent and restoration returns to the coordinated scale', () => {
  const pins = {'size.scale-large':1.5,'size.avatar-large':dimension(3.25)};
  const pinned = resolveTheme({pins});
  assert.deepEqual(pinned.tokens['size.avatar-large'].value,dimension(3.25));
  assert.deepEqual(pinned.tokens['size.spinner-large'].value,dimension(1.875));
  assert.ok(!affectedTokens(pinned,['size.scale-large']).includes('size.avatar-large'));
  assert.ok(affectedTokens(pinned,['size.scale-large'],{potential:true}).includes('size.avatar-large'));
  const restored = resolveTheme({pins:restoreDerived(pins,'size.avatar-large')});
  assert.deepEqual(restored.tokens['size.avatar-large'].value,dimension(3.75));
  const candidate = createCandidate({base:resolveTheme(),theme:resolveTheme({density:'spacious',pins}),title:'Spacious with a pinned avatar'});
  assert.equal(resolveTheme(JSON.parse(candidate.artifacts['source.json']).options).sourceHash,candidate.candidateSourceHash);
});

test('managed size controls retain target guidance while code can express reviewed exceptions', () => {
  const theme = resolveTheme();
  validateManagedValue(theme,'size.scale-small',0.875);
  validateManagedValue(theme,'size.type-scale-small',0.9375);
  assert.throws(()=>validateManagedValue(theme,'size.target-min',{value:18,unit:'px'}),errorCode('managed-choice'));
  assert.deepEqual(resolveTheme({pins:{'size.target-min':{value:18,unit:'px'}}}).tokens['size.target-min'].value,{value:18,unit:'px'});
});

test('seed and foreground pins update accent dependencies in effective graph order', () => {
  const seed = colorFromHex('#a13698');
  const theme = resolveTheme({pins:{'color.action':seed,'color.action-hover':colorFromHex('#202020')}});
  assert.deepEqual(theme.tokens['color.action'].value,seed);
  assert.deepEqual(theme.tokens['color.action-hover'].value,colorFromHex('#202020'));
  assert.notDeepEqual(theme.tokens['color.action-pressed'].value,resolveTheme().tokens['color.action-pressed'].value);
  const actualMin = Math.min(...['color.action','color.action-hover','color.action-pressed'].map(id=>contrastRatio(theme.tokens['color.on-action'].value,theme.tokens[id].value)));
  assert.ok(actualMin > 0);
  assert.ok(affectedTokens(theme,['color.action-hover']).includes('color.on-action'));
});

test('rhythm and inset helpers preserve units and require context for mixed-unit radius math', () => {
  assert.deepEqual(deriveRhythm(dimension(.25))['1-5'],dimension(.375));
  assert.deepEqual(deriveInsetRadius(dimension(1),dimension(.25)),dimension(.75));
  assert.deepEqual(deriveInsetRadius(dimension(.25),dimension(.5)),dimension(0));
  assert.throws(() => deriveInsetRadius(dimension(1),{value:2,unit:'px'}),errorCode('context-required'));
  assert.throws(() => deriveRhythm(dimension(-1)),errorCode('invalid-rhythm'));
});

test('known sRGB/Oklab vector and round trips agree within conversion precision', () => {
  const red = srgbToOklab([1,0,0]);
  for (const [i,value] of [.6279553606,.2248630611,.1258462985].entries()) assert.ok(Math.abs(red[i]-value)<1e-8);
  for (const rgb of [[0,0,0],[1,1,1],[1,0,0],[0,1,0],[0,0,1],[.2,.4,.8]]) {
    const roundtrip = oklabToSrgb(srgbToOklab(rgb));
    for (let i=0;i<3;i++) assert.ok(Math.abs(roundtrip[i]-rgb[i])<2e-6);
  }
  assert.deepEqual(gamutMapOklab([2,.3,.2]),[1,1,1]);
  assert.deepEqual(gamutMapOklab([-1,.3,.2]),[0,0,0]);
  assert.ok(gamutMapOklab([.7,.7,.7]).every(channel=>channel>=0&&channel<=1));
});

test('contrast vectors include transparent foreground compositing and unknown-background rejection', () => {
  const black = colorFromHex('#000'); const white = colorFromHex('#fff');
  assert.equal(contrastRatio(black,white),21);
  assert.equal(contrastRatio(white,white),1);
  assert.ok(Math.abs(contrastRatio({...black,alpha:.5},white)-3.976653)<1e-5);
  assert.throws(()=>contrastRatio(white,{...black,alpha:.5}),errorCode('unknown-background'));
});

test('accent endpoints and a coordinated palette are deterministic, bounded, and independently usable', () => {
  const input = {seed:colorFromHex('#2457d6'),surface:colorFromHex('#fff'),emphasis:colorFromHex('#000')};
  assert.deepEqual(mixOklab(input.seed,input.surface,1),input.seed);
  assert.deepEqual(mixOklab(input.seed,input.surface,0),input.surface);
  const first = deriveAccent(input); const second = deriveAccent(input);
  assert.deepEqual(first,second);
  for (const role of ['action','hover','pressed','subtle','border','onAction']) assert.ok(first[role].components.every(channel=>channel>=0&&channel<=1));
  assert.ok(first.minimumContrast>=4.5);
  assert.throws(()=>deriveAccent({...input,seed:{...input.seed,alpha:.5}}),errorCode('unsupported-alpha'));
});

test('managed restrictions do not limit code-level customization', () => {
  const theme = resolveTheme();
  validateManagedValue(theme,'rhythm.base',dimension(.375));
  assert.throws(()=>validateManagedValue(theme,'rhythm.base',dimension(1)),errorCode('managed-choice'));
  assert.deepEqual(resolveTheme({pins:{'rhythm.base':dimension(1)}}).tokens['space.4'].value,dimension(4));
  assert.throws(()=>validateManagedValue(theme,'space.2','{space.icon-label}'),errorCode('managed-choice'));
  assert.equal(Object.keys(managedEditors(theme)).length,Object.keys(theme.tokens).length);
  assert.equal(editorDescriptor(theme,'font.body.size').supportsPin,true);
});

test('SHA-256 and canonical serialization support stable candidate identity', () => {
  for (const text of ['', 'abc', '🙂 中文 norsk', 'a'.repeat(1000), '\ud800']) assert.equal(sha256(text),createHash('sha256').update(text).digest('hex'));
  assert.equal(stableStringify({b:2,a:1}),stableStringify({a:1,b:2}));
  assert.throws(()=>stableStringify({a:Infinity}),TypeError);
});

test('prepared candidate reopens to identical source/CSS and detects a stale adoption base', () => {
  const base = resolveTheme();
  const theme = resolveTheme({name:'violet-review',pins:{'color.action':colorFromHex('#a13698'),'rhythm.base':dimension(.375)}});
  const candidate = createCandidate({base,theme,title:'Review violet settings'});
  assert.equal(candidate.status,'prepared');
  assert.deepEqual(candidate.evidence,[]);
  const reopened = resolveTheme(JSON.parse(candidate.artifacts['source.json']).options);
  assert.equal(reopened.sourceHash,theme.sourceHash);
  assert.equal(emitThemeCSS(reopened),candidate.artifacts['theme.css']);
  assert.equal(candidate.artifactHashes.css,`sha256:${createHash('sha256').update(candidate.artifacts['theme.css']).digest('hex')}`);
  assert.ok(candidate.changedTokens.includes('color.action'));
  assert.ok(candidate.affectedTokens.includes('space.panel'));
  assertCandidateBase(candidate,base);
  assert.throws(()=>assertCandidateBase(candidate,theme),errorCode('stale-base'));
  assert.equal(createCandidate({base,theme,title:'Review violet settings'}).id,candidate.id);
});

test('resolved portable exports re-import as valid typed documents', async () => {
  const exported = JSON.parse(await readFile(new URL('../dist/themes/dark.tokens.json',import.meta.url),'utf8'));
  const graph = resolveTokens(exported);
  assert.deepEqual(graph.tokens['color.canvas'].value,resolveTheme({mode:'dark'}).tokens['color.canvas'].value);
  assert.deepEqual(resolveTokens(sourceTokens).tokens['font.body.size'].value,dimension(1));
});

test('static default data exposes CSS values without relying on host default assignments', () => {
  assert.equal(defaultCSSValue('--en-font-body-size'),'1rem');
  assert.equal(defaultCSSValue('--en-layout-prose-max'),'66ch');
  assert.equal(valueCSS('fontWeight','semi-bold'),'600');
  assert.throws(()=>defaultCSSValue('--not-a-token'),RangeError);
});

test('CSS API requires explicit partial selection and rejects invalid scope inputs', () => {
  const theme = resolveTheme();
  assert.throws(()=>emitThemeCSS(theme,{kind:'partial'}),errorCode('missing-selection'));
  assert.throws(()=>emitThemeCSS(theme,{kind:'partial',tokenIds:['missing']}),errorCode('unknown-token'));
  assert.throws(()=>emitThemeCSS(theme,{selector:'.x { color:red }'}),errorCode('invalid-selector'));
  assert.throws(()=>resolveTheme({name:'x"] {}'}),errorCode('invalid-theme-name'));
});
