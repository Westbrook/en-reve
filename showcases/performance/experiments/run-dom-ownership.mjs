import { chromium } from '@playwright/test';
import { startServers } from '../src/server.mjs';
import { root, json, sha, options, selectSystems } from '../src/config.mjs';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { ownershipInPage } from './dom-ownership.mjs';
import { censusInPage } from './dom-census.mjs';
const args = options(['ownership', ...process.argv.slice(2)]);
const systems = selectSystems(args.systems);
if (args.systems && !args.output) throw Error('Selected ownership runs require --output to preserve the existing review');
const output = resolve(root, args.output || 'reports/dom-review/shadow-ownership.json');
try { await access(output); throw Error('Ownership evidence already exists; choose a new --output path'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
await mkdir(dirname(output), { recursive: true });
const result = { at: new Date().toISOString(), systems: systems.map(s => s.id), protocol: 'One fresh settled initial desktop document per system; diagnostic attribution, no timings', sources: {}, rows: [] };
for (const p of ['experiments/dom-ownership.mjs', 'experiments/run-dom-ownership.mjs', 'experiments/dom-census.mjs']) result.sources[p] = sha(await readFile(resolve(root, p)));
const close = await startServers({ systems });
const browser = await chromium.launch();
result.browser = browser.version();
try {
  for (const s of systems) {
    const page = await browser.newPage({ ignoreHTTPSErrors: true, viewport: { width: 1500, height: 1100 } });
    await page.goto(`https://127.0.0.1:${s.port}`);
    await page.locator('.showcase-card').last().waitFor();
    await page.waitForTimeout(1500);
    const census = await page.evaluate(censusInPage, { system: s.id });
    const structure = await page.evaluate(ownershipInPage, { system: s.id });
    if (Object.values(structure.byShadowHost).reduce((n, b) => n + b.nodes, 0) !== census.total.nodes) throw Error('Ownership partition mismatch');
    if (Object.values(structure.dateZones).reduce((n, b) => n + b.nodes, 0) !== census.date.nodes) throw Error('Date zone partition mismatch');
    result.rows.push({ system: s.id, census, ...structure });
    await page.close();
  }
  await writeFile(output, json(result), { flag: 'wx' });
  console.log(result.rows.map(r => [r.system, r.census.total.nodes]));
} finally { await browser.close(); await close(); }
