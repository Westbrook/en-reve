import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

/** Read the selected qualification once; an explicit missing/invalid file never falls back. */
export async function variantQualification({ root, variant, functionalReceipt }) {
  const path = resolve(root, functionalReceipt ?? `reports/functional-${variant.id}.json`);
  const bytes = await readFile(path);
  const receipt = JSON.parse(bytes);
  // Legacy standalone receipts may omit the engine. Explicit owned receipts
  // must establish the Chromium qualification required by this runner.
  const wrongEngine = receipt.engine !== undefined && receipt.engine !== 'chromium';
  if (receipt.passed !== true || receipt.variantFingerprint !== variant.fingerprint || wrongEngine ||
      (functionalReceipt !== undefined && receipt.engine !== 'chromium')) {
    throw new Error('This exact variant requires a passing Chromium functional qualification');
  }
  return { receipt, source: { path, sha256: createHash('sha256').update(bytes).digest('hex') } };
}
