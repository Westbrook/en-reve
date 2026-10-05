import type { EditorDescriptor, ResolvedTheme, ThemeDensity, ThemeMode, ThemeOptions, TokenDocument } from './types.js';
import type { CandidateOptions } from './candidate.js';
import { createCandidate, assertCandidateBase } from './candidate.js';
import { editorDescriptor, validateManagedValue } from './admin.js';
import { flattenTokens } from './graph.js';
import { stableStringify } from './hash.js';
import { resolveTheme } from './theme.js';
import { aliasTarget, clone, deepFreeze, isRecord, TokenError } from './value.js';

export type ReviewDraftMetadata = Omit<CandidateOptions, 'base' | 'theme'>;
export type PreparedReviewCandidate = ReturnType<typeof createCandidate>;
export interface ReviewDraftOpenOptions {
	/** When supplied, an imported proposal must have this currently authoritative base. */
	baseOptions?: ThemeOptions;
	/** Optional validated preview state. Only an identical base and exact edit prefix are reused. */
	previousDraft?: ThemeReviewDraft;
}
export interface ReviewDraftEnvelope {
	schema: 'en-reve/theme-review';
	schemaVersion: 1;
	baseOptions: ThemeOptions;
	edits: readonly ReviewDraftEdit[];
	candidate: PreparedReviewCandidate;
}
export type ReviewDraftEdit =
	| { type: 'token'; id: string; value: unknown }
	| { type: 'restore'; id: string }
	| { type: 'context'; mode?: ThemeMode; density?: ThemeDensity };
export interface ThemeReviewDraft {
	readonly base: ResolvedTheme;
	readonly theme: ResolvedTheme;
	readonly options: Readonly<ThemeOptions>;
	readonly canUndo: boolean;
	readonly canRedo: boolean;
	editor(id: string): EditorDescriptor;
	canRestore(id: string): boolean;
	setToken(id: string, value: unknown): boolean;
	restoreToken(id: string): boolean;
	setContext(context: { mode?: ThemeMode; density?: ThemeDensity }): boolean;
	undo(): boolean;
	redo(): boolean;
	reset(): boolean;
	prepare(metadata: ReviewDraftMetadata): PreparedReviewCandidate;
	exportJSON(metadata: ReviewDraftMetadata): string;
}

const historyLimit = 100;
const editLimit = 1000;
const importByteLimit = 8 * 1024 * 1024;
const optionKeys = ['name', 'mode', 'density', 'source', 'pins'];
interface HistoryEntry { options: ThemeOptions; edits: readonly ReviewDraftEdit[]; }
interface ModelSnapshot {
	base: ResolvedTheme;
	theme: ResolvedTheme;
	history: readonly HistoryEntry[];
	position: number;
	basisCache: ReadonlyMap<string, ResolvedTheme>;
}
const modelStates = new WeakMap<ThemeReviewDraft, { baseOptions: ThemeOptions; snapshot(): ModelSnapshot }>();
const equal = (a: unknown, b: unknown): boolean => stableStringify(a) === stableStringify(b);
function fail(code: string, message: string, id?: string): never { throw new TokenError(code, message, id); }

function record(value: unknown, name: string): Record<string, unknown> {
	if (!isRecord(value)) return fail('review-schema', `${name} must be an object.`);
	return value;
}
function knownKeys(value: Record<string, unknown>, allowed: readonly string[], name: string): void {
	for (const key of Object.keys(value)) if (!allowed.includes(key)) fail('review-schema', `${name}: unknown field ${key}.`);
}
function options(value: unknown): ThemeOptions {
	const input = record(value, 'Theme options');
	knownKeys(input, optionKeys, 'Theme options');
	const result: Record<string, unknown> = {};
	for (const [key, entry] of Object.entries(input)) {
		if (entry === undefined) continue;
		if (['name', 'mode', 'density'].includes(key) && typeof entry !== 'string') fail('review-schema', `${key} must be a string.`);
		if (['source', 'pins'].includes(key)) record(entry, key);
		result[key] = entry;
	}
	try { return JSON.parse(stableStringify(result)) as ThemeOptions; }
	catch { return fail('review-schema', 'Theme options must contain finite JSON data.'); }
}

