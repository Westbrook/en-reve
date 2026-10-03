// Browser-safe selection boundary shared by the maintainer CLI and candidate UI.
// File acquisition/byte verification belongs to the caller; the manifest's own
// canonical identity and graph structure are checked here before any selection.
import {hashValue} from '@en-reve/tokens';
import {selectAffectedCore} from './graph-core.ts';
export function verifyImpact(manifest) {
  if (!manifest || manifest.schemaVersion !== 1 || manifest.kind !== 'en-reve/source-impact'
      || !Array.isArray(manifest.components) || !Array.isArray(manifest.scenarios)
      || !Array.isArray(manifest.gaps) || typeof manifest.policy !== 'string') throw new Error('Unsupported source-impact manifest.');
  const {digest,...body}=manifest;
  if (hashValue(body)!==digest) throw new Error('Impact manifest integrity mismatch');
  // Validate even an unchanged candidate; malformed graphs never mean no impact.
  selectAffectedCore(manifest.graph,[]);
  return manifest;
}
export function selectCandidateImpact(manifest,changed) {
  verifyImpact(manifest);
  const receipt=selectAffectedCore(manifest.graph,changed);
  const graphDigest=hashValue({...manifest.graph,nodes:[...manifest.graph.nodes].sort((a,b)=>a.id.localeCompare(b.id))
    .map(node=>({...node,dependencies:[...new Set(node.dependencies)].sort()}))});
  return {...receipt,graphDigest,impactDigest:manifest.digest,
    components:receipt.affected.filter(id=>id.startsWith('component:')).map(id=>id.slice(10)),
    caseIds:receipt.scenarios.map(id=>id.slice(9)),policy:manifest.policy};
}
