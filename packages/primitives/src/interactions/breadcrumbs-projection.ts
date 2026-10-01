import type { ReactiveController, ReactiveControllerHost } from 'lit';

/** Private SSR projection metadata; consumers author only native light-DOM children. */
export const BREADCRUMBS_PLAN_ATTRIBUTE = 'data-en-breadcrumbs-plan';
export const BREADCRUMBS_SLOT_PREFIX = 'en-crumb-';

export interface BreadcrumbsProjectionPlan {
	readonly version: 1;
	readonly keys: readonly string[];
	readonly hiddenKeys: readonly string[];
}

export interface BreadcrumbsProjectionEntry {
	readonly key: string;
	readonly hidden: boolean;
	readonly separator: boolean;
}

export interface BreadcrumbsProjectionView {
	readonly entries: readonly BreadcrumbsProjectionEntry[];
	readonly error: string;
}

type ProjectionHost = HTMLElement & ReactiveControllerHost;
const projections = new WeakMap<object, BreadcrumbsProjectionController>();

/**
 * SSR integration hook. The host keeps no public plan/count method or property.
 * Prepare the controller before rendering the same canonical shadow template.
 */
export function prepareBreadcrumbsProjection(host: object, keys: readonly string[], hiddenKeys: readonly string[] = []): void {
	const projection = projections.get(host);
	if (!projection) throw new TypeError('The element has no breadcrumb projection controller.');
	projection.prepareSSR(keys, hiddenKeys);
}

/**
 * Project original native children into stable ordered-list wrappers. Named SSR
 * roots retain their mode; newly created roots use manual assignment. This
 * controller owns neither native link state nor child content, focus or routing.
 */
export class BreadcrumbsProjectionController implements ReactiveController {
	readonly #host: ProjectionHost;
	readonly #keys = new WeakMap<Element, string>();
	readonly #ownedSlots = new Map<Element, string>();
	#plan: readonly string[] = [];
	#hidden: readonly boolean[] = [];
	#error = '';
	#sequence = 0;
	#recovered = false;
	#hasRendered = false;
	#childrenObserver?: MutationObserver;
	#attributesObserver?: MutationObserver;

	constructor(host: ProjectionHost) {
		this.#host = host;
		if (projections.has(host)) throw new TypeError('Only one breadcrumb projection controller can own a host.');
		projections.set(host, this);
		host.addController(this);
	}

