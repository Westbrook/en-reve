import type { ChangeOutcome } from '@en-reve/primitives/interactions/events.js';
import { observeIdReference, referenceRoot } from '../internal/id-reference.js';
import type { ReferenceRoot } from '../internal/id-reference.js';
import { tooltipWarmupGroup } from './warmup-group.js';
import { tooltipWarmupContext } from './context.js';
import { TargetContext } from '../internal/context-consumer.js';
import { FloatingSurface } from '../popover/floating-surface.js';
import type { OverlayTrigger } from '../popover/floating-surface.js';
import type { OverlayReason } from '../dialog/types.js';
import { tooltipTemplate } from './template.js';
import { distanceToBounds, inHoverCorridor } from './hover-corridor.js';
import type { Bounds, Point } from './hover-corridor.js';
import { TooltipPositionController } from './position-controller.js';
export type { TooltipAxis } from './position-controller.js';

let nextTooltipId = 0;

/**
 * Supplemental text for a native button or en-button, exposed on hover and keyboard focus.
 * `for` identifies an external trigger in this element's Document or ShadowRoot.
 * The trigger's aria-describedby references the real light-DOM content in that same tree.
 * Put required instructions in persistent content, not exclusively in a tooltip.
 * Content must be phrasing content without interactive descendants; use popover
 * for interactive content. en-button forwards the actual description elements to
 * its native semantic control; arbitrary custom-element triggers are unsupported.
 *
 * @tag en-tooltip
 * @tagname en-tooltip
 * @slot content - One phrasing element containing supplemental text; no controls.
 * @csspart arrow - Decorative pointer; size with --en-overlay-arrow-size.
 * @csspart arrow-shape - SVG path styling; use arrow-path for portable shape customization.
 * @csspart content - Scrollable content inside the arrow surface.
 * @cssprop --en-overlay-arrow-size - Pointer projection length; base is twice this size.
 * @csspart surface - Hoverable tooltip surface in the native top layer.
 * @fires {import('../dialog/types.js').OverlayChangeEvent} en-change - Cancelable tentative open state: {previous, proposed, reason}.
 * @cssprop --en-overlay-background - Tooltip background.
 * @cssprop --en-overlay-color - Tooltip foreground.
 * @cssprop --en-overlay-padding - Tooltip padding.
 * @cssprop --en-overlay-radius - Tooltip corner radius.
 * @cssprop --en-duration-enter - Optional tooltip fade-in duration; hover timing and focus behavior are unchanged.
 * @cssprop --en-duration-exit - Optional tooltip fade-out duration; native dismissal remains immediate.
 * @cssprop --en-ease-enter - Tooltip fade-in easing.
 * @cssprop --en-ease-exit - Tooltip fade-out easing.
 */
export class EnTooltip extends FloatingSurface {
  static override properties = {
    ...FloatingSurface.properties,
    arrow: {type: Boolean, reflect: true},
    arrowPath: {type: String, attribute: 'arrow-path'},
    warmupGroup: { type: String, attribute: 'warmup-group' },
    showDelay: { type: Number, attribute: 'show-delay' },
    hideDelay: { type: Number, attribute: 'hide-delay' },
    transitDuration: { type: Number, attribute: 'transit-duration' },
    inline: { type: String, reflect: true },
    block: { type: String, reflect: true },
  };

  #positioning = new TooltipPositionController(this);

  #warmupContext = new TargetContext(tooltipWarmupContext, () => { this.syncWarmupGroup(); this.requestUpdate(); });

