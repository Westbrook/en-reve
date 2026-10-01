import { EnElement } from '../internal/en-element.js';
import { foundationStyles, blockHostStyles } from '@en-reve/styles/foundations.js';
import { feedbackStyles } from '@en-reve/styles/feedback.js';
import { skeletonTemplate } from './template.js';

/**
 * A decorative loading placeholder. The surrounding region owns loading status.
 * @tagname en-skeleton
 * @cssprop --en-skeleton-color - Placeholder color.
 * @cssprop --en-skeleton-size - Placeholder block size.
 * @csspart base - The placeholder surface.
 */
export class EnSkeleton extends EnElement {
  static override properties = { shape: { reflect: true } };
  static override styles = [foundationStyles, blockHostStyles, feedbackStyles];

  declare shape: 'text' | 'circle' | 'rectangle';

  constructor() {
    super();
    this.shape = 'text';
  }

  protected override render() {
    return skeletonTemplate(this.shape);
  }
}

declare global { interface HTMLElementTagNameMap { 'en-skeleton': EnSkeleton; } }
