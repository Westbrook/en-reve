# Validation efficiency audit and implementation plan

Prepared September 30, 2026. Status: plan ready for review. No test policy, configuration, assertions, sample counts, AGENTS rules, or active validation runs were changed.

The largest opportunity is to make validation a dependency-driven process with cheap failures first, shared preparation, and explicit reasons for expensive confirmation. The project already has valuable caching, bounded concurrency, and coverage safeguards. The remaining cost comes from two overlapping orchestration systems, late cheap checks, lengthy browser journeys, broad dependency identities, and confirmation protocols whose cost needs to be justified before acquisition.

The recommendation is to improve scheduling and eliminate proven duplicate work first, then tune the expensive coverage and measurement protocols using evidence. Fewer tests is not the success criterion. Earlier useful failures, shorter end-to-end completion, reliable failure detection, and complete required coverage are.

## What the large counts mean

| Quantity | What it actually represents | Consequence for this plan |
| --- | --- | --- |
| 5,050 jobs | A separate API performance confirmation: five arms × five configurations × two requested modes × 100 timing observations = 5,000, plus 50 retention jobs, each exercising 100 cycles | These are repeated observations, not 5,050 distinct tests or fresh installations. Optimize the experiment design and acquisition overhead separately from correctness. |
| 6,510 preceding jobs | The full C4 campaign: 21 arms × five configurations × two modes × 30 timing observations = 6,300, plus 210 retention jobs | Repeating a large confirmation can dominate the work even when preparation is already reused. |
| 75 stages | The lazy-delivery worktree's integration catalog, with commands that expand into many checks | It is a separate orchestration layer from the root correctness union. Deduplication must cross that boundary. |
| 281 correctness tasks | Current dirty root: 150 Node tasks, 71 Playwright configurations, 22 producers, two barriers, five explicit type commands, and 31 other checks/attestation tasks | Counts are orchestration units, not assertion counts. A browser configuration can contain thousands of executions. |
| 360 full inventory tasks | Current root correctness plus specialized families; 48 pathways and 26 public command views | Historical recipes, manual obligations, and active tasks must remain distinguishable. A full correctness pass is not every possible validation obligation. |

The 5,050-job confirmation took **89 minutes 45 seconds**. Its fixtures were already prepared. The preceding full campaign took about **156 minutes 8 seconds**. The confirmation still ended with two uncertain API comparisons; more sampling did not resolve every decision. These records do not establish an isolated-host runtime comparison or authorize another confirmation.

In the observed 75-stage integration receipt, a **0.489-second registry type check started about 39 minutes after the run began**. Several dependency-free unit checks were also near the end. That is avoidable latency to negative feedback, regardless of the ultimate full-suite runtime.

Sources and exact count boundaries: [inventory receipt](validation-efficiency-2026-09-30/inventory.json), [execution audit](validation-efficiency-2026-09-30/execution.md), [campaign and integration audit](validation-efficiency-2026-09-30/campaigns.md), [campaign count and timing receipt](validation-efficiency-2026-09-30/campaign-counts.json).

## Audit scope and evidence limits

This is a source, configuration, policy, and retained-receipt audit. It covers the current shared root at HEAD `6d09b31cf43523ac8c75352208ab9697b62e2673` with substantial existing modifications, and the separate lazy-delivery integration sources associated with candidate `5279750a86cbb140376cac65ad18dee5296694ee`. Neither is treated as the other's tested source. The active integration run was only read; its completion was not required to prepare this plan.

The root inventory identifies 103 package lifecycle commands, 27 manifests/installations, 333 assertion-source files, 14 consumer type fixtures, six maintained tsconfigs, 185 custom/helper entries, and 341 documented recipe lines. Of those custom entries, 84 are bound to executable obligations, 97 are historical, and four are manual. Manifests include workspace members and fixtures; **27 does not mean 27 independent required clean installs**. Sources under generated outputs, artifacts, vendor trees, old runs, and baselines are excluded from ordinary test counts. Relevant artifact-owned integration checks were examined separately.

No tests, builds, installs, browser test discovery, timed campaigns, or validation leases were started for this audit. Existing evidence is labeled by its original cohort. This review does not claim that every individual assertion has already been proved necessary or redundant; the implementation plan below includes that obligation-by-obligation assessment.

