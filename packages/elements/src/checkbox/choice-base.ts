import { applicationValidation, ValidationFeedback } from '../forms-private/validation-feedback.js';
import { FieldLabels } from '../forms-private/field-labels.js';
import { DefaultState } from '../forms-private/default-state.js';
import type { PropertyValues } from 'lit';
import { EnElement } from '../internal/en-element.js';
import { createValueModel } from '@en-reve/primitives/state/value.js';
import { SignalController } from '@en-reve/primitives/interactions/signal-controller.js';
import { dispatchChange } from '@en-reve/primitives/interactions/events.js';
import { FormController } from '@en-reve/primitives/interactions/form-controller.js';
import type { FormValidation } from '@en-reve/primitives/interactions/form-controller.js';
import { foundationStyles, blockHostStyles } from '@en-reve/styles/foundations.js';
import { controlStyles, formStyles } from '@en-reve/styles/controls.js';
import { selectionStyles } from '@en-reve/styles/selection.js';
import { choiceTemplate } from './template.js';

/** Shared native toggle adapter. Element classes own their public names and metadata. */
export abstract class ChoiceBase extends EnElement {
  static override properties = {
    error: { noAccessor: true }, validationText: { attribute: 'validation-text' },
    checked: { type: Boolean, noAccessor: true, attribute: false },
    defaultChecked: { type: Boolean, attribute: 'checked', noAccessor: true },
    disabled: { type: Boolean, reflect: true },
    required: { type: Boolean, reflect: true }, name: { reflect: true }, value: {}, label: {}, description: {},
  };
  static override styles = [foundationStyles, blockHostStyles, controlStyles, formStyles, selectionStyles];
  static formAssociated = true;
  /** @internal Reference routing and SSR share the owned native choice target. */
  static override shadowRootOptions = { ...EnElement.shadowRootOptions, referenceTarget: 'control' };
  private readonly fieldLabels = new FieldLabels(this, () => this.nativeControl, { activation: 'click', labelledBy: 'label-text' });
  protected readonly checkedDefaults = new DefaultState<boolean>(this, 'checked',
    attribute => attribute !== null, value => value ? '' : null, value => { this.checked = value; });

  private readonly feedback = new ValidationFeedback(this, () => { this.syncForm(); }, () => this.validationMessage);
  /** Application-supplied error; sets custom validity until explicitly cleared. */
  get error(): string { return this.feedback.error; }
  set error(value: string) { this.feedback.error = value; }
  protected get visibleError(): string { return this.feedback.visible; }

  /** Reset default, reflected synchronously to the checked attribute. Pristine controls follow default changes. */
  get defaultChecked(): boolean { return this.checkedDefaults.value; }
  set defaultChecked(value: boolean) { this.checkedDefaults.value = Boolean(value); }

