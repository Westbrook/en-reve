import type { PropertyValues } from 'lit';
import { EnElement } from '../internal/en-element.js';
import { createDraftModel } from '@en-reve/primitives/state/draft.js';
import { EditingController } from '@en-reve/primitives/interactions/editing-controller.js';
import { SignalController } from '@en-reve/primitives/interactions/signal-controller.js';
import { dispatchChange } from '@en-reve/primitives/interactions/events.js';
import { foundationStyles, blockHostStyles } from '@en-reve/styles/foundations.js';
import { buttonStyles } from '@en-reve/styles/buttons.js';
import { paginationStyles } from '@en-reve/styles/pagination.js';
import { currentPage, normalizePage, normalizePageCount } from './state.js';
import { paginationTemplate, type PaginationReason } from './template.js';

/**
 * Native page actions with bounded direct access; data retrieval belongs to the application.
 * @tagname en-pagination
 * @slot previous - Noninteractive Previous button content; defaults to a directional icon.
 * @slot next - Noninteractive Next button content; defaults to a directional icon.
 * @csspart base - Labelled navigation.
 * @csspart actions - Full-width action layout and scrollport; flex when expanded, grid when compact.
 * @csspart middle - Compact status and direct-page chooser group.
 * @csspart compact-status - Current-page text inside the compact middle group.
 * @csspart expanded-status - Current-page text below expanded controls.
 * @csspart direct - Direct-page popover.
 * @csspart direct-summary - Inline ellipsis action opening direct-page entry.
 * @csspart jump - Direct-page numeric field and action.
 * @csspart page-input - Native direct-page number input.
 * @csspart go - Direct-page action button.
 * @csspart cancel - Dismisses direct-page entry without changing the page.
 * @csspart control - Every native page action button.
 * @csspart previous - Previous page button.
 * @csspart next - Next page button.
 * @csspart pages - Bounded numbered page actions.
 * @csspart page - Individual numbered page button; current page has aria-current=page.
 * @csspart gap - Decorative omitted-page indicator.
 * @csspart status - Current page text; intentionally not a live region.
 * @cssprop --en-pagination-align - Logical expanded group/status alignment: start, center (default), or end. Compact layout retains edge controls.
 * @cssprop --en-pagination-gap - Action/cell gap; defaults to --en-space-actions.
 * @cssprop --en-pagination-status-gap - Status/disclosure separation; defaults to --en-space-1.
 * @cssprop --en-pagination-page-min-inline-size - Numbered cell minimum; defaults to shared control and target size.
 * @cssprop --en-space-actions - Shared fallback for action spacing.
 * @cssprop --en-control-min-size - Shared minimum button block size.
 * @cssprop --en-button-radius - Shared action corner radius.
 * @cssprop --en-button-background - Shared action surface override.
 * @cssprop --en-button-color - Shared action text override.
 * @cssprop --en-button-border-color - Shared action border override.
 * @fires {import('../events.js').PaginationChangeEvent} en-change - Single cancelable tentative page change; detail is {previous, proposed, reason}.
 */
export class EnPagination extends EnElement {
	static override properties = {
		page: { type: Number, noAccessor: true },
		pageCount: { type: Number, attribute: 'page-count', noAccessor: true },
		hasNext: { type: Boolean, attribute: 'has-next' },
		disabled: { type: Boolean, reflect: true },
		label: {useDefault: true},
		previousLabel: { attribute: 'previous-label' , useDefault: true},
		nextLabel: { attribute: 'next-label' , useDefault: true},
		pageLabel: { attribute: 'page-label' , useDefault: true},
		statusLabel: { attribute: 'status-label' , useDefault: true},
		unknownStatusLabel: { attribute: 'unknown-status-label' , useDefault: true},
		directLabel: { attribute: 'direct-label' , useDefault: true},
		pageNumberLabel: { attribute: 'page-number-label' , useDefault: true},
		goLabel: { attribute: 'go-label' , useDefault: true},
		cancelLabel: { attribute: 'cancel-label' , useDefault: true},
	};
	static override styles = [foundationStyles, blockHostStyles, buttonStyles, paginationStyles];
	private readonly pageModel = createDraftModel('1');
	private readonly jumpEditing = new EditingController(this, {
		model: this.pageModel,
		control: () => this.shadowRoot?.querySelector<HTMLInputElement>('#page-number') ?? null,
		dispatchInput: false,
	});
	private readonly signalController = new SignalController(this, () => this.pageModel.view.get());
	private count = 1;
	private authorRevision = 0;
	private windowPage?: number;
	private focusFrame?: number;
	private jumpAbort?: AbortController;
	private jumpObserver?: ResizeObserver;
	private jumpFrame?: number;
	private jumpOrigin?: { x: number; y: number };
	private jumpTrigger?: HTMLButtonElement;
	private recoveryControl?: HTMLButtonElement | HTMLInputElement;

