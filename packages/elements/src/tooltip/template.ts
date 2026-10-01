import { overlayArrowTemplate } from '../internal/overlay-arrow.js';
import { html } from 'lit';

export interface TooltipView {
  arrow?: boolean;
  arrowPath?: string;
  contentSlotChange: () => void;
  nativeToggle: (event: ToggleEvent) => void;
  pointerEnter: (event: PointerEvent) => void;
  pointerLeave: (event: PointerEvent) => void;
  pointerMove: (event: PointerEvent) => void;
}

/** The actual description target is the slotted light-DOM content, not this surface. */
export function tooltipTemplate(view: TooltipView) {
  return html`
    <div class="en-tooltip" part="surface" ?data-arrow=${view.arrow} popover="manual" @toggle=${view.nativeToggle}
      @pointerenter=${view.pointerEnter} @pointerleave=${view.pointerLeave} @pointermove=${view.pointerMove}>
      ${overlayArrowTemplate(!!view.arrow, view.arrowPath)}
      <div class="en-overlay-content" part="content"><slot name="content" @slotchange=${view.contentSlotChange}></slot></div>
    </div>`;
}
