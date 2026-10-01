# Phase 1 performance comparison

All 1,170 timing samples (39 configurations × 30) and 15 separate retention runs passed. An additional 240 contemporaneous overlap samples passed. Positive deltas are slower. These are exploratory workstation results, with unchanged desktop/cold settings and exact browser versions.

## Contemporaneous overlap

Immutable Phase 0 and candidate CSR client bundles were replayed in randomized paired blocks using the same scenario and collector. This checks the instrumented end-to-end transition, including the intended production adapter and bundle changes.

| Configuration | Metric | Reference median ms | Candidate median ms | Change | Delta 95% interval ms |
| --- | --- | ---: | ---: | ---: | --- |
| activation/settings/scoped/shared/chromium/desktop/cold/1/2/shadow/csr | activationMs | 22.56 | 22.83 | 1.2% | -0.30 to 0.62 |
| activation/settings/scoped/shared/chromium/desktop/cold/1/2/shadow/csr | requestToReadyMs | 77.54 | 77.59 | 0.1% | -0.57 to 0.77 |
| activation/settings/scoped/shared/chromium/desktop/cold/1/2/shadow/csr | moduleLoadMs | 24.79 | 24.80 | 0.0% | -0.23 to 0.28 |
| activation/settings/scoped/shared/chromium/desktop/cold/1/2/shadow/csr | workflowActionUpperBoundMs | 39.34 | 38.58 | -1.9% | -1.54 to 0.30 |
| activation/settings/global/shared/chromium/desktop/cold/1/2/shadow/csr | activationMs | 24.02 | 24.11 | 0.4% | -0.20 to 0.84 |
| activation/settings/global/shared/chromium/desktop/cold/1/2/shadow/csr | requestToReadyMs | 76.35 | 77.01 | 0.9% | -0.12 to 1.28 |
| activation/settings/global/shared/chromium/desktop/cold/1/2/shadow/csr | moduleLoadMs | 24.80 | 24.58 | -0.9% | -0.38 to 0.15 |
| activation/settings/global/shared/chromium/desktop/cold/1/2/shadow/csr | workflowActionUpperBoundMs | 39.74 | 38.76 | -2.5% | -2.19 to 0.17 |
| scaling/settings/scoped/shared/chromium/desktop/cold/4/2/shadow/csr | activationMs | 21.28 | 21.30 | 0.1% | -0.24 to 0.52 |
| scaling/settings/scoped/shared/chromium/desktop/cold/4/2/shadow/csr | moduleLoadMs | 18.64 | 18.45 | -1.0% | -0.35 to 0.08 |
| scaling/settings/scoped/shared/chromium/desktop/cold/4/2/shadow/csr | cohortReadinessUpperBoundMs | 55.70 | 55.86 | 0.3% | -0.14 to 0.78 |
| scaling/settings/scoped/shared/chromium/desktop/cold/4/2/shadow/csr | workflowActionUpperBoundMs | 41.17 | 41.35 | 0.4% | -0.07 to 0.57 |
| scaling/settings/global/shared/chromium/desktop/cold/4/2/shadow/csr | activationMs | 24.85 | 24.85 | -0.0% | -0.48 to 0.47 |
| scaling/settings/global/shared/chromium/desktop/cold/4/2/shadow/csr | moduleLoadMs | 18.54 | 18.56 | 0.1% | -0.24 to 0.33 |
| scaling/settings/global/shared/chromium/desktop/cold/4/2/shadow/csr | cohortReadinessUpperBoundMs | 63.04 | 63.22 | 0.3% | -0.68 to 1.04 |
| scaling/settings/global/shared/chromium/desktop/cold/4/2/shadow/csr | workflowActionUpperBoundMs | 40.86 | 40.64 | -0.5% | -0.57 to 0.02 |

The overlap intervals include zero for every reported metric. Historical cells show some small positive shifts (for example Chromium scoped SSO SSR and single-instance per-element scaling); these are exploratory signals without multiple-comparison correction. The approximately 11–12% faster light-DOM cells occur in both global and native modes and should not be attributed to native scoping.

## Historical reference comparison

