import type { ResolvedTheme, ThemeCSSOptions } from './types.js';
import { resolveTheme } from './theme.js';
import { affectedTokens, flattenTokens, tokenDocument } from './graph.js';
import { customizationContracts } from './customization.js';
import { emitThemeCSS } from './css.js';
import { clone, deepFreeze, TokenError } from './value.js';

export interface ThemePatchOptions {
  /** Typed token values or aliases; explicitly listed values become local pins. */
  changes?: Readonly<Record<string, unknown>>;
  /** Registered CSS hook names to release locally, including CSS-only hooks. */
  clearOverrides?: readonly string[];
}
export interface ThemePatchPlan {
  readonly baseSourceHash: string;
  readonly theme: ResolvedTheme;
  readonly changedTokenIds: readonly string[];
  /** Declared at the destination; optional unpinned hooks are deliberately omitted. */
  readonly outputTokenIds: readonly string[];
  /** Transitive graph inputs for evaluation, not additional CSS declarations. */
  readonly evaluationTokenIds: readonly string[];
  readonly preservedPinTokenIds: readonly string[];
  readonly clearOverrides: readonly string[];
}

/** Plan a graph-aware local patch against an explicit effective base. This cannot
 * infer external CSS pins: those must be represented in the supplied base. */
export function createThemePatchPlan(base: ResolvedTheme, options: ThemePatchOptions = {}): ThemePatchPlan {
  const changes = clone(options.changes ?? {});
  const changed = new Set(Object.keys(changes));
  for (const id of changed) if (!Object.hasOwn(base.tokens,id)) throw new TokenError('unknown-token',`Unknown patch token ${id}.`,id);
  const contracts = new Map(customizationContracts(base).map(record => [record.cssName,record]));
  const clears = [...new Set(options.clearOverrides ?? [])].sort();
  const clearedIds = new Set<string>();
  const source = flattenTokens(base.sourceOverrides);
  const pins: Record<string,unknown> = clone(base.pins);
  for (const name of clears) {
    const contract = contracts.get(name);
    if (contract?.reset !== 'theme') throw new TokenError('invalid-clear',`${name} is not a registered optional theme override.`);
    if (contract.tokenId) {
      if (changed.has(contract.tokenId)) throw new TokenError('conflicting-clear',`${name} cannot be assigned and cleared in the same patch.`);
      clearedIds.add(contract.tokenId);
      delete pins[contract.tokenId];
      // Remove source-authored pins too. Custom optional extensions retain their
      // source definition because the default schema cannot reconstruct them.
      if (source[contract.tokenId]) {
        const defaults = resolveTheme({mode:base.mode,density:base.density});
        if (Object.hasOwn(defaults.tokens,contract.tokenId)) delete source[contract.tokenId];
      }
    }
  }
  const preserved = Object.keys(base.pins).filter(id => !changed.has(id) && !clearedIds.has(id)).sort();
  // Inherited alias pins are already computed at the base boundary. Freeze that
  // effective value in the evaluation graph; do not emit/rebind the pin locally.
  for (const id of preserved) pins[id] = clone(base.tokens[id].value);
  Object.assign(pins,changes);
  const theme = resolveTheme({name:base.name, mode:base.mode, density:base.density, source:tokenDocument(source), pins});
  // An optional hook becomes CSS-invalid when cleared. A graph token that
  // references it cannot simultaneously promise a resolved semantic value.
  for (const id of clearedIds) {
    if (Object.values(theme.tokens).some(token => token.dependencies.includes(id))) {
      throw new TokenError('clear-dependent',`Cannot clear ${id} while graph tokens depend on it; move their aliases to semantic inputs first.`,id);
    }
  }
  const roots = [...changed,...clearedIds];
  const affected = affectedTokens(theme,roots);
  const optional = new Set(customizationContracts(theme).filter(record => record.reset === 'theme').map(record => record.tokenId));
  const output = affected.filter(id => !clearedIds.has(id) && (changed.has(id) || !optional.has(id)));
  const evaluation = new Set<string>();
  function dependencies(id: string) {
    for (const dependency of theme.dependencies[id]) if (!evaluation.has(dependency)) {
      evaluation.add(dependency); dependencies(dependency);
    }
  }
  for (const id of output) dependencies(id);
  return deepFreeze({baseSourceHash:base.sourceHash,theme,changedTokenIds:[...changed].sort(),outputTokenIds:output,
    evaluationTokenIds:[...evaluation].sort(),preservedPinTokenIds:preserved,clearOverrides:clears});
}

/** Emission requires the same base identity reviewed by the caller. Appearance
 * is inherited, as with single-theme exact partials; a patch owns no new scheme. */
export function emitThemePatchCSS(plan: ThemePatchPlan, base: ResolvedTheme,
  options: Omit<ThemeCSSOptions,'kind'|'tokenIds'|'clearOverrides'|'colorScheme'> = {}): string {
  if (plan.baseSourceHash !== base.sourceHash) throw new TokenError('stale-base','Theme patch base changed; prepare and review a new plan.');
  return emitThemeCSS(plan.theme,{...options,kind:'partial',tokenIds:plan.outputTokenIds,clearOverrides:plan.clearOverrides,colorScheme:false});
}
