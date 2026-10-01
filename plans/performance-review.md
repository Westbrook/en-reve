# SSR sticker-sheet performance review

Review date: 2026-09-08. This document retains historical local measurements for the first SSR feedback iteration. Its timing and compression tables have not been refreshed for later typography/rhythm/overlay revisions; it is not a performance budget or a current release-wide compatibility assessment.

## Current continuation — 2026-09-10

The prior `d7b11e1d3cec` [stylesheet-adoption receipt](../artifacts/adopted-styles/verification.json)
records shared-sheet counts and unchanged observed paint/geometry; it left
initial SSR CSS in the response. Final local build `edd09329014f` decomposes
button/link action styles at source while retaining inline no-JS first paint
and post-hydration shared sheets. The final [aggregate receipt](../artifacts/asset-browser-followups/verification.json)
retains 12 action-leaf and 33 adopted-style cases for unchanged library sources.

The [offline SSR receipt](../artifacts/asset-browser-followups/ssr-css.json)
records per-owned raw button CSS 41,111→15,450 bytes (62.4%) and link
CSS 38,786→3,289 (91.5%). Repeated response CSS remains. Each independently
compressed block is not its marginal contribution to a complete response;
whole-route differences include added asset/content/motion features. Preserve
the recorded distinction from the same-content offline counterfactual. No
hosted-transfer, startup, TTFB, CPU, parse, memory or latency gain is claimed.

External shadow stylesheet loading is not introduced: exploratory collection
extraction could worsen cold Brotli transfer. The intermediate bbb26 build is
retained as history; its later workflow color-scheme correction changes the
final document identity without changing the action-style implementation.
All timing/compression tables below retain their original artifact scope.

Publication correction: a later live accessibility check found whitespace masking the rating example's label fallback. The example now supplies an explicit named label slot. The corrected HTML hash is `97006cad7632072ac2b53eba333aea61792a3ddb983268551584b5c5850f460e`. Browser and SSR evidence was refreshed for that correction; the timing samples below remain evidence for the preceding `fecd44ee…` artifact and were not rerun or relabeled.

The measured `fecd44ee…` sticker sheet rendered styled content before its JavaScript ran, deferred syntax highlighting until a source disclosure opened, and showed no idle resize-observer or theme-write loop in these samples. Repeated shadow CSS was the largest raw payload in that artifact. Those samples did not establish a hard performance blocker requiring a stylesheet loading redesign. The synthetic CPU slowdown identified follow-up work in startup and theme changes; current costs remain unmeasured.

## Later review evidence and remaining measurement work

The typography-era retained checkpoint, located through `.progress-report/project.json` at `evidence/control-typography/verification.json` in the report workspace, identifies source `0d0b4265701b9102d1530bee63330ce879de327d`, documentation HTML `0712fe49c62eaaf5da9ee53301c758ba48183deb62cb77e1d6037e0b1f90e60b` (3,897,639 raw bytes), and report UI snapshot `12136386896edeb21c11bd9fac3c034d4adabfc77f7cd92dcc9a122700195318`. Focused typography/sizing and read-only report browser results are retained there. This raw size is artifact inventory, not a fresh loading, hydration, interaction, compression or budget result. Do not apply the tables below to the newer checkpoint.

The review introduced a shared minimum control envelope and coordinated UI/input/strong-label typography. Repeated envelope expressions were reduced with private CSS properties defined on their actual consuming selectors, including coarse-pointer overrides; interpolation remains inside each `sizedStyles` input so static sizing-role discovery still sees its dependencies. Preserve local computation rather than hoisting to a host where inherited substitutions could freeze before descendant overrides. The payload motivation is documented; a runtime-speed improvement has not been measured. Any further minification/deduplication should compare equivalent artifact pairs plus the focused rhythm/native-control checks, without adding a new shadow stylesheet loading dependency merely to improve the raw byte count.

