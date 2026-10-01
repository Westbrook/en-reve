import {createElementScope, elementScopeCapabilities} from '@en-reve/elements/element-scope.js';
import {richTextEditorDefinition} from '@en-reve/elements/definitions/rich-text-editor.js';
import {editorToolbarDefinition} from '@en-reve/elements/definitions/editor-toolbar.js';
import type {EnRichTextEditor} from '@en-reve/elements/rich-text-editor.js';
import type {EnEditorToolbar} from '@en-reve/elements/editor-toolbar.js';

// Read-only correctness provenance, captured before any editor is connected.
// Classification describes observed source shape; it is not authentication.
const sourceShadowPrototype = ShadowRoot.prototype;
function getterDescriptor(target: object) {
  const descriptor = Object.getOwnPropertyDescriptor(target, 'getSelection');
  const fn = descriptor?.value ?? descriptor?.get;
  const source = typeof fn === 'function' ? Function.prototype.toString.call(fn) : '';
  return {present: Boolean(descriptor), data: Boolean(descriptor && 'value' in descriptor),
    configurable: descriptor?.configurable ?? null, enumerable: descriptor?.enumerable ?? null,
    writable: descriptor && 'writable' in descriptor ? descriptor.writable : null,
    hasGetter: typeof descriptor?.get === 'function', hasSetter: typeof descriptor?.set === 'function',
    functionName: typeof fn === 'function' ? fn.name.slice(0, 128) : null, functionSource: source.slice(0, 512), sourceLength: source.length, sourceTruncated: source.length > 512,
    sourceClassification: !descriptor ? 'missing' : /\[native code\]/.test(source) ? 'native-source-marker' :
      typeof fn === 'function' && fn.name === 'editorRootSelection' && /^function\s+editorRootSelection\b/.test(source) ? 'editor-root-selection-name-and-source-shape' :
      /=>\s*[\w$]+\.ownerDocument[!?]?\.getSelection\(\)/.test(source) ? 'pm-owner-document-fallback-shape' : 'other-script'};
}
const beforeAnyEditorDescriptor = Object.getOwnPropertyDescriptor(sourceShadowPrototype, 'getSelection');
const beforeAnyEditorGetter = getterDescriptor(sourceShadowPrototype);
const beforeAnyEditorFunction = (sourceShadowPrototype as any).getSelection;
const getterOrigins: {root: ShadowRoot; own: PropertyDescriptor | undefined; fn: unknown; snapshot: unknown; mounted?: unknown}[] = [];
function sameGetterDescriptor(a: PropertyDescriptor | undefined, b: PropertyDescriptor | undefined) {
  return (!a && !b) || Boolean(a && b && a.value === b.value && a.get === b.get && a.set === b.set &&
    a.writable === b.writable && a.configurable === b.configurable && a.enumerable === b.enumerable);
}
function getterSnapshot(root: ShadowRoot, index: number) {
  const origin = getterOrigins[index], own = Object.getOwnPropertyDescriptor(root, 'getSelection');
  const fn = (root as any).getSelection, currentPrototype = (root.ownerDocument.defaultView as any).ShadowRoot.prototype;
  const prototypes = []; let prototype = Object.getPrototypeOf(root);
  for (let depth = 1; prototype && depth <= 8; depth++, prototype = Object.getPrototypeOf(prototype)) {
    prototypes.push({depth, sourceShadowPrototype: prototype === sourceShadowPrototype,
      currentOwnerShadowPrototype: prototype === currentPrototype, descriptor: getterDescriptor(prototype)});
  }
  const sameDescriptor = sameGetterDescriptor(own, origin?.own);
  return {sourcePrototypeSameDescriptor: sameGetterDescriptor(Object.getOwnPropertyDescriptor(sourceShadowPrototype, 'getSelection'), beforeAnyEditorDescriptor),
    sourcePrototypeSameFunction: (sourceShadowPrototype as any).getSelection === beforeAnyEditorFunction,
    own: {...getterDescriptor(root), exactPinnedInstanceFunction: typeof origin?.mounted === 'function' && own?.value === origin.mounted}, prototypes, rootSameAsBefore: root === origin?.root,
    currentOwnerIsSourceDocument: root.ownerDocument === document, sameAsBeforeAnyEditorFunction: typeof fn === 'function' && fn === beforeAnyEditorFunction,
    sameAsPreMountFunction: typeof fn === 'function' && fn === origin?.fn,
    sameAsPinnedMountedFunction: typeof fn === 'function' && fn === origin?.mounted,
    pinnedMountedFunctionIsOwn: typeof origin?.mounted === 'function' && own?.value === origin.mounted,
    ownSameAsPreMountDescriptor: sameDescriptor, editingSurfacePresent: Boolean(root.querySelector('[contenteditable]'))};
}


