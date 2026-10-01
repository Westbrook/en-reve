// Continue only the known pre-acquisition lock interruption. Completed run IDs
// and samples remain untouched; the remaining queue holds one browser lock.
import assert from 'node:assert/strict';
import { readFile, writeFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { root, json, sha } from '../src/config.mjs';
import { exclusiveBrowserWork } from '../src/lock.mjs';
import { run } from '../src/runner.mjs';
import { report } from '../src/report.mjs';

const path = resolve(root, 'reports/web-awesome/execution.json');
const collect = async () => {
  const previous = await readFile(path), receipt = JSON.parse(previous);
  assert.equal(receipt.status, 'incomplete');
  assert.equal(receipt.campaigns.length, 5);
  assert(receipt.campaigns.slice(0, 4).every(c => c.complete && c.failed === 0));
  const blocked = receipt.campaigns[4];
  assert.equal(blocked.id, 'web-awesome-memory-v1');
  assert.equal(blocked.exitCode, 1);
  assert(blocked.collectionError?.includes('ENOENT'));
  let absent = false;
  try { await access(resolve(root, 'runs', blocked.id)); }
  catch (error) { if (error.code !== 'ENOENT') throw error; absent = true; }
  assert(absent, 'The blocked ID must have no acquisition directory or samples');
  const completedHashes = {};
  for (const c of receipt.campaigns.slice(0, 4)) {
    const bytes = await readFile(resolve(root, 'runs', c.id, 'samples.jsonl'));
    const rows = bytes.toString().trim().split('\n').map(JSON.parse);
    assert.equal(rows.length, c.recorded);
    assert(rows.every(row => row.status === 'ok'));
    completedHashes[c.id] = sha(bytes);
  }
  const retainedPath = 'reports/web-awesome/execution-blocked-before-memory.json';
  await writeFile(resolve(root, retainedPath), previous, { flag: 'wx' });
  receipt.preAcquisitionAttempts = [blocked];
  receipt.campaigns = receipt.campaigns.slice(0, 4);
  receipt.planned[4].id = 'web-awesome-memory-v2';
  receipt.resumption = {
    at: new Date().toISOString(), previousExecution: retainedPath, completedSampleHashes: completedHashes,
    reason: 'Another task acquired the shared browser lock between Lighthouse and memory. No memory-v1 acquisition existed. Completed samples retained unchanged; remaining queue now holds one lock.',
    dispatch: 'Same runner and report functions used by CLI; one parent process holds the lock across all remaining suites.',
  };
  receipt.status = 'running';
  delete receipt.stoppedAt;
  const configPath = resolve(root, 'reports/web-awesome/config.json');
  const config = JSON.parse(await readFile(configPath));
  assert.equal(config.campaigns.memory, blocked.id);
  config.campaigns.memory = receipt.planned[4].id;
  await writeFile(configPath, json(config));
  await writeFile(path, json(receipt));
  for (const campaign of receipt.planned.slice(4)) {
    console.log('START', campaign.id, new Date().toISOString());
    const entry = { ...campaign, startedAt: new Date().toISOString() };
    try {
      const summary = await report(await run(campaign));
      entry.exitCode = !summary.complete || summary.failures.length ? 1 : 0;
    } catch (error) {
      entry.exitCode = 1;
      entry.collectionError = error.stack;
    }
    entry.finishedAt = new Date().toISOString();
    try {
      const manifest = JSON.parse(await readFile(resolve(root, 'runs', campaign.id, 'manifest.json')));
      const rows = (await readFile(resolve(root, 'runs', campaign.id, 'samples.jsonl'), 'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse);
      entry.expected = manifest.jobs.length;
      entry.recorded = rows.length;
      entry.successful = rows.filter(s => s.status === 'ok').length;
      entry.failed = rows.length - entry.successful;
      entry.complete = rows.length === manifest.jobs.length;
    } catch (error) { entry.collectionError ??= error.message; }
    receipt.campaigns.push(entry);
    await writeFile(path, json(receipt));
    console.log('FINISH', campaign.id, JSON.stringify(entry));
    if (!entry.complete) {
      receipt.status = 'incomplete'; receipt.stoppedAt = new Date().toISOString();
      await writeFile(path, json(receipt));
      throw new Error('Incomplete acquisition retained; no samples replaced.');
    }
  }
  for (const [id, hash] of Object.entries(completedHashes))
    assert.equal(sha(await readFile(resolve(root, 'runs', id, 'samples.jsonl'))), hash);
  receipt.status = receipt.campaigns.some(c => c.failed) ? 'complete-with-failures' : 'complete';
  receipt.finishedAt = new Date().toISOString();
  await writeFile(path, json(receipt));
  console.log('CAMPAIGNS COMPLETE', receipt.status);
};
let lastOwner = '';
for (;;) {
  let entered = false;
  try {
    await exclusiveBrowserWork(async () => { entered = true; await collect(); });
    break;
  } catch (error) {
    if (entered || !/^Another browser campaign is active \(PID \d+\)/.test(error.message)) throw error;
    if (lastOwner !== error.message) {
      lastOwner = error.message;
      console.log('WAIT', new Date().toISOString(), error.message);
    }
    await new Promise(resolve => setTimeout(resolve, 15000));
  }
}
