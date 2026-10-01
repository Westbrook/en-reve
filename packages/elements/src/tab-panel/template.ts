import { html } from 'lit';

export function tabPanelTemplate() {
  return html`<div class="en-tab-panel" part="base"><slot></slot></div>`;
}
