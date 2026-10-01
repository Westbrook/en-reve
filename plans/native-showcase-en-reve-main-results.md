# En Reve main comparison

Current consumer-policy follow-up: [calendar delivery variants](native-showcase-calendar-variants-results.md), measured separately from this report’s retained default/peer cohort.

**Reading measurement dates:** “Run ID” (previously “Acquisition”) identifies one recorded benchmark run, so its raw evidence can be traced. “Date (UTC)” is when its samples were measured—not when this report was rebuilt. A date range means sampling crossed UTC days; a dash means no timestamp could be recovered. Older peer rows retain their original dates.


This acquisition refreshes En Reve to the exact local main commit 6d09b31c, retaining its native default styling and existing CSR showcase workload. Frozen Fluent Web Components and Web Awesome are remeasured as contemporaneous controls. **The earlier eight-system measurements remain historical and unchanged.** Their identical-looking block numbers do not pair with these new samples. The main comparison tables explicitly label each acquisition; use the new three-system tables and within-cohort contrasts to investigate current delivery differences.

Every measurement table is sortable in the En Reve HTML reader. KiB = 1,024 bytes; MiB = 1,048,576 bytes. A dash is unavailable, never zero. Missing values sort last. Raw production JS means emitted/minified bytes before compression, not browser compiled-code memory. This is an exploratory workstation comparison of complete native fixtures, not a library-only ranking or a release gate.

Exact local main 6d09b31cf43523ac8c75352208ab9697b62e2673 is built from tracked-clean source into content-addressed tarballs. The standalone sixteen-card CSR fixture retains its global eager individual registrations and application workload; default light tokens are regenerated. This does not enable the new scoped/lazy, SSR or deferred-date opt-in consumer policies. Frozen Fluent WC and Web Awesome are contemporaneous controls. The unchanged protocol has ten load blocks per desktop/mobile and cold/warm cell, ten startup and interaction blocks per profile, five mobile Lighthouse audits, one 0/10/50-cycle memory session, one diagnostic, five BFCache checks, five observer on/off pairs, and separate connected DOM snapshots. Original artifacts and acquisitions are retained. Timings are exploratory workstation evidence, not causal historical before/after tests or CI gates.

[Machine-readable tables, distributions and input hashes](../showcases/performance/reports/en-reve-main/tables.json). [Campaign configuration](../showcases/performance/reports/en-reve-main/config.json). [Serial execution receipt](../showcases/performance/reports/en-reve-main/execution.json). [Retained raw evidence and source receipt](../showcases/performance/reports/en-reve-main/evidence/receipt.json).

### En Reve main native-library identity

Pins, rendering, theme and artifact identity are read from the [final frozen inventory](../showcases/performance/reports/en-reve-main/inventory.json), not current working-tree packages. En Reve's file/tarball dependency identifies its locally packed baseline. Source and lockfile hashes remain in that inventory. Only the default light theme is measured; inspired themes remain separate artifacts.

| Implementation | Direct dependency pins | Rendering | Native theme | Artifact SHA-256 |
| --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | @en-reve/tokens@file:vendor/en-reve-tokens-0.1.0-main-41c2f927c730.tgz; @en-reve/styles@file:vendor/en-reve-styles-0.1.0-main-e9dd7ff5eb76.tgz; @en-reve/primitives@file:vendor/en-reve-primitives-0.1.0-main-3c07d968d025.tgz; @en-reve/elements@file:vendor/en-reve-elements-0.1.0-main-1fd12d7737b1.tgz; lit@3.3.3; signal-polyfill@0.2.2 | client | single default light appearance | 35be87675f29f289818f22f778db5e76ade67cf97639acf0989ae6a4774dd7dd |
| Fluent Web Components | @fluentui/web-components@3.1.3; @fluentui/tokens@1.0.0-alpha.24 | client | single default light appearance | 46b61dac3922571774265d590a5ac56b5c2355ed489ffef9610e127a1f5428b0 |
| Web Awesome | @awesome.me/webawesome@3.13.0 | client | single default light appearance | aab9e1c57ad13cf25672dd75ab2bdddcefc1e65180b018f5655b3d77576c3778 |

### En Reve main acquisition coverage

No failed sample is silently replaced. Primary loading, startup, settled interactions, Lighthouse, memory, tracing/coverage, observer overhead and back-forward cache have separate acquisitions and instrumentation. DOM census coverage is reported separately below.

| Campaign | Run ID | Date (UTC) | Planned samples | Recorded samples | Successful samples | Failed samples | Complete |
| --- | --- | --- | --- | --- | --- | --- | --- |
| load | en-reve-main-load-v1 | 2026-09-24 | 120 | 120 | 120 | 0 | Yes |
| startup | en-reve-main-startup-v1 | 2026-09-24 | 60 | 60 | 60 | 0 | Yes |
| interactions | en-reve-main-interactions-v1 | 2026-09-24 | 60 | 60 | 60 | 0 | Yes |
| lighthouse | en-reve-main-lighthouse-v1 | 2026-09-24 | 15 | 15 | 15 | 0 | Yes |
| memory | en-reve-main-memory-v1 | 2026-09-24 | 3 | 3 | 3 | 0 | Yes |
| diagnostic | en-reve-main-diagnostic-v1 | 2026-09-24 | 3 | 3 | 3 | 0 | Yes |
| bfcache | en-reve-main-bfcache-v1 | 2026-09-24 | 15 | 15 | 15 | 0 | Yes |
| overhead | en-reve-main-overhead-v1 | 2026-09-24 | 30 | 30 | 30 | 0 | Yes |

### En Reve main browser and harness identity

The exact browser, renderer mode and archived harness identify these new results. Matching the source fixture does not make historical timings contemporaneous. Full host metadata and collection options remain in each manifest.

| Campaign | Started UTC | Browser | Browser mode | Harness SHA-256 | Collector SHA-256 |
| --- | --- | --- | --- | --- | --- |
| load | 2026-09-24T00:15:11.579Z | 153.0.8010.12 | bundled-chromium-headless-shell | c83da72ad9e252607a6ca2eda12621b084d01484ab30e639ffa82a259015a8db | 64543147510f2ea32b8825c36518dbaf4f8504b110f34eec0a942672b41051d3 |
| startup | 2026-09-24T00:21:25.422Z | 153.0.8010.12 | bundled-chromium-headless-shell | c83da72ad9e252607a6ca2eda12621b084d01484ab30e639ffa82a259015a8db | 64543147510f2ea32b8825c36518dbaf4f8504b110f34eec0a942672b41051d3 |
| interactions | 2026-09-24T00:22:07.928Z | 153.0.8010.12 | bundled-chromium-headless-shell | c83da72ad9e252607a6ca2eda12621b084d01484ab30e639ffa82a259015a8db | 64543147510f2ea32b8825c36518dbaf4f8504b110f34eec0a942672b41051d3 |
| lighthouse | 2026-09-24T00:27:50.960Z | Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/153.0.0.0 Safari/537.36 | See audit receipt | c83da72ad9e252607a6ca2eda12621b084d01484ab30e639ffa82a259015a8db | — |
| memory | 2026-09-24T00:31:41.207Z | 153.0.8010.12 | bundled-full-chromium-new-headless | c83da72ad9e252607a6ca2eda12621b084d01484ab30e639ffa82a259015a8db | 64543147510f2ea32b8825c36518dbaf4f8504b110f34eec0a942672b41051d3 |
| diagnostic | 2026-09-24T00:35:46.273Z | 153.0.8010.12 | bundled-chromium-headless-shell | c83da72ad9e252607a6ca2eda12621b084d01484ab30e639ffa82a259015a8db | 64543147510f2ea32b8825c36518dbaf4f8504b110f34eec0a942672b41051d3 |
| bfcache | 2026-09-24T00:36:04.330Z | 153.0.8010.12 | bundled-full-chromium-new-headless-direct-cdp | c83da72ad9e252607a6ca2eda12621b084d01484ab30e639ffa82a259015a8db | 64543147510f2ea32b8825c36518dbaf4f8504b110f34eec0a942672b41051d3 |
| overhead | 2026-09-24T00:36:49.865Z | 153.0.8010.12 | bundled-chromium-headless-shell | c83da72ad9e252607a6ca2eda12621b084d01484ab30e639ffa82a259015a8db | 64543147510f2ea32b8825c36518dbaf4f8504b110f34eec0a942672b41051d3 |

