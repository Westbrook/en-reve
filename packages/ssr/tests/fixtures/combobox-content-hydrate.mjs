import '@lit-labs/ssr-client/lit-element-hydrate-support.js';
import { hydrate } from '@lit-labs/ssr-client';
import { EnCombobox } from '@en-reve/elements/combobox.js';
import { comboboxContentTemplate } from './combobox-content-template.mjs';

export async function start() {
  customElements.define('en-combobox', EnCombobox);
  hydrate(comboboxContentTemplate(), document.querySelector('#combobox-content-fixture'));
  await Promise.all([...document.querySelectorAll('en-combobox')].map(element => element.updateComplete));
  document.documentElement.dataset.hydrated = 'true';
}
