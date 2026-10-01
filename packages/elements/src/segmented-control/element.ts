import { applicationValidation, ValidationFeedback } from '../forms-private/validation-feedback.js';
import { DefaultState } from '../forms-private/default-state.js';
import type { PropertyValues } from 'lit';
import { SelectionChildrenController, SELECTION_CHILDREN_ATTRIBUTE } from '@en-reve/primitives/interactions/selection-children.js';
import { EnElement } from '../internal/en-element.js';
import { createValueModel } from '@en-reve/primitives/state/value.js';
import { SignalController } from '@en-reve/primitives/interactions/signal-controller.js';
import { dispatchChange } from '@en-reve/primitives/interactions/events.js';
import { FormController } from '@en-reve/primitives/interactions/form-controller.js';
import { foundationStyles, blockHostStyles } from '@en-reve/styles/foundations.js';
import { formStyles } from '@en-reve/styles/controls.js';
import { selectionStyles } from '@en-reve/styles/selection.js';
import { radioNavigationIndex } from '../radio-group/navigation.js';
import { segmentedTemplate } from './template.js';
import { nearestRectangleIndex } from './pointer.js';
import type { SegmentedItem, SegmentedOptionView } from './template.js';

/**
 * A compact selection among two or more named alternatives. One native radio group provides a single Tab entry.
 * Arrow/Home/End navigation proposes selection; entering focus alone never changes the value.
 * @cssprop --en-segmented-pressed-scale - segmented held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-segmented-pressed-offset - segmented held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-segmented-press-duration - segmented held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-segmented-release-duration - segmented held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-segmented-pressed-shadow - segmented held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-segmented-pressed-background - segmented held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-segmented-pressed-color - segmented held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-segmented-pressed-border-color - segmented held-state refinement; geometry is bounded and reduced motion wins.
 * @tagname en-segmented-control
 * @slot - Direct en-segmented-item children; their noninteractive labels retain authored nodes.
 * @slot label - The visible group label, falling back to the label attribute.
 * @slot description - Supporting text; falls back to the description attribute/property.
 * @csspart field - The semantic fieldset.
 * @csspart label - The group legend.
 * @csspart options - The connected choice layout.
 * @csspart option - One choice's target and selected/focus indicator.
 * @csspart option-start - First visible choice; logical leading corners.
 * @csspart option-end - Last visible choice; logical trailing corners.
 * @csspart option-joined - A choice after the first visible choice; shared seam.
 * @csspart option-selected - Currently selected choice.
 * @csspart option-enabled - Choice available for interaction.
 * @csspart option-disabled - Disabled choice, including group disability.
 * @csspart option-label - The visible choice text.
 * @csspart control - The visually hidden native radio.
 * @csspart description - Supporting text.
 * @csspart error - Invalid child-authoring feedback, when present.
 * @cssprop --en-segmented-control-frame-inset - Padding inside the frame border; larger shared-scope values may grow comparable controls to preserve option targets.
 * @cssprop --en-control-radius - Shared outer control radius; inner choice corners derive from its inset.
 * @cssprop --en-color-selected - Hovered choice surface.
 * @cssprop --en-color-surface - Selected choice surface.
 * @cssprop --en-color-boundary - Selected choice boundary.
 * @cssprop --en-color-action-text - Selected choice text.
 * @cssprop --en-font-label-strong-weight - Selected choice emphasis.
 * @cssprop --en-color-focus - Focus indicator color.
 * @fires {import('@en-reve/primitives/interactions/events.js').ChangeEvent<string>} en-change - Tentative, cancelable change; the property and form data expose the proposed state during dispatch.
 */
export class EnSegmentedControl extends EnElement {
  static override properties = {
    error: { noAccessor: true },
    value: { noAccessor: true, attribute: false },
    defaultValue: { attribute: 'value', noAccessor: true }, items: { attribute: false },
    disabled: { type: Boolean, reflect: true }, required: { type: Boolean, reflect: true }, name: { reflect: true }, label: {}, description: {},
    validationText: { attribute: 'validation-text' },
  };
  static override styles = [foundationStyles, blockHostStyles, formStyles, selectionStyles];
  static formAssociated = true;
  protected readonly valueDefaults = new DefaultState<string>(this, 'value',
    attribute => attribute ?? '', value => String(value), value => { this.value = value; });

