# Phase 6 — measured DOM reduction and optional-feature activation

Status: implementation, automated qualification, targeted manual acceptance and
final frozen timing/retention are complete. Browser differences and limits are
documented in [execution results](scoped-registry-phase-6-results.md); the original
v1 evidence remains unchanged. The commit containing this plan seals Phase 6.
This is the detailed execution plan for [Phase 6 of the adoption plan](scoped-custom-element-registries.md#phase-6--reduce-dom-and-tune-activation-using-evidence).

Implementation parent: `2dc77b5773839f7afdd52ce0b4fc68a6af35d0f4` (final Phase 5
manual-review boundary); its runtime/performance parent is
`4a6da1fba47ba47c32612e83e4cd9db0584ba774`. Build from an isolated export of this
parent and overlay only enumerated candidate changes. Unrelated working-tree
changes, generated metadata and showcase work are not the Phase 6 baseline.

## Outcome and scope

Reduce the initial work of **unused optional internals**, beginning with the date
picker, while keeping essential input, form behavior and an accessible first
interaction usable. Compare the cost paid at startup, first use, repeated use,
and teardown. A smaller connected tree alone is not sufficient acceptance.

The committed deliverable is a qualified date-picker policy, compatibility/docs,
and a reproducible production comparison. Other families are a measured,
prioritized follow-up inventory; broad rollout is not required to complete the
pilot. No library-wide eager/lazy default change is assumed.

Keep these controls separate: importing code, registering definitions, creating
nodes, hydrating existing SSR, opening a surface, and reaching usable focus. The
first pilot separates **construction deferral** from **code splitting**. It does
not combine calendar markup simplification, virtualization, new calendar features
or server renderer changes into the same experiment.

## What the completed phases change

| Evidence | Implication for Phase 6 |
| --- | --- |
| Phases 1–2 established scope-aware construction, owner-realm fallback, dependency registration and child coordination. | Reuse these mechanisms. Do not add one fresh registry per picker or an alternate registration graph without demonstrated need. |
| Phase 3 required production-bundler qualification and localized loading/status updates. Its cleanup changed throttled readiness from 279.60 to 260.85 ms while focus stayed near 238 ms. | Profile status/render/layout separately; avoid whole-page rerenders and unchanged property rebinding. Treat focus, readiness and frame opportunities as different endpoints. |
| Phase 4 settings first use was 251.30 / 73.70 / 64.70 ms for intent / route preparation / eager. Route preparation delivered an extra 3,838 gzip bytes and two requests on unused visits. | Cold, intent and route preparation are consumer choices. Eager remains a credible control. Always expose speculative delivery and the time shifted before the gesture. |
| Final Phase 5 constrained first focus was 546.00 / 548.20 / 613.45 ms for eager / prepared / cold; WebKit desktop was 6 / 102.5 / 106 ms, with repeat use 3 / 2 / 2 ms. | Do not import the command palette's two-frame first-hydration workaround into date controls by default. Establish date-specific readiness and manually qualify any required settling. |
| Phase 5 unused live DOM was 1184 / 26 / 26, but deferred arms still held 1516 inert nodes. | Count live, inert and detached storage separately. Template delivery is not zero-node or zero-memory delivery. |
| Real IME and reported autofill/history workflows passed. The initial Chrome/Safari pre-hydration Back failure was not reproduced on focused retest; the return path was unspecified. | Preserve completed acceptance and the original report. Add date-specific checks for changed paths; do not claim every BFCache/new-document path or physical device is covered. |

These are **within-campaign historical results**, not a date-picker baseline or
cross-phase deltas. Sources: [Phase 3 cleanup](scoped-registry-phase-3-cleanup.md),
[Phase 4 delivery study](scoped-registry-phase-4-followup.md),
[Phase 5 closeout](scoped-registry-phase-5.md), and
[final manual evidence](../artifacts/scoped-registry-phase-5-manual-input-review/README.md).

## Current date-picker constraints

The earlier DOM audit's **623 nodes / 181 elements** describes a complete frozen
field, including its essential shell. It is an opportunity boundary, not the
removable calendar count or a measurement of the current parent. Re-census the
parent by shell, calendar and overlay before estimating savings. The
[date DOM audit](../showcases/performance/reports/dom-review/date-dom-audit.md)
identifies separate construction, marker, wrapper, event and rendering experiments.

- `datePickerDefinition` imports calendar, dialog, button and icon definitions;
  the generated lazy manifest imports that full definition. Merely loading this
  entry dynamically cannot split its optional internals. Existing metadata tests
  intentionally pin this dependency closure.
- `EnDatePicker` already uses type-only calendar/dialog class imports, but its
  validation, range state and formatted summaries need date/calendar helpers.
  Do not promise that every calendar-related byte or Intl operation disappears.
- The dialog's `for="picker-trigger"` currently supplies trigger listeners and
  expanded/has-popup state. Removing the dialog removes that behavior. Optional
  mounting needs explicit trigger ownership, not just a conditional template.
- Single mode retains a native date input. **Range mode does not:** its closed
  shell is a summary and trigger; native endpoint editors live inside the dialog.
  A failed optional chunk would otherwise remove its only editing route.
- Current eager SSR includes the calendar grid and range actions. Preserve this
  contract for existing consumers; opt-in deferred SSR needs its own matching
  server/client template policy and tests.

Implementation sources: [definition](../packages/elements/src/definitions/date-picker.ts),
[picker](../packages/elements/src/date-picker/element.ts),
[dialog trigger controller](../packages/elements/src/dialog/trigger-controller.ts),
[graph validation](../tooling/metadata/definition-graph.ts),
[date/range contract](date-followup.md), and
[eager SSR tests](../packages/elements/src/calendar/tests/calendar-ssr.test.mjs).

## Staged implementation and decision gates

| Increment | Work and reviewable deliverable | Advance when |
| --- | --- | --- |
| 6.0 — baseline and contracts | Export sealed parent, inventory hard/optional dependencies and public behavior, create matched date workload, record practical budgets and metric definitions. | Parent assets qualify; baseline and candidate scope are fixed before judging gains. |
| 6.1 — construction only | Opt-in single-date candidate that defers calendar construction while retaining eager imports and, initially, the dialog shell. Measure complete-overlay deferral separately only if attributable savings justify its extra trigger/focus ownership. | Unused optional subtree is absent, current eager behavior is preserved, first/repeat interactions and many-instance containment pass. |
| 6.2 — optional feature chunk | Add a lightweight shell consumption path and explicit optional-feature loading/registration. Keep existing eager define/catalog paths compatible. | Packed production output proves which bytes leave startup, with no hidden catalog/define/barrel imports or constructor conflicts. |
| 6.3 — preparation and retention policy | Compare cold activation, intent load-only and route-entry load-only in a bounded substudy; compare retain-connected, retain-detached and discard/recreate when justified. | Adopt a documented policy based on startup, unused delivery, first/repeat use and retention, with cancellation and draft safety. |
| 6.4 — SSR and supported modes | Qualify matching deferred SSR/hydration and native/global operation. Keep range eager until an equivalent editable fallback is designed and qualified; any range opt-in gets its own acceptance. | Existing eager SSR tests still pass; changed deferred paths preserve input identity, submission and accessible transitions. |
| 6.5 — final campaign and seal | Freeze the selected date candidate against the parent, publish sortable comparisons, finish targeted manual review, document rollout/rollback and rank later families. | Performance/behavior gates below pass; remaining limits and the adopted policy are explicit; source and evidence have a clean commit boundary. |

These are incremental checkpoints, not a requirement to ship every experimental
variant. Stop an unhelpful variant and preserve its evidence. If no lazy policy
meets the practical budgets, retain eager behavior and document the finding;
do not declare an optimization successful solely because its implementation exists.

### Range and compatibility policy

Start with **opt-in single-date deferral**. Existing range behavior remains eager
and covered by regressions. The opt-in contract must handle `selection` changing
before, during and after an open: preserve authoritative accepted state, cancel
stale actions, and use an already-qualified range path. Do not silently enter an
uneditable range shell while awaiting an optional chunk. Until that transition
has a qualified fallback, reject/limit that opt-in configuration explicitly and
keep the legacy path available; this is a release gate, not a silent fallback.

Range deferral can join Phase 6 only with a concrete eager native endpoint-editing
route or an equally usable fallback that preserves validation and submission when
code fails. Introducing that route changes UX and gets a separate review. The
pilot does not claim range savings while retaining its eager implementation.

Use the same canonical element constructor where eager and optional-feature
consumption can coexist. Do not publish incompatible constructors for the same
tag and rely on whichever registers first. Preserve existing synchronous APIs,
public types, theme tokens, slots, CSS Parts, default/reset semantics and eager
`define/date-picker`/catalog behavior. Specify the additive policy/export surface
in 6.0 before implementation; API names are not prescribed by this plan.

Keep required dependencies and optional-feature metadata under the existing graph
authority. If the schema/generator needs an optional-edge concept, extend it and
its validators together; do not remove hard dependencies from a still-eager
renderer or hand-edit generated manifests. Check exports, sideEffects declarations,
CEM/public API/types, docs and extracted-package consumption as one change. Include
a mixed-consumer build with both the eager entry and the new opt-in entry; report
when that application's existing imports eliminate potential code savings.

### Registry ownership and mounting

Use the actual render-root registry and creation scope already provided by
`EnElement`. Share module evaluation by module/version and track registration per
registry; preserve conflict preflight and owner-document behavior. No per-instance
registry allocation by default. Optional descendants remain **absent**, not merely
connected as unknown tags: registering a tag can upgrade every matching connected
node in that registry.

`createDefinitionLoader.load()` prepares code only; `ensure()` registers, but
neither establishes widget readiness. Prefer loader plus component-owned mounting
for internals of an already-defined picker. Use `createElementActivation` only
where its documented root/template/group preconditions hold. Do not force an
initial `createHydrationIsland` into an already owned/upgraded picker or a populated
shared scoped registry. Native and global modes must provide equivalent deferred
construction; explicitly import/create through the correct scope rather than
expecting DOM ancestry or a portal move to reassign ownership.

Qualify two pickers sharing a registry, independent scopes, globally registered
optional tags, conflicting versions, and only one opened. Opening one must not
construct every sibling's calendar. Cancel old-document work on adoption; support
new-document recreation through the destination factory where transfer cannot
preserve constructor/style ownership. Initialization is not a reversible pause.

Sources: [scope-aware base](../packages/elements/src/internal/en-element.ts),
[loader](../packages/elements/src/lazy-loader.ts),
[activation](../packages/elements/src/activation.ts),
[initial hydration](../packages/ssr/src/client.ts), and
[HTML registry algorithms](https://html.spec.whatwg.org/multipage/custom-elements.html#custom-elements-api).

### Opening, cancellation and recovery

Keep `showPicker(): Promise<void>` and synchronous `hidePicker()`. For the new
policy, document the following behavior before adding asynchronous work:

- Coalesce concurrent opening of the same instance. Only the current request may
  mount/open/focus; canceled or superseded work must never replay later.
- Preserve disabled/read-only no-op behavior. Treat ordinary hide/reset/disconnect
  cancellation as a resolved no-op for the public open promise; adapt internal
  abort rejection at that boundary. Genuine load/initialization errors reject.
  UI handlers catch errors and expose accessible recovery rather than unhandled
  promises. This distinction gets explicit tests and documentation.
- Invalidate pending opens on hide, reset, disabled/fieldset-disabled, read-only,
  disconnect, adoption or an incompatible mode change. Reconnect/re-enable does
  not replay an old user action. A canceled close preserves the still-open dialog
  and its focus state; cancellation is not permission to discard it.
- Re-read current value/range, bounds/step, locale/calendar, today/first weekday,
  availability and labels after preparation, immediately before opening, and at
  acceptance. Keep editing available while loading; never reapply a stale draft
  snapshot. Preserve author writes made during a cancelable change dispatch.
- Give the shell one trigger handler and one ARIA-state owner in the opt-in path.
  Keep loading/error status local, stable and announced; preserve label/help/error
  relationships, meaningful busy scope and geometry. Handoff to the mounted
  dialog must not double-open, steal subsequent focus or duplicate announcements.
- Resolve successful opening after rendered, usable calendar state and the correct
  focus target. Do not use `whenDefined()` as readiness or add arbitrary universal
  frame/timer waits. Repeat opening must not repay an unnecessary first-hydration
  delay. Preserve focus restoration for trigger clicks and programmatic opening.
- Loading failures may be retryable; constructor/partial-registration or started
  hydration failures are not reset by clearing a promise. Preserve irreversible
  registry state, native fallback and a clear reload/recreate recovery route.
  Test real failed imports: earlier Chromium/WebKit captures required reload,
  whereas Firefox recovered. Do not promise uniform retry from a synthetic error.

Any retained native `HTMLInputElement.showPicker()` path must remain in the trusted
interaction before arbitrary awaited loading; it requires and can consume
transient activation. This constraint is separate from opening the custom dialog.
Do not add a native-picker feature as a purported equivalent custom-calendar
optimization. [HTML showPicker](https://html.spec.whatwg.org/multipage/input.html#dom-input-showpicker).

### Form, calendar and visual invariants

Keep the FACE owner, native single-date input, trigger, labels, help/error/status,
validation anchor and form data ready without the optional calendar. Native inputs
inside another shadow tree do not automatically join an outer form. Preserve
`value`/defaultValue, paired `rangeValue`/defaultRangeValue, start/end names, empty
and partial range submission, required validity, min/max/step, disabled fieldsets,
reset and restoration independently of whether the popup was ever opened.
[Form ownership](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#association-of-controls-and-forms),
[FACE state](https://html.spec.whatwg.org/multipage/custom-elements.html#form-associated-custom-elements).

Keep Gregorian ISO storage, deterministic application-supplied today, supported
modern Buddhist display, locale/RTL, first weekday, boundaries/leap dates and
explicit unsupported-calendar explanations. Preserve one grid Tab stop and current
keyboard navigation, selected versus focused state, unavailable days, same-date
confirmation and one cancelable accepted `en-change`. Range regression coverage
includes incomplete/reversed/same-day drafts, hover preview, Apply/Cancel/Clear,
rollback, author-write precedence and availability invalidation.

Do not remove public `::part(base)`/exportparts or generic label/focus/description
wrappers as incidental cleanup. Prove a wrapper's responsibilities and compatibility
first. Match responsive placement, touch targets, forced colors, reduced motion,
zoom, slotted labels and stylesheet adoption. Initial DOM wins must survive all
supported themes without layout shifts or inaccessible loading surfaces.

### SSR, disposal and storage

Compare client rendering separately from the chosen SSR delivery. Preserve existing
eager markup; deferred opt-in SSR and its first client render must agree on optional
content, data, IDs, styles and Lit markers. Essential native input belongs outside
inert optional templates, but a native input still inside the picker's shadow root
is **not** a successful control of an outer form before the FACE host upgrades.
No-JS editability is not no-JS validation/submission. For the standard component
recipe, keep shell hydration eager and document that existing pre-upgrade limit.
A consumer recipe promising no-JS submission must provide an actual native control
associated with the form outside that shadow boundary (or an explicitly native
form route), preserve entered value/identity, and prevent duplicate successful
values during enhancement. Qualify this handoff before making that promise; the
Phase 5 manual checks did not certify no-JS FACE submission.

Qualify no-JS behavior with those declared limits, delayed/failed chunks, editing
before and during hydration, required submission after shell readiness but before
optional code, reset and restoration. Use the Phase 5 ordered bootstrap for deliberately global, null-DSD or inert materialization paths;
do not retarget document-global parsed nodes or hydrate one boundary twice.

Report transmitted HTML, parsed/inert storage and live nodes separately. If inert
SSR includes the full calendar, disclose that it keeps those bytes/nodes; an
omitted calendar with later client construction is a different delivery policy.
Use build-time SSR or the existing compatible renderer for client comparisons;
request-isolated worker cost remains a separate server concern. No new server
campaign unless renderer/delivery work actually changes that cost.

Start with retaining a closed realized tree for repeat-use compatibility. Measure
other storage policies before adopting them: connected-but-closed, detached warm
instance, and discard/recreate have different lifecycle costs. Never evict a
focused/editing subtree or an uncommitted range. Discard only after accepted close,
focus restoration and exit-motion completion; release listeners, observers, timers,
controllers, cloned templates and readiness callbacks. Document how new instances
recover authoritative accepted state and which transient view state is retained.
Disconnect/reconnect is not equivalent to disposal; imported modules and registry
definitions are expected to remain resident.

## Production measurement and qualification protocol

### Attribution and comparable builds

Use existing production/SSR harness infrastructure, adding date-specific scenarios
rather than a new general benchmark system. Package the exact parent and candidate,
consume extracted tarballs with the same Vite/build settings, lockfile and content,
and hash every measured package/site/harness. Use the shared performance lock;
serialize captures with no concurrent build or unrelated browser workload. Keep
HTTP/2, gzip level, headers and cache/service-worker policy identical between arms;
record power/thermal state where available and explicitly record unavailable data.
Record browser versions, capability probe/mode, host, configuration, cache policy,
viewport, month/value/calendar,
locale and lifecycle checkpoint. Freeze source overlays; unrelated workspace
changes cannot enter captures unnoticed.

The final registry comparison uses the exact sealed parent for eager-global and
eager-scoped, and the candidate for selected-lazy-global and selected-lazy-scoped.
All arms have equal functionality and application inputs; the two lazy arms share
the selected preparation policy. Eager arms have no lazy preparation stage.
Candidate eager compatibility is a separate qualification, not a replacement for
the sealed-parent controls.
Use explicit global mode to separate native/global behavior on capable engines.
In unsupported engines, label scoped-requested cases as fallback; deduplicate
identical fallback cells explicitly rather than claiming native scoping. Cross-
registry comparisons do not replace parent-versus-candidate comparisons within a
mode. Keep the construction-only candidate as a diagnostic comparison unless it
is a promoted recommendation, in which case it receives full matched samples.

The primary full campaign below uses one matched production **client-rendered date
consumer route**: one single-date picker in a stable essential form, with a declared
shared button/dialog dependency set and deterministic date/locale content. Fix its
exact source and initial import graph in 6.0. This tests the marginal gain in a
consumer, rather than assuming every byte of the optional graph is new to the app.

A minimal shell-only route attributes isolated chunk sizes; deferred SSR delivery
and several-field/scaling routes are additional functional/diagnostic lanes. They
do not silently multiply the stated main campaign. Any SSR, warm-cache, scaling or
other lane used to recommend a distinct shipping policy gets its own enumerated
30-sample comparisons in affected configurations, with costs counted separately.
Do not transfer an isolated-fixture benefit to an app whose eager imports already
load the feature. Separate workload sections and capture IDs prevent accidental
cross-workload subtraction.

### Primary and bounded supplementary matrix

- Reuse six primary configurations: Chromium, Firefox and WebKit desktop keyboard;
  constrained Chromium keyboard; constrained Chromium emulated touch; constrained
  Chromium unused visit followed by abandoned intent. Use the established 4× CPU,
  150 ms latency, 1.6 Mbps down / 750 Kbps up profile. Emulation is not a physical
  mobile acceptance result.
- Final promoted arms receive **at least 30 successful samples per configuration**.
  For the primary consumer route, four distinct arms × six configurations × 30 is
  720 samples, including observation runs; five separate retention runs per arm add
  20. Record any deduplicated fallback cells and supplementary arms explicitly.
  Qualification runs are separate.
- Before expanding that matrix, run bounded policy comparisons: cold activation,
  focus/pointer intent load-only, and route-entry load-only. Prior preference for
  route preparation in settings is not a universal library default. Measure
  abandoned intent, repeated intent, navigation-away cancellation, no-intent visits,
  and interaction before preparation completes. Every promoted policy receives
  30 samples in the configurations supporting its recommendation.
- Distinguish cold fresh-context navigation, warm HTTP-cache **new document**, and
  same-document repeat opening. Existing cold campaigns do not establish warm-cache
  behavior. Use a bounded matched warm-cache study with 30 samples per promoted
  comparison; document reload/navigation, disk-cache and service-worker policy.
- Scaling and retention substudies cover multiple instances sharing a scope versus
  separate scopes, one opened, concurrently requested opens, cancel/reconnect and
  disposal. Fix and publish the populations before capture. Larger stress cases
  and profiled traces are diagnostic unless explicitly promoted to final evidence.

### Timing and resource boundaries

| Record | Interpretation |
| --- | --- |
| Navigation → essential input/trigger usable | Startup endpoint includes actual essential readiness, not just a script marker. |
| Trusted gesture → feedback/module resolved/registration/mounted ready/open/focused day | Separate milestones expose deferred work; record scheduling/parse/evaluation/style/layout contributions where measurable. |
| Navigation → first focused calendar; preparation start/end/lead | Exposes earlier work and user-visible total wait. Never subtract independent medians to invent additive stages. |
| Focus → next frame opportunity; first selection accepted; repeat open/selection | Distinguish usable focus, frame scheduling and transactions. Neither a frame nor updateComplete proves paint; these are lab measures, not field INP. |
| Emitted asset inventory plus delivery snapshots at shell readiness, pre-action, 500 ms unused window, settled unused, after use | Report built raw/gzip sizes separately from actually fetched/completed encoded response bytes, requests and in-flight work. Speculation counts; completed responses at one snapshot are not total delivery cost. |
| DOM at initial closed / first open / close settled / reopen / disposal | Count page and date-owned subtrees without double counting; classify elements, text, comments, shadow roots, inert and detached nodes. |
| Constructors, registry count, listeners/observers, long tasks/layout shifts, heap where available | Registry bookkeeping and retained state matter; unsupported metrics are unavailable, never zero. |

First-use primary actions follow essential readiness with **no intentional lead**.
Record any real focus/automation preparation lead. A deliberately prepared 500 ms
condition is a separate labeled experiment. Qualify interaction while startup is
still in progress if the new shell exposes a trigger then; post-readiness timing
alone does not establish that journey. Keep measurement/status updates local and
stable so instrumentation does not recreate the Phase 3 rerender/layout problem.

### Retention, statistics and stop rules

Run retention separately: five fresh-context Chromium repetitions per selected arm,
100 cycles with checkpoints at 0/10/50/100, double GC where available and explicit
post-animation/settling checkpoints. Exercise mount/open/close/remove/dispose and
any promoted warm-retention policy. Remove diagnostic observers that retain old
nodes before cycling. Report retained DOM/listeners/documents and heap growth;
module residency and shared caches are expected. Zero node growth is not proof
of no leaks; five repetitions provide descriptive evidence, not broad certainty.

Use serial seeded randomized matched blocks on qualified assets. Stop on errors or
changed fingerprints, retain failed attempts, never insert zeros for missing values
or trim outliers. Preserve n, failures, median, p75 and spread; publish p95 only with
adequate additional samples (at least 100), not as a reliable estimate from 30.
Keep traced/profiled runs outside timing distributions. Use exploratory matched
bootstrap intervals and label multiple comparisons; confirm material conclusions
with an independent run where noise or a regression signal warrants it.

After the fresh date baseline and **before choosing the winning candidate**, write
numeric practical budgets for startup/unused delivery, first focused open, repeat
open/selection and retention per relevant profile. Include absolute and relative
limits, the minimum worthwhile benefit and uncertainty decision rules. Existing
generic 10%/16 ms action review triggers are prompts for investigation, not automatic
date-picker acceptance budgets. An interval crossing zero is inconclusive, not proof
of equivalence. Require a repeatable useful initial-work saving and acceptable
first/repeat costs; stop/revise a candidate whose wrappers, observers, registries,
speculation, retained trees or accessibility delays consume the benefit.

## Functional and manual exit gates

Before final capture, qualify exact packed assets in all three engines and both
supported registry paths. Include eager compatibility; two-instance containment;
keyboard/touch/programmatic first opening; cold/warm/repeat; slow and real failed
chunks; coalescing; cancellation during every asynchronous stage; conflict handling;
reset/disable/read-only/mode/value changes while loading; owner-document changes;
form submission before optional code; transactions; styling; SSR/native input
identity; and cleanup. Preserve existing eager nesting/SSR tests and add opt-in
cases rather than weakening their assertions.

Target manual review at changed date behavior: first lazy loading/error/retry and
entry, named dialog/grid, selected/unavailable date announcements, month/year and
range feedback, Escape/Close/Cancel/Apply, correct focus return, typing/IME and
native date editing. Review actual Safari/VoiceOver independently of automated
WebKit; record versions/settings and physical touch/mobile coverage when tested.
Do not assume the command palette's accepted Chrome speech limitation occurs here.
[WAI date-picker dialog guidance](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/).

Reuse the Phase 5 native-versus-managed form review pattern where the input lifecycle
changes. Record actual autofill/history separately from synthetic assignment, and
BFCache resume versus new-document restoration separately where observed. Existing
manual passes stay valid for their reviewed fixture; neither reopen all of Phase 5
nor extend those passes to new date interactions without evidence.

## Later candidates and explicit exclusions

After the date result, rank candidates by measured **unused cost and usage frequency**,
not tag count. Each promotion has its own dependency boundary, useful fallback,
readiness/cancellation contract and matched comparison:

1. Optional color planes/tools, retaining numeric/text/native editing and trusted
   native-picker gestures; preserve live transactions and editing state.
2. Editor toolbars/popups/extensions and media tools, retaining the active editor,
   selection/IME/undo and pending operations. Do not discard an active session.
3. Inactive panels and collection internals only where authored content, links,
   find-in-page, printing and assistive reading remain accessible. Reuse existing
   table/tree/carousel/activity windowing APIs; no blanket virtualization or new
   document-wide scanner. Existing virtual-table screen-reader feedback remains a
   separate acceptance constraint for any future change to that family.

Marker/whitespace reduction, calendar wrapper/weekday simplification, event delegation
and immutable presentation caches remain bounded date-audit candidates after the
pilot. They measure different costs. A variable week count changes the existing
six-week layout/keyboard contract and requires separate UX review; it is not a
required Phase 6 optimization. Native `en-date-input` is a different product choice,
not an equivalent replacement control in the custom-calendar comparison.

Exclude worker pooling/SSR throughput, a streaming SSR engine, generic form/draft
persistence, new calendar systems/time-zone features, universal focus delays,
framework-wide scoped rendering rewrites and unrelated component/theme backlog.
Do not widen Phase 6 merely because those earlier limitations are documented.

## Reporting, rollback and final boundary

Keep the existing sortable **`en-table`** report format. Show parent/candidate and
policy comparisons within each matched date workload, with separate historical
Phase 0–5 sections. Every change-centric column has a below-table explanation of
which sign is better (lower latency/bytes/nodes usually better; correctness/coverage
counts need their own direction). Include unfavorable results, preparation lead,
unused bytes, inert/detached counts and unsupported metrics.

Freeze source, packages, built sites, manifests/graph, harness/protocol, environment,
raw successful/failed attempts, analysis, qualification and targeted manual outcomes.
Verify all older seals remain unchanged. State the adopted single/range scope,
policy, public API/SSR compatibility, cache regimes and unresolved limits before
creating the Phase 6 implementation/evidence commit. A follow-up measurement after
a runtime change is a new revision, not a rewrite of the frozen reference.

Roll out through an explicit component/consumer opt-in with the eager recipe
retained. Switching registry policy applies to new roots or fresh navigation;
never rebind a live tree. Document how to return to eager construction/preparation
without losing field state. Phase 6 completion means the qualified policy and
its tradeoffs are reviewable and sealed—not that every optional family is migrated.
