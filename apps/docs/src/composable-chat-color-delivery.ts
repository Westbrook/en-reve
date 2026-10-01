import {html, nothing, noChange, type TemplateResult} from 'lit';
import {AsyncDirective, directive} from 'lit/async-directive.js';
import type {ChildPart} from 'lit/directive.js';
import {ref} from 'lit/directives/ref.js';
import {createDeliveryProfile, prepareDelivery} from '@en-reve/elements/delivery.js';
import {createDefinitionLoader, type DefinitionLoadOptions} from '@en-reve/elements/lazy-loader.js';
import type {EditorPickerSession} from '@en-reve/elements/editor-extensions.js';
import type {EnTokenEditor} from '@en-reve/elements/token-editor.js';
import {composableChatColorOwnership} from './composable-chat-color-ownership.mjs';

// Literal pure definitions keep application ownership and the optional graph reviewable.
export const composableChatColorLoaders = Object.freeze({
  'en-color-picker': async () => (await import('@en-reve/elements/definitions/color-picker.js')).colorPickerDefinition,
  'en-swatch': async () => (await import('@en-reve/elements/definitions/swatch.js')).swatchDefinition,
  'en-tab': async () => (await import('@en-reve/elements/definitions/tab.js')).tabDefinition,
  'en-tab-panel': async () => (await import('@en-reve/elements/definitions/tab-panel.js')).tabPanelDefinition,
  'en-tabs': async () => (await import('@en-reve/elements/definitions/tabs.js')).tabsDefinition,
});
export const composableChatColorProfile = createDeliveryProfile({
  schemaVersion: 1,
  id: composableChatColorOwnership.profileId,
  version: composableChatColorOwnership.profileVersion,
  loaders: composableChatColorLoaders,
  features: [{
    id: composableChatColorOwnership.featureId,
    version: composableChatColorOwnership.featureVersion,
    disposition: 'implemented', owner: 'application',
    deferredCosts: ['component-loading', 'registration'],
    definitionTags: composableChatColorOwnership.optionalTags,
    fallback: 'Named loading/error controls support Cancel and Retry; the existing native color mode remains available.',
    prerequisites: ['The application preserves the editor registry, active session, drafts, native activation and focus intent.'],
  }],
});

/** Explicit code-only preparation. No automatic hover, startup work or native gesture replay. */
export function prepareComposableChatColor(options?: DefinitionLoadOptions): Promise<void> {
  return prepareDelivery(composableChatColorProfile, [composableChatColorOwnership.featureId], options);
}

function colorRegistry(editor: EnTokenEditor): {root: ShadowRoot; registry: CustomElementRegistry} {
  const root = editor.renderRoot as ShadowRoot;
  if (!root || root.nodeType !== 11 || !('host' in root)) throw new Error('The color editor has no shadow render root.');
  const registry = 'customElementRegistry' in root ? root.customElementRegistry : editor.ownerDocument.defaultView?.customElements;
  if (!registry) throw new Error('The color editor render root has no associated registry.');
  return {root, registry};
}

/** This directive owns one session's presentation; shared loading/caching stays in the library. */
class ComposableChatColor extends AsyncDirective {
  private session?: EditorPickerSession;
  private editor?: EnTokenEditor;
  private root?: ShadowRoot;
  private registry?: CustomElementRegistry;
  private content?: TemplateResult;
  private renderContent?: () => TemplateResult;
  private waiting?: HTMLElement;
  private generation = 0;
  private failed = false;
  private settled = false;
  private waitingRetained = false;
  private showRetry = false;
  private readonly captureWaiting = (element?: Element) => {this.waiting = element as HTMLElement | undefined;};
  private readonly abandon = () => this.release();
  private readonly waitingFocusOut = () => queueMicrotask(() => {
    if (this.settled && this.waitingRetained && this.root && !this.waiting?.contains(this.root.activeElement)) {
      this.waitingRetained = false; this.setValue(this.view());
    }
  });

