# THEME-02: family membership and fallback contract v2

This implements the complete THEME-02 decision: narrower customization supplies a
refinement, shared values supply defaults, and segmented geometry stays local
unless a group explicitly requests a common minimum. The user authorized this
implementation on 2026-09-18. It changes the previously documented broad-pin
precedence and must be included in the next breaking release/migration notes.
Package versions remain at the project's current review version until release
coordination; a review build is not a claim that a release has been published.

## Resolution contract

Resolve each custom property with the ordinary CSS cascade and inheritance first.
Then the consuming declaration selects the first supplied value in this order:

1. Instance/Part refinement of the applicable family property.
2. Inherited family property.
3. Applicable shared group property.
4. Semantic role, including the selected size/density output where applicable.
5. Generated literal fallback for standalone styles.

Steps 1 and 2 concern the **same property name**. There is no synthetic instance
priority above CSS: normal selector importance, layers and specificity still apply.
A local shared property does not beat a differently named inherited family
property. `!important` on the shared variable does not reorder `var()` fallbacks.
Direct `background`, `padding` or other declarations on documented Parts remain
an ordinary CSS escape hatch, subject to state/accessibility rules.

Full child themes reset optional pins. Partial themes retain unspecified pins.
Explicit geometry pins are fixed across sizes, not multipliers; semantic fallbacks
continue to select the current size/density. No compiler/reset or @property policy
is changed by this work. THEME-01 owns that machinery and derives its registry
consumer information from the final source.

## Family membership by concept

Membership is specific to the concept. Sharing geometry does not require sharing
paint or state semantics. Here `family → shared → role` is highest priority first.

| Family / consumers | Paint membership | Geometry membership and exceptions |
| --- | --- | --- |
| Inputs: text, search, date, textarea, select, number editor, color text editor, combobox | `input.background/color → control.background/color → surface/text` | `input.inline-padding → control.inline-padding → selected control-inline`; `control.radius → selected control radius`. No new input-radius hook is introduced. |
| Number compound field | The stepper wrapper uses the input background chain; the editor stays transparent and receives input text color. | Editor uses input padding; wrapper uses shared control radius. Step buttons keep specialized insets and inner corners. |
| File upload dropzone | Same input background/color chain. Dragging/disabled states retain their state paint. | Now also uses input padding before shared padding; shared radius remains the fallback. Native invisible file input and remove action are separate surfaces. |
| Text buttons, including the leaf and aggregate stylesheets | `button.background/color/border-color → variant semantic action roles`; neutral control paint does not replace filled actions. | `button.inline-padding → control.inline-padding → selected control-inline`; `button.radius → control.radius → selected control radius`. |
| Icon-only buttons | Button paint/focus semantics. | Button/shared radius chain applies, but symmetric icon insets and equal-sided target geometry ignore text-button inline-padding. Legacy icon recipes keep their specialized padding. |
| Options: listbox, menu, command and combobox rows | Existing option state hooks refine broad option paint where the state recipe supports them; selected, disabled, focus and forced colors stay distinct. | Option radius remains family-local/contextual; popup rows retain concentric corners derived from the list radius. Control radius does not flatten those relationships. |
| Surfaces: panel/card | Card: `card.background → surface.background → surface`; panel: `surface.background → surface`. Surface text uses `surface.color → text`. | Shared surface padding, border and radius apply to panel/card. Inset media retains its derived parent/child geometry. |
| Overlays: dialog, drawer, popover, tooltip | `overlay.* → overlay semantic roles`. | Overlay hooks preserve dialog/container/control defaults appropriate to the target. |
| Option-list surfaces: native select picker, combobox popup, menu, token picker | `option-list.* → overlay.* → semantic role` for the properties with a shared overlay counterpart. | List radius/padding/border/color/max-block-size retain their existing fallback chains. Padding retains focus-clearance floors; row radius remains concentric. |
| Segmented control frame/options | Dedicated frame and selected-option semantic paint, independently of input/button paint. | Frame inset belongs to this family only. Shared control radius provides the outer radius; inner corners subtract frame/border distance. Individual option target floors remain enforced. |
| Range thumbs/tracks | Native range action/boundary/state roles, not neutral control paint. | Pill radius, thumb dimensions and target floors remain specialized; input editor beside a range remains an input-family member. |
| Calendar cells | Calendar/selection state roles, not ordinary button background. | Day-cell geometry and range endpoints remain specialized; navigation buttons follow their button recipe. |
| Checkbox, radio, switch, rating | Selection/state roles remain distinct. | Choice/pill/star geometry remains distinct. Shared control radius is not a universal radius. |
| Focus, all supported families | Family focus hooks fall back to shared focus roles. | Immediate contour, optional halo, clipping clearance and forced-colors rules retain their existing contracts. |

