import type { ChangeOutcome } from '@en-reve/primitives/interactions/events.js';
import { NavigationDisclosure, type DisclosureEventMap } from './disclosure.js';
export type { DisclosureEventMap, DisclosureChangeEvent, DisclosureToggleEvent, DisclosureReason } from './disclosure.js';
import { EnElement } from '../internal/en-element.js';
import { foundationStyles, blockHostStyles } from '@en-reve/styles/foundations.js';
import { navigationStyles, navigationHostStyles } from '@en-reve/styles/navigation.js';
import { slottedNavigationTemplate } from '@en-reve/primitives/templates/slotted-navigation.js';
import { html, type PropertyValues } from 'lit';
import { navigationDisclosureStyles } from '@en-reve/styles/navigation.js';
import type { EnNavigationGroup } from '../navigation-group.js';

/**
 * Page or section navigation with authored native anchors in an encapsulated landmark.
 * The application owns link content, attributes and current state. No router, selection
 * model or custom activation event is installed; current-link changes reveal ancestor groups.
 * @cssprop --en-navigation-pressed-scale - navigation held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-navigation-pressed-offset - navigation held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-navigation-press-duration - navigation held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-navigation-release-duration - navigation held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-navigation-pressed-shadow - navigation held-state refinement; geometry is bounded and reduced motion wins.
 * @cssprop --en-navigation-pressed-color - navigation held-state refinement; geometry is bounded and reduced motion wins.
 * @tagname en-navigation
 * @slot - Native navigation content, ordinarily direct anchors with author-owned attributes and phrasing content.
 * @csspart base - The named native navigation landmark.
 * @csspart disclosure - Responsive native details container, when collapse-at is set.
 * @csspart control - Compact navigation summary, hidden in wide layout.
 * @fires {import('./disclosure.js').DisclosureChangeEvent} en-change - Cancelable tentative user or API disclosure proposal.
 * @fires {import('./disclosure.js').DisclosureToggleEvent} en-toggle - Noncancelable terminal state notification: Accepted user or API compact disclosure change, with detail.open.
 * @cssprop --en-navigation-current-background - Optional theme presentation; see the customization registry for state, fallback and reachability.
 * @cssprop --en-navigation-current-color - Optional theme presentation; see the customization registry for state, fallback and reachability.
 * @cssprop --en-navigation-current-indicator-color - Optional theme presentation; see the customization registry for state, fallback and reachability.
 * @cssprop --en-navigation-current-indicator-width - Optional theme presentation; see the customization registry for state, fallback and reachability.
 * @cssprop --en-navigation-hover-background - Optional theme presentation; see the customization registry for state, fallback and reachability.
 * @cssprop --en-navigation-hover-color - Optional theme presentation; see the customization registry for state, fallback and reachability.
 * @cssprop --en-navigation-pressed-background - Optional theme presentation; see the customization registry for state, fallback and reachability.
 * @cssprop --en-navigation-gap - Space between links.
 * @cssprop --en-navigation-background - Navigation surface color.
 * @cssprop --en-navigation-border-color - Navigation divider color.
 * @cssprop --en-navigation-color - Ordinary link color.
 * @cssprop --en-navigation-active-color - Current or hovered link color.
 * @cssprop --en-navigation-active-background - Current or hovered link surface.
 * @cssprop --en-navigation-link-radius - Link corner radius.
 * @cssprop --en-navigation-position - Set to sticky after measuring the host; defaults to static.
 * @cssprop --en-navigation-offset - Sticky block-start inset within the consuming scroll context.
 * @cssprop --en-navigation-z-index - Sticky navigation stacking level.
 */
export class EnNavigation extends EnElement<DisclosureEventMap> {
  static override properties = {
    label: { type: String, useDefault: true },
    sticky: { type: Boolean, reflect: true, useDefault: true },
    layout: { type: String, reflect: true },
    collapseAt: { type: String, attribute: 'collapse-at' },
    open: { type: Boolean, reflect: true, noAccessor: true },
    compact: { state: true },
    ready: { state: true },
  };
  static override styles = [foundationStyles, blockHostStyles, navigationStyles, navigationHostStyles, navigationDisclosureStyles];

  /** Accessible name of the internal navigation landmark. Supply a contextual, localized name. */
  declare label: string;
  /** Allow host-level sticky positioning when measured geometry is supplied by the consumer. */
  declare sticky: boolean;
  /** Flat wrapping links (default), or vertical sidebar links and groups. */
  declare layout: 'inline' | 'sidebar';
  /** Opt-in viewport breakpoint, e.g. 48rem. Empty disables responsive disclosure. */
  declare collapseAt: string;
  /** Compact expansion; retained independently of the always-expanded wide layout. */
  get open(): boolean { return this.disclosure.value; }
  set open(value: boolean) { this.disclosure.write(value); }
  /** Propose expansion with en-change and return its outcome. Property writes remain silent; completion is semantic, not visual. */
  requestOpen(open: boolean): ChangeOutcome { return this.disclosure.propose(Boolean(open), 'api'); }
  private readonly disclosure = new NavigationDisclosure(this);
  private declare compact: boolean;
  private declare ready: boolean;
  private media?: MediaQueryList;
  private observer?: MutationObserver;
  private lastCurrent?: Element;

