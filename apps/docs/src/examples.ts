import './color-spaces-demo.js';
import { ContextProvider, tooltipWarmupContext, createTooltipWarmupGroup } from '@en-reve/elements/context.js';
import { TableModel } from '@en-reve/primitives/state/table.js';
import { tableColgroup, tableHeader, tableRows, type TableColumn } from '@en-reve/primitives/templates/table.js';
import type { EnDataTable, TableSort, TableMode } from '@en-reve/elements/data-table.js';
import { richTextExample } from './rich-text-demo.js';
import { carouselExample } from './carousel-demo.js';
import { presenceActivityExample } from './presence-activity-demo.js';
import { chatPatternsExample } from './chat-patterns-demo.js';
import { toastExample } from './toast-demo.js';
import { multiStepExample } from './multi-step-demo.js';
import { fileUploadExample } from './file-upload-demo.js';
import { treeDataExample } from './tree-data-demo.js';
import { calendarExample } from './calendar-demo.js';
import { contentCollectionTemplate, contentPlaceholderTemplate, emptyStateTemplate, fileCardTemplate, metadataListTemplate } from '@en-reve/primitives/templates/content.js';
import { html, nothing, css, LitElement, type TemplateResult } from 'lit';
import { html as staticHtml, unsafeStatic } from 'lit/static-html.js';
import { AsyncDirective, directive } from 'lit/async-directive.js';
import { repeat } from 'lit/directives/repeat.js';
import { guard } from 'lit/directives/guard.js';
import { ref } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';
import { acceptValueChange } from './change-consumption.js';
import { inversePreviewCSS } from './inverse-theme.js';
import type { ThemeDensity } from '@en-reve/tokens';

