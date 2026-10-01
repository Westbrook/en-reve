import { html } from 'lit';
import type { TemplateResult } from 'lit';

export interface SlottedNavigationOptions {
	/** Accessible name of the private navigation landmark. */
	readonly label: string;
}

/** Native navigation with caller-owned light-DOM content in an ordinary default slot. */
export function slottedNavigationTemplate({ label }: SlottedNavigationOptions): TemplateResult {
	return html`
		<nav class="en-section-nav" part="base" aria-label=${label}>
			<slot></slot>
		</nav>
	`;
}
