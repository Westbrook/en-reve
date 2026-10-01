import { applicationValidation } from '../forms-private/validation-feedback.js';
import type { PropertyValues } from 'lit';
import { EnElement } from '../internal/en-element.js';
import { foundationStyles, blockHostStyles } from '@en-reve/styles/foundations.js';
import { formStyles } from '@en-reve/styles/controls.js';
import { fileUploadStyles } from '@en-reve/styles/file-upload.js';
import { FormController, type FormValue } from '@en-reve/primitives/interactions/form-controller.js';
import { dispatchChange } from '@en-reve/primitives/interactions/events.js';
import { fileRejections, type FileRejection, type FileRejectionDetail } from '@en-reve/primitives/interactions/file-selection.js';
import { FileDropController } from './drop-controller.js';
import { fileUploadTemplate } from './template.js';

export type { FileRejection, FileRejectionDetail };
export type FileSelectionReason = 'select' | 'drop' | 'remove';
const emptyFiles: readonly File[] = Object.freeze([]);
const defaultRejectionText = (rejections: readonly FileRejection[]): string => {
  const first = rejections[0];
  if (!first) return '';
  if (first.reason === 'multiple') return 'Choose one file at a time. Your previous selection is unchanged.';
  if (first.reason === 'max-file-size') return `${first.file.name} exceeds the maximum file size. Your previous selection is unchanged.`;
  return `${first.file.name} is not an accepted file type. Your previous selection is unchanged.`;
};

/**
 * Native file selection and drop handling. Transfer, persistence and server validation belong to the application.
 * @tagname en-file-upload
 * @outputAttribute dragging dragging - Read-only reflected drag-over state for styling; author attributes do not control it.
 * @slot label - Visible field label with label attribute fallback.
 * @slot description - Supporting content with description attribute fallback.
 * @csspart field - Field layout.
 * @csspart label - Associated label; may be visually hidden while retaining accessible naming.
 * @csspart dropzone - Themeable picker and drop surface, including focus contour.
 * @csspart control - Native file input owning keyboard and picker activation.
 * @csspart choose-label - Visible picker action wording.
 * @csspart drop-label - Visible drop hint.
 * @csspart description - Supporting content associated with the native input.
 * @csspart list - Selected file list.
 * @csspart file - Each selected file row.
 * @csspart file-name - Filename text.
 * @csspart remove-button - Removal en-button host.
 * @csspart remove - Forwarded native removal button surface.
 * @csspart error - Selection rejection or validity feedback.
 * @cssprop --en-control-radius - Drop surface radius.
 * @cssprop --en-control-background - Shared default drop surface fill.
 * @cssprop --en-input-background - Drop surface fill; takes precedence over the shared control default.
 * @cssprop --en-control-color - Shared default drop surface text.
 * @cssprop --en-input-color - Drop surface text; takes precedence over the shared control default.
 * @cssprop --en-control-border-color - Drop surface border.
 * @cssprop --en-control-inline-padding - Shared default drop surface horizontal padding.
 * @cssprop --en-input-inline-padding - Drop surface horizontal padding; takes precedence over the shared control default.
 * @cssprop --en-input-focus-width - Immediate focus contour width.
 * @cssprop --en-input-focus-color - Immediate focus contour color.
 * @cssprop --en-field-gap - Label and supporting content spacing.
 * @fires {import('@en-reve/primitives/interactions/events.js').ChangeEvent<readonly File[], FileSelectionReason>} en-change - Single cancelable selection transaction with provisional files and form data.
 * @fires {CustomEvent<FileRejectionDetail>} en-reject - Noncancelable invalid-batch notification; no partial selection is applied.
 */
