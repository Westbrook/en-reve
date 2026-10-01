import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { observeIdReference, referenceRoot } from '../internal/id-reference.js';
import type { ReferenceRoot } from '../internal/id-reference.js';

export type PickerHost = HTMLElement & ReactiveControllerHost & { for: string };
type PickerTrigger = HTMLElement & { disabled?: boolean; loading?: boolean };

export interface PickerOptions {
  disabled: () => boolean;
  activate: () => void;
}

/** External activation only; native picker UI and accepted color remain field-owned. */
export class ColorPickerController implements ReactiveController {
  readonly #host: PickerHost;
  readonly #options: PickerOptions;
  #root: ReferenceRoot | null = null;
  #id = '';
  #release: (() => void) | null = null;
  #trigger: PickerTrigger | null = null;

  constructor(host: PickerHost, options: PickerOptions) {
    this.#host = host;
    this.#options = options;
    host.addController(this);
  }

  hostConnected(): void { this.#observe(); }
  hostUpdated(): void { this.#observe(); }
  hostDisconnected(): void {
    this.#release?.();
    this.#release = null;
    this.#root = null;
    this.#id = '';
    this.#bind(null);
  }

  #observe(): void {
    if (!this.#host.isConnected) return;
    const root = referenceRoot(this.#host);
    const id = typeof this.#host.for === 'string' ? this.#host.for : '';
    if (this.#release && root === this.#root && id === this.#id) return;
    this.#release?.();
    this.#release = null;
    this.#root = root;
    this.#id = id;
    const release = observeIdReference(root, id, this.#bind);
    if (!this.#host.isConnected || referenceRoot(this.#host) !== root || this.#host.for !== id) release();
    else this.#release = release;
  }

  #bind = (element: Element | null): void => {
    const trigger = this.#host.isConnected && element?.namespaceURI === 'http://www.w3.org/1999/xhtml'
      && ['button', 'en-button', 'en-swatch'].includes(element.localName) ? element as PickerTrigger : null;
    if (trigger === this.#trigger) return;
    this.#trigger?.removeEventListener('click', this.#click);
    this.#trigger = trigger;
    trigger?.addEventListener('click', this.#click);
  };

  #click = (event: MouseEvent): void => {
    const trigger = this.#trigger;
    const root = referenceRoot(this.#host);
    if (event.defaultPrevented || !this.#host.isConnected || !trigger?.isConnected
      || this.#host.for !== this.#id || root !== this.#root || root?.getElementById(this.#id) !== trigger) return;
    // Swatch action cancellation reaches us through its original native click.
    // A bound native button must not submit even when its color field is disabled.
    event.preventDefault();
    if (trigger.disabled || trigger.loading || trigger.matches(':disabled, [aria-disabled="true"]')
      || this.#options.disabled()) return;
    this.#options.activate();
  };
}
