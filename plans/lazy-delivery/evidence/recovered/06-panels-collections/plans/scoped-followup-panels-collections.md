# Panels and collections: bounded feasibility audit

Status: **no-go for a new lazy policy**. Keep current eager defaults and existing explicit collection APIs. No pilot selected; no runtime source changed.

## Exact boundary

- Base: `66386af7daac295cb2e178236d45289a9ebced4f`, local main at worktree creation; tree `6f0cd79db801f483dd40b51885742580c951b8a0`.
- Verified ancestor: Phase 6 seal `220d2dd3e4f55c6f2557d7e7fc593d5d16099bba`.
- Branch: `codex/scoped-followup-panels-collections`; worktree `/private/tmp/design-system-panels-collections`.
- Original dirty checkout stays on its original branch. Its starting status, tracked diff and index digests are in `baseline.json`. No stash, reset, merge, publication or deployment.
- Only this plan and `artifacts/scoped-followup-panels-collections/` are owned. Frozen Phase 0–6 files are enumerated in `frozen-before.json`. Historical series are context only, never this audit's control.
- Canonical report: the original ignored locator resolves to the independent report on port 4177. Updates take `data/.project.lock`, re-read current data, and alter only this task's records plus aggregate math/history. No duplicate report, feedback resolution or review acknowledgment.

## Sources and current ownership

Read the adoption plan, Phase 6 plan/results and public `SCOPED-REGISTRIES.md`, SSR contract, tabs/accordion/table/tree READMEs, collection migration plan, shared virtual-collection documentation, actual carousel/activity renderers, tree data/lazy/move controllers and the table accessibility review. Later sections in long-running READMEs supersede earlier historical exclusions; the current source is the implementation boundary.

| Surface | Authored versus generated | Existing contract; candidate limit |
| --- | --- | --- |
| Tabs | Application owns every panel descendant, IDs, links, fields and active operations. Library owns tab coordination and small wrappers. | Persistent panels; inactive panels remain mounted with `hidden`. Manual/automatic activation, tentative cancelable selection and author-write precedence. No body removal. |
| Accordion | Labels and body descendants remain authored nodes. Native generated trigger and its same-root panel relationship belong to the item. | Collapse hides the internal panel slot without destroying descendants. Trigger is essential and must stay ready. No deferred authored body. |
| Authored table | Entire native table/caption/rows/cells/links are consumer-owned light DOM. | `en-table` supplies scroll/sticky shell, never row removal. Printing removes clipping. No implicit virtualization. |
| Data table / primitives | Stable keyed records, selection/drafts are application state; adapters own valid native row wrappers, spacers and geometry. | Existing all/paginated/virtual modes; data-table defaults paginated. Pin active overlay records; focus holds include neighbors. Missing records are not made readable by ARIA indices. |
| Tree | Authored rich noninteractive labels retain nodes; data mode owns plain-label rows and nested semantic ancestors. | `virtualize` only affects data mode; full expanded rendering is default. `scrollToKey` never expands/selects/focuses. Move fieldset already mounts on request. Branch request lifetime is independent of row mounting; collapse/disconnect/source writes abort stale loads. |
| Carousel | Authored slide content retains nodes; data `renderItem` is application content inside keyed managed wrappers. | `controls=none` and `navigation=none` defaults already omit those generated interfaces. Data slides use existing windowing with focused-key retention; picker has a bounded contiguous range. List mode is paginated. Rotation stop/start is essential when enabled. |
| Activity | Authored slots and data-rendered body/actions are application content. Feed owns wrappers, optional generated buttons and one contextual status. | Authored/all content stays mounted; explicit virtual/paginated data modes. Requests use leases/cancellation; late responses cannot revive abandoned work. Keep loaded records, buffered updates and status context. |

Source usage is recorded in `usage.json`: literal opening tags in tracked `apps/docs/src` TypeScript/HTML/JS, excluding tests and frozen/generated archives. It includes source snippets and conditional render sites; counts are neither live simultaneous nodes nor user traffic. Field use and unused-visit frequency are unknown. The composer color tabs are inside an active editor extension session, making body eviction especially inappropriate. The main carousel demos explicitly request navigation controls, so those controls are intentional first-use affordances, not evidence of waste.

## Discovery contract and feasibility matrix

A new lazy policy must preserve all application-authored text, links, IDs, essential controls and no-JS reading paths. Existing hidden/windowed behavior is recorded as a baseline limitation, not permission to make it less discoverable. A rejected diagnostic is not a shipping recipe.