### En Reve main requested profiles

These are requested CDP profile values. Desktop uses no simulated CPU/network throttling. The mobile profile is desktop Chromium with a narrow viewport and emulated CPU/network limits, not a physical phone. Lighthouse separately applies its DevTools throttling settings; memory and DOM diagnostics have their own recorded protocol. Browser implementation and loopback serving limit real-world inference.

| Profile | Viewport width px | Viewport height px | DPR | CPU slowdown | Network latency ms | Download Mbps | Upload Mbps |
| --- | --- | --- | --- | --- | --- | --- | --- |
| desktop | 1500 | 1100 | 1 | 1 | 0 | Unthrottled | Unthrottled |
| mobile | 390 | 844 | 1 | 4 | 100 | 8.00 | 2.00 |

### En Reve main loading and visual stability

Loading sends no input, retaining LCP eligibility through the observation window. Load plus 1.5 seconds and card readiness bounds CLS and resource observation. TTFB is from a loopback server. Warm visits reuse a primed context. Text LCP may legitimately have zero resource phases; independent attribution medians need not add to median LCP. Card-frame and final downloaded-font response timestamps do not prove every control is usable.

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

### En Reve main mobile cold LCP attribution

web-vitals attribution; render delay includes discovery, JS, CSS, fonts and rendering. Cohort: **en-reve-main-load-v1**, mobile/cold. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | TTFB portion ms | Resource delay ms | Resource duration ms | Element render delay ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 16.2 | 0.0 | 0.0 | 628.4 |
| Fluent Web Components | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 15.8 | 0.0 | 0.0 | 497.7 |
| Web Awesome | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 16.5 | 0.0 | 0.0 | 583.3 |

### En Reve main mobile startup usability

One trusted click is dispatched at the first observed Landscape geometry, refreshed just before dispatch; the target, result and two-rAF frame opportunity are verified. This is an observed successful probe, not mathematically earliest usability, legacy TTI or field FID. Probe/dispatch overhead remains visible. Cohort: **en-reve-main-startup-v1**, mobile/cold. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Control observed ms | Click from navigation ms | Result from navigation ms | Result p75 ms | Dispatch overhead ms | Discovery probe ms | Click to result ms | Click to frame ms | First input delay ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-startup-v1 | 2026-09-24 | 10 | 0 | 609.7 | 628.3 | 637.5 | 647.4 | 18.8 | 0.2 | 9.8 | 44.8 | 3.0 |
| Fluent Web Components | en-reve-main-startup-v1 | 2026-09-24 | 10 | 0 | 454.5 | 506.7 | 515.0 | 518.0 | 52.2 | 0.8 | 7.9 | 44.0 | 4.7 |
| Web Awesome | en-reve-main-startup-v1 | 2026-09-24 | 10 | 0 | 570.8 | 593.0 | 600.6 | 608.2 | 21.9 | 1.9 | 8.4 | 43.0 | 3.7 |

### En Reve main desktop cold loading

FCP is first contentful paint; LCP is largest contentful paint; CLS uses eligible session-window scoring. Cohort: **en-reve-main-load-v1**, desktop/cold. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | FCP ms | LCP ms | LCP p75 ms | CLS | CLS p75 | CLS max | TTFB ms | Cards frame opportunity ms | Last webfont response ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 100.0 | 100.0 | 107.0 | 0.000000 | 0.000000 | 0.000000 | 15.0 | 88.1 | — |
| Fluent Web Components | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 82.0 | 82.0 | 88.0 | 0.000075 | 0.000075 | 0.000075 | 16.9 | 74.5 | — |
| Web Awesome | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 94.0 | 94.0 | 96.0 | 0.000000 | 0.000000 | 0.000000 | 15.6 | 82.1 | — |

### En Reve main desktop warm loading

FCP is first contentful paint; LCP is largest contentful paint; CLS uses eligible session-window scoring. Cohort: **en-reve-main-load-v1**, desktop/warm. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | FCP ms | LCP ms | LCP p75 ms | CLS | CLS p75 | CLS max | TTFB ms | Cards frame opportunity ms | Last webfont response ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 44.0 | 44.0 | 44.0 | 0.000000 | 0.000000 | 0.000000 | 0.9 | 42.5 | — |
| Fluent Web Components | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 28.0 | 28.0 | 31.0 | 0.000075 | 0.000075 | 0.000075 | 0.9 | 25.8 | — |
| Web Awesome | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 36.0 | 36.0 | 36.0 | 0.000000 | 0.000000 | 0.000000 | 0.8 | 31.9 | — |

### En Reve main desktop cold LCP attribution

web-vitals attribution; render delay includes discovery, JS, CSS, fonts and rendering. Cohort: **en-reve-main-load-v1**, desktop/cold. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | TTFB portion ms | Resource delay ms | Resource duration ms | Element render delay ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 15.0 | 0.0 | 0.0 | 85.5 |
| Fluent Web Components | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 16.9 | 0.0 | 0.0 | 66.2 |
| Web Awesome | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 15.6 | 0.0 | 0.0 | 78.2 |

### En Reve main desktop startup usability

One trusted click is dispatched at the first observed Landscape geometry, refreshed just before dispatch; the target, result and two-rAF frame opportunity are verified. This is an observed successful probe, not mathematically earliest usability, legacy TTI or field FID. Probe/dispatch overhead remains visible. Cohort: **en-reve-main-startup-v1**, desktop/cold. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Control observed ms | Click from navigation ms | Result from navigation ms | Result p75 ms | Dispatch overhead ms | Discovery probe ms | Click to result ms | Click to frame ms | First input delay ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-startup-v1 | 2026-09-24 | 10 | 0 | 85.7 | 90.9 | 92.9 | 94.3 | 5.0 | 0.1 | 2.0 | 35.6 | 0.7 |
| Fluent Web Components | en-reve-main-startup-v1 | 2026-09-24 | 10 | 0 | 60.1 | 72.6 | 73.7 | 74.6 | 12.5 | 0.1 | 1.2 | 36.9 | — |
| Web Awesome | en-reve-main-startup-v1 | 2026-09-24 | 10 | 0 | 76.9 | 84.7 | 86.7 | 89.8 | 7.0 | 0.3 | 1.7 | 30.9 | 0.8 |

### En Reve main production payload and chunking

All emitted production assets include fixture code, library/runtime code and authored styles; source maps and diagnostic metadata are excluded. Brotli/gzip are deterministic offline compression, while browser transfer is measured separately. Initial JS follows HTML/preload/static import reachability. A dynamic edge permits deferred loading but does not establish that bytes were deferred. The HTML measured here is a CSR shell; no SSR/hydration performance cohort is represented.

### En Reve main transfer accounting

Network delivery includes only HTTP(S) responses. Embedded data/blob responses are retained separately and never counted again as wire bytes. Raw captures and derived values are both retained for auditing.

### En Reve main production payload sizes

One frozen build per implementation. Local-font zero does not imply no remote fonts; use browser transfer for actual responses.

