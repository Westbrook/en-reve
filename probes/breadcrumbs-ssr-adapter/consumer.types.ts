import { LitElement, html } from 'lit';
import {
	createBreadcrumbsSsrAdapter,
	renderToString,
	type BreadcrumbsSsrPlan,
} from '@en-reve/ssr';

class TypedBreadcrumbConsumer extends LitElement {
	label = 'Project path';
	plan: BreadcrumbsSsrPlan = { version: 1, keys: [], hiddenKeys: [] };
}

// Check the emitted package declarations as a consumer: constructor inference
// must preserve both component properties and the capture callback's snapshot.
export async function renderTypedConsumer(): Promise<string> {
	const adapter = createBreadcrumbsSsrAdapter({
		tagName: 'en-typed-breadcrumbs',
		elementClass: TypedBreadcrumbConsumer,
		capture: element => ({ label: element.label }),
		prepare(element, keys, snapshot, visibility) {
			element.label = snapshot.label;
			element.plan = { version: 1, keys, hiddenKeys: visibility.hiddenKeys };
			// Captured metadata is read-only to cooperating renderers.
			// @ts-expect-error The adapter owns the key sequence.
			keys.push('consumer-key');
		},
	});
	return adapter.finalize(await renderToString(html`<p>Typed consumer</p>`, {
		elementRenderers: [adapter.Renderer],
	}));
}
