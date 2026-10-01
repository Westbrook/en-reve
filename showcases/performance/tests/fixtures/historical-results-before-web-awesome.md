# Native showcase performance: results and engineering backlog

The isolated laboratory is implemented in [showcases/performance](../showcases/performance/README.md). It measures all eight frozen native showcases, preserves failed samples, and supports separate load, interaction, diagnostic, memory, Lighthouse, back/forward-cache and instrumentation-overhead runs. Profiling dependencies are confined to this sub-project; none were added to the root application.

This is an exploratory developer-workstation baseline. It is useful for selecting engineering work; it is not a certified device benchmark, field Web Vitals result or universal library ranking. In the first 30-sample mobile-cold campaign, En Reve’s clearest observed deficit was startup against Fluent Web Components: **604 ms versus 504 ms median LCP**, with a paired-block median difference of **+100 ms (95% bootstrap interval +90 to +104 ms)** over 30 samples per implementation. Native layout and font differences remain part of this comparison.

<!-- BEGIN SECOND PASS -->

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

<!-- END SECOND PASS -->

## Reproduce and inspect

- [Protocol and scope](native-showcase-performance-plan.md)
- [Laboratory setup, commands and limitations](../showcases/performance/README.md)
- [Consumer performance guide](../showcases/performance/CONSUMER-GUIDE.md)
- [Production bundle inventory](../showcases/performance/reports/bundles.md)
- [Immutable exploratory anchor](../showcases/performance/baselines/exploratory-mobile-cold-2026-09-20/baseline.json)
- [Reference distributions and comparisons](../showcases/performance/baselines/exploratory-mobile-cold-2026-09-20/summary.json)
- [Campaign coverage and retained failures](../showcases/performance/reports/evidence-ledger.json)
- [Delivery experiment medians](../showcases/performance/reports/experiment-comparison.md)
- [Current-source build failure](../showcases/performance/reports/current-source-build.json)

Raw campaigns are retained locally in `showcases/performance/runs/<immutable-id>/`; large run directories are Git-ignored. Each includes manifests, source and artifact hashes, the injected collector, native entries, individual failures and the analysis report. The CI template archives these plus the measured artifacts and candidate tarballs. The baseline directory retains the 240 raw reference samples, collector and original harness independently of the ignored run directory. Final harness refinements changed its hash; a fresh overlap campaign and explicit promotion are required before the current harness can use that historical timing anchor.

## First reference comparison

All numbers below use the frozen default native CSR implementation, Chromium headless shell 153.0.8010.12, 390 × 844 viewport, fourfold CPU throttling, 100 ms CDP network latency and 8 Mbps download. The host was an Apple M5 Max (18 logical CPUs, 64 GiB RAM, macOS/Darwin 25.6.0), running on battery during the reference campaign. Every sample uses a fresh browser process/profile. Thirty randomized interleaved blocks completed without failures. HTTPS/HTTP2 and identical compression/cache policies are served locally. Network emulation does not reproduce a remote backend's response-start timing or a physical phone.

| Implementation | Initial JS Brotli KiB | All JS Brotli KiB | External CSS Brotli KiB | Median LCP ms | Lab p75 LCP ms |
| --- | ---: | ---: | ---: | ---: | ---: |
| En Reve | 80.4 | 80.4 | 5.6 | 604 | 618 |
| Radix React | 102.9 | 102.9 | 49.0 | 656 | 666 |
| Fluent React | 170.8 | 170.8 | 1.0 | 684 | 699 |
| Spectrum React S2 | 216.3 | 216.3 | 11.3 | 1,380 | 1,413 |
| Astryx React | 174.0 | 174.2 | 26.5 | 770 | 784 |
| shadcn React | 138.6 | 138.6 | 10.8 | 702 | 708 |
| Fluent Web Components | 57.1 | 57.1 | 1.2 | 504 | 519 |
| Spectrum Web Components | 156.3 | 170.5 | 1.1 | 740 | 754 |

Initial JS means static HTML/preload/import reachability; runtime dynamic loads are recorded separately. All-JS includes every emitted chunk. CSS inside JavaScript remains in the JS totals. shadcn also emits approximately 68.1 KiB of local compressed fonts; Spectrum React requests a native remote Typekit font (approximately 483 KB observed). Remote fonts are not counted as free, nor removed to improve that implementation's result. Spectrum Web Components emits 18 JS files and nine dynamic import edges; its full emitted JS is not all initial transfer.

En Reve's smaller script time does not explain away its startup gap. In this cohort its median accumulated script time was 73.3 ms versus Fluent WC's 113.7 ms, while style time was 55.5 versus 40.2 ms. These CDP totals cover the bounded sample, rather than isolating the LCP critical path. Source traces and DOM diagnostics below identify hypotheses; they do not establish causality by themselves.

The broad five-block load pilot covered both viewport/CPU profiles and cold/warm cache states: **160/160 successful samples**. Its warm mobile medians were 276 ms for En Reve and 208 ms for Fluent WC; with five samples, this is a follow-up signal rather than a second reference baseline. Desktop and warm-cache reference-size campaigns remain commands in the harness, not inferred results.

## Rendering and interaction evidence

Eight diagnostic desktop journeys completed with timeline/CPU traces, source-mapped sampled functions, coverage and connected DOM counts. Diagnostic timings are excluded from primary distributions. Category durations may overlap and must not be added together.

| Connected structure after the journey | En Reve | Fluent WC | Spectrum WC |
| --- | ---: | ---: | ---: |
| DOM nodes, including open shadow roots | 4,643 | 2,889 | 4,474 |
| Elements | 1,578 | 1,284 | 1,206 |
| Shadow roots | 167 | 169 | 214 |
| Stylesheet adoptions | 593 | 221 | 374 |
| Unique adopted sheets | 32 | 32 | 44 |

En Reve already shares stylesheet objects. The adoption count is not evidence of one duplicate stylesheet allocation per component. Browser-wide CDP node counters include other documents/detached objects and are retained separately from this connected-tree census.

Catalogues differ: several peer fixtures use the browser's native date input where En Reve instantiates its custom calendar. The [capability ledger](../showcases/COVERAGE.md) records those substitutions. DOM and timing differences therefore include delivered feature choices as well as runtime efficiency.

Candidate areas from the En Reve trace:

- The eagerly instantiated hidden calendar includes 42 day controls and related native elements. Test delayed calendar content creation or a visibility-aware boundary while preserving focus, date semantics and first-open latency.
- Menu `available` and toolbar `isDisabled` sample stacks include `getClientRects` and computed-style visibility reads. Test batching visibility reads within an update and reducing repeated work without caching stale visibility or breaking keyboard navigation.
- Dialog `syncDialog` is prominent across repeated actions. Its native modal/focus work is required behavior; investigate redundant calls before changing it.
- The showcase uses one signal-backed parent for the full 16-card template. Test smaller application-state boundaries independently of library changes; the React and WC fixtures have different state ownership.
- Calendar formatting appears in sampled stacks. Test whether a bounded locale/options formatter cache reduces repeated construction before introducing a shared cache.

These are source-attributed hypotheses, not claims of proven leaks or implementation defects. Approximately 26% of En Reve JS was unexercised in the diagnostic journey; coverage is a clue for workload boundaries, not permission to delete that code.

