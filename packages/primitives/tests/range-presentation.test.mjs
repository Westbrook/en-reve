import test from 'node:test';
import assert from 'node:assert/strict';
import { rangeValuePercent } from '../dist/interactions/range-presentation.js';

test('range presentation is importable without browser setup and maps a finite domain to bounded percentages', () => {
  assert.equal(typeof document, 'undefined');
  assert.equal(rangeValuePercent(0, 0, 100), 0);
  assert.equal(rangeValuePercent(50, 0, 100), 50);
  assert.equal(rangeValuePercent(100, 0, 100), 100);
  assert.equal(rangeValuePercent(-100, 0, 100), 0);
  assert.equal(rangeValuePercent(200, 0, 100), 100);
  assert.equal(rangeValuePercent(-10, -20, 20), 25);
  assert.equal(rangeValuePercent(2, 2, 2), 0);
  assert.equal(rangeValuePercent(20, 2, 2), 0);
  assert.ok(Math.abs(rangeValuePercent(3e-15, 1e-15, 5e-15) - 50) < 1e-10);
  assert.equal(rangeValuePercent(0, -Number.MAX_VALUE, Number.MAX_VALUE), 50);
  assert.equal(rangeValuePercent(Number.MAX_VALUE, -Number.MAX_VALUE, Number.MAX_VALUE), 100);
  for (const args of [[NaN, 0, 100], [Infinity, 0, 100], [0, -Infinity, 100], [0, 0, Infinity], [5, 10, 0]]) {
    assert.equal(rangeValuePercent(...args), 0);
  }
});
