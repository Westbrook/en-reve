# Component and pattern gap implementation

September 20, 2026 · Implementation and verification record

The [component pattern laboratory](/component-patterns.html) exercises the additions under all six inspired themes and Vellum, Signal, Kinetic, and the default theme. It preserves component state when switching themes. [The implementation plan](component-gap-closure.md) retains the full agreed scope.

## Delivered contracts

| Review gap | Public delivery | Behavior and ownership |
| --- | --- | --- |
| Persistent toggles | `en-toggle-button`, `en-toggle-group`; `en-button[aria-pressed]` | Toggle buttons change persistent boolean/mixed state. Groups use stable string keys, single/multiple selection, optional empty selection and roving arrows. Plain buttons expose controlled pressed semantics without silently adding toggle behavior. Toolbar recognizes toggle buttons. |
| Tags and multivalue picking | `en-tag`, `en-multiselect` | Removal is a distinct action. Multiselect owns an array of keys and a separate search query, repeated named form entries, required/error validation, reset, readonly/disabled handling, filtering, keyboard selection and removal focus. Standalone tags emit remove intent; their owner removes them and chooses subsequent focus. |
| Checkbox groups and choice cards | `en-checkbox-group`, `choiceCardTemplate` | One aggregate form owner with native checkboxes, optional whole-card labels and repeated values. Interactive actions belong outside labels. Native radio/checkbox card recipe retains native form ownership. |
| Authored choices | `en-choice-option` | Toggle, checkbox, multiselect and finite selection collections accept direct authored metadata children, or `.items`. Authored children take precedence and live mutations update the options. Values must be unique and nonempty. Missing selected values remain visible as invalid state instead of silently submitting a replacement. |
| Context menus | `en-context-menu` | Reuses menu focus, typeahead, submenus, dismissal and action contracts. Right-click, ContextMenu/Shift+F10 and touch long-press expose the invoking target. `showFor(target, point?)` supports an ordinary explicit action as an alternative. |
| Confirmation | `en-dialog kind="alertdialog"` | Actual native modal surface receives alertdialog semantics, `description` and `initial-focus` id. Authors compose pending/error content and decide when confirmation succeeds. |
| Field groups | `en-text-field adorned`, `joinedFieldTemplate` | Prefix/suffix share a field frame; separately focusable help actions remain outside the label. Existing unadorned anatomy stays available. The joined-field recipe pairs a native field with adjacent, independently named actions. |
| Interval sliders | `en-range-slider` | Two independently named thumbs, stable Tab order, keyboard/RTL controls, clamped collision, minimum gap, exact numeric editors, repeated named form entries and reset. Step is anchored at min; effective max rounds down to the grid, and minimum gap rounds up to a realizable step. |
| Rich previews | `en-hover-card` | Reuses nonmodal popover semantics. Hover opens without stealing focus; pointer transit keeps the preview reachable; activation enters it. Escape and explicit close dismiss. Essential information must also be reachable outside hover. |
| Finite selection and overflow | `en-selection-collection`, `en-action-overflow` | Selection uses native checkboxes; per-key action slots and bulk actions are independent. Overflow measures actual action widths and disclosure width; resizing moves focus to the same action and opens its disclosure if needed. Neither introduces listbox semantics around interactive children. |
| Static and measured feedback | `en-alert announcement="none"`, `meterTemplate`, `en-progress-bar shape="circle"` | Static callouts do not announce. Native meter represents a quantity with thresholds. Circular task progress retains the native progress element as its accessible source. |
| Menubars and navigation | `en-menubar`, `navigationFlyoutTemplate`, `appShellTemplate` | Application commands use coordinated root menus and arrow keys. Website destinations use native links/disclosures and ordinary Tab navigation, including Escape focus restoration. Shell is responsive native landmarks. |
| Sheets | `en-sheet` | Native modal lifecycle plus discrete viewport-fraction snap points. Only the handle claims drag, leaving content scrolling intact. Arrow/Home/End and Smaller/Larger buttons provide alternatives. Pointer cancel restores the prior size; snap proposals are cancelable. |
| OTP | `en-otp-field` | One real text input with numeric input mode, one-time-code autocomplete, expected length, leading zeros, paste, native editing and inherited validation. Spacing is decorative; there are no competing per-digit form values. |
| Query builder | `en-query-builder` | Serializable all/any clauses, stable clause ids, constrained fields/operators, draft editing, validation and explicit Apply/Cancel. Committed value changes are cancelable. Query evaluation and remote data remain application-owned. |
| Media viewer | `en-media-viewer` | Native dialog and existing carousel composed around stable media keys. Image zoom is bounded to 1–4× with range/buttons and constrained pointer pan. Navigation resets the view; originals remain directly accessible. Browser page zoom remains available. |
| Charts | `en-chart`, `ChartRenderer`, `chartModel`, `barChart` | Replaceable renderer receives normalized data/domain and semantic CSS color expressions. Working SVG bars support positive/negative values. A native checkbox legend and complete data table remain available independently of the decorative visualization. |
| Streaming transcript | `en-transcript` | Stable keyed messages, opt-in follow-latest, reader-position preservation, explicit return-to-latest, and unread message status. Streaming text itself is not a continuously announcing live region. Transport and message persistence belong to the application. |
| Questionnaire | `en-questionnaire` | Retained freeform, single-choice and multiple-choice answers, required/custom validation, previous/next/optional skip, native progress, question/error focus and cancelable navigation/submit intent. Application owns persistence and submission. |
| Content and layouts | `patterns` styles and templates | Native code/keycaps/time/separators, local date-time input, joined buttons, attachment links with separate removal, choice tiles, system messages, unread markers, code/copy blocks, scroll regions, media cards, metadata, responsive app shell and form grids. These remain compositions rather than redundant wrappers around native semantics. |

