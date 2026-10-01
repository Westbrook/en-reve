import { EnElementRenderer } from './en-element-renderer.js';
import type { ElementRendererConstructor } from '@lit-labs/ssr/lib/element-renderer.js';
import type { ThunkedRenderResult } from '@lit-labs/ssr/lib/render-result.js';
import type { RenderInfo } from '@lit-labs/ssr/lib/render.js';
import { parseFragment } from 'parse5';
import type { DefaultTreeAdapterMap } from 'parse5';
import { EnCard } from '@en-reve/elements/card.js';
import { EnChatComposer } from '@en-reve/elements/chat-composer.js';
import { EnAlert } from '@en-reve/elements/alert.js';
import { OPTIONAL_SLOT_PRESENCE_ATTRIBUTE } from '@en-reve/primitives/interactions/optional-slot-presence.js';
import type { OptionalSlotPresence } from '@en-reve/primitives/interactions/optional-slot-presence.js';
import { createSlotPresenceReader } from './slot-presence-reader.js';

const MARKER_PREFIX = 'en-optional-slots-ssr:';
const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
type TreeNode = DefaultTreeAdapterMap['node'];
type TreeElement = DefaultTreeAdapterMap['element'];
type Edit = { start: number; end: number; replacement: string };
type Boundary = { tagName: string; names: readonly string[]; fallback?: boolean };

/**
 * Annotate the complete response once, after the other library finalizers.
 * The canonical shadow template runs exactly once. Only its boolean visibility
 * attributes change; the matching baseline is carried to the first hydrate render.
 */
export function createOptionalSlotsSsrAdapter(): {
  readonly Renderer: ElementRendererConstructor;
  finalize(markup: string): string;
} {
  const records = new Map<string, Boundary>();
  let nonce: string | undefined;
  let finished = false;
  class OptionalSlotsRenderer extends EnElementRenderer {
    static override matchesClass(ctor: typeof HTMLElement, tagName?: string): boolean {
      return (ctor === EnCard && tagName === 'en-card') || (ctor === EnAlert && tagName === 'en-alert') || (ctor === EnChatComposer && tagName === 'en-chat-composer');
    }
    override renderShadow(info: RenderInfo): ThunkedRenderResult | undefined {
      if (finished) throw new Error('Optional-slot SSR is single-use; create a new adapter per response.');
      const rendered = super.renderShadow(info);
      if (rendered === undefined) return undefined;
      nonce ??= globalThis.crypto.randomUUID();
      const marker = `${MARKER_PREFIX}${nonce}:${records.size}`;
      const card = this.element instanceof EnCard;
      const composer = this.element instanceof EnChatComposer;
      records.set(marker, composer ? {tagName:'en-chat-composer',names:['send'],fallback:true} : { tagName: card ? 'en-card' : 'en-alert', names: card ? ['header', 'footer'] : ['icon'] });
      return [`<!--${marker}-->`, ...rendered];
    }
  }
  return {
    Renderer: OptionalSlotsRenderer,
    finalize(markup): string {
      if (finished) throw new Error('Optional-slot SSR is single-use; create a new adapter per response.');
      finished = true;
      try {
        if (!records.size) return markup;
        const document = parseFragment(markup, { sourceCodeLocationInfo: true });
        const hasSlot = createSlotPresenceReader(document);
        const edits: Edit[] = [];
        walk(document, node => {
          if (!isElement(node) || node.namespaceURI !== HTML_NAMESPACE || !['en-card', 'en-alert', 'en-chat-composer'].includes(node.tagName)) return;
          for (const child of node.childNodes) {
            if (!isElement(child) || child.tagName !== 'template' || !('content' in child)) continue;
            const marker = child.content.childNodes[0];
            if (!marker || marker.nodeName !== '#comment' || !('data' in marker) || !marker.data.startsWith(MARKER_PREFIX)) continue;
            const record = records.get(marker.data);
            if (!record || record.tagName !== node.tagName) throw new Error('Optional-slot SSR marker is repeated or belongs to another response.');
            records.delete(marker.data);
            if (attribute(child, 'shadowrootmode') !== 'open') throw new Error('Optional-slot SSR requires its original open DSD root.');
            if (attribute(node, OPTIONAL_SLOT_PRESENCE_ATTRIBUTE) !== undefined) throw new Error(`Optional-slot SSR reserves ${OPTIONAL_SLOT_PRESENCE_ATTRIBUTE}; omit authored metadata.`);

            const slots = Object.fromEntries(record.names.map(name => [name, hasSlot(node, name, child)]));
            const plan: OptionalSlotPresence = { version: 1, slots };
            edits.push(insertAttribute(markup, node, OPTIONAL_SLOT_PRESENCE_ATTRIBUTE, JSON.stringify(plan)));
            const location = marker.sourceCodeLocation;
            if (!location) throw new Error('Optional-slot SSR requires the original marker location.');
            edits.push({ start: location.startOffset, end: location.endOffset, replacement: '' });
            for (const name of record.names) {
              const named: TreeElement[] = [];
              // Do not enter nested template contents: those are another tree.
              walkLight(child.content, candidate => {
                if (isElement(candidate) && candidate.namespaceURI === HTML_NAMESPACE
                  && candidate.tagName === 'slot' && attribute(candidate, 'name') === name) named.push(candidate);
              });
              const region = named[0]?.parentNode;
              if (named.length !== 1 || !region || !isElement(region)
                || !(attribute(region, 'part') ?? '').split(/[\t\n\f\r ]+/).includes(name)) {
                throw new Error('Optional-slot SSR requires the canonical named slot and region.');
              }
              const target = record.fallback ? named[0]!.childNodes.find(candidate => isElement(candidate) && attribute(candidate, 'data-en-slot-fallback') !== undefined) as TreeElement | undefined : region;
              if (!target) throw new Error('Optional-slot SSR requires its fallback control.');
              const visible = record.fallback ? !slots[name] : slots[name];
              const previous = target.sourceCodeLocation?.attrs?.hidden;
              if (visible && previous) edits.push({ start: previous.startOffset, end: previous.endOffset, replacement: '' });
              if (!visible && !previous) edits.push(insertAttribute(markup, target, 'hidden', ''));
            }
          }
        });
        if (records.size) throw new Error('Optional-slot SSR output is incomplete or belongs to another response.');
        return applyEdits(markup, edits);
      } finally { records.clear(); }
    },
  };
}

