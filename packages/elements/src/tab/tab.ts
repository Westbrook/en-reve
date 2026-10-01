import { tabTemplate } from './template.js';
import { css } from 'lit';
import { EnElement } from '../internal/en-element.js';
import type { PropertyValues } from 'lit';
import { foundationStyles } from '@en-reve/styles/foundations.js';
import { selectionStyles } from '@en-reve/styles/selection.js';

/**
 * A tab label owned by en-tabs. Its public host carries semantics so panel ID references
 * stay in the consumer's tree; private markup does not participate in those references.
 * @cssprop --en-tab-pressed-scale - tab held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-tab-pressed-offset - tab held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-tab-press-duration - tab held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-tab-release-duration - tab held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-tab-pressed-shadow - tab held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-tab-pressed-color - tab held-state refinement; geometry is bounded and reduced motion wins.
 * @tagname en-tab
 * @slot - The tab's label. Do not include nested interactive controls.
 * @cssprop --en-tab-hover-background - Optional tab state presentation.
 * @cssprop --en-tab-hover-color - Optional tab state presentation.
 * @cssprop --en-tab-selected-background - Optional tab state presentation.
 * @cssprop --en-tab-selected-color - Optional tab state presentation.
 * @cssprop --en-tab-pressed-background - Optional tab state presentation.
 * @cssprop --en-tab-indicator-color - Optional tab state presentation.
 * @csspart base - Label surface.
 */
export class EnTab extends EnElement {
  static override properties = {
    value: { type: String, reflect: true },
    disabled: { type: Boolean, reflect: true },
  };
  static override styles = [foundationStyles, selectionStyles, css`
    :host { display: inline-flex; cursor: pointer; }
    :host([disabled]) { cursor: default; }
  `];
  declare value: string;
  declare disabled: boolean;

  constructor() {
    super();
    this.value = '';
    this.disabled = false;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('role', 'tab');
    if (!this.hasAttribute('tabindex')) this.tabIndex = -1;
  }

  protected override updated(changed: PropertyValues): void {
    if (changed.has('disabled')) {
      this.setAttribute('aria-disabled', String(this.disabled));
      if (this.disabled) this.tabIndex = -1;
    }
  }

  protected override render() {
    return tabTemplate();
  }
}

declare global { interface HTMLElementTagNameMap { 'en-tab': EnTab; } }