### Surfaces examined and required disposition

| Surface | Current owners and examples | Planned disposition |
| --- | --- | --- |
| Public gates and package lifecycles | Root/workspace scripts; `tooling/testing/{public-views,pathways,comprehensive,run-comprehensive}.mjs`; npm prebuild/build hooks | One expanded execution plan per change, with aliases and hidden lifecycle calls visible |
| Integration and smoke | Separate worktree `tooling/integration-gates/{catalog,runner,run}.mjs`; selected stage and nested receipts | Preserve exact-candidate acceptance as a view of shared obligations, rather than a second independent schedule |
| Source, consumer and test types | Package compilation, styles check, metadata type snapshot, consumer fixtures, test/config transformation | Separate semantic checking from snapshot freshness; fill missing test-source type ownership |
| Node and Python assertions | Packages, tooling, docs core, probes, reader, budget-analysis tests | Run pure checks early; maintain process isolation and explicit preparation for impure checks |
| Generated contracts and static verification | CEM, API graph, lazy manifests, CSS adapters, customization, releases, frozen/source/output checks | Distinguish before-regeneration freshness, generation, output validation, and final integrity |
| Browser correctness | 71 root Playwright configs, docs/theme/mobile, component/probe/framework/SSR suites | Group compatible services and workers; preserve exact engine, delivery, viewport, behavior and capability differences |
| Custom browser verifiers | Sticker sheet, candidate imports/assets, typography, slider, swatch, highlighting, registration, portability, report reader | Give each explicit ownership, resources, dependencies, and coverage; remove duplicated transport/setup where proven |
| Installation and packaging | Root workspace, isolated framework majors, showcases, npm packing/native consumption | Reuse verified setup in edit loops; retain real clean-install and tarball-consumption acceptance lanes |
| Performance and retention | Native lab, registry/lazy/activation, date, production/hydration studies and current lazy delivery | Functional checks first; predeclared decision and sample policy; isolated fresh acquisitions only when applicable |
| Manual confirmation | Screen readers, speech, real IME/autofill, physical devices, subjective visual acceptance | Ask humans only for evidence automation cannot provide or an explicit acceptance decision |
| Operational triggers and reviews | AGENTS, README recipes, plans, report checkpoints, CI template, hooks and execution handoffs | Make active/template/historical status explicit; automate routine admission and record queue/review cost |

The inspection found no active `.github` workflow or configured hook path in this checkout; the performance CI YAML is a template. The existing inventory scans selected source roots and README/protocol recipes, so root rules, hooks, task settings, plan requirements and artifact-owned executable gates need an additional non-executing activation index. **Do not activate CI or historical recipes merely to inventory them.**

## Existing optimizations to preserve

The centralized runner already deduplicates matching task IDs, batches Node files, uses a total correctness worker budget of three, shares an owned docs server, and permits tightly verified same-invocation browser references. Docs preparation, type snapshots, packing and example compilation have content-verified reuse. Framework cohorts already install with bounded concurrency. Identity collection shares file digests within a phase, and leases prevent cooperating worktrees from colliding.

Some attractive ideas were already tested and rejected: the persistent SSR minifier cache cost about as much to verify as rebuilding, so the current fixture is fresh once per owned server and shared across engines. Increasing reader sorting groups from six to nine did not improve the screened total command time. Collector acknowledgement did not establish measurement equivalence, so fixed waits remain the accepted default. This plan does not repeat those experiments without a new reason. See [retained runtime implementation evidence](test-runtime-reduction-2026-09-25.md).

## Evidence that determines priority

The retained September 26 Current correctness run took **6,118 seconds, about 102 minutes**, with the then-current 280-task graph. It is ordinary correctness evidence, not a fresh benchmark of today's sources.