function isElement(node: TreeNode): node is TreeElement { return 'tagName' in node; }
function attribute(node: TreeElement, name: string): string | undefined { return node.attrs.find(item => item.name === name && !item.namespace)?.value; }
function walkLight(node: TreeNode, visit: (node: TreeNode) => void): void {
  visit(node);
  if ('childNodes' in node) for (const child of node.childNodes) walkLight(child, visit);
}
function walk(node: TreeNode, visit: (node: TreeNode) => void): void {
  visit(node);
  if ('childNodes' in node) for (const child of node.childNodes) walk(child, visit);
  if ('content' in node) walk(node.content, visit);
}
function insertAttribute(markup: string, node: TreeElement, name: string, value: string): Edit {
  const tag = node.sourceCodeLocation?.startTag;
  if (!tag || markup[tag.endOffset - 1] !== '>') throw new Error('Optional-slot SSR requires explicit source start tags.');
  const start = tag.startOffset + 1 + node.tagName.length;
  const escaped = value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
  return { start, end: start, replacement: ` ${name}="${escaped}"` };
}
function applyEdits(markup: string, edits: Edit[]): string {
  edits.sort((left, right) => right.start - left.start);
  let boundary = markup.length;
  let result = '';
  for (const edit of edits) {
    if (edit.start < 0 || edit.end < edit.start || edit.end > boundary) throw new Error('Optional-slot SSR source edits overlap.');
    result = edit.replacement + markup.slice(edit.end, boundary) + result;
    boundary = edit.start;
  }
  return markup.slice(0, boundary) + result;
}
