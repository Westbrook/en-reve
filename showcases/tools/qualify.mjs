import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { exclusiveBrowserWork } from '../performance/src/lock.mjs';
import { showcases, options, selectSystems } from '../performance/src/config.mjs';

// The individual tools are also used as child suites by performance functional
// qualification, which already holds this lock. This standalone driver gives
// new-library qualification the same cross-campaign serialization guarantee.
const args = options(['qualify', ...process.argv.slice(2)]);
if (!args.systems || !args.artifacts || !args.receipt)
  throw Error('Provide --systems, --artifacts and --receipt for an isolated qualification');
const systems = selectSystems(args.systems);
const env = {
  ...process.env,
  SHOWCASE_FILTER: systems.map(system => system.id).join(','),
  SHOWCASE_ARTIFACTS: resolve(showcases, args.artifacts) + '/',
  SHOWCASE_RECEIPT: args.receipt,
};
await exclusiveBrowserWork(async () => {
  for (const suite of ['smoke', 'secondary', 'inspect', 'record-verification']) {
    const exitCode = await new Promise((done, reject) => {
      const child = spawn(process.execPath, [resolve(showcases, 'tools', suite + '.mjs')], { env, stdio: 'inherit' });
      child.once('error', reject);
      child.once('exit', done);
    });
    if (exitCode !== 0) throw Error(`Standalone qualification failed in ${suite}: ${exitCode}`);
  }
});
