import { createHash } from 'node:crypto';
import { resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

/** Isolate direct verifier evidence when a caller supplies a fresh run root. */
export function evidenceDirectory(moduleURL, fallback) {
  const root = process.env.EN_TEST_PIPELINE_OUTPUT;
  if (!root) return fallback;
  const id = createHash('sha256').update(moduleURL).digest('hex').slice(0, 12);
  return pathToFileURL(resolve(root, id) + sep);
}
