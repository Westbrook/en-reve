import { isHTMLElement } from '../internal/dom-kind.js';
import type { PropertyValues } from 'lit';
import { Signal } from 'signal-polyfill';
import { EnElement } from '../internal/en-element.js';
import { foundationStyles, blockHostStyles } from '@en-reve/styles/foundations.js';
import { tableHostStyles } from '@en-reve/styles/table.js';
import { tableTemplate } from './template.js';

/**
 * An encapsulated scroll region around an authored native table.
 * Include tableStyles or table.css in the authored table's root for cell presentation.
 * Captions, headers, row order, sorting and native child interactions remain author-owned.
 * @tagname en-table
 * @slot - One complete native table with authored caption, row groups, headers and cells.
 * @csspart base - The bordered table surface.
 * @csspart viewport - The native overflow scroll region; focusable when content overflows.
 * @cssprop --en-table-background - Table surface fill.
 * @cssprop --en-table-color - Table text color.
 * @cssprop --en-table-border-color - Surface border and cell divider color.
 * @cssprop --en-table-header-background - Column header fill.
 * @cssprop --en-table-header-color - Column header text color.
 * @cssprop --en-table-footer-background - Sticky footer fill; defaults to the table surface.
 * @cssprop --en-table-footer-color - Sticky footer text color; defaults to table text.
 * @cssprop --en-table-row-selected-background - Persistent selected row fill.
 * @cssprop --en-table-row-selected-color - Selected row text.
 * @cssprop --en-table-row-selected-indicator-color - Logical-start selected row marker.
 * @cssprop --en-table-row-hover-background - Hovered data row fill.
 * @cssprop --en-table-cell-block-padding - Block cell inset; defaults to sized row spacing.
 * @cssprop --en-table-cell-inline-padding - Inline cell inset; defaults to sized control spacing.
 * @cssprop --en-table-radius - Scroll surface corner radius.
 */
export class EnTable extends EnElement {
	static override properties = {
		label: { type: String, useDefault: true },
		sticky: { type: String, reflect: true, useDefault: true },
		stickyCaption: { type: Boolean, attribute: 'sticky-caption', reflect: true },
		overflowing: { state: true },
	};
	static override styles = [foundationStyles, blockHostStyles, tableHostStyles];

	/** Accessible name of the scrolling region. Supply a contextual, localized name. */
	declare label: string;
	/** Sticky table regions. Headers remain visible by default; footers are opt-in. */
	declare sticky: 'header' | 'footer' | 'both' | 'none';
	/** Keep a top caption visible while scrolling. Defaults to false. */
	declare stickyCaption: boolean;
	private declare overflowing: boolean;
	private resizeObserver?: ResizeObserver;
	private resizeWindow?: Window;
	private contentObserver?: MutationObserver;
	private table?: HTMLTableElement;
	private readonly insets = new Signal.State<Readonly<{ blockStart: number; blockEnd: number }>>(Object.freeze({ blockStart: 0, blockEnd: 0 }));

	/** Measured space reserved for sticky regions, for scroll and virtualization controllers.
	 * Values are CSS pixels, stable through scrolling, and zero before browser measurement. */
	get scrollInsets(): Readonly<{ blockStart: number; blockEnd: number }> {
		return this.insets.get();
	}

	/**
	 * The native scrolling element for scroll controllers and virtualized content.
	 * Available after updateComplete in the browser; null before rendering or during SSR.
	 * Use this reference for scrolling/measurement, and the viewport CSS part for styling.
	 */
	get scrollElement(): HTMLElement | null {
		return this.renderRoot?.querySelector?.<HTMLElement>('.en-table__viewport') ?? null;
	}

	constructor() {
		super();
		this.label = 'Table';
		this.sticky = 'header';
		this.stickyCaption = false;
		// SSR cannot measure layout. Keep scrolling keyboard-reachable until the
		// browser determines whether the authored table fits its viewport.
		this.overflowing = true;
	}

	override connectedCallback(): void {
		super.connectedCallback();
		void this.updateComplete.then(() => {
			if (this.isConnected) this.observeContent();
		});
	}

	override disconnectedCallback(): void {
		this.stopObserving();
		super.disconnectedCallback();
	}

	protected override updated(changed: PropertyValues): void {
		if (changed.has('sticky') || changed.has('stickyCaption')) this.measure();
	}

	private stopObserving(): void {
		this.contentObserver?.disconnect();
		this.contentObserver = undefined;
		this.resizeObserver?.disconnect();
		this.resizeObserver = undefined;
		this.resizeWindow?.removeEventListener('resize', this.measure);
		this.resizeWindow = undefined;
	}

