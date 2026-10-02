# Cross-family customization API audit

Read-only source audit, 2026-09-18. Repository-relative source paths are used below. No builds, runtime changes, git operations, or report/site edits. Findings distinguish broken shared contracts from additive normalization opportunities. Paths below are relative to that repository; line numbers were checked in source.

## CSS-01. Later public hooks do not participate in full-theme reset boundaries

**Classification: concrete contract gap; high priority.** The finite registry is explicitly the full-theme reset registry (`packages/styles/src/metadata.ts:1-2`). `collectThemeCSSDeclarations` resets its names to `initial` at a full boundary (`packages/tokens/src/css.ts:17-19`), and the documented promise is that full child themes clear inherited optional pins (`packages/styles/README.md:147-151,197-201`).

**Comparison:** Early hooks such as button/input/surface/overlay are present in `packages/tokens/src/overrides.ts:19-44`; color-slider/picker are present at `:6-7`. But the complete registry (`:2-53`) omits public `--en-chat-*`, `--en-color-wheel-*`, `--en-color-plane-*`, `--en-editor-max-size`, and calendar geometry/range hooks. These are actually documented and consumed: chat `packages/elements/src/chat-message/element.ts:21-26` and `packages/styles/src/chat.ts:5-6`; wheel `packages/elements/src/color-wheel.ts:24-26` and `packages/styles/src/color-wheel.ts:6,9,12`; plane `packages/elements/src/color-plane.ts:31-33` and `packages/styles/src/color-picker.ts:31-32`; editor `packages/elements/src/token-editor/element.ts:25` and `packages/styles/src/token-editor.ts:14`; calendar `packages/elements/src/calendar/element.ts:37-46` and `packages/styles/src/calendar.ts:7,11,17-20,26-27`. Calendar hover/pressed opacity are real semantic tokens (`packages/tokens/src/source.ts:111-112`), so they are not examples of this omission.

**Consequence:** A parent `--en-chat-background` or `--en-color-wheel-size` can continue into a full child theme while an equivalent earlier-family override resets. The same override's behavior now depends on component generation. Family discovery is also incomplete: `styleFamilies` at `packages/styles/src/metadata.ts:7` omits exported calendar, form-navigation, chat and color-wheel families (`packages/styles/src/index.ts:26-39`).

**Preferred normalization:** Make supported public styling hooks derive the finite reset registry and annotation inventory from one source; add missing hooks and family names. Keep measured/mechanical inputs outside it. **Alternative:** Explicitly classify documented hooks as unmanaged, inheritance-preserving hooks, but this weakens the current uniform full-theme promise. **Migration risk:** Medium: fixes alter nested-theme inheritance for consumers relying on accidental leakage; warn in release notes and show partial-scope migration.

## CSS-02. Rich/token editors inherit `size`, but omit the stylesheet implementing it

**Classification: concrete parity defect; high priority.** `EnElement` promises explicit small/medium/large local scopes and opt-in inheritance (`packages/elements/src/internal/en-element.ts:14-16,35-41`). `foundationStyles` includes `sizeStyles`, whose selectors establish these flags (`packages/styles/src/foundations.ts:11-21`).

**Comparison:** Normal form controls adopt foundations through `packages/elements/src/forms-private/form-field.ts:9-18`; chat/calendar also explicitly adopt them (`packages/elements/src/chat-message/element.ts:30`; `packages/elements/src/calendar/element.ts:58`). `EnTokenEditor` uses only `[tokenEditorStyles]` (`packages/elements/src/token-editor/element.ts:40-42`), and rich text only `[tokenEditorStyles, richTextEditorStyles]` (`packages/elements/src/rich-text-editor/element.ts:42-44`). `tokenEditorStyles` invokes `sizedStyles`, but that helper only computes roles from existing flags; it does not select/reset the flags (`packages/styles/src/internal/sizing.ts:10-14`).

**Consequence:** `size="small"`/`"large"` cannot select local role variants on these editors, and the default medium editor can inherit ancestor flags without `size="inherit"`. This is independent of whether a multiline editor should share a one-line height.