| Implementation | JS raw KiB | JS gzip KiB | JS Brotli KiB | Initial JS Brotli KiB | CSS raw KiB | CSS Brotli KiB | Local fonts Brotli KiB | HTML raw KiB | HTML Brotli KiB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | 439.5 | 108.3 | 86.9 | 86.9 | 43.5 | 5.9 | 0.0 | 0.351 | 0.157 |
| Fluent Web Components | 281.2 | 69.3 | 57.1 | 57.1 | 4.2 | 1.2 | 0.0 | 0.364 | 0.173 |
| Web Awesome | 469.8 | 110.5 | 86.4 | 86.4 | 53.4 | 4.9 | 0.0 | 0.409 | 0.167 |

### En Reve main deterministic payload change

Exact emitted asset comparison; previous ab6e473521da65174a73e31d19160bcd7f9c46abf2553d462a0b3506a27233a9, current 35be87675f29f289818f22f778db5e76ade67cf97639acf0989ae6a4774dd7dd. This is the complete fixture/library/default-theme update, not isolated package marginal cost. Byte differences are deterministic; historical timing differences are not controlled before/after results.

| Measurement | Previous frozen bytes | Current main bytes | Change bytes | Change percent |
| --- | --- | --- | --- | --- |
| JS raw bytes | 414,455 | 450,035 | 35,580 | 8.58 |
| JS gzip bytes | 102,519 | 110,874 | 8,355 | 8.15 |
| JS Brotli bytes | 82,291 | 89,035 | 6,744 | 8.20 |
| CSS raw bytes | 40,755 | 44,562 | 3,807 | 9.34 |
| CSS Brotli bytes | 5,735 | 6,077 | 342 | 5.96 |

### En Reve main emitted chunk structure

These are current fixture graphs, not the splitting ceiling of each library. Repeated source modules require inspection before claiming removable duplication.

| Implementation | JS files | CSS files | Static initial assets | Dynamic import edges | Sources in multiple chunks |
| --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | 1 | 1 | 2 | 0 | 0 |
| Fluent Web Components | 1 | 1 | 2 | 0 | 0 |
| Web Awesome | 1 | 1 | 2 | 0 | 0 |

### En Reve main whole-page response delivery

Completed HTTP(S) CDP response bytes include HTML, JS, CSS, fonts and other network responses, excluding local schemes, collector endpoints and destination pages. These are browser response accounting, not TCP/TLS packet bytes. Incomplete HTTP responses make totals unavailable; missing assets are not free. The load visit is bounded; interaction transfer is a separate cumulative journey, not subtraction of two medians. Cache-reuse entries have zero Resource Timing transfer and a positive encoded body size.

### En Reve main response-transfer derivation correction

Successful load-sample medians. Captured aggregates are retained historical fields inside the new raw files; every delivery table below uses the corrected HTTP(S)-only replay. Embedded/local responses are shown separately to make the correction inspectable. A missing completion remains unavailable rather than zero.

| Implementation | Profile | Cache | Successful n | Captured aggregate KiB | Corrected HTTP response KiB | Non-HTTP responses n | Non-HTTP completed KiB | Non-HTTP incomplete n |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | mobile | cold | 10 | 93.5 | 93.5 | 1 | 0.0 | 0 |
| Fluent Web Components | mobile | cold | 10 | 58.9 | 58.9 | 1 | 0.0 | 0 |
| Web Awesome | mobile | cold | 10 | 91.9 | 91.9 | 10 | 4.6 | 0 |
| En Reve main 6d09b31c | mobile | warm | 10 | 0.2 | 0.2 | 1 | 0.0 | 0 |
| Fluent Web Components | mobile | warm | 10 | 0.3 | 0.3 | 1 | 0.0 | 0 |
| Web Awesome | mobile | warm | 10 | 0.3 | 0.3 | 10 | 4.6 | 0 |
| En Reve main 6d09b31c | desktop | cold | 10 | 93.5 | 93.5 | 1 | 0.0 | 0 |
| Fluent Web Components | desktop | cold | 10 | 58.9 | 58.9 | 1 | 0.0 | 0 |
| Web Awesome | desktop | cold | 10 | 91.9 | 91.9 | 10 | 4.6 | 0 |
| En Reve main 6d09b31c | desktop | warm | 10 | 0.2 | 0.2 | 1 | 0.0 | 0 |
| Fluent Web Components | desktop | warm | 10 | 0.3 | 0.3 | 1 | 0.0 | 0 |
| Web Awesome | desktop | warm | 10 | 0.3 | 0.3 | 10 | 4.6 | 0 |

### En Reve main mobile cold response transfer

Independently computed category medians need not sum exactly to median total. Cohort: **en-reve-main-load-v1**, mobile/cold. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 93.5 | 0.328 | 87.1 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| Fluent Web Components | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 58.9 | 0.344 | 57.2 | 1.3 | 0.0 | 0.0 | 3 | 0 | 0 |
| Web Awesome | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 91.9 | 0.336 | 86.5 | 5.1 | 0.0 | 0.0 | 3 | 0 | 0 |

### En Reve main mobile warm response transfer

Independently computed category medians need not sum exactly to median total. Cohort: **en-reve-main-load-v1**, mobile/warm. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 0.2 | 0.246 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| Fluent Web Components | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 0.3 | 0.262 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| Web Awesome | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 0.3 | 0.254 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |

### En Reve main mobile cumulative interaction transfer

Whole successful journey, including requests caused by tested actions. Cohort: **en-reve-main-interactions-v1**, mobile/cold. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-interactions-v1 | 2026-09-24 | 10 | 0 | 93.5 | 0.328 | 87.1 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| Fluent Web Components | en-reve-main-interactions-v1 | 2026-09-24 | 10 | 0 | 58.9 | 0.344 | 57.2 | 1.3 | 0.0 | 0.0 | 3 | 0 | 0 |
| Web Awesome | en-reve-main-interactions-v1 | 2026-09-24 | 10 | 0 | 91.9 | 0.336 | 86.5 | 5.1 | 0.0 | 0.0 | 3 | 0 | 0 |

### En Reve main desktop cold response transfer

Independently computed category medians need not sum exactly to median total. Cohort: **en-reve-main-load-v1**, desktop/cold. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 93.5 | 0.328 | 87.1 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| Fluent Web Components | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 58.9 | 0.344 | 57.2 | 1.3 | 0.0 | 0.0 | 3 | 0 | 0 |
| Web Awesome | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 91.9 | 0.336 | 86.5 | 5.1 | 0.0 | 0.0 | 3 | 0 | 0 |

### En Reve main desktop warm response transfer

Independently computed category medians need not sum exactly to median total. Cohort: **en-reve-main-load-v1**, desktop/warm. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 0.2 | 0.246 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| Fluent Web Components | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 0.3 | 0.262 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| Web Awesome | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 0.3 | 0.254 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |

### En Reve main desktop cumulative interaction transfer

Whole successful journey, including requests caused by tested actions. Cohort: **en-reve-main-interactions-v1**, desktop/cold. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-interactions-v1 | 2026-09-24 | 10 | 0 | 93.5 | 0.328 | 87.1 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| Fluent Web Components | en-reve-main-interactions-v1 | 2026-09-24 | 10 | 0 | 58.9 | 0.344 | 57.2 | 1.3 | 0.0 | 0.0 | 3 | 0 | 0 |
| Web Awesome | en-reve-main-interactions-v1 | 2026-09-24 | 10 | 0 | 91.9 | 0.336 | 86.5 | 5.1 | 0.0 | 0.0 | 3 | 0 | 0 |

### En Reve main main-thread and blocking work

CDP script, style, layout and task counters are measured at the bounded load endpoint and can overlap. Long-task and long-animation-frame totals include their whole durations and are not TBT. Blocking excess sums only long-task portions beyond 50 ms, clipped before FCP or from FCP to the observation endpoint. Lighthouse TBT has a different endpoint and is reported separately. Use traces before assigning critical-path causes.

### En Reve main mobile cold main-thread work