## Imports and examples

Each custom element has a class entry, a pure registration definition and an optional defining entry:

```ts
import '@en-reve/elements/define/multiselect.js';
import type { EnMultiselect } from '@en-reve/elements/multiselect.js';

const teams = document.querySelector<EnMultiselect>('en-multiselect')!;
teams.items = [
  { value: 'design', label: 'Design' },
  { value: 'engineering', label: 'Engineering' },
];
teams.value = ['design']; // authoritative, silent assignment
teams.addEventListener('en-change', event => {
  // proposed values and FormData are tentative during this dispatch.
  // event.preventDefault() vetoes; an authoritative property write wins.
});
```

```html
<form>
  <en-checkbox-group label="Teams" name="team" value='["design"]' cards>
    <en-choice-option value="design">Design</en-choice-option>
    <en-choice-option value="engineering">Engineering</en-choice-option>
  </en-checkbox-group>
  <button type="reset">Reset</button>
</form>
```

Selection groups and interval sliders use JSON `value` attributes for reset defaults and array `.value` properties for current state. Assign a new array rather than mutating a returned snapshot. Checkbox groups retain ordinary Tab navigation; toggle groups use roving arrows; multiselect keeps editing focus on its combobox and exposes the active option through `aria-activedescendant`.

```ts
import { patternStyles } from '@en-reve/styles/patterns.js';
import { meterTemplate, navigationFlyoutTemplate, appShellTemplate }
  from '@en-reve/primitives/templates/patterns.js';
import { barChart, type ChartRenderer }
  from '@en-reve/primitives/templates/chart.js';
```

Use `@en-reve/styles/patterns.css` for native light-DOM compositions, together with foundations and controls. Class-based recipes do not install application event handlers or register custom elements.

## Theme integration

New controls consume existing button, choice, option, field, overlay, chat and semantic palette roles. Persistent selected treatment is independent of temporary `:active` feedback. The themed button/option classes continue to use the whole-control motion introduced in the preceding work. Rich overlays inherit existing enter/exit, focus, surface and placement behavior. Reduced-motion and forced-color behavior should be verified with each application's content and theme.

