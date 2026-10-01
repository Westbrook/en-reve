# Native showcase performance laboratory

An isolated, pinned Node project for the nine production showcases. It measures delivery, native browser rendering and successful user actions; it does not turn Lighthouse scores into a library ranking. Profiling dependencies and scripts live in this sub-project; none are added to the root application.

Read [the protocol](../../plans/native-showcase-performance-plan.md), [bundle evidence](reports/bundles.md), and [the implementation results](../../plans/native-showcase-performance-results.md). The `runs/` directory contains the original samples, including failed qualification attempts. It is deliberately ignored by Git; retain run directories in an artifact store when using CI.

## Scoped registry preparation

The separate [registry workflow lane](REGISTRY.md) uses the real settings, sign-in and chat workflows for scaling, upgrade containment, lifecycle retention, activation milestones and SSR/hydration checks. Run it with `node showcases/performance/src/cli.mjs registry`; its current-source fixture and summary are independent of the frozen external showcase panel.

## Start

Run these from the repository root with Node 26.10.0 Current (or supported Node 24.21.0 LTS), npm 12.1.0 and OpenSSL available:

```sh
npm --prefix showcases/performance ci
cd showcases/performance
npx playwright install chromium
cd ../..
npm --prefix showcases/performance test
npm --prefix showcases/performance run prepare:lab
node showcases/performance/src/cli.mjs functional
node showcases/performance/src/cli.mjs calibrate
npm --prefix showcases/performance run qualify
```

The existing showcase projects must already be installed and built (`node showcases/tools/install.mjs`, then `node showcases/tools/build.mjs`). Preparation composes the explicit `registry/verification-receipts.json` catalog: the original eight-system receipt plus the separate Web Awesome receipt. It checks all selected IDs and, outside candidate mode, every recorded source/build hash before writing snapshots. Conflicting receipts fail preflight; original receipts are never rewritten. Use `--receipt <file>` for a selected addition or `--receipts <file1>,<file2>` for an explicit alternative composition. All emitted asset bytes are independently hashed. The local certificate is used only by the measurement browser; no operating-system trust setting is changed. Servers bind to loopback. Tool installation, builds, compression and certificate generation happen outside timed samples.

The default native panel remains frozen. For deliberately rebuilt fixtures, use `prepare:lab -- --candidate --reason "description of change"`, then run `functional`. This archives changed snapshots and marks new ones unqualified until all native checks pass. It does not promote a timing baseline. Newly added systems also need an entry and functional receipt in the fixture registry/verification contract.

## Run experiments

```sh
# Five randomized blocks, nine systems, two profiles, cold and warm visits: 180 samples.
npm --prefix showcases/performance run pilot -- --id my-pilot

# Thirty blocks per cell: 1080 fresh browser processes, run serially.
npm --prefix showcases/performance run baseline -- --id my-reference

# Run an explicitly selected smaller matrix without changing the protocol.
node showcases/performance/src/cli.mjs run --suite load --profiles mobile --caches cold --samples 30 --id mobile-reference

npm --prefix showcases/performance run interactions -- --id my-interactions
npm --prefix showcases/performance run memory -- --profiles desktop --id my-memory
npm --prefix showcases/performance run lighthouse -- --id my-lighthouse
node showcases/performance/src/cli.mjs run --suite diagnostic --samples 1 --id my-diagnostics
node showcases/performance/src/cli.mjs diagnostics --run my-diagnostics
node showcases/performance/src/cli.mjs run --suite bfcache --samples 5 --id my-bfcache
node showcases/performance/src/cli.mjs run --suite overhead --samples 5 --systems en-reve,fluent-web-components --profiles desktop --id my-overhead
node showcases/performance/src/cli.mjs bundles
```

Do not run benchmark browsers concurrently, and do not build, profile or capture screenshots during a reference campaign. A developer workstation with concurrent activity provides exploratory evidence. Dedicated runner measurements must record power mode, thermal/noise conditions and display/browser settings. Headless Chromium plus CPU/network emulation is not a physical mobile device or a field percentile. Browser CDP network emulation does not make the local server's underlying response-start timestamps representative of a remote backend.

