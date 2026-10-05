import type { PropertyValues, TemplateResult } from 'lit';
import { createDraftModel } from '@en-reve/primitives/state/draft.js';
import { EditingController } from '@en-reve/primitives/interactions/editing-controller.js';
import type { FormValidation } from '@en-reve/primitives/interactions/form-controller.js';
import { NumericChoiceBase } from './numeric-base.js';
import { normalizeNumberBounds, normalizeRangeValue } from './number.js';
import { sliderTemplate } from './template.js';
import { syncRangePresentation } from '@en-reve/primitives/interactions/range-presentation.js';

/**
 * A numeric setting with immediate range adjustment and an optional exact-value editor.
 * Authoritative values clamp/snap to the range lattice; invalid text drafts remain editable.
 * @cssprop --en-slider-thumb-pressed-scale - Thumb-only held geometry; reduced motion retains rest geometry.
 * @cssprop --en-slider-thumb-press-duration - Thumb-only held geometry; reduced motion retains rest geometry.
 * @cssprop --en-slider-thumb-release-duration - Thumb-only held geometry; reduced motion retains rest geometry.
 * @cssprop --en-slider-track-size - Painted rail thickness; retains the separate interaction target.
 * @cssprop --en-slider-thumb-size - Painted thumb border-box size; independent of icon size and interaction target.
 * @cssprop --en-slider-track-radius - Track and selected-segment corner radius.
 * @cssprop --en-slider-track-background - Unselected rail paint.
 * @cssprop --en-slider-fill-background - Selected value or interval paint; native input fill is opt-in.
 * @cssprop --en-slider-track-shadow - Decorative inset rail boundary.
 * @cssprop --en-slider-disabled-track-shadow - Disabled decorative rail boundary.
 * @cssprop --en-slider-thumb-background - Rest thumb plate.
 * @cssprop --en-slider-thumb-border-width - Thumb border width inside its painted size.
 * @cssprop --en-slider-thumb-border-color - Rest thumb boundary.
 * @cssprop --en-slider-thumb-radius - Painted thumb corner radius.
 * @cssprop --en-slider-thumb-shadow - Decorative thumb elevation; independent of the keyboard focus contour.
 * @cssprop --en-slider-thumb-hover-shadow - Enabled hover decoration.
 * @cssprop --en-slider-thumb-focus-shadow - Keyboard-focus decoration; retains the primary contour.
 * @cssprop --en-slider-hover-thumb-background - Enabled hover thumb paint.
 * @cssprop --en-slider-pressed-thumb-background - Enabled held thumb paint.
 * @cssprop --en-slider-hover-fill-background - Enabled hover selected-segment paint.
 * @cssprop --en-slider-pressed-fill-background - Enabled held selected-segment paint.
 * @cssprop --en-slider-hover-pressed-thumb-background - Enabled hover-and-held thumb paint.
 * @cssprop --en-slider-hover-pressed-fill-background - Enabled hover-and-held selected-segment paint.
 * @cssprop --en-slider-hover-thumb-border-color - Enabled hover thumb boundary.
 * @cssprop --en-slider-pressed-thumb-border-color - Enabled held thumb boundary.
 * @cssprop --en-slider-disabled-track-background - Disabled rail paint.
 * @cssprop --en-slider-disabled-fill-background - Disabled selected-segment paint.
 * @cssprop --en-slider-disabled-thumb-background - Disabled thumb paint.
 * @cssprop --en-slider-disabled-thumb-border-color - Disabled thumb boundary.
 * @cssprop --en-slider-disabled-thumb-shadow - Disabled thumb decoration.
 * @cssprop --en-slider-disabled-fill-opacity - Disabled selected-segment visibility; zero reveals the unselected rail.
 * @cssprop --en-slider-disabled-opacity - Disabled opacity of the range input or interval track subtree.
 * @cssprop --en-slider-disabled-thumb-opacity - Additional disabled thumb opacity.
 * @cssprop --en-slider-paint-duration - Thumb paint transition duration; reduced motion removes transitions.
 * @cssprop --en-slider-value-percent - Derived presentation state on the native control; managed by the component, never a theme pin.
 * @tagname en-slider
 * @cssprop --en-input-bottom-border-color - Optional resting bottom-border color for the optional exact-value editor frame; invalid, disabled and forced colors take precedence.
 * @cssprop --en-input-hover-bottom-border-color - Optional hover bottom-border color for the optional exact-value editor frame on hover-capable devices.
 * @slot - The visible slider label.
 * @slot label - Preferred visible label; falls back to the default slot and then label.
 * @slot description - Supporting text; falls back to the description attribute/property.
 * @slot editor-label - Localizable qualifier for the number editor, falling back to editor-label.
 * @csspart field - The outer field.
 * @csspart row - Range, optional editor and output layout.
 * @csspart control - The native range control.
 * @csspart editor - The optional native number input.
 * @csspart editor-label - The accessible number-editor qualifier.
 * @csspart label - The shared visible setting label.
 * @csspart output - The optional accepted value.
 * @csspart description - Supporting text.
 * @csspart error - Associated editor validation feedback.
 * @cssprop --en-color-action - Range accent color.
 * @cssprop --en-control-background - Number editor background.
 * @cssprop --en-input-background - Number editor fill falling back to the shared control background.
 * @cssprop --en-input-color - Number editor text falling back to the shared control color.
 * @cssprop --en-input-inline-padding - Number editor inline padding; takes precedence over shared control-inline-padding.
 * @cssprop --en-control-radius - Number editor radius.
 * @cssprop --en-size-range-length - Default vertical range length.
 * @cssprop --en-slider-length - Override the vertical range length for this component.
 * @fires {CustomEvent<import('@en-reve/primitives/interactions/events.js').DraftInputDetail>} en-input - Native editor draft; does not accept the numeric setting.
 * @fires {import('@en-reve/primitives/interactions/events.js').ChangeEvent<number>} en-change - Tentative, cancelable change; the property and form data expose the proposed state during dispatch.
 */
