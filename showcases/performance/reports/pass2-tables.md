## Second pass measurements

This expands the historical comparison below. Every table can be sorted by its measurement columns in the HTML reader. **KiB = 1,024 bytes; MiB = 1,048,576 bytes.** A dash means unavailable or no successful measurement, never zero. Tables show successful and failed samples separately. Missing values stay last in either sort direction. These are exploratory workstation measurements of the frozen CSR fixtures, not release gates or a universal ranking.

[Second-pass machine-readable tables and cohort receipts](../showcases/performance/reports/pass2-tables.json). [Execution receipt](../showcases/performance/reports/pass2-execution.json). [Retained raw evidence receipt](../showcases/performance/reports/pass2-evidence/receipt.json).

Read loading and startup usability first, then transfer and main-thread work to identify a likely cost. Use interaction tables to check whether an optimization merely moves that cost to the first click. Memory and diagnostics support hypotheses; they do not prove leaks or causality. Historical first-pass evidence is kept separately below.

- Mobile cold LCP: En Reve 622 ms; Fluent Web Components 514 ms; Radix React 658 ms. Ten successful samples per cell.
- Mobile warm LCP: En Reve 284 ms; Fluent Web Components 218 ms; Radix React 240 ms. Cache reuse changes the relative tradeoff; inspect warm main-thread work as well as cold transfer.
- En Reve response transfer: cold 86.6 KiB; warm 0.243 KiB. See raw/all-chunk costs separately.
- The early-click probe reached its canvas result at 600.9 ms from navigation for En Reve versus 500.3 ms for Fluent Web Components. These include exposed automation overhead and do not establish a universal earliest-ready time.
- Scripted mobile INP medians: En Reve 48.0 ms; Radix 56.0 ms; Fluent Web Components 64.0 ms. These bounded scripted journeys are not field INP.
- First dialog opening: En Reve frame opportunity is 12.9 ms slower than Fluent Web Components (95% interval 10.5 to 17.8; n=10). This post-analysis candidate needs independent confirmation.
- En Reve Lighthouse medians: TBT 0.0 ms; Speed Index 589.0 ms; LCP 724.8 ms (n=5). These independent full-browser audits do not replace the primary load measurements.
- En Reve recorded zero CLS across all 40 load samples. These bounded visits do not presently suggest a layout-stability remediation priority; they do not cover every consumer application or interaction.

### Campaign coverage

The panel uses eight implementations. Load: ten blocks across four profile/cache cells. Startup and interactions: ten blocks per profile. Lighthouse: five mobile audits each. Memory: one desktop session each, at 0, 10 and 50 repeated journeys. No failed sample is retried or replaced.

| Campaign | Planned samples | Recorded samples | Successful samples | Failed samples |
| --- | ---: | ---: | ---: | ---: |
| load | 320 | 320 | 320 | 0 |
| startup | 160 | 160 | 160 | 0 |
| interactions | 160 | 160 | 150 | 10 |
| lighthouse | 40 | 40 | 40 | 0 |
| memory | 8 | 8 | 8 | 0 |

### Historical overlap check

Same frozen artifacts and mobile/cold profile, different campaign times, harness hashes and power states (first pass battery; second pass AC). This is a drift check, not a library change or paired experiment. Historical and new distributions remain separate.

| Implementation | Historical samples n | New samples n | Historical LCP ms | New LCP ms | Median change ms |
| --- | ---: | ---: | ---: | ---: | ---: |
| En Reve | 30 | 10 | 604.0 | 622.0 | 18.0 |
| Radix React | 30 | 10 | 656.0 | 658.0 | 2.0 |
| Fluent React | 30 | 10 | 684.0 | 698.0 | 14.0 |
| Spectrum React S2 | 30 | 10 | 1,380.0 | 1,384.0 | 4.0 |
| Astryx React | 30 | 10 | 770.0 | 784.0 | 14.0 |
| shadcn React | 30 | 10 | 702.0 | 708.0 | 6.0 |
| Fluent Web Components | 30 | 10 | 504.0 | 514.0 | 10.0 |
| Spectrum Web Components | 30 | 10 | 740.0 | 760.0 | 20.0 |

### Failed journeys retained

Failed journeys are retained in the raw evidence and excluded from successful timing distributions. The last observed action is a diagnostic clue, not a proven root cause or a library-wide performance judgment. Memory checkpoints reached before a later failure remain explicitly labeled in their own tables.

| Campaign | Implementation | Profile | Failed n | Last observed action | Recorded failure |
| --- | ---: | ---: | ---: | ---: | ---: |
| interactions | Spectrum Web Components | mobile | 10 | canvas-landscape-warm | Error: expect(locator).toHaveAttribute(expected) failed |

## Loading and visual stability

The load suite sends no input, so LCP collection is not cut short by a test click. The observation window ends after load plus 1.5 seconds and card readiness; CLS is bounded to this visit. TTFB is a loopback timestamp and does not establish deployed backend performance.

### mobile cold loading

FCP: first contentful paint. LCP: largest contentful paint. Card/frame and last-webfont-response milestones are navigation-relative; neither proves every control is usable. A dash in the webfont column means no measurable downloaded-font response. The older load-time document.fonts.ready promise can resolve before dynamically registered fonts start loading; it is not used as final font readiness here. Warm visits reuse a primed browser context. Cohort: pass2-load-matrix-v1; mobile/cold. Values are per-system sample medians unless labeled p75. Campaign complete.

| Implementation | Successful n | Failed n | FCP ms | LCP ms | LCP p75 ms | CLS | CLS p75 | CLS max | TTFB ms | Cards frame opportunity ms | Last webfont response ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| En Reve | 10 | 0 | 622.0 | 622.0 | 651.0 | 0.000000 | 0.000000 | 0.000000 | 15.5 | 616.5 | — |
| Radix React | 10 | 0 | 658.0 | 658.0 | 682.0 | 0.000000 | 0.000000 | 0.000000 | 15.1 | 660.7 | — |
| Fluent React | 10 | 0 | 698.0 | 698.0 | 704.0 | 0.000000 | 0.000000 | 0.000000 | 16.0 | 713.6 | — |
| Spectrum React S2 | 10 | 0 | 988.0 | 1,384.0 | 1,394.0 | 0.001630 | 0.001630 | 0.001630 | 15.8 | 1,000.4 | 1,207.7 |
| Astryx React | 10 | 0 | 784.0 | 784.0 | 791.0 | 0.000000 | 0.000000 | 0.000000 | 17.5 | 793.5 | — |
| shadcn React | 10 | 0 | 708.0 | 708.0 | 722.0 | 0.000986 | 0.000986 | 0.000986 | 15.4 | 724.5 | 868.4 |
| Fluent Web Components | 10 | 0 | 514.0 | 514.0 | 519.0 | 0.000000 | 0.000000 | 0.000000 | 15.5 | 504.5 | — |
| Spectrum Web Components | 10 | 0 | 760.0 | 760.0 | 790.0 | 0.000000 | 0.000000 | 0.000000 | 16.3 | 760.1 | — |

### mobile warm loading

FCP: first contentful paint. LCP: largest contentful paint. Card/frame and last-webfont-response milestones are navigation-relative; neither proves every control is usable. A dash in the webfont column means no measurable downloaded-font response. The older load-time document.fonts.ready promise can resolve before dynamically registered fonts start loading; it is not used as final font readiness here. Warm visits reuse a primed browser context. Cohort: pass2-load-matrix-v1; mobile/warm. Values are per-system sample medians unless labeled p75. Campaign complete.

| Implementation | Successful n | Failed n | FCP ms | LCP ms | LCP p75 ms | CLS | CLS p75 | CLS max | TTFB ms | Cards frame opportunity ms | Last webfont response ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| En Reve | 10 | 0 | 284.0 | 284.0 | 284.0 | 0.000000 | 0.000000 | 0.000000 | 2.0 | 291.0 | — |
| Radix React | 10 | 0 | 240.0 | 240.0 | 244.0 | 0.000000 | 0.000000 | 0.000000 | 0.9 | 237.3 | — |
| Fluent React | 10 | 0 | 234.0 | 234.0 | 255.0 | 0.000000 | 0.000000 | 0.000000 | 0.9 | 242.8 | — |
| Spectrum React S2 | 10 | 0 | 532.0 | 532.0 | 548.0 | 0.000000 | 0.000000 | 0.000000 | 1.0 | 544.6 | 159.3 |
| Astryx React | 10 | 0 | 262.0 | 262.0 | 268.0 | 0.000000 | 0.000000 | 0.000000 | 1.4 | 274.6 | — |
| shadcn React | 10 | 0 | 268.0 | 268.0 | 280.0 | 0.000000 | 0.000000 | 0.000000 | 0.8 | 280.5 | 124.3 |
| Fluent Web Components | 10 | 0 | 218.0 | 218.0 | 223.0 | 0.000000 | 0.000000 | 0.000000 | 2.7 | 223.3 | — |
| Spectrum Web Components | 10 | 0 | 302.0 | 302.0 | 316.0 | 0.000000 | 0.000000 | 0.000000 | 1.4 | 320.7 | — |

### desktop cold loading

FCP: first contentful paint. LCP: largest contentful paint. Card/frame and last-webfont-response milestones are navigation-relative; neither proves every control is usable. A dash in the webfont column means no measurable downloaded-font response. The older load-time document.fonts.ready promise can resolve before dynamically registered fonts start loading; it is not used as final font readiness here. Warm visits reuse a primed browser context. Cohort: pass2-load-matrix-v1; desktop/cold. Values are per-system sample medians unless labeled p75. Campaign complete.

| Implementation | Successful n | Failed n | FCP ms | LCP ms | LCP p75 ms | CLS | CLS p75 | CLS max | TTFB ms | Cards frame opportunity ms | Last webfont response ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| En Reve | 10 | 0 | 94.0 | 94.0 | 99.0 | 0.000000 | 0.000000 | 0.000000 | 15.1 | 83.9 | — |
| Radix React | 10 | 0 | 128.0 | 128.0 | 128.0 | 0.000000 | 0.000000 | 0.000000 | 14.6 | 86.1 | — |
| Fluent React | 10 | 0 | 104.0 | 104.0 | 108.0 | 0.000000 | 0.000000 | 0.000000 | 15.8 | 96.1 | — |
| Spectrum React S2 | 10 | 0 | 158.0 | 234.0 | 253.0 | 0.002332 | 0.002332 | 0.002332 | 16.4 | 158.8 | 178.5 |
| Astryx React | 10 | 0 | 120.0 | 120.0 | 124.0 | 0.000000 | 0.000000 | 0.000000 | 15.8 | 109.0 | — |
| shadcn React | 10 | 0 | 126.0 | 126.0 | 142.0 | 0.002616 | 0.005232 | 0.005232 | 16.2 | 120.8 | 100.5 |
| Fluent Web Components | 10 | 0 | 78.0 | 78.0 | 83.0 | 0.000075 | 0.000075 | 0.000075 | 14.9 | 71.0 | — |
| Spectrum Web Components | 10 | 0 | 108.0 | 108.0 | 112.0 | 0.000000 | 0.000000 | 0.000000 | 17.2 | 101.3 | — |

