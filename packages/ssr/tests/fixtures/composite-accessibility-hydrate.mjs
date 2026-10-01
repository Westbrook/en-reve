import '@lit-labs/ssr-client/lit-element-hydrate-support.js';
import { hydrate } from '@lit-labs/ssr-client';
import { registerAll } from '@en-reve/elements/catalog.js';
import { compositeAccessibilityTemplate } from './composite-accessibility-template.mjs';
export async function start() {
  registerAll();
  hydrate(compositeAccessibilityTemplate(), document.querySelector('main'));
  await Promise.all([...document.querySelectorAll('en-color-slider,en-range-slider,en-date-picker')].map(element => element.updateComplete));
  document.documentElement.dataset.hydrated = 'true';
}
