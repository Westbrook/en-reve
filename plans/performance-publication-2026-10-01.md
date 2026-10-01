# Performance work publication — 2026-10-01

This publication carries the completed native-showcase comparison work, reusable performance campaigns, HTML reader updates, and the `main-be47f046-20261001-v1` / `main-be47f046-20261001-v1-calendar` acquisitions onto local main and the repository's source-only GitHub main history.

## Scope and preservation

The nine isolated showcase implementations, Web Awesome/Spectrum theme work, and earlier report source were already present on main. The remaining changes add campaign orchestration, transfer/replay helpers, exact current-source and calendar recipes, Lighthouse variant qualification, dated additive report integration, reader checks, and retained comparison evidence.

The integration starts from local main `6d792eba74135f12a1e6f026ffbd1357e3391819`. Newer cleanup/error-handling fixes and the `simple-statistics` 7.12.1 pin are preserved. Runtime package source is unchanged. Unrelated changes in the shared `codex/theme-api-adoption` checkout are not staged or reset.

The measured revision remains `be47f046395bac902e3bbb938a3ece3629e4aab7`. The subsequent main update changed only two planning documents; publication is not a new acquisition and does not relabel samples or promote a timing baseline.

## Evidence and replay

The latest 806 observations and exact measured application assets are retained in a content-addressed gzip bundle at:

`showcases/performance/reports/campaigns/main-be47f046-20261001-v1/evidence/`

The manifest contains 1,013 paths representing 142,579,935 uncompressed bytes. Identical files share compressed objects. Verify and restore with the committed tooling:

```sh
tooling/test-pipeline/with-toolchain.sh node showcases/performance/campaign.mjs verify \
  --bundle showcases/performance/reports/campaigns/main-be47f046-20261001-v1/evidence

tooling/test-pipeline/with-toolchain.sh node showcases/performance/campaign.mjs restore \
  --bundle showcases/performance/reports/campaigns/main-be47f046-20261001-v1/evidence \
  --output /tmp/en-reve-main-20261001-evidence
```

The destination must not already exist. Restored paths retain the original `showcases/performance/runs/` and `.cache/` layout. This evidence-only bundle does not install dependencies or constitute a complete source checkout. Campaign configuration, summaries, archived consumer inputs and package bytes are committed beside it. The HTML comparison can be built directly from the committed results Markdown without restoring raw acquisitions; historical raw-evidence links require the corresponding evidence files.

The existing GitHub publication policy retains the original large history and regression baselines locally. GitHub receives a normal descendant of its verified source-only main tip, including this compact acquisition bundle and report evidence. No force push, baseline promotion, dependency installation, or remote schedule activation is part of publication.

## Verification carried with the acquisition

- 408 main/control observations and 398 calendar observations; no failed samples. Unavailable memory metrics and Lighthouse paint outliers remain explicitly recorded.
- Chromium, Firefox and WebKit fixture qualification; 12 calendar recovery checks.
- 19 campaign/integration tests and 15 filtered reader checks passed.
- Reader source SHA-256 and the successful command/output directory are recorded in `reader-verification.json`; the initial incorrect test-selector assertion is retained in its prior-attempt record.
- Publication verifies source/evidence hashes and archive integrity. It does not repeat the timed campaigns or claim a new broad correctness or manual accessibility pass.

The report remains available at [latest main comparisons](http://127.0.0.1:4188/?progress-report#latest-main-refresh). Findings and limitations are recorded in [the acquisition notes](main-performance-refresh-2026-10-01.md).
