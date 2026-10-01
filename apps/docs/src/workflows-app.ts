import { acceptValueChange } from './change-consumption.js';
import { skipLinkTemplate } from '@en-reve/primitives/templates/navigation.js';
import { attachAnchorNavigation, type AnchorNavigation } from '@en-reve/primitives/interactions/anchor-navigation.js';
import { LitElement, html, nothing } from 'lit';
import { html as staticHtml, unsafeStatic } from 'lit/static-html.js';
import { keyed } from 'lit/directives/keyed.js';
import { hydrate } from '@lit-labs/ssr-client';
import { Signal } from 'signal-polyfill';
import { SignalController } from '@en-reve/primitives/interactions/signal-controller.js';
import { appearanceItems, effectiveAppearance, isAppearance, observeSystemAppearance } from './appearance.js';
import type { Appearance } from './appearance.js';
import { previewPairCSS, resolvePreviewPair } from './preview-theme.js';
import type { ThemeMode, ThemeDensity } from '@en-reve/tokens';
import type { WorkflowDefinition } from './workflow-pages/definition.js';
import { initialPreview, previewFromSearch, searchWithPreview, workflowPages } from './workflow-pages/navigation.js';
import type { WorkflowPreview } from './workflow-pages/navigation.js';
import { attachThemePreview, disconnectThemePreview, refreshThemePreview } from './theme-review/preview.js';

const densityItems = [{ value: 'compact', label: 'Compact' }, { value: 'comfortable', label: 'Comfortable' }, { value: 'spacious', label: 'Spacious' }];
const directionItems = [{ value: 'ltr', label: 'Left to right' }, { value: 'rtl', label: 'Right to left' }];

// These immutable templates contain only escaped, authored source text. Giving
// Microlighter a sole text child also preserves source bytes through hydration.
function sourceTemplate(source: string) {
	const escaped = source.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
	return staticHtml`<code class="language-lit-typescript">${unsafeStatic(escaped)}</code>`;
}
/** Each browser instance and server render owns a fresh set of local fixtures. */
export class WorkflowsApp extends LitElement {
	static properties = { progressReportEnabled: { state: true }, navigationSearch: { state: true } };
	static definition: WorkflowDefinition;
	declare progressReportEnabled: boolean;
	private declare navigationSearch: string;
	private definition = (this.constructor as typeof WorkflowsApp).definition;
	private source = sourceTemplate(this.definition.source);
	private state = new Signal.State<WorkflowPreview>({ ...initialPreview });
	private observer = new SignalController(this, () => this.state.get());
	private themeCSS = this.resolvePreviewCSS();
	private systemMode: ThemeMode = 'light';
	private appearanceLifecycle?: AbortController;
	private workflow = this.createWorkflow();
	private disposed = false;
	private generation = 0;
	private themeStyle?: HTMLStyleElement;
	private navigation?: AnchorNavigation;

	constructor() {
		super();
		this.progressReportEnabled = false;
		this.navigationSearch = '';
	}

	private createWorkflow() {
		return this.definition.create({ requestUpdate: () => this.requestUpdate() });
	}

	protected createRenderRoot() {
		if (this.hasAttribute('data-ssr')) {
			hydrate(this.render(), this, { host: this });
			this.removeAttribute('data-ssr');
		}
		return this;
	}

	get previewCSS(): string { return this.themeCSS + '\n' + this.definition.styles.cssText; }

	/** Also used by the server entry once its isolated render is complete. */
	disposeWorkflows() {
		if (this.disposed) return;
		this.workflow.dispose();
		this.disposed = true;
	}

	connectedCallback() {
		if (this.disposed) {
			this.workflow = this.createWorkflow();
			this.generation += 1;
			this.disposed = false;
			this.requestUpdate();
		}
		super.connectedCallback();
		if (this.hasUpdated) {
			this.connectNavigation();
			this.connectAppearance();
			attachThemePreview(this);
		}
	}