  private readonly feedback = new ValidationFeedback(this, () => { this.formController?.sync(); }, () => this.validationMessage);
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
  private readonly childOptions = new SelectionChildrenController(this, 'segmented');
  private hydrationChoice = this.captureHydrationChoice();
  private hydrationRevision = 0;
  private removedFocus?: { control: HTMLInputElement; index: number; root: Node };
  private readonly signals = new SignalController(this, () => this.model.view.get());
  private readonly internals = typeof this.attachInternals === 'function' ? this.attachInternals() : undefined;
  private revision = 0;
  private fieldsetDisabled = false;
  private focusedValue?: string;
  private readonly formController = this.internals ? new FormController(this, {
    internals: this.internals,
    value: () => this.selectedItem && !this.selectedItem.disabled && !this.selectedItem.hidden ? this.value : null,
    state: () => this.value, disabled: () => this.effectiveDisabled,
    onReset: () => { this.feedback.reset(); this.valueDefaults.reset(); this.focusedValue = undefined; this.syncControls(); },
    onRestore: (state) => { if (typeof state === 'string') this.value = state; this.syncControls(); },
    validate: () => applicationValidation({ flags: this.childOptions.current().error ? { customError: true } : this.required && (!this.selectedItem || this.selectedItem.disabled || this.selectedItem.hidden) ? { valueMissing: true } : {},
      message: this.childOptions.current().error || this.validationText || 'Please select an option.', anchor: this.controls.find((control) => !control.disabled) }, this.error),
  }) : undefined;

  /** Supply two or more choices with unique nonempty values and visible labels. Replace the array to update it. */
  declare items: readonly SegmentedItem[];
  /** Disable every choice and omit the field from form data. */
  declare disabled: boolean;
  /** Require a value matching an enabled supplied choice. */
  declare required: boolean;
  /** The outer form entry name. */
  declare name: string;
  /** The visible legend fallback when the label slot is unused. */
  declare label: string;
  /** Supporting text associated with the group. */
  declare description: string;
  /** Localizable message used when a required group has no matching value. */
  declare validationText: string;

  constructor() {
    super();
    this.items = []; this.disabled = false; this.required = false;
    this.name = ''; this.label = ''; this.description = ''; this.validationText = 'Please select an option.';
  }

  override connectedCallback(): void {
    this.hydrationRevision = this.revision;
    super.connectedCallback();
  }
  private captureHydrationChoice(): { value: string; baseline: string } | undefined {
    if (!this.hasAttribute(SELECTION_CHILDREN_ATTRIBUTE) || !this.shadowRoot) return undefined;
    const controls = [...this.shadowRoot.querySelectorAll<HTMLInputElement>('input[type="radio"]')];
    return { value: controls.find(control => control.checked)?.value ?? '', baseline: controls.find(control => control.defaultChecked)?.value ?? '' };
  }
  private get effectiveItems(): readonly SegmentedOptionView[] {
    return this.childOptions.view.active ? this.childOptions.view.items.map(item => ({ ...item, projected: true })) : this.items;
  }
  private currentItems(): readonly SegmentedOptionView[] {
    const children = this.childOptions.current();
    return children.active ? children.items : this.items;
  }

