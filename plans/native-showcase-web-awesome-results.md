# Web Awesome comparison

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

This supplemental acquisition adds Web Awesome using its native web components and default styling. Frozen En Reve and Fluent Web Components are remeasured as contemporaneous controls. **The earlier eight-system measurements remain historical and unchanged.** Their identical-looking block numbers do not pair with these new samples. The nine-system overview explicitly labels each acquisition; use the new three-system tables and within-cohort contrasts to investigate current delivery differences.

Every measurement table is sortable in the En Reve HTML reader. KiB = 1,024 bytes; MiB = 1,048,576 bytes. A dash is unavailable, never zero. Missing values sort last. Raw production JS means emitted/minified bytes before compression, not browser compiled-code memory. This is an exploratory workstation comparison of complete native fixtures, not a library-only ranking or a release gate.

The new panel uses 10 blocks per profile/cache load cell, 10 startup and settled-interaction blocks per profile, five mobile Lighthouse audits, one 0/10/50-cycle memory session, one desktop diagnostic, five back-forward-cache checks and five paired observer on/off blocks per implementation. The requested total is 306 performance samples, plus 30 connected-DOM snapshots and three initial ownership snapshots.

Native Web Awesome uses its supported native date input; En Reve retains its custom calendar. Web Awesome also includes native Card, Rating and ColorPicker components; the custom color popup differs from several peers' native color input. Its free select supports participant selection but not the Pro Combobox's searchable filtering. These native capability and composition differences remain part of whole-page costs.

Web Awesome retains its native offscreen tab activation and layout behavior: tab content nodes are mounted, while the library activates and lays out panels according to its own visibility lifecycle. Initial-panel qualification scrolls the real page to the component and verifies the resulting visible panel; the CSR fixture does not force active attributes onto tab or panel children.

In the observed Chromium accessibility tree, Web Awesome 3.13.0's visible dialog/drawer labels and headings do not provide an accessible name for their internal native dialogs. The test adapter verifies the visible native `:modal` dialog while preserving stock output; this accommodation is not an accessibility fix or certification. [Native fixture qualification notes](../showcases/web-awesome/README.md).

Collection paused after 255 successful loading/startup/interaction/Lighthouse samples because another task held the shared browser-measurement lock. The memory-v1 attempt stopped before creating a manifest or recording a sample. After the lock became available, the remaining 51 samples ran under one continuous lock, starting with memory-v2. No successful sample was lost, replaced or retried. The final total is 306/306 successful performance samples, plus 30/30 DOM snapshots and three ownership snapshots. [Preserved pre-memory interruption receipt](../showcases/performance/reports/web-awesome/execution-blocked-before-memory.json).

[Machine-readable tables, distributions and input hashes](../showcases/performance/reports/web-awesome/tables.json). [Campaign configuration](../showcases/performance/reports/web-awesome/config.json). [Serial execution receipt](../showcases/performance/reports/web-awesome/execution.json). [Retained raw evidence and source receipt](../showcases/performance/reports/web-awesome/evidence/receipt.json).

### Web Awesome native-library identity

Pins, rendering, theme and artifact identity are read from the [final frozen inventory](../showcases/performance/reports/web-awesome/inventory.json), not current working-tree packages. En Reve's file/tarball dependency identifies its locally packed baseline. Source and lockfile hashes remain in that inventory. The Web Awesome-inspired En Reve theme is a separate artifact; it is not substituted into either native Web Awesome or the frozen En Reve control.

| Implementation | Direct dependency pins | Rendering | Native theme | Artifact SHA-256 |
| --- | --- | --- | --- | --- |
| En Reve | @en-reve/tokens@file:vendor/en-reve-tokens-0.1.0.tgz; @en-reve/styles@file:vendor/en-reve-styles-0.1.0.tgz; @en-reve/primitives@file:vendor/en-reve-primitives-0.1.0.tgz; @en-reve/elements@file:vendor/en-reve-elements-0.1.0.tgz; lit@3.3.3; signal-polyfill@0.2.2 | client | single default light appearance | ab6e473521da65174a73e31d19160bcd7f9c46abf2553d462a0b3506a27233a9 |
| Fluent Web Components | @fluentui/web-components@3.1.3; @fluentui/tokens@1.0.0-alpha.24 | client | single default light appearance | 46b61dac3922571774265d590a5ac56b5c2355ed489ffef9610e127a1f5428b0 |
| Web Awesome | @awesome.me/webawesome@3.13.0 | client | single default light appearance | aab9e1c57ad13cf25672dd75ab2bdddcefc1e65180b018f5655b3d77576c3778 |

### Web Awesome acquisition coverage

No failed sample is silently replaced. Primary loading, startup, settled interactions, Lighthouse, memory, tracing/coverage, observer overhead and back-forward cache have separate acquisitions and instrumentation. DOM census coverage is reported separately below.

| Campaign | Run ID | Date (UTC) | Planned samples | Recorded samples | Successful samples | Failed samples | Complete |
| --- | --- | --- | --- | --- | --- | --- | --- |
| load | web-awesome-load-v1 | 2026-09-21 | 120 | 120 | 120 | 0 | Yes |
| startup | web-awesome-startup-v1 | 2026-09-21 | 60 | 60 | 60 | 0 | Yes |
| interactions | web-awesome-interactions-v1 | 2026-09-21 | 60 | 60 | 60 | 0 | Yes |
| lighthouse | web-awesome-lighthouse-v1 | 2026-09-21 | 15 | 15 | 15 | 0 | Yes |
| memory | web-awesome-memory-v2 | 2026-09-21 | 3 | 3 | 3 | 0 | Yes |
| diagnostic | web-awesome-diagnostic-v1 | 2026-09-21 | 3 | 3 | 3 | 0 | Yes |
| bfcache | web-awesome-bfcache-v1 | 2026-09-21 | 15 | 15 | 15 | 0 | Yes |
| overhead | web-awesome-overhead-v1 | 2026-09-21 | 30 | 30 | 30 | 0 | Yes |

### Web Awesome browser and harness identity

The exact browser, renderer mode and archived harness identify these new results. Matching the source fixture does not make historical timings contemporaneous. Full host metadata and collection options remain in each manifest.

| Campaign | Started UTC | Browser | Browser mode | Harness SHA-256 | Collector SHA-256 |
| --- | --- | --- | --- | --- | --- |
| load | 2026-09-21T18:21:55.236Z | 153.0.8010.12 | bundled-chromium-headless-shell | b34f5d09f30f211ece2bda07fbbe60beec157c01044b67ac99398fd83221ce1e | e65e318d684b06cea3f13bbe3f8870797f1a0adf6cd688fc17ed2b689537a1d3 |
| startup | 2026-09-21T18:28:08.661Z | 153.0.8010.12 | bundled-chromium-headless-shell | b34f5d09f30f211ece2bda07fbbe60beec157c01044b67ac99398fd83221ce1e | e65e318d684b06cea3f13bbe3f8870797f1a0adf6cd688fc17ed2b689537a1d3 |
| interactions | 2026-09-21T18:28:53.000Z | 153.0.8010.12 | bundled-chromium-headless-shell | b34f5d09f30f211ece2bda07fbbe60beec157c01044b67ac99398fd83221ce1e | e65e318d684b06cea3f13bbe3f8870797f1a0adf6cd688fc17ed2b689537a1d3 |
| lighthouse | 2026-09-21T18:34:39.385Z | Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/153.0.0.0 Safari/537.36 | See audit receipt | b34f5d09f30f211ece2bda07fbbe60beec157c01044b67ac99398fd83221ce1e | — |
| memory | 2026-09-21T18:41:34.820Z | 153.0.8010.12 | bundled-full-chromium-new-headless | b34f5d09f30f211ece2bda07fbbe60beec157c01044b67ac99398fd83221ce1e | e65e318d684b06cea3f13bbe3f8870797f1a0adf6cd688fc17ed2b689537a1d3 |
| diagnostic | 2026-09-21T18:45:31.334Z | 153.0.8010.12 | bundled-chromium-headless-shell | b34f5d09f30f211ece2bda07fbbe60beec157c01044b67ac99398fd83221ce1e | e65e318d684b06cea3f13bbe3f8870797f1a0adf6cd688fc17ed2b689537a1d3 |
| bfcache | 2026-09-21T18:45:49.640Z | 153.0.8010.12 | bundled-full-chromium-new-headless-direct-cdp | b34f5d09f30f211ece2bda07fbbe60beec157c01044b67ac99398fd83221ce1e | e65e318d684b06cea3f13bbe3f8870797f1a0adf6cd688fc17ed2b689537a1d3 |
| overhead | 2026-09-21T18:46:39.250Z | 153.0.8010.12 | bundled-chromium-headless-shell | b34f5d09f30f211ece2bda07fbbe60beec157c01044b67ac99398fd83221ce1e | e65e318d684b06cea3f13bbe3f8870797f1a0adf6cd688fc17ed2b689537a1d3 |

### Web Awesome requested profiles

These are requested CDP profile values. Desktop uses no simulated CPU/network throttling. The mobile profile is desktop Chromium with a narrow viewport and emulated CPU/network limits, not a physical phone. Lighthouse separately applies its DevTools throttling settings; memory and DOM diagnostics have their own recorded protocol. Browser implementation and loopback serving limit real-world inference.

| Profile | Viewport width px | Viewport height px | DPR | CPU slowdown | Network latency ms | Download Mbps | Upload Mbps |
| --- | --- | --- | --- | --- | --- | --- | --- |
| desktop | 1500 | 1100 | 1 | 1 | 0 | Unthrottled | Unthrottled |
| mobile | 390 | 844 | 1 | 4 | 100 | 8.00 | 2.00 |

### Web Awesome loading and visual stability

Loading sends no input, retaining LCP eligibility through the observation window. Load plus 1.5 seconds and card readiness bounds CLS and resource observation. TTFB is from a loopback server. Warm visits reuse a primed context. Text LCP may legitimately have zero resource phases; independent attribution medians need not add to median LCP. Card-frame and final downloaded-font response timestamps do not prove every control is usable.

### Web Awesome mobile cold loading

FCP is first contentful paint; LCP is largest contentful paint; CLS uses eligible session-window scoring. Cohort: **web-awesome-load-v1**, mobile/cold. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | FCP ms | LCP ms | LCP p75 ms | CLS | CLS p75 | CLS max | TTFB ms | Cards frame opportunity ms | Last webfont response ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 614.0 | 614.0 | 647.0 | 0.000000 | 0.000000 | 0.000000 | 15.9 | 609.6 | — |
| Fluent Web Components | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 516.0 | 516.0 | 530.0 | 0.000000 | 0.000000 | 0.000000 | 15.6 | 509.9 | — |
| Web Awesome | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 604.0 | 604.0 | 611.0 | 0.000000 | 0.000000 | 0.000000 | 15.8 | 602.0 | — |

### Web Awesome mobile warm loading

FCP is first contentful paint; LCP is largest contentful paint; CLS uses eligible session-window scoring. Cohort: **web-awesome-load-v1**, mobile/warm. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | FCP ms | LCP ms | LCP p75 ms | CLS | CLS p75 | CLS max | TTFB ms | Cards frame opportunity ms | Last webfont response ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 298.0 | 298.0 | 313.0 | 0.000000 | 0.000000 | 0.000000 | 2.6 | 308.2 | — |
| Fluent Web Components | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 218.0 | 218.0 | 220.0 | 0.000000 | 0.000000 | 0.000000 | 2.5 | 226.6 | — |
| Web Awesome | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 246.0 | 246.0 | 248.0 | 0.000000 | 0.000000 | 0.000000 | 3.8 | 255.6 | — |

### Web Awesome mobile cold LCP attribution

web-vitals attribution; render delay includes discovery, JS, CSS, fonts and rendering. Cohort: **web-awesome-load-v1**, mobile/cold. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | TTFB portion ms | Resource delay ms | Resource duration ms | Element render delay ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 15.9 | 0.0 | 0.0 | 597.2 |
| Fluent Web Components | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 15.6 | 0.0 | 0.0 | 498.9 |
| Web Awesome | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 15.8 | 0.0 | 0.0 | 587.9 |

### Web Awesome mobile startup usability

One trusted click is dispatched at the first observed Landscape geometry, refreshed just before dispatch; the target, result and two-rAF frame opportunity are verified. This is an observed successful probe, not mathematically earliest usability, legacy TTI or field FID. Probe/dispatch overhead remains visible. Cohort: **web-awesome-startup-v1**, mobile/cold. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Control observed ms | Click from navigation ms | Result from navigation ms | Result p75 ms | Dispatch overhead ms | Discovery probe ms | Click to result ms | Click to frame ms | First input delay ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | web-awesome-startup-v1 | 2026-09-21 | 10 | 0 | 601.3 | 618.7 | 628.0 | 637.8 | 18.6 | 0.7 | 10.2 | 46.5 | 3.4 |
| Fluent Web Components | web-awesome-startup-v1 | 2026-09-21 | 10 | 0 | 466.5 | 520.8 | 528.7 | 552.4 | 54.6 | 0.6 | 8.1 | 42.1 | 5.1 |
| Web Awesome | web-awesome-startup-v1 | 2026-09-21 | 10 | 0 | 584.3 | 607.9 | 615.0 | 618.0 | 22.8 | 2.1 | 8.2 | 43.3 | 2.9 |

