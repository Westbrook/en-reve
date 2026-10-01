import type { ThemeOptions } from './types.js';
import type { ThemeReviewDraft, ReviewDraftEnvelope, ReviewDraftMetadata } from './review-draft.js';
import { reopenReviewDraft } from './review-draft.js';
import { createThemePair, emitThemePairCSS, type ResolvedThemePair } from './theme-pair.js';
import { sha256, stableStringify } from './hash.js';
import { isRecord, TokenError } from './value.js';

/** The editor owns two independent draft histories. Pairing does not mutate either. */
export interface ThemeReviewPairDraft {
  readonly name: string;
  readonly light: ThemeReviewDraft;
  readonly dark: ThemeReviewDraft;
}
export interface ThemeReviewPairEnvelope {
  schema: 'en-reve/theme-review-pair';
  schemaVersion: 1;
  name: string;
  title: string;
  rationale: string;
  branches: {light: ReviewDraftEnvelope; dark: ReviewDraftEnvelope};
  pairSourceHash: string;
  compilerVersion: string;
  artifacts: {'theme.css': string};
  artifactHashes: {css: string};
}
export interface ThemeReviewPairOpenOptions {
  baseOptions?: {light?: ThemeOptions; dark?: ThemeOptions};
}
export interface OpenedThemeReviewPair extends ThemeReviewPairDraft {
  readonly theme: ResolvedThemePair;
  readonly title: string;
  readonly rationale: string;
}

export function exportThemeReviewPair(pair: ThemeReviewPairDraft, metadata: ReviewDraftMetadata): string {
  const theme = createThemePair({name:pair.name,light:pair.light.theme,dark:pair.dark.theme});
  const light = JSON.parse(pair.light.exportJSON(metadata)) as ReviewDraftEnvelope;
  const dark = JSON.parse(pair.dark.exportJSON(metadata)) as ReviewDraftEnvelope;
  const css = emitThemePairCSS(theme);
  return stableStringify({
    schema:'en-reve/theme-review-pair',schemaVersion:1,name:pair.name,
    title:metadata.title,rationale:metadata.rationale ?? '',branches:{light,dark},
    pairSourceHash:theme.sourceHash,compilerVersion:theme.compilerVersion,
    artifacts:{'theme.css':css},artifactHashes:{css:`sha256:${sha256(css)}`},
  } satisfies ThemeReviewPairEnvelope);
}

function exceedsByteLimit(value: string, limit: number): boolean {
  let bytes = 0;
  for (const character of value) {
    const code = character.codePointAt(0)!;
    bytes += code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0x10000 ? 3 : 4;
    if (bytes > limit) return true;
  }
  return false;
}

/** Rebuild both v1 drafts and all derived pair artifacts before accepting any bytes. */
export function reopenThemeReviewPair(json: string, options: ThemeReviewPairOpenOptions = {}): OpenedThemeReviewPair {
  if (typeof json !== 'string' || exceedsByteLimit(json, 16 * 1024 * 1024)) throw new TokenError('review-size', 'A paired review file must be at most 16 MiB.');
  let input: unknown;
  try { input = JSON.parse(json); } catch { throw new TokenError('review-schema', 'The paired review file is not valid JSON.'); }
  if (!isRecord(input) || input.schema !== 'en-reve/theme-review-pair' || input.schemaVersion !== 1) throw new TokenError('review-schema', 'Unsupported paired review format or version.');
  const allowed = ['schema','schemaVersion','name','title','rationale','branches','pairSourceHash','compilerVersion','artifacts','artifactHashes'];
  if (Object.keys(input).some(key => !allowed.includes(key)) || typeof input.name !== 'string' || typeof input.title !== 'string' || typeof input.rationale !== 'string'
    || !isRecord(input.branches) || Object.keys(input.branches).length !== 2 || !Object.hasOwn(input.branches,'light') || !Object.hasOwn(input.branches,'dark')) {
    throw new TokenError('review-schema', 'A paired review requires only the declared fields and both named branches.');
  }
  const light = reopenReviewDraft(JSON.stringify(input.branches.light), {baseOptions:options.baseOptions?.light});
  const dark = reopenReviewDraft(JSON.stringify(input.branches.dark), {baseOptions:options.baseOptions?.dark});
  const pair = {name:input.name,light,dark};
  const theme = createThemePair({name:pair.name,light:light.theme,dark:dark.theme});
  // Both imported branch envelopes were fully validated by their v1 reopener.
  const evidence = (input.branches.light as unknown as ReviewDraftEnvelope).candidate.evidence;
  const rebuilt = exportThemeReviewPair(pair, {title:input.title,rationale:input.rationale,evidence});
  if (stableStringify(input) !== rebuilt) throw new TokenError('review-artifact', 'Paired review source, metadata or artifacts do not match their regenerated values.');
  return {...pair,theme,title:input.title,rationale:input.rationale};
}
