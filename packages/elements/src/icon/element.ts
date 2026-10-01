import { EnElement } from '../internal/en-element.js';
import { foundationStyles, iconHostStyles } from '@en-reve/styles/foundations.js';
import { mediaStyles } from '@en-reve/styles/feedback.js';
import { iconTemplate } from './template.js';
import type { IconName } from './template.js';

/**
 * A small built-in icon set. Decorative by default; provide label for meaningful images.
 * @tagname en-icon
 * @cssprop --en-icon-size - Icon dimensions.
 * @cssprop --en-size-icon-stroke - Icon stroke weight in SVG user units.
 * @csspart base - The SVG icon.
 */
export class EnIcon extends EnElement {
  static override properties = {
    name: { type: String },
    label: { type: String },
  };
  static override styles = [foundationStyles, iconHostStyles, mediaStyles];

  /** Identifier of a built-in, trusted SVG template. */
  declare name: IconName;
  /** Localized accessible text. Empty means decorative. */
  declare label: string;

  constructor() {
    super();
    this.name = 'info';
    this.label = '';
  }

  protected override render() {
    return iconTemplate(this.name, this.label);
  }
}

declare global { interface HTMLElementTagNameMap { 'en-icon': EnIcon; } }
