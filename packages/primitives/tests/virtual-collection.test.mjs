import test from 'node:test';
import assert from 'node:assert/strict';
import { Signal } from 'signal-polyfill';
import { VirtualCollection } from '../dist/state/virtual-collection.js';

const records = (count) => Array.from({ length: count }, (_, index) => ({ id: `row-${index}` }));
const make = (items, options = {}) => new VirtualCollection({ items, key: (item) => item.id, estimateSize: 20, overscan: 0, ...options });
const mounted = (model) => model.entries.filter((entry) => entry.kind === 'item');
const checkCoverage = (model) => {
  let offset = 0;
  for (const entry of model.entries) {
    assert.equal(entry.offset, offset);
    assert.ok(entry.size > 0);
    offset += entry.size;
  }
  assert.equal(offset, model.totalSize);
};

test('server construction is deterministic, bounded and independent of browser globals', () => {
  const items = records(10_000);
  const first = make(items, { initialCount: 12 });
  const second = make(items, { initialCount: 12 });
  assert.deepEqual(first.entries, second.entries);
  assert.equal(mounted(first).length, 12);
  assert.equal(first.entries.length, 13);
  assert.equal(first.totalSize, 200_000);
  assert.equal(first.anchorOffset, 0);
  assert.equal(first.entries, first.entries);
  checkCoverage(first);
  assert.deepEqual(make([]).entries, []);
});

test('near and distant scrolling mounts the viewport plus item-count overscan', () => {
  const model = make(records(10_000), { overscan: 2 });
  model.setViewport(10_000, 100);
  assert.deepEqual(mounted(model).map(({ index }) => index), [498, 499, 500, 501, 502, 503, 504, 505, 506]);
  assert.equal(model.entries.length, 11);
  checkCoverage(model);
  model.setViewport(199_999, 100);
  assert.equal(model.anchorOffset, 199_900);
  assert.equal(mounted(model).at(-1).index, 9999);
  checkCoverage(model);
});

test('pinning retains disjoint focused rows without mounting their intervening range', () => {
  const model = make(records(10_000));
  model.setViewport(200, 60);
  model.pin('row-9000');
  model.pin('row-1');
  assert.deepEqual(mounted(model).map(({ index }) => index), [1, 10, 11, 12, 9000]);
  assert.equal(model.entries.filter(({ kind }) => kind === 'gap').length, 4);
  checkCoverage(model);
  model.unpin('row-1');
  model.unpin('row-9000');
  assert.deepEqual(mounted(model).map(({ index }) => index), [10, 11, 12]);
  checkCoverage(model);
});

test('prepend and reorder preserve the visible stable key and pixel inset', () => {
  const items = records(100);
  const model = make(items);
  model.setViewport(205, 60);
  model.setItems([{ id: 'new-first' }, ...items]);
  assert.equal(model.anchorOffset, 225);
  assert.equal(model.scrollOffsetFor('row-10'), 220);
  model.setItems([...items.slice(5), ...items.slice(0, 5)]);
  assert.equal(model.anchorOffset, 105);
  assert.equal(model.indexOf('row-10'), 5);
  assert.equal(model.keyAt(5), 'row-10');
  assert.equal(model.keyAt(-1), undefined);
  assert.equal(model.keyAt(100), undefined);
  assert.equal(model.keyAt(1.5), undefined);
  assert.equal(mounted(model)[0].key, 'row-10');
  checkCoverage(model);
});

test('measurement updates preserve anchor and keyed sizes through edits and ordering', () => {
  const items = records(100);
  const model = make(items);
  model.setViewport(205, 60);
  assert.equal(model.measure('row-0', 47), true);
  assert.equal(model.anchorOffset, 232);
  assert.equal(model.offsetOf(10), 227);
  assert.equal(model.measure('row-0', 47), false);
  model.setItems(items.map((item) => ({ ...item, title: 'edited' })));
  assert.equal(model.sizeOf(0), 47);
  assert.equal(model.anchorOffset, 232);
  model.invalidateMeasurements();
  assert.equal(model.sizeOf(0), 20);
  assert.equal(model.anchorOffset, 205);
  checkCoverage(model);
});

