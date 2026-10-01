import { html } from 'lit';
import { EnElement } from './internal/en-element.js';
import { foundationStyles } from '@en-reve/styles/foundations.js';
import { controlStyles } from '@en-reve/styles/controls.js';
import { patternStyles } from '@en-reve/styles/patterns.js';
import { dispatchAction } from '@en-reve/primitives/interactions/events.js';
/** A removable label; the collection owner handles removal and subsequent focus.
 * @tagname en-tag
 * @slot - Noninteractive tag text.
 * @fires {CustomEvent<import('@en-reve/primitives/interactions/events.js').ActionDetail<'remove', {value:string}>>} en-action - Cancelable remove intent with the tag value. Does not remove itself.
 */
export class EnTag extends EnElement<{'en-action':CustomEvent<import('@en-reve/primitives/interactions/events.js').ActionDetail<'remove',{value:string}>>}> {
    static override properties = { value: {}, label: {}, removeLabel: { attribute: 'remove-label' }, removable: { type: Boolean }, disabled: { type: Boolean } };
    static override styles = [foundationStyles, controlStyles, patternStyles];
    declare value: string;
    declare label: string;
    declare removeLabel: string;
    declare removable: boolean;
    declare disabled: boolean;
    constructor() { super(); this.value = ''; this.label = ''; this.removeLabel = 'Remove'; this.removable = false; this.disabled = false; }
    protected override render() { return html `<span class="en-tag" part="base"><slot>${this.label}</slot>${this.removable ? html `<button type="button" class="en-button en-icon-button" data-variant="ghost" part="remove" aria-label=${this.removeLabel + ' ' + this.label} ?disabled=${this.disabled} @click=${() => { if (!this.disabled)
        dispatchAction(this, { action: 'remove', data: { value: this.value } }, { cancelable: true }); }}>×</button>` : null}</span>`; }
}
declare global {
    interface HTMLElementTagNameMap {
        'en-tag': EnTag;
    }
}
