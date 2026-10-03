# Candidate impact and visual evidence delivery

This closes the still-open candidate-facing portion of experience §8, preserving
the original scope rather than treating existing screenshots or cache primitives
as finished integration. Managed remote adoption and physical/manual acceptance
remain separate blocked work.

## Delivery sequence

1. Surface the existing exact-build source-impact graph in Theme Review. Show
   changed inputs, affected components/cases, conservative expansions and gaps;
   let a reviewer open affected cases with the current candidate. Keep the full
   sheet and every workflow available. Missing or mismatched graphs are unavailable
   evidence, never an empty affected set. Cover single and paired candidates.
2. Add a reproducible Playwright capture/comparison entry point operating the real
   candidate previews from their original build. Retain expected, actual and diff
   artifacts per declared case/state/environment, exact candidate/base identity,
   installed browser/OS details and rendering/comparison implementation identities.
   Preserve failures, absent cases and explicit unsupported states. Reuse only
   complete matching evidence through the existing cache contract; baseline or
   threshold changes invalidate comparison separately. No automatic baseline adoption.
3. Bring verified evidence into the candidate UI, with immutable version matching,
   artifact integrity checks, accessible comparisons and clear missing/reused/failed
   states. Invalidate applicability on edits; retain the prior evidence provenance.
   Export/reopen/offline workflows must preserve these distinctions. A comparison
   outcome is mechanical evidence, not design intent, human approval or adoption.
4. Qualify the producer, reader and real-browser workflows (including corruption,
   stale identities, changed baselines/settings, paired themes, responsive delivery
   and missing cases), document the workflow, publish both root and project builds,
   then audit the complete requirement list against retained evidence.

## Validation boundaries

The existing source graph is conservative potential impact, not proof of effective
cascade or full external application ownership. Reuse does not grant review approval.
Capture readiness must include real hydrated examples, settled fonts/assets and
explicit authored state; timestamps or mutable URLs cannot stand in for content.
The implementation may ship in coherent checkpoints, but this task remains incomplete
until capture, comparison, UI and reproducibility requirements all have evidence.


## Source-impact checkpoint

Stage 1 is implemented: matching transport and canonical graph identities, single
and paired selection, conservative gap/error messaging, source reasons, same-draft
case navigation, and export provenance. The complete sheet remains in scope.
All18 selected root browser cases (six per engine), six GitHub subpath cases
and20 owning Node controls pass. Core/docs semantic gates retain their exact
prior baselines. The regression exposed and fixed a lost iframe handshake when
returning to a case on the same document; the final run verifies repeat-case
navigation after Undo/Redo. Both separately qualified production builds and the
failed attempts are retained in `apps/docs/tests/verification-candidate-impact-20261003.json`.
Stages2–4 remain incomplete; this checkpoint supplies no visual comparison result.

## Visual producer checkpoint

Stage 2 now supplies the reproducible CLI in `tooling/visual-review/README.md`.
It reopens both exact-build exports in the built application, captures declared
cases through the real preview bridge, produces expected/actual/difference PNGs,
and retains rendering/comparison/review identities plus every required outcome.
Full installed browser and system font inventories bind reuse. Cache entries are
staged until final build/runtime/font checks; disagreement for identical rendering
inputs disables reuse. The CLI reports fatal end-of-run failures even when prior
individual captures succeeded.

Qualification covers the bounded buttons default/focus cases, paired mobile
appearances, corrupt artifacts, metadata-only reuse, changed baseline/settings,
missing targets, explicit unsupported/omitted states, and pixel dimensions. A
standalone uncached CLI capture additionally verifies the executable path. See
`apps/docs/tests/verification-candidate-visual-producer-20261003.json`. These are
not all-case, all-state or manual acceptance results.

Stages 3 and 4 remain open: verified candidate-facing reader, portable evidence
export/reopen and offline delivery, broader state/case qualification, and final
requirement audit. The current producer supports original root builds only;
project-path capture support remains an explicit portability limitation to resolve
in the remaining integration rather than hiding it as successful coverage.

## Visual reader checkpoint

Stage 3 implements the browser-safe evidence reader, portable JSON packaging and
Theme Review import, expected/actual/difference images, explicit source applicability,
provenance disclosures and missing-artifact outcomes. It checks the declared matrix,
manifest and artifact hashes, original exports, capture/comparison identities and
outcome consistency. The application separately replays both token exports and decodes
PNGs before replacing prior evidence. Imported CSS and remote URLs are never executed.
These checks establish internal consistency, not producer authentication or approval.