### desktop warm loading

FCP: first contentful paint. LCP: largest contentful paint. Card/frame and last-webfont-response milestones are navigation-relative; neither proves every control is usable. A dash in the webfont column means no measurable downloaded-font response. The older load-time document.fonts.ready promise can resolve before dynamically registered fonts start loading; it is not used as final font readiness here. Warm visits reuse a primed browser context. Cohort: pass2-load-matrix-v1; desktop/warm. Values are per-system sample medians unless labeled p75. Campaign complete.

| Implementation | Successful n | Failed n | FCP ms | LCP ms | LCP p75 ms | CLS | CLS p75 | CLS max | TTFB ms | Cards frame opportunity ms | Last webfont response ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| En Reve | 10 | 0 | 44.0 | 44.0 | 44.0 | 0.000000 | 0.000000 | 0.000000 | 0.8 | 40.3 | — |
| Radix React | 10 | 0 | 68.0 | 68.0 | 68.0 | 0.000000 | 0.000000 | 0.000000 | 0.9 | 65.7 | — |
| Fluent React | 10 | 0 | 34.0 | 34.0 | 36.0 | 0.000000 | 0.000000 | 0.000000 | 0.7 | 32.9 | — |
| Spectrum React S2 | 10 | 0 | 102.0 | 102.0 | 104.0 | 0.000000 | 0.000000 | 0.000000 | 0.9 | 95.6 | 13.4 |
| Astryx React | 10 | 0 | 40.0 | 40.0 | 44.0 | 0.000000 | 0.000000 | 0.000000 | 0.8 | 38.2 | — |
| shadcn React | 10 | 0 | 42.0 | 42.0 | 47.0 | 0.000000 | 0.000000 | 0.000000 | 0.8 | 39.6 | 5.4 |
| Fluent Web Components | 10 | 0 | 28.0 | 28.0 | 31.0 | 0.000075 | 0.000075 | 0.000075 | 0.8 | 27.2 | — |
| Spectrum Web Components | 10 | 0 | 48.0 | 48.0 | 48.0 | 0.000000 | 0.000000 | 0.000000 | 1.0 | 45.4 | — |

### mobile cold LCP attribution

LCP attribution from web-vitals. A text LCP can have zero image-resource phases; its render-delay portion includes discovery, JS/CSS/fonts and rendering, not just CPU rendering time. Independent medians are not guaranteed to sum to the median LCP. Cohort: pass2-load-matrix-v1; mobile/cold. Values are per-system sample medians unless labeled p75. Campaign complete.

| Implementation | Successful n | Failed n | TTFB portion ms | Resource delay ms | Resource duration ms | Element render delay ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| En Reve | 10 | 0 | 15.5 | 0.0 | 0.0 | 608.0 |
| Radix React | 10 | 0 | 15.1 | 0.0 | 0.0 | 643.7 |
| Fluent React | 10 | 0 | 16.0 | 0.0 | 0.0 | 682.5 |
| Spectrum React S2 | 10 | 0 | 15.8 | 0.0 | 0.0 | 1,368.0 |
| Astryx React | 10 | 0 | 17.5 | 0.0 | 0.0 | 768.8 |
| shadcn React | 10 | 0 | 15.4 | 0.0 | 0.0 | 691.1 |
| Fluent Web Components | 10 | 0 | 15.5 | 0.0 | 0.0 | 496.3 |
| Spectrum Web Components | 10 | 0 | 16.3 | 0.0 | 0.0 | 745.7 |

### desktop cold LCP attribution

LCP attribution from web-vitals. A text LCP can have zero image-resource phases; its render-delay portion includes discovery, JS/CSS/fonts and rendering, not just CPU rendering time. Independent medians are not guaranteed to sum to the median LCP. Cohort: pass2-load-matrix-v1; desktop/cold. Values are per-system sample medians unless labeled p75. Campaign complete.

| Implementation | Successful n | Failed n | TTFB portion ms | Resource delay ms | Resource duration ms | Element render delay ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| En Reve | 10 | 0 | 15.1 | 0.0 | 0.0 | 78.2 |
| Radix React | 10 | 0 | 14.6 | 0.0 | 0.0 | 113.4 |
| Fluent React | 10 | 0 | 15.8 | 0.0 | 0.0 | 89.2 |
| Spectrum React S2 | 10 | 0 | 16.4 | 0.0 | 0.0 | 214.8 |
| Astryx React | 10 | 0 | 15.8 | 0.0 | 0.0 | 104.7 |
| shadcn React | 10 | 0 | 16.2 | 0.0 | 0.0 | 107.4 |
| Fluent Web Components | 10 | 0 | 14.9 | 0.0 | 0.0 | 62.6 |
| Spectrum Web Components | 10 | 0 | 17.2 | 0.0 | 0.0 | 94.0 |

## Startup usability

A separate cold-navigation suite sends one trusted mouse click at the first Landscape control geometry observed by an injected animation-frame probe. It does not wait for the load event or the usual 1.5-second settling interval. It refreshes coordinates immediately before its one click, verifies the actual composed-path target, and verifies the canvas result and a subsequent two-rAF frame opportunity. Discovery and dispatch overhead are exposed: this is an observed successful probe, **not the mathematically earliest usable instant, legacy TTI, or field FID**. Early input ends LCP eligibility, so these samples do not enter load comparisons. The probe records its cumulative synchronous discovery elapsed time, including any forced style/layout; this is not a thread-CPU measurement. The [superseded 160-sample v1 pilot](../showcases/performance/reports/pass2-startup-superseded.json) used host-side visibility polling with up to 500 ms backoff and is excluded from these comparisons. A subsequent v2 qualification had two stale-coordinate failures in Fluent WC; those are retained as invalid probe attempts. The current v3 probe passed all sixteen qualification cases before its timing cohort. [Discovery calibration](../showcases/performance/reports/startup-discovery-calibration-pass2.json) verifies the replacement. [Probe calibration](../showcases/performance/reports/startup-calibration-pass2.json) confirms that a click lost before handler attachment fails rather than being retried.

### mobile startup click

Navigation-relative timestamps include automation overhead; click-to-result/frame measures the response to that single input. Cohort: pass2-startup-v3; mobile/cold. Values are per-system sample medians unless labeled p75. Campaign complete.

| Implementation | Successful n | Failed n | Control observed ms | Click from navigation ms | Result from navigation ms | Result p75 ms | Dispatch overhead ms | Discovery probe ms | Click to result ms | Click to frame ms | First input delay ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| En Reve | 10 | 0 | 573.9 | 592.1 | 600.9 | 604.4 | 17.5 | 0.7 | 8.9 | 44.8 | 2.6 |
| Radix React | 10 | 0 | 622.6 | 645.1 | 659.9 | 662.4 | 22.3 | 2.4 | 14.4 | 44.8 | 5.3 |
| Fluent React | 10 | 0 | 656.3 | 689.5 | 711.4 | 723.5 | 33.0 | 79.0 | 21.6 | 55.7 | 5.3 |
| Spectrum React S2 | 10 | 0 | 945.1 | 956.6 | 988.3 | 1,002.1 | 11.5 | 0.8 | 32.0 | 64.4 | 4.5 |
| Astryx React | 10 | 0 | 735.8 | 755.6 | 772.8 | 779.0 | 20.1 | 2.8 | 17.3 | 49.7 | 4.2 |
| shadcn React | 10 | 0 | 684.0 | 699.4 | 715.3 | 718.3 | 15.7 | 0.4 | 15.1 | 48.1 | 5.7 |
| Fluent Web Components | 10 | 0 | 442.8 | 492.6 | 500.3 | 513.0 | 50.3 | 0.6 | 7.0 | 39.1 | 4.5 |
| Spectrum Web Components | 10 | 0 | 707.4 | 729.4 | 742.9 | 750.6 | 20.8 | 1.2 | 13.5 | 44.5 | 9.6 |

### desktop startup click

Navigation-relative timestamps include automation overhead; click-to-result/frame measures the response to that single input. Cohort: pass2-startup-v3; desktop/cold. Values are per-system sample medians unless labeled p75. Campaign complete.

| Implementation | Successful n | Failed n | Control observed ms | Click from navigation ms | Result from navigation ms | Result p75 ms | Dispatch overhead ms | Discovery probe ms | Click to result ms | Click to frame ms | First input delay ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| En Reve | 10 | 0 | 81.4 | 86.3 | 88.2 | 91.1 | 5.0 | 0.2 | 2.0 | 28.3 | 0.7 |
| Radix React | 10 | 0 | 79.5 | 84.8 | 88.4 | 89.6 | 5.3 | 0.5 | 3.2 | 40.5 | — |
| Fluent React | 10 | 0 | 84.2 | 91.3 | 98.8 | 102.9 | 7.3 | 17.4 | 6.8 | 35.2 | — |
| Spectrum React S2 | 10 | 0 | 165.0 | 169.3 | 177.1 | 180.1 | 4.1 | 31.7 | 7.7 | 38.2 | 0.7 |
| Astryx React | 10 | 0 | 95.8 | 101.1 | 105.1 | 106.6 | 5.1 | 0.6 | 4.0 | 31.1 | 1.0 |
| shadcn React | 10 | 0 | 91.3 | 121.5 | 125.7 | 134.0 | 30.1 | 0.0 | 4.2 | 28.4 | 2.0 |
| Fluent Web Components | 10 | 0 | 59.6 | 72.2 | 73.2 | 74.7 | 12.1 | 0.1 | 1.1 | 35.0 | — |
| Spectrum Web Components | 10 | 0 | 93.4 | 98.8 | 101.1 | 105.9 | 5.5 | 0.2 | 2.4 | 31.1 | — |

## Production files and chunking

Deterministic emitted asset sizes for the complete fixture, including application and framework/runtime code, before and after transport compression. These are not library-only marginal costs. Raw JS means production/minified bytes before gzip or Brotli, not browser compiled-code memory. All emitted chunks are counted even if not initially downloaded. CSS-in-JS remains in JS. Local-font columns exclude remote fonts, which are counted in browser transfer below. HTML is the actual CSR shell; **no SSR/hydration cohort has been built or measured in this pass**.

### Production payload sizes

Frozen production assets; one deterministic build per implementation. Source maps and diagnostic metadata are excluded.