That typography evidence covers three installed desktop engines, 432 lightweight typography configurations and representative editing/geometry/SSR checks. It does not establish physical devices, current-minus-one products/frameworks, manual AT, accepted VRT references, end-to-end cache reuse or the full performance program. Typography SSR checks suppress application scripts while retaining browser evaluation; that is distinct from a JavaScript-disabled browser suite or isolated hydration CPU. Preserve the native WebKit rem and Firefox select/touch comparisons described in `plans/verification.md`; geometry/timing assertions must not redefine known engine behavior as a library pass.

Before making a new performance claim, promote the reusable temporary/report probe logic to the owning durable fixture, bind its script/configuration and actual served assets to a complete run manifest, and record response hashes before/after the run. Keep historical evidence immutable. The independent report is a separate bundled snapshot and workload; its passing read-only smoke neither proves the documentation payload cost nor refreshes older report-persistence checks. A failed visual capture remains missing visual evidence even when behavior/audit checks pass.

Next measurements stay focused: artifact/raw/served-encoding comparison for the changed CSS families; normal loading and representative theme/rhythm changes; then repeated samples or diagnostic traces only when an observed cost calls for them. Retain the wider hardware/network, first-usable-interaction, three reference-workflow, memory/cleanup, developer-cycle and budget work in `plans/verification.md`. No new timing run, budget adoption or performance optimization result is implied by this plan update.

## Reviewed artifact and environment

- Measured `dist/index.html` SHA-256: `fecd44ee2c483d2a4ac143e952f7456a73c7a11a6253088994227238be9698d8`.
- Each of nine browser samples received that exact HTML hash. The on-disk HTML hash also matched before and after each three-sample run. Asset hashes and compression sizes are recorded in each evidence file.
- Chromium `153.0.8010.12`, Playwright `1.63.0`, Node `v24.16.0`; Apple M5 Max, macOS kernel `25.6.0`, arm64; fresh browser contexts at 1440 × 1000, English/LTR/default initial settings and normal motion.
- Static production output served over unthrottled loopback HTTP on port 4196. The server transferred uncompressed files. Gzip level 9 and Brotli quality 11 below are offline encodings of the actual artifacts; they are not observed hosted transfer sizes.
- Three staged SSR samples held script requests until the browser displayed the server-rendered sheet. Three natural-navigation samples used normal script loading. Three further natural-navigation samples used Chromium's synthetic 4× CPU multiplier and opened all 23 source disclosures.
- The CPU multiplier is a diagnostic on this host, not a model of a particular Android or iOS device. These results do not establish performance across 4G, physical phones/tablets, other orientations, locales/RTL, multiple monitors, assistive technologies, or the accepted current-minus-one browser/framework matrix. There is no field sample, percentile claim, accepted numeric budget, or measured startup/build-tool budget here.

## Payload actually requested

All sizes are bytes. The initial set below is derived from browser resource entries, rather than summing every generated chunk in `dist`.

| Initial resource | Raw | Gzip 9 | Brotli 11 |
| --- | ---: | ---: | ---: |
| `index.html` | 3,656,771 | 280,688 | 27,232 |
| `assets/index-DuQAJN2i.js` | 252,596 | 63,650 | 53,398 |
| `assets/preload-helper-Czpn1I53.js` | 1,196 | 675 | 558 |
| `assets/index-Dan92JV5.css` | 36,937 | 5,628 | 4,820 |
| **Initial total** | **3,947,500** | **350,641** | **86,008** |

The first source disclosure then fetched the microlighter chunk plus the JavaScript and TypeScript grammar chunks: 12,561 raw bytes, 5,030 gzip bytes, or 4,444 Brotli bytes in total. They were absent from initial resource entries and the initial `CSS.highlights` registry was empty. Other generated grammar files were not requested during these journeys.

The document contains 149 declarative shadow roots and 150 style nodes. Inline style contents account for 3,431,473 bytes, or approximately 93.8% of the raw HTML. Distinct complete style strings account for 461,019 bytes; this counts unique full sheets, not unique declarations or browser memory. Family-local sizing declarations replaced the earlier universal role block during this iteration, but substantial repetition remains. Brotli compressed this artifact's repeated text much more effectively than gzip in the offline comparison. Neither result removes the browser's decoded document or style work.