These are measured costs, not an additive decomposition of LCP. Cohort: **en-reve-main-load-v1**, mobile/cold. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Script ms | Style ms | Layout ms | Task ms | Layout passes | Style recalcs | Long tasks ms | Pre-FCP blocking excess ms | Post-FCP blocking excess ms | Long animation frames ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 86.7 | 59.7 | 32.0 | 371.7 | 7 | 11 | 288.5 | 238.5 | 0.0 | 411.3 |
| Fluent Web Components | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 118.1 | 42.5 | 38.6 | 280.8 | 5 | 10 | 159.5 | 109.0 | 0.0 | 301.7 |
| Web Awesome | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 79.6 | 45.3 | 33.4 | 338.4 | 4 | 6 | 240.0 | 190.0 | 0.0 | 363.2 |

### En Reve main mobile warm main-thread work

These are measured costs, not an additive decomposition of LCP. Cohort: **en-reve-main-load-v1**, mobile/warm. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Script ms | Style ms | Layout ms | Task ms | Layout passes | Style recalcs | Long tasks ms | Pre-FCP blocking excess ms | Post-FCP blocking excess ms | Long animation frames ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 57.1 | 43.9 | 13.2 | 244.3 | 7 | 11 | 167.0 | 117.0 | 0.0 | 170.2 |
| Fluent Web Components | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 54.4 | 18.1 | 8.5 | 150.4 | 5 | 10 | 65.0 | 15.0 | 0.0 | 81.3 |
| Web Awesome | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 47.7 | 16.5 | 7.7 | 197.1 | 4 | 6 | 111.5 | 61.5 | 0.0 | 115.6 |

### En Reve main desktop cold main-thread work

These are measured costs, not an additive decomposition of LCP. Cohort: **en-reve-main-load-v1**, desktop/cold. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Script ms | Style ms | Layout ms | Task ms | Layout passes | Style recalcs | Long tasks ms | Pre-FCP blocking excess ms | Post-FCP blocking excess ms | Long animation frames ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 17.6 | 12.6 | 6.3 | 78.8 | 7 | 11 | 58.5 | 8.5 | 0.0 | 60.9 |
| Fluent Web Components | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 24.2 | 10.3 | 8.7 | 61.1 | 5 | 10 | 0.0 | 0.0 | 0.0 | 0.0 |
| Web Awesome | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 16.1 | 10.6 | 6.9 | 73.1 | 4 | 6 | 51.0 | 1.0 | 0.0 | 53.1 |

### En Reve main desktop warm main-thread work

These are measured costs, not an additive decomposition of LCP. Cohort: **en-reve-main-load-v1**, desktop/warm. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Script ms | Style ms | Layout ms | Task ms | Layout passes | Style recalcs | Long tasks ms | Pre-FCP blocking excess ms | Post-FCP blocking excess ms | Long animation frames ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 11.8 | 8.7 | 3.0 | 50.8 | 6 | 11 | 0.0 | 0.0 | 0.0 | 0.0 |
| Fluent Web Components | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 11.4 | 3.6 | 2.0 | 33.6 | 4 | 9 | 0.0 | 0.0 | 0.0 | 0.0 |
| Web Awesome | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 9.8 | 3.5 | 1.9 | 42.1 | 3 | 5 | 0.0 | 0.0 | 0.0 | 0.0 |

### En Reve main repeated mobile Lighthouse audits

Fresh full-Chromium audits, separate from headless-shell load samples. Lighthouse owns DevTools throttling in this lane. Zero TBT does not establish zero startup work. Cohort: **en-reve-main-lighthouse-v1**, mobile/cold. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | FCP ms | LCP ms | LCP p75 ms | LCP max ms | TBT ms | TBT p75 ms | TBT max ms | Speed Index ms | CLS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-lighthouse-v1 | 2026-09-24 | 5 | 0 | 779.4 | 779.4 | 785.5 | 866.9 | 0.0 | 0.0 | 0.0 | 627.0 | 0.000000 |
| Fluent Web Components | en-reve-main-lighthouse-v1 | 2026-09-24 | 5 | 0 | 587.2 | 587.2 | 589.0 | 594.0 | 0.0 | 0.0 | 0.0 | 589.0 | 0.000000 |
| Web Awesome | en-reve-main-lighthouse-v1 | 2026-09-24 | 5 | 0 | 742.2 | 742.2 | 744.8 | 784.6 | 0.0 | 0.0 | 0.0 | 569.0 | 0.000000 |

### En Reve main recorded Lighthouse throttling

Settings read from each retained Lighthouse JSON, rather than inferred from a generic mobile preset. DevTools uses request latency and download/upload values; the unused simulation rtt/throughput defaults are not presented as applied network limits. Lighthouse also emulates a mobile user agent/screen, unlike the primary narrow desktop-context lane.

| Implementation | Audits n | Lighthouse version | Throttle method | CPU slowdown | Request latency ms | Download Kbps | Upload Kbps | Screen emulation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | 5 | 13.5.0 | devtools | 4 | 100 | 8000 | 2000 | Mobile |
| Fluent Web Components | 5 | 13.5.0 | devtools | 4 | 100 | 8000 | 2000 | Mobile |
| Web Awesome | 5 | 13.5.0 | devtools | 4 | 100 | 8000 | 2000 | Mobile |

### En Reve main interaction responsiveness

The settled journey tests first/repeated canvas changes, assets, dialogs, review submission and command opening. Scripted-session INP is not field INP. Browser first-input delay excludes handler and rendering time and is not a field FID sample. Event Timing has threshold/quantization limits; missing events remain unavailable. Semantic completion is verified DOM state; two rAFs indicate frame opportunity, not actual display presentation. Calendar interaction timings, typing and keyboard-specific paths are not covered by these seven actions.

### En Reve main mobile interaction summary

Maximum scroll rAF gap is a scheduler diagnostic, not an inferred dropped-frame percentage. Cohort: **en-reve-main-interactions-v1**, mobile/cold. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Scripted INP ms | Scripted INP p75 ms | First input delay ms | Journey CLS | Max scroll rAF gap ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-interactions-v1 | 2026-09-24 | 10 | 0 | 56.0 | 62.0 | 3.2 | 0.000000 | 16.8 |
| Fluent Web Components | en-reve-main-interactions-v1 | 2026-09-24 | 10 | 0 | 64.0 | 64.0 | 3.3 | 0.000000 | 16.8 |
| Web Awesome | en-reve-main-interactions-v1 | 2026-09-24 | 10 | 0 | 48.0 | 48.0 | 2.8 | 0.000000 | 16.8 |

### En Reve main mobile individual actions

Cohort: en-reve-main-interactions-v1, mobile/cold. Sort Action to compare the same operation. First and repeated actions expose possible deferred work. Event-entry counts show attribution coverage.

