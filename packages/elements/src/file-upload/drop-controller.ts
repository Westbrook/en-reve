import { connectionDocument } from '../internal/element-registry.js';
import type { ReactiveController, ReactiveControllerHost } from 'lit';

export type Host = HTMLElement & ReactiveControllerHost;
const owners = new WeakMap<Element, Set<FileDropController>>();
const events = ['dragenter', 'dragover', 'dragleave', 'drop'] as const;

/** File drops belong to the nearest associated surface in the composed path. */
export class FileDropController implements ReactiveController {
  private surfaces: Element[] = [];
  private observer?: MutationObserver;
  private connected = false;
  private observedTarget: HTMLElement | null | undefined;
  private targetRoot?: Node;
  constructor(private readonly host: Host, private readonly options: {
    id(): string; target(): HTMLElement | null;
    handle(event: DragEvent): void; clear(): void;
  }) { host.addController(this); }
  hostConnected(): void {
    this.connected = true;
    const Observer = this.host.ownerDocument.defaultView?.MutationObserver;
    if (Observer) {
      this.observer = new Observer(() => this.refresh());
      this.observer.observe(this.host.getRootNode(), { subtree: true, childList: true, attributes: true, attributeFilter: ['id'] });
    }
    this.host.ownerDocument.addEventListener('dragend', this.clear);
    this.host.ownerDocument.addEventListener('drop', this.clear);
    this.refresh();
  }
  hostUpdated(): void { this.refresh(); }
  hostDisconnected(): void {
    this.connected = false;
    this.observedTarget = undefined; this.targetRoot = undefined;
    this.observer?.disconnect(); this.observer = undefined;
    connectionDocument(this.host).removeEventListener('dragend', this.clear);
    connectionDocument(this.host).removeEventListener('drop', this.clear);
    this.release(); this.options.clear();
  }
  private readonly clear = (): void => this.options.clear();
  private release(): void {
    for (const surface of this.surfaces) {
      for (const type of events) surface.removeEventListener(type, this.handle);
      owners.get(surface)?.delete(this);
    }
    this.surfaces = [];
  }
  private refresh(): void {
    if (!this.connected) return;
    const root = this.host.getRootNode() as Document | ShadowRoot;
    const explicit = this.options.target();
    const targetRoot = explicit?.isConnected ? explicit.getRootNode() : this.targetRoot;
    if (explicit !== this.observedTarget || targetRoot !== this.targetRoot) {
      this.observedTarget = explicit; this.targetRoot = explicit ? targetRoot : undefined;
      this.observer?.disconnect();
      this.observer?.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['id'] });
      if (this.targetRoot && this.targetRoot !== root) this.observer?.observe(this.targetRoot, { subtree: true, childList: true });
    }
    const target = this.options.target() ?? (this.options.id() ? root.getElementById?.(this.options.id()) : null);
    const next = [this.host, ...(target && target !== this.host && target.isConnected && target.ownerDocument === this.host.ownerDocument ? [target] : [])];
    if (next.length === this.surfaces.length && next.every((surface, index) => surface === this.surfaces[index])) return;
    this.release(); this.options.clear(); this.surfaces = next;
    for (const surface of next) {
      const set = owners.get(surface) ?? new Set(); set.add(this); owners.set(surface, set);
      for (const type of events) surface.addEventListener(type, this.handle);
    }
  }
  private readonly handle = (event: Event): void => {
    if (!this.connected || !this.host.isConnected) return;
    const drag = event as DragEvent;
    if (!Array.from(drag.dataTransfer?.types ?? []).includes('Files')) return;
    // Duplicate associations deliberately accept nothing; never pick an uploader
    // based on registration order. A disabled inner surface still owns its drop.
    const surface = event.composedPath().find(node => owners.get(node as Element)?.size) as Element | undefined;
    const set = surface ? owners.get(surface) : undefined;
    if (!surface?.isConnected || !set?.has(this) || event.currentTarget !== surface) return;
    if (set.size !== 1) { event.preventDefault(); if (drag.dataTransfer) drag.dataTransfer.dropEffect = 'none'; this.clear(); return; }
    if (event.defaultPrevented) { this.clear(); return; }
    this.options.handle(drag);
  };
}
