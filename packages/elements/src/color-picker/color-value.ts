import { fromHex, normalizeHexColor, fromHSL, toHex } from './color.js';

export type ColorSpace = 'srgb' | 'display-p3';
/** Immutable encoded RGB coordinates. Conversion results may be outside 0–1. */
export interface ColorValue {
  readonly space: ColorSpace;
  readonly channels: readonly [number, number, number];
  readonly alpha: number;
}
/** Validate and copy a value; authored colors must fit their declared space. */
export function createColorValue(value: ColorValue, extended = false): ColorValue | undefined {
  if (!value || !['srgb','display-p3'].includes(value.space) || !Array.isArray(value.channels) || value.channels.length !== 3 ||
    !value.channels.every(n => typeof n === 'number' && Number.isFinite(n) && (extended || n >= 0 && n <= 1)) ||
    typeof value.alpha !== 'number' || !Number.isFinite(value.alpha) || value.alpha < 0 || value.alpha > 1) return undefined;
  return Object.freeze({space:value.space, channels:Object.freeze(value.channels.map(n=>n===0?0:n)) as ColorValue['channels'], alpha:value.alpha===0?0:value.alpha});
}
const numberPattern = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
const number = (text: string): number => numberPattern.test(text) ? Number(text) : NaN;
const unit = (text: string): number => text.endsWith('%') ? number(text.slice(0,-1))/100 : number(text);
const hue = (text: string): number => {
  const match = /^(.*?)(deg|grad|rad|turn)?$/i.exec(text)!;
  const n = number(match[1]) * ({deg:1,grad:.9,rad:180/Math.PI,turn:360}[match[2]?.toLowerCase() || 'deg'] ?? NaN);
  return (n % 360 + 360) % 360;
};
/** Bounded literal CSS subset: hex, RGB/HSL (comma or space syntax), color(srgb/display-p3). No names, variables, relative colors or clipping. */
export function parseColor(value: string): ColorValue | undefined {
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  const hex = normalizeHexColor(text);
  if (hex) {const [r,g,b,a] = fromHex(hex); return createColorValue({space:'srgb',channels:[r/255,g/255,b/255],alpha:a});}
  const match = /^(rgb|rgba|hsl|hsla|color)\(([^()]*)\)$/i.exec(text);
  if (!match) return undefined;
  const fn = match[1].toLowerCase(), body = match[2].trim();
  let channels: string[], alpha = 1, space: ColorSpace = 'srgb';
  if (body.includes(',')) {
    if (fn === 'color' || body.includes('/')) return undefined;
    const parts = body.split(',').map(s=>s.trim());
    if (parts.length !== 3 && parts.length !== 4) return undefined;
    channels = parts.slice(0,3); if (parts.length === 4) alpha = unit(parts[3]);
    if ((fn === 'rgb' || fn === 'rgba') && channels.some(s=>s.endsWith('%')) && !channels.every(s=>s.endsWith('%'))) return undefined;
  } else {
    const slash = body.split('/'); if(slash.length > 2) return undefined;
    channels = slash[0].trim().split(/\s+/);
    if (slash.length === 2) alpha = unit(slash[1].trim());
    if (fn === 'color') {const name = channels.shift()?.toLowerCase(); if(name !== 'srgb' && name !== 'display-p3') return undefined; space=name;}
    if(channels.length !== 3) return undefined;
  }
  let rgb: [number,number,number];
  if(fn === 'hsl' || fn === 'hsla') {
    if(!channels[1].endsWith('%') || !channels[2].endsWith('%')) return undefined;
    const h = hue(channels[0]), s = unit(channels[1]), l=unit(channels[2]);
    if(!Number.isFinite(h) || !(s>=0 && s<=1 && l>=0 && l<=1))return undefined;
    const result=fromHSL([h,s*100,l*100]); rgb=[result[0]/255,result[1]/255,result[2]/255];
  } else rgb=channels.map(s=>fn === 'color' || s.endsWith('%') ? unit(s) : number(s)/255) as typeof rgb;
  return createColorValue({space,channels:rgb,alpha});
}
/** Deterministic numeric round trip. Exact sRGB bytes retain legacy hex output. */
export function serializeColor(value: ColorValue): string {
  const color=createColorValue(value,true); if(!color)throw new TypeError('Invalid ColorValue.');
  const byte=(n:number)=>n>=0 && n<=1 && Math.round(n*255)/255 === n;
  if(color.space==='srgb' && color.channels.every(byte) && byte(color.alpha)) return toHex([...color.channels.map(n=>n*255),color.alpha] as [number,number,number,number]);
  const decimal=(n:number)=>Object.is(n,-0)?'0':String(n);
  return `color(${color.space} ${color.channels.map(decimal).join(' ')}${color.alpha===1?'':` / ${decimal(color.alpha)}`})`;
}
// D65 matrices and extended sRGB transfer curves from CSS Color 4 §19.
// https://www.w3.org/TR/css-color-4/#color-conversion-code
const toXYZ = {
  srgb:[[506752/1228815,87881/245763,12673/70218],[87098/409605,175762/245763,12673/175545],[7918/409605,87881/737289,1001167/1053270]],
  'display-p3':[[608311/1250200,189793/714400,198249/1000160],[35783/156275,247089/357200,198249/2500400],[0,32229/714400,5220557/5000800]],
};
const fromXYZ = {
  srgb:[[12831/3959,-329/214,-1974/3959],[-851781/878810,1648619/878810,36519/878810],[705/12673,-2585/12673,705/667]],
  'display-p3':[[446124/178915,-333277/357830,-72051/178915],[-14852/17905,63121/35810,423/17905],[11844/330415,-50337/660830,316169/330415]],
};
const multiply=(matrix:number[][],v:readonly number[])=>matrix.map(row=>row.reduce((sum,n,i)=>sum+n*v[i],0));
const linear=(n:number)=>Math.abs(n)<=.04045?n/12.92:Math.sign(n)*Math.pow((Math.abs(n)+.055)/1.055,2.4);
const encoded=(n:number)=>Math.abs(n)<=.0031308?n*12.92:Math.sign(n)*(1.055*Math.pow(Math.abs(n),1/2.4)-.055);
/** Convert via linear-light D65 XYZ without gamut mapping or clipping. */
export function convertColor(value: ColorValue, space: ColorSpace): ColorValue {
  const color=createColorValue(value,true); if(!color || !['srgb','display-p3'].includes(space))throw new TypeError('Invalid color or destination space.');
  if(color.space===space)return color;
  const channels=multiply(fromXYZ[space],multiply(toXYZ[color.space],color.channels.map(linear))).map(encoded) as [number,number,number];
  return createColorValue({space,channels,alpha:color.alpha},true)!;
}
/** Allows 1e-7 coordinate error at gamut boundaries, for matrix round trips. */
export function inGamut(color: ColorValue, space: ColorSpace = color.space): boolean {
  return convertColor(color,space).channels.every(n=>n>=-1e-7 && n<=1+1e-7);
}
/** Explicit lossy export policy: convert to sRGB and clip channels, preserving alpha. */
export function exportSRGB(value: ColorValue): {readonly color:ColorValue;readonly value:string;readonly clipped:boolean} {
  const converted=convertColor(value,'srgb'), clipped=!inGamut(converted);
  const color=createColorValue({...converted,channels:converted.channels.map(n=>Math.min(1,Math.max(0,n))) as [number,number,number]})!;
  return Object.freeze({color,value:serializeColor(color),clipped});
}
/** Paint-only fallback; output capability never changes the stored color. Pass support explicitly for SSR/tests. */
export function colorPaint(color: ColorValue, supportsP3 = typeof CSS !== 'undefined' && CSS.supports('color','color(display-p3 1 0 0)')): {fallback:string;value:string} {
  const exported=exportSRGB(color);
  const fallback=exported.value.startsWith('#') ? exported.value : `rgba(${exported.color.channels.map(n=>n*255).join(',')},${exported.color.alpha})`;
  return {fallback,value:color.space==='display-p3' && supportsP3 ? serializeColor(color) : fallback};
}
