import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { sourceIdentity } from '../releases/source-identity.mjs';
import { digestBytes } from '../evidence/identity.ts';

/** The graph retains the standalone release gate's HEAD, dirty-source and metadata attestation. */
export async function releaseAttestation(root, candidate) {
  const after = await sourceIdentity(root);
  if (after.sourceDigest !== candidate.sourceDigest || after.head !== candidate.head) {
    throw new Error('Candidate source changed during verification; rerun on one stable candidate.');
  }
  const artifacts = Object.fromEntries(await Promise.all([
    'custom-elements.json', 'custom-elements.json.receipt.json', 'public-types.json', 'public-api.json',
  ].map(async name => [name, digestBytes(await readFile(resolve(root, 'packages/elements', name)))])));
  return { candidate, artifacts, limits: [
    'Named browser states and installed engines; not physical-device, IME or assistive-technology acceptance.',
    'Theme migration additionally requires the theme pathway before package release.',
    'This command never publishes, bumps a version or acknowledges review.',
  ] };
}
export { sourceIdentity };