Every run has an immutable ID. Reusing an ID fails rather than overwriting evidence. Each manifest records the job schedule and seed, browser/profile settings, host and power information, package/build hashes and the harness identity. Each completed sample is appended immediately, so interrupted runs remain inspectable. Harness sources are copied into primary run directories. Runs with failures return a nonzero exit code and still produce a report. Re-run under a new ID after fixing a defect; never remove slow or failed samples to improve a score.

`--systems`, `--profiles`, `--caches`, `--samples` and `--seed` select an explicit matrix. Memory additionally accepts `--checkpoints 0,10,50,100`; a short pilot can use `0,10`. The memory lane disables the accumulating timing collector so its entry arrays do not masquerade as application memory growth. Memory and BFCache use the full bundled Chromium in new-headless mode; primary timing uses the bundled Chromium headless shell. These are separate cohorts. The memory API can exist yet reject a call or time out; preserve those states. The default registry contains eight external implementations and En Reve; the original eight-system measurements remain frozen historical evidence. All use their existing native default appearance and CSR technology.

## What is actually measured

| Area | Evidence and interpretation |
| --- | --- |
| Delivery | Exact raw/gzip9/Brotli11 asset sizes, static/dynamic import graph, source-map package attribution, local font files; network responses preserve protocol, encoding, cache flags and encoded bytes. Remote font identities are captured in diagnostic reruns where accessible. |
| Startup | Native navigation/paint/LCP/CLS entries; `web-vitals/attribution` subparts; sixteen-card DOM and two-rAF frame opportunity milestones; CDP script/style/layout/task durations. The card milestone is not proof every control is usable. Functional and interaction suites test usability separately. |
| Interaction | Trusted browser input; canvas changes, collection updates, review submission, dialogs and commands; native Event Timing split into input/processing/presentation delay; semantic result and subsequent frame opportunity. First and repeated actions are separate. Native overlay exit animations settle before the next independent action. |
| Continuous work | rAF intervals during a fixed scroll journey plus Long Animation Frame entries. rAF intervals are scheduling diagnostics, not compositor-presented frame timestamps or a physical refresh-rate measurement. |
| Memory | Separate HTTPS origins with COOP/COEP, feature-detected `measureUserAgentSpecificMemory`, timeout/error states, JS heap and DOM/listener counters, repeated lifecycle checkpoints. API memory and CDP JS heap are different scopes and never substituted into one ranking. A sampled maximum is not a true peak; growth alone is not proof of a leak. |
| Diagnostics | Chrome timeline/CPU trace, precise JS/CSS coverage, native metric attribution and DOM counters. Diagnostic timings stay out of primary distributions. Unexecuted code is not automatically removable. |
| Lighthouse | Pinned Chromium and Lighthouse; Lighthouse applies its own DevTools throttling in this lane, without an additional external throttle. Primary mobile lanes apply their separately recorded CDP limits. Full HTML/JSON reports retained. Scores are secondary diagnostics; raw FCP/LCP/CLS/TBT/Speed Index remain available. |
| Lifecycle | Metrics finalize on an actual navigation/hide using a small same-origin beacon. BFCache uses direct Chrome protocol navigation and trusted mouse input, reports `pageshow.persisted`, document identity, restore reasons and successful actions after return; automation/CDP eligibility limitations are explicit. |

Observers are installed before application code, feature-detected per entry type and buffered. Resource buffers are enlarged and overflows fail qualification. Raw Event Timing uses the 16ms threshold and browser quantization; absence is never reported as zero. The collector retains interaction IDs. Scripted-session INP describes this bounded journey, not real-user p75 INP. Load-only samples contain no clicks, so early input does not artificially terminate LCP collection. The standard observation window is load plus 1.5 seconds and card readiness; this is a bounded lab window, not an entire user visit.

The native fixture ships no profiling code. The collector is injected by the harness, and its overhead has its own suite. Final collection beacons occur after the measured work. All sources and raw samples are available for inspection. External resource sizes hidden by browser timing restrictions are identified rather than silently counted as free.

## Experiments and current-library regression

```sh
node showcases/performance/experiments/build-en-reve.mjs
node showcases/performance/experiments/verify-delivery.mjs
node showcases/performance/src/cli.mjs functional --variant split-vendor
node showcases/performance/src/cli.mjs run --suite load --systems en-reve --variant split-vendor --samples 30 --id vendor-comparison
```