### Web Awesome desktop cold loading

FCP is first contentful paint; LCP is largest contentful paint; CLS uses eligible session-window scoring. Cohort: **web-awesome-load-v1**, desktop/cold. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | FCP ms | LCP ms | LCP p75 ms | CLS | CLS p75 | CLS max | TTFB ms | Cards frame opportunity ms | Last webfont response ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 96.0 | 96.0 | 96.0 | 0.000000 | 0.000000 | 0.000000 | 14.6 | 83.6 | — |
| Fluent Web Components | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 84.0 | 84.0 | 93.0 | 0.000075 | 0.000075 | 0.000075 | 16.7 | 76.2 | — |
| Web Awesome | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 96.0 | 96.0 | 99.0 | 0.000000 | 0.000000 | 0.000000 | 15.5 | 83.0 | — |

### Web Awesome desktop warm loading

FCP is first contentful paint; LCP is largest contentful paint; CLS uses eligible session-window scoring. Cohort: **web-awesome-load-v1**, desktop/warm. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | FCP ms | LCP ms | LCP p75 ms | CLS | CLS p75 | CLS max | TTFB ms | Cards frame opportunity ms | Last webfont response ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 44.0 | 44.0 | 44.0 | 0.000000 | 0.000000 | 0.000000 | 0.9 | 40.6 | — |
| Fluent Web Components | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 32.0 | 32.0 | 36.0 | 0.000075 | 0.000075 | 0.000075 | 4.2 | 28.2 | — |
| Web Awesome | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 36.0 | 36.0 | 36.0 | 0.000000 | 0.000000 | 0.000000 | 0.7 | 31.4 | — |

### Web Awesome desktop cold LCP attribution

web-vitals attribution; render delay includes discovery, JS, CSS, fonts and rendering. Cohort: **web-awesome-load-v1**, desktop/cold. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | TTFB portion ms | Resource delay ms | Resource duration ms | Element render delay ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 14.6 | 0.0 | 0.0 | 81.2 |
| Fluent Web Components | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 16.7 | 0.0 | 0.0 | 65.2 |
| Web Awesome | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 15.5 | 0.0 | 0.0 | 79.7 |

### Web Awesome desktop startup usability

One trusted click is dispatched at the first observed Landscape geometry, refreshed just before dispatch; the target, result and two-rAF frame opportunity are verified. This is an observed successful probe, not mathematically earliest usability, legacy TTI or field FID. Probe/dispatch overhead remains visible. Cohort: **web-awesome-startup-v1**, desktop/cold. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Control observed ms | Click from navigation ms | Result from navigation ms | Result p75 ms | Dispatch overhead ms | Discovery probe ms | Click to result ms | Click to frame ms | First input delay ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | web-awesome-startup-v1 | 2026-09-21 | 10 | 0 | 84.8 | 91.6 | 93.8 | 96.4 | 5.6 | 0.1 | 2.2 | 33.3 | 0.7 |
| Fluent Web Components | web-awesome-startup-v1 | 2026-09-21 | 10 | 0 | 65.3 | 78.5 | 80.3 | 83.7 | 13.4 | 0.1 | 1.3 | 36.8 | 0.7 |
| Web Awesome | web-awesome-startup-v1 | 2026-09-21 | 10 | 0 | 81.3 | 88.7 | 90.8 | 93.0 | 7.5 | 0.4 | 1.6 | 29.8 | 0.7 |

### Web Awesome production payload and chunking

All emitted production assets include fixture code, library/runtime code and authored styles; source maps and diagnostic metadata are excluded. Brotli/gzip are deterministic offline compression, while browser transfer is measured separately. Initial JS follows HTML/preload/static import reachability. A dynamic edge permits deferred loading but does not establish that bytes were deferred. The HTML measured here is a CSR shell; no SSR/hydration performance cohort is represented.

### Web Awesome transfer accounting correction

The original delivery aggregate counted embedded `data:` SVG responses as transferred bytes, even though their content was already included in JavaScript. This report replays the retained raw network observations through an HTTP(S)-only delivery utility. Timing measurements, raw samples and historical table rows are unchanged; only derived delivery totals and completion counts are corrected. Web Awesome has nine embedded icon fetch responses totalling 4,683 reported bytes, plus a zero-byte data-image response: its original cold total of 98,794 bytes becomes **94,111 HTTP(S) response bytes**, and its original warm total of 4,943 becomes **260 bytes**. The eight historical reference fixtures have no non-HTTP response bytes in the retained comparison, so their existing values remain unchanged. The machine-readable report records captured and corrected values per sample and exact hashes of the post-acquisition analysis sources. Non-HTTP response accounting is diagnostic; it is not added to wire totals.

### Web Awesome production payload sizes

One frozen build per implementation. Local-font zero does not imply no remote fonts; use browser transfer for actual responses.

| Implementation | JS raw KiB | JS gzip KiB | JS Brotli KiB | Initial JS Brotli KiB | CSS raw KiB | CSS Brotli KiB | Local fonts Brotli KiB | HTML raw KiB | HTML Brotli KiB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | 404.7 | 100.1 | 80.4 | 80.4 | 39.8 | 5.6 | 0.0 | 0.351 | 0.155 |
| Fluent Web Components | 281.2 | 69.3 | 57.1 | 57.1 | 4.2 | 1.2 | 0.0 | 0.364 | 0.173 |
| Web Awesome | 469.8 | 110.5 | 86.4 | 86.4 | 53.4 | 4.9 | 0.0 | 0.409 | 0.167 |

### Web Awesome emitted chunk structure

These are current fixture graphs, not the splitting ceiling of each library. Repeated source modules require inspection before claiming removable duplication.

| Implementation | JS files | CSS files | Static initial assets | Dynamic import edges | Sources in multiple chunks |
| --- | --- | --- | --- | --- | --- |
| En Reve | 1 | 1 | 2 | 0 | 0 |
| Fluent Web Components | 1 | 1 | 2 | 0 | 0 |
| Web Awesome | 1 | 1 | 2 | 0 | 0 |

### Web Awesome whole-page response delivery

Completed HTTP(S) CDP response bytes include HTML, JS, CSS, fonts and other network responses, excluding local schemes, collector endpoints and destination pages. These are browser response accounting, not TCP/TLS packet bytes. Incomplete HTTP responses make totals unavailable; missing assets are not free. The load visit is bounded; interaction transfer is a separate cumulative journey, not subtraction of two medians. Cache-reuse entries have zero Resource Timing transfer and a positive encoded body size.

### Web Awesome response-transfer derivation correction

Successful load-sample medians. Captured aggregates are retained historical fields inside the new raw files; every delivery table below uses the corrected HTTP(S)-only replay. Embedded/local responses are shown separately to make the correction inspectable. A missing completion remains unavailable rather than zero.

| Implementation | Profile | Cache | Successful n | Captured aggregate KiB | Corrected HTTP response KiB | Non-HTTP responses n | Non-HTTP completed KiB | Non-HTTP incomplete n |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | mobile | cold | 10 | 86.6 | 86.6 | 1 | 0.0 | 0 |
| Fluent Web Components | mobile | cold | 10 | 58.9 | 58.9 | 1 | 0.0 | 0 |
| Web Awesome | mobile | cold | 10 | 96.5 | 91.9 | 10 | 4.6 | 0 |
| En Reve | mobile | warm | 10 | 0.2 | 0.2 | 1 | 0.0 | 0 |
| Fluent Web Components | mobile | warm | 10 | 0.3 | 0.3 | 1 | 0.0 | 0 |
| Web Awesome | mobile | warm | 10 | 4.8 | 0.3 | 10 | 4.6 | 0 |
| En Reve | desktop | cold | 10 | 86.6 | 86.6 | 1 | 0.0 | 0 |
| Fluent Web Components | desktop | cold | 10 | 58.9 | 58.9 | 1 | 0.0 | 0 |
| Web Awesome | desktop | cold | 10 | 96.5 | 91.9 | 10 | 4.6 | 0 |
| En Reve | desktop | warm | 10 | 0.2 | 0.2 | 1 | 0.0 | 0 |
| Fluent Web Components | desktop | warm | 10 | 0.3 | 0.3 | 1 | 0.0 | 0 |
| Web Awesome | desktop | warm | 10 | 4.8 | 0.3 | 10 | 4.6 | 0 |

### Web Awesome mobile cold response transfer

Independently computed category medians need not sum exactly to median total. Cohort: **web-awesome-load-v1**, mobile/cold. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 86.6 | 0.325 | 80.5 | 5.7 | 0.0 | 0.0 | 3 | 0 | 0 |
| Fluent Web Components | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 58.9 | 0.344 | 57.2 | 1.3 | 0.0 | 0.0 | 3 | 0 | 0 |
| Web Awesome | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 91.9 | 0.336 | 86.5 | 5.1 | 0.0 | 0.0 | 3 | 0 | 0 |

### Web Awesome mobile warm response transfer

Independently computed category medians need not sum exactly to median total. Cohort: **web-awesome-load-v1**, mobile/warm. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 0.2 | 0.243 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| Fluent Web Components | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 0.3 | 0.262 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| Web Awesome | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 0.3 | 0.254 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |

### Web Awesome mobile cumulative interaction transfer

Whole successful journey, including requests caused by tested actions. Cohort: **web-awesome-interactions-v1**, mobile/cold. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | web-awesome-interactions-v1 | 2026-09-21 | 10 | 0 | 86.6 | 0.325 | 80.5 | 5.7 | 0.0 | 0.0 | 3 | 0 | 0 |
| Fluent Web Components | web-awesome-interactions-v1 | 2026-09-21 | 10 | 0 | 58.9 | 0.344 | 57.2 | 1.3 | 0.0 | 0.0 | 3 | 0 | 0 |
| Web Awesome | web-awesome-interactions-v1 | 2026-09-21 | 10 | 0 | 91.9 | 0.336 | 86.5 | 5.1 | 0.0 | 0.0 | 3 | 0 | 0 |

### Web Awesome desktop cold response transfer

Independently computed category medians need not sum exactly to median total. Cohort: **web-awesome-load-v1**, desktop/cold. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 86.6 | 0.325 | 80.5 | 5.7 | 0.0 | 0.0 | 3 | 0 | 0 |
| Fluent Web Components | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 58.9 | 0.344 | 57.2 | 1.3 | 0.0 | 0.0 | 3 | 0 | 0 |
| Web Awesome | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 91.9 | 0.336 | 86.5 | 5.1 | 0.0 | 0.0 | 3 | 0 | 0 |

### Web Awesome desktop warm response transfer

Independently computed category medians need not sum exactly to median total. Cohort: **web-awesome-load-v1**, desktop/warm. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 0.2 | 0.243 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| Fluent Web Components | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 0.3 | 0.262 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| Web Awesome | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 0.3 | 0.254 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |

### Web Awesome desktop cumulative interaction transfer

Whole successful journey, including requests caused by tested actions. Cohort: **web-awesome-interactions-v1**, desktop/cold. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | web-awesome-interactions-v1 | 2026-09-21 | 10 | 0 | 86.6 | 0.325 | 80.5 | 5.7 | 0.0 | 0.0 | 3 | 0 | 0 |
| Fluent Web Components | web-awesome-interactions-v1 | 2026-09-21 | 10 | 0 | 58.9 | 0.344 | 57.2 | 1.3 | 0.0 | 0.0 | 3 | 0 | 0 |
| Web Awesome | web-awesome-interactions-v1 | 2026-09-21 | 10 | 0 | 91.9 | 0.336 | 86.5 | 5.1 | 0.0 | 0.0 | 3 | 0 | 0 |

### Web Awesome main-thread and blocking work

CDP script, style, layout and task counters are measured at the bounded load endpoint and can overlap. Long-task and long-animation-frame totals include their whole durations and are not TBT. Blocking excess sums only long-task portions beyond 50 ms, clipped before FCP or from FCP to the observation endpoint. Lighthouse TBT has a different endpoint and is reported separately. Use traces before assigning critical-path causes.

### Web Awesome mobile cold main-thread work

