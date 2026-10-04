import { setNativeSurfaceOpen } from '../internal/native-surface.js';
import type { PropertyValues, TemplateResult } from 'lit';
import { createDraftModel } from '@en-reve/primitives/state/draft.js';
import { EditingController } from '@en-reve/primitives/interactions/editing-controller.js';
import { SignalController } from '@en-reve/primitives/interactions/signal-controller.js';
import { dispatchChange } from '@en-reve/primitives/interactions/events.js';
import type { DraftInputDetail } from '@en-reve/primitives/interactions/events.js';
import type { FormValidation } from '@en-reve/primitives/interactions/form-controller.js';
import { comboboxStyles } from '@en-reve/styles/combobox.js';
import { FormFieldElement } from '../forms-private/form-field.js';
import { createComboboxModel, type ComboboxItem } from './model.js';
import { ComboboxInteractionController } from './interaction-controller.js';
import { ComboboxPositionController } from './position-controller.js';
import { ComboboxSpaceFeedbackController } from './space-feedback-controller.js';
import { comboboxTemplate } from './template.js';

export type { ComboboxItem } from './model.js';

/**
 * An editable, single-selection finite catalog. Value is an accepted item ID;
 * native text is a temporary filter and never implicitly accepts an option.
 * @cssprop --en-input-border-color - Optional theme presentation; see the customization registry for state, fallback and reachability.
 * @cssprop --en-input-border-width - Optional theme presentation; see the customization registry for state, fallback and reachability.
 * @cssprop --en-input-hover-border-color - Optional theme presentation; see the customization registry for state, fallback and reachability.
 * @cssprop --en-input-invalid-border-color - Optional theme presentation; see the customization registry for state, fallback and reachability.
 * @cssprop --en-input-invalid-border-width - Optional theme presentation; see the customization registry for state, fallback and reachability.
 * @cssprop --en-input-radius - Optional theme presentation; see the customization registry for state, fallback and reachability.
 * @cssprop --en-popup-enter-duration - Optional theme presentation; see the customization registry for state, fallback and reachability.
 * @cssprop --en-popup-enter-ease - Optional theme presentation; see the customization registry for state, fallback and reachability.
 * @cssprop --en-popup-exit-duration - Optional theme presentation; see the customization registry for state, fallback and reachability.
 * @cssprop --en-popup-exit-ease - Optional theme presentation; see the customization registry for state, fallback and reachability.
 * @cssprop --en-duration-enter - Optional native surface entry paint duration (0–500ms).
 * @cssprop --en-duration-exit - Optional native surface exit paint duration (0–500ms); never delays state or focus.
 * @cssprop --en-ease-enter - Native surface entry easing.
 * @cssprop --en-ease-exit - Native surface exit easing.
 * @cssprop --en-combobox-trigger-pressed-scale - combobox-trigger held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-combobox-trigger-pressed-offset - combobox-trigger held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-combobox-trigger-press-duration - combobox-trigger held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-combobox-trigger-release-duration - combobox-trigger held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-combobox-trigger-pressed-shadow - combobox-trigger held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-combobox-trigger-pressed-background - combobox-trigger held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-combobox-trigger-pressed-color - combobox-trigger held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-option-pressed-scale - option held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-option-pressed-offset - option held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-option-press-duration - option held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-option-release-duration - option held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-option-pressed-shadow - option held-state refinement; geometry is bounded and reduced motion wins.
 * @tagname en-combobox
 * @cssprop --en-option-focus-width - Immediate primary focus contour width.
 * @cssprop --en-option-focus-color - Immediate primary focus contour color.
 * @cssprop --en-option-focus-offset - Signed primary focus contour offset.
 * @cssprop --en-option-focus-halo-width - Supplemental outer focus halo width.
 * @cssprop --en-option-focus-halo-color - Supplemental focus halo color; alpha is supported.
 * @slot label - Visible field label, falling back to label.
 * @slot description - Supporting text, falling back to description.
 * @csspart field - Complete field layout.
 * @csspart label - Same-shadow native label.
 * @csspart control - Native textbox with combobox semantics.
 * @csspart control-invalid - Native textbox while associated application or reported constraint feedback is visible.
 * @csspart focus-frame - Noninteractive field frame supporting the supplemental focus accent.
 * @csspart trigger - Native disclosure button, outside the sequential Tab order.
 * @csspart popup - Native manual popover, or inline fallback surface.
 * @csspart listbox - Same-shadow suggestion list.
 * @csspart option - Plain-text selectable result.
 * @csspart option-selected - Accepted option; additive to option.
 * @csspart option-active - Keyboard candidate; additive to option and independent of selection.
 * @csspart option-disabled - Unavailable option; additive to option.
 * @csspart option-label - Plain-text result label.
 * @csspart option-indicator - Decorative selection checkmark.
 * @csspart status - Loading, failure or no-results text outside the listbox.
 * @csspart space-status - Polite, persistent no-room feedback outside the popup; empty before needed.
 * @csspart description - Associated supporting text.
 * @csspart error - Associated validation feedback.
 * @cssprop --en-input-background - Input fill; takes precedence over the shared control default.
 * @cssprop --en-input-color - Input text; takes precedence over the shared control default.
 * @cssprop --en-input-inline-padding - Input inset before reserving the disclosure target.
 * @cssprop --en-control-radius - Textbox frame radius.
 * @cssprop --en-overlay-background - Popup surface fill.
 * @cssprop --en-overlay-max-block-size - Popup height ceiling, also limited by available viewport space.
 * @cssprop --en-option-background - Result row fill.
 * @cssprop --en-option-color - Result row text color.
 * @cssprop --en-option-list-background - Option-list surface fill; falls back to the shared overlay hook.
 * @cssprop --en-option-list-color - Option-list surface text; falls back to the shared overlay hook.
 * @cssprop --en-option-list-border-color - Option-list boundary, independent of field and dialog boundaries.
 * @cssprop --en-option-list-radius - Option-list surface corners, independent of the trigger and dialog.
 * @cssprop --en-option-list-padding - Option-list surface inset, independent of dialog padding.
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
 * @cssprop --en-option-active-background - Keyboard candidate paint; independent of committed selection and its persistent focus contour.
 * @cssprop --en-option-active-color - Keyboard candidate paint; independent of committed selection and its persistent focus contour.
 * @cssprop --en-overlay-color - Shared overlay text fallback for the option list.
 * @cssprop --en-overlay-border-color - Shared overlay boundary fallback for the option list.
 * @cssprop --en-overlay-radius - Shared overlay corner fallback for the option list.
 * @cssprop --en-overlay-padding - Shared overlay inset fallback for the option list.
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
 * @fires {import('../events.js').DraftInputEvent} en-input - Native query draft with value, isComposing and inputType; value is not an item ID.
 * @fires {import('../events.js').FieldChangeEvent} en-change - Cancelable accepted-ID change; provisional value and form data are available during dispatch.
 */