**Preferred normalization:** Adopt `sizeStyles` at minimum, then explicitly decide whether editor typography should use the full foundation or the input typography role. **Alternative:** If editors intentionally do not support size, remove/override the inherited public contract and document a separate one; that is less transferable. **Migration risk:** Medium: the fix changes currently inherited sizing/typography; adding only `sizeStyles` minimizes unrelated appearance changes.

## CSS-03. Multiline editors share focus/control styling, but not the input or label customization contract

**Classification: cross-family parity gap, with a concrete missing label hook; medium priority.**

**Comparison:** Native textarea/input/select use `--en-control-background` then `--en-input-background`, equivalent color fallback, and shared-control then input-family inline padding (`packages/styles/src/controls.ts:13,31-36`). Native field spacing uses `--en-field-gap` (`:337-349`), and field rendering exposes `part="field"`, `part="label"` plus the `label` slot (`packages/elements/src/forms-private/form-field.ts:225-230`). Textarea exposes its editing surface as `control` (`packages/elements/src/textarea/element.ts:56-60`).

Token/rich editors deliberately reuse input-family focus, but only use the generic control surface helper (`packages/styles/src/token-editor.ts:9-16`). That helper ignores input-family background/color/padding (`packages/styles/src/internal/control-shared.ts:15-21`); the editor label uses a fixed semantic space-2 margin (`packages/styles/src/token-editor.ts:12`). Both render the familiar `label` slot in a span without a `label` part, and expose the editing surface only as `editor` (`packages/elements/src/token-editor/element.ts:290`; `packages/elements/src/rich-text-editor/element.ts:371`). Their JSDoc also lacks label/control parts (`token-editor/element.ts:18-24`; `rich-text-editor/element.ts:30-35`).

**Consequence:** A learned field theme using `--en-input-*`, `--en-field-gap`, `::part(label)`, or `::part(control)` stops applying when the editing experience becomes token/rich text, despite the same visible label-plus-multiline-textbox arrangement.

**Preferred normalization:** Add shared input-surface fallback composition and field-gap support; add `label` and an additive `control` alias (`part="editor control"`) while retaining `editor`. Preserve editor-specific multiline minimum/maximum geometry. **Alternative:** Keep editors a distinct documented styling family, with an explicit crosswalk and its own equivalent hooks. **Migration risk:** Low for part aliases; medium for new inherited input hooks because existing shared-scope pins will start affecting editors.

## CSS-04. Editor suggestions adopt option paint but only part of the option-list geometry/color contract

**Classification: concrete incomplete shared-family adoption; medium priority.**

**Comparison:** Menu/combobox/select surfaces honor list max-block-size, gap, inset and radius; their rows honor block/inline padding and effective concentric radius (`packages/styles/src/commands.ts:8-13,24-30,75-87`; `packages/styles/src/combobox.ts:65-72,83-105`; `packages/styles/src/controls.ts:282-306`). All include the `--en-overlay-color` fallback in row color.

Editor suggestions use the same `optionPaint` and option/list names, but `.popup` uses only `max-block-size:var(--popup-height,18rem)`; `.option` hardcodes the semantic block padding, has no list gap, and defaults directly to control radius (`packages/styles/src/token-editor.ts:35-48`). Its row rest color is `--en-option-list-color` then semantic text, omitting overlay-color (`:47`), even though the containing popup honors overlay-color (`:42`). `--popup-height` is written from available viewport space (`packages/elements/src/internal/editor-popup.ts:35-42`), so it is a mechanical ceiling rather than an alternative user theme hook.

**Consequence:** Setting shared option block padding/gap/max height does nothing for editor suggestions; an overlay-color theme can color the popup differently from its option text. Explicit outward option focus may also have less inset protection: menu/list padding includes `focusExtent` (`packages/styles/src/commands.ts:9`), while editor padding does not (`packages/styles/src/token-editor.ts:38`).

**Preferred normalization:** Reuse a shared option-list/row geometry helper, combine the mechanical available height with the public max-block-size using `min()`, and preserve overlay-color fallback. Distinguish rich custom pickers from ordinary suggestion lists only where their content needs it. **Alternative:** Expose editor-specific geometry and document the partial shared-hook subset. **Migration risk:** Low/medium: themes with existing option hooks will begin affecting editor popups; changing default radius/inset may alter appearance.