	private readonly measure = (): void => {
		const viewport = this.renderRoot.querySelector<HTMLElement>('.en-table__viewport');
		if (!this.isConnected || !viewport) return;
		const table = this.table;
		let header = this.sticky !== 'none' && this.sticky !== 'footer' ? table?.tHead?.getBoundingClientRect().height ?? 0 : 0;
		let footer = this.sticky === 'footer' || this.sticky === 'both' ? table?.tFoot?.getBoundingClientRect().height ?? 0 : 0;
		let caption = this.stickyCaption && table?.caption && this.ownerDocument.defaultView?.getComputedStyle(table.caption).captionSide !== 'bottom'
			? table.caption.getBoundingClientRect().height : 0;
		// Keep at least half of a small scrollport available to body content.
		// Preserve the requested API while allowing optional regions to scroll first.
		const budget = viewport.clientHeight / 2;
		if (budget > 0) {
			if (header + footer + caption > budget) caption = 0;
			if (header + footer > budget) footer = 0;
			if (header > budget) header = 0;
		}
		this.toggleAttribute('data-en-table-scroll-header', header === 0);
		this.toggleAttribute('data-en-table-scroll-footer', footer === 0);
		this.toggleAttribute('data-en-sticky-caption-ready', caption > 0);
		const previous = this.insets.get();
		if (previous.blockStart !== header + caption || previous.blockEnd !== footer) {
			this.insets.set(Object.freeze({ blockStart: header + caption, blockEnd: footer }));
		}
		for (const [name, value] of Object.entries({
			'--_en-table-sticky-caption-height': caption,
			'--_en-table-sticky-start': header + caption,
			'--_en-table-sticky-end': footer,
		})) {
			const next = `${value}px`;
			if (this.style.getPropertyValue(name) !== next) this.style.setProperty(name, next);
		}
		this.overflowing = viewport.scrollWidth > viewport.clientWidth + 1
			|| viewport.scrollHeight > viewport.clientHeight + 1;
	};

	private readonly observeContent = (): void => {
		this.stopObserving();
		const view = this.ownerDocument.defaultView;
		const viewport = this.renderRoot.querySelector<HTMLElement>('.en-table__viewport');
		if (!this.isConnected || !view || !viewport) return;
		const slot = this.renderRoot.querySelector<HTMLSlotElement>('slot');
		this.table = slot?.assignedElements({ flatten: true }).find((element) => element.localName === 'table') as HTMLTableElement | undefined;
		if (this.table) {
			// Observe only row-group replacement: virtualized tbody row churn is intentionally excluded.
			this.contentObserver = new view.MutationObserver(this.observeContent);
			this.contentObserver.observe(this.table, { childList: true });
		}
		if (typeof view.ResizeObserver === 'function') {
			this.resizeObserver = new view.ResizeObserver(this.measure);
			this.resizeObserver.observe(viewport);
			for (const element of [this.table, this.table?.tHead, this.table?.tFoot, this.table?.caption]) {
				if (element) this.resizeObserver.observe(element);
			}
		} else {
			this.resizeWindow = view;
			view.addEventListener('resize', this.measure);
		}
		this.measure();
	};

	private readonly revealFocus = (event: FocusEvent): void => {
		const viewport = this.scrollElement;
		const path = event.composedPath();
		const target = path.find((node): node is HTMLElement => isHTMLElement(node));
		const ownedTarget = path.find((node): node is HTMLElement => isHTMLElement(node) && Boolean(this.table?.contains(node)));
		if (!viewport || !target || !ownedTarget || ownedTarget.closest('thead, tfoot, caption')) return;
		const rect = target.getBoundingClientRect();
		const port = viewport.getBoundingClientRect();
		const style = this.ownerDocument.defaultView?.getComputedStyle(target);
		const before = Number.parseFloat(style?.scrollMarginBlockStart ?? '') || 0;
		const after = Number.parseFloat(style?.scrollMarginBlockEnd ?? '') || 0;
		const start = port.top + viewport.clientTop + this.insets.get().blockStart + before;
		const end = port.top + viewport.clientTop + viewport.clientHeight - this.insets.get().blockEnd - after;
		if (end <= start) return;
		if (rect.top < start) viewport.scrollTop -= start - rect.top;
		else if (rect.bottom > end) viewport.scrollTop += Math.min(rect.bottom - end, rect.top - start);
	};

	protected override render() {
		return tableTemplate({ label: this.label, overflowing: this.overflowing, onSlotChange: this.observeContent, onFocusIn: this.revealFocus });
	}
}

declare global {
	interface HTMLElementTagNameMap { 'en-table': EnTable; }
}