export class EnSlider extends NumericChoiceBase {
  static override properties = {
    ...NumericChoiceBase.properties, min: { type: Number }, max: { type: Number }, step: { type: Number },
    orientation: { type: String, reflect: true },
    showValue: { type: Boolean, attribute: 'show-value' }, valueText: { attribute: 'value-text' },
    editable: { type: Boolean }, editorLabel: { attribute: 'editor-label' }, validationText: { attribute: 'validation-text' },
  };
  declare min: number;
  declare max: number;
  declare step: number;
  /** Range direction. Vertical places the minimum at the bottom and maximum at the top. */
  declare orientation: 'horizontal' | 'vertical';
  declare showValue: boolean;
  /** Human-readable accepted value with units, used by the range and optional output only. */
  declare valueText: string;
  /** Add a native exact-value editor. Typing remains a draft until change, blur or Enter. */
  declare editable: boolean;
  /** Localizable qualifier appended to the shared setting label for the number editor. */
  declare editorLabel: string;
  /** Optional localized editor constraint message; empty uses the browser's native message. */
  declare validationText: string;

  private readonly editorDraft = createDraftModel('0');
  private readonly editing = new EditingController(this, {
    model: this.editorDraft, control: () => this.editorControl,
    // Composition and hydration adopt drafts only; completion has an explicit boundary below.
    onInput: () => { ++this.editGeneration; this.lastCompletion = undefined; this.syncEditorValidation(); },
  });
  private initialEditorValue?: string;
  private showEditorError = false;
  private editorError = '';
  private editGeneration = 0;
  private pendingBlur = false;
  private lastCompletion?: { control: HTMLInputElement; generation: number; authorRevision: number; value: string; badInput: boolean };

