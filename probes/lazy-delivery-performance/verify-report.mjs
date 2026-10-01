import assert from 'node:assert/strict';
import {createServer, get} from 'node:http';
import {createReadStream} from 'node:fs';
import {createHash} from 'node:crypto';
import {pipeline} from 'node:stream/promises';
import {readFile, writeFile, stat} from 'node:fs/promises';
import {resolve, dirname, extname, sep} from 'node:path';
import {chromium} from '@playwright/test';
import {exclusiveBrowserWork} from '../../showcases/performance/src/lock.mjs';
const runArg = process.argv.find(arg => arg.startsWith('--run='))?.slice(6);
assert(runArg, 'Supply --run=<completed analysis/report directory>');
const entryArgs = process.argv.filter(arg => arg.startsWith('--entry='));
assert(entryArgs.length <= 1, 'Supply --entry at most once');
const entry = entryArgs[0]?.slice(8) ?? 'report.html';
assert(['report.html', 'index.html'].includes(entry), 'Use --entry=report.html or --entry=index.html');
const root = resolve(runArg);
await exclusiveBrowserWork(async () => {
  let receipt;
  try {receipt = JSON.parse(await readFile(resolve(root, 'report-receipt.json'), 'utf8'));}
  catch (error) {if (error.code !== 'ENOENT') throw error;}
  const evidencePins = new Map();
  if (Array.isArray(receipt?.evidence)) {
    for (const item of receipt.evidence) evidencePins.set(item.copy, item.sha256);
  } else if (receipt?.inputs) {
    // Stage B records original absolute inputs; map its copied presentation paths.
    const originalAnalysis = Object.entries(receipt.inputs).filter(([path, hash]) => path.endsWith('/analysis.json') && hash === receipt.analysisSha256);
    assert.equal(originalAnalysis.length, 1, 'Stage B report must bind one analysis input');
    const originalRun = dirname(originalAnalysis[0][0]);
    const manifest = JSON.parse(await readFile(resolve(root, 'manifest.json'), 'utf8'));
    const prepared = resolve(manifest.preparation.path);
    for (const [path, hash] of Object.entries(receipt.inputs)) {
      if (path.startsWith(originalRun + sep)) evidencePins.set(path.slice(originalRun.length + 1), hash);
      if (path.startsWith(prepared + sep)) evidencePins.set('prepared-evidence/' + path.slice(prepared.length + 1), hash);
    }
  }
  const hasProducerPins = Array.isArray(receipt?.evidence) || Boolean(receipt?.inputs);
  async function fileDigest(path) {
    const hash = createHash('sha256');
    for await (const chunk of createReadStream(path)) hash.update(chunk);
    return hash.digest('hex');
  }
  const server = createServer(async (request, response) => {
    try {
      const pathname = new URL(request.url, 'http://localhost').pathname;
      if (pathname === '/favicon.ico') {response.writeHead(204).end(); return;}
      const file = resolve(root, '.' + decodeURIComponent(pathname === '/' ? '/' + entry : pathname));
      if (!file.startsWith(root + sep)) throw new Error('Outside report');
      const info = await stat(file); assert(info.isFile());
      response.writeHead(200, {'content-length': info.size, 'content-type': {'.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.jsonl': 'application/x-ndjson'}[extname(file)] ?? 'application/octet-stream'});
      await pipeline(createReadStream(file), response);
    } catch (error) {if (response.headersSent) response.destroy(error); else response.writeHead(404).end();}
  });
  await new Promise(resolveReady => server.listen(0, '127.0.0.1', resolveReady));
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({viewport: {width: 1440, height: 1000}}), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/?progress-report`);
    await page.waitForFunction(() => !!customElements.get('en-table'));
    const sections = await page.locator('[data-comparison]').count(); assert(sections > 0);
    for (let i = 0; i < sections; i++) {
      const section = page.locator('[data-comparison]').nth(i);
      assert.equal(await section.locator('th button:disabled').count(), 0, 'Sorting controls not initialized');
      const count = await section.locator('tbody tr').count(), search = section.locator('input[type=search]');
      await search.fill('unmatched-synthetic-report-filter-198271'); assert.equal(await section.locator('tbody tr:not([hidden])').count(), 0);
      await search.fill(''); assert.equal(await section.locator('tbody tr:not([hidden])').count(), count);
      const numeric = section.locator('th button[data-type=number]').first();
      if (await numeric.count() && count) {
        const column = Number(await numeric.getAttribute('data-index'));
        await numeric.click();
        const values = await section.locator('tbody').evaluate((body, column) => [...body.rows].map(row => row.cells[column].dataset.value).filter(value => value !== '').map(Number), column);
        assert.deepEqual(values, [...values].sort((a, b) => a - b), 'Numeric column did not sort ascending');
      }
      const note = await section.locator('.direction').textContent(); assert(note.includes('Better sign'), 'Missing below-table change directions');
    }
    const relativeLinks = await page.locator('a[href]').evaluateAll(anchors => [...new Set(anchors.map(anchor => anchor.getAttribute('href')).filter(href => href && !href.startsWith('#') && !href.startsWith('//') && !/^[a-z][a-z\d+.-]*:/i.test(href)))]);
    const evidenceLinks = [];
    for (const href of relativeLinks) {
      const url = new URL(href, page.url());
      assert.equal(url.origin, new URL(page.url()).origin, 'Relative evidence link left the report origin');
      const relativePath = decodeURIComponent(url.pathname).slice(1), file = resolve(root, relativePath);
      assert(file.startsWith(root + sep), 'Evidence link left the report directory');
      const expectedBytes = (await stat(file)).size;
      let expected = evidencePins.get(relativePath);
      if (hasProducerPins) assert(expected, `Evidence link lacks a producer hash: ${href}`);
      else expected = await fileDigest(file); // Generic static reports retain their existing support.
      const response = await new Promise((resolveResponse, reject) => {
        const request = get(url, resolveResponse);
        request.setTimeout(30000, () => request.destroy(new Error(`Evidence response stalled: ${href}`)));
        request.on('error', reject);
      });
      try {
        assert.equal(response.statusCode, 200, `Evidence link failed: ${href}`);
        const hash = createHash('sha256'); let bytes = 0;
        for await (const chunk of response) {hash.update(chunk); bytes += chunk.length;}
        const sha256 = hash.digest('hex');
        assert.equal(bytes, expectedBytes, `Evidence response truncated: ${href}`);
        assert.equal(sha256, expected, `Evidence response changed: ${href}`);
        evidenceLinks.push({href, status: response.statusCode, bytes, sha256, hashBasis: hasProducerPins ? 'producer-receipt' : 'served-file', completeStreamVerified: true});
      } finally {response.destroy();}
    }
    assert.deepEqual(errors, []);
    await page.screenshot({path: resolve(root, 'report-desktop.png')});
    await writeFile(resolve(root, 'report-verification.json'), JSON.stringify({status: 'pass', entry, browser: browser.version(), sections, sortable: true, filters: true, actualEnTable: true, evidenceLinks, errors, limits: 'Automated report usability only; no manual speech or feature-performance acceptance.'}, null, 2) + '\n', {flag: 'wx'});
  } finally {await browser.close(); await new Promise(done => server.close(done));}
});
