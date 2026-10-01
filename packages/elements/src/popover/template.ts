import { overlayArrowTemplate } from '../internal/overlay-arrow.js';
import { nativeSurfaceBeforeToggle } from '../internal/native-surface.js';
import { html } from 'lit';

export interface PopoverView {
  arrow?: boolean;
  arrowPath?: string;
  label: string;
  closeLabel: string;
  dismiss: () => void;
  nativeToggle: (event: ToggleEvent) => void;
}

/** Nonmodal semantics are separate from the positioning and cancelable-state adapter. */
export function popoverTemplate(view: PopoverView) {
  return html`
    <div class="en-popover" part="surface" ?data-arrow=${view.arrow} popover="manual" role="dialog" aria-labelledby="en-popover-heading" tabindex="-1" inert @beforetoggle=${nativeSurfaceBeforeToggle} @toggle=${view.nativeToggle}>
      ${overlayArrowTemplate(!!view.arrow, view.arrowPath)}
      <div class="en-overlay-content" part="content">
      <h2 id="en-popover-heading" class="en-heading-small" part="heading"><slot name="label">${view.label}</slot></h2>
      <div class="en-overlay-body" part="body"><slot></slot></div>
      <button class="en-button en-button--quiet en-overlay-close" part="close" type="button" @click=${view.dismiss}>${view.closeLabel}</button>
      </div>
    </div>`;
}