| Observed work | Retained cost | Interpretation |
| --- | ---: | --- |
| Main docs browser configuration | 1,444.899 s | Largest individual correctness command; inspect repeated page journeys and matrix ownership first |
| Exhaustive report reader | 783.508 s | Large browser interaction workload; separate sorting algorithm invariants from integration facets before considering reductions |
| Candidate import verification | 399.520 s | Audit repeated candidate setup, focus checks, navigation and assertion ownership |
| Theme refresh | 311.690 s | Preserve meaningful rendering differences; measure repeated setup versus useful coverage |
| All actual Playwright commands | 4,705.376 s summed | Browser execution dominates; command totals are not independent projected savings |
| Browser discovery and rediscovery | About 20.65 s summed | Worth simplifying, but much smaller than long journeys |
| Five explicit type commands | Roughly 0.05–0.41 s each, beginning around 128 s into the run | Move them to their minimum prerequisite boundary |

The current 5,050-job campaign spent approximately 4,923 seconds inside recorded job intervals and another 461 seconds outside them. That remainder includes teardown/between-job and pre/postflight work; it is **not yet a measured browser-startup total**. Its earlier preparation subcommands totaled about 70 seconds, including about six seconds of installations. Reusing installations alone cannot remove the campaign's hours.

The broad runner's producer barrier is visible at [run-comprehensive.mjs](../tooling/testing/run-comprehensive.mjs#L101); services start before cheap assertions, browser discovery and configuration execution are serial. Its coarse prerequisite defaults are in [comprehensive.mjs](../tooling/testing/comprehensive.mjs#L50). The integration runner also executes its catalog serially, mixes Node and browser work, and forces owned per-configuration servers. Specific repeated Node sources exist across its transactions/delivery and tooling/theme stages. Detailed evidence, source locations and uncertainty are in the four appendices.

## Desired work cadence

| Point in the work | Run and retain | Avoid paying for yet |
| --- | --- | --- |
| Before editing | Read prior evidence and unresolved failures; identify affected contracts, minimum prerequisites, required matrix and final acceptance obligations | Blanket reinstall, broad suite, or performance campaign simply to establish activity |
| During a small edit | Relevant source/config types and pure checks; owning compiler output if declarations are required; focused regression | Docs/framework production, unrelated browser configurations, full confirmation |
| After a coherent behavior change | Affected contract and browser journeys, including implicated engines/modes; fast cross-family checks for shared primitives | Repeating public gates whose obligations are already selected in the same run |
| Before final integration | One settled-candidate union of all required correctness obligations, explicit freshness and source-integrity boundaries | An automatic second full pass solely because a report or handoff was written |
| Packaging/toolchain/installation changes | Required clean-install, packing, consumer and runtime compatibility lanes on isolated installations | Reinstalling every unchanged environment for each source edit |
| Performance-sensitive acceptance | Functional qualification and benefit/regression preconditions, then the predeclared relevant campaign | Timed acquisition before cheap failures and necessary benefit checks are resolved |
| Human review | Small exact-version requests for genuine device, speech, IME or design judgments | Re-asking deterministic interactions already covered by valid automation |

Final acceptance still needs every required obligation on applicable inputs. Until dependency closure and receipt applicability are implemented, keep the current complete final gate; a proposed targeted policy must not silently replace it.

## Implementation work packages

The order below is deliberate. Start with scheduling fixes that preserve coverage, then unify execution ownership, then optimize expensive families. Effort is relative, not a duration estimate.

| ID | Priority and effort | Outcome and primary owner | Depends on |
| --- | --- | --- | --- |
| V1 | P0 small | Validation telemetry and complete obligation/trigger inventory — test infrastructure | None |
| V2 | P0 medium | Cheap checks and real semantic types at the earliest valid point — infrastructure and package owners | V1 |
| V3 | P1 large | One obligation graph for public, comprehensive and integration gates — infrastructure | V1; adopt V2 ordering |
| V4 | P1 medium | Owned environment sessions and safe setup reuse — infrastructure and fixture owners | V1; integrate with V3 |
| V5 | P1 large | Resource-aware scheduling and browser cohorts — infrastructure | V3, V4 |
| V6 | P1 medium per family | Useful coverage and long-journey reduction — docs, components, reader and themes | V1; V3 for shared ownership |
| V7 | P1 medium | Bounded performance and confirmation lifecycle — performance owners | V1; functional gates from V2 |
| V8 | P2 medium | Precise invalidation and candidate evidence applicability — infrastructure and metadata | V3, V4 |
| V9 | P0 small then ongoing | AGENTS/docs/work-process rules and automatic admission — project maintainers | Initial clarification now; command changes follow their implementation |
| V10 | P1 medium | Qualify and roll out the combined changes without a second uncontrolled campaign — coordinator | Relevant preceding packages |

