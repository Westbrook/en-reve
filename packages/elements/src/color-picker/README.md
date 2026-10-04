# Color picker and plane

`en-color-picker` accepts literal sRGB and Display-P3 colors through `value` or immutable `colorValue`. `format="hex|rgb|hsl"` affects textual presentation, never accepted color space. HEX/HSL are read-only sRGB approximations for Display-P3 until explicitly converted. Optional `alpha` exposes alpha without discarding it when hidden.

## Two-dimensional control

```html
<en-color-picker plane format="rgb" alpha value="color(display-p3 1 .2 .1 / .65)"></en-color-picker>
```

`plane` replaces the RGB/HSL channel section with `en-color-plane`: an opaque saturation/value pointer plane, Hue/Saturation/Value sliders, small exact-value fields, and optional Alpha. The existing summary, format controls, palette/recent slots and validation methods remain available. Without `plane`, existing picker behavior is unchanged.

The standalone import `@en-reve/elements/define/color-plane.js` registers `en-color-plane` and dependencies. It supports `value`, `colorValue`, `alpha`, `disabled`, `label`, `hueLabel`, `saturationLabel`, `brightnessLabel`, `alphaLabel`, `focus()`, `checkValidity()` and `reportValidity()`.

HSV coordinates belong to the active encoded RGB space, including Display-P3. No conversion occurs on plane edits. Remembered hue survives achromatic colors; black also retains saturation. Hue at 360 is equivalent to zero. Alpha is independent of the opaque plane. P3 painting uses supported P3 interpolation with an sRGB fallback; fallback does not change stored color.

## Transactions

A plane gesture keeps `value` accepted while `en-input.detail.value` reports previews. Pointer release proposes exactly one cancelable `en-change` `{previous,proposed,reason:'plane'}`. Escape, pointer cancellation and disabling cancel the gesture. Silent authoritative writes, including same-value writes, supersede a gesture and pending rollback. Equivalent channels use reasons `hue`, `saturation`, `brightness`, `alpha`; modifying a remembered hue while black may leave the color unchanged, so it does not emit a color change.

The picker forwards preview events and paints the draft in its preview chip. Applications own popup Apply/Cancel and editor transactions. An accepted plane gesture updates the picker; applying the editor session commits one chip/undo entry.

## Accessibility and styling

The pointer plane has no separate tab stop and is hidden from the accessibility tree. Each axis is fully represented by a named native range plus numeric text field. This avoids inventing a two-axis slider. Arrow/Home/End are native; RTL reverses the horizontal saturation direction. Forced-colors mode retains equivalent controls and a contrasting marker. Actual touch/VoiceOver and wide-gamut display review remain manual.

Plane Parts: `base`, `plane`, `thumb`, `axes`, `channels`, `channel`, `hue`, `saturation`, `brightness`, `alpha`, `slider`, `channel-field`, `channel-input`, `gradient`, `error`. Picker forwarding adds `plane-control`, `plane`, `plane-thumb`, `plane-axes` and the existing channel Parts. Geometry properties are `--en-color-plane-block-size` (12rem), `--en-color-plane-radius` (shared control radius) and `--en-color-plane-thumb-size` (1.25rem). Structural styling stays in CSS; only position and color paint are dynamic.

## Standalone hue wheel

Import `@en-reve/elements/define/color-wheel.js` to register `en-color-wheel` and its small `en-text-field` exact input. The wheel is not a picker dependency. `value` / immutable `colorValue` match the plane; edits preserve space, saturation, HSV value and alpha. It displays an opaque hue spectrum in the active encoded RGB space, with an sRGB paint fallback.

The ring is one named scalar slider: arrows ±1°, Page Up/Down ±10°, Home 0°, End 360°. Keys clamp; dragging crosses the seam. Physical hue direction is clockwise from red at the top, unchanged by RTL. Exact entry accepts 0–360 including fractions, commits on Enter/blur and resets on Escape. `label`, `hueLabel`, `disabled`, `focus()`, `checkValidity()` and `reportValidity()` are available.

Pointer motion previews `en-input`; release proposes one cancelable `en-change` with reason `hue`. Escape, pointercancel, capture loss, disabling and disconnection restore the accepted preview. Author writes, including equal-value writes, supersede the gesture. Preview listeners must not write the draft back into the source. Synchronize sibling controls after dispatch so veto and authoritative writes settle first. Gray/black retain local remembered hue; hue-only edits of achromatic colors do not change CSS color or emit `en-change`.

CSS Parts: `base`, `label`, `control`, `ring`, `center`, `thumb`, `field`, `input`, `error`. Geometry: `--en-color-wheel-size`, `--en-color-wheel-track-size`, `--en-color-wheel-thumb-size`. The wheel is not form-associated; application code owns form values. See the Color Picker live example for a standalone wheel/plane composition.

### Color slider presentation inheritance

`en-color-slider` retains its continuous `stops` gradient and hollow white-bordered handle with dark inner and outer rings. The shared slider state rules do not replace those rings on hover, keyboard focus or disabled controls. Meaningful inherited thumb paint, boundary, shadow and state hooks remain opt-in; unset disabled thumb paint stays hollow, while the channel's ordinary disabled opacity remains `.55`. Forced colors retain the specialized system-color thumb and the readable color gradient.

Color-specific `--en-color-slider-track-size`, `--en-color-slider-thumb-size` and `--en-color-slider-radius` take precedence. The corresponding `--en-slider-track-size`, `--en-slider-thumb-size` and `--en-slider-track-radius` become fallbacks when those specialized hooks are unset. Generic track background hooks act only as underlays behind transparent gradient/checker paint; track shadow hooks remain available. Thumb color, border, radius, hover/held/disabled paint, shadow, transition and opacity hooks are inherited explicitly.

Selected-fill hooks (`--en-slider-fill-background`, hover/pressed/combined/disabled fill background and disabled fill opacity) are inapplicable here. They never divide or recolor the color channel by numeric value. The inherited `--en-slider-value-percent` remains derived numeric presentation state, but `stops` and checkerboard paint own the full track. This specialization is stated in component metadata rather than hidden by generator rules.
