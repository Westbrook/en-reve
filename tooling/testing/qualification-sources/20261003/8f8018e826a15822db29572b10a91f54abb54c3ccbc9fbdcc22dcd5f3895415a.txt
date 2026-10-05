import { MultipleChoice } from './internal/multiple-choice.js';
/** Searchable multi-value field. Query is independent from selected form values.
 * @omit-csspart option-content
 * @tagname en-multiselect
 * @csspart field - Field layout.
 * @csspart options - Multiselect listbox.
 * @csspart option - Selectable option surface.
 * @csspart tags - Selected values and independently named removal buttons.
 * @fires {import('@en-reve/primitives/interactions/events.js').ChangeEvent<readonly string[]>} en-change - Tentative selected keys; cancelable.
 */
export class EnMultiselect extends MultipleChoice {
    protected readonly choiceKind = 'picker' as const;
}
declare global {
    interface HTMLElementTagNameMap {
        'en-multiselect': EnMultiselect;
    }
}
