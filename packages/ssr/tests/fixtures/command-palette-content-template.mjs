import { html } from 'lit';
import { commandPaletteDefinition } from '@en-reve/elements/definitions/command-palette.js';
import { collectDefinitions } from '@en-reve/primitives/interactions/registration.js';

export const version = 'command-palette-content-v2';
export const definitions = [commandPaletteDefinition];
const key = 'command-palette-content';
const rootId = 'command-palette-content-fixture';

export const commandPaletteContentInitial = Object.freeze({
  commands: Object.freeze([
    Object.freeze({ action: 'save', label: 'Save project', keywords: Object.freeze(['write']), shortcut: 'Ctrl+S' }),
    Object.freeze({ action: 'publish', label: 'Publish project', disabled: true }),
    Object.freeze({ action: 'export', label: 'Export project' }),
    Object.freeze({ action: 'archive', label: 'Archive project' }),
  ]),
  palettes: Object.freeze([
    Object.freeze({ id: 'palette-eager', label: 'Eager project commands', open: false }),
    Object.freeze({ id: 'palette-closed', label: 'Closed project commands', open: false }),
    Object.freeze({ id: 'palette-open', label: 'Open project commands', open: true }),
    Object.freeze({ id: 'palette-unused', label: 'Unused project commands', open: false }),
  ]),
});

export const commandPaletteContentManifest = Object.freeze({
  id: rootId, key, version,
  tags: Object.freeze(collectDefinitions(definitions).map(definition => definition.tagName)),
});

// Both sides hydrate this exact initial template and eager catalog snapshot.
export function commandPaletteContentTemplate(snapshot = commandPaletteContentInitial) {
  return html`<section aria-label="Command palette content hydration">
    <button id="palette-opener" type="button">Page action</button>
    ${snapshot.palettes.map(palette => html`<en-command-palette id=${palette.id} label=${palette.label}
      search-label="Find project command"
      ?open=${palette.open} .commands=${snapshot.commands}>
      <p data-support=${palette.id}>Authored instructions for ${palette.label}.</p>
      <button type="button" slot="footer" data-footer=${palette.id}>Authored footer action</button>
    </en-command-palette>`)}
  </section>`;
}
export const template = commandPaletteContentTemplate;

// Discover generated descendants only after their parent has rendered them.
export async function ready(root, signal) {
  const check = () => { if (signal?.aborted) throw new DOMException('Fixture readiness canceled', 'AbortError'); };
  const visit = async node => {
    check();
    if (node.updateComplete) await node.updateComplete;
    check();
    if (node.shadowRoot) await visit(node.shadowRoot);
    for (const child of [...node.children ?? []]) await visit(child);
  };
  await visit(root);
}

const safeJson = value => JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');

// Staged delivery of buffered SSR, not a streaming renderer. The bootstrap can
// prepare the existing containing island before response completion.
export function commandPaletteContentDocumentParts(markup) {
  return {
    prefix: `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Command palette content hydration</title><link rel="stylesheet" href="/packages/tokens/dist/default.css"></head><body><main id="${rootId}">${markup}</main><script id="command-palette-content-data" type="application/json">${safeJson({ manifest: commandPaletteContentManifest, snapshot: commandPaletteContentInitial })}</script><script>window.prepareCommandPaletteContent = () => import('/packages/ssr/tests/fixtures/command-palette-content-hydrate.mjs').then(module => module.start()); window.hydrateCommandPaletteContent = () => window.prepareCommandPaletteContent().then(fixture => fixture.island.activate());</script>`,
    suffix: '<span id="command-palette-stream-complete" hidden></span></body></html>',
  };
}
