import { mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evidenceDirectory } from '../../../tooling/test-pipeline/evidence-output.mjs';

/** Caller-owned evidence preserves historical reader receipts and screenshots. */
export async function verificationOutput(moduleURL, fallback) {
  const explicit = process.env.EN_READER_VERIFY_OUTPUT;
  const selected = explicit ? resolve(explicit) : evidenceDirectory(moduleURL, fallback);
  const output = selected instanceof URL ? fileURLToPath(selected) : selected;
  if (explicit || process.env.EN_TEST_PIPELINE_OUTPUT) {
    await mkdir(dirname(output), { recursive: true });
    await mkdir(output); // Refuse to replace evidence from an earlier attempt.
  } else await mkdir(output, { recursive: true });
  return output;
}
export function readerURL(path) {
  return new URL(path, process.env.EN_READER_ORIGIN ?? 'http://127.0.0.1:4188').href;
}
