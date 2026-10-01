# Date input follow-up coverage

## Current manual checkpoint — September 25

The bounded physical iPhone session is complete on original build `6c36d9cabd4e2680`.
Read the [manual summary](../artifacts/scoped-followup-date-input-coverage/consolidation/manual-summary-2026-09-25.md)
and [raw observations](../artifacts/scoped-followup-date-input-coverage/consolidation/manual-session-2026-09-25.json)
and [remaining-review handoff](../artifacts/scoped-followup-date-input-coverage/consolidation/remaining-manual-handoff.md).
Earlier pending statements below are historical
checkpoints, not the current manual status. Original fixture evidence stays intact.

User reports iPhone 12 Pro, iOS 27.0, regular Safari, contact AutoFill enabled, and
separate VoiceOver-off/on segments. Native scoped mode is physically confirmed by
the fixture probe. Exact OS build, Safari version and additional device/AT settings
remain unreported. The report locator and accepted Phase 0–6 evidence are unchanged.

Observed: native editing before hydration and during optional loading; eager/global
and deferred/global/scoped value survival on hydration; selection, explicit close,
local receipts, reset and out-of-range validation; native fallback after load error;
actual VoiceOver calendar entry/return, failure announcements, receipt speech and
validation. Same-document retry fails; fresh normal document recovery works. Scoped
Back uses BFCache and retains September 20; separately classified reload displays
default September 15 before and after hydration. No autofill offer was observed.

No runtime remediation is promoted. Retain native editing, documented form limits
and separate navigation/cache regimes. Broader unperformed matrix cells remain
open, including actual autofill acceptance, new-document Back, empty validation,
loading cancellation, additional delivery comparisons and other devices. No full
performance campaign or requalification of a changed runtime is implied.

**Bounded task complete; remaining coordination transferred.** Root task
**Plan scoped registry adoption** (`01a0c0eb-0cb4-7e50-ab1f-acbe5383770e`) accepted
`3a6a4d8649fbc4406e2cbfff859f69ecd411f409` and now owns future scheduling of the
unreported manual breadth and optional retry investigation. This supersedes earlier
instructions to keep this task open. No unfinished implementation, execution or
user-review coordination remains owned here. Transfer does not complete or accept
unperformed cases. No immediate user response or new test action is requested.
See the [ownership record](../artifacts/scoped-followup-date-input-coverage/consolidation/ownership-transfer.json).

**Superseding user direction:** “Don't worry about the firewall exception. It's no
longer a to do.” The firewall-restoration follow-up is removed at the user's request.
This does not establish that the setting was restored. Historical observations stay
intact; no system or process changes accompany this documentation update.

## Original fixture delivery and historical checkpoints

Base: `66386af7daac295cb2e178236d45289a9ebced4f` (latest local main at checkout).
Phase 6 seal `220d2dd3e4f55c6f2557d7e7fc593d5d16099bba` is an ancestor.
Branch: `codex/date-input-coverage`; workspace: `/private/tmp/en-date-input-coverage`.

Scope: fixtures, focused automated support, date-specific manual matrix, findings
and a bounded remediation recommendation. Own only this plan and
`artifacts/scoped-followup-date-input-coverage/`. No runtime or consumer-route edits.
No merge, publishing or deployment. Existing dirty checkout and Phase 0–6 evidence
remain untouched. Dependencies are copied locally; packages build from this worktree.

The canonical independent report is reused at http://127.0.0.1:4177.
Its `handoff.dateInputCoverage` and own iteration are updated under the existing
`data/.project.lock`, rereading current state before atomic replacement. Other
workstreams, feedback, checkpoints and active task selection are preserved.

## Contracts and acceptance boundary

Read Phase 6 plan/results, original manual-review record, canonical Phase 6
handoff/closeout, date-picker README, native form adapters and SSR contracts.
The original manual JSON is ignored/untracked and read from the original checkout;
the canonical closeout and tracked Phase 6 results resolve its chronological pending
notes. Desktop acceptance stays closed: macOS 26.6.1 (25G76), Chrome 153.0.8010.52,
Firefox 156.0.1, Safari 27.0 (21625.1.29.18.28), VoiceOver arrow/single-key Quick Nav
off and always-allow-typing on. This is historical evidence, not today's device inventory.

Pre-upgrade shadow native input is editable but is not an outer-form successful
control. No no-JS library submission support is claimed. Attribute defaults and
matching SSR snapshots must preserve native node/value at upgrade; public property
writes remain authoritative. Eager remains default, range stays eager, deferred
single-date shell uses the same constructor. Focus departure, Escape and reset
cancel pending opening. Retain native editing controls and original date labels.

## Work and review checkpoints

