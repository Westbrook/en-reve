// Additive comparison campaign. Build and functional qualification must finish
// before this serial queue begins; never reuse an ID to replace slow samples.
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { root, json } from '../src/config.mjs';

const systems = 'web-awesome,en-reve,fluent-web-components';
const campaigns = [
  { suite: 'load', samples: '10', profiles: 'desktop,mobile', caches: 'cold,warm' },
  { suite: 'startup', samples: '10', profiles: 'desktop,mobile', caches: 'cold' },
  { suite: 'interactions', samples: '10', profiles: 'desktop,mobile', caches: 'cold' },
  { suite: 'lighthouse', samples: '5', profiles: 'mobile', caches: 'cold' },
  { suite: 'memory', samples: '1', profiles: 'desktop', caches: 'cold', checkpoints: '0,10,50' },
  { suite: 'diagnostic', samples: '1', profiles: 'desktop', caches: 'cold' },
  { suite: 'bfcache', samples: '5', profiles: 'desktop', caches: 'cold' },
  { suite: 'overhead', samples: '5', profiles: 'desktop', caches: 'cold' },
].map(c => ({ ...c, systems, seed: '20260921', id: `web-awesome-${c.suite}-v1` }));

const directory = resolve(root, 'reports/web-awesome');
await mkdir(directory, { recursive: true });
const receiptPath = resolve(directory, 'execution.json');
const receipt = {
  startedAt: new Date().toISOString(),
  status: 'running',
  interpretation: 'Exploratory developer-workstation expansion. New randomized same-cohort controls; historical eight-system samples are preserved and never treated as paired with this campaign.',
  planned: campaigns,
  campaigns: [],
};
await writeFile(receiptPath, json(receipt), { flag: 'wx' });
for (const campaign of campaigns) {
  const args = [resolve(root, 'src/cli.mjs'), 'run', ...Object.entries(campaign).flatMap(([key, value]) => ['--' + key, value])];
  console.log('START', campaign.id, new Date().toISOString());
  const startedAt = new Date().toISOString();
  const exitCode = await new Promise((done, reject) => {
    const child = spawn(process.execPath, args, { stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', done);
  });
  const entry = { ...campaign, startedAt, finishedAt: new Date().toISOString(), exitCode };
  try {
    const manifest = JSON.parse(await readFile(resolve(root, 'runs', campaign.id, 'manifest.json')));
    const samples = (await readFile(resolve(root, 'runs', campaign.id, 'samples.jsonl'), 'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse);
    entry.expected = manifest.jobs.length;
    entry.recorded = samples.length;
    entry.successful = samples.filter(s => s.status === 'ok').length;
    entry.failed = samples.length - entry.successful;
    entry.complete = samples.length === manifest.jobs.length;
  } catch (error) { entry.collectionError = error.message; }
  receipt.campaigns.push(entry);
  await writeFile(receiptPath, json(receipt));
  console.log('FINISH', campaign.id, JSON.stringify(entry));
  if (!entry.complete) {
    receipt.status = 'incomplete';
    receipt.stoppedAt = new Date().toISOString();
    await writeFile(receiptPath, json(receipt));
    throw new Error('Incomplete campaign; inspect retained evidence before continuing.');
  }
}
receipt.status = receipt.campaigns.some(c => c.failed) ? 'complete-with-failures' : 'complete';
receipt.finishedAt = new Date().toISOString();
await writeFile(receiptPath, json(receipt));
console.log('CAMPAIGNS COMPLETE', receipt.status);
