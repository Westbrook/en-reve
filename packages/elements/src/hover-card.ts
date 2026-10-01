import { connectionDocument } from './internal/element-registry.js';
import { type PropertyValues } from 'lit';
import { EnPopover } from './popover/popover.js';
import type { OverlayReason } from './dialog/types.js';
import { inHoverCorridor, type Point } from './tooltip/hover-corridor.js';
/** Supplemental interactive preview. Hover never moves focus; activation enters a
 * nonmodal dialog. Essential information must remain available outside the preview.
 * @tagname en-hover-card
 */
export class EnHoverCard extends EnPopover {
    static override properties = { ...EnPopover.properties, openDelay: { type: Number, attribute: 'open-delay' }, closeDelay: { type: Number, attribute: 'close-delay' } };
    declare openDelay: number;
    declare closeDelay: number;
    private hoverOnly = false;
    private timer?: ReturnType<typeof setTimeout>;
    private origin?: Point;
    private destination?: HTMLElement;
    private boundSurface?: HTMLElement;
    constructor() { super(); this.openDelay = 300; this.closeDelay = 200; }
    private clear() { clearTimeout(this.timer); this.timer = undefined; this.origin = undefined; connectionDocument(this).removeEventListener('pointermove', this.transit); }
    private enter = () => { this.clear(); };
    private triggerEnter = (event: Event) => { if ((event as PointerEvent).pointerType === 'touch')
        return; this.clear(); if (!this.open)
        this.timer = setTimeout(() => { if (this.trigger?.isConnected)
            this.show('hover'); }, Math.max(0, this.openDelay)); };
    private leave = (event: Event) => {
        this.clear();
        if (!this.open)
            return;
        if (this.contains(this.ownerDocument.activeElement) || this.renderRoot.contains(this.activeElement))
            return;
        const pointer = event as PointerEvent;
        this.origin = { x: pointer.clientX, y: pointer.clientY };
        this.destination = event.currentTarget === this.trigger ? this.surface ?? undefined : this.trigger ?? undefined;
        this.ownerDocument.addEventListener('pointermove', this.transit);
        this.timer = setTimeout(() => { this.clear(); this.hide('hover'); }, Math.max(1000, this.closeDelay));
    };
    private transit = (event: PointerEvent) => { if (!this.origin || !this.destination)
        return; if (inHoverCorridor({ x: event.clientX, y: event.clientY }, this.origin, this.destination.getBoundingClientRect()))
        return; this.clear(); this.timer = setTimeout(() => this.hide('hover'), Math.max(0, this.closeDelay)); };
    override show(reason: OverlayReason = 'programmatic') { this.hoverOnly = reason === 'hover'; return super.show(reason); }
    override hide(reason: OverlayReason = 'programmatic') { this.clear(); return super.hide(reason); }
    protected override focusSurface() { if (!this.hoverOnly)
        super.focusSurface(); }
    protected override triggerClick = (event: MouseEvent) => { if (event.defaultPrevented || event.button !== 0 || !this.trigger || this.trigger.matches(':disabled,[disabled],[aria-disabled="true"],[inert]'))
        return; if (this.open && this.hoverOnly) {
        this.hoverOnly = false;
        super.focusSurface();
    }
    else if (this.open)
        this.hide('trigger');
    else
        this.show('trigger'); };
    protected override connectTrigger(trigger: NonNullable<EnHoverCard['trigger']>) { super.connectTrigger(trigger); trigger.addEventListener('pointerenter', this.triggerEnter); trigger.addEventListener('pointerleave', this.leave); }
    protected override disconnectTrigger(trigger: NonNullable<EnHoverCard['trigger']>) { this.clear(); trigger.removeEventListener('pointerenter', this.triggerEnter); trigger.removeEventListener('pointerleave', this.leave); super.disconnectTrigger(trigger); }
    protected override updated(changed: PropertyValues) { super.updated(changed); if (this.surface !== this.boundSurface) {
        this.boundSurface?.removeEventListener('pointerenter', this.enter);
        this.boundSurface?.removeEventListener('pointerleave', this.leave);
        this.boundSurface = this.surface ?? undefined;
        this.boundSurface?.addEventListener('pointerenter', this.enter);
        this.boundSurface?.addEventListener('pointerleave', this.leave);
    } }
    override disconnectedCallback() { this.clear(); this.boundSurface = undefined; super.disconnectedCallback(); }
}
declare global {
    interface HTMLElementTagNameMap {
        'en-hover-card': EnHoverCard;
    }
}
