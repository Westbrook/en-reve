import test from 'node:test';
import assert from 'node:assert/strict';
// The override permits Node's native TypeScript loading for a staged, unbuilt draft.
const { dispatchChange, dispatchAction, dispatchDraftInput } = await import(
  process.env.EN_REVE_EVENTS_MODULE ?? '../dist/interactions/events.js'
);

function scenario(initial = 'A', target = new EventTarget()) {
  let value = initial;
  let formValue = initial;
  let draft = 'native draft';
  let revision = 0;
  const calls = [];
  return {
    target, calls,
    read: () => ({ value, formValue, draft, revision }),
    authorWrite(next) { value = formValue = draft = next; revision++; },
    propose(proposed, overrides = {}) {
      return dispatchChange(target, {
        previous: value, proposed, reason: 'select', getRevision: () => revision,
        stage(next) { calls.push(['stage', next]); value = formValue = next; },
        rollback(previous) { calls.push(['rollback', previous]); value = formValue = previous; },
        commit(next) { calls.push(['commit', next]); draft = next; },
        ...overrides,
      });
    },
  };
}

test('one real cancelable event exposes tentative state and form data before deferred effects', () => {
  const s = scenario(); const events = [];
  s.target.addEventListener('en-request-change', () => assert.fail('removed event'));
  s.target.addEventListener('en-change', event => {
    events.push(event);
    assert.deepEqual(s.read(), { value: 'B', formValue: 'B', draft: 'native draft', revision: 0 });
    assert.deepEqual(event.detail, { previous: 'A', proposed: 'B', reason: 'select' });
    assert.equal(Object.isFrozen(event.detail), true);
    assert.equal(event.cancelable, true); assert.equal(event.bubbles, true); assert.equal(event.composed, true);
  });
  assert.equal(s.propose('B'), 'committed');
  assert.equal(events.length, 1);
  assert.deepEqual(s.read(), { value: 'B', formValue: 'B', draft: 'B', revision: 0 });
});

test('a later listener can veto; rollback preserves the native draft and does not emit again', () => {
  const s = scenario(); let observations = 0;
  s.target.addEventListener('en-change', () => { observations++; assert.equal(s.read().value, 'B'); });
  s.target.addEventListener('en-change', event => event.preventDefault());
  assert.equal(s.propose('B'), 'canceled');
  assert.deepEqual(s.read(), { value: 'A', formValue: 'A', draft: 'native draft', revision: 0 });
  assert.deepEqual(s.calls, [['stage', 'B'], ['rollback', 'A']]);
  assert.equal(observations, 1);
});

for (const next of ['A', 'B', 'C']) for (const cancel of [false, true]) {
  test(`author write ${next}, canceled=${cancel}, supersedes the pending transaction`, () => {
    const s = scenario();
    s.target.addEventListener('en-change', event => { s.authorWrite(next); if (cancel) event.preventDefault(); });
    assert.equal(s.propose('B'), 'superseded');
    assert.deepEqual(s.read(), { value: next, formValue: next, draft: next, revision: 1 });
    assert.deepEqual(s.calls, [['stage', 'B']]);
  });
}

test('a canceled inner attempt does not suppress the outer rollback', () => {
  const s = scenario(); const outcomes = [];
  s.target.addEventListener('en-change', event => {
    if (event.detail.proposed === 'B') { outcomes.push(s.propose('C')); assert.equal(s.read().value, 'B'); }
    event.preventDefault();
  });
  assert.equal(s.propose('B'), 'canceled');
  assert.deepEqual(outcomes, ['canceled']);
  assert.deepEqual(s.calls, [['stage', 'B'], ['stage', 'C'], ['rollback', 'B'], ['rollback', 'A']]);
  assert.equal(s.read().value, 'A');
});

test('a canceled inner attempt still lets the outer change commit', () => {
  const s = scenario();
  s.target.addEventListener('en-change', event => {
    if (event.detail.proposed === 'B') assert.equal(s.propose('C'), 'canceled');
    else event.preventDefault();
  });
  assert.equal(s.propose('B'), 'committed');
  assert.equal(s.read().draft, 'B');
});

