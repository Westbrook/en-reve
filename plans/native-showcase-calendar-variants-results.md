# Calendar delivery performance

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
