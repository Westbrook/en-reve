import type { ColorValue, DimensionValue, ShadowValue, TokenType } from './types.js';

export class TokenError extends Error {
  constructor(readonly code: string, message: string, readonly tokenId?: string) { super(message); this.name = 'TokenError'; }
}
export const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
export const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
export function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }
export function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) { for (const child of Object.values(value)) deepFreeze(child); Object.freeze(value); }
  return value;
}
export function aliasTarget(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const match = /^\{([^{}]+)\}$/.exec(value);
  return match?.[1];
}
export function cssName(id: string): string {
  const path = id.startsWith('component.') ? id.slice('component.'.length) : id;
  return `--en-${path.replaceAll('.', '-')}`;
}
export function validateValue(type: TokenType, value: unknown, id = ''): void {
  const fail = (detail: string): never => { throw new TokenError('invalid-value', `${id || 'Token'}: expected ${type}; ${detail}`, id); };
  const dimension = (v: unknown): v is DimensionValue => isRecord(v) && finite(v.value) && (v.unit === 'px' || v.unit === 'rem');
  const color = (v: unknown): v is ColorValue => isRecord(v) && v.colorSpace === 'srgb' && Array.isArray(v.components) && v.components.length === 3 && v.components.every(c => finite(c) && c >= 0 && c <= 1) && (v.alpha === undefined || (finite(v.alpha) && v.alpha >= 0 && v.alpha <= 1));
  switch (type) {
    case 'color': if (!color(value)) fail('this implementation supports bounded sRGB components and alpha only'); break;
    case 'dimension': if (!dimension(value)) fail('use a finite numeric value and px or rem'); break;
    case 'duration': if (!isRecord(value) || !finite(value.value) || value.value < 0 || !['ms', 's'].includes(String(value.unit))) fail('use a nonnegative value and ms or s'); break;
    case 'number': if (!finite(value)) fail('use a finite number'); break;
    case 'fontFamily': if (!(typeof value === 'string' && value.length > 0) && !(Array.isArray(value) && value.length > 0 && value.every(v => typeof v === 'string' && v.length > 0))) fail('use one family name or a nonempty list of family names'); break;
    case 'fontStyle': if (!['normal','italic','oblique'].includes(String(value))) fail('use normal, italic or oblique'); break;
    case 'fontWeight': if (!(finite(value) && value >= 1 && value <= 1000) && !['thin', 'hairline', 'extra-light', 'ultra-light', 'light', 'normal', 'regular', 'book', 'medium', 'semi-bold', 'demi-bold', 'bold', 'extra-bold', 'ultra-bold', 'black', 'heavy', 'extra-black', 'ultra-black'].includes(String(value))) fail('use a supported font weight'); break;
    case 'cubicBezier': if (!Array.isArray(value) || value.length !== 4 || !value.every(finite) || value[0] < 0 || value[0] > 1 || value[2] < 0 || value[2] > 1) fail('use four numbers with x coordinates in [0, 1]'); break;
    case 'shadow': {
      const entries = Array.isArray(value) ? value : [value];
      if (!entries.length) fail('shadow arrays must not be empty');
      for (const s of entries) if (!isRecord(s) || !color(s.color) || !dimension(s.offsetX) || !dimension(s.offsetY) || !dimension(s.blur) || s.blur.value < 0 || !dimension(s.spread) || (s.inset !== undefined && typeof s.inset !== 'boolean')) fail('use structured color, offset, blur, spread, and optional inset values');
      break;
    }
    default: throw new TokenError('unsupported-type', `Unsupported token type ${String(type)}`, id);
  }
}
export const numberText = (v: number): string => Object.is(v, -0) ? '0' : String(v);
export function colorCSS(value: ColorValue): string { return `rgb(${value.components.map(v => numberText(Number((v * 255).toFixed(8)))).join(' ')} / ${numberText(value.alpha ?? 1)})`; }
export function valueCSS(type: TokenType, value: unknown): string {
  validateValue(type, value);
  switch (type) {
    case 'color': return colorCSS(value as ColorValue);
    case 'dimension': case 'duration': { const d = value as {value: number; unit: string}; return `${numberText(d.value)}${d.unit}`; }
    case 'cubicBezier': return `cubic-bezier(${(value as number[]).map(numberText).join(', ')})`;
    case 'fontFamily': return (Array.isArray(value) ? value : [value]).map(v => ['serif', 'sans-serif', 'monospace', 'system-ui', 'ui-serif', 'ui-sans-serif', 'ui-monospace', 'ui-rounded', 'cursive', 'fantasy', 'math'].includes(String(v)) ? String(v) : JSON.stringify(v)).join(', ');
    case 'shadow': return (Array.isArray(value) ? value : [value]).map(entry => { const s = entry as ShadowValue; return `${s.inset ? 'inset ' : ''}${[s.offsetX, s.offsetY, s.blur, s.spread].map(d => `${numberText(d.value)}${d.unit}`).join(' ')} ${colorCSS(s.color)}`; }).join(', ');
    case 'fontWeight': {
      const weights: Record<string,number> = {thin:100,hairline:100,'extra-light':200,'ultra-light':200,light:300,normal:400,regular:400,book:400,medium:500,'semi-bold':600,'demi-bold':600,bold:700,'extra-bold':800,'ultra-bold':800,black:900,heavy:900,'extra-black':950,'ultra-black':950};
      return typeof value === 'number' ? numberText(value) : String(weights[String(value)]);
    }
    default: return typeof value === 'number' ? numberText(value) : String(value);
  }
}
