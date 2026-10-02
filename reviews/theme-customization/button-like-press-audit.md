# Button-like controls: pressed-state coverage

Source audit: 2026-09-20, following whole-button correction `2333b1a`.

Implementation follow-up: [independent pressed-state families](button-like-press-implementation.md). The inventory below records the pre-expansion baseline.

Yes: several button-like controls should expose comparable pressed-state customization. Some already share the corrected button implementation; others only change a semantic background or border. The button motion roles are not a universal interaction API today.

This is a source audit and proposed follow-up scope. No runtime changes or new browser verification were performed for this report. Recommendations below are not implemented API names or accepted decisions.

## Current coverage

| Surface | Current held-state behavior | Customization and remaining gap |
| --- | --- | --- |
| `en-button`, including toolbar button children | Complete button scale/translation, pressed paint and shadow, separate press/release timing; popup-specific motion refinements | Existing button roles apply. Toolbar membership alone does not disable motion. An unstyled native toolbar button does not acquire the recipe automatically. |
| Pagination actions/pages, carousel navigation and thumbnail buttons, calendar previous/next | Use `en-button` or `.en-button` with shared button styles | Already receive inherited button motion. Their current-page/current-slide paint and indicators still need held-state combination checks. |
| Number-field increment/decrement | `.en-button` uses shared button appearance; a later stepper rule supplies its pressed background | Already receives whole-button motion. Joined field geometry makes a local stepper refinement/opt-out useful; it should not need a global change to every button. |
| Segmented choices | The complete label changes to `color.accent-subtle` while `:active`; selected and hover paint are separate rules | No segmented pressed paint, shadow, scale, offset or timing roles. The public `option` part can be styled manually, but this is not equivalent to a portable typed theme contract. |
| Tabs | `--en-tab-pressed-background`; selected background/color and indicator remain separately defined | No pressed foreground/border/shadow or family motion roles. `en-tab` renders a span inside the semantic host, so keyboard activation needs its own verification. |
| Accordion headers | Enabled native trigger changes to `color.accent-subtle` | No dedicated pressed family hooks; exposes the complete trigger as `control`. Good candidate for independent paint and optional surface motion. |
| Navigation links/disclosure summaries | `--en-navigation-pressed-background` | Dedicated background exists; foreground and non-color pressed refinements are missing. Current/open state must remain distinct from held state. |
| Combobox toggle | Native button changes to `color.accent-subtle` with `color.text` | No trigger-specific pressed roles. It is not `.en-button`, despite using button-family focus styling. Animate only this inset control, not the editable field. |
| Rating stars and clear option | Label target changes to `color.accent-subtle` | No rating pressed-state roles. Filled/checked artwork and hover preview need to remain legible during a press; optional target or star motion needs an explicit anatomical choice. |
| List/menu options, combobox options, tree rows, token-editor suggestions | Shared `optionPaint` supports pressed background and foreground, distinct from selected and keyboard-active paint | Existing `--en-option-pressed-background/color` cover paint. No option motion/shadow contract. Keep row motion opt-in, especially for drag/reorder and virtualized collections. |
| Calendar dates | Pressed tint via `--en-calendar-pressed-opacity`; single-date mode also consumes option pressed colors | Range mode intentionally preserves its range-band/endpoint painting. Motion must preserve contiguous range geometry; date cells are not shared buttons. |
| Checkbox, radio, switch | Enabled native input receives pressed border/inset feedback | Mostly semantic `color.action-pressed`, not family-specific pressed hooks. Switch thumb has checked-position animation but no pressed geometry contract. |
| Editable token chips | `--en-editor-token-pressed-background` on actual token buttons | Paint is independently themeable; no chip-specific motion or elevation. Noninteractive tokens should not receive a pressed affordance. |
| Select closed surface; range/color-plane controls | Select uses field/native-button presentation; custom range thumbs have no authored held-state rule in the inspected styles | Native platform behavior varies. Add field-trigger feedback or thumb/drag feedback separately; never scale the entire drag coordinate surface as a button. |

The shared recipe also reaches ordinary composed actions such as dialog close buttons and file-upload remove buttons that render `en-button`. It does not cross arbitrary shadow boundaries by selector: inherited custom properties reach internal consumers, while the document's variant-companion selectors do not automatically reach private buttons.

## Segmented-control anatomy

`en-segmented-item` is a noninteractive descriptor with `display: contents`. The parent owns the native radio, the visible label (`part="option"`), and its text container (`part="option-label"`). Both `.items` and child-authored choices use that parent template.

Therefore, a supported pressed effect belongs on the parent's complete option surface. Transforming `en-segmented-item` or `option-label` would recreate the content-only problem. Selection, focus, disabled state and activation must stay with the existing radio architecture.

Today an application can style `en-segmented-control::part(option):active` for pointer feedback. That escape hatch does not provide a typed theme role, automatic disabled-state guarantees, reduced-motion behavior, or consistent keyboard-held state. Those belong in the shared recipe and its tests. A parent `:active` selector must not animate every sibling choice.

## Recommended API direction