  #group: ReturnType<typeof tooltipWarmupGroup> | null = null;
  #groupElement: Element | null = null;
  #groupRoot: ReferenceRoot | null = null;
  #groupId = '';
  #groupReference: (() => void) | null = null;
  #groupObserver: MutationObserver | null = null;
  #groupObservedElement: Element | null = null;
  #groupObservedTrigger: OverlayTrigger | null = null;
  #groupTrigger: OverlayTrigger | null = null;
  #groupAncestry: Node[] = [];
  #groupEligible = false;
  #groupGeneration = 0;
  #pointerOpenRevision: number | null = null;
  #pendingWarm: { revision: number; generation: number } | null = null;
  #content: HTMLElement | null = null;
  #contentRole: string | null = null;
  #generatedId: string | null = null;
  #descriptionTrigger: OverlayTrigger | null = null;
  #descriptionId: string | null = null;
  #descriptionAdded = false;
  #descriptionObserver: MutationObserver | null = null;
  #triggerHovered = false;
  #surfaceHovered = false;
  #focused = false;
  #focusDismissals = new Map<OverlayTrigger, () => void>();
  #blockedHover = false;
  #hoverDismissed = false;
  #showTimer: ReturnType<typeof setTimeout> | undefined;
  #hideTimer: ReturnType<typeof setTimeout> | undefined;
  #hoverEscapeListener: AbortController | null = null;
  #transit: { origin: Point; destination: Bounds; bestDistance: number; pointerId: number } | null = null;
  #transitListener: AbortController | null = null;
  #transitTimer: ReturnType<typeof setTimeout> | undefined;
  #lastTriggerPoint: Point | null = null;
  #lastSurfacePoint: Point | null = null;

  /**
   * Optional literal ID of a containing toolbar/group in the external trigger's tree.
   * After a pointer-opened tooltip is displayed, peers skip show-delay until 500ms
   * after all group pointer activity ends. Displayed focused help suppresses peer hover
   * until blur or accepted Escape. Fresh hover after focused Escape is pointer-only
   * until a new focus interaction. Missing/non-containing explicit groups stay independent.
   * With no explicit ID, tooltipWarmupContext is requested from the trigger's ancestry.
   * @default ""
   */
  declare warmupGroup: string;
  /** Pointer hover delay in milliseconds. Keyboard focus opens immediately. */
  declare showDelay: number;
  /** Pointer exit grace period; permits moving onto the tooltip surface. */
  declare hideDelay: number;
  /** Maximum safe pointer transit time across the gap, in milliseconds (0–5000). */
  declare transitDuration: number;
  /** Preferred inline region relative to the trigger: start, center or end. Follows its direction/writing mode. @default "center" */
  declare inline: 'start' | 'center' | 'end';
  /** Preferred block region: start, center or end. Center/center resolves to block end; viewport fit takes priority. @default "end" */
  declare block: 'start' | 'center' | 'end';

  /** Show a decorative, collision-aware pointer to the trigger. */
  declare arrow: boolean;
  /** SVG pointer path in a 16 by 8 viewBox; keep its base at y=0. */
  declare arrowPath: string;

  constructor() {
    super();
    this.arrow = false;
    this.arrowPath = 'M0 0 L8 8 L16 0';
    this.warmupGroup = '';
    this.showDelay = 300;
    this.hideDelay = 150;
    this.transitDuration = 1000;
    this.inline = 'center';
    this.block = 'end';
  }

  protected override position = (): void => {
    if (this.open) this.#positioning.position(this.surface, this.trigger, this.inline, this.block);
  };

  protected override get movesFocus(): boolean { return false; }
  protected override get triggerAttributes(): Readonly<Record<string, string>> { return {}; }

  protected override startListening(): void {
    super.startListening();
    this.#hoverEscapeListener = new AbortController();
    this.ownerDocument.addEventListener('keydown', this.#hoverEscape, { signal: this.#hoverEscapeListener.signal });
  }

  protected override stopListening(): void {
    super.stopListening();
    this.#hoverEscapeListener?.abort();
    this.#hoverEscapeListener = null;
    this.clearTransit();
  }

  #hoverEscape = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape' || event.defaultPrevented || !this.open
      || event.composedPath().includes(this) || this.hasOpenPopoverForTrigger) return;
    // A canceled orphan remains visible and must retain its Escape exit.
    if (this.trigger && !this.#triggerHovered && !this.#surfaceHovered && !this.#transit) return;
    event.preventDefault();
    this.hide('escape');
  };

  override show(reason: OverlayReason = 'programmatic'): ChangeOutcome {
    this.syncWarmupGroup();
    if (reason === 'hover' && this.#group?.hasFocusedPeer(this)) {
      this.#blockedHover = this.#triggerHovered;
      return 'unchanged';
    }
    const generation = this.#groupGeneration;
    const pointerRequest = this.#triggerHovered;
    const outcome = super.show(reason);
    // Consumer writes, nested changes and rebinding during dispatch cannot warm peers.
    this.syncWarmupGroup();
    if (outcome === 'committed' && reason === 'hover' && pointerRequest && this.#group
      && generation === this.#groupGeneration && this.eligibleTrigger()) {
      this.#pendingWarm = { revision: this.openRevision, generation };
    }
    return outcome;
  }

