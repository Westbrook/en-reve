# Exact remaining Runtime work

This is a source-only reconciliation for scheduling. No tests, builds, browser sessions or new measurements were executed. Runtime remains at 28/36 verified effort; the remaining eight units cover final validation and review evidence.

## Required automated tiers

| Pathway | Genuinely unrun full workload in this Runtime cohort | Already completed |
| --- | --- | --- |
| `lazy-performance` | 840 timing samples across 28 cells, plus 20 separate retention runs | 28 timing and four retention qualification jobs passed |
| `activation-performance` | 180 timing samples across six cells, plus 15 separate retention runs | Six timing and three retention qualification jobs passed |
| `date` | 720 cold timing samples, 20 separate retention runs, and 240 warm timing samples; original analysis, budgets, input and report checks | Tools' 17-stage machinery qualification, with 28 cold jobs and eight warm jobs; historical Phase 6 full results remain accepted for their original cohort |

These are 2,035 planned jobs across distinct protocols, not a combined performance result. Timing cells retain 30 samples each. Retention retains five repetitions per cell/arm, 100 cycles, and checkpoints 0/10/50/100. Nothing reduces original samples, assertions or observation windows.

The existing specialized plans already define the commands and dependencies. A lazy/activation union has seven tasks: one shared build, each fixture preparation and qualification, then each full campaign. Qualification in this new invocation is a prerequisite for newly built fixtures; its already accepted historical samples are not being labeled missing. The date plan has 24 tasks, including exact budget copy, isolated parent/candidate preparation, existing functional/SSR/consumer checks, cold/warm capture and analysis/report checks. The automatic manual-fixture verifier does not establish human acceptance.

## Concrete next execution, after allocation

Finish Tools' repair qualification and bind its final source/runtime handoff first. Then reconcile the existing plans with that source, bind fresh outputs and exact installed tools/browser/fixture identities, and allocate serial work through existing ownership and bounded execution. Normal permitted desktop activity remains disclosed; no separate-account prerequisite is introduced.

```sh
tooling/test-pipeline/with-toolchain.sh node tooling/testing/invoke.mjs specialized --pathways=lazy-performance,activation-performance --id=runtime-mechanisms-full-20260927-01 --output=/private/tmp/runtime-mechanisms-full-20260927-01

tooling/test-pipeline/with-toolchain.sh node tooling/testing/invoke.mjs specialized --pathway=date --id=runtime-date-full-20260927-01 --output=/private/tmp/runtime-date-full-20260927-01
```

These commands are prospective and unallocated. Proposed outer safety caps are 7,200 seconds for lazy full, 1,800 for activation full, and 10,800 for the entire mechanism union including preparation/qualification. For date, propose 7,200 seconds cold, 3,600 warm, and 18,000 for its complete plan. These are conservative review proposals, not expected durations or implemented CLI flags: the existing `measure.py`/specialized runner has no whole-command time limit. The coordinator must bind the limits to existing reviewed bounded execution before launch.

Date preparation resolves parent `2dc77b5773839f7afdd52ce0b4fc68a6af35d0f4`, its seven-file subject overlay, compatibility overlay and actual caller tools. The parent resolves locally. The v1 budget bytes remain unchanged. An independent confirmation is conditional on the existing budget checker finding an interval crossing a bound while its primary median remains inside; every confirmation must remain visible. An over-budget primary median needs a revised candidate, not a favorable retry. `freeze.py` is a separate archive action requiring authentic manual disposition and prior-seal checks; it is not an automatic publication step.

## Completed work that must not be repeated

The original native attempt acquired 2,310 samples, including 30 failures. The separate continuation acquired 648 samples, including six failures. Both cohorts remain separate, with their original failures. Current En Reve load/interaction gates and final prepared-input reconciliation are qualified; administrative resource recovery is complete. No new reference/B3/native/current measurements are needed for this reconciliation.

The accepted 280-task correctness closure, 754 Node cases per runtime, repeated affected comparisons and specialized diagnostic repairs remain their own evidence. The existing cold-boundary decision explicitly requires no unchanged full cold rerun solely for coordination identity changes. Collector investigation retained the fixed-wait default; a future acknowledgement-default promotion is not remaining implementation in this plan. Explicit historical reproduction recipes are inventoried provenance, not an instruction to replay sealed investigations.

## Manual scope correction

Phase 5 real IME, scoped-shadow autofill and history follow-up workflows were reviewed and sealed. Targeted Phase 6 desktop VoiceOver naming, navigation, selection, dismissal, loading/cancellation, native editing/form recovery and repeated Safari retry speech were reviewed. The final Phase 6 results accept full weekday/date labels and Firefox's visible native date button. An older manual JSON still contains stale follow-up state; it does not reopen the later accepted disposition.

Physical mobile/native-picker behavior, date-specific physical IME and broader date-specific saved-profile autofill/history distinctions remain unreported coverage. The existing follow-up plan assigns these to post-merge task 7 and explicitly says those tasks are not remaining phases of the sealed Phase 1–6 plan. Preserve those limits; they are not a newly invented prerequisite for the three automated tiers. No new user manual action is requested now. If later changes affect a reviewed interaction, identify that exact scenario and prepare a build-bound fixture before requesting the necessary review.

## Source and evidence handoff

`artifacts/test-runtime-2026-09-25/remaining-required-work-v1/handoff.json` contains exact prepared-plan paths, dependencies, quantities, proposed caps and prior-evidence hashes. `source-identities.json` binds 65 current command/protocol/overlay/budget files. It is a source snapshot, not a frozen dependency or browser closure; Tools repairs must be reconciled before execution. `existing-plans.json` preserves the three previously qualified command templates.

The coordinator reported that Tools' focused 98-check window stopped after 49 Current cases: 28 passed and 21 failed; LTS did not start. Resources were returned and repairs are underway. This status does not alter accepted Runtime measurements or authorize a new Runtime workload.

[Progress Report](http://127.0.0.1:4177)
