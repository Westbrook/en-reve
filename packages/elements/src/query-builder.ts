import { html, css } from 'lit';
import type { FieldChangeEvent } from './events.js';
import { live } from 'lit/directives/live.js';
import { repeat } from 'lit/directives/repeat.js';
import { EnElement } from './internal/en-element.js';
import { foundationStyles, blockHostStyles } from '@en-reve/styles/foundations.js';
import { controlStyles, formStyles } from '@en-reve/styles/controls.js';
import { dispatchChange } from '@en-reve/primitives/interactions/events.js';
import { copyQuery, validateQuery, queryOperators, type Query, type QueryField, type QueryClause } from '@en-reve/primitives/state/query.js';
/** Structured filter editing with an explicit draft/apply/cancel boundary.
 * No arbitrary expression evaluation or remote filtering is performed.
 * @tagname en-query-builder
 * @fires {import('@en-reve/primitives/interactions/events.js').ChangeEvent<Query>} en-change - Tentative committed query, reason apply.
 */
export class EnQueryBuilder extends EnElement<{'en-change': import('@en-reve/primitives/interactions/events.js').ChangeEvent<Query>}> {
    static override properties = { value: { attribute: false, noAccessor: true }, fields: { attribute: false }, label: {}, disabled: { type: Boolean }, readOnly: { type: Boolean, attribute: 'readonly' } };
    static override styles = [foundationStyles, blockHostStyles, controlStyles, formStyles, css `.clause{display:flex;gap:var(--en-space-2);flex-wrap:wrap;align-items:end;margin-block:var(--en-space-3);} label{display:grid;gap:var(--en-space-1);} .actions{display:flex;gap:var(--en-space-2);} fieldset{border:0;padding:0;min-inline-size:0;} .en-input{max-inline-size:100%;} en-select{min-inline-size:0;} .clause en-select{flex:1 1 10rem;} .actions{margin-block-start:var(--en-space-2);flex-wrap:wrap;}`];
    declare fields: readonly QueryField[];
    declare label: string;
    declare disabled: boolean;
    declare readOnly: boolean;
    private committed: Query = { match: 'all', clauses: [] };
    private editing: Query = copyQuery(this.committed);
    private revision = 0;
    private sequence = 0;
    private error = '';
    constructor() { super(); this.fields = []; this.label = 'Filter conditions'; this.disabled = false; this.readOnly = false; }
    get value() { return copyQuery(this.committed); }
    set value(value: Query) { const previous = this.committed; this.committed = copyQuery(value); this.editing = copyQuery(value); this.revision++; this.error = ''; this.requestUpdate('value', previous); }
    get draft() { return copyQuery(this.editing); }
    cancel() { this.editing = copyQuery(this.committed); this.error = ''; this.requestUpdate(); }
    apply() { if (this.disabled || this.readOnly)
        return 'unchanged' as const; this.error = validateQuery(this.editing, this.fields); this.requestUpdate(); if (this.error) {
        void this.updateComplete.then(() => this.renderRoot.querySelector<HTMLElement>('[role=alert]')?.focus());
        return 'canceled' as const;
    } const previous = this.value, proposed = this.draft; const stage = (value: Query) => { this.committed = copyQuery(value); this.requestUpdate(); }; return dispatchChange(this, { previous, proposed, reason: 'apply', getRevision: () => this.revision, stage, rollback: stage, canCommit: () => this.isConnected && !this.disabled && !this.readOnly && !validateQuery(proposed, this.fields), commit: () => { this.editing = copyQuery(this.committed); } }); }
    private edit(id: string, patch: Partial<QueryClause>) { if (this.disabled || this.readOnly)
        return; this.editing = { ...this.editing, clauses: this.editing.clauses.map(c => c.id === id ? { ...c, ...patch } : c) }; this.error = ''; this.requestUpdate(); }
    private add() { if (this.disabled || this.readOnly || !this.fields.length)
        return; let id: string; do {
        id = 'condition-' + (++this.sequence);
    } while (this.editing.clauses.some(c => c.id === id)); this.editing = { ...this.editing, clauses: [...this.editing.clauses, { id, field: this.fields[0].value, operator: 'equals', value: '' }] }; this.requestUpdate(); void this.updateComplete.then(() => this.renderRoot.querySelectorAll<HTMLElement>('[data-value]').item(this.editing.clauses.length - 1)?.focus()); }
    private removeClause(id: string) { if (this.disabled || this.readOnly)
        return; const index = this.editing.clauses.findIndex(c => c.id === id); this.editing = { ...this.editing, clauses: this.editing.clauses.filter(c => c.id !== id) }; this.requestUpdate(); void this.updateComplete.then(() => { const buttons = this.renderRoot.querySelectorAll<HTMLElement>('[data-remove]'); (buttons.item(Math.min(index, buttons.length - 1)) ?? this.renderRoot.querySelector<HTMLElement>('[data-add]'))?.focus(); }); }
    protected override render() { return html `<fieldset ?disabled=${this.disabled || this.readOnly}><legend class="en-label">${this.label}</legend><en-select label="Match" size="inherit" .disabled=${this.disabled || this.readOnly} .value=${this.editing.match} .items=${[{value:'all',label:'All conditions'},{value:'any',label:'Any condition'}]} @en-input=${(e: Event) => e.stopPropagation()} @en-change=${(e: FieldChangeEvent) => { e.stopPropagation(); if (this.disabled || this.readOnly) { e.preventDefault(); return; } this.editing = {...this.editing, match:e.detail.proposed as 'all' | 'any'}; this.error=''; this.requestUpdate(); }}></en-select>${repeat(this.editing.clauses, c => c.id, (clause, index) => html `<div class="clause" role="group" aria-label=${'Condition ' + (index + 1)}><en-select label="Field" size="inherit" .disabled=${this.disabled || this.readOnly} .value=${clause.field} .items=${this.fields} @en-input=${(e: Event) => e.stopPropagation()} @en-change=${(e: FieldChangeEvent) => { e.stopPropagation(); if (this.disabled || this.readOnly) { e.preventDefault(); return; } this.edit(clause.id, {field:e.detail.proposed}); }}></en-select><en-select label="Comparison" size="inherit" .disabled=${this.disabled || this.readOnly} .value=${clause.operator} .items=${queryOperators.filter(o => this.fields.find(f => f.value === clause.field)?.type === 'number' || !['greater-than', 'less-than'].includes(o)).map(o => ({value:o,label:o.replaceAll('-', ' ')}))} @en-input=${(e: Event) => e.stopPropagation()} @en-change=${(e: FieldChangeEvent) => { e.stopPropagation(); if (this.disabled || this.readOnly) { e.preventDefault(); return; } this.edit(clause.id, {operator:e.detail.proposed as QueryClause['operator']}); }}></en-select><label>Value<input class="en-input" data-value .value=${live(clause.value)} @input=${(e: Event) => this.edit(clause.id, { value: (e.target as HTMLInputElement).value })}></label><button type="button" class="en-button" data-variant="ghost" data-remove aria-label=${'Remove condition ' + (index + 1)} @click=${() => this.removeClause(clause.id)}>Remove</button></div>`)}${this.error ? html `<p class="en-error" role="alert" tabindex="-1">${this.error}</p>` : null}<div class="actions"><button class="en-button" type="button" data-variant="secondary" data-add ?disabled=${!this.fields.length} @click=${() => this.add()}>Add condition</button><button class="en-button" type="button" @click=${() => this.apply()}>Apply filters</button><button class="en-button" type="button" data-variant="ghost" @click=${() => this.cancel()}>Cancel edits</button></div></fieldset>`; }
}
export type { Query, QueryField, QueryClause } from '@en-reve/primitives/state/query.js';
declare global {
    interface HTMLElementTagNameMap {
        'en-query-builder': EnQueryBuilder;
    }
}