This is the deliberately comprehensive documentation sheet. Its all-component app entry is not evidence that a selective library import loads the complete inventory; that remains a separate packed-consumer validation surface in `plans/verification.md`.

## Observed render and interaction work

Ranges below are the minimum and maximum of three samples in each scenario. They are diagnostic observations, not targets.

| Observation | Normal natural navigation | Staged SSR, normal CPU | Natural navigation, synthetic 4× CPU |
| --- | --- | --- | --- |
| Browser FCP and last pre-interaction LCP candidate | 56–64 ms | 60–64 ms, before scripts were released | 148–152 ms |
| Script release to observed app update completion | Not isolated | 56.5–61 ms | Not isolated |
| Initial long task | One 56–57 ms task per sample | None recorded | One 205–216 ms task per sample |
| First theme click to two animation frames | 45.4–57.2 ms | 46.3–53.1 ms | 134.9–138.1 ms |
| Subsequent theme clicks to two animation frames | 30.5–31.4 ms | 30.2–31.2 ms | 105.1–124.5 ms |
| Long tasks during the three theme changes | None recorded | None recorded | 101–110 ms per change |
| First code disclosure to highlight-ready marker | 19.1–20.3 ms | 20.0–22.2 ms | 40.1–44.9 ms |
| Idle observer callbacks / theme writes / long tasks over 500 ms | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |

The LCP candidate was the page heading in every sample. The staged run also inspected the server-rendered action button's real dimensions and computed background inside its shadow root while scripts remained gated; the sheet had all 149 shadow roots. Staged timing proves the application-script-gated rendering path for that artifact, while the ungated samples characterize its natural loading sequence. Browser evaluation remains enabled; this does not certify a JavaScript-disabled browsing environment or early-input preservation.

The script-release interval includes network request completion on loopback, module evaluation, element upgrade and Lit work through the app's observed `updateComplete`; it is not isolated hydration CPU. Natural navigation's recorded `navigationToObservedAppUpdatedMs` additionally includes automation observation latency and is not reported as time to interactive. The click-to-two-frames interval uses an in-browser click capture listener, but is not Event Timing or INP. The separately recorded driver-inclusive durations must not be presented as user input latency. Long-task entries alone do not attribute time between token compilation, JavaScript, style recalculation and layout.

Every opened disclosure had actual CSS Highlight ranges anchored in its code node; a dataset flag alone was not accepted as evidence. In the 4× CPU scenario, all 23 panels remained open by the end of each run. After the first panel, highlight readiness was generally 16.6–31.1 ms. The `popover-tooltip` panel was a repeatable 69.4–75.0 ms outlier. One sample recorded an additional 50 ms task during the disclosure sequence; the probe does not attribute it to tokenization. All nine samples completed without page errors.

## Historical findings and follow-up leads

Reconfirm the current source before acting on implementation-specific leads below; these observations describe the measured artifact, and subsequent changes may alter their cost or code path.