// example-start:navigation-sidebar
/** Documentation-owned composition; the navigation and Drawer remain public primitives. */
class SidebarDrawerDemo extends LitElement {
  static override properties = { compact: { state: true }, preview: { state: true } };
  private declare compact: boolean;
  private declare preview: boolean;
  private media?: MediaQueryList;
  private revision = 0;
  static override styles = css`
    :host{display:block;min-inline-size:0}
    .layout{display:grid;grid-template-columns:minmax(0,17rem) minmax(0,1fr);gap:var(--en-space-panel,1.5rem);align-items:start}
    .layout.compact{grid-template-columns:minmax(0,1fr)}
    aside{padding:var(--en-space-3,.75rem);border:1px solid var(--en-color-line);border-radius:var(--en-radius-container,.5rem);background:var(--en-color-surface)}
    .content{display:grid;gap:var(--en-space-4,1rem);min-inline-size:0}
    .preview{margin-block-end:var(--en-space-3,.75rem)}
    [hidden]{display:none!important}
    en-drawer::part(surface){inline-size:min(22rem,100%);max-inline-size:100%}
  `;
  constructor(){super();this.compact=false;this.preview=false;}
  override connectedCallback(){super.connectedCallback();if(this.hasUpdated)this.observe();}
  override disconnectedCallback(){this.media?.removeEventListener('change',this.resize);this.revision++;super.disconnectedCallback();}
  protected override firstUpdated(){this.observe();}
  private observe(){
    this.media?.removeEventListener('change',this.resize);
    this.media=this.ownerDocument.defaultView!.matchMedia('(max-width:48rem)');
    this.media.addEventListener('change',this.resize);this.resize();
  }
  private get navigation(){return this.querySelector<HTMLElement>('en-navigation');}
  private get drawer(){return this.renderRoot.querySelector<HTMLElement & {open:boolean;updateComplete:Promise<unknown>}>('en-drawer');}
  private focused(){let active=this.ownerDocument.activeElement;while(active?.shadowRoot?.activeElement)active=active.shadowRoot.activeElement;return active as HTMLElement|null;}
  private containsFocus(root:Element|null,active:Element|null):boolean{
    for(let node=active;node;){if(root?.contains(node))return true;const tree=node.getRootNode();node=tree instanceof ShadowRoot?tree.host:null;}return false;
  }
  private resize=async()=>{
    const compact=this.preview || !!this.media?.matches;
    const revision=++this.revision;
    if(compact===this.compact)return;
    const nav=this.navigation,drawer=this.drawer,active=this.focused();
    const inNav=this.containsFocus(nav,active),inDrawer=this.containsFocus(drawer,active);
    if(drawer){drawer.open=false;await drawer.updateComplete;}
    if(!this.isConnected||revision!==this.revision)return;
    this.compact=compact;
    // Only slot assignment changes. The authored navigation and all groups stay mounted.
    if(nav)nav.slot=compact?'mobile':'desktop';
    await this.updateComplete;
    if(!this.isConnected||revision!==this.revision)return;
    if(compact&&inNav&&drawer){drawer.open=true;await drawer.updateComplete;}
    if(!this.isConnected||revision!==this.revision)return;
    if(inNav)active?.focus();
    else if(!compact&&inDrawer)nav?.querySelector<HTMLElement>('a[aria-current],a[href]')?.focus();
  };
  private follow=(event:MouseEvent)=>{
    const nav=this.navigation;
    const link=event.composedPath().find(node=>node instanceof HTMLAnchorElement&&nav?.contains(node)) as HTMLAnchorElement|undefined;
    if(!link||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    queueMicrotask(async()=>{
      if(event.defaultPrevented||!this.isConnected)return;
      nav?.querySelectorAll('[aria-current]').forEach(item=>item.removeAttribute('aria-current'));
      link.setAttribute('aria-current','location');
      const drawer=this.drawer;
      if(!this.compact||!drawer?.open)return;
      drawer.open=false;await drawer.updateComplete;
      const url=new URL(link.href);
      if(url.origin===location.origin&&url.pathname===location.pathname&&url.hash){
        // Successful in-page navigation continues into content after modality is released.
        let id:string;try{id=decodeURIComponent(url.hash.slice(1));}catch{return;}
        this.querySelectorAll<HTMLElement>('[id]').forEach(el=>{if(el.id===id)el.focus();});
      }
    });
  };
  protected override render(){return html`
    <div class="preview"><en-button variant="secondary" @click=${()=>{this.preview=!this.preview;void this.resize();}}>${this.preview?'Use viewport layout':'Preview mobile Drawer'}</en-button></div>
    <div class=${this.compact?'layout compact':'layout'}>
      <aside ?hidden=${this.compact}><slot name="desktop" @click=${this.follow}></slot></aside>
      <div class="content">
        <en-button id="drawer-navigation-trigger" variant="secondary" ?hidden=${!this.compact}>Open project navigation</en-button>
        <slot name="content"></slot>
      </div>
    </div>
    <en-drawer for="drawer-navigation-trigger" label="Project navigation" placement="start">
      <slot name="mobile" @click=${this.follow}></slot>
    </en-drawer>`;}
}
if(!customElements.get('en-sidebar-drawer-demo'))customElements.define('en-sidebar-drawer-demo',SidebarDrawerDemo);

export function navigationSidebarExample() {
  const rootFor = (event: Event) => (event.currentTarget as HTMLElement).closest<HTMLElement>('[data-sidebar-demo]')!;
  const setCurrent = (link: Element) => {
    link.closest('en-navigation')!.querySelectorAll('a[aria-current]').forEach(item => item.removeAttribute('aria-current'));
    link.setAttribute('aria-current', 'location');
  };
  const followed = (event: MouseEvent) => {
    const link = event.composedPath().find(node => node instanceof HTMLAnchorElement) as HTMLAnchorElement | undefined;
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    setCurrent(link);
    // Native fragment/history navigation proceeds. A router can own this instead.
  };
  return html`<section data-sidebar-demo>
    <style>
      [data-sidebar-demo]{display:grid;gap:var(--en-space-panel);min-inline-size:0;}
      [data-sidebar-demo] .workspace{display:grid;grid-template-columns:minmax(0,17rem) minmax(0,1fr);gap:var(--en-space-panel);align-items:start;}
      [data-sidebar-demo] .sidebar{padding:var(--en-space-3);border:var(--en-border-width) solid var(--en-color-line);border-radius:var(--en-radius-container);background:var(--en-color-surface);}
      [data-sidebar-demo] .workspace-content{display:grid;gap:var(--en-space-6);min-inline-size:0;}
      [data-sidebar-demo] .workspace-content section{padding:var(--en-space-4);border:var(--en-border-width) solid var(--en-color-line);border-radius:var(--en-radius-control);scroll-margin-block:var(--en-space-6);}
      [data-sidebar-demo] h4{margin-block-start:0;}
      [data-sidebar-demo] .demo-actions{display:flex;flex-wrap:wrap;gap:var(--en-space-2);}
      @media(max-width:48rem){[data-sidebar-demo] .workspace{grid-template-columns:minmax(0,1fr);}}
    </style>
    <p>One set of native links: a sidebar above 48rem, a collapsible navigation panel below it. Group headings expand independently from destinations.</p>
    <div class="workspace">
      <div class="sidebar">
        <en-navigation id="workspace-navigation" label="Project navigation" layout="sidebar" collapse-at="48rem" @click=${followed}>
          <a href="#workspace-overview" aria-current="location">Overview</a>
          <en-navigation-group id="project-group" label="Project" open>
            <a href="#workspace-artwork">Artwork</a>
            <en-navigation-group id="library-group" label="Library">
              <a href="#workspace-references">References and inspiration for the next collection</a>
              <a id="archive-link" href="#workspace-archive">Archive</a>
            </en-navigation-group>
          </en-navigation-group>
          <a href="/workflows/settings?progress-report">Workspace settings</a>
        </en-navigation>
      </div>
      <div class="workspace-content">
        <section id="workspace-overview" tabindex="-1"><h4>Project overview</h4><p>A workspace for a new cover study. Follow the native section links or expand the library.</p><a href="/workflows/assets?progress-report">Open asset review</a></section>
        <section id="workspace-artwork" tabindex="-1"><h4>Artwork</h4><p>Current cover concepts and draft compositions.</p></section>
        <section id="workspace-references" tabindex="-1"><h4>References</h4><p>Collected colors, textures and visual inspiration.</p></section>
        <section id="workspace-archive" tabindex="-1"><h4>Archive</h4><p>Previous studies remain available for comparison.</p></section>
      </div>
    </div>
    <details><summary>Dynamic content and review scenarios</summary>
      <p>Current-location changes open their enclosing groups. Hiding a current link never makes it visible again automatically; restore it to recover its branch. Explicitly closed groups stay closed until current location changes or revealCurrent() is called.</p>
      <div class="demo-actions">
        <en-button variant="secondary" @click=${(event:Event)=>setCurrent(rootFor(event).querySelector('#archive-link')!)}>Mark archive current</en-button>
        <en-button variant="secondary" @click=${(event:Event)=>{const link=rootFor(event).querySelector<HTMLElement>('#archive-link')!;link.hidden=!link.hidden;}}>Toggle archive availability</en-button>
        <en-button variant="secondary" @click=${(event:Event)=>{const nav=rootFor(event).querySelector('en-navigation')!;const existing=nav.querySelector('[data-added-link]');if(existing)existing.remove();else{const link=document.createElement('a');link.href='#workspace-artwork';link.textContent='Recently added study';link.dataset.addedLink='';nav.append(link);}}}>Add or remove a link</en-button>
      </div>
      <ul><li>Use Tab and Shift+Tab, Enter on a link, and Enter or Space on a group heading.</li><li>At a narrow width, Escape closes navigation and returns focus to its summary. This is an inline disclosure, without a focus trap.</li><li>Resize with a link focused: it stays reachable. Widen while the compact toggle has focus: focus moves to a visible destination.</li><li>Compare long labels, RTL and inspired themes. Native links still support open-in-new-tab and browser history.</li></ul>
    </details>
    <section id="drawer-sidebar-example" aria-labelledby="drawer-sidebar-title">
      <h3 id="drawer-sidebar-title">Sidebar with a mobile Drawer</h3>
      <p>Below 48rem, a button opens the same navigation in a side Drawer. Use the preview button to compare the mobile interaction at any window width. Groups keep their expansion state across layouts.</p>
      <en-sidebar-drawer-demo>
        <en-navigation slot="desktop" id="drawer-workspace-navigation" label="Drawer project sections" layout="sidebar">
          <a href="#drawer-overview" aria-current="location">Overview</a>
          <en-navigation-group label="Project" open>
            <a href="#drawer-artwork">Artwork</a>
            <en-navigation-group label="Library">
              <a href="#drawer-references">References and inspiration</a>
              <a href="#drawer-archive">Archive</a>
            </en-navigation-group>
          </en-navigation-group>
        </en-navigation>
        <div slot="content" class="workspace-content">
          <section id="drawer-overview" tabindex="-1"><h4>Project overview</h4><p>Native links navigate to these sections. Choosing a destination closes the mobile Drawer and focuses that section.</p></section>
          <section id="drawer-artwork" tabindex="-1"><h4>Artwork</h4><p>Working cover studies and compositions.</p></section>
          <section id="drawer-references" tabindex="-1"><h4>References</h4><p>Collected inspiration for the next study.</p></section>
          <section id="drawer-archive" tabindex="-1"><h4>Archive</h4><p>Previous concepts for comparison.</p></section>
        </div>
      </en-sidebar-drawer-demo>
      <p>Escape or Close returns focus to the opener. Expanding a group keeps the Drawer open. Resize with a link focused to keep your place; widening closes the modal and restores the desktop sidebar. The composition code is included below, and is an application recipe rather than an additional library component.</p>
    </section>
  </section>`;
}
// example-end:navigation-sidebar

// example-start:swatches
import { copyTokenReference } from './token-copy.js';

export function tokenSample(token: string, name: string) {
	return html`
		<style>
			@layer en.docs {
				.token-sample { display:grid;gap:var(--en-space-1);min-inline-size:0;align-content:start; }
				.token-sample > en-swatch { inline-size:100%; }
				.token-sample-name { font-weight:var(--en-font-label-strong-weight);margin-block-start:var(--en-space-1); }
				.token-sample-reference { overflow-wrap:anywhere;user-select:text;font:var(--en-font-data-weight) var(--en-font-data-size)/var(--en-font-data-line-height) var(--en-font-data-family); font-style:var(--en-font-data-style); letter-spacing:var(--en-font-data-tracking); }
				.token-sample-status { min-block-size:1lh;font-size:var(--en-font-metadata-size);line-height:var(--en-font-metadata-line-height);color:var(--en-color-text-muted); }
				.token-sample[data-copy-state="failure"] .token-sample-status { color:var(--en-color-danger-text); }
			}
		</style>
		<div class="token-sample" data-token-sample role="group" aria-label=${name}>
			<en-swatch token=${token} label=${`Copy ${name} CSS reference`} @click=${copyTokenReference}></en-swatch>
			<span class="token-sample-name">${name}</span>
			<code class="token-sample-reference">var(${token})</code>
			<p class="token-sample-status" role="status" aria-live="polite" aria-atomic="true"></p>
		</div>
	`;
}

export function swatchesExample() {
	return html`
		${tokenSample('--en-color-action', 'Action color')}
		<p>Activate the color sample to copy its CSS reference. The name, reference, and copy feedback are composed by this example.</p>
	`;
}
// example-end:swatches

// example-start:typography
export function typographyExample() {
	return html`
		<link rel="stylesheet" href="/styles/typography.css">
		<en-stack style="--en-stack-gap:var(--en-space-3)">
			<p class="en-heading-large">Room for ideas.</p>
			<p class="en-heading-small">A clear hierarchy, without the squeeze.</p>
			<p class="en-body">Readable labels and supporting text keep complex work approachable. Type stays the same size when density changes.</p>
			<p class="en-metadata">Metadata · 19 locale targets · System fonts</p>
		</en-stack>
	`;
}
// example-end:typography

// example-start:rhythm
export function rhythmExample() {
	return html`
		<style>
			@layer en.docs {
				.radius-outer { padding:var(--en-space-3);border:var(--en-border-width) solid var(--en-color-accent-border);border-radius:var(--en-radius-container);background:var(--en-color-accent-subtle); }
				.radius-inner { padding:var(--en-space-4);border:var(--en-border-width) solid var(--en-color-line);border-radius:max(0px,calc(var(--en-radius-container) - var(--en-space-3)));background:var(--en-color-surface); }
				.radius-inner span { font-weight:var(--en-font-label-strong-weight); }
				.radius-inner p { font-size:var(--en-font-ui-size);margin-block-start:var(--en-space-2);color:var(--en-color-text-muted); }
				.spacing-ruler { display:flex;align-items:end;gap:var(--en-space-3);flex-wrap:wrap; }
				.spacing-ruler>div { display:flex;align-items:center;flex-direction:column;gap:var(--en-space-1); }
				.spacing-ruler i { display:block;block-size:var(--en-space-4);background:var(--en-color-action);border-radius:var(--en-radius-control); }
				.spacing-ruler small { color:var(--en-color-text-muted);font-size:var(--en-font-metadata-size); }
			}
		</style>
		<div class="radius-outer">
			<div class="radius-inner">
				<span>Related, not identical</span>
				<p>Inner corners follow the space between visible edges.</p>
			</div>
		</div>
		<div class="spacing-ruler" aria-label="Spacing scale">
			${[1, 2, 3, 4, 6, 8].map(n => html`
				<div>
					<i style=${styleMap({ inlineSize: 'var(--en-space-' + n + ')' })}></i>
					<small>${n}×</small>
				</div>
			`)}
		</div>
	`;
}
// example-end:rhythm

// example-start:buttons
export function buttonsExample() {
	return html`
		<div class="specimen-row">
			<en-button id="api-save-changes">Save changes</en-button>
			<en-button variant="secondary">Preview</en-button>
			<en-button variant="ghost">Cancel</en-button>
		</div>
		<div class="specimen-row">
			<en-button variant="danger">Delete layer</en-button>
			<en-button disabled>Unavailable</en-button>
			<en-button loading>Saving</en-button>
		</div>
	`;
}
// example-end:buttons

// example-start:command-surfaces
export function commandSurfacesExample() {
	const commands = [
		{ action: 'study.portrait', label: 'Portrait', keywords: ['tall', 'layout'], disabled: false },
		{ action: 'study.landscape', label: 'Landscape', keywords: ['wide', 'layout'], disabled: false },
		{ action: 'study.publish', label: 'Publish study', keywords: ['share'], disabled: true },
	];
	type Surface = HTMLElement & { open: boolean; updateComplete: Promise<unknown> };
	const execute = (action: string, origin: HTMLElement) => {
		const command = commands.find(command => command.action === action);
		const root = origin.closest<HTMLElement>('.command-surfaces-demo');
		if (!command || command.disabled || !root?.isConnected) return;
		const preview = root.querySelector<HTMLElement>('[data-command-preview]');
		const result = root.querySelector<HTMLElement>('[data-command-result]');
		if (!preview || !result) return;
		const landscape = action === 'study.landscape';
		preview.dataset.layout = landscape ? 'landscape' : 'portrait';
		preview.style.aspectRatio = landscape ? '8 / 5' : '4 / 5';
		result.textContent = `Preview layout: ${landscape ? 'Landscape' : 'Portrait'}.`;
	};
	const click = (action: string, event: Event) => {
		const origin = event.currentTarget as HTMLElement;
		queueMicrotask(() => { if (!event.defaultPrevented) execute(action, origin); });
	};
	const action = (event: Event) => {
		const surface = event.currentTarget as Surface;
		const origin = event.composedPath()[0] as HTMLElement | undefined;
		const direct = surface.localName === 'en-menu'
			? origin?.localName === 'en-menu-item' && origin.parentElement === surface
			: origin === surface;
		if (!direct || !event.cancelable || event.defaultPrevented) return;
		const proposed = (event as CustomEvent<{ action: string }>).detail.action;
		const command = commands.find(command => command.action === proposed);
		if (!command || command.disabled) { event.preventDefault(); return; }
		queueMicrotask(async () => {
			if (event.defaultPrevented || !surface.isConnected) return;
			try {
				// Allow a later listener to veto. The surface requests close only after dispatch.
				await surface.updateComplete;
				if (!event.defaultPrevented && surface.isConnected && !surface.open) execute(proposed, surface);
			} catch { /* A failed close never executes the application command. */ }
		});
	};
	return html`
		<div class="command-surfaces-demo">
			<en-stack gap="medium">
				<en-toolbar id="specimen-toolbar" label="Study layout actions">
					<en-button variant="secondary" @click=${(event: Event) => click('study.portrait', event)}>Portrait</en-button>
					<en-button variant="secondary" @click=${(event: Event) => click('study.landscape', event)}>Landscape</en-button>
				</en-toolbar>
				<div class="specimen-row">
					<en-button id="specimen-menu-trigger" variant="secondary">More layout actions<en-icon slot="suffix" name="chevron-down" size="inherit"></en-icon></en-button>
					<en-button id="specimen-command-trigger" variant="secondary">Search layout commands</en-button>
				</div>
				<p>Use any entry point to change the same preview. Publishing is unavailable in this local example.</p>
				<div data-command-preview data-layout="portrait" style=${styleMap({ inlineSize: 'min(100%, 16rem)', aspectRatio: '4 / 5', padding: 'var(--en-space-4)', border: 'var(--en-border-width) solid var(--en-color-boundary)', borderRadius: 'var(--en-radius-container)', background: 'var(--en-color-surface-subtle)', color: 'var(--en-color-text)' })}>Studio study</div>
				<p data-command-result role="status" aria-atomic="true">Preview layout: Portrait.</p>
			</en-stack>
			<en-menu id="specimen-menu" for="specimen-menu-trigger" label="Study layout actions" @en-action=${action}>
				<en-menu-item id="specimen-menu-item" action="study.portrait"><strong>Portrait</strong></en-menu-item>
				<en-menu-item action="study.landscape">Landscape</en-menu-item>
				<en-menu-item action="study.publish" disabled>Publish study</en-menu-item>
			</en-menu>
			<en-command-palette id="specimen-command-palette" for="specimen-command-trigger" label="Study commands"
				.searchLabel=${'Find a layout command'} placeholder="Try portrait, wide or publish"
				.emptyText=${'No matching layout commands.'} .closeLabel=${'Close study commands'}
				.commands=${commands} @en-action=${action}></en-command-palette>
		</div>
	`;
}
// example-end:command-surfaces

// example-start:mixed-toolbar
export function mixedToolbarExample() {
	const apply = (event: Event) => {
		const root = (event.currentTarget as HTMLElement).closest('.mixed-toolbar-demo');
		const title = root?.querySelector<HTMLElement & { value: string; reportValidity(): boolean }>('[data-study-title]');
		const format = root?.querySelector<HTMLElement & { value: string }>('[data-study-format]');
		const background = root?.querySelector<HTMLElement & { checked: boolean }>('[data-study-background]');
		const result = root?.querySelector<HTMLElement>('[data-study-result]');
		if (!title?.reportValidity() || !format || !background || !result) return;
		result.textContent = `${title.value}: ${format.value.toUpperCase()}, ${background.checked ? 'with' : 'without'} background. Preview settings applied locally.`;
	};
	return html`
		<div class="mixed-toolbar-demo">
			<style>
				.mixed-toolbar-demo { display:grid; gap:var(--en-space-4); }
				.mixed-toolbar-demo en-toolbar::part(base) { align-items:end; }
				.mixed-toolbar-demo en-text-field { flex:1 1 12rem; }
				.mixed-toolbar-demo en-select { flex:1 1 9rem; }
			</style>
			<p>Tab visits each control. Text editing, selection and checkbox keys belong to the controls; this group does not intercept them.</p>
			<en-toolbar id="specimen-mixed-toolbar" label="Study export controls" keyboard-navigation="tab">
				<en-text-field data-study-title label="Study title" value="Studio study" required></en-text-field>
				<en-select data-study-format label="Study output format" value="png">
					<en-select-option value="png">PNG</en-select-option>
					<en-select-option value="svg">SVG</en-select-option>
				</en-select>
				<en-checkbox data-study-background checked>Include study background</en-checkbox>
				<en-button @click=${apply}>Apply preview settings</en-button>
			</en-toolbar>
			<p data-study-result role="status">Edit the study settings, then apply them. No file is generated.</p>
			<p>Explicit tab navigation has labelled group semantics in the initial HTML. Button-only toolbars keep their arrow-key behavior in the default auto mode.</p>
		</div>
	`;
}
// example-end:mixed-toolbar

// example-start:menu-choices
export function menuChoicesExample() {
	type Choice = HTMLElement & { checked: boolean };
	const changed = (event: Event) => {
		const choice = event.composedPath()[0] as Choice;
		if (choice.localName !== 'en-menu-item' || (event as CustomEvent).detail?.reason !== 'checked') return;
		const root = choice.closest('.menu-choices-demo');
		if (root?.querySelector<Choice>('[data-hold-menu]')?.checked) { event.preventDefault(); return; }
		queueMicrotask(() => {
			if (event.defaultPrevented || !choice.isConnected) return;
			const background = root?.querySelector<Choice>('[data-menu-background]')?.checked;
			const layout = [...root!.querySelectorAll<Choice>('[data-menu-layout]')].find(item => item.checked)?.dataset.menuLayout;
			const preview = root?.querySelector<HTMLElement>('[data-menu-preview]');
			const result = root?.querySelector<HTMLElement>('[data-menu-result]');
			if (preview) { preview.style.aspectRatio = layout === 'landscape' ? '8 / 5' : '4 / 5'; preview.style.background = background ? 'var(--en-color-surface-subtle)' : 'transparent'; }
			if (result) result.textContent = `${layout === 'landscape' ? 'Landscape' : 'Portrait'} preview; background ${background ? 'included' : 'excluded'}.`;
		});
	};
	const exported = (event: Event) => {
		const item = event.composedPath()[0] as HTMLElement;
		if (item.localName !== 'en-menu-item') return;
		const action = (event as CustomEvent<{ action: string }>).detail.action;
		queueMicrotask(() => {
			if (event.defaultPrevented || !item.isConnected) return;
			const result = item.closest('.menu-choices-demo')?.querySelector<HTMLElement>('[data-menu-result]');
			if (result) result.textContent = `${action === 'export.svg' ? 'SVG' : 'PNG'} export requested locally. No file is generated.`;
		});
	};
	return html`
		<div class="menu-choices-demo">
			<en-stack gap="medium">
				<div class="specimen-row">
					<en-button id="menu-choices-trigger" variant="secondary">Preview options<en-icon slot="suffix" name="chevron-down" size="inherit"></en-icon></en-button>
					<en-checkbox data-hold-menu>Hold preview settings</en-checkbox>
				</div>
				<p>Choose a background and layout without closing the menu. Export opens a submenu. Touch or a narrow window uses one panel with Back; a roomy mouse or keyboard window uses a flyout. Resize while Export is open to compare. Arrow keys explore, Escape returns one level, and Tab leaves the menu.</p>
				<div data-menu-preview style="inline-size:min(100%,16rem);aspect-ratio:4/5;padding:var(--en-space-4);border:var(--en-border-width) solid var(--en-color-boundary);border-radius:var(--en-radius-container);background:var(--en-color-surface-subtle)">Studio study</div>
				<p data-menu-result role="status" aria-atomic="true">Portrait preview; background included.</p>
			</en-stack>
			<en-menu id="menu-choices" for="menu-choices-trigger" label="Preview options" @en-change=${changed} @en-action=${exported}>
				<en-menu-item id="menu-background-choice" type="checkbox" checked data-menu-background>Include background</en-menu-item>
				<hr role="separator">
				<en-menu-item type="radio" name="preview-layout" checked data-menu-layout="portrait">Portrait</en-menu-item>
				<en-menu-item type="radio" name="preview-layout" data-menu-layout="landscape">Landscape</en-menu-item>
				<hr role="separator">
				<en-menu-item id="menu-export-trigger">Export</en-menu-item>
				<en-menu for="menu-export-trigger" label="Export format">
					<en-menu-item action="export.png">PNG</en-menu-item>
					<en-menu-item action="export.svg">SVG</en-menu-item>
					<en-menu-item action="export.pdf" disabled>PDF (unavailable)</en-menu-item>
				</en-menu>
			</en-menu>
		</div>
	`;
}
// example-end:menu-choices

// example-start:button-scale
export function buttonScaleExample() {
	return html`
		<div class="specimen-row">
			<en-button size="small">Small</en-button>
			<en-button>Medium</en-button>
			<en-button size="large">Large</en-button>
		</div>
		<div class="specimen-row">
			<en-button variant="secondary">
				<en-icon slot="prefix" name="plus" size="inherit"></en-icon>Add layer
			</en-button>
			<en-link href="#fields">
				Explore form controls <en-icon name="arrow-right"></en-icon>
			</en-link>
			<en-button icon-only variant="secondary">
				<en-icon slot="prefix" name="plus" size="inherit"></en-icon>
				<span slot="label">Add collaborator</span>
			</en-button>
		</div>
	`;
}
// example-end:button-scale

// example-start:text-fields
export function textFieldsExample() {
	return html`
		<div id="external-field-example">
			<label class="en-label" for="example-project-code">Workspace</label>
			<en-text-field id="example-project-code" label="Project code" name="project-code" value="STUDIO"
				description="Click Workspace to focus this field. Its external and internal labels remain real label content."></en-text-field>
		</div>
		<en-text-field
			label="Project name"
			value="Studio studies"
		>
			<span slot="description">A name your <strong>collaborators</strong> will recognize. <a href="#review-notes">Review this field</a>.</span>
		</en-text-field>
		<en-text-field
			label="Contact email"
			type="email"
			value="hello@"
			error="Enter a complete email address."
		></en-text-field>
		<en-text-field
			label="Password"
			type="password"
			name="password"
			autocomplete="current-password"
			description="Try a sample password to see masked text."
			required
		></en-text-field>
	`;
}
// example-end:text-fields

// example-start:long-text-search
export function longTextSearchExample() {
	return html`
		<en-textarea
			label="Creative direction"
			value="Explore softer materials and a warmer palette."
			rows="3"
		>
			<span slot="description">A little context for the <em>next person</em>.</span>
		</en-textarea>
		<en-search-input
			label="Find an asset"
			placeholder="Search by name or tag"
		></en-search-input>
	`;
}
// example-end:long-text-search

// example-start:structured-values
export function structuredValuesExample() {
	return html`
		<en-select
			label="Export format"
			value="png"
			.items=${[
				{ value: 'png', label: 'PNG · Raster image' },
				{ value: 'svg', label: 'SVG · Vector image' },
				{ value: 'pdf', label: 'PDF · Document' },
			]}
		>
			<span slot="description"><strong>PNG</strong> suits raster previews; <strong>SVG</strong> keeps vector detail.</span>
		</en-select>
		<en-date-input label="Review date" value="2026-09-18"></en-date-input>
	`;
}
// example-end:structured-values

// example-start:combobox
export function comboboxExample() {
	const projects = [
		{ value: 'studio-north', label: 'Studio North' },
		{ value: 'studio-south', label: 'Studio South' },
		{ value: 'brand-system', label: 'Brand system' },
		{ value: 'film-titles', label: 'Film titles' },
		{ value: 'archive', label: 'Archive — unavailable', disabled: true },
		{ value: 'collaboration', label: 'Experiments in creative collaboration across teams' },
	];
	const setScenario = (root: Element, scenario: string) => {
		const picker = root.querySelector('en-combobox') as HTMLElement & { loading: boolean; loadError: string };
		picker.loading = scenario === 'loading';
		picker.loadError = scenario === 'failed' ? 'Projects could not be loaded. Use Retry to try again.' : '';
		root.querySelector<HTMLElement>('[data-retry]')!.hidden = scenario !== 'failed';
	};
	const changeScenario = (event: CustomEvent<{ proposed: string }>) => {
		const field = event.currentTarget as HTMLElement & { value: string };
		const proposed = event.detail.proposed;
		if (event.composedPath()[0] !== field) return;
		// Observe after every synchronous listener has had a chance to reject or replace the value.
		queueMicrotask(() => {
			if (event.defaultPrevented || !field.isConnected || field.value !== proposed) return;
			setScenario(field.closest('.combobox-example')!, proposed);
		});
	};
	const retry = (event: Event) => {
		const root = (event.currentTarget as Element).closest('.combobox-example')!;
		setScenario(root, 'ready');
		(root.querySelector('en-select') as HTMLElement & { value: string }).value = 'ready';
		(root.querySelector('en-combobox') as HTMLElement).focus();
	};
	const submit = (event: SubmitEvent) => {
		event.preventDefault();
		const form = event.currentTarget as HTMLFormElement;
		const id = new FormData(form).get('project');
		form.querySelector('output')!.textContent = `Submitted project: ${id}`;
	};
	const requestSubmit = (event: Event) => (event.currentTarget as Element).closest('form')!.requestSubmit();
	return html`
		<div class="combobox-example">
			<form @submit=${submit}>
				<en-combobox name="project" value="studio-north" .items=${projects} required>
					<span slot="label">Project</span>
					<span slot="description">Type to filter, then choose a project. Escape or leaving the field restores your current selection.</span>
				</en-combobox>
				<en-button @click=${requestSubmit}>Use project</en-button>
				<output role="status">No project submitted yet.</output>
			</form>
			<details>
				<summary>Try suggestion states</summary>
				<en-select label="Suggestion state" value="ready"
					.items=${[{ value: 'ready', label: 'Ready' }, { value: 'loading', label: 'Loading' }, { value: 'failed', label: 'Failed' }]}
					@en-change=${changeScenario}
				></en-select>
				<en-button data-retry hidden variant="secondary" @click=${retry}>Retry</en-button>
				<p>These states are simulated locally. Try a query with no matches to review the empty state.</p>
			</details>
		</div>
	`;
}
// example-end:combobox

// example-start:file-upload
export { fileUploadExample };
// example-end:file-upload

// example-start:precision
export function precisionExample() {
	return html`
		<en-number-field
			label="Corner radius"
			description="Adjust with buttons, arrow keys, or an exact value."
			value="12"
			min="0"
			max="48"
			step="1"
		></en-number-field>
		<en-text-field
			label="Shared workspace"
			value="Design library"
			disabled
		></en-text-field>
	`;
}
// example-end:precision

// example-start:color-slider
export function colorSliderExample() {
  return html`<en-color-slider label="Alpha" min="0" max="100" value="60" editable show-value checkerboard .stops=${['#33669900','#336699']}></en-color-slider>
    <p>A native range handle over a configurable color gradient. Use the exact-value field or keyboard arrows to adjust it.</p>`;
}
// example-end:color-slider

// example-start:color-wheel
export function colorWheelExample() {
  return html`<en-color-wheel label="Accent hue" value="#5577cc"></en-color-wheel>`;
}
// example-end:color-wheel

// example-start:color-plane
export function colorPlaneExample() {
  return html`<en-color-plane label="Accent color" value="#5577cc" alpha></en-color-plane>
    <p>Drag to choose saturation and value. Hue, saturation, value and alpha also have labeled sliders and exact numeric inputs. Escape cancels a drag.</p>`;
}
// example-end:color-plane

// example-start:color-picker
export function colorPickerExample() {
  return html`<en-color-spaces-demo></en-color-spaces-demo><h2>sRGB baseline</h2><en-color-picker id="basic-color-picker" label="Accent color" value="#336699"></en-color-picker>
    <p>Adjust the labeled RGB sliders, or enter a three- or six-digit hex color and press Enter. Choose HEX, RGB or HSL; enable Alpha to adjust transparency. Applications can supply palette and recent-color controls through slots.</p>`;
}
// example-end:color-picker

// example-start:color-field
export function colorFieldExample() {
	const updateSample = (event: Event) => {
		const field = event.currentTarget as HTMLElement & { value: string };
		const proposed = (event as CustomEvent<{ proposed: string }>).detail.proposed;
		if (event.composedPath()[0] !== field) return;
		queueMicrotask(() => {
			if (event.defaultPrevented || !field.isConnected || field.value !== proposed) return;
			const example = field.closest('.color-field-example');
			const swatch = example?.querySelector<HTMLElement & { color: string }>('en-swatch');
			const value = example?.querySelector('output');
			if (swatch) swatch.color = proposed;
			if (value) value.textContent = proposed;
		});
	};
	return html`
		<div class="color-field-example">
			<div class="color-trigger-preview">
				<en-swatch id="project-accent-swatch" color="#2457d6" label="Choose project accent color"></en-swatch>
				<output aria-label="Accepted project accent color">#2457d6</output>
			</div>
			<en-color-field
				for="project-accent-swatch"
				label="Project accent color"
				value="#2457d6"
				description="Choose a color with the sample or the native color control."
				@en-change=${updateSample}
			></en-color-field>
		</div>
		<p>The field owns the value. This example updates the separate swatch after an accepted change.</p>
	`;
}
// example-end:color-field

// example-start:checkboxes-switches
export function checkboxesSwitchesExample() {
	return html`
		<div class="choice-stack">
			<en-checkbox checked>
				<span slot="label">Include source files</span>
				<span slot="description">Keep <strong>editable layers</strong> with the export.</span>
			</en-checkbox>
			<en-checkbox>Notify collaborators</en-checkbox>
			<en-checkbox disabled>Locked by workspace</en-checkbox>
			<en-switch checked>
				<span slot="label">Live preview</span>
				<span slot="description">Show changes <em>as you work</em>.</span>
			</en-switch>
			<en-switch>Reduce canvas detail</en-switch>
			<div id="external-choice-example">
				<label class="en-label" for="example-include-drafts">Asset review</label>
				<en-checkbox id="example-include-drafts" label="Include draft assets" name="include-drafts" value="yes"
					description="Click Asset review to activate this checkbox through its external label."></en-checkbox>
			</div>
		</div>
	`;
}
// example-end:checkboxes-switches

// example-start:radio-group
export function radioGroupExample() {
	return html`
		<en-radio-group label="Export quality" value="balanced">
			<span slot="description">Balance <strong>file size</strong> and detail.</span>
			<en-radio value="small">Smaller file</en-radio>
			<en-radio value="balanced" checked>Balanced</en-radio>
			<en-radio value="best" description="Larger exports.">Highest quality</en-radio>
		</en-radio-group>
	`;
}
// example-end:radio-group

// example-start:opacity
export function opacityExample() {
	const updatePreview = (event: Event) => {
		const slider = event.currentTarget as HTMLElement & { value: number };
		const proposed = (event as CustomEvent<{ proposed: number }>).detail.proposed;
		if (event.composedPath()[0] !== slider) return;
		queueMicrotask(() => {
			if (event.defaultPrevented || !slider.isConnected || slider.value !== proposed) return;
			const sample = slider.nextElementSibling?.querySelector<HTMLElement>('.opacity-sample');
			if (sample) sample.style.opacity = String(proposed / 100);
		});
	};
	return html`
		<en-slider
			label="Layer opacity"
			value="64"
			min="0"
			max="100"
			step="1"
			editable
			@en-change=${updatePreview}
		>
			<span slot="label">Layer opacity</span>
			<span slot="description">Enter an exact value, then press <kbd>Enter</kbd> or leave the field to apply. <kbd>Escape</kbd> restores the current value.</span>
		</en-slider>
		<div class="opacity-preview">
			<span class="opacity-sample" aria-hidden="true" style="opacity:0.64"></span>
			<span>Layer opacity preview</span>
		</div>
	`;
}
// example-end:opacity

// example-start:vertical-slider
export function verticalSliderExample() {
	return html`
		<en-slider orientation="vertical" value="32" min="1" max="96" step="1" editable>
			<span slot="label">Brush size</span>
			<span slot="description">Size in pixels. Move upward to increase, or enter an exact value below.</span>
		</en-slider>
	`;
}
// example-end:vertical-slider

// example-start:rating
export function ratingExample() {
	return html`
		<en-rating value="3" max="5">
			<span slot="label">How useful is this concept?</span>
			<span slot="description">Choose <strong>No rating</strong> to clear the value.</span>
		</en-rating>
	`;
}
// example-end:rating

// example-start:tree-view
// guard() applies this seed once per mounted example; later expansion belongs to the tree.
const treeInitialExpansion = Object.freeze(['project', 'artwork']);

export function treeViewExample() {
	type TreeState = { value: string; expanded: readonly string[] };
	type TreeElement = HTMLElement & TreeState;
	const descriptions: Record<string, string> = {
		project: 'Studio study contains artwork and project notes.',
		artwork: 'Artwork groups the cover, accent and caption layers.',
		cover: 'Cover is the main composition for this study.',
		accent: 'Accent adds a small highlight to the composition.',
		caption: 'Caption provides the study’s supporting text.',
		notes: 'Project notes record the next review decisions.',
	};
	const changed = (event: Event) => {
		const tree = event.currentTarget as TreeElement;
		if (event.composedPath()[0] !== tree || !event.cancelable) return;
		const root = tree.closest('.tree-view-demo');
		const detail = (event as CustomEvent<{ proposed: TreeState; reason: 'selection' | 'expansion' }>).detail;
		const guard = root?.querySelector<HTMLElement & { checked: boolean }>('[data-lock-selection]');
		const result = root?.querySelector<HTMLElement>('[data-tree-result]');
		if (detail.reason === 'selection' && guard?.checked) {
			event.preventDefault();
			if (result) result.textContent = 'Selection kept by the application. Focus and expansion remain available.';
			return;
		}
		// Read the committed public state after every synchronous consumer has had a say.
		queueMicrotask(() => {
			if (event.defaultPrevented || !tree.isConnected || tree.value !== detail.proposed.value) return;
			const summary = root?.querySelector<HTMLElement>('[data-tree-details]');
			if (summary) summary.textContent = descriptions[tree.value] ?? 'Choose a project item to see its details.';
			if (result) result.textContent = detail.reason === 'selection' ? `Selected ${tree.value}.` : 'Project outline expansion updated.';
		});
	};
	const toggleCaption = (event: Event) => {
		const root = (event.currentTarget as HTMLElement).closest('.tree-view-demo');
		const branch = root?.querySelector('en-tree-item[value="artwork"]');
		const caption = branch?.querySelector('en-tree-item[value="caption"]');
		if (!branch) return;
		if (caption) {
			const tree = root?.querySelector<TreeElement>('en-tree');
			// A data edit is application-owned, so reconcile the details and selection explicitly.
			if (tree?.value === 'caption') {
				tree.value = 'cover';
				const summary = root?.querySelector<HTMLElement>('[data-tree-details]');
				if (summary) summary.textContent = descriptions.cover;
			}
			caption.remove();
		} else {
			const restored = branch.ownerDocument.createElement('en-tree-item');
			restored.slot = 'children'; restored.setAttribute('value', 'caption'); restored.setAttribute('label', 'Caption');
			branch.append(restored);
		}
		const result = root?.querySelector<HTMLElement>('[data-tree-result]');
		if (result) result.textContent = caption ? 'Caption removed from the local outline.' : 'Caption restored to the local outline.';
	};
	return html`
		<div class="tree-view-demo">
			<style>
				.tree-view-demo { display:grid; gap:var(--en-space-4); min-inline-size:0; container:en-tree-demo / inline-size; }
				.tree-view-demo__panels { display:grid; grid-template-columns:minmax(0,1fr); gap:var(--en-space-4); align-items:start; }
				.tree-view-demo__details { display:grid; gap:var(--en-space-3); padding:var(--en-space-4); border:var(--en-border-width) solid var(--en-color-boundary); border-radius:var(--en-radius-control); }
				.tree-view-demo__details :is(h4,p) { margin:0; }
				.tree-view-demo__keys { display:grid; grid-template-columns:minmax(0,auto) minmax(0,1fr); gap:var(--en-space-3); margin:0; }
				.tree-view-demo__keys dt { font-weight:var(--en-font-label-strong-weight); }
				.tree-view-demo__keys dd { margin:0; }
				@container en-tree-demo (min-width:32rem) {
					.tree-view-demo__panels { grid-template-columns:repeat(2,minmax(0,1fr)); }
					.tree-view-demo__panels > en-tree { grid-column:1; grid-row:1 / span 2; }
					.tree-view-demo__panels > section { grid-column:2; }
				}
			</style>
			<p>Explore a project’s layers with the arrow keys. Enter or Space selects the focused item; expanding a branch does not select it.</p>
			<div class="tree-view-demo__panels">
				<en-tree id="specimen-tree" label="Project outline" value="cover" .expanded=${guard([], () => treeInitialExpansion)} @en-change=${changed}>
					<en-tree-item value="project" label="Studio study">
						<en-tree-item slot="children" value="artwork" label="Artwork">
							<en-tree-item id="specimen-tree-item" slot="children" value="cover"><span slot="label">Cover</span></en-tree-item>
							<en-tree-item slot="children" value="accent" label="Accent"></en-tree-item>
							<en-tree-item slot="children" value="caption" label="Caption"></en-tree-item>
						</en-tree-item>
						<en-tree-item slot="children" value="notes" label="Project notes"></en-tree-item>
					</en-tree-item>
				</en-tree>
				<section class="tree-view-demo__details" aria-label="Selected project item">
					<h4>Item details</h4>
					<p data-tree-details>Cover is the main composition for this study.</p>
					<p>These are local review fixtures. Selection does not save or load a remote project.</p>
				</section>
				<section class="tree-view-demo__details" aria-label="Tree keyboard interactions">
					<h4>Keyboard interactions</h4>
					<dl class="tree-view-demo__keys">
						<dt>Tab / Shift+Tab</dt><dd>Enter or leave the tree as one Tab stop. Within the tree, use the arrow keys.</dd>
						<dt>Down / Up</dt><dd>Focus the next or previous visible item, without wrapping at either end.</dd>
						<dt>Home / End</dt><dd>Focus the first or last visible item.</dd>
						<dt>Right</dt><dd>Open a closed branch, or focus its first child when already open. Reversed in right-to-left layouts.</dd>
						<dt>Left</dt><dd>Close an open branch, or focus its parent. Reversed in right-to-left layouts.</dd>
						<dt>Enter / Space</dt><dd>Select the focused item. Selection does not change expansion.</dd>
						<dt>Type letters</dt><dd>Find a visible item by the start of its label. Repeat a letter to cycle through matching items.</dd>
					</dl>
					<p>Moving focus does not select an item. Disabled items remain discoverable but cannot be selected or expanded.</p>
					<p>Browser and application Ctrl, Option/Alt and Command shortcuts, and text composition, keep their normal behavior.</p>
				</section>
			</div>
			<en-checkbox data-lock-selection>Keep the current selection<span slot="description">Reject selection with preventDefault(); expansion and keyboard focus remain independent.</span></en-checkbox>
			<div class="specimen-row"><en-button variant="secondary" @click=${toggleCaption}>Remove or restore Caption</en-button></div>
			<p data-tree-result role="status">Cover selected. Artwork is expanded.</p>
		</div>
	`;
}
// example-end:tree-view

// example-start:composable-chat
export function composableChatExample(){return html`<en-composable-chat-demo></en-composable-chat-demo>`;}
// example-end:composable-chat

// example-start:rich-text
export { richTextExample };
// example-end:rich-text

// example-start:carousel
export { carouselExample };
// example-end:carousel

// example-start:presence-activity
export { presenceActivityExample };
// example-end:presence-activity

// example-start:chat-patterns
export { chatPatternsExample };
// example-end:chat-patterns

// example-start:toast
export { toastExample };
// example-end:toast

// example-start:multi-step
export { multiStepExample };
// example-end:multi-step

// example-start:calendar
export { calendarExample };
// example-end:calendar

// example-start:tree-data
export { treeDataExample };
// example-end:tree-data

// example-start:native-navigation
export function nativeNavigationExample() {
	return html`
		<en-navigation label="Explore related patterns">
			<a href="#fields">Fields</a>
			<a href="#choices">Selection</a>
			<a href="#overlays">Overlays</a>
		</en-navigation>
		<p>These are ordinary links: Tab moves between them, Enter follows a destination, and your browser owns history and opening another tab.</p>
		<p>The page’s navigation uses the same element with <code>sticky</code> and the optional <code>attachAnchorNavigation</code> adapter. Its skip link appears on keyboard focus.</p>
	`;
}
// example-end:native-navigation

// example-start:pagination
/** Each rendered example owns its data and reacts only to accepted pagination. */
class PaginationDemo extends AsyncDirective {
	private page = 1;
	private unknownPage = 1;
	private hold = false;
	private status = 'Showing studies 1–3. Choose another page.';
	private unknownStatus = 'First batch loaded. The total is not yet known.';
	private readonly studies = Array.from({ length: 36 }, (_, index) => `Project study ${String(index + 1).padStart(2, '0')}`);

