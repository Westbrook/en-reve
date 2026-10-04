import { html, nothing, type PropertyValues } from 'lit';
import { html as staticHtml, unsafeStatic } from 'lit/static-html.js';
import { repeat } from 'lit/directives/repeat.js';
import { SelectionChildrenController, SELECTION_CHILDREN_ATTRIBUTE } from '@en-reve/primitives/interactions/selection-children.js';
import type { FormValidation } from '@en-reve/primitives/interactions/form-controller.js';
import { dispatchDraftInput } from '@en-reve/primitives/interactions/events.js';
import { selectEnhancementStyles } from '@en-reve/styles/controls.js';
import { FormFieldElement } from '../forms-private/form-field.js';

export interface SelectItem {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

/**
 * A labeled native single select. Direct en-select-option descriptors take precedence over items.
 * The parent renders private native options; descriptor nodes are metadata, not native options.
 * Cancel en-change to reject a provisional selection; author value writes remain authoritative.
 * @cssprop --en-select-pressed-scale - select held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-select-pressed-offset - select held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-select-press-duration - select held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-select-release-duration - select held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-select-pressed-shadow - select held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-select-pressed-background - select held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-select-pressed-color - select held-state refinement; geometry is bounded and reduced motion wins.
 * @tagname en-select
 * @slot - Direct en-select-option descriptors; their content supplies plain option labels.
 * @csspart focus-frame - Noninteractive field frame supporting the supplemental focus accent.
 * @slot label - Visible field label; falls back to label.
 * @slot description - Supporting text; falls back to the description attribute/property.
 * @csspart field - Field layout.
 * @csspart label - Visible label.
 * @csspart control - Native select.
 * @csspart control-invalid - Native control while associated application or reported constraint feedback is visible.
 * @csspart option - Native option; picker styling depends on browser support.
 * @csspart description - Supporting text.
 * @csspart error - Validation feedback.
 * @cssprop --en-input-border-color - Optional theme presentation; see the customization registry for state, fallback and reachability.
 * @cssprop --en-input-border-width - Optional theme presentation; see the customization registry for state, fallback and reachability.
 * @cssprop --en-input-hover-border-color - Optional theme presentation; see the customization registry for state, fallback and reachability.
 * @cssprop --en-input-invalid-border-color - Optional theme presentation; see the customization registry for state, fallback and reachability.
 * @cssprop --en-input-invalid-border-width - Optional theme presentation; see the customization registry for state, fallback and reachability.
 * @cssprop --en-input-radius - Optional theme presentation; see the customization registry for state, fallback and reachability.
 * @cssprop --en-input-focus-width - Width of the immediate input-family focus contour.
 * @cssprop --en-input-focus-color - Color of the immediate input-family focus contour.
 * @cssprop --en-input-focus-offset - Offset of the immediate input-family focus contour.
 * @cssprop --en-input-focus-halo-width - Width of the supplemental input-family focus halo.
 * @cssprop --en-input-focus-halo-color - Color of the supplemental input-family focus halo.
 * @cssprop --en-input-focus-accent-width - Thickness of the optional bottom focus accent on the field frame.
 * @cssprop --en-input-focus-accent-color - Color of the optional bottom focus accent on the field frame.
 * @cssprop --en-duration-focus-enter - Entry duration for supplemental focus decoration; the focus contour appears immediately.
 * @cssprop --en-duration-focus-exit - Exit duration for supplemental focus decoration.
 * @cssprop --en-ease-focus-enter - Entry easing for supplemental focus decoration.
 * @cssprop --en-ease-focus-exit - Exit easing for supplemental focus decoration.
 * @cssprop --en-control-background - Control background.
 * @cssprop --en-input-background - Field fill falling back to the shared control background.
 * @cssprop --en-input-color - Field text falling back to the shared control color.
 * @cssprop --en-control-radius - Control corner radius.
 * @cssprop --en-field-gap - Gap between label, control and supporting text.
 * @cssprop --en-input-inline-padding - Text-editor inline padding; takes precedence over shared control-inline-padding.
 * @cssprop --en-control-min-size - Minimum control block size.
 * @cssprop --en-select-appearance - Enhanced picker appearance where supported; auto retains the platform picker.
 * @cssprop --en-option-list-background - Option-list surface fill; falls back to the shared overlay hook.
 * @cssprop --en-option-list-color - Option-list surface text; falls back to the shared overlay hook.
 * @cssprop --en-option-list-border-color - Option-list boundary, independent of field and dialog boundaries.
 * @cssprop --en-option-list-radius - Option-list surface corners, independent of the trigger and dialog.
 * @cssprop --en-option-list-padding - Option-list surface inset, independent of dialog padding.
 * @csspart selected-button - Native customizable-select button; browser-owned interaction.
 * @csspart selected-content - Selected label, truncated independently of the caret.
 * @cssprop --en-option-list-gap - Spacing between options.
 * @cssprop --en-option-list-shadow - Option-list elevation; system colors retain a visible boundary.
 * @cssprop --en-option-list-max-block-size - Option-list height ceiling; available viewport space remains an upper bound.
 * @cssprop --en-option-radius - Option corners; otherwise derived from the effective list surface inset and radius.
 * @cssprop --en-option-inline-padding - Option inline inset, independent of the trigger when set.
 * @cssprop --en-option-block-padding - Option block inset; content and interaction targets may increase row height.
 * @cssprop --en-option-font-weight - Ordinary option weight.
 * @cssprop --en-option-selected-font-weight - Selected option weight, independent of its checkmark and fill.
 * @cssprop --en-option-rest-background - Rest option fill; refines the broad option override.
 * @cssprop --en-option-rest-color - Rest option text; refines the broad option override.
 * @cssprop --en-option-hover-background - Hover option fill; refines the broad option override.
 * @cssprop --en-option-hover-color - Hover option text; refines the broad option override.
 * @cssprop --en-option-pressed-background - Pressed option fill; refines the broad option override.
 * @cssprop --en-option-pressed-color - Pressed option text; refines the broad option override.
 * @cssprop --en-option-selected-background - Selected option fill; refines the broad option override.
 * @cssprop --en-option-selected-color - Selected option text; refines the broad option override.
 * @cssprop --en-option-disabled-background - Disabled option fill; refines the broad option override.
 * @cssprop --en-option-disabled-color - Disabled option text; refines the broad option override.
 * @cssprop --en-option-background - Broad option fill fallback in the enhanced native picker.
 * @cssprop --en-option-color - Broad option text fallback in the enhanced native picker.
 * @cssprop --en-overlay-background - Shared overlay fill fallback for the option list.
 * @cssprop --en-overlay-color - Shared overlay text fallback for the option list.
 * @cssprop --en-overlay-border-color - Shared overlay boundary fallback for the option list.
 * @cssprop --en-overlay-radius - Shared overlay corner fallback for the option list.
 * @cssprop --en-overlay-padding - Shared overlay inset fallback for the option list.
 * @cssprop --en-overlay-max-block-size - Shared overlay height ceiling fallback for the option list.
 * @fires {import('../events.js').DraftInputEvent} en-input - Current native selected draft.
 * @fires {import('../events.js').FieldChangeEvent} en-change - Cancelable selection change; provisional value and form data are available during dispatch.
 */
export class EnSelect extends FormFieldElement {
  static styles = [...FormFieldElement.styles, selectEnhancementStyles];
  static properties = { ...FormFieldElement.properties, items: { attribute: false } };
  /** Native option descriptions; labels are rendered as text, never HTML. Values should be unique. */
  declare items: readonly SelectItem[];

