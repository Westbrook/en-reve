import { FloatingSurface } from './floating-surface.js';
import { popoverTemplate } from './template.js';
import { controlStyles } from '@en-reve/styles/controls.js';
import { typographyStyles } from '@en-reve/styles/foundations.js';

/**
 * A nonmodal dialog anchored by `for` to an external native button or en-button in the same tree.
 * Uses the manual Popover API so dismissal requests precede accepted state changes.
 * The native control remains the semantic trigger. en-button forwards the public
 * trigger ARIA attributes to its private native control.
 * `label` names the nonmodal dialog. Use dialog/drawer for modal tasks.
 *
 * @cssprop --en-duration-enter - Optional native surface entry paint duration (0–500ms).
 * @cssprop --en-duration-exit - Optional native surface exit paint duration (0–500ms); never delays state or focus.
 * @cssprop --en-ease-enter - Native surface entry easing.
 * @cssprop --en-ease-exit - Native surface exit easing.
 * @tag en-popover
 * @tagname en-popover
 * @cssprop --en-overlay-focus-width - Immediate primary focus contour width.
 * @cssprop --en-overlay-focus-color - Immediate primary focus contour color.
 * @cssprop --en-overlay-focus-offset - Signed primary focus contour offset.
 * @cssprop --en-overlay-focus-halo-width - Supplemental outer focus halo width.
 * @cssprop --en-overlay-focus-halo-color - Supplemental focus halo color; alpha is supported.
 * @cssprop --en-duration-focus-enter - Supplemental halo and field-accent entry duration.
 * @cssprop --en-duration-focus-exit - Supplemental halo and field-accent exit duration.
 * @cssprop --en-ease-focus-enter - Supplemental focus entry timing function.
 * @cssprop --en-ease-focus-exit - Supplemental focus exit timing function.
 * @slot - Nonmodal dialog content; flow content and controls.
 * @slot label - Noninteractive title phrasing; falls back to the label attribute.
 * @csspart arrow - Decorative pointer; size with --en-overlay-arrow-size.
 * @csspart arrow-shape - SVG path styling; use arrow-path for portable shape customization.
 * @csspart content - Scrollable content inside the arrow surface.
 * @cssprop --en-overlay-arrow-size - Pointer projection length; base is twice this size.
 * @csspart surface - Nonmodal dialog surface.
 * @csspart body - Content container.
 * @csspart heading - Visible title and accessible name.
 * @csspart close - Native dismiss button.
 * @fires {import('../dialog/types.js').OverlayChangeEvent} en-change - Cancelable tentative open state: {previous, proposed, reason}.
 * @cssprop --en-overlay-max-inline-size - Maximum surface inline size.
 * @cssprop --en-overlay-max-block-size - Maximum surface block size.
 * @cssprop --en-overlay-padding - Surface padding.
 * @cssprop --en-overlay-radius - Corner radius.
 * @cssprop --en-overlay-background - Surface background.
 * @cssprop --en-overlay-color - Surface foreground.
 * @cssprop --en-overlay-border-color - Surface border.
 */
export class EnPopover extends FloatingSurface {
  static override styles = [...FloatingSurface.styles, typographyStyles, controlStyles];
  static override properties = {
    ...FloatingSurface.properties,
    arrow: {type: Boolean, reflect: true},
    arrowPath: {type: String, attribute: 'arrow-path'},
    label: { type: String , useDefault: true},
    closeLabel: { type: String, attribute: 'close-label' , useDefault: true},
  };
  /** Accessible name of the nonmodal dialog surface. */
  declare label: string;
  /** Localized name of the visible dismiss action. */
  declare closeLabel: string;

  /** Show a decorative, collision-aware pointer to the trigger. */
  declare arrow: boolean;
  /** SVG pointer path in a 16 by 8 viewBox; keep its base at y=0. */
  declare arrowPath: string;

  constructor() {
    super();
    this.arrow = false;
    this.arrowPath = 'M0 0 L8 8 L16 0';
    this.label = '';
    this.closeLabel = 'Close';
  }

  protected override render() {
    return popoverTemplate({ arrow: this.arrow, arrowPath: this.arrowPath, label: this.label, closeLabel: this.closeLabel,
      dismiss: () => this.hide('close-button'), nativeToggle: this.nativeToggle });
  }
}

declare global { interface HTMLElementTagNameMap { 'en-popover': EnPopover; } }
