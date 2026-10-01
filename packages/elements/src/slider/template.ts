import { descriptionTemplate } from '@en-reve/primitives/templates/description.js';
import { html, nothing, type TemplateResult } from 'lit';

export interface SliderView {
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly disabled: boolean;
  readonly orientation: 'horizontal' | 'vertical';
  readonly label: string;
  readonly description: string;
  readonly showValue: boolean;
  readonly valueText: string;
  readonly editable: boolean;
  readonly editorLabel: string;
  readonly defaultEditorValue: string;
  readonly editorError: string;
  readonly showEditorError: boolean;
  readonly applicationError?: string;
}

export interface SliderHandlers {
  readonly rangeInput: (event: Event) => void;
  readonly editorInput: (event: Event) => void;
  readonly editorChange: (event: Event) => void;
  readonly editorBlur: (event: FocusEvent) => void;
  readonly editorKeyDown: (event: KeyboardEvent) => void;
  readonly editorCompositionEnd: (event: CompositionEvent) => void;
}

export function sliderTemplate(view: SliderView, handlers: SliderHandlers, exactEditor?: TemplateResult) {
  const editorDescription = view.editorError && view.showEditorError ? 'description editor-error' : 'description';
  return html`<div part="field" class="en-field">
    <label id="label" part="label" class="en-label" for="control"><slot name="label"><slot>${view.label}</slot></slot></label>
    <div part="row" class="en-range-row" data-orientation=${view.orientation} data-editable=${view.editable ? '' : nothing}>
      <input id="control" part="control" class="en-range" type="range"
        value=${String(view.value)} min=${view.min} max=${view.max} step=${view.step}
        ?disabled=${view.disabled} aria-orientation=${view.orientation} aria-valuetext=${view.valueText || nothing}
        aria-describedby=${view.applicationError ? 'description editor-error' : 'description'}
        aria-invalid=${view.applicationError ? 'true' : nothing} @input=${handlers.rangeInput}>
      ${view.editable ? exactEditor ?? html`
        <span id="editor-label" part="editor-label" class="en-sr-only"><slot name="editor-label">${view.editorLabel}</slot></span>
        <input id="editor" part="editor" class="en-input en-range-editor" type="number"
          value=${view.defaultEditorValue} min=${view.min} max=${view.max} step=${view.step} required
          ?disabled=${view.disabled} aria-labelledby="label editor-label"
          aria-describedby=${editorDescription} aria-invalid=${view.editorError && view.showEditorError ? 'true' : nothing}
          @input=${handlers.editorInput} @change=${handlers.editorChange} @blur=${handlers.editorBlur}
          @keydown=${handlers.editorKeyDown} @compositionend=${handlers.editorCompositionEnd}>` : nothing}
      ${view.showValue ? html`<output part="output" for="control">${view.valueText || view.value}</output>` : nothing}
    </div>
    ${descriptionTemplate(view.description)}
    ${view.editorError ? html`<p id="editor-error" part="error" class="en-error en-range-error"
      data-pending=${!view.showEditorError ? '' : nothing} aria-hidden=${!view.showEditorError ? 'true' : nothing}>${view.editorError}</p>` : nothing}
  </div>`;
}
