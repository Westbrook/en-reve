const isElementNode = (node: unknown): node is Element => !!node && (node as Node).nodeType === 1;
import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { reaction } from 'signal-utils/subtle/reaction';
import type { VirtualCollection } from '../state/virtual-collection.js';
import { beginScrollIntoView, normalizeScrollOptions } from './scroll-into-view.js';
import type { NormalizedScrollOptions, ScrollToKeyOptions } from './scroll-into-view.js';

export type { ScrollToKeyOptions } from './scroll-into-view.js';

interface RevealRequest {
	key: string;
	index: number;
	options: NormalizedScrollOptions;
	phase: 'prepare' | 'scrolling' | 'settle';
	attempts: number;
	cycles: number;
	pins: Set<string>;
	nativeSize?: number;
	needsCorrection: boolean;
	cleanup?: () => void;
	stopNative?: () => () => void;
}

interface VisibleAnchor { key: string; offset: number }

export interface VirtualCollectionControllerOptions {
	/** Explicit scrolling surface. Pass document.scrollingElement for document scrolling; otherwise use a public scrollElement API. */
	viewport: () => HTMLElement | null | undefined;
	/** The native ul/ol/tbody that contains the rows returned by the rendering adapter. */
	content: () => Element | null | undefined;
	/** Optional measured rows for a nested adapter. Each element measures one record, excluding descendant records. Defaults to direct content children. */
	rows?: () => Iterable<HTMLElement>;
	/** Map a focused semantic element to its measured row when hierarchy wrappers differ from row geometry. Return null for focus outside this collection. */
	rowFor?: (active: Element | null) => HTMLElement | null;
	/** Disable browser windowing for a separate paginated/full-content reading mode. */
	enabled?: () => boolean;
	/** Space obscured by a sticky header inside the scrollport. */
	occludedBlockStart?: () => number;
	/** Space obscured by a sticky footer inside the scrollport. */
	occludedBlockEnd?: () => number;
	/** Focusable recovery target; defaults to the content in document mode, otherwise the viewport. */
	focusTarget?: () => HTMLElement | null | undefined;
	/** Application-owned recovery when a focused record is removed; receives the resolved recovery target. */
	onFocusedItemRemoved?: (key: string, viewport: HTMLElement) => void;
}

/**
 * Browser lifecycle for a pure range model. Construction and initial rendering are SSR safe.
 * Rows are measured only while mounted. Work is scheduled by changes, never an idle frame loop.
 */
export class VirtualCollectionController<T> implements ReactiveController {
	readonly #host: HTMLElement & ReactiveControllerHost;
	readonly #options: VirtualCollectionControllerOptions;
	readonly model: VirtualCollection<T>;
	#connected = false;
	#viewport: HTMLElement | null = null;
	#content: Element | null = null;
	#window: Window | null = null;
	#scrollTarget: HTMLElement | Document | null = null;
	#anchorActive = false;
	#observer?: ResizeObserver;
	#layoutObserver?: ResizeObserver;
	#layoutMutation?: MutationObserver;
	#focusTarget?: HTMLElement;
	#addedTabIndex = false;
	#stop?: () => void;
	#frame = 0;
	#rows = new Map<string, HTMLElement>();
	#measurements = new Map<string, number>();
	#unmeasuredRows = new Set<string>();
	#pins = new Map<string, number>();
	#focusedKey?: string;
	#focusPins = new Set<string>();
	#focusBeforeUpdate?: HTMLElement;
	#focusTransitionPending = false;
	#width = 0;
	#lastAnchor?: number;
	#lastOrigin?: number;
	#userScrolled = false;
	#expectedScrollTop?: number;
	#pendingAnchor?: number;
	#anchorStyle?: { value: string; priority: string };
	#invalidated = false;
	#scrollRequest?: RevealRequest;
	#stopCorrection?: { frame: number; cleanup: () => void; anchor?: VisibleAnchor };
	#interruptedAnchor?: VisibleAnchor;

	constructor(host: HTMLElement & ReactiveControllerHost, model: VirtualCollection<T>, options: VirtualCollectionControllerOptions) {
		this.#host = host;
		this.model = model;
		this.#options = options;
		host.addController(this);
	}

