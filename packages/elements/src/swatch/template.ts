import { html, nothing } from 'lit';

export interface SwatchView {
  color: string;
  label: string;
  disabled: boolean;
  onActivate: (event: MouseEvent) => void;
}

export const swatchTemplate = (view: SwatchView) => html`
  <button class="en-control en-swatch__sample" part="control sample" type="button"
    ?disabled=${view.disabled} @click=${view.onActivate}>
    <span class="en-swatch__color" part="color" aria-hidden="true"
      style=${view.color ? `background-color: ${view.color}` : nothing}></span>
    <span class="en-sr-only" part="label"><slot name="label">${view.label}</slot></span>
  </button>
`;
