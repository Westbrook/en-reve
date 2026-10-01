import { arrowExtent, positionOverlayArrow } from '../internal/overlay-arrow.js';
import { admitOverlayClick, eligibleOverlayTrigger } from '../internal/overlay-trigger.js';
import type { OverlayEventMap } from '../dialog/types.js';
import { setNativeSurfaceOpen } from '../internal/native-surface.js';
import { EnElement } from '../internal/en-element.js';
import type { PropertyValues } from 'lit';
import { dispatchChange } from '@en-reve/primitives/interactions/events.js';
import type { ChangeOutcome } from '@en-reve/primitives/interactions/events.js';
import { foundationStyles } from '@en-reve/styles/foundations.js';
import { overlayStyles } from '@en-reve/styles/overlays.js';
import { focusedElement, restoreFocus } from '../dialog/focus.js';
import type { OverlayReason } from '../dialog/types.js';
import { observeIdReference, referenceRoot } from '../internal/id-reference.js';
import type { ReferenceRoot } from '../internal/id-reference.js';

/** Supported public trigger surface; en-button forwards ARIA attributes to its native semantic control. */
export type OverlayTrigger = HTMLElement & { disabled?: boolean; loading?: boolean };

const triggerSurfaces = new WeakMap<OverlayTrigger, Set<FloatingSurface>>();

/** Includes slotted content and the private controls inside nested shadow roots. */
function composedContains(container: Node, node: Node | null): boolean {
  while (node) {
    if (node === container) return true;
    node = ('assignedSlot' in node && (node as Element).assignedSlot)
      || node.parentNode || ('host' in node ? (node as ShadowRoot).host : null);
  }
  return false;
}

/** Shared native floating-surface lifecycle; not registered as a custom element. */
export class FloatingSurface extends EnElement<OverlayEventMap> {
  static override properties = {
    open: { type: Boolean, reflect: true, noAccessor: true },
    for: { type: String, reflect: true },
  };
  static override styles = [foundationStyles, overlayStyles];

  #open = false;
  #revision = 0;
  #openRevision = 0;
  #changeDepth = 0;
  #nativeShown = false;
  #trigger: OverlayTrigger | null = null;
  #triggerOriginal: Record<string, string | null> = {};
  #triggerWritten: Record<string, string> = {};
  #referenceRoot: ReferenceRoot | null = null;
  #referenceId = '';
  #releaseReference: (() => void) | null = null;
  #listeners: AbortController | null = null;
  #opener: HTMLElement | null = null;
  #closeReason: OverlayReason = 'programmatic';
  #frame = 0;
  #resizeObserver: ResizeObserver | null = null;
  #openedFromTrigger = false;