Nine browser journeys now pass across Chromium, Firefox and WebKit: stale source
edits/Undo, candidate-reference and separate image export/reopen, corrupt import
recovery, paired mobile missing images and wrong-build rejection, and an offline
package with external network access blocked. Six mobile/offline journeys passed in
the first matrix; the three main journeys were rerun after correcting a test option
from nonexistent `0px` to the actual `0rem`. Earlier failed attempts are retained.
The original producer checkpoint remains the bounded capture/cache evidence.

Stage 4 remains open: project-path producer capture, broader sheet/workflow state
qualification and a complete requirement audit. The manifest currently inventories
59 sheet specimens and 11 workflow cases. Reader roundtrips do not establish that
full visual matrix, physical/manual acceptance or managed remote adoption.

A subsequent narrow-screen corrupt-import check exposed long artifact hashes
overflowing the reader. Evidence text now wraps within its container; the final
combined-build matrix covers that recovery state as well as normal and missing
images. Rejected imports explicitly retain the existing draft and evidence.


## Project-path and embedded capture checkpoint

Stage 4 now qualifies original project-path builds without stripping or rewriting
their base tag or build identity. The build verifier checks declared HTTPS origin,
base path, exact HTML base and build marker. Capture routes only verified build
assets; project escapes and external origins fail. Locally generated image blob
URLs remain usable in WebKit without permitting remote resources. Root-only offline
packaging retains its separate contract.

Readiness waits for visible hydrated custom elements and records deliberately
nonpainting deferred SSR content. Embedded cases retain their viewport and use
scroll tiles when needed, excluding external sticky page chrome. Pixel fixtures
cover tall/wide targets, fractional scroll rounding and targets that fit the full
viewport but not its unobstructed area. Nested scrolling, virtualization and
in-case sticky behavior retain their authored visible state.

The final combined run passes 21 tests across Chromium, Firefox and WebKit with
zero failures, skips or retries. It includes 36 project capture comparisons:
buttons default/focus and the settings workflow, paired light/dark, desktop/mobile,
on all three engines. All 36 report the deliberately introduced radius difference.
Root capture/cache and offline review regressions pass in the same run. The owning
20 Node checks pass; semantic comparison retains the exact core471/docs57 baseline
with zero added or resolved diagnostics. Earlier failed and interrupted attempts
remain retained. See `apps/docs/tests/verification-project-visual-capture-20261003.json`.

The published application assets are the unchanged, separately qualified root and
project builds from the reader checkpoint; this change affects capture tooling,
validation and plan documentation. Build reuse is explicit in the receipt.

The full 59-specimen/11-workflow authored state catalogue and requirement-by-requirement
audit remain unfinished. This checkpoint is not full visual, design, manual or
managed-adoption acceptance.

## Authored state catalogue checkpoint

The first catalogue joins all70 initial manifest cases with23 source-derived
interaction states. State postconditions now precede capture, and top-layer
states explicitly capture the visible embedded viewport. The reader checks that
postcondition/framing receipts match the declared fixture. No private state
injection is used. This catalogue is still partial: color-channel/drag states,
editor selections/suggestions, asynchronous response states, virtual collection
operations and compact-density candidate coverage remain to be added.

The first Chromium acquisition completed every initial desktop/light case and
found three ambiguous fixture selectors in the first interaction block (nested
menus and specimen Reset buttons). It was deliberately interrupted after that
block, retaining the outcomes. These are fixture corrections, not component fixes;
the interrupted campaign is not a complete pass.

The corrected interaction-only run passes all33 tests across Chromium, Firefox and
WebKit without failures, skips or retries. It retains276 comparisons (23 states,
desktop/mobile, light/dark, three engines), plus36 project-path comparisons and
reader, offline, readiness and GitHub navigation regressions. All22 owning Node
checks pass; core471/docs57 semantic diagnostics retain the exact existing baseline.
Metadata freshness and production types were checked before separate fresh root
and project SSR builds. See
`apps/docs/tests/verification-candidate-state-catalogue-20261003.json`.

