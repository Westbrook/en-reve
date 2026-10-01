import { Signal } from 'signal-polyfill';
import { createValueModel } from './value.js';

export interface DisclosureSnapshot {
  readonly open: boolean;
  readonly revision: number;
}

export interface DisclosureModel {
  readonly open: Signal.Computed<boolean>;
  readonly view: Signal.Computed<DisclosureSnapshot>;
  setOpen(open: boolean): boolean;
  toggle(): boolean;
  reset(): boolean;
}

export function createDisclosureModel(initialOpen = false): DisclosureModel {
  const model = createValueModel(initialOpen);
  return {
    open: model.value,
    view: new Signal.Computed(() => {
      const { value: open, revision } = model.view.get();
      return Object.freeze({ open, revision });
    }),
    setOpen: model.set,
    toggle: () => model.set(!model.value.get()),
    reset: model.reset,
  };
}
