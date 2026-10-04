import type { EditorDescriptor, ResolvedTheme } from './types.js';
import { affectedTokens } from './graph.js';
import { stableStringify } from './hash.js';
import { rhythmChoices } from './source.js';
import { aliasTarget, isRecord, TokenError, validateValue } from './value.js';
import { customizationContracts } from './customization.js';

const managedAlphaRoles = new Set([
  'color.scrim',
  'component.toast.border-color',
  ...['info','success','warning','danger'].map(variant => `component.toast.${variant}-border-color`),
  'color.focus-halo',
  ...['button','input','option','overlay'].map(family => `component.${family}.focus-halo-color`),
  'component.option-list.background',
  'component.option-list.border-color',
  'component.option.rest-background',
  'component.option.hover-background',
  'component.option.active-background',
  'component.option.pressed-background',
  'component.option.selected-background',
  'component.option.disabled-background',
]);

/** Managed choices are authoring guidance, never an accessibility certificate. */
export function editorDescriptor(theme: ResolvedTheme, id: string): EditorDescriptor {
  const token = theme.tokens[id];
  if (!token) throw new TokenError('unknown-token',`Unknown editor token ${id}.`,id);
  const dependents = new Set(affectedTokens(theme,[id]));
  const aliasTargets = Object.values(theme.tokens).filter(candidate => candidate.type === token.type && candidate.id !== id && !dependents.has(candidate.id)).map(candidate => candidate.id).sort();
  const base = {tokenId:id,cssName:token.cssName,aliasTargets,supportsPin:true as const};
  switch (token.type) {
    case 'color': return {...base,kind:'color',alpha:managedAlphaRoles.has(id)};
    case 'dimension': {
      let choices: unknown[];
      if (id === 'motion.surface-offset') choices = [0,2,4,8].map(value => ({value,unit:'px'}));
      else if ((id === 'motion.press-offset' || id.endsWith('.pressed-offset') || id.endsWith('.popup-pressed-offset'))) choices = [-2,-1,0,1,2].map(value => ({value,unit:'px'}));
      else if (id === 'focus.scroll-margin-block' || id === 'focus.scroll-margin-inline') choices = [0,0.25,0.5,0.75,1,1.5,2].map(value => ({value,unit:'rem'}));
      else if (id === 'rhythm.base') choices = rhythmChoices.map(value => ({value,unit:'rem'}));
      else if (id === 'size.target-min') choices = [24,28,32,40,44,48].map(value => ({value,unit:'px'}));
      else if (id === 'component.control.min-size') choices = [24,28,32,40,44,48,56].map(value => ({value,unit:'px'})).concat([2,2.5,2.75,3,3.5].map(value => ({value,unit:'rem'})));
      else if (id === 'size.target-touch') choices = [2.75,3,3.5,4].map(value => ({value,unit:'rem'}));
      else if (['component.color-slider.track-size','component.color-slider.thumb-size'].includes(id)) choices = [1,1.25,1.5,1.75,2,2.25,2.5].map(value => ({value,unit:'rem'}));
      else if (id === 'component.color-slider.checker-size') choices = [.25,.375,.5,.75,1].map(value => ({value,unit:'rem'}));
      else if (id === 'component.color-picker.inline-size') choices = [16,18,20,22,24,28,32].map(value => ({value,unit:'rem'}));
      else if (id === 'component.color-picker.preview-size') choices = [2,2.5,3,3.5,4].map(value => ({value,unit:'rem'}));
      else if (id === 'component.editor-token.min-size') choices = [1.5,1.75,2,2.25,2.5,2.75,3].map(value => ({value,unit:'rem'}));
      else if (id === 'component.toast-region.width') choices = [18.25,21,22.25,24,25,30].map(value => ({value,unit:'rem'}));
      else if (['component.control.inline-padding','component.surface.padding','component.button.inline-padding','component.input.inline-padding'].includes(id)) choices = ['0','1','1-5','2','2-5','3','4','5','6'].map(step => theme.tokens[`space.${step}`].value);
      else if (id === 'component.menu.min-inline-size') choices = [0,96,120,138,160,200,240,320].map(value => ({value,unit:'px'})).concat([8,10,12,16,20].map(value => ({value,unit:'rem'})));
      else if (id === 'component.menu.max-inline-size') choices = [138,200,240,300,320,400,448,600].map(value => ({value,unit:'px'})).concat([16,20,24,28,32,40].map(value => ({value,unit:'rem'})));
      else if (id === 'component.pagination.gap' || id === 'component.pagination.status-gap') choices = ['0','0-5','1','1-5','2','2-5','3','4'].map(step => theme.tokens[`space.${step}`].value);
      else if (id === 'component.pagination.page-min-inline-size') choices = [2,2.25,2.5,2.75,3,3.5,4].map(value => ({value,unit:'rem'}));
      else if (['component.color-picker.gap','component.editor-token.inline-padding','component.editor-token.block-padding','component.editor-token.gap','component.toast.padding','component.toast-region.gap','component.option.inline-padding','component.option.block-padding','component.option-list.padding','component.option-list.gap'].includes(id)) choices = ['0','0-5','1','1-5','2','2-5','3','4','5','6'].map(step => theme.tokens[`space.${step}`].value);
      else if (id === 'component.segmented-control.frame-inset') choices = ['0','0-5','1','1-5','2'].map(step => theme.tokens[`space.${step}`].value);
      else if (id === 'focus.halo-width' || id === 'focus.accent-width' || /\.focus-(halo-width|accent-width)$/.test(id)) choices = [0,1,2,3,4].map(value => ({value,unit:'px'}));
      else if (id === 'focus.inset-offset' || /\.focus-offset$/.test(id)) choices = [-4,-3,-2,-1,0,1,2,3,4].map(value => ({value,unit:'px'}));
      else if (/\.focus-width$/.test(id)) choices = [1,2,3,4].map(value => ({value,unit:'px'}));
      else if (id.startsWith('space.')) choices = Object.values(theme.tokens).filter(t => /^space\.[0-9]/.test(t.id)).map(t => t.value);
      else if (id.startsWith('radius.') || ['component.control.radius','component.surface.radius','component.color-slider.radius','component.color-picker.preview-radius','component.editor-token.radius','component.toast.radius','component.button.radius','component.input.radius','component.rating.star-radius','component.option.radius','component.option-list.radius'].includes(id)) {
        choices = [0,0.25,0.375,0.5,0.625,0.75,1,1.125,1.25,1.5,2].map(value => ({value,unit:'rem'})).concat([{value:9999,unit:'px'}]);
        if (id === 'component.control.radius' || id === 'component.surface.radius') choices.push(...[0,4,8,12,16,24,32].map(value => ({value,unit:'px'})));
        if (id === 'component.option.radius' || id === 'component.option-list.radius') choices.push({value:0.875,unit:'rem'});
        if (id === 'component.button.radius') {
          // Retain the previous generic choices for any code-authored baseline.
          const current = token.value as {value:number;unit:string};
          choices.push(...[0.75,1,1.25,1.5].map(scale => ({value:current.value*scale,unit:current.unit})));
        }
      }
      else if (id.endsWith('.tracking')) choices = [-1,-0.5,0,0.25,0.5,1,2].map(value => ({value,unit:'px'}));
      else if (id.includes('font.') && id.endsWith('.size')) choices = Object.values(theme.tokens).filter(t => t.id.startsWith('font.') && t.id.endsWith('.size')).map(t => t.value);
      else if (['border.width','border.invalid-width','focus.width','focus.offset','size.spinner-stroke','size.choice-mark-stroke','size.tab-indicator','size.quote-border','component.input.border-width','component.input.invalid-border-width','size.navigation-indicator','component.navigation.current-indicator-width'].includes(id)) choices = (id === 'focus.offset' || id.endsWith('indicator-width') || id === 'size.navigation-indicator' ? [0,1,2,3,4] : [1,2,3,4]).map(value => ({value,unit:'px'}));
      else {
        const current = token.value as {value:number;unit:string};
        choices = [0.75,1,1.25,1.5].map(scale => ({value:current.value*scale,unit:current.unit}));
        if (id === 'size.icon') choices.push({value:1,unit:'rem'});
      }
      return {...base,kind:'dimension',units:['px','rem'],choices:unique(choices)};
    }
    case 'number': return {...base,kind:'number',choices:['calendar.hover-opacity','calendar.pressed-opacity'].includes(id) ? [0,0.06,0.08,0.10,0.12,0.16,0.20,0.24] : (id === 'component.slider-thumb.pressed-scale' || id === 'component.color-plane-thumb.pressed-scale') ? [0.9,0.98,1,1.1,1.25] : (id === 'motion.press-scale' || id.endsWith('.pressed-scale') || id.endsWith('.popup-pressed-scale')) ? [0.9,0.95,0.98,1] : id === 'motion.surface-scale' ? [0.95,0.98,1] : id.startsWith('size.scale-') ? [0.75,0.875,1,1.125,1.25,1.5] : id.startsWith('size.type-scale-') ? [0.9375,1,1.0625,1.125,1.25] : id.endsWith('.line-height') ? [1.2,1.25,1.3,4/3,11/8,1.4,10/7,1.5,1.6,1.75,2] : id === 'layout.prose-max' ? [45,55,66,75] : [token.value]};
    case 'fontFamily': return {...base,kind:'font-family',choices:unique(Object.values(theme.tokens).filter(t => t.type === 'fontFamily').map(t => t.value))};
    case 'fontStyle': return {...base,kind:'font-style',choices:['normal','italic','oblique']};
    case 'fontWeight': return {...base,kind:'font-weight',choices:[400,500,600,700]};
    case 'duration': return {...base,kind:'duration',units:['ms'],min:0,max:id === 'duration.spin'?2000:(['duration.press','duration.release'].includes(id) || id.endsWith('.press-duration') || id.endsWith('.release-duration'))?200:500,step:id === 'duration.spin'?100:(id.startsWith('duration.focus-') || id === 'duration.enter' || id === 'duration.exit')?10:20};
    case 'cubicBezier': return {...base,kind:'bezier',min:0,max:1};
    case 'shadow': return {...base,kind:'shadow',choices:unique(Object.values(theme.tokens).filter(t => t.type === 'shadow').map(t => t.value))};
  }
}
function unique(values: readonly unknown[]): unknown[] { return [...new Map(values.map(value => [stableStringify(value),value])).values()]; }
export function managedEditors(theme: ResolvedTheme): Record<string,EditorDescriptor> {
  return Object.fromEntries(customizationContracts(theme).filter(contract => contract.managed.supported && contract.tokenId)
    .map(contract => contract.tokenId!).sort().map(id => [id,editorDescriptor(theme,id)]));
}
export function validateManagedValue(theme: ResolvedTheme, id: string, value: unknown): void {
  const descriptor = editorDescriptor(theme,id);
  const alias = aliasTarget(value);
  if (alias) { if (!descriptor.aliasTargets.includes(alias)) throw new TokenError('managed-choice',`${id}: this alias is incompatible or cyclic.`,id); return; }
  validateValue(theme.tokens[id].type,value,id);
  if (descriptor.choices && !descriptor.choices.some(choice => stableStringify(choice) === stableStringify(value))) throw new TokenError('managed-choice',`${id}: choose one of the managed values or customize in code.`,id);
  if (descriptor.kind === 'color' && !descriptor.alpha && isRecord(value) && (value.alpha ?? 1) !== 1) throw new TokenError('managed-choice',`${id}: this managed color control uses opaque colors.`,id);
  if (descriptor.kind === 'bezier' && Array.isArray(value) && value.some(coordinate => coordinate < descriptor.min! || coordinate > descriptor.max!)) throw new TokenError('managed-choice',`${id}: managed curve coordinates must be within the declared interval.`,id);
  if (descriptor.kind === 'duration' && isRecord(value)) {
    const amount = value.value as number;
    if (value.unit !== 'ms' || amount < descriptor.min! || amount > descriptor.max! || amount % descriptor.step! !== 0) throw new TokenError('managed-choice',`${id}: duration is outside the managed interval/step.`,id);
  }
}
