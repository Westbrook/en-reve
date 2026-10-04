import { ChoiceBase } from './choice-base.js';

/**
 * A form-associated checkbox. Application writes are silent; canceling en-change restores the native control without moving focus.
 * @cssprop --en-checkbox-pressed-scale - checkbox held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-checkbox-pressed-offset - checkbox held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-checkbox-press-duration - checkbox held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-checkbox-release-duration - checkbox held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-checkbox-pressed-shadow - checkbox held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-checkbox-pressed-border-color - checkbox held-state refinement; geometry is bounded and reduced motion wins.
 * @tagname en-checkbox
 * @slot - The visible label. Use plain text or phrasing content.
 * @slot label - Preferred visible label; falls back to the default slot and then the label attribute.
 * @slot description - Supporting text; falls back to the description attribute/property.
 * @csspart field - The outer field.
 * @csspart control - The native checkbox.
 * @csspart control-invalid - Native control while associated application or reported constraint feedback is visible.
 * @csspart label - The associated label.
 * @csspart label-text - Label content referenced by the native control; plain labels may be visually omitted with display:none.
 * @cssprop --en-choice-label-color - Optional visible label text color and fallback for label state hooks; descriptions and errors keep their own paint.
 * @cssprop --en-choice-label-hover-color - Optional enabled label hover color.
 * @cssprop --en-choice-label-focus-color - Optional label color while the native input is focus-visible; ordinary focus does not activate it.
 * @cssprop --en-choice-label-pressed-color - Optional enabled control or associated label held color.
 * @cssprop --en-choice-label-disabled-color - Optional disabled label color; native fieldset and group disabling take precedence over enabled states.
 * @csspart description - Supporting text.
 * @csspart error - Associated application or constraint validation feedback.
 * @cssprop --en-choice-size - Optional family presentation; see the customization registry.
 * @cssprop --en-color-action - Selected control color.
 * @cssprop --en-size-target-touch - Minimum pointer target.
 * @fires {import('@en-reve/primitives/interactions/events.js').ChangeEvent<boolean>} en-change - Tentative, cancelable change; the property and form data expose the proposed state during dispatch.
 */
export class EnCheckbox extends ChoiceBase {
  static override properties = { ...ChoiceBase.properties, indeterminate: { type: Boolean, noAccessor: true } };
  private mixedState = false;
  /** A visual/accessible mixed state. An accepted user change clears it. */
  get indeterminate(): boolean { return this.mixedState; }
  set indeterminate(value: boolean) {
    ++this.authorRevision;
    this.setIndeterminate(Boolean(value));
  }
  private setIndeterminate(value: boolean): void {
    const previous = this.mixedState;
    this.mixedState = value;
    this.requestUpdate('indeterminate', previous);
    this.syncControl();
  }
  protected override get kind(): 'checkbox' { return 'checkbox'; }
  protected override get mixed(): boolean { return this.indeterminate; }
  protected override didCommit(): void { this.setIndeterminate(false); }
  override formResetCallback(): void { this.indeterminate = false; super.formResetCallback(); }
}

declare global { interface HTMLElementTagNameMap { 'en-checkbox': EnCheckbox; } }
