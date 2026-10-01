import { TokenError } from './value.js';

/** Computed token precision; authored values remain exact in source identity.
 * Twelve significant digits retain small/large magnitudes. For bounded sRGB
 * channels the rounding error is at most 1.3e-10 after multiplying by 255,
 * below the 1e-8 resolution of emitted color channels.
 * Canonicalization reduces cross-runtime math noise; it is not fuzzy validation.
 */
export const derivedPrecision = 12;
export function canonicalDerivedNumber(value: number): number {
  if (!Number.isFinite(value)) throw new TokenError('invalid-value', 'Derived values must be finite.');
  const rounded = Number(value.toPrecision(derivedPrecision));
  // A finite value at the numeric limit can round outside the finite interval.
  return Number.isFinite(rounded) ? rounded : Math.sign(value) * Number.MAX_VALUE;
}

/** Only call after validating the recipe result's token type. Author values and
 * token/group metadata are not routed through this function. Composite values retain
 * their shape, string units, booleans, and optional fields.
 */
export function canonicalDerivedValue(value: unknown): unknown {
  if (typeof value === 'number') return canonicalDerivedNumber(value);
  if (Array.isArray(value)) return value.map(canonicalDerivedValue);
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, canonicalDerivedValue(child)]));
  }
  return value;
}