	/** One-based current page. Finite values are floored and bounded by known totals. @default 1 */
	get page(): number { return currentPage(Number(this.pageModel.value.get()), this.count); }
	set page(value: number) {
		++this.authorRevision;
		const previous = this.page;
		this.pageModel.setValue(String(normalizePage(value)));
		this.requestUpdate('page', previous);
	}
	/** Number of available pages; zero explicitly means unknown. @default 1 */
	get pageCount(): number { return this.count; }
	set pageCount(value: number) {
		++this.authorRevision;
		const previous = this.count;
		this.count = normalizePageCount(value);
		// Removing the chooser is an authoritative draft reset, before any user
		// transaction can stage a page during the queued render. Preserve the raw
		// accepted value until the completed property batch is normalized.
		if (!this.count) this.pageModel.setValue(this.pageModel.value.get());
		this.requestUpdate('pageCount', previous);
	}
	/** Enables Next when page-count is zero; ignored for known totals. @default false */
	declare hasNext: boolean;
	/** Disables all page actions. @default false */
	declare disabled: boolean;
	/** Accessible navigation label. @default "Pagination" */
	declare label: string;
	/** Localized Previous action accessible name; retain visible words when slotting text. @default "Previous page" */
	declare previousLabel: string;
	/** Localized Next action accessible name; retain visible words when slotting text. @default "Next page" */
	declare nextLabel: string;
	/** Numbered action name; substitutes {page} and {pages}. @default "Page {page}" */
	declare pageLabel: string;
	/** Known-total status; substitutes {page} and {pages}. @default "Page {page} of {pages}" */
	declare statusLabel: string;
	/** Unknown-total status; substitutes {page}. @default "Page {page}" */
	declare unknownStatusLabel: string;

	/** Accessible inline ellipsis action and direct-page popover name. @default "Choose a page" */
	declare directLabel: string;
	/** Direct-page numeric field label. @default "Page number" */
	declare pageNumberLabel: string;
	/** Direct-page action text. @default "Go to page" */
	declare goLabel: string;
	/** Direct-page dismissal text. @default "Cancel" */
	declare cancelLabel: string;

