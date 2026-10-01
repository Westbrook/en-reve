import {snapshotDeliveryIdentity} from './delivery-identity.js';
import { parseFragment } from 'parse5';
import type { DefaultTreeAdapterMap } from 'parse5';
import { validateHydrationManifest, type HydrationManifest } from './hydration-manifest.js';
import type { ScopedRenderResult } from './scoped.js';

/** Preserve Lit marker bytes; only add null-registry attributes to actual DSD templates. */
export function renderIslandMarkup(result: ScopedRenderResult, id: string, delivery: 'shadow' | 'global' | 'template' = 'shadow'): { html: string; manifest: HydrationManifest } {
  const manifest = { id, key: result.key, version: result.version, tags: [...result.tags], ...(result.delivery === undefined ? {} : {delivery: snapshotDeliveryIdentity(result.delivery)}) };
  validateHydrationManifest(manifest);
  if (delivery === 'template') return { manifest, html: `<section id="${id}"><template data-en-island-template>${result.html}</template></section>` };
  if (delivery === 'global') return { manifest, html: `<section id="${id}">${result.html}</section>` };
  const offsets: number[] = [];
  const visit = (node: DefaultTreeAdapterMap['node']) => {
    if ('tagName' in node && node.tagName === 'template' && node.attrs.some(a => a.name === 'shadowrootmode')
      && !node.attrs.some(a => a.name === 'shadowrootcustomelementregistry')) offsets.push(node.sourceCodeLocation!.startTag!.endOffset - 1);
    if ('childNodes' in node) node.childNodes.forEach(visit);
    if ('content' in node) visit(node.content as DefaultTreeAdapterMap['documentFragment']);
  };
  visit(parseFragment(result.html, { sourceCodeLocationInfo: true }));
  let html = result.html;
  for (const offset of offsets.sort((a, b) => b - a)) html = html.slice(0, offset) + ' shadowrootcustomelementregistry' + html.slice(offset);
  return { manifest, html: `<section id="${id}"><template shadowrootmode="open" shadowrootcustomelementregistry>${html}</template></section>` };
}
