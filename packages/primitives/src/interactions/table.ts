import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { reaction } from 'signal-utils/subtle/reaction';
import { beginScrollIntoView, normalizeScrollOptions } from './scroll-into-view.js';
import type { TableModel } from '../state/table.js';
import { VirtualCollectionController, type ScrollToKeyOptions, type VirtualCollectionControllerOptions } from './virtual-collection.js';

export interface TableSurface extends HTMLElement {
	readonly scrollElement: HTMLElement | null;
	readonly scrollInsets: Readonly<{ blockStart: number; blockEnd: number }>;
	readonly updateComplete?: Promise<unknown>;
}
export interface TableControllerOptions {
	table: () => TableSurface | null | undefined;
	/** Optional alternative presentation roots for a table/list switch sharing this collection. */
	viewport?: VirtualCollectionControllerOptions['viewport'];
	content?: VirtualCollectionControllerOptions['content'];
	onFocusedItemRemoved?: VirtualCollectionControllerOptions['onFocusedItemRemoved'];
}
/** Bind native authored table geometry through the public shell API, including sticky insets. */
export class TableController<T> implements ReactiveController {
	readonly virtual: VirtualCollectionController<T>;
	#stop?: () => void;
	#surface?: TableSurface | null;
	#reveal = 0;
	#themeObserver?: MutationObserver;
	#fontCleanup?: () => void;
	constructor(private host: HTMLElement & ReactiveControllerHost, readonly model: TableModel<T>, private options: TableControllerOptions) {
		this.virtual = new VirtualCollectionController(host, model.collection, {
			viewport: options.viewport ?? (() => options.table()?.scrollElement),
			content: options.content ?? (() => options.table()?.querySelector('tbody')),
			enabled: () => (model.mode === 'windowed' || model.mode === 'virtual'),
			occludedBlockStart: () => options.table()?.scrollInsets?.blockStart ?? 0,
			occludedBlockEnd: () => options.table()?.scrollInsets?.blockEnd ?? 0,
			onFocusedItemRemoved: options.onFocusedItemRemoved,
		});
		host.addController(this);
	}
	hostConnected(): void {
		this.#stop = reaction(() => this.model.revision.get(), () => this.host.requestUpdate());
		const view = this.host.ownerDocument.defaultView;
		if (!view) return;
		const invalidate = () => this.invalidateMeasurements();
		this.#themeObserver = new view.MutationObserver(records => {
			if (records.some(record => record.type === 'attributes'
				|| (record.target as Element).localName === 'style'
				|| record.target.parentElement?.localName === 'style'
				|| [...record.addedNodes, ...record.removedNodes].some(node => node.nodeType === 1 && ['style', 'link'].includes((node as Element).localName)))) invalidate();
		});
		// Only inherited boundaries and stylesheet content; never the row subtree.
		let boundary: Element | null = this.host;
		while (boundary) {
			this.#themeObserver.observe(boundary, { attributes: true });
			const root = boundary.getRootNode() as ShadowRoot;
			boundary = boundary.parentElement ?? root.host ?? null;
		}
		if (this.host.ownerDocument.head) this.#themeObserver.observe(this.host.ownerDocument.head, { childList: true, subtree: true, characterData: true });
		this.host.ownerDocument.fonts?.addEventListener('loadingdone', invalidate);
		this.#fontCleanup = () => this.host.ownerDocument.fonts?.removeEventListener('loadingdone', invalidate);
	}
	hostDisconnected(): void { this.#themeObserver?.disconnect(); this.#fontCleanup?.(); this.#stop?.(); this.#stop = undefined; this.#surface = undefined; this.#reveal++; }
	hostUpdated(): void {
		const surface = this.options.table();
		if (surface === this.#surface) return;
		this.#surface = surface;
		// Lit child upgrades finish after the parent's first update; bind its public viewport then.
		if (surface) void surface.updateComplete?.then(() => { if (this.host.isConnected && surface === this.#surface) this.virtual.refresh(); });
	}
	refresh(): void { this.virtual.refresh(); }
	invalidateMeasurements(): void { this.virtual.invalidateMeasurements(); }
	pin(key: string): void { this.virtual.pin(key); }
	unpin(key: string): void { this.virtual.unpin(key); }
	scrollToKey(key: string, options: ScrollToKeyOptions = {}): boolean {
		const index = this.model.indexOf(key);
		if (index < 0) return false;
		const request = ++this.#reveal;
		if (this.model.mode !== 'windowed' && this.model.mode !== 'virtual') {
			const normalized = normalizeScrollOptions(options);
			if (this.model.mode === 'paginated') this.model.setPage(Math.floor(index / this.model.pageSize));
			this.host.requestUpdate();
			void this.host.updateComplete.then(async () => {
				const surface = this.options.table();
				await surface?.updateComplete;
				if (!this.host.isConnected || request !== this.#reveal) return;
				const content = this.options.content?.() ?? surface?.querySelector('tbody');
				const row = [...content?.querySelectorAll<HTMLElement>('[data-record]') ?? []].find(row => row.dataset.record === key);
				const viewport = this.options.viewport?.() ?? surface?.scrollElement;
				if (row) beginScrollIntoView(row, normalized, viewport ? { viewport, blockStart: surface?.scrollInsets?.blockStart ?? 0, blockEnd: surface?.scrollInsets?.blockEnd ?? 0 } : undefined);
			});
			return true;
		}
		return this.virtual.scrollToKey(key, options);
	}
}
