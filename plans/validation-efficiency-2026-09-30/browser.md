# Browser verification lifecycle audit — 2026-09-30

Read-only inspection of authored browser configurations, shared execution code, fixture servers, selected tests, custom browser verifiers, and retained September 25/26 evidence. No builds, tests, browser runs, or repository edits were performed. Paths below are relative to `/Users/westbrook/Documents/repos/design-system`. Static source overlap is a candidate for investigation, not proof of equivalent assertions.

## What the existing system already does well

- The broad runner creates one owned ephemeral **built docs** server and supplies its origin to normal docs configs, tokens browser, component gallery and most direct verifiers (`tooling/testing/run-comprehensive.mjs:51`, `:117–120`). It closes owned docs/development/reader servers in `finally` (`:252–253`). Do not regress to per-command docs preview servers or borrow arbitrary existing listeners.
- Resolved browser worker counts are capped at three while retaining smaller limits (`tooling/testing/run-comprehensive.mjs:134–147`), with fresh facet selection before execution and checks against actual outcomes (`:151–173`). Most spec files use normal Playwright fixtures; a scan found no explicit `.launch()` in authored `*.spec.*` under packages/apps/docs/probes. This supports browser reuse within Playwright workers already, with intentionally fresh contexts per test. Browser sharing and context sharing must be treated separately.
- The three explicitly reviewed config alias relationships already exist (`tooling/testing/equivalence.mjs:5–9`). They require matching source, environment, fixture, browser, timeout, project and assertion policies (`:16–59`), execute residuals exactly (`tooling/testing/run-comprehensive.mjs:194–211`), and fall back to full execution on uncertainty. Preserve this conservative mechanism.
- Docs browser checks use built production output, no-JS/SSR and hydration are meaningful separate facets, and mobile emulation explicitly disclaims physical devices (`apps/docs/tests/README.md:1–18`; `apps/docs/tests/playwright.assets-mobile.config.ts:25–31`; `tooling/testing/mobile-profiles.ts:1–11`). Source fixtures, built consumers, tarball consumers, source SSR, built SSR and global/scoped registries are not interchangeable just because a component name repeats.
- The prior plan already qualified three-worker breadcrumbs and gallery; the minifier explicitly proved verification more expensive than fresh preparation, so one fresh registry-isolated minifier fixture **per owned SSR server, shared across engines** is intentional (`tooling/testing/README.md:33`; `packages/ssr/tests/server.mjs:10–11`; `plans/test-runtime-reduction-2026-09-25.md:174–186`). Do not propose indiscriminate caching or re-run old experiments without a new reason.

## Prioritization backed by retained evidence

The source scan found 70 authored Playwright configs under packages, probes and apps/docs/tests after excluding generated `dist`; the retained complete graph also includes the performance-results reader, for 71 configurations. Do not equate configs, top-level tasks, assertions, matrix invocations and performance jobs. The current exact complete inventory is the root audit's responsibility.

Retained `artifacts/test-runtime-2026-09-25/final-warm-correctness-current-v3/execution.json` records 217 measured commands and 6,118.207 seconds for ordinary correctness, **not a matched isolated speedup trial**. Summing child receipt `wallSeconds` by id:

| Kind | Commands | Sum seconds |
|---|---:|---:|
| Playwright full/residual executions | 70 | 4,705.376 |
| Direct checks (mixed browser/nonbrowser) | 24 | 1,163.469 |
| Other | 35 | 184.603 |
| Initial discovery | 71 | 16.440 |
| Bounded rediscovery | 16 | 3.922 |
| Residual rediscovery | 1 | 0.283 |

Some outer overhead is not included in child sums. The biggest browser-facing commands were main docs 1,444.899s, reader 783.508s, candidate imports 399.520s, theme refresh 311.690s and theme adoption 176.488s (`artifacts/test-runtime-2026-09-25/final-current-bottlenecks-v3.json`). Discovery is a real optimization opportunity but only ~20.6s in that run; it should not outrank long test journeys.

Main docs raw report (`.../final-warm-correctness-current-v3/evidence/7e62c012f3b6/playwright.json`) shows summed case time, **not wall time**, of theme-review 407.752s/63 executions, showcase 310.488s/75, calendar 208.536s/75, toast 193.360s/90, composable-chat 189.835s/75. Longest single case: “every authored Controls target is unique and available after its real example hydrates” at 79.710s in Firefox (`apps/docs/tests/api-element-controls.spec.ts:169` sets a 240s case budget). Profile these first. Retained counts are evidence for that tested source, not a claim of a new current run.

## Prioritized changes to plan

