# Pressed states: theme capability and default feedback

Implementation update: the [theme API implementation](theme-api-implementation.md) now adds stock typed button states, bounded content scale/offset, elevation and timing, group/popup opt-outs, and distinct default feedback across discrete families. Astryx uses .98 content scale and shadcn/Rhea uses 1px travel. The [authoring contract](theme-api-authoring-contract.md) explains the stable hit/focus geometry and verified limits. The audit below is retained as the **pre-implementation research checkpoint**.

Reviewed September 20, 2026. This supplements the [theme refresh findings](theme-refresh-report.md). It is a research/reporting follow-up; no theme or component behavior was changed.

**Pressed paint is supported today. Press scale, translation and elevation are possible through scoped CSS/Parts, but have no connected first-class theme roles. The default theme does not provide a distinct visible pressed response across all interactive elements.** Our inspired Astryx and shadcn/Rhea recipes consequently do not reproduce their reference button press movement. Supplying their duration/easing values alone does not create that movement.

## What “pressed” means here

This audit concerns the transient down state, normally native `:active`, during pointer activation or a held Space key. It is distinct from:

- `aria-pressed`: a toggle button's persistent on/off state.
- Selected/checked/current: retained selection, value or current page.
- `component.option.active-*`: the current keyboard candidate in a menu/combobox.
- Navigation `active-*`: current-page/hover paint in the existing navigation contract.
- Focus, expanded/open, dragging and surface entry/exit.

Those states can coexist. A selected button still needs its intended transient feedback; a checked switch moving its thumb does not prove it has a down-state treatment. Native Enter and Space activation also differ, so a synthetic persistent “pressed” flag should not be introduced merely to make animation tests pass.

## Supported authoring routes

| Need | Available today | Limit |
| --- | --- | --- |
| Primary action rest/hover/press fill | Typed semantic `color.action`, `color.action-hover`, `color.action-pressed` | Other variants use contextual paint. One semantic action ramp is not a complete variant-state design. |
| Button state fill and ink | `--en-button-{rest,hover,pressed}-{background,color}` | Six connected CSS hooks; CSS-only in the stock token source. A correctly typed `ThemeOptions.source` extension can make them managed. A scope-wide override affects every variant in that scope and can erase ghost/secondary/danger distinctions. |
| Option states | Typed `component.option.{rest,hover,active,pressed,selected,disabled}-{background,color}` | Disabled → pressed → hover → keyboard-active → selected → rest. Optional alias defaults emit `initial` in full theme CSS: a resolved authoring default is not proof of a distinct rendered default. |
| Calendar/editor-token press | `calendar.pressed-opacity`; editor-token pressed background | Calendar range/endpoint artwork remains specialized. These do not automatically affect other controls. |
| Scale or movement during press | Public `en-button::part(control):active` or a documented native recipe selector in application CSS | No connected pressed scale/offset theme hook. Arbitrarily naming a new typed token emits a variable without adding a consumer. CSS rules do not travel in the current JSON theme/review bundle. |
| Pressed elevation, edge or shape | Scoped public CSS/Parts | No dedicated pressed shadow/border-geometry role. Focus already owns/composes `box-shadow`; overrides must preserve it. Changing border width can shift content. |
| Timing | Existing generic duration/easing and focus/surface motion roles | The consumer must transition the relevant property. `motion.surface-scale` and offset style overlay entry/exit, not button press. There is no independent press/release timing contract. |

API evidence: button state consumers (`packages/styles/src/internal/button-rules.ts`), option precedence (`packages/styles/src/internal/option-paint.ts`), token source (`packages/tokens/src/source.ts`), customization registry (`packages/tokens/src/customization-data.ts`), and focus/shadow composition (`packages/styles/src/internal/focus-core.ts`). The code audit (`artifacts/pressed-state-audit/code-audit.md`) records exact consumer paths, existing regression assertions and the typed-source extension check.

## Default theme: where feedback is missing

