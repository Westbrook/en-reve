# Physical iPhone findings — September 25, 2026

The bounded iPhone session is complete. The full cross-device, delivery and
interaction matrix remains open. This records user-observed results, not blanket
manual acceptance or automated proof of physical behavior.

## Evidence identity and environment

- [Raw observations and corrections](manual-session-2026-09-25.json) contain the
  literal user responses, requested actions, case findings and navigation evidence.
- Reviewed build: `6c36d9cabd4e2680301f8241eeca9ecc5b43cf8b32f074c715f632e3af604df9`.
  Runtime base: `66386af7daac295cb2e178236d45289a9ebced4f`; original fixture delivery:
  `299153860f59f386ad76ba8b42232194394532f3`. The separate consolidation build
  `a64692cc…` was **not** physically reviewed in this session.
- Device: physical iPhone 12 Pro from the prior user inventory. User reports
  **iOS 27.0**, Safari, regular non-private browsing. OS build was not displayed
  when requested; exact Safari version remains **unreported**.
- VoiceOver was explicitly confirmed off for the initial touch-only segment.
  A separate segment used the iPhone's bundled VoiceOver with touch activation.
  Exact voice/language, verbosity, rotor/typing settings, external keyboard use,
  language/region, text size/zoom and reduced-motion settings remain unreported.
  Do not fill these from defaults or historical macOS settings.
- Safari **Use Contact Info** AutoFill: enabled, user-confirmed. Availability of a
  test birthday contact/profile is unreported. No personal contact values were
  requested or accepted into the fixture.
- Transport: local HTTP at `http://192.168.1.163:4517`, with original assets from
  `/private/tmp/en-date-input-coverage`. HTTP and profile configuration bound the
  autofill observations; this is not an HTTPS result.
- On hydrated `/deferred/shadow`, the user transcribed `mode: "scoped"` and
  `registryCapabilities: {native: true, importMode: "options", dormant: false}`.
  These observations use actual native scoped delivery, not global fallback.
  Physical fallback coverage is unreported.
- Route attribution follows the explicit iPhone walkthrough. The ambient Codex
  desktop tab often remained at `/eager/global`; it is not evidence of the phone's
  route. No phone screenshots or remote inspector trace were collected.

## Observed touch interactions

| Case / delivery | User-observed result | Boundary |
| --- | --- | --- |
| M01 native/global | Field activation opens OS calendar; tapping away, scrolling and blue check mark dismiss it. Explicit selection displays September 20. | No physical text IME or AT inference. |
| M02–M03 eager/global, deferred/global, deferred/shadow | September 20 entered before hydration remains displayed after explicit hydration. Scoped mode subsequently confirmed for shadow request. | Hydration button activation changes focus; uninterrupted focus/caret retention was not checked. Pre-upgrade input is not an outer-form successful control. |
| M08 deferred/global | Choose date opens library calendar, distinct from OS picker. Selecting September 22 closes it and updates field; explicit Close without another selection preserves September 22. | Other cancellation mechanisms and touch-only focus restoration unreported. |
| M09–M10 deferred/global | Local receipt matches September 22. Form Reset restores September 15; subsequent receipt is `2026-09-15`. | Initial report of September 25 was corrected by user; not a reset defect. |
| M05 deferred/global, 5-second delay | Native editing works during requested loading sequence; no unsolicited library-calendar opening. Explicit reopen selects September 20. | Human action timing was not instrumented. This is not physical DOM-focus or speech evidence. |
| M07 deferred/global, fresh 5-second delay | Reset during loading displays September 15; no unsolicited opening. Explicit reopen selects September 15. | Distinct from escape/cancel during loading, which remains unreported. |
| M11 deferred/global, fail once | Visible error offers retry/reload/direct editing. Native edit to September 20 and matching local receipt work. Same-document retry fails; fresh normal document opens calendar. | Retry limitation is observed, not a claim about browser cache internals. Reload recovery was not tested. |
| M08–M10 deferred/shadow | Custom selection closes calendar, displays September 22 and produces matching local receipt. Native OS picker accepts December 31, 2025; field retains it with red border. | Actual native scoped delivery; not pooled with global. |
| M09 deferred/shadow validation | Check validity shows `Value must be greater than or equal to 2026-01-01` in an OS popup and red inline text above Reset date. Invalid Submit repeats validation and produces no new receipt. | OS calendar also opened on one attempt; user qualified this as apparently one-time. No reproducible focus defect inferred. |
| M10 deferred/shadow recovery | Form Reset restores September 15, clears red validation message and allows a matching local receipt. | Separate from OS picker Reset. |
| Native picker controls on deferred/shadow | OS picker has Reset; using it displayed September 15 rather than an empty field. User reports no keyboard button or way to type day/month/year. | Text IME composition is not offered through this observed surface. Empty-required validation remains unreported. |

All submission receipts were local page behavior. No fixture value storage,
transmission or synthetic property assignment was introduced. Selecting a date in
the OS picker is actual manual input, not browser autofill.

## Physical Safari history evidence

| Experiment | Before | Return / reload | Displayed result |
| --- | --- | --- | --- |
| M15 hydrated scoped Back | Document `1790371223314-0.924820749829057`; time origin `1790371223285`; `navigate`; initial pageshow false at 51 | Same document/time origin; added pageshow **true** at 1275516; navigation type remains `navigate` | September 20 retained: **BFCache resume**. |
| M16 reload of that page | Same hydrated document, September 20 | New document `1790372602243-0.9182928594743996`; time origin `1790372602192`; **reload**; pageshow false at 66 | September 15 both before and after hydration. Prior September 20 not restored in this sequence. |
| M14 edited before hydration, Back | Document `1790372760784-0.8000691548605575`; time origin `1790372760695`; `navigate`; initial pageshow false at 113 | Same document/time origin; added pageshow **true** at 79846 | September 20 before and after post-return hydration: **BFCache resume**. |

