import { EnElement } from '../internal/en-element.js';
import { BreadcrumbsProjectionController } from '@en-reve/primitives/interactions/breadcrumbs-projection.js';
import { breadcrumbsTemplate } from '@en-reve/primitives/templates/breadcrumbs.js';
import { foundationStyles, blockHostStyles } from '@en-reve/styles/foundations.js';
import { navigationStyles, breadcrumbHostStyles } from '@en-reve/styles/navigation.js';

/**
 * A named breadcrumb landmark over original native light-DOM anchors and labels.
 * Native children own URLs, rich content, handlers and explicit aria-current.
 * The component owns stable ordered-list wrappers and decorative separators.
 * @tagname en-breadcrumbs
 * @slot - Direct native a and noninteractive span children in ancestor-to-current order; author no slot attributes.
 * @csspart base - The named native navigation landmark.
 * @csspart list - The ordered path list.
 * @csspart item - One stable path wrapper, including its decorative separator.
 * @csspart separator - A decorative separator hidden from accessibility APIs.
 * @cssprop --en-navigation-gap - Space between path entries and separators.
 * @cssprop --en-navigation-color - Ordinary path link color.
 * @cssprop --en-navigation-active-color - Current or hovered link and plain-label color.
 */
export class EnBreadcrumbs extends EnElement {
	static override shadowRootOptions: ShadowRootInit = { mode: 'open', slotAssignment: 'manual' };
	static override properties = {
		label: { type: String, useDefault: true },
	};
	static override styles = [foundationStyles, blockHostStyles, navigationStyles, breadcrumbHostStyles];

	readonly #projection = new BreadcrumbsProjectionController(this);

	/** Accessible name of the internal breadcrumb landmark. Supply a contextual, localized name. */
	declare label: string;

	constructor() {
		super();
		this.label = 'Breadcrumbs';
	}

	protected override render() {
		return breadcrumbsTemplate({ label: this.label, ...this.#projection.view });
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'en-breadcrumbs': EnBreadcrumbs;
	}
}
