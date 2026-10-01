import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequestLane } from '../src/workflows/shared/request-lane.ts';
import { createFixtureScheduler } from '../src/workflows/shared/fixture-scheduler.ts';
import { success, failure } from '../src/workflows/shared/result.ts';

test('duplicate requests are blocked and stale finishes cannot clear a newer request', () => {
  const lane = createRequestLane();
  const first = lane.begin();
  assert.ok(first);
  assert.equal(lane.begin(), undefined);
  assert.equal(first.isCurrent(), true);
  lane.cancel();
  assert.equal(first.signal.aborted, true);
  assert.equal(first.isCurrent(), false);
  const second = lane.begin();
  assert.ok(second);
  assert.equal(second.id, first.id + 1);
  first.finish();
  assert.equal(second.isCurrent(), true);
  second.finish();
  assert.equal(lane.pending, false);
});

test('disposal invalidates work permanently', () => {
  const lane = createRequestLane();
  const request = lane.begin();
  assert.ok(request);
  lane.dispose();
  assert.equal(request.isCurrent(), false);
  assert.equal(request.signal.aborted, true);
  assert.equal(lane.begin(), undefined);
});

test('held fixture results complete once in the requested order', async () => {
  const scheduler = createFixtureScheduler();
  const controller = new AbortController();
  const one = scheduler.respond(() => success({ value: 1 }), { action: 'one', signal: controller.signal, delivery: { kind: 'held' } });
  const two = scheduler.respond(() => failure({ code: 'retry' }), { action: 'two', signal: controller.signal, delivery: { kind: 'held' } });
  const [first, second] = scheduler.pending;
  assert.equal(scheduler.release(second.id), true);
  assert.deepEqual(await two, { ok: false, problem: { code: 'retry' } });
  assert.equal(scheduler.release(first.id), true);
  assert.deepEqual(await one, { ok: true, value: { value: 1 } });
  assert.deepEqual(scheduler.pending, []);
  assert.equal(scheduler.release(first.id), false);
  assert.equal(scheduler.release(second.id), false);
});

test('abort cancels held response production and stale releases', async () => {
  const scheduler = createFixtureScheduler();
  const controller = new AbortController();
  let produced = false;
  const response = scheduler.respond(() => { produced = true; return 1; }, { action: 'one', signal: controller.signal, delivery: { kind: 'held' } });
  const [request] = scheduler.pending;
  const rejection = assert.rejects(response, { name: 'AbortError' });
  controller.abort();
  await rejection;
  assert.equal(scheduler.release(request.id), false);
  assert.equal(produced, false);
});

test('reset cancels timers and held work without reusing old IDs', async () => {
  const scheduler = createFixtureScheduler();
  const signal = new AbortController().signal;
  const delayed = scheduler.respond(() => 1, { action: 'delayed', signal, delivery: { kind: 'delayed', milliseconds: 100 } });
  const held = scheduler.respond(() => 2, { action: 'held', signal, delivery: { kind: 'held' } });
  const oldIds = scheduler.pending.map(request => request.id);
  const failures = Promise.all([assert.rejects(delayed, { name: 'AbortError' }), assert.rejects(held, { name: 'AbortError' })]);
  scheduler.reset();
  await failures;
  const next = scheduler.respond(() => 3, { action: 'next', signal, delivery: { kind: 'held' } });
  const [request] = scheduler.pending;
  assert.ok(request.id > Math.max(...oldIds));
  assert.equal(scheduler.release(oldIds[1]), false);
  scheduler.release();
  assert.equal(await next, 3);
});

test('immediate delivery remains cancelable before its scheduled microtask', async () => {
  const scheduler = createFixtureScheduler();
  const controller = new AbortController();
  let produced = false;
  const response = scheduler.respond(() => { produced = true; return 1; }, { action: 'one', signal: controller.signal });
  const rejection = assert.rejects(response, { name: 'AbortError' });
  controller.abort();
  await rejection;
  assert.equal(produced, false);
});

test('late completion from an adapter ignoring abort cannot change reset state', async () => {
  const lane = createRequestLane();
  let state = 'initial';
  let resolve!: (value: string) => void;
  const remote = new Promise<string>(done => { resolve = done; });
  const request = lane.begin();
  assert.ok(request);
  const task = (async () => {
    try { const result = await remote; if (request.isCurrent()) state = result; }
    finally { request.finish(); }
  })();
  lane.cancel();
  const next = lane.begin();
  assert.ok(next);
  state = 'new operation';
  resolve('stale response');
  await task;
  assert.equal(state, 'new operation');
  assert.equal(next.isCurrent(), true);
});

test('response exceptions and invalid delay reject for the workflow recovery path', async () => {
  const scheduler = createFixtureScheduler();
  const signal = new AbortController().signal;
  await assert.rejects(scheduler.respond(() => { throw new Error('fixture failed'); }, { action: 'error', signal }), /fixture failed/);
  await assert.rejects(scheduler.respond(() => 1, { action: 'invalid', signal, delivery: { kind: 'delayed', milliseconds: -1 } }), RangeError);
  scheduler.dispose();
  await assert.rejects(scheduler.respond(() => 1, { action: 'removed', signal }), { name: 'AbortError' });
});
