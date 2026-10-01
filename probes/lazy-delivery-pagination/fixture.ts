import {createElementScope, elementScopeCapabilities, type ElementScope} from '@en-reve/elements/element-scope.js';
import {paginationDefinition} from '@en-reve/elements/definitions/pagination.js';
import type {EnPagination} from '@en-reve/elements/pagination.js';

const params = new URLSearchParams(location.search);
const requested = params.has('global') ? 'global' : 'auto';
const boundary = params.get('boundary') ?? 'ordinary';
const scopes: ElementScope[] = [];
type InitialNodes = {shadow: ShadowRoot; panel: Element | null; pages: Element[]; authored: Element[]; slots: HTMLSlotElement[]};
const entries: {scope: ElementScope; root: Element | ShadowRoot; host: EnPagination; initial?: InitialNodes; events: unknown[]; openings: unknown[]}[] = [];
function createScope() {
  const scope = createElementScope({document, registry: requested});
  scope.register([paginationDefinition]); scopes.push(scope); return scope;
}
function makeRoot(scope: ElementScope, index: number) {
  const container = scope.createElement('section'); container.id = `container-${index}`;
  document.querySelector('#pagers')!.append(container);
  let root: Element | ShadowRoot = container;
  if (boundary !== 'ordinary') root = scope.attachShadow(container);
  if (boundary === 'nested') {
    const nested = scope.createElement('section'); root.append(nested); root = scope.attachShadow(nested);
  }
  return root;
}
const sharedScope = boundary === 'shared' ? createScope() : undefined;
const sharedRoot = sharedScope ? makeRoot(sharedScope, 0) : undefined;
for (let index = 0; index < 2; index++) {
  const scope = sharedScope ?? createScope(), root = sharedRoot ?? makeRoot(scope, index);
  const host = scope.createElement('en-pagination'); host.id = `pagination-${index}`;
  host.label = `Result pages ${index}`; host.pageCount = 12; host.page = 3;
  const previous = document.createElement('span'); previous.slot = 'previous'; previous.textContent = 'Previous';
  const next = document.createElement('span'); next.slot = 'next'; next.textContent = 'Next';
  host.append(previous, next); root.append(host);
  const entry = {scope, root, host, events: [] as unknown[], openings: [] as unknown[], initial: undefined as undefined | InitialNodes};
  host.addEventListener('en-change', (event: Event) => entry.events.push({detail: (event as CustomEvent).detail, during: host.page}));
  entries.push(entry);
}
const ready = Promise.all(entries.map(async entry => {
  await entry.host.updateComplete;
  const shadow = entry.host.shadowRoot!;
  entry.initial = {shadow, panel: shadow.querySelector('[part~=direct]'), pages: [...shadow.querySelectorAll('[part~=page]')], authored: [...entry.host.children], slots: [...shadow.querySelectorAll<HTMLSlotElement>('slot')]};
  shadow.querySelector('[part~=direct]')!.addEventListener('beforetoggle', (event: Event) => {
    const toggle = event as ToggleEvent;
    if (toggle.newState === 'open') entry.openings.push({body: shadow.querySelectorAll('[part~=jump]').length, input: shadow.querySelectorAll('[part~=page-input]').length, during: entry.host.isConnected});
  });
}));
function state() {
  return {requested, boundary, nativeCapability: elementScopeCapabilities(document).native,
    actual: scopes.map(scope => scope.mode), sharedRegistry: entries[0].scope.registry === entries[1].scope.registry,
    globalLeak: scopes.some(scope => scope.mode === 'scoped') && Boolean(customElements.get('en-pagination')),
    entries: entries.map(({host, scope, initial, events, openings}) => ({
      page: host.page, pageCount: host.pageCount, bodies: host.shadowRoot!.querySelectorAll('[part~=jump]').length,
      inputs: host.shadowRoot!.querySelectorAll('[part~=page-input]').length,
      shown: host.shadowRoot!.querySelector('[part~=direct]')?.matches(':popover-open') ?? false,
      constructorOwned: scope.get('en-pagination') === host.constructor,
      nativeOnly: !host.shadowRoot!.querySelector('[part~=direct]')?.querySelector(':not(div, label, input, button)'),
      sameShadow: initial!.shadow === host.shadowRoot,
      samePanel: initial!.panel === host.shadowRoot!.querySelector('[part~=direct]'),
      samePages: initial!.pages.length === host.shadowRoot!.querySelectorAll('[part~=page]').length && initial!.pages.every((node, index) => node === host.shadowRoot!.querySelectorAll('[part~=page]')[index]),
      sameAuthored: initial!.authored.length === host.children.length && initial!.authored.every((node, index) => node === host.children[index]),
      sameSlots: initial!.slots.length === host.shadowRoot!.querySelectorAll('slot').length && initial!.slots.every((node, index) => node === host.shadowRoot!.querySelectorAll('slot')[index]),
      slotsAssigned: initial!.slots.every((slot, index) => slot.assignedElements()[0] === initial!.authored[index]),
      events, openings,
    })),
  };
}
(window as any).paginationFixture = {entries, scopes, requested, boundary, ready, state};

