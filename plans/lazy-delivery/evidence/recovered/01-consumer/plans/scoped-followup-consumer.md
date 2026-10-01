# Optional calendar consumer follow-up

Status: complete, unpromoted experiment. Retain eager behavior. The unchanged
whole-route benefit gate failed; repeated route teardown also exceeded retention
limits in both arms. No merge, publication or deployment.

Base: `66386af7daac295cb2e178236d45289a9ebced4f` (latest local main at start).
`git merge-base --is-ancestor 220d2dd3 main` succeeded. Sealed ancestor:
`220d2dd3e4f55c6f2557d7e7fc593d5d16099bba`. Branch
`codex/scoped-followup-consumer`, worktree `/private/tmp/design-system-scoped-consumer`.
No original-checkout uncommitted changes were imported. No applicable on-disk
AGENTS.md was found; the supplied personal report instructions apply.

## Selected existing route and audit

`apps/docs/workflows/multi-step.html` is the existing project-brief reference
application, not a new benchmark consumer. `multi-step-entry.ts` eagerly imports
`define/date-picker.js`, alongside text, checkbox, alert, progress and validation
controls. `workflows-client.ts` imports hydration support first plus shared buttons,
badges, selects, segmented controls and navigation. The date definition includes
calendar, dialog, button and icon dependencies. The final HTML entry/preload audit includes 177 JS resources, including both
calendar chunks, in each arm (360,524 versus 360,527 gzip6 bytes before use). No new
optional code import is needed for the proposed policy; production asset inventories capture the actual
bundler/preload graph rather than assuming source imports predict delivery bytes.

The route creates a single required review-date field on initial render, hidden
and disabled until step 2. It supplies a valid preset. Users can keep that date or
edit the eager native date input without opening the custom calendar. Visits can
end in step 1. The custom popup is genuinely optional; the date value is essential.
Likelihood is a workflow hypothesis, **not an observed real-user use rate**. No real
visits have been observed. Calendar and theme specimen routes intentionally
exercise calendars and are poorer adoption candidates; the 16-card showcase is a
performance fixture, not evidence of ordinary application likelihood.

The application is a light-DOM LitElement with existing global definitions and
build-time SSR. SSR renders the actual workflow; the client hydrates that same
initial template. Nodes and shadow roots keep their original document-global
ownership. No dormant host, registry rebinding, private per-field registry or
assumed global fallback inside a scope is introduced. Capable engines still run
this global route globally. Native-scoped route timings are not applicable and
must not be inferred from browser capability. Firefox global operation is reported
separately from Chromium/WebKit global operation; this route does not request an
automatic scoped-to-global fallback.

The form uses `novalidate`; the application validates active-step state and
intercepts submission, then simulates saving locally. FACE supplies `name="date"`
after upgrade; inactive fields are disabled and excluded from FormData. Native
editing updates the existing application transaction path. Before hydration, the
date field is disabled on step 1; it is not a no-JS editing/submission promise.
Even an enabled native input in an unupgraded shadow host would not submit to the
outer form. Workflow Reset resets directive state and its preset while retaining field identity
and any realized calendar; it is not the same operation as calling native `form.reset()` on property-initialized values.
No real service submission, autofill/history, BFCache or date-specific IME is
claimed by this follow-up.

## Opt-in, boundaries and rollback

Build the docs with `VITE_BRIEF_CALENDAR=deferred npm run build -w @en-reve/docs`.
Both Vite client and SSR use that explicit build-time setting in the selected
workflow definition. Only its `multiStepExample` receives the second policy
argument. Default builds, the reusable example elsewhere and all library defaults
remain eager. Configure before creating a field. There is no query-selected SSR
policy and no post-hydration change to `calendarLoading`.

Compare eager construction with deferred construction and **eager code** first.
The dialog, native editor, form owner, labels and validation remain eager; range
fields are untouched. Opened calendars retain their connected tree on close,
following the accepted library policy. No new storage policy is introduced.