| Family | Default transient feedback | Qualification |
| --- | --- | --- |
| Primary buttons | Separate pressed fill | No pressed scale, translation or elevation. Primary icon buttons share the treatment. |
| Secondary, ghost and danger buttons | No distinct down-from-hover paint | Later variant rules override the generic primary `:active` fallback. Existing state-paint regression tests explicitly preserve hover-equals-pressed for these variants. An explicit pressed hook can override them. |
| Compound/internal button actions | Depends on their actual consumer and variant | Close, previous/next, trigger and toolbar controls are often secondary/ghost. Shared button ancestry does not establish a distinct pressed response. |
| Number-field steps | No independent pressed default; additional hook-coverage concern | A later family rule supplies paint without shared button state slots. Verify non-hovered press and ink overrides rather than assuming generic button tests cover it. |
| Combobox trigger | Hover/focus, no authored press treatment | It has a separate trigger class; using the button focus family does not imply button state paint. |
| Menu, combobox, tree and similar options | Press hooks are connected; default pressed values fall through | Hover/selected/rest can remain unchanged during press. Native picker treatment additionally depends on the platform. |
| Calendar dates | Stronger down tint: .16 versus .10 hover | Preserves selected/range context. Forced colors deliberately removes the tint; assess that rendering separately. |
| Interactive editor tokens | Explicit press background | Hover and pressed semantic colors can be close; distinct declarations alone do not establish strong perceptual feedback. |
| Tabs, segmented controls, accordion triggers | Hover/selection/expanded/focus, no common press rule | Persistent selection after release must not be counted as transient feedback. |
| Checkbox, radio, switch, rating | Value/selection and focus, no authored transient press effect | Switch travel communicates a changed value. |
| Slider/color controls/splitter | Value/drag/focus feedback | Stable drag geometry is legitimate; these should not all inherit a button shrink. |
| Links, navigation and swatches | No common authored press treatment | Link-style buttons and ordinary text links are different consumers. |

This is a source inventory supplemented by a bounded rendered sample, not a claim of exhaustive manual testing of every component/platform. In particular, **rest → pressed can appear different only because hover already changed the paint**. Verification must compare hover → held press too, and repeat without hover for touch-capable contexts.

## Rendered verification

The measured findings (`artifacts/pressed-state-audit/rendered-findings.md`) and receipt (`artifacts/pressed-state-audit/rendered-receipt.json`) capture real pointer presses on the existing verified build, `sha256:cdb205a5aeff6a1e371fa4efeefb8ee8bd64de08b8792696e4d05a3674664f6b`. Chromium, Firefox and WebKit agree in light and dark:

| Button | Light rest → hover → held press | Dark rest → hover → held press |
| --- | --- | --- |
| Primary | `#2457d6 → #1f4dbf → #1a43a9` | `#aac1ff → #b1c6ff → #b7cbff` |
| Secondary, including icon-only | `#eef1f5 → #e7eeff → #e7eeff` | `#252c34 → #233657 → #233657` |
| Ghost | `transparent → #e7eeff → #e7eeff` | `transparent → #233657 → #233657` |
| Danger | `#fff → #eef1f5 → #eef1f5` | `#1c2127 → #252c34 → #252c34` |

Disabled/loading buttons remained unchanged. Chromium additionally measured number steps, selected/unselected tabs and segments, checked/unchecked checkboxes and switches, and menu items: none added paint or geometry feedback beyond hover during the held press. Ordinary links also lacked a measured additional press response across the three engines. No default sample changed scale, translation, transform, shadow, filter, opacity or captured border geometry between hover and press.

The receipt contains 68 pointer samples, two persistent-toggle comparisons, four keyboard samples and three CSS-part checks. Held Space activated the primary pressed fill; held Enter did not retain `:active` in this Chromium measurement. The completed measurements had no uncaught page errors. An initial probe incorrectly targeted the segmented control's visually hidden radio; the corrected full Chromium run targets its painted label, and the receipt retains that recovered harness issue.

A temporary scoped `en-button::part(control):active` rule successfully produced `scale: .98` plus `translate: 0 1px`, returning to normal on release. Guarding that application CSS with `prefers-reduced-motion: no-preference` suppressed movement under reduced motion. Removing the stylesheet restored the default behavior. This proves non-color customization through public Parts, without adding a theme-token consumer or changing the checked-in component/theme implementation. It does not establish support across every nested control or test coarse-pointer and forced-color behavior.

## Nuances from the reference themes

