import { html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { BREADCRUMBS_SLOT_PREFIX } from '../interactions/breadcrumbs-projection.js';
import type { BreadcrumbsProjectionView } from '../interactions/breadcrumbs-projection.js';

export interface BreadcrumbsTemplateOptions extends BreadcrumbsProjectionView {
	readonly label: string;
}

/** Native structure shared by named SSR projection and manual client projection. */
export function breadcrumbsTemplate({ label, entries, error }: BreadcrumbsTemplateOptions) {
	return html`
		<nav class="en-breadcrumbs" part="base" aria-label=${label}>
			<p class="en-breadcrumbs__diagnostic" role="status" ?hidden=${!error}>${error || nothing}</p>
			<ol class="en-breadcrumbs__list" part="list" role="list">
				${repeat(entries, entry => entry.key, ({ key, hidden, separator }) => html`
					<li class="en-breadcrumbs__item" part="item" data-projection-key=${key} ?hidden=${hidden}>
						${separator ? html`<span class="en-breadcrumbs__separator" part="separator" aria-hidden="true">/</span>` : nothing}
						<slot name=${`${BREADCRUMBS_SLOT_PREFIX}${key}`} data-projection-key=${key}></slot>
					</li>
				`)}
			</ol>
		</nav>
	`;
}
