import type {ReactiveController, ReactiveControllerHost} from 'lit';
import {elementRegistry} from './element-registry.js';

/** Internal notification from the explicit initialization boundary, not a readiness event. */
export const registryInitialized = 'en-internal-registry-initialized';
export type Host = HTMLElement & ReactiveControllerHost;
type Subscription = {target: WeakRef<ChildUpgrades>; epoch: number};
type Pending = Set<Subscription>;
const pendingDefinitions = new WeakMap<CustomElementRegistry, Map<string, Pending>>();

/** One unresolved promise per registry/name. Disconnect removes subscribers; promises retain no hosts. */
function pendingDefinition(registry: CustomElementRegistry, tag: string): Pending {
  let names = pendingDefinitions.get(registry);
  if (!names) pendingDefinitions.set(registry, names = new Map());
  let pending = names.get(tag);
  if (!pending) {
    pending = new Set(); names.set(tag, pending);
    settleDefinition(registry.whenDefined(tag), names, tag, pending);
  }
  return pending;
}
function settleDefinition(promise: Promise<CustomElementConstructor>, names: Map<string, Pending>, tag: string, pending: Pending): void {
  void promise.then(() => {
    names.delete(tag);
    for (const subscriber of pending) subscriber.target.deref()?.definitionReady(subscriber.epoch);
    pending.clear();
  });
}

/** Watches actual child registries. No polling, global fallback or retained removed children. */
export class ChildUpgrades implements ReactiveController {
  private subscriptions = new Map<Pending, Subscription>();
  private epoch = 0;
  private documents = new Set<Document>();
  private queued = false;
  private attempted = new WeakSet<Element>();
  constructor(private host: Host, private changed: () => void) { host.addController(this); }

  watch(elements: Iterable<Element>): void {
    const next = new Set<Pending>();
    const documents = new Set<Document>();
    for (const element of elements) {
      if (!element.localName.includes('-') || element.matches(':defined')) continue;
      const registry = elementRegistry(element);
      if (!registry) { if (registry === null && this.host.isConnected) documents.add(element.ownerDocument); continue; }
      if (registry.get(element.localName)) {
        // Explicit editor targets can be detached. Native define only upgrades
        // connected candidates; attempt each detached candidate at most once.
        if (!this.attempted.has(element)) { this.attempted.add(element); registry.upgrade(element); }
        continue;
      }
      const pending = pendingDefinition(registry, element.localName);
      next.add(pending);
      if (!this.subscriptions.has(pending)) {
        const subscriber = {target: new WeakRef(this), epoch: this.epoch};
        pending.add(subscriber); this.subscriptions.set(pending, subscriber);
      }
    }
    for (const [pending, subscriber] of this.subscriptions) if (!next.has(pending)) {
      pending.delete(subscriber); this.subscriptions.delete(pending);
    }
    for (const document of this.documents) if (!documents.has(document)) document.removeEventListener(registryInitialized, this.initialized, true);
    for (const document of documents) if (!this.documents.has(document)) document.addEventListener(registryInitialized, this.initialized, true);
    this.documents = documents;
  }

  private initialized = (): void => { this.definitionReady(this.epoch); };
  /** @internal Recollect current children after constructors and their first reactive updates. */
  definitionReady(epoch: number): void {
    if (epoch !== this.epoch || !this.host.isConnected || this.queued) return;
    this.queued = true;
    queueMicrotask(() => {
      this.queued = false;
      if (epoch === this.epoch && this.host.isConnected) this.changed();
    });
  }
  hostConnected(): void { this.definitionReady(this.epoch); }
  hostDisconnected(): void {
    ++this.epoch;
    for (const document of this.documents) document.removeEventListener(registryInitialized, this.initialized, true);
    this.documents.clear();
    for (const [pending, subscriber] of this.subscriptions) pending.delete(subscriber);
    this.subscriptions.clear();
    this.queued = false;
  }
}
