# Inspired theme component review — October 3, 2026

## Scope and acceptance

Review Spectrum, Fluent 2, Astryx, shadcn/ui (Rhea), Radix Themes and Web Awesome against primary source documentation and implementation. Chakra UI and Holotable are explicitly excluded. Preserve each declared reference identity and disclose differences between a design-system website skin and its product components. Where current source evidence differs from the older mapping, record the change and provenance.

The review covers typography and hierarchy; component density and geometry; control anatomy; variants; rest, hover, held, selected, invalid and disabled feedback; focus; elevation and surfaces; motion; native helper and custom-element coverage; light/dark/auto appearances; exported companions; nested theme isolation; reduced motion, forced colors, RTL and enlarged text. A color match alone does not establish fidelity.

Native semantics, editing ownership, transaction cancellation, focus restoration, target floors, explicit registration and SSR contracts remain En Reve's documented contracts. Themes may embody another system without replacing those behaviors. Components with no source analogue need a coherent adaptation, not a fabricated equivalence claim. Source icons/fonts that are not delivered must remain explicit limitations.

## Current checkpoint

**Implementation is integrated and published as of October 4, 2026.** Review source
`b219a7a6f2a06a0e60e882f6afa9c052657a3ade`, including the hydration availability
repair, was integrated into source-only GitHub history as
`923c4931fa0214cd0e2c9ac8f31fd7093a9ac7da`. This preserves the newer documentation,
consumption skills, performance reader and prior Chakra work. Large historical
acquisition evidence remains local.

