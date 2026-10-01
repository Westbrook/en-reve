import { LitElement, html, nothing } from 'lit';
import { html as staticHtml, unsafeStatic } from 'lit/static-html.js';
import { keyed } from 'lit/directives/keyed.js';
import { hydrate } from '@lit-labs/ssr-client';
import { specimens } from '../examples.js';
import { appearanceItems, isAppearance } from '../appearance.js';
import { afterAcceptedChange } from '../change-consumption.js';
import controlDefinitions from '../generated/api-element-controls.js';
import presetItems from '../generated/showcase-items.js';
import { acceptsControlValue, readControls, type APIElementControls, type APIControlsSnapshot } from './controls.js';
import type { ReviewWorkspace } from '../theme-review/workspace.js';
import type { DocumentTheme } from '../theme-review/document-theme.js';
import { API_EXAMPLE_VERSION, isConfiguration, isRecord, type ExampleMode, type ExampleDensity } from './protocol.js';

const reviewDensityItems = [
	{ value: 'compact', label: 'Compact' }, { value: 'comfortable', label: 'Comfortable' }, { value: 'spacious', label: 'Spacious' },
];
type ReviewSelect = HTMLElement & { value: string };

/** Case identity is chosen before construction, identically on server and client. */
export function createAPIExampleApp(caseId: string, exampleSource = '') {
	const specimen = specimens.find(item => item.id === caseId);
	if (!specimen) throw new Error(`Unknown authored specimen: ${caseId}`);
	// Recipe demos have no CEM property target, so own their preview controls even
	// when embedded. Other direct review pages defer to the parent iframe controls.
	const hasStandaloneTools = ['tooltip-warmup', 'data-table', 'split-view', 'navigation-sidebar', 'rich-text', 'carousel', 'presence-activity', 'color-slider', 'color-picker', 'composable-chat', 'chat-patterns', 'toast', 'multi-step', 'file-upload', 'calendar', 'tree-view', 'tree-data', 'mixed-toolbar', 'menu-choices', 'focus-motion', 'popup-motion', 'child-authored-choices', 'content-recipes', 'authored-table', 'virtual-collection', 'pagination'].includes(caseId);
	// Static, escaped source keeps Lit hydration markers out of highlighted code.
	const escapedSource = exampleSource.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
	const code = staticHtml`<code class="language-lit-typescript" data-language="lit-typescript">${unsafeStatic(escapedSource)}</code>`;
	return class APIExampleApp extends LitElement {
		private selectedTheme = 'default';
		private themeWorkspace?: ReviewWorkspace;
		private documentTheme?: DocumentTheme;
		private themeRequest = 0;
		private themeFeedback = '';
		private async paintTheme() {
			if (!this.themeWorkspace || !this.isConnected) return;
			const workspace = this.themeWorkspace, request = this.themeRequest, document = this.ownerDocument;
			const { attachDocumentTheme } = await import('../theme-review/document-theme.js');
			if (request !== this.themeRequest || this.themeWorkspace !== workspace || !this.isConnected || this.ownerDocument !== document) return;
			this.documentTheme ??= attachDocumentTheme({ root: this, selector: 'html[data-example-density]', styleAttribute: 'data-example-theme', manageAppearance: false });
			return this.documentTheme.apply(workspace.presentation);
		}
		private themeChanged(event: Event) {
			afterAcceptedChange<ReviewSelect, string>(event, field => field.value, value => {
				void this.applyTheme(value);
			});
		}
		private async applyTheme(value: string) {
			const request = ++this.themeRequest;
			if (value === 'default') {
				this.themeWorkspace = undefined; this.documentTheme?.reset(); this.selectedTheme = value;
				this.themeFeedback = 'Default theme restored. Demo state is preserved.'; this.requestUpdate(); return;
			}
			try {
				const { loadPreset } = await import('../showcase/presets.js');
				const preset = await loadPreset(value);
				if (request !== this.themeRequest || !this.isConnected) return;
				this.themeWorkspace = preset.workspace; this.themeWorkspace.setDensity(this.reviewDensity);
				this.selectedTheme = value;
				if (!await this.paintTheme() || request !== this.themeRequest || !this.isConnected) return;
				this.themeFeedback = `${preset.title} applied. Demo state is preserved.`;
			} catch { if (request === this.themeRequest) this.themeFeedback = 'Theme could not load. Try again.'; }
			this.requestUpdate();
		}
		private copyFeedback = '';
		private async highlightCode(event: Event) {
			const disclosure = event.currentTarget as HTMLDetailsElement;
			if (!disclosure.open || !('CSS' in globalThis) || !('highlights' in CSS)) return;
			try {
				const { highlightAll } = await import('microlighter');
				if (!disclosure.open || !this.isConnected) return;
				await highlightAll({ root: this, selector: '.code-disclosure[open] pre > code', languageAliases: { 'lit-typescript': 'typescript' } });
				disclosure.dataset.highlighted = 'true';
			} catch { /* Plain source remains readable when highlighting is unavailable. */ }
		}
		private async copyCode() {
			try {
				await this.ownerDocument.defaultView!.navigator.clipboard.writeText(exampleSource);
				this.copyFeedback = 'Example code copied.';
			} catch { this.copyFeedback = 'Copy unavailable. Select and copy the code below.'; }
			this.requestUpdate();
		}
		private resetRevision = 0;
		private latestRequest = 0;
		private lifecycle?: AbortController;
		private documentId = '';
		private activated = false;
		private standalone = false;
		private reviewMode: ExampleMode = 'auto';
		private reviewDensity: ExampleDensity = 'comfortable';
		private componentTag = '';
		private appliedControlRevision = 0;
		private controlFeedback = '';
		private configurationQueue: Promise<void> = Promise.resolve();
		private controlTarget?: { definition: APIElementControls; node: HTMLElement };
		protected createRenderRoot() {
			if (this.hasAttribute('data-ssr')) {
				hydrate(this.render(), this, { host: this }); this.removeAttribute('data-ssr');
			}
			return this;
		}
		connectedCallback() { super.connectedCallback(); if (this.hasUpdated) void this.paintTheme(); if (this.hasUpdated && this.activated) this.connect(); }
		disconnectedCallback() { ++this.themeRequest; this.documentTheme?.disconnect(); this.documentTheme = undefined; this.lifecycle?.abort(); this.latestRequest++; super.disconnectedCallback(); }
		protected firstUpdated() { if (this.activated) this.connect(); }
		/** Start the bridge only after outer hydration and selective child upgrades finish. */
		activate() {
			this.activated = true;
			const view = this.ownerDocument.defaultView;
			this.standalone = hasStandaloneTools && Boolean(view && (view.parent === view || caseId === 'content-recipes'));
			this.ownerDocument.documentElement.toggleAttribute('data-example-standalone', this.standalone);
			this.ownerDocument.documentElement.toggleAttribute('data-example-progress-report', this.standalone && new URLSearchParams(view?.location.search).has('progress-report'));
			if (this.isConnected && this.hasUpdated) this.connect();
		}
		private reviewAppearanceChanged(event: Event) {
			afterAcceptedChange<ReviewSelect, string>(event, field => field.value, value => {
				if (!this.standalone || !this.isConnected || !isAppearance(value)) return;
				this.reviewMode = value;
				const root = this.ownerDocument.documentElement;
				root.dataset.exampleMode = value; root.dataset.enAppearance = value;
			});
		}
		private reviewDensityChanged(event: Event) {
			afterAcceptedChange<ReviewSelect, string>(event, field => field.value, value => {
				if (!this.standalone || !this.isConnected || (value !== 'compact' && value !== 'comfortable' && value !== 'spacious')) return;
				this.reviewDensity = value;
				this.ownerDocument.documentElement.dataset.exampleDensity = value;
				this.themeWorkspace?.setDensity(value); void this.paintTheme();
			});
		}
		private resetReview(event: Event) {
			queueMicrotask(() => {
				if (!this.standalone || !this.isConnected || event.defaultPrevented) return;
				this.resetRevision++; this.controlTarget = undefined; this.appliedControlRevision = 0; this.controlFeedback = '';
				this.requestUpdate();
			});
		}
		private connect() {
			this.lifecycle?.abort(); this.lifecycle = new AbortController();
			const doc = this.ownerDocument; const view = doc.defaultView;
			if (!view) return;
			this.documentId = doc.documentElement.dataset.enApiExampleDocument ?? view.crypto.randomUUID();
			doc.documentElement.dataset.enApiExampleDocument = this.documentId;
			view.addEventListener('message', event => {
				if (event.source !== view.parent || event.origin !== view.location.origin || !isRecord(event.data)) return;
				if (event.data.version !== API_EXAMPLE_VERSION || event.data.caseId !== caseId) return;
				if (event.data.type === 'en-api-example-connect') this.listening();
				else if (isConfiguration(event.data) && event.data.documentId === this.documentId) {
					const message = event.data, signal = this.lifecycle!.signal;
					// Preserve every requested edit in arrival order. Reset runs after
					// earlier writes; revision guards protect replies, not user intent.
					this.configurationQueue = this.configurationQueue.then(async () => {
						if (!signal.aborted) await this.configure(message);
					}).catch(() => { if (!signal.aborted) this.post({ type: 'en-api-example-error' }); });
				}
			}, { signal: this.lifecycle.signal });
			this.addEventListener('en-change', () => { queueMicrotask(() => void this.observeControls()); }, { signal: this.lifecycle.signal });
			this.listening();
		}
		private post(data: Record<string, unknown>) {
			const view = this.ownerDocument.defaultView;
			if (view && view.parent !== view) view.parent.postMessage({ ...data, version: API_EXAMPLE_VERSION, caseId, documentId: this.documentId }, view.location.origin);
		}
		private listening() { this.post({ type: 'en-api-example-listening' }); }
		private target() {
			if (this.controlTarget?.node.isConnected && this.contains(this.controlTarget.node)) return this.controlTarget;
			// Once captured, never select a replacement merely because an author changed
			// its label/value or because a conditional scene removed that exact node.
			if (this.controlTarget) return undefined;
			const definition = controlDefinitions[this.componentTag];
			if (!definition?.target || definition.target.caseId !== caseId) return undefined;
			const matches = this.querySelector('[data-specimen]')?.querySelectorAll<HTMLElement>(definition.target.selector);
			if (matches?.length !== 1 || matches[0]!.localName !== definition.target.tagName) return undefined;
			return this.controlTarget = { definition, node: matches[0]! };
		}
		private snapshot(message = ''): APIControlsSnapshot {
			const definition = controlDefinitions[this.componentTag], target = this.target();
			return { targetId: definition?.target?.id ?? null, available: Boolean(target),
				values: target ? readControls(target.node, target.definition.controls) : Object.fromEntries((definition?.controls ?? []).map(control => [control.property, { defined: false as const }])),
				message: target ? message : definition?.target ? 'The authored target is not available in this scene. Reset example to restore it.' : 'No exact authored target is available for this component.' };
		}
		private async observeControls() {
			const requestId = this.latestRequest, signal = this.lifecycle?.signal;
			await Promise.resolve();
			await Promise.all([...this.querySelectorAll<HTMLElement & { updateComplete?: Promise<unknown> }>('*')].map(element => element.updateComplete));
			if (signal?.aborted || !this.isConnected || !this.componentTag || requestId !== this.latestRequest) return;
			this.post({ type: 'en-api-example-controls-state', requestId, componentTag: this.componentTag, controls: this.snapshot() });
		}
		private async configure(message: import('./protocol.js').ExampleConfiguration) {
			if (message.requestId <= this.latestRequest) return;
			const definition = controlDefinitions[message.componentTag];
			if (!definition || definition.target && definition.target.caseId !== caseId || message.targetId !== (definition.target?.id ?? null)) return;
			this.latestRequest = message.requestId;
			if (this.componentTag !== message.componentTag) { this.controlTarget = undefined; this.appliedControlRevision = 0; }
			this.componentTag = message.componentTag;
			const signal = this.lifecycle?.signal;
			const root = this.ownerDocument.documentElement;
			// Only static, build-produced theme selectors change. No imported CSS is executed.
			root.dataset.exampleMode = message.mode; root.dataset.enAppearance = message.mode; root.dataset.exampleDensity = message.density;
			if (this.resetRevision !== message.resetRevision) {
				this.resetRevision = message.resetRevision; this.controlTarget = undefined; this.appliedControlRevision = 0; this.controlFeedback = ''; this.requestUpdate();
			}
			await this.updateComplete;
			await Promise.all([...this.querySelectorAll<HTMLElement & { updateComplete?: Promise<unknown> }>('*')].map(element => element.updateComplete));
			if (signal?.aborted || !this.isConnected || message.requestId !== this.latestRequest) return;
			let feedback = this.controlFeedback;
			if (message.control && message.control.revision > this.appliedControlRevision) {
				this.appliedControlRevision = message.control.revision;
				const target = this.target();
				const control = target?.definition.controls.find(item => item.property === message.control!.property);
				if (!target || !control || !acceptsControlValue(control, message.control.value)) feedback = 'That property or value is not available for this authored target.';
				else {
					try {
						// This is an explicit public author write. Never synthesize en-change
						// or reapply it after the specimen/user subsequently changes state.
						(target.node as unknown as Record<string, unknown>)[control.property] = message.control.value;
						await Promise.all([...this.querySelectorAll<HTMLElement & { updateComplete?: Promise<unknown> }>('*')].map(element => element.updateComplete));
						feedback = `${control.property} applied. Current shows the component's confirmed value.`;
					} catch { feedback = `${control.property} could not be applied. Current shows the component's value.`; }
				}
			}
			if (signal?.aborted || !this.isConnected || message.requestId !== this.latestRequest) return;
			this.controlFeedback = feedback;
			this.dataset.exampleReady = 'true';
			this.post({ type: 'en-api-example-ready', requestId: message.requestId, mode: message.mode, density: message.density, resetRevision: message.resetRevision, componentTag: this.componentTag, controlRevision: this.appliedControlRevision, controls: this.snapshot(feedback) });
		}
		render() {
			return html`
				<main id="example" aria-labelledby="example-title">
					<h1 class="visually-hidden api-example-title" id="example-title">${specimen.title} live example</h1>
					${hasStandaloneTools ? html`<div class="api-standalone-tools" role="group" aria-label="Review controls">
						${['tooltip-warmup', 'data-table', 'split-view', 'navigation-sidebar', 'rich-text', 'carousel', 'presence-activity', 'color-slider', 'color-picker', 'composable-chat', 'chat-patterns', 'toast', 'multi-step', 'file-upload', 'calendar', 'tree-view', 'tree-data', 'mixed-toolbar', 'virtual-collection', 'pagination', 'menu-choices', 'content-recipes'].includes(caseId) ? html`<en-select label="Inspired theme" .value=${this.selectedTheme}
							.items=${presetItems}
							@en-change=${this.themeChanged}></en-select>` : nothing}
						<en-select label="Appearance" .items=${appearanceItems} .value=${this.reviewMode}
							@en-change=${this.reviewAppearanceChanged}></en-select>
						<en-select label="Density" .items=${reviewDensityItems} .value=${this.reviewDensity}
							@en-change=${this.reviewDensityChanged}></en-select>
						<en-button variant="secondary" @click=${this.resetReview}>Reset example</en-button>
						<a class="api-standalone-progress" href="http://127.0.0.1:4177">Progress Report</a>
					</div>` : nothing}
					${['tooltip-warmup', 'data-table', 'split-view', 'navigation-sidebar', 'rich-text', 'carousel', 'presence-activity', 'color-slider', 'color-picker', 'composable-chat', 'chat-patterns', 'toast', 'multi-step', 'file-upload', 'calendar', 'tree-view', 'tree-data', 'mixed-toolbar', 'virtual-collection', 'pagination', 'menu-choices', 'content-recipes'].includes(caseId) ? html`<p role="status" aria-label="Theme result">${this.themeFeedback}</p>` : nothing}
					<div class="specimen-content api-example-content" data-specimen=${caseId}>
						${keyed(this.resetRevision, specimen.render())}
					</div>
					${caseId === 'virtual-collection' ? html`<details class="api-collection-review">
						<summary>Accessibility and device review</summary>
						<p>Compare Windowed and Paginated delivery. Automated browser checks cover semantics and keyboard behavior; actual VoiceOver, NVDA and TalkBack results are still pending.</p>
						<ol>
							<li>Read the caption, headers and first records with screen-reader table navigation. Check selection names and sort direction.</li>
							<li>Switch to Paginated, navigate to the next page, and verify that every record on that page remains available for reading and printing.</li>
							<li>Focus a checkbox, scroll far away, then Tab and Shift+Tab. Compare keyboard focus retention with the screen reader's independent reading cursor.</li>
							<li>Try a distant key, missing key, sorting and record removal. Record any lost position or unexpected announcement.</li>
						</ol>
						<p><a href="/reviews/table-accessibility.md">Full checklist and pending platform record</a>. Include device, browser, assistive technology, delivery mode and exact steps with your feedback.</p>
					</details>` : nothing}
					${exampleSource ? html`<details class="code-disclosure api-example-source" @toggle=${this.highlightCode}>
						<summary>View example code</summary>
						<p class="code-note">This is the maintained source powering the demo above. It includes the authored markup and event handlers; load the element registrations for the components used and serve linked CSS at the shown URLs.</p>
						<en-button variant="secondary" size="small" @click=${this.copyCode}>Copy code</en-button>
						<p role="status" aria-label="Code copy status">${this.copyFeedback}</p>
						<pre tabindex="0" dir="ltr" aria-label=${`${specimen.title} example source`}>${code}</pre>
					</details>` : nothing}
				</main>
			`;
		}
	};
}
