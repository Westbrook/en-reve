import { createHydrationIsland } from '@en-reve/ssr/client.js';

let fixture;
let directHydrationStarted = false;
export function start() {
  if (directHydrationStarted) throw new Error('Command palette fixture already has a direct hydration owner.');
  if (fixture) return fixture;
  const root = document.querySelector('#command-palette-content-fixture');
  const { manifest, snapshot } = JSON.parse(document.querySelector('#command-palette-content-data').textContent);
  let module;
  const load = () => module ??= import('./command-palette-content-template.mjs');
  const options = { root, manifest, snapshot, loaders: { [manifest.key]: load } };
  const island = createHydrationIsland(options);
  fixture = {
    root, island, snapshot,
    claimAgain: () => createHydrationIsland(options),
    async settle() {
      if (!module) throw new Error('Load the command palette fixture before awaiting its elements.');
      await (await module).ready(root);
    },
  };
  window.commandPaletteContentFixture = fixture;
  return fixture;
}


// This focused regression uses the documented direct Lit bootstrap as its only
// containing owner. createHydrationIsland intentionally rejects pre-upgraded
// boundaries; the separate island tests exercise that API without early define.
export async function hydrateWithEarlyIntent(method) {
  if (fixture || directHydrationStarted) throw new Error('Command palette fixture already has a hydration owner.');
  if (!['show', 'property', 'canceled', 'superseded', 'hide', 'closed-property'].includes(method)) throw new Error('Unknown early command palette intent.');
  directHydrationStarted = true;
  const [, { hydrate }] = await Promise.all([
    import('@lit-labs/ssr-client/lit-element-hydrate-support.js'),
    import('@lit-labs/ssr-client'),
  ]);
  const module = await import('./command-palette-content-template.mjs');
  const { registerDefinitions } = await import('@en-reve/primitives/interactions/registration.js');
  const root = document.querySelector('#command-palette-content-fixture');
  const { snapshot } = JSON.parse(document.querySelector('#command-palette-content-data').textContent);
  const closing = method === 'hide' || method === 'closed-property';
  const host = root.querySelector(closing ? '#palette-open' : '#palette-closed');
  if (host.matches(':defined')) throw new Error('Early intent requires an unregistered SSR child.');
  // Ordinary top-level SSR intentionally allows upgrades. This direct owner
  // explicitly holds the target before registration; its existing bound-node
  // marker releases defer-hydration during the same containing hydrate below.
  host.setAttribute('defer-hydration', '');
  registerDefinitions(customElements, module.definitions);
  if (host.hasUpdated || !host.hasAttribute('defer-hydration')) throw new Error('Early intent requires a registered, unhydrated SSR child.');
  // Keep the unrelated initially open instance from taking modal focus.
  if (!closing) root.querySelector('#palette-open').open = false;
  if (method === 'canceled') host.addEventListener('en-change', event => event.preventDefault(), { once: true });
  if (method === 'superseded') host.addEventListener('en-change', () => { host.open = false; }, { once: true });
  let outcome;
  if (method === 'property') host.open = true;
  else if (method === 'closed-property') host.open = false;
  else outcome = closing ? host.hide() : host.show();
  const beforeRelease = {
    defined: host.matches(':defined'), hasUpdated: host.hasUpdated,
    deferred: host.hasAttribute('defer-hydration'), open: host.open,
    inputPresent: Boolean(host.shadowRoot.querySelector('input')),
    nativeOpen: host.shadowRoot.querySelector('dialog').open,
    outcome: outcome ?? null,
  };
  const focusEvents = [];
  host.shadowRoot.querySelector('input').addEventListener('focus', event => {
    const input = event.target, active = input.getAttribute('aria-activedescendant');
    focusEvents.push({ expanded: input.getAttribute('aria-expanded'),
      activeAction: active ? host.shadowRoot.getElementById(active)?.dataset.action ?? null : null,
      nativeOpen: host.shadowRoot.querySelector('dialog').open });
  });
  hydrate(module.template(snapshot), root);
  // Claim the eager server body with its matching initial commands snapshot.
  await module.ready(root);
  // Observe the component's queued normal render before any catalog update can
  // incidentally change a cached ARIA expression.
  await host.updateComplete;
  const input = host.shadowRoot.querySelector('input');
  const active = input.getAttribute('aria-activedescendant');
  const afterInitialHydration = {
    open: host.open, expanded: input.getAttribute('aria-expanded'),
    activeAction: active ? host.shadowRoot.getElementById(active)?.dataset.action ?? null : null,
    nativeOpen: host.shadowRoot.querySelector('dialog').open,
    inputFocused: host.shadowRoot.activeElement === input,
  };
  const hydratedInitialActions = [...host.shadowRoot.querySelectorAll('[role="option"]')].map(option => option.dataset.action);
  // Later authoritative catalog changes reconcile the retained native editor.
  host.commands = [
    { action: 'current', label: 'Early current command' },
    { action: 'unavailable', label: 'Early unavailable command', disabled: true },
  ];
  await module.ready(root);
  let duplicate = '';
  try { start(); } catch (error) { duplicate = error.message; }
  return { beforeRelease, afterInitialHydration, focusEvents, hydratedInitialActions, duplicate };
}
