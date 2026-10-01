import type { Context } from '@lit/context';
import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { ScopedContext } from './context-consumer.js';
import { ChildUpgrades } from './child-upgrades.js';

export type Host<T> = HTMLElement & ReactiveControllerHost & { for: string; editor: T | undefined };

/** Explicit references win even when unresolved; context is only the implicit path. */
export class EditorAssociation<T extends HTMLElement> implements ReactiveController {
  private context: ScopedContext<T | undefined>;
  private observer?: MutationObserver;
  private upgrades: ChildUpgrades;
  private bound?: T;
  constructor(private host: Host<T>, context: Context<unknown, T | undefined>, private accepts: (value: unknown) => value is T, private changed: (value: T | undefined) => void) {
    this.context = new ScopedContext(host, context, () => this.refresh());
    host.addController(this);
    this.upgrades = new ChildUpgrades(host, () => this.refresh());
  }
  hostConnected(): void {
    const Observer = this.host.ownerDocument.defaultView?.MutationObserver;
    if (Observer) {
      this.observer = new Observer(() => this.refresh());
      this.observer.observe(this.host.getRootNode(), { childList: true, subtree: true, attributes: true, attributeFilter: ['id'] });
    }
    this.refresh();
  }
  hostUpdated(): void { this.refresh(); }
  hostDisconnected(): void {
    this.observer?.disconnect(); this.observer = undefined;
    this.bind(undefined);
  }
  refresh(): void {
    if (!this.host.isConnected) return;
    const root = this.host.getRootNode() as Document | ShadowRoot;
    const candidate = this.host.editor ?? (this.host.for ? root.getElementById?.(this.host.for) : this.context?.value);
    const target = candidate?.nodeType === 1 && typeof candidate.getRootNode === 'function' ? candidate : undefined;
    this.upgrades.watch(target && !this.accepts(target) ? [target] : []);
    this.bind(this.accepts(target) ? target : undefined);
  }

  private bind(value: T | undefined): void {
    if (this.bound === value) return;
    this.bound = value;
    this.changed(value);
  }
}
