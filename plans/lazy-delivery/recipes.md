# Lazy delivery consumer recipes

Historical Stage B implementation checkpoint, 28 September 2026. The Stage A design was frozen in commit `e98842ad764e80a2ff460ddab8f4ac713253ea0d`; this revision follows the implemented [shared contract](api.md), including its Stage B refinement. The coordinator reports the prior gate03 passed build/metadata, packed consumers, 8 Node checks and 135 browser checks; the subsequent gate04 passed the identity-validation regressions, nine Node contracts and the same 135 browser cases. See the [Stage B qualification checkpoint](stage-b.md) for exact receipts and current limits. This recipe review inspected source only and did not rerun those checks. Performance promotion, consumer benefit and manual acceptance are separate obligations.

Existing eager defaults stay in place. Choosing an opt-in profile does not mutate a live element, change an existing registry or create a new activation owner. The [rollout](../lazy-delivery-rollout.md) owns promotion gates; the [evidence index](evidence/README.md) separates new work from inherited findings.

The [current family recipes](candidate-recipes.md) retain eager behavior after the [original four rejections](measured-rejections.md) and [final command/combobox rejections](final-construction-rejections.md). Existing supported code-loading profiles remain separate. The [current checkpoint](README.md) distinguishes C4's full n30 record from its independent API-only n100 confirmation: shared API performance remains unqualified, with original date-policy outcomes preserved. The [accepted closeout](README.md#accepted-closeout) links the final 75-stage correctness record, later user exception, successful publication and archive readiness. Zero candidate rows alone did not establish completion; the recorded acceptance closes this rollout without promoting the rejected candidates.

## Choose the postponed work

| Operation | What it can complete | What it does not establish |
| --- | --- | --- |
| Import a definition, manifest or profile | Obtain an inert allowlist or definition | Registration, construction, usable controls |
| `load(tags)` / `createDefinitionPreparation(loaders).load(tags)` | Fetch/evaluate a definition closure | Registration, initialization, rendering, focus |
| `prepareDelivery(profile, featureIds)` | Fetch/evaluate allowlisted feature definitions | Activate a host, open a tool, commit a value |
| `ensure(tags)` | Register the dependency closure in one registry | Successful construction of every instance, render or focus readiness |
| `createElementActivation(...).activate()` | Materialize/associate an application boundary and await its `ready` callback | A widget's semantic action or hydration of SSR content |
| `createHydrationIsland(...).activate()` | Hydrate one owned SSR boundary and await module readiness | A second owner, a different initial snapshot, an opening action |
| `field.showPicker()` | Perform the date field's existing opening/focus contract, or a canceled no-op | Proof that a native user gesture survives an earlier `await` |

Synchronous semantic methods retain their signatures. Register the required closure before calling synchronous `show()`, `hide()`, `notify()` or `moveItems()` APIs. Essential native editing and authored text remain available. Neither undefined custom elements nor a hidden/inert body provide a native form fallback or remove allocated DOM.

## Global compatibility and ordinary scoped roots

The existing explicit global entry remains valid:

```ts
import '@en-reve/elements/define/date-picker.js';
// Existing markup and eager calendar behavior are unchanged.
```

For deliberate tag-level loading in the same document, use the existing loader. Application markup supplies an optional command host; essential navigation and the trigger remain eager.

```ts
import {createElementScope} from '@en-reve/elements/element-scope.js';
import {createElementLoader} from '@en-reve/elements/lazy.js';

const scope = createElementScope({document, registry: 'global'});
const definitions = createElementLoader(scope.registry);
await definitions.load(['en-command-palette']); // Explicit preparation, if wanted.
await definitions.ensure(['en-command-palette']);
// Await this palette's rendering before its application-owned open/focus action.
```

The first global definition can upgrade every matching connected global host. It cannot provide per-root dormancy or incompatible-version isolation. Keep optional markup in an inert template when independent construction matters; use the activation recipe below. A native ordinary-element scope avoids requiring a shadow wrapper:

```ts
import {html, render} from 'lit';
import {createElementScope} from '@en-reve/elements/element-scope.js';
import {createElementLoader} from '@en-reve/elements/lazy.js';

const scope = createElementScope({document: mount.ownerDocument});
const definitions = createElementLoader(scope.registry);
await definitions.ensure(['en-command-palette']);
const region = scope.createElement('section');
mount.append(region);
render(html`<en-command-palette label="Commands"></en-command-palette>`, region, {
  creationScope: scope.creationScope,
});
```

`mount` is an application-owned element. Retain one scope for the boundary and its repeated hosts. Inspect `scope.mode` when reporting actual behavior: `auto` selects the owner's global registry when native scope capability is unavailable. An explicit registry that cannot be honored throws; do not catch that failure and retry globally. Creating an ordinary global node and subsequently appending it beneath `region` does not change its association. A framework renderer needs its documented creation-factory integration, already-created scoped nodes, or deliberate global consumption.

## Inert discovery and registry-independent preparation

`deliveryCatalog` contains serializable catalog/profile assessments. A discovered feature is not necessarily a supported code-preparation binding; inspect the selected profile's `features` and its prerequisites before requesting it. Import this metadata only where discovery is needed. The selective date entry and full selectors do not import the complete discovery catalog.

```ts
import {deliveryCatalog} from '@en-reve/elements/delivery-catalog.js';
const dateAssessment = deliveryCatalog.components.find(component => component.tag === 'en-date-picker');
// Render assessment.disposition/version/fallback from dateAssessment.features.
```

For tag preparation without a registry, use the same frozen manifest as the eventual loader:

```ts
import {createDefinitionPreparation, createDefinitionLoader} from '@en-reve/elements/lazy-loader.js';
const preparation = createDefinitionPreparation(commandLoaders);
await preparation.load(['en-command-palette']);
const definitions = createDefinitionLoader(scope.registry, commandLoaders);
await definitions.ensure(['en-command-palette']);
```

Here `commandLoaders` is the frozen allowlist in the application-owned activation recipe. Imports coalesce through that manifest identity across these factories and scopes; registration remains registry-specific. With a profile created from an unfrozen input, pass `profile.loaders` to both factories because it is the captured immutable manifest. Distinct copied records do not promise shared loader calls. Keep loader closures free of retained DOM/request state; there is no unloading operation.

## Full and selective profiles before the first render

**Common profile API.** The full selector preserves canonical tag coverage. `selectDeliveryProfile('en-reve/eager')` selects existing eager definitions; the opt-in profile replaces only the date-picker loader with the existing same-constructor shell.

```ts
import {selectDeliveryProfile} from '@en-reve/elements/delivery-profiles.js';
const profile = selectDeliveryProfile('en-reve/date-picker-single-deferred');
// profile.loaders is suitable for createDefinitionLoader(scope.registry, ...).
// The no-argument selector returns the stable 'en-reve/eager' profile.
```

Both full profiles expose `en-reve/en-command-palette/root`. Only the full deferred-date profile and selective date profile bind `en-reve/en-date-picker/calendar`; the eager profile rejects that preparation request. For a date-only consumer, use the selective entry. It must not pull in the whole catalog or manifest. Select the entry and set both instance requirements before connection/first update:

```ts
import {createElementScope} from '@en-reve/elements/element-scope.js';
import {createDefinitionLoader} from '@en-reve/elements/lazy-loader.js';
import {datePickerSingleDeferredProfile as profile} from '@en-reve/elements/delivery-date-picker.js';
import type {EnDatePicker} from '@en-reve/elements/date-picker.js';

const scope = createElementScope({document: form.ownerDocument});
const definitions = createDefinitionLoader(scope.registry, profile.loaders);
await definitions.ensure(['en-date-picker']);
const field = scope.createElement('en-date-picker') as EnDatePicker;
field.selection = 'single';
field.calendarLoading = 'deferred';
field.label = 'Event date';
field.name = 'eventDate';
form.append(field);
await field.updateComplete; // Essential editor readiness; calendar remains optional.
```

