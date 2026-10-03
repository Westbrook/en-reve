import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { digest, inventory, safePath } from './runtime.mjs';

/** Verify original documentation transport bytes, shared by theme and release packages. */
export async function inspectBuild(buildRoot) {
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
  for (const entry of assets.filter(entry => entry.path.endsWith('.html'))) {
    const text = await readFile(resolve(buildRoot, entry.path), 'utf8');
    if (!text.includes(`<meta name="en-review-build" content="${build.fingerprint}">`) || /<base\b/i.test(text)) throw new Error('Use the original bound build, without a hosting base transformation: ' + entry.path);
  }
  return { buildRoot, build, buildBytes, assets };
}

export async function copyBuild(snapshot, output) {
  for (const entry of snapshot.assets) {
    const bytes = await readFile(resolve(snapshot.buildRoot, entry.path));
    if (digest(bytes) !== entry.sha256) throw new Error('Build changed during packaging');
    const target = resolve(output, entry.path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, bytes, { flag: 'wx' });
  }
}
