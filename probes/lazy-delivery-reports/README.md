# Lazy delivery evidence reports

`report-wave.py` presents editor, color and deterministic family census evidence
in sortable `en-table` tables. `editor-scenario.py` supplies the separately defined
editor usage sensitivity calculation. Existing Stage B and actual-route family
reports use their own scripts. Preserve frozen historical reports.

The output-only presenter supports these inputs:

- Editor: existing timing `comparison.json` plus separate retention `result.json`.
  It shows all three arms, original cell states, absolute statistics, named
  comparisons with sortable confidence fields, deterministic changes, each
  block's savings and emitted gates. Retention has independent repetition,
  checkpoint, heap-comparison and pair tables. Unsupported counters remain absent.
- Color: frozen `producer.json` attribution, optional `candidate.json` matched
  cold diagnostic, and optional separate `baseline.json` necessary-condition
  diagnostic. These sources do not establish full-matrix qualification or
  retention. Early rejection needs no invented downstream timing or retention.
- Fresh deterministic family census: `plans/lazy-delivery/family-census-results.json`
  and its original raw receipt. Bounds and proposed dispositions stay verbatim;
  no reference bound is called achieved candidate saving.

The presenter receives existing complete packed report assets via `--packed`.
It understands family `manifest.reportAssets` and Stage B's `family: report`
variant. It verifies the report receipt and exact asset file set/hashes, copies
those existing assets into a fresh output and performs no package install/build.
Family assets explicitly register `en-table`; a small sorter matches the existing
report interaction. Stage B's copied report boot already supplies sorting and
filtering. Every table includes an immediate below-table direction/scope note.

Inputs and raw bytes are copied unchanged and bound in `report-receipt.json`.
Editor analyzer-attested raw hashes are checked. Retention has no independently
attested result/raw hash, so its copied digests are explicitly presentation-time
provenance. Missing raw inputs are visible gaps, never complete evidence. All
outputs must be fresh and outside source snapshots, preparation and evidence
directories. No user review or acceptance state is written.

## Usage and validation

Use the repository's pinned Python and Node runtimes through
`tooling/test-pipeline/with-toolchain.sh`. Coordinate browser verification with
the checkout and machine ownership leases, separately from timed campaigns.
The paths below are placeholders for exact existing inputs and fresh outputs.

```sh
tooling/test-pipeline/with-toolchain.sh python3 probes/lazy-delivery-reports/editor-scenario.test.py
tooling/test-pipeline/with-toolchain.sh python3 probes/lazy-delivery-reports/editor-scenario.py \
  --analysis=/exact/editor-timing/comparison.json \
  --out=/fresh/editor-scenario/result.json
tooling/test-pipeline/with-toolchain.sh python3 probes/lazy-delivery-reports/report-wave.py --kind=editor \
  --input=analysis=/exact/editor-timing/comparison.json \
  --input=retention=/exact/editor-retention/result.json \
  --input=scenario=/fresh/editor-scenario/result.json \
  --packed=/exact/complete-packed-docs --out=/fresh/editor-report
tooling/test-pipeline/with-toolchain.sh python3 probes/lazy-delivery-reports/report-wave.py --kind=color \
  --input=producer=/exact/color-inputs/producer.json \
  --input=candidate=/exact/color-cold/candidate.json \
  --packed=/exact/complete-packed-docs --out=/fresh/color-report
tooling/test-pipeline/with-toolchain.sh python3 probes/lazy-delivery-reports/report-wave.py --kind=census \
  --input=census=/exact/family-census-results.json \
  --raw=census-receipt=/exact/original/census.json \
  --packed=/exact/complete-packed-docs --out=/fresh/census-report
```

Omit genuinely unrun candidate/retention inputs. Include all separate failed
attempt receipts through repeatable `--raw label=/file` arguments; do not pool
their observations. Retain raw logs/screenshots in the run artifacts. Output is
`index.html`, `report-assets/`, exact `evidence/` copies and report receipt.
Use the shared report verifier with `--entry=index.html` for these wave reports
and for `probes/lazy-delivery-families/report-performance.py` output:

```sh
tooling/test-pipeline/with-toolchain.sh node probes/lazy-delivery-performance/verify-report.mjs \
  --run=/fresh/editor-report --entry=index.html
```

It checks real `en-table` registration, initialized sort controls, per-table
filtering, numeric sorting where available, direction notes, generated relative
evidence links returning HTTP 200, and one desktop screenshot. The default
remains `report.html` for existing Stage B outputs.
It writes its verification receipt/screenshot to the new report output only;
never rename or mutate immutable input reports. Family reports share the same
comparison-table and below-table direction hooks; their own sorter and detailed
per-table notes remain in place.

Presentation tests and browser verification establish report behavior only. They
do not establish functional qualification, performance acceptance, manual
accessibility coverage or user review. Completed, failed, partial and rejected
source results retain their original status and qualification limits.

## Descriptive editor usage method

For each original matched block b, arm a and assumed usage u in {0, .25, .5, 1},
the separate post-analysis calculation is:

`J[a,b,u] = startupMs[a,b] + u * firstSelectionMs[a,b]`.

Report the sample mean J for reference, candidate and eager rollback, and the
sample mean same-block J differences for candidate−reference,
candidate−rollback and rollback−reference. Change percent divides that mean
paired delta by the named comparator's mean J. No new uncertainty or gate is
introduced. Original p95/empirical/confidence decisions remain authoritative.

Startup is navigation origin through the activated, settled real editable route.
First selection starts just before native Selection.setBaseAndExtent and ends
on the first observed ready frame with eligible selection, fresh positioning,
visible enabled settled commands and preserved editor focus/identity. The earlier
500 ms observation, authoritative text/focus/scroll setup, later settle/dwell,
repeat action, and separate fresh-page explicit focus are outside this index.

The model assumes every hypothetical visit pays startup and fraction u pays one
first-selection readiness interval, independently of measured latency. 25% is
the declared scenario assumption; all four values are sensitivity, not observed
adoption. This sums disjoint readiness intervals after removing arbitrary gaps:
it is a **scenario readiness-cost index in milliseconds**, not page duration,
session time, INP, physical touch latency or pure construction time.

Only complete, nonqualification, analyzer-valid exact campaigns produce numbers;
all seven cells require at least 100 complete clean matched blocks with all three
arms. Original numeric performance-gate failure can still have diagnostic index
rows, but no favorable scenario index rescues that failure. Missing/failed/
incomplete timing and deterministic early rejection produce no numeric index.
The script verifies the analyzer's exact raw hashes and embedded identities,
retains the original input and method digests, and outputs every underlying
per-block index for audit. Meaningful source tests cover linearity, same-block
comparison, original failure retention, missing/duplicate inputs and hash changes.