| Behavior | Concrete requirement before adoption | Current boundary / test |
| --- | --- | --- |
| Browser Find | Authored searchable content must already participate in browser search, or an actually observed supported browser reveal must expose it with coherent selection/expansion. | Search of visible text, hidden tabs/disclosures, authored slides/history, inert template and native until-found control. `window.find` is an automated proxy, not browser Find UI. No activation-on-search claim. |
| Deep links/hash | An authored ID remains connected; initial and later fragment navigation reveal the right content without losing draft/focus or guessing the target's owner. | Real `location.hash` navigation; no synthetic `beforematch`. A hash existing in the URL does not establish that content became visible. |
| Printing | Complete promised reading content must exist before print; print CSS alone cannot reconstruct missing records. Preserve a full-content/explicit page print route. | Print-media emulation records visibility. Physical print, browser print dialog and full-dataset export remain unreported. |
| Accessibility reading | Preserve semantic names, relationships, order, status and navigable reading content. Native OS tree and actual AT traversal must be reviewed for changed behavior. | DOM-derived Playwright ARIA snapshots are supporting evidence only. No new speech/browse-cursor acceptance claimed. |
| Keyboard / selection | Native keyboard actions, canceled/authoritative selection, stable item keys, focused DOM and text selection survive first/repeat presentation. Mount destination before focus; never repurpose a focused node for another record. | Tabs, disclosure draft identity, tree Move open/cancel, carousel focused keyed draft. Broader active-operation/anchor tests become mandatory if a policy changes mounting. |
| No JS / SSR | Server-authored text and usable native content must survive blocked/failed JS. Stable IDs/snapshots and exact template shape; hydrate existing native input rather than replace it. | Packed global DSD fixture, JS-disabled reading and explicit hydration after native input editing. Scoped lazy hydration is not claimed by this global fixture. |
| Failure / lifetime | Essential shell works on permanent delivery failure. Separate load/registration/render readiness, cancel stale focus/mount intent, dispose references without deleting application DOM. | No async boundary selected yet. Slow/failed code, disposal and request races are therefore not qualified for a new policy; never infer them from successful eager checks. |

