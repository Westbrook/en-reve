# Phase 5 — scoped SSR and progressive hydration

Parent boundary: `5cab32d9311cb1a730fa9741e3334d03f7fc442a` (sealed Phase 4). Phase 4's accepted Chrome announcement limitation remains recorded; its historical timing freezes are unchanged. Future comparisons must rebuild this exact parent, including its dismissal-order patch.

## Implementation increments

1. Request-local server rendering: trusted, versioned module allowlist, structured-cloned snapshots, bounded concurrent rendering, cancellation/timeout/disposal. Installed Lit SSR 4.1 compiles registry constructors into shared template operations and reads global definitions again in renderer constructors. Use a fresh isolated Node worker for each request so neither registry nor template cache can leak between versions or requests. The calling realm's registry remains untouched. This opt-in correctness baseline adds worker startup cost; measure it before considering reuse/pooling. Do not present it as an SSR throughput optimization.
2. Browser bootstrap: import hydration support before application definition modules; match an explicit versioned loader allowlist; establish outer-template hydration before initializing null-associated roots and registering definitions. Reuse the existing scope/dependency APIs and preserve `deferHydration: false`. Diagnose pre-upgraded/foreign roots rather than silently rebinding globally parsed light DOM.
3. Delivery qualification: complete and incrementally delivered HTML, useful native no-JS content, deferred/failed modules, independent same-tag versions, global fallback and inert-template recipe, stable native inputs/selection/composition/form semantics, styles and disposal. Application manifests own island IDs and policy; no document-wide scanner or arbitrary import URLs.
4. Performance and acceptance: production packed builds compared to the sealed Phase 4 commit, >=30 successful timing samples per configuration and separate retention repetitions; server-worker cost reported separately. Manual assistive-technology and physical-device checks remain separate from browser assertions.

Phase 5 is in progress. Completion requires the delivery matrix and performance/acceptance evidence, not just an exported API.

## Initial implementation evidence

The server renderer, manifest/DSD helper and explicit client bootstrap are implemented. 70 server tests and 17 browser checks pass, with one expected Firefox skip for native version isolation. Global fallback cases pass in Firefox. A real `en-button` retains its native shadow button across hydration; native form drafts, selection, focus and reset survive the delayed bootstrap. The evidence and remaining exit-gate work are recorded in `artifacts/scoped-registry-phase-5/verification.json`. No Phase 5 timing campaign or full acceptance is claimed.

## Completed implementation and final comparison

The ordered client bootstrap now supports load-only preparation and inert-template
materialization in ordinary element scopes, shadow roots and document-global
fallback. Activation releases the consumed source template. Pending work rejects
on disposal, disconnection or cross-document adoption. The delivery suite has 44
passes and one expected Firefox native-version-isolation skip. It covers real
managed fields, native defaults/reset/validation, editing/focus/selection, static
stylesheet sharing, complete and incremental delivery, and actual failed chunks.
All 70 server tests pass; nine additional production failure/delay/no-JS checks pass.

The final `campaign-v2` uses the exact sealed Phase 4 parent and extracted npm
packages in Vite production builds. The elements, primitives, styles and tokens
package archives are identical in both arms; only SSR changes. It contains 540
successful timings (30 for each of 18 configurations), 15 separate 100-cycle
retention runs (five per policy), and 60 serial server render timings. Nine supplementary settling runs (three per policy) returned to their initial DOM
counts after one second and remained there at five seconds. Immediate retention
counter variability is preserved in the main results.
The earlier 187-sample exploratory capture is excluded after template cleanup;
no samples are pooled across source revisions or removed as outliers.

- Throttled keyboard first focus: Phase 4 eager 544.70 ms; Phase 5 prepared
  545.15 ms; Phase 5 cold 615.50 ms. The prepared/eager difference has an exploratory
  95% interval of −2.90 to +4.55 ms. Emulated touch: 505.20 / 504.85 / 612.65 ms.
- Settled unused live DOM: 1,184 / 26 / 26 nodes. Deferred policies retain 1,516
  inert nodes. This is connected-work reduction, not a total-memory saving.
- Settled unused gzip JS: 48,411 / 49,765 / 5,907 bytes. Preparation preserves
  low first-use delay but adds 1,354 bytes in this new SSR bootstrap.
- Serial server median: 0.39 ms warm global versus 127.07 ms fresh request worker.
  Use this optional isolation boundary deliberately; it adds about 126.68 ms here.

These SSR fixtures start with native controls and load the Lit/widget stack on
demand. The older settings application had already loaded shared dependencies;
its roughly 74 ms route-prepared command result is a separate workload and timing
boundary. The new report preserves historical Phase 0–4 rows without inventing
cross-campaign deltas.

## Initial acceptance checkpoint (before final closeout)

