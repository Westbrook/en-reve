# Native showcase performance profiling plan

Status: proposed protocol, 2026-09-20. This document plans the work; no performance rankings, benchmark executions, optimizations, or recurring jobs are claimed. The eight existing fixtures and their functional verification remain the starting point.

Completeness review: revised against the [web.dev performance hub](https://web.dev/performance) and its measurement/optimization guides. Added explicit metric attribution, navigation lifecycle tests, rendering containment, targeted loading/font/scheduling experiments and a clearer boundary for unexercised consumer workloads. These additions preserve the native baselines and the five outcomes below.

## Outcomes

The programme should answer five questions:

1. Where does each implementation deliver a better user experience, and under which device, network, cache and usage conditions?
2. Where does En Reve fall behind comparable implementations, by how much, and with what confidence?
3. Which specific library, application or delivery changes would close those gaps?
4. What must a consuming developer do to preserve En Reve's best measured performance?
5. How do we detect future regressions and revisit the comparison as En Reve, competitors and browsers evolve?

Produce a comparison by scenario and metric, not one overall library score. Every finding must connect a user-visible outcome to reproducible evidence and an addressable owner. A smaller download that delays the first useful action is a tradeoff, not an unconditional improvement.

## 1. Establish the comparison contract

The initial panel contains seven external implementations—Radix Themes React, Fluent React, React Spectrum S2, Astryx React, shadcn/ui React, Fluent Web Components and Spectrum Web Components—plus standalone En Reve. Pin the existing lockfiles, registry provenance, En Reve tarball bytes, build identities and [qualification receipt](../showcases/verification.json). Root workspace changes must not silently alter the packed En Reve baseline. Record resolved compilation targets and minifier settings as well as tool versions; optimized candidates must preserve the same browser-support contract.

Keep three result sets separate:

| Comparison | Question | Controls |
| --- | --- | --- |
| Native full showcase | What does this complete implementation cost to deliver and use? | Current sixteen cards, native default styles/providers/fonts, actual interactions and documented fallbacks. |
| Supported optimized delivery | How well can a consumer deliver the same experience using normal native techniques? | Same visible capability and correctness; supported imports, lazy boundaries, caching and preloading. Record the implementation effort required. |
| Attribution fixtures | Which part explains a difference? | Small matched workflows; runtime/theme shell, individual component families and application-state controls. Do not present these as whole-application results. |

Run the current functional qualification before every measurement build. Audit the [coverage ledger](../showcases/COVERAGE.md) for matching content, state, validation, focus, keyboard operation, overlay lifetime and successful task outcomes. Missing controls, unsuccessful interactions and timeouts are failures, never fast samples. Record differences in DOM, fonts, density, motion and fallback controls. Rate a native rating control separately from a generic 1–5 selector.

All current fixtures use client rendering. Add a later, separate SSR/hydration cohort where each library officially supports it; report unsupported cases explicitly. Include En Reve's real consumer SSR path, but exclude documentation navigation and theme-editor work from the fixture. Do not compare En Reve's hosted documentation page directly with local CSR competitors.

## 2. Build an isolated measurement harness

Create a new `showcases/performance/` sub-project with its own manifest, lockfile and tool versions. Keep benchmark collectors outside normal deliverables. Proposed contents:

```text
performance/
  registry/          # implementation IDs, versions, builds, supported capabilities
  scenarios/         # versioned user journeys and per-library selectors
  profiles/          # hardware, browser, network, cache and server configurations
  collectors/        # early browser observers; bundle and diagnostic collectors
  runner/            # serial execution, randomization, manifests, validation
  analysis/          # distributions, comparisons, confidence intervals
  budgets/           # deterministic limits and qualified timing gates
  baselines/         # immutable baseline manifests and explicit promotions
  reports/           # generated comparison tables, findings and history
```

Use Playwright for browser lifecycle and trusted input, with Chromium CDP sessions for network controls, traces, coverage and targeted diagnostics. Reuse semantic scenario knowledge from the existing checks, not their elapsed test durations. Locator waiting and assertions establish correctness; browser timestamps measure performance. [Playwright CDP support](https://playwright.dev/docs/api/class-cdpsession).

Tachometer is archived as of September 4, 2026. Retain its useful repeated, interleaved sampling model in a small local runner; do not depend on an unmaintained browser-launch stack or build a general benchmark platform. Validate the statistical code against known datasets and use a maintained analysis library. [Tachometer repository](https://github.com/google/tachometer).

Use three collection modes:

- **Primary measurements:** minimal observers, scenario marks and resource metadata. No open DevTools, screenshots during timed work, source-level profilers or per-event console logging.
- **Diagnostics:** selected reruns with source-mapped Chrome traces, precise JS/CSS coverage, framework profiling where available and DOM/style information. These explain results rather than supply headline timings.
- **Memory:** a separate lifecycle experiment with the security headers and collection conditions needed by the memory API.

Measure collector overhead with instrumented/uninstrumented control runs. Keep collector versions identical across implementations. Preserve the normal unflagged entry points: `?progress-report` is absent in timed runs.

## 3. Measure real production delivery

The current Python preview server is for visual inspection. It does not establish a controlled compression, HTTP/2 or cache configuration. Put all eight production builds behind the same pinned local serving stack for the main experiment, with HTTPS, HTTP/2, precompressed Brotli/gzip, correct content types and `Vary: Accept-Encoding`. Give hashed assets immutable caching and HTML revalidation. Verify actual response headers, encoding, cache source and negotiated protocol. Keep service workers absent unless introduced as a separately labelled consumer experiment.

Interpret sharding as application/module chunks on the same origin. Domain sharding changes connection behavior and is not the default under HTTP/2. [Connection management guidance](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Connection_management_in_HTTP_1.x#domain_sharding).

| Dimension | Main measurement | Secondary validation |
| --- | --- | --- |
| Device | Fixed desktop reference; fixed constrained CPU/mobile viewport profile | Representative physical Android device; Safari on real Apple hardware for important findings. Emulation is not equivalent to those devices. |
| Network | Unthrottled local control; one explicitly specified constrained connection | More severe network only for likely bandwidth/chunking sensitivities; deployment-like hosting as a separate cohort. |
| Cache | Cold browser profile and HTTP cache; warm HTTP-cache navigation into a new document | Same-document repeated actions, new-deployment invalidation, back/forward restoration. Keep these distinct. |
| Browser | Pinned Chromium build for full diagnostics | Firefox and WebKit coverage plus important measurements supported there; Playwright WebKit is not a substitute for shipped Safari validation. |
| Fonts | Native delivery as shipped | Controlled font-loading experiment for attribution, clearly labelled. Never silently remove required native typography. |
| Rendering | Current CSR fixtures | Separate supported SSR/hydration cohort. |

Specify bandwidth, RTT, CPU multiplier/calibration, viewport, DPR, refresh rate, OS, hardware, power mode and browser version in each profile. Avoid double throttling Lighthouse and CDP. Distinguish simulated Lighthouse results from observed throttled-browser measurements. A new browser context alone is not proof of a fully cold visit: reset and verify HTTP/cache/profile state, record connection/DNS conditions, and isolate external font caches. Record proxy/server cache state too.

Record font/resource URLs and response hashes where observable. A pinned package does not freeze externally hosted font bytes. Changed remote content gets a new asset identity and an overlap check; inaccessible resource identities are a stated reproducibility limitation.

For the later SSR/deployment cohort, use `Server-Timing` where the serving stack can expose its own work, separating server rendering/cache handling from network and browser delay. It describes server-defined durations, not automatically the whole TTFB. The static local fixture cannot establish production backend performance. [Server-Timing](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Server-Timing).

Run benchmark browsers serially on a quiet, powered reference machine, foregrounded, without extensions or competing builds. Randomize/interleave library order within blocks. Use the same protocol on all origins and record failures, thermal drift and environmental interruptions. Diagnostic captures may be analysed in parallel after measurements finish.

## 4. Measurement catalogue

| Area | What to retain | What it answers |
| --- | --- | --- |
| Bundle and transfer | Raw minified, gzip and Brotli bytes for JS/CSS/fonts/assets; initial versus eventual totals; request count, critical chain, duplicates and cache retention | Download cost, fixed adoption cost, opportunities to defer work. |
| Startup | TTFB, FCP, LCP and candidate identity, CLS, DOM/content milestones, critical controls usable, JS parse/compile/evaluate, style/layout/paint time | When users see useful content and can successfully act. |
| Load blocking | Lighthouse TBT and raw audit metrics; long tasks and long animation frames | Work delaying startup or feedback. |
| Interactions | Input delay, handler/processing time, presentation delay, action-to-visible-result and action-to-fully-usable-result | Which specific task feels slow, including deferred loading and animation/focus completion. |
| Continuous work | Frame intervals, missed-frame/jank evidence, long animation frames during scroll/drag/transitions | Smoothness that click/keyboard metrics do not capture. |
| Memory/lifecycle | Settled memory, first-use growth, maximum sampled memory, retained growth over repeated cycles; DOM/listener/observer/stylesheet diagnostics | Session growth, allocation pressure and cleanup quality. Checkpoint samples do not establish the true peak. |
| Stability | Error/timeout rate, CLS during startup and later actions, focus/keyboard/visual correctness | Whether a fast variant remains usable and reliable. |

Build attribution should separate framework/runtime, library controls, shared utilities, tokens/styles, icons/locales, fonts and authored fixture code. Use emitted module/chunk metadata and sourcemaps; count CSS embedded in JS as part of its delivered JS as well as identifying its semantic role. Do not count sourcemaps as ordinary page transfer unless the page actually requests them. Package installation size is a separate developer concern, not delivered bundle size.

Compute compression using identical versions/settings, and separately record actual encoded response bytes. HTTP resource timing may hide cross-origin details without Timing-Allow-Origin; use browser/network evidence or mark unavailable, not zero. Resource buffers must be sized and drained to avoid losing records. Code coverage means unexercised code in the measured journeys, not proof that code can be removed.

Install observers before application startup, feature-detect supported entry types, and use separate `{type, buffered: true}` registrations. Collect navigation, resource, paint, LCP, layout-shift, event, first-input, longtask and long-animation-frame entries where supported. Record unavailable metrics explicitly. Flush records at scenario/session completion without changing page behavior. [PerformanceObserver options](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver/observe).

Use the maintained `web-vitals/attribution` implementation for Web Vitals aggregation; retain raw Event Timing entries for per-action analysis. Observe events at `durationThreshold: 16`; entries are quantized and short interactions can fall below observation thresholds. Absence is not a zero-duration result. Group event entries by interaction ID rather than counting pointerdown/up/click as independent user actions. `reportAllChanges` reports metric changes, not every interaction. [Event Timing](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceEventTiming), [web-vitals](https://github.com/GoogleChrome/web-vitals).

Call the result **scripted-session INP**, with the journey and observation window attached. It is not field p75 INP, nor does a navigation-only audit measure the full interaction experience. INP concerns eligible discrete interactions; separately measure scrolling, dragging and asynchronous completion. A next paint showing a loading indicator does not mean the requested workflow is complete. [INP definition](https://web.dev/articles/inp).

Finalize each session through the Web Vitals library's lifecycle reporting after the prescribed journey and observation window, then collect the final records before closing the page. Keep load-only navigation runs separate from early-interaction runs: user input can end LCP observation and otherwise make slow-loading pages appear to improve.

Define an explicit “critical controls usable” contract: above-fold content is present and enabled, required definitions/initial renders have completed, and a representative keyboard/pointer action succeeds. `DOMContentLoaded`, `load`, network idle, a React commit, Lit `updateComplete`, or `customElements.whenDefined()` alone are not interchangeable with usable painted UI. User Timing records milestone boundaries; correlate with presentation/trace evidence and label frame-based approximations honestly. Identify the actual LCP candidate because native layouts may select different elements.

For each final LCP candidate, retain **TTFB, resource-load delay, resource-load duration and element-render delay**, using the attribution library's definitions. Inspect initiator/discovery chains and render-blocking CSS/JS when diagnosing the delay. Confirm an optimization reduces total LCP rather than moving time between subparts. System-font text can genuinely have no resource-loading segment; missing attribution remains unavailable. Aggregate subparts from the same runs: independently calculated p75 subparts do not add up to p75 LCP. [LCP decomposition](https://web.dev/articles/optimize-lcp).

Compute CLS through the maintained library's **maximum eligible session-window score**, not a lifetime sum. Windows group shifts with gaps under one second, up to five seconds. Preserve shift timestamps, affected nodes and rectangles; exclude `hadRecentInput` shifts from scored CLS but retain them as separate usability evidence. The recent-input rule concerns qualifying discrete input, not scrolling/continuous dragging. Diagnose the source of the movement, since the reported shifted element may be the victim of an insertion elsewhere. [CLS definition](https://web.dev/articles/cls), [post-load CLS diagnosis](https://web.dev/articles/optimize-cls).

Run repeated Lighthouse CLI audits as an independent diagnosis channel. Retain JSON, configuration, version, raw FCP/LCP/CLS/Speed Index/TBT and audit findings. The aggregate score is supplementary; TBT is not measured action latency. Use the same Lighthouse/browser versions within a comparison. [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview), [variability](https://github.com/GoogleChrome/lighthouse/blob/main/docs/variability.md).

Long tasks and long animation frames overlap: do not add them into a fabricated total. Use LoAF script/render attribution and source-mapped traces to investigate event work, forced layout, style invalidation and presentation. Trace frame activity for shorter dropped frames that a >50 ms LoAF threshold cannot describe. [Long animation frames](https://developer.chrome.com/docs/web-platform/long-animation-frames).

For a rendering bottleneck, classify JavaScript → style → layout → paint → composite work, including shadow-root/DOM growth and forced layout. Evaluate frame delivery against the recorded refresh rate; a 50 ms long-task cutoff is not a smooth-animation budget. Test suitable transform/opacity alternatives only when they preserve the effect, and record layer/memory costs rather than recommending blanket layer promotion. [Rendering performance](https://web.dev/articles/rendering-performance).

## 5. Fixed user journeys

Give each scenario a stable ID, fixture version, setup/reset, browser input sequence, success assertion and named start/end milestones. Run first-use and warmed-use variants where applicable. Fixed observation windows and state resets prevent one library from receiving less work.

| Journey | Specific measurements |
| --- | --- |
| Open the page and act early | Initial content/controls readiness; attempt Create or focus/type as soon as it becomes visibly available. Readiness waiting must not hide a slow startup. |
| Create/preview/export | First open, content ready, keyboard usability, close feedback and focus restored; first deferred request and warmed repeat. |
| Menu, tabs and disclosure | Open, choose, switch panel and expand; next paint plus correct visible result. |
| People search | Type a fixed query at a defined cadence, show options, choose and add teammate. |
| Canvas and output | Orientation change; slider keyboard steps; separate pointer drag; resulting artwork updates. |
| Form and review | Type, toggle, submit invalid/valid inputs, approval and status feedback. |
| Chat and collection | Add fixed messages/assets, reset, check unrelated cards and focus remain stable. |
| Scroll and revisit | Scroll through all sixteen cards at controlled pace; return; detect lazy-load work, shifts and frame disruption. |
| Back/forward restoration | Navigate away and return; verify actual bfcache restoration, preserved state/focus and first-action usability. Keep cache misses explicit. |
| Lifecycle endurance | Repeated overlay open/close, add/remove/reset and supported mount/unmount cycles, followed by quiescence. |

Confirm bfcache restoration with `pageshow.persisted`; record eligibility/failure reasons where available and a restore-success rate. Let the metric collector handle a new visit lifecycle after restoration, avoiding carryover of the original visit's INP/CLS. A restored page is not another warm-cache network navigation. Include page lifecycle listener/cleanup behavior in consumer guidance. [Back/forward cache](https://web.dev/articles/bfcache).

For later route-splitting/SSR consumer fixtures, keep hard navigations, soft navigations and bfcache restores distinct. Feature-detect soft-navigation/interaction-contentful-paint APIs and pin the collector's reporting mode. Web.dev's August 2026 SPA guidance describes Chrome 151 support; it must not be assumed across the browser panel. Route-level contentful-paint semantics concern newly painted content and cannot be silently pooled with document-load LCP. The current one-page showcase does not need a router added for this experiment. [SPA metric semantics](https://web.dev/articles/vitals-spa-faq).

For attribution, introduce controlled scale fixtures (for example 1/10/100 mounted controls, or larger option lists) only after realistic journeys reveal a question. Label them synthetic and match observable capability. Do not extrapolate full-application speed from a tight synchronous component loop.

## 6. Bundle splitting and cache experiments

Test one dimension at a time against each project's baseline:

1. **Selective imports and tree shaking:** public component entry points versus documented aggregate imports; detect unused feature families, duplicated runtimes, icons/locales and side-effect boundaries. Do not use unsupported package internals to win a benchmark.
2. **Incremental adoption:** theme/provider/runtime shell → button → basic form → overlays → date/combobox → full showcase. Also remove one family from the full page. Report absolute totals and contextual deltas; compressed differences are not additive component price tags.
3. **Deferred closed workflows:** commands, preview and export overlay modules loaded on demand. Record bytes/evaluation saved at startup, first-open penalty, warm-open time and eventual full-journey cost.
4. **Deferred below-fold groups:** load card groups near visibility with reserved dimensions. Check scrolling, focus navigation, findability and late layout shifts; preserve all content.
5. **Intent preloading:** compare no preload with pointer/focus/keyboard intent. Report unused preload traffic and first-action improvement. Eager modulepreload must not silently undo the intended deferral.
6. **Shared chunks and deployment churn:** compare build-default splitting with justified stable shared chunks. Rebuild after an app-only edit, one control change, theme change and dependency bump; measure hashes/bytes invalidated, warm-navigation transfer and request chains. More files alone do not imply less initial work.

React feature boundaries should use native `lazy`/`Suspense`; move component imports out of the eager shared adapter when necessary. WC variants dynamically import registration modules, then account for definition, upgrade, initial render and usability. Registration can pull a dependency closure; `whenDefined()` does not prove the element has finished rendering. [React lazy](https://react.dev/reference/react/lazy), [custom element definition readiness](https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/whenDefined).

A custom-element definition also upgrades existing matching elements throughout its registry scope. Deferring a below-fold group cannot avoid construction if shared tag definitions are already loaded and those nodes are eagerly inserted. Record both module and DOM-mount boundaries, including transitive registrations; use reserved placeholders where the experiment truly defers mounting.

Inspect emitted dependencies and CSS behavior before imposing manual chunks. Vite already manages dynamic-import dependency preloading and asynchronous CSS. Spectrum React's current `cssCodeSplit: false` stays in the baseline; changing it requires a documented supported path and visual/style-order qualification. A lazy boundary must save actual initial requests/evaluation, not just rename files. [Vite build optimizations](https://vite.dev/guide/features.html#build-optimizations).

### Additional supported optimization experiments

The web.dev review adds four experiments to the optimized/attribution cohorts. Each requires a measured bottleneck and full native correctness checks:

| Experiment | Measurements and constraints |
| --- | --- |
| Rendering containment versus lazy mounting | Compare eager rendering, `content-visibility: auto` with `contain-intrinsic-size` on application card wrappers, and actual deferred mounting/imports. Measure initial rendering, scroll activation, shifts, find-in-page, focus navigation and overlays. Rendering can be skipped while download, element construction and state memory remain paid. Avoid measurement reads that force offscreen rendering. |
| Critical-resource discovery and priority | Test limited preconnect, critical font preload, appropriate fetch priority and module preload against native browser defaults. Record initiator chains, start priorities, duplicate/unused requests and contention. Match `as`/CORS correctly; do not promote every resource or defer the actual LCP resource. |
| Font delivery | Compare supported weights/subsets, WOFF2, loading policy and metric-compatible fallback settings. Measure visible text, font readiness, text-LCP and font-induced shifts on first/repeat visits. Preserve intended typography and supported languages; never subset only to demo text. Self-hosting is a separate supported/licensed variant. |
| Task scheduling and workers | For trace-confirmed computation, compare bounded task splitting/yielding and DOM-independent worker work. Measure feedback and full completion, cancellation, worker startup, messaging/transfer and memory. Feature-detect `scheduler.yield()` and qualify a fallback; a resolved Promise alone does not yield a new task. Do not invent heavy work or rewrite library renderers to create a win. |

Sources: [content visibility](https://web.dev/articles/content-visibility), [resource hints](https://web.dev/learn/performance/resource-hints), [font delivery](https://web.dev/learn/performance/optimize-web-fonts), [task yielding](https://web.dev/articles/optimize-long-tasks), [workers](https://web.dev/learn/performance/web-worker-overview).

The current CSS artwork and simple avatars do not exercise realistic responsive image/video delivery. Mark that capability **not exercised**. Use separate clean consumer fixtures for image formats, `srcset`/`sizes`, intrinsic dimensions, decode costs and offscreen lazy loading if those recipes are to be recommended. Preserve eager loading for an actual above-fold LCP image. Video, iframes, third-party scripts, service workers and speculative prerendering are conditional consumer extensions; they are not extra dependencies or work added to the eight baseline pages. [Image delivery](https://web.dev/learn/performance/image-performance).

## 7. Memory protocol

Use a dedicated cross-origin-isolated secure serving mode when `measureUserAgentSpecificMemory()` is supported. Verify isolation and asset loading; the headers can affect external fonts/resources. Do not silently mix isolated-mode load measurements with the normal-delivery cohort. Record unsupported browsers explicitly and compare memory only within the same browser version and measurement mode. [Memory API requirements](https://developer.mozilla.org/en-US/docs/Web/API/Performance/measureUserAgentSpecificMemory), [cross-origin isolation](https://developer.mozilla.org/en-US/docs/Web/API/Window/crossOriginIsolated).

Sample independent sessions at settled load, after first heavy workflow, after bounded repeated cycles and after quiescence. A practical pilot is checkpoints after 0/10/50/100 cycles. Retain memory distributions, total/breakdown, DOM counts and growth versus cycle count. Use fixed quiescence policy/timeouts, and separate naturally collected samples from forced-GC diagnostics. Persistent growth warrants a retainer investigation; one high sample is not a leak conclusion.

Memory collection can wait for or influence garbage collection, so it must not overlap headline interaction timing. Use heap snapshots/retainer graphs and allocation profiles only for diagnosis. Do not substitute `performance.memory` or process RSS for equivalent whole-page API bytes. OS/process metrics may be supplementary but must retain their different scope. [Chrome memory guidance](https://web.dev/articles/monitor-total-page-memory-usage).

## 8. Sampling and reporting rules

Start with a five-run pilot for capability checks, correctness, variance and runtime estimation. Then fix the main sample sizes before comparing results: initially 30 independent navigations per primary cell, 30–50 independent sessions for important interaction journeys, and 5–10 Lighthouse audits. Increase tail-focused runs to at least 100 independent sessions when p95 decisions matter; report uncertainty rather than claiming a stable tail from a handful of observations. These counts are proposed starting points, refined from pilot variance and resource cost.

Avoid the full Cartesian matrix initially. The first full delivery pass is eight implementations × two device profiles × two cache states × 30 navigations = 960 navigations. Run one specified network profile per device initially, then use targeted network sensitivity tests. Interaction, memory and diagnostic suites are separate. Apply chunk experiments and secondary browsers to the findings that need them before expanding to all combinations.

Treat the independent session/run or randomized comparison block as the statistical unit. Multiple interactions within one session are correlated; retain their order and aggregate or use a clustered analysis. Use paired block comparisons and 95% confidence intervals for absolute and relative changes. Publish median and p75, with supported tail summaries, raw distributions and sample counts. Avoid unsupported precision from coarse Event Timing data.

Declare primary outcomes, practical thresholds, invalid-run rules and confirmation procedure before the main run. Do not delete legitimate slow runs or repeatedly sample until a winner appears. Keep timeout/error rates in the report; environment-invalid exclusions need recorded reasons. Exploratory comparisons can generate hypotheses; confirm promoted findings in an independent run, with multiplicity handling for formal claims across many outcomes.

Use three conclusions: meaningful difference, practical equivalence within a predefined margin, and inconclusive. Overlapping intervals alone do not prove equivalence. Show absolute milliseconds/bytes/MiB alongside percentages, especially near zero. Benchmark browser/version changes begin a new series with overlap runs rather than continuing an unqualified trend line.

## 9. Turn En Reve gaps into engineering work

Each gap gets a compact record:

```text
User task + device/cache/delivery profile
En Reve value → comparable peer value; absolute/relative delta and uncertainty
Source/build/scenario/browser identities and reproduction command
Trace/heap/module evidence; confirmed cause versus open hypothesis
Owner: fixture / elements / primitives / styles-tokens / packaging / delivery
Proposed change, expected user benefit, tradeoffs and correctness requirements
Before/after confirmation and regression test/budget
```

Prioritize frequent, high-impact user delays, then broad startup/transfer costs and demonstrated session growth. Let evidence assign ownership. A hosting delay is not an element-rendering defect; a default animation duration is not automatically handler CPU time.

Current source inspection suggests investigations, not established performance findings:

- **Update scope:** En Reve currently updates a top-level signal and calls the showcase grid template; React cards often keep local state, while the other WC fixtures patch affected DOM. Compare a same-Lit card-local-state variant and inspect actual committed updates before attributing a whole-page difference to En Reve components.
- **Registration closures:** inspect which rarely used features become eager dependencies. Date-picker and command-palette registrations have transitive element dependencies; verify the actual emitted graph before changing packaging.
- **Styles and reactive work:** separate stylesheet sharing/installation, style recalculation, template work, reactive scheduling and repeated property assignments using diagnostic evidence.
- **Mount/teardown:** investigate retained elements, controllers, listeners, observers and overlay resources only when lifecycle measurements show persistent growth.
- **SSR and defaults:** determine which gains can be automatic in En Reve and which require explicit consumer configuration. Preserve the frozen baseline while creating independently identified candidates.

Accept an optimization only after correctness and the affected performance suite pass, with a full-journey check for displaced costs. Preserve accessibility, focus behavior, required styling and native semantics.

## 10. A continuing regression and competitor system

Maintain three baseline lanes:

| Lane | Purpose | Update rule |
| --- | --- | --- |
| En Reve release anchor | Detect regressions against the last accepted release and an immutable historical anchor | Explicit promotion with evidence and a reason. Never silently replace the baseline after a slowdown. |
| Fixed competitor panel | Longitudinal comparison against the same eight pinned implementations | Keep versions fixed within a benchmark epoch. Rerun En Reve and peers together to control machine/browser drift. |
| Refresh/challenger panel | Evaluate new competitor versions, new systems, browsers and delivery techniques | Separate proposal/version until functional qualification, capability mapping and overlap measurements pass. |

Version the scenario contract, capability mapping, collector, serving profile and statistics protocol separately from library versions. A new library implements a small adapter contract: build/serve metadata, readiness evidence, scenario selectors, state reset, success assertions and supported features. Missing APIs/features are N/A, never zero. React and WC implementations remain separate entries. Qualify the new adapter, add baseline artifacts, then add it to the panel without rewriting history.

Proposed execution tiers (a cadence design, not scheduled jobs created by this plan):

| Trigger | Work | Enforcement |
| --- | --- | --- |
| Every relevant pull request | Deterministic bundle/import/chunk budgets, correctness, affected component journeys, small En Reve-versus-base performance sentinel | Hard fail deterministic/correctness regressions. Timing smoke alerts request a controlled confirmation rather than declaring a noisy winner. |
| Daily on a dedicated runner | En Reve candidate versus release anchor; core load/interaction suite; rotating lifecycle checks | Confirm meaningful regressions with fixed protocol and route findings to component owners. |
| Weekly | Full fixed competitor panel on the main profiles; trends and selected memory journeys | Surface changes in competitive position and environment drift. |
| Before release | Full primary matrix, confirmed tail/memory findings, physical-device and cross-browser checks, optimized-delivery and supported SSR checks | Release decision uses evidence, explicit waivers and tracked follow-up. |
| Dependency/browser refresh or new competitor | Challenger qualification plus old/new overlap runs | Start a documented epoch or promote a panel entry; retain both identities and prior results. |

Set budgets after the first qualified baseline. Use deterministic absolute limits for initial/eventual JS/CSS/font bytes, dependency duplication and critical requests. For timing, require a confidence interval beyond a practical regression margin, with both absolute and relative relevance. Example candidate policy: a startup regression exceeding both 5% and 20 ms, or an action regression exceeding both 10% and one measurable frame/16 ms, triggers confirmation. These are calibration proposals, not universal product targets or currently accepted gates. Below-threshold/censored timings need a different valid measurement, not fabricated precision.

Maintain absolute experience targets alongside regression budgets. The Web Vitals reference thresholds are LCP ≤2.5 s, INP ≤200 ms and CLS ≤0.1 at the 75th percentile of field visits. Use them as user-experience reference points; a laboratory fixture passing them is not a field pass or a guarantee for consuming applications. [Web Vitals](https://web.dev/articles/vitals).

Every accepted performance fix adds a focused scenario or budget. Waivers have an owner, reason, affected versions, expiry/revisit trigger and user-impact statement. Do not improve the score by silently changing scenarios, warming cold tests, dropping competitors or weakening correctness.

Include the new CLS aggregation/lifecycle checks and bfcache return scenario in harness qualification. Budget rendering/long-frame regressions as well as bytes, and preserve the successful-state assertions after restore or delayed mounting. Refresh the capability matrix when platform/metric support changes; new APIs or altered semantics start explicitly labelled measurements rather than rewriting historical series.

Store raw per-run JSON, network/resource records, summary tables, a small representative trace set, diagnostic evidence and failure logs under immutable run IDs. Keep hashes/configuration and baseline summaries durably even if large trace retention is bounded. Each result includes implementation/source/lock/build hashes, scenario and collector versions, browser/OS/hardware, network/CPU/cache/font/isolation settings, timestamps, randomization seed, success status and exclusion reason. Link findings and trends in the existing independent Progress Report.

## 11. Consumer performance documentation

Write an evidence-backed `En Reve performance guide` from the winning configurations, with runnable small examples and declared supported tool/browser versions:

- Public selective imports; definition dependency closures; avoiding unnecessary all-component registration and duplicate runtimes.
- Lazy feature/route boundaries, stylesheet/token delivery, upgrade/readiness handling, dimensions/placeholders and first-use tradeoffs.
- When to preload, including keyboard/touch behavior and wasted-byte cost.
- Rendering containment versus mounting boundaries; critical-resource priorities, font fallbacks and measured scheduling/worker tradeoffs.
- Local state/update boundaries, large-list patterns, lifecycle cleanup and avoiding repeated layout reads/writes.
- Supported SSR/hydration setup and preserving useful pre-hydration content/input behavior.
- Back/forward-cache compatibility and supported hard/soft/restore navigation measurement.
- Compression, caching, fonts, asset delivery and deployment-cache invalidation.
- Consumer-side measurements, regression budgets and a copyable CI recipe.

Each recipe states the baseline, measured benefit, any moved cost, required configuration, correctness constraints and a reproducible example. Distinguish automatic library guarantees, recommended consumer practices and workload-dependent options. Validate recipes in a clean consuming application so they do not depend on unpublished root aliases or benchmark-only helpers.

Optional later field validation can test representative real applications with appropriately scoped telemetry, providing the audience/device distributions that these local fixtures cannot. No telemetry deployment is included in this planning request.

Specify that future RUM recipe now: build/scenario-compatible version, navigation type and route at the event; LCP target/subparts; contributing CLS window/time/targets; and INP action type, stable component/action ID, load state and subparts. Segment by relevant device/navigation conditions and use stable identifiers rather than captured form values or user content. Check whether CrUX evidence is URL-level or origin-level before attributing it to a particular consumer page. Local showcase URLs cannot provide a representative field population. [Field attribution](https://web.dev/articles/debug-performance-in-the-field).

## Delivery sequence and completion criteria

1. **Qualify and freeze:** scenario/capability contract, immutable native baselines, serving/device profiles and correctness qualification.
2. **Implement and pilot harness:** early collectors, reproducible runs, overhead check, raw schema, capability detection and fixed statistical plan.
3. **Publish baseline comparison:** delivery/startup/interactions/memory, uncertainty and per-scenario strengths; reproducible evidence, no unqualified global ranking.
4. **Run targeted attribution and chunk experiments:** explain confirmed En Reve deficits and distinguish library work from fixture/delivery work; produce a prioritized engineering backlog.
5. **Verify selected improvements and consumer recipes:** before/after evidence, displacement checks, clean consumer examples and budgets.
6. **Operationalize recurrence:** versioned panel/onboarding, PR/release policy, deliberate baseline promotion, trend reporting and an agreed runner/cadence.

The first profiling pass is complete when every implementation has a qualified baseline or explicit unsupported result for each primary capability; every claimed En Reve shortfall has reproducible evidence and confidence; high-priority findings have an owner and concrete next experiment/fix; and the consumer guide plus recurring regression system can reproduce the results. Unresolved hypotheses stay labelled as such.