export class EnCombobox extends FormFieldElement {
  static override styles = [...FormFieldElement.styles, comboboxStyles];
  static override properties = {
    ...FormFieldElement.properties,
    items: { attribute: false, noAccessor: true },
    readOnly: { type: Boolean, attribute: 'readonly', reflect: true },
    autocomplete: {}, loading: { type: Boolean }, loadError: { attribute: 'load-error' },
    toggleLabel: { attribute: 'toggle-label' }, emptyText: { attribute: 'empty-text' },
    loadingText: { attribute: 'loading-text' }, validationText: { attribute: 'validation-text' },
    noRoomText: { attribute: 'no-room-text' },
  };

  declare readOnly: boolean;
  /** Native autocomplete hint; defaults to off for this finite catalog filter. */
  declare autocomplete: string;
  /** External pending state; suggestions cannot be accepted while true. */
  declare loading: boolean;
  /** External result failure; separate from the field's validation error. */
  declare loadError: string;
  declare toggleLabel: string;
  declare emptyText: string;
  declare loadingText: string;
  declare validationText: string;
  /** Localized feedback after persistent lack of usable popup space; not a validation error. */
  declare noRoomText: string;

  private readonly query = createDraftModel();
  private readonly optionsModel = createComboboxModel();
  private readonly observer = new SignalController(this, () => [this.query.view.get(), this.optionsModel.view.get()]);
  private readonly editing = new EditingController(this, {
    model: this.query, control: () => this.input,
    onInput: detail => this.onQueryInput(detail),
    // Native input/change/composition/hydration can only edit a filter, never an accepted ID.
  });
  private readonly interaction = new ComboboxInteractionController(this, {
    input: () => this.input, disabled: () => this.isDisabled || this.readOnly,
    composing: () => this.query.isComposing.get(), dirty: () => this.query.draft.get() !== this.acceptedLabel,
    open: () => this.optionsModel.open.get(), active: () => this.suggestionsBlocked || (!this.fallback && !this.popupPresented) ? undefined : this.optionsModel.activeOption.get()?.value,
    expanded: () => this.optionsModel.open.get() && (this.fallback || this.popupPresented),
    show: () => this.showOptions(), exit: () => this.restoreLabel(),
    move: direction => { if (!this.suggestionsBlocked && !this.popupSuspended) this.optionsModel.move(direction); },
    choose: value => this.chooseOption(value),
  });
  private readonly spaceFeedback = new ComboboxSpaceFeedbackController(this, {
    enabled: () => this.optionsModel.open.get() && !this.fallback && !this.isDisabled && !this.readOnly,
    composing: () => this.query.isComposing.get(),
    region: () => this.renderRoot?.querySelector<HTMLElement>('[part="space-status"]') ?? null,
  });
  private readonly positioning = new ComboboxPositionController(this, {
    anchor: () => this.input, popup: () => this.popup, open: () => this.optionsModel.open.get() && !this.fallback,
    resized: () => this.revealActiveOption(),
    presented: (state, reason) => {
      this.spaceFeedback.update(state === 'pending' ? 'pending' : reason === 'no-room' ? 'no-room' : 'clear');
      const visible = state === 'visible';
      const suspended = state === 'suspended';
      if (visible !== this.popupPresented || suspended !== this.popupSuspended) {
        this.popupPresented = visible; this.popupSuspended = suspended; this.requestUpdate();
      }
    },
  });
  private revision = 0;
  private selectionDepth = 0;
  /** Accepted ID whose label last established the native query baseline. */
  private queryValue = '';
  private initialLabel?: string;
  private knownLabel = '';
  private knownValue = '';
  private fallback = false;
  private popupPresented = false;
  private popupSuspended = false;
  private activeId?: string;