This is partial qualification. The70 initial states remain explicitly not-run in
this interaction-only matrix; the earlier initial captures remain separate partial
evidence. Remaining work includes the full specimen/workflow state inventory,
compact-density candidates, nested/scoped customization and a requirement audit.
The audit also identifies a missing local human assessment layer: mechanical pixel
outcomes alone cannot distinguish intentional design changes, regressions and
unassessed differences. That layer must bind notes to exact candidate/evidence
identity without mutating machine evidence or implying remote adoption.


## Native actions and responsive fixtures checkpoint

The catalogue now has72 authored interaction states in addition to the70 initial
manifest cases. File fixtures use explicit portable bytes; modifier clicks and
normalized pointer gestures exercise native browser events. Pointer states may
commit, cancel with Escape, or remain held for preview capture. Declarative
viewport bounds open responsive navigation only in the applicable layout; skipped
actions never suppress strict locator errors or final visible-state assertions.

The corrected navigation branch and color-plane cancellation states pass24
comparisons (two states × desktop/mobile × light/dark × three engines). All nine
selected browser tests pass, including native file/pointer/modifier and async
postcondition controls. Twenty-four owning Node checks pass, and the semantic
gates retain their exact core471/docs57 baseline without added or resolved
diagnostics. Both deployment builds are fresh. Fifteen additional browser journeys pass across
all three engines for reader import/recovery, stale identities, offline evidence
and GitHub Pages paths. See
`apps/docs/tests/verification-expanded-catalogue-20261003.json`. Earlier failed fixture attempts
remain retained separately; their output is not a passing full campaign.

This checkpoint does not establish the full72-state or70-initial-case matrix.
Remaining workflow/specimen states, dense/scoped candidates, local human assessment
controls and the final requirement audit remain in scope. Mechanical differences
do not grant design acceptance; manual and managed-adoption gates remain separate.

## Local assessment checkpoint

Theme Review now separates human classifications and follow-up notes from capture
outcomes. Each row starts unassessed. Complete images can be classified as an
intentional change or suspected regression with a rationale; missing/failed/omitted
rows accept notes without claiming a visual classification. Open/resolved follow-up
status is independent of matching pixels. Editing is disabled when the draft differs
from the captured candidate, while saved notes remain exportable.

Assessment JSON binds the exact manifest, baseline, candidate, build and row
identities. Imports reject corrupted or mismatched records without replacing prior
notes; successful imports reset unsaved native form text. Imports that finish after
a draft change cannot overwrite current work. Session history preserves notes when
the same available evidence is unloaded and reopened. Explicit export is required
before refreshing or closing the page. Local opinions do not authenticate a reviewer,
adopt a theme, change a baseline or establish manual acceptance.

Thirty owning Node checks and the unchanged core471/docs57 semantic baseline pass.
Eighteen browser journeys pass across Chromium, Firefox and WebKit: assessment
editing/import/recovery, stale drafts, unavailable captures, offline roundtrip,
late-import protection and GitHub Pages paths. Both deployment builds are qualified.
The first interrupted browser attempt exposed test locator/native-option assertion
issues; it is retained separately, and the corrected run has no skips or retries.
See `apps/docs/tests/verification-visual-assessment-20261003.json`.

The remaining implementation is the complete authored specimen/workflow state,
density and scope catalogue, followed by full acquisition and the final requirement
by requirement audit. Managed adoption and physical/manual gates remain separate.

## Workflow state checkpoint

Twenty-four additional states now qualify settings commands/validation/save retry,
pending saves with newer edits, incoming collaborator changes, project selection,
multi-step failure/recovery, and contextual chat preview/apply/cancel/retry.
Each drives public UI and checks its observable result before capture. All 288
comparisons completed across the three engines, two viewports and both appearances;
15 Node controls pass. The final three-engine selection rerun passes three browser tests. The first diagnostic run was interrupted
after a strict selector matched the settings menu and its nested submenu; the
named outer-menu correction passes. Mobile WebKit then exposed offscreen Project
field filling; all 36 selection combinations were rerun after adding an explicit
click before typing. The other 252 successful fixture comparisons remain unchanged.

This brings authored interactions to 96, plus 70 initial cases. This is selected
workflow evidence, not a completed 166-case matrix. Remaining specimen interactions,
explicit density/scope cases and the final requirement audit remain open.
Root/project runtime builds are unchanged from 118f2244 and reused with exact
asset/source checks. The receipt records reuse instead of claiming a fresh build.

## Specimen and scope checkpoint

