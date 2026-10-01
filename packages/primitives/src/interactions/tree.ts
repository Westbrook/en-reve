/** Private browser/SSR seam for the finite, slot-authored tree. */
export const TREE_PRESENTATION_ATTRIBUTE = 'data-en-tree-presentation';
export const TREE_SNAPSHOT_ATTRIBUTE = 'data-en-tree-snapshot';
/** @internal Schema-only data baseline for standalone Declarative Shadow DOM hydration. */
export const TREE_DATA_ATTRIBUTE = 'data-en-tree-data';

export interface TreeSnapshot {
  /** Parent-owned initial reorder presentation, shared with buffered SSR. */
  readonly reorderable?: boolean;
  readonly value: string;
  /** Present in multiple mode; value is the first selected key for compatibility. */
  readonly values?: readonly string[];
  readonly expanded: readonly string[];
}
export interface TreeSelectionSnapshot extends TreeSnapshot {
  readonly selectedKey: string;
  readonly selectedKeys: readonly string[];
  readonly expandedKeys: readonly string[];
}
export interface TreeItemPresentation {
  readonly reorderable?: boolean;
  readonly version: 1;
  readonly branch: boolean;
  readonly expanded: boolean;
  readonly selected: boolean;
  readonly level: number;
  readonly posInSet: number;
  readonly setSize: number;
  readonly tabStop: 0 | -1;
}
export interface TreeSource {
  readonly value: string;
  readonly disabled: boolean;
  /** Authored hidden, inert or aria-hidden=true; excludes the complete subtree. */
  readonly hidden: boolean;
  readonly branch?: boolean;
  readonly children: readonly TreeSource[];
}
export interface TreeDerivedItem {
  readonly value: string;
  readonly parentValue: string | null;
  readonly presentation: TreeItemPresentation;
}
export interface TreeDerivation {
  readonly items: readonly TreeDerivedItem[];
  readonly visible: readonly string[];
}

export const emptyTreeItemPresentation: TreeItemPresentation = Object.freeze({
  version: 1, branch: false, expanded: false, selected: false,
  level: 1, posInSet: 1, setSize: 1, tabStop: -1,
});

/** Normalize author state without discarding unavailable keys. */
export function treeSnapshot(value: string, expanded: readonly string[], values?: readonly string[]): TreeSelectionSnapshot {
  if (!Array.isArray(expanded) || expanded.some(key => typeof key !== 'string' || !key.trim())) {
    throw new TypeError('Tree expanded must be an array of nonblank string keys.');
  }
  if (values !== undefined && (!Array.isArray(values) || values.some(key => typeof key !== 'string' || !key.trim()))) {
    throw new TypeError('Tree values must be an array of nonblank string keys.');
  }
  if (value != null && value !== '' && (typeof value !== 'string' || !value.trim())) throw new TypeError('Tree selection requires a nonblank string key or the empty clear sentinel.');
  const selected = values === undefined ? undefined : Object.freeze([...new Set(values)]);
  const selectedKey = selected ? selected[0] ?? '' : String(value ?? '');
  const expandedKeys = Object.freeze([...new Set(expanded)]);
  return Object.freeze({ selectedKey, selectedKeys: selected ?? Object.freeze(selectedKey ? [selectedKey] : []), expandedKeys,
    value: selectedKey, ...(selected ? { values: selected } : {}), expanded: expandedKeys });
}