	disconnectedCallback() {
		disconnectThemePreview(this);
		this.appearanceLifecycle?.abort();
		this.disposeWorkflows();
		this.navigation?.disconnect();
		this.navigation = undefined;
		super.disconnectedCallback();
	}

	protected firstUpdated() {
		this.connectNavigation();
		this.connectAppearance();
	}

	protected updated() {
		const settings = this.state.get();
		const doc = this.ownerDocument;
		this.themeStyle = doc.querySelector<HTMLStyleElement>('#en-preview-theme') ?? doc.createElement('style');
		this.themeStyle.id = 'en-preview-theme';
		if (!this.themeStyle.isConnected) doc.head.append(this.themeStyle);
		if (this.themeStyle.textContent !== this.previewCSS) this.themeStyle.textContent = this.previewCSS;
		if (!refreshThemePreview(this)) {
			doc.documentElement.style.colorScheme = settings.mode === 'auto' ? 'light dark' : settings.mode;
			doc.documentElement.setAttribute('data-en-appearance', settings.mode);
			doc.documentElement.dir = settings.direction;
			this.dataset.syntaxTheme = effectiveAppearance(settings.mode,this.systemMode) === 'light' ? 'github' : 'night-owl';
		}
		this.navigation?.refresh();
	}

	private resolvePreviewCSS(): string {
		const settings = this.state.get();
		return previewPairCSS(resolvePreviewPair({name:'workflow-review',density:settings.density}));
	}

	private connectAppearance() {
		this.appearanceLifecycle?.abort();
		this.appearanceLifecycle = new AbortController();
		observeSystemAppearance(this.ownerDocument.defaultView!, mode => {
			if (this.systemMode === mode) return;
			this.systemMode = mode;
			if (this.state.get().mode === 'auto') this.requestUpdate();
		}, this.appearanceLifecycle.signal);
	}

	/** Apply URL preferences only after the default server template is hydrated. */
	initializePreview(search: string) {
		this.navigationSearch = search;
		this.progressReportEnabled = new URLSearchParams(search).has('progress-report');
		this.change(previewFromSearch(search));
	}

	private change(patch: Partial<WorkflowPreview>) {
		const current = this.state.get();
		const next = { ...current, ...patch };
		if (!isAppearance(next.mode)) throw new Error('Choose Auto, Light or Dark.');
		const css = next.density === current.density ? this.themeCSS : previewPairCSS(resolvePreviewPair({name:'workflow-review',density:next.density}));
		this.state.set(next);
		this.navigationSearch = searchWithPreview(this.navigationSearch, next);
		this.themeCSS = css;
	}

	private pageHref(path: string): string {
		const destination = new URL(path, 'https://en-reve.invalid');
		destination.search = this.navigationSearch;
		if (this.progressReportEnabled && !destination.searchParams.has('progress-report')) destination.searchParams.append('progress-report', '');
		return destination.pathname + destination.search + destination.hash;
	}

	/** Native links own URL, history and focus; this adapter only keeps targets clear. */
	followInitialAnchor() { this.navigation?.followInitialAnchor(); }

	private connectNavigation() {
		this.navigation?.disconnect();
		const navigation = this.querySelector<HTMLElement>('.workflow-navigation');
		if (navigation) this.navigation = attachAnchorNavigation({ root: this, navigation });
	}

	private async highlightCode(event: Event) {
		const disclosure = event.currentTarget as HTMLDetailsElement;
		if (!disclosure.open || !('CSS' in globalThis) || !('highlights' in CSS)) return;
		const { highlightAll } = await import('microlighter');
		if (!disclosure.open || !this.isConnected) return;
		await highlightAll({ root: this, selector: '.code-disclosure[open] pre > code', languageAliases: { 'lit-typescript': 'typescript' } });
	}

	private workflowTools() {
		const title = this.definition.sourceTitle;
		return html`<div class="workflow-tools">
			<en-button variant="ghost" size="small" @click=${() => this.workflow.reset()}>Reset <span class="visually-hidden">${title}</span></en-button>
			<details class="code-disclosure" @toggle=${this.highlightCode}>
				<summary>View source<span class="visually-hidden"> for ${title}</span></summary>
				<p class="code-note">This is the actual template used above. Its controller manages the local fixture and asynchronous interactions.</p>
				<pre tabindex="0" aria-label=${`${title} template source`}>${this.source}</pre>
			</details>
		</div>`;
	}