  /** @internal Route default attributes without invoking the live-state setter as an author edit. */
  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    if (name === 'checked') { this.checkedDefaults.attributeChanged(); return; }
    super.attributeChangedCallback(name, old, value);
  }

  protected readonly checkedModel = createValueModel(false);
  protected readonly signalController = new SignalController(this, () => this.checkedModel.view.get());
  protected authorRevision = 0;
  protected formDisabled = false;
  protected readonly internals = typeof this.attachInternals === 'function' ? this.attachInternals() : undefined;
  protected readonly formController = this.internals ? new FormController(this, {
    internals: this.internals, control: () => this.nativeControl,
    value: () => this.formValue, state: () => this.checked ? 'checked' : 'unchecked',
    disabled: () => this.effectiveDisabled,
    onReset: () => { this.feedback.reset(); this.checkedDefaults.reset(); this.syncControl(); },
    onRestore: (state) => { if (typeof state === 'string') this.checked = state === 'checked'; this.syncControl(); },
    validate: () => this.formValidation(),
  }) : undefined;

  /** Localized required-constraint message; does not itself invalidate the control. */
  declare validationText: string;

  /** Disable interaction and omit the field from form data. */
  declare disabled: boolean;
  /** Require checked state for native form validation. */
  declare required: boolean;
  /** The form entry name. */
  declare name: string;
  /** Submitted value while checked; defaults to on. */
  declare value: string;
  /** Plain-text label fallback when no label content is slotted. */
  declare label: string;
  /** Supporting text associated with the native input. */
  declare description: string;

  constructor() {
    super();
    this.disabled = false;
    this.required = false;
    this.name = '';
    this.value = 'on';
    this.validationText = '';
    this.label = '';
    this.description = '';
  }

  /** Current checked state; user changes are tentative during en-change. The checked attribute defines the reset default. */
  get checked(): boolean { return this.checkedModel.value.get(); }
  set checked(value: boolean) {
    this.checkedDefaults.markDirty();
    ++this.authorRevision;
    this.setChecked(Boolean(value));
  }

  /** Apply component-owned state without claiming an authoritative application write. */
  protected setChecked(value: boolean): void {
    const previous = this.checked;
    this.checkedModel.set(value);
    this.requestUpdate('checked', previous);
    this.syncForm();
  }

  protected abstract get kind(): 'checkbox' | 'switch' | 'radio';
  protected get mixed(): boolean { return false; }
  protected get effectiveDisabled(): boolean { return this.disabled || this.formDisabled; }
  protected get controlTabIndex(): number { return 0; }
  protected get nativeControl(): HTMLInputElement | null { return this.renderRoot?.querySelector('input') ?? null; }
  protected get formValue(): string | null { return this.checked ? this.value : null; }

  override focus(options?: FocusOptions): void { this.nativeControl?.focus(options); }
  get form(): HTMLFormElement | null { return this.internals?.form ?? null; }
  get labels(): NodeList | undefined { return this.internals?.labels; }
  get willValidate(): boolean { return this.internals?.willValidate ?? false; }
  get validity(): ValidityState | undefined { return this.internals?.validity; }
  get validationMessage(): string { return this.internals?.validationMessage ?? ''; }
  checkValidity(): boolean { this.syncForm(); return this.internals?.checkValidity?.() ?? true; }
  reportValidity(): boolean { this.syncForm(); return this.internals?.reportValidity?.() ?? true; }

  formDisabledCallback(disabled: boolean): void {
    this.formDisabled = disabled;
    this.requestUpdate();
    this.formController?.formDisabled(disabled);
  }
  formResetCallback(): void {
    this.formController?.formReset();
  }
  formStateRestoreCallback(state: string | File | FormData, mode: 'restore' | 'autocomplete' = 'restore'): void {
    this.formController?.formStateRestore(state, mode);
  }

  protected formValidation(): FormValidation {
    const missing = this.required && !this.checked && !this.effectiveDisabled;
    return applicationValidation({ flags: missing ? { valueMissing: true } : {},
      message: missing ? this.validationText || this.nativeControl?.validationMessage || 'Please select this option.' : '', anchor: this.nativeControl ?? undefined }, this.error);
  }
  protected syncForm(): void { this.formController?.sync(); }

  protected syncControl(): void {
    if (this.nativeControl) {
      this.nativeControl.checked = this.checked;
      this.nativeControl.indeterminate = this.mixed;
    }
  }

  protected handleChange(_event: Event): void {
    if (this.effectiveDisabled) { this.syncControl(); return; }
    this.checkedDefaults.markDirty();
    const proposed = this.nativeControl?.checked ?? !this.checked;
    const connected = this.isConnected;
    dispatchChange(this, {
      previous: this.checked, proposed, reason: 'toggle',
      getRevision: () => this.authorRevision,
      canCommit: () => !this.effectiveDisabled && (!connected || this.isConnected),
      stage: (next) => { this.setChecked(next); this.syncControl(); },
      rollback: (previous) => { this.setChecked(previous); this.syncControl(); },
      commit: () => { this.didCommit(); this.syncForm(); },
    });
    this.syncControl();
  }

  protected didCommit(): void { /* Checkbox additionally clears its mixed state. */ }
  protected override updated(_changes: PropertyValues): void { this.syncForm(); this.syncControl(); }
  protected override render() {
    return choiceTemplate({
      kind: this.kind, checked: this.checked, indeterminate: this.mixed,
      disabled: this.effectiveDisabled, required: this.required, value: this.value,
      label: this.label, description: this.description, error: this.visibleError, tabIndex: this.controlTabIndex,
    }, (event) => this.handleChange(event));
  }
}
