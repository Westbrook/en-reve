# Theme hierarchy and expressive customization

**Historical audit, reconciled September 19, 2026.** Original evidence below describes the audited revision. Each finding now has a current disposition; use the [follow-up plan](#theme-decisions-follow-up-implementation-september-19-2026) for remaining work.

Documentation-only source audit, 2026-09-18. This extends [the customization audit](styles.md) with the requested system → feature group → concept → scoped-instance model. Recommendations below are proposed decisions, not accepted API changes. No runtime files, generated assets, themes, builds, or browser tests were changed or run for this audit.

The existing system can already author complete named themes, independent light/dark branches, density presets, family overrides and local CSS customization. Its weakest point is the contract between those levels: family membership, precedence, state coverage and managed-editor coverage are uneven. Cleanup should make those relationships explicit before using three strongly divergent themes to test expressive range.

## The model that exists

These are separate axes, rather than four nested CSS selector levels:

| Axis | Current representation | Evidence and limit |
| --- | --- | --- |
| Design-system identity | Arbitrary named `resolveTheme({name, source, pins})` result | `packages/tokens/src/theme.ts:10-23` overlays the base and resolves the graph; `:35-37` records source/context/compiler identity. Different identities can vary more than color. |
| Appearance | Explicit light/dark branches; optional system-responsive pair | `packages/tokens/src/theme-pair.ts:15-30` requires the same token schema/compiler/density, but does not require the same values, aliases or pins. `:55-64,75-83` switches differing non-colors and optional masks as well as colors. “System theme” should distinguish whole-library identity from OS appearance. |
| Density and visual size | Density sets packing/baseline dimensions; each theme carries absolute small/medium/large role outputs | `packages/tokens/src/source.ts:39-51,104-107`; `packages/tokens/src/sizing.ts:3-10`. Size selection is separate from appearance and density. |
| Concept | Semantic token namespaces such as `color.*`, `radius.*`, `space.*`, `font.*`, `focus.*` | `packages/tokens/src/source.ts:22-108`. A concept can cross several family names; it is not necessarily one scalar. |
| Feature family | Some managed `component.<family>.*` tokens plus a larger optional CSS-hook surface | `packages/tokens/src/source.ts:109-193`; `packages/tokens/src/overrides.ts:2-53`. The word `component` includes shared patterns such as option rows, not only individual custom elements. |
| Scope | A generated full boundary, selected-token partial boundary, inherited local properties, or a public Part rule | `packages/tokens/src/css.ts:6-31`; `packages/tokens/README.md:19-23`. Scope controls where a value applies; fallback order controls which of several different properties wins at that place. |

The canonical model should retain this separation. A useful authoring view is **theme identity → feature group → concept/state → property**, with scope selected independently. The same token can appear in several views without acquiring several competing CSS names.

### Actual dependency paths

```text
palette.accent
├─ color.brand → color.on-brand recipe
└─ palette.action → color.action
   ├─ color.action-hover / action-pressed recipes
   ├─ color.on-action recipe
   └─ color.action-text → color.link

rhythm.base → space.<step> → density-selected semantic spacing roles
semantic size/radius/spacing/font base + size scale → absolute sized outputs
selected sized output → local stylesheet fallback → optional family pin
```

The color relationships are authored in `packages/tokens/src/source.ts:26-35` and `packages/tokens/src/recipes.ts:40-44`; rhythm/size relationships are in `packages/tokens/src/recipes.ts:26-38`. Typed pins take precedence over recipes and aliases before downstream evaluation (`packages/tokens/src/graph.ts:68-90`). An explicit source overlay at a recipe output or any `component.*` path becomes a pin (`packages/tokens/src/theme.ts:17-23`).

Aliases preserve `var()` references, recipes with a CSS implementation emit that expression, and other recipes emit evaluated literals (`packages/tokens/src/graph.ts:99-105`). In particular, the action-color recipes have no CSS implementation (`packages/tokens/src/recipes.ts:40-44`). A CSS-only accent seed change cannot reproduce a resolved complete color theme. A descendant base change also does not rederive inherited aliases/sized outputs; the documented route is a complete graph boundary when dependants must change together (`packages/tokens/README.md:99,138-140`).

## Managed tokens and CSS hooks are different capabilities

A **managed token** has an ID in the resolved graph and receives an editor descriptor through `managedEditors` (`packages/tokens/src/admin.ts:24-29,81`). Its value participates in typed validation, pin/restore, candidate changes and dependency export. A **CSS-only public hook** can still be supported and resettable without having any of those managed capabilities. A private/mechanical input is neither category.

| Surface | Managed token today | CSS-only public hook today | Consequence |
| --- | --- | --- | --- |
| System color/geometry | `color.action`, `radius.control`, `space.control-inline`, etc. | — | Broad coordinated changes have typed graph support. |
| Button geometry/paint | `component.button.background`, `.color`, `.radius`, `.inline-padding` | `--en-button-border-color` | Button border customization is available in CSS but not as a shipped managed token. |
| Input geometry/paint | `component.input.background`, `.color`, `.inline-padding` | Shared `--en-control-radius`, `--en-control-border-color`, `--en-field-gap` | There is no shipped `component.input.radius` or input-specific radius hook. A field-corner change uses the broader shared hook, semantic role or a Part. |
| Shared controls | Semantic size/spacing/radius roles | `--en-control-background`, `--en-control-color`, `--en-control-border-color`, `--en-control-radius`, `--en-control-min-size`, `--en-control-inline-padding` | The user-facing “shared” customization group is less capable in the managed editor than several leaf families. |
| Focus | Shared focus roles and button/input/option/overlay family roles | — for the listed family overrides | This is a comparatively complete concept/family hierarchy. |
| Option states | `component.option.rest/hover/active/pressed/selected/disabled-{background,color}` | Broad `--en-option-background`, `--en-option-color` | State refinement is managed while broad all-state paint is CSS-only. |
| Layout/surfaces | E.g. `component.card.background`, semantic `radius.container`/`space.panel` | `--en-surface-*`, `--en-stack-gap`, `--en-cluster-gap`, `--en-grid-gap` | A broad surface/layout look often requires a CSS companion to a managed candidate. |
| Mechanical state | No theme token by design | Not a theme hook: `--en-progress-value`, `--en-split-ratio`, private popup coordinates | These must remain outside visual theme authoring. |

Evidence: managed component definitions are in `packages/tokens/src/source.ts:109-110,139-177`; CSS registry entries are at `packages/tokens/src/overrides.ts:19-44`; mechanical classification is at `packages/styles/src/metadata.ts:4-5`. `component.` is stripped when making a CSS name (`packages/tokens/src/value.ts:18-20`), so an ordinary `--en-*` spelling does not establish whether a property is managed.

Optional managed component tokens also have two meanings to display truthfully. Their resolved graph values provide a typed default/editor value, but unpinned aliases emit `initial` in a full theme so the stylesheet can choose its contextual fallback (`packages/tokens/src/css.ts:14-19`). A shown resolved value is therefore not proof of the component's rendered value. Explicit literals and pins are emitted, including literal component defaults; do not describe every unpinned component token as automatically unset.

## HIER-01. The shared-to-family hierarchy is property-dependent

**Current disposition — Implemented:** Family refinements now precede shared defaults; compatibility is documented. See [THEME-02](#THEME-02). The following is retained original evidence.

**Classification: deliberate existing compatibility rules plus a normalization decision; high priority for the new hierarchy.**

Current precedence, highest first:

| Property/use | Actual fallback chain |
| --- | --- |
| Text-input background | `--en-control-background` → `--en-input-background` → semantic surface |
| Text-input color | `--en-control-color` → `--en-input-color` → semantic text |
| Text-button/input inline padding | `--en-control-inline-padding` → button/input family padding → selected semantic inline padding |
| Ordinary button radius | `--en-button-radius` → selected semantic control radius |
| Ordinary input radius | `--en-control-radius` → selected semantic control radius |
| Option-list radius | `--en-option-list-radius` → `--en-overlay-radius` → selected semantic container radius |
| Button/input/option/overlay focus color | family focus color → shared semantic focus color |

Evidence: `packages/styles/src/controls.ts:13,33-36`; `packages/styles/src/internal/button-rules.ts:5,16-19`; `packages/styles/src/internal/control-shared.ts:18`; `packages/styles/src/combobox.ts:8`; `packages/styles/src/internal/focus-core.ts:19-29`. Button rules run after the shared surface rules (`packages/styles/src/buttons.ts:9-11`), so a shared control-radius override does not survive on an ordinary `.en-button`.

The broad input/inline-padding precedence is documented intent, not an undiscovered implementation defect (`packages/styles/README.md:128-132`; `packages/styles/src/controls.ts:31-32`). Nevertheless, it prevents a uniform mental model in which a family exception refines a shared default. Even a locally authored `--en-input-background` loses while a different inherited `--en-control-background` remains set: CSS specificity cannot reorder a `var()` fallback chain.

**Proposed canonical decision:** Use family → shared group → semantic role for new normal default hooks; define family membership per concept. Decide explicitly whether existing `--en-control-*` names retain their documented “broad override” authority or migrate to shared defaults. Prefer an additive shared-default layer if compatibility is required, then retire the exceptional old precedence deliberately. Do not silently swap existing chains.

**Tradeoff:** Keeping old authority is compatible but leaves two categories to explain. Reordering is simpler long term but changes consumers that use broad pins to override many specialized surfaces. Broad paint should not force filled actions and neutral fields to share a surface merely because both are interactive; broad geometry can reasonably span them.

## HIER-02. Radius, color and hover need concept views, not one universal value

**Current disposition — Implemented with deliberate exceptions:** Family membership and specialized circular/range geometry are explicit. See [THEME-02](#THEME-02). The following is retained original evidence.

**Classification: authoring-model gap; high priority.**

Radius already has independent `control`, `container`, `dialog`, `choice` and `pill` roles (`packages/tokens/src/source.ts:59-61`), several sized outputs (`packages/tokens/src/sizing.ts:41-44`), and independent family pins. There is no radius-only multiplier or shared parent radius token tying those roles together; the geometry size scale also changes non-radius dimensions. Color correctly distinguishes brand identity, filled action, action text and links (`packages/tokens/src/source.ts:26-35`). Hover spans action recipes, option state paint, presence paint and calendar tint (`packages/tokens/src/source.ts:35,111-112,148-149,184-185`).

Today the Theme Review UI provides four shortcuts and text search of token ID/description, followed by a token selector (`apps/docs/src/theme-review/app.ts:22,278-282,360-364`). The typed descriptor has kind, choices, units and compatible aliases but no feature-group/concept/state metadata (`packages/tokens/src/types.ts:65-76`). Searching “radius” is useful discovery, not a declared complete concept group.

**Proposed canonical decision:** Introduce explicit, many-to-many authoring metadata for `family`, `concept`, `state`, `variant`, affected surfaces and sizing behavior. A “Radius” view should show the system roles, derived size outputs, family exceptions and pins together. A coordinated radius operation should update a declared role set with an explicit preserve/replace-pins policy; it should preserve circular controls and documented concentric relationships. “Hover” should expose the affected state roles across families while keeping their distinct semantic purposes.

**Tradeoff:** Metadata and coordinated operations require maintenance but avoid a combinatorial token namespace. A universal `--en-radius` or `--en-hover-color` is simpler only by discarding real role distinctions. Existing same-type aliases can deliberately coordinate compatible values, but a number-type alias alone cannot certify semantic compatibility; current alias choices are filtered by type and cycles (`packages/tokens/src/admin.ts:27-28`).

## HIER-03. Button states are less expressive than option states

**Current disposition — Implemented:** Six additive button state hooks preserve independent field, option and focus semantics. See [THEME-03](#THEME-03). The following is retained original evidence.

**Classification: missing family capability, not merely missing metadata; high priority.**

`--en-button-background` supplies rest, hover and pressed fills (`packages/styles/src/internal/button-rules.ts:18,29-30`). It also overrides secondary and danger fills; ghost rest is explicitly `none` while its hover consumes the hook (`:31-50`). A broad button-background pin can therefore flatten state and variant differences, but not in every state. Button hover-color/pressed-color/background family refinements do not exist in the source or hook registry.

Options expose managed rest/hover/active/pressed/selected/disabled background and color hooks (`packages/tokens/src/source.ts:146-157`), with state-specific values ahead of broad all-state hooks and a defined combined-state order (`packages/styles/src/internal/option-paint.ts:33-64`). Shared focus likewise has separate global and family properties (`packages/styles/src/internal/focus-core.ts:19-29`). These are useful models to reuse deliberately. Calendar's partial option-state adoption remains the separate CSS-07 finding in [styles.md](styles.md).

**Proposed canonical decision:** Preserve the meaning of broad existing button paint, add explicit rest/hover/pressed refinements, and define variant coverage before adding variant-specific hooks. State refinements should beat broad family paint. Keep disabled, focus, selected and forced-color semantics explicit; hover must not stand in for those states. A group-wide hover authoring operation can change a documented collection of state roles without inventing a single fill suitable for every control.

**Tradeoff:** State hooks increase the public surface, but they allow a theme to retain interaction feedback without per-element Part selectors. Fully multiplying every family × variant × state × property would create unnecessary API volume; introduce properties justified by the three-theme review and keep structural changes on documented Parts.

## HIER-04. The managed surface should include the main shared knobs

**Current disposition — Implemented:** Twelve control/surface hooks have optional typed and managed authoring. See [THEME-05](#THEME-05). The following is retained original evidence.

**Classification: coverage/product decision; high priority.**

The table above shows that shared controls and general surfaces have important CSS-only knobs while selected leaf families have managed controls. Registered hooks are absent from `managedEditors` unless their CSS names correspond to source tokens, because descriptors iterate only `theme.tokens` (`packages/tokens/src/admin.ts:81`). `ThemeCSSOptions.componentOverrides` adds reset names, not typed values or editors (`packages/tokens/src/types.ts:77-86`; `packages/tokens/src/css.ts:17-19`).

**Proposed canonical decision:** Promote the agreed stable shared and family customization knobs into the typed source where managed authoring is intended. Keep explicitly code-only hooks documented with that status; retain private/mechanical inputs outside both. Minimum review candidates are shared control radius/padding/minimums/borders, input-specific radius/border exceptions, button border and state paint, and broad surface geometry. Settle HIER-01 before promoting hooks whose precedence is still ambiguous.

**Tradeoff:** Promotion improves candidate portability, pin restoration and editor parity, but every promoted token becomes a versioned type/default/precedence contract. Some CSS concepts such as `auto`, arbitrary CSS expressions or selector-dependent layout cannot fit the current nine token types without an explicit schema decision (`packages/tokens/src/types.ts:1-5`; `packages/tokens/src/value.ts:22-39`). Do not silently make the managed editor an unrestricted CSS-string editor.

## HIER-05. Graph dependencies do not describe the whole rendered theme

**Current disposition — Implemented with explicit boundary:** Registry/source evidence complements the graph; rendered Parts reachability is follow-up API-10 work. See [THEME-01](#THEME-01). The following is retained original evidence.

**Classification: dependency/meaning gap; medium priority, required before narrow impact claims.**

`affectedTokens` traverses the token graph's active or potential dependencies (`packages/tokens/src/graph.ts:114-121`). It does not model CSS fallback consumers, geometry relationships or selectors. For example, the managed `component.option.radius` source aliases `radius.control` (`packages/tokens/src/source.ts:162`), but an unpinned combobox option actually derives its corners from effective option-list radius minus padding and border (`packages/styles/src/combobox.ts:8-9,92-93`). Updating list radius can change a rendered row without changing that row token's resolved source value.

The docs already state that component impact mapping is incomplete and all cases must be reviewed (`apps/docs/src/theme-review/app.ts:378`). This remains an honest limitation, not a defect in the graph's stated token-only contract.

**Proposed canonical decision:** Add recipe-consumer metadata alongside graph dependencies: ordered fallback inputs, local derived relationships, state/variant selectors, public Parts and affected rendered surfaces. Show “token default,” “effective fallback” and “explicit pin” separately where they differ. Derive/check the public hook inventory and reset registry from the same declaration set; defer the reset-policy details to CSS-01 and the scope audit.

**Tradeoff:** A complete CSS semantic graph is expensive and unnecessary. Start with declarations for shipped shared recipes plus a source-backed check that every public hook has a classification and consumer. Until that coverage is complete, full-library review remains required for divergent themes.

## HIER-06. Density, size and pins need explicit interaction rules

**Current disposition — Implemented:** Absolute size, density and fixed pins have documented precedence and tests. See [THEME-02](#THEME-02). The following is retained original evidence.

**Classification: established semantics plus cross-family coupling to surface; medium priority.**

Density changes spacing aliases and control minima while retaining separate block padding and typography (`packages/tokens/src/source.ts:39-51,73-85`). The finite role map plus recipes generate absolute sizes; UI/input/metadata type scaling never reduces the base text size (`packages/tokens/src/sizing.ts:3-10`; `packages/tokens/src/recipes.ts:27-37`). A family pin bypasses the selected-size fallback, so one explicit button radius or padding applies across sizes (`packages/styles/src/internal/values.ts:16-24`; `packages/styles/README.md:147-151`). That fixed-pin meaning is intentional.

The comparable-control height envelope is also larger than a density baseline when content/targets require it. It includes both UI/input line boxes, shared block padding, border and segmented frame reserve (`packages/styles/src/internal/control-size.ts:14-26`). Consequently a `component.segmented-control.frame-inset` pin on a shared scope can grow ordinary text buttons and inputs, as explicitly documented (`packages/styles/README.md:140-145`), even though its name appears component-local.

**Proposed canonical decision:** Preserve independent density/size/type/target axes and fixed-size pin behavior. Declare whether each geometry hook is a minimum, preferred size, exact override or relative input. Surface the segmented inset's shared alignment effect; consider naming the shared alignment reserve separately while retaining a local segmented inset. Only add family size-specific roles if divergent themes demonstrate a need that existing semantic outputs and fixed family pins cannot meet.

**Tradeoff:** Independent inputs explain more than a single “compactness” slider and preserve readable content/target constraints. Separating the alignment reserve could reduce surprising family coupling but must preserve the current aligned defaults and target budget. Existing editor/color size parity defects remain CSS-02/05/06, not new findings here.

## Later three-theme validation

The reconciled cross-audit choices belong in [the theme decision register](theme-decisions.md). The findings above supply evidence and tradeoffs for that review; they do not approve implementation.

Three strongly divergent themes should be a later stress test of the agreed contract. Give each a complete authored identity with independent light/dark branches where required; use the same token schema and shared density within each appearance pair (`packages/tokens/src/theme-pair.ts:19-26`). Do not use three accent swaps as proof of range. Vary typography, geometry, density, surface/border/elevation treatment and interaction-state paint enough to exercise these decisions. Exact art direction remains for that later phase.

The review matrix should include whole-system replacement, button-only and input-only customization, a concept-wide radius edit with deliberate circular exceptions, family hover refinements, a scoped family exception under a broader theme, and nested full/partial boundaries. Inspect actual states and rendered geometry across shipped families, especially the newer editor, calendar and color surfaces already identified in [styles.md](styles.md). Record any required CSS companion or Part override as an expressiveness requirement rather than quietly hiding it in a theme file.

This audit establishes source-backed capability and decision points. It does not claim the three themes exist, that proposed behavior is implemented, or that browser behavior and visual acceptance have been verified.