for (const cancelOuter of [false, true]) test(`accepted inner state wins, canceled outer=${cancelOuter}`, () => {
  const s = scenario();
  s.target.addEventListener('en-change', event => {
    if (event.detail.proposed !== 'B') return;
    assert.equal(s.propose('C'), 'committed');
    if (cancelOuter) event.preventDefault();
  });
  assert.equal(s.propose('B'), 'superseded');
  assert.equal(s.read().value, 'C'); assert.equal(s.read().draft, 'C');
  assert.deepEqual(s.calls, [['stage', 'B'], ['stage', 'C'], ['commit', 'C']]);
});

test('acceptance without a commit callback still supersedes an outer cancellation', () => {
  const s = scenario();
  s.target.addEventListener('en-change', event => {
    if (event.detail.proposed !== 'B') return;
    assert.equal(s.propose('C', { commit: undefined }), 'committed'); event.preventDefault();
  });
  assert.equal(s.propose('B'), 'superseded');
  assert.equal(s.read().value, 'C');
});

test('transactions on another host do not prevent this host from rolling back', () => {
  const a = scenario(); const b = scenario('X');
  a.target.addEventListener('en-change', event => { assert.equal(b.propose('Y'), 'committed'); event.preventDefault(); });
  assert.equal(a.propose('B'), 'canceled');
  assert.equal(a.read().value, 'A'); assert.equal(b.read().value, 'Y');
});

test('no-op attempts do not dispatch, invoke callbacks, or supersede outer rollback', () => {
  const s = scenario(); let observed = 0;
  assert.equal(s.propose('A'), 'unchanged'); assert.deepEqual(s.calls, []);
  s.target.addEventListener('en-change', event => {
    observed++; assert.equal(s.propose('B'), 'unchanged'); event.preventDefault();
  });
  assert.equal(s.propose('B'), 'canceled'); assert.equal(observed, 1);
  assert.equal(s.read().value, 'A');
});

test('post-dispatch validation rejects changed constraints and marks the same event canceled', () => {
  const s = scenario(); let event; let enabled = true;
  s.target.addEventListener('en-change', current => { event = current; enabled = false; });
  assert.equal(s.propose('B', { canCommit: () => enabled }), 'canceled');
  assert.equal(event.defaultPrevented, true); assert.equal(s.read().value, 'A');
  assert.deepEqual(s.calls, [['stage', 'B'], ['rollback', 'A']]);
});

test('validation never runs after a listener veto', () => {
  const s = scenario(); s.target.addEventListener('en-change', event => event.preventDefault());
  assert.equal(s.propose('B', { canCommit: () => assert.fail('already canceled') }), 'canceled');
});

test('a faulty impure validator cannot undo an authoritative write', () => {
  const s = scenario(); let event;
  s.target.addEventListener('en-change', current => { event = current; });
  assert.equal(s.propose('B', { canCommit() { s.authorWrite('C'); return false; } }), 'superseded');
  assert.equal(event.defaultPrevented, true); assert.equal(s.read().value, 'C');
  assert.deepEqual(s.calls, [['stage', 'B']]);
});

test('accepted nested work inside a validator also wins over the outer default', () => {
  const s = scenario();
  assert.equal(s.propose('B', { canCommit() { assert.equal(s.propose('C'), 'committed'); return true; } }), 'superseded');
  assert.equal(s.read().value, 'C');
});

test('staging failure restores owned state and a later transaction remains usable', () => {
  const s = scenario(); const error = new Error('stage failed');
  assert.throws(() => s.propose('B', { stage() { throw error; } }), candidate => candidate === error);
  assert.deepEqual(s.calls, [['rollback', 'A']]);
  assert.equal(s.propose('C'), 'committed');
});

test('dispatch failure restores staged state and releases the transaction frame', () => {
  class OnceFailingTarget extends EventTarget {
    fail = true;
    dispatchEvent(event) { if (this.fail) { this.fail = false; throw new Error('dispatch failed'); } return super.dispatchEvent(event); }
  }
  const s = scenario('A', new OnceFailingTarget());
  assert.throws(() => s.propose('B'), /dispatch failed/);
  assert.equal(s.read().value, 'A'); assert.equal(s.propose('C'), 'committed');
});

test('validator failure restores staged state', () => {
  const s = scenario();
  assert.throws(() => s.propose('B', { canCommit() { throw new Error('validation failed'); } }), /validation failed/);
  assert.equal(s.read().value, 'A'); assert.equal(s.read().draft, 'native draft');
});