| Implementation | JS raw KiB | JS gzip KiB | JS Brotli KiB | Initial JS Brotli KiB | CSS raw KiB | CSS Brotli KiB | Local fonts Brotli KiB | HTML raw KiB | HTML Brotli KiB |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| En Reve | 404.7 | 100.1 | 80.4 | 80.4 | 39.8 | 5.6 | 0.0 | 0.351 | 0.155 |
| Radix React | 406.5 | 120.6 | 102.9 | 102.9 | 670.8 | 49.0 | 0.0 | 0.354 | 0.159 |
| Fluent React | 799.0 | 218.3 | 170.8 | 170.8 | 3.3 | 1.0 | 0.0 | 0.355 | 0.160 |
| Spectrum React S2 | 980.8 | 278.8 | 216.3 | 216.3 | 65.2 | 11.3 | 0.0 | 0.357 | 0.165 |
| Astryx React | 722.2 | 211.5 | 174.2 | 174.0 | 191.7 | 26.5 | 0.0 | 0.355 | 0.163 |
| shadcn React | 526.4 | 164.9 | 138.6 | 138.6 | 77.0 | 10.8 | 68.1 | 0.355 | 0.164 |
| Fluent Web Components | 281.2 | 69.3 | 57.1 | 57.1 | 4.2 | 1.2 | 0.0 | 0.364 | 0.173 |
| Spectrum Web Components | 1,246.6 | 217.8 | 170.5 | 156.3 | 3.9 | 1.1 | 0.0 | 1.310 | 0.345 |

### Chunk structure

These are the emitted graphs of the current native fixtures, not a ceiling on each library’s possible splitting. A dynamic edge is a capability to load later, not proof of initial-byte savings. Sources in multiple chunks need inspection before treating them as removable duplication.

| Implementation | JS files | CSS files | Static initial assets | Dynamic import edges | Sources in multiple chunks |
| --- | ---: | ---: | ---: | ---: | ---: |
| En Reve | 1 | 1 | 2 | 0 | 0 |
| Radix React | 1 | 1 | 2 | 0 | 0 |
| Fluent React | 1 | 1 | 2 | 0 | 0 |
| Spectrum React S2 | 1 | 1 | 2 | 0 | 0 |
| Astryx React | 2 | 1 | 2 | 1 | 0 |
| shadcn React | 1 | 1 | 2 | 0 | 0 |
| Fluent Web Components | 1 | 1 | 2 | 0 | 0 |
| Spectrum Web Components | 18 | 1 | 14 | 9 | 0 |

## Whole-page delivery

**Browser-reported response transfer includes the HTML document, scripts, styles, fonts and other responses.** It uses completed CDP response byte counts captured before leaving the page; lifecycle beacons and destination pages are excluded. These are response bytes, not packet captures of TCP/TLS traffic. Resource Timing totals are retained separately because its header accounting and cache/privacy rules differ. Cache reuse counts timing entries with zero transfer and a positive encoded body size, including memory-cache reuse not represented by the CDP disk-cache flag. A missing completion makes the total unavailable; missing resources are not free. Load tables cover the bounded load visit, not future clicks. Separate cumulative interaction-journey tables include requests made by the tested actions; offline all-JS inventory also includes chunks never requested in either journey.

### mobile cold response transfer

Response categories are measured in each sample. Independently calculated medians need not sum exactly to the median total. Cohort: pass2-load-matrix-v1; mobile/cold. Values are per-system sample medians unless labeled p75. Campaign complete.

| Implementation | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| En Reve | 10 | 0 | 86.6 | 0.325 | 80.5 | 5.7 | 0.0 | 0.0 | 3 | 0 | 0 |
| Radix React | 10 | 0 | 152.5 | 0.331 | 103.1 | 49.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| Fluent React | 10 | 0 | 172.4 | 0.331 | 170.9 | 1.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| Spectrum React S2 | 10 | 0 | 699.9 | 0.336 | 216.5 | 11.4 | 471.7 | 0.0 | 5 | 1 | 0 |
| Astryx React | 10 | 0 | 201.2 | 0.334 | 174.2 | 26.7 | 0.0 | 0.0 | 3 | 0 | 0 |
| shadcn React | 10 | 0 | 218.4 | 0.335 | 138.8 | 10.9 | 68.3 | 0.0 | 4 | 0 | 0 |
| Fluent Web Components | 10 | 0 | 58.9 | 0.344 | 57.2 | 1.3 | 0.0 | 0.0 | 3 | 0 | 0 |
| Spectrum Web Components | 10 | 0 | 159.3 | 0.516 | 157.6 | 1.2 | 0.0 | 0.0 | 15 | 0 | 0 |

### mobile warm response transfer

Response categories are measured in each sample. Independently calculated medians need not sum exactly to the median total. Cohort: pass2-load-matrix-v1; mobile/warm. Values are per-system sample medians unless labeled p75. Campaign complete.

| Implementation | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| En Reve | 10 | 0 | 0.2 | 0.243 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| Radix React | 10 | 0 | 0.2 | 0.249 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| Fluent React | 10 | 0 | 0.2 | 0.249 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| Spectrum React S2 | 10 | 0 | 0.3 | 0.254 | 0.0 | 0.0 | 0.0 | 0.0 | 5 | 4 | 0 |
| Astryx React | 10 | 0 | 0.3 | 0.252 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| shadcn React | 10 | 0 | 0.3 | 0.253 | 0.0 | 0.0 | 0.0 | 0.0 | 4 | 3 | 0 |
| Fluent Web Components | 10 | 0 | 0.3 | 0.262 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| Spectrum Web Components | 10 | 0 | 0.4 | 0.434 | 0.0 | 0.0 | 0.0 | 0.0 | 15 | 14 | 0 |

### desktop cold response transfer

Response categories are measured in each sample. Independently calculated medians need not sum exactly to the median total. Cohort: pass2-load-matrix-v1; desktop/cold. Values are per-system sample medians unless labeled p75. Campaign complete.

| Implementation | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| En Reve | 10 | 0 | 86.6 | 0.325 | 80.5 | 5.7 | 0.0 | 0.0 | 3 | 0 | 0 |
| Radix React | 10 | 0 | 152.5 | 0.331 | 103.1 | 49.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| Fluent React | 10 | 0 | 172.4 | 0.331 | 170.9 | 1.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| Spectrum React S2 | 10 | 0 | 699.9 | 0.336 | 216.5 | 11.4 | 471.7 | 0.0 | 5 | 1 | 0 |
| Astryx React | 10 | 0 | 201.2 | 0.334 | 174.2 | 26.7 | 0.0 | 0.0 | 3 | 0 | 0 |
| shadcn React | 10 | 0 | 218.4 | 0.335 | 138.8 | 10.9 | 68.3 | 0.0 | 4 | 0 | 0 |
| Fluent Web Components | 10 | 0 | 58.9 | 0.344 | 57.2 | 1.3 | 0.0 | 0.0 | 3 | 0 | 0 |
| Spectrum Web Components | 10 | 0 | 159.3 | 0.516 | 157.6 | 1.2 | 0.0 | 0.0 | 15 | 0 | 0 |

### desktop warm response transfer

Response categories are measured in each sample. Independently calculated medians need not sum exactly to the median total. Cohort: pass2-load-matrix-v1; desktop/warm. Values are per-system sample medians unless labeled p75. Campaign complete.

| Implementation | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| En Reve | 10 | 0 | 0.2 | 0.243 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| Radix React | 10 | 0 | 0.2 | 0.249 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| Fluent React | 10 | 0 | 0.2 | 0.249 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| Spectrum React S2 | 10 | 0 | 0.3 | 0.254 | 0.0 | 0.0 | 0.0 | 0.0 | 5 | 4 | 0 |
| Astryx React | 10 | 0 | 0.3 | 0.252 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| shadcn React | 10 | 0 | 0.3 | 0.253 | 0.0 | 0.0 | 0.0 | 0.0 | 4 | 3 | 0 |
| Fluent Web Components | 10 | 0 | 0.3 | 0.262 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| Spectrum Web Components | 10 | 0 | 0.4 | 0.434 | 0.0 | 0.0 | 0.0 | 0.0 | 15 | 14 | 0 |

### mobile cumulative interaction transfer

Fresh page plus the complete successful scripted interaction journey. This is a cumulative total from a different cohort, not the incremental cost of one action or the difference of two medians. Cohort: pass2-interactions-v1; mobile/cold. Values are per-system sample medians unless labeled p75. Campaign complete.

| Implementation | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Incomplete responses |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| En Reve | 10 | 0 | 86.6 | 0.325 | 80.5 | 5.7 | 0.0 | 0 |
| Radix React | 10 | 0 | 152.5 | 0.331 | 103.1 | 49.1 | 0.0 | 0 |
| Fluent React | 10 | 0 | 172.4 | 0.331 | 170.9 | 1.1 | 0.0 | 0 |
| Spectrum React S2 | 10 | 0 | 699.9 | 0.336 | 216.5 | 11.4 | 471.7 | 0 |
| Astryx React | 10 | 0 | 201.2 | 0.334 | 174.2 | 26.7 | 0.0 | 0 |
| shadcn React | 10 | 0 | 218.4 | 0.335 | 138.8 | 10.9 | 68.3 | 0 |
| Fluent Web Components | 10 | 0 | 58.9 | 0.344 | 57.2 | 1.3 | 0.0 | 0 |
| Spectrum Web Components | 0 | 10 | — | — | — | — | — | — |

### desktop cumulative interaction transfer

Fresh page plus the complete successful scripted interaction journey. This is a cumulative total from a different cohort, not the incremental cost of one action or the difference of two medians. Cohort: pass2-interactions-v1; desktop/cold. Values are per-system sample medians unless labeled p75. Campaign complete.

| Implementation | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Incomplete responses |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| En Reve | 10 | 0 | 86.6 | 0.325 | 80.5 | 5.7 | 0.0 | 0 |
| Radix React | 10 | 0 | 152.5 | 0.331 | 103.1 | 49.1 | 0.0 | 0 |
| Fluent React | 10 | 0 | 172.4 | 0.331 | 170.9 | 1.1 | 0.0 | 0 |
| Spectrum React S2 | 10 | 0 | 699.9 | 0.336 | 216.5 | 11.4 | 471.7 | 0 |
| Astryx React | 10 | 0 | 201.2 | 0.334 | 174.2 | 26.7 | 0.0 | 0 |
| shadcn React | 10 | 0 | 218.4 | 0.335 | 138.8 | 10.9 | 68.3 | 0 |
| Fluent Web Components | 10 | 0 | 58.9 | 0.344 | 57.2 | 1.3 | 0.0 | 0 |
| Spectrum Web Components | 10 | 0 | 164.4 | 0.516 | 162.6 | 1.2 | 0.0 | 0 |

## Main-thread work and load blocking

