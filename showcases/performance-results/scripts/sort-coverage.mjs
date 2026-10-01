import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
export const tables = JSON.parse(readFileSync(new URL('../src/tables.json', import.meta.url), 'utf8'));
export function partitionTables(definitions, count = 6) {
  const groups = Array.from({ length: count }, (_, index) => ({ index, weight: 0, tables: [] }));
  for (const table of [...definitions].sort((a, b) => b.numeric.filter(Boolean).length - a.numeric.filter(Boolean).length || a.id.localeCompare(b.id))) {
    const group = [...groups].sort((a, b) => a.weight - b.weight || a.index - b.index)[0];
    group.tables.push(table); group.weight += table.numeric.filter(Boolean).length;
  }
  return groups.filter(group => group.tables.length);
}
export const sortGroups = partitionTables(tables);
export const sortTitle = group => `measurement columns sort numerically in both directions; missing last — group ${group.index + 1}/${sortGroups.length}`;
export const coverageFor = group => group.tables.flatMap(table => table.headers.flatMap((header, column) => table.numeric[column] ? ['ascending', 'descending'].map(direction => ({ table: table.id, column, header, direction, rows: table.rows.length })) : []));
export const coverageDigest = group => createHash('sha256').update(JSON.stringify(coverageFor(group))).digest('hex');
/** Equivalent pure predicates, with one diagnostic per violated row instead of transport-heavy expectations. */
export function sortFailures(observation, expected) {
  const failures = [];
  if (observation.direction !== expected.direction) failures.push(`direction: ${observation.direction}, expected ${expected.direction}`);
  if (observation.markers !== 1) failures.push(`aria-sort markers: ${observation.markers}, expected 1`);
  if (observation.texts.length !== expected.rows) failures.push(`rows: ${observation.texts.length}, expected ${expected.rows}`);
  let missing = false, previous = null;
  observation.texts.forEach((text, row) => {
    const value = text === '—' || text === '' ? null : Number(text.replaceAll(',', ''));
    if (value === null) { missing = true; return; }
    if (missing) failures.push(`row ${row}: ${text} follows missing value`);
    if (!Number.isFinite(value)) failures.push(`row ${row}: nonfinite numeric value ${JSON.stringify(text)}`);
    if (previous !== null && !(expected.direction === 'ascending' ? value >= previous : value <= previous)) failures.push(`row ${row}: ${value} after ${previous} is not ${expected.direction}`);
    previous = value;
  });
  return failures;
}