| Implementation | Action | Successful n | Failed journeys | Result ms | Frame opportunity ms | Frame p75 ms | Event entries n | Input delay ms | Processing ms | Presentation ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | First canvas change | 10 | 0 | 12.6 | 51.4 | 52.8 | 10 | 3.2 | 3.6 | 43.9 |
| Fluent Web Components | First canvas change | 10 | 0 | 6.8 | 46.3 | 48.4 | 10 | 3.3 | 1.0 | 43.9 |
| Web Awesome | First canvas change | 10 | 0 | 8.0 | 45.2 | 47.0 | 10 | 2.8 | 2.3 | 42.5 |
| En Reve main 6d09b31c | Repeated canvas change | 10 | 0 | 7.5 | 30.2 | 30.6 | 10 | 2.1 | 2.3 | 11.5 |
| Fluent Web Components | Repeated canvas change | 10 | 0 | 3.5 | 30.1 | 30.9 | 10 | 1.7 | 0.8 | 13.7 |
| Web Awesome | Repeated canvas change | 10 | 0 | 4.5 | 30.5 | 31.0 | 10 | 1.8 | 1.7 | 12.7 |
| En Reve main 6d09b31c | First asset addition | 10 | 0 | 10.7 | 29.1 | 29.6 | 10 | 2.9 | 2.3 | 42.7 |
| Fluent Web Components | First asset addition | 10 | 0 | 4.2 | 30.2 | 30.5 | 10 | 1.5 | 0.7 | 61.8 |
| Web Awesome | First asset addition | 10 | 0 | 6.0 | 29.2 | 29.4 | 10 | 1.8 | 1.5 | 44.6 |
| En Reve main 6d09b31c | First dialog opening | 10 | 0 | 42.8 | 48.2 | 48.9 | 10 | 2.6 | 2.2 | 43.3 |
| Fluent Web Components | First dialog opening | 10 | 0 | 3.6 | 33.5 | 34.9 | 10 | 1.8 | 0.6 | 29.9 |
| Web Awesome | First dialog opening | 10 | 0 | 31.6 | 41.0 | 44.4 | 10 | 1.9 | 1.3 | 37.2 |
| En Reve main 6d09b31c | Repeated dialog opening | 10 | 0 | 20.4 | 30.5 | 31.2 | 10 | 2.3 | 2.1 | 27.5 |
| Fluent Web Components | Repeated dialog opening | 10 | 0 | 3.3 | 51.1 | 56.2 | 10 | 1.9 | 0.6 | 45.5 |
| Web Awesome | Repeated dialog opening | 10 | 0 | 29.6 | 36.5 | 38.8 | 10 | 2.0 | 1.4 | 35.8 |
| En Reve main 6d09b31c | Review submission | 10 | 0 | 8.4 | 29.6 | 30.6 | 10 | 2.0 | 2.3 | 12.0 |
| Fluent Web Components | Review submission | 10 | 0 | 4.3 | 28.5 | 28.7 | 10 | 0.8 | 1.1 | 14.4 |
| Web Awesome | Review submission | 10 | 0 | 6.2 | 29.8 | 30.1 | 10 | 1.8 | 1.6 | 12.7 |
| En Reve main 6d09b31c | First command opening | 10 | 0 | 25.1 | 33.1 | 35.0 | 10 | 2.7 | 2.1 | 27.7 |
| Fluent Web Components | First command opening | 10 | 0 | 3.6 | 53.0 | 54.5 | 10 | 1.6 | 1.0 | 29.1 |
| Web Awesome | First command opening | 10 | 0 | 23.5 | 31.4 | 32.7 | 10 | 1.8 | 1.6 | 28.5 |

### En Reve main desktop interaction summary

Maximum scroll rAF gap is a scheduler diagnostic, not an inferred dropped-frame percentage. Cohort: **en-reve-main-interactions-v1**, desktop/cold. Values are successful-sample medians unless labeled otherwise. Acquisition complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Scripted INP ms | Scripted INP p75 ms | First input delay ms | Journey CLS | Max scroll rAF gap ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-interactions-v1 | 2026-09-24 | 10 | 0 | 48.0 | 48.0 | 0.8 | 0.000000 | 16.8 |
| Fluent Web Components | en-reve-main-interactions-v1 | 2026-09-24 | 10 | 0 | 44.0 | 48.0 | 0.8 | 0.000075 | 16.8 |
| Web Awesome | en-reve-main-interactions-v1 | 2026-09-24 | 10 | 0 | 40.0 | 46.0 | 0.8 | 0.000000 | 16.8 |

### En Reve main desktop individual actions

Cohort: en-reve-main-interactions-v1, desktop/cold. Sort Action to compare the same operation. First and repeated actions expose possible deferred work. Event-entry counts show attribution coverage.

| Implementation | Action | Successful n | Failed journeys | Result ms | Frame opportunity ms | Frame p75 ms | Event entries n | Input delay ms | Processing ms | Presentation ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | First canvas change | 10 | 0 | 2.4 | 42.5 | 43.8 | 10 | 0.8 | 0.7 | 45.0 |
| Fluent Web Components | First canvas change | 10 | 0 | 1.5 | 39.4 | 43.5 | 10 | 0.8 | 0.2 | 39.2 |
| Web Awesome | First canvas change | 10 | 0 | 1.9 | 40.7 | 43.0 | 10 | 0.8 | 0.4 | 39.0 |
| En Reve main 6d09b31c | Repeated canvas change | 10 | 0 | 1.5 | 31.7 | 31.8 | 10 | 0.5 | 0.4 | 31.0 |
| Fluent Web Components | Repeated canvas change | 10 | 0 | 0.8 | 32.0 | 32.2 | 10 | 0.4 | 0.1 | 15.5 |
| Web Awesome | Repeated canvas change | 10 | 0 | 1.0 | 32.1 | 32.3 | 10 | 0.4 | 0.3 | 15.3 |
| En Reve main 6d09b31c | First asset addition | 10 | 0 | 2.1 | 31.7 | 32.1 | 10 | 0.6 | 0.5 | 30.9 |
| Fluent Web Components | First asset addition | 10 | 0 | 0.9 | 31.8 | 32.0 | 10 | 0.4 | 0.1 | 31.5 |
| Web Awesome | First asset addition | 10 | 0 | 1.2 | 31.7 | 31.7 | 10 | 0.5 | 0.3 | 31.3 |
| En Reve main 6d09b31c | First dialog opening | 10 | 0 | 8.8 | 31.5 | 31.8 | 10 | 0.6 | 0.4 | 31.0 |
| Fluent Web Components | First dialog opening | 10 | 0 | 0.8 | 31.7 | 32.0 | 10 | 0.4 | 0.1 | 31.5 |
| Web Awesome | First dialog opening | 10 | 0 | 6.6 | 31.9 | 32.2 | 10 | 0.5 | 0.3 | 31.2 |
| En Reve main 6d09b31c | Repeated dialog opening | 10 | 0 | 4.0 | 31.5 | 31.8 | 10 | 0.6 | 0.4 | 31.1 |
| Fluent Web Components | Repeated dialog opening | 10 | 0 | 0.7 | 32.0 | 32.1 | 10 | 0.4 | 0.1 | 23.5 |
| Web Awesome | Repeated dialog opening | 10 | 0 | 6.0 | 32.0 | 32.2 | 10 | 0.5 | 0.3 | 31.2 |
| En Reve main 6d09b31c | Review submission | 10 | 0 | 1.6 | 31.9 | 32.1 | 10 | 0.4 | 0.4 | 31.2 |
| Fluent Web Components | Review submission | 10 | 0 | 1.0 | 31.7 | 31.8 | 10 | 0.4 | 0.1 | 15.5 |
| Web Awesome | Review submission | 10 | 0 | 1.2 | 32.0 | 32.3 | 10 | 0.4 | 0.4 | 15.2 |
| En Reve main 6d09b31c | First command opening | 10 | 0 | 5.1 | 31.9 | 32.1 | 10 | 0.6 | 0.5 | 31.0 |
| Fluent Web Components | First command opening | 10 | 0 | 0.8 | 31.7 | 32.0 | 10 | 0.5 | 0.1 | 23.4 |
| Web Awesome | First command opening | 10 | 0 | 4.6 | 31.8 | 32.2 | 10 | 0.4 | 0.3 | 31.3 |

### En Reve main memory and lifecycle

A separate cross-origin-isolated full-Chromium lane disables timing observers and samples at 0, 10 and 50 native journeys. Reviews replace status text rather than append records. API memory, JS heap and browser DOM counters have different scopes. One session per implementation and GC-dependent API readings cannot establish leaks or a robust memory ranking. API timeout/error is explicit; checkpoints reached before later failure remain reported.

### En Reve main memory after 0 cycles

Cohort: en-reve-main-memory-v1. Zero cycles means after initial load and settling.