The [HTML hidden/ancestor-reveal contract](https://html.spec.whatwg.org/multipage/interaction.html#the-hidden-attribute) provides reveal behavior for content that is already present in a qualifying hidden-until-found subtree. It does not create arbitrary omitted text. The current tab panel's `display:none!important` rule and parent hidden-state reconciliation are not such a policy. Moving bodies to a template loses ordinary search/fragment/reading access and still stores inert nodes. A native until-found control is a diagnostic comparison, not a supported tab/tree API.

## Candidate selection and stop rules

`protocol.json` predates census. A potential pilot must be generated-only or fully preserve authored discovery, have a concrete often-unused consumer, and plausibly remove at least 100 generated nodes per unused instance or 4,096 marginal gzip bytes. These are audit screening thresholds, not a relaxation of production acceptance. Rank by removable unused cost and demonstrated usage, never raw authored tag count. No field telemetry is available; do not invent a hit rate.

A promotion requires its own predeclared matched current-base/candidate budgets, at least 30 successful samples per configuration and separate repeated retention runs. Report unused/first/repeat, native/fallback and cold/warm independently, all raw failures, exact source/packages/assets, connected/detached/inert nodes and uncertainty. A smaller connected tree alone fails acceptance. No timing/retention campaign is warranted for a candidate already rejected on semantics or absent unused structure.

## Independent acceptance constraint

`virtual-table-voiceover-traversal` remains open: the user observed Safari and Chrome skipping/reversing rows after several scroll windows and select/deselect, with both directional commands then moving backward. `feedback-collection-duplicate-choice-label` and `feedback-collection-voiceover-row-boundary` also remain open. A DOM order/focus/ARIA snapshot pass must never close these. Compare the same sequence in Paginated mode when investigating; do not assert that pagination fixes it. This task does not change row mounting/structure and does not reopen accepted Phase 5/6 date manual review.

## Verification and review

Artifacts contain executable packed fixtures, source usage inventory, raw observations and failures, declared screening gates, sortable `en-table` comparisons and a final decision receipt. Runtime changes, timing promotion, actual AT speech, physical devices and browser-native Find/print UI are separate coverage claims. Review this audit through the existing canonical report; reviewing the card does not imply adoption or merge permission.

## Measured ranking and final keep/reject decision

All node totals include text, comments and open shadow roots. One functional census per configuration is not a timing sample. Counts below agree across all six current-base configurations at a 1200 × 900 viewport with reduced motion. Exact per-configuration counts and first/repeat snapshots remain in raw JSON and the sortable comparison.

| Priority | Candidate | Unused opportunity / actual use evidence | Decision |
| --- | --- | --- | --- |
| 1 | Activity generated hidden buttons | 38 connected nodes: two 19-node buttons in either idle authored mode (updates/load-more) or idle data mode (updates/cancel). Data load-more remains visible. Six source occurrences; no unused-visit rate. | Reject new policy: below 100-node gate; existing button dependency needed by visible actions. Preserve contextual status and loaded history. |
| 2 | Carousel hidden rotation control | 19 connected nodes when autoplay is off. Eleven source occurrences; autoplay is opt-in and its stop control is essential when on. | Reject: below node gate, no independently removable code proven. |
| 3 | Tree Move interface | Idle move/status shell 7 nodes; opened 242, +235. Expensive fieldset/options already absent until `openMove`/Alt+M. Eight source occurrences; no separate usage rate. | Keep existing on-demand API. Status shell is not a worthwhile new async boundary. Never unload during dragging, keyboard move or branch loading. |
| 4 | Carousel requested controls/picker | Default navigation/control interfaces absent. Explicitly enabling them adds 442 nodes for 40 authored slides, 225 for the bounded data example. | Keep current opt-ins; reject extra lazy gate for controls the consumer explicitly requested. These active navigation controls are not an unused default cost. |
| 5 | Inactive tab/disclosure bodies | Example whole tabs 42 nodes; accordion 61. Real body cost is entirely workload-dependent; composer tabs hold an active editor color session. | Reject body deferral: authored ownership, drafts and incomplete discovery contract. Wrapper/tag counts do not estimate removable bodies. |
| 6 | Table/tree/carousel/activity records | Example totals 463 authored table, 1,225 tree, 637 authored carousel, 1,307 authored activity; mostly meaningful content. | Reject blanket lazy/windowing policy. Use existing explicit all/paginated/virtual/list APIs when the application supplies the required reading/search/print alternatives. Keep table VoiceOver constraint open. |

This is a priority ranking for **new safe unused-work reduction**, not a ranking of component size. There is no candidate runtime delta and no claimed marginal gzip saving. The combined fixture payload and SSR catalog bootstrap are measurement apparatus, not a production route baseline. A multi-instance page could multiply the small control counts, but no concrete often-unused workload is established here; that would require a separately scoped matched experiment.

## Observed behavior and limits

- Chromium 153.0.8010.12: auto uses native scoped registry; explicit global stays global. Firefox 155.0: auto uses real global fallback. WebKit 26.6: auto uses scoped registry. Automated WebKit is not retail Safari qualification.
- Visible/table/activity authored text is found through `window.find`; inactive tab/disclosure and template text are not. Offscreen authored carousel slide text is not found in Chromium/Firefox but is found in WebKit. This is a current baseline difference, not introduced or fixed here.
- Real fragment navigation to inactive tab/disclosure content leaves it hidden; the inert template target is absent from document lookup. Table target is visible. Independently reset native `hidden=until-found` reveals on hash navigation with a browser-generated trusted `beforematch` in all three tested engines. This proves that native control only; it does not qualify a tabs/accordion policy or promise native browser Find UI behavior.
- Print-media emulation keeps inactive tab/disclosure content hidden, while the table and authored slide target have visible layout. Template content is absent. This is not a physical print or full print-output review.
- JS-disabled global DSD retains authored hidden text in HTML, displays the current panel/native input and native table link, and leaves the inactive panel hidden. No complete no-JS tab/disclosure navigation is claimed. Explicit hydration retains the edited input node, value and text selection; normal tab activation then reveals the inactive content.
- Tabs preserve input identity/draft/selection through switching and veto; accordion preserves draft/node identity across close/reopen. Tree Move opens/cancels without committing a reorder; the carousel retains the focused keyed input after navigation. These checks do not establish OS accessibility reading, complete anchor stability, drag, IME, device gestures or active-operation acceptance for a changed policy.
- Instrument-owned fixture trees contain zero detached nodes. The counterexample template has one connected template host and four inert-content nodes. Hidden/inert attribute states do not make connected nodes disappear; the census reports all connected descendants. Unknown unreachable detached DOM/heap are **not measured**, not zero.
- No candidate first-use/repeat latency, cold/warm distribution, retained-heap study, canceled/failed code delivery or scoped hydration campaign ran. They remain unperformed because no new boundary survived screening. Timing samples: 0; separate retention runs: 0. This explicitly forbids promotion from these results.

## Revisit trigger and production gate

Revisit only with a named consumer that leaves a substantial generated surface unused, or a designed content-discovery contract with observed native Find, initial/deferred hash navigation, full promised print content, no-JS reading and actual AT evidence. Do not use hypothetical search events or template storage to claim content is discoverable. First establish the same source/record workload, then declare numeric unused/first/repeat/retention budgets before judging a candidate.

Any future selected boundary must preserve real owner registry/creation scope, explicit global fallback, two-instance containment, eager rollback, authored descendants and matching SSR/hydration. Qualify readiness, permanent failure and retry limits, cancellation during each async phase, authoritative selection changes, disposal/adoption, focused/recycled record identity, scroll anchor, pinning and active operations. A new collection mounting strategy specifically triggers targeted review of the existing VoiceOver defect; automated success cannot substitute. Preserve all accepted unrelated manual review.

Recommendation is ready for focused review, **not user-approved**. No new public API, default, optional chunk, scanner, offscreen unloading, merge or deployment is proposed.
