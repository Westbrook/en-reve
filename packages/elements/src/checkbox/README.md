# Choice elements

`EnCheckbox`, `EnSwitch`, `EnRadio`, `EnRadioGroup`, `EnSlider`, `EnRating`, and `EnSegmentedControl` are class-only exports. Registration belongs to the package's explicit `define/*` entrypoints or a consumer registry. Internal templates remain private. Named `label` slots are preferred; existing default label slots remain supported as fallbacks before the `label` attribute. Radio-group's default slot continues to contain radio options, while its label has a separate named slot.

All seven choices accept a named `description` slot with the `description` attribute/property as fallback. Assigned content replaces the fallback; removing it restores the fallback. An assigned empty element still suppresses the fallback. Use phrasing content for emphasis, keyboard hints, and ordinary help links. The description is separate from the label and is associated with the native control or group; help links remain independently keyboard-operable without toggling or selecting the choice. For a multiline description example on checkbox, switch, radio, slider, or rating, supply an explicit `label` slot too so incidental default-slot whitespace cannot mask the label attribute.

Keep inline text, formatting, and links together inside one element with `slot="description"`, such as a `span`. Multiple directly assigned description elements render as separate help blocks.

```html
<en-checkbox checked description="Include editable layers with the export.">
  <span slot="label">Include source files</span>
  <span slot="description">Include <strong>editable layers</strong> with the export.</span>
</en-checkbox>
```

## External labels

An external `<label for="choice-id">` or wrapping label can also name and activate
`en-checkbox`, `en-switch` or `en-radio`. The shared controller retains real label
elements, includes the internal `label-text` reference, and restores the internal
reference when an external label is removed. Compact `::part(label-text)` styling
continues to work. Native Reference Target handles activation when the actual
native relationship is present; otherwise the controller focuses and calls the
native input's `click()` once after the original label dispatch completes. The public
`labels` facade returns the browser’s `ElementInternals.labels` list. With native
Reference Target, labels transfer to the enclosed input and that host list is
empty; the native naming and activation relationship remains connected.

The existing synchronous `en-change` transaction still owns toggling, rollback and
FormData. Grouped radios route only through their owning group. Disabled fields,
interactive label descendants and canceled label clicks do not activate. Wrapping
labels ignore the browser's secondary host click, avoiding double toggles. Native
input names supplied by a specialized owner take precedence over bridge naming.

SSR preserves the private native target. Retain an internal label for first-paint
naming: choice inputs explicitly reference their internal label text, and the
shared controller adds external names after hydration. Unsupported engines also
need hydration for external activation. This is progressive labeling support,
not general host ARIA forwarding or a screen-reader/device acceptance claim.

Native slot fallback appears only when a slot has no assigned nodes. For checkbox, switch, radio, slider and rating, whitespace-only children still fill the legacy default label slot and can hide the `label` attribute fallback. When using only the attribute, keep the opening and closing tags adjacent. For multiline markup, prefer an explicit `<span slot="label">Visible label</span>`; this avoids whitespace masking the label. Radio-group and segmented-control have dedicated named label slots, so whitespace in their default content does not mask their attribute label.

```html
<en-checkbox name="notifications" value="yes">Notify collaborators</en-checkbox>
<en-switch checked>Live preview</en-switch>
<en-radio-group name="format" label="Export format" value="png">
  <en-radio value="png">PNG</en-radio>
  <en-radio value="svg">SVG</en-radio>
</en-radio-group>
<en-slider name="opacity" label="Opacity" min="0" max="100" step="1" value="80" show-value></en-slider>
<en-rating name="quality" label="Quality" value="3"></en-rating>
```

`en-change` is the single synchronous, cancelable, bubbling and composed user-change event. Its detail is `{previous, proposed, reason}`. During dispatch, the component property, native checked/range state and form value expose the proposed state. An uncanceled event accepts that state; cancellation restores the previous state without moving focus. Programmatic writes are silent and authoritative: a synchronous property assignment, including a same-value write, supersedes the event transaction, so later cancellation cannot undo it. A nested accepted change also takes precedence over the outer transaction.