	constructor() {
		super();
		this.hasNext = false; this.disabled = false; this.label = 'Pagination';
		this.previousLabel = 'Previous page'; this.nextLabel = 'Next page';
		this.pageLabel = 'Page {page}'; this.statusLabel = 'Page {page} of {pages}';
		this.unknownStatusLabel = 'Page {page}';
		this.directLabel = 'Choose a page'; this.pageNumberLabel = 'Page number'; this.goLabel = 'Go to page'; this.cancelLabel = 'Cancel';
		this.addEventListener('focusin', this.trackFocus);
		this.addEventListener('focusout', this.deferFocusTracking);
	}
	private readonly positionJump = (): void => {
		const panel = this.renderRoot.querySelector<HTMLElement>('[popover]');
		const trigger = this.currentJumpTrigger();
		const view = this.ownerDocument.defaultView;
		if (!panel?.matches(':popover-open') || !trigger || !view) return;
		const viewport = view.visualViewport;
		const left = viewport?.offsetLeft ?? 0, top = viewport?.offsetTop ?? 0;
		const width = viewport?.width ?? view.innerWidth, height = viewport?.height ?? view.innerHeight;
		const anchor = trigger.getBoundingClientRect(), box = panel.getBoundingClientRect();
		const style = view.getComputedStyle(panel);
		const cssLeft = parseFloat(style.left), cssTop = parseFloat(style.top);
		const measured = { x: Number.isFinite(cssLeft) ? cssLeft - box.left : 0, y: Number.isFinite(cssTop) ? cssTop - box.top : 0 };
		// Match the established combobox/menu policy: measure the fixed top-layer
		// coordinate origin, rather than guessing which origin mobile Safari uses.
		if (!this.jumpOrigin || Math.abs(measured.x - this.jumpOrigin.x) > 0.5 || Math.abs(measured.y - this.jumpOrigin.y) > 0.5) this.jumpOrigin = measured;
		const origin = this.jumpOrigin;
		const clearance = parseFloat(style.rowGap) || 0;
		const maxWidth = `${Math.max(0, width - 2 * clearance)}px`;
		const maxHeight = `${Math.max(0, height - 2 * clearance)}px`;
		if (panel.style.maxWidth !== maxWidth || panel.style.maxHeight !== maxHeight) {
			panel.style.maxWidth = maxWidth; panel.style.maxHeight = maxHeight; this.scheduleJump();
		}
		const x = (style.direction === 'rtl' ? anchor.left : anchor.right - box.width) + origin.x;
		const below = anchor.bottom + origin.y + clearance;
		const y = below + box.height <= top + height - clearance ? below : anchor.top + origin.y - box.height - clearance;
		panel.style.left = `${Math.max(left + clearance, Math.min(x, left + width - box.width - clearance))}px`;
		panel.style.top = `${Math.max(top + clearance, Math.min(y, top + height - box.height - clearance))}px`;
	};
	private currentJumpTrigger(): HTMLButtonElement | undefined {
		if (this.jumpTrigger?.isConnected && this.jumpTrigger.getClientRects().length) return this.jumpTrigger;
		return Array.from(this.renderRoot.querySelectorAll<HTMLButtonElement>('[popovertarget]'))
			.find(button => !button.disabled && button.getClientRects().length > 0);
	}
	private readonly toggleJump = (event: Event): void => {
		// Preserve a retained focused gap through pointerdown/blur. Removing it
		// there would recenter the row underneath the pointer before click fires.
		if (event.type === 'pointerdown') this.renderRoot.querySelector('.en-pagination__gap-trigger:focus')?.setAttribute('data-jump-invoker', '');
		if (event.type === 'click') {
			for (const button of this.renderRoot.querySelectorAll('[data-jump-invoker]')) {
				if (button !== event.currentTarget) button.removeAttribute('data-jump-invoker');
			}
		}
		this.jumpTrigger = event.currentTarget as HTMLButtonElement;
		this.jumpTrigger.setAttribute('data-jump-invoker', '');
		// Retain the invoker before pointer focus moves (including Safari button clicks).
		// Native popovertarget owns opening; click also covers keyboard activation.
		const panel = this.renderRoot.querySelector<HTMLElement>('[popover]');
		if (!panel?.matches(':popover-open')) panel?.removeAttribute('data-positioned');
	};
	private readonly prepareJump = (event: Event): void => {
		if ((event as ToggleEvent).newState !== 'open') return;
		const panel = event.currentTarget as HTMLElement;
		panel.removeAttribute('data-positioned');
	};
	override performUpdate(): void {
		const firstUpdate = !this.hasUpdated;
		super.performUpdate();
		// The native toggle may already have finished before hydration attached
		// its listener. Adopt that still-open surface without opening it again.
		const panel = firstUpdate && this.hasUpdated && this.isConnected
			? this.renderRoot?.querySelector<HTMLElement>('[popover]:popover-open') : undefined;
		if (panel?.querySelector('.en-pagination__jump') && !panel.hasAttribute('data-positioned')) {
			const active = this.ownerDocument.activeElement;
			const innerActive = this.shadowRoot?.activeElement;
			const ownsFocus = !active || active === this.ownerDocument.body || active === this.ownerDocument.documentElement
				|| innerActive === panel.querySelector('input') || Boolean(innerActive?.matches('button[popovertarget="page-jump"]'));
			this.observeJump({ newState: 'open' } as ToggleEvent, ownsFocus);
		}
	}

