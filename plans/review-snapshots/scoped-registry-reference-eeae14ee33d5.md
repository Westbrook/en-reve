# Frozen phase-zero scoped-registry reference

The reference is frozen for Phase 1: **1170 successful timing samples across 39 configurations**, with at least 30 per configuration; **15 independent retention runs**, with 5 repetitions per configuration and checkpoints at 0, 10, 50, 100 cycles. Every scheduled sample passed. No failed or unsupported sample was substituted with a timing value.

- Name: `scoped-registry-phase-0-reference-v1`.
- Frozen: 2026-09-21T00:14:38.626Z.
- [Machine-readable baseline](../showcases/performance/baselines/scoped-registry-phase-0-reference-v1/baseline.json).
- [Checksummed inventory](../showcases/performance/baselines/scoped-registry-phase-0-reference-v1/checksums.json).
- External seal, SHA-256 of checksums.json: `8771bb72af6b60a11c0e6eb0220a038ec6b8b6c72e757b4ae6c0bab772c7356b`.
- [Saved campaign plan](../artifacts/scoped-registry-reference/campaign-plan.json).

## Coverage

Previously qualified desktop/cold configurations; Chromium all three workflows and registry scaling/light DOM, WebKit native/auto, Firefox auto global fallback. Native Firefox is unsupported and excluded from successful timing targets.

| Lane | Configurations | Successful samples | Samples per configuration |
| --- | ---: | ---: | ---: |
| workflows (timing) | 18 | 540 | 30 |
| scaling (timing) | 10 | 300 | 30 |
| light (timing) | 2 | 60 | 30 |
| webkit (timing) | 6 | 180 | 30 |
| firefox (timing) | 3 | 90 | 30 |
| retention (retention) | 3 | 15 | 5 |

Browser versions: chromium 153.0.8010.12; webkit 26.6; firefox 155.0. The machine was on AC power at preflight. Power and thermal observations before/after capture are preserved in the frozen campaign directory. This is a serial local-workstation reference, not certification of a dedicated idle lab. Mobile, warm-cache, physical-device and field measurements are outside this reference.

## Timing reference

Values below are medians in milliseconds; baseline.json also preserves n, p75 and range. The key order is scenario / workflow / mode / policy / browser / profile / cache / count / group-size / root / delivery. Activation measures the first island's request through rendered readiness; full request-to-ready includes imports in the activation scenario. Scaling cohort time includes automation overhead. Workflow action time is a semantic-completion upper bound, not INP.

