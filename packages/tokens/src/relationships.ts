import type { ColorValue } from './types.js';
import { contrastRatio } from './color.js';
import { deepFreeze, validateValue } from './value.js';

/** Nearest painted background first, ending at an explicitly known opaque surface. */
export interface RenderedRelationship {
  readonly id: string;
  readonly consumer: string;
  readonly state: string;
  readonly appearance: 'light' | 'dark';
  readonly foreground: ColorValue | null;
  readonly backgrounds: readonly ColorValue[];
  readonly minimum: number;
  /** Filters, gradients, images, blending and unresolved ancestors are unknown. */
  readonly unknownReason?: string;
}
export interface RelationshipResult {
  readonly id: string;
  readonly status: 'pass' | 'fail' | 'unknown';
  readonly ratio?: number;
  readonly reason?: string;
}
function over(front: ColorValue, back: ColorValue): ColorValue {
  const a = front.alpha ?? 1, b = back.alpha ?? 1, alpha = a + b * (1-a);
  return {colorSpace:'srgb',components:front.components.map((v,i) => alpha ? (v*a + back.components[i]*b*(1-a))/alpha : 0) as [number,number,number],alpha};
}
/** Rendered samples are evidence, not inferred from compiler token aliases. */
export function validateRenderedRelationships(samples: readonly RenderedRelationship[]): readonly RelationshipResult[] {
  return deepFreeze(samples.map(sample => {
    if (sample.unknownReason || !sample.foreground || !sample.backgrounds.length) return {id:sample.id,status:'unknown' as const,reason:sample.unknownReason ?? 'Missing foreground or compositing surface.'};
    try {
      if (!Number.isFinite(sample.minimum) || sample.minimum <= 0) throw new Error('A positive threshold is required.');
      validateValue('color',sample.foreground);
      sample.backgrounds.forEach(color => validateValue('color',color));
      let background = sample.backgrounds[sample.backgrounds.length-1];
      if ((background.alpha ?? 1) !== 1) return {id:sample.id,status:'unknown' as const,reason:'The outermost compositing surface is not opaque.'};
      for (let i=sample.backgrounds.length-2;i>=0;i--) background = over(sample.backgrounds[i],background);
      const ratio = contrastRatio(over(sample.foreground,background),background);
      return {id:sample.id,status:ratio >= sample.minimum ? 'pass' as const : 'fail' as const,ratio};
    } catch (error) { return {id:sample.id,status:'unknown' as const,reason:error instanceof Error ? error.message : 'Invalid color sample.'}; }
  }));
}
export const renderedRelationshipRoles = deepFreeze([
  {id:'field',states:['rest','hover','invalid','disabled'],minimum:4.5},
  {id:'option',states:['rest','hover','selected','selected-hover','pressed','disabled'],minimum:4.5},
  {id:'button',states:['primary','secondary','ghost','danger','hover','pressed','disabled'],minimum:4.5},
  {id:'link',states:['rest','hover','pressed'],minimum:4.5},
  {id:'status',states:['info','success','warning','danger'],minimum:4.5},
  {id:'toast',states:['info','success','warning','danger'],minimum:4.5},
  {id:'focus',states:['adjacent-inner','adjacent-outer'],minimum:3},
]);