## CSS-05. Color slider overrides the shared coarse-pointer sizing contract

**Classification: concrete token/interaction-target parity defect; medium priority.**

**Comparison:** Normal range/controls use `@media(any-pointer:coarse)` and the public `--en-size-target-touch` plus `--en-control-min-size` floor (`packages/styles/src/controls.ts:204-207`; `packages/styles/src/internal/control-shared.ts:36-37`). `EnColorSlider` appends its stylesheet after the full slider styles (`packages/elements/src/color-slider.ts:24-26`). Its `.en-range` replaces the minimum with thumb-size versus target-min (`packages/styles/src/color-slider.ts:22`), and its coarse rule is `@media(pointer:coarse)` with literal `44px` (`:38`).

**Consequence:** A theme raising touch targets beyond 44px or a device with a fine primary pointer and a coarse secondary pointer receives different horizontal color-slider behavior from the inherited slider. The later base rule also overrides the inherited any-pointer rule when the color-specific primary-pointer condition does not match. Vertical ranges have additional, more-specific geometry rules and need separate runtime verification.

**Preferred normalization:** Use `any-pointer:coarse` and `max(thumb-size, public control minimum, public touch target)`; keep independent thumb/track sizes. **Alternative:** Document a deliberate color-specific target API, but never silently reduce a shared target floor. **Migration risk:** Low; controls may grow under customized or mixed-pointer environments.

## CSS-06. Color-family raw fallbacks bypass size-selected roles and use an unmatched label token

**Classification: source-verified parity gap; medium priority.**

**Comparison:** Standard control radius is evaluated through the shared token helper (`packages/styles/src/internal/control-shared.ts:18`), which selects finite sized roles (`packages/styles/src/internal/values.ts:13-19`; radius is a sized role at `packages/tokens/src/sizing.ts:41-44`). The color slider likewise calls the helper for its radius (`packages/styles/src/color-slider.ts:7`). Picker preview and plane instead directly read `--en-radius-control` with a copied `.25rem` fallback (`packages/styles/src/color-picker.ts:9,11,31`), so their `sizedStyles(...)` wrapper alone cannot select the sized radius. Those fragments contain no helper-generated private sized-role references, which are how `sizedStyles` discovers work (`packages/styles/src/internal/sizing.ts:10-14`).

The standard field label uses `--en-font-label-strong-weight` (`packages/styles/src/controls.ts:343`); wheel instead reads `--en-font-weight-label` with `600` fallback (`packages/styles/src/color-wheel.ts:7`), a name absent from the token sources/override registry. Calendar heading similarly hardcodes `600` (`packages/styles/src/calendar.ts:9`).

**Preferred normalization:** Use the token helper for semantic fallbacks; use the established label weight role. Decide explicitly whether “shared control radius” in color annotations means the semantic radius token or the `--en-control-radius` override—currently their docs use that phrase (`packages/elements/src/color-slider.ts:19`; `packages/elements/src/color-plane.ts:32`) while styles only fall back to the semantic token. **Alternative:** Keep literal color geometry intentional and document which dimensions ignore `size`; add an alias for the unmatched wheel token if compatibility matters. **Migration risk:** Low/medium: unpinned color radii/label weights will begin following size/theme choices, while explicit component pins stay authoritative.

## CSS-07. Calendar consumes option hooks with different state precedence and coverage

**Classification: normalization decision; medium priority, not an assertion that date ranges should behave like generic list rows.**

**Comparison:** Shared `optionPaint` makes state-specific hooks refine broad background/color and applies disabled > pressed > hover > active > selected > rest; selected weight is customizable (`packages/styles/src/internal/option-paint.ts:33-64`). Combobox/select use it (`packages/styles/src/combobox.ts:97-106`; `packages/styles/src/controls.ts:300-307`).

Calendar reuses rest/hover/selected option names but selected fill/color skip the broad `--en-option-background/color` fallback (`packages/styles/src/calendar.ts:27,30-31`). Pressed state uses only calendar tint opacity (`:38`); disabled uses opacity (`:40`); selected option weight hooks are not consumed. Hover overrides apply only to unselected days (`:30`). Range endpoints/bands intentionally have distinct paint (`:17-20,32-36`), but that does not explain all single-date state-hook differences.

