# Packed navigation and selection projection consumers

This extends verification §7.4 with application-owned components from the public
breadcrumb controller/template, default-slot navigation template and
selection-child controller. It uses no delivered En Rêve elements. See the
[composition contract](../../packages/primitives/docs/projection-consumers.md)
and [actual fixture](recipes.ts).

```sh
EN_EXECUTION_OUTPUT=/absolute/new/run tooling/test-pipeline/with-toolchain.sh npm run test:union -- --pathways=projection-recipes
```

The registered pathway builds prerequisites, extracts verified primitives/styles/
tokens tarballs, strictly compiles against their declarations, bundles from that
isolated installation and runs all three pinned engines. Only locked third-party
dependencies come from the workspace. Preparation rejects workspace source and
any elements-package runtime input. The browser owns a fresh fixture and reserved
loopback port; it never reuses a developer server.

The [receipt](verification-20261002.json) records 36 passing cases (12 per engine):

- Manual and named client breadcrumb roots retain native links, listeners,
  explicit current state, separators, rich-node identity, visibility and order.
  Invalid direct children recover; disconnect releases owned assignments and
  reconnect reflects edits.
- Default-slotted navigation preserves native Tab/Enter, fragment/history and
  canceled activation. Current-location attributes remain author-owned.
- Native radio groups consume rich segmented descriptors, with disabled/hidden
  states, synchronous tentative selection and veto, silent authoritative writes,
  dynamic choices, node/focus retention, invalid-label recovery and cross-host
  projection ownership after reconnect.
- Narrow 320px RTL content at enlarged type remains readable in native order.

The first run stopped on an ambiguous diagnostic locator: native `output` also
has status semantics. The corrected test scopes the diagnostic to its fieldset;
the complete second run passes. This was a fixture assertion correction, not a
component defect. Source, declaration, package and bundle identities are retained.

Four more inventory entries receive **named-scenario** qualification, bringing
that inventory to 34/110. This does not claim every method, every selection-child
kind or every owning assertion. No helper implementation changed. Client named
roots do not establish SSR/hydration; physical IME, native AT speech, retail Safari,
other platform conditions, remaining public layers and separate-owner review stay
open. Existing receipts remain immutable; collection-pathway source snapshots
retain the exact older registry/inventory inputs when those files evolve.
