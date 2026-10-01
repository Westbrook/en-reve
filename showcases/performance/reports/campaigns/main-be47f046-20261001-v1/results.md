# Performance campaign main-be47f046-20261001-v1

Campaign status: **complete**. Current source and frozen controls run in separate sequential cohorts; compare descriptively, not as matched randomized blocks. Dates are UTC measurement dates. Rebuilding this report does not change them.

This is exploratory laboratory evidence, not field Core Web Vitals, a physical mobile device, manual accessibility acceptance, or a promoted regression baseline. First-input delay is a scripted legacy diagnostic; scripted INP describes only these journeys. Lighthouse TBT stays separate from observed long-task blocking excess.

Profiles and requested throttling: {"desktop":{"viewport":{"width":1500,"height":1100},"deviceScaleFactor":1,"cpuRate":1,"latency":0,"download":-1,"upload":-1,"description":"Desktop loopback; no simulated throttling"},"mobile":{"viewport":{"width":390,"height":844},"deviceScaleFactor":1,"cpuRate":4,"latency":100,"download":1000000,"upload":250000,"description":"Mobile viewport, 4x CPU slowdown, 100ms RTT, 8Mbps down/2Mbps up; emulation, not physical hardware"}}

[Campaign configuration](campaign.json) · [Stage outcomes](state.json) · [Metric availability and tables](tables.json)

## First reference comparison

All emitted/minified uncompressed JS and compressed artifact sizes; source maps excluded. These are build sizes, not actual response bytes or decoded runtime memory.

| Implementation | Build fingerprint | All JS KiB | All JS gzip KiB | All JS Brotli KiB | HTML KiB | CSS Brotli KiB | JS chunks | Dynamic imports |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | 7236c0854897d7e62f89a9398cbf0ec909ab7278f88a029433acc51d4af0a486 | 281.2 | 69.3 | 57.1 | 0.4 | 1.2 | 1 | 0 |
| En Reve · Web Components | 683d823d13a31fd518145109c1629bd1654a0fc879160329fb8caf07246a756c | 439.5 | 108.3 | 87.0 | 0.4 | 5.9 | 1 | 0 |
| Web Awesome · Web Components | 5694cb62336733951bcb793f18aac9b9fc884324ef953bb44369acfdca4fd97e | 469.8 | 110.5 | 86.4 | 0.4 | 4.9 | 1 | 0 |
| En Reve · Current source | f28ce504edf08abdd6aea649060148a8c333e3c7092c7dd91e06112d7c188dd6 | 445.0 | 109.9 | 88.2 | 0.4 | 5.9 | 1 | 0 |

## Production payload sizes

Offline gzip9/Brotli11 sizes. Initial assets follow HTML/static imports; source maps excluded. Date identifies the measurement cohort, not an invented build date.

| Implementation | Run ID | Date (UTC) | JS raw KiB | JS gzip KiB | JS Brotli KiB | Initial JS Brotli KiB | CSS raw KiB | CSS Brotli KiB | Local fonts Brotli KiB | HTML raw KiB | HTML Brotli KiB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1 | 2026-10-01 | 281.2 | 69.3 | 57.1 | 57.1 | 4.2 | 1.2 | 0.0 | 0.4 | 0.2 |
| En Reve · Web Components | main-be47f046-20261001-v1 | 2026-10-01 | 439.5 | 108.3 | 87.0 | 87.0 | 43.5 | 5.9 | 0.0 | 0.4 | 0.2 |
| Web Awesome · Web Components | main-be47f046-20261001-v1 | 2026-10-01 | 469.8 | 110.5 | 86.4 | 86.4 | 53.4 | 4.9 | 0.0 | 0.4 | 0.2 |
| En Reve · Current source | main-be47f046-20261001-v1 | 2026-10-01 | 445.0 | 109.9 | 88.2 | 88.2 | 43.5 | 5.9 | 0.0 | 0.4 | 0.2 |

## Chunk structure

Static import reachability from the production entry; actual requested bytes remain in transfer tables.

| Implementation | Run ID | Date (UTC) | JS files | CSS files | Static initial assets | Dynamic import edges |
| --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1 | 2026-10-01 | 1 | 1 | 2 | 0 |
| En Reve · Web Components | main-be47f046-20261001-v1 | 2026-10-01 | 1 | 1 | 2 | 0 |
| Web Awesome · Web Components | main-be47f046-20261001-v1 | 2026-10-01 | 1 | 1 | 2 | 0 |
| En Reve · Current source | main-be47f046-20261001-v1 | 2026-10-01 | 1 | 1 | 2 | 0 |

## Native initial and complete payload

Native-control static import graph and all emitted assets. Candidate totals are in the first table; measured response bytes below include requests actually made.

| Implementation | Initial JS Brotli KiB | All JS raw KiB | All JS gzip KiB | All JS Brotli KiB | Fonts Brotli KiB | Dynamic imports |
| --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | 57.1 | 281.2 | 69.3 | 57.1 | — | 0 |
| En Reve · Web Components | 87.0 | 439.5 | 108.3 | 87.0 | — | 0 |
| Web Awesome · Web Components | 86.4 | 469.8 | 110.5 | 86.4 | — | 0 |

## Acquisition coverage

Missing and failed samples remain visible. This report can be regenerated from archived raw data without starting a browser.

| Run ID | Date (UTC) | Status | Planned n | Recorded n | Successful n | Failed n |
| --- | --- | --- | --- | --- | --- | --- |
| main-be47f046-20261001-v1-load | 2026-10-01 | complete | 120 | 120 | 120 | 0 |
| main-be47f046-20261001-v1-current-load | 2026-10-01 | complete | 40 | 40 | 40 | 0 |
| main-be47f046-20261001-v1-startup | 2026-10-01 | complete | 60 | 60 | 60 | 0 |
| main-be47f046-20261001-v1-current-startup | 2026-10-01 | complete | 20 | 20 | 20 | 0 |
| main-be47f046-20261001-v1-interactions | 2026-10-01 | complete | 60 | 60 | 60 | 0 |
| main-be47f046-20261001-v1-current-interactions | 2026-10-01 | complete | 20 | 20 | 20 | 0 |
| main-be47f046-20261001-v1-diagnostic | 2026-10-01 | complete | 3 | 3 | 3 | 0 |
| main-be47f046-20261001-v1-current-diagnostic | 2026-10-01 | complete | 1 | 1 | 1 | 0 |
| main-be47f046-20261001-v1-memory | 2026-10-01 | complete | 3 | 3 | 3 | 0 |
| main-be47f046-20261001-v1-current-memory | 2026-10-01 | complete | 1 | 1 | 1 | 0 |
| main-be47f046-20261001-v1-lighthouse | 2026-10-01 | complete | 15 | 15 | 15 | 0 |
| main-be47f046-20261001-v1-current-lighthouse | 2026-10-01 | complete | 5 | 5 | 5 | 0 |
| main-be47f046-20261001-v1-bfcache | 2026-10-01 | complete | 15 | 15 | 15 | 0 |
| main-be47f046-20261001-v1-current-bfcache | 2026-10-01 | complete | 5 | 5 | 5 | 0 |
| main-be47f046-20261001-v1-overhead | 2026-10-01 | complete | 30 | 30 | 30 | 0 |
| main-be47f046-20261001-v1-current-overhead | 2026-10-01 | complete | 10 | 10 | 10 | 0 |

## load · loading · mobile · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | FCP ms | LCP ms | LCP p75 ms | CLS | CLS p75 | CLS max | TTFB ms | Cards frame opportunity ms | Last webfont response ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 536.0 | 536.0 | 563.0 | 0.000000 | 0.000000 | 0.000000 | 16.8 | 531.7 | — |
| En Reve · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 672.0 | 672.0 | 685.0 | 0.000000 | 0.000000 | 0.000000 | 15.8 | 667.1 | — |
| Web Awesome · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 628.0 | 628.0 | 639.0 | 0.000000 | 0.000000 | 0.000000 | 16.8 | 626.2 | — |
| En Reve · Current source | main-be47f046-20261001-v1-current-load | 2026-10-01 | 10 | 0 | 648.0 | 648.0 | 651.0 | 0.000000 | 0.000000 | 0.000000 | 14.9 | 643.5 | — |

## load · lcp · mobile · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | TTFB portion ms | Resource delay ms | Resource duration ms | Element render delay ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 16.8 | 0.0 | 0.0 | 518.4 |
| En Reve · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 15.8 | 0.0 | 0.0 | 652.1 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 16.8 | 0.0 | 0.0 | 604.6 |
| En Reve · Current source | main-be47f046-20261001-v1-current-load | 2026-10-01 | 10 | 0 | 14.9 | 0.0 | 0.0 | 633.6 |

## load · transfer · mobile · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 58.9 | 0.344 | 57.2 | 1.3 | 0.0 | 0.0 | 3 | 0 | 0 |
| En Reve · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 93.5 | 0.327 | 87.1 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 91.9 | 0.336 | 86.5 | 5.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| En Reve · Current source | main-be47f046-20261001-v1-current-load | 2026-10-01 | 10 | 0 | 94.7 | 0.326 | 88.3 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |

## load · thread · mobile · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Script ms | Style ms | Layout ms | Task ms | Layout passes | Style recalcs | Long tasks ms | Pre-FCP blocking excess ms | Post-FCP blocking excess ms | Long animation frames ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 130.7 | 45.3 | 43.0 | 306.1 | 5 | 10 | 225.5 | 125.5 | 0.0 | 320.6 |
| En Reve · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 90.6 | 65.0 | 33.6 | 400.0 | 7 | 11 | 309.5 | 259.5 | 0.0 | 431.3 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 82.8 | 44.8 | 37.3 | 363.8 | 4 | 6 | 262.5 | 212.5 | 0.0 | 382.9 |
| En Reve · Current source | main-be47f046-20261001-v1-current-load | 2026-10-01 | 10 | 0 | 87.1 | 58.9 | 32.3 | 377.6 | 7 | 11 | 291.0 | 241.0 | 0.0 | 413.5 |

## load · loading · desktop · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | FCP ms | LCP ms | LCP p75 ms | CLS | CLS p75 | CLS max | TTFB ms | Cards frame opportunity ms | Last webfont response ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 86.0 | 86.0 | 88.0 | 0.000075 | 0.000075 | 0.000075 | 15.3 | 76.6 | — |
| En Reve · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 104.0 | 104.0 | 111.0 | 0.000000 | 0.000000 | 0.000000 | 14.8 | 92.5 | — |
| Web Awesome · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 102.0 | 102.0 | 115.0 | 0.000000 | 0.000000 | 0.000000 | 15.2 | 88.4 | — |
| En Reve · Current source | main-be47f046-20261001-v1-current-load | 2026-10-01 | 10 | 0 | 98.0 | 98.0 | 103.0 | 0.000000 | 0.000000 | 0.000000 | 14.1 | 86.5 | — |

## load · lcp · desktop · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | TTFB portion ms | Resource delay ms | Resource duration ms | Element render delay ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 15.3 | 0.0 | 0.0 | 69.4 |
| En Reve · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 14.8 | 0.0 | 0.0 | 88.3 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 15.2 | 0.0 | 0.0 | 80.7 |
| En Reve · Current source | main-be47f046-20261001-v1-current-load | 2026-10-01 | 10 | 0 | 14.1 | 0.0 | 0.0 | 83.5 |

## load · transfer · desktop · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 58.9 | 0.344 | 57.2 | 1.3 | 0.0 | 0.0 | 3 | 0 | 0 |
| En Reve · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 93.5 | 0.327 | 87.1 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 91.9 | 0.336 | 86.5 | 5.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| En Reve · Current source | main-be47f046-20261001-v1-current-load | 2026-10-01 | 10 | 0 | 94.7 | 0.326 | 88.3 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |

## load · thread · desktop · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Script ms | Style ms | Layout ms | Task ms | Layout passes | Style recalcs | Long tasks ms | Pre-FCP blocking excess ms | Post-FCP blocking excess ms | Long animation frames ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 26.1 | 9.9 | 8.6 | 64.1 | 5 | 10 | 0.0 | 0.0 | 0.0 | 0.0 |
| En Reve · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 18.3 | 13.3 | 6.3 | 81.7 | 7 | 11 | 61.0 | 11.0 | 0.0 | 63.3 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 16.8 | 10.9 | 7.5 | 79.5 | 4 | 6 | 55.0 | 5.0 | 0.0 | 57.0 |
| En Reve · Current source | main-be47f046-20261001-v1-current-load | 2026-10-01 | 10 | 0 | 17.4 | 12.4 | 6.2 | 79.7 | 7 | 11 | 57.0 | 7.0 | 0.0 | 59.3 |

## load · loading · mobile · warm · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | FCP ms | LCP ms | LCP p75 ms | CLS | CLS p75 | CLS max | TTFB ms | Cards frame opportunity ms | Last webfont response ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 220.0 | 220.0 | 220.0 | 0.000000 | 0.000000 | 0.000000 | 0.9 | 225.9 | — |
| En Reve · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 306.0 | 306.0 | 323.0 | 0.000000 | 0.000000 | 0.000000 | 0.9 | 315.8 | — |
| Web Awesome · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 260.0 | 260.0 | 264.0 | 0.000000 | 0.000000 | 0.000000 | 0.8 | 266.8 | — |
| En Reve · Current source | main-be47f046-20261001-v1-current-load | 2026-10-01 | 10 | 0 | 304.0 | 304.0 | 304.0 | 0.000000 | 0.000000 | 0.000000 | 2.7 | 314.2 | — |

## load · lcp · mobile · warm · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | TTFB portion ms | Resource delay ms | Resource duration ms | Element render delay ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 0.9 | 0.0 | 0.0 | 218.0 |
| En Reve · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 0.9 | 0.0 | 0.0 | 305.0 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 0.8 | 0.0 | 0.0 | 257.2 |
| En Reve · Current source | main-be47f046-20261001-v1-current-load | 2026-10-01 | 10 | 0 | 2.7 | 0.0 | 0.0 | 300.9 |

## load · transfer · mobile · warm · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 0.3 | 0.262 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| En Reve · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 0.2 | 0.245 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 0.3 | 0.254 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| En Reve · Current source | main-be47f046-20261001-v1-current-load | 2026-10-01 | 10 | 0 | 0.2 | 0.244 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |

## load · thread · mobile · warm · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Script ms | Style ms | Layout ms | Task ms | Layout passes | Style recalcs | Long tasks ms | Pre-FCP blocking excess ms | Post-FCP blocking excess ms | Long animation frames ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 59.7 | 18.4 | 9.1 | 161.8 | 5 | 10 | 71.5 | 21.5 | 0.0 | 87.3 |
| En Reve · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 57.5 | 44.4 | 14.1 | 249.3 | 7 | 11 | 172.0 | 122.0 | 0.0 | 176.3 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 47.9 | 17.5 | 7.7 | 206.2 | 4 | 6 | 121.5 | 71.5 | 0.0 | 126.2 |
| En Reve · Current source | main-be47f046-20261001-v1-current-load | 2026-10-01 | 10 | 0 | 55.8 | 43.1 | 14.6 | 244.2 | 7 | 11 | 168.5 | 118.5 | 0.0 | 172.9 |

## load · loading · desktop · warm · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | FCP ms | LCP ms | LCP p75 ms | CLS | CLS p75 | CLS max | TTFB ms | Cards frame opportunity ms | Last webfont response ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 28.0 | 28.0 | 31.0 | 0.000075 | 0.000075 | 0.000075 | 0.8 | 25.9 | — |
| En Reve · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 48.0 | 48.0 | 48.0 | 0.000000 | 0.000000 | 0.000000 | 1.0 | 44.1 | — |
| Web Awesome · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 36.0 | 36.0 | 36.0 | 0.000000 | 0.000000 | 0.000000 | 0.8 | 32.3 | — |
| En Reve · Current source | main-be47f046-20261001-v1-current-load | 2026-10-01 | 10 | 0 | 44.0 | 44.0 | 47.0 | 0.000000 | 0.000000 | 0.000000 | 0.8 | 42.8 | — |

## load · lcp · desktop · warm · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | TTFB portion ms | Resource delay ms | Resource duration ms | Element render delay ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 0.8 | 0.0 | 0.0 | 27.3 |
| En Reve · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 1.0 | 0.0 | 0.0 | 46.2 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 0.8 | 0.0 | 0.0 | 35.2 |
| En Reve · Current source | main-be47f046-20261001-v1-current-load | 2026-10-01 | 10 | 0 | 0.8 | 0.0 | 0.0 | 43.3 |

## load · transfer · desktop · warm · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 0.3 | 0.262 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| En Reve · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 0.2 | 0.245 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 0.3 | 0.254 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| En Reve · Current source | main-be47f046-20261001-v1-current-load | 2026-10-01 | 10 | 0 | 0.2 | 0.244 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |

## load · thread · desktop · warm · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Script ms | Style ms | Layout ms | Task ms | Layout passes | Style recalcs | Long tasks ms | Pre-FCP blocking excess ms | Post-FCP blocking excess ms | Long animation frames ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 11.6 | 3.7 | 2.0 | 34.4 | 4 | 9 | 0.0 | 0.0 | 0.0 | 0.0 |
| En Reve · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 11.9 | 9.1 | 3.1 | 53.4 | 6 | 11 | 0.0 | 0.0 | 0.0 | 0.0 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-load | 2026-10-01 | 10 | 0 | 9.4 | 3.5 | 1.8 | 42.2 | 4 | 6 | 0.0 | 0.0 | 0.0 | 0.0 |
| En Reve · Current source | main-be47f046-20261001-v1-current-load | 2026-10-01 | 10 | 0 | 11.6 | 8.7 | 3.1 | 52.6 | 6 | 11 | 0.0 | 0.0 | 0.0 | 0.0 |

## startup · startup · mobile · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Control observed ms | Click from navigation ms | Result from navigation ms | Result p75 ms | Dispatch overhead ms | Discovery probe ms | Click to result ms | Click to frame ms | First input delay ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-startup | 2026-10-01 | 10 | 0 | 459.4 | 514.6 | 522.0 | 527.8 | 54.5 | 0.9 | 8.1 | 39.2 | 5.0 |
| En Reve · Web Components | main-be47f046-20261001-v1-startup | 2026-10-01 | 10 | 0 | 622.5 | 643.2 | 653.7 | 661.2 | 19.5 | 1.0 | 10.4 | 43.0 | 3.3 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-startup | 2026-10-01 | 10 | 0 | 584.8 | 607.2 | 615.0 | 620.6 | 22.7 | 1.9 | 8.1 | 36.3 | 3.3 |
| En Reve · Current source | main-be47f046-20261001-v1-current-startup | 2026-10-01 | 10 | 0 | 621.5 | 640.3 | 650.4 | 656.0 | 18.9 | 0.8 | 10.2 | 41.3 | 3.0 |

## startup · transfer · mobile · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-startup | 2026-10-01 | 10 | 0 | 58.9 | 0.344 | 57.2 | 1.3 | 0.0 | 0.0 | 3 | 0 | 0 |
| En Reve · Web Components | main-be47f046-20261001-v1-startup | 2026-10-01 | 10 | 0 | 93.5 | 0.327 | 87.1 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-startup | 2026-10-01 | 10 | 0 | 91.9 | 0.336 | 86.5 | 5.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| En Reve · Current source | main-be47f046-20261001-v1-current-startup | 2026-10-01 | 10 | 0 | 94.7 | 0.326 | 88.3 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |

## startup · startup · desktop · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Control observed ms | Click from navigation ms | Result from navigation ms | Result p75 ms | Dispatch overhead ms | Discovery probe ms | Click to result ms | Click to frame ms | First input delay ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-startup | 2026-10-01 | 10 | 0 | 60.3 | 72.8 | 73.8 | 76.6 | 12.3 | 0.1 | 1.1 | 33.6 | — |
| En Reve · Web Components | main-be47f046-20261001-v1-startup | 2026-10-01 | 10 | 0 | 88.4 | 93.5 | 95.7 | 98.1 | 5.3 | 0.1 | 2.3 | 32.9 | 0.7 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-startup | 2026-10-01 | 10 | 0 | 78.4 | 85.3 | 88.1 | 91.6 | 7.5 | 0.3 | 1.8 | 27.5 | — |
| En Reve · Current source | main-be47f046-20261001-v1-current-startup | 2026-10-01 | 10 | 0 | 85.7 | 91.2 | 93.2 | 95.4 | 5.5 | 0.1 | 2.1 | 31.8 | — |

## startup · transfer · desktop · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-startup | 2026-10-01 | 10 | 0 | 58.9 | 0.344 | 57.2 | 1.3 | 0.0 | 0.0 | 3 | 0 | 0 |
| En Reve · Web Components | main-be47f046-20261001-v1-startup | 2026-10-01 | 10 | 0 | 93.5 | 0.327 | 87.1 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-startup | 2026-10-01 | 10 | 0 | 91.9 | 0.336 | 86.5 | 5.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| En Reve · Current source | main-be47f046-20261001-v1-current-startup | 2026-10-01 | 10 | 0 | 94.7 | 0.326 | 88.3 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |

## interactions · interactions · mobile · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Scripted INP ms | Scripted INP p75 ms | First input delay ms | Journey CLS | Max scroll rAF gap ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 64.0 | 64.0 | 2.7 | 0.000000 | 16.8 |
| En Reve · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 48.0 | 48.0 | 3.4 | 0.000000 | 16.8 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 48.0 | 48.0 | 2.6 | 0.000000 | 16.8 |
| En Reve · Current source | main-be47f046-20261001-v1-current-interactions | 2026-10-01 | 10 | 0 | 56.0 | 62.0 | 3.2 | 0.000000 | 16.8 |

