import { html } from 'lit';
import { mediaViewerDefinition } from '@en-reve/elements/definitions/media-viewer.js';
import { collectDefinitions } from '@en-reve/primitives/interactions/registration.js';

export const version = 'media-viewer-delivery-v2';
export const definitions = [mediaViewerDefinition];
const key = 'media-viewer-delivery';
const rootId = 'media-viewer-delivery-fixture';
const svg = color => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="60"><rect width="80" height="60" fill="${color}"/></svg>`)}`;

export const mediaViewerDeliveryInitial = Object.freeze({
  activeKey: 'second',
  items: Object.freeze([
    Object.freeze({ key: 'first', src: svg('#315d84'), alt: 'First server image', caption: 'First server caption' }),
    Object.freeze({ key: 'second', src: svg('#865239'), alt: 'Second server image', caption: 'Second server caption' }),
  ]),
  viewers: Object.freeze([
    Object.freeze({ id: 'media-eager', label: 'Eager server media', open: false }),
    Object.freeze({ id: 'media-closed', label: 'Closed server media', open: false }),
    Object.freeze({ id: 'media-open', label: 'Open server media', open: true }),
  ]),
});

export const mediaViewerDeliveryManifest = Object.freeze({
  id: rootId, key, version,
  tags: Object.freeze(collectDefinitions(definitions).map(definition => definition.tagName)),
});

// The server and the containing hydration owner use this exact template and snapshot.
export function mediaViewerDeliveryTemplate(snapshot = mediaViewerDeliveryInitial) {
  return html`<section aria-label="Media delivery hydration">
    <p>Media remains available through the containing application's initial snapshot.</p>
    ${snapshot.viewers.map(viewer => html`<en-media-viewer id=${viewer.id} label=${viewer.label}
      ?open=${viewer.open}
      active-key=${snapshot.activeKey} .items=${snapshot.items}></en-media-viewer>`)}
  </section>`;
}
export const template = mediaViewerDeliveryTemplate;

// Descendants such as carousel slides and the close button live in shadow roots.
// Await each parent's update before discovering that parent's current descendants.
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

// Staged delivery of a fully buffered SSR result, not a streaming render API.
// The classic bootstrap is usable while the response is held; activation stays explicit.
export function mediaViewerDeliveryDocumentParts(markup) {
  return {
    prefix: `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Media delivery hydration</title></head><body><main id="${rootId}">${markup}</main><script id="media-viewer-delivery-data" type="application/json">${safeJson({ manifest: mediaViewerDeliveryManifest, snapshot: mediaViewerDeliveryInitial })}</script><script>window.prepareMediaViewerFixture = () => import('/packages/ssr/tests/fixtures/media-viewer-delivery-hydrate.mjs').then(module => module.start());</script>`,
    suffix: '<span id="media-viewer-stream-complete" hidden></span></body></html>',
  };
}
