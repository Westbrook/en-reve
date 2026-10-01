import { tabPanelTemplate } from './template.js';
import { css } from 'lit';
import { EnElement } from '../internal/en-element.js';
import { foundationStyles, blockHostStyles } from '@en-reve/styles/foundations.js';
import { selectionStyles } from '@en-reve/styles/selection.js';

/**
 * A persistent tab panel owned by en-tabs. Inactive content stays mounted and is hidden.
 * @tagname en-tab-panel
 * @slot - Panel content.
 * @csspart base - Content wrapper.
 */
export class EnTabPanel extends EnElement {
  static override properties = { value: { type: String, reflect: true } };
  static override styles = [foundationStyles, blockHostStyles, selectionStyles, css`
    :host { display: block; }
    :host([hidden]) { display: none !important; }
  `];
  declare value: string;

  constructor() {
    super();
    this.value = '';
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('role', 'tabpanel');
    if (!this.hasAttribute('tabindex')) this.tabIndex = 0;
  }

  protected override render() {
    return tabPanelTemplate();
  }
}

declare global { interface HTMLElementTagNameMap { 'en-tab-panel': EnTabPanel; } }
