import {createElementScope} from '@en-reve/elements/element-scope.js';
import {getDefinition, prepareFeature} from './selected.mjs';
import {errors, snapshot, settle, install} from './metrics.mjs';
const policy = __POLICY__, requestedMode = new URLSearchParams(location.search).get('mode') ?? 'global';
const scope = createElementScope({document, registry: requestedMode === 'global' ? 'global' : 'auto'});
const fields = document.querySelector('#fields');
document.querySelector('#trigger').hidden = true;
scope.register([await getDefinition()]);
function mount() {
  const picker = scope.createElement('en-date-picker');
  Object.assign(picker, {label: 'Event date', name: 'eventDate', value: '2026-09-15', defaultValue: '2026-09-15', today: '2026-09-22', min: '2026-01-01', max: '2026-12-31', required: true});
  if (policy !== 'eager') picker.calendarLoading = 'deferred';
  fields.append(picker); return picker;
}
const picker = mount(); await settle(picker);
const trigger = picker.shadowRoot.querySelector('#picker-trigger');
let action = null, pendingFocus, preparation = {start: null, end: null, abandonedAt: null, activation: null, checks: []}, selection = null;
const preparationTags = ['en-date-picker', 'en-dialog', 'en-button', 'en-icon', 'en-calendar'];
const registries = [...new Set([scope.registry, customElements, picker.shadowRoot.customElementRegistry].filter(Boolean))];
let expectedPreparationState;
function preparationState() {
  const focus = [];
  for (let active = document.activeElement; active; active = active.shadowRoot?.activeElement) focus.push(active);
  return {focus, definitions: registries.map(registry => preparationTags.map(tag => registry.get(tag))),
    open: !!picker.shadowRoot.querySelector('en-dialog')?.open, calendarConstructed: !!picker.shadowRoot.querySelector('en-calendar')};
}
function recordedState(state) {
  return {focus: state.focus.map(element => ({tag: element.localName, id: element.id})),
    registered: state.definitions.map(definitions => preparationTags.filter((_, index) => !!definitions[index])),
    open: state.open, calendarConstructed: state.calendarConstructed};
}
function assertPreparationInert(phase) {
  const after = preparationState(), before = expectedPreparationState;
  if (!before) throw new Error('Preparation has not started');
  if (after.definitions.some((definitions, index) => definitions.some((value, tag) => value !== before.definitions[index][tag]))) throw new Error('Preparation changed registry membership');
  if (after.focus.length !== before.focus.length || after.focus.some((element, index) => element !== before.focus[index])) throw new Error('Preparation moved focus');
  if (after.open) throw new Error('Preparation opened the picker');
  if (after.calendarConstructed) throw new Error('Preparation constructed the calendar');
  preparation.checks.push({phase, at: performance.now(), before: recordedState(before), after: recordedState(after),
    registryUnchanged: true, focusUnchanged: true});
}
trigger.addEventListener('click', () => {
  const start = performance.now();
  const preparationPendingAtActivation = preparation.start != null && preparation.end == null;
  const preparationAtActivation = {start: preparation.start, end: preparation.end};
  if (preparation.start != null && !preparation.activation) {
    // The driver focuses this trigger before preparation begins for both matched arms.
    // After this point showPicker deliberately owns registration, construction and focus.
    assertPreparationInert('before-activation');
    preparation.activation = {at: start, pending: preparationPendingAtActivation, ...preparationAtActivation};
  }
  action = new Promise(resolve => { pendingFocus = {start, resolve, preparationPendingAtActivation, preparationAtActivation}; });
}, {capture: true});
picker.shadowRoot.addEventListener('focusin', event => {
  if (!pendingFocus || !event.composedPath().some(el => el.localName === 'en-calendar')) return;
  const pending = pendingFocus; pendingFocus = undefined;
  const firstReadyMs = performance.now() - pending.start;
  requestAnimationFrame(() => pending.resolve({start: pending.start, firstReadyMs, nextFrameMs: performance.now() - pending.start, focusInside: true, open: !!picker.shadowRoot.querySelector('en-dialog')?.open,
    preparationPendingAtActivation: pending.preparationPendingAtActivation, preparationAtActivation: pending.preparationAtActivation}));
}, {capture: true});
picker.addEventListener('en-change', () => {
  const start = performance.now(); selection = picker.updateComplete.then(() => ({updateMs: performance.now() - start, value: picker.value}));
});
const startup = snapshot(picker), shellReadyMs = performance.now();
async function prepare() {
  expectedPreparationState = preparationState();
  preparation.before = recordedState(expectedPreparationState);
  if (expectedPreparationState.open || expectedPreparationState.calendarConstructed) throw new Error('Preparation must begin with an unused closed shell');
  preparation.start ??= performance.now();
  await (prepareFeature ? prepareFeature() : picker.preparePicker());
  preparation.end = performance.now();
  if (!preparation.activation) assertPreparationInert('completion');
  else preparation.completionAfterActivation = true;
}
install({family: 'date', policy, requestedMode, actualMode: scope.mode, startup, shellReadyMs, errors,
  triggerSelector: 'en-date-picker #picker-trigger',
  snapshot: () => snapshot(picker), get action() { return action; }, get selection() { return selection; }, get preparation() { return preparation; },
  prepare, assertPreparationInert,
  abandon() {
    preparation.abandonedAt = performance.now();
    document.querySelector('#submit').focus();
    const focused = preparationState();
    // Moving focus away is the authored abandonment action, so subsequent completion
    // must preserve this exact active-element chain and the original registry identity.
    expectedPreparationState.focus = focused.focus;
    preparation.abandonedBefore = recordedState(focused);
    assertPreparationInert('abandoned');
  },
  async close() { picker.hidePicker(); await settle(picker); },
  async cycle() { const item = mount(); await settle(item); await item.showPicker(); item.hidePicker(); await settle(item); item.remove(); },
});
