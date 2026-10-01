import { DefaultState } from './default-state.js';
import { descriptionTemplate } from '@en-reve/primitives/templates/description.js';
import { css, html, nothing } from 'lit';
import type { PropertyValues, TemplateResult } from 'lit';
import { createDraftModel } from '@en-reve/primitives/state/draft.js';
import { dispatchChange } from '@en-reve/primitives/interactions/events.js';
import { SignalController } from '@en-reve/primitives/interactions/signal-controller.js';
import { FormController } from '@en-reve/primitives/interactions/form-controller.js';
import type { FormValidation } from '@en-reve/primitives/interactions/form-controller.js';
import { foundationStyles } from '@en-reve/styles/foundations.js';
import { formStyles, controlStyles } from '@en-reve/styles/controls.js';
import { EnElement } from '../internal/en-element.js';

export type NativeField = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

/** Private adapter. Internal nodes, selectors and IDs are not public APIs.
 * @fires {import('../events.js').FieldChangeEvent} en-change - Cancelable tentative string value.
 */
export abstract class FormFieldElement extends EnElement {
  static formAssociated = true;
  protected readonly valueDefaults = new DefaultState<string>(this, 'value',
    attribute => attribute ?? '', value => String(value), value => { this.value = value; });

  /** Reset default, reflected synchronously to the value attribute. Pristine controls follow default changes. */
  get defaultValue(): string { return this.valueDefaults.value; }
  set defaultValue(value: string) { this.valueDefaults.value = String(value ?? ''); }

