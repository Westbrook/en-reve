import { EnElement } from '../internal/en-element.js';
import { foundationStyles, blockHostStyles } from '@en-reve/styles/foundations.js';
import { feedbackStyles, mediaStyles } from '@en-reve/styles/feedback.js';
import { controlStyles } from '@en-reve/styles/controls.js';
import { dispatchChange } from '@en-reve/primitives/interactions/events.js';
import { OPTIONAL_SLOT_PRESENCE_ATTRIBUTE, recoverOptionalSlotPresence } from '@en-reve/primitives/interactions/optional-slot-presence.js';
import { alertTemplate } from './template.js';

/**
 * A contextual status message with optional interceptable dismissal.
 * The status region stays mounted across updates. Initial content is visible but
 * announcement on insertion is not guaranteed by assistive technology.
 * Consumers manage focus when dismissing a message containing the focused control.
 * @tagname en-alert
 * @cssprop --en-alert-background - Message fill.
 * @cssprop --en-alert-color - Message text color.
 * @cssprop --en-alert-border-color - Message boundary color.
 * @slot - Message content. Supply text that communicates meaning without color.
 * @slot icon - Optional decorative status icon.
 * @csspart base - Message surface.
 * @csspart icon - Decorative icon region.
 * @csspart content - The polite status region.
 * @csspart close - The native dismiss button.
 * @fires {CustomEvent<{previous: boolean, proposed: boolean, reason: 'dismiss'}>} en-change - Cancelable, bubbling, composed tentative dismissal; open exposes proposed state during dispatch.
 */
export class EnAlert extends EnElement {
  static override properties = {
    variant: { reflect: true },
    announcement: { reflect: true },
    dismissible: { type: Boolean, reflect: true },
    dismissLabel: { attribute: 'dismiss-label' },
    open: { type: Boolean, reflect: true, noAccessor: true },
    hasIcon: { state: true },
  };
  static override styles = [foundationStyles, blockHostStyles, controlStyles, feedbackStyles, mediaStyles];

  /** Announcement policy: static callouts use none; status is the compatible default. */
  declare announcement: 'none' | 'polite' | 'assertive';
  declare variant: 'info' | 'success' | 'warning' | 'danger';
  /** Shows a native dismiss control. */
  declare dismissible: boolean;
  /** Localized dismiss button label. */
  declare dismissLabel: string;
  private declare hasIcon: boolean;
  private openValue = true;
  private revision = 0;

  constructor() {
    super();
    this.variant = 'info'; this.announcement = 'polite';
    this.dismissible = false;
    this.dismissLabel = 'Dismiss notification';
    this.hasIcon = false;
  }

  /** Open state, including tentative dismissal during en-change. Author writes are silent. */
  get open(): boolean {
    return this.openValue;
  }

  set open(value: boolean) {
    const previous = this.openValue;
    this.openValue = Boolean(value);
    this.revision += 1;
    this.requestUpdate('open', previous);
  }

  /** Proposes dismissal; cancel en-change to restore the previous open state. */
  dismiss(): void {
    if (!this.open) return;
    const previous = this.open;
    try {
      dispatchChange(this, {
        previous,
        proposed: false,
        reason: 'dismiss',
        getRevision: () => this.revision,
        stage: (value) => { this.openValue = value; },
        rollback: (value) => {
          this.openValue = value;
          this.requestUpdate('open', false);
        },
      });
    } finally {
      // Same-value author writes during dispatch still need the settled value rendered.
      this.requestUpdate('open', previous);
    }
  }

  private readonly onDismiss = () => this.dismiss();

  protected override willUpdate(): void {
    if (this.hasUpdated) return;
    const presence = recoverOptionalSlotPresence(this, ['icon']);
    if (presence) this.hasIcon = presence.icon;
  }

  protected override firstUpdated(): void {
    this.removeAttribute(OPTIONAL_SLOT_PRESENCE_ATTRIBUTE);
    const icon = this.renderRoot.querySelector<HTMLSlotElement>('slot[name="icon"]');
    if (icon) this.syncIconPresence(icon);
  }

  private syncIconPresence(slot: HTMLSlotElement): void {
    this.hasIcon = slot.assignedNodes({ flatten: true }).some((node) =>
      node.nodeType === 1 || Boolean(node.textContent?.trim()),
    );
  }

  private readonly onIconChange = (event: Event) => {
    // Inspect the receiving icon slot even when a forwarding slot emitted it.
    this.syncIconPresence(event.currentTarget as HTMLSlotElement);
  };

  protected override render() {
    return alertTemplate({
      open: this.open,
      announcement: this.announcement,
      variant: this.variant,
      dismissible: this.dismissible,
      dismissLabel: this.dismissLabel || 'Dismiss notification',
      onDismiss: this.onDismiss,
      hasIcon: this.hasIcon,
      onIconChange: this.onIconChange,
    });
  }
}

declare global { interface HTMLElementTagNameMap { 'en-alert': EnAlert; } }