test('one measurement batch preserves the end anchor without intermediate scroll clamping', () => {
  const model = make(records(100));
  model.setViewport(1900, 100);
  model.measureMany([['row-0', 10], ['row-1', 30]]);
  assert.equal(model.anchorOffset, 1900);
  assert.equal(mounted(model)[0].key, 'row-95');
  assert.equal(model.totalSize, 2000);
  const snapshot = model.entries;
  assert.throws(() => model.measureMany([['row-0', 50], ['row-1', -1]]), RangeError);
  assert.equal(model.entries, snapshot);
  assert.equal(model.sizeOf(0), 10);
  checkCoverage(model);
});

test('removed anchor chooses a surviving neighbor and clears removed measurements and pins', () => {
  const items = records(30);
  const model = make(items);
  model.setViewport(205, 60);
  model.pin('row-10');
  model.measure('row-10', 30);
  model.setItems(items.filter(({ id }) => id !== 'row-10'));
  assert.equal(model.anchorOffset, 200);
  assert.equal(mounted(model)[0].key, 'row-11');
  assert.equal(model.indexOf('row-10'), -1);
  assert.equal(model.scrollOffsetFor('row-10'), undefined);
  model.setItems(items);
  assert.equal(model.sizeOf(10), 20);
  model.setViewport(0, 60);
  assert.ok(!mounted(model).some(({ key }) => key === 'row-10'));
  model.setItems([]);
  assert.equal(model.anchorOffset, 0);
  assert.deepEqual(model.entries, []);
});

test('input validation is atomic and caller arrays and records remain unmodified', () => {
  const items = records(5);
  const model = make(items);
  const snapshot = model.entries;
  const revision = model.revision.get();
  assert.throws(() => model.setItems([{ id: 'same' }, { id: 'same' }]), TypeError);
  assert.equal(model.entries, snapshot);
  assert.equal(model.revision.get(), revision);
  assert.throws(() => model.measure('row-0', 0), RangeError);
  assert.throws(() => model.setViewport(Infinity, 20), RangeError);
  assert.throws(() => model.offsetOf(-1), RangeError);
  assert.throws(() => model.sizeOf(5), RangeError);
  assert.throws(() => make(items, { estimateSize: NaN }), RangeError);
  assert.equal(model.measure('removed', 20), false);
  items.push({ id: 'later' });
  assert.equal(model.count, 5);
  assert.equal(Object.isFrozen(items[0]), false);
  assert.throws(() => snapshot.push({}), TypeError);
});

test('derived Signals update synchronously and no-op operations keep entry identity', () => {
  const items = records(100);
  const model = make(items);
  const view = new Signal.Computed(() => model.entries);
  const initial = view.get();
  model.setViewport(200, 60);
  assert.notEqual(view.get(), initial);
  const visible = view.get();
  model.setViewport(200, 60);
  model.setItems(items);
  model.pin('missing');
  model.unpin('missing');
  model.measure('row-10', 20);
  assert.equal(view.get(), visible);
});

test('incremental variable geometry agrees with a full prefix reference over distant windows', () => {
  const items = records(3000);
  const model = make(items);
  const sizes = items.map(() => 20);
  for (let operation = 0; operation < 500; operation++) {
    const index = (operation * 97) % items.length;
    const size = 11 + (operation * 31) % 109;
    sizes[index] = size;
    model.measure(items[index].id, size);
  }
  let sum = 0;
  for (let index = 0; index < sizes.length; index++) {
    assert.equal(model.offsetOf(index), sum);
    assert.equal(model.sizeOf(index), sizes[index]);
    sum += sizes[index];
  }
  assert.equal(model.totalSize, sum);
  for (let offset = 0; offset < sum - 200; offset += 1379) {
    model.setViewport(offset, 200);
    const rows = mounted(model);
    assert.ok(rows[0].offset <= offset);
    assert.ok(rows[0].offset + rows[0].size > offset);
    assert.ok(rows.at(-1).offset < offset + 200);
    assert.ok(rows.at(-1).offset + rows.at(-1).size >= offset + 200);
    checkCoverage(model);
  }
});

test('fractional geometry does not manufacture gaps between adjacent mounted rows', () => {
  const model = make(records(100), { estimateSize: 20.333, initialCount: 100 });
  model.measureMany(records(100).map(({ id }, index) => [id, 20.111 + index / 17]));
  assert.equal(model.entries.length, 100);
  assert.ok(model.entries.every(({ kind }) => kind === 'item'));
});
