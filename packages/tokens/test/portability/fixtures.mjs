/** Shared native ESM fixtures, executed without rewriting in Node and each browser. */
export const fixtureNames = ['light', 'dark', 'diagnostics', 'authored-precision'];

const dimension = value => ({ value, unit: 'rem' });
export const preciseNumber = 1.234567890123456;
export const preciseDimension = .123456789012345;
export const preciseColor = {
	colorSpace: 'srgb',
	components: [.123456789012345, .345678901234567, .789012345678901],
};

export function metadata(name) {
	return { title: `Portable ${name}`, rationale: 'Exercise exact review export and replay across JavaScript runtimes.' };
}

export function createFixture(api, name) {
	const { createReviewDraft, colorFromHex } = api;
	const baseOptions = name === 'authored-precision' ? {
		source: { font: { ui: { 'line-height': { $type: 'number', $value: preciseNumber } } } },
		pins: { 'rhythm.base': dimension(preciseDimension), 'color.brand': preciseColor },
	} : {};
	const draft = createReviewDraft(baseOptions);
	if (name === 'light') {
		draft.setToken('color.brand', colorFromHex('#0f6cbd'));
		draft.setToken('rhythm.base', dimension(.375));
		draft.setToken('space.2', dimension(.5));
		draft.restoreToken('space.2');
	} else if (name === 'dark') {
		draft.setContext({ mode: 'dark', density: 'spacious' });
		draft.setToken('color.brand', colorFromHex('#1473e6'));
		draft.setToken('rhythm.base', dimension(.5));
	} else if (name === 'diagnostics') {
		// Fixed authored channel; computing it per runtime would itself create different source bytes.
		const nearThreshold = .4653190469815008;
		draft.setToken('color.text', { colorSpace: 'srgb', components: [nearThreshold, nearThreshold, nearThreshold] });
		draft.setToken('color.text-muted', colorFromHex('#9a99a7'));
		draft.setToken('color.brand', colorFromHex('#a13698'));
	} else if (name === 'authored-precision') {
		draft.setToken('color.surface', colorFromHex('#fefefe'));
	} else {
		throw new Error(`Unknown fixture ${name}.`);
	}
	return { draft, baseOptions };
}

export function summary(draft, name) {
	const candidate = draft.prepare(metadata(name));
	return {
		baseSourceHash: candidate.baseSourceHash,
		candidateSourceHash: candidate.candidateSourceHash,
		id: candidate.id,
		artifactHashes: candidate.artifactHashes,
		changedTokens: candidate.changedTokens,
		diagnostics: candidate.diagnostics,
		precision: name === 'authored-precision' ? {
			literal: draft.theme.tokens['font.ui.line-height'].value,
			alias: draft.theme.tokens['font.input.line-height'].value,
			dimension: draft.theme.tokens['rhythm.base'].value,
			color: draft.theme.tokens['color.brand'].value,
		} : null,
	};
}

export function authorFixtures(api) {
	return Object.fromEntries(fixtureNames.map(name => {
		const { draft, baseOptions } = createFixture(api, name);
		const rawNearThreshold = name === 'diagnostics'
			? api.contrastRatio(draft.theme.tokens['color.text'].value, draft.theme.tokens['color.surface'].value)
			: null;
		return [name, { json: draft.exportJSON(metadata(name)), baseOptions, summary: summary(draft, name), rawNearThreshold }];
	}));
}

export function reopenFixture(api, name, json, baseOptions) {
	const draft = api.reopenReviewDraft(json, { baseOptions });
	return { json: draft.exportJSON(metadata(name)), summary: summary(draft, name) };
}

/** Integrity checks stay strict after numeric output is made portable. */
export function rejectedMutations(api, json) {
	const changes = [
		['css', 'artifact-integrity', file => { file.candidate.artifacts['theme.css'] += '\n:root { --unexpected: 1 }'; }],
		['changes-artifact', 'artifact-integrity', file => { file.candidate.artifacts['changes.json'] += ' '; }],
		['candidate-hash', 'candidate-integrity', file => { file.candidate.candidateSourceHash = 'sha256:incorrect'; }],
		['diagnostic-measurement', 'candidate-integrity', file => { file.candidate.diagnostics[0].measured += .0001; }],
	];
	return changes.map(([name, expected, mutate]) => {
		const file = JSON.parse(json);
		mutate(file);
		try {
			api.reopenReviewDraft(JSON.stringify(file));
			return { name, expected, actual: 'accepted' };
		} catch (error) {
			return { name, expected, actual: error.code ?? error.name };
		}
	});
}