### V1 Record useful cost and coverage

Extend the existing manifest and receipts rather than adding another runner. Every obligation should identify its purpose, risk/contract, assertion owner, source/test/config inputs, required artifacts, compiler/browser/fixture matrix, isolation requirements, resource needs, known overlap, original gate aliases, and acceptance tier. Record unknown edges explicitly. Inventory npm pre/post hooks, embedded builds/checks and artifact-owned integration tools.

Add timings for queue/lease wait, fingerprinting, installation, generation, compilation, server readiness, browser launch/context setup, discovery, assertions, reporting and cleanup. Measure time to the first useful failure, peak process-tree resources where supported, executed versus referenced obligations, and cache hit/miss reasons. Current maximum-child RSS must not be relabeled as aggregate peak memory.

Produce a reviewable schedule before execution, including critical prerequisites, expected workload, sample expansion and final obligations. This should expose a 5,050-job confirmation before it starts. A command's presence in a README is never authorization to execute it.

Acceptance: reconcile existing commands and selected case/facet counts without omissions; expose deliberate count discrepancies and unknown ownership; generate plans without installing/building or starting browsers. Instrumentation overhead itself gets a budget.

### V2 Move negative feedback ahead of expensive work

Remove the “all producers, then all checks” barrier where dependencies do not require it. Correct broad `build` dependencies for pure tooling/docs tests and minimum-package consumers. In the integration catalog, move dependency-free orchestration/diagnostic/date-fixture checks first and run registry types immediately after required declarations, before browser stages.

Create explicit production, test/config/tooling, and consumer semantic type obligations. Root `check:types` checks the public API snapshot; it does not provide general source semantic checking. The inventory explicitly reports that there is no complete test-source typecheck. Node type stripping and Playwright transformation are execution facilities, not substitutes for it.

Use owning compiler results to provide both type evidence and required output when possible. Do not automatically run full `tsc --noEmit` followed by the same full emit. Establish separate configs for different runtime environments and an explicit baseline for pre-existing test diagnostics. Preserve stronger flags, such as breadcrumbs' unused-local/parameter checks, when consolidating consumer invocations. Separate pure styles checks from unnecessary regeneration. Give repeated lazy-manifest generation one producer owner.

Acceptance: deliberate semantic errors in production, a test, a Playwright config and a consumer must each fail their owning gate. A failing dependency-free assertion must be reported before docs SSR/Vite/framework preparation or browser launch. Minimum-declaration-dependent types must run directly after their producer. Record cold and warm time to these failures and verify that blocked descendants never start.

### V3 Unify the two correctness orchestration systems

Map each integration stage to canonical tasks and coverage facets from `tooling/testing`, adding integration-only obligations where needed. Preserve exact clean-commit checks, frozen-source protection, child receipt requirements, manual limits, source stability and final acceptance semantics. Make integration a selection and attestation layer, with one resource owner and one execution journal.

The repeated Node sources identified in the integration catalog are candidates for one execution with several gate references. Nested public commands must join the parent's selected task set rather than independently re-expand it. Public commands must continue to work standalone with their documented prerequisites and argument behavior.

Resolve repeated CEM/type/lazy/customization checks by phase and input generation. Initial retained-artifact freshness and final mutation detection are distinct from validating a newly generated file; neither can be removed merely because they read the same files. Compare `check:delivery` and final delivery checking before merging their work: retain separate context-specific assertions while sharing identical inspection.

Acceptance: an old-to-new obligation crosswalk accounts for every required integration stage, matrix cell, outcome, intentional skip, and child receipt. Each equivalent obligation executes once per invocation. Wrong-candidate, stale-metadata, missing-report, omitted-cell and failed-cleanup controls still fail. Standalone API still detects stale retained metadata before regeneration.

### V4 Keep useful environments alive

Separate three lifetimes: immutable dependency/build preparation; owned serving/browser infrastructure; isolated test state. A fresh evidence directory should create new receipts, not force disposal of all useful setup.

