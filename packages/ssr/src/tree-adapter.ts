import { EnElementRenderer } from './en-element-renderer.js';
import type { ElementRendererConstructor } from '@lit-labs/ssr/lib/element-renderer.js';
import { collectResult } from '@lit-labs/ssr/lib/render-result.js';
import type { ThunkedRenderResult } from '@lit-labs/ssr/lib/render-result.js';
import type { RenderInfo } from '@lit-labs/ssr/lib/render.js';
import { parseFragment } from 'parse5';
import type { DefaultTreeAdapterMap } from 'parse5';
import { EnTree } from '@en-reve/elements/tree.js';
import { EnTreeItem } from '@en-reve/elements/tree-item.js';
import {
  TREE_PRESENTATION_ATTRIBUTE, TREE_SNAPSHOT_ATTRIBUTE, prepareTreeItemPresentation, deriveTreePresentations,
  emptyTreeItemPresentation,
  TREE_DATA_ATTRIBUTE, normalizeTreeData,
} from '@en-reve/primitives/interactions/tree.js';
import type { TreeItemPresentation, TreeSnapshot, TreeSource, TreeDataItem } from '@en-reve/primitives/interactions/tree.js';
import { isSelectionLabelInteractive } from '@en-reve/primitives/interactions/selection-children.js';

const MARKER_PREFIX = 'en-tree-ssr:';
const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
type TreeNode = DefaultTreeAdapterMap['node'];
type TreeElement = DefaultTreeAdapterMap['element'];
type Capture = Readonly<Record<string, unknown>>;
type Edit = { start: number; end: number; replacement: string };
type Boundary = {
  marker: string;
  tagName: 'en-tree';
  snapshot: TreeSnapshot;
  data?: readonly TreeDataItem[];
} | {
  marker: string;
  tagName: 'en-tree-item';
  snapshot: Capture;
  render(presentation: TreeItemPresentation): Promise<string>;
};
type Match = { host: TreeElement; template: TreeElement; marker: TreeNode; record: Boundary };

