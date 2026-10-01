import { isHTMLElement } from './internal/dom-kind.js';
import { connectionDocument } from './internal/element-registry.js';
import { EnMenu } from './menu/element.js';
import type { OverlayTrigger } from './popover/floating-surface.js';
import { focusedElement } from './dialog/focus.js';
/** A context-invocation adapter over the existing menu engine.
 * The for target should be focusable and offer an ordinary menu-button fallback.
 * @tagname en-context-menu
 * @slot - Existing en-menu-item commands and nested menus.
 */
export class EnContextMenu extends EnMenu {
    private pointAnchor?: HTMLSpanElement;
    private suppressClickUntil = 0;
    private suppressClick = (event: Event): void => { if (Date.now() < this.suppressClickUntil) {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.suppressClickUntil = 0;
    } };
    private target: HTMLElement | null = null;
    private pendingPress?: {
        id: number;
        x: number;
        y: number;
        timer: ReturnType<typeof setTimeout>;
    };
    /** The actual invocation target; useful for application-owned commands. */
    get contextTarget(): HTMLElement | null { return this.target; }
    protected override get triggerAttributes():Readonly<Record<string,string>> {const attributes={...super.triggerAttributes};if(!this.trigger?.matches('button,en-button,[role="button"]'))delete attributes['aria-expanded'];return attributes;}
    protected override get positionAnchor(): HTMLElement | null { return this.pointAnchor ?? this.trigger; }
    protected override acceptsTrigger(element: Element): boolean { return isHTMLElement(element) && !element.matches('[disabled], [inert]'); }
    protected override connectTrigger(trigger: OverlayTrigger): void {
        trigger.addEventListener('contextmenu', this.context);
        trigger.addEventListener('keydown', this.contextKey);
        trigger.addEventListener('pointerdown', this.press);
        trigger.addEventListener('click', this.suppressClick, true);
        this.ownerDocument.addEventListener('scroll', this.cancelPress, true);
        this.ownerDocument.addEventListener('pointermove', this.move);
        this.ownerDocument.addEventListener('pointerup', this.cancelPress);
        this.ownerDocument.addEventListener('pointercancel', this.cancelPress);
    }
    protected override disconnectTrigger(trigger: OverlayTrigger): void {
        trigger.removeEventListener('contextmenu', this.context);
        trigger.removeEventListener('keydown', this.contextKey);
        trigger.removeEventListener('pointerdown', this.press);
        trigger.removeEventListener('click', this.suppressClick, true);
        connectionDocument(this).removeEventListener('scroll', this.cancelPress, true);
        connectionDocument(this).removeEventListener('pointermove', this.move);
        connectionDocument(this).removeEventListener('pointerup', this.cancelPress);
        connectionDocument(this).removeEventListener('pointercancel', this.cancelPress);
        this.cancelPress();
    }
    protected override openerFor(active: Element | null): HTMLElement | null {
        return this.target?.matches('button,a[href],input,select,textarea,[tabindex]') ? this.target : this.trigger ?? (active as HTMLElement | null);
    }
    /** Propose opening for a target, with optional viewport pointer coordinates.
     * The configured for target remains the stable keyboard/fallback association. */
    showFor(target: HTMLElement, point?: {
        x: number;
        y: number;
    }): void {
        if (!this.trigger || !target.isConnected || !(target === this.trigger || this.trigger.contains(target)))
            return;
        this.target = target;
        this.pointAnchor?.remove();
        this.pointAnchor = undefined;
        if (point && Number.isFinite(point.x) && Number.isFinite(point.y)) {
            const anchor = this.ownerDocument.createElement('span');
            anchor.slot = 'context-anchor';
            anchor.setAttribute('aria-hidden', 'true');
            Object.assign(anchor.style, { position: 'fixed', left: `${point.x}px`, top: `${point.y}px`, width: '1px', height: '1px', pointerEvents: 'none', visibility: 'hidden' });
            this.ownerDocument.body.append(anchor);
            this.pointAnchor = anchor;
        }
        this.show();
        this.requestUpdate();
    }
    private context = (event: Event): void => {
        const pointer = event as MouseEvent;
        if (event.defaultPrevented)
            return;
        event.preventDefault();
        this.cancelPress();
        const target = event.composedPath().find(node => isHTMLElement(node) && (node === this.trigger || this.trigger?.contains(node))) as HTMLElement | undefined;
        if (target)
            this.showFor(target, { x: pointer.clientX, y: pointer.clientY });
    };
    private contextKey = (event: Event): void => {
        const key = event as KeyboardEvent;
        if (key.defaultPrevented || !(key.key === 'ContextMenu' || key.key === 'F10' && key.shiftKey))
            return;
        key.preventDefault();
        const active = focusedElement(this.ownerDocument);
        this.showFor(isHTMLElement(active) && this.trigger?.contains(active) ? active : this.trigger!);
    };
    private press = (event: Event): void => {
        const pointer = event as PointerEvent;
        this.cancelPress();
        if (pointer.pointerType !== 'touch' || !pointer.isPrimary || pointer.defaultPrevented)
            return;
        const target = pointer.composedPath().find(node => isHTMLElement(node) && (node === this.trigger || this.trigger?.contains(node))) as HTMLElement;
        this.pendingPress = { id: pointer.pointerId, x: pointer.clientX, y: pointer.clientY,
            timer: setTimeout(() => { this.pendingPress = undefined; this.suppressClickUntil = Date.now() + 1200; this.showFor(target, { x: pointer.clientX, y: pointer.clientY }); }, 650) };
    };
    private move = (event: Event): void => {
        const pointer = event as PointerEvent, press = this.pendingPress;
        if (press && (pointer.pointerId !== press.id || Math.hypot(pointer.clientX - press.x, pointer.clientY - press.y) > 8))
            this.cancelPress();
    };
    private cancelPress = (): void => { if (this.pendingPress)
        clearTimeout(this.pendingPress.timer); this.pendingPress = undefined; };
    override disconnectedCallback(): void { this.cancelPress(); this.pointAnchor?.remove(); this.pointAnchor = undefined; this.target = null; super.disconnectedCallback(); }
}
declare global {
    interface HTMLElementTagNameMap {
        'en-context-menu': EnContextMenu;
    }
}
