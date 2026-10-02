# @en-reve/primitives

Private `0.1.0` shared primitives for En Rêve, licensed MIT. Import the layer you need; there is no root barrel and no automatic custom-element registration. State modules depend on `signal-polyfill`; templates depend on Lit; the signal controller uses `signal-utils/subtle/reaction`. Controller imports use Lit types without importing its rendering runtime.

## State

| Import | Factory and contract |
| --- | --- |
| `@en-reve/primitives/state/value.js` | `createValueModel<T>(initial, { equals?, normalize? })`: `value.get()`, `view.get()` → `{ value, revision }`, `set(value)`, `reset()` |
| `@en-reve/primitives/state/disclosure.js` | `createDisclosureModel(initialOpen = false)`: `open.get()`, `view.get()` → `{ open, revision }`, `setOpen(open)`, `toggle()`, `reset()` |
| `@en-reve/primitives/state/selection.js` | `createSelectionModel<Key>(initialKeys = [], { multiple = false })`: `selected.get()`, `view.get()` → `{ selected, revision }`, `setSelected(keys)`, `toggle(key)`, `selectOnly(key)`, `clear()`, `has(key)`, `reset()` |
| `@en-reve/primitives/state/draft.js` | `createDraftModel(initial = '')`: accepted `value`, native `draft`, `isComposing`, `hasDeferredValue` and `view` signals; `setValue`, `setDraft`, `startComposition`, `endComposition`, `acceptDraft`, `reset` |

Reads and transitions are synchronous. No subscription, DOM or component connection is needed to obtain a complete view, including during SSR. Transition methods return whether state changed. Model snapshots are shallow readonly; consumer-owned object values are neither cloned nor frozen. Replace object values when changing them unless your explicit equality/normalization contract says otherwise. Selection copies and freezes its key arrays, deduplicates keys and rejects multiple keys in single-selection mode. Available items, disabled-item behavior and required-selection rules belong to the consuming pattern.

`revision` counts state changes, not every property assignment. An element that lets a same-value author assignment supersede a pending action must maintain its own author-write revision. Public element setters never acquire events implicitly from these models.

Draft `view` contains `{ value, draft, isComposing, dirty, revision }`. `setDraft` does not accept input. `acceptDraft` refuses to commit during composition. `setValue` is an authoritative write: even assigning the existing accepted value reconciles a differing draft, allowing explicit rejection. During composition it updates accepted state while deferring draft reconciliation until composition ends. The latest author value takes precedence then. `reset` uses the initial value and follows the same composition rule. This package makes no application-persistence decision.

## Signals and actions

`new SignalController(host, readSnapshot)` from `interactions/signal-controller.js` registers with a Lit host. It subscribes on connection, requests coalesced Lit updates, stops on disconnection, and re-reads current state on reconnection. The `snapshot` getter also works without a connection. `dispose()` permanently removes the controller. Removing one observer does not dispose a shared model.