	render() {
		const settings = this.state.get();
		return html`
			${skipLinkTemplate({ href: '#workflows', label: 'Skip to workflows' })}
			<header class="site-header">
				<a class="wordmark" href=${this.pageHref('/')} aria-label="en-reve sticker sheet"><span class="mark" aria-hidden="true">en</span><span>en-reve</span></a>
				<div class="header-context"><span>Design system</span><en-badge class="version">0.1.0 · design review</en-badge></div>
				<nav class="header-context" aria-label="Documentation pages">
					<a href=${this.pageHref('/')}>Sticker sheet</a>
					<a href=${this.pageHref('/showcase')}>Showcase</a>
					<a href=${this.pageHref(workflowPages[0].path)} aria-current=${this.definition.id === 'sso' ? 'page' : nothing}>Workflows</a>
					<a href=${this.pageHref('/theme-review')}>Theme Review</a>
					<a href=${this.pageHref('/api-reference')}>API reference</a>
				</nav>
			</header>
			<main id="workflows" tabindex="-1" class="en-navigation-target">
				<div class="page-heading"><div><h1>${this.definition.pageTitle}</h1><p class="lede">${this.definition.description}</p></div></div>
				<details class="workflow-fixture-note">
					<summary>About these local fixtures</summary>
					<p>${this.definition.fixtureNote}</p>
				</details>
				<section class="theme-controls" aria-label="Preview settings">
					<en-segmented-control label="Theme" .value=${settings.mode} .items=${appearanceItems} @en-change=${(event: CustomEvent<{ proposed: string }>) => { acceptValueChange<Appearance>(event, mode => { this.change({ mode }); return this.state.get().mode; }); }}></en-segmented-control>
					<en-select label="Density" .value=${settings.density} .items=${densityItems} @en-change=${(event: CustomEvent<{ proposed: string }>) => { acceptValueChange<ThemeDensity>(event, density => { this.change({ density }); return this.state.get().density; }); }}></en-select>
					<en-select label="Reading direction" .value=${settings.direction} .items=${directionItems} @en-change=${(event: CustomEvent<{ proposed: string }>) => { acceptValueChange<WorkflowPreview['direction']>(event, direction => { this.change({ direction }); return this.state.get().direction; }); }}></en-select>
					<en-button class="reset-preview" variant="ghost" @click=${() => this.change({ ...initialPreview })}>Reset preview</en-button>
				</section>
				<div class="workflow-navigation">
				<en-navigation class="section-nav" label="Workflow sections">
					${workflowPages.map(page => html`
						<a href=${this.pageHref(page.path)} aria-current=${page.id === this.definition.id ? 'page' : nothing}>${page.label}</a>
					`)}
				</en-navigation>
				${this.definition.reviewNavigation ? html`
					<en-navigation class="workflow-review-nav" label=${this.definition.reviewNavigation.label}>
						${this.definition.reviewNavigation.items.map(item => html`
							<a href=${this.pageHref(item.path + '#settings')} aria-current=${item.current ? 'page' : nothing}>${item.label}</a>
						`)}
					</en-navigation>
				` : nothing}
				</div>
				<section class="sheet-section workflow-section en-navigation-target" tabindex="-1" id=${this.definition.id} aria-labelledby=${`${this.definition.id}-title`}>
					<div class="section-heading"><h2 id=${`${this.definition.id}-title`}>${this.definition.heading}</h2></div>
					${keyed(this.generation, this.workflow.render())}
					${this.workflowTools()}
				</section>
			</main>
			<footer class="site-footer"><span>en-reve · A working design system</span><a href="#workflows">Back to top ↑</a></footer>
			${this.progressReportEnabled ? html`<a class="progress-return" href="http://127.0.0.1:4177">Progress Report</a>` : nothing}
		`;
	}
}
