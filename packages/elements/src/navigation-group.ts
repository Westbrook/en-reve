import type { ChangeOutcome } from '@en-reve/primitives/interactions/events.js';
import { NavigationDisclosure, type DisclosureEventMap } from './navigation/disclosure.js';
export type { DisclosureEventMap, DisclosureChangeEvent, DisclosureToggleEvent, DisclosureReason } from './navigation/disclosure.js';
import { html, type PropertyValues } from 'lit';
import { EnElement } from './internal/en-element.js';
import { foundationStyles, blockHostStyles } from '@en-reve/styles/foundations.js';
import { navigationHostStyles, navigationDisclosureStyles } from '@en-reve/styles/navigation.js';

/**
 * An independently expandable group of authored navigation links.
 * @tagname en-navigation-group
 * @slot - Native anchors and nested en-navigation-group elements.
 * @csspart base - Native details disclosure.
 * @csspart control - Native summary; expansion never navigates.
 * @csspart content - Indented child links and groups.
 * @cssprop --en-navigation-indent - Nested group indentation.
 * @fires {import('./navigation/disclosure.js').DisclosureChangeEvent} en-change - Cancelable tentative user or API disclosure proposal.
 * @fires {import('./navigation/disclosure.js').DisclosureToggleEvent} en-toggle - Noncancelable terminal state notification: Accepted user or API disclosure change, with detail.open. Property writes are silent.
 */
export class EnNavigationGroup extends EnElement<DisclosureEventMap> {
  static override properties = {
    label: { type: String , useDefault: true},
    open: { type: Boolean, reflect: true, noAccessor: true },
  };
  static override styles = [foundationStyles, blockHostStyles, navigationHostStyles, navigationDisclosureStyles];
  /** Localized group name. Author a separate anchor for a group destination. */
  declare label: string;
  /** Expanded state. Server authors should open ancestors of the current link. */
  get open(): boolean { return this.disclosure.value; }
  set open(value: boolean) { this.disclosure.write(value); }
  /** Propose expansion with en-change and return its outcome. Property writes remain silent; completion is semantic, not visual. */
  requestOpen(open: boolean): ChangeOutcome { return this.disclosure.propose(Boolean(open), 'api'); }
  private readonly disclosure = new NavigationDisclosure(this);
  constructor() { super(); this.label = 'Sections'; this.open = false; }
  override connectedCallback() {
    // Capture native disclosure interactions made while the SSR output was waiting
    // for its definition, before the first reactive update can overwrite them.
    if (!this.hasUpdated) {
      const initial = this.shadowRoot?.querySelector('details');
      if (initial) this.open = initial.open;
    }
    super.connectedCallback();
  }
  protected override willUpdate(changed: PropertyValues) {
    if (changed.has('open') && !this.open && this.ownerDocument?.activeElement && this.contains(this.ownerDocument.activeElement)) {
      this.renderRoot.querySelector<HTMLElement>('summary')?.focus();
    }
  }
  private activateSummary = (event: MouseEvent) => {
    if (event.defaultPrevented) return;
    event.preventDefault();
    this.disclosure.propose(!this.open, 'toggle');
    const details = this.renderRoot.querySelector('details');
    if (details) details.open = this.open;
  };
  private toggled = (event: Event) => {
    const next = (event.currentTarget as HTMLDetailsElement).open;
    if (next === this.open) return;
    this.open = next;
    this.disclosure.notify();
  };
  protected override render() {
    return html`<details part="base" ?open=${this.open} @toggle=${this.toggled}>
      <summary @click=${this.activateSummary} part="control">${this.label}</summary>
      <div class="group-content" part="content"><slot></slot></div>
    </details>`;
  }
}
declare global { interface HTMLElementTagNameMap { 'en-navigation-group': EnNavigationGroup; } }
