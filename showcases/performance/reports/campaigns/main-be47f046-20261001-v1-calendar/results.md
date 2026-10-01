# Performance campaign main-be47f046-20261001-v1-calendar

Campaign status: **complete**.  Dates are UTC measurement dates. Rebuilding this report does not change them.

This is exploratory laboratory evidence, not field Core Web Vitals, a physical mobile device, manual accessibility acceptance, or a promoted regression baseline. First-input delay is a scripted legacy diagnostic; scripted INP describes only these journeys. Lighthouse TBT stays separate from observed long-task blocking excess.

Profiles and requested throttling: {"desktop":{"viewport":{"width":1500,"height":1100},"deviceScaleFactor":1,"cpuRate":1,"latency":0,"download":-1,"upload":-1,"description":"Desktop loopback; no simulated throttling"},"mobile":{"viewport":{"width":390,"height":844},"deviceScaleFactor":1,"cpuRate":4,"latency":100,"download":1000000,"upload":250000,"description":"Mobile viewport, 4x CPU slowdown, 100ms RTT, 8Mbps down/2Mbps up; emulation, not physical hardware"}}

[Campaign configuration](campaign.json) · [Stage outcomes](state.json) · [Metric availability and tables](tables.json)

## First reference comparison

All emitted/minified uncompressed JS and compressed artifact sizes; source maps excluded. These are build sizes, not actual response bytes or decoded runtime memory.

| Implementation | Build fingerprint | All JS KiB | All JS gzip KiB | All JS Brotli KiB | HTML KiB | CSS Brotli KiB | JS chunks | Dynamic imports |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | f28ce504edf08abdd6aea649060148a8c333e3c7092c7dd91e06112d7c188dd6 | 445.0 | 109.9 | 88.2 | 0.4 | 5.9 | 1 | 0 |
| En Reve · Deferred construction | dbc45425cd7a6e3524c8367584121a129516579346b3fde7d851282776df3bda | 445.1 | 109.9 | 88.1 | 0.4 | 5.9 | 1 | 0 |
| En Reve · Deferred code + construction | ef86738813661bf1edb8c77e30cf747aff0f11b9bd7c405244ad79dcbe744ec1 | 447.2 | 111.6 | 90.3 | 0.4 | 5.9 | 2 | 1 |

## Production payload sizes

Offline gzip9/Brotli11 sizes. Initial assets follow HTML/static imports; source maps excluded. Date identifies the measurement cohort, not an invented build date.

| Implementation | Run ID | Date (UTC) | JS raw KiB | JS gzip KiB | JS Brotli KiB | Initial JS Brotli KiB | CSS raw KiB | CSS Brotli KiB | Local fonts Brotli KiB | HTML raw KiB | HTML Brotli KiB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar | 2026-10-01 | 445.0 | 109.9 | 88.2 | 88.2 | 43.5 | 5.9 | 0.0 | 0.4 | 0.2 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar | 2026-10-01 | 445.1 | 109.9 | 88.1 | 88.1 | 43.5 | 5.9 | 0.0 | 0.4 | 0.2 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar | 2026-10-01 | 447.2 | 111.6 | 90.3 | 85.3 | 43.5 | 5.9 | 0.0 | 0.4 | 0.2 |

## Chunk structure

Static import reachability from the production entry; actual requested bytes remain in transfer tables.

| Implementation | Run ID | Date (UTC) | JS files | CSS files | Static initial assets | Dynamic import edges |
| --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar | 2026-10-01 | 1 | 1 | 2 | 0 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar | 2026-10-01 | 1 | 1 | 2 | 0 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar | 2026-10-01 | 2 | 1 | 2 | 1 |

## Acquisition coverage

Missing and failed samples remain visible. This report can be regenerated from archived raw data without starting a browser.

| Run ID | Date (UTC) | Status | Planned n | Recorded n | Successful n | Failed n |
| --- | --- | --- | --- | --- | --- | --- |
| main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | complete | 383 | 383 | 383 | 0 |
| main-be47f046-20261001-v1-calendar-lighthouse | 2026-10-01 | complete | 15 | 15 | 15 | 0 |

## load · loading · desktop · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | FCP ms | LCP ms | LCP p75 ms | CLS | CLS p75 | CLS max | TTFB ms | Cards frame opportunity ms | Last webfont response ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 104.0 | 104.0 | 107.0 | 0.000000 | 0.000000 | 0.000000 | 15.5 | 91.3 | — |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 108.0 | 108.0 | 112.0 | 0.000000 | 0.000000 | 0.000000 | 17.5 | 94.4 | — |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 102.0 | 102.0 | 108.0 | 0.000000 | 0.000000 | 0.000000 | 15.8 | 89.3 | — |

## load · lcp · desktop · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | TTFB portion ms | Resource delay ms | Resource duration ms | Element render delay ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 15.5 | 0.0 | 0.0 | 89.3 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 17.5 | 0.0 | 0.0 | 89.7 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 15.8 | 0.0 | 0.0 | 84.9 |

## load · transfer · desktop · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 94.7 | 0.326 | 88.3 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 94.7 | 0.327 | 88.3 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 91.8 | 0.328 | 85.4 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |

## load · thread · desktop · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Script ms | Style ms | Layout ms | Task ms | Layout passes | Style recalcs | Long tasks ms | Pre-FCP blocking excess ms | Post-FCP blocking excess ms | Long animation frames ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 18.1 | 12.9 | 6.6 | 81.6 | 7 | 11 | 60.5 | 10.5 | 0.0 | 62.6 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 18.5 | 13.4 | 6.6 | 82.5 | 7 | 11 | 59.5 | 9.5 | 0.0 | 61.2 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 18.2 | 12.9 | 6.6 | 79.2 | 7 | 11 | 57.0 | 7.0 | 0.0 | 59.1 |

## load · loading · desktop · warm · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | FCP ms | LCP ms | LCP p75 ms | CLS | CLS p75 | CLS max | TTFB ms | Cards frame opportunity ms | Last webfont response ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 48.0 | 48.0 | 48.0 | 0.000000 | 0.000000 | 0.000000 | 0.8 | 45.0 | — |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 44.0 | 44.0 | 44.0 | 0.000000 | 0.000000 | 0.000000 | 0.8 | 42.5 | — |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 44.0 | 44.0 | 47.0 | 0.000000 | 0.000000 | 0.000000 | 0.9 | 42.6 | — |

## load · lcp · desktop · warm · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | TTFB portion ms | Resource delay ms | Resource duration ms | Element render delay ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 0.8 | 0.0 | 0.0 | 47.2 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 0.8 | 0.0 | 0.0 | 43.3 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 0.9 | 0.0 | 0.0 | 43.2 |

## load · transfer · desktop · warm · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 0.2 | 0.244 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 0.2 | 0.245 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 0.2 | 0.246 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |

## load · thread · desktop · warm · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Script ms | Style ms | Layout ms | Task ms | Layout passes | Style recalcs | Long tasks ms | Pre-FCP blocking excess ms | Post-FCP blocking excess ms | Long animation frames ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 12.3 | 9.2 | 3.3 | 53.8 | 6 | 10 | 0.0 | 0.0 | 0.0 | 0.0 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 12.1 | 8.8 | 3.2 | 52.2 | 6 | 10 | 0.0 | 0.0 | 0.0 | 0.0 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 11.8 | 8.9 | 3.3 | 52.1 | 6 | 10 | 0.0 | 0.0 | 0.0 | 0.0 |

## load · loading · mobile · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | FCP ms | LCP ms | LCP p75 ms | CLS | CLS p75 | CLS max | TTFB ms | Cards frame opportunity ms | Last webfont response ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 676.0 | 676.0 | 683.0 | 0.000000 | 0.000000 | 0.000000 | 16.0 | 671.7 | — |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 666.0 | 666.0 | 674.0 | 0.000000 | 0.000000 | 0.000000 | 16.4 | 661.9 | — |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 664.0 | 664.0 | 680.0 | 0.000000 | 0.000000 | 0.000000 | 16.0 | 658.7 | — |

## load · lcp · mobile · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | TTFB portion ms | Resource delay ms | Resource duration ms | Element render delay ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 16.0 | 0.0 | 0.0 | 654.2 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 16.4 | 0.0 | 0.0 | 638.2 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 16.0 | 0.0 | 0.0 | 643.1 |

## load · transfer · mobile · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 94.7 | 0.326 | 88.3 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 94.7 | 0.327 | 88.3 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 91.8 | 0.328 | 85.4 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |

## load · thread · mobile · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Script ms | Style ms | Layout ms | Task ms | Layout passes | Style recalcs | Long tasks ms | Pre-FCP blocking excess ms | Post-FCP blocking excess ms | Long animation frames ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 94.4 | 63.8 | 34.8 | 398.6 | 7 | 11 | 310.0 | 260.0 | 0.0 | 433.2 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 89.5 | 61.6 | 34.1 | 381.5 | 7 | 11 | 289.5 | 239.5 | 0.0 | 414.7 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 94.6 | 62.9 | 34.8 | 390.8 | 7 | 11 | 298.0 | 248.0 | 0.0 | 420.9 |

## load · loading · mobile · warm · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | FCP ms | LCP ms | LCP p75 ms | CLS | CLS p75 | CLS max | TTFB ms | Cards frame opportunity ms | Last webfont response ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 306.0 | 306.0 | 317.0 | 0.000000 | 0.000000 | 0.000000 | 0.8 | 317.7 | — |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 298.0 | 298.0 | 303.0 | 0.000000 | 0.000000 | 0.000000 | 0.8 | 307.3 | — |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 298.0 | 298.0 | 300.0 | 0.000000 | 0.000000 | 0.000000 | 0.8 | 306.2 | — |

## load · lcp · mobile · warm · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | TTFB portion ms | Resource delay ms | Resource duration ms | Element render delay ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 0.8 | 0.0 | 0.0 | 305.3 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 0.8 | 0.0 | 0.0 | 297.2 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 0.8 | 0.0 | 0.0 | 296.3 |

## load · transfer · mobile · warm · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 0.2 | 0.244 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 0.2 | 0.245 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 0.2 | 0.246 | 0.0 | 0.0 | 0.0 | 0.0 | 3 | 2 | 0 |

## load · thread · mobile · warm · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Script ms | Style ms | Layout ms | Task ms | Layout passes | Style recalcs | Long tasks ms | Pre-FCP blocking excess ms | Post-FCP blocking excess ms | Long animation frames ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 57.1 | 44.7 | 15.2 | 249.3 | 7 | 11 | 171.0 | 121.0 | 0.0 | 175.7 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 58.2 | 43.5 | 14.8 | 239.4 | 7 | 11 | 164.5 | 114.5 | 0.0 | 168.8 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 55.7 | 43.2 | 14.4 | 239.0 | 6 | 10 | 164.0 | 114.0 | 0.0 | 169.3 |

## startup · startup · desktop · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Control observed ms | Click from navigation ms | Result from navigation ms | Result p75 ms | Dispatch overhead ms | Discovery probe ms | Click to result ms | Click to frame ms | First input delay ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 88.8 | 95.1 | 97.5 | 98.5 | 5.8 | 0.1 | 2.1 | 30.2 | — |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 85.7 | 90.7 | 93.2 | 95.7 | 5.4 | 0.1 | 2.5 | 34.0 | — |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 85.3 | 90.9 | 93.3 | 94.6 | 5.7 | 0.1 | 2.3 | 34.7 | — |

## startup · transfer · desktop · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 94.7 | 0.326 | 88.3 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 94.7 | 0.327 | 88.3 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 91.8 | 0.328 | 85.4 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |

## interactions · interactions · desktop · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Scripted INP ms | Scripted INP p75 ms | First input delay ms | Journey CLS | Max scroll rAF gap ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 40.0 | 40.0 | 0.8 | 0.000000 | 16.8 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 40.0 | 40.0 | 0.8 | 0.000000 | 16.8 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 40.0 | 40.0 | 0.8 | 0.000000 | 16.8 |

## interactions · transfer · desktop · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 94.7 | 0.326 | 88.3 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 94.7 | 0.327 | 88.3 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 91.8 | 0.328 | 85.4 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |

## interactions · canvas-landscape-first · desktop · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 2.5 | 37.2 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 2.5 | 37.3 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 2.4 | 37.1 |

## interactions · canvas-portrait-first · desktop · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 1.7 | 32.0 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 1.8 | 31.7 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 1.7 | 31.8 |

## interactions · asset-add-first · desktop · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 2.1 | 32.0 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 2.1 | 31.8 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 2.1 | 32.0 |

## interactions · asset-reset-first · desktop · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 2.0 | 31.8 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 1.9 | 32.0 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 2.0 | 31.8 |

## interactions · dialog-open-first · desktop · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 8.9 | 31.7 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 9.0 | 31.7 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 9.0 | 31.6 |

## interactions · canvas-landscape-warm · desktop · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 1.6 | 31.8 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 1.6 | 32.2 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 1.6 | 32.0 |

## interactions · canvas-portrait-warm · desktop · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 1.6 | 32.0 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 1.7 | 32.3 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 1.8 | 32.0 |

## interactions · asset-add-warm · desktop · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 1.9 | 32.1 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 1.8 | 32.1 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 2.0 | 31.9 |

## interactions · asset-reset-warm · desktop · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 1.7 | 31.8 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 1.7 | 31.9 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 1.6 | 31.6 |

## interactions · dialog-open-warm · desktop · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 4.4 | 31.6 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 4.3 | 31.6 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 4.4 | 31.8 |

## interactions · review-submit · desktop · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 1.7 | 32.2 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 1.6 | 32.1 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 1.6 | 31.9 |

## interactions · commands-first · desktop · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 5.6 | 31.6 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 5.2 | 31.9 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 5.5 | 32.0 |

## startup · startup · mobile · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Control observed ms | Click from navigation ms | Result from navigation ms | Result p75 ms | Dispatch overhead ms | Discovery probe ms | Click to result ms | Click to frame ms | First input delay ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 648.4 | 671.6 | 684.4 | 700.4 | 19.5 | 1.0 | 11.0 | 43.0 | 3.3 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 617.3 | 635.5 | 647.0 | 655.5 | 18.8 | 0.8 | 11.1 | 42.3 | 3.8 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 620.5 | 639.9 | 652.9 | 664.4 | 19.9 | 0.9 | 12.0 | 43.0 | 3.2 |

## startup · transfer · mobile · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 94.7 | 0.326 | 88.3 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 94.7 | 0.327 | 88.3 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 91.8 | 0.328 | 85.4 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |

## interactions · interactions · mobile · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Scripted INP ms | Scripted INP p75 ms | First input delay ms | Journey CLS | Max scroll rAF gap ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 48.0 | 48.0 | 3.6 | 0.000000 | 16.8 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 52.0 | 56.0 | 3.5 | 0.000000 | 16.8 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 48.0 | 56.0 | 3.6 | 0.000000 | 16.8 |

## interactions · transfer · mobile · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 94.7 | 0.326 | 88.3 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 94.7 | 0.327 | 88.3 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 91.8 | 0.328 | 85.4 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |

## interactions · canvas-landscape-first · mobile · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 12.8 | 45.9 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 12.6 | 44.8 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 12.5 | 44.0 |

## interactions · canvas-portrait-first · mobile · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 9.2 | 29.7 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 8.9 | 29.7 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 8.7 | 29.4 |

## interactions · asset-add-first · mobile · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 11.1 | 29.3 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 10.5 | 29.4 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 10.1 | 29.5 |

## interactions · asset-reset-first · mobile · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 9.4 | 28.5 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 9.5 | 28.2 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 8.8 | 28.6 |

## interactions · dialog-open-first · mobile · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 44.1 | 49.5 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 44.6 | 49.7 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 44.0 | 49.5 |

## interactions · canvas-landscape-warm · mobile · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 8.0 | 30.0 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 7.5 | 30.2 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 7.7 | 30.1 |

## interactions · canvas-portrait-warm · mobile · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 8.8 | 30.0 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 7.8 | 30.1 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 8.4 | 30.2 |

## interactions · asset-add-warm · mobile · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 9.2 | 29.5 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 9.3 | 29.9 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 9.5 | 29.6 |

## interactions · asset-reset-warm · mobile · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 8.9 | 28.8 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 8.0 | 28.8 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 7.9 | 29.0 |

## interactions · dialog-open-warm · mobile · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 22.9 | 31.3 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 20.8 | 31.5 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 21.9 | 29.1 |

## interactions · review-submit · mobile · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 8.5 | 30.0 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 8.4 | 29.9 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 8.0 | 29.9 |

## interactions · commands-first · mobile · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | semanticMs ms | frameOpportunityMs ms |
| --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 26.3 | 35.5 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 26.9 | 36.2 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 26.9 | 35.7 |

