# Connected DOM review

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