These are measured costs, not an additive decomposition of LCP. Cohort: **web-awesome-load-v1**, mobile/cold. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Script ms | Style ms | Layout ms | Task ms | Layout passes | Style recalcs | Long tasks ms | Pre-FCP blocking excess ms | Post-FCP blocking excess ms | Long animation frames ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 77.3 | 58.2 | 32.0 | 352.9 | 8 | 11 | 266.0 | 216.0 | 0.0 | 387.1 |
| Fluent Web Components | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 116.7 | 40.8 | 42.7 | 282.0 | 5 | 10 | 160.0 | 110.0 | 0.0 | 303.1 |
| Web Awesome | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 79.7 | 43.3 | 34.0 | 345.5 | 4 | 6 | 244.0 | 194.0 | 0.0 | 366.8 |

### Web Awesome mobile warm main-thread work

These are measured costs, not an additive decomposition of LCP. Cohort: **web-awesome-load-v1**, mobile/warm. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Script ms | Style ms | Layout ms | Task ms | Layout passes | Style recalcs | Long tasks ms | Pre-FCP blocking excess ms | Post-FCP blocking excess ms | Long animation frames ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 55.8 | 42.3 | 13.6 | 241.2 | 8 | 11 | 162.5 | 112.5 | 0.0 | 166.2 |
| Fluent Web Components | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 55.4 | 18.6 | 8.8 | 153.0 | 5 | 10 | 68.5 | 18.5 | 0.0 | 86.0 |
| Web Awesome | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 47.3 | 15.8 | 7.4 | 192.1 | 4 | 6 | 110.5 | 60.5 | 0.0 | 114.3 |

### Web Awesome desktop cold main-thread work

These are measured costs, not an additive decomposition of LCP. Cohort: **web-awesome-load-v1**, desktop/cold. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Script ms | Style ms | Layout ms | Task ms | Layout passes | Style recalcs | Long tasks ms | Pre-FCP blocking excess ms | Post-FCP blocking excess ms | Long animation frames ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 15.9 | 12.0 | 6.0 | 75.3 | 8 | 10 | 54.5 | 4.5 | 0.0 | 56.7 |
| Fluent Web Components | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 24.1 | 9.8 | 8.6 | 61.3 | 5 | 10 | 0.0 | 0.0 | 0.0 | 0.0 |
| Web Awesome | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 16.2 | 10.5 | 7.3 | 73.7 | 4 | 6 | 51.0 | 1.0 | 0.0 | 54.9 |

### Web Awesome desktop warm main-thread work

These are measured costs, not an additive decomposition of LCP. Cohort: **web-awesome-load-v1**, desktop/warm. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Script ms | Style ms | Layout ms | Task ms | Layout passes | Style recalcs | Long tasks ms | Pre-FCP blocking excess ms | Post-FCP blocking excess ms | Long animation frames ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 10.4 | 8.2 | 3.0 | 48.8 | 7 | 10 | 0.0 | 0.0 | 0.0 | 0.0 |
| Fluent Web Components | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 12.0 | 3.8 | 2.1 | 35.7 | 4 | 9 | 0.0 | 0.0 | 0.0 | 0.0 |
| Web Awesome | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 9.6 | 3.5 | 1.8 | 42.5 | 4 | 5 | 0.0 | 0.0 | 0.0 | 0.0 |

### Web Awesome repeated mobile Lighthouse audits

Fresh full-Chromium audits, separate from headless-shell load samples. Lighthouse owns DevTools throttling in this lane. Zero TBT does not establish zero startup work. Cohort: **web-awesome-lighthouse-v1**, mobile/cold. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | FCP ms | LCP ms | LCP p75 ms | LCP max ms | TBT ms | TBT p75 ms | TBT max ms | Speed Index ms | CLS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | web-awesome-lighthouse-v1 | 2026-09-21 | 5 | 0 | 869.9 | 869.9 | 943.3 | 980.5 | 0.0 | 0.0 | 0.0 | 687.0 | 0.000000 |
| Fluent Web Components | web-awesome-lighthouse-v1 | 2026-09-21 | 5 | 0 | 636.4 | 636.4 | 644.1 | 730.5 | 0.0 | 0.0 | 0.0 | 638.0 | 0.000000 |
| Web Awesome | web-awesome-lighthouse-v1 | 2026-09-21 | 5 | 0 | 765.6 | 765.6 | 781.7 | 796.7 | 0.0 | 0.0 | 0.0 | 581.0 | 0.000000 |

### Web Awesome recorded Lighthouse throttling

Settings read from each retained Lighthouse JSON, rather than inferred from a generic mobile preset. DevTools uses request latency and download/upload values; the unused simulation rtt/throughput defaults are not presented as applied network limits. Lighthouse also emulates a mobile user agent/screen, unlike the primary narrow desktop-context lane.

| Implementation | Audits n | Lighthouse version | Throttle method | CPU slowdown | Request latency ms | Download Kbps | Upload Kbps | Screen emulation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | 5 | 13.5.0 | devtools | 4 | 100 | 8000 | 2000 | Mobile |
| Fluent Web Components | 5 | 13.5.0 | devtools | 4 | 100 | 8000 | 2000 | Mobile |
| Web Awesome | 5 | 13.5.0 | devtools | 4 | 100 | 8000 | 2000 | Mobile |

### Web Awesome interaction responsiveness

The settled journey tests first/repeated canvas changes, assets, dialogs, review submission and command opening. Scripted-session INP is not field INP. Browser first-input delay excludes handler and rendering time and is not a field FID sample. Event Timing has threshold/quantization limits; missing events remain unavailable. Semantic completion is verified DOM state; two rAFs indicate frame opportunity, not actual display presentation. Calendar interaction timings, typing and keyboard-specific paths are not covered by these seven actions.

### Web Awesome mobile interaction summary

Maximum scroll rAF gap is a scheduler diagnostic, not an inferred dropped-frame percentage. Cohort: **web-awesome-interactions-v1**, mobile/cold. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Scripted INP ms | Scripted INP p75 ms | First input delay ms | Journey CLS | Max scroll rAF gap ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | web-awesome-interactions-v1 | 2026-09-21 | 10 | 0 | 56.0 | 56.0 | 3.3 | 0.000000 | 16.8 |
| Fluent Web Components | web-awesome-interactions-v1 | 2026-09-21 | 10 | 0 | 64.0 | 64.0 | 2.8 | 0.000000 | 16.8 |
| Web Awesome | web-awesome-interactions-v1 | 2026-09-21 | 10 | 0 | 48.0 | 48.0 | 2.6 | 0.000000 | 16.8 |

### Web Awesome mobile individual actions

Cohort: web-awesome-interactions-v1, mobile/cold. Sort Action to compare the same operation. First and repeated actions expose possible deferred work. Event-entry counts show attribution coverage.

| Implementation | Action | Successful n | Failed journeys | Result ms | Frame opportunity ms | Frame p75 ms | Event entries n | Input delay ms | Processing ms | Presentation ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | First canvas change | 10 | 0 | 11.6 | 52.3 | 54.4 | 10 | 3.3 | 3.4 | 45.3 |
| Fluent Web Components | First canvas change | 10 | 0 | 6.5 | 45.9 | 48.6 | 10 | 2.8 | 1.2 | 44.0 |
| Web Awesome | First canvas change | 10 | 0 | 7.9 | 45.6 | 51.2 | 10 | 2.6 | 2.4 | 43.0 |
| En Reve | Repeated canvas change | 10 | 0 | 7.9 | 30.1 | 30.4 | 10 | 2.1 | 2.3 | 11.6 |
| Fluent Web Components | Repeated canvas change | 10 | 0 | 3.5 | 30.4 | 30.8 | 10 | 1.8 | 0.7 | 13.7 |
| Web Awesome | Repeated canvas change | 10 | 0 | 5.0 | 30.2 | 30.8 | 10 | 1.7 | 1.7 | 12.4 |
| En Reve | First asset addition | 10 | 0 | 10.8 | 29.2 | 29.8 | 10 | 2.7 | 2.6 | 42.8 |
| Fluent Web Components | First asset addition | 10 | 0 | 4.6 | 29.5 | 29.8 | 10 | 1.7 | 0.9 | 61.4 |
| Web Awesome | First asset addition | 10 | 0 | 5.8 | 29.0 | 29.3 | 10 | 1.8 | 1.4 | 44.8 |
| En Reve | First dialog opening | 10 | 0 | 39.9 | 45.9 | 51.5 | 10 | 2.6 | 1.3 | 44.8 |
| Fluent Web Components | First dialog opening | 10 | 0 | 4.3 | 37.3 | 38.5 | 10 | 2.2 | 0.6 | 37.1 |
| Web Awesome | First dialog opening | 10 | 0 | 32.3 | 43.0 | 44.1 | 10 | 2.0 | 1.5 | 40.5 |
| En Reve | Repeated dialog opening | 10 | 0 | 19.0 | 31.2 | 32.0 | 10 | 2.5 | 1.1 | 28.3 |
| Fluent Web Components | Repeated dialog opening | 10 | 0 | 3.7 | 53.3 | 56.5 | 10 | 2.0 | 0.6 | 29.6 |
| Web Awesome | Repeated dialog opening | 10 | 0 | 31.1 | 38.4 | 39.2 | 10 | 2.1 | 1.4 | 36.5 |
| En Reve | Review submission | 10 | 0 | 8.7 | 29.4 | 30.0 | 10 | 2.0 | 2.4 | 11.9 |
| Fluent Web Components | Review submission | 10 | 0 | 4.6 | 27.7 | 28.4 | 10 | 0.7 | 1.3 | 14.1 |
| Web Awesome | Review submission | 10 | 0 | 6.8 | 29.6 | 30.4 | 10 | 1.8 | 1.6 | 12.6 |
| En Reve | First command opening | 10 | 0 | 25.2 | 35.1 | 38.3 | 10 | 2.7 | 1.6 | 35.1 |
| Fluent Web Components | First command opening | 10 | 0 | 4.2 | 40.4 | 57.5 | 10 | 2.2 | 0.8 | 29.0 |
| Web Awesome | First command opening | 10 | 0 | 25.9 | 33.9 | 34.7 | 10 | 2.1 | 2.0 | 28.0 |

### Web Awesome desktop interaction summary

Maximum scroll rAF gap is a scheduler diagnostic, not an inferred dropped-frame percentage. Cohort: **web-awesome-interactions-v1**, desktop/cold. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Scripted INP ms | Scripted INP p75 ms | First input delay ms | Journey CLS | Max scroll rAF gap ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | web-awesome-interactions-v1 | 2026-09-21 | 10 | 0 | 48.0 | 48.0 | 0.7 | 0.000000 | 16.8 |
| Fluent Web Components | web-awesome-interactions-v1 | 2026-09-21 | 10 | 0 | 48.0 | 48.0 | 0.6 | 0.000075 | 16.8 |
| Web Awesome | web-awesome-interactions-v1 | 2026-09-21 | 10 | 0 | 40.0 | 48.0 | 0.7 | 0.000000 | 16.8 |

### Web Awesome desktop individual actions

Cohort: web-awesome-interactions-v1, desktop/cold. Sort Action to compare the same operation. First and repeated actions expose possible deferred work. Event-entry counts show attribution coverage.

| Implementation | Action | Successful n | Failed journeys | Result ms | Frame opportunity ms | Frame p75 ms | Event entries n | Input delay ms | Processing ms | Presentation ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | First canvas change | 10 | 0 | 2.5 | 42.1 | 43.6 | 10 | 0.7 | 0.7 | 46.4 |
| Fluent Web Components | First canvas change | 10 | 0 | 1.3 | 42.7 | 45.1 | 10 | 0.6 | 0.2 | 47.2 |
| Web Awesome | First canvas change | 10 | 0 | 1.7 | 40.3 | 43.3 | 10 | 0.7 | 0.5 | 39.0 |
| En Reve | Repeated canvas change | 10 | 0 | 1.6 | 31.9 | 32.6 | 10 | 0.5 | 0.5 | 31.0 |
| Fluent Web Components | Repeated canvas change | 10 | 0 | 0.8 | 32.0 | 32.2 | 10 | 0.4 | 0.1 | 15.5 |
| Web Awesome | Repeated canvas change | 10 | 0 | 1.0 | 32.0 | 32.7 | 10 | 0.4 | 0.3 | 15.3 |
| En Reve | First asset addition | 10 | 0 | 2.2 | 31.7 | 32.0 | 10 | 0.6 | 0.5 | 30.9 |
| Fluent Web Components | First asset addition | 10 | 0 | 1.0 | 31.7 | 31.8 | 10 | 0.4 | 0.1 | 31.5 |
| Web Awesome | First asset addition | 10 | 0 | 1.2 | 31.8 | 32.0 | 10 | 0.4 | 0.4 | 31.3 |
| En Reve | First dialog opening | 10 | 0 | 8.5 | 31.7 | 31.7 | 10 | 0.6 | 0.2 | 31.2 |
| Fluent Web Components | First dialog opening | 10 | 0 | 0.8 | 31.9 | 32.0 | 10 | 0.4 | 0.1 | 31.5 |
| Web Awesome | First dialog opening | 10 | 0 | 6.6 | 31.9 | 32.2 | 10 | 0.5 | 0.3 | 31.2 |
| En Reve | Repeated dialog opening | 10 | 0 | 4.0 | 31.5 | 31.7 | 10 | 0.5 | 0.2 | 31.3 |
| Fluent Web Components | Repeated dialog opening | 10 | 0 | 0.7 | 31.9 | 32.0 | 10 | 0.4 | 0.1 | 23.5 |
| Web Awesome | Repeated dialog opening | 10 | 0 | 6.1 | 32.0 | 32.1 | 10 | 0.5 | 0.3 | 31.2 |
| En Reve | Review submission | 10 | 0 | 1.7 | 31.9 | 32.1 | 10 | 0.5 | 0.5 | 31.1 |
| Fluent Web Components | Review submission | 10 | 0 | 1.1 | 31.6 | 31.8 | 10 | 0.4 | 0.1 | 15.5 |
| Web Awesome | Review submission | 10 | 0 | 1.3 | 31.9 | 32.1 | 10 | 0.5 | 0.3 | 15.2 |
| En Reve | First command opening | 10 | 0 | 5.0 | 31.7 | 31.9 | 10 | 0.6 | 0.2 | 31.2 |
| Fluent Web Components | First command opening | 10 | 0 | 0.8 | 31.6 | 31.7 | 10 | 0.5 | 0.1 | 23.5 |
| Web Awesome | First command opening | 10 | 0 | 4.8 | 31.8 | 32.1 | 10 | 0.5 | 0.4 | 31.2 |

