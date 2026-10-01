import { isDOMElement, isDOMShadowRoot } from '../internal/dom-kind.js';
import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { VirtualCollection } from '@en-reve/primitives/state/virtual-collection.js';
import { VirtualCollectionController, type ScrollToKeyOptions } from '@en-reve/primitives/interactions/virtual-collection.js';
import { beginScrollIntoView, normalizeScrollOptions } from '@en-reve/primitives/interactions/scroll-into-view.js';
import { deriveTreeDataRows, treeSnapshot, treeSelection, treeSelectedKeys, TreeSelectionAnchor, type TreeDataItem, type TreeDataRow, type TreeSnapshot } from '@en-reve/primitives/interactions/tree.js';

export type Host = HTMLElement & ReactiveControllerHost & { readonly renderRoot: DocumentFragment | HTMLElement; readonly updateComplete: Promise<boolean> };
export interface Callbacks {
  items(): readonly TreeDataItem[] | undefined;
  virtualize(): boolean;
  snapshot(): TreeSnapshot;
  presented(): TreeSnapshot;
  propose(next: TreeSnapshot, reason: 'selection' | 'expansion', valid: () => boolean): void;
}

/** Model-owned tree interaction. Mounted rows are presentation, never the source of hierarchy. */
export class TreeDataController implements ReactiveController {
  readonly model = new VirtualCollection<TreeDataRow>({ items: [], key: row => row.item.value, estimateSize: 48, initialCount: 20 });
  readonly virtual: VirtualCollectionController<TreeDataRow>;
  rows: readonly TreeDataRow[] = [];
  byKey = new Map<string, TreeDataRow>();
  current = '';
  error = '';
  private previousItems?: readonly TreeDataItem[];
  private previousState?: TreeSnapshot;
  private connected = false;
  private observer?: MutationObserver;
  private readonly selectionAnchor = new TreeSelectionAnchor();
  private search = '';
  private searchAt = 0;
  private focusRequest = 0;
  constructor(private readonly host: Host, private readonly callbacks: Callbacks) {
    host.addController(this);
    this.virtual = new VirtualCollectionController(host, this.model, {
      viewport: () => this.viewport,
      content: () => this.content,
      enabled: () => callbacks.items() !== undefined && callbacks.virtualize() && !this.error,
      rows: () => this.host.renderRoot.querySelectorAll<HTMLElement>('[data-en-virtual-key]'),
      rowFor: active => this.rowFor(active),
    });
  }
  get viewport(): HTMLElement | null { return this.host.renderRoot.querySelector('[part~="viewport"]'); }
  get content(): HTMLElement | null { return this.host.renderRoot.querySelector('[role="tree"]'); }
  private rowFor(active: Element | null): HTMLElement | null {
    const wrapper = active?.closest<HTMLElement>('[data-en-tree-key]');
    return wrapper?.getRootNode() === this.host.renderRoot ? wrapper.querySelector<HTMLElement>(':scope > [data-en-virtual-key]') : null;
  }
  hostConnected(): void {
    this.connected = true;
    this.host.addEventListener('keydown', this.keydown);
    this.host.addEventListener('click', this.click);
    this.host.addEventListener('focusin', this.focusin);
    const Observer = this.host.ownerDocument.defaultView?.MutationObserver;
    if (Observer) {
      this.observer = new Observer(() => { if (this.callbacks.items() !== undefined) this.host.requestUpdate(); });
      this.observer.observe(this.host, { childList: true });
    }
  }
  hostDisconnected(): void {
    this.connected = false; this.selectionAnchor.reset();
    this.focusRequest++;
    this.host.removeEventListener('keydown', this.keydown);
    this.host.removeEventListener('click', this.click);
    this.host.removeEventListener('focusin', this.focusin);
    this.observer?.disconnect();
  }
  refresh(): void {
    const items = this.callbacks.items();
    if (items === undefined) {
      this.error = '';
      if (this.previousItems !== undefined) {
        this.focusRequest++;
        this.previousItems = undefined; this.previousState = undefined;
        this.rows = []; this.byKey.clear();
        this.setCurrent('');
        this.model.setItems([]);
        this.selectionAnchor.reset(); this.search = ''; this.searchAt = 0;
      }
      return;
    }
    this.error = Array.from(this.host.children ?? []).some(child => child.localName !== 'template')
      ? 'Tree data items cannot be mixed with authored child elements.' : '';
    const snapshot = this.callbacks.presented();
    if (items === this.previousItems && snapshot === this.previousState) return;
    const previous = this.rows;
    const active = this.connected ? this.host.renderRoot?.querySelector<HTMLElement>('[data-en-tree-key]:focus') : undefined;
    const activeKey = active?.getAttribute('data-en-tree-key');
    this.rows = deriveTreeDataRows(items, snapshot);
    this.byKey = new Map(this.rows.map(row => [row.item.value, row]));
    this.previousItems = items; this.previousState = snapshot;
    const selectedEntry = treeSelectedKeys(snapshot).find(key => this.byKey.has(key));
    let next = this.current;
    if (!this.byKey.has(next)) {
      let parent = previous.find(row => row.item.value === next)?.parentValue;
      while (parent && !this.byKey.has(parent)) parent = previous.find(row => row.item.value === parent)?.parentValue;
      const index = previous.findIndex(row => row.item.value === next);
      next = parent ?? previous.slice(index + 1).find(row => this.byKey.has(row.item.value))?.item.value
        ?? previous.slice(0, Math.max(0, index)).reverse().find(row => this.byKey.has(row.item.value))?.item.value
        ?? (selectedEntry ?? this.rows[0]?.item.value) ?? '';
    } else if (!activeKey && selectedEntry) next = selectedEntry;
    this.model.setItems(this.rows);
    this.setCurrent(next);
    if (activeKey && !this.byKey.has(activeKey)) {
      const request = ++this.focusRequest;
      void this.host.updateComplete.then(() => {
        if (request !== this.focusRequest || !this.connected) return;
        const rootActive = isDOMShadowRoot(this.host.renderRoot) ? this.host.renderRoot.activeElement : this.host.ownerDocument.activeElement;
        if (rootActive && rootActive !== active && rootActive !== this.host.ownerDocument.body) return;
        this.wrapper(this.current)?.focus({ preventScroll: true });
        if (!this.current) this.content?.focus({ preventScroll: true });
      });
    }
  }
  private setCurrent(key: string): void {
    if (key === this.current) return;
    if (this.current) this.virtual.unpin(this.current);
    this.current = key;
    if (key) this.virtual.pin(key);
    this.host.requestUpdate();
  }
  private wrapper(key: string): HTMLElement | undefined {
    return Array.from(this.host.renderRoot.querySelectorAll<HTMLElement>('[data-en-tree-key]')).find(row => row.getAttribute('data-en-tree-key') === key);
  }
  focusCurrent(options?: FocusOptions): boolean {
    this.refresh();
    if (!this.current || this.error) return false;
    const row = this.wrapper(this.current);
    if (row) {
      row.focus({ ...options, preventScroll: true });
      if (!options?.preventScroll) this.scrollToKey(this.current, { block: 'nearest', inline: 'nearest' });
    }
    else void this.focusKey(this.current, options);
    return true;
  }
  scrollToKey(key: string, options: ScrollToKeyOptions = {}): boolean {
    this.refresh();
    const normalized = normalizeScrollOptions(options);
    if (!this.byKey.has(key) || this.error) return false;
    if (this.callbacks.virtualize()) return this.virtual.scrollToKey(key, options);
    const row = this.wrapper(key)?.querySelector<HTMLElement>(':scope > [data-en-virtual-key]');
    if (!row || !this.viewport) return false;
    beginScrollIntoView(row, normalized, { viewport: this.viewport, blockStart: 0, blockEnd: 0 });
    return true;
  }
  async focusKey(key: string, options?: FocusOptions): Promise<void> {
    if (!this.byKey.has(key)) return;
    this.setCurrent(key);
    const request = ++this.focusRequest;
    await this.host.updateComplete;
    if (!this.connected || request !== this.focusRequest || !this.byKey.has(key)) return;
    this.wrapper(key)?.focus({ ...options, preventScroll: true });
    if (!options?.preventScroll) this.scrollToKey(key, { block: 'nearest', inline: 'nearest' });
  }
  private eventRow(event: Event): TreeDataRow | undefined {
    const wrapper = event.composedPath().find(node => node instanceof this.host.ownerDocument.defaultView!.Element
      && (node as Element).hasAttribute('data-en-tree-key')) as HTMLElement | undefined;
    return wrapper?.getRootNode() === this.host.renderRoot ? this.byKey.get(wrapper.getAttribute('data-en-tree-key')!) : undefined;
  }
  private allowed(event: Event): boolean {
    return this.callbacks.items() !== undefined && !this.error && !event.defaultPrevented
      && !this.host.matches('[hidden],[inert],[aria-hidden="true"]');
  }
  private propose(row: TreeDataRow, reason: 'selection' | 'expansion', operation: 'replace' | 'toggle' | 'range' | 'all' = 'toggle', fallback = ''): void {
    if (row.item.disabled && operation !== 'all' || reason === 'expansion' && !row.presentation.branch) return;
    const state = this.callbacks.snapshot();
    const key = row.item.value;
    if (reason === 'selection' && state.values === undefined && state.value === key) return;
    const items = this.callbacks.items();
    const available = this.rows.filter(row => !row.item.disabled).map(row => row.item.value);
    const anchor = this.selectionAnchor.resolve(state, available, fallback);
    const next = reason === 'selection' ? treeSelection(state, key, available, anchor, operation)
      : treeSnapshot(state.value, state.expanded.includes(key) ? state.expanded.filter(value => value !== key) : [...state.expanded, key], state.values);
    this.callbacks.propose(next, reason, () => this.connected && this.callbacks.items() === items
      && this.byKey.get(key)?.item === row.item && (!row.item.disabled || operation === 'all') && !this.error
      && !this.host.matches('[hidden],[inert],[aria-hidden="true"]'));
    if (reason === 'selection') this.selectionAnchor.accept(next, key, operation, anchor, this.callbacks.snapshot());
  }
  private readonly click = (event: MouseEvent): void => {
    this.refresh(); if (!this.allowed(event) || event.composedPath().some(node => isDOMElement(node) && node.hasAttribute('data-tree-drag'))) return;
    const row = this.eventRow(event); if (!row) return;
    void this.focusKey(row.item.value);
    this.propose(row, event.composedPath().some(node => node instanceof this.host.ownerDocument.defaultView!.Element
      && (node as Element).classList.contains('en-tree-indicator')) ? 'expansion' : 'selection', event.shiftKey ? 'range' : event.metaKey || event.ctrlKey ? 'toggle' : 'replace');
  };
  private readonly focusin = (event: FocusEvent): void => {
    if (!this.allowed(event)) return;
    const row = this.eventRow(event); if (row) this.setCurrent(row.item.value);
  };
  private readonly keydown = (event: KeyboardEvent): void => {
    this.refresh();
    if (!this.allowed(event) || event.isComposing || event.altKey) return;
    const row = this.eventRow(event); if (!row) return;
    if (this.callbacks.snapshot().values && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
      event.preventDefault(); this.propose(row, 'selection', 'all'); return;
    }
    if (event.ctrlKey || event.metaKey) return;
    const index = row.index;
    const rtl = this.host.ownerDocument.defaultView?.getComputedStyle(this.host).direction === 'rtl';
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const backward = rtl ? 'ArrowRight' : 'ArrowLeft';
    let next: TreeDataRow | undefined;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault(); next = this.rows[Math.max(0, Math.min(this.rows.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)))];
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault(); next = event.key === 'Home' ? this.rows[0] : this.rows[this.rows.length - 1];
    } else if (event.key === forward) {
      event.preventDefault();
      if (row.presentation.branch && !row.presentation.expanded) this.propose(row, 'expansion');
      else if (row.presentation.expanded && this.rows[index + 1]?.parentValue === row.item.value) next = this.rows[index + 1];
    } else if (event.key === backward) {
      event.preventDefault();
      if (row.presentation.expanded) this.propose(row, 'expansion');
      else if (row.parentValue) next = this.byKey.get(row.parentValue);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault(); this.propose(row, 'selection', event.shiftKey ? 'range' : 'toggle');
    } else if (Array.from(event.key).length === 1) {
      const now = Date.now(); const character = event.key.toLocaleLowerCase();
      this.search = now - this.searchAt > 700 ? character : this.search + character; this.searchAt = now;
      const repeated = Array.from(this.search).every(value => value === character);
      const prefix = repeated ? character : this.search;
      const start = repeated || prefix.length === 1 ? index + 1 : index;
      for (let offset = 0; offset < this.rows.length; offset++) {
        const target = this.rows[(start + offset) % this.rows.length]!;
        if (target.item.label.toLocaleLowerCase().startsWith(prefix)) { event.preventDefault(); next = target; break; }
      }
    }
    if (next) {
      if (event.shiftKey && ['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) && this.callbacks.snapshot().values) {
        this.propose(next, 'selection', 'range', row.item.value);
      }
      void this.focusKey(next.item.value);
    }
  };
}