export class EnFileUpload extends EnElement {
  static override properties = {
    error: { noAccessor: true },
    files: { attribute: false, noAccessor: true },
    for: { type: String }, dropTarget: { attribute: false },
    dragging: { type: Boolean, attribute: false, noAccessor: true },
    name: { reflect: true }, accept: {}, multiple: {type:Boolean}, disabled: {type:Boolean, reflect:true},
    required: {type:Boolean, reflect:true}, maxFileSize: {type:Number, attribute:'max-file-size'},
    label: {}, description: {}, chooseLabel: {attribute:'choose-label'}, dropLabel: {attribute:'drop-label'},
    validationText: {attribute:'validation-text'}, constraintsText: {attribute:'constraints-text'}, removeLabel: {attribute:false}, rejectionText: {attribute:false},
  };
  static override styles = [foundationStyles, blockHostStyles, formStyles, fileUploadStyles];
  static formAssociated = true;
  /** Repeated form entry name; each selected file is submitted under this name. */
  declare name: string;
  /** Comma-separated extensions/MIME types. A picker hint plus local UX check, not server validation. */
  declare accept: string;
  /** Allow more than one selected file. New picker/drop batches replace the existing selection. */
  declare multiple: boolean;
  /** Disable picker, dropping and removal; omit the field from form data. */
  declare disabled: boolean;
  /** Require a nonempty selection. */
  declare required: boolean;
  /** Maximum bytes per file. Undefined, negative or nonfinite values leave the size unconstrained; zero accepts empty files. */
  declare maxFileSize: number | undefined;
  /** Plain-text label fallback. */
  declare label: string;
  /** Supporting text fallback. */
  declare description: string;
  /** Localized visible native-picker action. */
  declare chooseLabel: string;
  /** Localized visible drop hint. Empty string hides the hint. */
  declare dropLabel: string;
  /** Localized required-selection validation message. */
  declare validationText: string;
  /** Localized validity feedback when application-authored files no longer meet current constraints. */
  declare constraintsText: string;
  /** Localizes each removal action's accessible name. */
  declare removeLabel: (file: File) => string;
  /** Localizes rejected-batch feedback. Include that the previous selection is retained. */
  declare rejectionText: (rejections: readonly FileRejection[]) => string;

