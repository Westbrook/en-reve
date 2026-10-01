import {createDeliveryProfile, prepareDelivery} from '@en-reve/elements/delivery.js';
import {datePickerSingleDeferredProfile} from '@en-reve/elements/delivery-date-picker.js';
import {createDefinitionLoader} from '@en-reve/elements/lazy-loader.js';
import {createElementScope, elementScopeCapabilities} from '@en-reve/elements/element-scope.js';
import {createElementActivation} from '@en-reve/elements/activation.js';

const params = new URLSearchParams(location.search);
const requested = params.has('global') ? 'global' : 'auto';
const scope = createElementScope({document, registry: requested});
const capabilities = elementScopeCapabilities(document);
const native = scope.mode === 'scoped' && capabilities.dormant;
const commandScope = native ? scope : createElementScope({document, registry: 'global'});
const fields: any[] = [];
const dateState = () => ({requested, actual: scope.mode, calendarDefined: !!scope.get('en-calendar'), fields: fields.map(field => ({calendarCount: field.shadowRoot?.querySelectorAll('en-calendar').length ?? 0, value: field.value, loading: field.calendarLoading, selection: field.selection, input: !!field.shadowRoot?.querySelector('input'), open: !!field.shadowRoot?.querySelector('en-dialog')?.open}))});

async function setupDates() {
  await createDefinitionLoader(scope.registry, datePickerSingleDeferredProfile.loaders).ensure(['en-date-picker']);
  let target: Element | ShadowRoot = document.querySelector('#islands')!;
  if (params.has('shadow')) target = scope.attachShadow(document.querySelector('#islands')!);
  for (let i = 0; i < 2; i++) {
    const field = scope.createElement('en-date-picker') as any;
    for (const requirement of datePickerSingleDeferredProfile.initialProperties) if (requirement.tag === field.localName) Object.assign(field, requirement.properties);
    field.label = `Date ${i}`; field.name = `date-${i}`; field.value = '2026-09-28'; field.today = '2026-09-28';
    target.append(field); fields.push(field);
  }
  await Promise.all(fields.map(field => field.updateComplete));
  return dateState();
}

async function mixed(order: 'eager-first' | 'shell-first') {
  const {selectDeliveryProfile} = await import('@en-reve/elements/delivery-profiles.js');
  const eager = selectDeliveryProfile(), shell = selectDeliveryProfile('en-reve/date-picker-single-deferred');
  const first = order === 'eager-first' ? eager : shell, second = order === 'eager-first' ? shell : eager;
  const a = createElementScope({document, registry: requested}), b = createElementScope({document, registry: requested});
  await createDefinitionLoader(a.registry, first.loaders).ensure(['en-date-picker']);
  const before = a.get('en-date-picker'), calendarBefore = !!a.get('en-calendar');
  await createDefinitionLoader(a.registry, second.loaders).ensure(['en-date-picker']);
  await createDefinitionLoader(b.registry, second.loaders).ensure(['en-date-picker']);
  await createDefinitionLoader(b.registry, first.loaders).ensure(['en-date-picker']);
  return {actual: a.mode, sameConstructor: before === a.get('en-date-picker') && before === b.get('en-date-picker'), calendarBefore, calendarAfter: !!a.get('en-calendar'), secondCalendar: !!b.get('en-calendar'), separateRegistry: a.registry !== b.registry};
}

let imports = 0, readiness = 0, failed = false, gate: Promise<void> | undefined, release: (() => void) | undefined;
let readinessGate: Promise<void> | undefined, releaseReadiness: (() => void) | undefined;
const commands = [{action: 'save', label: 'Save draft', keywords: ['save'], disabled: false}];
const commandProfile = createDeliveryProfile({schemaVersion: 1, id: 'fixture/commands', version: '1', loaders: {
  'en-command-palette': async () => {imports++; await gate; if (failed) throw Error('Intentional optional load failure'); return (await import('@en-reve/elements/definitions/command-palette.js')).commandPaletteDefinition;},
}, features: [{id: 'fixture/commands/root', version: '1', disposition: 'implemented', owner: 'application', deferredCosts: ['component-loading'], definitionTags: ['en-command-palette'], fallback: 'Native save remains available', prerequisites: ['Application owns the root']} ]});
const entries: any[] = [];
function addCommand() {
  const root = native ? document.createElement('section', {customElementRegistry: null}) : document.createElement('section');
  const template = document.createElement('template');
  template.innerHTML = '<en-command-palette label="Optional commands" search-label="Find command"></en-command-palette>';
  if (native) root.innerHTML = template.innerHTML;
  document.querySelector('#islands')!.append(root);
  const activation = createElementActivation({scope: commandScope, root, policy: 'dormant', loaders: commandProfile.loaders, tags: ['en-command-palette'], template: native ? undefined : template,
    ready: async (root, signal) => {readiness++; const palette = root.querySelector('en-command-palette') as any; palette.commands = commands; await palette.updateComplete; await readinessGate; signal.throwIfAborted();},
  });
  entries.push({root, activation});
  return entries.length - 1;
}
const commandState = () => ({requested, actual: commandScope.mode, native, imports, readiness, defined: !!commandScope.get('en-command-palette'), entries: entries.map(({root, activation}) => ({state: activation.state, nodes: root.querySelectorAll('en-command-palette').length, upgraded: !!(root.firstElementChild as any)?.updateComplete, open: !!(root.firstElementChild as any)?.open}))});
const outcome = (operation: Promise<void>) => operation.then(() => ({ok: true}), error => ({ok: false, name: error.name, stage: error.stage, message: error.message}));
(window as any).deliveryFixture = {
  setupDates, dateState, fields, mixed,
  prepareDates: () => Promise.all([prepareDelivery(datePickerSingleDeferredProfile, ['en-reve/en-date-picker/calendar']), ...fields.map(field => field.preparePicker())]),
  openDate: (index: number) => fields[index].showPicker(), closeDate: (index: number) => fields[index].hidePicker(),
  addCommand, commandState, entries,
  prepareCommands: (retry = false) => outcome(prepareDelivery(commandProfile, ['fixture/commands/root'], {retry})),
  activate: (index: number, retry = false) => outcome(entries[index].activation.activate({retry})),
  cancel: (index: number) => entries[index].activation.cancel(), dispose: (index: number) => entries[index].activation.dispose(),
  hold: () => {gate = new Promise(resolve => release = resolve);}, release: () => {release?.(); gate = undefined;},
  holdReadiness: () => {readinessGate = new Promise(resolve => releaseReadiness = resolve);}, releaseReadiness: () => {releaseReadiness?.(); readinessGate = undefined;},
  fail: (value: boolean) => {failed = value;},
};