/** Remove only the authored token override; retain unrelated source and group metadata. */
function withoutSourceToken(source: TokenDocument | undefined, id: string): TokenDocument | undefined {
	if (!source || !Object.hasOwn(flattenTokens(source), id)) return source;
	const next = clone(source);
	const segments = id.split('.');
	const parents: { parent: Record<string, unknown>; key: string }[] = [];
	let parent: Record<string, unknown> = next;
	for (const key of segments.slice(0, -1)) {
		parents.push({ parent, key });
		parent = parent[key] as Record<string, unknown>;
	}
	delete parent[segments.at(-1)!];
	for (const entry of parents.reverse()) {
		if (Object.keys(entry.parent[entry.key] as object).length === 0) delete entry.parent[entry.key];
	}
	return next;
}

function contextBase(baseOptions: ThemeOptions, theme: ResolvedTheme): ResolvedTheme {
	return resolveTheme({ ...baseOptions, mode: theme.mode, density: theme.density });
}
function validateEdit(basis: ResolvedTheme, current: ResolvedTheme, id: string, value: unknown, preserveCurrent: boolean): void {
	// Literal edits do not consume the current graph's alias candidates. Keep
	// unknown-token behavior, then build that descriptor only for an alias edit.
	if (!current.tokens[id]) fail('unknown-token', `Unknown editor token ${id}.`, id);
	const alias = aliasTarget(value);
	if (alias) {
		const descriptor = editorDescriptor(current, id);
		if (!descriptor.aliasTargets.includes(alias)) fail('managed-choice', `${id}: this alias is incompatible or cyclic.`, id);
		return;
	}
	if (preserveCurrent && equal(value, current.tokens[id].value)) return;
	if (equal(value, basis.tokens[id].value)) return;
	validateManagedValue(basis, id, value);
}

/** A per-consumer, DOM-free model. Only successful complete edits enter its bounded history. */
export function createReviewDraft(baseOptions: ThemeOptions = {}): ThemeReviewDraft {
	return model(options(baseOptions));
}

