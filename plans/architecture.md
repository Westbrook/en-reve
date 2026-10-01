# en-reve architecture and implementation plan

Status: the library remains partially delivered at 0.1.0. The single cancelable `en-change` migration is implemented and its full build and focused component/core/SSR checks pass; production documentation verification passed with 178 cases and two retained skips. Delivery identity is tracked in the verification receipt and independent Progress Report. The 72-pattern target and full workflow/support acceptance remain unfinished.

This document combines the 24 discovery answers with accepted review-session refinements. **Accepted** identifies user requirements, **implemented** identifies present code, **verified** is limited to the linked artifact and scenario, and **proposed** identifies work not yet adopted or delivered. The current status index is [review-session.md](./review-session.md); the independent progress report, located through [the project locator](../.progress-report/project.json), retains the exact decisions, feedback and evidence. The pattern inventory is [pattern-inventory.json](./pattern-inventory.json). Neither a source file nor a passing focused test establishes complete pattern acceptance.

## Accepted contract

- Lit, TypeScript, `signal-polyfill`, and `signal-utils`; author bare module specifiers and publish native, modular ESM. Build-optional consumers receive a tested import-map recipe. Maintainer generation is allowed and remains isolated.
- Encapsulated custom elements named `en-*`. Prefer Shadow DOM; internal markup is private. Composition, slots, properties, events, CSS custom properties, and named CSS Parts form the supported surface.
- Share code across patterns and expose useful public layers in this priority: styles, state, templates, interaction logic. Shared implementation does not automatically become public API.
- Start with broad pattern coverage and coherent APIs before production stabilization. A consumer's knowledge of one pattern should transfer to related patterns.
- Support application-controlled consumption and cancelable semantic defaults, SSR, and rolling current-minus-one browser/framework targets. Discovery did not mandate a public `controlled` flag. Initial operation requires JavaScript; application code owns loading fallbacks and most connectivity policy.
- WCAG 2.2 AA, live-browser behavior, screen-reader and platform-preference validation, the specified display/device/connectivity range, 19 requested language catalogs, and RTL are part of delivery.
- Code owns design tokens and official themes. Provide scoped and granular customization plus managed token editing, coordinated derivations, complete candidate previews, and reviewed adoption. Consuming teams review their own customizations.
- Four documentation audiences: application users, developers, designers, and agents. Initial package/docs access is private; MIT; Sites is accepted for initial private docs. No public deployment is implied.
- CEM informs component change classification and changelogs. Version comparisons use interactive old/new demonstrations with scoped registries; token/theme changes have all-component sheets, candidate docs, and Playwright visual evidence with review/caching.
- Before stabilization, `0.x.y`: increment `x` for major/breaking changes, which may include deprecations; use `y` for minor/patch changes. Stabilize at `1.0.0`, then use standard semver: deprecations in minor releases, removals in majors. No additional time-based deprecation window has been selected.

## Implemented checkpoint and remaining delivery

Five runtime packages now exist: tokens, styles, primitives, elements and SSR. The generated [CEM](../packages/elements/custom-elements.json) records 40 tagged element types; this includes child elements and does not mean 40 or 72 fully accepted patterns. `@en-reve/patterns` remains planned. The sign-in, creative-settings, chat and project-selection reference fixtures are implemented as documentation consumers on independent SSR Workflows pages; manual acceptance and broader environment coverage remain open. The inventory records source presence separately from its still-required acceptance scenarios.

The implemented foundation includes a typed token graph and generated themes, shared style/state/template/interaction modules, form-associated controls, compound number and editable-slider controls, selection/layout/overlay elements, public typography helpers, and a neutral color-sample button. The Lit documentation application consumes them, generates real Declarative Shadow DOM at build time, and is delivered on the configured private Sites review host. This is static documentation hosting, not a deployed request-time SSR service or a public package release.

Focused browser checks, parsed SSR/hydration journeys, metadata checks and review artifacts exist. Their exact source/build identities and limits belong to [the review-session index](./review-session.md), package/tooling receipts and the independent report. Older receipts retain their original artifact hashes; later focused checks do not imply a fresh complete-library run. Remaining acceptance includes the full pattern set, manual review of the four reference workflows, broader framework/packed-import-map consumers, translated-catalog review, physical devices/IME/screen readers, native OS-picker use, accepted visual baselines and performance budgets.