### P0: Add lifecycle and useful-coverage accounting before changing schedules

1. Extend the task/facet model to record risk/contract, precise assertions, delivery mode, browsers/profiles, prerequisite producers, server identity, browser/context ownership, concurrency safety, original reason for serialization, artifact requirements and negative-control owner.
2. Record time to first failure, launch/readiness/build time, fixture setup, browser launch count, context count, page navigation/hydration, assertion time, artifact/report time, teardown and resource queue time. Existing `measure.py` reports whole-command CPU/RSS, not these lifecycle costs (`tooling/testing/README.md:27`). Measure aggregate process-tree memory separately before raising machine concurrency.
3. For every apparent duplicate, classify: exact repeat; same assertion with a deliberate different facet; overlapping integration; extra regression coverage; orphan/obsolete historical view. Keep a reviewable obligation→case map rather than deleting tests by title/source similarity.

Acceptance: every active browser obligation has an owner and documented unique proof or a proven reference; baseline includes launch counts and first-negative latency; no unsupported “browser configurations = tests” totals.

### P1: Cheap negatives before expensive browser setup; start services just in time

The broad runner completes **all** selected producers before checks, types and Node (`tooling/testing/run-comprehensive.mjs:101–126`), starts development/reader services before these cheap checks (`:114–115`) and starts docs before checks (`:118–126`), then retains them through all unrelated browser configs and direct checks until final cleanup (`:214–253`). Source-only type/lint/inventory/freshness negatives should precede expensive unrelated builds/installations. Build-dependent consumer types must still wait for the smallest required producer (e.g. styles types depend on tokens, breadcrumbs types on SSR: `tooling/testing/comprehensive.mjs:80–85`).

Plan a dependency-ready scheduler, with fast-negative priority, explicit producer mutation barriers and service affinity. Start one server when its first compatible consumer becomes ready, group the compatible consumers, and close it after its last one. Do not alter standalone freshness-before-regeneration contracts (`run-comprehensive.mjs:96–100`). Store ordering policy in AGENTS plus executable scheduler tests, not prose alone.

Acceptance: a seeded source-only type error fails before browser launch and unrelated docs/framework preparation; a seeded built-consumer type error fails immediately after its minimum build; no service exists during a phase with no remaining dependent browser work; all former outcome/receipt guarantees remain.

### P1: Bring custom direct browsers into the scheduling budget and group them with their delivery cohort

After every configured browser, the runner executes direct browsers serially (`tooling/testing/run-comprehensive.mjs:214–222`). Each direct verifier loops engines serially and launches fresh browsers: sticker sheet `tooling/sticker-sheet/verify.mjs:13–14`, highlighting `tooling/highlighting/verify.mjs:18–19`, swatch `tooling/swatch/verify-production.mjs:18–20`, typography production `tooling/typography/verify-production.mjs:12–14`, candidate imports `tooling/theme-candidates/verify.mjs:185–206`, API examples `apps/docs/tests/api-examples-smoke.mjs:65–70`. The last example reuses one no-JS and one JS context per engine, closes pages per example and writes the growing results file after every case (`:67–70`, `:133–140`). This is another scheduling layer outside Playwright's worker pool.

Convert suitable correctness scripts to reusable assertion functions or Playwright tests with equivalent per-case receipts, then schedule inside the same global CPU/memory/browser admission budget. Preserve script wrappers as public views when needed. Group built-docs verifiers with built-docs config work, and isolated CSS consumers with their own compatible cohort. Do not share pages/contexts when storage, registry, module state or first-navigation behavior is under test. Candidate/mode loops may become independently scheduled cases only after fixtures are isolated; avoid duplicating heavy setup to gain superficial parallelism.

A concrete server mismatch: `direct:lazy-docs` is classified built-browser and receives the owned docs URL (`tooling/testing/comprehensive.mjs:35`, `run-comprehensive.mjs:51`), but ignores it and creates another static server (`probes/lazy-registry/docs-check.mjs:6–8`) and closes it without awaiting completion (`:17`). Teach it the owned-server contract while retaining its exact byte/resource assertions.

Acceptance: full prior matrix and unique assertions retained; direct browsers included in global admission; successful shared service count one per proven compatible cohort; no page state leakage in shuffled/parallel runs; interruption closes every owned child; direct failed cases remain individually traceable.

### P1: Audit and qualify one-worker bottlenecks rather than retaining or raising limits blindly