  constructor() {
    super();
    this.min = 0; this.max = 100; this.step = 1; this.orientation = 'horizontal';
    this.showValue = false; this.valueText = '';
    this.editable = false; this.editorLabel = 'Exact value'; this.validationText = '';
    this.addEventListener('invalid', () => { this.showEditorError = true; this.syncEditorValidation(); this.requestUpdate(); });
  }
  private get bounds() { return normalizeNumberBounds(this.min, this.max, this.step); }
  private get editorControl(): HTMLInputElement | null {
    return this.editable ? this.renderRoot?.querySelector<HTMLInputElement>('#editor') ?? null : null;
  }
  protected override get validationControl(): HTMLInputElement | null { return this.editorControl ?? this.renderRoot?.querySelector<HTMLInputElement>('#control') ?? null; }
  protected override normalizeValue(value: number): number { return normalizeRangeValue(value, this.bounds); }
  protected override onValueWrite(): void { this.reconcileEditor(); }

  private reconcileEditor(): void {
    this.editorDraft?.setValue(String(this.value));
    const wasVisible = this.showEditorError;
    this.showEditorError = false;
    if (wasVisible) this.requestUpdate();
    this.pendingBlur = false;
    this.lastCompletion = undefined;
    this.editing?.sync();
    this.syncEditorValidation();
  }
  protected override willUpdate(changes: PropertyValues): void {
    if (changes.has('min') || changes.has('max') || changes.has('step')) {
      const normalized = this.normalizeValue(this.value);
      if (normalized !== this.value) this.valueDefaults.apply(normalized);
    }
    if (changes.has('editable') && !this.editable) this.reconcileEditor();
    this.initialEditorValue ??= String(this.value);
  }
  protected override syncControl(): void {
    const range = this.renderRoot?.querySelector<HTMLInputElement>('#control');
    if (range && range.value !== String(this.value)) range.value = String(this.value);
    if (range) syncRangePresentation(range);
    this.editing?.sync();
  }

  /** The editor is the sole validation anchor; only the accepted numeric value is submitted. */
  protected override validateForm(): FormValidation {
    const editor = this.editorControl;
    if (!editor) return { flags: {} };
    const bounds = this.bounds;
    const matches = editor.min === String(bounds.min) && editor.max === String(bounds.max)
      && editor.step === String(bounds.step) && editor.required;
    const candidate = matches ? editor : editor.cloneNode(false) as HTMLInputElement;
    if (candidate !== editor) {
      candidate.min = String(bounds.min); candidate.max = String(bounds.max); candidate.step = String(bounds.step);
      candidate.required = true; candidate.disabled = false; candidate.value = editor.value;
    }
    const native = candidate.validity;
    const badInput = editor.validity.badInput;
    const flags: ValidityStateFlags = { badInput, valueMissing: native.valueMissing,
      rangeUnderflow: native.rangeUnderflow, rangeOverflow: native.rangeOverflow, stepMismatch: native.stepMismatch };
    const invalid = Object.values(flags).some(Boolean);
    return { flags, message: invalid ? this.validationText || (badInput ? editor.validationMessage : candidate.validationMessage) : '', anchor: editor };
  }
  private syncEditorValidation(): void {
    this.formController?.sync();
    // Keep the first template identical to SSR even when an early native draft
    // is invalid. updated() paints its validation after hydrating the same input.
    if (!this.hasUpdated) return;
    const message = !this.effectiveDisabled && this.editable ? this.validationMessage : '';
    if (message !== this.editorError) { this.editorError = message; this.requestUpdate(); }
  }
  override checkValidity(): boolean { this.syncEditorValidation(); return super.checkValidity(); }
  override reportValidity(): boolean { this.syncEditorValidation(); return super.reportValidity(); }
  override formResetCallback(): void { super.formResetCallback(); this.reconcileEditor(); this.syncControl(); }
  override formStateRestoreCallback(state: string | File | FormData, mode: 'restore' | 'autocomplete' = 'restore'): void {
    super.formStateRestoreCallback(state, mode);
    // Browser restoration writes authoritative state and reconciles the editor.
    this.syncEditorValidation();
  }
  override disconnectedCallback(): void { this.pendingBlur = false; this.lastCompletion = undefined; super.disconnectedCallback(); }
  override focus(options?: FocusOptions): void { this.renderRoot?.querySelector<HTMLInputElement>('#control')?.focus(options); }