CDP script/style/layout/task counters are captured at the bounded load endpoint. The [counter-scope calibration](../showcases/performance/reports/cdp-scope-calibration-pass2.json) checks that prior-document work is excluded in this pinned browser/navigation pattern. They are not a decomposition of LCP and can overlap. Long-task and long-animation-frame totals sum whole durations, **not TBT**, and are not additive to one another. The two blocking-excess columns count only each long task’s portion beyond 50 ms, clipped before FCP or from FCP to the bounded observation endpoint. They are named separately from Lighthouse TBT, whose endpoint differs. Lighthouse TBT is reported in its separate cohort below.

### mobile cold main-thread work

Use traces to test which costs actually lie on the critical path before assigning implementation work. Cohort: pass2-load-matrix-v1; mobile/cold. Values are per-system sample medians unless labeled p75. Campaign complete.

| Implementation | Successful n | Failed n | Script ms | Style ms | Layout ms | Task ms | Layout passes | Style recalcs | Long tasks ms | Pre-FCP blocking excess ms | Post-FCP blocking excess ms | Long animation frames ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| En Reve | 10 | 0 | 78.7 | 58.1 | 31.9 | 359.6 | 8 | 11 | 275.0 | 225.0 | 0.0 | 394.9 |
| Radix React | 10 | 0 | 152.9 | 43.9 | 54.5 | 333.3 | 5 | 6 | 191.0 | 141.0 | 0.0 | 414.4 |
| Fluent React | 10 | 0 | 193.9 | 40.8 | 53.9 | 361.2 | 5 | 6 | 270.5 | 120.5 | 0.0 | 367.6 |
| Spectrum React S2 | 10 | 0 | 386.1 | 76.3 | 201.1 | 756.1 | 13 | 22 | 657.5 | 398.0 | 108.0 | 790.7 |
| Astryx React | 10 | 0 | 222.5 | 34.4 | 64.0 | 409.7 | 4 | 9 | 311.0 | 211.0 | 0.0 | 487.9 |
| shadcn React | 10 | 0 | 195.4 | 38.1 | 189.3 | 504.4 | 4 | 6 | 371.5 | 207.0 | 66.0 | 503.3 |
| Fluent Web Components | 10 | 0 | 116.4 | 42.1 | 38.6 | 277.1 | 5 | 10 | 153.5 | 103.5 | 0.0 | 297.4 |
| Spectrum Web Components | 10 | 0 | 107.9 | 71.4 | 48.7 | 421.3 | 12 | 21 | 313.0 | 263.0 | 0.0 | 435.0 |

### mobile warm main-thread work

Use traces to test which costs actually lie on the critical path before assigning implementation work. Cohort: pass2-load-matrix-v1; mobile/warm. Values are per-system sample medians unless labeled p75. Campaign complete.

| Implementation | Successful n | Failed n | Script ms | Style ms | Layout ms | Task ms | Layout passes | Style recalcs | Long tasks ms | Pre-FCP blocking excess ms | Post-FCP blocking excess ms | Long animation frames ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| En Reve | 10 | 0 | 52.1 | 40.3 | 13.3 | 223.0 | 8 | 11 | 148.5 | 98.5 | 0.0 | 151.3 |
| Radix React | 10 | 0 | 64.0 | 17.0 | 7.7 | 154.4 | 5 | 6 | 75.0 | 25.0 | 0.0 | 101.4 |
| Fluent React | 10 | 0 | 73.1 | 18.1 | 6.4 | 174.6 | 5 | 6 | 55.0 | 5.0 | 0.0 | 95.2 |
| Spectrum React S2 | 10 | 0 | 179.7 | 33.9 | 161.4 | 477.2 | 11 | 20 | 360.5 | 310.5 | 0.0 | 372.1 |
| Astryx React | 10 | 0 | 82.1 | 30.1 | 6.7 | 190.3 | 4 | 9 | 103.5 | 53.5 | 0.0 | 126.7 |
| shadcn React | 10 | 0 | 66.8 | 14.2 | 44.4 | 194.9 | 3 | 5 | 113.0 | 63.0 | 0.0 | 133.8 |
| Fluent Web Components | 10 | 0 | 57.5 | 19.3 | 9.0 | 160.2 | 5 | 10 | 70.0 | 20.0 | 0.0 | 84.8 |
| Spectrum Web Components | 10 | 0 | 55.0 | 46.2 | 13.1 | 258.8 | 12 | 21 | 162.5 | 112.5 | 0.0 | 169.0 |

### desktop cold main-thread work

Use traces to test which costs actually lie on the critical path before assigning implementation work. Cohort: pass2-load-matrix-v1; desktop/cold. Values are per-system sample medians unless labeled p75. Campaign complete.

| Implementation | Successful n | Failed n | Script ms | Style ms | Layout ms | Task ms | Layout passes | Style recalcs | Long tasks ms | Pre-FCP blocking excess ms | Post-FCP blocking excess ms | Long animation frames ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| En Reve | 10 | 0 | 15.7 | 11.6 | 6.0 | 75.1 | 8 | 10 | 53.5 | 3.5 | 0.0 | 57.0 |
| Radix React | 10 | 0 | 32.6 | 10.3 | 12.4 | 76.1 | 5 | 6 | 0.0 | 0.0 | 0.0 | 51.2 |
| Fluent React | 10 | 0 | 41.7 | 9.4 | 11.1 | 79.2 | 5 | 6 | 0.0 | 0.0 | 0.0 | 0.0 |
| Spectrum React S2 | 10 | 0 | 83.6 | 17.5 | 47.1 | 170.6 | 13 | 20 | 89.0 | 39.0 | 0.0 | 108.6 |
| Astryx React | 10 | 0 | 48.0 | 7.2 | 15.4 | 91.5 | 4 | 9 | 52.5 | 2.5 | 0.0 | 58.8 |
| shadcn React | 10 | 0 | 43.7 | 8.9 | 48.5 | 119.4 | 4 | 6 | 60.5 | 10.5 | 0.0 | 81.5 |
| Fluent Web Components | 10 | 0 | 23.7 | 9.3 | 7.8 | 60.4 | 5 | 10 | 0.0 | 0.0 | 0.0 | 0.0 |
| Spectrum Web Components | 10 | 0 | 23.1 | 16.1 | 9.9 | 94.2 | 12 | 27 | 64.0 | 14.0 | 0.0 | 66.8 |

### desktop warm main-thread work

Use traces to test which costs actually lie on the critical path before assigning implementation work. Cohort: pass2-load-matrix-v1; desktop/warm. Values are per-system sample medians unless labeled p75. Campaign complete.

| Implementation | Successful n | Failed n | Script ms | Style ms | Layout ms | Task ms | Layout passes | Style recalcs | Long tasks ms | Pre-FCP blocking excess ms | Post-FCP blocking excess ms | Long animation frames ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| En Reve | 10 | 0 | 10.6 | 8.5 | 3.1 | 49.7 | 7 | 10 | 0.0 | 0.0 | 0.0 | 0.0 |
| Radix React | 10 | 0 | 13.1 | 3.6 | 1.7 | 34.4 | 4 | 5 | 0.0 | 0.0 | 0.0 | 0.0 |
| Fluent React | 10 | 0 | 15.8 | 3.7 | 1.5 | 39.3 | 5 | 6 | 0.0 | 0.0 | 0.0 | 0.0 |
| Spectrum React S2 | 10 | 0 | 36.6 | 7.2 | 36.0 | 107.9 | 11 | 19 | 75.5 | 25.5 | 0.0 | 85.2 |
| Astryx React | 10 | 0 | 17.5 | 5.9 | 1.4 | 42.4 | 4 | 8 | 0.0 | 0.0 | 0.0 | 0.0 |
| shadcn React | 10 | 0 | 13.9 | 2.9 | 10.2 | 43.6 | 3 | 5 | 0.0 | 0.0 | 0.0 | 0.0 |
| Fluent Web Components | 10 | 0 | 11.4 | 3.7 | 2.0 | 34.0 | 4 | 9 | 0.0 | 0.0 | 0.0 | 0.0 |
| Spectrum Web Components | 10 | 0 | 11.2 | 9.7 | 2.7 | 57.7 | 11 | 27 | 0.0 | 0.0 | 0.0 | 0.0 |

### Repeated mobile Lighthouse audits

Five fresh full-Chromium audits per implementation, separate from the headless-shell load suite. Only Lighthouse applies DevTools throttling. TBT counts the blocking portion of long tasks after FCP; zero TBT does not mean no startup work. Cohort: pass2-lighthouse-v1; mobile/cold. Values are per-system sample medians unless labeled p75. Campaign complete.

| Implementation | Successful n | Failed n | FCP ms | LCP ms | LCP p75 ms | LCP max ms | TBT ms | TBT p75 ms | TBT max ms | Speed Index ms | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| En Reve | 5 | 0 | 724.8 | 724.8 | 740.5 | 763.7 | 0.0 | 0.0 | 0.0 | 589.0 | 0.000000 |
| Radix React | 5 | 0 | 741.6 | 741.6 | 750.7 | 843.6 | 0.0 | 0.0 | 0.0 | 744.0 | 0.000000 |
| Fluent React | 5 | 0 | 734.4 | 734.4 | 738.4 | 915.9 | 0.0 | 0.0 | 0.0 | 736.0 | 0.000000 |
| Spectrum React S2 | 5 | 0 | 1,059.6 | 1,378.0 | 1,385.8 | 1,399.2 | 128.6 | 134.5 | 145.3 | 1,130.0 | 0.025341 |
| Astryx React | 5 | 0 | 838.4 | 838.4 | 847.3 | 946.8 | 0.0 | 0.0 | 0.0 | 840.0 | 0.000000 |
| shadcn React | 5 | 0 | 786.9 | 786.9 | 787.5 | 864.5 | 82.2 | 107.7 | 113.5 | 804.0 | 0.000986 |
| Fluent Web Components | 5 | 0 | 582.4 | 582.4 | 586.1 | 608.7 | 0.0 | 0.0 | 0.0 | 584.0 | 0.000000 |
| Spectrum Web Components | 5 | 0 | 947.4 | 947.4 | 959.7 | 994.7 | 0.0 | 0.0 | 0.0 | 950.0 | 0.000000 |

## Interaction responsiveness

These journeys begin after load plus settling. They test first/repeated canvas changes, asset edits, dialogs, review submission and command opening. These seven reported actions do not cover every component; calendar/picker, typing and keyboard-specific performance require additional scenarios before optimizing those paths. Scripted-session INP is not field INP. First-input delay comes from the browser first-input entry for a scripted trusted input; it excludes handler and rendering time and is not a field FID sample. A failed journey contributes to failure counts and not to successful timing distributions; an empty timing cell does not mean unsupported or zero. Event Timing has a 16 ms reporting threshold and quantization. Semantic completion is observed DOM state; frame opportunity is two rAFs, not a compositor presentation timestamp.

