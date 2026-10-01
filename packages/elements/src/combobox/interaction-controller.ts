import type { ReactiveController, ReactiveControllerHost } from 'lit';

export interface InteractionOptions {
  input(): HTMLInputElement | null;
  disabled(): boolean;
  composing(): boolean;
  dirty(): boolean;
  open(): boolean;
  expanded(): boolean;
  active(): string | undefined;
  show(): void;
  exit(): void;
  move(direction: 1 | -1): void;
  choose(value: string): void;
}

/** Text stays in the native editor; this adapter owns only list navigation and dismissal. */
export class ComboboxInteractionController implements ReactiveController {
  private abort?: AbortController;
  constructor(private readonly host: ReactiveControllerHost & HTMLElement, private readonly options: InteractionOptions) { host.addController(this); }
  hostUpdated(): void { this.sync(); }
  hostDisconnected(): void { this.abort?.abort(); this.abort = undefined; }
  sync(): void {
    if (!this.options.open() || !this.host.isConnected) { this.hostDisconnected(); return; }
    if (this.abort) return;
    const Abort = this.host.ownerDocument.defaultView?.AbortController ?? globalThis.AbortController;
    this.abort = new Abort();
    // Each ancestor root sees the part of a composed path that closed roots hide
    // from its parent. Defer to that inner listener instead of misreading retargeting
    // as an outside click. This also supports nested closed ancestors.
    const roots: ShadowRoot[] = [];
    let root = this.host.getRootNode();
    while ('host' in root) { roots.push(root as ShadowRoot); root = (root as ShadowRoot).host.getRootNode(); }
    const surfaces: (ShadowRoot | Document)[] = [...roots, this.host.ownerDocument];
    surfaces.forEach((surface, index) => surface.addEventListener('pointerdown', ((event: PointerEvent) => {
      const path = event.composedPath();
      if (path.includes(this.host) || roots.slice(0, index).some(inner => path.includes(inner.host))) return;
      this.options.exit();
    }) as EventListener, { signal: this.abort!.signal, capture: true }));
  }
  readonly keydown = (event: KeyboardEvent): void => {
    if (event.defaultPrevented || this.options.disabled() || event.isComposing || this.options.composing()
      || event.keyCode === 229 || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!this.options.open()) this.options.show();
      this.options.move(event.key === 'ArrowDown' ? 1 : -1);
    } else if (event.key === 'Enter' && (this.options.open() || this.options.dirty())) {
      event.preventDefault();
      const active = this.options.active();
      if (this.options.open() && active !== undefined && !event.repeat) this.options.choose(active);
    } else if (event.key === 'Escape' && (this.options.open() || this.options.dirty())) {
      event.preventDefault(); this.options.exit();
    } else if (event.key === 'Tab') this.options.exit();
    // Home/End/Left/Right, text selection and editing shortcuts retain native behavior.
  };
  // Cancel the mouse default that moves focus, while leaving touch gestures
  // and their eventual click available. A canceled pointerdown can suppress
  // WebKit's touch click before an option has a chance to accept selection.
  readonly keepInputFocus = (event: MouseEvent): void => {
    if (event.button === 0) event.preventDefault();
  };
  readonly trigger = (): void => {
    if (this.options.disabled() || this.options.composing()) return;
    this.options.input()?.focus();
    // A temporarily unpainted popup still retains open intent. Match the
    // expanded state users can perceive: retry it without discarding the draft.
    if (this.options.expanded()) this.options.exit(); else this.options.show();
  };
  readonly optionClick = (event: MouseEvent): void => {
    if (event.defaultPrevented || this.options.disabled() || this.options.composing()) return;
    const option = event.currentTarget as HTMLElement;
    if (option.getAttribute('aria-disabled') === 'true') return;
    const value = option.dataset.value;
    if (value !== undefined) this.options.choose(value);
  };
  readonly focusout = (): void => {
    queueMicrotask(() => {
      if (!this.host.isConnected) return;
      const focused = this.host.shadowRoot?.activeElement;
      if (!focused) this.options.exit();
    });
  };
}