function model(baseOptions: ThemeOptions, initial?: ModelSnapshot): ThemeReviewDraft {
	const base = initial?.base ?? resolveTheme(baseOptions);
	const basisCache = new Map(initial?.basisCache);
	let history = initial ? [...initial.history] : [{ options: deepFreeze(options(baseOptions)), edits: [] as readonly ReviewDraftEdit[] }];
	let position = initial?.position ?? 0;
	let theme = initial?.theme ?? base;
	const current = () => history[position].options;
	const basis = () => {
		const key = `${theme.mode}/${theme.density}`;
		if (!basisCache.has(key)) basisCache.set(key, contextBase(baseOptions, theme));
		return basisCache.get(key)!;
	};
	function commit(next: ThemeOptions, edit?: ReviewDraftEdit): boolean {
		const candidateOptions = options(next);
		if (equal(candidateOptions, current())) return false;
		if (edit && history[position].edits.length >= editLimit) fail('review-capacity', 'A local draft supports at most 1000 successful edits. Reset this draft before starting another sequence.');
		const candidateTheme = resolveTheme(candidateOptions);
		const edits = edit ? [...history[position].edits, deepFreeze(clone(edit))] : [];
		history = [...history.slice(0, position + 1), { options: deepFreeze(candidateOptions), edits }];
		if (history.length > historyLimit) history.shift();
		position = history.length - 1;
		theme = candidateTheme;
		return true;
	}
	const draft: ThemeReviewDraft = {
		get base() { return base; },
		get theme() { return theme; },
		get options() { return current(); },
		get canUndo() { return position > 0; },
		get canRedo() { return position + 1 < history.length; },
		editor(id) {
			const anchored = editorDescriptor(basis(), id);
			const active = editorDescriptor(theme, id);
			return deepFreeze({ ...anchored, aliasTargets: [...active.aliasTargets] });
		},
		canRestore(id) {
			editorDescriptor(theme, id);
			return Object.hasOwn(current().pins ?? {}, id) || Object.hasOwn(flattenTokens(current().source ?? {}), id);
		},
		setToken(id, value) {
			validateEdit(basis(), theme, id, value, true);
			return commit({ ...current(), pins: { ...current().pins, [id]: value } }, { type: 'token', id, value });
		},
		restoreToken(id) {
			editorDescriptor(theme, id);
			if (!draft.canRestore(id)) return false;
			const next = options(current());
			if (next.pins) { const pins = { ...next.pins }; delete pins[id]; next.pins = pins; }
			if (next.source) next.source = withoutSourceToken(next.source, id);
			return commit(next, { type: 'restore', id });
		},
		setContext(context) {
			knownKeys(record(context, 'Theme context'), ['mode', 'density'], 'Theme context');
			const clean = options(context);
			return commit({ ...current(), ...clean }, { type: 'context', ...clean });
		},
		undo() {
			if (!draft.canUndo) return false;
			position -= 1;
			theme = resolveTheme(current());
			return true;
		},
		redo() {
			if (!draft.canRedo) return false;
			position += 1;
			theme = resolveTheme(current());
			return true;
		},
		reset() { return commit(baseOptions); },
		prepare(metadata) { return createCandidate({ ...metadata, base, theme }); },
		exportJSON(metadata) {
			return stableStringify({ schema: 'en-reve/theme-review', schemaVersion: 1, baseOptions, edits: history[position].edits, candidate: draft.prepare(metadata) } satisfies ReviewDraftEnvelope);
		},
	};
	modelStates.set(draft, { baseOptions, snapshot: () => ({ base, theme, history, position, basisCache }) });
	return Object.freeze(draft);
}

function metadata(value: Record<string, unknown>): ReviewDraftMetadata {
	if (typeof value.title !== 'string' || typeof value.rationale !== 'string' || !Array.isArray(value.evidence)) fail('review-schema', 'Candidate title, rationale and evidence have invalid types.');
	const evidence = value.evidence.map((item: unknown) => {
		const entry = record(item, 'Evidence');
		knownKeys(entry, ['kind', 'status', 'artifact'], 'Evidence');
		if (typeof entry.kind !== 'string' || !['passed', 'failed', 'pending'].includes(String(entry.status)) || (entry.artifact !== undefined && typeof entry.artifact !== 'string')) fail('review-schema', 'Evidence must contain a kind, a valid status and an optional artifact string.');
		return clone(entry) as NonNullable<ReviewDraftMetadata['evidence']>[number];
	});
	return { title: value.title, rationale: value.rationale, evidence };
}