### mobile interaction summary

rAF gaps are scheduling diagnostics; the refresh rate is not normalized into an invented dropped-frame percentage. Cohort: pass2-interactions-v1; mobile/cold. Values are per-system sample medians unless labeled p75. Campaign complete.

| Implementation | Successful n | Failed n | Scripted INP ms | Scripted INP p75 ms | First input delay ms | Journey CLS | Max scroll rAF gap ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| En Reve | 10 | 0 | 48.0 | 56.0 | 3.4 | 0.000000 | 16.8 |
| Radix React | 10 | 0 | 56.0 | 56.0 | 4.8 | 0.000000 | 16.8 |
| Fluent React | 10 | 0 | 64.0 | 64.0 | 4.8 | 0.000000 | 16.8 |
| Spectrum React S2 | 10 | 0 | 80.0 | 80.0 | 3.0 | 0.001630 | 16.8 |
| Astryx React | 10 | 0 | 56.0 | 56.0 | 4.5 | 0.000000 | 16.8 |
| shadcn React | 10 | 0 | 64.0 | 64.0 | 4.7 | 0.000986 | 16.8 |
| Fluent Web Components | 10 | 0 | 64.0 | 64.0 | 2.5 | 0.000000 | 16.8 |
| Spectrum Web Components | 0 | 10 | — | — | — | — | — |

### desktop interaction summary

rAF gaps are scheduling diagnostics; the refresh rate is not normalized into an invented dropped-frame percentage. Cohort: pass2-interactions-v1; desktop/cold. Values are per-system sample medians unless labeled p75. Campaign complete.

| Implementation | Successful n | Failed n | Scripted INP ms | Scripted INP p75 ms | First input delay ms | Journey CLS | Max scroll rAF gap ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| En Reve | 10 | 0 | 40.0 | 46.0 | 0.7 | 0.000000 | 16.8 |
| Radix React | 10 | 0 | 64.0 | 72.0 | 1.2 | 0.000000 | 50.1 |
| Fluent React | 10 | 0 | 48.0 | 48.0 | 1.2 | 0.000000 | 16.8 |
| Spectrum React S2 | 10 | 0 | 44.0 | 48.0 | 0.7 | 0.002332 | 16.8 |
| Astryx React | 10 | 0 | 44.0 | 48.0 | 1.0 | 0.000000 | 16.8 |
| shadcn React | 10 | 0 | 64.0 | 64.0 | 1.2 | 0.002616 | 16.8 |
| Fluent Web Components | 10 | 0 | 48.0 | 48.0 | 0.6 | 0.000075 | 16.8 |
| Spectrum Web Components | 10 | 0 | 40.0 | 40.0 | 0.9 | 0.000000 | 16.8 |

### mobile action details

Each row isolates one action. Sort Action to compare libraries within the same operation; compare the first and repeated operation to expose deferred work. Missing Event Timing entries remain unavailable; event-entry n shows their coverage.

| Implementation | Action | Successful n | Failed journeys | Result ms | Frame opportunity ms | Frame p75 ms | Event entries n | Input delay ms | Processing ms | Presentation ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| En Reve | First canvas change | 10 | 0 | 10.9 | 47.1 | 51.5 | 10 | 3.4 | 3.0 | 42.1 |
| Radix React | First canvas change | 10 | 0 | 15.3 | 49.4 | 51.9 | 10 | 4.8 | 1.1 | 49.1 |
| Fluent React | First canvas change | 10 | 0 | 22.1 | 56.2 | 58.6 | 10 | 4.8 | 1.5 | 50.1 |
| Spectrum React S2 | First canvas change | 10 | 0 | 33.5 | 65.9 | 73.4 | 10 | 3.0 | 4.0 | 58.1 |
| Astryx React | First canvas change | 10 | 0 | 18.8 | 55.0 | 56.8 | 10 | 4.5 | 1.5 | 49.9 |
| shadcn React | First canvas change | 10 | 0 | 16.0 | 51.8 | 53.6 | 10 | 4.7 | 2.3 | 44.6 |
| Fluent Web Components | First canvas change | 10 | 0 | 5.9 | 45.3 | 46.3 | 10 | 2.5 | 1.1 | 44.2 |
| Spectrum Web Components | First canvas change | 0 | 10 | — | — | — | 0 | — | — | — |
| En Reve | Repeated canvas change | 10 | 0 | 7.3 | 30.7 | 31.1 | 10 | 2.2 | 2.4 | 11.4 |
| Radix React | Repeated canvas change | 10 | 0 | 8.6 | 30.6 | 31.5 | 10 | 1.0 | 0.9 | 14.4 |
| Fluent React | Repeated canvas change | 10 | 0 | 10.4 | 30.5 | 30.9 | 10 | 1.0 | 1.4 | 13.9 |
| Spectrum React S2 | Repeated canvas change | 10 | 0 | 28.9 | 33.8 | 35.6 | 10 | 1.9 | 4.5 | 26.2 |
| Astryx React | Repeated canvas change | 10 | 0 | 12.1 | 30.5 | 30.8 | 10 | 1.7 | 1.0 | 13.4 |
| shadcn React | Repeated canvas change | 10 | 0 | 10.0 | 30.0 | 30.8 | 10 | 2.2 | 1.7 | 12.1 |
| Fluent Web Components | Repeated canvas change | 10 | 0 | 3.3 | 30.3 | 30.6 | 10 | 1.7 | 0.5 | 13.8 |
| Spectrum Web Components | Repeated canvas change | 0 | 10 | — | — | — | 0 | — | — | — |
| En Reve | First asset addition | 10 | 0 | 9.9 | 29.1 | 30.3 | 10 | 2.8 | 2.4 | 43.0 |
| Radix React | First asset addition | 10 | 0 | 5.1 | 30.5 | 31.3 | 10 | 2.0 | 0.8 | 21.4 |
| Fluent React | First asset addition | 10 | 0 | 8.1 | 29.5 | 30.6 | 10 | 2.2 | 0.8 | 60.5 |
| Spectrum React S2 | First asset addition | 10 | 0 | 11.3 | 30.3 | 30.7 | 10 | 1.5 | 4.4 | 58.2 |
| Astryx React | First asset addition | 10 | 0 | 7.3 | 30.2 | 30.5 | 10 | 1.8 | 1.4 | 17.0 |
| shadcn React | First asset addition | 10 | 0 | 8.5 | 30.2 | 31.0 | 10 | 2.6 | 1.6 | 60.0 |
| Fluent Web Components | First asset addition | 10 | 0 | 4.5 | 29.6 | 30.9 | 10 | 1.9 | 0.8 | 61.6 |
| Spectrum Web Components | First asset addition | 0 | 10 | — | — | — | 0 | — | — | — |
| En Reve | First dialog opening | 10 | 0 | 39.2 | 45.9 | 49.5 | 10 | 2.5 | 1.4 | 44.6 |
| Radix React | First dialog opening | 10 | 0 | 39.0 | 43.6 | 46.7 | 10 | 2.2 | 1.2 | 45.1 |
| Fluent React | First dialog opening | 10 | 0 | 24.3 | 34.9 | 35.4 | 10 | 2.4 | 0.7 | 36.5 |
| Spectrum React S2 | First dialog opening | 10 | 0 | 50.4 | 58.3 | 60.7 | 10 | 1.9 | 4.4 | 51.1 |
| Astryx React | First dialog opening | 10 | 0 | 29.4 | 34.8 | 37.1 | 10 | 1.9 | 1.2 | 37.1 |
| shadcn React | First dialog opening | 10 | 0 | 20.2 | 34.3 | 36.2 | 10 | 2.4 | 1.7 | 32.0 |
| Fluent Web Components | First dialog opening | 10 | 0 | 3.5 | 33.0 | 34.6 | 10 | 1.8 | 0.5 | 29.7 |
| Spectrum Web Components | First dialog opening | 0 | 10 | — | — | — | 0 | — | — | — |
| En Reve | Repeated dialog opening | 10 | 0 | 18.5 | 30.2 | 31.5 | 10 | 2.4 | 1.0 | 28.7 |
| Radix React | Repeated dialog opening | 10 | 0 | 29.2 | 32.5 | 35.2 | 10 | 2.1 | 1.2 | 36.9 |
| Fluent React | Repeated dialog opening | 10 | 0 | 13.8 | 30.0 | 30.5 | 10 | 2.4 | 0.8 | 21.1 |
| Spectrum React S2 | Repeated dialog opening | 10 | 0 | 35.1 | 42.5 | 45.7 | 10 | 1.4 | 4.8 | 34.8 |
| Astryx React | Repeated dialog opening | 10 | 0 | 21.5 | 31.5 | 32.2 | 10 | 1.3 | 1.3 | 29.5 |
| shadcn React | Repeated dialog opening | 10 | 0 | 11.7 | 31.0 | 31.5 | 10 | 2.5 | 1.4 | 28.3 |
| Fluent Web Components | Repeated dialog opening | 10 | 0 | 3.3 | 48.0 | 51.9 | 10 | 1.6 | 0.6 | 46.0 |
| Spectrum Web Components | Repeated dialog opening | 0 | 10 | — | — | — | 0 | — | — | — |
| En Reve | Review submission | 10 | 0 | 7.6 | 29.6 | 30.2 | 10 | 2.0 | 1.8 | 12.1 |
| Radix React | Review submission | 10 | 0 | 4.4 | 30.5 | 30.7 | 10 | 2.0 | 0.8 | 21.1 |
| Fluent React | Review submission | 10 | 0 | 4.3 | 29.0 | 29.6 | 10 | 0.8 | 1.5 | 14.0 |
| Spectrum React S2 | Review submission | 10 | 0 | 15.7 | 30.6 | 32.2 | 10 | 1.7 | 4.6 | 26.0 |
| Astryx React | Review submission | 10 | 0 | 4.5 | 29.2 | 29.5 | 10 | 1.5 | 0.9 | 28.7 |
| shadcn React | Review submission | 10 | 0 | 5.5 | 28.3 | 28.8 | 10 | 2.3 | 1.6 | 16.0 |
| Fluent Web Components | Review submission | 10 | 0 | 4.0 | 28.6 | 29.8 | 10 | 0.9 | 1.1 | 14.2 |
| Spectrum Web Components | Review submission | 0 | 10 | — | — | — | 0 | — | — | — |
| En Reve | First command opening | 10 | 0 | 23.0 | 31.4 | 34.0 | 10 | 2.4 | 1.0 | 28.5 |
| Radix React | First command opening | 10 | 0 | 31.5 | 36.4 | 37.6 | 10 | 2.8 | 0.6 | 37.0 |
| Fluent React | First command opening | 10 | 0 | 15.9 | 31.3 | 32.0 | 10 | 2.6 | 0.7 | 28.0 |
| Spectrum React S2 | First command opening | 10 | 0 | 40.1 | 48.6 | 51.9 | 10 | 1.5 | 4.4 | 42.8 |
| Astryx React | First command opening | 10 | 0 | 23.0 | 31.9 | 32.5 | 10 | 1.8 | 1.0 | 29.5 |
| shadcn React | First command opening | 10 | 0 | 11.4 | 29.8 | 30.4 | 10 | 2.5 | 1.5 | 27.6 |
| Fluent Web Components | First command opening | 10 | 0 | 3.4 | 51.9 | 52.8 | 10 | 2.1 | 0.5 | 45.7 |
| Spectrum Web Components | First command opening | 0 | 10 | — | — | — | 0 | — | — | — |

