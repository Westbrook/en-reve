# Select

`en-select` wraps a labeled native single-select control. Author `en-select-option` descriptors, or supply the existing readonly `.items` array of `{value, label, disabled?}` records.

```html
<en-select name="format" label="Export format" value="svg">
  <en-select-option value="svg">SVG</en-select-option>
  <en-select-option value="png">PNG</en-select-option>
  <en-select-option value="pdf" disabled>PDF</en-select-option>
</en-select>
```

Import `@en-reve/elements/define/select.js` to register the control and its descriptor. Direct descriptors take precedence whenever one or more are present; removing all restores `.items`. The `.items` property always returns the authored fallback array. Invalid descriptors produce a diagnostic, not a fallback to another catalog.

Give each descriptor a unique explicit `value` (an empty string is allowed). Nonempty child text becomes the plain native option label after HTML whitespace normalization; otherwise `label` supplies a fallback. Update `.value`, `.disabled` or `.label` on the descriptor, its corresponding attributes, or its text to update the choice. `hidden` hides and makes a choice unavailable; `hidden="until-found"` is unsupported. Descriptors own no selection: `selected` and `checked` attributes are rejected, and those properties are not supported APIs. Set the parent's `value` instead.

Descriptors are metadata. The parent creates actual native options in its private select; the authored descriptor is not the interactive native option. This preserves the native mobile picker and shadow encapsulation. It does not provide rich option markup, cross-root ID references or per-descriptor native option event identity. The `label` and `description` attributes/properties retain their matching slots.

One cancelable `en-change` exposes the provisional accepted value and form data. Canceling restores the previous native selection; a select retains no unmatched text-editing draft. A synchronous parent `.value` write, including an equal-value write, remains authoritative. `en-input` reports the native draft before selection settlement. A listener that removes, disables, hides or changes the proposed descriptor prevents the obsolete proposal from committing.

The accepted `value` persists when its choice becomes unavailable; no other choice is silently accepted. When the initial value has no matching option and no explicit placeholder, SSR includes a private empty, disabled, hidden option so the native control is blank before JavaScript. That placeholder is not a catalog choice or a successful form entry. Missing, disabled or hidden choices submit no form entry, and a required control is invalid until an enabled visible choice matches. An available empty value retains native required/placeholder validation. The host supplies one form entry. Reset restores the value captured at the first update; browser state restoration is authoritative and silent.

## Server rendering and early interaction

The provided `@en-reve/ssr` renderer derives the child catalog from the same authored response, emits real native options, and prepares a private hydration snapshot. No caller-authored count, slot name or plan is needed. Other renderers must integrate that adapter to produce the same initial child-derived shadow output. Client-created controls discover descriptors through their attributes and text.

An attribute-authored control can preserve a native selection made before hydration: it proposes that selection through `en-change` with reason `hydrate`, which can be canceled. The original value remains the reset baseline. Any subsequent public `.value` setter wins, including an equal pre-upgrade own-property write or a parent framework replay of its property-bound snapshot. The component cannot distinguish those two public writes and does not guess that a replay is non-authoritative. With property-bound hydration, supply the intended accepted value in that binding. Native select identity survives hydration and label/catalog updates.

## Appearance

The closed trigger uses the shared input/control, typography, density and size
roles. Missing `size` means medium. Its corners remain independent of the opened
picker. The `control`, `option`, `field`, `label`, `description` and `error` Parts
expose supported styling surfaces without exposing shadow ancestry.

The enhanced trigger's `::picker-icon` uses the same rounded, thin chevron and
`--en-size-icon` sizing as the combobox. It is decorative; clicking it still opens
the native select. Where supported, target it through the control Part:

```css
en-select::part(control)::picker-icon {
  color: var(--en-color-text);
}
```

In browsers without customizable-select support, the closed control uses
`appearance: none` with the same decorative chevron on the existing focus frame.
Logical end padding reserves its space; the shared font, size/density envelope
and touch target remain. The arrow cannot intercept pointer input, and choosing
an option still opens the platform picker. Older engines without `:has` retain
their platform arrow. Forced colors use system text colors, including disabled.

In supporting engines, `--en-select-appearance: auto` retains the platform
appearance and arrow. The fallback enhancement does not consume that hook: its
picker is already native. Direct custom styling of the control Part should keep
its end padding and the focus-frame `::before` indicator aligned.

Browsers supporting `appearance: base-select` and `::picker(select)` receive
the same option-list and row styling vocabulary as `en-combobox`:

- `--en-option-list-background`, `color`, `border-color`, `radius`, `padding`,
  `gap`, `shadow` and `max-block-size` specialize the popup. Applicable
  `--en-overlay-*` properties remain broader fallbacks.
- `--en-option-radius`, `inline-padding`, `block-padding`, `font-weight` and
  `selected-font-weight` specialize rows while preserving target minima.
- `--en-option-{rest,hover,pressed,selected,disabled}-{background,color}`
  specialize paint. State-specific properties refine the broad
  `--en-option-background` and `--en-option-color` fallback.

Native focus-visible options use the highlighted/hover paint. Native `:active`
means pressed activation; the separate combobox keyboard-candidate state is not
part of this native picker API. Selected, pressed and disabled behavior remains
native. System colors retain selection, disabled and focus cues.

With nonzero `--en-duration-enter` and `--en-duration-exit`, the enhanced picker
fades in and out using the shared entry/exit easing tokens. `@starting-style`
supplies entry; native `display` and `overlay` transitions retain exit paint
without delaying selection or dismissal. Its position and size do not animate.
Reduced motion, zero durations, and browsers lacking native exit-transition
support keep opening and closing immediate.

Use matching `component.option-list.*` and `component.option.*` tokens in Theme
Review to export these settings. List-specific geometry does not change dialog
padding or corners. Full child themes clear optional inherited pins; partial
themes inherit unspecified values. See the [shared styling contract](../../../styles/README.md#option-lists-and-result-rows).

`--en-select-appearance: auto` explicitly retains platform appearance in enhanced engines. Browsers
without customizable select support also use the native picker. Their OS popup
internals cannot be made visually identical through CSS. Choosing a theme never
replaces the native control with a simulated menu. Action menus, grouped/rich
options and custom noneditable dropdowns require their own component work.
