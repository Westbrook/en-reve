import { html } from 'lit';
import { descriptionTemplate } from '@en-reve/primitives/templates/description.js';
import { repeat } from 'lit/directives/repeat.js';
import { MultipleChoice } from './internal/multiple-choice.js';
/** Finite keyed selection with independently focusable item and bulk actions.
 * @fires {import('@en-reve/primitives/interactions/events.js').ChangeEvent<readonly string[]>} en-change - Tentative selected keys.
 * @omit-csspart field
 * @omit-csspart option
 * @omit-csspart option-content
 * @omit-csspart options
 * @omit-csspart tags
 * @tagname en-selection-collection
 * @csspart actions - Wrapping bulk-action row, including the selection status.
 * @csspart status - Live selected-item count.
 * @slot actions - Bulk actions; read .value when invoked.
 * @slot - Named actions-KEY slots provide each item's independent links/buttons.
 */
export class EnSelectionCollection extends MultipleChoice {
    protected readonly choiceKind = 'checkbox' as const;
    protected override render() { return html `<section aria-label=${this.label} aria-describedby="description"><h3 class="en-label">${this.label}</h3>${descriptionTemplate(this.description)}<div class="en-selection-actions" part="actions" role="group" aria-label="Selection actions"><span part="status" role="status">${this.value.length} selected</span><slot name="actions"></slot></div><ul class="en-selection-list">${repeat(this.availableItems, i => i.value, i => html `<li class="en-attachment" data-key=${i.value}><label class="en-choice"><input type="checkbox" class="en-checkbox" data-choice=${i.value} aria-label=${i.label} aria-description=${i.description ?? ''} ?checked=${this.value.includes(i.value)} ?disabled=${this.effectiveDisabled || i.disabled} aria-readonly=${String(this.readOnly)} @click=${(event: Event) => { if (this.readOnly)
        event.preventDefault(); }} @change=${(event: Event) => { this.toggle(i.value); (event.target as HTMLInputElement).checked = this.value.includes(i.value); }}><span aria-hidden="true">${i.label}${i.description ? html `<small>${i.description}</small>` : null}</span></label><slot name=${'actions-' + i.value}></slot></li>`)}</ul>${this.error || this.showError ? html `<p role="status">${this.validationMessage}</p>` : null}</section>`; }
}
export type { ChoiceItem } from './internal/multiple-choice.js';
declare global {
    interface HTMLElementTagNameMap {
        'en-selection-collection': EnSelectionCollection;
    }
}
