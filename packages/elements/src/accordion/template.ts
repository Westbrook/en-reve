import { html } from 'lit';

export function accordionTemplate(onSlotChange: () => void) {
  return html`<div class="en-accordion" part="base"><slot @slotchange=${onSlotChange}></slot></div>`;
}