Other variants are `lazy-commands`, `intent-commands` and `content-visibility`. `split-vendor-edit` changes only authored application code and tests vendor hash retention across deployment. The family fixtures measure shell/button/forms/overlays/date import costs; they are attribution builds, not complete native showcase competitors. Every timed variant must have a passing full functional receipt for its exact fingerprint.

To test current En Reve source rather than the frozen tarballs:

```sh
# Run in a clean checkout/reference worktree. Builds the four root library packages.
node showcases/performance/experiments/build-current.mjs
node showcases/performance/src/cli.mjs functional --variant current-en-reve
node showcases/performance/src/cli.mjs run --suite load --systems en-reve --variant current-en-reve --samples 30 --id current-library
```

The current-library script builds tokens, styles, primitives and elements using their native build commands, packs them locally, and installs content-addressed tarballs into `.cache/current-consumer/en-reve`. It reuses the unchanged fixture source and its isolated Vite pipeline. Profiling dependencies are not added to root packages, and frozen vendor tarballs remain untouched. Native package builds may regenerate their normal outputs/exports; use a clean reference checkout. Keep each run's inventory and candidate tarballs when archiving release evidence. Run the library's own correctness suite before accepting a performance change.

For an owned functional run, pass its exact receipt to the acquisition:

```sh
node showcases/performance/src/cli.mjs functional --variant current-en-reve --id my-qualification
node showcases/performance/src/cli.mjs run --suite load --systems en-reve --variant current-en-reve --functional-receipt reports/functional-my-qualification-current-en-reve.json --samples 30 --id my-acquisition
```

Use an absolute receipt path, or a path relative to the performance lab directory (`reports/functional-my-qualification-current-en-reve.json`). The option requires a variant and a passing Chromium receipt for its exact fingerprint. An explicit missing, invalid, failed or mismatched receipt never falls back to another file. Each acquisition records the selected path and SHA-256 in `variantQualificationSource`. Omitting the option preserves the standalone default receipt location. Specialized sentinel/full graphs bind their own unique producer receipt without overwriting the standalone default.

## Statistics and regression policy

Reports provide n, failures, median, p75 and range. p95 is only emitted at n≥100. Comparisons within one campaign use a seeded paired-block bootstrap of median differences; historical campaigns use independent-session bootstrap. Confidence intervals are exploratory and have no multiple-comparison correction. Practical thresholds and independent confirmation are required before accepting a regression, optimization or published superiority claim.

```sh
node showcases/performance/src/cli.mjs promote --run my-reference --name reference-2026-09 --reason "Qualified release anchor on the reference host"
node showcases/performance/src/cli.mjs check --run current-library --baseline baselines/reference-2026-09/baseline.json
```

Promotion requires a complete, failure-free native load or interaction run with at least thirty samples in each included cell, a unique name and a reason. It records exactly which cells were sampled; a partial matrix never becomes a claim about unmeasured cells. Baselines never advance automatically. Promotion retains the exact collector and harness sources with the raw samples. Deterministic JS/CSS budgets flag growth exceeding the larger of 1 KiB or 2%; review these initial defaults against product needs. Separate action checks use the larger of 10% or 16ms for semantic readiness and frame opportunity; they catch regressions hidden by an unchanged session INP. Load and interaction anchors are promoted separately. Timing checks require matching harness/host/OS/browser/profiles and enough samples. A timing increase is flagged only when the lower confidence bound exceeds the larger of 10% or 50ms (16ms for scripted INP). Confirm on a separate run before blocking a release. A changed protocol requires an overlap study, not a silent rebaseline.

Use three lanes: immutable release anchor, fixed external panel, and explicitly qualified challengers. Add systems through `registry/systems.json`, native fixture/lockfiles/verification and scenario adaptation; unsupported behaviors are recorded in the coverage ledger. Refresh browser/library versions in separate changes, run overlap samples and retain the previous identities. Do not mix a dependency upgrade with a performance fix when attributing a difference.

