import { css, html, nothing } from 'lit';
import { SelectionItemElement } from '../internal/selection-item.js';

/**
 * Authored metadata and rich label for a parent-owned progress step.
 * @tagname en-progress-step
 * @slot - Noninteractive label content; falls back to label. The label attribute also provides compact summary text.
 */
export class EnProgressStep extends SelectionItemElement {
	static override properties = { ...SelectionItemElement.properties, status: { noAccessor: true, reflect: true, useDefault: true } };
	static override styles = css`:host { display: contents; } :host([hidden]) { display: none !important; }`;
	private state: 'pending' | 'complete' | 'error' = 'pending';
	/** Explicit completion or error state; navigation never changes it automatically. */
	get status(): 'pending' | 'complete' | 'error' { return this.state; }
	set status(value: 'pending' | 'complete' | 'error') {
		const previous = this.state; this.state = value;
		if (this.getAttribute('status') !== value) this.setAttribute('status', value);
		this.requestUpdate('status', previous);
	}
	protected override render() { return html`<slot>${this.label || nothing}</slot>`; }
}
declare global { interface HTMLElementTagNameMap { 'en-progress-step': EnProgressStep; } }
