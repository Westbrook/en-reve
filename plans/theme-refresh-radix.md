# Radix Themes-inspired theme and API findings

Reviewed September 20, 2026. The new `radix-inspired` light/dark pair follows the **default Radix Themes product language** shown in the [playground](https://www.radix-ui.com/themes/playground). The [homepage](https://www.radix-ui.com/) is a useful second reference, but its editorial display typography is a separate marketing treatment. This is an inspired adaptation, not a claim of pixel equivalence, shared implementation, or Radix endorsement.

## Reference configuration and provenance

The default configuration is indigo accent, automatic gray resolving to slate, medium radius, 100% scaling, and translucent panels. Appearance defaults to `inherit`; light and dark are both supported rather than treating the browser's initial dark appearance as a fixed product default. The current playground confirms those settings. Its default size-2 solid button is 14/20, weight 500, 32px high, 12px inline padding and 4px corners. Body text is 16/24 at weight 400. A size-1 surface card uses 12px padding and 8px corners.

| Source | Reproducible identity | Use |
| --- | --- | --- |
| [Radix Themes source](https://github.com/radix-ui/themes/tree/1faff10ac26ae17f09944d418c6949b93fc6b566) | Commit `1faff10ac26ae17f09944d418c6949b93fc6b566`; package declares 3.3.0 | Theme defaults, component defaults, typography, geometry, state rules, materials, elevation and motion |
| [Radix Colors source](https://github.com/radix-ui/colors/tree/dbdb85470547c7d34b9001f48fddb08ded335979) | Commit `dbdb85470547c7d34b9001f48fddb08ded335979` | Exact sRGB indigo/slate scales, alpha companions and semantic status color inputs |
| [Live reference observations](../artifacts/radix-refresh/live-reference.md) | September 20, 2026; actual playground and homepage consumers | Checks configuration and rendered typography/geometry; identifies Display-P3 use and the separate marketing hero |
| [Downloaded source manifest](../artifacts/radix-refresh/sources/manifest.json) | Per-file URLs and SHA-256 hashes | Reproducible copy of the precise official files used for this recipe |

Repository package versions identify inspected source, not a proven deployment version of the live website. The live browser used Display-P3 values on this Mac. Our portable color contract is sRGB, so the recipe uses the official sRGB ramps. Color space differences are recorded rather than treating unequal numeric triplets as a failure to read the source.

The homepage hero uses Adobe Text Pro, approximately 66/60, weight 400, and -3.3px tracking in the observed viewport. Its embedded product examples still use the Themes system stack and compact control metrics. Applying that hero font to every component would misrepresent the product default; the recipe does not redistribute that font.

## Mapping the default product

| Role | Light | Dark | Implementation |
| --- | --- | --- | --- |
| Canvas | White | Slate 1 `#111113` | Opaque semantic canvas |
| Solid panel/overlay | White | Slate 2 `#18191b` | Semantic surface and raised surface; menus/dialogs stay solid |
| Translucent panel | White at .7 alpha | Slate A2 `#d8f4f609` | Actual alpha pins on card and shared surface backgrounds; missing backdrop blur is disclosed below |
| Field surface | White at .85 alpha | Black at .25 alpha | Scoped input background, with opaque text |
| Everyday/muted text | Slate 12 `#1c2024` / Slate 11 `#60646c` | Slate 12 `#edeef0` / Slate 11 `#b0b4ba` | Independent text and metadata roles |
| Primary/brand | Indigo 9 `#3e63dd` | Indigo 9 `#3e63dd` | White foreground in both modes; separate action-text role uses Indigo 11 |
| Primary hover | Indigo 10 `#3358d4` | Approximately `#4e6ad6` | Dark adaptation maintains 4.8:1 white-text contrast |
| Primary pressed | Approximately `#2b51ce` | Approximately `#516ede` | Light background models the source filter; dark adapts its brightening direction while maintaining 4.51:1 |
| Links/action text | Indigo 11 `#3a5bc7` | Indigo 11 `#9eb1ff` | Avoids reusing the filled-action color for dark text links |
| Subtle selection | Indigo 3 `#edf2fe` | Indigo 3 `#182449` | Separate from the solid indigo highlighted option row |
| Functional boundary/focus | Slate 10 / Indigo 9 | Slate 10 / Indigo 9 | Stronger contours than source surface borders and focus-8, deliberately retaining host contrast expectations |

The default source button is **solid**, not classic. Its six public treatments are classic, solid, soft, surface, outline and ghost. Our primary maps to solid. Existing secondary, ghost and danger distinctions remain intact; no blanket button background/foreground or all-variant pressed pins were used. The host's variant vocabulary is not interchangeable with Radix's, so the source's complete variant matrix cannot be recreated by one palette.

Typography uses the source's system-font ordering with local Segoe UI, Open Sans and Consolas names in place of Radix's custom metric-adjusted aliases. All UI, input, body, data, metadata and heading families use explicit aliases to the trusted family baseline. Body is 16/24; controls and data 14/20; metadata 12/16. The three heading roles choose source scale entries 20/26, 24/30 and 35/40 with weight 700. These are deliberate mappings from Radix's nine-level scale into our three heading roles. Radix's local `@font-face` metric overrides, letter spacing, leading trim, serif emphasis/quotation and code size adjustment are not supplied by a font-family list.

The recipe sets 4px ordinary control corners, 8px cards/popups and 12px default dialogs. Exact small/medium/large control outputs use 3/4/6px radii and 24/32/40px visual minimums, alongside 12/14/16px UI and input type. Medium vertical padding is 5px; button/input horizontal padding is 12px/8px. The host still applies its target floors, content sizing and coarse-pointer rules. These are authored geometry inputs, not promises of exact rendered height for every compound control or input context. The source also has a fourth button size, and different families have their own size scales.

Menus and selects use the source's **solid highlighted row**: Indigo 9 with white text for hover, keyboard-active and pressed states. A selected row at rest remains transparent with ordinary text and the component's selection indicator; selection is not substituted for keyboard highlight. Popup padding is 8px, row corners 4px, and horizontal padding 12px. Host row block padding and check/shortcut anatomy remain adaptations: Radix reserves asymmetric indicator space and has different menu/select sizing rules. Disabled rows use Slate 8; they are excluded from ordinary enabled-text contrast claims.

Layered elevation is represented with current structured shadow arrays. Overlay/option-list uses source shadow-5; dialog uses shadow-6. The source's modern `color-mix(in oklab, alpha-gray 75%, opaque-gray 25%)` ring is resolved with premultiplied alpha into an sRGB color, rather than replacing the entire elevation with one generic black blur. This preserves each offset, blur, negative spread and alpha layer. The serializer already supports `inset`; the limitation is where those values can be consumed, not the shadow value format.

Dialog entry maps 200ms, `cubic-bezier(.16,1,.3,1)`, 5px travel and .97 scale; exit maps 100ms. The host has one scale endpoint, while Radix exits at .99 and uses separate 160ms scrim timing. Anchored host surfaces retain stable geometry rather than borrowing modal travel. Solid buttons have immediate source paint changes, so `duration.fast` is zero; a shared 120ms regular duration is an adaptation for other host transitions, not a claim that every Radix family uses it.

Toast is not part of the Radix Themes component list. Our existing toast keeps neutral raised paint, semantic icon colors and the same popup elevation as a host extension. Editor tokens similarly use an indigo soft-chip interpretation with Indigo 12 text; they are not presented as a Radix Themes token-editor component.

## Contrast and material adaptations

The official sRGB dark solid button has white text on `#5472e4` when hovered, approximately **4.282:1**; its `brightness(1.08)` pressed filter further reduces that to approximately **3.740:1**. The recipe keeps exact Indigo 9 at rest and adjusts hover/press to retain increasing brightness while passing our ordinary-text checks. These are finite authored colors with unrounded coordinates, not new runtime color recipes. The displayed hex values above are approximations; the receipt records the actual values.

In light mode the source's `brightness(.92) saturate(1.1)` filter affects the complete button, including the glyphs. We reproduce its background result and retain white action ink. Source glyphs become approximately `#ebebeb`; therefore even the light pressed result is not a complete recreation of the filter effect.

Source field borders and focus-8 are intentionally subtle. We retain a stronger Slate 10 functional boundary and Indigo 9 focus contour; text-field focus uses the supported -1px offset. This avoids quietly weakening our established functional boundaries to match an aesthetic reference. It is not a declaration that the source library as a whole fails accessibility.

Alpha is **already supported** by typed color values and trusted code-authored pins, including cards and fields. The material gap is the absence of a bounded panel backdrop-filter role and source pseudo-element layering. Repeated translucent nesting and imagery behind a panel can therefore differ even when the alpha paint is exact. Managed color editors also allow alpha on fewer roles than the underlying typed API, so the per-mode baseline carries those legitimate code-authored values.

## Current-API verification

The [validation receipt](../artifacts/radix-refresh/recipe-validation.json) records 102 operations and 151 resolved pins per appearance, zero compilation diagnostics, and exact export → reopen with the authoritative per-mode baseline → export preservation of both tokens and bytes. [The baseline fragment](theme-refresh-radix-base.json) retains full fallback families, precise geometry/typography, translucent paint and layered shadows; all are existing theme capabilities.

Standard compiler checks cover ordinary text, muted text, on-brand and all primary action states. Additional checks cover links on ordinary/subtle/selected surfaces, all enabled option states, chip rest/hover/pressed text, composited fields and cards, toast text, semantic status text, functional boundaries and focus. The lowest additional ordinary-text result is 4.6109:1 in light and 5.2062:1 in dark. Transparent backgrounds are explicitly composited against named opaque contexts. These are bounded token/context checks, not certification of every rendered component, interaction, assistive-technology flow or possible image behind a translucent panel. Application/browser verification is recorded separately by the main delivery.

## Proposed API changes before the first official release

1. **Add variant-aware family recipes before more global paint knobs.** Solid, soft, surface, outline, classic and ghost need distinct rest/hover/pressed/disabled behavior and independent accent/gray/high-contrast contexts. Existing scopeable themes can already be nested; a documented small accent/radius/family recipe would make local variants easier without forcing authors to replace a full theme. Do not equate theme color choice with a component variant.
2. **Connect bounded elevation and material roles.** Input, button and card rest/hover/pressed shadows are real missing consumers. Structured shadow arrays and inset layers already exist. Pair those consumers with explicit focus-shadow composition, optional panel blur with opaque/reduced-transparency fallback, and clipping semantics. Classic gradients, layered borders and pseudo-elements require either a bounded surface-effect recipe or a portable companion stylesheet contract.
3. **Make pressed presentation a portable state contract.** Radix classic uses changed inset shadows and content padding; solid applies a filter; open popup triggers suppress the ordinary press effect. Include variant/state priority, disabled/loading/open guards, reduced motion and stable hit/focus frames. The [pressed-state audit](theme-refresh-pressed-states.md) also covers Astryx shrink and Rhea movement. Merely adding `scale` would not express these cases.
4. **Broaden typography with real consumers.** Heading tracking, a nine-step or extensible type scale, leading-trim controls and separate code/quotation/emphasis roles are useful. Metric-adjusted local font aliases need an explicit asset/stylesheet companion; a family-name token cannot carry an `@font-face` rule. Keep font loading and licensing separate from recipe JSON.
5. **Expose family-specific motion where effects genuinely differ.** Radix uses distinct dialog content/scrim timing, different entry/exit scales, switch directions and tooltip travel. Our shared modal duration/scale roles capture only a subset. Promote scoped roles alongside reduced-motion tests rather than making every popup inherit a dialog animation.
6. **Document alpha composition and color-space boundaries.** Maintain an sRGB fallback and specify how optional Display-P3 overrides, alpha backgrounds and semantic contrast checks travel together. Avoid claiming that a palette check establishes contrast on arbitrary translucent surfaces. Managed-editor support should clearly distinguish editable values from code-authored values that can be faithfully reopened.
7. **Keep behavioral gaps out of theme promises.** Radix's hover cards, selection cards, context menus and layout/typography helpers are composition or component capabilities. The [cross-library comparison](theme-refresh-library-comparison.md) compares these against our existing elements and patterns, including Spectrum, Fluent 2, Astryx and shadcn. It separates absent patterns from equivalents we already possess and from cosmetic differences that belong in the theme API.

These are recommendations, not added APIs. The implementation adds only the new theme pair and its existing baseline/recipe transport; it does not inject Radix CSS, copy its components, or change shared component behavior.
