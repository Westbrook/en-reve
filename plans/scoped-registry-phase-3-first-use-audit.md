# Phase 3 first-use audit

Sortable report: http://127.0.0.1:4206/comparison-c168fd61184d.html?progress-report

## Findings

Yes: the loading-status update path deserves a bounded Phase 3 cleanup before the commit. Preserve loading, error, retry, Escape cancellation and focus protection while reducing unrelated renders. Keep the frozen production campaign as the reference.

Five diagnostic runs per condition: Phase 2 first use 63.4 ms; Phase 3 cold 282.8 ms; Phase 3 with definition modules imported beforehand 124.3 ms; Phase 3 registered and hydrated beforehand 63.8 ms. Imports alone do not eliminate first-use activation work. Prewarming shifts cost earlier; these are diagnostic interventions, not free performance gains or a validated scheduling policy.

Loading and clearing the status each rerender WorkflowsApp. Its updated() calls navigation.refresh(), scheduling a geometry read. The settings template recreates the commands array; the final update writes it into the now-open palette, whose setter schedules scrollCandidate() and another geometry read. One cold CPU profile attributed about 20.9 ms of native style/layout work to navigation measurement and 24.4 ms to palette candidate measurement. Initial work overlaps downloading: these costs cannot simply be subtracted from elapsed first use.

In a separate five-pair control, suppressing workflow rerenders changed median cold first use from 274.9 to 256.3 ms. This removes accessible loading feedback and is deliberately NOT a shippable solution. It supports isolating the status update and preserving command-array identity when command data has not changed. The 337.8 ms cold outlier is retained.

The cold diagnostic finished its two parallel requests at median 186.2 ms after the gesture. Registry.define() itself took median 1.5 ms, and the initial palette render in a representative run about 3.5 ms. There was one palette, and the SSR shadow root, native dialog and search input identities were preserved in all 30 non-profiled samples. No replacement-render or mass-upgrade explanation appeared in this page.

Native showModal() and focus/style work cost about 42 ms in Phase 2 and 43.6 ms in cold Phase 3. That common cost is not the new regression. The benchmark finishes later than input focus: cold Phase 3 focus median 238.4 ms versus readiness 282.8 ms, and Phase 2 focus 44.6 ms versus readiness 63.4 ms. Preserve the original metric and add focus-ready, loading-feedback and next-frame milestones; do not relabel readiness as INP.

Vite checks 45 preload dependencies, of which 43 are already in the startup graph. The observed new requests are only the two palette modules. In the profiled first-use windows, sampled self time in the preload helper was about 4–6 ms. Chunk-layout tuning is lower priority than the status/render path and scheduling; this is not an accidental full-catalog import.

Before sealing: isolate busy/status updates, avoid unchanged command rebinding, and verify keyboard/touch, first-use typing, focus movement, Escape, failure/retry, reset and disposal. Rerun a production comparison with 30 samples per affected configuration and repeated retention; keep the earlier freeze. Phase 4 should test load-only versus load-and-activate policies, including immediate activation before any prediction can run and larger same-tag populations. Registration in the global fallback can upgrade every connected matching host.

## Source paths

- `apps/docs/src/workflows/settings/index.ts:218`: full workflow update for loading; line 242 clears it.
- `apps/docs/src/workflows/settings/template.ts:146`: new command array on every workflow render.
- `apps/docs/src/workflows-app.ts:116`: navigation measurement on every update.
- `packages/elements/src/command-palette/element.ts:105`: command replacement schedules candidate scrolling while open; geometry read at line 166.
- `probes/production-registry/browser-probe.mjs:16`: whole-workflow readiness and two frames after observing open.

No production runtime fix or commit was made in this investigation. Keep original frozen campaigns unchanged. Diagnostic suppression is not a shipping policy.
