import { html } from 'lit';

export interface TabsView {
  readonly label: string;
  readonly orientation: 'horizontal' | 'vertical';
}

export function tabsTemplate(view: TabsView, onSlotChange: () => void) {
  return html`<div class="en-tabs" part="base" data-orientation=${view.orientation}>
    <div class="en-tab-list" part="tab-list" role="tablist" aria-label=${view.label} aria-orientation=${view.orientation}>
      <slot name="tab" @slotchange=${onSlotChange}></slot>
    </div>
    <div part="panels"><slot name="panel" @slotchange=${onSlotChange}></slot></div>
  </div>`;
}