`form` is the application-owned form. This fragment creates an enhanced field; a page that requires editing before this bootstrap or without JavaScript must retain a real native/server-rendered editor through the handoff and avoid duplicate successful form entries. A loader cannot supply no-JS semantics for an undefined custom host.

The profile exposes immutable `initialProperties` requirements; the consumer applies them. Selection does not apply them to all current/future hosts. A property write after the first update cannot remove code that the canonical eager definition already imported. Setting `calendarLoading = 'deferred'` with the canonical eager definition postpones calendar construction only. The shell additionally excludes that static calendar dependency; an unrelated eager import can still fetch it.

The current date field rejects changing `calendarLoading` after its first update and rejects deferred range selection. Use a new field with the eager definition for range; do not suppress this error or strand the user without essential editing. The range design/disposition is a separate rollout track.

## Declarative markup and shadow boundaries

**Profile selection with Lit/scoped creation.** Put declarative policy attributes in the initial template; do not rely on a later selector sweep:

```ts
import {html, render} from 'lit';
// Reuse scope and definitions from the selective profile recipe above.
const host = scope.createElement('div');
mount.append(host);
const root = scope.attachShadow(host);
render(html`
  <en-date-picker selection="single" calendar-loading="deferred"
    label="Event date" name="eventDate"></en-date-picker>
`, root, {creationScope: scope.creationScope});
```

Ordinary light DOM uses the same template and `creationScope` with an ordinary scoped container. Parser-created global markup retains its global association. Markup parsed in a null-associated native container is dormant until explicitly initialized. `scope.initialize(root)` associates only null light descendants; it never rebinds global nodes or crosses a nested shadow root. `scope.attachShadow(host)` validates document and registry ownership and does not overwrite an incompatible existing root.

For an application-owned optional boundary with nested shadow roots, enumerate every owned root. This native-only setup is an existing API recipe; the fallback recipe follows separately.

```ts
import {createElementScope, elementScopeCapabilities} from '@en-reve/elements/element-scope.js';
import {createElementActivation} from '@en-reve/elements/activation.js';
import type {EnCommandPalette} from '@en-reve/elements/command-palette.js';

const document = mount.ownerDocument;
const scope = createElementScope({document});
if (scope.mode !== 'scoped' || !elementScopeCapabilities(document).dormant) {
  throw new Error('Use a group boundary or the inert-template fallback.');
}
const root = document.createElement('section', {customElementRegistry: null});
const nestedHost = document.createElement('div', {customElementRegistry: null});
root.append(nestedHost);
const nested = nestedHost.attachShadow({mode: 'open', customElementRegistry: null});
nested.innerHTML = '<en-command-palette label="Commands"></en-command-palette>';
mount.append(root);
const activation = createElementActivation({
  scope, root, shadowRoots: [nested], policy: 'dormant',
  tags: ['en-command-palette'], loaders: commandLoaders,
  ready: async (_root, signal) => {
    const palette = nested.querySelector<EnCommandPalette>('en-command-palette')!;
    await palette.updateComplete;
    signal.throwIfAborted();
  },
});
```

`commandLoaders` is the frozen selective allowlist in the next recipe. A group boundary instead uses a dedicated unregistered scope and scoped-associated descendants with `policy: 'group'`. Registration upgrades matching hosts in that group. Do not use group mode for independent dormant siblings sharing one registry. An optional internal calendar still belongs to its individual date field even when several fields share definitions.

## Application-owned activation, preparation and disposal

The command palette supplies the second ownership pattern: the application owns its optional root and readiness; the component owns its commands and interaction. This existing recipe uses native dormant mode when qualified, a dedicated native group otherwise, and an inert template in global fallback:

```ts
import {createElementScope, elementScopeCapabilities} from '@en-reve/elements/element-scope.js';
import {createElementActivation} from '@en-reve/elements/activation.js';
import type {EnCommandPalette} from '@en-reve/elements/command-palette.js';

const commandLoaders = Object.freeze({
  'en-command-palette': () => import('@en-reve/elements/definitions/command-palette.js')
    .then(module => module.commandPaletteDefinition),
});
const document = mount.ownerDocument;
const scope = createElementScope({document});
const dormant = scope.mode === 'scoped' && elementScopeCapabilities(document).dormant;
const root = dormant
  ? document.createElement('section', {customElementRegistry: null})
  : scope.createElement('section');
const template = document.createElement('template');
template.innerHTML = '<en-command-palette label="Commands"></en-command-palette>';
if (scope.mode === 'scoped') root.innerHTML = template.innerHTML;
mount.append(root);
const activation = createElementActivation({
  scope, root, policy: dormant ? 'dormant' : 'group',
  tags: ['en-command-palette'], loaders: commandLoaders,
  template: scope.mode === 'global' ? template : undefined,
  ready: async (root, signal) => {
    const palette = root.querySelector<EnCommandPalette>('en-command-palette')!;
    await palette.updateComplete;
    signal.throwIfAborted();
  },
});

// Optional route/intent policy. Quiet failure leaves action-owned feedback intact.
void activation.load().catch(() => {});

let currentIntent = 0;
async function openCommands(retry = false) {
  const intent = ++currentIntent;
  try {
    await activation.activate({retry});
    if (intent !== currentIntent || !root.isConnected) return;
    const palette = root.querySelector<EnCommandPalette>('en-command-palette')!;
    palette.open = true; // Current semantic intent begins after readiness.
    await palette.updateComplete;
  } catch (error) {
    if (intent !== currentIntent) return;
    // Eager status/retry UI stays outside root; its Retry calls openCommands(true).
    reportCommandFailure(error);
  }
}
function abandonCommands() {
  currentIntent++;
  activation.cancel();
}
function disposeCommands() {
  currentIntent++;
  activation.dispose();
  root.remove(); // Application DOM remains application-owned.
}
```

The application binds its eager trigger to `openCommands()` and abandons stale intent on Escape, reset, replacement, relevant focus movement or view removal. It owns loading/error announcements, retry controls and any focus restoration. `reportCommandFailure` is the application's accessible status adapter. Readiness failure may retry without duplicating materialized content; registration failure is terminal for this controller. Disposal is terminal, releases controller references and prevents late mount/focus; create a new controller for a new view. The controller does not remove DOM or cancel another owner's shared import.

**Common-profile equivalent:** the full profiles expose `en-reve/en-command-palette/root`. Use `profile.loaders` as the activation owner's allowlist and `prepareDelivery(profile, ['en-reve/en-command-palette/root'])` for shared code preparation. The existing application controller still owns materialization/readiness and the current opening action. The selective date-only profile does not contain this command feature.

Keep preparation bounded and explicit. A route, pointer/focus intent or application-owned visibility policy may call `load()`; no library observer or global scanner is installed. If preparing multiple groups, yield between them, check the view's abort signal and allow current actions to activate directly. Count preparation traffic on never-used and abandoned visits. Do not await an import and then replay trusted-activation-only native picker, clipboard or color actions.

## Date instance preparation and opening

**Profile preparation:**

```ts
import {prepareDelivery} from '@en-reve/elements/delivery.js';
await prepareDelivery(profile, ['en-reve/en-date-picker/calendar']);
// No registry, DOM, focus or date instance is needed for this call.
```

**Existing per-instance alternative:** `await field.preparePicker()` prepares the same optional calendar feature. The profile and instance paths use the same immutable calendar allowlist and shared import cache. `prepareDelivery()` preserves `DefinitionLoadError` staging; `preparePicker()` and `showPicker()` retain their existing import-cause rejection shape. `field.showPicker()` remains the date owner's operation; it uses the host's render-creation registry and, where construction is supported, registers and constructs only that instance's optional surface, checks current state, opens and establishes usable focus. Do not mount its calendar through an application activation controller.