// Diagnostic reads use the pre-mount callable, never the installed own adapter.
function selectionReaderEvidence(index: number) {
  const origin = getterOrigins[index], root = entries[index].editor.shadowRoot!, owner = root.ownerDocument;
  const live = root.querySelector('[contenteditable]'), text = live?.querySelector('p')?.firstChild;
  const describeNode = (node: Node | null) => {
    if (!node) return null;
    const ancestry = []; let current: Node | null = node;
    for (let depth = 0; current && depth < 8; depth++) {
      const parent: Node | null = current.parentNode;
      ancestry.push({nodeType: current.nodeType, nodeName: current.nodeName,
        childIndex: parent ? Array.prototype.indexOf.call(parent.childNodes, current) : null,
        isRoot: current === root, isHost: current === root.host, isCurrentDocument: current === owner});
      current = parent ?? (current.nodeType === 11 ? (current as ShadowRoot).host : null);
    }
    return {nodeType: node.nodeType, nodeName: node.nodeName, currentDocument: node.ownerDocument === owner || node === owner,
      sourceDocument: node.ownerDocument === document || node === document, ownedByRoot: root.contains(node), inLive: Boolean(live?.contains(node)),
      isLive: node === live, isText: node === text, isRoot: node === root, isHost: node === root.host, isHostParent: node === root.host.parentNode,
      ancestry, ancestryTruncated: Boolean(current)};
  };
  const inspect = (selection: Selection | null) => {
    if (!selection) return {present: false};
    const anchor = selection.anchorNode, focus = selection.focusNode;
    let comparison: number | null = null, comparisonError: string | null = null;
    if (anchor && focus && anchor !== focus) try {comparison = anchor.compareDocumentPosition(focus);} catch (error) {comparisonError = String(error);}
    return {present: true, rangeCount: selection.rangeCount, collapsed: selection.isCollapsed, direction: (selection as any).direction,
      text: selection.toString().slice(0, 256), anchor: describeNode(anchor), anchorOffset: selection.anchorOffset,
      focus: describeNode(focus), focusOffset: selection.focusOffset, sameAnchorFocusNode: anchor === focus,
      anchorComparedToFocus: comparison, comparisonError};
  };
  const read = (getter: () => Selection | null) => {try {return inspect(getter());} catch (error) {return {error: String(error)};}};
  return {currentOwnerIsSourceDocument: owner === document, rootSameAsBefore: root === origin.root,
    documentNative: read(() => owner.getSelection()), originalRootReader: {supported: typeof origin.fn === 'function',
      ...(typeof origin.fn === 'function' ? read(() => (origin.fn as (this: ShadowRoot) => Selection | null).call(root)) : {})}};
}

