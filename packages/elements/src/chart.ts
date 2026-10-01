import { html, css } from 'lit';
import { EnElement } from './internal/en-element.js';
import { foundationStyles, blockHostStyles } from '@en-reve/styles/foundations.js';
import { controlStyles } from '@en-reve/styles/controls.js';
import { chartModel, barChart, type ChartDatum, type ChartRenderer } from '@en-reve/primitives/templates/chart.js';
import { dispatchChange } from '@en-reve/primitives/interactions/events.js';
/** Renderer-neutral chart host with independently operable legend and data table.
 * @tagname en-chart
 * @csspart visual - Decorative renderer output.
 * @csspart legend - Native visibility controls.
 * @csspart table - Complete textual data, including hidden series.
 * @fires {import('@en-reve/primitives/interactions/events.js').ChangeEvent<readonly string[]>} en-change - Tentative array of hidden datum keys.
 */
export class EnChart extends EnElement<{'en-change': import('@en-reve/primitives/interactions/events.js').ChangeEvent<readonly string[]>}> {
    static override properties = { data: { attribute: false }, renderer: { attribute: false }, label: {}, summary: {}, hiddenKeys: { attribute: false, noAccessor: true } };
    static override styles = [foundationStyles, blockHostStyles, controlStyles, css `figure{margin:0;} .legend{display:flex;flex-wrap:wrap;gap:var(--en-space-3);} label{display:flex;gap:var(--en-space-1);align-items:center;} table{border-collapse:collapse;inline-size:100%;margin-block-start:var(--en-space-3);} th,td{text-align:start;padding:var(--en-space-2);border-block-end:var(--en-border-width) solid var(--en-color-line);} .visual{max-inline-size:50rem;}`];
    declare data: readonly ChartDatum[];
    declare renderer: ChartRenderer;
    declare label: string;
    declare summary: string;
    private hiddenValues: string[] = [];
    private revision = 0;
    constructor() { super(); this.data = []; this.renderer = barChart; this.label = 'Chart'; this.summary = ''; }
    get hiddenKeys() { return [...this.hiddenValues]; }
    set hiddenKeys(value: readonly string[]) { const previous = this.hiddenValues; this.hiddenValues = [...new Set(value)]; this.revision++; this.requestUpdate('hiddenKeys', previous); }
    private toggle(key: string) { const previous = this.hiddenKeys, proposed = previous.includes(key) ? previous.filter(k => k !== key) : [...previous, key]; const stage = (v: readonly string[]) => { this.hiddenValues = [...v]; this.requestUpdate(); }; dispatchChange(this, { previous, proposed, reason: 'legend', getRevision: () => this.revision, stage, rollback: stage, canCommit: () => this.isConnected && this.data.some(d => d.key === key) }); }
    protected override updated(){for(const input of this.renderRoot.querySelectorAll<HTMLInputElement>('input[data-key]'))input.checked=!this.hiddenValues.includes(input.dataset.key!);}
    protected override render() { const keys = this.data.map(d => d.key); if (new Set(keys).size !== keys.length || keys.some(k => !k))
        return html `<p role="status">Chart data requires unique, nonempty keys.</p>`; return html `<figure><figcaption class="en-label">${this.label}</figcaption><p>${this.summary}</p><div class="visual" part="visual" aria-hidden="true" inert>${this.renderer(chartModel(this.data.filter(d => !this.hiddenValues.includes(d.key))))}</div><div class="legend" part="legend" role="group" aria-label="Visible data">${this.data.map(d => html `<label><input class="en-checkbox" type="checkbox" data-key=${d.key} ?checked=${!this.hiddenValues.includes(d.key)} @change=${(e: Event) => { this.toggle(d.key); (e.target as HTMLInputElement).checked = !this.hiddenValues.includes(d.key); }}>${d.label}</label>`)}</div><table part="table"><caption>${this.label}: data</caption><thead><tr><th scope="col">Category</th><th scope="col">Value</th></tr></thead><tbody>${this.data.map(d => html `<tr><th scope="row">${d.label}</th><td>${Number.isFinite(d.value) ? d.value : 'Unavailable'}</td></tr>`)}</tbody></table></figure>`; }
}
export type { ChartDatum, ChartRenderer } from '@en-reve/primitives/templates/chart.js';
declare global {
    interface HTMLElementTagNameMap {
        'en-chart': EnChart;
    }
}
