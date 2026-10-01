import { EnElement } from '../internal/en-element.js';
import { foundationStyles, inlineHostStyles } from '@en-reve/styles/foundations.js';
import { activityStyles } from '@en-reve/styles/feedback.js';
import { spinnerTemplate } from './template.js';

/**
 * Indeterminate activity with a reduced-motion treatment from shared styles.
 * Omit label when nearby text already describes the pending task.
 * @tagname en-spinner
 * @csspart base - The decorative activity indicator.
 */
export class EnSpinner extends EnElement {
  static override properties = { label: { type: String } };
  static override styles = [foundationStyles, inlineHostStyles, activityStyles];

  /** Optional localized status name. Does not reannounce on animation frames. */
  declare label: string;

  constructor() {
    super();
    this.label = '';
  }

  protected override render() {
    return spinnerTemplate(this.label);
  }
}

declare global { interface HTMLElementTagNameMap { 'en-spinner': EnSpinner; } }