`hidePicker()`, Escape, disconnection/adoption, reset, disabling, readonly changes and moved focus can invalidate pending opening. A canceled opening resolves as a no-op. Import, registration and unsupported construction-ownership failures reject and leave native editing/validation usable. The local polite calendar status and explicit retry remain component-owned. Successful first use retains the closed calendar connected; the rejected detachment/recreation experiments do not authorize a new disposal policy. Removing the field cancels its pending work and releases listeners, while intentionally shared modules and definitions remain available.

The first deferred calendar construction is unsupported when its constructor inherits the source module's native `HTMLElement` base and the selected render-creation registry is another document's receiving global. Direct creation, import and target upgrade did not establish supported construction in the pinned browser matrix, including when the source constructor was registered in both globals. The date owner rejects this combination after loading and current-intent checks, before its optional registration/mounting step, using the existing localized error/retry status and preserving the native input and form state. Known definition-graph and registration conflicts retain their existing registration-error path; this guard does not predict every native definition error. Code-only preparation remains allowed.

This first-construction guard excludes the same global, native scoped registries, an already mounted calendar, eager mode and destination-native calendar hints. Those exclusions preserve existing paths; they do not qualify arbitrary hinted definitions or every warm adoption. Keep a scoped picker's original native association. For a rejected global picker, moving that same host back to its source document permits a new explicit opening attempt without a new sticky registration error. Creating a fresh picker from destination-realm modules in an unconflicted destination registry is a separate replacement choice; transfer supported application state explicitly. Neither choice replaces definitions already installed in a global registry.

## Hosts owned by another document

Take ownership from the actual mounting node, never the ambient top-level `document` or `customElements`:

```ts
function makeOwnerScope(mount: Element) {
  return createElementScope({document: mount.ownerDocument});
}
// Called by the bootstrap for the same-origin frame's ready document:
const scope = makeOwnerScope(frameMount);
const definitions = createDefinitionLoader(scope.registry, profile.loaders);
```

Use bootstrap code and realm-specific constructors appropriate to that document. An explicit foreign registry is an error. A same-document move preserves the source association; moving a global element beneath a scoped parent does not rebind it. Pending activation/hydration must be disposed before cross-document adoption. Recreate destination-owned controllers and any unqualified third-party editing backend, transferring only supported application state.

Preserve the actual native association after adoption and insertion, respecting explicit, null and unknown ownership boundaries. The pinned native controls show Chromium retaining the source-global association on adopted roots and their inserted children; WebKit exposes the receiving global, while Firefox exposes no registry-association API. A destination `ownerDocument` or destination-version instance alone does not prove destination association or usable late child rendering. Choosing the receiving global for future render construction, where existing ownership proof permits it, does not rewrite an existing node/root association. Synchronous owned-element factories and child-upgrade observation continue to use the actual association; no general foreign-class import or upgrade repair is promised.

Native scoped association is retained by adoption, so replacement and adoption remain different ownership choices. Register dependencies in the selected construction registry before creating descendants, respecting the date first-construction limit above. Do not silently retry a failed explicit scope in the receiving global registry.

## Consumer allowlists and version identity

The existing selective `commandLoaders` recipe is sufficient for tag loading and registration. The object belongs to the application: freeze it once and reuse it across scopes. Literal dynamic imports are an allowlist; never derive import URLs from tags, feature IDs, JSON or HTML. Third-party definitions alone establish no rendering, fallback, semantic, accessibility or SSR contract.

**Profile factory**, with an application-owned command feature:

```ts
import {createDeliveryProfile, prepareDelivery} from '@en-reve/elements/delivery.js';
const profile = createDeliveryProfile({
  schemaVersion: 1,
  id: 'example-app/commands',
  version: '1',
  loaders: commandLoaders,
  features: [{
    id: 'example-app/commands/root',
    version: '1',
    disposition: 'implemented',
    owner: 'application',
    deferredCosts: ['component-loading', 'registration', 'construction'],
    definitionTags: ['en-command-palette'],
    fallback: 'Native launcher and loading/error text remain outside activation root.',
    prerequisites: ['Application owns template, scope and readiness.'],
  }],
});
await prepareDelivery(profile, ['example-app/commands/root']);
// Preparation loads code only, despite the complete feature's deferredCosts.
// The application still owns activate(), readiness and the subsequent open action.
```