Both production builds passed. The [private documentation
Site](https://en-reve-docs.reve-ai-0869.chatgpt.site/showcase?progress-report) is
published from Site commit `63194def954ab4e83a80b720edee3aae18feb988`; the matching
GitHub Pages build is `8d7f5ee14a37829286f544ec1d5deafd456f4128`. The user directed
the source handoff without further verification. Browser and visual qualification
of this integrated candidate therefore remain **unverified**, not passed or
retired. The historical checkpoints below retain their narrower evidence scope.

## Historical authoring checkpoint

**Source correspondence and selected authoring qualification are complete at `eb0efd6f` on the review clone's `main`; current-candidate browser qualification remains pending.** The review covers all six source slider profiles, Web Awesome avatar/disclosure/rating anatomy, inherited OTP invalid Parts, specialized ColorSlider state preservation, and each source's default inline alert/callout profile. The [alert mapping](source-alert.md) distinguishes the six geometries and status palettes from local announcement, content and dismissal contracts. Radix export corrections use finite typed roles rather than unregistered public-hook token mappings; responsive dialogs retain native drawer geometry.

Union-06 at `c93f260f` passed complete browser owners for theme cascade, state paint, public Part reachability, composition, slider, rating, accordion and patterns. It was intentionally stopped during docs composition after finding the Radix export error and missing isolated delivery-probe dependencies. Those results are useful subset evidence, not a passing full qualification. The Radix correction is committed as `1c5ea7fe`; isolated dependencies are installed.

The metadata refresh recorded by `a1f23afb` passed all five postchecks: CEM, public types, public API, lazy delivery and customization ([postcheck receipt](/private/tmp/en-inspired-metadata-after-20261003-03/command/receipt.json)). At that source commit, [authoring-01](/private/tmp/en-inspired-authoring-20261003-01/execution.json) passed all 65 selected owners for the `tokens`, `semantic-types` and `primitives` pathways, including source-alert compiler assertions. After the named-container conversion, [authoring-02](/private/tmp/en-inspired-authoring-20261003-02/execution.json) independently passed all **65 selected owners at `eb0efd6f`**, with **283 Node assertions (198 + 85), zero failed or skipped**, complete semantic type checks and the docs build. Both requested pathway unions are complete; neither receipt claims full-library or browser qualification. The current-candidate browser matrix remains pending.

The [component crosswalk](component-crosswalk.md) covers all **96 public elements, 75 anatomy families and 576 source mappings**, with no unknown classifications. Catalogue, public API and Custom Elements Manifest membership agree. These classifications establish source counterparts and deliberate adaptations, not visual-fidelity scores or feature parity.

The five earlier Fluent unknowns are resolved against official documentation: date/time/calendar map to separately published v8-derived compatibility components using v9 dependencies; charts map to the separate v9 `react-charts` library. Neither becomes an unqualified core-v9 parity claim. Current Web Awesome 3.14 catalogue availability is recorded separately from the pinned 3.13.0 Default theme/palette fixture. Radix Themes remains distinct from unstyled Radix Primitives.

The generic companion engine originated in an **unqualified working-source snapshot**. [shared-engine-input.json](shared-engine-input.json) records its source workspace, capture time and file hashes; no Chakra recipes were copied. That provenance does not itself constitute an upstream or local qualification receipt. The completed authoring results above are separate evidence for the integrated source.

Commit `eb0efd6f` converts all trusted presenter rules to the shared `ctx.style` emitter, using named container style queries and direct rules for matching boundary roots. It replaces the `@scope`/Part delivery path implicated in WebKit rule loss and Firefox boundary leakage. [shared-emitter-reconciliation.json](shared-emitter-reconciliation.json) records the donor source capture, exact file hashes, adopted scope and diagnostic identities. Its status remains an unqualified shared-source reference; synthetic probe observations do not establish production or six-theme fidelity. Chakra recipes, Chakra-only roles, donor generated output and donor validation claims were excluded. Local authoring-02 now qualifies the selected authoring pathways for this conversion; production browser qualification remains pending.

| Source | Prepared implementation visible in current source | Remaining boundary |
| --- | --- | --- |
| Spectrum | Source-size/inherited typography and choices, field border/focus, neutral/error checkbox presentation, checked switch growth, filled-radio anatomy and thin slider rails with sized bordered handles | Coarse platform scaling, full action/variant vocabulary, source fonts/icons and animated tab/overflow behavior remain adaptations or undelivered capabilities. Visible-invalid metadata passed postchecks; current-candidate rendered checks remain pending. |
| Fluent 2 | Field/choice text hierarchy, separate bottom-edge treatment, mixed checkbox square, stateful switch, native helper typography, sectioned dialog, navigation/tab refinements and slider surface rings with coordinated state paint | Website flavor and product anatomy are intentionally combined; compat generations stay explicit. Dialog scale is bounded and local focus/error/scroll ownership remains authoritative. |
| Astryx | Supporting/chip type, composed token press and filled destructive state, sized choices, switch growth/state paint, whole-checkbox hover/held tinting, inset selected-tab underline, field inset depth, raised segments, inverse tooltip, dialog plate/blur and source slider hover/held paint | Dark destructive contrast and the stronger checkbox boundary are adapted; medium geometry supplies the unsupported local large profile. Source dialog timing/travel exceed local bounds; top-navigation vocabulary remains distinct. |
| shadcn Rhea | Filled radios, sized/stateful switches, inverse tooltip, enclosed tabs, card gaps/title type, compact badge/tag/code/keycap, enclosed accordion, padded dialog/popover and slider fill/thumb elevation | Source title/description grouping, absolute close action, mobile footer ordering, native slider endpoint travel and toast choreography remain composition adaptations. Immediate accordion disclosure and protected targets preserve local behavior. |
| Radix Themes | Held-tab/soft-action corrections, source type and geometry, stateful switch/radio, segments/tabs, inverse tooltip, dialog/popover/menu/progress, translucent card, code and layered keycap presentations and filled sliders with source-sized handles/rings | Full variant axes, moving indicators, source inset/leading trim, exact menu gutters and native slider endpoint/segment-border placement remain adaptations. Material blur has explicit fallbacks. |
| Web Awesome | Multiline leading and font-relative padding for custom/native textareas, source tab insets, independent switch state paint, source-sized filled sliders, diameter-relative avatar initials, individually outlined Details and source-colored/sized rating stars, preserving prior joined segments/link/action recipes | Local text/diameter profiles and protected rating targets differ from source sizing; tab insets map default-size source values to rem. Native radio/no-rating semantics, source icon artwork, immediate disclosure and toast choreography remain explicit adaptations. No native fixture or historical benchmark was refreshed. |

Shared source corrections also cover nearest-boundary named-container companions, omitted-appearance Auto handling, `en-toggle-button` and omitted-variant defaults, the expanded field inventory, code-family consumption, interval-track sizing and explicit native range value-to-paint synchronization. Native range helpers initialize and update presentation through a documented pure import; custom sliders own that synchronization, including SSR and canceled changes. Their selected authoring assertions passed at `eb0efd6f`; current-candidate browser and manual acceptance results are not claimed. See [shared delivery](shared-and-additional.md) for the historical baseline findings.

Every full `[data-en-theme]` boundary reserves `--en-theme-companion` in its `container-name` list. Application `container-name` or `container` shorthand declarations must retain that identifier, for example `container-name: app-panel --en-theme-companion`; the generated default does not merge application names automatically. Replacing it can select an outer theme and break isolation. Companion delivery requires custom-property container style queries, sets no `container-type` and adds no size containment. See the [public composition contract](../../packages/tokens/README.md#component-presentation-companions). Exported CSS and nested full boundaries must be qualified with that composition contract intact.

## Remaining qualification

1. Retain the completed metadata, authoring-01 and authoring-02 receipts with their exact source identities. `eb0efd6f` is historical evidence; any resumed qualification must freeze the integrated source and its matching build, rather than presenting old-source results as current. Check existing artifact freshness before any required regeneration.
2. Complete the remaining affected theme/API and browser checks through supported leased entry points, retaining failures and exact source/build identities. Passing the selected authoring union does not establish full-library correctness.
3. Execute the authored [fidelity specification](fidelity-evidence.md) and focused consumer coverage on the pinned Chromium, Firefox and WebKit matrix. Verify native/custom delivery, exported CSS, nesting/Auto, state geometry, invalid/disabled precedence, RTL, text growth, reduced motion and supported forced-color coverage.
4. Record commands, results, screenshots, source adaptations and actual commit identities in this review and the independent Progress Report. A representative suite does not establish every source variant, manual assistive-technology coverage or user review acceptance.

## Workspace and source audits

The implementation originated in `/private/tmp/en-reve-inspired-review-20261003`, a separate local clone on `main` based on `df59c9e81b5a370a08f0f547e49540506346e779`. Source-only integration and publication were completed through `/private/tmp/en-consumption-discovery-20261004` under the user's standing commit/push/publication instruction. The original dirty `codex/theme-api-adoption` checkout and historical evidence are preserved. Future work must inspect current ownership and GitHub `main` before continuing.

The independent [Progress Report](http://127.0.0.1:4177) retains iteration `inspired-deep-review-20261003` and its handoff separately from other ongoing work. Only the user can mark a review checkpoint reviewed.

- [Spectrum](spectrum.md)
- [Fluent 2](fluent.md)
- [Astryx](astryx.md)
- [shadcn/ui Rhea](shadcn.md)
- [Radix Themes](radix.md)
- [Shared coverage and Web Awesome](shared-and-additional.md)
- [Complete component crosswalk](component-crosswalk.md)
- [Authored fidelity verification](fidelity-evidence.md)

Source-audit findings against `df59c9e8` remain historical baseline observations; their prepared follow-ups are not automatically passing runtime evidence. Final qualification must identify actual source/build and execution receipts.
