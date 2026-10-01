import { MultipleChoice } from './internal/multiple-choice.js';
/** Aggregate native checkbox choices, repeated form entries and reset defaults.
 * @omit-csspart tags
 * @tagname en-checkbox-group
 * @csspart field - Group layout.
 * @csspart options - Named checkbox group.
 * @csspart option - Checkbox label or whole-card choice.
 * @csspart option-content - Visual option content, including projected rich children.
 * @slot - Direct en-choice-option children with noninteractive rich labels and descriptions.
 * @fires {import('@en-reve/primitives/interactions/events.js').ChangeEvent<readonly string[]>} en-change - Tentative selected keys; cancelable.
 */
export class EnCheckboxGroup extends MultipleChoice {
    protected override get projectsChoiceChildren(): boolean { return true; }
    protected readonly choiceKind = 'checkbox' as const;
}
declare global {
    interface HTMLElementTagNameMap {
        'en-checkbox-group': EnCheckboxGroup;
    }
}
