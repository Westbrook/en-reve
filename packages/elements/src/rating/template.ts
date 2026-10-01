import { descriptionTemplate } from '@en-reve/primitives/templates/description.js';
import { html, nothing } from 'lit';

export interface RatingView {
  readonly value: number;
  readonly max: number;
  readonly disabled: boolean;
  readonly label: string;
  readonly description: string;
  readonly error?: string;
  readonly optionLabel: (value: number, max: number) => string;
}

/** A radio group gives every discrete score a name, including the unrated state. */
export function ratingTemplate(view: RatingView, onChange: (event: Event) => void) {
  const option = (value: number) => html`
    <label class=${value === 0 ? 'en-rating-clear' : 'en-rating-item'} part=${value === 0 ? 'option clear-option' : 'option star-option'}
      data-selected=${view.value === value ? '' : nothing}>
      <input part="control" class="en-rating-input en-sr-only" type="radio" name="rating" value=${value}
        ?checked=${view.value === value} aria-label=${view.optionLabel(value, view.max)} @change=${onChange}>
      ${value === 0 ? html`<span>${view.optionLabel(0, view.max)}</span>`
        : html`<span class="en-rating-star" part="star" data-filled=${value <= view.value ? '' : nothing}
            aria-hidden="true">${value <= view.value ? '★' : '☆'}</span>`}
    </label>`;
  return html`<fieldset part="field" class="en-fieldset en-rating-field" ?disabled=${view.disabled}
      aria-describedby=${view.error ? 'description error' : 'description'} aria-invalid=${view.error ? 'true' : nothing}>
    <legend part="label" class="en-label en-legend"><slot name="label"><slot>${view.label}</slot></slot></legend>
    <div class="en-rating" part="options">
      ${option(0)}
      <div class="en-rating-values" part="star-options">
        ${Array.from({ length: view.max }, (_, index) => option(index + 1))}
      </div>
    </div>
    ${descriptionTemplate(view.description)}
    ${view.error ? html`<div id="error" part="error" class="en-error">${view.error}</div>` : nothing}
  </fieldset>`;
}