| Implementation | Checkpoints n | API success n | API unavailable n | API MiB | JS heap MiB | Browser DOM nodes | Event listeners | API status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | 1 | 1 | 0 | 5.52 | 4.32 | 6,376 | 547 | ok |
| Fluent Web Components | 1 | 0 | 1 | — | 4.23 | 4,138 | 618 | timeout |
| Web Awesome | 1 | 0 | 1 | — | 4.73 | 6,250 | 751 | timeout |

### En Reve main memory after 10 cycles

Cohort: en-reve-main-memory-v1. Zero cycles means after initial load and settling.

| Implementation | Checkpoints n | API success n | API unavailable n | API MiB | JS heap MiB | Browser DOM nodes | Event listeners | API status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | 1 | 1 | 0 | 5.59 | 5.21 | 6,495 | 547 | ok |
| Fluent Web Components | 1 | 1 | 0 | 3.88 | 4.38 | 4,617 | 692 | ok |
| Web Awesome | 1 | 1 | 0 | 4.77 | 4.58 | 5,223 | 747 | ok |

### En Reve main memory after 50 cycles

Cohort: en-reve-main-memory-v1. Zero cycles means after initial load and settling.

| Implementation | Checkpoints n | API success n | API unavailable n | API MiB | JS heap MiB | Browser DOM nodes | Event listeners | API status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | 1 | 1 | 0 | 5.82 | 5.56 | 6,535 | 547 | ok |
| Fluent Web Components | 1 | 1 | 0 | 4.34 | 4.81 | 7,497 | 1,012 | ok |
| Web Awesome | 1 | 1 | 0 | 4.86 | 4.84 | 5,263 | 747 | ok |

### En Reve main memory change from 10 to 50 cycles

Within-session change across 40 more journeys; separate application/native input retention, automation and GC before calling growth a library leak.

| Implementation | Complete checkpoint pairs n | Paired API readings n | API growth MiB | JS heap growth MiB | DOM node growth | Listener growth |
| --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | 1 | 1 | 0.23 | 0.35 | 40 | 0 |
| Fluent Web Components | 1 | 1 | 0.46 | 0.43 | 2,880 | 320 |
| Web Awesome | 1 | 1 | 0.08 | 0.27 | 40 | 0 |

### En Reve main diagnostic coverage

Cohort: en-reve-main-diagnostic-v1. Tracing and coverage have measurement overhead and remain separate from primary timings. These post-journey connected counts are not the browser-wide memory counters.

| Implementation | Successful n | Connected nodes | Connected elements | Open shadow roots | Style elements | Stylesheet adoptions | Unique adopted sheets |
| --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | 1 | 4,668 | 1,580 | 167 | 0 | 598 | 34 |
| Fluent Web Components | 1 | 2,889 | 1,284 | 169 | 0 | 221 | 32 |
| Web Awesome | 1 | 4,212 | 1,401 | 197 | 0 | 611 | 36 |

### En Reve main exercised code coverage

Generated characters are not UTF-8 bytes. Injected collector and non-HTTP code are excluded. External CSS coverage does not include all adopted/CSS-in-JS styles; unexercised code is not necessarily removable.

| Implementation | Diagnostic n | Loaded JS characters | Exercised JS characters | Unexercised JS percent | External CSS characters | Unexercised external CSS percent |
| --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | 1 | 449,978 | 328,098 | 27.1 | 44,562 | 0.4 |
| Fluent Web Components | 1 | 287,939 | 223,304 | 22.4 | 4,300 | 12.8 |
| Web Awesome | 1 | 480,999 | 348,690 | 27.5 | 54,664 | 2.1 |

### En Reve main trace through diagnostic LCP

Renderer-main-thread categories clipped to each trace’s own LCP. Nested categories overlap; do not sum them or mix them with primary timings as one acquisition.

| Implementation | Diagnostic n | Main-thread RunTask ms | HTML parse ms | Layout tree update ms | Layout ms | Paint ms | Script evaluation ms |
| --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | 1 | 138.7 | 4.9 | 16.4 | 8.3 | 1.6 | 5.7 |
| Fluent Web Components | 1 | 78.6 | 1.7 | 10.4 | 8.5 | 1.7 | 5.9 |
| Web Awesome | 1 | 100.2 | 1.6 | 11.0 | 7.5 | 1.4 | 5.6 |

### En Reve main whole-journey sampled function leads

Top five sampled functions per diagnostic journey. These are sampling leads across the complete journey, not exhaustive CPU attribution or startup-only costs. Source mapping and exact intervals remain in the [diagnostic summary](../showcases/performance/runs/en-reve-main-diagnostic-v1/diagnostics-summary.json) and retained trace.

| Implementation | Function | Source | Source line | Sample count | Sampled self ms |
| --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | syncDialog | ../../node_modules/@en-reve/elements/dist/dialog/dialog.js | 240 | 236 | 28.9 |
| En Reve main 6d09b31c | isDisabled | ../../node_modules/@en-reve/elements/dist/toolbar/element.js | 37 | 90 | 12.5 |
| En Reve main 6d09b31c | (anonymous) | assets/index-C0meNs_7.js | 1 | 64 | 10.0 |
| En Reve main 6d09b31c | available | ../../node_modules/@en-reve/elements/dist/menu/element.js | 420 | 73 | 9.5 |
| En Reve main 6d09b31c | r | ../../node_modules/@en-reve/elements/dist/internal/calendar-adapter.js | 6 | 72 | 9.4 |
| Web Awesome | updateScrollControls | ../../node_modules/@awesome.me/webawesome/dist/chunks/chunk.3H27LNYN.js | 254 | 133 | 17.3 |
| Web Awesome | _$ET | ../../node_modules/@lit/reactive-element/reactive-element.js | 6 | 516 | 10.7 |
| Web Awesome | (anonymous) | assets/index-BG3Zw-nj.js | 1 | 78 | 10.5 |
| Web Awesome | requestClose | ../../node_modules/@awesome.me/webawesome/dist/chunks/chunk.YSHBD3IU.js | 89 | 66 | 8.6 |
| Web Awesome | show | ../../node_modules/@awesome.me/webawesome/dist/chunks/chunk.YSHBD3IU.js | 170 | 62 | 8.0 |
| Fluent Web Components | define | ../../node_modules/@microsoft/fast-element/dist/esm/components/fast-definitions.js | 212 | 506 | 9.8 |
| Fluent Web Components | (anonymous) | ../../node_modules/@fluentui/web-components/dist/esm/dialog/dialog.js | 110 | 55 | 7.3 |
| Fluent Web Components | (anonymous) | assets/index-DHbL8u7_.js | 1 | 53 | 6.8 |
| Fluent Web Components | hide | ../../node_modules/@fluentui/web-components/dist/esm/dialog/dialog.js | 130 | 44 | 5.3 |
| Fluent Web Components | get displayValue | ../../node_modules/@fluentui/web-components/dist/esm/dropdown/dropdown.base.js | 95 | 37 | 5.0 |

### En Reve main back-forward cache checks

Direct-CDP diagnostics verify same-document restoration and trusted post-return input. Raw samples retain restoration reasons and post-return interactivity for each attempt. This small sample does not attribute outcomes to library code. These are repeatable checks, not field hit rates or measured restoration latency.

| Implementation | Attempts n | Successful samples | Restored n | Interactive after return n |
| --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | 5 | 5 | 4 | 5 |
| Fluent Web Components | 5 | 5 | 5 | 5 |
| Web Awesome | 5 | 5 | 5 | 5 |

### En Reve main observer overhead calibration

Same-campaign paired on/off blocks; both variants use browser counters. The exploratory bootstrap interval can include zero without proving zero overhead. Probe work is also exposed separately in startup tables.

