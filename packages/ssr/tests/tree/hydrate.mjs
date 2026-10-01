import '@lit-labs/ssr-client/lit-element-hydrate-support.js';
import { hydrate } from '@lit-labs/ssr-client';
import { registerAll } from '@en-reve/elements/catalog.js';
import { treeTemplate } from './template.mjs';

export async function start(replay = true) {
  registerAll();
  if (replay) hydrate(treeTemplate(), document.getElementById('fixture'));
  for (let pass = 0; pass < 4; pass++) {
    await Promise.all([...document.querySelectorAll('en-tree, en-tree-item')].map(element => element.updateComplete));
    await new Promise(resolve => requestAnimationFrame(resolve));
  }
  document.documentElement.dataset.treeHydrated = 'true';
}
