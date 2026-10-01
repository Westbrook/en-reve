import { LitElement, html, nothing, svg } from 'lit';
import { hydrate } from '@lit-labs/ssr-client';
import { repeat } from 'lit/directives/repeat.js';
import { emitThemeCSS, emitThemePairCSS } from '@en-reve/tokens';
import { loadPreset } from '../showcase/presets.js';
import { attachDocumentTheme, type DocumentTheme } from '../theme-review/document-theme.js';
import { resolvePreviewPair } from '../preview-theme.js';

const suggestions = ['Create year-over-year growth chart', 'Generate congratulatory poster', 'Summarize development pipeline'];
const steps = [
  ['Read source context', 'Reviewed the sample brand brief and its executive audience.'],
  ['Gather supporting data', 'Used the sample market summary to frame the opportunity.'],
  ['Identify supporting proof points', 'Selected growth, customer stories, and product milestones.'],
  ['Draft response structure', 'Balanced the opening, supporting evidence, and next steps across 45 minutes.'],
  ['Check brand style guidelines', 'Kept the voice clear, optimistic, and specific.'],
  ['Review for tone and clarity', 'Simplified the narrative and gave each section a single purpose.'],
  ['Prepare next-step suggestions', 'Identified three ways to develop the presentation.'],
];
const sources = [
  { title: 'Brand brief · Q1 2026', type: 'Creative brief', text: 'Sample brief: Introduce the year’s progress to an executive audience. Lead with customer impact, make the evidence easy to scan, and close with a clear invitation to act. Voice: confident, human, and optimistic.' },
  { title: 'Market research summary', type: 'Research notes', text: 'Sample research: Customers value simpler workflows, connected tools, and a shorter path from idea to outcome. Use verified customer stories and approved metrics in the final presentation.' },
];
type ResponseKind = 'outline' | 'chart' | 'poster' | 'pipeline' | 'general';
type Turn = { id: number; prompt: string; attachments: string[]; kind: ResponseKind; feedback?: 'up' | 'down' };
const artifactText: Record<ResponseKind, string> = {
  outline: 'Set the scene — 10 min: Context, ambition, and the big idea.\nMake the case — 25 min: Progress, proof points, and possibilities.\nInspire action — 10 min: Next steps and space for questions.',
  chart: 'A year of momentum. Illustrative revenue index: 2025 = 100; 2026 = 140. 40% growth. Sample data.',
  poster: 'Made possible. Together.\nBig ideas. Brilliant people.\nHere’s to the team behind every milestone.',
  pipeline: 'Now: Make the everyday easier. Refine core workflows and close the feedback loop.\nNext: Connect the experience. Bring shared assets and team reviews closer together.\nExploring: Create room for what’s next. Test new concepts with a small group of collaborators.',
  general: '',
};
const opening = 'Can you help me create a 45-minute presentation?';
const responseText: Record<ResponseKind, string> = {
  outline: 'Absolutely. I’ve shaped this as an executive narrative: a clear story, a few compelling proof points, and a focused call to action. Here’s a 45-minute structure to get you started.',
  chart: 'Here’s a simple year-over-year growth chart for the evidence section. These are illustrative values; replace them with your approved figures before presenting.',
  poster: 'Try a bold, type-led poster that celebrates the team behind the progress. Keep the message short, let the milestone lead, and leave room for a personal note.',
  pipeline: 'Here’s a concise pipeline summary for your presentation. Group the work by what’s shipping now, what’s coming next, and what the team is exploring.',
  general: 'For this presentation, start with the one idea you want the audience to remember. Support it with one customer story and one verified metric, then close with a concrete next step. You can develop the outline, growth chart, poster, or pipeline summary below.',
};

function glyph(name: 'up' | 'down' | 'copy' | 'send') {
  const paths = name === 'copy' ? svg`<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>`
    : name === 'send' ? svg`<path d="M12 20V4m-6 6 6-6 6 6"/>`
    : svg`<g transform=${name === 'down' ? 'rotate(180 12 12)' : ''}><path d="M7 10h-4v11h4m0-11 5-8c2 0 3 1 2 4l-1 4h6a2 2 0 0 1 2 2l-2 7a3 3 0 0 1-3 2H7V10Z"/></g>`;
  return html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
}

