// Must not statically import ssr-module or LitElement before hydration support.
import {createHydrationIsland, type HydrationManifest} from '@en-reve/ssr/client.js';
const manifest: HydrationManifest = JSON.parse(document.querySelector('#manifest')!.textContent!);
const host = document.getElementById(manifest.id)!;
const options = {root: host.shadowRoot ?? host, manifest, snapshot: {message: 'Initial'},
  loaders: {form: () => import('./ssr-module.js')}};
const island = createHydrationIsland(options);
declare global { interface Window { hydration: {island: typeof island; options: typeof options; duplicate(): void}; } }
window.hydration = {island, options, duplicate() { createHydrationIsland(options); }};
document.querySelector('#mode')!.textContent = island.mode === 'scoped' ? 'Native scoped registry' : 'Owner-document global registry';
document.querySelector('#hydrate')!.addEventListener('click', () => { void island.activate(); });
window.addEventListener('pagehide', event => { if (!event.persisted) island.dispose(); });
