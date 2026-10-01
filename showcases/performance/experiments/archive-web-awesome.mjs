import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { gzipSync, gunzipSync } from 'node:zlib';
import { root, sha, json } from '../src/config.mjs';

const destination = resolve(root, 'reports/web-awesome/evidence');
await mkdir(destination, { recursive: true });
const execution = JSON.parse(await readFile(resolve(root, 'reports/web-awesome/execution.json')));
if (!execution.finishedAt || execution.campaigns.length !== execution.planned.length)
  throw new Error('Only archive a completed campaign queue. Failures are retained, not erased.');
const receipt = { archivedAt: new Date().toISOString(), format: 'Individual gzip files; SHA256 of raw and compressed contents. Complete raw runs, exact run harnesses and measured Web Awesome artifact retained.', campaigns: [], files: [] };

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
for (const name of (await readdir(resolve(root, 'runs'))).filter(name => /^web-awesome-/.test(name) && !execution.campaigns.some(c => c.id === name))) {
  const row = { id: name, role: 'qualification or structural diagnostics; excluded from primary timing distributions', files: [] };
  await archiveTree(resolve(root, 'runs', name), name, row.files);
  receipt.campaigns.push(row);
}
await archiveTree(resolve(root, '.cache/snapshots/web-awesome'), 'measured-artifact/web-awesome', receipt.files);
for (const entry of await readdir(resolve(root, '.cache/archive'), { withFileTypes: true }).catch(error => { if (error.code === 'ENOENT') return []; throw error; })) {
  if (!entry.name.startsWith('web-awesome-')) continue;
  if (entry.isDirectory()) await archiveTree(resolve(root, '.cache/archive', entry.name), 'superseded-artifacts/' + entry.name, receipt.files);
  else if (entry.isFile()) receipt.files.push(await archiveFile(resolve(root, '.cache/archive', entry.name), 'superseded-artifacts/' + entry.name));
}
for (const file of ['package.json', 'package-lock.json', '.npmrc', 'index.html', 'vite.config.js', 'README.md'])
  receipt.files.push(await archiveFile(resolve(root, '../web-awesome', file), 'showcase-source/' + file));
await archiveTree(resolve(root, '../web-awesome/src'), 'showcase-source/src', receipt.files);
const inventory = JSON.parse(await readFile(resolve(root, 'reports/web-awesome/inventory.json')));
for (const [path, expected] of Object.entries(inventory.systems.find(s => s.id === 'web-awesome').sourceHashes)) {
  const source = resolve(root, '..', path);
  if (sha(await readFile(source)) !== expected) throw new Error(`Qualified fixture source changed: ${path}`);
  receipt.files.push(await archiveFile(source, 'qualified-source/' + path));
}
for (const file of ['experiments/run-web-awesome.mjs', 'experiments/resume-web-awesome.mjs', 'experiments/report-web-awesome.mjs', 'experiments/web-awesome-metric-groups.mjs', 'experiments/pass2-metrics.mjs', 'experiments/archive-web-awesome.mjs', 'experiments/dom-census.mjs', 'experiments/dom-ownership.mjs', 'experiments/run-dom-review.mjs', 'experiments/run-dom-ownership.mjs', 'reports/web-awesome/config.json', 'reports/web-awesome/execution.json', 'reports/web-awesome/bundles.json', 'reports/web-awesome/inventory.json', 'reports/web-awesome/shadow-ownership.json'])
  receipt.files.push(await archiveFile(resolve(root, file), 'analysis/' + file));
for (const file of ['reports/web-awesome/tables.json', '../../plans/native-showcase-web-awesome-results.md', '../../plans/native-showcase-performance-results.md'])
  receipt.files.push(await archiveFile(resolve(root, file), 'generated-report/' + file.split('/').at(-1)));
receipt.files.push(await archiveFile(resolve(root, '../verification-web-awesome.json'), 'qualification/verification-web-awesome.json'));
for (const file of ['src/delivery.mjs', 'tests/delivery.test.mjs'])
  receipt.files.push(await archiveFile(resolve(root, file), 'corrected-analysis/' + file));
// Future-run fixes are distinct from each campaign's exact acquisition harness.
const maintenance = JSON.parse(await readFile(resolve(root, 'reports/web-awesome/future-run-verification.json')));
if (!maintenance.passed) throw new Error('Future-run maintenance verification did not pass');
for (const file of maintenance.files) {
  const source = resolve(root, '../..', file.path);
  if (sha(await readFile(source)) !== file.sha256)
    throw new Error(`Reviewed maintenance source changed: ${file.path}`);
  receipt.files.push(await archiveFile(source, 'post-acquisition-maintenance/' + file.path));
}
for (const file of ['qualify.mjs', 'smoke.mjs', 'secondary.mjs', 'inspect.mjs', 'record-verification.mjs'])
  receipt.files.push(await archiveFile(resolve(root, '../tools', file), 'qualification/tools/' + file));
for (const name of (await readdir(resolve(root, 'reports'))).filter(name => /^functional-web-awesome.*\.json$/.test(name)))
  receipt.files.push(await archiveFile(resolve(root, 'reports', name), 'qualification/' + name));
await archiveTree(resolve(root, '../../artifacts/web-awesome'), 'qualification/root-artifacts', receipt.files);
for (const entry of await readdir(resolve(root, '../artifacts'), { withFileTypes: true })) {
  if (entry.isDirectory() && /^web-awesome(?:-|$)/.test(entry.name))
    await archiveTree(resolve(root, '../artifacts', entry.name), 'qualification/standalone-artifacts/' + entry.name, receipt.files);
}
for (const entry of await readdir(resolve(root, 'reports/web-awesome'), { withFileTypes: true })) {
  if (entry.isFile() && /(?:initial-tabs-deferred|candidate|qualification|calibration|verification|method-review|data-review|future-run-review|dom-execution|blocked)/.test(entry.name))
    receipt.files.push(await archiveFile(resolve(root, 'reports/web-awesome', entry.name), 'qualification/preserved-receipts/' + entry.name));
}
await archiveTree(resolve(root, '../web-awesome/artifacts'), 'qualification/early-exploration', receipt.files);
const reader = resolve(root, '../performance-results');
const readerVerification = JSON.parse(await readFile(resolve(reader, 'verification.json')));
if (readerVerification.sourceHash === sha(await readFile(resolve(root, '../../plans/native-showcase-performance-results.md')))) {
  receipt.readerVerification = { sourceHash: readerVerification.sourceHash, buildHash: readerVerification.buildHash, result: readerVerification.result };
  for (const file of ['verification.json', 'scripts/verify-view.mjs', 'scripts/reader-test-receipts.mjs', 'tests/groups.spec.js', 'public/source.json'])
    receipt.files.push(await archiveFile(resolve(reader, file), 'reader-verification/' + file));
  await archiveTree(resolve(reader, 'artifacts'), 'reader-verification/artifacts', receipt.files);
}
await writeFile(resolve(destination, 'receipt.json'), json(receipt));
console.log('Archived', receipt.campaigns.length, 'runs and', receipt.files.length, 'artifact/source files');