### desktop action details

Each row isolates one action. Sort Action to compare libraries within the same operation; compare the first and repeated operation to expose deferred work. Missing Event Timing entries remain unavailable; event-entry n shows their coverage.

| Implementation | Action | Successful n | Failed journeys | Result ms | Frame opportunity ms | Frame p75 ms | Event entries n | Input delay ms | Processing ms | Presentation ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| En Reve | First canvas change | 10 | 0 | 2.4 | 38.8 | 41.7 | 10 | 0.7 | 0.7 | 38.8 |
| Radix React | First canvas change | 10 | 0 | 3.4 | 40.5 | 42.5 | 10 | 1.2 | 0.2 | 46.6 |
| Fluent React | First canvas change | 10 | 0 | 5.0 | 43.6 | 44.4 | 10 | 1.2 | 0.3 | 46.5 |
| Spectrum React S2 | First canvas change | 10 | 0 | 7.4 | 42.7 | 43.6 | 10 | 0.7 | 0.8 | 42.4 |
| Astryx React | First canvas change | 10 | 0 | 4.4 | 42.2 | 44.1 | 10 | 1.0 | 0.3 | 42.7 |
| shadcn React | First canvas change | 10 | 0 | 3.5 | 39.8 | 44.1 | 10 | 1.2 | 0.5 | 38.4 |
| Fluent Web Components | First canvas change | 10 | 0 | 1.4 | 44.2 | 44.5 | 10 | 0.6 | 0.2 | 47.1 |
| Spectrum Web Components | First canvas change | 10 | 0 | 1.9 | 40.9 | 42.5 | 10 | 0.9 | 0.3 | 38.9 |
| En Reve | Repeated canvas change | 10 | 0 | 1.5 | 32.2 | 32.5 | 10 | 0.5 | 0.5 | 31.0 |
| Radix React | Repeated canvas change | 10 | 0 | 2.0 | 30.4 | 33.8 | 7 | 0.5 | 0.1 | 23.4 |
| Fluent React | Repeated canvas change | 10 | 0 | 2.5 | 31.8 | 32.2 | 10 | 0.6 | 0.2 | 15.2 |
| Spectrum React S2 | Repeated canvas change | 10 | 0 | 6.0 | 32.4 | 32.7 | 10 | 0.5 | 0.8 | 14.7 |
| Astryx React | Repeated canvas change | 10 | 0 | 2.7 | 32.0 | 32.2 | 10 | 0.4 | 0.2 | 15.3 |
| shadcn React | Repeated canvas change | 10 | 0 | 2.2 | 31.9 | 32.5 | 10 | 0.6 | 0.3 | 15.1 |
| Fluent Web Components | Repeated canvas change | 10 | 0 | 0.7 | 32.1 | 32.6 | 10 | 0.4 | 0.2 | 15.5 |
| Spectrum Web Components | Repeated canvas change | 10 | 0 | 1.3 | 31.1 | 31.5 | 10 | 0.5 | 0.2 | 15.2 |
| En Reve | First asset addition | 10 | 0 | 2.0 | 32.1 | 32.2 | 10 | 0.6 | 0.5 | 31.0 |
| Radix React | First asset addition | 10 | 0 | 1.2 | 52.5 | 53.0 | 10 | 0.5 | 0.1 | 55.4 |
| Fluent React | First asset addition | 10 | 0 | 1.8 | 31.9 | 32.3 | 10 | 0.5 | 0.2 | 31.3 |
| Spectrum React S2 | First asset addition | 10 | 0 | 2.4 | 32.0 | 32.2 | 10 | 0.3 | 0.9 | 30.8 |
| Astryx React | First asset addition | 10 | 0 | 1.5 | 32.2 | 32.4 | 10 | 0.4 | 0.2 | 15.4 |
| shadcn React | First asset addition | 10 | 0 | 1.7 | 32.1 | 32.4 | 10 | 0.5 | 0.3 | 31.3 |
| Fluent Web Components | First asset addition | 10 | 0 | 1.0 | 31.5 | 31.8 | 10 | 0.4 | 0.1 | 31.5 |
| Spectrum Web Components | First asset addition | 10 | 0 | 1.1 | 31.7 | 32.0 | 10 | 0.5 | 0.2 | 31.4 |
| En Reve | First dialog opening | 10 | 0 | 8.2 | 31.8 | 32.1 | 10 | 0.5 | 0.2 | 31.3 |
| Radix React | First dialog opening | 10 | 0 | 8.0 | 51.1 | 51.6 | 10 | 0.5 | 0.2 | 47.3 |
| Fluent React | First dialog opening | 10 | 0 | 5.2 | 31.7 | 32.1 | 10 | 0.6 | 0.1 | 31.3 |
| Spectrum React S2 | First dialog opening | 10 | 0 | 9.8 | 31.7 | 32.0 | 10 | 0.3 | 0.8 | 18.8 |
| Astryx React | First dialog opening | 10 | 0 | 6.3 | 39.1 | 40.3 | 10 | 0.5 | 0.2 | 39.4 |
| shadcn React | First dialog opening | 10 | 0 | 3.8 | 32.3 | 32.6 | 10 | 0.5 | 0.3 | 39.2 |
| Fluent Web Components | First dialog opening | 10 | 0 | 0.8 | 31.5 | 31.8 | 10 | 0.4 | 0.1 | 31.5 |
| Spectrum Web Components | First dialog opening | 10 | 0 | 1.2 | 32.0 | 32.2 | 10 | 0.5 | 0.2 | 31.3 |
| En Reve | Repeated dialog opening | 10 | 0 | 4.0 | 31.2 | 31.6 | 10 | 0.6 | 0.3 | 31.1 |
| Radix React | Repeated dialog opening | 10 | 0 | 5.9 | 50.1 | 50.9 | 10 | 0.5 | 0.2 | 47.3 |
| Fluent React | Repeated dialog opening | 10 | 0 | 3.0 | 31.5 | 31.7 | 10 | 0.6 | 0.1 | 15.3 |
| Spectrum React S2 | Repeated dialog opening | 10 | 0 | 6.7 | 32.0 | 32.2 | 10 | 0.4 | 0.9 | 14.8 |
| Astryx React | Repeated dialog opening | 10 | 0 | 4.7 | 38.4 | 39.6 | 10 | 0.4 | 0.3 | 39.3 |
| shadcn React | Repeated dialog opening | 10 | 0 | 3.0 | 31.9 | 32.1 | 10 | 0.7 | 0.4 | 39.0 |
| Fluent Web Components | Repeated dialog opening | 10 | 0 | 0.7 | 32.2 | 32.4 | 10 | 0.5 | 0.1 | 23.4 |
| Spectrum Web Components | Repeated dialog opening | 10 | 0 | 1.1 | 31.1 | 31.5 | 10 | 0.5 | 0.1 | 15.4 |
| En Reve | Review submission | 10 | 0 | 1.6 | 32.0 | 32.2 | 10 | 0.5 | 0.4 | 31.1 |
| Radix React | Review submission | 10 | 0 | 0.8 | 55.8 | 65.8 | 10 | 0.4 | 0.1 | 55.4 |
| Fluent React | Review submission | 10 | 0 | 1.1 | 31.8 | 32.0 | 10 | 0.5 | 0.2 | 15.3 |
| Spectrum React S2 | Review submission | 10 | 0 | 2.7 | 31.8 | 32.0 | 10 | 0.4 | 0.9 | 14.8 |
| Astryx React | Review submission | 10 | 0 | 1.0 | 32.0 | 32.1 | 10 | 0.4 | 0.2 | 15.4 |
| shadcn React | Review submission | 10 | 0 | 1.2 | 31.5 | 32.0 | 10 | 0.6 | 0.3 | 31.1 |
| Fluent Web Components | Review submission | 10 | 0 | 1.0 | 31.8 | 32.0 | 10 | 0.4 | 0.1 | 15.5 |
| Spectrum Web Components | Review submission | 10 | 0 | 1.3 | 31.6 | 32.0 | 10 | 0.5 | 0.2 | 15.3 |
| En Reve | First command opening | 10 | 0 | 4.9 | 31.3 | 31.7 | 10 | 0.6 | 0.2 | 31.1 |
| Radix React | First command opening | 10 | 0 | 6.1 | 49.5 | 50.1 | 10 | 0.6 | 0.1 | 47.4 |
| Fluent React | First command opening | 10 | 0 | 3.1 | 32.0 | 32.9 | 10 | 0.6 | 0.1 | 19.3 |
| Spectrum React S2 | First command opening | 10 | 0 | 7.5 | 31.8 | 32.2 | 10 | 0.4 | 0.9 | 14.9 |
| Astryx React | First command opening | 10 | 0 | 4.9 | 37.1 | 38.1 | 10 | 0.3 | 0.3 | 39.4 |
| shadcn React | First command opening | 10 | 0 | 2.4 | 32.4 | 32.6 | 10 | 0.6 | 0.3 | 39.2 |
| Fluent Web Components | First command opening | 10 | 0 | 0.8 | 31.9 | 32.2 | 10 | 0.4 | 0.1 | 23.5 |
| Spectrum Web Components | First command opening | 10 | 0 | 1.4 | 31.5 | 32.1 | 10 | 0.7 | 0.2 | 15.1 |

## Memory and lifecycle

A full-Chromium cross-origin-isolated lane with timing observers disabled repeats the native journey to 50 cycles. Each cycle submits the same review and replaces its status text; it does not append review records. The earlier narrative was incorrect. [Frozen-source interpretation correction](../showcases/performance/reports/memory-interpretation-correction-pass2.json). Node or heap growth remains unattributed until application retention, browser input/undo state, automation retention and garbage collection are separated. One session per implementation is exploratory and cannot establish a leak or a memory ranking. API timeouts/errors remain explicit. JS heap and browser DOM counters have different scopes from API memory.

### Memory after 0 cycles

Checkpoints retained even if a later journey fails. Zero cycles is after page load/settling. Campaign complete.

