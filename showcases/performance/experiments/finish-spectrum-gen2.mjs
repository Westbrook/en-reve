// Serialized structural follow-up to the immutable primary campaign.
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { exclusiveBrowserWork } from '../src/lock.mjs';
import { root } from '../src/config.mjs';

async function command(script, args) {
  const code = await new Promise((done, reject) => {
    const child = spawn(process.execPath, [resolve(root, script), ...args], { stdio: 'inherit' });
    child.on('error', reject); child.on('exit', done);
  });
  if (code !== 0) throw Error(script + ' failed: ' + code);
}
for (;;) {
  let entered = false;
  try {
    await exclusiveBrowserWork(async () => {
      entered = true;
      const receipt = JSON.parse(await readFile(resolve(root, 'reports/spectrum-gen2/execution.json')));
      if (!receipt.finishedAt || !receipt.campaigns.every(c => c.complete)) throw Error('Primary acquisition is incomplete; preserve and investigate it first.');
      await command('experiments/run-dom-review.mjs', ['spectrum-gen2-dom-v1', '--systems', 'spectrum-web-components,en-reve,fluent-web-components']);
      await command('experiments/run-dom-ownership.mjs', ['--systems', 'spectrum-web-components,en-reve,fluent-web-components', '--output', 'reports/spectrum-gen2/shadow-ownership.json']);
    });
    break;
  } catch (error) {
    if (entered || !/^Another browser campaign is active/.test(error.message)) throw error;
    await new Promise(done => setTimeout(done, 15000));
  }
}
await command('src/cli.mjs', ['diagnostics', '--run', 'spectrum-gen2-diagnostic-v1']);
await command('experiments/report-spectrum-gen2.mjs', []);