The user has adopted removal of `controlled` and replacement of the two-event state protocol with one synchronous cancelable `en-change`. This coordinated migration is implemented. Its full build, 40-tag CEM without the removed APIs and focused component/core/SSR checks pass; production documentation checks passed. See the [current checkpoint](./review-session.md#current-event-api-migration-checkpoint) and [verification receipt](../artifacts/event-api-migration/verification.json) for scope; publication is not claimed. The earlier `reviews/state-ownership.md` recommendation is historical and superseded by the contract below. The separate split-view registration and same-value-write findings were corrected at shared checkpoint `5bd6459efff35c2aa8ea8dca3cc7ef4316292d9d`, with scoped packed-consumer and structure evidence in the [review-session index](./review-session.md#earlier-shared-audit-findings). Those checks do not establish every component's dependency closure or supersession behavior.

## Package and workspace boundaries

The implemented five packages use intentional subpath exports; a sixth composition package remains recommended when supported composition APIs are ready. Their distinct dependency and consumer contracts justify the boundaries; the component count does not determine package count. Do not create one package per component or helper.

| Package | Owns | Runtime dependencies and public boundary |
| --- | --- | --- |
| `@en-reve/tokens` | Code-owned token/reference graph, named-theme data, resolved JSON/CSS, derivation/constraint/dependency metadata | No DOM or Lit runtime. Public data, CSS theme entry points, and a versioned token manifest. The generation pipeline is maintainer tooling. |
| `@en-reve/styles` | Reusable visual rules, per-family/per-component style exports, shared focus/layout/type treatment | Token contract and Lit CSS results; provide plain CSS outputs where they are independently useful. No element registration, component state, or DOM interaction. Importing one style must not load every style. |
| `@en-reve/primitives` | Reusable state models, rendering helpers, lifecycle-bound interaction controllers | Explicit `state/*`, `templates/*`, and `interactions/*` subpaths. State imports use Signals without DOM/Lit dependencies; Lit enters only the modules that need it. A public entry point must not import unrelated layers. |
| `@en-reve/elements` | Custom-element adapters joining styles, models, templates, semantics, and interaction controllers | Per-element class-only exports and separate registration entries. No application services, global reset, root stylesheet injection, or all-library registration on normal import. |
| `@en-reve/patterns` (planned; no package yet) | Useful compositions, layout/flow helpers, and exported recipes built on public elements/primitives | Per-pattern imports. Human-readable HTML/JS recipes remain usable without adopting Lit as the application's framework. Specialized engines are not hidden in this package. |
| `@en-reve/ssr` | Explicit server entry points, per-render state creation, Lit SSR adapters, hydration integration examples | Server-only dependency graph; never imported by browser element entries. Framework/server hosts are separate verified fixtures, not an assumed universal adapter. |

The documentation application, package-local fixtures, metadata generation, release-draft tools and evidence/cache primitives exist as private maintainer work. A complete token admin/submission application and integrated release/evidence workflow remain planned. Keep docs runtime, service credentials, browser automation, filesystem tools, and release tools out of shipped component graphs. The implemented Lit/Vite documentation application consumes the library itself and prerenders its sticker sheet for static Sites delivery. Neither Vite nor Sites becomes a component-consumer requirement. A host's default starter stack does not replace the accepted Lit stack.

An optional `@en-reve/react` adapter is added only if the supported React version fixtures demonstrate a material need for event/property typing or rendering integration. Vue and Svelte begin with native custom-element configuration and real examples. Do not multiply wrappers merely to mirror framework names. If an adapter exists, generate it from the same supported API records and test it as a consumer package.

Use small package-local build/type-check/test commands and a workspace-level dependency graph. A changed pure model can run focused tests and its affected element scenarios; its isolation never substitutes for release-level integration evidence. Bundled browser convenience output is optional and requires measured benefit; the primary artifact stays unbundled ESM.

## Source boundaries and planned additions

```text
packages/
  tokens/       # source graph, definitions, themes, public generated outputs
  styles/       # foundations, families, individual component styles
  primitives/   # state, templates, interactions; no catch-all runtime entry
  elements/
    src/<name>/ # element.ts, model.ts if private, template.ts, interactions.ts
    src/define/ # explicit global-registration convenience modules
  patterns/     # planned: composed patterns that earn a supported runtime API
  ssr/          # server adapter and hydration entry points
apps/
  docs/         # implemented sheet/preview; full guides/admin remain in scope
fixtures/       # planned packed-consumer/framework fixture organization
  html/ react/ vue/ svelte/ ssr/ accessibility/
tooling/
  metadata/ releases/ evidence/ # implemented maintainer modules
  sticker-sheet/ typography/ slider/ swatch/ highlighting/ # focused verification
plans/          # accepted contracts, implemented checkpoints and remaining work
```

Separate styles, data, templating, and interaction behavior within an understandable pattern boundary. Extraction into the public primitive/style packages requires demonstrated shared responsibility, not identical-looking lines. Avoid distant generic utilities that require callers to understand hidden child markup. Prefer composition over a deep element-inheritance hierarchy. A small platform base class and lifecycle helpers may own common wiring; keyboard/selection/dialog semantics belong to explicit capabilities rather than a universal base class.

## Shared state and rendering

1. Put application-facing values and their transitions in small models. Use `Signal.State` for source state and `Signal.Computed` for derived snapshots. Store authoritative information once; do not maintain parallel Lit reactive and Signal copies of the same value.
2. Keep pure state models usable without custom elements. Collection selection, disclosure, validation, and step progression are candidate models. They must not import `window`, global registries, CSS, or rendered markup.
3. Use a small local Lit `ReactiveController` to observe a computed render snapshot through `signal-utils/subtle/reaction`, schedule `requestUpdate()`, and retain the disposer. Upstream `signal-utils` does not provide the library's Lit adapter. Initial/server renders read synchronously; connect subscribes, disconnect disposes, and reconnect rereads state. Focused primitive tests cover subscription disposal/reconnect and independent views; the SSR adapter tests request isolation separately. Full platform/input-method coverage remains open.
4. Templates consume explicit inputs and render references. They do not subscribe to global state or independently install event handlers. Reusable template helpers expose slots/content callbacks with semantic contracts; exporting an existing component's private template wholesale is not the default extension mechanism.
5. Interaction controllers own listeners, pointer/keyboard coordination, focus bookkeeping, and cleanup. Their lifetime follows the host. Public controllers are opt-in capabilities, not hooks into arbitrary internal markup.
6. Application services feed values/actions through public APIs. SSO providers, chat services, asset storage, LLM calls, synchronization, and a general runtime schema renderer are outside this library's accepted scope.

## Public API conventions

The conventions below distinguish implemented public surfaces from remaining recommendations. They still need complete workflow and support-matrix acceptance before broad API stabilization.

### Properties, attributes, methods, and slots

- Prefer platform vocabulary: `value`, `checked`, `disabled`, `required`, `name`, `open`, `selected`, `orientation`, `size`, and `readonly` where each concept truly exists. Use the corresponding native semantics rather than making unrelated patterns share a property for superficial consistency.
- Properties carry rich objects/functions; attributes carry documented serializable configuration. Boolean attributes follow HTML presence semantics. Avoid reflected JSON collections, mutable objects in attributes, and reflected high-frequency derived state.
- Public state is observable through documented properties. Read-only derived values are explicitly marked. Application writes update rendering/accessibility without echoing synthetic user-change notifications.
- Methods express operations that properties cannot describe clearly, such as focus or native form integration. Do not invent methods for every property setter.
- Slots expose content roles, not layout internals: label, description, leading/trailing content, and other proven pattern-specific roles. Document ownership of labels, descriptions, errors, and required structure. Slotting arbitrary interactive descendants into a composite is supported only when the composite's interaction contract accounts for them.
- Every relevant public contract appears in CEM and prose. Supplement metadata for event cancellation/composition timing, focus, form participation, state authority and rollback timing, accessibility, token dependencies, and slot restrictions.
- Named label slots are implemented where documented. Preserve native slot-assignment semantics: whitespace-only assigned nodes can mask a legacy default-slot fallback, so multiline examples use explicit named labels. A label slot does not expose the private label element or authorize replacement of component internals.

### External relationships and compound presentation

**Accepted and implemented:** `en-popover` and `en-tooltip` use a literal `for` ID for an external native button or `en-button`; trigger slots are removed. `en-color-field` additionally supports `en-swatch` as its optional external trigger. The shared resolver searches only the owner's Document or ShadowRoot and handles insertion, replacement, ID changes and reconnection. It does not pierce shadow roots, and this `for` contract is not Reference Target. Cross-root naming and Reference Target/polyfill support remain separate verification work. Content/label slots remain valid composition surfaces.

`en-swatch` is a sample-only native button with a complete accessible action name and `token` or raw `color` paint input. It owns no clipboard, selectable reference text, copy status or picker state. Those belong to consuming compositions. The docs copy handler runs on the originating click after the synchronous cancelable `en-action` dispatch finishes, so ancestor request cancellation can prevent the effect. It owns pending work, replacement/stale-result guards and feedback. `en-color-field` retains its visible native input; an external trigger invokes its picker synchronously and does not imply observed picker opening or selection. The field does not mutate the trigger's preview; consumers synchronize accepted values and reset results.

Compound controls share one accepted value/form contract with multiple explicit native surfaces. `en-number-field` owns increment/decrement controls and a numeric editor; its compound composition suppresses the redundant native spinner, with focus styling appropriate to each surface. `en-slider[editable]` adds an exact-value native editor with an independent draft, two native Tab stops, completion/validation/cancellation and one submitted value. `en-segmented-control` is an exclusive native-radio choice with one Tab entry, not an unspecified switch/tab semantic mode. Its nearest-option pointer behavior and shared select/frame radius are documented and tested in focused fixtures. These implemented behaviors do not complete their full locale/device/assistive-technology acceptance.


### Cancelable state changes and application authority

**Implemented contract:** the public `controlled` property/attribute and `en-request-change` are removed. A documented user state transition emits one synchronous, cancelable, bubbling/composed **`en-change`** with readonly `{ previous, proposed, reason }` detail. Before dispatch, stage the proposed public property, Signals model and FormData coherently. The event exposes tentative state, not a post-commit notification or evidence that an application operation succeeded. There is no second committed event or asynchronous settlement API. `en-input` remains a noncancelable native-draft observation; `en-action` retains its separate documented command contract.

Synchronous `preventDefault()` rolls back only the transaction's still-owned staged state. Every explicit application property write, including a same-value assignment, is authoritative and silent; an accepted nested transaction also supersedes an outer default or rollback. Merely starting or canceling an inner transaction does not. For example, if A stages B and B stages C, canceling the inner change restores B; canceling the still-owned outer change then restores A. An accepted C or an application write survives outer cancellation. Equal semantic values emit no event, while a direct equal-value setter still performs its documented draft reconciliation. Do not infer ownership from listeners or property assignment.

The shared [`dispatchChange` contract](../packages/primitives/README.md#signals-and-actions) separates reversible staging/rollback from finalization. Revalidate mutable constraints after listeners; an invalid default may cancel the same event before rollback. Defer destructive draft cleanup, group finalization, focus movement and native overlay effects until acceptance is settled. Ordinary overlay user actions therefore cancel before close/hide/focus effects. An unexpected native close/hide that has already completed reconciles silently because its browser effects cannot be undone. A listener's captured FormData, Signal read, network request or other external side effect cannot be retracted by component rollback; neither observing tentative state nor seeing an uncanceled event early in propagation proves final acceptance.

Native editing is a distinct interaction family. Preserve native `beforeinput`, `input`, composition, selection, undo and the documented draft. Canceling a semantic state change does not undo the browser's keystroke or erase an editable draft. An explicit authoritative write or an accepted pattern-specific reconciliation point can reconcile that draft. Native reset restores the documented reset baseline by default; an application vetoes reset through the native outer form's cancelable `reset` event. Form state restoration is authoritative and silent. Reset, restoration and automatic initialization defaults such as tabs' first-enabled fallback do not emit `en-change`, and disabled/read-only user-action guards must not block those lifecycle operations. Existing native-edit adoption during hydration retains its documented field policy; this migration does not redefine it.

Applications that defer a decision cancel synchronously before awaiting, guard stale completions after newer edits/reset/disposal, then write accepted properties and actual pending/result feedback. `preventDefault()` after an `await` is too late. Install interception handlers before registration/hydration where early field adoption can dispatch a documented change. This small ownership example requires no mode attribute; the explicit application write wins even when it equals the currently staged proposal:

```js
const field = document.querySelector('en-text-field');
const state = { value: '' };
field.addEventListener('en-change', (event) => {
  event.preventDefault();
  state.value = event.detail.proposed;
  field.value = state.value;
});
await import('@en-reve/elements/define/text-field.js');
```

A silent application write means no invented user-change event, not a ban on useful feedback. Focus and pointer bookkeeping are not generally application-owned values. Earlier native-editing, hydration and structure receipts retain their pre-migration scope. The [current migration checkpoint](./review-session.md#current-event-api-migration-checkpoint) records new adapter/core/SSR checks; production documentation verification passed with 178 cases and two retained skips. Physical IME, dictation, autofill/password managers and the supported platform/AT matrix remain separate acceptance work.

### Public style contract

- Shared semantic properties describe design decisions; component properties express justified local overrides. Use `--en-*` names, with namespaced component overrides such as `--en-button-*` where appropriate. Exact naming follows the token plan rather than duplicate hand-maintained lists.
- Each tunable design decision is token-backed. Computed intermediate values can remain private when their governing tokens are public and independently overridable; avoid turning every mechanical declaration or intermediate into a separate customization promise.
- Publish semantic CSS Parts (`control`, `label`, `description`, etc.) only when stable responsibility can be stated. A Part name is a style target, not a guarantee of tag name, ancestry, nested selectors, or accessibility role ownership.
- Theme values can originate at the page, arbitrary child roots, a focused region, or one component. Component defaults must not defeat inherited public overrides by assigning unconditional public defaults on `:host`.
- Full theme/rebase roots redeclare inputs and contextual aliases, and intentionally restart the derived graph. Partial regional edits apply only their explicit properties and preserve other inherited values. Directly changing one inherited primitive does not magically recompute already-resolved aliases; document the rebase path and deliberate pins. Reset optional component overrides at full theme boundaries unless explicitly pinned. Document detached-overlay inheritance. Theme data and resolved token dependencies power the admin/editor and impact review; [tokens.md](./tokens.md) defines the detailed candidate rules.
- Public `typography.js` / `.css` helpers now style consumer-owned semantic HTML: `en-body`, the three `en-heading-*` scales, `en-metadata`, `en-data`, and scoped `en-prose`. They supply complete role metrics and intentional local margin resets; no global reset or text custom element is required. Heading level stays independent of visual size. Other component shadow classes remain private implementation bindings.
- Every current element has medium sizing without requiring an attribute; `size="inherit"` explicitly opts into a containing scope. Small/medium/large are absolute role choices, not compounded nesting factors. Three densities and layout rhythm coordinate control geometry while preserving content growth and target floors. Shared UI/input/strong-label font defaults now align related controls; explicit role/output overrides remain possible. The token plan records exact recipes and measured limits.
- Brand and interactive action roles are separate: a shared `palette.accent` seed feeds `color.brand` and the compatible `palette.action` → `color.action` branch; each role can be pinned independently. `on-brand` is derived only against brand fill, while `on-action` considers action states. The docs wordmark name uses the same brand color as its tile background by user request. Its contrast against the header is a rendered-use check, not a reason to silently change that color. Raw CSS color edits do not rerun resolved foreground/mix recipes; use `resolveTheme()` and regenerated full CSS for coordinated changes.
- Grouped/conditional styling, container queries, CSS functions, and mixins are authoring capabilities to investigate. Every required visual behavior has a tested delivery path for the support floor; experimental syntax is not an invisible consumer prerequisite. Do not silently replace the user's requested native CSS direction with Sass.

## Registration and version coexistence

Two entry forms and registration helpers exist; the complete dependency-metadata contract remains a recommendation to finish:

1. `@en-reve/elements/button.js`: currently exports the class without global registration. Per-class public definition/dependency metadata is not yet emitted. This is usable for subclassing experiments, adapters, SSR preparation, and version-isolated review without side effects.
2. `@en-reve/elements/define/button.js`: convenience entry that explicitly registers in the global registry. Required-descendant closure is the intended contract but is not uniformly wired yet: `define/split-view.js` currently omits its nested `en-splitter`. Its module is listed as side-effectful; repeated import of the same URL is harmless. A name occupied by a different constructor is an explicit conflict, never silently reused.
3. Implemented registration helpers accept a target registry and support dependency sets/preflight. It preflights the definition graph, is idempotent for the same constructor, and rejects conflicting definitions. Avoid a universal `define-all` on the default path; a deliberately imported catalog/demo utility may register the whole inventory.

Class-only entry points must not transitively execute registration. Completing and testing per-entry dependency sets for every nested custom element remains necessary; the full catalog masks missing selective-import dependencies. Child templates must create elements with the intended registry; setting an outer scoped root alone does not prove the renderer is correct.

For change review, load old/new package graphs under distinct URLs/scopes with independent registries, component styles, values, and fixtures. Both panes use the same user scenario and representative content. Selectors, form associations, references, and overlays must not cross panes accidentally. Keep dependency identity consistent within each graph.

Native scoped registry, Lit renderer integration, the current scoped-registry helper, and SSR support are separate compatibility questions. Native probes have exercised scoped definitions with a shared Lit graph in Chromium and WebKit; the tested Firefox capability was absent. A real old/new package-graph review adapter remains a bounded verification track. Until verified, do not claim the current helper's polyfill-era API proves native support, or that Lit SSR automatically recognizes scoped definitions. Normal single-version SSR and the client-side old/new reviewer may use different entry paths. Any necessary fallback for supported browsers is shown explicitly in the review UI/evidence, not represented as native parity.

The user required version coexistence in review. General unrestricted simultaneous production versions have not been promised.

## ESM, SSR, and framework delivery

- Compile TypeScript to modern ESM preserving per-module imports and `.js` relative/subpath extensions. Use package `exports` to declare supported import paths and associate `.d.ts` outputs. Reject runtime dependence on TypeScript path aliases that the browser cannot resolve.
- Supply a pinned, tested import map for the full reachable module graph, plus self-hosting instructions. Browser native resolution is distinct from package resolver conditions; no claim that the browser reads package `exports` by itself.
- Test fresh consumers against packed artifacts, not workspace source aliases. Cover selective imports, complete transitive resolution, intended singleton dependency URLs, TypeScript declarations, properties/events, SSR, hydration, and supported framework examples.
- Keep dependencies deduplicable. Importing a button must not register/load the full catalog, documentation, locales, or unrelated overlays. Catalogs load on demand; no forced global locale mutation.
- Server renders create isolated models/request context. Do not leak mutable signals or locale/theme state between users. DOM-dependent listeners and measuring start only on the client. Server markup and client hydration consume the same stable input snapshot.
- Each supported SSR host gets an explicit fixture and documented integration. Current-minus-one is tracked in a dated verification matrix with actual versions and environments; it is not a claim of universal compatibility.

**Implemented SSR boundary:** the package renders registered Lit elements with DSD using a fresh render context and request snapshot. The server registration set is fixed per process; incompatible versions need isolated workers/processes. Docs use build-time SSR, hydrate their light-DOM shell once, and hydrate contained DSD without replacing the tested native inputs/triggers. Stable initial attributes and explicit child checked/selected/open state are required where SSR cannot inspect slots. Native textarea text uses a parser-backed adapter that preserves template markers. FACE behavior starts at upgrade; visible server-rendered controls do not establish no-JavaScript custom-element form submission. No streaming or scoped-registry SSR support is claimed.

The recorded package SSR receipt is an earlier artifact-specific checkpoint. Later external-trigger and neutral-swatch hydration checks are recorded in the independent report's `evidence/overlay-for` and `evidence/swatch-sample` records. Neither those focused checks nor current before-application-script typography checks establish complete-library hydration, framework SSR parity, all pre-upgrade choice editing, or retail current-minus-one coverage.


## Pattern scope and sharing

The retained planning target is **72 named patterns**: the 60 Component Gallery categories retrieved during discovery plus 12 additions tied to the accepted creativity/productivity/collaboration workflows. Source implementations and partial recipes now exist for some entries; the full inventory remains unfinished coverage, not 72 shipped patterns.

The inventory distinguishes:

- **Element:** independently meaningful state, behavior, semantics, or repeatable encapsulated presentation.
- **Native recipe:** semantic HTML plus supported styles/composition where a wrapper would add cost or harm platform semantics.
- **Composition:** a reusable arrangement/workflow with explicit roles and boundaries; it is not automatically a new monolithic element.

Every entry identifies its semantic owner, shared families, concrete baseline behaviors and browser acceptance scenario. Reviewed entries additionally carry current implementation notes; unannotated entries remain scope records without an acceptance claim. The CEM identifies current element declarations. Source presence and focused evidence remain separate from completion of pattern acceptance. Child elements, alternate appearances, sizes, rendering optimizations, and registration files do not inflate the pattern count. Virtualization is a measured, opt-in collection capability; it is not counted as a separate pattern. The added asset browser has an actual find/select/inspect task.

Promote a helper/composition to a public element or primitive when there is a distinct task/responsibility, clear focus/state/semantics ownership, evidence of reuse, a supported value/event/slot/style contract, and demonstrated improvement over a native recipe. Reuse in multiple real compositions is useful evidence rather than a mechanical quota. Preserve native semantics when they remain the best answer.

Candidate sharing families include control/press, editable/form, collection/selection, disclosure/overlay, navigation/composite-focus, layout/surface, media/asset, status/announcement, and collaborative composition. Shared focus models do not imply identical keyboard behavior: menus, tabs, listboxes, trees, calendars, and tables retain their own semantics.

### Reference acceptance workflows

1. **SSO-centric multi-step form:** enter and revise values, recover from a validation problem, move between steps, trigger an externally handled sign-in action, encounter pending/rejected outcomes, and finish. Use deterministic service fixtures; no authentication backend is implied. Verify keyboard/AT navigation, focus, error association, meaningful status, application-owned state, and restoration where the fixture defines it.
2. **Design settings panel:** find an ordinary setting, make a fine adjustment, inspect its effects, reach an optional detailed setting, restore a known value, and accept an externally supplied update. Verify pointer/keyboard/touch paths, editable number/slider parity, density, localized content, nested themes, and platform preferences. Do not impose a mandatory novice/expert mode.
3. **Chat-triggered interaction:** read an evolving conversation, retain an in-progress draft, encounter a new contextual control, operate or dismiss it, and return to the ongoing task. Verify insertion announcements, focus stability, cancellation, pending/result feedback, and discoverability without requiring runtime component generation or a chat backend.

4. **Project selection:** search a finite project catalog, distinguish typed query from accepted ID, select and submit, recover from invalid/unavailable values and reset. Exercise document and Campaign brief scrolling followed by text deletion in phone/tablet profiles; physical software-keyboard confirmation remains separate. The fixture owns no backend.

Catalog-only scenarios provide real operations for patterns not naturally exercised by these four flows. A static sticker-sheet cell is visual evidence, not proof of behavior. Rich text, calendar, tree, color, media, and complex collection patterns need explicit baseline capability boundaries and their own meaningful operations.

## Release unit, CEM, and evidence data

Recommend a **coordinated package version train initially**. Broad shared conventions are still evolving, so releasing each component as its own npm unit creates dependency/version work without a demonstrated consumer benefit. The five implemented runtime packages, plus a future composition package, can use matching train versions while their boundaries remain independently testable. Private apps/tooling can version separately.

Track each component's change classification, CEM differences, direct/inherited affected status, `introducedIn`, `lastChangedIn`, and `releasedIn` within that train. Component changelogs are filterable views of real release records, not duplicated prose. The installable package version is authoritative. Independent per-component version counters/installable versions are not assumed; consider them only if consumer release needs justify the extra contract.

Apply the maximum required bump across affected public contracts to the train: before 1.0, major/breaking => `x` and minor/patch => `y`, with deprecations allowed in `x` releases; after 1.0, normal major/minor/patch rules. A shared primitive/token/interaction change can affect components without their source file changing. Deprecation notices contain replacement guidance and the planned removal release when known. Do not add an unrequested time-based grace period.

The actual CEM analyzer and receipt, structured CEM diff/release-draft commands, and evidence identity/selection/cache modules now exist. Their tests cover the stated metadata and structured-input behavior. They do not automatically generate a complete source-to-consumer graph, execute browser scenarios, publish versions, adopt baselines, authenticate reviewers or supply interactive old/new demos. The coordinated version train remains a recommendation; matching current 0.1.0 package versions do not by themselves settle every future release-policy choice.

Generate and retain these linked records:

- **CEM:** public modules, classes, declarations, attributes, properties, methods, events, slots, CSS Parts/custom properties, and typed exports. Its `schemaVersion` is the manifest schema version, never the component version.
- **Pattern manifest:** inventory, semantics owner, composition requirements, related patterns, shared capabilities, supported entry points, locales/themes, and examples.
- **Release record:** package/train identity, base/candidate artifacts, affected components/tokens, proposed change level and rationale, deprecations, migration notes, and evidence links. CEM diff is evidence, not a complete semantic-version oracle.
- **Example/scenario record:** stable scenario ID, fixture data, initial state, user operations, expected state/observable result, theme/locale, environment, and source links. Use it to connect guides, demos, browser tests, and comparisons without writing tests that merely echo implementation.
- **Token manifest:** source references/derivations, resolved values, supported override surfaces, constraints, change closure, and reviewed candidate identities.
- **Evidence/review record:** exact candidate plus base versions, environment, expected/actual/diff artifacts, executed behavior/AT checks, cache inputs, reviewer disposition, and unresolved feedback. A passing comparison is not equivalent to approval or adoption.

Generate the initial agent-facing whole CEM plus complementary machine-readable manifests and guides from these sources. This satisfies the chosen programmatic-access direction without automatically building both MCP and CLI products. Add retrieval tooling only when a concrete agent workflow demonstrates missing access. CEM generation tooling is not the same thing as a consumer CLI.

## Next sequence before stabilization

1. Review the implemented single cancelable `en-change` migration in the private API reference and workflows, retaining the completed helper/component/SSR checks for tentative state, rollback, nested authority, native editing and lifecycle behavior. Retain the earlier selective split-view registration and same-value-supersession regressions; their receipts do not verify the new event timing. Package versions remain unchanged for this migration.

## Open choices and bounded verification

Product/operational choices still include the approving maintainer, administrative submission/persistence/access workflow, private package-delivery mechanism, and eventual public distribution. The initial private Sites documentation is already configured and delivered; do not present that as an unresolved first-hosting decision or as authorization for a new public audience. Local candidate artifacts are prepared review inputs, not approved/adopted themes.

Engineering work remains for full native editing/physical IME and framework support, separate scoped package graphs/SSR, cross-root labels and Reference Target, complete release dependency graphs/cache integration, native CSS function/mixin delivery, and complex creative-pattern boundaries. Current same-root external `for` references, native overlay controls and selected hydration paths are implemented rather than hypothetical experiments. See the specialist plans for their remaining capability-specific limits.

Retain the two open platform findings with their original evidence: WebKit 26.6 fixed-font shadow hosts can miss a dynamic root-rem invalidation, and Firefox 155 desktop touch emulation omitted a compatibility click for a slotted native button. Native comparisons reproduce those observations; neither establishes a general browser-zoom or physical-device failure. Retest the relevant real environments instead of adding global observers, changing user typography or hiding an unsupported result. No accepted screenshot-baseline, physical screen-reader/OS-picker or full support-matrix claim follows from the focused passes.

## Specialist review and source basis

Brad's architecture is informed by Atomic Design's concurrent part/whole feedback rather than a mandatory bottom-up taxonomy. Dieter challenged count inflation and public primitive promotion; virtualization was moved out of the count and asset browsing added as a user task. Golden and Léonie rejected forcing every edit through generic cancellation and reinforced complete workflow semantics. Jina aligned token/style ownership and contextual alias handling. Tammy requires selective packed-artifact imports and complete invalidation evidence. Westbrook owns platform/SSR/Signals verification and the native registry integration details.

- [Component Gallery inventory](https://component.gallery/components/) — source of the 60 base categories.
- [Atomic Design methodology](https://atomicdesign.bradfrost.com/chapter-2/) — patterns and realistic composed pages inform each other.
- [Atlassian composition](https://atlassian.design/get-started/develop/composition) — consistent compositional APIs and explicit styling relationships; its exact file-organization policy is not adopted.
- [Lit publishing](https://lit.dev/docs/tools/publishing/) and [reactive properties](https://lit.dev/docs/components/properties/) — ESM/typing and lifecycle/property integration references. Native registry and current platform behavior are separately verified rather than inferred from older guidance.
- [TypeScript module resolution](https://www.typescriptlang.org/docs/handbook/modules/reference.html) — declaration and subpath export contracts.
- [Custom Elements Manifest schema repository](https://github.com/webcomponents/custom-elements-manifest) — machine-described public APIs and change evidence.

Consult the adjacent specialist plans and [review-session.md](./review-session.md) for current boundaries and follow-ups. Implementation, test execution, visual inspection, private publication and user acceptance are distinct states; claims are limited to their recorded artifacts. This document sync itself runs no runtime tests or publication.