The initial interaction qualification passed 15/16 profile/system cases. The expanded constrained-mobile pilot completed 40 samples: 35 successful journeys and five Spectrum WC failures. Successful scripted-session INP medians were 48 ms for En Reve and Radix, 56 ms for Astryx, 64 ms for shadcn and both Fluent implementations, and 80 ms for Spectrum React. These five-sample, bounded journeys do not establish field INP or a universal ordering. Spectrum WC's constrained-mobile repeated canvas action after closing its overlay failed in multiple attempts. An instrumented reproduction traced `preventDefault` and `stopImmediatePropagation` to the lazily loaded focus-trap module on the next trusted Landscape click, after the overlay reported closed. The follow-up recorded the close click at 2,809.9 ms and the focus-trap resource finishing at 2,863.2 ms; the closed overlay still had an active trap. The native source activates that trap after the awaited import. This isolates a close-during-import race in the native overlay lifecycle. The root fix remains unresolved; this is not silently worked around with an extra warm-up or a dropped action. Functional qualification of all native pages passed 176 checks in Chromium and 176 in Firefox 155.0. WebKit 26.6 passed 174/176, with the teammate-invitation option failing to become clickable in both Spectrum implementations. Those are unresolved compatibility/adapter failures, not successful Safari qualification; En Reve passed all 22 checks in each engine. A failed timed journey cannot be turned into an unsupported zero or silently omitted competitor.

The first lazy/intent command readiness readings were invalidated when qualification found that an undefined custom element could be accepted before registration. A browser calibration now requires the deferred definition before reporting semantic readiness. Raw failed measurements and the [invalidation receipt](../showcases/performance/reports/invalidated-metrics.json) are retained.

## First-pass delivery experiments

Each experiment uses the existing isolated En Reve native build stack and has its own exact artifact fingerprint and functional receipt. None replaces the native reference entry.

| Experiment | Measured delivery fact | Interpretation |
| --- | --- | --- |
| Vendor split | 83,017 total JS Brotli bytes versus 82,291 native; stable vendor chunk is 75,369 bytes across an application-only edit | Test deployment-cache retention; separate eager files do not defer execution. |
| Lazy command definitions | 81,311 initial JS bytes; 3,060 deferred bytes; 84,371 eventual bytes | Only 980 initial bytes saved. The first command activation pays the deferred work. |
| Intent command preload | 81,220 initial bytes; 3,058 deferred bytes | Pointer/focus intent can move the wait, but does not eliminate transfer or the cold keyboard path. |
| Content visibility | Same component definitions; lower cards use `content-visibility:auto` with reserved intrinsic size | Tests browser rendering containment, not delayed construction. Scroll, CLS, reveal and focus are acceptance criteria. |

Import-only family builds also quantify shell, button, form, overlay and date adoption. Their sizes include shared dependencies; they are not marginal costs that can simply be subtracted from a full application. [Exact experiment inventory](../showcases/performance/reports/en-reve-experiments.json).

The five-sample load pilots produced cold LCP medians of 616 ms (vendor), 576 ms (lazy commands), 596 ms (intent preload), and 560 ms (containment), with native controls at 600 ms before and after. Warm control medians shifted from 280 to 264 ms, and individual cold samples moved substantially. These sequential pilots justify follow-up; they do not establish a causal improvement. Detailed medians and failures are in the experiment comparison linked above.

After the readiness fix and browser calibration, three successful first-use samples per variant gave command semantic/frame-opportunity medians of **26.6/35.8 ms native**, **186.8/203.7 ms lazy**, and **152.1/169.5 ms with immediate pointer intent**. Scripted-session INP medians remained 56, 56 and 48 ms respectively. This shows why asynchronous result readiness must accompany INP: a deferred network wait can be material without becoming a long input handler. These are sequential small pilots, not confirmed population effects. Cold keyboard activation and revealing all sixteen cards passed; a real application-only deployment edit also retained the vendor chunk through a browser cache hit. The evidence does not support making command-level lazy loading the default for this fixture.

The randomized observer on/off pilot completed 20 samples across En Reve and Fluent WC. It found no detectable FCP slowdown: observed medians with/without the collector were 560/576 ms and 476/488 ms respectively. Five samples per cell do not prove zero overhead. The memory lane subsequently disables the accumulating collector entirely so retained metric arrays cannot be mistaken for application memory growth.

## First-pass memory, lifecycle and audit limits

The memory lane uses a separate cross-origin-isolated HTTPS origin. The first headless-shell pilot completed all eight repeated lifecycle scenarios, but the memory API reported unavailable. Those samples contain CDP JS heap/DOM diagnostics only. Full bundled Chromium enabled the API in an En Reve qualification, with a 15-second timeout at checkpoint zero and a successful result after ten cycles. The full-panel follow-up disables the timing collector and records real API readings where available, including explicit initial timeouts. Correction after inspecting the frozen source: review submission replaces a status string rather than appending records. The prior explanation of expected review-list growth was incorrect; the memory observations remain retained and their causes require controls and retainer analysis. Neither incomplete checkpoint coverage nor a single reading supports a leak ranking. API memory, JS heap and connected DOM have different scopes.

The full Chromium pilot completed all eight ten-cycle journeys. Successful API readings after ten cycles were 5.58 MB for En Reve, 4.05 MB for Fluent WC, 5.94 MB for Radix, 7.44 MB for shadcn, 8.28 MB for Fluent React, 8.32 MB for Spectrum WC, 8.88 MB for Astryx and 13.43 MB for Spectrum React (decimal MB, one session each). Four initial checkpoints timed out. These are scope-specific observations with different native DOM/features, not a statistically established memory ordering.

Lighthouse ran independently with its own single throttling configuration and retained eight HTML/JSON audits. These one-run audits are diagnostic only. Spectrum React's single audit reported 8.9 s FCP/LCP with approximately 8.9 s of element render delay, unlike its 30-sample native load distribution. Its font requests completed around 1.24 s, so the remaining delay cannot be attributed to font download alone. Three fresh confirmation audits returned LCP values from 1,375 to 1,535 ms (median 1,398 ms). The original 8.9 s sample remains retained as an unexplained outlier; a single audit score is not a stable competitive result. The laboratory does not combine Lighthouse scores, memory and timings into an overall winner.

