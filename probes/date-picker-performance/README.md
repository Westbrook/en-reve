# Phase 6 date-picker campaign

Run from the repository root. Set `PHASE6_BASE` to a **new** artifact directory for
new work; the default is the original exploratory directory. Builds and named
campaigns refuse overwrites. The obsolete in-place site refresh helper was removed;
create a new build directory instead. Never edit a frozen archive or reuse a failed run ID.
All browser checks use the shared performance lock. Do not run builds or another
browser workload during timed capture.

## Reproduce a candidate

```sh
export PHASE6_BASE=artifacts/scoped-registry-phase-6-new
python3 probes/date-picker-performance/prepare.py parent
python3 probes/date-picker-performance/prepare.py candidate
python3 probes/date-picker-performance/assets.py
python3 probes/date-picker-performance/qualify-node.py
python3 probes/date-picker-performance/consumer-types.py
node probes/date-picker-performance/functional.mjs
node probes/date-picker-performance/extended.mjs
node probes/date-picker-performance/scaling.mjs
node probes/date-picker-performance/range-regression.mjs
node probes/date-picker-performance/verify-retry-integration.mjs "$PHASE6_BASE"
node probes/date-picker-performance/verify-reenable.mjs "$PHASE6_BASE"
python3 probes/date-picker-performance/build-ssr.py
node probes/date-picker-performance/ssr/verify.mjs
node probes/date-picker-performance/warm-proof.mjs
```

Copy the unchanged `budgets.json` from the v1 reference before selection. Record
policy selection and actual manual outcomes separately; the scripts cannot infer
VoiceOver speech. `merge-metadata.py` applies only isolated date-specific deltas
while preserving unrelated work. Verify the intended stage pointers first.

## Capture and seal

```sh
python3 probes/date-picker-performance/snapshot.py
node probes/date-picker-performance/campaign.mjs --run=final-cold --arms=parent/eager,candidate/dom --n=30 --retention=5
node probes/date-picker-performance/campaign.mjs --run=final-warm --arms=parent/eager,candidate/dom --configs=chromium:desktop:keyboard,chromium:constrained:keyboard --n=30 --retention=0 --warm
python3 probes/date-picker-performance/analyze.py final-cold final-warm
python3 probes/date-picker-performance/check-budgets.py
python3 probes/date-picker-performance/verify-input.py
python3 probes/date-picker-performance/report.py
node probes/date-picker-performance/verify-report.mjs
PHASE6_ARCHIVE=showcases/performance/baselines/scoped-registry-phase-6-NEW python3 probes/date-picker-performance/freeze.py
```

If a primary interval crosses a practical bound with its median inside the budget,
run an independent `confirmation-…` campaign with the affected configurations and
30 samples per cell. Include **all** confirmation runs in `analyze.py`; the checker
retains the original uncertainty and requires every applicable confirmation to
pass. An over-budget primary median needs a revised candidate, not a favorable
rerun. Do not pool confirmations or trim outliers. The freeze requires complete
successful cells, separate retention, qualification, manual disposition, and a
passing aggregate budget record, and verifies every older seal unchanged.

Run `python3 probes/date-picker-performance/budget-check.test.py` to verify that
uncertainty, unfavorable repeats, excessive bytes/retention and missing benefit
cannot be silently accepted. A final archive also includes the exact supporting
server/lock/config sources recorded by the capture, even when shared harness files
have unrelated workspace edits. Restore those only in an isolated reproduction
checkout; do not overwrite a live working tree.

The report uses sortable `en-table` columns and notes the direction of every
change column. It links earlier Phase 0–5 studies without pretending their
command-palette workloads can be subtracted from this matched date route.

## Manual review and limits

```sh
PHASE6_REVIEW_PORT=4240 PHASE6_REVIEW_BASE="$PHASE6_BASE/candidate" node probes/date-picker-performance/manual.mjs
PHASE6_REVIEW_URL=http://127.0.0.1:4240 node probes/date-picker-performance/verify-manual.mjs
```

