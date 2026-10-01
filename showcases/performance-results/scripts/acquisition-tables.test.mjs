import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateAcquisitionTable } from './acquisition-tables.mjs';

const tables = JSON.parse(await readFile(new URL('../src/tables.json', import.meta.url)));
const references = tables.filter(table => table.title.startsWith('Nine-system '));
test('every current nine-system table retains separate acquisition identity and date', () => {
  assert(references.length > 0);
  for (const table of references) validateAcquisitionTable(table);
});
test('obsolete acquisition headers are rejected instead of silently shifting metric columns', () => {
  const table = structuredClone(references[0]); table.headers[1] = 'Acquisition';
  assert.throws(() => validateAcquisitionTable(table), /Invalid acquisition-labelled/);
});
test('missing or duplicate reference rows and lost acquisition IDs fail qualification', () => {
  for (const mutate of [table => table.rows.pop(), table => table.rows[1][0] = table.rows[0][0], table => table.rows.find(row => row[0] === 'Web Awesome')[0] = 'Unknown', table => table.rows[0][1] = '']) {
    const table = structuredClone(references[0]); mutate(table);
    assert.throws(() => validateAcquisitionTable(table), /Invalid acquisition-labelled/);
  }
});
test('missing dates remain explicit and malformed or missing date cells fail qualification', () => {
  const table = structuredClone(references[0]); table.rows[0][2] = '—'; validateAcquisitionTable(table);
  table.rows[0][2] = '2026-09-25'; validateAcquisitionTable(table);
  for (const date of ['', undefined, 'unknown']) {
    table.rows[0][2] = date;
    assert.throws(() => validateAcquisitionTable(table), /Invalid acquisition-labelled/);
  }
  table.rows[0].splice(2, 1);
  assert.throws(() => validateAcquisitionTable(table), /Invalid acquisition-labelled/);
});
