import { acceptValueChange } from './change-consumption.js';
import { skipLinkTemplate } from '@en-reve/primitives/templates/navigation.js';
import { attachAnchorNavigation, type AnchorNavigation } from '@en-reve/primitives/interactions/anchor-navigation.js';
import { LitElement, html, nothing } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import { styleMap } from 'lit/directives/style-map.js';
import { hydrate } from '@lit-labs/ssr-client';
import { Signal } from 'signal-polyfill';
import { SignalController } from '@en-reve/primitives/interactions/signal-controller.js';
import { definitions } from '@en-reve/elements/catalog.js';
import { appearanceItems, effectiveAppearance, isAppearance, observeSystemAppearance } from './appearance.js';
import type { Appearance } from './appearance.js';
import { previewPairCSS, resolvePreviewPair } from './preview-theme.js';
import type { ThemeMode, ThemeDensity, ResolvedTheme } from '@en-reve/tokens';
import { registerPreviewTools, type PreviewSettings } from './preview-tools.js';
import { specimens, tokenSample } from './examples.js';
import { sourceCode } from './specimen-source.js';
import { attachThemePreview, disconnectThemePreview, isThemePreviewFrame, refreshThemePreview } from './theme-review/preview.js';

type Settings = PreviewSettings;
export const initialSettings: Readonly<Settings> = Object.freeze({ mode: 'auto', density: 'comfortable', accent: '', rhythm: .25, direction: 'ltr' });
const sections = [
  ['foundations', 'Foundations'], ['actions', 'Actions'], ['fields', 'Fields'],
  ['colors', 'Color'], ['choices', 'Selection'], ['navigation', 'Navigation'], ['surfaces', 'Surfaces'],
  ['feedback', 'Feedback'], ['overlays', 'Overlays'], ['scopes', 'Theme scopes'],
  ['review-notes', 'Review notes'],
];
const paletteRoles = ['canvas','surface','surface-subtle','text','text-muted','brand','on-brand','action','action-hover','accent-subtle','boundary','danger-text','warning-text','success-text'];
const densityItems = [{ value: 'compact', label: 'Compact' }, { value: 'comfortable', label: 'Comfortable' }, { value: 'spacious', label: 'Spacious' }];
const rhythmItems = [.125, .1875, .25, .3125, .375, .5].map(value => ({ value: String(value), label: `${value} rem` }));
const directionItems = [{ value: 'ltr', label: 'Left to right' }, { value: 'rtl', label: 'Right to left' }];

/** The app's initial render is pure and each server request gets fresh state. */
export class StickerApp extends LitElement {
  static properties = { progressReportEnabled: { state: true } };
  declare progressReportEnabled: boolean;
  private state = new Signal.State<Settings>({ ...initialSettings });
  private observer = new SignalController(this, () => this.state.get());
  private systemMode: ThemeMode = 'light';
  private presentation = this.resolvePreviewThemes();
  private theme: ResolvedTheme = this.presentation.light;
  private themeCSS = previewPairCSS(this.presentation);
  private themeStyle?: HTMLStyleElement;
  private toolsLifecycle?: AbortController;
  private navigation?: AnchorNavigation;
  private sessions = new Map<string, { revision: number }>();

  constructor() {
    super();
    this.progressReportEnabled = false;
  }

  protected createRenderRoot() {
    if (this.hasAttribute('data-ssr')) {
      hydrate(this.render(), this, { host: this });
      this.removeAttribute('data-ssr');
    }
    return this;
  }

  readPreview(): Settings { return { ...this.state.get() }; }

  async configurePreview(patch: Partial<Settings>) {
    this.change(patch);
    await this.updateComplete;
    return { settings: this.readPreview(), tokenCount: Object.keys(this.theme.tokens).length };
  }

  get previewCSS(): string { return this.themeCSS; }

  protected firstUpdated() {
    this.connectBrowserTools();
    this.connectNavigation();
  }

  connectedCallback() {
    super.connectedCallback();
    if (this.hasUpdated) {
      this.connectBrowserTools();
      this.connectNavigation();
      attachThemePreview(this);
    }
  }

  disconnectedCallback() {
    disconnectThemePreview(this);
    this.toolsLifecycle?.abort();
    this.navigation?.disconnect();
    this.navigation = undefined;
    super.disconnectedCallback();
  }

