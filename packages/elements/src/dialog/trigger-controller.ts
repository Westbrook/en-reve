import { admitOverlayClick, eligibleOverlayTrigger } from '../internal/overlay-trigger.js';
import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { observeIdReference, referenceRoot, type ReferenceRoot } from '../internal/id-reference.js';

type Trigger = HTMLElement & { disabled?: boolean; loading?: boolean };
export interface TriggerOptions { id(): string; open(): boolean; activate(trigger: HTMLElement, valid: () => boolean): void; }

/** External same-tree reference and owned ARIA restoration; no cross-root IDREF is invented. */
export class ModalTriggerController implements ReactiveController {
	#root: ReferenceRoot | null = null;
	#id = '';
	#release?: () => void;
	#trigger: Trigger | null = null;
	#original: Record<string, string | null> = {};
	#written: Record<string, string> = {};
	constructor(private readonly host: ReactiveControllerHost & HTMLElement, private readonly options: TriggerOptions) { host.addController(this); }
	hostConnected(): void { this.hostUpdated(); }
	hostUpdated(): void {
		if (!this.host.isConnected) return;
		const root = referenceRoot(this.host);
		const id = typeof this.options.id() === 'string' ? this.options.id() : '';
		if (!this.#release || root !== this.#root || id !== this.#id) {
			this.#release?.(); this.#release = undefined; this.#root = root; this.#id = id;
			this.#release = observeIdReference(root, id, this.accept);
		}
		this.sync();
	}
	hostDisconnected(): void { this.#release?.(); this.#release = undefined; this.#root = null; this.#id = ''; this.detach(); }
	private readonly accept = (element: Element | null): void => {
		const trigger = this.host.isConnected && element?.namespaceURI === 'http://www.w3.org/1999/xhtml'
			&& (element.localName === 'button' || element.localName === 'en-button') ? element as Trigger : null;
		if (trigger === this.#trigger) return;
		this.detach(); this.#trigger = trigger;
		if (!trigger) return;
		this.#original = Object.fromEntries(['aria-haspopup', 'aria-expanded'].map(name => [name, trigger.getAttribute(name)]));
		trigger.addEventListener('click', this.click); this.sync();
	};
	private readonly click = (event: MouseEvent): void => {
		const trigger = this.#trigger;
		const valid = (): boolean => Boolean(this.host.isConnected && trigger?.isConnected
			&& trigger === this.#trigger && this.options.id() === this.#id
			&& referenceRoot(this.host) === this.#root && this.#root?.getElementById(this.#id) === trigger
			&& eligibleOverlayTrigger(this.host, this.#id, trigger));
		if (!trigger || !admitOverlayClick(event, valid())) return;
		// A valid associated button is an opener, including inside a form.
		// Cancel en-change to intercept the modal default independently of click listener order.
		this.options.activate(trigger, valid);
	};
	private sync(): void {
		if (!this.#trigger) return;
		for (const [name, value] of Object.entries({ 'aria-haspopup': 'dialog', 'aria-expanded': String(this.options.open()) })) {
			if (this.#trigger.getAttribute(name) !== value) this.#trigger.setAttribute(name, value);
			this.#written[name] = value;
		}
	}
	private detach(): void {
		const trigger = this.#trigger;
		if (trigger) {
			trigger.removeEventListener('click', this.click);
			for (const [name, value] of Object.entries(this.#original)) {
				if (trigger.getAttribute(name) !== this.#written[name]) continue;
				if (value === null) trigger.removeAttribute(name); else trigger.setAttribute(name, value);
			}
		}
		this.#trigger = null; this.#original = {}; this.#written = {};
	}
}
