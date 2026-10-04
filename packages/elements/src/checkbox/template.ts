import { descriptionTemplate } from '@en-reve/primitives/templates/description.js';
import { html, nothing } from 'lit';

export interface ChoiceView {
  readonly kind: 'checkbox' | 'switch' | 'radio';
  readonly checked: boolean;
  readonly indeterminate?: boolean;
  readonly disabled: boolean;
  readonly required: boolean;
  readonly value: string;
  readonly label: string;
  readonly description: string;
  readonly error?: string;
  readonly tabIndex: number;
}

/** Native semantics and the label stay in one tree. The slot supplies label content. */
export function choiceTemplate(view: ChoiceView, onChange: (event: Event) => void) {
  return html`<div part="field" class="en-field">
    <label class="en-choice" part="label">
      <input id="control" part=${view.error ? 'control control-invalid' : 'control'} class=${`en-${view.kind}`} type=${view.kind === 'radio' ? 'radio' : 'checkbox'}
        role=${view.kind === 'switch' ? 'switch' : nothing}
        ?checked=${view.checked} aria-checked=${view.kind === 'checkbox' && view.indeterminate ? 'mixed' : nothing}
        .value=${view.value} ?disabled=${view.disabled} ?required=${view.required}
        tabindex=${view.tabIndex} aria-labelledby="label-text" aria-describedby=${view.error ? 'description error' : 'description'} aria-invalid=${view.error ? 'true' : nothing}
        @change=${onChange}>
      <span class="en-label" id="label-text" part="label-text" aria-hidden="true"><slot name="label"><slot>${view.label}</slot></slot></span>
    </label>
    ${descriptionTemplate(view.description)}
    ${view.error ? html`<div id="error" part="error" class="en-error">${view.error}</div>` : nothing}
  </div>`;
}