**Consequence:** A broad option theme or explicit pressed/disabled/selected-weight theme is portable among selection popups but only partly portable to dates, despite the shared public names.

**Preferred normalization:** Apply the shared option paint contract to ordinary single-date controls, retaining a documented range-band specialization and tint compositing. **Alternative:** State clearly that calendar exposes a finite subset and introduce calendar-specific state hooks for intentional differences. **Migration risk:** Medium/high if precedence changes: broad overrides may erase existing date-state contrasts. Preserve calendar defaults and migrate explicit broad pins carefully. The legacy native `.en-option` recipe is separately excluded from the delivered picker contract in `packages/styles/README.md:192-195`; do not classify that documented legacy distinction as an accidental defect.

## CSS-08. Validation `error` parts disappear or change meaning through color composites

**Current disposition — implemented through THEME-06 and API-06: color-slider label/error forwarding is repaired; picker guidance and validation use distinct canonical hex-description/hex-error roles. Compatibility-only aliases are removed under the accepted prerelease contract, while distinct host/native surfaces remain. See [API-06 migration](../api-06-customization.md). Original evidence follows.**

**Classification: concrete lost inherited hook plus semantic naming debt; medium priority.**

**Comparison:** Slider documents `error` and renders its editor rejection there (`packages/elements/src/slider/index.ts:25`; `packages/elements/src/slider/template.ts:51-52`). Color-slider replaces the editor with `en-text-field`, writes its `.error`, but forwards only `control:editor` (`packages/elements/src/color-slider.ts:85-101`). The base slider deliberately suppresses its outer error when the replacement editor exists (`packages/elements/src/slider/index.ts:204-209`). The text field's real error is inside the nested shadow root (`packages/elements/src/forms-private/form-field.ts:230`). Thus a consumer's inherited `en-color-slider::part(error)` cannot reach the shown exact-entry error.

The picker additionally forwards both text-field `description` and `error` as the same `error` part (`packages/elements/src/color-picker/element.ts:209-211`), whereas ordinary fields keep description/error separate (`packages/elements/src/forms-private/form-field.ts:229-230`). Channel forwarding at picker `:231` and plane `packages/elements/src/color-plane.ts:93` omits errors entirely.

**Preferred normalization:** Add `error:error` forwarding to color-slider and scoped `channel-error` through composites. Add distinct `hex-description`/`hex-error` or ordinary description/error aliases to the picker; retain the existing merged `error` alias for compatibility, documenting it as legacy. **Alternative:** Publish an explicit host/forwarded-parts matrix if composite error reach is intentionally narrower. **Migration risk:** Low for additive forwarding; high if removing/repointing the existing merged error selector, which can style ordinary guidance today.

## CSS-09. Equivalent composite surfaces/actions have uneven forwarding boundaries

**Classification: additive reach/consistency opportunity; medium priority. Existing host-part descriptions are not false.**

**Comparison:** Split-view exposes both button hosts and native action controls (`packages/elements/src/split-view/template.ts:28-30`); dialogs forward the internal button control as `close` (`packages/elements/src/dialog/template.ts:35-38`). Presence-group exposes only its `en-button` host as `overflow` (`packages/elements/src/presence-group.ts:13,52`). Data-table exposes its pagination host but forwards none of pagination's actual `control`, `previous`, `page`, or `next` parts (`packages/elements/src/data-table/element.ts:160-161`; compare `packages/elements/src/pagination/template.ts:51,56,66`).

Data-table also exposes `<en-table part="surface" exportparts="viewport">` (`packages/elements/src/data-table/element.ts:152`). The actual bordered table box is `part="base"` inside the nested table (`packages/elements/src/table/template.ts:11-12`; `packages/elements/src/table/element.ts:14`), and owns radius/fill/border (`packages/styles/src/table.ts:15-20`). Consequently `::part(surface)` reaches its host, while the actual paint box is unreachable through parts; custom properties still inherit across that boundary.

