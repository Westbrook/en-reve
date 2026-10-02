# Whole-button press correction

The reported mismatch had two causes in the shared button stylesheet: motion targeted only `.en-button__label` and the slotted glyphs, and an unconditional `aria-haspopup` exclusion prevented Create (a declarative dialog trigger) from moving. Preview had no popup attribute, so only its content moved. The earlier browser checks asserted those adaptations rather than the source behavior; they did not catch this fidelity defect.

## Reference behavior

- [Astryx Button](https://github.com/facebook/astryx/blob/413fa55281d1565abae8319e9803c8ccc639bc28/packages/core/src/Button/Button.tsx) applies `scale(.98)` to the full button/link, using its 175ms fast duration and standard easing. It exempts disabled actions and ButtonGroup members, not popup triggers.
- [shadcn Rhea](https://github.com/shadcn-ui/ui/blob/a87a63b2ca25143d26c8bd0903e4e9bc77b3f824/apps/v4/registry/styles/style-rhea.css) applies a 1px whole-button downward translation **except on popup triggers**. Its [Button wrapper](https://github.com/shadcn-ui/ui/blob/a87a63b2ca25143d26c8bd0903e4e9bc77b3f824/apps/v4/registry/bases/base/ui/button.tsx) supplies `transition-all`. The inspired theme now uses 150ms press/release, adopting the default Tailwind timing instead of the previous zero duration; this is a source-derived default, not a new measurement of production CSS.

Consequently, Astryx Create and Preview both shrink. In shadcn, Preview moves down while Create stays stationary by design. Create still changes its pressed paint and opens its dialog normally.

## Implementation

The existing bounded press-scale/offset roles now transform the complete native button: background, border, label, icons and focus contour together. Shared leaf/aggregate styles and native class recipes use the same implementation. Width/height allocation and adjacent layout do not change; the painted/hit rectangle does transform, as it does in the source. The previous claim of stationary hit/focus geometry no longer applies. Minimum sizing is still applied before transformation.

Two optional typed roles make the popup exception portable: `component.button.popup-pressed-scale` and `component.button.popup-pressed-offset`. They inherit ordinary button motion unless explicitly set. Shadcn sets them to 1 and 0px in both appearances. Astryx inherits its ordinary .98 scale. Popup semantics and expanded state alone no longer suppress motion globally. `aria-haspopup="false"` is treated as an ordinary action.

Disabled/loading/aria-disabled controls and explicit `data-press="none"` opt-outs remain stationary. Reduced motion removes transformations and transitions while retaining pressed paint. This is a deliberate accessibility adaptation: Astryx's source removes duration but retains the instantaneous scale. The focus outline still appears immediately and follows the complete button; its own halo transition is composed with press/release transitions.

The shared correction also makes the existing Vellum, Signal, Kinetic and Spectrum press roles move their complete button surfaces. Themes with scale 1 and offset 0 remain stationary. No theme-specific JavaScript or Showcase-only selector is used.

## Verification

The focused regression exercises the actual Create and Preview buttons in both themes and appearances, in Chromium, Firefox and WebKit. It checks complete surface dimensions/position, untransformed child labels, unchanged layout allocation, press timing, pointer and held Space behavior, immediate focus, dialog activation and reduced motion. Held Space is compared with the engine’s native `:active` behavior: Firefox in this test environment does not expose that pseudo-class for held Space, even on a plain button; keyboard activation on release and visible focus remain required. The shared API suite covers variants, disabled controls, popup overrides and group opt-outs; the nine-theme adoption suite retains portable CSS and scope checks. Exact outcomes and publication identity are recorded in `artifacts/theme-press-correction/verification.json`.
