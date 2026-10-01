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
