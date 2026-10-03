# Documentation semantic closeout — 2026-10-03

Resolved the nine unbaselined diagnostics found by the expanded gallery gate.

- Version-review fixture digests use the existing typed SHA-256 helper.
- Missing and unsupported evidence use separate discriminated variants, so
  executed/reused provenance is narrowed without assertions or suppressed errors.
- Declaration emit uses the compiler's inferred callback types, including optional
  readonly source lists. AST names are accessed only on nodes carrying a name.
- The pinned TypeScript 6 runtime's transitive type-only alias query has a narrow
  declared boundary and an explicit runtime capability check. Its public compiler
  declaration omits this method; no fallback silently changes export classification.

Both semantic gates pass against their exact existing diagnostics. Documentation
retains 57 known baseline entries; core retains 471. Only five now-resolved core
entries were removed. No new baseline entries or suppressions were introduced.
This is baseline conformance, not a claim that all historical type debt is gone.

Twenty-five owning metadata/evidence/review-package controls pass. Metadata was
verified before regeneration; regenerated type snapshots have identical public
contracts, exports, references and dependencies. Only extraction-policy and
referencing graph identities changed. Final public graph freshness passes.

The fresh documentation build and three version-review browser cases pass in
Chromium, Firefox and WebKit. The review test remains explicitly a same-build
isolation fixture unless supplied an original retained build; it does not prove a
real visual version difference. See the [receipt](../apps/docs/tests/verification-semantic-closeout-20261003.json).

The first Node attempt passed 24 controls but its loopback server was denied by
the filesystem/network sandbox. The supported elevated run passed all25. That
failed environmental attempt remains retained. Physical/manual acceptance and
candidate-bound expected/actual/difference delivery remain separate.
