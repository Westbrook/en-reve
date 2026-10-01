# Tokens, theme scopes, and managed editing

Status: synchronized with implemented token/style behavior and accepted review-session decisions. `packages/tokens` implements the pure resolver, managed-editor metadata, candidate preparation and review-draft history/replay. The local Theme Review editor, isolated previews and exact-build single/paired JSON export/reopen are implemented; their scoped receipts remain separate from earlier token evidence. Adaptive default CSS now follows system appearance before JavaScript. Full offline review delivery, evidence comparison, adoption integration and remote transport remain unfinished. Current defaults are implementation choices under visual review, not final user acceptance or an accessibility certification. The [package README](../packages/tokens/README.md) and [browser evidence](../packages/tokens/test/browser/README.md) record the bounded delivery surface and checks; [review-session.md](./review-session.md) tracks next work. Visual guidance is in [visual-language.md](./visual-language.md), platform checks in [platform.md](./platform.md).

## 1. Contract and ownership

The [Holotable-inspired theme plan](./holotable-theme.md) is implemented as a
fifth paired recipe: observed dark appearance and explicitly adapted light.
The four existing inspired recipes also carry popup-motion updates. All30
five-theme appearance checks and10 themed-asset checks pass against final build
`edd09329014f`; [matching JSON/CSS artifacts](../artifacts/theme-candidates/asset-followups-edd09329014f/manifest.json)
are ready for local review. Earlier artifacts preserve their original build
identities. Review acknowledgment and adoption remain separate; none of these
five candidates becomes an official adopted theme automatically.

Code is authoritative: checked-in token source, derivation recipes, theme definitions, and their schemas determine the library's official design rules. The local Theme Review page prepares proposed changes to that source through the pure draft/candidate helpers; editing does not write authoritative source. A preview, exported proposal, review acknowledgment, and adopted change are different states.

The library owns its defaults and official named themes. A consuming team owns review of its modifications, including combinations created through CSS overrides. Managed controls narrow the editing space; they do not establish accessibility conformance. Code-level customization remains available beyond their choices. Private component markup remains private.

Use tokens for authored visual decisions: colors, typography, spacing, sizes, radii, borders, elevation, motion, and the parameters governing their relationships. Keep structural mechanisms such as `display: flex`, a focus-management algorithm, or an accessible-name relationship in styles/templates/behavior rather than inventing a public token for every implementation statement. The derived design rules still consume token inputs, and their relationships are documented.

Package ownership and delivery status, aligned with the component architecture:

| Surface | Owner | Contract |
| --- | --- | --- |
| DTCG source/exports, theme definitions, token manifest, CSS, pure resolver | `@en-reve/tokens` | No Lit, custom-element registration, or DOM dependency in the pure entry points. |
| Reusable CSS and per-component/family Lit `CSSResult` exports | `@en-reve/styles` | Consumes the token contract; no state or element registration. |
| Interactive editing and proposal preparation | Private Theme Review documentation page | Descriptor-backed editing for every resolved token, accepted history, isolated full-page comparisons and local single/paired JSON export/reopen are implemented. Complete impact mapping, evidence comparison and adoption remain separate delivery. |
| Adoption transport and authority | Undecided | The proposed local artifact below makes changes reviewable without inventing a remote destination or administrator. |

Do not require consuming applications to run the token compiler. Ship compiled CSS and modular ESM, plus a tested import-map path for optional browser-side utilities. Maintainer generation is a separate task. Published elements do not load the admin, full token manifest, color generator, or review tooling.

## 2. Authoring model and portable exports