### Web Awesome memory and lifecycle

A separate cross-origin-isolated full-Chromium lane disables timing observers and samples at 0, 10 and 50 native journeys. Reviews replace status text rather than append records. API memory, JS heap and browser DOM counters have different scopes. One session per implementation and GC-dependent API readings cannot establish leaks or a robust memory ranking. API timeout/error is explicit; checkpoints reached before later failure remain reported.

### Web Awesome memory after 0 cycles

Cohort: web-awesome-memory-v2. Zero cycles means after initial load and settling.

| Implementation | Checkpoints n | API success n | API unavailable n | API MiB | JS heap MiB | Browser DOM nodes | Event listeners | API status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | 1 | 1 | 0 | 4.84 | 4.09 | 6,339 | 547 | ok |
| Fluent Web Components | 1 | 1 | 0 | 3.51 | 3.32 | 3,851 | 613 | ok |
| Web Awesome | 1 | 1 | 0 | 4.45 | 3.68 | 5,136 | 747 | ok |

### Web Awesome memory after 10 cycles

Cohort: web-awesome-memory-v2. Zero cycles means after initial load and settling.

| Implementation | Checkpoints n | API success n | API unavailable n | API MiB | JS heap MiB | Browser DOM nodes | Event listeners | API status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | 1 | 1 | 0 | 5.32 | 5.01 | 6,456 | 547 | ok |
| Fluent Web Components | 1 | 1 | 0 | 3.90 | 4.40 | 4,617 | 692 | ok |
| Web Awesome | 1 | 1 | 0 | 4.74 | 4.58 | 5,223 | 747 | ok |

### Web Awesome memory after 50 cycles

Cohort: web-awesome-memory-v2. Zero cycles means after initial load and settling.

| Implementation | Checkpoints n | API success n | API unavailable n | API MiB | JS heap MiB | Browser DOM nodes | Event listeners | API status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | 1 | 1 | 0 | 5.46 | 5.34 | 6,496 | 547 | ok |
| Fluent Web Components | 1 | 1 | 0 | 4.36 | 4.82 | 7,497 | 1,012 | ok |
| Web Awesome | 1 | 1 | 0 | 4.86 | 4.81 | 5,263 | 747 | ok |

### Web Awesome memory change from 10 to 50 cycles

Within-session change across 40 more journeys; separate application/native input retention, automation and GC before calling growth a library leak.

| Implementation | Complete checkpoint pairs n | Paired API readings n | API growth MiB | JS heap growth MiB | DOM node growth | Listener growth |
| --- | --- | --- | --- | --- | --- | --- |
| En Reve | 1 | 1 | 0.15 | 0.33 | 40 | 0 |
| Fluent Web Components | 1 | 1 | 0.46 | 0.42 | 2,880 | 320 |
| Web Awesome | 1 | 1 | 0.11 | 0.23 | 40 | 0 |

### Web Awesome diagnostic coverage

Cohort: web-awesome-diagnostic-v1. Tracing and coverage have measurement overhead and remain separate from primary timings. These post-journey connected counts are not the browser-wide memory counters.

| Implementation | Successful n | Connected nodes | Connected elements | Open shadow roots | Style elements | Stylesheet adoptions | Unique adopted sheets |
| --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | 1 | 4,643 | 1,578 | 167 | 0 | 593 | 32 |
| Fluent Web Components | 1 | 2,889 | 1,284 | 169 | 0 | 221 | 32 |
| Web Awesome | 1 | 4,212 | 1,401 | 197 | 0 | 611 | 36 |

### Web Awesome exercised code coverage

Generated characters are not UTF-8 bytes. Injected collector and non-HTTP code are excluded. External CSS coverage does not include all adopted/CSS-in-JS styles; unexercised code is not necessarily removable.

| Implementation | Diagnostic n | Loaded JS characters | Exercised JS characters | Unexercised JS percent | External CSS characters | Unexercised external CSS percent |
| --- | --- | --- | --- | --- | --- | --- |
| En Reve | 1 | 414,400 | 305,205 | 26.4 | 40,755 | 0.5 |
| Fluent Web Components | 1 | 287,939 | 223,304 | 22.4 | 4,300 | 12.8 |
| Web Awesome | 1 | 480,999 | 348,690 | 27.5 | 54,664 | 2.1 |

### Web Awesome trace through diagnostic LCP

Renderer-main-thread categories clipped to each trace’s own LCP. Nested categories overlap; do not sum them or mix them with primary timings as one acquisition.

| Implementation | Diagnostic n | Main-thread RunTask ms | HTML parse ms | Layout tree update ms | Layout ms | Paint ms | Script evaluation ms |
| --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | 1 | 140.8 | 2.9 | 21.8 | 10.1 | 1.7 | 5.8 |
| Fluent Web Components | 1 | 84.8 | 1.9 | 10.8 | 10.4 | 1.6 | 5.8 |
| Web Awesome | 1 | 115.3 | 1.8 | 13.6 | 11.3 | 2.2 | 5.6 |

### Web Awesome whole-journey sampled function leads

Top five sampled functions per diagnostic journey. These are sampling leads across the complete journey, not exhaustive CPU attribution or startup-only costs. Source mapping and exact intervals remain in the [diagnostic summary](../showcases/performance/runs/web-awesome-diagnostic-v1/diagnostics-summary.json) and retained trace.

| Implementation | Function | Source | Source line | Sample count | Sampled self ms |
| --- | --- | --- | --- | --- | --- |
| En Reve | syncDialog | ../../node_modules/@en-reve/elements/dist/dialog/dialog.js | 236 | 228 | 30.6 |
| En Reve | isDisabled | ../../node_modules/@en-reve/elements/dist/toolbar/element.js | 37 | 103 | 15.2 |
| En Reve | available | ../../node_modules/@en-reve/elements/dist/menu/element.js | 417 | 88 | 14.5 |
| En Reve | r | ../../node_modules/@en-reve/elements/dist/internal/calendar-adapter.js | 6 | 72 | 10.1 |
| En Reve | (anonymous) | assets/index-CSoEuTYL.js | 1 | 57 | 7.9 |
| Web Awesome | updateScrollControls | ../../node_modules/@awesome.me/webawesome/dist/chunks/chunk.3H27LNYN.js | 254 | 156 | 23.1 |
| Web Awesome | _$ET | ../../node_modules/@lit/reactive-element/reactive-element.js | 6 | 516 | 12.6 |
| Web Awesome | (anonymous) | assets/index-BG3Zw-nj.js | 1 | 86 | 11.5 |
| Web Awesome | requestClose | ../../node_modules/@awesome.me/webawesome/dist/chunks/chunk.YSHBD3IU.js | 89 | 75 | 9.5 |
| Web Awesome | show | ../../node_modules/@awesome.me/webawesome/dist/chunks/chunk.YSHBD3IU.js | 170 | 64 | 8.4 |
| Fluent Web Components | define | ../../node_modules/@microsoft/fast-element/dist/esm/components/fast-definitions.js | 212 | 513 | 10.2 |
| Fluent Web Components | (anonymous) | ../../node_modules/@fluentui/web-components/dist/esm/dialog/dialog.js | 110 | 52 | 7.5 |
| Fluent Web Components | (anonymous) | assets/index-DHbL8u7_.js | 1 | 50 | 6.6 |
| Fluent Web Components | hide | ../../node_modules/@fluentui/web-components/dist/esm/dialog/dialog.js | 130 | 45 | 5.3 |
| Fluent Web Components | get displayValue | ../../node_modules/@fluentui/web-components/dist/esm/dropdown/dropdown.base.js | 95 | 36 | 4.8 |

### Web Awesome back-forward cache checks

Direct-CDP diagnostics verify same-document restoration and trusted post-return input. For all three non-restores, the browser exposed only masked notRestoredReasons; every return remained interactive. This small sample does not attribute those outcomes to library code. These are repeatable checks, not field hit rates or measured restoration latency.

| Implementation | Attempts n | Successful samples | Restored n | Interactive after return n |
| --- | --- | --- | --- | --- |
| En Reve | 5 | 5 | 3 | 5 |
| Fluent Web Components | 5 | 5 | 4 | 5 |
| Web Awesome | 5 | 5 | 5 | 5 |

### Web Awesome observer overhead calibration

Same-campaign paired on/off blocks; both variants use browser counters. The exploratory bootstrap interval can include zero without proving zero overhead. Probe work is also exposed separately in startup tables.

| Implementation | Profile | Metric | Paired blocks n | Collector on minus off ms | 95% interval low ms | 95% interval high ms |
| --- | --- | --- | --- | --- | --- | --- |
| En Reve | desktop | scriptMs | 5 | 1.5 | 0.8 | 2.7 |
| En Reve | desktop | taskMs | 5 | 7.4 | -5.7 | 18.6 |
| En Reve | desktop | layoutMs | 5 | 0.4 | -0.9 | 1.4 |
| En Reve | desktop | styleMs | 5 | 0.2 | -3.0 | 2.3 |
| Fluent Web Components | desktop | scriptMs | 5 | 0.1 | -2.1 | 1.7 |
| Fluent Web Components | desktop | taskMs | 5 | 3.4 | -2.6 | 6.9 |
| Fluent Web Components | desktop | layoutMs | 5 | 0.1 | -1.7 | 0.8 |
| Fluent Web Components | desktop | styleMs | 5 | -0.4 | -2.8 | 0.1 |
| Web Awesome | desktop | scriptMs | 5 | 0.8 | -2.1 | 2.8 |
| Web Awesome | desktop | taskMs | 5 | 8.0 | -14.1 | 22.0 |
| Web Awesome | desktop | layoutMs | 5 | 1.2 | -0.7 | 1.2 |
| Web Awesome | desktop | styleMs | 5 | 0.6 | -2.8 | 2.5 |

### Web Awesome same-cohort gaps

Positive differences mean En Reve took longer than the peer. Differences are medians from complete matched blocks in the new acquisition only, with paired-block exploratory bootstrap intervals and no multiple-comparison correction. Fewer than five complete pairs is unavailable. Intervals do not erase workstation noise, feature/typography differences or demonstrate causes. Historical cohorts are never paired here.

### Web Awesome Cold LCP gaps

Cohort: web-awesome-load-v1, cold cache.

| Implementation | Profile | Matched blocks n | En Reve minus peer ms | 95% interval low ms | 95% interval high ms |
| --- | --- | --- | --- | --- | --- |
| Fluent Web Components | mobile | 10 | 98.0 | 82.0 | 140.0 |
| Web Awesome | mobile | 10 | 10.0 | -4.0 | 54.0 |
| Fluent Web Components | desktop | 10 | 12.0 | 0.0 | 18.0 |
| Web Awesome | desktop | 10 | 0.0 | -6.0 | 4.0 |

### Web Awesome Warm LCP gaps

Cohort: web-awesome-load-v1, warm cache.

| Implementation | Profile | Matched blocks n | En Reve minus peer ms | 95% interval low ms | 95% interval high ms |
| --- | --- | --- | --- | --- | --- |
| Fluent Web Components | mobile | 10 | 80.0 | 66.0 | 96.0 |
| Web Awesome | mobile | 10 | 52.0 | 36.0 | 68.0 |
| Fluent Web Components | desktop | 10 | 12.0 | 8.0 | 16.0 |
| Web Awesome | desktop | 10 | 8.0 | 8.0 | 12.0 |

