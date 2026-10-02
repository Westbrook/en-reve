import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { referenceRoot, type ReferenceRoot } from '../internal/id-reference.js';

/** @internal Native semantic fields owned by FormField. */
export type Field = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
/** @internal Lifecycle and FACE label surface consumed by FieldLabels. */
export type Host = HTMLElement & ReactiveControllerHost & { readonly labels?: NodeList };
/** @internal Library-owned naming and native activation policy. */
export interface FieldLabelOptions {
  activation?: 'focus' | 'click';
  /** Initial library-authored IDREFs, restored when an external label goes away. */
  labelledBy?: string;
}
type Listener = () => void;
const roots = new WeakMap<ReferenceRoot, { listeners: Set<Listener>; observer: MutationObserver }>();

/** Shared subscription to relationship changes in a field's own tree. No scans. */
function observeLabels(root: ReferenceRoot | null, listener: Listener): () => void {
  const document = root?.nodeType === 9 ? root as Document : root?.ownerDocument;
  const Observer = document?.defaultView?.MutationObserver;
  if (!root || !Observer) return () => {};
  let entry = roots.get(root);
  if (!entry) {
    const listeners = new Set<Listener>();
    const observer = new Observer(records => {
      if (!records.some(record => record.type === 'attributes' ||
        [...record.addedNodes, ...record.removedNodes].some(node => node.nodeType === 1))) return;
      for (const notify of [...listeners]) if (listeners.has(notify)) notify();
    });
    observer.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['id', 'for'] });
    entry = { listeners, observer };
    roots.set(root, entry);
  }
  entry.listeners.add(listener);
  return () => {
    entry.listeners.delete(listener);
    if (!entry.listeners.size) {
      entry.observer.disconnect();
      if (roots.get(root) === entry) roots.delete(root);
    }
  };
}

/** @internal Preserve real native label nodes without taking editing/form ownership. */
export class FieldLabels implements ReactiveController {
  private connected = false;
  private stop?: () => void;
  private binding?: { input: Field; labels: Element[] };
  private listeners = new Map<HTMLLabelElement, EventListener>();
  private timers = new Map<number, Window>();
  constructor(private host: Host, private control: () => Field | null, private options: FieldLabelOptions = {}) { host.addController(this); }

  hostConnected(): void {
    this.connected = true;
    this.stop?.();
    this.stop = observeLabels(referenceRoot(this.host), () => this.sync());
    this.sync();
  }
  hostUpdated(): void { this.sync(); }
  hostDisconnected(): void {
    this.connected = false;
    this.stop?.(); this.stop = undefined;
    for (const [label, listener] of this.listeners) label.removeEventListener('click', listener);
    this.listeners.clear();
    for (const [id, view] of this.timers) view.clearTimeout(id);
    this.timers.clear();
    this.release();
  }

  private owns(): boolean {
    if (!this.binding) return false;
    const { input, labels } = this.binding;
    const scopes = new Set<Node>();
    for (let root: Node | undefined = input.getRootNode(); root; root = 'host' in root ? (root as ShadowRoot).host.getRootNode() : undefined) scopes.add(root);
    const expected = labels.filter(label => scopes.has(label.getRootNode()));
    const actual = input.ariaLabelledByElements ?? [];
    return input.getAttribute('aria-labelledby') === '' && actual.length === expected.length && actual.every((label, index) => label === expected[index]);
  }
  private release(): void {
    if (this.owns()) {
      this.binding!.input.ariaLabelledByElements = null;
      if (this.options.labelledBy) this.binding!.input.setAttribute('aria-labelledby', this.options.labelledBy);
      else this.binding!.input.removeAttribute('aria-labelledby');
    }
    this.binding = undefined;
  }

  private sync(): void {
    if (!this.connected || !this.host.isConnected) return;
    const input = this.control();
    // Firefox may retain a retargeted label in ElementInternals.labels even
    // after label.control changed. Only current associations may name/activate.
    const hostLabels = Array.from(this.host.labels ?? []).filter((node): node is HTMLLabelElement =>
      node.nodeType === 1 && (node as HTMLLabelElement).control === this.host);
    const nativeLabels = Array.from(input?.labels ?? []);
    // Native forwarding may transfer a label out of ElementInternals.labels.
    // Keep actual outer-tree native labels as well as FACE-owned associations.
    const associated = [...new Set([...hostLabels, ...nativeLabels.filter(label => label.getRootNode() !== input?.getRootNode())])];
    // A property surface may come from a partial implementation or a polyfill.
    // Trust native routing only when these actual labels reach the native field.
    const native = (this.host.shadowRoot as (ShadowRoot & { referenceTarget?: string | null }) | null)?.referenceTarget === input?.id &&
      associated.every(label => nativeLabels.includes(label));
    const external = native ? [] : associated;
    for (const [label, listener] of this.listeners) if (!external.includes(label)) {
      label.removeEventListener('click', listener); this.listeners.delete(label);
    }
    for (const label of external) if (!this.listeners.has(label)) {
      const listener: EventListener = event => {
        const path = event.composedPath();
        // A wrapping label may also receive the browser's activation click on
        // its FACE host. Only the original label interaction owns forwarding.
        if (path.includes(this.host)) return;
        if (path.slice(0, path.indexOf(label)).some(node => node instanceof this.host.ownerDocument.defaultView!.Element &&
          node.matches('a[href],button,input,select,textarea,summary,[contenteditable]:not([contenteditable="false"])'))) return;
        const view = this.host.ownerDocument.defaultView;
        const original = this.control();
        if (!view) return;
        // A task observes ancestor cancellation after the full native dispatch.
        // Choices call native click() so their existing change transaction owns
        // toggling/group selection. Text fields only focus; no OS picker is opened.
        const id = view.setTimeout(() => {
          this.timers.delete(id);
          if (!event.defaultPrevented && this.connected && this.host.isConnected &&
              label.control === this.host && original === this.control() && original && !original.disabled) {
            original.focus();
            if (this.options.activation === 'click') original.click();
          }
        });
        this.timers.set(id, view);
      };
      this.listeners.set(label, listener); label.addEventListener('click', listener);
    }
    if (this.binding && (this.binding.input !== input || !this.owns())) this.release();
    const naming = this.options.labelledBy ? associated : external;
    if (!input || !naming.length || input.hasAttribute('aria-label')) { this.release(); return; }
    if (!this.binding && input.hasAttribute('aria-labelledby') && input.getAttribute('aria-labelledby') !== this.options.labelledBy) return;
    if (!('ariaLabelledByElements' in input)) return;
    const internal = this.options.labelledBy
      ? this.options.labelledBy.split(/\s+/).map(id => (input.getRootNode() as Document | ShadowRoot).getElementById(id)).filter((node): node is HTMLElement => node !== null)
      : Array.from(input.labels ?? []);
    const labels = [...new Set<Element>([...naming, ...internal])];
    const previous = input.ariaLabelledByElements ?? [];
    if (labels.length !== previous.length || labels.some((label, i) => label !== previous[i])) input.ariaLabelledByElements = labels;
    this.binding = { input, labels };
  }
}