Keep one owner-managed environment per compatible source/build/runtime/server key until its last consumer completes. Start services just in time. Share built-docs serving across public and integration views. Reuse browser processes only for compatible correctness projects, keeping fresh browser contexts/pages, storage and fixture state per test as required. Registry/minification/module-global tests retain their stronger process boundary.

For framework cohorts, reuse verified installations when lockfiles, package-manager/runtime/platform/install flags and installed contents match. Keep framework major versions isolated and retain a genuine clean-install lane. Adopt installation reuse only if verification is cheaper than reconstruction; the retained framework install took only about 2.6 seconds, so this is not an assumed major saving. Maintain actual npm archives and isolated consumer extraction; a workspace symlink is not packing evidence. Introduce one verified docs preparation handle across prebuild, SSR and Vite entry points so a single build does not repeatedly fingerprint the same prepared generation.

Acceptance: log service starts/stops and prepared generations; compatible consumers share one service; ports remain dynamically owned; stale/unrelated listeners cannot be adopted. Corrupt or incomplete setup regenerates or fails safely. Cancellation releases only owned children and leases. Normal edit loops reuse setup, while the explicit clean lane proves a truly fresh install.

### V5 Schedule independent work within a measured budget

Implement a ready-task scheduler with explicit dependency, read/write-artifact, port, CPU/memory and isolation constraints. Pure checks should not wait behind unrelated work. Concurrent producers must not mutate outputs another task is reading. Use a single total worker budget across Node, browser and nested custom tools, rather than multiplying each command's worker default.

Start with the current proven budget of three. Measure alternative budgets on representative short, long and resource-heavy correctness families before changing it. Evaluate grouping compatible browser configurations into one Playwright invocation or a small number of cohorts to reduce service and process startup. Verify actual worker/browser reuse: a shared invocation does not guarantee reuse across projects or worker-scoped fixtures, and grouping is not a prerequisite for the scheduler rollout. Preserve each project's settings, hooks, retries, trace policy and fixture contracts; never flatten configurations by name alone. Schedule long independent groups early enough to avoid a serialized tail, while keeping cheap high-yield failures first.

Discovery can use one bounded resolved selection per configuration; the historical rediscovery cost is small, so do not delay the larger changes for it. Retain complete failure traces and diagnostic reporting, but avoid rebuilding/restarting solely to render another report.

Acceptance: no exceeded worker/resource budget, output collision, inter-test state leakage or leaked processes in success/failure/cancellation. The same required facets and failure sensitivity survive. Whole-command median/tail runtime and resource use improve under matched conditions. Timed campaigns remain outside correctness concurrency.

### V6 Prove that coverage is useful and remove demonstrated redundancy

Review families in measured cost order: main docs journeys, reader, candidate import/focus, theme refresh, then smaller component/probe/custom suites. For each case or generated facet, state the failure it detects and why its layer and environment are needed. Map unit algorithms, component contracts, packaged/native/SSR integration, composed docs workflows, accessibility and performance as separate responsibilities.

Classify overlap as exact duplicate, subsumed by a stronger equivalent check, intentionally different environment, or unresolved. Matching titles/source files are insufficient: assertions, compiler flags, browser policies, fixtures, preconditions, transitions and outputs must match. Verify representative removed/subsumed assertions using seeded real defects or focused mutation controls where worthwhile. Do not build a costly whole-repository mutation campaign by default.

For docs, inspect repeated navigation, large page setup, per-element round trips, axe scans and long multi-step journeys. Batch read-only observations when semantics remain identical; use purpose-built fixtures for component invariants while retaining assembled workflow checks. Review the large theme/showcase/calendar families first. For the reader, keep exhaustive algorithm/data correctness at a cheap layer and propose a clearly justified browser integration matrix; any move of existing browser facets requires a coverage decision, not silent sampling.

Audit fixed sleeps, `networkidle`, retries, polling and oversized timeouts individually. Replace readiness sleeps with observable conditions only where the wait is incidental. Preserve deliberate debounce, animation, retention and measurement windows. Split long monolithic tests when balanced independent work helps; keep indivisible user journeys together. Do not loosen deadlines or add retries to conceal contention or flakiness.

Acceptance: every changed family has a before/after coverage map, complete required engine/fixture behavior, representative failure detection, and a measured cost comparison. Unexplained flakes remain visible. Capability skips retain their reason. Automated accessibility remains separate from actual assistive-technology evidence.