Set both `PERF_BASELINE` and `PERF_INTERACTION_BASELINE` to explicitly promoted, compatible anchors before running sentinel/full lanes. `ci/run-lane.mjs` implements qualification, sentinel and full lanes. `ci/performance.yml` is an installable GitHub Actions template for a dedicated runner labelled `en-reve-performance`; it is intentionally not an active schedule. No runner, credentials or background automation has been provisioned by this implementation. Activate PR qualification, nightly En Reve sentinels, weekly fixed-panel comparisons and prerelease full campaigns once a reference runner is assigned. A sentinel must build `current-en-reve`, qualify it, and check the chosen immutable anchor; benchmarking only the frozen example cannot protect future library changes.

The full lane discovers every registered native system, including Web Awesome, and runs load, startup, interactions, diagnostics, memory, Lighthouse, BFCache and observer overhead as separate suites. Startup and observer overhead add observational coverage; they do not introduce new release gates. The sentinel retains its explicit En Reve, Fluent WC and Radix panel. Both regression lanes still gate only the separately built current En Reve load and interaction runs against explicitly chosen compatible baselines. New systems require review in size comparisons; a changed harness requires an overlap study and deliberate promotion rather than changing the historical anchor automatically.

The inactive self-hosted template permits 480 minutes at the job level. A full nine-system cycle is estimated to take several hours, including separate memory sessions through 100 workflow cycles; actual runtime depends on the runner and must be reviewed after its first qualified execution. This is a runtime allowance, not an enabled schedule. GitHub documents separate job, step and self-hosted runner limits in its [Actions limits reference](https://docs.github.com/en/actions/reference/limits).

## Explicit coverage boundaries

The original fixed-panel implementation covers static CSR showcases on local Chromium. The registry workflow lane adds explicitly qualified engine and SSR cases described above. Physical Android, shipped Safari, a deployment-like CDN/backend, SSR/hydration, soft-navigation consumer routes and real-user monitoring need their own qualified environments/fixtures. These are not represented by empty numeric results. The existing pages have no route transitions, substantive image decoding, data-heavy grids or expensive background computations; adding artificial work would answer a different question. Long-task evidence should justify workers or task splitting before those techniques are recommended.

Primary references: [PerformanceObserver](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver), [web-vitals](https://github.com/GoogleChrome/web-vitals), [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview), [browser memory API](https://developer.mozilla.org/en-US/docs/Web/API/Performance/measureUserAgentSpecificMemory), [web.dev performance](https://web.dev/performance). The local runner adopts repeated randomized measurement from [Tachometer](https://github.com/google/tachometer) without depending on its archived launcher.

Current-source validation on this working tree stopped at the elements TypeScript build because `EnQueryBuilder.remove` conflicts with the inherited DOM method. See [the receipt](reports/current-source-build.json). No current-source timing candidate was accepted. The frozen native panel is independent of that failure.

The first mobile-cold anchor predates final diagnostic/qualification refinements. Its original harness is retained inside the baseline directory. The current harness correctly rejects timing comparisons to that earlier hash; run an overlap campaign and explicitly promote a new anchor before enabling CI timing gates. Deterministic byte comparisons remain available.

BFCache uses direct CDP after browser launch because [Playwright documents that its Page lifecycle tracking does not support BFCache restores](https://playwright.dev/docs/navigations). The first Playwright-based pilot is retained as a failed harness qualification, not evidence of a library cache defect.

## Second pass and grouped result tables

Regenerate the retained second-pass evidence and reader after collection:

```sh
node showcases/performance/experiments/summarize-pass2.mjs
node showcases/performance/experiments/archive-pass2.mjs
npm --prefix showcases/performance-results run build
```

`run-pass2.mjs`, `finish-startup-v2.mjs`, and `finish-startup-v3.mjs` are the historical execution recipes for this named pass, including its superseded startup pilot. Their campaign IDs are immutable; do not rerun them over existing evidence. The current `startup` suite uses the corrected animation-frame probe. Start future campaigns through the normal CLI with fresh IDs, repeat the relevant calibrations, and update a copied summarizer's explicit cohort mapping. Never combine changed harness epochs just because their suite names match.

For example, with an unused run ID:

```sh
node showcases/performance/experiments/calibrate-startup.mjs
node showcases/performance/src/cli.mjs run --suite startup --samples 10 --profiles desktop,mobile --caches cold --id my-next-startup
```

The runner retains failed journeys. Do not build or run browser tests while a measurement campaign is active. The summarizer can read completed sample lines while collection is ongoing; its generated tables explicitly report status and missing measurements. It inserts a bounded generated section into the results Markdown, preserving the historical first-pass report.

`startup` sends one trusted Landscape click at frame-observed visible geometry, without waiting for load or settling. It exposes probe elapsed work, discovery/dispatch delay and navigation-to-result, as well as click-to-result/frame latency. There is no retry. Calibration includes a lost pre-handler click. Because input ends LCP eligibility, startup LCP is unavailable and never mixed into load distributions. This tests a particular visible control, not universal application readiness or the earliest possible usable instant.

`deliveryMetrics` includes the navigation document and completed subresources using CDP response-byte totals captured before lifecycle navigation. It excludes the measurement beacon and away page. These are browser-reported response bytes, not full TCP/TLS packet accounting. Resource Timing transfer/header accounting is retained separately. Missing completion yields an unavailable total rather than a partial total presented as complete. Offline raw/gzip/Brotli emitted sizes remain separate from what a visit actually fetched.

After collection and summarization, `node showcases/performance/experiments/archive-pass2.mjs` retains compressed raw samples, manifests, summaries, and the exact measurement harness in `reports/pass2-evidence/`. The receipt records hashes of both original and compressed bytes. Decompress with `gzip -dc <file.gz>`; the harness archive is a JSON array of relative paths and text contents. The larger original browser campaign folders and Lighthouse audits remain in `runs/` as well. This pass does not promote a regression anchor automatically.

The second-pass startup v1 pilot is retained but superseded: Playwright locator visibility polling added library-dependent discovery delays. The replacement startup lane injects an animation-frame geometry probe before navigation, records discovery-probe elapsed time and dispatch delay, refreshes coordinates before one trusted click, verifies the composed-path input target, and checks semantic completion. The v2 qualification also exposed stale coordinates during Fluent WC layout; v3 adds fresh dispatch geometry and target validation. Historical recovery scripts calibrated missing handlers and discovery delay before collecting the replacement cohort. Do not reuse run IDs or mix the superseded pilot into comparisons.

## Connected DOM review

The focused census is diagnostic, with no timing or heap-ranking claims. Run `node experiments/run-dom-review.mjs <fresh-run-id>` to collect three desktop initial/journey repetitions per implementation, three independent custom-date open/close sessions, and one narrow initial visit per system. It preserves the frozen artifacts and validates a small known tree before collection. Use a new run ID; retained qualification attempts are not reference data.

`node experiments/run-dom-ownership.mjs` produces a supplementary initial census partitioned by direct shadow-root owner, avoiding attribution of slotted application content to component templates. This command replaces its derived `reports/dom-review/shadow-ownership.json`; archive a previous report before refreshing it. After a complete qualified census, `node experiments/report-dom-review.mjs <run-id>` verifies accounting and repeatability, regenerates `plans/native-showcase-dom-review.md`, and replaces only the marked DOM review section of the main results document. Regenerate the separate HTML reader afterward. Source audits and their hashes must be refreshed deliberately when current-source changes affect recommendations.

The report retains totals with and without complete date fields, node types, card attribution, date lifecycle, shadow ownership, slot usage, all base-part declaration sites, migration constraints and proposed acceptance checks. Removing a field from census arithmetic is not a rebuilt/date-free performance variant. Author-visible roots exclude closed/UA internals; slot distribution is counted once. Runtime node deletion and component optimization are outside this review.


## Web Awesome comparison expansion

Web Awesome is an additive frozen fixture pinned to `@awesome.me/webawesome` 3.13.0 with its shipped Default light theme; the original eight snapshots and measurements remain intact. The frozen Fluent WC control uses `@fluentui/web-components` 3.1.3. Exact dependencies and artifact fingerprints are in [the final inventory](reports/web-awesome/inventory.json). See [adding a system](ADDING_SYSTEMS.md) for isolation, qualification and version requirements. The [Web Awesome results](../../plans/native-showcase-web-awesome-results.md) distinguish newly acquired three-system comparisons from the historical nine-system overview.

After the new fixture is built and qualified, the serial acquisition command is:

```sh
node showcases/performance/experiments/run-web-awesome.mjs
```

This specific queue starts with immutable `web-awesome-*-v1` IDs and refuses to overwrite its execution receipt. For a later acquisition, copy/change the configuration and IDs deliberately; do not rerun it to replace undesirable samples. Its 306 samples cover the existing load, startup, interactions, Lighthouse, memory, diagnostic, BFCache and observer-overhead lanes for Web Awesome plus frozen En Reve and Fluent WC controls. Complete builds and browser QA before timing begins.

The original queue completed 255 samples before another task acquired the browser lock at the memory boundary. No `memory-v1` acquisition was created. `experiments/resume-web-awesome.mjs` is the bounded recovery recipe: it retains the original execution receipt, verifies and preserves all completed sample hashes, gives memory the new `web-awesome-memory-v2` ID, and holds one shared lock across the remaining 51 samples. It waits for a live lock owner rather than interrupting another campaign. The canonical execution receipt records both dispatches; this script is not a general retry mechanism for failed or undesirable measurements.

Separate structural and reporting steps are:

```sh
node showcases/performance/experiments/run-dom-review.mjs web-awesome-dom-v1 --systems en-reve,fluent-web-components,web-awesome
node showcases/performance/experiments/run-dom-ownership.mjs --systems en-reve,fluent-web-components,web-awesome --output reports/web-awesome/shadow-ownership.json
node showcases/performance/src/cli.mjs diagnostics --run web-awesome-diagnostic-v1
node showcases/performance/experiments/archive-web-awesome.mjs
node showcases/performance/experiments/report-web-awesome.mjs --config reports/web-awesome/config.json --integrate
npm --prefix showcases/performance-results run build
```

The report config retains exact cohort IDs and evidence paths. New paired contrasts are only within the new randomized campaign. Historical values in the nine-system overview are explicitly labelled and are descriptive comparisons, never silently pooled samples. The new En Reve-inspired theme is available in current project demos; neither it nor current En Reve source replaces the frozen default benchmark control.

Web Awesome retains native date input, Card, Rating, ColorPicker and offscreen tab behavior; free select does not reproduce a searchable Pro Combobox. Initial tab content is mounted and qualified by actual scrolling. Native dialog/drawer accessible-name limitations are recorded in [fixture qualification notes](../web-awesome/README.md); passing the measurement adapter is not accessibility certification. Structural coverage comprises 30 connected-DOM snapshots and three ownership snapshots, including complete date-field exclusions and En Reve's custom-date lifecycle.

Delivery totals are replayed from retained raw observations using HTTP(S) responses only. The original aggregate counted nine embedded Web Awesome SVG fetches (4,683 bytes already carried in JS) as wire transfer, plus a zero-byte data image. Successful-load-sample medians for corrected Web Awesome delivery are 94,111 cold bytes and 260 warm bytes, compared with captured aggregate medians of 98,794 and 4,943. Raw samples and historical rows remain unchanged. [Machine-readable tables](reports/web-awesome/tables.json) preserve the correction ledger and exact analysis-source hashes; local-scheme response counts are diagnostics, not additional network bytes.

## Spectrum WC Gen2 performance refresh

The selected Spectrum fixture now uses `@adobe/spectrum-wc` 2.0.0-beta.3 plus Gen1 1.12.2 controls. Its [refresh protocol and evidence](reports/spectrum-gen2/README.md) preserve the earlier Gen1 artifact and acquisitions while collecting unchanged En Reve/Fluent controls. The main reader identifies refreshed Spectrum rows by generation and acquisition; historical paired contrasts remain historical. Run the Spectrum report integration last when regenerating earlier comparison sections. This selected refresh does not overwrite the original qualification receipt or promote a regression baseline.

## En Reve main refresh

The September 23 main refresh is documented in [reports/en-reve-main/README.md](reports/en-reve-main/README.md). Its explicit standalone qualification receipt is `../verification-en-reve-main.json`; default historical receipt catalogs remain immutable. That September 23 acquisition used tracked-clean local main `6d09b31c`, packed into content-addressed tarballs. Only En Reve is replaced in the current inventory; all eight peer artifacts remain preserved. Use the new acquisition IDs and integrate this refresh after historical generators.
