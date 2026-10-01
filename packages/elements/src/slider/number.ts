/** Shared numeric bounds for the range surface and explicit property normalization. */
export interface NumberBounds { readonly min: number; readonly max: number; readonly step: number; }

export function normalizeNumberBounds(min: number, max: number, step: number): NumberBounds {
  const lower = Number.isFinite(min) ? min : 0;
  return { min: lower, max: Math.max(lower, Number.isFinite(max) ? max : 100),
    step: Number.isFinite(step) && step > 0 ? step : 1 };
}

/** Decimal places implied by a finite Number, including scientific notation. */
function decimalPlaces(value: number): number {
  const [coefficient = '', exponent = '0'] = Math.abs(value).toString().split('e');
  return Math.max(0, (coefficient.split('.')[1]?.length ?? 0) - Number(exponent));
}

/** Native-range normalization; exact text entry is validated before using this path. */
export function normalizeRangeValue(value: number, bounds: NumberBounds): number {
  const finite = Number.isFinite(value) ? value : bounds.min;
  const clamped = Math.min(bounds.max, Math.max(bounds.min, finite));
  const count = Math.round((clamped - bounds.min) / bounds.step);
  const maximumCount = Math.floor(Number(((bounds.max - bounds.min) / bounds.step).toFixed(12)));
  const result = bounds.min + Math.min(count, maximumCount) * bounds.step;
  const places = Math.max(decimalPlaces(bounds.min), decimalPlaces(bounds.step));
  // toFixed supports at most 100 places. Beyond that, preserve the native Number
  // instead of rounding an otherwise representable tiny step to zero.
  return places <= 100 ? Number(result.toFixed(places)) : result;
}
