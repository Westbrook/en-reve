import { html, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import type { TreeItemPresentation } from '@en-reve/primitives/interactions/tree.js';

export interface TreeItemView {
  readonly presentation: TreeItemPresentation;
  readonly label: string;
  readonly disabled: boolean;
  readonly reorderable: boolean;
  readonly slotChanged: () => void;
}

/** Fixed structure keeps the request-local SSR presentation hydratable. */
export function treeItemTemplate({ presentation: p, label, disabled, reorderable, slotChanged }: TreeItemView) {
  return html`<div class="en-tree-item" part="base" role="treeitem" tabindex=${p.tabStop}
    aria-keyshortcuts=${ifDefined(reorderable ? 'Alt+M' : undefined)} aria-labelledby="label" aria-selected=${String(p.selected)} aria-disabled=${String(disabled)}
    aria-expanded=${ifDefined(p.branch ? String(p.expanded) : undefined)}
    aria-level=${p.level} aria-posinset=${p.posInSet} aria-setsize=${p.setSize}>
    <div class="en-tree-option" part="option" ?data-reorderable=${reorderable && !disabled}>
      <span class="en-tree-indicator" part="indicator" aria-hidden="true" ?hidden=${!p.branch}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 5 7 7-7 7" /></svg>
      </span>
      <slot name="prefix" aria-hidden="true"></slot>
      <span id="label" class="en-tree-label" part="label"><slot name="label" @slotchange=${slotChanged}>${label || nothing}</slot></span>
      <slot name="suffix" aria-hidden="true"></slot>
      ${reorderable && !disabled ? html`<span data-tree-drag part="drag-handle" class="en-tree-drag" aria-hidden="true">⠿</span>` : nothing}
    </div>
    <div class="en-tree-group" part="group" role="group" ?hidden=${!p.expanded}>
      <slot name="children" @slotchange=${slotChanged}></slot>
    </div>
  </div>`;
}
