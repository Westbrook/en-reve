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
