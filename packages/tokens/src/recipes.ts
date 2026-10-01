import type { ColorValue, DimensionValue, Recipe } from './types.js';
import { mixOklab, recommendForeground } from './color.js';
import { spacingSteps } from './source.js';
import { TokenError, validateValue } from './value.js';
import { accentMixWeights } from './recipe-data.js';
import { componentSizes, sizingRoles, sizeScaleToken } from './sizing.js';

export function deriveRhythm(base: DimensionValue): Record<string,DimensionValue> {
  validateValue('dimension',base);
  if (base.value <= 0) throw new TokenError('invalid-rhythm','Rhythm base must be positive.');
  return Object.fromEntries(Object.entries(spacingSteps).map(([step,multiplier]) => [step,{value:base.value*multiplier,unit:base.unit}]));
}
export function deriveInsetRadius(outer: DimensionValue, inset: DimensionValue): DimensionValue {
  validateValue('dimension',outer); validateValue('dimension',inset);
  if (outer.unit !== inset.unit) throw new TokenError('context-required','Mixed-unit radius subtraction requires a rendered context; use CSS calc()/max().');
  if (outer.value < 0 || inset.value < 0) throw new TokenError('invalid-radius','Outer radius and inset must be nonnegative.');
  return {value:Math.max(0,outer.value-inset.value),unit:outer.unit};
}
export function themeRecipes(): Record<string,Recipe> {
  const recipes: Record<string,Recipe> = {};
  recipes['focus.inset-offset'] = {
    version:'focus-inset/v1',dependencies:['focus.width'],
    evaluate:get => { const width = get('focus.width') as DimensionValue; return {value:-width.value,unit:width.unit}; },
    css:ref => `calc(0px - ${ref('focus.width')})`,
  };
  for (const [step,multiplier] of Object.entries(spacingSteps)) recipes[`space.${step}`] = {version:'rhythm/v1',dependencies:['rhythm.base'],evaluate:get => deriveRhythm(get('rhythm.base') as DimensionValue)[step],css:ref => `calc(${ref('rhythm.base')} * ${multiplier})`};
  for (const [role,base] of Object.entries(sizingRoles)) for (const size of componentSizes) {
    const scale = sizeScaleToken(role,size);
    const preserveBaseTextSize = role === 'font.metadata.size' || role === 'font.ui.size' || role === 'font.input.size';
    recipes[`${role}-${size}`] = {
      version:'sizing/v1',dependencies:[base,scale],
      evaluate:get => {
        const input = get(base) as DimensionValue; const factor = get(scale) as number;
        if (!Number.isFinite(factor) || factor <= 0) throw new TokenError('invalid-size-scale','Size scale must be a positive finite number.',scale);
        return {value:input.value*(preserveBaseTextSize ? Math.max(1,factor) : factor),unit:input.unit};
      },
      css:ref => preserveBaseTextSize ? `calc(${ref(base)} * max(1, ${ref(scale)}))` : `calc(${ref(base)} * ${ref(scale)})`,
    };
  }
  const mix = (id: string,other: string,weight: number) => { recipes[id] = {version:'accent/v1',dependencies:['color.action',other],evaluate:get => mixOklab(get('color.action') as ColorValue,get(other) as ColorValue,weight)}; };
  mix('color.action-hover','palette.emphasis',accentMixWeights.hover); mix('color.action-pressed','palette.emphasis',accentMixWeights.pressed);
  mix('color.accent-subtle','color.surface',accentMixWeights.subtle); mix('color.accent-border','color.surface',accentMixWeights.border);
  recipes['color.on-action'] = {version:'accent/v1',dependencies:['palette.foreground-light','palette.foreground-dark','color.action','color.action-hover','color.action-pressed'],evaluate:get => recommendForeground(['palette.foreground-light','palette.foreground-dark'].map(id => get(id) as ColorValue),['color.action','color.action-hover','color.action-pressed'].map(id => get(id) as ColorValue)).color};
  recipes['color.on-brand'] = {version:'brand/v1',dependencies:['palette.foreground-light','palette.foreground-dark','color.brand'],evaluate:get => recommendForeground(['palette.foreground-light','palette.foreground-dark'].map(id => get(id) as ColorValue),[get('color.brand') as ColorValue]).color};
  return recipes;
}