  constructor() {
    super();
    this.readOnly = false; this.autocomplete = 'off'; this.loading = false; this.loadError = '';
    this.toggleLabel = 'Show options'; this.emptyText = 'No matching options.';
    this.loadingText = 'Loading options.'; this.validationText = 'Choose an option from the list.';
    this.noRoomText = 'Suggestions cannot be shown in the available space.';
  }

  /** Replace the finite catalog. Item values must be unique; an authored empty value permits clearing. */
  get items(): readonly ComboboxItem[] { return this.optionsModel?.items.get() ?? []; }
  set items(items: readonly ComboboxItem[]) {
    const previous = this.items;
    const provisional = this.selectionDepth > 0 && this.value !== this.queryValue;
    const wasDraft = provisional || (this.query ? this.query.draft.get() !== this.acceptedLabel : false);
    this.optionsModel?.setItems(items);
    this.rememberLabel();
    if (!wasDraft) this.query?.setValue(this.acceptedLabel);
    this.editing?.sync();
    this.syncForm();
    this.requestUpdate('items', previous);
  }

  /** Accepted option ID. Author writes, including the same ID, silently restore its label. */
  override get value(): string { return super.value; }
  override set value(value: string) {
    ++this.revision;
    super.value = value;
    this.rememberLabel();
    this.restoreLabel();
  }

  private get input(): HTMLInputElement | null { return this.controlNode as HTMLInputElement | null; }
  private get popup(): HTMLElement | null { return this.renderRoot?.querySelector<HTMLElement>('[part="popup"]') ?? null; }
  private get suggestionsBlocked(): boolean { return this.loading || Boolean(this.loadError); }
  private get acceptedLabel(): string {
    return this.items.find(item => item.value === this.value)?.label ?? (this.knownValue === this.value ? this.knownLabel : '');
  }
  private rememberLabel(): void {
    const item = this.items.find(item => item.value === this.value);
    if (item) { this.knownLabel = item.label; this.knownValue = item.value; }
    else if (this.knownValue !== this.value) { this.knownValue = this.value; this.knownLabel = ''; }
  }
  protected override get defaultControlValue(): string { return this.initialLabel ?? this.acceptedLabel; }
  protected override reconcile(): void { this.editing?.sync(); }