	private change(event: Event, unknown: boolean) {
		const pager = event.currentTarget as HTMLElement & { page: number };
		if (event.composedPath()[0] !== pager || !event.cancelable || event.defaultPrevented) return;
		const proposed = (event as CustomEvent<{ proposed: number }>).detail.proposed;
		if (!unknown && this.hold) {
			event.preventDefault();
			this.status = `Page ${this.page} retained. The application canceled this change.`;
			this.setValue(this.render());
			return;
		}
		queueMicrotask(() => {
			if (!this.isConnected || !pager.isConnected || event.defaultPrevented || pager.page !== proposed) return;
			if (unknown) {
				this.unknownPage = proposed;
				this.unknownStatus = proposed === 3 ? 'Batch 3 loaded. The application reports no further batch.' : `Batch ${proposed} loaded. Another batch is available.`;
			} else {
				this.page = proposed;
				this.status = `Page ${proposed} of 12. Showing studies ${(proposed - 1) * 3 + 1}–${proposed * 3}.`;
			}
			this.setValue(this.render());
		});
	}
	private holdChanged(event: Event) {
		const field = event.currentTarget as HTMLElement & { checked: boolean };
		if (event.composedPath()[0] !== field || !event.cancelable || event.defaultPrevented) return;
		const proposed = (event as CustomEvent<{ proposed: boolean }>).detail.proposed;
		queueMicrotask(() => {
			if (!this.isConnected || !field.isConnected || event.defaultPrevented || field.checked !== proposed) return;
			this.hold = proposed; this.setValue(this.render());
		});
	}
	render() {
		const first = (this.page - 1) * 3;
		return html`
			<en-stack>
				<p>Choose a page of local studies. The application owns these records; the pagination control owns its navigation controls and current page.</p>
				<ol start=${first + 1} aria-label="Project studies">${this.studies.slice(first, first + 3).map(study => html`<li>${study}</li>`)}</ol>
				<en-pagination id="api-pagination" label="Project study pages" .page=${this.page} .pageCount=${12}
					@en-change=${(event: Event) => this.change(event, false)}></en-pagination>
				<en-checkbox .checked=${this.hold} @en-change=${(event: Event) => this.holdChanged(event)}>Hold current page</en-checkbox>
				<p role="status" aria-label="Project page result">${this.status}</p>
				<section aria-label="Intermediate pagination layout" style="inline-size:min(100%,36em)">
					<h3>Intermediate width</h3>
					<p>This container keeps first, current and last pages visible between the wide and compact layouts.</p>
					<en-pagination id="api-pagination-intermediate" label="Intermediate example pages" page="6" page-count="40"></en-pagination>
				</section>
				<section aria-label="Mobile pagination layout" style="inline-size:min(100%,24em)">
					<h3>Mobile width</h3>
					<p>This narrow container shows the compact layout even on desktop. Try Previous, Next and the page chooser without resizing your browser.</p>
					<en-pagination id="api-pagination-mobile" label="Mobile example pages" page="6" page-count="40"></en-pagination>
				</section>
				<details>
					<summary>Customize alignment and button distribution</summary>
					<p>Expanded layouts center the controls by default; compact layouts keep natural-sized arrows at the edges. Use the alignment token for start or end alignment, or CSS Parts to distribute the buttons yourself.</p>
					<style>
						.pagination-start { --en-pagination-align: start; }
						.pagination-distributed::part(previous) { margin-inline-end: auto; }
						.pagination-distributed::part(next) { margin-inline-start: auto; }
					</style>
					<en-pagination class="pagination-start" label="Start aligned example pages" page="6" page-count="40"></en-pagination>
					<en-pagination class="pagination-distributed" label="Distributed example pages" page="6" page-count="40"></en-pagination>
					<p>The actions, pages and middle parts expose the layout groups. Previous, next, direct-summary, compact-status and expanded-status allow focused overrides. Preserve visual and keyboard order when customizing.</p>
				</details>
				<details>
					<summary>Customize the navigation icons or text</summary>
					<p>The previous and next slots replace the button contents. Accessible names remain independently localizable; use noninteractive slot content.</p>
					<style>
						.pagination-previous-icon { rotate: 90deg; }
						.pagination-next-icon { rotate: -90deg; }
						.pagination-previous-icon:dir(rtl) { rotate: -90deg; }
						.pagination-next-icon:dir(rtl) { rotate: 90deg; }
					</style>
					<en-pagination id="api-pagination-slotted" label="Slotted icon example pages" page="6" page-count="40">
						<en-icon slot="previous" name="chevron-down" class="pagination-previous-icon" aria-hidden="true"></en-icon>
						<en-icon slot="next" name="chevron-down" class="pagination-next-icon" aria-hidden="true"></en-icon>
					</en-pagination>
					<en-pagination label="Text slot example pages" page="6" page-count="40">
						<span slot="previous">Previous</span>
						<span slot="next">Next</span>
					</en-pagination>
				</details>
				<details>
					<summary>Try an unknown total</summary>
					<p>This local fixture has three batches. It omits the total and updates hasNext after each accepted request. In an application, fetching and announcing results remain application responsibilities.</p>
					<en-pagination id="api-pagination-unknown" label="Study batch pages" .page=${this.unknownPage} .pageCount=${0}
						.hasNext=${this.unknownPage < 3} @en-change=${(event: Event) => this.change(event, true)}></en-pagination>
					<p role="status" aria-label="Batch result">${this.unknownStatus}</p>
				</details>
			</en-stack>
		`;
	}
}
const paginationDemo = directive(PaginationDemo);
export function paginationExample() {
	return html`${paginationDemo()}`;
}
// example-end:pagination

// example-start:breadcrumbs
export function breadcrumbsExample() {
	return html`
		<en-breadcrumbs label="Pattern location">
			<a href="#sheet">Sticker sheet</a>
			<span aria-current="location">Navigation patterns</span>
		</en-breadcrumbs>
		<p>Follow the links to earlier locations in the path. The consuming page supplies native links and marks the current location with <code>aria-current</code>.</p>
	`;
}
// example-end:breadcrumbs

// example-start:tabs
export function tabsExample() {
	return html`
		<en-tabs label="Inspector sections" value="design">
			<en-tab
				slot="tab"
				value="design"
				id="inspector-tab-design"
				role="tab"
				aria-selected="true"
				aria-controls="inspector-panel-design"
				tabindex="0"
			>Design</en-tab>
			<en-tab
				slot="tab"
				value="layout"
				id="inspector-tab-layout"
				role="tab"
				aria-selected="false"
				aria-controls="inspector-panel-layout"
				tabindex="-1"
			>Layout</en-tab>
			<en-tab
				slot="tab"
				value="export"
				id="inspector-tab-export"
				role="tab"
				aria-selected="false"
				aria-controls="inspector-panel-export"
				tabindex="-1"
			>Export</en-tab>
			<en-tab-panel
				slot="panel"
				value="design"
				id="inspector-panel-design"
				role="tabpanel"
				aria-labelledby="inspector-tab-design"
				tabindex="0"
			>
				<p>Appearance and material choices.</p>
				<en-checkbox checked>Preserve proportions</en-checkbox>
			</en-tab-panel>
			<en-tab-panel
				slot="panel"
				value="layout"
				id="inspector-panel-layout"
				role="tabpanel"
				aria-labelledby="inspector-tab-layout"
				tabindex="0"
				hidden
			>
				<p>Spacing, alignment, and layout constraints.</p>
			</en-tab-panel>
			<en-tab-panel
				slot="panel"
				value="export"
				id="inspector-panel-export"
				role="tabpanel"
				aria-labelledby="inspector-tab-export"
				tabindex="0"
				hidden
			>
				<p>Choose a format and prepare the handoff.</p>
			</en-tab-panel>
		</en-tabs>
	`;
}
// example-end:tabs

// example-start:accordion
export function accordionExample() {
	return html`
		<en-accordion multiple .value=${['layout']}>
			<en-accordion-item value="layout" label="Layout" open>
				<p>Keep a predictable rhythm between related controls.</p>
			</en-accordion-item>
			<en-accordion-item value="appearance" label="Appearance">
				<p>Color, border, and corner settings stay individually adjustable.</p>
			</en-accordion-item>
			<en-accordion-item value="advanced" label="Advanced">
				<p>Extra detail is available when the task calls for it.</p>
			</en-accordion-item>
		</en-accordion>
	`;
}
// example-end:accordion

// example-start:data-table
// Include tableStyles/table.css in the authored table's root. en-data-table includes it internally.
type StudyRecord={id:string;number:number;name:string;kind:string;notes:string};
class DataTableComparison extends AsyncDirective {
  private root?:HTMLElement;
  private records:StudyRecord[]=Array.from({length:1000},(_,index)=>({id:`study-${index+1}`,number:index+1,name:`Study ${String(index+1).padStart(4,'0')}`,kind:index%3?'Image':'Document',notes:index%4?'Ready for review.':'A longer description that wraps when space becomes limited or the text size changes.'}));
  private key=(row:StudyRecord)=>row.id;
  private rowLabel=(row:StudyRecord)=>row.name;
  private selected:readonly string[]=[];
  private sort:TableSort={column:'name',direction:'ascending'};
  private mode:TableMode='paginated';
  private locked=false;
  private images=false;
  private roomy=false;
  private sheet?:CSSStyleSheet;
  private message='Both approaches use the same records, columns and keyed selection.';
  private columns:readonly TableColumn<StudyRecord>[]=[
    {key:'name',label:'Study',rowHeader:true,compare:(a,b)=>a.number-b.number,renderCell:row=>html`<strong>${row.name}</strong><p style="font-weight:normal;margin-block:.5rem">${row.notes}</p>`},
    {key:'kind',label:'Kind',width:'22%',renderCell:row=>html`<en-badge>${row.kind}</en-badge>`},
    {key:'open',label:'Action',width:'8rem',renderCell:row=>html`<en-button size="small" variant="ghost" @click=${()=>{this.message=`Opened ${row.name}. This action belongs to the application.`;this.refresh();}}>Open<span style="position:absolute;inline-size:1px;block-size:1px;overflow:hidden;clip-path:inset(50%)"> ${row.name}</span></en-button>`},
  ];
  private composedColumns:readonly TableColumn<StudyRecord>[]=[{key:'selection',label:'Selection',headerLabelHidden:true,width:'4.5rem',renderCell:row=>html`<en-checkbox class="table-choice" label=${`Select ${row.name}`} .checked=${this.selected.includes(row.id)} @en-change=${(event:CustomEvent<{proposed:boolean}>)=>{if(this.locked){event.preventDefault();return;}queueMicrotask(()=>{if(!event.defaultPrevented){this.selected=event.detail.proposed?[...this.selected,row.id]:this.selected.filter(key=>key!==row.id);this.refresh();}});}}></en-checkbox>`},...this.columns];
  private model=new TableModel({items:this.records,columns:this.composedColumns,key:this.key,pageSize:10,mode:'paginated',sort:this.sort});
  private connect=(node:Element|undefined)=>{this.root=node as HTMLElement|undefined;};
  private get table(){return this.root?.querySelector<EnDataTable<StudyRecord>>('#records-table');}
  private refresh(){if(this.isConnected)this.setValue(this.render());}
  protected override disconnected(){if(this.sheet&&this.root){const doc=this.root.ownerDocument;doc.adoptedStyleSheets=doc.adoptedStyleSheets.filter(sheet=>sheet!==this.sheet);}this.sheet=undefined;}
  private accept=(event:CustomEvent)=>{
    if(this.locked){event.preventDefault();this.message='The application canceled the change.';this.refresh();return;}
    queueMicrotask(()=>{if(!this.isConnected||event.defaultPrevented)return;
      // Read the complete settled snapshot: a listener may have accepted a
      // nested action before this microtask. Do not reapply stale sibling state.
      this.selected=this.table?.selectedKeys??[];
      this.sort=this.table?.sort??this.sort;this.model.setSort(this.sort);
      this.message=`${this.selected.length} selected. Sort: ${this.sort.direction}.`;this.refresh();
    });
  };
  private geometry=()=>{
    if(!this.root)return;
    const doc=this.root.ownerDocument;this.roomy=!this.roomy;
    if(!this.sheet){this.sheet=new CSSStyleSheet();doc.adoptedStyleSheets=[...doc.adoptedStyleSheets,this.sheet];}
    this.sheet.replaceSync(`[data-table-demo] en-data-table { --en-table-cell-block-padding:${this.roomy?'1.75rem':'.5rem'}; }`);
    // CSSOM replacement does not emit a MutationObserver record. Explicitly
    // invalidate unseen estimates while retaining the visible key and focus.
    this.table?.invalidateMeasurements();this.message='CSSOM density changed; row measurements invalidated explicitly.';this.refresh();
  };
  override render(){return html`<section data-table-demo ${ref(this.connect)}>
    <style>
      [data-table-demo]{display:grid;gap:var(--en-space-4)}
      [data-table-demo] .choices{display:flex;flex-wrap:wrap;align-items:end;gap:var(--en-space-3)}
      [data-table-demo] en-data-table{--en-data-table-viewport-size:24rem}
      [data-table-demo] en-table::part(viewport){max-block-size:24rem}
      [data-table-demo] table{table-layout:fixed}
      [data-table-demo] .table-choice::part(label-text){display:none}
      [data-table-demo] p{margin-block:var(--en-space-2);line-height:1.5}
      [data-table-demo] .visually-hidden{position:absolute;inline-size:1px;block-size:1px;overflow:hidden;clip-path:inset(50%)}
    </style>
    <h3>Records and columns</h3>
    <p>The optional data element owns selection controls, sorting, pagination and virtual-row wiring. Cell rendering and application decisions remain yours. Compare the same columns and selection with the composed route below.</p>
    <div class="choices">
      <en-select label="Delivery" .value=${this.mode} .items=${[{value:'paginated',label:'Paginated reading'},{value:'windowed',label:'Virtual window'},{value:'all',label:'Complete table'}]} @en-change=${(e:CustomEvent<{proposed:TableMode}>)=>queueMicrotask(()=>{if(!e.defaultPrevented){this.mode=e.detail.proposed;this.refresh();}})}></en-select>
      <en-checkbox .checked=${this.images} @en-change=${(e:CustomEvent<{proposed:boolean}>)=>queueMicrotask(()=>{if(!e.defaultPrevented){this.images=e.detail.proposed;this.model.setFilter(this.images?row=>row.kind==='Image':undefined);this.refresh();}})}>Images only</en-checkbox>
      <en-checkbox .checked=${this.locked} @en-change=${(e:CustomEvent<{proposed:boolean}>)=>queueMicrotask(()=>{if(!e.defaultPrevented){this.locked=e.detail.proposed;this.refresh();}})}>Prevent selection and sorting</en-checkbox>
    </div>
    <p>Virtual mode mounts only a window of records. Choose Paginated reading for continuous traversal of each page, browser Find and printing. The recorded VoiceOver traversal issue remains under investigation.</p>
    <en-data-table id="records-table" label="Project studies" selection="multiple" page-size="10" .items=${this.records} .columns=${this.columns} .getKey=${this.key} .rowLabel=${this.rowLabel} .selectedKeys=${this.selected} .sort=${this.sort} .mode=${this.mode} .filter=${this.images?this.imageFilter:undefined} @en-selection-change=${this.accept} @en-sort=${this.accept}></en-data-table>
    <div class="choices"><en-button variant="secondary" @click=${()=>{const found=this.table?.scrollToKey('study-901',{block:'start',container:'nearest'});this.message=found?'Reveal requested for Study 0901. Focus and selection are unchanged.':'Study not in the filtered collection.';this.refresh();}}>Show Study 0901</en-button><en-button variant="secondary" @click=${this.geometry}>Change CSSOM density</en-button></div>
    <p role="status">${this.message}</p>
    <details><summary>Compare the authored helper route</summary>
      <p>This table uses the same cell definitions and selection, with TableModel and native markup. The application supplies checkbox wiring, paging and structure. Use this route for grouped/spanning headers, custom row sections or a framework that owns its cells.</p>
      <en-table label="Composed studies"><table aria-rowcount=${this.model.rowCount()}><caption>Composed studies · first page</caption>${tableColgroup(this.composedColumns)}<thead>${tableHeader(this.composedColumns,{sort:this.sort,onSort:sort=>{if(this.locked){this.message='The application canceled sorting.';}else{this.sort=sort;this.model.setSort(sort);}this.refresh();}})}</thead><tbody>${tableRows(this.model,this.composedColumns,{rowSelected:row=>this.selected.includes(row.id)})}</tbody></table></en-table>
      <p><a href="/api-examples/virtual-collection?progress-report">Full composed virtual collection lab</a> · <a href="/api-reference?component=en-data-table&progress-report">Data table API</a></p>
    </details>
  </section>`;}
  private imageFilter=(row:StudyRecord)=>row.kind==='Image';
}
const dataTableComparison=directive(DataTableComparison);
export function dataTableExample(){return html`${dataTableComparison()}`;}
// example-end:data-table

// example-start:split-view
/** Application-owned responsive composition; pane nodes and state survive resizing. */
class SplitWorkspaceDemo extends AsyncDirective {
  private narrow=false;
  private locked=false;
  private result='Pane visibility is independent of its expanded size.';
  private root?: HTMLElement;
  private media?: MediaQueryList;
  private connect=(node:Element|undefined)=>{this.root=node as HTMLElement|undefined;if(node)queueMicrotask(()=>{if(this.isConnected)this.observe();});};
  protected override disconnected(){this.media?.removeEventListener('change',this.resize);}
  protected override reconnected(){this.observe();}
  private refresh(){if(this.isConnected)this.setValue(this.render());}
  private resize=()=>{const narrow=this.media?.matches??false;if(narrow!==this.narrow){this.narrow=narrow;this.refresh();}};
  private observe(){this.media?.removeEventListener('change',this.resize);this.media=this.root?.ownerDocument.defaultView!.matchMedia('(max-width:48rem)');this.media?.addEventListener('change',this.resize);this.resize();}
  private visibility=(event:CustomEvent<{previous:string;proposed:string}>)=>{
    // Nested split views bubble independently. Applications may veto synchronously.
    if(this.locked){event.preventDefault();this.result='Visibility change canceled. Both pane content and size are preserved.';}
    else this.result=event.detail.proposed==='none'?'Pane restored to its retained size.':'Pane collapsed; its content stays mounted.';
    this.refresh();
  };
  override render(){return html`<section data-split-workspace ${ref(this.connect)}><style>
    [data-split-workspace]{display:block;min-inline-size:0}
    [data-split-workspace] .workspace{block-size:30rem;min-inline-size:0}
    [data-split-workspace] .workspace.narrow{block-size:48rem}
    [data-split-workspace] #inspector-split{block-size:100%;min-inline-size:0}
    [data-split-workspace] .pane{box-sizing:border-box;min-inline-size:0;min-block-size:0;padding:var(--en-space-4,1rem);background:var(--en-color-surface);border:1px solid var(--en-color-line);border-radius:var(--en-radius-container,.5rem);block-size:100%;overflow:auto}
    [data-split-workspace] h3{margin:0 0 var(--en-space-3,.75rem);font:inherit;font-weight:var(--en-font-weight-semibold,600)}
    [data-split-workspace] p{line-height:1.5} [data-split-workspace] a{color:var(--en-color-link)}
    [data-split-workspace] en-text-field{display:block;margin-block:var(--en-space-3,.75rem)}
    [data-split-workspace] .hint{color:var(--en-color-text-muted)}
    [data-split-workspace] details{margin-block-start:var(--en-space-4,1rem)}
  </style>
    <p class="hint">Drag a divider, or focus it and use arrow keys (Shift for larger changes), Home or End. Enter collapses Navigation or Inspector; its Restore button stays available. On narrow screens the same panes stack vertically.</p>
    <en-split-view id="workspace-split" class=${this.narrow?'workspace narrow':'workspace'}
      label="Resize navigation" value="25" min="15" max="45" collapsible="primary" primary-label="Navigation"
      .orientation=${this.narrow?'vertical':'horizontal'} @en-collapse=${this.visibility}>
      <section slot="primary" class="pane"><h3>Navigation</h3>
        <en-navigation label="Workspace sections" layout="sidebar">
          <a href="#workspace-title">Overview</a>
          <en-navigation-group label="Project" open><a href="#workspace-title" aria-current="location">Project brief</a><a href="#inspector-heading">Inspector</a></en-navigation-group>
        </en-navigation>
      </section>
      <en-split-view id="inspector-split" slot="secondary" label="Resize content and inspector" value="65" min="35" max="80" collapsible="secondary" secondary-label="Inspector" .orientation=${this.narrow?'vertical':'horizontal'}>
        <section slot="primary" class="pane"><h3 id="workspace-title">Project brief</h3>
          <p>Edit this draft, then collapse and restore Navigation or Inspector. Resizing the window preserves these same controls.</p>
          <en-text-field label="Project title" value="Material study"></en-text-field>
          <en-text-field label="Summary" value="Explore light, texture and color."></en-text-field>
        </section>
        <section slot="secondary" class="pane"><h3 id="inspector-heading">Inspector</h3>
          <en-text-field label="Owner" value="Alex Kim"></en-text-field>
          <en-text-field label="Review note" value="Keep the warmer palette."></en-text-field>
        </section>
      </en-split-view>
    </en-split-view>
    <p role="status">${this.result}</p>
    <details><summary>Review scenarios</summary>
      <en-checkbox .checked=${this.locked} @en-change=${(e:CustomEvent<{proposed:boolean}>)=>{this.locked=e.detail.proposed;this.refresh();}}>Prevent pane visibility changes</en-checkbox>
      <p>Try canceling a collapse, resizing in either direction, and narrowing the window while a pane is hidden. Resizing remains available when visibility changes are prevented.</p>
      <h3>Initially collapsed pane</h3>
      <en-split-view id="initially-collapsed" collapsed="primary" primary-label="Reference" value="40" style="block-size:12rem">
        <p slot="primary">Reference notes are retained.</p><p slot="secondary">Authored visibility is delivered before JavaScript. Restore exposes the reference notes.</p>
      </en-split-view>
    </details></section>`;}
}
const splitWorkspaceDemo=directive(SplitWorkspaceDemo);
export function splitViewExample(){return html`${splitWorkspaceDemo()}`;}
// example-end:split-view

// example-start:split-view-vertical
export function verticalSplitViewExample() {
	return html`
		<en-split-view
			orientation="vertical"
			label="Resize preview pane"
			value="50"
			min="20"
			max="80"
			style=${styleMap({ blockSize: 'calc(var(--en-layout-panel-preferred) * 1.5)' })}
		>
			<en-stack
				slot="primary"
				align="center"
				gap="small"
				style=${styleMap({
					minBlockSize: '0',
					blockSize: '100%',
					padding: 'var(--en-space-4)',
					background: 'var(--en-color-canvas)',
				})}
			>
				<en-badge variant="accent">Canvas preview</en-badge>
				<div
					aria-hidden="true"
					style=${styleMap({
						inlineSize: 'var(--en-space-16)',
						aspectRatio: '1',
						borderRadius: 'var(--en-radius-container)',
						background: 'var(--en-color-action)',
						transform: 'rotate(-12deg)',
					})}
				></div>
			</en-stack>
			<en-stack
				slot="secondary"
				gap="small"
				style=${styleMap({
					minBlockSize: '0',
					blockSize: '100%',
					padding: 'var(--en-space-4)',
					background: 'var(--en-color-surface-subtle)',
				})}
			>
				<en-textarea
					label="Review notes"
					rows="3"
					value="Explore a warmer background for the next review."
				></en-textarea>
				<en-checkbox checked>Keep notes with this version</en-checkbox>
			</en-stack>
		</en-split-view>
		<p class="muted">Drag the divider up or down, or focus it and use the Up and Down arrow keys. Each pane scrolls independently.</p>
	`;
}
// example-end:split-view-vertical

// example-start:card
export function cardExample() {
	return html`
		<link rel="stylesheet" href="/styles/typography.css">
		<en-card>
			<div slot="header" class="specimen-row">
				<en-avatar name="Mira Chen"></en-avatar>
				<div>
					<strong>Material exploration</strong>
					<p class="en-metadata">Sample project</p>
				</div>
				<en-badge variant="success">Ready</en-badge>
			</div>
			<en-stack direction="horizontal" gap="small" wrap>
				<en-badge variant="accent">Color studies</en-badge>
				<en-badge>References</en-badge>
				<en-badge>Notes</en-badge>
			</en-stack>
			<p>A shared space for references, notes, and the next iteration.</p>
			<div slot="footer" class="specimen-row">
				<en-button size="small">Open study</en-button>
				<en-button variant="ghost" size="small">Share</en-button>
			</div>
		</en-card>
	`;
}
// example-end:card

// example-start:identity
export function identityExample() {
	return html`
		<style>
			@layer en.docs {
				.specimen-row { display:flex;align-items:center;gap:var(--en-space-actions, var(--en-space-1-5));flex-wrap:wrap; }
				.specimen-row>en-icon { flex:none; }
				.icon-row { display:flex;gap:var(--en-space-actions, var(--en-space-1-5));flex-wrap:wrap;align-items:center; }
			}
		</style>
		<div class="specimen-row">
			<en-avatar name="Ada Lovelace" size="small"></en-avatar>
			<en-avatar name="Mira Chen"></en-avatar>
			<en-avatar name="Rafael Silva" size="large"></en-avatar>
		</div>
		<div class="specimen-row">
			<en-badge>Draft</en-badge>
			<en-badge variant="accent">In review</en-badge>
			<en-badge variant="success">Approved</en-badge>
			<en-badge variant="warning">Needs attention</en-badge>
			<en-badge variant="danger">Archived</en-badge>
		</div>
		<div class="icon-row">
			${['plus', 'check', 'close', 'search', 'arrow-right', 'chevron-down', 'info', 'warning', 'sparkles'].map(name => html`
				<en-icon name=${name} label=${name}></en-icon>
			`)}
		</div>
	`;
}
// example-end:identity

// example-start:messages
export function messagesExample() {
	return html`
		<en-alert variant="info">Your team can continue editing while the export runs.</en-alert>
		<en-alert variant="success">Changes saved to this review.</en-alert>
		<en-alert variant="warning" dismissible>Some images are still processing.</en-alert>
		<en-alert variant="danger">Export interrupted. Your changes are preserved.</en-alert>
	`;
}
// example-end:messages

// example-start:loading
export function loadingExample() {
	return html`
		<style>
			@layer en.docs {
				.specimen-row { display:flex;align-items:center;gap:var(--en-space-actions, var(--en-space-1-5));flex-wrap:wrap; }
				.specimen-row>en-icon { flex:none; }
				.loading-row { display:grid;grid-template-columns:var(--en-size-avatar) 1fr;gap:var(--en-space-3);align-items:center; }
				.loading-row>div { display:flex;flex-direction:column;gap:var(--en-space-2); }
			}
		</style>
		<en-progress-bar label="Export progress" value="64" max="100"></en-progress-bar>
		<div class="specimen-row">
			<en-spinner label="Preparing preview"></en-spinner>
			<span>Preparing preview</span>
		</div>
		<div class="loading-row">
			<en-skeleton shape="circle"></en-skeleton>
			<div>
				<en-skeleton></en-skeleton>
				<en-skeleton></en-skeleton>
			</div>
		</div>
	`;
}
// example-end:loading

// example-start:dialog-drawer
export function dialogDrawerExample() {
	type Overlay = HTMLElement & { hide(): void };
	const closeDialog = (event: Event) => {
		(event.currentTarget as HTMLElement).closest<Overlay>('en-dialog')?.hide();
	};
	return html`
		<div class="overlay-example">
			<div class="specimen-row">
				<en-button
					id="project-dialog-trigger" variant="secondary"
				>Open dialog</en-button>
				<en-button
					id="project-drawer-trigger" variant="secondary"
				>Open drawer</en-button>
			</div>
			<en-dialog for="project-dialog-trigger" label="Invite to this project">
				<p>Give a collaborator access to the next iteration.</p>
				<en-text-field
					label="Email address"
					type="email"
					placeholder="name@example.com"
				></en-text-field>
				<div slot="footer" class="specimen-row">
					<en-button @click=${closeDialog}>Done</en-button>
				</div>
			</en-dialog>
			<en-drawer for="project-drawer-trigger" label="Project details">
				<en-text-field label="Project name" value="Studio studies"></en-text-field>
				<en-textarea
					label="Notes"
					value="A quiet place to explore the next direction."
				></en-textarea>
			</en-drawer>
		</div>
	`;
}
// example-end:dialog-drawer

// example-start:popover-tooltip
export function popoverTooltipExample() {
	return html`
		<div>
			<div class="specimen-row">
				<en-button id="view-options-trigger" variant="secondary">
					View options
					<en-icon slot="suffix" name="chevron-down" size="inherit"></en-icon>
				</en-button>
				<en-button id="context-help-trigger" variant="secondary">Hover or focus</en-button>
			</div>
			<en-popover for="view-options-trigger" label="View options">
				<en-checkbox checked>Show grid</en-checkbox>
				<en-checkbox>Show outlines</en-checkbox>
			</en-popover>
			<en-tooltip for="context-help-trigger">
				<span slot="content">Supplementary guidance, available on focus too.</span>
			</en-tooltip>
		</div>
	`;
}
// example-end:popover-tooltip

// example-start:tooltip-warmup
/** One independent warmup scope per demo instance; tooltip hosts remain siblings of the toolbar. */
class TooltipContextDemo extends LitElement {
  static override styles = css`:host{display:block} p{margin-block:var(--en-space-3,.75rem)}`;
  constructor() {
    super();
    new ContextProvider(this, {context: tooltipWarmupContext, initialValue: createTooltipWarmupGroup()});
  }
  protected override render() {
    return html`
      <en-toolbar label="Contextual editing guidance">
        <en-button id="context-canvas" variant="secondary">Canvas help</en-button>
        <en-button id="context-layers" variant="secondary">Layer help</en-button>
      </en-toolbar>
      <en-tooltip for="context-canvas"><span slot="content">Arrange the canvas before exporting.</span></en-tooltip>
      <en-tooltip for="context-layers"><span slot="content">Inspect a layer’s properties.</span></en-tooltip>
      <p>These tooltips omit <code>warmup-group</code>. Their triggers inherit one provider from this example’s host. Hover the first button, then the second; keyboard focus and Escape follow the same rules as explicit groups.</p>`;
  }
}
if (!customElements.get('en-tooltip-context-demo')) customElements.define('en-tooltip-context-demo', TooltipContextDemo);

/** Public logical placement API; the demo owns only its form controls. */
class TooltipPositionDemo extends LitElement {
  static override properties = { inline: { state: true }, block: { state: true }, direction: { state: true } };
  private declare inline: string;
  private declare block: string;
  private declare direction: string;
  static override styles = css`
    :host { display: block; }
    .controls { display: flex; flex-wrap: wrap; gap: var(--en-space-4, 1rem); }
    en-select { flex: 1 1 9rem; min-inline-size: 0; }
    .stage { position: relative; display: grid; place-items: center; min-block-size: 14rem; margin-block: var(--en-space-4, 1rem); padding: var(--en-space-4, 1rem); border: 1px solid var(--en-color-boundary); border-radius: var(--en-radius-container); }
    .stage > en-tooltip { position: absolute; }
    p { margin-block: var(--en-space-3, .75rem); }
    code { overflow-wrap: anywhere; }
  `;
  constructor() { super(); this.inline = 'center'; this.block = 'end'; this.direction = 'ltr'; }
  private choose(event: Event, key: 'inline' | 'block' | 'direction') {
    acceptValueChange<string>(event, value => { this[key] = value; return value; });
  }
  protected override render() {
    const regions = ['start', 'center', 'end'].map(value => ({ value, label: value }));
    return html`
      <div class="controls">
        <en-select label="Inline region" .value=${this.inline} .items=${regions} @en-change=${(e: Event) => this.choose(e, 'inline')}></en-select>
        <en-select label="Block region" .value=${this.block} .items=${regions} @en-change=${(e: Event) => this.choose(e, 'block')}></en-select>
        <en-select label="Reading direction" .value=${this.direction} .items=${[{ value: 'ltr', label: 'Left to right' }, { value: 'rtl', label: 'Right to left' }]} @en-change=${(e: Event) => this.choose(e, 'direction')}></en-select>
      </div>
      <div class="stage" dir=${this.direction}>
        <en-button id="position-help" variant="secondary">Hover or focus for help</en-button>
        <en-tooltip for="position-help" inline=${this.inline} block=${this.block}>
          <span slot="content">Help follows your chosen logical region.</span>
        </en-tooltip>
      </div>
      <p><code>&lt;en-tooltip for="position-help" inline="${this.inline}" block="${this.block}"&gt;</code></p>
      <p>Start/end follow the trigger’s direction. Corners sit outside both edges; center/center uses block end. At viewport edges, help flips or shifts to remain readable. Resize or scroll while help is open to try it.</p>
    `;
  }
}
if (!customElements.get('en-tooltip-position-demo')) customElements.define('en-tooltip-position-demo', TooltipPositionDemo);

export function tooltipWarmupExample() {
	return html`
		<en-stack gap="medium">
			<section id="tooltip-position-example" aria-labelledby="tooltip-position-title">
				<h3 id="tooltip-position-title">Logical tooltip placement</h3>
				<en-tooltip-position-demo></en-tooltip-position-demo>
			</section>
			<h3>Shared warm-up and focus</h3>
			<p>Hover over Canvas guidance until its help appears, then move to Selection guidance. The second tooltip opens without the first delay and immediately dismisses the preceding pointer help. Leave both triggers and their help for more than half a second to try a cold start again.</p>
			<div>
				<en-toolbar id="guidance-tooltip-group" label="Editing guidance">
					<en-button id="canvas-guidance-trigger" variant="secondary">Canvas guidance</en-button>
					<en-button id="selection-guidance-trigger" variant="secondary">Selection guidance</en-button>
				</en-toolbar>
				<en-tooltip id="canvas-guidance-tooltip" for="canvas-guidance-trigger" warmup-group="guidance-tooltip-group">
					<span slot="content">Use the canvas to explore spacing before committing to a layout.</span>
				</en-tooltip>
				<en-tooltip for="selection-guidance-trigger" warmup-group="guidance-tooltip-group">
					<span slot="content">Select a layer to inspect its individual properties.</span>
				</en-tooltip>
			</div>
			<div>
				<en-toolbar id="export-tooltip-group" label="Export guidance">
					<en-button id="export-guidance-trigger" variant="secondary">Export guidance</en-button>
				</en-toolbar>
				<en-tooltip for="export-guidance-trigger" warmup-group="export-tooltip-group">
					<span slot="content">Check the output format before handing off your work.</span>
				</en-tooltip>
			</div>
			<p>Export guidance belongs to an independent group. Keyboard focus opens help immediately and takes priority within its group: keep Canvas guidance focused, then hover Selection guidance to confirm it waits. Use the arrow keys to move focus or Escape to dismiss the focused help.</p>
			<p>After Escape, a fresh hover over Canvas guidance can open it again while focus stays there; moving away closes this hover-only help normally. If the pointer was already over the trigger when Escape was pressed, leave and re-enter to start a fresh hover. Moving focus away and back restores focus-triggered help.</p>
			<p>Touch does not start pointer warm-up. Tooltip hosts can sit outside their group; the group contains their external triggers.</p>
			<section id="tooltip-context-example" aria-labelledby="tooltip-context-title">
				<h3 id="tooltip-context-title">Contextual warm-up</h3>
				<en-tooltip-context-demo></en-tooltip-context-demo>
			</section>
		</en-stack>
	`;
}
// example-end:tooltip-warmup

// example-start:theme-scopes
/** Only library-generated theme CSS enters the static style template, never user markup. */
export function themeScopesExample({ density = 'comfortable' }: { density?: ThemeDensity } = {}) {
	return html`
		${staticHtml`<style>${unsafeStatic(inversePreviewCSS(density))}</style>`}
		<style>
			@layer en.docs {
				.scope-grid { display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,calc(var(--en-layout-panel-preferred)*1.5)),1fr));gap:var(--en-space-4); }
				.scope-sample { padding:var(--en-space-panel);border-radius:var(--en-radius-container);background:var(--en-color-canvas);color:var(--en-color-text);border:var(--en-border-width) solid var(--en-color-line); }
				.scope-caption { display:block;font-size:var(--en-font-metadata-size);margin-block-end:var(--en-space-4);font-weight:var(--en-font-label-strong-weight); }
				.scope-sample en-card p { margin-block-end:var(--en-space-4); }
			}
		</style>
		<div class="scope-grid">
			<div class="scope-sample">
				<span class="scope-caption">Page theme</span>
				<en-card>
					<span slot="header">Shared defaults</span>
					<p>These controls inherit the page’s appearance and rhythm.</p>
					<en-button>Primary action</en-button>
				</en-card>
			</div>
			<div class="scope-sample" data-en-theme="inverse">
				<span class="scope-caption">Scoped child theme</span>
				<en-card>
					<span slot="header">Independent surface</span>
					<p>This region keeps its own complete set of values.</p>
					<en-button>Primary action</en-button>
				</en-card>
			</div>
		</div>
	`;
}
// example-end:theme-scopes

// example-start:local-override
export function localOverrideExample() {
	return html`
		<p>Only this control uses square corners. Change the page settings to see the rest continue to inherit.</p>
		<en-button style="--en-control-radius:0px;--en-button-radius:0px">Local customization</en-button>
	`;
}
// example-end:local-override

// example-start:family-geometry
export function familyGeometryExample() {
	return html`
		<style>
			@layer en.docs {
				.geometry-scope > p { margin-block-end:var(--en-space-3);font-weight:var(--en-font-label-strong-weight); }
				.geometry-controls { display:flex;align-items:end;flex-wrap:wrap;gap:var(--en-space-fields); }
				.geometry-controls > :not(en-button) { flex:1 1 10rem;min-inline-size:0; }
			}
		</style>
		<p>Both rows use the default medium size. The second row gives actions more inline space, tightens field padding and reduces the segmented frame inset.</p>
		${['Shared defaults', 'Scoped family geometry'].map((label, index) => html`
			<div class="geometry-scope" style=${index ? '--en-button-inline-padding:var(--en-space-5);--en-input-inline-padding:var(--en-space-2);--en-segmented-control-frame-inset:var(--en-space-0-5)' : ''}>
				<p>${label}</p>
				<div class="geometry-controls">
					<en-button>Save</en-button>
					<en-text-field label="Project" value="Studio studies"></en-text-field>
					<en-select label="Units" value="px" .items=${[{ value: 'px', label: 'Pixels' }, { value: 'rem', label: 'Rem' }]}></en-select>
					<en-number-field label="Scale" value="2" min="1" max="10"></en-number-field>
					<en-segmented-control label="Canvas" value="design" .items=${[{ value: 'design', label: 'Design' }, { value: 'preview', label: 'Preview' }]}></en-segmented-control>
				</div>
			</div>
		`)}
	`;
}
// example-end:family-geometry

// example-start:child-authored-choices
export function childAuthoredChoicesExample() {
	type ChoiceField = HTMLElement & { value: string; updateComplete: Promise<unknown>; reportValidity(): boolean };
	type Editor = HTMLElement & { value: string };
	const editChildren = (event: Event) => {
		const field = event.currentTarget as Editor;
		if (event.composedPath()[0] !== field) return;
		const proposed = (event as CustomEvent<{ proposed: string }>).detail.proposed;
		const operation = field.dataset.editChoice;
		queueMicrotask(() => {
			if (event.defaultPrevented || !field.isConnected) return;
			const root = field.closest('.child-authored-choice-example');
			if (!root) return;
			if (typeof proposed === 'string' && field.value === proposed) {
				const label = operation === 'svg-label'
					? root.querySelector('#authored-svg-option')
					: operation === 'landscape-label' ? root.querySelector('#authored-landscape-item strong') : null;
				if (label) label.textContent = proposed;
			}
		});
	};
	const setUnavailable = (disabled: boolean, event: Event) => {
		const button = event.currentTarget as HTMLElement;
		queueMicrotask(() => {
			if (event.defaultPrevented || !button.isConnected) return;
			const root = button.closest('.child-authored-choice-example')!;
			// Edit the authored descriptors. Only the parents own the accepted values.
			root.querySelector('#authored-svg-option')!.toggleAttribute('disabled', disabled);
			root.querySelector('#authored-landscape-item')!.toggleAttribute('disabled', disabled);
		});
	};
	const setAddedChoices = (add: boolean, event: Event) => {
		const button = event.currentTarget as HTMLElement;
		queueMicrotask(() => {
			if (event.defaultPrevented || !button.isConnected) return;
			const root = button.closest('.child-authored-choice-example')!;
			const document = button.ownerDocument;
			for (const choice of [
				{ parent: '#authored-format', tag: 'en-select-option', value: 'pdf', label: 'PDF · Document' },
				{ parent: '#authored-layout', tag: 'en-segmented-item', value: 'square', label: 'Square' },
			]) {
				const parent = root.querySelector(choice.parent)!;
				const existing = parent.querySelector(`:scope > ${choice.tag}[data-added-choice="${choice.value}"]`);
				if (add && !existing) {
					// Create descriptors using their public value and label content.
					const child = document.createElement(choice.tag);
					child.setAttribute('value', choice.value);
					child.setAttribute('data-added-choice', choice.value);
					child.textContent = choice.label;
					parent.append(child);
				} else if (!add) existing?.remove();
			}
			root.querySelector('[data-choice-catalog-status]')!.textContent = add
				? 'PDF and Square are available.' : 'PDF and Square removed.';
		});
	};
	const submit = (event: SubmitEvent) => {
		event.preventDefault();
		const form = event.currentTarget as HTMLFormElement;
		const values = new FormData(form);
		form.querySelector('[data-choice-receipt]')!.textContent =
			`Submitted format: ${values.get('exportFormat')}; layout: ${values.get('canvasLayout')}.`;
	};
	const requestSubmit = (event: Event) => {
		const origin = event.currentTarget as HTMLElement;
		queueMicrotask(async () => {
			if (event.defaultPrevented || !origin.isConnected) return;
			const form = origin.closest('form')!;
			// Report through public field methods before native aggregate validation.
			// This keeps focus on the actual invalid editor across browser engines.
			const fields = [...form.querySelectorAll<ChoiceField>('en-select, en-segmented-control')];
			await Promise.all(fields.map(field => field.updateComplete));
			if (!origin.isConnected || fields.some(field => !field.reportValidity())) return;
			form.requestSubmit();
		});
	};
	return html`
		<div class="child-authored-choice-example">
			<p>Choose an export format and canvas layout, then submit their values. Select labels stay plain text; segmented labels keep their inline emphasis.</p>
			<form aria-label="Child-authored export choices" @submit=${submit}>
				<en-select id="authored-format" name="exportFormat" label="Authored export format" value="png" required>
					<en-select-option value="png">PNG · Raster image</en-select-option>
					<en-select-option id="authored-svg-option" value="svg">SVG · Vector image</en-select-option>
				</en-select>
				<en-segmented-control id="authored-layout" name="canvasLayout" label="Authored canvas layout" value="portrait" required>
					<en-segmented-item value="portrait"><strong>Portrait</strong><span class="child-choice-caption"> · Tall canvas</span></en-segmented-item>
					<en-segmented-item id="authored-landscape-item" value="landscape"><strong>Landscape</strong><span class="child-choice-caption"> · Wide canvas</span></en-segmented-item>
				</en-segmented-control>
				<en-button @click=${requestSubmit}>Use these choices</en-button>
				<p data-choice-receipt role="status" aria-atomic="true">No choices submitted yet.</p>
			</form>
			<div class="child-choice-editors" role="group" aria-label="Edit authored choices">
				<div class="specimen-row">
					<en-button variant="secondary" @click=${(event: Event) => setUnavailable(true, event)}>Disable SVG and Landscape</en-button>
					<en-button variant="secondary" @click=${(event: Event) => setUnavailable(false, event)}>Enable SVG and Landscape</en-button>
				</div>
				<div class="specimen-row">
					<en-button variant="secondary" @click=${(event: Event) => setAddedChoices(true, event)}>Add PDF and Square</en-button>
					<en-button variant="secondary" @click=${(event: Event) => setAddedChoices(false, event)}>Remove PDF and Square</en-button>
				</div>
				<p data-choice-catalog-status role="status" aria-atomic="true"></p>
				<en-text-field label="SVG option label" value="SVG · Vector image" data-edit-choice="svg-label" @en-change=${editChildren}
					description="Changes the option’s plain-text label; its value remains svg."></en-text-field>
				<en-text-field label="Landscape item label" value="Landscape" data-edit-choice="landscape-label" @en-change=${editChildren}
					description="Changes the emphasized text; the supporting label and landscape value remain."></en-text-field>
			</div>
			<p>Use Tab and arrow keys to choose, then try the label and availability controls. A disabled selected choice cannot satisfy the required field. Re-enable it or choose an available alternative before submitting. Add PDF and Square to try new choices, then remove them: existing labels and parent values stay unchanged.</p>
		</div>
	`;
}
// example-end:child-authored-choices


// example-start:focus-motion
export function focusMotionExample() {
	const projects = [
		{ value: 'north', label: 'Studio North' },
		{ value: 'south', label: 'Studio South' },
		{ value: 'archive', label: 'Archive', disabled: true },
	];
	const recipe = '--en-input-focus-accent-width:2px;--en-input-focus-accent-color:var(--en-color-action);--en-input-focus-halo-width:3px;--en-input-focus-halo-color:color-mix(in srgb,var(--en-color-focus) 50%,transparent);--en-duration-focus-enter:200ms;--en-duration-focus-exit:50ms';
	const activate = (event: Event) => {
		const button = event.currentTarget as HTMLElement;
		queueMicrotask(() => {
			if (event.defaultPrevented || !button.isConnected) return;
			button.closest('[data-focus-sample]')!.querySelector('[data-focus-action-status]')!.textContent = 'Preview button activated.';
		});
	};
	return html`
		<style>
            @layer en.docs {
                .focus-motion-example, .focus-motion-sample { display:grid; gap:var(--en-space-4); min-inline-size:0; }
                .focus-motion-example [data-focus-action-status] { min-block-size:1lh; }
                .focus-motion-sample + .focus-motion-sample { padding-block-start:var(--en-space-5); border-block-start:var(--en-border-width) solid var(--en-color-line); }
                .focus-motion-controls { display:flex; align-items:end; flex-wrap:wrap; gap:var(--en-space-fields); }
                .focus-motion-controls > :not(en-button) { flex:1 1 10rem; min-inline-size:0; }
            }
        </style>
		<div class="focus-motion-example">
			<p>Tab through both rows, including the number field’s step buttons and the searchable project picker. The complete focus outline appears immediately. The second row adds an input halo and field accent.</p>
			${[
				{ id: 'defaults', label: 'Shared defaults', style: '' },
				{ id: 'recipe', label: 'Scoped input focus recipe', style: recipe },
			].map(row => html`
				<div class="focus-motion-sample" data-focus-sample=${row.id} role="group" aria-label=${row.label} style=${row.style}>
					<p><strong>${row.label}</strong></p>
					<div class="focus-motion-controls">
						<en-button @click=${activate}>Preview study</en-button>
						<en-text-field label="Project title" value="Studio studies"></en-text-field>
						<en-select label="Export format" value="png" .items=${[
							{ value: 'png', label: 'PNG' }, { value: 'svg', label: 'SVG' },
						]}></en-select>
						<en-number-field label="Scale" value="2" min="1" max="10"></en-number-field>
						<en-combobox label="Project" value="north" .items=${projects}
							description="Type to filter, then choose a project. Escape restores the accepted selection."></en-combobox>
					</div>
					<p data-focus-action-status role="status" aria-atomic="true"></p>
				</div>
			`)}
			<p>Try pointer interaction too, then repeat with reduced motion enabled in your system or browser. The accent appears immediately with reduced motion. Changing appearance or density should preserve your entry and current focus.</p>
		</div>
	`;
}
// example-end:focus-motion


// example-start:popup-motion
export function popupMotionExample() {
	const chooseEdge = (event: Event) => {
		if (event.defaultPrevented) return;
		const select = event.currentTarget as HTMLElement & { value: string };
		select.closest('[data-popup-motion]')?.querySelector('en-drawer')?.setAttribute('placement', select.value);
	};
	const edges = ['right', 'left', 'top', 'bottom', 'start', 'end'].map(value => ({ value, label: value === 'start' ? 'Inline start' : value === 'end' ? 'Inline end' : value[0]!.toUpperCase() + value.slice(1) }));
	const projects = [{ value: 'north', label: 'Studio North' }, { value: 'south', label: 'Studio South' }];
	const rows = [
		{ id: 'immediate', label: 'Immediate', style: '--en-duration-enter:0ms;--en-duration-exit:0ms;--en-motion-surface-offset:0px;--en-motion-surface-scale:1' },
		{ id: 'motion', label: 'Scoped motion recipe', style: '--en-duration-enter:180ms;--en-duration-exit:120ms;--en-motion-surface-offset:4px;--en-motion-surface-scale:.98' },
	];
	return html`
		<style>
			@layer en.docs {
				.specimen-row { display:flex;align-items:center;gap:var(--en-space-actions, var(--en-space-1-5));flex-wrap:wrap; }
				.specimen-row>en-icon { flex:none; }
				.scope-grid { display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,calc(var(--en-layout-panel-preferred)*1.5)),1fr));gap:var(--en-space-4); }
				.scope-sample { padding:var(--en-space-panel);border-radius:var(--en-radius-container);background:var(--en-color-canvas);color:var(--en-color-text);border:var(--en-border-width) solid var(--en-color-line); }
				.scope-caption { display:block;font-size:var(--en-font-metadata-size);margin-block-end:var(--en-space-4);font-weight:var(--en-font-label-strong-weight); }
				.scope-sample en-card p { margin-block-end:var(--en-space-4); }
			}
		</style>
		<en-stack style="--en-stack-gap:var(--en-space-4)">
			<p>Compare opening and closing the same controls. Each side keeps its own entered text and selection. Try Escape, then reopen immediately; focus and accepted state should settle without waiting for the visual effect.</p>
			<div class="scope-grid">
				${rows.map(row => html`
					<div class="scope-sample" data-popup-motion=${row.id} role="group" aria-label=${row.label} style=${row.style}>
						<en-stack style="--en-stack-gap:var(--en-space-3)">
							<p><strong>${row.label}</strong></p>
							<en-select label="Drawer edge" value="right" .items=${edges} @en-change=${chooseEdge}></en-select>
							<div class="specimen-row">
								<en-button id=${`motion-${row.id}-dialog`} variant="secondary">Dialog</en-button>
								<en-button id=${`motion-${row.id}-drawer`} variant="secondary">Drawer</en-button>
								<en-button id=${`motion-${row.id}-popover`} variant="secondary">Popover</en-button>
								<en-button id=${`motion-${row.id}-menu`} variant="secondary">Menu<en-icon slot="suffix" name="chevron-down" size="inherit"></en-icon></en-button>
								<en-button id=${`motion-${row.id}-palette`} variant="secondary">Command palette</en-button>
								<en-button id=${`motion-${row.id}-tooltip`} variant="secondary">Tooltip</en-button>
							</div>
							<en-combobox label="Project" value="north" .items=${projects}></en-combobox>
						</en-stack>
							<en-dialog for=${`motion-${row.id}-dialog`} label=${`${row.label}: project details`}>
								<en-text-field label="Project name" value="Studio studies"></en-text-field>
							</en-dialog>
							<en-drawer for=${`motion-${row.id}-drawer`} label=${`${row.label}: study notes`} placement="right">
								<en-textarea label="Notes" value="Keep this draft when the drawer closes."></en-textarea>
							</en-drawer>
							<en-tooltip for=${`motion-${row.id}-tooltip`}>
								<span slot="content">Keep your pointer here to read this supplemental note. Escape dismisses it.</span>
							</en-tooltip>
							<en-popover for=${`motion-${row.id}-popover`} label=${`${row.label}: view options`}>
								<en-checkbox checked>Show grid</en-checkbox>
							</en-popover>
							<en-menu for=${`motion-${row.id}-menu`} label=${`${row.label}: preview menu`}>
								<en-menu-item action="finish-preview">Finish motion preview</en-menu-item>
							</en-menu>
							<en-command-palette for=${`motion-${row.id}-palette`} label=${`${row.label}: preview commands`}
								.commands=${[{ action: 'finish-preview', label: 'Finish motion preview', keywords: ['done'] }]}></en-command-palette>
					</div>
				`)}
			</div>
			<p>The recipe uses 180ms entry and 120ms exit. Dialogs and drawers both travel 4px; drawers move from the chosen edge and stay unscaled. Menus add elevation; popovers, tooltips, suggestions and enhanced select pickers fade. Try the Drawer edge select as well as the Project combobox. Hover or keyboard-focus Tooltip, move onto its content, and try Escape. The pointer warm-up is separate from the visual transition. Reduced motion makes both sides immediate. Motion is also immediate when the browser lacks native exit-transition support.</p>
		</en-stack>
	`;
}
// example-end:popup-motion


export interface Specimen {
	id: string;
	title: string;
	tags: string;
	render(options?: { density: ThemeDensity }): TemplateResult;
	interactive: boolean;
	wide: boolean;
}

// example-start:content-recipes
export function contentRecipesExample() {
	const samples = [
		{ id: 'campaign-brief', name: 'Campaign brief', description: 'A short brief for the next studio review.', format: 'Text excerpt' },
		{ id: 'review-checklist', name: 'Review checklist', description: 'Check the title, reading order and recovery actions.', format: 'Text excerpt' },
		{ id: 'usage-notes', name: 'Studio-review-usage-notes-for-collaborators.md', description: 'Guidance for these local examples. No thumbnail is available.', format: 'Markdown', unavailable: true },
	];
	// Retain each authored field in place. Its skeleton shares that field's exact box.
	const loadingRegion = (content: TemplateResult) => html`
		<div class="en-content-loading" data-content-loading-region aria-busy="false">
			<div data-content-ready>${content}</div>
		</div>
	`;
	const loadingChanged = (event: Event) => {
		const toggle = event.currentTarget as HTMLElement & { checked: boolean };
		if (event.composedPath()[0] !== toggle) return;
		const loading = toggle.checked;
		queueMicrotask(() => {
			if (event.defaultPrevented || !toggle.isConnected || toggle.checked !== loading) return;
			const root = toggle.closest('.content-recipes-example');
			for (const region of root?.querySelectorAll<HTMLElement>('[data-content-loading-region]') ?? []) {
				region.setAttribute('aria-busy', String(loading));
				const ready = region.querySelector<HTMLElement>('[data-content-ready]')!;
				ready.inert = loading;
			}
			const status = root?.querySelector<HTMLElement>('[data-content-loading-status]');
			if (status) status.textContent = loading ? 'Loading preview. Turn off loading to restore the current content.' : 'Content restored. Your selection and recovery results are preserved.';
		});
	};
	const layoutChanged = (event: Event) => {
		const field = event.currentTarget as HTMLElement & { value: string };
		const value = field.value;
		if (event.composedPath()[0] !== field || (value !== 'grid' && value !== 'list')) return;
		queueMicrotask(() => {
			if (event.defaultPrevented || !field.isConnected || field.value !== value) return;
			const list = field.closest('.content-recipes-example')?.querySelector<HTMLElement>('ul');
			if (list) list.dataset.layout = value;
		});
	};
	const selected = (event: Event) => {
		const form = event.currentTarget as HTMLFormElement;
		const value = new FormData(form).get('sample');
		const sample = samples.find(sample => sample.id === value);
		const summary = form.querySelector<HTMLElement>('[data-content-selection]');
		if (summary) summary.textContent = sample ? `Selected sample: ${sample.name} (${sample.id})` : 'No sample selected.';
	};
	const recover = (event: Event, kind: 'collection' | 'preview') => {
		const button = event.currentTarget as HTMLElement;
		const state = button.closest<HTMLElement>('.en-content-empty');
		if (!state || event.defaultPrevented) return;
		const restored = state.dataset.restored !== 'true';
		state.dataset.restored = String(restored);
		const collection = kind === 'collection';
		const title = restored ? (collection ? 'Review collection created' : 'Preview restored') : (collection ? 'Start a review collection' : 'Preview could not load');
		state.querySelector('.en-content-empty__title .en-content-placeholder__content')!.textContent = title;
		state.querySelector('.en-content-empty__description .en-content-placeholder__content')!.textContent = restored
			? (collection ? 'The local collection is ready. Add a sample in your application to continue.' : 'A short brief for the next studio review.')
			: (collection ? 'There are no saved samples in this separate local collection.' : 'This fixture starts with a failed preview. Retry restores its local content.');
		button.textContent = restored ? (collection ? 'Reset local collection' : 'Simulate unavailable preview') : (collection ? 'Create local collection' : 'Retry local preview');
		const status = button.closest('.content-recipes-example')?.querySelector('[data-content-recovery-status]');
		if (status) status.textContent = title;
	};
	const showEmpty = (event: Event, empty: boolean) => {
		const button = event.currentTarget as HTMLElement;
		queueMicrotask(() => {
			if (event.defaultPrevented || !button.isConnected) return;
			const root = button.closest('.content-recipes-example');
			const list = root?.querySelector<HTMLElement>('[data-content-list]');
			const message = root?.querySelector<HTMLElement>('[data-content-empty]');
			if (list && message) { list.hidden = empty; message.hidden = !empty; }
		});
	};
	return html`
		<link rel="stylesheet" href="/styles/content.css">
		<link rel="stylesheet" href="/styles/radio.css">
		<en-stack class="content-recipes-example" gap="medium">
			<p>Native lists, file cards and metadata share the same recipes in either layout. The form owns this sample selection.</p>
			<div class="specimen-row" data-content-controls style="align-items:flex-end">
				<en-select label="Sample layout" value="grid"
					.items=${[{ value: 'grid', label: 'Grid' }, { value: 'list', label: 'List' }]}
					@en-change=${layoutChanged}></en-select>
				<en-button variant="secondary" @click=${(event: Event) => showEmpty(event, true)}>Show empty state</en-button>
				<en-button variant="secondary" @click=${(event: Event) => showEmpty(event, false)}>Show samples</en-button>
			</div>
			<en-checkbox @en-change=${loadingChanged}>Preview loading placeholders</en-checkbox>
			<p role="status" data-content-loading-status>Loading preview is off. Placeholders follow each field in the current content, including wrapped text.</p>
			<form style="display:grid;gap:var(--en-space-3)" @change=${selected} @submit=${(event: Event) => event.preventDefault()}>
				<fieldset style="border:0;padding:0;min-inline-size:0">
					<legend>Choose one sample</legend>
					<div data-content-list>
						${loadingRegion(contentCollectionTemplate({ label: 'Content samples', layout: 'grid', items: samples, key: sample => sample.id,
							renderItem: sample => fileCardTemplate({ placeholders: true,
								name: html`<label><input class="en-radio" type="radio" name="sample" value=${sample.id}> ${sample.name}</label>`,
								mediaFallback: html`<span aria-hidden="true">Aa</span>`,
								availability: sample.unavailable ? 'Thumbnail unavailable; text content remains readable.' : 'Ready for review',
								description: sample.description,
								metadata: metadataListTemplate({ placeholders: true, items: [{ label: 'Format', value: sample.format }, { label: 'ID', value: sample.id }] }),
							}),
						}))}
					</div>
					<div data-content-empty hidden>
						${loadingRegion(emptyStateTemplate({ placeholders: true, kind: 'no-results', title: 'No matching samples', description: 'Your selection stays named below. Restore the sample catalog to continue.',
							actions: html`<en-button variant="secondary" @click=${(event: Event) => showEmpty(event, false)}>Restore sample catalog</en-button>` }))}
					</div>
				</fieldset>
				<p data-content-selection>No sample selected.</p>
			</form>
			<section aria-labelledby="content-handoff-title">
				<h2 class="en-heading-small" id="content-handoff-title">Handoff steps</h2>
				${loadingRegion(contentCollectionTemplate({ label: 'Ordered handoff steps', type: 'ordered', layout: 'list', start: 2,
					items: [{ id: 'review', text: 'Review the selected sample.' }, { id: 'share', text: 'Share its stable identifier with a collaborator.' }], key: step => step.id,
					renderItem: step => contentPlaceholderTemplate(step.text) }))}
			</section>
			<section aria-labelledby="content-recovery-title" style="display:grid;gap:var(--en-space-4)">
				<h2 class="en-heading-small" id="content-recovery-title">Empty and unavailable content</h2>
				<p>Try creating a collection or retrying an unavailable preview. Reset each example to repeat the recovery.</p>
				${loadingRegion(emptyStateTemplate({ placeholders: true, kind: 'empty', title: 'Start a review collection', description: 'There are no saved samples in this separate local collection.',
					actions: html`<en-button variant="secondary" @click=${(event: Event) => recover(event, 'collection')}>Create local collection</en-button>` }))}
				${loadingRegion(emptyStateTemplate({ placeholders: true, kind: 'unavailable', title: 'Preview could not load', description: 'This fixture starts with a failed preview. Retry restores its local content.',
					actions: html`<en-button variant="secondary" @click=${(event: Event) => recover(event, 'preview')}>Retry local preview</en-button>` }))}
				<p role="status" data-content-recovery-status></p>
			</section>
		</en-stack>
	`;
}
// example-end:content-recipes

// example-start:virtual-collection
export function virtualCollectionExample() {
	return html`<en-virtual-collection-demo></en-virtual-collection-demo>`;
}
// example-end:virtual-collection

// example-start:authored-table
class AssetTableDemo extends AsyncDirective {
	private rows = [
		{ id: 'campaign-brief', name: 'Campaign brief', kind: 'Document', updated: '2026-09-09' },
		{ id: 'sparkle-mark', name: 'Sparkle mark', kind: 'Icon', updated: '2026-09-08' },
		{ id: 'review-checklist', name: 'Review checklist', kind: 'Document', updated: '2026-09-07' },
	];
	private sortKey?: 'name' | 'updated';
	private direction: 'ascending' | 'descending' = 'ascending';
	private selectedId = '';
	private status = 'No asset selected. Use the column buttons to sort.';