  /** ID of an additional drop surface in the same document or shadow root. Native picker remains available. */
  declare for: string;
  /** Explicit additional surface, including across open shadow roots; takes precedence over for. */
  declare dropTarget: HTMLElement | null;
  /** Whether a file drag is over an owned surface. Read-only; reflected for application styling. */
  get dragging(): boolean { return this.#dragDepth > 0; }
  private setDragDepth(value: number): void {
    const previous = this.dragging;
    this.#dragDepth = value;
    this.toggleAttribute('dragging', this.dragging);
    this.requestUpdate('dragging', previous);
  }
  #files = emptyFiles;
  #revision = 0;
  #fieldsetDisabled = false;
  #dragDepth = 0;
  #error = '';
  #applicationError = '';
  /** Application-supplied error, independent of rejected-file feedback; sets custom validity until cleared. */
  get error(): string { return this.#applicationError; }
  set error(value: string) {
    const previous = this.#applicationError;
    this.#applicationError = String(value ?? '');
    this.#form?.sync();
    this.requestUpdate('error', previous);
  }
  #validationShown = false;
  readonly #internals = typeof this.attachInternals === 'function' ? this.attachInternals() : undefined;
  readonly #form = this.#internals ? new FormController(this, {
    internals: this.#internals, control: () => this.control,
    value: () => this.formValue(), disabled: () => this.effectiveDisabled,
    onReset: () => { this.files = []; this.#validationShown = false; },
    onRestore: (state) => this.restoreFiles(state),
    validate: () => {
      const message = this.currentValidationMessage;
      return applicationValidation({ flags: message ? this.required && !this.files.length ? { valueMissing:true } : {customError:true} : {},
        message, anchor:this.control ?? undefined }, this.error);
    },
  }) : undefined;

  constructor() {
    super();
    this.for = ''; this.dropTarget = null;
    new FileDropController(this, { id: () => this.for, target: () => this.dropTarget, clear: () => this.setDragDepth(0),
      handle: event => {
        if (event.type === 'dragenter') this.onDragEnter(event);
        else if (event.type === 'dragover') this.onDragOver(event);
        else if (event.type === 'dragleave') this.onDragLeave();
        else this.onDrop(event);
      },
    });
    this.name = ''; this.accept = ''; this.multiple = false; this.disabled = false; this.required = false;
    this.maxFileSize = undefined; this.label = ''; this.description = '';
    this.chooseLabel = 'Choose files'; this.dropLabel = 'or drop files here';
    this.validationText = 'Please choose a file.';
    this.constraintsText = 'The selected files do not meet the file constraints.';
    this.removeLabel = (file) => `Remove ${file.name}`;
    this.rejectionText = defaultRejectionText;
    this.addEventListener('invalid', () => { this.#validationShown = true; this.requestUpdate(); });
  }

  /** Stable frozen selection snapshot. Silent application writes, including equal-value assignments, override pending user transactions. */
  get files(): readonly File[] { return this.#files; }
  set files(value: readonly File[]) {
    const next = Object.freeze([...new Set(value)]);
    ++this.#revision;
    this.#error = '';
    this.setFiles(next);
  }
  private setFiles(files: readonly File[]): void {
    const previous = this.#files;
    this.#files = files;
    this.requestUpdate('files', previous);
    this.syncNative();
    this.#form?.sync();
  }
  private get control(): HTMLInputElement | null { return this.renderRoot?.querySelector('input[type=file]') ?? null; }
  private get effectiveDisabled(): boolean { return this.disabled || this.#fieldsetDisabled; }
  private get currentValidationMessage(): string {
    if (this.effectiveDisabled) return '';
    if (this.required && !this.files.length) return this.validationText || 'Please choose a file.';
    const rejections = fileRejections(this.files, this);
    // This concerns already-authored selection, not a rejected replacement batch.
    return rejections.length ? this.constraintsText || 'The selected files do not meet the file constraints.' : '';
  }
  private formValue(): FormData | null {
    if (!this.name || !this.files.length) return null;
    const Constructor = this.ownerDocument?.defaultView?.FormData ?? globalThis.FormData;
    if (!Constructor) return null;
    const data = new Constructor();
    for (const file of this.files) data.append(this.name, file, file.name);
    return data;
  }
  private restoreFiles(state: FormValue): void {
    if (state && typeof state === 'object' && 'getAll' in state) {
      this.files = state.getAll(this.name).filter((value): value is File => typeof value !== 'string');
    } else if (state && typeof state === 'object' && 'name' in state) {
      this.files = [state as File];
    } else this.files = [];
  }
  /** Focus the native picker without opening the OS dialog. */
  override focus(options?: FocusOptions): void { this.control?.focus(options); }
  override blur(): void { this.control?.blur(); }
  get labels(): NodeList | undefined { return this.#internals?.labels; }
  get willValidate(): boolean { return this.#internals?.willValidate ?? false; }
  get form(): HTMLFormElement | null { return this.#internals?.form ?? null; }
  get validity(): ValidityState | undefined { return this.#internals?.validity; }
  get validationMessage(): string { return this.#internals?.validationMessage ?? ''; }
  checkValidity(): boolean { this.#form?.sync(); return this.#internals?.checkValidity?.() ?? true; }
  reportValidity(): boolean {
    this.#validationShown = true; this.#form?.sync(); this.requestUpdate();
    return this.#internals?.reportValidity?.() ?? true;
  }
  formDisabledCallback(disabled: boolean): void {
    this.#fieldsetDisabled = disabled;
    if (disabled) this.setDragDepth(0);
    this.#form?.formDisabled(disabled); this.requestUpdate();
  }
  formResetCallback(): void { this.#form?.formReset(); }
  formStateRestoreCallback(state: string | File | FormData, mode: 'restore' | 'autocomplete' = 'restore'): void { this.#form?.formStateRestore(state, mode); }

  private hasFiles(event: DragEvent): boolean { return Array.from(event.dataTransfer?.types ?? []).includes('Files'); }
  private onDragEnter = (event: DragEvent): void => {
    if (!this.hasFiles(event)) return;
    event.preventDefault();
    if (!this.effectiveDisabled) { this.setDragDepth(this.#dragDepth + 1); }
  };
  private onDragOver = (event: DragEvent): void => {
    if (!this.hasFiles(event)) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = this.effectiveDisabled ? 'none' : 'copy';
  };
  private onDragLeave = (): void => { this.setDragDepth(Math.max(0, this.#dragDepth - 1)); };
  private onDrop = (event: DragEvent): void => {
    if (!this.hasFiles(event)) return;
    event.preventDefault(); this.setDragDepth(0);
    const files = Array.from(event.dataTransfer?.files ?? []);
    // Empty/unsupported drops (including folders without exposed File entries)
    // must never silently clear a previously accepted selection.
    const directory = Array.from(event.dataTransfer?.items ?? []).some((item) => item.webkitGetAsEntry?.()?.isDirectory);
    if (!this.effectiveDisabled && files.length && !directory) this.propose(files, 'drop');
  };
  private propose(files: readonly File[], reason: FileSelectionReason): void {
    if (this.effectiveDisabled) { this.syncNative(); return; }
    const proposed = Object.freeze([...new Set(files)]);
    const rejections = fileRejections(proposed, this);
    if (rejections.length) {
      this.#error = this.rejectionText(rejections) || defaultRejectionText(rejections);
      this.requestUpdate(); this.syncNative();
      const Constructor = this.ownerDocument.defaultView?.CustomEvent ?? CustomEvent;
      this.dispatchEvent(new Constructor<FileRejectionDetail>('en-reject', {
        bubbles:true, composed:true, detail:Object.freeze({files:proposed, rejections}),
      }));
      return;
    }
    const previousError = this.#error;
    dispatchChange(this, {
      previous:this.files, proposed, reason, getRevision:() => this.#revision,
      stage:(next) => { this.#error = ''; this.setFiles(next); },
      rollback:(previous) => { this.#error = previousError; this.setFiles(previous); },
      canCommit:(next) => !this.effectiveDisabled && !fileRejections(next, this).length,
    });
  }
  private select = (event: Event): void => {
    // Only en-change is the component's selection event; don't leak the native
    // draft event as a second public control pattern.
    event.stopPropagation();
    this.propose(Array.from(this.control?.files ?? []), 'select');
  };
  private removeFile = (file: File): void => {
    const index = this.files.indexOf(file);
    if (index < 0 || this.effectiveDisabled) return;
    const button = this.renderRoot.querySelectorAll<HTMLElement>('.en-file-remove')[index];
    const focused = this.shadowRoot?.activeElement === button;
    this.propose(this.files.filter((selected) => selected !== file), 'remove');
    if (focused && this.shadowRoot?.activeElement === button && !this.files.includes(file)) {
      void this.updateComplete.then(() => {
        // Removing the focused button returns focus to body; an application
        // handler that placed focus elsewhere retains ownership.
        const active = this.ownerDocument.activeElement;
        if (active !== this && active !== this.ownerDocument.body) return;
        if (this.shadowRoot?.activeElement && this.shadowRoot.activeElement !== button) return;
        const buttons = this.renderRoot.querySelectorAll<HTMLElement>('.en-file-remove');
        (buttons[Math.min(index, buttons.length - 1)] ?? this.control)?.focus({preventScroll:true});
      });
    }
  };
  private syncNative(): void {
    const input = this.control;
    if (!input) return;
    const Constructor = this.ownerDocument.defaultView?.DataTransfer;
    if (Constructor) {
      try {
        const transfer = new Constructor();
        for (const file of this.files) transfer.items.add(file);
        input.files = transfer.files;
        return;
      } catch { /* Older WebViews may not expose a constructible writable FileList. */ }
    }
    input.value = '';
  }
  protected override firstUpdated(): void {
    // DSD native input can be used while the element's module is still loading.
    // Never overwrite that real selection with the empty client initialization.
    const nativeFiles = Array.from(this.control?.files ?? []);
    if (!this.#revision && nativeFiles.length) {
      const rejections = fileRejections(nativeFiles, this);
      if (rejections.length) {
        this.#error = this.rejectionText(rejections) || defaultRejectionText(rejections);
        this.requestUpdate();
      } else this.setFiles(Object.freeze(nativeFiles));
    }
  }
  protected override updated(_changes: PropertyValues): void { if (this.effectiveDisabled && this.dragging) this.setDragDepth(0); this.syncNative(); this.#form?.sync(); }
  protected override render() {
    return fileUploadTemplate({
      files:this.files, label:this.label, description:this.description, accept:this.accept,
      multiple:this.multiple, disabled:this.effectiveDisabled, required:this.required, dragging:this.#dragDepth > 0,
      error:this.error || this.#error || (this.#validationShown ? this.currentValidationMessage : ''),
      invalid:Boolean(this.error || this.#error || this.currentValidationMessage && this.#validationShown),
      chooseLabel:this.chooseLabel, dropLabel:this.dropLabel, removeLabel:this.removeLabel,
      select:this.select, preparePicker:() => { if (this.control && !this.effectiveDisabled) this.control.value = ''; },
      cancelPicker:() => this.syncNative(), remove:this.removeFile,
    });
  }
}

declare global { interface HTMLElementTagNameMap { 'en-file-upload': EnFileUpload; } }
