import { colorFromHex, resolveTheme, emitThemeCSS } from '@en-reve/tokens';
import type { ThemeMode, ThemeOptions, ThemeDensity } from '@en-reve/tokens';
export const directions = ['editorial', 'precision', 'studio'] as const;
export type Direction = typeof directions[number];
export const titles: Record<Direction,string> = {editorial:'Editorial workspace',precision:'Precision instrument',studio:'Expressive studio'};
const dim = (value:number) => ({value,unit:'rem'});
const palettes = {
 editorial: {light:['#f3eee3','#fffcf5','#e9e1d2','#28281f','#635f52','#76715f','#476040','#e3ebdc'],dark:['#191d18','#242b22','#30382c','#f3f0df','#c2c7b3','#8c9780','#b5d5a0','#35472f']},
 precision: {light:['#edf2f4','#ffffff','#e3ebee','#142a32','#465d66','#667f89','#005b78','#d6eef6'],dark:['#09191f','#10262f','#1b333d','#e3f3f7','#abc7d0','#728f9a','#79d8fa','#234650']},
 studio: {light:['#f2eefa','#ffffff','#e7def4','#2e2045','#665374','#8b719f','#6937b2','#e7dcfb'],dark:['#20162d','#302140','#413052','#f8edff','#d3bde5','#a58abd','#d2adff','#553571']},
};
/** Portable typed baselines. Font stacks use locally installed faces; no remote font dependency. */
export function themeOptions(direction:Direction, mode:ThemeMode='light', density?:ThemeDensity):ThemeOptions {
 const index=directions.indexOf(direction);const colors=palettes[direction][mode];
 const pins:Record<string,unknown>={};
 ['canvas','surface','surface-subtle','text','text-muted','boundary','action','selected'].forEach((role,i)=>pins[`color.${role}`]=colorFromHex(colors[i]));
 pins['color.surface-raised']=pins['color.surface'];pins['color.line']=pins['color.boundary'];
 pins['color.brand']=pins['color.action'];pins['color.focus']=pins['color.action'];
 pins['rhythm.base']=dim([.3125,.1875,.25][index]);
 pins['radius.control']=dim([.25,.125,1][index]);pins['radius.container']=dim([.5,.125,1.75][index]);
 pins['radius.dialog']=dim([.5,.25,2][index]);
 pins['font.body.family']=direction==='editorial'?['Georgia','serif']:['system-ui','sans-serif'];
 pins['font.ui.family']=direction==='precision'?['ui-monospace','monospace']:['system-ui','sans-serif'];
 pins['font.data.family']=['ui-monospace','monospace'];
 for(const role of ['small','medium','large']) {
  pins[`font.heading-${role}.family`]=direction==='editorial'?['Georgia','serif']:['system-ui','sans-serif'];
  pins[`font.heading-${role}.weight`]=[400,650,800][index];
 }
 pins['font.heading-large.size']=dim([2.5,1.875,2.75][index]);
 pins['font.body.line-height']=[1.7,1.5,1.6][index];
 pins['component.option.selected-font-weight']=[600,750,800][index];
 pins['focus.width']={value:direction==='studio'?3:2,unit:'px'};
 pins['focus.offset']={value:direction==='precision'?1:3,unit:'px'};
 pins['focus.halo-width']={value:direction==='studio'?4:0,unit:'px'};
 pins['color.focus-halo']={...colorFromHex(colors[6]),alpha:.2};
 pins['component.input.focus-accent-width']={value:direction==='precision'?2:0,unit:'px'};
 for(const phase of ['enter','exit']) pins[`duration.focus-${phase}`]={value:direction==='studio'?140:0,unit:'ms'};
 pins['shadow.overlay']={color:{...colorFromHex('#000000'),alpha:direction==='studio'?.22:.08},offsetX:{value:0,unit:'px'},offsetY:{value:direction==='studio'?12:0,unit:'px'},blur:{value:direction==='studio'?28:0,unit:'px'},spread:{value:0,unit:'px'}};
 return {name:direction,mode,density:density??(['spacious','compact','comfortable'] as const)[index],pins};
}
/** All six variants; unchanged markup opts into one boundary. Native controls inherit color-scheme. */
export function themeStylesheet():string {
 return directions.flatMap(direction=>(['light','dark'] as const).map(mode=>emitThemeCSS(resolveTheme(themeOptions(direction,mode)),{selector:`[data-proof-theme="${direction}"][data-appearance="${mode}"]`,colorScheme:true}))).join('\n')+partStyles;
}
/** Maintained public Part treatment; bundled in CSS export, separate from typed review JSON. */
export const partStyles = `
.proof-surface en-card::part(base) { box-shadow:var(--en-shadow-overlay); }
@media (forced-colors:active) { .proof-surface en-card::part(base) { box-shadow:none; } }
`;
