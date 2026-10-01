import '@lit-labs/ssr-client/lit-element-hydrate-support.js';
import '@en-reve/elements/define/rich-text-editor.js';
import '@en-reve/elements/define/token-editor.js';
import { hydrate } from '@lit-labs/ssr-client';
import { render } from 'lit';
import '@en-reve/elements/define/text-field.js';
import '@en-reve/elements/define/textarea.js';
import { initial, template, MinifierProbe } from './template.mjs';

customElements.define('en-minifier-probe', MinifierProbe);
const state = initial();
const root = document.querySelector('#minification-fixture');
const actions = {
  choose(id) { state.selected = id; render(template(state, actions), root); },
  advance() {
    state.items = [...state.items].reverse();
    state.quote = 'updated "quoted" & value';
    state.gap = 14;
    state.disabled = true;
    render(template(state, actions), root);
  },
};
hydrate(template(state, actions), root);
await Promise.all([...root.querySelectorAll('*')].map(element => element.updateComplete));
document.documentElement.dataset.hydrated = 'true';
root.querySelector('#source').addEventListener('toggle', async event => {
  if (!event.target.open) return;
  const { highlightAll } = await import('microlighter');
  await highlightAll({ root: event.target, selector: 'pre > code' });
  event.target.dataset.highlighted = 'true';
});