Field help actions and tag removal buttons use compact inset geometry by default. Their inner corners derive from the surrounding radius minus the frame border and inset; the inset reserves room for the theme’s button focus contour. Both standalone tags and multiselect tags share this treatment. Pointer targets retain the theme’s minimum, including its larger touch minimum, so touch layouts can grow. Existing button CSS Parts still permit deliberate consumer overrides.

The additions intentionally avoid a second set of theme-specific overrides. New CSS Parts expose composition boundaries without changing core token meaning. Native charts use CSS color expressions, so a theme switch updates their paint without rebuilding application data; external renderers can consume the same contract while owning their rendering lifecycle.

## Comparison to source libraries

These additions address the reusable patterns identified in the Radix, Fluent 2, Spectrum, shadcn and Astryx comparisons. They do not claim identical catalogues or pixel equivalence. Core libraries provide different product-specific compositions; this implementation closes the named behavioral gaps with reusable primitives and documented application boundaries.

- Radix: persistent toggles, checkbox cards, alert dialogs, context menus, hover cards, multithumb range input, menubars, and native text/layout compositions.
- Fluent 2: multivalue picking/tags, checkbox collections, command overflow, context invocation, measured feedback, structured field anatomy and selection/action boundaries.
- Spectrum: tag removal, multiselection, action groups, contextual actions, interval selection, meters and responsive panel behavior.
- shadcn: multiselect composition, OTP, drawer/sheet interactions, confirmation, command/navigation compositions, charts and richer media/application workflows.
- Astryx: tag/filter compositions, rich previews, contextual controls, data/chart presentation and retained multistep/conversation workflows.

The original per-library research remains in the theme refresh report; this page records the implementation layer that closes its gap list.

## Accessibility and application boundaries

