import { verificationOutput, readerURL } from './verification-output.mjs';
import assert from 'node:assert/strict';
import { chromium, firefox, webkit, expect } from '@playwright/test';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { exclusiveBrowserWork } from '../../performance/src/lock.mjs';

const root = resolve(import.meta.dirname, '..');
const output = await verificationOutput(import.meta.url, resolve(root, '../performance/reports/spectrum-gen2/reader'));
await mkdir(output, { recursive: true });
const source = JSON.parse(await readFile(resolve(root, 'public/source.json')));
const tables = JSON.parse(await readFile(resolve(root, 'src/tables.json')));
const selected = tables.filter(t => t.rows.some(r => r[0] === 'Spectrum WC Gen2 + Gen1'));
assert(selected.length >= 35);
const receipt = { checkedAt: new Date().toISOString(), ...source, scope: 'Exact rendered values for all refreshed/new Spectrum tables; every numeric loading column and one numeric column per other table sorted both ways; missing values and sticky columns checked. Prior exhaustive reader verification remains historical.', tableCount: tables.length, selectedTables: selected.map(t => t.id), browsers: [] };
await exclusiveBrowserWork(async () => {
  for (const [engine, type] of Object.entries({ chromium, firefox, webkit })) {
    const browser = await type.launch();
    const page = await browser.newPage({ viewport: { width: 1500, height: 1100 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    const result = { engine, version: browser.version(), checkedTables: 0, sortedColumns: 0 };
    try {
      await page.goto(readerURL('/?progress-report#loading-and-visual-stability'));
      await expect(page.locator('en-data-table')).toHaveCount(tables.length);
      for (const definition of selected) {
        const wrapper = page.locator(`[data-table-id="${definition.id}"]`), table = wrapper.locator('en-data-table');
        const expected = definition.rows.filter(r => r[0] === 'Spectrum WC Gen2 + Gen1');
        const observed = await table.locator('tbody tr').evaluateAll(rows => rows.map(r => [...r.children].map(c => c.textContent.trim())).filter(r => r[0] === 'Spectrum WC Gen2 + Gen1'));
        assert.deepEqual(observed, expected, definition.title + ' rendered values');
        for (let index = 0; index < definition.headers.length; index++) {
          if (!definition.numeric[index]) continue;
          // Sorting implementation is unchanged. Exercise every numeric column
          // in the requested loading tables; one per other refreshed/new table.
          if (!['mobile cold loading', 'mobile warm loading', 'desktop cold loading', 'desktop warm loading'].includes(definition.title) && index !== definition.numeric.indexOf(true)) continue;
          const header = table.locator('thead th').nth(index);
          for (const direction of ['ascending', 'descending']) {
            await header.getByRole('button').click();
            await expect(header).toHaveAttribute('aria-sort', direction);
            const texts = await table.locator('tbody tr').evaluateAll((rows, i) => rows.map(r => r.children[i].textContent.trim()), index);
            let missing = false, previous = null;
            for (const text of texts) {
              if (!text || text === '—') { missing = true; continue; }
              const value = Number(text.replaceAll(',', ''));
              assert(!missing && Number.isFinite(value), definition.title + ': missing values last');
              if (previous !== null) assert(direction === 'ascending' ? value >= previous : value <= previous, definition.title + ': numeric ordering');
              previous = value;
            }
          }
          result.sortedColumns++;
        }
        result.checkedTables++;
      }
      await page.setViewportSize({ width: 390, height: 844 });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      for (const definition of selected.filter(t => t.headers[0] === 'Implementation')) {
        const table = page.locator(`[data-table-id="${definition.id}"] en-data-table`);
        const sticky = await table.evaluate(el => {
          const viewport = el.scrollElement; viewport.scrollLeft = viewport.scrollWidth;
          const left = viewport.getBoundingClientRect().left;
          const cells = [...el.shadowRoot.querySelectorAll('th.implementation-column, td.implementation-column')];
          return cells.length > 0 && cells.every(c => Math.abs(c.getBoundingClientRect().left - left) <= 2);
        });
        assert(sticky, definition.title + ': pinned Implementation column');
      }
      await page.goto(readerURL('/?progress-report#mobile-cold-loading'));
      await page.locator('#mobile-cold-loading').scrollIntoViewIfNeeded();
      await page.screenshot({ path: resolve(output, engine + '-mobile.png') });
      await page.setViewportSize({ width: 1500, height: 1100 });
      await page.locator('#loading-and-visual-stability').scrollIntoViewIfNeeded();
      await page.screenshot({ path: resolve(output, engine + '-loading.png') });
      await expect(page.getByRole('link', { name: 'Progress Report', exact: true })).toBeVisible();
      assert.deepEqual(errors, []);
      result.passed = true;
    } catch (error) { result.passed = false; result.error = error.stack; throw error; }
    finally {
      receipt.browsers.push(result); await browser.close();
      await writeFile(resolve(output, 'verification.json'), JSON.stringify(receipt, null, 2) + '\n');
      console.log(JSON.stringify(result));
    }
  }
});
receipt.passed = receipt.browsers.length === 3 && receipt.browsers.every(b => b.passed);
receipt.scriptSha256 = createHash('sha256').update(await readFile(import.meta.filename)).digest('hex');
await writeFile(resolve(output, 'verification.json'), JSON.stringify(receipt, null, 2) + '\n');