	private sort(event: Event, key: 'name' | 'updated') {
		const button = event.currentTarget as HTMLElement;
		queueMicrotask(() => {
			if (event.defaultPrevented || !this.isConnected || !button.isConnected) return;
			this.selectedId = button.closest('table')?.querySelector<HTMLInputElement>('input[name="table-asset"]:checked')?.value ?? this.selectedId;
			this.direction = this.sortKey === key && this.direction === 'ascending' ? 'descending' : 'ascending';
			this.sortKey = key;
			this.rows = [...this.rows].sort((a, b) => a[key].localeCompare(b[key], 'en') * (this.direction === 'ascending' ? 1 : -1));
			this.status = `Sorted by ${key === 'name' ? 'name' : 'updated date'}, ${this.direction}.`;
			this.setValue(this.render());
		});
	}

	private select(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const row = this.rows.find(row => row.id === input.value);
		if (!input.checked || !row) return;
		this.selectedId = row.id;
		this.status = `Selected ${row.name}. Sorting retains this selection.`;
		this.setValue(this.render());
	}

	render() {
		return html`
			<link rel="stylesheet" href="/styles/table.css">
			<link rel="stylesheet" href="/styles/radio.css">
			<div class="authored-table-example">
				<p>Sort by Name or Updated, then choose one asset. The application owns sorting and selection; the authored native table keeps its caption and header relationships.</p>
				<en-table id="specimen-table" label="Project assets scroll area">
					<table>
						<caption>Project assets</caption>
						<thead>
							<tr>
								<th scope="col">Choose</th>
								<th scope="col" aria-sort=${this.sortKey === 'name' ? this.direction : nothing}><en-button variant="ghost" size="small" @click=${(event: Event) => this.sort(event, 'name')}>
									Sort Name<span class="visually-hidden"> ${this.sortKey === 'name' && this.direction === 'ascending' ? 'descending' : 'ascending'}</span>
									${this.sortKey === 'name' ? html`<en-icon slot="suffix" name="arrow-right" style=${`rotate:${this.direction === 'descending' ? '90deg' : '-90deg'}`}></en-icon>` : nothing}
								</en-button></th>
								<th scope="col">Type</th>
								<th scope="col" aria-sort=${this.sortKey === 'updated' ? this.direction : nothing}><en-button variant="ghost" size="small" @click=${(event: Event) => this.sort(event, 'updated')}>
									Sort Updated<span class="visually-hidden"> ${this.sortKey === 'updated' && this.direction === 'ascending' ? 'descending' : 'ascending'}</span>
									${this.sortKey === 'updated' ? html`<en-icon slot="suffix" name="arrow-right" style=${`rotate:${this.direction === 'descending' ? '90deg' : '-90deg'}`}></en-icon>` : nothing}
								</en-button></th>
							</tr>
						</thead>
						<tbody>
							${repeat(this.rows, row => row.id, row => html`
								<tr data-asset=${row.id}>
									<td><input class="en-radio" type="radio" name="table-asset" value=${row.id} aria-label=${`Choose ${row.name}`} ?checked=${this.selectedId === row.id} @change=${(event: Event) => this.select(event)}></td>
									<th scope="row">${row.name}</th>
									<td>${row.kind}</td>
									<td><time datetime=${row.updated}>${row.updated}</time></td>
								</tr>
							`)}
						</tbody>
					</table>
				</en-table>
				<output aria-live="polite">${this.status}</output>
			</div>
		`;
	}
}
const assetTableDemo = directive(AssetTableDemo);
export function authoredTableExample() {
	return html`${assetTableDemo()}`;
}
// example-end:authored-table

export const specimens: readonly Specimen[] = [
	{ id: "swatches", title: "Token swatches", tags: "en-swatch", render: swatchesExample, interactive: true, wide: false },
	{ id: "color-wheel", title: "Standalone hue wheel", tags: "en-color-wheel", render: colorWheelExample, interactive: true, wide: false },
	{ id: "color-plane", title: "Two-dimensional color plane", tags: "en-color-plane", render: colorPlaneExample, interactive: true, wide: false },
	{ id: "color-slider", title: "Color channel slider", tags: "en-color-slider", render: colorSliderExample, interactive: true, wide: false },
	{ id: "color-picker", title: "Inline color picker", tags: "en-color-picker", render: colorPickerExample, interactive: true, wide: false },
	{ id: "color-field", title: "Color selection", tags: "en-swatch / en-color-field", render: colorFieldExample, interactive: true, wide: false },
	{ id: "typography", title: "Typography", tags: "font.*", render: typographyExample, interactive: false, wide: false },
	{ id: "rhythm", title: "Rhythm & nested corners", tags: "space.* / radius.*", render: rhythmExample, interactive: false, wide: false },
	{ id: "buttons", title: "Buttons", tags: "en-button", render: buttonsExample, interactive: true, wide: false },
	{ id: "menu-choices", title: "Menu choices and submenus", tags: "en-menu / en-menu-item", render: menuChoicesExample, interactive: true, wide: true },
	{ id: "mixed-toolbar", title: "Mixed editing controls", tags: "en-toolbar / en-text-field / en-select / en-checkbox", render: mixedToolbarExample, interactive: true, wide: true },
	{ id: "command-surfaces", title: "Command surfaces", tags: "en-toolbar / en-menu / en-menu-item / en-command-palette", render: commandSurfacesExample, interactive: true, wide: true },
	{ id: "button-scale", title: "Scale & icon actions", tags: "en-button / en-icon", render: buttonScaleExample, interactive: true, wide: false },
	{ id: "text-fields", title: "Text fields", tags: "en-text-field", render: textFieldsExample, interactive: true, wide: false },
	{ id: "long-text-search", title: "Longer text & search", tags: "en-textarea / en-search-input", render: longTextSearchExample, interactive: true, wide: false },
	{ id: "composable-chat", title: "Composable editor extensions", tags: "en-token-editor / en-editor-trigger", render: composableChatExample, interactive: true, wide: true },
	{ id: "rich-text", title: "Rich text and shared editor extensions", tags: "en-rich-text-editor / en-editor-toolbar", render: richTextExample, interactive: true, wide: true },
	{ id: "navigation-sidebar", title: "Nested navigation and responsive sidebar", tags: "en-navigation / en-navigation-group", render: navigationSidebarExample, interactive: true, wide: true },
	{ id: "carousel", title: "Media and card carousels", tags: "en-carousel / en-carousel-slide", render: carouselExample, interactive: true, wide: true },
	{ id: "presence-activity", title: "Presence and project activity", tags: "en-presence / en-presence-group / en-activity-item / en-activity-feed", render: presenceActivityExample, interactive: true, wide: true },
	{ id: "chat-patterns", title: "Chat messages and composer", tags: "en-chat-message / en-chat-composer", render: chatPatternsExample, interactive: true, wide: true },
	{ id: "toast", title: "Notifications and toast actions", tags: "en-toast / en-toast-region", render: toastExample, interactive: true, wide: true },
	{ id: "multi-step", title: "Multi-step form and validation", tags: "en-progress-steps / en-validation-summary", render: multiStepExample, interactive: true, wide: true },
	{ id: "calendar", title: "Calendar, dates and time", tags: "en-calendar / en-date-picker / en-time-field", render: calendarExample, interactive: true, wide: true },
	{ id: "structured-values", title: "Structured values", tags: "en-select / en-date-input", render: structuredValuesExample, interactive: true, wide: false },
	{ id: "combobox", title: "Find a project", tags: "en-combobox", render: comboboxExample, interactive: true, wide: false },
	{ id: "file-upload", title: "File selection and transfer recovery", tags: "en-file-upload", render: fileUploadExample, interactive: true, wide: true },
	{ id: "precision", title: "Precision & availability", tags: "en-number-field / en-text-field", render: precisionExample, interactive: true, wide: false },
	{ id: "checkboxes-switches", title: "Checkboxes & switches", tags: "en-checkbox / en-switch", render: checkboxesSwitchesExample, interactive: true, wide: false },
	{ id: "radio-group", title: "Radio group", tags: "en-radio-group / en-radio", render: radioGroupExample, interactive: true, wide: false },
	{ id: "opacity", title: "Continuous adjustment", tags: "en-slider", render: opacityExample, interactive: true, wide: false },
	{ id: "vertical-slider", title: "Vertical adjustment", tags: "en-slider", render: verticalSliderExample, interactive: true, wide: false },
	{ id: "rating", title: "Rating", tags: "en-rating", render: ratingExample, interactive: true, wide: false },
	{ id: "tree-view", title: "Project hierarchy", tags: "en-tree / en-tree-item", render: treeViewExample, interactive: true, wide: true },
	{ id: "tree-data", title: "Large data hierarchy", tags: "en-tree", render: treeDataExample, interactive: true, wide: true },
	{ id: "native-navigation", title: "Section and page links", tags: "en-navigation", render: nativeNavigationExample, interactive: false, wide: true },
	{ id: "pagination", title: "Page navigation", tags: "en-pagination", render: paginationExample, interactive: true, wide: true },
	{ id: "breadcrumbs", title: "Breadcrumb path", tags: "en-breadcrumbs", render: breadcrumbsExample, interactive: false, wide: false },
	{ id: "tabs", title: "Tabs", tags: "en-tabs / en-tab / en-tab-panel", render: tabsExample, interactive: true, wide: false },
	{ id: "accordion", title: "Accordion", tags: "en-accordion / en-accordion-item", render: accordionExample, interactive: true, wide: false },
	{ id: "data-table", title: "Data table API comparison", tags: "en-data-table", render: dataTableExample, interactive: true, wide: true },
	{ id: "split-view", title: "Resizable workspace", tags: "en-split-view / en-splitter", render: splitViewExample, interactive: true, wide: true },
	{ id: "split-view-vertical", title: "Top and bottom panes", tags: "en-split-view / en-splitter", render: verticalSplitViewExample, interactive: true, wide: true },
	{ id: "card", title: "Card composition", tags: "en-card / en-stack", render: cardExample, interactive: true, wide: false },
	{ id: "identity", title: "Identity, badges & icons", tags: "en-avatar / en-badge / en-icon", render: identityExample, interactive: false, wide: false },
	{ id: "messages", title: "Messages", tags: "en-alert", render: messagesExample, interactive: true, wide: false },
	{ id: "loading", title: "Progress & loading", tags: "en-progress-bar / en-spinner / en-skeleton", render: loadingExample, interactive: false, wide: false },
	{ id: "dialog-drawer", title: "Dialog & drawer", tags: "en-dialog / en-drawer", render: dialogDrawerExample, interactive: true, wide: false },
	{ id: "tooltip-warmup", title: "Shared tooltip warm-up", tags: "en-tooltip / en-toolbar", render: tooltipWarmupExample, interactive: true, wide: true },
	{ id: "popover-tooltip", title: "Popover & tooltip", tags: "en-popover / en-tooltip", render: popoverTooltipExample, interactive: true, wide: false },
	{ id: "theme-scopes", title: "Independent theme scopes", tags: "data-en-theme", render: themeScopesExample, interactive: false, wide: true },
	{ id: "local-override", title: "A focused override", tags: "CSS custom properties", render: localOverrideExample, interactive: false, wide: false },
	{ id: "family-geometry", title: "Family geometry", tags: "Buttons · Fields · Segmented controls", render: familyGeometryExample, interactive: true, wide: true },
	{ id: "child-authored-choices", title: "Child-authored choices", tags: "en-select / en-select-option / en-segmented-control / en-segmented-item", render: childAuthoredChoicesExample, interactive: true, wide: true },
	{ id: "focus-motion", title: "Focus and motion", tags: "Focus recipes", render: focusMotionExample, interactive: true, wide: true },
	{ id: "popup-motion", title: "Popup entry and exit", tags: "Native surface motion", render: popupMotionExample, interactive: true, wide: true },
	{ id: "authored-table", title: "Authored asset table", tags: "en-table / native table", render: authoredTableExample, interactive: true, wide: true },
	{ id: "virtual-collection", title: "Large collection review", tags: "en-table / shared virtualization", render: virtualCollectionExample, interactive: true, wide: true },
	{ id: "content-recipes", title: "Content recipes", tags: "Native list / file card / metadata / empty state", render: contentRecipesExample, interactive: true, wide: true },
];
