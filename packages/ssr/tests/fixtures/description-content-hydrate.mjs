import '@lit-labs/ssr-client/lit-element-hydrate-support.js';
import { hydrate } from '@lit-labs/ssr-client';
import { registerAll } from '@en-reve/elements/catalog.js';
import { descriptionContentTemplate } from './description-content-template.mjs';
export async function start() {
  registerAll();
  hydrate(descriptionContentTemplate(), document.querySelector('#description-content-fixture'));
  await Promise.all([...document.querySelectorAll('#description-content-fixture *')].map(element => element.updateComplete));
  document.documentElement.dataset.hydrated = 'true';
}
