import { canonicalJson, digestJson } from '../evidence/identity.ts';
import type { Json } from '../evidence/identity.ts';
import type { TypeSnapshot } from '../metadata/type-snapshot.ts';
import { diffCem, snapshotCem } from './cem-diff.ts';
import type { ApiFact } from './cem-diff.ts';

export interface TypeSnapshotPair { before: TypeSnapshot; after: TypeSnapshot; graphs?: {before: any; after: any} }

/** Validate retained input before resolving cycles and reachable named declarations. */
export function validateTypeSnapshot(input: TypeSnapshot): void {
  canonicalJson(input);
  if (input.schemaVersion !== 1 || typeof input.packageName !== 'string' || !input.packageName || !input.generator
    || ![1,2].includes(input.generator.version) || typeof input.generator.typescript !== 'string' || typeof input.generator.digest !== 'string') throw new Error('Unsupported TypeScript API snapshot.');
  if (input.generator.version === 2 && (!input.generator.compiler || input.generator.compiler.version !== 1
    || input.generator.compiler.apiVersion !== input.generator.typescript || input.generator.compiler.wrapper?.name !== '@typescript/typescript6'
    || input.generator.compiler.effective?.version !== input.generator.typescript || typeof input.generator.compiler.boundaryDigest !== 'string')) throw new Error('Invalid explicit compiler provenance.');
  for (const map of [input.entrypoints, input.exports, input.declarations, input.exportKinds, input.dependencies]) {
    if (!map || typeof map !== 'object' || Array.isArray(map)) throw new Error('Invalid TypeScript snapshot map.');
  }
  if (!Array.isArray(input.externalReferences) || !Array.isArray(input.gaps)
    || [...input.externalReferences, ...input.gaps].some(x => typeof x !== 'string')) throw new Error('Invalid TypeScript snapshot references/gaps.');
  const external = new Set(input.externalReferences);
  const checkReference = (ref: unknown) => {
    if (typeof ref !== 'string' || (!Object.hasOwn(input.declarations, ref) && !external.has(ref))) throw new Error(`Unresolved TypeScript snapshot reference: ${ref}`);
  };
  for (const [name, target] of Object.entries(input.exports)) {
    const split = name.lastIndexOf('#');
    if (split < 1 || !Object.hasOwn(input.entrypoints, name.slice(0, split))) throw new Error(`Export outside package entrypoints: ${name}`);
    checkReference(target);
    if (!['type', 'value'].includes(input.exportKinds[name]!)) throw new Error(`Invalid export kind: ${name}`);
  }
  for (const declaration of Object.values(input.declarations)) {
    if (!declaration || ['name', 'source', 'kind', 'declaration'].some(key => typeof declaration[key as keyof typeof declaration] !== 'string') || !Array.isArray(declaration.references)) throw new Error('Invalid TypeScript declaration.');
    declaration.references.forEach(checkReference);
  }
}

/** Shared projection for documentation and release review, with cycle-safe dependency closure. */
export function publicTypeContract(snapshot: TypeSnapshot, exportedName: string): Json | undefined {
  const target = snapshot.exports[exportedName];
  if (target === undefined) return undefined;
  const visited = new Set<string>();
  const nodes: Record<string, Json> = {};
  function visit(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    const node = snapshot.declarations[id];
    if (!node) { nodes[id] = { external: true }; return; }
    nodes[id] = { declaration: node.declaration, references: node.references };
    node.references.forEach(visit);
  }
  visit(target);
  return { target, kind: snapshot.exportKinds[exportedName]!, declarations: nodes };
}

export function diffPublicApi(beforeCem: unknown, afterCem: unknown, types: TypeSnapshotPair) {
  validateTypeSnapshot(types.before); validateTypeSnapshot(types.after);
  if (types.before.packageName !== types.after.packageName) throw new Error('Cannot compare TypeScript snapshots from different packages.');
  const diff = diffCem(beforeCem, afterCem);
  const facts: ApiFact[] = [];
  for (const name of [...new Set([...Object.keys(types.before.exports), ...Object.keys(types.after.exports)])].sort()) {
    const before = publicTypeContract(types.before, name), after = publicTypeContract(types.after, name);
    if (canonicalJson(before ?? null) === canonicalJson(after ?? null)) continue;
    const operation = before === undefined ? 'added' : after === undefined ? 'removed' : 'changed';
    facts.push({ id: digestJson({ surface: 'type', name, before: before ?? null, after: after ?? null }),
      element: '$package', surface: 'type', name, operation,
      ...(before === undefined ? {} : { before }), ...(after === undefined ? {} : { after }),
      suggestedLevel: operation === 'removed' ? 'removal' : null, reviewRequired: true,
      reason: 'Public TypeScript declaration or a reachable type changed; explicit compatibility classification is required.' });
  }
  // A CEM pointer-only export is covered only by its own side's resolved package type export.
  const remainingGaps = (cem: unknown, snapshot: TypeSnapshot) => snapshotCem(cem).gaps.filter(gap => {
    const match = /^Unresolved local export (.+) in (.+); supply supplemental type evidence or repair the reference\.$/.exec(gap);
    if (!match) return true;
    return !Object.entries(snapshot.entrypoints).some(([entry, source]) => source === match[2]
      && snapshot.declarations[snapshot.exports[entry+'#'+match[1]]!]);
  });
  const gaps = [...new Set([...remainingGaps(beforeCem, types.before), ...remainingGaps(afterCem, types.after), ...types.before.gaps, ...types.after.gaps])];
  if (canonicalJson(types.before.dependencies) !== canonicalJson(types.after.dependencies)) gaps.push('External dependency requirements changed; review their public type contracts.');
  if (canonicalJson(types.before.generator) !== canonicalJson(types.after.generator)) gaps.push('TypeScript extraction policy/compiler changed; review regenerated declarations.');
  return { ...diff, facts: [...diff.facts, ...facts], gaps,
    beforeTypeDigest: digestJson(types.before), afterTypeDigest: digestJson(types.after),
    typeCoverage: 'package-exports' as const, externalTypePolicy: 'External dependency identities are retained; their declaration bodies require dependency-package review.',
    reviewRequired: gaps.length > 0 || diff.facts.some(fact => fact.reviewRequired) || facts.length > 0 };
}
