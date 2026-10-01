import type { ResolvedTheme } from './types.js';
import { emitThemeCSS } from './css.js';
import { affectedTokens } from './graph.js';
import { hashValue, sha256, stableStringify } from './hash.js';
import { clone, deepFreeze, TokenError } from './value.js';

export interface CandidateOptions {
  base: ResolvedTheme;
  theme: ResolvedTheme;
  title: string;
  rationale?: string;
  /** Caller-supplied evidence only. Nothing is marked passed implicitly. */
  evidence?: readonly {kind:string;status:'passed'|'failed'|'pending';artifact?:string}[];
}
export function createCandidate(options: CandidateOptions) {
  if (!options.title.trim()) throw new TokenError('missing-title','A candidate needs a review title.');
  const {base,theme} = options;
  const changedTokens = [...new Set([...Object.keys(base.tokens),...Object.keys(theme.tokens)])].filter(id => stableStringify(base.tokens[id] ?? null) !== stableStringify(theme.tokens[id] ?? null)).sort();
  const css = emitThemeCSS(theme);
  const source = stableStringify({tokens:theme.source,options:{name:theme.name,source:theme.sourceOverrides,pins:theme.pins,mode:theme.mode,density:theme.density}});
  const artifactHashes = {source:`sha256:${sha256(source)}`,css:`sha256:${sha256(css)}`};
  const id = `theme-${hashValue({base:base.sourceHash,candidate:theme.sourceHash,artifactHashes}).slice(7,31)}`;
  const changes = changedTokens.map(tokenId => ({tokenId,before:base.tokens[tokenId]?.value ?? null,after:theme.tokens[tokenId]?.value ?? null,beforeProvenance:base.tokens[tokenId]?.provenance ?? null,afterProvenance:theme.tokens[tokenId]?.provenance ?? null}));
  const affected = affectedTokens(theme,changedTokens.filter(tokenId => Object.hasOwn(theme.tokens,tokenId)));
  return deepFreeze({
    schemaVersion:1 as const,id,title:options.title,rationale:options.rationale ?? '',status:'prepared' as const,
    baseSourceHash:base.sourceHash,candidateSourceHash:theme.sourceHash,compilerVersion:theme.compilerVersion,
    theme:{name:theme.name,mode:theme.mode,density:theme.density},changedTokens,affectedTokens:affected,changes:clone(changes),artifactHashes,
    diagnostics:clone(theme.diagnostics),evidence:clone(options.evidence ?? []),
    artifacts:{'source.json':source,'theme.css':css,'changes.json':stableStringify(changes),'dependencies.json':stableStringify({active:theme.dependencies,potential:theme.potentialDependencies})}
  });
}
export function assertCandidateBase(candidate: {baseSourceHash:string}, current: ResolvedTheme): void {
  if (candidate.baseSourceHash !== current.sourceHash) throw new TokenError('stale-base','Candidate source changed after this proposal was prepared. Rebase and review the new candidate.');
}
