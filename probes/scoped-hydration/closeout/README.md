# Phase 5 closeout

The user confirmed the diagnostic two-frame-before-opening variant fixes Safari
27/VoiceOver cursor entry, while a plain native dialog already worked. They also
confirmed Firefox draft history restoration with `private, no-cache`. The final
application module places the rendering opportunity in its `ready(root, signal)`
callback: once per island, after the first palette update, before activation can
open the modal. Ordinary library hydration and dialogs do not acquire this policy.
Repeat activation returns immediately. Pending frames are canceled on disposal;
disconnection/adoption cannot complete readiness. The manual server uses the
corrected cache header without adding scripted form persistence.

The previous frozen Phase5 runtime packages remain byte-identical. `prepare.py`
extracts those packages, copies the original SSR HTML, rebuilds the prepared/cold
Vite applications with the new readiness module and preserves the exact Phase4
reference site. Outputs are separate from the earlier campaign. Its original
temporary rendering stage must exist to copy the HTML; if expired, reproduce the
HTML using the archived original harness and package archives before preparing.
No current workspace element/style changes enter this campaign.

```sh
python3 probes/scoped-hydration/closeout/prepare.py
node --test probes/scoped-hydration/closeout/readiness.test.mjs
node probes/scoped-hydration/closeout/verify-readiness.mjs
PHASE5_CAPTURE_ROOT=artifacts/scoped-registry-phase-5-closeout/production node probes/scoped-hydration/production/functional.mjs
PHASE5_CAPTURE_ROOT=artifacts/scoped-registry-phase-5-closeout/production node probes/scoped-hydration/production/campaign.mjs --qualify --run=qualification
PHASE5_CAPTURE_ROOT=artifacts/scoped-registry-phase-5-closeout/production node probes/scoped-hydration/production/campaign.mjs --run=campaign
node probes/scoped-hydration/closeout/verify-capture.mjs
node probes/scoped-hydration/closeout/analyze.mjs
```

Use new output directories for any new revision; never overwrite measured sites
or append to an existing run. Browser work uses the shared performance lock; do
not compile or run other campaigns during capture. Thirty successful samples per
configuration and five separate retention runs per policy follow the original
protocol. The old server timing cohort is explicitly retained as historical evidence. Server
rendering does not invoke the readiness callback, but its new helper import may
affect setup; that overhead has not been retimed. Previous Phase5 browser
samples are historical context, not a paired estimate of the settling cost.

After capture, `prepare-checkout.py` exports the sealed Phase4 parent plus exact
Phase5 library sources, builds required packages and runs the SSR tests without
using unrelated shared-worktree edits. `check-runtime.py` also verifies exact
runtime/test parity with the already qualified Phase5 source receipt and checks
workspace lockfile agreement. `report.mjs` adds final sortable tables to a new HTML
artifact; `verify-report.mjs` verifies all nine tables and narrow-screen layout.
`freeze.py` seals the final data, sources and receipts separately, and verifies
the older freezes unchanged. The commit boundary records the exact staged scope.

Browser tests verify DOM focus, never VoiceOver cursor. User acceptance applies to
the tested diagnostic behavior; the production integration of that same first-open
sequence has automated parity checks. Actual autofill, physical IME/device and
restored state inside hydrated managed fields remain unreported, not claimed pass.
The already documented real failed-import reload requirement in Chromium/WebKit
remains. Frames may pause in background tabs; abort/disposal stays immediate.
