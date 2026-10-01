import { presetCompanion } from '../theme-review/companion.js';
import { LitElement, html, nothing } from 'lit';
import { hydrate } from '@lit-labs/ssr-client';
import { Signal } from 'signal-polyfill';
import { SignalController } from '@en-reve/primitives/interactions/signal-controller.js';
import { skipLinkTemplate } from '@en-reve/primitives/templates/navigation.js';
import { emitThemeCSS, emitThemePairCSS, createReviewDraft } from '@en-reve/tokens';
import { acceptValueChange, afterAcceptedChange } from '../change-consumption.js';
import { appearanceItems, isAppearance, type Appearance } from '../appearance.js';
import { previewPairCSS, resolvePreviewPair } from '../preview-theme.js';
import { attachDocumentTheme, type DocumentTheme } from '../theme-review/document-theme.js';
import { createCandidateFileIntake } from '../theme-review/candidate-file-intake.js';
import { exportReviewBundle, loadReviewBuild, reopenReviewBundle, type ReviewBuild } from '../theme-review/bundle.js';
import { createReviewWorkspace, type ReviewWorkspace } from '../theme-review/workspace.js';
import { createShowcaseState, people, type CardId, type ShowcaseState } from './model.js';
import { presetItems, loadPreset } from './presets.js';
import { showcaseGrid, scopeTemplate } from './template.js';

type Field = HTMLElement & { value: string; checked: boolean; reportValidity(): boolean; focus(): void };
type Overlay = HTMLElement & { open: boolean; updateComplete: Promise<unknown> };

/** The page owns fixture state; components retain their public interaction contracts. */
export class ShowcaseApp extends LitElement {
	private state = new Signal.State(createShowcaseState());
	private revision = new Signal.State(0);
	private observer = new SignalController(this, () => [this.state.get(), this.revision.get()] as const);
	private baseline = resolvePreviewPair({ name: 'showcase', density: 'comfortable' });
	private documentTheme?: DocumentTheme;
	private build?: ReviewBuild;
	private workspace?: ReviewWorkspace;
	private selectedTheme = 'default';
	private themeTitle = 'en-reve';
	private rationale = '';
	private appearance: Appearance = 'auto';
	private direction: 'ltr' | 'rtl' = 'ltr';
	private flagged = false;
	private dragging = false;
	private themeStatus = 'Drop a theme JSON anywhere on this page, or choose a file.';
	private themeError = '';
	private generation = 0;
	private lifecycle?: AbortController;
	readonly resets = new Map<CardId, number>();
	private intake = createCandidateFileIntake({
		context: () => this.build,
		isCurrent: build => this.isConnected && this.build === build,
		parse: (contents, build) => reopenReviewBundle(contents, build),
		accept: opened => {
			this.generation++;
			this.workspace = createReviewWorkspace(opened.draft, opened.pair);
			this.selectedTheme = 'imported'; this.themeTitle = opened.title; this.rationale = opened.rationale;
			this.themeError = ''; this.themeStatus = `Applied ${opened.title}. Demo edits are preserved.`;
			this.paint(); this.touch();
		},
		reject: error => { this.themeError = error instanceof Error ? error.message : 'This theme could not be opened.'; this.touch(); },
		dragging: active => { this.dragging = active; this.touch(); },
	});

