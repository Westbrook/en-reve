import { html, css, type PropertyValues } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { EnElement } from './internal/en-element.js';
import { foundationStyles, blockHostStyles } from '@en-reve/styles/foundations.js';
import { controlStyles } from '@en-reve/styles/controls.js';
import { dispatchAction } from '@en-reve/primitives/interactions/events.js';
import { visibleActionCount } from '@en-reve/primitives/state/overflow.js';
export interface OverflowAction {
    readonly value: string;
    readonly label: string;
    readonly disabled?: boolean;
}
/** Width-driven actions with an ordinary disclosure, retaining native Tab navigation.
 * @tagname en-action-overflow
 * @fires {CustomEvent<import('@en-reve/primitives/interactions/events.js').ActionDetail<string>>} en-action - Action intent, with action equal to the stable item value.
 */
export class EnActionOverflow extends EnElement<{'en-action': CustomEvent<import('@en-reve/primitives/interactions/events.js').ActionDetail<string>>}> {
    static override properties = { items: { attribute: false }, label: {}, moreLabel: { attribute: 'more-label' } };
    static override styles = [foundationStyles, blockHostStyles, controlStyles, css `
 .row,.measure{display:flex;gap:var(--en-space-2);align-items:start;} .row{flex-wrap:wrap;} .measure{position:fixed;visibility:hidden;pointer-events:none;inline-size:max-content;inset-inline-start:-10000px;} details{position:relative;} summary{list-style:none;} summary::-webkit-details-marker{display:none;} .extra{display:flex;flex-direction:column;align-items:stretch;padding:var(--en-space-2);background:var(--en-color-surface);border:var(--en-border-width) solid var(--en-color-boundary);border-radius:var(--en-radius-control);} .en-button{white-space:nowrap;}
 `];
    declare items: readonly OverflowAction[];
    declare label: string;
    declare moreLabel: string;
    private measureFrame = 0;
    private scheduleMeasure = () => { if (!this.measureFrame)
        this.measureFrame = requestAnimationFrame(() => { this.measureFrame = 0; this.measure(); }); };
    private count = Infinity;
    private observer?: ResizeObserver;
    constructor() { super(); this.items = []; this.label = 'Actions'; this.moreLabel = 'More actions'; }
    private measure = () => { const row = this.renderRoot.querySelector<HTMLElement>('.measure'); if (!row)
        return; const buttons = [...row.querySelectorAll<HTMLElement>('button')]; const gap = parseFloat(getComputedStyle(row).columnGap) || 0; const next = visibleActionCount(buttons.slice(0, -1).map(b => b.getBoundingClientRect().width), this.getBoundingClientRect().width, buttons.at(-1)?.getBoundingClientRect().width ?? 0, gap); if (next === this.count)
        return; const focused = this.shadowRoot?.activeElement as HTMLElement | null; const value = focused?.dataset.action; const wasExtra = !!focused?.closest('.extra'); this.count = next; this.requestUpdate(); void this.updateComplete.then(() => { if (value) {
        const button = [...this.renderRoot.querySelectorAll<HTMLElement>('.row [data-action]')].find(b => b.dataset.action === value);
        const details = button?.closest('details');
        if (details)
            details.open = true;
        button?.focus();
    }
    else if (wasExtra)
        this.renderRoot.querySelector<HTMLElement>('summary')?.focus(); }); };
    protected override firstUpdated() { const Observer = this.ownerDocument.defaultView?.ResizeObserver; if (Observer) {
        this.observer = new Observer(this.scheduleMeasure);
        this.observer.observe(this);
        const measure = this.renderRoot.querySelector('.measure');
        if (measure)
            this.observer.observe(measure);
    } this.measure(); }
    protected override updated(_changed: PropertyValues) { this.measure(); }
    override disconnectedCallback() { this.observer?.disconnect(); cancelAnimationFrame(this.measureFrame); this.measureFrame = 0; this.observer = undefined; super.disconnectedCallback(); }
    override connectedCallback() { super.connectedCallback(); if (this.hasUpdated)
        void this.updateComplete.then(() => this.firstUpdated()); }
    private button(item: OverflowAction, measurement = false) { return html `<button type="button" class="en-button" data-variant="secondary" data-action=${item.value} ?disabled=${item.disabled} tabindex=${measurement ? -1 : 0} @click=${() => { if (!measurement && !item.disabled && this.items.includes(item))
        dispatchAction(this, { action: item.value, data: undefined }); }}>${item.label}</button>`; }
    protected override render() { return html `<div class="measure" aria-hidden="true" inert>${this.items.map(i => this.button(i, true))}<button type="button" class="en-button" data-variant="secondary">${this.moreLabel}</button></div><div class="row" role="group" aria-label=${this.label}>${repeat(this.items.slice(0, this.count), i => i.value, i => this.button(i))}${this.count < this.items.length ? html `<details @keydown=${(event: KeyboardEvent) => { if (event.key === 'Escape') {
        const details = event.currentTarget as HTMLDetailsElement;
        details.open = false;
        details.querySelector('summary')?.focus();
        event.preventDefault();
    } }}><summary class="en-button" data-variant="secondary">${this.moreLabel}</summary><div class="extra">${repeat(this.items.slice(this.count), i => i.value, i => this.button(i))}</div></details>` : null}</div>`; }
}
declare global {
    interface HTMLElementTagNameMap {
        'en-action-overflow': EnActionOverflow;
    }
}
