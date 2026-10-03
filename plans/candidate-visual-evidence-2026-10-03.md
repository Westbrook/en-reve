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