Open `http://127.0.0.1:4240/?progress-report` (or `?fail&progress-report`). Local
form inspection sends no data; POST is rejected. The main route is client rendered.
Separate SSR checks establish native input/value preservation and absent calendar
markup before hydration. An unupgraded FACE host cannot submit its shadow input
through an outer form without an actually associated native control.

Warm encoded body sizes include cache hits and are **not transferred bytes**.
Trigger → focus is the primary first-use endpoint. A subsequent RAF is not proof
of paint. Selection timing starts at the accepted event, not the physical gesture.
Actual browser versions and global fallback are in each sample. No physical mobile
or date-specific IME qualification is inferred from automated emulation.

## Preserved investigations

The original v1 freeze precedes manual-review changes and remains immutable.
Separate retry, lifecycle and weekday-review artifacts retain intermediate evidence.
`retry-review.mjs` and `verify-retry-review.mjs` are historical diagnostic fixtures:
clear/restore after two frames did not fix Safari speech; distinct counted errors
did. The library now exposes localized `loadRetryErrorLabel` with `{attempt}`.
No focus delay or timer workaround was adopted. Re-enable refresh has separate
72-case lifecycle coverage; retry integration has 36 cases.

`prepare.py --calendar-labels column-weekday` requires a separate experimental
candidate. It patches only the isolated copy. `verify-weekday-review.mjs` preserves
24 original/experimental checks. Manual review found reduced repetition in Chrome
and Firefox but missing weekday context in WebKit. The experiment was rejected:
full weekday/date button names and semantic headers remain. Firefox's functional
native date button remains visible; no invisible focusable clipping workaround was
adopted. These documented browser differences were accepted in closeout.

For a bounded **toolchain qualification**, retain fresh `PHASE6_BASE` and run
`--run=toolchain-cold --arms=parent/eager,candidate/dom --configs=chromium:desktop:keyboard,firefox:desktop:keyboard,webkit:desktop:keyboard --n=1 --retention=1 --qualify`.
Use a separate `--run=toolchain-warm --arms=parent/eager,candidate/dom --configs=chromium:desktop:keyboard --n=1 --retention=0 --warm --qualify` for the warm path.
`--qualify` labels a receipt; it does not reduce default sample or retention counts.
These bounded runs check capture machinery, not the30-sample acceptance budgets.
Preparation writes `toolchain.json` for each arm because its isolated historical
source stage deliberately links the caller's installed tools; the historical
stage lock is not proof of the versions actually executed. Never pool these
new-toolchain observations with a frozen previous-instrument campaign.

## Metadata compatibility during active replay

`prepare.py` applies `metadata-compatibility.json` through `metadata_compatibility.py` equally to fresh parent and candidate stages. Exact archived preimages are required and saved. The archived commit/root lock stay unchanged; five package build scripts explicitly select the caller's TypeScript 7 compiler, while metadata consumers share the caller's TypeScript 6 API and maintained WC Toolkit adapter. `toolchain.json`, the metadata receipt and `metadata-identity.json` distinguish these executed tools from the historical lock.

The compatibility edits intentionally add 25 type exports and one erased event cast. Packed JavaScript is byte-identical to the legacy control for each subject. A source-bound metadata policy removes nine false inherited Parts from four classes without adding comments or changing historical product behavior. The existing EnTag `base` and `remove` Parts are newly discovered; the other 95 component Parts lists match each subject's control. Historical keyboard/paste defaults and local rich-document origins remain historical. Every CEM/type/API difference is reviewed in the [migration checkpoint](../../plans/cem-migration-2026-09-26.md).

The active preparation no longer requires the legacy analyzer. Its archived, unused release comparator is not compatible with the new schema/omission policy and remains unqualified; do not infer that all archived tools are executable. Preparation/build equality does not qualify browser behavior, timing budgets or a new campaign baseline.
