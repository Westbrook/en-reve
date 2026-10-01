import { applicationValidation, ValidationFeedback } from '../forms-private/validation-feedback.js';
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

/** Form and state plumbing shared by scalar selection controls. */
export abstract class NumericChoiceBase extends EnElement {
  static override properties = {
    error: { noAccessor: true },
    value: { type: Number, noAccessor: true, attribute: false },
    defaultValue: { attribute: 'value', noAccessor: true },
    disabled: { type: Boolean, reflect: true }, name: { reflect: true }, label: {}, description: {},
  };
  static override styles = [foundationStyles, blockHostStyles, controlStyles, formStyles, selectionStyles];
  static formAssociated = true;
  protected readonly valueDefaults = new DefaultState<number>(this, 'value',
    attribute => Number(attribute ?? 0), value => String(value), value => { this.value = value; });

  private readonly feedback = new ValidationFeedback(this, () => { this.formController?.sync(); }, () => this.validationMessage);
  /** Application-supplied error; sets custom validity until explicitly cleared. */
  get error(): string { return this.feedback.error; }
  set error(value: string) { this.feedback.error = value; }
  protected get visibleError(): string { return this.feedback.visible; }

  /** Reset default, reflected synchronously to the value attribute. Pristine controls follow default changes. */
  get defaultValue(): number { return this.valueDefaults.value; }
  set defaultValue(value: number) { this.valueDefaults.value = Number(value); }

  /** @internal Route default attributes without invoking the live-state setter as an author edit. */
  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    if (name === 'value') { this.valueDefaults.attributeChanged(); return; }
    super.attributeChangedCallback(name, old, value);
  }

  protected readonly model = createValueModel(0);
  protected readonly signals = new SignalController(this, () => this.model.view.get());
  protected readonly internals = typeof this.attachInternals === 'function' ? this.attachInternals() : undefined;
  protected authorRevision = 0;
  protected formDisabled = false;
  protected readonly formController = this.internals ? new FormController(this, {
    internals: this.internals, value: () => String(this.value), disabled: () => this.effectiveDisabled,
    control: () => this.validationControl,
    validate: () => applicationValidation({ anchor: this.validationAnchor ?? undefined, ...this.validateForm() }, this.error),
    onReset: () => { this.feedback.reset(); this.valueDefaults.reset(); this.syncControl(); },
    onRestore: (state) => { if (typeof state === 'string') this.value = Number(state); this.syncControl(); },
  }) : undefined;

  /** Disable interaction and omit the entry from form data. */
  declare disabled: boolean;
  /** The form entry name. */
  declare name: string;
  /** Plain-text label fallback when no label content is slotted. */
  declare label: string;
  /** Supporting text associated with the native control or group. */
  declare description: string;
  constructor() {
    super(); this.disabled = false;
    this.name = ''; this.label = ''; this.description = '';
    this.addEventListener('en-input', () => this.valueDefaults.markDirty(), { capture: true });
  }
  /** Current numeric value; user changes are tentative during en-change. The value attribute defines the reset default. */
  get value(): number { return this.model.value.get(); }
  set value(value: number) {
    this.valueDefaults.markDirty();
    ++this.authorRevision;
    this.setValue(this.normalizeValue(Number(value)));
    this.onValueWrite();
    this.formController?.sync();
  }

  /** Update numeric state without discarding an editable draft or claiming an author write. */
  private setValue(value: number): void {
    const previous = this.value;
    this.model.set(value);
    this.requestUpdate('value', previous);
    this.formController?.sync();
  }
  protected get effectiveDisabled(): boolean { return this.disabled || this.formDisabled; }
  protected abstract normalizeValue(value: number): number;
  protected abstract syncControl(): void;
  /** Reconcile any local editor on every authoritative write, including same-value writes. */
  protected onValueWrite(): void {}
  /** Optional draft validation remains owned by the shared form controller. */
  protected validateForm(): FormValidation { return { flags: {} }; }
  protected get validationControl(): HTMLInputElement | null { return null; }
  protected get validationAnchor(): HTMLElement | null { return this.validationControl; }
  get form(): HTMLFormElement | null { return this.internals?.form ?? null; }
  get labels(): NodeList | undefined { return this.internals?.labels; }
  get willValidate(): boolean { return this.internals?.willValidate ?? false; }
  get validity(): ValidityState | undefined { return this.internals?.validity; }
  get validationMessage(): string { return this.internals?.validationMessage ?? ''; }
  checkValidity(): boolean { this.formController?.sync(); return this.internals?.checkValidity?.() ?? true; }
  reportValidity(): boolean { this.formController?.sync(); return this.internals?.reportValidity?.() ?? true; }
  formDisabledCallback(disabled: boolean): void {
    this.formDisabled = disabled; this.formController?.formDisabled(disabled); this.requestUpdate();
    // Attribute reflection can invoke this after render, while Lit still considers
    // the update pending. Render the browser's effective state in the next turn.
    queueMicrotask(() => this.requestUpdate());
  }
  formResetCallback(): void { this.formController?.formReset(); }
  formStateRestoreCallback(state: string | File | FormData, mode: 'restore' | 'autocomplete' = 'restore'): void {
    this.formController?.formStateRestore(state, mode);
  }
  protected propose(value: number, reason: 'input' | 'select' | 'change'): void {
    const proposed = this.normalizeValue(value);
    if (this.effectiveDisabled) return;
    this.valueDefaults.markDirty();
    const connected = this.isConnected;
    dispatchChange(this, {
      previous: this.value, proposed, reason,
      getRevision: () => this.authorRevision,
      stage: (next) => { this.setValue(next); this.syncControl(); },
      rollback: (previous) => { this.setValue(previous); this.syncControl(); },
      // A listener may synchronously change constraints before acceptance.
      canCommit: (next) => !this.effectiveDisabled && (!connected || this.isConnected) && this.normalizeValue(next) === next,
      commit: () => {
        this.onValueWrite();
        this.formController?.sync();
      },
    });
    this.syncControl();
  }
  protected override updated(_changes: PropertyValues): void { this.syncControl(); this.formController?.sync(); }
}
