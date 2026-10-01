import '@lit-labs/ssr-client/lit-element-hydrate-support.js';
import { hydrate } from '@lit-labs/ssr-client';
import '@en-reve/elements/define/checkbox.js';
import '@en-reve/elements/define/select.js';
import { fixtureTemplate } from './fixture.mjs';

export async function startIsland() {
 const container = document.querySelector('#component-island');
 let mode = 'accept';
 const checkbox = container.querySelector('#island-checkbox');
 const select = container.querySelector('#island-select');
 const events = [];
 checkbox.addEventListener('en-change', event => {
  events.push({type:event.type, previous:event.detail.previous, proposed:event.detail.proposed, observed:checkbox.checked, cancelable:event.cancelable});
  if (mode === 'reject') event.preventDefault();
  if (mode === 'supersede') {
   event.preventDefault();
   checkbox.checked = event.detail.proposed;
  }
  queueMicrotask(() => container.querySelector('#island-state').textContent = String(checkbox.checked));
 });
 window.fixture = {
  events, getMode:() => mode, setMode:value => { mode=value; },
  addOption() {
   if (select.querySelector('[value="pdf"]')) return;
   const option = document.createElement('en-select-option');
   option.value = 'pdf'; option.textContent = 'PDF'; select.append(option);
  },
  removeOption() { select.querySelector('[value="pdf"]')?.remove(); },
 };
 hydrate(fixtureTemplate(),container);
 await Promise.all([checkbox.updateComplete,select.updateComplete]);
}
