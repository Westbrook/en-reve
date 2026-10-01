import { dispatchNotification } from '@en-reve/primitives/interactions/events.js';
import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { treeIndex, idleTreeBranch, type TreeBranchState, type TreeLoadChildren } from '@en-reve/primitives/interactions/tree-operations.js';
import type { TreeDataItem } from '@en-reve/primitives/interactions/tree.js';

export type Host = HTMLElement & ReactiveControllerHost;
export interface Callbacks {
  items(): readonly TreeDataItem[] | undefined;
  expanded(): readonly string[];
  visible(key: string): boolean;
  loader(): TreeLoadChildren | undefined;
  commit(key: string, children: readonly TreeDataItem[]): void;
}
/** Request ownership is independent of row mounting and of other branch completions. */
export class TreeLazyController implements ReactiveController {
  message = '';
  private sequence = 0;
  private requests = new Map<string, { controller: AbortController; id: number }>();
  private states = new Map<string, TreeBranchState>();
  constructor(private host: Host, private callbacks: Callbacks) { host.addController(this); }
  state(key: string): TreeBranchState { return this.states.get(key) ?? idleTreeBranch; }
  private emit(key: string, state: TreeBranchState): void {
    state=Object.freeze(state);
    this.states.set(key, state);
    const label = treeIndex(this.callbacks.items() ?? []).get(key)?.item.label ?? key;
    this.message = `${label}: ${state.status === 'loading' ? 'loading children.' : state.status === 'error' ? 'could not load children. Use Retry.' : state.status === 'empty' ? 'folder is empty.' : state.status === 'loaded' ? 'children loaded.' : 'loading canceled.'}`;
    this.host.requestUpdate();
    dispatchNotification(this.host, 'en-load-state-change', { key, ...state });
    // A status listener can cancel or replace the branch synchronously.
    if(this.states.get(key)===state)dispatchNotification(this.host, 'en-load', { key, ...state });
  }
  cancel(key?: string): void {
    for (const [value, request] of [...this.requests]) if (key === undefined || value === key) {
      this.requests.delete(value); request.controller.abort(); this.emit(value, { status: 'idle', requestId: request.id });
    }
  }
  reset(): void { this.cancel(); this.states.clear(); }
  hostDisconnected(): void { this.reset(); }
  hostUpdated(): void {
    const items = this.callbacks.items();
    if (!items || !this.host.isConnected) return;
    const index = treeIndex(items), expanded = this.callbacks.expanded();
    for (const key of this.requests.keys()) if (!expanded.includes(key) || !this.callbacks.visible(key) || !index.has(key)) this.cancel(key);
    for (const [key, { item }] of index) if (item.lazy && !item.disabled && expanded.includes(key) && this.callbacks.visible(key) && this.state(key).status === 'idle') void this.load(key);
  }
  async load(key: string): Promise<boolean> {
    const loader = this.callbacks.loader(), items = this.callbacks.items();
    const item = items && treeIndex(items).get(key)?.item;
    if (!loader || !item || !(item.branch || item.lazy || item.children?.length) || item.disabled || !this.host.isConnected || !this.callbacks.expanded().includes(key) || !this.callbacks.visible(key) || this.requests.has(key)) return false;
    const request = { controller: new AbortController(), id: ++this.sequence };
    this.requests.set(key, request); this.emit(key, { status: 'loading', requestId: request.id });
    // The loading event may synchronously replace the source or cancel the request.
    if (this.requests.get(key) !== request) return false;
    try {
      const children = await loader(Object.freeze({ key, item, requestId: request.id, signal: request.controller.signal }));
      if (this.requests.get(key) !== request || request.controller.signal.aborted || !this.host.isConnected) return false;
      if (!this.callbacks.expanded().includes(key) || !this.callbacks.visible(key)) { this.cancel(key); return false; }
      this.callbacks.commit(key, children);
      this.requests.delete(key);
      this.emit(key, { status: children.length ? 'loaded' : 'empty', requestId: request.id });
      return true;
    } catch {
      if (this.requests.get(key) !== request || request.controller.signal.aborted) return false;
      this.requests.delete(key); this.emit(key, { status: 'error', requestId: request.id }); return false;
    }
  }
}
