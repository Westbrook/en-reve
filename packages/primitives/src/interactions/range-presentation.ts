/** Pure value-to-paint projection. It neither normalizes nor writes accepted state. */
export function rangeValuePercent(value: number, min: number, max: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max) || max <= min) return 0;
  if (value <= min) return 0;
  if (value >= max) return 100;
  const span = max - min;
  // Valid finite endpoints can still overflow their difference.
  const ratio = Number.isFinite(span) ? (value - min) / span : (value / 2 - min / 2) / (max / 2 - min / 2);
  return Math.max(0, Math.min(100, ratio * 100));
}

/** Explicit native-helper integration. Call after initialization, native input,
 * reset and application value/bounds writes. Importing this module touches no DOM
 * globals and installs no listeners. The live native value remains authoritative.
 */
export function syncRangePresentation(input: HTMLInputElement): void {
  const bound = (value: string, fallback: number) => value.trim() && Number.isFinite(Number(value)) ? Number(value) : fallback;
  const percent = rangeValuePercent(input.valueAsNumber, bound(input.min, 0), bound(input.max, 100));
  input.style.setProperty('--en-slider-value-percent', `${percent}%`);
}
