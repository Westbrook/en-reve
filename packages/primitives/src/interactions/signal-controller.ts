import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { reaction } from 'signal-utils/subtle/reaction';

/** Watches a pure snapshot only while its host is connected. Reading a snapshot never requires this controller. */
export class SignalController<T> implements ReactiveController {
  readonly #host: ReactiveControllerHost;
  readonly #read: () => T;
  #stop?: () => void;
  #generation = 0;
  #disposed = false;

  constructor(host: ReactiveControllerHost, readSnapshot: () => T) {
    this.#host = host;
    this.#read = readSnapshot;
    host.addController(this);
  }

  get snapshot(): T { return this.#read(); }

  hostConnected(): void {
    if (this.#disposed) return;
    this.#stop?.();
    const generation = ++this.#generation;
    this.#stop = reaction(this.#read, () => {
      if (!this.#disposed && generation === this.#generation) this.#host.requestUpdate();
    });
    this.#host.requestUpdate();
  }

  hostDisconnected(): void {
    ++this.#generation;
    this.#stop?.();
    this.#stop = undefined;
  }

  /** Permanently detach this controller. Ordinary DOM removal should use hostDisconnected. */
  dispose(): void {
    this.#disposed = true;
    this.hostDisconnected();
    this.#host.removeController(this);
  }
}
