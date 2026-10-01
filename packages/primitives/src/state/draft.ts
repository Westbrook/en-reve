import { Signal } from 'signal-polyfill';

export interface DraftSnapshot {
  /** Application-accepted value. */
  readonly value: string;
  /** Native editing value, which may differ from the accepted value. */
  readonly draft: string;
  readonly isComposing: boolean;
  readonly dirty: boolean;
  readonly revision: number;
}

interface DraftState extends DraftSnapshot {
  readonly deferredAuthorWrite: boolean;
}

export interface DraftModel {
  readonly value: Signal.Computed<string>;
  readonly draft: Signal.Computed<string>;
  readonly isComposing: Signal.Computed<boolean>;
  /** An authoritative write is waiting for native composition to finish. */
  readonly hasDeferredValue: Signal.Computed<boolean>;
  readonly view: Signal.Computed<DraftSnapshot>;
  /** Even a same-value write explicitly reconciles a rejected draft; during IME reconciliation is deferred. */
  setValue(value: string): boolean;
  /** Expose tentative accepted state without reconciling the native draft or deferred IME write. */
  stageValue(value: string): boolean;
  setDraft(draft: string): boolean;
  startComposition(): boolean;
  endComposition(finalDraft?: string): boolean;
  /** No accepted-state change is allowed through this method while composition is active. */
  acceptDraft(): boolean;
  /** Reset is authoritative and therefore preserves active composition until its end. */
  reset(): boolean;
}

export function createDraftModel(initial = ''): DraftModel {
  const state = new Signal.State<DraftState>(Object.freeze({ value: initial, draft: initial, isComposing: false, dirty: false, revision: 0, deferredAuthorWrite: false }));
  const update = (patch: Partial<Omit<DraftState, 'revision' | 'dirty'>>): boolean => {
    const previous = state.get();
    const next = { ...previous, ...patch };
    if (next.value === previous.value && next.draft === previous.draft && next.isComposing === previous.isComposing && next.deferredAuthorWrite === previous.deferredAuthorWrite) return false;
    state.set(Object.freeze({ ...next, dirty: next.value !== next.draft, revision: previous.revision + 1 }));
    return true;
  };
  const setValue = (value: string): boolean => state.get().isComposing
    ? update({ value, deferredAuthorWrite: true })
    : update({ value, draft: value, deferredAuthorWrite: false });
  return {
    value: new Signal.Computed(() => state.get().value),
    draft: new Signal.Computed(() => state.get().draft),
    isComposing: new Signal.Computed(() => state.get().isComposing),
    hasDeferredValue: new Signal.Computed(() => state.get().deferredAuthorWrite),
    view: new Signal.Computed(() => {
      const { deferredAuthorWrite: _, ...snapshot } = state.get();
      return Object.freeze(snapshot);
    }),
    setValue,
    stageValue: (value) => update({ value }),
    setDraft: (draft) => update({ draft }),
    startComposition: () => update({ isComposing: true }),
    endComposition: (finalDraft) => {
      const current = state.get();
      return update({
        draft: current.deferredAuthorWrite ? current.value : finalDraft ?? current.draft,
        isComposing: false,
        deferredAuthorWrite: false,
      });
    },
    acceptDraft: () => state.get().isComposing ? false : setValue(state.get().draft),
    reset: () => setValue(initial),
  };
}