Optional code loading/preparation is not selected: one calendar already has eager
code, essential editing must stay available, and a split adds a first-use request
and failure/retry surface without known real-user avoidance. The separate date
optimization task reports fixture-specific small marginal code savings; those
bytes are not subtracted from this route. This task does not modify shared date
runtime or central registry/public-consumer documentation. Coordination is recorded
in `artifacts/scoped-followup-consumer/coordination.md`.

Rollback: remove `VITE_BRIEF_CALENDAR` (or set `eager`), rebuild the client and SSR
as one output, then use a fresh navigation. Do not set the property on an existing
field or mix a deferred server document with an eager client. No definitions need
unregistering. Remove `calendar-metrics` from the URL to disable local diagnostics.

## Local opt-in instrumentation

Only `/workflows/multi-step.html?calendar-metrics` loads the diagnostic module.
`window.__briefCalendarMetrics.snapshot()` returns event counts and at most 256
relative timestamp entries. It records navigation-start visit, attached field,
preparation start/end/error, requested first/repeat usable focus, canceled pending
opens, opening errors, unavailable-state no-ops and unused fields at removal/exit.
Preparation calls count even if never followed by opening. Zero preparation
requests here means eager code, not free optional preparation in another policy.
The firstReady timestamp includes route delivery, hydration and scripted entry
through step 1. Gesture-to-ready is a separately labeled measurement; no preparation
lead is hidden or subtracted from the navigation measurement.

No date values, form contents, error messages, URLs or persistent identifiers are
collected. No storage, beacon, network export or external analytics is installed.
Counts cover successfully booted opted-in visits, not bootstrap failures. The local
cancel count concerns pending openings, not every dismissal after opening. Counts
live in the page only; pagehide/dispose closes observation. Bounded recent
timestamps and lifetime counts have different scopes. BFCache-resumed observation
is not implemented; these are diagnostic page segments, not unique users or
production conversion rates. Repeated visits would require explicit manual export
and analysis; no such real-user dataset is present.

## Evidence and decision rules

See `artifacts/scoped-followup-consumer/protocol.md` for the predeclared matrix,
unchanged applicable budgets, whole-route benefit threshold, timing boundaries and
separate retention design. Packed archives and complete emitted asset fingerprints
accompany the production route. Cold, warm-new-document and same-document repeat
remain distinct; no Phase 0–6 historical workload is used as a matched control.

The control is this exact current-main route with additive explicit eager policy
and identical timing instrumentation; the candidate differs only in construction
policy. The packed packages are common to both arms. Report raw/gzip assets
separately from completed response bodies and transfer bytes; include HTML,
preloads and unused traffic. Partial resource snapshots do not certify no in-flight
work. Recorded samples are scripted, local workstation lab data, not field INP.

Automated DOM/focus/axe/SSR checks are not actual screen-reader or physical-device
review. Existing Phase 6 accepted full weekday labels, browser-specific repeated
speech, Firefox native button and counted retry messages remain accepted and
unchanged. New route-specific assistive-technology/device coverage will be recorded
as unperformed unless actually reviewed; no old manual acceptance is reopened.


## Results and recommendation

The qualified live census failed the predeclared minimum benefit in all three
engines. The 40% whole-route node / 10% startup-JS alternative is preserved, not
replaced with the more favorable field-only percentage. Consequently the planned
480-sample promotion campaign was stopped before collecting promotion samples.
The final bounded cohort contains **48 successful diagnostic timings**: 3 per
arm/configuration across 8 configurations, plus **10 separate 100-cycle retention
runs** (5 per arm). There were zero failed attempts in this final cohort. The
16 timing / 2 retention harness qualification jobs and unsuccessful earlier harness
attempts remain separate. These are not 30-sample promotion results.

Selected matched results (Chromium; medians where timing is shown):

