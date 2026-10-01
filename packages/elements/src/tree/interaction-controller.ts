import { isDOMElement } from '../internal/dom-kind.js';
import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { deriveTreePresentations, emptyTreeItemPresentation, treeSnapshot, treeSelection, treeSelectedKeys, TreeSelectionAnchor,
  type TreeSource, type TreeSnapshot, type TreeItemPresentation } from '@en-reve/primitives/interactions/tree.js';
import { ChildUpgrades } from '../internal/child-upgrades.js';
import type { EnTreeItem, TreeItemOwner } from '../tree-item/element.js';

export type Host = HTMLElement & ReactiveControllerHost;
export interface Callbacks {
  enabled?(): boolean;
  snapshot(): TreeSnapshot;
  presented(): TreeSnapshot;
  propose(next: TreeSnapshot, reason: 'selection' | 'expansion', valid: () => boolean): void;
  status(error: string, empty: boolean): void;
  focusEmpty(): void;
}
interface Record { item: EnTreeItem; parent: EnTreeItem | null; source: TreeSource; }
interface Collection { sources: TreeSource[]; records: Record[]; ready: boolean; }
interface FocusOwner { item: EnTreeItem; root: Document | ShadowRoot; }
const interactive = 'a[href],area[href],button,input,textarea,select,summary,iframe,object,embed,audio[controls],video[controls],[tabindex],[contenteditable]:not([contenteditable="false"]),en-button,en-link,en-text-field,en-checkbox,en-switch,en-select,en-menu,en-tree';
const unavailable = (element: Element): boolean => element.hasAttribute('hidden') || element.hasAttribute('inert') || element.getAttribute('aria-hidden')?.toLowerCase() === 'true';

/** Tree-specific hierarchy, focus and activation; state transactions stay with the owner. */
export class TreeInteractionController implements ReactiveController, TreeItemOwner {
  private connected = false;
  private observer?: MutationObserver;
  private abort?: AbortController;
  private queued = false;
  private refreshing = false;
  private records: Record[] = [];
  private visible: EnTreeItem[] = [];
  private presentations = new Map<EnTreeItem, TreeItemPresentation>();
  private current: EnTreeItem | null = null;
  private focusOwner?: FocusOwner;
  private error = '';
  private ready = false;
  private readonly upgrades: ChildUpgrades;
  private readonly selectionAnchor = new TreeSelectionAnchor();
  private search = '';
  private searchAt = 0;
  private lastPresented?: TreeSnapshot;

  constructor(private readonly host: Host, private readonly callbacks: Callbacks) { host.addController(this); this.upgrades = new ChildUpgrades(host, () => this.invalidate()); }

  hostConnected(): void {
    this.connected = true;
    const realm = this.host.ownerDocument.defaultView;
    const Abort = realm?.AbortController ?? globalThis.AbortController;
    this.abort = new Abort();
    const options = { signal: this.abort.signal };
    this.host.addEventListener('click', this.click, options);
    this.host.addEventListener('keydown', this.keydown, options);
    this.host.addEventListener('focusin', this.focusin, options);
    this.host.addEventListener('focusout', this.focusout, options);
    if (realm?.MutationObserver) {
      this.observer = new realm.MutationObserver(this.invalidate);
      this.observer.observe(this.host, { childList: true, subtree: true, characterData: true, attributes: true,
        attributeFilter: ['key', 'value', 'label', 'disabled', 'hidden', 'inert', 'aria-hidden', 'slot', 'selected', 'expanded', 'checked', 'tabindex', 'href', 'contenteditable', 'controls'] });
    }
    this.invalidate();
  }
  hostDisconnected(): void {
    this.connected = false;
    this.abort?.abort(); this.abort = undefined;
    this.observer?.disconnect(); this.observer = undefined;
    this.focusOwner = undefined;
    this.current = null;
    for (const { item } of this.records) item.releaseTreeOwner?.(this);
    this.records = []; this.visible = []; this.presentations.clear();
    this.selectionAnchor.reset(); this.search = ''; this.searchAt = 0;
  }
  hostUpdated(): void { this.invalidate(); }
  readonly invalidate = (): void => {
    if (!this.connected || this.queued) return;
    this.queued = true;
    queueMicrotask(() => { this.queued = false; if (this.connected) this.refresh(); });
  };