  protected updated() {
    const s = this.state.get();
    const doc = this.ownerDocument;
    this.themeStyle = doc.querySelector<HTMLStyleElement>('#en-preview-theme') ?? doc.createElement('style');
    this.themeStyle.id = 'en-preview-theme';
    if (!this.themeStyle.isConnected) doc.head.append(this.themeStyle);
    if (this.themeStyle.textContent !== this.previewCSS) this.themeStyle.textContent = this.previewCSS;
    if (!refreshThemePreview(this)) {
      doc.documentElement.style.colorScheme = s.mode === 'auto' ? 'light dark' : s.mode;
      doc.documentElement.setAttribute('data-en-appearance', s.mode);
      doc.documentElement.dir = s.direction;
      this.dataset.syntaxTheme = this.theme.mode === 'light' ? 'github' : 'night-owl';
    }
    this.navigation?.refresh();
  }

  private connectBrowserTools() {
    this.toolsLifecycle?.abort();
    if (isThemePreviewFrame(this)) return;
    this.toolsLifecycle = new AbortController();
    observeSystemAppearance(this.ownerDocument.defaultView!, mode => {
      this.systemMode = mode;
      if (this.state.get().mode !== 'auto' || this.theme.mode === mode) return;
      this.theme = this.presentation[mode];
      this.requestUpdate();
    }, this.toolsLifecycle.signal);
    registerPreviewTools(() => this.readPreview(), patch => this.configurePreview(patch), this.toolsLifecycle.signal);
  }

  /** Native links own URL, history and focus; this adapter only keeps targets clear. */
  followInitialAnchor() { this.navigation?.followInitialAnchor(); }

  private connectNavigation() {
    this.navigation?.disconnect();
    const navigation = this.querySelector<HTMLElement>('en-navigation.section-nav');
    if (navigation) this.navigation = attachAnchorNavigation({ root: this, navigation });
  }

  private change(patch: Partial<Settings>) {
    const current = this.state.get();
    const next = { ...current, ...patch };
    if (!isAppearance(next.mode)) throw new Error('Choose Auto, Light or Dark.');
    const inputsChanged = next.density !== current.density || next.accent !== current.accent || next.rhythm !== current.rhythm;
    // Resolve before publishing settings so an invalid shared input changes neither branch.
    const presentation = inputsChanged ? this.resolvePreviewThemes(next) : this.presentation;
    const css = inputsChanged ? previewPairCSS(presentation) : this.themeCSS;
    this.presentation = presentation; this.themeCSS = css;
    this.theme = presentation[effectiveAppearance(next.mode, this.systemMode)];
    this.state.set(next);
  }

  private resolvePreviewThemes(settings = this.state.get()) {
    return resolvePreviewPair({name:'review',density:settings.density,accent:settings.accent,rhythm:settings.rhythm});
  }

  private resetSpecimen(id: string) {
    const previous = this.sessions.get(id);
    this.sessions.set(id, { revision: (previous?.revision ?? 0) + 1 });
    this.requestUpdate();
  }

  private async highlightCode(event: Event) {
    const disclosure = event.currentTarget as HTMLDetailsElement;
    if (!disclosure.open || !('CSS' in globalThis) || !('highlights' in CSS)) return;
    const { highlightAll } = await import('microlighter');
    if (!disclosure.open) return;
    await highlightAll({ root: this, selector: '.code-disclosure[open] pre > code', languageAliases: { 'lit-typescript': 'typescript' } });
    disclosure.dataset.highlighted = 'true';
  }

