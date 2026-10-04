import '@lit-labs/ssr-client/lit-element-hydrate-support.js';
import { hydrate } from '@lit-labs/ssr-client';
import { registerAll } from '@en-reve/elements/catalog.js';
import { invalidPartsTemplate } from './invalid-parts-template.mjs';

export async function start() {
  registerAll();
  hydrate(invalidPartsTemplate(), document.querySelector('#invalid-parts-fixture'));
  await Promise.all([...document.querySelectorAll('#invalid-parts-fixture *')].map(element => element.updateComplete));
  document.documentElement.dataset.hydrated = 'true';
}