## interactions · transfer · mobile · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 58.9 | 0.344 | 57.2 | 1.3 | 0.0 | 0.0 | 3 | 0 | 0 |
| En Reve · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 93.5 | 0.327 | 87.1 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 91.9 | 0.336 | 86.5 | 5.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| En Reve · Current source | main-be47f046-20261001-v1-current-interactions | 2026-10-01 | 10 | 0 | 94.7 | 0.326 | 88.3 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |

## interactions · canvas-landscape-first · mobile · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 6.6 | 43.5 |
| En Reve · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 11.5 | 45.8 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 7.5 | 40.8 |
| En Reve · Current source | main-be47f046-20261001-v1-current-interactions | 2026-10-01 | 10 | 0 | 12.6 | 46.2 |

## interactions · canvas-portrait-first · mobile · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 3.9 | 28.5 |
| En Reve · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 8.8 | 29.6 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 5.2 | 29.9 |
| En Reve · Current source | main-be47f046-20261001-v1-current-interactions | 2026-10-01 | 10 | 0 | 9.7 | 29.4 |

## interactions · asset-add-first · mobile · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 4.8 | 29.7 |
| En Reve · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 10.7 | 28.5 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 5.6 | 29.3 |
| En Reve · Current source | main-be47f046-20261001-v1-current-interactions | 2026-10-01 | 10 | 0 | 11.5 | 29.0 |

## interactions · asset-reset-first · mobile · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 4.6 | 28.9 |
| En Reve · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 9.4 | 28.8 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 6.6 | 29.1 |
| En Reve · Current source | main-be47f046-20261001-v1-current-interactions | 2026-10-01 | 10 | 0 | 9.5 | 29.1 |

## interactions · dialog-open-first · mobile · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 3.8 | 34.3 |
| En Reve · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 43.0 | 48.5 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 31.0 | 41.0 |
| En Reve · Current source | main-be47f046-20261001-v1-current-interactions | 2026-10-01 | 10 | 0 | 46.8 | 52.5 |

## interactions · canvas-landscape-warm · mobile · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 3.7 | 30.2 |
| En Reve · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 8.0 | 31.1 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 4.8 | 30.1 |
| En Reve · Current source | main-be47f046-20261001-v1-current-interactions | 2026-10-01 | 10 | 0 | 8.3 | 30.2 |

## interactions · canvas-portrait-warm · mobile · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 3.7 | 29.3 |
| En Reve · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 8.3 | 29.6 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 4.6 | 30.4 |
| En Reve · Current source | main-be47f046-20261001-v1-current-interactions | 2026-10-01 | 10 | 0 | 9.2 | 30.0 |

## interactions · asset-add-warm · mobile · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 4.0 | 28.5 |
| En Reve · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 9.8 | 29.5 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 6.0 | 29.5 |
| En Reve · Current source | main-be47f046-20261001-v1-current-interactions | 2026-10-01 | 10 | 0 | 10.2 | 29.1 |

## interactions · asset-reset-warm · mobile · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 4.5 | 29.3 |
| En Reve · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 8.0 | 29.3 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 6.0 | 29.0 |
| En Reve · Current source | main-be47f046-20261001-v1-current-interactions | 2026-10-01 | 10 | 0 | 8.0 | 29.0 |

## interactions · dialog-open-warm · mobile · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 3.5 | 51.1 |
| En Reve · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 20.5 | 32.1 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 30.2 | 36.8 |
| En Reve · Current source | main-be47f046-20261001-v1-current-interactions | 2026-10-01 | 10 | 0 | 21.3 | 28.5 |

## interactions · review-submit · mobile · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 4.9 | 28.1 |
| En Reve · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 8.1 | 29.8 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 6.0 | 30.0 |
| En Reve · Current source | main-be47f046-20261001-v1-current-interactions | 2026-10-01 | 10 | 0 | 8.5 | 30.0 |

## interactions · commands-first · mobile · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 3.7 | 57.5 |
| En Reve · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 25.3 | 33.6 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 24.8 | 32.4 |
| En Reve · Current source | main-be47f046-20261001-v1-current-interactions | 2026-10-01 | 10 | 0 | 26.5 | 35.6 |

## interactions · interactions · desktop · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Scripted INP ms | Scripted INP p75 ms | First input delay ms | Journey CLS | Max scroll rAF gap ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 40.0 | 40.0 | 0.6 | 0.000075 | 16.8 |
| En Reve · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 40.0 | 46.0 | 0.7 | 0.000000 | 16.8 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 40.0 | 40.0 | 0.6 | 0.000000 | 16.8 |
| En Reve · Current source | main-be47f046-20261001-v1-current-interactions | 2026-10-01 | 10 | 0 | 40.0 | 40.0 | 0.7 | 0.000000 | 16.8 |

## interactions · transfer · desktop · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 58.9 | 0.344 | 57.2 | 1.3 | 0.0 | 0.0 | 3 | 0 | 0 |
| En Reve · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 93.5 | 0.327 | 87.1 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 91.9 | 0.336 | 86.5 | 5.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| En Reve · Current source | main-be47f046-20261001-v1-current-interactions | 2026-10-01 | 10 | 0 | 94.7 | 0.326 | 88.3 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |

## interactions · canvas-landscape-first · desktop · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 1.2 | 37.0 |
| En Reve · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 2.3 | 37.3 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 1.6 | 37.5 |
| En Reve · Current source | main-be47f046-20261001-v1-current-interactions | 2026-10-01 | 10 | 0 | 2.4 | 37.3 |

## interactions · canvas-portrait-first · desktop · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 0.7 | 31.8 |
| En Reve · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 1.7 | 31.9 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 1.0 | 31.6 |
| En Reve · Current source | main-be47f046-20261001-v1-current-interactions | 2026-10-01 | 10 | 0 | 1.7 | 32.0 |

## interactions · asset-add-first · desktop · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 0.8 | 31.8 |
| En Reve · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 2.1 | 31.8 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 1.2 | 31.7 |
| En Reve · Current source | main-be47f046-20261001-v1-current-interactions | 2026-10-01 | 10 | 0 | 2.1 | 31.7 |

## interactions · asset-reset-first · desktop · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 0.9 | 32.0 |
| En Reve · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 1.9 | 31.9 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 1.5 | 32.0 |
| En Reve · Current source | main-be47f046-20261001-v1-current-interactions | 2026-10-01 | 10 | 0 | 1.8 | 31.8 |

## interactions · dialog-open-first · desktop · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 0.8 | 31.9 |
| En Reve · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 8.8 | 31.7 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 6.4 | 32.0 |
| En Reve · Current source | main-be47f046-20261001-v1-current-interactions | 2026-10-01 | 10 | 0 | 9.0 | 31.7 |

## interactions · canvas-landscape-warm · desktop · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 0.7 | 32.2 |
| En Reve · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 1.5 | 32.2 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 1.0 | 31.8 |
| En Reve · Current source | main-be47f046-20261001-v1-current-interactions | 2026-10-01 | 10 | 0 | 1.6 | 31.5 |

## interactions · canvas-portrait-warm · desktop · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 0.7 | 31.9 |
| En Reve · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 1.6 | 32.1 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 0.9 | 32.3 |
| En Reve · Current source | main-be47f046-20261001-v1-current-interactions | 2026-10-01 | 10 | 0 | 1.6 | 32.0 |

## interactions · asset-add-warm · desktop · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 0.9 | 31.7 |
| En Reve · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 1.7 | 32.0 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 1.1 | 32.1 |
| En Reve · Current source | main-be47f046-20261001-v1-current-interactions | 2026-10-01 | 10 | 0 | 1.8 | 31.8 |

## interactions · asset-reset-warm · desktop · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 0.8 | 31.5 |
| En Reve · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 1.7 | 31.9 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 1.1 | 32.2 |
| En Reve · Current source | main-be47f046-20261001-v1-current-interactions | 2026-10-01 | 10 | 0 | 1.6 | 31.5 |

## interactions · dialog-open-warm · desktop · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 0.7 | 32.1 |
| En Reve · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 4.1 | 31.9 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 6.0 | 31.9 |
| En Reve · Current source | main-be47f046-20261001-v1-current-interactions | 2026-10-01 | 10 | 0 | 4.2 | 31.7 |

## interactions · review-submit · desktop · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 0.9 | 31.8 |
| En Reve · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 1.6 | 32.0 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 1.3 | 32.1 |
| En Reve · Current source | main-be47f046-20261001-v1-current-interactions | 2026-10-01 | 10 | 0 | 1.6 | 32.0 |

## interactions · commands-first · desktop · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 0.7 | 32.1 |
| En Reve · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 5.2 | 31.9 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-interactions | 2026-10-01 | 10 | 0 | 4.6 | 31.7 |
| En Reve · Current source | main-be47f046-20261001-v1-current-interactions | 2026-10-01 | 10 | 0 | 5.3 | 31.8 |

## diagnostic · thread · desktop · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Script ms | Style ms | Layout ms | Task ms | Layout passes | Style recalcs | Long tasks ms | Pre-FCP blocking excess ms | Post-FCP blocking excess ms | Long animation frames ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-diagnostic | 2026-10-01 | 1 | 0 | 55.7 | 41.7 | 13.9 | 426.1 | 30 | 274 | 0.0 | 0.0 | 0.0 | 60.0 |
| En Reve · Web Components | main-be47f046-20261001-v1-diagnostic | 2026-10-01 | 1 | 0 | 63.9 | 66.7 | 13.9 | 431.5 | 48 | 208 | 94.0 | 44.0 | 0.0 | 96.4 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-diagnostic | 2026-10-01 | 1 | 0 | 54.3 | 68.5 | 13.0 | 438.5 | 46 | 260 | 78.0 | 28.0 | 0.0 | 80.8 |
| En Reve · Current source | main-be47f046-20261001-v1-current-diagnostic | 2026-10-01 | 1 | 0 | 63.2 | 64.4 | 14.4 | 427.5 | 48 | 209 | 98.0 | 48.0 | 0.0 | 100.2 |

## diagnostic · Connected DOM and styles · desktop · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | connectedNodes | connectedElements | openShadowRoots | styleElements | stylesheetAdoptions | uniqueAdoptedStylesheets |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-diagnostic | 2026-10-01 | 1 | 0 | 2889 | 1284 | 169 | 0 | 221 | 32 |
| En Reve · Web Components | main-be47f046-20261001-v1-diagnostic | 2026-10-01 | 1 | 0 | 4668 | 1580 | 167 | 0 | 598 | 34 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-diagnostic | 2026-10-01 | 1 | 0 | 4212 | 1401 | 197 | 0 | 611 | 36 |
| En Reve · Current source | main-be47f046-20261001-v1-current-diagnostic | 2026-10-01 | 1 | 0 | 4686 | 1598 | 167 | 0 | 598 | 34 |

## lighthouse · lighthouse · mobile · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | FCP ms | LCP ms | LCP p75 ms | LCP max ms | TBT ms | TBT p75 ms | TBT max ms | Speed Index ms | CLS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-lighthouse | 2026-10-01 | 5 | 0 | 609.6 | 609.6 | 681.7 | 8694.8 | 0.0 | 0.0 | 0.0 | 612.0 | 0.000000 |
| En Reve · Web Components | main-be47f046-20261001-v1-lighthouse | 2026-10-01 | 5 | 0 | 795.7 | 795.7 | 796.1 | 8518.5 | 0.0 | 0.0 | 0.0 | 639.0 | 0.000000 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-lighthouse | 2026-10-01 | 5 | 0 | 747.6 | 747.6 | 775.3 | 783.9 | 0.0 | 0.0 | 0.0 | 573.0 | 0.000000 |
| En Reve · Current source | main-be47f046-20261001-v1-current-lighthouse | 2026-10-01 | 5 | 0 | 859.7 | 859.7 | 8708.1 | 8754.7 | 0.0 | 0.0 | 0.0 | 683.0 | 0.000000 |

## overhead · thread · desktop · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Script ms | Style ms | Layout ms | Task ms | Layout passes | Style recalcs | Long tasks ms | Pre-FCP blocking excess ms | Post-FCP blocking excess ms | Long animation frames ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-overhead | 2026-10-01 | 5 | 0 | 28.5 | 10.8 | 9.3 | 69.8 | 5 | 10 | 0.0 | 0.0 | 0.0 | 0.0 |
| En Reve · Web Components | main-be47f046-20261001-v1-overhead | 2026-10-01 | 5 | 0 | 20.5 | 14.3 | 7.6 | 91.3 | 7 | 11 | 69.0 | 19.0 | 0.0 | 71.0 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-overhead | 2026-10-01 | 5 | 0 | 19.4 | 12.1 | 8.2 | 85.3 | 4 | 6 | 60.0 | 10.0 | 0.0 | 67.8 |
| En Reve · Current source | main-be47f046-20261001-v1-current-overhead | 2026-10-01 | 5 | 0 | 20.7 | 14.2 | 7.5 | 89.5 | 8 | 12 | 68.0 | 18.0 | 0.0 | 70.2 |

## overhead · thread · desktop · cold · none · uninstrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Script ms | Style ms | Layout ms | Task ms | Layout passes | Style recalcs | Long tasks ms | Pre-FCP blocking excess ms | Post-FCP blocking excess ms | Long animation frames ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-overhead | 2026-10-01 | 5 | 0 | 28.7 | 11.0 | 9.9 | 66.1 | 5 | 10 | — | — | — | — |
| En Reve · Web Components | main-be47f046-20261001-v1-overhead | 2026-10-01 | 5 | 0 | 18.7 | 13.9 | 7.1 | 83.9 | 7 | 11 | — | — | — | — |
| Web Awesome · Web Components | main-be47f046-20261001-v1-overhead | 2026-10-01 | 5 | 0 | 17.9 | 12.3 | 9.2 | 79.4 | 5 | 7 | — | — | — | — |
| En Reve · Current source | main-be47f046-20261001-v1-current-overhead | 2026-10-01 | 5 | 0 | 17.7 | 13.3 | 7.0 | 78.5 | 7 | 11 | — | — | — | — |

## Connected DOM with and without dates

Separate untimed connected-DOM census; open shadow trees, document nodes and whole date field included. Detached templates, closed roots and native date-picker UI excluded. Three desktop snapshots per implementation; eager En Reve opening/closing in the same session. No cross-library semantic equivalence claimed.

| Implementation | Run ID | Date (UTC) | State | Snapshots n | Full nodes | Full elements | Date nodes | Date elements | Without date nodes | Without date elements |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1 | 2026-10-01 | initial | 3 | 2887 | 1284 | 28 | 12 | 2859 | 1272 |
| En Reve · Web Components | main-be47f046-20261001-v1 | 2026-10-01 | initial | 3 | 4667 | 1580 | 628 | 181 | 4039 | 1399 |
| En Reve · Web Components | main-be47f046-20261001-v1 | 2026-10-01 | opened | 3 | 4667 | 1580 | 628 | 181 | 4039 | 1399 |
| En Reve · Web Components | main-be47f046-20261001-v1 | 2026-10-01 | closed | 3 | 4667 | 1580 | 628 | 181 | 4039 | 1399 |
| Web Awesome · Web Components | main-be47f046-20261001-v1 | 2026-10-01 | initial | 3 | 4210 | 1401 | 28 | 8 | 4182 | 1393 |
| En Reve · Current source | main-be47f046-20261001-v1 | 2026-10-01 | initial | 3 | 4685 | 1598 | 631 | 184 | 4054 | 1414 |
| En Reve · Current source | main-be47f046-20261001-v1 | 2026-10-01 | opened | 3 | 4685 | 1598 | 631 | 184 | 4054 | 1414 |
| En Reve · Current source | main-be47f046-20261001-v1 | 2026-10-01 | closed | 3 | 4685 | 1598 | 631 | 184 | 4054 | 1414 |

## Initial non-date node composition

Connected initial tree with the complete date field excluded. Whitespace is a subset of text nodes. Base parts include SVG and native semantic elements; this is a census, not a conclusion that those elements are removable.

| Implementation | Run ID | Date (UTC) | Snapshots n | Nodes | Elements | Text nodes | Whitespace text nodes | Comments | Open shadow roots | Slots | Base parts |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1 | 2026-10-01 | 3 | 2859 | 1272 | 1418 | 1185 | 0 | 167 | 451 | 0 |
| En Reve · Web Components | main-be47f046-20261001-v1 | 2026-10-01 | 3 | 4039 | 1399 | 1719 | 1440 | 763 | 156 | 391 | 50 |
| Web Awesome · Web Components | main-be47f046-20261001-v1 | 2026-10-01 | 3 | 4182 | 1393 | 1863 | 1639 | 728 | 196 | 493 | 97 |
| En Reve · Current source | main-be47f046-20261001-v1 | 2026-10-01 | 3 | 4054 | 1414 | 1719 | 1440 | 763 | 156 | 396 | 50 |

## Memory and retention

No forced GC. API errors/timeouts are preserved; CDP nodes include retained/detached objects and are not connected-DOM counts. These samples alone do not establish a leak.

| Implementation | Run ID | Date (UTC) | Checkpoint kind | Cycles / openings | API status | API MiB | JS heap MiB | CDP nodes | Listeners |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Web Components | main-be47f046-20261001-v1-memory | 2026-10-01 | Journey | 0 | ok | 5.18 | 4.32 | 6376 | 547 |
| En Reve · Web Components | main-be47f046-20261001-v1-memory | 2026-10-01 | Journey | 10 | ok | 5.65 | 5.21 | 6495 | 547 |
| En Reve · Web Components | main-be47f046-20261001-v1-memory | 2026-10-01 | Journey | 50 | ok | 5.82 | 5.56 | 6535 | 547 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-memory | 2026-10-01 | Journey | 0 | ok | 4.42 | 3.68 | 5136 | 747 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-memory | 2026-10-01 | Journey | 10 | ok | 4.77 | 4.58 | 5223 | 747 |
| Web Awesome · Web Components | main-be47f046-20261001-v1-memory | 2026-10-01 | Journey | 50 | ok | 4.78 | 4.81 | 5263 | 747 |
| Fluent · Web Components | main-be47f046-20261001-v1-memory | 2026-10-01 | Journey | 0 | timeout | — | 4.24 | 4138 | 618 |
| Fluent · Web Components | main-be47f046-20261001-v1-memory | 2026-10-01 | Journey | 10 | ok | 3.84 | 4.38 | 4617 | 692 |
| Fluent · Web Components | main-be47f046-20261001-v1-memory | 2026-10-01 | Journey | 50 | ok | 4.34 | 4.78 | 7497 | 1012 |
| En Reve · Current source | main-be47f046-20261001-v1-current-memory | 2026-10-01 | Journey | 0 | ok | 5.24 | 4.35 | 6397 | 547 |
| En Reve · Current source | main-be47f046-20261001-v1-current-memory | 2026-10-01 | Journey | 10 | ok | 5.67 | 5.27 | 6518 | 547 |
| En Reve · Current source | main-be47f046-20261001-v1-current-memory | 2026-10-01 | Journey | 50 | ok | 5.86 | 5.60 | 6558 | 547 |

## Memory after 0 cycles

Descriptive checkpoint readings; counts and API availability are shown. No forced GC or leak conclusion.

| Implementation | Run ID | Date (UTC) | Checkpoints n | API success n | API unavailable n | API MiB | JS heap MiB | Browser DOM nodes | Event listeners | API status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-memory | 2026-10-01 | 1 | 0 | 1 | — | 4.24 | 4138 | 618 | timeout |
| En Reve · Web Components | main-be47f046-20261001-v1-memory | 2026-10-01 | 1 | 1 | 0 | 5.18 | 4.32 | 6376 | 547 | ok |
| Web Awesome · Web Components | main-be47f046-20261001-v1-memory | 2026-10-01 | 1 | 1 | 0 | 4.42 | 3.68 | 5136 | 747 | ok |
| En Reve · Current source | main-be47f046-20261001-v1-current-memory | 2026-10-01 | 1 | 1 | 0 | 5.24 | 4.35 | 6397 | 547 | ok |

## Memory after 10 cycles

Descriptive checkpoint readings; counts and API availability are shown. No forced GC or leak conclusion.

| Implementation | Run ID | Date (UTC) | Checkpoints n | API success n | API unavailable n | API MiB | JS heap MiB | Browser DOM nodes | Event listeners | API status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-memory | 2026-10-01 | 1 | 1 | 0 | 3.84 | 4.38 | 4617 | 692 | ok |
| En Reve · Web Components | main-be47f046-20261001-v1-memory | 2026-10-01 | 1 | 1 | 0 | 5.65 | 5.21 | 6495 | 547 | ok |
| Web Awesome · Web Components | main-be47f046-20261001-v1-memory | 2026-10-01 | 1 | 1 | 0 | 4.77 | 4.58 | 5223 | 747 | ok |
| En Reve · Current source | main-be47f046-20261001-v1-current-memory | 2026-10-01 | 1 | 1 | 0 | 5.67 | 5.27 | 6518 | 547 | ok |

## Memory after 50 cycles

Descriptive checkpoint readings; counts and API availability are shown. No forced GC or leak conclusion.

| Implementation | Run ID | Date (UTC) | Checkpoints n | API success n | API unavailable n | API MiB | JS heap MiB | Browser DOM nodes | Event listeners | API status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fluent · Web Components | main-be47f046-20261001-v1-memory | 2026-10-01 | 1 | 1 | 0 | 4.34 | 4.78 | 7497 | 1012 | ok |
| En Reve · Web Components | main-be47f046-20261001-v1-memory | 2026-10-01 | 1 | 1 | 0 | 5.82 | 5.56 | 6535 | 547 | ok |
| Web Awesome · Web Components | main-be47f046-20261001-v1-memory | 2026-10-01 | 1 | 1 | 0 | 4.78 | 4.81 | 5263 | 747 | ok |
| En Reve · Current source | main-be47f046-20261001-v1-current-memory | 2026-10-01 | 1 | 1 | 0 | 5.86 | 5.60 | 6558 | 547 | ok |