  /** Select the displayed native text; this does not accept a catalog option. */
  select(): void { this.input?.select(); }

  protected override willUpdate(changes: PropertyValues): void {
    super.willUpdate(changes);
    if (this.initialLabel === undefined) {
      this.rememberLabel(); this.initialLabel = this.acceptedLabel;
      this.query.setValue(this.acceptedLabel);
      this.queryValue = this.value;
    }
    if ((changes.has('disabled') || changes.has('readOnly')) && (this.isDisabled || this.readOnly)) this.restoreLabel();
  }

  private onQueryInput(detail: DraftInputDetail): void {
    // A public en-input listener may have author-written value. Read the reconciled
    // model, never replay captured event text over that synchronous decision.
    if (this.isDisabled || this.readOnly || this.query.hasDeferredValue.get()) return;
    if (!this.query.isComposing.get()) {
      this.optionsModel.setQuery(this.query.view.get().dirty ? this.query.draft.get() : '');
      if (detail.inputType !== 'hydrate' && this.query.view.get().dirty && this.shadowRoot?.activeElement === this.input) this.optionsModel.show();
    }
    this.syncForm();
  }
  private readonly captureQuery = (event: InputEvent): void => {
    // Rendering can flush between native listeners; preserve the native draft before
    // validation schedules an update and before EditingController emits en-input.
    if (event.isComposing && !this.query.isComposing.get()) this.query.startComposition();
    this.query.setDraft((event.currentTarget as HTMLInputElement).value);
    this.syncForm();
  };
  private showOptions(): void {
    if (this.isDisabled || this.readOnly || this.query.isComposing.get()) return;
    if (!this.optionsModel.open.get()) this.popupSuspended = false;
    this.optionsModel.setQuery(this.query.draft.get() !== this.acceptedLabel ? this.query.draft.get() : '');
    this.optionsModel.show();
    // Retrying a suspended surface may leave the model unchanged. Still request
    // a fresh layout pass so the trigger does not depend on another resize event.
    this.requestUpdate();
  }
  private restoreLabel(): void {
    this.spaceFeedback?.reset();
    this.popupPresented = false; this.popupSuspended = false;
    this.optionsModel?.close();
    this.query?.setValue(this.acceptedLabel);
    this.queryValue = this.value;
    this.optionsModel?.setQuery('');
    this.editing?.sync();
    this.syncForm();
    this.requestUpdate();
  }
  private chooseOption(proposed: string): void {
    if (this.isDisabled || this.readOnly || this.suggestionsBlocked || this.query.isComposing.get() || (!this.fallback && !this.popupPresented)) return;
    const option = this.optionsModel.filtered.get().find(item => item.value === proposed && !item.disabled);
    if (!option) return;
    this.optionsModel.activate(proposed);
    const previousKnownLabel = this.knownLabel;
    const previousKnownValue = this.knownValue;
    ++this.selectionDepth;
    try {
      const outcome = dispatchChange(this, {
        previous: this.value, proposed, reason: 'select',
        getRevision: () => this.revision,
        stage: next => this.stageValue(next),
        rollback: previous => {
          this.knownLabel = previousKnownLabel;
          this.knownValue = previousKnownValue;
          this.stageValue(previous);
          this.rememberLabel();
        },
        canCommit: next => !this.isDisabled && !this.readOnly && !this.suggestionsBlocked &&
          !this.query.isComposing.get() && this.items.some(item => item.value === next && !item.disabled),
        commit: () => {
          this.rememberLabel();
          this.restoreLabel();
        },
      });
      // A top-level same-ID choice exits the filter. A nested no-op must leave
      // the outer transaction's draft available if that transaction is canceled.
      if (outcome === 'unchanged' && this.selectionDepth === 1) this.restoreLabel();
    } finally {
      --this.selectionDepth;
      this.syncForm();
    }
  }

