import type { ColorValue } from './types.js';
import { TokenError, validateValue } from './value.js';
import { accentMixWeights } from './recipe-data.js';

type Triple = readonly [number, number, number];
const clamp = (n: number) => Math.min(1, Math.max(0, n));
const linear = (v: number) => Math.abs(v) <= 0.04045 ? v / 12.92 : Math.sign(v) * ((Math.abs(v) + 0.055) / 1.055) ** 2.4;
const encoded = (v: number) => Math.abs(v) <= 0.0031308 ? 12.92 * v : Math.sign(v) * (1.055 * Math.abs(v) ** (1 / 2.4) - 0.055);
export function colorFromHex(hex: string): ColorValue {
  if (!/^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(hex)) throw new TokenError('invalid-color', 'Use #RGB, #RRGGBB, or #RRGGBBAA.');
  const text = hex.length === 4 ? [...hex.slice(1)].map(c => c + c).join('') : hex.slice(1);
  return { colorSpace: 'srgb', components: [0,2,4].map(i => parseInt(text.slice(i, i + 2), 16) / 255) as unknown as Triple, ...(text.length === 8 ? {alpha: parseInt(text.slice(6), 16) / 255} : {}) };
}
/** Oklab matrices from CSS Color 4 sample conversion code. */
export function srgbToOklab(rgb: Triple): Triple {
  const [r,g,b] = rgb.map(linear);
  const l = Math.cbrt(0.4122214708*r + 0.5363325363*g + 0.0514459929*b);
  const m = Math.cbrt(0.2119034982*r + 0.6806995451*g + 0.1073969566*b);
  const s = Math.cbrt(0.0883024619*r + 0.2817188376*g + 0.6299787005*b);
  return [0.2104542553*l + 0.793617785*m - 0.0040720468*s, 1.9779984951*l - 2.428592205*m + 0.4505937099*s, 0.0259040371*l + 0.7827717662*m - 0.808675766*s];
}
export function oklabToSrgb(lab: Triple): Triple {
  const [L,a,b] = lab;
  const l = (L + 0.3963377774*a + 0.2158037573*b) ** 3;
  const m = (L - 0.1055613458*a - 0.0638541728*b) ** 3;
  const s = (L - 0.0894841775*a - 1.291485548*b) ** 3;
  return [4.0767416621*l - 3.3077115913*m + 0.2309699292*s, -1.2684380046*l + 2.6097574011*m - 0.3413193965*s, -0.0041960863*l - 0.7034186147*m + 1.707614701*s].map(encoded) as unknown as Triple;
}
const inGamut = (rgb: Triple) => rgb.every(v => v >= -1e-7 && v <= 1 + 1e-7);
const clip = (rgb: Triple): Triple => rgb.map(clamp) as unknown as Triple;
const delta = (a: Triple, b: Triple) => Math.hypot(...a.map((v, i) => v - b[i]));
/** Pinned binary-search/local-MINDE mapping; outputs bounded sRGB. */
export function gamutMapOklab(lab: Triple): Triple {
  if (!lab.every(Number.isFinite)) throw new TokenError('invalid-color', 'Color coordinates must be finite.');
  const [L,a,b] = lab;
  if (L >= 1) return [1,1,1];
  if (L <= 0) return [0,0,0];
  const initial = oklabToSrgb(lab);
  if (inGamut(initial)) return clip(initial);
  let clipped = clip(initial);
  if (delta(srgbToOklab(clipped), lab) < 0.02) return clipped;
  const hue = Math.atan2(b,a);
  let min = 0;
  let max = Math.hypot(a,b);
  let minInGamut = true;
  while (max - min > 0.0001) {
    const chroma = (min + max) / 2;
    const current: Triple = [L, chroma * Math.cos(hue), chroma * Math.sin(hue)];
    const rgb = oklabToSrgb(current);
    if (minInGamut && inGamut(rgb)) { min = chroma; continue; }
    clipped = clip(rgb);
    const difference = delta(srgbToOklab(clipped), current);
    if (difference < 0.02) {
      if (0.02 - difference < 0.0001) return clipped;
      minInGamut = false;
      min = chroma;
    } else max = chroma;
  }
  return clipped;
}
export function mixOklab(first: ColorValue, second: ColorValue, firstWeight: number): ColorValue {
  validateValue('color', first); validateValue('color', second);
  if ((first.alpha ?? 1) !== 1 || (second.alpha ?? 1) !== 1) throw new TokenError('unsupported-alpha', 'Accent interpolation currently requires opaque colors.');
  if (!Number.isFinite(firstWeight) || firstWeight < 0 || firstWeight > 1) throw new TokenError('invalid-weight', 'Mix weight must be in [0, 1].');
  if (firstWeight === 1) return {colorSpace: 'srgb', components: [...first.components]};
  if (firstWeight === 0) return {colorSpace: 'srgb', components: [...second.components]};
  const a = srgbToOklab(first.components); const b = srgbToOklab(second.components);
  return {colorSpace: 'srgb', components: gamutMapOklab(a.map((v,i) => v * firstWeight + b[i] * (1 - firstWeight)) as unknown as Triple)};
}
export function relativeLuminance(color: ColorValue): number {
  validateValue('color', color);
  const [r,g,b] = color.components.map(linear);
  return 0.2126*r + 0.7152*g + 0.0722*b;
}
export function contrastRatio(foreground: ColorValue, background: ColorValue): number {
  validateValue('color', foreground); validateValue('color', background);
  if ((background.alpha ?? 1) !== 1) throw new TokenError('unknown-background', 'Contrast requires an opaque resolved background.');
  const alpha = foreground.alpha ?? 1;
  const composed: ColorValue = {colorSpace: 'srgb', components: foreground.components.map((v,i) => v * alpha + background.components[i] * (1 - alpha)) as unknown as Triple};
  const a = relativeLuminance(composed); const b = relativeLuminance(background);
  return (Math.max(a,b) + 0.05) / (Math.min(a,b) + 0.05);
}
export function recommendForeground(candidates: readonly ColorValue[], backgrounds: readonly ColorValue[]): {color: ColorValue; minimumContrast: number} {
  if (!candidates.length || !backgrounds.length) throw new TokenError('missing-colors', 'Foreground selection requires candidates and backgrounds.');
  let best = {color: candidates[0], minimumContrast: -Infinity};
  for (const color of candidates) {
    const minimumContrast = Math.min(...backgrounds.map(background => contrastRatio(color, background)));
    if (minimumContrast > best.minimumContrast) best = {color, minimumContrast};
  }
  return best;
}
export function deriveAccent(input: {seed: ColorValue; surface: ColorValue; emphasis: ColorValue; foregroundCandidates?: readonly ColorValue[]}) {
  const action = mixOklab(input.seed, input.emphasis, 1);
  const hover = mixOklab(input.seed, input.emphasis, accentMixWeights.hover);
  const pressed = mixOklab(input.seed, input.emphasis, accentMixWeights.pressed);
  const subtle = mixOklab(input.seed, input.surface, accentMixWeights.subtle);
  const border = mixOklab(input.seed, input.surface, accentMixWeights.border);
  const recommended = recommendForeground(input.foregroundCandidates ?? [colorFromHex('#ffffff'), colorFromHex('#000000')], [action, hover, pressed]);
  return {version: 'accent/v1', action, hover, pressed, subtle, border, onAction: recommended.color, minimumContrast: recommended.minimumContrast};
}
