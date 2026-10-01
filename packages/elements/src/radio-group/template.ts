import { descriptionTemplate } from '@en-reve/primitives/templates/description.js';
import { html, nothing } from 'lit';

export interface RadioGroupView {
  readonly label: string;
  readonly description: string;
  readonly error?: string;
  readonly orientation: 'horizontal' | 'vertical';
  readonly disabled: boolean;
  readonly required: boolean;
}

export function radioGroupTemplate(view: RadioGroupView, onSlotChange: () => void, onKeyDown: (event: KeyboardEvent) => void) {
  return html`<div part="field" class="en-field">
    <div id="label" part="label" class="en-label"><slot name="label">${view.label}</slot></div>
    <div part="options" class="en-choice-group" data-orientation=${view.orientation} role="radiogroup"
      aria-labelledby="label" aria-describedby=${view.error ? 'description error' : 'description'} aria-invalid=${view.error ? 'true' : nothing}
      aria-orientation=${view.orientation} aria-disabled=${view.disabled ? 'true' : nothing}
      aria-required=${view.required ? 'true' : nothing} @keydown=${onKeyDown}>
      <slot @slotchange=${onSlotChange}></slot>
    </div>
    ${descriptionTemplate(view.description)}
    ${view.error ? html`<div id="error" part="error" class="en-error">${view.error}</div>` : nothing}
  </div>`;
}
