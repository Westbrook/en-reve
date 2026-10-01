import { createHydrationIsland } from '@en-reve/ssr/client.js';

let fixture;
export function start() {
  if (fixture) return fixture;
  const root = document.querySelector('#media-viewer-delivery-fixture');
  const { manifest, snapshot } = JSON.parse(document.querySelector('#media-viewer-delivery-data').textContent);
  let module;
  const load = () => module ??= import('./media-viewer-delivery-template.mjs');
  const options = { root, manifest, snapshot, loaders: { [manifest.key]: load } };
  const island = createHydrationIsland(options);
  fixture = { root, island, snapshot,
    claimAgain: () => createHydrationIsland(options),
    async settle() {
      if (!module) throw new Error('Load the media fixture before awaiting its elements.');
      await (await module).ready(root);
    },
  };
  window.mediaViewerDeliveryFixture = fixture;
  return fixture;
}

// Exercise the documented synchronous register/owner-hydrate bootstrap with an
// intervening public request. Do not insert an await between those three actions.
export async function startEarly(mode) {
  if (fixture) throw new Error('Media fixture already has a bootstrap owner.');
  await import('@lit-labs/ssr-client/lit-element-hydrate-support.js');
  const [{ hydrate }, { registerDefinitions }, module] = await Promise.all([
    import('@lit-labs/ssr-client'),
    import('@en-reve/primitives/interactions/registration.js'),
    import('./media-viewer-delivery-template.mjs'),
  ]);
  const root = document.querySelector('#media-viewer-delivery-fixture');
  const { snapshot } = JSON.parse(document.querySelector('#media-viewer-delivery-data').textContent);
  registerDefinitions(customElements, module.definitions);
  const closed = root.querySelector('#media-closed');
  const opened = root.querySelector('#media-open');
  let outcome;
  if (mode === 'show') outcome = closed.show();
  else if (mode === 'property') closed.open = true;
  else if (mode === 'canceled') {
    closed.addEventListener('en-change', event => event.preventDefault(), { once: true });
    outcome = closed.show();
  } else if (mode === 'close-populated') opened.open = false;
  else throw new Error('Unknown early media bootstrap mode.');
  hydrate(module.template(snapshot), root);
  await module.ready(root);
  return { outcome, open: closed.open, originallyOpen: opened.open };
}