  protected override syncPopover(): void {
    this.syncWarmupGroup();
    if (!this.changingOpen && this.#pendingWarm?.revision === this.openRevision
      && this.#group?.hasFocusedPeer(this)) {
      this.#blockedHover = this.#triggerHovered;
      this.#pendingWarm = null;
      this.hide('hover');
    }
    super.syncPopover();
    if (!this.changingOpen) {
      if (this.surface?.matches(':popover-open')) this.position();
      else this.#positioning.release();
    }
    // Native beforetoggle listeners can rebind or move the trigger synchronously.
    this.syncWarmupGroup();
    this.#group?.focus(this, this.hasFocusedPresentation());
    const pending = this.#pendingWarm;
    if (!pending || this.changingOpen) return;
    this.#pendingWarm = null;
    if (this.open && pending.revision === this.openRevision
      && pending.generation === this.#groupGeneration && this.eligibleTrigger()
      && this.surface?.matches(':popover-open')) {
      this.#pointerOpenRevision = pending.revision;
      const group = this.#group;
      group?.markWarm(this, () => {
        this.syncWarmupGroup();
        return this.#group === group && this.open && pending.revision === this.openRevision
          && pending.generation === this.#groupGeneration && Boolean(this.surface?.matches(':popover-open'));
      });
    }
  }

  private eligibleTrigger(): boolean {
    const trigger = this.trigger;
    return Boolean(this.isConnected && trigger?.isConnected
      && referenceRoot(this)?.getElementById(this.for) === trigger
      && !trigger.disabled && !trigger.loading
      && !trigger.matches(':disabled, [aria-disabled="true"]'));
  }

  /** Validate synchronously too: mutations can occur before observer delivery or inside en-change. */
  private syncWarmupGroup = (): void => {
    const trigger = this.trigger;
    const root = trigger ? referenceRoot(trigger) : null;
    const id = typeof this.warmupGroup === 'string' ? this.warmupGroup : '';
    this.#warmupContext.setTarget(!id && this.eligibleTrigger() ? trigger ?? undefined : undefined);
    if (root !== this.#groupRoot || id !== this.#groupId) {
      this.#groupGeneration++;
      this.#pendingWarm = null;
      this.clearTimers();
      this.#groupReference?.();
      this.#groupReference = null;
      this.#groupRoot = root;
      this.#groupId = id;
      // Shared ID subscription detects late insertion and replacement without document scans.
      this.#groupReference = observeIdReference(root, id, () => this.reconcileWarmupGroup());
    }
    this.reconcileWarmupGroup();
  };