### Web Awesome Startup result gaps

Cohort: web-awesome-startup-v1, cold cache.

| Implementation | Profile | Matched blocks n | En Reve minus peer ms | 95% interval low ms | 95% interval high ms |
| --- | --- | --- | --- | --- | --- |
| Fluent Web Components | mobile | 10 | 99.3 | 61.5 | 119.4 |
| Web Awesome | mobile | 10 | 13.0 | 5.0 | 27.4 |
| Fluent Web Components | desktop | 10 | 13.5 | 7.0 | 17.1 |
| Web Awesome | desktop | 10 | 3.0 | -1.4 | 7.8 |

### Web Awesome Scripted INP gaps

Cohort: web-awesome-interactions-v1, cold cache.

| Implementation | Profile | Matched blocks n | En Reve minus peer ms | 95% interval low ms | 95% interval high ms |
| --- | --- | --- | --- | --- | --- |
| Fluent Web Components | mobile | 10 | -8.0 | -16.0 | -8.0 |
| Web Awesome | mobile | 10 | 8.0 | 0.0 | 8.0 |
| Fluent Web Components | desktop | 10 | 0.0 | -8.0 | 8.0 |
| Web Awesome | desktop | 10 | 8.0 | -4.0 | 8.0 |

### Nine-system grouped historical comparisons

The following grouped tables preserve the original eight rows exactly and add only the new Web Awesome row, with acquisition identity beside every implementation. They extend visual coverage across the full reference panel without rewriting history. The groups expose related metrics together; they are unpaired descriptive comparisons. Use the contemporaneous three-system tables for current En Reve versus Web Awesome/Fluent differences. Browser/harness receipts and failure counts remain essential context.

### Nine-system production payload comparison

Original eight-system values plus the new Web Awesome acquisition. These are independent acquisition cohorts, not contemporaneous paired samples or change estimates. Units, missing-value semantics and successful/failed coverage match their detailed source tables. Sort to explore a hypothesis, then confirm it with contemporaneous controls.

| Implementation | Run ID | Date (UTC) | JS raw KiB | JS gzip KiB | JS Brotli KiB | Initial JS Brotli KiB | CSS raw KiB | CSS Brotli KiB | Local fonts Brotli KiB | HTML raw KiB | HTML Brotli KiB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | Historical bundles.json | — | 404.7 | 100.1 | 80.4 | 80.4 | 39.8 | 5.6 | 0.0 | 0.351 | 0.155 |
| Radix React | Historical bundles.json | — | 406.5 | 120.6 | 102.9 | 102.9 | 670.8 | 49.0 | 0.0 | 0.354 | 0.159 |
| Fluent React | Historical bundles.json | — | 799.0 | 218.3 | 170.8 | 170.8 | 3.3 | 1.0 | 0.0 | 0.355 | 0.160 |
| Spectrum React S2 | Historical bundles.json | — | 980.8 | 278.8 | 216.3 | 216.3 | 65.2 | 11.3 | 0.0 | 0.357 | 0.165 |
| Astryx React | Historical bundles.json | — | 722.2 | 211.5 | 174.2 | 174.0 | 191.7 | 26.5 | 0.0 | 0.355 | 0.163 |
| shadcn React | Historical bundles.json | — | 526.4 | 164.9 | 138.6 | 138.6 | 77.0 | 10.8 | 68.1 | 0.355 | 0.164 |
| Fluent Web Components | Historical bundles.json | — | 281.2 | 69.3 | 57.1 | 57.1 | 4.2 | 1.2 | 0.0 | 0.364 | 0.173 |
| Spectrum Web Components | Historical bundles.json | — | 1,246.6 | 217.8 | 170.5 | 156.3 | 3.9 | 1.1 | 0.0 | 1.310 | 0.345 |
| Web Awesome | New reports/web-awesome/bundles.json | — | 469.8 | 110.5 | 86.4 | 86.4 | 53.4 | 4.9 | 0.0 | 0.409 | 0.167 |

### Nine-system chunk structure comparison

Original eight-system values plus the new Web Awesome acquisition. These are independent acquisition cohorts, not contemporaneous paired samples or change estimates. Units, missing-value semantics and successful/failed coverage match their detailed source tables. Sort to explore a hypothesis, then confirm it with contemporaneous controls.

| Implementation | Run ID | Date (UTC) | JS files | CSS files | Static initial assets | Dynamic import edges | Sources in multiple chunks |
| --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | Historical bundles.json | — | 1 | 1 | 2 | 0 | 0 |
| Radix React | Historical bundles.json | — | 1 | 1 | 2 | 0 | 0 |
| Fluent React | Historical bundles.json | — | 1 | 1 | 2 | 0 | 0 |
| Spectrum React S2 | Historical bundles.json | — | 1 | 1 | 2 | 0 | 0 |
| Astryx React | Historical bundles.json | — | 2 | 1 | 2 | 1 | 0 |
| shadcn React | Historical bundles.json | — | 1 | 1 | 2 | 0 | 0 |
| Fluent Web Components | Historical bundles.json | — | 1 | 1 | 2 | 0 | 0 |
| Spectrum Web Components | Historical bundles.json | — | 18 | 1 | 14 | 9 | 0 |
| Web Awesome | New reports/web-awesome/bundles.json | — | 1 | 1 | 2 | 0 | 0 |

### Nine-system mobile cold loading comparison

Original eight-system values plus the new Web Awesome acquisition. These are independent acquisition cohorts, not contemporaneous paired samples or change estimates. Units, missing-value semantics and successful/failed coverage match their detailed source tables. Sort to explore a hypothesis, then confirm it with contemporaneous controls.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | FCP ms | LCP ms | LCP p75 ms | CLS | CLS p75 | CLS max | TTFB ms | Cards frame opportunity ms | Last webfont response ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 622.0 | 622.0 | 651.0 | 0.000000 | 0.000000 | 0.000000 | 15.5 | 616.5 | — |
| Radix React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 658.0 | 658.0 | 682.0 | 0.000000 | 0.000000 | 0.000000 | 15.1 | 660.7 | — |
| Fluent React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 698.0 | 698.0 | 704.0 | 0.000000 | 0.000000 | 0.000000 | 16.0 | 713.6 | — |
| Spectrum React S2 | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 988.0 | 1,384.0 | 1,394.0 | 0.001630 | 0.001630 | 0.001630 | 15.8 | 1,000.4 | 1,207.7 |
| Astryx React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 784.0 | 784.0 | 791.0 | 0.000000 | 0.000000 | 0.000000 | 17.5 | 793.5 | — |
| shadcn React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 708.0 | 708.0 | 722.0 | 0.000986 | 0.000986 | 0.000986 | 15.4 | 724.5 | 868.4 |
| Fluent Web Components | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 514.0 | 514.0 | 519.0 | 0.000000 | 0.000000 | 0.000000 | 15.5 | 504.5 | — |
| Spectrum Web Components | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 760.0 | 760.0 | 790.0 | 0.000000 | 0.000000 | 0.000000 | 16.3 | 760.1 | — |
| Web Awesome | New web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 604.0 | 604.0 | 611.0 | 0.000000 | 0.000000 | 0.000000 | 15.8 | 602.0 | — |

### Nine-system mobile warm loading comparison

Original eight-system values plus the new Web Awesome acquisition. These are independent acquisition cohorts, not contemporaneous paired samples or change estimates. Units, missing-value semantics and successful/failed coverage match their detailed source tables. Sort to explore a hypothesis, then confirm it with contemporaneous controls.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | FCP ms | LCP ms | LCP p75 ms | CLS | CLS p75 | CLS max | TTFB ms | Cards frame opportunity ms | Last webfont response ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 284.0 | 284.0 | 284.0 | 0.000000 | 0.000000 | 0.000000 | 2.0 | 291.0 | — |
| Radix React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 240.0 | 240.0 | 244.0 | 0.000000 | 0.000000 | 0.000000 | 0.9 | 237.3 | — |
| Fluent React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 234.0 | 234.0 | 255.0 | 0.000000 | 0.000000 | 0.000000 | 0.9 | 242.8 | — |
| Spectrum React S2 | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 532.0 | 532.0 | 548.0 | 0.000000 | 0.000000 | 0.000000 | 1.0 | 544.6 | 159.3 |
| Astryx React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 262.0 | 262.0 | 268.0 | 0.000000 | 0.000000 | 0.000000 | 1.4 | 274.6 | — |
| shadcn React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 268.0 | 268.0 | 280.0 | 0.000000 | 0.000000 | 0.000000 | 0.8 | 280.5 | 124.3 |
| Fluent Web Components | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 218.0 | 218.0 | 223.0 | 0.000000 | 0.000000 | 0.000000 | 2.7 | 223.3 | — |
| Spectrum Web Components | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 302.0 | 302.0 | 316.0 | 0.000000 | 0.000000 | 0.000000 | 1.4 | 320.7 | — |
| Web Awesome | New web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 246.0 | 246.0 | 248.0 | 0.000000 | 0.000000 | 0.000000 | 3.8 | 255.6 | — |

### Nine-system mobile cold delivery comparison

Original eight-system values plus the new Web Awesome acquisition. These are independent acquisition cohorts, not contemporaneous paired samples or change estimates. Units, missing-value semantics and successful/failed coverage match their detailed source tables. Sort to explore a hypothesis, then confirm it with contemporaneous controls.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 86.6 | 0.325 | 80.5 | 5.7 | 0.0 | 0.0 | 3 | 0 | 0 |
| Radix React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 152.5 | 0.331 | 103.1 | 49.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| Fluent React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 172.4 | 0.331 | 170.9 | 1.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| Spectrum React S2 | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 699.9 | 0.336 | 216.5 | 11.4 | 471.7 | 0.0 | 5 | 1 | 0 |
| Astryx React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 201.2 | 0.334 | 174.2 | 26.7 | 0.0 | 0.0 | 3 | 0 | 0 |
| shadcn React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 218.4 | 0.335 | 138.8 | 10.9 | 68.3 | 0.0 | 4 | 0 | 0 |
| Fluent Web Components | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 58.9 | 0.344 | 57.2 | 1.3 | 0.0 | 0.0 | 3 | 0 | 0 |
| Spectrum Web Components | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 159.3 | 0.516 | 157.6 | 1.2 | 0.0 | 0.0 | 15 | 0 | 0 |
| Web Awesome | New web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 91.9 | 0.336 | 86.5 | 5.1 | 0.0 | 0.0 | 3 | 0 | 0 |

### Nine-system mobile startup comparison

Original eight-system values plus the new Web Awesome acquisition. These are independent acquisition cohorts, not contemporaneous paired samples or change estimates. Units, missing-value semantics and successful/failed coverage match their detailed source tables. Sort to explore a hypothesis, then confirm it with contemporaneous controls.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Control observed ms | Click from navigation ms | Result from navigation ms | Result p75 ms | Dispatch overhead ms | Discovery probe ms | Click to result ms | Click to frame ms | First input delay ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | Historical pass2-startup-v3 | 2026-09-20 | 10 | 0 | 573.9 | 592.1 | 600.9 | 604.4 | 17.5 | 0.7 | 8.9 | 44.8 | 2.6 |
| Radix React | Historical pass2-startup-v3 | 2026-09-20 | 10 | 0 | 622.6 | 645.1 | 659.9 | 662.4 | 22.3 | 2.4 | 14.4 | 44.8 | 5.3 |
| Fluent React | Historical pass2-startup-v3 | 2026-09-20 | 10 | 0 | 656.3 | 689.5 | 711.4 | 723.5 | 33.0 | 79.0 | 21.6 | 55.7 | 5.3 |
| Spectrum React S2 | Historical pass2-startup-v3 | 2026-09-20 | 10 | 0 | 945.1 | 956.6 | 988.3 | 1,002.1 | 11.5 | 0.8 | 32.0 | 64.4 | 4.5 |
| Astryx React | Historical pass2-startup-v3 | 2026-09-20 | 10 | 0 | 735.8 | 755.6 | 772.8 | 779.0 | 20.1 | 2.8 | 17.3 | 49.7 | 4.2 |
| shadcn React | Historical pass2-startup-v3 | 2026-09-20 | 10 | 0 | 684.0 | 699.4 | 715.3 | 718.3 | 15.7 | 0.4 | 15.1 | 48.1 | 5.7 |
| Fluent Web Components | Historical pass2-startup-v3 | 2026-09-20 | 10 | 0 | 442.8 | 492.6 | 500.3 | 513.0 | 50.3 | 0.6 | 7.0 | 39.1 | 4.5 |
| Spectrum Web Components | Historical pass2-startup-v3 | 2026-09-20 | 10 | 0 | 707.4 | 729.4 | 742.9 | 750.6 | 20.8 | 1.2 | 13.5 | 44.5 | 9.6 |
| Web Awesome | New web-awesome-startup-v1 | 2026-09-21 | 10 | 0 | 584.3 | 607.9 | 615.0 | 618.0 | 22.8 | 2.1 | 8.2 | 43.3 | 2.9 |