A tag-only consumer may use `features: []`, with `createDefinitionLoader(scope.registry, profile.loaders)` for `load()`/`ensure()`. `initialProperties` defaults to an empty list. An optional `preparations` map binds feature IDs to other explicit allowlists instead of the entry manifest. Preparation requires an implemented feature with nonempty allowlisted `definitionTags` and a `deferredCosts` entry of `component-loading` or `optional-code`. A construction-only descriptor is discovery data, not a code-preparation binding. Other dispositions reject preparation rather than appear to succeed. Richer claims require the owning adapter and qualification; a third-party loader does not inherit the library date contract.

Schema version, profile ID and profile version identify delivery behavior. Every feature descriptor also requires its own string `version`; changing a supported feature descriptor or adapter requires a new feature version and an updated containing profile version. Duplicate feature IDs in one profile are invalid even when their versions differ. Consumer IDs cannot occupy the reserved `en-reve/` namespace; feature IDs stay in their owner's namespace. The factory rejects malformed descriptors, duplicate features, missing loader tags and unused preparation keys; preparation resolves every requested feature before importing any of them. Reusing a captured source manifest through fresh options wrappers preserves sharing. A fresh spread/copy of the loader record has a new identity and is not promised shared loader promises. Mutating a captured source manifest is rejected when that source is reused by `createDeliveryProfile()`; existing profiles keep their frozen snapshot. Unrelated source manifests remain independent. Use a new immutable allowlist/profile version when behavior changes.

Version agreement is exact; it is not a semantic-version compatibility guess. Different compatible library copies may coexist in separate native registries with their own loaders. A matching profile string cannot make incompatible constructors compatible in one registry. The normal registration preflight still rejects that conflict; global fallback cannot isolate versions. There is no process-wide consumer-profile registration service and no overwrite/replace operation for a defined tag. Independent profiles can reuse namespaced IDs, so authors must keep repeated ID/version claims consistent with their documented delivery contract; the library cannot globally detect conflicting application definitions. `prepareDelivery()` accepts actual factory/selector profile objects, not spreads or JSON reconstructions of them. JSON identity data selects a known application allowlist; it cannot recreate executable loaders.

## SSR and streamed markup: one hydration owner

Use `createHydrationIsland()` for SSR, without an application activation controller on the same root. Its `load()` installs required hydration support before evaluating the allowlisted application module; its `activate()` establishes outer bindings before association/registration and awaits the module's explicit readiness. Do not independently prepare element definitions ahead of the ordered hydration bootstrap.

**Delivery identity in the server/client recipe.** Export `profile.identity` from a shared bootstrap-safe module; it contains only frozen identity data, and selecting the profile imports no element classes. The server allowlist entry and shared island module declare the same identity. The client island module exports that identity along with its existing `version`, `definitions`, `template` and `ready` exports. Put `selection="single" calendar-loading="deferred"` in both server and client templates; supply the identical captured date/snapshot.

```ts
// delivery-identity.ts — exports data without evaluating element classes.
import {datePickerSingleDeferredProfile as profile} from '@en-reve/elements/delivery-date-picker.js';
export const delivery = profile.identity;
```

```ts
// event-date-island.ts — evaluated through the allowlisted island loader.
import {html} from 'lit';
import {datePickerShellDefinition} from '@en-reve/elements/date-picker-shell.js';
import type {EnDatePicker} from '@en-reve/elements/date-picker.js';
export {delivery} from './delivery-identity.js';
export const version = 'event-date-v1';
export const definitions = [datePickerShellDefinition];
export function template(snapshot: {value: string; today: string}) {
  return html`<en-date-picker selection="single" calendar-loading="deferred"
    label="Event date" name="eventDate" value=${snapshot.value}
    today=${snapshot.today}></en-date-picker>`;
}
export async function ready(root: Element | ShadowRoot, signal: AbortSignal) {
  await root.querySelector<EnDatePicker>('en-date-picker')!.updateComplete;
  signal.throwIfAborted();
}
```

