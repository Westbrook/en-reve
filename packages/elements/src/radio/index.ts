import type { PropertyValues } from 'lit';
import type { FormValidation } from '@en-reve/primitives/interactions/form-controller.js';
import { ChoiceBase } from '../checkbox/choice-base.js';

/** Internal composition adapter; consumers control a grouped selection through en-radio-group.value. */
export interface RadioOwner {
  requestRadioSelection(radio: EnRadio): void;
  radioConfigurationChanged(): void;
}

/**
 * A native radio option. Place related options in en-radio-group for cross-shadow selection and arrow-key navigation.
 * @cssprop --en-radio-pressed-scale - radio held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-radio-pressed-offset - radio held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-radio-press-duration - radio held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-radio-release-duration - radio held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-radio-pressed-shadow - radio held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-radio-pressed-border-color - radio held-state refinement; geometry is bounded and reduced motion wins.
 * @tagname en-radio
 * @slot - The visible option label.
 * @slot label - Preferred visible option label; falls back to the default slot and then the label attribute.
 * @slot description - Supporting text; falls back to the description attribute/property.
 * @csspart field - The option field.
 * @csspart control - The native radio.
 * @csspart label - The associated option label.
 * @csspart label-text - Label content referenced by the native control; plain labels may be visually omitted with display:none.
 * @csspart description - Supporting text.
 * @csspart error - Associated application or constraint validation feedback.
 * @cssprop --en-choice-size - Optional family presentation; see the customization registry.
 * @cssprop --en-color-action - Default selected radio color when no radio-specific override is set.
 * @cssprop --en-radio-selected-color - Optional checked rim and dot color. Disabled, focus and forced-color states retain their own roles.
 * @fires {import('@en-reve/primitives/interactions/events.js').ChangeEvent<boolean>} en-change - Tentative, cancelable change; the property and form data expose the proposed state during dispatch. Grouped options route selection to their group.
 */
export class EnRadio extends ChoiceBase {
  private owner?: RadioOwner;
  private groupDisabled = false;
  private groupTabIndex = 0;
  protected override get kind(): 'radio' { return 'radio'; }
  protected override get effectiveDisabled(): boolean { return super.effectiveDisabled || this.groupDisabled; }
  protected override get controlTabIndex(): number { return this.groupTabIndex; }
  /** @internal Native validation anchor for the owning group's FACE adapter. */
  get radioValidationAnchor(): HTMLInputElement | undefined { return this.nativeControl ?? undefined; }

  /** @internal Coordinate without assuming native radio names cross a shadow root. */
  setRadioOwner(owner: RadioOwner | undefined, checked: boolean, disabled: boolean, tabIndex: number): void {
    const changed = this.owner !== owner || this.groupDisabled !== disabled || this.groupTabIndex !== tabIndex;
    this.owner = owner;
    this.groupDisabled = disabled;
    this.groupTabIndex = tabIndex;
    if (this.checked !== checked) this.setChecked(checked);
    if (changed) this.requestUpdate();
    this.syncControl();
    this.syncForm();
  }

  protected override handleChange(event: Event): void {
    if (!this.owner) { super.handleChange(event); return; }
    // The group owns the change. Do not leak a second native child notification.
    event.preventDefault();
    event.stopPropagation();
    if (!this.effectiveDisabled) this.owner.requestRadioSelection(this);
    this.syncControl();
  }

  protected override get formValue(): string | null { return this.owner ? null : super.formValue; }
  protected override formValidation(): FormValidation { return this.owner ? { flags: {} } : super.formValidation(); }
  override formResetCallback(): void { if (!this.owner) super.formResetCallback(); }
  override formStateRestoreCallback(state: string | File | FormData, mode: 'restore' | 'autocomplete' = 'restore'): void {
    if (!this.owner) super.formStateRestoreCallback(state, mode);
  }

  protected override updated(changes: PropertyValues): void {
    super.updated(changes);
    if (changes.has('disabled') || changes.has('value') || changes.has('checked')) this.owner?.radioConfigurationChanged();
  }
}

declare global { interface HTMLElementTagNameMap { 'en-radio': EnRadio; } }
