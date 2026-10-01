import test from 'node:test';
import assert from 'node:assert/strict';
import {
	createReviewDraft, reopenReviewDraft, resolveTheme, emitThemeCSS,
	colorFromHex, validateManagedValue,
} from '../dist/index.js';

const dimension = value => ({ value, unit: 'rem' });
const metadata = { title: 'Review local theme', rationale: 'Compare a constrained customization.' };
const hasCode = code => error => error.code === code;
const editedFile = (json, change) => { const file = JSON.parse(json); change(file); return JSON.stringify(file); };

test('pinning preserves a rule through coordinated changes and restoration rejoins it', () => {
	const draft = createReviewDraft();
	const independent = createReviewDraft();
	draft.setToken('space.2', dimension(.5));
	draft.setToken('rhythm.base', dimension(.375));
	assert.deepEqual(draft.theme.tokens['space.2'].value, dimension(.5));
	assert.equal(draft.theme.tokens['space.2'].provenance, 'pin');
	assert.equal(draft.canRestore('space.2'), true);
	draft.restoreToken('space.2');
	assert.deepEqual(draft.theme.tokens['space.2'].value, dimension(.75));
	assert.equal(draft.theme.tokens['space.2'].provenance, 'recipe');
	assert.equal(draft.canRestore('space.2'), false);
	assert.deepEqual(independent.theme.tokens['rhythm.base'].value, dimension(.25));
});

test('managed choices stay anchored while aliases follow the current graph', () => {
	const draft = createReviewDraft();
	const choices = draft.editor('layout.form-max').choices;
	draft.setToken('layout.form-max', dimension(42));
	assert.deepEqual(draft.editor('layout.form-max').choices, choices);
	const accepted = draft.theme;
	assert.throws(() => draft.setToken('layout.form-max', dimension(63)), hasCode('managed-choice'));
	assert.equal(draft.theme, accepted);
	draft.setToken('space.2', '{space.4}');
	assert.equal(draft.editor('space.4').aliasTargets.includes('space.2'), false);
	assert.throws(() => draft.setToken('space.4', '{space.2}'), hasCode('managed-choice'));
	assert.deepEqual(draft.theme.tokens['space.4'].value, dimension(1));
});

test('restore removes a source-overlay pin without discarding unrelated group metadata', () => {
	const draft = createReviewDraft({ source: { space: {
		$description: 'Retained group metadata',
		'2': { $type: 'dimension', $value: dimension(9), $description: 'Code override' },
	} } });
	draft.setToken('rhythm.base', dimension(.375));
	draft.restoreToken('space.2');
	assert.deepEqual(draft.theme.tokens['space.2'].value, dimension(.75));
	assert.equal(draft.options.source.space.$description, 'Retained group metadata');
	assert.deepEqual(draft.base.tokens['space.2'].value, dimension(9));
	const reopened = reopenReviewDraft(draft.exportJSON(metadata));
	assert.equal(reopened.theme.sourceHash, draft.theme.sourceHash);
});

test('undo, redo, reset and a new branch retain exact accepted snapshots', () => {
	const draft = createReviewDraft();
	const baseHash = draft.theme.sourceHash;
	draft.setToken('color.brand', colorFromHex('#146C43'));
	const editedHash = draft.theme.sourceHash;
	const prepared = draft.prepare(metadata);
	draft.reset();
	assert.equal(draft.theme.sourceHash, baseHash);
	draft.undo();
	assert.equal(draft.theme.sourceHash, editedHash);
	draft.redo();
	assert.equal(draft.theme.sourceHash, baseHash);
	draft.undo();
	draft.setContext({ density: 'spacious' });
	assert.equal(draft.canRedo, false);
	assert.equal(prepared.candidateSourceHash, editedHash);
	assert.equal(prepared.status, 'prepared');
	assert.ok(Object.isFrozen(prepared.artifacts));
});

test('replay reproduces retained context pins and an exceptional derived value exactly', () => {
	const draft = createReviewDraft();
	draft.setToken('size.control-min', dimension(2.5));
	draft.setContext({ density: 'spacious' });
	draft.setToken('size.scale-small', 1.25);
	const preserved = draft.theme.tokens['size.avatar-small'].value;
	draft.setToken('size.avatar-small', preserved);
	draft.setToken('size.scale-small', .75);
	const reopened = reopenReviewDraft(draft.exportJSON(metadata), { baseOptions: {} });
	assert.deepEqual(reopened.theme.tokens['size.avatar-small'].value, preserved);
	assert.deepEqual(reopened.theme.tokens['size.control-min'].value, dimension(2.5));
	assert.equal(reopened.theme.sourceHash, draft.theme.sourceHash);
	assert.equal(emitThemeCSS(reopened.theme), emitThemeCSS(draft.theme));
	assert.equal(reopened.prepare(metadata).id, draft.prepare(metadata).id);
});

test('a code-authored exceptional base reopens without managed-value normalization', () => {
	const baseOptions = { pins: { 'rhythm.base': dimension(1) } };
	const draft = createReviewDraft(baseOptions);
	draft.setToken('color.brand', colorFromHex('#A13698'));
	const reopened = reopenReviewDraft(draft.exportJSON(metadata), { baseOptions });
	assert.deepEqual(reopened.theme.tokens['rhythm.base'].value, dimension(1));
	assert.equal(reopened.theme.sourceHash, draft.theme.sourceHash);
});