/** Pure hierarchy and initial entry derivation, shared by browser and buffered SSR. */
export function deriveTreePresentations(sources: readonly TreeSource[], snapshot: TreeSnapshot): TreeDerivation {
  const keys = new Set<string>();
  const expandedKeys = new Set(snapshot.expanded);
  const selectedKeys = new Set(treeSelectedKeys(snapshot));
  const items: TreeDerivedItem[] = [];
  const visible: string[] = [];
  const visit = (siblings: readonly TreeSource[], parentValue: string | null, level: number, shown: boolean): void => {
    const available = siblings.filter(source => !source.hidden);
    const positions = new Map(available.map((source, index) => [source, index + 1]));
    for (const source of siblings) {
      if (typeof source.value !== 'string' || !source.value.trim()) throw new TypeError('Every tree item requires a nonblank string key (legacy value).');
      if (keys.has(source.value)) throw new TypeError(`Tree item values must be unique; duplicate "${source.value}".`);
      keys.add(source.value);
      const branch = Boolean(source.branch || source.children.some(child => !child.hidden));
      const expanded = branch && expandedKeys.has(source.value);
      if (shown && !source.hidden) visible.push(source.value);
      items.push(Object.freeze({ value: source.value, parentValue, presentation: Object.freeze({
        version: 1, branch, expanded, selected: selectedKeys.has(source.value),
        ...(snapshot.reorderable ? { reorderable: true } : {}),
        level, posInSet: positions.get(source) ?? 1, setSize: Math.max(1, available.length), tabStop: -1,
      }) }));
      visit(source.children, source.value, level + 1, shown && !source.hidden && expanded);
    }
  };
  visit(sources, null, 1, true);
  const entry = treeSelectedKeys(snapshot).find(key => visible.includes(key)) ?? visible[0];
  return Object.freeze({
    items: Object.freeze(items.map(item => item.value === entry
      ? Object.freeze({ ...item, presentation: Object.freeze({ ...item.presentation, tabStop: 0 as const }) }) : item)),
    visible: Object.freeze(visible),
  });
}

const presentations = new WeakMap<object, (presentation: TreeItemPresentation) => void>();
/** @internal Registers an item's private render input, not a public child state API. */
export function registerTreeItemPresentation(host: object, prepare: (presentation: TreeItemPresentation) => void): void {
  presentations.set(host, prepare);
}
/** @internal Used by the request-local SSR adapter before canonical item rendering. */
export function prepareTreeItemPresentation(host: object, presentation: TreeItemPresentation): void {
  const prepare = presentations.get(host);
  if (!prepare) throw new TypeError('The element has no tree item presentation adapter.');
  prepare(validateTreeItemPresentation(presentation));
}

function validateTreeItemPresentation(value: unknown): TreeItemPresentation {
  const p = value as Partial<TreeItemPresentation> | null;
  if (!p || typeof p !== 'object' || p.version !== 1
    || ['branch', 'expanded', 'selected'].some(key => typeof Reflect.get(p, key) !== 'boolean')
    || (p.reorderable !== undefined && typeof p.reorderable !== 'boolean')
    || ['level', 'posInSet', 'setSize'].some(key => !Number.isSafeInteger(Reflect.get(p, key)) || Reflect.get(p, key) < 1)
    || (p.tabStop !== 0 && p.tabStop !== -1) || (!p.branch && p.expanded)) {
    throw new TypeError('Invalid tree item SSR presentation.');
  }
  return Object.freeze({ version: 1, branch: p.branch!, expanded: p.expanded!, selected: p.selected!,
    ...(p.reorderable ? { reorderable: true } : {}),
    level: p.level!, posInSet: p.posInSet!, setSize: p.setSize!, tabStop: p.tabStop });
}
/** @internal Retain this baseline until the first hydration render succeeds. */
export function recoverTreeItemPresentation(host: Element): TreeItemPresentation | undefined {
  const serialized = host.getAttribute(TREE_PRESENTATION_ATTRIBUTE);
  if (serialized === null) return undefined;
  return validateTreeItemPresentation(JSON.parse(serialized));
}
/** @internal Property-only expanded keys need a baseline in standalone DSD consumers. */
export function recoverTreeSnapshot(host: Element): TreeSnapshot | undefined {
  const serialized = host.getAttribute(TREE_SNAPSHOT_ATTRIBUTE);
  if (serialized === null) return undefined;
  const candidate = JSON.parse(serialized) as Partial<TreeSnapshot> | null;
  if (!candidate || typeof candidate.value !== 'string' || !Array.isArray(candidate.expanded)) throw new TypeError('Invalid tree SSR snapshot.');
  return treeSnapshot(candidate.value, candidate.expanded, candidate.values);
}