## Current minus frozen control

Candidate median minus frozen-control median (or deterministic bundle size). Positive means more/slower. Separate sequential cohorts, no paired confidence interval or causal attribution; timing drift and harness differences limit comparisons to earlier dates.

| Implementation | Run ID | Date (UTC) | Scenario | Metric | Unit | Frozen control | Current source | Change | Change percent |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Current source | main-be47f046-20261001-v1 | 2026-10-01 | load / loading / mobile / cold | LCP ms | ms | 672.0 | 648.0 | -24.00 | -3.57 |
| En Reve · Current source | main-be47f046-20261001-v1 | 2026-10-01 | load / loading / mobile / warm | LCP ms | ms | 306.0 | 304.0 | -2.00 | -0.65 |
| En Reve · Current source | main-be47f046-20261001-v1 | 2026-10-01 | startup / startup / mobile / cold | Result from navigation ms | ms | 653.7 | 650.4 | -3.30 | -0.50 |
| En Reve · Current source | main-be47f046-20261001-v1 | 2026-10-01 | interactions / interactions / mobile / cold | Scripted INP ms | ms | 48.0 | 56.0 | 8.00 | 16.67 |
| En Reve · Current source | main-be47f046-20261001-v1 | 2026-10-01 | Production payload sizes | JS raw KiB | KiB | 439.5 | 445.0 | 5.50 | 1.25 |
| En Reve · Current source | main-be47f046-20261001-v1 | 2026-10-01 | Production payload sizes | Initial JS Brotli KiB | KiB | 87.0 | 88.2 | 1.20 | 1.38 |
| En Reve · Current source | main-be47f046-20261001-v1 | 2026-10-01 | diagnostic / Connected DOM and styles / desktop / cold | connectedNodes | nodes | 4668 | 4686 | 18.00 | 0.39 |
| En Reve · Current source | main-be47f046-20261001-v1 | 2026-10-01 | diagnostic / Connected DOM and styles / desktop / cold | connectedElements | elements | 1580 | 1598 | 18.00 | 1.14 |

## Back-forward cache observations

Restoration and post-return behavior are diagnostic observations; automation can affect eligibility. Raw evidence retains browser restore reasons.

| Implementation | Run ID | Date (UTC) | Status | Evidence |
| --- | --- | --- | --- | --- |
| En Reve · Web Components | main-be47f046-20261001-v1-bfcache | 2026-10-01 | ok | {"sameDocument":true,"pageshow":{"at":1704.2999997138977,"persisted":true},"notRestoredReasons":null,"note":"Direct CDP diagnostic; no Playwright lifecycle waits after restore; not a field hit rate","interactiveAfterReturn":true} |
| Web Awesome · Web Components | main-be47f046-20261001-v1-bfcache | 2026-10-01 | ok | {"sameDocument":true,"pageshow":{"at":1669.1999998092651,"persisted":true},"notRestoredReasons":null,"note":"Direct CDP diagnostic; no Playwright lifecycle waits after restore; not a field hit rate","interactiveAfterReturn":true} |
| Fluent · Web Components | main-be47f046-20261001-v1-bfcache | 2026-10-01 | ok | {"sameDocument":true,"pageshow":{"at":1695.2999997138977,"persisted":true},"notRestoredReasons":null,"note":"Direct CDP diagnostic; no Playwright lifecycle waits after restore; not a field hit rate","interactiveAfterReturn":true} |
| Web Awesome · Web Components | main-be47f046-20261001-v1-bfcache | 2026-10-01 | ok | {"sameDocument":true,"pageshow":{"at":1651.7000002861023,"persisted":true},"notRestoredReasons":null,"note":"Direct CDP diagnostic; no Playwright lifecycle waits after restore; not a field hit rate","interactiveAfterReturn":true} |
| En Reve · Web Components | main-be47f046-20261001-v1-bfcache | 2026-10-01 | ok | {"sameDocument":true,"pageshow":{"at":1685.9000000953674,"persisted":true},"notRestoredReasons":null,"note":"Direct CDP diagnostic; no Playwright lifecycle waits after restore; not a field hit rate","interactiveAfterReturn":true} |
| Fluent · Web Components | main-be47f046-20261001-v1-bfcache | 2026-10-01 | ok | {"sameDocument":true,"pageshow":{"at":1660,"persisted":true},"notRestoredReasons":null,"note":"Direct CDP diagnostic; no Playwright lifecycle waits after restore; not a field hit rate","interactiveAfterReturn":true} |
| Web Awesome · Web Components | main-be47f046-20261001-v1-bfcache | 2026-10-01 | ok | {"sameDocument":true,"pageshow":{"at":1656.5,"persisted":true},"notRestoredReasons":null,"note":"Direct CDP diagnostic; no Playwright lifecycle waits after restore; not a field hit rate","interactiveAfterReturn":true} |
| Fluent · Web Components | main-be47f046-20261001-v1-bfcache | 2026-10-01 | ok | {"sameDocument":true,"pageshow":{"at":1602,"persisted":true},"notRestoredReasons":null,"note":"Direct CDP diagnostic; no Playwright lifecycle waits after restore; not a field hit rate","interactiveAfterReturn":true} |
| En Reve · Web Components | main-be47f046-20261001-v1-bfcache | 2026-10-01 | ok | {"sameDocument":true,"pageshow":{"at":1728.9000000953674,"persisted":true},"notRestoredReasons":null,"note":"Direct CDP diagnostic; no Playwright lifecycle waits after restore; not a field hit rate","interactiveAfterReturn":true} |
| En Reve · Web Components | main-be47f046-20261001-v1-bfcache | 2026-10-01 | ok | {"sameDocument":true,"pageshow":{"at":1736.8000001907349,"persisted":true},"notRestoredReasons":null,"note":"Direct CDP diagnostic; no Playwright lifecycle waits after restore; not a field hit rate","interactiveAfterReturn":true} |
| Fluent · Web Components | main-be47f046-20261001-v1-bfcache | 2026-10-01 | ok | {"sameDocument":true,"pageshow":{"at":1652.3000001907349,"persisted":true},"notRestoredReasons":null,"note":"Direct CDP diagnostic; no Playwright lifecycle waits after restore; not a field hit rate","interactiveAfterReturn":true} |
| Web Awesome · Web Components | main-be47f046-20261001-v1-bfcache | 2026-10-01 | ok | {"sameDocument":true,"pageshow":{"at":1666.5999999046326,"persisted":true},"notRestoredReasons":null,"note":"Direct CDP diagnostic; no Playwright lifecycle waits after restore; not a field hit rate","interactiveAfterReturn":true} |
| Fluent · Web Components | main-be47f046-20261001-v1-bfcache | 2026-10-01 | ok | {"sameDocument":true,"pageshow":{"at":1658.6999998092651,"persisted":true},"notRestoredReasons":null,"note":"Direct CDP diagnostic; no Playwright lifecycle waits after restore; not a field hit rate","interactiveAfterReturn":true} |
| En Reve · Web Components | main-be47f046-20261001-v1-bfcache | 2026-10-01 | ok | {"sameDocument":true,"pageshow":{"at":1696.0999999046326,"persisted":true},"notRestoredReasons":null,"note":"Direct CDP diagnostic; no Playwright lifecycle waits after restore; not a field hit rate","interactiveAfterReturn":true} |
| Web Awesome · Web Components | main-be47f046-20261001-v1-bfcache | 2026-10-01 | ok | {"sameDocument":true,"pageshow":{"at":1673.3000001907349,"persisted":true},"notRestoredReasons":null,"note":"Direct CDP diagnostic; no Playwright lifecycle waits after restore; not a field hit rate","interactiveAfterReturn":true} |
| En Reve · Current source | main-be47f046-20261001-v1-current-bfcache | 2026-10-01 | ok | {"sameDocument":true,"pageshow":{"at":1751.5,"persisted":true},"notRestoredReasons":null,"note":"Direct CDP diagnostic; no Playwright lifecycle waits after restore; not a field hit rate","interactiveAfterReturn":true} |
| En Reve · Current source | main-be47f046-20261001-v1-current-bfcache | 2026-10-01 | ok | {"sameDocument":true,"pageshow":{"at":1742.5999999046326,"persisted":true},"notRestoredReasons":null,"note":"Direct CDP diagnostic; no Playwright lifecycle waits after restore; not a field hit rate","interactiveAfterReturn":true} |
| En Reve · Current source | main-be47f046-20261001-v1-current-bfcache | 2026-10-01 | ok | {"sameDocument":true,"pageshow":{"at":1708.5,"persisted":true},"notRestoredReasons":null,"note":"Direct CDP diagnostic; no Playwright lifecycle waits after restore; not a field hit rate","interactiveAfterReturn":true} |
| En Reve · Current source | main-be47f046-20261001-v1-current-bfcache | 2026-10-01 | ok | {"sameDocument":true,"pageshow":{"at":1704.0999999046326,"persisted":true},"notRestoredReasons":null,"note":"Direct CDP diagnostic; no Playwright lifecycle waits after restore; not a field hit rate","interactiveAfterReturn":true} |
| En Reve · Current source | main-be47f046-20261001-v1-current-bfcache | 2026-10-01 | ok | {"sameDocument":true,"pageshow":{"at":1718.4000000953674,"persisted":true},"notRestoredReasons":null,"note":"Direct CDP diagnostic; no Playwright lifecycle waits after restore; not a field hit rate","interactiveAfterReturn":true} |

## Metric availability

A successful sample may still have an unsupported or unavailable browser metric. Denominators are shown for every metric.