  /** Current selection. Property writes are silent; the value attribute defines the reset default. */
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
    this.syncControls();
    this.formController?.sync();
  }
  private get selectedItem(): SegmentedOptionView | undefined { return this.currentItems()?.find((item) => item.value === this.value); }
  private get effectiveDisabled(): boolean { return this.disabled || this.fieldsetDisabled; }
  private get controls(): HTMLInputElement[] { return [...(this.renderRoot?.querySelectorAll<HTMLInputElement>('input[type="radio"]') ?? [])]; }
  private get tabValue(): string | undefined {
    const enabled = this.effectiveItems?.filter((item) => !item.disabled && !item.hidden) ?? [];
    return enabled.find((item) => item.value === this.focusedValue)?.value
      ?? enabled.find((item) => item.value === this.value)?.value ?? enabled[0]?.value;
  }

  get form(): HTMLFormElement | null { return this.internals?.form ?? null; }
  get labels(): NodeList | undefined { return this.internals?.labels; }
  get willValidate(): boolean { return this.internals?.willValidate ?? false; }
  get validity(): ValidityState | undefined { return this.internals?.validity; }
  get validationMessage(): string { return this.internals?.validationMessage ?? ''; }
  checkValidity(): boolean { this.formController?.sync(); return this.internals?.checkValidity?.() ?? true; }
  reportValidity(): boolean { this.formController?.sync(); return this.internals?.reportValidity?.() ?? true; }
  override focus(options?: FocusOptions): void { this.controls.find((control) => control.value === this.tabValue && !control.disabled)?.focus(options); }
  formDisabledCallback(disabled: boolean): void { this.fieldsetDisabled = disabled; this.formController?.formDisabled(disabled); this.requestUpdate(); }
  formResetCallback(): void { this.formController?.formReset(); }
  formStateRestoreCallback(state: string | File | FormData, mode: 'restore' | 'autocomplete' = 'restore'): void {
    this.formController?.formStateRestore(state, mode);
  }

  private syncControls(): void {
    if (this.hydrationChoice && !this.hasUpdated) return;
    const tabValue = this.tabValue;
    for (const control of this.controls) {
      control.checked = control.value === this.value;
      control.tabIndex = !this.effectiveDisabled && !control.disabled && control.value === tabValue ? 0 : -1;
    }
  }
  private propose(proposed: string, reason: 'select' | 'keyboard' | 'hydrate'): void {
    const item = this.currentItems().find((candidate) => candidate.value === proposed);
    if (this.effectiveDisabled || !item || item.disabled || item.hidden) return;
    this.valueDefaults.markDirty();
    if (!this.effectiveDisabled && item && !item.disabled && !item.hidden) dispatchChange(this, {
      previous: this.value, proposed, reason, getRevision: () => this.revision,
      stage: (next) => this.setValue(next),
      rollback: (previous) => this.setValue(previous),
      canCommit: (next) => !this.effectiveDisabled && this.currentItems().some(candidate => candidate.value === next && !candidate.disabled && !candidate.hidden),
    });
    this.syncControls();
    this.requestUpdate();
  }
  private handleClick = (event: MouseEvent): void => {
    // Leave native label/input activation and non-coordinate activation alone.
    if (event.defaultPrevented || event.button !== 0 || event.detail <= 0
      || event.target !== event.currentTarget || this.effectiveDisabled) return;
    const candidates = this.controls.flatMap((control) => {
      const label = control.closest('label');
      if (!label) return [];
      const rect = label.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 ? [{ control, rect }] : [];
    });
    const index = nearestRectangleIndex(event.clientX, event.clientY, candidates.map(({ rect }) => rect));
    const control = index === undefined ? undefined : candidates[index]?.control;
    // A nearby unavailable option must not redirect the click to another value.
    if (!control || control.disabled) return;
    control.focus();
    control.click();
  };
  private handleChange = (event: Event): void => {
    const control = event.target as HTMLInputElement;
    this.focusedValue = control.value;
    this.propose(control.value, 'select');
  };
  private handleFocusIn = (event: FocusEvent): void => {
    const control = event.target as HTMLInputElement;
    if (control.type === 'radio') { this.focusedValue = control.value; this.syncControls(); }
  };
  private handleFocusOut = (event: FocusEvent): void => {
    const next = event.relatedTarget as Node | null;
    if (next && this.renderRoot.contains(next)) return;
    this.focusedValue = undefined;
    this.syncControls();
  };
  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey || this.effectiveDisabled) return;
    const controls = this.controls.filter((control) => !control.disabled);
    const current = controls.indexOf(event.target as HTMLInputElement);
    const rtl = this.ownerDocument.defaultView?.getComputedStyle(this).direction === 'rtl';
    const nextIndex = radioNavigationIndex(event.key, current, controls.length, rtl);
    if (nextIndex === undefined) return;
    event.preventDefault();
    const next = controls[nextIndex];
    if (!next) return;
    this.focusedValue = next.value;
    this.propose(next.value, 'keyboard');
    next.focus();
  };
  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    const choice = this.hydrationChoice;
    if (choice) {
      this.hydrationChoice = undefined;
      if (this.revision === this.hydrationRevision && this.value === this.childOptions.initialValue && choice.value !== choice.baseline) this.propose(choice.value, 'hydrate');
    }
    const active = this.shadowRoot?.activeElement as HTMLInputElement | null | undefined;
    if (active && this.controls.includes(active)) this.removedFocus = { control: active, index: this.controls.indexOf(active), root: this.getRootNode() };
  }
  protected override updated(_changes: PropertyValues): void {
    this.syncControls(); this.formController?.sync();
    const previous = this.removedFocus;
    this.removedFocus = undefined;
    if (previous && (!previous.control.isConnected || previous.control.disabled) && this.canRecoverFocus(previous)) {
      const enabled = this.controls.filter(control => !control.disabled && control.closest('label')?.getClientRects().length);
      enabled[Math.min(previous.index, enabled.length - 1)]?.focus();
    }
  }
  private canRecoverFocus(previous: { control: HTMLInputElement; root: Node }): boolean {
    const document = this.ownerDocument;
    if (!this.isConnected || this.effectiveDisabled || this.getRootNode() !== previous.root || !document.hasFocus()) return false;
    const innerActive = this.shadowRoot?.activeElement;
    // Engines can retain the old native target after hide/disable. A different
    // focused descendant means the application has already chosen a destination.
    if (innerActive && innerActive !== previous.control) return false;
    let child: Element = this;
    let root = this.getRootNode() as Document | ShadowRoot;
    while (true) {
      const active = root.activeElement;
      const defaultFocus = active === null || (root === document && (active === document.body || active === document.documentElement));
      if (active !== child && !defaultFocus) return false;
      if (root === document) return true;
      // Null focus in our shadow tree is not enough: an outside sibling or an
      // iframe may now own focus, so verify only the chain of containing roots.
      child = (root as ShadowRoot).host;
      root = child.getRootNode() as Document | ShadowRoot;
    }
  }
  protected override render() {
    return segmentedTemplate({ items: this.effectiveItems, value: this.value, tabValue: this.tabValue,
      label: this.label, description: this.description, disabled: this.effectiveDisabled, required: this.required, error: this.visibleError || this.childOptions.view.error },
    this.handleChange, this.handleKeyDown, this.handleFocusIn, this.handleFocusOut, this.handleClick);
  }
}

declare global { interface HTMLElementTagNameMap { 'en-segmented-control': EnSegmentedControl; } }
