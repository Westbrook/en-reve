import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { comparisons, variants } from './app/variants.mjs';

const subjects = ['reference', 'candidate'];
const lazyPolicies = ['cold', 'prepared', 'immediate', 'unused', 'abandoned'];
const dateFixtures = ['date-eager', 'date-construction', ...lazyPolicies.map(policy => `date-${policy}`), 'date-shell-static'];
const shellSpecifier = '@en-reve/elements/date-picker-shell.js';
const profileSpecifier = '@en-reve/elements/delivery-date-picker.js';
const deliverySpecifier = '@en-reve/elements/delivery.js';

function variant(id) {
  const found = variants.find(item => item.id === id);
  assert.ok(found, `Missing variant ${id}`);
  return found;
}

function moduleURL(source) {
  return `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
}

function stateFixture(t) {
  const key = `en-delivery-variant-${randomUUID()}`;
  const state = { evaluations: 0, loaderCalls: 0, preparations: [], definition: { tagName: 'en-date-picker' } };
  globalThis[key] = state;
  t.after(() => { delete globalThis[key]; });
  return { state, access: `globalThis[${JSON.stringify(key)}]` };
}

async function importSelected(selected, substitutions) {
  let source = selected;
  for (const [specifier, replacement] of Object.entries(substitutions)) {
    assert.equal(source.split(specifier).length - 1, 1, `Expected exactly one literal ${specifier} import`);
    source = source.replace(specifier, moduleURL(replacement));
  }
  return import(moduleURL(source));
}

function comparison(candidate, reference, kind, suffix = reference) {
  return { id: `${candidate}-versus-${suffix}`, reference, candidate, kind };
}

test('the complete timed matrix has 21 API/date arms and keeps presentation arms untimed', () => {
  const expectedIds = subjects.flatMap(subject => ['api-selective', 'api-canonical', ...dateFixtures].map(fixture => `${subject}/${fixture}`));
  expectedIds.push('candidate/api-profile');
  const timed = variants.filter(item => ['api', 'date'].includes(item.family));
  assert.equal(timed.length, 21);
  assert.equal(new Set(variants.map(item => item.id)).size, variants.length, 'Variant IDs must be unique');
  assert.deepEqual(timed.map(item => item.id).sort(), expectedIds.sort());
  assert.deepEqual(variants.filter(item => !timed.includes(item)).map(item => item.id).sort(), ['candidate/metadata', 'candidate/report']);
  for (const item of timed) {
    assert.equal(item.id, `${item.subject}/${item.fixture}`);
    assert.equal(item.pair, item.fixture);
    assert.equal(item.entry, `${item.family}.mjs`);
    const baseline = item.subject === 'reference' ? null : item.fixture === 'api-profile' ? 'reference/api-selective' : `reference/${item.fixture}`;
    assert.equal(item.baseline, baseline, item.id);
  }
});

test('every timed migration and date benefit has its original matched comparison', () => {
  const expected = [
    comparison('candidate/api-selective', 'reference/api-selective', 'api-overhead'),
    comparison('candidate/api-canonical', 'reference/api-canonical', 'api-overhead'),
    comparison('candidate/api-profile', 'reference/api-selective', 'api-overhead'),
    ...dateFixtures.map(fixture => comparison(`candidate/${fixture}`, `reference/${fixture}`, 'migration')),
    ...subjects.flatMap(subject => dateFixtures.filter(fixture => fixture !== 'date-eager').map(fixture => comparison(`${subject}/${fixture}`, `${subject}/date-eager`, 'date-benefit', 'eager'))),
  ];
  const byId = items => [...items].sort((a, b) => a.id.localeCompare(b.id));
  assert.deepEqual(byId(comparisons), byId(expected));
});

for (const subject of subjects) {
  test(`${subject} static-shell control keeps the cold date entry and eager shell-module acquisition`, async t => {
    const control = variant(`${subject}/date-shell-static`);
    assert.equal(control.family, 'date');
    assert.equal(control.policy, 'cold');
    assert.equal(control.entry, 'date.mjs');
    assert.equal(control.selected, variant(`${subject === 'reference' ? 'candidate' : 'reference'}/date-shell-static`).selected);
    assert.match(control.selected, /import\s*\{\s*datePickerShellDefinition\s*\}\s*from\s*(['"])@en-reve\/elements\/date-picker-shell\.js\1/);
    const { state, access } = stateFixture(t);
    const selected = await importSelected(control.selected, {
      [shellSpecifier]: `const state = ${access}; state.evaluations++; export const datePickerShellDefinition = state.definition;`,
    });
    assert.equal(state.evaluations, 1, 'Static control must load its shell while importing selected.mjs');
    assert.equal(await selected.getDefinition(), state.definition);
    assert.equal(selected.prepareFeature, null);
  });
}

for (const policy of lazyPolicies) {
  test(`reference date-${policy} defers its literal shell import until getDefinition`, async t => {
    const selectedSource = variant(`reference/date-${policy}`).selected;
    assert.match(selectedSource, /import\(\s*(['"])@en-reve\/elements\/date-picker-shell\.js\1\s*\)/);
    const { state, access } = stateFixture(t);
    const selected = await importSelected(selectedSource, {
      [shellSpecifier]: `const state = ${access}; state.evaluations++; export const datePickerShellDefinition = state.definition;`,
    });
    assert.equal(state.evaluations, 0, 'Importing selected.mjs must not acquire the shell');
    assert.equal(selected.prepareFeature, null);
    const [first, second] = await Promise.all([selected.getDefinition(), selected.getDefinition()]);
    assert.equal(first, state.definition);
    assert.equal(second, state.definition);
    assert.equal(state.evaluations, 1, 'Repeated definition requests share the imported module');
  });

  test(`candidate date-${policy} uses the common profile loader and calendar preparation`, async t => {
    const selectedSource = variant(`candidate/date-${policy}`).selected;
    assert.doesNotMatch(selectedSource, /@en-reve\/elements\/(?:date-picker-shell|definitions\/date-picker)\.js/);
    const { state, access } = stateFixture(t);
    const selected = await importSelected(selectedSource, {
      [profileSpecifier]: `const state = ${access}; state.evaluations++; export const datePickerSingleDeferredProfile = state.profile = {loaders: {'en-date-picker': async () => { state.loaderCalls++; return state.definition; }}};`,
      [deliverySpecifier]: `const state = ${access}; export const prepareDelivery = async (profile, features) => { const preparation = {profile, features}; state.preparations.push(preparation); return preparation; };`,
    });
    assert.equal(state.evaluations, 1);
    assert.equal(state.loaderCalls, 0, 'Importing the common profile must not invoke its shell loader');
    assert.deepEqual(state.preparations, [], 'Importing selected.mjs must not prepare the feature');
    assert.equal(await selected.getDefinition(), state.definition);
    assert.equal(state.loaderCalls, 1);
    assert.deepEqual(state.preparations, [], 'Definition acquisition must remain separate from feature preparation');
    const preparation = await selected.prepareFeature();
    assert.equal(preparation.profile, state.profile);
    assert.deepEqual(preparation.features, ['en-reve/en-date-picker/calendar']);
    assert.equal(state.preparations.length, 1);
    assert.equal(state.loaderCalls, 1, 'Preparation must delegate through prepareDelivery');
  });
}
