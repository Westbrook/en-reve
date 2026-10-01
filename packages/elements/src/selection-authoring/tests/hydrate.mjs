import '@lit-labs/ssr-client/lit-element-hydrate-support.js';
import { hydrate } from '@lit-labs/ssr-client';
import { registerAll } from '@en-reve/elements/catalog.js';
import { selectionTemplate, unselectedTemplate } from './fixture.mjs';

export async function start() {
  registerAll();
  const template = document.documentElement.dataset.unselected === 'true' ? unselectedTemplate()
    : selectionTemplate(document.documentElement.dataset.propertyBound === 'true');
  hydrate(template, document.getElementById('fixture'));
  await Promise.all([...document.querySelectorAll('#fixture *')].map(element => element.updateComplete));
  // Complete an update requested by initial descriptor observation or adoption.
  await Promise.all([...document.querySelectorAll('#fixture *')].map(element => element.updateComplete));
  const form = document.getElementById('selection-form');
  form.addEventListener('submit', event => {
    event.preventDefault();
    window.selectionSubmissions.push(Array.from(new FormData(form)));
  });
  document.documentElement.dataset.hydrated = 'true';
}