	private readonly dismissJump = (event: KeyboardEvent): void => {
		if (event.key !== 'Escape' || event.defaultPrevented) return;
		const panel = this.renderRoot.querySelector<HTMLElement>('[popover]:popover-open');
		if (!panel) return;
		event.preventDefault(); event.stopPropagation();
		this.closeJump();
	};
	private readonly closeJump = (): void => {
		this.renderRoot.querySelector<HTMLElement>('[popover]:popover-open')?.hidePopover();
		this.currentJumpTrigger()?.focus({ preventScroll: true });
	};
	private readonly scheduleJump = (): void => {
		const view = this.ownerDocument.defaultView;
		if (!view || this.jumpFrame !== undefined) return;
		this.jumpFrame = view.requestAnimationFrame(() => { this.jumpFrame = undefined; this.positionJump(); });
	};
	private readonly observeJump = (event: Event, focus = true): void => {
		const open = (event as ToggleEvent).newState === 'open';
		const panel = this.renderRoot.querySelector<HTMLElement>('[popover]');
		const view = this.ownerDocument.defaultView;
		// Hydration may have initialized this opening before its queued native toggle.
		// A fresh beforetoggle clears the marker, including same-turn close/reopen.
		if (open && panel?.hasAttribute('data-positioned') && this.jumpAbort) { this.positionJump(); return; }
		this.jumpAbort?.abort(); this.jumpAbort = undefined;
		this.jumpObserver?.disconnect(); this.jumpObserver = undefined;
		if (this.jumpFrame !== undefined) view?.cancelAnimationFrame(this.jumpFrame);
		this.jumpFrame = undefined; this.jumpOrigin = undefined;
		if (!open || !view || !panel) { panel?.removeAttribute('data-positioned'); this.renderRoot.querySelectorAll('[data-jump-invoker]').forEach(button => button.removeAttribute('data-jump-invoker')); return; }
		this.jumpAbort = new view.AbortController();
		const options = { signal: this.jumpAbort.signal, passive: true };
		view.addEventListener('resize', this.scheduleJump, options);
		view.addEventListener('scroll', this.scheduleJump, { ...options, capture: true });
		let root = panel.getRootNode();
		while ('host' in root) {
			root.addEventListener('scroll', this.scheduleJump, { ...options, capture: true });
			root = (root as ShadowRoot).host.getRootNode();
		}
		view.visualViewport?.addEventListener('resize', this.scheduleJump, options);
		view.visualViewport?.addEventListener('scroll', this.scheduleJump, options);
		if (view.ResizeObserver) {
			this.jumpObserver = new view.ResizeObserver(this.scheduleJump);
			this.jumpObserver.observe(panel); this.jumpObserver.observe(this);
		}
		this.positionJump();
		panel.setAttribute('data-positioned', '');
		const input = panel.querySelector<HTMLInputElement>('input');
		if (focus && input && this.shadowRoot?.activeElement !== input) input.focus({ preventScroll: true });
	};
	private setPage(value: number): void {
		const previous = this.page;
		this.pageModel.stageValue(String(value));
		this.requestUpdate('page', previous);
	}
	private requestPage(value: number, reason: PaginationReason): boolean {
		if (!Number.isSafeInteger(value) || this.disabled || this.pageModel.isComposing.get() || value < 1 || value > Number.MAX_SAFE_INTEGER || (this.pageCount && value > this.pageCount)
			|| (reason === 'next' && !this.pageCount && !this.hasNext)) return false;
		const active = this.renderRoot.querySelector<HTMLButtonElement>('button:focus');
		const outcome = dispatchChange(this, {
			previous: this.page, proposed: value, reason,
			getRevision: () => this.authorRevision,
			stage: page => this.setPage(page), rollback: page => this.setPage(page),
			canCommit: page => !this.disabled && !this.pageModel.isComposing.get() && (!this.pageCount || page <= this.pageCount)
				&& (reason !== 'next' || Boolean(this.pageCount) || this.hasNext),
			commit: page => {
				this.pageModel.setValue(String(page));
				this.jumpEditing.sync();
				this.requestUpdate();
			},
		});
		if (active) this.recoveryControl = active;
		return outcome === 'committed' || outcome === 'unchanged';
	}
	private trackFocus = (): void => {
		const active = this.shadowRoot?.activeElement as HTMLElement | null;
		// Freeze the seven-cell window while a numbered action owns focus. Adding an
		// exceptional retained page would widen it and move Next. Status still shows actual page.
		const next = active?.hasAttribute('data-page') ? this.windowPage ?? this.page : undefined;
		if (next !== this.windowPage) { this.windowPage = next; this.requestUpdate(); }
	};
	private deferFocusTracking = (): void => {
		const view = this.ownerDocument.defaultView;
		if (!view || this.focusFrame !== undefined) return;
		// Keep the outgoing number through the native blur-to-next-focus step.
		this.focusFrame = view.requestAnimationFrame(() => { this.focusFrame = undefined; this.trackFocus(); });
	};
	protected override willUpdate(_changes: PropertyValues): void {
		// Normalize the completed property batch, so page/page-count assignment order is immaterial.
		const normalized = this.page;
		if (normalized !== Number(this.pageModel.value.get())) this.pageModel.setValue(String(normalized));
		// Reconcile the completed property batch, without replacing an active IME draft.
		this.jumpEditing.sync();
		const active = this.shadowRoot?.activeElement;
		if (active?.localName === 'input' && !this.pageCount) this.recoveryControl = active as HTMLInputElement;
		if (active?.localName === 'button') {
			const button = active as HTMLButtonElement;
			if (button.dataset.page && (!this.pageCount || Number(button.dataset.page) > this.pageCount)) this.recoveryControl = button;
		}
	}
	protected override updated(): void {
		if (this.disabled || !this.pageCount) {
			this.renderRoot.querySelector<HTMLElement>('[popover]:popover-open')?.hidePopover();
			this.observeJump({ newState: 'closed' } as ToggleEvent);
		}
		this.positionJump();
		const previous = this.recoveryControl; this.recoveryControl = undefined;
		if (!previous || (previous.isConnected && !previous.disabled) || this.disabled) return;
		const innerActive = this.shadowRoot?.activeElement;
		if (innerActive && innerActive !== previous) return;
		const active = this.ownerDocument.activeElement;
		if (active !== this && active !== this.ownerDocument.body && active !== this.ownerDocument.documentElement) return;
		const current = this.renderRoot.querySelector<HTMLElement>('button[aria-current="page"]')
			?? this.renderRoot.querySelector<HTMLElement>('button:not(:disabled)')
			?? this.renderRoot.querySelector<HTMLElement>('nav');
		current?.focus({ preventScroll: true });
	}
	override disconnectedCallback(): void {
		this.observeJump({ newState: 'closed' } as ToggleEvent);
		if (this.focusFrame !== undefined) this.ownerDocument.defaultView?.cancelAnimationFrame(this.focusFrame);
		this.focusFrame = undefined; this.windowPage = undefined; this.recoveryControl = undefined; this.jumpTrigger = undefined;
		super.disconnectedCallback();
	}
	protected override render() {
		return paginationTemplate({
			page: this.page, pageCount: this.pageCount, managedJumpValue: true, jumpDefaultValue: this.hasUpdated ? undefined : String(this.page), hasNext: this.hasNext, disabled: this.disabled,
			label: this.label, previousLabel: this.previousLabel, nextLabel: this.nextLabel,
			pageLabel: this.pageLabel, statusLabel: this.statusLabel, unknownStatusLabel: this.unknownStatusLabel,
			windowPage: this.windowPage, directLabel: this.directLabel, pageNumberLabel: this.pageNumberLabel, goLabel: this.goLabel, cancelLabel: this.cancelLabel,
		}, (page, reason) => this.requestPage(page, reason), this.toggleJump, this.observeJump, this.dismissJump, this.closeJump, this.prepareJump);
	}
}

declare global { interface HTMLElementTagNameMap { 'en-pagination': EnPagination; } }
