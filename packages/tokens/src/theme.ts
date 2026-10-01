import type { ColorValue, ResolvedTheme, ThemeDiagnostic, ThemeOptions } from './types.js';
import { contrastRatio } from './color.js';
import { canonicalDerivedNumber, derivedPrecision } from './derived.js';
import { flattenTokens, resolveTokens, tokenDocument } from './graph.js';
import { hashValue } from './hash.js';
import { themeRecipes } from './recipes.js';
import { compilerVersion, createSourceTokens, densityNames } from './source.js';
import { clone, deepFreeze, TokenError } from './value.js';
import { unknownComponentHooks } from './authoring.js';
import { assertThemeCustomizationProperty } from './customization.js';

export function resolveTheme(options: ThemeOptions = {}): ResolvedTheme {
  const mode = options.mode ?? 'light'; const density = options.density ?? 'comfortable';
  if (!['light','dark'].includes(mode)) throw new TokenError('unsupported-context',`Unknown color mode ${mode}.`);
  if (!(densityNames as readonly string[]).includes(density)) throw new TokenError('unsupported-context',`Unknown density ${density}.`);
  const name = options.name ?? (density === 'comfortable' ? mode : `${mode}-${density}`);
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name)) throw new TokenError('invalid-theme-name','Theme IDs must be lowercase kebab-case.');
  const base = flattenTokens(createSourceTokens(mode,density));
  const overrides = options.source ? flattenTokens(options.source) : {};
  const source = tokenDocument({...base,...overrides});
  const recipes = themeRecipes();
  const pins: Record<string,unknown> = {};
  for (const id of Object.keys(overrides)) if (Object.hasOwn(recipes,id) || id.startsWith('component.')) pins[id] = clone(overrides[id].$value);
  Object.assign(pins,clone(options.pins ?? {}));
  const graph = resolveTokens(source,{pins,recipes});
  for (const token of Object.values(graph.tokens)) assertThemeCustomizationProperty(token.cssName,token.id);
  const diagnostics: ThemeDiagnostic[] = [];
  const pairs = [['color.text','color.surface'],['color.text-muted','color.surface'],['color.on-brand','color.brand'],['color.on-action','color.action'],['color.on-action','color.action-hover'],['color.on-action','color.action-pressed']];
  for (const [foreground,background] of pairs) {
    try {
      const measured = contrastRatio(graph.tokens[foreground].value as ColorValue,graph.tokens[background].value as ColorValue);
      if (measured < 4.5) diagnostics.push({code:'text-contrast',tokens:[foreground,background],message:'This declared ordinary-text pair is below 4.5:1. Review rendered use; this is not a complete accessibility assessment.',measured:canonicalDerivedNumber(measured)});
    } catch (error) {
      if (!(error instanceof TokenError)) throw error;
      diagnostics.push({code:'contrast-context',tokens:[foreground,background],message:error.message});
    }
  }
  if (options.warnUnknownComponentHooks) diagnostics.push(...unknownComponentHooks(graph));
  const recipeVersions = Object.fromEntries(Object.entries(recipes).map(([id,recipe]) => [id,recipe.version]));
  const sourceHash = hashValue({name,source,sourceOverrides:options.source ?? {},pins,mode,density,recipeVersions,recipeResultPrecision:derivedPrecision,compilerVersion});
  return deepFreeze({...graph,name,mode,density,source:clone(source),sourceOverrides:clone(options.source ?? {}),pins,sourceHash,compilerVersion,diagnostics});
}
