---
name: en-reve-theme
description: Customize En Reve themes, component groups, scoped appearance, CSS Parts and token relationships. Use for En Reve styling and theme authoring; avoid treating internal shadow markup or a raw accent variable as the theme API.
---

# Theme En Reve

## Responsibility

Own: Token relationships, appearance/scoping, group/component properties and candidate theme authoring.

Runtime behavior belongs to en-reve-component, application architecture to en-reve-app, and acceptance testing to the relevant test skill. A theme edit does not authorize adoption or baseline promotion.

Load another skill only when that separate responsibility is needed for the user's
request. References provide contracts; they are not an instruction to execute
another entire workflow.


Start from the installed `@en-reve/tokens` and `@en-reve/styles` versions and
matching guides. In the repository, read `packages/tokens/README.md` for the
selected operation and `packages/styles/README.md` for the consuming surface.
The [designer handbook](https://en-reve-docs.reve-ai-0869.chatgpt.site/guides.html#designers)
links the runnable customization and Theme Review examples.

## Pick the appropriate boundary

| Need | Surface |
| --- | --- |
| Coordinated palette, derived states and typography | Pure token resolver and a full emitted theme |
| Shared input/control or surface treatment | Documented group `--en-*` roles at an application scope |
| One component family or instance | Optional documented component property, then CSS Part for ordinary layout/style |
| Rich authored label/body/attachment content | Application CSS on slotted nodes |
| Application-owned native recipe | Explicit reusable style family and its documented semantic contract |

A full theme redeclares its graph and resets the finite registry of optional
component pins. A partial override preserves unspecified pins. Changing a raw
palette variable on a descendant does not recompute inherited aliases or generated
contrast/hover colors. Use `resolveTheme` and full emission for coordinated color
changes, or the dependency-aware `createThemePatchPlan` / `emitThemePatchCSS`
contract for an intentional partial patch. Read the signatures before calling.

Use `default.css` for system-responsive root appearance. Independent named
light/dark scopes load their named CSS after the default sheet. Generated full
single themes can request `colorScheme: true`; paired output owns its appearance
scheme. A portal/top-layer surface needs the intended scope applied at its actual
inheritance boundary; DOM ancestry and overlay positioning are different concerns.
Density and component size are separate. Size defaults to medium; explicit
`size="inherit"` selects the documented inherited size policy.

`default.css` already installs document-level `@property` registrations.
Custom emitters can load `properties.css` once or emit registrations explicitly.
Do not register every optional override with a concrete initial value: it can
mask the intended fallback chain. Preserve the library's registration/inheritance
policy and unregistered-browser fallback. `@property` does not recalculate token
recipes and is not a substitute for the compiler.

## Author and review

Use the local Theme Review page for candidate edits, coordinated/pinned value
inspection, undo and exact-build export/reopen. Exported previews are not adopted
source or passing test results. Imported candidate CSS is not executed; the
review model replays and validates recorded operations against its base.

For source changes, edit token inputs and generators. If a style is listed in
`packages/styles/css-authoring.json`, edit its `src/css/` source and regenerate
adapters/portable CSS through the existing build. The authoring recipe syntax is
build-time tooling, not a requirement that browsers implement CSS `@function` or
`@mixin`. Do not patch emitted files or create a second handwritten CSS copy.

Validate the changed boundary: full vs partial scope, light/dark, selected sizes,
hover-capable vs touch, keyboard focus, forced colors, reduced motion, text
expansion and representative consumers. Preserve interaction target floors and
visible focus. Use balanced hover treatments; gate hover-only rules on
`@media (hover: hover)`. Numeric text should retain tabular figures when applicable.
Avoid claiming contrast conformance from a palette alone.

Retain exact base/candidate identities and source-linked evidence. Use the existing
release/candidate workflow for review; do not silently promote visual baselines,
adopt a candidate, publish a site or change sharing policy. Manual platform/AT
coverage remains separate from generated CSS and automated browser checks.