The interaction models follow the relevant [APG multithumb slider](https://www.w3.org/WAI/ARIA/apg/patterns/slider-multithumb/), [listbox](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/), and [alert dialog](https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/) contracts. Browser automation cannot establish physical-device or assistive-technology acceptance. In particular, test touch assistive technology with range controls, actual autofill with OTP, and screen-reader announcement policy with live application content.

Query builders do not execute expressions. Charts do not choose an analytics backend. Transcripts do not connect to a transport. Media viewers display supplied image URLs without fetching a gallery catalogue. Questionnaires do not persist or submit answers by themselves. These are explicit integration boundaries, not deferred component behaviors.

## Verification

The isolated release passes 87 component interaction checks across Chromium, Firefox and WebKit, 168 model/server tests, 64 tooling checks, and three native-edit hydration checks. The regression run also passes 204 existing transaction checks. All 291 API contract cases are accounted for: 279 passed initially; the 12 failures were missing test-fixture content, corrected and verified in an 18-case focused rerun.

The gallery suite passes 21 checks covering all ten themes in light and dark appearances, automated accessibility, 390px layouts, retained state during theme changes, and opt-in Developer UI return links. Automated accessibility reports zero violations in those cases. The build regenerates registration, public types, customization evidence and API metadata for all 96 elements; there are no new unreviewed customization failures.

The independent progress report retains publication evidence and review checkpoints. Automated checks and agent visual review do not imply user approval or physical-device/assistive-technology acceptance.

## Composition API refinements

- `en-tooltip`, `en-popover`, and `en-hover-card` accept the boolean `arrow` property/attribute. The optional SVG arrow follows final collision geometry; `--en-overlay-arrow-size`, `arrow-path`, `::part(arrow)`, and `::part(arrow-shape)` customize it. The explicit SVG path API makes shape changes portable to WebKit, where CSS `d` is not supported. Content scrolls independently of the pointer. See the tooltip README for shape and placement contracts.
- `en-toggle-group joined` joins the visible buttons with zero gaps, single-width shared borders, and only exterior rounded corners. Horizontal, vertical and RTL layouts, hidden items, selection and focus layering are supported. This changes presentation only; `multiple`, `allow-empty`, form values and roving focus keep their existing behavior.
- `buttonGroupTemplate(label, actions, { joined: true, orientation: 'horizontal' })` applies the same geometry to native `.en-button`, `en-button`, and `en-toggle-button` children. Both options are optional; joined horizontal remains the recipe default. `joined: false` restores spaced buttons. Individual action semantics and Tab stops are preserved. Import `patterns` styles in the containing root, as for other recipes. Hidden children should use `hidden` so the visible edge rules can identify them.
- The query builder composes `en-select` for Match, Field, and Comparison. Its definition registers the select dependency, fields inherit the component size and theme, and unnamed internal fields do not submit independent form values. Internal selection/input events stay private; only Apply proposes the committed query through the existing cancelable `en-change`. Cancel restores the last committed query.

The component-pattern gallery demonstrates joined formatting actions, joined alignment choices, an arrow tooltip and hover card, and the composed query fields.

Toggle-group `.items` accept an optional built-in `icon` name (`ToggleItem`). The glyph remains decorative alongside the visible label and is exposed through `option-icon`. Formatting actions use bold/italic/underline icons; alignment actions use logical start/center/end icons. Start and end mirror automatically in RTL. Authored choice descriptors retain their existing text-label contract.

Selection collections provide a wrapping bulk-action row with `--en-space-actions` spacing between the status and each directly slotted action. Customize the row through `::part(actions)` and the live selected count through `::part(status)`. If an action slot contains an authored wrapper, that wrapper owns its internal layout.

Checkbox groups provide hover-capable pointer feedback over the entire label: an unchecked checkbox uses the subtle surface and action-hover boundary, while a checked checkbox keeps its mark and uses the action-hover fill. Card mode also changes the whole card boundary and the unchecked card fill; selected cards retain their selected fill. Disabled and read-only options have no hover treatment. Press styling retains precedence, and forced colors use the system Highlight boundary.

### Rich checkbox child projection

`en-checkbox-group` projects direct `en-choice-option` children into its native checkbox labels. The default slot accepts noninteractive rich label content; the `description` slot accepts noninteractive supporting content. `label` and `description` attributes/properties provide plain-text fallbacks.

```html
<en-checkbox-group label="Disciplines" name="discipline" cards value='["design"]'>
  <en-choice-option value="design">
    <strong>Design</strong>
    <span slot="description">Shape the <em>product</em> and its interface.</span>
  </en-choice-option>
  <en-choice-option value="engineering" label="Engineering"
    description="Build reusable systems."></en-choice-option>
</en-checkbox-group>
```

The original authored nodes and listeners survive projection, reorder, and hydration. Selection, keyboard focus, validation, repeated form entries and reset remain owned by the group. Recognized children take precedence over `.items`; removing all child options restores the data source. Existing plain children and `.items` remain supported. Toggle groups, multiselects and selection collections retain their text-descriptor behavior.

Checkbox accessible names are derived from label content (excluding descriptions and decorative `aria-hidden` content); descriptions are exposed separately through `aria-description`. The projected visual content is hidden from accessibility to avoid duplicate announcements. Use `aria-hidden="true"` for decorative icons. Plain accessible text is derived from authored light DOM; custom visuals whose meaning exists only in a shadow root need a plain `label` fallback.

Labels and descriptions must be noninteractive: no nested buttons, links, controls, tab stops, or editable content. Detected interactive content invalidates the child catalog until corrected. Custom child components must also honor this contract; independent actions belong outside the checkbox label. Description elements must be direct children with `slot="description"`; other authored slot names are unsupported. Option root slots are assigned internally and must not be edited.

Use `en-choice-option::part(label)` and `::part(description)` to style its wrappers, ordinary CSS for authored children, and `en-checkbox-group::part(option)` / `::part(option-content)` for the card and content container. Rich content inherits theme typography and muted description color. Browser and SSR share normalization, generated slot ownership, accessible strings, and noninteractive-content validation. Verification covers native edits before hydration, node identity, live label/description changes, reorder, transfer, hidden choices, data fallback, veto, reset, disabled and read-only behavior.