/** @internal Normalize again at the HTML trust boundary; never recover arbitrary item payloads. */
export function recoverTreeData(host: Element): readonly NormalizedTreeDataItem[] | undefined {
  const serialized = host.getAttribute(TREE_DATA_ATTRIBUTE);
  return serialized === null ? undefined : normalizeTreeData(JSON.parse(serialized));
}


/** Immutable, complete hierarchy used by the optional data-backed tree mode. */
interface TreeDataFields {
  readonly label: string;
  readonly disabled?: boolean;
  readonly children?: readonly TreeDataItem[];
  /** A folder, including an empty loaded folder. */
  readonly branch?: boolean;
  /** Children have not yet been loaded; expanding requests loadChildren. */
  readonly lazy?: boolean;
}
/** key is canonical; value remains an input alias. key wins when both are supplied. */
export type TreeDataItem = TreeDataFields & (
  | { readonly key: string; readonly value?: string }
  | { readonly key?: string; readonly value: string }
);
/** Immutable normalized output retains value for existing readers. */
export interface NormalizedTreeDataItem extends TreeDataFields {
  readonly key: string;
  readonly value: string;
  readonly children: readonly NormalizedTreeDataItem[];
}
/** Extract canonical identity without rewriting opaque keys. */
export function treeDataKey(item: TreeDataItem): string { return item.key !== undefined ? item.key : item.value!; }
export interface TreeDataRow {
  readonly item: NormalizedTreeDataItem;
  readonly parentValue: string | null;
  readonly presentation: TreeItemPresentation;
  /** Index within the expanded-visible preorder, independent of the mounted range. */
  readonly index: number;
  /** Exclusive end of this visible subtree in the same preorder. */
  readonly end: number;
}

const normalizedTreeData = new WeakSet<readonly TreeDataItem[]>();
/** Snapshot caller-owned input; invalid edits cannot partly replace the live tree. */
export function normalizeTreeData(items: readonly TreeDataItem[]): readonly NormalizedTreeDataItem[] {
  const keys = new Set<string>();
  const visit = (values: readonly TreeDataItem[]): readonly NormalizedTreeDataItem[] => {
    if (!Array.isArray(values)) throw new TypeError('Tree items and children must be arrays.');
    return Object.freeze(values.map(item => {
      if (!item || typeof item !== 'object') throw new TypeError('Every tree data item requires a nonblank string key.');
      const key = treeDataKey(item);
      if (typeof key !== 'string' || !key.trim()) throw new TypeError('Every tree data item requires a nonblank string key (legacy value).');
      if (keys.has(key)) throw new TypeError(`Tree item values must be unique; duplicate "${key}".`);
      if (typeof item.label !== 'string') throw new TypeError('Tree data labels must be strings.');
      if (item.disabled !== undefined && typeof item.disabled !== 'boolean') throw new TypeError('Tree data disabled must be boolean.');
      for (const field of ['branch', 'lazy'] as const) if (item[field] !== undefined && typeof item[field] !== 'boolean') throw new TypeError(`Tree data ${field} must be boolean.`);
      keys.add(key);
      return Object.freeze({ key, value: key, label: item.label, disabled: item.disabled ?? false,
        children: visit(item.children ?? []), ...(item.branch !== undefined ? { branch: item.branch } : {}), ...(item.lazy !== undefined ? { lazy: item.lazy } : {}) });
    }));
  };
  const normalized = visit(items);
  normalizedTreeData.add(normalized);
  return normalized;
}