The package uses a **bounded subset of the DTCG 2025.10 representation**, not the complete Format, Color or Resolver modules. It supports nested groups/inherited types, whole-token aliases, descriptions, token extensions and deprecation metadata; colors use sRGB and dimensions use `px`/`rem`. JSON Pointers, `$extends`, `$root`, external/property-level references, arbitrary Resolver documents and other color spaces are not implemented. Treat DTCG as a Community Group interoperability format, not a W3C Recommendation or a certification of this package. [DTCG reports](https://www.designtokens.org/tr/2025.10/)

Implemented source layout within the token package:

```text
src/source.ts                         # authoritative initial tokens and contexts
src/recipes.ts, recipe-data.ts         # derivations and coefficients
src/sizing.ts, overrides.ts            # finite size roles and optional CSS overrides
src/graph.ts, theme.ts, color.ts        # pure resolution and diagnostics
src/css.ts                            # full/partial CSS emission
src/admin.ts, candidate.ts             # managed metadata and prepared candidate data
src/review-draft.ts                    # accepted edit history and validated replay
src/theme-pair.ts, review-pair.ts       # independently authored appearance pairs
scripts/generate.mjs                   # maintainer generation
```

This does not imply a separate JSON source tree, JSON-schema catalog or DTCG Resolver implementation. Additional portable-format features need their own implementation and tests before they are advertised.

The graph has three useful layers:

1. **Primitives and system inputs:** palette values, base rhythm, type scale inputs, radius inputs, duration values. These supply reusable data and coordinated controls.
2. **Semantic roles:** `color.canvas`, `color.surface`, `color.text`, `color.text-muted`, `color.brand`, `color.on-brand`, `color.action`, `color.on-action`, spacing roles, focus roles, and motion roles. Component authors consume purpose rather than a palette shade number.
3. **Component override points:** only decisions requiring independent component control, such as `component.button.background`. Their default references a semantic role; the optional CSS override behavior is specified below. Do not duplicate every semantic token for every component.

Canonical token identifiers are case-sensitive paths of lowercase kebab-case segments. For owned tokens, the generator rejects output collisions, including a path collision after flattening to a CSS custom-property name. Semantic paths map predictably: `color.text-muted` becomes `--en-color-text-muted`. Component paths map to `--en-button-background`, without exposing shadow selectors. The manifest records the exact mapping; tooling must not guess it.

Resolved tokens expose type, description, CSS mapping/value/expression, provenance, active/potential token dependencies and applicable recipe/deprecation metadata; managed editor descriptors are generated separately. Per-token owner/source-file and introduced-version fields are not currently exported and remain proposed governance metadata. Component defaults reference semantic tokens. A minimal source entry uses standard DTCG fields:

```json
{
  "color": {
    "text": {
      "$type": "color",
      "$value": "{palette.text}",
      "$description": "Primary readable foreground on ordinary surfaces."
    }
  }
}
```

The generator resolves supported whole-token aliases, validates types and rejects cycles, missing references and unsupported forms. Flatten/rebuild preserves token extension metadata but does not round-trip group metadata; retain the original authored source for editing. Generated artifacts fail deterministically on invalid source rather than falling back silently to a different theme. DTCG dimension values are numeric `px` or `rem` records; arbitrary CSS expressions do not belong in a `dimension` value. [DTCG Format](https://www.designtokens.org/tr/2025.10/format/)

Versioned recipes are ordinary TypeScript source with explicit typed inputs, outputs, and dependency declarations. They produce valid DTCG values for portable exports. Do not put essential arithmetic into a proprietary DTCG extension that another token tool cannot evaluate. Optional provenance metadata may identify the recipe and source inputs because the exported value remains understandable without it.

The implemented output set is:

- `tokens.json` and `themes/<theme-id>.tokens.json`: portable, typed **resolved** snapshots; they do not execute external recipes.
- Generated `source.tokens.json` and exported `sourceTokens`: authored inputs, including aliases; source code and recipes remain authoritative.
- `default.css` and `themes/<theme-id>.css`: directly usable CSS, with no runtime generator requirement.
- `defaults.js`: lightweight literal fallback data with no resolver or DOM dependency; `sizing.js` and `overrides.js` expose finite role metadata.
- `manifest.json`: resolved token metadata plus managed editor descriptors. Component/workflow dependency coverage is a broader review-system responsibility.
- Pure ESM functions including `resolveTheme`, `deriveAccent`, `deriveRhythm`, `emitThemeCSS`, `createCandidate` and `assertCandidateBase`.

Six explicit contexts are generated: light/dark × compact/comfortable/spacious. Comfortable remains the default, preserving `light`/`dark` theme names; other names include density. All three component size outputs ship in every context. Context selection is the package's explicit `mode`/`density` API, not DTCG Resolver execution; additional axes are not implied. [DTCG Resolver](https://www.designtokens.org/tr/2025.10/resolver/)

The generated `default.css` now contains independently resolved light/dark branches
at comfortable density and declares `color-scheme: light dark`. Missing/`auto`
`data-en-appearance` follows system preference; explicit `light`/`dark` selects
the complete branch. The six named stylesheets remain fixed independent scopes
and load after `default.css`. `resolveTheme()`, default JSON snapshots and
`defaults.js` remain deterministic light/comfortable data, not system observers.
Generated full single scopes may opt into `emitThemeCSS(..., {colorScheme: true})`;
the option defaults false for artifact compatibility and is rejected for partial
single scopes. Paired output owns its scheme and full branch selection.

A consumer may author arbitrary valid CSS expressions in application styles through the public properties and parts. Those styles remain code overrides; they are not misrepresented as portable DTCG dimension/color values. A review can carry an explicit override stylesheet alongside the token artifacts when that stylesheet is in scope.

## 3. Resolution, pins, and reproducibility

For one theme/context, resolve in this order:

1. Library primitive/default source.
2. The selected light/dark and density source, followed by the explicit typed `source` overlay. Values overlaid at recipe outputs become pins; arbitrary inherited base-theme chains are not implemented.
3. Theme system-input edits and explicit token overrides, called **pins** in the admin.
4. Construct the effective dependency graph: replace a pinned token's default computation with its pinned literal/reference before evaluating its dependents.
5. Evaluate aliases and versioned recipes in that graph's dependency order.
6. Type/reference validation and generation.

Pins win over the recipe output for the same token. Changing a system input updates unpinned dependents and leaves pins untouched. A pinned output still participates as an input to downstream dependencies: the compiler evaluates the effective graph, not a separate obsolete derivation graph. Reject cyclic pin references. **Restore derived value** removes the pin and recomputes its effective value from the current inputs.

The resolved graph records potential and active token dependencies. A pin can sever an active recipe edge without hiding that relationship from token impact exploration. Declared contrast-pair diagnostics are evaluated separately. Complete rendered contrast, font-asset, component and workflow dependencies still need the broader review tooling; the token graph alone does not prove that closure.

Generation is deterministic for the same source and recipe code, recorded recipe/compiler versions, and theme/context inputs. Stable ordering and canonical serialization feed source/output hashes. A resolved value records whether it is literal, alias-derived, recipe-derived or pinned. Source-file ownership is not currently an exported field. Do not describe CSS used values dependent on a rendered box or root font size as environment-independent DTCG values.

## 4. CSS scope and override contract

Use conventional **populated semantic custom properties** so application CSS can write `color: var(--en-color-text)` without a library helper. Do not register public theme properties with `@property` initially: registration changes initial values, inheritance/type behavior, and global naming commitments. Registration can be evaluated later for a specific property with a measured need.

### Full theme boundaries

An explicitly imported default stylesheet installs defaults on `:where(:root)`. A named or compiled theme applies to `:where([data-en-theme="theme-id"])`, including `html`, any ordinary element, or an individual custom-element host. No theme wrapper custom element is required.

A full boundary declares the complete shared token graph for that theme and context at that element, including the aliases/expressions that need to be evaluated there. It also resets the finite registered optional component override properties to their unregistered `initial` value unless that theme deliberately pins them. Unknown application properties and mechanical data inputs are not automatically reset. This prevents an ancestor's component pin leaking into an independently themed child. Components then use their documented fallback chain.

Changing to a full theme is a **rebase**: its defaults and derivations replace inherited semantic pins. To retain selected overrides, put those explicit pins in the new theme definition or at the new root. Rebase never means copy all computed styles from an ancestor.

### Partial regional and component overrides

An application may set any public property on a focused region or component, with ordinary CSS inheritance. A partial override changes only the properties it declares and retains inherited values for the others. It does not recompute unrelated inherited aliases. For coordinated changes, apply or regenerate a full theme boundary, then add the desired pins.

This distinction is necessary because `var()` references in custom properties are substituted when their containing property is computed. An inherited alias is not a reactive expression evaluated again at every descendant. A direct primitive override without rebasing therefore does not promise automatic downstream recomputation. [CSS custom properties](https://drafts.csswg.org/css-variables-1/)

Example contract, with illustrative values rather than new defaults:

```css
/* Generated theme declarations run at the selected boundary. */
@layer en.tokens {
  :where([data-en-theme="studio"]) {
    --en-rhythm-base: 0.25rem;
    --en-space-2: calc(var(--en-rhythm-base) * 2);
    --en-space-inset: var(--en-space-2);
    --en-button-background: initial;
  }
}

/* A CSS input override at that SAME boundary updates its calc()/alias graph. */
.inspector[data-en-theme="studio"] { --en-rhythm-base: 0.3125rem; }

/* Partial focused override: ordinary inherited value, no implicit rebase. */
.inspector .compact-group { --en-space-inset: 0.25rem; }

/* Component override survives a batch because the public point still exists. */
en-button.save { --en-button-background: var(--en-color-action); }
```

Component styles use optional component properties at consumption:

```css
/* Within the component's private shadow stylesheet. */
[part="control"] {
  background: var(--en-button-background, var(--en-color-action));
}
```

Do not initialize `--en-button-background` to a default on `:host`; that would defeat an inherited application override. The component manifest describes the semantic fallback as the default. Public parts provide additional standard CSS access without making their tag names, ancestry, or private DOM contractual.

### Cascade and encapsulation

- Put generated token defaults/theme maps in the documented `en.tokens` layer with zero-specificity selectors. Do not ship `!important` for theme defaults.
- Application authors may use their own layer order or unlayered overrides. Do not claim a universal “local always wins” rule: cascade origin, importance, encapsulation context, layers, specificity, and inheritance still apply.
- Layers inside a shadow root are not a global coordination mechanism for the containing document. Shared custom properties cross through inheritance; arbitrary document selectors do not pierce shadow roots. `::part()` only exposes the named public surface. [CSS cascade](https://drafts.csswg.org/css-cascade-5/), [Lit theming](https://lit.dev/docs/components/styles/#theming)
- A complete theme rooted on a custom-element host affects inherited values in its shadow tree. Partial overrides on a slotted element follow actual flattened-tree inheritance; do not assume the light-DOM parent and rendered slot have identical context.
- Keep overlays in their logical themed tree where platform mechanisms permit. If another design requires moving content outside that tree, carry the explicit theme identity/context and pins through an adapter. No MutationObserver that continuously clones computed styles.
- Theme CSS sets library properties; it does not reset the application's body typography, margins, or unrelated element styling. Applying a page-wide visual skin is an explicit application choice.

The conformance fixture must cover: parent semantic pin, child full theme, child partial override, a custom-element root, nested components, a slotted child, a public part override, and an overlay. Assert actual rendered/computed values and interaction, not emitted CSS strings.

## 5. Coordinated systems with independent values

The following systems are implemented in the bounded token/style slice; their defaults remain subject to visual and contextual review. Token source owns the current seed values; the visual-language document explains their intent and the reference compositions used to evaluate them. Algorithm versions are recorded separately so their changes can be reviewed and reproduced.

### Accent roles: `accent/v1`

The accepted brand extension separates identity from action: `palette.accent` supplies `color.brand` and the existing `palette.action` alias, which supplies `color.action`. Explicit brand or action pins detach only that branch. `color.on-brand` evaluates the effective brand fill alone; `color.on-action` evaluates the action state family. The wordmark name and tile background both consume `color.brand`, with `color.on-brand` for lettering inside the tile. The shared seed preserves coordinated defaults while allowing independent branding and control colors; no generic primary color role is added.

Inputs are a DTCG seed color, the context's surface color, its direction for emphasis (toward the light or dark endpoint), and explicit role coefficients. Current starting roles are action = seed; hover = 92% seed + 8% emphasis endpoint; pressed = 84% seed + 16% endpoint; subtle surface = 12% seed + 88% surface; accent border = 32% seed + 68% surface. These coefficients are reviewable recipe data, not an accessibility rule or an accepted final palette.

Interpolate opaque inputs in Oklab, convert to sRGB, and use one pinned implementation of CSS Color 4's binary-search/local-MINDE gamut mapping for out-of-gamut results. Ship the resulting sRGB values in initial themes; do not depend on each browser making the same gamut-mapping choice for a screenshot baseline. Store input/output colors as DTCG color objects and preserve full computational precision until the final deterministic serialization. [CSS Color 4 gamut mapping](https://www.w3.org/TR/css-color-4/#binsearch)

The resolver regenerates unpinned accent-role outputs. The sheet preview and local Theme Review accent shortcut consume this same resolver; independently pinned descendants remain unchanged. The resolver recommends an on-action foreground from the theme's declared light/dark text candidates by comparing the minimum measured contrast across normal, hover, and pressed fills. It reports diagnostics when a declared pair does not satisfy the intended checks; it does not silently alter the chosen seed or claim an accessible palette. Any output, including on-action and on-brand text, can be pinned independently. `on-brand` only describes foreground on the brand fill: it does not establish contrast for brand-colored text on a neutral surface. The requested wordmark uses the exact brand color for both the name and tile fill; no seed adjustment silently changes that choice.

CSS-only authors can override a role directly. Replacing a seed custom property does not run this JavaScript color derivation: the supported coordinated path is the pure resolver/admin and its emitted theme CSS. An optional runtime resolver is explicitly imported by an application that wants dynamic user colors; components themselves do not run it. Native `color-mix()` can support separately documented custom recipes after browser verification, without changing what the baseline artifact means.

### Rhythm and density: `rhythm/v1`

Implemented spacing steps multiply the base rhythm by `[0, 0.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 16]`. Their path segments are respectively `0`, `0-5`, `1`, `1-5`, `2`, `3`, `4`, `6`, `8`, `12`, and `16`, so `space.2` / `--en-space-2` means twice the base rhythm. Semantic inset/gap/stack roles alias selected steps, and components consume those roles. The visual proposal's starting rhythm is `0.25rem`; final approval depends on complete workflow review.

Emit `calc()` relationships at a full scope so changing the base there propagates without JavaScript. Portable resolved exports retain `rem` values; they do not bake in an assumed user's root pixel size. Independently pin any step or semantic role. Density changes selected spacing/control-size roles; it does not multiply all typography or shrink every target. Use `min-block-size` plus content-driven growth for text controls rather than a fixed height that clips translations or text overrides.

Managed metadata exposes finite authoring choices. The current base rhythm choices are `0.125`, `0.1875`, `0.25`, `0.3125`, `0.375`, and `0.5rem`; these are constrained authoring choices subject to contextual review, not a WCAG-derived range. Code can use other valid values.

### Typography, absolute size and control geometry

`font.ui` starts at `1rem`, unitless `1.5` leading, and `system-ui, sans-serif`. Input and strong-label family/size/leading alias the UI role; weights remain independently authored (`400` UI/input, `600` strong labels). Shared edits flow through that graph while explicit role pins can diverge. Rendered labels inherit selected UI metrics and apply strong weight; `font.label-strong.size` is a base alias, not a separate sized role.

Missing `size` selects medium without an attribute. Explicit `size="inherit"` opts into the inherited selection; concrete small/medium/large values select absolute outputs without repeated multiplication. Geometry scales are `.875`/`1`/`1.25`; typography inputs are `.9375`/`1`/`1.125`. UI/input and metadata recipes clamp their type factor to at least `1`, preserving each base. Thus default small/medium control text is `1rem`, large `1.125rem`; small still reduces geometry. Direct size-output pins can bypass that default. Density and rhythm never alter font metrics.

Density sets baseline control sizes `2rem`/`2.5rem`/`3rem` and packing aliases. `space.actions` is tighter than content-row spacing; internal `space.control-block`/badge padding remains separate. Every input and output stays independently customizable.

The style helper `textControlBlockSize` computes a shared minimum for comparable text controls. With resolved control floor `C`, target floor `T`, control padding `P`, border `B`, frame inset `I = space.1 + B`, and the UI/input line boxes, it uses:

```text
H = max(C, T + 2I, inputLine + 2P + 2B, uiLine + 2max(P,I) + 2B)
```

`T` is the unscaled `24px` fine-pointer role or the `2.75rem` coarse-pointer role. At a 16px root, medium fine-pointer minima at `.25rem` rhythm are `38px`/`40px`/`48px` across densities; at `.5rem` they are `50px`. Comparable coarse-pointer controls reserve compound inset, giving `54px`/`62px` at those rhythms for medium defaults. These are contextual geometry results, not fixed pixel tokens or a blanket 44×44/AAA claim. Segmented native options retain their target block floor inside the frame; wrapping grows naturally. Native color uses explicit `H` because it lacks a text-driven intrinsic height; text controls remain auto-height. Graphic controls, icons and badges retain their own geometry roles.

CSS aliases and `calc()`-based typography/spacing derivations update at their declared full boundary. Raw descendant base changes do not recompute inherited aliases/size variants. Raw color-seed overrides also cannot rerun JavaScript foreground/state recipes, even at the root: resolve and emit that full theme. Direct semantic/size-output/component overrides remain available.

### Nested corners: `inset-radius/v1`

For parallel circular corners with a uniform effective inset `d`, derive the inner radius as `max(0, outerRadius - d)`. The inset is the distance between the relevant visible edges, including actual border/padding/gap contributions; it is not always just the parent's padding. Keep those inputs token-backed and calculate the final relation where that box geometry is known.

For asymmetric insets, compute separate horizontal and vertical corner radii using the respective inline/block inset and logical corner mapping. Let CSS perform its standard radius normalization when the box is too small. Do not claim that subtracting one scalar produces concentric corners for nonparallel shapes, pills, percentages, or elliptical/normalized geometry. These cases use a documented explicit radius override and visual review. [CSS backgrounds: corner shaping](https://www.w3.org/TR/css-backgrounds-3/#corner-shaping)

Reusable style recipes consume explicit outer-radius and inset token references; documented parts provide independent geometry overrides. A radius does not silently tunnel through arbitrary ancestor DOM. Composition authors supply the relationship through public tokens/slots; delivered component geometry remains private. A component-radius override must propagate into its owned nested recipe inputs or document the independent pin. Implemented select and segmented outer frames share `--en-control-radius` → sized `radius.control`; segmented inner radius subtracts its frame padding and border from that same resolved outer radius. Default medium values are `8px` outer/`3px` inner at a 16px root and `.25rem` rhythm. Container/popup radius remains its separate role; `::part(options)` and `::part(option)` preserve deliberate overrides.

## 6. Grouped styling and current-minus-one delivery

The baseline is static CSS with custom properties, `var()`, `calc()`, `min()`/`max()`/`clamp()`, logical properties, and documented parts. Ship reusable recipe CSS and Lit style exports so consumers can reuse batches without a build step. Typed pure functions can generate the same data/CSS for maintainers and optional application authoring.

| Mechanism | Delivery contract | Required verification |
| --- | --- | --- |
| Root/child/component/regional tokens | Ordinary CSS and explicit full-boundary/partial-override behavior above | Inheritance/alias/part fixtures in the rolling browser matrix. |
| Named size container queries | Opt-in layout boundary with explicit `container-name` and suitable `container-type`; query eligible descendants | No automatic containment on every theme root; layout, slots, shadow descendants, orientation and resizing. |
| Container style queries | Native enhancement for individually documented conditions | Baseline recipe for a named application state can use an explicit scope attribute; this is not an equivalent implementation of arbitrary style queries. |
| Native `@function` | Separate enhancement/import, with baseline compiled rules/data retained | Call-site variables, tree scope, cascade, SSR, and current/previous browser releases. |
| Native `@mixin` | Separate experimental authoring entry, never a parser requirement of baseline CSS | Draft syntax, expansion semantics, tree scope, and any selected transform/polyfill. |

Container queries use eligible ancestors and do not style their own container based on that query. Query ancestry and ordinary shadow selector reach are different concepts. This is why a theme root must not automatically become an inline-size containment boundary. [CSS Conditional Rules 5](https://drafts.csswg.org/css-conditional-5/)

Historical research snapshot from 2026-09-08: Chrome 139 shipped native `@function`; Safari Technology Preview 249 added it, while that preview does not establish stable current-minus-one coverage. The functions/mixins draft explicitly describes mixins as experimental and less stable. Keep baseline CSS free of syntax whose failure would remove the only implementation of a rule. Native CSS and Sass functions/mixins have different semantics; do not rename a Sass transform or JS helper a native polyfill. [Chrome 139](https://developer.chrome.com/release-notes/139), [Safari TP 249](https://webkit.org/blog/18182/release-notes-for-safari-technology-preview-249/), [CSS functions and mixins draft](https://drafts.csswg.org/css-mixins-1/)

Implemented baseline CSS uses the shared token/style helpers. Future native enhancements and examples must reuse that source model; separate native `@function`/`@mixin` delivery is not implemented merely because it appears in this plan. Every batch preserves named scalar/role/component override points. Capability detection alone does not prove equivalence; the platform plan owns the measured spike before enabling a native path. Recheck the version matrix at implementation and release time.

## 7. Managed admin controls

Implemented `managedEditors` generates a typed descriptor for every resolved token; `validateManagedValue` applies its constrained choices separately from code-level validation. The local Theme Review page uses those descriptors for all-token selection and editing, with coordinated shortcuts, appearance/density context, effective values, provenance, pins and diagnostics. No unrestricted CSS textarea is the fallback for missing metadata. The sheet's preview controls remain separate from this editor. See its [consumption and loading contract](../apps/docs/src/theme-review/README.md).

The fuller admin descriptor design proposes: token ID, editor kind, allowed units, enum/allowed values or explicit numeric bounds/step, compatible alias targets, nullable/pin policy, affected recipes, help text, and validation relationships. Current descriptors include typed choices/bounds/units where applicable, compatible alias targets and pin support. The manifest includes them. The pure draft model now owns bounded accepted-edit history and undo/redo; richer help, source ownership and adoption integration remain planned.

| Token family | Initial managed editing contract |
| --- | --- |
| Color | Structured color picker with bounded channels and opacity where the role permits it; coordinated accent seeds initially use opaque sRGB. Compatible named color references are selectable. No arbitrary CSS function/string evaluation. |
| Spacing and size | Choose reviewed scale entries or same-type role references; coordinated rhythm choices listed above. Preserve units. |
| Typography | Select declared font stacks and reviewed type-scale entries; component-aware line-height/weight controls. Adding a font source is a code change with an asset/fallback declaration, not a remote URL field. |
| Radius | Choose the declared radius scale, explicit none/pill choices where applicable, or restore the coordinated inset relationship. Show pinned exceptions. |
| Borders, focus, elevation, motion | Structured typed controls and reviewed per-role choices; compound tokens have structured child controls. Preserve a visible focus route and per-effect reduced-motion alternative. |
| Aliases and pins | Choose compatible existing targets; reject cycles; inspect provenance; remove a pin through Restore derived value. |

The exact approved choices are theme metadata, initially seeded by the visual proposal and then validated in compositions. Do not apply one global minimum font size or line-height as an accessibility gate: WCAG does not supply such a universal scalar rule. Target-size and contrast findings require context; text-spacing evaluation concerns tolerance of user overrides. [WCAG text spacing](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html), [WCAG target size minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)

Keep forced-color adjustment enabled by default and provide system-color/focus/border affordances. Any targeted opt-out needs a documented reason and rendered review. Reduced motion chooses a reduced or removed effect while retaining operation and state feedback; setting every duration to zero is not the behavior contract. Follow [accessibility.md](./accessibility.md) for the shared validation requirements.

In the local editor, raw input remains separate from the accepted draft until Apply pin. Restore default rule removes the selected pin/source override; Undo, Redo and undoable Reset draft operate on accepted edits. Descriptor choices stay anchored to the original base in the selected context; current compatible aliases follow the graph, and exact existing exceptions can be preserved. Successful edits enter bounded model history. Keep invalid-input recovery, action focus and final preview updates covered by actual browser operations. Complete component impact mapping remains unfinished. No rendered preview reports adoption. See [experience.md](./experience.md) for the broader task flow.

## 8. Reviewable candidate and proposed transport

**Implemented foundation:** `createCandidate` returns immutable prepared data with hashes, typed before/after changes, diagnostics and caller-supplied evidence. Its embedded artifacts are `source.json`, `theme.css`, `changes.json` and `dependencies.json`; `assertCandidateBase` rejects a stale source base. `createReviewDraft` adds accepted edit history and validated export/replay. Reopening reconstructs the recorded base, replays managed operations and compares the entire regenerated candidate/artifacts; imported CSS is never applied. These pure functions do not create a UI or adoption operator.

**Implemented local transport:** the documentation page exports JSON containing base/options and edits, candidate source/CSS/typed changes/dependencies, resolved typed values, exact documentation build/assets and required/rendered review coverage. Reopen requires that same build and validates/regenerates the candidate before replacing the draft; failure preserves the current draft, and successful reopen can be undone. Rendered cases are not passed tests: interaction, visual comparison and manual accessibility remain `not-run` in the export. The JSON contains no offline documentation copy and is not a source submission, adoption or deployment. Remote destinations and authority remain to be selected.

`createThemePair` and `emitThemePairCSS` combine two independently authored,
schema/compiler-compatible branches at one shared density. They do not invert a
palette or copy pinned light outputs into dark. Reference-free color values may
join through guarded `light-dark()`; varying aliases, non-colors and optional
override masks keep branch rules and fallback CSS. Switch the whole boundary with
`data-en-appearance`; `color-scheme` alone cannot select divergent geometry/masks.

`exportThemeReviewPair`/`reopenThemeReviewPair` use the strict
`en-reve/theme-review-pair` v1 envelope with two complete single-draft envelopes.
The documentation's outer local review format uses v2 for pairs and retains v1
single-file support. Both branches/artifacts are regenerated and validated before
replacement. The editor keeps independent accepted edits, atomic density/history
and an Auto preview preference distinct from editing Light/Dark. Preview receipts
include effective appearance; rendered coverage still does not imply passed tests.
Full source/API details live in the package and Theme Review READMEs.

The fuller offline bundle remains planned beyond the local JSON transport and would contain:

```text
proposal.json
source/                          # complete candidate token/theme/recipe inputs
changes.json                    # typed edits with expected previous values
generated/                      # candidate CSS + DTCG resolved exports
manifest.json                   # IDs, dependencies, provenance, mappings
evidence/index.json             # checks + environment and coverage status
review/index.html               # entry to local review material, if generated
```

The planned `proposal.json` would record schema version, candidate ID, title/rationale, base source hash, candidate source hash, theme/context IDs, compiler/recipe/package versions, changed token IDs, artifact hashes, and evidence references. It contains no assumed reviewer identity or remote destination. The fuller `changes.json` would record exact before/after values and pin/recipe-source edits; its importer must report stale-base conflicts rather than overwrite changed source. The prepared candidate remains immutable; changed effective source/output inputs create a new candidate identity. Title or evidence-only edits do not currently participate in that identity.

Required review surfaces are the all-component sticker sheet, documentation using the candidate values, and the four independently rendered reference workflows. The current page exposes the full shipped sheet and each deterministic workflow as an explicitly loaded baseline/candidate iframe pair. The editor starts in the system-responsive default appearance. Page appearance can explicitly apply the accepted candidate to the Theme Review document and return to Default without discarding the draft; baseline/candidate iframe scopes remain independent. Initial SSR supplies the editor and preview region without eagerly loading every full page, respecting constrained connections without claiming a measured 4G budget. Old/new values and provenance are visible. Complete affected-component classification and expected/actual/diff VRT evidence remain future work. Coverage must say what ran, what failed, and what remains manual; missing evidence is not a pass.

The planned review cache/comparison identity must include source/output hashes, recipe/compiler versions, component/review-fixture versions, effective theme/context/pins, browser/OS/viewport/device scale, locale/direction, font assets/readiness, and the comparison policy. Invalidate through aliases, recipes, contrast relationships, and transitive component consumers. If dependency completeness is unknown, expand the review scope instead of reusing unproven cache entries. The full sticker sheet must remain available even when only affected automated checks rerun.

Adoption is a later explicit application of the exact candidate to authoritative code followed by regeneration and required validation. Review acknowledgment alone does not apply it or promote visual baselines. Official adoption is library-owned; consuming teams can apply their own candidate to their own code. The actual local/remote persistence adapter and submission/adoption operator remain to be selected.

## 9. Compatibility and evidence

Token names, CSS names, types, documented fallbacks, scope/rebase semantics, public recipe inputs/outputs, and editor-supported source representation are versioned contracts. A token dependency or default change is reviewable even when the component CEM is unchanged.

The current review iteration keeps library/package version strings at `0.1.0` per user instruction; this plan sync does not change versions. For subsequent releases during `0.x.y`, increment `x` for major/breaking changes, which may include deprecations; `y` carries minor/patch changes. After `1.0`, use normal semantic versioning with deprecation in a minor release and removal in a major release. A removed/renamed public token, changed type, incompatible override meaning, or broken scope contract is breaking. Purely visual value adjustments still require the candidate review surfaces and an explicit compatibility assessment; neither a CEM diff nor an unchanged token list classifies them automatically.

Existing evidence includes 32 Node tests and 39 token browser checks across Chromium, Firefox and WebKit in the linked package evidence. That establishes the recorded graph, scope, brand, typography and sizing cases only. The integrated delivery still must demonstrate or complete these review processes:

1. Load the default and one independently generated theme in plain HTML/import-map and SSR fixtures without importing the token generator.
2. Apply a page theme, an arbitrary child full theme, a partial region override, and a component pin; show isolation and expected rebase behavior, including a parent pin.
3. Change a rhythm input, preserve a pinned spacing token, then restore its derivation; inspect actual layout and text growth.
4. Change an accent input and inspect affected roles, independent pins, rendered contrast findings, and the generated source diff.
5. Change outer radius and inset independently in symmetric/asymmetric nested surfaces; inspect the rendered corners at differing density, zoom, and direction.
6. Preserve and extend the scoped local-editor user-operation receipts for accepted history, isolated previews and exact-build single/paired export/reopen; earlier receipts are not a fresh full-system checkpoint. Complete offline review packaging, evidence comparison and adoption separately.
7. Run applicable keyboard, forced-colors, reduced-motion, text-spacing/zoom, locale/direction, and full-workflow checks; record official-versus-consumer ownership accurately.
8. Measure theme CSS bytes, theme-switch style/render cost, repeated nested-scope cost, resolver cost, and admin preview latency separately. Establish budgets from these results; component/performance plans and recorded runs own measurements; this plan does not establish a release budget.

## 10. Peer resolutions and remaining risks

- Brad: token-backed rules do not require a public property for each computed intermediate; component override defaults should fall back to shared roles. Align package and manifest ownership without one package per pattern.
- Westbrook: conventional populated variables plus explicit rebase/partial semantics are preferable to unexpectedly empty public variables. Tree boundaries, cascade layers, and query ancestry need real computed-style fixtures.
- Dieter: readable typography remains independent of compact density; corner coherence uses explicit geometric relationships with reviewed exceptions. The visual document records current reference values and pending visual acceptance.
- Léonie: managed numeric choices guide customization without certifying it. Forced colors and reduced motion need component behavior and rendered evidence, not token-only promises.
- Tammy: measure the complete scope-map payload/recalculation cost; cache dependencies include derivation, fonts, and contrast. Preserve final edits and undo while coalescing previews.
- Golden: show direct, derived, and pinned effects in the admin and keep draft, prepared, reviewed, and adopted states distinct.

Remaining implementation/review risks: alias/scope mistakes, full-theme reset payload, unsupported native CSS paths, contextual radius math, theme/font-dependent text layout, untracked dependencies in review caching, and mismatch between color-generation snapshots and browser used values. Submission destination, persistence, and adoption authority remain product choices for an operating submission service; they do not prevent local export/reopen review. The pure package and rendered stylesheet fixtures implement a bounded slice; no token-owned submission service has been created. Full release acceptance remains distinct from focused browser passes, including the open WebKit fixed-host `rem` and Firefox slotted-touch findings tracked by accessibility/platform review. Do not treat unrelated hosted sticker-sheet availability as token adoption infrastructure.