  constructor() {
    super();
    this.label = 'Navigation';
    this.sticky = false;
    this.layout = 'inline'; this.collapseAt = ''; this.open = false;
    this.compact = false; this.ready = false;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.observer = new MutationObserver(() => this.syncCurrent());
    this.observer.observe(this, { subtree: true, childList: true, attributes: true, attributeFilter: ['aria-current', 'hidden'] });
    if (this.hasUpdated) { this.configureMedia(); this.syncCurrent(); }
  }
  override disconnectedCallback() {
    this.observer?.disconnect(); this.media?.removeEventListener('change', this.resize);
    super.disconnectedCallback();
  }
  protected override firstUpdated() { this.configureMedia(); this.syncCurrent(); }
  protected override updated(changed: PropertyValues) {
    if (changed.has('collapseAt') && this.ready) this.configureMedia();
  }
  protected override willUpdate(changed: PropertyValues) {
    if (changed.has('open') && !this.open && this.compact && this.contains(this.ownerDocument.activeElement)) this.summary()?.focus();
  }
  private summary() { return this.renderRoot.querySelector<HTMLElement>('summary'); }
  private current() {
    return [...this.querySelectorAll('a[aria-current]:not([aria-current="false"])')]
      .find(link => link.closest('en-navigation') === this && !link.closest('[hidden]'));
  }
  private syncCurrent() {
    const current = this.current();
    if (current !== this.lastCurrent) { this.lastCurrent = current; this.revealCurrent(); }
  }
  /** Open enclosing groups of the non-hidden current link without moving focus or changing routes. */
  revealCurrent(): void {
    const current = this.current();
    for (let parent = current?.parentElement; parent && parent !== this; parent = parent.parentElement) {
      if (parent.localName === 'en-navigation-group') {
        parent.setAttribute('open', ''); (parent as EnNavigationGroup).open = true;
      }
    }
  }
  private configureMedia() {
    this.media?.removeEventListener('change', this.resize);
    this.media = this.collapseAt ? this.ownerDocument.defaultView?.matchMedia(`(max-width: ${this.collapseAt})`) : undefined;
    this.media?.addEventListener('change', this.resize); this.resize(); this.ready = true;
  }
  private resize = () => {
    const compact = this.media?.matches ?? false;
    const summary = this.summary();
    const summaryFocused = !!summary && this.shadowRoot?.activeElement === summary;
    if (compact && !this.compact && this.contains(this.ownerDocument.activeElement)) this.open = true;
    this.compact = compact;
    if (!compact && summaryFocused) void this.updateComplete.then(() => {
      this.revealCurrent();
      // Group updates may need a frame before a previously collapsed current link is visible.
      requestAnimationFrame(() => {
        const candidates = [this.current(), ...this.querySelectorAll<HTMLElement>('a[href], en-navigation-group')];
        for (const candidate of candidates) {
          const target = candidate?.localName === 'en-navigation-group' ? candidate.shadowRoot?.querySelector<HTMLElement>('summary') : candidate as HTMLElement;
          if (target?.getClientRects().length) { target.focus(); break; }
        }
      });
    });
  };
  private activateSummary = (event: MouseEvent) => {
    if (!this.ready || !this.compact || event.defaultPrevented) return;
    event.preventDefault();
    this.disclosure.propose(!this.open, 'toggle');
    const details = this.renderRoot.querySelector('details');
    if (details) details.open = this.open;
  };
  private toggled = (event: Event) => {
    if (!this.ready || !this.compact) return;
    const next = (event.currentTarget as HTMLDetailsElement).open;
    if (next === this.open) return;
    this.open = next;
    this.disclosure.notify();
  };
  private keydown = (event: KeyboardEvent) => {
    const details = this.renderRoot.querySelector('details');
    // Native toggle is queued; a fast key press can precede its state notification.
    if (event.key !== 'Escape' || event.defaultPrevented || !this.compact || !details?.open) return;
    event.preventDefault(); event.stopPropagation();
    this.disclosure.propose(false, 'escape'); details.open = this.open;
    if (!this.open) this.summary()?.focus();
  };

  protected override render() {
    if (this.collapseAt) return html`<details part="disclosure" ?open=${!this.ready || !this.compact || this.open} @toggle=${this.toggled} @keydown=${this.keydown}>
      <summary @click=${this.activateSummary} part="control" ?hidden=${this.ready && !this.compact}>${this.label}</summary>
      ${slottedNavigationTemplate({ label: this.label })}
    </details>`;
    return slottedNavigationTemplate({ label: this.label });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'en-navigation': EnNavigation;
  }
}
