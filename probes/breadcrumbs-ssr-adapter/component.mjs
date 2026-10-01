import { LitElement, html } from 'lit';
import { EnBreadcrumbs } from '@en-reve/elements/breadcrumbs.js';
import { prepareBreadcrumbsProjection } from '@en-reve/primitives/interactions/breadcrumbs-projection.js';
import { createFixtureState, pathTemplate } from './template.mjs';

export { BREADCRUMBS_PLAN_ATTRIBUTE, BREADCRUMBS_SLOT_PREFIX } from '@en-reve/primitives/interactions/breadcrumbs-projection.js';
export const BREADCRUMBS_TAG = 'en-breadcrumbs-probe';
export const BREADCRUMBS_FRAME_TAG = 'en-breadcrumbs-probe-frame';

/** The maintained probe exercises the production component and shared controller. */
export class EnBreadcrumbsProbe extends EnBreadcrumbs {
	constructor() { super(); this.label = 'Default breadcrumb path'; }

	/** Fixture-only custom-adapter handoff; the public component exposes no plan API. */
	setSSRPlan(keys, hiddenKeys = []) {
		prepareBreadcrumbsProjection(this, keys, hiddenKeys);
	}
}

/** A separate shadow host makes nested SSR boundary/marker tests meaningful. */
export class EnBreadcrumbsProbeFrame extends LitElement {
	static properties = { label: {}, state: { attribute: false }, handlers: { attribute: false } };
	constructor() { super(); this.label = 'Nested fixture frame'; this.state = createFixtureState(); this.handlers = {}; }
	render() { return html`<section aria-label=${this.label}>${pathTemplate(this.state, this.handlers)}</section>`; }
}

export function registerProbeElements(registry = globalThis.customElements) {
	for (const [name, ctor] of [[BREADCRUMBS_TAG, EnBreadcrumbsProbe], [BREADCRUMBS_FRAME_TAG, EnBreadcrumbsProbeFrame]]) {
		const existing = registry.get(name);
		if (existing && existing !== ctor) throw new TypeError(`Conflicting fixture definition: ${name}`);
		if (!existing) registry.define(name, ctor);
	}
}
