import { EnElement } from '../internal/en-element.js';
import { foundationStyles, blockHostStyles } from '@en-reve/styles/foundations.js';
import { layoutStyles } from '@en-reve/styles/surfaces.js';
import { stackTemplate } from './template.js';

/**
 * A logical-direction layout primitive that preserves DOM reading order.
 * @tagname en-stack
 * @cssprop --en-stack-gap - Space between items.
 * @slot - Items to arrange.
 * @csspart base - The layout container.
 */
export class EnStack extends EnElement {
  static override properties = {
    direction: { reflect: true },
    gap: { reflect: true },
    align: { reflect: true },
    justify: { reflect: true },
    wrap: { type: Boolean, reflect: true },
  };
  static override styles = [foundationStyles, blockHostStyles, layoutStyles];

  declare direction: 'vertical' | 'horizontal';
  declare gap: 'small' | 'medium' | 'large';
  declare align: 'start' | 'center' | 'end' | 'stretch';
  declare justify: 'start' | 'center' | 'end' | 'between';
  declare wrap: boolean;

  constructor() {
    super();
    this.direction = 'vertical';
    this.gap = 'medium';
    this.align = 'stretch';
    this.justify = 'start';
    this.wrap = false;
  }

  protected override render() {
    return stackTemplate(this);
  }
}

declare global { interface HTMLElementTagNameMap { 'en-stack': EnStack; } }