	get view(): BreadcrumbsProjectionView {
		let precedingVisible = false;
		const entries = this.#plan.map((key, index) => {
			const hidden = this.#hidden[index] ?? false;
			const separator = !hidden && precedingVisible;
			if (!hidden) precedingVisible = true;
			return { key, hidden, separator };
		});
		return { entries, error: this.#error };
	}

	/** Internal preparation seam used by the shared SSR hook, never authored as element data. */
	prepareSSR(keys: readonly string[], hiddenKeys: readonly string[] = []): void {
		if (!Array.isArray(keys) || keys.some(key => typeof key !== 'string' || !key)
			|| new Set(keys).size !== keys.length) throw new TypeError('Invalid breadcrumb SSR projection plan.');
		if (!Array.isArray(hiddenKeys) || hiddenKeys.some(key => !keys.includes(key)) || new Set(hiddenKeys).size !== hiddenKeys.length) {
			throw new TypeError('Invalid breadcrumb SSR visibility plan.');
		}
		this.#plan = [...keys];
		this.#hidden = keys.map(key => hiddenKeys.includes(key));
		this.#host.requestUpdate();
	}

	hostConnected(): void {
		// Lit calls this synchronously before its first update/hydration. Keep the
		// exact SSR plan until hostUpdated, even if authored children changed early.
		this.#recoverSSRPlan();
		const Observer = this.#host.ownerDocument.defaultView?.MutationObserver;
		if (!Observer) return;
		this.#childrenObserver ??= new Observer(() => this.#reconcile());
		this.#childrenObserver.observe(this.#host, { childList: true });
		this.#attributesObserver ??= new Observer(() => this.#reconcile());
		if (this.#hasRendered) this.#reconcile();
	}

	hostUpdated(): void {
		this.#hasRendered = true;
		this.#reconcile();
	}

	hostDisconnected(): void {
		this.#childrenObserver?.disconnect();
		this.#attributesObserver?.disconnect();
		for (const [node, value] of this.#ownedSlots) {
			if (node.getAttribute('slot') === value) node.removeAttribute('slot');
		}
		this.#ownedSlots.clear();
	}

	#recoverSSRPlan(): void {
		if (this.#recovered) return;
		this.#recovered = true;
		const serialized = this.#host.getAttribute(BREADCRUMBS_PLAN_ATTRIBUTE);
		if (serialized === null) return;
		let plan: unknown;
		try { plan = JSON.parse(serialized); } catch { throw new TypeError('Invalid breadcrumb SSR projection metadata.'); }
		if (!plan || typeof plan !== 'object') throw new TypeError('Invalid breadcrumb SSR projection metadata.');
		const candidate = plan as Partial<BreadcrumbsProjectionPlan>;
		if (candidate.version !== 1 || !Array.isArray(candidate.keys)
			|| candidate.keys.some((key, index) => key !== `ssr-${index}`)) {
			throw new TypeError('Invalid breadcrumb SSR projection metadata.');
		}
		this.prepareSSR(candidate.keys, candidate.hiddenKeys);
		const available = new Set(candidate.keys);
		for (const node of this.#host.children) {
			const value = node.getAttribute('slot');
			if (!value?.startsWith(BREADCRUMBS_SLOT_PREFIX)) continue;
			const key = value.slice(BREADCRUMBS_SLOT_PREFIX.length);
			if (!available.delete(key)) throw new TypeError('Invalid or repeated breadcrumb SSR assignment.');
			this.#keys.set(node, key);
			this.#ownedSlots.set(node, value);
		}
	}

	#readChildren(): Element[] {
		for (const node of this.#host.childNodes) {
			if (node.nodeType === 3 && [...(node.textContent ?? '')].some(character => ![9, 10, 12, 13, 32].includes(character.charCodeAt(0)))) {
				throw new TypeError('Breadcrumb direct text must be inside an a or span child.');
			}
		}
		const nodes = [...this.#host.children];
		for (const node of nodes) {
			if (node.namespaceURI !== 'http://www.w3.org/1999/xhtml' || !['a', 'span'].includes(node.localName)) {
				throw new TypeError('Breadcrumbs require direct native a or noninteractive span children.');
			}
			if (node.getAttribute('hidden')?.toLowerCase() === 'until-found') {
				throw new TypeError('hidden=until-found is not supported by breadcrumb projection.');
			}
		}
		return nodes;
	}

	#observeAttributes(nodes: readonly Element[]): void {
		this.#attributesObserver?.disconnect();
		for (const node of nodes) this.#attributesObserver?.observe(node, { attributes: true, attributeFilter: ['slot', 'hidden'] });
	}

	#setError(error: string): void {
		if (error === this.#error) return;
		this.#error = error;
		this.#host.requestUpdate();
	}

	#reconcile(): void {
		const host = this.#host;
		if (!this.#hasRendered || !host.isConnected || !host.shadowRoot) return;
		this.#observeAttributes([...host.children]);
		try {
			const nodes = this.#readChildren();
			const claimed = new Set<string>();
			const pairs = nodes.map(node => {
				let key = this.#keys.get(node);
				const slot = node.getAttribute('slot');
				if (this.#ownedSlots.has(node) && slot !== this.#ownedSlots.get(node)) {
					throw new TypeError('The slot attribute is owned by breadcrumb projection; do not remove or replace it.');
				}
				if (slot !== null && (!key || slot !== `${BREADCRUMBS_SLOT_PREFIX}${key}`)) {
					throw new TypeError('The slot attribute is reserved for breadcrumb projection; author no slot attribute.');
				}
				key ??= `client-${++this.#sequence}`;
				if (claimed.has(key)) throw new TypeError('Duplicate breadcrumb projection assignment.');
				claimed.add(key);
				this.#keys.set(node, key);
				return { node, key, hidden: node.hasAttribute('hidden') };
			});
			this.#setError('');
			for (const [node, value] of this.#ownedSlots) {
				if (!nodes.includes(node)) {
					if (node.getAttribute('slot') === value) node.removeAttribute('slot');
					this.#ownedSlots.delete(node);
				}
			}
			const next = pairs.map(({ key }) => key);
			const hidden = pairs.map(pair => pair.hidden);
			if (hidden.length !== this.#hidden.length || hidden.some((value, index) => value !== this.#hidden[index])) {
				this.#hidden = hidden;
				host.requestUpdate();
			}
			if (next.length !== this.#plan.length || next.some((key, index) => key !== this.#plan[index])) {
				this.#plan = next;
				host.requestUpdate();
				return;
			}
			const slots = new Map([...host.shadowRoot.querySelectorAll<HTMLSlotElement>('slot[data-projection-key]')]
				.map(slot => [slot.dataset.projectionKey, slot]));
			for (const { node, key } of pairs) {
				const slot = slots.get(key);
				if (!slot) continue;
				if (host.shadowRoot.slotAssignment === 'manual') {
					const assigned = slot.assignedNodes();
					if (assigned.length !== 1 || assigned[0] !== node) slot.assign(node);
				} else {
					const value = `${BREADCRUMBS_SLOT_PREFIX}${key}`;
					if (node.getAttribute('slot') !== value) node.setAttribute('slot', value);
					this.#ownedSlots.set(node, value);
				}
			}
		} catch (error) {
			// A visible diagnostic must not become a loop fighting author attributes.
			this.#setError(error instanceof Error ? error.message : String(error));
		}
	}
}
