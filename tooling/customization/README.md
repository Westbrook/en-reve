# Customization contract coverage

Build tokens and generate the CEM before running `npm run customization`. The
command writes `evidence/coverage.json` and `evidence/coverage.md`, then fails for
unclassified hooks, reset/managed/CEM inconsistencies, unresolved dynamic helper
expressions, or stale review exceptions. `npm run check:customization` recomputes
the inventory and also requires the retained evidence to match. Run the focused
fixture checks with `node --test tooling/customization/customization.test.mjs`.

`packages/tokens/src/customization.ts` is the runtime contract authority. This
tool reads production sources independently so adding a raw `var()` consumer or
an element annotation cannot silently bypass that contract. It scans styles and
elements, excludes tests/fixtures/declarations, follows imported `token`,
`rawToken`, and `override` aliases, and records nested fallback expressions and
source locations. The finite focus-family and size-role helpers are expanded
from their authored domains; toast variants come from the literal mapped array.
Unknown expressions require a deliberate extractor update.

The metadata generator enriches existing CEM `cssProperties` with the registry's
classification and authoring support under `x-en-reve-customization`. It does not
invent component annotations. The inventory lists Parts on components declaring
a hook as component context, without claiming that the hook affects every Part.
The CEM receipt records both the resolved registry digest and the registry,
source-token and sizing source hashes, so either contract or source drift makes
the retained metadata stale.

Source references are evidence of lexical consumption, not proof that a property
changes a rendered component. A public-property transfer to a destination with
no reader is reported separately. THEME-06 repaired the former editor toolbar gap.
General cascade reach, shadow forwarding, state behavior and accessibility still
need browser tests. Semantic graph inputs may have no direct stylesheet reader.

`reviewed-exceptions.mjs` contains exact finding/name/source matches with written
reasons. The unsupported consumer names and disconnected toolbar transfer were
repaired in THEME-06. Remaining exceptions describe annotation applicability,
including CSS-only recipes and the separately documented tab paint hooks.
Exceptions do not confer supported API status. New mismatches fail; resolved or
moved exceptions also fail until the review record is updated. No family prefix
or unlimited source list is silently ignored.

When adding a supported hook, update its runtime registry record and consumer,
add an element annotation only when the component supports it, regenerate
metadata/evidence, and inspect the fallback locations and relevant browser
behavior. Changes to deferred typography or editor behavior belong in their
separate approved scope.

## Rendered Parts coverage

`browser-parts.ts` follows actual `part` and `exportparts` chains on an explicitly
rendered host state. Composition fixtures compare conditional and inherited CEM
promises with reachable Parts and verify real external CSS effects. This catches
subclass replacement drift that lexical hook coverage cannot. Run these checks
with `npm run test:theme`; fixture scope and manual limits are documented in
[the theme regression guide](../theme-proof/README.md).
