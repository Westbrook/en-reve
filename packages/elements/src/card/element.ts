import { EnElement } from '../internal/en-element.js';
import { foundationStyles, blockHostStyles } from '@en-reve/styles/foundations.js';
import { surfaceStyles } from '@en-reve/styles/surfaces.js';
import { OPTIONAL_SLOT_PRESENCE_ATTRIBUTE, recoverOptionalSlotPresence } from '@en-reve/primitives/interactions/optional-slot-presence.js';
import { cardTemplate } from './template.js';

/**
 * A composable content surface. Consumers supply headings and document semantics.
 * @tagname en-card
 * @cssprop --en-card-shadow - Optional theme presentation; see the customization registry for state, fallback and reachability.
 * @cssprop --en-surface-shadow - Optional theme presentation; see the customization registry for state, fallback and reachability.
 * @cssprop --en-surface-background - Surface fill.
 * @cssprop --en-card-background - Card fill falling back to the shared surface background.
 * @cssprop --en-surface-color - Surface text color.
 * @cssprop --en-surface-border-color - Surface border color.
 * @cssprop --en-surface-radius - Surface corner radius.
 * @cssprop --en-surface-padding - Content inset.
 * @slot - Main content, including any interactive elements.
 * @slot header - Optional heading or introductory content.
 * @slot footer - Optional supporting content or actions.
 * @csspart base - The card surface.
 * @csspart header - Header region.
 * @csspart content - Main content region.
 * @csspart footer - Footer region.
 */
export class EnCard extends EnElement {
  static override properties = {
    hasHeader: { state: true },
    hasFooter: { state: true },
  };
  static override styles = [foundationStyles, blockHostStyles, surfaceStyles];

  private declare hasHeader: boolean;
  private declare hasFooter: boolean;

  constructor() {
    super();
    // The buffered SSR adapter determines optional regions from authored children.
    // Ordinary Lit rendering conservatively keeps supplied content visible.
    this.hasHeader = true;
    this.hasFooter = true;
  }

  protected override willUpdate(): void {
    if (this.hasUpdated) return;
    const presence = recoverOptionalSlotPresence(this, ['header', 'footer']);
    if (presence) {
      this.hasHeader = presence.header;
      this.hasFooter = presence.footer;
    }
  }

  protected override firstUpdated(): void {
    this.removeAttribute(OPTIONAL_SLOT_PRESENCE_ATTRIBUTE);
    // Empty slots need not emit slotchange, and SSR assignment can precede
    // hydration's listeners. Reconcile once the browser owns the rendered slots.
    for (const slot of this.renderRoot.querySelectorAll<HTMLSlotElement>('slot[name]')) {
      this.syncSlotPresence(slot);
    }
  }

  private syncSlotPresence(slot: HTMLSlotElement): void {
    const present = slot.assignedNodes({ flatten: true }).some((node) =>
      node.nodeType === 1 || Boolean(node.textContent?.trim()),
    );
    if (slot.name === 'header') this.hasHeader = present;
    if (slot.name === 'footer') this.hasFooter = present;
  }

  private readonly onSlotChange = (event: Event) => {
    // A forwarded slotchange can target the consumer's differently named slot.
    // Resolve presence for the receiving header/footer slot instead.
    this.syncSlotPresence(event.currentTarget as HTMLSlotElement);
  };

  protected override render() {
    return cardTemplate({
      hasHeader: this.hasHeader,
      hasFooter: this.hasFooter,
      onSlotChange: this.onSlotChange,
    });
  }
}

declare global { interface HTMLElementTagNameMap { 'en-card': EnCard; } }