## calendar · Calendar focus · desktop · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | First focus ms | First frame opportunity ms | Repeated focus ms | Preparation to focus ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 10.3 | 24.4 | 11.1 | — |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 13.6 | 23.8 | 11.1 | — |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 21.3 | 38.3 | 12.3 | — |

## calendar · Connected DOM with and without date · desktop · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | before total nodes | before total elements | before date nodes | before date elements | before withoutDate nodes | before withoutDate elements | opened total nodes | opened total elements | opened date nodes | opened date elements | opened withoutDate nodes | opened withoutDate elements | closed total nodes | closed total elements | closed date nodes | closed date elements | closed withoutDate nodes | closed withoutDate elements |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 4685 | 1598 | 631 | 184 | 4054 | 1414 | 4685 | 1598 | 631 | 184 | 4054 | 1414 | 4685 | 1598 | 631 | 184 | 4054 | 1414 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 4190 | 1460 | 136 | 46 | 4054 | 1414 | 4687 | 1599 | 633 | 185 | 4054 | 1414 | 4687 | 1599 | 633 | 185 | 4054 | 1414 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 4190 | 1460 | 136 | 46 | 4054 | 1414 | 4687 | 1599 | 633 | 185 | 4054 | 1414 | 4687 | 1599 | 633 | 185 | 4054 | 1414 |

## calendar · Calendar response transfer · desktop · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 94.7 | 0.326 | 88.3 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 94.7 | 0.327 | 88.3 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 96.9 | 0.328 | 90.5 | 6.1 | 0.0 | 0.0 | 4 | 0 | 0 |

## calendar · Calendar focus · mobile · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | First focus ms | First frame opportunity ms | Repeated focus ms | Preparation to focus ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 30 | 0 | 50.1 | 56.8 | 20.5 | — |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 30 | 0 | 68.7 | 75.6 | 20.4 | — |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 30 | 0 | 186.3 | 193.3 | 20.5 | — |

## calendar · Connected DOM with and without date · mobile · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | before total nodes | before total elements | before date nodes | before date elements | before withoutDate nodes | before withoutDate elements | opened total nodes | opened total elements | opened date nodes | opened date elements | opened withoutDate nodes | opened withoutDate elements | closed total nodes | closed total elements | closed date nodes | closed date elements | closed withoutDate nodes | closed withoutDate elements |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 30 | 0 | 4685 | 1598 | 631 | 184 | 4054 | 1414 | 4685 | 1598 | 631 | 184 | 4054 | 1414 | 4685 | 1598 | 631 | 184 | 4054 | 1414 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 30 | 0 | 4190 | 1460 | 136 | 46 | 4054 | 1414 | 4687 | 1599 | 633 | 185 | 4054 | 1414 | 4687 | 1599 | 633 | 185 | 4054 | 1414 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 30 | 0 | 4190 | 1460 | 136 | 46 | 4054 | 1414 | 4687 | 1599 | 633 | 185 | 4054 | 1414 | 4687 | 1599 | 633 | 185 | 4054 | 1414 |

## calendar · Calendar response transfer · mobile · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 30 | 0 | 94.7 | 0.326 | 88.3 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 30 | 0 | 94.7 | 0.327 | 88.3 | 6.1 | 0.0 | 0.0 | 3 | 0 | 0 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 30 | 0 | 96.9 | 0.328 | 90.5 | 6.1 | 0.0 | 0.0 | 4 | 0 | 0 |

## calendar · Calendar focus · mobile · cold · ready · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | First focus ms | First frame opportunity ms | Repeated focus ms | Preparation to focus ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference |  | — | 0 | 0 | — | — | — | — |
| En Reve · Deferred construction |  | — | 0 | 0 | — | — | — | — |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 71.4 | 78.1 | 21.8 | 215.6 |

## calendar · Connected DOM with and without date · mobile · cold · ready · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | before total nodes | before total elements | before date nodes | before date elements | before withoutDate nodes | before withoutDate elements | opened total nodes | opened total elements | opened date nodes | opened date elements | opened withoutDate nodes | opened withoutDate elements | closed total nodes | closed total elements | closed date nodes | closed date elements | closed withoutDate nodes | closed withoutDate elements |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference |  | — | 0 | 0 | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| En Reve · Deferred construction |  | — | 0 | 0 | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 4190 | 1460 | 136 | 46 | 4054 | 1414 | 4687 | 1599 | 633 | 185 | 4054 | 1414 | 4687 | 1599 | 633 | 185 | 4054 | 1414 |

## calendar · Calendar response transfer · mobile · cold · ready · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference |  | — | 0 | 0 | — | — | — | — | — | — | — | — | — |
| En Reve · Deferred construction |  | — | 0 | 0 | — | — | — | — | — | — | — | — | — |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 96.9 | 0.328 | 90.5 | 6.1 | 0.0 | 0.0 | 4 | 0 | 0 |

## calendar · Calendar focus · mobile · cold · pending · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | First focus ms | First frame opportunity ms | Repeated focus ms | Preparation to focus ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference |  | — | 0 | 0 | — | — | — | — |
| En Reve · Deferred construction |  | — | 0 | 0 | — | — | — | — |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 149.8 | 156.4 | 20.8 | 180.0 |

## calendar · Connected DOM with and without date · mobile · cold · pending · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | before total nodes | before total elements | before date nodes | before date elements | before withoutDate nodes | before withoutDate elements | opened total nodes | opened total elements | opened date nodes | opened date elements | opened withoutDate nodes | opened withoutDate elements | closed total nodes | closed total elements | closed date nodes | closed date elements | closed withoutDate nodes | closed withoutDate elements |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference |  | — | 0 | 0 | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| En Reve · Deferred construction |  | — | 0 | 0 | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 4190 | 1460 | 136 | 46 | 4054 | 1414 | 4687 | 1599 | 633 | 185 | 4054 | 1414 | 4687 | 1599 | 633 | 185 | 4054 | 1414 |

## calendar · Calendar response transfer · mobile · cold · pending · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | Total response KiB | HTML KiB | JS KiB | CSS KiB | Fonts KiB | Other KiB | HTTP responses | Cache reuse entries | Incomplete responses |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference |  | — | 0 | 0 | — | — | — | — | — | — | — | — | — |
| En Reve · Deferred construction |  | — | 0 | 0 | — | — | — | — | — | — | — | — | — |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 10 | 0 | 96.9 | 0.328 | 90.5 | 6.1 | 0.0 | 0.0 | 4 | 0 | 0 |

## lighthouse · lighthouse · mobile · cold · none · instrumented

Successful-sample medians unless labeled otherwise. “—” means unavailable, never zero. See metric availability for per-measurement denominators.

| Implementation | Run ID | Date (UTC) | Successful n | Failed n | FCP ms | LCP ms | LCP p75 ms | LCP max ms | TBT ms | TBT p75 ms | TBT max ms | Speed Index ms | CLS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-lighthouse | 2026-10-01 | 5 | 0 | 797.5 | 797.5 | 848.4 | 8500.0 | 0.0 | 0.0 | 0.0 | 638.0 | 0.000000 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-lighthouse | 2026-10-01 | 5 | 0 | 813.1 | 813.1 | 843.3 | 8549.2 | 0.0 | 0.0 | 0.0 | 654.0 | 0.000000 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-lighthouse | 2026-10-01 | 5 | 0 | 8409.7 | 8409.7 | 8441.0 | 8551.2 | 0.0 | 0.0 | 0.0 | 8411.0 | 0.000000 |

## Memory and retention

No forced GC. API errors/timeouts are preserved; CDP nodes include retained/detached objects and are not connected-DOM counts. These samples alone do not establish a leak.

| Implementation | Run ID | Date (UTC) | Checkpoint kind | Cycles / openings | API status | API MiB | JS heap MiB | CDP nodes | Listeners |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | Journey | 0 | ok | 6.13 | 5.52 | 6459 | 561 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | Calendar | 0 | ok | 4.97 | 4.21 | 5835 | 415 |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | Calendar | 10 | ok | 6.21 | 5.52 | 6459 | 561 |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | Journey | 0 | ok | 6.02 | 5.39 | 6453 | 560 |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | Calendar | 0 | timeout | — | 5.40 | 7200 | 547 |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | Calendar | 10 | ok | 6.10 | 5.40 | 6453 | 560 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | Journey | 0 | ok | 6.21 | 5.57 | 6459 | 561 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | Calendar | 0 | ok | 4.98 | 4.18 | 5835 | 415 |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | Calendar | 10 | timeout | — | 5.53 | 6474 | 561 |

## Memory after 0 cycles

Descriptive checkpoint readings; counts and API availability are shown. No forced GC or leak conclusion.

| Implementation | Run ID | Date (UTC) | Checkpoints n | API success n | API unavailable n | API MiB | JS heap MiB | Browser DOM nodes | Event listeners | API status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| En Reve · Eager reference | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 1 | 1 | 0 | 6.02 | 5.39 | 6453 | 560 | ok |
| En Reve · Deferred construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 1 | 1 | 0 | 6.13 | 5.52 | 6459 | 561 | ok |
| En Reve · Deferred code + construction | main-be47f046-20261001-v1-calendar-primary | 2026-10-01 | 1 | 1 | 0 | 6.21 | 5.57 | 6459 | 561 | ok |

## Paired change relative to eager

Candidate minus eager; positive means slower. Matched blocks from this campaign only. Exploratory bootstrap intervals, no multiple-comparison correction or automatic baseline promotion.

| Implementation | Profile | Metric | Paired n | Median change ms | 95% lower ms | 95% upper ms |
| --- | --- | --- | --- | --- | --- | --- |
| En Reve · Deferred construction | desktop | LCP | 10 | 4.0 | -6.0 | 12.0 |
| En Reve · Deferred code + construction | desktop | LCP | 10 | -2.0 | -12.0 | 6.0 |
| En Reve · Deferred construction | desktop | First focus | 10 | 3.3 | 0.4 | 4.3 |
| En Reve · Deferred code + construction | desktop | First focus | 10 | 11.0 | 8.2 | 12.9 |
| En Reve · Deferred construction | mobile | LCP | 10 | -10.0 | -34.0 | 52.0 |
| En Reve · Deferred code + construction | mobile | LCP | 10 | -12.0 | -28.0 | 12.0 |
| En Reve · Deferred construction | mobile | First focus | 30 | 18.6 | 16.2 | 21.3 |
| En Reve · Deferred code + construction | mobile | First focus | 30 | 136.2 | 133.5 | 138.6 |

## Metric availability

A successful sample may still have an unsupported or unavailable browser metric. Denominators are shown for every metric.