  private reconcileWarmupGroup(): void {
    const trigger = this.trigger;
    const candidate = this.#groupRoot?.getElementById(this.#groupId) ?? null;
    const eligible = this.eligibleTrigger();
    const element = eligible && candidate?.isConnected && candidate.contains(trigger) ? candidate : null;
    const resolvedGroup = element ? tooltipWarmupGroup(element)
      : eligible && !this.#groupId ? this.#warmupContext.value ?? null : null;
    const ancestry: Node[] = [];
    for (let node: Node | null = trigger; node; node =
      (node as Element).assignedSlot ?? node.parentNode ?? (node as ShadowRoot).host ?? null) ancestry.push(node);
    if (resolvedGroup !== this.#group || element !== this.#groupElement || trigger !== this.#groupTrigger
      || eligible !== this.#groupEligible || ancestry.length !== this.#groupAncestry.length
      || ancestry.some((node, index) => node !== this.#groupAncestry[index])) {
      this.#groupGeneration++;
      this.#pendingWarm = null;
      this.clearTimers();
      this.#group?.leave(this);
      this.#groupElement = element;
      this.#groupTrigger = trigger;
      this.#groupAncestry = ancestry;
      this.#groupEligible = eligible;
      this.#group = resolvedGroup;
      this.#pointerOpenRevision = null;
      const group = this.#group;
      group?.join(this, focus => this.handoffHover(group, focus), () => this.hasFocusedPresentation(), this.resumeHover);
    }
    // An unchanged ID may still have moved outside its group. Observe only the group
    // subtree plus trigger state; the shared root ID observer handles replacements.
    if (candidate !== this.#groupObservedElement || trigger !== this.#groupObservedTrigger) {
      this.#groupObserver?.disconnect();
      const Observer = this.ownerDocument.defaultView?.MutationObserver;
      if (Observer) this.#groupObserver ??= new Observer(this.syncWarmupGroup);
      if (candidate) this.#groupObserver?.observe(candidate, { childList: true, subtree: true });
      if (trigger) this.#groupObserver?.observe(trigger, { attributes: true, attributeFilter: ['disabled', 'loading', 'aria-disabled'] });
      this.#groupObservedElement = candidate;
      this.#groupObservedTrigger = trigger;
    }
    this.updateWarmupActivity();
    this.#group?.focus(this, this.hasFocusedPresentation());
  }

  /** A displayed successor replaces only unattended pointer help, through the normal event contract. */
  private hasFocusedPresentation(): boolean {
    if (!this.#groupId) this.#warmupContext.setTarget(this.eligibleTrigger() ? this.trigger ?? undefined : undefined);
    return Boolean(this.focusKeepsOpen && this.presentedOpen
      && this.eligibleTrigger() && this.trigger?.matches(':focus-within')
      && (this.#groupId
        ? this.#groupRoot?.getElementById(this.warmupGroup) === this.#groupElement && this.#groupElement?.contains(this.trigger)
        : this.#group && this.#warmupContext.value === this.#group)
      && this.surface?.matches(':popover-open'));
  }

  private resumeHover = (): void => {
    if (!this.#blockedHover) return;
    this.#blockedHover = false;
    if (this.isConnected && this.#triggerHovered && !this.#hoverDismissed) this.scheduleShow();
  };

  private handoffHover(group: ReturnType<typeof tooltipWarmupGroup>, focus = false): void {
    this.syncWarmupGroup();
    if (this.#group !== group || this.focusKeepsOpen) return;
    if (focus) {
      this.#blockedHover = this.#triggerHovered;
      clearTimeout(this.#showTimer);
      this.#showTimer = undefined;
    }
    if (!this.open || (this.#pointerOpenRevision !== this.openRevision
      && this.#pendingWarm?.revision !== this.openRevision)
      || (this.surface?.matches(':popover-open')
        && (this.#triggerHovered || this.#surfaceHovered))) return;
    // No delayed second dismissal after an application vetoes this handoff.
    this.clearTimers();
    const outcome = this.hide('hover');
    if (outcome === 'committed') this.syncPopover();
  }

  private releaseWarmupGroup(): void {
    this.#warmupContext.disconnect();
    this.#groupGeneration++;
    this.#pendingWarm = null;
    this.#groupReference?.();
    this.#groupReference = null;
    this.#groupRoot = null;
    this.#groupId = '';
    this.#groupObserver?.disconnect();
    this.#groupObserver = null;
    this.#groupObservedElement = null;
    this.#groupObservedTrigger = null;
    this.#group?.leave(this);
    this.#group = null;
    this.#groupElement = null;
    this.#pointerOpenRevision = null;
    this.#groupTrigger = null;
    this.#groupAncestry = [];
    this.#groupEligible = false;
  }

  private updateWarmupActivity(): void {
    this.#group?.activity(this, this.#triggerHovered || this.#surfaceHovered || Boolean(this.#transit));
  }

  private scheduleShow(): void {
    this.syncWarmupGroup();
    clearTimeout(this.#showTimer);
    if (!this.eligibleTrigger() || this.#hoverDismissed) return;
    if (this.#group?.hasFocusedPeer(this)) {
      this.#blockedHover = this.#triggerHovered;
      return;
    }
    const generation = this.#groupGeneration;
    const delay = this.#group?.warm ? 0 : Math.max(0, this.showDelay);
    this.#showTimer = setTimeout(() => {
      this.#showTimer = undefined;
      this.syncWarmupGroup();
      if (generation === this.#groupGeneration && this.eligibleTrigger()
        && this.#triggerHovered && !this.#hoverDismissed) this.show('hover');
    }, delay);
  }

  override hide(reason: OverlayReason = 'programmatic'): ChangeOutcome {
    const outcome = super.hide(reason);
    if (!this.open && outcome !== 'unchanged') {
      this.clearTransit();
      if (reason === 'escape' && outcome === 'committed') {
        this.#group?.cool();
        this.#hoverDismissed = this.#triggerHovered || this.#surfaceHovered;
        const trigger = this.trigger;
        if (trigger?.matches(':focus-within')) this.suppressFocusedInterval(trigger);
        this.clearTimers();
      }
    }
    this.#group?.focus(this, this.hasFocusedPresentation());
    return outcome;
  }

  /** Escape ends help for this focused interval, without moving native focus. */
  private suppressFocusedInterval(trigger: OverlayTrigger): void {
    if (this.#focusDismissals.has(trigger)) return;
    const release = (): void => {
      trigger.removeEventListener('blur', release);
      this.#focusDismissals.delete(trigger);
    };
    this.#focusDismissals.set(trigger, release);
    // Keep the interval through a temporary for rebind, but never beyond blur or teardown.
    trigger.addEventListener('blur', release, { once: true });
  }

  private get focusKeepsOpen(): boolean {
    return this.#focused && Boolean(this.trigger && !this.#focusDismissals.has(this.trigger));
  }

  protected override connectTrigger(trigger: OverlayTrigger): void {
    trigger.addEventListener('pointerenter', this.#triggerEnter);
    trigger.addEventListener('pointerleave', this.#triggerLeave);
    trigger.addEventListener('pointermove', this.#trackTrigger);
    trigger.addEventListener('focus', this.#focus);
    trigger.addEventListener('blur', this.#blur);
    this.readContent();
  }

  protected override disconnectTrigger(trigger: OverlayTrigger): void {
    // Removing a focused native control can end focus without dispatching blur.
    if (!trigger.matches(':focus-within')) this.#focusDismissals.get(trigger)?.();
    trigger.removeEventListener('pointerenter', this.#triggerEnter);
    trigger.removeEventListener('pointerleave', this.#triggerLeave);
    trigger.removeEventListener('pointermove', this.#trackTrigger);
    trigger.removeEventListener('focus', this.#focus);
    trigger.removeEventListener('blur', this.#blur);
    this.releaseWarmupGroup();
    this.clearDescription();
    this.#descriptionObserver?.disconnect();
    this.#triggerHovered = false;
    this.#blockedHover = false;
    this.#surfaceHovered = false;
    this.#focused = false;
    this.#hoverDismissed = false;
    this.#lastTriggerPoint = null;
    this.#lastSurfacePoint = null;
    this.clearTimers();
  }

  override disconnectedCallback(): void {
    this.#positioning.release();
    for (const release of this.#focusDismissals.values()) release();
    this.releaseWarmupGroup();
    this.#descriptionObserver?.disconnect();
    this.#descriptionObserver = null;
    this.clearTimers();
    this.clearDescription();
    this.clearContent();
    this.#surfaceHovered = false;
    this.#hoverDismissed = false;
    this.#lastSurfacePoint = null;
    super.disconnectedCallback();
  }

  protected override triggerChanged(): void {
    this.readContent();
    const trigger = this.trigger;
    this.#focused = trigger?.matches(':focus-within') ?? false;
    const hoverAvailable = this.ownerDocument.defaultView?.matchMedia('(any-hover: hover)').matches;
    this.#triggerHovered = Boolean(hoverAvailable && trigger?.matches(':hover'));
    this.#surfaceHovered = Boolean(hoverAvailable && this.surface?.matches(':popover-open:hover'));
    if (this.focusKeepsOpen) this.#focus();
    else if (this.#triggerHovered) {
      this.scheduleShow();
    } else if (!this.#surfaceHovered && this.open) this.#scheduleHide();
  }

  protected readContent = (): void => {
    if (!this.isConnected) return;
    const slot = this.renderRoot.querySelector<HTMLSlotElement>('slot[name="content"]');
    const assigned = slot?.assignedElements({ flatten: true }) ?? [];
    const candidate = assigned[0];
    const content = candidate && 'style' in candidate ? candidate as HTMLElement : null;
    if (content !== this.#content) {
      this.clearDescription();
      this.clearContent();
      this.#content = content;
      if (content) {
        this.#contentRole = content.getAttribute('role');
        content.setAttribute('role', 'tooltip');
      }
    }
    if (content && !content.id) {
      const root = content.getRootNode() as Document | ShadowRoot;
      let id: string;
      do { id = `en-tooltip-${++nextTooltipId}`; } while (root.getElementById(id));
      content.id = id;
      this.#generatedId = id;
    }
    const trigger = this.trigger;
    if (!content || !trigger || content.getRootNode() !== trigger.getRootNode()) {
      this.clearDescription();
      this.observeDescription();
      return;
    }
    const current = (trigger.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
    if (this.#descriptionTrigger !== trigger || this.#descriptionId !== content.id || !current.includes(content.id)) {
      this.clearDescription();
      const descriptions = new Set((trigger.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean));
      this.#descriptionAdded = !descriptions.has(content.id);
      descriptions.add(content.id);
      if (this.#descriptionAdded) trigger.setAttribute('aria-describedby', [...descriptions].join(' '));
      this.#descriptionTrigger = trigger;
      this.#descriptionId = content.id;
    }
    this.observeDescription();
  };

  /** Observe only the two owned relationship endpoints, never their surrounding document. */
  protected observeDescription(): void {
    this.#descriptionObserver?.disconnect();
    const Observer = this.ownerDocument.defaultView?.MutationObserver;
    if (!Observer) return;
    this.#descriptionObserver ??= new Observer(() => this.readContent());
    if (this.trigger) this.#descriptionObserver.observe(this.trigger, { attributes: true, attributeFilter: ['aria-describedby'] });
    if (this.#content) this.#descriptionObserver.observe(this.#content, { attributes: true, attributeFilter: ['id'] });
  }

  protected clearContent(): void {
    if (this.#content) {
      if (this.#content.getAttribute('role') === 'tooltip') {
        if (this.#contentRole === null) this.#content.removeAttribute('role');
        else this.#content.setAttribute('role', this.#contentRole);
      }
      if (this.#generatedId && this.#content.id === this.#generatedId) this.#content.removeAttribute('id');
    }
    this.#content = null;
    this.#contentRole = null;
    this.#generatedId = null;
  }

  protected clearDescription(): void {
    const trigger = this.#descriptionTrigger;
    if (trigger && this.#descriptionId && this.#descriptionAdded) {
      const descriptions = (trigger.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(id => id && id !== this.#descriptionId);
      if (descriptions.length) trigger.setAttribute('aria-describedby', descriptions.join(' '));
      else trigger.removeAttribute('aria-describedby');
    }
    this.#descriptionTrigger = null;
    this.#descriptionId = null;
    this.#descriptionAdded = false;
  }

  protected clearTimers(): void {
    clearTimeout(this.#showTimer);
    clearTimeout(this.#hideTimer);
    this.#showTimer = undefined;
    this.#hideTimer = undefined;
    this.clearTransit();
  }

  protected clearTransit(): void {
    clearTimeout(this.#transitTimer);
    this.#transitTimer = undefined;
    this.#transitListener?.abort();
    this.#transitListener = null;
    this.#transit = null;
    this.updateWarmupActivity();
  }

  protected beginTransit(event: PointerEvent, destination: HTMLElement | null, previous: Point | null): boolean {
    this.clearTransit();
    if (!this.open || this.focusKeepsOpen || this.#hoverDismissed || event.pointerType === 'touch' || !destination) return false;
    const bounds = destination.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return false;
    const origin = { x: event.clientX, y: event.clientY };
    const distance = distanceToBounds(origin, bounds);
    if (previous && distance > distanceToBounds(previous, bounds) + 4) return false;
    const duration = Math.min(5000, Math.max(0, Number.isFinite(this.transitDuration) ? this.transitDuration : 1000));
    if (!duration) return false;
    clearTimeout(this.#hideTimer);
    this.#transit = { origin, destination: bounds, bestDistance: distance, pointerId: event.pointerId };
    this.#transitListener = new AbortController();
    const options = { signal: this.#transitListener.signal, passive: true };
    this.ownerDocument.addEventListener('pointermove', this.#transitMove, options);
    this.ownerDocument.addEventListener('scroll', this.#endTransit, { ...options, capture: true });
    this.updateWarmupActivity();
    this.#transitTimer = setTimeout(this.#endTransit, duration);
    return true;
  }

  #transitMove = (event: PointerEvent): void => {
    const transit = this.#transit;
    if (!transit || event.pointerId !== transit.pointerId) return;
    const point = { x: event.clientX, y: event.clientY };
    const distance = distanceToBounds(point, transit.destination);
    if (!inHoverCorridor(point, transit.origin, transit.destination) || distance > transit.bestDistance + 4) {
      this.#endTransit();
      return;
    }
    transit.bestDistance = Math.min(transit.bestDistance, distance);
  };

  #endTransit = (): void => { this.clearTransit(); this.#scheduleHide(); };
  #trackTrigger = (event: PointerEvent): void => {
    if (event.pointerType === 'touch' || !this.eligibleTrigger()) return;
    this.#lastTriggerPoint = { x: event.clientX, y: event.clientY };
    if (this.#triggerHovered) return;
    this.clearTransit();
    this.#triggerHovered = true;
    clearTimeout(this.#hideTimer);
    this.scheduleShow();
  };
  #trackSurface = (event: PointerEvent): void => { this.#lastSurfacePoint = { x: event.clientX, y: event.clientY }; };

  #triggerEnter = (event: PointerEvent): void => {
    if (event.pointerType === 'touch' || !this.eligibleTrigger()) return;
    // Layout, insertion and reveal can dispatch entry beneath a stationary pointer.
    // Only a subsequent pointermove establishes interest and starts the show delay.
    this.#lastTriggerPoint = { x: event.clientX, y: event.clientY };
  };

  #triggerLeave = (event: PointerEvent): void => {
    this.#triggerHovered = false;
    this.#blockedHover = false;
    this.updateWarmupActivity();
    if (!this.#surfaceHovered) this.#hoverDismissed = false;
    clearTimeout(this.#showTimer);
    if (!this.beginTransit(event, this.surface, this.#lastTriggerPoint)) this.#scheduleHide();
  };

  #surfaceEnter = (event: PointerEvent): void => {
    if (event.pointerType === 'touch') return;
    this.clearTransit();
    this.#trackSurface(event);
    this.#surfaceHovered = true;
    this.syncWarmupGroup();
    clearTimeout(this.#hideTimer);
  };

  #surfaceLeave = (event: PointerEvent): void => {
    this.#surfaceHovered = false;
    this.updateWarmupActivity();
    if (!this.#triggerHovered) this.#hoverDismissed = false;
    if (!this.beginTransit(event, this.trigger, this.#lastSurfacePoint)) this.#scheduleHide();
  };

  #focus = (): void => {
    const trigger = this.trigger;
    if (trigger) this.#focusDismissals.get(trigger)?.();
    this.#focused = true;
    this.#hoverDismissed = false;
    this.clearTimers();
    this.show('focus');
  };

  #blur = (): void => {
    const trigger = this.trigger;
    if (trigger) this.#focusDismissals.get(trigger)?.();
    this.#focused = false;
    this.#group?.focus(this, false);
    if (!this.#triggerHovered && !this.#surfaceHovered) this.#hoverDismissed = false;
    this.#scheduleHide();
  };

  #scheduleHide = (): void => {
    clearTimeout(this.#hideTimer);
    this.#hideTimer = setTimeout(() => {
      if (this.focusKeepsOpen || this.#triggerHovered || this.#surfaceHovered || this.#transit) return;
      this.#hoverDismissed = false;
      if (this.isConnected) this.hide('hover');
    }, Math.max(0, this.hideDelay));
  };

  protected override render() {
    return tooltipTemplate({ arrow: this.arrow, arrowPath: this.arrowPath, contentSlotChange: this.readContent, nativeToggle: this.nativeToggle,
      pointerEnter: this.#surfaceEnter, pointerLeave: this.#surfaceLeave, pointerMove: this.#trackSurface });
  }
}

declare global { interface HTMLElementTagNameMap { 'en-tooltip': EnTooltip; } }
