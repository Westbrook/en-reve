import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { integrateEnReveMain } from '../experiments/integrate-en-reve-main.mjs';

test('En Reve main refresh replaces target rows only, keeps archived cohorts, and is idempotent', async () => {
  const markdown = await readFile(new URL('../reports/en-reve-main/prior-results.md', import.meta.url), 'utf8');
  const historical = JSON.parse(await readFile(new URL('../reports/pass2-tables.json', import.meta.url)));
  const aliases = { 'Production payload sizes': 'production payload sizes', 'Chunk structure': 'emitted chunk structure', 'Historical connected DOM diagnostics': 'diagnostic coverage', 'Historical exercised code coverage': 'exercised code coverage', 'Historical rendering trace through LCP': 'trace through diagnostic LCP', 'Historical back-forward cache checks': 'back-forward cache checks', 'Historical observer overhead calibration': 'observer overhead calibration' };
  const tables = historical.tables.filter(t => t.headers[0] === 'Implementation' && t.rows.some(r => r[0] === 'En Reve') && !['Historical overlap check'].includes(t.title)).map(t => ({
    ...t, title: 'En Reve main ' + (aliases[t.title] ?? t.title.replace('startup click', 'startup usability').replace('action details', 'individual actions')),
    source: 'synthetic-refresh-only', rows: t.rows.filter(r => r[0] === 'En Reve').map(r => ['En Reve main 6d09b31c', ...r.slice(1)]),
  }));
  const observer = tables.find(t => t.title.endsWith('observer overhead calibration'));
  if (observer) { observer.headers.splice(1, 0, 'Profile'); observer.rows.forEach(r => r.splice(1, 0, 'desktop')); }
  const result = integrateEnReveMain(markdown, { tables });
  assert(result.receipts.length >= 30);
  for (const title of ['mobile cold loading', 'mobile warm loading', 'desktop cold loading', 'desktop warm loading', 'mobile interaction summary', 'Production payload sizes', 'Historical connected DOM diagnostics']) assert(result.receipts.some(t => t.title === title), title);
  assert.equal(integrateEnReveMain(result.markdown, { tables }).markdown, result.markdown);
  for (const table of result.receipts) {
    assert(table.rows.some(r => r[0] === 'En Reve main 6d09b31c'));
    assert(!table.rows.some(r => r[0] === 'En Reve'));
    assert(table.rows.filter(r => r[0] === 'En Reve main 6d09b31c').every(r => r[1] === 'synthetic-refresh-only'));
    assert(table.rows.every(r => r.length === table.headers.length));
  }
  // A refresh must not rewrite the retained historical Web Awesome supplement.
  const marker = '<!-- BEGIN WEB AWESOME -->';
  assert.equal(result.markdown.slice(result.markdown.indexOf(marker)), markdown.slice(markdown.indexOf(marker)));
  assert(result.markdown.includes('Prior En Reve results remain'));
  assert(result.markdown.includes('| En Reve | 30 | 10 |')); // historical overlap retained
});

test('dated current reports remain refreshable without duplicate identity columns', async () => {
  const markdown = await readFile(new URL('../../../plans/native-showcase-performance-results.md', import.meta.url), 'utf8');
  const current = JSON.parse(await readFile(new URL('../reports/en-reve-main/tables.json', import.meta.url)));
  const result = integrateEnReveMain(markdown, current);
  const table = result.receipts.find(t => t.title === 'mobile cold loading');
  assert.equal(table.headers.filter(h => h === 'Run ID').length, 1);
  assert.equal(table.headers.filter(h => h === 'Date (UTC)').length, 1);
  assert(!table.headers.includes('Acquisition'));
  assert(table.rows.every(r => r.length === table.headers.length));
  assert(table.rows.some(r => r[0] === 'En Reve main 6d09b31c' && r[table.headers.indexOf('Run ID')] === 'en-reve-main-load-v1'));
});
