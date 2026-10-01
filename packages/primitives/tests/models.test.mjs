import test from 'node:test';
import assert from 'node:assert/strict';
import { createValueModel } from '../dist/state/value.js';
import { createDisclosureModel } from '../dist/state/disclosure.js';
import { createSelectionModel } from '../dist/state/selection.js';
import { createDraftModel } from '../dist/state/draft.js';

test('normalization, synchronous derived reads and reset retain independent consumer models', () => {
  const first = createValueModel(7, { normalize: (value) => Math.max(0, Math.min(10, value)) });
  const second = createValueModel(7);
  const initial = first.view.get();
  assert.equal(first.set(15), true);
  assert.deepEqual(first.view.get(), { value: 10, revision: 1 });
  assert.equal(second.value.get(), 7);
  assert.equal(first.set(11), false);
  assert.equal(first.view.get().revision, 1);
  assert.equal(initial.value, 7);
  assert.equal(first.reset(), true);
  assert.equal(first.value.get(), 7);
});

test('value models do not freeze consumer-owned data or mutate prior snapshots', () => {
  const original = { count: 1 };
  const model = createValueModel(original);
  const previous = model.view.get();
  model.set({ count: 2 });
  assert.equal(Object.isFrozen(original), false);
  assert.equal(previous.value, original);
  assert.equal(previous.revision, 0);
  assert.equal(model.view.get().value.count, 2);
});

test('disclosure can synchronously toggle and restore its author default', () => {
  const model = createDisclosureModel(true);
  model.toggle();
  assert.equal(model.open.get(), false);
  assert.equal(model.setOpen(false), false);
  model.reset();
  assert.deepEqual(model.view.get(), { open: true, revision: 2 });
});

test('multi-selection retains order, protects snapshots and does not retain a mutable input list', () => {
  const keys = ['a', 'b', 'a'];
  const model = createSelectionModel(keys, { multiple: true });
  keys.push('c');
  const previous = model.selected.get();
  assert.deepEqual(previous, ['a', 'b']);
  model.toggle('a');
  model.toggle('c');
  assert.deepEqual(model.selected.get(), ['b', 'c']);
  assert.deepEqual(previous, ['a', 'b']);
  assert.throws(() => previous.push('x'), TypeError);
  model.reset();
  assert.deepEqual(model.selected.get(), ['a', 'b']);
});

test('invalid single selection fails without altering accepted selection', () => {
  const model = createSelectionModel(['a']);
  assert.throws(() => model.setSelected(['b', 'c']), RangeError);
  assert.deepEqual(model.selected.get(), ['a']);
  model.selectOnly('b');
  model.toggle('b');
  assert.deepEqual(model.selected.get(), []);
});

test('native draft remains distinct until accepted or explicitly rejected, including a same-value rejection', () => {
  const model = createDraftModel('saved');
  model.setDraft('editing');
  assert.equal(model.value.get(), 'saved');
  assert.equal(model.view.get().dirty, true);
  model.setValue('saved');
  assert.equal(model.draft.get(), 'saved');
  model.setDraft('accepted');
  model.acceptDraft();
  assert.equal(model.value.get(), 'accepted');
  assert.equal(model.view.get().dirty, false);
});

test('a remote authoritative update waits for composition before changing the native draft', () => {
  const model = createDraftModel('original');
  model.startComposition();
  model.setDraft('に');
  model.setValue('remote');
  assert.equal(model.value.get(), 'remote');
  assert.equal(model.draft.get(), 'に');
  assert.equal(model.acceptDraft(), false);
  model.setDraft('日本');
  model.endComposition('日本語');
  assert.equal(model.draft.get(), 'remote');
  assert.equal(model.value.get(), 'remote');
  assert.equal(model.isComposing.get(), false);
  assert.equal(model.hasDeferredValue.get(), false);
});

test('composition without an author override finishes as a draft, never an automatic acceptance', () => {
  const model = createDraftModel('');
  model.startComposition();
  model.setDraft('한');
  model.endComposition('한국어');
  assert.equal(model.value.get(), '');
  assert.equal(model.draft.get(), '한국어');
  model.acceptDraft();
  assert.equal(model.value.get(), '한국어');
});

test('a reset during composition updates accepted state but leaves composition intact until it ends', () => {
  const model = createDraftModel('default');
  model.setValue('saved');
  model.startComposition();
  model.setDraft('新');
  model.reset();
  assert.equal(model.draft.get(), '新');
  assert.equal(model.value.get(), 'default');
  model.endComposition('新しい');
  assert.equal(model.draft.get(), 'default');
});