  private specimen(id: string) {
    const specimen = specimens.find(item => item.id === id);
    if (!specimen) throw new Error(`Unknown specimen: ${id}`);
    if (!this.sessions.has(id)) this.sessions.set(id, { revision: 0 });
    const session = this.sessions.get(id)!;
    return html`<article class="specimen ${specimen.wide ? 'wide' : ''}" data-specimen=${id} aria-labelledby=${`specimen-${id}`}>
      <div class="specimen-heading"><h3 id=${`specimen-${id}`}>${specimen.title}</h3><code>${specimen.tags}</code></div>
${['carousel', 'menu-choices', 'focus-motion', 'child-authored-choices', 'content-recipes', 'authored-table', 'virtual-collection', 'pagination', 'popup-motion'].includes(id) ? html`
  <p class="specimen-review-link"><a href=${`/api-examples/${id}.html${this.progressReportEnabled ? '?progress-report' : ''}`}>Open ${specimen.title} review</a></p>
` : nothing}
      ${['content-recipes', 'authored-table'].includes(id) ? html`<p><a href=${`/workflows/assets${this.progressReportEnabled ? '?progress-report' : ''}`}>Review the asset-browser workflow</a></p>` : nothing}

      <div class="specimen-content">${keyed(session.revision, specimen.render({ density: this.state.get().density }))}</div>
      <div class="specimen-tools">
        ${specimen.interactive ? html`<en-button variant="ghost" size="small" @click=${() => this.resetSpecimen(id)}>Reset <span class="visually-hidden">${specimen.title}</span></en-button>` : nothing}
        <details class="code-disclosure" @toggle=${this.highlightCode}>
          <summary>View code<span class="visually-hidden"> for ${specimen.title}</span></summary>
          <p class="code-note">This function renders the live example${['tree-view','mixed-toolbar','opacity','dialog-drawer','color-field','swatches','combobox','menu-choices','command-surfaces','child-authored-choices','focus-motion','content-recipes','authored-table','pagination','popup-motion'].includes(id) ? ', including its event handlers' : ''}. Use the Lit imports shown below; the sheet’s layout classes style the surrounding example.</p>
          ${['typography','card','content-recipes','authored-table'].includes(id) ? html`<p class="code-note">Serve the matching CSS file from <code>@en-reve/styles</code> at the stylesheet URL shown. JavaScript import maps do not resolve stylesheet links. A shared document can load this link once in its head.</p>` : nothing}
          <pre tabindex="0" aria-label=${`${specimen.title} source`}>${sourceCode(id)}</pre>
        </details>
      </div>
    </article>`;
  }
  render() {
    const s = this.state.get();
    return html`
      ${skipLinkTemplate({ href: '#sheet', label: 'Skip to components' })}
      <header class="site-header">
        <a class="wordmark" href="#sheet" aria-label="en-reve sticker sheet"><span class="mark" aria-hidden="true">en</span><span>en-reve</span></a>
        <div class="header-context"><span>Design system</span><en-badge class="version">0.1.0 · design review</en-badge></div>
        <nav class="header-context" aria-label="Documentation pages">
          <a href=${this.progressReportEnabled ? '/?progress-report' : '/'} aria-current="page">Sticker sheet</a>
          <a href=${this.progressReportEnabled ? '/showcase?progress-report' : '/showcase'}>Showcase</a>
          <a href=${this.progressReportEnabled ? '/workflows?progress-report' : '/workflows'}>Workflows</a>
          <a href=${this.progressReportEnabled ? '/theme-review?progress-report' : '/theme-review'}>Theme Review</a>
          <a href=${this.progressReportEnabled ? '/api-reference?progress-report' : '/api-reference'}>API reference</a>
          <a href=${this.progressReportEnabled ? '/api-examples?progress-report' : '/api-examples'}>API examples</a>
          <a href=${this.progressReportEnabled ? '/guides.html?progress-report' : '/guides.html'}>Handbook</a>
        </nav>
      </header>
      <main id="sheet" tabindex="-1" class="en-navigation-target">
        <div class="page-heading">
          <div><h1>Component sticker sheet</h1>
          <p class="lede">Try the controls, compare states, and explore how a few shared values change the whole collection.</p></div>
          <div class="collection-count"><strong>${definitions.length}</strong><span>custom elements<br>in this first sheet</span></div>
        </div>
        <section class="theme-controls" aria-label="Preview settings">
          <en-segmented-control label="Appearance" .value=${s.mode} .items=${appearanceItems} @en-change=${(event: CustomEvent<{ proposed: string }>) => { acceptValueChange<Appearance>(event, mode => { this.change({ mode }); return this.state.get().mode; }); }}></en-segmented-control>
          <en-select label="Density" .value=${s.density} .items=${densityItems} @en-change=${(event: CustomEvent<{ proposed: string }>) => { acceptValueChange<ThemeDensity>(event, density => { this.change({ density }); return this.state.get().density; }); }}></en-select>
          <en-color-field label="Accent seed" .value=${s.accent || (this.theme.mode === 'light' ? '#2457d6' : '#aac1ff')} @en-change=${(event: CustomEvent<{ proposed: string }>) => { acceptValueChange<string>(event, accent => { this.change({ accent }); return this.state.get().accent; }); }}></en-color-field>
          <en-select label="Layout rhythm" .value=${String(s.rhythm)} .items=${rhythmItems} @en-change=${(event: CustomEvent<{ proposed: string }>) => { acceptValueChange<string>(event, rhythm => { this.change({ rhythm: Number(rhythm) }); return String(this.state.get().rhythm); }); }}></en-select>
          <en-select label="Direction" .value=${s.direction} .items=${directionItems} @en-change=${(event: CustomEvent<{ proposed: string }>) => { acceptValueChange<Settings['direction']>(event, direction => { this.change({ direction }); return this.state.get().direction; }); }}></en-select>
          <en-button class="reset-preview" variant="ghost" @click=${() => this.change({ ...initialSettings })}>Reset preview</en-button>
        </section>
        <en-navigation class="section-nav" label="Sticker sheet sections" sticky>
          ${sections.map(([id, label]) => html`<a href=${'#' + id}>${label}</a>`)}
        </en-navigation>

        <section id="foundations" class="sheet-section en-navigation-target" tabindex="-1" aria-labelledby="foundations-title">
          <div class="section-heading"><div><h2 id="foundations-title">A shared visual language</h2></div><p>One accent, related states. One rhythm, consistent spacing.</p></div>
          <div class="palette">${paletteRoles.map(role => {
            const token = this.theme.tokens['color.'+role];
            return tokenSample(token.cssName, role.replaceAll('-',' '));
          })}</div>
          <div class="specimen-grid">
            ${this.specimen("swatches")}
            ${this.specimen("typography")}
            ${this.specimen("rhythm")}
          </div>
        </section>

        <section id="actions" class="sheet-section en-navigation-target" tabindex="-1" aria-labelledby="actions-title">
          <div class="section-heading"><div><h2 id="actions-title">Clear next steps</h2></div><p>Consistent shape and focus treatment across intent and state.</p></div>
          <div class="specimen-grid">
            ${this.specimen("buttons")}
            ${this.specimen("button-scale")}
            ${this.specimen("command-surfaces")}
            ${this.specimen("mixed-toolbar")}
            ${this.specimen("menu-choices")}
          </div>
        </section>

        <section id="fields" class="sheet-section en-navigation-target" tabindex="-1" aria-labelledby="fields-title">
          <div class="section-heading"><div><h2 id="fields-title">Everyday input, useful detail</h2></div><p>Visible labels, descriptions, validation, and native editing.</p></div>
          <div class="specimen-grid fields-grid">
            ${this.specimen("text-fields")}
            ${this.specimen("long-text-search")}
            ${this.specimen("structured-values")}
            ${this.specimen("calendar")}
            ${this.specimen("multi-step")}
            ${this.specimen("combobox")}
            ${this.specimen("precision")}
            ${this.specimen("file-upload")}
            ${this.specimen("color-field")}
          </div>
        </section>

        <section id="colors" class="sheet-section en-navigation-target" tabindex="-1" aria-labelledby="colors-title">
          <div class="section-heading"><div><h2 id="colors-title">Color in context</h2></div><p>Explore complete pickers and independently composed color controls.</p></div>
          <div class="specimen-grid">
            ${this.specimen("color-picker")}
            ${this.specimen("color-plane")}
            ${this.specimen("color-slider")}
            ${this.specimen("color-wheel")}
          </div>
        </section>

        <section id="choices" class="sheet-section en-navigation-target" tabindex="-1" aria-labelledby="choices-title">
          <div class="section-heading"><div><h2 id="choices-title">From a choice to fine control</h2></div><p>Keyboard and pointer interactions share the same values.</p></div>
          <div class="specimen-grid">
            ${this.specimen("child-authored-choices")}
            ${this.specimen("checkboxes-switches")}
            ${this.specimen("radio-group")}
            ${this.specimen("opacity")}
            ${this.specimen("vertical-slider")}
            ${this.specimen("rating")}
          </div>
        </section>

        <section id="navigation" class="sheet-section en-navigation-target" tabindex="-1" aria-labelledby="navigation-title">
          <div class="section-heading"><div><h2 id="navigation-title">Structure without losing your place</h2></div><p>Operate tabs, disclosures, and a resizable workspace.</p></div>
          <div class="specimen-grid">
            ${this.specimen("native-navigation")}
            ${this.specimen("navigation-sidebar")}
            ${this.specimen("breadcrumbs")}
            ${this.specimen("tree-view")}
            ${this.specimen("tree-data")}
            ${this.specimen("pagination")}
            ${this.specimen("tabs")}
            ${this.specimen("accordion")}
            ${this.specimen("split-view")}
            ${this.specimen("split-view-vertical")}
          </div>
        </section>

        <section id="surfaces" class="sheet-section en-navigation-target" tabindex="-1" aria-labelledby="surfaces-title">
          <div class="section-heading"><div><h2 id="surfaces-title">Parts that work together</h2></div><p>Content, identity, and status compose without a new visual language.</p></div>
          <div class="specimen-grid">
            ${this.specimen("carousel")}
            ${this.specimen("rich-text")}
            ${this.specimen("composable-chat")}
            ${this.specimen("chat-patterns")}
            ${this.specimen("card")}
            ${this.specimen("content-recipes")}
            ${this.specimen("authored-table")}
            ${this.specimen("data-table")}
            ${this.specimen("virtual-collection")}
            ${this.specimen("identity")}
            ${this.specimen("presence-activity")}
          </div>
        </section>

        <section id="feedback" class="sheet-section en-navigation-target" tabindex="-1" aria-labelledby="feedback-title">
          <div class="section-heading"><div><h2 id="feedback-title">State you can understand</h2></div><p>Useful progress and messages, with room to recover.</p></div>
          <div class="specimen-grid">
            ${this.specimen("messages")}
            ${this.specimen("toast")}
            ${this.specimen("loading")}
          </div>
        </section>

        <section id="overlays" class="sheet-section en-navigation-target" tabindex="-1" aria-labelledby="overlays-title">
          <div class="section-heading"><div><h2 id="overlays-title">A little more room</h2></div><p>Open each surface to inspect its focus, dismissal, and spacing.</p></div>
          <div class="specimen-grid">
            ${this.specimen("dialog-drawer")}
            ${this.specimen("popover-tooltip")}
            ${this.specimen("tooltip-warmup")}
          </div>
        </section>

        <section id="scopes" class="sheet-section en-navigation-target" tabindex="-1" aria-labelledby="scopes-title">
          <div class="section-heading"><div><h2 id="scopes-title">One page, independent scopes</h2></div><p>A nested theme can rebase its values while individual controls stay customizable.</p></div>
          <div class="specimen-grid">${this.specimen("theme-scopes")}${this.specimen("local-override")}${this.specimen("family-geometry")}${this.specimen("focus-motion")}${this.specimen("popup-motion")}</div>
        </section>

        <section id="review-notes" class="review-notes en-navigation-target" tabindex="-1" aria-labelledby="review-title">
          <h2 id="review-title">What feels right—and what gets in the way?</h2>
          <div class="review-prompts"><p><strong>Readability</strong><br>Are labels and supporting text comfortable at all three densities?</p><p><strong>Relationships</strong><br>Do spacing, borders, and nested corners feel consistent?</p><p><strong>Use</strong><br>Try a keyboard path, resize the page, and open an overlay.</p></div>
          <p class="muted">This sheet includes the authored component catalogue. Hidden states and additional workflows still need their dedicated reviews. The values are proposals for review. Submission and adoption are not performed by this page.</p>
          <en-accordion-item class="token-disclosure" label="Token snapshot and coverage" heading-level="3"><p>${Object.keys(this.theme.tokens).length} resolved token values · ${definitions.length} custom elements · preview ${this.theme.sourceHash.slice(7,19)}</p>
            <p>${this.theme.diagnostics.length ? html`${this.theme.diagnostics.length} action-color checks need review: ${this.theme.diagnostics.map(d=>d.message).join(' ')}` : 'The implemented action-color pair checks pass for this preview. This is not a complete accessibility assessment.'}</p>
            <div class="token-table-wrap"><table><caption>All resolved token values</caption><thead><tr><th>Token</th><th>Value</th><th>Source</th></tr></thead><tbody>${Object.values(this.theme.tokens).map(t=>html`<tr><th scope="row"><code>${t.cssName}</code></th><td>${t.cssValue}</td><td>${t.provenance}</td></tr>`)}</tbody></table></div>
          </en-accordion-item>
        </section>
      </main>
      <footer class="site-footer"><span>en-reve · A working design system</span><a href="#sheet">Back to top ↑</a></footer>
      ${this.progressReportEnabled ? html`<a class="progress-return" href="http://127.0.0.1:4177">Progress Report</a>` : nothing}
    `;
  }
}
