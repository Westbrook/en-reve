import '@lit-labs/ssr-client/lit-element-hydrate-support.js';
import { hydrate } from '@lit-labs/ssr-client';
import { fixtureTemplate, registerFixture } from './fixture.mjs';

export async function start() {
	registerFixture();
	hydrate(fixtureTemplate(), document.querySelector('#fixture'));
	await Promise.all([...document.querySelectorAll('#fixture *')].map(element => element.updateComplete));
	// The segmented parent can schedule reconciliation after its hydration update.
	await Promise.all([...document.querySelectorAll('#fixture *')].map(element => element.updateComplete));
	document.documentElement.dataset.hydrated = 'true';
}
