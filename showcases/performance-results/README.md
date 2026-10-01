# Performance results in En Reve

A separate HTML reader for `plans/native-showcase-performance-results.md`. The Markdown remains the source of truth. Build-time rendering preserves the complete report and copies only its explicitly linked local documents into the output. The first comparison progressively enhances to the native `en-data-table`, with typed comparators for each column, accessible sort state, keyboard activation, and a source-order reset. Static HTML remains available without JavaScript and for printing.

## Run

```sh
cd showcases/performance-results
npm ci --workspaces=false
npm run build
npm run preview
```

Open <http://127.0.0.1:4188/#first-reference-comparison>. Rebuild after changing the Markdown. `npm run dev` regenerates the report when started; restart it after Markdown edits. The existing project progress report links to `?progress-report#first-reference-comparison`, which shows a return link only in that view.

This app installs the same frozen En Reve tarballs as the native showcase, with its own lockfile and dependencies. It does not modify the measured fixtures, root packages, performance harness or source measurements. It is a report reader, not an additional benchmark candidate. The `source.json` receipt identifies the source document and viewer build inputs.

## Verify

After a build, `npm test` starts or reuses the preview and checks both sort directions on every column, numeric thousands separators, source order, keyboard focus, mobile overflow, all source headings, evidence links, printing, and the no-JavaScript fallback in Chromium, Firefox, and WebKit. Install those browsers with `npx playwright install` if not already present.

The second pass adds grouped tables for loading/CLS, startup clicks, emitted assets/chunks, whole-page transfer, main-thread work, repeated Lighthouse audits, per-action latency, memory checkpoints, diagnostic structure and peer gaps. Every column can be sorted; measurement columns use numeric comparison (including negative gaps and thousands separators), with unavailable values last in either direction. Each table can be downloaded as CSV in the currently selected order. Descriptive columns retain their Markdown formatting.

Regenerate the measurement section with `node showcases/performance/experiments/summarize-pass2.mjs` from the repository root, then rebuild this viewer after browser campaigns finish. It reads explicit campaign IDs, preserves sample/failure counts, and does not merge historical and new timing cohorts. The original first-reference table remains available separately.

## Web Awesome integration

After regenerating the second pass, run `node showcases/performance/experiments/report-web-awesome.mjs --config reports/web-awesome/config.json --integrate` from the repository root, then rebuild this viewer. This idempotently adds the measured Web Awesome rows to the main loading, startup, payload, transfer, blocking, interaction, memory and diagnostic tables. The first reference summary includes its later 10-sample acquisition beside the historical 30-block reference; the rendering excerpt includes all nine implementations. Acquisition labels remain visible and sortable. Historical values and paired contrasts are preserved; cross-cohort rows are descriptive rather than paired evidence.

`showcases/performance/reports/web-awesome/main-integration.json` records the table mappings. The detailed three-system contemporary tables remain available for paired comparisons. The integration unit test checks historical-cell preservation, exact new source cells, idempotence and absence of invented historical Web Awesome contrasts.

For a current verification acquisition, `scripts/verify-view.mjs` accepts `EN_READER_TEST_RECEIPT`. Six balanced numeric table groups per engine retain every table, numeric column, direction, real click and row predicate. The receipt must contain all 30 cases (six sort groups plus four other cases × three engines), with each group's exact coverage digest. Failed or missing groups require a new complete run. Historical timeout receipts remain readable through the explicitly named `validateLegacyReaderTestReceipts` export; they cannot certify the current protocol.

## Current main En Reve refresh

Run `node showcases/performance/experiments/report-en-reve-main.mjs --integrate`, then `node showcases/performance/experiments/update-en-reve-main-pages.mjs`, and rebuild the viewer. Apply this latest integration after any historical generators. It updates the main En Reve rows, adds the complete current three-system cohort, and links current data from historical Spectrum, Web Awesome and DOM pages without rewriting their paired evidence. The new reader verification is `node showcases/performance-results/scripts/verify-en-reve-main.mjs`.
