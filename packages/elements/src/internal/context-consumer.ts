import { ContextEvent, ContextRoot, type Context } from '@lit/context';
import type { ReactiveController, ReactiveControllerHost } from 'lit';

export type Host = HTMLElement & ReactiveControllerHost;
const roots = new WeakMap<Document, { root: ContextRoot; users: number }>();

/** Install replay before requesting, including consumers inside shadow roots. */
function retainRoot(document: Document): () => void {
  let entry = roots.get(document);
  if (!entry) {
    entry = { root: new ContextRoot(), users: 0 };
    entry.root.attach(document as unknown as HTMLElement);
    roots.set(document, entry);
  }
  entry.users++;
  return () => {
    if (--entry.users === 0) {
      entry.root.detach(document as unknown as HTMLElement);
      roots.delete(document);
    }
  };
}

/** Subscribe from an external participant, not from the controller's host. */
export class TargetContext<T> {
  value: T | undefined;
  private target?: HTMLElement;
  private ancestry: Node[] = [];
  private generation = 0;
  private unsubscribe?: () => void;
  private releaseRoot?: () => void;
  private observer?: MutationObserver;
  private slots: HTMLSlotElement[] = [];
  private requests = 0;
  constructor(private context: Context<unknown, T>, private changed: () => void) {}

  /** Also validates ancestry synchronously before an interaction can commit. */
  setTarget(target?: HTMLElement, notify = true): void {
    if (!target?.isConnected) target = undefined;
    const ancestry: Node[] = [];
    for (let node: Node | null = target ?? null; node; node =
      (node as Element).assignedSlot ?? node.parentNode ?? (node as ShadowRoot).host ?? null) ancestry.push(node);
    if (target === this.target && ancestry.length === this.ancestry.length
      && ancestry.every((node, index) => node === this.ancestry[index])) return;
    const generation = ++this.generation;
    this.unsubscribe?.(); this.unsubscribe = undefined;
    this.releaseRoot?.(); this.releaseRoot = undefined;
    this.observer?.disconnect(); this.observer = undefined;
    for (const slot of this.slots) slot.removeEventListener('slotchange', this.refresh);
    this.slots = [];
    this.target = target;
    this.ancestry = ancestry;
    this.value = undefined;
    if (target) {
      this.releaseRoot = retainRoot(target.ownerDocument);
      const Observer = target.ownerDocument.defaultView?.MutationObserver;
      if (Observer) {
        this.observer = new Observer(this.refresh);
        for (const node of ancestry) {
          this.observer.observe(node, {childList: true, ...(node.nodeType === 1 ? {attributes: true, attributeFilter: ['slot']} : {})});
          if (node.nodeType === 1 && (node as Element).localName === 'slot') {
            this.slots.push(node as HTMLSlotElement);
            node.addEventListener('slotchange', this.refresh);
          }
        }
      }
      this.requests++;
      try {
        target.dispatchEvent(new ContextEvent(this.context, target, (value, unsubscribe) => {
          if (generation !== this.generation || this.target !== target || !target.isConnected) { unsubscribe?.(); return; }
          if (this.unsubscribe !== unsubscribe) this.unsubscribe?.();
          this.unsubscribe = unsubscribe;
          const changed = this.value !== value;
          this.value = value;
          if (changed && !this.requests) this.changed();
        }, true));
      } finally { this.requests--; }
    }
    if (notify && generation === this.generation) this.changed();
  }

  private refresh = (): void => { this.setTarget(this.target); };
  disconnect(): void { this.setTarget(undefined, false); }
}

/** A subscription belongs to one connection; late callbacks cannot revive it. */
export class ScopedContext<T> implements ReactiveController {
  value: T | undefined;
  private generation = 0;
  private unsubscribe?: () => void;
  private releaseRoot?: () => void;
  private callback?: (value: T, unsubscribe?: () => void) => void;
  constructor(private host: Host, private context: Context<unknown, T>, private changed?: (value: T | undefined) => void) {
    host.addController(this);
  }
  hostConnected(): void {
    const generation = ++this.generation;
    this.releaseRoot = retainRoot(this.host.ownerDocument);
    this.callback = (value, unsubscribe) => {
      if (!this.host.isConnected || generation !== this.generation) { unsubscribe?.(); return; }
      if (this.unsubscribe !== unsubscribe) this.unsubscribe?.();
      this.unsubscribe = unsubscribe;
      this.value = value;
      this.changed?.(value);
      this.host.requestUpdate();
    };
    this.host.dispatchEvent(new ContextEvent(this.context, this.host, this.callback, true));
  }
  hostDisconnected(): void {
    ++this.generation;
    this.callback = undefined;
    this.unsubscribe?.(); this.unsubscribe = undefined;
    this.releaseRoot?.(); this.releaseRoot = undefined;
    this.value = undefined;
    this.changed?.(undefined);
    this.host.requestUpdate();
  }
}
