import { html } from 'lit';

export function tabTemplate() {
  return html`<span class="en-tab" part="base"><slot></slot></span>`;
}
