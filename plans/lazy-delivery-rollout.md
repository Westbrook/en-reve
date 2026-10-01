# Universal lazy delivery rollout

Status: completed and accepted on 30 September 2026. Implementation, evidence and initial private documentation publication are on local main through `40dda59d07b536d3a51c4afcffb235c0d8527d5c`. The [accepted closeout](lazy-delivery/README.md#accepted-closeout) records all 75 correctness stages passing and the explicit user acceptance of two uncertain Firefox global-fallback API checks; the automated performance verdict remains unqualified. The original scoped-registry Phases 1–6 remain sealed. The stages below preserve this rollout's acceptance contract, not a new queue of work.

Historical source audit: local `main` at `e85eb6b37d4501ddd70277bb979f6bd01741009b` (tree `e5c59dd739c7df8815c87f0b1b0fc7e374cde7cb`). Execution began from accepted main `fba5ec19b58606cf1776df44862a38a3898f4c72`. The [original kickoff](lazy-delivery-rollout-kickoff.md) is retained for provenance; consult the accepted closeout before scoping any new work.

## Outcome and compatibility policy

Make delivery capabilities discoverable and consistently usable across the complete element catalog. Every component must support the existing tag-level loader. Every meaningful internal feature must have an explicit disposition: supported deferred delivery, already conditional, essential/eager, not applicable, or rejected with evidence. Implement worthwhile eligible boundaries; unassessed or blocked features are unfinished work.

The recommended working policy is **universal opt-in delivery with existing eager defaults preserved**. The user was offered an optional choice about a future versioned lazy-by-default migration; no answer was recorded when this plan was written. This conservative policy permits progress without a breaking default change. A later affirmative choice adds a separate migration/release workstream.

“Universal” means a predictable API and complete, honest coverage. It does not require a network request for every native editor, authored panel or two-node helper. Code loading, registration/upgrade, construction, hydration and semantic interaction are distinct operations. Consumers must be able to tell which costs a policy postpones.

Scope includes contracts, eligible component boundaries, representative consumers, production bundling, SSR, accessibility, lifecycle, metrics and docs. It excludes unrequested default changes, synchronous return-type changes, hidden essential content, rejected experiments, implicit global prefetch and external analytics.

## Existing foundations

| Layer | Current behavior | Remaining work |
| --- | --- | --- |
| Canonical loading | [Generated manifest](../packages/elements/src/lazy-manifest.ts) contains all **96** canonical tags as literal dynamic imports; importing it imports no components. | Preserve exhaustive coverage as the catalog grows; do not build another tag loader. |
| Definitions | [Loader](../packages/elements/src/lazy-loader.ts) separates `load()` from `ensure()`. Modules share manifest identity; registration is registry-specific. | Add feature/profile discovery and selection while preserving the canonical eager graph. |
| Application activation | [Controller](../packages/elements/src/activation.ts) provides load, activate, readiness, cancellation and disposal for application-owned roots. | Reuse its vocabulary and ownership rules for internal features. |
| Registry context | [Element scope](../packages/elements/src/element-scope.ts) qualifies native support and falls back to the owning document's global registry. | Preserve ordinary-element/shadow-root containment, nested roots and document ownership. |
| SSR | [Client island controller](../packages/ssr/src/client.ts) owns hydration and validates identity/version. | Carry delivery policy through SSR/streaming; never give one root two activation/hydration owners. |
| Internal pilot | [Single-date shell](../packages/elements/src/date-picker-shell.ts) omits the calendar definition; [feature loader](../packages/elements/src/internal/date-picker-feature.ts) shares calendar code. | Expose the opt-in through the common contract. Preserve constructor, eager entry and range policy. |
| Other conditional work | Tree Move's expensive body, color-plane DOM, editor/media surfaces and `prosemirror-view` already have conditional behavior. | Attribute existing savings; conditional DOM/data loading does not prove an optional-code boundary. |

The canonical date definition includes the calendar. Loading `en-date-picker` through the ordinary manifest therefore loads the eager dependency closure. A late property assignment cannot remove that code. Entry/profile selection and instance delivery policy must both be explicit before initial rendering.

## Inherited investigation decisions

These are previous results, not measurements of this plan. Preserve their workloads and evidence. Reconcile subsequent main changes before treating an old failure as a current defect.

| Investigation | Finding | Disposition and reopening trigger |
| --- | --- | --- |
| Color plane | Split saved 1,569 gzip bytes and **zero nodes**. Wheel already separate: 2,927 marginal bytes / 44 nodes. | Keep boundaries. Revisit for a named, independently useful tool with material unused cost, not the same plane split. |
| Contextual editor toolbar | Four-command toolbar: 135 connected nodes, no extra library modules over persistent formatting. No pilot promoted. | Leading **construction** candidate in a real occasional-formatting consumer. First qualify phone interception, bookmarks and link-draft ownership. No assumed code saving. |
| Panels/collections | Hidden Activity controls: 38 nodes; carousel rotation: 19; idle Tree Move shell: 7. Expensive Tree Move body already on-demand. Larger bodies are authored. | Preserve APIs. Reopen for a larger generated surface or a design meeting authored-content discovery obligations. |
| Range date | Calendar subtree: 506 nodes. Prototype lacked production-equivalent essential editor, SSR and transaction ownership; byte totals incomparable. | Eager until Stage D establishes a usable fallback. Single-date qualification does not establish range readiness. |
| Real date route | Experimental `/workflows/multi-step.html` saved 751 nodes / 33.1% whole-route nodes, below its predeclared 40% node / 10% startup-JS gate. Both original retention arms failed. | Keep route eager. Later retention attribution does not erase its independent benefit failure. Reopen for changed route costs/usage, not relaxed post-hoc gates. |
| Calendar retention | 1,080 timings / 80 retention runs. Warm detachment added about 989 KiB heap and detached DOM; recreation changed active-date reopen semantics. | Keep connected-after-use. Revisit only with a new mechanism that preserves semantics. |
| Date first opening | Guard-removal and formatter-only candidates rejected. Formatter trial: 2,160 cold observations / 72 cells; primary constrained median first focus 34.70 → 54.20 ms. | Preserve guard/runtime. Synchronization hypothesis remains source-reviewed, not a delivered optimization. |

Date-opening evidence is on main in [the final investigation](scoped-followup-date-opening-results.md). The initial task assessment is retained at `artifacts/scoped-registry-followup-review/assessment-2026-09-24.md` in the original checkout; its dated continuation notes are historical, not current status. Detailed family outcomes are indexed in the independent report's `handoff.scopedFollowupConsolidation`, `scopedFollowupColorTools`, `scopedFollowupAuxiliaryUI`, `scopedFollowupPanelsCollections`, `dateRetention` and `scopedFollowupConsumer`. The [old kickoff pack](scoped-registry-followup-kickoffs.md) describes investigations, not eleven shipped runtime features.

Stage A must retain a compact evidence index with exact commits, paths and hashes. Recover relevant files/Git objects before relying on temporary or archived checkout paths; do not depend solely on `/private/tmp` or reopen archived tasks to obtain working space. The color plan is recoverable as `8969cde312b09fec670fc8cc0927b49bae30ff8d:plans/scoped-followup-color-tools.md`.

## Required common contract

Freeze the smallest additive contract after exercising the existing date feature and a structurally different application boundary. API names beyond existing exports are design proposals, not implemented APIs.

1. **Describe without loading.** Generated serializable metadata lists tags, entry profiles, feature IDs, deferred costs, dependencies, fallback, owner, prerequisites and support/disposition. Reading metadata evaluates no components. Unknown requests fail before imports. Version the public metadata schema and define stable feature/profile IDs, compatibility rules and deprecation/migration behavior; validate SSR/client agreement explicitly. “Not applicable” is a descriptor, not a fake successful activation.
2. **Select definitions explicitly.** Provide typed allowlisted profile selection, for example a factory producing the existing `DefinitionLoaders` shape. Default selection reproduces the canonical manifest. Single-date shell selection is explicit; eager imports and `registerAll()` stay compatible. No competing constructor for the same tag, mutable shared manifest or replacement of an already registered definition. Test mixed eager/shell use in both orders and across registries. Detect incompatible requests before work where possible. Keep a small selective-loader path so consumers need not import the whole catalog metadata/manifest. Specify how consumer-supplied `DefinitionLoaders` and namespaced feature descriptors extend the allowlist, how collisions/version mismatches fail, and what unknown third-party definitions cannot claim without an adapter. Separate registries may use different compatible library versions; same-registry conflicts remain errors.
3. **Prepare code separately.** Retain `load()` as fetch/evaluation only. Feature preparation coalesces imports across hosts/scopes without retaining DOM, registries or request objects globally. Canonicalize immutable profile/manifest identity so fresh wrappers do not defeat sharing. Preparation never registers, initializes, constructs, focuses or announces opening.
4. **Register in the actual scope.** Retain `ensure()` semantics: dependencies first, conflicts checked, no readiness implied. Internal features use the host's scope. Never retry explicit scope failures globally. A definition may upgrade all associated matching connected nodes; sharing a definition must not construct every sibling's optional internals.
5. **Own instance activation.** Align internal controllers with `load`, `activate`, `cancel`, `dispose`, state and stage-specific errors. Adapters own creation/readiness; existing application and SSR controllers remain owners of their roots. Feature readiness is distinct from opening, committing or invoking a native picker. Preserve existing `showPicker()`, synchronous `show()/hide()`, `moveItems()` and focus contracts. Keep adapters internal until two real ownership patterns justify a public controller; public discovery/preparation may land first.
6. **Specify failure and disposal.** Distinguish lookup, import, registration, construction and readiness failures. Retry explicitly; browser module failures may stay cached. Registration/evaluation cannot be undone, unloaded or unregistered. Cancel only instance intent, not another caller's shared load. Disposal releases refs and prevents late mount/focus. Document recovery after irreversible partial registration. No unbounded automatic retries.
7. **Keep scheduling explicit.** Manual/action and application-owned route/intent/visibility preparation are recipes, not global scanners or automatic observers. Preparation is load-only. Consumer concurrency and stale-intent cancellation are testable; build a scheduler only for a measured need. Never await imports then replay trusted-activation-only picker/clipboard actions.

Use the existing [registration graph](../packages/primitives/src/interactions/registration.ts), [metadata graph reader](../tooling/metadata/definition-graph.ts) and [manifest generator](../tooling/metadata/lazy-manifest.ts). The graph reader currently accepts canonical `tagName`, `elementClass` and `dependencies`. Add sidecar/profile metadata or deliberately extend the schema; do not weaken validation or hand-edit generated output. Public types/API/CEM, metadata and package exports must agree.

## Stages and exit gates

Each stage ends with a clean commit and report checkpoint. A negative qualification is useful evidence. Unfinished required work remains visible.

### A — Exhaustive inventory and specification

Deliver a machine-readable inventory, API/ownership specification and evidence index.

- Derive exact tag membership from the canonical graph, currently 96; test set equality, not a hard-coded count. Cover primitives/forms, overlays/commands/navigation, editor/media/color, date/time, panels/content and collections/data. Include all public entries/profiles and meaningful internal features; parent/child tags cannot fall between family owners.
- Track separately: component loading, registration, construction, optional code, hydration, data and virtualization. Each feature records owner, consumer, trigger, fallback, semantic dependencies, synchronous/gesture constraints, SSR, state/retention policy, prior evidence and qualification.
- Dispositions: `implemented`, `already-conditional`, `essential-eager`, `not-applicable`, `rejected-with-evidence`, `needs-design`, `candidate` and `unassessed`. The last three are not final completion. Moving required scope out needs a visible rationale and disposition.
- Specify recipes for global compatibility, scoped ordinary elements, scoped shadow/nested roots, imperative hosts, declarative markup and SSR, including profile/property timing, custom loaders and another document's hosts.
- Predeclare Stage B/C cells and numeric budgets before runtime edits. Separate API overhead from feature savings. Read unresolved feedback and assign relevant regression obligations without claiming unrelated feedback resolved.

**Exit:** complete source membership, every family owned/dispositioned, concrete consumer/type sketches, exact inherited decisions linked, no claim that all features can defer.

### B — Shared contract and existing-feature convergence

Implement additive metadata/profile/preparation behavior and converge the existing single-date feature.

- Expose the shell through allowlisted selection. Prove production shell imports exclude calendar code and canonical eager imports include it. Preserve constructor identity and policy timing before first update. Unsupported range/profile combinations get a deterministic documented outcome with a usable essential editor.
- Consolidate duplicated responsibilities only. Date focus, transactions, status/retry messages and form behavior remain component-owned. Avoid a second global cache/state machine or gratuitous activation/SSR rewrites.
- Exercise the contract with the existing command/application activation pattern as the second ownership case. Internal dialog and application island need different adapters; hydration cannot borrow ordinary materialization.
- Add types, inert import/dependency assertions, packed consumers, ownership/cancel/retry tests. Keep diagnostics optional; disabled diagnostics must add no unexpected imports/subscriptions.
- Ship recipes and matched evidence for API overhead and the existing feature. Metadata coverage alone is not a performance gain.

**Exit:** consistent documented existing paths, eager/lazy consumers pass, no undeclared eager cost, and all applicable predeclared budgets pass. Do not require a generic public controller when a small adapter works.

### C — Qualify and expand optional generated UI

Start with the contextual editor toolbar. Continue through other named eligible candidates after its first gate; the goal is complete eligible coverage, not one demo.

1. Select a real occasional-formatting consumer and record usage assumptions. Reproduce phone-width interception before deferral; qualify visible and initially absent toolbars. Editing and meaningful content stay available.
2. Separate eager construction, deferred construction with identical code and optional splitting only when a unique dependency exists. Earlier toolbar evidence establishes no unique code saving. Predeclare component and whole-route benefit/latency budgets.
3. Specify selection/bookmark/link-draft ownership through open/cancel/commit, editor mutations, removal/reconnect and trigger replacement. Native color actions keep trusted activation; loading cannot reconstruct that gesture.
4. If the candidate misses its gate, record the reason and move to the next named, measured eligible candidate. Do not weaken gates or invent a consumer. Audit editor/media auxiliaries and existing rich-editor view loading next; essential editing machinery is not an optional tool.
5. Audit overlays/commands, navigation, selection controls, upload/media tools and the remaining catalog for substantial generated surfaces. Preserve synchronous calls/forms. Small controls and already conditional bodies receive evidence-backed dispositions rather than artificial network boundaries.

**Exit per family:** accepted opt-in with tests, consumer, evidence and rollback, or a justified no-change decision. Reconcile family coverage to the entire Stage A inventory.

### D — Essential editor and authored-content designs

Design may run alongside B/C. Production work requires stable contracts and a usable fallback. These are required design/disposition tracks, not permission to hide essential UI.

**Range:** specify/extract private draft versus accepted ownership, start/end native editing, locale parsing/formatting, constraints/validation, form entries/reset, apply/cancel/close-veto/events, focus and accessibility before splitting the calendar. Prototype with the real production element and SSR markup. Preserve endpoint identity and edits before/during/after hydration, restoration, composition and autofill. Native editing remains usable on failure and without JS. Keep the eager path. Promote only with parity and measured benefits; if compatible fallback is not feasible, retain explicit `essential-eager` with evidence and scope breaking redesign separately.

**Panels/collections:** preserve authored text/semantics for Find, hash targets, print, no-JS reading and AT discovery. Prefer deferred generated tools over removed authored bodies. Hidden/`inert`/CSS-contained DOM is not omitted allocation. Data laziness is not code loading or virtualization. Authored-body opt-ins require discovery documentation and real AT review. Existing collection VoiceOver traversal remains separate; automated focus does not close it.

**Exit:** each track has a qualified implementation or evidence-backed eager/no-change outcome. Unresolved fallback/manual acceptance stays open; a completed design is not a completed implementation.

### E — Consumers, final qualification and closeout

- Integrate promoted profiles into packed production recipes/docs. Adopt real routes only where route gates pass. Show eager rollback and same-constructor migration order. Do not generalize microbenchmark results.
- Reconcile inventory with final source; new tags and stale metadata must fail CI. Document eager/rejected dispositions and concrete reopening triggers.
- Run selected integration checks across the full affected dependency closure and qualify exact combined source. Branch receipts do not certify a merge. Verify frozen artifacts and generated reproducibility.
- Provide sortable `en-table` comparisons with the better sign for every change column below its table. Show sample counts, uncertainty, failures, requested/actual mode and exact raw evidence. Separate API coverage, feature adoption and consumer benefit.
- Seal accepted implementation/evidence commits on local main under current authorization. Keep rejected experiments out. Distinguish local commits from remote pushes, package publication and site deployment. Mark **Ready to archive** only after agreed work/handoff completes; otherwise name remaining item and owner.

## Parallel execution and ownership

| Lane | Start | Ownership | Dependency |
| --- | --- | --- | --- |
| Lead / common API | A then B | Inventory, loader/activation/metadata/SSR contract and final reconciliation | Sole integration/main writer; shared interface lands before family merges. |
| Generated-feature families | Audit in A; implementation after B contract freezes | Separate families, consumer fixtures/tests | Isolated worktrees; one owner per shared component. Editor-hosted color coordinates selection/native actions. |
| Range / content design | A | Native fallback/discovery design and prototypes | No concurrent date-runtime edits with B; prototypes do not change defaults. |
| Validation / docs | A | Packed fixture design, inventory checks, tests and docs | One harness owner; follow the frozen contract. |
| Performance / manual | Exact candidates/fixtures ready | Matched timing, retention, focused manual scripts | Serialize shared timing/resources; ready URL and one action at a time for human review. |

Independent analysis, implementation and isolated deterministic tests can run concurrently. Shared fixed-port/browser/profiling workloads obey test-runner resource ownership. Active desktop measurement is accepted: no dedicated macOS account or firewall exception required. Record contention under a predeclared protocol; do not selectively exclude inconvenient observations.

## Cross-cutting acceptance matrix

For each changed boundary, record relevant pass/failure/justified non-applicability. Prefer portable Playwright tests with explicit browser versions. Simulated fallback differs from actual unsupported-engine fallback.

| Area | Required coverage |
| --- | --- |
| Registry | Native scoped ordinary/shadow boundaries, nested explicit roots, actual global fallback, shared/separate registries, sibling containment, already-defined/eager-first/deferred-first, detached/reconnected roots, document/adoption. No implicit global lookup or per-instance registry multiplication. |
| Import / registration | Inert metadata/profile imports, allowlisted URLs, unknown-request rejection before work, dependency order/conflicts, concurrent overlapping loads/cache/retry, irreversible registration failure. Load-only preparation never upgrades dormant trees. |
| Lifecycle | Concurrent intent; cancel each async stage; dispose/remove/reconnect/adopt; disable/readonly/mode/reset while loading; no stale focus; independent sibling cancel. Retained definitions are not leaked instances. |
| Interaction / accessibility | Native fallback; loading/error/repeated retry speech; keyboard/pointer; focus entry/restore; close veto; touch/zoom/reduced motion; disabled states. Actual VoiceOver/TalkBack review is distinct from DOM assertions. |
| Forms / editing | Pre-definition property replay; typing before/during/after activation; drafts/selection/composition; validation/submission/reset; no-JS semantics; autofill/history. Undefined form-associated hosts cannot replace an essential native control. |
| Content | Authored children/slots/mutations, selection, Find/hash/print/no-JS/AT discovery, existing windowing/collection contracts. |
| SSR / hydration | Scoped/global markup/profile agreement, DSD identity, pre-hydration typing/restoration/focus/selection, styles adopted once, streaming order and definition races, one owner. Absent optional SSR content has useful fallback. Server request/build rendering and client hydration reported separately. |
| Packaging | Exact packed public entries/types/CEM/API, literal imports/chunks, no workspace aliases, mixed eager/lazy imports, no barrel/catalog leakage. Inspect emitted requests and static totals. |
| Retention | Repeated mounting/activation/disposal node/listener/heap changes, retained/detached DOM, cache ownership and registry scaling. Old harness-reference findings are distinct from component leaks. |

Carry accepted desktop/physical reviews forward only where behavior is unchanged. Changed interaction gets focused new manual checks; unreported applicable acceptance remains open. Read relevant unresolved feedback before family merges: editor link dismissal, native color actions, authored selection, hydrated styling, phone controls and collection traversal may constrain these boundaries. Do not reopen unrelated accepted reviews.

## Performance and promotion protocol

1. Freeze matched reference/candidate builds per changed workload from accepted main. Audited base: `e85eb6b3`; record actual source/tree, exact lock/runtime/browser/harness/build/fixture/mode and artifact hashes. A retired integration dependency cache is not a performance environment.
2. Reuse valid machinery, not unlike historical numbers. Preserve Phase 0–6 and follow-up campaigns. Changed workload/harness/build needs a matching reference. Preserve `showcases/performance/baselines` (audited tree `d93747d9d7a2fd74be5ebdfcb56f29f9d94cef80`).
3. Predeclare family/profile/route numeric budgets: meaningful unused startup/bytes/DOM savings, maximum cold/throttled/prepared first use, repeat behavior and bounded retained growth. Reuse valid unchanged criteria. Do not transplant date thresholds universally or relax missed gates post-hoc. Usage probability is an assumption unless observed; do not fabricate adoption data.
4. Compare eager, deferred construction with identical code, cold optional code and explicit preparation where applicable. Include initial/first/repeat/never-used/abandoned preparation. Report preparation lead and unused traffic alongside action-to-ready. A head start is not free improvement.
5. Attribute fetch/evaluation, registration/upgrade, construction, hydration, style/layout, usable focus/readiness, critical path, supported long-task measures, requests and compressed/uncompressed bytes. Separate live/inert/detached nodes and browser requests versus graph totals. Report request/build-time SSR separately from client work.
6. Promoted claims require **at least 30 successful timing samples per configuration**, retaining all failed/aborted attempts. Use matched/interleaved cold/warm protocols with fresh contexts as intended; no pooling reruns or cherry-picked cells. Report n, median, p75, spread and uncertainty. Use p95 with at least 100 observations per cell or explicitly identify inadequate sampling.
7. Separate retention: **five fresh-context repetitions per selected arm, 100 lifecycle cycles per repetition**, cycle 10→100 nodes/listeners/heap and measurement limits. Distinguish intentionally cached definitions/code from instance refs. Unsupported heap collection is not zero.
8. Show requested/actual registry mode, native skips, browser/platform versions and accessibility evidence. Failure is not skip; inconclusive is not pass. Do not promote until required gates pass. No-change investigations can stop on deterministic evidence without a needless promotion campaign.
9. Serialize shared measurement resources. Active-system conditions are recorded; no automatic outlier/user-activity exclusion. Predeclare invalid-run rules and retain invalid samples. Combined runtime changes need relevant recapture; docs-only evidence transfer needs exact runtime/harness/build identity.

## Completion and handoff

API consistency is complete when discovery/profile/preparation is shipped, documented and qualified with eager compatibility. Library rollout is complete when every current tag/meaningful feature has a verified disposition, all selected eligible boundaries are implemented/accepted, and no unassessed/design/pending-acceptance rows are hidden. No-change is distinct from lazy implementation. Consumer adoption is complete only for routes passing their own gates.

Required implementation artifacts:

- Versioned complete inventory/evidence index, exact source coverage, rationale and reopening triggers.
- Frozen API/ownership spec, public recipes, generated metadata/types/exports checks.
- Focused runtime/test/docs commits; inherited decisions preserved or superseded by explicit new evidence.
- Per-wave packed production comparisons, immutable raw results, separate retention, targeted manual matrix and sortable report.
- Combined integration receipt, exact commits, eager rollback, limitations and truthful archive readiness.

Maintain the existing independent Progress Report at `http://127.0.0.1:4177/` using canonical state and lock. A worktree locator may be absent; read `/Users/westbrook/Documents/repos/design-system/.progress-report/project.json` or the established workspace `/Users/westbrook/.codex/visualizations/2026/09/08/01a0819f-e5d6-71a3-802e-6390c2c90ad3/design-system-progress`. Preserve feedback/other tasks; only the user marks reviewed. Report readiness does not authorize unrelated publication or messaging.
