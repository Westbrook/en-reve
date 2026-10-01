import type { ResolvedTheme, ThemeCSSOptions } from './types.js';
import { TokenError } from './value.js';
import { styleOverrideNames } from './overrides.js';
import { themeScopeSelectors } from './scope.js';
import { assertThemeCustomizationProperty, customizationContracts } from './customization.js';

/** Internal shared declaration policy; preserve full resets and explicit partial selections. */
export function collectThemeCSSDeclarations(theme: ResolvedTheme, options: ThemeCSSOptions = {}): Map<string,string> {
  const kind = options.kind ?? 'full';
  if (kind === 'partial' && !options.tokenIds) throw new TokenError('missing-selection','Partial output requires explicit tokenIds.');
  const ids = kind === 'partial' ? [...new Set(options.tokenIds)].sort() : Object.keys(theme.tokens).sort();
  const declarations = new Map<string,string>();
  for (const id of ids) {
    const token = theme.tokens[id];
    if (!token) throw new TokenError('unknown-token',`Unknown CSS token ${id}.`,id);
    assertThemeCustomizationProperty(token.cssName,id);
    const isComponent = id.startsWith('component.');
    declarations.set(token.cssName,isComponent && kind === 'full' && token.provenance !== 'pin' && token.provenance !== 'literal' ? 'initial' : token.cssExpression);
  }
  if (kind === 'full') for (const name of [...styleOverrideNames,...(options.componentOverrides ?? [])]) {
    if (!/^--en-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) throw new TokenError('invalid-css-name',`Invalid component override name ${name}.`);
    assertThemeCustomizationProperty(name);
    if (!declarations.has(name)) declarations.set(name,'initial');
  }
  if (options.clearOverrides?.length) {
    if (kind !== 'partial') throw new TokenError('full-clear','Explicit clears require partial output; full output already owns its resets.');
    const contracts = new Map(customizationContracts(theme).map(record => [record.cssName, record]));
    for (const name of new Set(options.clearOverrides)) {
      if (contracts.get(name)?.reset !== 'theme') throw new TokenError('invalid-clear',`${name} is not a registered optional theme override.`);
      if (declarations.has(name)) throw new TokenError('conflicting-clear',`${name} cannot be assigned and cleared in the same partial.`);
      declarations.set(name, 'initial');
    }
  }
  return declarations;
}

export function emitThemeCSS(theme: ResolvedTheme, options: ThemeCSSOptions = {}): string {
  const kind = options.kind ?? 'full';
  const scope = themeScopeSelectors(theme.name, options);
  const selector = options.selector ?? scope.boundary;
  if (/[{}\u0000]/.test(selector)) throw new TokenError('invalid-selector','Selector must not include a rule body.');
  if (options.colorScheme && kind !== 'full') throw new TokenError('partial-color-scheme','A partial single-theme override must inherit its color scheme.');
  const declarations = collectThemeCSSDeclarations(theme, options);
  const scheme = options.colorScheme ? `    color-scheme: ${theme.mode};\n` : '';
  return `/* @en-reve/tokens ${theme.compilerVersion}; ${theme.sourceHash}; ${kind} */\n@layer en.tokens {\n  ${selector} {\n${scheme}${[...declarations].sort(([a],[b]) => a.localeCompare(b,'en')).map(([name,value]) => `    ${name}: ${value};`).join('\n')}\n  }\n}\n`;
}
