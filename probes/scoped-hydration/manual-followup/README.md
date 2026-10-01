# Phase 5 manual acceptance follow-up

The user reports successful loading, dialog interaction/dismissal, failure/retry
and native editing during loading in Chrome, Firefox and Safari, with one Safari
exception: DOM focus enters the palette, but the VoiceOver cursor does not. The
native draft restores after Back in Chrome/Safari but not Firefox. Reported setup:
macOS 26.6.1 (25G76), Safari 27.0 (21625.1.29.18.28), Arrow-key and Single-key Quick
Nav both off, Always allow typing in text fields on. Chrome/Firefox versions were
not supplied. No screen-reader settings were changed.

Run `node probes/scoped-hydration/manual-followup/server.mjs` from the repository.
The separate server at port4232 serves the exact existing Phase5 Vite assets without
modifying them, plus a small review-only module. After the user confirmed all three retests, port4231 adopted the corrected
`private, no-cache` header. Its original palette opening order remains unchanged. The timing campaign and archives are
not modified and do not measure these diagnostic variants.

## Focused retests

1. Firefox: open http://127.0.0.1:4232/?delay&progress-report, edit Draft, use
   **Leave this page to test Back restoration**, then browser Back. Confirm the draft
   returns and stays intact after opening/closing Search commands. The response uses
   `Cache-Control: private, no-cache`: storage is permitted, reuse requires validation.
   There is no localStorage/sessionStorage or scripted value restoration.
   `?cache=no-store&progress-report` reproduces the original header for comparison.
2. Safari/VoiceOver: open http://127.0.0.1:4232/native?progress-report. Activate
   **Open native dialog** and observe whether the VoiceOver cursor follows focus.
   This uses ordinary `<dialog>.showModal()` and an autofocus input, with the same
   1.5second wait, and no library, shadow root or hydration. DOM focus is checked
   automatically; VoiceOver cursor behavior requires the user.
3. Safari/VoiceOver: open
   http://127.0.0.1:4232/?delay&opening=settle&progress-report and activate
   **Search commands**. This variant waits two animation frames after hydration
   before the original opening call. It gives connected content a rendering
   opportunity, then uses the unchanged native autofocus/close behavior. It does
   not blur/refocus, announce a fake dialog, or change VoiceOver settings. This is
   an experimental timing comparison, not a proven repair. Add `&fail` to test retry.
   The baseline order is http://127.0.0.1:4232/?delay&progress-report.

Record whether the native control and the settle variant move the VoiceOver cursor,
not merely the input caret. Keep Escape and Close behavior in the check. If the
native control also fails, that supports a browser/AT issue independent of the
library. If only the settle variant succeeds, investigate the hydration-to-open
boundary before changing production timing. A successful timing change would
require library regression checks and separate performance qualification before
being promoted; none is included in the frozen measurements.

## Current evidence and external leads

The Firefox155 automated comparison reproduced lost native draft with `no-store`
and restored it with `private, no-cache` on history traversal. `pageshow.persisted`
was false in both cases, so this result is form-state restoration on a reconstructed
document, not evidence of a successful back-forward-cache restore. Both versions
preserved their returned draft through palette activation. Headless Playwright is
not proof of the retail browser's configured behavior; manual confirmation remains.

WebKit bug314893 describes VoiceOver failing to enter dialogs despite autofocus or
explicit focus; an upstream fix landed May18,2026. Duplicate311125 describes the
same DOM/VoiceOver mismatch with Quick Nav enabled. The user's Quick Nav is off,
and the Safari build's inclusion of the fix has not been established. Treat this
as a lead rather than confirmed diagnosis or a promise that updating will fix it:

- https://bugs.webkit.org/show_bug.cgi?id=314893
- https://bugs.webkit.org/show_bug.cgi?id=311125

The current palette already uses native modal focus and an autofocus input; no
extra scripted input focus is necessary in the reviewed default opening path.
See `packages/elements/src/dialog/dialog.ts` and
`packages/elements/src/command-palette/template.ts`.

`verify.mjs` checks history policies, baseline/settled opening, failure/retry,
draft preservation, Escape restoration, and native control in all three engines.
It never establishes VoiceOver speech/cursor behavior. Evidence lives at
`artifacts/scoped-registry-phase-5-manual-followup`. Real autofill, physical IME
and restored state inside a hydrated managed field remain unreported separately.

## User-confirmed retest outcome

The user confirmed that all three linked retests work: Firefox history restoration
with the corrected header, Safari native modal entry, and Safari settled palette
entry. This supports a hydration-to-modal-opening timing issue in this workload,
not a blanket conclusion that Safari cannot follow native modal focus. The original
manual server now uses `private, no-cache`. The narrow place for a production
settling policy is the application module's one-time `ready(root, signal)` callback,
which already gates initial activation. It should not add a delay to every dialog
opening or every library hydration. Integrating and measuring that policy remains
closeout work; frozen timing results do not include it.
