# Phase 3 first-use cleanup

Implement the pre-commit audit finding without changing when optional code loads.

- Update the existing native status node and trigger busy attribute locally. They have no competing dynamic Lit binding. Preserve error/retry announcements, Escape cancellation, reset/disposal handling and focus protection. No workflow render is requested merely because command loading starts or finishes.
- Guard the palette command-property binding using the save-failed, save-pending and incoming-change capability inputs. Unrelated workflow renders preserve command identity and typed queries; capability changes still replace the catalog.
- Keep the existing production readiness metric. Add external observations for input focus, a following frame opportunity, nonempty busy feedback, a frame with feedback still busy, and definition readiness. Disconnect measurement observers before retention cycling. Do not call frame callbacks confirmed paint or INP.
- Verify docs typechecking, workflow core tests, packed scoped/global CSR/SSR interactions in three browsers, and the actual production page's SSR identity, first-use typing/focus and mobile touch.
- Rebuild from the archived Phase 3 production source and exact compiled library outputs, overlaying only the two workflow files. Run a paired randomized production comparison: 30 samples for control and candidate in Chromium, Firefox, WebKit and throttled Chromium; separately run five retention repetitions per arm. Freeze all evidence under a new name and preserve earlier campaigns.

The library registration APIs, optional-load boundary, and Phase 4 scheduling policies are unchanged. This cleanup does not itself create a Phase 3 commit. Final results and evidence: `artifacts/scoped-registry-phase-3-cleanup/verification.json` after capture completes.

## Verified outcome

Throttled first-command readiness improves from 279.60 to 260.85 ms: −18.75 ms (−6.71%), with an exploratory paired 95% interval of −25.20 to −16.00 ms. These are the new campaign’s paired control and cleanup medians; the earlier frozen 279.95 ms is a separate run.

Input focus remains essentially unchanged: 237.80 → 238.85 ms (Δ +1.05 ms, interval −1.35 to +2.80). The next frame opportunity after focus moves from 268.05 to 247.75 ms. Observed loading feedback moves from 7.60 to 1.50 ms, and its frame opportunity from 27.25 to 9.65 ms. These callback observations do not prove paint, assistive-technology announcement timing, or INP.

Production checks confirm zero parent-workflow rerenders on first use, with existing SSR dialog/input nodes retained. Loading status, busy state, error/retry, cancellation, focus restoration and typed queries remain supported. Command catalog bindings remain stable until command capabilities change.

Desktop first-use medians are Chromium 61.25 → 60.00 ms, Firefox 43.00 → 42.00 ms, and WebKit 45.00 → 50.50 ms. WebKit’s +5.50 ms interval is 0 to +8.00 ms: a possible regression to watch, not a universal speedup. Its focus timing is 18.00 → 17.50 ms. The other first-use and all startup-readiness intervals include zero; that does not establish equivalence.

The cleanup adds 327 gzip JavaScript bytes (+0.089% in Chromium) and 21 gzip HTML bytes. JavaScript request counts remain 180 at startup and 182 after first use. Definition readiness remains about 191 ms under throttling, so this cleanup does not remove the cold network delay. Earlier loading or activation policy remains Phase 4 work.

Ten separate retention runs show zero node, listener or document growth from cycles 10 to 100 in either arm. Median heap growth is 732,748 → 732,640 bytes; retained heap at cycle 100 differs by +1,036 bytes. The candidate has two fewer DOM nodes; listener and document counts match. Five repetitions per arm cannot prove absence of leaks.

All 240 timing samples and ten retention runs passed. A preliminary incomplete capture was excluded and preserved because its new measurement observer could retain initial workflow nodes; the corrected observer disconnects before cycling, passed requalification, and was used for every final sample. This was a shared-workstation run. Missing optional observations remain missing; WebKit feedback-frame deltas are withheld because only four complete pairs were available.

Evidence is frozen separately as `scoped-registry-phase-3-cleanup-v1`. The sortable report links back to the unchanged Phase 0–3 production comparison.
