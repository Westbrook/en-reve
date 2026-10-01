// One immutable refresh campaign. Keep the browser lock across all suites.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { root, json } from '../src/config.mjs';
import { exclusiveBrowserWork } from '../src/lock.mjs';
import { run } from '../src/runner.mjs';
import { runLighthouse } from '../src/lighthouse.mjs';
import { report } from '../src/report.mjs';

const systems = 'spectrum-web-components,en-reve,fluent-web-components';
const planned = [
  { suite: 'load', samples: '10', profiles: 'desktop,mobile', caches: 'cold,warm' },
  { suite: 'startup', samples: '10', profiles: 'desktop,mobile', caches: 'cold' },
  { suite: 'interactions', samples: '10', profiles: 'desktop,mobile', caches: 'cold' },
  { suite: 'lighthouse', samples: '5', profiles: 'mobile', caches: 'cold' },
  { suite: 'memory', samples: '1', profiles: 'desktop', caches: 'cold', checkpoints: '0,10,50' },
  { suite: 'diagnostic', samples: '1', profiles: 'desktop', caches: 'cold' },
  { suite: 'bfcache', samples: '5', profiles: 'desktop', caches: 'cold' },
  { suite: 'overhead', samples: '5', profiles: 'desktop', caches: 'cold' },
].map(c => ({ ...c, systems, seed: '20260922', id: `spectrum-gen2-${c.suite}-v1` }));
await exclusiveBrowserWork(async () => {
  const directory = resolve(root, 'reports/spectrum-gen2');
  await mkdir(directory, { recursive: true });
  const path = resolve(directory, 'execution.json');
  const receipt = { startedAt: new Date().toISOString(), status: 'running', planned, campaigns: [],
    interpretation: 'Exploratory workstation refresh, Gen2 beta + Gen1 coexistence. Frozen En Reve and Fluent controls are contemporaneous; earlier Spectrum samples are historical and never paired with this acquisition.' };
  await writeFile(path, json(receipt), { flag: 'wx' });
  for (const campaign of planned) {
    console.log('START', campaign.id, new Date().toISOString());
    const entry = { ...campaign, startedAt: new Date().toISOString() };
    try {
      const summary = await report(await (campaign.suite === 'lighthouse' ? runLighthouse(campaign) : run(campaign)));
      entry.exitCode = !summary.complete || summary.failures.length ? 1 : 0;
    } catch (error) { entry.exitCode = 1; entry.collectionError = error.stack; }
    entry.finishedAt = new Date().toISOString();
    try {
      const manifest = JSON.parse(await readFile(resolve(root, 'runs', campaign.id, 'manifest.json')));
      const samples = (await readFile(resolve(root, 'runs', campaign.id, 'samples.jsonl'), 'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse);
      Object.assign(entry, { expected: manifest.jobs.length, recorded: samples.length, successful: samples.filter(s => s.status === 'ok').length, failed: samples.filter(s => s.status !== 'ok').length, complete: samples.length === manifest.jobs.length });
    } catch (error) { entry.collectionError ??= error.message; }
    receipt.campaigns.push(entry);
    await writeFile(path, json(receipt));
    console.log('FINISH', campaign.id, JSON.stringify(entry));
    if (!entry.complete) {
      receipt.status = 'incomplete'; receipt.stoppedAt = new Date().toISOString();
      await writeFile(path, json(receipt));
      throw Error('Incomplete campaign retained; inspect before continuing.');
    }
  }
  receipt.status = receipt.campaigns.some(c => c.failed) ? 'complete-with-failures' : 'complete';
  receipt.finishedAt = new Date().toISOString();
  await writeFile(path, json(receipt));
  console.log('CAMPAIGNS COMPLETE', receipt.status);
});
