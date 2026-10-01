import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { integrateSpectrumGen2Main } from '../experiments/integrate-spectrum-gen2-main.mjs';

test('Spectrum refresh replaces target rows only, keeps archived cohorts, and is idempotent', async () => {
  const markdown = await readFile(new URL('../reports/spectrum-gen2/prior-results.md', import.meta.url), 'utf8');
  const historical = JSON.parse(await readFile(new URL('../reports/pass2-tables.json', import.meta.url)));
  const aliases = { 'Production payload sizes': 'production payload sizes', 'Chunk structure': 'emitted chunk structure', 'Historical connected DOM diagnostics': 'diagnostic coverage', 'Historical exercised code coverage': 'exercised code coverage', 'Historical rendering trace through LCP': 'trace through diagnostic LCP', 'Historical back-forward cache checks': 'back-forward cache checks', 'Historical observer overhead calibration': 'observer overhead calibration' };
  const tables = historical.tables.filter(t => t.headers[0] === 'Implementation' && t.rows.some(r => r[0] === 'Spectrum Web Components') && !['Historical overlap check'].includes(t.title)).map(t => ({
    ...t, title: 'Spectrum Gen2 ' + (aliases[t.title] ?? t.title.replace('startup click', 'startup usability').replace('action details', 'individual actions')),
    source: 'synthetic-refresh-only', rows: t.rows.filter(r => r[0] === 'Spectrum Web Components').map(r => ['Spectrum WC Gen2 + Gen1', ...r.slice(1)]),
  }));
  const observer = tables.find(t => t.title.endsWith('observer overhead calibration'));
  if (observer) { observer.headers.splice(1, 0, 'Profile'); observer.rows.forEach(r => r.splice(1, 0, 'desktop')); }
  const result = integrateSpectrumGen2Main(markdown, { tables });
  assert(result.receipts.length >= 30);
  for (const title of ['mobile cold loading', 'mobile warm loading', 'desktop cold loading', 'desktop warm loading', 'mobile interaction summary', 'Production payload sizes', 'Historical connected DOM diagnostics']) assert(result.receipts.some(t => t.title === title), title);
  assert.equal(integrateSpectrumGen2Main(result.markdown, { tables }).markdown, result.markdown);
  for (const table of result.receipts) {
    assert(table.rows.some(r => r[0] === 'Spectrum WC Gen2 + Gen1'));
    assert(!table.rows.some(r => r[0] === 'Spectrum Web Components'));
    assert(table.rows.filter(r => r[0] === 'Spectrum WC Gen2 + Gen1').every(r => r[1] === 'synthetic-refresh-only'));
    assert(table.rows.every(r => r.length === table.headers.length));
  }
  // A refresh must not rewrite the retained historical Web Awesome supplement.
  const marker = '<!-- BEGIN WEB AWESOME -->';
  assert.equal(result.markdown.slice(result.markdown.indexOf(marker)), markdown.slice(markdown.indexOf(marker)));
  assert(result.markdown.includes('Prior Gen1 results remain'));
  assert(result.markdown.includes('| Spectrum Web Components | 30 | 10 |')); // historical overlap
});
