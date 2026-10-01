import '@lit-labs/ssr-client/lit-element-hydrate-support.js';
import { hydrate } from '@lit-labs/ssr-client';
import { requestTemplate } from './ssr-element.mjs';
export async function start(snapshot) {
  hydrate(requestTemplate(snapshot), document.querySelector('#rendered'));
  await document.querySelector('en-probe-ssr').updateComplete;
}
