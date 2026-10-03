import type {candidateImpact} from './impact.js';
import { presetCompanion } from './companion.js';
import { createThemePair, exportThemeReviewPair, hashValue, reopenReviewDraft, reopenThemeReviewPair, stableStringify } from '@en-reve/tokens';
import type { ResolvedTheme, ThemeMode, ThemeReviewDraft, ThemeReviewPairDraft } from '@en-reve/tokens';
import catalogue from '../generated/showcase-catalogue.js';

export interface ReviewBuild {
	schemaVersion: 1;
	fingerprint: string;
	assets: { path: string; sha256: string }[];
	caseIds: string[];
	pages: { id: string; path: string; caseIds: string[] }[];
}
export interface PreviewReceipt {
	sourceHash: string;
	buildFingerprint: string;
	caseIds: string[];
	direction: 'ltr'|'rtl';
	page?: string;
	appearance?: 'auto'|'light'|'dark';
	effectiveMode?: ThemeMode;
}
export type ReviewPairDraft = ThemeReviewPairDraft;
export const reviewPages = [
	{ value: 'sheet', label: 'Full sticker sheet', path: '/' },
	{ value: 'sso', label: 'Sign-in workflow', path: '/workflows' },
	{ value: 'settings', label: 'Creative settings', path: '/workflows/settings' },
	{ value: 'chat', label: 'Contextual chat', path: '/workflows/chat' },
	{ value: 'selection', label: 'Project selection', path: '/workflows/selection' },
	{ value: 'assets', label: 'Asset browser', path: '/workflows/assets' },
  { value: 'multi-step', label: 'Project brief', path: '/workflows/multi-step' },
];
export async function loadReviewBuild(): Promise<ReviewBuild> {
	const response = await fetch('/review-build.json');
	if (!response.ok) throw new Error('The review build is unavailable. Reload this page to try again.');
	const build = await response.json() as ReviewBuild;
	if (build.schemaVersion !== 1 || !/^sha256:[a-f0-9]{64}$/.test(build.fingerprint) || !Array.isArray(build.assets) || !Array.isArray(build.caseIds) || !Array.isArray(build.pages)) throw new Error('The review build manifest is invalid.');
	if (document.querySelector<HTMLMetaElement>('meta[name="en-review-build"]')?.content !== build.fingerprint) throw new Error('This page belongs to a different build. Reload before continuing review.');
	return build;
}
function resolvedTokens(theme: ResolvedTheme) {
	return Object.fromEntries(Object.values(theme.tokens).map(token => [token.id, {type:token.type,value:token.value,provenance:token.provenance,cssName:token.cssName}]));
}
export function exportReviewBundle(draft: ThemeReviewDraft, build: ReviewBuild, metadata: {title:string;rationale:string}, receipts: Record<string,PreviewReceipt>, options: {pair?:ReviewPairDraft;impact?:ReturnType<typeof candidateImpact>} = {}) {
	if (options.pair) {
		const pair = options.pair;
		if (draft !== pair.light && draft !== pair.dark) throw new Error('The active draft must belong to this appearance pair.');
		const theme = createThemePair({name:pair.name,light:pair.light.theme,dark:pair.dark.theme});
		const payload = {
			schema: 'en-reve/local-theme-review', schemaVersion: 2,
			build, impact:options.impact ?? {status:'unavailable',reason:'No verified source-impact graph was available at export.'}, activeAppearance: draft.theme.mode,
            ...(presetCompanion(theme) ? {companion:presetCompanion(theme)} : {}),
			draft: JSON.parse(exportThemeReviewPair(pair,metadata)) as unknown,
			resolvedTokens: {light:resolvedTokens(pair.light.theme),dark:resolvedTokens(pair.dark.theme)},
			coverage: {
				required: build.pages.flatMap(page => (['light','dark'] as const).map(appearance => ({page:page.id,appearance,caseIds:page.caseIds}))),
				rendered: Object.values(receipts).filter(receipt => receipt.sourceHash === theme.sourceHash && receipt.buildFingerprint === build.fingerprint
					&& build.pages.some(page => page.id === receipt.page) && ['light','dark'].includes(receipt.effectiveMode ?? '')),
				browserInteraction: 'not-run', visualComparison: 'not-run', manualAccessibility: 'not-run',
			},
			reopen: {path:'/theme-review',instruction:'Reopen this paired JSON file in the same documentation build. Light and dark have separate authored values; compiled CSS follows the selected appearance boundary. The documentation application is not embedded.'},
			status: 'prepared',
		};
		return JSON.stringify({...payload,integrity:hashValue(payload)},null,'\t')+'\n';
	}
	const theme = draft.theme;
	const payload = {
		schema: 'en-reve/local-theme-review', schemaVersion: 1,
		build,
    impact:options.impact ?? {status:'unavailable',reason:'No verified source-impact graph was available at export.'},
		draft: JSON.parse(draft.exportJSON(metadata)) as unknown,
		resolvedTokens: resolvedTokens(theme),
		coverage: {
			required: build.pages.map(page => ({page:page.id,caseIds:page.caseIds})),
			rendered: Object.entries(receipts).filter(([,receipt]) => receipt.sourceHash === theme.sourceHash && receipt.buildFingerprint === build.fingerprint).map(([page,receipt]) => ({page,...receipt})),
			browserInteraction: 'not-run', visualComparison: 'not-run', manualAccessibility: 'not-run',
		},
		reopen: {path:'/theme-review',instruction:'Reopen this JSON file in the same documentation build. It contains the source, compiled CSS, typed tokens and review manifest; it does not embed the documentation application.'},
		status: 'prepared',
	};
	return JSON.stringify({ ...payload, integrity: hashValue(payload) }, null, '\t') + '\n';
}
export function reopenReviewBundle(text: string, build: ReviewBuild): {draft:ThemeReviewDraft;pair?:ReviewPairDraft;title:string;rationale:string} {
	if (text.length > 8_000_000) throw new Error('This file is too large. Choose an en-reve theme review JSON file under 8 MB.');
	let value: Record<string,unknown>;
	try { value = JSON.parse(text) as Record<string,unknown>; } catch { throw new Error('This file is not valid JSON. Choose an exported theme review file.'); }
	if (!value || typeof value !== 'object' || Array.isArray(value) || value.schema !== 'en-reve/local-theme-review' || (value.schemaVersion !== 1 && value.schemaVersion !== 2)) throw new Error('This is not a supported en-reve theme review file.');
	const {integrity,...payload} = value;
	if (hashValue(payload) !== integrity) throw new Error('The review file has changed or is incomplete. Reopen the original export.');
	const importedBuild = value.build as ReviewBuild | undefined;
	if (importedBuild?.fingerprint !== build.fingerprint || stableStringify(importedBuild) !== stableStringify(build)) throw new Error('This candidate belongs to a different documentation build. Open it with its recorded build; automatic rebasing is not applied.');
	if (value.schemaVersion === 2) {
		if (value.activeAppearance !== 'light' && value.activeAppearance !== 'dark') throw new Error('A paired candidate needs a valid editing appearance.');
		// Authoritative baselines come from this build's repository catalogue. An
		// imported envelope may never nominate its own trusted fonts or shadows.
		const name = (value.draft as {name?:unknown} | undefined)?.name;
		const baseline = catalogue.find(preset => preset.id === name)?.baseOptions;
		const opened = reopenThemeReviewPair(JSON.stringify(value.draft),{baseOptions:baseline ?? {light:{},dark:{}}});
		const pair = {name:opened.name,light:opened.light,dark:opened.dark};
        const companion = presetCompanion(createThemePair({name:pair.name,light:pair.light.theme,dark:pair.dark.theme}));
        if (stableStringify(value.companion ?? null) !== stableStringify(companion ?? null)) throw new Error("The companion recipe does not match this build and theme. Reopen the original export.");
		return {draft:pair[value.activeAppearance],pair,title:opened.title,rationale:opened.rationale};
	}
	const draft = reopenReviewDraft(JSON.stringify(value.draft),{baseOptions:{}});
	const source = value.draft as {candidate:{title:string;rationale:string}};
	return { draft, title: source.candidate.title, rationale: source.candidate.rationale };
}