/** Request-local structural preparation; authored items remain ordinary named-slot children. */
export function createTreeSsrAdapter(): {
  readonly Renderer: ElementRendererConstructor;
  finalize(markup: string): Promise<string>;
} {
  const records = new Map<string, Boundary>();
  let nonce: string | undefined;
  let phase: 'rendering' | 'finalizing' | 'finished' = 'rendering';
  const requireRendering = (): void => {
    if (phase !== 'rendering') throw new Error('Tree SSR is single-use; create a new adapter per response.');
  };
  class TreeRenderer extends EnElementRenderer {
    static override matchesClass(ctor: typeof HTMLElement, tagName?: string): boolean {
      return (ctor === EnTree && tagName === 'en-tree') || (ctor === EnTreeItem && tagName === 'en-tree-item');
    }
    // Lit SSR normally bypasses element overrides. Preserve canonical/legacy
    // attribute precedence through the same callback used during hydration.
    override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
      this.element.attributeChangedCallback(name, old, value);
    }
    override renderShadow(info: RenderInfo): ThunkedRenderResult | undefined {
      requireRendering();
      nonce ??= globalThis.crypto.randomUUID();
      const marker = `${MARKER_PREFIX}${nonce}:${records.size}`;
      if (this.element instanceof EnTree) {
        const element = this.element;
        const rendered = super.renderShadow(info);
        if (rendered === undefined) return undefined;
        records.set(marker, { marker, tagName: 'en-tree', snapshot: Object.freeze({
          value: element.value, expanded: Object.freeze([...element.expanded]),
          ...(element.reorderable ? { reorderable: true } : {}),
          ...(element.multiple ? { values: Object.freeze([...element.values]) } : {}),
        }), data: element.items === undefined ? undefined : normalizeTreeData(element.items) });
        return [`<!--${marker}-->`, ...rendered];
      }
      const element = this.element as EnTreeItem;
      const snapshot = Object.freeze(Object.fromEntries(['value', 'label', 'disabled', 'branch', 'size'].map(name => [name, Reflect.get(element, name)])));
      const context = copyContext(info);
      records.set(marker, { marker, tagName: 'en-tree-item', snapshot, render: async presentation => {
        for (const [name, value] of Object.entries(snapshot)) {
          if (!Object.is(Reflect.get(element, name), value)) Reflect.set(element, name, value);
        }
        prepareTreeItemPresentation(element, presentation);
        const rendered = super.renderShadow(copyContext(context));
        if (rendered === undefined) throw new Error('Tree SSR cannot finalize an item with SSR disabled.');
        return collectResult(rendered);
      } });
      return [`<!--${marker}-->`];
    }
  }
  return {
    Renderer: TreeRenderer,
    async finalize(markup): Promise<string> {
      requireRendering(); phase = 'finalizing';
      try {
        if (!records.size) return markup;
        const document = parseFragment(markup, { sourceCodeLocationInfo: true });
        const matches: Match[] = [];
        walk(document, node => {
          if (!isElement(node) || node.namespaceURI !== HTML_NAMESPACE || !['en-tree', 'en-tree-item'].includes(node.tagName)) return;
          for (const child of node.childNodes) {
            if (!isElement(child) || child.tagName !== 'template' || !('content' in child)) continue;
            const marker = child.content.childNodes[0];
            if (!marker || marker.nodeName !== '#comment' || !('data' in marker) || !marker.data.startsWith(MARKER_PREFIX)) continue;
            const record = records.get(marker.data);
            if (!record || record.tagName !== node.tagName) throw new Error('Tree SSR marker is repeated or belongs to another response.');
            if (attribute(child, 'shadowrootmode') !== 'open') throw new Error('Tree SSR requires its original open DSD root.');
            if (record.tagName === 'en-tree-item' && child.content.childNodes.length !== 1) throw new Error('Tree SSR requires its original item placeholder.');
            for (const name of [TREE_PRESENTATION_ATTRIBUTE, TREE_SNAPSHOT_ATTRIBUTE, TREE_DATA_ATTRIBUTE]) {
              if (attribute(node, name) !== undefined) throw new Error(`Tree SSR reserves ${name}; omit authored metadata.`);
            }
            records.delete(marker.data);
            matches.push({ host: node, template: child, marker, record });
          }
        });
        if (records.size) throw new Error('Tree SSR output is incomplete or belongs to another response.');
        const edits: Edit[] = [];
        const presentations = derivePresentations(matches);
        for (const match of matches) {
          const { record, marker, host, template } = match;
          if (record.tagName === 'en-tree') {
            const location = marker.sourceCodeLocation;
            if (!location) throw new Error('Tree SSR requires the original marker location.');
            edits.push({ start: location.startOffset, end: location.endOffset, replacement: '' });
            edits.push(insertAttribute(markup, host, TREE_SNAPSHOT_ATTRIBUTE, JSON.stringify(record.snapshot)));
            if (record.data !== undefined) edits.push(insertAttribute(markup, host, TREE_DATA_ATTRIBUTE, JSON.stringify(record.data)));
            continue;
          }
          const presentation = presentations.get(host)!;
          const location = template.sourceCodeLocation;
          if (!location?.startTag || !location.endTag) throw new Error('Tree SSR requires a complete item DSD template.');
          edits.push(insertAttribute(markup, host, TREE_PRESENTATION_ATTRIBUTE, JSON.stringify(presentation)));
          edits.push({ start: location.startTag.endOffset, end: location.endTag.startOffset, replacement: await record.render(presentation) });
        }
        return applyEdits(markup, edits);
      } finally { phase = 'finished'; records.clear(); }
    },
  };
}

function derivePresentations(matches: readonly Match[]): Map<TreeElement, TreeItemPresentation> {
  const byHost = new Map(matches.map(match => [match.host, match]));
  const presentations = new Map<TreeElement, TreeItemPresentation>();
  for (const root of matches) {
    if (root.record.tagName !== 'en-tree') continue;
    if (root.record.data !== undefined) {
      if (sourceChildren(root, '').length) throw new TypeError('Tree data mode does not accept authored en-tree-item children.');
      continue;
    }
    const hostsByValue = new Map<string, TreeElement>();
    const source = (host: TreeElement): TreeSource => {
      const match = byHost.get(host);
      if (!match || match.record.tagName !== 'en-tree-item') throw new Error('Tree SSR requires the library renderer for owned en-tree-item children.');
      if (['selected', 'expanded', 'checked'].some(name => attribute(host, name) !== undefined)) {
        throw new TypeError('Tree items do not own selected or expanded state; set the parent value and expanded properties instead.');
      }
      if (attribute(host, 'hidden')?.toLowerCase() === 'until-found') throw new TypeError('Tree items do not support hidden=until-found.');
      for (const child of host.childNodes) {
        if (isElement(child) && ['label', 'prefix', 'suffix'].includes(attribute(child, 'slot') ?? '') && containsInteractive(child)) {
          throw new TypeError('Tree labels, prefixes and suffixes must contain noninteractive content.');
        }
      }
      const value = match.record.snapshot.value as string;
      hostsByValue.set(value, host);
      return { value, disabled: Boolean(match.record.snapshot.disabled), branch: Boolean(match.record.snapshot.branch),
        hidden: attribute(host, 'hidden') !== undefined || attribute(host, 'inert') !== undefined || attribute(host, 'aria-hidden')?.toLowerCase() === 'true',
        children: sourceChildren(match, 'children').map(source),
      };
    };
    const sources = sourceChildren(root, '').map(source);
    const plan = deriveTreePresentations(sources, root.record.snapshot);
    for (const item of plan.items) presentations.set(hostsByValue.get(item.value)!, item.presentation);
  }
  for (const match of matches) {
    if (match.record.tagName === 'en-tree-item' && !presentations.has(match.host)) {
      presentations.set(match.host, emptyTreeItemPresentation);
    }
  }
  return presentations;
}

