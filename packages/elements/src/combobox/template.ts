import { nativeSurfaceBeforeToggle } from '../internal/native-surface.js';
import { html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { descriptionTemplate } from '@en-reve/primitives/templates/description.js';
import type { IndexedOption } from './model.js';

export interface ComboboxView {
  readonly label: string;
  readonly description: string;
  readonly error: string;
  readonly defaultValue: string;
  readonly placeholder: string;
  readonly autocomplete: string;
  readonly disabled: boolean;
  readonly readOnly: boolean;
  readonly required: boolean;
  readonly describedBy: string;
  readonly invalid: 'true' | typeof nothing;
  readonly open: boolean;
  readonly expanded: boolean;
  readonly fallback: boolean;
  readonly loading: boolean;
  readonly blocked: boolean;
  readonly selectedValue: string;
  readonly active?: IndexedOption;
  readonly options: readonly IndexedOption[];
  readonly toggleLabel: string;
  readonly status: string;
  readonly spaceStatus: string;
}
export interface ComboboxEvents {
  keydown(event: KeyboardEvent): void;
  keepInputFocus(event: MouseEvent): void;
  trigger(): void;
  optionClick(event: MouseEvent): void;
  focusout(): void;
  input(event: InputEvent): void;
}

/** Same-shadow relationships keep labels, active options and descriptions local. */
export function comboboxTemplate(view: ComboboxView, events: ComboboxEvents) {
  return html`<div class="en-field" part="field" ?data-invalid=${Boolean(view.error)}>
    <label id="control-label" class="en-label" part="label" for="control"><slot name="label">${view.label || nothing}</slot></label>
    <div class="en-combobox" @focusout=${events.focusout}>
    <div class="en-combobox-anchor en-field-focus-frame" part="focus-frame">
    <input id="control" class="en-input en-text-input en-combobox-input" part="control" type="text"
      role="combobox" aria-autocomplete="list" aria-haspopup="listbox" aria-expanded=${String(view.expanded)}
      aria-controls="listbox" aria-activedescendant=${view.expanded && !view.blocked ? view.active?.id ?? nothing : nothing}
      aria-describedby=${view.describedBy} aria-invalid=${view.invalid} aria-required=${String(view.required)}
      autocomplete=${view.autocomplete} value=${view.defaultValue} placeholder=${view.placeholder || nothing}
      ?disabled=${view.disabled} ?readonly=${view.readOnly}
      @keydown=${events.keydown} @input=${events.input}>
    <button class="en-combobox-trigger" part="trigger" type="button" tabindex="-1" aria-label=${view.toggleLabel}
      aria-haspopup="listbox" aria-expanded=${String(view.expanded)} aria-controls="listbox"
      ?disabled=${view.disabled || view.readOnly} @mousedown=${events.keepInputFocus} @click=${events.trigger}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6"></path></svg>
    </button>
    </div>
    <div class="en-combobox-popup" part="popup" inert @beforetoggle=${nativeSurfaceBeforeToggle} popover=${view.fallback ? nothing : 'manual'} ?data-fallback=${view.fallback} ?hidden=${view.fallback && !view.open}>
      <div id="listbox" class="en-combobox-listbox" part="listbox" role="listbox" aria-labelledby="control-label" aria-busy=${String(view.loading)}>
        ${repeat(view.options, option => option.value, option => html`<div id=${option.id} class="en-combobox-option"
          part=${`option${option.value === view.selectedValue ? ' option-selected' : ''}${!view.blocked && option.value === view.active?.value ? ' option-active' : ''}${option.disabled || view.blocked ? ' option-disabled' : ''}`}
          role="option" aria-selected=${String(option.value === view.selectedValue)} aria-disabled=${String(Boolean(option.disabled || view.blocked))}
          ?data-active=${!view.blocked && option.value === view.active?.value} data-value=${option.value}
          @mousedown=${events.keepInputFocus} @click=${events.optionClick}>
          <span part="option-label">${option.label}</span>
          <svg class="en-combobox-check" part="option-indicator" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m5 12 4 4L19 6"></path></svg>
        </div>`)}
      </div>
      <p class="en-combobox-status" part="status" role="status" aria-live="polite" aria-atomic="true">${view.status || nothing}</p>
    </div>
    </div>
    <p class="en-combobox-space-status" part="space-status" role="status" aria-live="polite" aria-atomic="true">${view.spaceStatus || nothing}</p>
    ${descriptionTemplate(view.description)}
    ${view.error ? html`<div class="en-error" part="error" id="error">${view.error}</div>` : nothing}
  </div>`;
}
