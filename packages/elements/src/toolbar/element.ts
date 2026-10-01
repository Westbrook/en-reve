import { ChildUpgrades } from '../internal/child-upgrades.js';
import { EnElement } from '../internal/en-element.js';
import { foundationStyles } from '@en-reve/styles/foundations.js';
import { toolbarStyles } from '@en-reve/styles/commands.js';
import { RovingFocusController } from '@en-reve/primitives/interactions/roving-focus.js';
import { claimFocusParticipant } from '../internal/focus-participant.js';
import { toolbarTemplate } from './template.js';

/**
 * A named action group with roving button navigation or ordinary mixed-control Tab order.
 * Buttons retain their native click behavior; the toolbar dispatches no command.
 * @tagname en-toolbar
 * @slot - Direct buttons in automatic roving mode; arbitrary labelled controls in tab mode.
 * @csspart base - The named toolbar layout.
 * @cssprop --en-space-actions - Space between toolbar actions.
 */
export class EnToolbar extends EnElement {
  static override properties = {
    label: {useDefault: true},
    orientation: { reflect: true },
    keyboardNavigation: { attribute: 'keyboard-navigation', reflect: true },
  };
  static override styles = [foundationStyles, toolbarStyles];

  /** Accessible name of this group of commands. */
  declare label: string;
  /** Arrow-key axis. Wrapped horizontal toolbars retain logical DOM order.
   * @default "horizontal"
   */
  declare orientation: 'horizontal' | 'vertical';
  /** Auto uses roving navigation for direct buttons; other interactive content uses
   * ordinary Tab order and group semantics. Tab explicitly selects that delivery,
   * including server rendering, without intercepting native editing keys.
   * @default "auto"
   */
  declare keyboardNavigation: 'auto' | 'tab';
  private nativeNavigation = false;
  private observer?: MutationObserver;
  private readonly roving: RovingFocusController;
  private readonly upgrades = new ChildUpgrades(this, () => this.refresh());
  private initialized = false;

  constructor() {
    super();
    this.label = 'Actions';
    this.orientation = 'horizontal';
    this.keyboardNavigation = 'auto';
    const host = this;
    this.roving = new RovingFocusController(this, {
      items: () => this.items(),
      get orientation() { return host.orientation === 'vertical' ? 'vertical' : 'horizontal'; },
      isDisabled: item => item.matches(':disabled, [disabled], [loading], [aria-disabled="true"], [hidden], [inert]')
        || !item.getClientRects().length || item.ownerDocument.defaultView?.getComputedStyle(item).visibility === 'hidden',
      claimTabStop: claimFocusParticipant,
      keydownCapture: true,
      recoverFocus: true,
    });
  }

  private usesNativeNavigation(): boolean {
    if (this.keyboardNavigation === 'tab') return true;
    // Lit's server shim has no authored children collection. Explicit tab mode
    // is the SSR contract; automatic discovery starts after browser connection.
    if (!this.children) return false;
    const interactive = 'button, input:not([type="hidden"]), select, textarea, a[href], area[href], summary, iframe, audio[controls], video[controls], [tabindex], [contenteditable]:not([contenteditable="false"]), [role="button"], [role="checkbox"], [role="radio"], [role="switch"], [role="textbox"], [role="combobox"], [role="slider"], [role="spinbutton"], [role="tree"], [role="grid"], [role="listbox"], [role="tablist"]';
    return Array.from(this.children).some(child => {
      if (child.getAttribute('slot')) return false;
      // Supported direct buttons own their encapsulated label/icon content.
      if (child.localName === 'button' || ['en-button', 'en-toggle-button'].includes(child.localName)) return false;
      // Unknown custom children may own a private interactive tree. Never assume
      // they are decorative or reach through that tree to take its tab stops.
      return [child, ...child.querySelectorAll('*')].some(node =>
        node.localName.includes('-') || node.matches(interactive));
    });
  }

  private items(): HTMLElement[] {
    const nativeNavigation = this.usesNativeNavigation();
    if (nativeNavigation !== this.nativeNavigation) {
      this.nativeNavigation = nativeNavigation;
      this.requestUpdate();
    }
    // Empty membership releases every prior lease, restoring the author's Tab
    // order without moving focus or replacing any authored control.
    if (nativeNavigation) return [];
    // Establish the initial composite only once its authored custom controls
    // can participate, otherwise an intervening native button would become the
    // remembered entry before an earlier custom button finishes upgrading.
    if (!this.initialized && Array.from(this.children).some(child => !child.getAttribute('slot') && ['en-button', 'en-toggle-button'].includes(child.localName) && !('updateComplete' in child))) return [];
    const items = Array.from(this.children).filter((child): child is HTMLElement =>
      !child.getAttribute('slot') && (child.localName === 'button' || ['en-button', 'en-toggle-button'].includes(child.localName) && 'updateComplete' in child));
    if (items.length) this.initialized = true;
    return items;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    const Observer = this.ownerDocument.defaultView?.MutationObserver;
    if (Observer) {
      this.observer = new Observer(() => this.refresh());
      this.observer.observe(this, {
        childList: true, subtree: true, attributes: true,
        attributeFilter: ['disabled', 'loading', 'aria-disabled', 'hidden', 'inert', 'slot', 'style', 'class', 'type', 'href', 'controls', 'role', 'contenteditable', 'tabindex'],
      });
    }
    this.refresh();
  }

  private observeButtonUpgrade(): void {
    this.upgrades.watch(Array.from(this.children).filter(item => ['en-button', 'en-toggle-button'].includes(item.localName)));
  }

  override disconnectedCallback(): void {
    this.observer?.disconnect();
    this.observer = undefined;
    super.disconnectedCallback();
  }

  private refresh = (): void => {
    if (this.isConnected) { this.roving.refresh(); this.observeButtonUpgrade(); }
  };

  protected override render() {
    return toolbarTemplate({ label: this.label, orientation: this.orientation, nativeNavigation: this.usesNativeNavigation(), onSlotChange: this.refresh });
  }
}

declare global { interface HTMLElementTagNameMap { 'en-toolbar': EnToolbar; } }
