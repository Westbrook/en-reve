import { digestJson } from './identity.ts';

export interface DependencyNode {
  id: string;
  kind: 'token' | 'theme' | 'style' | 'component' | 'module' | 'asset' | 'scenario' | 'docs' | 'config';
  /** Edges point from a consumer to the inputs it depends upon. */
  dependencies: string[];
  /** False means the known edge list is incomplete and focused selection is unsafe. */
  complete?: boolean;
}

export interface DependencyGraph {
  schemaVersion: 1;
  nodes: DependencyNode[];
}

export interface SelectionReceipt {
  schemaVersion: 1;
  graphDigest: string;
  changed: string[];
  affected: string[];
  scenarios: string[];
  mode: 'focused' | 'expanded';
  reasons: Record<string, string[]>;
  gaps: string[];
}

/** Alias/derivation/scope edges use the same graph as code, assets and scenario consumers. */
export function selectAffected(graph: DependencyGraph, changed: string[]): SelectionReceipt {
  if (graph.schemaVersion !== 1 || !Array.isArray(graph.nodes)) throw new TypeError('Unknown dependency graph schema.');
  const nodes = new Map<string, DependencyNode>();
  const reverse = new Map<string, Set<string>>();
  const reasons: Record<string, string[]> = Object.create(null);
  const gaps: string[] = [];
  for (const node of graph.nodes) {
    if (typeof node.id !== 'string' || !node.id || nodes.has(node.id)) throw new Error(`Missing or duplicate dependency node: ${node.id}`);
    if (!['token', 'theme', 'style', 'component', 'module', 'asset', 'scenario', 'docs', 'config'].includes(node.kind)) {
      throw new TypeError(`Unknown dependency kind for ${node.id}`);
    }
    if (!Array.isArray(node.dependencies) || node.dependencies.some(id => typeof id !== 'string' || !id)) {
      throw new TypeError(`Invalid dependencies for ${node.id}`);
    }
    nodes.set(node.id, node);
  }
  for (const node of nodes.values()) {
    if (node.complete === false) gaps.push(`Incomplete dependency metadata: ${node.id}`);
    for (const dependency of node.dependencies) {
      if (!nodes.has(dependency)) gaps.push(`Unknown dependency ${dependency}, consumed by ${node.id}`);
      if (!reverse.has(dependency)) reverse.set(dependency, new Set());
      reverse.get(dependency)!.add(node.id);
    }
  }
  const changedSet = new Set(changed);
  for (const id of changedSet) {
    if (typeof id !== 'string' || !id) throw new TypeError('Changed dependency IDs must be nonempty strings.');
    if (!nodes.has(id)) gaps.push(`Changed input is absent from dependency metadata: ${id}`);
    reasons[id] = ['content changed'];
  }
  const affected = new Set(changedSet);
  const queue = [...changedSet];
  for (let index = 0; index < queue.length; index++) {
    const dependency = queue[index]!;
    for (const consumer of reverse.get(dependency) ?? []) {
      (reasons[consumer] ??= []).push(`depends on ${dependency}`);
      if (!affected.has(consumer)) {
        affected.add(consumer);
        queue.push(consumer);
      }
    }
  }
  // Unknown inputs can affect any consumer. Expanding is intentional, never a cached pass.
  if (gaps.length && changedSet.size) {
    for (const id of nodes.keys()) {
      affected.add(id);
      (reasons[id] ??= []).push('expanded because dependency isolation is unproven');
    }
  }
  return {
    schemaVersion: 1,
    graphDigest: digestJson({ ...graph, nodes: [...graph.nodes].sort((a, b) => a.id.localeCompare(b.id))
      .map(node => ({ ...node, dependencies: [...new Set(node.dependencies)].sort() })) }),
    changed: [...changedSet].sort(),
    affected: [...affected].sort(),
    scenarios: [...nodes.values()].filter(node => node.kind === 'scenario' && affected.has(node.id)).map(node => node.id).sort(),
    mode: gaps.length && changedSet.size ? 'expanded' : 'focused',
    reasons,
    gaps: [...new Set(gaps)].sort(),
  };
}

export type EvidenceOutcome =
  | { status: 'passed' | 'failed'; evidence: string[]; originatingRun: string }
  | { status: 'reused'; evidence: string[]; originatingRun: string; cacheKey: string }
  | { status: 'not-run' | 'unsupported'; reason: string; nextAction: string };

export function coverageReceipt(required: string[], outcomes: Record<string, EvidenceOutcome>) {
  const checks = Object.fromEntries([...new Set(required)].sort().map(id => {
    const outcome = outcomes[id] ?? { status: 'not-run', reason: 'No evidence supplied.', nextAction: `Execute or explicitly resolve ${id}.` };
    if (!['passed', 'failed', 'reused', 'not-run', 'unsupported'].includes(outcome.status)) throw new TypeError(`Unknown evidence outcome for ${id}`);
    if (outcome.status === 'not-run' || outcome.status === 'unsupported') {
      if (!outcome.reason?.trim() || !outcome.nextAction?.trim()) throw new TypeError(`Missing evidence explanation for ${id}`);
    } else if (!outcome.originatingRun || !outcome.evidence?.length) {
      throw new TypeError(`Executed/reused evidence requires provenance for ${id}`);
    }
    if (outcome.status === 'reused' && !outcome.cacheKey) throw new TypeError(`Reused evidence requires a cache key for ${id}`);
    return [id, outcome];
  }));
  return {
    schemaVersion: 1,
    checks,
    complete: Object.values(checks).every(outcome => outcome.status === 'passed' || outcome.status === 'reused'),
  };
}
