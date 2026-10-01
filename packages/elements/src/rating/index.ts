import type { PropertyValues } from 'lit';
import { NumericChoiceBase } from '../slider/numeric-base.js';
import { ratingTemplate } from './template.js';

/**
 * A discrete score with native radio keyboard behavior. Zero represents an explicitly cleared rating.
 * The clear choice shares a row with the stars when space permits. Stars keep their target sizes and reflow when available width is insufficient.
 * @cssprop --en-rating-pressed-scale - rating held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-rating-pressed-offset - rating held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-rating-press-duration - rating held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-rating-release-duration - rating held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-rating-pressed-shadow - rating held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-rating-pressed-background - rating held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-rating-pressed-color - rating held-state refinement; geometry is bounded and reduced motion wins.
 * @tagname en-rating
 * @slot - The visible rating label.
 * @slot label - Preferred visible rating label; falls back to the default slot and then the label attribute.
 * @slot description - Supporting text; falls back to the description attribute/property.
 * @csspart field - The native fieldset.
 * @csspart label - The fieldset legend.
 * @csspart options - All score choices, with the clear choice before the stars.
 * @csspart star-options - The compact, wrapping row of positive score choices.
 * @csspart option - One score target, including the clear choice.
 * @csspart star-option - A square positive-score target; excludes the clear choice.
 * @csspart control - A native score radio.
 * @csspart star - The decorative star indicator.
 * @csspart clear-option - The visible no-rating choice.
 * @csspart description - Supporting text.
 * @csspart error - Associated application or constraint validation feedback.
 * @cssprop --en-rating-star-radius - Positive-score target and focus contour radius; defaults to the control radius.
 * @cssprop --en-color-action - Selected rating color.
 * @fires {import('@en-reve/primitives/interactions/events.js').ChangeEvent<number>} en-change - Tentative, cancelable change; the property and form data expose the proposed state during dispatch.
 */
export class EnRating extends NumericChoiceBase {
  static override properties = { ...NumericChoiceBase.properties, max: { type: Number }, optionLabel: { attribute: false } };
  /** Maximum discrete score, constrained to 1–10. */
  declare max: number;
  /** Localizable accessible label formatter for each score. */
  declare optionLabel: (value: number, max: number) => string;
  constructor() {
    super(); this.max = 5;
    this.optionLabel = (value, max) => value === 0 ? 'No rating' : `${value} of ${max} stars`;
  }
  private get maximum(): number { return Math.max(1, Math.min(10, Math.round(Number.isFinite(this.max) ? this.max : 5))); }
  protected override normalizeValue(value: number): number { return Math.max(0, Math.min(this.maximum, Math.round(Number.isFinite(value) ? value : 0))); }
  protected override willUpdate(changes: PropertyValues): void {
    if (changes.has('max')) { const normalized = this.normalizeValue(this.value); if (normalized !== this.value) this.valueDefaults.apply(normalized); }
  }
  protected override syncControl(): void {
    for (const input of this.renderRoot?.querySelectorAll('input') ?? []) input.checked = Number(input.value) === this.value;
  }
  protected override get validationAnchor(): HTMLInputElement | null {
    return this.renderRoot?.querySelector<HTMLInputElement>('input:checked') ?? null;
  }
  override focus(options?: FocusOptions): void {
    this.renderRoot?.querySelector<HTMLInputElement>(`input[value="${this.value}"]`)?.focus(options);
  }
  protected override render() {
    return ratingTemplate({ value: this.value, max: this.maximum, disabled: this.effectiveDisabled,
      label: this.label, description: this.description, error: this.visibleError, optionLabel: this.optionLabel },
    (event) => this.propose(Number((event.target as HTMLInputElement).value), 'select'));
  }
}

declare global { interface HTMLElementTagNameMap { 'en-rating': EnRating; } }
