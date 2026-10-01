import * as recipes from './recipes.js';
// Test bridge retains exports through production tree shaking; no private imports.
declare global { interface Window { consumer: typeof recipes; } }
window.consumer = recipes;
const params = new URLSearchParams(location.search);
const {scope, root, activation} = recipes.mountOptional(document.querySelector<HTMLElement>('#optional')!, params.has('global'));
document.querySelector('#mode')!.textContent = scope.mode === 'scoped' ? 'Native scoped registry' : 'Owner-document global registry';
const trigger = document.querySelector<HTMLButtonElement>('#activate')!;
const status = document.querySelector<HTMLElement>('#status')!;
let intent = 0;
async function activate() {
  const current = ++intent;
  status.textContent = 'Loading optional details.';
  try {
    await activation.activate({retry: activation.state === 'error'});
    if (current === intent) status.textContent = 'Optional details ready.';
  } catch (error) {
    if (current === intent) status.textContent = error instanceof DOMException && error.name === 'AbortError'
      ? 'Optional details canceled.' : 'Optional details unavailable. Retry or use eager delivery.';
  }
}
function cancel() { intent++; activation.cancel(); status.textContent = 'Optional details canceled.'; }
trigger.addEventListener('click', activate);
document.querySelector('#cancel')!.addEventListener('click', cancel);
document.addEventListener('keydown', event => { if (event.key === 'Escape') cancel(); });
document.querySelector('form')!.addEventListener('reset', cancel);
document.addEventListener('focusin', event => { if (event.target !== trigger && !root.contains(event.target as Node) && activation.state === 'loading') cancel(); });
window.addEventListener('pagehide', event => {
  // A BFCache suspension retains this view; only terminal navigation disposes it.
  intent++;
  if (event.persisted) { activation.cancel(); status.textContent = 'Optional details available.'; }
  else activation.dispose();
});
if (params.has('eager')) void activate(); // Eager rollback for a fresh page; no undefined reversal.
