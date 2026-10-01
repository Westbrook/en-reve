import { html, nothing } from 'lit';

export function treeTemplate(view: { multiple: boolean; label: string; error: string; empty: boolean; slotChanged: () => void }) {
  return html`<div class="en-tree" part="base" role="tree" aria-multiselectable=${view.multiple ? 'true' : nothing} aria-label=${view.label} tabindex="-1">
    <slot @slotchange=${view.slotChanged}></slot>
  </div><p class="en-tree-error" role="alert" ?hidden=${!view.error}>${view.error || nothing}</p>`;
}