### V7 Bound performance confirmation before running it

A campaign should begin with an explicit decision: the claim, benefit/regression budgets, relevant feature arms and engine/profile/cache cells, estimand, confidence/error policy, sample/retention requirements, stopping rule and maximum confirmation cost. Run functional qualification and cheap necessary benefit checks first. A rejected necessary benefit can stop a candidate before unrelated full acquisition, with remaining gates honestly unfulfilled.

Separate exploratory diagnostics, functional qualification, performance measurement, and confirmation. Review the assumption that every inconclusive result needs every arm and every retention job again. A future predeclared family- or endpoint-specific confirmation may be valid if it preserves the statistical claim, comparison baselines and family error control. Plan sample sizes from justified precision and variance assumptions; consider a valid sequential design only as a separately qualified protocol. **Do not retroactively pool, trim, selectively replace, or repeatedly resample existing campaigns until green.**

Decompose the 461-second remainder outside recorded job intervals before changing browser reuse. Fresh contexts are not necessarily equivalent to fresh browser processes for cold/warm timing or retention. Any launch/session reuse, collector change, order/blocking policy or parallel measurement changes the experiment and needs new equivalence qualification. Do not repeat full retention work merely because a timing endpoint needs more precision unless that is required by the frozen protocol.

Keep acquisition serial on the measured host; unrelated builds, browsers and heavy hashing stay outside it. Bounded analysis/report generation can run later or on separate resources. Preserve active-desktop versus isolated-host interpretation and all valid slow samples. The current C4 unresolved comparisons and its stop rule are unchanged by this proposal.

Acceptance: plan output predicts expanded job count and cost, preparation is reused safely, campaign stop rules are executable, and a statistically reviewed prospective protocol preserves claimed confidence. Report reductions as measured setup/acquisition/analysis savings separately; no aggregate speedup is assumed.

### V8 Make invalidation and final evidence precise

Narrow preparation keys only after discovering complete dependencies: imports, generated assets, fixtures, options, runtime/tool versions, environment inputs, and failed module-resolution probes. Current docs/type preparation includes broad tooling/plans/dependency trees; unrelated edits can trigger work. Keep content hashes and added/deleted/untracked-file detection. Timestamps alone cannot establish identity.

Extend phase-local digest sharing and generation handles before attempting persistent passing-test reuse. Add regression controls for changed source, new/deleted inputs, corrupted output, altered compiler/browser settings, stale process owners and changed semantic environment variables.

Later, allow an applicability record to explain which prior evidence covers unchanged obligations on a successor candidate. Keep original execution provenance and distinguish direct execution from verified applicability. A documentation-only commit should not automatically demand every test again once non-impact is proved; a changed shared primitive should invalidate its full dependent closure. Persistent result reuse and automatic changed-only selection remain disabled until those edges are complete. Preserve exact-candidate integration requirements until a reviewed replacement exists.

Acceptance: known relevant edits invalidate every dependent obligation; irrelevant edits avoid only proven unnecessary work; unknown dependencies fall back to broader validation. Report-only changes cannot silently invalidate or relabel old execution. Failed or interrupted receipts never become passing cache hits.

### V9 Improve rules and reduce avoidable confirmation cycles

Make `tooling/testing/README.md` the authoritative day-to-day validation guide. Reconcile `tooling/test-pipeline/README.md`, docs tests, metadata, CSS authoring, release and performance guides. Label provisioning, clean-install proof, ordinary correctness, specialized qualification and historical reproduction. Clarify that “serial capture” applies to conflicting or timed acquisitions, not all independent correctness tasks. Preserve standalone docs' existing build-precondition contract.

Use automatic resource/dependency admission for already authorized reversible validation. A lease is coordination, not a request for a person to approve every subcommand. Source review cards record review; they do not inherently block execution. Retain actual user-imposed approval boundaries, reviewed baseline/protocol decisions, irreversible actions and human-only acceptance. Batch related review items and carry forward unchanged accepted evidence. Measure queue wait, review dwell and recovery time separately from tool execution.

Proposed additions to AGENTS.md, to apply with the supported command/documentation changes:

