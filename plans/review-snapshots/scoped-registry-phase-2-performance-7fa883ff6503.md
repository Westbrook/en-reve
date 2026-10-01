# Performance across scoped-registry Phases 0, 1 and 2

[Open the sortable en-table report](http://127.0.0.1:4200/comparison-fc3b3bd4a73a.html?progress-report). Every change-centric table explains that negative is better and positive is worse. Select Phase 1 vs 0, Phase 2 vs 1, Phase 2 vs 0, or all change columns. All three medians remain visible.

## Findings

Historical Phase 2 activation times are higher than Phase 1: about 2.8–6.4% across Chromium workflows and 9% for light-DOM scaling. WebKit scoped SSO SSR rises by 1.03 ms (10.4%). These captures occurred in separate sessions, so the differences cannot all be attributed to Phase 2 code.

The randomized same-session replay shows smaller shifts in four Chromium settings configurations. Scoped request-to-ready is 77.22 → 77.24 ms. Fifteen of 16 timing intervals include zero; four-instance global activation is the exception at +0.76 ms (+3.0%), with a 95% interval of +0.16 to +1.49 ms. This narrow replay does not clear the light-DOM, WebKit or SSR signals.

Lifecycle node and listener counts are unchanged from Phase 1 and flat from cycle 10 through 100. Median heap growth over those cycles is 0.80–0.88 MB in Phase 2 versus 0.77–0.87 MB in Phase 1. The separate ownership diagnostics also plateau: 73 scoped or 68 global nodes and 13 listeners after warm-up.

These results support stable DOM/listener retention in the measured workloads, not a blanket timing improvement or proof of equivalence. Keep four-instance global activation, light-DOM scaling, WebKit SSR and existing heap growth on the performance watchlist. All measurements passed their functional checks.

## Completed evidence

Each frozen phase has 1,170 successful timing samples (39 configurations × 30) and 15 independent retention runs (three configurations × five). Phase 2 additionally has 360 ownership timing samples (12 configurations × 30), 10 separate ownership retention runs, and 240 randomized same-session replay samples (four settings configurations × 30 paired blocks × two builds). No failed or unsupported sample was accepted; no retries or discarded outliers were used in these captures.

## Same-session replay: Phase 2 minus Phase 1

| Configuration | Metric | Phase 1 median ms | Phase 2 median ms | Change | Delta 95% interval ms |
| --- | --- | ---: | ---: | ---: | --- |
| activation/settings/scoped/shared/chromium/desktop/cold/1/2/shadow/csr | activationMs | 23.09 | 23.40 | +1.38% | -0.22 to +0.97 |
| activation/settings/scoped/shared/chromium/desktop/cold/1/2/shadow/csr | requestToReadyMs | 77.22 | 77.24 | +0.03% | -0.84 to +0.82 |
| activation/settings/scoped/shared/chromium/desktop/cold/1/2/shadow/csr | moduleLoadMs | 24.72 | 24.86 | +0.58% | -0.14 to +0.61 |
| activation/settings/scoped/shared/chromium/desktop/cold/1/2/shadow/csr | workflowActionUpperBoundMs | 38.81 | 39.44 | +1.62% | -0.53 to +1.70 |
| activation/settings/global/shared/chromium/desktop/cold/1/2/shadow/csr | activationMs | 25.20 | 25.03 | -0.65% | -0.36 to +0.76 |
| activation/settings/global/shared/chromium/desktop/cold/1/2/shadow/csr | requestToReadyMs | 76.91 | 76.84 | -0.09% | -0.78 to +0.67 |
| activation/settings/global/shared/chromium/desktop/cold/1/2/shadow/csr | moduleLoadMs | 25.01 | 24.75 | -1.02% | -0.60 to +0.09 |
| activation/settings/global/shared/chromium/desktop/cold/1/2/shadow/csr | workflowActionUpperBoundMs | 39.09 | 39.41 | +0.82% | -0.88 to +1.10 |
| scaling/settings/scoped/shared/chromium/desktop/cold/4/2/shadow/csr | activationMs | 21.80 | 22.30 | +2.29% | -0.04 to +1.02 |
| scaling/settings/scoped/shared/chromium/desktop/cold/4/2/shadow/csr | moduleLoadMs | 18.99 | 19.02 | +0.13% | -0.50 to +0.52 |
| scaling/settings/scoped/shared/chromium/desktop/cold/4/2/shadow/csr | cohortReadinessUpperBoundMs | 56.13 | 55.53 | -1.07% | -11.47 to +2.71 |
| scaling/settings/scoped/shared/chromium/desktop/cold/4/2/shadow/csr | workflowActionUpperBoundMs | 41.04 | 41.19 | +0.37% | -0.27 to +0.73 |
| scaling/settings/global/shared/chromium/desktop/cold/4/2/shadow/csr | activationMs | 25.46 | 26.23 | +2.98% | +0.16 to +1.49 |
| scaling/settings/global/shared/chromium/desktop/cold/4/2/shadow/csr | moduleLoadMs | 18.92 | 18.84 | -0.41% | -0.47 to +0.34 |
| scaling/settings/global/shared/chromium/desktop/cold/4/2/shadow/csr | cohortReadinessUpperBoundMs | 62.22 | 62.02 | -0.32% | -1.03 to +0.92 |
| scaling/settings/global/shared/chromium/desktop/cold/4/2/shadow/csr | workflowActionUpperBoundMs | 40.59 | 41.02 | +1.07% | -0.02 to +0.88 |

Negative changes mean less time (better); positive mean more time (worse). Intervals spanning zero do not prove equivalence. These are exploratory paired bootstrap estimates, without multiple-comparison correction.

## Lifecycle retention

| Configuration | Phase 0 growth bytes | Phase 1 growth bytes | Phase 2 growth bytes | Phase 2 − Phase 1 bytes |
| --- | ---: | ---: | ---: | ---: |
| lifecycle/settings/scoped/instance/chromium/desktop/cold/1/2/shadow/csr | 875164 | 872092 | 881140 | 9048 |
| lifecycle/settings/global/shared/chromium/desktop/cold/1/2/shadow/csr | 767476 | 770192 | 799056 | 28864 |
| lifecycle/settings/scoped/shared/chromium/desktop/cold/1/2/shadow/csr | 853060 | 858160 | 879760 | 21600 |

Growth means each run’s cycle-100 heap minus its cycle-10 heap, summarized by its median. It is not the difference of two independently aggregated checkpoint medians. Negative change means less heap growth (better), positive means more (worse). Inspect the full table for every checkpoint, DOM/listener count, and phase.

## Interpretation and reproducibility

Historical independent-session percentile bootstrap, 2,000 resamples, seed 42; no pairing by arbitrary block number and no multiple-comparison correction. Phase 0 to Phase 1 includes the intended production-adapter fixture change, supported by the separately retained Phase 1 paired replay. Phase 1 to Phase 2 uses identical benchmark instrumentation. Workstation measurements, not field latency or a dedicated idle lab.

Phase 2 remains in the working tree above Phase 1 commit `166e532`. The frozen campaign retains exact measured sources, assets, run schedules, server HTML, dependency locks and browser/host identities. The existing SSR benchmark is not production scoped SSR adoption.

The HTML has 273 rows across five sortable tables. It was checked in Chromium, Firefox and WebKit for source-value mapping, sorting, filters, phase selection, keyboard access and readable no-JS content; Chromium additionally checks offline use, mobile overflow containment and axe WCAG A/AA.

- Comparison data: `artifacts/scoped-registry-phase-2/comparison.json`
- Capture and page verification: `artifacts/scoped-registry-phase-2/performance-verification.json`
- Frozen Phase 2 matched campaign: `showcases/performance/baselines/scoped-registry-phase-2-candidate-v1`
- Frozen ownership baseline: `showcases/performance/baselines/scoped-registry-phase-2-ownership-v1`
- Rebuild the page: `node artifacts/scoped-registry-phase-2/page/build.mjs`
- Restart the page: `node artifacts/scoped-registry-phase-2/page/server.mjs`

All run IDs used here are consumed and must not be reused. Select a new campaign/run ID for another capture. The original Phase 0/1 evidence and Phase 1 comparison page are preserved.