`dispatchChange(target, change)` from `interactions/events.js` implements the adopted single-event migration. The [migration checkpoint](../../plans/review-session.md#current-event-api-migration-checkpoint) records passing core and primitives browser checks; production documentation verification passed with 178 cases and two retained skips. The historical receipt below predates this contract. It accepts `ChangeTransaction<T, Reason>`:

```ts
{
  previous: T,
  proposed: T,
  reason: Reason,
  getRevision: () => number,
  stage: (proposed: T) => void,
  rollback: (previous: T) => void,
  canCommit?: (proposed: T) => boolean,
  commit?: (proposed: T) => void
}
```

Normalize proposals before calling. `Object.is(previous, proposed)` returns `unchanged` without staging, dispatch or finalization; collection adapters own their semantic equality. `stage` synchronously exposes coherent tentative public property, Signals and FormData. The helper then emits one synchronous, cancelable, bubbling/composed `en-change` with readonly `{ previous, proposed, reason }` detail. The outer detail record is frozen; consumer values are not cloned or deeply frozen. `ChangeEvent<T, Reason>` retains those specific types. This event is not a post-commit notification.

Synchronous cancellation calls `rollback` only while this transaction still owns its staging. `getRevision` is a pure author-authority counter that advances on **every explicit author write, including equality**. Such writes and accepted nested transactions supersede outer default/rollback; merely starting or canceling an inner transaction does not. Stage/rollback do not advance author authority or call an author setter. Capture additional reversible flags/form/model state in the adapter so rollback restores it together. Silent author writes may explicitly reconcile a draft even when the semantic value is equal.

Optional `canCommit` performs a pure post-listener constraint check; returning false cancels the same event before owned rollback. Optional `commit` runs once after acceptance to finalize deferred draft, group, focus or native-overlay effects. Keep staging and rollback bounded, reversible and synchronous, including when a consumer forces rendering during dispatch. Do not put irreversible effects in them. Outcomes are `committed`, `unchanged`, `canceled` or `superseded`; `committed` means the component transaction settled, not that remote work succeeded. A finalization callback that installs newer authority is not rolled back. Exceptions before acceptance roll back still-owned staging and propagate; a finalization exception leaves accepted state because effects may already have begun.

The old `requestChange`, `ChangeRequest`, `RequestChangeEvent`, `controlled` option and `en-request-change` channel are removed. There is no replacement mode, post-commit event or asynchronous settlement API. A consumer cancels synchronously before awaiting external work, guards stale completions and later writes accepted properties silently. Rollback cannot retract a listener's captured FormData, Signal read, request or other external side effect, and an early listener cannot infer final acceptance. The [architecture guide](../../plans/architecture.md#cancelable-state-changes-and-application-authority) includes a concrete consumption example and lifecycle boundaries.

`dispatchAction(target, { action, data }, { cancelable = false })` emits `en-action` and returns the dispatch result, not an application result. Set cancelable only when the component has a documented default that cancellation can veto. `dispatchDraftInput(target, { value, isComposing, inputType })` emits noncancelable `en-input` without mutating accepted state. These helpers create events in the target document's realm when available.

## Native editing

`EditingController` from `interactions/editing-controller.js` takes a host and `{ model, control, onInput?, onCommit?, adoptInitialValue?, dispatchInput? }`. `control()` returns its native input/textarea or null. Do not independently bind the live `.value` property in a Lit template. The controller writes only when the draft differs and composition is inactive, preserving selection during unrelated updates.

After an author property write call `model.setValue(value)`, `editing.sync()` and the host's property update machinery. The controller emits `en-input` by default; `dispatchInput: false` suppresses only that public notification for a private generated editor whose host has no draft-input event. Callbacks and revision guards remain active. It calls `onInput(detail)`, and calls `onCommit(value, reason)` for relevant noncomposing acceptance points. Reasons are `input`, `compositionend`, `change` and `hydrate`. Route documented semantic acceptance through the pattern’s `dispatchChange` adapter. This low-level callback does not itself dispatch a public change or define lifecycle policy. Owned cancellation restores tentative semantic state without discarding the native draft; an authoritative property write explicitly reconciles it. A superseding author write must not be undone by restoring stale previous state. Existing native-edit adoption during hydration is unchanged by the event migration.

The default first-attachment check adopts a native value that differs from both its native `defaultValue` and the model draft, supporting pre-upgrade edits. It notifies with reason `hydrate`; the consumer still owns acceptance. Supply `adoptInitialValue(control)` if your SSR markup needs a more explicit rule. The server must actually render the initial native default. Textarea SSR serialization requires its own verified integration; the controller does not produce server markup.

Native `beforeinput`, input, composition and change events remain untouched. Composition-ending and following final input do not automatically create duplicate semantic requests for the same completion. Detaching or replacing the editing surface ends an orphaned composition in the model without accepting or dispatching a user action; it retains the native draft or reconciles a deferred author write. Reconnection can therefore resume normal editing even if no native `compositionend` arrived.

The adapter does not implement rich-text editing, speech recognition, password-manager integration or remote conflict resolution. Synthetic composition tests verify guard sequencing; physical IME, dictation, autofill and browser/AT workflows remain separate evidence.

## Forms

`FormController` from `interactions/form-controller.js` takes:

```ts
{
  internals,                        // host calls attachInternals in its constructor
  control?: () => inputOrTextareaOrSelectOrNull,
  value: () => stringOrFileOrFormDataOrNull,
  state?: () => restorationState,
  disabled?: () => boolean,
  onReset: () => void,
  onRestore?: (state, mode) => void,
  validate?: () => ({ flags, message?, anchor? })
}
```

The host declares `static formAssociated = true` and forwards `formDisabledCallback` to `formDisabled`, `formResetCallback` to `formReset`, and `formStateRestoreCallback` to `formStateRestore`. `sync()` updates submitted value, effective disabled state and validity. Call it during reversible staging and rollback and after authoritative writes, so FormData and validity are coherent before `en-change` listeners run and after settlement; it also runs after host updates.

Disabled fields contribute null. Custom validation takes precedence over native validity; invalid custom flags require a localized message. If a live draft differs from the submitted accepted value, the pattern must explicitly choose validation for that accepted value rather than accidentally validating a different draft. Native reset restores the documented baseline by default. An application vetoes the whole form reset with `preventDefault()` on the outer form’s native `reset` event; the controller does not invent a per-control cancelable lifecycle callback. Restoration is authoritative and silent. Reset/restoration and automatic initialization defaults do not emit `en-change` and must not be blocked by disabled/read-only user-action guards.

Missing SSR form-shim methods are not invoked. That makes pure server rendering possible, not a claim that forms submit before upgrade. The controller does not create labels, choose an accessible semantic owner, forward ARIA references or make an internal button a native outer-form submitter. Native composition and cross-root semantics are separate component contracts.

## Focus, registration and templates

`RovingFocusController` from `interactions/roving-focus.js` takes `{ items, orientation?, direction?, wrap?, isDisabled?, onFocus? }`. Supply visible items. By default it skips disabled/aria-disabled/hidden/inert items, uses horizontal movement, inherits computed direction and wraps. `orientation` can be `vertical` or `both`; Home/End navigate the set. `isDisabled` can override eligibility for patterns where disabled items should remain focusable. Nested native editors retain their arrow keys. The controller manages tabindex and focus, not selection. `refresh()`, `current`, and `setCurrent(item, { focus? })` support explicit changes. Removed items and disconnected controllers restore the tabindex values present when management began.

`interactions/registration.js` exports `collectDefinitions`, `registerDefinitions(registry, definitions)` and `registerDefinition(registry, definition)`. Each descriptor is `{ tagName, elementClass, dependencies? }`. Registration resolves the full graph, preflights constructor identity conflicts and registers dependencies first. Identical registrations are idempotent; different constructors under one tag throw. All registration is explicit, with no global registry read at module import. Native validation errors or side effects from element constructors cannot be rolled back; descriptors must use valid autonomous custom-element names. These helpers do not provide a scoped Lit renderer.

The same entry exports `createDefinitionPreparation(loaders)`,
`createDefinitionLoader(registry, loaders)` and `DefinitionLoadError`, with the
`DefinitionLoaders`, `DefinitionPreparation`, `DefinitionLoader`,
`DefinitionLoadOptions` and `DefinitionLoadStage` types. Preparation `load(tags)`
fetches and evaluates the explicit definition loaders without registering or
constructing elements. A registry-targeted loader exposes the same `load()` and
adds `ensure(tags)`, which waits for all imports, preflights conflicts and registers
dependency-first in the supplied registry. Neither operation establishes rendering,
hydration, focus or interaction readiness. No global registry is read at import.

Reuse the manifest object to share its import cache across preparation and loader
instances; registry requests are separately weakly keyed by registry and manifest.
A load failure remains cached until an explicit `{retry: true}` request; native
registration failures remain permanent for that request. `DefinitionLoadError`
distinguishes `lookup`, `load` and `registration` failures. Browser module caching
can still prevent a new fetch. `@en-reve/elements/lazy-loader.js` re-exports these
same factories, types and error constructor, so crossing the two entries preserves
cache and constructor identity. Definitions and manifests remain caller-supplied;
the primitives entry imports no component catalog or browser environment setup.

`templates/field.js` exports `fieldTemplate({ label?, control, description?, error?, invalid? })`; the caller supplies actual associated labels/controls or slots. `templates/disclosure.js` exports `disclosureTemplate({ open, panelId, trigger, content })`; the caller owns the trigger's semantics and references. Both are pure Lit templates with no subscriptions, registration or hidden state. The disclosure keeps its panel DOM and uses native `hidden` without claiming modal behavior.

`templates/description.js` exports `descriptionTemplate(fallback: string)` for one description per shadow root. It renders the stable `description` ID and named `description` slot; callers reference that ID from their native control/group and keep the helper outside activation labels. The shared form styles give the empty attribute/no-slot case zero height in initial SSR markup, without client presence tracking. Assigned content takes native precedence, including an empty assigned element; removal restores the attribute fallback. Use one phrasing container for inline formatting and links. Multiple assigned roots form separate help blocks. The description text remains native DOM, so text updates do not require reassigning the slot or replacing the focused control.

## Native layout and content

`templates/content.js` exports `contentCollectionTemplate`, `fileCardTemplate`,
`metadataListTemplate`, and `emptyStateTemplate`. They are pure Lit helpers for
native lists, file/content surfaces, definition lists and contextual empty states.
`contentCollectionTemplate` keys original list items by stable identity; its grid/list
setting changes CSS presentation without introducing ARIA grid or listbox behavior.
No custom element registration, router, fetch, file transfer or selection model is
hidden in these helpers. Existing `createValueModel`/`createSelectionModel` remain
available to consuming applications; no separate asset state engine is introduced.

Import `contentStyles` from `@en-reve/styles/content.js` in a Lit style array or link
`@en-reve/styles/content.css` from native HTML. The same recipes support ordinary
semantic children and `en-card` content. No new custom-element tag or synthetic
metadata is needed to discover these APIs. See the complete [content recipe guide](docs/content.md)
for options, native HTML, import paths, selection ownership and CSS hooks.

## Native navigation

`en-navigation` and `en-breadcrumbs` accept authored native children rather than `.items` arrays. Page/section navigation takes default-slotted native `<a>` children; breadcrumbs take direct native `<a>` and noninteractive `<span>` children. Consumers own rich inline content, URLs, `aria-current`, other native attributes and listeners. `en-navigation` exposes `label`, `sticky`, inherited `size` and the `base` Part; its links remain application-owned light DOM. Breadcrumbs keep private ordered-list/separator structure with `base`, `list`, `item` and `separator` Parts. Applications style their own native links. The [navigation guide](docs/navigation.md) explains both APIs and the unchanged lower-level `sectionNavigationTemplate` and `breadcrumbTemplate` data recipes. Skip links remain native document recipes.

`slottedNavigationTemplate({ label })` from `templates/slotted-navigation.js` supplies the element's private landmark and ordinary default slot. Navigation uses native named slot assignment on the client and through the existing Lit SSR renderer. It needs no child mapping, projection adapter or generated slot metadata. Hydrate the same authored anchors and host properties. Element-level `.items`, `NavigationItem` and `NavigationCurrent` APIs are removed; item types remain available for the separate pure template recipes.

Breadcrumb projection and its canonical list template are separate reusable modules, `interactions/breadcrumbs-projection.js` and `templates/breadcrumbs.js`. New client roots use manual assignment. With explicit element registration, `@en-reve/ssr`'s buffered `renderToString` automatically prepares named slots for Declarative Shadow DOM; hydration retains that mode and the original native children. Authors supply no `slot` attributes or private projection metadata. Ordinary `hidden` is supported; `hidden="until-found"` is not. This is the library renderer's integration, not automatic support for every framework SSR path.

Templates, opt-in token styles and optional scoped anchor alignment remain separate imports. The anchor adapter measures the navigation host and recognizes open-shadow anchor events while resolving only contained light-document IDs. Browser navigation, application routing and current-location state remain with the consumer.

## Verification

Run `npm test --workspace @en-reve/primitives` for TypeScript and Node behavior tests. Run `npm run test:browser --workspace @en-reve/primitives` with the installed Playwright browsers to exercise actual native typing, state cancellation across Shadow DOM, form submission/validity/reset, roving focus, reconnection and synthetic composition guards in Chromium, Firefox and WebKit. The workspace's existing browser installation is `/private/tmp/en-reve-playwright`; use `PLAYWRIGHT_BROWSERS_PATH` when needed. Tests use a temporary localhost server on port 4182.

The historical [verification record](verification.json) records 22 passing Node tests and 24 passing browser cases (eight per engine) on 8 September 2026, before the single-event migration. Those counts do not verify its new transaction timing or adapters. These focused checks supplement the platform probes and component/reference-workflow suites; they are not the complete current-minus-one, device, locale or assistive-technology matrix.

## Virtual collections

[Virtual collection integration](docs/virtual-collection.md) documents the keyed
Signals model, browser lifecycle controller and native list/table renderers. The
layers support SSR, measured rows, focus retention and an explicit paginated
reading alternative. They do not own application records, sorting or selection.

## Collection contracts (API-04)

`VirtualCollection` and `TableModel` accept `getKey(item)`, with legacy `key(item)`
as an alias. `getKey` wins when both are present; one extractor is required.
Both generic primitives intentionally permit every unique string, including an
empty or whitespace-only string. Component boundaries (tree, data-table, activity
feed, carousel and progress steps) require unique **nonblank** string identities.
No boundary trims opaque identities. `state/collection.js` exports `CollectionMode`
(`all | paginated | virtual`) and the component predicate `isCollectionKey`.
TableModel also accepts legacy `windowed`; its existing default remains windowed.
Mode spellings are retained on reads/reflection for compatibility.

Description composition also serves editors and aggregate controls. Preserve native slot assignment rather than deciding fallback from extracted text. Selection-child normalization records whether description content is assigned, so empty/hidden assignments suppress the attribute fallback in both browser and SSR projection.

Native presentation templates and their paired portable/Lit styles have a
[consumer contract](docs/presentation-consumers.md), including explicit versus
native choice ownership, semantic composition and accessible chart data.