  override render(_session: EditorPickerSession, _editor: EnTokenEditor, _renderContent: () => TemplateResult) {return nothing;}
  override update(_part: ChildPart, [session, editor, renderContent]: Parameters<ComposableChatColor['render']>) {
    if (this.session?.signal === session.signal) return noChange;
    this.release();
    if (session.signal.aborted || !editor.isConnected) return nothing;
    this.session = session; this.editor = editor; this.renderContent = renderContent;
    session.signal.addEventListener('abort', this.abandon, {once: true});
    // A missing registry can fail synchronously; commit the shell before publishing any async result.
    queueMicrotask(() => {if (this.session?.signal === session.signal) void this.open();});
    return this.view();
  }
  private current(generation: number): boolean {
    if (this.generation !== generation || !this.isConnected || !this.editor?.isConnected || !this.session || this.session.signal.aborted) return false;
    if (!this.root || !this.registry) return false;
    const current = colorRegistry(this.editor);
    return current.root === this.root && current.registry === this.registry;
  }
  private view() {
    return html`<div data-color-delivery>
      <div ${ref(this.captureWaiting)} ?data-picker-focus=${!this.settled} tabindex="-1" role="group"
        aria-label=${this.failed ? 'Color controls unavailable' : this.settled ? 'Color controls ready' : 'Loading color controls'}
        ?hidden=${this.settled && !this.waitingRetained} @focusout=${this.waitingFocusOut}>
        <p role="status">${this.failed ? 'Color controls could not load. Retry or cancel to keep your draft.' : this.settled ? 'Color controls are ready.' : 'Loading color controls…'}</p>
        ${this.showRetry ? html`<button type="button" aria-disabled=${String(!this.failed)} @click=${() => {if (this.failed) void this.open({retry: true});}}>Retry color controls</button>` : nothing}
        <button type="button" @click=${() => this.session?.cancel()}>Cancel</button>
      </div>
      ${this.content ?? nothing}
    </div>`;
  }
  private async open(options?: DefinitionLoadOptions): Promise<void> {
    const generation = ++this.generation;
    this.failed = false;
    try {
      const editor = this.editor;
      if (!editor) return;
      const {root, registry} = colorRegistry(editor);
      this.root = root; this.registry = registry;
      // Retry updates an existing shell; the first update returns its shell synchronously.
      if (options?.retry) this.setValue(this.view());
      await createDefinitionLoader(registry, composableChatColorProfile.loaders).ensure(composableChatColorOwnership.optionalTags, options);
      if (!this.current(generation)) return;
      this.content = this.renderContent!();
      this.setValue(this.view());
      // Component registration is separate from the nested native controls becoming usable.
      const descendants = (parent: ParentNode): (HTMLElement & {updateComplete?: Promise<unknown>; isUpdatePending?: boolean})[] =>
        [...parent.querySelectorAll<HTMLElement>('*')].flatMap(node => {
          const childRoot = 'renderRoot' in node ? node.renderRoot as ParentNode : node.shadowRoot;
          return [node, ...(childRoot && childRoot !== node ? descendants(childRoot) : [])];
        });
      for (let pass = 0; pass < 4; pass++) {
        const nodes = descendants(root.querySelector('[data-color-delivery]')!);
        await Promise.all(nodes.map(node => node.updateComplete));
        if (!this.current(generation)) return;
        const next = descendants(root.querySelector('[data-color-delivery]')!);
        if (next.length === nodes.length && next.every(node => !node.isUpdatePending)) break;
        if (pass === 3) throw new Error('Color controls did not settle.');
      }
      const picker = root.querySelector<HTMLElement & {renderRoot: ShadowRoot}>('en-color-picker[data-picker-focus]');
      const hexField = picker?.renderRoot.querySelector<HTMLElement & {renderRoot: ShadowRoot}>('[part~="hex-field"]');
      const input = hexField?.renderRoot.querySelector<HTMLInputElement>('input[part~="control"]');
      if (!picker || !input || input.disabled || !input.labels?.length || ![...input.labels].some(label => label.textContent?.trim())
          || !input.checkVisibility({visibilityProperty: true}) || !input.getBoundingClientRect().width || !input.getBoundingClientRect().height) {
        throw new Error('The named color control is not usable.');
      }
      // Enter/Down may have focused the synchronous shell. Only that still-current intent transfers.
      if (root.activeElement === this.waiting) picker.focus();
      this.waitingRetained = !!this.waiting?.contains(root.activeElement);
      this.settled = true;
      this.setValue(this.view());
    } catch {
      if (this.generation !== generation || !this.isConnected || this.session?.signal.aborted) return;
      this.failed = true; this.showRetry = true; this.content = undefined;
      this.setValue(this.view());
    }
  }
  private release(): void {
    ++this.generation;
    this.session?.signal.removeEventListener('abort', this.abandon);
    this.session = undefined; this.editor = undefined; this.root = undefined; this.registry = undefined;
    this.renderContent = undefined; this.content = undefined; this.waiting = undefined;
    this.failed = false; this.settled = false; this.waitingRetained = false; this.showRetry = false;
  }
  protected override disconnected(): void {this.release();}
}
export const composableChatColor = directive(ComposableChatColor);