  /** @internal Route default attributes without invoking the live-state setter as an author edit. */
  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    if (name === 'value') { this.valueDefaults.attributeChanged(); return; }
    super.attributeChangedCallback(name, old, value);
  }

  static styles = [foundationStyles, formStyles, controlStyles, css`:host { display: block; }`];
  static properties = {
    label: { type: String },
    description: { type: String },
    validationText: { attribute: 'validation-text' },
    error: { type: String, noAccessor: true },
    value: { type: String, noAccessor: true, attribute: false },
    defaultValue: { attribute: 'value', noAccessor: true },
    name: { type: String, reflect: true },
    disabled: { type: Boolean, reflect: true },
    required: { type: Boolean, reflect: true },
    placeholder: { type: String },
  };

  /** Fallback visible label when no content is assigned to the label slot. */
  declare label: string;
  /** Supporting text read with the control. */
  declare description: string;
  /** Application-supplied error; also sets custom validity until cleared. */
  private applicationError = '';
  /** Application-supplied error; sets custom validity until cleared. */
  get error(): string { return this.applicationError; }
  set error(value: string) {
    const previous = this.applicationError;
    this.applicationError = String(value ?? '');
    this.syncForm();
    this.requestUpdate('error', previous);
  }
  /** Localized constraint-message override; text alone never invalidates a control. */
  declare validationText: string;
  /** Successful form control name. */
  declare name: string;
  declare disabled: boolean;
  declare required: boolean;
  declare placeholder: string;

  protected readonly model = createDraftModel();
  private readonly signal = new SignalController(this, () => this.model.view.get());
  private readonly internals: ElementInternals | undefined;
  private readonly formAdapter: FormController | undefined;
  private authorRevision = 0;
  private showNativeError = false;
  private nativeErrorMessage = '';

  constructor() {
    super();
    this.label = '';
    this.description = '';
    this.error = '';
    this.validationText = '';
    this.name = '';
    this.disabled = false;
    this.required = false;
    this.placeholder = '';
    this.internals = typeof this.attachInternals === 'function' ? this.attachInternals() : undefined;
    if (this.internals) this.formAdapter = new FormController(this, {
      internals: this.internals,
      control: () => this.controlNode,
      value: () => this.submissionValue,
      state: () => this.submissionState,
      disabled: () => this.disabled,
      validate: () => this.validateAcceptedValue(),
      onReset: () => {
        this.showNativeError = false;
        this.valueDefaults.reset();
      },
      onRestore: state => {
        if (typeof state === 'string') this.value = state;
      },
    });
    this.addEventListener('en-input', () => this.valueDefaults.markDirty(), { capture: true });
    this.addEventListener('invalid', () => {
      this.showNativeError = true;
      this.requestUpdate();
    });
  }

  /** Accepted string value. Assigning even the same value explicitly reconciles a different draft. */
  get value(): string { return this.model.value.get(); }
  set value(value: string) {
    this.valueDefaults.markDirty();
    const previous = this.value;
    this.authorRevision++;
    this.model.setValue(String(value ?? ''));
    this.reconcile();
    this.syncForm();
    this.requestUpdate('value', previous);
  }

  get form(): HTMLFormElement | null { return this.internals?.form ?? null; }
  get labels(): NodeList | undefined { return this.internals?.labels; }
  get validity(): ValidityState | undefined { return this.internals?.validity ?? this.controlNode?.validity; }
  get validationMessage(): string { return this.internals?.validationMessage ?? ''; }
  get willValidate(): boolean { return this.internals?.willValidate ?? false; }

  override focus(options?: FocusOptions): void { this.controlNode?.focus(options); }
  override blur(): void { this.controlNode?.blur(); }

  checkValidity(): boolean {
    this.syncForm();
    return this.internals?.checkValidity?.() ?? this.controlNode?.checkValidity() ?? true;
  }

  reportValidity(): boolean {
    this.syncForm();
    return this.internals?.reportValidity?.() ?? this.controlNode?.reportValidity() ?? true;
  }

  /** Restore defaultValue unless the application cancels the containing form's native reset event. */
  formResetCallback(): void {
    this.formAdapter?.formReset();
  }

  formDisabledCallback(disabled: boolean): void {
    this.formAdapter?.formDisabled(disabled);
  }

  /** Browser restoration is an authoritative, silent accepted-value write. */
  formStateRestoreCallback(state: string | File | FormData | null, mode: 'restore' | 'autocomplete'): void {
    this.formAdapter?.formStateRestore(state, mode);
  }

  /** Successful native submission data; a subclass may omit an unavailable accepted choice. */
  protected get submissionValue(): string | FormData | null { return this.value; }
  protected get submissionState(): string { return this.value; }
  protected get isDisabled(): boolean { return this.formAdapter?.disabled ?? this.disabled; }
  /** First delivery paints current state; after adoption, native defaults follow the public default. */
  protected get defaultControlValue(): string { return this.hasUpdated ? this.defaultValue : this.value; }
  protected get controlNode(): NativeField | null {
    return this.shadowRoot?.querySelector<NativeField>('#control') ?? null;
  }
  protected get describedBy(): string {
    return this.visibleError ? 'description error' : 'description';
  }
  protected get visibleError(): string {
    return this.error || (this.showNativeError ? this.nativeErrorMessage : '');
  }
  protected get controlAriaInvalid(): 'true' | typeof nothing { return this.visibleError ? 'true' : nothing; }

  protected abstract renderControl(): TemplateResult;

  /** A paint-only wrapper keeps supplemental focus decoration off native replaced controls. */
  protected renderControlFrame(): TemplateResult {
    return html`<div class="en-field-focus-frame" part="focus-frame">${this.renderControl()}</div>`;
  }

  /** Tracks explicit writes, including same-value assignments, for subclass adoption guards. */
  protected get valueRevision(): number { return this.authorRevision; }

  /** Revalidate a proposed value after synchronous consumer edits to its available choices. */
  protected canCommitValue(_value: string): boolean { return true; }
  protected abstract reconcile(): void;

  /** Stage accepted submission data while preserving the native draft, selection and composition. */
  protected stageValue(value: string): void {
    const previous = this.value;
    this.model.stageValue(value);
    this.syncForm();
    this.requestUpdate('value', previous);
  }

  protected requestValue(proposed: string, reason: string): void {
    if (this.isDisabled) return;
    this.valueDefaults.markDirty();
    const connected = this.isConnected;
    dispatchChange(this, {
      previous: this.value,
      proposed,
      reason,
      getRevision: () => this.authorRevision,
      canCommit: value => !this.isDisabled && (!connected || this.isConnected) && this.canCommitValue(value),
      stage: value => this.stageValue(value),
      rollback: value => this.stageValue(value),
      commit: value => {
        this.model.setValue(value);
        this.reconcile();
        this.syncForm();
        this.requestUpdate();
      },
    });
  }

  protected override updated(_changed: PropertyValues): void {
    super.updated(_changed);
    const control = this.controlNode;
    if (control && 'defaultValue' in control && control.defaultValue !== this.defaultValue) {
      // Detach the live value from its native default before changing reset state.
      // An unchanged value write preserves an early SSR selection and makes this
      // input/textarea dirty, so updating defaultValue cannot erase that selection.
      control.value = control.value;
      control.defaultValue = this.defaultValue;
    }
    this.reconcile();
    this.syncForm();
  }

  /** Native constraints validate accepted submission data, which can differ from an unaccepted draft. */
  protected syncForm(): void {
    const previousMessage = this.nativeErrorMessage;
    this.formAdapter?.sync();
    this.nativeErrorMessage = this.validationMessage;
    if (this.showNativeError && previousMessage !== this.nativeErrorMessage) this.requestUpdate();
  }

  protected validateAcceptedValue(): FormValidation {
    const control = this.controlNode;
    if (!control) return { flags: this.error ? { customError: true } : {}, message: this.error };
    const validationControl = control.value === this.value ? control : control.cloneNode(true) as NativeField;
    if (validationControl !== control) validationControl.value = this.value;
    validationControl.setCustomValidity(this.error);
    const native = validationControl.validity;
    const flags: ValidityStateFlags = {
      badInput: native.badInput,
      customError: native.customError,
      patternMismatch: native.patternMismatch,
      rangeOverflow: native.rangeOverflow,
      rangeUnderflow: native.rangeUnderflow,
      stepMismatch: native.stepMismatch,
      tooLong: native.tooLong,
      tooShort: native.tooShort,
      typeMismatch: native.typeMismatch,
      valueMissing: native.valueMissing,
    };
    return { flags, message: native.valid ? '' : this.error || this.validationText || validationControl.validationMessage, anchor: control };
  }

  /** Distinct source aliases let composites preserve legacy mappings across browsers. */
  protected descriptionPart = 'description';
  protected errorPart = 'error';

  protected override render(): TemplateResult {
    return html`<div class="en-field" part="field" data-invalid=${this.visibleError ? '' : nothing}>
      <label class="en-label" part="label" for="control"><slot name="label">${this.label}</slot></label>
      ${this.renderControlFrame()}
      ${descriptionTemplate(this.description,this.descriptionPart)}
      ${this.visibleError ? html`<div class="en-error" part=${this.errorPart} id="error">${this.visibleError}</div>` : nothing}
    </div>`;
  }
}