```ts
// Server: entry/module agreement is checked before server-side registration.
import {createScopedRenderer, renderIslandMarkup, serializeHydrationManifest} from '@en-reve/ssr/scoped.js';
import {delivery} from './delivery-identity.js';
const renderer = createScopedRenderer({
  'event-date': {
    module: new URL('./event-date-island.js', import.meta.url),
    version: 'event-date-v1',
    delivery,
  },
});
const result = await renderer.render({key: 'event-date', snapshot}, {signal});
const rendered = renderIslandMarkup(result, 'event-date-island');
const manifest = rendered.manifest; // Carries the verified delivery identity.
const safeManifestJSON = serializeHydrationManifest(manifest);
// Deliver rendered.html, safeManifestJSON and the same safely serialized snapshot.
// Application shutdown: renderer.dispose(); keep it alive across requests.
```

```ts
// Browser bootstrap: no static element-class imports before this boundary.
import {createHydrationIsland} from '@en-reve/ssr/client.js';
const host = document.getElementById(manifest.id)!;
const island = createHydrationIsland({
  root: host.shadowRoot ?? host,
  manifest,
  snapshot,
  loaders: {'event-date': () => import('./event-date-island.js')},
});
await island.load(); // Optional preparation under this hydration owner.
await island.activate(); // No second createElementActivation for this root.
// View teardown: island.dispose(); application removes its DOM if appropriate.
```

The server transport carries the verified entry/module identity through `ScopedRenderResult` into the markup manifest. The client module must export matching `delivery` before hydration can proceed. Pass only `profile.identity` as `delivery`, never the whole executable profile: strict identity validation accepts the supported `schemaVersion`, namespaced `id` and string `version` data shape. The renderer captures entry identity and the client captures manifest identity; each captures and compares the loaded module identity before collecting definitions. Later input mutation cannot change the accepted identity. Module evaluation has already happened when that comparison runs. A legacy island may omit it on both sides. If either side declares it, both must match schema/ID/version exactly before registration/hydration; a matching delivery identity does not replace existing version/tag checks or the exact initial-template/snapshot obligation.

For streaming, wait until the chosen boundary, its complete manifest and its snapshot are present before constructing its owner. Preserve DSD and Lit markers. Initial native hydration requires definitions to remain unregistered in its registry until all owned roots are associated; use a fresh registry for that bootstrap. The existing `'template'` output plus `template` option provides inert optional materialization in global fallback and qualified native roots. Essential native inputs/text remain outside an optional template. Global definitions may construct detached imported elements, so this controls connection/hydration rather than arbitrary constructor effects. Closed DSD is outside that recipe.

The hydration module's `ready(root, signal)` awaits actual widget updates and honors cancellation before effects. `dispose()` aborts pending work. Load failure can retry explicitly; failures after hydration starts are terminal because partial hydration and registration are irreversible. Preserve pre-hydration native drafts, composition, selection, focus, restoration and input node identity. Profile metadata is not a generic draft-restoration layer. Report server render/build cost separately from client hydration and first interaction.

## Failure recovery and eager rollback