test('rollback failure is propagated once and does not poison a later transaction', () => {
  const s = scenario(); let count = 0;
  s.target.addEventListener('en-change', event => event.preventDefault(), { once: true });
  assert.throws(() => s.propose('B', { rollback() { count++; throw new Error('rollback failed'); } }), /rollback failed/);
  assert.equal(count, 1); assert.equal(s.propose('C'), 'committed');
});

test('both original and rollback errors are retained', () => {
  const s = scenario(); const original = new Error('original'); const rollback = new Error('rollback');
  assert.throws(() => s.propose('B', { stage() { throw original; }, rollback() { throw rollback; } }), error => {
    assert.ok(error instanceof AggregateError); assert.deepEqual(error.errors, [original, rollback]); return true;
  });
});

test('deferred-effect failure leaves acceptance intact and prevents an outer rollback', () => {
  const s = scenario();
  s.target.addEventListener('en-change', event => {
    if (event.detail.proposed !== 'B') return;
    assert.throws(() => s.propose('C', { commit() { throw new Error('focus effect failed'); } }), /focus effect failed/);
    event.preventDefault();
  });
  assert.equal(s.propose('B'), 'superseded'); assert.equal(s.read().value, 'C');
  assert.equal(s.propose('D'), 'committed');
});

test('author writes caused by deferred effects are retained', () => {
  const s = scenario();
  assert.equal(s.propose('B', { commit() { s.authorWrite('C'); } }), 'superseded');
  assert.equal(s.read().value, 'C');
});

test('draft observation and command cancellation retain their separate contracts', () => {
  const target = new EventTarget(); const input = [];
  target.addEventListener('en-input', event => { input.push(event); event.preventDefault(); });
  dispatchDraftInput(target, { value: 'composing', isComposing: true, inputType: 'insertCompositionText' });
  assert.equal(input.length, 1); assert.equal(input[0].cancelable, false); assert.equal(input[0].defaultPrevented, false);
  assert.deepEqual(input[0].detail, { value: 'composing', isComposing: true, inputType: 'insertCompositionText' });
  target.addEventListener('en-action', event => event.preventDefault());
  assert.equal(dispatchAction(target, { action: 'save', data: undefined }), true);
  assert.equal(dispatchAction(target, { action: 'save', data: undefined }, { cancelable: true }), false);
});

test('named transactions share supersession with numeric changes on the same owner', () => {
  const s = scenario(30); let collapsed = 'none'; let resizeEvents = 0;
  s.target.addEventListener('en-change', () => resizeEvents++);
  s.target.addEventListener('en-collapse', event => {
    assert.equal(collapsed, 'primary');
    assert.equal(event.cancelable, true);
    assert.deepEqual(event.detail, {previous:'none', proposed:'primary', reason:'button'});
    assert.equal(s.propose(45), 'committed');
    collapsed = 'none'; // Owner reconciles its other staged state on acceptance.
    event.preventDefault();
  });
  const result = dispatchChange(s.target, {
    previous:collapsed, proposed:'primary', reason:'button', getRevision:()=>0,
    stage:value=>{collapsed=value;}, rollback:()=>assert.fail('newer work owns state'),
  }, {eventName:'en-collapse'});
  assert.equal(result, 'superseded');
  assert.equal(collapsed, 'none'); assert.equal(s.read().value, 45); assert.equal(resizeEvents, 1);
});

test('compatibility fields cannot overwrite the canonical frozen proposal', () => {
  const target = new EventTarget();
  let value = 1;
  target.addEventListener('en-page-change', event => {
    assert.deepEqual(event.detail, {page: 2, previous: 1, proposed: 2, reason: 'pagination'});
    assert.equal(Object.isFrozen(event.detail), true);
    event.preventDefault();
  });
  const outcome = dispatchChange(target, {
    previous: 1, proposed: 2, reason: 'pagination', getRevision: () => 0,
    stage: next => { value = next; }, rollback: old => { value = old; },
  }, {eventName:'en-page-change', extraDetail:{page:2,previous:-1,proposed:-1,reason:'wrong'}});
  assert.equal(outcome, 'canceled');
  assert.equal(value, 1);
});