```js
slider.addEventListener('en-change', (event) => {
  if (slider.value > 80) event.preventDefault();
});
```

Cancellation must be synchronous. To await application approval, cancel immediately and assign the accepted property later. Event listeners observe tentative state, so application effects such as saving or broadcasting should occur after the dispatch resolves rather than assuming every observed event is accepted.

Checkbox, switch and standalone radio changes use boolean values. Radio-group proposals use the selected string; slider/rating proposals use numbers. Slider proposes each native input adjustment, with `reason: 'input'`. Checkbox/switch use `toggle`; radio groups use `select` or `keyboard`; rating uses `select`.

The checkbox, radio and switch label hooks are `--en-choice-label-color`, `--en-choice-label-hover-color`, `--en-choice-label-focus-color`, `--en-choice-label-pressed-color` and `--en-choice-label-disabled-color`. State hooks fall back to the label color and then ordinary text color. Disabled paint wins over held, native-input focus-visible and hover paint, in that order; ordinary focus alone does not change the label. Group and fieldset disabling follow the actual input. Invalid and checked states retain the same label roles, and descriptions, errors and typography remain separate. Customize the visible label directly through `::part(label-text)` when needed. Forced colors keep the system label color. See the [native helper contract](../../../styles/README.md) for equivalent light-DOM labels.

The form-associated hosts support native `FormData`, disabled fieldsets, reset, restoration and validity APIs. The checkbox/radio checked attribute and numeric/group value attribute define reset defaults. Browser restoration writes authoritative state. Applications that own reset behavior cancel the form's native `reset` event with `preventDefault()` and then assign any desired values; uncanceled reset restores the defaults. Grouped radios do not submit individual entries or independently reset.

An `en-radio-group` requires direct `en-radio` children with unique nonempty values. The group owns checked state, selection and a single form entry. Arrow keys wrap and skip disabled options; horizontal arrows respect text direction. Home/End choose the first/last enabled option. A canceled proposal retains the accepted selection while focus remains on the newly explored option. Tab leaves the group according to the browser's keyboard-navigation preference. No native radio-name behavior is assumed across shadow roots.

For server-rendered radio composition, mirror the group value into the matching child's `checked` attribute/property. Server rendering cannot inspect assigned children through browser slot APIs. Client-only rendering needs only the group's value. This explicit SSR recipe does not itself establish hydration parity.

`en-slider` accepts numeric `min`, `max`, and positive `step`, clamps to the range, snaps to its min/step lattice, and limits floating-point rounding noise. `show-value` exposes an output; `value-text` supplies human-readable units to both the output and accessible value. `en-rating` paints stars over accessible native radio choices from zero (cleared) through `max` (1–10). The zero choice is visibly labeled No rating; its property-only `optionLabel(value, max)` formatter localizes names such as 3 of 5 stars. Radio-group `validation-text` localizes its required-selection message. The segmented-control README describes its compact alternatives and dynamic disabled-selection policy.

Every choice host inherits the `size` API from `EnElement`: `inherit | small | medium | large`, with `medium` as the default even when the attribute is absent. `inherit` is an explicit opt-in to the containing size scope. Concrete modes use shared size roles without multiplying nested dimensions.

Shared runtime work lives in `@en-reve/primitives` value, signal, change-transaction and form controllers. Visual rules come from `@en-reve/styles`; choice adapters contain no new visual values. The toggle and scalar form adapters are shared across these elements, with separate pure template modules.

## Focused verification

Run from the repository root after the dependent packages are built:

```sh
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/en-reve-playwright ./node_modules/.bin/playwright test --config packages/elements/src/checkbox/playwright.config.mjs
```

