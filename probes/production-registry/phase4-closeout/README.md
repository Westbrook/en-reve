# Phase 4 closeout

The settings entry adopts the exact route-entry load-only candidate measured in `scoped-registry-phase-4-followup-v1`. The controller and the settings workflow keep their previously verified implementations. Registration and focus remain explicit-action work.

`verify-functional.mjs` serves the isolated integrated build after proving parity with that frozen route candidate and exercises production integration with held optional-module responses in Chromium, Firefox and WebKit: overlapping first actions, Escape, focus moving elsewhere, disconnection, navigation, failed preparation followed by explicit retry, and Chromium/WebKit touch. This is correctness coverage, not new performance data. It observes actual dynamic-import requests and never substitutes the implementation's loader or evaluates fake recovery code.

`verify-build.mjs` compares a clean build against that measured candidate: all library JavaScript, the complete static/dynamic settings dependency graph, and server-rendered settings HTML. It permits only the site-wide review fingerprint and randomized Lit marker nonce in HTML and the newly exported activation module, whose source must match the prior verified snapshot. The isolated source directory is recorded in `artifacts/scoped-registry-phase-4-closeout/isolation-path.txt`.

The clean checkout also needs the one-line `composable-chat` example-generator entry already present in the measured source archive. Without it, an existing static import points at an absent generated module. No unrelated docs/theme behavior is included in this commit.

Browser runs use the shared benchmark lock. Hold/failure assertions do not replace the manual screen-reader check. Manual review uses the previously verified SSR settings fixture with its explicit preparation delay increased from 300 ms to three seconds, solely to make loading and retry announcements reviewable; that change is excluded from production and performance artifacts.

The real-network retry check requires explicit activation to re-execute the production importer, observed through Vite's preload-error event, rather than only redisplay a library-cached rejection. Some browser/import-path combinations reject again without another fetch. That branch must preserve usable settings, visible error feedback, cleared busy state and trigger focus; document reload and, if needed, a fresh browsing context are qualified separately. Ordinary reload is not assumed to clear every engine’s failed import state. This does not claim same-document recovery in every browser, and production never automatically reloads or cache-busts a form. The result records each engine’s recovery mode. The separate native probes are diagnostic: a document-loaded module script reproduces WebKit’s rejected retries without the library loader or workflow controller, while a plain import from another caller can recover. Firefox 155 changed native failed-import caching: https://www.firefox.com/en-US/firefox/155.0/releasenotes/ .

For a fresh checkout, build the intended revision with `npm run build`, then run `node probes/production-registry/phase4-closeout/prepare-site.mjs dist` and `node probes/production-registry/phase4-closeout/verify-functional.mjs`. Preparation refuses to replace existing integration evidence; archive the prior run before preparing another build. These commands test correctness only. The closeout parity receipt binds the sealed revision to the historical timing campaign; a later changed revision does not inherit its performance claims.

The exact manually reviewed fixture is retained in `artifacts/scoped-registry-phase-4-closeout/manual-review.tar.gz` with its checksum in `manual-review-fixture.json`. Extract it into a dedicated directory and use `EN_LAZY_OUT=<absolute-directory> node probes/lazy-registry/server.mjs` to review it again. The three-second delay belongs only to that review fixture.

### Dismissal announcement candidate

`trace-dismissal.mjs` records DOM ordering only, not screen-reader speech. The original manual fixture is on port 4211. The separate `manual-review-close-order` fixture on 4212 contains the palette's accepted-close-before-render change and the same 3-second artificial preparation delay. Its immutable archive and hashes are recorded in `dismissal-candidate.json`.

Run its served SSR check when the shared browser lock is free:

```sh
DISMISSAL_FIXTURE_URL='http://127.0.0.1:4212/lazy-ssr.html?mode=global&intent&hold' \
DISMISSAL_TRACE_OUTPUT=artifacts/scoped-registry-phase-4-closeout/dismissal-candidate-trace.json \
EXPECT_CLOSE_FIRST=1 node probes/production-registry/phase4-closeout/trace-dismissal.mjs
```

The component suite adds accepted Escape/X/programmatic-close ordering and canceled-close regressions; its focused palette/composition run passed 45 checks in three engines. One new Escape ordering test fails against the unchanged original build, as intended. These correctness checks do not refresh performance evidence. Manual speech acceptance and final production integration/build/measurement qualification remain required before sealing this changed runtime.
