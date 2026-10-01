import {html} from 'lit';
import type {IconName} from './icon/template.js';
import type {ChoiceItem} from './internal/multiple-choice.js';
import { MultipleChoice } from './internal/multiple-choice.js';
/** Toggle labels may include a decorative built-in icon alongside their text. */
export interface ToggleItem extends ChoiceItem { readonly icon?: IconName; }
/** Named persistent actions with single or multiple selection and roving focus.
 * @omit-csspart option-content
 * @omit-csspart tags
 * @tagname en-toggle-group
 * @csspart field - Group layout.
 * @csspart options - Named action group.
 * @csspart option-icon - Decorative icon host inside a toggle label.
 * @csspart option - Complete native toggle surface.
 * @fires {import('@en-reve/primitives/interactions/events.js').ChangeEvent<readonly string[]>} en-change - Tentative selected keys; cancelable.
 */
export class EnToggleGroup extends MultipleChoice {
    static override properties = { ...MultipleChoice.properties, joined: {type: Boolean, reflect: true} };
    /** Join adjacent surfaces with shared separators and only outer corners. */
    declare joined: boolean;
    /** Toggle options; icon adds a decorative glyph without changing the label. */
    declare items: readonly ToggleItem[];
    protected override renderChoiceLabel(item: ToggleItem) {
        return item.icon ? html`<en-icon part="option-icon" name=${item.icon}></en-icon><span>${item.label}</span>` : super.renderChoiceLabel(item);
    }
    protected readonly choiceKind = 'toggle' as const;
    constructor() { super(); this.multiple = false; this.joined = false; }
}
export type { ChoiceItem } from './internal/multiple-choice.js';
declare global {
    interface HTMLElementTagNameMap {
        'en-toggle-group': EnToggleGroup;
    }
}
