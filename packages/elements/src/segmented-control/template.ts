import { SELECTION_SLOT_PREFIX } from '@en-reve/primitives/interactions/selection-children.js';
import { descriptionTemplate } from '@en-reve/primitives/templates/description.js';
import { html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';

export interface SegmentedItem {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

export interface SegmentedOptionView extends SegmentedItem {
  readonly key?: string;
  readonly projected?: boolean;
  readonly hidden?: boolean;
}

export interface SegmentedView {
  readonly items: readonly SegmentedOptionView[];
  readonly value: string;
  readonly tabValue: string | undefined;
  readonly label: string;
  readonly description: string;
  readonly disabled: boolean;
  readonly required: boolean;
  readonly error?: string;
}

/** Enabled choices share a native radio name in this one shadow tree, including during SSR. */
export function segmentedTemplate(view: SegmentedView, onChange: (event: Event) => void,
  onKeyDown: (event: KeyboardEvent) => void, onFocusIn: (event: FocusEvent) => void, onFocusOut: (event: FocusEvent) => void,
  onClick: (event: MouseEvent) => void) {
  const visible = view.items.filter(item => !item.hidden);
  return html`<fieldset class="en-fieldset en-field" part="field" ?disabled=${view.disabled}
      aria-describedby=${view.error ? 'description child-error' : 'description'} aria-invalid=${view.error ? 'true' : nothing}>
    <legend class="en-legend en-label" part="label"><slot name="label">${view.label}</slot></legend>
    <div class="en-segmented-control" part="options" @click=${onClick} @keydown=${onKeyDown} @focusin=${onFocusIn} @focusout=${onFocusOut}>
      ${repeat(view.items, (item) => item.key ?? item.value, (item) => html`
        <label class="en-segmented-item" part=${['option', item === visible[0] ? 'option-start' : 'option-joined', item === visible.at(-1) ? 'option-end' : '', item.value === view.value ? 'option-selected' : '', view.disabled || item.disabled ? 'option-disabled' : 'option-enabled'].filter(Boolean).join(' ')} data-selected=${item.value === view.value ? '' : nothing}
          data-disabled=${view.disabled || item.disabled ? '' : nothing} ?hidden=${item.hidden}>
          <input class="en-segmented-input en-sr-only" part="control" type="radio" name=${item.disabled || item.hidden ? nothing : 'choice'}
            value=${item.value} ?checked=${item.value === view.value} ?disabled=${view.disabled || item.disabled || item.hidden}
            ?required=${view.required} tabindex=${!view.disabled && !item.disabled && !item.hidden && item.value === view.tabValue ? 0 : -1}
            aria-describedby=${view.error ? 'description child-error' : 'description'} aria-invalid=${view.error ? 'true' : nothing} @change=${onChange}>
          <span class="en-segmented-label" part="option-label" ?data-rich=${item.projected}>${item.projected
            ? html`<slot name=${`${SELECTION_SLOT_PREFIX}${item.key}`}></slot>`
            : item.label || nothing}</span>
        </label>`)}
    </div>
    ${descriptionTemplate(view.description)}
    ${view.error ? html`<p id="child-error" class="en-error" part="error" role="status">${view.error}</p>` : nothing}
  </fieldset>`;
}
