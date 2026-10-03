# Candidate visual capture

This private maintainer producer uses the **original, exact documentation build**
and two exported Theme Review files: an explicitly chosen baseline and candidate.
It does not infer the expected appearance from a draft's historical base or promote
screenshots to approved baselines. The matching built application reopens both
files before its real preview bridge renders them.

```sh
tooling/test-pipeline/with-toolchain.sh node tooling/visual-review/capture.mjs \
  /absolute/original-dist /absolute/baseline.json /absolute/candidate.json \
  /absolute/fresh-capture /absolute/capture-config.json
```

The CLI owns the normal machine and checkout leases. Output must not exist. It
serves only verified build bytes through Playwright's request routing; external
requests fail. No network, cloud upload, installed browser profiles or adoption
service is used. Original root builds are currently supported; transformed hosting
builds are rejected by the shared offline-build verifier. Use the matching private
Site export and original root build for this checkpoint.

An optional JSON configuration can select engines, viewports, authored states and
comparison settings. Without it, the required inventory is every case in the build
manifest (including workflow variants), both appearances when supplied, all three
pinned engines and desktop/mobile viewports. These are **initial-state captures**,
not every possible interaction. Add explicit state actions for other requirements.
A selection never removes omitted rows from the declared inventory.

```json
{
  "engines": ["chromium", "firefox", "webkit"],
  "viewports": [{"id": "desktop", "width": 1280, "height": 900}, {"id": "mobile", "width": 390, "height": 844}],
  "cases": [
    {"id": "buttons", "page": "sheet", "state": "default", "selector": "[data-specimen=buttons]", "actions": []},
    {"id": "buttons", "page": "sheet", "state": "focus", "selector": "[data-specimen=buttons]", "actions": [{"kind": "focus", "selector": "[data-specimen=buttons] en-button button >> nth=0"}]}
  ],
  "selected": ["buttons:default", "buttons:focus"],
  "comparison": {"channelThreshold": 0, "maxDifferentPixels": 0},
  "cacheDirectory": "/absolute/private-capture-cache",
  "reuse": true
}
```

State actions use documented Playwright locators and `click`, `focus`, `hover`,
`fill`, `press`, or `select` (selectOption). Value actions require `value`. A fixture
may declare `unsupported` with a nonempty explanation; it remains visible and does
not pass. The authored fixture is code-reviewable test input, not a candidate-file
script API. A case's selector must identify exactly one rendered target.

Each case runs in a fresh context. Readiness requires the matching preview receipt,
lazy custom-element definitions/updates, settled fonts and decoded images. Captures
freeze Date, use UTC/en-US/LTR, CSS-pixel scale1, explicit viewport/appearance,
reduced motion and disabled screenshot animations, with hidden caret. These settings
are recorded, not presented as physical-device or assistive-technology coverage.

## Evidence and reuse

`evidence.json` contains exact baseline/candidate envelope and source identities,
build identity, authored fixture/state, engine/OS/browser-distribution and system
font identities, comparison settings, all required rows and artifact digests. Each
capture/comparison retains its originating run and whether it was executed or reused.
`artifacts/` contains content-addressed expected/actual/difference PNGs, failure
receipts, both input exports and identity inventories. Keep the complete evidence
file and listed artifacts together. The optional local cache is an optimization,
not the transfer or review authority. Evidence can include private candidate content.

The existing `EvidenceCache` owns integrity/history validation. Rendering and
comparison identities are separate: changing metadata does not invalidate pixels;
changing the chosen baseline or tolerance invalidates comparison appropriately.
Browser distributions include Chromium's headless shell and WebKit libraries, using
the shared test runtime inventory. System font bytes are inventoried separately.
Incomplete font identity disables capture reuse. Source-impact gaps disable cache
hits. Artifact bytes are checked again when copied, even after a successful lookup.

Cache entries are staged until the original build, runtime and fonts pass end-of-run
identity checks. An interrupted run cannot expose its staged entries as completed.
If identical rendering inputs produce different images, the producer records a
failure that prevents reuse; a later passing retry does not erase that history.
Comparison failures likewise remain in the cache's history. Nothing updates an
expected baseline automatically.

Comparison uses public Canvas PNG decoding and per-channel byte differences. A
pixel differs when any RGBA channel exceeds `channelThreshold`; `maxDifferentPixels`
is an explicit integer budget. Dimension changes always differ, regardless of that
budget. The difference PNG highlights changed pixels and retains a faded grayscale
context. This is mechanical pixel evidence, not perceptual similarity or design
acceptance. `different`, `failed`, `not-run` and `unsupported` remain distinct.

## Qualification and remaining delivery

Owning unit tests live in `plan.test.mjs`; actual preview, cache, paired/mobile,
corruption, changed-baseline and pixel-comparison journeys live in
`apps/docs/tests/candidate-visual.spec.ts`. Use the supported `test:workflows` entry
with fresh `EN_EXECUTION_OUTPUT`, as described in the test-pipeline guide.

This checkpoint provides the producer. The verified candidate-facing evidence
reader, portable evidence integration, broader authored state catalogue and final
scope audit remain in `plans/candidate-visual-evidence-2026-10-03.md`. A successful
bounded qualification run does not establish all-case or manual acceptance.