The suite uses actual labels, native controls, keyboard operations, focus, form entries and validity. The initial eight scenarios cover checkbox cancellation and silent writes; cancelable switches; radio navigation; decimal sliders; rating scores; fieldset disable/reset; required radios and authoritative application writes; and application-owned reset. The review iteration adds segmented navigation/ownership/recovery, named-label and shared-size checks, and normal/forced-color focus captures. This is automated browser evidence, not a screen-reader certification or complete current-minus-one device matrix.

The fixture server disables hot reload and file watching, so concurrent package builds cannot reload an active scenario. Playwright role queries that search a slotted group's descendants start at the public host; the browser accessibility snapshot confirms the radios are composed under the radiogroup. The generated summary for the most recent run lives in `test-results/summary.json`.

The 2026-09-08 review run passed all 42 checks (14 scenarios in Chromium, Firefox and WebKit). Normal and forced-color focus captures were visually inspected; the final forced-color captures also cover selected-disabled and unselected segmented choices. The disabled-selection recovery scenario verifies that native validation focuses an enabled choice, and a keyboard selection clears the unavailable checked state while restoring validity and form data.

A Lit SSR smoke render of the original six element classes completed. Full parsed-DSD and hydration verification is owned by the integration suite. Localized review, broader touch/RTL coverage and real assistive-technology grouping announcements remain integration/manual review work.

Segmented controls include their outer frame in the shared control height: medium at comfortable density matches the select's 40px default. Actual option targets retain their 24px minimum and 44px touch minimum, so touch mode, wrapping, or enlarged text can increase the outer height. Pointer clicks in the options frame's padding and gaps activate the closest rendered option by distance to its rectangle, including across RTL and wrapped rows. A closest disabled option stays inactive; equal distances use item order. Labels, legends, keyboard navigation, and cancelable selection retain their existing behavior.

## Nonvisual selection labels

Checkbox, switch and radio expose `::part(label-text)`, explicitly referenced by
the native input's `aria-labelledby` within its shadow root. For a compact
selection control with a plain-text label, consumers may hide that part:

```html
<style>
  en-checkbox.asset-selection::part(label-text) { display: none; }
</style>
<en-checkbox class="asset-selection" label="Select Asset 00001"></en-checkbox>
```

The directly referenced hidden text still supplies the accessible name, without
an independently readable label-text node. This is preferable to visually clipping
an extra slotted label for checkbox-only table cells. Visible labels remain the
default; their native wrapping label still activates the input when clicked.
Only use this compact treatment for plain, noninteractive labels with clear visual
context. Do not hide rich labels containing links or separately meaningful content;
hidden-reference name computation can also include decorative descendant text.
Descriptions and their links remain separate and unchanged. Browser accessibility
tree checks do not establish VoiceOver speech behavior; confirm that during review.

## Native-aligned form contract (API-03)

`defaultValue` reflects the `value` attribute; checkboxes, switches and standalone radios instead use `defaultChecked` and `checked`. Defaults update current state while pristine. A current-state assignment (including the same value), user editing or browser restoration makes it dirty. Later default changes preserve the current value/draft; uncanceled form reset restores defaults and makes it pristine again. Defaults and current-state writes are silent. Numeric defaults retain the component's existing clamp/snap rules.

All form-associated controls expose `form`, `labels`, `validity`, `validationMessage`, `willValidate`, `checkValidity()` and `reportValidity()`. `name`, supported `required`, and `disabled` reflect. Set `error` to invalidate a value for an application rule and show associated `::part(error)` feedback. Clear it explicitly with `error = ''`; reset does not clear application errors. `validationText` changes existing constraint feedback only. A zero rating is a defined score; sliders and ratings do not gain a `required` constraint.


Checkbox, radio and switch expose the additive `control-invalid` Part when their
existing application or reported constraint feedback is visible. It marks the
same native input as `control`, matching `aria-invalid`; it does not expose a
pristine required constraint failure as an error prematurely. Clearing feedback
removes the additional Part. Disabled paint and forced colors remain independent.
