# Consumer retention attribution result

**The historical whole-workflow growth is attributable to old template instances retained by the connected app's Lit keyed child part. It is not evidence of a calendar teardown leak. Keep eager and leave the optional-calendar pilot unpromoted.** No product source or dependency was changed. The private cleanup call below is a causal test only and must not be shipped as an application workaround.

The clean investigation branch is based on `37a4dbac332b5324afe07c61b1e701ced07bfe57`, with Phase 6 seal ancestry verified. Browser experiments deliberately reuse the immutable eager consumer build from source `6f08c49de0e02e7b3b4016c54ec8219c2f4079ec`, sealed delivery `a0c814395bbbf7d56733a1efc37c7eaaed1b8a2b`, based on `66386af7daac295cb2e178236d45289a9ebced4f`. This is attribution of that old result, not a current-main qualification. All 1,836 eager/deferred historical asset hashes passed before and after each campaign. Selected exact executed JS assets are copied under `inputs/`; their full original production archive remains sealed in the consumer worktree.

## Evidence chain

26 fresh-context Chromium runs succeeded: 14 initial controls (seven configurations, two repetitions), eight conditional controls (four configurations, two repetitions), one stronger heap-path capture, and three final causal controls (one unchanged inventory control, two cleanup interventions). Each executes 30 cycles and records checkpoints at 0/10/30. No timing campaign or runtime promotion is claimed. Chromium was `153.0.8010.12`; Node/OS/CPU/power/thermal and viewport are in each manifest. Every route uses the document-global registry. Native scoped, actual fallback in another engine, cold/warm timing and first/repeat latency are not added to this attribution lane.

All following growth deltas are **cycle 30 minus cycle 10 within the same run**, not subtraction from Phase 6 or another workload. Positive means growth; negative would mean fewer retained objects. Lower retained node/listener/heap cost is better; zero attached-census change is the workload-stability check.

- Original-style workflow opening, with study enabled or absent: both repetitions add **41,340 nodes and 7,000 listeners**. This exactly reproduces +2,067 nodes/+350 listeners per cycle from the old 100-cycle lane.
- No opening: both repetitions add **41,280 nodes and 7,000 listeners**. A further three-second drain and double GC leave those counts unchanged. Native close-event delay does not explain this dominant no-open growth.
- Minimal eager date, deferred date, text field and native input replacement: **zero node/listener growth** after warm-up in both repetitions. This does not prove all fields or workloads leak-free, but it separates the whole-workflow retention from ordinary single-field replacement.
- Direct CDP evaluation with released object groups, batched CDP evaluation, and keyed generation changes without host disconnection: **41,280 nodes/7,000 listeners** in both repetitions. Repeated Playwright evaluation and reconnect-specific listeners are not necessary for the growth.
- Replace the complete app host instead of reusing it: **zero node/listener growth** in both repetitions. The retaining owner follows the reused host.

Connected document/shadow census remains stable within each run. Documents stay at three. Heap bytes are descriptive and vary independently; even flat native controls have small JS heap growth. No confidence interval or population rate is inferred from these small diagnostic samples.

## Retaining path and causal intervention

The first heap snapshot's shortest path crossed WeakMap ephemeron edges. That structural path alone was insufficient, so a second independent snapshot excludes every WeakMap from traversal. It still reaches detached fields through:

`connected en-workflows-app → _$litPart$ → committed template → child part 27 → _$AN Set → old TemplateInstance → child parts → en-date-picker`

The path through the live document is ordinary reachability; the Playwright UtilityScript appearing before Window in a shortest path is not itself evidence that automation retains each old workflow. Direct CDP/batch and full-host controls test that distinction. Heap detachedness markings vary: first capture counted 61 detached date-picker nodes and the second 60, with 62 date-picker native nodes total in each. Both show the relevant old template paths. Raw snapshots were parsed in memory and discarded; only aggregate counts and sanitized structural paths were saved. No heap string values, form contents, dates, source bodies or DOM attributes were persisted in those summaries.

The unchanged inventory control records the keyed part's disconnectable-child Set at **1 → 21 → 61** entries over cycles 0/10/30: one prior template instance remains for each of two workflow replacements per cycle. The currently committed instance is always present. The exact packed `keyed` helper calls `setCommittedValue` before rendering a changed key; that helper replaces the previous committed value. AsyncDirective's clearing path uses that committed value to disconnect/remove children. The retaining Set, source sequence and matched intervention jointly explain the historical growth.

