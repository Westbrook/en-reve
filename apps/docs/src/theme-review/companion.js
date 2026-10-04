import { createThemeCompanion, hashValue } from '@en-reve/tokens';
import catalogue from '../generated/showcase-catalogue.js';

/** Trusted code-owned recipes are separate from the portable token envelope.
 * Regenerate from current edited tokens; imported CSS is never installed. */
export function presetCompanion(theme) {
 const recipe = catalogue.find(item => item.id === theme.name)?.companion;
 return recipe ? compilePresetCompanion(theme, recipe) : undefined;
}

export function compilePresetCompanion(theme, recipe) {
 const paired = 'light' in theme;
 const branches = paired ? [theme.light, theme.dark] : [theme];
 const parts = branches.map(branch => createThemeCompanion(branch, recipe, { name: theme.name }));
 let css = parts.map(part => part.css).join('');
 if (paired) {
  // The bounded compiler has explicit branch selectors. Add the same rules for
  // Both an omitted appearance and explicit Auto follow the media preference,
  // just like the paired token stylesheet. Keep boundary guards in each rule.
  css += parts.map((part, index) => `@media (prefers-color-scheme: ${index ? 'dark' : 'light'}) {\n${part.css.replaceAll(`[data-en-appearance="${index ? 'dark' : 'light'}"]`, ':is([data-en-appearance="auto"], :not([data-en-appearance]))')}\n}\n`).join('');
 }
 return {schemaVersion:1, recipe, css, identity:hashValue({parts:parts.map(part=>part.identity),css})};
}
