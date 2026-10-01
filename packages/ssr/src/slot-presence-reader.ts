import type { DefaultTreeAdapterMap } from 'parse5';

type TreeNode = DefaultTreeAdapterMap['node'];
type TreeElement = DefaultTreeAdapterMap['element'];
type TreeFragment = DefaultTreeAdapterMap['documentFragment'];
const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';

interface ShadowScope {
  readonly host: TreeElement;
  readonly template: TreeElement;
  readonly firstSlots: Map<string, TreeElement>;
  readonly assignmentKnown: boolean;
}

/**
 * Read the current components' assignedNodes({ flatten: true }) presence rule
 * from a parsed, complete response. Ordinary elements count even when empty or
 * hidden; only slots rooted in a recognized DSD tree forward other slottables.
 * An ordinary light-DOM slot is itself an element, just as in the browser.
 */
export function createSlotAssignmentReader(document: TreeFragment):
  (host: TreeElement, name: string, ownTemplate: TreeElement) => TreeNode[] {
  const scopes = new WeakMap<TreeNode, ShadowScope>();
  const roots = new WeakMap<TreeElement, TreeElement>();

  function index(node: TreeNode, scope?: ShadowScope): void {
    if (scope) scopes.set(node, scope);
    if (isSlot(node) && scope) {
      const name = attribute(node, 'name') ?? '';
      if (!scope.firstSlots.has(name)) scope.firstSlots.set(name, node);
    }
    if ('childNodes' in node) for (const child of node.childNodes) index(child, scope);
    if (!('content' in node)) return;
    const host = node.parentNode;
    const mode = attribute(node, 'shadowrootmode')?.toLowerCase();
    if (node.namespaceURI === HTML_NAMESPACE && node.tagName === 'template'
      && host && isElement(host) && (mode === 'open' || mode === 'closed') && !roots.has(host)) {
      roots.set(host, node);
      const assignment = attribute(node, 'shadowrootslotassignment');
      const next: ShadowScope = { host, template: node, firstSlots: new Map(),
        assignmentKnown: assignment === undefined || assignment === 'named' };
      index(node.content, next);
    } else {
      // Inert template contents are a separate document fragment, not members
      // of the containing shadow tree. Do not inherit its slot assignments.
      index(node.content);
    }
  }
  index(document);

  function flatten(node: TreeNode, visiting: Set<TreeElement>): TreeNode[] {
    if (node.nodeName === '#text') return [node];
    if (!isElement(node)) return [];
    if (!isSlot(node)) return [node];
    const scope = scopes.get(node);
    // Do not hide potentially visible content for an unknown projection mode.
    if (!scope || !scope.assignmentKnown || visiting.has(node)) return [node];
    visiting.add(node);
    const name = attribute(node, 'name') ?? '';
    const assigned = scope.firstSlots.get(name) === node
      ? scope.host.childNodes.filter(candidate => candidate !== scope.template && slottable(candidate)
        && (isElement(candidate) ? attribute(candidate, 'slot') ?? '' : '') === name)
      : [];
    const flattened = assigned.length ? assigned : node.childNodes.filter(slottable);
    const result = flattened.flatMap(candidate => flatten(candidate, visiting));
    visiting.delete(node);
    return result;
  }

  return (host, name, ownTemplate) => host.childNodes.filter(node => node !== ownTemplate
    && slottable(node) && (isElement(node) ? attribute(node, 'slot') ?? '' : '') === name).flatMap(node => flatten(node, new Set()));
}

/** Preserve optional-slot presence semantics while sharing named-slot resolution. */
export function createSlotPresenceReader(document:TreeFragment):(host:TreeElement,name:string,ownTemplate:TreeElement)=>boolean {
 const assigned=createSlotAssignmentReader(document);
 return (host,name,template)=>assigned(host,name,template).some(node=>isElement(node)||(node.nodeName==='#text'&&'value' in node&&Boolean(node.value.trim())));
}

function isElement(node: TreeNode): node is TreeElement { return 'tagName' in node; }
function isSlot(node: TreeNode): node is TreeElement {
  return isElement(node) && node.namespaceURI === HTML_NAMESPACE && node.tagName === 'slot';
}
function slottable(node: TreeNode): boolean { return isElement(node) || node.nodeName === '#text'; }
function attribute(node: TreeElement, name: string): string | undefined {
  return node.attrs.find(item => item.name === name && !item.namespace)?.value;
}