| Priority and owners | Evidence and next step |
| --- | --- |
| Hosting verification — release owner | Record actual hosted `Content-Encoding`, cache behavior and resource transfer sizes for this fingerprint. Offline initial totals differ from approximately 351 KB gzip to 86 KB Brotli, while this probe's local server sent approximately 3.95 MB uncompressed. Do not turn either offline figure into a hosted speed claim. |
| Startup profiling — Westbrook and Brad | The consistent 205–216 ms startup task under synthetic CPU slowdown is more useful than raw byte count alone for choosing the next optimization. Capture a focused CPU/style trace and test early real input on a representative constrained device before changing registration or hydration order. Preserve the visible, styled SSR result and native control behavior. |
| Theme/reset update work — Brad and Jina | `previewCSS` resolves the inverse theme and emits theme CSS in `updated()`, including updates that leave theme settings unchanged; the head style text is replaced each time. The slowed theme path has 101–110 ms tasks. Profile compilation versus style/layout first; then evaluate caching by all actual theme inputs and skipping identical style writes. Keep reset, nested scopes, density, direction and accent behavior covered. No runtime caching change was made for this review. |
| Repeated SSR CSS — Dieter and Westbrook | Continue with bounded, measured serializer minification or narrower shared style composition experiments. Compare raw/encoded bytes, pre-JavaScript computed styles, paint, hydration and focus/native-control behavior on the same artifact. A network stylesheet dedupe rewrite would add a new loading dependency; the current measurements do not justify introducing that risk merely to reduce the raw count. |
| Source highlighting — Brad | Retain lazy loading. Microlighter's current `highlightAll` replaces its registered ranges, so rescanning all open panels preserves previously highlighted panels. A per-panel skip guard would lose earlier highlights. Keep the 23-panel range check and the `popover-tooltip` outlier as regression evidence before pursuing an incremental highlighter integration. |
| Sticky navigation — Brad | No repeated callback/write activity appeared in each 500 ms idle window. The observed navigation height feeds section offsets rather than the measured navigation's own geometry. Retain the separate browser resize/anchor tests; this short idle sample is not a claim about every resize/scroll path. |

Physical-device and hosted-network measurements are the next evidence needed for the accepted smartphone-to-desktop scope. They should be attached to the same rendered fingerprint and named environment, then used to propose budgets. Build duration, dev startup, SSR generation time, memory, isolated parse/style costs and isolated hydration CPU were not measured here; successful builds and component behavior checks should stay separate from those future measurements.

## Evidence and reproduction

- `probes/performance-review/measure.mjs`: isolated browser/asset probe; no library or docs runtime edits.
- `probes/performance-review/summarize.mjs`: reads the recorded evidence and prints compact resource, paint, task and interaction summaries.
- `probes/performance-review/evidence/ssr-final-staged.json`: three final-hash staged samples.
- `probes/performance-review/evidence/ssr-final-natural.json`: three final-hash ungated samples.
- `probes/performance-review/evidence/ssr-final-cpu4-all.json`: three final-hash ungated 4× CPU samples, with all 23 panels opened. Its recorder label retains `ssr-cpu4-all-interim` because it was started before the parent confirmed the final build; the captured HTML and asset hashes match the final build throughout. The file was renamed without altering its recorded contents.
- Earlier `ssr-first.json` and `ssr-consolidated.json` contain an interrupted/changing-build run and a probe serialization failure respectively. They are excluded. `ssr-consolidated-final.json` is valid interim-build evidence for `6595c6bf…`, not the final reviewed artifact and not included in the tables above.

For a future authorized measurement, serve an identified immutable production output and run the selected scenarios sequentially. Record current script/environment hashes and actual response identity; these commands alone do not establish that the historical artifact is being served:

```sh
python3 -m http.server 4196 --bind 127.0.0.1 --directory dist
```

In a separate terminal:

```sh
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/en-reve-playwright EN_REVE_PERF_LABEL=ssr-staged-repeat node probes/performance-review/measure.mjs
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/en-reve-playwright EN_REVE_PERF_LABEL=ssr-natural-repeat EN_REVE_PERF_GATED=false node probes/performance-review/measure.mjs
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/en-reve-playwright EN_REVE_PERF_LABEL=ssr-cpu4-repeat EN_REVE_PERF_GATED=false EN_REVE_PERF_CPU_RATE=4 EN_REVE_PERF_ALL_DISCLOSURES=true node probes/performance-review/measure.mjs
```

Use a new label for each run, verify every sample and final hash match the intended artifact, and reject changing-build or failed-run evidence. The probe permits `EN_REVE_PERF_URL` for another local static server. Browser results are runtime observations; source/HTML parsing is used only to inventory artifact sizes and repeated stylesheet bytes.