**Preferred normalization:** Establish “host/container plus scoped native surface/control” forwarding for owned composites. Add `overflow-control`, `pagination-control/previous/page/next`, and `table-surface` (`base:table-surface`) without changing existing host parts. **Alternative:** Intentionally support tokens only for nested internals and document that boundary consistently across composites. **Migration risk:** Low for additions; high for repointing existing `surface`/`overflow` names because host layout and inner paint are different boxes.

## CSS-10. Equivalent exact editors and padding hooks use several naming grammars

**Classification: design-system naming debt; lower priority.**

**Comparison:** The same small nested exact-value text field appears as `editor-field` host + `editor` native input in color-slider (`packages/elements/src/color-slider.ts:14-15,87-88`), `field` + `input` in wheel (`packages/elements/src/color-wheel.ts:21-22,161`), and `channel-field` + `channel-input` when the slider is forwarded by plane/picker (`packages/elements/src/color-plane.ts:27-28,93`; `packages/elements/src/color-picker/element.ts:34-35,231`). The channel prefix meaningfully scopes repeated children; wheel's unscoped vocabulary is the unnecessary divergence.

Padding custom properties also switch axis order: control/input/button and option expose `*-inline-padding`/`*-block-padding` (`packages/tokens/src/overrides.ts:20,23,30`), while editor-token uses `*-padding-inline`/`*-padding-block` (`:8`; `packages/elements/src/token-editor/element.ts:32-33`) and table-cell uses the latter (`packages/tokens/src/overrides.ts:39`).

**Preferred normalization:** Pick a written grammar before adding more hooks: reserve `control` for the principal interaction surface, use `editor-field/editor` for ancillary exact editing, and permit role prefixes on forwarding; offer additive wheel aliases. Pick one axis order for future hooks and document compatibility aliases for old names, with an explicit precedence when both are authored. **Alternative:** Keep all names but ship a generated cross-family role matrix and call out the exceptions. **Migration risk:** Low for aliases/documentation; high for renames/removal. Do not mass-rename `base/surface`, `body/content`, or `footer/actions`: current instances often represent genuinely different region ownership or semantic purposes.

## Important deliberate differences and coverage limits

- **Precedence needs a policy, not an indiscriminate rewrite.** Shared `--en-control-inline-padding` intentionally wins over input/button-family padding (`packages/styles/src/controls.ts:13`; `packages/styles/src/internal/button-rules.ts:5`; documented `packages/styles/README.md:128-132`). Card likewise preserves shared-surface-over-card fill precedence (`packages/styles/src/surfaces.ts:19`; `packages/elements/src/card/element.ts:10-11`). Option-list-specific overrides instead refine shared overlay fallbacks (`packages/styles/src/commands.ts:8-11`). This is a learning cost, but the first two are explicit compatibility contracts. Prefer a published precedence table and one convention for new APIs; changing existing order needs versioned migration.
- Button broad background pins deliberately pin hover/pressed paint (`packages/styles/src/internal/button-rules.ts:18,29-30`; `packages/styles/README.md:201`). Do not label missing button per-state tokens a defect merely because option rows have them.
- Range thumbs intentionally suppress the global rectangular halo (`packages/styles/src/internal/range.ts:28-32,45-49`). Wheel's simpler outline (`packages/styles/src/color-wheel.ts:13`) is a focus-normalization decision, not enough evidence alone for a defect. Pointer-only plane is intentionally absent from the accessibility tree (`packages/elements/src/color-plane.ts:17`), so it should not be assigned a keyboard focus contour just to match wheel.
- Reviewed CSS sources, token reset/sizing helpers, selected element annotations, templates and exportparts. This was not a browser-computed-style test or an exhaustive generated-manifest reconciliation; precise device/render effects are inferred from stylesheet order and should be verified before implementation. No runtime/browser checks or generated builds were performed.
- Root/content/actions names and slot boundaries were sampled across fields, actions, cards/dialogs, chat, tables, color controls and composites. Preserving application-owned slotted content and purpose-specific `footer`, `actions`, `tools`, `palette`, or `recent` slots is preferable to a global synonym rename. The strongest slot-related issue in scope is the editors' familiar `label` slot without a matching label part (CSS-03).
