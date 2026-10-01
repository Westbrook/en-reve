import { descriptionReference } from './descriptions.js';
import { splitViewReference } from './split-view.js';
import { tooltipReference } from './tooltip.js';
import { navigationReference } from './navigation.js';
import {richTextReference} from './rich-text.js';
import {carouselReference} from './carousel.js';
import { presenceActivityReference } from './presence-activity.js';
import { colorPickerReference } from './color-picker.js';
import { chatReference } from './chat.js';
import { toastReference } from './toast.js';
import { formNavigationReference } from './form-navigation.js';
import { attachAnchorNavigation, type AnchorNavigation } from '@en-reve/primitives/interactions/anchor-navigation.js';
import { acceptValueChange } from '../change-consumption.js';
import { LitElement, html, nothing } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import { hydrate } from '@lit-labs/ssr-client';
import reference from '../generated/api-reference.js';
import sources from '../generated/specimens.js';
import { sourceCode } from '../specimen-source.js';
import { APILiveDemoController } from './demo-controller.js';
import { tableCompositionReference } from './table-composition.js';
import { contentRecipesReference } from './content-recipes.js';
import { paginationReference } from './pagination.js';
import { toolbarReference } from './toolbar.js';
import { fileUploadReference } from './file-upload.js';
import { treeReference } from './tree.js';
import { calendarReference } from './calendar.js';
import { filterComponents, sectionNames } from './model.js';
import type { APIComponent, APISection } from './model.js';

