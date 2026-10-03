# Expanded gallery consumer qualification — 2026-10-03

All 59 displayed gallery copies and all 11 complete API copies now have independent
native packed-consumer journeys in Chromium, Firefox and WebKit. This closes the
eleven-copy runtime gap introduced when the complete authored catalogue was
restored to the hydrated sheet.

## Delivered and verified

- Exact displayed source is extracted and strictly compiled against packed public
  declarations. Runtime fixtures use public package export maps without the docs
  runtime, workspace declarations or a bundler.
- New journeys cover standalone color sliders, planes and wheels; shared color
  composition and veto; drawer navigation and destination focus; table selection,
  veto and virtual reveal; and reference insertion/color cancellation.
- Chat, activity, toast and tree reuse their owning application journeys on the
  separately extracted gallery source with explicit consumer registrations.
- The immutable preparation identity includes the new scenario module. The
  exhaustive inventory has no pending gallery IDs.
- The full suite passes 30 browser cases: ten per engine, executing 70 distinct
  copied modules per engine. Two eager scoped-registration fixtures per engine
  remain separate from copied-source coverage.
- The original qualified static build is reused byte-for-byte. This checkpoint
  changes tests and plan documentation only; generated modules and all output
  hashes are reverified before publication.

See [the exact-input receipt](../apps/docs/tests/verification-expanded-gallery-20261003.json).
The first Chromium attempt failed because the new test searched for a button
instead of the navigation group's native summary. Corrected summary interaction
passes all engines; failed evidence remains retained.

## Remaining independent work

The documentation semantic gate found nine unbaselined diagnostics in existing
code: four digest types in `version-review.spec.ts`, two discriminated-outcome
accesses in `tooling/evidence/graph.ts`, and three TypeScript API declarations in
`tooling/metadata/type-snapshot.ts`. None is in the new journeys. Resolve them
without adding suppressions or accepting a new baseline; this checkpoint does not
claim a passing broad semantic gate.

Candidate-facing source impact and version-bound expected/actual/difference
captures remain to implement. Physical platform/assistive-technology/IME checks
and service-dependent theme adoption remain separate. Runtime journeys supplement
owning component matrices and do not establish exhaustive state or manual coverage.
