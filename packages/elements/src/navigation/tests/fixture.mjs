import '@lit-labs/ssr-client/lit-element-hydrate-support.js';
import { hydrate } from '@lit-labs/ssr-client';
import { EnNavigation } from '@en-reve/elements/navigation.js';
import { EnBreadcrumbs } from '@en-reve/elements/breadcrumbs.js';
import { fixtureTemplate, appendNavigationChildren, appendBreadcrumbChildren } from './fixture-template.mjs';

export async function start() {
	customElements.define('en-navigation', EnNavigation);
	customElements.define('en-breadcrumbs', EnBreadcrumbs);
	const root = document.getElementById('fixture');
	const options = { hidden: document.body.dataset.hidden === 'true', navigationHidden: document.body.dataset.navigationHidden === 'true' };
	if (document.body.dataset.render === 'client') {
		// Both elements consume authored native children. Ordinary client DOM
		// construction requires neither an item array nor a consumer Lit template.
		const navigation = document.createElement('en-navigation');
		navigation.id = 'section-navigation';
		navigation.label = 'Workspace sections';
		appendNavigationChildren(navigation, options);
		const breadcrumbs = document.createElement('en-breadcrumbs');
		breadcrumbs.id = 'breadcrumb-navigation';
		breadcrumbs.label = 'Project path';
		appendBreadcrumbChildren(breadcrumbs, options);
		root.append(navigation, breadcrumbs);
	} else {
		hydrate(fixtureTemplate(options), root);
	}
	window.settleNavigationFixture = async () => {
		for (let pass = 0; pass < 4; pass++) {
			await Promise.resolve();
			await Promise.all([...root.children].map(element => element.updateComplete));
		}
	};
	await window.settleNavigationFixture();
	document.documentElement.dataset.hydrated = 'true';
}
