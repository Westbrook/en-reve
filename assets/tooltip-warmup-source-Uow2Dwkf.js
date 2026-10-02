import{t as e}from"./rolldown-runtime-B0lUwjiP.js";var t;function n(){return(n=e((()=>{t=`import '@en-reve/elements/define/button.js';
import '@en-reve/elements/define/select.js';
import '@en-reve/elements/define/stack.js';
import '@en-reve/elements/define/toolbar.js';
import '@en-reve/elements/define/tooltip.js';
/** Docs-owned consumption helpers; no component state or event protocol lives here. */
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
}`})))()}n();export{t as default};
//# sourceMappingURL=tooltip-warmup-source-Uow2Dwkf.js.map