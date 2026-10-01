import '@lit-labs/ssr-client/lit-element-hydrate-support.js';
import { hydrate } from '@lit-labs/ssr-client';
import { registerAll } from '@en-reve/elements/catalog.js';
import { fixtureTemplate, initial } from './template.mjs';

export async function start() {
  registerAll();
  hydrate(fixtureTemplate(initial), document.querySelector('#fixture'));
  await Promise.all([...document.querySelectorAll('#fixture *')].map(element => element.updateComplete));
  document.documentElement.dataset.hydrated = 'true';
}
