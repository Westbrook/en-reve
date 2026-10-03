import { digestJson } from './identity.ts';
import { selectAffectedCore } from './graph-core.ts';
import type { DependencyGraph, SelectionReceipt } from './graph-core.ts';
export type { DependencyNode, DependencyGraph, SelectionReceipt } from './graph-core.ts';

export function selectAffected(graph: DependencyGraph, changed: string[]): SelectionReceipt {
  return { ...selectAffectedCore(graph, changed),
    graphDigest: digestJson({ ...graph, nodes: [...graph.nodes].sort((a,b)=>a.id.localeCompare(b.id))
      .map(node=>({...node,dependencies:[...new Set(node.dependencies)].sort()})) }) };
}

export type EvidenceOutcome =
  | { status: 'passed' | 'failed'; evidence: string[]; originatingRun: string }
  | { status: 'reused'; evidence: string[]; originatingRun: string; cacheKey: string }
  | { status: 'not-run'; reason: string; nextAction: string }
  | { status: 'unsupported'; reason: string; nextAction: string };

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
