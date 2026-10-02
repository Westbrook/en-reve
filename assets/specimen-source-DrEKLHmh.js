import{i as e,r as t,t as n}from"./static-html-Bg6rjuyd.js";import{t as r}from"./rolldown-runtime-B0lUwjiP.js";var i;function a(){return(a=r((()=>{i={"navigation-sidebar":`import { html, css, LitElement } from 'lit';









/** Documentation-owned composition; the navigation and Drawer remain public primitives. */
class SidebarDrawerDemo extends LitElement {
  static override properties = { compact: { state: true }, preview: { state: true } };
  private declare compact: boolean;
  private declare preview: boolean;
  private media?: MediaQueryList;
  private revision = 0;
  static override styles = css\`
    :host{display:block;min-inline-size:0}
    .layout{display:grid;grid-template-columns:minmax(0,17rem) minmax(0,1fr);gap:var(--en-space-panel,1.5rem);align-items:start}
    .layout.compact{grid-template-columns:minmax(0,1fr)}
    aside{padding:var(--en-space-3,.75rem);border:1px solid var(--en-color-line);border-radius:var(--en-radius-container,.5rem);background:var(--en-color-surface)}
    .content{display:grid;gap:var(--en-space-4,1rem);min-inline-size:0}
    .preview{margin-block-end:var(--en-space-3,.75rem)}
    [hidden]{display:none!important}
    en-drawer::part(surface){inline-size:min(22rem,100%);max-inline-size:100%}
  \`;
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
  protected override render(){return html\`
    <div class="preview"><en-button variant="secondary" @click=\${()=>{this.preview=!this.preview;void this.resize();}}>\${this.preview?'Use viewport layout':'Preview mobile Drawer'}</en-button></div>
    <div class=\${this.compact?'layout compact':'layout'}>
      <aside ?hidden=\${this.compact}><slot name="desktop" @click=\${this.follow}></slot></aside>
      <div class="content">
        <en-button id="drawer-navigation-trigger" variant="secondary" ?hidden=\${!this.compact}>Open project navigation</en-button>
        <slot name="content"></slot>
      </div>
    </div>
    <en-drawer for="drawer-navigation-trigger" label="Project navigation" placement="start">
      <slot name="mobile" @click=\${this.follow}></slot>
    </en-drawer>\`;}
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
  return html\`<section data-sidebar-demo>
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
        <en-navigation id="workspace-navigation" label="Project navigation" layout="sidebar" collapse-at="48rem" @click=\${followed}>
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
        <en-button variant="secondary" @click=\${(event:Event)=>setCurrent(rootFor(event).querySelector('#archive-link')!)}>Mark archive current</en-button>
        <en-button variant="secondary" @click=\${(event:Event)=>{const link=rootFor(event).querySelector<HTMLElement>('#archive-link')!;link.hidden=!link.hidden;}}>Toggle archive availability</en-button>
        <en-button variant="secondary" @click=\${(event:Event)=>{const nav=rootFor(event).querySelector('en-navigation')!;const existing=nav.querySelector('[data-added-link]');if(existing)existing.remove();else{const link=document.createElement('a');link.href='#workspace-artwork';link.textContent='Recently added study';link.dataset.addedLink='';nav.append(link);}}}>Add or remove a link</en-button>
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
  </section>\`;
}`,swatches:`import { html } from 'lit';

export function tokenSample(token: string, name: string) {
	return html\`
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
		<div class="token-sample" data-token-sample role="group" aria-label=\${name}>
			<en-swatch token=\${token} label=\${\`Copy \${name} CSS reference\`} @click=\${copyTokenReference}></en-swatch>
			<span class="token-sample-name">\${name}</span>
			<code class="token-sample-reference">var(\${token})</code>
			<p class="token-sample-status" role="status" aria-live="polite" aria-atomic="true"></p>
		</div>
	\`;
}

export function swatchesExample() {
	return html\`
		\${tokenSample('--en-color-action', 'Action color')}
		<p>Activate the color sample to copy its CSS reference. The name, reference, and copy feedback are composed by this example.</p>
	\`;
}

// Application-owned copy helper (maintained in token-copy.ts).
/** Application-owned copy behavior for a token sample and its sibling feedback. */
type TokenSample = HTMLElement & { token: string; disabled: boolean };
type CopyOperation = { token: string; reference: string; swatch: TokenSample; status: HTMLElement };
const operations = new WeakMap<HTMLElement, CopyOperation>();

/** Keep the native clipboard call inside the synchronous activation handler. */
export function copyTokenReference(event: Event): void {
	if (event.defaultPrevented) return;
	const swatch = event.currentTarget as TokenSample;
	const group = swatch.closest<HTMLElement>('[data-token-sample]');
	const status = group?.querySelector<HTMLElement>('[role="status"]');
	if (!group || !status || !swatch.isConnected || swatch.disabled || !/^--en-[A-Za-z0-9_-]+$/u.test(swatch.token)) return;
	const reference = \`var(\${swatch.token})\`;
	event.preventDefault();
	const pending = operations.get(group);
	if (pending?.reference === reference && pending.token === swatch.token
		&& pending.swatch === swatch && pending.status === status) return;
	const operation = { token: swatch.token, reference, swatch, status };
	operations.set(group, operation);
	status.textContent = '';
	group.dataset.copyState = 'copying';
	group.setAttribute('aria-busy', 'true');
	const view = swatch.ownerDocument.defaultView;
	let result: Promise<boolean>;
	try {
		const clipboard = view?.navigator.clipboard;
		result = clipboard?.writeText ? clipboard.writeText(reference).then(() => true, () => false) : Promise.resolve(false);
	} catch {
		result = Promise.resolve(false);
	}
	void finish();

	async function finish() {
		// Separate repeated live-region messages while the write proceeds independently.
		await new Promise<void>(resolve => view?.requestAnimationFrame
			? view.requestAnimationFrame(() => view.requestAnimationFrame(() => resolve()))
			: setTimeout(resolve, 0));
		const copied = await result;
		if (operations.get(group!) !== operation) return;
		operations.delete(group!);
		group!.removeAttribute('aria-busy');
		if (!swatch.isConnected || !group!.contains(swatch) || !group!.contains(status!) || swatch.disabled
			|| swatch.token !== operation.token) {
			group!.dataset.copyState = 'idle';
			return;
		}
		group!.dataset.copyState = copied ? 'success' : 'failure';
		status!.textContent = copied ? 'CSS reference copied.' : 'Could not copy. Select and copy the CSS reference.';
	}
}`,typography:`import { html } from 'lit';

export function typographyExample() {
	return html\`
		<link rel="stylesheet" href="/styles/typography.css">
		<en-stack style="--en-stack-gap:var(--en-space-3)">
			<p class="en-heading-large">Room for ideas.</p>
			<p class="en-heading-small">A clear hierarchy, without the squeeze.</p>
			<p class="en-body">Readable labels and supporting text keep complex work approachable. Type stays the same size when density changes.</p>
			<p class="en-metadata">Metadata · 19 locale targets · System fonts</p>
		</en-stack>
	\`;
}`,rhythm:`import { html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

export function rhythmExample() {
	return html\`
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
			\${[1, 2, 3, 4, 6, 8].map(n => html\`
				<div>
					<i style=\${styleMap({ inlineSize: 'var(--en-space-' + n + ')' })}></i>
					<small>\${n}×</small>
				</div>
			\`)}
		</div>
	\`;
}`,buttons:`import { html } from 'lit';

export function buttonsExample() {
	return html\`
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
	\`;
}`,"command-surfaces":`import { html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

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
		result.textContent = \`Preview layout: \${landscape ? 'Landscape' : 'Portrait'}.\`;
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
	return html\`
		<div class="command-surfaces-demo">
			<en-stack gap="medium">
				<en-toolbar id="specimen-toolbar" label="Study layout actions">
					<en-button variant="secondary" @click=\${(event: Event) => click('study.portrait', event)}>Portrait</en-button>
					<en-button variant="secondary" @click=\${(event: Event) => click('study.landscape', event)}>Landscape</en-button>
				</en-toolbar>
				<div class="specimen-row">
					<en-button id="specimen-menu-trigger" variant="secondary">More layout actions<en-icon slot="suffix" name="chevron-down" size="inherit"></en-icon></en-button>
					<en-button id="specimen-command-trigger" variant="secondary">Search layout commands</en-button>
				</div>
				<p>Use any entry point to change the same preview. Publishing is unavailable in this local example.</p>
				<div data-command-preview data-layout="portrait" style=\${styleMap({ inlineSize: 'min(100%, 16rem)', aspectRatio: '4 / 5', padding: 'var(--en-space-4)', border: 'var(--en-border-width) solid var(--en-color-boundary)', borderRadius: 'var(--en-radius-container)', background: 'var(--en-color-surface-subtle)', color: 'var(--en-color-text)' })}>Studio study</div>
				<p data-command-result role="status" aria-atomic="true">Preview layout: Portrait.</p>
			</en-stack>
			<en-menu id="specimen-menu" for="specimen-menu-trigger" label="Study layout actions" @en-action=\${action}>
				<en-menu-item id="specimen-menu-item" action="study.portrait"><strong>Portrait</strong></en-menu-item>
				<en-menu-item action="study.landscape">Landscape</en-menu-item>
				<en-menu-item action="study.publish" disabled>Publish study</en-menu-item>
			</en-menu>
			<en-command-palette id="specimen-command-palette" for="specimen-command-trigger" label="Study commands"
				.searchLabel=\${'Find a layout command'} placeholder="Try portrait, wide or publish"
				.emptyText=\${'No matching layout commands.'} .closeLabel=\${'Close study commands'}
				.commands=\${commands} @en-action=\${action}></en-command-palette>
		</div>
	\`;
}`,"mixed-toolbar":`import { html } from 'lit';

export function mixedToolbarExample() {
	const apply = (event: Event) => {
		const root = (event.currentTarget as HTMLElement).closest('.mixed-toolbar-demo');
		const title = root?.querySelector<HTMLElement & { value: string; reportValidity(): boolean }>('[data-study-title]');
		const format = root?.querySelector<HTMLElement & { value: string }>('[data-study-format]');
		const background = root?.querySelector<HTMLElement & { checked: boolean }>('[data-study-background]');
		const result = root?.querySelector<HTMLElement>('[data-study-result]');
		if (!title?.reportValidity() || !format || !background || !result) return;
		result.textContent = \`\${title.value}: \${format.value.toUpperCase()}, \${background.checked ? 'with' : 'without'} background. Preview settings applied locally.\`;
	};
	return html\`
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
				<en-button @click=\${apply}>Apply preview settings</en-button>
			</en-toolbar>
			<p data-study-result role="status">Edit the study settings, then apply them. No file is generated.</p>
			<p>Explicit tab navigation has labelled group semantics in the initial HTML. Button-only toolbars keep their arrow-key behavior in the default auto mode.</p>
		</div>
	\`;
}`,"menu-choices":`import { html } from 'lit';

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
			if (result) result.textContent = \`\${layout === 'landscape' ? 'Landscape' : 'Portrait'} preview; background \${background ? 'included' : 'excluded'}.\`;
		});
	};
	const exported = (event: Event) => {
		const item = event.composedPath()[0] as HTMLElement;
		if (item.localName !== 'en-menu-item') return;
		const action = (event as CustomEvent<{ action: string }>).detail.action;
		queueMicrotask(() => {
			if (event.defaultPrevented || !item.isConnected) return;
			const result = item.closest('.menu-choices-demo')?.querySelector<HTMLElement>('[data-menu-result]');
			if (result) result.textContent = \`\${action === 'export.svg' ? 'SVG' : 'PNG'} export requested locally. No file is generated.\`;
		});
	};
	return html\`
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
			<en-menu id="menu-choices" for="menu-choices-trigger" label="Preview options" @en-change=\${changed} @en-action=\${exported}>
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
	\`;
}`,"button-scale":`import { html } from 'lit';

export function buttonScaleExample() {
	return html\`
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
	\`;
}`,"text-fields":`import { html } from 'lit';

export function textFieldsExample() {
	return html\`
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
	\`;
}`,"long-text-search":`import { html } from 'lit';

export function longTextSearchExample() {
	return html\`
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
	\`;
}`,"structured-values":`import { html } from 'lit';

export function structuredValuesExample() {
	return html\`
		<en-select
			label="Export format"
			value="png"
			.items=\${[
				{ value: 'png', label: 'PNG · Raster image' },
				{ value: 'svg', label: 'SVG · Vector image' },
				{ value: 'pdf', label: 'PDF · Document' },
			]}
		>
			<span slot="description"><strong>PNG</strong> suits raster previews; <strong>SVG</strong> keeps vector detail.</span>
		</en-select>
		<en-date-input label="Review date" value="2026-09-18"></en-date-input>
	\`;
}`,combobox:`import { html } from 'lit';

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
		form.querySelector('output')!.textContent = \`Submitted project: \${id}\`;
	};
	const requestSubmit = (event: Event) => (event.currentTarget as Element).closest('form')!.requestSubmit();
	return html\`
		<div class="combobox-example">
			<form @submit=\${submit}>
				<en-combobox name="project" value="studio-north" .items=\${projects} required>
					<span slot="label">Project</span>
					<span slot="description">Type to filter, then choose a project. Escape or leaving the field restores your current selection.</span>
				</en-combobox>
				<en-button @click=\${requestSubmit}>Use project</en-button>
				<output role="status">No project submitted yet.</output>
			</form>
			<details>
				<summary>Try suggestion states</summary>
				<en-select label="Suggestion state" value="ready"
					.items=\${[{ value: 'ready', label: 'Ready' }, { value: 'loading', label: 'Loading' }, { value: 'failed', label: 'Failed' }]}
					@en-change=\${changeScenario}
				></en-select>
				<en-button data-retry hidden variant="secondary" @click=\${retry}>Retry</en-button>
				<p>These states are simulated locally. Try a query with no matches to review the empty state.</p>
			</details>
		</div>
	\`;
}`,"file-upload":`import { html, nothing } from 'lit';
import { AsyncDirective, directive } from 'lit/async-directive.js';
import { ref } from 'lit/directives/ref.js';

/** This application-owned fixture never reads file contents or starts a network request. */
class FileUploadDemo extends AsyncDirective {
	private field?: HTMLElement & { files: readonly File[]; updateComplete: Promise<unknown> };
	private files: readonly File[] = [];
	private phase: 'idle' | 'ready' | 'pending' | 'failed' | 'complete' = 'idle';
	private status = 'Choose files to prepare a local transfer simulation.';
	private resetKey: unknown;
  private progress = 0;
  private timer?: ReturnType<typeof setInterval>;
  private stop() { clearInterval(this.timer); this.timer = undefined; }
  protected override disconnected() { this.stop(); if (this.phase === 'pending') { this.phase = 'ready'; this.status = 'Simulation paused. Start again to retry.'; } }
  private start() {
    this.stop(); this.progress = 0;
    this.timer = setInterval(() => {
      if (!this.isConnected || this.phase !== 'pending') { this.stop(); return; }
      this.progress = Math.min(100, this.progress + 5);
      if (this.progress === 100) this.transition('complete');
      else this.setValue(this.render(this.resetKey));
    }, 500);
  }
	private connect = (element: Element | undefined) => {
		this.field = element as typeof this.field;
		const field = this.field;
		if (!field) return;
		// The docs shell hydrates before loading the specimen's element definitions.
		// Wait for that upgrade, then read any native selection adopted during hydration.
		void field.ownerDocument.defaultView?.customElements.whenDefined('en-file-upload').then(async () => {
			await field.updateComplete;
			if (!this.isConnected || this.field !== field || !field.files.length || this.files === field.files) return;
			this.files = field.files; this.phase = 'ready';
			this.status = \`\${this.files.length} file(s) ready. Nothing has been transferred.\`;
			this.setValue(this.render(this.resetKey));
		});
	};
	private changed = (event: Event) => {
		const field = event.currentTarget as NonNullable<typeof this.field>;
		if (event.composedPath()[0] !== field || !event.cancelable) return;
		// Selection is provisional during en-change; consume only the accepted transaction.
		const proposed = field.files;
		queueMicrotask(() => {
			if (!this.isConnected || event.defaultPrevented || this.field !== field || field.files !== proposed) return;
			this.stop(); this.progress = 0;
			this.files = proposed;
			this.phase = proposed.length ? 'ready' : 'idle';
			this.status = proposed.length ? \`\${proposed.length} file(s) ready. Nothing has been transferred.\` : 'No files selected.';
			this.setValue(this.render(this.resetKey));
		});
	};
	private transition(phase: 'pending' | 'failed' | 'complete' | 'ready') {
		if (!this.files.length) return;
		this.stop();
		this.phase = phase;
		if (phase === 'pending') this.start();
		if (phase === 'complete') this.progress = 100;
		this.status = phase === 'pending' ? 'Simulated transfer in progress. It will finish automatically; you can also complete, fail or cancel it.'
			: phase === 'failed' ? 'Simulated connection failure. Your files are retained; retry when ready.'
			: phase === 'complete' ? \`Simulation complete for \${this.files.length} file(s). No files were sent or added to a server.\`
			: 'Simulated transfer canceled. Your files are retained.';
		this.setValue(this.render(this.resetKey));
	}
	private reset = () => {
		this.stop(); this.progress = 0;
		if (this.field) this.field.files = [];
		this.files = []; this.phase = 'idle'; this.status = 'Files and transfer simulation reset.';
		this.setValue(this.render(this.resetKey));
	};
	render(resetKey: unknown = 0) {
		if (this.resetKey !== resetKey) {
			this.stop(); this.progress = 0;
			this.resetKey = resetKey;
			if (this.field) this.field.files = [];
			this.files = []; this.phase = 'idle'; this.status = 'Choose files to prepare a local transfer simulation.';
		}
		const pending = this.phase === 'pending';
		return html\`
			<style>.file-upload-demo:has(en-file-upload[dragging]) { outline: var(--en-input-focus-width, 2px) dashed var(--en-input-focus-color, currentColor); outline-offset: var(--en-space-2); }</style>
      <div id="file-upload-surface" class="file-upload-demo" style="display:grid;gap:var(--en-space-4);min-inline-size:0;overflow-wrap:anywhere">
				<p style="margin:0">Drop files anywhere in this example, or use Choose files. Then try a successful transfer, a connection failure and retry. This fixture keeps file references in this page; it does not read or send their contents.</p>
				<en-file-upload id="file-upload-choice" for="file-upload-surface" \${ref(this.connect)} name="study-files" multiple accept="image/png,image/jpeg,application/pdf" max-file-size="5000000" ?disabled=\${pending} @en-change=\${this.changed}>
					<span slot="label">Study files</span>
					<span slot="description">PNG, JPEG or PDF, up to 5 MB per file. A new choice replaces the current selection.</span>
				</en-file-upload>
				<div style="display:flex;flex-wrap:wrap;gap:var(--en-space-2);align-items:center">
					<en-button ?disabled=\${this.phase !== 'ready'} @click=\${() => this.transition('pending')}>Start simulated transfer</en-button>
					<en-button variant="secondary" ?disabled=\${!pending} @click=\${() => this.transition('complete')}>Complete transfer</en-button>
					<en-button variant="secondary" ?disabled=\${!pending} @click=\${() => this.transition('failed')}>Fail transfer</en-button>
					<en-button variant="secondary" ?disabled=\${this.phase !== 'failed'} @click=\${() => this.transition('pending')}>Retry transfer</en-button>
					<en-button variant="secondary" ?disabled=\${!pending} @click=\${() => this.transition('ready')}>Cancel transfer</en-button>
					<en-button variant="ghost" @click=\${this.reset}>Reset files</en-button>
				</div>
				\${pending ? html\`<en-progress-bar label="Simulated transfer" .value=\${this.progress}></en-progress-bar><p data-upload-progress style="margin:0">\${this.progress}% · Local simulation</p>\` : nothing}
				<p data-upload-status role="status" aria-atomic="true" style="margin:0">\${this.status}</p>
				\${this.phase === 'complete' ? html\`<p data-upload-receipt style="margin:0">Local receipt: \${this.files.map(file => file.name).join(', ')}.</p>\` : nothing}
			</div>
		\`;
	}
}
const fileUploadDemo = directive(FileUploadDemo);
export function fileUploadExample(resetKey: unknown = 0) { return html\`\${fileUploadDemo(resetKey)}\`; }`,precision:`import { html } from 'lit';

export function precisionExample() {
	return html\`
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
	\`;
}`,"color-slider":`import { html } from 'lit';

export function colorSliderExample() {
  return html\`<en-color-slider label="Alpha" min="0" max="100" value="60" editable show-value checkerboard .stops=\${['#33669900','#336699']}></en-color-slider>
    <p>A native range handle over a configurable color gradient. Use the exact-value field or keyboard arrows to adjust it.</p>\`;
}`,"color-wheel":`import { html } from 'lit';

export function colorWheelExample() {
  return html\`<en-color-wheel label="Accent hue" value="#5577cc"></en-color-wheel>\`;
}`,"color-plane":`import { html } from 'lit';

export function colorPlaneExample() {
  return html\`<en-color-plane label="Accent color" value="#5577cc" alpha></en-color-plane>
    <p>Drag to choose saturation and value. Hue, saturation, value and alpha also have labeled sliders and exact numeric inputs. Escape cancels a drag.</p>\`;
}`,"color-picker":`import { keyed } from 'lit/directives/keyed.js';
import { parseColor, serializeColor, colorPaint } from '@en-reve/elements/color-picker.js';
import type { EditorExtension, EditorPickerSession } from '@en-reve/elements/editor-extensions.js';
import type { TokenRun } from '@en-reve/elements/token-editor.js';

export const colorTokenStyles = css\`
  en-token-editor::part(color-swatch),en-rich-text-editor::part(color-swatch){
    background:repeating-conic-gradient(var(--en-color-slider-checker-light,#fff) 0% 25%,var(--en-color-slider-checker-dark,#b8b8b8) 0% 50%) 0 0 / calc(var(--en-color-slider-checker-size,.25rem) * 2) calc(var(--en-color-slider-checker-size,.25rem) * 2);
  }
  en-token-editor::part(color-swatch-paint),en-rich-text-editor::part(color-swatch-paint){display:block;inline-size:100%;block-size:100%;border-radius:inherit}
\`;
export const wideColor = 'color(display-p3 1 0.2 0.1 / 0.65)';
/** This application validates color payloads; the shared editor stays domain-independent. */
export function colorTokenRenderer(token: TokenRun): Node {
  const raw = (token.data as {color?: unknown} | undefined)?.color;
  const value = typeof raw === 'string' ? parseColor(raw) : undefined;
  if (!value) return document.createTextNode(token.text);
  const swatch = document.createElement('span');
  const paint = colorPaint(value, CSS.supports('color', 'color(display-p3 1 0 0)'));
  const fill = document.createElement('span');
  fill.part.add('color-swatch-paint');
  fill.style.backgroundColor = paint.fallback;
  fill.style.backgroundColor = paint.value;
  swatch.append(fill);
  swatch.part.add('color-swatch'); swatch.setAttribute('aria-hidden', 'true');
  return swatch;
}
export function commitColorToken(session: EditorPickerSession, raw: string): boolean {
  const parsed = parseColor(raw); if (!parsed) return false;
  const color = serializeColor(parsed);
  return session.commit({id:color,label:color,insert:[{kind:'token',id:session.token?.id ?? crypto.randomUUID(),type:'demo/color',text:color,label:\`Edit color \${color}\`,data:{color}}]});
}
/** One application-owned picker session used unchanged by the rich and token editors. */
export const wideColorExtension: EditorExtension = {
  id: 'colors', trigger: '#', label: 'Color picker',
  render: session => {
    const existing = (session.token?.data as {color?: unknown} | undefined)?.color;
    const parsed = parseColor(session.query) ?? (typeof existing === 'string' ? parseColor(existing) : undefined) ?? parseColor(wideColor)!;
    return html\`\${keyed(session.signal, html\`<div part="color-session">
      <en-color-picker part="color-picker" exportparts="base:color-base,summary:color-summary,formats:color-formats,channels:color-channels,preview:color-preview,preview-frame:color-preview-frame,space:color-space,gamut-message:color-gamut,conversion:color-conversion,plane:color-plane,plane-thumb:color-plane-thumb,plane-axes:color-plane-axes" label="Editor color" format="rgb" show-hex editable-channels alpha plane data-picker-focus .value=\${serializeColor(parsed)} @en-change=\${(event: Event) => event.stopPropagation()}></en-color-picker>
      <div part="color-actions"><en-button variant="secondary" @click=\${() => session.cancel()}>Cancel</en-button><en-button @click=\${(event: Event) => {
        const picker = (event.currentTarget as HTMLElement).closest('[part="color-session"]')!.querySelector<EnColorPicker>('en-color-picker')!;
        if (picker.reportValidity()) commitColorToken(session, picker.value);
      }}>Apply color</en-button></div>
    </div>\`)}\`;
  },
};

import { html, css, LitElement } from 'lit';
import { guard } from 'lit/directives/guard.js';
import { type EnColorPicker } from '@en-reve/elements/color-picker.js';
import type { EnTokenEditor } from '@en-reve/elements/token-editor.js';
import type { EnRichTextEditor } from '@en-reve/elements/rich-text-editor.js';

export class ColorSpacesDemo extends LitElement {
  static override properties = { current: { state: true }, veto: { state: true }, plane: { state: true } };
  static override styles = [colorTokenStyles, css\`
    :host{display:block;min-inline-size:0}section{display:grid;gap:var(--en-space-3,.75rem);min-inline-size:0}
    h2,h3,p{margin:0}.actions{display:flex;flex-wrap:wrap;align-items:center;gap:var(--en-space-2,.5rem)}
    .workspace,.picker-panel,.editor-panel{display:grid;gap:var(--en-space-3,.75rem);min-inline-size:0}
    .receipt{font-size:.875em;overflow-wrap:anywhere}
    code,pre{white-space:pre-wrap;overflow-wrap:anywhere}pre{font-size:.875em}
    en-token-editor::part(color-swatch),en-rich-text-editor::part(color-swatch){display:block;inline-size:1.2em;block-size:1.2em;border:1px solid currentColor;border-radius:.15em}
    :is(en-token-editor,en-rich-text-editor)::part(color-session){
      --color-session-padding:var(--en-space-4,1rem);
      --color-popup-padding:var(--en-option-list-padding,var(--en-overlay-padding,var(--en-space-2,.5rem)));
      display:grid;gap:var(--en-space-4,1rem);padding:var(--color-session-padding);container:editor-color / inline-size
    }
    :is(en-token-editor,en-rich-text-editor)::part(color-picker){--en-color-picker-inline-size:100%}
    :is(en-token-editor,en-rich-text-editor)::part(color-base){grid-template-areas:"summary" "formats" "conversion" "channels"}
    :is(en-token-editor,en-rich-text-editor)::part(color-summary){grid-area:summary;align-items:stretch}
    :is(en-token-editor,en-rich-text-editor)::part(color-formats){grid-area:formats}
    :is(en-token-editor,en-rich-text-editor)::part(color-channels){grid-area:channels;align-content:start}
    :is(en-token-editor,en-rich-text-editor)::part(color-conversion){grid-area:conversion;justify-self:start}
    :is(en-token-editor,en-rich-text-editor)::part(color-space),:is(en-token-editor,en-rich-text-editor)::part(color-gamut){display:none}
    :is(en-token-editor,en-rich-text-editor)::part(color-preview-frame){position:relative;align-self:stretch;inline-size:var(--en-color-picker-preview-size,3rem);min-block-size:3rem}
    :is(en-token-editor,en-rich-text-editor)::part(color-preview){position:absolute;inset:0;inline-size:100%;block-size:100%;aspect-ratio:auto;min-block-size:3rem}
    :is(en-token-editor,en-rich-text-editor)::part(color-actions){
      display:flex;flex-wrap:wrap;gap:var(--en-space-2,.5rem);justify-content:end;
      position:sticky;inset-block-end:calc(-1 * var(--color-popup-padding));z-index:2;
      margin-inline:calc(-1 * (var(--color-session-padding) + var(--color-popup-padding)));
      margin-block-end:calc(-1 * (var(--color-session-padding) + var(--color-popup-padding)));
      padding:var(--en-space-2,.5rem) calc(var(--color-session-padding) + var(--color-popup-padding));
      border-block-start:var(--en-border-width,1px) solid var(--en-color-line);
      background:var(--en-option-list-background,var(--en-overlay-background,var(--en-color-surface-raised)))
    }
    @media(forced-colors:active){:is(en-token-editor,en-rich-text-editor)::part(color-actions){background:Canvas}}
    @container editor-color (min-width:40rem){
      :is(en-token-editor,en-rich-text-editor)::part(color-base){grid-template-columns:minmax(0,1fr) minmax(0,1fr);grid-template-rows:auto auto auto;grid-template-areas:"summary formats" "channels channels" "conversion conversion";align-items:start;column-gap:var(--en-space-4,1rem)}
    }
  \`];
  private declare current: string;
  private declare veto: boolean;
  private declare plane: boolean;
  private disposers: (()=>void)[] = [];
  private installation = 0;
  constructor(){super();this.current=wideColor;this.veto=false;this.plane=true;}
  private get picker(){return this.renderRoot.querySelector<EnColorPicker>('#wide-picker')!;}
  private editors(){return [...this.renderRoot.querySelectorAll<EnTokenEditor|EnRichTextEditor>('en-token-editor,en-rich-text-editor')];}
  protected override firstUpdated(){this.install();}
  override connectedCallback(){super.connectedCallback();if(this.hasUpdated)this.install();}
  override disconnectedCallback(){this.installation++;this.disposers.forEach(dispose=>dispose());this.disposers=[];super.disconnectedCallback();}
  private async install(){const revision=++this.installation;await Promise.all(['en-token-editor','en-rich-text-editor'].map(tag=>customElements.whenDefined(tag)));if(!this.isConnected||revision!==this.installation)return;for(const editor of this.editors())this.disposers.push(editor.registerExtension(wideColorExtension),editor.registerToken('demo/color',colorTokenRenderer,{extension:'colors',part:'color-token',deleteBehavior:'edit'}));}
  private load(value:string){this.picker.value=value;this.current=this.picker.value;}
  protected override render(){
    return html\`<section id="wide-color-example" aria-label="Wide-gamut color foundation">
      <h2>Color picker and editor tokens</h2>
      <p>Drag within the saturation/value plane, or use the equivalent sliders and small numeric fields. Hue uses the active color space. Escape cancels a drag; releasing commits it.</p>
      <div class="workspace"><div class="picker-panel">
      <div class="actions"><en-switch .checked=\${this.plane} @en-change=\${(event:CustomEvent)=>{this.plane=event.detail.proposed;}}>Use color plane</en-switch><en-button variant="secondary" @click=\${()=>this.load(wideColor)}>Load Display-P3 sample</en-button><en-button variant="secondary" @click=\${()=>this.load('#33669980')}>Load sRGB sample</en-button><label><input type="checkbox" .checked=\${this.veto} @change=\${(event:Event)=>{this.veto=(event.target as HTMLInputElement).checked;}}> Reject next color change</label></div>
      <en-color-picker id="wide-picker" label="Wide-gamut accent" format="rgb" alpha ?plane=\${this.plane} .value=\${guard([],()=>wideColor)} @en-change=\${(event:CustomEvent)=>{
        if(event.target!==event.currentTarget)return;
        if(this.veto){event.preventDefault();this.veto=false;}
        queueMicrotask(()=>{this.current=this.picker.value;});
      }}></en-color-picker>
      <p class="receipt">Accepted value: <output data-color-receipt>\${this.current}</output></p>
      </div><div class="editor-panel">
      <h3>Try it in an editor</h3><p>Type # or use Insert color. Apply inserts one token; Cancel preserves the original draft. Copy between editors, reopen the chip and use Undo to check that its CSS value and alpha survive.</p>
      <div class="actions"><en-button variant="secondary" @click=\${()=>this.editors()[0]?.openExtension('colors')}>Insert color in token editor</en-button><en-button variant="secondary" @click=\${()=>this.editors()[1]?.openExtension('colors')}>Insert color in rich editor</en-button></div>
      <en-token-editor id="color-token-editor" label="Color token editor"></en-token-editor>
      <en-rich-text-editor id="color-rich-editor" label="Color rich editor"></en-rich-text-editor>
      </div></div>
      <details><summary>Color-space and editor source</summary><pre><code>\${\`import { parseColor, serializeColor, convertColor, inGamut, exportSRGB } from '@en-reve/elements/color-picker.js';
picker.value = 'color(display-p3 1 0.2 0.1 / 0.65)';
picker.plane = true; // HSV plane + equivalent Hue/Saturation/Value controls.
// en-input previews a drag; en-change commits once, cancelably, on release.
// Escape or pointer cancellation restores the accepted color.
const color = picker.colorValue; // Same accepted state as value.
const converted = convertColor(color, 'srgb'); // Extended coordinates; no clipping.
const fits = inGamut(converted);
const output = exportSRGB(color); // Explicit clipping; output.clipped reports loss.
// Merely changing picker.format never converts the accepted value.
// Application-owned editor extension, shared by both backends:
editor.registerExtension({ id: 'colors', trigger: '#', label: 'Color picker',
  render: session => renderPickerWithApplyAndCancel(session),
});
// Apply uses session.commit({insert:[{kind:'token', type:'demo/color',
//   id: existingId, text: picker.value, data: {color: picker.value}}]});
// Cancel uses session.cancel(); preserve existingId when editing.
// Parse domain payloads before rendering; unrecognized colors stay readable text.\`}</code></pre></details>
    </section><en-color-wheel-demo></en-color-wheel-demo>\`;
  }
}
if(!customElements.get('en-color-spaces-demo'))customElements.define('en-color-spaces-demo',ColorSpacesDemo);

/** App-owned composition: controls exchange accepted colors, never draft writes. */
class ColorWheelDemo extends LitElement {
  static override properties={color:{state:true},preview:{state:true},veto:{state:true}};
  static override styles=css\`
    :host{display:block;margin-block-start:2rem;min-inline-size:0}
    section{display:grid;gap:var(--en-space-4,1rem)}h2,p{margin:0}
    .controls{display:grid;gap:2rem;align-items:start;min-inline-size:0}
    .sample{display:flex;gap:.75rem;align-items:center;flex-wrap:wrap}
    .swatch{inline-size:3rem;block-size:3rem;border:1px solid var(--en-color-boundary);border-radius:var(--en-radius-control,.25rem);background:repeating-conic-gradient(#fff 0% 25%,#b8b8b8 0% 50%) 0 0 / 1rem 1rem;overflow:hidden}
    .swatch span{display:block;inline-size:100%;block-size:100%}
    code,pre{white-space:pre-wrap;overflow-wrap:anywhere}pre{font-size:.875em}
    @media(min-width:48rem){.controls{grid-template-columns:minmax(12rem,16rem) minmax(0,1fr)}}
  \`;
  private declare color:string;
  private declare preview:string;
  private declare veto:boolean;
  constructor(){super();this.color='color(display-p3 0.3 0.5 0.8 / 0.65)';this.preview=this.color;this.veto=false;}
  private change(event:CustomEvent){
    if(this.veto){event.preventDefault();this.veto=false;}
    const source=event.currentTarget as HTMLElement & {value:string};
    queueMicrotask(()=>{this.color=source.value;this.preview=this.color;});
  }
  protected override render(){return html\`<section id="color-wheel-example" aria-label="Standalone color wheel composition">
    <h2>Compose a hue wheel and color plane</h2>
    <p>The wheel edits hue only. The plane edits saturation and brightness; both preserve the accepted color space and alpha. Try Arrow keys (1°), Page Up/Down (10°), Home/End, or the exact Hue field. Escape cancels a drag.</p>
    <div class="sample"><en-button variant="secondary" @click=\${()=>{this.color='#5577cc80';this.preview=this.color;}}>Load sRGB color</en-button><en-button variant="secondary" @click=\${()=>{this.color='color(display-p3 0.3 0.5 0.8 / 0.65)';this.preview=this.color;}}>Load P3 color</en-button><en-checkbox .checked=\${this.veto} @en-change=\${(e:CustomEvent)=>{this.veto=e.detail.proposed;}}>Reject next change</en-checkbox></div>
    <div class="controls">
      <en-color-wheel id="standalone-wheel" label="Accent hue wheel" .value=\${this.color} @en-input=\${(e:CustomEvent)=>{this.preview=e.detail.value;}} @en-change=\${this.change}></en-color-wheel>
      <en-color-plane id="composed-plane" label="Accent saturation and brightness" alpha .value=\${this.color} @en-input=\${(e:CustomEvent)=>{this.preview=e.detail.value;}} @en-change=\${this.change}></en-color-plane>
    </div>
    <div class="sample"><span class="swatch" aria-hidden="true"><span style=\${\`background:\${this.preview}\`}></span></span><p>Accepted color: <output data-wheel-value>\${this.color}</output></p></div>
    <details><summary>Wheel and plane source</summary><pre><code>\${\`import '@en-reve/elements/define/color-wheel.js';
import '@en-reve/elements/define/color-plane.js';
const controls = [wheel, plane];
for (const source of controls) {
  source.value = 'color(display-p3 0.3 0.5 0.8 / 0.65)';
  source.addEventListener('en-input', event => preview(event.detail.value));
  source.addEventListener('en-change', event => {
    // Call event.preventDefault() here if the application rejects this color.
    queueMicrotask(() => {
      // Read the settled state: another listener may veto or replace the proposal.
      for (const target of controls) if (target !== source) target.value = source.value;
      preview(source.value);
    });
  });
}
// The picker default is unchanged; import and compose the wheel only when needed.
// CSS: en-color-wheel { --en-color-wheel-size: 14rem; }
// ::part(control), ::part(ring), ::part(thumb), ::part(editor-field), ::part(editor), ::part(editor-label), ::part(error)\`}</code></pre></details>
  </section>\`;}
}
if(!customElements.get('en-color-wheel-demo'))customElements.define('en-color-wheel-demo',ColorWheelDemo);

export function colorPickerExample() {
  return html\`<en-color-spaces-demo></en-color-spaces-demo><h2>sRGB baseline</h2><en-color-picker id="basic-color-picker" label="Accent color" value="#336699"></en-color-picker>
    <p>Adjust the labeled RGB sliders, or enter a three- or six-digit hex color and press Enter. Choose HEX, RGB or HSL; enable Alpha to adjust transparency. Applications can supply palette and recent-color controls through slots.</p>\`;
}`,"color-field":`import { html } from 'lit';

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
	return html\`
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
				@en-change=\${updateSample}
			></en-color-field>
		</div>
		<p>The field owns the value. This example updates the separate swatch after an accepted change.</p>
	\`;
}`,"checkboxes-switches":`import { html } from 'lit';

export function checkboxesSwitchesExample() {
	return html\`
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
	\`;
}`,"radio-group":`import { html } from 'lit';

export function radioGroupExample() {
	return html\`
		<en-radio-group label="Export quality" value="balanced">
			<span slot="description">Balance <strong>file size</strong> and detail.</span>
			<en-radio value="small">Smaller file</en-radio>
			<en-radio value="balanced" checked>Balanced</en-radio>
			<en-radio value="best" description="Larger exports.">Highest quality</en-radio>
		</en-radio-group>
	\`;
}`,opacity:`import { html } from 'lit';

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
	return html\`
		<en-slider
			label="Layer opacity"
			value="64"
			min="0"
			max="100"
			step="1"
			editable
			@en-change=\${updatePreview}
		>
			<span slot="label">Layer opacity</span>
			<span slot="description">Enter an exact value, then press <kbd>Enter</kbd> or leave the field to apply. <kbd>Escape</kbd> restores the current value.</span>
		</en-slider>
		<div class="opacity-preview">
			<span class="opacity-sample" aria-hidden="true" style="opacity:0.64"></span>
			<span>Layer opacity preview</span>
		</div>
	\`;
}`,"vertical-slider":`import { html } from 'lit';

export function verticalSliderExample() {
	return html\`
		<en-slider orientation="vertical" value="32" min="1" max="96" step="1" editable>
			<span slot="label">Brush size</span>
			<span slot="description">Size in pixels. Move upward to increase, or enter an exact value below.</span>
		</en-slider>
	\`;
}`,rating:`import { html } from 'lit';

export function ratingExample() {
	return html\`
		<en-rating value="3" max="5">
			<span slot="label">How useful is this concept?</span>
			<span slot="description">Choose <strong>No rating</strong> to clear the value.</span>
		</en-rating>
	\`;
}`,"tree-view":`import { html } from 'lit';
import { guard } from 'lit/directives/guard.js';





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
			if (result) result.textContent = detail.reason === 'selection' ? \`Selected \${tree.value}.\` : 'Project outline expansion updated.';
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
	return html\`
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
				<en-tree id="specimen-tree" label="Project outline" value="cover" .expanded=\${guard([], () => treeInitialExpansion)} @en-change=\${changed}>
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
			<div class="specimen-row"><en-button variant="secondary" @click=\${toggleCaption}>Remove or restore Caption</en-button></div>
			<p data-tree-result role="status">Cover selected. Artwork is expanded.</p>
		</div>
	\`;
}`,"composable-chat":`import { html, css } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import { parseColor, serializeColor, colorPaint, type EnColorPicker } from '@en-reve/elements/color-picker.js';
import type { EditorExtension, EditorPickerSession } from '@en-reve/elements/editor-extensions.js';
import type { TokenRun } from '@en-reve/elements/token-editor.js';

export const colorTokenStyles = css\`
  en-token-editor::part(color-swatch),en-rich-text-editor::part(color-swatch){
    background:repeating-conic-gradient(var(--en-color-slider-checker-light,#fff) 0% 25%,var(--en-color-slider-checker-dark,#b8b8b8) 0% 50%) 0 0 / calc(var(--en-color-slider-checker-size,.25rem) * 2) calc(var(--en-color-slider-checker-size,.25rem) * 2);
  }
  en-token-editor::part(color-swatch-paint),en-rich-text-editor::part(color-swatch-paint){display:block;inline-size:100%;block-size:100%;border-radius:inherit}
\`;
export const wideColor = 'color(display-p3 1 0.2 0.1 / 0.65)';
/** This application validates color payloads; the shared editor stays domain-independent. */
export function colorTokenRenderer(token: TokenRun): Node {
  const raw = (token.data as {color?: unknown} | undefined)?.color;
  const value = typeof raw === 'string' ? parseColor(raw) : undefined;
  if (!value) return document.createTextNode(token.text);
  const swatch = document.createElement('span');
  const paint = colorPaint(value, CSS.supports('color', 'color(display-p3 1 0 0)'));
  const fill = document.createElement('span');
  fill.part.add('color-swatch-paint');
  fill.style.backgroundColor = paint.fallback;
  fill.style.backgroundColor = paint.value;
  swatch.append(fill);
  swatch.part.add('color-swatch'); swatch.setAttribute('aria-hidden', 'true');
  return swatch;
}
export function commitColorToken(session: EditorPickerSession, raw: string): boolean {
  const parsed = parseColor(raw); if (!parsed) return false;
  const color = serializeColor(parsed);
  return session.commit({id:color,label:color,insert:[{kind:'token',id:session.token?.id ?? crypto.randomUUID(),type:'demo/color',text:color,label:\`Edit color \${color}\`,data:{color}}]});
}
/** One application-owned picker session used unchanged by the rich and token editors. */
export const wideColorExtension: EditorExtension = {
  id: 'colors', trigger: '#', label: 'Color picker',
  render: session => {
    const existing = (session.token?.data as {color?: unknown} | undefined)?.color;
    const parsed = parseColor(session.query) ?? (typeof existing === 'string' ? parseColor(existing) : undefined) ?? parseColor(wideColor)!;
    return html\`\${keyed(session.signal, html\`<div part="color-session">
      <en-color-picker part="color-picker" exportparts="base:color-base,summary:color-summary,formats:color-formats,channels:color-channels,preview:color-preview,preview-frame:color-preview-frame,space:color-space,gamut-message:color-gamut,conversion:color-conversion,plane:color-plane,plane-thumb:color-plane-thumb,plane-axes:color-plane-axes" label="Editor color" format="rgb" show-hex editable-channels alpha plane data-picker-focus .value=\${serializeColor(parsed)} @en-change=\${(event: Event) => event.stopPropagation()}></en-color-picker>
      <div part="color-actions"><en-button variant="secondary" @click=\${() => session.cancel()}>Cancel</en-button><en-button @click=\${(event: Event) => {
        const picker = (event.currentTarget as HTMLElement).closest('[part="color-session"]')!.querySelector<EnColorPicker>('en-color-picker')!;
        if (picker.reportValidity()) commitColorToken(session, picker.value);
      }}>Apply color</en-button></div>
    </div>\`)}\`;
  },
};

import { LitElement } from 'lit';
import type {EnTokenEditor,DocumentValue} from '@en-reve/elements/token-editor.js';
import type { EditorChoice } from '@en-reve/elements/editor-extensions.js';
import { normalizeHexColor } from '@en-reve/elements/color-picker.js';
import type {ChatEditorSnapshot} from '@en-reve/elements/chat-composer.js';
/** All domain concepts are defined in this application fixture, outside the editor. */
export class ComposableChatDemo extends LitElement {
 static override properties={status:{state:true},sent:{state:true},colorMode:{state:true}};
 static override styles=[colorTokenStyles, css\`
 en-token-editor::part(color-session){
  --color-session-padding:var(--en-space-4,1rem);
  --color-popup-padding:var(--en-option-list-padding,var(--en-overlay-padding,var(--en-space-2,.5rem)));
  display:grid;gap:var(--en-space-4,1rem);padding:var(--color-session-padding);container:chat-color / inline-size
 }
 en-token-editor::part(color-tab-list){
  position:sticky;inset-block-start:calc(-1 * var(--color-popup-padding));z-index:2;
  border-block-end:var(--en-border-width,1px) solid var(--en-color-line);
  margin-block-start:calc(-1 * (var(--color-session-padding) + var(--color-popup-padding)));
  margin-inline:calc(-1 * (var(--color-session-padding) + var(--color-popup-padding)));
  padding:var(--color-session-padding) calc(var(--color-session-padding) + var(--color-popup-padding));
  padding-block-start:var(--en-space-2,.5rem);
  padding-block-end:0;
  background:var(--en-option-list-background,var(--en-overlay-background,var(--en-color-surface-raised)));
 }
 @media(forced-colors:active){en-token-editor::part(color-tab-list),en-token-editor::part(color-actions){background:Canvas}}
 en-token-editor::part(color-tab){border-block-end:0}
 en-token-editor::part(chat-color-picker){--en-color-picker-inline-size:100%}
 en-token-editor::part(chat-color-base){grid-template-areas:"summary" "formats" "channels"}
 en-token-editor::part(chat-color-summary){grid-area:summary;align-items:stretch}
 en-token-editor::part(chat-color-formats){grid-area:formats}
 en-token-editor::part(chat-color-channels){grid-area:channels;align-content:start}
 en-token-editor::part(chat-color-preview-frame){position:relative;align-self:stretch;inline-size:var(--en-color-picker-preview-size,3rem);min-block-size:3rem}
 en-token-editor::part(chat-color-preview){position:absolute;inset:0;inline-size:100%;block-size:100%;aspect-ratio:auto;min-block-size:3rem}
 en-token-editor::part(color-actions){
  display:flex;flex-wrap:wrap;justify-content:flex-end;gap:var(--en-space-2,.5rem);
  position:sticky;inset-block-end:calc(-1 * var(--color-popup-padding));z-index:2;
  border-block-start:var(--en-border-width,1px) solid var(--en-color-line);
  margin-inline:calc(-1 * (var(--color-session-padding) + var(--color-popup-padding)));
  margin-block-end:calc(-1 * (var(--color-session-padding) + var(--color-popup-padding)));
  padding-block:var(--en-space-2,.5rem);
  padding-inline:calc(var(--color-session-padding) + var(--color-popup-padding));
  background:var(--en-option-list-background,var(--en-overlay-background,var(--en-color-surface-raised)));
 }
 @container chat-color (min-width:40rem){
  en-token-editor::part(chat-color-base){grid-template-columns:minmax(0,1fr) minmax(0,1fr);grid-template-rows:auto 1fr;grid-template-areas:"summary channels" "formats channels";column-gap:var(--en-space-4,1rem);row-gap:var(--en-space-3,.75rem);align-items:start}
  en-token-editor::part(chat-color-formats){align-self:start}
 }
:host{display:block;margin-block-start:2rem;min-inline-size:0}section{display:grid;gap:var(--en-space-3,.75rem)}.tools{display:flex;flex-wrap:wrap;gap:var(--en-space-2,.5rem)}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;font-size:.875em}h2,p{margin:0}en-token-editor::part(color-swatch),en-token-editor::part(color-option-swatch){display:inline-block;vertical-align:middle;inline-size:1.1em;block-size:1.1em;border:1px solid currentColor;border-radius:.15em}en-token-editor::part(color-swatch){display:block}en-token-editor::part(color-option-swatch){margin-inline-end:.5em}.message{padding:var(--en-space-3,.75rem);border:1px solid var(--en-color-line);border-radius:var(--en-radius-container,.5rem)}\`];
 private declare status:string;private declare sent:ChatEditorSnapshot|undefined;private sequence=0;
 private declare colorMode:'picker'|'native'|'typeahead';
 private recentColors:string[]=[];
 private disposers:(()=>void)[]=[];
 private get editor(){return this.renderRoot.querySelector<EnTokenEditor>('en-token-editor');}
 private references:EditorExtension={id:'references',trigger:'@',label:'References',provide:async({query,signal})=>{
  await new Promise(resolve=>setTimeout(resolve,120));if(signal.aborted)return [];
  return [{id:'mira',label:'Mira',description:'Design collaborator'},{id:'cover',label:'Cover study',description:'Project reference'}].filter(item=>item.label.toLowerCase().includes(query.toLowerCase())).map(item=>({...item,insert:[{kind:'token' as const,id:\`reference-\${++this.sequence}\`,type:'demo/reference',text:\`@\${item.label}\`,label:\`\${item.label}, reference\`,data:{referenceId:item.id}}]}));
 }};
 private tools:EditorExtension={id:'tools',trigger:'/',label:'Tools',provide:({query})=>[{id:'summarize',label:'Summarize',description:'Insert the summary tool'},{id:'outline',label:'Outline',description:'Insert the outline tool'}].filter(item=>item.label.toLowerCase().includes(query.toLowerCase())).map(item=>({...item,insert:[{kind:'token' as const,id:\`tool-\${++this.sequence}\`,type:'demo/tool',text:\`/\${item.label}\`,label:\`\${item.label}, tool\`,data:{toolId:item.id}}]}))};
 private nativeColors:EditorExtension={id:'colors',trigger:'#',label:'Color picker',match:before=>/(^|\\s)#$/.test(before)?{from:before.length-1,query:''}:undefined,open:session=>this.openColorPicker(session)};
 private get colors(){return this.colorMode==='native'?this.nativeColors:this.colorMode==='typeahead'?this.typeaheadColors:this.customColors;}
 private customColors:EditorExtension={id:'colors',trigger:'#',label:'Color picker',render:session=>{
  const choices=this.colorChoices(session.query).filter(choice=>(choice.data as {color?:string})?.color);
  const exact=choices.find(choice=>choice.label.toLowerCase()===session.query.toLowerCase());
  const color=normalizeHexColor(session.query)??(exact?.data as {color?:string}|undefined)?.color??String((session.token?.data as {color?:string}|undefined)?.color??'#5577cc');
  const pickerFrom=(event:Event)=>(event.currentTarget as HTMLElement).closest('[data-color-session]')!.querySelector<EnColorPicker>('en-color-picker')!;
  return html\`\${keyed(session.signal,html\`<div data-color-session part="color-session">
    <en-tabs label="Color selection" value="picker" exportparts="tab-list:color-tab-list" @en-change=\${(event:Event)=>event.stopPropagation()}>
      <en-tab slot="tab" value="picker" exportparts="base:color-tab">Picker</en-tab><en-tab slot="tab" value="chips" exportparts="base:color-tab">Chips</en-tab>
      <en-tab-panel slot="panel" value="picker"><en-color-picker part="chat-color-picker" exportparts="base:chat-color-base,summary:chat-color-summary,formats:chat-color-formats,channels:chat-color-channels,preview:chat-color-preview,preview-frame:chat-color-preview-frame" data-picker-focus label="Message color" show-hex editable-channels .value=\${color} .alpha=\${(parseColor(color)?.alpha??1)!==1} @en-change=\${(event:Event)=>event.stopPropagation()}></en-color-picker></en-tab-panel>
      <en-tab-panel slot="panel" value="chips" hidden>
        <div role="group" aria-label="Matching palette and recent colors" style="display:flex;flex-wrap:wrap;gap:var(--en-space-2,.5rem)">
          \${choices.map(choice=>html\`<en-swatch color=\${String((choice.data as {color:string}).color)} label=\${choice.label} @click=\${(event:Event)=>{
            const picker=pickerFrom(event);picker.value=String((choice.data as {color:string}).color);
            (event.currentTarget as HTMLElement).closest('[data-color-session]')!.querySelector('[data-color-choice]')!.textContent=\`\${choice.label} selected. Apply color to insert it.\`;
          }}></en-swatch>\`)}
        </div><p data-color-choice role="status">\${choices.length?'Choose a color, then Apply.':'No matching chips. Try a different name or use the Picker tab.'}</p>
      </en-tab-panel>
    </en-tabs>
    <div part="color-actions">
      <en-button variant="secondary" @click=\${()=>session.cancel()}>Cancel</en-button>
      <en-button @click=\${async(event:Event)=>{const picker=pickerFrom(event);if(!picker.checkValidity()){
        const tabs=picker.closest('en-tabs') as HTMLElement&{value:string;updateComplete:Promise<unknown>};tabs.value='picker';await tabs.updateComplete;picker.reportValidity();return;
      }this.commitColor(session,picker.value);}}>Apply color</en-button>
    </div>
  </div>\`)}\`;
 }};
 private typeaheadColors:EditorExtension={
  id:'colors',trigger:'#',label:'Colors',
  provide:({query})=>this.colorChoices(query),
  renderOption:choice=>{
   const color=(choice.data as {color?:string}|undefined)?.color;
   return html\`<span>\${color?html\`<span part="color-option-swatch" aria-hidden="true" style=\${\`background-color:\${color}\`}></span>\`:''}\${choice.label}</span>\`;
  },
  select:(choice,session)=>{
   const color=(choice.data as {color?:string}|undefined)?.color;
   if(color)this.commitColor(session,color);
   else session.openPicker(picker=>this.openColorPicker(picker));
  },
 };
 private colorChoices(query:string):EditorChoice[]{
  const text=query.toLowerCase();const choices:EditorChoice[]=[];
  const hex=normalizeHexColor(text);
  if(hex)choices.push({id:hex,label:\`Use \${hex}\`,description:'Custom color',data:{color:hex}});
  for(const color of this.recentColors.filter(color=>!text||color.includes(text)))if(color!==hex)choices.push({id:'recent-'+color,label:\`Recent \${color}\`,data:{color}});
  for(const [name,color] of [['Blue','#336699'],['Sky blue','#38bdf8'],['Red','#dc2626'],['Green','#16a34a'],['Violet','#8b5cf6'],['Amber','#f59e0b'],['P3 coral',wideColor]]){
   if((!text||name.toLowerCase().includes(text)||color.includes(text))&&color!==hex&&!choices.some(c=>(c.data as {color?:string})?.color===color))choices.push({id:color,label:name,description:color,data:{color}});
  }
  choices.push({id:'native-picker',label:'Choose another color…',description:'Open the native color picker'});
  return choices;
 }
 private commitColor(session:EditorPickerSession,color:string){
  const parsed=parseColor(color);if(!parsed)return;color=serializeColor(parsed);
  if(session.commit({id:color,label:color,insert:[{kind:'token',id:session.token?.id??\`color-\${++this.sequence}\`,type:'demo/color',text:color,label:\`Edit color \${color}\`,data:{color}}]}))this.recentColors=[color,...this.recentColors.filter(value=>value!==color)].slice(0,5);
 }
 private openColorPicker(session:EditorPickerSession){
  const input=this.renderRoot.querySelector<HTMLInputElement>('[data-native-color]')!;
  const anchor=session.getAnchorRect();
  Object.assign(input.style,{left:\`\${anchor.left}px\`,top:\`\${anchor.top}px\`,width:\`\${Math.max(1,anchor.width)}px\`,height:\`\${Math.max(1,anchor.height)}px\`});
  const initial=String((session.token?.data as {color?:string}|undefined)?.color??this.colorChoices(session.query).find(choice=>choice.description==='Custom color')?.id??'#5577cc');
  if(!normalizeHexColor(initial)){session.cancel();this.status='Use the inline picker to edit this color without losing its color space or precision.';return;}
  input.value=initial.slice(0,7);
  const commit=()=>this.commitColor(session,input.value+(initial.length===9?initial.slice(7):''));
  input.addEventListener('change',commit,{signal:session.signal});
  input.addEventListener('cancel',()=>session.cancel(),{signal:session.signal});
  // Kept in the triggering input/click call stack for browser user activation.
  // Some native choosers do not emit cancel. A new page interaction ends that session.
  this.ownerDocument.addEventListener('pointerdown',event=>{if(!event.composedPath().includes(input))session.cancel();},{capture:true,signal:session.signal});
  this.ownerDocument.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();session.cancel();}},{capture:true,signal:session.signal});
  try{if(typeof input.showPicker==='function'){input.showPicker();return;}}catch{/* Fall back to native input activation. */}
  input.click();
 }
 constructor(){super();this.colorMode='picker';this.status='Try @ for references, / for tools, or # for colors. Nothing is sent outside this page.';}
 override connectedCallback(){super.connectedCallback();if(this.hasUpdated)this.installRenderers();}
 protected override firstUpdated(){this.installRenderers();}
 private installRenderers(){
  const editor=this.editor!;
  for(const [type,extension,part] of [['demo/reference','references','reference-token'],['demo/tool','tools','tool-token']])this.disposers.push(editor.registerToken(type,token=>document.createTextNode(token.text),{extension,part,deleteBehavior:'edit'}));
  this.disposers.push(editor.registerToken('demo/color',colorTokenRenderer,{extension:'colors',part:'color-token',deleteBehavior:'edit'}));
 }
 override disconnectedCallback(){this.disposers.forEach(dispose=>dispose());this.disposers=[];super.disconnectedCallback();}
 private loadSamples(){this.editor!.document={version:1,runs:[{kind:'text',text:'Ask '},{kind:'token',id:'sample-reference',type:'demo/reference',text:'@Mira',label:'Edit Mira reference',data:{referenceId:'mira'}},{kind:'text',text:' to use '},{kind:'token',id:'sample-tool',type:'demo/tool',text:'/Summarize',label:'Edit Summarize tool',data:{toolId:'summarize'}},{kind:'text',text:' with '},{kind:'token',id:'sample-color',type:'demo/color',text:'#5577cc',label:'Edit color #5577cc',data:{color:'#5577cc'}},{kind:'text',text:'.'}]};}
 private action=(event:CustomEvent)=>{if(event.detail.action==='send'){this.sent=event.detail.data;this.status='Message captured locally. Use Restore draft to recover its original text and token data.';}};
 protected override render(){return html\`<section aria-labelledby="advanced-title"><h2 id="advanced-title">Composable editor extensions</h2><p>The editor contains no built-in reference, tool or color concepts. This example supplies them using three declarative extension elements.</p><en-select label="Color entry" .value=\${this.colorMode} .items=\${[{value:'picker',label:'Inline color picker'},{value:'native',label:'Native picker first'},{value:'typeahead',label:'Typeahead first'}]} @en-change=\${(event:Event)=>{this.colorMode=(event.currentTarget as HTMLElement&{value:'picker'|'native'|'typeahead'}).value;}}></en-select><p>\${this.colorMode==='picker'?'Type # to open the color controls directly. Use Picker for HEX/RGB/HSL and alpha, or Chips for palette/recent choices. Keep typing a hex value or palette name to update the picker; Enter or Down Arrow moves into its controls. Apply inserts a chip; Cancel keeps your text.':this.colorMode==='native'?'Type # to open the native picker immediately.':'Type #blu for named colors or #336699 for a hex color; use Arrow keys and Enter. Empty # includes recent colors. Choose another color opens the native picker.'}</p><input data-native-color type="color" tabindex="-1" aria-hidden="true" style="position:fixed;width:1px;height:1px;margin:0;padding:0;border:0;opacity:0;pointer-events:none"><en-chat-composer @en-action=\${this.action}><en-token-editor slot="editor" id="structured-draft" label="Structured message"></en-token-editor><div slot="tools" class="tools"><en-button variant="secondary" @click=\${()=>this.editor?.openExtension('references')}>References</en-button><en-button variant="secondary" @click=\${()=>this.editor?.openExtension('tools')}>Tools</en-button><en-button variant="secondary" @click=\${()=>this.editor?.openExtension('colors')}>Colors</en-button></div></en-chat-composer><en-editor-trigger for="structured-draft" .extension=\${this.references}></en-editor-trigger><en-editor-trigger for="structured-draft" .extension=\${this.tools}></en-editor-trigger><en-editor-trigger for="structured-draft" .extension=\${this.colors}></en-editor-trigger><div class="tools"><en-button variant="secondary" @click=\${()=>this.loadSamples()}>Load sample chips</en-button><en-button variant="secondary" @click=\${()=>this.editor?.undo()}>Undo edit</en-button><en-button variant="secondary" @click=\${()=>this.editor?.redo()}>Redo edit</en-button><en-button variant="secondary" ?disabled=\${!this.sent} @click=\${()=>{if(this.sent?.content)this.editor!.document=this.sent.content as unknown as DocumentValue;}}>Restore draft</en-button></div><p>Chip editing: click a chip to choose a replacement. Backspace immediately after a chip (or Delete immediately before it) restores its trigger and opens the picker. Type to refine @ or / (and # in typeahead mode); Escape leaves the editable trigger. Undo restores the chip. Selecting a text range still deletes that range normally.</p><p role="status">\${this.status}</p>\${this.sent?html\`<div class="message"><strong>Captured message</strong><p>\${this.sent.value}</p><details><summary>Structured snapshot</summary><pre>\${JSON.stringify(this.sent.content,null,2)}</pre></details></div>\`:''}<details><summary>Extension composition API</summary><pre>\${\`<en-chat-composer>
  <en-token-editor id="draft" slot="editor" label="Message"></en-token-editor>
</en-chat-composer>
<en-editor-trigger for="draft"></en-editor-trigger>

trigger.extension = {
  id: 'references', trigger: '@', label: 'References',
  provide: async ({query, signal}) => findReferences(query, signal),
};
// Or register imperatively; dispose when this integration disconnects:
const dispose = editor.registerExtension(extension);
// Compose a reusable picker; the application owns Apply and Cancel:
editor.registerExtension({
  id: 'colors', trigger: '#', label: 'Color picker',
  render: session => html\\\`
    <en-color-picker .value=\\\${colorFromQuery(session.query)}></en-color-picker>
    <button @click=\\\${() => commitChosenColor(session)}>Apply color</button>
    <button @click=\\\${() => session.cancel()}>Cancel</button>
  \\\`,
});
// colorFromQuery and commitChosenColor are application helpers.
// Native pickers can still open synchronously, preserving user activation:
editor.registerExtension({
  id: 'colors', trigger: '#', label: 'Color picker',
  open: session => openNativeColorPicker(session),
});
// Or install a typeahead-first color extension instead:
editor.registerExtension({
  id: 'colors', trigger: '#', label: 'Colors',
  provide: ({query}) => findColors(query),
  renderOption: choice => renderColorOption(choice),
  select: (choice, session) => {
    if (choice.id === 'native-picker') {
      session.openPicker(openNativeColorPicker);
    } else {
      session.commit(choice); // The choice supplies insertion runs.
    }
  },
});
// renderOption returns noninteractive contents; choice.label names the option.
// The editor retains Arrow/Enter handling and option selection.
// The application owns the native input and commits on change.
// session.token contains the existing occurrence when editing.
// Use session.signal to clean up listeners and session.cancel()
// when dismissed. Alternatively supply render(session) for an
// inline custom picker in the editor's popup.
editor.registerToken('demo/color', renderColorSwatch, {
  extension: 'colors', part: 'color-token', deleteBehavior: 'edit',
});
// Atomic deletion remains the default without deleteBehavior.
editor.editToken('reference-1', {query: 'Mi'});
// Converts that occurrence to @Mi and opens its reference picker.
// ::part(token) styles all chips; ::part(color-token) styles color wrappers.
// Renderer-created descendants can expose their own parts:
// swatch.setAttribute('part', 'color-swatch');
// swatch.style.backgroundColor = validatedColor;
// en-token-editor::part(color-swatch) { border-radius: 50%; }
// Keep size, border and layout in CSS; only the chosen color is inline.
// Or open an existing occurrence from application UI:
editor.openExtension('colors', {tokenId: 'color-1'});\`}</pre></details></section>\`;}
}

if (!customElements.get('en-composable-chat-demo')) customElements.define('en-composable-chat-demo', ComposableChatDemo);

export function composableChatExample(){return html\`<en-composable-chat-demo></en-composable-chat-demo>\`;}`,"rich-text":`import {html} from 'lit';
import {AsyncDirective,directive} from 'lit/async-directive.js';
import {ref} from 'lit/directives/ref.js';
import {guard} from 'lit/directives/guard.js';
import type {EnRichTextEditor,RichDocument} from '@en-reve/elements/rich-text-editor.js';
import type {EnTokenEditor} from '@en-reve/elements/token-editor.js';
import type {EditorExtension} from '@en-reve/elements/editor-extensions.js';

// These same objects work with either backend and with a composer-owned editor.
const references:EditorExtension={id:'references',trigger:'@',label:'Project references',provide:({query,signal})=>signal.aborted?[]:['Cover study','Brand guide','Alex Kim'].filter(label=>label.toLowerCase().includes(query.toLowerCase())).map(label=>({id:label,label,insert:[{kind:'token',id:crypto.randomUUID(),type:'reference',text:\`@\${label}\`,label,data:{project:label}}]}))};
const tools:EditorExtension={id:'tools',trigger:'/',label:'Tools',provide:({query})=>[
 {id:'review',label:'Review tool',insert:[{kind:'token' as const,id:crypto.randomUUID(),type:'tool',text:'/review',label:'Review',data:{tool:'review'}}]},
 {id:'outline',label:'Outline action',action:'outline',data:{tool:'outline'}},
].filter(choice=>choice.label.toLowerCase().includes(query.toLowerCase()))};
const initial:RichDocument={type:'en-rich-text',version:1,doc:{type:'doc',content:[
 {type:'heading',attrs:{level:2},content:[{type:'text',text:'A new direction'}]},
 {type:'paragraph',content:[{type:'text',text:'Select some words to format this project brief. '},{type:'text',text:'Make it yours.',marks:[{type:'strong'}]}]},
 {type:'paragraph',content:[{type:'text',text:'Type @ for references or / for tools. The application owns those choices.'}]},
]}};
class RichTextDemo extends AsyncDirective {
 private key:unknown;private root?:HTMLElement;private status='Nothing is sent outside this page.';
 private editors=new Map<HTMLElement,()=>void>();
 private connect=(element:Element|undefined)=>{this.root=element as HTMLElement|undefined;if(!element)return;void Promise.all(['en-rich-text-editor','en-token-editor'].map(name=>customElements.whenDefined(name))).then(()=>{if(!this.isConnected)return;this.setup();});};
 private setup(){for(const editor of this.root?.querySelectorAll<EnRichTextEditor|EnTokenEditor>('en-rich-text-editor,en-token-editor')??[]){if(this.editors.has(editor))continue;const dispose=[...(editor.id==='rich-brief'?[]:[editor.registerExtension(references)]),editor.registerExtension(tools),...['reference','tool'].map(type=>editor.registerToken(type,token=>{const span=document.createElement('span');span.textContent=token.text;return span;},{extension:type==='reference'?'references':'tools',deleteBehavior:'edit'}))];this.editors.set(editor,()=>dispose.forEach(fn=>fn()));}}
 protected override disconnected(){for(const dispose of this.editors.values())dispose();this.editors.clear();}
 protected override reconnected(){this.setup();}
 private refresh(){if(this.isConnected)this.setValue(this.render(this.key));}
 private action=(event:CustomEvent)=>{if(event.detail.action==='send'){event.preventDefault();this.status=\`Snapshot ready: \${event.detail.data.value}. Rich content is included in the send snapshot.\`;}else{this.status=\`Application action: \${event.detail.action}. No network request was made.\`;}this.refresh();};
 override render(key?:unknown){this.key=key;return html\`<section data-rich-text-demo \${ref(this.connect)} @en-action=\${this.action}>
 <style>
 [data-rich-text-demo]{display:grid;gap:var(--en-space-panel);min-inline-size:0;}
 [data-rich-text-demo] .editor-example{display:grid;gap:var(--en-space-3);min-inline-size:0;}
 [data-rich-text-demo] h3,[data-rich-text-demo] p{margin:0;}
 [data-rich-text-demo] .choices{display:flex;flex-wrap:wrap;gap:var(--en-space-2);align-items:end;}
 [data-rich-text-demo] en-rich-text-editor{--en-editor-max-size:24rem;}
 </style>
 <div class="editor-example"><h3>Project brief</h3><p>Use the persistent toolbar, or select text for contextual formatting. Alt+F10 enters a toolbar; Escape returns to your selection. Enter makes a paragraph; Shift+Enter makes a line break. Triple-click the content to select the whole draft.</p>
 <en-editor-toolbar id="brief-toolbar" for="rich-brief" label="Project formatting"></en-editor-toolbar>
 <en-editor-trigger for="rich-brief" .extension=\${references}></en-editor-trigger>
 <!-- Seed once; status updates must not replace the user's document or undo history. -->
 <en-rich-text-editor id="rich-brief" description="Explain the goal and intended audience. Use @ to reference project material." label="Project brief editor" .document=\${guard([],()=>initial)}></en-rich-text-editor>
 <en-editor-toolbar id="selection-toolbar" for="rich-brief" mode="contextual" label="Selection formatting" .commands=\${['bold','italic','link','unlink']}></en-editor-toolbar>
 <div class="choices"><en-button variant="secondary" @click=\${()=>{for(const editor of this.root?.querySelectorAll<EnRichTextEditor|EnTokenEditor>('en-rich-text-editor,en-token-editor')??[])editor.value=Array.from({length:40},(_,i)=>\`Paragraph \${i+1}: A longer project draft to review scrolling, selection and editing. Type @ or / here.\`).join('\\n\\n');}}>Load long drafts</en-button><en-select label="Contextual placement" value="auto" @en-change=\${(event:CustomEvent)=>{const bar=this.root?.querySelector<HTMLElement & {placement:string}>('#selection-toolbar');if(bar)bar.placement=event.detail.proposed;}}><en-select-option value="auto">Auto (dock on mobile)</en-select-option><en-select-option value="floating">Floating by selection</en-select-option><en-select-option value="docked">Dock at editor bottom</en-select-option></en-select><en-button variant="secondary" @click=\${()=>{const editor=this.root?.querySelector<EnRichTextEditor>('#rich-brief');if(editor)editor.document=initial;}}>Reset brief</en-button></div>
 </div>
 <div class="editor-example"><h3>Rich reply in the composer</h3><p>The composer submits a plain-text fallback and an immutable rich document. Both editors below use exactly the same reference and tool providers.</p>
 <en-editor-toolbar for="rich-reply" label="Reply formatting" .commands=\${['bold','italic','bullet-list','undo','redo']}></en-editor-toolbar>
 <en-chat-composer label="Rich reply composer"><en-rich-text-editor slot="editor" id="rich-reply" label="Rich reply"><span slot="description">Keep the reply focused on the <strong>next step</strong>.</span></en-rich-text-editor></en-chat-composer>
 <en-token-editor id="plain-reply" label="Token editor comparison"><span slot="description">Keep the reply focused on the <strong>next step</strong>.</span></en-token-editor>
 </div><p role="status" aria-label="Editor result">\${this.status}</p>
 <details><summary>Review and current boundaries</summary><ul><li>Select forward/backward across lines or paragraphs, apply formatting, edit a link, then undo and redo. Try all inspired themes above.</li><li>Type @ or /, filter, use Up/Down and Enter, then undo. Click a token to reopen its picker. Backspace after a chip or Delete before it restores editable trigger text and suggestions; Backspace again removes the trigger. Undo restores the chip.</li><li>Try keyboard, phone-width docking, zoom and scrolling with a selection. Opening a contextual toolbar does not steal focus.</li><li>Copy and paste text with a reference or tool between these editors. Compatible structured clipboard content retains registered tokens; rich formatting is retained by the rich editors. The token editor uses readable text for unsupported formatting. Undo the paste as one edit.</li><li>Load long drafts, scroll within an editor, place the caret midway through a line and type @ or /. Suggestions align with the leading edge of the trigger while you type. Wrapped queries keep that horizontal alignment, with vertical placement adjusted to leave the active line clear. Scrolling the trigger out of view uses the visible caret instead; resizing and RTL retain viewport clamping. Escape preserves the typed trigger.</li><li>Clipboard imports are validated; document APIs preserve only the supported schema. There is no upload, remote tool execution or collaborative transport.</li><li>Automated DOM/keyboard tests do not replace physical iOS/Android selection, IME or VoiceOver review.</li></ul></details>
 </section>\`;}
}
const richDemo=directive(RichTextDemo);
export function richTextExample(key?:unknown){return html\`\${richDemo(key)}\`;}`,carousel:`import { html } from 'lit';
import { AsyncDirective, directive } from 'lit/async-directive.js';
import type { CarouselItem, EnCarousel } from '@en-reve/elements/carousel.js';
import { repeat } from 'lit/directives/repeat.js';
import { guard } from 'lit/directives/guard.js';
// Separate decorative previews: application-owned slide nodes are never cloned.
const thumbnail = (background: string, foreground: string) => \`data:image/svg+xml,\${encodeURIComponent(\`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 70"><rect width="160" height="70" fill="\${background}"/><path d="M0 70 50 10 100 70Z M50 70 115 25 160 70Z" fill="\${foreground}"/></svg>\`)}\`;
class CarouselDemo extends AsyncDirective {
    private key: unknown;
    private auto = false;
    private cards = [1, 2, 3, 4, 5];
    private nextId = 6;
    private collection: CarouselItem[] = Array.from({ length: 1000 }, (_, index) => ({ key: \`study-\${index + 1}\`, label: \`Study \${index + 1}\`, thumbnail: thumbnail(index % 2 ? '#375a4c' : '#12263c', index % 2 ? '#dfba4b' : '#678d94') }));
    private readingList = false;
    private controls: 'none' | 'auto' | 'always' = 'auto';
    private navigation: 'none' | 'positions' | 'thumbnails' = 'thumbnails';
    private boundaries = true;
    private collectionItem = (item: CarouselItem, index: number) => html\`<article class="project-card"><span class="number" aria-hidden="true">\${String(index + 1).padStart(4, '0')}</span><h4>\${item.label}</h4><p>This study has a stable identity as the collection changes. Only nearby slides are mounted.</p><label>Personal note <input aria-label=\${\`Note for \${item.label}\`} placeholder="Try retaining focus while navigating"></label><a href="/workflows/assets?progress-report">Explore \${item.label}</a></article>\`;
    private dataCarousel(event: Event) { return (event.currentTarget as HTMLElement).closest('[data-carousel-demo]')?.querySelector<EnCarousel>('#large-carousel'); }
    private result = 'Choose a slide using the arrows, keyboard or a swipe.';
    private refresh() {
        if (this.isConnected)
            this.setValue(this.render(this.key));
    }
    private changed = (event: CustomEvent<{
        proposed: number;
        reason: string;
    }>) => {
        if (event.target !== event.currentTarget)
            return;
        queueMicrotask(() => {
            if (event.defaultPrevented)
                return;
            this.result = \`Leading slide \${event.detail.proposed + 1} · \${event.detail.reason}\`;
            this.refresh();
        });
    };
    override render(key?: unknown) {
        this.key = key;
        return html \`<section data-carousel-demo>
 <style>
 [data-carousel-demo]{display:grid;gap:var(--en-space-panel);min-inline-size:0;}
 [data-carousel-demo] h3,[data-carousel-demo] p,[data-carousel-demo] figure{margin:0;}
 [data-carousel-demo] .demo-section{display:grid;gap:var(--en-space-3);min-inline-size:0;}
 [data-carousel-demo] figure{display:grid;gap:var(--en-space-3);padding:var(--en-space-3);}
 [data-carousel-demo] .cover{inline-size:100%;display:block;aspect-ratio:16/7;border-radius:var(--en-radius-control);}
 [data-carousel-demo] figcaption{display:grid;gap:var(--en-space-1);}
 [data-carousel-demo] .demo-actions{display:flex;flex-wrap:wrap;gap:var(--en-space-2);align-items:center;}
 [data-carousel-demo] .responsive-cards{container-type:inline-size;min-inline-size:0;}
 [data-carousel-demo] .project-card{display:flex;flex-direction:column;gap:var(--en-space-3);padding:var(--en-space-panel);min-block-size:15rem;box-sizing:border-box;height:100%;}
 [data-carousel-demo] .project-card a{margin-block-start:auto;align-self:start;}
 [data-carousel-demo] .project-card .number{font-size:2rem;color:var(--en-color-text-muted);font-variant-numeric:tabular-nums;}
 @container(min-width:38rem){[data-carousel-demo] #card-carousel{--en-carousel-slides-per-view:2;}}
 @container(min-width:64rem){[data-carousel-demo] #card-carousel{--en-carousel-slides-per-view:3;}}
 </style>
 <div class="demo-section"><h3>Cover studies</h3><p>Authored media, one slide at a time. The thumbnail picker uses separate decorative preview URLs and keeps the original content intact. Focus the scrolling surface and use Left/Right, Home or End; interactive slide content keeps its own keys.</p>
 <en-carousel controls="auto" id="media-carousel" label="Cover studies" navigation="thumbnails" picker-label="Choose a cover study" .autoplay=\${this.auto} loop interval="5000" @en-change=\${this.changed}>
 <en-carousel-slide label="Nightfall" thumbnail=\${thumbnail('#12263c', '#678d94')}><figure><svg class="cover" viewBox="0 0 800 350" role="img" aria-label="Deep blue mountain silhouettes beneath a pale moon"><rect width="800" height="350" fill="#12263c"></rect><circle cx="612" cy="96" r="53" fill="#cddbd9"></circle><path d="M0 350 220 80 430 350Z" fill="#3e6472"></path><path d="M210 350 520 150 800 350Z" fill="#678d94"></path></svg><figcaption><strong>Nightfall</strong><span>A quiet cover study with layered silhouettes.</span></figcaption></figure></en-carousel-slide>
 <en-carousel-slide label="Terracotta" thumbnail=\${thumbnail('#f4e7d3', '#a54834')}><figure><svg class="cover" viewBox="0 0 800 350" role="img" aria-label="Warm terracotta arches against a cream background"><rect width="800" height="350" fill="#f4e7d3"></rect><path d="M130 350V180a180 180 0 0 1 360 0v170" fill="#a54834"></path><path d="M300 350V230a150 150 0 0 1 300 0v120" fill="#d98756"></path></svg><figcaption><strong>Terracotta</strong><span>A warm direction built from repeating arches.</span></figcaption></figure></en-carousel-slide>
 <en-carousel-slide label="Field notes" thumbnail=\${thumbnail('#e2ebd3', '#375a4c')}><figure><svg class="cover" viewBox="0 0 800 350" role="img" aria-label="Overlapping green circles and a small yellow sun"><rect width="800" height="350" fill="#e2ebd3"></rect><circle cx="180" cy="280" r="220" fill="#375a4c"></circle><circle cx="620" cy="290" r="240" fill="#69875d"></circle><circle cx="455" cy="85" r="40" fill="#dfba4b"></circle></svg><figcaption><strong>Field notes</strong><span>A softer palette for an outdoor collection.</span></figcaption></figure></en-carousel-slide>
 </en-carousel>
 <div class="demo-actions"><en-button variant="secondary" @click=\${() => {
            this.auto = !this.auto;
            this.refresh();
        }}>\${this.auto ? 'Remove autoplay' : 'Try optional autoplay'}</en-button></div>
 <p>Autoplay is off by default. When enabled, the first carousel control starts or stops it. Focus and manual navigation stop rotation until restarted; hover suspends it. Reduced motion prevents rotation.</p>
 </div>
 <div class="demo-section"><h3>Project collection</h3><p>One, two or three cards follow the container width. Position buttons select full visible windows; the final range stays full. Links remain native, and added or removed slides update the collection without rebuilding existing cards.</p>
 <div class="responsive-cards"><en-carousel controls="always" id="card-carousel" label="Project collection" navigation="positions" picker-label="Choose a project window" @en-change=\${this.changed}>
 \${repeat(this.cards, id => id, id => html \`<en-carousel-slide label=\${\`Project \${id}\`}><article class="project-card"><span class="number" aria-hidden="true">\${String(id).padStart(2, '0')}</span><h4>Project \${id}</h4><p>A collection of cover studies, working notes and shared references.</p><a href="/workflows/assets?progress-report">Explore project \${id}</a></article></en-carousel-slide>\`)}
 </en-carousel></div>
 <div class="demo-actions"><en-button variant="secondary" @click=\${() => {
            this.cards = [...this.cards, this.nextId++];
            this.refresh();
        }}>Add card</en-button><en-button variant="secondary" aria-disabled=\${String(!this.cards.length)} @click=\${() => {
            this.cards = this.cards.slice(0, -1);
            this.refresh();
        }}>Remove last card</en-button></div>
 </div>
 <section class="demo-section" id="large-carousel-example"><h3>Large keyed collection</h3>
 <p>Browse 1,000 studies. The numbered thumbnails show one consecutive range: seven on wide layouts, five at medium widths and three on narrow layouts. First and Last jump to the ends; hover or focus a thumbnail for its name and position. The reading-list option presents ten ordinary list entries per page for sequential reading. Both modes use the same keys and navigation state.</p>
 <div class="demo-actions"><en-button variant="secondary" @click=\${(event: Event) => this.dataCarousel(event)?.goToKey('study-500')}>Go to study 500</en-button><en-button variant="secondary" @click=\${() => { this.readingList = !this.readingList; this.refresh(); }}>\${this.readingList ? 'Use carousel' : 'Use reading list'}</en-button><en-button variant="secondary" @click=\${() => { this.collection = [...this.collection].reverse(); this.refresh(); }}>Reverse collection</en-button><en-button variant="secondary" @click=\${(event: Event) => { const key = this.dataCarousel(event)?.currentKey; this.collection = this.collection.filter(item => item.key !== key); this.refresh(); }}>Remove current study</en-button></div>
 <details><summary>Navigation options</summary><div class="demo-actions">
 <label>Controls <select aria-label="Carousel controls" @change=\${(event: Event) => { this.controls = (event.target as HTMLSelectElement).value as typeof this.controls; this.refresh(); }}>\${['none', 'auto', 'always'].map(value => html\`<option value=\${value} ?selected=\${this.controls === value}>\${value}</option>\`)}</select></label>
 <label>Picker <select aria-label="Carousel navigation" @change=\${(event: Event) => { this.navigation = (event.target as HTMLSelectElement).value as typeof this.navigation; this.refresh(); }}>\${['none', 'positions', 'thumbnails'].map(value => html\`<option value=\${value} ?selected=\${this.navigation === value}>\${value}</option>\`)}</select></label>
 <label><input type="checkbox" .checked=\${this.boundaries} @change=\${(event: Event) => { this.boundaries = (event.target as HTMLInputElement).checked; this.refresh(); }}> First/Last controls</label>
 </div><p>Both interfaces default to none in the component. This demo enables both. First/Last only appear inside an enabled controls row.</p></details>
 <en-carousel controls=\${this.controls} ?boundary-controls=\${this.boundaries} id="large-carousel" picker-range-label="Thumbnails {start}–{end} of {total}" label="Large study collection" navigation=\${this.navigation} .items=\${guard([this.collection], () => this.collection)} .renderItem=\${this.collectionItem} reading-mode=\${this.readingList ? 'list' : 'carousel'} page-size="10" @en-change=\${this.changed}></en-carousel>
 <p>The collection frame uses <code>--en-carousel-viewport-size</code> (22rem by default); each slide can scroll its own longer content. A focused slide remains mounted until focus leaves, and removing it returns focus to the scrolling surface. Store persistent form edits in application data: unmounted slides are recreated when revisited.</p>
 <details><summary>Keyed collection source</summary><pre><code>\${\`import { html } from 'lit';
import '@en-reve/elements/define/carousel.js';

const items = studies.map(study => ({
  key: study.id, label: study.title, thumbnail: study.previewURL,
}));

html\\\`<en-carousel label="Studies" controls="auto" boundary-controls navigation="thumbnails"
  .items=\\\${items}
  .renderItem=\\\${item => html\\\`<a href=\\\${'/studies/' + item.key}>\\\${item.label}</a>\\\`}
  reading-mode="carousel" page-size="10">
</en-carousel>\\\`;

carousel.goToKey('study-500');
carousel.readingMode = 'list'; // Paginated ordinary list.
carousel.items = [...items].reverse(); // Retains the leading key when possible.\`}</code></pre></details>
 </section>
 <p>\${this.result}</p>
 <details><summary>Keyboard and review scenarios</summary><ul><li>Tab through controls and visible links. Navigation buttons retain focus.</li><li>On the scrolling surface: Left/Right move one slide, Home/End move to the first/last window. Arrow direction follows RTL.</li><li>In either picker, Left/Right and Home/End move focus; Enter or Space activates. The current window is marked separately from keyboard focus. Narrow pickers scroll horizontally.</li><li>Resize while on the last card; add or remove cards, including every card.</li><li>Swipe or scroll horizontally. Offscreen slide contents stay out of keyboard and screen-reader navigation; a focused slide is retained until focus leaves.</li><li>Try autoplay, then focus, hover, stop and restart. With reduced motion it stays stopped.</li></ul></details>
 </section>\`;
    }
}
const carousel = directive(CarouselDemo);
export function carouselExample(key?: unknown) {
    return html \`\${carousel(key)}\`;
}`,"presence-activity":`import {html,nothing} from 'lit';
import {AsyncDirective,directive} from 'lit/async-directive.js';
import {repeat} from 'lit/directives/repeat.js';
import {ref as historyRef} from 'lit/directives/ref.js';
import {guard} from 'lit/directives/guard.js';

type Entry={id:number;author:string;text:string;time:string;attachment?:boolean};
const initial:Entry[]=[{id:2,author:'Mira Chen',text:'Added the quieter cover image for review.',time:'10:15',attachment:true},{id:1,author:'Jules Martin',text:'Updated the project brief. Please review the revised direction.',time:'09:40'}];
/** Application-owned finite history. No connection or real collaborator presence is implied. */
class PresenceActivityDemo extends AsyncDirective {
 private key:unknown;
 private people=['Mira Chen','Jules Martin','Sam Rivera','Alex Kim','Taylor Lee'];
 private away=false;
 private entries=[...initial];
 private buffered:Entry[]=[];
 private older:Entry[]=[];
 private nextId=3;
 private loading=false;
 private failed=false;
 private announcement='';
 private olderAnnouncement='';
 private refresh(){if(this.isConnected)this.setValue(this.render(this.key));}
 private incoming(){this.buffered.unshift({id:this.nextId++,author:'Sam Rivera',text:'Left a new comment on the cover study.',time:'10:30'});this.announcement=\`\${this.buffered.length} new update\${this.buffered.length===1?'':'s'} available. Choose Show updates when ready.\`;this.refresh();}
 private request=(event:CustomEvent<{action:string}>)=>{
  // Wait until every consuming listener has had the opportunity to cancel.
  queueMicrotask(()=>{
   if(!this.isConnected||event.defaultPrevented)return;
   if(event.detail.action==='show-updates'){
    const count=this.buffered.length;this.entries=[...this.buffered,...this.entries];this.buffered=[];this.announcement=\`Showing \${count} new update\${count===1?'':'s'}.\`;this.refresh();
   }else if(event.detail.action==='load-more'&&!this.loading){this.loading=true;this.failed=false;this.olderAnnouncement='Loading one older update.';this.refresh();}
  });
 };
 private settle(success:boolean){if(!this.loading)return;this.loading=false;this.failed=!success;if(success){this.older=[...this.older,{id:this.nextId++,author:'Alex Kim',text:'Created the first cover study.',time:'16:20'}];this.olderAnnouncement='Loaded one older update.';}else this.olderAnnouncement='Older activity could not be loaded. Existing entries are unchanged. Use Retry older activity.';this.refresh();}
 private piece(content:unknown,loading:boolean,shape='text'){return html\`<span class="activity-piece" ?data-placeholder=\${loading}><span class="activity-piece-content">\${content}</span>\${loading?html\`<en-skeleton shape=\${shape}></en-skeleton>\`:nothing}</span>\`;}
 private item=(entry:Entry)=>this.activity(entry,false);
 private activity(entry:Entry,loading:boolean){return html\`<en-activity-item ?data-activity-placeholder=\${loading} ?inert=\${loading} aria-hidden=\${loading?'true':nothing} data-entry=\${entry.id} author=\${entry.author} label=\${\`\${entry.author}: \${entry.text}\`} datetime=\${\`\${this.older.includes(entry)?'2026-09-14':'2026-09-15'}T\${entry.time}:00\`} time-label=\${entry.time}>
  <span slot="avatar">\${this.piece(html\`<en-avatar name=\${entry.author} size="small"></en-avatar>\`,loading,'circle')}</span>
  <span slot="author">\${this.piece(entry.author,loading)}</span><span slot="metadata">\${this.piece(entry.time,loading)}</span>
  \${this.piece(entry.text,loading)}
  \${entry.attachment?html\`<figure slot="attachments"><svg role="img" aria-label="Blue cover study with a soft diagonal accent" viewBox="0 0 320 120"><rect width="320" height="120" fill="#243657"></rect><path d="M0 120 170 0h150v120Z" fill="#5577cc"></path><circle cx="250" cy="38" r="24" fill="#aac1ff"></circle></svg><figcaption>Cover study · revision 2</figcaption></figure>\`:nothing}
  <span slot="actions">\${this.piece(html\`<en-button variant="ghost" @click=\${()=>{this.announcement=\`Reviewing \${entry.author}’s update from \${entry.time}. This demo keeps the original context in place.\`;this.refresh();}}>Review update<span class="collaboration-sr"> by \${entry.author} at \${entry.time}</span></en-button>\`,loading,'rectangle')}</span>
 </en-activity-item>\`;}
 override render(key?:unknown){this.key=key;return html\`<section data-presence-activity-demo aria-label="Presence and activity simulation">
 <style>
 [data-presence-activity-demo]{display:grid;gap:var(--en-space-panel);min-inline-size:0;}
 [data-presence-activity-demo] h3,[data-presence-activity-demo] h4,[data-presence-activity-demo] p{margin-block:0;}
 [data-presence-activity-demo] .collaboration-sr{position:absolute;inline-size:1px;block-size:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;}
 [data-presence-activity-demo] .collaboration-controls{display:flex;flex-wrap:wrap;align-items:center;gap:var(--en-space-2);}
 [data-presence-activity-demo] .collaboration-section{display:grid;gap:var(--en-space-3);}
 [data-presence-activity-demo] figure{margin:0;max-inline-size:20rem;}
 [data-presence-activity-demo] svg{display:block;inline-size:100%;border-radius:var(--en-radius-control);}
 [data-presence-activity-demo] figcaption{font-size:.875em;margin-block-start:var(--en-space-2);color:var(--en-color-text-muted);}
 [data-presence-activity-demo] en-activity-feed::part(updates),[data-presence-activity-demo] en-activity-feed::part(load-more){justify-self:start;}
 [data-presence-activity-demo] en-activity-item>[slot="actions"]{display:block;}
 [data-presence-activity-demo] .activity-piece{display:inline-grid;position:relative;max-inline-size:100%;vertical-align:middle;}
 [data-presence-activity-demo] .activity-piece[data-placeholder]>.activity-piece-content{visibility:hidden;}
 [data-presence-activity-demo] .activity-piece>en-skeleton{position:absolute;inset:0;--en-skeleton-size:100%;}
 [data-presence-activity-demo] .activity-piece>en-skeleton::part(base){inline-size:100%;block-size:100%;}
 [data-presence-activity-demo] #activity-feed-example::part(loading){display:none;}
 [data-presence-activity-demo] .older-activity{display:grid;gap:var(--en-space-3);}
 [data-presence-activity-demo] .older-status{color:var(--en-color-text-muted);}
 [data-presence-activity-demo] .older-activity en-activity-feed::part(announcement){display:none;}
 </style>
 <h3>Cover study collaboration</h3><p>Simulated collaborators and project history. Nothing is connected to a service or saved outside this page.</p>
 <div class="collaboration-section"><h4>People in this project</h4>
 <en-presence-group id="presence-group-example" label="Cover study collaborators" max="3">
 \${repeat(this.people,name=>name,(name,index)=>html\`<en-presence id=\${index===0?'presence-example':''} name=\${name} status=\${index===0?(this.away?'away':'online'):index===1?'busy':index===2?'away':'offline'}></en-presence>\`)}
 </en-presence-group>
 <div class="collaboration-controls"><en-button variant="secondary" @click=\${()=>{this.away=!this.away;this.refresh();}}>Toggle Mira’s availability</en-button><en-button variant="secondary" @click=\${()=>{this.people=this.people.includes('Casey Patel')?this.people.filter(name=>name!=='Casey Patel'):[...this.people,'Casey Patel'];this.refresh();}}>Toggle Casey’s membership</en-button></div></div>
 <div class="collaboration-section" id="presence-actions-example"><h4>Presence as a project link</h4>
 <p>Activate Mira’s identity to view her projects. The entire surface is one link; this example opens the Asset Browser as a sample project destination.</p>
 <div class="collaboration-controls"><en-presence name="Mira Chen" status="online" href="/workflows/assets?progress-report"></en-presence></div>
 </div>
 <div class="collaboration-section"><h4>Project activity</h4>
 <div class="collaboration-controls"><en-button variant="secondary" @click=\${()=>this.incoming()}>Simulate incoming update</en-button><en-button variant="secondary" @click=\${()=>{this.entries=this.entries.length?[]:[...initial];this.older=[];this.loading=false;this.failed=false;this.olderAnnouncement='';this.announcement=this.entries.length?'Sample activity restored.':'Activity cleared for the empty-state example.';this.refresh();}}>Toggle empty state</en-button></div>
 <en-activity-feed id="activity-feed-example" label="September 15 project activity" updates has-more .pending=\${this.buffered.length} .loading=\${this.loading} .empty=\${!this.entries.length} .moreLabel=\${this.failed?'Retry older activity':'Load older activity'} .announcement=\${this.announcement} @en-action=\${this.request}>
 <h4 slot="header">September 15, 2026</h4>
 \${repeat(this.entries,entry=>entry.id,this.item)}
 <p slot="empty">No activity for this date. Restore the samples or receive a new update.</p>
 <span slot="loading"></span>
 </en-activity-feed>
 <div class="older-activity" role="group" aria-label="Older project activity">
 \${this.older.length||this.loading?html\`<en-activity-feed label="September 14 project activity" .loading=\${this.loading} .empty=\${!this.older.length}><h4 slot="header">September 14, 2026</h4>\${repeat(this.older,entry=>entry.id,this.item)}
 <div slot="loading">\${this.loading?this.activity({id:this.nextId,author:'Alex Kim',text:'Created the first cover study.',time:'16:20'},true):nothing}</div>
 </en-activity-feed>\`:nothing}
 <p class="older-status" role="status" aria-atomic="true">\${this.olderAnnouncement||nothing}</p>
 </div>
 <details open><summary>Load simulation controls</summary><p>Loading waits for your choice, so focus, reading position and error recovery can be inspected.</p><div class="collaboration-controls"><en-button variant="secondary" aria-disabled=\${String(!this.loading)} @click=\${()=>this.settle(true)}>Complete load</en-button><en-button variant="secondary" aria-disabled=\${String(!this.loading)} @click=\${()=>this.settle(false)}>Fail load</en-button></div></details>
 </div></section>\`;}
}
const presenceActivity=directive(PresenceActivityDemo);
export function presenceActivityExample(key?:unknown){return html\`\${presenceActivity(key)}\${activityHistory()}\`;}

/** Larger, data-driven history. A real app supplies records/transport, never a hidden fetch in the component. */
class ActivityHistoryDemo extends AsyncDirective {
 private feed?:import('@en-reve/elements/activity-feed.js').EnActivityFeed;
 private readonly initialHistory=this.records(0,160);
 private request?:import('@en-reve/elements/activity-feed.js').ActivityLoadDetail;
 private newCount=0;
 private mode:'virtual'|'paged'|'list'='virtual';
 private status='160 loaded updates. Choose paginated reading for a complete, stable accessibility tree on each page.';
 private records(start:number,count:number):import('@en-reve/elements/activity-feed.js').ActivityRecord[]{return Array.from({length:count},(_,offset)=>{
  const index=start+offset,day=17-Math.floor(index/20),date=new Date(Date.UTC(2026,8,day));
  return {key:\`history-\${index}\`,author:['Mira Chen','Jules Martin','Sam Rivera'][index%3]!,text:\`Activity \${String(index+1).padStart(3,'0')}: \${index%4===0?'Added a new visual study with notes about contrast, composition and the next round of project review.':'Updated the project brief for review.'}\`,datetime:date.toISOString(),timeLabel:\`\${String(17-index%12).padStart(2,'0')}:30\`,group:new Intl.DateTimeFormat('en',{dateStyle:'long',timeZone:'UTC'}).format(date)};
 });}
 private refresh(){if(this.isConnected)this.setValue(this.render());}
 private loaded=(event:CustomEvent<import('@en-reve/elements/activity-feed.js').ActivityLoadDetail>)=>{
  queueMicrotask(()=>{if(event.defaultPrevented||event.detail.signal.aborted)return;this.request=event.detail;this.status='Loading 40 older updates. Complete, fail or cancel this local simulation.';if(this.feed)this.feed.announcement=this.status;
   event.detail.signal.addEventListener('abort',()=>{if(this.request===event.detail){this.request=undefined;this.status='Loading canceled. Previously loaded history is unchanged.';if(this.feed)this.feed.announcement=this.status;this.refresh();}},{once:true});this.refresh();});
 };
 private finish(success:boolean){const request=this.request;if(!request)return;this.request=undefined;if(success){const start=Number(request.cursor)||160;request.complete({items:this.records(start,40),cursor:String(start+40),hasMore:start+40<320});this.status='40 older updates loaded. Existing entries and reading position are retained.';}else{request.fail('Could not load older activity. Your loaded history is unchanged.');this.status='Older activity failed. Use Retry older activity.';}if(this.feed)this.feed.announcement=this.status;this.refresh();}
 private loadingPiece(content:unknown,shape='text'){return html\`<span class="history-placeholder-piece"><span>\${content}</span><en-skeleton shape=\${shape}></en-skeleton></span>\`;}
 private loadingPreview(){const item=this.records(Number(this.feed?.cursor)||160,1)[0]!;return html\`<en-activity-item class="history-placeholder" .embedded=\${true} aria-hidden="true" inert><span slot="avatar">\${this.loadingPiece(html\`<en-avatar name=\${item.author} size="small"></en-avatar>\`,'circle')}</span><span slot="author">\${this.loadingPiece(item.author)}</span><span slot="metadata">\${this.loadingPiece(item.timeLabel)}</span>\${this.loadingPiece(item.text)}<span slot="actions">\${this.loadingPiece(html\`<en-button variant="ghost">Review update</en-button>\`,'rectangle')}</span></en-activity-item>\`;}
 private renderRecord=(item:import('@en-reve/elements/activity-feed.js').ActivityRecord)=>html\`<en-avatar slot="avatar" name=\${item.author} size="small"></en-avatar>\${item.text}<en-button slot="actions" variant="ghost" @click=\${()=>{this.status=\`Reviewing \${item.key}. This action leaves the history in place.\`;if(this.feed)this.feed.announcement=this.status;this.refresh();}}>Review update<span class="history-sr"> \${item.key}</span></en-button>\`;
 override render(){return html\`<section id="activity-history-example" data-activity-history-demo aria-labelledby="activity-history-title">
 <style>
 [data-activity-history-demo]{display:grid;gap:var(--en-space-3);min-inline-size:0;margin-block-start:var(--en-space-panel)}
 [data-activity-history-demo] h3,[data-activity-history-demo] p{margin-block:0}
 [data-activity-history-demo] .history-tools{display:flex;flex-wrap:wrap;align-items:end;gap:var(--en-space-2)}
 [data-activity-history-demo] en-select{min-inline-size:min(16rem,100%)}
 [data-activity-history-demo] en-activity-feed{--en-activity-viewport-size:30rem}
 [data-activity-history-demo] en-activity-feed::part(updates),[data-activity-history-demo] en-activity-feed::part(load-more),[data-activity-history-demo] en-activity-feed::part(cancel-load){justify-self:start}
 [data-activity-history-demo] .history-sr{position:absolute;inline-size:1px;block-size:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
 [data-activity-history-demo] .history-placeholder-piece{display:inline-grid;position:relative;max-inline-size:100%;vertical-align:middle}
 [data-activity-history-demo] .history-placeholder-piece>span{visibility:hidden}
 [data-activity-history-demo] .history-placeholder-piece>en-skeleton{position:absolute;inset:0;--en-skeleton-size:100%}
 [data-activity-history-demo] .history-placeholder-piece>en-skeleton::part(base){inline-size:100%;block-size:100%}
 [data-activity-history-demo] pre{white-space:pre-wrap;overflow-wrap:anywhere}
 </style>
 <h3 id="activity-history-title">Large activity history</h3><p>A measured virtual list and a full-page reading alternative share the same keyed records. Buffer arrivals while reading, load earlier dates, and inspect cancellation or retry. No network service is connected.</p>
 <div class="history-tools"><en-select label="History display" .value=\${this.mode} .items=\${[{value:'virtual',label:'Virtual scrolling'},{value:'paged',label:'Paginated reading'},{value:'list',label:'All loaded entries'}]} @en-change=\${(event:Event)=>{const select=event.currentTarget as HTMLElement&{value:'virtual'|'paged'|'list'};queueMicrotask(()=>{if(!event.defaultPrevented){this.mode=select.value;this.refresh();}});}}></en-select>
 <en-button variant="secondary" @click=\${()=>{const number=++this.newCount;this.feed?.bufferItems([{key:\`incoming-\${number}\`,author:'Mira Chen',text:\`New arrival \${number}: Added a fresh review note.\`,group:'September 18, 2026',datetime:'2026-09-18T10:30:00Z',timeLabel:'10:30'}]);this.status=\`\${this.feed?.pendingCount??0} new updates buffered. Reading position is unchanged until you choose to navigate.\`;if(this.feed)this.feed.announcement=this.status;this.refresh();}}>Buffer new activity</en-button>
 <en-button variant="secondary" @click=\${()=>{const key=this.feed?.items?.[0]?.key;if(key)this.feed?.scrollToKey(key,{block:'start',behavior:'instant',container:'nearest'});}}>Jump to newest</en-button>
 <en-button variant="secondary" @click=\${()=>this.feed?.scrollToKey('history-119',{block:'center',behavior:'instant',container:'nearest'})}>Reveal activity 120</en-button></div>
 <en-activity-feed \${historyRef((element)=>{this.feed=element as typeof this.feed;})} id="large-activity-history" label="Project activity history" updates has-more cursor="160" .mode=\${this.mode} page-size="20" .items=\${guard([],()=>this.initialHistory)} .renderItem=\${this.renderRecord} @en-load=\${this.loaded}>
 <p slot="empty">No activity has been loaded.</p><div slot="loading">\${this.loadingPreview()}</div>
 </en-activity-feed>
 <details open><summary>Older-page simulation</summary><p>Requests wait for your choice. Cancel aborts the request; late responses are ignored. Loading and errors leave all existing entries readable.</p><div class="history-tools"><en-button variant="secondary" aria-disabled=\${String(!this.request)} @click=\${()=>this.finish(true)}>Complete older page</en-button><en-button variant="secondary" aria-disabled=\${String(!this.request)} @click=\${()=>this.finish(false)}>Fail older page</en-button></div></details>
 <p>\${this.status}</p>
 <details><summary>Keyed activity history source</summary><pre><code>\${\`import {html} from 'lit';
import {guard} from 'lit/directives/guard.js';
import '@en-reve/elements/define/activity-feed.js';
import type { ActivityLoadRequestEvent } from '@en-reve/elements/activity-feed.js';

html\\\`<en-activity-feed .items=\\\${guard([records], () => records)} mode="virtual" updates has-more
  .renderItem=\\\${item => html\\\`\\\${item.text}
    <en-button slot="actions">Review update</en-button>\\\`}
  @en-load-request=\\\${loadOlder}></en-activity-feed>\\\`;
// records: [{key:'update-1', author:'Mira', text:'Added a study',
//   group:'September 17, 2026', datetime:'2026-09-17T10:30:00Z', timeLabel:'10:30'}]
function loadOlder(event: ActivityLoadRequestEvent): void {
  const {cursor, signal} = event.detail;
  event.respondWith(Promise.resolve().then(() => {
    signal.throwIfAborted();
    return application.loadHistory({cursor, signal});
  }));
}
feed.bufferItems(newestFirstArrivals); // does not shift the visible history
feed.showUpdates();                  // merges keys; virtual anchor stays stable
feed.scrollToKey('update-1', {block:'start', container:'nearest'});
feed.mode = 'paged';                  // no virtualization within a reading page
feed.pageSize = 20;
feed.goToPage(2);                     // cancelable en-page-change
feed.cancelLoad();                   // aborts the current request lease
// Keep concise loading/outcome announcements in feed.announcement.
// Never assign role="feed" without implementing the separate ARIA feed contract.\`}</code></pre></details>
 </section>\`;}
}
const activityHistory=directive(ActivityHistoryDemo);`,"chat-patterns":`import { html, css } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import { parseColor, serializeColor, colorPaint, type EnColorPicker } from '@en-reve/elements/color-picker.js';
import type { EditorExtension, EditorPickerSession } from '@en-reve/elements/editor-extensions.js';
import type { TokenRun } from '@en-reve/elements/token-editor.js';

export const colorTokenStyles = css\`
  en-token-editor::part(color-swatch),en-rich-text-editor::part(color-swatch){
    background:repeating-conic-gradient(var(--en-color-slider-checker-light,#fff) 0% 25%,var(--en-color-slider-checker-dark,#b8b8b8) 0% 50%) 0 0 / calc(var(--en-color-slider-checker-size,.25rem) * 2) calc(var(--en-color-slider-checker-size,.25rem) * 2);
  }
  en-token-editor::part(color-swatch-paint),en-rich-text-editor::part(color-swatch-paint){display:block;inline-size:100%;block-size:100%;border-radius:inherit}
\`;
export const wideColor = 'color(display-p3 1 0.2 0.1 / 0.65)';
/** This application validates color payloads; the shared editor stays domain-independent. */
export function colorTokenRenderer(token: TokenRun): Node {
  const raw = (token.data as {color?: unknown} | undefined)?.color;
  const value = typeof raw === 'string' ? parseColor(raw) : undefined;
  if (!value) return document.createTextNode(token.text);
  const swatch = document.createElement('span');
  const paint = colorPaint(value, CSS.supports('color', 'color(display-p3 1 0 0)'));
  const fill = document.createElement('span');
  fill.part.add('color-swatch-paint');
  fill.style.backgroundColor = paint.fallback;
  fill.style.backgroundColor = paint.value;
  swatch.append(fill);
  swatch.part.add('color-swatch'); swatch.setAttribute('aria-hidden', 'true');
  return swatch;
}
export function commitColorToken(session: EditorPickerSession, raw: string): boolean {
  const parsed = parseColor(raw); if (!parsed) return false;
  const color = serializeColor(parsed);
  return session.commit({id:color,label:color,insert:[{kind:'token',id:session.token?.id ?? crypto.randomUUID(),type:'demo/color',text:color,label:\`Edit color \${color}\`,data:{color}}]});
}
/** One application-owned picker session used unchanged by the rich and token editors. */
export const wideColorExtension: EditorExtension = {
  id: 'colors', trigger: '#', label: 'Color picker',
  render: session => {
    const existing = (session.token?.data as {color?: unknown} | undefined)?.color;
    const parsed = parseColor(session.query) ?? (typeof existing === 'string' ? parseColor(existing) : undefined) ?? parseColor(wideColor)!;
    return html\`\${keyed(session.signal, html\`<div part="color-session">
      <en-color-picker part="color-picker" exportparts="base:color-base,summary:color-summary,formats:color-formats,channels:color-channels,preview:color-preview,preview-frame:color-preview-frame,space:color-space,gamut-message:color-gamut,conversion:color-conversion,plane:color-plane,plane-thumb:color-plane-thumb,plane-axes:color-plane-axes" label="Editor color" format="rgb" show-hex editable-channels alpha plane data-picker-focus .value=\${serializeColor(parsed)} @en-change=\${(event: Event) => event.stopPropagation()}></en-color-picker>
      <div part="color-actions"><en-button variant="secondary" @click=\${() => session.cancel()}>Cancel</en-button><en-button @click=\${(event: Event) => {
        const picker = (event.currentTarget as HTMLElement).closest('[part="color-session"]')!.querySelector<EnColorPicker>('en-color-picker')!;
        if (picker.reportValidity()) commitColorToken(session, picker.value);
      }}>Apply color</en-button></div>
    </div>\`)}\`;
  },
};

import { LitElement } from 'lit';
import type {EnTokenEditor,DocumentValue} from '@en-reve/elements/token-editor.js';
import type { EditorChoice } from '@en-reve/elements/editor-extensions.js';
import { normalizeHexColor } from '@en-reve/elements/color-picker.js';
import type {ChatEditorSnapshot} from '@en-reve/elements/chat-composer.js';
/** All domain concepts are defined in this application fixture, outside the editor. */
export class ComposableChatDemo extends LitElement {
 static override properties={status:{state:true},sent:{state:true},colorMode:{state:true}};
 static override styles=[colorTokenStyles, css\`
 en-token-editor::part(color-session){
  --color-session-padding:var(--en-space-4,1rem);
  --color-popup-padding:var(--en-option-list-padding,var(--en-overlay-padding,var(--en-space-2,.5rem)));
  display:grid;gap:var(--en-space-4,1rem);padding:var(--color-session-padding);container:chat-color / inline-size
 }
 en-token-editor::part(color-tab-list){
  position:sticky;inset-block-start:calc(-1 * var(--color-popup-padding));z-index:2;
  border-block-end:var(--en-border-width,1px) solid var(--en-color-line);
  margin-block-start:calc(-1 * (var(--color-session-padding) + var(--color-popup-padding)));
  margin-inline:calc(-1 * (var(--color-session-padding) + var(--color-popup-padding)));
  padding:var(--color-session-padding) calc(var(--color-session-padding) + var(--color-popup-padding));
  padding-block-start:var(--en-space-2,.5rem);
  padding-block-end:0;
  background:var(--en-option-list-background,var(--en-overlay-background,var(--en-color-surface-raised)));
 }
 @media(forced-colors:active){en-token-editor::part(color-tab-list),en-token-editor::part(color-actions){background:Canvas}}
 en-token-editor::part(color-tab){border-block-end:0}
 en-token-editor::part(chat-color-picker){--en-color-picker-inline-size:100%}
 en-token-editor::part(chat-color-base){grid-template-areas:"summary" "formats" "channels"}
 en-token-editor::part(chat-color-summary){grid-area:summary;align-items:stretch}
 en-token-editor::part(chat-color-formats){grid-area:formats}
 en-token-editor::part(chat-color-channels){grid-area:channels;align-content:start}
 en-token-editor::part(chat-color-preview-frame){position:relative;align-self:stretch;inline-size:var(--en-color-picker-preview-size,3rem);min-block-size:3rem}
 en-token-editor::part(chat-color-preview){position:absolute;inset:0;inline-size:100%;block-size:100%;aspect-ratio:auto;min-block-size:3rem}
 en-token-editor::part(color-actions){
  display:flex;flex-wrap:wrap;justify-content:flex-end;gap:var(--en-space-2,.5rem);
  position:sticky;inset-block-end:calc(-1 * var(--color-popup-padding));z-index:2;
  border-block-start:var(--en-border-width,1px) solid var(--en-color-line);
  margin-inline:calc(-1 * (var(--color-session-padding) + var(--color-popup-padding)));
  margin-block-end:calc(-1 * (var(--color-session-padding) + var(--color-popup-padding)));
  padding-block:var(--en-space-2,.5rem);
  padding-inline:calc(var(--color-session-padding) + var(--color-popup-padding));
  background:var(--en-option-list-background,var(--en-overlay-background,var(--en-color-surface-raised)));
 }
 @container chat-color (min-width:40rem){
  en-token-editor::part(chat-color-base){grid-template-columns:minmax(0,1fr) minmax(0,1fr);grid-template-rows:auto 1fr;grid-template-areas:"summary channels" "formats channels";column-gap:var(--en-space-4,1rem);row-gap:var(--en-space-3,.75rem);align-items:start}
  en-token-editor::part(chat-color-formats){align-self:start}
 }
:host{display:block;margin-block-start:2rem;min-inline-size:0}section{display:grid;gap:var(--en-space-3,.75rem)}.tools{display:flex;flex-wrap:wrap;gap:var(--en-space-2,.5rem)}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;font-size:.875em}h2,p{margin:0}en-token-editor::part(color-swatch),en-token-editor::part(color-option-swatch){display:inline-block;vertical-align:middle;inline-size:1.1em;block-size:1.1em;border:1px solid currentColor;border-radius:.15em}en-token-editor::part(color-swatch){display:block}en-token-editor::part(color-option-swatch){margin-inline-end:.5em}.message{padding:var(--en-space-3,.75rem);border:1px solid var(--en-color-line);border-radius:var(--en-radius-container,.5rem)}\`];
 private declare status:string;private declare sent:ChatEditorSnapshot|undefined;private sequence=0;
 private declare colorMode:'picker'|'native'|'typeahead';
 private recentColors:string[]=[];
 private disposers:(()=>void)[]=[];
 private get editor(){return this.renderRoot.querySelector<EnTokenEditor>('en-token-editor');}
 private references:EditorExtension={id:'references',trigger:'@',label:'References',provide:async({query,signal})=>{
  await new Promise(resolve=>setTimeout(resolve,120));if(signal.aborted)return [];
  return [{id:'mira',label:'Mira',description:'Design collaborator'},{id:'cover',label:'Cover study',description:'Project reference'}].filter(item=>item.label.toLowerCase().includes(query.toLowerCase())).map(item=>({...item,insert:[{kind:'token' as const,id:\`reference-\${++this.sequence}\`,type:'demo/reference',text:\`@\${item.label}\`,label:\`\${item.label}, reference\`,data:{referenceId:item.id}}]}));
 }};
 private tools:EditorExtension={id:'tools',trigger:'/',label:'Tools',provide:({query})=>[{id:'summarize',label:'Summarize',description:'Insert the summary tool'},{id:'outline',label:'Outline',description:'Insert the outline tool'}].filter(item=>item.label.toLowerCase().includes(query.toLowerCase())).map(item=>({...item,insert:[{kind:'token' as const,id:\`tool-\${++this.sequence}\`,type:'demo/tool',text:\`/\${item.label}\`,label:\`\${item.label}, tool\`,data:{toolId:item.id}}]}))};
 private nativeColors:EditorExtension={id:'colors',trigger:'#',label:'Color picker',match:before=>/(^|\\s)#$/.test(before)?{from:before.length-1,query:''}:undefined,open:session=>this.openColorPicker(session)};
 private get colors(){return this.colorMode==='native'?this.nativeColors:this.colorMode==='typeahead'?this.typeaheadColors:this.customColors;}
 private customColors:EditorExtension={id:'colors',trigger:'#',label:'Color picker',render:session=>{
  const choices=this.colorChoices(session.query).filter(choice=>(choice.data as {color?:string})?.color);
  const exact=choices.find(choice=>choice.label.toLowerCase()===session.query.toLowerCase());
  const color=normalizeHexColor(session.query)??(exact?.data as {color?:string}|undefined)?.color??String((session.token?.data as {color?:string}|undefined)?.color??'#5577cc');
  const pickerFrom=(event:Event)=>(event.currentTarget as HTMLElement).closest('[data-color-session]')!.querySelector<EnColorPicker>('en-color-picker')!;
  return html\`\${keyed(session.signal,html\`<div data-color-session part="color-session">
    <en-tabs label="Color selection" value="picker" exportparts="tab-list:color-tab-list" @en-change=\${(event:Event)=>event.stopPropagation()}>
      <en-tab slot="tab" value="picker" exportparts="base:color-tab">Picker</en-tab><en-tab slot="tab" value="chips" exportparts="base:color-tab">Chips</en-tab>
      <en-tab-panel slot="panel" value="picker"><en-color-picker part="chat-color-picker" exportparts="base:chat-color-base,summary:chat-color-summary,formats:chat-color-formats,channels:chat-color-channels,preview:chat-color-preview,preview-frame:chat-color-preview-frame" data-picker-focus label="Message color" show-hex editable-channels .value=\${color} .alpha=\${(parseColor(color)?.alpha??1)!==1} @en-change=\${(event:Event)=>event.stopPropagation()}></en-color-picker></en-tab-panel>
      <en-tab-panel slot="panel" value="chips" hidden>
        <div role="group" aria-label="Matching palette and recent colors" style="display:flex;flex-wrap:wrap;gap:var(--en-space-2,.5rem)">
          \${choices.map(choice=>html\`<en-swatch color=\${String((choice.data as {color:string}).color)} label=\${choice.label} @click=\${(event:Event)=>{
            const picker=pickerFrom(event);picker.value=String((choice.data as {color:string}).color);
            (event.currentTarget as HTMLElement).closest('[data-color-session]')!.querySelector('[data-color-choice]')!.textContent=\`\${choice.label} selected. Apply color to insert it.\`;
          }}></en-swatch>\`)}
        </div><p data-color-choice role="status">\${choices.length?'Choose a color, then Apply.':'No matching chips. Try a different name or use the Picker tab.'}</p>
      </en-tab-panel>
    </en-tabs>
    <div part="color-actions">
      <en-button variant="secondary" @click=\${()=>session.cancel()}>Cancel</en-button>
      <en-button @click=\${async(event:Event)=>{const picker=pickerFrom(event);if(!picker.checkValidity()){
        const tabs=picker.closest('en-tabs') as HTMLElement&{value:string;updateComplete:Promise<unknown>};tabs.value='picker';await tabs.updateComplete;picker.reportValidity();return;
      }this.commitColor(session,picker.value);}}>Apply color</en-button>
    </div>
  </div>\`)}\`;
 }};
 private typeaheadColors:EditorExtension={
  id:'colors',trigger:'#',label:'Colors',
  provide:({query})=>this.colorChoices(query),
  renderOption:choice=>{
   const color=(choice.data as {color?:string}|undefined)?.color;
   return html\`<span>\${color?html\`<span part="color-option-swatch" aria-hidden="true" style=\${\`background-color:\${color}\`}></span>\`:''}\${choice.label}</span>\`;
  },
  select:(choice,session)=>{
   const color=(choice.data as {color?:string}|undefined)?.color;
   if(color)this.commitColor(session,color);
   else session.openPicker(picker=>this.openColorPicker(picker));
  },
 };
 private colorChoices(query:string):EditorChoice[]{
  const text=query.toLowerCase();const choices:EditorChoice[]=[];
  const hex=normalizeHexColor(text);
  if(hex)choices.push({id:hex,label:\`Use \${hex}\`,description:'Custom color',data:{color:hex}});
  for(const color of this.recentColors.filter(color=>!text||color.includes(text)))if(color!==hex)choices.push({id:'recent-'+color,label:\`Recent \${color}\`,data:{color}});
  for(const [name,color] of [['Blue','#336699'],['Sky blue','#38bdf8'],['Red','#dc2626'],['Green','#16a34a'],['Violet','#8b5cf6'],['Amber','#f59e0b'],['P3 coral',wideColor]]){
   if((!text||name.toLowerCase().includes(text)||color.includes(text))&&color!==hex&&!choices.some(c=>(c.data as {color?:string})?.color===color))choices.push({id:color,label:name,description:color,data:{color}});
  }
  choices.push({id:'native-picker',label:'Choose another color…',description:'Open the native color picker'});
  return choices;
 }
 private commitColor(session:EditorPickerSession,color:string){
  const parsed=parseColor(color);if(!parsed)return;color=serializeColor(parsed);
  if(session.commit({id:color,label:color,insert:[{kind:'token',id:session.token?.id??\`color-\${++this.sequence}\`,type:'demo/color',text:color,label:\`Edit color \${color}\`,data:{color}}]}))this.recentColors=[color,...this.recentColors.filter(value=>value!==color)].slice(0,5);
 }
 private openColorPicker(session:EditorPickerSession){
  const input=this.renderRoot.querySelector<HTMLInputElement>('[data-native-color]')!;
  const anchor=session.getAnchorRect();
  Object.assign(input.style,{left:\`\${anchor.left}px\`,top:\`\${anchor.top}px\`,width:\`\${Math.max(1,anchor.width)}px\`,height:\`\${Math.max(1,anchor.height)}px\`});
  const initial=String((session.token?.data as {color?:string}|undefined)?.color??this.colorChoices(session.query).find(choice=>choice.description==='Custom color')?.id??'#5577cc');
  if(!normalizeHexColor(initial)){session.cancel();this.status='Use the inline picker to edit this color without losing its color space or precision.';return;}
  input.value=initial.slice(0,7);
  const commit=()=>this.commitColor(session,input.value+(initial.length===9?initial.slice(7):''));
  input.addEventListener('change',commit,{signal:session.signal});
  input.addEventListener('cancel',()=>session.cancel(),{signal:session.signal});
  // Kept in the triggering input/click call stack for browser user activation.
  // Some native choosers do not emit cancel. A new page interaction ends that session.
  this.ownerDocument.addEventListener('pointerdown',event=>{if(!event.composedPath().includes(input))session.cancel();},{capture:true,signal:session.signal});
  this.ownerDocument.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();session.cancel();}},{capture:true,signal:session.signal});
  try{if(typeof input.showPicker==='function'){input.showPicker();return;}}catch{/* Fall back to native input activation. */}
  input.click();
 }
 constructor(){super();this.colorMode='picker';this.status='Try @ for references, / for tools, or # for colors. Nothing is sent outside this page.';}
 override connectedCallback(){super.connectedCallback();if(this.hasUpdated)this.installRenderers();}
 protected override firstUpdated(){this.installRenderers();}
 private installRenderers(){
  const editor=this.editor!;
  for(const [type,extension,part] of [['demo/reference','references','reference-token'],['demo/tool','tools','tool-token']])this.disposers.push(editor.registerToken(type,token=>document.createTextNode(token.text),{extension,part,deleteBehavior:'edit'}));
  this.disposers.push(editor.registerToken('demo/color',colorTokenRenderer,{extension:'colors',part:'color-token',deleteBehavior:'edit'}));
 }
 override disconnectedCallback(){this.disposers.forEach(dispose=>dispose());this.disposers=[];super.disconnectedCallback();}
 private loadSamples(){this.editor!.document={version:1,runs:[{kind:'text',text:'Ask '},{kind:'token',id:'sample-reference',type:'demo/reference',text:'@Mira',label:'Edit Mira reference',data:{referenceId:'mira'}},{kind:'text',text:' to use '},{kind:'token',id:'sample-tool',type:'demo/tool',text:'/Summarize',label:'Edit Summarize tool',data:{toolId:'summarize'}},{kind:'text',text:' with '},{kind:'token',id:'sample-color',type:'demo/color',text:'#5577cc',label:'Edit color #5577cc',data:{color:'#5577cc'}},{kind:'text',text:'.'}]};}
 private action=(event:CustomEvent)=>{if(event.detail.action==='send'){this.sent=event.detail.data;this.status='Message captured locally. Use Restore draft to recover its original text and token data.';}};
 protected override render(){return html\`<section aria-labelledby="advanced-title"><h2 id="advanced-title">Composable editor extensions</h2><p>The editor contains no built-in reference, tool or color concepts. This example supplies them using three declarative extension elements.</p><en-select label="Color entry" .value=\${this.colorMode} .items=\${[{value:'picker',label:'Inline color picker'},{value:'native',label:'Native picker first'},{value:'typeahead',label:'Typeahead first'}]} @en-change=\${(event:Event)=>{this.colorMode=(event.currentTarget as HTMLElement&{value:'picker'|'native'|'typeahead'}).value;}}></en-select><p>\${this.colorMode==='picker'?'Type # to open the color controls directly. Use Picker for HEX/RGB/HSL and alpha, or Chips for palette/recent choices. Keep typing a hex value or palette name to update the picker; Enter or Down Arrow moves into its controls. Apply inserts a chip; Cancel keeps your text.':this.colorMode==='native'?'Type # to open the native picker immediately.':'Type #blu for named colors or #336699 for a hex color; use Arrow keys and Enter. Empty # includes recent colors. Choose another color opens the native picker.'}</p><input data-native-color type="color" tabindex="-1" aria-hidden="true" style="position:fixed;width:1px;height:1px;margin:0;padding:0;border:0;opacity:0;pointer-events:none"><en-chat-composer @en-action=\${this.action}><en-token-editor slot="editor" id="structured-draft" label="Structured message"></en-token-editor><div slot="tools" class="tools"><en-button variant="secondary" @click=\${()=>this.editor?.openExtension('references')}>References</en-button><en-button variant="secondary" @click=\${()=>this.editor?.openExtension('tools')}>Tools</en-button><en-button variant="secondary" @click=\${()=>this.editor?.openExtension('colors')}>Colors</en-button></div></en-chat-composer><en-editor-trigger for="structured-draft" .extension=\${this.references}></en-editor-trigger><en-editor-trigger for="structured-draft" .extension=\${this.tools}></en-editor-trigger><en-editor-trigger for="structured-draft" .extension=\${this.colors}></en-editor-trigger><div class="tools"><en-button variant="secondary" @click=\${()=>this.loadSamples()}>Load sample chips</en-button><en-button variant="secondary" @click=\${()=>this.editor?.undo()}>Undo edit</en-button><en-button variant="secondary" @click=\${()=>this.editor?.redo()}>Redo edit</en-button><en-button variant="secondary" ?disabled=\${!this.sent} @click=\${()=>{if(this.sent?.content)this.editor!.document=this.sent.content as unknown as DocumentValue;}}>Restore draft</en-button></div><p>Chip editing: click a chip to choose a replacement. Backspace immediately after a chip (or Delete immediately before it) restores its trigger and opens the picker. Type to refine @ or / (and # in typeahead mode); Escape leaves the editable trigger. Undo restores the chip. Selecting a text range still deletes that range normally.</p><p role="status">\${this.status}</p>\${this.sent?html\`<div class="message"><strong>Captured message</strong><p>\${this.sent.value}</p><details><summary>Structured snapshot</summary><pre>\${JSON.stringify(this.sent.content,null,2)}</pre></details></div>\`:''}<details><summary>Extension composition API</summary><pre>\${\`<en-chat-composer>
  <en-token-editor id="draft" slot="editor" label="Message"></en-token-editor>
</en-chat-composer>
<en-editor-trigger for="draft"></en-editor-trigger>

trigger.extension = {
  id: 'references', trigger: '@', label: 'References',
  provide: async ({query, signal}) => findReferences(query, signal),
};
// Or register imperatively; dispose when this integration disconnects:
const dispose = editor.registerExtension(extension);
// Compose a reusable picker; the application owns Apply and Cancel:
editor.registerExtension({
  id: 'colors', trigger: '#', label: 'Color picker',
  render: session => html\\\`
    <en-color-picker .value=\\\${colorFromQuery(session.query)}></en-color-picker>
    <button @click=\\\${() => commitChosenColor(session)}>Apply color</button>
    <button @click=\\\${() => session.cancel()}>Cancel</button>
  \\\`,
});
// colorFromQuery and commitChosenColor are application helpers.
// Native pickers can still open synchronously, preserving user activation:
editor.registerExtension({
  id: 'colors', trigger: '#', label: 'Color picker',
  open: session => openNativeColorPicker(session),
});
// Or install a typeahead-first color extension instead:
editor.registerExtension({
  id: 'colors', trigger: '#', label: 'Colors',
  provide: ({query}) => findColors(query),
  renderOption: choice => renderColorOption(choice),
  select: (choice, session) => {
    if (choice.id === 'native-picker') {
      session.openPicker(openNativeColorPicker);
    } else {
      session.commit(choice); // The choice supplies insertion runs.
    }
  },
});
// renderOption returns noninteractive contents; choice.label names the option.
// The editor retains Arrow/Enter handling and option selection.
// The application owns the native input and commits on change.
// session.token contains the existing occurrence when editing.
// Use session.signal to clean up listeners and session.cancel()
// when dismissed. Alternatively supply render(session) for an
// inline custom picker in the editor's popup.
editor.registerToken('demo/color', renderColorSwatch, {
  extension: 'colors', part: 'color-token', deleteBehavior: 'edit',
});
// Atomic deletion remains the default without deleteBehavior.
editor.editToken('reference-1', {query: 'Mi'});
// Converts that occurrence to @Mi and opens its reference picker.
// ::part(token) styles all chips; ::part(color-token) styles color wrappers.
// Renderer-created descendants can expose their own parts:
// swatch.setAttribute('part', 'color-swatch');
// swatch.style.backgroundColor = validatedColor;
// en-token-editor::part(color-swatch) { border-radius: 50%; }
// Keep size, border and layout in CSS; only the chosen color is inline.
// Or open an existing occurrence from application UI:
editor.openExtension('colors', {tokenId: 'color-1'});\`}</pre></details></section>\`;}
}

if (!customElements.get('en-composable-chat-demo')) customElements.define('en-composable-chat-demo', ComposableChatDemo);

import { nothing } from 'lit';
import { AsyncDirective, directive } from 'lit/async-directive.js';
import { ref } from 'lit/directives/ref.js';
import { repeat } from 'lit/directives/repeat.js';
import type { EnTextarea } from '@en-reve/elements/textarea.js';
import type { EnFileUpload } from '@en-reve/elements/file-upload.js';
import type { EnDialog } from '@en-reve/elements/dialog.js';

type Message = {id:number;value:string;files:readonly File[];state:'sending'|'retrying'|'failed'|'sent';draftRevision:number;fileRevision:number};
/** Local transport fixture. The application owns message snapshots, previews and retry. */
class ChatPatternsDemo extends AsyncDirective {
 private root?:HTMLElement;
 private key:unknown;
 private adopted=false;
 private lifetime?:MutationObserver;
 private connect=(element:Element|undefined)=>{
  if(!element){this.releaseUnused(true);this.lifetime?.disconnect();}
  this.root=element as HTMLElement|undefined;
  if(!this.root)return;this.observeLifetime();
  if(this.adopted)return;this.adopted=true;
  const field=this.files;const registry=this.root.ownerDocument.defaultView?.customElements;
  if(field&&registry)void registry.whenDefined('en-file-upload').then(async()=>{await field.updateComplete;if(this.isConnected)this.refresh();});
 };
 private pending?:Message;
 private messages:Message[]=[];
 private status='Nothing is sent outside this page.';
 private veto=false;
 private draftRevision=0;
 private fileRevision=0;
 private preview?:File;
 private urls=new Map<File,string>();
 private brokenImages=new Set<File>();
 private get editor(){return this.root?.querySelector<EnTextarea>('en-textarea');}
 private get files(){return this.root?.querySelector<EnFileUpload>('en-file-upload');}
 private refresh(){if(this.isConnected){this.releaseUnused();this.setValue(this.render(this.key));}}
 private url(file:File){
  let value=this.urls.get(file);
  if(!value){value=URL.createObjectURL(file);this.urls.set(file,value);}
  return value;
 }
 private releaseUnused(all=false){
  const retained=new Set([...(this.files?.files??[]),...this.messages.flatMap(message=>message.files),...(this.preview?[this.preview]:[])]);
  for(const [file,url] of this.urls)if(all||!retained.has(file)){URL.revokeObjectURL(url);this.urls.delete(file);this.brokenImages.delete(file);}
 }
 private observeLifetime(){
  this.lifetime?.disconnect();const root=this.root;if(!root)return;
  // Hydrated keyed examples can be removed without notifying nested directives.
  // Bind blob resources to the actual DOM lifetime as well as Lit's callbacks.
  this.lifetime=new MutationObserver(()=>{if(!root.isConnected){this.releaseUnused(true);this.lifetime?.disconnect();}});
  this.lifetime.observe(root.ownerDocument,{childList:true,subtree:true});
 }
 protected override disconnected(){this.releaseUnused(true);this.lifetime?.disconnect();}
 protected override reconnected(){this.observeLifetime();this.refresh();}
 private image(file:File){return file.type.startsWith('image/')&&!this.brokenImages.has(file);}
 private fileType(file:File){return file.type==='application/pdf'||file.name.toLowerCase().endsWith('.pdf')?'PDF':file.type.startsWith('image/')?'Image':'File';}
 private fileSize(file:File){return file.size<1024?\`\${file.size} B\`:file.size<1024*1024?\`\${Math.ceil(file.size/1024)} KB\`:\`\${(file.size/1024/1024).toFixed(1)} MB\`;}
 private openPreview(file:File){
  this.preview=file;this.refresh();
  // Opening the existing dialog is explicit and preserves the triggering control for focus restoration.
  queueMicrotask(()=>{if(this.isConnected)this.root?.querySelector<EnDialog>('en-dialog')?.show();});
 }
 private remove(file:File){
  const field=this.files;if(!field)return;
  field.files=field.files.filter(selected=>selected!==file);this.fileRevision++;
  field.focus({preventScroll:true});this.status=\`Removed \${file.name} from the draft.\`;this.refresh();
 }
 private attachments(files:readonly File[],editable=false){
  return html\`<ul class="chat-demo-attachments" aria-label=\${editable?'Selected attachments':'Message attachments'}>\${repeat(files,file=>file,file=>html\`<li class="chat-demo-attachment">
   <div class="chat-demo-media" ?data-document=\${!this.image(file)}>\${this.image(file)?html\`<img src=\${this.url(file)} alt="" @error=\${()=>{this.brokenImages.add(file);this.refresh();}}>\`:html\`<en-icon name="file" aria-hidden="true"></en-icon><span>\${this.fileType(file)}</span>\`}</div>
   <div class="chat-demo-file-name">\${file.name}</div><small>\${this.fileType(file)} · \${this.fileSize(file)}\${this.brokenImages.has(file)?' · Image preview unavailable':''}</small>
   <div class="chat-demo-file-actions"><en-button variant="secondary" @click=\${()=>this.openPreview(file)}>Preview <span class="chat-demo-sr">\${file.name}</span></en-button>\${editable?html\`<en-button variant="ghost" @click=\${()=>this.remove(file)}>Remove <span class="chat-demo-sr">\${file.name}</span></en-button>\`:nothing}</div>
  </li>\`)}</ul>\`;
 }
 private send=(event:CustomEvent<{action:string;data:{value:string}}>)=>{
  if(event.detail.action!=='send')return;
  if(this.veto)event.preventDefault();
  queueMicrotask(()=>{
   if(!this.isConnected)return;
   if(event.defaultPrevented){this.status='Send request declined. Your draft and files are unchanged.';this.refresh();return;}
   if(this.pending)return;
   const message:Message={id:this.messages.length+1,value:event.detail.data.value,files:Object.freeze([...(this.files?.files??[])]),state:'sending',draftRevision:this.draftRevision,fileRevision:this.fileRevision};
   this.messages.push(message);this.pending=message;
   this.status='Sending is simulated. Complete or fail this request below; you can keep editing the next draft.';this.refresh();
  });
 };
 private retry(message:Message){
  if(this.pending||message.state!=='failed')return;
  message.state='retrying';this.pending=message;
  this.status='Retrying the original message and attachments. Your current composer is unchanged.';this.refresh();
 }
 private settle(success:boolean){
  const request=this.pending;if(!request)return;
  const retrying=request.state==='retrying';
  if(success&&retrying){const message=this.root?.querySelector<HTMLElement>(\`en-chat-message[data-message-id="\${request.id}"]\`);if(message?.querySelector('en-button[slot=actions]')?.matches(':focus-within'))message.focus({preventScroll:true});}
  request.state=success?'sent':'failed';
  if(success){
   if(!retrying){
    if(this.editor?.value===request.value&&this.draftRevision===request.draftRevision)this.editor.value='';
    if(this.files&&this.fileRevision===request.fileRevision)this.files.files=[];
   }
   this.status=retrying?'Original message sent locally. Your current composer is unchanged.':'Message sent locally. Any newer draft or file selection is preserved.';
  }else this.status='Delivery failed. The message and its files are retained above; use its Retry button. Your composer is unchanged.';
  this.pending=undefined;this.refresh();
 }
 render(key:unknown=0){
  if(key!==this.key){this.releaseUnused(true);this.key=key;this.pending=undefined;this.messages=[];this.preview=undefined;this.veto=false;this.draftRevision=0;this.fileRevision=0;this.status='Nothing is sent outside this page.';}
  return html\`<section data-chat-patterns-demo \${ref(this.connect)} style="display:grid;gap:var(--en-space-4);min-inline-size:0">
   <style>
    [data-chat-patterns-demo] .chat-demo-attachments{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,12rem),1fr));gap:var(--en-space-3);list-style:none;padding:0;margin:0;}
    [data-chat-patterns-demo] .chat-demo-attachment{display:grid;align-content:start;gap:var(--en-space-2);min-inline-size:0;padding:var(--en-space-3);border:var(--en-border-width) solid var(--en-color-line);border-radius:var(--en-radius-container);background:var(--en-color-surface);}
    [data-chat-patterns-demo] .chat-demo-media{display:flex;align-items:center;justify-content:center;gap:var(--en-space-2);block-size:8rem;background:var(--en-color-surface-raised);border-radius:var(--en-radius-control);overflow:hidden;}
    [data-chat-patterns-demo] .chat-demo-media img{inline-size:100%;block-size:100%;object-fit:contain;}
    [data-chat-patterns-demo] .chat-demo-media[data-document]{block-size:4rem;}
    [data-chat-patterns-demo] .chat-demo-media en-icon::part(base){inline-size:2rem;block-size:2rem;}
    [data-chat-patterns-demo] .chat-demo-media en-icon{inline-size:2rem;block-size:2rem;}
    [data-chat-patterns-demo] .chat-demo-file-name{font-weight:600;overflow-wrap:anywhere;}
    [data-chat-patterns-demo] .chat-demo-file-actions{display:flex;flex-wrap:wrap;gap:var(--en-space-actions);}
    [data-chat-patterns-demo] .chat-demo-picker::part(list){display:none;}
    [data-chat-patterns-demo] .chat-demo-status{display:flex;align-items:center;flex-wrap:wrap;gap:var(--en-space-2);}
    [data-chat-patterns-demo] .chat-demo-status[data-failed]{padding:var(--en-space-3);border-inline-start:3px solid var(--en-color-danger);background:var(--en-color-surface-raised);}
    [data-chat-patterns-demo] .chat-demo-status[data-failed] en-icon{color:var(--en-color-danger);}
    [data-chat-patterns-demo] .chat-demo-preview{display:grid;gap:var(--en-space-3);min-inline-size:0;overflow-wrap:anywhere;}
    [data-chat-patterns-demo] .chat-demo-preview img{display:block;max-inline-size:100%;max-block-size:60svh;object-fit:contain;}
    [data-chat-patterns-demo] .chat-demo-sr{position:absolute;inline-size:1px;block-size:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;}
   </style>
   <ol aria-label="Study conversation" style="display:grid;gap:var(--en-space-3);list-style:none;padding:0;margin:0">
    <li><en-chat-message id="chat-message-example" author="Mira">
     <time slot="metadata" datetime="2026-09-15T09:00:00">9:00 AM</time>
     <span>Could we make the cover image a little quieter? You can edit this suggestion before sending it.</span>
     <en-button slot="actions" variant="secondary" @click=\${()=>{if(this.editor){this.editor.value='Please reduce the cover image opacity to 60%.';this.draftRevision++;this.editor.focus();}}}>Use suggestion</en-button>
    </en-chat-message></li>
    \${repeat(this.messages,message=>message.id,message=>html\`<li><en-chat-message author="You" outgoing data-message-id=\${message.id}>
     <span style="white-space:pre-wrap">\${message.value||'Attached files'}</span>
     \${message.files.length?html\`<div slot="attachments">\${this.attachments(message.files)}</div>\`:nothing}
     <div slot="status" class="chat-demo-status" ?data-failed=\${message.state==='failed'}><en-icon name=\${message.state==='failed'?'warning':message.state==='sent'?'check':'info'}></en-icon><strong>\${{failed:'Not sent',sending:'Sending…',retrying:'Retrying…',sent:'Sent locally'}[message.state]}</strong>\${message.state==='failed'?html\`<span>Your message and attachments are preserved.</span>\`:nothing}</div>
     \${message.state==='failed'||message.state==='retrying'?html\`<en-button slot="actions" variant="secondary" aria-disabled=\${String(!!this.pending)} @click=\${()=>this.retry(message)}>Retry message</en-button>\`:nothing}
    </en-chat-message></li>\`)}
   </ol>
   <en-chat-composer id="chat-composer-example" .sending=\${!!this.pending} .allowEmpty=\${!!this.files?.files?.length} @en-action=\${this.send}>
    <en-textarea slot="editor" label="Message" rows="3" description="Enter adds a new line. Send with the button or Control/Command + Enter." @en-input=\${()=>{this.draftRevision++;}}></en-textarea>
    <en-file-upload class="chat-demo-picker" slot="attachments" multiple accept="image/*,.pdf" @en-change=\${(event:Event)=>{queueMicrotask(()=>{if(!event.defaultPrevented){this.fileRevision++;this.refresh();}});}}>
     <span slot="label">Attachments</span><span slot="description">Optional images or PDFs. Files stay in this browser.</span>
    </en-file-upload>
    \${this.files?.files?.length?html\`<div slot="attachments">\${this.attachments(this.files.files,true)}</div>\`:nothing}
    <span slot="status" role="status">\${this.status}</span>
   </en-chat-composer>
   <en-dialog @en-change=\${(event:Event)=>{const dialog=event.currentTarget as EnDialog;queueMicrotask(()=>{if(!event.defaultPrevented&&!dialog.open){this.preview=undefined;this.refresh();}});}} label=\${this.preview?\`Attachment preview: \${this.preview.name}\`:'Attachment preview'} presentation="responsive">
    \${this.preview?html\`<div class="chat-demo-preview">\${this.image(this.preview)?html\`<img src=\${this.url(this.preview)} alt=\${this.preview.name} @error=\${()=>{if(this.preview)this.brokenImages.add(this.preview);this.refresh();}}>\`:html\`<p><en-icon name="file"></en-icon> \${this.fileType(this.preview)} attachment\${this.brokenImages.has(this.preview)?' · Image preview unavailable':''}</p>\`}<p>\${this.preview.name} · \${this.fileSize(this.preview)}</p><a href=\${this.url(this.preview)} download=\${this.preview.name}>Download \${this.preview.name}</a></div>\`:nothing}
   </en-dialog>
   <details open><summary>Delivery simulation</summary><div style="display:flex;flex-wrap:wrap;gap:var(--en-space-actions);padding-block:var(--en-space-3)">
    <en-button variant="secondary" ?disabled=\${!this.pending} @click=\${()=>this.settle(true)}>Complete send</en-button>
    <en-button variant="secondary" ?disabled=\${!this.pending} @click=\${()=>this.settle(false)}>Fail send</en-button>
   </div><en-checkbox .checked=\${this.veto} @en-change=\${(event:Event)=>{const checkbox=event.currentTarget as HTMLInputElement;queueMicrotask(()=>{if(!event.defaultPrevented)this.veto=checkbox.checked;});}}>Application declines send</en-checkbox>
   <p>Add images or PDFs to see attachment tiles, remove them before sending, or open a local preview. Failed messages stay in the conversation with their original files and Retry action. Retry leaves the current composer untouched. Complete or fail the retry with these simulation controls. No file is uploaded and no message is sent outside this browser.</p></details>
  </section>\`;
 }
}
const chatPatternsDemo=directive(ChatPatternsDemo);
export function chatPatternsExample(resetKey:unknown=0){return html\`\${chatPatternsDemo(resetKey)}<en-composable-chat-demo></en-composable-chat-demo>\`;}`,toast:`import { html } from 'lit';
import { AsyncDirective, directive } from 'lit/async-directive.js';
import { ref } from 'lit/directives/ref.js';
import type { EnToastRegion } from '@en-reve/elements/toast-region.js';
import type { EnToast } from '@en-reve/elements/toast.js';

class ToastDemo extends AsyncDirective {
 private inlineLog='Changes saved. Undo is available in the notification.';
 private root?:HTMLElement;private key:unknown;private count=0;private max=3;private veto=false;private fixed=false;private placement='block-end-end';private swipe=true;private log='No notification action yet.';
 private get region(){return this.root?.querySelector<EnToastRegion>('en-toast-region');}
 private refresh(){this.setValue(this.render(this.key));}
 private add(kind:'saved'|'retry'|'timed'|'burst'|'variants'|'interrupt'|'long'){
  const region=this.region;if(!region)return;
  if(kind==='interrupt'){region.notify({swipe:this.swipe,message:'Your review session is about to end. Save your work now.',variant:'warning',interrupt:true});return;}
  if(kind==='variants'){for(const variant of ['info','success','warning','danger'] as const)region.notify({swipe:this.swipe,message:\`\${{info:'Information: a new preview is available.',success:'Success: your changes are saved.',warning:'Warning: your connection is unstable.',danger:'Error: the upload could not finish.'}[variant]}\`,variant});return;}
  if(kind==='burst'){for(let n=0;n<3;n++)region.notify({swipe:this.swipe,message:\`Export \${++this.count} is ready.\`,variant:'success'});return;}
  const toast=region.notify({swipe:this.swipe,message:kind==='retry'?'Upload failed. Your file is still available.':kind==='long'?'Your preview is ready. The updated layout includes the revised project title, the selected color palette, and all of your latest changes. This message is also retained in the activity below so you can read it again after the notification closes.':kind==='timed'?'Preview refreshed. This information remains in the activity below.':\`Settings snapshot \${++this.count} saved.\`,variant:kind==='retry'?'danger':'success',duration:kind==='timed'||kind==='long'?5000:0});
  if(kind==='retry'){
   const action=document.createElement('en-button');action.slot='actions';action.setAttribute('type','button');action.textContent='Retry upload';action.addEventListener('click',()=>{this.log='Upload retry succeeded locally.';region.focus();toast.open=false;this.refresh();region.notify({swipe:this.swipe,message:'Upload completed.',variant:'success'});});
   const details=document.createElement('en-button');details.slot='actions';details.setAttribute('type','button');details.setAttribute('variant','secondary');details.textContent='View details';details.addEventListener('click',()=>{this.log='Upload details: the simulated connection was interrupted. Your file is retained and ready to retry.';this.refresh();});
   toast.append(action,details);
  }
  this.log=kind==='timed'||kind==='long'?\`\${toast.messageText} Display budget: \${toast.effectiveDuration/1000} seconds each time it becomes visible; engagement pauses the countdown.\`:'Notification added. The simulated action changed no remote data.';this.refresh();
 }
 render(key:unknown=0){
  if(key!==this.key){this.key=key;this.count=0;this.max=3;this.veto=false;this.fixed=false;this.placement='block-end-end';this.swipe=true;this.region?.clearHistory();this.log='No notification action yet.';this.inlineLog='Changes saved. Undo is available in the notification.';const inline=this.root?.querySelector<EnToast>('#toast-inline-example');if(inline)inline.open=true;this.region?.querySelectorAll<EnToast>('en-toast').forEach(item=>{if(item.id==='toast-example')item.open=true;else item.remove();});}
  return html\`<section data-toast-demo \${ref(el=>{this.root=el as HTMLElement|undefined;})} style="display:grid;gap:var(--en-space-4);min-inline-size:0">
   <style>
    .toast-inline-demo { container:toast-inline / inline-size;min-inline-size:0;max-inline-size:40rem; }
    @container toast-inline (min-width:26rem) {
     /* Scope display to open toasts so the component still controls dismissal. */
     .toast-inline-demo .compact-notification[open]::part(base) { display:flex; }
     .toast-inline-demo .compact-notification::part(content) { flex:1 1 0; }
     .toast-inline-demo .compact-notification::part(actions) { flex:0 0 auto; }
     .toast-inline-demo .compact-notification > [slot="actions"] { margin-block-start:0; }
    }
   </style>
   <div style="display:flex;flex-wrap:wrap;gap:var(--en-space-actions)"><en-button @click=\${()=>this.add('saved')}>Save snapshot</en-button><en-button variant="secondary" @click=\${()=>this.add('retry')}>Simulate failed upload</en-button><en-button variant="secondary" @click=\${()=>this.add('timed')}>Timed update</en-button><en-button variant="secondary" @click=\${()=>this.add('long')}>Long timed update</en-button><en-button variant="secondary" @click=\${()=>this.add('variants')}>Show status variants</en-button><en-button variant="secondary" @click=\${()=>this.add('burst')}>Queue three updates</en-button><en-button variant="secondary" @click=\${()=>this.add('interrupt')}>Timely interruption</en-button><en-button variant="secondary" @click=\${()=>this.region?.focus()}>Focus notifications</en-button><en-button variant="secondary" @click=\${()=>this.region?.dismissAll()}>Dismiss all</en-button></div>
   <en-select label="Visible toast limit" .value=\${String(this.max)} .items=\${[{value:'0',label:'Unlimited'},{value:'1',label:'1 toast'},{value:'2',label:'2 toasts'},{value:'3',label:'3 toasts'},{value:'5',label:'5 toasts'}]} @en-change=\${(e:Event)=>{const target=e.currentTarget as HTMLSelectElement;queueMicrotask(()=>{if(!e.defaultPrevented){this.max=Number(target.value);this.refresh();}});}}></en-select>
   <en-toast-region .max=\${this.max} label="Demo notifications" history history-limit="5" placement=\${this.fixed?this.placement:'inline'} @en-change=\${(event:Event)=>{if((event.composedPath()[0] as Element)?.localName==='en-toast'&&this.veto)event.preventDefault();}}>
    <en-toast id="toast-example" variant="info" .swipe=\${this.swipe}>Notifications stay until dismissed by default. This initial message is readable before JavaScript starts.</en-toast>
   </en-toast-region>
   <details><summary>Initial HTML stack comparison</summary><en-toast-region label="Initial stack comparison" max="1"><en-toast>First server-rendered message.</en-toast><en-toast>Second server-rendered message.</en-toast><en-toast>Third server-rendered message.</en-toast></en-toast-region></details>
   <p>Simulate a failed upload to try two application-provided action buttons. View details updates the activity below and leaves the toast open; Retry upload completes the local simulation and closes it. Actions prevent timeout and keep their authored keyboard order.</p>
   <p>Notification history lists waiting messages and retains the five most recently closed messages as plain text. Clear recent history leaves open notifications untouched. Horizontal swipes are optional; buttons and Escape remain available.</p><p data-toast-log>\${this.log}</p>
   <section id="toast-inline-demo" class="toast-inline-demo" aria-labelledby="toast-inline-heading">
    <h4 id="toast-inline-heading">Inline action with CSS Parts</h4>
    <p>This second toast places Undo between its message and close button. In a narrow container, the action returns below the message.</p>
    <en-toast-region label="Inline action notifications">
     <en-toast id="toast-inline-example" class="compact-notification" variant="success" open>
      Changes saved.
      <en-button slot="actions" type="button" variant="secondary" @click=\${()=>{this.inlineLog='Changes undone locally.';this.root?.querySelector<EnToastRegion>('en-toast-region[label="Inline action notifications"]')?.focus();this.root?.querySelector<EnToast>('#toast-inline-example')?.dismiss();this.refresh();}}>Undo</en-button>
     </en-toast>
    </en-toast-region>
    <p data-toast-inline-log role="status">\${this.inlineLog}</p>
    <en-button variant="secondary" @click=\${()=>{const toast=this.root?.querySelector<EnToast>('#toast-inline-example');if(toast)toast.open=true;this.inlineLog='Changes saved. Undo is available in the notification.';this.refresh();}}>Show inline toast</en-button>
   </section>
   <details><summary>Review scenarios</summary><div style="display:grid;gap:var(--en-space-3);padding-block:var(--en-space-3)"><en-checkbox .checked=\${this.veto} @en-change=\${(e:Event)=>{const target=e.currentTarget as HTMLInputElement;queueMicrotask(()=>{if(!e.defaultPrevented)this.veto=target.checked;});}}>Application declines dismissal</en-checkbox><en-checkbox .checked=\${this.fixed} @en-change=\${(e:Event)=>{const target=e.currentTarget as HTMLInputElement;queueMicrotask(()=>{if(!e.defaultPrevented){this.fixed=target.checked;this.refresh();}});}}>Attach notifications to the window edge</en-checkbox><en-select label="Window placement" .value=\${this.placement} .items=\${['block-start-start','block-start-center','block-start-end','block-end-start','block-end-center','block-end-end'].map(value=>({value,label:value.replaceAll('-',' ')}))} @en-change=\${(e:Event)=>{const target=e.currentTarget as HTMLSelectElement;queueMicrotask(()=>{if(!e.defaultPrevented){this.placement=target.value;this.refresh();}});}}></en-select><en-checkbox .checked=\${this.swipe} @en-change=\${(e:Event)=>{const target=e.currentTarget as HTMLInputElement;queueMicrotask(()=>{if(!e.defaultPrevented){this.swipe=target.checked;this.region?.querySelectorAll<EnToast>('en-toast').forEach(toast=>toast.swipe=this.swipe);this.refresh();}});}}>Allow horizontal swipe dismissal</en-checkbox><p>Add messages while typing elsewhere. New messages announce without moving focus. Timed updates pause on hover, keyboard focus and page inactivity. Retry actions stay available. With a limit, waiting messages stack behind the last full toast and they do not count down until visible. Every return from the stack starts a full reading budget. Compare Timed update and Long timed update; the activity shows their calculated durations. Timely interruption bypasses ordinary waiting messages without hiding a focused toast. Escape dismisses only the focused notification. Turn on dismissal veto to compare controlled behavior.</p></div></details>
  </section>\`;
 }
}
const toastDemo=directive(ToastDemo);
export function toastExample(resetKey:unknown=0){return html\`\${toastDemo(resetKey)}\`;}`,"multi-step":`import { parseDate } from '@en-reve/primitives/interactions/calendar.js';
import { html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { AsyncDirective, directive } from 'lit/async-directive.js';
import { ref } from 'lit/directives/ref.js';
import type { EnProgressSteps, ProgressStep } from '@en-reve/elements/progress-steps.js';
import type { ValidationIssue } from '@en-reve/elements/validation-summary.js';

type Field = HTMLElement & { value: string; checked: boolean; updateComplete: Promise<unknown> };
const stepKeys = ['details', 'delivery', 'review'] as const;
type Step = typeof stepKeys[number];
/** Consuming application owns drafts, validation, panel state, focus and simulated transport. */
class MultiStepDemo extends AsyncDirective {
	private root?: HTMLElement;
	private key: unknown;
	private step: Step = 'details';
	private visited = new Set<Step>(['details']);
	private completed = new Set<Step>();
	private values = { title: '', email: '', date: '2026-09-18' };
	private issues: ValidationIssue[] = [];
	private status: 'editing' | 'saving' | 'failed' | 'complete' = 'editing';
	private failSave = true;
	private decline = false;
	private childContent = true;
	private epoch = 0;
	private refresh() { this.setValue(this.render(this.key)); }
	private focus(selector: string) {
		const epoch = this.epoch;
		queueMicrotask(async () => {
			if (!this.isConnected || epoch !== this.epoch) return;
			const target = this.root?.querySelector<HTMLElement & { updateComplete?: Promise<unknown> }>(selector);
			await target?.updateComplete;
			if (this.isConnected && epoch === this.epoch && target?.isConnected) target.focus();
		});
	}
	private validate(step: Step): ValidationIssue[] {
		if (step === 'details') return [
			...(!this.values.title.trim() ? [{ target: 'brief-title', message: 'Enter a project name.' }] : []),
			...(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(this.values.email) ? [{ target: 'brief-email', message: 'Enter an email address with a domain, such as name@example.com.' }] : []),
		];
		if (step === 'delivery' && (!parseDate(this.values.date) || this.values.date < '2026-09-14' || this.values.date > '2026-10-30')) return [{ target: 'brief-date', message: 'Choose a review date from September 14 through October 30, 2026.' }];
		return [];
	}
	private error(id: string) { return this.issues.find(issue => issue.target === id)?.message ?? ''; }
	private changed(event: Event, name: keyof MultiStepDemo['values']) {
		const field = event.currentTarget as Field;
		queueMicrotask(() => { if (!this.isConnected || event.defaultPrevented) return; this.values[name] = field.value; this.completed.delete(this.step); if (this.issues.length) this.issues = this.validate(this.step); this.status = 'editing'; this.refresh(); });
	}
	private move(next: Step) { this.step = next; this.visited.add(next); this.issues = []; this.status = 'editing'; this.refresh(); this.focus('[data-step-heading]'); }
	private navigation = (event: Event) => {
		const steps = event.currentTarget as EnProgressSteps;
		if (event.composedPath()[0] !== steps) return;
		const next = steps.value as Step;
		const problems = stepKeys.indexOf(next) > stepKeys.indexOf(this.step) ? this.validate(this.step) : [];
		if (this.decline || problems.length) {
			event.preventDefault();
			if (problems.length) { this.issues = problems; this.refresh(); this.focus('en-validation-summary'); }
			return;
		}
		queueMicrotask(() => { if (this.isConnected && !event.defaultPrevented) this.move(steps.value as Step); });
	};
	private submit = (event: Event) => {
		event.preventDefault(); if (this.status === 'saving' || this.status === 'complete') return;
		this.issues = this.validate(this.step);
		if (this.issues.length) { this.refresh(); this.focus('en-validation-summary'); return; }
		if (this.step !== 'review') { this.completed.add(this.step); this.move(stepKeys[stepKeys.indexOf(this.step) + 1]); return; }
		// Revalidate earlier steps, including edits made after visiting Review.
		for (const previous of ['details', 'delivery'] as const) {
			const issues = this.validate(previous);
			if (issues.length) { this.step = previous; this.issues = issues; this.refresh(); this.focus('en-validation-summary'); return; }
		}
		this.status = 'saving'; this.refresh(); const epoch = ++this.epoch;
		setTimeout(() => { if (!this.isConnected || epoch !== this.epoch) return; this.status = this.failSave ? 'failed' : 'complete'; if (this.status === 'complete') this.completed.add('review'); this.refresh(); this.focus(this.status === 'failed' ? '[data-save-error]' : '[data-step-heading]'); }, 450);
	};
	override disconnected() { ++this.epoch; if (this.status === 'saving') this.status = 'editing'; }
	render(key: unknown = 0) {
		if (key !== this.key) { this.key = key; ++this.epoch; this.step = 'details'; this.visited = new Set(['details']); this.completed = new Set(); this.values = { title: '', email: '', date: '2026-09-18' }; this.issues = []; this.status = 'editing'; this.failSave = true; this.decline = false; }
		const items: ProgressStep[] = stepKeys.map((value, index) => ({ value, label: ['Project details', 'Review date', 'Confirm brief'][index], disabled: !this.visited.has(value), status: value === this.step && this.issues.length ? 'error' : this.completed.has(value) && !this.validate(value).length ? 'complete' : 'pending' }));
		return html\`
			<section \${ref(element => { this.root = element as HTMLElement | undefined; })} data-multi-step style="display:grid;gap:var(--en-space-4);min-inline-size:0">
				<en-progress-steps id="brief-progress" label="Create a project brief" .items=\${items} .value=\${this.step} ?disabled=\${this.status === 'saving' || this.status === 'complete'} @en-change=\${this.navigation}>
					\${this.childContent ? repeat(items, item => item.value, item => html\`<en-progress-step value=\${item.value} label=\${item.label} status=\${item.status ?? 'pending'} ?disabled=\${item.disabled}><span>\${item.label}</span></en-progress-step>\`) : nothing}
				</en-progress-steps>
				<form novalidate @keydown=\${(event: KeyboardEvent) => { if (event.key === 'Enter' && !event.isComposing && event.composedPath().some(node => (node as HTMLElement).localName === 'en-text-field')) { event.preventDefault(); this.root?.querySelector('form')?.requestSubmit(); } }} @submit=\${this.submit} style="display:grid;gap:var(--en-space-4);min-inline-size:0">
					<en-validation-summary id="brief-errors" .items=\${this.issues}>\${this.childContent ? repeat(this.issues, issue => issue.target, issue => html\`<a href=\${\`#\${encodeURIComponent(issue.target)}\`}><span>\${issue.message}</span></a>\`) : nothing}</en-validation-summary>
					<h3 data-step-heading tabindex="-1" style="margin:0">\${this.status === 'complete' ? 'Project brief created' : \`Step \${stepKeys.indexOf(this.step) + 1} of 3: \${items.find(item => item.value === this.step)!.label}\`}</h3>
					<div ?hidden=\${this.step !== 'details' || this.status === 'complete'} style=\${\`display:\${this.step !== 'details' || this.status === 'complete' ? 'none' : 'grid'};gap:var(--en-space-3)\`}>
						<en-text-field id="brief-title" label="Project name" name="title" required .value=\${this.values.title} .error=\${this.error('brief-title')} ?disabled=\${this.step !== 'details'} @en-change=\${(event: Event) => this.changed(event, 'title')}></en-text-field>
						<en-text-field id="brief-email" label="Work email" type="email" name="email" required .value=\${this.values.email} .error=\${this.error('brief-email')} ?disabled=\${this.step !== 'details'} @en-change=\${(event: Event) => this.changed(event, 'email')} description="Use an address with a full domain, such as name@example.com."></en-text-field>
					</div>
					<div ?hidden=\${this.step !== 'delivery' || this.status === 'complete'}>
						<en-date-picker id="brief-date" label="Review date" name="date" required min="2026-09-14" max="2026-10-30" today="2026-09-14" .value=\${this.values.date} .error=\${this.error('brief-date')} ?disabled=\${this.step !== 'delivery'} @en-change=\${(event: Event) => this.changed(event, 'date')}></en-date-picker>
					</div>
					<div ?hidden=\${this.step !== 'review' || this.status === 'complete'}>
						<dl><dt>Project name</dt><dd>\${this.values.title}</dd><dt>Work email</dt><dd>\${this.values.email}</dd><dt>Review date</dt><dd>\${this.values.date}</dd></dl>
						<p>Return to an earlier step to make changes. Your entries are preserved.</p>
					</div>
					<div ?hidden=\${this.status !== 'failed'} data-save-error tabindex="-1"><en-alert variant="danger"><strong>The brief could not be saved.</strong> Simulated service failure. Your entries are preserved. Turn off “Simulate save failure” below and try again.</en-alert></div>
					<p role="status" aria-atomic="true" style="margin:0">\${this.status === 'saving' ? 'Saving your brief…' : this.status === 'complete' ? 'Saved in this demo only. No information was sent.' : ''}</p>
					<div style=\${\`display:\${this.status === 'complete' ? 'none' : 'flex'};flex-wrap:wrap;gap:var(--en-space-actions)\`} ?hidden=\${this.status === 'complete'}>
						<en-button variant="secondary" ?disabled=\${this.step === 'details' || this.status === 'saving'} @click=\${() => this.move(stepKeys[stepKeys.indexOf(this.step) - 1])}>Back</en-button>
						<en-button ?disabled=\${this.status === 'saving'} @click=\${() => this.root?.querySelector('form')?.requestSubmit()}>\${this.step !== 'review' ? 'Continue' : this.status === 'failed' ? 'Try again' : 'Create brief'}</en-button>
					</div>
				</form>
				<details><summary>Review scenarios</summary>
					<div style="display:grid;gap:var(--en-space-3);padding-block:var(--en-space-3)">
						<en-checkbox .checked=\${this.childContent} @en-change=\${(event: Event) => { const field = event.currentTarget as Field; queueMicrotask(() => { if (!event.defaultPrevented) { this.childContent = field.checked; this.refresh(); } }); }}>Author steps and errors with child content</en-checkbox>
						<en-checkbox .checked=\${this.failSave} @en-change=\${(event: Event) => { const field = event.currentTarget as Field; queueMicrotask(() => { if (!event.defaultPrevented) this.failSave = field.checked; }); }}>Simulate save failure</en-checkbox>
						<en-checkbox .checked=\${this.decline} @en-change=\${(event: Event) => { const field = event.currentTarget as Field; queueMicrotask(() => { if (!event.defaultPrevented) this.decline = field.checked; }); }}>Application declines step navigation</en-checkbox>
						<p>Submit empty fields to focus the summary, then follow each error link. Reach Confirm brief, return to edit, and try the failed-save recovery. Step buttons use ordinary Tab, Enter and Space; this is navigation, not a tab widget. Reset the example to start again.</p>
					</div>
				</details>
			</section>
		\`;
	}
}
const multiStepDemo = directive(MultiStepDemo);
export function multiStepExample(resetKey: unknown = 0) { return html\`\${multiStepDemo(resetKey)}\`; }`,calendar:`import { html } from 'lit';
import { guard } from 'lit/directives/guard.js';
import { AsyncDirective, directive } from 'lit/async-directive.js';
import { ref } from 'lit/directives/ref.js';

type DateControl = HTMLElement & { value: string; updateComplete: Promise<unknown> };

/** Date-only application state; no timestamp conversion or network submission. */
class CalendarDemo extends AsyncDirective {
	private form?: HTMLFormElement;
	private locale = 'en-US';
	private calendar = 'gregory';
	private firstDay = 0;
	private reject = false;
	private status = 'Choose a date between September 14 and October 30, 2026.';
	private receipt = 'No date submitted.';
	private hourCycle = 'auto';
	private rejectTime = false;
	private timeStatus = 'No time changes yet.';
	private timeReceipt = 'No date/time fields submitted.';
	private submitTime = (event:Event) => {event.preventDefault();this.timeReceipt=JSON.stringify(Object.fromEntries(new FormData(event.currentTarget as HTMLFormElement)),null,2);this.refresh();};
	private timeChanged = (event:Event) => {if(this.rejectTime)event.preventDefault();const el=event.currentTarget as DateControl;queueMicrotask(()=>{this.timeStatus=\`\${event.defaultPrevented?'Declined; retained':'Accepted'} \${el.value || '(empty)'}.\`;this.refresh();});};
	private rangeReceipt = 'No range submitted.';
	private initialRange = Object.freeze({start:'2026-09-16',end:'2026-09-18'});
	private unavailableDate = (value:string) => value === '2026-09-22';
	private resetKey: unknown;
	private refresh() { this.setValue(this.render(this.resetKey)); }
	private changed = (event: Event) => {
		const field = event.currentTarget as DateControl;
		if (event.composedPath()[0] !== field || !event.cancelable) return;
		const proposal = field.value;
		if (this.reject) event.preventDefault();
		queueMicrotask(() => {
			if (!this.isConnected) return;
			this.status = event.defaultPrevented
				? \`Application declined \${proposal || 'clearing the date'}. Accepted value: \${field.value || 'empty'}.\`
				: \`Accepted \${field.value || 'an empty date'} from \${field.localName}.\`;
			this.refresh();
		});
	};
	private preference = (event: Event, name: 'locale' | 'calendar' | 'firstDay' | 'reject') => {
		const control = event.currentTarget as DateControl & { checked: boolean };
		queueMicrotask(() => {
			if (!this.isConnected || event.defaultPrevented) return;
			if (name === 'calendar') this.calendar = control.value;
			if (name === 'locale') this.locale = control.value;
			if (name === 'firstDay') this.firstDay = Number(control.value);
			if (name === 'reject') this.reject = control.checked;
			this.refresh();
		});
	};
	private submit = (event: Event) => {
		event.preventDefault();
		const date = new FormData(event.currentTarget as HTMLFormElement).get('review-date');
		this.receipt = \`Submitted review-date: \${date || '(empty)'}. No data was sent.\`;
		this.refresh();
	};
	render(resetKey: unknown = 0) {
		if (this.resetKey !== resetKey) {
			this.resetKey = resetKey; this.calendar = 'gregory'; this.locale = 'en-US'; this.firstDay = 0; this.reject = false;
			this.status = 'Choose a date between September 14 and October 30, 2026.';
			this.receipt = 'No date submitted.';
		}
		return html\`
			<div class="calendar-demo" style="display:grid;gap:var(--en-space-4);min-inline-size:0">
				<p style="margin:0">Compare an inline calendar with a text field and calendar dialog. Both select one absolute day in the Gregorian or modern Buddhist calendar; the submitted value stays YYYY-MM-DD in every display locale.</p>
				<div style="display:flex;flex-wrap:wrap;align-items:end;gap:var(--en-space-3)">
					<en-select label="Display calendar" .value=\${this.calendar} .items=\${[
						{ value: 'gregory', label: 'Gregorian · CE' }, { value: 'buddhist', label: 'Modern Buddhist · BE (1941 onward)' },
					]} @en-change=\${(event: Event) => this.preference(event, 'calendar')}></en-select>
					<en-select label="Display locale" .value=\${this.locale} .items=\${[
						{ value: 'en-US', label: 'English (United States)' }, { value: 'pt-BR', label: 'Português (Brasil)' },
						{ value: 'th-TH', label: 'ไทย (Thai)' }, { value: 'th-TH-u-nu-thai', label: 'ไทย (Thai numerals)' }, { value: 'de-DE', label: 'Deutsch' }, { value: 'ja-JP', label: '日本語' }, { value: 'ar', label: 'العربية' },
					]} @en-change=\${(event: Event) => this.preference(event, 'locale')}></en-select>
					<en-select label="First day of week" .value=\${String(this.firstDay)} .items=\${[
						{ value: '0', label: 'Sunday' }, { value: '1', label: 'Monday' }, { value: '6', label: 'Saturday' },
					]} @en-change=\${(event: Event) => this.preference(event, 'firstDay')}></en-select>
				</div>
				<en-checkbox .checked=\${this.reject} @en-change=\${(event: Event) => this.preference(event, 'reject')}>Application declines date changes</en-checkbox>
				<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,20rem),1fr));align-items:start;gap:var(--en-space-5)">
					<section aria-labelledby="calendar-inline-title" style="min-inline-size:0">
						<h3 id="calendar-inline-title">Inline calendar</h3>
						<en-calendar id="specimen-calendar" label="Review availability" value="2026-09-18" month="2026-09-01"
							min="2026-09-14" max="2026-10-30" today="2026-09-14" .calendar=\${this.calendar} .locale=\${this.locale} .firstDayOfWeek=\${this.firstDay}
							@en-change=\${this.changed}></en-calendar>
					</section>
					<form \${ref(element => { this.form = element as HTMLFormElement | undefined; })} @submit=\${this.submit} style="display:grid;gap:var(--en-space-3);min-inline-size:0">
						<h3 style="margin-block-end:0">Plan a review</h3>
						<en-date-picker id="specimen-date-picker" name="review-date" value="2026-09-18" required
							min="2026-09-14" max="2026-10-30" today="2026-09-14" .calendar=\${this.calendar} .locale=\${this.locale} .firstDayOfWeek=\${this.firstDay}
							@en-change=\${this.changed}>
							<span slot="label">Review date</span>
							<span slot="description">September 14 through October 30, 2026. Type a date or choose it from the calendar.</span>
						</en-date-picker>
						<en-button style="justify-self:start" @click=\${() => this.form?.requestSubmit()}>Submit review date</en-button>
						<p data-calendar-receipt role="status" style="margin:0">\${this.receipt}</p>
					</form>
				</div>
				<section id="date-range-example" aria-labelledby="date-range-title">
                    <h3 id="date-range-title">Date ranges</h3>
                    <p>Choose a start and an end, in either order. September 22 is unavailable: ranges cannot cross it. The inline calendar commits a complete pair; the dialog keeps a draft until Apply range. Display preferences above affect both without changing their ISO values.</p>
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,20rem),1fr));gap:var(--en-space-5);align-items:start">
                        <en-calendar id="range-calendar" selection="range" label="Project date range" .rangeValue=\${guard([this.initialRange],()=>this.initialRange)} .unavailableDate=\${this.unavailableDate} .calendar=\${this.calendar} .locale=\${this.locale} .firstDayOfWeek=\${this.firstDay} today="2026-09-14" min="2026-09-14" max="2026-10-30" @en-change=\${(event:Event)=>{if(this.reject)event.preventDefault();}}></en-calendar>
                        <form id="range-form" style="display:grid;gap:var(--en-space-3)" @submit=\${(event:Event)=>{event.preventDefault();this.rangeReceipt=JSON.stringify(Object.fromEntries(new FormData(event.currentTarget as HTMLFormElement)));this.refresh();}}>
                            <en-date-picker id="range-picker" selection="range" label="Project period" picker-label="Choose project period" start-name="project-start" end-name="project-end" required .defaultRangeValue=\${guard([this.initialRange],()=>this.initialRange)} .unavailableDate=\${this.unavailableDate} .calendar=\${this.calendar} .locale=\${this.locale} .firstDayOfWeek=\${this.firstDay} today="2026-09-14" min="2026-09-14" max="2026-10-30" @en-change=\${(event:Event)=>{if(this.reject)event.preventDefault();}}></en-date-picker>
                            <div style="display:flex;gap:var(--en-space-2);flex-wrap:wrap"><button type="submit">Submit range</button><button type="reset">Reset range</button></div>
                            <output data-range-receipt>\${this.rangeReceipt}</output>
                        </form>
                    </div>
                    <details><summary>Range code and review scenarios</summary><pre dir="ltr"><code>&lt;en-date-picker selection="range" start-name="project-start"
  end-name="project-end" required label="Project period"&gt;
&lt;/en-date-picker&gt;

picker.rangeValue = { start: '2026-09-16', end: '2026-09-18' };
picker.unavailableDate = iso =&gt; iso === '2026-09-22';
picker.addEventListener('en-change', event =&gt; {
  // event.detail.previous / proposed are immutable pairs.
  // event.preventDefault() rejects both endpoints together.
});
// After changing state captured by the predicate:
picker.invalidateAvailability();</code></pre><p>Try an earlier second date, a same-day range, a range across September 22, Cancel, Escape, application veto, and switching calendars. Submit reads real FormData locally. Reset restores the initial pair. Required ranges need both dates; incomplete or invalid pairs are omitted from submission. Arrow keys move focus without committing; Enter or Space chooses an endpoint.</p></details>
                </section>
				                <section id="time-entry-example" aria-labelledby="time-entry-title">
                    <h3 id="time-entry-title">Time entry and date composition</h3>
                    <p>Type a local time, then press Enter or leave the field to accept it. Invalid drafts stay visible; Escape restores the accepted time. Arrow Up/Down adjusts the hours, minutes, seconds or AM/PM at the caret. The locale selector above changes the display while submitted values stay HH:mm or HH:mm:ss.</p>
                    <en-select label="Time display" .value=\${this.hourCycle} .items=\${[{value:'auto',label:'Follow locale'},{value:'12',label:'12-hour'},{value:'24',label:'24-hour'}]} @en-change=\${(event:Event)=>{const el=event.currentTarget as DateControl;queueMicrotask(()=>{this.hourCycle=el.value;this.refresh();});}}></en-select>
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,20rem),1fr));gap:var(--en-space-5);align-items:start;margin-block-start:var(--en-space-4)">
                        <form id="time-appointment-form" style="display:grid;gap:var(--en-space-3)" @submit=\${this.submitTime}>
                            <h4 style="margin:0">Appointment</h4>
                            <en-date-picker name="appointment-date" label="Appointment date" value="2026-09-18" today="2026-09-14" .calendar=\${this.calendar} .locale=\${this.locale} required></en-date-picker>
                            <en-time-field id="specimen-time-field" name="appointment-time" value="09:30" min="09:00" max="17:00" step="900" .locale=\${this.locale} .hourCycle=\${this.hourCycle} required @en-change=\${this.timeChanged}>
                                <span slot="label">Appointment time</span><span slot="description">09:00–17:00, in 15-minute increments.</span>
                            </en-time-field>
                            <div style="display:flex;gap:var(--en-space-2);flex-wrap:wrap"><en-button @click=\${(e:Event)=>(e.currentTarget as HTMLElement).closest('form')?.requestSubmit()}>Submit appointment</en-button><en-button variant="secondary" @click=\${(e:Event)=>(e.currentTarget as HTMLElement).closest('form')?.reset()}>Reset</en-button></div>
                        </form>
                        <form id="time-period-form" style="display:grid;gap:var(--en-space-3)" @submit=\${this.submitTime}>
                            <h4 style="margin:0">Start and end times</h4>
                            <en-date-picker selection="range" label="Scheduled dates" start-name="start-date" end-name="end-date" .defaultRangeValue=\${guard([this.initialRange],()=>this.initialRange)} .calendar=\${this.calendar} .locale=\${this.locale} today="2026-09-14" required></en-date-picker>
                            <en-time-field name="start-time" label="Start time" value="22:30" min="22:00" max="02:00" wrap step="900" .locale=\${this.locale} .hourCycle=\${this.hourCycle} required description="Overnight availability: 22:00 through 02:00, in 15-minute increments." @en-change=\${this.timeChanged}></en-time-field>
                            <en-time-field name="end-time" label="End time" value="01:30:15" precision="second" step="15" .locale=\${this.locale} .hourCycle=\${this.hourCycle} required description="Includes seconds, in 15-second increments." @en-change=\${this.timeChanged}></en-time-field>
                            <div style="display:flex;gap:var(--en-space-2);flex-wrap:wrap"><en-button @click=\${(e:Event)=>(e.currentTarget as HTMLElement).closest('form')?.requestSubmit()}>Submit date and time range</en-button><en-button variant="secondary" @click=\${(e:Event)=>(e.currentTarget as HTMLElement).closest('form')?.reset()}>Reset</en-button></div>
                        </form>
                    </div>
                    <en-checkbox .checked=\${this.rejectTime} @en-change=\${(event:Event)=>{const el=event.currentTarget as HTMLElement & {checked:boolean};queueMicrotask(()=>{this.rejectTime=el.checked;this.refresh();});}}>Application declines time changes</en-checkbox>
                    <p data-time-status role="status">\${this.timeStatus}</p>
                    <pre data-time-receipt aria-label="Submitted date and time fields" style="white-space:pre-wrap;overflow-wrap:anywhere">\${this.timeReceipt}</pre>
                    <p>These are separate local dates and times. Your application chooses the timezone, handles daylight-saving gaps or repeated times, and validates whether the end follows the start. No data is sent.</p>
                    <details><summary>Time code and review scenarios</summary><pre dir="ltr"><code>import '@en-reve/elements/define/time-field.js';

&lt;en-time-field name="appointment-time" label="Appointment time"
  locale="en-US" hour-cycle="12" value="09:30"
  min="09:00" max="17:00" step="900" required&gt;
&lt;/en-time-field&gt;
&lt;en-time-field name="night-time" label="Overnight time"
  min="22:00" max="02:00" wrap value="23:30"&gt;
&lt;/en-time-field&gt;

field.addEventListener('en-change', event =&gt; {
  // Canonical previous/proposed strings; preventDefault() vetoes.
});
// Date and time values remain separate FormData entries.</code></pre><p>Try 9:45 AM, invalid 9:37 AM, 24:00, seconds, switching locale and 12/24-hour display, Escape, application veto, Reset, stepping each segment and stepping across midnight. Use the page direction control for RTL and a narrow viewport for mobile review. Readonly and disabled remain available through the API.</p></details>
                </section>

				<p data-calendar-status role="status" aria-atomic="true" style="margin:0">\${this.status}</p>
				<details id="calendar-system-review">
					<summary>Calendar system review</summary>
					<p>Choose Modern Buddhist above, then Thai (or Thai numerals). Confirm that September 2026 displays in BE 2569 while the native field and submission remain 2026-09-18. Select another date, submit, and switch back to Gregorian: the accepted day must not change. Review Thai labels and era with a fluent reader; automated Intl checks are not linguistic acceptance.</p>
					<pre dir="ltr"><code>&lt;en-date-picker calendar="buddhist" locale="th-TH"
  value="2026-09-18" today="2026-09-14" name="review-date"&gt;
  &lt;span slot="label"&gt;Review date&lt;/span&gt;
&lt;/en-date-picker&gt;</code></pre>
				</details>
				<details>
					<summary>Keyboard and date handling</summary>
					<p>Tab enters the calendar date grid once. Arrow keys move by day or week; Home and End reach the week edges. Page Up and Page Down change months; Shift with those keys changes years. Enter or Space chooses the focused date. Dates outside the allowed interval cannot be selected. Escape closes the picker dialog and returns focus to its trigger.</p>
					<p>Display locale and reading direction are independent. Use the page’s Reading direction control to review RTL. Labels in this application remain English; supply translated application labels when integrating another language. Today is supplied explicitly so server rendering and hydration use the same date. Modern Buddhist dates use Gregorian-equivalent months with a BE year 543 greater than the ISO year. The supported interval begins at ISO 1941-01-01. Native date editing remains explicitly Gregorian; display-calendar changes preserve the selected ISO day. Range selection and local time entry are available above. Additional calendar systems remain outside the supported matrix.</p>
				</details>
			</div>
		\`;
	}
}
const calendarDemo = directive(CalendarDemo);
export function calendarExample(resetKey: unknown = 0) { return html\`\${calendarDemo(resetKey)}\`; }`,"tree-data":`import { treeDataKey } from '@en-reve/primitives/interactions/tree.js';
import { html } from 'lit';
import { AsyncDirective, directive } from 'lit/async-directive.js';
import { guard } from 'lit/directives/guard.js';
import { ref } from 'lit/directives/ref.js';
import type { TreeLoadContext, TreeDataItem } from '@en-reve/elements/tree.js';

function collectionItems(): readonly TreeDataItem[] {
	return Array.from({ length: 20 }, (_, folderIndex) => {
		const folder = String(folderIndex + 1).padStart(2, '0');
		return {
			key: \`folder-\${folder}\`,
			label: \`Collection \${folder}\`,
			children: Array.from({ length: 50 }, (_, assetIndex) => {
				const asset = String(assetIndex + 1).padStart(3, '0');
				return { key: \`asset-\${folder}-\${asset}\`, label: \`Asset \${folder} · \${asset}\` };
			}),
		};
	});
}

type TreeElement = HTMLElement & {
	selectedKey: string;
  selectedKeys: readonly string[];
	expandedKeys: readonly string[];
	items: readonly TreeDataItem[];
	virtualize: boolean;
	updateComplete: Promise<unknown>;
	scrollToKey(key: string, options?: ScrollIntoViewOptions): boolean;
};

/** Application-owned model, independent of the tree's mounted rows. */
class TreeDataDemo extends AsyncDirective {
	private tree?: TreeElement;
	private items = collectionItems();
	private expanded = this.items.map(item => treeDataKey(item));
	private virtualize = true;
	private selected = '';
  private values: readonly string[] = [];
  private multiple = false;
	private target = 'asset-10-025';
	private inserted = false;
	private status = '1,020 items in the model. All collections start expanded.';
	private resetKey: unknown;
	private refresh() { this.setValue(this.render(this.resetKey)); }
	private changed = (event: Event) => {
		const tree = event.currentTarget as TreeElement;
		if (event.composedPath()[0] !== tree) return;
		queueMicrotask(() => {
			if (!this.isConnected || this.tree !== tree) return;
			this.selected = tree.selectedKey; this.values = tree.selectedKeys;
			this.expanded = [...tree.expandedKeys];
			this.status = \`\${this.multiple ? \`\${this.values.length} items selected.\` : this.selected ? \`Selected \${this.selected}.\` : 'No item selected.'} \${this.expanded.length} collections expanded.\`;
			this.refresh();
		});
	};
	private toggle = (event: Event) => {
		const control = event.currentTarget as HTMLElement & { checked: boolean };
		queueMicrotask(() => {
			if (!this.isConnected || event.defaultPrevented) return;
			this.virtualize = control.checked;
			this.status = this.virtualize ? 'Windowed rendering enabled. The complete data model is retained.' : 'All expanded items are rendered. Use this mode to compare screen-reader traversal.';
			this.refresh();
		});
	};
	private jump = () => {
		if (!this.tree) return;
		const found = this.tree.scrollToKey(this.target, { behavior: 'auto', block: 'center', inline: 'nearest' });
		this.status = found ? \`Scrolled to \${this.target}. Selection and focus are unchanged.\` : \`Cannot reveal \${this.target}. Use a known key and expand its collection first.\`;
		this.refresh();
	};
	private mutate = () => {
		this.inserted = !this.inserted;
		this.items = this.items.map((item, index) => index ? item : {
			...item,
			children: this.inserted
				? [{ key: 'asset-added', label: 'New local asset' }, ...(item.children ?? [])]
				: (item.children ?? []).filter(child => treeDataKey(child) !== 'asset-added'),
		});
		if (!this.inserted) this.values = this.values.filter(key => key !== 'asset-added');
		if (!this.inserted && this.selected === 'asset-added') this.selected = '';
		this.status = this.inserted ? 'Added asset-added to Collection 01. Existing keys and selection are retained.' : 'Removed asset-added from the data model.';
		this.refresh();
	};
	render(resetKey: unknown = 0) {
		if (this.resetKey !== resetKey) {
			this.resetKey = resetKey;
			this.items = collectionItems(); this.expanded = this.items.map(item => treeDataKey(item));
			this.virtualize = true; this.multiple = false; this.values = []; this.selected = ''; this.target = 'asset-10-025'; this.inserted = false;
			this.status = '1,020 items in the model. All collections start expanded.';
		}
		return html\`
			<div class="tree-data-demo" style="display:grid;gap:var(--en-space-4);min-inline-size:0">
				<p style="margin:0">Twenty collections contain fifty assets each. Compare windowed rendering with the fully rendered expanded hierarchy; both use the same items, selection and expansion API.</p>
				<en-switch label="Virtualize expanded items" .checked=\${this.virtualize} @en-change=\${this.toggle}></en-switch>
				<en-switch label="Select multiple items" .checked=\${this.multiple} @en-change=\${(event: Event) => {
            const control = event.currentTarget as HTMLElement & { checked: boolean };
            queueMicrotask(() => { if (!this.isConnected || event.defaultPrevented) return; this.multiple = control.checked; this.values = this.selected ? [this.selected] : []; this.refresh(); });
          }}></en-switch>
          <en-tree id="specimen-tree-data" label="Large asset hierarchy" \${ref(element => { this.tree = element as TreeElement | undefined; })}
					.items=\${this.items} .expandedKeys=\${this.expanded} .multiple=\${this.multiple} .selectedKeys=\${this.values} ?virtualize=\${this.virtualize}
					@en-change=\${this.changed} style=\${this.virtualize ? 'block-size:24rem' : ''}></en-tree>
				<p data-tree-data-status role="status" aria-atomic="true" style="margin:0">\${this.status}</p>
				<div style="display:flex;flex-wrap:wrap;align-items:center;gap:var(--en-space-2)">
					<en-button variant="secondary" @click=\${this.mutate}>\${this.inserted ? 'Remove inserted child' : 'Insert child'}</en-button>
					<en-button variant="secondary" @click=\${() => { this.expanded = this.items.map(item => treeDataKey(item)); this.status = 'All collections expanded.'; this.refresh(); }}>Expand all collections</en-button>
					<en-button variant="secondary" @click=\${() => { this.expanded = []; this.status = 'All collections collapsed. Selected item identity is retained.'; this.refresh(); }}>Collapse all collections</en-button>
				</div>
				<details>
					<summary>Scroll to an item</summary>
					<div style="display:flex;flex-wrap:wrap;align-items:end;gap:var(--en-space-3);padding-block:var(--en-space-3)">
						<en-text-field label="Item key" .value=\${this.target} @en-input=\${(event: Event) => { this.target = (event.currentTarget as HTMLElement & { value: string }).value; }}></en-text-field>
						<en-button @click=\${this.jump}>Scroll to item</en-button>
					</div>
					<p>For example, <code>asset-10-025</code> belongs to <code>folder-10</code>. Expand the ancestor before scrolling to a hidden descendant. Unknown or collapsed keys return <code>false</code>.</p>
				</details>
				<details>
					<summary>Keyboard and accessibility review</summary>
					<p>Tab enters the tree once. Up/Down, Home/End and typeahead move between expanded items. The forward arrow expands or enters a collection; the backward arrow collapses it or reaches its parent, following reading direction. Enter or Space selects. With multiple selection on, Plain click selects one item; Command/Ctrl+click, Space or Enter toggles one item. Shift+click, Shift+Space and Shift+Up/Down/Home/End select the exact inclusive enabled visible range. Control/Command+A toggles all enabled visible items, including those outside the mounted window. Collapsing branches retains selection; plain click and Shift ranges replace the selection. Scroll far from a focused row, then continue navigation to verify continuity.</p>
					<p>Virtualization limits the mounted accessibility tree. Compare both modes with your screen reader. Browser snapshots and keyboard checks do not establish that every assistive technology traverses a changing window correctly; a fully rendered hierarchy remains available.</p>
				</details>
          <section aria-labelledby="tree-multiple-title" style="display:grid;gap:var(--en-space-3)">
            <h3 id="tree-multiple-title">Multiple selection with authored children</h3>
            <p>Click to select one item, Command/Ctrl+click to toggle one, or Shift+click to select a range. Branch disclosure only expands or collapses; it does not select descendants.</p>
            <en-tree id="specimen-tree-multi" label="Deliverables" multiple .expandedKeys=\${['design']} .selectedKeys=\${['cover']}>
              <en-tree-item value="design" label="Design">
                <en-tree-item slot="children" value="cover" label="Cover"></en-tree-item>
                <en-tree-item slot="children" value="poster" label="Poster"></en-tree-item>
                <en-tree-item slot="children" value="locked" label="Locked original" disabled></en-tree-item>
              </en-tree-item>
              <en-tree-item value="notes" label="Notes"></en-tree-item>
            </en-tree>
            <pre dir="ltr"><code>\${\`<en-tree label="Deliverables" multiple>
  <en-tree-item value="cover" label="Cover"></en-tree-item>
  <en-tree-item value="poster" label="Poster"></en-tree-item>
</en-tree>

// The same state API works with .items and virtualize.
tree.values = ['cover', 'poster'];
tree.addEventListener('en-change', event => {
  // Synchronously preventDefault() to reject a proposal.
  queueMicrotask(() => console.log(tree.values));
});\`}</code></pre>
          </section>
			</div>
		\`;
	}
}
const treeDataDemo = directive(TreeDataDemo);
export function treeDataExample(resetKey: unknown = 0) { return html\`\${treeDataDemo(resetKey)}\${treeOperationsDemo(resetKey)}\`; }


const operationItems = (): readonly TreeDataItem[] => [
  {key:'library',label:'Library',branch:true,children:[{key:'cover',label:'Cover study'},{key:'poster',label:'Poster study'}]},
  {key:'drafts',label:'Drafts',lazy:true},
  {key:'references',label:'References',lazy:true},
  {key:'archive',label:'Empty archive',branch:true},
  {key:'locked',label:'Locked collection',branch:true,disabled:true},
];
class TreeOperationsDemo extends AsyncDirective {
  private initial = operationItems();
  private expanded = ['library'];
  private values = ['cover'];
  private virtual = true;
  private rejectMoves = false;
  private resetKey: unknown;
  private pending = new Map<string,{resolve:(children:readonly TreeDataItem[])=>void;reject:(error:Error)=>void;signal:AbortSignal}>();
  private refresh = () => { if(this.isConnected) this.setValue(this.render(this.resetKey)); };
  private load = ({key,signal}:TreeLoadContext) => new Promise<readonly TreeDataItem[]>((resolve,reject)=> {
    const request={resolve,reject,signal};this.pending.set(key,request);
    signal.addEventListener('abort',()=>{if(this.pending.get(key)===request)this.pending.delete(key);reject(new Error('Canceled'));this.refresh();},{once:true});
    this.refresh();
  });
  private finish(key:string, mode:'loaded'|'empty'|'error') {
    const request=this.pending.get(key);if(!request)return;this.pending.delete(key);
    if(mode==='error')request.reject(new Error('Simulated failure'));
    else request.resolve(mode==='empty'?[]:Array.from({length:80},(_,index)=>({key:\`\${key}-\${index+1}\`,label:\`\${key} item \${index+1}\`})));
    this.refresh();
  }
  render(resetKey:unknown=0) {
    if(resetKey!==this.resetKey){
      this.resetKey=resetKey;this.initial=operationItems();this.expanded=['library'];this.values=['cover'];this.virtual=true;this.rejectMoves=false;
      this.pending.clear();
    }
    return html\`<section id="tree-operations-example" style="display:grid;gap:var(--en-space-3);margin-block-start:var(--en-space-6)">
      <h3>Lazy branches and moving items</h3>
      <p>Expand Drafts and References to request children, then complete or fail each simulated request below. Collapse a folder while loading to cancel it. Retry appears when a failed row is focused. Files stay local; no network service is called.</p>
      <en-switch label="Virtualize loaded branches" .checked=\${this.virtual} @en-change=\${(event:Event)=>{const control=event.currentTarget as HTMLElement & {checked:boolean};queueMicrotask(()=>{if(!event.defaultPrevented){this.virtual=control.checked;this.refresh();}});}}></en-switch>
      <en-switch label="Reject proposed moves" .checked=\${this.rejectMoves} @en-change=\${(event:Event)=>{const control=event.currentTarget as HTMLElement & {checked:boolean};queueMicrotask(()=>{if(!event.defaultPrevented){this.rejectMoves=control.checked;this.refresh();}});}}></en-switch>
      <en-tree id="specimen-tree-operations" label="Working collections" multiple reorderable
        .items=\${guard([this.resetKey],()=>this.initial)} .expandedKeys=\${guard([this.resetKey],()=>this.expanded)} .selectedKeys=\${guard([this.resetKey],()=>this.values)} .loadChildren=\${this.load} ?virtualize=\${this.virtual}
        style=\${this.virtual?'block-size:32rem':''}
        @en-reorder=\${(event:Event)=>{if(this.rejectMoves)event.preventDefault();}}></en-tree>
      <div aria-label="Simulated branch requests" style="display:grid;gap:var(--en-space-2)">
        \${[...this.pending].map(([key])=>html\`<div style="display:flex;flex-wrap:wrap;align-items:center;gap:var(--en-space-2)"><span>\${key}: waiting for application</span>
          <en-button @click=\${()=>this.finish(key,'loaded')}>Complete \${key}</en-button>
          <en-button @click=\${()=>this.finish(key,'empty')}>Empty \${key}</en-button>
          <en-button @click=\${()=>this.finish(key,'error')}>Fail \${key}</en-button>
        </div>\`)}
      </div>
      <p>Drag a row to reorder it. On touch, drag the grip on the right; swipe elsewhere to scroll. Selected rows move together. The preview names the destination: the middle of a folder means inside; its top/bottom quarters mean before/after. For files, the upper/lower halves mean before/after. Load an unknown folder before moving into it. Escape cancels. For keyboard or single-pointer operation without dragging, press Alt+M on a row. The Move interface can target known items outside the virtual window.</p>
      <details><summary>Lazy loading and move API example</summary><pre dir="ltr"><code>\${\`tree.items = [{ key: 'drafts', label: 'Drafts', lazy: true }];
tree.loadChildren = async ({ key, signal, requestId }) => {
  return app.loadChildren(key, { signal, requestId });
};
// Expand to load. Collapse aborts; stale results are ignored.
tree.expandedKeys = ['drafts'];
await tree.loadBranch('drafts'); // explicit retry/refresh
console.log(tree.getBranchState('drafts'));
tree.addEventListener('en-load-state-change', event => {
  // Loading, loaded, empty, error, or canceled (idle).
  console.log(event.detail);
});

tree.reorderable = true;
tree.addEventListener('en-reorder', event => {
  // Proposal is before mutation. Veto synchronously if disallowed.
  if (!app.canMove(event.detail)) event.preventDefault();
});
tree.openMove(['cover', 'poster']); // accessible chooser
// Or use the same transaction programmatically:
tree.moveItems(['cover', 'poster'], 'archive', 'inside');\`}</code></pre></details>
      <h4>Move authored children</h4>
      <p>This tree preserves slotted label nodes when moving. Empty folders use the branch attribute. An app that loads authored content appends its own child elements.</p>
      <en-tree id="specimen-tree-authored-moves" label="Authored working collections" multiple reorderable .expandedKeys=\${guard([this.resetKey],()=>this.expanded)} .selectedKeys=\${guard([this.resetKey],()=>this.values)}>
        <en-tree-item value="library" label="Library" branch>
          <en-tree-item slot="children" value="cover"><span slot="label">Cover <strong>study</strong></span></en-tree-item>
          <en-tree-item slot="children" value="poster" label="Poster study"></en-tree-item>
        </en-tree-item>
        <en-tree-item value="archive" label="Empty archive" branch></en-tree-item>
      </en-tree>
    </section>\`;
  }
}
const treeOperationsDemo=directive(TreeOperationsDemo);`,"native-navigation":`import { html } from 'lit';

export function nativeNavigationExample() {
	return html\`
		<en-navigation label="Explore related patterns">
			<a href="#fields">Fields</a>
			<a href="#choices">Selection</a>
			<a href="#overlays">Overlays</a>
		</en-navigation>
		<p>These are ordinary links: Tab moves between them, Enter follows a destination, and your browser owns history and opening another tab.</p>
		<p>The page’s navigation uses the same element with <code>sticky</code> and the optional <code>attachAnchorNavigation</code> adapter. Its skip link appears on keyboard focus.</p>
	\`;
}`,pagination:`import { html } from 'lit';
import { AsyncDirective, directive } from 'lit/async-directive.js';







/** Each rendered example owns its data and reacts only to accepted pagination. */
class PaginationDemo extends AsyncDirective {
	private page = 1;
	private unknownPage = 1;
	private hold = false;
	private status = 'Showing studies 1–3. Choose another page.';
	private unknownStatus = 'First batch loaded. The total is not yet known.';
	private readonly studies = Array.from({ length: 36 }, (_, index) => \`Project study \${String(index + 1).padStart(2, '0')}\`);

	private change(event: Event, unknown: boolean) {
		const pager = event.currentTarget as HTMLElement & { page: number };
		if (event.composedPath()[0] !== pager || !event.cancelable || event.defaultPrevented) return;
		const proposed = (event as CustomEvent<{ proposed: number }>).detail.proposed;
		if (!unknown && this.hold) {
			event.preventDefault();
			this.status = \`Page \${this.page} retained. The application canceled this change.\`;
			this.setValue(this.render());
			return;
		}
		queueMicrotask(() => {
			if (!this.isConnected || !pager.isConnected || event.defaultPrevented || pager.page !== proposed) return;
			if (unknown) {
				this.unknownPage = proposed;
				this.unknownStatus = proposed === 3 ? 'Batch 3 loaded. The application reports no further batch.' : \`Batch \${proposed} loaded. Another batch is available.\`;
			} else {
				this.page = proposed;
				this.status = \`Page \${proposed} of 12. Showing studies \${(proposed - 1) * 3 + 1}–\${proposed * 3}.\`;
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
		return html\`
			<en-stack>
				<p>Choose a page of local studies. The application owns these records; the pagination control owns its navigation controls and current page.</p>
				<ol start=\${first + 1} aria-label="Project studies">\${this.studies.slice(first, first + 3).map(study => html\`<li>\${study}</li>\`)}</ol>
				<en-pagination id="api-pagination" label="Project study pages" .page=\${this.page} .pageCount=\${12}
					@en-change=\${(event: Event) => this.change(event, false)}></en-pagination>
				<en-checkbox .checked=\${this.hold} @en-change=\${(event: Event) => this.holdChanged(event)}>Hold current page</en-checkbox>
				<p role="status" aria-label="Project page result">\${this.status}</p>
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
					<en-pagination id="api-pagination-unknown" label="Study batch pages" .page=\${this.unknownPage} .pageCount=\${0}
						.hasNext=\${this.unknownPage < 3} @en-change=\${(event: Event) => this.change(event, true)}></en-pagination>
					<p role="status" aria-label="Batch result">\${this.unknownStatus}</p>
				</details>
			</en-stack>
		\`;
	}
}
const paginationDemo = directive(PaginationDemo);
export function paginationExample() {
	return html\`\${paginationDemo()}\`;
}`,breadcrumbs:`import { html } from 'lit';

export function breadcrumbsExample() {
	return html\`
		<en-breadcrumbs label="Pattern location">
			<a href="#sheet">Sticker sheet</a>
			<span aria-current="location">Navigation patterns</span>
		</en-breadcrumbs>
		<p>Follow the links to earlier locations in the path. The consuming page supplies native links and marks the current location with <code>aria-current</code>.</p>
	\`;
}`,tabs:`import { html } from 'lit';

export function tabsExample() {
	return html\`
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
	\`;
}`,accordion:`import { html } from 'lit';

export function accordionExample() {
	return html\`
		<en-accordion multiple .value=\${['layout']}>
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
	\`;
}`,"data-table":`import { TableModel } from '@en-reve/primitives/state/table.js';
import { tableColgroup, tableHeader, tableRows, type TableColumn } from '@en-reve/primitives/templates/table.js';
import type { EnDataTable, TableSort, TableMode } from '@en-reve/elements/data-table.js';
import { html } from 'lit';
import { AsyncDirective, directive } from 'lit/async-directive.js';
import { ref } from 'lit/directives/ref.js';




// Include tableStyles/table.css in the authored table's root. en-data-table includes it internally.
type StudyRecord={id:string;number:number;name:string;kind:string;notes:string};
class DataTableComparison extends AsyncDirective {
  private root?:HTMLElement;
  private records:StudyRecord[]=Array.from({length:1000},(_,index)=>({id:\`study-\${index+1}\`,number:index+1,name:\`Study \${String(index+1).padStart(4,'0')}\`,kind:index%3?'Image':'Document',notes:index%4?'Ready for review.':'A longer description that wraps when space becomes limited or the text size changes.'}));
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
    {key:'name',label:'Study',rowHeader:true,compare:(a,b)=>a.number-b.number,renderCell:row=>html\`<strong>\${row.name}</strong><p style="font-weight:normal;margin-block:.5rem">\${row.notes}</p>\`},
    {key:'kind',label:'Kind',width:'22%',renderCell:row=>html\`<en-badge>\${row.kind}</en-badge>\`},
    {key:'open',label:'Action',width:'8rem',renderCell:row=>html\`<en-button size="small" variant="ghost" @click=\${()=>{this.message=\`Opened \${row.name}. This action belongs to the application.\`;this.refresh();}}>Open<span style="position:absolute;inline-size:1px;block-size:1px;overflow:hidden;clip-path:inset(50%)"> \${row.name}</span></en-button>\`},
  ];
  private composedColumns:readonly TableColumn<StudyRecord>[]=[{key:'selection',label:'Selection',headerLabelHidden:true,width:'4.5rem',renderCell:row=>html\`<en-checkbox class="table-choice" label=\${\`Select \${row.name}\`} .checked=\${this.selected.includes(row.id)} @en-change=\${(event:CustomEvent<{proposed:boolean}>)=>{if(this.locked){event.preventDefault();return;}queueMicrotask(()=>{if(!event.defaultPrevented){this.selected=event.detail.proposed?[...this.selected,row.id]:this.selected.filter(key=>key!==row.id);this.refresh();}});}}></en-checkbox>\`},...this.columns];
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
      this.message=\`\${this.selected.length} selected. Sort: \${this.sort.direction}.\`;this.refresh();
    });
  };
  private geometry=()=>{
    if(!this.root)return;
    const doc=this.root.ownerDocument;this.roomy=!this.roomy;
    if(!this.sheet){this.sheet=new CSSStyleSheet();doc.adoptedStyleSheets=[...doc.adoptedStyleSheets,this.sheet];}
    this.sheet.replaceSync(\`[data-table-demo] en-data-table { --en-table-cell-block-padding:\${this.roomy?'1.75rem':'.5rem'}; }\`);
    // CSSOM replacement does not emit a MutationObserver record. Explicitly
    // invalidate unseen estimates while retaining the visible key and focus.
    this.table?.invalidateMeasurements();this.message='CSSOM density changed; row measurements invalidated explicitly.';this.refresh();
  };
  override render(){return html\`<section data-table-demo \${ref(this.connect)}>
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
      <en-select label="Delivery" .value=\${this.mode} .items=\${[{value:'paginated',label:'Paginated reading'},{value:'windowed',label:'Virtual window'},{value:'all',label:'Complete table'}]} @en-change=\${(e:CustomEvent<{proposed:TableMode}>)=>queueMicrotask(()=>{if(!e.defaultPrevented){this.mode=e.detail.proposed;this.refresh();}})}></en-select>
      <en-checkbox .checked=\${this.images} @en-change=\${(e:CustomEvent<{proposed:boolean}>)=>queueMicrotask(()=>{if(!e.defaultPrevented){this.images=e.detail.proposed;this.model.setFilter(this.images?row=>row.kind==='Image':undefined);this.refresh();}})}>Images only</en-checkbox>
      <en-checkbox .checked=\${this.locked} @en-change=\${(e:CustomEvent<{proposed:boolean}>)=>queueMicrotask(()=>{if(!e.defaultPrevented){this.locked=e.detail.proposed;this.refresh();}})}>Prevent selection and sorting</en-checkbox>
    </div>
    <p>Virtual mode mounts only a window of records. Choose Paginated reading for continuous traversal of each page, browser Find and printing. The recorded VoiceOver traversal issue remains under investigation.</p>
    <en-data-table id="records-table" label="Project studies" selection="multiple" page-size="10" .items=\${this.records} .columns=\${this.columns} .getKey=\${this.key} .rowLabel=\${this.rowLabel} .selectedKeys=\${this.selected} .sort=\${this.sort} .mode=\${this.mode} .filter=\${this.images?this.imageFilter:undefined} @en-selection-change=\${this.accept} @en-sort=\${this.accept}></en-data-table>
    <div class="choices"><en-button variant="secondary" @click=\${()=>{const found=this.table?.scrollToKey('study-901',{block:'start',container:'nearest'});this.message=found?'Reveal requested for Study 0901. Focus and selection are unchanged.':'Study not in the filtered collection.';this.refresh();}}>Show Study 0901</en-button><en-button variant="secondary" @click=\${this.geometry}>Change CSSOM density</en-button></div>
    <p role="status">\${this.message}</p>
    <details><summary>Compare the authored helper route</summary>
      <p>This table uses the same cell definitions and selection, with TableModel and native markup. The application supplies checkbox wiring, paging and structure. Use this route for grouped/spanning headers, custom row sections or a framework that owns its cells.</p>
      <en-table label="Composed studies"><table aria-rowcount=\${this.model.rowCount()}><caption>Composed studies · first page</caption>\${tableColgroup(this.composedColumns)}<thead>\${tableHeader(this.composedColumns,{sort:this.sort,onSort:sort=>{if(this.locked){this.message='The application canceled sorting.';}else{this.sort=sort;this.model.setSort(sort);}this.refresh();}})}</thead><tbody>\${tableRows(this.model,this.composedColumns,{rowSelected:row=>this.selected.includes(row.id)})}</tbody></table></en-table>
      <p><a href="/api-examples/virtual-collection?progress-report">Full composed virtual collection lab</a> · <a href="/api-reference?component=en-data-table&progress-report">Data table API</a></p>
    </details>
  </section>\`;}
  private imageFilter=(row:StudyRecord)=>row.kind==='Image';
}
const dataTableComparison=directive(DataTableComparison);
export function dataTableExample(){return html\`\${dataTableComparison()}\`;}`,"split-view":`import { html } from 'lit';
import { AsyncDirective, directive } from 'lit/async-directive.js';
import { ref } from 'lit/directives/ref.js';




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
  override render(){return html\`<section data-split-workspace \${ref(this.connect)}><style>
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
    <en-split-view id="workspace-split" class=\${this.narrow?'workspace narrow':'workspace'}
      label="Resize navigation" value="25" min="15" max="45" collapsible="primary" primary-label="Navigation"
      .orientation=\${this.narrow?'vertical':'horizontal'} @en-collapse=\${this.visibility}>
      <section slot="primary" class="pane"><h3>Navigation</h3>
        <en-navigation label="Workspace sections" layout="sidebar">
          <a href="#workspace-title">Overview</a>
          <en-navigation-group label="Project" open><a href="#workspace-title" aria-current="location">Project brief</a><a href="#inspector-heading">Inspector</a></en-navigation-group>
        </en-navigation>
      </section>
      <en-split-view id="inspector-split" slot="secondary" label="Resize content and inspector" value="65" min="35" max="80" collapsible="secondary" secondary-label="Inspector" .orientation=\${this.narrow?'vertical':'horizontal'}>
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
    <p role="status">\${this.result}</p>
    <details><summary>Review scenarios</summary>
      <en-checkbox .checked=\${this.locked} @en-change=\${(e:CustomEvent<{proposed:boolean}>)=>{this.locked=e.detail.proposed;this.refresh();}}>Prevent pane visibility changes</en-checkbox>
      <p>Try canceling a collapse, resizing in either direction, and narrowing the window while a pane is hidden. Resizing remains available when visibility changes are prevented.</p>
      <h3>Initially collapsed pane</h3>
      <en-split-view id="initially-collapsed" collapsed="primary" primary-label="Reference" value="40" style="block-size:12rem">
        <p slot="primary">Reference notes are retained.</p><p slot="secondary">Authored visibility is delivered before JavaScript. Restore exposes the reference notes.</p>
      </en-split-view>
    </details></section>\`;}
}
const splitWorkspaceDemo=directive(SplitWorkspaceDemo);
export function splitViewExample(){return html\`\${splitWorkspaceDemo()}\`;}`,"split-view-vertical":`import { html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

export function verticalSplitViewExample() {
	return html\`
		<en-split-view
			orientation="vertical"
			label="Resize preview pane"
			value="50"
			min="20"
			max="80"
			style=\${styleMap({ blockSize: 'calc(var(--en-layout-panel-preferred) * 1.5)' })}
		>
			<en-stack
				slot="primary"
				align="center"
				gap="small"
				style=\${styleMap({
					minBlockSize: '0',
					blockSize: '100%',
					padding: 'var(--en-space-4)',
					background: 'var(--en-color-canvas)',
				})}
			>
				<en-badge variant="accent">Canvas preview</en-badge>
				<div
					aria-hidden="true"
					style=\${styleMap({
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
				style=\${styleMap({
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
	\`;
}`,card:`import { html } from 'lit';

export function cardExample() {
	return html\`
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
	\`;
}`,identity:`import { html } from 'lit';

export function identityExample() {
	return html\`
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
			\${['plus', 'check', 'close', 'search', 'arrow-right', 'chevron-down', 'info', 'warning', 'sparkles'].map(name => html\`
				<en-icon name=\${name} label=\${name}></en-icon>
			\`)}
		</div>
	\`;
}`,messages:`import { html } from 'lit';

export function messagesExample() {
	return html\`
		<en-alert variant="info">Your team can continue editing while the export runs.</en-alert>
		<en-alert variant="success">Changes saved to this review.</en-alert>
		<en-alert variant="warning" dismissible>Some images are still processing.</en-alert>
		<en-alert variant="danger">Export interrupted. Your changes are preserved.</en-alert>
	\`;
}`,loading:`import { html } from 'lit';

export function loadingExample() {
	return html\`
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
	\`;
}`,"dialog-drawer":`import { html } from 'lit';

export function dialogDrawerExample() {
	type Overlay = HTMLElement & { hide(): void };
	const closeDialog = (event: Event) => {
		(event.currentTarget as HTMLElement).closest<Overlay>('en-dialog')?.hide();
	};
	return html\`
		<style>@layer en.docs { .specimen-row { display:flex;align-items:center;gap:var(--en-space-actions, var(--en-space-1-5));flex-wrap:wrap; } }</style>
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
					<en-button @click=\${closeDialog}>Done</en-button>
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
	\`;
}`,"popover-tooltip":`import { html } from 'lit';

export function popoverTooltipExample() {
	return html\`
		<style>@layer en.docs { .specimen-row { display:flex;align-items:center;gap:var(--en-space-actions, var(--en-space-1-5));flex-wrap:wrap; } }</style>
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
	\`;
}`,"tooltip-warmup":`/** Docs-owned consumption helpers; no component state or event protocol lives here. */
type ValueHost<T> = HTMLElement & { value: T };

function source(event: Event): HTMLElement | undefined {
	// Only the cancelable semantic change can transfer accepted state to the app.
	if (event.type !== 'en-change' || !event.cancelable) return;
	const host = event.currentTarget as HTMLElement | null;
	// A slotted/nested control's bubbling change does not belong to this field.
	return host && event.composedPath()[0] === host ? host : undefined;
}

/** Decide synchronously, then authoritatively accept through the public setter. */
export function acceptValueChange<T>(event: Event, decide: (proposed: T) => T | undefined): void {
	const host = source(event) as ValueHost<T> | undefined;
	if (!host || event.defaultPrevented) return;
	event.preventDefault();
	const accepted = decide((event as CustomEvent<{ proposed: T }>).detail.proposed);
	// Undefined rejects the proposal. Equal writes still supersede rollback.
	if (accepted !== undefined) host.value = accepted;
}

/** Observe only an uncanceled proposal that remains the current accepted value. */
export function afterAcceptedChange<Host extends HTMLElement, T>(
	event: Event, read: (host: Host) => T, observe: (value: T, host: Host) => void,
): void {
	const host = source(event) as Host | undefined;
	if (!host || event.defaultPrevented) return;
	const proposed = (event as CustomEvent<{ proposed: T }>).detail.proposed;
	if (!Object.is(read(host), proposed)) return;
	// currentTarget is cleared after dispatch. Capture the host now; let all
	// synchronous listeners cancel or authoritatively supersede this proposal.
	queueMicrotask(() => {
		if (!event.defaultPrevented && host.isConnected && Object.is(read(host), proposed)) observe(proposed, host);
	});
}

import { ContextProvider, tooltipWarmupContext, createTooltipWarmupGroup } from '@en-reve/elements/context.js';
import { html, css, LitElement } from 'lit';



/** One independent warmup scope per demo instance; tooltip hosts remain siblings of the toolbar. */
class TooltipContextDemo extends LitElement {
  static override styles = css\`:host{display:block} p{margin-block:var(--en-space-3,.75rem)}\`;
  constructor() {
    super();
    new ContextProvider(this, {context: tooltipWarmupContext, initialValue: createTooltipWarmupGroup()});
  }
  protected override render() {
    return html\`
      <en-toolbar label="Contextual editing guidance">
        <en-button id="context-canvas" variant="secondary">Canvas help</en-button>
        <en-button id="context-layers" variant="secondary">Layer help</en-button>
      </en-toolbar>
      <en-tooltip for="context-canvas"><span slot="content">Arrange the canvas before exporting.</span></en-tooltip>
      <en-tooltip for="context-layers"><span slot="content">Inspect a layer’s properties.</span></en-tooltip>
      <p>These tooltips omit <code>warmup-group</code>. Their triggers inherit one provider from this example’s host. Hover the first button, then the second; keyboard focus and Escape follow the same rules as explicit groups.</p>\`;
  }
}
if (!customElements.get('en-tooltip-context-demo')) customElements.define('en-tooltip-context-demo', TooltipContextDemo);

/** Public logical placement API; the demo owns only its form controls. */
class TooltipPositionDemo extends LitElement {
  static override properties = { inline: { state: true }, block: { state: true }, direction: { state: true } };
  private declare inline: string;
  private declare block: string;
  private declare direction: string;
  static override styles = css\`
    :host { display: block; }
    .controls { display: flex; flex-wrap: wrap; gap: var(--en-space-4, 1rem); }
    en-select { flex: 1 1 9rem; min-inline-size: 0; }
    .stage { position: relative; display: grid; place-items: center; min-block-size: 14rem; margin-block: var(--en-space-4, 1rem); padding: var(--en-space-4, 1rem); border: 1px solid var(--en-color-boundary); border-radius: var(--en-radius-container); }
    .stage > en-tooltip { position: absolute; }
    p { margin-block: var(--en-space-3, .75rem); }
    code { overflow-wrap: anywhere; }
  \`;
  constructor() { super(); this.inline = 'center'; this.block = 'end'; this.direction = 'ltr'; }
  private choose(event: Event, key: 'inline' | 'block' | 'direction') {
    acceptValueChange<string>(event, value => { this[key] = value; return value; });
  }
  protected override render() {
    const regions = ['start', 'center', 'end'].map(value => ({ value, label: value }));
    return html\`
      <div class="controls">
        <en-select label="Inline region" .value=\${this.inline} .items=\${regions} @en-change=\${(e: Event) => this.choose(e, 'inline')}></en-select>
        <en-select label="Block region" .value=\${this.block} .items=\${regions} @en-change=\${(e: Event) => this.choose(e, 'block')}></en-select>
        <en-select label="Reading direction" .value=\${this.direction} .items=\${[{ value: 'ltr', label: 'Left to right' }, { value: 'rtl', label: 'Right to left' }]} @en-change=\${(e: Event) => this.choose(e, 'direction')}></en-select>
      </div>
      <div class="stage" dir=\${this.direction}>
        <en-button id="position-help" variant="secondary">Hover or focus for help</en-button>
        <en-tooltip for="position-help" inline=\${this.inline} block=\${this.block}>
          <span slot="content">Help follows your chosen logical region.</span>
        </en-tooltip>
      </div>
      <p><code>&lt;en-tooltip for="position-help" inline="\${this.inline}" block="\${this.block}"&gt;</code></p>
      <p>Start/end follow the trigger’s direction. Corners sit outside both edges; center/center uses block end. At viewport edges, help flips or shifts to remain readable. Resize or scroll while help is open to try it.</p>
    \`;
  }
}
if (!customElements.get('en-tooltip-position-demo')) customElements.define('en-tooltip-position-demo', TooltipPositionDemo);

export function tooltipWarmupExample() {
	return html\`
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
	\`;
}`,"theme-scopes":`import { emitThemeCSS, resolveTheme, type ThemeDensity } from '@en-reve/tokens';

const inverseCache = new Map<ThemeDensity,string>();

/** The existing inverse specimen remains an independent, unpinned full scope. */
export function inversePreviewCSS(density: ThemeDensity): string {
	const cached = inverseCache.get(density);
	if (cached !== undefined) return cached;
	const light = resolveTheme({name:'inverse',mode:'light',density});
	const dark = resolveTheme({name:'inverse',mode:'dark',density});
	const inverse = '[data-en-theme="inverse"]';
	const autoDark = ':root:not([data-en-appearance="light"]):not([data-en-appearance="dark"]) ' + inverse;
	const forcedDark = ':root[data-en-appearance="dark"] ' + inverse;
	const branch = (theme: typeof light, selector: string) => emitThemeCSS(theme,{selector,colorScheme:true});
	const css = branch(dark,inverse)
		+ \`@media (prefers-color-scheme: dark) {\\n\${branch(light,autoDark)}}\\n\`
		+ branch(light,forcedDark);
	inverseCache.set(density,css);
	return css;
}

import { html } from 'lit';
import { html as staticHtml, unsafeStatic } from 'lit/static-html.js';


/** Only library-generated theme CSS enters the static style template, never user markup. */
export function themeScopesExample({ density = 'comfortable' }: { density?: ThemeDensity } = {}) {
	return html\`
		\${staticHtml\`<style>\${unsafeStatic(inversePreviewCSS(density))}</style>\`}
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
	\`;
}`,"local-override":`import { html } from 'lit';

export function localOverrideExample() {
	return html\`
		<p>Only this control uses square corners. Change the page settings to see the rest continue to inherit.</p>
		<en-button style="--en-control-radius:0px;--en-button-radius:0px">Local customization</en-button>
	\`;
}`,"family-geometry":`import { html } from 'lit';

export function familyGeometryExample() {
	return html\`
		<style>
			@layer en.docs {
				.geometry-scope > p { margin-block-end:var(--en-space-3);font-weight:var(--en-font-label-strong-weight); }
				.geometry-controls { display:flex;align-items:end;flex-wrap:wrap;gap:var(--en-space-fields); }
				.geometry-controls > :not(en-button) { flex:1 1 10rem;min-inline-size:0; }
			}
		</style>
		<p>Both rows use the default medium size. The second row gives actions more inline space, tightens field padding and reduces the segmented frame inset.</p>
		\${['Shared defaults', 'Scoped family geometry'].map((label, index) => html\`
			<div class="geometry-scope" style=\${index ? '--en-button-inline-padding:var(--en-space-5);--en-input-inline-padding:var(--en-space-2);--en-segmented-control-frame-inset:var(--en-space-0-5)' : ''}>
				<p>\${label}</p>
				<div class="geometry-controls">
					<en-button>Save</en-button>
					<en-text-field label="Project" value="Studio studies"></en-text-field>
					<en-select label="Units" value="px" .items=\${[{ value: 'px', label: 'Pixels' }, { value: 'rem', label: 'Rem' }]}></en-select>
					<en-number-field label="Scale" value="2" min="1" max="10"></en-number-field>
					<en-segmented-control label="Canvas" value="design" .items=\${[{ value: 'design', label: 'Design' }, { value: 'preview', label: 'Preview' }]}></en-segmented-control>
				</div>
			</div>
		\`)}
	\`;
}`,"child-authored-choices":`import { html } from 'lit';

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
				const existing = parent.querySelector(\`:scope > \${choice.tag}[data-added-choice="\${choice.value}"]\`);
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
			\`Submitted format: \${values.get('exportFormat')}; layout: \${values.get('canvasLayout')}.\`;
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
	return html\`
		<div class="child-authored-choice-example">
			<p>Choose an export format and canvas layout, then submit their values. Select labels stay plain text; segmented labels keep their inline emphasis.</p>
			<form aria-label="Child-authored export choices" @submit=\${submit}>
				<en-select id="authored-format" name="exportFormat" label="Authored export format" value="png" required>
					<en-select-option value="png">PNG · Raster image</en-select-option>
					<en-select-option id="authored-svg-option" value="svg">SVG · Vector image</en-select-option>
				</en-select>
				<en-segmented-control id="authored-layout" name="canvasLayout" label="Authored canvas layout" value="portrait" required>
					<en-segmented-item value="portrait"><strong>Portrait</strong><span class="child-choice-caption"> · Tall canvas</span></en-segmented-item>
					<en-segmented-item id="authored-landscape-item" value="landscape"><strong>Landscape</strong><span class="child-choice-caption"> · Wide canvas</span></en-segmented-item>
				</en-segmented-control>
				<en-button @click=\${requestSubmit}>Use these choices</en-button>
				<p data-choice-receipt role="status" aria-atomic="true">No choices submitted yet.</p>
			</form>
			<div class="child-choice-editors" role="group" aria-label="Edit authored choices">
				<div class="specimen-row">
					<en-button variant="secondary" @click=\${(event: Event) => setUnavailable(true, event)}>Disable SVG and Landscape</en-button>
					<en-button variant="secondary" @click=\${(event: Event) => setUnavailable(false, event)}>Enable SVG and Landscape</en-button>
				</div>
				<div class="specimen-row">
					<en-button variant="secondary" @click=\${(event: Event) => setAddedChoices(true, event)}>Add PDF and Square</en-button>
					<en-button variant="secondary" @click=\${(event: Event) => setAddedChoices(false, event)}>Remove PDF and Square</en-button>
				</div>
				<p data-choice-catalog-status role="status" aria-atomic="true"></p>
				<en-text-field label="SVG option label" value="SVG · Vector image" data-edit-choice="svg-label" @en-change=\${editChildren}
					description="Changes the option’s plain-text label; its value remains svg."></en-text-field>
				<en-text-field label="Landscape item label" value="Landscape" data-edit-choice="landscape-label" @en-change=\${editChildren}
					description="Changes the emphasized text; the supporting label and landscape value remain."></en-text-field>
			</div>
			<p>Use Tab and arrow keys to choose, then try the label and availability controls. A disabled selected choice cannot satisfy the required field. Re-enable it or choose an available alternative before submitting. Add PDF and Square to try new choices, then remove them: existing labels and parent values stay unchanged.</p>
		</div>
	\`;
}`,"focus-motion":`import { html } from 'lit';

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
	return html\`
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
			\${[
				{ id: 'defaults', label: 'Shared defaults', style: '' },
				{ id: 'recipe', label: 'Scoped input focus recipe', style: recipe },
			].map(row => html\`
				<div class="focus-motion-sample" data-focus-sample=\${row.id} role="group" aria-label=\${row.label} style=\${row.style}>
					<p><strong>\${row.label}</strong></p>
					<div class="focus-motion-controls">
						<en-button @click=\${activate}>Preview study</en-button>
						<en-text-field label="Project title" value="Studio studies"></en-text-field>
						<en-select label="Export format" value="png" .items=\${[
							{ value: 'png', label: 'PNG' }, { value: 'svg', label: 'SVG' },
						]}></en-select>
						<en-number-field label="Scale" value="2" min="1" max="10"></en-number-field>
						<en-combobox label="Project" value="north" .items=\${projects}
							description="Type to filter, then choose a project. Escape restores the accepted selection."></en-combobox>
					</div>
					<p data-focus-action-status role="status" aria-atomic="true"></p>
				</div>
			\`)}
			<p>Try pointer interaction too, then repeat with reduced motion enabled in your system or browser. The accent appears immediately with reduced motion. Changing appearance or density should preserve your entry and current focus.</p>
		</div>
	\`;
}`,"popup-motion":`import { html } from 'lit';

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
	return html\`
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
				\${rows.map(row => html\`
					<div class="scope-sample" data-popup-motion=\${row.id} role="group" aria-label=\${row.label} style=\${row.style}>
						<en-stack style="--en-stack-gap:var(--en-space-3)">
							<p><strong>\${row.label}</strong></p>
							<en-select label="Drawer edge" value="right" .items=\${edges} @en-change=\${chooseEdge}></en-select>
							<div class="specimen-row">
								<en-button id=\${\`motion-\${row.id}-dialog\`} variant="secondary">Dialog</en-button>
								<en-button id=\${\`motion-\${row.id}-drawer\`} variant="secondary">Drawer</en-button>
								<en-button id=\${\`motion-\${row.id}-popover\`} variant="secondary">Popover</en-button>
								<en-button id=\${\`motion-\${row.id}-menu\`} variant="secondary">Menu<en-icon slot="suffix" name="chevron-down" size="inherit"></en-icon></en-button>
								<en-button id=\${\`motion-\${row.id}-palette\`} variant="secondary">Command palette</en-button>
								<en-button id=\${\`motion-\${row.id}-tooltip\`} variant="secondary">Tooltip</en-button>
							</div>
							<en-combobox label="Project" value="north" .items=\${projects}></en-combobox>
						</en-stack>
							<en-dialog for=\${\`motion-\${row.id}-dialog\`} label=\${\`\${row.label}: project details\`}>
								<en-text-field label="Project name" value="Studio studies"></en-text-field>
							</en-dialog>
							<en-drawer for=\${\`motion-\${row.id}-drawer\`} label=\${\`\${row.label}: study notes\`} placement="right">
								<en-textarea label="Notes" value="Keep this draft when the drawer closes."></en-textarea>
							</en-drawer>
							<en-tooltip for=\${\`motion-\${row.id}-tooltip\`}>
								<span slot="content">Keep your pointer here to read this supplemental note. Escape dismisses it.</span>
							</en-tooltip>
							<en-popover for=\${\`motion-\${row.id}-popover\`} label=\${\`\${row.label}: view options\`}>
								<en-checkbox checked>Show grid</en-checkbox>
							</en-popover>
							<en-menu for=\${\`motion-\${row.id}-menu\`} label=\${\`\${row.label}: preview menu\`}>
								<en-menu-item action="finish-preview">Finish motion preview</en-menu-item>
							</en-menu>
							<en-command-palette for=\${\`motion-\${row.id}-palette\`} label=\${\`\${row.label}: preview commands\`}
								.commands=\${[{ action: 'finish-preview', label: 'Finish motion preview', keywords: ['done'] }]}></en-command-palette>
					</div>
				\`)}
			</div>
			<p>The recipe uses 180ms entry and 120ms exit. Dialogs and drawers both travel 4px; drawers move from the chosen edge and stay unscaled. Menus add elevation; popovers, tooltips, suggestions and enhanced select pickers fade. Try the Drawer edge select as well as the Project combobox. Hover or keyboard-focus Tooltip, move onto its content, and try Escape. The pointer warm-up is separate from the visual transition. Reduced motion makes both sides immediate. Motion is also immediate when the browser lacks native exit-transition support.</p>
		</en-stack>
	\`;
}`,"content-recipes":`import { contentCollectionTemplate, contentPlaceholderTemplate, emptyStateTemplate, fileCardTemplate, metadataListTemplate } from '@en-reve/primitives/templates/content.js';
import { html, type TemplateResult } from 'lit';

export function contentRecipesExample() {
	const samples = [
		{ id: 'campaign-brief', name: 'Campaign brief', description: 'A short brief for the next studio review.', format: 'Text excerpt' },
		{ id: 'review-checklist', name: 'Review checklist', description: 'Check the title, reading order and recovery actions.', format: 'Text excerpt' },
		{ id: 'usage-notes', name: 'Studio-review-usage-notes-for-collaborators.md', description: 'Guidance for these local examples. No thumbnail is available.', format: 'Markdown', unavailable: true },
	];
	// Retain each authored field in place. Its skeleton shares that field's exact box.
	const loadingRegion = (content: TemplateResult) => html\`
		<div class="en-content-loading" data-content-loading-region aria-busy="false">
			<div data-content-ready>\${content}</div>
		</div>
	\`;
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
		if (summary) summary.textContent = sample ? \`Selected sample: \${sample.name} (\${sample.id})\` : 'No sample selected.';
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
	return html\`
		<style>@layer en.docs { .specimen-row { display:flex;align-items:center;gap:var(--en-space-actions, var(--en-space-1-5));flex-wrap:wrap; } }</style>
		<link rel="stylesheet" href="/styles/content.css">
		<link rel="stylesheet" href="/styles/radio.css">
		<en-stack class="content-recipes-example" gap="medium">
			<p>Native lists, file cards and metadata share the same recipes in either layout. The form owns this sample selection.</p>
			<div class="specimen-row" data-content-controls style="align-items:flex-end">
				<en-select label="Sample layout" value="grid"
					.items=\${[{ value: 'grid', label: 'Grid' }, { value: 'list', label: 'List' }]}
					@en-change=\${layoutChanged}></en-select>
				<en-button variant="secondary" @click=\${(event: Event) => showEmpty(event, true)}>Show empty state</en-button>
				<en-button variant="secondary" @click=\${(event: Event) => showEmpty(event, false)}>Show samples</en-button>
			</div>
			<en-checkbox @en-change=\${loadingChanged}>Preview loading placeholders</en-checkbox>
			<p role="status" data-content-loading-status>Loading preview is off. Placeholders follow each field in the current content, including wrapped text.</p>
			<form style="display:grid;gap:var(--en-space-3)" @change=\${selected} @submit=\${(event: Event) => event.preventDefault()}>
				<fieldset style="border:0;padding:0;min-inline-size:0">
					<legend>Choose one sample</legend>
					<div data-content-list>
						\${loadingRegion(contentCollectionTemplate({ label: 'Content samples', layout: 'grid', items: samples, key: sample => sample.id,
							renderItem: sample => fileCardTemplate({ placeholders: true,
								name: html\`<label><input class="en-radio" type="radio" name="sample" value=\${sample.id}> \${sample.name}</label>\`,
								mediaFallback: html\`<span aria-hidden="true">Aa</span>\`,
								availability: sample.unavailable ? 'Thumbnail unavailable; text content remains readable.' : 'Ready for review',
								description: sample.description,
								metadata: metadataListTemplate({ placeholders: true, items: [{ label: 'Format', value: sample.format }, { label: 'ID', value: sample.id }] }),
							}),
						}))}
					</div>
					<div data-content-empty hidden>
						\${loadingRegion(emptyStateTemplate({ placeholders: true, kind: 'no-results', title: 'No matching samples', description: 'Your selection stays named below. Restore the sample catalog to continue.',
							actions: html\`<en-button variant="secondary" @click=\${(event: Event) => showEmpty(event, false)}>Restore sample catalog</en-button>\` }))}
					</div>
				</fieldset>
				<p data-content-selection>No sample selected.</p>
			</form>
			<section aria-labelledby="content-handoff-title">
				<h2 class="en-heading-small" id="content-handoff-title">Handoff steps</h2>
				\${loadingRegion(contentCollectionTemplate({ label: 'Ordered handoff steps', type: 'ordered', layout: 'list', start: 2,
					items: [{ id: 'review', text: 'Review the selected sample.' }, { id: 'share', text: 'Share its stable identifier with a collaborator.' }], key: step => step.id,
					renderItem: step => contentPlaceholderTemplate(step.text) }))}
			</section>
			<section aria-labelledby="content-recovery-title" style="display:grid;gap:var(--en-space-4)">
				<h2 class="en-heading-small" id="content-recovery-title">Empty and unavailable content</h2>
				<p>Try creating a collection or retrying an unavailable preview. Reset each example to repeat the recovery.</p>
				\${loadingRegion(emptyStateTemplate({ placeholders: true, kind: 'empty', title: 'Start a review collection', description: 'There are no saved samples in this separate local collection.',
					actions: html\`<en-button variant="secondary" @click=\${(event: Event) => recover(event, 'collection')}>Create local collection</en-button>\` }))}
				\${loadingRegion(emptyStateTemplate({ placeholders: true, kind: 'unavailable', title: 'Preview could not load', description: 'This fixture starts with a failed preview. Retry restores its local content.',
					actions: html\`<en-button variant="secondary" @click=\${(event: Event) => recover(event, 'preview')}>Retry local preview</en-button>\` }))}
				<p role="status" data-content-recovery-status></p>
			</section>
		</en-stack>
	\`;
}`,"virtual-collection":`import { LitElement, css, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { TableModel } from '@en-reve/primitives/state/table.js';
import { TableController } from '@en-reve/primitives/interactions/table.js';
import { tableColgroup, tableHeader, tableRows, type TableColumn } from '@en-reve/primitives/templates/table.js';
import { virtualListRows } from '@en-reve/primitives/templates/virtual-collection.js';
import { tableStyles } from '@en-reve/styles/table.js';
import { typographyStyles } from '@en-reve/styles/typography.js';
import { createSelectionModel } from '@en-reve/primitives/state/selection.js';

type TableSurface = HTMLElement & { scrollElement: HTMLElement | null; scrollInsets: Readonly<{ blockStart: number; blockEnd: number }>; updateComplete: Promise<boolean> };

type Asset = { key: string; number: number; name: string; description: string; type: string };
const makeAsset = (number: number): Asset => ({
	key: \`asset-\${String(number).padStart(5, '0')}\`, number, name: \`Asset \${String(number).padStart(5, '0')}\`,
	description: number % 4 === 0 ? 'A collaborative study with longer notes that wrap as the available width, theme, or text size changes. Keep the same place while reviewing these details.' : 'A study ready for collaborative review.',
	type: number % 3 === 0 ? 'Document' : 'Image',
});

/** Documentation-owned integration lab; this is not a public library component. */
export class VirtualCollectionDemo extends LitElement {
	static styles = [tableStyles, typographyStyles, css\`
		:host { display:block; min-inline-size:0; color:var(--en-color-text); font-family:var(--en-font-ui-family); }
		* { box-sizing:border-box; }
		.controls { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,12rem),1fr)); gap:var(--en-space-4); align-items:end; }
		.scroll-demo summary { cursor:pointer; }
		.scroll-demo { margin-block:var(--en-space-4); padding:var(--en-space-4); border:var(--en-border-width) solid var(--en-color-line); border-radius:var(--en-radius-container); }
		.reveal-controls { grid-template-columns:minmax(0,1fr) auto; margin-block:var(--en-space-4); }
		.scroll-call { margin-block:var(--en-space-4) 0; white-space:pre-wrap; overflow-wrap:anywhere; tab-size:2; font-family:var(--en-font-code-family); font-size:var(--en-font-metadata-size); line-height:var(--en-font-body-line-height); }
		@media (max-width:28rem) { .reveal-controls { grid-template-columns:minmax(0,1fr); } .reveal-controls en-button { justify-self:start; } }
		.table-options { display:flex; flex-wrap:wrap; align-items:center; gap:var(--en-space-4); margin-block:var(--en-space-4); }
		.table-options en-select { min-inline-size:min(100%,12rem); }
		.actions { display:flex; flex-wrap:wrap; align-items:center; gap:var(--en-space-actions,var(--en-space-2)); margin-block:var(--en-space-4); }
		p { margin-block:var(--en-space-3); line-height:1.5; }
		en-table::part(viewport), .list-viewport { block-size:24rem; max-block-size:65dvh; overflow:auto; overflow-anchor:none; }
		en-table table { table-layout:fixed; }
		.list-viewport { border:var(--en-border-width) solid var(--en-color-line); border-radius:var(--en-radius-container); padding-inline:var(--en-space-3); }
		ul { list-style:none; padding:0; margin:0; }
		li[data-en-virtual-key], li[data-record] { padding-block:var(--en-space-3); border-block-end:var(--en-border-width) solid var(--en-color-line); }
		.list-row { display:grid; grid-template-columns:auto minmax(0,1fr); gap:var(--en-space-3); align-items:start; }
		.description { color:var(--en-color-text-muted); font-weight:normal; overflow-wrap:anywhere; }
		.asset-selection { position:relative; }
		.asset-selection::part(label-text) { display:none; }
		th, td { overflow-wrap:anywhere; }
		.selection-column { inline-size:4.5rem; } .type-column { inline-size:20%; }
		@media print { en-table::part(viewport), .list-viewport { block-size:auto; max-block-size:none; overflow:visible; } .controls, .scroll-demo, .table-options, .actions, .paging { display:none; } }
		@media (prefers-reduced-motion:reduce) { * { scroll-behavior:auto; } }
	\`];
	private records = Array.from({ length: 10_000 }, (_, index) => makeAsset(index + 1));
	private selected = createSelectionModel<string>([], { multiple: true });
	private presentation = 'table';
	private delivery = 'windowed';
	private sticky = 'header';
	private stickyCaption = false;
	private showSummary = false;
	private revealKey = 'asset-09000';
	private scrollResult = '';
	private scrollBehavior: ScrollBehavior = 'auto';
	private scrollBlock: ScrollLogicalPosition = 'start';
	private scrollInline: ScrollLogicalPosition = 'nearest';
	private scrollContainer: 'all' | 'nearest' = 'all';
	private descending = false;
	private page = 0;
	private readonly pageSize = 20;
	private prepended = 0;
	private message = '';
	private columns: readonly TableColumn<Asset>[] = [
		{ key: 'selection', label: 'Select', width: '4.5rem', renderCell: item => this.selection(item) },
		{ key: 'name', label: 'Name', rowHeader: true, compare: (a, b) => a.number - b.number,
			renderCell: item => html\`\${item.name}<p class="description">\${item.description}</p>\` },
		{ key: 'type', label: 'Type', width: '20%', renderCell: item => item.type },
	];
	private tableModel = new TableModel<Asset>({ items: this.records, columns: this.columns, key: item => item.key, estimateSize: 72, overscan: 3, initialCount: 20, pageSize: this.pageSize, sort: { column: 'name', direction: 'ascending' } });
	private get model() { return this.tableModel.collection; }
	private controller = new TableController(this, this.tableModel, {
		table: () => this.table,
		viewport: () => this.viewport,
		content: () => this.renderRoot.querySelector(this.presentation === 'table' ? 'tbody' : 'ul'),
		onFocusedItemRemoved: (key, viewport) => {
			viewport.focus({ preventScroll: true });
			this.message = \`\${key} was removed. Focus returned to the collection.\`;
			this.requestUpdate();
		},
	});
	private get table(): TableSurface | null { return this.renderRoot.querySelector<TableSurface>('en-table'); }
	private get viewport(): HTMLElement | null {
		return this.presentation === 'table'
			? this.table?.scrollElement ?? null
			: this.renderRoot.querySelector<HTMLElement>('.list-viewport');
	}
	private change(event: Event, apply: (value: string) => void) {
		const field = event.currentTarget as HTMLElement & { value: string };
		if (event.composedPath()[0] !== field || !event.cancelable || event.defaultPrevented) return;
		const proposed = (event as CustomEvent<{ proposed: string }>).detail.proposed;
		queueMicrotask(() => { if (!event.defaultPrevented && field.isConnected && field.value === proposed) apply(proposed); });
	}
	private toggle(event: Event, apply: (checked: boolean) => void) {
		const field = event.currentTarget as HTMLElement & { checked: boolean };
		if (event.composedPath()[0] !== field || !event.cancelable || event.defaultPrevented) return;
		const proposed = (event as CustomEvent<{ proposed: boolean }>).detail.proposed;
		queueMicrotask(() => { if (!event.defaultPrevented && field.isConnected && field.checked === proposed) apply(proposed); });
	}
	private async refreshTable() {
		this.requestUpdate(); await this.updateComplete; await this.table?.updateComplete;
		this.controller.refresh();
	}
	private async setSticky(value: string) {
		if (!['header', 'footer', 'both', 'none'].includes(value)) return;
		this.sticky = value; await this.refreshTable();
	}
	private async setPresentation(value: string) {
		if (value !== 'table' && value !== 'list') return;
		this.presentation = value; this.requestUpdate(); await this.updateComplete;
		this.controller.invalidateMeasurements(); this.controller.refresh();
	}
	private async setDelivery(value: string) {
		if (value !== 'windowed' && value !== 'paginated') return;
		this.delivery = value; this.tableModel.setMode(value); this.page = 0; this.requestUpdate(); await this.updateComplete;
		if (this.viewport) this.viewport.scrollTop = 0;
		this.controller.refresh();
	}
	private select(item: Asset, event: Event) {
		this.toggle(event, checked => {
			if (checked !== this.selected.has(item.key)) this.selected.toggle(item.key);
			this.requestUpdate();
		});
	}
	private async reveal() {
		if (this.delivery === 'paginated') {
			const index = this.records.findIndex(item => item.key === this.revealKey);
			if (index < 0) { this.scrollResult = 'That asset is not in this collection.'; this.requestUpdate(); return; }
			this.page = Math.floor(index / this.pageSize); this.tableModel.setPage(this.page); this.requestUpdate(); await this.updateComplete;
			if (this.viewport) this.viewport.scrollTop = 0;
			this.scrollResult = \`Opened page \${this.page + 1} for \${this.revealKey}.\`;
		} else {
			const found = this.controller.scrollToKey(this.revealKey, this.revealOptions);
			this.scrollResult = found ? 'Returned true. Reveal requested; focus and selection are unchanged.' : 'Returned false. That key is not in this collection; the scroll position is unchanged.';
		}
		this.requestUpdate();
	}
	private get revealOptions() {
		return { behavior: this.scrollBehavior, block: this.scrollBlock, inline: this.scrollInline, container: this.scrollContainer };
	}
	private get revealCall() {
		return \`controller.scrollToKey(\${JSON.stringify(this.revealKey)}, {\\n\${Object.entries(this.revealOptions).map(([name, value]) => \`\\t\${name}: \${JSON.stringify(value)},\`).join('\\n')}\\n});\`;
	}
	private async sort(direction?: 'ascending' | 'descending') {
		this.descending = direction ? direction === 'descending' : !this.descending;
		this.tableModel.setSort({ column: 'name', direction: this.descending ? 'descending' : 'ascending' });
		this.records = [...this.tableModel.items]; this.page = 0; this.message = \`Sorted by name \${this.descending ? 'descending' : 'ascending'}.\`;
		this.requestUpdate(); await this.updateComplete; this.controller.refresh();
	}
	private async prependAsset() {
		const item = makeAsset(--this.prepended);
		this.records = [item, ...this.records]; this.tableModel.setItems(this.records); this.records = [...this.tableModel.items];
		this.message = \`\${item.name} prepended; selection is preserved.\`;
		this.requestUpdate(); await this.updateComplete; this.controller.refresh();
	}
	private async removeSelected() {
		const count = this.selected.selected.get().length;
		this.records = this.records.filter(item => !this.selected.has(item.key)); this.selected.clear();
		this.tableModel.setItems(this.records); this.records = [...this.tableModel.items]; this.page = this.tableModel.page;
		this.message = \`\${count} selected \${count === 1 ? 'asset' : 'assets'} removed.\`;
		this.requestUpdate(); await this.updateComplete; this.controller.refresh();
	}
	private pageChanged(event: Event) {
		const pager = event.currentTarget as HTMLElement & { page: number };
		if (event.composedPath()[0] !== pager || !event.cancelable || event.defaultPrevented) return;
		const proposed = (event as CustomEvent<{ proposed: number }>).detail.proposed;
		queueMicrotask(() => {
			if (!event.defaultPrevented && pager.isConnected && pager.page === proposed) void this.turnPage(proposed - 1);
		});
	}
	private async turnPage(page: number) {
		this.tableModel.setPage(page); this.page = this.tableModel.page;
		this.message = \`Page \${this.page + 1} of \${this.tableModel.pageCount}, assets \${this.records.length ? this.tableModel.firstIndex + 1 : 0}–\${Math.min(this.records.length, this.tableModel.firstIndex + this.pageSize)}.\`;
		this.requestUpdate(); await this.updateComplete; if (this.viewport) this.viewport.scrollTop = 0;
	}
	private selection(item: Asset) {
		return html\`<en-checkbox class="asset-selection" label=\${\`Select \${item.name}\`} .checked=\${this.selected.has(item.key)} @en-change=\${(event: Event) => this.select(item, event)}></en-checkbox>\`;
	}
	private listItem = (item: Asset) => html\`
		<div class="list-row">\${this.selection(item)}<div><strong>\${item.name}</strong><p class="description">\${item.description}</p><span>\${item.type}</span></div></div>
	\`;
	protected render() {
		const paginated = this.delivery === 'paginated';
		const pageItems = this.tableModel.pageItems;
		return html\`
			<div class="controls">
				<en-select label="Presentation" .value=\${this.presentation} .items=\${[{value:'table',label:'Table'},{value:'list',label:'List'}]} @en-change=\${(event: Event) => this.change(event, value => { void this.setPresentation(value); })}></en-select>
				<en-select label="Delivery" .value=\${this.delivery} .items=\${[{value:'windowed',label:'Windowed'},{value:'paginated',label:'Paginated'}]} @en-change=\${(event: Event) => this.change(event, value => { void this.setDelivery(value); })}></en-select>
			</div>

			\${this.presentation === 'table' ? html\`<div class="table-options">
				<en-select label="Sticky table sections" .value=\${this.sticky} .items=\${[{value:'header',label:'Header'}, {value:'footer',label:'Footer'}, {value:'both',label:'Header and footer'}, {value:'none',label:'None'}]} @en-change=\${(event: Event) => this.change(event, value => { void this.setSticky(value); })}></en-select>
				<en-checkbox .checked=\${this.stickyCaption} @en-change=\${(event: Event) => this.toggle(event, checked => { this.stickyCaption = checked; void this.refreshTable(); })}>Keep caption visible</en-checkbox>
				<en-checkbox .checked=\${this.showSummary} @en-change=\${(event: Event) => this.toggle(event, checked => { this.showSummary = checked; void this.refreshTable(); })}>Show table summary</en-checkbox>
			</div>\` : nothing}
			<p>10,000 stable-keyed records with variable-height descriptions. Windowed delivery mounts nearby rows and retains focused rows. Choose Paginated for sequential reading, browser Find and printing of the current page.</p>
			<div class="actions">
				<en-button variant="secondary" @click=\${() => this.sort()}>Sort name \${this.descending ? 'ascending' : 'descending'}</en-button>
				<en-button variant="secondary" @click=\${() => this.prependAsset()}>Prepend asset</en-button>
				<en-button variant="secondary" ?disabled=\${!this.selected.selected.get().length} @click=\${() => this.removeSelected()}>Remove selected</en-button>
				<span data-selection-status>\${this.selected.selected.get().length} selected · \${this.records.length.toLocaleString('en-US')} records</span>
			</div>
			<p role="status" aria-atomic="true">\${this.message}</p>
			\${this.presentation === 'table' ? html\`
				<en-table label="Large asset table" sticky=\${this.sticky} ?sticky-caption=\${this.stickyCaption}>
					<table aria-rowcount=\${paginated ? nothing : this.tableModel.rowCount({ footerRows: this.showSummary ? 1 : 0 })}>
						<caption>\${paginated ? \`Assets, page \${this.page + 1}\` : 'Windowed assets'}</caption>
						\${tableColgroup(this.columns)}
						<thead>\${tableHeader(this.columns, { sort: this.tableModel.sort, onSort: sort => { void this.sort(sort.direction); } })}</thead>
						<tbody>\${tableRows(this.tableModel, this.columns)}</tbody>
						\${this.showSummary ? html\`<tfoot><tr aria-rowindex=\${paginated ? nothing : this.records.length + 2}><td colspan="3">\${this.selected.selected.get().length} selected across \${this.records.length.toLocaleString('en-US')} assets\${paginated ? \` · \${pageItems.length} on this page\` : nothing}</td></tr></tfoot>\` : nothing}
					</table>
				</en-table>
			\` : html\`
				<div class="list-viewport" data-virtual-viewport tabindex="0" role="region" aria-label="Large asset list">
					<ul role="list">\${paginated
						? repeat(pageItems, item => item.key, item => html\`<li data-record=\${item.key}>\${this.listItem(item)}</li>\`)
						: virtualListRows(this.model, { renderItem: this.listItem })}</ul>
				</div>
			\`}
			\${paginated ? html\`<en-pagination class="paging" label="Asset pages" .page=\${this.page + 1}
				.pageCount=\${this.tableModel.pageCount} @en-change=\${this.pageChanged}></en-pagination>\` : nothing}
			<details class="scroll-demo">
				<summary id="scroll-demo-heading" class="en-heading-small">\${paginated ? 'Find an asset' : 'scrollToKey()'}</summary>
				<div role="region" aria-labelledby="scroll-demo-heading">
					<p>\${paginated ? 'Open the page containing a stable asset key.' : 'Reveal a stable asset key without selecting it or moving focus. Try asset-09000 or asset-00001.'}</p>
					<div class="controls reveal-controls">
						<en-text-field label="Asset key" .value=\${this.revealKey} @en-change=\${(event: Event) => this.change(event, value => { this.revealKey = value; this.scrollResult = ''; this.requestUpdate(); })}></en-text-field>
						<en-button variant="secondary" @click=\${() => this.reveal()}>Show asset</en-button>
					</div>
					\${!paginated ? html\`
					<div class="controls">
						<en-select label="Scroll behavior" .value=\${this.scrollBehavior} .items=\${['auto','instant','smooth'].map(value => ({ value, label:value }))} @en-change=\${(event: Event) => this.change(event, value => { this.scrollBehavior = value as ScrollBehavior; this.requestUpdate(); })}></en-select>
						<en-select label="Block alignment" .value=\${this.scrollBlock} .items=\${['start','center','end','nearest'].map(value => ({ value, label:value }))} @en-change=\${(event: Event) => this.change(event, value => { this.scrollBlock = value as ScrollLogicalPosition; this.requestUpdate(); })}></en-select>
						<en-select label="Inline alignment" .value=\${this.scrollInline} .items=\${['start','center','end','nearest'].map(value => ({ value, label:value }))} @en-change=\${(event: Event) => this.change(event, value => { this.scrollInline = value as ScrollLogicalPosition; this.requestUpdate(); })}></en-select>
						<en-select label="Scroll containers" .value=\${this.scrollContainer} .items=\${[{value:'all',label:'All ancestors'},{value:'nearest',label:'Nearest scroll container'}]} @en-change=\${(event: Event) => this.change(event, value => { this.scrollContainer = value as 'all' | 'nearest'; this.requestUpdate(); })}></en-select>
					</div>
					<pre class="scroll-call" dir="ltr" aria-label="Current scrollToKey call"><code>\${this.revealCall}</code></pre>\` : nothing}
					<p role="status" aria-label="Scroll result" aria-atomic="true">\${this.scrollResult}</p>
				</div>
			</details>
		\`;
	}
}

if (!customElements.get('en-virtual-collection-demo')) customElements.define('en-virtual-collection-demo', VirtualCollectionDemo);

// Documentation-owned review application; the controller, state and templates above are public library primitives.
export function virtualCollectionExample() {
	return html\`<en-virtual-collection-demo></en-virtual-collection-demo>\`;
}`,"authored-table":`import { html, nothing } from 'lit';
import { AsyncDirective, directive } from 'lit/async-directive.js';
import { repeat } from 'lit/directives/repeat.js';

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
			this.status = \`Sorted by \${key === 'name' ? 'name' : 'updated date'}, \${this.direction}.\`;
			this.setValue(this.render());
		});
	}

	private select(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const row = this.rows.find(row => row.id === input.value);
		if (!input.checked || !row) return;
		this.selectedId = row.id;
		this.status = \`Selected \${row.name}. Sorting retains this selection.\`;
		this.setValue(this.render());
	}

	render() {
		return html\`
			<style>@layer en.docs { .authored-table-example .visually-hidden { position:absolute;inline-size:1px;block-size:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0; } }</style>
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
								<th scope="col" aria-sort=\${this.sortKey === 'name' ? this.direction : nothing}><en-button variant="ghost" size="small" @click=\${(event: Event) => this.sort(event, 'name')}>
									Sort Name<span class="visually-hidden"> \${this.sortKey === 'name' && this.direction === 'ascending' ? 'descending' : 'ascending'}</span>
									\${this.sortKey === 'name' ? html\`<en-icon slot="suffix" name="arrow-right" style=\${\`rotate:\${this.direction === 'descending' ? '90deg' : '-90deg'}\`}></en-icon>\` : nothing}
								</en-button></th>
								<th scope="col">Type</th>
								<th scope="col" aria-sort=\${this.sortKey === 'updated' ? this.direction : nothing}><en-button variant="ghost" size="small" @click=\${(event: Event) => this.sort(event, 'updated')}>
									Sort Updated<span class="visually-hidden"> \${this.sortKey === 'updated' && this.direction === 'ascending' ? 'descending' : 'ascending'}</span>
									\${this.sortKey === 'updated' ? html\`<en-icon slot="suffix" name="arrow-right" style=\${\`rotate:\${this.direction === 'descending' ? '90deg' : '-90deg'}\`}></en-icon>\` : nothing}
								</en-button></th>
							</tr>
						</thead>
						<tbody>
							\${repeat(this.rows, row => row.id, row => html\`
								<tr data-asset=\${row.id}>
									<td><input class="en-radio" type="radio" name="table-asset" value=\${row.id} aria-label=\${\`Choose \${row.name}\`} ?checked=\${this.selectedId === row.id} @change=\${(event: Event) => this.select(event)}></td>
									<th scope="row">\${row.name}</th>
									<td>\${row.kind}</td>
									<td><time datetime=\${row.updated}>\${row.updated}</time></td>
								</tr>
							\`)}
						</tbody>
					</table>
				</en-table>
				<output aria-live="polite">\${this.status}</output>
			</div>
		\`;
	}
}
const assetTableDemo = directive(AssetTableDemo);
export function authoredTableExample() {
	return html\`\${assetTableDemo()}\`;
}`}})))()}function o(e){let t=i[e];if(t===void 0)throw Error(`Missing authored source for ${e}.`);return t}function s(n){let r=c.get(n);if(r)return r;let i=o(n).replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`),a=e`<code class="language-lit-typescript">${t(i)}</code>`;return c.set(n,a),a}var c;function l(){return(l=r((()=>{n(),a(),c=new Map})))()}export{i,s as n,a as r,l as t};
//# sourceMappingURL=specimen-source-DrEKLHmh.js.map