import { ChildUpgrades } from '../internal/child-upgrades.js';
import { applicationValidation, ValidationFeedback } from '../forms-private/validation-feedback.js';
import { DefaultState } from '../forms-private/default-state.js';
import { EnElement } from '../internal/en-element.js';
import { createValueModel } from '@en-reve/primitives/state/value.js';
import { SignalController } from '@en-reve/primitives/interactions/signal-controller.js';
import { dispatchChange } from '@en-reve/primitives/interactions/events.js';
import { FormController } from '@en-reve/primitives/interactions/form-controller.js';
import { foundationStyles, blockHostStyles } from '@en-reve/styles/foundations.js';
import { controlStyles, formStyles } from '@en-reve/styles/controls.js';
import { selectionStyles } from '@en-reve/styles/selection.js';
import type { EnRadio, RadioOwner } from '../radio/index.js';
import { radioGroupTemplate } from './template.js';
import { radioNavigationIndex } from './navigation.js';

/**
 * Single selection with one tab stop and wrapping arrow/Home/End navigation across slotted radio shadows.
 * The group's value owns the children's checked state; the group is the form entry.
 * @tagname en-radio-group
 * @slot - Direct en-radio children with unique nonempty values.
 * @slot label - Visible group label, falling back to the label attribute.
 * @slot description - Supporting text; falls back to the description attribute/property.
 * @csspart field - The outer group field.
 * @csspart options - The radiogroup and option layout.
 * @csspart label - The group label.
 * @csspart description - Supporting text.
 * @csspart error - Associated application or constraint validation feedback.
 * @cssprop --en-space-rows - Gap between options.
 * @fires {import('@en-reve/primitives/interactions/events.js').ChangeEvent<string>} en-change - Tentative, cancelable change; the property and form data expose the proposed state during dispatch.
 */
export class EnRadioGroup extends EnElement implements RadioOwner {
  static override properties = {
    error: { noAccessor: true },
    value: { noAccessor: true, attribute: false },
    defaultValue: { attribute: 'value', noAccessor: true }, disabled: { type: Boolean, reflect: true },
    required: { type: Boolean, reflect: true }, name: { reflect: true }, label: {}, description: {}, orientation: {}, validationText: { attribute: 'validation-text' },
  };
  static override styles = [foundationStyles, blockHostStyles, controlStyles, formStyles, selectionStyles];
  static formAssociated = true;
  protected readonly valueDefaults = new DefaultState<string>(this, 'value',
    attribute => attribute ?? '', value => String(value), value => { this.value = value; });

  private readonly feedback = new ValidationFeedback(this, () => { this.syncForm(); }, () => this.validationMessage);
  /** Application-supplied error; sets custom validity until explicitly cleared. */
  get error(): string { return this.feedback.error; }
  set error(value: string) { this.feedback.error = value; }
  protected get visibleError(): string { return this.feedback.visible; }

  /** Reset default, reflected synchronously to the value attribute. Pristine controls follow default changes. */
  get defaultValue(): string { return this.valueDefaults.value; }
  set defaultValue(value: string) { this.valueDefaults.value = String(value ?? ''); }

