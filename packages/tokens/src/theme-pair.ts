import { themeScopeSelectors } from './scope.js';
import type { ResolvedTheme, ThemeCSSOptions, ThemeDensity } from './types.js';
import { collectThemeCSSDeclarations } from './css.js';
import { hashValue } from './hash.js';
import { deepFreeze, TokenError } from './value.js';

export interface ResolvedThemePair {
  readonly name: string;
  readonly light: ResolvedTheme;
  readonly dark: ResolvedTheme;
  readonly density: ThemeDensity;
  readonly compilerVersion: string;
  readonly sourceHash: string;
}

/** Pair independently resolved authored branches; no color inversion or pin copying. */
export function createThemePair(options: {name: string; light: ResolvedTheme; dark: ResolvedTheme}): ResolvedThemePair {
  const {name, light, dark} = options;
  if (typeof name !== 'string' || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name)) throw new TokenError('invalid-theme-name', 'Theme pair IDs must be lowercase kebab-case.');
  if (light.mode !== 'light' || dark.mode !== 'dark') throw new TokenError('invalid-pair-mode', 'A theme pair requires explicit light and dark branches in their matching positions.');
  if (light.density !== dark.density) throw new TokenError('pair-density', 'Paired branches must use the same density; coordinate a density edit before pairing.');
  if (light.compilerVersion !== dark.compilerVersion) throw new TokenError('pair-compiler', 'Paired branches must use the same token compiler.');
  const lightIds = Object.keys(light.tokens).sort(), darkIds = Object.keys(dark.tokens).sort();
  if (lightIds.length !== darkIds.length || lightIds.some((id, index) => id !== darkIds[index])) throw new TokenError('pair-schema', 'Paired branches must declare the same token IDs.');
  for (const id of lightIds) {
    if (light.tokens[id].type !== dark.tokens[id].type || light.tokens[id].cssName !== dark.tokens[id].cssName) {
      throw new TokenError('pair-schema', `Paired token ${id} must have the same type and CSS name.`, id);
    }
  }
  const sourceHash = hashValue({schema:'en-reve/theme-pair',schemaVersion:1,name,light:light.sourceHash,dark:dark.sourceHash,compilerVersion:light.compilerVersion});
  return deepFreeze({name,light,dark,density:light.density,compilerVersion:light.compilerVersion,sourceHash});
}

function declarations(values: ReadonlyMap<string, string>, indentation: string): string {
  return [...values].sort(([a],[b]) => a.localeCompare(b, 'en')).map(([name,value]) => `${indentation}${name}: ${value};`).join('\n');
}

/**
 * Every matching boundary owns data-en-appearance="auto|light|dark"; absent is auto.
 * Auto follows the document's preference rather than a forced ancestor boundary.
 * Shared aliases retain public var() references. Only reference-free colors are
 * joined: joining different alias graphs can create CSS cycles, and an invalid
 * variable in an unused light-dark() branch can invalidate the entire value.
 */
export function emitThemePairCSS(pair: ResolvedThemePair, options: ThemeCSSOptions = {}): string {
  // Validate the pair even when a structurally typed caller did not use the factory.
  const checked = createThemePair(pair);
  if (checked.sourceHash !== pair.sourceHash) throw new TokenError('pair-identity', 'The paired theme identity does not match its branches.');
  const kind = options.kind ?? 'full';
  const { boundary, auto, light: explicitLight, dark: explicitDark } = themeScopeSelectors(pair.name, options);
  const light = collectThemeCSSDeclarations(pair.light, options);
  const dark = collectThemeCSSDeclarations(pair.dark, options);
  const darkChanges = new Map([...dark].filter(([name,value]) => value !== light.get(name)));
  const joined = new Map<string,string>();
  const tokensByCSSName = new Map(Object.values(pair.light.tokens).map(token => [token.cssName,token]));
  for (const [name,darkValue] of darkChanges) {
    const lightValue = light.get(name)!;
    if (tokensByCSSName.get(name)?.type === 'color' && lightValue !== 'initial' && darkValue !== 'initial'
      && !/\bvar\s*\(/i.test(lightValue) && !/\bvar\s*\(/i.test(darkValue)) {
      joined.set(name, `light-dark(${lightValue}, ${darkValue})`);
    }
  }
  const lines = [
    `/* @en-reve/tokens ${pair.compilerVersion}; ${pair.sourceHash}; paired ${kind} */`,
    '@layer en.tokens {',
    `  ${boundary} {`,
    '    color-scheme: light dark;',
    declarations(light, '    '),
    '  }',
  ];
  if (darkChanges.size) lines.push(
    '  @media (prefers-color-scheme: dark) {',
    `    ${auto} {`,
    declarations(darkChanges, '      '),
    '    }',
    '  }',
  );
  lines.push(`  ${explicitLight} { color-scheme: light; }`, `  ${explicitDark} {`, '    color-scheme: dark;');
  if (darkChanges.size) lines.push(declarations(darkChanges, '    '));
  lines.push('  }');
  if (joined.size) lines.push(
    '  @supports (color: light-dark(white, black)) {',
    `    ${boundary} {`,
    declarations(joined, '      '),
    '    }',
    '  }',
  );
  lines.push('}', '');
  return lines.join('\n');
}
