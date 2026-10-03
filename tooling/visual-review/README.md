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

## Authored interaction catalogue (in progress)

`catalogue.mjs` joins every manifest initial case with source-derived named states.
It currently adds 72 interactions; it is not yet the complete interaction catalogue.
No state calls private component methods or injects application state. Cases may
include `checks` with `visible`, `hidden`, `focused`, `checked`, `text` (contains),
`value`, `attribute` (`name` and `value`), or `count` assertions. Every check names
an explicit Playwright selector. The producer waits for each postcondition and
retains its result; an unmet condition fails capture. The reader requires declared
checks to match the successful capture receipts.

Use `capture: "viewport"` for open top-layer menus, dialogs and drawers. The PNG
then covers the visible embedded viewport, including overlays outside the specimen
box. Ordinary cases retain their element/scroll-tile framing. Framing and checks
are part of the fixture identity and invalidate earlier captures when changed.

```sh
EN_VISUAL_CATALOGUE=1 EN_EXECUTION_OUTPUT=/absolute/fresh-run \
  tooling/test-pipeline/with-toolchain.sh npm run test:workflows -w @en-reve/docs -- \
  candidate-catalogue.spec.ts
```

`EN_VISUAL_SELECTED` may select comma-separated `id:state` entries during diagnosis;
unselected rows stay in the required inventory as `not-run`. Without it all current
catalogue entries are acquired in both appearances and desktop/mobile across the
three pinned engines. This tests exact current-build baseline/candidate exports
with a deliberate radius change. It does not promote a baseline or replace the
remaining state coverage and manual/design acceptance. New examples missing from
a frozen build fail catalogue planning rather than silently disappearing.

### Native file and pointer states

Authored actions can supply `files` as basename/MIME/base64 fixtures, click with
explicit keyboard `modifiers`, and `drag` between normalized points in rendered
source/target elements. File actions never read arbitrary filesystem paths.
Drags require both endpoints in the authored viewport and may release, cancel with
Escape, or remain held for a preview capture; the isolated context then closes.
The contract and executor are included in the producer identity. For Escape in an
embedded preview, author focus on an equivalent control before dragging so the
keyboard event belongs to that document; pointer-only activation may leave focus
in the surrounding review page.

The expanded catalogue includes color, navigation, collection, feedback, chat,
file selection and transfer recovery states. The native action controls and two
corrected states pass across all three engines and responsive appearances. The
complete72-state acquisition remains pending; earlier receipts retain their
original23-state scope. For fixture
diagnosis `EN_VISUAL_VIEWPORTS=desktop` explicitly selects one viewport in the
catalogue browser test; omitted viewport acquisitions are not full-matrix evidence.

Responsive actions may declare `whenViewport: {minWidth, maxWidth}` using inclusive
CSS pixel widths. This opens the native compact navigation disclosure only in its
authored narrow layout. Conditions are validated and bound into fixture identity;
matching actions retain ordinary strict locator errors. Final state checks remain
mandatory for the declared interactive result, including visible expanded content.

## Local visual assessments

Theme Review keeps human assessment separate from immutable capture outcomes.
For each row, select **Unassessed**, **Intentional change**, or **Suspected
regression**, add a rationale, and save. Follow-up notes can remain open or be
resolved independently. Missing/failed/omitted captures accept notes but cannot
receive a visual classification. A matching screenshot is not automatically an
intentional or accepted result.

Changing the draft disables assessment editing until its captured source is
restored. Notes remain exportable while stale. **Export assessment** writes a
separate JSON file tied to the exact evidence manifest, baseline, candidate,
build and individual rows. **Import assessment** rejects changed or mismatched
files without replacing saved notes. It never modifies machine receipts or
promotes a visual baseline. This is local reviewer opinion, not authenticated
approval or managed adoption.

Saved notes live in this page session, including unload/reload of the same
available evidence; export before closing or refreshing. Keep the candidate,
visual evidence, assessment and matching build together for offline reopening.
An import interrupted by a draft/evidence change cannot replace newer work.
Different sets of available image artifacts have separate session assessments;
restore complete images before importing a classified assessment.
