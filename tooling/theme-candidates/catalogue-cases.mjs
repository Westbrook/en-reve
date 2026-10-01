import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import nodeTest from 'node:test';
const cases = [];
const test = (name, run) => cases.push({ name, run });
import {
	colorFromHex, contrastRatio, createReviewDraft, createThemePair, emitThemePairCSS, reopenThemeReviewPair, stableStringify, validateRenderedRelationships,
} from '@en-reve/tokens';
import { exportReviewBundle, reopenReviewBundle } from '../../apps/docs/src/theme-review/bundle.ts';
import { candidateIds, validateCandidateDefinitions } from './catalogue.mjs';

// prepare:docs supplies bundle.ts's authoritative generated catalogue. A synthetic
// build isolates recipe transport and trust tests from distribution generation;
// these tests do not assert that documentation assets were rendered or reviewed.
const build = {
	schemaVersion: 1,
	fingerprint: `sha256:${'0'.repeat(64)}`,
	assets: [],
	caseIds: ['catalogue-roundtrip'],
	pages: [{ id: 'sheet', path: '/', caseIds: ['catalogue-roundtrip'] }],
};
const definitions = JSON.parse(await readFile(new URL('./definitions.json', import.meta.url), 'utf8'));
const modes = ['light', 'dark'];
const metadata = { title: 'Baseline trust regression', rationale: 'Exercise valid exports with independently checked authoritative bases.' };

function replay(edits, baseOptions) {
	const draft = createReviewDraft(baseOptions ?? {});
	assert.ok(Array.isArray(edits) && edits.length > 0, 'A candidate branch needs authored edits.');
	for (const edit of edits) {
		if (edit.type === 'context') {
			const { type, ...context } = edit;
			draft.setContext(context);
		} else if (edit.type === 'token') draft.setToken(edit.id, edit.value);
		else if (edit.type === 'restore') draft.restoreToken(edit.id);
		else assert.fail(`Unsupported candidate edit: ${edit.type}`);
	}
	return draft;
}

function pairFromBaselines(name, baseOptions) {
	const pair = { name };
	for (const mode of modes) {
		pair[mode] = createReviewDraft(baseOptions[mode]);
		pair[mode].setContext({ mode });
	}
	return pair;
}

test('the catalogue contains all seven inspired and three original pairs in canonical order', () => {
	assert.equal(candidateIds.length, 10);
	assert.equal(definitions.length * modes.length, 20);
	assert.deepEqual(candidateIds, [
		'spectrum-inspired', 'fluent-inspired', 'astryx-inspired', 'shadcn-inspired',
		'radix-inspired', 'web-awesome-inspired', 'holotable-inspired', 'vellum', 'signal', 'kinetic',
	]);
	assert.equal(validateCandidateDefinitions(definitions), definitions);
});

test('catalogue validation rejects wrong recipe branches and incomplete branch baselines', () => {
	const wrongBranch = structuredClone(definitions);
	wrongBranch[0].inputs.light = wrongBranch[0].inputs.dark;
	assert.throws(() => validateCandidateDefinitions(wrongBranch), /canonical theme and branch/);
	const wrongPath = structuredClone(definitions);
	wrongPath[0].inputs.light = '../outside.light.json';
	assert.throws(() => validateCandidateDefinitions(wrongPath), /canonical theme and branch/);
	const missingBase = structuredClone(definitions);
	missingBase[0].baseOptions = { light: {} };
	assert.throws(() => validateCandidateDefinitions(missingBase), /both authoritative branch baselines/);
});

test('Web Awesome-inspired action text, focus and functional boundaries remain legible on both surface contexts', async () => {
	const definition = definitions.find(item => item.id === 'web-awesome-inspired');
	for (const mode of modes) {
		const edits = JSON.parse(await readFile(new URL(definition.inputs[mode], import.meta.url), 'utf8'));
		const { tokens } = replay(edits, definition.baseOptions[mode]).theme;
		const relationships = [];
		for (const surface of ['color.surface', 'color.surface-raised']) {
			for (const role of ['color.focus', 'color.boundary']) assert.ok(contrastRatio(tokens[role].value, tokens[surface].value) >= 3, `${mode}/${role}/${surface}`);
			for (const variant of ['primary', 'secondary', 'ghost', 'danger']) for (const state of ['rest', 'hover', 'pressed']) relationships.push({
				id: `${mode}/${surface}/${variant}/${state}`, consumer: 'button', appearance: mode, state, minimum: 4.5,
				foreground: tokens[`theme.button.${variant}.${state}-color`].value,
				backgrounds: [tokens[`theme.button.${variant}.${state}-background`].value, tokens[surface].value],
			});
		}
		assert.deepEqual(validateRenderedRelationships(relationships).filter(result => result.status !== 'pass'), []);
	}
});

