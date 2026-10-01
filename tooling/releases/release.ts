import {diffPublicGraph} from './graph-diff.ts';
import { diffCem } from './cem-diff.ts';
import { diffPublicApi } from './type-diff.ts';
import type { TypeSnapshotPair } from './type-diff.ts';
import type { ChangeLevel } from './cem-diff.ts';
import { assertDigest, digestJson } from '../evidence/identity.ts';
import type { Digest } from '../evidence/identity.ts';

export interface EvidenceLink {
  kind: 'old-new-demo' | 'sticker-sheet' | 'candidate-docs' | 'visual-diff' | 'behavior' | 'accessibility' | 'performance' | 'other';
  label: string;
  href: string;
  /** A link remains mutable unless its exact evidence content is also identified. */
  digest?: Digest;
  status: 'available' | 'not-run' | 'unsupported';
  reason?: string;
}

export interface DeclaredChange {
  id: string;
  components: string[];
  tokens?: string[];
  level: ChangeLevel;
  summary: string;
  rationale: string;
  migration?: string;
  replacement?: string;
  plannedRemoval?: string;
  evidence: EvidenceLink[];
  /** Explicit reviewed classification of particular facts, not an automatic compatibility claim. */
  cemFactIds?: string[];
  affected?: 'direct' | 'inherited';
}

export interface ComponentHistory {
  introducedIn: string;
  lastChangedIn: string;
  releasedIn: string;
}

export interface ReleaseInput {
  schemaVersion: 1;
  packageTrain: string[];
  baseVersion: string;
  baseArtifacts: Record<string, Digest>;
  candidateArtifacts: Record<string, Digest>;
  changes: DeclaredChange[];
  componentHistory?: Record<string, ComponentHistory>;
  /** Explicit stabilization request. The resulting draft still requires stability review. */
  stabilize?: boolean;
  sample?: boolean;
}

const severity: Record<ChangeLevel, number> = { fix: 1, feature: 2, deprecation: 3, removal: 4, breaking: 4 };
export type VersionBump = 'none' | 'initial-y' | 'initial-x' | 'patch' | 'minor' | 'major' | 'stabilize';

export function parseVersion(version: string): [number, number, number] {
  const segments = version.split('.');
  if (segments.length !== 3 || segments.some(segment => !segment || [...segment].some(character => !'0123456789'.includes(character)) ||
    (segment.length > 1 && segment[0] === '0') || !Number.isSafeInteger(Number(segment)))) {
    throw new TypeError(`Expected a plain x.y.z version, received ${version}. Prerelease/build labels need an explicit future policy.`);
  }
  return segments.map(Number) as [number, number, number];
}

export function nextVersion(base: string, changes: ChangeLevel[], stabilize = false): { version: string; bump: VersionBump } {
  const [major, minor, patch] = parseVersion(base);
  if (changes.some(level => !Object.hasOwn(severity, level))) throw new TypeError('Unknown release change level.');
  if (stabilize) {
    if (major !== 0) throw new Error('Stabilization is only valid for 0.x.y.');
    return { version: '1.0.0', bump: 'stabilize' };
  }
  if (!changes.length) return { version: base, bump: 'none' };
  const level = Math.max(...changes.map(change => severity[change]));
  const format = (a: number, b: number, c: number) => {
    if (![a, b, c].every(Number.isSafeInteger)) throw new RangeError('Version increment exceeds safe integer range.');
    return `${a}.${b}.${c}`;
  };
  if (major === 0) return level >= 3
    ? { version: format(0, minor + 1, 0), bump: 'initial-x' }
    : { version: format(0, minor, patch + 1), bump: 'initial-y' };
  if (level >= 4) return { version: format(major + 1, 0, 0), bump: 'major' };
  if (level >= 2) return { version: format(major, minor + 1, 0), bump: 'minor' };
  return { version: format(major, minor, patch + 1), bump: 'patch' };
}

