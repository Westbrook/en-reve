import { html } from 'lit';

export function splitterTemplate(orientation: 'horizontal' | 'vertical') {
  return html`<div class="en-split-separator" part="base" data-orientation=${orientation} aria-hidden="true"><span class="en-split-grip" part="grip"></span></div>`;
}
