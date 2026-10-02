# Application-owned color controls

Adopt `colorSliderStyles`, `colorWheelStyles`, or the independent
`colorPickerStyles` / `colorPlaneStyles` fragments from the public style modules.
Portable equivalents are `color-slider.css`, `color-wheel.css`,
`color-picker.css` and `color-plane.css`. Use each family in its own application
shadow root, composing foundation/control/form styles as needed. These generic
Part selectors describe matching consumer templates; they are not page-wide
selectors or APIs for reaching into delivered `en-*` elements.

## Portable plane migration

`color-picker.css` now contains only picker styling. It previously concatenated
plane styling, whose generic `[part=base]`, `[part=channels]` and host container
rules interfered with the picker. Portable plane consumers must explicitly link
`@en-reve/styles/color-plane.css` in the plane's root. JavaScript consumers still
import `colorPlaneStyles` from `@en-reve/styles/color-picker.js`. Do not combine
both fragments in one root: the picker and plane own distinct structures.

## Templates and responsibilities

- **Channel:** native labeled range inside `.en-field` and `.en-range-row`, with
  `.en-range` and an associated output. The app supplies limits, values, gradient
  colors and input handling. A `checkerboard` host supplies the checker layer
  behind an alpha gradient. Native range semantics and keyboard input remain native.
- **Wheel:** `base`, `label`, `control`, `ring`, `center` and `thumb` Parts with an
  `.arm` wrapper. The app owns the named slider role, value text, keyboard steps,
  circular pointer coordinates, capture/cancellation and disabled state. The ring
  remains clockwise in RTL. CSS alone implements none of those interactions.
- **Plane:** `base`, `plane`, `thumb`, `axes`, `channels` and `error` Parts. The app
  owns coordinate conversion, pointer capture, cancellation, clamping, RTL mapping
  and disabled state. Provide named native sliders as a keyboard equivalent;
  the decorative pointer plane is hidden from the accessibility tree. Its own
  container switches the layout to two columns at 34rem.
- **Picker:** `base`, `summary`, `preview`, `hex-field`, `formats`, `format`,
  `channels`, `channel`, `value` and `error` Parts, with `.summary` and
  `.preview-frame` recipe classes. The checkerboard frame sits behind the color
  preview. The app owns parsing, validation, alpha, formatting and draft retention.
  The sample accepts six hex digits and switches serialized HEX/RGB output; it
  does not implement the complete delivered picker or Display-P3 conversion.

Mechanical `--_en-*` gradient/coordinate inputs are implementation state of the
matching recipe, not theme knobs. Customize through public `--en-*` properties:
shared control radius/background, picker width/gap/preview size, plane geometry,
wheel size/track/thumb and slider track/thumb/checker dimensions. Set them on a
host or ancestor scope; unrelated siblings retain their styling.

## Barrels and metadata

`@en-reve/styles` and `@en-reve/styles/index.js` expose the same fragments without
registering elements. Selective module imports avoid pulling unrelated source
into a consumer's dependency graph. `@en-reve/styles/metadata.js` exposes the
canonical `styleFamilies`, `styleOverrideNames` and `styleStateProperties` used
by token customization. Use override names for an author-facing theme inspector;
mechanical state is separately classified and must not be reset as theme input.

The packed [color recipes](../../../probes/color-recipes/README.md) exercise
these templates with no elements-package import. Browser geometry, interaction
and computed CSS are bounded evidence; manual AT, physical touch, calibrated
color rendering, retail browser products and full SSR/hydration remain separate.
