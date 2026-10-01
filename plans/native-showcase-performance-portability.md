# Portable performance workflow

The repeatable entry point is [`showcases/performance/campaign.mjs`](../showcases/performance/campaign.mjs). The complete operating guide is [CAMPAIGNS.md](../showcases/performance/CAMPAIGNS.md), also linked from the repository's agent instructions and lab README.

## Delivered

- Checked-in-format recipes for the native comparison panel, current root En Reve against its frozen control, and the three calendar delivery policies. Each recipe saves its exact matrix, seed, profiles and acquisition IDs.
- Explicit setup, doctor, plan, run, report, certificate renewal, source/evidence export, checksum verification and fresh-directory restore commands.
- Serial machine/checkout ownership across acquisition, calibration, exact-build qualification, fail-fast stages with retained logs, unique candidate names and immutable raw run IDs. No automatic retries, baseline promotion or schedule activation.
- Current-source candidates use an isolated consuming project and retained content-addressed package archives. Lighthouse now accepts only an explicitly qualified En Reve variant with a matching fingerprint and receipt.
- Regenerable grouped Markdown/data tables, measurement Date (UTC), availability denominators, and an explicit alternate source for the existing En Reve HTML reader. Its sorting and sticky Implementation columns remain in use. Historical comparison pages are preserved.
- Verified transfer bundles capture required working sources, including untracked files, locks, vendor packages and selected raw evidence. Dependencies, credentials and unrelated output are excluded. Reviewed timing baselines can be included explicitly. Another checkout does not need this conversation or the original absolute path.
- The old Web Awesome integration test's historical input is now a self-contained fixture instead of depending on an ignored local artifacts directory; the original evidence was preserved.

## Verification

The complete performance-lab unit suite passes **76 checks**. Coverage includes campaign plans, exact qualification binding, collision refusal, stopped failure stages, raw sample identities, bundle/report schemas, missing measurements, checksum corruption, traversal and overwrite refusal.

The retained September 24 calendar acquisitions (383 primary samples and 15 Lighthouse audits) replay into **64 tables**. The unprepared mobile first-focus medians remain 46.4 / 63.9 / 179.7 ms; dates remain September 24. The reader renders 64 sortable tables, including 61 with Date columns, 63 with Implementation columns and 495 numeric column definitions. This is replay of old evidence, not a new timing acquisition.

A source/evidence bundle was exported, verified and restored at a new absolute location. Both isolated lab and reader dependencies installed from their lockfiles using the local npm cache. The relocated report produced identical tables and coverage. Initial relocation exposed the historical test-fixture dependency; it was corrected and the relocated suite rerun.

No new browser performance campaign or full fresh-machine fixture bootstrap was run during this implementation. Another task owns the machine's comprehensive-validation lease. Existing measurement engines and browser journeys are reused; plan, orchestration failure handling, report replay, installation and transfer behavior are the validation performed here. Before treating a new machine or changed library as a reference, run setup/qualification/calibration and the requested campaign under that machine's own recorded conditions.

## Use in a future task

```sh
tooling/test-pipeline/with-toolchain.sh node showcases/performance/campaign.mjs doctor
tooling/test-pipeline/with-toolchain.sh node showcases/performance/campaign.mjs plan \
  --config showcases/performance/campaigns/current.json --id current-YYYYMMDD-01
tooling/test-pipeline/with-toolchain.sh node showcases/performance/campaign.mjs run \
  --config showcases/performance/campaigns/current.json --id current-YYYYMMDD-01
```

Use `native.json` for the frozen panel and `calendar.json` for calendar policy tradeoffs. Build the HTML reader with `PERF_REPORT_SOURCE` set to the campaign's `results.md`, as documented in the operating guide. Preserve all unsuccessful samples and use a new ID after fixing a failure.

The working checkout contains unrelated uncommitted work; no broad commit or publication was made. Until the necessary source changes are committed, carry the verified transfer bundle into another checkout rather than assuming a fresh Git worktree contains them. The bundle manifest is the exact included-file inventory.
