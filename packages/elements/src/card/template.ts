import { html } from 'lit';

export interface CardView {
  hasHeader: boolean;
  hasFooter: boolean;
  onSlotChange: (event: Event) => void;
}

export const cardTemplate = (view: CardView) => html`
  <div class="en-card" part="base">
    <div class="en-card__header" part="header" ?hidden=${!view.hasHeader}>
      <slot name="header" @slotchange=${view.onSlotChange}></slot>
    </div>
    <div class="en-card__body" part="content"><slot></slot></div>
    <div class="en-card__footer" part="footer" ?hidden=${!view.hasFooter}>
      <slot name="footer" @slotchange=${view.onSlotChange}></slot>
    </div>
  </div>
`;
