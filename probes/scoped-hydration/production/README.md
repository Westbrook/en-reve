# Phase 5 production comparison

1. `python3 probes/scoped-hydration/production/prepare.py` exports the exact sealed Phase 4 commit, overlays only listed Phase 5 SSR files, builds and packs five library packages, and Vite-builds extracted tarballs. Requires existing repository dependencies. Never alters the working tree's package links.
2. `node probes/scoped-hydration/production/campaign.mjs --qualify --run=<unique-name>` qualifies all configurations plus separate retention runs. Uses the shared browser lock and installed Playwright browsers.
3. `node probes/scoped-hydration/production/campaign.mjs --run=<unique-name>` collects 30 samples per cell and five separate retention runs per policy. Unique output directories prevent appending to a previous run. Keep other browser/build workloads stopped during capture.
4. Copy `server-cost.mjs` into each exported `<stage>/phase*/study` and run there with `--out=<absolute-output>` (plus `--isolated` for Phase 5). Run this serially after browser capture. Stage path is recorded in `artifacts/scoped-registry-phase-5/production/stage.txt`.
5. Freeze the receipts, packed packages, measured sites, source overlay, harness, successful raw samples and server costs together. Keep exploratory qualification separate. Historical Phase 0–4 settings captures remain their own series.

See `protocol.md` for timing boundaries and limitations. `manual.mjs` serves the cold production fixture at http://127.0.0.1:4231. Add `?delay&progress-report` to hear loading; add `?delay&fail&progress-report` for an application-level failed loader followed by explicit retry. That synthetic review failure is separate from browser tests aborting an actual chunk request. Keep typing in Draft while loading, open commands, and close with Escape or Close; check focus restoration, selection, form validation, loading/error speech and physical IME input. Native save is a fixture form, not a data service.

## Final Phase 5 opening policy

`island.mjs` now waits for the palette's first update and two animation frames in
its application-owned `ready` callback. This incorporates the user-confirmed
Safari/VoiceOver remediation once per hydration island; repeated opening does not
wait again. The helper observes cancellation and boundary movement. The main manual
server uses `private, no-cache`, which the user confirmed restores Firefox native
form state on Back. No storage-based restoration was added.

The original `scoped-registry-phase-5-v1` capture predates the settling policy and
remains immutable. Final capture/build/verification lives in `../closeout` and
`artifacts/scoped-registry-phase-5-closeout`. Set `PHASE5_CAPTURE_ROOT` when running
`campaign.mjs` or `functional.mjs` against those sites. Do not rerun `prepare.py`
over an existing measured campaign. The closeout build reuses the frozen library
packages, exact original Phase4 eager assets and original SSR HTML. Only the Phase5
application readiness module and its import change.
