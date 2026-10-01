# Scoped custom element registries: adoption plan

**Phases 1–6 are sealed through `220d2dd3`, including final Phase 6 retry/lifecycle fixes, targeted manual acceptance, and the v2 performance archive.** The final Phase 5 boundary is `2dc77b5773839f7afdd52ce0b4fc68a6af35d0f4`, following runtime/performance commit `4a6da1fba47ba47c32612e83e4cd9db0584ba774`. See [Phase 5 completion](scoped-registry-phase-5.md#final-manual-review-boundary) and the [detailed Phase 6 plan](scoped-registry-phase-6.md). The immutable original proposal is retained under `plans/review-snapshots/`.

The reference review, original gap inventory and Phases 1–5 descriptions below preserve the adoption rationale; their implementation outcomes are recorded in the individual phase plans and frozen receipts. They are not outstanding Phase 6 prerequisites. Historical performance series use different workloads and must not be subtracted to invent across-phase deltas.

Adopt native registries through the existing registration graph and a small, shared DOM/Lit adapter. Start with eager definitions and unchanged component behavior. Then independently control **module loading, definition registration, node creation, and interaction readiness**. Those four controls offer different savings and need different accessibility contracts.

Use native scoping for library-controlled construction wherever the required operations work. Use the relevant document's `window.customElements` when they do not. Preserve current global `define/*` entry points as an explicit compatibility path. Already-created global DOM cannot be silently converted to a scoped tree.

## Review of the reference implementations

The [Reve implementation](https://github.com/reve-ai/reve-core/blob/7d6cffe3cad4447786e1cb23114493e6a9ce8ba6/webapp/design-library/src/common/reve-element.ts) is the closer native starting point. It uses `customElementRegistry`, bridges Lit's creation scope through `document.importNode`, reuses an existing shadow root, and falls back to global definitions. Its useful structure is dependency declarations plus centralized root/creation helpers.

Before adopting that structure, address these findings:

- `getCustomElementRegistry()` creates another registry for every call. Ordinary eager instances can share one keyed by concrete component/dependency configuration and realm; intentionally independent activation groups need separate ownership.
- `createRenderRoot()` can retain an existing root while choosing a newly created registry for subsequent imports. Resolve the actual root registry first; initialize a null root explicitly or reject an incompatible configuration.
- The module-level `ShadowRoot.prototype` probe is unsafe without browser globals and does not verify constructor/import behavior.
- `getCreationScope()` cannot preserve intentional dormancy: `?? undefined` selects a fallback, but the native import option is non-nullable, so passing null directly is not a fix. It also uses the ambient document and always supplies the new overload; older boolean-only implementations treat that object as `true`, breaking shallow imports (Lit normally imports deeply).
- `defineCustomElements()` silently retains a different constructor under an occupied name. Preserve this repository's stronger conflict checks.

The [Lit mixin](https://github.com/lit/lit/blob/01dbc6673cdc211543932afd0ca04e223e567366/packages/labs/scoped-registry-mixin/src/scoped-registry-mixin.ts) provides a useful static `elementDefinitions` convention and registry reuse. However, it uses the polyfill-era `customElements` shadow option and proposed `ShadowRoot.importNode()` through `creationScope`. It has no native/global capability branch and eagerly registers the whole map. Its static registry access also needs care with subclass inheritance: a subclass can inherit a registry while declaring a different dependency map. It is not a drop-in native adapter. Preserve Lit's root reuse, style adoption, render-marker ordering, and hydration behavior when replacing `createRenderRoot()`.

## Original review: library foundations and gaps

Original review baseline: `61dd26be531b47bdaf31d4939083f152640c47ac`, branch `codex/theme-api-adoption`, with unrelated working-tree changes retained. This table describes that baseline, before the sealed implementation phases.

| Surface | Original evidence | Consequence for adoption |
| --- | --- | --- |
| Registration | [registration.ts](/Users/westbrook/Documents/repos/design-system/packages/primitives/src/interactions/registration.ts:9) already accepts a registry, resolves dependencies, and preflights identity conflicts | Extend this implementation; no parallel registration graph |
| Lookup | [element-registry.ts](/Users/westbrook/Documents/repos/design-system/packages/elements/src/internal/element-registry.ts:1) reads the element's own association and preserves null | Reuse it for light DOM, shadow DOM, and upgrade watchers |
| Base element | [en-element.ts](/Users/westbrook/Documents/repos/design-system/packages/elements/src/internal/en-element.ts:29) has no registry-aware render-root adapter | Defining the parent in a scope alone does not fix nested custom children |
| Consumption | [catalog.ts](/Users/westbrook/Documents/repos/design-system/packages/elements/src/catalog.ts:1) eagerly imports all definitions; [define/date-picker.ts](/Users/westbrook/Documents/repos/design-system/packages/elements/src/define/date-picker.ts:4) explicitly registers globally | Keep eager/global consumption; add independent selective and lazy surfaces |
| Construction | [toast-region/element.ts](/Users/westbrook/Documents/repos/design-system/packages/elements/src/toast-region/element.ts:70) creates `en-toast` with default `createElement()` | Make returned elements use the region's registry, retaining synchronous API behavior |
| Metadata | [definition-graph.ts](/Users/westbrook/Documents/repos/design-system/tooling/metadata/definition-graph.ts:125) expects global define entries | Add scoped/lazy metadata checks without weakening existing global-entry checks |
| SSR | [ssr/index.ts](/Users/westbrook/Documents/repos/design-system/packages/ssr/src/index.ts:23) has no scope option; installed Lit SSR resolves global definitions | Scoped hydration needs a separate implementation and verification phase |
| Feasibility | [existing probe](/Users/westbrook/Documents/repos/design-system/probes/fixtures/browser.ts:59) uses an initialized detached document as Lit's creation scope | Reuse this alternative where native import options are unavailable; verify styles and adoption |

## Platform rules the design must preserve

An ordinary element can own a registry. Create it with `document.createElement(tag, {customElementRegistry})`; parsing trusted content in that element uses its scope. Association is per node, not a live nearest-ancestor cascade. Moving a globally created node beneath a scoped container does not change its registry. A new shadow root defaults to the document registry unless the intended registry is explicitly supplied. Registry isolation does not provide CSS, event, or ID isolation. [DOM creation and attachment](https://dom.spec.whatwg.org/#dom-document-createelement), [fragment parsing](https://html.spec.whatwg.org/multipage/parsing.html#parsing-html-fragments)

Keep three operations distinct:

| Operation | Meaning | Scheduling implication |
| --- | --- | --- |
| `define(tag, Constructor)` | Adds one definition and initiates matching connected upgrades throughout that registry | One tag can activate many instances, including instances in other roots sharing that registry |
| `initialize(root)` | Assigns this registry to null-associated inclusive light descendants and attempts their upgrades | Enables selective activation of previously unassociated ordinary subtrees; nested shadow roots need separate initialization |
| `upgrade(root)` | Attempts upgrades of matching already-associated elements, including detached/shadow descendants | Useful for prepared detached trees; cannot reassign another registry |

Neither initialization nor upgrade converts an existing global association. There is no definition lookup fallback from a native scope to the global registry. `whenDefined()` establishes definition availability, not a rendered or usable widget. A failed constructor leaves that element failed; registering again is not a recovery mechanism. [HTML registry algorithms](https://html.spec.whatwg.org/multipage/custom-elements.html#custom-elements-api), [MDN initialize](https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/initialize)

Native import options specify a fallback registry during cloning; they do not rebind nodes carrying an existing scoped association. Prefer inert template content as input, and diagnose incompatible imported nodes. Use scoped `createElement()` rather than assuming `new ComponentClass()` can resolve a scoped-only definition. [DOM import](https://dom.spec.whatwg.org/#dom-document-importnode), [HTML constructors](https://html.spec.whatwg.org/multipage/dom.html#html-element-constructors)

The constructor remains listed as limited availability. This review also ran a [reproducible native probe](/Users/westbrook/Documents/repos/design-system/artifacts/scoped-registry-plan/native-probe.mjs): **14 checks passed in each of Chromium 153.0.8010.12 and WebKit 26.6; Firefox 155.0 could not construct the registry**. These are installed Playwright engines, not a retail-support or accessibility certification. The [receipt](/Users/westbrook/Documents/repos/design-system/artifacts/scoped-registry-plan/native-probe.json) verifies light DOM, parsing, connected/detached upgrades, null islands, shadow boundaries, and imports. [MDN constructor](https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/CustomElementRegistry)

## Delivered shared contract

Phases 1–4 delivered scope construction, lazy definition loading and explicit activation as separate APIs. The original proposal's `scope.preload()`, `scope.ensure()`, `scope.activate()`, `scope.ready()` and `scope.dispose()` names are not methods on `ElementScope`; use the implemented loader and activation-controller APIs below. Ordinary component properties, events, slots, parts and synchronous methods retain their existing contracts.

| Implemented operation | Contract |
| --- | --- |
| `createElementScope({document, registry: 'auto' \| 'global' \| explicitRegistry})` | Returns an owner for newly controlled construction; auto chooses native or that document's global registry before construction; an explicit registry must be honored or rejected |
| `scope.register(definitions)` | Synchronous registration using the existing dependency/preflight implementation |
| `scope.createElement(tag)` / `scope.creationScope` / `scope.attachShadow(host)` | Consistent imperative, Lit and shadow-root construction in that registry and document |
| `scope.initialize(root)` / `scope.upgrade(root)` | Explicit null-node association or upgrade; neither rebinds another registry; initialize nested shadow roots separately |
| `scope.get(tag)` / `scope.whenDefined(tag)` | Registry lookup and definition availability; definition availability is not rendered interaction readiness |
| `createElementLoader(scope.registry)` / `createDefinitionLoader(scope.registry, loaders)` | Creates a registry-targeted loader using the generated library manifest or an explicit allowlist |
| `loader.load(tags, {retry})` | Imports and evaluates definition modules without registering them; this is not a network-only preload hint |
| `loader.ensure(tags, {retry})` | Imports required dependency closures, preflights conflicts and registers dependency-first; shared module work and registry-targeted registration are separate |
| `createElementActivation({scope, loaders, tags, root, policy, ready, ...})` | Owns an explicit application activation boundary with a required readiness callback; supports dedicated groups, null-associated dormant boundaries and qualified global template fallback |
| `activation.load({retry})` / `activation.activate({retry})` | Prepares code only, or coalesces activation and resolves after the supplied `ready(root, signal)` check; the application chooses preparation triggers and scheduling |
| `activation.cancel()` / `activation.dispose()` | Cancels pending intent and, on disposal, releases owned DOM references; does not remove application DOM, unregister definitions or unload imported JavaScript |

The implementation sources are [element-scope.ts](../packages/elements/src/element-scope.ts), [lazy.ts](../packages/elements/src/lazy.ts), [lazy-loader.ts](../packages/elements/src/lazy-loader.ts) and [activation.ts](../packages/elements/src/activation.ts). Readiness is explicitly supplied by the application, not an automatic wait for all optional descendants. There is no implicit observer, prediction policy or document-wide activation scheduler.

Separate module identity from registry identity: import promises can be shared by module/version; registration state belongs in a `WeakMap<CustomElementRegistry, ...>`. Associate plans with roots separately from native ownership, especially while ownership is null. Do not store a single ambient mutable registry, change global DOM methods, or silently borrow another scope's definitions.

## Phase 1 — Naive native adoption, eager everywhere

**Outcome:** the same complete, eagerly available components render correctly in scoped and global environments. Performance improvement is not an acceptance condition yet.

1. Add a cached capability adapter per owner realm. Safely check browser globals, constructor usability, actual shadow and ordinary-element association, and template import/upgrade behavior. Use local test tags in temporary registries, never permanent global probe definitions. Unsupported dictionary properties may be ignored, so presence tests alone are insufficient.
2. Prefer the modern import-options bridge after a behavior check. If that overload is unavailable but registries and `initialize()` work, qualify the existing detached-document creation-scope technique. For deliberately null-associated content, use a separately qualified dormant creation path such as parsing into a null-associated element; do not pass null to `ImportNodeOptions.customElementRegistry`. Otherwise choose global mode for that construction surface before creating nodes. Do not catch component failures and retry global registration.
3. Add explicit app/island scope construction supporting ordinary elements and shadow roots. Preserve global side-effect imports for existing consumers. `registerAll(scope.registry)` is an acceptable first demonstration; selective definition imports remain preferred for real applications.
4. Extend `EnElement` to supply the chosen registry at every new shadow boundary and the corresponding Lit `creationScope`. In automatic mode, an existing non-null root registry stays authoritative, including global roots from current DSD/SSR. Reject only an explicitly requested incompatible registry. Preserve intentional null until an explicit activation step; never write `registry ?? window.customElements`. Retain `StaticStylesController`, Lit's `renderBefore` behavior, style deduplication, and existing hydration setup.
5. Register full required dependency closures before exposing parents as ready. Use the actual element registry for scoped hosts. For ordinary global hosts, a class/dependency-configuration-and-realm cached private render registry can eagerly contain internal children. Public slotted children retain their separately assigned registry. Avoid creating a registry for every repeated leaf instance by default.

**Global behavior:** only automatic mode may select global fallback; an explicit supplied registry must work or fail clearly. Use `ownerDocument.defaultView.customElements` for `get`, `define`, `whenDefined`, and `upgrade`, and the original boolean `importNode` overload. Detached/server documents need an injected context; do not assume an unrelated global window. Global mode cannot host conflicting definitions under the same tag; fail explicitly on a constructor mismatch.

**Exit gate:** two same-tag versions in distinct scopes; nested date-picker/calendar and split-view/splitter; light DOM plus shadow DOM; global collision checks; fallback operation in an engine without the constructor; safe server imports; preserved styles and current hydration. Verify class registry caches do not mix subclass definitions. Export types and usage examples alongside the adapter.

## Phase 2 — Make registry ownership correct across the API

**Outcome:** moving beyond the base class does not silently reintroduce global construction or leave composite controls partially initialized.

- Audit `createElement`, `importNode`, `cloneNode`, template/HTML parsing, direct class construction, `customElements.*`, `instanceof`, and methods that return elements. Start with `toast-region.notify()`. Keep known synchronous methods synchronous by retaining their hard dependencies; offer separate asynchronous preparation APIs rather than changing return types unexpectedly.
- Audit slotted children and framework renderers: a renderer calling default `document.createElement()` cannot become scoped by mounting inside a scoped section. Provide qualified renderer/factory recipes and global compatibility guidance. Do not promise transparent scoped support to arbitrary React/Vue/Svelte creation paths.
- Define move/portal behavior. Same-document moves preserve association; scoped associations also survive cross-document adoption, while global associations can map to the receiving document's registry. New overlay descendants use their source scope explicitly. Top-layer presentation alone does not change ownership. Cross-document adoption, realm-specific constructors and styles get dedicated coverage; recreate through the destination factory when transfer is not supported.
- Coordinate lazy authored children explicitly. [Radio groups](/Users/westbrook/Documents/repos/design-system/packages/elements/src/radio-group/index.ts:160), [accordions](/Users/westbrook/Documents/repos/design-system/packages/elements/src/accordion/accordion.ts:56), and [tabs](/Users/westbrook/Documents/repos/design-system/packages/elements/src/tabs/tabs.ts:83) can otherwise miss children that acquire methods during upgrade: upgrade need not emit `slotchange` or a child-list mutation. Reuse registry-aware watchers already present in toolbar/menu/tree, add activation notifications for null-to-registry transitions, and guard disconnected/replaced hosts.
- Test property assignments before upgrade, including custom accessors and objects, so initializers do not discard consumer state. Preserve event cancellation, form ownership, and one accepted `en-change` transaction. Specify foreign-version child compatibility rather than removing all constructor checks indiscriminately.

**Exit gate:** packed-package registry tests cover all construction paths and representative composites; duplicate definitions remain idempotent for identical classes and reject incompatible classes; pending children cannot leave missing labels, stale selection, or duplicate tab stops. Preserve open report regressions for child mutation, style adoption, and assistive-technology traversal.

## Phase 3 — Lazy code and definitions, by component family

**Outcome:** a consumer can load only the functionality it uses, with registration independent from import.

Generate a new lightweight manifest of literal dynamic imports to side-effect-free definition subpaths. Keep the eager catalog separate. Lazy loaders must never import `define/*`, the eager catalog, or a barrel that eagerly brings the whole library. Verify emitted chunks rather than assuming dynamic syntax proves splitting.

Initially defer whole families with their current hard dependency closure. Load the parent and mandatory children together. Next classify graph edges as required-at-start, optional-feature, and author-supplied children; update graph/metadata generation from one authority. Breaking a dependency edge requires changing the parent so it no longer eagerly imports or renders that feature. Type-only imports and optional adapters prevent accidental retention.

`ensure()` deduplicates requests, waits for all required modules before registration, uses conflict preflight, and defines dependencies first. Concurrent scope requests share import work but register separately. Unknown tags never become arbitrary import URLs. Allow explicit retry for failed loads and clear retry state; distinguish module fetch/evaluation failure from permanent element-constructor failure. Since native registration is irreversible, promise no rollback after a partial native failure.

Keep buttons, primary navigation, visible forms, critical status/live regions, and the current interaction unit ready. Good early candidates are command-palette bodies, rich editor extensions, chart/media tools, and optional date/color surfaces. Treat menu+items, tabs+panels, and radio-group+radios as coordinated units until delayed child coordination is proven.

**Exit gate:** packed consumer builds prove an optional feature's JavaScript is absent from startup requests, definition modules have no global side effects, load failures preserve usable content, and first keyboard/touch activation works. Measure import/evaluation, registration, and render readiness separately. `whenDefined()` is never the sole readiness check.

## Phase 4 — Activate selected trees and elements

**Outcome:** downloading code need not activate every matching element, and several instances of one tag can become interactive at different times.

Offer two native policies. A **registry per activation group** can hold connected undefined tags and register them when that group is needed. A **shared registry with null-associated dormant islands** can load/register definitions once and later initialize only selected islands. The latter reduces duplicated registry bookkeeping. Avoid accidentally assigning a dormant child to a registry in an earlier render/import step.

Native behavior sketch, using trusted fixed markup and a preloaded definition:

```js
const registry = new CustomElementRegistry();
const island = document.createElement('section', {
  customElementRegistry: null,
});
island.innerHTML = '<en-chart></en-chart>';
document.body.append(island);

registry.define('en-chart', EnChart); // Other associated instances may upgrade.
// This island still has no registry, so its chart remains undefined.
registry.initialize(island);         // Activate this island when needed.
```

This is also an element-level technique: initialize an individual null-associated host when its independent behavior is needed. Initialize nested shadow roots explicitly. Once an island is assigned to a registry, a later `define()` can activate every matching associated node; initialization is a one-time association boundary, not a reversible pause switch. If one registry already contains thousands of connected matching nodes, `upgrade(oneNode)` cannot contain the upgrade work caused by `define()`.

Use explicit activation as the reliable baseline. Optional prediction can preload on near-viewport intersection, pointer intent, focus intent, route prediction, or idle time. Keyboard focus and programmatic opening must be first-class triggers; hover alone is inadequate. Schedule independent small groups between tasks and prioritize current input. Constructors themselves cannot be interrupted by a scheduler. Avoid document-wide mutation scanners and thousands of per-node observers; use explicit manifests and bounded observers per island.

**Global fallback:** delayed global `define()` upgrades every connected matching tag. For equivalent per-island deferral, retain inactive markup in `<template>` or create it on demand, with useful native fallback outside the template. Do not leave supposedly dormant same-tag hosts connected once the global definition exists. Different-version isolation is unavailable in this mode.

**Usability contract:** show stable native text/control fallbacks and bounded loading/error status. Keep critical form association eager; offscreen required fields still participate in submission and validation. An undefined custom element has no automatic widget semantics or `ElementInternals`. Never blanket-hide `:not(:defined)`. Preserve focused input identity, composition/drafts and selection during enhancement; use `aria-busy` only for the region actually busy. Keep an early live-region shell to avoid missing announcements.

Use a state model of dormant → loading → activating → ready, with explicit error/retry and disposal states. A canceled/disconnected request must not steal focus or append stale content later. Do not replay arbitrary events: queue an application action with current state, then perform it once when ready. File pickers, fullscreen, and other user-activation-gated APIs must be ready synchronously or request a fresh explicit gesture.

**Exit gate:** two same-tag dormant islands, only one activated; null/global distinction; canceled loading; keyboard/touch/programmatic activation; failure and retry; stable focus and geometry; correct form submission before optional code loads; manual screen-reader review of loading and transitions.

## Phase 5 — Scoped SSR and progressive hydration

**Outcome:** server markup remains useful and becomes interactive with the intended registry without replacement or hydration races.

The original SSR implementation did not establish this. The sealed [Phase 5 implementation](scoped-registry-phase-5.md) supplies the opt-in isolated renderer and explicit client bootstrap. Its original requirement was request-local definition/scope metadata and renderer lookup, plus a client manifest mapping island IDs to versioned, allowlisted loaders and activation policy. Do not mutate a process-global server registry per request to impersonate isolated scopes.

For declarative shadow DOM, qualify `shadowrootcustomelementregistry` to leave relevant roots null for later initialization. Load hydration support first, associate roots in the planned order, and allow definitions/upgrades only when the corresponding hydration ownership is established. `initialize()` may itself trigger immediate upgrade, so it belongs in this ordered bootstrap. Keep the installed Lit workaround that currently uses `deferHydration: false` until tests justify a replacement.

Ordinary server-parsed light-DOM custom tags already associated with the document registry cannot be retargeted through `initialize()`. Support a deliberate choice: global enhancement of existing SSR content, a qualified null-registry declarative shadow boundary, or native fallback plus inert template materialization into an explicitly created light-DOM scope. Do not claim a magic attribute converts arbitrary existing light DOM. Reconstructing existing form content requires preserving user edits and may be inappropriate.

Keep server/client data snapshots, IDs, styles and Lit markers aligned. Scoped lazy hydration can save execution, but already-delivered DSD still contributes bytes and nodes. Essential controls need a functional pre-hydration native path or eager activation, and status/labels must not be duplicated when internals appear.

**Exit gate:** complete HTML and incrementally delivered HTML/chunk fixtures (not a new streaming SSR renderer; current adapters buffer/finalize output), no-JS content, delayed/failed chunks, two scoped versions, fallback browsers, native node identity, form restore/autofill/reset/validation, focus/draft/IME preservation, static stylesheet adoption, and assistive-technology review. Distinguish unit/browser passes from physical-device/manual acceptance.

## Phase 6 — Reduce DOM and tune activation using evidence

**Outcome:** measured initial-work savings for unused optional internals, with a usable essential field, bounded first-use/repeat costs and preserved accessibility. The [detailed Phase 6 execution plan](scoped-registry-phase-6.md) is authoritative for scope, contracts, measurements and exit gates. See [execution results](scoped-registry-phase-6-results.md) for implementation, qualification, final measurements and accepted review limits.

Start from the sealed Phase 5 parent in an isolated build. Re-measure the date picker before estimating savings: the historical 623-node/181-element census was the complete frozen field, not its removable calendar or a current baseline. Keep the eager consumption path compatible and introduce an opt-in single-date pilot. Range mode stays eager until it has a qualified editable fallback; its native endpoint editors currently live inside the optional dialog.

| Increment | Concrete work |
| --- | --- |
| 6.0 | Fix the date workload, dependency/API inventory, matched parent baseline and practical budgets. |
| 6.1 | Defer calendar construction with imports held constant; investigate full-overlay deferral separately. |
| 6.2 | Split optional feature code through compatible graph/export tooling; verify packed production chunks and mixed eager/lazy consumers. |
| 6.3 | Choose cold/intent/route preparation and closed/detached/discard retention from measured first-use, speculative-byte and repeat-use tradeoffs. |
| 6.4 | Qualify opt-in SSR/hydration and supported modes, including native/global ownership, essential forms and explicit range restrictions. |
| 6.5 | Run/freeze final comparisons, complete targeted date accessibility review, document rollback and seal the qualified policy. |

The eager shell must own trigger semantics, status, form association and validation even before optional internals exist. Keep `showPicker(): Promise<void>` and synchronous `hidePicker()`, specify canceled versus failed opens, coalesce current intent, invalidate stale requests, and re-read current values/constraints before opening and committing. Reuse the actual registry and creation scope; keep unused optional nodes absent so shared definition registration cannot activate every picker. Do not force initial hydration or dedicated activation APIs into an already-owned boundary that violates their preconditions.

Production comparisons distinguish eager/global/scoped and selected lazy policies, with at least 30 successful samples per promoted configuration and separate repeated retention runs. Report navigation-to-focus, actual preparation lead, immediate first use, repeat use, unused/settled bytes, live/inert/detached nodes and lifecycle costs. Use a new matched date campaign; preserve settings and SSR-command history as separate series. No universal two-frame delay, new server worker benchmark, or claim of free route preparation follows from prior phases.

Only after the date evidence gate, rank optional color tools, editor/media features and inactive panels/collections by measured unused cost and usage. Retain active edits, authored reading/search/print content and existing windowing contracts. Wrapper removal, calendar marker simplification, variable week counts and broader virtualization are separate experiments with their own compatibility decisions, not prerequisites for this pilot. No library-wide default rollout is assumed.

## Delivery order and review checkpoints

| Increment | Reviewable result | Advance only when |
| --- | --- | --- |
| 1 | Native/global adapter, explicit scope API, nested Lit examples | Construction and fallback are correct; current styles and hydration regressions pass |
| 2 | Complete construction/ownership audit, factory and composite fixes | API return types, slots, ownership, form and focus behavior are preserved |
| 3 | Generated lazy manifest and one optional feature family | Startup bundle isolation and reliable first use are demonstrated |
| 4 | Ordinary-element island activation, null-association policy, fallback recipe | Independent activation works and keyboard/form/AT behavior stays usable |
| 5 | Scoped SSR manifest, renderer and hydration adapter | Hydration order, node identity and progressive enhancement are verified |
| 6 | Opt-in single-date pilot; later component families ranked as separate follow-ups | Matched performance budgets and targeted accessibility acceptance pass |

Phases 1–2 established correctness; Phase 3 established lazy code/definition delivery; Phase 4 qualified activation/preparation; Phase 5 qualified opt-in SSR and the reported manual workflows. Their source and performance boundaries are sealed. Phase 6 sealed an opt-in single-date construction boundary and a separate optional chunk entry, with passing predeclared performance budgets and completed targeted date review. No numbered phase remains; broader component expansion requires a separate scoped plan. A reviewed plan is not implementation, a benchmark pass is not assistive-technology acceptance, and a smaller tree is not proof of a net performance win.