/** A local conversation fixture built from the public en-reve component system. */
export class ConversationApp extends LitElement {
  private theme: Awaited<ReturnType<typeof loadPreset>>['workspace']['presentation'] = resolvePreviewPair({ name: 'conversation', density: 'comfortable' });
  private documentTheme?: DocumentTheme;
  private turns: Turn[] = [{ id: 1, prompt: opening, attachments: [], kind: 'outline' }];
  private nextId = 2;
  private draft = '';
  private attachments: string[] = [];
  private appearance: 'light' | 'dark' = 'light';
  private flagged = false;
  private status = '';
  private busy = false;
  private timer?: ReturnType<typeof setTimeout>;

  async prepareTheme() { this.theme = (await loadPreset('spectrum-inspired')).workspace.presentation; }
  get previewCSS() { return 'light' in this.theme ? emitThemePairCSS(this.theme, { scope: 'root' }) : emitThemeCSS(this.theme, { scope: 'root' }); }
  protected createRenderRoot() {
    if (this.hasAttribute('data-ssr')) { hydrate(this.render(), this, { host: this }); this.removeAttribute('data-ssr'); }
    return this;
  }
  protected async firstUpdated() {
    this.flagged = new URLSearchParams(location.search).has('progress-report');
    // Preserve anything typed into the server-rendered native composer before hydration.
    this.draft = this.querySelector<HTMLTextAreaElement>('#conversation-prompt')?.value ?? '';
    this.documentTheme = attachDocumentTheme({ root: this });
    try { await this.prepareTheme(); }
    catch { this.status = 'The Spectrum theme is unavailable. Showing the en-reve theme.'; }
    if (!this.isConnected) return;
    this.paint(); this.requestUpdate();
  }
  disconnectedCallback() { clearTimeout(this.timer); this.documentTheme?.disconnect(); super.disconnectedCallback(); }
  private paint() { this.documentTheme?.apply(this.theme, { appearance: this.appearance }); }
  private href(path: string) { return path + (this.flagged ? '?progress-report' : ''); }
  private promptField() { return this.querySelector<HTMLTextAreaElement>('#conversation-prompt')!; }
  private chooseSuggestion(text: string) { this.draft = text; this.promptField().value = text; this.promptField().focus(); this.requestUpdate(); }
  private changeAppearance(event: Event) {
    this.appearance = (event.target as HTMLSelectElement).value === 'dark' ? 'dark' : 'light';
    this.paint(); this.requestUpdate();
  }
  private async reset() {
    clearTimeout(this.timer); this.busy = false; this.turns = [{ id: this.nextId++, prompt: opening, attachments: [], kind: 'outline' }];
    this.draft = ''; this.attachments = []; this.promptField().value = ''; this.status = 'Conversation reset.';
    this.requestUpdate(); await this.updateComplete;
    this.querySelector<HTMLElement>('#conversation-title')?.focus();
  }
  private async send() {
    const prompt = this.promptField().value.trim();
    if (!prompt || this.busy) return;
    const lower = prompt.toLowerCase();
    const kind: ResponseKind = /chart|growth/.test(lower) ? 'chart' : /poster|congratulat/.test(lower) ? 'poster' : /pipeline/.test(lower) ? 'pipeline' : /outline|45.minute|presentation/.test(lower) ? 'outline' : 'general';
    this.turns = [...this.turns, { id: this.nextId++, prompt, attachments: [...this.attachments], kind }];
    this.draft = ''; this.attachments = []; this.promptField().value = ''; this.busy = true;
    this.status = 'Preparing a sample response.'; this.requestUpdate();
    await this.updateComplete; this.promptField().focus();
    this.querySelector('.conversation-turn:last-child')?.scrollIntoView({ block: 'start', behavior: 'instant' });
    this.timer = setTimeout(() => { this.busy = false; this.status = `Sample response ready. ${responseText[kind]} ${artifactText[kind]}`; this.requestUpdate(); }, 650);
  }
  private keydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); void this.send(); }
  }
  private feedback(turn: Turn, value: 'up' | 'down') {
    turn.feedback = turn.feedback === value ? undefined : value;
    this.status = turn.feedback ? 'Feedback noted for this demo.' : 'Feedback removed.'; this.requestUpdate();
  }
  private async copy(turn: Turn) {
    const detail = artifactText[turn.kind] ? `\n\n${artifactText[turn.kind]}` : '';
    try { await navigator.clipboard.writeText(responseText[turn.kind] + detail); this.status = 'Response copied.'; }
    catch { this.status = 'Copy is unavailable. Select the response text to copy it.'; }
    this.requestUpdate();
  }
  private attach(event: Event) {
    const input = event.target as HTMLInputElement;
    this.attachments = [...this.attachments, ...Array.from(input.files ?? [], file => file.name)].slice(0, 3);
    input.value = ''; this.status = 'Attachment names added locally. File contents are not read.'; this.requestUpdate();
  }
  private removeAttachment(index: number) { this.attachments = this.attachments.filter((_, i) => i !== index); this.requestUpdate(); this.promptField().focus(); }
  private artifact(kind: ResponseKind) {
    if (kind === 'outline') return html`<div class="conversation-outline" aria-label="45-minute presentation outline">
      <div class="outline-heading"><span><en-icon name="file"></en-icon> Your presentation, at a glance</span><span>45 min</span></div>
      <ol><li><span class="outline-number">01</span><div><strong>Set the scene</strong><span>Context, ambition, and the big idea</span></div><span class="outline-time">10 min</span></li>
      <li><span class="outline-number">02</span><div><strong>Make the case</strong><span>Progress, proof points, and possibilities</span></div><span class="outline-time">25 min</span></li>
      <li><span class="outline-number">03</span><div><strong>Inspire action</strong><span>Next steps and space for questions</span></div><span class="outline-time">10 min</span></li></ol></div>`;
    if (kind === 'chart') return html`<figure class="conversation-chart"><figcaption><strong>A year of momentum</strong><span>Illustrative revenue index · prior year = 100</span></figcaption><div class="chart-row"><span>2025</span><div><i style="inline-size:71.4%"></i></div><strong>100</strong></div><div class="chart-row"><span>2026</span><div><i style="inline-size:100%"></i></div><strong>140</strong></div><p>40% growth · sample data</p></figure>`;
    if (kind === 'poster') return html`<div class="conversation-poster"><span>Made possible. Together.</span><strong>Big ideas.<br>Brilliant people.</strong><p>Here’s to the team behind every milestone.</p></div>`;
    if (kind === 'pipeline') return html`<div class="conversation-pipeline"><div><en-badge variant="success">Now</en-badge><strong>Make the everyday easier</strong><p>Refine core workflows and close the feedback loop.</p></div><div><en-badge>Next</en-badge><strong>Connect the experience</strong><p>Bring shared assets and team reviews closer together.</p></div><div><en-badge>Exploring</en-badge><strong>Create room for what’s next</strong><p>Test new concepts with a small group of collaborators.</p></div></div>`;
    return nothing;
  }
  private turn(turn: Turn, index: number) {
    const pending = this.busy && index === this.turns.length - 1;
    return html`<section class="conversation-turn" aria-label=${`Conversation turn ${index + 1}`}>
      <div class="user-message"><span class="conversation-sr-only">You</span><p>${turn.prompt}</p>${turn.attachments.length ? html`<div class="message-attachments">${turn.attachments.map(name => html`<span><en-icon name="file"></en-icon>${name}</span>`)}</div>` : nothing}</div>
      <article class="assistant-message" aria-label="Assistant response" aria-busy=${pending}>
        <div class="assistant-identity"><span class="assistant-avatar"><en-icon name="sparkles"></en-icon></span><strong>en-reve</strong><span>Creative assistant</span></div>
        ${pending ? html`<p class="conversation-thinking"><span></span>Preparing your sample response…</p>` : html`
        <details class="response-process"><summary><span class="response-check"><en-icon name="check"></en-icon></span>Response complete<en-icon class="disclosure-chevron" name="chevron-right"></en-icon></summary>
          <ol class="response-steps">${steps.map(([title, detail]) => html`<li><en-icon name="check"></en-icon><details><summary>${title}</summary><p>${detail}</p></details></li>`)}</ol>
        </details>
        <p class="assistant-copy">${responseText[turn.kind]}</p>
        ${this.artifact(turn.kind)}
        <div class="response-actions" role="group" aria-label="Response feedback and actions">
          <button class="conversation-icon-button" type="button" aria-label="Helpful response" aria-pressed=${turn.feedback === 'up'} @click=${() => this.feedback(turn, 'up')}>${glyph('up')}</button>
          <button class="conversation-icon-button" type="button" aria-label="Unhelpful response" aria-pressed=${turn.feedback === 'down'} @click=${() => this.feedback(turn, 'down')}>${glyph('down')}</button>
          <en-button variant="ghost" icon-only @click=${() => this.copy(turn)}><span slot="prefix" class="conversation-glyph">${glyph('copy')}</span><span slot="label">Copy response</span></en-button>
          <span class="response-action-note">${turn.feedback ? 'Thanks for your feedback' : 'Sample response'}</span>
        </div>
        <details class="response-sources"><summary><en-icon class="disclosure-chevron" name="chevron-right"></en-icon>Sources<span class="source-count">2</span></summary><div class="source-grid">${sources.map((source, i) => html`<details class="source-card"><summary><span class="source-index">${i + 1}</span><span><strong>${source.title}</strong><small>${source.type} · Sample</small></span><en-icon name="chevron-down"></en-icon></summary><p>${source.text}</p></details>`)}</div></details>
        `}
      </article>
    </section>`;
  }
  render() {
    return html`<div class="conversation-page">
      <a class="conversation-skip" href="#conversation-main">Skip to conversation</a>
      <header class="conversation-header"><a class="wordmark" href=${this.href('/')} aria-label="en-reve design system"><span class="mark" aria-hidden="true">en</span><span>en-reve</span></a><span class="header-divider"></span><span class="conversation-header-label">Creative workspace</span><div class="conversation-header-tools"><span class="theme-caption">Spectrum-inspired</span><label class="appearance-picker"><span class="conversation-sr-only">Appearance</span><select aria-label="Appearance" @change=${this.changeAppearance}><option value="light" ?selected=${this.appearance === 'light'}>Light</option><option value="dark" ?selected=${this.appearance === 'dark'}>Dark</option></select></label></div></header>
      <main id="conversation-main" class="conversation-main" tabindex="-1">
        <div class="conversation-title-row"><div><p class="conversation-eyebrow">YOUR IDEAS, MOVING FORWARD</p><h1 id="conversation-title" tabindex="-1">Presentation planning</h1></div><en-button variant="ghost" @click=${this.reset}><en-icon slot="prefix" name="plus"></en-icon>Reset demo</en-button></div>
        <div class="conversation-thread">${repeat(this.turns, turn => turn.id, (turn, index) => this.turn(turn, index))}</div>
        ${!this.busy ? html`<section class="conversation-suggestions" aria-labelledby="suggestions-title"><h2 id="suggestions-title">What would you like to do next?</h2><div>${suggestions.map(text => html`<en-button variant="secondary" @click=${() => this.chooseSuggestion(text)}><en-icon slot="prefix" name="arrow-right"></en-icon>${text}</en-button>`)}</div></section>` : nothing}
        <div class="composer-dock"><form class="conversation-composer" @submit=${(event: Event) => { event.preventDefault(); void this.send(); }}>
          <div class="composer-input"><en-icon name="sparkles"></en-icon><label class="conversation-sr-only" for="conversation-prompt">Prompt</label><textarea id="conversation-prompt" name="prompt" rows="2" maxlength="4000" placeholder="Ask a question, share an idea, or add a task…" @input=${(event: Event) => { this.draft = (event.target as HTMLTextAreaElement).value; this.requestUpdate(); }} @keydown=${this.keydown} aria-describedby="composer-hint"></textarea></div>
          ${this.attachments.length ? html`<ul class="composer-attachments" aria-label="Attached files">${this.attachments.map((name, index) => html`<li><en-icon name="file"></en-icon><span>${name}</span><en-button variant="ghost" icon-only @click=${() => this.removeAttachment(index)}><en-icon slot="prefix" name="close"></en-icon><span slot="label">Remove ${name}</span></en-button></li>`)}</ul>` : nothing}
          <div class="composer-toolbar"><en-button variant="ghost" icon-only ?disabled=${this.attachments.length >= 3} @click=${() => this.querySelector<HTMLInputElement>('#conversation-file')?.click()}><en-icon slot="prefix" name="plus"></en-icon><span slot="label">Add attachment</span></en-button><input hidden id="conversation-file" type="file" multiple @change=${this.attach}><span id="composer-hint">${this.attachments.length ? 'Attached locally · up to 3 files' : 'Enter to send · Shift + Enter for a new line'}</span><en-button class="send-button" icon-only ?disabled=${!this.draft.trim() || this.busy} @click=${this.send}><span slot="prefix" class="conversation-glyph">${glyph('send')}</span><span slot="label">Send message</span></en-button></div>
        </form><p class="conversation-disclaimer">Local demo with sample responses. Nothing is sent to an AI service.</p></div>
        <p class="conversation-sr-only" role="status" aria-live="polite">${this.status}</p>
      </main>
      <footer class="conversation-footer"><span>Built with en-reve</span><a href=${this.href('/showcase.html')}>Explore the design system<en-icon name="arrow-right"></en-icon></a></footer>
      ${this.flagged ? html`<a class="progress-return" href="http://127.0.0.1:4177">Progress Report</a>` : nothing}
    </div>`;
  }
}
