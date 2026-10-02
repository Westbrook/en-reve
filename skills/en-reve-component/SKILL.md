---
name: en-reve-component
description: Implement or extend an En Reve library component and its reusable layers, registration, public API and delivery contracts. Use for library authoring, not ordinary application composition with existing components.
---

# Write an En Reve component

## Responsibility

Own: Implementation, reusable layers, definitions and public contracts.

Application integration belongs to en-reve-consume; workflow orchestration to en-reve-app; theme design to en-reve-theme. Use testing/documentation skills only for the corresponding requested work.

Load another skill only when that separate responsibility is needed for the user's
request. References provide contracts; they are not an instruction to execute
another entire workflow.


Locate the En Reve source checkout and read its `AGENTS.md`, the nearest component
README, and the relevant package contract. If only installed packages are
available, request the source checkout before changing library internals.
Preserve unrelated working changes and existing authored/generated boundaries.

## Establish the actual public contract

Identify the user outcome, native semantic owner, state ownership, slot content,
label/description behavior, keyboard flow and application responsibilities. Look
for the nearest existing family before adding a new attribute, event, Part or
controller. Compare its definition and matching CEM/public graph; do not infer
an API from internal classes or a screenshot. Native semantic recipes may be
better than a new custom element for tables, headings and document content.

Place token rules in `packages/tokens`, shared styles in `packages/styles`, pure
state/interactions/templates in `packages/primitives`, the custom element in
`packages/elements`, rendering/adoption in `packages/ssr`, and examples in
`apps/docs`. Extract shared code only when it expresses the same contract;
do not impose a common event on capabilities with different semantics.

## Implement without breaking delivery

- Keep class, definition, catalog and barrel imports side-effect free. Add one
  canonical component definition with generated-child dependencies; let explicit
  `define/<name>.js` or registry helpers own registration. Authored children keep
  independent registration. Consult `packages/elements/README.md` and
  `SCOPED-REGISTRIES.md` before changing registry/loading behavior.
- Follow the owning primitive's synchronous `dispatchChange` transaction:
  tentative public/Signals/form state is observable during dispatch; cancellation
  rolls back only still-owned staging. Equal authoritative writes and accepted
  nested transactions can supersede rollback. Programmatic writes stay silent.
  Read `packages/primitives/README.md` for intentional event exceptions.
- Let `EditingController` own live native input values. Do not add a competing
  Lit `.value` binding or reconstruct controls during ordinary editing. Preserve
  composition, selection, native reset/restoration and pre-upgrade drafts.
- Keep server state request-local and pure imports free of DOM setup. Install
  environment shims explicitly in the rendering entrypoint, not as an incidental
  component import. Preserve server/client initial identity and documented
  hydration adoption in `packages/ssr/README.md`.
- Expose deliberate CSS Parts, slots and optional `--en-*` overrides. Do not
  initialize optional component pins on the host or bypass token fallback order.
  Edit `src/css/` for styles covered by `packages/styles/css-authoring.json`, then
  regenerate through the package build. Preserve touch hover gating, focus,
  target floors, forced colors and explicit size inheritance.

Clean up observers, controllers, subscriptions and listeners at their owning
lifecycle boundaries. Support reconnection without duplicate delivery. Collection
updates need stable key validation, focus recovery and a documented wrapper/renderer
boundary; use the existing collection primitives where semantics match.

## Finish the public surface

Update the component README, declaration comments, canonical definition, supported
exports and runnable example as appropriate. Metadata consumers rely on accurate
attribute/property distinctions, defaults, event detail types, Parts and slots.
Run retained metadata freshness checks before regeneration using
`tooling/metadata/README.md`; then regenerate the sibling artifact set with the
supported commands and inspect semantic differences. Do not hand-edit generated
metadata to make a check pass.

Use `en-reve-test` for functional qualification and `en-reve-accessibility` for
semantic/interaction evidence. For public behavior changes, include a migration
note and the relevant SSR/pure-import/registration checks. Do not increase scope
to a full release, platform acceptance or performance campaign unless required.
Document what changed, how it was verified, remaining limits and exact source.