  protected override validateAcceptedValue(): FormValidation {
    const control = this.input;
    if (!control) return { flags: {} };
    const item = this.items.find(item => item.value === this.value);
    const missing = this.required && this.value === '';
    const unknown = (this.value !== '' && !item) || Boolean(item?.disabled);
    const unresolved = this.selectionDepth === 0 && this.query.draft.get() !== this.acceptedLabel;
    const message = this.error || ((missing || unknown || unresolved) ? this.validationText || 'Choose an option from the list.' : '');
    const flags: ValidityStateFlags = { valueMissing: missing, customError: Boolean(this.error || unknown || unresolved) };
    control.setCustomValidity(message);
    return { flags, message, anchor: control };
  }

  override formResetCallback(): void { super.formResetCallback(); this.restoreLabel(); }
  override formStateRestoreCallback(state: string | File | FormData | null, mode: 'restore' | 'autocomplete'): void {
    super.formStateRestoreCallback(state, mode);
    if (typeof state === 'string') this.restoreLabel();
  }
  override formDisabledCallback(disabled: boolean): void { super.formDisabledCallback(disabled); if (this.isDisabled) this.restoreLabel(); }
  override disconnectedCallback(): void { this.restoreLabel(); super.disconnectedCallback(); }

  private syncPopup(): void {
    const popup = this.popup;
    if (!popup || !this.isConnected) return;
    if (this.fallback) { setNativeSurfaceOpen(popup, this.optionsModel.open.get()); return; }
    if (typeof popup.showPopover !== 'function') { this.fallback = true; this.requestUpdate(); return; }
    try {
      if (this.optionsModel.open.get()) {
        setNativeSurfaceOpen(popup, true);
        if (!popup.matches(':popover-open')) popup.showPopover();
      } else {
        if (popup.matches(':popover-open')) popup.hidePopover();
        setNativeSurfaceOpen(popup, false);
      }
    } catch { this.fallback = true; this.requestUpdate(); }
  }
  protected override updated(changes: PropertyValues): void {
    super.updated(changes);
    this.syncPopup(); this.interaction.sync(); this.positioning.sync();
    const active = this.optionsModel.open.get() && !this.suggestionsBlocked ? this.optionsModel.activeOption.get() : undefined;
    if (active?.id !== this.activeId) {
      this.activeId = active?.id;
      this.revealActiveOption();
    }
  }
  private revealActiveOption(): void {
    const active = this.optionsModel.open.get() && !this.suggestionsBlocked ? this.optionsModel.activeOption.get() : undefined;
    const option = active ? this.renderRoot.querySelector<HTMLElement>(`#${active.id}`) : null;
    const popup = this.popup;
    if (option && popup && (this.fallback || this.popupPresented)) {
      const row = option.getBoundingClientRect(); const box = popup.getBoundingClientRect();
      const top = box.top + popup.clientTop; const bottom = top + popup.clientHeight;
      if (row.top < top) popup.scrollTop -= top - row.top;
      else if (row.bottom > bottom) popup.scrollTop += row.bottom - bottom;
    }
  }
  protected override renderControl(): TemplateResult {
    const view = this.optionsModel.view.get();
    return comboboxTemplate({
      label: this.label, description: this.description, error: this.visibleError,
      defaultValue: this.defaultControlValue, placeholder: this.placeholder, autocomplete: this.autocomplete,
      disabled: this.isDisabled, readOnly: this.readOnly, required: this.required,
      describedBy: this.describedBy, invalid: this.controlAriaInvalid, open: view.open, expanded: view.open && (this.fallback || this.popupPresented), fallback: this.fallback,
      loading: this.loading, blocked: this.suggestionsBlocked, selectedValue: this.value, active: view.active,
      options: this.suggestionsBlocked ? [] : view.options, toggleLabel: this.toggleLabel,
      spaceStatus: this.spaceFeedback.visible ? this.noRoomText : '',
      status: this.loading ? this.loadingText : this.loadError || (!view.options.length ? this.emptyText : ''),
    }, { keydown: this.interaction.keydown, keepInputFocus: this.interaction.keepInputFocus,
      trigger: this.interaction.trigger, optionClick: this.interaction.optionClick, focusout: this.interaction.focusout, input: this.captureQuery });
  }
  protected override render(): TemplateResult { return this.renderControl(); }
}

declare global { interface HTMLElementTagNameMap { 'en-combobox': EnCombobox; } }
