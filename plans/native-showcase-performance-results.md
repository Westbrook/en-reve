# Native showcase performance: results and engineering backlog

New: [calendar delivery variants](#calendar-delivery-variants) compare the remeasured eager reference, deferred construction and calendar code splitting, with dated first-use and DOM evidence.

**Reading measurement dates:** “Run ID” (previously “Acquisition”) identifies one recorded benchmark run, so its raw evidence can be traced. “Date (UTC)” is when its samples were measured—not when this report was rebuilt. A date range means sampling crossed UTC days; a dash means no timestamp could be recovered. Older peer rows retain their original dates.


<!-- BEGIN EN REVE CURRENT OVERVIEW -->
En Reve is now measured from exact local main **6d09b31c**, using fresh package builds, the original eager CSR showcase and regenerated default light tokens. The new acquisition uses frozen Fluent WC/Web Awesome controls; it does not retrofit current data into old paired comparisons or enable scoped/lazy/SSR consumer policies.

Mobile median LCP is **644.0 ms cold / 304.0 ms warm**. The native fixture emits **439.5 KiB raw JS / 86.9 KiB Brotli JS**. These are whole-fixture costs; the detailed tables retain HTML, CSS, actual responses, main-thread, interaction, memory and DOM metrics.

[All current measurements and evidence](native-showcase-en-reve-main-results.md). [Sortable current comparison](http://127.0.0.1:4188/?progress-report#en-reve-main-comparison).
<!-- END EN REVE CURRENT OVERVIEW -->

Current En Reve rows are labelled **En Reve main 6d09b31c**. Older supplements, variant experiments, paired contrasts and source audits retain their historical En Reve build; they are not measurements of this main baseline. See the [new En Reve cohort](#en-reve-main-comparison) for current results and controls.

Current Spectrum rows use the Gen2 + Gen1 label. Older sections and retained paired contrasts that still say Spectrum Web Components describe the earlier Gen1 1.12.2 artifact; see the [September 22 refresh](#spectrum-gen2-comparison) for current measurements.

The isolated laboratory is implemented in [showcases/performance](../showcases/performance/README.md). It measures the nine-system native panel and retains versioned refreshes, preserves failed samples, and supports separate load, interaction, diagnostic, memory, Lighthouse, back/forward-cache and instrumentation-overhead runs. Profiling dependencies are confined to this sub-project; none were added to the root application.

This is an exploratory developer-workstation baseline. It is useful for selecting engineering work; it is not a certified device benchmark, field Web Vitals result or universal library ranking. In the first 30-sample mobile-cold campaign, En Reve’s clearest observed deficit was startup against Fluent Web Components: **604 ms versus 504 ms median LCP**, with a paired-block median difference of **+100 ms (95% bootstrap interval +90 to +104 ms)** over 30 samples per implementation. Native layout and font differences remain part of this comparison.

<!-- BEGIN SECOND PASS -->

## Second pass measurements

This expands the historical comparison below. Every table can be sorted by its measurement columns in the HTML reader. **KiB = 1,024 bytes; MiB = 1,048,576 bytes.** A dash means unavailable or no successful measurement, never zero. Tables show successful and failed samples separately. Missing values stay last in either sort direction. These are exploratory workstation measurements of the frozen CSR fixtures, not release gates or a universal ranking.

[Second-pass machine-readable tables and cohort receipts](../showcases/performance/reports/pass2-tables.json). [Execution receipt](../showcases/performance/reports/pass2-execution.json). [Retained raw evidence receipt](../showcases/performance/reports/pass2-evidence/receipt.json).

Read loading and startup usability first, then transfer and main-thread work to identify a likely cost. Use interaction tables to check whether an optimization merely moves that cost to the first click. Memory and diagnostics support hypotheses; they do not prove leaks or causality. Historical first-pass evidence is kept separately below.

The findings immediately below describe the original second-pass acquisition. Refreshed En Reve rows in the grouped tables use main 6d09b31c; see the [current findings and remediation priorities](#en-reve-main-implications-and-next-investigations).

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

En Reve rows now use **local main 6d09b31c**, measured in the September 23 refresh. Acquisition IDs distinguish current values from historical peers. Mixed-session rows are descriptive, not paired comparisons. See [the new En Reve main cohort](#en-reve-main-comparison) for contemporaneous Fluent WC/Web Awesome controls. Prior En Reve results remain in the [retained pre-refresh report](../showcases/performance/reports/en-reve-main/prior-results.md).

Spectrum WC rows below now use **@adobe/spectrum-wc 2.0.0-beta.3 + Gen1 1.12.2 controls**, measured September 22. Acquisition IDs distinguish this refresh from the retained historical peers. These mixed-session rows are descriptive, not paired comparisons. See [the new Spectrum cohort](#spectrum-gen2-comparison) for contemporaneous En Reve/Fluent controls and versioned evidence. Prior Gen1 results remain in the [retained pre-refresh report](../showcases/performance/reports/spectrum-gen2/prior-results.md).

The load suite sends no input, so LCP collection is not cut short by a test click. The observation window ends after load plus 1.5 seconds and card readiness; CLS is bounded to this visit. TTFB is a loopback timestamp and does not establish deployed backend performance.

### mobile cold loading

Calendar policy variants below are a separate, dated campaign; historical peers are descriptive comparisons. See [calendar policy tradeoffs](#calendar-delivery-variants).

En Reve refreshed from the versioned [main acquisition](#en-reve-main-comparison); other rows retain their indicated historical acquisitions.

Spectrum refreshed from the versioned [new acquisition](#spectrum-gen2-comparison); other rows retain their indicated historical acquisitions.

Historical reference rows and the later Web Awesome acquisition are shown together for descriptive comparison. Acquisition IDs are explicit; these rows are not paired blocks. Use the supplemental contemporaneous En Reve/Fluent/Web Awesome tables for measured differences. A dash means unavailable, never zero.

FCP: first contentful paint. LCP: largest contentful paint. Card/frame and last-webfont-response milestones are navigation-relative; neither proves every control is usable. A dash in the webfont column means no measurable downloaded-font response. The older load-time document.fonts.ready promise can resolve before dynamically registered fonts start loading; it is not used as final font readiness here. Warm visits reuse a primed browser context. Cohort: pass2-load-matrix-v1; mobile/cold. Values are per-system sample medians unless labeled p75. Campaign complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | FCP ms | LCP ms | LCP p75 ms | CLS | CLS p75 | CLS max | TTFB ms | Cards frame opportunity ms | Last webfont response ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 644.0 | 644.0 | 662.0 | 0.000000 | 0.000000 | 0.000000 | 16.2 | 638.4 | — |
| Radix React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 658.0 | 658.0 | 682.0 | 0.000000 | 0.000000 | 0.000000 | 15.1 | 660.7 | — |
| Fluent React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 698.0 | 698.0 | 704.0 | 0.000000 | 0.000000 | 0.000000 | 16.0 | 713.6 | — |
| Spectrum React S2 | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 988.0 | 1,384.0 | 1,394.0 | 0.001630 | 0.001630 | 0.001630 | 15.8 | 1,000.4 | 1,207.7 |
| Astryx React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 784.0 | 784.0 | 791.0 | 0.000000 | 0.000000 | 0.000000 | 17.5 | 793.5 | — |
| shadcn React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 708.0 | 708.0 | 722.0 | 0.000986 | 0.000986 | 0.000986 | 15.4 | 724.5 | 868.4 |
| Fluent Web Components | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 514.0 | 514.0 | 519.0 | 0.000000 | 0.000000 | 0.000000 | 15.5 | 504.5 | — |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 776.0 | 776.0 | 784.0 | 0.000000 | 0.000000 | 0.000000 | 14.7 | 772.7 | — |
| Web Awesome | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 604.0 | 604.0 | 611.0 | 0.000000 | 0.000000 | 0.000000 | 15.8 | 602.0 | — |
| En Reve · Eager reference | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 646.0 | 646.0 | 663.0 | 0.000000 | 0.000000 | 0.000000 | 16.8 | 640.8 | — |
| En Reve · Deferred construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 640.0 | 640.0 | 673.0 | 0.000000 | 0.000000 | 0.000000 | 16.2 | 636.4 | — |
| En Reve · Deferred code + construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 642.0 | 642.0 | 667.0 | 0.000000 | 0.000000 | 0.000000 | 17.5 | 636.3 | — |

### mobile warm loading

Calendar policy variants below are a separate, dated campaign; historical peers are descriptive comparisons. See [calendar policy tradeoffs](#calendar-delivery-variants).

En Reve refreshed from the versioned [main acquisition](#en-reve-main-comparison); other rows retain their indicated historical acquisitions.

Spectrum refreshed from the versioned [new acquisition](#spectrum-gen2-comparison); other rows retain their indicated historical acquisitions.

Historical reference rows and the later Web Awesome acquisition are shown together for descriptive comparison. Acquisition IDs are explicit; these rows are not paired blocks. Use the supplemental contemporaneous En Reve/Fluent/Web Awesome tables for measured differences. A dash means unavailable, never zero.

FCP: first contentful paint. LCP: largest contentful paint. Card/frame and last-webfont-response milestones are navigation-relative; neither proves every control is usable. A dash in the webfont column means no measurable downloaded-font response. The older load-time document.fonts.ready promise can resolve before dynamically registered fonts start loading; it is not used as final font readiness here. Warm visits reuse a primed browser context. Cohort: pass2-load-matrix-v1; mobile/warm. Values are per-system sample medians unless labeled p75. Campaign complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | FCP ms | LCP ms | LCP p75 ms | CLS | CLS p75 | CLS max | TTFB ms | Cards frame opportunity ms | Last webfont response ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 304.0 | 304.0 | 310.0 | 0.000000 | 0.000000 | 0.000000 | 1.0 | 313.5 | — |
| Radix React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 240.0 | 240.0 | 244.0 | 0.000000 | 0.000000 | 0.000000 | 0.9 | 237.3 | — |
| Fluent React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 234.0 | 234.0 | 255.0 | 0.000000 | 0.000000 | 0.000000 | 0.9 | 242.8 | — |
| Spectrum React S2 | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 532.0 | 532.0 | 548.0 | 0.000000 | 0.000000 | 0.000000 | 1.0 | 544.6 | 159.3 |
| Astryx React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 262.0 | 262.0 | 268.0 | 0.000000 | 0.000000 | 0.000000 | 1.4 | 274.6 | — |
| shadcn React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 268.0 | 268.0 | 280.0 | 0.000000 | 0.000000 | 0.000000 | 0.8 | 280.5 | 124.3 |
| Fluent Web Components | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 218.0 | 218.0 | 223.0 | 0.000000 | 0.000000 | 0.000000 | 2.7 | 223.3 | — |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 288.0 | 288.0 | 294.0 | 0.000000 | 0.000000 | 0.000000 | 0.9 | 303.6 | — |
| Web Awesome | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 246.0 | 246.0 | 248.0 | 0.000000 | 0.000000 | 0.000000 | 3.8 | 255.6 | — |
| En Reve · Eager reference | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 302.0 | 302.0 | 313.0 | 0.000000 | 0.000000 | 0.000000 | 1.5 | 308.3 | — |
| En Reve · Deferred construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 298.0 | 298.0 | 300.0 | 0.000000 | 0.000000 | 0.000000 | 1.8 | 307.2 | — |
| En Reve · Deferred code + construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 292.0 | 292.0 | 303.0 | 0.000000 | 0.000000 | 0.000000 | 0.9 | 301.5 | — |

### desktop cold loading

Calendar policy variants below are a separate, dated campaign; historical peers are descriptive comparisons. See [calendar policy tradeoffs](#calendar-delivery-variants).

En Reve refreshed from the versioned [main acquisition](#en-reve-main-comparison); other rows retain their indicated historical acquisitions.

Spectrum refreshed from the versioned [new acquisition](#spectrum-gen2-comparison); other rows retain their indicated historical acquisitions.

Historical reference rows and the later Web Awesome acquisition are shown together for descriptive comparison. Acquisition IDs are explicit; these rows are not paired blocks. Use the supplemental contemporaneous En Reve/Fluent/Web Awesome tables for measured differences. A dash means unavailable, never zero.

FCP: first contentful paint. LCP: largest contentful paint. Card/frame and last-webfont-response milestones are navigation-relative; neither proves every control is usable. A dash in the webfont column means no measurable downloaded-font response. The older load-time document.fonts.ready promise can resolve before dynamically registered fonts start loading; it is not used as final font readiness here. Warm visits reuse a primed browser context. Cohort: pass2-load-matrix-v1; desktop/cold. Values are per-system sample medians unless labeled p75. Campaign complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | FCP ms | LCP ms | LCP p75 ms | CLS | CLS p75 | CLS max | TTFB ms | Cards frame opportunity ms | Last webfont response ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 100.0 | 100.0 | 107.0 | 0.000000 | 0.000000 | 0.000000 | 15.0 | 88.1 | — |
| Radix React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 128.0 | 128.0 | 128.0 | 0.000000 | 0.000000 | 0.000000 | 14.6 | 86.1 | — |
| Fluent React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 104.0 | 104.0 | 108.0 | 0.000000 | 0.000000 | 0.000000 | 15.8 | 96.1 | — |
| Spectrum React S2 | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 158.0 | 234.0 | 253.0 | 0.002332 | 0.002332 | 0.002332 | 16.4 | 158.8 | 178.5 |
| Astryx React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 120.0 | 120.0 | 124.0 | 0.000000 | 0.000000 | 0.000000 | 15.8 | 109.0 | — |
| shadcn React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 126.0 | 126.0 | 142.0 | 0.002616 | 0.005232 | 0.005232 | 16.2 | 120.8 | 100.5 |
| Fluent Web Components | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 78.0 | 78.0 | 83.0 | 0.000075 | 0.000075 | 0.000075 | 14.9 | 71.0 | — |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 112.0 | 112.0 | 112.0 | 0.000000 | 0.000000 | 0.000000 | 15.0 | 100.5 | — |
| Web Awesome | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 96.0 | 96.0 | 99.0 | 0.000000 | 0.000000 | 0.000000 | 15.5 | 83.0 | — |
| En Reve · Eager reference | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 100.0 | 100.0 | 104.0 | 0.000000 | 0.000000 | 0.000000 | 15.6 | 89.0 | — |
| En Reve · Deferred construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 102.0 | 102.0 | 107.0 | 0.000000 | 0.000000 | 0.000000 | 16.5 | 88.7 | — |
| En Reve · Deferred code + construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 96.0 | 96.0 | 99.0 | 0.000000 | 0.000000 | 0.000000 | 15.6 | 85.0 | — |

### desktop warm loading

Calendar policy variants below are a separate, dated campaign; historical peers are descriptive comparisons. See [calendar policy tradeoffs](#calendar-delivery-variants).

En Reve refreshed from the versioned [main acquisition](#en-reve-main-comparison); other rows retain their indicated historical acquisitions.

Spectrum refreshed from the versioned [new acquisition](#spectrum-gen2-comparison); other rows retain their indicated historical acquisitions.

Historical reference rows and the later Web Awesome acquisition are shown together for descriptive comparison. Acquisition IDs are explicit; these rows are not paired blocks. Use the supplemental contemporaneous En Reve/Fluent/Web Awesome tables for measured differences. A dash means unavailable, never zero.

FCP: first contentful paint. LCP: largest contentful paint. Card/frame and last-webfont-response milestones are navigation-relative; neither proves every control is usable. A dash in the webfont column means no measurable downloaded-font response. The older load-time document.fonts.ready promise can resolve before dynamically registered fonts start loading; it is not used as final font readiness here. Warm visits reuse a primed browser context. Cohort: pass2-load-matrix-v1; desktop/warm. Values are per-system sample medians unless labeled p75. Campaign complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | FCP ms | LCP ms | LCP p75 ms | CLS | CLS p75 | CLS max | TTFB ms | Cards frame opportunity ms | Last webfont response ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 44.0 | 44.0 | 44.0 | 0.000000 | 0.000000 | 0.000000 | 0.9 | 42.5 | — |
| Radix React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 68.0 | 68.0 | 68.0 | 0.000000 | 0.000000 | 0.000000 | 0.9 | 65.7 | — |
| Fluent React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 34.0 | 34.0 | 36.0 | 0.000000 | 0.000000 | 0.000000 | 0.7 | 32.9 | — |
| Spectrum React S2 | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 102.0 | 102.0 | 104.0 | 0.000000 | 0.000000 | 0.000000 | 0.9 | 95.6 | 13.4 |
| Astryx React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 40.0 | 40.0 | 44.0 | 0.000000 | 0.000000 | 0.000000 | 0.8 | 38.2 | — |
| shadcn React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 42.0 | 42.0 | 47.0 | 0.000000 | 0.000000 | 0.000000 | 0.8 | 39.6 | 5.4 |
| Fluent Web Components | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 28.0 | 28.0 | 31.0 | 0.000075 | 0.000075 | 0.000075 | 0.8 | 27.2 | — |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 48.0 | 48.0 | 52.0 | 0.000000 | 0.000000 | 0.000000 | 1.0 | 46.8 | — |
| Web Awesome | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 36.0 | 36.0 | 36.0 | 0.000000 | 0.000000 | 0.000000 | 0.7 | 31.4 | — |
| En Reve · Eager reference | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 44.0 | 44.0 | 48.0 | 0.000000 | 0.000000 | 0.000000 | 0.9 | 43.5 | — |
| En Reve · Deferred construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 44.0 | 44.0 | 47.0 | 0.000000 | 0.000000 | 0.000000 | 1.0 | 42.6 | — |
| En Reve · Deferred code + construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 44.0 | 44.0 | 44.0 | 0.000000 | 0.000000 | 0.000000 | 1.0 | 42.0 | — |

### mobile cold LCP attribution

En Reve refreshed from the versioned [main acquisition](#en-reve-main-comparison); other rows retain their indicated historical acquisitions.

Spectrum refreshed from the versioned [new acquisition](#spectrum-gen2-comparison); other rows retain their indicated historical acquisitions.

Historical reference rows and the later Web Awesome acquisition are shown together for descriptive comparison. Acquisition IDs are explicit; these rows are not paired blocks. Use the supplemental contemporaneous En Reve/Fluent/Web Awesome tables for measured differences. A dash means unavailable, never zero.

LCP attribution from web-vitals. A text LCP can have zero image-resource phases; its render-delay portion includes discovery, JS/CSS/fonts and rendering, not just CPU rendering time. Independent medians are not guaranteed to sum to the median LCP. Cohort: pass2-load-matrix-v1; mobile/cold. Values are per-system sample medians unless labeled p75. Campaign complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | TTFB portion ms | Resource delay ms | Resource duration ms | Element render delay ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 16.2 | 0.0 | 0.0 | 628.4 |
| Radix React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 15.1 | 0.0 | 0.0 | 643.7 |
| Fluent React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 16.0 | 0.0 | 0.0 | 682.5 |
| Spectrum React S2 | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 15.8 | 0.0 | 0.0 | 1,368.0 |
| Astryx React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 17.5 | 0.0 | 0.0 | 768.8 |
| shadcn React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 15.4 | 0.0 | 0.0 | 691.1 |
| Fluent Web Components | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 15.5 | 0.0 | 0.0 | 496.3 |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 14.7 | 0.0 | 0.0 | 760.8 |
| Web Awesome | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 15.8 | 0.0 | 0.0 | 587.9 |

### desktop cold LCP attribution

En Reve refreshed from the versioned [main acquisition](#en-reve-main-comparison); other rows retain their indicated historical acquisitions.

Spectrum refreshed from the versioned [new acquisition](#spectrum-gen2-comparison); other rows retain their indicated historical acquisitions.

Historical reference rows and the later Web Awesome acquisition are shown together for descriptive comparison. Acquisition IDs are explicit; these rows are not paired blocks. Use the supplemental contemporaneous En Reve/Fluent/Web Awesome tables for measured differences. A dash means unavailable, never zero.

LCP attribution from web-vitals. A text LCP can have zero image-resource phases; its render-delay portion includes discovery, JS/CSS/fonts and rendering, not just CPU rendering time. Independent medians are not guaranteed to sum to the median LCP. Cohort: pass2-load-matrix-v1; desktop/cold. Values are per-system sample medians unless labeled p75. Campaign complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | TTFB portion ms | Resource delay ms | Resource duration ms | Element render delay ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 15.0 | 0.0 | 0.0 | 85.5 |
| Radix React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 14.6 | 0.0 | 0.0 | 113.4 |
| Fluent React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 15.8 | 0.0 | 0.0 | 89.2 |
| Spectrum React S2 | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 16.4 | 0.0 | 0.0 | 214.8 |
| Astryx React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 15.8 | 0.0 | 0.0 | 104.7 |
| shadcn React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 16.2 | 0.0 | 0.0 | 107.4 |
| Fluent Web Components | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 14.9 | 0.0 | 0.0 | 62.6 |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 15.0 | 0.0 | 0.0 | 96.4 |
| Web Awesome | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 15.5 | 0.0 | 0.0 | 79.7 |

## Startup usability

A separate cold-navigation suite sends one trusted mouse click at the first Landscape control geometry observed by an injected animation-frame probe. It does not wait for the load event or the usual 1.5-second settling interval. It refreshes coordinates immediately before its one click, verifies the actual composed-path target, and verifies the canvas result and a subsequent two-rAF frame opportunity. Discovery and dispatch overhead are exposed: this is an observed successful probe, **not the mathematically earliest usable instant, legacy TTI, or field FID**. Early input ends LCP eligibility, so these samples do not enter load comparisons. The probe records its cumulative synchronous discovery elapsed time, including any forced style/layout; this is not a thread-CPU measurement. The [superseded 160-sample v1 pilot](../showcases/performance/reports/pass2-startup-superseded.json) used host-side visibility polling with up to 500 ms backoff and is excluded from these comparisons. A subsequent v2 qualification had two stale-coordinate failures in Fluent WC; those are retained as invalid probe attempts. The current v3 probe passed all sixteen qualification cases before its timing cohort. [Discovery calibration](../showcases/performance/reports/startup-discovery-calibration-pass2.json) verifies the replacement. [Probe calibration](../showcases/performance/reports/startup-calibration-pass2.json) confirms that a click lost before handler attachment fails rather than being retried.

### mobile startup click

Calendar policy variants below are a separate, dated campaign; historical peers are descriptive comparisons. See [calendar policy tradeoffs](#calendar-delivery-variants).

En Reve refreshed from the versioned [main acquisition](#en-reve-main-comparison); other rows retain their indicated historical acquisitions.

Spectrum refreshed from the versioned [new acquisition](#spectrum-gen2-comparison); other rows retain their indicated historical acquisitions.

Historical reference rows and the later Web Awesome acquisition are shown together for descriptive comparison. Acquisition IDs are explicit; these rows are not paired blocks. Use the supplemental contemporaneous En Reve/Fluent/Web Awesome tables for measured differences. A dash means unavailable, never zero.

Navigation-relative timestamps include automation overhead; click-to-result/frame measures the response to that single input. Cohort: pass2-startup-v3; mobile/cold. Values are per-system sample medians unless labeled p75. Campaign complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Control observed ms | Click from navigation ms | Result from navigation ms | Result p75 ms | Dispatch overhead ms | Discovery probe ms | Click to result ms | Click to frame ms | First input delay ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-startup-v1 | 2026-09-24 | 10 | 0 | 609.7 | 628.3 | 637.5 | 647.4 | 18.8 | 0.2 | 9.8 | 44.8 | 3.0 |
| Radix React | Historical pass2-startup-v3 | 2026-09-20 | 10 | 0 | 622.6 | 645.1 | 659.9 | 662.4 | 22.3 | 2.4 | 14.4 | 44.8 | 5.3 |
| Fluent React | Historical pass2-startup-v3 | 2026-09-20 | 10 | 0 | 656.3 | 689.5 | 711.4 | 723.5 | 33.0 | 79.0 | 21.6 | 55.7 | 5.3 |
| Spectrum React S2 | Historical pass2-startup-v3 | 2026-09-20 | 10 | 0 | 945.1 | 956.6 | 988.3 | 1,002.1 | 11.5 | 0.8 | 32.0 | 64.4 | 4.5 |
| Astryx React | Historical pass2-startup-v3 | 2026-09-20 | 10 | 0 | 735.8 | 755.6 | 772.8 | 779.0 | 20.1 | 2.8 | 17.3 | 49.7 | 4.2 |
| shadcn React | Historical pass2-startup-v3 | 2026-09-20 | 10 | 0 | 684.0 | 699.4 | 715.3 | 718.3 | 15.7 | 0.4 | 15.1 | 48.1 | 5.7 |
| Fluent Web Components | Historical pass2-startup-v3 | 2026-09-20 | 10 | 0 | 442.8 | 492.6 | 500.3 | 513.0 | 50.3 | 0.6 | 7.0 | 39.1 | 4.5 |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-startup-v1 | 2026-09-22 | 10 | 0 | 744.6 | 768.7 | 786.1 | 795.5 | 23.3 | 1.1 | 17.3 | 51.4 | 11.5 |
| Web Awesome | web-awesome-startup-v1 | 2026-09-21 | 10 | 0 | 584.3 | 607.9 | 615.0 | 618.0 | 22.8 | 2.1 | 8.2 | 43.3 | 2.9 |
| En Reve · Eager reference | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 614.0 | 632.4 | 642.0 | 646.4 | 18.5 | 0.5 | 9.8 | 47.5 | 2.8 |
| En Reve · Deferred construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 600.8 | 620.0 | 630.8 | 637.4 | 19.1 | 0.7 | 11.2 | 46.6 | 4.1 |
| En Reve · Deferred code + construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 593.4 | 612.3 | 623.2 | 628.3 | 19.2 | 0.6 | 10.3 | 46.5 | 3.4 |

### desktop startup click

Calendar policy variants below are a separate, dated campaign; historical peers are descriptive comparisons. See [calendar policy tradeoffs](#calendar-delivery-variants).

En Reve refreshed from the versioned [main acquisition](#en-reve-main-comparison); other rows retain their indicated historical acquisitions.

Spectrum refreshed from the versioned [new acquisition](#spectrum-gen2-comparison); other rows retain their indicated historical acquisitions.

Historical reference rows and the later Web Awesome acquisition are shown together for descriptive comparison. Acquisition IDs are explicit; these rows are not paired blocks. Use the supplemental contemporaneous En Reve/Fluent/Web Awesome tables for measured differences. A dash means unavailable, never zero.

Navigation-relative timestamps include automation overhead; click-to-result/frame measures the response to that single input. Cohort: pass2-startup-v3; desktop/cold. Values are per-system sample medians unless labeled p75. Campaign complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Control observed ms | Click from navigation ms | Result from navigation ms | Result p75 ms | Dispatch overhead ms | Discovery probe ms | Click to result ms | Click to frame ms | First input delay ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-startup-v1 | 2026-09-24 | 10 | 0 | 85.7 | 90.9 | 92.9 | 94.3 | 5.0 | 0.1 | 2.0 | 35.6 | 0.7 |
| Radix React | Historical pass2-startup-v3 | 2026-09-20 | 10 | 0 | 79.5 | 84.8 | 88.4 | 89.6 | 5.3 | 0.5 | 3.2 | 40.5 | — |
| Fluent React | Historical pass2-startup-v3 | 2026-09-20 | 10 | 0 | 84.2 | 91.3 | 98.8 | 102.9 | 7.3 | 17.4 | 6.8 | 35.2 | — |
| Spectrum React S2 | Historical pass2-startup-v3 | 2026-09-20 | 10 | 0 | 165.0 | 169.3 | 177.1 | 180.1 | 4.1 | 31.7 | 7.7 | 38.2 | 0.7 |
| Astryx React | Historical pass2-startup-v3 | 2026-09-20 | 10 | 0 | 95.8 | 101.1 | 105.1 | 106.6 | 5.1 | 0.6 | 4.0 | 31.1 | 1.0 |
| shadcn React | Historical pass2-startup-v3 | 2026-09-20 | 10 | 0 | 91.3 | 121.5 | 125.7 | 134.0 | 30.1 | 0.0 | 4.2 | 28.4 | 2.0 |
| Fluent Web Components | Historical pass2-startup-v3 | 2026-09-20 | 10 | 0 | 59.6 | 72.2 | 73.2 | 74.7 | 12.1 | 0.1 | 1.1 | 35.0 | — |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-startup-v1 | 2026-09-22 | 10 | 0 | 95.1 | 101.0 | 104.3 | 108.3 | 5.8 | 0.2 | 3.1 | 35.9 | — |
| Web Awesome | web-awesome-startup-v1 | 2026-09-21 | 10 | 0 | 81.3 | 88.7 | 90.8 | 93.0 | 7.5 | 0.4 | 1.6 | 29.8 | 0.7 |
| En Reve · Eager reference | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 86.1 | 91.5 | 93.7 | 94.3 | 5.5 | 0.1 | 2.2 | 38.0 | 0.8 |
| En Reve · Deferred construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 82.7 | 88.1 | 90.5 | 92.8 | 5.5 | 0.1 | 2.3 | 31.0 | 1.0 |
| En Reve · Deferred code + construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 82.6 | 88.4 | 90.5 | 92.0 | 5.8 | 0.1 | 2.2 | 30.7 | 0.7 |

## Production files and chunking

Deterministic emitted asset sizes for the complete fixture, including application and framework/runtime code, before and after transport compression. These are not library-only marginal costs. Raw JS means production/minified bytes before gzip or Brotli, not browser compiled-code memory. All emitted chunks are counted even if not initially downloaded. CSS-in-JS remains in JS. Local-font columns exclude remote fonts, which are counted in browser transfer below. HTML is the actual CSR shell; **no SSR/hydration cohort has been built or measured in this pass**.

### Production payload sizes

En Reve refreshed from the versioned [main acquisition](#en-reve-main-comparison); other rows retain their indicated historical acquisitions.

Spectrum refreshed from the versioned [new acquisition](#spectrum-gen2-comparison); other rows retain their indicated historical acquisitions.

Historical reference rows and the later Web Awesome acquisition are shown together for descriptive comparison. Acquisition IDs are explicit; these rows are not paired blocks. Use the supplemental contemporaneous En Reve/Fluent/Web Awesome tables for measured differences. A dash means unavailable, never zero.

Frozen production assets; one deterministic build per implementation. Source maps and diagnostic metadata are excluded.

| Implementation | Run ID | Date (UTC) | JS raw KiB | JS gzip KiB | JS Brotli KiB | Initial JS Brotli KiB | CSS raw KiB | CSS Brotli KiB | Local fonts Brotli KiB | HTML raw KiB | HTML Brotli KiB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | reports/en-reve-main/bundles.json | — | 439.5 | 108.3 | 86.9 | 86.9 | 43.5 | 5.9 | 0.0 | 0.351 | 0.157 |
| Radix React | Historical bundles.json | — | 406.5 | 120.6 | 102.9 | 102.9 | 670.8 | 49.0 | 0.0 | 0.354 | 0.159 |
| Fluent React | Historical bundles.json | — | 799.0 | 218.3 | 170.8 | 170.8 | 3.3 | 1.0 | 0.0 | 0.355 | 0.160 |
| Spectrum React S2 | Historical bundles.json | — | 980.8 | 278.8 | 216.3 | 216.3 | 65.2 | 11.3 | 0.0 | 0.357 | 0.165 |
| Astryx React | Historical bundles.json | — | 722.2 | 211.5 | 174.2 | 174.0 | 191.7 | 26.5 | 0.0 | 0.355 | 0.163 |
| shadcn React | Historical bundles.json | — | 526.4 | 164.9 | 138.6 | 138.6 | 77.0 | 10.8 | 68.1 | 0.355 | 0.164 |
| Fluent Web Components | Historical bundles.json | — | 281.2 | 69.3 | 57.1 | 57.1 | 4.2 | 1.2 | 0.0 | 0.364 | 0.173 |
| Spectrum WC Gen2 + Gen1 | reports/spectrum-gen2/bundles.json | — | 1,291.5 | 236.9 | 185.4 | 171.3 | 117.6 | 14.0 | 0.0 | 1.310 | 0.346 |
| Web Awesome | reports/web-awesome/bundles.json | — | 469.8 | 110.5 | 86.4 | 86.4 | 53.4 | 4.9 | 0.0 | 0.409 | 0.167 |

### Chunk structure

En Reve refreshed from the versioned [main acquisition](#en-reve-main-comparison); other rows retain their indicated historical acquisitions.

Spectrum refreshed from the versioned [new acquisition](#spectrum-gen2-comparison); other rows retain their indicated historical acquisitions.

Historical reference rows and the later Web Awesome acquisition are shown together for descriptive comparison. Acquisition IDs are explicit; these rows are not paired blocks. Use the supplemental contemporaneous En Reve/Fluent/Web Awesome tables for measured differences. A dash means unavailable, never zero.

These are the emitted graphs of the current native fixtures, not a ceiling on each library’s possible splitting. A dynamic edge is a capability to load later, not proof of initial-byte savings. Sources in multiple chunks need inspection before treating them as removable duplication.

| Implementation | Run ID | Date (UTC) | JS files | CSS files | Static initial assets | Dynamic import edges | Sources in multiple chunks |
| --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | reports/en-reve-main/bundles.json | — | 1 | 1 | 2 | 0 | 0 |
| Radix React | Historical bundles.json | — | 1 | 1 | 2 | 0 | 0 |
| Fluent React | Historical bundles.json | — | 1 | 1 | 2 | 0 | 0 |
| Spectrum React S2 | Historical bundles.json | — | 1 | 1 | 2 | 0 | 0 |
| Astryx React | Historical bundles.json | — | 2 | 1 | 2 | 1 | 0 |
| shadcn React | Historical bundles.json | — | 1 | 1 | 2 | 0 | 0 |
| Fluent Web Components | Historical bundles.json | — | 1 | 1 | 2 | 0 | 0 |
| Spectrum WC Gen2 + Gen1 | reports/spectrum-gen2/bundles.json | — | 18 | 1 | 14 | 9 | 0 |
| Web Awesome | reports/web-awesome/bundles.json | — | 1 | 1 | 2 | 0 | 0 |

## Whole-page delivery

**Browser-reported response transfer includes the HTML document, scripts, styles, fonts and other responses.** It uses completed CDP response byte counts captured before leaving the page; lifecycle beacons and destination pages are excluded. These are response bytes, not packet captures of TCP/TLS traffic. Resource Timing totals are retained separately because its header accounting and cache/privacy rules differ. Cache reuse counts timing entries with zero transfer and a positive encoded body size, including memory-cache reuse not represented by the CDP disk-cache flag. A missing completion makes the total unavailable; missing resources are not free. Load tables cover the bounded load visit, not future clicks. Separate cumulative interaction-journey tables include requests made by the tested actions; offline all-JS inventory also includes chunks never requested in either journey.

### mobile cold response transfer

Calendar policy variants below are a separate, dated campaign; historical peers are descriptive comparisons. See [calendar policy tradeoffs](#calendar-delivery-variants).

En Reve refreshed from the versioned [main acquisition](#en-reve-main-comparison); other rows retain their indicated historical acquisitions.

Spectrum refreshed from the versioned [new acquisition](#spectrum-gen2-comparison); other rows retain their indicated historical acquisitions.

Historical reference rows and the later Web Awesome acquisition are shown together for descriptive comparison. Acquisition IDs are explicit; these rows are not paired blocks. Use the supplemental contemporaneous En Reve/Fluent/Web Awesome tables for measured differences. A dash means unavailable, never zero.

Response categories are measured in each sample. Independently calculated medians need not sum exactly to the median total. Cohort: pass2-load-matrix-v1; mobile/cold. Values are per-system sample medians unless labeled p75. Campaign complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 93.5 | 0.328 | 87.1 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| Radix React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 152.5 | 0.331 | 103.1 | 49.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| Fluent React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 172.4 | 0.331 | 170.9 | 1.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| Spectrum React S2 | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 699.9 | 0.336 | 216.5 | 11.4 | 471.7 | 0.0 | 5 | 1 | 0 |
| Astryx React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 201.2 | 0.334 | 174.2 | 26.7 | 0.0 | 0.0 | 3 | 0 | 0 |
| shadcn React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 218.4 | 0.335 | 138.8 | 10.9 | 68.3 | 0.0 | 4 | 0 | 0 |
| Fluent Web Components | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 58.9 | 0.344 | 57.2 | 1.3 | 0.0 | 0.0 | 3 | 0 | 0 |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 187.2 | 0.516 | 172.5 | 14.1 | 0.0 | 0.0 | 15 | 0 | 0 |
| Web Awesome | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 91.9 | 0.336 | 86.5 | 5.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| En Reve · Eager reference | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 93.5 | 0.328 | 87.1 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| En Reve · Deferred construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 93.4 | 0.328 | 87.0 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| En Reve · Deferred code + construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 90.7 | 0.324 | 84.3 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |

### mobile warm response transfer

Calendar policy variants below are a separate, dated campaign; historical peers are descriptive comparisons. See [calendar policy tradeoffs](#calendar-delivery-variants).

En Reve refreshed from the versioned [main acquisition](#en-reve-main-comparison); other rows retain their indicated historical acquisitions.

Spectrum refreshed from the versioned [new acquisition](#spectrum-gen2-comparison); other rows retain their indicated historical acquisitions.

Historical reference rows and the later Web Awesome acquisition are shown together for descriptive comparison. Acquisition IDs are explicit; these rows are not paired blocks. Use the supplemental contemporaneous En Reve/Fluent/Web Awesome tables for measured differences. A dash means unavailable, never zero.

Response categories are measured in each sample. Independently calculated medians need not sum exactly to the median total. Cohort: pass2-load-matrix-v1; mobile/warm. Values are per-system sample medians unless labeled p75. Campaign complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 0.2 | 0.246 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| Radix React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 0.2 | 0.249 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| Fluent React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 0.2 | 0.249 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| Spectrum React S2 | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 0.3 | 0.254 | 0.0 | 0.0 | 0.0 | 0.0 | 5 | 4 | 0 |
| Astryx React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 0.3 | 0.252 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| shadcn React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 0.3 | 0.253 | 0.0 | 0.0 | 0.0 | 0.0 | 4 | 3 | 0 |
| Fluent Web Components | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 0.3 | 0.262 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 0.4 | 0.434 | 0.0 | 0.0 | 0.0 | 0.0 | 15 | 14 | 0 |
| Web Awesome | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 0.3 | 0.254 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| En Reve · Eager reference | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 0.2 | 0.246 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| En Reve · Deferred construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 0.2 | 0.246 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| En Reve · Deferred code + construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 0.2 | 0.242 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |

### desktop cold response transfer

Calendar policy variants below are a separate, dated campaign; historical peers are descriptive comparisons. See [calendar policy tradeoffs](#calendar-delivery-variants).

En Reve refreshed from the versioned [main acquisition](#en-reve-main-comparison); other rows retain their indicated historical acquisitions.

Spectrum refreshed from the versioned [new acquisition](#spectrum-gen2-comparison); other rows retain their indicated historical acquisitions.

Historical reference rows and the later Web Awesome acquisition are shown together for descriptive comparison. Acquisition IDs are explicit; these rows are not paired blocks. Use the supplemental contemporaneous En Reve/Fluent/Web Awesome tables for measured differences. A dash means unavailable, never zero.

Response categories are measured in each sample. Independently calculated medians need not sum exactly to the median total. Cohort: pass2-load-matrix-v1; desktop/cold. Values are per-system sample medians unless labeled p75. Campaign complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 93.5 | 0.328 | 87.1 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| Radix React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 152.5 | 0.331 | 103.1 | 49.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| Fluent React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 172.4 | 0.331 | 170.9 | 1.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| Spectrum React S2 | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 699.9 | 0.336 | 216.5 | 11.4 | 471.7 | 0.0 | 5 | 1 | 0 |
| Astryx React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 201.2 | 0.334 | 174.2 | 26.7 | 0.0 | 0.0 | 3 | 0 | 0 |
| shadcn React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 218.4 | 0.335 | 138.8 | 10.9 | 68.3 | 0.0 | 4 | 0 | 0 |
| Fluent Web Components | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 58.9 | 0.344 | 57.2 | 1.3 | 0.0 | 0.0 | 3 | 0 | 0 |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 187.2 | 0.516 | 172.5 | 14.1 | 0.0 | 0.0 | 15 | 0 | 0 |
| Web Awesome | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 91.9 | 0.336 | 86.5 | 5.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| En Reve · Eager reference | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 93.5 | 0.328 | 87.1 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| En Reve · Deferred construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 93.4 | 0.328 | 87.0 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| En Reve · Deferred code + construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 90.7 | 0.324 | 84.3 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |

### desktop warm response transfer

Calendar policy variants below are a separate, dated campaign; historical peers are descriptive comparisons. See [calendar policy tradeoffs](#calendar-delivery-variants).

En Reve refreshed from the versioned [main acquisition](#en-reve-main-comparison); other rows retain their indicated historical acquisitions.

Spectrum refreshed from the versioned [new acquisition](#spectrum-gen2-comparison); other rows retain their indicated historical acquisitions.

Historical reference rows and the later Web Awesome acquisition are shown together for descriptive comparison. Acquisition IDs are explicit; these rows are not paired blocks. Use the supplemental contemporaneous En Reve/Fluent/Web Awesome tables for measured differences. A dash means unavailable, never zero.

Response categories are measured in each sample. Independently calculated medians need not sum exactly to the median total. Cohort: pass2-load-matrix-v1; desktop/warm. Values are per-system sample medians unless labeled p75. Campaign complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 0.2 | 0.246 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| Radix React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 0.2 | 0.249 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| Fluent React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 0.2 | 0.249 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| Spectrum React S2 | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 0.3 | 0.254 | 0.0 | 0.0 | 0.0 | 0.0 | 5 | 4 | 0 |
| Astryx React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 0.3 | 0.252 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| shadcn React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 0.3 | 0.253 | 0.0 | 0.0 | 0.0 | 0.0 | 4 | 3 | 0 |
| Fluent Web Components | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 0.3 | 0.262 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 0.4 | 0.434 | 0.0 | 0.0 | 0.0 | 0.0 | 15 | 14 | 0 |
| Web Awesome | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 0.3 | 0.254 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| En Reve · Eager reference | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 0.2 | 0.246 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| En Reve · Deferred construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 0.2 | 0.246 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| En Reve · Deferred code + construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 0.2 | 0.242 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |

### mobile cumulative interaction transfer

En Reve refreshed from the versioned [main acquisition](#en-reve-main-comparison); other rows retain their indicated historical acquisitions.

Spectrum refreshed from the versioned [new acquisition](#spectrum-gen2-comparison); other rows retain their indicated historical acquisitions.

Historical reference rows and the later Web Awesome acquisition are shown together for descriptive comparison. Acquisition IDs are explicit; these rows are not paired blocks. Use the supplemental contemporaneous En Reve/Fluent/Web Awesome tables for measured differences. A dash means unavailable, never zero.

Fresh page plus the complete successful scripted interaction journey. This is a cumulative total from a different cohort, not the incremental cost of one action or the difference of two medians. Cohort: pass2-interactions-v1; mobile/cold. Values are per-system sample medians unless labeled p75. Campaign complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-interactions-v1 | 2026-09-24 | 10 | 0 | 93.5 | 0.328 | 87.1 | 6.1 | 0.0 | 0 |
| Radix React | Historical pass2-interactions-v1 | 2026-09-20 | 10 | 0 | 152.5 | 0.331 | 103.1 | 49.1 | 0.0 | 0 |
| Fluent React | Historical pass2-interactions-v1 | 2026-09-20 | 10 | 0 | 172.4 | 0.331 | 170.9 | 1.1 | 0.0 | 0 |
| Spectrum React S2 | Historical pass2-interactions-v1 | 2026-09-20 | 10 | 0 | 699.9 | 0.336 | 216.5 | 11.4 | 471.7 | 0 |
| Astryx React | Historical pass2-interactions-v1 | 2026-09-20 | 10 | 0 | 201.2 | 0.334 | 174.2 | 26.7 | 0.0 | 0 |
| shadcn React | Historical pass2-interactions-v1 | 2026-09-20 | 10 | 0 | 218.4 | 0.335 | 138.8 | 10.9 | 68.3 | 0 |
| Fluent Web Components | Historical pass2-interactions-v1 | 2026-09-20 | 10 | 0 | 58.9 | 0.344 | 57.2 | 1.3 | 0.0 | 0 |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-interactions-v1 | 2026-09-22 | 0 | 10 | — | — | — | — | — | — |
| Web Awesome | web-awesome-interactions-v1 | 2026-09-21 | 10 | 0 | 91.9 | 0.336 | 86.5 | 5.1 | 0.0 | 0 |

### desktop cumulative interaction transfer

En Reve refreshed from the versioned [main acquisition](#en-reve-main-comparison); other rows retain their indicated historical acquisitions.

Spectrum refreshed from the versioned [new acquisition](#spectrum-gen2-comparison); other rows retain their indicated historical acquisitions.

Historical reference rows and the later Web Awesome acquisition are shown together for descriptive comparison. Acquisition IDs are explicit; these rows are not paired blocks. Use the supplemental contemporaneous En Reve/Fluent/Web Awesome tables for measured differences. A dash means unavailable, never zero.

Fresh page plus the complete successful scripted interaction journey. This is a cumulative total from a different cohort, not the incremental cost of one action or the difference of two medians. Cohort: pass2-interactions-v1; desktop/cold. Values are per-system sample medians unless labeled p75. Campaign complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-interactions-v1 | 2026-09-24 | 10 | 0 | 93.5 | 0.328 | 87.1 | 6.1 | 0.0 | 0 |
| Radix React | Historical pass2-interactions-v1 | 2026-09-20 | 10 | 0 | 152.5 | 0.331 | 103.1 | 49.1 | 0.0 | 0 |
| Fluent React | Historical pass2-interactions-v1 | 2026-09-20 | 10 | 0 | 172.4 | 0.331 | 170.9 | 1.1 | 0.0 | 0 |
| Spectrum React S2 | Historical pass2-interactions-v1 | 2026-09-20 | 10 | 0 | 699.9 | 0.336 | 216.5 | 11.4 | 471.7 | 0 |
| Astryx React | Historical pass2-interactions-v1 | 2026-09-20 | 10 | 0 | 201.2 | 0.334 | 174.2 | 26.7 | 0.0 | 0 |
| shadcn React | Historical pass2-interactions-v1 | 2026-09-20 | 10 | 0 | 218.4 | 0.335 | 138.8 | 10.9 | 68.3 | 0 |
| Fluent Web Components | Historical pass2-interactions-v1 | 2026-09-20 | 10 | 0 | 58.9 | 0.344 | 57.2 | 1.3 | 0.0 | 0 |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-interactions-v1 | 2026-09-22 | 10 | 0 | 192.2 | 0.516 | 177.6 | 14.1 | 0.0 | 0 |
| Web Awesome | web-awesome-interactions-v1 | 2026-09-21 | 10 | 0 | 91.9 | 0.336 | 86.5 | 5.1 | 0.0 | 0 |

## Main-thread work and load blocking

CDP script/style/layout/task counters are captured at the bounded load endpoint. The [counter-scope calibration](../showcases/performance/reports/cdp-scope-calibration-pass2.json) checks that prior-document work is excluded in this pinned browser/navigation pattern. They are not a decomposition of LCP and can overlap. Long-task and long-animation-frame totals sum whole durations, **not TBT**, and are not additive to one another. The two blocking-excess columns count only each long task’s portion beyond 50 ms, clipped before FCP or from FCP to the bounded observation endpoint. They are named separately from Lighthouse TBT, whose endpoint differs. Lighthouse TBT is reported in its separate cohort below.

### mobile cold main-thread work

Calendar policy variants below are a separate, dated campaign; historical peers are descriptive comparisons. See [calendar policy tradeoffs](#calendar-delivery-variants).

En Reve refreshed from the versioned [main acquisition](#en-reve-main-comparison); other rows retain their indicated historical acquisitions.

Spectrum refreshed from the versioned [new acquisition](#spectrum-gen2-comparison); other rows retain their indicated historical acquisitions.

Historical reference rows and the later Web Awesome acquisition are shown together for descriptive comparison. Acquisition IDs are explicit; these rows are not paired blocks. Use the supplemental contemporaneous En Reve/Fluent/Web Awesome tables for measured differences. A dash means unavailable, never zero.

Use traces to test which costs actually lie on the critical path before assigning implementation work. Cohort: pass2-load-matrix-v1; mobile/cold. Values are per-system sample medians unless labeled p75. Campaign complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Script ms | Style ms | Layout ms | Task ms | Layout passes | Style recalcs | Long tasks ms | Pre-FCP blocking excess ms | Post-FCP blocking excess ms | Long animation frames ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 86.7 | 59.7 | 32.0 | 371.7 | 7 | 11 | 288.5 | 238.5 | 0.0 | 411.3 |
| Radix React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 152.9 | 43.9 | 54.5 | 333.3 | 5 | 6 | 191.0 | 141.0 | 0.0 | 414.4 |
| Fluent React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 193.9 | 40.8 | 53.9 | 361.2 | 5 | 6 | 270.5 | 120.5 | 0.0 | 367.6 |
| Spectrum React S2 | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 386.1 | 76.3 | 201.1 | 756.1 | 13 | 22 | 657.5 | 398.0 | 108.0 | 790.7 |
| Astryx React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 222.5 | 34.4 | 64.0 | 409.7 | 4 | 9 | 311.0 | 211.0 | 0.0 | 487.9 |
| shadcn React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 195.4 | 38.1 | 189.3 | 504.4 | 4 | 6 | 371.5 | 207.0 | 66.0 | 503.3 |
| Fluent Web Components | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 116.4 | 42.1 | 38.6 | 277.1 | 5 | 10 | 153.5 | 103.5 | 0.0 | 297.4 |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 106.7 | 71.7 | 49.9 | 410.8 | 11 | 25 | 296.0 | 246.0 | 0.0 | 482.6 |
| Web Awesome | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 79.7 | 43.3 | 34.0 | 345.5 | 4 | 6 | 244.0 | 194.0 | 0.0 | 366.8 |
| En Reve · Eager reference | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 86.2 | 60.4 | 31.4 | 375.4 | 7 | 11 | 287.0 | 237.0 | 0.0 | 410.8 |
| En Reve · Deferred construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 86.7 | 60.9 | 32.7 | 372.0 | 7 | 11 | 281.5 | 231.5 | 0.0 | 404.1 |
| En Reve · Deferred code + construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 85.4 | 63.2 | 33.9 | 372.8 | 7 | 11 | 283.5 | 233.5 | 0.0 | 406.7 |

### mobile warm main-thread work

Calendar policy variants below are a separate, dated campaign; historical peers are descriptive comparisons. See [calendar policy tradeoffs](#calendar-delivery-variants).

En Reve refreshed from the versioned [main acquisition](#en-reve-main-comparison); other rows retain their indicated historical acquisitions.

Spectrum refreshed from the versioned [new acquisition](#spectrum-gen2-comparison); other rows retain their indicated historical acquisitions.

Historical reference rows and the later Web Awesome acquisition are shown together for descriptive comparison. Acquisition IDs are explicit; these rows are not paired blocks. Use the supplemental contemporaneous En Reve/Fluent/Web Awesome tables for measured differences. A dash means unavailable, never zero.

Use traces to test which costs actually lie on the critical path before assigning implementation work. Cohort: pass2-load-matrix-v1; mobile/warm. Values are per-system sample medians unless labeled p75. Campaign complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Script ms | Style ms | Layout ms | Task ms | Layout passes | Style recalcs | Long tasks ms | Pre-FCP blocking excess ms | Post-FCP blocking excess ms | Long animation frames ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 57.1 | 43.9 | 13.2 | 244.3 | 7 | 11 | 167.0 | 117.0 | 0.0 | 170.2 |
| Radix React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 64.0 | 17.0 | 7.7 | 154.4 | 5 | 6 | 75.0 | 25.0 | 0.0 | 101.4 |
| Fluent React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 73.1 | 18.1 | 6.4 | 174.6 | 5 | 6 | 55.0 | 5.0 | 0.0 | 95.2 |
| Spectrum React S2 | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 179.7 | 33.9 | 161.4 | 477.2 | 11 | 20 | 360.5 | 310.5 | 0.0 | 372.1 |
| Astryx React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 82.1 | 30.1 | 6.7 | 190.3 | 4 | 9 | 103.5 | 53.5 | 0.0 | 126.7 |
| shadcn React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 66.8 | 14.2 | 44.4 | 194.9 | 3 | 5 | 113.0 | 63.0 | 0.0 | 133.8 |
| Fluent Web Components | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 57.5 | 19.3 | 9.0 | 160.2 | 5 | 10 | 70.0 | 20.0 | 0.0 | 84.8 |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 50.3 | 44.6 | 11.2 | 242.3 | 11 | 25 | 146.0 | 96.0 | 0.0 | 153.5 |
| Web Awesome | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 47.3 | 15.8 | 7.4 | 192.1 | 4 | 6 | 110.5 | 60.5 | 0.0 | 114.3 |
| En Reve · Eager reference | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 54.0 | 42.8 | 13.7 | 240.1 | 7 | 11 | 163.0 | 113.0 | 0.0 | 166.6 |
| En Reve · Deferred construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 55.9 | 44.0 | 14.1 | 238.0 | 7 | 11 | 161.5 | 111.5 | 0.0 | 165.0 |
| En Reve · Deferred code + construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 55.6 | 42.6 | 14.0 | 235.4 | 7 | 11 | 160.5 | 110.5 | 0.0 | 164.4 |

### desktop cold main-thread work

Calendar policy variants below are a separate, dated campaign; historical peers are descriptive comparisons. See [calendar policy tradeoffs](#calendar-delivery-variants).

En Reve refreshed from the versioned [main acquisition](#en-reve-main-comparison); other rows retain their indicated historical acquisitions.

Spectrum refreshed from the versioned [new acquisition](#spectrum-gen2-comparison); other rows retain their indicated historical acquisitions.

Historical reference rows and the later Web Awesome acquisition are shown together for descriptive comparison. Acquisition IDs are explicit; these rows are not paired blocks. Use the supplemental contemporaneous En Reve/Fluent/Web Awesome tables for measured differences. A dash means unavailable, never zero.

Use traces to test which costs actually lie on the critical path before assigning implementation work. Cohort: pass2-load-matrix-v1; desktop/cold. Values are per-system sample medians unless labeled p75. Campaign complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Script ms | Style ms | Layout ms | Task ms | Layout passes | Style recalcs | Long tasks ms | Pre-FCP blocking excess ms | Post-FCP blocking excess ms | Long animation frames ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 17.6 | 12.6 | 6.3 | 78.8 | 7 | 11 | 58.5 | 8.5 | 0.0 | 60.9 |
| Radix React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 32.6 | 10.3 | 12.4 | 76.1 | 5 | 6 | 0.0 | 0.0 | 0.0 | 51.2 |
| Fluent React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 41.7 | 9.4 | 11.1 | 79.2 | 5 | 6 | 0.0 | 0.0 | 0.0 | 0.0 |
| Spectrum React S2 | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 83.6 | 17.5 | 47.1 | 170.6 | 13 | 20 | 89.0 | 39.0 | 0.0 | 108.6 |
| Astryx React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 48.0 | 7.2 | 15.4 | 91.5 | 4 | 9 | 52.5 | 2.5 | 0.0 | 58.8 |
| shadcn React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 43.7 | 8.9 | 48.5 | 119.4 | 4 | 6 | 60.5 | 10.5 | 0.0 | 81.5 |
| Fluent Web Components | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 23.7 | 9.3 | 7.8 | 60.4 | 5 | 10 | 0.0 | 0.0 | 0.0 | 0.0 |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 23.0 | 16.3 | 10.8 | 96.8 | 11 | 23 | 64.0 | 14.0 | 0.0 | 66.5 |
| Web Awesome | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 16.2 | 10.5 | 7.3 | 73.7 | 4 | 6 | 51.0 | 1.0 | 0.0 | 54.9 |
| En Reve · Eager reference | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 17.3 | 12.5 | 6.3 | 77.8 | 7 | 11 | 57.5 | 7.5 | 0.0 | 59.5 |
| En Reve · Deferred construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 18.2 | 12.8 | 6.4 | 77.9 | 7 | 11 | 56.5 | 6.5 | 0.0 | 58.8 |
| En Reve · Deferred code + construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 17.0 | 12.3 | 6.0 | 74.6 | 7 | 11 | 54.0 | 4.0 | 0.0 | 57.5 |

### desktop warm main-thread work

Calendar policy variants below are a separate, dated campaign; historical peers are descriptive comparisons. See [calendar policy tradeoffs](#calendar-delivery-variants).

En Reve refreshed from the versioned [main acquisition](#en-reve-main-comparison); other rows retain their indicated historical acquisitions.

Spectrum refreshed from the versioned [new acquisition](#spectrum-gen2-comparison); other rows retain their indicated historical acquisitions.

Historical reference rows and the later Web Awesome acquisition are shown together for descriptive comparison. Acquisition IDs are explicit; these rows are not paired blocks. Use the supplemental contemporaneous En Reve/Fluent/Web Awesome tables for measured differences. A dash means unavailable, never zero.

Use traces to test which costs actually lie on the critical path before assigning implementation work. Cohort: pass2-load-matrix-v1; desktop/warm. Values are per-system sample medians unless labeled p75. Campaign complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Script ms | Style ms | Layout ms | Task ms | Layout passes | Style recalcs | Long tasks ms | Pre-FCP blocking excess ms | Post-FCP blocking excess ms | Long animation frames ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-load-v1 | 2026-09-24 | 10 | 0 | 11.8 | 8.7 | 3.0 | 50.8 | 6 | 11 | 0.0 | 0.0 | 0.0 | 0.0 |
| Radix React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 13.1 | 3.6 | 1.7 | 34.4 | 4 | 5 | 0.0 | 0.0 | 0.0 | 0.0 |
| Fluent React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 15.8 | 3.7 | 1.5 | 39.3 | 5 | 6 | 0.0 | 0.0 | 0.0 | 0.0 |
| Spectrum React S2 | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 36.6 | 7.2 | 36.0 | 107.9 | 11 | 19 | 75.5 | 25.5 | 0.0 | 85.2 |
| Astryx React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 17.5 | 5.9 | 1.4 | 42.4 | 4 | 8 | 0.0 | 0.0 | 0.0 | 0.0 |
| shadcn React | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 13.9 | 2.9 | 10.2 | 43.6 | 3 | 5 | 0.0 | 0.0 | 0.0 | 0.0 |
| Fluent Web Components | Historical pass2-load-matrix-v1 | 2026-09-20 | 10 | 0 | 11.4 | 3.7 | 2.0 | 34.0 | 4 | 9 | 0.0 | 0.0 | 0.0 | 0.0 |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 0 | 12.2 | 9.9 | 2.5 | 59.5 | 10 | 23 | 0.0 | 0.0 | 0.0 | 0.0 |
| Web Awesome | web-awesome-load-v1 | 2026-09-21 | 10 | 0 | 9.6 | 3.5 | 1.8 | 42.5 | 4 | 5 | 0.0 | 0.0 | 0.0 | 0.0 |
| En Reve · Eager reference | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 12.0 | 8.8 | 3.1 | 51.9 | 6 | 11 | 0.0 | 0.0 | 0.0 | 0.0 |
| En Reve · Deferred construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 11.7 | 8.8 | 3.1 | 50.5 | 6 | 11 | 0.0 | 0.0 | 0.0 | 0.0 |
| En Reve · Deferred code + construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 11.7 | 8.9 | 3.1 | 50.1 | 6 | 11 | 0.0 | 0.0 | 0.0 | 0.0 |

### Repeated mobile Lighthouse audits

Calendar policy variants below are a separate, dated campaign; historical peers are descriptive comparisons. See [calendar policy tradeoffs](#calendar-delivery-variants).

En Reve refreshed from the versioned [main acquisition](#en-reve-main-comparison); other rows retain their indicated historical acquisitions.

Spectrum refreshed from the versioned [new acquisition](#spectrum-gen2-comparison); other rows retain their indicated historical acquisitions.

Historical reference rows and the later Web Awesome acquisition are shown together for descriptive comparison. Acquisition IDs are explicit; these rows are not paired blocks. Use the supplemental contemporaneous En Reve/Fluent/Web Awesome tables for measured differences. A dash means unavailable, never zero.

Five fresh full-Chromium audits per implementation, separate from the headless-shell load suite. Only Lighthouse applies DevTools throttling. TBT counts the blocking portion of long tasks after FCP; zero TBT does not mean no startup work. Cohort: pass2-lighthouse-v1; mobile/cold. Values are per-system sample medians unless labeled p75. Campaign complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | FCP ms | LCP ms | LCP p75 ms | LCP max ms | TBT ms | TBT p75 ms | TBT max ms | Speed Index ms | CLS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-lighthouse-v1 | 2026-09-24 | 5 | 0 | 779.4 | 779.4 | 785.5 | 866.9 | 0.0 | 0.0 | 0.0 | 627.0 | 0.000000 |
| Radix React | Historical pass2-lighthouse-v1 | 2026-09-20 | 5 | 0 | 741.6 | 741.6 | 750.7 | 843.6 | 0.0 | 0.0 | 0.0 | 744.0 | 0.000000 |
| Fluent React | Historical pass2-lighthouse-v1 | 2026-09-20 | 5 | 0 | 734.4 | 734.4 | 738.4 | 915.9 | 0.0 | 0.0 | 0.0 | 736.0 | 0.000000 |
| Spectrum React S2 | Historical pass2-lighthouse-v1 | 2026-09-20 | 5 | 0 | 1,059.6 | 1,378.0 | 1,385.8 | 1,399.2 | 128.6 | 134.5 | 145.3 | 1,130.0 | 0.025341 |
| Astryx React | Historical pass2-lighthouse-v1 | 2026-09-20 | 5 | 0 | 838.4 | 838.4 | 847.3 | 946.8 | 0.0 | 0.0 | 0.0 | 840.0 | 0.000000 |
| shadcn React | Historical pass2-lighthouse-v1 | 2026-09-20 | 5 | 0 | 786.9 | 786.9 | 787.5 | 864.5 | 82.2 | 107.7 | 113.5 | 804.0 | 0.000986 |
| Fluent Web Components | Historical pass2-lighthouse-v1 | 2026-09-20 | 5 | 0 | 582.4 | 582.4 | 586.1 | 608.7 | 0.0 | 0.0 | 0.0 | 584.0 | 0.000000 |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-lighthouse-v1 | 2026-09-22 | 5 | 0 | 958.8 | 958.8 | 967.9 | 973.4 | 0.0 | 0.0 | 0.0 | 961.0 | 0.000000 |
| Web Awesome | web-awesome-lighthouse-v1 | 2026-09-21 | 5 | 0 | 765.6 | 765.6 | 781.7 | 796.7 | 0.0 | 0.0 | 0.0 | 581.0 | 0.000000 |
| En Reve · Eager reference | calendar-variants-lighthouse-v1 | 2026-09-24 | 5 | 0 | 789.6 | 789.6 | 791.7 | 824.7 | 0.0 | 0.0 | 0.0 | 631.0 | 0.000000 |
| En Reve · Deferred construction | calendar-variants-lighthouse-v1 | 2026-09-24 | 5 | 0 | 745.8 | 745.8 | 750.4 | 758.5 | 0.0 | 0.0 | 0.0 | 604.0 | 0.000000 |
| En Reve · Deferred code + construction | calendar-variants-lighthouse-v1 | 2026-09-24 | 5 | 0 | 753.3 | 753.3 | 754.0 | 773.6 | 0.0 | 0.0 | 0.0 | 607.0 | 0.000000 |

## Interaction responsiveness

These journeys begin after load plus settling. They test first/repeated canvas changes, asset edits, dialogs, review submission and command opening. These seven reported actions do not cover every component; calendar/picker, typing and keyboard-specific performance require additional scenarios before optimizing those paths. Scripted-session INP is not field INP. First-input delay comes from the browser first-input entry for a scripted trusted input; it excludes handler and rendering time and is not a field FID sample. A failed journey contributes to failure counts and not to successful timing distributions; an empty timing cell does not mean unsupported or zero. Event Timing has a 16 ms reporting threshold and quantization. Semantic completion is observed DOM state; frame opportunity is two rAFs, not a compositor presentation timestamp.

### mobile interaction summary

Calendar policy variants below are a separate, dated campaign; historical peers are descriptive comparisons. See [calendar policy tradeoffs](#calendar-delivery-variants).

En Reve refreshed from the versioned [main acquisition](#en-reve-main-comparison); other rows retain their indicated historical acquisitions.

Spectrum refreshed from the versioned [new acquisition](#spectrum-gen2-comparison); other rows retain their indicated historical acquisitions.

Historical reference rows and the later Web Awesome acquisition are shown together for descriptive comparison. Acquisition IDs are explicit; these rows are not paired blocks. Use the supplemental contemporaneous En Reve/Fluent/Web Awesome tables for measured differences. A dash means unavailable, never zero.

rAF gaps are scheduling diagnostics; the refresh rate is not normalized into an invented dropped-frame percentage. Cohort: pass2-interactions-v1; mobile/cold. Values are per-system sample medians unless labeled p75. Campaign complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Scripted INP ms | Scripted INP p75 ms | First input delay ms | Journey CLS | Max scroll rAF gap ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-interactions-v1 | 2026-09-24 | 10 | 0 | 56.0 | 62.0 | 3.2 | 0.000000 | 16.8 |
| Radix React | Historical pass2-interactions-v1 | 2026-09-20 | 10 | 0 | 56.0 | 56.0 | 4.8 | 0.000000 | 16.8 |
| Fluent React | Historical pass2-interactions-v1 | 2026-09-20 | 10 | 0 | 64.0 | 64.0 | 4.8 | 0.000000 | 16.8 |
| Spectrum React S2 | Historical pass2-interactions-v1 | 2026-09-20 | 10 | 0 | 80.0 | 80.0 | 3.0 | 0.001630 | 16.8 |
| Astryx React | Historical pass2-interactions-v1 | 2026-09-20 | 10 | 0 | 56.0 | 56.0 | 4.5 | 0.000000 | 16.8 |
| shadcn React | Historical pass2-interactions-v1 | 2026-09-20 | 10 | 0 | 64.0 | 64.0 | 4.7 | 0.000986 | 16.8 |
| Fluent Web Components | Historical pass2-interactions-v1 | 2026-09-20 | 10 | 0 | 64.0 | 64.0 | 2.5 | 0.000000 | 16.8 |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-interactions-v1 | 2026-09-22 | 0 | 10 | — | — | — | — | — |
| Web Awesome | web-awesome-interactions-v1 | 2026-09-21 | 10 | 0 | 48.0 | 48.0 | 2.6 | 0.000000 | 16.8 |
| En Reve · Eager reference | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 56.0 | 56.0 | 3.3 | 0.000000 | 16.8 |
| En Reve · Deferred construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 48.0 | 48.0 | 2.9 | 0.000000 | 16.8 |
| En Reve · Deferred code + construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 56.0 | 56.0 | 3.3 | 0.000000 | 16.8 |

### desktop interaction summary

Calendar policy variants below are a separate, dated campaign; historical peers are descriptive comparisons. See [calendar policy tradeoffs](#calendar-delivery-variants).

En Reve refreshed from the versioned [main acquisition](#en-reve-main-comparison); other rows retain their indicated historical acquisitions.

Spectrum refreshed from the versioned [new acquisition](#spectrum-gen2-comparison); other rows retain their indicated historical acquisitions.

Historical reference rows and the later Web Awesome acquisition are shown together for descriptive comparison. Acquisition IDs are explicit; these rows are not paired blocks. Use the supplemental contemporaneous En Reve/Fluent/Web Awesome tables for measured differences. A dash means unavailable, never zero.

rAF gaps are scheduling diagnostics; the refresh rate is not normalized into an invented dropped-frame percentage. Cohort: pass2-interactions-v1; desktop/cold. Values are per-system sample medians unless labeled p75. Campaign complete.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Scripted INP ms | Scripted INP p75 ms | First input delay ms | Journey CLS | Max scroll rAF gap ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-interactions-v1 | 2026-09-24 | 10 | 0 | 48.0 | 48.0 | 0.8 | 0.000000 | 16.8 |
| Radix React | Historical pass2-interactions-v1 | 2026-09-20 | 10 | 0 | 64.0 | 72.0 | 1.2 | 0.000000 | 50.1 |
| Fluent React | Historical pass2-interactions-v1 | 2026-09-20 | 10 | 0 | 48.0 | 48.0 | 1.2 | 0.000000 | 16.8 |
| Spectrum React S2 | Historical pass2-interactions-v1 | 2026-09-20 | 10 | 0 | 44.0 | 48.0 | 0.7 | 0.002332 | 16.8 |
| Astryx React | Historical pass2-interactions-v1 | 2026-09-20 | 10 | 0 | 44.0 | 48.0 | 1.0 | 0.000000 | 16.8 |
| shadcn React | Historical pass2-interactions-v1 | 2026-09-20 | 10 | 0 | 64.0 | 64.0 | 1.2 | 0.002616 | 16.8 |
| Fluent Web Components | Historical pass2-interactions-v1 | 2026-09-20 | 10 | 0 | 48.0 | 48.0 | 0.6 | 0.000075 | 16.8 |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-interactions-v1 | 2026-09-22 | 10 | 0 | 40.0 | 40.0 | 1.3 | 0.000000 | 16.8 |
| Web Awesome | web-awesome-interactions-v1 | 2026-09-21 | 10 | 0 | 40.0 | 48.0 | 0.7 | 0.000000 | 16.8 |
| En Reve · Eager reference | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 40.0 | 48.0 | 0.7 | 0.000000 | 16.8 |
| En Reve · Deferred construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 40.0 | 48.0 | 0.7 | 0.000000 | 16.8 |
| En Reve · Deferred code + construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 44.0 | 48.0 | 0.7 | 0.000000 | 16.8 |

### mobile action details

En Reve refreshed from the versioned [main acquisition](#en-reve-main-comparison); other rows retain their indicated historical acquisitions.

Spectrum refreshed from the versioned [new acquisition](#spectrum-gen2-comparison); other rows retain their indicated historical acquisitions.

Historical reference rows and the later Web Awesome acquisition are shown together for descriptive comparison. Acquisition IDs are explicit; these rows are not paired blocks. Use the supplemental contemporaneous En Reve/Fluent/Web Awesome tables for measured differences. A dash means unavailable, never zero.

Each row isolates one action. Sort Action to compare libraries within the same operation; compare the first and repeated operation to expose deferred work. Missing Event Timing entries remain unavailable; event-entry n shows their coverage.

| Implementation | Run ID | Date (UTC) | Action | Successful n | Failed journeys | Result ms | Frame opportunity ms | Frame p75 ms | Event entries n | Input delay ms | Processing ms | Presentation ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-interactions-v1 | 2026-09-24 | First canvas change | 10 | 0 | 12.6 | 51.4 | 52.8 | 10 | 3.2 | 3.6 | 43.9 |
| En Reve main 6d09b31c | en-reve-main-interactions-v1 | 2026-09-24 | Repeated canvas change | 10 | 0 | 7.5 | 30.2 | 30.6 | 10 | 2.1 | 2.3 | 11.5 |
| En Reve main 6d09b31c | en-reve-main-interactions-v1 | 2026-09-24 | First asset addition | 10 | 0 | 10.7 | 29.1 | 29.6 | 10 | 2.9 | 2.3 | 42.7 |
| En Reve main 6d09b31c | en-reve-main-interactions-v1 | 2026-09-24 | First dialog opening | 10 | 0 | 42.8 | 48.2 | 48.9 | 10 | 2.6 | 2.2 | 43.3 |
| En Reve main 6d09b31c | en-reve-main-interactions-v1 | 2026-09-24 | Repeated dialog opening | 10 | 0 | 20.4 | 30.5 | 31.2 | 10 | 2.3 | 2.1 | 27.5 |
| En Reve main 6d09b31c | en-reve-main-interactions-v1 | 2026-09-24 | Review submission | 10 | 0 | 8.4 | 29.6 | 30.6 | 10 | 2.0 | 2.3 | 12.0 |
| En Reve main 6d09b31c | en-reve-main-interactions-v1 | 2026-09-24 | First command opening | 10 | 0 | 25.1 | 33.1 | 35.0 | 10 | 2.7 | 2.1 | 27.7 |
| Radix React | Historical pass2-interactions-v1 | 2026-09-20 | First canvas change | 10 | 0 | 15.3 | 49.4 | 51.9 | 10 | 4.8 | 1.1 | 49.1 |
| Fluent React | Historical pass2-interactions-v1 | 2026-09-20 | First canvas change | 10 | 0 | 22.1 | 56.2 | 58.6 | 10 | 4.8 | 1.5 | 50.1 |
| Spectrum React S2 | Historical pass2-interactions-v1 | 2026-09-20 | First canvas change | 10 | 0 | 33.5 | 65.9 | 73.4 | 10 | 3.0 | 4.0 | 58.1 |
| Astryx React | Historical pass2-interactions-v1 | 2026-09-20 | First canvas change | 10 | 0 | 18.8 | 55.0 | 56.8 | 10 | 4.5 | 1.5 | 49.9 |
| shadcn React | Historical pass2-interactions-v1 | 2026-09-20 | First canvas change | 10 | 0 | 16.0 | 51.8 | 53.6 | 10 | 4.7 | 2.3 | 44.6 |
| Fluent Web Components | Historical pass2-interactions-v1 | 2026-09-20 | First canvas change | 10 | 0 | 5.9 | 45.3 | 46.3 | 10 | 2.5 | 1.1 | 44.2 |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-interactions-v1 | 2026-09-22 | First canvas change | 0 | 10 | — | — | — | 0 | — | — | — |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-interactions-v1 | 2026-09-22 | Repeated canvas change | 0 | 10 | — | — | — | 0 | — | — | — |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-interactions-v1 | 2026-09-22 | First asset addition | 0 | 10 | — | — | — | 0 | — | — | — |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-interactions-v1 | 2026-09-22 | First dialog opening | 0 | 10 | — | — | — | 0 | — | — | — |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-interactions-v1 | 2026-09-22 | Repeated dialog opening | 0 | 10 | — | — | — | 0 | — | — | — |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-interactions-v1 | 2026-09-22 | Review submission | 0 | 10 | — | — | — | 0 | — | — | — |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-interactions-v1 | 2026-09-22 | First command opening | 0 | 10 | — | — | — | 0 | — | — | — |
| Radix React | Historical pass2-interactions-v1 | 2026-09-20 | Repeated canvas change | 10 | 0 | 8.6 | 30.6 | 31.5 | 10 | 1.0 | 0.9 | 14.4 |
| Fluent React | Historical pass2-interactions-v1 | 2026-09-20 | Repeated canvas change | 10 | 0 | 10.4 | 30.5 | 30.9 | 10 | 1.0 | 1.4 | 13.9 |
| Spectrum React S2 | Historical pass2-interactions-v1 | 2026-09-20 | Repeated canvas change | 10 | 0 | 28.9 | 33.8 | 35.6 | 10 | 1.9 | 4.5 | 26.2 |
| Astryx React | Historical pass2-interactions-v1 | 2026-09-20 | Repeated canvas change | 10 | 0 | 12.1 | 30.5 | 30.8 | 10 | 1.7 | 1.0 | 13.4 |
| shadcn React | Historical pass2-interactions-v1 | 2026-09-20 | Repeated canvas change | 10 | 0 | 10.0 | 30.0 | 30.8 | 10 | 2.2 | 1.7 | 12.1 |
| Fluent Web Components | Historical pass2-interactions-v1 | 2026-09-20 | Repeated canvas change | 10 | 0 | 3.3 | 30.3 | 30.6 | 10 | 1.7 | 0.5 | 13.8 |
| Radix React | Historical pass2-interactions-v1 | 2026-09-20 | First asset addition | 10 | 0 | 5.1 | 30.5 | 31.3 | 10 | 2.0 | 0.8 | 21.4 |
| Fluent React | Historical pass2-interactions-v1 | 2026-09-20 | First asset addition | 10 | 0 | 8.1 | 29.5 | 30.6 | 10 | 2.2 | 0.8 | 60.5 |
| Spectrum React S2 | Historical pass2-interactions-v1 | 2026-09-20 | First asset addition | 10 | 0 | 11.3 | 30.3 | 30.7 | 10 | 1.5 | 4.4 | 58.2 |
| Astryx React | Historical pass2-interactions-v1 | 2026-09-20 | First asset addition | 10 | 0 | 7.3 | 30.2 | 30.5 | 10 | 1.8 | 1.4 | 17.0 |
| shadcn React | Historical pass2-interactions-v1 | 2026-09-20 | First asset addition | 10 | 0 | 8.5 | 30.2 | 31.0 | 10 | 2.6 | 1.6 | 60.0 |
| Fluent Web Components | Historical pass2-interactions-v1 | 2026-09-20 | First asset addition | 10 | 0 | 4.5 | 29.6 | 30.9 | 10 | 1.9 | 0.8 | 61.6 |
| Radix React | Historical pass2-interactions-v1 | 2026-09-20 | First dialog opening | 10 | 0 | 39.0 | 43.6 | 46.7 | 10 | 2.2 | 1.2 | 45.1 |
| Fluent React | Historical pass2-interactions-v1 | 2026-09-20 | First dialog opening | 10 | 0 | 24.3 | 34.9 | 35.4 | 10 | 2.4 | 0.7 | 36.5 |
| Spectrum React S2 | Historical pass2-interactions-v1 | 2026-09-20 | First dialog opening | 10 | 0 | 50.4 | 58.3 | 60.7 | 10 | 1.9 | 4.4 | 51.1 |
| Astryx React | Historical pass2-interactions-v1 | 2026-09-20 | First dialog opening | 10 | 0 | 29.4 | 34.8 | 37.1 | 10 | 1.9 | 1.2 | 37.1 |
| shadcn React | Historical pass2-interactions-v1 | 2026-09-20 | First dialog opening | 10 | 0 | 20.2 | 34.3 | 36.2 | 10 | 2.4 | 1.7 | 32.0 |
| Fluent Web Components | Historical pass2-interactions-v1 | 2026-09-20 | First dialog opening | 10 | 0 | 3.5 | 33.0 | 34.6 | 10 | 1.8 | 0.5 | 29.7 |
| Radix React | Historical pass2-interactions-v1 | 2026-09-20 | Repeated dialog opening | 10 | 0 | 29.2 | 32.5 | 35.2 | 10 | 2.1 | 1.2 | 36.9 |
| Fluent React | Historical pass2-interactions-v1 | 2026-09-20 | Repeated dialog opening | 10 | 0 | 13.8 | 30.0 | 30.5 | 10 | 2.4 | 0.8 | 21.1 |
| Spectrum React S2 | Historical pass2-interactions-v1 | 2026-09-20 | Repeated dialog opening | 10 | 0 | 35.1 | 42.5 | 45.7 | 10 | 1.4 | 4.8 | 34.8 |
| Astryx React | Historical pass2-interactions-v1 | 2026-09-20 | Repeated dialog opening | 10 | 0 | 21.5 | 31.5 | 32.2 | 10 | 1.3 | 1.3 | 29.5 |
| shadcn React | Historical pass2-interactions-v1 | 2026-09-20 | Repeated dialog opening | 10 | 0 | 11.7 | 31.0 | 31.5 | 10 | 2.5 | 1.4 | 28.3 |
| Fluent Web Components | Historical pass2-interactions-v1 | 2026-09-20 | Repeated dialog opening | 10 | 0 | 3.3 | 48.0 | 51.9 | 10 | 1.6 | 0.6 | 46.0 |
| Radix React | Historical pass2-interactions-v1 | 2026-09-20 | Review submission | 10 | 0 | 4.4 | 30.5 | 30.7 | 10 | 2.0 | 0.8 | 21.1 |
| Fluent React | Historical pass2-interactions-v1 | 2026-09-20 | Review submission | 10 | 0 | 4.3 | 29.0 | 29.6 | 10 | 0.8 | 1.5 | 14.0 |
| Spectrum React S2 | Historical pass2-interactions-v1 | 2026-09-20 | Review submission | 10 | 0 | 15.7 | 30.6 | 32.2 | 10 | 1.7 | 4.6 | 26.0 |
| Astryx React | Historical pass2-interactions-v1 | 2026-09-20 | Review submission | 10 | 0 | 4.5 | 29.2 | 29.5 | 10 | 1.5 | 0.9 | 28.7 |
| shadcn React | Historical pass2-interactions-v1 | 2026-09-20 | Review submission | 10 | 0 | 5.5 | 28.3 | 28.8 | 10 | 2.3 | 1.6 | 16.0 |
| Fluent Web Components | Historical pass2-interactions-v1 | 2026-09-20 | Review submission | 10 | 0 | 4.0 | 28.6 | 29.8 | 10 | 0.9 | 1.1 | 14.2 |
| Radix React | Historical pass2-interactions-v1 | 2026-09-20 | First command opening | 10 | 0 | 31.5 | 36.4 | 37.6 | 10 | 2.8 | 0.6 | 37.0 |
| Fluent React | Historical pass2-interactions-v1 | 2026-09-20 | First command opening | 10 | 0 | 15.9 | 31.3 | 32.0 | 10 | 2.6 | 0.7 | 28.0 |
| Spectrum React S2 | Historical pass2-interactions-v1 | 2026-09-20 | First command opening | 10 | 0 | 40.1 | 48.6 | 51.9 | 10 | 1.5 | 4.4 | 42.8 |
| Astryx React | Historical pass2-interactions-v1 | 2026-09-20 | First command opening | 10 | 0 | 23.0 | 31.9 | 32.5 | 10 | 1.8 | 1.0 | 29.5 |
| shadcn React | Historical pass2-interactions-v1 | 2026-09-20 | First command opening | 10 | 0 | 11.4 | 29.8 | 30.4 | 10 | 2.5 | 1.5 | 27.6 |
| Fluent Web Components | Historical pass2-interactions-v1 | 2026-09-20 | First command opening | 10 | 0 | 3.4 | 51.9 | 52.8 | 10 | 2.1 | 0.5 | 45.7 |
| Web Awesome | web-awesome-interactions-v1 | 2026-09-21 | First canvas change | 10 | 0 | 7.9 | 45.6 | 51.2 | 10 | 2.6 | 2.4 | 43.0 |
| Web Awesome | web-awesome-interactions-v1 | 2026-09-21 | Repeated canvas change | 10 | 0 | 5.0 | 30.2 | 30.8 | 10 | 1.7 | 1.7 | 12.4 |
| Web Awesome | web-awesome-interactions-v1 | 2026-09-21 | First asset addition | 10 | 0 | 5.8 | 29.0 | 29.3 | 10 | 1.8 | 1.4 | 44.8 |
| Web Awesome | web-awesome-interactions-v1 | 2026-09-21 | First dialog opening | 10 | 0 | 32.3 | 43.0 | 44.1 | 10 | 2.0 | 1.5 | 40.5 |
| Web Awesome | web-awesome-interactions-v1 | 2026-09-21 | Repeated dialog opening | 10 | 0 | 31.1 | 38.4 | 39.2 | 10 | 2.1 | 1.4 | 36.5 |
| Web Awesome | web-awesome-interactions-v1 | 2026-09-21 | Review submission | 10 | 0 | 6.8 | 29.6 | 30.4 | 10 | 1.8 | 1.6 | 12.6 |
| Web Awesome | web-awesome-interactions-v1 | 2026-09-21 | First command opening | 10 | 0 | 25.9 | 33.9 | 34.7 | 10 | 2.1 | 2.0 | 28.0 |

### desktop action details

En Reve refreshed from the versioned [main acquisition](#en-reve-main-comparison); other rows retain their indicated historical acquisitions.

Spectrum refreshed from the versioned [new acquisition](#spectrum-gen2-comparison); other rows retain their indicated historical acquisitions.

Historical reference rows and the later Web Awesome acquisition are shown together for descriptive comparison. Acquisition IDs are explicit; these rows are not paired blocks. Use the supplemental contemporaneous En Reve/Fluent/Web Awesome tables for measured differences. A dash means unavailable, never zero.

Each row isolates one action. Sort Action to compare libraries within the same operation; compare the first and repeated operation to expose deferred work. Missing Event Timing entries remain unavailable; event-entry n shows their coverage.

| Implementation | Run ID | Date (UTC) | Action | Successful n | Failed journeys | Result ms | Frame opportunity ms | Frame p75 ms | Event entries n | Input delay ms | Processing ms | Presentation ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-interactions-v1 | 2026-09-24 | First canvas change | 10 | 0 | 2.4 | 42.5 | 43.8 | 10 | 0.8 | 0.7 | 45.0 |
| En Reve main 6d09b31c | en-reve-main-interactions-v1 | 2026-09-24 | Repeated canvas change | 10 | 0 | 1.5 | 31.7 | 31.8 | 10 | 0.5 | 0.4 | 31.0 |
| En Reve main 6d09b31c | en-reve-main-interactions-v1 | 2026-09-24 | First asset addition | 10 | 0 | 2.1 | 31.7 | 32.1 | 10 | 0.6 | 0.5 | 30.9 |
| En Reve main 6d09b31c | en-reve-main-interactions-v1 | 2026-09-24 | First dialog opening | 10 | 0 | 8.8 | 31.5 | 31.8 | 10 | 0.6 | 0.4 | 31.0 |
| En Reve main 6d09b31c | en-reve-main-interactions-v1 | 2026-09-24 | Repeated dialog opening | 10 | 0 | 4.0 | 31.5 | 31.8 | 10 | 0.6 | 0.4 | 31.1 |
| En Reve main 6d09b31c | en-reve-main-interactions-v1 | 2026-09-24 | Review submission | 10 | 0 | 1.6 | 31.9 | 32.1 | 10 | 0.4 | 0.4 | 31.2 |
| En Reve main 6d09b31c | en-reve-main-interactions-v1 | 2026-09-24 | First command opening | 10 | 0 | 5.1 | 31.9 | 32.1 | 10 | 0.6 | 0.5 | 31.0 |
| Radix React | Historical pass2-interactions-v1 | 2026-09-20 | First canvas change | 10 | 0 | 3.4 | 40.5 | 42.5 | 10 | 1.2 | 0.2 | 46.6 |
| Fluent React | Historical pass2-interactions-v1 | 2026-09-20 | First canvas change | 10 | 0 | 5.0 | 43.6 | 44.4 | 10 | 1.2 | 0.3 | 46.5 |
| Spectrum React S2 | Historical pass2-interactions-v1 | 2026-09-20 | First canvas change | 10 | 0 | 7.4 | 42.7 | 43.6 | 10 | 0.7 | 0.8 | 42.4 |
| Astryx React | Historical pass2-interactions-v1 | 2026-09-20 | First canvas change | 10 | 0 | 4.4 | 42.2 | 44.1 | 10 | 1.0 | 0.3 | 42.7 |
| shadcn React | Historical pass2-interactions-v1 | 2026-09-20 | First canvas change | 10 | 0 | 3.5 | 39.8 | 44.1 | 10 | 1.2 | 0.5 | 38.4 |
| Fluent Web Components | Historical pass2-interactions-v1 | 2026-09-20 | First canvas change | 10 | 0 | 1.4 | 44.2 | 44.5 | 10 | 0.6 | 0.2 | 47.1 |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-interactions-v1 | 2026-09-22 | First canvas change | 10 | 0 | 2.8 | 38.3 | 39.6 | 10 | 1.3 | 0.8 | 38.0 |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-interactions-v1 | 2026-09-22 | Repeated canvas change | 10 | 0 | 3.1 | 31.1 | 31.4 | 10 | 1.4 | 1.0 | 13.5 |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-interactions-v1 | 2026-09-22 | First asset addition | 10 | 0 | 2.5 | 31.9 | 32.1 | 10 | 1.2 | 0.6 | 30.3 |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-interactions-v1 | 2026-09-22 | First dialog opening | 10 | 0 | 2.5 | 31.8 | 32.0 | 10 | 1.3 | 0.6 | 14.3 |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-interactions-v1 | 2026-09-22 | Repeated dialog opening | 10 | 0 | 2.5 | 30.5 | 31.1 | 10 | 1.5 | 0.6 | 14.0 |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-interactions-v1 | 2026-09-22 | Review submission | 10 | 0 | 2.7 | 31.7 | 31.9 | 10 | 0.9 | 0.7 | 14.3 |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-interactions-v1 | 2026-09-22 | First command opening | 10 | 0 | 2.4 | 32.0 | 32.2 | 10 | 1.3 | 0.5 | 14.1 |
| Radix React | Historical pass2-interactions-v1 | 2026-09-20 | Repeated canvas change | 10 | 0 | 2.0 | 30.4 | 33.8 | 7 | 0.5 | 0.1 | 23.4 |
| Fluent React | Historical pass2-interactions-v1 | 2026-09-20 | Repeated canvas change | 10 | 0 | 2.5 | 31.8 | 32.2 | 10 | 0.6 | 0.2 | 15.2 |
| Spectrum React S2 | Historical pass2-interactions-v1 | 2026-09-20 | Repeated canvas change | 10 | 0 | 6.0 | 32.4 | 32.7 | 10 | 0.5 | 0.8 | 14.7 |
| Astryx React | Historical pass2-interactions-v1 | 2026-09-20 | Repeated canvas change | 10 | 0 | 2.7 | 32.0 | 32.2 | 10 | 0.4 | 0.2 | 15.3 |
| shadcn React | Historical pass2-interactions-v1 | 2026-09-20 | Repeated canvas change | 10 | 0 | 2.2 | 31.9 | 32.5 | 10 | 0.6 | 0.3 | 15.1 |
| Fluent Web Components | Historical pass2-interactions-v1 | 2026-09-20 | Repeated canvas change | 10 | 0 | 0.7 | 32.1 | 32.6 | 10 | 0.4 | 0.2 | 15.5 |
| Radix React | Historical pass2-interactions-v1 | 2026-09-20 | First asset addition | 10 | 0 | 1.2 | 52.5 | 53.0 | 10 | 0.5 | 0.1 | 55.4 |
| Fluent React | Historical pass2-interactions-v1 | 2026-09-20 | First asset addition | 10 | 0 | 1.8 | 31.9 | 32.3 | 10 | 0.5 | 0.2 | 31.3 |
| Spectrum React S2 | Historical pass2-interactions-v1 | 2026-09-20 | First asset addition | 10 | 0 | 2.4 | 32.0 | 32.2 | 10 | 0.3 | 0.9 | 30.8 |
| Astryx React | Historical pass2-interactions-v1 | 2026-09-20 | First asset addition | 10 | 0 | 1.5 | 32.2 | 32.4 | 10 | 0.4 | 0.2 | 15.4 |
| shadcn React | Historical pass2-interactions-v1 | 2026-09-20 | First asset addition | 10 | 0 | 1.7 | 32.1 | 32.4 | 10 | 0.5 | 0.3 | 31.3 |
| Fluent Web Components | Historical pass2-interactions-v1 | 2026-09-20 | First asset addition | 10 | 0 | 1.0 | 31.5 | 31.8 | 10 | 0.4 | 0.1 | 31.5 |
| Radix React | Historical pass2-interactions-v1 | 2026-09-20 | First dialog opening | 10 | 0 | 8.0 | 51.1 | 51.6 | 10 | 0.5 | 0.2 | 47.3 |
| Fluent React | Historical pass2-interactions-v1 | 2026-09-20 | First dialog opening | 10 | 0 | 5.2 | 31.7 | 32.1 | 10 | 0.6 | 0.1 | 31.3 |
| Spectrum React S2 | Historical pass2-interactions-v1 | 2026-09-20 | First dialog opening | 10 | 0 | 9.8 | 31.7 | 32.0 | 10 | 0.3 | 0.8 | 18.8 |
| Astryx React | Historical pass2-interactions-v1 | 2026-09-20 | First dialog opening | 10 | 0 | 6.3 | 39.1 | 40.3 | 10 | 0.5 | 0.2 | 39.4 |
| shadcn React | Historical pass2-interactions-v1 | 2026-09-20 | First dialog opening | 10 | 0 | 3.8 | 32.3 | 32.6 | 10 | 0.5 | 0.3 | 39.2 |
| Fluent Web Components | Historical pass2-interactions-v1 | 2026-09-20 | First dialog opening | 10 | 0 | 0.8 | 31.5 | 31.8 | 10 | 0.4 | 0.1 | 31.5 |
| Radix React | Historical pass2-interactions-v1 | 2026-09-20 | Repeated dialog opening | 10 | 0 | 5.9 | 50.1 | 50.9 | 10 | 0.5 | 0.2 | 47.3 |
| Fluent React | Historical pass2-interactions-v1 | 2026-09-20 | Repeated dialog opening | 10 | 0 | 3.0 | 31.5 | 31.7 | 10 | 0.6 | 0.1 | 15.3 |
| Spectrum React S2 | Historical pass2-interactions-v1 | 2026-09-20 | Repeated dialog opening | 10 | 0 | 6.7 | 32.0 | 32.2 | 10 | 0.4 | 0.9 | 14.8 |
| Astryx React | Historical pass2-interactions-v1 | 2026-09-20 | Repeated dialog opening | 10 | 0 | 4.7 | 38.4 | 39.6 | 10 | 0.4 | 0.3 | 39.3 |
| shadcn React | Historical pass2-interactions-v1 | 2026-09-20 | Repeated dialog opening | 10 | 0 | 3.0 | 31.9 | 32.1 | 10 | 0.7 | 0.4 | 39.0 |
| Fluent Web Components | Historical pass2-interactions-v1 | 2026-09-20 | Repeated dialog opening | 10 | 0 | 0.7 | 32.2 | 32.4 | 10 | 0.5 | 0.1 | 23.4 |
| Radix React | Historical pass2-interactions-v1 | 2026-09-20 | Review submission | 10 | 0 | 0.8 | 55.8 | 65.8 | 10 | 0.4 | 0.1 | 55.4 |
| Fluent React | Historical pass2-interactions-v1 | 2026-09-20 | Review submission | 10 | 0 | 1.1 | 31.8 | 32.0 | 10 | 0.5 | 0.2 | 15.3 |
| Spectrum React S2 | Historical pass2-interactions-v1 | 2026-09-20 | Review submission | 10 | 0 | 2.7 | 31.8 | 32.0 | 10 | 0.4 | 0.9 | 14.8 |
| Astryx React | Historical pass2-interactions-v1 | 2026-09-20 | Review submission | 10 | 0 | 1.0 | 32.0 | 32.1 | 10 | 0.4 | 0.2 | 15.4 |
| shadcn React | Historical pass2-interactions-v1 | 2026-09-20 | Review submission | 10 | 0 | 1.2 | 31.5 | 32.0 | 10 | 0.6 | 0.3 | 31.1 |
| Fluent Web Components | Historical pass2-interactions-v1 | 2026-09-20 | Review submission | 10 | 0 | 1.0 | 31.8 | 32.0 | 10 | 0.4 | 0.1 | 15.5 |
| Radix React | Historical pass2-interactions-v1 | 2026-09-20 | First command opening | 10 | 0 | 6.1 | 49.5 | 50.1 | 10 | 0.6 | 0.1 | 47.4 |
| Fluent React | Historical pass2-interactions-v1 | 2026-09-20 | First command opening | 10 | 0 | 3.1 | 32.0 | 32.9 | 10 | 0.6 | 0.1 | 19.3 |
| Spectrum React S2 | Historical pass2-interactions-v1 | 2026-09-20 | First command opening | 10 | 0 | 7.5 | 31.8 | 32.2 | 10 | 0.4 | 0.9 | 14.9 |
| Astryx React | Historical pass2-interactions-v1 | 2026-09-20 | First command opening | 10 | 0 | 4.9 | 37.1 | 38.1 | 10 | 0.3 | 0.3 | 39.4 |
| shadcn React | Historical pass2-interactions-v1 | 2026-09-20 | First command opening | 10 | 0 | 2.4 | 32.4 | 32.6 | 10 | 0.6 | 0.3 | 39.2 |
| Fluent Web Components | Historical pass2-interactions-v1 | 2026-09-20 | First command opening | 10 | 0 | 0.8 | 31.9 | 32.2 | 10 | 0.4 | 0.1 | 23.5 |
| Web Awesome | web-awesome-interactions-v1 | 2026-09-21 | First canvas change | 10 | 0 | 1.7 | 40.3 | 43.3 | 10 | 0.7 | 0.5 | 39.0 |
| Web Awesome | web-awesome-interactions-v1 | 2026-09-21 | Repeated canvas change | 10 | 0 | 1.0 | 32.0 | 32.7 | 10 | 0.4 | 0.3 | 15.3 |
| Web Awesome | web-awesome-interactions-v1 | 2026-09-21 | First asset addition | 10 | 0 | 1.2 | 31.8 | 32.0 | 10 | 0.4 | 0.4 | 31.3 |
| Web Awesome | web-awesome-interactions-v1 | 2026-09-21 | First dialog opening | 10 | 0 | 6.6 | 31.9 | 32.2 | 10 | 0.5 | 0.3 | 31.2 |
| Web Awesome | web-awesome-interactions-v1 | 2026-09-21 | Repeated dialog opening | 10 | 0 | 6.1 | 32.0 | 32.1 | 10 | 0.5 | 0.3 | 31.2 |
| Web Awesome | web-awesome-interactions-v1 | 2026-09-21 | Review submission | 10 | 0 | 1.3 | 31.9 | 32.1 | 10 | 0.5 | 0.3 | 15.2 |
| Web Awesome | web-awesome-interactions-v1 | 2026-09-21 | First command opening | 10 | 0 | 4.8 | 31.8 | 32.1 | 10 | 0.5 | 0.4 | 31.2 |

## Memory and lifecycle

A full-Chromium cross-origin-isolated lane with timing observers disabled repeats the native journey to 50 cycles. Each cycle submits the same review and replaces its status text; it does not append review records. The earlier narrative was incorrect. [Frozen-source interpretation correction](../showcases/performance/reports/memory-interpretation-correction-pass2.json). Node or heap growth remains unattributed until application retention, browser input/undo state, automation retention and garbage collection are separated. One session per implementation is exploratory and cannot establish a leak or a memory ranking. API timeouts/errors remain explicit. JS heap and browser DOM counters have different scopes from API memory.

### Memory after 0 cycles

En Reve refreshed from the versioned [main acquisition](#en-reve-main-comparison); other rows retain their indicated historical acquisitions.

Spectrum refreshed from the versioned [new acquisition](#spectrum-gen2-comparison); other rows retain their indicated historical acquisitions.

Historical reference rows and the later Web Awesome acquisition are shown together for descriptive comparison. Acquisition IDs are explicit; these rows are not paired blocks. Use the supplemental contemporaneous En Reve/Fluent/Web Awesome tables for measured differences. A dash means unavailable, never zero.

Checkpoints retained even if a later journey fails. Zero cycles is after page load/settling. Campaign complete.

| Implementation | Run ID | Date (UTC) | Checkpoints n | API success n | API unavailable n | API MiB | JS heap MiB | Browser DOM nodes | Event listeners | API status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-memory-v1 | 2026-09-24 | 1 | 1 | 0 | 5.52 | 4.32 | 6,376 | 547 | ok |
| Radix React | Historical pass2-memory-50-v1 | 2026-09-20 | 1 | 0 | 1 | — | 4.43 | 897 | 1,540 | timeout |
| Fluent React | Historical pass2-memory-50-v1 | 2026-09-20 | 1 | 0 | 1 | — | 6.26 | 946 | 363 | timeout |
| Spectrum React S2 | Historical pass2-memory-50-v1 | 2026-09-20 | 1 | 0 | 1 | — | 11.67 | 1,175 | 428 | timeout |
| Astryx React | Historical pass2-memory-50-v1 | 2026-09-20 | 1 | 1 | 0 | 7.42 | 6.30 | 1,552 | 774 | ok |
| shadcn React | Historical pass2-memory-50-v1 | 2026-09-20 | 1 | 1 | 0 | 5.82 | 5.20 | 786 | 266 | ok |
| Fluent Web Components | Historical pass2-memory-50-v1 | 2026-09-20 | 1 | 0 | 1 | — | 4.24 | 4,138 | 618 | timeout |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-memory-v1 | 2026-09-22 | 1 | 0 | 1 | — | 4.12 | 5,604 | 828 | timeout |
| Web Awesome | web-awesome-memory-v2 | 2026-09-21 | 1 | 1 | 0 | 4.45 | 3.68 | 5,136 | 747 | ok |

### Memory after 10 cycles

En Reve refreshed from the versioned [main acquisition](#en-reve-main-comparison); other rows retain their indicated historical acquisitions.

Spectrum refreshed from the versioned [new acquisition](#spectrum-gen2-comparison); other rows retain their indicated historical acquisitions.

Historical reference rows and the later Web Awesome acquisition are shown together for descriptive comparison. Acquisition IDs are explicit; these rows are not paired blocks. Use the supplemental contemporaneous En Reve/Fluent/Web Awesome tables for measured differences. A dash means unavailable, never zero.

Checkpoints retained even if a later journey fails. Zero cycles is after page load/settling. Campaign complete.

| Implementation | Run ID | Date (UTC) | Checkpoints n | API success n | API unavailable n | API MiB | JS heap MiB | Browser DOM nodes | Event listeners | API status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-memory-v1 | 2026-09-24 | 1 | 1 | 0 | 5.59 | 5.21 | 6,495 | 547 | ok |
| Radix React | Historical pass2-memory-50-v1 | 2026-09-20 | 1 | 1 | 0 | 6.14 | 6.27 | 932 | 1,537 | ok |
| Fluent React | Historical pass2-memory-50-v1 | 2026-09-20 | 1 | 1 | 0 | 7.87 | 7.61 | 959 | 360 | ok |
| Spectrum React S2 | Historical pass2-memory-50-v1 | 2026-09-20 | 1 | 1 | 0 | 12.87 | 12.26 | 1,989 | 605 | ok |
| Astryx React | Historical pass2-memory-50-v1 | 2026-09-20 | 1 | 1 | 0 | 9.05 | 8.25 | 1,628 | 774 | ok |
| shadcn React | Historical pass2-memory-50-v1 | 2026-09-20 | 1 | 1 | 0 | 7.09 | 7.43 | 912 | 413 | ok |
| Fluent Web Components | Historical pass2-memory-50-v1 | 2026-09-20 | 1 | 1 | 0 | 3.85 | 4.39 | 4,617 | 692 | ok |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-memory-v1 | 2026-09-22 | 1 | 1 | 0 | 8.12 | 5.71 | 5,055 | 843 | ok |
| Web Awesome | web-awesome-memory-v2 | 2026-09-21 | 1 | 1 | 0 | 4.74 | 4.58 | 5,223 | 747 | ok |

### Memory after 50 cycles

En Reve refreshed from the versioned [main acquisition](#en-reve-main-comparison); other rows retain their indicated historical acquisitions.

Spectrum refreshed from the versioned [new acquisition](#spectrum-gen2-comparison); other rows retain their indicated historical acquisitions.

Historical reference rows and the later Web Awesome acquisition are shown together for descriptive comparison. Acquisition IDs are explicit; these rows are not paired blocks. Use the supplemental contemporaneous En Reve/Fluent/Web Awesome tables for measured differences. A dash means unavailable, never zero.

Checkpoints retained even if a later journey fails. Zero cycles is after page load/settling. Campaign complete.

| Implementation | Run ID | Date (UTC) | Checkpoints n | API success n | API unavailable n | API MiB | JS heap MiB | Browser DOM nodes | Event listeners | API status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-memory-v1 | 2026-09-24 | 1 | 1 | 0 | 5.82 | 5.56 | 6,535 | 547 | ok |
| Radix React | Historical pass2-memory-50-v1 | 2026-09-20 | 1 | 1 | 0 | 6.71 | 6.64 | 972 | 1,537 | ok |
| Fluent React | Historical pass2-memory-50-v1 | 2026-09-20 | 1 | 1 | 0 | 8.57 | 8.30 | 999 | 360 | ok |
| Spectrum React S2 | Historical pass2-memory-50-v1 | 2026-09-20 | 1 | 1 | 0 | 13.86 | 13.23 | 5,189 | 925 | ok |
| Astryx React | Historical pass2-memory-50-v1 | 2026-09-20 | 1 | 0 | 1 | — | 8.67 | 1,668 | 774 | timeout |
| shadcn React | Historical pass2-memory-50-v1 | 2026-09-20 | 1 | 1 | 0 | 7.62 | 8.08 | 993 | 418 | ok |
| Fluent Web Components | Historical pass2-memory-50-v1 | 2026-09-20 | 1 | 1 | 0 | 4.38 | 4.73 | 7,497 | 1,012 | ok |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-memory-v1 | 2026-09-22 | 1 | 1 | 0 | 8.94 | 5.95 | 5,095 | 843 | ok |
| Web Awesome | web-awesome-memory-v2 | 2026-09-21 | 1 | 1 | 0 | 4.86 | 4.81 | 5,263 | 747 | ok |

### Memory change from 10 to 50 cycles

En Reve refreshed from the versioned [main acquisition](#en-reve-main-comparison); other rows retain their indicated historical acquisitions.

Spectrum refreshed from the versioned [new acquisition](#spectrum-gen2-comparison); other rows retain their indicated historical acquisitions.

Historical reference rows and the later Web Awesome acquisition are shown together for descriptive comparison. Acquisition IDs are explicit; these rows are not paired blocks. Use the supplemental contemporaneous En Reve/Fluent/Web Awesome tables for measured differences. A dash means unavailable, never zero.

Paired checkpoint changes within the same session. These are 40 additional repeated journeys with replacement status, not 40 appended review records. Garbage collection, native input state and automation can affect the counters; investigate growth with controls and heap/retainer evidence before calling it a library leak.

| Implementation | Run ID | Date (UTC) | Paired API readings n | API growth MiB | JS heap growth MiB | DOM node growth | Listener growth |
| --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-memory-v1 | 2026-09-24 | 1 | 0.23 | 0.35 | 40 | 0 |
| Radix React | Historical pass2-memory-50-v1 | 2026-09-20 | 1 | 0.57 | 0.36 | 40 | 0 |
| Fluent React | Historical pass2-memory-50-v1 | 2026-09-20 | 1 | 0.70 | 0.69 | 40 | 0 |
| Spectrum React S2 | Historical pass2-memory-50-v1 | 2026-09-20 | 1 | 0.99 | 0.97 | 3,200 | 320 |
| Astryx React | Historical pass2-memory-50-v1 | 2026-09-20 | 0 | — | 0.42 | 40 | 0 |
| shadcn React | Historical pass2-memory-50-v1 | 2026-09-20 | 1 | 0.53 | 0.66 | 81 | 5 |
| Fluent Web Components | Historical pass2-memory-50-v1 | 2026-09-20 | 1 | 0.52 | 0.35 | 2,880 | 320 |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-memory-v1 | 2026-09-22 | 1 | 0.83 | 0.23 | 40 | 0 |
| Web Awesome | web-awesome-memory-v2 | 2026-09-21 | 1 | 0.11 | 0.23 | 40 | 0 |

## Supporting diagnostics

These structural and trace measurements come from the retained first-pass diagnostic cohort. They help choose experiments; they are not new primary timing measurements.

### Historical connected DOM diagnostics

En Reve refreshed from the versioned [main acquisition](#en-reve-main-comparison); other rows retain their indicated historical acquisitions.

Spectrum refreshed from the versioned [new acquisition](#spectrum-gen2-comparison); other rows retain their indicated historical acquisitions.

Historical reference rows and the later Web Awesome acquisition are shown together for descriptive comparison. Acquisition IDs are explicit; these rows are not paired blocks. Use the supplemental contemporaneous En Reve/Fluent/Web Awesome tables for measured differences. A dash means unavailable, never zero.

One desktop diagnostic journey per implementation from the first pass, not remeasured here. Includes accessible open shadow roots; closed roots are not inspected. More nodes can reflect richer features. Adoption counts do not equal separately allocated sheets.

| Implementation | Run ID | Date (UTC) | Connected nodes | Connected elements | Open shadow roots | Style elements | Stylesheet adoptions | Unique adopted sheets |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-diagnostic-v1 | 2026-09-24 | 4,668 | 1,580 | 167 | 0 | 598 | 34 |
| Radix React | Historical diagnostic-desktop-v1 | 2026-09-20 | 653 | 454 | 0 | 0 | 0 | 0 |
| Fluent React | Historical diagnostic-desktop-v1 | 2026-09-20 | 745 | 543 | 0 | 23 | 0 | 0 |
| Spectrum React S2 | Historical diagnostic-desktop-v1 | 2026-09-20 | 880 | 653 | 0 | 1 | 0 | 0 |
| Astryx React | Historical diagnostic-desktop-v1 | 2026-09-20 | 1,488 | 1,158 | 0 | 0 | 0 | 0 |
| shadcn React | Historical diagnostic-desktop-v1 | 2026-09-20 | 675 | 477 | 0 | 0 | 0 | 0 |
| Fluent Web Components | Historical diagnostic-desktop-v1 | 2026-09-20 | 2,889 | 1,284 | 169 | 0 | 221 | 32 |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-diagnostic-v1 | 2026-09-22 | 4,077 | 1,234 | 196 | 0 | 395 | 46 |
| Web Awesome | web-awesome-diagnostic-v1 | 2026-09-21 | 4,212 | 1,401 | 197 | 0 | 611 | 36 |

### Historical exercised code coverage

En Reve refreshed from the versioned [main acquisition](#en-reve-main-comparison); other rows retain their indicated historical acquisitions.

Spectrum refreshed from the versioned [new acquisition](#spectrum-gen2-comparison); other rows retain their indicated historical acquisitions.

Historical reference rows and the later Web Awesome acquisition are shown together for descriptive comparison. Acquisition IDs are explicit; these rows are not paired blocks. Use the supplemental contemporaneous En Reve/Fluent/Web Awesome tables for measured differences. A dash means unavailable, never zero.

One first-pass diagnostic journey. Counts generated characters, not UTF-8 bytes; excludes the injected collector and non-HTTP scripts. External CSS coverage does not cover all adopted or CSS-in-JS styles. Unexercised code is not necessarily removable.

| Implementation | Run ID | Date (UTC) | Loaded JS characters | Exercised JS characters | Unexercised JS percent | External CSS characters | Unexercised external CSS percent |
| --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-diagnostic-v1 | 2026-09-24 | 449,978 | 328,098 | 27.1 | 44,562 | 0.4 |
| Radix React | Historical diagnostic-desktop-v1 | 2026-09-20 | 416,199 | 195,216 | 53.1 | 686,869 | 90.8 |
| Fluent React | Historical diagnostic-desktop-v1 | 2026-09-20 | 818,099 | 559,422 | 31.6 | 3,395 | 20.5 |
| Spectrum React S2 | Historical diagnostic-desktop-v1 | 2026-09-20 | 990,789 | 490,565 | 50.5 | 66,711 | 23.9 |
| Astryx React | Historical diagnostic-desktop-v1 | 2026-09-20 | 738,785 | 427,079 | 42.2 | 196,349 | 0.3 |
| shadcn React | Historical diagnostic-desktop-v1 | 2026-09-20 | 539,010 | 262,528 | 51.3 | 78,846 | 10.0 |
| Fluent Web Components | Historical diagnostic-desktop-v1 | 2026-09-20 | 287,939 | 223,304 | 22.4 | 4,300 | 12.8 |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-diagnostic-v1 | 2026-09-22 | 1,271,551 | 1,025,999 | 19.3 | 120,318 | 2.7 |
| Web Awesome | web-awesome-diagnostic-v1 | 2026-09-21 | 480,999 | 348,690 | 27.5 | 54,664 | 2.1 |

### Historical rendering trace through LCP

En Reve refreshed from the versioned [main acquisition](#en-reve-main-comparison); other rows retain their indicated historical acquisitions.

Spectrum refreshed from the versioned [new acquisition](#spectrum-gen2-comparison); other rows retain their indicated historical acquisitions.

Historical reference rows and the later Web Awesome acquisition are shown together for descriptive comparison. Acquisition IDs are explicit; these rows are not paired blocks. Use the supplemental contemporaneous En Reve/Fluent/Web Awesome tables for measured differences. A dash means unavailable, never zero.

One first-pass desktop diagnostic trace each, clipped from navigation to that trace’s LCP. Nested categories overlap; do not sum them, compare them with the new primary run as one cohort, or infer paint-to-screen latency.

| Implementation | Run ID | Date (UTC) | Main-thread RunTask ms | HTML parse ms | Layout tree update ms | Layout ms | Paint ms | Script evaluation ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-diagnostic-v1 | 2026-09-24 | 138.7 | 4.9 | 16.4 | 8.3 | 1.6 | 5.7 |
| Radix React | Historical diagnostic-desktop-v1 | 2026-09-20 | 122.2 | 2.4 | 24.6 | 13.3 | 1.8 | 5.4 |
| Fluent React | Historical diagnostic-desktop-v1 | 2026-09-20 | 104.1 | 0.5 | 11.4 | 10.4 | 1.2 | 5.3 |
| Spectrum React S2 | Historical diagnostic-desktop-v1 | 2026-09-20 | 255.8 | 1.7 | 55.0 | 51.7 | 2.1 | 5.8 |
| Astryx React | Historical diagnostic-desktop-v1 | 2026-09-20 | 166.0 | 2.1 | 55.5 | 14.8 | 2.2 | 5.3 |
| shadcn React | Historical diagnostic-desktop-v1 | 2026-09-20 | 135.8 | 0.8 | 12.6 | 43.7 | 1.0 | 5.6 |
| Fluent Web Components | Historical diagnostic-desktop-v1 | 2026-09-20 | 80.9 | 2.6 | 10.2 | 8.5 | 1.5 | 5.7 |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-diagnostic-v1 | 2026-09-22 | 150.6 | 2.1 | 18.4 | 13.4 | 1.9 | 5.6 |
| Web Awesome | web-awesome-diagnostic-v1 | 2026-09-21 | 115.3 | 1.8 | 13.6 | 11.3 | 2.2 | 5.6 |

### Historical back-forward cache checks

En Reve refreshed from the versioned [main acquisition](#en-reve-main-comparison); other rows retain their indicated historical acquisitions.

Spectrum refreshed from the versioned [new acquisition](#spectrum-gen2-comparison); other rows retain their indicated historical acquisitions.

One first-pass direct-CDP desktop diagnostic per implementation. Counts verify a real same-document restoration and trusted post-return interaction; they are neither field hit rates nor measured restoration latency.

| Implementation | Run ID | Date (UTC) | Attempts n | Restored n | Interactive after return n |
| --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-bfcache-v1 | 2026-09-24 | 5 | 4 | 5 |
| Radix React | Historical; see original source note | — | 1 | 1 | 1 |
| Fluent React | Historical; see original source note | — | 1 | 1 | 1 |
| Spectrum React S2 | Historical; see original source note | — | 1 | 1 | 1 |
| Astryx React | Historical; see original source note | — | 1 | 1 | 1 |
| shadcn React | Historical; see original source note | — | 1 | 1 | 1 |
| Fluent Web Components | Historical; see original source note | — | 1 | 1 | 1 |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-bfcache-v1 | 2026-09-22 | 5 | 5 | 5 |

### Historical observer overhead calibration

En Reve refreshed from the versioned [main acquisition](#en-reve-main-comparison); other rows retain their indicated historical acquisitions.

Five first-pass paired on/off blocks for En Reve and Fluent WC. A confidence interval spanning zero does not prove no measurement cost. Startup probe elapsed time is additionally reported in the new startup tables.

| Implementation | Run ID | Date (UTC) | Metric | Paired blocks n | Collector on minus off ms | 95% interval low ms | 95% interval high ms |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Fluent Web Components | Historical; see original source note | — | fcp | 5 | -12.0 | -12.0 | 4.0 |
| Fluent Web Components | Historical; see original source note | — | scriptMs | 5 | 2.5 | -3.3 | 4.1 |
| Fluent Web Components | Historical; see original source note | — | styleMs | 5 | -0.9 | -2.2 | 2.6 |
| Fluent Web Components | Historical; see original source note | — | layoutMs | 5 | -2.2 | -4.4 | -1.1 |
| Fluent Web Components | Historical; see original source note | — | taskMs | 5 | 10.6 | 6.7 | 19.6 |
| En Reve main 6d09b31c | en-reve-main-overhead-v1 | 2026-09-24 | scriptMs | 5 | 2.3 | 0.2 | 4.0 |
| En Reve main 6d09b31c | en-reve-main-overhead-v1 | 2026-09-24 | taskMs | 5 | 4.2 | -17.0 | 12.1 |
| En Reve main 6d09b31c | en-reve-main-overhead-v1 | 2026-09-24 | layoutMs | 5 | 0.4 | -0.3 | 0.9 |
| En Reve main 6d09b31c | en-reve-main-overhead-v1 | 2026-09-24 | styleMs | 5 | 0.2 | -0.5 | 1.1 |

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

En Reve rows now use **local main 6d09b31c**, measured in the September 23 refresh. Acquisition IDs distinguish current values from historical peers. Mixed-session rows are descriptive, not paired comparisons. See [the new En Reve main cohort](#en-reve-main-comparison) for contemporaneous Fluent WC/Web Awesome controls. Prior En Reve results remain in the [retained pre-refresh report](../showcases/performance/reports/en-reve-main/prior-results.md).

Spectrum WC rows below now use **@adobe/spectrum-wc 2.0.0-beta.3 + Gen1 1.12.2 controls**, measured September 22. Acquisition IDs distinguish this refresh from the retained historical peers. These mixed-session rows are descriptive, not paired comparisons. See [the new Spectrum cohort](#spectrum-gen2-comparison) for contemporaneous En Reve/Fluent controls and versioned evidence. Prior Gen1 results remain in the [retained pre-refresh report](../showcases/performance/reports/spectrum-gen2/prior-results.md).

Six rows retain the 30-block first reference; Spectrum and En Reve now use their explicitly labelled 10-sample refreshes. Web Awesome is added from its later 10-sample cold-mobile load acquisition with the same requested CPU/network profile; it is not part of those original randomized blocks. The frozen payload inventories supply its file sizes. Use the current three-system cohort for paired differences.

The original eight-system reference acquisition used the frozen default native CSR implementation, Chromium headless shell 153.0.8010.12, 390 × 844 viewport, fourfold CPU throttling, 100 ms CDP network latency and 8 Mbps download. The host was an Apple M5 Max (18 logical CPUs, 64 GiB RAM, macOS/Darwin 25.6.0), running on battery during the reference campaign. Every sample uses a fresh browser process/profile. Thirty randomized interleaved blocks completed without failures. HTTPS/HTTP2 and identical compression/cache policies are served locally. Network emulation does not reproduce a remote backend's response-start timing or a physical phone.

| Implementation | Run ID | Date (UTC) | Successful n | Initial JS Brotli KiB | All JS Brotli KiB | External CSS Brotli KiB | Median LCP ms | Lab p75 LCP ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-load-v1 | 2026-09-24 | 10 | 86.9 | 86.9 | 5.9 | 644.0 | 662.0 |
| Radix React | Historical reference (30 blocks) | 2026-09-20 | 30 | 102.9 | 102.9 | 49.0 | 656 | 666 |
| Fluent React | Historical reference (30 blocks) | 2026-09-20 | 30 | 170.8 | 170.8 | 1.0 | 684 | 699 |
| Spectrum React S2 | Historical reference (30 blocks) | 2026-09-20 | 30 | 216.3 | 216.3 | 11.3 | 1,380 | 1,413 |
| Astryx React | Historical reference (30 blocks) | 2026-09-20 | 30 | 174.0 | 174.2 | 26.5 | 770 | 784 |
| shadcn React | Historical reference (30 blocks) | 2026-09-20 | 30 | 138.6 | 138.6 | 10.8 | 702 | 708 |
| Fluent Web Components | Historical reference (30 blocks) | 2026-09-20 | 30 | 57.1 | 57.1 | 1.2 | 504 | 519 |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-load-v1 | 2026-09-22 | 10 | 171.3 | 185.4 | 14.0 | 776.0 | 784.0 |
| Web Awesome | web-awesome-load-v1 | 2026-09-21 | 10 | 86.4 | 86.4 | 4.9 | 604.0 | 611.0 |

Initial JS means static HTML/preload/import reachability; runtime dynamic loads are recorded separately. All-JS includes every emitted chunk. CSS inside JavaScript remains in the JS totals. shadcn also emits approximately 68.1 KiB of local compressed fonts; Spectrum React requests a native remote Typekit font (approximately 483 KB observed). Remote fonts are not counted as free, nor removed to improve that implementation's result. Spectrum Web Components emits 18 JS files and nine dynamic import edges; its full emitted JS is not all initial transfer.

En Reve's smaller script time does not explain away its startup gap. In this cohort its median accumulated script time was 73.3 ms versus Fluent WC's 113.7 ms, while style time was 55.5 versus 40.2 ms. These CDP totals cover the bounded sample, rather than isolating the LCP critical path. Source traces and DOM diagnostics below identify hypotheses; they do not establish causality by themselves.

The broad five-block load pilot covered both viewport/CPU profiles and cold/warm cache states: **160/160 successful samples**. Its warm mobile medians were 276 ms for En Reve and 208 ms for Fluent WC; with five samples, this is a follow-up signal rather than a second reference baseline. Desktop and warm-cache reference-size campaigns remain commands in the harness, not inferred results.

## Rendering and interaction evidence

En Reve rows now use **local main 6d09b31c**, measured in the September 23 refresh. Acquisition IDs distinguish current values from historical peers. Mixed-session rows are descriptive, not paired comparisons. See [the new En Reve main cohort](#en-reve-main-comparison) for contemporaneous Fluent WC/Web Awesome controls. Prior En Reve results remain in the [retained pre-refresh report](../showcases/performance/reports/en-reve-main/prior-results.md).

Spectrum WC rows below now use **@adobe/spectrum-wc 2.0.0-beta.3 + Gen1 1.12.2 controls**, measured September 22. Acquisition IDs distinguish this refresh from the retained historical peers. These mixed-session rows are descriptive, not paired comparisons. See [the new Spectrum cohort](#spectrum-gen2-comparison) for contemporaneous En Reve/Fluent controls and versioned evidence. Prior Gen1 results remain in the [retained pre-refresh report](../showcases/performance/reports/spectrum-gen2/prior-results.md).

The connected-structure table below now includes all nine implementations. Historical reference rows and the later Web Awesome acquisition are shown together for descriptive comparison. Acquisition IDs are explicit; these rows are not paired blocks. Use the supplemental contemporaneous En Reve/Fluent/Web Awesome tables for measured differences. A dash means unavailable, never zero. For sortable timing evidence across the same panel, see [interaction responsiveness](#interaction-responsiveness), [main-thread work](#main-thread-work-and-load-blocking), and [supporting diagnostics](#supporting-diagnostics).

Eight diagnostic desktop journeys completed with timeline/CPU traces, source-mapped sampled functions, coverage and connected DOM counts. Diagnostic timings are excluded from primary distributions. Category durations may overlap and must not be added together.

| Implementation | Run ID | Date (UTC) | Connected nodes | Connected elements | Open shadow roots | Style elements | Stylesheet adoptions | Unique adopted sheets |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | en-reve-main-diagnostic-v1 | 2026-09-24 | 4,668 | 1,580 | 167 | 0 | 598 | 34 |
| Radix React | Historical diagnostic-desktop-v1 | 2026-09-20 | 653 | 454 | 0 | 0 | 0 | 0 |
| Fluent React | Historical diagnostic-desktop-v1 | 2026-09-20 | 745 | 543 | 0 | 23 | 0 | 0 |
| Spectrum React S2 | Historical diagnostic-desktop-v1 | 2026-09-20 | 880 | 653 | 0 | 1 | 0 | 0 |
| Astryx React | Historical diagnostic-desktop-v1 | 2026-09-20 | 1,488 | 1,158 | 0 | 0 | 0 | 0 |
| shadcn React | Historical diagnostic-desktop-v1 | 2026-09-20 | 675 | 477 | 0 | 0 | 0 | 0 |
| Fluent Web Components | Historical diagnostic-desktop-v1 | 2026-09-20 | 2,889 | 1,284 | 169 | 0 | 221 | 32 |
| Spectrum WC Gen2 + Gen1 | spectrum-gen2-diagnostic-v1 | 2026-09-22 | 4,077 | 1,234 | 196 | 0 | 395 | 46 |
| Web Awesome | web-awesome-diagnostic-v1 | 2026-09-21 | 4,212 | 1,401 | 197 | 0 | 611 | 36 |

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

<!-- BEGIN EN REVE CURRENT DOM -->
### Current connected totals with and without dates

Initial settled desktop tree. Date boundaries follow the entire field, rather than only the visible input. En Reve main and both frozen controls are measured in the same diagnostic acquisition.

| Implementation | Samples n | Full nodes | Full elements | Date nodes | Date elements | Without date nodes | Without date elements |
| --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | 3 | 4667 | 1580 | 628 | 181 | 4039 | 1399 |
| Fluent Web Components | 3 | 2887 | 1284 | 28 | 12 | 2859 | 1272 |
| Web Awesome | 3 | 4210 | 1401 | 28 | 8 | 4182 | 1393 |

### Current cohort custom-date lifecycle

Only custom-calendar implementations have visible-grid open/closed diagnostic sessions. Native-picker browser internals are outside census scope. These measurements do not make a browser-native date input equivalent to En Reve’s custom calendar.

| Implementation | State | Samples n | Full nodes | Full elements | Date nodes | Date elements | Without date nodes | Without date elements |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | initial | 3 | 4667 | 1580 | 628 | 181 | 4039 | 1399 |
| En Reve main 6d09b31c | date-open | 3 | 4667 | 1580 | 628 | 181 | 4039 | 1399 |
| En Reve main 6d09b31c | date-closed | 3 | 4667 | 1580 | 628 | 181 | 4039 | 1399 |

### Current connected base parts

Part naming is a convention: no base part does not mean no wrapper. SVG bases are rendering primitives. Earlier En Reve host-migration candidates remain proposals; moving part=base to a host does not preserve a consumer ::part(base) selector.

| Implementation | All base parts | SVG base parts | Non-SVG base parts | Without-date base parts | Without-date non-SVG base parts |
| --- | --- | --- | --- | --- | --- |
| En Reve main 6d09b31c | 55 | 19 | 36 | 50 | 35 |
| Fluent Web Components | 0 | 0 | 0 | 0 | 0 |
| Web Awesome | 98 | 0 | 98 | 97 | 97 |

The source audit and detailed historical panel below retain their original counts and source contracts.
<!-- END EN REVE CURRENT DOM -->

This source audit retains its original build and counts. See [current En Reve connected totals and date exclusions](#en-reve-main-connected-totals-with-and-without-dates) for the main refresh; earlier wrapper findings remain historical investigation proposals.

This retained source audit and its tables describe the earlier Gen1 Spectrum artifact. For the refreshed build, see [Spectrum Gen2 connected totals and date exclusions](#spectrum-gen2-connected-totals-with-and-without-dates).

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

<!-- BEGIN WEB AWESOME -->
## Web Awesome comparison

The Web Awesome tables below are the retained historical acquisition. For the refreshed En Reve library, use [the current main cohort](#en-reve-main-comparison); historical paired contrasts cannot be recalculated with a different En Reve build.

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
<!-- END WEB AWESOME -->

<!-- BEGIN SPECTRUM GEN2 -->
## Spectrum Gen2 comparison

The Spectrum Gen2 tables below are the retained historical acquisition. For the refreshed En Reve library, use [the current main cohort](#en-reve-main-comparison); historical paired contrasts cannot be recalculated with a different En Reve build.

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
<!-- END SPECTRUM GEN2 -->

<!-- BEGIN EN REVE MAIN -->
## En Reve main comparison

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
<!-- END EN REVE MAIN -->


<!-- BEGIN CALENDAR VARIANTS -->
## Calendar delivery variants

This experiment compares **the same main 6d09b31c packages and the same 16-card UI** under three consumer policies. The eager control is the exact previously frozen artifact, measured again alongside both alternatives. Previous results and peer libraries retain their original measurement dates; these variant results do not replace the default implementation.

**Date (UTC)** means sample measurement date. **Run ID** replaces the less familiar “Acquisition” label and identifies the raw evidence. Report rebuild dates do not change measurement dates.

### Calendar findings and priorities

- Initial connected DOM falls from **4,667 nodes / 1,580 elements** to **4,172 / 1,442** with either deferred policy. Excluding the date field, all three remain **4,039 / 1,399**. This optimization does not address the rest of En Reve’s DOM footprint.
- Mobile first usable calendar focus is **46.4 ms eager**, **63.9 ms construction-only**, and **179.7 ms code-split**, with 30 unprepared samples per policy. Read the interval table before interpreting small differences.
- Code splitting saves **2.8 KiB** of initial Brotli JavaScript, but all emitted chunks together cost **2.2 KiB more** than eager. The 5.0 KiB optional chunk adds a network dependency on first opening.
- **Keep eager as the default reference.** Construction-only is the first candidate when initial DOM footprint matters; code splitting needs an application-specific case for trading first-use latency for a small initial-byte saving. Neither policy automatically proves a meaningful LCP improvement.
- Next investigations: attribute calendar construction/update/style/layout costs; inspect the shell/chunk overhead; retain the existing non-date wrapper audit. Closed-again deferred calendars remain connected, so a retention policy would require its own interaction and memory qualification.


### Calendar campaign coverage

Primary runs use Chromium headless shell; memory and Lighthouse use full Chromium. Load: 10 samples per desktop/mobile × cold/warm cell. Calendar first use: 30 mobile and 10 desktop samples per policy; preparation cases: 10 mobile each. Desktop has no throttling. Mobile has 4× CPU slowdown, 100 ms requested network latency, 8 Mbps down/2 Mbps up. Policies are randomly ordered inside blocks; all browser work is serial. These remain exploratory workstation results, not field INP or a promoted regression gate.

| Run ID | Date (UTC) | Planned n | Recorded n | Successful n | Failed n |
| --- | --- | --- | --- | --- | --- |
| calendar-variants-v1 | 2026-09-24 | 383 | 383 | 383 | 0 |
| calendar-variants-lighthouse-v1 | 2026-09-24 | 15 | 15 | 15 | 0 |

### Calendar production payload and chunks

Artifact sizes, not runtime heap or machine code. “All JS” is the full emitted/minified uncompressed JavaScript. Compression is gzip9/Brotli11. Optional calendar loading is verified by browser requests; construction-only leaves the eager code in the entry bundle. Split totals include every emitted chunk, even on unused-calendar visits. Source maps are diagnostic files and are not served.

| Implementation | Initial JS KiB | Initial JS Brotli KiB | All JS KiB | All JS gzip KiB | All JS Brotli KiB | Optional JS KiB | Optional JS Brotli KiB | CSS Brotli KiB | JS chunks | Dynamic edges |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | 439.5 | 86.9 | 439.5 | 108.3 | 86.9 | 0.0 | 0.0 | 5.9 | 1 | 0 |
| En Reve · Deferred construction | 439.5 | 86.9 | 439.5 | 108.3 | 86.9 | 0.0 | 0.0 | 5.9 | 1 | 0 |
| En Reve · Deferred code + construction | 421.3 | 84.1 | 441.7 | 110.0 | 89.1 | 20.4 | 5.0 | 5.9 | 2 | 1 |

### Calendar mobile cold loading

Successful-sample medians unless labeled otherwise. Same campaign, same package build, matched application content; policy changes only. mobile/cold.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | FCP ms | LCP ms | LCP p75 ms | CLS | CLS p75 | CLS max | TTFB ms | Cards frame opportunity ms | Last webfont response ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 646.0 | 646.0 | 663.0 | 0.000000 | 0.000000 | 0.000000 | 16.8 | 640.8 | — |
| En Reve · Deferred construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 640.0 | 640.0 | 673.0 | 0.000000 | 0.000000 | 0.000000 | 16.2 | 636.4 | — |
| En Reve · Deferred code + construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 642.0 | 642.0 | 667.0 | 0.000000 | 0.000000 | 0.000000 | 17.5 | 636.3 | — |

### Calendar mobile cold response transfer

Successful-sample medians unless labeled otherwise. Same campaign, same package build, matched application content; policy changes only. mobile/cold.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 93.5 | 0.328 | 87.1 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| En Reve · Deferred construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 93.4 | 0.328 | 87.0 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| En Reve · Deferred code + construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 90.7 | 0.324 | 84.3 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |

### Calendar mobile cold main-thread work

Successful-sample medians unless labeled otherwise. Same campaign, same package build, matched application content; policy changes only. mobile/cold.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Script ms | Style ms | Layout ms | Task ms | Layout passes | Style recalcs | Long tasks ms | Pre-FCP blocking excess ms | Post-FCP blocking excess ms | Long animation frames ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 86.2 | 60.4 | 31.4 | 375.4 | 7 | 11 | 287.0 | 237.0 | 0.0 | 410.8 |
| En Reve · Deferred construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 86.7 | 60.9 | 32.7 | 372.0 | 7 | 11 | 281.5 | 231.5 | 0.0 | 404.1 |
| En Reve · Deferred code + construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 85.4 | 63.2 | 33.9 | 372.8 | 7 | 11 | 283.5 | 233.5 | 0.0 | 406.7 |

### Calendar mobile warm loading

Successful-sample medians unless labeled otherwise. Same campaign, same package build, matched application content; policy changes only. mobile/warm.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | FCP ms | LCP ms | LCP p75 ms | CLS | CLS p75 | CLS max | TTFB ms | Cards frame opportunity ms | Last webfont response ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 302.0 | 302.0 | 313.0 | 0.000000 | 0.000000 | 0.000000 | 1.5 | 308.3 | — |
| En Reve · Deferred construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 298.0 | 298.0 | 300.0 | 0.000000 | 0.000000 | 0.000000 | 1.8 | 307.2 | — |
| En Reve · Deferred code + construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 292.0 | 292.0 | 303.0 | 0.000000 | 0.000000 | 0.000000 | 0.9 | 301.5 | — |

### Calendar mobile warm response transfer

Successful-sample medians unless labeled otherwise. Same campaign, same package build, matched application content; policy changes only. mobile/warm.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 0.2 | 0.246 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| En Reve · Deferred construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 0.2 | 0.246 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| En Reve · Deferred code + construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 0.2 | 0.242 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |

### Calendar mobile warm main-thread work

Successful-sample medians unless labeled otherwise. Same campaign, same package build, matched application content; policy changes only. mobile/warm.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Script ms | Style ms | Layout ms | Task ms | Layout passes | Style recalcs | Long tasks ms | Pre-FCP blocking excess ms | Post-FCP blocking excess ms | Long animation frames ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 54.0 | 42.8 | 13.7 | 240.1 | 7 | 11 | 163.0 | 113.0 | 0.0 | 166.6 |
| En Reve · Deferred construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 55.9 | 44.0 | 14.1 | 238.0 | 7 | 11 | 161.5 | 111.5 | 0.0 | 165.0 |
| En Reve · Deferred code + construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 55.6 | 42.6 | 14.0 | 235.4 | 7 | 11 | 160.5 | 110.5 | 0.0 | 164.4 |

### Calendar desktop cold loading

Successful-sample medians unless labeled otherwise. Same campaign, same package build, matched application content; policy changes only. desktop/cold.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | FCP ms | LCP ms | LCP p75 ms | CLS | CLS p75 | CLS max | TTFB ms | Cards frame opportunity ms | Last webfont response ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 100.0 | 100.0 | 104.0 | 0.000000 | 0.000000 | 0.000000 | 15.6 | 89.0 | — |
| En Reve · Deferred construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 102.0 | 102.0 | 107.0 | 0.000000 | 0.000000 | 0.000000 | 16.5 | 88.7 | — |
| En Reve · Deferred code + construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 96.0 | 96.0 | 99.0 | 0.000000 | 0.000000 | 0.000000 | 15.6 | 85.0 | — |

### Calendar desktop cold response transfer

Successful-sample medians unless labeled otherwise. Same campaign, same package build, matched application content; policy changes only. desktop/cold.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 93.5 | 0.328 | 87.1 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| En Reve · Deferred construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 93.4 | 0.328 | 87.0 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| En Reve · Deferred code + construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 90.7 | 0.324 | 84.3 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |

### Calendar desktop cold main-thread work

Successful-sample medians unless labeled otherwise. Same campaign, same package build, matched application content; policy changes only. desktop/cold.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Script ms | Style ms | Layout ms | Task ms | Layout passes | Style recalcs | Long tasks ms | Pre-FCP blocking excess ms | Post-FCP blocking excess ms | Long animation frames ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 17.3 | 12.5 | 6.3 | 77.8 | 7 | 11 | 57.5 | 7.5 | 0.0 | 59.5 |
| En Reve · Deferred construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 18.2 | 12.8 | 6.4 | 77.9 | 7 | 11 | 56.5 | 6.5 | 0.0 | 58.8 |
| En Reve · Deferred code + construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 17.0 | 12.3 | 6.0 | 74.6 | 7 | 11 | 54.0 | 4.0 | 0.0 | 57.5 |

### Calendar desktop warm loading

Successful-sample medians unless labeled otherwise. Same campaign, same package build, matched application content; policy changes only. desktop/warm.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | FCP ms | LCP ms | LCP p75 ms | CLS | CLS p75 | CLS max | TTFB ms | Cards frame opportunity ms | Last webfont response ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 44.0 | 44.0 | 48.0 | 0.000000 | 0.000000 | 0.000000 | 0.9 | 43.5 | — |
| En Reve · Deferred construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 44.0 | 44.0 | 47.0 | 0.000000 | 0.000000 | 0.000000 | 1.0 | 42.6 | — |
| En Reve · Deferred code + construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 44.0 | 44.0 | 44.0 | 0.000000 | 0.000000 | 0.000000 | 1.0 | 42.0 | — |

### Calendar desktop warm response transfer

Successful-sample medians unless labeled otherwise. Same campaign, same package build, matched application content; policy changes only. desktop/warm.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 0.2 | 0.246 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| En Reve · Deferred construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 0.2 | 0.246 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| En Reve · Deferred code + construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 0.2 | 0.242 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |

### Calendar desktop warm main-thread work

Successful-sample medians unless labeled otherwise. Same campaign, same package build, matched application content; policy changes only. desktop/warm.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Script ms | Style ms | Layout ms | Task ms | Layout passes | Style recalcs | Long tasks ms | Pre-FCP blocking excess ms | Post-FCP blocking excess ms | Long animation frames ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 12.0 | 8.8 | 3.1 | 51.9 | 6 | 11 | 0.0 | 0.0 | 0.0 | 0.0 |
| En Reve · Deferred construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 11.7 | 8.8 | 3.1 | 50.5 | 6 | 11 | 0.0 | 0.0 | 0.0 | 0.0 |
| En Reve · Deferred code + construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 11.7 | 8.9 | 3.1 | 50.1 | 6 | 11 | 0.0 | 0.0 | 0.0 | 0.0 |

### Calendar mobile startup click

Successful-sample medians unless labeled otherwise. Same campaign, same package build, matched application content; policy changes only. mobile/cold.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Control observed ms | Click from navigation ms | Result from navigation ms | Result p75 ms | Dispatch overhead ms | Discovery probe ms | Click to result ms | Click to frame ms | First input delay ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 614.0 | 632.4 | 642.0 | 646.4 | 18.5 | 0.5 | 9.8 | 47.5 | 2.8 |
| En Reve · Deferred construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 600.8 | 620.0 | 630.8 | 637.4 | 19.1 | 0.7 | 11.2 | 46.6 | 4.1 |
| En Reve · Deferred code + construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 593.4 | 612.3 | 623.2 | 628.3 | 19.2 | 0.6 | 10.3 | 46.5 | 3.4 |

### Calendar mobile interaction summary

Successful-sample medians unless labeled otherwise. Same campaign, same package build, matched application content; policy changes only. mobile/cold.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Scripted INP ms | Scripted INP p75 ms | First input delay ms | Journey CLS | Max scroll rAF gap ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 56.0 | 56.0 | 3.3 | 0.000000 | 16.8 |
| En Reve · Deferred construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 48.0 | 48.0 | 2.9 | 0.000000 | 16.8 |
| En Reve · Deferred code + construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 56.0 | 56.0 | 3.3 | 0.000000 | 16.8 |

### Calendar desktop startup click

Successful-sample medians unless labeled otherwise. Same campaign, same package build, matched application content; policy changes only. desktop/cold.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Control observed ms | Click from navigation ms | Result from navigation ms | Result p75 ms | Dispatch overhead ms | Discovery probe ms | Click to result ms | Click to frame ms | First input delay ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 86.1 | 91.5 | 93.7 | 94.3 | 5.5 | 0.1 | 2.2 | 38.0 | 0.8 |
| En Reve · Deferred construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 82.7 | 88.1 | 90.5 | 92.8 | 5.5 | 0.1 | 2.3 | 31.0 | 1.0 |
| En Reve · Deferred code + construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 82.6 | 88.4 | 90.5 | 92.0 | 5.8 | 0.1 | 2.2 | 30.7 | 0.7 |

### Calendar desktop interaction summary

Successful-sample medians unless labeled otherwise. Same campaign, same package build, matched application content; policy changes only. desktop/cold.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Scripted INP ms | Scripted INP p75 ms | First input delay ms | Journey CLS | Max scroll rAF gap ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 40.0 | 48.0 | 0.7 | 0.000000 | 16.8 |
| En Reve · Deferred construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 40.0 | 48.0 | 0.7 | 0.000000 | 16.8 |
| En Reve · Deferred code + construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 44.0 | 48.0 | 0.7 | 0.000000 | 16.8 |

### Calendar repeated mobile Lighthouse audits

Successful-sample medians unless labeled otherwise. Same campaign, same package build, matched application content; policy changes only. mobile/cold.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | FCP ms | LCP ms | LCP p75 ms | LCP max ms | TBT ms | TBT p75 ms | TBT max ms | Speed Index ms | CLS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | calendar-variants-lighthouse-v1 | 2026-09-24 | 5 | 0 | 789.6 | 789.6 | 791.7 | 824.7 | 0.0 | 0.0 | 0.0 | 631.0 | 0.000000 |
| En Reve · Deferred construction | calendar-variants-lighthouse-v1 | 2026-09-24 | 5 | 0 | 745.8 | 745.8 | 750.4 | 758.5 | 0.0 | 0.0 | 0.0 | 604.0 | 0.000000 |
| En Reve · Deferred code + construction | calendar-variants-lighthouse-v1 | 2026-09-24 | 5 | 0 | 753.3 | 753.3 | 754.0 | 773.6 | 0.0 | 0.0 | 0.0 | 607.0 | 0.000000 |

### Calendar mobile first and repeated use

Trusted Enter activation to the first observed focused calendar date; frame is the subsequent animation-frame opportunity, not proof of paint. Includes first-use construction/download as applicable. Native editing, ArrowRight + Enter date selection, reopening, Escape and project creation must succeed. Journey INP/FID include other scripted input and are not the calendar activation duration. Calendar samples do not replace no-input load LCP.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | First focus ms | First focus p75 ms | First frame ms | Repeated focus ms | Repeated frame ms | First input delay ms | Calendar journey INP ms | Complete journey response KiB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | calendar-variants-v1 | 2026-09-24 | 30 | 0 | 46.4 | 47.9 | 53.3 | 19.0 | 25.2 | 0.7 | 56.0 | 93.5 |
| En Reve · Deferred construction | calendar-variants-v1 | 2026-09-24 | 30 | 0 | 63.9 | 66.5 | 70.1 | 18.6 | 26.0 | 0.6 | 72.0 | 93.4 |
| En Reve · Deferred code + construction | calendar-variants-v1 | 2026-09-24 | 30 | 0 | 179.7 | 181.0 | 186.0 | 19.2 | 28.2 | 0.7 | 48.0 | 95.8 |

### Calendar desktop first and repeated use

Trusted Enter activation to the first observed focused calendar date; frame is the subsequent animation-frame opportunity, not proof of paint. Includes first-use construction/download as applicable. Native editing, ArrowRight + Enter date selection, reopening, Escape and project creation must succeed. Journey INP/FID include other scripted input and are not the calendar activation duration. Calendar samples do not replace no-input load LCP.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | First focus ms | First focus p75 ms | First frame ms | Repeated focus ms | Repeated frame ms | First input delay ms | Calendar journey INP ms | Complete journey response KiB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 9.8 | 12.4 | 21.2 | 13.0 | 29.5 | 0.4 | 24.0 | 93.5 |
| En Reve · Deferred construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 13.6 | 14.1 | 22.6 | 12.8 | 29.6 | 0.3 | 24.0 | 93.4 |
| En Reve · Deferred code + construction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 23.3 | 23.7 | 40.0 | 12.9 | 29.6 | 0.2 | 12.0 | 95.8 |

### Calendar connected DOM lifecycle

Connected document and accessible open shadow roots, counted consistently across states. Native browser popup internals and detached nodes are excluded. Deferred calendars remain connected after first use; this is an initial-DOM optimization, not automatic eviction.

| Implementation | Date (UTC) | Successful n | Initial nodes | Initial elements | Initial date nodes | Initial date elements | Without date nodes | Without date elements | Opened nodes | Closed again nodes | After close date nodes | After close date elements |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | 2026-09-24 | 30 | 4,667 | 1,580 | 628 | 181 | 4,039 | 1,399 | 4,667 | 4,667 | 628 | 181 |
| En Reve · Deferred construction | 2026-09-24 | 30 | 4,172 | 1,442 | 133 | 43 | 4,039 | 1,399 | 4,669 | 4,669 | 630 | 182 |
| En Reve · Deferred code + construction | 2026-09-24 | 30 | 4,172 | 1,442 | 133 | 43 | 4,039 | 1,399 | 4,669 | 4,669 | 630 | 182 |

### Calendar code preparation tradeoff

Preparation is an explicit application policy, not enabled in the production fixture. Prepared activation latency excludes prior loading: preparation-to-focus and actual lead expose that cost. “Pending” describes initiation policy; browser/automation timing can finish preparation before Enter. Requests also cost bytes on visits that never open the calendar (see optional chunk above). These preparation groups ran after the unprepared blocks, so treat differences as descriptive.

| Implementation | Preparation policy | Run ID | Date (UTC) | Successful n | Failed n | Activation to focus ms | Preparation to focus ms | Available lead ms | Complete journey response KiB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Deferred code + construction | No preparation | calendar-variants-v1 | 2026-09-24 | 30 | 0 | 179.7 | — | — | 95.8 |
| En Reve · Deferred code + construction | Start preparation immediately before interaction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 149.2 | 175.0 | 26.3 | 95.8 |
| En Reve · Deferred code + construction | Await full preparation before interaction | calendar-variants-v1 | 2026-09-24 | 10 | 0 | 64.5 | 203.9 | 140.3 | 95.8 |

### Calendar memory before and after ten openings

One full-Chromium, cross-origin-isolated session per policy. Native edit, selection and form submission are included. No forced GC; API timeout/unsupported is unavailable, never zero. CDP nodes include retained/detached nodes, unlike the connected-DOM census. Two checkpoints cannot establish or exclude a leak.

| Implementation | Date (UTC) | Openings | API status | API memory MiB | JS heap MiB | CDP nodes | CDP listeners |
| --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Deferred code + construction | 2026-09-24 | 0 | ok | 4.87 | 4.14 | 5814 | 415 |
| En Reve · Deferred code + construction | 2026-09-24 | 10 | timeout | — | 6.90 | 6454 | 577 |
| En Reve · Deferred construction | 2026-09-24 | 0 | ok | 5.02 | 4.17 | 5814 | 415 |
| En Reve · Deferred construction | 2026-09-24 | 10 | timeout | — | 5.78 | 6452 | 575 |
| En Reve · Eager reference | 2026-09-24 | 0 | ok | 5.21 | 4.32 | 6376 | 547 |
| En Reve · Eager reference | 2026-09-24 | 10 | timeout | — | 5.68 | 6446 | 574 |

### Calendar differences against the eager control

Candidate median minus eager median; negative means faster. Paired-block percentile bootstrap of difference in medians, 2,000 resamples. Exploratory intervals without multiple-comparison correction; overlapping zero is inconclusive, not a tie.

| Implementation | Profile | Metric | Paired n | Difference ms | 95% lower ms | 95% upper ms |
| --- | --- | --- | --- | --- | --- | --- |
| En Reve · Deferred construction | mobile | cold LCP | 10 | -6.0 | -20.0 | 16.0 |
| En Reve · Deferred code + construction | mobile | cold LCP | 10 | -4.0 | -28.0 | 20.0 |
| En Reve · Deferred construction | mobile | first focus | 30 | 17.5 | 15.9 | 19.0 |
| En Reve · Deferred code + construction | mobile | first focus | 30 | 133.3 | 132.1 | 133.9 |
| En Reve · Deferred construction | desktop | cold LCP | 10 | 2.0 | -8.0 | 6.0 |
| En Reve · Deferred code + construction | desktop | cold LCP | 10 | -4.0 | -10.0 | -2.0 |
| En Reve · Deferred construction | desktop | first focus | 10 | 3.8 | -0.0 | 4.6 |
| En Reve · Deferred code + construction | desktop | first focus | 10 | 13.5 | 8.3 | 14.9 |

### Calendar interpretation and next steps

Deferred construction removes work before the first opening but keeps the entire calendar code available. The shell policy can additionally defer bytes; it may add a network dependency to first use. Compare cold/warm loading, first usable focus, and total delivered bytes together before choosing a policy. The control is remeasured here to keep those tradeoffs within one campaign.

1. Prefer the construction-only option for an often-unused single-date popup when avoiding additional first-use network latency matters. Validate against the observed focus costs before adopting it broadly.
2. Consider the shell entry where initial download matters enough to justify its first-use tradeoff. Keep native editing and essential form controls eager. Importing the eager date definition elsewhere removes code-splitting benefits.
3. Treat preparation as purchased latency reduction: count its download on unused visits and its full preparation-to-readiness interval. Do not judge it solely by the shorter prepared-activation number.
4. Retention after first use remains a separate library investigation. This experiment does not remove wrappers, weaken accessibility, or establish a memory leak.
5. Optional overlays, viewport activation and SSR remain subsequent experiments; none is silently folded into this comparison. Native scoped-registry ownership is also not changed here: the shell uses the existing global registry.

Recovery qualification found that Chromium retained the deliberately failed dynamic import when explicit retry was requested; Firefox and WebKit resolved the retry. Reload recovery and touch opening passed in all three. Keep an editable native field and a visible recovery path; retry is not a guaranteed replacement for reload.

The existing showcase qualification passes 22 checks per policy. Calendar journeys are separately qualified across Chromium, Firefox and WebKit. Timing is Chromium only; automated focus checks do not replace manual assistive-technology review. See [qualification](../showcases/performance/reports/calendar-variants/qualification.json), [failure/cancellation/retry and touch checks](../showcases/performance/reports/calendar-variants/recovery-qualification.json), [build identities](../showcases/performance/reports/calendar-variants/builds.json), and [raw evidence receipt](../showcases/performance/reports/calendar-variants/evidence.json).

<!-- END CALENDAR VARIANTS -->