/** Validate and recompute before creating a new draft. Imported CSS is never applied or executed. */
export function reopenReviewDraft(json: string, expected: ReviewDraftOpenOptions = {}): ThemeReviewDraft {
	if (typeof json !== 'string') fail('review-json', 'The review file must be JSON text.');
	let bytes = 0;
	for (const character of json) {
		const point = character.codePointAt(0)!;
		bytes += point < 0x80 ? 1 : point < 0x800 ? 2 : point < 0x10000 ? 3 : 4;
		if (bytes > importByteLimit) fail('review-capacity', 'A local review file must not exceed 8 MiB.');
	}
	let parsed: unknown;
	try { parsed = JSON.parse(json); }
	catch { return fail('review-json', 'The review file is not valid JSON.'); }
	const envelope = record(parsed, 'Review file');
	knownKeys(envelope, ['schema', 'schemaVersion', 'baseOptions', 'edits', 'candidate'], 'Review file');
	if (envelope.schema !== 'en-reve/theme-review' || envelope.schemaVersion !== 1) fail('review-schema', 'Unsupported theme review format or version.');
	const baseOptions = options(envelope.baseOptions);
	const base = resolveTheme(baseOptions);
	const candidate = record(envelope.candidate, 'Candidate');
	const candidateKeys = ['schemaVersion', 'id', 'title', 'rationale', 'status', 'baseSourceHash', 'candidateSourceHash', 'compilerVersion', 'theme', 'changedTokens', 'affectedTokens', 'changes', 'artifactHashes', 'diagnostics', 'evidence', 'artifacts'];
	knownKeys(candidate, candidateKeys, 'Candidate');
	for (const key of candidateKeys) if (!Object.hasOwn(candidate, key)) fail('review-schema', `Candidate field ${key} is missing.`);
	if (candidate.schemaVersion !== 1 || candidate.status !== 'prepared') fail('review-schema', 'Expected a version 1 prepared candidate.');
	if (candidate.compilerVersion !== base.compilerVersion) fail('unsupported-compiler', 'This candidate requires a different token compiler.');
	if (typeof candidate.baseSourceHash !== 'string') fail('review-schema', 'Candidate base identity is missing.');
	assertCandidateBase({ baseSourceHash: candidate.baseSourceHash }, base);
	if (expected.baseOptions !== undefined) assertCandidateBase({ baseSourceHash: candidate.baseSourceHash }, resolveTheme(options(expected.baseOptions)));
	const artifacts = record(candidate.artifacts, 'Candidate artifacts');
	record(candidate.artifactHashes, 'Candidate artifact hashes');
	if (!Array.isArray(envelope.edits)) fail('review-schema', 'Review edits must be an array.');
	const edits = envelope.edits;
	if (edits.length > editLimit) fail('review-capacity', 'A local review file supports at most 1000 edits.');
	const previous = expected.previousDraft && modelStates.get(expected.previousDraft);
	const previousState = previous?.snapshot();
	const previousEdits = previousState?.history[previousState.position].edits;
	const reusable = previousState && previousEdits && equal(previous!.baseOptions, baseOptions)
		&& previousState.base.sourceHash === base.sourceHash && previousEdits.length <= edits.length
		&& previousEdits.every((edit, index) => equal(edit, edits[index]));
	const draft = model(baseOptions, reusable ? previousState : undefined);
	for (const value of edits.slice(reusable ? previousEdits.length : 0)) {
		const edit = record(value, 'Review edit');
		if (edit.type === 'token') {
			knownKeys(edit, ['type', 'id', 'value'], 'Token edit');
			if (typeof edit.id !== 'string' || !Object.hasOwn(edit, 'value')) fail('review-schema', 'A token edit requires an ID and value.');
			draft.setToken(edit.id, edit.value);
		} else if (edit.type === 'restore') {
			knownKeys(edit, ['type', 'id'], 'Restore edit');
			if (typeof edit.id !== 'string') fail('review-schema', 'A restore edit requires an ID.');
			draft.restoreToken(edit.id);
		} else if (edit.type === 'context') {
			knownKeys(edit, ['type', 'mode', 'density'], 'Context edit');
			const { type, ...context } = edit;
			draft.setContext(context);
		} else fail('review-schema', 'Unknown review edit type.');
	}
	const rebuilt = draft.prepare(metadata(candidate));
	if (!equal(candidate.artifactHashes, rebuilt.artifactHashes) || !equal(artifacts, rebuilt.artifacts)) fail('artifact-integrity', 'Candidate artifacts do not match the recomputed source and CSS.');
	if (!equal(candidate, rebuilt)) fail('candidate-integrity', 'Candidate identity, changes or diagnostics do not match the recomputed review.');
	return draft;
}
