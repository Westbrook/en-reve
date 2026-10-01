# Single-date delivery and first-opening cost

Decision: retain the current runtime. One isolated dependency experiment was rejected: removing the `guard` directive saved 221 gzip bytes in construction-only delivery but increased calendar rendering during first opening. No runtime optimization is promoted, and no new full timing or retention campaign was run for this documentation/evidence conclusion.

## Exact boundary

- Latest local main at isolation: `66386af7daac295cb2e178236d45289a9ebced4f`.
- Verified ancestor: Phase 6 seal `220d2dd3e4f55c6f2557d7e7fc593d5d16099bba`.
- Branch: `codex/scoped-followup-date-cost`.
- Worktree: `/Users/westbrook/.codex/worktrees/scoped-followup-date-cost/design-system`.
- Original checkout preserved; no stash, reset, branch change or tracked-file writes there. Concurrent tasks may independently change it.
- Canonical independent report located through the original checkout's ignored `.progress-report/project.json`; reused at `http://127.0.0.1:4177`. Updates use `data/.project.lock` and task-specific records. No duplicate report or replacement global handoff.
- No repository `AGENTS.md` was found in the applicable ancestors or worktree; the supplied personal instructions and progress-report skill were read. Phase 6 plan/results, date README, element scope, loader and activation contracts were read. The canonical handoff's older `awaiting_manual_acceptance` outer field is stale relative to its accepted manual records and sealed plan: this investigation preserves the accepted outcomes.