The table declares the existing state capabilities; it does not introduce the
new button state hooks proposed by THEME-03 or fix separate coverage findings.

## Changed precedence

| Property | Previous contract | Contract v2 |
| --- | --- | --- |
| Input background/color (including number wrapper and upload dropzone) | Shared control first | Input first, shared control second |
| Input padding, including combobox trigger clearance | Shared control first | Input first, shared control second |
| Upload dropzone padding | Shared control only | Input first, shared control second |
| Text-button padding | Shared control first | Button first, shared control second |
| Button radius | Button then semantic; shared control radius was overwritten | Button then shared control then semantic |
| Card background | Shared surface first | Card first, shared surface second |
| Shared-scope segmented inset | Could enlarge unrelated text controls | Enlarges segmented frames/options only |

No new public variable names are added. Shared control paint intentionally does
not become the background of filled buttons. Disabled, dragging, selected,
invalid, focus and forced-color declarations still have their existing precedence.

## Migration examples

A theme can now supply a shared default with a local exception directly:

```css
.workspace {
  --en-control-background: #eee;
  --en-control-inline-padding: 1.5rem;
  --en-control-radius: .75rem;
}
.special-field {
  --en-input-background: #ede9fe;
  --en-input-inline-padding: .75rem;
}
.compact-action {
  --en-button-inline-padding: 1rem;
  --en-button-radius: .375rem;
}
```

For an old theme that intentionally forced the broad value over family settings,
author the intended value on those family properties at the affected consumer
scope, or remove the conflicting family pins. For example:

```css
.legacy-input {
  --en-input-background: var(--en-control-background);
  --en-input-color: var(--en-control-color);
  --en-input-inline-padding: var(--en-control-inline-padding);
}
.legacy-button {
  --en-button-inline-padding: var(--en-control-inline-padding);
}
.legacy-card {
  --en-card-background: var(--en-surface-background);
}
```

These aliases assume the broad property is supplied. Apply them at the intended
host/Part scope: descendant declarations of the same family variable still obey
normal CSS, so an ancestor alias is not an authoritative override of every child.
If the desired behavior is simply to use the shared fallback, clear the family
property with `initial` at that consumer (under the default untyped registration
contract); removing a local declaration instead reveals any inherited family pin.

Buttons now inherit shared control radius when they have no button radius pin.
To retain the previous button shape while changing field corners, explicitly set
`--en-button-radius` on the button family to the intended value. Do not replace
choice, range, calendar or inset geometry with a universal radius value.

A larger segmented inset no longer resizes unrelated fields and buttons:

```css
.workspace { --en-segmented-control-frame-inset: 1rem; }
```

For deliberate alignment, put a common **minimum**, large enough for the framed
options, on an explicit application group:

```css
.aligned-toolbar {
  --en-segmented-control-frame-inset: 1rem;
  --en-control-min-size: 6rem;
}
```

This example accommodates the default fine/coarse targets and typography with a
1rem inset; it is not a universal exact height. Larger type, wrapped labels or a
larger frame can still grow. Scope the group narrowly, use matching control sizes,
and check its actual content. The existing shared minimum is the opt-in mechanism;
there is no global alignment side effect and no extra registry property.

## Verification and coordination

`packages/styles/tests/theme-cascade` exercises real shadow components and native
recipes in Chromium, Firefox and WebKit: local/inherited/Part overrides, absent
hooks, semantic fallbacks, full/partial theme boundaries, number stepping, combobox
clearance, invalid-border compensation, fixed pins across sizes, segmented
isolation, explicit alignment, touch targets, action paint and forced colors.

Run after building tokens, styles, primitives and elements:

```sh
npx playwright test --config packages/styles/tests/theme-cascade/playwright.config.ts
npx playwright test --config packages/styles/tests/action-leaves/playwright.config.ts
```

The earlier component-customization browser assertions are updated for family-first
paint. THEME-01 owns registry generation, registration settings, generated metadata
and the audit's published pages; regenerate those after integrating this work.
Historical audit evidence remains a record of the previous behavior. Release and
publication must be coordinated with THEME-01 rather than publishing either task's
incomplete combined checkout.