for (const definition of definitions) {
	test(`${definition.id}: both branches preserve authored baselines through managed edit, undo and paired round-trip`, async () => {
		const pair = { name: definition.id };
		for (const mode of modes) {
			const edits = JSON.parse(await readFile(new URL(definition.inputs[mode], import.meta.url), 'utf8'));
			const draft = replay(edits, definition.baseOptions?.[mode] ?? {});
			assert.equal(draft.theme.mode, mode);
			assert.equal(draft.theme.density, definition.density);
			assert.deepEqual(draft.theme.diagnostics, []);
			pair[mode] = draft;
		}
		const resolved = createThemePair({ name: pair.name, light: pair.light.theme, dark: pair.dark.theme });
		const css = emitThemePairCSS(resolved);
		const candidateMetadata = { title: definition.title, rationale: definition.rationale };
		const initialExports = Object.fromEntries(modes.map(mode => [mode, exportReviewBundle(pair[mode], build, candidateMetadata, {}, { pair })]));
		for (const mode of modes) {
			const draft = pair[mode];
			const sourceHash = draft.theme.sourceHash;
			const tokens = stableStringify(draft.theme.tokens);
			const baselineHash = draft.base.sourceHash;
			const authoredSource = stableStringify(draft.options.source ?? {});
			const typographyAndElevation = () => stableStringify(Object.fromEntries(Object.entries(draft.theme.tokens)
				.filter(([, token]) => token.type === 'fontFamily' || token.type === 'shadow')
				.map(([id, token]) => [id, token.value])));
			const originalTypographyAndElevation = typographyAndElevation();
			const replacement = ['#2D5A87', '#C46A21'].map(colorFromHex)
				.find(value => stableStringify(value) !== stableStringify(draft.theme.tokens['color.action'].value));
			assert.ok(replacement, 'The managed edit must use a distinct allowed sRGB value.');
			assert.equal(draft.setToken('color.action', replacement), true);
			assert.notEqual(draft.theme.sourceHash, sourceHash);
			assert.deepEqual(draft.theme.tokens['color.action'].value, replacement);
			assert.equal(draft.base.sourceHash, baselineHash, 'Managed editing retains the authoritative baseline.');
			assert.equal(stableStringify(draft.options.source ?? {}), authoredSource, 'Managed editing retains the authored source document.');
			assert.equal(typographyAndElevation(), originalTypographyAndElevation, 'Custom font stacks and structured shadows survive managed editing.');
			assert.equal(draft.undo(), true);
			assert.equal(draft.base.sourceHash, baselineHash);
			assert.equal(stableStringify(draft.options.source ?? {}), authoredSource);
			assert.equal(draft.theme.sourceHash, sourceHash, 'Undo restores the exact authored branch identity.');
			assert.equal(stableStringify(draft.theme.tokens), tokens, 'Undo restores every resolved token, including source fonts and shadows.');
			assert.equal(exportReviewBundle(draft, build, candidateMetadata, {}, { pair }), initialExports[mode], 'Export after undo is byte-identical to the unedited pair.');
		}
		for (const activeAppearance of modes) {
			const exported = exportReviewBundle(pair[activeAppearance], build, candidateMetadata, {}, { pair });
			assert.equal(exported, initialExports[activeAppearance]);
			const envelope = JSON.parse(exported);
			assert.equal(envelope.schemaVersion, 2);
			assert.equal(envelope.activeAppearance, activeAppearance);
			assert.equal(envelope.draft.pairSourceHash, resolved.sourceHash);
			assert.equal(envelope.draft.artifacts['theme.css'], css);
			const reopened = reopenReviewBundle(exported, build);
			assert.ok(reopened.pair);
			assert.equal(reopened.pair.name, definition.id);
			assert.equal(reopened.draft, reopened.pair[activeAppearance]);
			assert.equal(reopened.title, candidateMetadata.title);
			assert.equal(reopened.rationale, candidateMetadata.rationale);
			for (const mode of modes) {
				assert.equal(reopened.pair[mode].base.sourceHash, pair[mode].base.sourceHash);
				assert.equal(reopened.pair[mode].theme.sourceHash, pair[mode].theme.sourceHash);
				assert.equal(stableStringify(reopened.pair[mode].theme.tokens), stableStringify(pair[mode].theme.tokens));
			}
			const reopenedTheme = createThemePair({ name: reopened.pair.name, light: reopened.pair.light.theme, dark: reopened.pair.dark.theme });
			assert.equal(reopenedTheme.sourceHash, resolved.sourceHash);
			assert.equal(emitThemePairCSS(reopenedTheme), css);
			assert.equal(exportReviewBundle(reopened.draft, build, candidateMetadata, {}, { pair: reopened.pair }), exported);
		}
	});
}

