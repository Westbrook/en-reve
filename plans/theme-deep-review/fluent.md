# Fluent 2 deep fidelity review

Review date: October 3, 2026. Implementation checkpoint: clean main `df59c9e8` in `/private/tmp/en-reve-initial-pass-closeout`. This is source/implementation review, not a new rendered verification receipt. No builds or browser suites were run by this audit.

The review deliverables and proposed implementation now live in the independent checkout `/private/tmp/en-reve-inspired-review-20261003`; the original checkpoint is retained above for provenance.

## Assessment

The Fluent theme already goes substantially beyond palette and border changes: it carries source-informed type ramps and tracking, distinct field/action/card shapes, compact control density, two-layer elevations, three independent surface timing profiles, option/focus anatomy, choice and switch dimensions, and four button variant state recipes. It is **not yet defensible to describe the entire result as maximally embodied Fluent component design**. The most material remaining gaps are field/choice typography, independent field edge treatment, switch geometry and state feedback, indeterminate-checkbox anatomy, and dialog-specific typography/layout.

The existing theme deliberately combines the Fluent website's rose/neutral identity with product component anatomy. `definitions.json` still calls it “Website light and dark”: 12px actions and 22px cards come from the website; 4px fields, 16px choices and 40×20px switches come from Fluent Web Components. Preserve that explicit identity, but use component sources to assess component fidelity. The website's editorial styling is not a justification for ignoring product-specific input, label, dialog or selection anatomy. Conversely, switching the whole theme to product-default blue/4px would silently change its declared visual identity.

## Source basis