Implementation and automated performance work are complete; manual acceptance
remains open. Review the production fixture at
`http://127.0.0.1:4231/?delay&progress-report` and
`http://127.0.0.1:4231/?delay&fail&progress-report`. Confirm screen-reader speech,
Escape/Close focus restoration and physical input methods; actual autofill/history
restoration and physical-device behavior are not established by synthetic checks.
Production module retry recovers in Firefox in this fixture; Chromium and WebKit
need reload after a real failed import. Native fallback remains usable.

Phase 5 remains uncommitted pending its acceptance/commit boundary. Phase 6 can
use the explicit APIs to defer optional date-picker and other heavy internals;
this work does not silently migrate all library consumers or claim a server
throughput improvement. Earlier phase freezes and unrelated workspace edits remain
intact. Evidence: `artifacts/scoped-registry-phase-5/verification.json` and the
`showcases/performance/baselines/scoped-registry-phase-5-v1` archive.

## Server-cost investigation follow-up

The user confirmed that optional request-time isolated SSR latency is not a Phase 5
blocker; client performance remains primary. Build-time SSR and compatible warm
`renderToString()` are valid alternatives. A separate 120-sample diagnostic
reproduced the isolated API at 128.91 ms and attributed most of the cost to worker
and module setup. Actual first rendering took about 7.43 ms in an instrumented
fresh realm. A single-use prewarmed prototype measured 8.64 ms after submission,
excluding 123.24 ms of preparation; total creation through result remained
132.77 ms. No production pooling or client changes were introduced.

Ten request-isolation checks pass and all measured HTML matches the frozen output.
The original 98-file Phase 5 freeze and its client comparisons remain intact.
See `probes/scoped-hydration/ssr-profile/README.md` and
`artifacts/scoped-registry-phase-5-ssr-investigation/comparison.json` for stage
attribution, reproduction and limits. Production pool capacity/memory/overload work
is deferred until there is a concrete request-time isolated SSR need; this is not
an added phase acceptance requirement. Manual acceptance remains open separately.

## Final closeout and commit scope

The user completed the principal manual workflows in Chrome, Firefox and Safari,
and confirmed all three focused retests: Firefox Back restoration with corrected
cache headers, Safari native dialog entry and Safari settled palette entry. Their
reported setup was macOS26.6.1 (25G76), Safari27.0 (21625.1.29.18.28), both Quick
Nav modes off and typing in text fields allowed. The native control succeeded,
so this result does not justify attributing the symptom solely to a general
VoiceOver defect.

The final command module places two animation frames after its first component
update in the application-owned `ready(root, signal)` callback. It runs once per
hydration island; subsequent activation resolves without waiting. The scheduled
frames cancel on disposal and cannot complete across disconnection/adoption.
Generic hydration and ordinary dialogs keep their existing behavior. The main
manual server now serves the final cold fixture with `private, no-cache`; no
script-based draft restoration was introduced.

The closeout campaign is separate from both earlier freezes. It uses the exact
frozen Phase4 eager site and Phase5 library packages, replacing only the Phase5
application readiness policy. The final freeze records 30 successful samples per
configuration and separate repeated retention. Its browser metrics include the
first-hydration settling cost; earlier Phase5 values do not. Historical server
measurements remain labeled historical: the renderer is unchanged, but the new
application helper import has not been separately retimed on the server.

Final receipts and the commit scope are in
`artifacts/scoped-registry-phase-5-closeout/commit-boundary.json`. The commit includes
Phase5 public SSR/client APIs, tests, application/diagnostic harnesses, both prior
freezes, final closeout evidence and the reports. Unrelated shared-worktree edits
and transient exploratory outputs are excluded.

Manual acceptance is recorded for the user-tested workflows and diagnostics.
Actual browser autofill, physical IME/device behavior and history restoration
inside a hydrated managed field remain unreported. These are explicit follow-up
coverage limits, not passing results. The existing Chromium/WebKit failed-import
reload requirement remains documented. Phase6 has not begun.

Final closeout results (30 timing samples per configuration): throttled keyboard
first focus was 546.00 / 548.20 / 613.45 ms for eager / prepared / cold. The
prepared-minus-eager interval was −3.00 to +4.50 ms; navigation-to-focus medians
were 1008.60 / 1009.00 / 1069.00 ms. Second focus was 5.30 / 5.10 / 5.00 ms.
Desktop first focus was Chromium3.05 / 22.70 / 42.75 ms, Firefox3 / 13 / 32 ms,
and WebKit6 / 102.5 / 106 ms. The WebKit first-open cost is substantial and is
explicitly retained alongside the user-confirmed VoiceOver benefit; it is not
hidden behind the near-neutral throttled result. WebKit second focus was3 /2 /2ms.
Unused connected nodes remain1184 /26 /26, with1516 inert nodes in deferred arms;
settled unused gzipJS was48411 /49961 /5906bytes. Across five separate retention
runs per policy, prepared/cold median10–100-cycle DOM/listener growth was zero;
heap growth was about133KB. These counts do not prove absence of all leaks.
