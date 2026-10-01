import { html } from 'lit';
import { EditingController } from '@en-reve/primitives/interactions/editing-controller.js';
import { FormFieldElement } from '../forms-private/form-field.js';
import { ColorPickerController } from './picker-controller.js';

function normalizeColor(value: string): string {
  const color = String(value ?? '').trim();
  return /^#[\da-f]{6}$/i.test(color) ? color.toLowerCase() : '#000000';
}

/**
 * A labeled native color picker for six-digit sRGB hexadecimal colors.
 * The browser owns the picker UI. Required/placeholder have no native color meaning; readonly is not exposed.
 * `for` adds an external button or swatch trigger in the same tree; the named native field remains available.
 * Native picker support varies, including iOS. No open state or successful picker display is inferred.
 * @tagname en-color-field
 * @slot label - Visible field label; falls back to label.
 * @slot description - Supporting text; falls back to the description attribute/property.
 * @csspart field - Field layout.
 * @csspart label - Visible label.
 * @csspart control - Native color input.
 * @csspart focus-frame - Noninteractive field frame supporting the supplemental focus accent.
 * @csspart description - Supporting text.
 * @csspart error - Validation feedback.
 * @cssprop --en-control-background - Control background.
 * @cssprop --en-input-background - Field fill falling back to the shared control background.
 * @cssprop --en-input-color - Field text falling back to the shared control color.
 * @cssprop --en-control-radius - Control corner radius.
 * @cssprop --en-field-gap - Gap between label, control and supporting text.
 * @cssprop --en-control-min-size - Minimum control block size.
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
 * @fires {import('../events.js').DraftInputEvent} en-input - Current native color draft.
 * @fires {import('../events.js').FieldChangeEvent} en-change - Cancelable accepted-value change; provisional value and form data are available during dispatch.
 */
export class EnColorField extends FormFieldElement {
  static override properties = {
    ...FormFieldElement.properties,
    for: { type: String, reflect: true },
  };

  /** Literal ID of a native button, en-button or en-swatch in this field's Document or ShadowRoot. */
  declare for: string;

  private readonly picker = new ColorPickerController(this, {
    disabled: () => this.isDisabled,
    activate: () => this.showPicker(),
  });
  private requestingPicker = false;
  private readonly editing = new EditingController(this, {
    model: this.model,
    control: () => this.controlNode as HTMLInputElement | null,
    onCommit: (value, reason) => this.requestValue(normalizeColor(value), reason),
  });

  constructor() { super(); this.for = ''; this.valueDefaults.apply('#000000'); }

  /** Accepted six-digit sRGB color; invalid values become native color's default black. */
  override get value(): string { return super.value; }
  override set value(value: string) { super.value = normalizeColor(value); }

  /**
   * Synchronously request the browser picker from a user activation.
   * If showPicker is absent or throws, focus and activate the visible native field.
   * Returning does not confirm that a picker opened. This does not change accepted color,
   * emit value events, or restore focus after native picker interaction.
   */
  showPicker(): void {
    if (!this.isConnected || this.isDisabled || this.requestingPicker) return;
    const control = this.controlNode as HTMLInputElement | null;
    if (!control?.isConnected) return;
    this.syncForm();
    if (control.disabled) return;
    this.requestingPicker = true;
    try {
      if (typeof control.showPicker === 'function') {
        try {
          control.showPicker();
          return;
        } catch {
          // Native user-activation or platform limits retain an ordinary field fallback.
        }
      }
      control.focus();
      control.click();
    } finally {
      this.requestingPicker = false;
    }
  }

  protected reconcile(): void { this.editing?.sync(); }

  protected renderControl() {
    return html`<input id="control" class="en-input en-color-control" part="control" type="color"
      name=${this.name} value=${this.defaultControlValue} ?disabled=${this.isDisabled}
      aria-describedby=${this.describedBy} aria-invalid=${this.controlAriaInvalid}>`;
  }
}

declare global { interface HTMLElementTagNameMap { 'en-color-field': EnColorField; } }
