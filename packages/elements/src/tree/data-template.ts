import { html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import type { TreeDataRow } from '@en-reve/primitives/interactions/tree.js';
import type { VirtualCollection } from '@en-reve/primitives/state/virtual-collection.js';

import type { TreeBranchState } from '@en-reve/primitives/interactions/tree-operations.js';

export interface View {
  reorderable: boolean; branchState(key: string): TreeBranchState;
  multiple: boolean; label: string;
  error: string;
  virtualize: boolean;
  current: string;
  rows: readonly TreeDataRow[];
  byKey: ReadonlyMap<string, TreeDataRow>;
  model: VirtualCollection<TreeDataRow>;
}
interface Gap { kind: 'gap'; key: string; size: number; }
interface Node { kind: 'item'; key: string; row: TreeDataRow; }

/** Keep native parent/group ownership while windowing measured visual rows. */
export function treeDataTemplate(view: View) {
  const { rows, byKey, model } = view;
  const retained = new Map<string, TreeDataRow>();
  const include = (row: TreeDataRow): void => {
    if (retained.has(row.item.value)) return;
    retained.set(row.item.value, row);
    const parent = row.parentValue ? byKey.get(row.parentValue) : undefined;
    if (parent) include(parent);
  };
  if (view.virtualize) {
    for (const entry of model.entries) if (entry.kind === 'item') include(entry.item);
  } else for (const row of rows) retained.set(row.item.value, row);
  const groups = new Map<string | null, TreeDataRow[]>();
  for (const row of [...retained.values()].sort((a, b) => a.index - b.index)) {
    const siblings = groups.get(row.parentValue) ?? [];
    siblings.push(row); groups.set(row.parentValue, siblings);
  }
  const range = (parent: string | null, start: number, end: number): unknown => {
    const entries: (Gap | Node)[] = [];
    let cursor = start;
    const gap = (until: number): void => {
      if (until > cursor) entries.push({ kind: 'gap', key: `gap:${cursor}`, size: model.offsetOf(until) - model.offsetOf(cursor) });
    };
    for (const row of groups.get(parent) ?? []) {
      gap(row.index);
      entries.push({ kind: 'item', key: row.item.value, row });
      cursor = row.end;
    }
    gap(end);
    return repeat(entries, entry => `${entry.kind}:${entry.key}`, entry => {
      if (entry.kind === 'gap') return html`<div data-en-virtual-gap role="presentation" aria-hidden="true" style=${`block-size:${entry.size}px;flex:none`}></div>`;
      const { row } = entry; const p = row.presentation; const state = view.branchState(row.item.value);
      const status = state.status === 'loading' ? 'Loading…' : state.status === 'error' ? 'Load failed. Retry below.' : state.status === 'empty' ? 'Empty folder' : row.item.lazy ? 'Not loaded' : '';
      return html`<div class="en-tree-item" part="item" role="treeitem" data-en-tree-key=${row.item.value}
        tabindex=${row.item.value === view.current ? 0 : -1} aria-label=${row.item.label}
        aria-keyshortcuts=${ifDefined(view.reorderable ? 'Alt+M' : undefined)} aria-selected=${String(p.selected)} aria-disabled=${String(Boolean(row.item.disabled))}
        aria-busy=${ifDefined(state.status === 'loading' ? 'true' : undefined)} aria-description=${ifDefined(status || undefined)}
        aria-expanded=${ifDefined(p.branch ? String(p.expanded) : undefined)}
        aria-level=${p.level} aria-posinset=${p.posInSet} aria-setsize=${p.setSize}>
        <div class="en-tree-row" data-en-virtual-key=${row.item.value}>
        <div class="en-tree-option" part="option" ?data-reorderable=${view.reorderable && !row.item.disabled}>
          <span class="en-tree-indicator" part="indicator" aria-hidden="true" ?hidden=${!p.branch}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 5 7 7-7 7" /></svg>
          </span>
          <span class="en-tree-label" part="label">${row.item.label}</span>
          ${status && state.status !== 'loading' ? html`<span part="branch-status" class="en-tree-branch-status" aria-hidden="true">${status}</span>` : nothing}
          ${view.reorderable && !row.item.disabled ? html`<span data-tree-drag part="drag-handle" class="en-tree-drag" aria-hidden="true">⠿</span>` : nothing}
        </div>
        ${p.expanded && state.status === 'loading' ? html`<div class="en-tree-loading" part="branch-loading" data-tree-loading aria-hidden="true" inert>
          <span>Loading…</span>
        </div>` : nothing}
        </div>
        ${p.branch ? html`<div class="en-tree-group" part="group" role="group" ?hidden=${!p.expanded}>${p.expanded ? range(row.item.value, row.index + 1, row.end) : nothing}</div>` : nothing}
      </div>`;
    });
  };
  return html`<div class="en-tree-data-viewport" part="viewport" ?data-virtualize=${view.virtualize}>
    <div class="en-tree en-tree-data" part="base" role="tree" aria-multiselectable=${view.multiple ? 'true' : nothing} aria-label=${view.label} tabindex="-1">
      ${view.error ? nothing : range(null, 0, rows.length)}
    </div>
  </div><p class="en-tree-error" role="alert" ?hidden=${!view.error}>${view.error || nothing}</p>`;
}
