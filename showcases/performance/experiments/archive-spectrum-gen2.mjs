import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { gzipSync, gunzipSync } from 'node:zlib';
import { root, sha, json } from '../src/config.mjs';

const destination = resolve(root, 'reports/spectrum-gen2/evidence');
await mkdir(destination, { recursive: true });
const execution = JSON.parse(await readFile(resolve(root, 'reports/spectrum-gen2/execution.json')));
if (!execution.finishedAt || execution.campaigns.length !== execution.planned.length)
  throw new Error('Only archive a completed campaign queue. Failures are retained, not erased.');
const receipt = { archivedAt: new Date().toISOString(), format: 'Individual gzip files; SHA256 of raw and compressed contents. Complete raw runs, exact run harnesses and measured Spectrum Gen2 artifact retained.', campaigns: [], files: [] };

async function archiveFile(source, targetName) {
  const raw = await readFile(source), encoded = gzipSync(raw, { level: 9 });
  if (sha(gunzipSync(encoded)) !== sha(raw)) throw new Error(`Archive round-trip failed: ${source}`);
  const target = resolve(destination, targetName + '.gz');
  await mkdir(resolve(target, '..'), { recursive: true });
  await writeFile(target, encoded);
  const onDisk = await readFile(target);
  if (sha(onDisk) !== sha(encoded)) throw new Error(`Archive write failed: ${target}`);
  return { path: relative(destination, target), source: relative(root, source), rawBytes: raw.length, archiveBytes: encoded.length, sourceSha256: sha(raw), archiveSha256: sha(encoded) };
}
async function archiveTree(source, prefix, into) {
  for (const entry of await readdir(source, { withFileTypes: true })) {
    if (entry.isDirectory()) await archiveTree(resolve(source, entry.name), prefix + '/' + entry.name, into);
    else if (entry.isFile()) into.push(await archiveFile(resolve(source, entry.name), prefix + '/' + entry.name));
  }
}
for (const campaign of execution.campaigns) {
  const row = { id: campaign.id, successful: campaign.successful, failed: campaign.failed, files: [] };
  await archiveTree(resolve(root, 'runs', campaign.id), campaign.id, row.files);
  receipt.campaigns.push(row);
}
// Include qualification and structural evidence, including failed attempts.
for (const name of (await readdir(resolve(root, 'runs'))).filter(name => /^spectrum-gen2-/.test(name) && !execution.campaigns.some(c => c.id === name))) {
  const row = { id: name, role: 'qualification or structural diagnostics; excluded from primary timing distributions', files: [] };
  await archiveTree(resolve(root, 'runs', name), name, row.files);
  receipt.campaigns.push(row);
}
await archiveTree(resolve(root, '.cache/snapshots/spectrum-web-components'), 'measured-artifact/spectrum-web-components', receipt.files);
for (const entry of await readdir(resolve(root, '.cache/archive'), { withFileTypes: true }).catch(error => { if (error.code === 'ENOENT') return []; throw error; })) {
  if (!entry.name.startsWith('spectrum-web-components-')) continue;
  if (entry.isDirectory()) await archiveTree(resolve(root, '.cache/archive', entry.name), 'superseded-artifacts/' + entry.name, receipt.files);
  else if (entry.isFile()) receipt.files.push(await archiveFile(resolve(root, '.cache/archive', entry.name), 'superseded-artifacts/' + entry.name));
}
for (const file of ['package.json', 'package-lock.json', '.npmrc', 'index.html', 'vite.config.js', 'README.md'])
  receipt.files.push(await archiveFile(resolve(root, '../spectrum-web-components', file), 'showcase-source/' + file));
