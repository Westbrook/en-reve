import { chromium, firefox, webkit } from '@playwright/test';
import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const result = { at: new Date().toISOString(), node: { version: process.version, executable: process.execPath }, playwright: require('@playwright/test/package.json').version, engines: [] };
const selections = [
  ['chromium', chromium, {}], ['firefox', firefox, {}], ['webkit', webkit, {}],
  ['chromium-full', chromium, { channel: 'chromium' }],
];
for (const [name, engine, options] of selections) {
  const server = await engine.launchServer(options);
  try {
    const browser = await engine.connect(server.wsEndpoint());
    result.engines.push({ name, executable: server.process().spawnfile, launchArguments: server.process().spawnargs, version: browser.version() });
    await browser.close();
  } finally { await server.close(); }
}
await writeFile(process.argv[2], JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(result));
