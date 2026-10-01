import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

// These controlled fixture contracts are neither browser qualification nor timing evidence.
const source = await readFile(new URL('./app/date.mjs', import.meta.url), 'utf8');
const imports = source.match(/^import .+;\r?$/gm) ?? [];
assert.equal(imports.length, 3, 'Update the injected fixture seam when its imports change');
const fixtureSource = source.replace(/^import .+;\r?\n/gm, '');
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

function element(localName, id = '') {
  const listeners = new Map();
  return {
    localName, id, listeners,
    addEventListener(type, callback, options) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push({ callback, options });
    },
    dispatch(type, event = {}) {
      for (const { callback } of listeners.get(type) ?? []) callback(event);
    },
  };
}

async function fixture({ policy = 'prepared', common = true } = {}) {
  let resolvePreparation, study, clock = 0;
  const preparation = new Promise(resolve => { resolvePreparation = resolve; });
  const calls = { common: 0, fallback: 0 };
  const registries = Object.fromEntries(['scope', 'global', 'shadow'].map(name => [name,
    new Map(['en-button', 'en-dialog', 'en-icon'].map(tag => [tag, { registry: name, tag }]))]));
  const definition = { tagName: 'en-date-picker' };
  const trigger = element('en-button', 'picker-trigger');
  const nativeTrigger = element('button', 'native-trigger');
  trigger.shadowRoot = { activeElement: nativeTrigger };
  const dialog = { open: false };
  const shell = { calendar: null };
  const shadow = Object.assign(element('#shadow-root'), {
    activeElement: trigger,
    customElementRegistry: registries.shadow,
    querySelector(selector) {
      return { '#picker-trigger': trigger, 'en-dialog': dialog, 'en-calendar': shell.calendar }[selector] ?? null;
    },
  });
  const picker = Object.assign(element('en-date-picker'), {
    shadowRoot: shadow,
    updateComplete: Promise.resolve(),
    preparePicker() { calls.fallback++; return preparation; },
    hidePicker() { dialog.open = false; },
  });
  const submit = element('button', 'submit');
  const document = {
    activeElement: picker,
    querySelector(selector) {
      if (selector === '#fields') return { append(value) { assert.equal(value, picker); } };
      if (selector === '#trigger') return externalTrigger;
      if (selector === '#submit') return submit;
      throw new Error(`Unexpected document selector ${selector}`);
    },
  };
  const externalTrigger = { hidden: false };
  submit.focus = () => { document.activeElement = submit; };
  const scope = {
    mode: 'scoped', registry: registries.scope,
    register(definitions) {
      assert.deepEqual(definitions, [definition]);
      registries.scope.set('en-date-picker', definition);
    },
    createElement(tag) { assert.equal(tag, 'en-date-picker'); return picker; },
  };
  const inputs = {
    createElementScope(options) { assert.equal(options.document, document); assert.equal(options.registry, 'auto'); return scope; },
    getDefinition: async () => definition,
    prepareFeature: common ? () => { calls.common++; return preparation; } : null,
    errors: [], snapshot: () => ({ componentNodes: 1 }), settle: async () => {},
    install(value) { assert.equal(study, undefined); study = value; },
    __POLICY__: policy, document, customElements: registries.global, location: { search: '?mode=scoped' },
    performance: { now: () => ++clock }, requestAnimationFrame: callback => callback(),
  };
  await new AsyncFunction(...Object.keys(inputs), fixtureSource)(...Object.values(inputs));
  assert.ok(study);
  assert.equal(externalTrigger.hidden, true);
  assert.equal(trigger.listeners.get('click')[0].options.capture, true, 'Activation must be captured before picker behavior');
  return { study, resolvePreparation, calls, registries, trigger, nativeTrigger, picker, shadow, shell, dialog, document, submit };
}

async function rejectsOnCompletion(f, preparing, pattern) {
  const rejected = assert.rejects(preparing, pattern);
  f.resolvePreparation();
  await rejected;
}

for (const common of [false, true]) {
  test(`inert ${common ? 'common-profile' : 'picker fallback'} preparation preserves nested focus and registries`, async () => {
    const f = await fixture({ common });
    const preparing = f.study.prepare();
    assert.equal(f.study.preparation.end, null);
    assert.deepEqual(f.study.preparation.before.focus, [
      { tag: 'en-date-picker', id: '' }, { tag: 'en-button', id: 'picker-trigger' }, { tag: 'button', id: 'native-trigger' },
    ]);
    f.resolvePreparation();
    await preparing;
    assert.deepEqual(f.calls, { common: Number(common), fallback: Number(!common) });
    assert.deepEqual(f.study.preparation.checks.map(check => check.phase), ['completion']);
    assert.equal(f.study.preparation.checks[0].registryUnchanged, true);
    assert.equal(f.study.preparation.checks[0].focusUnchanged, true);
  });
}

