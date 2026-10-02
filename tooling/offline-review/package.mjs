import { readFile, mkdir, writeFile, rm, lstat } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { hashValue, stableStringify } from '@en-reve/tokens';
import { digest, inventory, safePath, verifyPackage } from './runtime.mjs';

/** Preserve exact production bytes. Candidate semantics remain owned by that build. */
export async function packageReview({ buildDirectory, candidateFile, outputDirectory }) {
  const buildRoot = resolve(buildDirectory), output = resolve(outputDirectory);
  if (output === buildRoot || output.startsWith(buildRoot + sep) || buildRoot.startsWith(output + sep)) throw new Error('Output must be separate from the build');
  const assets = await inventory(buildRoot);
  const buildBytes = await readFile(resolve(buildRoot, 'review-build.json'));
  const build = JSON.parse(buildBytes);
  if (build.schemaVersion !== 1 || !/^sha256:[a-f0-9]{64}$/.test(build.fingerprint) || !Array.isArray(build.assets) || !Array.isArray(build.pages) || !Array.isArray(build.caseIds)) throw new Error('Invalid review build');
  const expected = new Map();
  for (const entry of build.assets) {
    safePath(entry.path);
    if (expected.has(entry.path) || entry.path === 'review-build.json') throw new Error('Duplicate or invalid build entry');
    expected.set(entry.path, entry.sha256);
  }
  for (const entry of assets.filter(entry => entry.path !== 'review-build.json')) {
    if (expected.get(entry.path) !== entry.sha256) throw new Error('Build integrity mismatch: ' + entry.path);
    expected.delete(entry.path);
  }
  if (expected.size) throw new Error('Build is missing assets');
  if (!assets.some(entry => entry.path === 'theme-review.html')) throw new Error('Theme Review page is missing');
  for (const entry of assets.filter(entry => entry.path.endsWith('.html'))) {
    const text = await readFile(resolve(buildRoot, entry.path), 'utf8');
    if (!text.includes(`<meta name="en-review-build" content="${build.fingerprint}">`) || /<base\b/i.test(text)) throw new Error('Use the original bound build, without a hosting base transformation: ' + entry.path);
  }
  const candidateStat = await lstat(candidateFile);
  if (!candidateStat.isFile() || candidateStat.size > 8_000_000) throw new Error('Candidate must be a regular JSON file under 8 MB');
  const candidateBytes = await readFile(candidateFile);
  const candidate = JSON.parse(candidateBytes);
  const { integrity, ...payload } = candidate;
  if (candidate.schema !== 'en-reve/local-theme-review' || ![1, 2].includes(candidate.schemaVersion) || hashValue(payload) !== integrity) throw new Error('Invalid candidate envelope integrity');
  if (stableStringify(candidate.build) !== stableStringify(build)) throw new Error('Candidate belongs to a different build; automatic rebasing is not applied');
  // Exclusive creation: never replace a reviewer package or a preexisting path.
  await mkdir(output);
  try {
    for (const entry of assets) {
      const bytes = await readFile(resolve(buildRoot, entry.path));
      if (digest(bytes) !== entry.sha256) throw new Error('Build changed during packaging');
      const target = resolve(output, 'site', entry.path);
      await mkdir(dirname(target), { recursive: true }); await writeFile(target, bytes, { flag: 'wx' });
    }
    await writeFile(resolve(output, 'candidate.json'), candidateBytes, { flag: 'wx' });
    await writeFile(resolve(output, 'serve.mjs'), await readFile(new URL('./runtime.mjs', import.meta.url)), { flag: 'wx' });
    await writeFile(resolve(output, 'index.html'), await readFile(new URL('./index.html', import.meta.url)), { flag: 'wx' });
    await writeFile(resolve(output, 'README.txt'), 'En Reve offline theme review\n\nRequires Node 24 or later; no installation or network access.\nRun: node serve.mjs --verify\nThen: node serve.mjs\nOpen the printed loopback URL. Reopen candidate.json in Theme Review.\nKeep the complete directory together; it can be archived for private transfer.\n\nHashes detect changed bytes, not publisher identity. Obtain code only from a trusted source.\nCandidate token replay is checked by the preserved application before it is applied.\nNo automatic adoption, test acceptance, browser-session capture or disk edits.\nKeep exports made during review alongside this immutable package, not inside it.\n');
    const files = await inventory(output);
    const manifest = { schema: 'en-reve/offline-review', schemaVersion: 1, buildFingerprint: build.fingerprint, candidateIntegrity: integrity, files, acceptance: { interaction: 'not-run', visual: 'not-run', manualAccessibility: 'not-run' } };
    await writeFile(resolve(output, 'offline-review.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
    await verifyPackage(output);
    return manifest;
  } catch (error) { await rm(output, { recursive: true, force: true }); throw error; }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  if (args.length !== 3) throw new Error('Usage: node tooling/offline-review/package.mjs <original-dist> <candidate.json> <new-output-directory>');
  const result = await packageReview({ buildDirectory: args[0], candidateFile: args[1], outputDirectory: args[2] });
  console.log(JSON.stringify({ output: resolve(args[2]), buildFingerprint: result.buildFingerprint, files: result.files.length }));
}
