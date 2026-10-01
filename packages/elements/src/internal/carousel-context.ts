import { createContext } from '@lit/context';
import { ContextProvider } from './context-provider.js';
import type { ReactiveControllerHost } from 'lit';

export type CarouselSlideContext = Readonly<{
  position: string;
  description: string;
  visible: boolean;
}> | null;

/** Presentation is per member; requesting the service does not admit a slide. */
export interface CarouselPresentationService {
  subscribe(slide: HTMLElement, receive: (context: CarouselSlideContext) => void): () => void;
}
export const carouselContext = createContext<CarouselPresentationService>('@en-reve/carousel-presentation/v1');

export class CarouselContextProvider {
  private values = new WeakMap<HTMLElement, CarouselSlideContext>();
  private receivers = new Map<HTMLElement, Set<(context: CarouselSlideContext) => void>>();
  private service: CarouselPresentationService = {
    subscribe: (slide, receive) => {
      let callbacks = this.receivers.get(slide);
      if (!callbacks) this.receivers.set(slide, callbacks = new Set());
      callbacks.add(receive);
      receive(this.values.get(slide) ?? null);
      return () => {
        callbacks.delete(receive);
        if (!callbacks.size && this.receivers.get(slide) === callbacks) this.receivers.delete(slide);
      };
    },
  };
  constructor(host: HTMLElement & ReactiveControllerHost) {
    new ContextProvider(host, { context: carouselContext, initialValue: this.service });
  }
  /** Only the owning carousel's existing slot/collection reconciliation calls this. */
  set(slide: HTMLElement, value: CarouselSlideContext): void {
    if (value) this.values.set(slide, Object.freeze(value));
    else this.values.delete(slide);
    for (const receive of [...(this.receivers.get(slide) ?? [])]) receive(value);
  }
}