test('a known candidate cannot replace its authoritative base with a valid self-consistent export', () => {
	const definition = definitions.find(candidate => candidate.id === 'vellum');
	assert.ok(definition, 'The regression must exercise an original candidate with an authored baseline.');
	assert.ok(definition.baseOptions);
	const altered = structuredClone(definition.baseOptions);
	for (const mode of modes) {
		altered[mode].pins = { ...altered[mode].pins, 'radius.control': { value: 13, unit: 'px' } };
		assert.notEqual(createReviewDraft(altered[mode]).base.sourceHash, createReviewDraft(definition.baseOptions[mode]).base.sourceHash);
	}
	const pair = pairFromBaselines(definition.id, altered);
	const exported = exportReviewBundle(pair.light, build, metadata, {}, { pair });
	// Supplying the author's own altered base proves this is a structurally valid
	// pair with valid inner artifact hashes, not merely a corrupted JSON fixture.
	const independentlyOpened = reopenThemeReviewPair(JSON.stringify(JSON.parse(exported).draft), { baseOptions: altered });
	assert.equal(independentlyOpened.light.theme.sourceHash, pair.light.theme.sourceHash);
	assert.throws(() => reopenReviewBundle(exported, build), { code: 'stale-base' });
});

test('unknown pair names cannot nominate custom bases, while ordinary default-base pairs remain portable', () => {
	const altered = {
		light: { pins: { 'radius.control': { value: 13, unit: 'px' } } },
		dark: { pins: { 'radius.control': { value: 13, unit: 'px' } } },
	};
	const custom = pairFromBaselines('custom-unregistered-pair', altered);
	const customExport = exportReviewBundle(custom.dark, build, metadata, {}, { pair: custom });
	const independentlyOpened = reopenThemeReviewPair(JSON.stringify(JSON.parse(customExport).draft), { baseOptions: altered });
	assert.equal(independentlyOpened.dark.theme.sourceHash, custom.dark.theme.sourceHash);
	assert.throws(() => reopenReviewBundle(customExport, build), { code: 'stale-base' });
	const ordinary = pairFromBaselines('ordinary-unregistered-pair', { light: {}, dark: {} });
	for (const activeAppearance of modes) {
		const exported = exportReviewBundle(ordinary[activeAppearance], build, metadata, {}, { pair: ordinary });
		const reopened = reopenReviewBundle(exported, build);
		assert.equal(reopened.pair.name, ordinary.name);
		assert.equal(reopened.draft, reopened.pair[activeAppearance]);
		assert.equal(exportReviewBundle(reopened.draft, build, metadata, {}, { pair: reopened.pair }), exported);
	}
});

test('companion export regenerates after editing, and rejects replaced CSS even with recomputed envelope integrity', async () => {
 const {hashValue}=await import('@en-reve/tokens');
 const d=definitions.find(d=>d.id==='radix-inspired');const pair={name:d.id};
 for(const mode of modes)pair[mode]=replay(JSON.parse(await readFile(new URL(d.inputs[mode],import.meta.url),'utf8')),d.baseOptions[mode]);
 const initial=JSON.parse(exportReviewBundle(pair.light,build,metadata,{}, {pair}));
 assert.ok(initial.companion?.css.includes('prefers-color-scheme: dark'));
 pair.light.setToken('color.action',colorFromHex('#305090'));
 const edited=JSON.parse(exportReviewBundle(pair.light,build,metadata,{}, {pair}));
 assert.notEqual(edited.companion.identity,initial.companion.identity);
 assert.notEqual(edited.companion.css,initial.companion.css);
 edited.companion.css+='\nbody { display: none; }';
 const {integrity,...payload}=edited;
 assert.throws(()=>reopenReviewBundle(JSON.stringify({...payload,integrity:hashValue(payload)}),build),/companion recipe does not match/);
});

for (const id of ['fluent-inspired', 'radix-inspired']) test(`${id} option focus contour stays inset and contrasts with its active row`, async () => {
 const definition = definitions.find(item => item.id === id);
 for (const mode of modes) {
  const draft = replay(JSON.parse(await readFile(new URL(definition.inputs[mode], import.meta.url), 'utf8')), definition.baseOptions[mode]);
  const value = id => draft.theme.tokens[id].value;
  const width = value('component.option.focus-width'), offset = value('component.option.focus-offset');
  assert.equal(width.unit, 'px'); assert.equal(offset.unit, 'px');
  assert.ok(width.value >= 2); assert.ok(offset.value <= -width.value, `${id} ${mode}: complete outline stays within the active row`);
  const active = value('component.option.active-background');
  assert.ok([0, 1].includes(active.alpha ?? 1));
  const background = active.alpha === 0 ? value('component.option-list.background') : active;
  const foreground = value('component.option.focus-color');
  assert.equal(foreground.alpha ?? 1, 1); assert.equal(background.alpha ?? 1, 1);
  assert.ok(contrastRatio(foreground, background) >= 3, `${id} ${mode}: the focus outline needs 3:1 against its painted active row`);
 }
});

/** All definitions are registered before partitioning, so additions cannot be omitted. */
export const catalogueCaseNames = Object.freeze(cases.map(item => item.name));
export function registerCatalogueCases(group = 0, groups = 1) {
  if (!Number.isInteger(groups) || groups < 1 || !Number.isInteger(group) || group < 0 || group >= groups) throw new Error('Invalid catalogue partition');
  cases.forEach((item, index) => { if (index % groups === group) nodeTest(item.name, item.run); });
}
