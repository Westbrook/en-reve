# Date calendar retention experiment

Status: complete; **retain-current**. Protocol and thresholds were declared before candidate comparison. No production promotion.

## Boundary and provenance

Isolated branch `codex/scoped-followup-date-retention`, worktree `/private/tmp/design-system-date-retention`, from latest local main `66386af7daac295cb2e178236d45289a9ebced4f` (tree `6f0cd79db801f483dd40b51885742580c951b8a0`). Phase 6 seal `220d2dd3e4f55c6f2557d7e7fc593d5d16099bba` verified ancestor before worktree creation. No uncommitted changes copied. Read Phase 6 plan/results, calendar/date-picker READMEs, public scoped-registry and activation contracts, canonical report handoff and all 30 open feedback items. Preserve them and all frozen Phase 0–6 artifacts.

Own only this plan and `artifacts/scoped-followup-date-retention/`. Build patches into an isolated export. Retain unmodified eager and connected-after-first-use references. No runtime/API, registry inventory, per-picker registry, generic eviction, automatic timers, range deferral, merge, publishing or deployment.

## Predeclared acceptance gates

A proposal needs all behavior checks plus >=30 successful timing samples in every configuration supporting it, five separate retention repetitions per Chromium configuration, and no unreported failed attempts. Diagnostic early rejection is allowed, and cannot establish a promoted policy. Reject a candidate that changes repeat-open active-date semantics; do not repair a failed gate by redefining expected behavior.

Practical benefit: after 20 fields are used and closed, >=20% AND >=256 KiB lower post-GC used heap than matched connected reference, OR >=20% AND >=2 ms less median style+layout work during a fixed 20-field resize/reopen workload. Node disconnection alone cannot meet this gate. No >128 KiB extra heap growth or positive node/listener growth over cycles 10–100 relative to connected reference. Repeat focus median regression <=4 ms, p75 <=8 ms; first focus median <=8 ms extra. Uncertainty crossing a threshold means inconclusive, not pass. Include per-cell n, median, p75, range and matched bootstrap 95% intervals if a serious candidate proceeds.

## Fixed protocol

Four policies: unchanged eager, deferred construction retain-connected, fixture-only deferred detach-warm, fixture-only deferred discard/recreate. All consume eager calendar code to isolate construction/lifetime from chunk delivery. One scope per page. Native Chromium auto, Chromium explicit global, Firefox auto (actual global fallback), with optional WebKit diagnostic confirmation. Never pool requested/actual registry modes or engines.

Workloads: one field used; 20-field scheduling form with all fields sequentially used; 20-field form with only one used is a separate sparse diagnostic. Value/default 2026-09-15, today 2026-09-22, bounds 2026-01-01..2026-12-31. Cold=fresh context HTTP cache; warm=same-context new document after prime navigation; first opening differs from same-document repeat. Stable 1280x900 viewport, local production build, no CPU/network throttle; not field INP or physical-device evidence.

Timing endpoint: explicit fixture action invocation through completed calendar focus, separate first/repeat and navigation. Report style/layout CDP duration/count deltas where available, unavailable in other engines. Retention: separate fresh contexts, forced double GC (Chromium only), 0/10/50/100 cycle checkpoints, mount/open/close/remove/reconnect. Page tree, inert template storage and detached warm trees counted separately. WeakRef observations after GC do not prove general collection; retain only weak references in census instrumentation. CDP DOM counters include detached nodes and implementation caches; do not call them connected DOM. Heap and listener totals are realm-wide proxies, not exact per-calendar retained size.

Close is accepted only after dialog state/native modal closure, focus restoration and actual outstanding animations finish; no timing-based teardown. Fixture owns an explicit quiescence operation. Never park range, focused/editing content, pointer gesture or pending operation. Canceled close remains open and retains its calendar. Reopen reads current constraints/value. View-state probe includes arrows, month navigation, close/reopen, value changes while closed and removal/reconnection. Form veto and author-write precedence, announcements' DOM text and focus checked separately from speech.

No imported module unloading or unregister claim. Record exact source patch, input/assets hashes, runtime/browser/OS, failures and discarded attempts. No historical Phase 0–6 deltas. Tables use sortable en-table and state candidate-minus-reference: negative latency/bytes/nodes is lower cost; a negative detached-node delta is less detached storage, not proof of collection.

## Review and promotion boundary

Conclude retain-current or one evidence-backed opt-in proposal. A proposal is not permission to promote: functional/SSR and targeted actual AT/device review for changed paths plus coordination with date payload/first-use owner are required first. Canonical date-cost handoff currently says retain runtime, commits c47797ca/88ac1fbf; this task will not land a competing implementation. Existing accepted manual decisions remain closed. No new AT speech, physical touch, real IME/autofill/history claim.

## Work plan

1. Baseline/contracts/protocol (weight 2).
2. Isolated policies and functional semantics (weight 3).
3. Matched timing and repeated retention, or bounded rejection (weight 3).
4. Sortable evidence, decision, commits and handoff (weight 2).

## Functional checkpoint

Twenty fixture configurations (four policies × Chromium auto/explicit global, Firefox actual global fallback, WebKit auto/explicit global) pass 12 guard/form/focus checks each. These are automated DOM/focus checks, not AT speech or physical-device review. Exported experimental package passes three existing calendar SSR tests; no SSR promotion is claimed.

Recreation fails the separate semantics gate in all five engine/mode cells: selected September 15 → ArrowRight September 16 without selection → close/reopen yields September 15, whereas eager, connected and warm-detached yield September 16. After value October 12 → PageDown → close/reopen, recreation focuses October 12 versus October 1 for retained instances. The renderer's equal-value write does not force active-date reset; resetting month can clamp active to day 1. Preserving all navigation state as a proposed policy would also change the established month-reset behavior. No API is proposed. Keep discard measurements diagnostic and separate from serious detach candidate timing.


## Final decision and evidence

Retain current behavior. Recreation changes active-date repeat semantics. Detach
keeps the calendar storage/listeners and fails the heap/style benefit gates; one
paired retention repetition also exceeds the added-growth budget. This is a
preserved negative result, not a pending API implementation.

Evidence: [full result](../artifacts/scoped-followup-date-retention/results.md),
[verification](../artifacts/scoped-followup-date-retention/verification.json),
[analysis](../artifacts/scoped-followup-date-retention/analysis.json), and
[sortable en-table page](http://127.0.0.1:4281/?progress-report).
The existing canonical report remains at http://127.0.0.1:4177; no duplicate report.

Completed: 1,080 main timing samples (30/cell), 120 exact style-window samples
(30/cell), 80 independent retention runs (5/cell), 144 recreation/control and 72
sparse diagnostic captures (3/cell), 240 final DOM/focus/guard assertions and 3
existing SSR tests. Diagnostic and final distributions remain separate. Six
one-field retention runs have nonzero node/listener deltas; this is not a clean
leak-free result. All raw attempts and uncertainty are retained.

Module/registry residency remains distinct from DOM collection. No new actual AT,
physical-device, IME/autofill/history or hydration review is claimed. Accepted
Phase 0–6 manual decisions and frozen evidence remain unchanged. Date-cost owner
confirmed no pending competing runtime and no integration is proposed here.
