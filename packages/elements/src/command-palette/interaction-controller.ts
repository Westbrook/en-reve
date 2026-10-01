import { isDOMElement } from '../internal/dom-kind.js';
import type { CommandPaletteEvents } from './template.js';

export interface PaletteInteraction {
	input(): HTMLInputElement | null;
	open(): boolean;
	query(value: string): void;
	move(direction: 1 | -1): void;
	active(): string | undefined;
	execute(action: string): void;
}

/** Native editing and touch scrolling remain native; only explicit candidate activation is handled. */
export class CommandPaletteInteractionController implements CommandPaletteEvents {
	#composing = false;
	#resetPending = false;
	#gesture?: { id: number; x: number; y: number; action: string | undefined; moved: boolean };
	constructor(private readonly options: PaletteInteraction) {}
	get composing(): boolean { return this.#composing; }
	reset(): void {
		this.#gesture = undefined;
		if (this.#composing) { this.#resetPending = true; return; }
		const input = this.options.input();
		if (input) input.value = '';
		this.options.query('');
	}
	disconnect(): void {
		// A removed native editor may never dispatch compositionend. Reconcile
		// its retained text without inferring an application action or edit event.
		const composing = this.#composing;
		this.#composing = false;
		if (this.#resetPending) { this.#resetPending = false; this.reset(); }
		else if (composing) this.options.query(this.options.input()?.value ?? '');
		this.#gesture = undefined;
	}
	readonly input = (event: InputEvent): void => {
		if (event.isComposing) this.#composing = true;
		if (!this.#composing) this.options.query(this.options.input()?.value ?? '');
	};
	readonly compositionStart = (): void => { this.#composing = true; };
	readonly compositionEnd = (): void => {
		this.#composing = false;
		if (this.#resetPending) { this.#resetPending = false; this.reset(); }
		else this.options.query(this.options.input()?.value ?? '');
	};
	readonly keydown = (event: KeyboardEvent): void => {
		if (event.defaultPrevented || !this.options.open() || event.isComposing || this.#composing
			|| event.keyCode === 229 || event.altKey || event.ctrlKey || event.metaKey) return;
		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault(); this.options.move(event.key === 'ArrowDown' ? 1 : -1);
		} else if (event.key === 'Enter') {
			event.preventDefault();
			const action = this.options.active();
			if (action !== undefined && !event.repeat) this.options.execute(action);
		}
		// Escape belongs to native dialog cancellation. Home/End and editing shortcuts remain native.
	};
	readonly mousedown = (event: MouseEvent): void => { if (event.button === 0) event.preventDefault(); };
	readonly pointerDown = (event: PointerEvent): void => {
		if (!event.isPrimary || event.button !== 0) { this.#gesture = undefined; return; }
		const row = event.composedPath().find(node => isDOMElement(node) && node.hasAttribute('data-action')) as HTMLElement | undefined;
		this.#gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, action: row?.dataset.action, moved: false };
	};
	readonly pointerMove = (event: PointerEvent): void => {
		const gesture = this.#gesture;
		if (gesture?.id === event.pointerId && Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 8) gesture.moved = true;
	};
	readonly pointerCancel = (): void => { if (this.#gesture) this.#gesture.moved = true; };
	readonly scroll = (): void => { if (this.#gesture) this.#gesture.moved = true; };
	readonly click = (event: MouseEvent): void => {
		if (event.defaultPrevented || !this.options.open() || this.#composing) return;
		const row = event.currentTarget as HTMLElement;
		const action = row.dataset.action;
		const gesture = this.#gesture;
		this.#gesture = undefined;
		if (row.getAttribute('aria-disabled') === 'true' || action === undefined
			|| (event.detail !== 0 && gesture && (gesture.moved || gesture.action !== action))) return;
		this.options.execute(action);
	};
}
