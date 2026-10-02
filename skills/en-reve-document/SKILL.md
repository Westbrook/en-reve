---
name: en-reve-document
description: Write or update En Reve component documentation, runnable examples, migrations and machine-readable contract delivery. Use when documenting the library or its integration recipes; generated metadata alone is not sufficient behavioral documentation.
---

# Document En Reve

## Responsibility

Own: User/developer/designer guidance, runnable example presentation, migrations and contract delivery.

Do not redesign public APIs, implement runtime features, certify accessibility or publish a release as a side effect of documenting them. Route an exposed defect to its owning skill.

Load another skill only when that separate responsibility is needed for the user's
request. References provide contracts; they are not an instruction to execute
another entire workflow.


Read the affected component's README, public declaration/definition and example,
then `apps/docs/src/api-reference/README.md`, `apps/docs/src/api-example/README.md`
and `plans/experience.md`. For a cross-cutting guide use the maintained handbook
at `apps/docs/guides.html`; do not create a competing catalog or overwrite
historical implementation checkpoints with current claims.

## Explain what consumers need to know

Document purpose and when a native recipe is simpler; the actual semantic owner;
attributes versus properties; types/defaults and output-only attributes; events
with detail types, cancellation and timing; authored slots and restrictions;
documented Parts/custom properties; explicit imports and generated/authored child
registration. Omit artificial API categories that do not apply.

Explain draft/proposal/result ownership, async failure/recovery, focus and keyboard
behavior, localization/direction and the limits of evidence. A displayed loading
state is not a completed request; a candidate preview is not adoption. Include
migration guidance for removed or changed contracts even when package versions
have not advanced. Link the owning family and a real workflow to teach transfer.

Keep the four audiences useful without a persona gate: ordinary usage and
recovery first, developer composition and contracts, designer customization and
scope effects, then precise machine retrieval. User-facing examples should not
expose test-harness or implementation details as product controls unless they
help the actual example task. Put simulation controls and source behind clear
review affordances.

## Keep examples and facts executable

Prefer the existing authored example module and generator so the displayed source
is the running example. Show selective public imports, native stylesheet URLs or
bundler CSS setup, and actual event handlers. State which callbacks/services the
application supplies. Do not present undefined application symbols as a complete
standalone program. Do not teach private deep imports or shadow-class styling.

Generate API facts through the maintained metadata pipeline; read
`tooling/metadata/README.md` and check existing artifact freshness before
regenerating. Keep CEM, receipt, public type snapshot and graph together. Review
semantic changes rather than accepting generated churn. CEM cannot infer intent,
manual accessibility, CSS consequences or transport success.

Portable skills live under `skills/`. Their explicit catalog is in
`apps/docs/scripts/prepare-guides.mjs`; the preparation pipeline copies exact
bytes and generates `/guides/contract-index.json` digests. Add a new skill to the
catalog and handbook together. Do not hand-edit the generated public copies or
claim installation into a reader's personal environment.

## Verify and hand off

Use `apps/docs/tests/README.md` and the existing production-page runner. Verify
changed internal links, fragments, rendered example behavior, copied source,
no-JavaScript readability where supplied, and narrow/keyboard delivery as relevant.
Preserve `?progress-report` only on the existing Developer UI links; the target is
trusted configuration, never arbitrary query data. Report state stays outside
the product runtime.

Version evidence and retain exact limitations. Source links to GitHub main are
mutable; freeze a commit for a release decision. Updating text does not rerun
historical browser/manual checks. Publish only within the user's existing scope,
using the established source/export/site workflow, and report whether source,
build and deployment actually match.