/** Derive the complete visible model once per hierarchy/state edit, never from mounted rows. */
export function deriveTreeDataRows(items: readonly TreeDataItem[], snapshot: TreeSnapshot): readonly TreeDataRow[] {
  const rows: TreeDataRow[] = [];
  const expanded = new Set(snapshot.expanded);
  const selectedKeys = new Set(treeSelectedKeys(snapshot));
  const visit = (siblings: readonly NormalizedTreeDataItem[], parentValue: string | null, level: number): void => {
    siblings.forEach((item, position) => {
      const index = rows.length;
      const children = item.children ?? [];
      const branch = Boolean(item.branch || item.lazy || children.length);
      const open = branch && expanded.has(item.value);
      const presentation: TreeItemPresentation = Object.freeze({ version: 1, branch, expanded: open,
        selected: selectedKeys.has(item.value), level, posInSet: position + 1, setSize: siblings.length, tabStop: -1 });
      rows.push({ item, parentValue, presentation, index, end: index + 1 });
      if (open) visit(children, item.value, level + 1);
      rows[index] = Object.freeze({ item, parentValue, presentation, index, end: rows.length });
    });
  };
  visit(normalizedTreeData.has(items) ? items as readonly NormalizedTreeDataItem[] : normalizeTreeData(items), null, 1);
  return Object.freeze(rows);
}

/** Selection is keyed against the full available model, never mounted rows. */
export function treeSelectedKeys(snapshot: TreeSnapshot): readonly string[] {
  return snapshot.values ?? (snapshot.value ? [snapshot.value] : []);
}
/** Click replaces, modifier/Space toggles, and Shift selects an exact enabled visible range. */
export function treeSelection(snapshot: TreeSnapshot, key: string, available: readonly string[], anchor: string,
  operation: 'replace' | 'toggle' | 'range' | 'all' = 'toggle'): TreeSnapshot {
  if (snapshot.values === undefined) return treeSnapshot(key, snapshot.expanded);
  const selected = new Set(snapshot.values);
  if (operation === 'all') {
    const remove = available.every(value => selected.has(value));
    for (const value of available) { if (remove) selected.delete(value); else selected.add(value); }
  } else if (operation === 'replace') {
    if (!available.includes(key)) return snapshot;
    selected.clear(); selected.add(key);
  } else if (operation === 'range') {
    selected.clear();
    const end = available.indexOf(key);
    const start = available.indexOf(anchor);
    if (end >= 0) for (const value of available.slice(start < 0 ? end : Math.min(start, end), start < 0 ? end + 1 : Math.max(start, end) + 1)) selected.add(value);
  } else if (available.includes(key)) {
    if (selected.has(key)) selected.delete(key); else selected.add(key);
  }
  const values = [...selected];
  if (values.length === snapshot.values.length && values.every((value, index) => value === snapshot.values![index])) return snapshot;
  return treeSnapshot('', snapshot.expanded, values);
}

/** Private interaction anchor. Equal author echoes preserve it; real author selection changes rebase it. */
export class TreeSelectionAnchor {
  private key = '';
  private selected: readonly string[] = [];
  resolve(snapshot: TreeSnapshot, available: readonly string[], fallback = ''): string {
    const keys = treeSelectedKeys(snapshot);
    const unchanged = keys.length === this.selected.length && keys.every((key, index) => key === this.selected[index]);
    if (unchanged && available.includes(this.key)) return this.key;
    return [...keys].reverse().find(key => available.includes(key)) ?? (available.includes(fallback) ? fallback : '');
  }
  accept(snapshot: TreeSnapshot, key: string, operation: 'replace' | 'toggle' | 'range' | 'all', anchor: string, committed = snapshot): void {
    const selected = treeSelectedKeys(snapshot);
    const actual = treeSelectedKeys(committed);
    if (selected.length !== actual.length || selected.some((key, index) => key !== actual[index])) return;
    this.selected = actual;
    this.key = operation === 'replace' || operation === 'toggle'
      ? (this.selected.includes(key) ? key : '') : anchor;
  }
  reset(): void { this.key = ''; this.selected = []; }
}