  /** @internal Route default attributes without invoking the live-state setter as an author edit. */
  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    if (name === 'value') { this.valueDefaults.attributeChanged(); return; }
    super.attributeChangedCallback(name, old, value);
  }

  private readonly model = createValueModel('');
  private readonly signals = new SignalController(this, () => this.model.view.get());
  private readonly internals = typeof this.attachInternals === 'function' ? this.attachInternals() : undefined;
  private readonly formController = this.internals ? new FormController(this, {
    internals: this.internals,
    value: () => this.radios.some((radio) => radio.value === this.value) ? this.value : null,
    state: () => this.value, disabled: () => this.effectiveDisabled,
    onReset: () => { this.feedback.reset(); this.valueDefaults.reset(); this.focusedValue = undefined; this.syncRadios(); },
    onRestore: (state) => { if (typeof state === 'string') this.value = state; },
    validate: () => {
      const missing = this.required && !this.radios.some((radio) => radio.value === this.value);
      return applicationValidation({ flags: missing ? { valueMissing: true } : {}, message: missing ? this.validationText || 'Please select an option.' : '',
        anchor: this.radios.find((radio) => !radio.disabled)?.radioValidationAnchor }, this.error);
    },
  }) : undefined;
  private revision = 0;
  private formDisabled = false;
  private radios: EnRadio[] = [];
  private readonly upgrades = new ChildUpgrades(this, () => this.collectRadios());
  private focusedValue: string | undefined;

  /** Disable every owned radio and omit this group from form data. */
  declare disabled: boolean;
  /** Require a value corresponding to a child radio. */
  declare required: boolean;
  /** The form entry name; individual grouped radios do not submit. */
  declare name: string;
  /** The visible and accessible group label. */
  declare label: string;
  /** Supporting text associated with the radiogroup. */
  declare description: string;
  /** Visual arrangement. Both arrow axes navigate; horizontal arrows respect direction. */
  declare orientation: 'horizontal' | 'vertical';
  /** Localizable message used when a required group is empty. */
  declare validationText: string;

  constructor() {
    super();
    this.disabled = false; this.required = false;
    this.name = ''; this.label = ''; this.description = ''; this.orientation = 'vertical';
    this.validationText = 'Please select an option.';
  }
  /** Selected child value, or an empty string for no selection. Silent on author writes. */
  get value(): string { return this.model.value.get(); }
  set value(value: string) {
    this.valueDefaults.markDirty();
    ++this.revision;
    this.setValue(String(value ?? ''));
  }

  private setValue(value: string): void {
    const previous = this.value;
    this.model.set(value);
    this.requestUpdate('value', previous);
    this.syncRadios();
    this.syncForm();
  }
  private get effectiveDisabled(): boolean { return this.disabled || this.formDisabled; }
  get form(): HTMLFormElement | null { return this.internals?.form ?? null; }
  get labels(): NodeList | undefined { return this.internals?.labels; }
  get willValidate(): boolean { return this.internals?.willValidate ?? false; }
  get validity(): ValidityState | undefined { return this.internals?.validity; }
  get validationMessage(): string { return this.internals?.validationMessage ?? ''; }
  checkValidity(): boolean { this.syncForm(); return this.internals?.checkValidity?.() ?? true; }
  reportValidity(): boolean { this.syncForm(); return this.internals?.reportValidity?.() ?? true; }
  override focus(options?: FocusOptions): void {
    const enabled = this.radios.filter((radio) => !radio.disabled);
    (enabled.find((radio) => radio.value === this.value) ?? enabled[0])?.focus(options);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    for (const radio of this.radios) radio.setRadioOwner(undefined, radio.checked, false, 0);
    this.radios = [];
  }
  formDisabledCallback(disabled: boolean): void { this.formDisabled = disabled; this.requestUpdate(); this.syncRadios(); this.formController?.formDisabled(disabled); }
  formResetCallback(): void { this.formController?.formReset(); }
  formStateRestoreCallback(state: string | File | FormData, mode: 'restore' | 'autocomplete' = 'restore'): void { this.formController?.formStateRestore(state, mode); }

  /** @internal Called by owned radios after configuration changes. */
  radioConfigurationChanged(): void { this.requestUpdate(); }
  /** @internal Called by an owned radio's native change handler. */
  requestRadioSelection(radio: EnRadio): void {
    if (this.effectiveDisabled || radio.disabled || !this.radios.includes(radio)) return;
    this.focusedValue = radio.value;
    this.propose(radio, 'select');
  }

  private propose(radio: EnRadio, reason: 'select' | 'keyboard'): void {
    this.valueDefaults.markDirty();
    const proposed = radio.value;
    dispatchChange(this, {
      previous: this.value, proposed, reason,
      getRevision: () => this.revision,
      canCommit: next => this.isConnected && !this.effectiveDisabled &&
        (this.renderRoot.querySelector<HTMLSlotElement>('slot:not([name])')?.assignedElements({ flatten: true }) ?? [])
          .some(element => element === radio && radio.value === next && !radio.disabled),
      stage: (next) => this.setValue(next),
      rollback: (previous) => this.setValue(previous),
    });
    this.syncRadios();
  }

  private collectRadios = (): void => {
    const assigned = this.renderRoot.querySelector<HTMLSlotElement>('slot:not([name])')?.assignedElements({ flatten: true }) ?? [];
    this.upgrades.watch(assigned);
    const radios = assigned.filter((element): element is EnRadio =>
      element.localName === 'en-radio' && element.matches(':defined') && typeof (element as EnRadio).setRadioOwner === 'function');
    for (const radio of this.radios) if (!radios.includes(radio)) radio.setRadioOwner(undefined, radio.checked, false, 0);
    this.radios = radios;
    this.syncRadios();
    this.syncForm();
  };

  private syncRadios(): void {
    const enabled = this.radios.filter((radio) => !radio.disabled);
    const tabStop = enabled.find((radio) => radio.value === this.focusedValue)
      ?? enabled.find((radio) => radio.value === this.value) ?? enabled[0];
    for (const radio of this.radios) radio.setRadioOwner(
      this, radio.value === this.value, this.effectiveDisabled, radio === tabStop && !this.effectiveDisabled ? 0 : -1,
    );
  }

  private syncForm(): void {
    this.formController?.sync();
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (this.effectiveDisabled || event.altKey || event.ctrlKey || event.metaKey) return;
    const current = event.composedPath().find((node) => this.radios.includes(node as EnRadio)) as EnRadio | undefined;
    if (!current) return;
    const enabled = this.radios.filter((radio) => !radio.disabled);
    const index = enabled.indexOf(current);
    if (index < 0) return;
    const rtl = getComputedStyle(this).direction === 'rtl';
    const nextIndex = radioNavigationIndex(event.key, index, enabled.length, rtl);
    if (nextIndex === undefined) return;
    event.preventDefault();
    const next = enabled[nextIndex];
    if (!next) return;
    this.focusedValue = next.value;
    this.propose(next, 'keyboard');
    next.focus();
  };

  protected override updated(): void { this.collectRadios(); }
  protected override render() {
    return radioGroupTemplate({ label: this.label, description: this.description, orientation: this.orientation,
      disabled: this.effectiveDisabled, required: this.required, error: this.visibleError }, this.collectRadios, this.handleKeyDown);
  }
}

declare global { interface HTMLElementTagNameMap { 'en-radio-group': EnRadioGroup; } }
