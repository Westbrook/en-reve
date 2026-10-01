import '@lit-labs/ssr-client/lit-element-hydrate-support.js';
import { hydrate } from '@lit-labs/ssr-client';
import { registerAll } from '@en-reve/elements/catalog.js';
import { optionalSlotsTemplate } from './optional-slots-template.mjs';

export async function start() {
  registerAll();
  const fixture = document.querySelector('#optional-slots-fixture');
  hydrate(optionalSlotsTemplate(), fixture);
  // Include updates scheduled by firstUpdated and native slotchange delivery.
  for (let pass = 0; pass < 2; pass++) {
    await Promise.all([...fixture.querySelectorAll('*')].map(element => element.updateComplete));
    await new Promise(requestAnimationFrame);
  }
  document.documentElement.dataset.optionalSlotsHydrated = 'true';
}