| Failure stage | Owner and recovery |
| --- | --- |
| Profile/feature/tag lookup or initial identity validation | Correct the allowlist/configuration before retrying. Profile creation, complete preparation-request lookup and validation of supplied entry/manifest identity precede their imports. |
| SSR entry/module or manifest/module identity mismatch | The allowlisted module has already evaluated. Agreement fails before definition collection, registration, materialization or hydration; fix both identities without claiming to undo module evaluation. |
| Import/evaluation (`DefinitionLoadError.stage === 'load'`) | Explicit `{retry: true}` may invoke rejected loaders again. The browser module map can retain failure; retry is not a cache flush. Keep fallback and saved work available. |
| Registration (`stage === 'registration'` for the tag loader) | Definitions/evaluation already completed cannot be undone. Correct the conflict and use a fresh scope/page; do not retry globally or replace a constructor. |
| Construction/upgrade | The browser may report constructor exceptions independently; successful registration does not certify instances. The owning adapter must surface unusable content and retain fallback. |
| Rendering/readiness | Component/application owner determines a safe retry. Application activation can retry readiness without duplicating materialization; hydration after start is terminal. |
| Stale intent/removal/disposal | Cancel owner intent and release references. Shared imports may finish for other callers; no promise of unloading code or unregistering tags. |

Rollback is a new instance/build policy. Select `en-reve/eager` or the canonical date definition, ensure its full closure, and create fresh eager date fields. Preserve the supported accepted value/default/constraints explicitly. Do not change `calendarLoading` on an updated field or transfer private calendar drafts by reaching into its shadow DOM. Keep the old essential editor until a replacement is ready; the application decides how to preserve active edits and focus.

The eager definition and shell use the same date constructor, so either import order is compatible in a registry when dependencies are correctly registered. Importing the canonical eager definition adds its calendar closure; it cannot reclaim bytes or undo earlier evaluation. Mixed eager/shell orders, multiple scopes and actual global fallback require qualification. Rollback after a same-registry constructor conflict requires a fresh scope/page, not a new profile object around the same broken registry.

## Qualification commands and evidence limits

Run from the owning checkout with its pinned toolchain. The validation lane owns leases, ports and fresh output names; do not start these concurrently with its browser or timing campaign. First inspect the supported graph and verify retained metadata **before** any build or regeneration:

```sh
tooling/test-pipeline/with-toolchain.sh npm run test:plan
tooling/test-pipeline/with-toolchain.sh npm run test:inventory
tooling/test-pipeline/with-toolchain.sh npm run check:lazy
tooling/test-pipeline/with-toolchain.sh node tooling/metadata/generate-elements.ts --check
tooling/test-pipeline/with-toolchain.sh npm run check:types
tooling/test-pipeline/with-toolchain.sh npm run check:api
```

After reviewing authored changes and baseline freshness results, regenerate the complete sibling artifact set through supported build/metadata entries. Allocate a distinct, non-existing output for each outer test run (replace each example ID):

```sh
tooling/test-pipeline/with-toolchain.sh npm run build
EN_EXECUTION_OUTPUT="$PWD/artifacts/lazy-delivery/unique-lazy-run" \
  tooling/test-pipeline/with-toolchain.sh npm run test:lazy-registries
EN_EXECUTION_OUTPUT="$PWD/artifacts/lazy-delivery/unique-scoped-run" \
  tooling/test-pipeline/with-toolchain.sh npm run test:scoped-registries
EN_EXECUTION_OUTPUT="$PWD/artifacts/lazy-delivery/unique-api-run" \
  tooling/test-pipeline/with-toolchain.sh npm run test:api
```

These are commands to run, not results. The final validation owner adds affected SSR, packed consumer, metadata, public types and definition/profile import-closure coverage through the supported test graph. Assertions must exercise actual scoped ordinary/shadow/nested roots, document ownership, native/global modes, profile/property timing, load-only non-registration, both eager/shell orders, overlapping calls, retry, independent sibling cancellation and disposal. Packed browser fixtures must inspect static closures and actual network requests; literal `import()` alone proves no shipping split. No workspace alias or full catalog import may hide selective-entry cost.

Correctness passes do not establish route benefit. Predeclared matched production measurements report API overhead separately from optional feature savings, startup/never-used traffic, cold/prepared/repeat readiness, failed attempts, actual mode and retention. This document promotes no route and overrides none of the inherited rejected date/color/retention outcomes. Actual assistive-technology, device, IME, autofill and history observations retain their recorded source/workflow limits and stay distinct from automated focus and DOM checks. Current review status belongs to the canonical report; this recipe update marks no review complete.