  private finishEditor(origin: 'enter' | 'change' | 'blur'): void {
    const control = this.editorControl;
    if (!control || this.effectiveDisabled || this.editorDraft.isComposing.get()) return;
    const previous = this.lastCompletion;
    if (origin !== 'enter' && previous?.control === control && previous.generation === this.editGeneration
      && previous.authorRevision === this.authorRevision && previous.value === control.value
      && previous.badInput === control.validity.badInput) return;
    this.editorDraft.setDraft(control.value);
    this.showEditorError = true;
    this.requestUpdate();
    const validation = this.validateForm();
    if (!Object.values(validation.flags).some(Boolean) && Number.isFinite(control.valueAsNumber)) {
      if (control.valueAsNumber === this.value) this.reconcileEditor();
      else this.propose(control.valueAsNumber, 'change');
    }
    this.syncEditorValidation();
    this.lastCompletion = { control, generation: this.editGeneration, authorRevision: this.authorRevision,
      value: control.value, badInput: control.validity.badInput };
  }
  private handleRangeInput = (event: Event): void => {
    this.propose(Number((event.target as HTMLInputElement).value), 'input');
    this.syncEditorValidation();
  };
  // This template listener runs before EditingController dispatches the public en-input event.
  private handleEditorInput = (event: Event): void => {
    // Native dispatch can flush a render between listeners. Capture the draft
    // before validation schedules rendering, so reconciliation cannot erase it.
    const input = event as InputEvent;
    if (input.isComposing && !this.editorDraft.isComposing.get()) this.editorDraft.startComposition();
    this.editorDraft.setDraft((event.currentTarget as HTMLInputElement).value);
    this.syncEditorValidation();
  };
  private handleEditorChange = (): void => { this.finishEditor('change'); };
  private handleEditorBlur = (): void => {
    if (this.editorDraft.isComposing.get()) { this.pendingBlur = true; return; }
    this.finishEditor('blur');
  };
  private handleEditorKeyDown = (event: KeyboardEvent): void => {
    if (event.defaultPrevented || event.isComposing || this.editorDraft.isComposing.get()
      || event.altKey || event.ctrlKey || event.metaKey || this.effectiveDisabled) return;
    if (event.key === 'Enter') { event.preventDefault(); this.finishEditor('enter'); }
    else if (event.key === 'Escape') { event.preventDefault(); this.reconcileEditor(); }
  };
  private handleEditorCompositionEnd = (event: CompositionEvent): void => {
    const control = event.currentTarget;
    queueMicrotask(() => {
      if (!this.pendingBlur) return;
      this.pendingBlur = false;
      if (this.isConnected && this.editable && !this.effectiveDisabled && this.editorControl === control) this.finishEditor('blur');
    });
  };
  protected override updated(changes: PropertyValues): void { super.updated(changes); this.syncEditorValidation(); }
  /** Internal composition hook; the default slider keeps its native number editor. */
  protected renderExactEditor(): TemplateResult | undefined { return undefined; }
  protected override render() {
    const exactEditor = this.editable ? this.renderExactEditor() : undefined;
    return sliderTemplate({ value: this.value, ...this.bounds, disabled: this.effectiveDisabled,
      orientation: this.orientation === 'vertical' ? 'vertical' : 'horizontal',
      label: this.label, description: this.description, showValue: this.showValue, valueText: this.valueText,
      editable: this.editable, editorLabel: this.editorLabel, defaultEditorValue: this.initialEditorValue ?? String(this.value),
      applicationError: this.error,
      editorError: this.error || (exactEditor ? '' : this.editorError), showEditorError: Boolean(this.error) || this.showEditorError }, {
      rangeInput: this.handleRangeInput, editorInput: this.handleEditorInput,
      editorChange: this.handleEditorChange, editorBlur: this.handleEditorBlur,
      editorKeyDown: this.handleEditorKeyDown, editorCompositionEnd: this.handleEditorCompositionEnd,
    }, exactEditor);
  }
}

declare global { interface HTMLElementTagNameMap { 'en-slider': EnSlider; } }