Historical sessions are independent, even when block numbers match. The fixture now delegates library-host construction to the production adapter; the contemporaneous overlap above supplements these historical differences. No arbitrary block pairing or pure registry-cost attribution is used.

| Configuration | Activation reference ms | Candidate ms | Change | Delta 95% interval ms |
| --- | ---: | ---: | ---: | --- |
| containment/settings/scoped/shared/chromium/desktop/cold/3/2/shadow/csr | 21.42 | 21.32 | -0.5% | -0.79 to 0.24 |
| activation/settings/global/shared/chromium/desktop/cold/1/2/shadow/csr | 24.31 | 24.02 | -1.2% | -1.03 to 0.13 |
| ssr/sso/scoped/shared/chromium/desktop/cold/1/2/shadow/ssr | 7.81 | 7.97 | 2.0% | 0.02 to 0.28 |
| ssr/sso/global/shared/chromium/desktop/cold/1/2/shadow/ssr | 7.66 | 7.67 | 0.1% | -0.12 to 0.16 |
| containment/sso/scoped/shared/chromium/desktop/cold/3/2/shadow/csr | 6.90 | 7.00 | 1.4% | 0.00 to 0.19 |
| containment/chat/scoped/shared/chromium/desktop/cold/3/2/shadow/csr | 19.52 | 19.65 | 0.7% | -0.57 to 0.50 |
| containment/sso/global/shared/chromium/desktop/cold/3/2/shadow/csr | 8.17 | 8.08 | -1.1% | -0.30 to 0.08 |
| ssr/settings/scoped/shared/chromium/desktop/cold/1/2/shadow/ssr | 18.81 | 19.08 | 1.4% | -0.28 to 0.75 |
| activation/sso/scoped/shared/chromium/desktop/cold/1/2/shadow/csr | 6.75 | 6.83 | 1.1% | -0.01 to 0.15 |
| activation/chat/global/shared/chromium/desktop/cold/1/2/shadow/csr | 29.99 | 30.13 | 0.5% | -0.07 to 0.49 |
| ssr/settings/global/shared/chromium/desktop/cold/1/2/shadow/ssr | 18.08 | 18.25 | 0.9% | -0.08 to 0.55 |
| containment/settings/global/shared/chromium/desktop/cold/3/2/shadow/csr | 24.97 | 24.78 | -0.8% | -0.48 to 0.19 |
| ssr/chat/global/shared/chromium/desktop/cold/1/2/shadow/ssr | 27.87 | 28.01 | 0.5% | -0.49 to 0.44 |
| activation/chat/scoped/shared/chromium/desktop/cold/1/2/shadow/csr | 20.80 | 20.68 | -0.6% | -0.39 to 0.33 |
| ssr/chat/scoped/shared/chromium/desktop/cold/1/2/shadow/ssr | 28.63 | 28.53 | -0.3% | -0.66 to 0.25 |
| containment/chat/global/shared/chromium/desktop/cold/3/2/shadow/csr | 31.18 | 30.74 | -1.4% | -1.01 to -0.04 |
| activation/settings/scoped/shared/chromium/desktop/cold/1/2/shadow/csr | 22.26 | 22.38 | 0.5% | -0.21 to 0.50 |
| activation/sso/global/shared/chromium/desktop/cold/1/2/shadow/csr | 7.98 | 8.01 | 0.4% | -0.05 to 0.13 |
| scaling/settings/global/shared/chromium/desktop/cold/4/2/shadow/csr | 24.97 | 25.29 | 1.3% | -0.28 to 0.80 |
| scaling/settings/scoped/group/chromium/desktop/cold/1/2/shadow/csr | 20.85 | 21.06 | 1.0% | -0.40 to 0.92 |
| scaling/settings/global/shared/chromium/desktop/cold/1/2/shadow/csr | 24.87 | 25.06 | 0.8% | -0.34 to 0.65 |
| scaling/settings/scoped/instance/chromium/desktop/cold/1/2/shadow/csr | 20.93 | 21.10 | 0.8% | -0.21 to 0.55 |
| scaling/settings/scoped/element/chromium/desktop/cold/4/2/shadow/csr | 30.88 | 31.27 | 1.3% | -0.33 to 0.74 |
| scaling/settings/scoped/shared/chromium/desktop/cold/4/2/shadow/csr | 21.24 | 21.67 | 2.0% | -0.02 to 0.82 |
| scaling/settings/scoped/shared/chromium/desktop/cold/1/2/shadow/csr | 20.99 | 21.18 | 0.9% | -0.69 to 0.74 |
| scaling/settings/scoped/instance/chromium/desktop/cold/4/2/shadow/csr | 21.37 | 21.63 | 1.2% | -0.50 to 0.76 |
| scaling/settings/scoped/group/chromium/desktop/cold/4/2/shadow/csr | 21.45 | 21.40 | -0.2% | -0.53 to 0.39 |
| scaling/settings/scoped/element/chromium/desktop/cold/1/2/shadow/csr | 30.46 | 31.25 | 2.6% | 0.18 to 1.23 |
| scaling/settings/scoped/shared/chromium/desktop/cold/1/2/light/csr | 22.18 | 19.66 | -11.4% | -2.87 to -2.10 |
| scaling/settings/global/shared/chromium/desktop/cold/1/2/light/csr | 26.34 | 23.19 | -11.9% | -3.87 to -2.73 |
| activation/sso/scoped/shared/webkit/desktop/cold/1/2/shadow/csr | 8.42 | 8.39 | -0.4% | -0.38 to 0.45 |
| containment/sso/auto/shared/webkit/desktop/cold/3/2/shadow/csr | 8.89 | 8.97 | 0.9% | -0.29 to 0.43 |
| activation/sso/auto/shared/webkit/desktop/cold/1/2/shadow/csr | 8.38 | 8.74 | 4.3% | -0.01 to 0.86 |
| ssr/sso/auto/shared/webkit/desktop/cold/1/2/shadow/ssr | 9.91 | 10.21 | 3.0% | -0.10 to 0.59 |
| ssr/sso/scoped/shared/webkit/desktop/cold/1/2/shadow/ssr | 10.00 | 9.87 | -1.3% | -0.61 to 0.51 |
| containment/sso/scoped/shared/webkit/desktop/cold/3/2/shadow/csr | 8.96 | 9.06 | 1.1% | -0.22 to 0.42 |
| ssr/sso/auto/shared/firefox/desktop/cold/1/2/shadow/ssr | 15.85 | 14.15 | -10.7% | -3.32 to 0.32 |
| activation/sso/auto/shared/firefox/desktop/cold/1/2/shadow/csr | 12.76 | 12.00 | -6.0% | -1.49 to 0.08 |
| containment/sso/auto/shared/firefox/desktop/cold/3/2/shadow/csr | 16.27 | 15.16 | -6.8% | -2.86 to 1.38 |

