import { Signal } from 'signal-polyfill';
import { collectionGetKey } from './collection.js';

interface VirtualCollectionSettings<T> {
  items: readonly T[];

  estimateSize?: number;
  /** Number of additional items mounted on each side of the visible range. */
  overscan?: number;
  /** Deterministic initial item count used before a browser viewport is supplied. */
  initialCount?: number;
}

/** Stable, unique identity; canonical getKey wins over the deprecated key callback. */
export type VirtualCollectionOptions<T> = VirtualCollectionSettings<T> & (
  | { getKey: (item: T) => string; key?: (item: T) => string }
  | { getKey?: (item: T) => string; key: (item: T) => string }
);

export type VirtualEntry<T> = Readonly<
  | { kind: 'item'; key: string; item: T; index: number; offset: number; size: number }
  | { kind: 'gap'; key: string; offset: number; size: number }
>;

function positive(value: number, name: string): number {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${name} must be positive and finite.`);
  return value;
}

function nonnegative(value: number, name: string): number {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${name} must be nonnegative and finite.`);
  return value;
}

/** Prefix geometry with logarithmic updates and offset lookup; rebuilding is reserved for item changes. */
class Geometry {
  readonly tree: Float64Array;
  constructor(readonly sizes: readonly number[]) {
    this.tree = new Float64Array(sizes.length + 1);
    for (let i = 1; i <= sizes.length; i++) {
      this.tree[i] = this.tree[i]! + sizes[i - 1]!;
      const parent = i + (i & -i);
      if (parent <= sizes.length) this.tree[parent] = this.tree[parent]! + this.tree[i]!;
    }
  }
  sum(count: number): number {
    let result = 0;
    for (let i = count; i > 0; i -= i & -i) result += this.tree[i]!;
    return result;
  }
  add(index: number, delta: number): void {
    for (let i = index + 1; i < this.tree.length; i += i & -i) this.tree[i] = this.tree[i]! + delta;
  }
  /** First row whose end is strictly beyond offset, or count at the end. */
  indexAt(offset: number): number {
    let index = 0;
    let sum = 0;
    let step = 1;
    while (step * 2 < this.tree.length) step *= 2;
    for (; step > 0; step = Math.floor(step / 2)) {
      const next = index + step;
      if (next < this.tree.length && sum + this.tree[next]! <= offset) {
        index = next;
        sum += this.tree[next]!;
      }
    }
    return index;
  }
}

/**
 * Renderer-independent vertical collection geometry. No browser globals or mutable consumer records.
 * Reads participate in Signals tracking. The renderer owns measurement, focus/overlay pin lifetimes,
 * native markup and applying anchorOffset to its scroll container after a geometry mutation.
 */
export class VirtualCollection<T> {
  readonly revision = new Signal.State(0);
  private readonly keyFor: (item: T) => string;
  private readonly estimate: number;
  private readonly overscan: number;
  private readonly initialCount: number;
  private items: readonly T[] = [];
  private keys: readonly string[] = [];
  private indices = new Map<string, number>();
  private measurements = new Map<string, number>();
  private pinned = new Set<string>();
  private sizes: number[] = [];
  private geometry = new Geometry([]);
  private viewport: { offset: number; size: number } | undefined;
  private cachedEntries: readonly VirtualEntry<T>[] | undefined;

  constructor(options: VirtualCollectionOptions<T>) {
    this.keyFor = collectionGetKey(options);
    this.estimate = positive(options.estimateSize ?? 48, 'estimateSize');
    this.overscan = Math.floor(nonnegative(options.overscan ?? 3, 'overscan'));
    this.initialCount = Math.floor(nonnegative(options.initialCount ?? 20, 'initialCount'));
    this.setItems(options.items);
  }

  private changed(): void {
    this.cachedEntries = undefined;
    this.revision.set(this.revision.get() + 1);
  }

  get count(): number { this.revision.get(); return this.items.length; }
  get totalSize(): number { this.revision.get(); return this.geometry.sum(this.items.length); }
  /** Recommended scroll offset. Geometry changes preserve the first visible stable key plus its inset. */
  get anchorOffset(): number { this.revision.get(); return this.viewport?.offset ?? 0; }

  indexOf(key: string): number { this.revision.get(); return this.indices.get(key) ?? -1; }
  /** Identity at a logical index, including rows outside the rendered window. */
  keyAt(index: number): string | undefined {
    this.revision.get();
    return Number.isInteger(index) && index >= 0 ? this.keys[index] : undefined;
  }
  offsetOf(index: number): number {
    this.revision.get();
    if (!Number.isInteger(index) || index < 0 || index > this.items.length) throw new RangeError('Invalid item index.');
    return this.geometry.sum(index);
  }
  sizeOf(index: number): number {
    this.revision.get();
    if (!Number.isInteger(index) || index < 0 || index >= this.items.length) throw new RangeError('Invalid item index.');
    return this.sizes[index]!;
  }
  scrollOffsetFor(key: string): number | undefined {
    const index = this.indexOf(key);
    return index < 0 ? undefined : this.offsetOf(index);
  }

  private anchor(): { key: string; index: number; inset: number } | undefined {
    if (!this.viewport || this.items.length === 0) return undefined;
    const index = Math.min(this.items.length - 1, this.geometry.indexAt(this.viewport.offset));
    return { key: this.keys[index]!, index, inset: this.viewport.offset - this.geometry.sum(index) };
  }
  private restore(anchor: ReturnType<VirtualCollection<T>['anchor']>): void {
    if (!this.viewport) return;
    const index = anchor ? this.indices.get(anchor.key) : undefined;
    const offset = index === undefined ? this.viewport.offset : this.geometry.sum(index) + Math.min(anchor!.inset, this.sizes[index]!);
    this.viewport.offset = Math.max(0, Math.min(offset, Math.max(0, this.totalSize - this.viewport.size)));
  }