### Nine-system mobile interaction comparison

Original eight-system values plus the new Web Awesome acquisition. These are independent acquisition cohorts, not contemporaneous paired samples or change estimates. Units, missing-value semantics and successful/failed coverage match their detailed source tables. Sort to explore a hypothesis, then confirm it with contemporaneous controls.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Scripted INP ms | Scripted INP p75 ms | First input delay ms | Journey CLS | Max scroll rAF gap ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | Historical pass2-interactions-v1 | 2026-09-20 | 10 | 0 | 48.0 | 56.0 | 3.4 | 0.000000 | 16.8 |
| Radix React | Historical pass2-interactions-v1 | 2026-09-20 | 10 | 0 | 56.0 | 56.0 | 4.8 | 0.000000 | 16.8 |
| Fluent React | Historical pass2-interactions-v1 | 2026-09-20 | 10 | 0 | 64.0 | 64.0 | 4.8 | 0.000000 | 16.8 |
| Spectrum React S2 | Historical pass2-interactions-v1 | 2026-09-20 | 10 | 0 | 80.0 | 80.0 | 3.0 | 0.001630 | 16.8 |
| Astryx React | Historical pass2-interactions-v1 | 2026-09-20 | 10 | 0 | 56.0 | 56.0 | 4.5 | 0.000000 | 16.8 |
| shadcn React | Historical pass2-interactions-v1 | 2026-09-20 | 10 | 0 | 64.0 | 64.0 | 4.7 | 0.000986 | 16.8 |
| Fluent Web Components | Historical pass2-interactions-v1 | 2026-09-20 | 10 | 0 | 64.0 | 64.0 | 2.5 | 0.000000 | 16.8 |
| Spectrum Web Components | Historical pass2-interactions-v1 | 2026-09-20 | 0 | 10 | — | — | — | — | — |
| Web Awesome | New web-awesome-interactions-v1 | 2026-09-21 | 10 | 0 | 48.0 | 48.0 | 2.6 | 0.000000 | 16.8 |

### Nine-system mobile cold main-thread comparison

Original eight-system values plus the new Web Awesome acquisition. These are independent acquisition cohorts, not contemporaneous paired samples or change estimates. Units, missing-value semantics and successful/failed coverage match their detailed source tables. Sort to explore a hypothesis, then confirm it with contemporaneous controls.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Script ms | Style ms | Layout ms | Task ms | Layout passes | Style recalcs | Long tasks ms | Pre-FCP blocking excess ms | Post-FCP blocking excess ms | Long animation frames ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 78.7 | 58.1 | 31.9 | 359.6 | 8 | 11 | 275.0 | 225.0 | 0.0 | 394.9 |
| Radix React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 152.9 | 43.9 | 54.5 | 333.3 | 5 | 6 | 191.0 | 141.0 | 0.0 | 414.4 |
| Fluent React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 193.9 | 40.8 | 53.9 | 361.2 | 5 | 6 | 270.5 | 120.5 | 0.0 | 367.6 |
| Spectrum React S2 | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 386.1 | 76.3 | 201.1 | 756.1 | 13 | 22 | 657.5 | 398.0 | 108.0 | 790.7 |
| Astryx React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 222.5 | 34.4 | 64.0 | 409.7 | 4 | 9 | 311.0 | 211.0 | 0.0 | 487.9 |
| shadcn React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 195.4 | 38.1 | 189.3 | 504.4 | 4 | 6 | 371.5 | 207.0 | 66.0 | 503.3 |
| Fluent Web Components | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 116.4 | 42.1 | 38.6 | 277.1 | 5 | 10 | 153.5 | 103.5 | 0.0 | 297.4 |
| Spectrum Web Components | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 107.9 | 71.4 | 48.7 | 421.3 | 12 | 21 | 313.0 | 263.0 | 0.0 | 435.0 |
| Web Awesome | New web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 79.7 | 43.3 | 34.0 | 345.5 | 4 | 6 | 244.0 | 194.0 | 0.0 | 366.8 |

### Nine-system mobile warm main-thread comparison

Original eight-system values plus the new Web Awesome acquisition. These are independent acquisition cohorts, not contemporaneous paired samples or change estimates. Units, missing-value semantics and successful/failed coverage match their detailed source tables. Sort to explore a hypothesis, then confirm it with contemporaneous controls.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Script ms | Style ms | Layout ms | Task ms | Layout passes | Style recalcs | Long tasks ms | Pre-FCP blocking excess ms | Post-FCP blocking excess ms | Long animation frames ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 52.1 | 40.3 | 13.3 | 223.0 | 8 | 11 | 148.5 | 98.5 | 0.0 | 151.3 |
| Radix React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 64.0 | 17.0 | 7.7 | 154.4 | 5 | 6 | 75.0 | 25.0 | 0.0 | 101.4 |
| Fluent React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 73.1 | 18.1 | 6.4 | 174.6 | 5 | 6 | 55.0 | 5.0 | 0.0 | 95.2 |
| Spectrum React S2 | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 179.7 | 33.9 | 161.4 | 477.2 | 11 | 20 | 360.5 | 310.5 | 0.0 | 372.1 |
| Astryx React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 82.1 | 30.1 | 6.7 | 190.3 | 4 | 9 | 103.5 | 53.5 | 0.0 | 126.7 |
| shadcn React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 66.8 | 14.2 | 44.4 | 194.9 | 3 | 5 | 113.0 | 63.0 | 0.0 | 133.8 |
| Fluent Web Components | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 57.5 | 19.3 | 9.0 | 160.2 | 5 | 10 | 70.0 | 20.0 | 0.0 | 84.8 |
| Spectrum Web Components | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 55.0 | 46.2 | 13.1 | 258.8 | 12 | 21 | 162.5 | 112.5 | 0.0 | 169.0 |
| Web Awesome | New web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 47.3 | 15.8 | 7.4 | 192.1 | 4 | 6 | 110.5 | 60.5 | 0.0 | 114.3 |

### Nine-system desktop cold loading comparison

Original eight-system values plus the new Web Awesome acquisition. These are independent acquisition cohorts, not contemporaneous paired samples or change estimates. Units, missing-value semantics and successful/failed coverage match their detailed source tables. Sort to explore a hypothesis, then confirm it with contemporaneous controls.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | FCP ms | LCP ms | LCP p75 ms | CLS | CLS p75 | CLS max | TTFB ms | Cards frame opportunity ms | Last webfont response ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 94.0 | 94.0 | 99.0 | 0.000000 | 0.000000 | 0.000000 | 15.1 | 83.9 | — |
| Radix React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 128.0 | 128.0 | 128.0 | 0.000000 | 0.000000 | 0.000000 | 14.6 | 86.1 | — |
| Fluent React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 104.0 | 104.0 | 108.0 | 0.000000 | 0.000000 | 0.000000 | 15.8 | 96.1 | — |
| Spectrum React S2 | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 158.0 | 234.0 | 253.0 | 0.002332 | 0.002332 | 0.002332 | 16.4 | 158.8 | 178.5 |
| Astryx React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 120.0 | 120.0 | 124.0 | 0.000000 | 0.000000 | 0.000000 | 15.8 | 109.0 | — |
| shadcn React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 126.0 | 126.0 | 142.0 | 0.002616 | 0.005232 | 0.005232 | 16.2 | 120.8 | 100.5 |
| Fluent Web Components | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 78.0 | 78.0 | 83.0 | 0.000075 | 0.000075 | 0.000075 | 14.9 | 71.0 | — |
| Spectrum Web Components | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 108.0 | 108.0 | 112.0 | 0.000000 | 0.000000 | 0.000000 | 17.2 | 101.3 | — |
| Web Awesome | New web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 96.0 | 96.0 | 99.0 | 0.000000 | 0.000000 | 0.000000 | 15.5 | 83.0 | — |

### Nine-system desktop warm loading comparison

Original eight-system values plus the new Web Awesome acquisition. These are independent acquisition cohorts, not contemporaneous paired samples or change estimates. Units, missing-value semantics and successful/failed coverage match their detailed source tables. Sort to explore a hypothesis, then confirm it with contemporaneous controls.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | FCP ms | LCP ms | LCP p75 ms | CLS | CLS p75 | CLS max | TTFB ms | Cards frame opportunity ms | Last webfont response ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 44.0 | 44.0 | 44.0 | 0.000000 | 0.000000 | 0.000000 | 0.8 | 40.3 | — |
| Radix React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 68.0 | 68.0 | 68.0 | 0.000000 | 0.000000 | 0.000000 | 0.9 | 65.7 | — |
| Fluent React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 34.0 | 34.0 | 36.0 | 0.000000 | 0.000000 | 0.000000 | 0.7 | 32.9 | — |
| Spectrum React S2 | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 102.0 | 102.0 | 104.0 | 0.000000 | 0.000000 | 0.000000 | 0.9 | 95.6 | 13.4 |
| Astryx React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 40.0 | 40.0 | 44.0 | 0.000000 | 0.000000 | 0.000000 | 0.8 | 38.2 | — |
| shadcn React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 42.0 | 42.0 | 47.0 | 0.000000 | 0.000000 | 0.000000 | 0.8 | 39.6 | 5.4 |
| Fluent Web Components | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 28.0 | 28.0 | 31.0 | 0.000075 | 0.000075 | 0.000075 | 0.8 | 27.2 | — |
| Spectrum Web Components | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 48.0 | 48.0 | 48.0 | 0.000000 | 0.000000 | 0.000000 | 1.0 | 45.4 | — |
| Web Awesome | New web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 36.0 | 36.0 | 36.0 | 0.000000 | 0.000000 | 0.000000 | 0.7 | 31.4 | — |

### Nine-system desktop cold delivery comparison

Original eight-system values plus the new Web Awesome acquisition. These are independent acquisition cohorts, not contemporaneous paired samples or change estimates. Units, missing-value semantics and successful/failed coverage match their detailed source tables. Sort to explore a hypothesis, then confirm it with contemporaneous controls.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 86.6 | 0.325 | 80.5 | 5.7 | 0.0 | 0.0 | 3 | 0 | 0 |
| Radix React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 152.5 | 0.331 | 103.1 | 49.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| Fluent React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 172.4 | 0.331 | 170.9 | 1.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| Spectrum React S2 | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 699.9 | 0.336 | 216.5 | 11.4 | 471.7 | 0.0 | 5 | 1 | 0 |
| Astryx React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 201.2 | 0.334 | 174.2 | 26.7 | 0.0 | 0.0 | 3 | 0 | 0 |
| shadcn React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 218.4 | 0.335 | 138.8 | 10.9 | 68.3 | 0.0 | 4 | 0 | 0 |
| Fluent Web Components | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 58.9 | 0.344 | 57.2 | 1.3 | 0.0 | 0.0 | 3 | 0 | 0 |
| Spectrum Web Components | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 159.3 | 0.516 | 157.6 | 1.2 | 0.0 | 0.0 | 15 | 0 | 0 |
| Web Awesome | New web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 91.9 | 0.336 | 86.5 | 5.1 | 0.0 | 0.0 | 3 | 0 | 0 |

### Nine-system desktop startup comparison

Original eight-system values plus the new Web Awesome acquisition. These are independent acquisition cohorts, not contemporaneous paired samples or change estimates. Units, missing-value semantics and successful/failed coverage match their detailed source tables. Sort to explore a hypothesis, then confirm it with contemporaneous controls.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Control observed ms | Click from navigation ms | Result from navigation ms | Result p75 ms | Dispatch overhead ms | Discovery probe ms | Click to result ms | Click to frame ms | First input delay ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | Historical pass2-startup-v3 | 2026-09-20 | 10 | 0 | 81.4 | 86.3 | 88.2 | 91.1 | 5.0 | 0.2 | 2.0 | 28.3 | 0.7 |
| Radix React | Historical pass2-startup-v3 | 2026-09-20 | 10 | 0 | 79.5 | 84.8 | 88.4 | 89.6 | 5.3 | 0.5 | 3.2 | 40.5 | — |
| Fluent React | Historical pass2-startup-v3 | 2026-09-20 | 10 | 0 | 84.2 | 91.3 | 98.8 | 102.9 | 7.3 | 17.4 | 6.8 | 35.2 | — |
| Spectrum React S2 | Historical pass2-startup-v3 | 2026-09-20 | 10 | 0 | 165.0 | 169.3 | 177.1 | 180.1 | 4.1 | 31.7 | 7.7 | 38.2 | 0.7 |
| Astryx React | Historical pass2-startup-v3 | 2026-09-20 | 10 | 0 | 95.8 | 101.1 | 105.1 | 106.6 | 5.1 | 0.6 | 4.0 | 31.1 | 1.0 |
| shadcn React | Historical pass2-startup-v3 | 2026-09-20 | 10 | 0 | 91.3 | 121.5 | 125.7 | 134.0 | 30.1 | 0.0 | 4.2 | 28.4 | 2.0 |
| Fluent Web Components | Historical pass2-startup-v3 | 2026-09-20 | 10 | 0 | 59.6 | 72.2 | 73.2 | 74.7 | 12.1 | 0.1 | 1.1 | 35.0 | — |
| Spectrum Web Components | Historical pass2-startup-v3 | 2026-09-20 | 10 | 0 | 93.4 | 98.8 | 101.1 | 105.9 | 5.5 | 0.2 | 2.4 | 31.1 | — |
| Web Awesome | New web-awesome-startup-v1 | 2026-09-21 | 10 | 0 | 81.3 | 88.7 | 90.8 | 93.0 | 7.5 | 0.4 | 1.6 | 29.8 | 0.7 |