| Implementation | Table | Metric | Available n | Successful n |
| --- | --- | --- | --- | --- |
| En Reve · Eager reference | load · loading · desktop · cold · none · instrumented | FCP ms | 10 | 10 |
| En Reve · Eager reference | load · loading · desktop · cold · none · instrumented | LCP ms | 10 | 10 |
| En Reve · Eager reference | load · loading · desktop · cold · none · instrumented | LCP p75 ms | 10 | 10 |
| En Reve · Eager reference | load · loading · desktop · cold · none · instrumented | CLS | 10 | 10 |
| En Reve · Eager reference | load · loading · desktop · cold · none · instrumented | CLS p75 | 10 | 10 |
| En Reve · Eager reference | load · loading · desktop · cold · none · instrumented | CLS max | 10 | 10 |
| En Reve · Eager reference | load · loading · desktop · cold · none · instrumented | TTFB ms | 10 | 10 |
| En Reve · Eager reference | load · loading · desktop · cold · none · instrumented | Cards frame opportunity ms | 10 | 10 |
| En Reve · Eager reference | load · loading · desktop · cold · none · instrumented | Last webfont response ms | 0 | 10 |
| En Reve · Deferred construction | load · loading · desktop · cold · none · instrumented | FCP ms | 10 | 10 |
| En Reve · Deferred construction | load · loading · desktop · cold · none · instrumented | LCP ms | 10 | 10 |
| En Reve · Deferred construction | load · loading · desktop · cold · none · instrumented | LCP p75 ms | 10 | 10 |
| En Reve · Deferred construction | load · loading · desktop · cold · none · instrumented | CLS | 10 | 10 |
| En Reve · Deferred construction | load · loading · desktop · cold · none · instrumented | CLS p75 | 10 | 10 |
| En Reve · Deferred construction | load · loading · desktop · cold · none · instrumented | CLS max | 10 | 10 |
| En Reve · Deferred construction | load · loading · desktop · cold · none · instrumented | TTFB ms | 10 | 10 |
| En Reve · Deferred construction | load · loading · desktop · cold · none · instrumented | Cards frame opportunity ms | 10 | 10 |
| En Reve · Deferred construction | load · loading · desktop · cold · none · instrumented | Last webfont response ms | 0 | 10 |
| En Reve · Deferred code + construction | load · loading · desktop · cold · none · instrumented | FCP ms | 10 | 10 |
| En Reve · Deferred code + construction | load · loading · desktop · cold · none · instrumented | LCP ms | 10 | 10 |
| En Reve · Deferred code + construction | load · loading · desktop · cold · none · instrumented | LCP p75 ms | 10 | 10 |
| En Reve · Deferred code + construction | load · loading · desktop · cold · none · instrumented | CLS | 10 | 10 |
| En Reve · Deferred code + construction | load · loading · desktop · cold · none · instrumented | CLS p75 | 10 | 10 |
| En Reve · Deferred code + construction | load · loading · desktop · cold · none · instrumented | CLS max | 10 | 10 |
| En Reve · Deferred code + construction | load · loading · desktop · cold · none · instrumented | TTFB ms | 10 | 10 |
| En Reve · Deferred code + construction | load · loading · desktop · cold · none · instrumented | Cards frame opportunity ms | 10 | 10 |
| En Reve · Deferred code + construction | load · loading · desktop · cold · none · instrumented | Last webfont response ms | 0 | 10 |
| En Reve · Eager reference | load · lcp · desktop · cold · none · instrumented | TTFB portion ms | 10 | 10 |
| En Reve · Eager reference | load · lcp · desktop · cold · none · instrumented | Resource delay ms | 10 | 10 |
| En Reve · Eager reference | load · lcp · desktop · cold · none · instrumented | Resource duration ms | 10 | 10 |
| En Reve · Eager reference | load · lcp · desktop · cold · none · instrumented | Element render delay ms | 10 | 10 |
| En Reve · Deferred construction | load · lcp · desktop · cold · none · instrumented | TTFB portion ms | 10 | 10 |
| En Reve · Deferred construction | load · lcp · desktop · cold · none · instrumented | Resource delay ms | 10 | 10 |
| En Reve · Deferred construction | load · lcp · desktop · cold · none · instrumented | Resource duration ms | 10 | 10 |
| En Reve · Deferred construction | load · lcp · desktop · cold · none · instrumented | Element render delay ms | 10 | 10 |
| En Reve · Deferred code + construction | load · lcp · desktop · cold · none · instrumented | TTFB portion ms | 10 | 10 |
| En Reve · Deferred code + construction | load · lcp · desktop · cold · none · instrumented | Resource delay ms | 10 | 10 |
| En Reve · Deferred code + construction | load · lcp · desktop · cold · none · instrumented | Resource duration ms | 10 | 10 |
| En Reve · Deferred code + construction | load · lcp · desktop · cold · none · instrumented | Element render delay ms | 10 | 10 |
| En Reve · Eager reference | load · transfer · desktop · cold · none · instrumented | Total response KiB | 10 | 10 |
| En Reve · Eager reference | load · transfer · desktop · cold · none · instrumented | HTML KiB | 10 | 10 |
| En Reve · Eager reference | load · transfer · desktop · cold · none · instrumented | JS KiB | 10 | 10 |
| En Reve · Eager reference | load · transfer · desktop · cold · none · instrumented | CSS KiB | 10 | 10 |
| En Reve · Eager reference | load · transfer · desktop · cold · none · instrumented | Fonts KiB | 10 | 10 |
| En Reve · Eager reference | load · transfer · desktop · cold · none · instrumented | Other KiB | 10 | 10 |
| En Reve · Eager reference | load · transfer · desktop · cold · none · instrumented | HTTP responses | 10 | 10 |
| En Reve · Eager reference | load · transfer · desktop · cold · none · instrumented | Cache reuse entries | 10 | 10 |
| En Reve · Eager reference | load · transfer · desktop · cold · none · instrumented | Incomplete responses | 10 | 10 |
| En Reve · Deferred construction | load · transfer · desktop · cold · none · instrumented | Total response KiB | 10 | 10 |
| En Reve · Deferred construction | load · transfer · desktop · cold · none · instrumented | HTML KiB | 10 | 10 |
| En Reve · Deferred construction | load · transfer · desktop · cold · none · instrumented | JS KiB | 10 | 10 |
| En Reve · Deferred construction | load · transfer · desktop · cold · none · instrumented | CSS KiB | 10 | 10 |
| En Reve · Deferred construction | load · transfer · desktop · cold · none · instrumented | Fonts KiB | 10 | 10 |
| En Reve · Deferred construction | load · transfer · desktop · cold · none · instrumented | Other KiB | 10 | 10 |
| En Reve · Deferred construction | load · transfer · desktop · cold · none · instrumented | HTTP responses | 10 | 10 |
| En Reve · Deferred construction | load · transfer · desktop · cold · none · instrumented | Cache reuse entries | 10 | 10 |
| En Reve · Deferred construction | load · transfer · desktop · cold · none · instrumented | Incomplete responses | 10 | 10 |
| En Reve · Deferred code + construction | load · transfer · desktop · cold · none · instrumented | Total response KiB | 10 | 10 |
| En Reve · Deferred code + construction | load · transfer · desktop · cold · none · instrumented | HTML KiB | 10 | 10 |
| En Reve · Deferred code + construction | load · transfer · desktop · cold · none · instrumented | JS KiB | 10 | 10 |
| En Reve · Deferred code + construction | load · transfer · desktop · cold · none · instrumented | CSS KiB | 10 | 10 |
| En Reve · Deferred code + construction | load · transfer · desktop · cold · none · instrumented | Fonts KiB | 10 | 10 |
| En Reve · Deferred code + construction | load · transfer · desktop · cold · none · instrumented | Other KiB | 10 | 10 |
| En Reve · Deferred code + construction | load · transfer · desktop · cold · none · instrumented | HTTP responses | 10 | 10 |
| En Reve · Deferred code + construction | load · transfer · desktop · cold · none · instrumented | Cache reuse entries | 10 | 10 |
| En Reve · Deferred code + construction | load · transfer · desktop · cold · none · instrumented | Incomplete responses | 10 | 10 |
| En Reve · Eager reference | load · thread · desktop · cold · none · instrumented | Script ms | 10 | 10 |
| En Reve · Eager reference | load · thread · desktop · cold · none · instrumented | Style ms | 10 | 10 |
| En Reve · Eager reference | load · thread · desktop · cold · none · instrumented | Layout ms | 10 | 10 |
| En Reve · Eager reference | load · thread · desktop · cold · none · instrumented | Task ms | 10 | 10 |
| En Reve · Eager reference | load · thread · desktop · cold · none · instrumented | Layout passes | 10 | 10 |
| En Reve · Eager reference | load · thread · desktop · cold · none · instrumented | Style recalcs | 10 | 10 |
| En Reve · Eager reference | load · thread · desktop · cold · none · instrumented | Long tasks ms | 10 | 10 |
| En Reve · Eager reference | load · thread · desktop · cold · none · instrumented | Pre-FCP blocking excess ms | 10 | 10 |
| En Reve · Eager reference | load · thread · desktop · cold · none · instrumented | Post-FCP blocking excess ms | 10 | 10 |
| En Reve · Eager reference | load · thread · desktop · cold · none · instrumented | Long animation frames ms | 10 | 10 |
| En Reve · Deferred construction | load · thread · desktop · cold · none · instrumented | Script ms | 10 | 10 |
| En Reve · Deferred construction | load · thread · desktop · cold · none · instrumented | Style ms | 10 | 10 |
| En Reve · Deferred construction | load · thread · desktop · cold · none · instrumented | Layout ms | 10 | 10 |
| En Reve · Deferred construction | load · thread · desktop · cold · none · instrumented | Task ms | 10 | 10 |
| En Reve · Deferred construction | load · thread · desktop · cold · none · instrumented | Layout passes | 10 | 10 |
| En Reve · Deferred construction | load · thread · desktop · cold · none · instrumented | Style recalcs | 10 | 10 |
| En Reve · Deferred construction | load · thread · desktop · cold · none · instrumented | Long tasks ms | 10 | 10 |
| En Reve · Deferred construction | load · thread · desktop · cold · none · instrumented | Pre-FCP blocking excess ms | 10 | 10 |
| En Reve · Deferred construction | load · thread · desktop · cold · none · instrumented | Post-FCP blocking excess ms | 10 | 10 |
| En Reve · Deferred construction | load · thread · desktop · cold · none · instrumented | Long animation frames ms | 10 | 10 |
| En Reve · Deferred code + construction | load · thread · desktop · cold · none · instrumented | Script ms | 10 | 10 |
| En Reve · Deferred code + construction | load · thread · desktop · cold · none · instrumented | Style ms | 10 | 10 |
| En Reve · Deferred code + construction | load · thread · desktop · cold · none · instrumented | Layout ms | 10 | 10 |
| En Reve · Deferred code + construction | load · thread · desktop · cold · none · instrumented | Task ms | 10 | 10 |
| En Reve · Deferred code + construction | load · thread · desktop · cold · none · instrumented | Layout passes | 10 | 10 |
| En Reve · Deferred code + construction | load · thread · desktop · cold · none · instrumented | Style recalcs | 10 | 10 |
| En Reve · Deferred code + construction | load · thread · desktop · cold · none · instrumented | Long tasks ms | 10 | 10 |
| En Reve · Deferred code + construction | load · thread · desktop · cold · none · instrumented | Pre-FCP blocking excess ms | 10 | 10 |
| En Reve · Deferred code + construction | load · thread · desktop · cold · none · instrumented | Post-FCP blocking excess ms | 10 | 10 |
| En Reve · Deferred code + construction | load · thread · desktop · cold · none · instrumented | Long animation frames ms | 10 | 10 |
| En Reve · Eager reference | load · loading · desktop · warm · none · instrumented | FCP ms | 10 | 10 |
| En Reve · Eager reference | load · loading · desktop · warm · none · instrumented | LCP ms | 10 | 10 |
| En Reve · Eager reference | load · loading · desktop · warm · none · instrumented | LCP p75 ms | 10 | 10 |
| En Reve · Eager reference | load · loading · desktop · warm · none · instrumented | CLS | 10 | 10 |
| En Reve · Eager reference | load · loading · desktop · warm · none · instrumented | CLS p75 | 10 | 10 |
| En Reve · Eager reference | load · loading · desktop · warm · none · instrumented | CLS max | 10 | 10 |
| En Reve · Eager reference | load · loading · desktop · warm · none · instrumented | TTFB ms | 10 | 10 |
| En Reve · Eager reference | load · loading · desktop · warm · none · instrumented | Cards frame opportunity ms | 10 | 10 |
| En Reve · Eager reference | load · loading · desktop · warm · none · instrumented | Last webfont response ms | 0 | 10 |
| En Reve · Deferred construction | load · loading · desktop · warm · none · instrumented | FCP ms | 10 | 10 |
| En Reve · Deferred construction | load · loading · desktop · warm · none · instrumented | LCP ms | 10 | 10 |
| En Reve · Deferred construction | load · loading · desktop · warm · none · instrumented | LCP p75 ms | 10 | 10 |
| En Reve · Deferred construction | load · loading · desktop · warm · none · instrumented | CLS | 10 | 10 |
| En Reve · Deferred construction | load · loading · desktop · warm · none · instrumented | CLS p75 | 10 | 10 |
| En Reve · Deferred construction | load · loading · desktop · warm · none · instrumented | CLS max | 10 | 10 |
| En Reve · Deferred construction | load · loading · desktop · warm · none · instrumented | TTFB ms | 10 | 10 |
| En Reve · Deferred construction | load · loading · desktop · warm · none · instrumented | Cards frame opportunity ms | 10 | 10 |
| En Reve · Deferred construction | load · loading · desktop · warm · none · instrumented | Last webfont response ms | 0 | 10 |
| En Reve · Deferred code + construction | load · loading · desktop · warm · none · instrumented | FCP ms | 10 | 10 |
| En Reve · Deferred code + construction | load · loading · desktop · warm · none · instrumented | LCP ms | 10 | 10 |
| En Reve · Deferred code + construction | load · loading · desktop · warm · none · instrumented | LCP p75 ms | 10 | 10 |
| En Reve · Deferred code + construction | load · loading · desktop · warm · none · instrumented | CLS | 10 | 10 |
| En Reve · Deferred code + construction | load · loading · desktop · warm · none · instrumented | CLS p75 | 10 | 10 |
| En Reve · Deferred code + construction | load · loading · desktop · warm · none · instrumented | CLS max | 10 | 10 |
| En Reve · Deferred code + construction | load · loading · desktop · warm · none · instrumented | TTFB ms | 10 | 10 |
| En Reve · Deferred code + construction | load · loading · desktop · warm · none · instrumented | Cards frame opportunity ms | 10 | 10 |
| En Reve · Deferred code + construction | load · loading · desktop · warm · none · instrumented | Last webfont response ms | 0 | 10 |
| En Reve · Eager reference | load · lcp · desktop · warm · none · instrumented | TTFB portion ms | 10 | 10 |
| En Reve · Eager reference | load · lcp · desktop · warm · none · instrumented | Resource delay ms | 10 | 10 |
| En Reve · Eager reference | load · lcp · desktop · warm · none · instrumented | Resource duration ms | 10 | 10 |
| En Reve · Eager reference | load · lcp · desktop · warm · none · instrumented | Element render delay ms | 10 | 10 |
| En Reve · Deferred construction | load · lcp · desktop · warm · none · instrumented | TTFB portion ms | 10 | 10 |
| En Reve · Deferred construction | load · lcp · desktop · warm · none · instrumented | Resource delay ms | 10 | 10 |
| En Reve · Deferred construction | load · lcp · desktop · warm · none · instrumented | Resource duration ms | 10 | 10 |
| En Reve · Deferred construction | load · lcp · desktop · warm · none · instrumented | Element render delay ms | 10 | 10 |
| En Reve · Deferred code + construction | load · lcp · desktop · warm · none · instrumented | TTFB portion ms | 10 | 10 |
| En Reve · Deferred code + construction | load · lcp · desktop · warm · none · instrumented | Resource delay ms | 10 | 10 |
| En Reve · Deferred code + construction | load · lcp · desktop · warm · none · instrumented | Resource duration ms | 10 | 10 |
| En Reve · Deferred code + construction | load · lcp · desktop · warm · none · instrumented | Element render delay ms | 10 | 10 |
| En Reve · Eager reference | load · transfer · desktop · warm · none · instrumented | Total response KiB | 10 | 10 |
| En Reve · Eager reference | load · transfer · desktop · warm · none · instrumented | HTML KiB | 10 | 10 |
| En Reve · Eager reference | load · transfer · desktop · warm · none · instrumented | JS KiB | 10 | 10 |
| En Reve · Eager reference | load · transfer · desktop · warm · none · instrumented | CSS KiB | 10 | 10 |
| En Reve · Eager reference | load · transfer · desktop · warm · none · instrumented | Fonts KiB | 10 | 10 |
| En Reve · Eager reference | load · transfer · desktop · warm · none · instrumented | Other KiB | 10 | 10 |
| En Reve · Eager reference | load · transfer · desktop · warm · none · instrumented | HTTP responses | 10 | 10 |
| En Reve · Eager reference | load · transfer · desktop · warm · none · instrumented | Cache reuse entries | 10 | 10 |
| En Reve · Eager reference | load · transfer · desktop · warm · none · instrumented | Incomplete responses | 10 | 10 |
| En Reve · Deferred construction | load · transfer · desktop · warm · none · instrumented | Total response KiB | 10 | 10 |
| En Reve · Deferred construction | load · transfer · desktop · warm · none · instrumented | HTML KiB | 10 | 10 |
| En Reve · Deferred construction | load · transfer · desktop · warm · none · instrumented | JS KiB | 10 | 10 |
| En Reve · Deferred construction | load · transfer · desktop · warm · none · instrumented | CSS KiB | 10 | 10 |
| En Reve · Deferred construction | load · transfer · desktop · warm · none · instrumented | Fonts KiB | 10 | 10 |
| En Reve · Deferred construction | load · transfer · desktop · warm · none · instrumented | Other KiB | 10 | 10 |
| En Reve · Deferred construction | load · transfer · desktop · warm · none · instrumented | HTTP responses | 10 | 10 |
| En Reve · Deferred construction | load · transfer · desktop · warm · none · instrumented | Cache reuse entries | 10 | 10 |
| En Reve · Deferred construction | load · transfer · desktop · warm · none · instrumented | Incomplete responses | 10 | 10 |
| En Reve · Deferred code + construction | load · transfer · desktop · warm · none · instrumented | Total response KiB | 10 | 10 |
| En Reve · Deferred code + construction | load · transfer · desktop · warm · none · instrumented | HTML KiB | 10 | 10 |
| En Reve · Deferred code + construction | load · transfer · desktop · warm · none · instrumented | JS KiB | 10 | 10 |
| En Reve · Deferred code + construction | load · transfer · desktop · warm · none · instrumented | CSS KiB | 10 | 10 |
| En Reve · Deferred code + construction | load · transfer · desktop · warm · none · instrumented | Fonts KiB | 10 | 10 |
| En Reve · Deferred code + construction | load · transfer · desktop · warm · none · instrumented | Other KiB | 10 | 10 |
| En Reve · Deferred code + construction | load · transfer · desktop · warm · none · instrumented | HTTP responses | 10 | 10 |
| En Reve · Deferred code + construction | load · transfer · desktop · warm · none · instrumented | Cache reuse entries | 10 | 10 |
| En Reve · Deferred code + construction | load · transfer · desktop · warm · none · instrumented | Incomplete responses | 10 | 10 |
| En Reve · Eager reference | load · thread · desktop · warm · none · instrumented | Script ms | 10 | 10 |
| En Reve · Eager reference | load · thread · desktop · warm · none · instrumented | Style ms | 10 | 10 |
| En Reve · Eager reference | load · thread · desktop · warm · none · instrumented | Layout ms | 10 | 10 |
| En Reve · Eager reference | load · thread · desktop · warm · none · instrumented | Task ms | 10 | 10 |
| En Reve · Eager reference | load · thread · desktop · warm · none · instrumented | Layout passes | 10 | 10 |
| En Reve · Eager reference | load · thread · desktop · warm · none · instrumented | Style recalcs | 10 | 10 |
| En Reve · Eager reference | load · thread · desktop · warm · none · instrumented | Long tasks ms | 10 | 10 |
| En Reve · Eager reference | load · thread · desktop · warm · none · instrumented | Pre-FCP blocking excess ms | 10 | 10 |
| En Reve · Eager reference | load · thread · desktop · warm · none · instrumented | Post-FCP blocking excess ms | 10 | 10 |
| En Reve · Eager reference | load · thread · desktop · warm · none · instrumented | Long animation frames ms | 10 | 10 |
| En Reve · Deferred construction | load · thread · desktop · warm · none · instrumented | Script ms | 10 | 10 |
| En Reve · Deferred construction | load · thread · desktop · warm · none · instrumented | Style ms | 10 | 10 |
| En Reve · Deferred construction | load · thread · desktop · warm · none · instrumented | Layout ms | 10 | 10 |
| En Reve · Deferred construction | load · thread · desktop · warm · none · instrumented | Task ms | 10 | 10 |
| En Reve · Deferred construction | load · thread · desktop · warm · none · instrumented | Layout passes | 10 | 10 |
| En Reve · Deferred construction | load · thread · desktop · warm · none · instrumented | Style recalcs | 10 | 10 |
| En Reve · Deferred construction | load · thread · desktop · warm · none · instrumented | Long tasks ms | 10 | 10 |
| En Reve · Deferred construction | load · thread · desktop · warm · none · instrumented | Pre-FCP blocking excess ms | 10 | 10 |
| En Reve · Deferred construction | load · thread · desktop · warm · none · instrumented | Post-FCP blocking excess ms | 10 | 10 |
| En Reve · Deferred construction | load · thread · desktop · warm · none · instrumented | Long animation frames ms | 10 | 10 |
| En Reve · Deferred code + construction | load · thread · desktop · warm · none · instrumented | Script ms | 10 | 10 |
| En Reve · Deferred code + construction | load · thread · desktop · warm · none · instrumented | Style ms | 10 | 10 |
| En Reve · Deferred code + construction | load · thread · desktop · warm · none · instrumented | Layout ms | 10 | 10 |
| En Reve · Deferred code + construction | load · thread · desktop · warm · none · instrumented | Task ms | 10 | 10 |
| En Reve · Deferred code + construction | load · thread · desktop · warm · none · instrumented | Layout passes | 10 | 10 |
| En Reve · Deferred code + construction | load · thread · desktop · warm · none · instrumented | Style recalcs | 10 | 10 |
| En Reve · Deferred code + construction | load · thread · desktop · warm · none · instrumented | Long tasks ms | 10 | 10 |
| En Reve · Deferred code + construction | load · thread · desktop · warm · none · instrumented | Pre-FCP blocking excess ms | 10 | 10 |
| En Reve · Deferred code + construction | load · thread · desktop · warm · none · instrumented | Post-FCP blocking excess ms | 10 | 10 |
| En Reve · Deferred code + construction | load · thread · desktop · warm · none · instrumented | Long animation frames ms | 10 | 10 |
| En Reve · Eager reference | load · loading · mobile · cold · none · instrumented | FCP ms | 10 | 10 |
| En Reve · Eager reference | load · loading · mobile · cold · none · instrumented | LCP ms | 10 | 10 |
| En Reve · Eager reference | load · loading · mobile · cold · none · instrumented | LCP p75 ms | 10 | 10 |
| En Reve · Eager reference | load · loading · mobile · cold · none · instrumented | CLS | 10 | 10 |
| En Reve · Eager reference | load · loading · mobile · cold · none · instrumented | CLS p75 | 10 | 10 |
| En Reve · Eager reference | load · loading · mobile · cold · none · instrumented | CLS max | 10 | 10 |
| En Reve · Eager reference | load · loading · mobile · cold · none · instrumented | TTFB ms | 10 | 10 |
| En Reve · Eager reference | load · loading · mobile · cold · none · instrumented | Cards frame opportunity ms | 10 | 10 |
| En Reve · Eager reference | load · loading · mobile · cold · none · instrumented | Last webfont response ms | 0 | 10 |
| En Reve · Deferred construction | load · loading · mobile · cold · none · instrumented | FCP ms | 10 | 10 |
| En Reve · Deferred construction | load · loading · mobile · cold · none · instrumented | LCP ms | 10 | 10 |
| En Reve · Deferred construction | load · loading · mobile · cold · none · instrumented | LCP p75 ms | 10 | 10 |
| En Reve · Deferred construction | load · loading · mobile · cold · none · instrumented | CLS | 10 | 10 |
| En Reve · Deferred construction | load · loading · mobile · cold · none · instrumented | CLS p75 | 10 | 10 |
| En Reve · Deferred construction | load · loading · mobile · cold · none · instrumented | CLS max | 10 | 10 |
| En Reve · Deferred construction | load · loading · mobile · cold · none · instrumented | TTFB ms | 10 | 10 |
| En Reve · Deferred construction | load · loading · mobile · cold · none · instrumented | Cards frame opportunity ms | 10 | 10 |
| En Reve · Deferred construction | load · loading · mobile · cold · none · instrumented | Last webfont response ms | 0 | 10 |
| En Reve · Deferred code + construction | load · loading · mobile · cold · none · instrumented | FCP ms | 10 | 10 |
| En Reve · Deferred code + construction | load · loading · mobile · cold · none · instrumented | LCP ms | 10 | 10 |
| En Reve · Deferred code + construction | load · loading · mobile · cold · none · instrumented | LCP p75 ms | 10 | 10 |
| En Reve · Deferred code + construction | load · loading · mobile · cold · none · instrumented | CLS | 10 | 10 |
| En Reve · Deferred code + construction | load · loading · mobile · cold · none · instrumented | CLS p75 | 10 | 10 |
| En Reve · Deferred code + construction | load · loading · mobile · cold · none · instrumented | CLS max | 10 | 10 |
| En Reve · Deferred code + construction | load · loading · mobile · cold · none · instrumented | TTFB ms | 10 | 10 |
| En Reve · Deferred code + construction | load · loading · mobile · cold · none · instrumented | Cards frame opportunity ms | 10 | 10 |
| En Reve · Deferred code + construction | load · loading · mobile · cold · none · instrumented | Last webfont response ms | 0 | 10 |
| En Reve · Eager reference | load · lcp · mobile · cold · none · instrumented | TTFB portion ms | 10 | 10 |
| En Reve · Eager reference | load · lcp · mobile · cold · none · instrumented | Resource delay ms | 10 | 10 |
| En Reve · Eager reference | load · lcp · mobile · cold · none · instrumented | Resource duration ms | 10 | 10 |
| En Reve · Eager reference | load · lcp · mobile · cold · none · instrumented | Element render delay ms | 10 | 10 |
| En Reve · Deferred construction | load · lcp · mobile · cold · none · instrumented | TTFB portion ms | 10 | 10 |
| En Reve · Deferred construction | load · lcp · mobile · cold · none · instrumented | Resource delay ms | 10 | 10 |
| En Reve · Deferred construction | load · lcp · mobile · cold · none · instrumented | Resource duration ms | 10 | 10 |
| En Reve · Deferred construction | load · lcp · mobile · cold · none · instrumented | Element render delay ms | 10 | 10 |
| En Reve · Deferred code + construction | load · lcp · mobile · cold · none · instrumented | TTFB portion ms | 10 | 10 |
| En Reve · Deferred code + construction | load · lcp · mobile · cold · none · instrumented | Resource delay ms | 10 | 10 |
| En Reve · Deferred code + construction | load · lcp · mobile · cold · none · instrumented | Resource duration ms | 10 | 10 |
| En Reve · Deferred code + construction | load · lcp · mobile · cold · none · instrumented | Element render delay ms | 10 | 10 |
| En Reve · Eager reference | load · transfer · mobile · cold · none · instrumented | Total response KiB | 10 | 10 |
| En Reve · Eager reference | load · transfer · mobile · cold · none · instrumented | HTML KiB | 10 | 10 |
| En Reve · Eager reference | load · transfer · mobile · cold · none · instrumented | JS KiB | 10 | 10 |
| En Reve · Eager reference | load · transfer · mobile · cold · none · instrumented | CSS KiB | 10 | 10 |
| En Reve · Eager reference | load · transfer · mobile · cold · none · instrumented | Fonts KiB | 10 | 10 |
| En Reve · Eager reference | load · transfer · mobile · cold · none · instrumented | Other KiB | 10 | 10 |
| En Reve · Eager reference | load · transfer · mobile · cold · none · instrumented | HTTP responses | 10 | 10 |
| En Reve · Eager reference | load · transfer · mobile · cold · none · instrumented | Cache reuse entries | 10 | 10 |
| En Reve · Eager reference | load · transfer · mobile · cold · none · instrumented | Incomplete responses | 10 | 10 |
| En Reve · Deferred construction | load · transfer · mobile · cold · none · instrumented | Total response KiB | 10 | 10 |
| En Reve · Deferred construction | load · transfer · mobile · cold · none · instrumented | HTML KiB | 10 | 10 |
| En Reve · Deferred construction | load · transfer · mobile · cold · none · instrumented | JS KiB | 10 | 10 |
| En Reve · Deferred construction | load · transfer · mobile · cold · none · instrumented | CSS KiB | 10 | 10 |
| En Reve · Deferred construction | load · transfer · mobile · cold · none · instrumented | Fonts KiB | 10 | 10 |
| En Reve · Deferred construction | load · transfer · mobile · cold · none · instrumented | Other KiB | 10 | 10 |
| En Reve · Deferred construction | load · transfer · mobile · cold · none · instrumented | HTTP responses | 10 | 10 |
| En Reve · Deferred construction | load · transfer · mobile · cold · none · instrumented | Cache reuse entries | 10 | 10 |
| En Reve · Deferred construction | load · transfer · mobile · cold · none · instrumented | Incomplete responses | 10 | 10 |
| En Reve · Deferred code + construction | load · transfer · mobile · cold · none · instrumented | Total response KiB | 10 | 10 |
| En Reve · Deferred code + construction | load · transfer · mobile · cold · none · instrumented | HTML KiB | 10 | 10 |
| En Reve · Deferred code + construction | load · transfer · mobile · cold · none · instrumented | JS KiB | 10 | 10 |
| En Reve · Deferred code + construction | load · transfer · mobile · cold · none · instrumented | CSS KiB | 10 | 10 |
| En Reve · Deferred code + construction | load · transfer · mobile · cold · none · instrumented | Fonts KiB | 10 | 10 |
| En Reve · Deferred code + construction | load · transfer · mobile · cold · none · instrumented | Other KiB | 10 | 10 |
| En Reve · Deferred code + construction | load · transfer · mobile · cold · none · instrumented | HTTP responses | 10 | 10 |
| En Reve · Deferred code + construction | load · transfer · mobile · cold · none · instrumented | Cache reuse entries | 10 | 10 |
| En Reve · Deferred code + construction | load · transfer · mobile · cold · none · instrumented | Incomplete responses | 10 | 10 |
| En Reve · Eager reference | load · thread · mobile · cold · none · instrumented | Script ms | 10 | 10 |
| En Reve · Eager reference | load · thread · mobile · cold · none · instrumented | Style ms | 10 | 10 |
| En Reve · Eager reference | load · thread · mobile · cold · none · instrumented | Layout ms | 10 | 10 |
| En Reve · Eager reference | load · thread · mobile · cold · none · instrumented | Task ms | 10 | 10 |
| En Reve · Eager reference | load · thread · mobile · cold · none · instrumented | Layout passes | 10 | 10 |
| En Reve · Eager reference | load · thread · mobile · cold · none · instrumented | Style recalcs | 10 | 10 |
| En Reve · Eager reference | load · thread · mobile · cold · none · instrumented | Long tasks ms | 10 | 10 |
| En Reve · Eager reference | load · thread · mobile · cold · none · instrumented | Pre-FCP blocking excess ms | 10 | 10 |
| En Reve · Eager reference | load · thread · mobile · cold · none · instrumented | Post-FCP blocking excess ms | 10 | 10 |
| En Reve · Eager reference | load · thread · mobile · cold · none · instrumented | Long animation frames ms | 10 | 10 |
| En Reve · Deferred construction | load · thread · mobile · cold · none · instrumented | Script ms | 10 | 10 |
| En Reve · Deferred construction | load · thread · mobile · cold · none · instrumented | Style ms | 10 | 10 |
| En Reve · Deferred construction | load · thread · mobile · cold · none · instrumented | Layout ms | 10 | 10 |
| En Reve · Deferred construction | load · thread · mobile · cold · none · instrumented | Task ms | 10 | 10 |
| En Reve · Deferred construction | load · thread · mobile · cold · none · instrumented | Layout passes | 10 | 10 |
| En Reve · Deferred construction | load · thread · mobile · cold · none · instrumented | Style recalcs | 10 | 10 |
| En Reve · Deferred construction | load · thread · mobile · cold · none · instrumented | Long tasks ms | 10 | 10 |
| En Reve · Deferred construction | load · thread · mobile · cold · none · instrumented | Pre-FCP blocking excess ms | 10 | 10 |
| En Reve · Deferred construction | load · thread · mobile · cold · none · instrumented | Post-FCP blocking excess ms | 10 | 10 |
| En Reve · Deferred construction | load · thread · mobile · cold · none · instrumented | Long animation frames ms | 10 | 10 |
| En Reve · Deferred code + construction | load · thread · mobile · cold · none · instrumented | Script ms | 10 | 10 |
| En Reve · Deferred code + construction | load · thread · mobile · cold · none · instrumented | Style ms | 10 | 10 |
| En Reve · Deferred code + construction | load · thread · mobile · cold · none · instrumented | Layout ms | 10 | 10 |
| En Reve · Deferred code + construction | load · thread · mobile · cold · none · instrumented | Task ms | 10 | 10 |
| En Reve · Deferred code + construction | load · thread · mobile · cold · none · instrumented | Layout passes | 10 | 10 |
| En Reve · Deferred code + construction | load · thread · mobile · cold · none · instrumented | Style recalcs | 10 | 10 |
| En Reve · Deferred code + construction | load · thread · mobile · cold · none · instrumented | Long tasks ms | 10 | 10 |
| En Reve · Deferred code + construction | load · thread · mobile · cold · none · instrumented | Pre-FCP blocking excess ms | 10 | 10 |
| En Reve · Deferred code + construction | load · thread · mobile · cold · none · instrumented | Post-FCP blocking excess ms | 10 | 10 |
| En Reve · Deferred code + construction | load · thread · mobile · cold · none · instrumented | Long animation frames ms | 10 | 10 |
| En Reve · Eager reference | load · loading · mobile · warm · none · instrumented | FCP ms | 10 | 10 |
| En Reve · Eager reference | load · loading · mobile · warm · none · instrumented | LCP ms | 10 | 10 |
| En Reve · Eager reference | load · loading · mobile · warm · none · instrumented | LCP p75 ms | 10 | 10 |
| En Reve · Eager reference | load · loading · mobile · warm · none · instrumented | CLS | 10 | 10 |
| En Reve · Eager reference | load · loading · mobile · warm · none · instrumented | CLS p75 | 10 | 10 |
| En Reve · Eager reference | load · loading · mobile · warm · none · instrumented | CLS max | 10 | 10 |
| En Reve · Eager reference | load · loading · mobile · warm · none · instrumented | TTFB ms | 10 | 10 |
| En Reve · Eager reference | load · loading · mobile · warm · none · instrumented | Cards frame opportunity ms | 10 | 10 |
| En Reve · Eager reference | load · loading · mobile · warm · none · instrumented | Last webfont response ms | 0 | 10 |
| En Reve · Deferred construction | load · loading · mobile · warm · none · instrumented | FCP ms | 10 | 10 |
| En Reve · Deferred construction | load · loading · mobile · warm · none · instrumented | LCP ms | 10 | 10 |
| En Reve · Deferred construction | load · loading · mobile · warm · none · instrumented | LCP p75 ms | 10 | 10 |
| En Reve · Deferred construction | load · loading · mobile · warm · none · instrumented | CLS | 10 | 10 |
| En Reve · Deferred construction | load · loading · mobile · warm · none · instrumented | CLS p75 | 10 | 10 |
| En Reve · Deferred construction | load · loading · mobile · warm · none · instrumented | CLS max | 10 | 10 |
| En Reve · Deferred construction | load · loading · mobile · warm · none · instrumented | TTFB ms | 10 | 10 |
| En Reve · Deferred construction | load · loading · mobile · warm · none · instrumented | Cards frame opportunity ms | 10 | 10 |
| En Reve · Deferred construction | load · loading · mobile · warm · none · instrumented | Last webfont response ms | 0 | 10 |
| En Reve · Deferred code + construction | load · loading · mobile · warm · none · instrumented | FCP ms | 10 | 10 |
| En Reve · Deferred code + construction | load · loading · mobile · warm · none · instrumented | LCP ms | 10 | 10 |
| En Reve · Deferred code + construction | load · loading · mobile · warm · none · instrumented | LCP p75 ms | 10 | 10 |
| En Reve · Deferred code + construction | load · loading · mobile · warm · none · instrumented | CLS | 10 | 10 |
| En Reve · Deferred code + construction | load · loading · mobile · warm · none · instrumented | CLS p75 | 10 | 10 |
| En Reve · Deferred code + construction | load · loading · mobile · warm · none · instrumented | CLS max | 10 | 10 |
| En Reve · Deferred code + construction | load · loading · mobile · warm · none · instrumented | TTFB ms | 10 | 10 |
| En Reve · Deferred code + construction | load · loading · mobile · warm · none · instrumented | Cards frame opportunity ms | 10 | 10 |
| En Reve · Deferred code + construction | load · loading · mobile · warm · none · instrumented | Last webfont response ms | 0 | 10 |
| En Reve · Eager reference | load · lcp · mobile · warm · none · instrumented | TTFB portion ms | 10 | 10 |
| En Reve · Eager reference | load · lcp · mobile · warm · none · instrumented | Resource delay ms | 10 | 10 |
| En Reve · Eager reference | load · lcp · mobile · warm · none · instrumented | Resource duration ms | 10 | 10 |
| En Reve · Eager reference | load · lcp · mobile · warm · none · instrumented | Element render delay ms | 10 | 10 |
| En Reve · Deferred construction | load · lcp · mobile · warm · none · instrumented | TTFB portion ms | 10 | 10 |
| En Reve · Deferred construction | load · lcp · mobile · warm · none · instrumented | Resource delay ms | 10 | 10 |
| En Reve · Deferred construction | load · lcp · mobile · warm · none · instrumented | Resource duration ms | 10 | 10 |
| En Reve · Deferred construction | load · lcp · mobile · warm · none · instrumented | Element render delay ms | 10 | 10 |
| En Reve · Deferred code + construction | load · lcp · mobile · warm · none · instrumented | TTFB portion ms | 10 | 10 |
| En Reve · Deferred code + construction | load · lcp · mobile · warm · none · instrumented | Resource delay ms | 10 | 10 |
| En Reve · Deferred code + construction | load · lcp · mobile · warm · none · instrumented | Resource duration ms | 10 | 10 |
| En Reve · Deferred code + construction | load · lcp · mobile · warm · none · instrumented | Element render delay ms | 10 | 10 |
| En Reve · Eager reference | load · transfer · mobile · warm · none · instrumented | Total response KiB | 10 | 10 |
| En Reve · Eager reference | load · transfer · mobile · warm · none · instrumented | HTML KiB | 10 | 10 |
| En Reve · Eager reference | load · transfer · mobile · warm · none · instrumented | JS KiB | 10 | 10 |
| En Reve · Eager reference | load · transfer · mobile · warm · none · instrumented | CSS KiB | 10 | 10 |
| En Reve · Eager reference | load · transfer · mobile · warm · none · instrumented | Fonts KiB | 10 | 10 |
| En Reve · Eager reference | load · transfer · mobile · warm · none · instrumented | Other KiB | 10 | 10 |
| En Reve · Eager reference | load · transfer · mobile · warm · none · instrumented | HTTP responses | 10 | 10 |
| En Reve · Eager reference | load · transfer · mobile · warm · none · instrumented | Cache reuse entries | 10 | 10 |
| En Reve · Eager reference | load · transfer · mobile · warm · none · instrumented | Incomplete responses | 10 | 10 |
| En Reve · Deferred construction | load · transfer · mobile · warm · none · instrumented | Total response KiB | 10 | 10 |
| En Reve · Deferred construction | load · transfer · mobile · warm · none · instrumented | HTML KiB | 10 | 10 |
| En Reve · Deferred construction | load · transfer · mobile · warm · none · instrumented | JS KiB | 10 | 10 |
| En Reve · Deferred construction | load · transfer · mobile · warm · none · instrumented | CSS KiB | 10 | 10 |
| En Reve · Deferred construction | load · transfer · mobile · warm · none · instrumented | Fonts KiB | 10 | 10 |
| En Reve · Deferred construction | load · transfer · mobile · warm · none · instrumented | Other KiB | 10 | 10 |
| En Reve · Deferred construction | load · transfer · mobile · warm · none · instrumented | HTTP responses | 10 | 10 |
| En Reve · Deferred construction | load · transfer · mobile · warm · none · instrumented | Cache reuse entries | 10 | 10 |
| En Reve · Deferred construction | load · transfer · mobile · warm · none · instrumented | Incomplete responses | 10 | 10 |
| En Reve · Deferred code + construction | load · transfer · mobile · warm · none · instrumented | Total response KiB | 10 | 10 |
| En Reve · Deferred code + construction | load · transfer · mobile · warm · none · instrumented | HTML KiB | 10 | 10 |
| En Reve · Deferred code + construction | load · transfer · mobile · warm · none · instrumented | JS KiB | 10 | 10 |
| En Reve · Deferred code + construction | load · transfer · mobile · warm · none · instrumented | CSS KiB | 10 | 10 |
| En Reve · Deferred code + construction | load · transfer · mobile · warm · none · instrumented | Fonts KiB | 10 | 10 |
| En Reve · Deferred code + construction | load · transfer · mobile · warm · none · instrumented | Other KiB | 10 | 10 |
| En Reve · Deferred code + construction | load · transfer · mobile · warm · none · instrumented | HTTP responses | 10 | 10 |
| En Reve · Deferred code + construction | load · transfer · mobile · warm · none · instrumented | Cache reuse entries | 10 | 10 |
| En Reve · Deferred code + construction | load · transfer · mobile · warm · none · instrumented | Incomplete responses | 10 | 10 |
| En Reve · Eager reference | load · thread · mobile · warm · none · instrumented | Script ms | 10 | 10 |
| En Reve · Eager reference | load · thread · mobile · warm · none · instrumented | Style ms | 10 | 10 |
| En Reve · Eager reference | load · thread · mobile · warm · none · instrumented | Layout ms | 10 | 10 |
| En Reve · Eager reference | load · thread · mobile · warm · none · instrumented | Task ms | 10 | 10 |
| En Reve · Eager reference | load · thread · mobile · warm · none · instrumented | Layout passes | 10 | 10 |
| En Reve · Eager reference | load · thread · mobile · warm · none · instrumented | Style recalcs | 10 | 10 |
| En Reve · Eager reference | load · thread · mobile · warm · none · instrumented | Long tasks ms | 10 | 10 |
| En Reve · Eager reference | load · thread · mobile · warm · none · instrumented | Pre-FCP blocking excess ms | 10 | 10 |
| En Reve · Eager reference | load · thread · mobile · warm · none · instrumented | Post-FCP blocking excess ms | 10 | 10 |
| En Reve · Eager reference | load · thread · mobile · warm · none · instrumented | Long animation frames ms | 10 | 10 |
| En Reve · Deferred construction | load · thread · mobile · warm · none · instrumented | Script ms | 10 | 10 |
| En Reve · Deferred construction | load · thread · mobile · warm · none · instrumented | Style ms | 10 | 10 |
| En Reve · Deferred construction | load · thread · mobile · warm · none · instrumented | Layout ms | 10 | 10 |
| En Reve · Deferred construction | load · thread · mobile · warm · none · instrumented | Task ms | 10 | 10 |
| En Reve · Deferred construction | load · thread · mobile · warm · none · instrumented | Layout passes | 10 | 10 |
| En Reve · Deferred construction | load · thread · mobile · warm · none · instrumented | Style recalcs | 10 | 10 |
| En Reve · Deferred construction | load · thread · mobile · warm · none · instrumented | Long tasks ms | 10 | 10 |
| En Reve · Deferred construction | load · thread · mobile · warm · none · instrumented | Pre-FCP blocking excess ms | 10 | 10 |
| En Reve · Deferred construction | load · thread · mobile · warm · none · instrumented | Post-FCP blocking excess ms | 10 | 10 |
| En Reve · Deferred construction | load · thread · mobile · warm · none · instrumented | Long animation frames ms | 10 | 10 |
| En Reve · Deferred code + construction | load · thread · mobile · warm · none · instrumented | Script ms | 10 | 10 |
| En Reve · Deferred code + construction | load · thread · mobile · warm · none · instrumented | Style ms | 10 | 10 |
| En Reve · Deferred code + construction | load · thread · mobile · warm · none · instrumented | Layout ms | 10 | 10 |
| En Reve · Deferred code + construction | load · thread · mobile · warm · none · instrumented | Task ms | 10 | 10 |
| En Reve · Deferred code + construction | load · thread · mobile · warm · none · instrumented | Layout passes | 10 | 10 |
| En Reve · Deferred code + construction | load · thread · mobile · warm · none · instrumented | Style recalcs | 10 | 10 |
| En Reve · Deferred code + construction | load · thread · mobile · warm · none · instrumented | Long tasks ms | 10 | 10 |
| En Reve · Deferred code + construction | load · thread · mobile · warm · none · instrumented | Pre-FCP blocking excess ms | 10 | 10 |
| En Reve · Deferred code + construction | load · thread · mobile · warm · none · instrumented | Post-FCP blocking excess ms | 10 | 10 |
| En Reve · Deferred code + construction | load · thread · mobile · warm · none · instrumented | Long animation frames ms | 10 | 10 |
| En Reve · Eager reference | startup · startup · desktop · cold · none · instrumented | Control observed ms | 10 | 10 |
| En Reve · Eager reference | startup · startup · desktop · cold · none · instrumented | Click from navigation ms | 10 | 10 |
| En Reve · Eager reference | startup · startup · desktop · cold · none · instrumented | Result from navigation ms | 10 | 10 |
| En Reve · Eager reference | startup · startup · desktop · cold · none · instrumented | Result p75 ms | 10 | 10 |
| En Reve · Eager reference | startup · startup · desktop · cold · none · instrumented | Dispatch overhead ms | 10 | 10 |
| En Reve · Eager reference | startup · startup · desktop · cold · none · instrumented | Discovery probe ms | 10 | 10 |
| En Reve · Eager reference | startup · startup · desktop · cold · none · instrumented | Click to result ms | 10 | 10 |
| En Reve · Eager reference | startup · startup · desktop · cold · none · instrumented | Click to frame ms | 10 | 10 |
| En Reve · Eager reference | startup · startup · desktop · cold · none · instrumented | First input delay ms | 0 | 10 |
| En Reve · Deferred construction | startup · startup · desktop · cold · none · instrumented | Control observed ms | 10 | 10 |
| En Reve · Deferred construction | startup · startup · desktop · cold · none · instrumented | Click from navigation ms | 10 | 10 |
| En Reve · Deferred construction | startup · startup · desktop · cold · none · instrumented | Result from navigation ms | 10 | 10 |
| En Reve · Deferred construction | startup · startup · desktop · cold · none · instrumented | Result p75 ms | 10 | 10 |
| En Reve · Deferred construction | startup · startup · desktop · cold · none · instrumented | Dispatch overhead ms | 10 | 10 |
| En Reve · Deferred construction | startup · startup · desktop · cold · none · instrumented | Discovery probe ms | 10 | 10 |
| En Reve · Deferred construction | startup · startup · desktop · cold · none · instrumented | Click to result ms | 10 | 10 |
| En Reve · Deferred construction | startup · startup · desktop · cold · none · instrumented | Click to frame ms | 10 | 10 |
| En Reve · Deferred construction | startup · startup · desktop · cold · none · instrumented | First input delay ms | 0 | 10 |
| En Reve · Deferred code + construction | startup · startup · desktop · cold · none · instrumented | Control observed ms | 10 | 10 |
| En Reve · Deferred code + construction | startup · startup · desktop · cold · none · instrumented | Click from navigation ms | 10 | 10 |
| En Reve · Deferred code + construction | startup · startup · desktop · cold · none · instrumented | Result from navigation ms | 10 | 10 |
| En Reve · Deferred code + construction | startup · startup · desktop · cold · none · instrumented | Result p75 ms | 10 | 10 |
| En Reve · Deferred code + construction | startup · startup · desktop · cold · none · instrumented | Dispatch overhead ms | 10 | 10 |
| En Reve · Deferred code + construction | startup · startup · desktop · cold · none · instrumented | Discovery probe ms | 10 | 10 |
| En Reve · Deferred code + construction | startup · startup · desktop · cold · none · instrumented | Click to result ms | 10 | 10 |
| En Reve · Deferred code + construction | startup · startup · desktop · cold · none · instrumented | Click to frame ms | 10 | 10 |
| En Reve · Deferred code + construction | startup · startup · desktop · cold · none · instrumented | First input delay ms | 0 | 10 |
| En Reve · Eager reference | startup · transfer · desktop · cold · none · instrumented | Total response KiB | 10 | 10 |
| En Reve · Eager reference | startup · transfer · desktop · cold · none · instrumented | HTML KiB | 10 | 10 |
| En Reve · Eager reference | startup · transfer · desktop · cold · none · instrumented | JS KiB | 10 | 10 |
| En Reve · Eager reference | startup · transfer · desktop · cold · none · instrumented | CSS KiB | 10 | 10 |
| En Reve · Eager reference | startup · transfer · desktop · cold · none · instrumented | Fonts KiB | 10 | 10 |
| En Reve · Eager reference | startup · transfer · desktop · cold · none · instrumented | Other KiB | 10 | 10 |
| En Reve · Eager reference | startup · transfer · desktop · cold · none · instrumented | HTTP responses | 10 | 10 |
| En Reve · Eager reference | startup · transfer · desktop · cold · none · instrumented | Cache reuse entries | 10 | 10 |
| En Reve · Eager reference | startup · transfer · desktop · cold · none · instrumented | Incomplete responses | 10 | 10 |
| En Reve · Deferred construction | startup · transfer · desktop · cold · none · instrumented | Total response KiB | 10 | 10 |
| En Reve · Deferred construction | startup · transfer · desktop · cold · none · instrumented | HTML KiB | 10 | 10 |
| En Reve · Deferred construction | startup · transfer · desktop · cold · none · instrumented | JS KiB | 10 | 10 |
| En Reve · Deferred construction | startup · transfer · desktop · cold · none · instrumented | CSS KiB | 10 | 10 |
| En Reve · Deferred construction | startup · transfer · desktop · cold · none · instrumented | Fonts KiB | 10 | 10 |
| En Reve · Deferred construction | startup · transfer · desktop · cold · none · instrumented | Other KiB | 10 | 10 |
| En Reve · Deferred construction | startup · transfer · desktop · cold · none · instrumented | HTTP responses | 10 | 10 |
| En Reve · Deferred construction | startup · transfer · desktop · cold · none · instrumented | Cache reuse entries | 10 | 10 |
| En Reve · Deferred construction | startup · transfer · desktop · cold · none · instrumented | Incomplete responses | 10 | 10 |
| En Reve · Deferred code + construction | startup · transfer · desktop · cold · none · instrumented | Total response KiB | 10 | 10 |
| En Reve · Deferred code + construction | startup · transfer · desktop · cold · none · instrumented | HTML KiB | 10 | 10 |
| En Reve · Deferred code + construction | startup · transfer · desktop · cold · none · instrumented | JS KiB | 10 | 10 |
| En Reve · Deferred code + construction | startup · transfer · desktop · cold · none · instrumented | CSS KiB | 10 | 10 |
| En Reve · Deferred code + construction | startup · transfer · desktop · cold · none · instrumented | Fonts KiB | 10 | 10 |
| En Reve · Deferred code + construction | startup · transfer · desktop · cold · none · instrumented | Other KiB | 10 | 10 |
| En Reve · Deferred code + construction | startup · transfer · desktop · cold · none · instrumented | HTTP responses | 10 | 10 |
| En Reve · Deferred code + construction | startup · transfer · desktop · cold · none · instrumented | Cache reuse entries | 10 | 10 |
| En Reve · Deferred code + construction | startup · transfer · desktop · cold · none · instrumented | Incomplete responses | 10 | 10 |
| En Reve · Eager reference | interactions · interactions · desktop · cold · none · instrumented | Scripted INP ms | 10 | 10 |
| En Reve · Eager reference | interactions · interactions · desktop · cold · none · instrumented | Scripted INP p75 ms | 10 | 10 |
| En Reve · Eager reference | interactions · interactions · desktop · cold · none · instrumented | First input delay ms | 10 | 10 |
| En Reve · Eager reference | interactions · interactions · desktop · cold · none · instrumented | Journey CLS | 10 | 10 |
| En Reve · Eager reference | interactions · interactions · desktop · cold · none · instrumented | Max scroll rAF gap ms | 10 | 10 |
| En Reve · Deferred construction | interactions · interactions · desktop · cold · none · instrumented | Scripted INP ms | 10 | 10 |
| En Reve · Deferred construction | interactions · interactions · desktop · cold · none · instrumented | Scripted INP p75 ms | 10 | 10 |
| En Reve · Deferred construction | interactions · interactions · desktop · cold · none · instrumented | First input delay ms | 10 | 10 |
| En Reve · Deferred construction | interactions · interactions · desktop · cold · none · instrumented | Journey CLS | 10 | 10 |
| En Reve · Deferred construction | interactions · interactions · desktop · cold · none · instrumented | Max scroll rAF gap ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · interactions · desktop · cold · none · instrumented | Scripted INP ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · interactions · desktop · cold · none · instrumented | Scripted INP p75 ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · interactions · desktop · cold · none · instrumented | First input delay ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · interactions · desktop · cold · none · instrumented | Journey CLS | 10 | 10 |
| En Reve · Deferred code + construction | interactions · interactions · desktop · cold · none · instrumented | Max scroll rAF gap ms | 10 | 10 |
| En Reve · Eager reference | interactions · transfer · desktop · cold · none · instrumented | Total response KiB | 10 | 10 |
| En Reve · Eager reference | interactions · transfer · desktop · cold · none · instrumented | HTML KiB | 10 | 10 |
| En Reve · Eager reference | interactions · transfer · desktop · cold · none · instrumented | JS KiB | 10 | 10 |
| En Reve · Eager reference | interactions · transfer · desktop · cold · none · instrumented | CSS KiB | 10 | 10 |
| En Reve · Eager reference | interactions · transfer · desktop · cold · none · instrumented | Fonts KiB | 10 | 10 |
| En Reve · Eager reference | interactions · transfer · desktop · cold · none · instrumented | Other KiB | 10 | 10 |
| En Reve · Eager reference | interactions · transfer · desktop · cold · none · instrumented | HTTP responses | 10 | 10 |
| En Reve · Eager reference | interactions · transfer · desktop · cold · none · instrumented | Cache reuse entries | 10 | 10 |
| En Reve · Eager reference | interactions · transfer · desktop · cold · none · instrumented | Incomplete responses | 10 | 10 |
| En Reve · Deferred construction | interactions · transfer · desktop · cold · none · instrumented | Total response KiB | 10 | 10 |
| En Reve · Deferred construction | interactions · transfer · desktop · cold · none · instrumented | HTML KiB | 10 | 10 |
| En Reve · Deferred construction | interactions · transfer · desktop · cold · none · instrumented | JS KiB | 10 | 10 |
| En Reve · Deferred construction | interactions · transfer · desktop · cold · none · instrumented | CSS KiB | 10 | 10 |
| En Reve · Deferred construction | interactions · transfer · desktop · cold · none · instrumented | Fonts KiB | 10 | 10 |
| En Reve · Deferred construction | interactions · transfer · desktop · cold · none · instrumented | Other KiB | 10 | 10 |
| En Reve · Deferred construction | interactions · transfer · desktop · cold · none · instrumented | HTTP responses | 10 | 10 |
| En Reve · Deferred construction | interactions · transfer · desktop · cold · none · instrumented | Cache reuse entries | 10 | 10 |
| En Reve · Deferred construction | interactions · transfer · desktop · cold · none · instrumented | Incomplete responses | 10 | 10 |
| En Reve · Deferred code + construction | interactions · transfer · desktop · cold · none · instrumented | Total response KiB | 10 | 10 |
| En Reve · Deferred code + construction | interactions · transfer · desktop · cold · none · instrumented | HTML KiB | 10 | 10 |
| En Reve · Deferred code + construction | interactions · transfer · desktop · cold · none · instrumented | JS KiB | 10 | 10 |
| En Reve · Deferred code + construction | interactions · transfer · desktop · cold · none · instrumented | CSS KiB | 10 | 10 |
| En Reve · Deferred code + construction | interactions · transfer · desktop · cold · none · instrumented | Fonts KiB | 10 | 10 |
| En Reve · Deferred code + construction | interactions · transfer · desktop · cold · none · instrumented | Other KiB | 10 | 10 |
| En Reve · Deferred code + construction | interactions · transfer · desktop · cold · none · instrumented | HTTP responses | 10 | 10 |
| En Reve · Deferred code + construction | interactions · transfer · desktop · cold · none · instrumented | Cache reuse entries | 10 | 10 |
| En Reve · Deferred code + construction | interactions · transfer · desktop · cold · none · instrumented | Incomplete responses | 10 | 10 |
| En Reve · Eager reference | interactions · canvas-landscape-first · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Eager reference | interactions · canvas-landscape-first · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · canvas-landscape-first · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · canvas-landscape-first · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · canvas-landscape-first · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · canvas-landscape-first · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Eager reference | interactions · canvas-portrait-first · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Eager reference | interactions · canvas-portrait-first · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · canvas-portrait-first · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · canvas-portrait-first · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · canvas-portrait-first · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · canvas-portrait-first · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Eager reference | interactions · asset-add-first · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Eager reference | interactions · asset-add-first · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · asset-add-first · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · asset-add-first · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · asset-add-first · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · asset-add-first · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Eager reference | interactions · asset-reset-first · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Eager reference | interactions · asset-reset-first · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · asset-reset-first · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · asset-reset-first · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · asset-reset-first · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · asset-reset-first · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Eager reference | interactions · dialog-open-first · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Eager reference | interactions · dialog-open-first · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · dialog-open-first · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · dialog-open-first · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · dialog-open-first · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · dialog-open-first · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Eager reference | interactions · canvas-landscape-warm · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Eager reference | interactions · canvas-landscape-warm · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · canvas-landscape-warm · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · canvas-landscape-warm · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · canvas-landscape-warm · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · canvas-landscape-warm · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Eager reference | interactions · canvas-portrait-warm · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Eager reference | interactions · canvas-portrait-warm · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · canvas-portrait-warm · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · canvas-portrait-warm · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · canvas-portrait-warm · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · canvas-portrait-warm · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Eager reference | interactions · asset-add-warm · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Eager reference | interactions · asset-add-warm · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · asset-add-warm · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · asset-add-warm · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · asset-add-warm · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · asset-add-warm · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Eager reference | interactions · asset-reset-warm · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Eager reference | interactions · asset-reset-warm · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · asset-reset-warm · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · asset-reset-warm · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · asset-reset-warm · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · asset-reset-warm · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Eager reference | interactions · dialog-open-warm · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Eager reference | interactions · dialog-open-warm · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · dialog-open-warm · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · dialog-open-warm · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · dialog-open-warm · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · dialog-open-warm · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Eager reference | interactions · review-submit · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Eager reference | interactions · review-submit · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · review-submit · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · review-submit · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · review-submit · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · review-submit · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Eager reference | interactions · commands-first · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Eager reference | interactions · commands-first · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · commands-first · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · commands-first · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · commands-first · desktop · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · commands-first · desktop · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Eager reference | startup · startup · mobile · cold · none · instrumented | Control observed ms | 10 | 10 |
| En Reve · Eager reference | startup · startup · mobile · cold · none · instrumented | Click from navigation ms | 10 | 10 |
| En Reve · Eager reference | startup · startup · mobile · cold · none · instrumented | Result from navigation ms | 10 | 10 |
| En Reve · Eager reference | startup · startup · mobile · cold · none · instrumented | Result p75 ms | 10 | 10 |
| En Reve · Eager reference | startup · startup · mobile · cold · none · instrumented | Dispatch overhead ms | 10 | 10 |
| En Reve · Eager reference | startup · startup · mobile · cold · none · instrumented | Discovery probe ms | 10 | 10 |
| En Reve · Eager reference | startup · startup · mobile · cold · none · instrumented | Click to result ms | 10 | 10 |
| En Reve · Eager reference | startup · startup · mobile · cold · none · instrumented | Click to frame ms | 10 | 10 |
| En Reve · Eager reference | startup · startup · mobile · cold · none · instrumented | First input delay ms | 5 | 10 |
| En Reve · Deferred construction | startup · startup · mobile · cold · none · instrumented | Control observed ms | 10 | 10 |
| En Reve · Deferred construction | startup · startup · mobile · cold · none · instrumented | Click from navigation ms | 10 | 10 |
| En Reve · Deferred construction | startup · startup · mobile · cold · none · instrumented | Result from navigation ms | 10 | 10 |
| En Reve · Deferred construction | startup · startup · mobile · cold · none · instrumented | Result p75 ms | 10 | 10 |
| En Reve · Deferred construction | startup · startup · mobile · cold · none · instrumented | Dispatch overhead ms | 10 | 10 |
| En Reve · Deferred construction | startup · startup · mobile · cold · none · instrumented | Discovery probe ms | 10 | 10 |
| En Reve · Deferred construction | startup · startup · mobile · cold · none · instrumented | Click to result ms | 10 | 10 |
| En Reve · Deferred construction | startup · startup · mobile · cold · none · instrumented | Click to frame ms | 10 | 10 |
| En Reve · Deferred construction | startup · startup · mobile · cold · none · instrumented | First input delay ms | 7 | 10 |
| En Reve · Deferred code + construction | startup · startup · mobile · cold · none · instrumented | Control observed ms | 10 | 10 |
| En Reve · Deferred code + construction | startup · startup · mobile · cold · none · instrumented | Click from navigation ms | 10 | 10 |
| En Reve · Deferred code + construction | startup · startup · mobile · cold · none · instrumented | Result from navigation ms | 10 | 10 |
| En Reve · Deferred code + construction | startup · startup · mobile · cold · none · instrumented | Result p75 ms | 10 | 10 |
| En Reve · Deferred code + construction | startup · startup · mobile · cold · none · instrumented | Dispatch overhead ms | 10 | 10 |
| En Reve · Deferred code + construction | startup · startup · mobile · cold · none · instrumented | Discovery probe ms | 10 | 10 |
| En Reve · Deferred code + construction | startup · startup · mobile · cold · none · instrumented | Click to result ms | 10 | 10 |
| En Reve · Deferred code + construction | startup · startup · mobile · cold · none · instrumented | Click to frame ms | 10 | 10 |
| En Reve · Deferred code + construction | startup · startup · mobile · cold · none · instrumented | First input delay ms | 5 | 10 |
| En Reve · Eager reference | startup · transfer · mobile · cold · none · instrumented | Total response KiB | 10 | 10 |
| En Reve · Eager reference | startup · transfer · mobile · cold · none · instrumented | HTML KiB | 10 | 10 |
| En Reve · Eager reference | startup · transfer · mobile · cold · none · instrumented | JS KiB | 10 | 10 |
| En Reve · Eager reference | startup · transfer · mobile · cold · none · instrumented | CSS KiB | 10 | 10 |
| En Reve · Eager reference | startup · transfer · mobile · cold · none · instrumented | Fonts KiB | 10 | 10 |
| En Reve · Eager reference | startup · transfer · mobile · cold · none · instrumented | Other KiB | 10 | 10 |
| En Reve · Eager reference | startup · transfer · mobile · cold · none · instrumented | HTTP responses | 10 | 10 |
| En Reve · Eager reference | startup · transfer · mobile · cold · none · instrumented | Cache reuse entries | 10 | 10 |
| En Reve · Eager reference | startup · transfer · mobile · cold · none · instrumented | Incomplete responses | 10 | 10 |
| En Reve · Deferred construction | startup · transfer · mobile · cold · none · instrumented | Total response KiB | 10 | 10 |
| En Reve · Deferred construction | startup · transfer · mobile · cold · none · instrumented | HTML KiB | 10 | 10 |
| En Reve · Deferred construction | startup · transfer · mobile · cold · none · instrumented | JS KiB | 10 | 10 |
| En Reve · Deferred construction | startup · transfer · mobile · cold · none · instrumented | CSS KiB | 10 | 10 |
| En Reve · Deferred construction | startup · transfer · mobile · cold · none · instrumented | Fonts KiB | 10 | 10 |
| En Reve · Deferred construction | startup · transfer · mobile · cold · none · instrumented | Other KiB | 10 | 10 |
| En Reve · Deferred construction | startup · transfer · mobile · cold · none · instrumented | HTTP responses | 10 | 10 |
| En Reve · Deferred construction | startup · transfer · mobile · cold · none · instrumented | Cache reuse entries | 10 | 10 |
| En Reve · Deferred construction | startup · transfer · mobile · cold · none · instrumented | Incomplete responses | 10 | 10 |
| En Reve · Deferred code + construction | startup · transfer · mobile · cold · none · instrumented | Total response KiB | 10 | 10 |
| En Reve · Deferred code + construction | startup · transfer · mobile · cold · none · instrumented | HTML KiB | 10 | 10 |
| En Reve · Deferred code + construction | startup · transfer · mobile · cold · none · instrumented | JS KiB | 10 | 10 |
| En Reve · Deferred code + construction | startup · transfer · mobile · cold · none · instrumented | CSS KiB | 10 | 10 |
| En Reve · Deferred code + construction | startup · transfer · mobile · cold · none · instrumented | Fonts KiB | 10 | 10 |
| En Reve · Deferred code + construction | startup · transfer · mobile · cold · none · instrumented | Other KiB | 10 | 10 |
| En Reve · Deferred code + construction | startup · transfer · mobile · cold · none · instrumented | HTTP responses | 10 | 10 |
| En Reve · Deferred code + construction | startup · transfer · mobile · cold · none · instrumented | Cache reuse entries | 10 | 10 |
| En Reve · Deferred code + construction | startup · transfer · mobile · cold · none · instrumented | Incomplete responses | 10 | 10 |
| En Reve · Eager reference | interactions · interactions · mobile · cold · none · instrumented | Scripted INP ms | 10 | 10 |
| En Reve · Eager reference | interactions · interactions · mobile · cold · none · instrumented | Scripted INP p75 ms | 10 | 10 |
| En Reve · Eager reference | interactions · interactions · mobile · cold · none · instrumented | First input delay ms | 10 | 10 |
| En Reve · Eager reference | interactions · interactions · mobile · cold · none · instrumented | Journey CLS | 10 | 10 |
| En Reve · Eager reference | interactions · interactions · mobile · cold · none · instrumented | Max scroll rAF gap ms | 10 | 10 |
| En Reve · Deferred construction | interactions · interactions · mobile · cold · none · instrumented | Scripted INP ms | 10 | 10 |
| En Reve · Deferred construction | interactions · interactions · mobile · cold · none · instrumented | Scripted INP p75 ms | 10 | 10 |
| En Reve · Deferred construction | interactions · interactions · mobile · cold · none · instrumented | First input delay ms | 10 | 10 |
| En Reve · Deferred construction | interactions · interactions · mobile · cold · none · instrumented | Journey CLS | 10 | 10 |
| En Reve · Deferred construction | interactions · interactions · mobile · cold · none · instrumented | Max scroll rAF gap ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · interactions · mobile · cold · none · instrumented | Scripted INP ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · interactions · mobile · cold · none · instrumented | Scripted INP p75 ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · interactions · mobile · cold · none · instrumented | First input delay ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · interactions · mobile · cold · none · instrumented | Journey CLS | 10 | 10 |
| En Reve · Deferred code + construction | interactions · interactions · mobile · cold · none · instrumented | Max scroll rAF gap ms | 10 | 10 |
| En Reve · Eager reference | interactions · transfer · mobile · cold · none · instrumented | Total response KiB | 10 | 10 |
| En Reve · Eager reference | interactions · transfer · mobile · cold · none · instrumented | HTML KiB | 10 | 10 |
| En Reve · Eager reference | interactions · transfer · mobile · cold · none · instrumented | JS KiB | 10 | 10 |
| En Reve · Eager reference | interactions · transfer · mobile · cold · none · instrumented | CSS KiB | 10 | 10 |
| En Reve · Eager reference | interactions · transfer · mobile · cold · none · instrumented | Fonts KiB | 10 | 10 |
| En Reve · Eager reference | interactions · transfer · mobile · cold · none · instrumented | Other KiB | 10 | 10 |
| En Reve · Eager reference | interactions · transfer · mobile · cold · none · instrumented | HTTP responses | 10 | 10 |
| En Reve · Eager reference | interactions · transfer · mobile · cold · none · instrumented | Cache reuse entries | 10 | 10 |
| En Reve · Eager reference | interactions · transfer · mobile · cold · none · instrumented | Incomplete responses | 10 | 10 |
| En Reve · Deferred construction | interactions · transfer · mobile · cold · none · instrumented | Total response KiB | 10 | 10 |
| En Reve · Deferred construction | interactions · transfer · mobile · cold · none · instrumented | HTML KiB | 10 | 10 |
| En Reve · Deferred construction | interactions · transfer · mobile · cold · none · instrumented | JS KiB | 10 | 10 |
| En Reve · Deferred construction | interactions · transfer · mobile · cold · none · instrumented | CSS KiB | 10 | 10 |
| En Reve · Deferred construction | interactions · transfer · mobile · cold · none · instrumented | Fonts KiB | 10 | 10 |
| En Reve · Deferred construction | interactions · transfer · mobile · cold · none · instrumented | Other KiB | 10 | 10 |
| En Reve · Deferred construction | interactions · transfer · mobile · cold · none · instrumented | HTTP responses | 10 | 10 |
| En Reve · Deferred construction | interactions · transfer · mobile · cold · none · instrumented | Cache reuse entries | 10 | 10 |
| En Reve · Deferred construction | interactions · transfer · mobile · cold · none · instrumented | Incomplete responses | 10 | 10 |
| En Reve · Deferred code + construction | interactions · transfer · mobile · cold · none · instrumented | Total response KiB | 10 | 10 |
| En Reve · Deferred code + construction | interactions · transfer · mobile · cold · none · instrumented | HTML KiB | 10 | 10 |
| En Reve · Deferred code + construction | interactions · transfer · mobile · cold · none · instrumented | JS KiB | 10 | 10 |
| En Reve · Deferred code + construction | interactions · transfer · mobile · cold · none · instrumented | CSS KiB | 10 | 10 |
| En Reve · Deferred code + construction | interactions · transfer · mobile · cold · none · instrumented | Fonts KiB | 10 | 10 |
| En Reve · Deferred code + construction | interactions · transfer · mobile · cold · none · instrumented | Other KiB | 10 | 10 |
| En Reve · Deferred code + construction | interactions · transfer · mobile · cold · none · instrumented | HTTP responses | 10 | 10 |
| En Reve · Deferred code + construction | interactions · transfer · mobile · cold · none · instrumented | Cache reuse entries | 10 | 10 |
| En Reve · Deferred code + construction | interactions · transfer · mobile · cold · none · instrumented | Incomplete responses | 10 | 10 |
| En Reve · Eager reference | interactions · canvas-landscape-first · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Eager reference | interactions · canvas-landscape-first · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · canvas-landscape-first · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · canvas-landscape-first · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · canvas-landscape-first · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · canvas-landscape-first · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Eager reference | interactions · canvas-portrait-first · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Eager reference | interactions · canvas-portrait-first · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · canvas-portrait-first · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · canvas-portrait-first · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · canvas-portrait-first · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · canvas-portrait-first · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Eager reference | interactions · asset-add-first · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Eager reference | interactions · asset-add-first · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · asset-add-first · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · asset-add-first · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · asset-add-first · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · asset-add-first · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Eager reference | interactions · asset-reset-first · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Eager reference | interactions · asset-reset-first · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · asset-reset-first · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · asset-reset-first · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · asset-reset-first · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · asset-reset-first · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Eager reference | interactions · dialog-open-first · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Eager reference | interactions · dialog-open-first · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · dialog-open-first · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · dialog-open-first · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · dialog-open-first · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · dialog-open-first · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Eager reference | interactions · canvas-landscape-warm · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Eager reference | interactions · canvas-landscape-warm · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · canvas-landscape-warm · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · canvas-landscape-warm · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · canvas-landscape-warm · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · canvas-landscape-warm · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Eager reference | interactions · canvas-portrait-warm · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Eager reference | interactions · canvas-portrait-warm · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · canvas-portrait-warm · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · canvas-portrait-warm · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · canvas-portrait-warm · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · canvas-portrait-warm · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Eager reference | interactions · asset-add-warm · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Eager reference | interactions · asset-add-warm · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · asset-add-warm · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · asset-add-warm · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · asset-add-warm · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · asset-add-warm · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Eager reference | interactions · asset-reset-warm · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Eager reference | interactions · asset-reset-warm · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · asset-reset-warm · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · asset-reset-warm · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · asset-reset-warm · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · asset-reset-warm · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Eager reference | interactions · dialog-open-warm · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Eager reference | interactions · dialog-open-warm · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · dialog-open-warm · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · dialog-open-warm · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · dialog-open-warm · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · dialog-open-warm · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Eager reference | interactions · review-submit · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Eager reference | interactions · review-submit · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · review-submit · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · review-submit · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · review-submit · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · review-submit · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Eager reference | interactions · commands-first · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Eager reference | interactions · commands-first · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · commands-first · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred construction | interactions · commands-first · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · commands-first · mobile · cold · none · instrumented | semanticMs ms | 10 | 10 |
| En Reve · Deferred code + construction | interactions · commands-first · mobile · cold · none · instrumented | frameOpportunityMs ms | 10 | 10 |
| En Reve · Eager reference | calendar · Calendar focus · desktop · cold · none · instrumented | First focus ms | 10 | 10 |
| En Reve · Eager reference | calendar · Calendar focus · desktop · cold · none · instrumented | First frame opportunity ms | 10 | 10 |
| En Reve · Eager reference | calendar · Calendar focus · desktop · cold · none · instrumented | Repeated focus ms | 10 | 10 |
| En Reve · Eager reference | calendar · Calendar focus · desktop · cold · none · instrumented | Preparation to focus ms | 0 | 10 |
| En Reve · Deferred construction | calendar · Calendar focus · desktop · cold · none · instrumented | First focus ms | 10 | 10 |
| En Reve · Deferred construction | calendar · Calendar focus · desktop · cold · none · instrumented | First frame opportunity ms | 10 | 10 |
| En Reve · Deferred construction | calendar · Calendar focus · desktop · cold · none · instrumented | Repeated focus ms | 10 | 10 |
| En Reve · Deferred construction | calendar · Calendar focus · desktop · cold · none · instrumented | Preparation to focus ms | 0 | 10 |
| En Reve · Deferred code + construction | calendar · Calendar focus · desktop · cold · none · instrumented | First focus ms | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Calendar focus · desktop · cold · none · instrumented | First frame opportunity ms | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Calendar focus · desktop · cold · none · instrumented | Repeated focus ms | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Calendar focus · desktop · cold · none · instrumented | Preparation to focus ms | 0 | 10 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | before total nodes | 10 | 10 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | before total elements | 10 | 10 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | before date nodes | 10 | 10 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | before date elements | 10 | 10 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | before withoutDate nodes | 10 | 10 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | before withoutDate elements | 10 | 10 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | opened total nodes | 10 | 10 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | opened total elements | 10 | 10 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | opened date nodes | 10 | 10 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | opened date elements | 10 | 10 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | opened withoutDate nodes | 10 | 10 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | opened withoutDate elements | 10 | 10 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | closed total nodes | 10 | 10 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | closed total elements | 10 | 10 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | closed date nodes | 10 | 10 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | closed date elements | 10 | 10 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | closed withoutDate nodes | 10 | 10 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | closed withoutDate elements | 10 | 10 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | before total nodes | 10 | 10 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | before total elements | 10 | 10 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | before date nodes | 10 | 10 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | before date elements | 10 | 10 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | before withoutDate nodes | 10 | 10 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | before withoutDate elements | 10 | 10 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | opened total nodes | 10 | 10 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | opened total elements | 10 | 10 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | opened date nodes | 10 | 10 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | opened date elements | 10 | 10 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | opened withoutDate nodes | 10 | 10 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | opened withoutDate elements | 10 | 10 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | closed total nodes | 10 | 10 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | closed total elements | 10 | 10 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | closed date nodes | 10 | 10 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | closed date elements | 10 | 10 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | closed withoutDate nodes | 10 | 10 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | closed withoutDate elements | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | before total nodes | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | before total elements | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | before date nodes | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | before date elements | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | before withoutDate nodes | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | before withoutDate elements | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | opened total nodes | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | opened total elements | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | opened date nodes | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | opened date elements | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | opened withoutDate nodes | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | opened withoutDate elements | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | closed total nodes | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | closed total elements | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | closed date nodes | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | closed date elements | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | closed withoutDate nodes | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · desktop · cold · none · instrumented | closed withoutDate elements | 10 | 10 |
| En Reve · Eager reference | calendar · Calendar response transfer · desktop · cold · none · instrumented | Total response KiB | 10 | 10 |
| En Reve · Eager reference | calendar · Calendar response transfer · desktop · cold · none · instrumented | HTML KiB | 10 | 10 |
| En Reve · Eager reference | calendar · Calendar response transfer · desktop · cold · none · instrumented | JS KiB | 10 | 10 |
| En Reve · Eager reference | calendar · Calendar response transfer · desktop · cold · none · instrumented | CSS KiB | 10 | 10 |
| En Reve · Eager reference | calendar · Calendar response transfer · desktop · cold · none · instrumented | Fonts KiB | 10 | 10 |
| En Reve · Eager reference | calendar · Calendar response transfer · desktop · cold · none · instrumented | Other KiB | 10 | 10 |
| En Reve · Eager reference | calendar · Calendar response transfer · desktop · cold · none · instrumented | HTTP responses | 10 | 10 |
| En Reve · Eager reference | calendar · Calendar response transfer · desktop · cold · none · instrumented | Cache reuse entries | 10 | 10 |
| En Reve · Eager reference | calendar · Calendar response transfer · desktop · cold · none · instrumented | Incomplete responses | 10 | 10 |
| En Reve · Deferred construction | calendar · Calendar response transfer · desktop · cold · none · instrumented | Total response KiB | 10 | 10 |
| En Reve · Deferred construction | calendar · Calendar response transfer · desktop · cold · none · instrumented | HTML KiB | 10 | 10 |
| En Reve · Deferred construction | calendar · Calendar response transfer · desktop · cold · none · instrumented | JS KiB | 10 | 10 |
| En Reve · Deferred construction | calendar · Calendar response transfer · desktop · cold · none · instrumented | CSS KiB | 10 | 10 |
| En Reve · Deferred construction | calendar · Calendar response transfer · desktop · cold · none · instrumented | Fonts KiB | 10 | 10 |
| En Reve · Deferred construction | calendar · Calendar response transfer · desktop · cold · none · instrumented | Other KiB | 10 | 10 |
| En Reve · Deferred construction | calendar · Calendar response transfer · desktop · cold · none · instrumented | HTTP responses | 10 | 10 |
| En Reve · Deferred construction | calendar · Calendar response transfer · desktop · cold · none · instrumented | Cache reuse entries | 10 | 10 |
| En Reve · Deferred construction | calendar · Calendar response transfer · desktop · cold · none · instrumented | Incomplete responses | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Calendar response transfer · desktop · cold · none · instrumented | Total response KiB | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Calendar response transfer · desktop · cold · none · instrumented | HTML KiB | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Calendar response transfer · desktop · cold · none · instrumented | JS KiB | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Calendar response transfer · desktop · cold · none · instrumented | CSS KiB | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Calendar response transfer · desktop · cold · none · instrumented | Fonts KiB | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Calendar response transfer · desktop · cold · none · instrumented | Other KiB | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Calendar response transfer · desktop · cold · none · instrumented | HTTP responses | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Calendar response transfer · desktop · cold · none · instrumented | Cache reuse entries | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Calendar response transfer · desktop · cold · none · instrumented | Incomplete responses | 10 | 10 |
| En Reve · Eager reference | calendar · Calendar focus · mobile · cold · none · instrumented | First focus ms | 30 | 30 |
| En Reve · Eager reference | calendar · Calendar focus · mobile · cold · none · instrumented | First frame opportunity ms | 30 | 30 |
| En Reve · Eager reference | calendar · Calendar focus · mobile · cold · none · instrumented | Repeated focus ms | 30 | 30 |
| En Reve · Eager reference | calendar · Calendar focus · mobile · cold · none · instrumented | Preparation to focus ms | 0 | 30 |
| En Reve · Deferred construction | calendar · Calendar focus · mobile · cold · none · instrumented | First focus ms | 30 | 30 |
| En Reve · Deferred construction | calendar · Calendar focus · mobile · cold · none · instrumented | First frame opportunity ms | 30 | 30 |
| En Reve · Deferred construction | calendar · Calendar focus · mobile · cold · none · instrumented | Repeated focus ms | 30 | 30 |
| En Reve · Deferred construction | calendar · Calendar focus · mobile · cold · none · instrumented | Preparation to focus ms | 0 | 30 |
| En Reve · Deferred code + construction | calendar · Calendar focus · mobile · cold · none · instrumented | First focus ms | 30 | 30 |
| En Reve · Deferred code + construction | calendar · Calendar focus · mobile · cold · none · instrumented | First frame opportunity ms | 30 | 30 |
| En Reve · Deferred code + construction | calendar · Calendar focus · mobile · cold · none · instrumented | Repeated focus ms | 30 | 30 |
| En Reve · Deferred code + construction | calendar · Calendar focus · mobile · cold · none · instrumented | Preparation to focus ms | 0 | 30 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | before total nodes | 30 | 30 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | before total elements | 30 | 30 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | before date nodes | 30 | 30 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | before date elements | 30 | 30 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | before withoutDate nodes | 30 | 30 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | before withoutDate elements | 30 | 30 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | opened total nodes | 30 | 30 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | opened total elements | 30 | 30 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | opened date nodes | 30 | 30 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | opened date elements | 30 | 30 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | opened withoutDate nodes | 30 | 30 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | opened withoutDate elements | 30 | 30 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | closed total nodes | 30 | 30 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | closed total elements | 30 | 30 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | closed date nodes | 30 | 30 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | closed date elements | 30 | 30 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | closed withoutDate nodes | 30 | 30 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | closed withoutDate elements | 30 | 30 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | before total nodes | 30 | 30 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | before total elements | 30 | 30 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | before date nodes | 30 | 30 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | before date elements | 30 | 30 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | before withoutDate nodes | 30 | 30 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | before withoutDate elements | 30 | 30 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | opened total nodes | 30 | 30 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | opened total elements | 30 | 30 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | opened date nodes | 30 | 30 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | opened date elements | 30 | 30 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | opened withoutDate nodes | 30 | 30 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | opened withoutDate elements | 30 | 30 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | closed total nodes | 30 | 30 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | closed total elements | 30 | 30 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | closed date nodes | 30 | 30 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | closed date elements | 30 | 30 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | closed withoutDate nodes | 30 | 30 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | closed withoutDate elements | 30 | 30 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | before total nodes | 30 | 30 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | before total elements | 30 | 30 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | before date nodes | 30 | 30 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | before date elements | 30 | 30 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | before withoutDate nodes | 30 | 30 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | before withoutDate elements | 30 | 30 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | opened total nodes | 30 | 30 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | opened total elements | 30 | 30 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | opened date nodes | 30 | 30 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | opened date elements | 30 | 30 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | opened withoutDate nodes | 30 | 30 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | opened withoutDate elements | 30 | 30 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | closed total nodes | 30 | 30 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | closed total elements | 30 | 30 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | closed date nodes | 30 | 30 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | closed date elements | 30 | 30 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | closed withoutDate nodes | 30 | 30 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · none · instrumented | closed withoutDate elements | 30 | 30 |
| En Reve · Eager reference | calendar · Calendar response transfer · mobile · cold · none · instrumented | Total response KiB | 30 | 30 |
| En Reve · Eager reference | calendar · Calendar response transfer · mobile · cold · none · instrumented | HTML KiB | 30 | 30 |
| En Reve · Eager reference | calendar · Calendar response transfer · mobile · cold · none · instrumented | JS KiB | 30 | 30 |
| En Reve · Eager reference | calendar · Calendar response transfer · mobile · cold · none · instrumented | CSS KiB | 30 | 30 |
| En Reve · Eager reference | calendar · Calendar response transfer · mobile · cold · none · instrumented | Fonts KiB | 30 | 30 |
| En Reve · Eager reference | calendar · Calendar response transfer · mobile · cold · none · instrumented | Other KiB | 30 | 30 |
| En Reve · Eager reference | calendar · Calendar response transfer · mobile · cold · none · instrumented | HTTP responses | 30 | 30 |
| En Reve · Eager reference | calendar · Calendar response transfer · mobile · cold · none · instrumented | Cache reuse entries | 30 | 30 |
| En Reve · Eager reference | calendar · Calendar response transfer · mobile · cold · none · instrumented | Incomplete responses | 30 | 30 |
| En Reve · Deferred construction | calendar · Calendar response transfer · mobile · cold · none · instrumented | Total response KiB | 30 | 30 |
| En Reve · Deferred construction | calendar · Calendar response transfer · mobile · cold · none · instrumented | HTML KiB | 30 | 30 |
| En Reve · Deferred construction | calendar · Calendar response transfer · mobile · cold · none · instrumented | JS KiB | 30 | 30 |
| En Reve · Deferred construction | calendar · Calendar response transfer · mobile · cold · none · instrumented | CSS KiB | 30 | 30 |
| En Reve · Deferred construction | calendar · Calendar response transfer · mobile · cold · none · instrumented | Fonts KiB | 30 | 30 |
| En Reve · Deferred construction | calendar · Calendar response transfer · mobile · cold · none · instrumented | Other KiB | 30 | 30 |
| En Reve · Deferred construction | calendar · Calendar response transfer · mobile · cold · none · instrumented | HTTP responses | 30 | 30 |
| En Reve · Deferred construction | calendar · Calendar response transfer · mobile · cold · none · instrumented | Cache reuse entries | 30 | 30 |
| En Reve · Deferred construction | calendar · Calendar response transfer · mobile · cold · none · instrumented | Incomplete responses | 30 | 30 |
| En Reve · Deferred code + construction | calendar · Calendar response transfer · mobile · cold · none · instrumented | Total response KiB | 30 | 30 |
| En Reve · Deferred code + construction | calendar · Calendar response transfer · mobile · cold · none · instrumented | HTML KiB | 30 | 30 |
| En Reve · Deferred code + construction | calendar · Calendar response transfer · mobile · cold · none · instrumented | JS KiB | 30 | 30 |
| En Reve · Deferred code + construction | calendar · Calendar response transfer · mobile · cold · none · instrumented | CSS KiB | 30 | 30 |
| En Reve · Deferred code + construction | calendar · Calendar response transfer · mobile · cold · none · instrumented | Fonts KiB | 30 | 30 |
| En Reve · Deferred code + construction | calendar · Calendar response transfer · mobile · cold · none · instrumented | Other KiB | 30 | 30 |
| En Reve · Deferred code + construction | calendar · Calendar response transfer · mobile · cold · none · instrumented | HTTP responses | 30 | 30 |
| En Reve · Deferred code + construction | calendar · Calendar response transfer · mobile · cold · none · instrumented | Cache reuse entries | 30 | 30 |
| En Reve · Deferred code + construction | calendar · Calendar response transfer · mobile · cold · none · instrumented | Incomplete responses | 30 | 30 |
| En Reve · Eager reference | calendar · Calendar focus · mobile · cold · ready · instrumented | First focus ms | 0 | 0 |
| En Reve · Eager reference | calendar · Calendar focus · mobile · cold · ready · instrumented | First frame opportunity ms | 0 | 0 |
| En Reve · Eager reference | calendar · Calendar focus · mobile · cold · ready · instrumented | Repeated focus ms | 0 | 0 |
| En Reve · Eager reference | calendar · Calendar focus · mobile · cold · ready · instrumented | Preparation to focus ms | 0 | 0 |
| En Reve · Deferred construction | calendar · Calendar focus · mobile · cold · ready · instrumented | First focus ms | 0 | 0 |
| En Reve · Deferred construction | calendar · Calendar focus · mobile · cold · ready · instrumented | First frame opportunity ms | 0 | 0 |
| En Reve · Deferred construction | calendar · Calendar focus · mobile · cold · ready · instrumented | Repeated focus ms | 0 | 0 |
| En Reve · Deferred construction | calendar · Calendar focus · mobile · cold · ready · instrumented | Preparation to focus ms | 0 | 0 |
| En Reve · Deferred code + construction | calendar · Calendar focus · mobile · cold · ready · instrumented | First focus ms | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Calendar focus · mobile · cold · ready · instrumented | First frame opportunity ms | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Calendar focus · mobile · cold · ready · instrumented | Repeated focus ms | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Calendar focus · mobile · cold · ready · instrumented | Preparation to focus ms | 10 | 10 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | before total nodes | 0 | 0 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | before total elements | 0 | 0 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | before date nodes | 0 | 0 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | before date elements | 0 | 0 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | before withoutDate nodes | 0 | 0 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | before withoutDate elements | 0 | 0 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | opened total nodes | 0 | 0 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | opened total elements | 0 | 0 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | opened date nodes | 0 | 0 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | opened date elements | 0 | 0 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | opened withoutDate nodes | 0 | 0 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | opened withoutDate elements | 0 | 0 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | closed total nodes | 0 | 0 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | closed total elements | 0 | 0 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | closed date nodes | 0 | 0 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | closed date elements | 0 | 0 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | closed withoutDate nodes | 0 | 0 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | closed withoutDate elements | 0 | 0 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | before total nodes | 0 | 0 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | before total elements | 0 | 0 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | before date nodes | 0 | 0 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | before date elements | 0 | 0 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | before withoutDate nodes | 0 | 0 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | before withoutDate elements | 0 | 0 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | opened total nodes | 0 | 0 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | opened total elements | 0 | 0 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | opened date nodes | 0 | 0 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | opened date elements | 0 | 0 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | opened withoutDate nodes | 0 | 0 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | opened withoutDate elements | 0 | 0 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | closed total nodes | 0 | 0 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | closed total elements | 0 | 0 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | closed date nodes | 0 | 0 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | closed date elements | 0 | 0 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | closed withoutDate nodes | 0 | 0 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | closed withoutDate elements | 0 | 0 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | before total nodes | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | before total elements | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | before date nodes | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | before date elements | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | before withoutDate nodes | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | before withoutDate elements | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | opened total nodes | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | opened total elements | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | opened date nodes | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | opened date elements | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | opened withoutDate nodes | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | opened withoutDate elements | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | closed total nodes | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | closed total elements | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | closed date nodes | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | closed date elements | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | closed withoutDate nodes | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · ready · instrumented | closed withoutDate elements | 10 | 10 |
| En Reve · Eager reference | calendar · Calendar response transfer · mobile · cold · ready · instrumented | Total response KiB | 0 | 0 |
| En Reve · Eager reference | calendar · Calendar response transfer · mobile · cold · ready · instrumented | HTML KiB | 0 | 0 |
| En Reve · Eager reference | calendar · Calendar response transfer · mobile · cold · ready · instrumented | JS KiB | 0 | 0 |
| En Reve · Eager reference | calendar · Calendar response transfer · mobile · cold · ready · instrumented | CSS KiB | 0 | 0 |
| En Reve · Eager reference | calendar · Calendar response transfer · mobile · cold · ready · instrumented | Fonts KiB | 0 | 0 |
| En Reve · Eager reference | calendar · Calendar response transfer · mobile · cold · ready · instrumented | Other KiB | 0 | 0 |
| En Reve · Eager reference | calendar · Calendar response transfer · mobile · cold · ready · instrumented | HTTP responses | 0 | 0 |
| En Reve · Eager reference | calendar · Calendar response transfer · mobile · cold · ready · instrumented | Cache reuse entries | 0 | 0 |
| En Reve · Eager reference | calendar · Calendar response transfer · mobile · cold · ready · instrumented | Incomplete responses | 0 | 0 |
| En Reve · Deferred construction | calendar · Calendar response transfer · mobile · cold · ready · instrumented | Total response KiB | 0 | 0 |
| En Reve · Deferred construction | calendar · Calendar response transfer · mobile · cold · ready · instrumented | HTML KiB | 0 | 0 |
| En Reve · Deferred construction | calendar · Calendar response transfer · mobile · cold · ready · instrumented | JS KiB | 0 | 0 |
| En Reve · Deferred construction | calendar · Calendar response transfer · mobile · cold · ready · instrumented | CSS KiB | 0 | 0 |
| En Reve · Deferred construction | calendar · Calendar response transfer · mobile · cold · ready · instrumented | Fonts KiB | 0 | 0 |
| En Reve · Deferred construction | calendar · Calendar response transfer · mobile · cold · ready · instrumented | Other KiB | 0 | 0 |
| En Reve · Deferred construction | calendar · Calendar response transfer · mobile · cold · ready · instrumented | HTTP responses | 0 | 0 |
| En Reve · Deferred construction | calendar · Calendar response transfer · mobile · cold · ready · instrumented | Cache reuse entries | 0 | 0 |
| En Reve · Deferred construction | calendar · Calendar response transfer · mobile · cold · ready · instrumented | Incomplete responses | 0 | 0 |
| En Reve · Deferred code + construction | calendar · Calendar response transfer · mobile · cold · ready · instrumented | Total response KiB | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Calendar response transfer · mobile · cold · ready · instrumented | HTML KiB | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Calendar response transfer · mobile · cold · ready · instrumented | JS KiB | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Calendar response transfer · mobile · cold · ready · instrumented | CSS KiB | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Calendar response transfer · mobile · cold · ready · instrumented | Fonts KiB | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Calendar response transfer · mobile · cold · ready · instrumented | Other KiB | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Calendar response transfer · mobile · cold · ready · instrumented | HTTP responses | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Calendar response transfer · mobile · cold · ready · instrumented | Cache reuse entries | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Calendar response transfer · mobile · cold · ready · instrumented | Incomplete responses | 10 | 10 |
| En Reve · Eager reference | calendar · Calendar focus · mobile · cold · pending · instrumented | First focus ms | 0 | 0 |
| En Reve · Eager reference | calendar · Calendar focus · mobile · cold · pending · instrumented | First frame opportunity ms | 0 | 0 |
| En Reve · Eager reference | calendar · Calendar focus · mobile · cold · pending · instrumented | Repeated focus ms | 0 | 0 |
| En Reve · Eager reference | calendar · Calendar focus · mobile · cold · pending · instrumented | Preparation to focus ms | 0 | 0 |
| En Reve · Deferred construction | calendar · Calendar focus · mobile · cold · pending · instrumented | First focus ms | 0 | 0 |
| En Reve · Deferred construction | calendar · Calendar focus · mobile · cold · pending · instrumented | First frame opportunity ms | 0 | 0 |
| En Reve · Deferred construction | calendar · Calendar focus · mobile · cold · pending · instrumented | Repeated focus ms | 0 | 0 |
| En Reve · Deferred construction | calendar · Calendar focus · mobile · cold · pending · instrumented | Preparation to focus ms | 0 | 0 |
| En Reve · Deferred code + construction | calendar · Calendar focus · mobile · cold · pending · instrumented | First focus ms | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Calendar focus · mobile · cold · pending · instrumented | First frame opportunity ms | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Calendar focus · mobile · cold · pending · instrumented | Repeated focus ms | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Calendar focus · mobile · cold · pending · instrumented | Preparation to focus ms | 10 | 10 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | before total nodes | 0 | 0 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | before total elements | 0 | 0 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | before date nodes | 0 | 0 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | before date elements | 0 | 0 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | before withoutDate nodes | 0 | 0 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | before withoutDate elements | 0 | 0 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | opened total nodes | 0 | 0 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | opened total elements | 0 | 0 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | opened date nodes | 0 | 0 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | opened date elements | 0 | 0 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | opened withoutDate nodes | 0 | 0 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | opened withoutDate elements | 0 | 0 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | closed total nodes | 0 | 0 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | closed total elements | 0 | 0 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | closed date nodes | 0 | 0 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | closed date elements | 0 | 0 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | closed withoutDate nodes | 0 | 0 |
| En Reve · Eager reference | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | closed withoutDate elements | 0 | 0 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | before total nodes | 0 | 0 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | before total elements | 0 | 0 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | before date nodes | 0 | 0 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | before date elements | 0 | 0 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | before withoutDate nodes | 0 | 0 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | before withoutDate elements | 0 | 0 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | opened total nodes | 0 | 0 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | opened total elements | 0 | 0 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | opened date nodes | 0 | 0 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | opened date elements | 0 | 0 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | opened withoutDate nodes | 0 | 0 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | opened withoutDate elements | 0 | 0 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | closed total nodes | 0 | 0 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | closed total elements | 0 | 0 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | closed date nodes | 0 | 0 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | closed date elements | 0 | 0 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | closed withoutDate nodes | 0 | 0 |
| En Reve · Deferred construction | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | closed withoutDate elements | 0 | 0 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | before total nodes | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | before total elements | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | before date nodes | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | before date elements | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | before withoutDate nodes | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | before withoutDate elements | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | opened total nodes | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | opened total elements | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | opened date nodes | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | opened date elements | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | opened withoutDate nodes | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | opened withoutDate elements | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | closed total nodes | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | closed total elements | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | closed date nodes | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | closed date elements | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | closed withoutDate nodes | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Connected DOM with and without date · mobile · cold · pending · instrumented | closed withoutDate elements | 10 | 10 |
| En Reve · Eager reference | calendar · Calendar response transfer · mobile · cold · pending · instrumented | Total response KiB | 0 | 0 |
| En Reve · Eager reference | calendar · Calendar response transfer · mobile · cold · pending · instrumented | HTML KiB | 0 | 0 |
| En Reve · Eager reference | calendar · Calendar response transfer · mobile · cold · pending · instrumented | JS KiB | 0 | 0 |
| En Reve · Eager reference | calendar · Calendar response transfer · mobile · cold · pending · instrumented | CSS KiB | 0 | 0 |
| En Reve · Eager reference | calendar · Calendar response transfer · mobile · cold · pending · instrumented | Fonts KiB | 0 | 0 |
| En Reve · Eager reference | calendar · Calendar response transfer · mobile · cold · pending · instrumented | Other KiB | 0 | 0 |
| En Reve · Eager reference | calendar · Calendar response transfer · mobile · cold · pending · instrumented | HTTP responses | 0 | 0 |
| En Reve · Eager reference | calendar · Calendar response transfer · mobile · cold · pending · instrumented | Cache reuse entries | 0 | 0 |
| En Reve · Eager reference | calendar · Calendar response transfer · mobile · cold · pending · instrumented | Incomplete responses | 0 | 0 |
| En Reve · Deferred construction | calendar · Calendar response transfer · mobile · cold · pending · instrumented | Total response KiB | 0 | 0 |
| En Reve · Deferred construction | calendar · Calendar response transfer · mobile · cold · pending · instrumented | HTML KiB | 0 | 0 |
| En Reve · Deferred construction | calendar · Calendar response transfer · mobile · cold · pending · instrumented | JS KiB | 0 | 0 |
| En Reve · Deferred construction | calendar · Calendar response transfer · mobile · cold · pending · instrumented | CSS KiB | 0 | 0 |
| En Reve · Deferred construction | calendar · Calendar response transfer · mobile · cold · pending · instrumented | Fonts KiB | 0 | 0 |
| En Reve · Deferred construction | calendar · Calendar response transfer · mobile · cold · pending · instrumented | Other KiB | 0 | 0 |
| En Reve · Deferred construction | calendar · Calendar response transfer · mobile · cold · pending · instrumented | HTTP responses | 0 | 0 |
| En Reve · Deferred construction | calendar · Calendar response transfer · mobile · cold · pending · instrumented | Cache reuse entries | 0 | 0 |
| En Reve · Deferred construction | calendar · Calendar response transfer · mobile · cold · pending · instrumented | Incomplete responses | 0 | 0 |
| En Reve · Deferred code + construction | calendar · Calendar response transfer · mobile · cold · pending · instrumented | Total response KiB | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Calendar response transfer · mobile · cold · pending · instrumented | HTML KiB | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Calendar response transfer · mobile · cold · pending · instrumented | JS KiB | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Calendar response transfer · mobile · cold · pending · instrumented | CSS KiB | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Calendar response transfer · mobile · cold · pending · instrumented | Fonts KiB | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Calendar response transfer · mobile · cold · pending · instrumented | Other KiB | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Calendar response transfer · mobile · cold · pending · instrumented | HTTP responses | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Calendar response transfer · mobile · cold · pending · instrumented | Cache reuse entries | 10 | 10 |
| En Reve · Deferred code + construction | calendar · Calendar response transfer · mobile · cold · pending · instrumented | Incomplete responses | 10 | 10 |
| En Reve · Eager reference | lighthouse · lighthouse · mobile · cold · none · instrumented | FCP ms | 5 | 5 |
| En Reve · Eager reference | lighthouse · lighthouse · mobile · cold · none · instrumented | LCP ms | 5 | 5 |
| En Reve · Eager reference | lighthouse · lighthouse · mobile · cold · none · instrumented | LCP p75 ms | 5 | 5 |
| En Reve · Eager reference | lighthouse · lighthouse · mobile · cold · none · instrumented | LCP max ms | 5 | 5 |
| En Reve · Eager reference | lighthouse · lighthouse · mobile · cold · none · instrumented | TBT ms | 5 | 5 |
| En Reve · Eager reference | lighthouse · lighthouse · mobile · cold · none · instrumented | TBT p75 ms | 5 | 5 |
| En Reve · Eager reference | lighthouse · lighthouse · mobile · cold · none · instrumented | TBT max ms | 5 | 5 |
| En Reve · Eager reference | lighthouse · lighthouse · mobile · cold · none · instrumented | Speed Index ms | 5 | 5 |
| En Reve · Eager reference | lighthouse · lighthouse · mobile · cold · none · instrumented | CLS | 5 | 5 |
| En Reve · Deferred construction | lighthouse · lighthouse · mobile · cold · none · instrumented | FCP ms | 5 | 5 |
| En Reve · Deferred construction | lighthouse · lighthouse · mobile · cold · none · instrumented | LCP ms | 5 | 5 |
| En Reve · Deferred construction | lighthouse · lighthouse · mobile · cold · none · instrumented | LCP p75 ms | 5 | 5 |
| En Reve · Deferred construction | lighthouse · lighthouse · mobile · cold · none · instrumented | LCP max ms | 5 | 5 |
| En Reve · Deferred construction | lighthouse · lighthouse · mobile · cold · none · instrumented | TBT ms | 5 | 5 |
| En Reve · Deferred construction | lighthouse · lighthouse · mobile · cold · none · instrumented | TBT p75 ms | 5 | 5 |
| En Reve · Deferred construction | lighthouse · lighthouse · mobile · cold · none · instrumented | TBT max ms | 5 | 5 |
| En Reve · Deferred construction | lighthouse · lighthouse · mobile · cold · none · instrumented | Speed Index ms | 5 | 5 |
| En Reve · Deferred construction | lighthouse · lighthouse · mobile · cold · none · instrumented | CLS | 5 | 5 |
| En Reve · Deferred code + construction | lighthouse · lighthouse · mobile · cold · none · instrumented | FCP ms | 5 | 5 |
| En Reve · Deferred code + construction | lighthouse · lighthouse · mobile · cold · none · instrumented | LCP ms | 5 | 5 |
| En Reve · Deferred code + construction | lighthouse · lighthouse · mobile · cold · none · instrumented | LCP p75 ms | 5 | 5 |
| En Reve · Deferred code + construction | lighthouse · lighthouse · mobile · cold · none · instrumented | LCP max ms | 5 | 5 |
| En Reve · Deferred code + construction | lighthouse · lighthouse · mobile · cold · none · instrumented | TBT ms | 5 | 5 |
| En Reve · Deferred code + construction | lighthouse · lighthouse · mobile · cold · none · instrumented | TBT p75 ms | 5 | 5 |
| En Reve · Deferred code + construction | lighthouse · lighthouse · mobile · cold · none · instrumented | TBT max ms | 5 | 5 |
| En Reve · Deferred code + construction | lighthouse · lighthouse · mobile · cold · none · instrumented | Speed Index ms | 5 | 5 |
| En Reve · Deferred code + construction | lighthouse · lighthouse · mobile · cold · none · instrumented | CLS | 5 | 5 |