  /**
   * Retains measurements/pins by key; invalid input leaves previously accepted state unchanged.
   * Supply new record objects for edits. In-place content edits need their own host render/measurement;
   * passing the same ordered identities is intentionally a no-op.
   */
  setItems(items: readonly T[]): void {
    const nextItems = [...items];
    const keys = nextItems.map(this.keyFor);
    const indices = new Map<string, number>();
    keys.forEach((key, index) => {
      if (typeof key !== 'string' || indices.has(key)) throw new TypeError('Virtual collections require unique string keys.');
      indices.set(key, index);
    });
    if (nextItems.length === this.items.length && nextItems.every((item, index) => item === this.items[index] && keys[index] === this.keys[index])) return;
    let anchor = this.anchor();
    if (anchor && !indices.has(anchor.key)) {
      // Prefer the next surviving former row, then the previous; never reuse an unrelated index as identity.
      const index = this.keys.findIndex((key, index) => index > anchor!.index && indices.has(key));
      let fallback = index;
      if (fallback < 0) for (let i = anchor.index - 1; i >= 0; i--) if (indices.has(this.keys[i]!)) { fallback = i; break; }
      anchor = fallback < 0 ? undefined : { key: this.keys[fallback]!, index: fallback, inset: 0 };
    }
    this.items = nextItems;
    this.keys = keys;
    this.indices = indices;
    for (const key of this.measurements.keys()) if (!indices.has(key)) this.measurements.delete(key);
    for (const key of this.pinned) if (!indices.has(key)) this.pinned.delete(key);
    this.sizes = keys.map((key) => this.measurements.get(key) ?? this.estimate);
    this.geometry = new Geometry(this.sizes);
    this.restore(anchor);
    this.changed();
  }

  setViewport(offset: number, size: number): void {
    nonnegative(offset, 'offset');
    nonnegative(size, 'size');
    offset = Math.min(offset, Math.max(0, this.totalSize - size));
    if (this.viewport?.offset === offset && this.viewport.size === size) return;
    this.viewport = { offset, size };
    this.changed();
  }

  measure(key: string, size: number): boolean {
    return this.measureMany([[key, size]]);
  }

  /** Apply one measurement batch with a single anchor restoration, avoiding intermediate edge clamping. */
  measureMany(measurements: Iterable<readonly [string, number]>): boolean {
    const accepted = new Map<string, number>();
    for (const [key, size] of measurements) {
      positive(size, 'size');
      if (this.indices.has(key)) accepted.set(key, size);
    }
    const anchor = this.anchor();
    let changed = false;
    for (const [key, size] of accepted) {
      const index = this.indices.get(key)!;
      this.measurements.set(key, size);
      if (this.sizes[index] === size) continue;
      this.geometry.add(index, size - this.sizes[index]!);
      this.sizes[index] = size;
      changed = true;
    }
    if (!changed) return false;
    this.restore(anchor);
    this.changed();
    return true;
  }

  /** Explicitly forget measured geometry after an offscreen density/font/layout change. */
  invalidateMeasurements(): void {
    if (this.measurements.size === 0) return;
    const anchor = this.anchor();
    this.measurements.clear();
    this.sizes = this.keys.map(() => this.estimate);
    this.geometry = new Geometry(this.sizes);
    this.restore(anchor);
    this.changed();
  }
  pin(key: string): void {
    if (!this.indices.has(key) || this.pinned.has(key)) return;
    this.pinned.add(key);
    this.changed();
  }
  unpin(key: string): void {
    if (this.pinned.delete(key)) this.changed();
  }

  /** Gaps and retained rows preserve the total extent, without mounting intervening unneeded rows. */
  get entries(): readonly VirtualEntry<T>[] {
    this.revision.get();
    if (this.cachedEntries) return this.cachedEntries;
    const count = this.items.length;
    const indices = new Set<number>();
    let start = 0;
    let end = Math.min(count, this.initialCount);
    if (this.viewport && count) {
      start = Math.max(0, Math.min(count - 1, this.geometry.indexAt(this.viewport.offset)) - this.overscan);
      const edge = this.viewport.offset + this.viewport.size;
      let visibleEnd = this.geometry.indexAt(edge);
      if (visibleEnd < count && this.geometry.sum(visibleEnd) < edge) visibleEnd++;
      end = Math.min(count, Math.max(start + 1, visibleEnd) + this.overscan);
    }
    for (let index = start; index < end; index++) indices.add(index);
    for (const key of this.pinned) indices.add(this.indices.get(key)!);
    const entries: VirtualEntry<T>[] = [];
    let cursorIndex = 0;
    for (const index of [...indices].sort((a, b) => a - b)) {
      const offset = this.geometry.sum(index);
      if (index > cursorIndex) {
        const cursor = this.geometry.sum(cursorIndex);
        entries.push(Object.freeze({ kind: 'gap', key: `gap:${index}`, offset: cursor, size: offset - cursor }));
      }
      const size = this.sizes[index]!;
      entries.push(Object.freeze({ kind: 'item', key: this.keys[index]!, item: this.items[index]!, index, offset, size }));
      cursorIndex = index + 1;
    }
    const total = this.geometry.sum(count);
    if (cursorIndex < count) {
      const cursor = this.geometry.sum(cursorIndex);
      entries.push(Object.freeze({ kind: 'gap', key: 'gap:end', offset: cursor, size: total - cursor }));
    }
    this.cachedEntries = Object.freeze(entries);
    return this.cachedEntries;
  }
}
