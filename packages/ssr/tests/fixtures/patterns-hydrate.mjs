import '@lit-labs/ssr-client/lit-element-hydrate-support.js';
import {hydrate} from '@lit-labs/ssr-client';
import {registerAll} from '@en-reve/elements/catalog.js';
import {patternsTemplate} from './patterns-template.mjs';
export async function start(){registerAll();hydrate(patternsTemplate(),document.querySelector('#patterns-fixture'));await Promise.all([...document.querySelectorAll('#patterns-fixture *')].map(el=>el.updateComplete));document.documentElement.dataset.patternsHydrated='true';}