  /** Open state, including a tentative value during en-change. Author writes are silent. */
  get open(): boolean { return this.#open; }
  set open(value: boolean) {
    const previous = this.#open;
    this.#open = Boolean(value);
    this.#revision++;
    this.#openRevision++;
    if (this.#open) {
      this.#closeReason = 'programmatic';
      if (!this.surface?.matches(':popover-open')) this.#nativeShown = false;
    } else this.#openedFromTrigger = false;
    this.requestUpdate('open', previous);
  }
  /**
   * Literal ID of an external native button or en-button in this element's Document or ShadowRoot.
   * No matching trigger defers initial display; an already visible surface retains its last position.
   * @default ""
   */
  declare for: string;

  constructor() {
    super();
    this.for = '';
  }

  show(reason: OverlayReason = 'programmatic'): ChangeOutcome {
    return this.requestOpen(true, reason);
  }
  hide(reason: OverlayReason = 'programmatic'): ChangeOutcome { return this.requestOpen(false, reason); }

  protected requestOpen(proposed: boolean, reason: OverlayReason): ChangeOutcome {
    if (proposed === this.open) return 'unchanged';
    const trigger = this.trigger, id = this.for;
    const previous = this.open;
    const previousNativeShown = this.#nativeShown;
    const previousCloseReason = this.#closeReason;
    const previousOpenedFromTrigger = this.#openedFromTrigger;
    this.#changeDepth++;
    try {
      return dispatchChange(this, {
        previous, proposed, reason,
        getRevision: () => this.#revision,
        canCommit: () => reason !== 'trigger' || (this.for === id && eligibleOverlayTrigger(this, id, trigger)),
        stage: value => {
          this.#open = value;
          if (value) {
            this.#openedFromTrigger = reason === 'trigger';
            if (!this.surface?.matches(':popover-open')) this.#nativeShown = false;
          } else this.#closeReason = reason;
        },
        rollback: value => {
          this.#open = value;
          this.#nativeShown = previousNativeShown;
          this.#closeReason = previousCloseReason;
          this.#openedFromTrigger = previousOpenedFromTrigger;
          this.requestUpdate('open', proposed);
        },
        commit: () => { this.#openRevision++; this.requestUpdate('open', previous); },
      });
    } finally {
      this.#changeDepth--;
      // Do not move focus or enter/leave the native top layer while tentative.
      if (!this.#changeDepth) this.requestUpdate('open', previous);
    }
  }

  protected get surface(): HTMLElement | null { return this.renderRoot?.querySelector('[popover]') ?? null; }
  protected get trigger(): OverlayTrigger | null { return this.#trigger; }
  protected get movesFocus(): boolean { return true; }
  /** Author writes and accepted nested open transitions invalidate deferred action defaults. */
  protected get openRevision(): number { return this.#openRevision; }
  protected get changingOpen(): boolean { return this.#changeDepth > 0; }
  protected get presentedOpen(): boolean { return this.#changeDepth ? this.#nativeShown : this.open; }
  protected get managesOwnPosition(): boolean { return false; }
  protected focusSurface(): void { this.surface?.focus({ preventScroll: true }); }
  protected returnsFocus(reason: OverlayReason): boolean { return reason !== 'outside'; }
  /** Snapshot the return target when presentation opens, including non-click entry. */
  protected openerFor(active: Element | null, fromTrigger: boolean): HTMLElement | null {
    return fromTrigger ? this.trigger : active && 'focus' in active ? active as HTMLElement : null;
  }
  protected get activeElement(): Element | null {
    let active = referenceRoot(this)?.activeElement ?? focusedElement(this.ownerDocument);
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
    return active;
  }
  /** A tooltip sharing a trigger must not consume Escape before its interactive popover. */
  protected get hasOpenPopoverForTrigger(): boolean {
    const surfaces = this.trigger && triggerSurfaces.get(this.trigger);
    return Boolean(surfaces && [...surfaces].some(surface => surface !== this && surface.movesFocus
      && surface.open && surface.surface?.matches(':popover-open')));
  }
  protected triggerChanged(): void { /* Specialized surfaces reconcile interaction state. */ }
  protected get triggerAttributes(): Readonly<Record<string, string>> {
    return { 'aria-haspopup': 'dialog', 'aria-expanded': String(this.open) };
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.updateComplete.then(() => {
      if (!this.isConnected) return;
      this.observeTrigger();
      this.syncPopover();
    });
  }

  override disconnectedCallback(): void {
    this.#releaseReference?.();
    this.#releaseReference = null;
    this.#referenceRoot = null;
    this.#referenceId = '';
    this.stopListening();
    this.detachTrigger();
    const surface = this.surface;
    this.#nativeShown = false;
    if (surface?.matches(':popover-open')) surface.hidePopover();
    this.#opener = null;
    this.#openedFromTrigger = false;
    super.disconnectedCallback();
  }

  protected override updated(_changes: PropertyValues): void {
    this.observeTrigger();
    this.syncTriggerAttributes();
    this.syncPopover();
    if (_changes.has('arrow') && this.open) { this.position(); this.startListening(); }
  }

  protected triggerClick = (event: MouseEvent): void => {
    if (!admitOverlayClick(event, eligibleOverlayTrigger(this, this.for, this.trigger))) return;
    if (this.open) this.hide('trigger');
    else this.show('trigger');
  };

  protected connectTrigger(trigger: OverlayTrigger): void {
    trigger.addEventListener('click', this.triggerClick);
  }
  protected disconnectTrigger(trigger: OverlayTrigger): void {
    trigger.removeEventListener('click', this.triggerClick);
  }

  protected observeTrigger(): void {
    if (!this.isConnected) return;
    const root = referenceRoot(this);
    const id = typeof this.for === 'string' ? this.for : '';
    if (this.#releaseReference && root === this.#referenceRoot && id === this.#referenceId) return;
    this.#releaseReference?.();
    this.#releaseReference = null;
    this.#referenceRoot = root;
    this.#referenceId = id;
    const release = observeIdReference(root, id, this.acceptTrigger);
    // Initial binding can emit a tooltip request whose consumer disconnects/rebinds us.
    if (!this.isConnected || referenceRoot(this) !== root || this.for !== id) release();
    else this.#releaseReference = release;
  }

  /** Specialized surfaces may accept additional encapsulated trigger components. */
  protected acceptsTrigger(element: Element): boolean {
    return element.namespaceURI === 'http://www.w3.org/1999/xhtml'
      && (element.localName === 'button' || element.localName === 'en-button');
  }

  protected acceptTrigger = (element: Element | null): void => {
    if (!this.isConnected) return;
    const trigger = element && this.acceptsTrigger(element) ? element as OverlayTrigger : null;
    if (trigger === this.#trigger) return;
    this.stopListening();
    this.detachTrigger();
    this.#trigger = trigger;
    if (trigger) {
      this.#triggerOriginal = Object.fromEntries(Object.keys(this.triggerAttributes).map(name => [name, trigger.getAttribute(name)]));
      let surfaces = triggerSurfaces.get(trigger);
      if (!surfaces) triggerSurfaces.set(trigger, surfaces = new Set());
      surfaces.add(this);
      this.connectTrigger(trigger);
      this.syncTriggerAttributes();
    }
    // A visible surface stays usable when its anchor disappears; no state proposal is synthesized.
    if (this.surface?.matches(':popover-open')) {
      this.position();
      this.startListening();
    }
    this.syncPopover();
    this.triggerChanged();
  };

  protected detachTrigger(): void {
    const trigger = this.#trigger;
    if (!trigger) return;
    this.disconnectTrigger(trigger);
    const surfaces = triggerSurfaces.get(trigger);
    surfaces?.delete(this);
    if (!surfaces?.size) triggerSurfaces.delete(trigger);
    for (const [name, value] of Object.entries(this.#triggerOriginal)) {
      if (trigger.getAttribute(name) !== this.#triggerWritten[name]) continue;
      if (value === null) trigger.removeAttribute(name);
      else trigger.setAttribute(name, value);
    }
    this.#triggerOriginal = {};
    this.#triggerWritten = {};
    this.#trigger = null;
  }

  protected syncTriggerAttributes(): void {
    const trigger = this.#trigger;
    if (!trigger || this.#changeDepth) return;
    for (const [name, value] of Object.entries(this.triggerAttributes)) {
      if (trigger.getAttribute(name) !== value) trigger.setAttribute(name, value);
      this.#triggerWritten[name] = value;
    }
  }

  protected syncPopover(): void {
    const surface = this.surface;
    if (!surface || !this.isConnected || this.#changeDepth) return;
    const shown = surface.matches(':popover-open');
    if (this.#nativeShown && !shown) {
      this.reconcileNativeHide();
      return;
    }
    if (this.open && !shown && this.trigger?.isConnected) {
      const active = this.activeElement;
      this.#opener = this.openerFor(active, this.#openedFromTrigger);
      this.#openedFromTrigger = false;
      if (this.movesFocus) setNativeSurfaceOpen(surface, true);
      surface.showPopover();
      this.#nativeShown = true;
      this.position();
      this.startListening();
      if (this.movesFocus) this.focusSurface();
    } else if (!this.open && shown) {
      const active = this.activeElement;
      const focusInside = composedContains(surface, active);
      this.#nativeShown = false;
      surface.hidePopover();
      if (this.movesFocus) setNativeSurfaceOpen(surface, false);
      this.stopListening();
      if (this.movesFocus && focusInside && this.returnsFocus(this.#closeReason)) restoreFocus(this.#opener);
      this.#opener = null;
      this.#closeReason = 'programmatic';
    }
    if (!this.open) this.#openedFromTrigger = false;
  }

  /** Native toggle is terminal; an external hide cannot be canceled afterward. */
  protected nativeToggle = (event: ToggleEvent): void => {
    if (event.newState !== 'closed' || !this.isConnected || !this.#nativeShown
      || this.surface?.matches(':popover-open')) return;
    this.reconcileNativeHide();
  };

  private reconcileNativeHide(): void {
    this.#nativeShown = false;
    if (this.movesFocus && this.surface) setNativeSurfaceOpen(this.surface, false);
    this.open = false;
    this.stopListening();
    this.#opener = null;
    this.#closeReason = 'programmatic';
  }

  protected position = (): void => {
    const surface = this.surface;
    const trigger = this.trigger;
    const view = this.ownerDocument.defaultView;
    if (!surface || !trigger?.isConnected || !view || !this.open) return;
    const anchor = trigger.getBoundingClientRect();
    const width = this.ownerDocument.documentElement.clientWidth;
    const height = this.ownerDocument.documentElement.clientHeight;
    const bounds = surface.getBoundingClientRect();
    // Gap follows the inherited spacing token; geometry is not a fixed visual scale.
    const gap = (parseFloat(view.getComputedStyle(surface).rowGap) || 0) + arrowExtent(surface);
    const rtl = view.getComputedStyle(this).direction === 'rtl';
    const preferredLeft = rtl ? anchor.right - bounds.width : anchor.left;
    const left = Math.max(gap, Math.min(preferredLeft, width - bounds.width - gap));
    const below = anchor.bottom + gap;
    const top = below + bounds.height <= height - gap ? below : Math.max(gap, anchor.top - bounds.height - gap);
    surface.style.left = `${left}px`;
    surface.style.top = `${top}px`;
    surface.style.right = 'auto';
    surface.style.bottom = 'auto';
    positionOverlayArrow(surface, trigger);
  };

  #schedulePosition = (): void => {
    const view = this.ownerDocument.defaultView;
    if (!view || this.#frame) return;
    this.#frame = view.requestAnimationFrame(() => { this.#frame = 0; this.position(); });
  };

  #keyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape' || event.defaultPrevented || !this.open
      || (!this.movesFocus && this.hasOpenPopoverForTrigger)) return;
    event.preventDefault();
    this.hide('escape');
  };

  #outside = (event: PointerEvent): void => {
    const path = event.composedPath();
    if (!path.includes(this) && (!this.trigger || !path.includes(this.trigger))) this.hide('outside');
  };

  #outsideDocument = (event: PointerEvent): void => {
    const root = referenceRoot(this);
    // Inside a closed shadow root only its own listener receives the full composed path.
    if (root && root !== this.ownerDocument && event.composedPath().includes((root as ShadowRoot).host)) return;
    this.#outside(event);
  };

  protected startListening(): void {
    this.stopListening();
    this.#listeners = new AbortController();
    const options = { signal: this.#listeners.signal };
    // Bubble phase lets an inner control handle Escape before the enclosing overlay.
    this.addEventListener('keydown', this.#keyDown, options);
    this.trigger?.addEventListener('keydown', this.#keyDown, options);
    const root = referenceRoot(this);
    if (root && root !== this.ownerDocument) root.addEventListener('pointerdown', this.#outside as EventListener, { ...options, capture: true });
    this.ownerDocument.addEventListener('pointerdown', this.#outsideDocument, { ...options, capture: true });
    if (!this.managesOwnPosition) {
      this.ownerDocument.addEventListener('scroll', this.#schedulePosition, { ...options, capture: true, passive: true });
      this.ownerDocument.defaultView?.addEventListener('resize', this.#schedulePosition, options);
      this.ownerDocument.defaultView?.visualViewport?.addEventListener('resize', this.#schedulePosition, options);
      this.ownerDocument.defaultView?.visualViewport?.addEventListener('scroll', this.#schedulePosition, options);
      const ResizeObserverConstructor = this.ownerDocument.defaultView?.ResizeObserver;
      if (ResizeObserverConstructor) {
        this.#resizeObserver = new ResizeObserverConstructor(this.#schedulePosition);
        if (this.surface) { this.#resizeObserver.observe(this.surface); const arrow = this.surface.querySelector('.en-overlay-arrow'); if (arrow) this.#resizeObserver.observe(arrow); }
        if (this.trigger) this.#resizeObserver.observe(this.trigger);
      }
    }
  }

  protected stopListening(): void {
    this.#listeners?.abort();
    this.#listeners = null;
    this.#resizeObserver?.disconnect();
    this.#resizeObserver = null;
    if (this.#frame) this.ownerDocument.defaultView?.cancelAnimationFrame(this.#frame);
    this.#frame = 0;
  }

}
