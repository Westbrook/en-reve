import '@lit-labs/ssr-client/lit-element-hydrate-support.js';
import '@en-reve/elements/define/badge.js';
import '@en-reve/elements/define/button.js';
import '@en-reve/elements/define/checkbox.js';
import '@en-reve/elements/define/text-field.js';
import '@en-reve/elements/define/segmented-control.js';
import '@en-reve/elements/define/search-input.js';
import '@en-reve/elements/define/select.js';
import { APIReferenceApp } from './app.js';
customElements.define('en-api-reference-app', APIReferenceApp);

const app = document.querySelector<APIReferenceApp>('en-api-reference-app');
if (app) {
	// readLocation schedules the requested component after the deterministic SSR render.
	while (!(await app.updateComplete)) { /* Wait for that article to settle. */ }
	app.followInitialAnchor();
}