/** Match the runtime's finite direct-item boundary; do not guess composed ownership. */
function sourceChildren(match: Match, name: '' | 'children'): TreeElement[] {
  const result: TreeElement[] = [];
  for (const child of match.host.childNodes) {
    if (child === match.template) continue;
    if (child.nodeName === '#text' && 'value' in child) {
      if (!name && child.value.trim()) throw new TypeError('Tree default content must be direct en-tree-item children.');
      continue;
    }
    if (!isElement(child)) continue;
    if (child.namespaceURI === HTML_NAMESPACE && child.tagName === 'template') continue;
    const slot = attribute(child, 'slot') ?? '';
    if (slot !== name) {
      if (child.tagName === 'en-tree-item') throw new TypeError(`Tree items require slot="${name}" at this boundary.`);
      continue;
    }
    if (child.namespaceURI !== HTML_NAMESPACE || child.tagName !== 'en-tree-item') {
      if (child.tagName === 'slot') throw new TypeError('Tree SSR does not support forwarded structural slots; author direct en-tree-item children.');
      throw new TypeError('Tree structural slots accept direct en-tree-item children only.');
    }
    result.push(child);
  }
  return result;
}

/** Only authored light DOM participates, matching the runtime label validator. */
function containsInteractive(node: TreeElement): boolean {
  return isSelectionLabelInteractive(node.tagName, Object.fromEntries(node.attrs.filter(attr => !attr.namespace).map(attr => [attr.name, attr.value])))
    || ['en-button', 'en-link', 'en-text-field', 'en-checkbox', 'en-switch', 'en-select', 'en-menu', 'en-tree'].includes(node.tagName)
    || node.childNodes.some(child => isElement(child) && containsInteractive(child));
}

function copyContext(info: RenderInfo): RenderInfo {
  return { ...info, elementRenderers: [...info.elementRenderers], customElementInstanceStack: [...info.customElementInstanceStack],
    customElementHostStack: [...info.customElementHostStack], eventTargetStack: [...info.eventTargetStack], slotStack: [...info.slotStack] };
}
function isElement(node: TreeNode): node is TreeElement { return 'tagName' in node; }
function attribute(node: TreeElement, name: string): string | undefined { return node.attrs.find(item => item.name === name && !item.namespace)?.value; }
function walk(node: TreeNode, visit: (node: TreeNode) => void): void {
  visit(node);
  if ('childNodes' in node) for (const child of node.childNodes) walk(child, visit);
  if ('content' in node) walk(node.content, visit);
}
function insertAttribute(markup: string, node: TreeElement, name: string, value: string): Edit {
  const tag = node.sourceCodeLocation?.startTag;
  if (!tag || markup[tag.endOffset - 1] !== '>') throw new Error('Tree SSR requires explicit source start tags.');
  const start = tag.startOffset + 1 + node.tagName.length;
  const escaped = value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
  return { start, end: start, replacement: ` ${name}="${escaped}"` };
}
function applyEdits(markup: string, edits: Edit[]): string {
  edits.sort((left, right) => right.start - left.start);
  let boundary = markup.length;
  let result = '';
  for (const edit of edits) {
    if (edit.start < 0 || edit.end < edit.start || edit.end > boundary) throw new Error('Tree SSR source edits overlap.');
    result = edit.replacement + markup.slice(edit.end, boundary) + result;
    boundary = edit.start;
  }
  return markup.slice(0, boundary) + result;
}
