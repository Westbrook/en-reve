import test from 'node:test';
import assert from 'node:assert/strict';
import {
	resolveTokens, resolveTheme, mixOklab, colorFromHex, contrastRatio,
	createReviewDraft, reopenReviewDraft, emitThemeCSS,
} from '../dist/index.js';

const dimension = value => ({value, unit:'rem'});
const recipe = evaluate => ({version:'fixture/v1', dependencies:[], evaluate});
const color = components => ({colorSpace:'srgb', components});
const hasCode = code => error => error.code === code;

test('computed color has one value before aliases, downstream recipes, CSS and review', () => {
	const raw = mixOklab(colorFromHex('#2457d6'), colorFromHex('#ffffff'), .32);
	const document = {
		computed: {$type:'color', $value:colorFromHex('#000000')},
		alias: {$type:'color', $value:'{computed}'},
		consumer: {$type:'color', $value:colorFromHex('#000000')},
	};
	let consumed;
	const graph = resolveTokens(document, {recipes:{
		computed:recipe(() => raw),
		consumer:{version:'fixture/v1', dependencies:['alias'], evaluate:get => (consumed = get('alias'))},
	}});
	const expected = color([.712363814589, .797800700391, .966309125792]);
	assert.deepEqual(graph.tokens.computed.value, expected);
	assert.deepEqual(graph.tokens.alias.value, expected);
	assert.deepEqual(consumed, expected);
	assert.deepEqual(graph.tokens.consumer.value, expected);
	assert.equal(graph.tokens.computed.cssValue, 'rgb(181.65277272 203.4391786 246.40882708 / 1)');
	assert.ok(Object.isFrozen(graph.tokens.computed.value.components));
	assert.notDeepEqual(raw, expected);
});

test('only recipe results are canonical; literals and direct or alias pins retain author precision', () => {
	const authored = .12345678901234567;
	const document = {
		input: {$type:'number', $value:authored},
		alias: {$type:'number', $value:'{input}'},
		output: {$type:'number', $value:0},
	};
	const original = structuredClone(document);
	const recipes = {output:{version:'fixture/v1', dependencies:['input'], evaluate:get => get('input')}};
	const computed = resolveTokens(document, {recipes});
	assert.equal(computed.tokens.input.value, authored);
	assert.equal(computed.tokens.alias.value, authored);
	assert.equal(computed.tokens.output.value, .123456789012);
	assert.equal(resolveTokens(document, {recipes, pins:{output:authored}}).tokens.output.value, authored);
	assert.equal(resolveTokens(document, {recipes, pins:{output:'{input}'}}).tokens.output.value, authored);
	assert.deepEqual(document, original);
});

test('composite recipe values preserve types, units and very small and large magnitudes', () => {
	const rawShadow = {
		color: {...color([1 / 3, .5, 1]), alpha:1 / 3},
		offsetX:dimension(1 / 3), offsetY:dimension(1e-20 / 3),
		blur:dimension(1e15 / 3), spread:{value:0, unit:'px'}, inset:true,
	};
	const document = {
		shadow:{$type:'shadow', $value:rawShadow},
		curve:{$type:'cubicBezier', $value:[0,0,1,1]},
		duration:{$type:'duration', $value:{value:1,unit:'ms'}},
		limit:{$type:'number', $value:0},
	};
	const result = resolveTokens(document, {recipes:{
		shadow:recipe(() => [rawShadow]), curve:recipe(() => [1 / 3,-1 / 3,2 / 3,1.1]),
		duration:recipe(() => ({value:1 / 3,unit:'s'})), limit:recipe(() => Number.MAX_VALUE),
	}});
	const [shadow] = result.tokens.shadow.value;
	assert.deepEqual(shadow.color, {...color([.333333333333,.5,1]),alpha:.333333333333});
	assert.deepEqual(shadow.offsetX, dimension(.333333333333));
	assert.deepEqual(shadow.offsetY, dimension(3.33333333333e-21));
	assert.deepEqual(shadow.blur, dimension(333333333333000));
	assert.equal(shadow.inset,true);
	assert.deepEqual(result.tokens.curve.value,[.333333333333,-.333333333333,.666666666667,1.1]);
	assert.deepEqual(result.tokens.duration.value,{value:.333333333333,unit:'s'});
	assert.equal(result.tokens.limit.value,1.79769313486e308);
	assert.ok(Number.isFinite(result.tokens.limit.value));
});

test('raw invalid recipe output cannot be repaired into an accepted value by rounding', () => {
	const document = {output:{$type:'color', $value:color([0,0,0])}};
	for (const invalid of [color([1 + Number.EPSILON,0,0]),color([-Number.EPSILON,0,0]),color([Infinity,0,0])]) {
		assert.throws(() => resolveTokens(document,{recipes:{output:recipe(() => invalid)}}),hasCode('invalid-value'));
	}
});

test('author precision remains part of source identity even when derived values converge', () => {
	const first = resolveTheme({pins:{'rhythm.base':dimension(.123456789012345)}});
	const second = resolveTheme({pins:{'rhythm.base':dimension(.123456789012346)}});
	assert.notEqual(first.sourceHash,second.sourceHash);
	assert.deepEqual(first.tokens['space.2'].value,second.tokens['space.2'].value);
	assert.deepEqual(first.pins['rhythm.base'],dimension(.123456789012345));
	assert.deepEqual(second.pins['rhythm.base'],dimension(.123456789012346));
	const draft = createReviewDraft({pins:{'rhythm.base':dimension(.123456789012345)}});
	draft.setToken('palette.accent',colorFromHex('#0f6cbd'));
	const reopened = reopenReviewDraft(draft.exportJSON({title:'Precise authored rhythm'}));
	assert.deepEqual(reopened.options.pins['rhythm.base'],dimension(.123456789012345));
	assert.equal(emitThemeCSS(reopened.theme),emitThemeCSS(draft.theme));
});

test('diagnostics keep a raw failure near 4.5 even when its serialized measure rounds to 4.5', () => {
	const gray = .4653190469815;
	const foreground = color([gray,gray,gray]);
	const measured = contrastRatio(foreground,colorFromHex('#ffffff'));
	assert.ok(measured < 4.5 && measured > 4.49999999999);
	const theme = resolveTheme({pins:{'color.text':foreground}});
	const diagnostic = theme.diagnostics.find(entry => entry.tokens[0] === 'color.text');
	assert.ok(diagnostic);
	assert.equal(diagnostic.measured,4.5);
});