> Plan validation before implementation using the current execution guide, package contracts and `test:plan`/`test:inventory`. Record affected obligations, minimum prerequisites, environments and final acceptance tier in the Progress Report.
>
> During editing, run the cheapest relevant negative checks first: source/config/test/consumer types and pure checks, then focused behavior tests after their minimum prerequisites. API type-snapshot freshness is separate from semantic type checking. Reuse the owning compiler result when it proves the same contract.
>
> Select overlapping required gates in one supported union. Preserve distinct browser, fixture, delivery and compiler-option coverage. Stop descendants of failed prerequisites; retain independent results and failure evidence. After a fix, rerun failed and affected obligations, then complete the required final selection on the settled candidate.
>
> Reuse verified installations, prepared artifacts, owned servers and compatible browser processes. Fresh execution output does not require discarding setup. Schedule independent correctness work within one measured resource budget; serialize actual dependency and resource conflicts.
>
> Do not repeat a completed broad gate without a relevant input change, unresolved obligation, or a required distinct acceptance environment. Focused passes remain subset evidence. Do not claim inherited evidence applies to changed inputs until dependency applicability has been established.
>
> A retained-artifact freshness check runs before anything that can regenerate those artifacts. Intentional regeneration and validation of its new output are separate steps; preserve the original freshness outcome.
>
> Complete functional qualification before timed campaigns. Predeclare their decision, matrix, sample and stopping policy; keep them isolated from correctness/build activity. Request manual confirmation for human-only evidence or explicit acceptance, and preserve prior valid confirmations.
>
> Use automatic ownership admission for routine authorized validation; do not introduce a human approval step for each stage. Preserve explicit user approval requirements, ownership leases, release rules and evidence integrity.

Full source-linked wording and downstream file changes are in the [policy audit](validation-efficiency-2026-09-30/policy.md). This plan does not introduce unsupported command names into AGENTS or remove its current gates prematurely.

### V10 Qualify the optimization without recreating the problem

Implement in small reviewable changes. Use deterministic scheduler, selection, invalidation, failure and cleanup controls first; then one affected real-browser qualification. Capture unchanged baseline receipts and compare exact case/facet obligations. Do not run the full 75-stage and full union independently after every small runner edit.

After the combined candidate is stable, execute one canonical complete acceptance selection with required runtime/install matrix obligations. Any temporary migration comparison between old and new runners should be explicit, bounded and retired once parity is established. Measure representative cold and warm whole commands with an alternating baseline/candidate design appropriate to the claim; use retained measurements to select targets, not as today's counterfactual.

Ship a clear change-risk-to-lane guide and generated plan output. Follow-up performance thresholds should be agreed from the measured baseline, covering time to first negative, complete success time, setup churn, resource peaks, flaky outcome rate and coverage. Do not promise an unsupported percentage or convert test count into a target.

## First implementation slice

The first slice should deliver V1's obligation crosswalk and timing fields, V2's cheap-first dependency correction in both runners, and V9's clarified cadence. Prove that the currently late registry/consumer types and pure checks run before browser work. Preserve all required assertions, worker limits and current performance protocols. This gives immediate useful feedback and creates the evidence needed to select the next slice.

Next, migrate integration stages onto the canonical graph and shared session ownership before tuning worker counts. In parallel, family owners can map the most expensive docs/reader/candidate journeys and performance owners can design a prospective bounded confirmation policy. No additional full performance acquisition is necessary merely to write or review those designs.

## Deliverables and handoff

The current deliverable is this plan plus [execution findings](validation-efficiency-2026-09-30/execution.md), [browser findings](validation-efficiency-2026-09-30/browser.md), [policy findings](validation-efficiency-2026-09-30/policy.md), [campaign findings](validation-efficiency-2026-09-30/campaigns.md), [static inventory](validation-efficiency-2026-09-30/inventory.json), and [retained correctness timing extraction](validation-efficiency-2026-09-30/historical-runtime.json).

Implementation remains proposed. The independent project report retains this audit as its own workstream alongside the existing rollout, with a version-specific review card. Existing failures, uncertain performance results, manual obligations, sources and historical receipts are preserved. The next action is the first implementation slice above; no new recurring automation, publishing, test campaign, or acceptance-policy change was performed.
