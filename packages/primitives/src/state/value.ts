import { Signal } from 'signal-polyfill';

export interface ValueSnapshot<T> {
  readonly value: T;
  readonly revision: number;
}

export interface ValueModel<T> {
  readonly value: Signal.Computed<T>;
  readonly view: Signal.Computed<ValueSnapshot<T>>;
  set(value: T): boolean;
  reset(): boolean;
}

export interface ValueOptions<T> {
  equals?: (previous: T, next: T) => boolean;
  normalize?: (value: T) => T;
}

/** An explicit value and revision; neither the initial value nor later values are cloned. */
export function createValueModel<T>(initial: T, options: ValueOptions<T> = {}): ValueModel<T> {
  const normalize = options.normalize ?? ((value: T) => value);
  const equals = options.equals ?? Object.is;
  const defaultValue = normalize(initial);
  const state = new Signal.State<ValueSnapshot<T>>(Object.freeze({ value: defaultValue, revision: 0 }));
  const set = (value: T): boolean => {
    const next = normalize(value);
    const previous = state.get();
    if (equals(previous.value, next)) return false;
    state.set(Object.freeze({ value: next, revision: previous.revision + 1 }));
    return true;
  };
  return {
    value: new Signal.Computed(() => state.get().value),
    view: new Signal.Computed(() => state.get()),
    set,
    reset: () => set(defaultValue),
  };
}