The catalogue now declares 139 interaction states and 70 initial cases. Forty-three
new states cover remaining interactive specimens, the sheet's multi-step workflow,
scoped inverse themes, local overrides, family geometry and native link focus.
Computed CSS postconditions distinguish scope relationships from screenshots alone.
The acquisition driver now separates compact, comfortable and spacious pairs.

Sixteen Node checks and both fresh deployment builds pass. The first Chromium
light block reached all 43 new cases: 39 completed, while four fixture assumptions
failed (ambiguous combobox disclosure, carousel button label placement, tree ancestor
text matching, and virtual table status wording). The diagnostic run was explicitly
interrupted after that block; it is not a passing campaign. Corrections target the
named controls and assert the requested virtual row as well as success feedback.
The focused correction qualification is recorded below; full acquisition remains
pending. No product behavior defect or user acceptance is inferred from this diagnostic run.

The corrected checkpoint passes 18 final browser tests across Chromium, Firefox
and WebKit. It retains 48 exact current-fixture comparisons: 36 unchanged successful
combobox/carousel/tree rows from the preceding run plus 12 virtual-reveal rows from
the final run. Both expected and actual postcondition lists are verified. The
preceding run itself failed and is preserved, including its four WebKit pointer-
guard failures and six skipped Pages checks; all Pages checks passed in the final run.

The pointer diagnosis distinguished automation from delivered behavior. WebKit's
Playwright click guard rejected the text field inside nested shadow/details roots,
while real pointer dispatch at the visible field center focused it and completed
the reveal in both standalone and sheet demos. Those pointer regressions now pass
in all three engines. The catalogue uses ordinary Tab/Enter and public text input,
with value, focus, success and rendered-row assertions. No force click, private
component state write, or product behavior workaround was introduced.

A new same-session test verifies that candidate pins and all three density changes
leave the accepted parent styles and baseline radius unchanged. Nested full themes
reset inherited component radius pins, local zero-radius overrides remain local,
and scoped field nodes/drafts survive updates and paired reset. This passes all
three engines. Reader, CSS and native-action control tests also pass across all
three engines in the preceding run; its overall failure is not relabeled as a pass.
See `apps/docs/tests/verification-specimen-catalogue-20261003.json` for exact receipts.

Full acquisition of all 209 cases across three densities, two appearances, two
viewports and three engines remains unfinished, as does the final requirement audit.
This checkpoint adds and qualifies the machinery and selected states; it does not
establish complete matrix coverage or manual acceptance.


## Preview coverage audit correction

The clause audit found that Theme Review displayed only the returned case count,
without its planned denominator or missing-case list. Partial and empty responses
could therefore look like an ordinary ready preview. The status now compares the
current response with the selected page’s exact build inventory and discloses all
missing IDs. A failed response leaves the planned count visible and reports its
error without inventing rendered coverage. Export retains the original required
and actually returned case lists; neither rendering nor export grants acceptance.

The first full acquisition on849e5650 was deliberately interrupted to make this
correction before capturing the complete matrix. Its partial results remain
historical evidence, not a complete pass. The correction passes 57 browser checks
across Chromium, Firefox and WebKit, including all nine partial, empty and failed
response cases. Current producer/cache, project-path capture, offline reader,
GitHub Pages and scope-isolation regressions pass. The project-path captures retain
36 comparisons. See `apps/docs/tests/verification-preview-coverage-20261003.json`.
A new full acquisition against this build and the final requirement audit remain
pending. Full acquisition disables redundant Playwright traces while retaining all
case assertions, screenshots, pixel comparisons and provenance.

## Family geometry density correction

The second full acquisition found an invalid field-padding assumption in the two
family-geometry focus states. Compact shared defaults and the scoped space.2 pin
are both 8px in this fixture; a strict less-than comparison rejected correct
output. The postcondition now checks the exact scoped padding, and the example
explains that it matches compact defaults while tightening the other densities.
No component behavior changed.

The corrected states complete all 72 comparisons across three densities, both
appearances, both viewports and all three engines. All 12 selected browser tests
pass, including current-build evidence-reader and GitHub Pages checks. Fresh
root/project builds, metadata freshness and production types pass. See
`apps/docs/tests/verification-geometry-density-20261003.json`.

The interrupted full acquisition retains 156 completed comparisons, the two
geometry assertion failures, two interruption errors and 676 unrun rows. It is
not a completed campaign. The full 7,524-comparison acquisition and final audit
remain outstanding; this selected correction does not shrink that scope.