| Implementation | Checkpoints n | API success n | API unavailable n | API MiB | JS heap MiB | Browser DOM nodes | Event listeners | API status |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| En Reve | 1 | 0 | 1 | — | 4.85 | 7,141 | 547 | timeout |
| Radix React | 1 | 0 | 1 | — | 4.43 | 897 | 1,540 | timeout |
| Fluent React | 1 | 0 | 1 | — | 6.26 | 946 | 363 | timeout |
| Spectrum React S2 | 1 | 0 | 1 | — | 11.67 | 1,175 | 428 | timeout |
| Astryx React | 1 | 1 | 0 | 7.42 | 6.30 | 1,552 | 774 | ok |
| shadcn React | 1 | 1 | 0 | 5.82 | 5.20 | 786 | 266 | ok |
| Fluent Web Components | 1 | 0 | 1 | — | 4.24 | 4,138 | 618 | timeout |
| Spectrum Web Components | 1 | 0 | 1 | — | 6.11 | 6,187 | 903 | timeout |

### Memory after 10 cycles

Checkpoints retained even if a later journey fails. Zero cycles is after page load/settling. Campaign complete.

| Implementation | Checkpoints n | API success n | API unavailable n | API MiB | JS heap MiB | Browser DOM nodes | Event listeners | API status |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| En Reve | 1 | 1 | 0 | 5.33 | 5.02 | 6,456 | 547 | ok |
| Radix React | 1 | 1 | 0 | 6.14 | 6.27 | 932 | 1,537 | ok |
| Fluent React | 1 | 1 | 0 | 7.87 | 7.61 | 959 | 360 | ok |
| Spectrum React S2 | 1 | 1 | 0 | 12.87 | 12.26 | 1,989 | 605 | ok |
| Astryx React | 1 | 1 | 0 | 9.05 | 8.25 | 1,628 | 774 | ok |
| shadcn React | 1 | 1 | 0 | 7.09 | 7.43 | 912 | 413 | ok |
| Fluent Web Components | 1 | 1 | 0 | 3.85 | 4.39 | 4,617 | 692 | ok |
| Spectrum Web Components | 1 | 1 | 0 | 7.93 | 5.57 | 5,479 | 856 | ok |

### Memory after 50 cycles

Checkpoints retained even if a later journey fails. Zero cycles is after page load/settling. Campaign complete.

| Implementation | Checkpoints n | API success n | API unavailable n | API MiB | JS heap MiB | Browser DOM nodes | Event listeners | API status |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| En Reve | 1 | 1 | 0 | 5.46 | 5.36 | 6,496 | 547 | ok |
| Radix React | 1 | 1 | 0 | 6.71 | 6.64 | 972 | 1,537 | ok |
| Fluent React | 1 | 1 | 0 | 8.57 | 8.30 | 999 | 360 | ok |
| Spectrum React S2 | 1 | 1 | 0 | 13.86 | 13.23 | 5,189 | 925 | ok |
| Astryx React | 1 | 0 | 1 | — | 8.67 | 1,668 | 774 | timeout |
| shadcn React | 1 | 1 | 0 | 7.62 | 8.08 | 993 | 418 | ok |
| Fluent Web Components | 1 | 1 | 0 | 4.38 | 4.73 | 7,497 | 1,012 | ok |
| Spectrum Web Components | 1 | 1 | 0 | 8.08 | 5.87 | 5,519 | 856 | ok |

### Memory change from 10 to 50 cycles

Paired checkpoint changes within the same session. These are 40 additional repeated journeys with replacement status, not 40 appended review records. Garbage collection, native input state and automation can affect the counters; investigate growth with controls and heap/retainer evidence before calling it a library leak.

| Implementation | Paired API readings n | API growth MiB | JS heap growth MiB | DOM node growth | Listener growth |
| --- | ---: | ---: | ---: | ---: | ---: |
| En Reve | 1 | 0.13 | 0.34 | 40 | 0 |
| Radix React | 1 | 0.57 | 0.36 | 40 | 0 |
| Fluent React | 1 | 0.70 | 0.69 | 40 | 0 |
| Spectrum React S2 | 1 | 0.99 | 0.97 | 3,200 | 320 |
| Astryx React | 0 | — | 0.42 | 40 | 0 |
| shadcn React | 1 | 0.53 | 0.66 | 81 | 5 |
| Fluent Web Components | 1 | 0.52 | 0.35 | 2,880 | 320 |
| Spectrum Web Components | 1 | 0.15 | 0.29 | 40 | 0 |

## Supporting diagnostics

These structural and trace measurements come from the retained first-pass diagnostic cohort. They help choose experiments; they are not new primary timing measurements.

### Historical connected DOM diagnostics

One desktop diagnostic journey per implementation from the first pass, not remeasured here. Includes accessible open shadow roots; closed roots are not inspected. More nodes can reflect richer features. Adoption counts do not equal separately allocated sheets.

| Implementation | Connected nodes | Connected elements | Open shadow roots | Style elements | Stylesheet adoptions | Unique adopted sheets |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| En Reve | 4,643 | 1,578 | 167 | 0 | 593 | 32 |
| Radix React | 653 | 454 | 0 | 0 | 0 | 0 |
| Fluent React | 745 | 543 | 0 | 23 | 0 | 0 |
| Spectrum React S2 | 880 | 653 | 0 | 1 | 0 | 0 |
| Astryx React | 1,488 | 1,158 | 0 | 0 | 0 | 0 |
| shadcn React | 675 | 477 | 0 | 0 | 0 | 0 |
| Fluent Web Components | 2,889 | 1,284 | 169 | 0 | 221 | 32 |
| Spectrum Web Components | 4,474 | 1,206 | 214 | 0 | 374 | 44 |

### Historical exercised code coverage

One first-pass diagnostic journey. Counts generated characters, not UTF-8 bytes; excludes the injected collector and non-HTTP scripts. External CSS coverage does not cover all adopted or CSS-in-JS styles. Unexercised code is not necessarily removable.

| Implementation | Loaded JS characters | Exercised JS characters | Unexercised JS percent | External CSS characters | Unexercised external CSS percent |
| --- | ---: | ---: | ---: | ---: | ---: |
| En Reve | 414,400 | 305,205 | 26.4 | 40,755 | 0.5 |
| Radix React | 416,199 | 195,216 | 53.1 | 686,869 | 90.8 |
| Fluent React | 818,099 | 559,422 | 31.6 | 3,395 | 20.5 |
| Spectrum React S2 | 990,789 | 490,565 | 50.5 | 66,711 | 23.9 |
| Astryx React | 738,785 | 427,079 | 42.2 | 196,349 | 0.3 |
| shadcn React | 539,010 | 262,528 | 51.3 | 78,846 | 10.0 |
| Fluent Web Components | 287,939 | 223,304 | 22.4 | 4,300 | 12.8 |
| Spectrum Web Components | 1,225,634 | 1,012,037 | 17.4 | 3,971 | 16.8 |

### Historical rendering trace through LCP

One first-pass desktop diagnostic trace each, clipped from navigation to that trace’s LCP. Nested categories overlap; do not sum them, compare them with the new primary run as one cohort, or infer paint-to-screen latency.

| Implementation | Main-thread RunTask ms | HTML parse ms | Layout tree update ms | Layout ms | Paint ms | Script evaluation ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| En Reve | 102.3 | 2.4 | 14.4 | 6.2 | 1.5 | 5.3 |
| Radix React | 122.2 | 2.4 | 24.6 | 13.3 | 1.8 | 5.4 |
| Fluent React | 104.1 | 0.5 | 11.4 | 10.4 | 1.2 | 5.3 |
| Spectrum React S2 | 255.8 | 1.7 | 55.0 | 51.7 | 2.1 | 5.8 |
| Astryx React | 166.0 | 2.1 | 55.5 | 14.8 | 2.2 | 5.3 |
| shadcn React | 135.8 | 0.8 | 12.6 | 43.7 | 1.0 | 5.6 |
| Fluent Web Components | 80.9 | 2.6 | 10.2 | 8.5 | 1.5 | 5.7 |
| Spectrum Web Components | 141.1 | 2.2 | 17.5 | 12.0 | 1.5 | 3.8 |

### Historical back-forward cache checks

One first-pass direct-CDP desktop diagnostic per implementation. Counts verify a real same-document restoration and trusted post-return interaction; they are neither field hit rates nor measured restoration latency.

| Implementation | Attempts n | Restored n | Interactive after return n |
| --- | ---: | ---: | ---: |
| En Reve | 1 | 1 | 1 |
| Radix React | 1 | 1 | 1 |
| Fluent React | 1 | 1 | 1 |
| Spectrum React S2 | 1 | 1 | 1 |
| Astryx React | 1 | 1 | 1 |
| shadcn React | 1 | 1 | 1 |
| Fluent Web Components | 1 | 1 | 1 |
| Spectrum Web Components | 1 | 1 | 1 |

### Historical observer overhead calibration

Five first-pass paired on/off blocks for En Reve and Fluent WC. A confidence interval spanning zero does not prove no measurement cost. Startup probe elapsed time is additionally reported in the new startup tables.

| Implementation | Metric | Paired blocks n | Collector on minus off ms | 95% interval low ms | 95% interval high ms |
| --- | ---: | ---: | ---: | ---: | ---: |
| Fluent Web Components | fcp | 5 | -12.0 | -12.0 | 4.0 |
| Fluent Web Components | scriptMs | 5 | 2.5 | -3.3 | 4.1 |
| Fluent Web Components | styleMs | 5 | -0.9 | -2.2 | 2.6 |
| Fluent Web Components | layoutMs | 5 | -2.2 | -4.4 | -1.1 |
| Fluent Web Components | taskMs | 5 | 10.6 | 6.7 | 19.6 |
| En Reve | fcp | 5 | -16.0 | -44.0 | 8.0 |
| En Reve | scriptMs | 5 | 1.1 | -11.6 | 5.1 |
| En Reve | styleMs | 5 | -2.3 | -7.1 | 1.4 |
| En Reve | layoutMs | 5 | -3.0 | -5.8 | 0.0 |
| En Reve | taskMs | 5 | 8.8 | -18.8 | 25.8 |

## Comparing gaps and choosing remediation

Positive differences below mean En Reve took longer than that peer. Differences are calculated from matched blocks in the **new** cohort only. The 95% intervals are exploratory paired-block bootstrap intervals, with no multiple-comparison correction. These are signals to confirm, not automatic release failures. Feature/layout/font differences remain part of the native comparison.

### Cold mobile load LCP gaps against peers

mobile/cold. Fewer than five successful matched blocks gives an unavailable contrast. Confidence intervals do not remove workstation noise or prove a cause.

