# Spectrum Gen2 comparison

Current consumer-policy follow-up: [calendar delivery variants](native-showcase-calendar-variants-results.md), measured separately from this report’s retained default/peer cohort.

**Reading measurement dates:** “Run ID” (previously “Acquisition”) identifies one recorded benchmark run, so its raw evidence can be traced. “Date (UTC)” is when its samples were measured—not when this report was rebuilt. A date range means sampling crossed UTC days; a dash means no timestamp could be recovered. Older peer rows retain their original dates.


<!-- BEGIN CURRENT EN REVE SUMMARY -->
## Current En Reve main baseline

En Reve is now measured from exact local main **6d09b31c**, using fresh package builds, the original eager CSR showcase and regenerated default light tokens. The new acquisition uses frozen Fluent WC/Web Awesome controls; it does not retrofit current data into old paired comparisons or enable scoped/lazy/SSR consumer policies.

Mobile median LCP is **644.0 ms cold / 304.0 ms warm**. The native fixture emits **439.5 KiB raw JS / 86.9 KiB Brotli JS**. These are whole-fixture costs; the detailed tables retain HTML, CSS, actual responses, main-thread, interaction, memory and DOM metrics.

[All current measurements and evidence](native-showcase-en-reve-main-results.md). [Sortable current comparison](http://127.0.0.1:4188/?progress-report#en-reve-main-comparison).

### En Reve main mobile cold loading

FCP is first contentful paint; LCP is largest contentful paint; CLS uses eligible session-window scoring. Cohort: **en-reve-main-load-v1**, mobile/cold. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | FCP ms | LCP ms | LCP p75 ms | CLS | CLS p75 | CLS max | TTFB ms | Cards frame opportunity ms | Last webfont response ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 644.0 | 644.0 | 662.0 | 0.000000 | 0.000000 | 0.000000 | 16.2 | 638.4 | — |
| Fluent Web Components | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 514.0 | 514.0 | 516.0 | 0.000000 | 0.000000 | 0.000000 | 15.8 | 508.3 | — |
| Web Awesome | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 600.0 | 600.0 | 611.0 | 0.000000 | 0.000000 | 0.000000 | 16.5 | 596.9 | — |

### En Reve main mobile warm loading

FCP is first contentful paint; LCP is largest contentful paint; CLS uses eligible session-window scoring. Cohort: **en-reve-main-load-v1**, mobile/warm. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | FCP ms | LCP ms | LCP p75 ms | CLS | CLS p75 | CLS max | TTFB ms | Cards frame opportunity ms | Last webfont response ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 304.0 | 304.0 | 310.0 | 0.000000 | 0.000000 | 0.000000 | 1.0 | 313.5 | — |
| Fluent Web Components | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 208.0 | 208.0 | 212.0 | 0.000000 | 0.000000 | 0.000000 | 1.0 | 215.0 | — |
| Web Awesome | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 246.0 | 246.0 | 252.0 | 0.000000 | 0.000000 | 0.000000 | 3.0 | 256.9 | — |

### En Reve main production payload sizes

One frozen build per implementation. Local-font zero does not imply no remote fonts; use browser transfer for actual responses.

| Implementation | JS raw KiB | JS gzip KiB | JS Brotli KiB | Initial JS Brotli KiB | CSS raw KiB | CSS Brotli KiB | Local fonts Brotli KiB | HTML raw KiB | HTML Brotli KiB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | 439.5 | 108.3 | 86.9 | 86.9 | 43.5 | 5.9 | 0.0 | 0.351 | 0.157 |
| Fluent Web Components | 281.2 | 69.3 | 57.1 | 57.1 | 4.2 | 1.2 | 0.0 | 0.364 | 0.173 |
| Web Awesome | 469.8 | 110.5 | 86.4 | 86.4 | 53.4 | 4.9 | 0.0 | 0.409 | 0.167 |

### En Reve main mobile interaction summary

Maximum scroll rAF gap is a scheduler diagnostic, not an inferred dropped-frame percentage. Cohort: **en-reve-main-interactions-v1**, mobile/cold. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Scripted INP ms | Scripted INP p75 ms | First input delay ms | Journey CLS | Max scroll rAF gap ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-interactions-v1 | 2026-09-24 | 10 | 0 | 56.0 | 62.0 | 3.2 | 0.000000 | 16.8 |
| Fluent Web Components | en-reve-main-interactions-v1 | 2026-09-24 | 10 | 0 | 64.0 | 64.0 | 3.3 | 0.000000 | 16.8 |
| Web Awesome | en-reve-main-interactions-v1 | 2026-09-24 | 10 | 0 | 48.0 | 48.0 | 2.8 | 0.000000 | 16.8 |

### En Reve main connected totals with and without dates

Initial settled desktop tree. Date boundaries follow the entire field, rather than only the visible input. En Reve main and both frozen controls are measured in the same diagnostic acquisition.

| Implementation | Samples n | Full nodes | Full elements | Date nodes | Date elements | Without date nodes | Without date elements |
| --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | 3 | 4667 | 1580 | 628 | 181 | 4039 | 1399 |
| Fluent Web Components | 3 | 2887 | 1284 | 28 | 12 | 2859 | 1272 |
| Web Awesome | 3 | 4210 | 1401 | 28 | 8 | 4182 | 1393 |

## Historical acquisition retained

The remaining tables and findings preserve their original build and acquisition. Their En Reve rows are historical, not the main baseline above.
<!-- END CURRENT EN REVE SUMMARY -->

This acquisition refreshes Spectrum Web Components to the pinned Gen2 beta plus Gen1 controls, using their native default styling. Frozen En Reve and Fluent Web Components are remeasured as contemporaneous controls. **The earlier eight-system measurements remain historical and unchanged.** Their identical-looking block numbers do not pair with these new samples. The main comparison tables explicitly label each acquisition; use the new three-system tables and within-cohort contrasts to investigate current delivery differences.

Every measurement table is sortable in the En Reve HTML reader. KiB = 1,024 bytes; MiB = 1,048,576 bytes. A dash is unavailable, never zero. Missing values sort last. Raw production JS means emitted/minified bytes before compression, not browser compiled-code memory. This is an exploratory workstation comparison of complete native fixtures, not a library-only ranking or a release gate.

Spectrum is refreshed to @adobe/spectrum-wc 2.0.0-beta.3 plus retained Gen1 1.12.2 controls. The same 306-sample protocol uses unchanged frozen En Reve and Fluent WC controls. Ten blocks per load profile/cache cell, ten startup and interaction blocks per profile, five mobile Lighthouse audits, one 0/10/50-cycle memory session, one diagnostic, five BFCache checks and five observer on/off pairs per system. Connected DOM includes 30 snapshots plus three ownership snapshots. Measurements are exploratory on a developer workstation. Existing historical Spectrum acquisitions remain retained; they are not paired with these new blocks. The inspired theme is not used in the frozen En Reve control.

[Machine-readable tables, distributions and input hashes](../showcases/performance/reports/spectrum-gen2/tables.json). [Campaign configuration](../showcases/performance/reports/spectrum-gen2/config.json). [Serial execution receipt](../showcases/performance/reports/spectrum-gen2/execution.json). [Retained raw evidence and source receipt](../showcases/performance/reports/spectrum-gen2/evidence/receipt.json).

### Spectrum Gen2 native-library identity

Pins, rendering, theme and artifact identity are read from the [final frozen inventory](../showcases/performance/reports/spectrum-gen2/inventory.json), not current working-tree packages. En Reve's file/tarball dependency identifies its locally packed baseline. Source and lockfile hashes remain in that inventory. The Spectrum-inspired En Reve theme is a separate artifact; it is not substituted into the frozen En Reve control.

| Implementation | Direct dependency pins | Rendering | Native theme | Artifact SHA-256 |
| --- | --- | --- | --- | --- |
| En Reve | @en-reve/tokens@file:vendor/en-reve-tokens-0.1.0.tgz; @en-reve/styles@file:vendor/en-reve-styles-0.1.0.tgz; @en-reve/primitives@file:vendor/en-reve-primitives-0.1.0.tgz; @en-reve/elements@file:vendor/en-reve-elements-0.1.0.tgz; lit@3.3.3; signal-polyfill@0.2.2 | client | single default light appearance | ab6e473521da65174a73e31d19160bcd7f9c46abf2553d462a0b3506a27233a9 |
| Fluent Web Components | @fluentui/web-components@3.1.3; @fluentui/tokens@1.0.0-alpha.24 | client | single default light appearance | 46b61dac3922571774265d590a5ac56b5c2355ed489ffef9610e127a1f5428b0 |
| Spectrum WC Gen2 + Gen1 | @adobe/spectrum-wc@2.0.0-beta.3; @spectrum-web-components/checkbox@1.12.2; @spectrum-web-components/color-field@1.12.2; @spectrum-web-components/combobox@1.12.2; @spectrum-web-components/dialog@1.12.2; @spectrum-web-components/field-label@1.12.2; @spectrum-web-components/menu@1.12.2; @spectrum-web-components/number-field@1.12.2; @spectrum-web-components/overlay@1.12.2; @spectrum-web-components/picker@1.12.2; @spectrum-web-components/popover@1.12.2; @spectrum-web-components/radio@1.12.2; @spectrum-web-components/slider@1.12.2; @spectrum-web-components/switch@1.12.2; @spectrum-web-components/textfield@1.12.2; @spectrum-web-components/theme@1.12.2 | client | single default light appearance | bf62dc00ccb1afac9f4f3803af44a1d06c9475ddb01d6da9efd949d9aa5d4fa4 |

### Spectrum Gen2 acquisition coverage

No failed sample is silently replaced. Primary loading, startup, settled interactions, Lighthouse, memory, tracing/coverage, observer overhead and back-forward cache have separate acquisitions and instrumentation. DOM census coverage is reported separately below.

| Campaign | Run ID | Date (UTC) | Planned samples | Recorded samples | Successful samples | Failed samples | Complete |
| --- | --- | --- | --- | --- | --- | --- | --- |
| load | spectrum-gen2-load-v1 | 2026-09-22 | 120 | 120 | 120 | 0 | Yes |
| startup | spectrum-gen2-startup-v1 | 2026-09-22 | 60 | 60 | 60 | 0 | Yes |
| interactions | spectrum-gen2-interactions-v1 | 2026-09-22 | 60 | 60 | 50 | 10 | Yes |
| lighthouse | spectrum-gen2-lighthouse-v1 | 2026-09-22 | 15 | 15 | 15 | 0 | Yes |
| memory | spectrum-gen2-memory-v1 | 2026-09-22 | 3 | 3 | 3 | 0 | Yes |
| diagnostic | spectrum-gen2-diagnostic-v1 | 2026-09-22 | 3 | 3 | 3 | 0 | Yes |
| bfcache | spectrum-gen2-bfcache-v1 | 2026-09-22 | 15 | 15 | 15 | 0 | Yes |
| overhead | spectrum-gen2-overhead-v1 | 2026-09-22 | 30 | 30 | 30 | 0 | Yes |

### Spectrum Gen2 browser and harness identity

The exact browser, renderer mode and archived harness identify these new results. Matching the source fixture does not make historical timings contemporaneous. Full host metadata and collection options remain in each manifest.

| Campaign | Started UTC | Browser | Browser mode | Harness SHA-256 | Collector SHA-256 |
| --- | --- | --- | --- | --- | --- |
| load | 2026-09-22T12:15:28.923Z | 153.0.8010.12 | bundled-chromium-headless-shell | c83da72ad9e252607a6ca2eda12621b084d01484ab30e639ffa82a259015a8db | 64543147510f2ea32b8825c36518dbaf4f8504b110f34eec0a942672b41051d3 |
| startup | 2026-09-22T12:21:41.724Z | 153.0.8010.12 | bundled-chromium-headless-shell | c83da72ad9e252607a6ca2eda12621b084d01484ab30e639ffa82a259015a8db | 64543147510f2ea32b8825c36518dbaf4f8504b110f34eec0a942672b41051d3 |
| interactions | 2026-09-22T12:22:25.803Z | 153.0.8010.12 | bundled-chromium-headless-shell | c83da72ad9e252607a6ca2eda12621b084d01484ab30e639ffa82a259015a8db | 64543147510f2ea32b8825c36518dbaf4f8504b110f34eec0a942672b41051d3 |
| lighthouse | 2026-09-22T12:28:20.539Z | Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/153.0.0.0 Safari/537.36 | See audit receipt | c83da72ad9e252607a6ca2eda12621b084d01484ab30e639ffa82a259015a8db | — |
| memory | 2026-09-22T12:32:10.955Z | 153.0.8010.12 | bundled-full-chromium-new-headless | c83da72ad9e252607a6ca2eda12621b084d01484ab30e639ffa82a259015a8db | 64543147510f2ea32b8825c36518dbaf4f8504b110f34eec0a942672b41051d3 |
| diagnostic | 2026-09-22T12:36:05.440Z | 153.0.8010.12 | bundled-chromium-headless-shell | c83da72ad9e252607a6ca2eda12621b084d01484ab30e639ffa82a259015a8db | 64543147510f2ea32b8825c36518dbaf4f8504b110f34eec0a942672b41051d3 |
| bfcache | 2026-09-22T12:36:23.267Z | 153.0.8010.12 | bundled-full-chromium-new-headless-direct-cdp | c83da72ad9e252607a6ca2eda12621b084d01484ab30e639ffa82a259015a8db | 64543147510f2ea32b8825c36518dbaf4f8504b110f34eec0a942672b41051d3 |
| overhead | 2026-09-22T12:37:09.613Z | 153.0.8010.12 | bundled-chromium-headless-shell | c83da72ad9e252607a6ca2eda12621b084d01484ab30e639ffa82a259015a8db | 64543147510f2ea32b8825c36518dbaf4f8504b110f34eec0a942672b41051d3 |

### Spectrum Gen2 requested profiles

These are requested CDP profile values. Desktop uses no simulated CPU/network throttling. The mobile profile is desktop Chromium with a narrow viewport and emulated CPU/network limits, not a physical phone. Lighthouse separately applies its DevTools throttling settings; memory and DOM diagnostics have their own recorded protocol. Browser implementation and loopback serving limit real-world inference.

| Profile | Viewport width px | Viewport height px | DPR | CPU slowdown | Network latency ms | Download Mbps | Upload Mbps |
| --- | --- | --- | --- | --- | --- | --- | --- |
| desktop | 1500 | 1100 | 1 | 1 | 0 | Unthrottled | Unthrottled |
| mobile | 390 | 844 | 1 | 4 | 100 | 8.00 | 2.00 |

### Spectrum Gen2 retained acquisition failures

Failed samples remain in raw evidence and outside successful timing distributions. The last action is a diagnostic clue, not a demonstrated cause. Memory checkpoints reached before a failure remain available.

| Implementation | Campaign | Profile | Cache | Sample | Last action | Failure |
| --- | --- | --- | --- | --- | --- | --- |
| Spectrum WC Gen2 + Gen1 | interactions | mobile | cold | 00004 | canvas-landscape-warm | Error: expect(locator).toHaveAttribute(expected) failed  Locator:  locator('#showcase-asset').locator('[data-layout]').first() Expected: "landscape" Received: "portrait" Timeout:  5000ms  Call log:   - Expect "toHaveAttribute" locator('#showcase-asset').locator('[data-layout]').first() with timeout 5000ms   - waiting for locator('#showcase-asset').locator('[data-layout]').first()     14 × locator resolved to <div role="img" class="art" data-layout="portrait" aria-label="portrait composition with overlapping shapes">…</div>        - unexpected value "portrait"      at captureRawStack (/Users/westbrook/Documents/repos/design-system/showcases/performance/node_modules/playwright-core/lib/coreBundle.js:8588:17)     at callMatcherAsStep (/Users/westbrook/Documents/repos/design-system/showcases/performance/node_modules/playwright/lib/matchers/expect.js:13310:57)     at Object.toHaveAttribute (/Users/westbrook/Documents/repos/design-system/showcases/performance/node_modules/playwright/lib/matchers/expect.js:13302:23)     at /Users/westbrook/Documents/repos/design-system/showcases/performance/scenarios/journey.mjs:93:13     at measuredAction (/Users/westbrook/Documents/repos/design-system/showcases/performance/scenarios/journey.mjs:64:9)     at async journey (/Users/westbrook/Documents/repos/design-system/showcases/performance/scenarios/journey.mjs:82:7)     at async sample (/Users/westbrook/Documents/repos/design-system/showcases/performance/src/runner.mjs:264:7)     at async run (/Users/westbrook/Documents/repos/design-system/showcases/performance/src/runner.mjs:578:22)     at async file:///Users/westbrook/Documents/repos/design-system/showcases/performance/experiments/run-spectrum-gen2.mjs:32:36     at async exclusiveBrowserWork (/Users/westbrook/Documents/repos/design-system/showcases/performance/src/lock.mjs:35:12)     at async file:///Users/westbrook/Documents/repos/design-system/showcases/performance/experiments/run-spectrum-gen2.mjs:21:1 |
| Spectrum WC Gen2 + Gen1 | interactions | mobile | cold | 00011 | canvas-landscape-warm | Error: expect(locator).toHaveAttribute(expected) failed  Locator:  locator('#showcase-asset').locator('[data-layout]').first() Expected: "landscape" Received: "portrait" Timeout:  5000ms  Call log:   - Expect "toHaveAttribute" locator('#showcase-asset').locator('[data-layout]').first() with timeout 5000ms   - waiting for locator('#showcase-asset').locator('[data-layout]').first()     14 × locator resolved to <div role="img" class="art" data-layout="portrait" aria-label="portrait composition with overlapping shapes">…</div>        - unexpected value "portrait"      at captureRawStack (/Users/westbrook/Documents/repos/design-system/showcases/performance/node_modules/playwright-core/lib/coreBundle.js:8588:17)     at callMatcherAsStep (/Users/westbrook/Documents/repos/design-system/showcases/performance/node_modules/playwright/lib/matchers/expect.js:13310:57)     at Object.toHaveAttribute (/Users/westbrook/Documents/repos/design-system/showcases/performance/node_modules/playwright/lib/matchers/expect.js:13302:23)     at /Users/westbrook/Documents/repos/design-system/showcases/performance/scenarios/journey.mjs:93:13     at measuredAction (/Users/westbrook/Documents/repos/design-system/showcases/performance/scenarios/journey.mjs:64:9)     at async journey (/Users/westbrook/Documents/repos/design-system/showcases/performance/scenarios/journey.mjs:82:7)     at async sample (/Users/westbrook/Documents/repos/design-system/showcases/performance/src/runner.mjs:264:7)     at async run (/Users/westbrook/Documents/repos/design-system/showcases/performance/src/runner.mjs:578:22)     at async file:///Users/westbrook/Documents/repos/design-system/showcases/performance/experiments/run-spectrum-gen2.mjs:32:36     at async exclusiveBrowserWork (/Users/westbrook/Documents/repos/design-system/showcases/performance/src/lock.mjs:35:12)     at async file:///Users/westbrook/Documents/repos/design-system/showcases/performance/experiments/run-spectrum-gen2.mjs:21:1 |
| Spectrum WC Gen2 + Gen1 | interactions | mobile | cold | 00018 | canvas-landscape-warm | Error: expect(locator).toHaveAttribute(expected) failed  Locator:  locator('#showcase-asset').locator('[data-layout]').first() Expected: "landscape" Received: "portrait" Timeout:  5000ms  Call log:   - Expect "toHaveAttribute" locator('#showcase-asset').locator('[data-layout]').first() with timeout 5000ms   - waiting for locator('#showcase-asset').locator('[data-layout]').first()     14 × locator resolved to <div role="img" class="art" data-layout="portrait" aria-label="portrait composition with overlapping shapes">…</div>        - unexpected value "portrait"      at captureRawStack (/Users/westbrook/Documents/repos/design-system/showcases/performance/node_modules/playwright-core/lib/coreBundle.js:8588:17)     at callMatcherAsStep (/Users/westbrook/Documents/repos/design-system/showcases/performance/node_modules/playwright/lib/matchers/expect.js:13310:57)     at Object.toHaveAttribute (/Users/westbrook/Documents/repos/design-system/showcases/performance/node_modules/playwright/lib/matchers/expect.js:13302:23)     at /Users/westbrook/Documents/repos/design-system/showcases/performance/scenarios/journey.mjs:93:13     at measuredAction (/Users/westbrook/Documents/repos/design-system/showcases/performance/scenarios/journey.mjs:64:9)     at async journey (/Users/westbrook/Documents/repos/design-system/showcases/performance/scenarios/journey.mjs:82:7)     at async sample (/Users/westbrook/Documents/repos/design-system/showcases/performance/src/runner.mjs:264:7)     at async run (/Users/westbrook/Documents/repos/design-system/showcases/performance/src/runner.mjs:578:22)     at async file:///Users/westbrook/Documents/repos/design-system/showcases/performance/experiments/run-spectrum-gen2.mjs:32:36     at async exclusiveBrowserWork (/Users/westbrook/Documents/repos/design-system/showcases/performance/src/lock.mjs:35:12)     at async file:///Users/westbrook/Documents/repos/design-system/showcases/performance/experiments/run-spectrum-gen2.mjs:21:1 |
| Spectrum WC Gen2 + Gen1 | interactions | mobile | cold | 00022 | canvas-landscape-warm | Error: expect(locator).toHaveAttribute(expected) failed  Locator:  locator('#showcase-asset').locator('[data-layout]').first() Expected: "landscape" Received: "portrait" Timeout:  5000ms  Call log:   - Expect "toHaveAttribute" locator('#showcase-asset').locator('[data-layout]').first() with timeout 5000ms   - waiting for locator('#showcase-asset').locator('[data-layout]').first()     14 × locator resolved to <div role="img" class="art" data-layout="portrait" aria-label="portrait composition with overlapping shapes">…</div>        - unexpected value "portrait"      at captureRawStack (/Users/westbrook/Documents/repos/design-system/showcases/performance/node_modules/playwright-core/lib/coreBundle.js:8588:17)     at callMatcherAsStep (/Users/westbrook/Documents/repos/design-system/showcases/performance/node_modules/playwright/lib/matchers/expect.js:13310:57)     at Object.toHaveAttribute (/Users/westbrook/Documents/repos/design-system/showcases/performance/node_modules/playwright/lib/matchers/expect.js:13302:23)     at /Users/westbrook/Documents/repos/design-system/showcases/performance/scenarios/journey.mjs:93:13     at measuredAction (/Users/westbrook/Documents/repos/design-system/showcases/performance/scenarios/journey.mjs:64:9)     at async journey (/Users/westbrook/Documents/repos/design-system/showcases/performance/scenarios/journey.mjs:82:7)     at async sample (/Users/westbrook/Documents/repos/design-system/showcases/performance/src/runner.mjs:264:7)     at async run (/Users/westbrook/Documents/repos/design-system/showcases/performance/src/runner.mjs:578:22)     at async file:///Users/westbrook/Documents/repos/design-system/showcases/performance/experiments/run-spectrum-gen2.mjs:32:36     at async exclusiveBrowserWork (/Users/westbrook/Documents/repos/design-system/showcases/performance/src/lock.mjs:35:12)     at async file:///Users/westbrook/Documents/repos/design-system/showcases/performance/experiments/run-spectrum-gen2.mjs:21:1 |
| Spectrum WC Gen2 + Gen1 | interactions | mobile | cold | 00027 | canvas-landscape-warm | Error: expect(locator).toHaveAttribute(expected) failed  Locator:  locator('#showcase-asset').locator('[data-layout]').first() Expected: "landscape" Received: "portrait" Timeout:  5000ms  Call log:   - Expect "toHaveAttribute" locator('#showcase-asset').locator('[data-layout]').first() with timeout 5000ms   - waiting for locator('#showcase-asset').locator('[data-layout]').first()     14 × locator resolved to <div role="img" class="art" data-layout="portrait" aria-label="portrait composition with overlapping shapes">…</div>        - unexpected value "portrait"      at captureRawStack (/Users/westbrook/Documents/repos/design-system/showcases/performance/node_modules/playwright-core/lib/coreBundle.js:8588:17)     at callMatcherAsStep (/Users/westbrook/Documents/repos/design-system/showcases/performance/node_modules/playwright/lib/matchers/expect.js:13310:57)     at Object.toHaveAttribute (/Users/westbrook/Documents/repos/design-system/showcases/performance/node_modules/playwright/lib/matchers/expect.js:13302:23)     at /Users/westbrook/Documents/repos/design-system/showcases/performance/scenarios/journey.mjs:93:13     at measuredAction (/Users/westbrook/Documents/repos/design-system/showcases/performance/scenarios/journey.mjs:64:9)     at async journey (/Users/westbrook/Documents/repos/design-system/showcases/performance/scenarios/journey.mjs:82:7)     at async sample (/Users/westbrook/Documents/repos/design-system/showcases/performance/src/runner.mjs:264:7)     at async run (/Users/westbrook/Documents/repos/design-system/showcases/performance/src/runner.mjs:578:22)     at async file:///Users/westbrook/Documents/repos/design-system/showcases/performance/experiments/run-spectrum-gen2.mjs:32:36     at async exclusiveBrowserWork (/Users/westbrook/Documents/repos/design-system/showcases/performance/src/lock.mjs:35:12)     at async file:///Users/westbrook/Documents/repos/design-system/showcases/performance/experiments/run-spectrum-gen2.mjs:21:1 |
| Spectrum WC Gen2 + Gen1 | interactions | mobile | cold | 00036 | canvas-landscape-warm | Error: expect(locator).toHaveAttribute(expected) failed  Locator:  locator('#showcase-asset').locator('[data-layout]').first() Expected: "landscape" Received: "portrait" Timeout:  5000ms  Call log:   - Expect "toHaveAttribute" locator('#showcase-asset').locator('[data-layout]').first() with timeout 5000ms   - waiting for locator('#showcase-asset').locator('[data-layout]').first()     14 × locator resolved to <div role="img" class="art" data-layout="portrait" aria-label="portrait composition with overlapping shapes">…</div>        - unexpected value "portrait"      at captureRawStack (/Users/westbrook/Documents/repos/design-system/showcases/performance/node_modules/playwright-core/lib/coreBundle.js:8588:17)     at callMatcherAsStep (/Users/westbrook/Documents/repos/design-system/showcases/performance/node_modules/playwright/lib/matchers/expect.js:13310:57)     at Object.toHaveAttribute (/Users/westbrook/Documents/repos/design-system/showcases/performance/node_modules/playwright/lib/matchers/expect.js:13302:23)     at /Users/westbrook/Documents/repos/design-system/showcases/performance/scenarios/journey.mjs:93:13     at measuredAction (/Users/westbrook/Documents/repos/design-system/showcases/performance/scenarios/journey.mjs:64:9)     at async journey (/Users/westbrook/Documents/repos/design-system/showcases/performance/scenarios/journey.mjs:82:7)     at async sample (/Users/westbrook/Documents/repos/design-system/showcases/performance/src/runner.mjs:264:7)     at async run (/Users/westbrook/Documents/repos/design-system/showcases/performance/src/runner.mjs:578:22)     at async file:///Users/westbrook/Documents/repos/design-system/showcases/performance/experiments/run-spectrum-gen2.mjs:32:36     at async exclusiveBrowserWork (/Users/westbrook/Documents/repos/design-system/showcases/performance/src/lock.mjs:35:12)     at async file:///Users/westbrook/Documents/repos/design-system/showcases/performance/experiments/run-spectrum-gen2.mjs:21:1 |
| Spectrum WC Gen2 + Gen1 | interactions | mobile | cold | 00038 | canvas-landscape-warm | Error: expect(locator).toHaveAttribute(expected) failed  Locator:  locator('#showcase-asset').locator('[data-layout]').first() Expected: "landscape" Received: "portrait" Timeout:  5000ms  Call log:   - Expect "toHaveAttribute" locator('#showcase-asset').locator('[data-layout]').first() with timeout 5000ms   - waiting for locator('#showcase-asset').locator('[data-layout]').first()     14 × locator resolved to <div role="img" class="art" data-layout="portrait" aria-label="portrait composition with overlapping shapes">…</div>        - unexpected value "portrait"      at captureRawStack (/Users/westbrook/Documents/repos/design-system/showcases/performance/node_modules/playwright-core/lib/coreBundle.js:8588:17)     at callMatcherAsStep (/Users/westbrook/Documents/repos/design-system/showcases/performance/node_modules/playwright/lib/matchers/expect.js:13310:57)     at Object.toHaveAttribute (/Users/westbrook/Documents/repos/design-system/showcases/performance/node_modules/playwright/lib/matchers/expect.js:13302:23)     at /Users/westbrook/Documents/repos/design-system/showcases/performance/scenarios/journey.mjs:93:13     at measuredAction (/Users/westbrook/Documents/repos/design-system/showcases/performance/scenarios/journey.mjs:64:9)     at async journey (/Users/westbrook/Documents/repos/design-system/showcases/performance/scenarios/journey.mjs:82:7)     at async sample (/Users/westbrook/Documents/repos/design-system/showcases/performance/src/runner.mjs:264:7)     at async run (/Users/westbrook/Documents/repos/design-system/showcases/performance/src/runner.mjs:578:22)     at async file:///Users/westbrook/Documents/repos/design-system/showcases/performance/experiments/run-spectrum-gen2.mjs:32:36     at async exclusiveBrowserWork (/Users/westbrook/Documents/repos/design-system/showcases/performance/src/lock.mjs:35:12)     at async file:///Users/westbrook/Documents/repos/design-system/showcases/performance/experiments/run-spectrum-gen2.mjs:21:1 |
| Spectrum WC Gen2 + Gen1 | interactions | mobile | cold | 00043 | canvas-landscape-warm | Error: expect(locator).toHaveAttribute(expected) failed  Locator:  locator('#showcase-asset').locator('[data-layout]').first() Expected: "landscape" Received: "portrait" Timeout:  5000ms  Call log:   - Expect "toHaveAttribute" locator('#showcase-asset').locator('[data-layout]').first() with timeout 5000ms   - waiting for locator('#showcase-asset').locator('[data-layout]').first()     14 × locator resolved to <div role="img" class="art" data-layout="portrait" aria-label="portrait composition with overlapping shapes">…</div>        - unexpected value "portrait"      at captureRawStack (/Users/westbrook/Documents/repos/design-system/showcases/performance/node_modules/playwright-core/lib/coreBundle.js:8588:17)     at callMatcherAsStep (/Users/westbrook/Documents/repos/design-system/showcases/performance/node_modules/playwright/lib/matchers/expect.js:13310:57)     at Object.toHaveAttribute (/Users/westbrook/Documents/repos/design-system/showcases/performance/node_modules/playwright/lib/matchers/expect.js:13302:23)     at /Users/westbrook/Documents/repos/design-system/showcases/performance/scenarios/journey.mjs:93:13     at measuredAction (/Users/westbrook/Documents/repos/design-system/showcases/performance/scenarios/journey.mjs:64:9)     at async journey (/Users/westbrook/Documents/repos/design-system/showcases/performance/scenarios/journey.mjs:82:7)     at async sample (/Users/westbrook/Documents/repos/design-system/showcases/performance/src/runner.mjs:264:7)     at async run (/Users/westbrook/Documents/repos/design-system/showcases/performance/src/runner.mjs:578:22)     at async file:///Users/westbrook/Documents/repos/design-system/showcases/performance/experiments/run-spectrum-gen2.mjs:32:36     at async exclusiveBrowserWork (/Users/westbrook/Documents/repos/design-system/showcases/performance/src/lock.mjs:35:12)     at async file:///Users/westbrook/Documents/repos/design-system/showcases/performance/experiments/run-spectrum-gen2.mjs:21:1 |
| Spectrum WC Gen2 + Gen1 | interactions | mobile | cold | 00054 | canvas-landscape-warm | Error: expect(locator).toHaveAttribute(expected) failed  Locator:  locator('#showcase-asset').locator('[data-layout]').first() Expected: "landscape" Received: "portrait" Timeout:  5000ms  Call log:   - Expect "toHaveAttribute" locator('#showcase-asset').locator('[data-layout]').first() with timeout 5000ms   - waiting for locator('#showcase-asset').locator('[data-layout]').first()     14 × locator resolved to <div role="img" class="art" data-layout="portrait" aria-label="portrait composition with overlapping shapes">…</div>        - unexpected value "portrait"      at captureRawStack (/Users/westbrook/Documents/repos/design-system/showcases/performance/node_modules/playwright-core/lib/coreBundle.js:8588:17)     at callMatcherAsStep (/Users/westbrook/Documents/repos/design-system/showcases/performance/node_modules/playwright/lib/matchers/expect.js:13310:57)     at Object.toHaveAttribute (/Users/westbrook/Documents/repos/design-system/showcases/performance/node_modules/playwright/lib/matchers/expect.js:13302:23)     at /Users/westbrook/Documents/repos/design-system/showcases/performance/scenarios/journey.mjs:93:13     at measuredAction (/Users/westbrook/Documents/repos/design-system/showcases/performance/scenarios/journey.mjs:64:9)     at async journey (/Users/westbrook/Documents/repos/design-system/showcases/performance/scenarios/journey.mjs:82:7)     at async sample (/Users/westbrook/Documents/repos/design-system/showcases/performance/src/runner.mjs:264:7)     at async run (/Users/westbrook/Documents/repos/design-system/showcases/performance/src/runner.mjs:578:22)     at async file:///Users/westbrook/Documents/repos/design-system/showcases/performance/experiments/run-spectrum-gen2.mjs:32:36     at async exclusiveBrowserWork (/Users/westbrook/Documents/repos/design-system/showcases/performance/src/lock.mjs:35:12)     at async file:///Users/westbrook/Documents/repos/design-system/showcases/performance/experiments/run-spectrum-gen2.mjs:21:1 |
| Spectrum WC Gen2 + Gen1 | interactions | mobile | cold | 00060 | canvas-landscape-warm | Error: expect(locator).toHaveAttribute(expected) failed  Locator:  locator('#showcase-asset').locator('[data-layout]').first() Expected: "landscape" Received: "portrait" Timeout:  5000ms  Call log:   - Expect "toHaveAttribute" locator('#showcase-asset').locator('[data-layout]').first() with timeout 5000ms   - waiting for locator('#showcase-asset').locator('[data-layout]').first()     14 × locator resolved to <div role="img" class="art" data-layout="portrait" aria-label="portrait composition with overlapping shapes">…</div>        - unexpected value "portrait"      at captureRawStack (/Users/westbrook/Documents/repos/design-system/showcases/performance/node_modules/playwright-core/lib/coreBundle.js:8588:17)     at callMatcherAsStep (/Users/westbrook/Documents/repos/design-system/showcases/performance/node_modules/playwright/lib/matchers/expect.js:13310:57)     at Object.toHaveAttribute (/Users/westbrook/Documents/repos/design-system/showcases/performance/node_modules/playwright/lib/matchers/expect.js:13302:23)     at /Users/westbrook/Documents/repos/design-system/showcases/performance/scenarios/journey.mjs:93:13     at measuredAction (/Users/westbrook/Documents/repos/design-system/showcases/performance/scenarios/journey.mjs:64:9)     at async journey (/Users/westbrook/Documents/repos/design-system/showcases/performance/scenarios/journey.mjs:82:7)     at async sample (/Users/westbrook/Documents/repos/design-system/showcases/performance/src/runner.mjs:264:7)     at async run (/Users/westbrook/Documents/repos/design-system/showcases/performance/src/runner.mjs:578:22)     at async file:///Users/westbrook/Documents/repos/design-system/showcases/performance/experiments/run-spectrum-gen2.mjs:32:36     at async exclusiveBrowserWork (/Users/westbrook/Documents/repos/design-system/showcases/performance/src/lock.mjs:35:12)     at async file:///Users/westbrook/Documents/repos/design-system/showcases/performance/experiments/run-spectrum-gen2.mjs:21:1 |

### Spectrum Gen2 loading and visual stability

Loading sends no input, retaining LCP eligibility through the observation window. Load plus 1.5 seconds and card readiness bounds CLS and resource observation. TTFB is from a loopback server. Warm visits reuse a primed context. Text LCP may legitimately have zero resource phases; independent attribution medians need not add to median LCP. Card-frame and final downloaded-font response timestamps do not prove every control is usable.

### Spectrum Gen2 mobile cold loading

FCP is first contentful paint; LCP is largest contentful paint; CLS uses eligible session-window scoring. Cohort: **spectrum-gen2-load-v1**, mobile/cold. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | FCP ms | LCP ms | LCP p75 ms | CLS | CLS p75 | CLS max | TTFB ms | Cards frame opportunity ms | Last webfont response ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 596.0 | 596.0 | 600.0 | 0.000000 | 0.000000 | 0.000000 | 14.1 | 592.2 | — |
| Fluent Web Components | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 500.0 | 500.0 | 504.0 | 0.000000 | 0.000000 | 0.000000 | 14.8 | 495.3 | — |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 776.0 | 776.0 | 784.0 | 0.000000 | 0.000000 | 0.000000 | 14.7 | 772.7 | — |

### Spectrum Gen2 mobile warm loading

FCP is first contentful paint; LCP is largest contentful paint; CLS uses eligible session-window scoring. Cohort: **spectrum-gen2-load-v1**, mobile/warm. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | FCP ms | LCP ms | LCP p75 ms | CLS | CLS p75 | CLS max | TTFB ms | Cards frame opportunity ms | Last webfont response ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 276.0 | 276.0 | 283.0 | 0.000000 | 0.000000 | 0.000000 | 2.3 | 284.1 | — |
| Fluent Web Components | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 206.0 | 206.0 | 211.0 | 0.000000 | 0.000000 | 0.000000 | 0.8 | 212.3 | — |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 288.0 | 288.0 | 294.0 | 0.000000 | 0.000000 | 0.000000 | 0.9 | 303.6 | — |

### Spectrum Gen2 mobile cold LCP attribution

web-vitals attribution; render delay includes discovery, JS, CSS, fonts and rendering. Cohort: **spectrum-gen2-load-v1**, mobile/cold. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | TTFB portion ms | Resource delay ms | Resource duration ms | Element render delay ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 14.1 | 0.0 | 0.0 | 582.2 |
| Fluent Web Components | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 14.8 | 0.0 | 0.0 | 484.4 |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 14.7 | 0.0 | 0.0 | 760.8 |

### Spectrum Gen2 mobile startup usability

One trusted click is dispatched at the first observed Landscape geometry, refreshed just before dispatch; the target, result and two-rAF frame opportunity are verified. This is an observed successful probe, not mathematically earliest usability, legacy TTI or field FID. Probe/dispatch overhead remains visible. Cohort: **spectrum-gen2-startup-v1**, mobile/cold. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Control observed ms | Click from navigation ms | Result from navigation ms | Result p75 ms | Dispatch overhead ms | Discovery probe ms | Click to result ms | Click to frame ms | First input delay ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | spectrum-gen2-startup-v1 | 2026-09-22 | 10 | 0 | 585.7 | 603.9 | 614.6 | 621.8 | 18.2 | 0.5 | 10.3 | 43.4 | 3.2 |
| Fluent Web Components | spectrum-gen2-startup-v1 | 2026-09-22 | 10 | 0 | 452.1 | 504.4 | 525.4 | 528.8 | 52.8 | 0.8 | 8.8 | 48.3 | 5.4 |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-startup-v1 | 2026-09-22 | 10 | 0 | 744.6 | 768.7 | 786.1 | 795.5 | 23.3 | 1.1 | 17.3 | 51.4 | 11.5 |

### Spectrum Gen2 desktop cold loading

FCP is first contentful paint; LCP is largest contentful paint; CLS uses eligible session-window scoring. Cohort: **spectrum-gen2-load-v1**, desktop/cold. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | FCP ms | LCP ms | LCP p75 ms | CLS | CLS p75 | CLS max | TTFB ms | Cards frame opportunity ms | Last webfont response ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 92.0 | 92.0 | 96.0 | 0.000000 | 0.000000 | 0.000000 | 14.4 | 80.3 | — |
| Fluent Web Components | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 78.0 | 78.0 | 80.0 | 0.000075 | 0.000075 | 0.000075 | 14.8 | 70.5 | — |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 112.0 | 112.0 | 112.0 | 0.000000 | 0.000000 | 0.000000 | 15.0 | 100.5 | — |

### Spectrum Gen2 desktop warm loading

FCP is first contentful paint; LCP is largest contentful paint; CLS uses eligible session-window scoring. Cohort: **spectrum-gen2-load-v1**, desktop/warm. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | FCP ms | LCP ms | LCP p75 ms | CLS | CLS p75 | CLS max | TTFB ms | Cards frame opportunity ms | Last webfont response ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 44.0 | 44.0 | 48.0 | 0.000000 | 0.000000 | 0.000000 | 2.3 | 42.4 | — |
| Fluent Web Components | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 28.0 | 28.0 | 32.0 | 0.000075 | 0.000075 | 0.000075 | 0.8 | 26.5 | — |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 48.0 | 48.0 | 52.0 | 0.000000 | 0.000000 | 0.000000 | 1.0 | 46.8 | — |

### Spectrum Gen2 desktop cold LCP attribution

web-vitals attribution; render delay includes discovery, JS, CSS, fonts and rendering. Cohort: **spectrum-gen2-load-v1**, desktop/cold. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | TTFB portion ms | Resource delay ms | Resource duration ms | Element render delay ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 14.4 | 0.0 | 0.0 | 78.0 |
| Fluent Web Components | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 14.8 | 0.0 | 0.0 | 62.4 |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 15.0 | 0.0 | 0.0 | 96.4 |

### Spectrum Gen2 desktop startup usability

One trusted click is dispatched at the first observed Landscape geometry, refreshed just before dispatch; the target, result and two-rAF frame opportunity are verified. This is an observed successful probe, not mathematically earliest usability, legacy TTI or field FID. Probe/dispatch overhead remains visible. Cohort: **spectrum-gen2-startup-v1**, desktop/cold. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Control observed ms | Click from navigation ms | Result from navigation ms | Result p75 ms | Dispatch overhead ms | Discovery probe ms | Click to result ms | Click to frame ms | First input delay ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | spectrum-gen2-startup-v1 | 2026-09-22 | 10 | 0 | 81.4 | 86.7 | 88.9 | 90.4 | 5.4 | 0.1 | 2.2 | 26.6 | 0.7 |
| Fluent Web Components | spectrum-gen2-startup-v1 | 2026-09-22 | 10 | 0 | 59.7 | 72.1 | 73.2 | 73.9 | 12.0 | 0.1 | 1.0 | 33.6 | — |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-startup-v1 | 2026-09-22 | 10 | 0 | 95.1 | 101.0 | 104.3 | 108.3 | 5.8 | 0.2 | 3.1 | 35.9 | — |

### Spectrum Gen2 production payload and chunking

All emitted production assets include fixture code, library/runtime code and authored styles; source maps and diagnostic metadata are excluded. Brotli/gzip are deterministic offline compression, while browser transfer is measured separately. Initial JS follows HTML/preload/static import reachability. A dynamic edge permits deferred loading but does not establish that bytes were deferred. The HTML measured here is a CSR shell; no SSR/hydration performance cohort is represented.

### Spectrum Gen2 transfer accounting

Network delivery includes only HTTP(S) responses. Embedded data/blob responses are retained separately and never counted again as wire bytes. Raw captures and derived values are both retained for auditing.

### Spectrum Gen2 production payload sizes

One frozen build per implementation. Local-font zero does not imply no remote fonts; use browser transfer for actual responses.

| Implementation | JS raw KiB | JS gzip KiB | JS Brotli KiB | Initial JS Brotli KiB | CSS raw KiB | CSS Brotli KiB | Local fonts Brotli KiB | HTML raw KiB | HTML Brotli KiB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | 404.7 | 100.1 | 80.4 | 80.4 | 39.8 | 5.6 | 0.0 | 0.351 | 0.155 |
| Fluent Web Components | 281.2 | 69.3 | 57.1 | 57.1 | 4.2 | 1.2 | 0.0 | 0.364 | 0.173 |
| Spectrum WC Gen2 + Gen1 | 1,291.5 | 236.9 | 185.4 | 171.3 | 117.6 | 14.0 | 0.0 | 1.310 | 0.346 |

### Spectrum Gen2 emitted chunk structure

These are current fixture graphs, not the splitting ceiling of each library. Repeated source modules require inspection before claiming removable duplication.

| Implementation | JS files | CSS files | Static initial assets | Dynamic import edges | Sources in multiple chunks |
| --- | --- | --- | --- | --- | --- |
| En Reve | 1 | 1 | 2 | 0 | 0 |
| Fluent Web Components | 1 | 1 | 2 | 0 | 0 |
| Spectrum WC Gen2 + Gen1 | 18 | 1 | 14 | 9 | 0 |

### Spectrum Gen2 whole-page response delivery

Completed HTTP(S) CDP response bytes include HTML, JS, CSS, fonts and other network responses, excluding local schemes, collector endpoints and destination pages. These are browser response accounting, not TCP/TLS packet bytes. Incomplete HTTP responses make totals unavailable; missing assets are not free. The load visit is bounded; interaction transfer is a separate cumulative journey, not subtraction of two medians. Cache-reuse entries have zero Resource Timing transfer and a positive encoded body size.

### Spectrum Gen2 response-transfer derivation correction

Successful load-sample medians. Captured aggregates are retained historical fields inside the new raw files; every delivery table below uses the corrected HTTP(S)-only replay. Embedded/local responses are shown separately to make the correction inspectable. A missing completion remains unavailable rather than zero.

| Implementation | Profile | Cache | Successful n | Captured aggregate KiB | Corrected HTTP response KiB | Non-HTTP responses n | Non-HTTP completed KiB | Non-HTTP incomplete n |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | mobile | cold | 10 | 86.6 | 86.6 | 1 | 0.0 | 0 |
| Fluent Web Components | mobile | cold | 10 | 58.9 | 58.9 | 1 | 0.0 | 0 |
| Spectrum WC Gen2 + Gen1 | mobile | cold | 10 | 187.2 | 187.2 | 3 | 0.0 | 0 |
| En Reve | mobile | warm | 10 | 0.2 | 0.2 | 1 | 0.0 | 0 |
| Fluent Web Components | mobile | warm | 10 | 0.3 | 0.3 | 1 | 0.0 | 0 |
| Spectrum WC Gen2 + Gen1 | mobile | warm | 10 | 0.4 | 0.4 | 3 | 0.0 | 0 |
| En Reve | desktop | cold | 10 | 86.6 | 86.6 | 1 | 0.0 | 0 |
| Fluent Web Components | desktop | cold | 10 | 58.9 | 58.9 | 1 | 0.0 | 0 |
| Spectrum WC Gen2 + Gen1 | desktop | cold | 10 | 187.2 | 187.2 | 3 | 0.0 | 0 |
| En Reve | desktop | warm | 10 | 0.2 | 0.2 | 1 | 0.0 | 0 |
| Fluent Web Components | desktop | warm | 10 | 0.3 | 0.3 | 1 | 0.0 | 0 |
| Spectrum WC Gen2 + Gen1 | desktop | warm | 10 | 0.4 | 0.4 | 3 | 0.0 | 0 |

### Spectrum Gen2 mobile cold response transfer

Independently computed category medians need not sum exactly to median total. Cohort: **spectrum-gen2-load-v1**, mobile/cold. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 86.6 | 0.325 | 80.5 | 5.7 | 0.0 | 0.0 | 3 | 0 | 0 |
| Fluent Web Components | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 58.9 | 0.344 | 57.2 | 1.3 | 0.0 | 0.0 | 3 | 0 | 0 |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 187.2 | 0.516 | 172.5 | 14.1 | 0.0 | 0.0 | 15 | 0 | 0 |

### Spectrum Gen2 mobile warm response transfer

Independently computed category medians need not sum exactly to median total. Cohort: **spectrum-gen2-load-v1**, mobile/warm. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 0.2 | 0.243 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| Fluent Web Components | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 0.3 | 0.262 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 0.4 | 0.434 | 0.0 | 0.0 | 0.0 | 0.0 | 15 | 14 | 0 |

### Spectrum Gen2 mobile cumulative interaction transfer

Whole successful journey, including requests caused by tested actions. Cohort: **spectrum-gen2-interactions-v1**, mobile/cold. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | spectrum-gen2-interactions-v1 | 2026-09-22 | 10 | 0 | 86.6 | 0.325 | 80.5 | 5.7 | 0.0 | 0.0 | 3 | 0 | 0 |
| Fluent Web Components | spectrum-gen2-interactions-v1 | 2026-09-22 | 10 | 0 | 58.9 | 0.344 | 57.2 | 1.3 | 0.0 | 0.0 | 3 | 0 | 0 |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-interactions-v1 | 2026-09-22 | 0 | 10 | — | — | — | — | — | — | — | — | — |

### Spectrum Gen2 desktop cold response transfer

Independently computed category medians need not sum exactly to median total. Cohort: **spectrum-gen2-load-v1**, desktop/cold. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 86.6 | 0.325 | 80.5 | 5.7 | 0.0 | 0.0 | 3 | 0 | 0 |
| Fluent Web Components | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 58.9 | 0.344 | 57.2 | 1.3 | 0.0 | 0.0 | 3 | 0 | 0 |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 187.2 | 0.516 | 172.5 | 14.1 | 0.0 | 0.0 | 15 | 0 | 0 |

### Spectrum Gen2 desktop warm response transfer

Independently computed category medians need not sum exactly to median total. Cohort: **spectrum-gen2-load-v1**, desktop/warm. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 0.2 | 0.243 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| Fluent Web Components | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 0.3 | 0.262 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 0.4 | 0.434 | 0.0 | 0.0 | 0.0 | 0.0 | 15 | 14 | 0 |

### Spectrum Gen2 desktop cumulative interaction transfer

Whole successful journey, including requests caused by tested actions. Cohort: **spectrum-gen2-interactions-v1**, desktop/cold. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | spectrum-gen2-interactions-v1 | 2026-09-22 | 10 | 0 | 86.6 | 0.325 | 80.5 | 5.7 | 0.0 | 0.0 | 3 | 0 | 0 |
| Fluent Web Components | spectrum-gen2-interactions-v1 | 2026-09-22 | 10 | 0 | 58.9 | 0.344 | 57.2 | 1.3 | 0.0 | 0.0 | 3 | 0 | 0 |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-interactions-v1 | 2026-09-22 | 10 | 0 | 192.2 | 0.516 | 177.6 | 14.1 | 0.0 | 0.0 | 16 | 0 | 0 |

### Spectrum Gen2 main-thread and blocking work

CDP script, style, layout and task counters are measured at the bounded load endpoint and can overlap. Long-task and long-animation-frame totals include their whole durations and are not TBT. Blocking excess sums only long-task portions beyond 50 ms, clipped before FCP or from FCP to the observation endpoint. Lighthouse TBT has a different endpoint and is reported separately. Use traces before assigning critical-path causes.

### Spectrum Gen2 mobile cold main-thread work

These are measured costs, not an additive decomposition of LCP. Cohort: **spectrum-gen2-load-v1**, mobile/cold. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Script ms | Style ms | Layout ms | Task ms | Layout passes | Style recalcs | Long tasks ms | Pre-FCP blocking excess ms | Post-FCP blocking excess ms | Long animation frames ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 72.0 | 55.8 | 30.1 | 334.2 | 8 | 11 | 251.5 | 201.5 | 0.0 | 372.3 |
| Fluent Web Components | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 111.1 | 39.3 | 38.8 | 265.6 | 5 | 10 | 149.5 | 99.5 | 0.0 | 291.1 |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 106.7 | 71.7 | 49.9 | 410.8 | 11 | 25 | 296.0 | 246.0 | 0.0 | 482.6 |

### Spectrum Gen2 mobile warm main-thread work

These are measured costs, not an additive decomposition of LCP. Cohort: **spectrum-gen2-load-v1**, mobile/warm. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Script ms | Style ms | Layout ms | Task ms | Layout passes | Style recalcs | Long tasks ms | Pre-FCP blocking excess ms | Post-FCP blocking excess ms | Long animation frames ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 49.1 | 38.2 | 12.7 | 214.5 | 8 | 11 | 142.5 | 92.5 | 0.0 | 146.0 |
| Fluent Web Components | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 50.4 | 16.3 | 8.3 | 144.5 | 5 | 10 | 63.0 | 13.0 | 0.0 | 78.8 |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 50.3 | 44.6 | 11.2 | 242.3 | 11 | 25 | 146.0 | 96.0 | 0.0 | 153.5 |

### Spectrum Gen2 desktop cold main-thread work

These are measured costs, not an additive decomposition of LCP. Cohort: **spectrum-gen2-load-v1**, desktop/cold. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Script ms | Style ms | Layout ms | Task ms | Layout passes | Style recalcs | Long tasks ms | Pre-FCP blocking excess ms | Post-FCP blocking excess ms | Long animation frames ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 15.6 | 11.6 | 5.8 | 74.5 | 8 | 10 | 52.0 | 2.0 | 0.0 | 54.0 |
| Fluent Web Components | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 23.3 | 9.4 | 7.9 | 60.4 | 5 | 10 | 0.0 | 0.0 | 0.0 | 0.0 |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 23.0 | 16.3 | 10.8 | 96.8 | 11 | 23 | 64.0 | 14.0 | 0.0 | 66.5 |

### Spectrum Gen2 desktop warm main-thread work

These are measured costs, not an additive decomposition of LCP. Cohort: **spectrum-gen2-load-v1**, desktop/warm. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Script ms | Style ms | Layout ms | Task ms | Layout passes | Style recalcs | Long tasks ms | Pre-FCP blocking excess ms | Post-FCP blocking excess ms | Long animation frames ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 11.9 | 8.8 | 3.2 | 53.0 | 7 | 10 | 0.0 | 0.0 | 0.0 | 0.0 |
| Fluent Web Components | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 12.1 | 3.9 | 2.2 | 37.9 | 4 | 9 | 0.0 | 0.0 | 0.0 | 0.0 |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 12.2 | 9.9 | 2.5 | 59.5 | 10 | 23 | 0.0 | 0.0 | 0.0 | 0.0 |

### Spectrum Gen2 repeated mobile Lighthouse audits

Fresh full-Chromium audits, separate from headless-shell load samples. Lighthouse owns DevTools throttling in this lane. Zero TBT does not establish zero startup work. Cohort: **spectrum-gen2-lighthouse-v1**, mobile/cold. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | FCP ms | LCP ms | LCP p75 ms | LCP max ms | TBT ms | TBT p75 ms | TBT max ms | Speed Index ms | CLS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | spectrum-gen2-lighthouse-v1 | 2026-09-22 | 5 | 0 | 701.8 | 701.8 | 712.1 | 727.1 | 0.0 | 0.0 | 0.0 | 571.0 | 0.000000 |
| Fluent Web Components | spectrum-gen2-lighthouse-v1 | 2026-09-22 | 5 | 0 | 553.1 | 553.1 | 565.5 | 673.6 | 0.0 | 0.0 | 0.0 | 555.0 | 0.000000 |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-lighthouse-v1 | 2026-09-22 | 5 | 0 | 958.8 | 958.8 | 967.9 | 973.4 | 0.0 | 0.0 | 0.0 | 961.0 | 0.000000 |

### Spectrum Gen2 recorded Lighthouse throttling

Settings read from each retained Lighthouse JSON, rather than inferred from a generic mobile preset. DevTools uses request latency and download/upload values; the unused simulation rtt/throughput defaults are not presented as applied network limits. Lighthouse also emulates a mobile user agent/screen, unlike the primary narrow desktop-context lane.

| Implementation | Audits n | Lighthouse version | Throttle method | CPU slowdown | Request latency ms | Download Kbps | Upload Kbps | Screen emulation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | 5 | 13.5.0 | devtools | 4 | 100 | 8000 | 2000 | Mobile |
| Fluent Web Components | 5 | 13.5.0 | devtools | 4 | 100 | 8000 | 2000 | Mobile |
| Spectrum WC Gen2 + Gen1 | 5 | 13.5.0 | devtools | 4 | 100 | 8000 | 2000 | Mobile |

### Spectrum Gen2 interaction responsiveness

The settled journey tests first/repeated canvas changes, assets, dialogs, review submission and command opening. Scripted-session INP is not field INP. Browser first-input delay excludes handler and rendering time and is not a field FID sample. Event Timing has threshold/quantization limits; missing events remain unavailable. Semantic completion is verified DOM state; two rAFs indicate frame opportunity, not actual display presentation. Calendar interaction timings, typing and keyboard-specific paths are not covered by these seven actions.

### Spectrum Gen2 mobile interaction summary

Maximum scroll rAF gap is a scheduler diagnostic, not an inferred dropped-frame percentage. Cohort: **spectrum-gen2-interactions-v1**, mobile/cold. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Scripted INP ms | Scripted INP p75 ms | First input delay ms | Journey CLS | Max scroll rAF gap ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | spectrum-gen2-interactions-v1 | 2026-09-22 | 10 | 0 | 48.0 | 60.0 | 3.1 | 0.000000 | 16.8 |
| Fluent Web Components | spectrum-gen2-interactions-v1 | 2026-09-22 | 10 | 0 | 64.0 | 64.0 | 2.6 | 0.000000 | 16.8 |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-interactions-v1 | 2026-09-22 | 0 | 10 | — | — | — | — | — |

### Spectrum Gen2 mobile individual actions

Cohort: spectrum-gen2-interactions-v1, mobile/cold. Sort Action to compare the same operation. First and repeated actions expose possible deferred work. Event-entry counts show attribution coverage.

| Implementation | Action | Successful n | Failed journeys | Result ms | Frame opportunity ms | Frame p75 ms | Event entries n | Input delay ms | Processing ms | Presentation ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | First canvas change | 10 | 0 | 10.9 | 42.5 | 45.4 | 10 | 3.1 | 2.8 | 34.7 |
| Fluent Web Components | First canvas change | 10 | 0 | 5.6 | 41.5 | 43.7 | 10 | 2.6 | 1.1 | 36.6 |
| Spectrum WC Gen2 + Gen1 | First canvas change | 0 | 10 | — | — | — | 0 | — | — | — |
| En Reve | Repeated canvas change | 10 | 0 | 6.9 | 30.4 | 30.6 | 10 | 1.9 | 2.0 | 11.9 |
| Fluent Web Components | Repeated canvas change | 10 | 0 | 3.0 | 30.8 | 31.2 | 10 | 1.5 | 0.6 | 13.8 |
| Spectrum WC Gen2 + Gen1 | Repeated canvas change | 0 | 10 | — | — | — | 0 | — | — | — |
| En Reve | First asset addition | 10 | 0 | 9.1 | 29.8 | 30.1 | 10 | 2.5 | 2.2 | 43.6 |
| Fluent Web Components | First asset addition | 10 | 0 | 4.0 | 28.2 | 29.3 | 10 | 1.4 | 0.9 | 61.7 |
| Spectrum WC Gen2 + Gen1 | First asset addition | 0 | 10 | — | — | — | 0 | — | — | — |
| En Reve | First dialog opening | 10 | 0 | 38.9 | 45.1 | 46.3 | 10 | 2.4 | 0.8 | 44.6 |
| Fluent Web Components | First dialog opening | 10 | 0 | 3.7 | 32.0 | 33.5 | 10 | 1.9 | 0.6 | 29.8 |
| Spectrum WC Gen2 + Gen1 | First dialog opening | 0 | 10 | — | — | — | 0 | — | — | — |
| En Reve | Repeated dialog opening | 10 | 0 | 16.8 | 29.4 | 30.1 | 10 | 2.3 | 0.8 | 29.0 |
| Fluent Web Components | Repeated dialog opening | 10 | 0 | 3.0 | 49.2 | 50.0 | 10 | 1.7 | 0.3 | 45.9 |
| Spectrum WC Gen2 + Gen1 | Repeated dialog opening | 0 | 10 | — | — | — | 0 | — | — | — |
| En Reve | Review submission | 10 | 0 | 7.3 | 30.1 | 30.5 | 10 | 1.8 | 2.0 | 12.6 |
| Fluent Web Components | Review submission | 10 | 0 | 4.0 | 28.3 | 28.5 | 10 | 0.7 | 1.0 | 14.4 |
| Spectrum WC Gen2 + Gen1 | Review submission | 0 | 10 | — | — | — | 0 | — | — | — |
| En Reve | First command opening | 10 | 0 | 22.9 | 32.0 | 32.7 | 10 | 2.5 | 0.9 | 28.5 |
| Fluent Web Components | First command opening | 10 | 0 | 3.4 | 52.9 | 55.6 | 10 | 1.9 | 0.6 | 45.6 |
| Spectrum WC Gen2 + Gen1 | First command opening | 0 | 10 | — | — | — | 0 | — | — | — |

### Spectrum Gen2 desktop interaction summary

Maximum scroll rAF gap is a scheduler diagnostic, not an inferred dropped-frame percentage. Cohort: **spectrum-gen2-interactions-v1**, desktop/cold. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Scripted INP ms | Scripted INP p75 ms | First input delay ms | Journey CLS | Max scroll rAF gap ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | spectrum-gen2-interactions-v1 | 2026-09-22 | 10 | 0 | 40.0 | 46.0 | 0.8 | 0.000000 | 16.8 |
| Fluent Web Components | spectrum-gen2-interactions-v1 | 2026-09-22 | 10 | 0 | 40.0 | 40.0 | 0.8 | 0.000075 | 16.8 |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-interactions-v1 | 2026-09-22 | 10 | 0 | 40.0 | 40.0 | 1.3 | 0.000000 | 16.8 |

### Spectrum Gen2 desktop individual actions

Cohort: spectrum-gen2-interactions-v1, desktop/cold. Sort Action to compare the same operation. First and repeated actions expose possible deferred work. Event-entry counts show attribution coverage.

| Implementation | Action | Successful n | Failed journeys | Result ms | Frame opportunity ms | Frame p75 ms | Event entries n | Input delay ms | Processing ms | Presentation ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | First canvas change | 10 | 0 | 2.7 | 40.0 | 43.5 | 10 | 0.8 | 0.7 | 38.7 |
| Fluent Web Components | First canvas change | 10 | 0 | 1.7 | 39.0 | 41.0 | 10 | 0.8 | 0.2 | 39.0 |
| Spectrum WC Gen2 + Gen1 | First canvas change | 10 | 0 | 2.8 | 38.3 | 39.6 | 10 | 1.3 | 0.8 | 38.0 |
| En Reve | Repeated canvas change | 10 | 0 | 1.5 | 32.0 | 32.2 | 10 | 0.5 | 0.4 | 31.0 |
| Fluent Web Components | Repeated canvas change | 10 | 0 | 0.7 | 32.1 | 32.3 | 10 | 0.4 | 0.1 | 15.5 |
| Spectrum WC Gen2 + Gen1 | Repeated canvas change | 10 | 0 | 3.1 | 31.1 | 31.4 | 10 | 1.4 | 1.0 | 13.5 |
| En Reve | First asset addition | 10 | 0 | 2.2 | 31.8 | 31.9 | 10 | 0.6 | 0.5 | 30.9 |
| Fluent Web Components | First asset addition | 10 | 0 | 0.9 | 31.8 | 31.9 | 10 | 0.4 | 0.1 | 31.5 |
| Spectrum WC Gen2 + Gen1 | First asset addition | 10 | 0 | 2.5 | 31.9 | 32.1 | 10 | 1.2 | 0.6 | 30.3 |
| En Reve | First dialog opening | 10 | 0 | 9.0 | 31.7 | 31.8 | 10 | 0.6 | 0.2 | 31.2 |
| Fluent Web Components | First dialog opening | 10 | 0 | 0.9 | 31.7 | 31.9 | 10 | 0.4 | 0.1 | 31.5 |
| Spectrum WC Gen2 + Gen1 | First dialog opening | 10 | 0 | 2.5 | 31.8 | 32.0 | 10 | 1.3 | 0.6 | 14.3 |
| En Reve | Repeated dialog opening | 10 | 0 | 4.3 | 30.5 | 31.2 | 10 | 0.6 | 0.3 | 31.1 |
| Fluent Web Components | Repeated dialog opening | 10 | 0 | 0.9 | 31.2 | 31.6 | 10 | 0.5 | 0.1 | 23.3 |
| Spectrum WC Gen2 + Gen1 | Repeated dialog opening | 10 | 0 | 2.5 | 30.5 | 31.1 | 10 | 1.5 | 0.6 | 14.0 |
| En Reve | Review submission | 10 | 0 | 1.7 | 32.0 | 32.1 | 10 | 0.5 | 0.5 | 31.0 |
| Fluent Web Components | Review submission | 10 | 0 | 1.0 | 31.7 | 31.8 | 10 | 0.4 | 0.2 | 15.5 |
| Spectrum WC Gen2 + Gen1 | Review submission | 10 | 0 | 2.7 | 31.7 | 31.9 | 10 | 0.9 | 0.7 | 14.3 |
| En Reve | First command opening | 10 | 0 | 5.0 | 32.0 | 32.0 | 10 | 0.6 | 0.3 | 31.1 |
| Fluent Web Components | First command opening | 10 | 0 | 0.8 | 31.8 | 32.0 | 10 | 0.4 | 0.1 | 23.4 |
| Spectrum WC Gen2 + Gen1 | First command opening | 10 | 0 | 2.4 | 32.0 | 32.2 | 10 | 1.3 | 0.5 | 14.1 |

### Spectrum Gen2 memory and lifecycle

A separate cross-origin-isolated full-Chromium lane disables timing observers and samples at 0, 10 and 50 native journeys. Reviews replace status text rather than append records. API memory, JS heap and browser DOM counters have different scopes. One session per implementation and GC-dependent API readings cannot establish leaks or a robust memory ranking. API timeout/error is explicit; checkpoints reached before later failure remain reported.

### Spectrum Gen2 memory after 0 cycles

Cohort: spectrum-gen2-memory-v1. Zero cycles means after initial load and settling.

| Implementation | Checkpoints n | API success n | API unavailable n | API MiB | JS heap MiB | Browser DOM nodes | Event listeners | API status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | 1 | 0 | 1 | — | 4.89 | 7,141 | 547 | timeout |
| Fluent Web Components | 1 | 1 | 0 | 3.54 | 3.32 | 3,851 | 613 | ok |
| Spectrum WC Gen2 + Gen1 | 1 | 0 | 1 | — | 4.12 | 5,604 | 828 | timeout |

### Spectrum Gen2 memory after 10 cycles

Cohort: spectrum-gen2-memory-v1. Zero cycles means after initial load and settling.

| Implementation | Checkpoints n | API success n | API unavailable n | API MiB | JS heap MiB | Browser DOM nodes | Event listeners | API status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | 1 | 1 | 0 | 5.31 | 5.01 | 6,456 | 547 | ok |
| Fluent Web Components | 1 | 1 | 0 | 3.79 | 4.38 | 4,617 | 692 | ok |
| Spectrum WC Gen2 + Gen1 | 1 | 1 | 0 | 8.12 | 5.71 | 5,055 | 843 | ok |

### Spectrum Gen2 memory after 50 cycles

Cohort: spectrum-gen2-memory-v1. Zero cycles means after initial load and settling.

| Implementation | Checkpoints n | API success n | API unavailable n | API MiB | JS heap MiB | Browser DOM nodes | Event listeners | API status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | 1 | 1 | 0 | 5.47 | 5.34 | 6,496 | 547 | ok |
| Fluent Web Components | 1 | 1 | 0 | 4.29 | 4.80 | 7,497 | 1,012 | ok |
| Spectrum WC Gen2 + Gen1 | 1 | 1 | 0 | 8.94 | 5.95 | 5,095 | 843 | ok |

### Spectrum Gen2 memory change from 10 to 50 cycles

Within-session change across 40 more journeys; separate application/native input retention, automation and GC before calling growth a library leak.

| Implementation | Complete checkpoint pairs n | Paired API readings n | API growth MiB | JS heap growth MiB | DOM node growth | Listener growth |
| --- | --- | --- | --- | --- | --- | --- |
| En Reve | 1 | 1 | 0.15 | 0.33 | 40 | 0 |
| Fluent Web Components | 1 | 1 | 0.50 | 0.42 | 2,880 | 320 |
| Spectrum WC Gen2 + Gen1 | 1 | 1 | 0.83 | 0.23 | 40 | 0 |

### Spectrum Gen2 diagnostic coverage

Cohort: spectrum-gen2-diagnostic-v1. Tracing and coverage have measurement overhead and remain separate from primary timings. These post-journey connected counts are not the browser-wide memory counters.

| Implementation | Successful n | Connected nodes | Connected elements | Open shadow roots | Style elements | Stylesheet adoptions | Unique adopted sheets |
| --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | 1 | 4,643 | 1,578 | 167 | 0 | 593 | 32 |
| Fluent Web Components | 1 | 2,889 | 1,284 | 169 | 0 | 221 | 32 |
| Spectrum WC Gen2 + Gen1 | 1 | 4,077 | 1,234 | 196 | 0 | 395 | 46 |

### Spectrum Gen2 exercised code coverage

Generated characters are not UTF-8 bytes. Injected collector and non-HTTP code are excluded. External CSS coverage does not include all adopted/CSS-in-JS styles; unexercised code is not necessarily removable.

| Implementation | Diagnostic n | Loaded JS characters | Exercised JS characters | Unexercised JS percent | External CSS characters | Unexercised external CSS percent |
| --- | --- | --- | --- | --- | --- | --- |
| En Reve | 1 | 414,400 | 305,205 | 26.4 | 40,755 | 0.5 |
| Fluent Web Components | 1 | 287,939 | 223,304 | 22.4 | 4,300 | 12.8 |
| Spectrum WC Gen2 + Gen1 | 1 | 1,271,551 | 1,025,999 | 19.3 | 120,318 | 2.7 |

### Spectrum Gen2 trace through diagnostic LCP

Renderer-main-thread categories clipped to each trace’s own LCP. Nested categories overlap; do not sum them or mix them with primary timings as one acquisition.

| Implementation | Diagnostic n | Main-thread RunTask ms | HTML parse ms | Layout tree update ms | Layout ms | Paint ms | Script evaluation ms |
| --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | 1 | 105.6 | 2.2 | 14.3 | 6.5 | 1.3 | 5.4 |
| Fluent Web Components | 1 | 97.0 | 2.7 | 11.2 | 11.5 | 1.9 | 5.7 |
| Spectrum WC Gen2 + Gen1 | 1 | 150.6 | 2.1 | 18.4 | 13.4 | 1.9 | 5.6 |

### Spectrum Gen2 whole-journey sampled function leads

Top five sampled functions per diagnostic journey. These are sampling leads across the complete journey, not exhaustive CPU attribution or startup-only costs. Source mapping and exact intervals remain in the [diagnostic summary](../showcases/performance/runs/spectrum-gen2-diagnostic-v1/diagnostics-summary.json) and retained trace.

| Implementation | Function | Source | Source line | Sample count | Sampled self ms |
| --- | --- | --- | --- | --- | --- |
| Fluent Web Components | define | ../../node_modules/@microsoft/fast-element/dist/esm/components/fast-definitions.js | 212 | 508 | 10.9 |
| Fluent Web Components | get displayValue | ../../node_modules/@fluentui/web-components/dist/esm/dropdown/dropdown.base.js | 95 | 82 | 10.6 |
| Fluent Web Components | (anonymous) | assets/index-DHbL8u7_.js | 1 | 58 | 7.5 |
| Fluent Web Components | (anonymous) | ../../node_modules/@fluentui/web-components/dist/esm/dialog/dialog.js | 110 | 55 | 7.0 |
| Fluent Web Components | hide | ../../node_modules/@fluentui/web-components/dist/esm/dialog/dialog.js | 130 | 41 | 4.8 |
| Spectrum WC Gen2 + Gen1 | get inputElementIsTruncated | ../../node_modules/@spectrum-web-components/textfield/src/TruncatedValueTooltipController.js | 1 | 218 | 28.6 |
| Spectrum WC Gen2 + Gen1 | (anonymous) | ../../node_modules/@lit/reactive-element/css-tag.js | 6 | 138 | 17.7 |
| Spectrum WC Gen2 + Gen1 | get styleSheet | ../../node_modules/@lit/reactive-element/css-tag.js | 6 | 122 | 14.9 |
| Spectrum WC Gen2 + Gen1 | (anonymous) | assets/index-C-QHQ0iw.js | 1 | 64 | 8.3 |
| Spectrum WC Gen2 + Gen1 | _$ET | ../../node_modules/@lit/reactive-element/reactive-element.js | 6 | 247 | 5.7 |
| En Reve | syncDialog | ../../node_modules/@en-reve/elements/dist/dialog/dialog.js | 236 | 223 | 28.0 |
| En Reve | isDisabled | ../../node_modules/@en-reve/elements/dist/toolbar/element.js | 37 | 79 | 10.0 |
| En Reve | available | ../../node_modules/@en-reve/elements/dist/menu/element.js | 417 | 71 | 9.1 |
| En Reve | _$ET | ../../node_modules/@lit/reactive-element/reactive-element.js | 6 | 170 | 7.3 |
| En Reve | (anonymous) | assets/index-CSoEuTYL.js | 1 | 52 | 6.7 |

### Spectrum Gen2 back-forward cache checks

Direct-CDP diagnostics verify same-document restoration and trusted post-return input. Raw samples retain restoration reasons and post-return interactivity for each attempt. This small sample does not attribute outcomes to library code. These are repeatable checks, not field hit rates or measured restoration latency.

| Implementation | Attempts n | Successful samples | Restored n | Interactive after return n |
| --- | --- | --- | --- | --- |
| En Reve | 5 | 5 | 3 | 5 |
| Fluent Web Components | 5 | 5 | 5 | 5 |
| Spectrum WC Gen2 + Gen1 | 5 | 5 | 5 | 5 |

### Spectrum Gen2 observer overhead calibration

Same-campaign paired on/off blocks; both variants use browser counters. The exploratory bootstrap interval can include zero without proving zero overhead. Probe work is also exposed separately in startup tables.

| Implementation | Profile | Metric | Paired blocks n | Collector on minus off ms | 95% interval low ms | 95% interval high ms |
| --- | --- | --- | --- | --- | --- | --- |
| En Reve | desktop | scriptMs | 5 | 1.0 | -0.5 | 2.0 |
| En Reve | desktop | taskMs | 5 | 5.6 | 2.1 | 10.2 |
| En Reve | desktop | layoutMs | 5 | -0.1 | -0.9 | 0.7 |
| En Reve | desktop | styleMs | 5 | -0.4 | -0.8 | 0.9 |
| Fluent Web Components | desktop | scriptMs | 5 | 1.0 | -5.0 | 2.5 |
| Fluent Web Components | desktop | taskMs | 5 | 8.5 | -3.9 | 10.2 |
| Fluent Web Components | desktop | layoutMs | 5 | 0.0 | -2.4 | 3.0 |
| Fluent Web Components | desktop | styleMs | 5 | -0.1 | -1.2 | 0.7 |
| Spectrum WC Gen2 + Gen1 | desktop | scriptMs | 5 | 1.2 | -0.5 | 4.1 |
| Spectrum WC Gen2 + Gen1 | desktop | taskMs | 5 | 6.4 | -0.9 | 14.1 |
| Spectrum WC Gen2 + Gen1 | desktop | layoutMs | 5 | -0.9 | -1.3 | 1.2 |
| Spectrum WC Gen2 + Gen1 | desktop | styleMs | 5 | -0.2 | -0.7 | 0.6 |

### Spectrum Gen2 same-cohort gaps

Positive differences mean En Reve took longer than the peer. Differences are medians from complete matched blocks in the new acquisition only, with paired-block exploratory bootstrap intervals and no multiple-comparison correction. Fewer than five complete pairs is unavailable. Intervals do not erase workstation noise, feature/typography differences or demonstrate causes. Historical cohorts are never paired here.

### Spectrum Gen2 Cold LCP gaps

Cohort: spectrum-gen2-load-v1, cold cache.

| Implementation | Profile | Matched blocks n | En Reve minus peer ms | 95% interval low ms | 95% interval high ms |
| --- | --- | --- | --- | --- | --- |
| Fluent Web Components | mobile | 10 | 96.0 | 90.0 | 104.0 |
| Spectrum WC Gen2 + Gen1 | mobile | 10 | -180.0 | -190.0 | -168.0 |
| Fluent Web Components | desktop | 10 | 14.0 | 12.0 | 20.0 |
| Spectrum WC Gen2 + Gen1 | desktop | 10 | -20.0 | -20.0 | -16.0 |

### Spectrum Gen2 Warm LCP gaps

Cohort: spectrum-gen2-load-v1, warm cache.

| Implementation | Profile | Matched blocks n | En Reve minus peer ms | 95% interval low ms | 95% interval high ms |
| --- | --- | --- | --- | --- | --- |
| Fluent Web Components | mobile | 10 | 70.0 | 60.0 | 80.0 |
| Spectrum WC Gen2 + Gen1 | mobile | 10 | -12.0 | -20.0 | -2.0 |
| Fluent Web Components | desktop | 10 | 16.0 | 10.0 | 22.0 |
| Spectrum WC Gen2 + Gen1 | desktop | 10 | -4.0 | -8.0 | 2.0 |

### Spectrum Gen2 Startup result gaps

Cohort: spectrum-gen2-startup-v1, cold cache.

| Implementation | Profile | Matched blocks n | En Reve minus peer ms | 95% interval low ms | 95% interval high ms |
| --- | --- | --- | --- | --- | --- |
| Fluent Web Components | mobile | 10 | 89.1 | 78.0 | 109.7 |
| Spectrum WC Gen2 + Gen1 | mobile | 10 | -171.5 | -190.5 | -153.1 |
| Fluent Web Components | desktop | 10 | 15.8 | 13.7 | 19.0 |
| Spectrum WC Gen2 + Gen1 | desktop | 10 | -15.4 | -21.7 | -12.1 |

### Spectrum Gen2 Scripted INP gaps

Cohort: spectrum-gen2-interactions-v1, cold cache.

| Implementation | Profile | Matched blocks n | En Reve minus peer ms | 95% interval low ms | 95% interval high ms |
| --- | --- | --- | --- | --- | --- |
| Fluent Web Components | mobile | 10 | -16.0 | -16.0 | 0.0 |
| Spectrum WC Gen2 + Gen1 | mobile | 0 | — | — | — |
| Fluent Web Components | desktop | 10 | 0.0 | 0.0 | 8.0 |
| Spectrum WC Gen2 + Gen1 | desktop | 10 | 0.0 | 0.0 | 8.0 |

### Spectrum Gen2 connected DOM review

Cohort **spectrum-gen2-dom-v1**; 30 successful / 0 failed snapshots. Browser: 153.0.8010.12. Desktop 1500 × 1100; narrow 390 × 844; DPR 1; CPU multiplier 1; network throttling none. [Full DOM protocol and measured asset hashes](../showcases/performance/runs/spectrum-gen2-dom-v1/manifest.json). Connected-tree diagnostics include light DOM and accessible open shadow roots once, without double-counting slot assignment. Closed/UA shadow roots, disconnected templates and browser-native picker internals are not inspected. Complete date fields include labels, native controls and owned custom popups. Without-date totals are arithmetic exclusions, not rebuilt variants. Browser-native dates are not assumed free. This preserves the earlier En Reve date/base audits while extending structural coverage; it does not rerun source audits or prove CPU savings.

### Spectrum Gen2 connected DOM acquisition coverage

Fresh sessions keep primary initial/after-journey, custom date lifecycle and supplemental ownership separate.

| Implementation | Desktop initial snapshots | Desktop journey snapshots | Narrow initial snapshots | Date lifecycle snapshots | Ownership snapshots |
| --- | --- | --- | --- | --- | --- |
| En Reve | 3 | 3 | 1 | 9 | 1 |
| Fluent Web Components | 3 | 3 | 1 | 0 | 1 |
| Spectrum WC Gen2 + Gen1 | 3 | 3 | 1 | 0 | 1 |

### Spectrum Gen2 connected totals with and without dates

Initial settled desktop tree. Date boundaries follow the entire field, rather than only the visible input. Current controls are remeasured with Spectrum Gen2 in the same diagnostic acquisition.

| Implementation | Samples n | Full nodes | Full elements | Date nodes | Date elements | Without date nodes | Without date elements |
| --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | 3 | 4642 | 1578 | 623 | 181 | 4019 | 1397 |
| Fluent Web Components | 3 | 2887 | 1284 | 28 | 12 | 2859 | 1272 |
| Spectrum WC Gen2 + Gen1 | 3 | 4075 | 1234 | 3 | 2 | 4072 | 1232 |

### Spectrum Gen2 full node composition

Whitespace is a subset of text. Comments can be renderer update/hydration markers and must not be mechanically removed. Physical depth includes shadow-root steps, not layout depth.

| Implementation | Elements | Text | Whitespace text | Comments | Open shadow roots | Other nodes | Slots | Base parts | Maximum physical depth |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | 1578 | 1843 | 1506 | 1052 | 167 | 2 | 414 | 55 | 27 |
| Fluent Web Components | 1284 | 1432 | 1198 | 0 | 169 | 2 | 457 | 0 | 18 |
| Spectrum WC Gen2 + Gen1 | 1234 | 2007 | 1768 | 636 | 196 | 2 | 359 | 0 | 22 |

### Spectrum Gen2 non-date node composition

Whitespace is a subset of text. Comments can be renderer update/hydration markers and must not be mechanically removed. Physical depth includes shadow-root steps, not layout depth.

| Implementation | Elements | Text | Whitespace text | Comments | Open shadow roots | Other nodes | Slots | Base parts | Maximum physical depth |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | 1397 | 1708 | 1429 | 756 | 156 | 2 | 391 | 50 | 22 |
| Fluent Web Components | 1272 | 1418 | 1185 | 0 | 167 | 2 | 451 | 0 | 18 |
| Spectrum WC Gen2 + Gen1 | 1232 | 2006 | 1768 | 636 | 196 | 2 | 359 | 0 | 22 |

### Spectrum Gen2 connected lifecycle changes

Connected lifecycle changes are not heap-retention or leak evidence. Narrow viewport retains desktop pointer behavior unless explicitly stated by the protocol.

| Implementation | Initial nodes | After journey nodes | Node change | Initial elements | After journey elements | Element change | Narrow initial nodes | Narrow initial elements |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | 4642 | 4643 | 1 | 1578 | 1578 | 0 | 4642 | 1578 |
| Fluent Web Components | 2887 | 2889 | 2 | 1284 | 1284 | 0 | 2887 | 1284 |
| Spectrum WC Gen2 + Gen1 | 4075 | 4077 | 2 | 1234 | 1234 | 0 | 4075 | 1234 |

### Spectrum Gen2 cohort custom-date lifecycle

Only custom-calendar implementations have visible-grid open/closed diagnostic sessions. Native-picker browser internals are outside census scope. These measurements do not make a browser-native date input equivalent to En Reve’s custom calendar.

| Implementation | State | Samples n | Full nodes | Full elements | Date nodes | Date elements | Without date nodes | Without date elements |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | initial | 3 | 4642 | 1578 | 623 | 181 | 4019 | 1397 |
| En Reve | date-open | 3 | 4642 | 1578 | 623 | 181 | 4019 | 1397 |
| En Reve | date-closed | 3 | 4642 | 1578 | 623 | 181 | 4019 | 1397 |

### Spectrum Gen2 light and shadow ownership

Physical ownership, not authorship or CPU cost. Host elements belong to their parent tree; their direct shadow internals, including ShadowRoot nodes, belong to that host bucket. Nested component internals belong to their own host.

| Implementation | Light-tree nodes | Shadow-tree nodes | Light-tree elements | Shadow-tree elements | Light whitespace | Shadow whitespace | Light comments | Shadow comments |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | 1275 | 3367 | 431 | 1147 | 412 | 1094 | 223 | 829 |
| Fluent Web Components | 771 | 2116 | 512 | 772 | 25 | 1173 | 0 | 0 |
| Spectrum WC Gen2 + Gen1 | 706 | 3369 | 463 | 771 | 15 | 1753 | 0 | 636 |

### Spectrum Gen2 repeated button shadow structure

Different native-control strategies and variant mixtures remain; this is an investigation guide, not a capability-matched microbenchmark. Slots and required semantic native controls are contracts, not automatic removal candidates.

| Implementation | Button family | Instances | Owned nodes | Owned elements | Elements per instance | Slots per instance | Comments per instance | Whitespace per instance |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | en-button | 49 | 784 | 294 | 6.00 | 4.00 | 2.00 | 7.00 |
| Fluent Web Components | fluent-button | 47 | 517 | 188 | 4.00 | 3.00 | 0.00 | 6.00 |
| Spectrum WC Gen2 + Gen1 | swc-button | 45 | 675 | 180 | 4.00 | 2.00 | 2.00 | 8.00 |

### Spectrum Gen2 connected base parts

Part naming is a convention: no base part does not mean no wrapper. SVG bases are rendering primitives. Earlier En Reve host-migration candidates remain proposals; moving part=base to a host does not preserve a consumer ::part(base) selector.

| Implementation | All base parts | SVG base parts | Non-SVG base parts | Without-date base parts | Without-date non-SVG base parts |
| --- | --- | --- | --- | --- | --- |
| En Reve | 55 | 19 | 36 | 50 | 35 |
| Fluent Web Components | 0 | 0 | 0 | 0 | 0 |
| Spectrum WC Gen2 + Gen1 | 0 | 0 | 0 | 0 | 0 |

### Spectrum Gen2 implications and next investigations

**The new mixed Spectrum build loads more slowly than both contemporaneous controls in the mobile cold profile.** Median LCP is 776 ms for Spectrum WC Gen2 + Gen1, 596 ms for frozen En Reve and 500 ms for frozen Fluent WC. Warm medians are 288, 276 and 206 ms. These same-acquisition values are exploratory; the previous Gen1 values are not a controlled before/after experiment. En Reve’s observed loading opportunity against Fluent remains relevant even though it is faster than this Spectrum fixture.

**Zero Lighthouse blocking time does not imply equal loading performance.** All three implementations record zero TBT and CLS in the bounded Lighthouse audits, while their LCP and Speed Index differ. Keep initial delivery, rendering and interaction evidence separate when choosing remediation.

**Spectrum mobile settled-journey metrics are unavailable because all ten journeys failed after dialog close.** The first canvas changes and dialog opening complete, but the repeated Landscape input does not change the canvas. All ten Spectrum desktop journeys and the En Reve/Fluent journeys pass. Failed samples remain in the evidence; partial actions are not promoted into complete-journey INP or transfer distributions. The independently measured early-click probe passes in both profiles.

**Retain the generation and memory scope.** Spectrum’s emitted artifacts include both Gen2 and remaining Gen1 controls and must not be described as Gen2-only package cost. The initial API-memory call timed out for Spectrum and En Reve, while both 10/50-cycle readings succeeded. One session per system and broad browser counters cannot establish leaks or a stable memory ranking.

**The focused failure diagnostic points to the retained Gen1 focus-trap lifecycle.** In separate diagnostics both with and without the timing collector, the dialog reports closed but its focus trap remains active; the next Landscape click is cancelled by the focus-trap module. This reproduces the failure beyond the timing collector alone, but does not establish a library-wide regression or isolate Gen1 versus coexistence effects. Keep the failed cohort intact, investigate native focus-trap activation/deactivation ordering under the mobile profile, and use a new acquisition ID after any fixture or protocol correction. [With-collector diagnostic](../showcases/performance/reports/spectrum-gen2/lifecycle-diagnostic-instrumented.json), [without-collector diagnostic](../showcases/performance/reports/spectrum-gen2/lifecycle-diagnostic.json).

**The current non-date node totals are close, but element counts still differ.** Spectrum has 4,075 connected nodes / 1,234 elements in total, or 4,072 / 1,232 excluding the native date field. En Reve has 4,642 / 1,578 in total, or 4,019 / 1,397 without its custom date field. En Reve has 53 fewer non-date nodes but 165 more non-date elements. Continue targeted element/template and custom-calendar investigations; total node count alone does not identify rendering cost.

### Spectrum Gen2 coverage boundaries

No production field/RUM evidence, SSR/hydration performance, physical-device validation, assistive-technology benchmark, routed soft-navigation metric, or realistic image/video workload is established by these fixtures. Native calendar UI internals are outside the connected census. Memory sessions remain exploratory. The inspired En Reve theme is functionally/visually qualified separately; its presence is not included in the frozen En Reve performance control. Missing measurements remain explicit rather than inferred from another suite or historical campaign.
