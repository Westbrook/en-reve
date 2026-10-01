import { renderToString, createBreadcrumbsSsrAdapter } from '@en-reve/ssr';
import { EnBreadcrumbsProbe, registerProbeElements } from './component.mjs';
import { createFixtureState, fixtureTemplate } from './template.mjs';

// The caller installs the SSR DOM shim before importing this module. Both the
// development server and built SSR bundle use this exact request-local adapter.
registerProbeElements();
export async function renderFixture(caseName = 'default', hidden = false) {
	const state = createFixtureState({ case: caseName, hidden });
	const adapter = createBreadcrumbsSsrAdapter({
		tagName: 'en-breadcrumbs-probe', elementClass: EnBreadcrumbsProbe,
		capture: element => ({ label: element.label }),
		prepare: (element, keys, snapshot, context) => {
			element.setSSRPlan(keys, context.hiddenKeys);
			element.label = snapshot.label;
		},
	});
	const markup = await renderToString(fixtureTemplate(state), { elementRenderers: [adapter.Renderer] });
	return adapter.finalize(markup);
}