| Peer | Matched blocks n | En Reve minus peer ms | 95% interval low ms | 95% interval high ms |
| --- | ---: | ---: | ---: | ---: |
| Radix React | 10 | -36.0 | -72.0 | -4.0 |
| Fluent React | 10 | -76.0 | -108.0 | -30.0 |
| Spectrum React S2 | 10 | -762.0 | -796.0 | -718.0 |
| Astryx React | 10 | -162.0 | -188.0 | -116.0 |
| shadcn React | 10 | -86.0 | -126.0 | -44.0 |
| Fluent Web Components | 10 | 108.0 | 74.0 | 146.0 |
| Spectrum Web Components | 10 | -138.0 | -180.0 | -90.0 |

### Warm mobile load LCP gaps against peers

mobile/warm. Fewer than five successful matched blocks gives an unavailable contrast. Confidence intervals do not remove workstation noise or prove a cause.

| Peer | Matched blocks n | En Reve minus peer ms | 95% interval low ms | 95% interval high ms |
| --- | ---: | ---: | ---: | ---: |
| Radix React | 10 | 44.0 | 34.0 | 50.0 |
| Fluent React | 10 | 50.0 | 26.0 | 56.0 |
| Spectrum React S2 | 10 | -248.0 | -272.0 | -232.0 |
| Astryx React | 10 | 22.0 | 10.0 | 28.0 |
| shadcn React | 10 | 16.0 | 0.0 | 26.0 |
| Fluent Web Components | 10 | 66.0 | 60.0 | 70.0 |
| Spectrum Web Components | 10 | -18.0 | -36.0 | -12.0 |

### Cold desktop load LCP gaps against peers

desktop/cold. Fewer than five successful matched blocks gives an unavailable contrast. Confidence intervals do not remove workstation noise or prove a cause.

| Peer | Matched blocks n | En Reve minus peer ms | 95% interval low ms | 95% interval high ms |
| --- | ---: | ---: | ---: | ---: |
| Radix React | 10 | -34.0 | -36.0 | -24.0 |
| Fluent React | 10 | -10.0 | -16.0 | -4.0 |
| Spectrum React S2 | 10 | -140.0 | -164.0 | -96.0 |
| Astryx React | 10 | -26.0 | -32.0 | -20.0 |
| shadcn React | 10 | -32.0 | -52.0 | -14.0 |
| Fluent Web Components | 10 | 16.0 | 10.0 | 20.0 |
| Spectrum Web Components | 10 | -14.0 | -20.0 | -8.0 |

### Navigation to startup result gaps against peers

mobile/cold. Fewer than five successful matched blocks gives an unavailable contrast. Confidence intervals do not remove workstation noise or prove a cause.

| Peer | Matched blocks n | En Reve minus peer ms | 95% interval low ms | 95% interval high ms |
| --- | ---: | ---: | ---: | ---: |
| Radix React | 10 | -59.0 | -65.9 | -54.2 |
| Fluent React | 10 | -110.5 | -125.9 | -106.0 |
| Spectrum React S2 | 10 | -387.4 | -401.8 | -373.1 |
| Astryx React | 10 | -171.9 | -189.4 | -167.5 |
| shadcn React | 10 | -114.4 | -119.0 | -108.7 |
| Fluent Web Components | 10 | 100.6 | 81.0 | 104.8 |
| Spectrum Web Components | 10 | -142.0 | -151.5 | -129.9 |

### Scripted interaction INP gaps against peers

mobile/cold. Fewer than five successful matched blocks gives an unavailable contrast. Confidence intervals do not remove workstation noise or prove a cause.

| Peer | Matched blocks n | En Reve minus peer ms | 95% interval low ms | 95% interval high ms |
| --- | ---: | ---: | ---: | ---: |
| Radix React | 10 | -8.0 | -8.0 | 4.0 |
| Fluent React | 10 | -16.0 | -16.0 | -4.0 |
| Spectrum React S2 | 10 | -32.0 | -32.0 | -20.0 |
| Astryx React | 10 | -8.0 | -12.0 | 4.0 |
| shadcn React | 10 | -16.0 | -16.0 | -4.0 |
| Fluent Web Components | 10 | -16.0 | -16.0 | -4.0 |
| Spectrum Web Components | 0 | — | — | — |

### Mobile action frame gaps against Fluent WC and Radix

Fixed comparators across all seven actions; differences use successful matched journeys. Positive values mean En Reve took longer. Exploratory unadjusted intervals and two-rAF opportunities do not establish compositor presentation timing. Inspect the complete action table for all other libraries.

| Action | Peer | Matched blocks n | En Reve frame ms | Peer frame ms | En Reve minus peer ms | 95% interval low ms | 95% interval high ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| First canvas change | Fluent Web Components | 10 | 47.1 | 45.3 | 1.8 | 0.2 | 6.9 |
| First canvas change | Radix React | 10 | 47.1 | 49.4 | -2.3 | -5.0 | 2.9 |
| Repeated canvas change | Fluent Web Components | 10 | 30.7 | 30.3 | 0.4 | -0.5 | 1.2 |
| Repeated canvas change | Radix React | 10 | 30.7 | 30.6 | 0.1 | -1.2 | 1.1 |
| First asset addition | Fluent Web Components | 10 | 29.1 | 29.6 | -0.5 | -1.6 | 0.6 |
| First asset addition | Radix React | 10 | 29.1 | 30.5 | -1.3 | -2.1 | 0.2 |
| First dialog opening | Fluent Web Components | 10 | 45.9 | 33.0 | 12.9 | 10.5 | 17.8 |
| First dialog opening | Radix React | 10 | 45.9 | 43.6 | 2.3 | -1.3 | 7.1 |
| Repeated dialog opening | Fluent Web Components | 10 | 30.2 | 48.0 | -17.8 | -22.0 | -15.4 |
| Repeated dialog opening | Radix React | 10 | 30.2 | 32.5 | -2.3 | -5.8 | -0.3 |
| Review submission | Fluent Web Components | 10 | 29.6 | 28.6 | 1.0 | -0.5 | 2.3 |
| Review submission | Radix React | 10 | 29.6 | 30.5 | -0.9 | -1.8 | -0.1 |
| First command opening | Fluent Web Components | 10 | 31.4 | 51.9 | -20.5 | -23.0 | -8.2 |
| First command opening | Radix React | 10 | 31.4 | 36.4 | -5.0 | -7.1 | -2.3 |

### Remediation decision order

Priority is an engineering sequence, not a fabricated score. Validate the leading gap on a quiet runner, change one factor, then require both load and action receipts. Correctness failures in peer fixtures remain a separate benchmark compatibility issue.

| Priority | Engineering area | Signal to inspect | Next experiment | Acceptance condition |
| --- | ---: | ---: | ---: | ---: |
| 1 | Startup rendering and consumer state | New mobile LCP gap against Fluent WC: cold 108.0 ms, warm 66.0 ms; 10/10 matched blocks. | Isolate delayed hidden-calendar construction and smaller card state boundaries in separate candidates | Paired load improvement; early click and first calendar opening remain correct and fast |
| 2 | Interaction paths | First dialog opening: En Reve frame opportunity is 12.9 ms slower than Fluent Web Components (95% interval 10.5 to 17.8; n=10). This post-analysis candidate needs independent confirmation. | Trace only consistently slow actions; test batching repeated visibility/layout reads | Improves the affected action without worsening startup, keyboard or focus behavior |
| 3 | Delivery and cache reuse | En Reve response transfer: cold 86.6 KiB; warm 0.243 KiB. See raw/all-chunk costs separately. | Retain the stable vendor chunk across app edits; split only substantial optional features | Verified cache retention plus acceptable cold and first-use performance |
| 4 | Memory lifecycle | En Reve 10-to-50-cycle change: 0.34 MiB JS heap; 40 browser DOM nodes; 0 listeners. One session with 40 more journeys; review status is replaced, so the growth is not explained by appended records. | Run a minimal repeated-input automation control, then compare connected/detached DOM and heap retainers | Repeated sessions and controls distinguish browser/automation state, GC variation and application retention |
| 5 | Deferred command loading | Historical byte savings versus first-command semantic/frame penalty | Keep lazy command delivery an opt-in hypothesis until a larger boundary exists | Meaningful startup savings outweigh cold keyboard/first-command delay |

### Historical deferred-command tradeoff

Three corrected first-use samples per variant from the first pass. Sequential exploratory pilots, not a causal ranking. The earlier invalid pre-definition measurements are excluded. This illustrates why semantic readiness must accompany INP.

| En Reve delivery | Successful n | First command result ms | First command frame ms | Scripted INP ms |
| --- | ---: | ---: | ---: | ---: |
| Native | 3 | 26.6 | 35.8 | 56.0 |
| Lazy commands | 3 | 186.8 | 203.7 | 56.0 |
| Intent preload | 3 | 152.1 | 169.5 | 48.0 |

## Test conditions and remaining scope

The second-pass primary runner uses Apple M5 Max, 18 logical CPUs, 64 GiB RAM, Darwin 25.6.0 and Node 24.16.0 on AC power. Primary timing uses Chromium headless shell; Lighthouse and memory use full bundled Chromium. The primary mobile profile is a constrained narrow desktop-Chromium viewport with trusted mouse input, not a touch-device or mobile-user-agent simulation. Lighthouse separately uses its mobile form factor. Browser versions and exact host/protocol details are retained in each manifest. The earlier reference was taken on battery, so the overlap table does not isolate a software effect.

| Profile | CPU multiplier | Configured latency ms | Download Mbps | Upload Mbps | Viewport | DPR |
| --- | ---: | ---: | ---: | ---: | --- | ---: |
| Mobile | 4 | 100 | 8 | 2 | 390 × 844 | 1 |
| Desktop | 1 | 0 | — | — | 1500 × 1100 | 1 |

Desktop bandwidth is unthrottled. The [delivery calibration](../showcases/performance/reports/delivery-calibration-pass2.json) measured a 1 MB fetch at 1,111.6 ms mobile versus 4.5 ms desktop, and a 1 KiB fetch at 109.3 versus 1.9 ms. The short fixed-work CPU loop measured 13.0 versus 4.1 ms (about 3.2× observed for a 4× configured slowdown). Navigation response-start remained about 17–20 ms while body completion reflected throttling; do not interpret local TTFB as remote RTT. These checks demonstrate applied throttling, not equivalence to physical mobile hardware.

Still outstanding: supported SSR/hydration fixtures (including meaningful HTML, hydration bytes and pre-hydration input), physical-device and deployed-backend cohorts, full reference-size confirmation on a quiet dedicated runner, multiple long memory sessions with cleanup/retainer analysis, and current-source qualification separate from the frozen native baseline. No field FID/INP or release baseline is inferred from these local scripts. Historical experiment and diagnostic tables below retain their own sample sizes and limitations.
