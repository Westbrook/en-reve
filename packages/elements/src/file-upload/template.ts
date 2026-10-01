import { html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
export interface FileUploadView {
  files: readonly File[]; label: string; description: string; accept: string;
  multiple: boolean; disabled: boolean; required: boolean; dragging: boolean;
  error: string; invalid: boolean; chooseLabel: string; dropLabel: string;
  removeLabel: (file: File) => string;
  select: (event: Event) => void; preparePicker: () => void; cancelPicker: () => void;
  remove: (file: File) => void;
}
export function fileUploadTemplate(view: FileUploadView) {
  return html`
    <div class="en-field" part="field">
      <label id="label" class="en-label" part="label" for="control"><slot name="label">${view.label}</slot></label>
      <div class="en-file-drop" part="dropzone" ?data-dragging=${view.dragging} ?data-disabled=${view.disabled} ?data-invalid=${view.invalid}>
        <span part="choose-label" aria-hidden="true">${view.chooseLabel}</span>
        <span class="en-file-hint" part="drop-label" aria-hidden="true">${view.dropLabel}</span>
        <input id="control" class="en-file-input" part="control" type="file" accept=${view.accept || nothing}
          ?multiple=${view.multiple} ?disabled=${view.disabled} ?required=${view.required}
          aria-labelledby="label" aria-describedby="description error" aria-invalid=${view.invalid ? 'true' : nothing}
          @click=${view.preparePicker} @cancel=${view.cancelPicker} @change=${view.select}>
      </div>
      <div id="description" class="en-description" part="description"><slot name="description"><span class="en-description-fallback">${view.description}</span></slot></div>
      <ul class="en-file-list" part="list" role="list" ?hidden=${!view.files.length}>
        ${repeat(view.files, (file) => file, (file) => html`
          <li class="en-file-item" part="file">
            <span class="en-file-name" part="file-name">${file.name}</span>
            <en-button class="en-file-remove" part="remove-button" exportparts="control:remove" size="inherit" variant="ghost" icon-only
              ?disabled=${view.disabled} @click=${() => view.remove(file)}>
              <en-icon slot="prefix" name="close" size="inherit"></en-icon>
              <span slot="label">${view.removeLabel(file)}</span>
            </en-button>
          </li>
        `)}
      </ul>
      <div id="error" class="en-error en-file-error" part="error" role="status">${view.error}</div>
    </div>
  `;
}