  private readonly childOptions = new SelectionChildrenController(this, 'select');
  private hydrationChoice = this.captureHydrationChoice();
  private hydrationRevision = 0;

  constructor() { super(); this.items = []; }

  override connectedCallback(): void {
    // Initial attributes are the server baseline. A subsequent setter, including
    // Lit's replay of an own pre-upgrade property, is authoritative.
    this.hydrationRevision = this.valueRevision;
    super.connectedCallback();
  }

  private captureHydrationChoice(): { value: string; baseline: string } | undefined {
    const control = this.shadowRoot?.querySelector<HTMLSelectElement>('#control');
    if (!control || !this.hasAttribute(SELECTION_CHILDREN_ATTRIBUTE)) return undefined;
    return { value: control.value, baseline: [...control.options].find(option => option.defaultSelected)?.value
      ?? [...control.options].find(option => !option.disabled)?.value ?? '' };
  }

  private get effectiveItems(): readonly (SelectItem & { readonly key?: string; readonly hidden?: boolean })[] {
    return this.childOptions.view.active ? this.childOptions.view.items : this.items;
  }
  private currentItems(): readonly (SelectItem & { readonly hidden?: boolean })[] {
    const children = this.childOptions.current();
    return children.active ? children.items : this.items;
  }
  protected override get visibleError(): string { return this.childOptions?.view.error || super.visibleError; }
  protected override get submissionValue(): string | null {
    if (this.value === '' && this.placeholder) return '';
    return this.currentItems().some(item => item.value === this.value && !item.disabled && !item.hidden) ? this.value : null;
  }
  protected override canCommitValue(value: string): boolean {
    return !this.isDisabled && ((value === '' && !!this.placeholder) || this.currentItems().some(item => item.value === value && !item.disabled && !item.hidden));
  }
  protected override validateAcceptedValue(): FormValidation {
    const validation = super.validateAcceptedValue();
    const error = this.childOptions?.current().error;
    if (error) return { ...validation, flags: { ...validation.flags, customError: true }, message: error };
    if (this.required && this.submissionValue === null) {
      // Ask the native control for the localized missing-selection message even
      // when its currently checked disabled option is natively considered valid.
      const missing = this.controlNode?.cloneNode(true) as HTMLSelectElement | undefined;
      if (missing) { missing.selectedIndex = -1; missing.setCustomValidity(''); }
      return { ...validation, flags: { ...validation.flags, valueMissing: true },
        message: this.error || missing?.validationMessage || 'Please select an option.' };
    }
    return validation;
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed); // Record reset state before adopting early native input.
    const choice = this.hydrationChoice;
    if (!choice) return;
    this.hydrationChoice = undefined;
    if (this.valueRevision === this.hydrationRevision && this.value === this.childOptions.initialValue && choice.value !== choice.baseline) {
      this.requestValue(choice.value, 'hydrate');
    }
  }