The two Back results establish BFCache, not new-document Back. The reload result
does not invalidate the Back result or imply identical behavior in other browsers.
No cache disabling, manual restoration or generic persistence was added. Physical
Safari's reload result is kept separate from the archived automated engine results.

## Actual VoiceOver observations — deferred/shadow

These are user-transcribed spoken outputs and physical AT cursor observations.
They are separate from automated accessible-name and DOM-focus checks.

- Trigger speech: “Choose Date September 15, 2026. Pop-up button. Dialog pop-up.
  Double tap to activate the picker.”
- Calendar entry announces the September 15 day button with “Description,
  September 2026, row 4, column 3, button.”
- On selecting September 22, user reported day-button speech with a repeated
  “Tuesday.” The exact timing relative to closure is unestablished. User explicitly
  confirmed the calendar closed and VoiceOver focus returned to Choose date.
- Explicit Close calendar also returns VoiceOver focus to Choose date. The initial
  date transcription of September 15 was corrected by the user to September 22;
  the visible field was also confirmed as September 22. No mismatch established.
- On deliberate load failure, VoiceOver announces “Loading calendar....” then
  “Calendar could not load. Try again, reload the page, or enter a date directly.”
  Focus stays on Choose date.
- Native editing still displays September 20 with VoiceOver enabled after failure.
  Local submission is announced as “Local receipt: eventDate = September 20, 2026.
  Not send or saved.” This preserves the user's transcription without treating it
  as the literal DOM receipt text.
- Same-document retry announces “Calendar loading...” then “Calendar failed.
  Reload the page or enter a date directly.” Fresh normal document recovery opens
  the calendar and announces the September 15 day button/grid context.
- For validation, the user actually entered **August 15, 2025**, rather than the
  requested December 31. Both are below the authored minimum. VoiceOver announces:
  “Test birthday. Description: Use a test date. Values stay in this page. Values
  must be greater or equal to January 1, 2026. August 15, 2025. Required.” The user
  confirmed the visible date matches. Submit repeats this validation and produces
  **no new local receipt**, explicitly confirmed.

## Autofill and unperformed coverage

No actual Safari AutoFill suggestion was offered on native/global or on
deferred/shadow before or after hydration, with Use Contact Info enabled. Classify
these as **not offered in the observed configuration**. Actual autofill acceptance,
hydration retention of autofill and autofilled receipt parity remain **unreported**.
Do not classify absence of an offer as a library failure.

Every unlisted device/arm/delivery/interaction combination remains unreported.
In particular: native/shadow and eager/shadow comparisons; broader eager/global
interactions; global physical VoiceOver coverage; scoped slow-load edit/reset and
touch-only failed-load comparisons; cancellation during loading through a supported
device dismissal mechanism; empty-required validation; focused hydration/caret
continuity; new-document Back restoration; history focus/AT restoration; physical
fallback-registry behavior; additional keyboard/IME configurations; Android/TalkBack.
The full M01–M17 matrix has not been closed or silently reduced.
The [remaining-review handoff](remaining-manual-handoff.md) prioritizes missing
capabilities without replaying this session; the [current matrix](../manual-matrix.md)
contains the per-case reconciliation.

## Bounded recommendation and ownership

Keep the runtime unchanged on this evidence. No library-specific defect requiring
a promoted fix was established. Retain native editing, local form validation and
the documented pre-upgrade form boundary. Document the observed same-document retry
limitation alongside direct editing and fresh normal recovery; do not promise retry
success. Document BFCache and reload outcomes separately. Do not add generic
persistence or hide native controls.

Any reproducible runtime mismatch goes to the date optimization owner; consumer
route changes stay with the consumer task. A future runtime fix still requires
matched exact-base/candidate qualification, at least 30 successful timing samples
per affected configuration, separate repeated retention, unchanged budgets and raw
evidence. This session makes no current-main performance or cross-build acceptance
claim. Accepted Phase 0–6 desktop evidence remains frozen and closed.

**Ownership supersession:** root task **Plan scoped registry adoption**
(`01a0c0eb-0cb4-7e50-ab1f-acbe5383770e`) accepted the bounded deliverable and now
owns future scheduling of broader manual coverage and any optional retry investigation.
Unperformed cases and configuration gaps remain unreported; transfer is not acceptance.
This task has no remaining implementation, execution or user-review coordination.
No immediate user response is needed. See [the ownership record](ownership-transfer.json).
No merge, publishing or deployment is authorized by these findings.

## Availability and historical operational follow-up

Original localhost fixture: `http://localhost:4516/native/global`.
Private Wi-Fi fixture: `http://192.168.1.163:4517/native/global`.
Both were verified serving the original build during this session. Check current
listeners/IP before another session; availability is not permanent.

The original Node executable's firewall rule was **Block incoming connections**:
`/Users/westbrook/Library/Application Support/revedev-52ae4245/bin/node`.
The user authorized a temporary exception and changed it through System Settings.
The managed Mac prohibits CLI changes. At cleanup, the computer-use tool rejected
System Settings access (“not approved to use System Settings”); no bypass was tried.

**Superseding user direction:** “Don't worry about the firewall exception. It's no
longer a to do.” The restoration follow-up is removed at the user's request, not
closed as independently verified restoration. No system or process action was taken,
and no further firewall prompt is owed. The raw session record and its original
verification preserve the earlier pending state as history; this note and
[follow-up disposition](firewall-followup-disposition.json) supersede that action.
VoiceOver's final setting remains unreported.
