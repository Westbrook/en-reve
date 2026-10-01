import {createElementScope, elementScopeCapabilities} from '@en-reve/elements/element-scope.js';
import {createHydrationIsland, type HydrationManifest} from '@en-reve/ssr/client.js';
import type {EnPagination} from '@en-reve/elements/pagination.js';
import type {PaginationSnapshot} from './ssr-module.ts';

const manifest: HydrationManifest = JSON.parse(document.querySelector('#ssr-manifest')!.textContent!);
const mode = document.body.dataset.deliveryMode!;
const snapshot: PaginationSnapshot = {page: 3, pageCount: 12};
const islandHost = document.getElementById(manifest.id)!;
const root = islandHost.shadowRoot ?? islandHost;
const pagination = root.querySelector<EnPagination>('en-pagination')!;
const shadow = pagination.shadowRoot!;
const scope = createElementScope({document, registry: mode === 'global' ? 'global' : 'auto'});
const initial = {
  host: pagination,
  shadow,
  navigation: shadow.querySelector('nav'),
  panel: shadow.querySelector<HTMLElement>('[popover]')!,
  previous: shadow.querySelector('[part~="previous"]'),
  next: shadow.querySelector('[part~="next"]'),
  previousSlot: shadow.querySelector<HTMLSlotElement>('slot[name="previous"]')!,
  nextSlot: shadow.querySelector<HTMLSlotElement>('slot[name="next"]')!,
  previousContent: pagination.querySelector('[data-authored="previous"]'),
  nextContent: pagination.querySelector('[data-authored="next"]'),
  input: shadow.querySelector<HTMLInputElement>('input'),
  numbered: [...shadow.querySelectorAll('[part~="page"]')],
};
const counts = {ready: 0};
const island = createHydrationIsland({
  root, manifest, snapshot, scope,
  loaders: {pagination: async () => {
    // The island installs hydration support before importing component code.
    const module = await import('./ssr-module.ts');
    return {...module, ready: async (hydrationRoot: Element | ShadowRoot) => {
      await module.ready(hydrationRoot);
      counts.ready++;
    }};
  }},
});

const fixture = {
  mode, snapshot, root, pagination, initial, counts, island,
  nativeScopes: elementScopeCapabilities(document).native,
  async hydrate() { await island.activate(); },
  inspect() {
    const currentShadow = pagination.shadowRoot!;
    const input = currentShadow.querySelector<HTMLInputElement>('input');
    const numbered = [...currentShadow.querySelectorAll('[part~="page"]')];
    return {
      sameHost: root.querySelector('en-pagination') === initial.host,
      sameShadow: currentShadow === initial.shadow,
      sameNavigation: currentShadow.querySelector('nav') === initial.navigation,
      samePanel: currentShadow.querySelector('[popover]') === initial.panel,
      samePrevious: currentShadow.querySelector('[part~="previous"]') === initial.previous,
      sameNext: currentShadow.querySelector('[part~="next"]') === initial.next,
      samePreviousSlot: currentShadow.querySelector('slot[name="previous"]') === initial.previousSlot,
      sameNextSlot: currentShadow.querySelector('slot[name="next"]') === initial.nextSlot,
      samePreviousContent: pagination.querySelector('[data-authored="previous"]') === initial.previousContent,
      sameNextContent: pagination.querySelector('[data-authored="next"]') === initial.nextContent,
      previousAssigned: initial.previousSlot.assignedElements()[0] === initial.previousContent,
      nextAssigned: initial.nextSlot.assignedElements()[0] === initial.nextContent,
      sameNumbered: numbered.length === initial.numbered.length && numbered.every((node, index) => node === initial.numbered[index]),
      bodyCount: currentShadow.querySelectorAll('[part~="jump"]').length,
      inputCount: currentShadow.querySelectorAll('input').length,
      sameSSRInput: initial.input ? input === initial.input : null,
      inputValue: input?.value ?? null,
      page: pagination.page,
      state: island.state,
      registryMode: island.mode,
      expectedRegistryMode: mode === 'global' || !this.nativeScopes ? 'global' : 'scoped',
    };
  },
};
(window as typeof window & {ssrPaginationFixture: typeof fixture}).ssrPaginationFixture = fixture;


// Opt-in companion controls do not participate in the island's rendered tree.
// Native release is newer focus intent: recovery must not focus the chooser.
const reviewParams = new URLSearchParams(location.search);
if (reviewParams.has('human-review')) {
  const controls = document.createElement('section');
  controls.dataset.humanReview = 'pagination';
  controls.setAttribute('aria-label', 'Pagination hydration companion diagnostic');
  controls.innerHTML = `<h2>Pagination hydration companion diagnostic</h2>
    <p>Keyboard-open Choose a page, then use your browser's next-control key to reach Release pagination hydration and press Enter (Tab, or Option+Tab in macOS Safari when Tab omits buttons). The native opening has finished while the chooser is hidden. Release keeps focus on this button while recovering the still-open chooser. A pointer click outside may dismiss the native popover instead; do not report that as open-shell recovery.</p>
    <button type="button">Release pagination hydration</button>
    <p data-release-state>Hydration is held. This companion is separate from production-route review.</p>`;
  const release = controls.querySelector('button')!;
  const state = controls.querySelector<HTMLElement>('[data-release-state]')!;
  let released = false;
  initial.panel.addEventListener('toggle', event => {
    controls.dataset.nativeToggle = (event as ToggleEvent).newState;
  });
  release.addEventListener('click', async () => {
    if (released) return;
    released = true;
    // Do not disable/remove the focused native control or restore old focus.
    release.setAttribute('aria-disabled', 'true');
    release.setAttribute('aria-busy', 'true');
    state.textContent = 'Hydration has been released.';
    try {
      await fixture.hydrate();
      state.textContent = 'Hydration completed. Review the chooser and current focus; reload for a fresh first-use case.';
    } catch {
      state.textContent = 'Hydration failed. Record the failure and reload for a fresh case.';
    } finally { release.setAttribute('aria-busy', 'false'); }
  });
  if (reviewParams.has('progress-report')) {
    const link = document.createElement('a');
    link.href = 'http://127.0.0.1:4177'; link.textContent = 'Progress Report'; controls.append(link);
  }
  document.body.append(controls);
}
