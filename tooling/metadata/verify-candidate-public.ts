import {readFile} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {digestJson} from '../evidence/identity.ts';
import {generateCandidatePublicArtifacts} from './generate-candidate-public.ts';
import {revalidateTypeDependencyIdentity} from './type-dependencies.ts';
import {assertCandidateElementsRoot, candidateElementsRoot} from './candidate-workspace.ts';

export const candidatePublicFiles = {
  manifest: 'custom-elements.json', receipt: 'custom-elements.json.receipt.json', types: 'public-types.json',
  graph: 'public-api.json', compiler: 'compiler-queries.json', resolution: 'compiler-resolution.json',
} as const;
type CandidateArtifacts = Awaited<ReturnType<typeof generateCandidatePublicArtifacts>>;
/** Exact comparison includes provenance, complete query membership and compiler ownership. */
export function assertCurrentCandidateArtifacts(saved: CandidateArtifacts, fresh: CandidateArtifacts) {
  if (!revalidateTypeDependencyIdentity(saved.compiler)) throw new Error('Candidate compiler dependency queries are missing, malformed or stale.');
  for (const [key, file] of Object.entries(candidatePublicFiles)) {
    if (saved[key as keyof CandidateArtifacts] === undefined || digestJson(saved[key as keyof CandidateArtifacts]) !== digestJson(fresh[key as keyof CandidateArtifacts])) {
      throw new Error('Candidate artifact is missing, changed or stale: ' + file);
    }
  }
}
/** Independently regenerate before a consumer receives verified in-memory objects. */
export async function verifyCandidatePublicArtifacts(bundleRoot: string, packageRoot = candidateElementsRoot) {
  packageRoot = await assertCandidateElementsRoot(packageRoot);
  bundleRoot = resolve(bundleRoot);
  const status = JSON.parse(await readFile(join(bundleRoot, 'status.json'), 'utf8'));
  if (status.status !== 'generated-unqualified' || status.requiresBaselineComparison !== true) throw new Error('Candidate bundle is incomplete or has an unsupported status.');
  const saved = Object.fromEntries(await Promise.all(Object.entries(candidatePublicFiles).map(async ([key, file]) =>
    [key, JSON.parse(await readFile(join(bundleRoot, file), 'utf8'))]))) as CandidateArtifacts;
  if (!revalidateTypeDependencyIdentity(saved.compiler)) throw new Error('Candidate compiler dependency queries are missing, malformed or stale.');
  const fresh = await generateCandidatePublicArtifacts(packageRoot);
  assertCurrentCandidateArtifacts(saved, fresh);
  if (status.components !== fresh.graph.components.length) throw new Error('Candidate bundle component count is stale.');
  return fresh;
}