Serial declarations include combobox desktop `packages/elements/src/combobox/tests/playwright.config.ts:12–13`, mobile `.../playwright.mobile.config.ts:15–16`, primitives navigation `packages/primitives/tests/navigation/playwright.config.ts:12–13`, elements navigation `packages/elements/src/navigation/tests/playwright.config.ts:11`, lazy registry `probes/lazy-registry/playwright.config.ts:4`, activation library/registry, scoped hydration and rich ranges. Some one-file families cannot use three workers without per-test parallelism; simply changing a number may do little. Server-side SSR global registries, stream gates and disk outputs also constrain safe concurrency.

Use a fixture ownership audit followed by worker 1/2/3 screens on the heaviest families, then alternating full paired runs only for a promising schedule. Isolate any mutable server state per navigation or test. Keep supported lower limits with a concrete reason. The existing 3-worker global cap is a policy, not proof of optimum on every host. Later resource-class tuning may test higher host-specific caps only after memory/CPU tail/failure measurements; do not run timed campaigns beside correctness.

Acceptance: unchanged selection/assertions/deadlines; no retries to cover contention; exact output equivalence; failure/flake rate no worse; command wall time improves reproducibly without pathological slowest-case or memory increases. Keep serialization for legitimate shared-state/measurement isolation.

### P2: Reuse compatible fixture services and compatible browser workers across configuration boundaries

Each remaining config is run as a separate Playwright child (`tooling/testing/run-comprehensive.mjs:187`, `:214`), ending its workers and usually its `webServer`. `reuseExistingServer:false` is a sound ownership protection, but it need not mean “relaunch the same proven server for every test family.”

Candidate cohorts:

- Commands desktop/mobile both call `node server.mjs`, have external base URL support, and differ by desktop/mobile contexts and worker budgets (`packages/elements/src/commands/tests/playwright.config.ts:7–18`; `.../playwright.mobile.config.ts:8–19`). Share an owned server while retaining the two project matrices and compatible worker constraints.
- Combobox desktop/mobile use the same server but separate ports; mobile already supports an external origin (`packages/elements/src/combobox/tests/playwright.mobile.config.ts:9–28`). Add symmetrical ownership support to desktop, qualify shared fixture bytes and all contexts.
- Four API source-alias Vite servers are structurally identical aside from port: `probes/api-transactions/server.mjs:3`, `api-outcomes/server.mjs:3`, `api-forms/server.mjs:3`, `api-localization/server.mjs:3`. Consolidate into one explicitly configured fixture host only after source-alias semantics and cache isolation match.
- Styles composition/theme-cascade/state-paint repeat Vite setup with per-family redirects/entries/cache dirs (`packages/styles/tests/composition/server.mjs:4–15`, neighboring server files). A shared host can keep all exact fixture routes, but measure whether retaining optimized modules is useful. Existing on-disk Vite caches persist; the current code does not establish that every restart discards all compilation work.

Use a service manifest keyed by actual inputs, delivery semantics and ownership. Consider composite Playwright configs or worker-compatible projects; merely putting projects in one config does not guarantee cross-project worker reuse. Measure actual launch counts, rather than assuming the new config shape saved launches. Keep fixture output/report paths independent. Fixed port conflicts block naive config-level parallelism: internal sizes and docs default to 4391 (`packages/elements/src/internal/tests/playwright.config.ts:6`; `apps/docs/tests/playwright.config.ts:9`), API localization/rich ranges share 4498 (their server files), content/elements navigation share 4395. Allocate owned ephemeral origins where possible.

Acceptance: startup count drops; served bytes and resolved project/case facets match; no foreign server is accepted; fixture cache invalidates on input/runtime change; all cleanup succeeds; net wall time improves with memory bounded.

### P2: Review additional overlap candidates, without treating current policy differences as duplicates

- Composable editor base selects all specs while token-editor config selects a subset (`probes/composable-editor/playwright.config.ts:4`; `token-editor.config.ts:4`). They currently differ in fullyParallel policy, readiness route, and external-server reuse; exact aliasing is correctly not automatic. Decide whether those differences are intentional coverage or accidental drift, unify if warranted, then qualify same-invocation reference.
- Lazy base, phase4 and cleanup configs appear to select the same two maintained specs and use a common current preparation environment when run through the comprehensive graph (`probes/lazy-registry/playwright.config.ts:4–9`; `phase4.config.ts:6–9`; `cleanup.config.ts:5–8`; `tooling/testing/comprehensive.mjs:57–62`). Standalone historical output defaults differ. Separate current-view alias opportunities from historical reconstruction obligations; never rebind historical receipts to current builds.
- Theme authoring/composition reappear inside theme regression, but regression inherits 45s timeout and 1440×1100 viewport, while standalone inherits the main 25s/1440×1000 context (`apps/docs/tests/theme-authoring.config.ts:4`; `theme-regression.config.ts:3–5`; `theme-proof.config.ts:5–6`; `apps/docs/tests/playwright.config.ts:20–22`). Those are presently distinct facets; identify which differences have product-risk value before merging.
- Existing context-regression alias can still fail equivalence if server/config facets differ; inspect alias refusal reasons before adding new aliases. Preserve full fallback.

