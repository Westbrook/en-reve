import assert from 'node:assert/strict';

export function validateAcquisitionTable(table) {
  const label = `Invalid acquisition-labelled reference table: ${table.title}`;
  assert.deepEqual(table.headers.slice(0, 3), ['Implementation', 'Run ID', 'Date (UTC)'], label);
  assert.equal(table.rows.length, 9, label);
  assert.equal(new Set(table.rows.map(row => row[0])).size, 9, label);
  assert.equal(table.rows.filter(row => row[0] === 'Web Awesome').length, 1, label);
  for (const row of table.rows) {
    assert.equal(row.length, table.headers.length, label);
    assert(typeof row[0] === 'string' && row[0].trim(), label);
    assert(typeof row[1] === 'string' && row[1].trim(), label);
    // Some retained bundle receipts have no recorded date; keep that absence explicit.
    assert(row[2] === '—' || /^\d{4}-\d{2}-\d{2}$/.test(row[2]), label);
  }
}