### Nine-system desktop interaction comparison

Original eight-system values plus the new Web Awesome acquisition. These are independent acquisition cohorts, not contemporaneous paired samples or change estimates. Units, missing-value semantics and successful/failed coverage match their detailed source tables. Sort to explore a hypothesis, then confirm it with contemporaneous controls.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Scripted INP ms | Scripted INP p75 ms | First input delay ms | Journey CLS | Max scroll rAF gap ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | Historical pass2-interactions-v1 | 2026-09-20 | 10 | 0 | 40.0 | 46.0 | 0.7 | 0.000000 | 16.8 |
| Radix React | Historical pass2-interactions-v1 | 2026-09-20 | 10 | 0 | 64.0 | 72.0 | 1.2 | 0.000000 | 50.1 |
| Fluent React | Historical pass2-interactions-v1 | 2026-09-20 | 10 | 0 | 48.0 | 48.0 | 1.2 | 0.000000 | 16.8 |
| Spectrum React S2 | Historical pass2-interactions-v1 | 2026-09-20 | 10 | 0 | 44.0 | 48.0 | 0.7 | 0.002332 | 16.8 |
| Astryx React | Historical pass2-interactions-v1 | 2026-09-20 | 10 | 0 | 44.0 | 48.0 | 1.0 | 0.000000 | 16.8 |
| shadcn React | Historical pass2-interactions-v1 | 2026-09-20 | 10 | 0 | 64.0 | 64.0 | 1.2 | 0.002616 | 16.8 |
| Fluent Web Components | Historical pass2-interactions-v1 | 2026-09-20 | 10 | 0 | 48.0 | 48.0 | 0.6 | 0.000075 | 16.8 |
| Spectrum Web Components | Historical pass2-interactions-v1 | 2026-09-20 | 10 | 0 | 40.0 | 40.0 | 0.9 | 0.000000 | 16.8 |
| Web Awesome | New web-awesome-interactions-v1 | 2026-09-21 | 10 | 0 | 40.0 | 48.0 | 0.7 | 0.000000 | 16.8 |

### Nine-system desktop cold main-thread comparison

Original eight-system values plus the new Web Awesome acquisition. These are independent acquisition cohorts, not contemporaneous paired samples or change estimates. Units, missing-value semantics and successful/failed coverage match their detailed source tables. Sort to explore a hypothesis, then confirm it with contemporaneous controls.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Script ms | Style ms | Layout ms | Task ms | Layout passes | Style recalcs | Long tasks ms | Pre-FCP blocking excess ms | Post-FCP blocking excess ms | Long animation frames ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 15.7 | 11.6 | 6.0 | 75.1 | 8 | 10 | 53.5 | 3.5 | 0.0 | 57.0 |
| Radix React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 32.6 | 10.3 | 12.4 | 76.1 | 5 | 6 | 0.0 | 0.0 | 0.0 | 51.2 |
| Fluent React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 41.7 | 9.4 | 11.1 | 79.2 | 5 | 6 | 0.0 | 0.0 | 0.0 | 0.0 |
| Spectrum React S2 | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 83.6 | 17.5 | 47.1 | 170.6 | 13 | 20 | 89.0 | 39.0 | 0.0 | 108.6 |
| Astryx React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 48.0 | 7.2 | 15.4 | 91.5 | 4 | 9 | 52.5 | 2.5 | 0.0 | 58.8 |
| shadcn React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 43.7 | 8.9 | 48.5 | 119.4 | 4 | 6 | 60.5 | 10.5 | 0.0 | 81.5 |
| Fluent Web Components | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 23.7 | 9.3 | 7.8 | 60.4 | 5 | 10 | 0.0 | 0.0 | 0.0 | 0.0 |
| Spectrum Web Components | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 23.1 | 16.1 | 9.9 | 94.2 | 12 | 27 | 64.0 | 14.0 | 0.0 | 66.8 |
| Web Awesome | New web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 16.2 | 10.5 | 7.3 | 73.7 | 4 | 6 | 51.0 | 1.0 | 0.0 | 54.9 |

### Nine-system desktop warm main-thread comparison

Original eight-system values plus the new Web Awesome acquisition. These are independent acquisition cohorts, not contemporaneous paired samples or change estimates. Units, missing-value semantics and successful/failed coverage match their detailed source tables. Sort to explore a hypothesis, then confirm it with contemporaneous controls.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Script ms | Style ms | Layout ms | Task ms | Layout passes | Style recalcs | Long tasks ms | Pre-FCP blocking excess ms | Post-FCP blocking excess ms | Long animation frames ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 10.6 | 8.5 | 3.1 | 49.7 | 7 | 10 | 0.0 | 0.0 | 0.0 | 0.0 |
| Radix React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 13.1 | 3.6 | 1.7 | 34.4 | 4 | 5 | 0.0 | 0.0 | 0.0 | 0.0 |
| Fluent React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 15.8 | 3.7 | 1.5 | 39.3 | 5 | 6 | 0.0 | 0.0 | 0.0 | 0.0 |
| Spectrum React S2 | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 36.6 | 7.2 | 36.0 | 107.9 | 11 | 19 | 75.5 | 25.5 | 0.0 | 85.2 |
| Astryx React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 17.5 | 5.9 | 1.4 | 42.4 | 4 | 8 | 0.0 | 0.0 | 0.0 | 0.0 |
| shadcn React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 13.9 | 2.9 | 10.2 | 43.6 | 3 | 5 | 0.0 | 0.0 | 0.0 | 0.0 |
| Fluent Web Components | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 11.4 | 3.7 | 2.0 | 34.0 | 4 | 9 | 0.0 | 0.0 | 0.0 | 0.0 |
| Spectrum Web Components | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 11.2 | 9.7 | 2.7 | 57.7 | 11 | 27 | 0.0 | 0.0 | 0.0 | 0.0 |
| Web Awesome | New web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 9.6 | 3.5 | 1.8 | 42.5 | 4 | 5 | 0.0 | 0.0 | 0.0 | 0.0 |

### Nine-system mobile Lighthouse comparison

Original eight-system values plus the new Web Awesome acquisition. These are independent acquisition cohorts, not contemporaneous paired samples or change estimates. Units, missing-value semantics and successful/failed coverage match their detailed source tables. Sort to explore a hypothesis, then confirm it with contemporaneous controls.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | FCP ms | LCP ms | LCP p75 ms | LCP max ms | TBT ms | TBT p75 ms | TBT max ms | Speed Index ms | CLS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | Historical pass2-lighthouse-v1 | 2026-09-20 | 5 | 0 | 724.8 | 724.8 | 740.5 | 763.7 | 0.0 | 0.0 | 0.0 | 589.0 | 0.000000 |
| Radix React | Historical pass2-lighthouse-v1 | 2026-09-20 | 5 | 0 | 741.6 | 741.6 | 750.7 | 843.6 | 0.0 | 0.0 | 0.0 | 744.0 | 0.000000 |
| Fluent React | Historical pass2-lighthouse-v1 | 2026-09-20 | 5 | 0 | 734.4 | 734.4 | 738.4 | 915.9 | 0.0 | 0.0 | 0.0 | 736.0 | 0.000000 |
| Spectrum React S2 | Historical pass2-lighthouse-v1 | 2026-09-20 | 5 | 0 | 1,059.6 | 1,378.0 | 1,385.8 | 1,399.2 | 128.6 | 134.5 | 145.3 | 1,130.0 | 0.025341 |
| Astryx React | Historical pass2-lighthouse-v1 | 2026-09-20 | 5 | 0 | 838.4 | 838.4 | 847.3 | 946.8 | 0.0 | 0.0 | 0.0 | 840.0 | 0.000000 |
| shadcn React | Historical pass2-lighthouse-v1 | 2026-09-20 | 5 | 0 | 786.9 | 786.9 | 787.5 | 864.5 | 82.2 | 107.7 | 113.5 | 804.0 | 0.000986 |
| Fluent Web Components | Historical pass2-lighthouse-v1 | 2026-09-20 | 5 | 0 | 582.4 | 582.4 | 586.1 | 608.7 | 0.0 | 0.0 | 0.0 | 584.0 | 0.000000 |
| Spectrum Web Components | Historical pass2-lighthouse-v1 | 2026-09-20 | 5 | 0 | 947.4 | 947.4 | 959.7 | 994.7 | 0.0 | 0.0 | 0.0 | 950.0 | 0.000000 |
| Web Awesome | New web-awesome-lighthouse-v1 | 2026-09-21 | 5 | 0 | 765.6 | 765.6 | 781.7 | 796.7 | 0.0 | 0.0 | 0.0 | 581.0 | 0.000000 |

### Nine-system memory after 50 cycles comparison

Original eight-system values plus the new Web Awesome acquisition. These are independent acquisition cohorts, not contemporaneous paired samples or change estimates. Units, missing-value semantics and successful/failed coverage match their detailed source tables. Sort to explore a hypothesis, then confirm it with contemporaneous controls.

| Implementation | Run ID | Date (UTC) | Checkpoints n | API success n | API unavailable n | API MiB | JS heap MiB | Browser DOM nodes | Event listeners | API status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | Historical pass2-memory-50-v1 | 2026-09-20 | 1 | 1 | 0 | 5.46 | 5.36 | 6,496 | 547 | ok |
| Radix React | Historical pass2-memory-50-v1 | 2026-09-20 | 1 | 1 | 0 | 6.71 | 6.64 | 972 | 1,537 | ok |
| Fluent React | Historical pass2-memory-50-v1 | 2026-09-20 | 1 | 1 | 0 | 8.57 | 8.30 | 999 | 360 | ok |
| Spectrum React S2 | Historical pass2-memory-50-v1 | 2026-09-20 | 1 | 1 | 0 | 13.86 | 13.23 | 5,189 | 925 | ok |
| Astryx React | Historical pass2-memory-50-v1 | 2026-09-20 | 1 | 0 | 1 | — | 8.67 | 1,668 | 774 | timeout |
| shadcn React | Historical pass2-memory-50-v1 | 2026-09-20 | 1 | 1 | 0 | 7.62 | 8.08 | 993 | 418 | ok |
| Fluent Web Components | Historical pass2-memory-50-v1 | 2026-09-20 | 1 | 1 | 0 | 4.38 | 4.73 | 7,497 | 1,012 | ok |
| Spectrum Web Components | Historical pass2-memory-50-v1 | 2026-09-20 | 1 | 1 | 0 | 8.08 | 5.87 | 5,519 | 856 | ok |
| Web Awesome | New web-awesome-memory-v2 | 2026-09-21 | 1 | 1 | 0 | 4.86 | 4.81 | 5,263 | 747 | ok |

### Web Awesome connected DOM review

Cohort **web-awesome-dom-v1**; 30 successful / 0 failed snapshots. Browser: 153.0.8010.12. Desktop 1500 × 1100; narrow 390 × 844; DPR 1; CPU multiplier 1; network throttling none. [Full DOM protocol and measured asset hashes](../showcases/performance/runs/web-awesome-dom-v1/manifest.json). Connected-tree diagnostics include light DOM and accessible open shadow roots once, without double-counting slot assignment. Closed/UA shadow roots, disconnected templates and browser-native picker internals are not inspected. Complete date fields include labels, native controls and owned custom popups. Without-date totals are arithmetic exclusions, not rebuilt variants. Browser-native dates are not assumed free. This preserves the earlier En Reve date/base audits while extending structural coverage; it does not rerun source audits or prove CPU savings.

### Web Awesome connected DOM acquisition coverage

Fresh sessions keep primary initial/after-journey, custom date lifecycle and supplemental ownership separate.