### Full-acquisition packaging follow-up (implementation, qualification pending)

The full authored-state capture exceeded the portable reader's 128 MiB limit
before finishing its first density/engine report. Keep the original acquisition
and reader limit. `tooling/visual-review/package-parts.mjs` now drafts a
post-acquisition partition path with ordinary importable bundles and an index
bound to the original manifest. Each authored case retains all of its environment
rows; failed, omitted and unsupported rows, original exports, identity inventories,
and otherwise unreferenced artifacts must survive unchanged. The verifier rejects
incomplete or changed sets. A single oversize case fails rather than disappearing.

Implementation is isolated in `codex/visual-evidence-parts` while the full matrix
runs on frozen `b7cca55e`. Node controls cover preservation, exact byte boundaries,
corruption, changed scope, duplicate/omitted cases and atomic output failure.
Syntax checks have passed; these controls and real reader import qualification
have **not yet run**. Run them through the owning validation entry points once the
current machine lease is released. Reconcile the original full acquisition before
merging, then qualify partitioning of those exact retained artifacts. No new
capture, baseline promotion, manual acceptance or source publication is claimed
by this checkpoint.


### Compact mobile cancellation fixture (qualification pending)

Full acquisition 03 exposed an occluded pointer target in
`workflow:settings-pending-save/cancelled-save` for Chromium compact/mobile/light.
The focused Save trigger deliberately retains its tooltip; its block-end overlay
covers Cancel in this narrow layout. The tooltip contract supplies Escape to dismiss
that focused interval without moving focus. The authored cancellation journey now
presses Escape on Save before the ordinary, hit-tested Cancel click. It retains the
same cancellation outcome assertion and changes neither product behavior nor the
case inventory. No force click, private state write or pointer-event override is used.

The original failed row and reason remain evidence. The fixture is not yet qualified.
Let the current compact capture segment finish its build/runtime checks before
stopping the known-failing outer run; retain its completed cache and all outcomes.
Then qualify the corrected journey across densities, responsive appearances and
engines. Exact unchanged rendering identities may use the documented cache contract;
the changed fixture must acquire fresh evidence. Any assembled full-matrix receipt
must retain original acquisition and reuse provenance, not claim all images were
newly captured. Packaging and final coverage qualification remain outstanding.


The catalogue now has an explicit optional `EN_VISUAL_CACHE_ROOT` forwarding
surface so a completed, preserved capture cache can be copied to fresh storage
for continuation. All nine engine/density reports and all 7,524 required rows
remain mandatory. This wiring is pending qualification along with the cancellation
correction; no reuse is claimed until the original segment reaches terminal and
the ordinary identity checks accept a copied entry.

## Pointer hit-target qualification pending

The full compact acquisition also found unchanged saturation (`58.3` instead of
`50`) for the mobile color-plane preview and commit gestures. The retained default
capture places the specimen at y=-8.828125 with a 145px sticky navigation area;
the plane begins about 91px into the specimen, so its authored 20% drag start is
covered. The action runner previously checked viewport bounds but sent raw mouse
coordinates without checking which element received pointerdown.

The isolated correction uses Playwright's native hover actionability at the
source fraction before measuring the final drag geometry. This permits normal
scrolling around sticky content without forced events or changing component state.
A browser regression starts the source visibly inside the viewport but under
sticky navigation and requires a real completed drag without a navigation hit.
The color-plane states and owning pointer tests still require qualification across
engines and densities; this diagnosis is not a claimed browser pass. Changing the
shared runner changes capture identity, so older captures must not be reused under
the new producer identity merely because their pixels appear unchanged.

## Native pointer rounding qualification pending

The focused rerun proves the sticky-navigation correction in Chromium and Firefox.
Firefox's desktop midpoint gesture produces saturation `49.8` instead of exactly
`50`, while the mobile gesture reaches the asserted value. Native pointer-coordinate
rounding makes exact string equality inappropriate for this pointer postcondition;
the owning color-plane test already allows a bounded numeric range for pointer use.

The two midpoint fixtures now declare a 0.5 percentage-point tolerance around 50.
Exact keyboard values and the cancellation restoration value remain exact. Numeric
tolerance is explicit capture input, validated as finite and nonnegative, and only
allowed for numeric value checks. A browser negative control rejects the unchanged
58.3 value and blank input; Node controls reject invalid tolerance contracts.
This update awaits execution and does not convert the failed first run into a pass.