The replacement BFCache diagnostic completed **8/8 real restorations**, confirmed the same document and `pageshow.persisted`, and successfully changed the canvas through trusted input after return. The failed first attempt is retained as a Playwright lifecycle-wait failure. [Playwright documents this BFCache limitation](https://playwright.dev/docs/navigations); the replacement uses direct CDP navigation and input. These are local diagnostic successes, not a field cache hit rate.

## First-pass engineering hypotheses

Owners below are suggested engineering areas, not assigned people or approved tickets.

| Priority / owner area | Evidence and next experiment | Acceptance evidence |
| --- | --- | --- |
| P1 — Elements rendering | Reproduce the +100 ms cold-mobile gap against Fluent WC; isolate hidden-calendar creation and stylesheet/adoption/rendering work. | Same native geometry/content; 30 paired samples plus independent confirmation, first-open action, keyboard/focus and CLS checks. |
| P1 — Consumer integration | Split the showcase's parent state boundary and compare only affected card updates. | Lower semantic-result/render cost with unchanged successful outcomes; no startup or other-action regression. |
| P2 — Interaction primitives | Reduce repeated menu/toolbar layout reads using trace-backed batching. | Focused visibility-change, keyboard and interaction tests; trace confirms fewer reads; first/repeated event and semantic timing both retained. |
| P2 — Delivery documentation | Use vendor splitting when deployment churn justifies preserving the stable chunk. | Browser confirms stable chunk cache hit after a real app edit; cold load/request cost remains acceptable. |
| P2 — Calendar | Evaluate bounded formatter reuse and optional content mounting. | Locale correctness and cleanup, repeated construction benchmark, cold first-use timing. |
| P1 — Regression infrastructure | Establish a quiet dedicated runner and a buildable current-source candidate. | Clean native build, full functional receipt, protocol overlap, deliberate anchor promotion; no use of workstation numbers as a release gate. |
| P2 — Benchmark compatibility | Resolve the Spectrum WC constrained-mobile overlay sequence. | Successful repeated trusted input with native lifecycle evidence; keep earlier failures. |

## First-pass verification ledger

| Check | Recorded outcome |
| --- | --- |
| Statistical/analysis unit tests | 12/12 passed |
| Native functional checks | Chromium 176/176; Firefox 176/176; WebKit 174/176; En Reve 22/22 in each engine |
| Four consumer variants | 88/88 functional checks; cold keyboard/reveal checks and actual vendor cache reuse passed |
| Collector calibration | Known 60 ms work, native entries, LCP attribution, real hide finalization and deferred-definition readiness passed |
| Native load evidence | 160/160 broad pilot samples; 240/240 mobile-cold reference samples |
| Consumer load experiments | 60/60 samples, including before/after native controls; exploratory sequential comparisons |
| Expanded native interaction pilot | 35/40 successful; all five constrained Spectrum WC overlay sequences failed |
| Corrected first-use experiments | 9/9 native/lazy/intent journeys passed; earlier invalid readiness cells retained and excluded |
| Observer overhead | 20/20 samples; five paired on/off blocks per system |
| Desktop source diagnostics | 8/8 journeys with CPU/timeline, coverage, DOM and font evidence |
| Full Chromium memory pilot | 8/8 ten-cycle journeys; 12 successful API checkpoints and four initial timeouts |
| Lighthouse | Eight panel audits plus three Spectrum confirmation audits retained; not a score ranking |
| Direct-CDP BFCache | 8/8 restored and interactive after return; original automation timeouts retained |
| Regression checker | Anchor self-comparison passed; current-source build rejected with retained TypeScript error |

## Recurrence and completion boundaries

The versioned registry, immutable run IDs, randomized blocks, artifact hashes, statistical reports, explicit baseline promotion and CI lane template provide the repeatable system. Timing regressions require matching host/browser/protocol, adequate samples and a confidence interval beyond a practical margin; deterministic bundle growth is checked separately. Baselines never advance automatically. A changed harness requires an overlap study and an explicitly chosen new epoch.

The current-source consumer builder was exercised. Tokens, styles and primitives built; elements failed because the current `EnQueryBuilder.remove` signature conflicts with the inherited DOM method. The failure is retained, no candidate was timed, and unrelated library work was not altered to conceal it. This prevents claiming end-to-end current-source qualification until that source build is corrected.

The dedicated runner, CI schedule, physical devices and field telemetry have not been provisioned. The local implementation supplies commands and an installable CI template; no background job or telemetry destination was created. Physical Android, shipped Safari, deployment/CDN response behavior, supported SSR/hydration, consumer soft-navigation routes and field p75 need their own environments and fixtures. The static showcase does not establish image-heavy, virtualized-list or worker-heavy application performance.

Remaining reference-size desktop/warm, interaction, long-session memory and device cohorts stay explicit follow-up work. No optimization in this pass is promoted into the library on a small pilot or a diagnostic trace alone.

<!-- BEGIN DOM REVIEW -->
## Connected DOM review

This focused review compares the same eight frozen production showcases and proposes future changes. **No component optimization has been implemented.** The initial and post-journey desktop census was repeated three times per implementation; all reported node-type totals reproduced exactly. Custom date opening/closing used three separate fresh sessions per custom system. A single narrow-viewport visit per system checks responsive structure. This is connected-tree attribution, not a new timing campaign or a heap/leak comparison.

### Findings and recommended order

- **The custom date field accounts for 623 En Reve nodes and 181 elements at initial load** (13.4% and 11.5% of its totals). Its eager calendar is real delivered functionality, and remains a valid efficiency target. Astryx also eagerly mounts a custom calendar; Spectrum React mounts its custom popup on demand.
- **Without the complete date field, En Reve has 4,019 nodes and 1,397 elements.** Spectrum Web Components has 4,469 nodes and 1,204 elements. En Reve is therefore not the largest all-node tree once date costs are separated, but still has the most elements in this panel.
- **Against Fluent WC without dates, the gap is 1,160 nodes but 125 elements** (40.6% and 9.8%). Of that node difference, 756 are comments and 244 are whitespace-only text nodes: together 86.2% of the gap. This explains the count; it does not establish their CPU, layout or memory cost.
- **Base wrappers are a focused cleanup opportunity, not the dominant explanation.** En Reve has 55 connected base parts, including 19 actual SVG viewports. Only 36 are non-SVG elements; 35 remain after date exclusion. Removing every non-date non-SVG base would save about 2.5% of non-date elements, and several carry semantics or behavior that must remain. Card and badge provide 21 comparatively simple host-surface prototype instances: those 21 elements equal 16.8% of the 125-element non-date gap to Fluent WC, so the narrower opportunity is still meaningful. This is a candidate count, not a demonstrated saving.
- Prioritize **optional calendar mounting and renderer/scaffolding attribution**, then **high-frequency host-surface prototypes** and **button/field slot structure**. Keep plain node reductions separate from demonstrated user-experience improvements.

### Census scope and reproducibility

Counts include the document, its element/text/comment children, and accessible open shadow roots. Each node is visited once; assigned slot content is not traversed twice. Shadow roots are counted as nodes. The document and doctype account for the two “other” nodes. Disconnected template contents, detached nodes, closed roots and browser/OS date-picker internals are excluded. Native date pickers have unavailable internal counts, not zero implementation cost.

“Without date” is **arithmetic exclusion of the complete owned field subtree in the same snapshot**, including label, input, trigger, helper structure, calendar and date-owned portals. It is not a rebuilt application with its date imports or state removed and predicts no bundle/timing savings. Shared global infrastructure is retained. All controls retain their native fixture configuration; capability differences remain explicit in the [coverage ledger](../showcases/COVERAGE.md).

Desktop: 1500 × 1100, DPR 1; narrow: 390 × 844, DPR 1, desktop/fine pointer. Chromium 153.0.8010.12, no CPU or network throttling. Fresh browser contexts, 1.5 s initial settling plus fonts readiness; 0.7 s settling after actions. Counts are diagnostics: computed-style reads used to describe base surfaces are not timing measurements. Full collector and artifact identities, exact boundaries, successful snapshots and calibration are retained in the [census evidence](../showcases/performance/reports/dom-review/census.json), [manifest](../showcases/performance/reports/dom-review/manifest.json) and [verification receipt](../showcases/performance/reports/dom-review/verification.json), and [reviewed-source archive receipt](../showcases/performance/reports/dom-review/evidence-receipt.json).

The synthetic collector control checks a 20-node tree, a three-node date field, one open shadow root, a slotted light child counted once, and disconnected template content excluded. Qualification corrected a synthetic hand-count expectation, a Spectrum dynamic-sibling selector, and its separately rendered hidden date-input sibling before this cohort; those qualification attempts remain under their original run IDs and are not pooled here. Date boundaries use the labelled complete field, not child position or copied React-generated IDs.

### Initial connected DOM with and without dates

Three independent fresh desktop contexts per implementation; exact counts in each repetition. Date elements/nodes are subsets of the full totals.

| Implementation | Samples n | Full nodes | Date nodes | Without date nodes | Full elements | Date elements | Without date elements |
| --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | 3 | 4,642 | 623 | 4,019 | 1,578 | 181 | 1,397 |
| Radix React | 3 | 651 | 5 | 646 | 454 | 4 | 450 |
| Fluent React | 3 | 742 | 5 | 737 | 542 | 4 | 538 |
| Spectrum React S2 | 3 | 878 | 29 | 849 | 653 | 23 | 630 |
| Astryx React | 3 | 1,486 | 193 | 1,293 | 1,158 | 141 | 1,017 |
| shadcn React | 3 | 673 | 4 | 669 | 477 | 3 | 474 |
| Fluent Web Components | 3 | 2,887 | 28 | 2,859 | 1,284 | 12 | 1,272 |
| Spectrum Web Components | 3 | 4,472 | 3 | 4,469 | 1,206 | 2 | 1,204 |

### Node types excluding date fields

Whitespace text is a subset of text, so those columns must not be added together. Slots and SVG elements are subsets of elements. Maximum depth counts physical parent steps from the document, including shadow-root boundaries; it is not layout-tree depth. Comments are renderer/bookkeeping structure, not automatically disposable content; deleting live Lit markers can break updates or hydration.

| Implementation | Elements | Text nodes | Whitespace text | Comments | Open shadow roots | Other nodes | Slots | SVG elements | Maximum depth |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | 1,397 | 1,708 | 1,429 | 756 | 156 | 2 | 391 | 39 | 22 |
| Radix React | 450 | 194 | 3 | 0 | 0 | 2 | 0 | 18 | 19 |
| Fluent React | 538 | 197 | 3 | 0 | 0 | 2 | 0 | 50 | 18 |
| Spectrum React S2 | 630 | 217 | 11 | 0 | 0 | 2 | 0 | 40 | 20 |
| Astryx React | 1,017 | 274 | 8 | 0 | 0 | 2 | 0 | 43 | 23 |
| shadcn React | 474 | 193 | 3 | 0 | 0 | 2 | 0 | 26 | 19 |
| Fluent Web Components | 1,272 | 1,418 | 1,185 | 0 | 167 | 2 | 451 | 128 | 18 |
| Spectrum Web Components | 1,204 | 2,072 | 1,834 | 977 | 214 | 2 | 382 | 38 | 22 |

### Whole-tree node-type breakdown

This decomposition keeps the complete custom date capability included.

| Implementation | Elements | Text nodes | Whitespace text | Comments | Open shadow roots | Other nodes | Slots | Maximum depth |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | 1,578 | 1,843 | 1,506 | 1,052 | 167 | 2 | 414 | 27 |
| Radix React | 454 | 195 | 3 | 0 | 0 | 2 | 0 | 19 |
| Fluent React | 542 | 198 | 3 | 0 | 0 | 2 | 0 | 18 |
| Spectrum React S2 | 653 | 223 | 11 | 0 | 0 | 2 | 0 | 20 |
| Astryx React | 1,158 | 326 | 8 | 0 | 0 | 2 | 0 | 26 |
| shadcn React | 477 | 194 | 3 | 0 | 0 | 2 | 0 | 19 |
| Fluent Web Components | 1,284 | 1,432 | 1,198 | 0 | 169 | 2 | 457 | 18 |
| Spectrum Web Components | 1,206 | 2,073 | 1,834 | 977 | 214 | 2 | 382 | 22 |

### Connected DOM after the standard journey

The existing two-repeat canvas, asset, dialog, review and command journey completed in all 24 desktop sessions. Date calendars are exercised separately below. These connected counts reproduce the earlier post-journey census; they are not CDP browser-wide node counters.

| Implementation | Successful journeys | Full nodes | Full elements | Without date nodes | Without date elements | Node change from initial | Element change from initial |
| --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | 3 | 4,643 | 1,578 | 4,020 | 1,397 | 1 | 0 |
| Radix React | 3 | 653 | 454 | 648 | 450 | 2 | 0 |
| Fluent React | 3 | 745 | 543 | 740 | 539 | 3 | 1 |
| Spectrum React S2 | 3 | 880 | 653 | 851 | 630 | 2 | 0 |
| Astryx React | 3 | 1,488 | 1,158 | 1,295 | 1,017 | 2 | 0 |
| shadcn React | 3 | 675 | 477 | 671 | 474 | 2 | 0 |
| Fluent Web Components | 3 | 2,889 | 1,284 | 2,861 | 1,272 | 2 | 0 |
| Spectrum Web Components | 3 | 4,474 | 1,206 | 4,471 | 1,204 | 2 | 0 |

### Narrow viewport structure check

One initial visit each, with a narrow desktop pointer environment. This checks responsive author DOM; it is not a physical phone or native touch-picker measurement.

| Implementation | Full nodes | Full elements | Without date nodes | Without date elements | Node change from desktop | Element change from desktop |
| --- | --- | --- | --- | --- | --- | --- |
| En Reve | 4,642 | 1,578 | 4,019 | 1,397 | 0 | 0 |
| Radix React | 651 | 454 | 646 | 450 | 0 | 0 |
| Fluent React | 742 | 542 | 737 | 538 | 0 | 0 |
| Spectrum React S2 | 878 | 653 | 849 | 630 | 0 | 0 |
| Astryx React | 1,486 | 1,158 | 1,293 | 1,017 | 0 | 0 |
| shadcn React | 673 | 477 | 669 | 474 | 0 | 0 |
| Fluent Web Components | 2,887 | 1,284 | 2,859 | 1,272 | 0 | 0 |
| Spectrum Web Components | 4,472 | 1,206 | 4,469 | 1,204 | 0 | 0 |

### Custom date lifecycle and whole-page totals

Three fresh sessions per custom system. Open is verified by a visible date grid, then Escape closes it. En Reve has 296 comments in its date field (47.5% of its 623 nodes); while open it has fewer elements than Spectrum React (181 versus 280), despite more total nodes. Spectrum date attribution includes its hidden native-input sibling; portal ownership includes its underlay and focus-scope boundaries. Astryx and En Reve keep their date content beneath the field. Five native-date variants are represented in the initial comparison; no zero-valued browser-popup measurement is invented.

| Implementation | State | Samples n | Full nodes | Full elements | Date nodes | Date elements | Without date nodes | Without date elements |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | initial | 3 | 4,642 | 1,578 | 623 | 181 | 4,019 | 1,397 |
| En Reve | date-open | 3 | 4,642 | 1,578 | 623 | 181 | 4,019 | 1,397 |
| En Reve | date-closed | 3 | 4,642 | 1,578 | 623 | 181 | 4,019 | 1,397 |
| Astryx React | initial | 3 | 1,486 | 1,158 | 193 | 141 | 1,293 | 1,017 |
| Astryx React | date-open | 3 | 1,486 | 1,158 | 193 | 141 | 1,293 | 1,017 |
| Astryx React | date-closed | 3 | 1,486 | 1,158 | 193 | 141 | 1,293 | 1,017 |
| Spectrum React S2 | initial | 3 | 878 | 653 | 29 | 23 | 849 | 630 |
| Spectrum React S2 | date-open | 3 | 1,179 | 910 | 330 | 280 | 849 | 630 |
| Spectrum React S2 | date-closed | 3 | 878 | 653 | 29 | 23 | 849 | 630 |

### En Reve date composition

One supplementary fresh initial snapshot partitions the entire 623-node field without overlap. Calendar navigation button/icon subtrees are separated from the grid/calendar owner. The overlay shell includes its other nested controls; these buckets describe this implementation’s composition.

| Date region | Nodes | Elements | Text | Whitespace text | Comments | Open shadow roots | Slots | Base parts |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| field-shell | 62 | 22 | 19 | 16 | 18 | 3 | 6 | 1 |
| overlay-shell | 64 | 20 | 28 | 26 | 13 | 3 | 7 | 1 |
| calendar | 431 | 113 | 62 | 11 | 255 | 1 | 0 | 1 |
| calendar-navigation-button | 50 | 20 | 22 | 20 | 6 | 2 | 10 | 0 |
| calendar-navigation-icon | 16 | 6 | 4 | 4 | 4 | 2 | 0 | 2 |

In this existing tree, calendar plus navigation totals **497 nodes / 139 elements**, and the overlay-shell bucket adds **64 nodes / 20 elements**. These locate possible mounting boundaries; the actual savings after adding lazy-state logic must be measured in a prototype.

The calendar has native table cells and native day buttons, not a custom-element button per day. Keep the 42-day model and keyboard contract separate from template overhead. Investigate optional mounting; specialize single-date rendering to avoid unused range-mode template structure; audit weekday decoration and shared field/dialog scaffolding. A variable five/six-week mode changes the stable-height contract and is a separate product decision. [Full date audit, eight investigations and acceptance criteria](../showcases/performance/reports/dom-review/date-dom-audit.md).

### Card-level connected nodes excluding dates

Physical card ancestry, not equivalent component cost. Body portals and shared infrastructure appear in “outside-cards”; some En Reve dialogs remain under their originating card. Interpret Actions together with outside-cards and the whole-page lifecycle totals. Each column is one implementation’s contribution; rows partition its whole non-date tree.

| Card | En Reve | Radix React | Fluent React | Spectrum React S2 | Astryx React | shadcn React | Fluent Web Components | Spectrum Web Components |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| outside-cards | 70 | 30 | 54 | 34 | 59 | 29 | 480 | 899 |
| showcase-actions | 631 | 52 | 55 | 65 | 158 | 51 | 304 | 465 |
| showcase-navigation | 133 | 35 | 41 | 37 | 53 | 43 | 82 | 82 |
| showcase-brief | 235 | 36 | 38 | 57 | 67 | 36 | 139 | 205 |
| showcase-brand | 175 | 36 | 38 | 40 | 39 | 38 | 56 | 112 |
| showcase-activity | 317 | 108 | 103 | 103 | 115 | 99 | 207 | 163 |
| showcase-readiness | 324 | 38 | 42 | 63 | 100 | 48 | 126 | 217 |
| showcase-asset | 256 | 32 | 32 | 34 | 52 | 33 | 57 | 128 |
| showcase-feedback | 207 | 25 | 44 | 51 | 80 | 26 | 247 | 324 |
| showcase-project | 173 | 28 | 35 | 50 | 69 | 29 | 191 | 275 |
| showcase-output | 448 | 56 | 67 | 94 | 156 | 59 | 268 | 518 |
| showcase-access | 157 | 28 | 34 | 43 | 49 | 28 | 100 | 156 |
| showcase-notifications | 158 | 26 | 32 | 37 | 47 | 30 | 60 | 98 |
| showcase-team | 320 | 55 | 61 | 72 | 139 | 57 | 351 | 489 |
| showcase-chat | 139 | 25 | 25 | 28 | 32 | 25 | 72 | 108 |
| showcase-share | 104 | 19 | 19 | 21 | 26 | 20 | 46 | 66 |
| showcase-library | 172 | 17 | 17 | 20 | 52 | 18 | 73 | 164 |

### Card-level connected elements excluding dates

Same physical buckets and portal caveat as the node table. These counts help choose source investigations without equating a card’s slotted application content to library-generated structure.

| Card | En Reve | Radix React | Fluent React | Spectrum React S2 | Astryx React | shadcn React | Fluent Web Components | Spectrum Web Components |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| outside-cards | 21 | 20 | 44 | 22 | 39 | 19 | 219 | 214 |
| showcase-actions | 219 | 35 | 38 | 48 | 126 | 33 | 132 | 109 |
| showcase-navigation | 42 | 21 | 29 | 23 | 38 | 31 | 39 | 39 |
| showcase-brief | 93 | 26 | 30 | 47 | 54 | 29 | 62 | 63 |
| showcase-brand | 61 | 25 | 27 | 29 | 28 | 27 | 33 | 39 |
| showcase-activity | 99 | 73 | 69 | 70 | 79 | 66 | 105 | 83 |
| showcase-readiness | 116 | 28 | 32 | 51 | 84 | 37 | 55 | 54 |
| showcase-asset | 90 | 21 | 21 | 23 | 39 | 22 | 31 | 39 |
| showcase-feedback | 66 | 19 | 39 | 38 | 67 | 19 | 98 | 82 |
| showcase-project | 58 | 21 | 25 | 38 | 57 | 21 | 78 | 70 |
| showcase-output | 164 | 40 | 49 | 73 | 130 | 42 | 111 | 122 |
| showcase-access | 57 | 21 | 25 | 34 | 37 | 21 | 46 | 40 |
| showcase-notifications | 59 | 20 | 26 | 31 | 38 | 24 | 31 | 29 |
| showcase-team | 106 | 40 | 44 | 55 | 115 | 41 | 142 | 130 |
| showcase-chat | 49 | 17 | 17 | 20 | 24 | 17 | 34 | 30 |
| showcase-share | 36 | 12 | 12 | 14 | 19 | 13 | 22 | 20 |
| showcase-library | 61 | 11 | 11 | 14 | 43 | 12 | 34 | 41 |

### Author light DOM versus component shadow DOM

Supplementary initial census, one fresh visit per implementation. Buckets partition the physical tree, not authorship or CPU cost: all React-library markup is in light DOM, while web-component light DOM also contains consumer content. Shadow totals include root nodes. The underlying [ownership evidence](../showcases/performance/reports/dom-review/shadow-ownership.json) retains all eight per-host inventories, slot usage and date buckets.

| Implementation | Light-tree nodes | Shadow-tree nodes | Light-tree elements | Shadow-tree elements | Light whitespace | Shadow whitespace | Light comments | Shadow comments |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | 1,275 | 3,367 | 431 | 1,147 | 412 | 1,094 | 223 | 829 |
| Radix React | 651 | 0 | 454 | 0 | 3 | 0 | 0 | 0 |
| Fluent React | 742 | 0 | 542 | 0 | 3 | 0 | 0 | 0 |
| Spectrum React S2 | 878 | 0 | 653 | 0 | 11 | 0 | 0 | 0 |
| Astryx React | 1,486 | 0 | 1,158 | 0 | 8 | 0 | 0 | 0 |
| shadcn React | 673 | 0 | 477 | 0 | 3 | 0 | 0 | 0 |
| Fluent Web Components | 771 | 2,116 | 512 | 772 | 25 | 1,173 | 0 | 0 |
| Spectrum Web Components | 702 | 3,770 | 463 | 743 | 15 | 1,819 | 0 | 977 |

En Reve has **412 light-tree whitespace nodes and 1,094 shadow-tree whitespace nodes**, versus Fluent WC’s **25 and 1,173**. Its net whitespace excess therefore comes from the light-tree showcase/application markup; its shadow templates contain fewer whitespace nodes than Fluent’s in this fixture. En Reve also has fewer shadow comments than Spectrum WC (829 versus 977); the additional 223 light-tree Lit markers bring En Reve’s full comment count to 1,052. Separate application-template and package-template experiments before assigning costs to the library.

### En Reve shadow-template ownership

One fresh supplementary initial snapshot; totals reconcile with the repeated census. These are nodes physically inside shadow roots, including the roots themselves, grouped by the direct shadow-root host; Instances counts those roots. Consumer light DOM is kept in a separate bucket; nested component internals belong to their own host type. Host elements themselves live in the surrounding tree. This avoids attributing an entire card’s authored content to the card template. These are counts, not construction-time or render-cost measurements.

| Shadow host | Instances | Owned nodes | Owned elements | Text | Whitespace text | Comments | Slots | Base parts |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| light-dom/document | — | 1,275 | 431 | 619 | 412 | 223 | 0 | 0 |
| en-button | 49 | 784 | 294 | 343 | 343 | 98 | 196 | 0 |
| en-calendar | 1 | 450 | 122 | 70 | 17 | 257 | 2 | 1 |
| en-card | 16 | 304 | 112 | 160 | 160 | 16 | 48 | 16 |
| en-checkbox | 9 | 198 | 81 | 63 | 63 | 45 | 27 | 0 |
| en-dialog | 4 | 136 | 44 | 60 | 52 | 28 | 12 | 0 |
| en-icon | 19 | 135 | 40 | 38 | 38 | 38 | 0 | 19 |
| en-select | 3 | 129 | 39 | 42 | 27 | 45 | 6 | 0 |
| en-textarea | 5 | 110 | 40 | 30 | 25 | 35 | 10 | 0 |
| en-switch | 5 | 110 | 45 | 35 | 35 | 25 | 15 | 0 |
| en-rating | 1 | 98 | 27 | 41 | 34 | 29 | 3 | 0 |
| en-text-field | 4 | 89 | 32 | 25 | 20 | 28 | 8 | 0 |
| en-command-palette | 1 | 84 | 23 | 38 | 32 | 22 | 3 | 0 |
| en-combobox | 1 | 78 | 28 | 32 | 28 | 17 | 2 | 0 |
| en-badge | 5 | 55 | 25 | 20 | 20 | 5 | 15 | 5 |
| en-menu-item | 3 | 54 | 18 | 24 | 24 | 9 | 12 | 0 |
| en-breadcrumbs | 1 | 48 | 11 | 24 | 22 | 12 | 3 | 1 |
| en-date-picker | 1 | 45 | 14 | 14 | 11 | 16 | 2 | 0 |
| en-radio | 2 | 44 | 18 | 14 | 14 | 10 | 6 | 0 |
| en-segmented-control | 1 | 44 | 15 | 16 | 15 | 12 | 4 | 0 |
| en-swatch | 3 | 39 | 12 | 18 | 15 | 6 | 3 | 0 |
| en-number-field | 1 | 39 | 16 | 14 | 9 | 8 | 4 | 0 |
| en-popover | 2 | 34 | 12 | 14 | 10 | 6 | 4 | 0 |
| en-slider | 1 | 34 | 12 | 13 | 11 | 8 | 4 | 0 |
| en-drawer | 1 | 34 | 11 | 15 | 13 | 7 | 3 | 0 |
| en-accordion-item | 1 | 24 | 8 | 12 | 11 | 3 | 3 | 1 |
| en-radio-group | 1 | 22 | 8 | 8 | 7 | 5 | 3 | 0 |
| en-color-field | 1 | 22 | 8 | 6 | 5 | 7 | 2 | 0 |
| en-avatar | 2 | 22 | 4 | 10 | 8 | 6 | 0 | 2 |
| en-select-option | 9 | 18 | 0 | 0 | 0 | 9 | 0 | 0 |
| en-navigation | 2 | 16 | 4 | 8 | 8 | 2 | 2 | 2 |
| en-tabs | 1 | 12 | 5 | 5 | 5 | 1 | 2 | 1 |
| en-menu | 1 | 9 | 2 | 4 | 4 | 2 | 1 | 0 |
| en-toolbar | 1 | 8 | 2 | 4 | 4 | 1 | 1 | 1 |
| en-tab | 2 | 8 | 4 | 0 | 0 | 2 | 2 | 2 |
| en-tab-panel | 2 | 8 | 4 | 0 | 0 | 2 | 2 | 2 |
| en-segmented-item | 2 | 8 | 2 | 0 | 0 | 4 | 2 | 0 |
| en-stack | 1 | 6 | 2 | 2 | 2 | 1 | 1 | 1 |
| en-progress-bar | 1 | 5 | 1 | 2 | 2 | 1 | 0 | 0 |
| en-accordion | 1 | 4 | 2 | 0 | 0 | 1 | 1 | 1 |

### Repeated web-component button structure

Full initial fixture, direct shadow-root ownership only. Native/control strategies and variant mixes differ; this is an investigation guide rather than a capability-matched microbenchmark. Child custom-element internals remain in their own ownership bucket. All three families are high-frequency targets, and slots are part of their public composition contracts.

| Implementation | Button family | Instances | Shadow elements | Elements per instance | Slots per instance | Comments per instance | Whitespace per instance |
| --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve | en-button | 49 | 294 | 6 | 4 | 2 | 7 |
| Fluent Web Components | fluent-button | 47 | 188 | 4 | 3 | 0 | 6 |
| Spectrum Web Components | sp-button | 45 | 135 | 3 | 2 | 8 | 9 |

En Reve’s card template adds seven shadow elements per instance (112 across 16 cards). Both peer WC fixtures use application-authored `div.native-card` surfaces rather than a corresponding card custom element, so that comparison also includes composition choices. A one-element base migration leaves the other card regions and slots intact. Audit unused optional footer/header structure separately; do not assume eliminating the entire shadow contract is equivalent.

### En Reve slot structure

Assigned means assignedNodes() is nonempty, including whitespace; it does not prove visible content or active fallback projection. Unassigned slots still support API behavior and later slotted content. They are investigation targets, not proven waste. Fallback elements may be necessary even when no author nodes are assigned. Native buttons must remain native buttons. The four-slot button design repeats often; investigate label/adornment structure without breaking named/default labels, loading state, icon-only names or hydration.

| Shadow host | Slots | Assigned slots | Unassigned slots | Slots with fallback elements |
| --- | --- | --- | --- | --- |
| en-button | 196 | 74 | 122 | 49 |
| en-card | 48 | 32 | 16 | 0 |
| en-checkbox | 27 | 9 | 18 | 18 |
| en-badge | 15 | 5 | 10 | 5 |
| en-switch | 15 | 5 | 10 | 10 |
| en-menu-item | 12 | 3 | 9 | 0 |
| en-dialog | 12 | 7 | 5 | 0 |
| en-textarea | 10 | 0 | 10 | 5 |
| en-text-field | 8 | 0 | 8 | 4 |
| en-radio | 6 | 2 | 4 | 4 |
| en-select | 6 | 0 | 6 | 3 |
| en-segmented-control | 4 | 2 | 2 | 1 |
| en-popover | 4 | 2 | 2 | 0 |
| en-slider | 4 | 0 | 4 | 2 |
| en-number-field | 4 | 0 | 4 | 1 |
| en-command-palette | 3 | 0 | 3 | 0 |
| en-breadcrumbs | 3 | 3 | 0 | 0 |
| en-radio-group | 3 | 1 | 2 | 1 |
| en-accordion-item | 3 | 2 | 1 | 1 |
| en-swatch | 3 | 0 | 3 | 0 |
| en-rating | 3 | 0 | 3 | 2 |
| en-drawer | 3 | 2 | 1 | 0 |
| en-navigation | 2 | 2 | 0 | 0 |
| en-tabs | 2 | 2 | 0 | 0 |
| en-tab | 2 | 2 | 0 | 0 |
| en-tab-panel | 2 | 2 | 0 | 0 |
| en-color-field | 2 | 0 | 2 | 1 |
| en-segmented-item | 2 | 2 | 0 | 0 |
| en-date-picker | 2 | 0 | 2 | 1 |
| en-calendar | 2 | 0 | 2 | 2 |
| en-combobox | 2 | 0 | 2 | 1 |
| en-toolbar | 1 | 1 | 0 | 0 |
| en-menu | 1 | 1 | 0 | 0 |
| en-accordion | 1 | 1 | 0 | 0 |
| en-stack | 1 | 1 | 0 | 0 |

### Connected base parts by implementation

Part naming is a library convention: zero “base” parts does not mean zero wrappers. SVG base parts are actual rendering primitives and are not counted as removable HTML wrappers. All values describe the complete initial page.

| Implementation | All base parts | SVG base parts | Non-SVG base parts | Non-date base parts | Non-date non-SVG base parts |
| --- | --- | --- | --- | --- | --- |
| En Reve | 55 | 19 | 36 | 50 | 35 |
| Radix React | 0 | 0 | 0 | 0 | 0 |
| Fluent React | 0 | 0 | 0 | 0 | 0 |
| Spectrum React S2 | 0 | 0 | 0 | 0 | 0 |
| Astryx React | 0 | 0 | 0 | 0 | 0 |
| shadcn React | 0 | 0 | 0 | 0 | 0 |
| Fluent Web Components | 0 | 0 | 0 | 0 | 0 |
| Spectrum Web Components | 0 | 0 | 0 | 0 | 0 |

### En Reve mounted base responsibilities

Join observed instances to source-reviewed responsibilities. “Candidate” means a future isolated prototype, not an approved mechanical deletion. `en-card::part(base)` currently targets a shadow descendant: moving `part="base"` to the card host does not preserve that selector. Decide the pre-release styling API and migrate actual theme/consumer usages before removing its target. Existing ancestors inside the same shadow tree can sometimes preserve a part, but combining viewport/surface or semantic responsibilities still changes contracts.

| Component | Base element | Mounted instances | Without date instances | Classification | Responsibilities | Investigation |
| --- | --- | --- | --- | --- | --- | --- |
| en-card | div | 16 | 16 | host-prototype | flex surface, padding/border/background/shadow around three regions | Host can own entire surface layout; retain header/content/footer initially. Investigate absent optional region wrappers separately with slot discovery and SSR identity preserved. |
| en-icon | svg | 19 | 15 | retain-primitive | SVG viewport, stroke and accessible image contract | Base is the actual SVG, not an extra HTML wrapper. A custom HTML host cannot replace its SVG namespace/viewBox rendering. Investigate paths or repeated host use independently. |
| en-badge | span | 5 | 5 | host-prototype | inline-flex status surface, variant, prefix/label slots | Host can own inline-flex/padding/border and variant; label min-size and nested fallback slots remain. No interactive role to migrate. |
| en-toolbar | div | 1 | 1 | semantic-prototype | toolbar/group role, label/orientation and flex layout | Host can own default toolbar/group semantics and layout; roving controller already host-based. Preserve mixed-control Tab mode and direct child discovery. |
| en-breadcrumbs | nav | 1 | 1 | semantic-redesign | named native nav enclosing projection/list | Host role=navigation could replace native nav but loses automatic HTML landmark semantics and needs verified default semantics/SSR. Preserve ordered list, original anchors and projection wrappers. |
| en-navigation | nav | 2 | 2 | semantic-redesign | named native nav inside optional details disclosure | Host could supply navigation semantics but then landmark moves outside responsive details and must not expose a collapsed empty landmark accidentally. Keep details/summary. |
| en-tabs | div | 1 | 1 | host-prototype | min-size/isolation around tab-list and panels | Host can own min-size/isolation and orientation state. Keep tab-list role and named slots; preserve local stacking above panel content. |
| en-tab | span | 2 | 2 | host-prototype | label paint/spacing/press surface; host already role=tab/tabindex | Host can own label surface, but moving transforms/press animation changes hitbox and focus outline behavior; keep roving focus and IDs on host. |
| en-tab-panel | div | 2 | 2 | host-prototype | padding/min-size around slot; host already role=tabpanel and focusable | Host can own padding/min-size; persistent content stays mounted by existing API. This removes one wrapper, not inactive panel descendants. |
| en-accordion | div | 1 | 1 | host-prototype | flex layout, isolation, slot projection | Host can own flex column and isolation; retain slot and slotchange listener. Rewrite slotted focus stacking selectors. |
| en-accordion-item | section | 1 | 1 | host-prototype | bordered section around heading/button/panel | Host can own border/min-size. Keep heading, native trigger and panel together in shadow for aria-controls; section has no accessible name today. |
| en-calendar | div | 1 | 0 | host-prototype | width/overflow boundary, selection styling, calendar grid container; keyboard reveal scrolling queries this surface | Host can own calendar width/max-width/overflow and selection selector. Grid, heading and days remain. Date picker currently styles en-calendar::part(base), so dependent style migration is required. Update updated() geometry/client-border/scrollBy logic at packages/elements/src/calendar/element.ts:267; it directly queries .en-calendar. |
| en-stack | div | 1 | 1 | host-prototype | flex layout with reflected direction/gap/align/justify/wrap | Host can own flex and selectors using already reflected attributes. Keep slot flattening and minimum child sizing. |
| en-avatar | span | 2 | 2 | semantic-prototype | image frame, img role/name or decorative hiding | Host can own grid/clip/radius/size and default img semantics; preserve actual img and initials fallback. Respect author aria overrides and decorative state. |

### Complete current-source base catalog

The source audit covers **41 component types / 43 declaration sites** in current En Reve, **40 types / 42 sites** in the frozen package, plus two standalone primitive-template sites. Only 14 owner types are mounted here. Current-only or unmounted components are architectural follow-ups, not explanations for measured showcase counts. Current `en-tag` has an additional part-documentation gap. All references, hashes and acceptance checks are retained in the [full wrapper audit](../showcases/performance/reports/dom-review/base-wrapper-audit.md) and [inventory](../showcases/performance/reports/dom-review/base-wrapper-inventory.json).

| Component | Current declaration sites | Mounted base instances | Classification | Host or ancestor investigation |
| --- | --- | --- | --- | --- |
| en-accordion | 1 | 1 | host-prototype | Host can own flex column and isolation; retain slot and slotchange listener. Rewrite slotted focus stacking selectors. |
| en-accordion-item | 1 | 1 | host-prototype | Host can own border/min-size. Keep heading, native trigger and panel together in shadow for aria-controls; section has no accessible name today. |
| en-activity-feed | 1 | 0 | host-prototype | Host can own grid/gap; leave list/virtual scroll boundaries and announcements intact. Does not eliminate rows or hidden load controls. |
| en-activity-item | 1 | 0 | semantic-redesign | Prefer move listitem to host and keep native article; alternatively move article role to host only when external listitem remains. One host cannot be both article and listitem. |
| en-alert | 1 | 0 | host-prototype | Host can own flex/border/variant/visibility; keep stable content live region and native dismiss button. Do not hide host by overwriting an author-owned hidden attribute without a policy. |
| en-avatar | 1 | 2 | semantic-prototype | Host can own grid/clip/radius/size and default img semantics; preserve actual img and initials fallback. Respect author aria overrides and decorative state. |
| en-badge | 1 | 5 | host-prototype | Host can own inline-flex/padding/border and variant; label min-size and nested fallback slots remain. No interactive role to migrate. |
| en-breadcrumbs | 1 | 1 | semantic-redesign | Host role=navigation could replace native nav but loses automatic HTML landmark semantics and needs verified default semantics/SSR. Preserve ordered list, original anchors and projection wrappers. |
| en-calendar | 1 | 1 | host-prototype | Host can own calendar width/max-width/overflow and selection selector. Grid, heading and days remain. Date picker currently styles en-calendar::part(base), so dependent style migration is required. Update updated() geometry/client-border/scrollBy logic at packages/elements/src/calendar/element.ts:267; it directly queries .en-calendar. |
| en-card | 1 | 16 | host-prototype | Host can own entire surface layout; retain header/content/footer initially. Investigate absent optional region wrappers separately with slot discovery and SSR identity preserved. |
| en-carousel | 1 | 0 | semantic-redesign | Host could own group/grid and event boundary after auditing relatedTarget/containment paths and autoplay recovery; retain viewport scroll region. |
| en-carousel-slide | 1 | 0 | semantic-prototype | Host can own surface and default group semantics, but inert/hidden policy must distinguish internal visibility from consumer attributes; preserve authored children identity. |
| en-chat-composer | 1 | 0 | semantic-prototype | Host can own default group semantics/surface; native editing and send controls remain. focus() must still target the editor adapter. |
| en-chat-message | 1 | 0 | semantic-redesign | Move role=article/name/surface to host only with article accessibility and focus API redesign; keep native article as lower-risk default. |
| en-color-picker | 1 | 0 | semantic-prototype | Host can own default group semantics and layout; keep field/slider/native controls and existing forwarded parts. Larger savings likely lie in optional panels rather than one base. |
| en-color-plane | 1 | 0 | semantic-prototype | Host can own group and layout; retain pointer plane gesture target and accessible equivalent sliders. |
| en-color-wheel | 1 | 0 | semantic-prototype | Host can own group/layout; retain wheel gesture target and accessible slider controls. |
| en-editor-toolbar | 1 | 0 | top-layer-redesign | Popover can be host-owned in principle, but this moves top-layer participation, imperative geometry and all base references. Keep as separate measured redesign, not simple wrapper deletion. |
| en-icon | 1 | 19 | retain-primitive | Base is the actual SVG, not an extra HTML wrapper. A custom HTML host cannot replace its SVG namespace/viewBox rendering. Investigate paths or repeated host use independently. |
| en-navigation | 1 | 2 | semantic-redesign | Host could supply navigation semantics but then landmark moves outside responsive details and must not expose a collapsed empty landmark accidentally. Keep details/summary. |
| en-navigation-group | 1 | 0 | retain-native | Keep details/summary for native disclosure and SSR interaction capture; moving roles to host does not replace native behavior. |
| en-pagination | 1 | 0 | semantic-redesign | Host could own navigation semantics/layout/focus but requires every nav fallback and responsive direct-jump contract audited; keep native controls/popover. |
| en-presence | 2 | 0 | mixed-native | Unlinked variant could move surface to host. Linked variant should retain native anchor (href/target/rel, browser link actions); styling on host alone does not move hit area or semantics. |
| en-presence-group | 1 | 0 | semantic-prototype | Host can own role/name/focus; update explicit [part=base] focus recovery and preserve members layout and overflow dialog. |
| en-progress-steps | 1 | 0 | semantic-redesign | Host role=navigation is possible only with focus fallback/query and responsive details/list redesign; keep native summary and buttons. |
| en-skeleton | 1 | 0 | semantic-prototype | Host or host pseudo-element can paint placeholder; host must become decorative without overwriting consumer semantics. Existing content styles target ::part(base). |
| en-spinner | 1 | 0 | ancestor-prototype | Move stable status role/name to host and retain one rotating decoration; or retain status ancestor and draw pseudo-element after part API migration. Avoid rotating semantic host/content. |
| en-split-view | 1 | 0 | layout-redesign | Host grid is not a drop-in: controls are a sibling outside base; splitter measures parentElement. First investigate removing the outer en-split-shell while keeping the dedicated pane grid/base; that can save an element without deleting the base part. |
| en-splitter | 1 | 0 | host-prototype | Host can own grid/paint with retained grip (or separately migrate grip to pseudo). Do not transfer aria-hidden=true from decorative base to semantic host. |
| en-stack | 1 | 1 | host-prototype | Host can own flex and selectors using already reflected attributes. Keep slot flattening and minimum child sizing. |
| en-tab | 1 | 2 | host-prototype | Host can own label surface, but moving transforms/press animation changes hitbox and focus outline behavior; keep roving focus and IDs on host. |
| en-tab-panel | 1 | 2 | host-prototype | Host can own padding/min-size; persistent content stays mounted by existing API. This removes one wrapper, not inactive panel descendants. |
| en-table | 1 | 0 | ancestor-prototype | Host can own border/background retaining viewport; alternatively combine base+viewport parts on existing viewport to preserve selector reach but merge two styling/geometry contracts. |
| en-tabs | 1 | 1 | host-prototype | Host can own min-size/isolation and orientation state. Keep tab-list role and named slots; preserve local stacking above panel content. |
| en-tag | 1 | 0 | host-prototype | Host can own paint/layout; keep real remove button and cancellation semantics. New current-source component absent from frozen vendor; document its existing base/remove parts. |
| en-toast | 1 | 0 | semantic-redesign | Host can own surface/events but moves pointer capture/currentTarget geometry and article semantics; audit swipe cleanup and authored hidden behavior. |
| en-toast-region | 1 | 0 | semantic-redesign | Host role=region would include live announcement siblings that are outside current base. Audit accessibility boundary and update focus() plus independent live regions. |
| en-toolbar | 1 | 1 | semantic-prototype | Host can own default toolbar/group semantics and layout; roving controller already host-based. Preserve mixed-control Tab mode and direct child discovery. |
| en-tree | 2 | 0 | semantic-redesign | Host role=tree could replace wrapper but error and data-mode sibling boundaries change; update focusEmpty/focus() queries and both template modes. |
| en-tree-item | 1 | 0 | semantic-redesign | Host treeitem requires control() changes and accessible label relationship across shadow boundary; do not copy aria-labelledby=label to host unchanged. Preserve child-group ownership. |
| en-validation-summary | 1 | 0 | semantic-redesign | Host role=region/name/focus requires supported element-reference/default semantics strategy; copying internal heading ID to host aria-labelledby fails ordinary tree scoping. |

### Addressable follow-up backlog

These are proposed investigations to take up later. Candidate element counts are structural bounds, not benchmarked savings. Keep the frozen reference and change one factor per candidate.

| Priority | Investigation | Evidence | Next experiment | Acceptance |
| --- | --- | --- | --- | --- |
| 1 | DOM-01 · Date mount boundary | 623 nodes / 181 elements for the whole field; much of its popup is eager | Compare calendar-only versus full overlay deferral; measure retained-after-close versus unmount-after-close independently | First open on one activation; correct selected date, focus, Escape, reopen, form/reset and locale/range behavior; paired startup and first/repeat-use timings |
| 1 | DOM-02 · Renderer and whitespace attribution | 756 excess comments plus 244 excess whitespace nodes versus Fluent WC without dates | Separate production template whitespace, Lit expression anchors and repeated range branches. Prototype build-time whitespace handling or a simpler single-date template; never delete live markers | Exact semantic text and slot boundaries, all updates and SSR/hydration preserved; report node categories, bytes, CPU and memory separately |
| 2 | DOM-03 · Host surface pilot | 16 card + 5 badge base elements; smaller stack/accordion/tab-panel candidates | Choose explicit part API policy; move paint/layout to host, retaining required regions/slots. Compare merging with an existing internal ancestor where it preserves the contract | Theme and consumer CSS migration, equal geometry, inline baselines, focus, forced colors, RTL, reduced motion and SSR |
| 2 | DOM-04 · Repeated button and field scaffolding | 45 non-date buttons with 180 slots; stable field description wrappers | Audit label span/slot duplication, optional prefix/suffix and card footer regions. Retain native controls and stable accessible-description behavior unless replacement is proven | Late slot insertion, named/default precedence, accessible names/descriptions, icon/loading states, disabled/forms, cancellation and hydration |
| 2 | DOM-05 · Calendar internal efficiency | 42 td/button pairs; one calendar base; seven weekday decoration spans | Separate base-to-host scroll migration, single-mode rendering and optional variable week count; preserve semantic table/day controls | Keyboard reveal/roving focus, localization, min/max/step/unavailable dates, range mode, touch targets, narrow scrolling and no unintended month-height shifts |
| 3 | DOM-06 · Semantic and ancestor migrations | Toolbar/avatar/navigation and unmounted catalog candidates | Prototype host default semantics or remove an outer shell while retaining a meaningful base (spinner, activity-item, split-view). Retain SVG, details and real anchors | Accessible-tree names/roles, native actions, author ARIA overrides, cross-shadow naming, focus APIs and event/geometry contracts |
| 3 | DOM-07 · Retention and repeatable budgets | Initial counts differ from post-journey and browser-wide memory counters | Add source-qualified initial/open/closed connected-count receipts to candidate checks; retain with/without-date and node-type baselines | Match capability/browser/viewport/scenario; review element and all-node deltas independently; pair with end-user metrics before approving an optimization |

A smaller connected tree is an engineering signal, not the outcome by itself. Do not remove native semantic controls, flatten public slots, substitute browser-native dates in the canonical custom fixture, or suppress accessible content to win a count. Consumer guidance should explain optional feature mounting, retained versus recreated state, the native/custom date choice and any deliberate host-style migration after experiments succeed.

Source reasoning is cross-checked in the [method review](../showcases/performance/reports/dom-review/method-review.md). Browser and assistive-technology validation, current-source performance qualification and implementation prototypes remain future work. The reviewed source catalog can identify opportunities outside this showcase; its counts are never added to the measured DOM.
<!-- END DOM REVIEW -->
