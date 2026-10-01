import { css, html, nothing } from 'lit';
import { SelectionItemElement } from '../internal/selection-item.js';

/**
 * A noninteractive rich label and metadata for a parent-owned segmented choice.
 * The parent renders its native radio. Do not put links, controls or tab stops in the label.
 * @tagname en-segmented-item
 * @slot - Noninteractive phrasing content; unused slot falls back to label.
 */
export class EnSegmentedItem extends SelectionItemElement {
  static override styles = css`:host { display: contents; } :host([hidden]) { display: none !important; }`;
  protected override render() { return html`<slot>${this.label || nothing}</slot>`; }
}
declare global { interface HTMLElementTagNameMap { 'en-segmented-item': EnSegmentedItem; } }