	hostConnected(): void {
		this.#connected = true;
		this.#stop?.();
		this.#stop = reaction(() => [
			this.model.revision.get(),
			this.#options.occludedBlockStart?.() ?? 0,
			this.#options.occludedBlockEnd?.() ?? 0,
		], () => {
			if (!this.#connected) return;
			this.#host.requestUpdate();
			this.#schedule();
		});
	}

	hostUpdated(): void {
		if (!this.#connected) return;
		this.#connect();
		this.#restoreMovedFocus();
		this.#syncRows();
		this.#applyPendingAnchor();
		this.#schedule();
	}

	hostUpdate(): void {
		const active = this.#activeElement();
		this.#focusBeforeUpdate = this.#connected && this.#focusedKey !== undefined
			&& this.model.indexOf(this.#focusedKey) >= 0 && active && this.#rowFor(active)
			? active as HTMLElement : undefined;
	}

	hostDisconnected(): void {
		this.#connected = false;
		this.#finishReveal(true, false);
		this.#discardStopCorrection();
		this.#stop?.();
		this.#stop = undefined;
		this.#disconnect();
	}

	/** Re-resolve roots after a child finishes rendering, or after an authoritative data change. */
	refresh(): void {
		if (!this.#connected) return;
		this.#host.requestUpdate();
		this.#schedule();
	}

	/** Invalidate unseen geometry after font, theme, density or other presentation changes. */
	invalidateMeasurements(): void {
		// A new presentation change owns the currently visible anchor. Do not
		// continue aligning an earlier reveal against the previous geometry.
		// The authored style may already be applied when its observer calls us.
		// Preserve the model's preceding geometry instead of capturing that new
		// DOM position as though it were an intentional scrolling interruption.
		// Preparation has not moved the scrollport yet. A pending observer
		// notification must remeasure that destination, not silently discard a
		// reveal requested after the presentation change was already applied.
		if (this.#scrollRequest?.phase !== 'prepare') this.#finishReveal(true, true, false);
		this.#invalidated = true;
		this.#schedule();
	}

	/** Keep an editing row or overlay trigger mounted independently of keyboard focus. Leases are counted. */
	pin(key: string): void {
		this.#pins.set(key, (this.#pins.get(key) ?? 0) + 1);
		this.model.pin(key);
	}

	unpin(key: string): void {
		const count = this.#pins.get(key) ?? 0;
		if (count > 1) this.#pins.set(key, count - 1);
		else {
			this.#pins.delete(key);
			if (!this.#focusPins.has(key)) this.model.unpin(key);
		}
	}

	/** Reveal an application-selected record without moving focus or changing selection. */
	scrollToKey(key: string, options: ScrollToKeyOptions = {}): boolean {
		const normalized = normalizeScrollOptions(options);
		if (this.model.indexOf(key) < 0) return false;
		this.#finishReveal(true);
		// A new reveal supersedes scrolling already applied before this call.
		// A queued notification for that same position must not cancel it.
		this.#expectedScrollTop = this.#scrollOffset;
		const request: RevealRequest = {
			key, index: this.model.indexOf(key), options: normalized, phase: 'prepare', attempts: 0, cycles: 0,
			pins: new Set(), needsCorrection: false,
		};
		this.#scrollRequest = request;
		this.#pinRevealNeighborhood(request);
		this.#host.requestUpdate();
		this.#schedule();
		return true;
	}

	#connect(): void {
		const enabled = this.#options.enabled?.() !== false;
		const viewport = enabled ? this.#options.viewport() ?? null : null;
		const content = enabled ? this.#options.content() ?? null : null;
		if (viewport === this.#viewport && content === this.#content) return;
		if (this.#viewport) { this.#finishReveal(true, false); this.#discardStopCorrection(); }
		this.#disconnect();
		if (!viewport || !content) return;
		this.#viewport = viewport;
		this.#content = content;
		this.#window = viewport.ownerDocument.defaultView;
		this.#anchorStyle = { value: viewport.style.getPropertyValue('overflow-anchor'), priority: viewport.style.getPropertyPriority('overflow-anchor') };
		viewport.style.setProperty('overflow-anchor', 'none');
		this.#focusTarget = this.#options.focusTarget?.() ?? (this.#documentViewport ? content as HTMLElement : viewport);
		if(this.#documentViewport && !this.#focusTarget.hasAttribute('tabindex')){this.#focusTarget.setAttribute('tabindex','-1');this.#addedTabIndex=true;}
		this.#scrollTarget = this.#documentViewport ? viewport.ownerDocument : viewport;
		this.#scrollTarget.addEventListener('scroll', this.#scroll, { passive: true });
		viewport.addEventListener('wheel', this.#cancelReveal, { passive: true });
		viewport.addEventListener('touchstart', this.#cancelReveal, { passive: true });
		viewport.addEventListener('pointerdown', this.#cancelReveal, { passive: true });
		viewport.addEventListener('keydown', this.#cancelReveal);
		content.addEventListener('focusin', this.#focusin);
		// Capture precedes a target blur listener that may synchronously ask its
		// Lit host to render, before the later bubbling focusout event arrives.
		content.addEventListener('blur', this.#focusout, true);
		content.addEventListener('focusout', this.#focusout);
		this.#window?.addEventListener('resize', this.#resize, { passive: true });
		const Observer = this.#window && (this.#window as Window & typeof globalThis).ResizeObserver;
		if (Observer) {
			this.#observer = new Observer(entries => {
				for (const entry of entries) {
					const key = entry.target.getAttribute('data-en-virtual-key');
					if (key !== null && this.#rows.get(key) === entry.target) {
						const border = entry.borderBoxSize?.[0];
						this.#measurements.set(key, border?.blockSize ?? entry.target.getBoundingClientRect().height);
					}
				}
				this.#schedule();
			});
			this.#observer.observe(viewport);
			this.#observer.observe(content);
			if(this.#documentViewport){
				this.#layoutObserver=new Observer(()=>this.#schedule());
				const observeLayout=()=>{
					this.#layoutObserver?.disconnect();this.#layoutMutation?.disconnect();
					let element:Element|null=content;
					while(element){
						this.#layoutObserver?.observe(element);
						for(let sibling=element.previousElementSibling;sibling;sibling=sibling.previousElementSibling)this.#layoutObserver?.observe(sibling);
						const parent:Element|undefined|null=element.parentElement??(element.getRootNode() as ShadowRoot).host;
						if(parent)this.#layoutMutation?.observe(parent,{childList:true});
						element=parent??null;
					}
				};
				this.#layoutMutation=new MutationObserver(()=>{observeLayout();this.#schedule();});observeLayout();
			}
		}
		this.#lastAnchor = undefined;
		this.#lastOrigin = undefined;
		this.#width = 0;
	}

	#disconnect(): void {
		if (this.#frame) this.#window?.cancelAnimationFrame(this.#frame);
		this.#frame = 0;
		this.#observer?.disconnect();
		this.#observer = undefined;
		this.#layoutObserver?.disconnect();this.#layoutObserver=undefined;
		this.#layoutMutation?.disconnect();this.#layoutMutation=undefined;
		if(this.#addedTabIndex && this.#focusTarget?.getAttribute('tabindex')==='-1')this.#focusTarget.removeAttribute('tabindex');
		this.#focusTarget=undefined;this.#addedTabIndex=false;
		this.#anchorActive=false;
		this.#scrollTarget?.removeEventListener('scroll', this.#scroll);
		this.#scrollTarget = null;
		this.#viewport?.removeEventListener('wheel', this.#cancelReveal);
		this.#viewport?.removeEventListener('touchstart', this.#cancelReveal);
		this.#viewport?.removeEventListener('pointerdown', this.#cancelReveal);
		this.#viewport?.removeEventListener('keydown', this.#cancelReveal);
		this.#content?.removeEventListener('focusin', this.#focusin);
		this.#content?.removeEventListener('blur', this.#focusout, true);
		this.#content?.removeEventListener('focusout', this.#focusout);
		this.#window?.removeEventListener('resize', this.#resize);
		if (this.#viewport && this.#anchorStyle) {
			if (this.#anchorStyle.value) this.#viewport.style.setProperty('overflow-anchor', this.#anchorStyle.value, this.#anchorStyle.priority);
			else this.#viewport.style.removeProperty('overflow-anchor');
		}
		for (const key of this.#focusPins) if (!this.#pins.has(key)) this.model.unpin(key);
		this.#focusPins.clear();
		this.#focusedKey = undefined;
		this.#focusBeforeUpdate = undefined;
		this.#focusTransitionPending = false;
		this.#rows.clear();
		this.#measurements.clear();
		this.#unmeasuredRows.clear();
		this.#viewport = null;
		this.#content = null;
		this.#window = null;
		this.#anchorStyle = undefined;
		this.#lastAnchor = undefined;
		this.#lastOrigin = undefined;
		this.#userScrolled = false;
		this.#expectedScrollTop = undefined;
		this.#pendingAnchor = undefined;
		this.#anchorActive = false;
	}

	#syncRows(): void {
		if (!this.#content) return;
		const next = new Map<string, HTMLElement>();
		for (const element of this.#options.rows?.() ?? this.#content.children) {
			if (!this.#content.contains(element)) continue;
			const key = element.getAttribute('data-en-virtual-key');
			if (key !== null) next.set(key, element as HTMLElement);
		}
		for (const [key, row] of this.#rows) {
			if (next.get(key) !== row) {
				this.#observer?.unobserve(row);
				this.#measurements.delete(key);
				this.#unmeasuredRows.delete(key);
			}
		}
		for (const [key, row] of next) {
			if (this.#rows.get(key) !== row) {
				this.#observer?.observe(row, { box: 'border-box' });
				this.#unmeasuredRows.add(key);
			}
		}
		this.#rows = next;
		if (this.#focusedKey !== undefined && this.model.indexOf(this.#focusedKey) < 0) {
			const removed = this.#focusedKey;
			this.#setFocusedKey(undefined);
			if(this.#focusTarget){
				if(this.#options.onFocusedItemRemoved)this.#options.onFocusedItemRemoved(removed,this.#focusTarget);
				else if(this.#documentViewport)this.#focusTarget.focus({preventScroll:true});
			}
		}
		this.#syncFocus();
	}

	#schedule(): void {
		if (!this.#connected || this.#frame) return;
		const view = this.#window ?? this.#host.ownerDocument?.defaultView;
		if (view) this.#frame = view.requestAnimationFrame(this.#flush);
	}

	#flush = (): void => {
		this.#frame = 0;
		if (!this.#connected) return;
		if (this.#stopCorrection) return;
		this.#focusTransitionPending = false;
		// Resolve child-owned viewports once more after the parent's first update.
		this.#connect();
		this.#syncRows();
		const viewport = this.#viewport;
		const content = this.#content;
		if (!viewport || !content || this.#viewportHeight === 0) return;
		const rect = content.getBoundingClientRect();
		const viewportRect = this.#viewportBounds();
		const origin = rect.top - viewportRect.top - this.#viewportBorder + this.#scrollOffset;
		const inset = Math.max(0, this.#options.occludedBlockStart?.() ?? 0);
		const visibleOrigin = origin - inset;
		const endInset = Math.max(0, this.#options.occludedBlockEnd?.() ?? 0);
		const height = Math.max(0, this.#viewportHeight - inset - endInset);
		if (this.#scrollRequest && this.model.indexOf(this.#scrollRequest.key) !== this.#scrollRequest.index) this.#finishReveal(true);
		const nativeScrolling = this.#scrollRequest?.phase === 'scrolling';
		if (nativeScrolling) {
			// Follow the native animation's real position. Changing scrollTop or
			// measured prefix geometry here would interrupt its captured target.
			this.#userScrolled = false;
			const offset=this.#scrollOffset-origin+inset;
			this.#anchorActive=offset>=0&&offset<this.model.totalSize;
			this.model.setViewport(Math.max(0, this.#scrollOffset - origin + inset), height);
			this.#lastAnchor = this.model.anchorOffset;
			this.#lastOrigin = visibleOrigin;
			return;
		}
		const widthChanged = this.#width > 0 && Math.abs(this.#width - rect.width) > 0.5;
		this.#width = rect.width;
		this.#applyPendingAnchor();
		// Header/padding geometry can move the collection's origin without a
		// scroll input. Preserve the old visible record's pixel position before
		// translating the scrollport into collection coordinates.
		if ((!this.#documentViewport || this.#anchorActive) && !this.#userScrolled && this.#lastOrigin !== undefined && Math.abs(visibleOrigin - this.#lastOrigin) > 0.5) {
			this.#writeScroll(Math.max(0, this.#scrollOffset + visibleOrigin - this.#lastOrigin));
		}
		// setItems()/measurements preserve a key anchor in the pure model. Apply that
		// correction before accepting a new viewport; genuine scroll input takes priority.
		if ((!this.#documentViewport || this.#anchorActive) && !this.#userScrolled && this.#lastAnchor !== undefined && this.model.anchorOffset !== this.#lastAnchor) {
			this.#writeScroll(Math.max(0, origin + this.model.anchorOffset - inset));
		}
		this.#userScrolled = false;
		this.model.setViewport(this.#pendingAnchor ?? Math.max(0, this.#scrollOffset - origin + inset), height);
		const collectionOffset = this.#scrollOffset - origin + inset;
		this.#anchorActive = collectionOffset >= 0 && collectionOffset < this.model.totalSize;
		const beforeMeasurement = this.model.anchorOffset;
		let presentationAnchor: VisibleAnchor | undefined;
		if (widthChanged || this.#invalidated) {
			// Resetting measurements can temporarily make the current row shorter
			// than its visible inset. Preserve its identity across that estimate
			// and the following mounted measurement batch as one geometry change.
			const entry = this.model.entries.find(entry => entry.kind === 'item'
				&& entry.offset <= beforeMeasurement && entry.offset + entry.size > beforeMeasurement);
			if (entry?.kind === 'item') presentationAnchor = { key: entry.key, offset: entry.offset - beforeMeasurement };
			this.model.invalidateMeasurements();
			this.#invalidated = false;
			for (const [key, row] of this.#rows) this.#measurements.set(key, row.getBoundingClientRect().height);
		}
		// hostUpdated runs before generated Lit children finish their own update.
		// Measuring there can collapse a new row to padding alone and clamp an
		// instant reveal's native offset. Read new rows at this frame boundary,
		// after child microtasks, including when ResizeObserver is unavailable.
		for (const key of this.#unmeasuredRows) {
			const row = this.#rows.get(key);
			if (row) this.#measurements.set(key, row.getBoundingClientRect().height);
		}
		this.#unmeasuredRows.clear();
		const measurementChanged = this.model.measureMany([...this.#measurements].filter(([, size]) => size > 0));
		this.#measurements.clear();
		if (presentationAnchor) {
			const index = this.model.indexOf(presentationAnchor.key);
			if (index >= 0) this.model.setViewport(this.model.offsetOf(index)
				+ Math.min(-presentationAnchor.offset, this.model.sizeOf(index)), height);
		}
		const interrupted = this.#interruptedAnchor;
		if (interrupted) {
			this.#interruptedAnchor = undefined;
			const index = this.model.indexOf(interrupted.key);
			if (index >= 0) {
				this.model.setViewport(Math.max(0, this.model.offsetOf(index) - interrupted.offset), height);
				this.#pendingAnchor = this.model.anchorOffset;
				this.#host.requestUpdate();
			}
			this.unpin(interrupted.key);
		}
		if ((!this.#documentViewport || this.#anchorActive) && this.model.anchorOffset !== beforeMeasurement && this.#scrollRequest?.phase !== 'settle') {
			// A larger total extent is not in the DOM until Lit commits the new
			// spacers. Retry then; writing only now can clamp against the old extent.
			this.#pendingAnchor = this.model.anchorOffset;
			this.#host.requestUpdate();
		}
		const request = this.#scrollRequest;
		if (request) {
			this.#advanceReveal(request, measurementChanged);
		}
		this.#lastAnchor = this.model.anchorOffset;
		this.#lastOrigin = visibleOrigin;
	};

	#pinRevealNeighborhood(request: RevealRequest): void {
		const index = this.model.indexOf(request.key);
		if (index < 0) return;
		const span = this.#viewportHeight || 384;
		const retain = (position: number): void => {
			const key = this.model.keyAt(position);
			if (key === undefined || request.pins.has(key)) return;
			request.pins.add(key);
			this.pin(key);
		};
		retain(index);
		// Measure a destination-sized neighborhood before native scrolling. This
		// avoids first jumping to an estimated range just to discover its rows.
		for (const direction of [-1, 1]) {
			let size = 0;
			for (let position = index + direction; position >= 0 && position < this.model.count && size < span; position += direction) {
				retain(position);
				size += this.model.sizeOf(position);
			}
		}
	}

	#advanceReveal(request: RevealRequest, measurementChanged: boolean): void {
		if (this.#scrollRequest !== request || !this.#viewport) return;
		if (this.model.indexOf(request.key) < 0) { this.#finishReveal(true); return; }
		const row = this.#rows.get(request.key);
		if (request.phase === 'settle') {
			request.needsCorrection ||= measurementChanged || this.model.totalSize !== request.nativeSize;
			if (!request.needsCorrection || request.cycles >= 3) { this.#finishReveal(false); return; }
		}
		if (row && ((!measurementChanged && this.#pendingAnchor === undefined) || request.attempts >= 6)) {
			this.#startNativeReveal(request, row);
		} else {
			request.attempts++;
			this.#host.requestUpdate();
			this.#schedule();
		}
	}

	#startNativeReveal(request: RevealRequest, row: HTMLElement): void {
		const viewport = this.#viewport;
		const view = this.#window;
		if (!viewport || !view || this.#scrollRequest !== request) return;
		request.cleanup?.();
		request.phase = 'scrolling';
		request.cycles++;
		request.attempts = 0;
		request.needsCorrection = false;
		request.nativeSize = this.model.totalSize;
		this.#pendingAnchor = undefined;
		this.#expectedScrollTop = undefined;
		const operation = beginScrollIntoView(row, request.options, {
			viewport,
			blockStart: Math.max(0, this.#options.occludedBlockStart?.() ?? 0),
			blockEnd: Math.max(0, this.#options.occludedBlockEnd?.() ?? 0),
		});
		request.stopNative = operation.stop;
		let timer = 0;
		const complete = (): void => {
			if (this.#scrollRequest !== request) return;
			request.cleanup?.();
			request.cleanup = undefined;
			request.stopNative = undefined;
			const target = this.#rows.get(request.key);
			const bounds = this.#viewportBounds();
			const position = target?.getBoundingClientRect();
			// A programmatic scroll that interrupts native motion far from the
			// target owns that new position too; do not restart an old reveal.
			if (!position || position.bottom < bounds.top - bounds.height || position.top > bounds.bottom + bounds.height) {
				this.#finishReveal(false);
				return;
			}
			request.phase = 'settle';
			request.attempts = 0;
			this.#host.requestUpdate();
			this.#schedule();
		};
		const defer = (delay: number): void => {
			view.clearTimeout(timer);
			timer = view.setTimeout(complete, delay);
		};
		const onScroll = (): void => { defer(120); };
		const onEnd = (): void => { defer(32); };
		for (const target of operation.events) {
			target.addEventListener('scroll', onScroll, { passive: true });
			target.addEventListener('scrollend', onEnd, { passive: true });
		}
		const document = viewport.ownerDocument;
		for (const type of ['wheel', 'touchstart', 'pointerdown', 'keydown']) document.addEventListener(type, this.#cancelReveal, { capture: true, passive: true });
		request.cleanup = () => {
			view.clearTimeout(timer);
			for (const target of operation.events) {
				target.removeEventListener('scroll', onScroll);
				target.removeEventListener('scrollend', onEnd);
			}
			for (const type of ['wheel', 'touchstart', 'pointerdown', 'keydown']) document.removeEventListener(type, this.#cancelReveal, true);
		};
		// A no-op or instant native scroll need not emit a new scroll event.
		// The fallback is reset by actual progress and never drives an idle RAF.
		if(request.options.behavior==='instant'){
			const inset=Math.max(0,this.#options.occludedBlockStart?.()??0);
			const origin=this.#content!.getBoundingClientRect().top-this.#viewportBounds().top-this.#viewportBorder+this.#scrollOffset;
			const offset=this.#scrollOffset-origin+inset;
			this.model.setViewport(Math.max(0,offset),Math.max(0,this.#viewportHeight-inset-Math.max(0,this.#options.occludedBlockEnd?.()??0)));
			this.#anchorActive=offset>=0&&offset<this.model.totalSize;
			this.#lastAnchor=this.model.anchorOffset;this.#lastOrigin=origin-inset;
			this.#expectedScrollTop=this.#scrollOffset;this.#userScrolled=false;complete();
		}else defer(120);
	}

	#finishReveal(stop: boolean, restorePosition = true, captureAnchor = true): void {
		const request = this.#scrollRequest;
		if (!request) return;
		this.#scrollRequest = undefined;
		request.cleanup?.();
		if (stop && request.stopNative) {
			const anchor = restorePosition && captureAnchor ? this.#captureVisibleAnchor() : undefined;
			const finishStop = request.stopNative();
			// An interrupted native animation can queue a final scroll event.
			// Attribute that position to our stop, not to a user superseding the
			// newer request that may be created before the event is delivered.
			this.#expectedScrollTop = this.#scrollOffset;
			if (restorePosition) this.#completeNativeStop(finishStop, anchor);
		}
		for (const key of request.pins) this.unpin(key);
	}

	#captureVisibleAnchor(): VisibleAnchor | undefined {
		if (!this.#viewport) return undefined;
		const bounds = this.#viewportBounds();
		const top = bounds.top + this.#viewportBorder + Math.max(0, this.#options.occludedBlockStart?.() ?? 0);
		for (const [key, row] of this.#rows) {
			const rect = row.getBoundingClientRect();
			if (rect.bottom > top && rect.top < bounds.bottom) return { key, offset: rect.top - top };
		}
		// A compositor scroll can advance before its main-thread scroll event
		// publishes the next range. An input event in that interval still owns
		// a precise position; retain its logical key instead of adopting the
		// first row that happens to mount during cancellation/measurement.
		if (this.#content && this.model.count > 0) {
			const origin = this.#content.getBoundingClientRect().top - bounds.top - this.#viewportBorder + this.#scrollOffset;
			const offset = Math.max(0, this.#scrollOffset - origin + Math.max(0, this.#options.occludedBlockStart?.() ?? 0));
			let low = 0;
			let high = this.model.count;
			while (low < high) {
				const middle = Math.floor((low + high) / 2);
				if (this.model.offsetOf(middle + 1) <= offset) low = middle + 1;
				else high = middle;
			}
			const index = Math.min(low, this.model.count - 1);
			const key = this.model.keyAt(index);
			if (key !== undefined) return { key, offset: this.model.offsetOf(index) - offset };
		}
		return undefined;
	}

	#completeNativeStop(finishStop: () => void, anchor?: VisibleAnchor): void {
		const view = this.#window;
		if (!view || !this.#connected) return;
		this.#discardStopCorrection();
		if (anchor) this.pin(anchor.key);
		const document = this.#host.ownerDocument;
		const onInput = (event: Event): void => { if (this.#isScrollingInput(event)) this.#cancelReveal(event); };
		for (const type of ['wheel', 'touchstart', 'pointerdown', 'keydown']) document.addEventListener(type, onInput, { capture: true, passive: true });
		const correction = {
			frame: 0, anchor,
			cleanup: () => { for (const type of ['wheel', 'touchstart', 'pointerdown', 'keydown']) document.removeEventListener(type, onInput, true); },
		};
		this.#stopCorrection = correction;
		correction.frame = view.requestAnimationFrame(() => {
			if (this.#stopCorrection !== correction || !this.#connected) return;
			// Some engines publish one queued compositor position after a
			// synchronous stop. Complete the stop at a frame boundary, unless
			// subsequent scrolling input has already taken ownership.
			finishStop();
			this.#expectedScrollTop = this.#scrollOffset;
			this.#userScrolled = false;
			this.#stopCorrection = undefined;
			correction.cleanup();
			this.#interruptedAnchor = anchor;
			this.#schedule();
		});
	}

	#discardStopCorrection(): void {
		const correction = this.#stopCorrection;
		this.#stopCorrection = undefined;
		if (correction) {
			this.#window?.cancelAnimationFrame(correction.frame);
			correction.cleanup();
			if (correction.anchor) this.unpin(correction.anchor.key);
		}
		if (this.#interruptedAnchor) { this.unpin(this.#interruptedAnchor.key); this.#interruptedAnchor = undefined; }
	}

	#isScrollingInput(event: Event): boolean {
		return event.type !== 'keydown' || ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Tab'].includes((event as KeyboardEvent).key);
	}

	/** Root element bounds move with the document; the actual scrollport stays at (0, 0). */
	get #documentViewport(): boolean { return !!this.#viewport && this.#viewport === this.#viewport.ownerDocument.scrollingElement; }
	get #scrollOffset(): number { return this.#documentViewport ? this.#window?.scrollY ?? 0 : this.#viewport?.scrollTop ?? 0; }
	get #viewportHeight(): number { return this.#documentViewport ? this.#viewport!.ownerDocument.documentElement.clientHeight : this.#viewport?.clientHeight ?? 0; }
	get #viewportBorder(): number { return this.#documentViewport ? 0 : this.#viewport?.clientTop ?? 0; }
	#viewportBounds(): {top: number; bottom: number; height: number} {
		return this.#documentViewport ? {top: 0, bottom: this.#viewportHeight, height: this.#viewportHeight} : this.#viewport!.getBoundingClientRect();
	}

	#writeScroll(value: number): void {
		if (!this.#viewport) return;
		if (this.#documentViewport) this.#window?.scrollTo({ top: value, behavior: 'instant' });
		else this.#viewport.scrollTo({ top: value, behavior: 'instant' });
		this.#expectedScrollTop = this.#scrollOffset;
	}

	#applyPendingAnchor(): void {
		if (this.#pendingAnchor === undefined || !this.#viewport || !this.#content || this.#userScrolled || this.#stopCorrection || this.#scrollRequest?.phase === 'scrolling') return;
		const origin = this.#content.getBoundingClientRect().top - this.#viewportBounds().top - this.#viewportBorder + this.#scrollOffset;
		const target = Math.max(0, origin + this.#pendingAnchor - Math.max(0, this.#options.occludedBlockStart?.() ?? 0));
		this.#writeScroll(target);
		if (Math.abs(this.#scrollOffset - target) < 1) this.#pendingAnchor = undefined;
	}

	#scroll = (): void => {
		if (this.#stopCorrection) return;
		const actual = this.#scrollOffset;
		if (actual !== undefined && (this.#expectedScrollTop === undefined || Math.abs(actual - this.#expectedScrollTop) > 1)) {
			this.#userScrolled = true;
			this.#pendingAnchor = undefined;
			if (this.#scrollRequest?.phase !== 'scrolling') this.#finishReveal(false);
			this.#expectedScrollTop = undefined;
		}
		if (this.#scrollRequest?.phase === 'scrolling' && this.#viewport && this.#content) {
			// Scroll events precede the frame's animation callbacks. Updating only
			// in a requested frame leaves fast native animation one entire window
			// behind; a distant reveal can cross thousands of rows in that frame.
			// Publish the bounded visible range now so Lit commits in the event's
			// microtask checkpoint, without changing native scroll or measurements.
			const origin = this.#content.getBoundingClientRect().top - this.#viewportBounds().top - this.#viewportBorder + this.#scrollOffset;
			const start = Math.max(0, this.#options.occludedBlockStart?.() ?? 0);
			const end = Math.max(0, this.#options.occludedBlockEnd?.() ?? 0);
			this.model.setViewport(Math.max(0, this.#scrollOffset - origin + start), Math.max(0, this.#viewportHeight - start - end));
			this.#host.requestUpdate();
		}
		this.#schedule();
	};
	#cancelReveal = (event: Event): void => {
		const scrollingInput = this.#isScrollingInput(event);
		if (scrollingInput) this.#discardStopCorrection();
		this.#finishReveal(true, !scrollingInput);
	};
	#resize = (): void => { this.#schedule(); };
	#focusin = (event: Event): void => {
		this.#focusTransitionPending = false;
		const origin = event.composedPath()[0];
		const row = this.#options.rowFor
			? this.#rowFor(isElementNode(origin) ? origin : null)
			: event.composedPath().find(node => isElementNode(node) && node.parentElement === this.#content && node.hasAttribute('data-en-virtual-key')) as HTMLElement | undefined;
		this.#setFocusedKey(row?.getAttribute('data-en-virtual-key') ?? undefined);
	};
	#focusout = (): void => {
		// Native sequential focus can run a microtask checkpoint between blur
		// and focusing its next candidate. Releasing pins there removes that
		// candidate mid-Tab. Focusin transfers ownership synchronously; a dirty
		// frame reconciles a completed blur when focus moved out of the content.
		this.#focusTransitionPending = true;
		this.#schedule();
	};

	#syncFocus(): void {
		const active = this.#activeElement();
		const document = this.#host.ownerDocument;
		// A consumer may render in a blur listener. Its intervening hostUpdated
		// must not release the next native Tab candidate during fallback focus.
		if (this.#focusTransitionPending && (active === null || active === document.body || active === document.documentElement)) return;
		const row = this.#rowFor(active);
		this.#setFocusedKey(row?.getAttribute('data-en-virtual-key') ?? undefined);
	}

	#activeElement(): Element | null {
		let active: Element | null = this.#host.ownerDocument.activeElement;
		while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
		return active;
	}

	#rowFor(active: Element | null): Element | null {
		if (this.#options.rowFor) {
			const row = this.#options.rowFor(active);
			return row && this.#content?.contains(row) && row.hasAttribute('data-en-virtual-key') ? row : null;
		}
		let row = active;
		while (row && row.parentElement !== this.#content) {
			const root = row.getRootNode();
			row = row.assignedSlot ?? row.parentElement ?? (root.nodeType === 11 ? (root as ShadowRoot).host : null);
		}
		return row;
	}

	#restoreMovedFocus(): void {
		const previous = this.#focusBeforeUpdate;
		this.#focusBeforeUpdate = undefined;
		if (!previous?.isConnected || !this.#rowFor(previous) || !this.#host.ownerDocument.hasFocus()) return;
		const active = this.#activeElement();
		const document = this.#host.ownerDocument;
		// Keyed moves may preserve the node but blur its native descendant. Only
		// recover browser fallback focus; an author-selected destination wins.
		if (active === null || active === document.body || active === document.documentElement) previous.focus({ preventScroll: true });
	}

	#setFocusedKey(key?: string): void {
		this.#focusedKey = key;
		const next = new Set<string>();
		if (key !== undefined) {
			const index = this.model.indexOf(key);
			// Keep the adjacent records available for native Tab/Shift+Tab even
			// when the focused row is far outside the scrolling window.
			for (let neighbor = index - 1; index >= 0 && neighbor <= index + 1; neighbor++) {
				const adjacent = this.model.keyAt(neighbor);
				if (adjacent !== undefined) next.add(adjacent);
			}
		}
		for (const pin of next) if (!this.#focusPins.has(pin)) this.model.pin(pin);
		for (const pin of this.#focusPins) if (!next.has(pin) && !this.#pins.has(pin)) this.model.unpin(pin);
		this.#focusPins = next;
	}
}
