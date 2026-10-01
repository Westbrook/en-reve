import {
	createReviewDraft, createThemePair, exportThemeReviewPair, reopenReviewDraft,
	type ResolvedTheme, type ResolvedThemePair, type ReviewDraftMetadata,
	type ThemeDensity, type ThemeMode, type ThemeReviewDraft,
} from '@en-reve/tokens';

export interface ReviewPairDraft {
	name: string;
	light: ThemeReviewDraft;
	dark: ThemeReviewDraft;
}
export type PreviewPreference = 'editing' | 'auto' | ThemeMode;
export type PreviewAppearance = 'auto' | ThemeMode;
interface PairSnapshot { light: ThemeReviewDraft; dark: ThemeReviewDraft; }

export interface ReviewWorkspace {
	readonly draft: ThemeReviewDraft;
	readonly pair: ReviewPairDraft | undefined;
	readonly presentation: ResolvedTheme | ResolvedThemePair;
	readonly identity: string;
	readonly editingAppearance: ThemeMode;
	readonly previewPreference: PreviewPreference;
	readonly previewAppearance: PreviewAppearance;
	readonly canUndo: boolean;
	readonly canRedo: boolean;
	edit(action: (draft: ThemeReviewDraft) => boolean): boolean;
	setAppearance(mode: ThemeMode): boolean;
	setPreviewPreference(preference: PreviewPreference): boolean;
	setDensity(density: ThemeDensity): boolean;
	undo(): boolean;
	redo(): boolean;
	reset(): boolean;
	exportJSON(metadata: ReviewDraftMetadata): string;
}

// Fork an already validated model without replaying its edit prefix. The source
// model is retained for Undo; no live branch is mutated before both are valid.
function fork(draft: ThemeReviewDraft): ThemeReviewDraft {
	return reopenReviewDraft(draft.exportJSON({title: 'Editor snapshot'}), {previousDraft: draft});
}

/** Docs composition only. Single candidates retain their existing model/history. */
export function createReviewWorkspace(single: ThemeReviewDraft = createReviewDraft(), initialPair?: ReviewPairDraft): ReviewWorkspace {
	let editing: ThemeMode = single.theme.mode;
	let preview: PreviewPreference = initialPair ? 'auto' : 'editing';
	let history: {branches: PairSnapshot; editing: ThemeMode}[] = initialPair ? [{branches: {light: initialPair.light, dark: initialPair.dark}, editing}] : [];
	const resetDensity = initialPair?.light.theme.density;
	let position = 0;
	let cached: {light: ResolvedTheme; dark: ResolvedTheme; pair: ResolvedThemePair} | undefined;
	const current = () => history[position].branches;
	const active = () => initialPair ? current()[editing] : single;
	const presentation = (): ResolvedTheme | ResolvedThemePair => {
		if (!initialPair) return single.theme;
		const {light, dark} = current();
		if (cached?.light !== light.theme || cached.dark !== dark.theme) {
			cached = {light: light.theme, dark: dark.theme, pair: createThemePair({name: initialPair.name, light: light.theme, dark: dark.theme})};
		}
		return cached.pair;
	};
	function commit(next: PairSnapshot): boolean {
		if (!initialPair) return false;
		// Includes final modes and same-density validation. Publish neither branch
		// if resolving/preparing the other one fails.
		const pair = createThemePair({name: initialPair.name, light: next.light.theme, dark: next.dark.theme});
		if (next.light.theme.sourceHash === current().light.theme.sourceHash && next.dark.theme.sourceHash === current().dark.theme.sourceHash) return false;
		history = [...history.slice(0, position + 1), {branches: next, editing}];
		if (history.length > 100) history.shift();
		position = history.length - 1;
		cached = {light: next.light.theme, dark: next.dark.theme, pair};
		return true;
	}
	if (initialPair) presentation();
	const workspace: ReviewWorkspace = {
		get draft() { return active(); },
		get pair() { return initialPair ? {name: initialPair.name, ...current()} : undefined; },
		get presentation() { return presentation(); },
		get identity() { return presentation().sourceHash; },
		get editingAppearance() { return initialPair ? editing : single.theme.mode; },
		get previewPreference() { return preview; },
		get previewAppearance() { return initialPair && preview !== 'editing' ? preview : active().theme.mode; },
		get canUndo() { return initialPair ? position > 0 : single.canUndo; },
		get canRedo() { return initialPair ? position + 1 < history.length : single.canRedo; },
		edit(action) {
			if (!initialPair) return action(single);
			const next = fork(active());
			if (!action(next)) return false;
			return commit({...current(), [editing]: next});
		},
		setAppearance(mode) {
			if (mode !== 'light' && mode !== 'dark') throw new Error('Choose Light or Dark.');
			if (!initialPair) return single.setContext({mode});
			if (editing === mode) return false;
			editing = mode;
			return true;
		},
		setPreviewPreference(preference) {
			if (!['editing', 'auto', 'light', 'dark'].includes(preference)) throw new Error('Choose a supported preview appearance.');
			if (!initialPair || preference === preview) return false;
			preview = preference;
			return true;
		},
		setDensity(density) {
			if (!initialPair) return single.setContext({density});
			if (active().theme.density === density) return false;
			const next = {light: fork(current().light), dark: fork(current().dark)};
			next.light.setContext({density}); next.dark.setContext({density});
			return commit(next);
		},
		undo() {
			if (!initialPair) return single.undo();
			if (position === 0) return false;
			editing = history[position].editing; position--; return true;
		},
		redo() {
			if (!initialPair) return single.redo();
			if (position + 1 === history.length) return false;
			position++; editing = history[position].editing; return true;
		},
		reset() {
			if (!initialPair) return single.reset();
			const next = {light: fork(current().light), dark: fork(current().dark)};
			next.light.reset(); next.dark.reset();
			// An imported v1 branch may start at a light base and author its dark
			// context in the log. Reset rules while retaining both appearance roles
			// and the initially opened shared density; historical base densities may differ.
			next.light.setContext({mode: 'light', density: resetDensity!});
			next.dark.setContext({mode: 'dark', density: resetDensity!});
			return commit(next);
		},
		exportJSON(metadata) {
			return initialPair ? exportThemeReviewPair({name: initialPair.name, ...current()}, metadata) : single.exportJSON(metadata);
		},
	};
	return Object.freeze(workspace);
}