Two independent diagnostic runs call the historical child part's existing `_$AP(false, true)` cleanup hook immediately before each workflow removal/key invalidation. The Set stays **1 → 1 → 1**; both runs have **zero node/listener growth** from cycle 10 to 30, with stable attached census. The unchanged control grows by 40 Set entries, 41,280 nodes and 7,000 listeners. This intervention establishes the retaining owner and cleanup-order mechanism in the measured historical application composition. It is not a supported public API, behavioral fix, SSR qualification or production candidate.

## Recommendation and ownership

Do not clear Lit private fields in product code, suppress the retention counters, change date-picker teardown, or reinterpret the old failure as harmless. Preserve the old whole-workflow retention failures and annotate them with this separate attribution. The original whole-route benefit gate also failed independently, so this finding does not rehabilitate the deferred-calendar policy.

A future fix should preserve removal/disconnection ordering through supported rendering APIs—for example, assess a one-item keyed `repeat` boundary—or address the dependency's keyed/AsyncDirective interaction. The coordinator and integration owner own selection and qualification of that follow-up. Before promotion, build matching SSR/client output on the then-current main and candidate, verify workflow lifecycle/focus/form behavior, capture at least 30 successful timing samples per affected configuration, and run separate repeated retention under unchanged budgets. The diagnostic private-hook intervention is expressly excluded from integration.

The separate date-retention audit `bb15184a1be4469f89b2777af82797bf70092a94` found occasional one-calendar residuals with WeakRef observation differences. Those remain a different, unresolved workload; this result must not be transferred to it. That peer task was already archived when this result was ready, so ownership was handed to the parent and integration owner without reopening it.

## Limits, failures and resource discipline

Both the canonical browser file lock and shared machine directory lock were acquired in that order without stealing, then released after each run. The integration owner explicitly allocated Stage 1 and the at-most-twelve conditional controls; the bound was met exactly. Browser cache was `/Users/westbrook/Library/Caches/ms-playwright`. No contention failure occurred. There were zero browser/page failures. One generated-script syntax failure occurred before any browser or lock acquisition; its source and disposition remain under `attempts/`. It is not counted as a successful browser sample or silently relabeled.

No new library interaction, SSR build, actual assistive-technology or physical-device review occurred. Diagnostic automation and heap/counter checks are not AT/device review. Accepted Phase 0–6 manual dispositions remain untouched. No dates, field contents, persistent identifiers or external analytics were collected by opt-in metrics; scripted fixture inputs are not real-user observations. No real-user use rate is known. No merge, publish or deploy occurred.

## Reproduction

From the investigation worktree, use a fresh output path and the installed browser cache. Obtain the serialized resource slot first; each script fails on an existing output or either occupied lock.

```sh
PLAYWRIGHT_BROWSERS_PATH=/Users/westbrook/Library/Caches/ms-playwright node artifacts/scoped-retention-attribution/reproduce.mjs /private/tmp/consumer-retention-fresh-stage1
PLAYWRIGHT_BROWSERS_PATH=/Users/westbrook/Library/Caches/ms-playwright node artifacts/scoped-retention-attribution/stage-2.mjs /private/tmp/consumer-retention-fresh-stage2
PLAYWRIGHT_BROWSERS_PATH=/Users/westbrook/Library/Caches/ms-playwright node artifacts/scoped-retention-attribution/stage-2-paths.mjs /private/tmp/consumer-retention-fresh-paths
PLAYWRIGHT_BROWSERS_PATH=/Users/westbrook/Library/Caches/ms-playwright node artifacts/scoped-retention-attribution/stage-2-causal.mjs /private/tmp/consumer-retention-fresh-causal
```

These scripts depend explicitly on the preserved original consumer worktree for its packed assets, server helper and Playwright installation. They are local attribution tools, not a portable current-source gate. The exact executed `stage-2-paths` source is archived in `inputs/`: only its helper import path was later clarified to retain both parser versions. Use the offline verifier for ordinary review; there is no reason to rerun the browser studies merely to close this completed attribution.
