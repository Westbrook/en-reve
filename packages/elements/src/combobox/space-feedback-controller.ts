import type { ReactiveController, ReactiveControllerHost } from 'lit';

export type SpaceState = 'clear' | 'pending' | 'no-room';
export interface SpaceFeedbackOptions {
  enabled(): boolean;
  composing(): boolean;
  region(): HTMLElement | null;
}

/** Delayed presentation feedback only; never changes popup geometry, focus or value. */
export class ComboboxSpaceFeedbackController implements ReactiveController {
  private connected = false;
  private state: SpaceState = 'clear';
  private shown = false;
  private timer?: number;
  private timerView?: Window;
  private generation = 0;
  private reserved = 0;
  private region: HTMLElement | null = null;

  constructor(private readonly host: ReactiveControllerHost & HTMLElement, private readonly options: SpaceFeedbackOptions) { host.addController(this); }
  get visible(): boolean { return this.shown; }
  hostConnected(): void { this.connected = true; }
  hostDisconnected(): void { this.connected = false; this.reset(); }
  hostUpdated(): void { this.sync(); }

  update(state: SpaceState): void { this.state = state; this.sync(); }
  sync(): void {
    if (!this.connected || !this.options.enabled()) { this.reset(); return; }
    // Preserve the first displayed footprint until this open session ends. In a
    // centered layout, removing it could move the editor back out of usable room.
    const region = this.options.region();
    if (region !== this.region) {
      this.region?.style.removeProperty('--_en-combobox-space-reserve');
      this.region = region;
    }
    if (region && this.shown) {
      const height = region.getBoundingClientRect().height;
      if (height > this.reserved) this.reserved = height;
    }
    if (region && this.reserved > 0) {
      const value = `${this.reserved}px`;
      if (region.style.getPropertyValue('--_en-combobox-space-reserve') !== value) region.style.setProperty('--_en-combobox-space-reserve', value);
    }
    if (this.state === 'clear') { this.cancelTimer(); this.show(false); return; }
    // Do not remove an existing message for a one-frame width/height remeasure.
    if (this.state === 'pending') { this.cancelTimer(); return; }
    if (this.shown) return;
    // A new live announcement waits until composition has ended, followed by a
    // fresh quiet period. An already displayed message stays stable during IME.
    if (this.options.composing()) { this.cancelTimer(); return; }
    if (this.timer !== undefined) return;
    const view = this.host.ownerDocument.defaultView;
    if (!view) return;
    const generation = this.generation;
    this.timerView = view;
    this.timer = view.setTimeout(() => {
      this.timer = undefined; this.timerView = undefined;
      if (generation !== this.generation || !this.connected || !this.options.enabled() || this.state !== 'no-room' || this.options.composing()) return;
      this.show(true);
    }, 700);
  }
  reset(): void {
    this.state = 'clear'; this.cancelTimer(); this.show(false);
    this.region?.style.removeProperty('--_en-combobox-space-reserve');
    this.region = null; this.reserved = 0;
  }
  private show(value: boolean): void {
    if (this.shown === value) return;
    this.shown = value; this.host.requestUpdate();
  }
  private cancelTimer(): void {
    ++this.generation;
    if (this.timer !== undefined) this.timerView?.clearTimeout(this.timer);
    this.timer = undefined; this.timerView = undefined;
  }
}