1. Verify ancestor, contracts, canonical handoff and unresolved feedback (weight 1).
2. Build separate production native/eager/deferred fixtures, global/scoped delivery,
   stable URLs, build identity and navigation diagnostics; focused checks (weight 3).
3. Bounded original-build iPhone session complete (weight 1); remaining manual
   breadth open (weight 1), with no immediate user prompt. Unperformed cases remain
   **unreported**, never inferred from Playwright.
4. Review findings, bounded owner handoff and commits (weight 1).

No full performance campaign for fixtures/docs. A promoted runtime fix must be
coordinated with the date optimization owner, and any route change with the consumer
task. Require matched current-base/candidate qualification, ≥30 successful timing
samples per affected configuration plus separate repeated retention, unchanged
applicable budgets and preserved raw/source evidence. Keep native/fallback, cold/warm
cache and historical Phase 0–6 workloads separate. No generic persistence or hidden
native control workaround.

## Prepared deliverables

- [Fixture index](http://127.0.0.1:4516/?progress-report): native, eager and deferred,
  global and scoped request, slow optional load and actual HTTP failure.
- [Manual matrix](../artifacts/scoped-followup-date-input-coverage/manual-matrix.md):
  M01–M17, exact environment fields, one-action-at-a-time guidance and outcome rules.
- [Current findings](../artifacts/scoped-followup-date-input-coverage/findings.md),
  [manual summary](../artifacts/scoped-followup-date-input-coverage/consolidation/manual-summary-2026-09-25.md)
  and [raw session](../artifacts/scoped-followup-date-input-coverage/consolidation/manual-session-2026-09-25.json).
  The original manual-findings.json remains the pre-session snapshot.
- [Reproduction](../artifacts/scoped-followup-date-input-coverage/README.md),
  [base receipt](../artifacts/scoped-followup-date-input-coverage/base.json), and
  [build receipt](../artifacts/scoped-followup-date-input-coverage/build-receipt.json).

No runtime issue is promoted. The ready-to-use remaining-review handoff is conditional
on an agreed future session and a capability not already exhausted. Do not repeat
completed iPhone or accepted desktop cases. No fixture resource allocation is needed
for this documentation update. No manual gap blocks merging these documentation
changes; an eventual runtime change still needs its own affected-behavior qualification.

## Original automated checkpoint — before September 25 physical session

Build `6c36d9cabd4e2680301f8241eeca9ecc5b43cf8b32f074c715f632e3af604df9`:
39 interaction/navigation checks and 21 no-JS/form-boundary/report-link/narrow-layout
checks pass across the three installed engines. Chromium/WebKit use native scoped
registries when requested; Firefox falls back globally. Automated global Back
journeys used Chromium BFCache versus Firefox/WebKit new documents; the latter
restored the library date after essential hydration, not before it. This is not
physical device, real autofill, date-specific IME or spoken-output acceptance.

Recommendation: keep current runtime. Hydrate the essential field promptly and
retain documented pre-upgrade form limits. Escalate only a reproducible
library-specific mismatch to the date optimization owner, with the exact input
source/registry/navigation path. Consumer-route changes remain with its owner.
No runtime remediation is proposed or promoted; no performance campaign run.

At that original pre-session checkpoint, manual effort was 2 of 7 relative units
outstanding and all manual cells were unreported. That status is historical. The
current report includes consolidation: 8 of 9 units verified, with the remaining
manual breadth transferred to root coordination, not counted as complete. Accepted Phase 6 desktop review stays unchanged.

## Consolidation continuation — September 24

Retain original commit/build above. New isolated branch `codex/date-input-consolidation`
starts from `37a4dbac332b5324afe07c61b1e701ced07bfe57`; cherry-pick of the delivery is
`73141fde5ff8d082cff4ec699608cbdb1b3922c6`. Caller-owned fresh build/results routing and
serialized execution are documented in
[the integration handoff](../artifacts/scoped-followup-date-input-coverage/consolidation/README.md).
New qualification must not overwrite or be pooled with the original 60 checks.

At this September 24 pre-session checkpoint, device inventory was partial and human
outcomes were unreported; reachability then M01 were the proposed next actions.
Those actions were subsequently completed and superseded by the September 25
manual summary. The later firewall follow-up was removed at the user's request.
These historical notes are not current instructions or current availability claims.

Separately qualified source `97b067583e000fc662f6369a955f50edb783d7d4` passes five package
builds and the separate 39+21 focused checks, build
`a64692ccdeb0aede80447ba3a8c80d9e8fbe24451f10175bfb1645f390abdb34`. Evidence is archived
under `consolidation/qualification-97b06758/`; shared locks released normally.
Five receipt-integrity checks cover the final aggregation-only addition. The
combined integration owner still must qualify its final exact commit; neither
historical campaign nor this fixture run certifies a later runtime change.
