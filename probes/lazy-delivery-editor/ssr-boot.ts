import {createElementScope, elementScopeCapabilities} from '@en-reve/elements/element-scope.js';
import {createHydrationIsland, type HydrationManifest} from '@en-reve/ssr/client.js';
import type {EnRichTextEditor} from '@en-reve/elements/rich-text-editor.js';
import type {EnEditorToolbar} from '@en-reve/elements/editor-toolbar.js';

const manifests: HydrationManifest[] = JSON.parse(document.querySelector('#ssr-manifests')!.textContent!);
const mode = document.body.dataset.deliveryMode!;
const presence = document.body.dataset.toolbarPresence! as 'present' | 'absent';
const text = 'Alpha beta gamma';
const scopes = manifests.map(() => createElementScope({document, registry: mode === 'global' ? 'global' : 'auto'}));
const roots = manifests.map(manifest => { const host = document.getElementById(manifest.id)!; return host.shadowRoot ?? host; });
const editor = roots[0].querySelector<EnRichTextEditor>('en-rich-text-editor')!;
const toolbar = roots[1]?.querySelector<EnEditorToolbar>('en-editor-toolbar');
const ssrControl = editor.shadowRoot!.querySelector('[part~="control"]')!;
const initial = {
  readonly: ssrControl.getAttribute('aria-readonly'),
  contenteditable: ssrControl.getAttribute('contenteditable'),
  text: ssrControl.textContent,
  generated: toolbar?.shadowRoot!.querySelectorAll('en-toolbar').length ?? 0,
  commands: toolbar?.shadowRoot!.querySelectorAll('en-button').length ?? 0,
};
const counts = {editorReady: 0, toolbarReady: 0, toolbarTemplate: 0};
let focusToolbarAtReady = false;
let moveFocusToEssentialAtReady = false;
let reconnectToolbarAtReady = false;
let toolbarFocusReconnect: {sameParent: boolean; sameDocument: boolean; connected: boolean} | undefined;
let toolbarFocusRequest: {hasUpdated: boolean; generated: number; commands: number; editorSelected: boolean} | undefined;

const editorIsland = createHydrationIsland({
  root: roots[0], manifest: manifests[0], snapshot: {text}, scope: scopes[0],
  loaders: {editor: async () => {
    // Hydration support is installed by createHydrationIsland before this import.
    const module = await import('./ssr-editor-module.ts');
    return {...module, ready: async (root: Element | ShadowRoot, signal: AbortSignal) => { await module.ready(root, signal); counts.editorReady++; }};
  }},
});
const toolbarIsland = toolbar ? createHydrationIsland({
  root: roots[1], manifest: manifests[1], snapshot: {}, scope: scopes[1],
  loaders: {toolbar: async () => {
    const module = await import('./ssr-toolbar-module.ts');
    return {...module,
      // DOM associations belong to this application instance, never the JSON snapshot.
      template: () => { counts.toolbarTemplate++; return module.template({editor}); },
      ready: async (root: Element | ShadowRoot) => {
        if (focusToolbarAtReady) {
          // Request public focus before the first hydration update completes.
          // Readiness must not mask lost intent or supersede a newer focus owner.
          toolbarFocusRequest = {
            hasUpdated: toolbar.hasUpdated,
            generated: toolbar.shadowRoot!.querySelectorAll('en-toolbar').length,
            commands: toolbar.shadowRoot!.querySelectorAll('en-button').length,
            editorSelected: editor.hasSelection,
          };
          toolbar.focus({preventScroll: true});
          if (moveFocusToEssentialAtReady) document.querySelector<HTMLInputElement>('body > label input')!.focus();
          if (reconnectToolbarAtReady) {
            const parent = toolbar.parentNode!, next = toolbar.nextSibling, owner = toolbar.ownerDocument;
            toolbar.remove(); parent.insertBefore(toolbar, next);
            toolbarFocusReconnect = {sameParent: toolbar.parentNode === parent, sameDocument: toolbar.ownerDocument === owner, connected: toolbar.isConnected};
          }
        }
        await module.ready(root); counts.toolbarReady++;
      },
    };
  }},
}) : undefined;

const fixture = {
  mode, presence, text, roots, scopes, editor, toolbar, editorIsland, toolbarIsland, initial, counts,
  nativeScopes: elementScopeCapabilities(document).native,
  ssrControl,
  backend: undefined as undefined | {replacedSSRControl: boolean; editable: string | null; text: string | null},
  live: undefined as HTMLElement | undefined,
  editorShadow: editor.shadowRoot,
  selectedNodes: undefined as undefined | {anchor: Node | null; focus: Node | null},
  rememberNativeSelection() {
    const selection = document.getSelection()!;
    this.selectedNodes = {anchor: selection.anchorNode, focus: selection.focusNode};
  },
  async mountEditor() {
    await editorIsland.activate();
    this.live = editor.shadowRoot!.querySelector<HTMLElement>('[part~="control"][contenteditable="true"]')!;
    this.backend = {replacedSSRControl: this.live !== ssrControl, editable: this.live.getAttribute('contenteditable'), text: this.live.textContent};
  },
  get toolbarFocusRequest() { return toolbarFocusRequest; },
  get toolbarFocusReconnect() { return toolbarFocusReconnect; },
  async hydrateToolbar({focus = false, moveFocusToEssential = false, reconnect = false}: {focus?: boolean; moveFocusToEssential?: boolean; reconnect?: boolean} = {}) {
    if (!toolbarIsland) throw new Error('This baseline deliberately omits the toolbar.');
    focusToolbarAtReady = focus;
    moveFocusToEssentialAtReady = moveFocusToEssential;
    reconnectToolbarAtReady = reconnect;
    await toolbarIsland.activate();
  },
  inspectEditor() {
    const live = editor.shadowRoot!.querySelector('[part~="control"][contenteditable="true"]');
    const native = document.getSelection()!;
    return {
      sameHost: editor === roots[0].querySelector('en-rich-text-editor'),
      sameShadow: editor.shadowRoot === this.editorShadow,
      sameLiveControl: live === this.live,
      focused: editor.shadowRoot!.activeElement === live,
      selection: editor.captureRange(), selectionKey: editor.selectionKey,
      nativeSelection: {
        text: native.toString(), anchorOffset: native.anchorOffset, focusOffset: native.focusOffset,
        anchorText: native.anchorNode?.textContent, focusText: native.focusNode?.textContent,
        sameAnchor: !this.selectedNodes || native.anchorNode === this.selectedNodes.anchor,
        sameFocus: !this.selectedNodes || native.focusNode === this.selectedNodes.focus,
      },
      value: editor.value, revision: editor.revision,
    };
  },
};
(window as typeof window & {ssrEditorFixture: typeof fixture}).ssrEditorFixture = fixture;