  private collect(): Collection {
    const records: Record[] = [];
    let ready = true;
    const read = (parent: Element, owner: EnTreeItem | null): TreeSource[] => {
      const receivingSlot = owner ? 'children' : '';
      const sources: TreeSource[] = [];
      if (!owner && Array.from(parent.childNodes).some(node => node.nodeType === 3 && node.textContent?.trim())) {
        throw new TypeError('Tree roots require direct en-tree-item children, not text.');
      }
      for (const child of Array.from(parent.children)) {
        // DSD template elements are infrastructure, never structural children.
        if (child.localName === 'template') continue;
        const slot = child.getAttribute('slot') ?? '';
        if (child.localName === 'en-tree-item' && slot !== receivingSlot) {
          throw new TypeError(owner ? 'Nested tree items require slot="children".' : 'Root tree items use the default slot.');
        }
        if (slot !== receivingSlot) continue;
        if (child.localName !== 'en-tree-item') throw new TypeError('Tree structure requires direct en-tree-item children; wrappers and slot forwarding are unsupported.');
        const item = child as EnTreeItem;
        if (child.getAttribute('hidden')?.toLowerCase() === 'until-found') throw new TypeError('Tree items do not support hidden="until-found".');
        if (['selected', 'expanded', 'checked'].some(name => child.hasAttribute(name))) throw new TypeError('Tree items do not own selected, expanded or checked state; set the parent value and expanded properties.');
        for (const content of Array.from(child.children)) {
          if (['label', 'prefix', 'suffix'].includes(content.getAttribute('slot') ?? '')
            && (content.matches(interactive) || content.querySelector(interactive))) {
            throw new TypeError('Tree labels, prefixes and suffixes must contain noninteractive content.');
          }
        }
        const upgraded = typeof item.setTreeOwner === 'function';
        if (!upgraded) {
          ready = false;

        }
        const children: TreeSource[] = [];
        const source: TreeSource = {
          value: upgraded ? item.value : child.getAttribute('value') ?? '',
          disabled: upgraded ? item.disabled : child.hasAttribute('disabled'),
          hidden: unavailable(child), branch: upgraded ? item.branch : child.hasAttribute('branch'), children,
        };
        records.push({ item, parent: owner, source });
        children.push(...read(child, item));
        sources.push(source);
      }
      return sources;
    };
    const sources = read(this.host, null);
    this.upgrades.watch(records.map(record => record.item));
    return { sources, records, ready };
  }

  refresh(): void {
    if (!this.connected || this.refreshing) return;
    if (this.callbacks.enabled?.() === false) {
      for (const { item } of this.records) item.releaseTreeOwner?.(this);
      this.records = []; this.visible = []; this.presentations.clear(); this.current = null; this.focusOwner = undefined;
      return;
    }
    this.refreshing = true;
    try {
      const previous = this.records;
      const oldVisible = this.visible;
      const presented = this.callbacks.presented();
      const stateChanged = presented !== this.lastPresented;
      this.lastPresented = presented;
      let collection: Collection;
      try {
        collection = this.collect();
        const derived = deriveTreePresentations(collection.sources, { ...presented, reorderable: this.host.hasAttribute('reorderable') });
        this.error = '';
        this.records = collection.records;
        for (const { item } of this.records) item.setTreeReorderable?.(this.host.hasAttribute('reorderable'));
        this.ready = collection.ready;
        const byValue = new Map(this.records.map(record => [record.source.value, record.item]));
        this.visible = derived.visible.map(value => byValue.get(value)!);
        this.presentations = new Map(derived.items.map(record => [byValue.get(record.value)!, record.presentation]));
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Invalid tree structure.';
        this.ready = false;
        this.visible = [];
        this.presentations.clear();
        // An invalid edit releases no hidden interactive default: keep known
        // items owned but inert until the author repairs the finite hierarchy.
        for (const { item } of previous) item.setTreePresentation?.(this, emptyTreeItemPresentation);
        this.callbacks.status(this.error, true);
        return;
      }
      for (const { item } of previous) if (!this.records.some(record => record.item === item)) item.releaseTreeOwner?.(this);
      for (const { item } of this.records) item.setTreeOwner?.(this);
      const focused = this.visible.find(item => item.hasTreeFocus?.());
      if (focused) {
        this.current = focused;
        this.focusOwner = { item: focused, root: this.host.getRootNode() as Document | ShadowRoot };
      }
      const owner = this.focusOwner;
      const displaced = Boolean(owner && !this.visible.includes(owner.item));
      let replacement: EnTreeItem | undefined;
      if (displaced && owner) {
        let parent = previous.find(record => record.item === owner.item)?.parent;
        while (parent) {
          if (this.visible.includes(parent)) { replacement = parent; break; }
          parent = previous.find(record => record.item === parent)?.parent;
        }
        if (!replacement) {
          const index = oldVisible.indexOf(owner.item);
          replacement = oldVisible.slice(index + 1).find(item => this.visible.includes(item))
            ?? oldVisible.slice(0, Math.max(0, index)).reverse().find(item => this.visible.includes(item));
        }
      }
      if (stateChanged && !this.host.matches(':focus-within')) {
        this.current = this.visible.find(item => treeSelectedKeys(presented).includes(item.value)) ?? this.visible[0] ?? null;
      } else if (!this.current || !this.visible.includes(this.current)) {
        this.current = replacement ?? this.visible.find(item => treeSelectedKeys(this.callbacks.presented()).includes(item.value)) ?? this.visible[0] ?? null;
      }
      this.syncPresentations();
      this.callbacks.status('', this.visible.length === 0);
      if (displaced && owner && this.canRecover(owner)) {
        this.focusOwner = undefined;
        if (this.current?.treeReady) this.current.focus();
        else if (!this.visible.length) this.callbacks.focusEmpty();
      }
    } finally { this.refreshing = false; }
  }

