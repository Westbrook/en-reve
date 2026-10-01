import type { ReactiveController, ReactiveControllerHost } from 'lit';

/** Coalesced native visual-viewport bounds, active only while the modal is actually shown. */
export class CommandPaletteViewportController implements ReactiveController {
	#abort?: AbortController;
	#frame = 0;
	#view: Window | null = null;
	#surface: HTMLDialogElement | null = null;
	#geometry = '';
	constructor(private readonly host: ReactiveControllerHost & HTMLElement, private readonly surface: () => HTMLDialogElement | null) { host.addController(this); }
	hostUpdated(): void { this.sync(); }
	hostDisconnected(): void { this.stop(); }
	sync(): void {
		const surface = this.surface();
		if (!this.host.isConnected || !surface?.open) { this.stop(); return; }
		if (surface !== this.#surface) {
			this.stop(); this.#surface = surface; this.#view = this.host.ownerDocument.defaultView;
			const view = this.#view;
			if (!view) return;
			const Abort = this.host.ownerDocument.defaultView?.AbortController ?? globalThis.AbortController;
			const abort = new Abort();
			this.#abort = abort;
			const options = { signal: abort.signal, passive: true };
			view.addEventListener('resize', this.schedule, options);
			view.visualViewport?.addEventListener('resize', this.schedule, options);
			view.visualViewport?.addEventListener('scroll', this.schedule, options);
			this.position();
		}
	}
	private readonly schedule = (): void => {
		if (!this.#view || this.#frame) return;
		this.#frame = this.#view.requestAnimationFrame(() => { this.#frame = 0; this.position(); });
	};
	private position(): void {
		const view = this.#view; const surface = this.#surface;
		if (!view || !surface?.open || !this.host.isConnected) return;
		// These are already the viewport bounds in the fixed CSS coordinate plane.
		// Unlike an anchored popup, no getBoundingClientRect anchor participates:
		// adding its CSS/client-origin calibration here would double-count it.
		const viewport = view.visualViewport;
		const values = [viewport?.width ?? view.innerWidth, viewport?.height ?? view.innerHeight,
			viewport?.offsetTop ?? 0, viewport?.offsetLeft ?? 0];
		const geometry = values.join(':');
		if (geometry === this.#geometry) return;
		this.#geometry = geometry;
		['width', 'height', 'top', 'left'].forEach((name, index) => surface.style.setProperty(`--_en-command-viewport-${name}`, `${values[index]}px`));
	}
	private stop(): void {
		this.#abort?.abort(); this.#abort = undefined;
		if (this.#frame) this.#view?.cancelAnimationFrame(this.#frame);
		this.#frame = 0; this.#view = null; this.#surface = null; this.#geometry = '';
	}
}