1. **Complete family paint coverage first.** Add dedicated pressed background/foreground/border/shadow refinements where the anatomy supports them, starting with segmented choices, accordion headers, combobox triggers and rating targets. Complete the partial tab/navigation contracts. Preserve current semantic fallbacks for existing themes.
2. **Share implementation, retain family decisions.** Extract the bounded scale/offset/timing/reduced-motion behavior into an internal helper consumed by explicit recipes. Offer family-specific motion hooks; do not make every interactive element consume `component.button.*`. A theme can deliberately map multiple families to common motion primitives without coupling all controls by default.
3. **Define the transformed surface and exceptions.** For a segmented choice, transform its complete option surface; for an accordion, its trigger; for a combobox, its toggle; for a switch, potentially its thumb. Joined controls, popup triggers and draggable rows need explicit, discoverable refinements or opt-outs. Keep resting layout stable, account for the transformed hit rectangle and focus outline, and retain accessible target floors.
4. **Keep held and persistent states separate.** `:active` means transient activation. `aria-pressed`, `aria-selected`, `:checked`, `aria-current`, expanded/open and a keyboard-active candidate have different lifetimes. Specify selected+pressed and checked+pressed combinations so feedback remains visible without erasing selection. Do not use ARIA as a visual-animation flag.
5. **Ship roles through the full authoring system.** Add token registration, validation/bounds, customization discovery and actual consumer mappings, element CSS-property documentation, exported CSS, and theme-editor controls together. Parts remain an escape hatch. Also document existing button-motion consumers such as number steppers and carousel thumbnails, whose behavior can be easy to miss.

The default theme already has authored held feedback on many of these surfaces, but it does **not** establish equally strong, independently customizable feedback everywhere. Default button scale is `1` and offset is `0px`; paint supplies its feedback. A CSS declaration alone does not prove perceptible contrast across every selected state, theme or forced-colors palette. That requires rendered comparison.

## Theme-specific recommendations

- **Astryx and shadcn:** retain the researched ordinary-button behavior and source-specific exceptions. Do not extrapolate a button recipe to tabs or segmented controls merely because they are clickable. The captured Astryx Button source excludes its ButtonGroup from press scaling; a contiguous segmented control warrants its own source comparison. The shadcn popup exception likewise should not become a universal rule for all theme families.
- **Fluent 2, Spectrum 2 and Radix:** use dedicated state paint/elevation where supported by their component references; add geometry only when the corresponding source component uses it. Component-specific fidelity is the criterion.
- **Vellum:** consider a shallow pressed shadow and restrained inset paint for segmented choices and disclosures, consistent with its paper treatment.
- **Signal:** consider crisp state-color changes and near-instant feedback on selectors, keeping indicators and joined edges aligned.
- **Kinetic:** consider stronger bounded compression on independent triggers and rating targets, with stationary joined frames and row geometry. Preserve full-target motion rather than animating text alone.
- **Holotable:** consider controlled luminance/border feedback for dense navigation and selection; avoid moving coordinate-based or drag surfaces.

These are design directions for a subsequent implementation, not new theme settings delivered by this audit.

## Verification required for implementation

Exercise native recipes and custom elements, including `.items` and child-authored segmented options; pointer down/hold/release and drag-out cancellation; native keyboard activation without assuming identical `:active` timing across engines; selected+pressed and disabled/loading combinations; popup exceptions; full-surface geometry and focus; reduced motion; forced colors; coarse pointers; and light/dark themes. Verify local family overrides do not affect sibling controls, exported themes reach shadow consumers through properties, and drag coordinate mapping remains stable.

Highest-priority implementation scope: segmented choices, accordion triggers, tabs and combobox toggles; then rating/toggle anatomy and documentation of already-covered composed buttons. Option rows and drag controls should receive carefully scoped refinements rather than universal button motion.

## Source evidence

- Selection paint and geometry (`packages/styles/src/selection.ts`), segmented parent template (`packages/elements/src/segmented-control/template.ts`), segmented descriptor (`packages/elements/src/segmented-item/element.ts`), tab template (`packages/elements/src/tab/template.ts`), accordion trigger (`packages/elements/src/accordion-item/template.ts`).
- Shared button rules (`packages/styles/src/internal/button-rules.ts`), button stylesheet (`packages/styles/src/buttons.ts`), native controls and steppers (`packages/styles/src/controls.ts`), radio rules (`packages/styles/src/internal/radio-rules.ts`).
- Combobox (`packages/styles/src/combobox.ts`), navigation (`packages/styles/src/navigation.ts`), shared option paint (`packages/styles/src/internal/option-paint.ts`), tree rows (`packages/styles/src/tree.ts`), calendar (`packages/styles/src/calendar.ts`), editor tokens (`packages/styles/src/token-editor.ts`).
- Pagination composition (`packages/elements/src/pagination/template.ts`), carousel composition (`packages/elements/src/carousel.ts`), carousel current-state paint (`packages/styles/src/carousel.ts`), number-field composition (`packages/elements/src/number-field/element.ts`), toolbar children (`packages/elements/src/toolbar/element.ts`).
- Typed theme roles (`packages/tokens/src/source.ts`), range anatomy (`packages/styles/src/internal/range.ts`), color-plane anatomy (`packages/styles/src/color-picker.ts`), [prior source research and verified button correction](theme-press-correction.md).