const params = new URLSearchParams(location.search);
const requested = params.has('global') ? 'global' : 'auto';
const boundary = params.get('boundary') ?? 'ordinary';
const scope = createElementScope({document, registry: requested});
scope.register([richTextEditorDefinition, editorToolbarDefinition]);
const entries: {root: Element | ShadowRoot; editor: EnRichTextEditor; toolbar: EnEditorToolbar; live?: Element | null}[] = [];
for (let i = 0; i < 2; i++) {
  const host = scope.createElement('section'); host.id = `pair-${i}`;
  document.querySelector('#editors')!.append(host);
  let root: Element | ShadowRoot = host;
  if (boundary !== 'ordinary') root = scope.attachShadow(host);
  if (boundary === 'nested') {
    const nested = scope.createElement('section'); root.append(nested); root = scope.attachShadow(nested);
  }
  const editor = scope.createElement('en-rich-text-editor'); editor.id = `editor-${i}`; editor.label = `Draft ${i}`; editor.value = 'Alpha beta gamma';
  const toolbar = scope.createElement('en-editor-toolbar'); toolbar.id = `toolbar-${i}`; toolbar.label = `Formatting ${i}`;
  toolbar.mode = 'contextual'; toolbar.commands = ['bold', 'italic', 'link', 'undo']; toolbar.editor = editor;
  root.append(editor, toolbar); entries.push({root, editor, toolbar});
  const editorRoot = editor.shadowRoot!;
  getterOrigins.push({root: editorRoot, own: Object.getOwnPropertyDescriptor(editorRoot, 'getSelection'),
    fn: (editorRoot as any).getSelection, snapshot: null});
  getterOrigins[i].snapshot = getterSnapshot(editorRoot, i);
}
function walk(root: Element | ShadowRoot): Element[] {
  const result = [...root.querySelectorAll('*')];
  for (const node of [...result]) if (node.shadowRoot) result.push(...walk(node.shadowRoot));
  return result;
}
function state() {
  return {requested, actual: scope.mode, nativeCapability: elementScopeCapabilities(document).native, boundary,
    globalLeak: scope.mode === 'scoped' && Boolean(customElements.get('en-editor-toolbar') || customElements.get('en-rich-text-editor')),
    entries: entries.map(({editor, toolbar, live}) => ({value: editor.value, selected: editor.hasSelection, composing: editor.composing,
      controls: toolbar.shadowRoot!.querySelectorAll('en-toolbar').length,
      links: toolbar.shadowRoot!.querySelectorAll('en-text-field').length,
      shown: toolbar.shadowRoot!.querySelector('[part~=base]')?.matches(':popover-open') ?? false,
      sameEditor: live === editor.shadowRoot!.querySelector('[contenteditable]'),
      ownedConstructors: walk(toolbar.shadowRoot!).filter(node => node.localName.startsWith('en-')).every(node => scope.get(node.localName) === node.constructor),
    }))};
}
const ready = Promise.all(entries.flatMap(({editor, toolbar}) => [editor.updateComplete, toolbar.updateComplete]));
(window as any).editorFixture = {scope, entries, ready, state,
  selectionReaderEvidence: (index = 0) => selectionReaderEvidence(index),
  selectionGetterEvidence: (index = 0) => ({beforeAnyEditor: beforeAnyEditorGetter, preMount: getterOrigins[index].snapshot,
    current: getterSnapshot(entries[index].editor.shadowRoot!, index)}),
  pinMountedSelectionGetter: (index = 0) => {getterOrigins[index].mounted = (entries[index].editor.shadowRoot as any).getSelection;},
  capture: () => {for (const entry of entries) entry.live = entry.editor.shadowRoot!.querySelector('[contenteditable]');},
  select: (index: number, backward = false) => {
    const editor = entries[index].editor; editor.focus();
    const control = editor.shadowRoot!.querySelector('[contenteditable]')!, text = control.querySelector('p')!.firstChild!;
    const length = text.textContent!.length;
    document.getSelection()!.setBaseAndExtent(text, backward ? length : 0, text, backward ? 0 : length);
  },
  reconnect: async (index: number) => {const {toolbar} = entries[index], parent = toolbar.parentNode!, next = toolbar.nextSibling; toolbar.remove(); parent.insertBefore(toolbar, next); await toolbar.updateComplete;},
  retarget: async (toolbarIndex: number, editorIndex: number) => {entries[toolbarIndex].toolbar.editor = entries[editorIndex].editor; await entries[toolbarIndex].toolbar.updateComplete;},
};
