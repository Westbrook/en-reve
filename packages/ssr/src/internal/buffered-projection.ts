import type {RenderInfo} from '@lit-labs/ssr/lib/render.js';
import type {DefaultTreeAdapterMap} from 'parse5';

export type TreeNode = DefaultTreeAdapterMap['node'];
export type TreeElement = DefaultTreeAdapterMap['element'];
export type Edit = {start: number; end: number; replacement: string};

export function restore(element: object, snapshot: Readonly<Record<string, unknown>>): void {
  for (const [name, value] of Object.entries(snapshot)) if (!Object.is(Reflect.get(element, name), value)) Reflect.set(element, name, value);
}
export function copyContext(info: RenderInfo): RenderInfo {
  return {...info, elementRenderers: [...info.elementRenderers], customElementInstanceStack: [...info.customElementInstanceStack],
    customElementHostStack: [...info.customElementHostStack], eventTargetStack: [...info.eventTargetStack], slotStack: [...info.slotStack]};
}
export function isElement(node: TreeNode): node is TreeElement { return 'tagName' in node; }
export function attribute(node: TreeElement, name: string): string | undefined { return node.attrs.find(attr => attr.name === name && !attr.namespace)?.value; }
export function walk(node: TreeNode, visit: (node: TreeNode) => void): void {
  visit(node);
  if ('childNodes' in node) for (const child of node.childNodes) walk(child, visit);
  if ('content' in node) walk(node.content, visit);
}
export function textContent(node: TreeNode): string {
  if (node.nodeName === '#text' && 'value' in node) return node.value;
  // HTML template contents are not textContent, including the child's own DSD.
  return 'childNodes' in node ? node.childNodes.map(textContent).join('') : '';
}

/** Byte-preserving buffered edits. Each adapter retains its own validation and slot policy. */
export function projectionEdits(label: string) {
  function insertAttribute(markup: string, element: TreeElement, name: string, value: string): Edit {
    const tag = element.sourceCodeLocation?.startTag;
    if (!tag || markup[tag.endOffset - 1] !== '>') throw new Error(`${label} requires an explicit authored start tag.`);
    const start = tag.startOffset + 1 + element.tagName.length;
    const escaped = value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
    return {start, end: start, replacement: ` ${name}="${escaped}"`};
  }
  function applyEdits(markup: string, edits: Edit[]): string {
    edits.sort((left, right) => right.start - left.start);
    let boundary = markup.length; let result = '';
    for (const edit of edits) {
      if (edit.start < 0 || edit.end < edit.start || edit.end > boundary) throw new Error(`${label} edits overlap; this structure is unsupported.`);
      result = edit.replacement + markup.slice(edit.end, boundary) + result; boundary = edit.start;
    }
    return markup.slice(0, boundary) + result;
  }
  return {insertAttribute, applyEdits};
}