## Retention

Five fresh-browser repetitions per configuration, after forced GC at 0/10/50/100 cycles. No live workflow records or updates after disposal. Heap slope alone cannot establish a leak.

| Configuration | Reference median heap growth 10→100 (bytes) | Candidate growth | Reference nodes at 100 | Candidate nodes | Reference listeners | Candidate listeners |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| lifecycle/settings/scoped/instance/chromium/desktop/cold/1/2/shadow/csr | 875164 | 872092 | 2083 | 2088 | 150 | 150 |
| lifecycle/settings/global/shared/chromium/desktop/cold/1/2/shadow/csr | 767476 | 770192 | 2060 | 2060 | 150 | 150 |
| lifecycle/settings/scoped/shared/chromium/desktop/cold/1/2/shadow/csr | 853060 | 858160 | 2083 | 2088 | 150 | 150 |

Scoped policies retain five additional DOM nodes after warm-up (2,088 versus 2,083). In both reference and candidate, node/listener medians are flat from cycle 10 through 100; the extra five are a constant footprint in this workload, not growing DOM retention. Heap growth remains roughly 0.77–0.87 MB from cycle 10 to 100 in both builds and warrants retaining the lifecycle diagnostic lane.

Raw distributions, per-metric intervals and identities: `artifacts/scoped-registry-phase-1/comparison.json`. No multiple-comparison correction, dedicated-lab guarantee, physical-device validation or field performance claim. The frozen Phase 0 anchor remains unchanged.
