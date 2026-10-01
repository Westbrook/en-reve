import { Signal } from 'signal-polyfill';
import { createValueModel } from './value.js';

export type SelectionKey = string | number;
export interface SelectionSnapshot<Key extends SelectionKey> {
  readonly selected: readonly Key[];
  readonly revision: number;
}

export interface SelectionModel<Key extends SelectionKey> {
  readonly selected: Signal.Computed<readonly Key[]>;
  readonly view: Signal.Computed<SelectionSnapshot<Key>>;
  setSelected(keys: readonly Key[]): boolean;
  toggle(key: Key): boolean;
  selectOnly(key: Key): boolean;
  clear(): boolean;
  has(key: Key): boolean;
  reset(): boolean;
}

/** Selection membership only. The caller owns available/disabled options and any required-choice policy. */
export function createSelectionModel<Key extends SelectionKey>(
  initial: readonly Key[] = [],
  { multiple = false }: { multiple?: boolean } = {},
): SelectionModel<Key> {
  const sameKey = (a: Key, b: Key): boolean => a === b || Object.is(a, b);
  const normalize = (keys: readonly Key[]): readonly Key[] => {
    const unique = [...new Set(keys)];
    if (!multiple && unique.length > 1) throw new RangeError('Single selection accepts at most one key.');
    return Object.freeze(unique);
  };
  const model = createValueModel<readonly Key[]>(initial, {
    normalize,
    equals: (a, b) => a.length === b.length && a.every((key, index) => sameKey(key, b[index]!)),
  });
  return {
    selected: model.value,
    view: new Signal.Computed(() => {
      const { value: selected, revision } = model.view.get();
      return Object.freeze({ selected, revision });
    }),
    setSelected: model.set,
    toggle: (key) => {
      const current = model.value.get();
      return model.set(current.includes(key) ? current.filter((item) => !sameKey(item, key)) : multiple ? [...current, key] : [key]);
    },
    selectOnly: (key) => model.set([key]),
    clear: () => model.set([]),
    has: (key) => model.value.get().includes(key),
    reset: model.reset,
  };
}