for (const registry of ['scope', 'global', 'shadow']) {
  for (const mutation of ['add', 'remove', 'replace']) {
    test(`preparation rejects ${mutation} in the ${registry} registry`, async () => {
      const f = await fixture();
      const preparing = f.study.prepare();
      if (mutation === 'add') f.registries[registry].set('en-calendar', {});
      if (mutation === 'remove') f.registries[registry].delete('en-button');
      if (mutation === 'replace') f.registries[registry].set('en-button', { replacement: true });
      await rejectsOnCompletion(f, preparing, /Preparation changed registry membership/);
      assert.deepEqual(f.study.preparation.checks, []);
    });
  }
}

test('preparation rejects deep focus identity changes while the document focus host stays unchanged', async () => {
  const f = await fixture();
  const preparing = f.study.prepare();
  f.trigger.shadowRoot.activeElement = element(f.nativeTrigger.localName, f.nativeTrigger.id);
  assert.equal(f.document.activeElement, f.picker);
  assert.equal(f.shadow.activeElement, f.trigger);
  await rejectsOnCompletion(f, preparing, /Preparation moved focus/);
});

for (const effect of ['open', 'calendar']) {
  test(`preparation rejects ${effect === 'open' ? 'opening the picker' : 'constructing a calendar'}`, async () => {
    const f = await fixture();
    const preparing = f.study.prepare();
    if (effect === 'open') f.dialog.open = true;
    else f.shell.calendar = element('en-calendar');
    await rejectsOnCompletion(f, preparing, effect === 'open' ? /Preparation opened the picker/ : /Preparation constructed the calendar/);
  });
}

test('abandonment accepts its authored focus move and preparation preserves that new focus', async () => {
  const f = await fixture({ policy: 'abandoned' });
  const preparing = f.study.prepare();
  f.study.abandon();
  assert.equal(f.document.activeElement, f.submit);
  assert.deepEqual(f.study.preparation.abandonedBefore.focus, [{ tag: 'button', id: 'submit' }]);
  f.resolvePreparation();
  await preparing;
  f.study.assertPreparationInert('abandoned-wait');
  assert.deepEqual(f.study.preparation.checks.map(check => check.phase), ['abandoned', 'completion', 'abandoned-wait']);
});

for (const afterCompletion of [false, true]) {
  test(`abandonment rejects a late focus move ${afterCompletion ? 'after' : 'before'} preparation completion`, async () => {
    const f = await fixture({ policy: 'abandoned' });
    const preparing = f.study.prepare();
    f.study.abandon();
    if (afterCompletion) { f.resolvePreparation(); await preparing; }
    f.document.activeElement = element('button', 'submit');
    if (afterCompletion) assert.throws(() => f.study.assertPreparationInert('abandoned-wait'), /Preparation moved focus/);
    else await rejectsOnCompletion(f, preparing, /Preparation moved focus/);
  });
}

test('the capture handler rejects pre-activation focus drift while preparation is pending', async () => {
  const f = await fixture({ policy: 'immediate' });
  const preparing = f.study.prepare();
  f.trigger.shadowRoot.activeElement = element('button', 'unexpected');
  assert.throws(() => f.trigger.dispatch('click'), /Preparation moved focus/);
  assert.equal(f.study.preparation.activation, null);
  assert.equal(f.study.action, null);
  await rejectsOnCompletion(f, preparing, /Preparation moved focus/);
});

for (const common of [false, true]) {
  test(`immediate ${common ? 'common-profile' : 'picker fallback'} activation captures pending preparation and permits picker effects`, async () => {
    const f = await fixture({ policy: 'immediate', common });
    const preparing = f.study.prepare();
    const start = f.study.preparation.start;
    f.trigger.dispatch('click');
    assert.equal(f.study.preparation.activation.pending, true);
    assert.equal(f.study.preparation.activation.end, null);
    const calendar = f.shell.calendar = element('en-calendar');
    f.registries.shadow.set('en-calendar', {});
    f.dialog.open = true;
    f.shadow.activeElement = calendar;
    f.resolvePreparation();
    await preparing;
    f.shadow.dispatch('focusin', { composedPath: () => [calendar, f.shadow, f.picker] });
    const action = await f.study.action;
    assert.equal(action.preparationPendingAtActivation, true);
    assert.deepEqual(action.preparationAtActivation, { start, end: null });
    assert.equal(action.focusInside, true);
    assert.equal(action.open, true);
    assert.equal(f.study.preparation.completionAfterActivation, true);
    assert.ok(f.study.preparation.end > f.study.preparation.activation.at);
    assert.deepEqual(f.study.preparation.checks.map(check => check.phase), ['before-activation']);
  });
}

test('activation after preparation completion captures a completed preparation', async () => {
  const f = await fixture();
  const preparing = f.study.prepare();
  f.resolvePreparation();
  await preparing;
  const { start, end } = f.study.preparation;
  f.trigger.dispatch('click');
  const calendar = f.shell.calendar = element('en-calendar');
  f.dialog.open = true;
  f.shadow.activeElement = calendar;
  f.shadow.dispatch('focusin', { composedPath: () => [calendar] });
  const action = await f.study.action;
  assert.equal(action.preparationPendingAtActivation, false);
  assert.deepEqual(action.preparationAtActivation, { start, end });
  assert.deepEqual(f.study.preparation.checks.map(check => check.phase), ['completion', 'before-activation']);
});