	get previewCSS() { return previewPairCSS(this.baseline); }
	get data() { return this.state.get(); }
	private touch() { this.revision.set(this.revision.get() + 1); }
	patch(patch: Partial<ShowcaseState>) { this.state.set({ ...this.data, ...patch }); }
	href(path: string) { return path + (this.flagged ? '?progress-report' : ''); }
	protected createRenderRoot() {
		if (this.hasAttribute('data-ssr')) { hydrate(this.render(), this, { host: this }); this.removeAttribute('data-ssr'); }
		return this;
	}
	connectedCallback() { super.connectedCallback(); if (this.hasUpdated) this.connect(); }
	protected firstUpdated() { this.connect(); }
	protected updated() { this.documentTheme?.refresh(); }
	disconnectedCallback() {
		this.generation++; this.lifecycle?.abort(); this.intake.invalidate(); this.intake.clearDrag();
		this.documentTheme?.disconnect(); this.documentTheme = undefined; super.disconnectedCallback();
	}
	private connect() {
		this.documentTheme ??= attachDocumentTheme({ root: this });
		this.lifecycle?.abort(); const lifecycle = this.lifecycle = new AbortController();
		this.flagged = new URLSearchParams(location.search).has('progress-report');
		const parameters = new URLSearchParams(location.search);
		const appearance = parameters.get('appearance');
		if (appearance && isAppearance(appearance)) this.appearance = appearance;
		const theme = parameters.get('theme');
		if (theme && presetItems.some(item => item.value === theme)) void this.chooseTheme(theme);
		this.paint(); this.touch();
		void loadReviewBuild().then(build => {
			if (!this.isConnected || lifecycle.signal.aborted) return;
			this.build = build; this.touch();
		}).catch(() => {
			if (lifecycle.signal.aborted) return;
			this.themeError = 'Theme file import is unavailable. Reload the built page to try again.'; this.touch();
		});
	}
	private paint() { this.documentTheme?.apply(this.workspace?.presentation ?? this.baseline, { appearance: this.appearance, direction: this.direction }); }
	private async chooseTheme(id: string) {
		this.intake.invalidate(); const generation = ++this.generation;
		if (id === 'default') {
			this.workspace = undefined; this.selectedTheme = id; this.themeTitle = 'en-reve'; this.rationale = '';
			this.themeError = ''; this.themeStatus = 'Default theme restored. Demo edits are preserved.'; this.paint(); this.touch(); return;
		}
		try {
			const preset = await loadPreset(id);
			if (generation !== this.generation || !this.isConnected) return;
			this.workspace = preset.workspace; this.selectedTheme = id; this.themeTitle = preset.title; this.rationale = preset.rationale;
			this.themeError = ''; this.themeStatus = `Applied ${preset.title}. Demo edits are preserved.`; this.paint(); this.touch();
		} catch (error) {
			if (generation !== this.generation) return;
			this.themeError = error instanceof Error ? error.message : 'Theme unavailable.'; this.touch();
		}
	}
	private chooseThemeFile() {
		if (!this.build) return;
		this.querySelector<HTMLInputElement>('#showcase-theme-file')?.click();
	}
	private downloadCSS() {
        if (!this.workspace) return;
        const theme = this.workspace.presentation;
        const css = ('light' in theme ? emitThemePairCSS(theme) : emitThemeCSS(theme)) + (presetCompanion(theme)?.css ?? '');
        const url = URL.createObjectURL(new Blob([css], {type:'text/css'}));
        const link = this.ownerDocument.createElement('a'); link.href = url; link.download = `${theme.name}.css`;
        this.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 10_000);
        this.themeStatus = `CSS prepared. Apply data-en-theme="${theme.name}" and data-en-appearance="auto", "light" or "dark" to its boundary. Fonts are separate assets.`; this.touch();
    }
    private downloadTheme() {
		if (!this.build) return;
		try {
			const workspace = this.workspace ?? createReviewWorkspace(undefined, { name: 'en-reve', light: createReviewDraft({ mode: 'light' }), dark: createReviewDraft({ mode: 'dark' }) });
			const json = exportReviewBundle(workspace.draft, this.build, { title: this.themeTitle, rationale: this.rationale || 'Default en-reve theme, exported from the showcase.' }, {}, { pair: workspace.pair });
			const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
			const link = this.ownerDocument.createElement('a'); link.href = url;
			link.download = `${this.selectedTheme === 'imported' ? 'showcase-theme' : this.selectedTheme}.json`;
			this.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 10_000);
			this.themeStatus = 'Theme JSON prepared. Drop it here or reopen it in Theme Review.'; this.touch();
		} catch (error) { this.themeError = error instanceof Error ? error.message : 'Download failed.'; this.touch(); }
	}
	field(id: string) { return this.querySelector<Field>(`#${id}`)!; }
	value(id: string) { return this.field(id).value; }
	valid(...ids: string[]) { for (const id of ids) if (!this.field(id).reportValidity()) { this.field(id).focus(); return false; } return true; }
	change<T>(event: Event, read: (host: Field) => T, apply: (value: T) => void) { afterAcceptedChange<Field, T>(event, read, apply); }
	setLayout(layout: string) { if (['portrait', 'landscape', 'reset-canvas'].includes(layout)) this.patch({ canvas: layout === 'reset-canvas' ? 'portrait' : layout }); }
	command(event: Event) {
		const surface = event.currentTarget as Overlay;
		const action = (event as CustomEvent<{ action: string }>).detail?.action;
		queueMicrotask(async () => { await surface.updateComplete; if (!event.defaultPrevented && surface.isConnected && !surface.open) this.setLayout(action); });
	}
	open(id: string) { (this.querySelector(`#${id}`) as Overlay).open = true; }
	close(id: string) { (this.querySelector(`#${id}`) as Overlay).open = false; }
	async approve() {
		this.patch({ approved: true }); this.close('showcase-approve-dialog');
		await this.updateComplete;
		await (this.querySelector('#showcase-approve-dialog') as Overlay).updateComplete;
		const heading = this.querySelector<HTMLElement>('#showcase-heading-readiness')!;
		heading.tabIndex = -1; heading.focus({ preventScroll: true });
	}
	createProject() {
		if (!this.valid('project-title', 'project-date')) { this.patch({ projectStatus: 'Add a project name and a valid review date.' }); return; }
		this.patch({ project: this.value('project-title'), projectStatus: `${this.value('project-title')} created locally. Review: ${this.value('project-date')}.` });
	}
	invite() {
		const person = people.find(person => person.value === this.value('team-person'));
		if (!person) { this.patch({ invitationStatus: 'Choose a teammate from the list.' }); this.field('team-person').focus(); return; }
		if (this.data.members.includes(person.label)) { this.patch({ invitationStatus: `${person.label} is already on the team.` }); return; }
		this.patch({ members: [...this.data.members, person.label], invitationStatus: `${person.label} added to this demo team as ${this.value('team-role')}.` });
	}
	sendMessage() {
		const text = this.value('chat-message').trim();
		if (!text) { this.patch({ chatStatus: 'Write a message first.' }); this.field('chat-message').focus(); return; }
		const id = this.data.messages.length;
		this.patch({ messages: [...this.data.messages, { id, who: 'You', text }, { id: id + 1, who: 'Demo assistant', text: 'Try a portrait composition, compare two accent colors, and ask your team for a first impression.' }], chatStatus: 'Message added. A sample response is shown below.' });
		this.field('chat-message').value = ''; this.field('chat-message').focus();
	}
	saveAccess() {
		if (this.valid('access-email', 'access-password')) this.patch({ accessStatus: `Local form validated for ${this.value('access-email')}. No account was created.` });
		else this.patch({ accessStatus: 'Check the highlighted fields.' });
	}
	async copyLink() {
		try { await navigator.clipboard.writeText(new URL(this.href('/showcase'), location.origin).href); this.patch({ shareStatus: 'Showcase link copied.' }); }
		catch { this.patch({ shareStatus: 'Copy unavailable. Use the link above to copy the address.' }); }
	}
	reset(id: CardId) {
		const initial = createShowcaseState();
		const keys: Partial<Record<CardId, (keyof ShowcaseState)[]>> = {
			actions: ['canvas'], activity: ['activityRange'], readiness: ['ready', 'approved'],
			project: ['project', 'projectStatus'], output: ['opacity', 'scale'], brand: ['accent'],
			team: ['members', 'invitationStatus'], chat: ['messages', 'chatStatus'], feedback: ['feedback'],
			access: ['accessStatus'], notifications: ['notificationStatus'], share: ['shareStatus'], library: ['inserted'],
		};
		this.patch(Object.fromEntries((keys[id] ?? []).map(key => [key, initial[key]])));
		this.resets.set(id, (this.resets.get(id) ?? 0) + 1); this.touch();
	}
	render() {
		const singleMode = this.workspace && !this.workspace.pair;
		return html`
			<div class="showcase-page" ?data-drag-active=${this.dragging}
				@dragenter=${this.intake.dragenter} @dragover=${this.intake.dragover} @dragleave=${this.intake.dragleave} @drop=${this.intake.drop} @dragend=${this.intake.dragend}>
				${skipLinkTemplate({ href: '#showcase', label: 'Skip to showcase' })}
				<header class="site-header">
					<a class="wordmark" href=${this.href('/')} aria-label="en-reve sticker sheet"><span class="mark" aria-hidden="true">en</span><span>en-reve</span></a>
					<div class="header-context"><span>Design system</span><en-badge class="version">0.1.0 · design review</en-badge></div>
					<nav class="header-context" aria-label="Documentation pages">
						<a href=${this.href('/')}>Sticker sheet</a><a href=${this.href('/showcase')} aria-current="page">Showcase</a>
						<a href=${this.href('/conversation.html')}>Conversation</a>
						<a href=${this.href('/workflows')}>Workflows</a><a href=${this.href('/theme-review')}>Theme Review</a><a href=${this.href('/api-reference')}>API reference</a>
					</nav>
				</header>
				<main id="showcase" tabindex="-1">
					<div class="showcase-heading"><div><h1>Made of en-reve.</h1><p>Creative work, in sixteen small spaces. Local demos; nothing is sent or saved after reload.</p></div><a href="#scope-gaps">What’s missing?</a></div>
					<section class="showcase-theme" aria-label="Showcase theme">
						<en-select id="showcase-theme" label="Theme" .value=${this.selectedTheme} .items=${this.selectedTheme === 'imported' ? [...presetItems, { value: 'imported', label: this.themeTitle }] : presetItems}
							@en-change=${(event: Event) => acceptValueChange<string>(event, value => { void this.chooseTheme(value); return this.selectedTheme; })}></en-select>
						<en-segmented-control label="Appearance" .value=${singleMode ? this.workspace!.draft.theme.mode : this.appearance} .items=${appearanceItems} ?disabled=${singleMode}
							@en-change=${(event: Event) => acceptValueChange<string>(event, value => { if (isAppearance(value)) { this.appearance = value; this.paint(); this.touch(); } return this.appearance; })}></en-segmented-control>
						<en-select label="Reading direction" .value=${this.direction} .items=${[{ value: 'ltr', label: 'Left to right' }, { value: 'rtl', label: 'Right to left' }]}
							@en-change=${(event: Event) => acceptValueChange<string>(event, value => { if (value === 'ltr' || value === 'rtl') this.direction = value; this.paint(); this.touch(); return this.direction; })}></en-select>
						<div class="showcase-theme-actions">
							<en-button class="showcase-file" variant="secondary" ?disabled=${!this.build} @click=${() => this.chooseThemeFile()}>Choose theme JSON</en-button>
							<input id="showcase-theme-file" type="file" accept=".json,application/json" aria-label="Choose theme JSON" hidden ?disabled=${!this.build} @change=${this.intake.change}>
							<en-button variant="secondary" ?disabled=${!this.build} @click=${() => this.downloadTheme()}>Download JSON</en-button>
							<en-button variant="secondary" ?disabled=${!this.build || !this.workspace} @click=${() => this.downloadCSS()}>Download CSS</en-button>
                            <en-button variant="ghost" @click=${() => { void this.chooseTheme('default'); }}>Reset theme</en-button>
						</div>
						<p class="showcase-theme-status" role="status" aria-atomic="true">${this.themeStatus}${singleMode ? ' This file contains one fixed appearance.' : ''}</p>
						${this.themeError ? html`<en-alert variant="danger" class="showcase-theme-error">${this.themeError}</en-alert>` : nothing}
						<p><a href=${this.href('/component-patterns.html')}>Explore the new component patterns.</a></p><details class="showcase-theme-help"><summary>About theme files</summary><p>Choose one of six inspired themes or three original directions and download its current JSON. Files belong to this documentation checkpoint; earlier files retain their original review context. Use Theme Review to edit a candidate. Theme changes keep the examples’ values, selection, and open panels. JSON includes the trusted variant companion for this build; CSS combines both appearances and those variant rules.</p><p><a href=${this.href('/reviews/theme-customization/theme-refresh-report.md')}>Read the theme research and API recommendations.</a></p></details>
					</section>
					${showcaseGrid(this)}
					${scopeTemplate()}
				</main>
				${this.dragging ? html`<div class="showcase-drop-hint" aria-hidden="true">Drop to apply theme</div>` : nothing}
				${this.flagged ? html`<a class="progress-return" href="http://127.0.0.1:4177">Progress Report</a>` : nothing}
			</div>
		`;
	}
}