| Implementation | Table | Metric | Available n | Successful n |
| --- | --- | --- | --- | --- |
| Fluent · Web Components | load · loading · mobile · cold · none · instrumented | FCP ms | 10 | 10 |
| Fluent · Web Components | load · loading · mobile · cold · none · instrumented | LCP ms | 10 | 10 |
| Fluent · Web Components | load · loading · mobile · cold · none · instrumented | LCP p75 ms | 10 | 10 |
| Fluent · Web Components | load · loading · mobile · cold · none · instrumented | CLS | 10 | 10 |
| Fluent · Web Components | load · loading · mobile · cold · none · instrumented | CLS p75 | 10 | 10 |
| Fluent · Web Components | load · loading · mobile · cold · none · instrumented | CLS max | 10 | 10 |
| Fluent · Web Components | load · loading · mobile · cold · none · instrumented | TTFB ms | 10 | 10 |
| Fluent · Web Components | load · loading · mobile · cold · none · instrumented | Cards frame opportunity ms | 10 | 10 |
| Fluent · Web Components | load · loading · mobile · cold · none · instrumented | Last webfont response ms | 0 | 10 |
| En Reve · Web Components | load · loading · mobile · cold · none · instrumented | FCP ms | 10 | 10 |
| En Reve · Web Components | load · loading · mobile · cold · none · instrumented | LCP ms | 10 | 10 |
| En Reve · Web Components | load · loading · mobile · cold · none · instrumented | LCP p75 ms | 10 | 10 |
| En Reve · Web Components | load · loading · mobile · cold · none · instrumented | CLS | 10 | 10 |
| En Reve · Web Components | load · loading · mobile · cold · none · instrumented | CLS p75 | 10 | 10 |
| En Reve · Web Components | load · loading · mobile · cold · none · instrumented | CLS max | 10 | 10 |
| En Reve · Web Components | load · loading · mobile · cold · none · instrumented | TTFB ms | 10 | 10 |
| En Reve · Web Components | load · loading · mobile · cold · none · instrumented | Cards frame opportunity ms | 10 | 10 |
| En Reve · Web Components | load · loading · mobile · cold · none · instrumented | Last webfont response ms | 0 | 10 |
| Web Awesome · Web Components | load · loading · mobile · cold · none · instrumented | FCP ms | 10 | 10 |
| Web Awesome · Web Components | load · loading · mobile · cold · none · instrumented | LCP ms | 10 | 10 |
| Web Awesome · Web Components | load · loading · mobile · cold · none · instrumented | LCP p75 ms | 10 | 10 |
| Web Awesome · Web Components | load · loading · mobile · cold · none · instrumented | CLS | 10 | 10 |
| Web Awesome · Web Components | load · loading · mobile · cold · none · instrumented | CLS p75 | 10 | 10 |
| Web Awesome · Web Components | load · loading · mobile · cold · none · instrumented | CLS max | 10 | 10 |
| Web Awesome · Web Components | load · loading · mobile · cold · none · instrumented | TTFB ms | 10 | 10 |
| Web Awesome · Web Components | load · loading · mobile · cold · none · instrumented | Cards frame opportunity ms | 10 | 10 |
| Web Awesome · Web Components | load · loading · mobile · cold · none · instrumented | Last webfont response ms | 0 | 10 |
| En Reve · Current source | load · loading · mobile · cold · none · instrumented | FCP ms | 10 | 10 |
| En Reve · Current source | load · loading · mobile · cold · none · instrumented | LCP ms | 10 | 10 |
| En Reve · Current source | load · loading · mobile · cold · none · instrumented | LCP p75 ms | 10 | 10 |
| En Reve · Current source | load · loading · mobile · cold · none · instrumented | CLS | 10 | 10 |
| En Reve · Current source | load · loading · mobile · cold · none · instrumented | CLS p75 | 10 | 10 |
| En Reve · Current source | load · loading · mobile · cold · none · instrumented | CLS max | 10 | 10 |
| En Reve · Current source | load · loading · mobile · cold · none · instrumented | TTFB ms | 10 | 10 |
| En Reve · Current source | load · loading · mobile · cold · none · instrumented | Cards frame opportunity ms | 10 | 10 |
| En Reve · Current source | load · loading · mobile · cold · none · instrumented | Last webfont response ms | 0 | 10 |
| Fluent · Web Components | load · lcp · mobile · cold · none · instrumented | TTFB portion ms | 10 | 10 |
| Fluent · Web Components | load · lcp · mobile · cold · none · instrumented | Resource delay ms | 10 | 10 |
| Fluent · Web Components | load · lcp · mobile · cold · none · instrumented | Resource duration ms | 10 | 10 |
| Fluent · Web Components | load · lcp · mobile · cold · none · instrumented | Element render delay ms | 10 | 10 |
| En Reve · Web Components | load · lcp · mobile · cold · none · instrumented | TTFB portion ms | 10 | 10 |
| En Reve · Web Components | load · lcp · mobile · cold · none · instrumented | Resource delay ms | 10 | 10 |
| En Reve · Web Components | load · lcp · mobile · cold · none · instrumented | Resource duration ms | 10 | 10 |
| En Reve · Web Components | load · lcp · mobile · cold · none · instrumented | Element render delay ms | 10 | 10 |
| Web Awesome · Web Components | load · lcp · mobile · cold · none · instrumented | TTFB portion ms | 10 | 10 |
| Web Awesome · Web Components | load · lcp · mobile · cold · none · instrumented | Resource delay ms | 10 | 10 |
| Web Awesome · Web Components | load · lcp · mobile · cold · none · instrumented | Resource duration ms | 10 | 10 |
| Web Awesome · Web Components | load · lcp · mobile · cold · none · instrumented | Element render delay ms | 10 | 10 |
| En Reve · Current source | load · lcp · mobile · cold · none · instrumented | TTFB portion ms | 10 | 10 |
| En Reve · Current source | load · lcp · mobile · cold · none · instrumented | Resource delay ms | 10 | 10 |
| En Reve · Current source | load · lcp · mobile · cold · none · instrumented | Resource duration ms | 10 | 10 |
| En Reve · Current source | load · lcp · mobile · cold · none · instrumented | Element render delay ms | 10 | 10 |
| Fluent · Web Components | load · transfer · mobile · cold · none · instrumented | Total response KiB | 10 | 10 |
| Fluent · Web Components | load · transfer · mobile · cold · none · instrumented | HTML KiB | 10 | 10 |
| Fluent · Web Components | load · transfer · mobile · cold · none · instrumented | JS KiB | 10 | 10 |
| Fluent · Web Components | load · transfer · mobile · cold · none · instrumented | CSS KiB | 10 | 10 |
| Fluent · Web Components | load · transfer · mobile · cold · none · instrumented | Fonts KiB | 10 | 10 |
| Fluent · Web Components | load · transfer · mobile · cold · none · instrumented | Other KiB | 10 | 10 |
| Fluent · Web Components | load · transfer · mobile · cold · none · instrumented | HTTP responses | 10 | 10 |
| Fluent · Web Components | load · transfer · mobile · cold · none · instrumented | Cache reuse entries | 10 | 10 |
| Fluent · Web Components | load · transfer · mobile · cold · none · instrumented | Incomplete responses | 10 | 10 |
| En Reve · Web Components | load · transfer · mobile · cold · none · instrumented | Total response KiB | 10 | 10 |
| En Reve · Web Components | load · transfer · mobile · cold · none · instrumented | HTML KiB | 10 | 10 |
| En Reve · Web Components | load · transfer · mobile · cold · none · instrumented | JS KiB | 10 | 10 |
| En Reve · Web Components | load · transfer · mobile · cold · none · instrumented | CSS KiB | 10 | 10 |
| En Reve · Web Components | load · transfer · mobile · cold · none · instrumented | Fonts KiB | 10 | 10 |
| En Reve · Web Components | load · transfer · mobile · cold · none · instrumented | Other KiB | 10 | 10 |
| En Reve · Web Components | load · transfer · mobile · cold · none · instrumented | HTTP responses | 10 | 10 |
| En Reve · Web Components | load · transfer · mobile · cold · none · instrumented | Cache reuse entries | 10 | 10 |
| En Reve · Web Components | load · transfer · mobile · cold · none · instrumented | Incomplete responses | 10 | 10 |
| Web Awesome · Web Components | load · transfer · mobile · cold · none · instrumented | Total response KiB | 10 | 10 |
| Web Awesome · Web Components | load · transfer · mobile · cold · none · instrumented | HTML KiB | 10 | 10 |
| Web Awesome · Web Components | load · transfer · mobile · cold · none · instrumented | JS KiB | 10 | 10 |
| Web Awesome · Web Components | load · transfer · mobile · cold · none · instrumented | CSS KiB | 10 | 10 |
| Web Awesome · Web Components | load · transfer · mobile · cold · none · instrumented | Fonts KiB | 10 | 10 |
| Web Awesome · Web Components | load · transfer · mobile · cold · none · instrumented | Other KiB | 10 | 10 |
| Web Awesome · Web Components | load · transfer · mobile · cold · none · instrumented | HTTP responses | 10 | 10 |
| Web Awesome · Web Components | load · transfer · mobile · cold · none · instrumented | Cache reuse entries | 10 | 10 |
| Web Awesome · Web Components | load · transfer · mobile · cold · none · instrumented | Incomplete responses | 10 | 10 |
| En Reve · Current source | load · transfer · mobile · cold · none · instrumented | Total response KiB | 10 | 10 |
| En Reve · Current source | load · transfer · mobile · cold · none · instrumented | HTML KiB | 10 | 10 |
| En Reve · Current source | load · transfer · mobile · cold · none · instrumented | JS KiB | 10 | 10 |
| En Reve · Current source | load · transfer · mobile · cold · none · instrumented | CSS KiB | 10 | 10 |
| En Reve · Current source | load · transfer · mobile · cold · none · instrumented | Fonts KiB | 10 | 10 |
| En Reve · Current source | load · transfer · mobile · cold · none · instrumented | Other KiB | 10 | 10 |
| En Reve · Current source | load · transfer · mobile · cold · none · instrumented | HTTP responses | 10 | 10 |
| En Reve · Current source | load · transfer · mobile · cold · none · instrumented | Cache reuse entries | 10 | 10 |
| En Reve · Current source | load · transfer · mobile · cold · none · instrumented | Incomplete responses | 10 | 10 |
| Fluent · Web Components | load · thread · mobile · cold · none · instrumented | Script ms | 10 | 10 |
| Fluent · Web Components | load · thread · mobile · cold · none · instrumented | Style ms | 10 | 10 |
| Fluent · Web Components | load · thread · mobile · cold · none · instrumented | Layout ms | 10 | 10 |
| Fluent · Web Components | load · thread · mobile · cold · none · instrumented | Task ms | 10 | 10 |
| Fluent · Web Components | load · thread · mobile · cold · none · instrumented | Layout passes | 10 | 10 |
| Fluent · Web Components | load · thread · mobile · cold · none · instrumented | Style recalcs | 10 | 10 |
| Fluent · Web Components | load · thread · mobile · cold · none · instrumented | Long tasks ms | 10 | 10 |
| Fluent · Web Components | load · thread · mobile · cold · none · instrumented | Pre-FCP blocking excess ms | 10 | 10 |
| Fluent · Web Components | load · thread · mobile · cold · none · instrumented | Post-FCP blocking excess ms | 10 | 10 |
| Fluent · Web Components | load · thread · mobile · cold · none · instrumented | Long animation frames ms | 10 | 10 |
| En Reve · Web Components | load · thread · mobile · cold · none · instrumented | Script ms | 10 | 10 |
| En Reve · Web Components | load · thread · mobile · cold · none · instrumented | Style ms | 10 | 10 |
| En Reve · Web Components | load · thread · mobile · cold · none · instrumented | Layout ms | 10 | 10 |
| En Reve · Web Components | load · thread · mobile · cold · none · instrumented | Task ms | 10 | 10 |
| En Reve · Web Components | load · thread · mobile · cold · none · instrumented | Layout passes | 10 | 10 |
| En Reve · Web Components | load · thread · mobile · cold · none · instrumented | Style recalcs | 10 | 10 |
| En Reve · Web Components | load · thread · mobile · cold · none · instrumented | Long tasks ms | 10 | 10 |
| En Reve · Web Components | load · thread · mobile · cold · none · instrumented | Pre-FCP blocking excess ms | 10 | 10 |
| En Reve · Web Components | load · thread · mobile · cold · none · instrumented | Post-FCP blocking excess ms | 10 | 10 |
| En Reve · Web Components | load · thread · mobile · cold · none · instrumented | Long animation frames ms | 10 | 10 |
| Web Awesome · Web Components | load · thread · mobile · cold · none · instrumented | Script ms | 10 | 10 |
| Web Awesome · Web Components | load · thread · mobile · cold · none · instrumented | Style ms | 10 | 10 |
| Web Awesome · Web Components | load · thread · mobile · cold · none · instrumented | Layout ms | 10 | 10 |
| Web Awesome · Web Components | load · thread · mobile · cold · none · instrumented | Task ms | 10 | 10 |
| Web Awesome · Web Components | load · thread · mobile · cold · none · instrumented | Layout passes | 10 | 10 |
| Web Awesome · Web Components | load · thread · mobile · cold · none · instrumented | Style recalcs | 10 | 10 |
| Web Awesome · Web Components | load · thread · mobile · cold · none · instrumented | Long tasks ms | 10 | 10 |
| Web Awesome · Web Components | load · thread · mobile · cold · none · instrumented | Pre-FCP blocking excess ms | 10 | 10 |
| Web Awesome · Web Components | load · thread · mobile · cold · none · instrumented | Post-FCP blocking excess ms | 10 | 10 |
| Web Awesome · Web Components | load · thread · mobile · cold · none · instrumented | Long animation frames ms | 10 | 10 |
| En Reve · Current source | load · thread · mobile · cold · none · instrumented | Script ms | 10 | 10 |
| En Reve · Current source | load · thread · mobile · cold · none · instrumented | Style ms | 10 | 10 |
| En Reve · Current source | load · thread · mobile · cold · none · instrumented | Layout ms | 10 | 10 |
| En Reve · Current source | load · thread · mobile · cold · none · instrumented | Task ms | 10 | 10 |
| En Reve · Current source | load · thread · mobile · cold · none · instrumented | Layout passes | 10 | 10 |
| En Reve · Current source | load · thread · mobile · cold · none · instrumented | Style recalcs | 10 | 10 |
| En Reve · Current source | load · thread · mobile · cold · none · instrumented | Long tasks ms | 10 | 10 |
| En Reve · Current source | load · thread · mobile · cold · none · instrumented | Pre-FCP blocking excess ms | 10 | 10 |
| En Reve · Current source | load · thread · mobile · cold · none · instrumented | Post-FCP blocking excess ms | 10 | 10 |
| En Reve · Current source | load · thread · mobile · cold · none · instrumented | Long animation frames ms | 10 | 10 |
| Fluent · Web Components | load · loading · desktop · cold · none · instrumented | FCP ms | 10 | 10 |
| Fluent · Web Components | load · loading · desktop · cold · none · instrumented | LCP ms | 10 | 10 |
| Fluent · Web Components | load · loading · desktop · cold · none · instrumented | LCP p75 ms | 10 | 10 |
| Fluent · Web Components | load · loading · desktop · cold · none · instrumented | CLS | 10 | 10 |
| Fluent · Web Components | load · loading · desktop · cold · none · instrumented | CLS p75 | 10 | 10 |
| Fluent · Web Components | load · loading · desktop · cold · none · instrumented | CLS max | 10 | 10 |
| Fluent · Web Components | load · loading · desktop · cold · none · instrumented | TTFB ms | 10 | 10 |
| Fluent · Web Components | load · loading · desktop · cold · none · instrumented | Cards frame opportunity ms | 10 | 10 |
| Fluent · Web Components | load · loading · desktop · cold · none · instrumented | Last webfont response ms | 0 | 10 |
| En Reve · Web Components | load · loading · desktop · cold · none · instrumented | FCP ms | 10 | 10 |
| En Reve · Web Components | load · loading · desktop · cold · none · instrumented | LCP ms | 10 | 10 |
| En Reve · Web Components | load · loading · desktop · cold · none · instrumented | LCP p75 ms | 10 | 10 |
| En Reve · Web Components | load · loading · desktop · cold · none · instrumented | CLS | 10 | 10 |
| En Reve · Web Components | load · loading · desktop · cold · none · instrumented | CLS p75 | 10 | 10 |
| En Reve · Web Components | load · loading · desktop · cold · none · instrumented | CLS max | 10 | 10 |
| En Reve · Web Components | load · loading · desktop · cold · none · instrumented | TTFB ms | 10 | 10 |
| En Reve · Web Components | load · loading · desktop · cold · none · instrumented | Cards frame opportunity ms | 10 | 10 |
| En Reve · Web Components | load · loading · desktop · cold · none · instrumented | Last webfont response ms | 0 | 10 |
| Web Awesome · Web Components | load · loading · desktop · cold · none · instrumented | FCP ms | 10 | 10 |
| Web Awesome · Web Components | load · loading · desktop · cold · none · instrumented | LCP ms | 10 | 10 |
| Web Awesome · Web Components | load · loading · desktop · cold · none · instrumented | LCP p75 ms | 10 | 10 |
| Web Awesome · Web Components | load · loading · desktop · cold · none · instrumented | CLS | 10 | 10 |
| Web Awesome · Web Components | load · loading · desktop · cold · none · instrumented | CLS p75 | 10 | 10 |
| Web Awesome · Web Components | load · loading · desktop · cold · none · instrumented | CLS max | 10 | 10 |
| Web Awesome · Web Components | load · loading · desktop · cold · none · instrumented | TTFB ms | 10 | 10 |
| Web Awesome · Web Components | load · loading · desktop · cold · none · instrumented | Cards frame opportunity ms | 10 | 10 |
| Web Awesome · Web Components | load · loading · desktop · cold · none · instrumented | Last webfont response ms | 0 | 10 |
| En Reve · Current source | load · loading · desktop · cold · none · instrumented | FCP ms | 10 | 10 |
| En Reve · Current source | load · loading · desktop · cold · none · instrumented | LCP ms | 10 | 10 |
| En Reve · Current source | load · loading · desktop · cold · none · instrumented | LCP p75 ms | 10 | 10 |
| En Reve · Current source | load · loading · desktop · cold · none · instrumented | CLS | 10 | 10 |
| En Reve · Current source | load · loading · desktop · cold · none · instrumented | CLS p75 | 10 | 10 |
| En Reve · Current source | load · loading · desktop · cold · none · instrumented | CLS max | 10 | 10 |
| En Reve · Current source | load · loading · desktop · cold · none · instrumented | TTFB ms | 10 | 10 |
| En Reve · Current source | load · loading · desktop · cold · none · instrumented | Cards frame opportunity ms | 10 | 10 |
| En Reve · Current source | load · loading · desktop · cold · none · instrumented | Last webfont response ms | 0 | 10 |
| Fluent · Web Components | load · lcp · desktop · cold · none · instrumented | TTFB portion ms | 10 | 10 |
| Fluent · Web Components | load · lcp · desktop · cold · none · instrumented | Resource delay ms | 10 | 10 |
| Fluent · Web Components | load · lcp · desktop · cold · none · instrumented | Resource duration ms | 10 | 10 |
| Fluent · Web Components | load · lcp · desktop · cold · none · instrumented | Element render delay ms | 10 | 10 |
| En Reve · Web Components | load · lcp · desktop · cold · none · instrumented | TTFB portion ms | 10 | 10 |
| En Reve · Web Components | load · lcp · desktop · cold · none · instrumented | Resource delay ms | 10 | 10 |
| En Reve · Web Components | load · lcp · desktop · cold · none · instrumented | Resource duration ms | 10 | 10 |
| En Reve · Web Components | load · lcp · desktop · cold · none · instrumented | Element render delay ms | 10 | 10 |
| Web Awesome · Web Components | load · lcp · desktop · cold · none · instrumented | TTFB portion ms | 10 | 10 |
| Web Awesome · Web Components | load · lcp · desktop · cold · none · instrumented | Resource delay ms | 10 | 10 |
| Web Awesome · Web Components | load · lcp · desktop · cold · none · instrumented | Resource duration ms | 10 | 10 |
| Web Awesome · Web Components | load · lcp · desktop · cold · none · instrumented | Element render delay ms | 10 | 10 |
| En Reve · Current source | load · lcp · desktop · cold · none · instrumented | TTFB portion ms | 10 | 10 |
| En Reve · Current source | load · lcp · desktop · cold · none · instrumented | Resource delay ms | 10 | 10 |
| En Reve · Current source | load · lcp · desktop · cold · none · instrumented | Resource duration ms | 10 | 10 |
| En Reve · Current source | load · lcp · desktop · cold · none · instrumented | Element render delay ms | 10 | 10 |
| Fluent · Web Components | load · transfer · desktop · cold · none · instrumented | Total response KiB | 10 | 10 |
| Fluent · Web Components | load · transfer · desktop · cold · none · instrumented | HTML KiB | 10 | 10 |
| Fluent · Web Components | load · transfer · desktop · cold · none · instrumented | JS KiB | 10 | 10 |
| Fluent · Web Components | load · transfer · desktop · cold · none · instrumented | CSS KiB | 10 | 10 |
| Fluent · Web Components | load · transfer · desktop · cold · none · instrumented | Fonts KiB | 10 | 10 |
| Fluent · Web Components | load · transfer · desktop · cold · none · instrumented | Other KiB | 10 | 10 |
| Fluent · Web Components | load · transfer · desktop · cold · none · instrumented | HTTP responses | 10 | 10 |
| Fluent · Web Components | load · transfer · desktop · cold · none · instrumented | Cache reuse entries | 10 | 10 |
| Fluent · Web Components | load · transfer · desktop · cold · none · instrumented | Incomplete responses | 10 | 10 |
| En Reve · Web Components | load · transfer · desktop · cold · none · instrumented | Total response KiB | 10 | 10 |
| En Reve · Web Components | load · transfer · desktop · cold · none · instrumented | HTML KiB | 10 | 10 |
| En Reve · Web Components | load · transfer · desktop · cold · none · instrumented | JS KiB | 10 | 10 |
| En Reve · Web Components | load · transfer · desktop · cold · none · instrumented | CSS KiB | 10 | 10 |
| En Reve · Web Components | load · transfer · desktop · cold · none · instrumented | Fonts KiB | 10 | 10 |
| En Reve · Web Components | load · transfer · desktop · cold · none · instrumented | Other KiB | 10 | 10 |
| En Reve · Web Components | load · transfer · desktop · cold · none · instrumented | HTTP responses | 10 | 10 |
| En Reve · Web Components | load · transfer · desktop · cold · none · instrumented | Cache reuse entries | 10 | 10 |
| En Reve · Web Components | load · transfer · desktop · cold · none · instrumented | Incomplete responses | 10 | 10 |
| Web Awesome · Web Components | load · transfer · desktop · cold · none · instrumented | Total response KiB | 10 | 10 |
| Web Awesome · Web Components | load · transfer · desktop · cold · none · instrumented | HTML KiB | 10 | 10 |
| Web Awesome · Web Components | load · transfer · desktop · cold · none · instrumented | JS KiB | 10 | 10 |
| Web Awesome · Web Components | load · transfer · desktop · cold · none · instrumented | CSS KiB | 10 | 10 |
| Web Awesome · Web Components | load · transfer · desktop · cold · none · instrumented | Fonts KiB | 10 | 10 |
| Web Awesome · Web Components | load · transfer · desktop · cold · none · instrumented | Other KiB | 10 | 10 |
| Web Awesome · Web Components | load · transfer · desktop · cold · none · instrumented | HTTP responses | 10 | 10 |
| Web Awesome · Web Components | load · transfer · desktop · cold · none · instrumented | Cache reuse entries | 10 | 10 |
| Web Awesome · Web Components | load · transfer · desktop · cold · none · instrumented | Incomplete responses | 10 | 10 |
| En Reve · Current source | load · transfer · desktop · cold · none · instrumented | Total response KiB | 10 | 10 |
| En Reve · Current source | load · transfer · desktop · cold · none · instrumented | HTML KiB | 10 | 10 |
| En Reve · Current source | load · transfer · desktop · cold · none · instrumented | JS KiB | 10 | 10 |
| En Reve · Current source | load · transfer · desktop · cold · none · instrumented | CSS KiB | 10 | 10 |
| En Reve · Current source | load · transfer · desktop · cold · none · instrumented | Fonts KiB | 10 | 10 |
| En Reve · Current source | load · transfer · desktop · cold · none · instrumented | Other KiB | 10 | 10 |
| En Reve · Current source | load · transfer · desktop · cold · none · instrumented | HTTP responses | 10 | 10 |
| En Reve · Current source | load · transfer · desktop · cold · none · instrumented | Cache reuse entries | 10 | 10 |
| En Reve · Current source | load · transfer · desktop · cold · none · instrumented | Incomplete responses | 10 | 10 |
| Fluent · Web Components | load · thread · desktop · cold · none · instrumented | Script ms | 10 | 10 |
| Fluent · Web Components | load · thread · desktop · cold · none · instrumented | Style ms | 10 | 10 |
| Fluent · Web Components | load · thread · desktop · cold · none · instrumented | Layout ms | 10 | 10 |
| Fluent · Web Components | load · thread · desktop · cold · none · instrumented | Task ms | 10 | 10 |
| Fluent · Web Components | load · thread · desktop · cold · none · instrumented | Layout passes | 10 | 10 |
| Fluent · Web Components | load · thread · desktop · cold · none · instrumented | Style recalcs | 10 | 10 |
| Fluent · Web Components | load · thread · desktop · cold · none · instrumented | Long tasks ms | 10 | 10 |
| Fluent · Web Components | load · thread · desktop · cold · none · instrumented | Pre-FCP blocking excess ms | 10 | 10 |
| Fluent · Web Components | load · thread · desktop · cold · none · instrumented | Post-FCP blocking excess ms | 10 | 10 |
| Fluent · Web Components | load · thread · desktop · cold · none · instrumented | Long animation frames ms | 10 | 10 |
| En Reve · Web Components | load · thread · desktop · cold · none · instrumented | Script ms | 10 | 10 |
| En Reve · Web Components | load · thread · desktop · cold · none · instrumented | Style ms | 10 | 10 |
| En Reve · Web Components | load · thread · desktop · cold · none · instrumented | Layout ms | 10 | 10 |
| En Reve · Web Components | load · thread · desktop · cold · none · instrumented | Task ms | 10 | 10 |
| En Reve · Web Components | load · thread · desktop · cold · none · instrumented | Layout passes | 10 | 10 |
| En Reve · Web Components | load · thread · desktop · cold · none · instrumented | Style recalcs | 10 | 10 |
| En Reve · Web Components | load · thread · desktop · cold · none · instrumented | Long tasks ms | 10 | 10 |
| En Reve · Web Components | load · thread · desktop · cold · none · instrumented | Pre-FCP blocking excess ms | 10 | 10 |
| En Reve · Web Components | load · thread · desktop · cold · none · instrumented | Post-FCP blocking excess ms | 10 | 10 |
| En Reve · Web Components | load · thread · desktop · cold · none · instrumented | Long animation frames ms | 10 | 10 |
| Web Awesome · Web Components | load · thread · desktop · cold · none · instrumented | Script ms | 10 | 10 |
| Web Awesome · Web Components | load · thread · desktop · cold · none · instrumented | Style ms | 10 | 10 |
| Web Awesome · Web Components | load · thread · desktop · cold · none · instrumented | Layout ms | 10 | 10 |
| Web Awesome · Web Components | load · thread · desktop · cold · none · instrumented | Task ms | 10 | 10 |
| Web Awesome · Web Components | load · thread · desktop · cold · none · instrumented | Layout passes | 10 | 10 |
| Web Awesome · Web Components | load · thread · desktop · cold · none · instrumented | Style recalcs | 10 | 10 |
| Web Awesome · Web Components | load · thread · desktop · cold · none · instrumented | Long tasks ms | 10 | 10 |
| Web Awesome · Web Components | load · thread · desktop · cold · none · instrumented | Pre-FCP blocking excess ms | 10 | 10 |
| Web Awesome · Web Components | load · thread · desktop · cold · none · instrumented | Post-FCP blocking excess ms | 10 | 10 |
| Web Awesome · Web Components | load · thread · desktop · cold · none · instrumented | Long animation frames ms | 10 | 10 |
| En Reve · Current source | load · thread · desktop · cold · none · instrumented | Script ms | 10 | 10 |
| En Reve · Current source | load · thread · desktop · cold · none · instrumented | Style ms | 10 | 10 |
| En Reve · Current source | load · thread · desktop · cold · none · instrumented | Layout ms | 10 | 10 |
| En Reve · Current source | load · thread · desktop · cold · none · instrumented | Task ms | 10 | 10 |
| En Reve · Current source | load · thread · desktop · cold · none · instrumented | Layout passes | 10 | 10 |
| En Reve · Current source | load · thread · desktop · cold · none · instrumented | Style recalcs | 10 | 10 |
| En Reve · Current source | load · thread · desktop · cold · none · instrumented | Long tasks ms | 10 | 10 |
| En Reve · Current source | load · thread · desktop · cold · none · instrumented | Pre-FCP blocking excess ms | 10 | 10 |
| En Reve · Current source | load · thread · desktop · cold · none · instrumented | Post-FCP blocking excess ms | 10 | 10 |
| En Reve · Current source | load · thread · desktop · cold · none · instrumented | Long animation frames ms | 10 | 10 |
| Fluent · Web Components | load · loading · mobile · warm · none · instrumented | FCP ms | 10 | 10 |
| Fluent · Web Components | load · loading · mobile · warm · none · instrumented | LCP ms | 10 | 10 |
| Fluent · Web Components | load · loading · mobile · warm · none · instrumented | LCP p75 ms | 10 | 10 |
| Fluent · Web Components | load · loading · mobile · warm · none · instrumented | CLS | 10 | 10 |
| Fluent · Web Components | load · loading · mobile · warm · none · instrumented | CLS p75 | 10 | 10 |
| Fluent · Web Components | load · loading · mobile · warm · none · instrumented | CLS max | 10 | 10 |
| Fluent · Web Components | load · loading · mobile · warm · none · instrumented | TTFB ms | 10 | 10 |
| Fluent · Web Components | load · loading · mobile · warm · none · instrumented | Cards frame opportunity ms | 10 | 10 |
| Fluent · Web Components | load · loading · mobile · warm · none · instrumented | Last webfont response ms | 0 | 10 |
| En Reve · Web Components | load · loading · mobile · warm · none · instrumented | FCP ms | 10 | 10 |
| En Reve · Web Components | load · loading · mobile · warm · none · instrumented | LCP ms | 10 | 10 |
| En Reve · Web Components | load · loading · mobile · warm · none · instrumented | LCP p75 ms | 10 | 10 |
| En Reve · Web Components | load · loading · mobile · warm · none · instrumented | CLS | 10 | 10 |
| En Reve · Web Components | load · loading · mobile · warm · none · instrumented | CLS p75 | 10 | 10 |
| En Reve · Web Components | load · loading · mobile · warm · none · instrumented | CLS max | 10 | 10 |
| En Reve · Web Components | load · loading · mobile · warm · none · instrumented | TTFB ms | 10 | 10 |
| En Reve · Web Components | load · loading · mobile · warm · none · instrumented | Cards frame opportunity ms | 10 | 10 |
| En Reve · Web Components | load · loading · mobile · warm · none · instrumented | Last webfont response ms | 0 | 10 |
| Web Awesome · Web Components | load · loading · mobile · warm · none · instrumented | FCP ms | 10 | 10 |
| Web Awesome · Web Components | load · loading · mobile · warm · none · instrumented | LCP ms | 10 | 10 |
| Web Awesome · Web Components | load · loading · mobile · warm · none · instrumented | LCP p75 ms | 10 | 10 |
| Web Awesome · Web Components | load · loading · mobile · warm · none · instrumented | CLS | 10 | 10 |
| Web Awesome · Web Components | load · loading · mobile · warm · none · instrumented | CLS p75 | 10 | 10 |
| Web Awesome · Web Components | load · loading · mobile · warm · none · instrumented | CLS max | 10 | 10 |
| Web Awesome · Web Components | load · loading · mobile · warm · none · instrumented | TTFB ms | 10 | 10 |
| Web Awesome · Web Components | load · loading · mobile · warm · none · instrumented | Cards frame opportunity ms | 10 | 10 |
| Web Awesome · Web Components | load · loading · mobile · warm · none · instrumented | Last webfont response ms | 0 | 10 |
| En Reve · Current source | load · loading · mobile · warm · none · instrumented | FCP ms | 10 | 10 |
| En Reve · Current source | load · loading · mobile · warm · none · instrumented | LCP ms | 10 | 10 |
| En Reve · Current source | load · loading · mobile · warm · none · instrumented | LCP p75 ms | 10 | 10 |
| En Reve · Current source | load · loading · mobile · warm · none · instrumented | CLS | 10 | 10 |
| En Reve · Current source | load · loading · mobile · warm · none · instrumented | CLS p75 | 10 | 10 |
| En Reve · Current source | load · loading · mobile · warm · none · instrumented | CLS max | 10 | 10 |
| En Reve · Current source | load · loading · mobile · warm · none · instrumented | TTFB ms | 10 | 10 |
| En Reve · Current source | load · loading · mobile · warm · none · instrumented | Cards frame opportunity ms | 10 | 10 |
| En Reve · Current source | load · loading · mobile · warm · none · instrumented | Last webfont response ms | 0 | 10 |
| Fluent · Web Components | load · lcp · mobile · warm · none · instrumented | TTFB portion ms | 10 | 10 |
| Fluent · Web Components | load · lcp · mobile · warm · none · instrumented | Resource delay ms | 10 | 10 |
| Fluent · Web Components | load · lcp · mobile · warm · none · instrumented | Resource duration ms | 10 | 10 |
| Fluent · Web Components | load · lcp · mobile · warm · none · instrumented | Element render delay ms | 10 | 10 |
| En Reve · Web Components | load · lcp · mobile · warm · none · instrumented | TTFB portion ms | 10 | 10 |
| En Reve · Web Components | load · lcp · mobile · warm · none · instrumented | Resource delay ms | 10 | 10 |
| En Reve · Web Components | load · lcp · mobile · warm · none · instrumented | Resource duration ms | 10 | 10 |
| En Reve · Web Components | load · lcp · mobile · warm · none · instrumented | Element render delay ms | 10 | 10 |
| Web Awesome · Web Components | load · lcp · mobile · warm · none · instrumented | TTFB portion ms | 10 | 10 |
| Web Awesome · Web Components | load · lcp · mobile · warm · none · instrumented | Resource delay ms | 10 | 10 |
| Web Awesome · Web Components | load · lcp · mobile · warm · none · instrumented | Resource duration ms | 10 | 10 |
| Web Awesome · Web Components | load · lcp · mobile · warm · none · instrumented | Element render delay ms | 10 | 10 |
| En Reve · Current source | load · lcp · mobile · warm · none · instrumented | TTFB portion ms | 10 | 10 |
| En Reve · Current source | load · lcp · mobile · warm · none · instrumented | Resource delay ms | 10 | 10 |
| En Reve · Current source | load · lcp · mobile · warm · none · instrumented | Resource duration ms | 10 | 10 |
| En Reve · Current source | load · lcp · mobile · warm · none · instrumented | Element render delay ms | 10 | 10 |
| Fluent · Web Components | load · transfer · mobile · warm · none · instrumented | Total response KiB | 10 | 10 |
| Fluent · Web Components | load · transfer · mobile · warm · none · instrumented | HTML KiB | 10 | 10 |
| Fluent · Web Components | load · transfer · mobile · warm · none · instrumented | JS KiB | 10 | 10 |
| Fluent · Web Components | load · transfer · mobile · warm · none · instrumented | CSS KiB | 10 | 10 |
| Fluent · Web Components | load · transfer · mobile · warm · none · instrumented | Fonts KiB | 10 | 10 |
| Fluent · Web Components | load · transfer · mobile · warm · none · instrumented | Other KiB | 10 | 10 |
| Fluent · Web Components | load · transfer · mobile · warm · none · instrumented | HTTP responses | 10 | 10 |
| Fluent · Web Components | load · transfer · mobile · warm · none · instrumented | Cache reuse entries | 10 | 10 |
| Fluent · Web Components | load · transfer · mobile · warm · none · instrumented | Incomplete responses | 10 | 10 |
| En Reve · Web Components | load · transfer · mobile · warm · none · instrumented | Total response KiB | 10 | 10 |
| En Reve · Web Components | load · transfer · mobile · warm · none · instrumented | HTML KiB | 10 | 10 |
| En Reve · Web Components | load · transfer · mobile · warm · none · instrumented | JS KiB | 10 | 10 |
| En Reve · Web Components | load · transfer · mobile · warm · none · instrumented | CSS KiB | 10 | 10 |
| En Reve · Web Components | load · transfer · mobile · warm · none · instrumented | Fonts KiB | 10 | 10 |
| En Reve · Web Components | load · transfer · mobile · warm · none · instrumented | Other KiB | 10 | 10 |
| En Reve · Web Components | load · transfer · mobile · warm · none · instrumented | HTTP responses | 10 | 10 |
| En Reve · Web Components | load · transfer · mobile · warm · none · instrumented | Cache reuse entries | 10 | 10 |
| En Reve · Web Components | load · transfer · mobile · warm · none · instrumented | Incomplete responses | 10 | 10 |
| Web Awesome · Web Components | load · transfer · mobile · warm · none · instrumented | Total response KiB | 10 | 10 |
| Web Awesome · Web Components | load · transfer · mobile · warm · none · instrumented | HTML KiB | 10 | 10 |
| Web Awesome · Web Components | load · transfer · mobile · warm · none · instrumented | JS KiB | 10 | 10 |
| Web Awesome · Web Components | load · transfer · mobile · warm · none · instrumented | CSS KiB | 10 | 10 |
| Web Awesome · Web Components | load · transfer · mobile · warm · none · instrumented | Fonts KiB | 10 | 10 |
| Web Awesome · Web Components | load · transfer · mobile · warm · none · instrumented | Other KiB | 10 | 10 |
| Web Awesome · Web Components | load · transfer · mobile · warm · none · instrumented | HTTP responses | 10 | 10 |
| Web Awesome · Web Components | load · transfer · mobile · warm · none · instrumented | Cache reuse entries | 10 | 10 |
| Web Awesome · Web Components | load · transfer · mobile · warm · none · instrumented | Incomplete responses | 10 | 10 |
| En Reve · Current source | load · transfer · mobile · warm · none · instrumented | Total response KiB | 10 | 10 |
| En Reve · Current source | load · transfer · mobile · warm · none · instrumented | HTML KiB | 10 | 10 |
| En Reve · Current source | load · transfer · mobile · warm · none · instrumented | JS KiB | 10 | 10 |
| En Reve · Current source | load · transfer · mobile · warm · none · instrumented | CSS KiB | 10 | 10 |
| En Reve · Current source | load · transfer · mobile · warm · none · instrumented | Fonts KiB | 10 | 10 |
| En Reve · Current source | load · transfer · mobile · warm · none · instrumented | Other KiB | 10 | 10 |
| En Reve · Current source | load · transfer · mobile · warm · none · instrumented | HTTP responses | 10 | 10 |
| En Reve · Current source | load · transfer · mobile · warm · none · instrumented | Cache reuse entries | 10 | 10 |
| En Reve · Current source | load · transfer · mobile · warm · none · instrumented | Incomplete responses | 10 | 10 |
| Fluent · Web Components | load · thread · mobile · warm · none · instrumented | Script ms | 10 | 10 |
| Fluent · Web Components | load · thread · mobile · warm · none · instrumented | Style ms | 10 | 10 |
| Fluent · Web Components | load · thread · mobile · warm · none · instrumented | Layout ms | 10 | 10 |
| Fluent · Web Components | load · thread · mobile · warm · none · instrumented | Task ms | 10 | 10 |
| Fluent · Web Components | load · thread · mobile · warm · none · instrumented | Layout passes | 10 | 10 |
| Fluent · Web Components | load · thread · mobile · warm · none · instrumented | Style recalcs | 10 | 10 |
| Fluent · Web Components | load · thread · mobile · warm · none · instrumented | Long tasks ms | 10 | 10 |
| Fluent · Web Components | load · thread · mobile · warm · none · instrumented | Pre-FCP blocking excess ms | 10 | 10 |
| Fluent · Web Components | load · thread · mobile · warm · none · instrumented | Post-FCP blocking excess ms | 10 | 10 |
| Fluent · Web Components | load · thread · mobile · warm · none · instrumented | Long animation frames ms | 10 | 10 |
| En Reve · Web Components | load · thread · mobile · warm · none · instrumented | Script ms | 10 | 10 |
| En Reve · Web Components | load · thread · mobile · warm · none · instrumented | Style ms | 10 | 10 |
| En Reve · Web Components | load · thread · mobile · warm · none · instrumented | Layout ms | 10 | 10 |
| En Reve · Web Components | load · thread · mobile · warm · none · instrumented | Task ms | 10 | 10 |
| En Reve · Web Components | load · thread · mobile · warm · none · instrumented | Layout passes | 10 | 10 |
| En Reve · Web Components | load · thread · mobile · warm · none · instrumented | Style recalcs | 10 | 10 |
| En Reve · Web Components | load · thread · mobile · warm · none · instrumented | Long tasks ms | 10 | 10 |
| En Reve · Web Components | load · thread · mobile · warm · none · instrumented | Pre-FCP blocking excess ms | 10 | 10 |
| En Reve · Web Components | load · thread · mobile · warm · none · instrumented | Post-FCP blocking excess ms | 10 | 10 |
| En Reve · Web Components | load · thread · mobile · warm · none · instrumented | Long animation frames ms | 10 | 10 |
| Web Awesome · Web Components | load · thread · mobile · warm · none · instrumented | Script ms | 10 | 10 |
| Web Awesome · Web Components | load · thread · mobile · warm · none · instrumented | Style ms | 10 | 10 |
| Web Awesome · Web Components | load · thread · mobile · warm · none · instrumented | Layout ms | 10 | 10 |
| Web Awesome · Web Components | load · thread · mobile · warm · none · instrumented | Task ms | 10 | 10 |
| Web Awesome · Web Components | load · thread · mobile · warm · none · instrumented | Layout passes | 10 | 10 |
| Web Awesome · Web Components | load · thread · mobile · warm · none · instrumented | Style recalcs | 10 | 10 |
| Web Awesome · Web Components | load · thread · mobile · warm · none · instrumented | Long tasks ms | 10 | 10 |
| Web Awesome · Web Components | load · thread · mobile · warm · none · instrumented | Pre-FCP blocking excess ms | 10 | 10 |
| Web Awesome · Web Components | load · thread · mobile · warm · none · instrumented | Post-FCP blocking excess ms | 10 | 10 |
| Web Awesome · Web Components | load · thread · mobile · warm · none · instrumented | Long animation frames ms | 10 | 10 |
| En Reve · Current source | load · thread · mobile · warm · none · instrumented | Script ms | 10 | 10 |
| En Reve · Current source | load · thread · mobile · warm · none · instrumented | Style ms | 10 | 10 |
| En Reve · Current source | load · thread · mobile · warm · none · instrumented | Layout ms | 10 | 10 |
| En Reve · Current source | load · thread · mobile · warm · none · instrumented | Task ms | 10 | 10 |
| En Reve · Current source | load · thread · mobile · warm · none · instrumented | Layout passes | 10 | 10 |
| En Reve · Current source | load · thread · mobile · warm · none · instrumented | Style recalcs | 10 | 10 |
| En Reve · Current source | load · thread · mobile · warm · none · instrumented | Long tasks ms | 10 | 10 |
| En Reve · Current source | load · thread · mobile · warm · none · instrumented | Pre-FCP blocking excess ms | 10 | 10 |
| En Reve · Current source | load · thread · mobile · warm · none · instrumented | Post-FCP blocking excess ms | 10 | 10 |
| En Reve · Current source | load · thread · mobile · warm · none · instrumented | Long animation frames ms | 10 | 10 |
| Fluent · Web Components | load · loading · desktop · warm · none · instrumented | FCP ms | 10 | 10 |
| Fluent · Web Components | load · loading · desktop · warm · none · instrumented | LCP ms | 10 | 10 |
| Fluent · Web Components | load · loading · desktop · warm · none · instrumented | LCP p75 ms | 10 | 10 |
| Fluent · Web Components | load · loading · desktop · warm · none · instrumented | CLS | 10 | 10 |
| Fluent · Web Components | load · loading · desktop · warm · none · instrumented | CLS p75 | 10 | 10 |
| Fluent · Web Components | load · loading · desktop · warm · none · instrumented | CLS max | 10 | 10 |
| Fluent · Web Components | load · loading · desktop · warm · none · instrumented | TTFB ms | 10 | 10 |
| Fluent · Web Components | load · loading · desktop · warm · none · instrumented | Cards frame opportunity ms | 10 | 10 |
| Fluent · Web Components | load · loading · desktop · warm · none · instrumented | Last webfont response ms | 0 | 10 |
| En Reve · Web Components | load · loading · desktop · warm · none · instrumented | FCP ms | 10 | 10 |
| En Reve · Web Components | load · loading · desktop · warm · none · instrumented | LCP ms | 10 | 10 |
| En Reve · Web Components | load · loading · desktop · warm · none · instrumented | LCP p75 ms | 10 | 10 |
| En Reve · Web Components | load · loading · desktop · warm · none · instrumented | CLS | 10 | 10 |
| En Reve · Web Components | load · loading · desktop · warm · none · instrumented | CLS p75 | 10 | 10 |
| En Reve · Web Components | load · loading · desktop · warm · none · instrumented | CLS max | 10 | 10 |
| En Reve · Web Components | load · loading · desktop · warm · none · instrumented | TTFB ms | 10 | 10 |
| En Reve · Web Components | load · loading · desktop · warm · none · instrumented | Cards frame opportunity ms | 10 | 10 |
| En Reve · Web Components | load · loading · desktop · warm · none · instrumented | Last webfont response ms | 0 | 10 |
| Web Awesome · Web Components | load · loading · desktop · warm · none · instrumented | FCP ms | 10 | 10 |
| Web Awesome · Web Components | load · loading · desktop · warm · none · instrumented | LCP ms | 10 | 10 |
| Web Awesome · Web Components | load · loading · desktop · warm · none · instrumented | LCP p75 ms | 10 | 10 |
| Web Awesome · Web Components | load · loading · desktop · warm · none · instrumented | CLS | 10 | 10 |
| Web Awesome · Web Components | load · loading · desktop · warm · none · instrumented | CLS p75 | 10 | 10 |
| Web Awesome · Web Components | load · loading · desktop · warm · none · instrumented | CLS max | 10 | 10 |
| Web Awesome · Web Components | load · loading · desktop · warm · none · instrumented | TTFB ms | 10 | 10 |
| Web Awesome · Web Components | load · loading · desktop · warm · none · instrumented | Cards frame opportunity ms | 10 | 10 |
| Web Awesome · Web Components | load · loading · desktop · warm · none · instrumented | Last webfont response ms | 0 | 10 |
| En Reve · Current source | load · loading · desktop · warm · none · instrumented | FCP ms | 10 | 10 |
| En Reve · Current source | load · loading · desktop · warm · none · instrumented | LCP ms | 10 | 10 |
| En Reve · Current source | load · loading · desktop · warm · none · instrumented | LCP p75 ms | 10 | 10 |
| En Reve · Current source | load · loading · desktop · warm · none · instrumented | CLS | 10 | 10 |
| En Reve · Current source | load · loading · desktop · warm · none · instrumented | CLS p75 | 10 | 10 |
| En Reve · Current source | load · loading · desktop · warm · none · instrumented | CLS max | 10 | 10 |
| En Reve · Current source | load · loading · desktop · warm · none · instrumented | TTFB ms | 10 | 10 |
| En Reve · Current source | load · loading · desktop · warm · none · instrumented | Cards frame opportunity ms | 10 | 10 |
| En Reve · Current source | load · loading · desktop · warm · none · instrumented | Last webfont response ms | 0 | 10 |
| Fluent · Web Components | load · lcp · desktop · warm · none · instrumented | TTFB portion ms | 10 | 10 |
| Fluent · Web Components | load · lcp · desktop · warm · none · instrumented | Resource delay ms | 10 | 10 |
| Fluent · Web Components | load · lcp · desktop · warm · none · instrumented | Resource duration ms | 10 | 10 |
| Fluent · Web Components | load · lcp · desktop · warm · none · instrumented | Element render delay ms | 10 | 10 |
| En Reve · Web Components | load · lcp · desktop · warm · none · instrumented | TTFB portion ms | 10 | 10 |
| En Reve · Web Components | load · lcp · desktop · warm · none · instrumented | Resource delay ms | 10 | 10 |
| En Reve · Web Components | load · lcp · desktop · warm · none · instrumented | Resource duration ms | 10 | 10 |
| En Reve · Web Components | load · lcp · desktop · warm · none · instrumented | Element render delay ms | 10 | 10 |
| Web Awesome · Web Components | load · lcp · desktop · warm · none · instrumented | TTFB portion ms | 10 | 10 |
| Web Awesome · Web Components | load · lcp · desktop · warm · none · instrumented | Resource delay ms | 10 | 10 |
| Web Awesome · Web Components | load · lcp · desktop · warm · none · instrumented | Resource duration ms | 10 | 10 |
| Web Awesome · Web Components | load · lcp · desktop · warm · none · instrumented | Element render delay ms | 10 | 10 |
| En Reve · Current source | load · lcp · desktop · warm · none · instrumented | TTFB portion ms | 10 | 10 |
| En Reve · Current source | load · lcp · desktop · warm · none · instrumented | Resource delay ms | 10 | 10 |
| En Reve · Current source | load · lcp · desktop · warm · none · instrumented | Resource duration ms | 10 | 10 |
| En Reve · Current source | load · lcp · desktop · warm · none · instrumented | Element render delay ms | 10 | 10 |
| Fluent · Web Components | load · transfer · desktop · warm · none · instrumented | Total response KiB | 10 | 10 |
| Fluent · Web Components | load · transfer · desktop · warm · none · instrumented | HTML KiB | 10 | 10 |
| Fluent · Web Components | load · transfer · desktop · warm · none · instrumented | JS KiB | 10 | 10 |
| Fluent · Web Components | load · transfer · desktop · warm · none · instrumented | CSS KiB | 10 | 10 |
| Fluent · Web Components | load · transfer · desktop · warm · none · instrumented | Fonts KiB | 10 | 10 |
| Fluent · Web Components | load · transfer · desktop · warm · none · instrumented | Other KiB | 10 | 10 |
| Fluent · Web Components | load · transfer · desktop · warm · none · instrumented | HTTP responses | 10 | 10 |
| Fluent · Web Components | load · transfer · desktop · warm · none · instrumented | Cache reuse entries | 10 | 10 |
| Fluent · Web Components | load · transfer · desktop · warm · none · instrumented | Incomplete responses | 10 | 10 |
| En Reve · Web Components | load · transfer · desktop · warm · none · instrumented | Total response KiB | 10 | 10 |
| En Reve · Web Components | load · transfer · desktop · warm · none · instrumented | HTML KiB | 10 | 10 |
| En Reve · Web Components | load · transfer · desktop · warm · none · instrumented | JS KiB | 10 | 10 |
| En Reve · Web Components | load · transfer · desktop · warm · none · instrumented | CSS KiB | 10 | 10 |
| En Reve · Web Components | load · transfer · desktop · warm · none · instrumented | Fonts KiB | 10 | 10 |
| En Reve · Web Components | load · transfer · desktop · warm · none · instrumented | Other KiB | 10 | 10 |
| En Reve · Web Components | load · transfer · desktop · warm · none · instrumented | HTTP responses | 10 | 10 |
| En Reve · Web Components | load · transfer · desktop · warm · none · instrumented | Cache reuse entries | 10 | 10 |
| En Reve · Web Components | load · transfer · desktop · warm · none · instrumented | Incomplete responses | 10 | 10 |
| Web Awesome · Web Components | load · transfer · desktop · warm · none · instrumented | Total response KiB | 10 | 10 |
| Web Awesome · Web Components | load · transfer · desktop · warm · none · instrumented | HTML KiB | 10 | 10 |
| Web Awesome · Web Components | load · transfer · desktop · warm · none · instrumented | JS KiB | 10 | 10 |
| Web Awesome · Web Components | load · transfer · desktop · warm · none · instrumented | CSS KiB | 10 | 10 |
| Web Awesome · Web Components | load · transfer · desktop · warm · none · instrumented | Fonts KiB | 10 | 10 |
| Web Awesome · Web Components | load · transfer · desktop · warm · none · instrumented | Other KiB | 10 | 10 |
| Web Awesome · Web Components | load · transfer · desktop · warm · none · instrumented | HTTP responses | 10 | 10 |
| Web Awesome · Web Components | load · transfer · desktop · warm · none · instrumented | Cache reuse entries | 10 | 10 |
| Web Awesome · Web Components | load · transfer · desktop · warm · none · instrumented | Incomplete responses | 10 | 10 |
| En Reve · Current source | load · transfer · desktop · warm · none · instrumented | Total response KiB | 10 | 10 |
| En Reve · Current source | load · transfer · desktop · warm · none · instrumented | HTML KiB | 10 | 10 |
| En Reve · Current source | load · transfer · desktop · warm · none · instrumented | JS KiB | 10 | 10 |
| En Reve · Current source | load · transfer · desktop · warm · none · instrumented | CSS KiB | 10 | 10 |
| En Reve · Current source | load · transfer · desktop · warm · none · instrumented | Fonts KiB | 10 | 10 |
| En Reve · Current source | load · transfer · desktop · warm · none · instrumented | Other KiB | 10 | 10 |
| En Reve · Current source | load · transfer · desktop · warm · none · instrumented | HTTP responses | 10 | 10 |
| En Reve · Current source | load · transfer · desktop · warm · none · instrumented | Cache reuse entries | 10 | 10 |
| En Reve · Current source | load · transfer · desktop · warm · none · instrumented | Incomplete responses | 10 | 10 |
| Fluent · Web Components | load · thread · desktop · warm · none · instrumented | Script ms | 10 | 10 |
| Fluent · Web Components | load · thread · desktop · warm · none · instrumented | Style ms | 10 | 10 |
| Fluent · Web Components | load · thread · desktop · warm · none · instrumented | Layout ms | 10 | 10 |
| Fluent · Web Components | load · thread · desktop · warm · none · instrumented | Task ms | 10 | 10 |
| Fluent · Web Components | load · thread · desktop · warm · none · instrumented | Layout passes | 10 | 10 |
| Fluent · Web Components | load · thread · desktop · warm · none · instrumented | Style recalcs | 10 | 10 |
| Fluent · Web Components | load · thread · desktop · warm · none · instrumented | Long tasks ms | 10 | 10 |
| Fluent · Web Components | load · thread · desktop · warm · none · instrumented | Pre-FCP blocking excess ms | 10 | 10 |
| Fluent · Web Components | load · thread · desktop · warm · none · instrumented | Post-FCP blocking excess ms | 10 | 10 |
| Fluent · Web Components | load · thread · desktop · warm · none · instrumented | Long animation frames ms | 10 | 10 |
| En Reve · Web Components | load · thread · desktop · warm · none · instrumented | Script ms | 10 | 10 |
| En Reve · Web Components | load · thread · desktop · warm · none · instrumented | Style ms | 10 | 10 |
| En Reve · Web Components | load · thread · desktop · warm · none · instrumented | Layout ms | 10 | 10 |
| En Reve · Web Components | load · thread · desktop · warm · none · instrumented | Task ms | 10 | 10 |
| En Reve · Web Components | load · thread · desktop · warm · none · instrumented | Layout passes | 10 | 10 |
| En Reve · Web Components | load · thread · desktop · warm · none · instrumented | Style recalcs | 10 | 10 |
| En Reve · Web Components | load · thread · desktop · warm · none · instrumented | Long tasks ms | 10 | 10 |
| En Reve · Web Components | load · thread · desktop · warm · none · instrumented | Pre-FCP blocking excess ms | 10 | 10 |
| En Reve · Web Components | load · thread · desktop · warm · none · instrumented | Post-FCP blocking excess ms | 10 | 10 |
| En Reve · Web Components | load · thread · desktop · warm · none · instrumented | Long animation frames ms | 10 | 10 |
| Web Awesome · Web Components | load · thread · desktop · warm · none · instrumented | Script ms | 10 | 10 |
| Web Awesome · Web Components | load · thread · desktop · warm · none · instrumented | Style ms | 10 | 10 |
| Web Awesome · Web Components | load · thread · desktop · warm · none · instrumented | Layout ms | 10 | 10 |
| Web Awesome · Web Components | load · thread · desktop · warm · none · instrumented | Task ms | 10 | 10 |
| Web Awesome · Web Components | load · thread · desktop · warm · none · instrumented | Layout passes | 10 | 10 |
| Web Awesome · Web Components | load · thread · desktop · warm · none · instrumented | Style recalcs | 10 | 10 |
| Web Awesome · Web Components | load · thread · desktop · warm · none · instrumented | Long tasks ms | 10 | 10 |
| Web Awesome · Web Components | load · thread · desktop · warm · none · instrumented | Pre-FCP blocking excess ms | 10 | 10 |
| Web Awesome · Web Components | load · thread · desktop · warm · none · instrumented | Post-FCP blocking excess ms | 10 | 10 |
| Web Awesome · Web Components | load · thread · desktop · warm · none · instrumented | Long animation frames ms | 10 | 10 |
| En Reve · Current source | load · thread · desktop · warm · none · instrumented | Script ms | 10 | 10 |
| En Reve · Current source | load · thread · desktop · warm · none · instrumented | Style ms | 10 | 10 |
| En Reve · Current source | load · thread · desktop · warm · none · instrumented | Layout ms | 10 | 10 |
| En Reve · Current source | load · thread · desktop · warm · none · instrumented | Task ms | 10 | 10 |
| En Reve · Current source | load · thread · desktop · warm · none · instrumented | Layout passes | 10 | 10 |
| En Reve · Current source | load · thread · desktop · warm · none · instrumented | Style recalcs | 10 | 10 |
| En Reve · Current source | load · thread · desktop · warm · none · instrumented | Long tasks ms | 10 | 10 |
| En Reve · Current source | load · thread · desktop · warm · none · instrumented | Pre-FCP blocking excess ms | 10 | 10 |
| En Reve · Current source | load · thread · desktop · warm · none · instrumented | Post-FCP blocking excess ms | 10 | 10 |
| En Reve · Current source | load · thread · desktop · warm · none · instrumented | Long animation frames ms | 10 | 10 |
| Fluent · Web Components | startup · startup · mobile · cold · none · instrumented | Control observed ms | 10 | 10 |
| Fluent · Web Components | startup · startup · mobile · cold · none · instrumented | Click from navigation ms | 10 | 10 |
| Fluent · Web Components | startup · startup · mobile · cold · none · instrumented | Result from navigation ms | 10 | 10 |
| Fluent · Web Components | startup · startup · mobile · cold · none · instrumented | Result p75 ms | 10 | 10 |
| Fluent · Web Components | startup · startup · mobile · cold · none · instrumented | Dispatch overhead ms | 10 | 10 |
| Fluent · Web Components | startup · startup · mobile · cold · none · instrumented | Discovery probe ms | 10 | 10 |
| Fluent · Web Components | startup · startup · mobile · cold · none · instrumented | Click to result ms | 10 | 10 |
| Fluent · Web Components | startup · startup · mobile · cold · none · instrumented | Click to frame ms | 10 | 10 |
| Fluent · Web Components | startup · startup · mobile · cold · none · instrumented | First input delay ms | 8 | 10 |
| En Reve · Web Components | startup · startup · mobile · cold · none · instrumented | Control observed ms | 10 | 10 |
| En Reve · Web Components | startup · startup · mobile · cold · none · instrumented | Click from navigation ms | 10 | 10 |
| En Reve · Web Components | startup · startup · mobile · cold · none · instrumented | Result from navigation ms | 10 | 10 |
| En Reve · Web Components | startup · startup · mobile · cold · none · instrumented | Result p75 ms | 10 | 10 |
| En Reve · Web Components | startup · startup · mobile · cold · none · instrumented | Dispatch overhead ms | 10 | 10 |
| En Reve · Web Components | startup · startup · mobile · cold · none · instrumented | Discovery probe ms | 10 | 10 |
| En Reve · Web Components | startup · startup · mobile · cold · none · instrumented | Click to result ms | 10 | 10 |
| En Reve · Web Components | startup · startup · mobile · cold · none · instrumented | Click to frame ms | 10 | 10 |
| En Reve · Web Components | startup · startup · mobile · cold · none · instrumented | First input delay ms | 5 | 10 |
| Web Awesome · Web Components | startup · startup · mobile · cold · none · instrumented | Control observed ms | 10 | 10 |
| Web Awesome · Web Components | startup · startup · mobile · cold · none · instrumented | Click from navigation ms | 10 | 10 |
| Web Awesome · Web Components | startup · startup · mobile · cold · none · instrumented | Result from navigation ms | 10 | 10 |
| Web Awesome · Web Components | startup · startup · mobile · cold · none · instrumented | Result p75 ms | 10 | 10 |
| Web Awesome · Web Components | startup · startup · mobile · cold · none · instrumented | Dispatch overhead ms | 10 | 10 |
| Web Awesome · Web Components | startup · startup · mobile · cold · none · instrumented | Discovery probe ms | 10 | 10 |
| Web Awesome · Web Components | startup · startup · mobile · cold · none · instrumented | Click to result ms | 10 | 10 |
| Web Awesome · Web Components | startup · startup · mobile · cold · none · instrumented | Click to frame ms | 10 | 10 |
| Web Awesome · Web Components | startup · startup · mobile · cold · none · instrumented | First input delay ms | 9 | 10 |
| En Reve · Current source | startup · startup · mobile · cold · none · instrumented | Control observed ms | 10 | 10 |
| En Reve · Current source | startup · startup · mobile · cold · none · instrumented | Click from navigation ms | 10 | 10 |
| En Reve · Current source | startup · startup · mobile · cold · none · instrumented | Result from navigation ms | 10 | 10 |
| En Reve · Current source | startup · startup · mobile · cold · none · instrumented | Result p75 ms | 10 | 10 |
| En Reve · Current source | startup · startup · mobile · cold · none · instrumented | Dispatch overhead ms | 10 | 10 |
| En Reve · Current source | startup · startup · mobile · cold · none · instrumented | Discovery probe ms | 10 | 10 |
| En Reve · Current source | startup · startup · mobile · cold · none · instrumented | Click to result ms | 10 | 10 |
| En Reve · Current source | startup · startup · mobile · cold · none · instrumented | Click to frame ms | 10 | 10 |
| En Reve · Current source | startup · startup · mobile · cold · none · instrumented | First input delay ms | 7 | 10 |
| Fluent · Web Components | startup · transfer · mobile · cold · none · instrumented | Total response KiB | 10 | 10 |
| Fluent · Web Components | startup · transfer · mobile · cold · none · instrumented | HTML KiB | 10 | 10 |
| Fluent · Web Components | startup · transfer · mobile · cold · none · instrumented | JS KiB | 10 | 10 |
| Fluent · Web Components | startup · transfer · mobile · cold · none · instrumented | CSS KiB | 10 | 10 |
| Fluent · Web Components | startup · transfer · mobile · cold · none · instrumented | Fonts KiB | 10 | 10 |
| Fluent · Web Components | startup · transfer · mobile · cold · none · instrumented | Other KiB | 10 | 10 |
| Fluent · Web Components | startup · transfer · mobile · cold · none · instrumented | HTTP responses | 10 | 10 |
| Fluent · Web Components | startup · transfer · mobile · cold · none · instrumented | Cache reuse entries | 10 | 10 |
| Fluent · Web Components | startup · transfer · mobile · cold · none · instrumented | Incomplete responses | 10 | 10 |
| En Reve · Web Components | startup · transfer · mobile · cold · none · instrumented | Total response KiB | 10 | 10 |
| En Reve · Web Components | startup · transfer · mobile · cold · none · instrumented | HTML KiB | 10 | 10 |
| En Reve · Web Components | startup · transfer · mobile · cold · none · instrumented | JS KiB | 10 | 10 |
| En Reve · Web Components | startup · transfer · mobile · cold · none · instrumented | CSS KiB | 10 | 10 |
| En Reve · Web Components | startup · transfer · mobile · cold · none · instrumented | Fonts KiB | 10 | 10 |
| En Reve · Web Components | startup · transfer · mobile · cold · none · instrumented | Other KiB | 10 | 10 |
| En Reve · Web Components | startup · transfer · mobile · cold · none · instrumented | HTTP responses | 10 | 10 |
| En Reve · Web Components | startup · transfer · mobile · cold · none · instrumented | Cache reuse entries | 10 | 10 |
| En Reve · Web Components | startup · transfer · mobile · cold · none · instrumented | Incomplete responses | 10 | 10 |
| Web Awesome · Web Components | startup · transfer · mobile · cold · none · instrumented | Total response KiB | 10 | 10 |
| Web Awesome · Web Components | startup · transfer · mobile · cold · none · instrumented | HTML KiB | 10 | 10 |
| Web Awesome · Web Components | startup · transfer · mobile · cold · none · instrumented | JS KiB | 10 | 10 |
| Web Awesome · Web Components | startup · transfer · mobile · cold · none · instrumented | CSS KiB | 10 | 10 |
| Web Awesome · Web Components | startup · transfer · mobile · cold · none · instrumented | Fonts KiB | 10 | 10 |
| Web Awesome · Web Components | startup · transfer · mobile · cold · none · instrumented | Other KiB | 10 | 10 |
| Web Awesome · Web Components | startup · transfer · mobile · cold · none · instrumented | HTTP responses | 10 | 10 |
| Web Awesome · Web Components | startup · transfer · mobile · cold · none · instrumented | Cache reuse entries | 10 | 10 |
| Web Awesome · Web Components | startup · transfer · mobile · cold · none · instrumented | Incomplete responses | 10 | 10 |
| En Reve · Current source | startup · transfer · mobile · cold · none · instrumented | Total response KiB | 10 | 10 |
| En Reve · Current source | startup · transfer · mobile · cold · none · instrumented | HTML KiB | 10 | 10 |
| En Reve · Current source | startup · transfer · mobile · cold · none · instrumented | JS KiB | 10 | 10 |
| En Reve · Current source | startup · transfer · mobile · cold · none · instrumented | CSS KiB | 10 | 10 |
| En Reve · Current source | startup · transfer · mobile · cold · none · instrumented | Fonts KiB | 10 | 10 |
| En Reve · Current source | startup · transfer · mobile · cold · none · instrumented | Other KiB | 10 | 10 |
| En Reve · Current source | startup · transfer · mobile · cold · none · instrumented | HTTP responses | 10 | 10 |
| En Reve · Current source | startup · transfer · mobile · cold · none · instrumented | Cache reuse entries | 10 | 10 |
| En Reve · Current source | startup · transfer · mobile · cold · none · instrumented | Incomplete responses | 10 | 10 |
| Fluent · Web Components | startup · startup · desktop · cold · none · instrumented | Control observed ms | 10 | 10 |
| Fluent · Web Components | startup · startup · desktop · cold · none · instrumented | Click from navigation ms | 10 | 10 |
| Fluent · Web Components | startup · startup · desktop · cold · none · instrumented | Result from navigation ms | 10 | 10 |
| Fluent · Web Components | startup · startup · desktop · cold · none · instrumented | Result p75 ms | 10 | 10 |
| Fluent · Web Components | startup · startup · desktop · cold · none · instrumented | Dispatch overhead ms | 10 | 10 |
| Fluent · Web Components | startup · startup · desktop · cold · none · instrumented | Discovery probe ms | 10 | 10 |
| Fluent · Web Components | startup · startup · desktop · cold · none · instrumented | Click to result ms | 10 | 10 |
| Fluent · Web Components | startup · startup · desktop · cold · none · instrumented | Click to frame ms | 10 | 10 |
| Fluent · Web Components | startup · startup · desktop · cold · none · instrumented | First input delay ms | 0 | 10 |
| En Reve · Web Components | startup · startup · desktop · cold · none · instrumented | Control observed ms | 10 | 10 |
| En Reve · Web Components | startup · startup · desktop · cold · none · instrumented | Click from navigation ms | 10 | 10 |
| En Reve · Web Components | startup · startup · desktop · cold · none · instrumented | Result from navigation ms | 10 | 10 |
| En Reve · Web Components | startup · startup · desktop · cold · none · instrumented | Result p75 ms | 10 | 10 |
| En Reve · Web Components | startup · startup · desktop · cold · none · instrumented | Dispatch overhead ms | 10 | 10 |
| En Reve · Web Components | startup · startup · desktop · cold · none · instrumented | Discovery probe ms | 10 | 10 |
| En Reve · Web Components | startup · startup · desktop · cold · none · instrumented | Click to result ms | 10 | 10 |
| En Reve · Web Components | startup · startup · desktop · cold · none · instrumented | Click to frame ms | 10 | 10 |
| En Reve · Web Components | startup · startup · desktop · cold · none · instrumented | First input delay ms | 2 | 10 |
| Web Awesome · Web Components | startup · startup · desktop · cold · none · instrumented | Control observed ms | 10 | 10 |
| Web Awesome · Web Components | startup · startup · desktop · cold · none · instrumented | Click from navigation ms | 10 | 10 |
| Web Awesome · Web Components | startup · startup · desktop · cold · none · instrumented | Result from navigation ms | 10 | 10 |
| Web Awesome · Web Components | startup · startup · desktop · cold · none · instrumented | Result p75 ms | 10 | 10 |
| Web Awesome · Web Components | startup · startup · desktop · cold · none · instrumented | Dispatch overhead ms | 10 | 10 |
| Web Awesome · Web Components | startup · startup · desktop · cold · none · instrumented | Discovery probe ms | 10 | 10 |
| Web Awesome · Web Components | startup · startup · desktop · cold · none · instrumented | Click to result ms | 10 | 10 |
| Web Awesome · Web Components | startup · startup · desktop · cold · none · instrumented | Click to frame ms | 10 | 10 |
| Web Awesome · Web Components | startup · startup · desktop · cold · none · instrumented | First input delay ms | 0 | 10 |
| En Reve · Current source | startup · startup · desktop · cold · none · instrumented | Control observed ms | 10 | 10 |
| En Reve · Current source | startup · startup · desktop · cold · none · instrumented | Click from navigation ms | 10 | 10 |
| En Reve · Current source | startup · startup · desktop · cold · none · instrumented | Result from navigation ms | 10 | 10 |
| En Reve · Current source | startup · startup · desktop · cold · none · instrumented | Result p75 ms | 10 | 10 |
| En Reve · Current source | startup · startup · desktop · cold · none · instrumented | Dispatch overhead ms | 10 | 10 |
| En Reve · Current source | startup · startup · desktop · cold · none · instrumented | Discovery probe ms | 10 | 10 |
| En Reve · Current source | startup · startup · desktop · cold · none · instrumented | Click to result ms | 10 | 10 |
| En Reve · Current source | startup · startup · desktop · cold · none · instrumented | Click to frame ms | 10 | 10 |
| En Reve · Current source | startup · startup · desktop · cold · none · instrumented | First input delay ms | 0 | 10 |
| Fluent · Web Components | startup · transfer · desktop · cold · none · instrumented | Total response KiB | 10 | 10 |
| Fluent · Web Components | startup · transfer · desktop · cold · none · instrumented | HTML KiB | 10 | 10 |
| Fluent · Web Components | startup · transfer · desktop · cold · none · instrumented | JS KiB | 10 | 10 |
| Fluent · Web Components | startup · transfer · desktop · cold · none · instrumented | CSS KiB | 10 | 10 |
| Fluent · Web Components | startup · transfer · desktop · cold · none · instrumented | Fonts KiB | 10 | 10 |
| Fluent · Web Components | startup · transfer · desktop · cold · none · instrumented | Other KiB | 10 | 10 |
| Fluent · Web Components | startup · transfer · desktop · cold · none · instrumented | HTTP responses | 10 | 10 |
| Fluent · Web Components | startup · transfer · desktop · cold · none · instrumented | Cache reuse entries | 10 | 10 |
| Fluent · Web Components | startup · transfer · desktop · cold · none · instrumented | Incomplete responses | 10 | 10 |
| En Reve · Web Components | startup · transfer · desktop · cold · none · instrumented | Total response KiB | 10 | 10 |
| En Reve · Web Components | startup · transfer · desktop · cold · none · instrumented | HTML KiB | 10 | 10 |
| En Reve · Web Components | startup · transfer · desktop · cold · none · instrumented | JS KiB | 10 | 10 |
| En Reve · Web Components | startup · transfer · desktop · cold · none · instrumented | CSS KiB | 10 | 10 |
| En Reve · Web Components | startup · transfer · desktop · cold · none · instrumented | Fonts KiB | 10 | 10 |
| En Reve · Web Components | startup · transfer · desktop · cold · none · instrumented | Other KiB | 10 | 10 |
| En Reve · Web Components | startup · transfer · desktop · cold · none · instrumented | HTTP responses | 10 | 10 |
| En Reve · Web Components | startup · transfer · desktop · cold · none · instrumented | Cache reuse entries | 10 | 10 |
| En Reve · Web Components | startup · transfer · desktop · cold · none · instrumented | Incomplete responses | 10 | 10 |
| Web Awesome · Web Components | startup · transfer · desktop · cold · none · instrumented | Total response KiB | 10 | 10 |
| Web Awesome · Web Components | startup · transfer · desktop · cold · none · instrumented | HTML KiB | 10 | 10 |
| Web Awesome · Web Components | startup · transfer · desktop · cold · none · instrumented | JS KiB | 10 | 10 |
| Web Awesome · Web Components | startup · transfer · desktop · cold · none · instrumented | CSS KiB | 10 | 10 |
| Web Awesome · Web Components | startup · transfer · desktop · cold · none · instrumented | Fonts KiB | 10 | 10 |
| Web Awesome · Web Components | startup · transfer · desktop · cold · none · instrumented | Other KiB | 10 | 10 |
| Web Awesome · Web Components | startup · transfer · desktop · cold · none · instrumented | HTTP responses | 10 | 10 |
| Web Awesome · Web Components | startup · transfer · desktop · cold · none · instrumented | Cache reuse entries | 10 | 10 |
| Web Awesome · Web Components | startup · transfer · desktop · cold · none · instrumented | Incomplete responses | 10 | 10 |
| En Reve · Current source | startup · transfer · desktop · cold · none · instrumented | Total response KiB | 10 | 10 |
| En Reve · Current source | startup · transfer · desktop · cold · none · instrumented | HTML KiB | 10 | 10 |
| En Reve · Current source | startup · transfer · desktop · cold · none · instrumented | JS KiB | 10 | 10 |
| En Reve · Current source | startup · transfer · desktop · cold · none · instrumented | CSS KiB | 10 | 10 |
| En Reve · Current source | startup · transfer · desktop · cold · none · instrumented | Fonts KiB | 10 | 10 |
| En Reve · Current source | startup · transfer · desktop · cold · none · instrumented | Other KiB | 10 | 10 |
| En Reve · Current source | startup · transfer · desktop · cold · none · instrumented | HTTP responses | 10 | 10 |
| En Reve · Current source | startup · transfer · desktop · cold · none · instrumented | Cache reuse entries | 10 | 10 |
| En Reve · Current source | startup · transfer · desktop · cold · none · instrumented | Incomplete responses | 10 | 10 |
| Fluent · Web Components | interactions · interactions · mobile · cold · none · instrumented | Scripted INP ms | 10 | 10 |
| Fluent · Web Components | interactions · interactions · mobile · cold · none · instrumented | Scripted INP p75 ms | 10 | 10 |
| Fluent · Web Components | interactions · interactions · mobile · cold · none · instrumented | First input delay ms | 10 | 10 |
| Fluent · Web Components | interactions · interactions · mobile · cold · none · instrumented | Journey CLS | 10 | 10 |
| Fluent · Web Components | interactions · interactions · mobile · cold · none · instrumented | Max scroll rAF gap ms | 10 | 10 |
| En Reve · Web Components | interactions · interactions · mobile · cold · none · instrumented | Scripted INP ms | 10 | 10 |
| En Reve · Web Components | interactions · interactions · mobile · cold · none · instrumented | Scripted INP p75 ms | 10 | 10 |
| En Reve · Web Components | interactions · interactions · mobile · cold · none · instrumented | First input delay ms | 10 | 10 |
| En Reve · Web Components | interactions · interactions · mobile · cold · none · instrumented | Journey CLS | 10 | 10 |
| En Reve · Web Components | interactions · interactions · mobile · cold · none · instrumented | Max scroll rAF gap ms | 10 | 10 |
| Web Awesome · Web Components | interactions · interactions · mobile · cold · none · instrumented | Scripted INP ms | 10 | 10 |
| Web Awesome · Web Components | interactions · interactions · mobile · cold · none · instrumented | Scripted INP p75 ms | 10 | 10 |
| Web Awesome · Web Components | interactions · interactions · mobile · cold · none · instrumented | First input delay ms | 10 | 10 |
| Web Awesome · Web Components | interactions · interactions · mobile · cold · none · instrumented | Journey CLS | 10 | 10 |
| Web Awesome · Web Components | interactions · interactions · mobile · cold · none · instrumented | Max scroll rAF gap ms | 10 | 10 |
| En Reve · Current source | interactions · interactions · mobile · cold · none · instrumented | Scripted INP ms | 10 | 10 |
| En Reve · Current source | interactions · interactions · mobile · cold · none · instrumented | Scripted INP p75 ms | 10 | 10 |
| En Reve · Current source | interactions · interactions · mobile · cold · none · instrumented | First input delay ms | 10 | 10 |
| En Reve · Current source | interactions · interactions · mobile · cold · none · instrumented | Journey CLS | 10 | 10 |
| En Reve · Current source | interactions · interactions · mobile · cold · none · instrumented | Max scroll rAF gap ms | 10 | 10 |
| Fluent · Web Components | interactions · transfer · mobile · cold · none · instrumented | Total response KiB | 10 | 10 |
| Fluent · Web Components | interactions · transfer · mobile · cold · none · instrumented | HTML KiB | 10 | 10 |
| Fluent · Web Components | interactions · transfer · mobile · cold · none · instrumented | JS KiB | 10 | 10 |
| Fluent · Web Components | interactions · transfer · mobile · cold · none · instrumented | CSS KiB | 10 | 10 |
| Fluent · Web Components | interactions · transfer · mobile · cold · none · instrumented | Fonts KiB | 10 | 10 |
| Fluent · Web Components | interactions · transfer · mobile · cold · none · instrumented | Other KiB | 10 | 10 |
| Fluent · Web Components | interactions · transfer · mobile · cold · none · instrumented | HTTP responses | 10 | 10 |
| Fluent · Web Components | interactions · transfer · mobile · cold · none · instrumented | Cache reuse entries | 10 | 10 |
| Fluent · Web Components | interactions · transfer · mobile · cold · none · instrumented | Incomplete responses | 10 | 10 |
| En Reve · Web Components | interactions · transfer · mobile · cold · none · instrumented | Total response KiB | 10 | 10 |
| En Reve · Web Components | interactions · transfer · mobile · cold · none · instrumented | HTML KiB | 10 | 10 |
| En Reve · Web Components | interactions · transfer · mobile · cold · none · instrumented | JS KiB | 10 | 10 |
| En Reve · Web Components | interactions · transfer · mobile · cold · none · instrumented | CSS KiB | 10 | 10 |
| En Reve · Web Components | interactions · transfer · mobile · cold · none · instrumented | Fonts KiB | 10 | 10 |
| En Reve · Web Components | interactions · transfer · mobile · cold · none · instrumented | Other KiB | 10 | 10 |
| En Reve · Web Components | interactions · transfer · mobile · cold · none · instrumented | HTTP responses | 10 | 10 |
| En Reve · Web Components | interactions · transfer · mobile · cold · none · instrumented | Cache reuse entries | 10 | 10 |
| En Reve · Web Components | interactions · transfer · mobile · cold · none · instrumented | Incomplete responses | 10 | 10 |
| Web Awesome · Web Components | interactions · transfer · mobile · cold · none · instrumented | Total response KiB | 10 | 10 |
| Web Awesome · Web Components | interactions · transfer · mobile · cold · none · instrumented | HTML KiB | 10 | 10 |
| Web Awesome · Web Components | interactions · transfer · mobile · cold · none · instrumented | JS KiB | 10 | 10 |
| Web Awesome · Web Components | interactions · transfer · mobile · cold · none · instrumented | CSS KiB | 10 | 10 |
| Web Awesome · Web Components | interactions · transfer · mobile · cold · none · instrumented | Fonts KiB | 10 | 10 |
| Web Awesome · Web Components | interactions · transfer · mobile · cold · none · instrumented | Other KiB | 10 | 10 |
| Web Awesome · Web Components | interactions · transfer · mobile · cold · none · instrumented | HTTP responses | 10 | 10 |
| Web Awesome · Web Components | interactions · transfer · mobile · cold · none · instrumented | Cache reuse entries | 10 | 10 |
| Web Awesome · Web Components | interactions · transfer · mobile · cold · none · instrumented | Incomplete responses | 10 | 10 |
| En Reve · Current source | interactions · transfer · mobile · cold · none · instrumented | Total response KiB | 10 | 10 |
| En Reve · Current source | interactions · transfer · mobile · cold · none · instrumented | HTML KiB | 10 | 10 |
| En Reve · Current source | interactions · transfer · mobile · cold · none · instrumented | JS KiB | 10 | 10 |
| En Reve · Current source | interactions · transfer · mobile · cold · none · instrumented | CSS KiB | 10 | 10 |
| En Reve · Current source | interactions · transfer · mobile · cold · none · instrumented | Fonts KiB | 10 | 10 |
| En Reve · Current source | interactions · transfer · mobile · cold · none · instrumented | Other KiB | 10 | 10 |
| En Reve · Current source | interactions · transfer · mobile · cold · none · instrumented | HTTP responses | 10 | 10 |
| En Reve · Current source | interactions · transfer · mobile · cold · none · instrumented | Cache reuse entries | 10 | 10 |
| En Reve · Current source | interactions · transfer · mobile · cold · none · instrumented | Incomplete responses | 10 | 10 |
| Fluent · Web Components | interactions · canvas-landscape-first · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Fluent · Web Components | interactions · canvas-landscape-first · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Web Components | interactions · canvas-landscape-first · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Web Components | interactions · canvas-landscape-first · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · canvas-landscape-first · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · canvas-landscape-first · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Current source | interactions · canvas-landscape-first · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Current source | interactions · canvas-landscape-first · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Fluent · Web Components | interactions · canvas-portrait-first · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Fluent · Web Components | interactions · canvas-portrait-first · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Web Components | interactions · canvas-portrait-first · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Web Components | interactions · canvas-portrait-first · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · canvas-portrait-first · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · canvas-portrait-first · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Current source | interactions · canvas-portrait-first · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Current source | interactions · canvas-portrait-first · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Fluent · Web Components | interactions · asset-add-first · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Fluent · Web Components | interactions · asset-add-first · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Web Components | interactions · asset-add-first · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Web Components | interactions · asset-add-first · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · asset-add-first · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · asset-add-first · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Current source | interactions · asset-add-first · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Current source | interactions · asset-add-first · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Fluent · Web Components | interactions · asset-reset-first · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Fluent · Web Components | interactions · asset-reset-first · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Web Components | interactions · asset-reset-first · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Web Components | interactions · asset-reset-first · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · asset-reset-first · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · asset-reset-first · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Current source | interactions · asset-reset-first · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Current source | interactions · asset-reset-first · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Fluent · Web Components | interactions · dialog-open-first · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Fluent · Web Components | interactions · dialog-open-first · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Web Components | interactions · dialog-open-first · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Web Components | interactions · dialog-open-first · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · dialog-open-first · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · dialog-open-first · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Current source | interactions · dialog-open-first · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Current source | interactions · dialog-open-first · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Fluent · Web Components | interactions · canvas-landscape-warm · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Fluent · Web Components | interactions · canvas-landscape-warm · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Web Components | interactions · canvas-landscape-warm · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Web Components | interactions · canvas-landscape-warm · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · canvas-landscape-warm · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · canvas-landscape-warm · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Current source | interactions · canvas-landscape-warm · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Current source | interactions · canvas-landscape-warm · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Fluent · Web Components | interactions · canvas-portrait-warm · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Fluent · Web Components | interactions · canvas-portrait-warm · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Web Components | interactions · canvas-portrait-warm · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Web Components | interactions · canvas-portrait-warm · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · canvas-portrait-warm · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · canvas-portrait-warm · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Current source | interactions · canvas-portrait-warm · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Current source | interactions · canvas-portrait-warm · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Fluent · Web Components | interactions · asset-add-warm · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Fluent · Web Components | interactions · asset-add-warm · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Web Components | interactions · asset-add-warm · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Web Components | interactions · asset-add-warm · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · asset-add-warm · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · asset-add-warm · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Current source | interactions · asset-add-warm · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Current source | interactions · asset-add-warm · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Fluent · Web Components | interactions · asset-reset-warm · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Fluent · Web Components | interactions · asset-reset-warm · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Web Components | interactions · asset-reset-warm · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Web Components | interactions · asset-reset-warm · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · asset-reset-warm · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · asset-reset-warm · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Current source | interactions · asset-reset-warm · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Current source | interactions · asset-reset-warm · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Fluent · Web Components | interactions · dialog-open-warm · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Fluent · Web Components | interactions · dialog-open-warm · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Web Components | interactions · dialog-open-warm · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Web Components | interactions · dialog-open-warm · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · dialog-open-warm · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · dialog-open-warm · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Current source | interactions · dialog-open-warm · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Current source | interactions · dialog-open-warm · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Fluent · Web Components | interactions · review-submit · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Fluent · Web Components | interactions · review-submit · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Web Components | interactions · review-submit · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Web Components | interactions · review-submit · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · review-submit · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · review-submit · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Current source | interactions · review-submit · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Current source | interactions · review-submit · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Fluent · Web Components | interactions · commands-first · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Fluent · Web Components | interactions · commands-first · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Web Components | interactions · commands-first · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Web Components | interactions · commands-first · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · commands-first · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · commands-first · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Current source | interactions · commands-first · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Current source | interactions · commands-first · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Fluent · Web Components | interactions · interactions · desktop · cold · none · instrumented | Scripted INP ms | 10 | 10 |
| Fluent · Web Components | interactions · interactions · desktop · cold · none · instrumented | Scripted INP p75 ms | 10 | 10 |
| Fluent · Web Components | interactions · interactions · desktop · cold · none · instrumented | First input delay ms | 10 | 10 |
| Fluent · Web Components | interactions · interactions · desktop · cold · none · instrumented | Journey CLS | 10 | 10 |
| Fluent · Web Components | interactions · interactions · desktop · cold · none · instrumented | Max scroll rAF gap ms | 10 | 10 |
| En Reve · Web Components | interactions · interactions · desktop · cold · none · instrumented | Scripted INP ms | 10 | 10 |
| En Reve · Web Components | interactions · interactions · desktop · cold · none · instrumented | Scripted INP p75 ms | 10 | 10 |
| En Reve · Web Components | interactions · interactions · desktop · cold · none · instrumented | First input delay ms | 10 | 10 |
| En Reve · Web Components | interactions · interactions · desktop · cold · none · instrumented | Journey CLS | 10 | 10 |
| En Reve · Web Components | interactions · interactions · desktop · cold · none · instrumented | Max scroll rAF gap ms | 10 | 10 |
| Web Awesome · Web Components | interactions · interactions · desktop · cold · none · instrumented | Scripted INP ms | 10 | 10 |
| Web Awesome · Web Components | interactions · interactions · desktop · cold · none · instrumented | Scripted INP p75 ms | 10 | 10 |
| Web Awesome · Web Components | interactions · interactions · desktop · cold · none · instrumented | First input delay ms | 10 | 10 |
| Web Awesome · Web Components | interactions · interactions · desktop · cold · none · instrumented | Journey CLS | 10 | 10 |
| Web Awesome · Web Components | interactions · interactions · desktop · cold · none · instrumented | Max scroll rAF gap ms | 10 | 10 |
| En Reve · Current source | interactions · interactions · desktop · cold · none · instrumented | Scripted INP ms | 10 | 10 |
| En Reve · Current source | interactions · interactions · desktop · cold · none · instrumented | Scripted INP p75 ms | 10 | 10 |
| En Reve · Current source | interactions · interactions · desktop · cold · none · instrumented | First input delay ms | 10 | 10 |
| En Reve · Current source | interactions · interactions · desktop · cold · none · instrumented | Journey CLS | 10 | 10 |
| En Reve · Current source | interactions · interactions · desktop · cold · none · instrumented | Max scroll rAF gap ms | 10 | 10 |
| Fluent · Web Components | interactions · transfer · desktop · cold · none · instrumented | Total response KiB | 10 | 10 |
| Fluent · Web Components | interactions · transfer · desktop · cold · none · instrumented | HTML KiB | 10 | 10 |
| Fluent · Web Components | interactions · transfer · desktop · cold · none · instrumented | JS KiB | 10 | 10 |
| Fluent · Web Components | interactions · transfer · desktop · cold · none · instrumented | CSS KiB | 10 | 10 |
| Fluent · Web Components | interactions · transfer · desktop · cold · none · instrumented | Fonts KiB | 10 | 10 |
| Fluent · Web Components | interactions · transfer · desktop · cold · none · instrumented | Other KiB | 10 | 10 |
| Fluent · Web Components | interactions · transfer · desktop · cold · none · instrumented | HTTP responses | 10 | 10 |
| Fluent · Web Components | interactions · transfer · desktop · cold · none · instrumented | Cache reuse entries | 10 | 10 |
| Fluent · Web Components | interactions · transfer · desktop · cold · none · instrumented | Incomplete responses | 10 | 10 |
| En Reve · Web Components | interactions · transfer · desktop · cold · none · instrumented | Total response KiB | 10 | 10 |
| En Reve · Web Components | interactions · transfer · desktop · cold · none · instrumented | HTML KiB | 10 | 10 |
| En Reve · Web Components | interactions · transfer · desktop · cold · none · instrumented | JS KiB | 10 | 10 |
| En Reve · Web Components | interactions · transfer · desktop · cold · none · instrumented | CSS KiB | 10 | 10 |
| En Reve · Web Components | interactions · transfer · desktop · cold · none · instrumented | Fonts KiB | 10 | 10 |
| En Reve · Web Components | interactions · transfer · desktop · cold · none · instrumented | Other KiB | 10 | 10 |
| En Reve · Web Components | interactions · transfer · desktop · cold · none · instrumented | HTTP responses | 10 | 10 |
| En Reve · Web Components | interactions · transfer · desktop · cold · none · instrumented | Cache reuse entries | 10 | 10 |
| En Reve · Web Components | interactions · transfer · desktop · cold · none · instrumented | Incomplete responses | 10 | 10 |
| Web Awesome · Web Components | interactions · transfer · desktop · cold · none · instrumented | Total response KiB | 10 | 10 |
| Web Awesome · Web Components | interactions · transfer · desktop · cold · none · instrumented | HTML KiB | 10 | 10 |
| Web Awesome · Web Components | interactions · transfer · desktop · cold · none · instrumented | JS KiB | 10 | 10 |
| Web Awesome · Web Components | interactions · transfer · desktop · cold · none · instrumented | CSS KiB | 10 | 10 |
| Web Awesome · Web Components | interactions · transfer · desktop · cold · none · instrumented | Fonts KiB | 10 | 10 |
| Web Awesome · Web Components | interactions · transfer · desktop · cold · none · instrumented | Other KiB | 10 | 10 |
| Web Awesome · Web Components | interactions · transfer · desktop · cold · none · instrumented | HTTP responses | 10 | 10 |
| Web Awesome · Web Components | interactions · transfer · desktop · cold · none · instrumented | Cache reuse entries | 10 | 10 |
| Web Awesome · Web Components | interactions · transfer · desktop · cold · none · instrumented | Incomplete responses | 10 | 10 |
| En Reve · Current source | interactions · transfer · desktop · cold · none · instrumented | Total response KiB | 10 | 10 |
| En Reve · Current source | interactions · transfer · desktop · cold · none · instrumented | HTML KiB | 10 | 10 |
| En Reve · Current source | interactions · transfer · desktop · cold · none · instrumented | JS KiB | 10 | 10 |
| En Reve · Current source | interactions · transfer · desktop · cold · none · instrumented | CSS KiB | 10 | 10 |
| En Reve · Current source | interactions · transfer · desktop · cold · none · instrumented | Fonts KiB | 10 | 10 |
| En Reve · Current source | interactions · transfer · desktop · cold · none · instrumented | Other KiB | 10 | 10 |
| En Reve · Current source | interactions · transfer · desktop · cold · none · instrumented | HTTP responses | 10 | 10 |
| En Reve · Current source | interactions · transfer · desktop · cold · none · instrumented | Cache reuse entries | 10 | 10 |
| En Reve · Current source | interactions · transfer · desktop · cold · none · instrumented | Incomplete responses | 10 | 10 |
| Fluent · Web Components | interactions · canvas-landscape-first · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Fluent · Web Components | interactions · canvas-landscape-first · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Web Components | interactions · canvas-landscape-first · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Web Components | interactions · canvas-landscape-first · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · canvas-landscape-first · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · canvas-landscape-first · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Current source | interactions · canvas-landscape-first · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Current source | interactions · canvas-landscape-first · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Fluent · Web Components | interactions · canvas-portrait-first · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Fluent · Web Components | interactions · canvas-portrait-first · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Web Components | interactions · canvas-portrait-first · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Web Components | interactions · canvas-portrait-first · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · canvas-portrait-first · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · canvas-portrait-first · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Current source | interactions · canvas-portrait-first · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Current source | interactions · canvas-portrait-first · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Fluent · Web Components | interactions · asset-add-first · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Fluent · Web Components | interactions · asset-add-first · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Web Components | interactions · asset-add-first · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Web Components | interactions · asset-add-first · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · asset-add-first · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · asset-add-first · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Current source | interactions · asset-add-first · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Current source | interactions · asset-add-first · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Fluent · Web Components | interactions · asset-reset-first · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Fluent · Web Components | interactions · asset-reset-first · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Web Components | interactions · asset-reset-first · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Web Components | interactions · asset-reset-first · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · asset-reset-first · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · asset-reset-first · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Current source | interactions · asset-reset-first · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Current source | interactions · asset-reset-first · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Fluent · Web Components | interactions · dialog-open-first · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Fluent · Web Components | interactions · dialog-open-first · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Web Components | interactions · dialog-open-first · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Web Components | interactions · dialog-open-first · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · dialog-open-first · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · dialog-open-first · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Current source | interactions · dialog-open-first · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Current source | interactions · dialog-open-first · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Fluent · Web Components | interactions · canvas-landscape-warm · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Fluent · Web Components | interactions · canvas-landscape-warm · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Web Components | interactions · canvas-landscape-warm · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Web Components | interactions · canvas-landscape-warm · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · canvas-landscape-warm · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · canvas-landscape-warm · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Current source | interactions · canvas-landscape-warm · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Current source | interactions · canvas-landscape-warm · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Fluent · Web Components | interactions · canvas-portrait-warm · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Fluent · Web Components | interactions · canvas-portrait-warm · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Web Components | interactions · canvas-portrait-warm · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Web Components | interactions · canvas-portrait-warm · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · canvas-portrait-warm · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · canvas-portrait-warm · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Current source | interactions · canvas-portrait-warm · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Current source | interactions · canvas-portrait-warm · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Fluent · Web Components | interactions · asset-add-warm · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Fluent · Web Components | interactions · asset-add-warm · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Web Components | interactions · asset-add-warm · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Web Components | interactions · asset-add-warm · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · asset-add-warm · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · asset-add-warm · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Current source | interactions · asset-add-warm · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Current source | interactions · asset-add-warm · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Fluent · Web Components | interactions · asset-reset-warm · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Fluent · Web Components | interactions · asset-reset-warm · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Web Components | interactions · asset-reset-warm · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Web Components | interactions · asset-reset-warm · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · asset-reset-warm · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · asset-reset-warm · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Current source | interactions · asset-reset-warm · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Current source | interactions · asset-reset-warm · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Fluent · Web Components | interactions · dialog-open-warm · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Fluent · Web Components | interactions · dialog-open-warm · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Web Components | interactions · dialog-open-warm · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Web Components | interactions · dialog-open-warm · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · dialog-open-warm · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · dialog-open-warm · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Current source | interactions · dialog-open-warm · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Current source | interactions · dialog-open-warm · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Fluent · Web Components | interactions · review-submit · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Fluent · Web Components | interactions · review-submit · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Web Components | interactions · review-submit · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Web Components | interactions · review-submit · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · review-submit · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · review-submit · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Current source | interactions · review-submit · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Current source | interactions · review-submit · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Fluent · Web Components | interactions · commands-first · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Fluent · Web Components | interactions · commands-first · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Web Components | interactions · commands-first · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Web Components | interactions · commands-first · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · commands-first · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| Web Awesome · Web Components | interactions · commands-first · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Current source | interactions · commands-first · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Current source | interactions · commands-first · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| Fluent · Web Components | diagnostic · thread · desktop · cold · none · instrumented | Script ms | 1 | 1 |
| Fluent · Web Components | diagnostic · thread · desktop · cold · none · instrumented | Style ms | 1 | 1 |
| Fluent · Web Components | diagnostic · thread · desktop · cold · none · instrumented | Layout ms | 1 | 1 |
| Fluent · Web Components | diagnostic · thread · desktop · cold · none · instrumented | Task ms | 1 | 1 |
| Fluent · Web Components | diagnostic · thread · desktop · cold · none · instrumented | Layout passes | 1 | 1 |
| Fluent · Web Components | diagnostic · thread · desktop · cold · none · instrumented | Style recalcs | 1 | 1 |
| Fluent · Web Components | diagnostic · thread · desktop · cold · none · instrumented | Long tasks ms | 1 | 1 |
| Fluent · Web Components | diagnostic · thread · desktop · cold · none · instrumented | Pre-FCP blocking excess ms | 1 | 1 |
| Fluent · Web Components | diagnostic · thread · desktop · cold · none · instrumented | Post-FCP blocking excess ms | 1 | 1 |
| Fluent · Web Components | diagnostic · thread · desktop · cold · none · instrumented | Long animation frames ms | 1 | 1 |
| En Reve · Web Components | diagnostic · thread · desktop · cold · none · instrumented | Script ms | 1 | 1 |
| En Reve · Web Components | diagnostic · thread · desktop · cold · none · instrumented | Style ms | 1 | 1 |
| En Reve · Web Components | diagnostic · thread · desktop · cold · none · instrumented | Layout ms | 1 | 1 |
| En Reve · Web Components | diagnostic · thread · desktop · cold · none · instrumented | Task ms | 1 | 1 |
| En Reve · Web Components | diagnostic · thread · desktop · cold · none · instrumented | Layout passes | 1 | 1 |
| En Reve · Web Components | diagnostic · thread · desktop · cold · none · instrumented | Style recalcs | 1 | 1 |
| En Reve · Web Components | diagnostic · thread · desktop · cold · none · instrumented | Long tasks ms | 1 | 1 |
| En Reve · Web Components | diagnostic · thread · desktop · cold · none · instrumented | Pre-FCP blocking excess ms | 1 | 1 |
| En Reve · Web Components | diagnostic · thread · desktop · cold · none · instrumented | Post-FCP blocking excess ms | 1 | 1 |
| En Reve · Web Components | diagnostic · thread · desktop · cold · none · instrumented | Long animation frames ms | 1 | 1 |
| Web Awesome · Web Components | diagnostic · thread · desktop · cold · none · instrumented | Script ms | 1 | 1 |
| Web Awesome · Web Components | diagnostic · thread · desktop · cold · none · instrumented | Style ms | 1 | 1 |
| Web Awesome · Web Components | diagnostic · thread · desktop · cold · none · instrumented | Layout ms | 1 | 1 |
| Web Awesome · Web Components | diagnostic · thread · desktop · cold · none · instrumented | Task ms | 1 | 1 |
| Web Awesome · Web Components | diagnostic · thread · desktop · cold · none · instrumented | Layout passes | 1 | 1 |
| Web Awesome · Web Components | diagnostic · thread · desktop · cold · none · instrumented | Style recalcs | 1 | 1 |
| Web Awesome · Web Components | diagnostic · thread · desktop · cold · none · instrumented | Long tasks ms | 1 | 1 |
| Web Awesome · Web Components | diagnostic · thread · desktop · cold · none · instrumented | Pre-FCP blocking excess ms | 1 | 1 |
| Web Awesome · Web Components | diagnostic · thread · desktop · cold · none · instrumented | Post-FCP blocking excess ms | 1 | 1 |
| Web Awesome · Web Components | diagnostic · thread · desktop · cold · none · instrumented | Long animation frames ms | 1 | 1 |
| En Reve · Current source | diagnostic · thread · desktop · cold · none · instrumented | Script ms | 1 | 1 |
| En Reve · Current source | diagnostic · thread · desktop · cold · none · instrumented | Style ms | 1 | 1 |
| En Reve · Current source | diagnostic · thread · desktop · cold · none · instrumented | Layout ms | 1 | 1 |
| En Reve · Current source | diagnostic · thread · desktop · cold · none · instrumented | Task ms | 1 | 1 |
| En Reve · Current source | diagnostic · thread · desktop · cold · none · instrumented | Layout passes | 1 | 1 |
| En Reve · Current source | diagnostic · thread · desktop · cold · none · instrumented | Style recalcs | 1 | 1 |
| En Reve · Current source | diagnostic · thread · desktop · cold · none · instrumented | Long tasks ms | 1 | 1 |
| En Reve · Current source | diagnostic · thread · desktop · cold · none · instrumented | Pre-FCP blocking excess ms | 1 | 1 |
| En Reve · Current source | diagnostic · thread · desktop · cold · none · instrumented | Post-FCP blocking excess ms | 1 | 1 |
| En Reve · Current source | diagnostic · thread · desktop · cold · none · instrumented | Long animation frames ms | 1 | 1 |
| Fluent · Web Components | diagnostic · Connected DOM and styles · desktop · cold · none · instrumented | connectedNodes | 1 | 1 |
| Fluent · Web Components | diagnostic · Connected DOM and styles · desktop · cold · none · instrumented | connectedElements | 1 | 1 |
| Fluent · Web Components | diagnostic · Connected DOM and styles · desktop · cold · none · instrumented | openShadowRoots | 1 | 1 |
| Fluent · Web Components | diagnostic · Connected DOM and styles · desktop · cold · none · instrumented | styleElements | 1 | 1 |
| Fluent · Web Components | diagnostic · Connected DOM and styles · desktop · cold · none · instrumented | stylesheetAdoptions | 1 | 1 |
| Fluent · Web Components | diagnostic · Connected DOM and styles · desktop · cold · none · instrumented | uniqueAdoptedStylesheets | 1 | 1 |
| En Reve · Web Components | diagnostic · Connected DOM and styles · desktop · cold · none · instrumented | connectedNodes | 1 | 1 |
| En Reve · Web Components | diagnostic · Connected DOM and styles · desktop · cold · none · instrumented | connectedElements | 1 | 1 |
| En Reve · Web Components | diagnostic · Connected DOM and styles · desktop · cold · none · instrumented | openShadowRoots | 1 | 1 |
| En Reve · Web Components | diagnostic · Connected DOM and styles · desktop · cold · none · instrumented | styleElements | 1 | 1 |
| En Reve · Web Components | diagnostic · Connected DOM and styles · desktop · cold · none · instrumented | stylesheetAdoptions | 1 | 1 |
| En Reve · Web Components | diagnostic · Connected DOM and styles · desktop · cold · none · instrumented | uniqueAdoptedStylesheets | 1 | 1 |
| Web Awesome · Web Components | diagnostic · Connected DOM and styles · desktop · cold · none · instrumented | connectedNodes | 1 | 1 |
| Web Awesome · Web Components | diagnostic · Connected DOM and styles · desktop · cold · none · instrumented | connectedElements | 1 | 1 |
| Web Awesome · Web Components | diagnostic · Connected DOM and styles · desktop · cold · none · instrumented | openShadowRoots | 1 | 1 |
| Web Awesome · Web Components | diagnostic · Connected DOM and styles · desktop · cold · none · instrumented | styleElements | 1 | 1 |
| Web Awesome · Web Components | diagnostic · Connected DOM and styles · desktop · cold · none · instrumented | stylesheetAdoptions | 1 | 1 |
| Web Awesome · Web Components | diagnostic · Connected DOM and styles · desktop · cold · none · instrumented | uniqueAdoptedStylesheets | 1 | 1 |
| En Reve · Current source | diagnostic · Connected DOM and styles · desktop · cold · none · instrumented | connectedNodes | 1 | 1 |
| En Reve · Current source | diagnostic · Connected DOM and styles · desktop · cold · none · instrumented | connectedElements | 1 | 1 |
| En Reve · Current source | diagnostic · Connected DOM and styles · desktop · cold · none · instrumented | openShadowRoots | 1 | 1 |
| En Reve · Current source | diagnostic · Connected DOM and styles · desktop · cold · none · instrumented | styleElements | 1 | 1 |
| En Reve · Current source | diagnostic · Connected DOM and styles · desktop · cold · none · instrumented | stylesheetAdoptions | 1 | 1 |
| En Reve · Current source | diagnostic · Connected DOM and styles · desktop · cold · none · instrumented | uniqueAdoptedStylesheets | 1 | 1 |
| Fluent · Web Components | lighthouse · lighthouse · mobile · cold · none · instrumented | FCP ms | 5 | 5 |
| Fluent · Web Components | lighthouse · lighthouse · mobile · cold · none · instrumented | LCP ms | 5 | 5 |
| Fluent · Web Components | lighthouse · lighthouse · mobile · cold · none · instrumented | LCP p75 ms | 5 | 5 |
| Fluent · Web Components | lighthouse · lighthouse · mobile · cold · none · instrumented | LCP max ms | 5 | 5 |
| Fluent · Web Components | lighthouse · lighthouse · mobile · cold · none · instrumented | TBT ms | 5 | 5 |
| Fluent · Web Components | lighthouse · lighthouse · mobile · cold · none · instrumented | TBT p75 ms | 5 | 5 |
| Fluent · Web Components | lighthouse · lighthouse · mobile · cold · none · instrumented | TBT max ms | 5 | 5 |
| Fluent · Web Components | lighthouse · lighthouse · mobile · cold · none · instrumented | Speed Index ms | 5 | 5 |
| Fluent · Web Components | lighthouse · lighthouse · mobile · cold · none · instrumented | CLS | 5 | 5 |
| En Reve · Web Components | lighthouse · lighthouse · mobile · cold · none · instrumented | FCP ms | 5 | 5 |
| En Reve · Web Components | lighthouse · lighthouse · mobile · cold · none · instrumented | LCP ms | 5 | 5 |
| En Reve · Web Components | lighthouse · lighthouse · mobile · cold · none · instrumented | LCP p75 ms | 5 | 5 |
| En Reve · Web Components | lighthouse · lighthouse · mobile · cold · none · instrumented | LCP max ms | 5 | 5 |
| En Reve · Web Components | lighthouse · lighthouse · mobile · cold · none · instrumented | TBT ms | 5 | 5 |
| En Reve · Web Components | lighthouse · lighthouse · mobile · cold · none · instrumented | TBT p75 ms | 5 | 5 |
| En Reve · Web Components | lighthouse · lighthouse · mobile · cold · none · instrumented | TBT max ms | 5 | 5 |
| En Reve · Web Components | lighthouse · lighthouse · mobile · cold · none · instrumented | Speed Index ms | 5 | 5 |
| En Reve · Web Components | lighthouse · lighthouse · mobile · cold · none · instrumented | CLS | 5 | 5 |
| Web Awesome · Web Components | lighthouse · lighthouse · mobile · cold · none · instrumented | FCP ms | 5 | 5 |
| Web Awesome · Web Components | lighthouse · lighthouse · mobile · cold · none · instrumented | LCP ms | 5 | 5 |
| Web Awesome · Web Components | lighthouse · lighthouse · mobile · cold · none · instrumented | LCP p75 ms | 5 | 5 |
| Web Awesome · Web Components | lighthouse · lighthouse · mobile · cold · none · instrumented | LCP max ms | 5 | 5 |
| Web Awesome · Web Components | lighthouse · lighthouse · mobile · cold · none · instrumented | TBT ms | 5 | 5 |
| Web Awesome · Web Components | lighthouse · lighthouse · mobile · cold · none · instrumented | TBT p75 ms | 5 | 5 |
| Web Awesome · Web Components | lighthouse · lighthouse · mobile · cold · none · instrumented | TBT max ms | 5 | 5 |
| Web Awesome · Web Components | lighthouse · lighthouse · mobile · cold · none · instrumented | Speed Index ms | 5 | 5 |
| Web Awesome · Web Components | lighthouse · lighthouse · mobile · cold · none · instrumented | CLS | 5 | 5 |
| En Reve · Current source | lighthouse · lighthouse · mobile · cold · none · instrumented | FCP ms | 5 | 5 |
| En Reve · Current source | lighthouse · lighthouse · mobile · cold · none · instrumented | LCP ms | 5 | 5 |
| En Reve · Current source | lighthouse · lighthouse · mobile · cold · none · instrumented | LCP p75 ms | 5 | 5 |
| En Reve · Current source | lighthouse · lighthouse · mobile · cold · none · instrumented | LCP max ms | 5 | 5 |
| En Reve · Current source | lighthouse · lighthouse · mobile · cold · none · instrumented | TBT ms | 5 | 5 |
| En Reve · Current source | lighthouse · lighthouse · mobile · cold · none · instrumented | TBT p75 ms | 5 | 5 |
| En Reve · Current source | lighthouse · lighthouse · mobile · cold · none · instrumented | TBT max ms | 5 | 5 |
| En Reve · Current source | lighthouse · lighthouse · mobile · cold · none · instrumented | Speed Index ms | 5 | 5 |
| En Reve · Current source | lighthouse · lighthouse · mobile · cold · none · instrumented | CLS | 5 | 5 |
| Fluent · Web Components | overhead · thread · desktop · cold · none · instrumented | Script ms | 5 | 5 |
| Fluent · Web Components | overhead · thread · desktop · cold · none · instrumented | Style ms | 5 | 5 |
| Fluent · Web Components | overhead · thread · desktop · cold · none · instrumented | Layout ms | 5 | 5 |
| Fluent · Web Components | overhead · thread · desktop · cold · none · instrumented | Task ms | 5 | 5 |
| Fluent · Web Components | overhead · thread · desktop · cold · none · instrumented | Layout passes | 5 | 5 |
| Fluent · Web Components | overhead · thread · desktop · cold · none · instrumented | Style recalcs | 5 | 5 |
| Fluent · Web Components | overhead · thread · desktop · cold · none · instrumented | Long tasks ms | 5 | 5 |
| Fluent · Web Components | overhead · thread · desktop · cold · none · instrumented | Pre-FCP blocking excess ms | 5 | 5 |
| Fluent · Web Components | overhead · thread · desktop · cold · none · instrumented | Post-FCP blocking excess ms | 5 | 5 |
| Fluent · Web Components | overhead · thread · desktop · cold · none · instrumented | Long animation frames ms | 5 | 5 |
| En Reve · Web Components | overhead · thread · desktop · cold · none · instrumented | Script ms | 5 | 5 |
| En Reve · Web Components | overhead · thread · desktop · cold · none · instrumented | Style ms | 5 | 5 |
| En Reve · Web Components | overhead · thread · desktop · cold · none · instrumented | Layout ms | 5 | 5 |
| En Reve · Web Components | overhead · thread · desktop · cold · none · instrumented | Task ms | 5 | 5 |
| En Reve · Web Components | overhead · thread · desktop · cold · none · instrumented | Layout passes | 5 | 5 |
| En Reve · Web Components | overhead · thread · desktop · cold · none · instrumented | Style recalcs | 5 | 5 |
| En Reve · Web Components | overhead · thread · desktop · cold · none · instrumented | Long tasks ms | 5 | 5 |
| En Reve · Web Components | overhead · thread · desktop · cold · none · instrumented | Pre-FCP blocking excess ms | 5 | 5 |
| En Reve · Web Components | overhead · thread · desktop · cold · none · instrumented | Post-FCP blocking excess ms | 5 | 5 |
| En Reve · Web Components | overhead · thread · desktop · cold · none · instrumented | Long animation frames ms | 5 | 5 |
| Web Awesome · Web Components | overhead · thread · desktop · cold · none · instrumented | Script ms | 5 | 5 |
| Web Awesome · Web Components | overhead · thread · desktop · cold · none · instrumented | Style ms | 5 | 5 |
| Web Awesome · Web Components | overhead · thread · desktop · cold · none · instrumented | Layout ms | 5 | 5 |
| Web Awesome · Web Components | overhead · thread · desktop · cold · none · instrumented | Task ms | 5 | 5 |
| Web Awesome · Web Components | overhead · thread · desktop · cold · none · instrumented | Layout passes | 5 | 5 |
| Web Awesome · Web Components | overhead · thread · desktop · cold · none · instrumented | Style recalcs | 5 | 5 |
| Web Awesome · Web Components | overhead · thread · desktop · cold · none · instrumented | Long tasks ms | 5 | 5 |
| Web Awesome · Web Components | overhead · thread · desktop · cold · none · instrumented | Pre-FCP blocking excess ms | 5 | 5 |
| Web Awesome · Web Components | overhead · thread · desktop · cold · none · instrumented | Post-FCP blocking excess ms | 5 | 5 |
| Web Awesome · Web Components | overhead · thread · desktop · cold · none · instrumented | Long animation frames ms | 5 | 5 |
| En Reve · Current source | overhead · thread · desktop · cold · none · instrumented | Script ms | 5 | 5 |
| En Reve · Current source | overhead · thread · desktop · cold · none · instrumented | Style ms | 5 | 5 |
| En Reve · Current source | overhead · thread · desktop · cold · none · instrumented | Layout ms | 5 | 5 |
| En Reve · Current source | overhead · thread · desktop · cold · none · instrumented | Task ms | 5 | 5 |
| En Reve · Current source | overhead · thread · desktop · cold · none · instrumented | Layout passes | 5 | 5 |
| En Reve · Current source | overhead · thread · desktop · cold · none · instrumented | Style recalcs | 5 | 5 |
| En Reve · Current source | overhead · thread · desktop · cold · none · instrumented | Long tasks ms | 5 | 5 |
| En Reve · Current source | overhead · thread · desktop · cold · none · instrumented | Pre-FCP blocking excess ms | 5 | 5 |
| En Reve · Current source | overhead · thread · desktop · cold · none · instrumented | Post-FCP blocking excess ms | 5 | 5 |
| En Reve · Current source | overhead · thread · desktop · cold · none · instrumented | Long animation frames ms | 5 | 5 |
| Fluent · Web Components | overhead · thread · desktop · cold · none · uninstrumented | Script ms | 5 | 5 |
| Fluent · Web Components | overhead · thread · desktop · cold · none · uninstrumented | Style ms | 5 | 5 |
| Fluent · Web Components | overhead · thread · desktop · cold · none · uninstrumented | Layout ms | 5 | 5 |
| Fluent · Web Components | overhead · thread · desktop · cold · none · uninstrumented | Task ms | 5 | 5 |
| Fluent · Web Components | overhead · thread · desktop · cold · none · uninstrumented | Layout passes | 5 | 5 |
| Fluent · Web Components | overhead · thread · desktop · cold · none · uninstrumented | Style recalcs | 5 | 5 |
| Fluent · Web Components | overhead · thread · desktop · cold · none · uninstrumented | Long tasks ms | 0 | 5 |
| Fluent · Web Components | overhead · thread · desktop · cold · none · uninstrumented | Pre-FCP blocking excess ms | 0 | 5 |
| Fluent · Web Components | overhead · thread · desktop · cold · none · uninstrumented | Post-FCP blocking excess ms | 0 | 5 |
| Fluent · Web Components | overhead · thread · desktop · cold · none · uninstrumented | Long animation frames ms | 0 | 5 |
| En Reve · Web Components | overhead · thread · desktop · cold · none · uninstrumented | Script ms | 5 | 5 |
| En Reve · Web Components | overhead · thread · desktop · cold · none · uninstrumented | Style ms | 5 | 5 |
| En Reve · Web Components | overhead · thread · desktop · cold · none · uninstrumented | Layout ms | 5 | 5 |
| En Reve · Web Components | overhead · thread · desktop · cold · none · uninstrumented | Task ms | 5 | 5 |
| En Reve · Web Components | overhead · thread · desktop · cold · none · uninstrumented | Layout passes | 5 | 5 |
| En Reve · Web Components | overhead · thread · desktop · cold · none · uninstrumented | Style recalcs | 5 | 5 |
| En Reve · Web Components | overhead · thread · desktop · cold · none · uninstrumented | Long tasks ms | 0 | 5 |
| En Reve · Web Components | overhead · thread · desktop · cold · none · uninstrumented | Pre-FCP blocking excess ms | 0 | 5 |
| En Reve · Web Components | overhead · thread · desktop · cold · none · uninstrumented | Post-FCP blocking excess ms | 0 | 5 |
| En Reve · Web Components | overhead · thread · desktop · cold · none · uninstrumented | Long animation frames ms | 0 | 5 |
| Web Awesome · Web Components | overhead · thread · desktop · cold · none · uninstrumented | Script ms | 5 | 5 |
| Web Awesome · Web Components | overhead · thread · desktop · cold · none · uninstrumented | Style ms | 5 | 5 |
| Web Awesome · Web Components | overhead · thread · desktop · cold · none · uninstrumented | Layout ms | 5 | 5 |
| Web Awesome · Web Components | overhead · thread · desktop · cold · none · uninstrumented | Task ms | 5 | 5 |
| Web Awesome · Web Components | overhead · thread · desktop · cold · none · uninstrumented | Layout passes | 5 | 5 |
| Web Awesome · Web Components | overhead · thread · desktop · cold · none · uninstrumented | Style recalcs | 5 | 5 |
| Web Awesome · Web Components | overhead · thread · desktop · cold · none · uninstrumented | Long tasks ms | 0 | 5 |
| Web Awesome · Web Components | overhead · thread · desktop · cold · none · uninstrumented | Pre-FCP blocking excess ms | 0 | 5 |
| Web Awesome · Web Components | overhead · thread · desktop · cold · none · uninstrumented | Post-FCP blocking excess ms | 0 | 5 |
| Web Awesome · Web Components | overhead · thread · desktop · cold · none · uninstrumented | Long animation frames ms | 0 | 5 |
| En Reve · Current source | overhead · thread · desktop · cold · none · uninstrumented | Script ms | 5 | 5 |
| En Reve · Current source | overhead · thread · desktop · cold · none · uninstrumented | Style ms | 5 | 5 |
| En Reve · Current source | overhead · thread · desktop · cold · none · uninstrumented | Layout ms | 5 | 5 |
| En Reve · Current source | overhead · thread · desktop · cold · none · uninstrumented | Task ms | 5 | 5 |
| En Reve · Current source | overhead · thread · desktop · cold · none · uninstrumented | Layout passes | 5 | 5 |
| En Reve · Current source | overhead · thread · desktop · cold · none · uninstrumented | Style recalcs | 5 | 5 |
| En Reve · Current source | overhead · thread · desktop · cold · none · uninstrumented | Long tasks ms | 0 | 5 |
| En Reve · Current source | overhead · thread · desktop · cold · none · uninstrumented | Pre-FCP blocking excess ms | 0 | 5 |
| En Reve · Current source | overhead · thread · desktop · cold · none · uninstrumented | Post-FCP blocking excess ms | 0 | 5 |
| En Reve · Current source | overhead · thread · desktop · cold · none · uninstrumented | Long animation frames ms | 0 | 5 |
