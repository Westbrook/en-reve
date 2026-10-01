# Phase 6 execution and results

Status: final source, automated qualification, targeted manual acceptance and
production timing/retention evidence are complete. The original v1 archive remains
immutable; the final v2 campaign covers retry/lifecycle closeout. The Phase 6
source/evidence boundary is commit `220d2dd3`.

## Delivered behavior

- Existing eager default, canonical definition closure, catalog/define entry and
  range behavior stay eager.
- Single-date `calendar-loading="deferred"` delays calendar construction. With the
  eager definition, its code is already available and first opening does not fetch
  an import wrapper. The dialog and field remain eager.
- `datePickerShellDefinition` supports explicit optional chunk delivery using the
  same constructor. `preparePicker()` loads code without registration or mounting.
- Pending opens coalesce; hide, Escape, reset, disabled/read-only, disconnect,
  adoption and focus departure cancel late opening. Current data/constraints are
  read after loading. Registry conflicts remain terminal; definitions cannot be
  rolled back. Real failed-import retries succeeded in Firefox and required reload
  in Chromium/WebKit for the captured aborted-request scenarios. The isolated
  HTTP 503 fixture recovered in Firefox/WebKit; Chromium still required reload.
- The realized calendar remains connected when closed. No per-picker registry,
  detached cache or discard/recreate policy was added.
- Deferred SSR omits the calendar and preserves the native input and its edited
  value during hydration. Before FACE upgrade, editing is available but the nested
  native input does not submit to an outer form.

## Qualification

The exact candidate packages are built from the sealed parent plus the enumerated
source overlay, with generated API metadata, npm pack/extraction and Vite production
consumption. Unrelated working-tree changes do not enter this comparison.

The automated suite covers all three engines, global and scoped-requested modes,
loading, failure/retry, concurrent requests, close veto, editing while loading,
reset/disabled/read-only, transactions, shared-scope containment, forced colors,
small viewport/reduced motion, existing eager compatibility, SSR input identity
and submission. Node SSR/date/range/definition-graph/public API checks pass.
Firefox's scoped request uses global fallback; it is not reported as native scoping.

