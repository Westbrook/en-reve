import '@lit-labs/ssr-client/lit-element-hydrate-support.js';
import '@en-reve/elements/define/button.js';
import '@en-reve/elements/define/badge.js';
import '@en-reve/elements/define/select.js';
import '@en-reve/elements/define/segmented-control.js';
import '@en-reve/elements/define/navigation.js';
import type { WorkflowsApp } from './workflows-app.js';
import { attachThemePreview } from './theme-review/preview.js';

/** The selected class is explicit; URL state never chooses the initial template. */
export async function startWorkflowPage(App: { new(): WorkflowsApp }): Promise<void> {
	customElements.define('en-workflows-app', App);
	const app = document.querySelector<WorkflowsApp>('en-workflows-app');
	if (!app) return;
	await app.updateComplete;
	// Server HTML and the first client render use defaults. Review preferences
	// are validated and applied only once that initial hydration has completed.
	app.initializePreview(location.search);
	await app.updateComplete;
	app.followInitialAnchor();
	attachThemePreview(app);
}
