import test from 'node:test';
import assert from 'node:assert/strict';
import { tables, sortGroups, coverageFor, sortFailures, partitionTables } from './sort-coverage.mjs';

test('every table and numeric direction is selected exactly once, including new tables', () => {
  assert.deepEqual(sortGroups.flatMap(group => group.tables.map(table => table.id)).sort(), tables.map(table => table.id).sort());
  const facets = sortGroups.flatMap(coverageFor).map(({ table, column, direction }) => `${table}/${column}/${direction}`);
  assert.equal(new Set(facets).size, facets.length);
  assert.equal(facets.length, tables.reduce((sum, table) => sum + table.numeric.filter(Boolean).length * 2, 0));
  const extra = { ...tables[0], id: 'new-candidate' };
  assert(partitionTables([...tables, extra]).some(group => group.tables.includes(extra)));
});
test('batched predicates reject seeded defects without dropping missing, finite, row or marker checks', () => {
  const valid = { direction: 'ascending', markers: 1, texts: ['1', '2', '—'] };
  const expected = { direction: 'ascending', rows: 3 };
  assert.deepEqual(sortFailures(valid, expected), []);
  for (const mutation of [ { direction: 'descending' }, { markers: 2 }, { texts: ['1', '2'] }, { texts: ['1', 'NaN', '—'] }, { texts: ['2', '1', '—'] }, { texts: ['1', '—', '2'] }]) assert(sortFailures({ ...valid, ...mutation }, expected).length, JSON.stringify(mutation));
  assert.deepEqual(sortFailures({ direction:'descending', markers:1, texts:['2,000','1',''] }, {direction:'descending',rows:3}), []);
});