test('invalid file/base/compiler/artifacts cannot replace an existing usable draft', () => {
	const draft = createReviewDraft();
	draft.setToken('rhythm.base', dimension(.375));
	const accepted = draft.theme;
	const json = draft.exportJSON(metadata);
	assert.throws(() => reopenReviewDraft('{'), hasCode('review-json'));
	assert.throws(() => reopenReviewDraft(editedFile(json, f => { f.unrecognized = true; })), hasCode('review-schema'));
	assert.throws(() => reopenReviewDraft(editedFile(json, f => { f.candidate.baseSourceHash = 'stale'; })), hasCode('stale-base'));
	assert.throws(() => reopenReviewDraft(json, { baseOptions: { mode: 'dark' } }), hasCode('stale-base'));
	assert.throws(() => reopenReviewDraft(editedFile(json, f => { f.candidate.compilerVersion = 'future'; })), hasCode('unsupported-compiler'));
	assert.throws(() => reopenReviewDraft(editedFile(json, f => { f.candidate.artifacts['theme.css'] += 'body { display: none }'; })), hasCode('artifact-integrity'));
	assert.throws(() => reopenReviewDraft(editedFile(json, f => { f.candidate.artifactHashes.css = 'fake'; })), hasCode('artifact-integrity'));
	assert.throws(() => reopenReviewDraft(editedFile(json, f => { f.candidate.candidateSourceHash = 'fake'; })), hasCode('candidate-integrity'));
	assert.equal(draft.theme, accepted);
});

test('reopening revalidates the managed operation sequence instead of trusting final data', () => {
	const draft = createReviewDraft();
	draft.setToken('rhythm.base', dimension(.375));
	const json = draft.exportJSON(metadata);
	assert.throws(() => reopenReviewDraft(editedFile(json, f => { f.edits[0].value = dimension(100); })), hasCode('managed-choice'));
	assert.throws(() => reopenReviewDraft(editedFile(json, f => { f.edits[0].script = 'ignored?'; })), hasCode('review-schema'));
	assert.throws(() => reopenReviewDraft(editedFile(json, f => { f.edits = Array.from({ length: 1001 }, () => ({ type: 'context', mode: 'light' })); })), hasCode('review-capacity'));
	assert.throws(() => reopenReviewDraft(' '.repeat(8 * 1024 * 1024 + 1)), hasCode('review-capacity'));
});

test('managed Bézier bounds do not remove code-level overshoot support', () => {
	const curve = [.2, -.1, 0, 1.1];
	assert.throws(() => validateManagedValue(resolveTheme(), 'ease.standard', curve), hasCode('managed-choice'));
	assert.deepEqual(resolveTheme({ pins: { 'ease.standard': curve } }).tokens['ease.standard'].value, curve);
	const draft = createReviewDraft();
	const current = draft.theme;
	assert.throws(() => draft.setToken('ease.standard', curve), hasCode('managed-choice'));
	assert.equal(draft.theme, current);
	draft.setToken('ease.standard', [.2, 0, 0, 1]);
	assert.equal(draft.theme.tokens['ease.standard'].provenance, 'pin');
});

test('incremental reopen forks a validated exact prefix and preserves prior state', () => {
	const author = createReviewDraft();
	author.setToken('rhythm.base', dimension(.375));
	const previous = reopenReviewDraft(author.exportJSON(metadata));
	const previousHash = previous.theme.sourceHash;
	author.setToken('color.brand', colorFromHex('#146C43'));
	const json = author.exportJSON(metadata);
	const next = reopenReviewDraft(json, { previousDraft: previous });
	assert.notEqual(next, previous);
	assert.equal(next.theme.sourceHash, author.theme.sourceHash);
	assert.equal(next.theme.sourceHash, reopenReviewDraft(json).theme.sourceHash);
	assert.equal(previous.theme.sourceHash, previousHash);
	next.undo();
	assert.equal(next.theme.sourceHash, previousHash);
	assert.equal(previous.theme.sourceHash, previousHash);
});

test('incremental suffix and artifact failures leave the previous preview unchanged', () => {
	const author = createReviewDraft();
	author.setToken('rhythm.base', dimension(.375));
	const previous = reopenReviewDraft(author.exportJSON(metadata));
	const previousHash = previous.theme.sourceHash;
	author.setToken('color.brand', colorFromHex('#146C43'));
	const json = author.exportJSON(metadata);
	assert.throws(() => reopenReviewDraft(editedFile(json, file => {
		file.edits.push({ type: 'token', id: 'rhythm.base', value: dimension(100) });
	}), { previousDraft: previous }), hasCode('managed-choice'));
	assert.throws(() => reopenReviewDraft(editedFile(json, file => {
		file.candidate.artifacts['theme.css'] += 'body { display: none }';
	}), { previousDraft: previous }), hasCode('artifact-integrity'));
	assert.equal(previous.theme.sourceHash, previousHash);
	assert.equal(reopenReviewDraft(json, { previousDraft: previous }).theme.sourceHash, author.theme.sourceHash);
});

test('a divergent edit prefix or base falls back to complete validation', () => {
	const first = createReviewDraft();
	first.setToken('rhythm.base', dimension(.375));
	const previous = reopenReviewDraft(first.exportJSON(metadata));
	const second = createReviewDraft();
	second.setToken('rhythm.base', dimension(.5));
	const next = reopenReviewDraft(second.exportJSON(metadata), { previousDraft: previous });
	assert.equal(next.theme.sourceHash, second.theme.sourceHash);
	const dark = createReviewDraft({ mode: 'dark' });
	dark.setToken('rhythm.base', dimension(.375));
	assert.equal(reopenReviewDraft(dark.exportJSON(metadata), { previousDraft: previous }).theme.sourceHash, dark.theme.sourceHash);
	assert.throws(() => reopenReviewDraft(editedFile(second.exportJSON(metadata), file => {
		file.edits[0].value = dimension(100);
	}), { previousDraft: previous }), hasCode('managed-choice'));
});
