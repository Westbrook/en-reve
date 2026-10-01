# Latest main performance acquisition — 2026-10-01

Measured source: local main `be47f046395bac902e3bbb938a3ece3629e4aab7` at acquisition. During the run, main advanced to documentation-only `6d792eba74135f12a1e6f026ffbd1357e3391819`; the worktree was fast-forwarded afterward. Package and measured showcase inputs are unchanged between those commits. No Git remote is configured. The shared checkout and its unrelated changes are preserved; measurements use the managed `performance-main-refresh` worktree. Runtime package sources are exact main, with a campaign-tooling overlay.

Status: both campaigns complete (408 main/control + 398 calendar observations, zero failed samples), with all 12 calendar recovery checks passing. The 381-table HTML report is published. Nineteen campaign/integration tests and 15 filtered reader checks passed across Chromium, Firefox and WebKit. The first reader attempt passed the 12 existing checks, but its new test incorrectly included a col sizing element in the pinned-cell geometry assertion. The selector was corrected to visible th/td cells, and all 15 selected checks then passed. This is focused report evidence, not a broad library correctness or manual accessibility claim.

## Protocol and provenance

`showcases/performance/campaigns/main-refresh.json` builds a fresh isolated En Reve consumer and measures preserved En Reve, Fluent WC and Web Awesome controls. Desktop is unthrottled; mobile uses CPU 4×, 100 ms latency, 8 Mbps download and 2 Mbps upload. Load/startup/interactions use 10 samples per condition; Lighthouse uses 5 mobile audits; memory uses one desktop session at 0/10/50 cycles; BFCache and collector overhead use 5 desktop repetitions. Connected DOM is separately censused three times with/without the complete date field. No forced GC or automatic baseline promotion.

Current-source and frozen-control cohorts run sequentially. Differences are descriptive, not paired causal estimates. Other peer rows and earlier observations retain their original dates. Calendar eager/deferred/split variants reused this campaign's archived package tarballs and resolved lockfile, with randomized matched blocks within their own campaign.

The main campaign passed Chromium, Firefox and WebKit functional qualification plus collector calibration. All measurement stages completed. Report generation initially rejected historical Lighthouse samples because they have `startedAt` but no `finishedAt`; the reader now accepts their actual start date without inventing an end timestamp. The repair receipt and corrected reporting source are archived under `reporting-recovery`; raw samples are unchanged.

## Completed main-campaign findings

| Metric | Frozen En Reve | Main be47f046 | Interpretation |
| --- | ---: | ---: | --- |
| Mobile cold LCP, median ms | 672 | 648 | Modest difference; separate cohorts |
| Mobile warm LCP, median ms | 306 | 304 | Similar delivery |
| Mobile startup result from navigation, median ms | 653.7 | 650.4 | Similar startup responsiveness |
| Mobile scripted INP, median ms | 48 | 56 | Small adverse signal; inspect named actions before attribution |
| All JS raw bytes | 450057 | 455724 | +5667 bytes (1.26%) |
| All JS Brotli bytes | 89048 | 90314 | +1266 bytes (1.42%) |
| Full initial census nodes | 4667 | 4685 | +18 |
| Date-field census nodes | 628 | 631 | +3 |
| Without-date census nodes | 4039 | 4054 | +15 |
| Without-date elements | 1399 | 1414 | +15 |

The independent timing diagnostic counts 4668/4686 connected nodes; the dedicated census counts 4667/4685. Their absolute counting scopes are distinct and both show +18. Keep their rows labeled rather than silently normalizing them.

Fresh peer mobile cold LCP medians are 536 ms (Fluent WC) and 628 ms (Web Awesome), compared with 648 ms for main En Reve. Without the date field, main En Reve has 4054 nodes/1414 elements, versus Fluent's 2859/1272 and Web Awesome's 4182/1393. En Reve remains above Fluent, but does not exceed Web Awesome's total non-date node count. Its higher element count remains a separate consideration.

### Interpretation and follow-up

1. Prioritize reproducible startup/transfer work: main's 94.7 KiB mobile cold response total exceeds Fluent's 58.9 KiB and Web Awesome's 91.9 KiB. Evaluate the split-calendar tradeoff using the current-policy campaign before changing defaults.
2. Investigate the 8 ms scripted-INP increase with per-action evidence and a matched confirmation run; a ten-sample sequential comparison does not isolate a code regression.
3. Continue the focused DOM work outside the calendar. The +15 non-date elements are five each of div/span/slot; whitespace and comment counts are unchanged. The shared overlay description template now renders a stable div/slot/fallback-span structure, consistent with +18 across six surfaces. Preserve its description-slot and ARIA-target contract when investigating simplification. The base-part census is unchanged at 50 outside the date field and is not proof that those nodes are removable.
4. Investigate Lighthouse's long paint tail before attributing it to the library. Latest En Reve has two roughly 8.7-second FCP/LCP audits among five; frozen En Reve and Fluent each have one such outlier. Raw audits attribute the latest slow observations to element render delay, while resource request durations remain short. Retain these observations and their p75/max values; do not discard or pool them with the primary load cohort. TBT is 0 in these audits, which does not explain or excuse the paint delay.
5. Treat memory as diagnostic. The latest JS heap checkpoints are 4.35/5.27/5.60 MiB after 0/10/50 cycles, versus frozen 4.32/5.21/5.56 MiB. No forced GC, one session per implementation, and one initial Fluent API timeout preclude a leak or regression conclusion.

## Evidence

- Main campaign: `main-be47f046-20261001-v1`.
- Campaign reports, archived packages, exact consumer inputs, source identity and recovery receipt: `showcases/performance/reports/campaigns/main-be47f046-20261001-v1/`.
- Raw samples and per-run manifests: `showcases/performance/runs/main-be47f046-20261001-v1-*`.
- Completed calendar campaign: `main-be47f046-20261001-v1-calendar`.
- Published report: http://127.0.0.1:4188/?progress-report#latest-main-refresh. Nineteen campaign/integration tests and 15 filtered reader checks pass. `reader-verification.json` records the command, successful output directory, source SHA-256, and original failed attempt. The first attempt remains at `/private/tmp/en-main-performance-reader-main-be47f046-20261001-v1`; the successful rerun is its `-recheck` sibling.
- Copied raw sample/manifest and variant-asset verification: 58 matching SHA-256 entries in `copy-verification.json`.

## Current calendar observations

Same main packages, separate randomized matched-policy cohort. Mobile cold LCP: 676/666/664 ms for eager/deferred/split (n=10). First focus: 50.1/68.7/186.3 ms (n=30); repeated focus approximately 20.5 ms for all policies. Prepared split first focus: 71.4 ms when ready and 149.8 ms while pending (n=10 each).

Deferred/split remove 495 initial nodes (4685 → 4190), entirely within the date field (631 → 136). Without-date nodes remain 4054. After first open they retain 4687 nodes, including after closing; eager stays at 4685. Split saves 2977 bytes (2.9 KiB) of initial Brotli JS and introduces a 5119-byte optional chunk. Evaluate preparation and likelihood of use alongside the small initial transfer saving. The mobile LCP paired intervals include zero (deferred −10 ms, 95% [−34, 52]; split −12 ms [−28, 12]). First-focus penalties are clearer (deferred +18.6 ms [16.2, 21.3]; split +136.2 ms [133.5, 138.6]). Calendar Lighthouse median LCP is 797.5/813.1/8409.7 ms, with retained large paint outliers. Investigate those audit tails before promoting a delivery default. Calendar transformation source maps emit incompleteness warnings; no per-source-map attribution is claimed.
