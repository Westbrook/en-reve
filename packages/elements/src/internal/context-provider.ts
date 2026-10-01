import { ContextProvider as LitContextProvider, type Context, type ContextType } from '@lit/context';
import type { ReactiveControllerHost } from 'lit';

/** Lit 1.1.x uses stopPropagation; the current protocol requires immediate stop. */
export class ContextProvider<C extends Context<unknown, unknown>> extends LitContextProvider<C> {
  private installed = false;
  constructor(host: HTMLElement & Partial<ReactiveControllerHost>, options: { context: C; initialValue?: ContextType<C> }) {
    super(host, options);
    const provide = this.onContextRequest;
    host.removeEventListener('context-request', provide);
    this.onContextRequest = event => {
      const requester = event.contextTarget ?? event.composedPath()[0];
      if (event.context === options.context && requester !== host) event.stopImmediatePropagation();
      provide(event);
    };
    host.addEventListener('context-request', this.onContextRequest);
    this.installed = true;
    if (host.isConnected) super.hostConnected();
  }
  /** A connected host may invoke this during super(); announce only after wrapping. */
  override hostConnected(): void { if (this.installed) super.hostConnected(); }
}
