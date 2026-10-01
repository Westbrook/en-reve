import { Signal } from 'signal-polyfill';

/** A finite selectable identity with plain-text presentation, matching en-select. */
export interface ComboboxItem {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}
export interface IndexedOption extends ComboboxItem { readonly id: string; }

/** Filtering and active-option navigation are separate from accepted form state. */
export function createComboboxModel() {
  const items = new Signal.State<readonly ComboboxItem[]>([]);
  const query = new Signal.State('');
  const open = new Signal.State(false);
  const active = new Signal.State<string | undefined>(undefined);
  const indexed = new Signal.Computed<readonly IndexedOption[]>(() => items.get().map((item, index) => ({ ...item, id: `option-${index}` })));
  const filtered = new Signal.Computed(() => {
    const search = query.get().toLowerCase();
    return indexed.get().filter(item => item.label.toLowerCase().includes(search));
  });
  const activeOption = new Signal.Computed(() => filtered.get().find(item => item.value === active.get() && !item.disabled));
  return {
    items: new Signal.Computed(() => items.get()),
    filtered,
    activeOption,
    open: new Signal.Computed(() => open.get()),
    view: new Signal.Computed(() => ({ options: filtered.get(), active: activeOption.get(), open: open.get() })),
    setItems(value: readonly ComboboxItem[]): void { items.set(value); if (!activeOption.get()) active.set(undefined); },
    setQuery(value: string): void { if (query.get() !== value) { query.set(value); active.set(undefined); } },
    show(): void { open.set(true); },
    close(): void { open.set(false); active.set(undefined); },
    activate(value: string): void { if (filtered.get().some(item => item.value === value && !item.disabled)) active.set(value); },
    move(direction: 1 | -1): void {
      const available = filtered.get().filter(item => !item.disabled);
      if (!available.length) { active.set(undefined); return; }
      const index = available.findIndex(item => item.value === active.get());
      const next = index < 0 ? (direction === 1 ? 0 : available.length - 1) : Math.max(0, Math.min(available.length - 1, index + direction));
      active.set(available[next]!.value);
    },
  };
}
