import type { ColorValue } from './color-value.js';

/** HSV is an editing coordinate system within the color's encoded RGB space. */
export type HSV = readonly [hue: number, saturation: number, value: number];
export function toHSV(color: ColorValue, remembered: HSV = [0, 0, 0]): HSV {
  const [r,g,b]=color.channels, maximum=Math.max(r,g,b), minimum=Math.min(r,g,b), delta=maximum-minimum;
  const hue=delta===0 ? remembered[0] : ((maximum===r ? (g-b)/delta : maximum===g ? (b-r)/delta+2 : (r-g)/delta+4)*60+360)%360;
  return [hue,maximum===0 ? remembered[1] : delta/maximum*100,maximum*100];
}
export function fromHSV(model: ColorValue, [h,s,v]: HSV): ColorValue {
  const hue=((h%360)+360)%360/60, saturation=Math.min(100,Math.max(0,s))/100, value=Math.min(100,Math.max(0,v))/100;
  const chroma=value*saturation, x=chroma*(1-Math.abs(hue%2-1)), m=value-chroma;
  const rgb=hue<1 ? [chroma,x,0] : hue<2 ? [x,chroma,0] : hue<3 ? [0,chroma,x] : hue<4 ? [0,x,chroma] : hue<5 ? [x,0,chroma] : [chroma,0,x];
  return {...model,channels:rgb.map(channel=>Math.min(1,Math.max(0,channel+m))) as [number,number,number]};
}
