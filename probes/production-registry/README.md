# Production delivery across registry phases

This lane measures the actual production settings page, separately from the instrumented registry fixtures. It uses full Vite multi-page client builds, settings-page build-time SSR, gzip and local HTTPS/HTTP2. The production workflow uses global registration in every phase. It does not replace native scoped ownership/containment tests.

The protocol and evidence live in `artifacts/scoped-registry-production-v1/`. The immutable archive is `showcases/performance/baselines/scoped-registry-production-v1/`. Do not overwrite a completed campaign or rerun preparation against sealed measurements; create a new version.

Pipeline used for v1:

1. `node probes/production-registry/prepare.mjs` reconstructs historical docs and archived library outputs in isolated directories, records generation repairs, and runs the actual production build.
2. `node probes/production-registry/audit-builds.mjs` verifies old seals, exact library byte parity, matching Vite configuration/dependency locks, and saves source/site tarballs.
3. `node probes/production-registry/campaign.mjs --qualify` exercises the final measurement procedure once per configuration, including retention.
4. `node probes/production-registry/verify-functional.mjs` checks parallel Phase 3 lazy requests, no-JavaScript SSR and mobile touch. Desktop keyboard/focus checks run in qualification and every timing sample.
5. `node probes/production-registry/campaign.mjs` captures 480 serial randomized timing samples and 20 separate retention runs. The exclusive browser-work lock prevents concurrent repository campaigns.
6. `node probes/production-registry/analyze.mjs` validates complete schedules and computes medians and exploratory paired bootstrap intervals. Write findings only after reading the complete results.
7. `node probes/production-registry/freeze.mjs` archives evidence and creates a read-only checksum seal. `--verify` rechecks it.
8. `node artifacts/scoped-registry-production-v1/page/build.mjs`, `.../page/server.mjs`, and `.../page/verify.mjs` produce and check the sortable, standalone `en-table` report on port 4206.

Reconstruction limitations are explicit: common generated docs repair, metadata regeneration, and Phase 2's skipped unrelated API-example server rendering due to its archived color-control cleanup bug. The settings SSR and full client build are retained; archived library runtime bytes are never patched. Phase 3 is reconstructed from Phase 2 plus saved Phase 3 workflow/library source changes and frozen compiled outputs, because it is not committed yet.

Readiness excludes unregistered hosts and dormant SSR descendants until activation. A defined child inside a dormant host may intentionally have unresolved `updateComplete`; waiting for it at startup would incorrectly make a lazy page appear hung. The same observer runs in all phases, and first-use readiness includes the activated subtree. This is a readiness metric with frame opportunities, not INP or completed animation duration.

Preliminary qualification folders are diagnostic only and excluded from campaign statistics. No sample failures are silently retried or discarded. Failed qualification attempts remain available with their failure records.