  private syncPresentations(): void {
    for (const { item } of this.records) {
      const p = this.presentations.get(item) ?? emptyTreeItemPresentation;
      item.setTreePresentation?.(this, { ...p, tabStop: item === this.current && this.visible.includes(item) ? 0 : -1 });
    }
  }
  /** Focus delegation keeps item internals private. */
  focusCurrent(options?: FocusOptions): boolean {
    if (!this.current?.treeReady || !this.visible.includes(this.current)) return false;
    this.current.focus(options);
    return true;
  }
  private canRecover(owner: FocusOwner): boolean {
    const document = this.host.ownerDocument;
    if (!this.connected || !this.host.isConnected || !document.hasFocus() || this.host.getRootNode() !== owner.root) return false;
    if (owner.item.hasTreeFocus?.()) return true;
    const empty = (root: Document | ShadowRoot, element: Element | null): boolean =>
      element === null || root === document && (element === document.body || element === document.documentElement);
    if (!empty(owner.root, owner.root.activeElement)) return false;
    let root = owner.root;
    while (root !== document) {
      const shadow = root as ShadowRoot;
      const outer = shadow.host.getRootNode() as Document | ShadowRoot;
      if (outer.activeElement !== shadow.host && !empty(outer, outer.activeElement)) return false;
      root = outer;
    }
    return true;
  }
  private eventItem(event: Event): EnTreeItem | undefined {
    const nearest = event.composedPath().find(node => node instanceof this.host.ownerDocument.defaultView!.Element && (node as Element).localName === 'en-tree-item');
    return this.records.find(record => record.item === nearest)?.item;
  }
  private allowedEvent(event: Event): boolean {
    if (this.callbacks.enabled?.() === false || event.defaultPrevented || !this.ready || this.error || unavailable(this.host)) return false;
    const first = event.composedPath()[0];
    return !(first instanceof this.host.ownerDocument.defaultView!.Element
      && (first as Element).matches(interactive) && !(first as Element).matches('[role="treeitem"]'));
  }
  private move(item: EnTreeItem | undefined): void {
    if (!item || !item.treeReady || !this.visible.includes(item)) return;
    this.current = item;
    this.syncPresentations();
    item.focus();
  }
  private propose(item: EnTreeItem, kind: 'selection' | 'expansion', operation: 'replace' | 'toggle' | 'range' | 'all' = 'toggle', fallback = ''): void {
    const record = this.records.find(record => record.item === item);
    if (!record || (item.disabled && operation !== 'all') || !this.visible.includes(item) || !item.treeReady) return;
    if (kind === 'expansion' && !this.presentations.get(item)?.branch) return;
    const previous = this.callbacks.snapshot();
    if (kind === 'selection' && previous.values === undefined && previous.value === item.value) return;
    const value = item.value;
    const available = this.visible.filter(item => !item.disabled).map(item => item.value);
    const anchor = this.selectionAnchor.resolve(previous, available, fallback);
    const next = kind === 'selection' ? treeSelection(previous, value, available, anchor, operation)
      : treeSnapshot(previous.value, previous.expanded.includes(value) ? previous.expanded.filter(key => key !== value) : [...previous.expanded, value], previous.values);
    this.callbacks.propose(next, kind, () => {
      if (!this.connected || !item.isConnected || (item.disabled && operation !== 'all') || item.value !== value || unavailable(this.host)) return false;
      try {
        const current = this.collect();
        const found = current.records.find(candidate => candidate.item === item);
        const derived = deriveTreePresentations(current.sources, previous);
        const enabled = new Set(current.records.filter(record => !record.source.disabled).map(record => record.source.value));
        const currentAvailable = derived.visible.filter(key => enabled.has(key));
        if (kind === 'selection' && previous.values && (currentAvailable.length !== available.length || currentAvailable.some((key, index) => key !== available[index]))) return false;
        return Boolean(found && found.parent === record.parent && derived.visible.includes(value)
          && (kind !== 'expansion' || derived.items.find(candidate => candidate.value === value)?.presentation.branch));
      } catch { return false; }
    });
    if (kind === 'selection') this.selectionAnchor.accept(next, value, operation, anchor, this.callbacks.snapshot());
  }
  private readonly click = (event: MouseEvent): void => {
    this.refresh();
    if (!this.allowedEvent(event)) return;
    const item = this.eventItem(event);
    if (!item || !this.visible.includes(item) || !item.isTreeRowEvent(event) || event.composedPath().some(node => isDOMElement(node) && node.hasAttribute('data-tree-drag'))) return;
    this.move(item);
    this.propose(item, item.isTreeIndicator(event) ? 'expansion' : 'selection', event.shiftKey ? 'range' : event.metaKey || event.ctrlKey ? 'toggle' : 'replace');
  };
  private readonly keydown = (event: KeyboardEvent): void => {
    this.refresh();
    if (!this.allowedEvent(event) || event.isComposing || event.altKey) return;
    const item = this.eventItem(event);
    if (!item || !this.visible.includes(item)) return;
    if (this.callbacks.snapshot().values && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
      event.preventDefault(); this.propose(item, 'selection', 'all'); return;
    }
    if (event.ctrlKey || event.metaKey) return;
    const selectMove = (target: EnTreeItem | undefined): void => {
      if (target && event.shiftKey && this.callbacks.snapshot().values) {
        this.propose(target, 'selection', 'range', item.value);
      }
      this.move(target);
    };
    const index = this.visible.indexOf(item);
    const rtl = this.host.ownerDocument.defaultView?.getComputedStyle(this.host).direction === 'rtl';
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const backward = rtl ? 'ArrowRight' : 'ArrowLeft';
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault(); selectMove(this.visible[Math.max(0, Math.min(this.visible.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)))]);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault(); selectMove(event.key === 'Home' ? this.visible[0] : this.visible[this.visible.length - 1]);
    } else if (event.key === forward) {
      event.preventDefault();
      const presentation = this.presentations.get(item);
      if (presentation?.branch && !presentation.expanded) this.propose(item, 'expansion');
      else if (presentation?.expanded) this.move(this.records.find(record => record.parent === item && this.visible.includes(record.item))?.item);
    } else if (event.key === backward) {
      event.preventDefault();
      if (this.presentations.get(item)?.expanded) this.propose(item, 'expansion');
      else this.move(this.records.find(record => record.item === item)?.parent ?? undefined);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault(); this.propose(item, 'selection', event.shiftKey ? 'range' : 'toggle');
    } else if (Array.from(event.key).length === 1) {
      const now = Date.now();
      const character = event.key.toLocaleLowerCase();
      this.search = now - this.searchAt > 700 ? character : this.search + character;
      this.searchAt = now;
      const repeated = Array.from(this.search).every(value => value === character);
      const prefix = repeated ? character : this.search;
      const start = repeated || prefix.length === 1 ? index + 1 : index;
      for (let offset = 0; offset < this.visible.length; offset++) {
        const target = this.visible[(start + offset) % this.visible.length]!;
        if (target.treeLabel().toLocaleLowerCase().startsWith(prefix)) { event.preventDefault(); this.move(target); break; }
      }
    }
  };
  private readonly focusin = (event: FocusEvent): void => {
    const item = this.eventItem(event);
    if (!item || !this.visible.includes(item)) return;
    this.current = item;
    this.focusOwner = { item, root: this.host.getRootNode() as Document | ShadowRoot };
    this.syncPresentations();
  };
  private readonly focusout = (event: FocusEvent): void => {
    const owner = this.focusOwner;
    if (!owner || !event.composedPath().includes(owner.item)) return;
    if (event.relatedTarget) this.focusOwner = undefined;
    queueMicrotask(() => {
      if (!this.connected) return;
      // Chromium emits focusout before delivering the removal mutation. Read
      // the live hierarchy before treating this as an ordinary blur; the last
      // visible snapshot still contains a just-removed focused descendant.
      this.refresh();
      if (this.focusOwner === owner && this.visible.includes(owner.item) && !owner.item.hasTreeFocus()) this.focusOwner = undefined;
      if (!this.host.matches(':focus-within') && event.relatedTarget) {
        this.current = this.visible.find(item => treeSelectedKeys(this.callbacks.presented()).includes(item.value)) ?? this.visible[0] ?? null;
        this.syncPresentations();
      }
    });
  };
}