| Measure | Eager | Deferred | Change |
| --- | ---: | ---: | ---: |
| Initial route nodes | 2,268 | 1,517 | −751 (−33.1%) |
| Initial route elements | 623 | 485 | −138 |
| Initial date-owned nodes | 934 | 183 | −751 (−80.4%) |
| Initial JS encoded bodies, bytes | 360,524 | 360,527 | +3 |
| Compressed route HTML, bytes | 142,974 | 135,785 | −7,189 |
| Cold desktop first focus, ms | 8.2 | 12.3 | +4.1 |
| Cold constrained first focus, ms | 39.9 | 71.2 | +31.3 |
| Cold constrained repeat focus, ms | 21.5 | 21.2 | −0.3 |

Change is deferred minus eager: negative nodes/elements/bytes/latency is less cost;
positive is added cost. Timing n=3 is descriptive only. Full min/max, cache mode,
engine/version, scripted entry lead and route-entry-to-focus remain in the
sortable en-table comparison and raw records. No p75/p95, inferential interval,
field-INP claim or latency acceptance is derived from these small sets. Cold
constrained readiness was variable; it is not certified as within the latency
budget. The native input remains eager and the calendar is retained after use.
Deferred client construction and eager hydrated SSR leave different comment-node
counts after use; this is recorded rather than assumed to be identical DOM storage.

All five retention repetitions produced cycle-100 minus cycle-10 growth of
186,030 nodes / 31,500 listeners for eager and 96,930 nodes / 7,560 listeners for
deferred after settling and double GC. These fail the unchanged 20-node/10-listener
bounds in **both** arms. This lane remounts the whole workflow, including its other
controls; it is not the historical picker-only lifecycle fixture. No date-specific
leak or new regression is attributed from these counters. Further attribution is
a separate investigation, not a reason to change this task's library runtime.

Recommendation: **keep the existing eager route policy**. Keep the branch's
build-time opt-in as a reviewable experimental pilot only. Do not adopt code
splitting or speculative preparation; measured startup JS is already eager in
both arms. A future adoption needs an application-specific, pre-agreed benefit
criterion and actual use evidence, full ≥30-successful-sample comparisons for
every promoted configuration, separate retention qualification, and any new
interaction review. None of those future approvals is implied by this report.

## Verification and review boundaries

- Final packed functional qualification: eager/deferred × Chromium 153.0.8010.12,
  Firefox 155.0 and WebKit 26.6; all six passed, with zero axe violations in the
  tested form. Delayed hydration preserved date-input identity; its initial
  disabled state was checked, not misreported as pre-hydration editability.
- Native editing/FACE FormData, first/repeat focus, Escape return, veto and accepted
  selection, step persistence, keyboard Reset, fresh remount, readonly and pending
  cancellation passed. Eager preparation produced no optional request in either
  arm. Local instrumentation and synthetic count-only error checks passed.
- The initial eager Firefox **pointer Reset** attempt timed out; keyboard Reset
  passed. The unsuccessful pointer attempt remains in `functional-6.log`. No
  source change or newly introduced product regression is asserted from it.
- Focused existing Node checks: 3 calendar SSR checks, 5 date/range/deferred checks,
  plus the instrumentation test passed. Library runtime files did not change.
- All 30,634 frozen baseline files hash-match the exact base. Packed-resolution
  type-metadata path churn was retained as build evidence and restored, not committed
  as a library API change. All assets and measured application sources are hashed.
- Automated browser focus/DOM/axe checks are distinct from actual assistive
  technology. No new screen-reader, physical-device, real autofill/history/BFCache
  or date-IME coverage is claimed. Accepted Phase 0–6 manual dispositions remain
  unchanged and were not reopened.

Review the [sortable comparison](http://127.0.0.1:4270/comparison.html?progress-report)
and the existing [independent progress report](http://127.0.0.1:4177).
Preview commands and exact evidence are in
[`artifacts/scoped-followup-consumer/README.md`](../artifacts/scoped-followup-consumer/README.md).
Source pilot commit: `6f08c49d`. Evidence/recommendation is a separate focused commit.