Acceptance: eliminated executions have an exact mapping to same-invocation passed producer facets; residual unique cases still execute; fault-injected producer failure cannot fulfill aliases; incompatible sources/environments expand to full execution.

### P2: Improve long journeys and waits based on actual cost, not global timeout cuts

Static scan finds 26 direct `waitForTimeout` call sites in 11 authored spec files in the audited roots (helper calls and loops multiply runtime; this is not total wait count). Many are intentional time assertions: tooltip fixture uses 400ms exit and 50ms pointer segments beyond hideDelay (`packages/ssr/tests/popup-motion/tooltip-motion.spec.ts:39–53`, `:82–85`); form reset waits past a known obsolete 450ms completion (`apps/docs/tests/form-navigation.spec.ts:115–125`); combobox feedback uses an explicit wait helper throughout quiet-period/cancellation tests (`packages/elements/src/combobox/tests/space-feedback.spec.ts:7`, `:54–99`). Do not replace temporal non-events with immediate assertions.

Classify waits as semantic observation window, missing readiness synchronization, animation completion or retry backoff. Replace only accidental sleeps with observable readiness, settled animation promises, event ownership or deterministic virtual time where browser semantics permit it. Keep representative real-time timer/motion checks. Audit high-sum docs journeys for redundant navigation/hydration, repeated broad Axe scans of unchanged states, repeated extraction and per-target RPCs; batch observations without losing target uniqueness or real input. The prior theme batching required preserving original locators and ambiguity controls (`plans/test-runtime-reduction-2026-09-25.md:125–128`). Retain that lesson.

Acceptance: intentional negative observation windows remain proven; source-ready faults fail promptly; case tail durations improve; same independently checked targets/states/engine matrix; accessibility scanning is scoped to meaningful changed states and is not called manual AT coverage.

### P3: Trim discovery overhead after expensive paths are addressed

All configs are discovered sequentially; those with a resolved budget above three are discovered again (`tooling/testing/run-comprehensive.mjs:134–147`). Resolved selection is necessary; process-per-discovery and duplicate bound qualification could be optimized using a bounded discovery batch or a config policy resolved once. Avoid static regex substitution or dropping the proof that worker changes preserved facets.

Acceptance: exactly the same resolved policy and selected IDs, conservative behavior on dynamic configs/errors, no test/server execution during discovery, measurable startup reduction. Retained total ~20.6s explains why this is lower priority than 24-minute docs work.

## AGENTS additions specifically for browser work

- Run the cheapest relevant source/freshness/type/Node negatives at the first valid dependency boundary. Start expensive fixture/service preparation only when a selected dependent check is ready.
- Prefer one dependency-aware requested-pathway union over independent repeated named gates; a filtered pass remains subset evidence.
- Reuse owned, identity-verified builds/fixtures/services within the invocation; fresh contexts by default; browser sessions reusable only through declared compatible fixtures. Never reuse timing samples or historical acceptance.
- Declare every deliberate serial group and matrix dimension's reason. New tests should state the bug/risk they catch and why existing coverage cannot catch it.
- Optimize the measured critical path and first-failure latency. Keep original assertions/deadlines/matrix until equivalence and concurrency qualification is complete. Do not run whole confirmation sweeps after every reversible small edit; run focused evidence first, then one complete affected closure at an integration checkpoint.

## Explicit process/context/performance boundary

A server can be shared when it serves the same identity-verified immutable built files or supports fully isolated request state. A browser process can be reused for correctness when launch options/engine/runtime match and every test gets the required fresh context or page semantics; prove no process-scoped contamination, and replace a failed worker as Playwright normally does. A browser context carries cookies, local storage, permissions, routes, service workers and browser cache; page globals also carry custom-element definitions and module state. Keep fresh contexts by default, with context/page reuse confined to a single explicitly stateful journey. No-JS, hydration-before-input, module registration, cache-state and first-load assertions must preserve their original initial conditions. Performance acquisition has stronger obligations: cold/warm profiles, fresh-session sampling, serial host ownership, sample counts and retention trajectories are protocol inputs. Correctness pooling must never leak into or alter those timed campaigns.
