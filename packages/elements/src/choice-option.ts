import { css, html } from 'lit';
import { SelectionItemElement } from './internal/selection-item.js';
/** Parent-owned choice metadata for toggle groups, checkbox groups and multiselect.
 * @tagname en-choice-option
 * @slot - Noninteractive rich label in checkbox groups; plain text metadata in other choice owners. Falls back to label.
 * @slot description - Noninteractive supporting content for checkbox groups; falls back to description.
 * @csspart label - Rich label content.
 * @csspart description - Supporting content.
 */
export class EnChoiceOption extends SelectionItemElement {
    static override properties = {...SelectionItemElement.properties, description: {reflect: true, noAccessor: true}};
    static override styles = css`:host { display:contents; } :host([hidden]) { display:none !important; }
      [part=description] { display:block; font-size:smaller; color:var(--en-color-text-muted, inherit); }
      [part=description]:empty { display:none; }`;
    #description = '';
    /** Supporting text fallback; rich content uses slot="description". @default '' */
    get description(): string { return this.#description; }
    set description(value: string) {
        const previous = this.#description; this.#description = String(value ?? '');
        if (this.getAttribute('description') !== this.#description) this.setAttribute('description', this.#description);
        this.requestUpdate('description', previous);
    }
    protected override render() { return html`<span part="label"><slot>${this.label}</slot></span><span part="description"><slot name="description">${this.description}</slot></span>`; }
}
declare global {
    interface HTMLElementTagNameMap {
        'en-choice-option': EnChoiceOption;
    }
}
