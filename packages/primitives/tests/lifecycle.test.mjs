import test from 'node:test';
import assert from 'node:assert/strict';
import { createValueModel } from '../dist/state/value.js';
import { SignalController } from '../dist/interactions/signal-controller.js';

const flush = async () => { await Promise.resolve(); await Promise.resolve(); };

test('connection subscribes, disconnection cancels pending work, and reconnection observes latest state once', async () => {
  const controllers = new Set();
  let updates = 0;
  const host = { addController: (controller) => controllers.add(controller), removeController: (controller) => controllers.delete(controller), requestUpdate: () => updates++, updateComplete: Promise.resolve(true) };
  const model = createValueModel(1);
  const controller = new SignalController(host, () => model.view.get());
  assert.equal(controller.snapshot.value, 1);
  assert.equal(updates, 0);
  controller.hostConnected();
  updates = 0;
  model.set(2);
  model.set(3);
  await flush();
  assert.equal(updates, 1);
  model.set(4);
  controller.hostDisconnected();
  await flush();
  assert.equal(updates, 1);
  model.set(5);
  await flush();
  assert.equal(updates, 1);
  controller.hostConnected();
  assert.equal(controller.snapshot.value, 5);
  updates = 0;
  model.set(6);
  await flush();
  assert.equal(updates, 1);
  controller.dispose();
  assert.equal(controllers.size, 0);
  model.set(7);
  await flush();
  assert.equal(updates, 1);
});

test('disposing one view leaves other observers of a shared model connected', async () => {
  const model = createValueModel(0);
  const counts = [0, 0];
  const controllers = counts.map((_, index) => new SignalController({ addController() {}, removeController() {}, requestUpdate() { counts[index]++; }, updateComplete: Promise.resolve(true) }, () => model.view.get()));
  controllers.forEach((controller) => controller.hostConnected());
  counts.fill(0);
  controllers[0].dispose();
  model.set(1);
  await flush();
  assert.deepEqual(counts, [0, 1]);
  controllers[1].dispose();
});


for (const dispatchInput of [undefined, false]) {
  test(`native editing notification policy ${String(dispatchInput)} preserves adoption, callbacks and composition`, async () => {
    const { EditingController } = await import('../dist/interactions/editing-controller.js');
    const { createDraftModel } = await import('../dist/state/draft.js');
    class Host extends EventTarget {
      addController() {} removeController() {} requestUpdate() {}
      updateComplete = Promise.resolve(true);
    }
    class Control extends EventTarget {
      value = '11'; defaultValue = '3'; ownerDocument = { defaultView: { AbortController } };
    }
    const host = new Host(), control = new Control(), model = createDraftModel('3');
    const events = [], inputs = [], commits = [];
    host.addEventListener('en-input', event => events.push(event.detail));
    const editing = new EditingController(host, { model, control: () => control, dispatchInput,
      onInput: detail => inputs.push(detail), onCommit: (value, reason) => commits.push({ value, reason }) });
    editing.hostConnected(); editing.hostUpdated();
    assert.equal(model.value.get(), '3'); assert.equal(model.draft.get(), '11');
    assert.equal(control.value, '11');
    control.value = '9'; control.dispatchEvent(new Event('input'));
    assert.equal(model.value.get(), '3'); assert.equal(model.draft.get(), '9');
    control.dispatchEvent(new Event('compositionstart'));
    model.setValue('7'); editing.sync();
    assert.equal(control.value, '9');
    control.dispatchEvent(new Event('compositionend'));
    assert.equal(control.value, '7'); assert.equal(model.value.get(), '7');
    assert.deepEqual(commits, [{ value: '11', reason: 'hydrate' }, { value: '9', reason: 'input' }]);
    assert.equal(inputs.length, 3);
    assert.deepEqual(events, dispatchInput === false ? [] : inputs);
    editing.hostDisconnected(); control.value = '5'; control.dispatchEvent(new Event('input'));
    assert.equal(model.draft.get(), '7');
  });
}

for (const dispatchInput of [undefined, false]) {
  test(`native editing notification policy ${String(dispatchInput)} preserves callback author-write precedence`, async () => {
    const { EditingController } = await import('../dist/interactions/editing-controller.js');
    const { createDraftModel } = await import('../dist/state/draft.js');
    class Host extends EventTarget {
      addController() {} removeController() {} requestUpdate() {}
      updateComplete = Promise.resolve(true);
    }
    class Control extends EventTarget {
      value = '3'; defaultValue = '3'; ownerDocument = { defaultView: { AbortController } };
    }
    const host = new Host(), control = new Control(), model = createDraftModel('3');
    const events = [], inputs = [], commits = [];
    host.addEventListener('en-input', event => events.push(event.detail));
    const editing = new EditingController(host, { model, control: () => control, dispatchInput,
      onInput: detail => { inputs.push(detail); model.setValue('7'); }, onCommit: (value, reason) => commits.push({ value, reason }) });
    editing.hostConnected(); editing.hostUpdated();
    control.value = '9'; control.dispatchEvent(new Event('input'));
    assert.equal(control.value, '7'); assert.equal(model.value.get(), '7'); assert.equal(model.draft.get(), '7');
    assert.deepEqual(commits, []); assert.equal(inputs.length, 1);
    assert.deepEqual(events, dispatchInput === false ? [] : inputs);
    editing.hostDisconnected();
  });
}