/** One page instance, with deterministic server/first-client state. */
export class APIReferenceApp extends LitElement {
	private liveDemo = new APILiveDemoController(this);
	private selected = reference.components[0]?.tagName ?? '';
	private query = '';
	private flagged = false;
	private lifecycle?: AbortController;
	private resize?: ResizeObserver;
	private navigation?: AnchorNavigation;
	private navigationElement?: HTMLElement;
	get previewCSS() { return ''; }
	protected createRenderRoot() {
		if (this.hasAttribute('data-ssr')) {
			hydrate(this.render(), this, { host: this });
			this.removeAttribute('data-ssr');
		}
		return this;
	}
	connectedCallback() { super.connectedCallback(); if (this.hasUpdated) this.connect(); }
	disconnectedCallback() {
		this.lifecycle?.abort(); this.resize?.disconnect();
		this.navigation?.disconnect(); this.navigation = undefined; this.navigationElement = undefined;
		super.disconnectedCallback();
	}
	protected firstUpdated() { this.connect(); }
	protected updated() { this.measureTables(); this.connectNavigation(); }
	/** Called once the URL-selected article has replaced the initial SSR article. */
	followInitialAnchor() { this.navigation?.followInitialAnchor(); }
	private connectNavigation() {
		const navigation = this.querySelector<HTMLElement>('.api-jumps');
		if (navigation === this.navigationElement) { this.navigation?.refresh(); return; }
		this.navigation?.disconnect(); this.navigation = undefined;
		this.navigationElement = navigation ?? undefined;
		const root = navigation?.closest<HTMLElement>('.api-component');
		if (navigation && root) this.navigation = attachAnchorNavigation({ root, navigation });
	}
	private connect() {
		this.lifecycle?.abort(); this.resize?.disconnect();
		this.lifecycle = new AbortController();
		this.readLocation();
		this.connectNavigation();
		window.addEventListener('popstate', () => this.readLocation(), { signal: this.lifecycle.signal });
		if ('ResizeObserver' in window) {
			this.resize = new ResizeObserver(() => this.measureTables()); this.resize.observe(this);
		}
	}
	private readLocation() {
		const params = new URLSearchParams(location.search);
		this.flagged = params.has('progress-report');
		const requested = params.get('component');
		if (reference.components.some(component => component.tagName === requested)) this.selected = requested!;
		this.requestUpdate();
	}
	private measureTables() {
		for (const region of this.querySelectorAll<HTMLElement>('.api-table-scroll')) {
			region.tabIndex = region.scrollWidth > region.clientWidth + 1 ? 0 : -1;
		}
	}
	private href(path: string) {
		const [beforeHash, hash] = path.split('#');
		return beforeHash + (this.flagged ? (beforeHash.includes('?') ? '&progress-report' : '?progress-report') : '') + (hash ? `#${hash}` : '');
	}
	private choose(event: CustomEvent<{ proposed: string }>) {
		acceptValueChange<string>(event, value => {
			if (!reference.components.some(component => component.tagName === value)) return;
			this.selected = value;
			const url = new URL(location.href); url.searchParams.set('component', this.selected);
			history.replaceState(history.state, '', url);
			this.requestUpdate();
			return this.selected;
		});
	}
	private search(event: CustomEvent<{ proposed: string }>) {
		acceptValueChange<string>(event, value => {
			this.query = value; this.requestUpdate(); return this.query;
		});
	}
	private async highlightCode(event: Event) {
		const disclosure = event.currentTarget as HTMLDetailsElement;
		if (!disclosure.open || !('CSS' in globalThis) || !('highlights' in CSS)) return;
		const { highlightAll } = await import('microlighter');
		if (!this.isConnected || !disclosure.isConnected || !disclosure.open) return;
		await highlightAll({ root: this, selector: '.api-example[open] pre > code', languageAliases: { 'lit-typescript': 'typescript' } });
	}
	private table(component: APIComponent, section: APISection) {
		const title = sectionNames[section]; const rows = component.sections[section];
		const typed = section !== 'slots' && section !== 'cssParts';
		const hasDefault = ['attributes', 'properties', 'cssProperties'].includes(section);
		const typeHeading = section === 'methods' ? 'Signature' : section === 'cssProperties' ? 'Syntax and default' : hasDefault ? 'Type and default' : 'Type';
		return html`
			<section class="api-section" id=${`api-${section}`} tabindex="-1">
				<h3 id=${`api-${section}-title`}>${title} <span class="api-count">(${rows.length})</span></h3>
				${section === 'events' && rows.some(row => row.name === 'en-change') ? html`
					<p>Control this element with the single cancelable <code>en-change</code> event. During the handler, its public state already exposes <code>event.detail.proposed</code>. Call <code>event.preventDefault()</code> synchronously to reject the default, then assign the public property when your application accepts a value. Explicit property writes are silent and take precedence over rollback, including same-value writes. No <code>controlled</code> attribute or second control event is needed.</p>
					${rows.some(row => row.name === 'en-input') ? html`<p><code>en-input</code> only observes native editing drafts and composition; it is not cancelable and does not control the accepted value. Use <code>en-change</code> for application-owned state.</p>` : nothing}
				` : nothing}
				${rows.length ? html`
					<div class="api-table-scroll" role="region" aria-labelledby=${`api-${section}-title`} tabindex="0">
						<table class=${typed ? 'api-typed-table' : 'api-named-table'}>
							<caption class="visually-hidden">${component.tagName} ${title.toLowerCase()}</caption>
							<thead><tr><th scope="col">Name</th>${typed ? html`<th scope="col">${typeHeading}</th>` : nothing}<th scope="col">Description</th></tr></thead>
							<tbody>${rows.map(row => html`
								<tr>
									<th scope="row"><code>${row.name || '(default slot)'}</code>${row.notes.map(note => html`<span class="api-note">${note}</span>`)}${row.inheritedFrom ? html`<span class="api-note">Inherited from <code>${row.inheritedFrom}</code></span>` : nothing}</th>
									${typed ? html`<td>${row.type ? html`<code>${row.type}</code>` : html`<span class="api-gap">${section === 'cssProperties' ? 'Syntax not documented' : 'Type not documented'}</span>`}${hasDefault ? row.default !== null ? html`<span class="api-note">Default: <code>${row.default || 'empty string'}</code></span>` : html`<span class="api-note api-gap">Default not documented</span>` : nothing}</td>` : nothing}
									<td>${row.description ? html`<span class="api-description">${row.description}</span>` : html`<span class="api-gap">Description not documented</span>`}</td>
								</tr>
							`)}</tbody>
						</table>
					</div>
				` : html`<p class="api-gap">No ${title.toLowerCase()} recorded in this manifest.</p>`}
			</section>
		`;
	}
	private component(component: APIComponent) {
		const example = component.example;
		const source = example ? sources[example.id] : undefined;
		return html`
			<article class="api-component" aria-labelledby="component-title">
				<header>
					<h2 id="component-title"><code>${component.tagName}</code></h2>
					${component.description ? html`<p class="api-description">${component.description}</p>` : html`<p class="api-gap">Component description not documented.</p>`}
					<p><a href=${this.href(`/api-reference?component=${component.tagName}#component-title`)}>Link to this component</a></p>
				</header>
				<section class="api-section" aria-labelledby="api-use-title">
					<h3 id="api-use-title">Use this component</h3>
					<p>Register this element with its dedicated entry. Configure your package server or import map to resolve the package names and their dependencies.</p>
					<pre data-api-code="registration"><code>${`import '${component.definitionImport}';`}</code></pre>
					<p>To choose a registry yourself, import the class without registering it:</p>
					<pre data-api-code="class"><code>${`import { ${component.className} } from '${component.classImport}';`}</code></pre>
					${example && source ? html`
						${this.liveDemo.render(example, component.tagName)}
						<details class="api-example" data-syntax-theme="github" @toggle=${this.highlightCode}>
							<summary>View authored example source</summary>
							<p>This is the same source used by the live specimen. Its Lit template includes property bindings and handlers; the demo supplies registration and surrounding layout. Additional elements in the composition need their own registration entries.</p>
							<pre data-api-code="example">${sourceCode(example.id)}</pre>
						</details>
					` : html`<p class="api-gap">No authored sticker-sheet example is linked to this component yet.</p>`}
				</section>
				${['en-menu', 'en-menu-item'].includes(component.tagName) ? html`<p><a href=${this.href('/api-examples/menu-choices.html')}>Review checkable choices and nested menus</a> with the six inspired themes, keyboard navigation and canceled changes.</p>` : nothing}
				${['en-table','en-data-table'].includes(component.tagName) ? tableCompositionReference(path => this.href(path)) : nothing}
				<nav class="api-jumps" aria-label="Component API sections">${component.sections.properties.some(row => row.name === 'description') ? html`<a href="#api-description-guide">Supporting descriptions</a>` : nothing}${['en-rich-text-editor','en-editor-toolbar'].includes(component.tagName) ? richTextReference(path=>this.href(path)) : nothing}
        ${['en-split-view','en-splitter'].includes(component.tagName) ? html`<a href="#api-split-view-guide">Pane sizing and visibility</a>` : nothing}${['en-navigation','en-navigation-group'].includes(component.tagName) ? html`<a href="#api-navigation-guide">Groups and responsive layout</a>` : nothing}${['en-carousel','en-carousel-slide'].includes(component.tagName) ? html`<a href="#api-carousel-guide">Slides and navigation</a>` : nothing}${['en-presence','en-presence-group','en-activity-item','en-activity-feed'].includes(component.tagName) ? html`<a href="#api-presence-activity-guide">Identities and activity</a>` : nothing}${['en-color-picker','en-color-slider','en-color-plane','en-color-wheel'].includes(component.tagName) ? html`<a href="#api-color-picker-guide">Inline color editing</a>` : nothing}${['en-chat-message','en-chat-composer','en-token-editor','en-editor-trigger'].includes(component.tagName) ? html`<a href="#api-chat-guide">Messages and drafts</a>` : nothing}${['en-toast','en-toast-region'].includes(component.tagName) ? html`<a href="#api-toast-guide">Notifications and timing</a>` : nothing}${['en-progress-step', 'en-progress-steps', 'en-validation-summary'].includes(component.tagName) ? html`<a href="#api-form-navigation-guide">Validation and steps</a>` : nothing}${['en-calendar', 'en-date-picker', 'en-time-field'].includes(component.tagName) ? html`<a href="#api-calendar-guide">Dates and calendar navigation</a>` : nothing}${component.tagName === 'en-file-upload' ? html`<a href="#api-file-upload-guide">File intake and transfers</a>` : nothing}${['en-tree', 'en-tree-item'].includes(component.tagName) ? html`<a href="#api-tree-guide">Hierarchy and selection</a>` : nothing}${component.tagName === 'en-pagination' ? html`<a href="#api-pagination-guide">Layout and consumption</a>` : nothing}${component.tagName === 'en-toolbar' ? html`<a href="#api-toolbar-guide">Keyboard ownership</a>` : nothing}${(Object.keys(sectionNames) as APISection[]).map(section => html`<a href=${`#api-${section}`}>${sectionNames[section]}</a>`)}</nav>
				${component.tagName === 'en-pagination' ? paginationReference(path => this.href(path)) : nothing}
				${component.tagName === 'en-toolbar' ? toolbarReference(path => this.href(path)) : nothing}
				${component.tagName === 'en-tooltip' ? tooltipReference(path => this.href(path)) : nothing}
				${component.tagName === 'en-file-upload' ? fileUploadReference(path => this.href(path)) : nothing}
				${['en-tree', 'en-tree-item'].includes(component.tagName) ? treeReference(path => this.href(path)) : nothing}
				${['en-color-picker','en-color-slider','en-color-plane','en-color-wheel'].includes(component.tagName) ? colorPickerReference(path=>this.href(path)) : nothing}
				${['en-rich-text-editor','en-editor-toolbar'].includes(component.tagName) ? richTextReference(path=>this.href(path)) : nothing}
        ${['en-split-view','en-splitter'].includes(component.tagName) ? splitViewReference(path=>this.href(path)) : nothing}${['en-navigation','en-navigation-group'].includes(component.tagName) ? navigationReference(path=>this.href(path)) : nothing}${['en-carousel','en-carousel-slide'].includes(component.tagName) ? carouselReference(path=>this.href(path)) : nothing}${['en-presence','en-presence-group','en-activity-item','en-activity-feed'].includes(component.tagName) ? presenceActivityReference(path=>this.href(path)) : nothing}
				${['en-chat-message','en-chat-composer','en-token-editor','en-editor-trigger'].includes(component.tagName) ? chatReference(path=>this.href(path)) : nothing}
				${['en-toast','en-toast-region'].includes(component.tagName) ? toastReference(path=>this.href(path)) : nothing}
				${['en-progress-step', 'en-progress-steps', 'en-validation-summary'].includes(component.tagName) ? formNavigationReference(path => this.href(path)) : nothing}
				${['en-calendar', 'en-date-picker', 'en-time-field'].includes(component.tagName) ? calendarReference(path => this.href(path)) : nothing}
				${component.sections.properties.some(row => row.name === 'description') ? descriptionReference() : nothing}
				${(Object.keys(sectionNames) as APISection[]).map(section => this.table(component, section))}
				<p class="api-provenance">Declaration: <code>${component.source}</code>. This is source provenance, not a consumer import path.</p>
			</article>
		`;
	}
	render() {
		const component = reference.components.find(item => item.tagName === this.selected) ?? reference.components[0];
		const matches = filterComponents(reference.components, this.query);
		const selectedOutsideSearch = component && !matches.includes(component);
		const options = matches.map(item => ({ value: item.tagName, label: item.tagName }));
		if (selectedOutsideSearch) options.unshift({ value: component.tagName, label: `${component.tagName} (selected; outside search)` });
		return html`
			<a class="api-skip" href="#api-reference">Skip to API reference</a>
			<header class="site-header">
				<a class="wordmark" href=${this.href('/')} aria-label="en-reve sticker sheet"><span class="mark" aria-hidden="true">en</span><span>en-reve</span></a>
				<div class="header-context"><span>Design system</span><en-badge class="version">${reference.packageVersion} · design review</en-badge></div>
				<nav class="header-context" aria-label="Documentation pages"><a href=${this.href('/')}>Sticker sheet</a><a href=${this.href('/showcase')}>Showcase</a><a href=${this.href('/workflows')}>Workflows</a><a href=${this.href('/theme-review')}>Theme Review</a><a href=${this.href('/api-reference')} aria-current="page">API reference</a><a href=${this.href('/api-examples')}>API examples</a></nav>
			</header>
			<main id="api-reference" tabindex="-1">
				<div class="page-heading"><div><h1>API reference</h1><p class="lede">Find a component, its imports, and the public API recorded in this build.</p></div><en-badge>${reference.components.length} components</en-badge></div>
				<p><a href="#api-content-recipes">Layout and content recipes</a> · <a href="/reviews/framework-consumption.md">Framework consumption and SSR ownership</a></p>
				<div class="api-chooser">
					<en-search-input label="Find a component" placeholder="Tag, class or API name" .value=${this.query} @en-change=${this.search}></en-search-input>
					<en-select label="Component" .items=${options} .value=${component?.tagName ?? ''} @en-change=${this.choose}></en-select>
				</div>
				<p class="api-results" role="status" aria-live="polite">${matches.length} matching component${matches.length === 1 ? '' : 's'}.${selectedOutsideSearch ? ` ${component.tagName} remains selected.` : nothing}</p>
				<details class="api-metadata">
					<summary>Metadata source and limits</summary>
					<p>These tables reflect the generated Custom Elements Manifest. Private and protected members, static implementation fields, and browser or Lit lifecycle callbacks are omitted. Public inherited APIs remain visible. Undocumented entries are metadata gaps; this page does not invent their behavior or certify API stability, accessibility, or browser coverage.</p>
					<p>Missing defaults are not inferred. A zero count means no entries were recorded; it does not prove the absence of an API. Event cancellation, timing, and propagation are not inferred from event names.</p>
					<p>The supported package surface includes root exports, component classes, registration and definition entries, catalog, context, editor extensions and event types. Other nested imports remain available for staging compatibility but are unsupported implementation details. The public API graph records this distinction.</p>
					<p><a href="/custom-elements.json" download>Download Custom Elements Manifest</a> · <a href="/custom-elements.json.receipt.json" download>Download source receipt</a> · <a href="/public-types.json" download>Download TypeScript API snapshot</a> · <a href="/public-api.json" download>Download public API graph</a></p>
					<p>The original manifest includes visibility annotations and internal source inventory. Consumers of that file must respect its public/private metadata.</p>
					<p>Manifest schema <code>${reference.manifestSchemaVersion}</code>. Verified manifest digest: <code class="api-digest">${reference.manifestDigest}</code>.</p>
				</details>
				${reference.publicTypes?.length ? html`<details class="api-metadata" id="api-public-types">
					<summary>Exported TypeScript types (${reference.publicTypes.length})</summary>
					<p>These interfaces and aliases are exported from <code>${reference.packageName}</code>. Declarations come from the same verified snapshot used for release review. The download also records reachable local types and subpath exports; external dependency bodies require separate review.</p>
					${reference.publicTypes.map(type => html`<details><summary><code>${type.name}</code></summary><pre><code>${type.declaration}</code></pre></details>`)}
					<p>Verified type snapshot digest: <code class="api-digest">${reference.typeSnapshotDigest}</code>.</p>
				</details>` : nothing}
				${component ? keyed(component.tagName, this.component(component)) : html`<p>No components are recorded.</p>`}
				${contentRecipesReference(path => this.href(path), event => { void this.highlightCode(event); })}
			</main>
			<footer class="site-footer"><span>en-reve · A working design system</span><a href="#api-reference">Back to top ↑</a></footer>
			${this.flagged ? html`<a class="progress-return" href="http://127.0.0.1:4177">Progress Report</a>` : nothing}
		`;
	}
}