  protected reconcile(): void {
    const control = this.controlNode as HTMLSelectElement | null;
    if (this.hydrationChoice && !this.hasUpdated) return;
    // Preserve native exploration between input and change; some pickers yield
    // a rendering microtask between those events. onChange reconciles a canceled
    // transaction back to its accepted value before the change handler returns.
    const draft = this.model.draft.get();
    if (control && control.value !== draft) control.value = draft;
  }

  private onInput(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.model.setDraft(value);
    dispatchDraftInput(this, { value, isComposing: false, inputType: 'insertReplacementText' });
  }

  private onChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.model.setDraft(value);
    this.requestValue(value, 'change');
    this.model.setValue(this.value);
    this.reconcile();
    this.syncForm();
  }

  protected renderControl() {
    const items = this.effectiveItems;
    // selectedcontent clones option descendants, including SSR part markers.
    // Static escaped text keeps those markers outside the cloned option contents.
    const optionText = (value:string) => unsafeStatic(value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'));
    // Keep the first hydration branch identical to the server snapshot, even
    // when an authoritative pending setter will replace its selected value.
    const defaultValue = !this.hasUpdated && this.childOptions.initialValue !== undefined
      ? this.childOptions.initialValue : this.defaultControlValue;
    const blankDefault = !this.placeholder && items.length > 0 && !items.some(item => item.value === defaultValue);
    return html`<select id="control" class="en-select" part=${this.visibleError ? 'control control-invalid' : 'control'} name=${this.name}
      ?disabled=${this.isDisabled} ?required=${this.required}
      aria-describedby=${this.describedBy} aria-invalid=${this.controlAriaInvalid}
      @input=${this.onInput} @change=${this.onChange}>
      <button type="button" part="selected-button"><selectedcontent part="selected-content"></selectedcontent></button>
      ${this.placeholder ? staticHtml`<option part="option" value="" ?selected=${defaultValue === ''}>${optionText(this.placeholder)}</option>`
        : blankDefault ? html`<option value="" selected disabled hidden></option>` : nothing}
      ${repeat(items, item => item.key ?? item.value, item => staticHtml`<option part="option" value=${item.value} ?selected=${item.value === defaultValue}
        ?disabled=${item.disabled} ?hidden=${item.hidden}>${optionText(item.label || '')}</option>`)}
    </select>`;
  }
}

declare global { interface HTMLElementTagNameMap { 'en-select': EnSelect; } }
