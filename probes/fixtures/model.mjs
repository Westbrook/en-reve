import { Signal } from 'signal-polyfill';
export function createModel(initial = 0) {
  const count = new Signal.State(initial);
  const view = new Signal.Computed(() => ({ count: count.get(), doubled: count.get() * 2 }));
  return { count, view };
}
