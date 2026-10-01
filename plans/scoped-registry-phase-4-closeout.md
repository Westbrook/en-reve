# Phase 4 closeout and Phase 5 boundary

The user selected route-entry load-only preparation for settings. The integrated entry is byte-identical to the route candidate in `scoped-registry-phase-4-followup-v1`. It starts fetching/evaluating the command family without awaiting it; explicit opening remains responsible for registration, upgrading, focus and error feedback. The default for other library consumers is unchanged.

## Commit scope

Include the Phase 4 activation controller and declaration/public API metadata, settings intent and route adoption, the native/fallback activation probes, production measurement harnesses, source/build archives, frozen campaigns and sortable comparison pages. Include the one-line docs-generator entry for `composable-chat` that is already in the measured archive and is necessary for an existing static import to resolve in a fresh checkout. Exclude the concurrent theme, Web Awesome, validation-summary and other docs changes.

## Verification

The isolated clean source tree builds tokens, styles, primitives, elements, metadata, SSR and the full Vite docs site. Docs typing, metadata freshness, packed declaration consumption and importing the activation module without browser globals are checked. Fourteen loader and workflow-core tests pass.

The settings module graph, including static and dynamic imports, is compared byte-for-byte with the frozen route candidate. Server HTML comparison permits only the whole-site review fingerprint and randomized Lit marker nonce. The newly exported activation module was absent from the settings measurement archive; it is separately built from the exact Phase 4 source already covered by 48 activation and nine real-library browser checks.

Additional production integration checks hold or fail the optional module request to exercise overlapping activation, cancellation, focus moving away, disconnection, navigation, real import failure and mobile touch. These are correctness checks, not timing samples. Real failed module requests also qualify the browser-cache boundary: the loader can reattempt its allowlisted factory, but cannot force a browser to refetch an already failed module URL. Cached failures must remain a usable error state; ordinary reload and a fresh browsing context are tested separately and are never automatic production actions. No automatic reload or unbounded cache-busting is introduced. Rejected test starts and test-harness errors are retained separately.

Manual screen-reader review is performed by the user against the verified settings SSR fixture with a three-second artificial preparation delay. Results must be recorded separately from automated checks. Do not infer screen-reader acceptance from DOM or axe assertions.

## Frozen measurements

- `scoped-registry-phase-4-v1`: 480 production timings, 180 containment timings and 25 separate retention runs. Seal: `586243f26e4b2a86d6c69ffa5e7e2610afd982e9723e6f580638fdea4c1a04b7`.
- `scoped-registry-phase-4-followup-v1`: 450 interaction timings, 90 unused/abandoned observations and 15 separate retention runs. Seal: `cdf06804b074dc89d72df810b8dc14c87dc895b702160cd6aae037cb9219743c`.

Each timing/observation configuration has 30 successful samples. Earlier Phase 0–3 references are preserved. Reports retain their original study-date statements; the closeout receipt records the subsequent policy adoption and commit.

The selected route policy measured throttled immediate keyboard first use at 73.70 ms and touch at 73.40 ms, against intent-only 251.30/261.75 ms. Its unused-visit cost is 3,838 additional gzip JavaScript bytes. Startup-readiness differences were inconclusive. These are lab measurements after page readiness, not field INP or a guarantee that preparation finishes before every interaction.

## Phase 5 handoff

Begin scoped SSR and progressive hydration from the sealed commit: request-local registry/definition ownership, explicit null-associated declarative shadow boundaries where supported, ordered hydration/initialization, global and inert-template fallback, and qualified server/client identity. Preserve current eager critical controls and meaningful no-JS content. Carry the observed Chromium/WebKit failed-import persistence into Phase 5’s delayed/failed-chunk qualification. Firefox recovered on explicit same-document retry; do not generalize that recovery across engines. Follow `plans/scoped-custom-element-registries.md` for the full Phase 5 acceptance matrix. No Phase 5 implementation is included here.

## Manual-review follow-up: dismissal announcement ordering

The user accepted the original failure-then-retry workflow and its loading/failure announcements, but reported that Escape initially announced ", selected" while X correctly announced the restored Search commands trigger. Nine original-fixture DOM traces across three browsers established that Escape cleared combobox ARIA while the search field remained focused. X performed those changes after focus left that field; both restored focus.

The requested candidate closes an accepted palette in `willUpdate` before rendering collapsed combobox ARIA. Opening retains its post-render timing; canceled closes retain their query and candidate. The original reviewed fixture remains immutable. A separate candidate on port 4212 is archived with its source/asset hashes in `artifacts/scoped-registry-phase-4-closeout/dismissal-candidate.json`. All 45 focused palette checks passed across Chromium, Firefox and WebKit, including six new tests per engine and existing synthetic composition/reconnect/focus ownership coverage. The Escape ordering regression failed against the original build.

Screen-reader causation and speech improvement remain unconfirmed until the user retests this candidate. The prior complete-build parity and frozen timing evidence describe the earlier runtime; this candidate deliberately changes `command-palette/element.js`. Refresh the final production build/integration evidence and qualify performance applicability before the Phase 4 commit. Preserve the existing campaign freezes and original manual-review acceptance rather than relabeling them as candidate measurements.

The candidate was accepted by the user on 21 September 2026: Firefox and Safari announce Escape closure as expected; Chrome retains an incorrect spoken message but restores focus correctly. This is an accepted limitation, not a fully resolved Chrome speech claim. The final source passes fresh metadata/API/type checks, full production SSR/docs build, all 20 production integration checks, and nine served SSR dismissal traces. Final runtime comparison finds only the palette module changed from the measured route build (plus the previously verified activation export). Prior timing campaigns remain immutable historical evidence; no new timing claim is made for the dismissal patch. Rebuild the sealed Phase 4 commit as the next campaign reference.