The following official guidance was reopened on October 3: [typography](https://fluent2.microsoft.design/typography), [layout](https://fluent2.microsoft.design/layout), [elevation](https://fluent2.microsoft.design/elevation), [motion](https://fluent2.microsoft.design/motion), and component usage for [button](https://fluent2.microsoft.design/components/web/react/core/button/usage), [input](https://fluent2.microsoft.design/components/web/react/core/input/usage), [field](https://fluent2.microsoft.design/components/web/react/core/field/usage), [switch](https://fluent2.microsoft.design/components/web/react/core/switch/usage), [checkbox](https://fluent2.microsoft.design/components/web/react/core/checkbox/usage), [dialog](https://fluent2.microsoft.design/components/web/react/core/dialog/usage), [tablist](https://fluent2.microsoft.design/components/web/react/core/tablist/usage), [nav](https://fluent2.microsoft.design/components/web/react/core/nav/usage), and [menu](https://fluent2.microsoft.design/components/web/react/core/menu/usage).

Precise Web Components anatomy uses the previously pinned Microsoft source commit `babf26015958505fc6fc0216724f2f61244f829c`, package `@fluentui/web-components` 3.1.2. Retained button, checkbox, switch and dialog captures in the original checkout were rehashed and match all four entries in the current main branch's `tooling/theme-candidates/reference-sources.json`. Fresh GitHub/raw fetches returned cache misses, so this audit does **not** claim a newly downloaded latest implementation or current deployed Storybook version. The [earlier WC investigation](../theme-refresh-fluent2-web-components.md) supplies field/dialog-body details and direct historical combobox measurements; those are separately identified below.

Website style identity remains the dated, hashed September 20 evidence in [the website refresh report](../theme-refresh-fluent2.md). That report's claims about unavailable tracking, elevation or companions were superseded by [API adoption](../theme-inspired-adoption.md); they must not be copied into a new gap list.

## Delivered coverage

| Dimension | Current implementation and fidelity |
| --- | --- |
| Typography | Segoe/system fallback family; 14/20 controls, 16/24 reading text, 24/32 and 32/40 headings, 68/92 display with −2.72px tracking; separate Cascadia/Menlo code family. Website editorial hierarchy is deliberate. Font installation remains application-owned. |
| Geometry and density | Compact 32px baseline; 12px button corners, independently pinned 4px field corners, 8px popup corners, 4px option corners, 22px cards, 6px search-derived modal corners; 16px choice and 40×20px/14px switch. Visual dimensions do not reduce protected interaction targets. |
| States and variants | Trusted companion independently maps primary/secondary/ghost/danger rest/hover/pressed colors. Navigation current/hover/pressed and tab selected/hover/pressed are separate public roles. Option keyboard activity retains a contour distinct from selection. |
| Focus and motion | Immediate contrasting focus; 2px field bottom accent with 200/50ms focus timings; 100ms stationary action press/release; popup 200/150ms, dialog 250/250ms, toast 200/150ms. Reduced motion and forced-color branches exist. |
| Elevation | Distinct popup, dialog and toast elevation, with independent light/dark shadow layers. Website popup single-layer shadow is intentional; product popup's ambient+key pair is retained separately in `shadow.overlay`. |
| Portable delivery | Typed trusted baselines and companion sidecars, build-bound reopening, auto/light/dark appearance and nested boundary exclusion. No source-private class selectors or implicit font/network loading. |

Relevant current files are `tooling/theme-candidates/definitions.json`, `inspired/fluent.{light,dark}.json`, `packages/tokens/src/authoring.ts`, `packages/styles/src/controls.ts`, `internal/description.ts`, `internal/surface-motion.ts`, `navigation.ts`, `selection.ts`, and `overlays.ts`.

## Prioritized gaps and concrete changes

### P1 — field and choice hierarchy still uses generic strong labels

Fluent's field label is regular 14/20, with helper/validation text 12/16 in the pinned WC inspection. Current `.en-label` inherits `font.label-strong.weight` (600), and `.en-description`/`.en-error` use UI size and body line-height, yielding 14/21 for this theme. A field therefore looks heavier and its support text less differentiated than the source even though its input dimensions are close. The official [type ramp](https://fluent2.microsoft.design/typography) independently confirms body1 and caption1 metrics; detailed label role selection is from [WC Field source](https://github.com/microsoft/fluentui/blob/babf26015958505fc6fc0216724f2f61244f829c/packages/web-components/src/field/field.styles.ts), recorded by the earlier audit.

**Immediate change:** add `choice` and `field` companion rules assigning `--en-font-label-strong-weight` to `font.ui.weight` (400). Existing trusted companion syntax supports these targets and semantic typography roles; no global label-weight change is necessary. Verify native field labels too: the current `field` companion targets native input classes, not their label-containing wrapper.

**Shared API follow-up:** connected field-label and field-message typography roles allow 14/20 and 12/16 without shrinking input text, strong buttons, metadata or editorial body. Wire descriptions and errors consistently, retain slotted rich-description content and disabled-label legibility. Do not hack global UI size to obtain small helpers.

### P1 — switch thumb inset is inherited from a larger default silhouette

The [pinned switch](https://github.com/microsoft/fluentui/blob/babf26015958505fc6fc0216724f2f61244f829c/packages/web-components/src/switch/switch.styles.ts) has a 40×20px border box, 1px stroke, centered 14px thumb and 2px inline padding. Our recipe pins the same outer/thumb sizes but leaves `space.switch-inset` at 3px from the base 40×24/16 geometry. `.en-switch::before` uses that inset on both axes, so the thumb's vertical placement and travel are not derived from the chosen silhouette.

**Immediate change:** pin `space.switch-inset` to 2px in both modes. Check actual pseudo-element position in LTR/RTL and small/medium/large inherited sizes: the fixed family dimensions must not be paired with independently scaled insets that lose centering. Prefer centered block-axis positioning if dimensions become freely variable. This is a source-derived geometry correction, not a request to reduce hit areas.

### P1 — switch and checkbox state anatomy is still largely shared default styling

Source switch rest is a transparent track with accessible neutral stroke; hover/press update track/stroke/thumb roles, and checked interaction changes compound-brand fill and inverted thumb ink. Current switch uses a subtle filled rest track; checked fill/thumb stay unchanged on hover; press chiefly changes the border. The actual checked fill is neutral `color.action`, while selected radio already uses rose `color.action-text`. Source checkbox indeterminate renders a brand-colored half-size square inside the unfilled box; ours renders a fully filled box and white horizontal dash. The 16px size and 2px corner alone do not reproduce this anatomy. [Switch source](https://github.com/microsoft/fluentui/blob/babf26015958505fc6fc0216724f2f61244f829c/packages/web-components/src/switch/switch.styles.ts), [checkbox source](https://github.com/microsoft/fluentui/blob/babf26015958505fc6fc0216724f2f61244f829c/packages/web-components/src/checkbox/checkbox.styles.ts).

**Change:** add bounded per-family unchecked/checked/indeterminate paint and mark roles plus an explicit indeterminate mark presentation. A Fluent recipe can retain rose branding while restoring neutral rest anatomy, visibly responsive checked states and source mixed-state geometry. Apply the same contract to native and custom controls and preserve disabled/forced-color rules. Do not fake these via global action pins that recolor every CTA.

### P1 — input perimeter and bottom stroke remain one contour

Modern Fluent WC inputs/dropdowns distinguish neutral top/side strokes, an accessible bottom stroke, hover states, invalid states and the animated 2px focus underline. Current input radius and normal/hover/invalid border hooks are delivered, but one `border-color`/width cannot reproduce independent edges. Source-backed immediate focus plus underline is already present and must be preserved. [Pinned dropdown source](https://github.com/microsoft/fluentui/blob/babf26015958505fc6fc0216724f2f61244f829c/packages/web-components/src/dropdown/dropdown.styles.ts), [recorded direct measurements](../theme-refresh-fluent2-web-components.md).

**Change:** add an optional block-end stroke role, independent of perimeter and focus accent, with rest/hover/invalid handling. Use a paint layer that does not change layout or compete with native input editing. Verify text field, textarea, select and combobox frames, including invalid+focus and forced colors. Neutral/rose choices remain recipe decisions; layer separation is the essential source feature.

### P2 — dialog-specific type, spacing and movement are only partially adopted

The pinned WC modal has 24px content padding, 20/28 semibold title, 14/20 body and a .85 entry scale over 250ms; current generic dialog inherits website `space.panel=32px` and `en-heading-small=24/32`, and all surface scale stays 1. It does have the correct independent 250ms timing and layered elevation. Matching timing alone is not full motion/anatomy fidelity. Header/footer persistence and body scrolling already exist; preserve them. [Dialog source](https://github.com/microsoft/fluentui/blob/babf26015958505fc6fc0216724f2f61244f829c/packages/web-components/src/dialog/dialog.styles.ts), [recorded dialog-body source analysis](../theme-refresh-fluent2-web-components.md), [current guidance](https://fluent2.microsoft.design/components/web/react/core/dialog/usage).

**Change:** introduce bounded dialog title/body and padding roles or a supported dialog companion target; preserve editorial headings outside the dialog. Add family-specific surface transforms before claiming source .85 dialog motion; do not assign .85 globally to menus/tooltips. Keep 6px website-search corners versus product 8px disclosed unless the target is deliberately changed.

### P2 — existing independent navigation/tab roles are not fully source mapped

Navigation hover remains `{color.surface-subtle}`/`{color.text}`, despite the retained website evidence of rose hover. Tab selected ink uses `{color.action-text}` but its indicator uses neutral `{color.action}`, while the adoption report describes a brand underline. These are recipe gaps, not missing API.

**Change:** map navigation hover to the recorded `component.option.hover-background/color` where the website source establishes the same treatment; map tab indicator to the chosen rose action-text role if retaining the documented brand underline. Add literal source-value assertions rather than asserting only equality with whatever the recipe currently emits.

The product's non-wrapping tablist with overflow, and current-nav indicator propagation to a collapsed category, remain component/composition differences. Do not implement them as hidden semantic changes triggered by a theme. [Tab guidance](https://fluent2.microsoft.design/components/web/react/core/tablist/usage), [nav guidance](https://fluent2.microsoft.design/components/web/react/core/nav/usage).

### P2 — card interaction and source variant breadth need explicit treatment

Current `component.card.shadow` is intentionally none, with no source-like tile hover elevation or material treatment. Source product buttons additionally distinguish outline/subtle/transparent appearances and compound/menu/split action compositions; the four host variants are a useful mapping, not a complete Fluent vocabulary. The focused [menu-width correction](fluent-menu.md) maps the source 138px minimum, 300px maximum and intrinsic max-content width through optional ordinary-menu hooks. Qualification evidence is recorded in [verification-20261003.json](verification-20261003.json); this mapping does not establish a passing execution result. [Elevation guidance](https://fluent2.microsoft.design/elevation), [button usage](https://fluent2.microsoft.design/components/web/react/core/button/usage), [menu usage](https://fluent2.microsoft.design/components/web/react/core/menu/usage).

**Change:** add scoped interactive-card hover elevation only to actual actionable cards, demonstrate compound/split/menu actions using existing component contracts, and retain the menu-specific width inputs. Avoid making every content card hoverable or introducing homepage gradients as a universal product surface.

## Adaptations that should remain explicit

- Preserve synchronous cancelable transactions, native input editing ownership, explicit registration, SSR snapshot parity and protected touch/keyboard target floors. Source theme fidelity does not authorize changing these behavioral contracts.
- Segoe is not redistributed; fallback text is not pixel-identical to installed Segoe. Opaque popup material and stronger boundaries can remain accessibility/portability adaptations.
- Website option rose fills/selected weight differ from WC neutral checkmark-only selection. Keep keyboard-active and selected meaning separate regardless of which appearance is selected.
- The official elevation article and actual website/package shadow values disagree. Preserve the existing consumed-value provenance, rather than claiming the two are identical.
- Brand-neutral CTAs, 22px editorial cards and rose navigation are intentional website identity. Regular field labels, caption helpers, switch/checkbox mark geometry, bottom-edge inputs and dialog hierarchy are product component features worth matching within that identity.

## Required focused evidence before stronger claims

Extend the existing reproducible theme browser coverage with actual source expectations for: field/choice label weight and support text; switch centering/travel across sizes, RTL, checked/unchecked/disabled/hover/held; checkbox mixed-state shape; input edge paint under hover/focus/invalid; dialog title/padding/body scroll and reduced motion; brand tab underline and navigation hover; native/custom parity and nested full-theme isolation. Reopening and compiler passes prove delivery integrity, not source equivalence. Manual assistive-technology acceptance remains unperformed by this audit.

## Integrated source handoff

The coordinator registered and applied the following mappings, visible at committed source checkpoint `98bed824`. This source disposition does not establish rendered qualification:

- `fluent-update.py` changes only the Fluent definition: regular label-weight companions, fixed 2px switch insets across sizes, 200ms switch timing, rose navigation hover and tab indicator. Its optional `--with-presentations` branch uses the incoming shared engine for 12/16 helpers/errors and component-specific dialog type/spacing.
- `packages/tokens/src/companion/fluent.ts` adds finite trusted `bottom-edge`, `mixed-square`, and `stateful-track` presentations over public Parts and native helpers. It does not register itself or modify shared state/editing behavior. Rest/hover/held/disabled paints are explicit, hover is capability-gated, and author paint is excluded in forced colors. The mixed square receives a system-color fallback because its geometry replaces the default dash border.
- `fluent-anatomy-update.py` provides compatible typed roles and rules after registration. Neutral field and choice state values match the pinned Fluent token table. Filled choices use the established rose palette: light selected/hover/held `#a63f50 / #954355 / #682f3d`; dark `#fd9fb0 / #fad6dc / #db7488`. The rose assignment is an explicit adaptation of Fluent's compound-brand state roles, not a claim that product-default blue or the website literally uses these complete switch recipes.

The shared surface-motion consumer clamps scale to `.95`, so proposed dialog entry uses `.95` as an explicitly bounded approximation of upstream `.85`. It is inaccurate to claim exact scale parity. The new bottom edge defers to native/host invalid and disabled states rather than overriding error contours; focus remains owned by the existing full contour and animated accent. Native compound fields and custom-validity cases require focused verification. The sectioned dialog maps the source's 24px inset and hierarchy into En Rêve's existing slots; exact section padding is a composition adaptation.

Both Python files were syntax-parsed without execution by the source reviewer. The coordinator subsequently registered the module and applied the definition mappings; the reviewer's original handoff did not generate output or change historical evidence. Runtime acceptance remains pending.

The follow-up `fluent-native-field / field-text` presentation closes native label/supporting-text parity over the public `.en-field`, `.en-choice` and `.en-choice-content` helpers documented in `packages/styles/README.md`. It targets their immediate `.en-label`, `.en-description` and `.en-error` children, excludes a new full-theme boundary on each child, and assigns only label weight 400 and supporting text 12/16/400. It does not replace error colors, input typography or strong-action typography. Its typed roles/rule are present in the integrated definition; no shared target or style API was modified.

The final edge review replaces raw validity guards with the documented `control-invalid`, `stepper-invalid` and adorned `focus-frame-invalid` Parts, which follow visible feedback. A pristine required control therefore retains its ordinary bottom edge. Native recipes defer on explicit `aria-invalid`, `data-invalid` compound frames or `:user-invalid`; native number frames inspect the editor rather than bound-disabled step buttons. Custom error edges explicitly override both ordinary and hover bottom paints through the existing invalid-color hook. Focus geometry, error semantics and editing remain component-owned. This last correction requires no recipe regeneration beyond the normal compiler build and has not been browser-tested by this agent.

## Slider source mapping handoff

`fluent-slider-update.py` provides an idempotent, in-memory `update(definition)` for the coordinator's serial application. It has no apply command and performs no file I/O. It updates only Fluent source tokens and its `source-slider / filled` rule; the reviewer has not executed it or run tests. The source is the installed, pinned `@fluentui/react-slider` **9.6.5**, resolved by the `@fluentui/react-components` **9.74.7** showcase, specifically `lib/components/Slider/useSliderStyles.styles.raw.js` and `useSlider.js`. Neutral values come from the installed `@fluentui/tokens` **1.0.0-alpha.24** `alias/lightColor.js`, `alias/darkColor.js` and global color/radius tables. These React sources are supplemental evidence, distinct from the earlier WC 3.1.2 captures. The [official Slider guidance](https://fluent2.microsoft.design/components/web/react/core/slider/usage) separately establishes horizontal/vertical, default/step and labeled pointer/keyboard/touch behavior; it is not the source of pixel metrics.

| Role | Source small | Source medium/default | En Rêve large adaptation |
| --- | --- | --- | --- |
| Track thickness | 2px | 4px | 4px |
| Circular thumb diameter | 16px | 20px | 20px |
| Outer neutral border | 0.8px | 1px | 1px |
| Total surface rim, including outer border | 3.2px | 4px | 4px |

The source paints a colored center with an inset surface ring and an overlaid outer border. The finite renderer reconstructs that geometry with a CSS border plus an inset spread of `rimWidth − borderWidth`, leaving a 9.6px small or 12px medium center. Track radius is 8px; thumb radius is circular. There is no outer drop elevation or source paint tween. Hover, keyboard focus and disabled states inherit the rim rather than replace it with an empty state shadow. The source's small/medium minimum root heights are 24/32px, while En Rêve retains its protected interaction targets and existing scalar/range semantics.

Light/dark neutral roles are exact source values: ordinary rail `#616161 / #adadad`, thumb border `#d1d1d1 / #666666`, surface rim `#ffffff / #292929`, disabled rail `#f0f0f0 / #141414`, and disabled fill/thumb/border `#bdbdbd / #5c5c5c`. Disabled opacity stays 1 because these source roles already encode the disabled appearance. Filled rail and thumb center share the established rose compound-brand rest/hover/pressed adaptation: light `#a63f50 / #954355 / #682f3d`, dark `#fd9fb0 / #fad6dc / #db7488`. The unfilled rail and outer border remain neutral during interaction.

Disclosures: Fluent has no large source slider profile, so large explicitly repeats medium. The rose palette is the retained website identity rather than Fluent product blue. The source's single-value slider does not establish a literal two-thumb interval implementation; the interval control shares this presentation while retaining En Rêve's transactional behavior. Protected target floors, thumb-owned keyboard focus, native CSS-helper fill updates and forced-color behavior remain shared En Rêve contracts. The recipe does not claim parity for source step tick marks or whole-control focus geometry. Browser qualification is coordinated separately.