function requireText(value: unknown, label: string): asserts value is string {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${label} requires nonempty text.`);
}

function validateInput(input: ReleaseInput): void {
  if (input.schemaVersion !== 1) throw new TypeError('Unknown release-input schema.');
  parseVersion(input.baseVersion);
  if (!Array.isArray(input.packageTrain) || !input.packageTrain.length) throw new TypeError('Package train must list installable packages.');
  input.packageTrain.forEach(value => requireText(value, 'Package name'));
  for (const [label, artifacts] of [['base', input.baseArtifacts], ['candidate', input.candidateArtifacts]] as const) {
    if (!artifacts || typeof artifacts !== 'object' || Array.isArray(artifacts) || !Object.keys(artifacts).length) {
      throw new TypeError(`Release ${label} requires content-addressed artifacts.`);
    }
    Object.values(artifacts).forEach(assertDigest);
  }
  if (!Array.isArray(input.changes)) throw new TypeError('Release changes must be an array.');
  const ids = new Set<string>();
  for (const change of input.changes) {
    requireText(change.id, 'Change id');
    if (ids.has(change.id)) throw new Error(`Duplicate change id: ${change.id}`);
    ids.add(change.id);
    if (!Object.hasOwn(severity, change.level)) throw new TypeError(`Unknown change level: ${change.level}`);
    requireText(change.summary, 'Change summary');
    requireText(change.rationale, 'Change rationale');
    if (!Array.isArray(change.components) || !change.components.length) throw new TypeError(`Change ${change.id} must identify affected components or $package.`);
    change.components.forEach(value => requireText(value, 'Affected component'));
    if (!Array.isArray(change.evidence)) throw new TypeError(`Change ${change.id} needs an evidence array, even when empty.`);
    for (const evidence of change.evidence) {
      requireText(evidence.label, 'Evidence label');
      requireText(evidence.href, 'Evidence location');
      if (!['available', 'not-run', 'unsupported'].includes(evidence.status)) throw new TypeError('Unknown evidence status.');
      if (evidence.digest) assertDigest(evidence.digest);
      if (evidence.status !== 'available') requireText(evidence.reason, 'Evidence gap reason');
    }
    if (change.plannedRemoval) parseVersion(change.plannedRemoval);
  }
  for (const history of Object.values(input.componentHistory ?? {})) {
    [history.introducedIn, history.lastChangedIn, history.releasedIn].forEach(parseVersion);
  }
}

export interface ReviewIssue {
  code: 'cem-gap' | 'unclassified-fact' | 'unexplained-fact' | 'understated-change' | 'missing-evidence' | 'unidentified-evidence' | 'migration-guidance' | 'stabilization' | 'sample';
  message: string;
  changeId?: string;
  factId?: string;
}

export function createRelease(input: ReleaseInput, beforeCem: unknown, afterCem: unknown, types?: TypeSnapshotPair) {
  validateInput(input);
  const cem = types?.graphs ? diffPublicGraph(beforeCem,afterCem,types.graphs.before,types.graphs.after) : types ? diffPublicApi(beforeCem, afterCem, types) : { ...diffCem(beforeCem, afterCem), typeCoverage: 'not-supplied' as const };
  const issues: ReviewIssue[] = cem.gaps.map(message => ({ code: 'cem-gap', message }));
  const facts = new Map(cem.facts.map(fact => [fact.id, fact]));
  const classifications = new Map<string, DeclaredChange[]>();
  for (const change of input.changes) {
    for (const factId of change.cemFactIds ?? []) {
      const fact = facts.get(factId);
      if (!fact) throw new Error(`Change ${change.id} references an unknown API fact: ${factId}`);
      if (!change.components.includes(fact.element)) throw new Error(`Change ${change.id} does not identify fact owner ${fact.element}.`);
      if (!classifications.has(factId)) classifications.set(factId, []);
      classifications.get(factId)!.push(change);
    }
    if (!change.evidence.length) issues.push({ code: 'missing-evidence', changeId: change.id, message: `${change.id} has no supporting evidence.` });
    for (const evidence of change.evidence) {
      if (evidence.status !== 'available') issues.push({ code: 'missing-evidence', changeId: change.id, message: `${evidence.label}: ${evidence.status}; ${evidence.reason}` });
      else if (!evidence.digest) issues.push({ code: 'unidentified-evidence', changeId: change.id, message: `${evidence.label} lacks an exact content identity.` });
    }
    if (['breaking', 'removal', 'deprecation'].includes(change.level) && !change.migration?.trim() && !change.replacement?.trim()) {
      issues.push({ code: 'migration-guidance', changeId: change.id, message: `${change.id} needs migration or replacement guidance.` });
    }
  }
  for (const fact of cem.facts) {
    const classification = classifications.get(fact.id) ?? [];
    const descriptions = input.changes.filter(change => change.components.includes(fact.element));
    if (!descriptions.length) issues.push({ code: 'unexplained-fact', factId: fact.id, message: `${fact.element} ${fact.surface} ${fact.name} changed without an authored change record.` });
    if (fact.reviewRequired && !classification.length) {
      issues.push({ code: 'unclassified-fact', factId: fact.id, message: `${fact.element} ${fact.surface} ${fact.name}: ${fact.reason}` });
    }
    if (fact.suggestedLevel && classification.length && Math.max(...classification.map(change => severity[change.level])) < severity[fact.suggestedLevel]) {
      issues.push({ code: 'understated-change', factId: fact.id, message: `Authored classification cannot downgrade the ${fact.suggestedLevel} detected for ${fact.element} ${fact.name}.` });
    }
  }
  if (input.stabilize) issues.push({ code: 'stabilization', message: 'Explicit stability and migration review is required before adopting 1.0.0.' });
  if (input.sample) issues.push({ code: 'sample', message: 'This is synthetic sample input, not release or review proof.' });
  const effectiveLevels = [...input.changes.map(change => change.level), ...cem.facts.flatMap(fact => fact.suggestedLevel ? [fact.suggestedLevel] : [])];
  const next = nextVersion(input.baseVersion, effectiveLevels, input.stabilize);
  const componentNames = [...new Set([...input.changes.flatMap(change => change.components), ...cem.facts.map(fact => fact.element)])].sort();
  const components = componentNames.map(name => {
    const changes = input.changes.filter(change => change.components.includes(name));
    const componentFacts = cem.facts.filter(fact => fact.element === name);
    const history = input.componentHistory?.[name];
    return {
      name,
      affected: changes.some(change => change.affected === 'inherited') ? 'inherited' : 'direct',
      introducedIn: history?.introducedIn ?? (componentFacts.some(fact => fact.surface === 'element' && fact.operation === 'added') ? next.version : null),
      lastChangedIn: next.version,
      releasedIn: null,
      proposedRelease: next.version,
      previous: history ?? null,
      changes: changes.map(change => change.id),
      cemFacts: componentFacts.map(fact => fact.id),
    };
  });
  const record = {
    schemaVersion: 1,
    kind: 'release-draft',
    status: issues.length ? 'needs-review' : 'ready-for-review',
    sample: input.sample === true,
    packageTrain: [...new Set(input.packageTrain)].sort(),
    baseVersion: input.baseVersion,
    proposedVersion: next.version,
    bump: next.bump,
    classificationComplete: !issues.some(issue => ['cem-gap', 'unclassified-fact', 'unexplained-fact', 'understated-change'].includes(issue.code)),
    baseArtifacts: input.baseArtifacts,
    candidateArtifacts: input.candidateArtifacts,
    changes: input.changes,
    components,
    affectedTokens: [...new Set(input.changes.flatMap(change => change.tokens ?? []))].sort(),
    cem,
    issues,
    adopted: false,
    published: false,
  };
  return { ...record, digest: digestJson(record) };
}

export type ReleaseDraft = ReturnType<typeof createRelease>;

function safeText(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

export function changelog(draft: ReleaseDraft): string {
  const lines = [
    `# ${draft.sample ? 'SAMPLE — ' : ''}Proposed ${draft.proposedVersion}`,
    '',
    `From ${draft.baseVersion}; ${draft.bump}. Status: ${draft.status}.`,
    '',
    'This is a review draft. No release, baseline adoption, or publication has occurred.',
    '',
  ];
  for (const component of draft.components) {
    lines.push(`## ${safeText(component.name)}`, '');
    for (const change of draft.changes.filter(item => component.changes.includes(item.id))) {
      lines.push(`- **${change.level}**: ${safeText(change.summary)} (${safeText(change.id)})`, `  ${safeText(change.rationale)}`);
      if (change.migration) lines.push(`  Migration: ${safeText(change.migration)}`);
      if (change.replacement) lines.push(`  Replacement: ${safeText(change.replacement)}`);
      if (change.plannedRemoval) lines.push(`  Planned removal: ${change.plannedRemoval}.`);
      for (const evidence of change.evidence) {
        lines.push(`  Evidence — ${safeText(evidence.label)}: ${safeText(evidence.href)} (${evidence.status}${evidence.reason ? `: ${safeText(evidence.reason)}` : ''}).`);
      }
    }
    const facts = draft.cem.facts.filter(fact => component.cemFacts.includes(fact.id));
    if (facts.length) {
      lines.push('', 'CEM facts:', '');
      for (const fact of facts) lines.push(`- ${fact.operation} ${fact.surface} ${safeText(fact.name || '(default slot)')}: ${fact.suggestedLevel ?? 'classification required'}.`);
    }
    lines.push('');
  }
  if (draft.issues.length) {
    lines.push('## Open review requirements', '');
    for (const issue of draft.issues) lines.push(`- ${safeText(issue.message)}`);
    lines.push('');
  }
  lines.push(`Manifest format: CEM ${draft.cem.afterSchemaVersion}. Release-record schema: ${draft.schemaVersion}.`, '');
  return lines.join('\n');
}