| Implementation | Profile | Metric | Paired blocks n | Collector on minus off ms | 95% interval low ms | 95% interval high ms |
| --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | desktop | scriptMs | 5 | 2.3 | 0.2 | 4.0 |
| En Reve main 6d09b31c | desktop | taskMs | 5 | 4.2 | -17.0 | 12.1 |
| En Reve main 6d09b31c | desktop | layoutMs | 5 | 0.4 | -0.3 | 0.9 |
| En Reve main 6d09b31c | desktop | styleMs | 5 | 0.2 | -0.5 | 1.1 |
| Fluent Web Components | desktop | scriptMs | 5 | -0.0 | -0.8 | 3.8 |
| Fluent Web Components | desktop | taskMs | 5 | 3.5 | 0.8 | 10.8 |
| Fluent Web Components | desktop | layoutMs | 5 | -0.6 | -2.9 | 0.5 |
| Fluent Web Components | desktop | styleMs | 5 | -0.3 | -1.1 | 1.9 |
| Web Awesome | desktop | scriptMs | 5 | 1.0 | -3.1 | 2.5 |
| Web Awesome | desktop | taskMs | 5 | 4.3 | -7.6 | 9.0 |
| Web Awesome | desktop | layoutMs | 5 | -0.1 | -1.1 | 0.9 |
| Web Awesome | desktop | styleMs | 5 | 0.3 | -0.5 | 1.2 |

### En Reve main same-cohort gaps

Positive differences mean En Reve took longer than the peer. Differences are medians from complete matched blocks in the new acquisition only, with paired-block exploratory bootstrap intervals and no multiple-comparison correction. Fewer than five complete pairs is unavailable. Intervals do not erase workstation noise, feature/typography differences or demonstrate causes. Historical cohorts are never paired here.

### En Reve main Cold LCP gaps

Cohort: en-reve-main-load-v1, cold cache.

| Implementation | Profile | Matched blocks n | En Reve minus peer ms | 95% interval low ms | 95% interval high ms |
| --- | --- | --- | --- | --- | --- |
| Fluent Web Components | mobile | 10 | 130.0 | 116.0 | 156.0 |
| Web Awesome | mobile | 10 | 44.0 | 28.0 | 64.0 |
| Fluent Web Components | desktop | 10 | 18.0 | 8.0 | 26.0 |
| Web Awesome | desktop | 10 | 6.0 | 0.0 | 14.0 |

### En Reve main Warm LCP gaps

Cohort: en-reve-main-load-v1, warm cache.

| Implementation | Profile | Matched blocks n | En Reve minus peer ms | 95% interval low ms | 95% interval high ms |
| --- | --- | --- | --- | --- | --- |
| Fluent Web Components | mobile | 10 | 96.0 | 88.0 | 104.0 |
| Web Awesome | mobile | 10 | 58.0 | 50.0 | 66.0 |
| Fluent Web Components | desktop | 10 | 16.0 | 12.0 | 16.0 |
| Web Awesome | desktop | 10 | 8.0 | 6.0 | 10.0 |

### En Reve main Startup result gaps

Cohort: en-reve-main-startup-v1, cold cache.

| Implementation | Profile | Matched blocks n | En Reve minus peer ms | 95% interval low ms | 95% interval high ms |
| --- | --- | --- | --- | --- | --- |
| Fluent Web Components | mobile | 10 | 122.5 | 115.5 | 136.9 |
| Web Awesome | mobile | 10 | 36.9 | 27.8 | 51.6 |
| Fluent Web Components | desktop | 10 | 19.2 | 14.7 | 21.4 |
| Web Awesome | desktop | 10 | 6.3 | -0.2 | 9.5 |

### En Reve main Scripted INP gaps

Cohort: en-reve-main-interactions-v1, cold cache.

| Implementation | Profile | Matched blocks n | En Reve minus peer ms | 95% interval low ms | 95% interval high ms |
| --- | --- | --- | --- | --- | --- |
| Fluent Web Components | mobile | 10 | -8.0 | -16.0 | 0.0 |
| Web Awesome | mobile | 10 | 8.0 | 0.0 | 16.0 |
| Fluent Web Components | desktop | 10 | 4.0 | -8.0 | 8.0 |
| Web Awesome | desktop | 10 | 8.0 | -4.0 | 8.0 |

### En Reve main connected DOM review

Cohort **en-reve-main-dom-v1**; 30 successful / 0 failed snapshots. Browser: 153.0.8010.12. Desktop 1500 × 1100; narrow 390 × 844; DPR 1; CPU multiplier 1; network throttling none. [Full DOM protocol and measured asset hashes](../showcases/performance/runs/en-reve-main-dom-v1/manifest.json). Connected-tree diagnostics include light DOM and accessible open shadow roots once, without double-counting slot assignment. Closed/UA shadow roots, disconnected templates and browser-native picker internals are not inspected. Complete date fields include labels, native controls and owned custom popups. Without-date totals are arithmetic exclusions, not rebuilt variants. Browser-native dates are not assumed free. This preserves the earlier En Reve date/base audits while extending structural coverage; it does not rerun source audits or prove CPU savings.

### En Reve main connected DOM acquisition coverage

Fresh sessions keep primary initial/after-journey, custom date lifecycle and supplemental ownership separate.

| Implementation | Desktop initial snapshots | Desktop journey snapshots | Narrow initial snapshots | Date lifecycle snapshots | Ownership snapshots |
| --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | 3 | 3 | 1 | 9 | 1 |
| Fluent Web Components | 3 | 3 | 1 | 0 | 1 |
| Web Awesome | 3 | 3 | 1 | 0 | 1 |

### En Reve main connected totals with and without dates

Initial settled desktop tree. Date boundaries follow the entire field, rather than only the visible input. En Reve main and both frozen controls are measured in the same diagnostic acquisition.

| Implementation | Samples n | Full nodes | Full elements | Date nodes | Date elements | Without date nodes | Without date elements |
| --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | 3 | 4667 | 1580 | 628 | 181 | 4039 | 1399 |
| Fluent Web Components | 3 | 2887 | 1284 | 28 | 12 | 2859 | 1272 |
| Web Awesome | 3 | 4210 | 1401 | 28 | 8 | 4182 | 1393 |

### En Reve main full node composition

Whitespace is a subset of text. Comments can be renderer update/hydration markers and must not be mechanically removed. Physical depth includes shadow-root steps, not layout depth.

| Implementation | Elements | Text | Whitespace text | Comments | Open shadow roots | Other nodes | Slots | Base parts | Maximum physical depth |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | 1580 | 1855 | 1518 | 1063 | 167 | 2 | 414 | 55 | 27 |
| Fluent Web Components | 1284 | 1432 | 1198 | 0 | 169 | 2 | 457 | 0 | 18 |
| Web Awesome | 1401 | 1876 | 1651 | 734 | 197 | 2 | 497 | 98 | 21 |

### En Reve main non-date node composition

Whitespace is a subset of text. Comments can be renderer update/hydration markers and must not be mechanically removed. Physical depth includes shadow-root steps, not layout depth.

| Implementation | Elements | Text | Whitespace text | Comments | Open shadow roots | Other nodes | Slots | Base parts | Maximum physical depth |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | 1399 | 1719 | 1440 | 763 | 156 | 2 | 391 | 50 | 22 |
| Fluent Web Components | 1272 | 1418 | 1185 | 0 | 167 | 2 | 451 | 0 | 18 |
| Web Awesome | 1393 | 1863 | 1639 | 728 | 196 | 2 | 493 | 97 | 21 |

### En Reve main connected lifecycle changes

Connected lifecycle changes are not heap-retention or leak evidence. Narrow viewport retains desktop pointer behavior unless explicitly stated by the protocol.