**Astryx:** the [pinned Button source](https://github.com/facebook/astryx/blob/413fa55281d1565abae8319e9803c8ccc639bc28/packages/core/src/Button/Button.tsx) combines `scale(.98)` with an interaction overlay. It excludes disabled/aria-disabled controls and deliberately omits the shrink inside ButtonGroup. Eligible button variants and buttons rendered as links share it; ordinary text links are not implied. Timing is 175ms with `cubic-bezier(.24,1,.4,1)`. Reduced motion sets duration to zero but retains the scale change. The paint overlay changes from approximately 5% to 10% opacity and composes over the particular variant surface.

**shadcn/ui Rhea:** the [pinned style](https://github.com/shadcn-ui/ui/blob/a87a63b2ca25143d26c8bd0903e4e9bc77b3f824/apps/v4/registry/styles/style-rhea.css) moves eligible `.cn-button` controls down 1px while active, excluding elements carrying `aria-haspopup`. Popup triggers therefore remain still. The shared rule does not define another active background; translation adds feedback on top of variant hover paints. Its wrapper uses `transition-all`; 150ms/ease is an overridable Tailwind default, not a newly measured production timing. No explicit reduced-motion override was found in the inspected button/Rhea/global files; that is not a claim about every stylesheet in the source application.

**Fluent 2 website:** its neutral CTA explicitly changes rest → hover → pressed from `#242424` → `#424242` → `#616161` in light and white → `#d6d6d6` → `#adadad` in dark. Those fills are already mapped in our Fluent primary-action recipe. That does not supply distinct pressed treatments to every other button variant.

**Radix Themes (added in the subsequent Radix audit):** the [pinned base-button styles](https://github.com/radix-ui/themes/blob/1faff10ac26ae17f09944d418c6949b93fc6b566/packages/radix-ui-themes/src/components/base-button.css) apply brightness/saturation filters to solid buttons and change classic inset elevation plus content padding. Open popup triggers suppress the ordinary `:active` effect. A filter changes the glyphs as well as the background; mapping only the resulting fill is an approximation. The [new recipe](theme-refresh-radix.md) records that difference and its dark-state contrast adaptation. This adds evidence for filter/elevation/content-surface composition beyond the original scale/translate proposals; it does not add these effects to the core API.

The reference audit (`artifacts/pressed-state-audit/source-audit.md`) and its hashed source manifest retain selectors, conditional behavior and evidence boundaries. Astryx/Rhea source declarations were rechecked; this pass does not claim new live interaction captures of those two external websites.

## Recommendations before the official API

1. **Make default feedback coverage an explicit release criterion.** Review every actionable family across rest, hover, held press and release. Fix the default secondary/ghost/danger gap and inspect internal actions. Choose appropriate feedback per family; universal movement is not the goal.
2. **Add bounded, opt-in press presentation roles.** Evaluate neutral defaults of scale 1 and offset 0, independent press/release timing, and composable elevation/border-paint roles. Existing number, dimension, duration, easing and shadow types cover the values; the missing work is consumer behavior and a stable public contract. Treat names as proposals until reviewed.
3. **Preserve the interaction frame.** Transform a decorative surface where feasible while keeping hit targets, focus contours, popup anchors and layout stable. A CSS transform can shrink the actual hit rectangle despite unchanged layout/min-size declarations. Define composition with existing positioning, drag and surface transforms, and guard disabled/loading/cancelled interactions.
4. **Support variant/family scope and portable companion rules.** Carry Astryx's grouped-button exception and Rhea's popup-trigger exception explicitly. A standalone `en-button::part(control)` rule does not penetrate every nested shadow root; account for forwarded Parts and separately authored controls. Keep export/reopen and scope-reset fidelity without executing arbitrary imported review CSS.
5. **Define reduced-motion and forced-color alternatives.** Removing transition duration and removing spatial movement are different policies. Retain recognizable non-spatial feedback when motion is suppressed. Compose pressed elevation with focus rather than replacing the focus halo.
6. **Test held states and expose coverage.** Assert actual scale/translate/shadow/paint while down, including Space, coarse-pointer, disabled/loading, cancellation, focus and selected-state combinations. Publish which hooks affect native, standalone, icon and compound controls. Keep a missing consumer distinct from an unused optional hook.

These are proposed implementation changes. The present follow-up adds evidence and recommendations; it does not claim the source press effects or comprehensive default-state coverage have been implemented.
