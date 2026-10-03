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
service is used. Both original root and separately built project-path outputs are
supported. A project build must declare its canonical HTTPS deployment URL and
path, with exactly one matching `<base>` in every HTML head. Manually transformed,
missing-base or mismatched builds are rejected. Use an export from that exact
build; root and project exports are not interchangeable. Project capture routes
only inventoried assets inside that path and never contacts the live host.

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
rendered custom-element definitions/updates, settled fonts and decoded images.
Nonpainting unregistered elements and hidden SSR `defer-hydration` content are
recorded as deferred rather than awaited forever. Readiness runs before and after
state actions; visible unhydrated content fails. This does not claim functional
qualification of an unopened lazy surface. Captures
freeze Date, use UTC/en-US/LTR, CSS-pixel scale1, explicit viewport/appearance,
reduced motion and disabled screenshot animations, with hidden caret. These settings
are recorded, not presented as physical-device or assistive-technology coverage.

Tall or wide embedded targets are captured in scroll tiles at the original viewport
size, avoiding the iframe clipping that otherwise produces blank pixels. External
sticky/fixed page chrome is excluded from the usable capture area. In-case sticky
content follows its real scroll behavior, and nested scroll/virtualized regions
retain their authored visible state: tiling does not expand their hidden content.
Each capture records its viewport, safe area and tiles. Size changes or clipped
tiles fail instead of producing apparently complete evidence. This is a composite
of scroll positions, not a claim that all content is visible simultaneously.

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
`apps/docs/tests/candidate-visual.spec.ts`. Project-path capture, deferred SSR
readiness and tall/wide pixel coverage live in
`apps/docs/tests/candidate-project-visual.spec.ts` (set `EN_GITHUB_PAGES_BUILD` to
the original project build). Use the supported `test:workflows` entry
with fresh `EN_EXECUTION_OUTPUT`, as described in the test-pipeline guide.

The producer and candidate-facing reader are implemented, with portable evidence
packaging below. Reader qualification is recorded in the delivery plan; the broader authored state catalogue and final
scope audit remain in `plans/candidate-visual-evidence-2026-10-03.md`. A successful
bounded qualification run does not establish all-case or manual acceptance.

## Portable evidence and Theme Review

After capture, package the manifest and its content-addressed files together:

```sh
tooling/test-pipeline/with-toolchain.sh node tooling/visual-review/package.mjs \
  /absolute/capture-output /absolute/original-dist/review-build.json \
  /absolute/new-visual-evidence.json
```

The packager checks the complete declared matrix, original baseline/candidate
exports, rendering/comparison identities, artifact hashes and dimensions before
writing a new file. It never fetches a URL from evidence. The bundle is limited
to 128 MB; retain the directory for larger campaigns and split their declared
capture runs explicitly. A narrowed run is never described as full coverage.

In the matching built **Theme Review**, use **Import visual evidence**. The page
repeats integrity checks, semantically reopens both original exports with this
build's token compiler and decodes PNGs before replacing the previous evidence.
A failed import leaves both the draft and previous evidence intact. Reported
outcomes and reused/executed provenance remain separate from human acceptance.
These checks establish internal consistency and unmodified bytes, not the
identity or trustworthiness of the producer. Only use evidence from a source
you trust; a self-authored hash is not a digital signature.

Import does not replace the draft. **Open captured candidate** explicitly reopens
its original draft, preserving Undo. Changes to rendering source make the loaded
results stale; Undo can make them applicable again. Metadata changes do not change
pixels: captured metadata remains in the original immutable export. The explicitly
chosen expected baseline remains visible and is not assumed to be the live preview's
library baseline.

**Export candidate** retains a small evidence reference. **Export visual evidence**
retains the separate image bundle, including missing-artifact distinctions. On
reopen without the matching bundle, the page says its artifacts are missing; it
does not turn the reference into passing evidence. Keep both files with the exact
original documentation build for offline review. Candidate replay, evidence
integrity, build applicability, image comparison and human review are distinct.