Evidence lives in [artifacts/scoped-followup-date-cost](../artifacts/scoped-followup-date-cost/README.md). [Sortable en-table results](http://127.0.0.1:4255/results.html?progress-report) distinguish emitted inventory, browser resources, stage diagnostics and the rejected trial. The results page is an evidence viewer linked from the existing independent report.

## Method and inference limits

The sealed build protocol is retained: isolated source export, ordered package builds, generated metadata, npm pack, extraction, Vite production target ES2022 with unchanged defaults, HTTP/2, Node zlib gzip level 6, blocked service workers. `prepare-current.py` replaces the historical parent/overlay recipe with an exact current-main export. It does **not** label today's main as the old Phase 5 parent. The trial changes only the isolated export's date-picker binding; its source patch and exact packed packages are retained.

A read-only bundler plugin records static/dynamic edges and module membership. Final emitted files are hashed after Vite finalization and verified byte-for-byte against the original production receipts. Initial delivery follows the entry's complete static import closure. All-emitted totals also include unreachable-at-runtime wrappers. Module `renderedLength` is pre-final-minification attribution; it is **not** an additive allocation of compressed bytes. Gzip dictionaries and shared chunking prevent assigning exact compressed costs by subtracting arbitrary module lengths.

Twenty-four current-main diagnostic cases cover eager, construction-only and cold shell × explicit global/scoped-requested × Chromium/Firefox/WebKit desktop and constrained Chromium. Eight rejected-trial cases cover the same construction-only configurations. Each cell has **one instrumented observation**, not 30 samples or a timing distribution. The original shared browser lock serialized browser work across worktrees. Other tasks were building; these traces are for operation attribution, not performance acceptance. No medians, confidence intervals, p95 or latency change claims are derived from them.

Desktop viewport is 1280×900. Constrained Chromium uses 4× CPU, 150 ms latency, 1.6 Mbps download and 750 Kbps upload. Each case starts a fresh browser/context and observes a deliberate 500 ms unused window before a trusted Enter activation. This diagnostic lead is different from the sealed campaign's no-intentional-lead primary timing. Same-document repeat is recorded separately. Warm HTTP-cache/new-document, emulated touch, abandoned intent and repeated retention were not reacquired; no results are inferred for them.

The accepted historical Phase 6 +4,076-byte result remains historical. Current totals below are freshly reproduced, and the trial comparisons use the same current base, consumer, dependency installation, bundler and protocol. Phase 0–6 timing series are never pooled or subtracted from these observations.

## Deterministic delivery

| Current-main policy | Static closure gzip B | All emitted gzip B | Optional-only gzip B |
| --- | ---: | ---: | ---: |
| Eager | 55,695 | 55,779 | 84 |
| Construction-only (`dom`) | 55,703 | 55,787 | 84 |
| Cold shell | 50,589 | 56,485 | 5,896 |
| Intent shell | 50,646 | 56,542 | 5,896 |
| Route shell | 50,633 | 56,529 | 5,896 |

For the same current-main fixture, construction-only versus eager adds 8 initial bytes from the policy/consumer binding; both already contain the Phase 6 capability code. This **does not** mean the capability cost only 8 bytes when introduced. Shell versus construction-only removes 5,114 initial bytes (9.18%) but adds 698 all-emitted bytes. Negative byte changes mean less delivery; positive means more. Intent/route have slightly different consumer instrumentation and preparation code, so their entry totals differ.

The eager/`dom` graph has a 75-raw-byte, 84-gzip-byte emitted dynamic re-export wrapper. It is not fetched during the observed eager/construction-only openings: the eager definition calls `availableDatePickerCalendar`, so preparation returns the already available definition. Removing this unused output file would not reduce the measured eager route's initial or first-use delivery.

The cold shell's optional chunk contains calendar element, calendar styles, state-value helper and calendar definition. Its 21,143 raw / 5,896 gzip bytes are a real deferred boundary. The other chunks remain initial:

| Cold shell chunk | Raw B | Gzip B | Responsibility |
| --- | ---: | ---: | --- |
| `index-BNq0J_tS.js` | 93,135 | 23,782 | Picker/native form shell, dialog, control/overlay styling and consumer code |
| `icon-B6iW_Bey.js` | 102,220 | 26,807 | Shared Lit/signals, tokens, scope/base, buttons/icons, date helpers and shared styles |
| `calendar-CNWgEN4s.js` | 21,143 | 5,896 | Optional calendar implementation and styles |

The icon-named chunk is not an icon-only cost. Largest retained module contributions include control styles (26,503 rendered characters), date-picker class (23,737), signal-polyfill (15,854), token defaults (14,082), dialog class (10,039), Lit HTML (9,602), button rules (8,836) and feedback styles (8,308). Shell-shared date primitives (5,583), calendar adapter (3,606) and range helper (1,925) are static. The same constructor still supports synchronous validation, alternate calendar summaries and eager range behavior; removing those imports is not a narrow unused-dependency deletion. The optional promise cache itself is 619 rendered characters; the general loader is type-only here and is not dragged into this graph.

Browser-observed resources are separate. Chromium/Firefox report two completed JS responses at shell readiness: 55,703 encoded bytes for `dom`, 50,589 for cold. Cold first use completes a third response and reaches 56,485 encoded bytes. WebKit records 55,757, 50,643 and 56,557 respectively. Those differences are preserved rather than replacing browser counters with deterministic totals. Resource names, start/end, encoded/decoded bodies, transfer counts and protocol are in the raw attempts. `encodedBodySize` is not warm transfer. These fresh-context observations do not establish warm-cache behavior or universal preload behavior.

## First-opening trace

1. The trusted trigger's requested dialog opening is intercepted while the calendar is absent. The pending picker open is coalesced; status becomes loading locally.
2. Eager-code construction deferral resolves the shared available definition without a network request. Cold shell fetches/evaluates its optional module. Definition preparation is distinct from registry registration and rendering.
3. Registration preflights the actual render-root registry. In `dom` the calendar is already registered, so no new calendar definition is added. Cold registers before setting `calendarMounted`; no per-picker registry is allocated. Firefox scoped requests actually use global fallback; Chromium and WebKit use native scopes in these captures.
4. Picker update creates the calendar through the existing owner-aware Lit creation scope. `document.importNode`, render-root creation, connection and first `performUpdate` bound this work. Constructor duration is not individually isolated; it would be misleading to call connection or module resolution the constructor time.
5. Initial calendar rendering is followed by `syncCalendar` before opening, then another synchronization through `dialogChanged`. The `rangeValue` setter copies accepted/draft state and requests an update even in single mode. This yields three calendar renders before first usable focus, compared with one on the already-constructed eager path. The current path builds 19 `Intl.DateTimeFormat` instances before focus, versus four on eager in this boundary. Counts include picker summaries/adapter creation and calendar labels; they are not all removable.
6. `dialog.show()` performs the cancelable transaction. Its update invokes native `showModal`, which includes style/layout and native focus behavior. Subsequent calendar focus targets the current day. A separate queued callback can call `calendar.focus()` again; the first-focus endpoint does not establish assistive reading-cursor behavior.

One **instrumented diagnostic example**, Chromium native scope:

| Stage | Desktop `dom` ms | Constrained `dom` ms |
| --- | ---: | ---: |
| Gesture → usable calendar focus | 8.60 | 47.30 |
| Calendar update calls, inclusive | 3.20 | 15.90 |
| Native `showModal`, inclusive | 3.00 | 16.30 |
| Style recalculation, trace slice | 1.79 | 9.21 |
| Layout, trace slice | 1.16 | 6.66 |
| Same-document repeat focus | 2.10 | 9.80 |

Inclusive method times overlap the style/layout trace and must **not** be summed into an additive stack. The trace slice uses Chromium navigationStart plus the same gesture/focus clock; Firefox/WebKit style/layout values are unavailable, not zero. Native registration calls are recorded, but preflight time is not isolated from surrounding JavaScript. Zero-duration operations can reflect clock resolution.

Cold constrained native-scope first focus was 238 ms in its single diagnostic, with an additional network request; its calendar update work was 19.10 ms and `showModal` 15.90 ms. This identifies where the wait occurs but is not a statistically supported regression estimate or a new budget verdict. The complete raw trace and resources, including adverse observations, accompany the result.

The current-main fixture has 659 initial page nodes eager and 164 deferred; a realized deferred calendar remains present after use. These absolute current counts are not substituted into the frozen 651→161 series.

## One rejected experiment

Replace `.rangeValue=${guard([this.rangeValue],()=>this.rangeValue)}` with `.rangeValue=${this.rangeValue}` and remove the now-unused static guard import, only in an isolated source export. This is an ordinary dependency/binding experiment, with unchanged minifiers, labels, messages, headers and constructor identity.

| Policy | Base initial gzip B | Trial initial gzip B | Trial − base B |
| --- | ---: | ---: | ---: |
| Eager | 55,695 | 55,474 | −221 |
| Construction-only | 55,703 | 55,482 | −221 |
| Cold shell | 50,589 | 50,345 | −244 |

Negative byte change is lower delivery. For construction-only first opening, seven of eight cases instead changed calendar renders 3→5 (+2) and formatter constructions 19→23 (+4); WebKit global changed 3→4 and 19→21. Positive operation-count change means added work. Lit's non-primitive property binding writes the object again on parent updates; the calendar setter copies/reset states and requests another update. The guard is doing useful work even when the source binding looks redundant. Scheduling affects which extra update lands before the first-focus cutoff.

Reject the trial. A 0.40% initial saving in the main construction-only policy does not justify increasing the work this task aims to reduce. It was not fully functionally qualified and is not presented as safe for adoption. No latency delta is inferred from one diagnostic per cell. The patch, package tarballs, builds, module graph and all eight attempts remain reviewable.

No second runtime trial was made. Removing synchronization or bypassing its range setter is a distinct behavior change involving current accepted state, range draft resets, public mode transitions and cancelable opening. It should be coordinated with retention/range work and qualified if selected later. No active date-retention/range prototype was found in the task/worktree inventory; the concurrent optional-calendar consumer pilot was informed and explicitly avoids shared runtime. There is no overlapping runtime change to integrate here.

## Unchanged contracts, budgets and review

No package/runtime/public metadata changes are included. Properties, events, slots/Parts, eager default/range behavior, native editing and form transactions, SSR input identity, cancellation/retry and owner-registry behavior retain their current implementation. `load()`/`preparePicker()` prepare code; registration and render readiness remain separate. Activation still requires its documented registry/template/root conditions and cannot undo native registration.

The original budgets are copied unchanged into `budgets.json`: +4,096 unused bytes; first focus +16/+50 ms desktop/constrained; repeat +4/+10 ms; startup +16/+50 ms; retention +20 nodes/+10 listeners and +262,144 additional heap bytes. Historical minimum-benefit rules remain attached to that policy study. There is **no new pass/fail declaration against those budgets** from diagnostic observations. Any future promotion requires matched current-base/candidate packed-asset qualification, at least 30 successful samples per promoted configuration, separate repeated retention, cold/warm/repeat separation, uncertainty handling and all failed attempts. Those gates were not bypassed: there is no promoted change.

Accepted Phase 6 manual outcomes remain accepted for their reviewed fixtures. Full weekday/date labels and semantic headers remain. The rejected weekday-only-header experiment was neither rerun nor restored. Browser-sniffed focus delays, shorter accessibility messages, storage changes, range redesign and global framework changes were not attempted.

Automated observations establish DOM focus, current full date labels and successful opening/reopening for the inspected fixture. They do not establish VoiceOver cursor/speech, physical mobile, real IME, autofill/history restoration, BFCache or OS-native picker behavior. New actual assistive-technology/physical-device review was not performed. No changed interaction is being shipped, so accepted manual review is not reopened. The isolated rejected trial receives no inherited manual acceptance.

## Reproduction and handoff

See the artifact README for exact commands, source/build hashes, raw attempts and local viewer restart. The two attribution setup failures (a script syntax error and a premature pre-finalization hash comparison) are retained as tooling failures; neither produced a browser sample. An evidence-page verification attempt also stopped at the occupied canonical browser lock, before launching a browser; the later three-engine verification passed. All 32 diagnostic browser attempts succeeded. No exclusions, substituted zeros or outlier trimming were used.

The final verification checks production receipt hashes, static import closure membership, trial-only source scope, preserved archived file hashes, sortable result columns/direction notes and the report return link. Focused commits contain this plan and task-specific evidence only. Do not merge, publish or deploy this branch as part of this task.
