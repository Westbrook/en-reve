/** Normalized sRGB bytes plus unit alpha. */
export type RGBA = [number, number, number, number];
/** Hue in degrees; saturation and lightness in percent. */
export type HSL = [number, number, number];
export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
/** Normalize CSS hex (3/4/6/8 digits); alpha ff is represented by opaque six-digit hex. */
export function normalizeHexColor(value: string): string | undefined {
  const match = /^#?([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.exec(String(value ?? '').trim());
  if (!match) return undefined;
  let hex = match[1].toLowerCase();
  if (hex.length < 5) hex = [...hex].map(c => c + c).join('');
  if (hex.length === 8 && hex.endsWith('ff')) hex = hex.slice(0, 6);
  return '#' + hex;
}
export function fromHex(value: string): RGBA {
  const hex = normalizeHexColor(value) ?? '#000000';
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16), hex.length === 9 ? parseInt(hex.slice(7, 9), 16) / 255 : 1];
}
export function toHex([r, g, b, a]: RGBA): string {
  const byte = (v: number) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0');
  return normalizeHexColor('#' + [r, g, b].map(byte).join('') + byte(a * 255))!;
}
// sRGB/HSL conversion follows CSS Color 4, sections 7.1 and 7.2.
// https://www.w3.org/TR/css-color-4/#hsl-to-rgb
export function toHSL([red, green, blue]: RGBA, fallbackHue = 0): HSL {
  const r = red / 255, g = green / 255, b = blue / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
  const light = (max + min) / 2;
  if (!delta) return [fallbackHue, 0, light * 100];
  let hue = max === r ? (g - b) / delta : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  hue = ((hue * 60) % 360 + 360) % 360;
  return [hue, delta / (1 - Math.abs(2 * light - 1)) * 100, light * 100];
}
export function fromHSL([hue, saturation, lightness]: HSL, alpha = 1): RGBA {
  const h = ((hue % 360) + 360) % 360, s = clamp(saturation, 0, 100) / 100, l = clamp(lightness, 0, 100) / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s, x = chroma * (1 - Math.abs((h / 60) % 2 - 1)), m = l - chroma / 2;
  const values = h < 60 ? [chroma, x, 0] : h < 120 ? [x, chroma, 0] : h < 180 ? [0, chroma, x] : h < 240 ? [0, x, chroma] : h < 300 ? [x, 0, chroma] : [chroma, 0, x];
  return [(values[0] + m) * 255, (values[1] + m) * 255, (values[2] + m) * 255, clamp(alpha, 0, 1)];
}