| Implementation | Initial nodes | After journey nodes | Node change | Initial elements | After journey elements | Element change | Narrow initial nodes | Narrow initial elements |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | 4667 | 4668 | 1 | 1580 | 1580 | 0 | 4667 | 1580 |
| Fluent Web Components | 2887 | 2889 | 2 | 1284 | 1284 | 0 | 2887 | 1284 |
| Web Awesome | 4210 | 4212 | 2 | 1401 | 1401 | 0 | 4210 | 1401 |

### En Reve main cohort custom-date lifecycle

Only custom-calendar implementations have visible-grid open/closed diagnostic sessions. Native-picker browser internals are outside census scope. These measurements do not make a browser-native date input equivalent to En Reve’s custom calendar.

| Implementation | State | Samples n | Full nodes | Full elements | Date nodes | Date elements | Without date nodes | Without date elements |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | initial | 3 | 4667 | 1580 | 628 | 181 | 4039 | 1399 |
| En Reve main 6d09b31c | date-open | 3 | 4667 | 1580 | 628 | 181 | 4039 | 1399 |
| En Reve main 6d09b31c | date-closed | 3 | 4667 | 1580 | 628 | 181 | 4039 | 1399 |

### En Reve main light and shadow ownership

Physical ownership, not authorship or CPU cost. Host elements belong to their parent tree; their direct shadow internals, including ShadowRoot nodes, belong to that host bucket. Nested component internals belong to their own host.

| Implementation | Light-tree nodes | Shadow-tree nodes | Light-tree elements | Shadow-tree elements | Light whitespace | Shadow whitespace | Light comments | Shadow comments |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | 1275 | 3392 | 431 | 1149 | 412 | 1106 | 223 | 840 |
| Fluent Web Components | 771 | 2116 | 512 | 772 | 25 | 1173 | 0 | 0 |
| Web Awesome | 608 | 3602 | 401 | 1000 | 9 | 1642 | 0 | 734 |

### En Reve main repeated button shadow structure

Different native-control strategies and variant mixtures remain; this is an investigation guide, not a capability-matched microbenchmark. Slots and required semantic native controls are contracts, not automatic removal candidates.

| Implementation | Button family | Instances | Owned nodes | Owned elements | Elements per instance | Slots per instance | Comments per instance | Whitespace per instance |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-button | 49 | 784 | 294 | 6.00 | 4.00 | 2.00 | 7.00 |
| Fluent Web Components | fluent-button | 47 | 517 | 188 | 4.00 | 3.00 | 0.00 | 6.00 |
| Web Awesome | wa-button | 55 | 938 | 221 | 4.02 | 3.00 | 4.00 | 8.04 |

### En Reve main connected base parts

Part naming is a convention: no base part does not mean no wrapper. SVG bases are rendering primitives. Earlier En Reve host-migration candidates remain proposals; moving part=base to a host does not preserve a consumer ::part(base) selector.

| Implementation | All base parts | SVG base parts | Non-SVG base parts | Without-date base parts | Without-date non-SVG base parts |
| --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | 55 | 19 | 36 | 50 | 35 |
| Fluent Web Components | 0 | 0 | 0 | 0 | 0 |
| Web Awesome | 98 | 0 | 98 | 97 | 97 |

### En Reve main implications and next investigations

**Startup is the clearest current gap.** In the new mobile acquisition, En Reve median LCP is 644 ms cold / 304 ms warm, versus 514 / 208 ms for frozen Fluent WC and 600 / 246 ms for frozen Web Awesome. The early-click result arrives at 637.5 ms from navigation for En Reve, versus 515.0 and 600.6 ms. Use the matched-block difference tables and exploratory intervals below; these fixture differences are not a causal library-only decomposition. Historical timings were measured in other sessions and are not a controlled before/after experiment.

**Settled responsiveness has a different ordering.** All 60 new interaction journeys passed. Mobile scripted INP medians are 56 ms for En Reve, 64 ms for Fluent and 48 ms for Web Awesome. The seven individual-action tables distinguish first-use and repeated costs. These bounded scripted results are not field INP, and first-input delay does not include the entire response.

**The eager payload grew and remains a single initial JavaScript chunk.** En Reve emits 450,035 uncompressed production JS bytes and 89,035 Brotli bytes: 35,580 raw bytes / 6,744 Brotli bytes above the prior frozen fixture. The default-theme update is also included. This deterministic size change is separate from historical timing differences. Main now has opt-in scoped/lazy and deferred-date delivery APIs, but this unchanged global eager consumer does not exercise them; evaluate their user-visible tradeoffs in a new capability-equivalent variant instead of attributing those benefits to this run.

**Zero blocking and layout-shift audits do not mean equal startup cost.** All three implementations have median Lighthouse TBT and CLS of zero. En Reve Lighthouse LCP is 779.35 ms and Speed Index 627 ms, from a separate full-browser audit configuration. Keep those results separate from primary headless loading and inspect script/style/layout trace leads before assigning causes.

**Memory and connected nodes remain diagnostic evidence.** En Reve completes its 0/10/50-cycle API-memory checkpoints successfully. A single GC-dependent session cannot establish a leak or a stable memory ranking. The separate connected-DOM tables count the entire custom date field both in and out, and report opening/closing separately. Historical base-wrapper/source audits remain proposals against their original source; map current ownership hotspots back to those proposals before changing semantics, parts or host styling.

**The custom-date boundary changes the DOM comparison materially.** En Reve starts with 4,667 nodes / 1,580 elements; its date field accounts for 628 / 181. Excluding that field leaves 4,039 nodes / 1,399 elements, versus Web Awesome at 4,182 / 1,393 and Fluent at 2,859 / 1,272. En Reve has 143 fewer non-date nodes than Web Awesome and only six more non-date elements, while retaining a larger gap against Fluent. The eagerly mounted calendar stays present through open/close, so an opt-in deferred variant is a distinct and useful experiment. These structural counts do not establish CPU cost.

### En Reve main prioritized En Reve investigations

Proposed implementation work for later. Keep the frozen source and capability differences explicit; structural or timing correlations are hypotheses until a controlled change improves the intended end-user metric.

| Priority | Investigation | Evidence | Next experiment | Acceptance |
| --- | --- | --- | --- | --- |
| P1 | Reduce initial eager JavaScript delivery | 439.5 KiB emitted JS; one initial chunk and no dynamic import edges in this fixture | Use the new main scoped/lazy APIs in a separate capability-equivalent consumer variant; compare registration, route and intent boundaries against this frozen main baseline | Lower mobile cold/warm startup with complete first-use, keyboard, reset and form behavior; retain missing/failed samples |
| P1 | Explain warm startup work before removing DOM | Warm En Reve LCP remains above both same-campaign controls | Use the diagnostic trace and source leads to isolate registration, style and layout costs; change one factor at a time | Improved warm load and startup response without moving delay to first interaction |
| P2 | Measure deferred calendar tradeoffs explicitly | This eager fixture includes the complete custom-calendar contract; date-inclusive/excluded counts are reported separately | Create a separately qualified deferred-date variant from main, preserving native editing, first-open, retry and repeat-open behavior | Reduced initial bytes/tree with bounded measured first-open latency and retained accessibility/form checks |
| P2 | Revisit wrapper reductions against the current source | Historical base-wrapper audit is retained, not claimed as a current-source re-audit | Map current ownership/count hotspots to the original host-migration proposals, then validate semantics, parts and style inheritance for one candidate | Lower measured startup/rendering or retention cost while preserving styling, focus and public contracts |

### En Reve main coverage boundaries

No production field/RUM evidence, SSR/hydration performance, physical-device validation, assistive-technology benchmark, routed soft-navigation metric, or realistic image/video workload is established by these fixtures. Native calendar UI internals are outside the connected census. Memory sessions remain exploratory. The inspired En Reve theme is functionally/visually qualified separately; its presence is not included in the frozen En Reve performance control. Missing measurements remain explicit rather than inferred from another suite or historical campaign.