await archiveTree(resolve(root, '../spectrum-web-components/src'), 'showcase-source/src', receipt.files);
const inventory = JSON.parse(await readFile(resolve(root, 'reports/spectrum-gen2/inventory.json')));
for (const [path, expected] of Object.entries(inventory.systems.find(s => s.id === 'spectrum-web-components').sourceHashes)) {
  const source = resolve(root, '..', path);
  if (sha(await readFile(source)) !== expected) throw new Error(`Qualified fixture source changed: ${path}`);
  receipt.files.push(await archiveFile(source, 'qualified-source/' + path));
}
for (const file of ['experiments/run-spectrum-gen2.mjs', 'experiments/verify-spectrum-gen2-evidence.mjs', 'experiments/finish-spectrum-gen2.mjs', 'experiments/diagnose-spectrum-gen2-lifecycle.mjs', 'experiments/calibrate-spectrum-gen2-startup.mjs', 'experiments/integrate-spectrum-gen2-main.mjs', 'experiments/report-spectrum-gen2.mjs', 'experiments/web-awesome-metric-groups.mjs', 'experiments/pass2-metrics.mjs', 'experiments/archive-spectrum-gen2.mjs', 'experiments/dom-census.mjs', 'experiments/dom-ownership.mjs', 'experiments/run-dom-review.mjs', 'experiments/run-dom-ownership.mjs', 'reports/spectrum-gen2/config.json', 'reports/spectrum-gen2/execution.json', 'reports/spectrum-gen2/bundles.json', 'reports/spectrum-gen2/inventory.json', 'reports/spectrum-gen2/shadow-ownership.json', 'reports/spectrum-gen2/prior-inventory.json', 'reports/spectrum-gen2/prior-results.md', 'reports/spectrum-gen2/startup-calibration.json'])
  receipt.files.push(await archiveFile(resolve(root, file), 'analysis/' + file));
for (const file of ['reports/spectrum-gen2/tables.json', '../../plans/native-showcase-spectrum-gen2-results.md', '../../plans/native-showcase-performance-results.md'])
  receipt.files.push(await archiveFile(resolve(root, file), 'generated-report/' + file.split('/').at(-1)));
receipt.files.push(await archiveFile(resolve(root, '../verification-spectrum-gen2.json'), 'qualification/verification-spectrum-gen2.json'));
for (const file of ['src/delivery.mjs', 'tests/delivery.test.mjs'])
  receipt.files.push(await archiveFile(resolve(root, file), 'corrected-analysis/' + file));
for (const file of ['qualify.mjs', 'smoke.mjs', 'secondary.mjs', 'inspect.mjs', 'record-verification.mjs'])
  receipt.files.push(await archiveFile(resolve(root, '../tools', file), 'qualification/tools/' + file));
for (const name of (await readdir(resolve(root, 'reports'))).filter(name => /^functional-spectrum-web-components.*\.json$/.test(name)))
  receipt.files.push(await archiveFile(resolve(root, 'reports', name), 'qualification/' + name));
await archiveTree(resolve(root, '../../artifacts/spectrum-wc-migration'), 'qualification/root-artifacts', receipt.files);
for (const entry of await readdir(resolve(root, '../artifacts'), { withFileTypes: true })) {
  if (entry.isDirectory() && /^spectrum-gen2(?:-|$)/.test(entry.name))
    await archiveTree(resolve(root, '../artifacts', entry.name), 'qualification/standalone-artifacts/' + entry.name, receipt.files);
}
for (const entry of await readdir(resolve(root, 'reports/spectrum-gen2'), { withFileTypes: true })) {
  if (entry.isFile() && /(?:initial-tabs-deferred|candidate|qualification|calibration|verification|method-review|data-review|future-run-review|dom-execution|blocked|lifecycle|preservation)/.test(entry.name))
    receipt.files.push(await archiveFile(resolve(root, 'reports/spectrum-gen2', entry.name), 'qualification/preserved-receipts/' + entry.name));
}

const reader = resolve(root, '../performance-results');
const readerVerification = JSON.parse(await readFile(resolve(reader, 'verification.json')));
if (readerVerification.sourceHash === sha(await readFile(resolve(root, '../../plans/native-showcase-performance-results.md')))) {
  receipt.readerVerification = { sourceHash: readerVerification.sourceHash, buildHash: readerVerification.buildHash, result: readerVerification.result };
  for (const file of ['verification.json', 'scripts/verify-view.mjs', 'scripts/reader-test-receipts.mjs', 'tests/groups.spec.js', 'public/source.json'])
    receipt.files.push(await archiveFile(resolve(reader, file), 'reader-verification/' + file));
  await archiveTree(resolve(reader, 'artifacts'), 'reader-verification/artifacts', receipt.files);
}
try {
  await archiveTree(resolve(root, 'reports/spectrum-gen2/reader'), 'spectrum-reader-verification', receipt.files);
  receipt.files.push(await archiveFile(resolve(reader, 'scripts/verify-spectrum-gen2.mjs'), 'spectrum-reader-verification/verify-spectrum-gen2.mjs'));
} catch (error) { if (error.code !== 'ENOENT') throw error; }
await writeFile(resolve(destination, 'receipt.json'), json(receipt));
console.log('Archived', receipt.campaigns.length, 'runs and', receipt.files.length, 'artifact/source files');
