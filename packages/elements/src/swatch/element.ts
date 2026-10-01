import { EnElement } from '../internal/en-element.js';
import { foundationStyles, inlineHostStyles } from '@en-reve/styles/foundations.js';
import { swatchStyles } from '@en-reve/styles/feedback.js';
import { dispatchAction } from '@en-reve/primitives/interactions/events.js';
import { swatchColor } from './model.js';
import { swatchTemplate } from './template.js';

/**
 * A color-sample button with consumer-owned activation behavior.
 * Supply a complete localized action name through label or the named label slot.
 * Token and color inputs affect only the preview; copying and picker behavior
 * belong to the consumer. Invalid or absent paint does not disable activation.
 * Defaults to medium sizing; size="inherit" explicitly opts into a parent scope.
 * @tagname en-swatch
 * @slot label - Visually hidden action name; falls back to the label attribute.
 * @cssprop --en-swatch-size - Default sample dimensions; falls back to the shared sized swatch token.
 * @csspart control - Native sample button with keyboard, focus, and disabled semantics.
 * @csspart sample - Sample frame; the same control surface, with a system-color border in forced colors.
 * @csspart color - Decorative color fill; only this fill preserves true color in forced colors.
 * @csspart label - Visually hidden action name.
 * @fires {CustomEvent<{action: 'activate', data: undefined}>} en-action - Cancelable, bubbling, composed activation request; canceling also prevents the originating click's default action.
 */
export class EnSwatch extends EnElement {
  static override properties = {
    token: { type: String },
    color: { type: String },
    label: { type: String },
    disabled: { type: Boolean, reflect: true },
  };
  static override styles = [foundationStyles, inlineHostStyles, swatchStyles];

  /** Canonical --en-* color-token name. A nonempty token takes precedence over color. */
  declare token: string;
  /** CSS color used when token is empty. CSS declarations, escapes, and !important are unsupported. */
  declare color: string;
  /** Full localized action name when the named label slot is empty. */
  declare label: string;
  /** Prevents native activation; missing or invalid preview colors do not imply disabled. */
  declare disabled: boolean;

  constructor() {
    super();
    this.token = '';
    this.color = '';
    this.label = '';
    this.disabled = false;
  }

  /** Moves focus to the native sample button. */
  override focus(options?: FocusOptions): void {
    this.renderRoot.querySelector<HTMLButtonElement>('button')?.focus(options);
  }

  private readonly onActivate = (event: MouseEvent): void => {
    if (this.disabled) {
      event.preventDefault();
      return;
    }
    if (event.defaultPrevented) return;
    if (!dispatchAction(this, { action: 'activate', data: undefined }, { cancelable: true })) {
      // Consumers listening to the original bubbling click share this cancellation.
      event.preventDefault();
    }
  };

  protected override render() {
    return swatchTemplate({
      color: swatchColor(this.token, this.color),
      label: this.label || '',
      disabled: this.disabled,
      onActivate: this.onActivate,
    });
  }
}

declare global { interface HTMLElementTagNameMap { 'en-swatch': EnSwatch; } }