| Configuration | n | Activation | Request to ready | Module import | Cohort upper bound | Workflow action upper bound |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| containment/settings/scoped/shared/chromium/desktop/cold/3/2/shadow/csr | 30 | 21.42 | 21.81 | 18.82 | — | 41.76 |
| activation/settings/global/shared/chromium/desktop/cold/1/2/shadow/csr | 30 | 24.31 | 76.95 | 24.67 | — | 38.84 |
| ssr/sso/scoped/shared/chromium/desktop/cold/1/2/shadow/ssr | 30 | 7.81 | 8.93 | 18.46 | — | 35.65 |
| ssr/sso/global/shared/chromium/desktop/cold/1/2/shadow/ssr | 30 | 7.66 | 8.88 | 18.49 | — | 36.24 |
| containment/sso/scoped/shared/chromium/desktop/cold/3/2/shadow/csr | 30 | 6.90 | 7.42 | 18.66 | — | 40.63 |
| containment/chat/scoped/shared/chromium/desktop/cold/3/2/shadow/csr | 30 | 19.52 | 22.20 | 18.76 | — | 41.17 |
| containment/sso/global/shared/chromium/desktop/cold/3/2/shadow/csr | 30 | 8.17 | 12.35 | 18.78 | — | 38.63 |
| ssr/settings/scoped/shared/chromium/desktop/cold/1/2/shadow/ssr | 30 | 18.81 | 19.04 | 18.66 | — | 46.54 |
| activation/sso/scoped/shared/chromium/desktop/cold/1/2/shadow/csr | 30 | 6.75 | 36.25 | 24.58 | — | 32.92 |
| activation/chat/global/shared/chromium/desktop/cold/1/2/shadow/csr | 30 | 29.99 | 85.57 | 25.00 | — | 43.27 |
| ssr/settings/global/shared/chromium/desktop/cold/1/2/shadow/ssr | 30 | 18.08 | 18.29 | 18.53 | — | 45.65 |
| containment/settings/global/shared/chromium/desktop/cold/3/2/shadow/csr | 30 | 24.97 | 25.22 | 18.63 | — | 44.68 |
| ssr/chat/global/shared/chromium/desktop/cold/1/2/shadow/ssr | 30 | 27.87 | 31.28 | 18.66 | — | 33.96 |
| activation/chat/scoped/shared/chromium/desktop/cold/1/2/shadow/csr | 30 | 20.80 | 86.93 | 24.74 | — | 41.47 |
| ssr/chat/scoped/shared/chromium/desktop/cold/1/2/shadow/ssr | 30 | 28.63 | 31.91 | 18.57 | — | 36.80 |
| containment/chat/global/shared/chromium/desktop/cold/3/2/shadow/csr | 30 | 31.18 | 33.93 | 18.95 | — | 42.90 |
| activation/settings/scoped/shared/chromium/desktop/cold/1/2/shadow/csr | 30 | 22.26 | 77.45 | 24.79 | — | 39.10 |
| activation/sso/global/shared/chromium/desktop/cold/1/2/shadow/csr | 30 | 7.98 | 35.84 | 24.65 | — | 32.92 |
| scaling/settings/global/shared/chromium/desktop/cold/4/2/shadow/csr | 30 | 24.97 | — | 18.54 | 63.44 | 40.87 |
| scaling/settings/scoped/group/chromium/desktop/cold/1/2/shadow/csr | 30 | 20.85 | — | 18.41 | 22.36 | 44.27 |
| scaling/settings/global/shared/chromium/desktop/cold/1/2/shadow/csr | 30 | 24.87 | — | 18.57 | 26.73 | 44.39 |
| scaling/settings/scoped/instance/chromium/desktop/cold/1/2/shadow/csr | 30 | 20.93 | — | 18.46 | 22.45 | 43.63 |
| scaling/settings/scoped/element/chromium/desktop/cold/4/2/shadow/csr | 30 | 30.88 | — | 18.38 | 78.56 | 49.44 |
| scaling/settings/scoped/shared/chromium/desktop/cold/4/2/shadow/csr | 30 | 21.24 | — | 18.60 | 55.71 | 41.24 |
| scaling/settings/scoped/shared/chromium/desktop/cold/1/2/shadow/csr | 30 | 20.99 | — | 18.52 | 22.45 | 43.81 |
| scaling/settings/scoped/instance/chromium/desktop/cold/4/2/shadow/csr | 30 | 21.37 | — | 18.69 | 55.90 | 41.18 |
| scaling/settings/scoped/group/chromium/desktop/cold/4/2/shadow/csr | 30 | 21.45 | — | 18.63 | 56.06 | 41.16 |
| scaling/settings/scoped/element/chromium/desktop/cold/1/2/shadow/csr | 30 | 30.46 | — | 18.47 | 32.01 | 46.69 |
| scaling/settings/scoped/shared/chromium/desktop/cold/1/2/light/csr | 30 | 22.18 | — | 19.38 | 24.04 | 41.64 |
| scaling/settings/global/shared/chromium/desktop/cold/1/2/light/csr | 30 | 26.34 | — | 19.57 | 28.30 | 43.37 |
| activation/sso/scoped/shared/webkit/desktop/cold/1/2/shadow/csr | 30 | 8.42 | 47.85 | 25.30 | — | 59.10 |
| containment/sso/auto/shared/webkit/desktop/cold/3/2/shadow/csr | 30 | 8.89 | 14.03 | 24.96 | — | 58.27 |
| activation/sso/auto/shared/webkit/desktop/cold/1/2/shadow/csr | 30 | 8.38 | 46.95 | 24.90 | — | 53.61 |
| ssr/sso/auto/shared/webkit/desktop/cold/1/2/shadow/ssr | 30 | 9.91 | 13.56 | 25.73 | — | 49.76 |
| ssr/sso/scoped/shared/webkit/desktop/cold/1/2/shadow/ssr | 30 | 10.00 | 13.67 | 25.53 | — | 49.76 |
| containment/sso/scoped/shared/webkit/desktop/cold/3/2/shadow/csr | 30 | 8.96 | 14.79 | 24.89 | — | 54.93 |
| ssr/sso/auto/shared/firefox/desktop/cold/1/2/shadow/ssr | 30 | 15.85 | 15.96 | 50.53 | — | 49.65 |
| activation/sso/auto/shared/firefox/desktop/cold/1/2/shadow/csr | 30 | 12.76 | 78.63 | 58.41 | — | 42.99 |
| containment/sso/auto/shared/firefox/desktop/cold/3/2/shadow/csr | 30 | 16.27 | 16.49 | 50.75 | — | 51.49 |

## Separate retention reference

Each run starts a fresh browser and measures after explicit GC at 0, 10, 50 and 100 mount/use/dispose cycles. Timing collectors are excluded. Shared module and definition memory intentionally remains loaded. Reported registry allocations are cumulative, not live registry counts. Heap growth is a diagnostic observation and does not by itself prove a leak.

| Configuration | Repetitions | Median heap at cycle 10 (bytes) | Median heap at cycle 100 (bytes) | Median within-run growth 10→100 (bytes) | Median DOM nodes at 100 | Median listeners at 100 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| lifecycle/settings/scoped/instance/chromium/desktop/cold/1/2/shadow/csr | 5 | 6746916 | 7623240 | 875164 | 2083 | 150 |
| lifecycle/settings/global/shared/chromium/desktop/cold/1/2/shadow/csr | 5 | 6715612 | 7483088 | 767476 | 2060 | 150 |
| lifecycle/settings/scoped/shared/chromium/desktop/cold/1/2/shadow/csr | 5 | 6737740 | 7592216 | 853060 | 2083 | 150 |

## Integrity and reuse

The reference directory contains the complete run directories: raw samples, schedules/manifests, summaries, exact browser assets and server HTML, measured source copies and harness snapshots. It also contains built workspace packages and dependency locks needed to identify the external SSR dependencies. Data files are read-only. The separate checksum seal above lets you verify the frozen bytes; filesystem permissions alone are not the integrity guarantee.

`node showcases/performance/src/registry-reference.mjs verify showcases/performance/baselines/scoped-registry-phase-0-reference-v1`

For Phase 1, copy the saved lane arguments into new run IDs, retain seeds and all configuration settings, and compare matching full keys. Keep this phase-zero anchor fixed and retain each later phase separately. Compare compatible browser, OS, CPU, Node, profile and measurement-harness identities; use an overlap campaign when instrumentation changes. Source/asset identity is expected to change for the implementation under test. Historical timing comparisons should use independent-session uncertainty estimates and independently confirm material regressions; paired-block comparison is reserved for configurations captured together in one lane. Do not compare unrelated workflows, counts, browser engines or cache profiles as interchangeable samples.

The fixture adapter still loads an eager catalog. These measurements establish the current adoption and instrumentation costs; they do not establish component-level chunk savings or uninstrumented production timings. The existing frozen-showcase promote/check commands use another schema and must not be pointed at this baseline.