| Implementation | Desktop initial snapshots | Desktop journey snapshots | Narrow initial snapshots | Date lifecycle snapshots | Ownership snapshots |
| --- | --- | --- | --- | --- | --- |
| En Reve | 3 | 3 | 1 | 9 | 1 |
| Fluent Web Components | 3 | 3 | 1 | 0 | 1 |
| Web Awesome | 3 | 3 | 1 | 0 | 1 |

### Web Awesome connected totals with and without dates

Initial settled desktop tree. Date boundaries follow the entire field, rather than only the visible input. Current controls are remeasured with Web Awesome in the same diagnostic acquisition.

| Implementation | Samples n | Full nodes | Full elements | Date nodes | Date elements | Without date nodes | Without date elements |
| --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | 3 | 4642 | 1578 | 623 | 181 | 4019 | 1397 |
| Fluent Web Components | 3 | 2887 | 1284 | 28 | 12 | 2859 | 1272 |
| Web Awesome | 3 | 4210 | 1401 | 28 | 8 | 4182 | 1393 |

### Web Awesome full node composition

Whitespace is a subset of text. Comments can be renderer update/hydration markers and must not be mechanically removed. Physical depth includes shadow-root steps, not layout depth.

| Implementation | Elements | Text | Whitespace text | Comments | Open shadow roots | Other nodes | Slots | Base parts | Maximum physical depth |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | 1578 | 1843 | 1506 | 1052 | 167 | 2 | 414 | 55 | 27 |
| Fluent Web Components | 1284 | 1432 | 1198 | 0 | 169 | 2 | 457 | 0 | 18 |
| Web Awesome | 1401 | 1876 | 1651 | 734 | 197 | 2 | 497 | 98 | 21 |

### Web Awesome non-date node composition

Whitespace is a subset of text. Comments can be renderer update/hydration markers and must not be mechanically removed. Physical depth includes shadow-root steps, not layout depth.

| Implementation | Elements | Text | Whitespace text | Comments | Open shadow roots | Other nodes | Slots | Base parts | Maximum physical depth |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | 1397 | 1708 | 1429 | 756 | 156 | 2 | 391 | 50 | 22 |
| Fluent Web Components | 1272 | 1418 | 1185 | 0 | 167 | 2 | 451 | 0 | 18 |
| Web Awesome | 1393 | 1863 | 1639 | 728 | 196 | 2 | 493 | 97 | 21 |

### Web Awesome connected lifecycle changes

Connected lifecycle changes are not heap-retention or leak evidence. Narrow viewport retains desktop pointer behavior unless explicitly stated by the protocol.

| Implementation | Initial nodes | After journey nodes | Node change | Initial elements | After journey elements | Element change | Narrow initial nodes | Narrow initial elements |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | 4642 | 4643 | 1 | 1578 | 1578 | 0 | 4642 | 1578 |
| Fluent Web Components | 2887 | 2889 | 2 | 1284 | 1284 | 0 | 2887 | 1284 |
| Web Awesome | 4210 | 4212 | 2 | 1401 | 1401 | 0 | 4210 | 1401 |

### Web Awesome cohort custom-date lifecycle

Only custom-calendar implementations have visible-grid open/closed diagnostic sessions. Native-picker browser internals are outside census scope. These measurements do not make Web Awesome native date equivalent to En Reve’s richer custom calendar.

| Implementation | State | Samples n | Full nodes | Full elements | Date nodes | Date elements | Without date nodes | Without date elements |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | initial | 3 | 4642 | 1578 | 623 | 181 | 4019 | 1397 |
| En Reve | date-open | 3 | 4642 | 1578 | 623 | 181 | 4019 | 1397 |
| En Reve | date-closed | 3 | 4642 | 1578 | 623 | 181 | 4019 | 1397 |

### Web Awesome light and shadow ownership

Physical ownership, not authorship or CPU cost. Host elements belong to their parent tree; their direct shadow internals, including ShadowRoot nodes, belong to that host bucket. Nested component internals belong to their own host.

| Implementation | Light-tree nodes | Shadow-tree nodes | Light-tree elements | Shadow-tree elements | Light whitespace | Shadow whitespace | Light comments | Shadow comments |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | 1275 | 3367 | 431 | 1147 | 412 | 1094 | 223 | 829 |
| Fluent Web Components | 771 | 2116 | 512 | 772 | 25 | 1173 | 0 | 0 |
| Web Awesome | 608 | 3602 | 401 | 1000 | 9 | 1642 | 0 | 734 |

### Web Awesome repeated button shadow structure

Different native-control strategies and variant mixtures remain; this is an investigation guide, not a capability-matched microbenchmark. Slots and required semantic native controls are contracts, not automatic removal candidates.

| Implementation | Button family | Instances | Owned nodes | Owned elements | Elements per instance | Slots per instance | Comments per instance | Whitespace per instance |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | en-button | 49 | 784 | 294 | 6.00 | 4.00 | 2.00 | 7.00 |
| Fluent Web Components | fluent-button | 47 | 517 | 188 | 4.00 | 3.00 | 0.00 | 6.00 |
| Web Awesome | wa-button | 55 | 938 | 221 | 4.02 | 3.00 | 4.00 | 8.04 |

### Web Awesome connected base parts

Part naming is a convention: no base part does not mean no wrapper. SVG bases are rendering primitives. Earlier En Reve host-migration candidates remain proposals; moving part=base to a host does not preserve a consumer ::part(base) selector.

| Implementation | All base parts | SVG base parts | Non-SVG base parts | Without-date base parts | Without-date non-SVG base parts |
| --- | --- | --- | --- | --- | --- |
| En Reve | 55 | 19 | 36 | 50 | 35 |
| Fluent Web Components | 0 | 0 | 0 | 0 | 0 |
| Web Awesome | 98 | 0 | 98 | 97 | 97 |

### Nine-system connected DOM with acquisition labels

Descriptive initial-tree census across retained historical and new acquisitions. Explicit date boundaries improve capability interpretation but do not erase browser/source differences. Same-acquisition controls and lifecycle checks appear above; this table does not replace the original audited evidence.

| Implementation | Run ID | Date (UTC) | Full nodes | Full elements | Date nodes | Date elements | Without date nodes | Without date elements |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Radix React | Historical dom-review-v4 | 2026-09-20 | 651 | 454 | 5 | 4 | 646 | 450 |
| Fluent React | Historical dom-review-v4 | 2026-09-20 | 742 | 542 | 5 | 4 | 737 | 538 |
| Spectrum React S2 | Historical dom-review-v4 | 2026-09-20 | 878 | 653 | 29 | 23 | 849 | 630 |
| Astryx React | Historical dom-review-v4 | 2026-09-20 | 1486 | 1158 | 193 | 141 | 1293 | 1017 |
| shadcn React | Historical dom-review-v4 | 2026-09-20 | 673 | 477 | 4 | 3 | 669 | 474 |
| Fluent Web Components | Historical dom-review-v4 | 2026-09-20 | 2887 | 1284 | 28 | 12 | 2859 | 1272 |
| Spectrum Web Components | Historical dom-review-v4 | 2026-09-20 | 4472 | 1206 | 3 | 2 | 4469 | 1204 |
| En Reve | Historical dom-review-v4 | 2026-09-20 | 4642 | 1578 | 623 | 181 | 4019 | 1397 |
| Web Awesome | web-awesome-dom-v1 | 2026-09-21 | 4210 | 1401 | 28 | 8 | 4182 | 1393 |

### Web Awesome implications and next investigations

**Warm initialization is the clearest measured En Reve opportunity against this new reference.** Mobile warm LCP is 298 ms for En Reve, 246 ms for Web Awesome and 218 ms for Fluent WC. The En Reve minus Web Awesome paired difference is 52 ms, with an exploratory 95% interval of 36–68 ms. Desktop warm LCP is 44 versus 36 ms. Mobile warm style work is 42.3 versus 15.8 ms and task work is 241.2 versus 192.1 ms. Corrected warm HTTP transfer is effectively just the document in both fixtures (249 versus 260 bytes). This points to a warm initialization/style investigation; counters and timing associations do not establish its cause.

**Cold delivery is much closer to Web Awesome.** Mobile cold LCP is 614 versus 604 ms, with an En Reve difference interval of −4 to 54.05 ms; desktop cold LCP is 96 ms for both. En Reve already emits less JavaScript (404.7 versus 469.8 KiB raw, 80.4 versus 86.4 KiB Brotli) and transfers fewer cold HTTP response bytes (88,632 versus 94,111). All three fixtures emit one JS file and one CSS file with no dynamic import edges. Mobile startup result is 628 versus 615 ms; settled scripted INP is 56 versus 48 ms, with the latter difference interval touching zero. These results do not establish a universal responsiveness ranking. All 15 Lighthouse audits report zero TBT and CLS in their bounded audit windows.

**En Reve is nearly at element-count parity with Web Awesome once complete date fields are excluded.** The non-date trees contain 4,019 nodes / 1,397 elements for En Reve and 4,182 / 1,393 for Web Awesome: En Reve has 163 fewer nodes and only four more elements. Whole-page totals are 4,642 / 1,578 versus 4,210 / 1,401; date fields contribute 623 / 181 versus 28 / 8. Date composition therefore explains more than the entire node-count difference and 173 of the 177 extra elements. This does not make browser-native dates equivalent to the custom calendar; native picker internals are unavailable. Fluent WC remains smaller at 2,859 non-date nodes / 1,272 elements. The earlier source audit remains useful, but the new comparison weakens a blanket “too many DOM nodes” diagnosis. Web Awesome has 97 non-date base parts versus En Reve’s 50, further demonstrating that the name alone is not evidence of a redundant wrapper.

**Diagnostics support focused experiments, not conclusions about causality or leaks.** The separate single cold desktop trace records 21.8 ms of layout-tree update work for En Reve versus 13.6 ms for Web Awesome; it is not a trace of the warm cohort. Whole-journey sampling identifies En Reve dialog synchronization, toolbar/menu availability checks and calendar adapter work as inspection targets; those totals cannot be assigned to startup without looking at the trace. At 50 journeys, API memory is about 5.46 MiB for En Reve, 4.86 MiB for Web Awesome and 4.36 MiB for Fluent WC, with only one session each. From 10 to 50 journeys, En Reve and Web Awesome each add 40 browser-counter nodes with stable listener counts; these broad counters include more than the connected page census. Retention, browser input state, automation and garbage collection still require separation before any leak claim.

### Web Awesome prioritized En Reve investigations

Proposed implementation work for later. Keep the frozen source and capability differences explicit; structural or timing correlations are hypotheses until a controlled change improves the intended end-user metric.

| Priority | Investigation | Evidence | Next experiment | Acceptance |
| --- | --- | --- | --- | --- |
| 1 | Warm initialization and style work | Mobile warm LCP +52 ms versus Web Awesome; style 42.3 versus 15.8 ms | Capture matched warm traces, inspect style/layout triggers and selector/invalidation work, then change one repeated component or style-adoption decision | Improve warm LCP and task work without moving the cost to cold startup, first interaction or scroll activation |
| 1 | Custom date mounting and lifecycle | Date field accounts for 623 nodes / 181 elements; native reference has 28 / 8 | Prototype calendar-only and full-overlay deferral separately; compare retained-after-close with recreated state | Preserve date/form/locale/keyboard/accessibility contracts; measure first open, reopen, close, startup and retained memory |
| 2 | Repeated button, card and field structure | Non-date total is nearly equal to Web Awesome; En Reve button still owns six shadow elements per instance | Use the existing source catalog for targeted host-surface or optional-region prototypes; keep native controls and public slots | Document part API migration; verify geometry, focus, names/descriptions, dynamic slots, themes and hydration; pair count reductions with measured delivery gains |
| 2 | Whole-journey interaction hotspots | Separate trace samples identify dialog synchronization, toolbar/menu checks and calendar-adapter work | Inspect exact trace intervals, repeated geometry reads and redundant updates around the measured actions | Attribute improvement to the relevant action and verify first/repeated behavior; do not assign whole-journey samples to warm startup |
| 3 | Chunking and lifecycle follow-through | All fixtures have one eager JS file; memory remains a one-session diagnostic | Use realistic optional-feature mounting/import boundaries and targeted retention controls, preserving the frozen references | Measure transferred bytes plus first-use latency and retained state; do not delete merely unexercised code or infer a leak from broad DOM counters |

### Web Awesome coverage boundaries

No production field/RUM evidence, SSR/hydration performance, physical-device validation, assistive-technology benchmark, routed soft-navigation metric, or realistic image/video workload is established by these fixtures. Native calendar UI internals are outside the connected census. Memory sessions remain exploratory. The inspired En Reve theme is functionally/visually qualified separately; its presence is not included in the frozen En Reve performance control. Missing measurements remain explicit rather than inferred from another suite or historical campaign.
