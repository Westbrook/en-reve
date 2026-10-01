import '@lit-labs/ssr-client/lit-element-hydrate-support.js';
import { createAPIExampleApp } from './app.js';
import { exampleDefinitions } from '../generated/api-example-definitions.js';
import { API_EXAMPLE_VERSION } from './protocol.js';

// Keep embedded API previews focused on their specimen; standalone pages link back to the catalog.
if (window.parent === window) {
	const navigation = document.createElement('nav');
	navigation.className = 'api-example-navigation';
	navigation.setAttribute('aria-label', 'Example navigation');
	const link = document.createElement('a');
	link.href = new URLSearchParams(location.search).has('progress-report') ? '/api-examples?progress-report' : '/api-examples';
	link.textContent = 'All API examples';
	navigation.append(link);
	document.body.prepend(navigation);
}

const caseId = document.body.dataset.exampleId ?? '';
const documentId = crypto.randomUUID();
document.documentElement.dataset.enApiExampleDocument = documentId;
try {
	const define = exampleDefinitions[caseId];
	if (!define) throw new Error('This authored example is not available.');
	const source = caseId === 'virtual-collection' ? (await import('../generated/virtual-collection-source.js')).default
    : caseId === 'tooltip-warmup' ? (await import('../generated/tooltip-warmup-source.js')).default
    : caseId === 'tree-data' ? (await import('../generated/tree-data-source.js')).default
    : caseId === 'composable-chat' ? (await import('../generated/composable-chat-source.js')).default
    : caseId === 'rich-text' ? (await import('../generated/rich-text-source.js')).default
    : caseId === 'carousel' ? (await import('../generated/carousel-source.js')).default
    : caseId === 'presence-activity' ? (await import('../generated/presence-activity-source.js')).default
    : caseId === 'chat-patterns' ? (await import('../generated/chat-patterns-source.js')).default
    : caseId === 'toast' ? (await import('../generated/toast-source.js')).default
    : caseId === 'multi-step' ? (await import('../generated/multi-step-source.js')).default
    : caseId === 'calendar' ? (await import('../generated/calendar-source.js')).default : '';
	const App = createAPIExampleApp(caseId, source);
	customElements.define('en-api-example-app', App);
	const app = document.querySelector<InstanceType<typeof App>>('en-api-example-app');
	if (!app) throw new Error('The example document has no application host.');
	// Hydrate property bindings before asynchronous registration upgrades child hosts.
	// Lit retains those own properties when the custom elements are later defined.
	await app.updateComplete;
	// Review controls are outside the authored specimen's registration closure.
	// Load their definitions only when the standalone review surface is rendered.
	if (app.querySelector('.api-standalone-tools')) {
		await Promise.all([
			import('@en-reve/elements/define/button.js'),
			import('@en-reve/elements/define/select.js'),
		]);
	}
	await define();
	await Promise.all([...app.querySelectorAll<HTMLElement & { updateComplete?: Promise<unknown> }>('*')].map(element => element.updateComplete));
	app.activate();
} catch (error) {
	const message = 'The interactive example could not load. Reload the example to try again.';
	const feedback = document.createElement('p'); feedback.setAttribute('role', 'status'); feedback.textContent = message;
	document.body.append(feedback);
	if (parent !== window) parent.postMessage({ type: 'en-api-example-error', version: API_EXAMPLE_VERSION, caseId, documentId, message }, location.origin);
	console.error('API example startup failed', error);
}