Targeted date-specific VoiceOver cursor/speech, navigation, native editing,
failure/retry and form workflows were reviewed in Chrome, Firefox and Safari.
Full weekday/date names and Firefox’s native button remain, with the documented
browser differences accepted. Physical mobile and date-specific IME are not
claimed. Final review fixture: [Phase 6 date review](http://127.0.0.1:4240/?progress-report).

## Original v1 policy study and measurement boundary (historical)

A preliminary 90-sample exploratory study compared cold, intent, route and
construction-only policies against the parent. It exposed a redundant eager import
wrapper, then a small startup-byte budget overrun. Both were addressed before
freezing the final candidate. These earlier samples are excluded from final results.

The final selected comparison is construction deferral with eager calendar code:
4 arms (parent/candidate × global/scoped request), 6 configurations × 30 successful
samples = 720 timing samples; 5 separate retention repetitions per arm = 20 runs,
100 cycles each. A bounded warm HTTP-cache/new-document comparison adds 240 samples
across desktop and constrained Chromium. Same-document repeat opening is separate.

The predeclared budgets remain unchanged. Final values for scoped Chromium:

| Metric | Parent | Phase 6 | Change |
| --- | ---: | ---: | ---: |
| Initial live page nodes | 651 | 161 | −75.27% |
| Initial compressed JS bodies | 51,475 B | 55,476 B | +4,001 B |
| Constrained first calendar focus | 23.00 ms | 43.15 ms | +20.15 ms |
| Constrained repeat focus | 9.35 ms | 8.70 ms | −0.65 ms |
| Cold constrained shell ready | 700.40 ms | 705.40 ms | +5.00 ms; inconclusive direction |
| Warm constrained shell ready | 206.35 ms | 198.15 ms | −8.20 ms |

Negative latency/bytes/node changes are better for equivalent functionality;
positive changes are added cost. No universal startup speedup is claimed. Eager
consumers also acquire approximately 4 KB of code, even without deferred construction.
Encoded resource-body sizes include cache hits and are not warm transfer bytes;
a separate cache proof confirms zero JS transfer in the warm fixture navigation.

An independent 120-sample Firefox confirmation was required because the first
startup interval crossed the +16 ms budget despite a −1 ms median change. The
repeat's scoped-requested/global-fallback startup change was −11 ms, with interval
−21 to +5 ms; explicit global was −4 ms, interval −15.5 to +7 ms. Both are within
budget. Runs remain separate; they are not pooled. All other initial practical
budget checks passed. Total: **1,080 successful timing samples**, at least 30 per
configuration, plus the **20 separate retention runs**.

All retention repetitions showed zero node/listener growth from cycle 10 to 100.
Median JS heap growth was 245,524→297,564 B in scoped mode, an additional 52,040 B;
global mode added 49,256 B. Both are within the 262,144 B additional-growth budget.
These descriptive five-run results are not proof of no leaks.

[Sortable performance report](http://127.0.0.1:4206/comparison-658adf53dd0c.html?progress-report#final-timing).
Reference archive: `showcases/performance/baselines/scoped-registry-phase-6-v1`.

## Rollout and optional follow-up scope

Opt in per field/consumer before first update. Eager remains the default and rollback
recipe; policy changes require fresh fields/roots or a fresh navigation rather than
rebinding live registry ownership. Range remains eager and rejects the deferred
combination explicitly. Mixing eager and shell consumers preserves constructor
identity but removes potential chunk savings.

Other families remain ranked follow-up candidates: optional color tools first,
editor/media auxiliary UI second, and inactive panels/collections only where
content discovery, focus and assistive reading remain intact. No broad rollout,
calendar wrapper simplification, virtualization or server-worker change belongs
in this pilot.

## Interpretation limits

The initial 490-node saving is deferred construction, not permanent removal. The
calendar is retained after first use, plus the deferred path's local status node.
A consumer that immediately opens every field may gain little from the smaller
initial tree and pays the construction cost during interaction. The report must
show startup, first/repeat focus and delivery together rather than ranking on DOM
alone. No result here establishes field INP, paint completion, universal browser
speech behavior, physical mobile behavior or a library-wide default change.

## Manual retry follow-up — September 23 (chronological evidence)

The following entries preserve intermediate investigations and build observations.
Their outstanding checks were resolved by the [final closeout decisions](#final-closeout-decisions)
and [final closeout campaign and seal](#final-closeout-campaign-and-seal); they are
not current blockers. Frozen original evidence remains unchanged.

The user completed the guided date-selection, focus, loading, cancellation, native
editing, form-value and unavailable-date checks in Chrome, Firefox and Safari.
Safari retry stayed closed silently. Clearing/restoring the same status text did
not help; distinct numbered retry errors were announced on successive attempts,
with native editing and form values intact. This result applies to the experiment.

The library now exposes `loadRetryErrorLabel` / `load-retry-error-label`, retaining
`{attempt}` for distinct failed-retry messages. Initial errors retain their existing
label. Canceled/coalesced openings do not add extra failed attempts; successful
opening clears the count. There is no frame/timer wait or focus workaround.
The public `showPicker()` documentation was also restored.

The separate candidate is in `artifacts/scoped-registry-phase-6-retry-closeout`.
Thirty full browser scenarios pass across three engines and both requested registry
modes, including localization, coalescing, cancellation, reconnect and native
editing. Six disabled-cancellation cases were checked separately. Node, SSR, API
and type checks pass; metadata was merged as an isolated delta. The integrated
Safari VoiceOver retest is at `http://127.0.0.1:4237/?fail&progress-report`.

A separate re-enable issue was found: the nested calendar trigger could remain
disabled after the host was re-enabled. Chromium reproduced this in both the original
and revised fixtures. At this checkpoint it remained open, alongside weekday
announcement redundancy and Firefox native calendar-button styling. The correction
and accepted browser limits are recorded below.

No new timing or retention campaign had been frozen at this retry-only checkpoint.
Preliminary total JS gzip was 141 bytes above the frozen construction-only candidate;
the unchanged payload budget still required qualification before sealing. The final
v2 campaign below supersedes that preliminary observation. The original campaign
and manual evidence remain in `artifacts/scoped-registry-phase-6/manual-review.json`.

### Integrated retry acceptance and re-enable correction

The user confirmed successive counted retry announcements in the actual library
fixture (port 4237), so Safari silent retry is resolved. The date picker now also
requests a follow-up render after the native re-enable callback: attribute
reflection could otherwise leave the nested trigger showing an obsolete disabled
state. This correction stays in the date picker; the general form controller is
unchanged.

The isolated build at this checkpoint was `artifacts/scoped-registry-phase-6-lifecycle-closeout`.
All 36 retry/cancellation/localization/native-editing scenarios and 72 re-enable
scenarios (three cycles each) pass across three engines and both requested registry
modes. Re-enable checks cover eager single/range and both deferred delivery modes,
self/fieldset disabling and readonly toggles. Node, SSR, API and type checks pass.
The two manual feedback items still open at that checkpoint were weekday repetition
and Firefox native calendar-button styling; both received the accepted dispositions
recorded below. No additional Safari retry walkthrough was required.

The lifecycle build's preliminary total JS gzip was 153 bytes above the original
frozen DOM candidate; the previous 141-byte observation described the intermediate
retry-only build. New timing/retention and payload-budget qualification were still
required then and are complete in the final v2 campaign below. Neither the old
frozen data nor its acceptance budgets were changed.

### Weekday announcement investigation

The isolated `column-weekday` experiment retained full localized column headers
but removed weekday from individual date-button names. Twenty-four automated
original/experimental cases passed across three engines in English and French;
these checks did not establish spoken weekday context. The user reports reduced
repetition in Chrome and Firefox, but WebKit omits weekday in both directions.
The experiment is not adopted. Keep the original full weekday/date button names
and semantic headers; documenting duplicate contextual weekday speech is preferable
to removing the weekday context that WebKit previously announced. The user accepted retaining the original labels and documenting this behavior.
No repository calendar source or frozen evidence changed for the experiment.

## Final closeout decisions

The user authorized completion and sealing after accepting the original weekday
labels. Retain Firefox’s visible, functional native date button: the WebKit-only
selector does not apply, and clipping an interactive native control would create
an invisible focus target. No calendar label experiment or focus-delay workaround
is included in the library. The integrated localized retry count and nested-trigger
re-enable correction are included. Calendar setup shared by eager, deferred and
trigger paths is consolidated without changing its ordering. The single-selection
guard reuses the same error text in both property assignment orders.

The isolated final build is `artifacts/scoped-registry-phase-6-closeout-v4`. Its
deterministic initial gzip JS is 51,475 → 55,551 bytes (+4,076), below the unchanged
4,096-byte cap. WebKit resource accounting differs slightly and is separately
qualified against that cap. The v2 build (+4,111 emitted bytes) was rejected before
timing. The v3 build (+4,094 emitted bytes) completed 960 timing samples and 20
retention runs, but WebKit reported +4,103 bytes, exceeding the cap by 7; its full
source and distributions are retained as rejected evidence, not pooled with the
final campaign. Shorter private diagnostic errors reduce payload without changing
manual-review messages or behavior. Eager compatibility does not mean zero eager
bundle overhead, and future capability growth must recheck this narrow margin.

All node/SSR/API/type and browser qualification passes apply to the final build.
This includes 36 retry/localization/cancellation scenarios, 72 re-enable scenarios
with three cycles each, broader compatibility/containment/range checks and SSR
input identity/value preservation. Safari’s manually observed retry behavior is
kept distinct from automated WebKit import-cache recovery.

The harness now supports independent `PHASE6_BASE` directories, refuses build/run
overwrites, snapshots exact measured inputs, and seals only complete successful
cells with separate retention and passing aggregate acceptance. Primary uncertainty
and any independent confirmations are retained separately. Budgets are unchanged.

## Final closeout campaign and seal

**960 successful timing samples**, at least 30 per configuration, plus **20 separate 100-cycle retention runs**. The raw cold, warm and any independent confirmation studies remain separate.

| Endpoint | Phase 5 parent | Final Phase 6 | Change |
| --- | ---: | ---: | ---: |
| Initial nodes | 651.00 | 161.00 | -490.00 |
| Initial gzip JS bytes | 51,475.00 | 55,551.00 | +4,076.00 |
| Cold shell readiness, ms | 682.15 | 689.35 | +7.20 |
| Constrained first focus, ms | 19.85 | 37.70 | +17.85 |
| Constrained repeat focus, ms | 7.90 | 8.15 | +0.25 |
| Warm shell readiness, ms | 205.90 | 196.35 | -9.55 |
| Desktop Chromium first focus, ms | 4.20 | 8.40 | +4.20 |
| Desktop Firefox first focus, ms | 6.00 | 15.50 | +9.50 |
| Desktop WebKit first focus, ms | 2.00 | 8.00 | +6.00 |

Change is candidate minus matched parent: negative latency/bytes/nodes is lower cost; positive is added cost. These selected medians are not uncertainty intervals; the sortable report retains p75, full spread and exploratory matched bootstrap intervals.

[Final sortable comparison](http://127.0.0.1:4206/comparison-d9e0a40bd4ac.html?progress-report#final-timing). Immutable archive: `showcases/performance/baselines/scoped-registry-phase-6-v2`. Exact source overlay and build/package hashes are in `frozen-input/manifest.json`; source is sealed by commit `220d2dd3`.

All predeclared practical latency, delivery, benefit and retention budgets pass. No extra confirmation was needed for this final candidate. Primary intervals fit the unchanged limits; `budget-check.json` retains every check. The supplementary warm latency review also fits the same limits (`warm-budget-review.json`). Retention maxima: nodes 0, listeners 0 (cycle 100 minus cycle 10). Heap results are descriptive and remain within the additional 262,144-byte budget; zero DOM growth is not proof of no leaks.

The opt-in is useful for often-unused calendars. It reduces initial connected DOM but adds code and moves construction work onto first use. Range and defaults remain eager. A used calendar remains connected when closed, so its initial node saving does not persist after opening. Cold optional chunk delivery remains an explicit consumer choice rather than the recommended immediate-use policy.
