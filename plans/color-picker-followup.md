# Color picker follow-up contract

Planning checkpoint: 2026-09-17. Covers COLOR-1/2 in
[the component backlog](component-follow-up-backlog.md). This document settles
the implementation boundary. COLOR-1 is now implemented for review; COLOR-2 is implemented for review.

## Baseline and sequence

The original `packages/elements/src/color-picker/color.ts` stores sRGB bytes and
normalizes only hexadecimal input. `en-color-picker.value` is a canonical hex
string; RGB/HSL are editing presentations of that value. `en-color-slider.stops`
also accepts hex only. The composable-chat example uses `data.color` strings and
application-owned picker sessions; theme JSON validation is a separate contract.

Implement COLOR-1 model/parser/conversion first, then integrate picker, sliders,
swatches and editor examples, then COLOR-2's plane. Do not implement a plane that
quietly converts P3 to sRGB. Coordinate only the color payload boundary with EDIT;
editors must remain unaware of particular color spaces and picker controls.

## COLOR-1: accepted value and editing contract

Proposed shared immutable model (names are provisional until implementation):

```ts
interface ColorValue {
  readonly space: 'srgb' | 'display-p3';
  readonly channels: readonly [number, number, number];
  readonly alpha: number;
}
```

Channels are finite, encoded RGB coordinates, normally 0–1; alpha is finite 0–1.
Keep conversion intermediates outside that channel range so conversion does not
silently clip. The initial picker accepts colors within their declared space;
out-of-range authored coordinates produce validation feedback, not black or a
different accepted color. Document this as a deliberately bounded CSS subset.

- Keep `value` a serializable CSS string and existing hex input/output compatible.
  Add a typed `colorValue` property backed by the same state, not a second value
  that can disagree. Every accepted write increments the existing revision guard.
- Preserve legacy sRGB byte edits as six/eight-digit lowercase hex. Non-byte sRGB
  coordinates serialize as `color(srgb … / …)`; P3 serializes as
  `color(display-p3 … / …)`. Opaque alpha may be omitted. Use deterministic decimal
  serialization that round-trips the numeric model, independent of CSSOM output.
- Parse hex and a bounded literal subset of `rgb()`, `hsl()` and the two `color()`
  spaces. Reject unresolved `var()`, `currentColor`, relative colors, unsupported
  spaces and nonfinite numbers. No browser layout or canvas is required to parse.
  Keep `normalizeHexColor()` unchanged as an explicitly hex-only utility.
- Editing `format` does not change accepted value, color space or alpha. RGB mode
  names the active space; use normalized P3 channel values rather than mislabeling
  them as ordinary sRGB bytes. HEX and CSS HSL are sRGB representations. For a P3
  value, show their sRGB approximation read-only and offer a separately labeled
  conversion action before allowing HEX/HSL edits. No conversion on tab/select
  changes. Retain the original P3 value when canceling conversion or editing.
- Preserve the existing cancelable change/author-write precedence. Invalid drafts
  remain editable without replacing the accepted value. Hiding alpha retains it.
  Color-space conversion is a single explicit change transaction.

The representation distinctions above follow CSS Color 4: hex and HSL describe
sRGB; `color(display-p3 …)` identifies a distinct RGB space. The standard provides
transfer functions, matrices and conversion examples. Use its D65 conversion path
without treating the two spaces' channel triples as interchangeable.
[CSS Color 4: predefined spaces and conversion](https://www.w3.org/TR/css-color-4/#predefined)

## Conversion, gamut and fallback

Expose separate pure operations for conversion, gamut testing and lossy export.
`convertColor` returns extended coordinates without mapping; `inGamut` reports
whether they fit the destination (with a documented small floating-point tolerance).
The initial explicit sRGB export uses channel clipping with a `clipped` result flag;
label it an approximation. A perceptual gamut mapper is a future distinct policy,
not an unversioned change to stored colors.

Always preserve P3 storage on sRGB displays. Paint a derived sRGB fallback before
the P3 declaration; test CSS syntax support before choosing P3 paint. A gamut
warning and accessible textual space/value readout must work without seeing color.
Keep checkerboards beneath alpha previews and both fallback/P3 gradients.

`color-gamut: p3` describes output capability approximately; it is not a promise
that every user sees an exact color or a reason to rewrite a value.
[Media Queries: color-gamut](https://www.w3.org/TR/mediaqueries-4/#color-gamut)

Keep semantic theme-token storage on its current contract. A theme export that
cannot represent P3 must reject with a specific explanation or require the user
to choose explicit sRGB export. Do not add P3 tokens merely because the standalone
picker now supports them.

## COLOR-2: plane and equivalent controls

Choose a saturation/value plane with a hue slider and optional alpha slider. Its
HSV coordinates are an editing model derived from the active encoded RGB space;
they are not CSS HSL. Name the plane's axes explicitly. Preserve remembered hue
through achromatic colors without changing the underlying accepted color.

The plane is pointer/touch convenience, with the same saturation/value settings
available through two separately named sliders and small numeric fields. Use one
shared draft model so plane, fields, gradients and chip previews agree. Do not
invent a two-axis ARIA slider. Each equivalent slider gets its own value, bounds
and keyboard behavior; touch-assistive-technology qualification remains manual.
[APG slider pattern](https://www.w3.org/WAI/ARIA/apg/patterns/slider/)

Pointer down begins a draft gesture, movement previews it and pointer up commits
one change; Escape/pointer cancellation restores the starting value. Preserve
scrolling outside the plane and limit pointer capture to the active gesture.
Offer useful visible focus and numeric controls in forced colors, without relying
on the gradient. Reuse existing small fields, theme surfaces and CSS Parts for
plane, thumb, axes, gamut message and preview; avoid inline structural styling.

## Editor integration and acceptance

Keep the existing token `data.color` string readable by older consumers for sRGB.
P3-capable extension registrations validate the new subset before rendering. An
editor's structured clipboard validates its generic payload envelope; the color
extension validates color meaning. Unrecognized extensions/spaces fall back to
readable text, never silently converted hex. Plain-text export includes the CSS
color and therefore retains space/alpha. Both editor backends reuse one picker
session; Apply inserts/replaces one token and one undo step, Cancel preserves the
original document and trigger text.

Required evidence before release:

1. Unit fixtures: hex compatibility, fractional coordinates, alpha, conversion
   reference vectors, inverse tolerance, out-of-sRGB P3, invalid syntax and
   deterministic serialization with no drift on reopen/format changes.
2. Three-engine tests: keyboard/numeric/plane agreement, cancel and authoritative
   writes, RTL, narrow/zoomed layouts, forced colors, slider fallback, SSR/hydration
   and both editor backends' paste/edit/undo. Test both supported and unavailable
   P3 paint paths without claiming device gamut from emulation.
3. Manual review on an actual wide-gamut display and physical touch device,
   including VoiceOver equivalent controls. Compare original versus explicitly
   exported sRGB side by side, with space labels.

No user decision blocks the proposed first slice. A demand for lossless P3 theme
JSON or perceptual gamut mapping would expand the storage/export scope and should
be planned explicitly. No runtime implementation is included in this checkpoint.

## Foundation implementation checkpoint · 2026-09-17

COLOR-1 now has immutable color values, literal parsing, D65 conversion, gamut checks, explicit sRGB clipping/export and nonmutating paint fallback. The picker and sliders support Display-P3; both editor backends share a validated color-token extension. Review the color-picker live example before COLOR-2. Physical wide-gamut appearance and assistive-technology qualification remain manual.

## Plane implementation checkpoint · 2026-09-17

COLOR-2 adds `en-color-plane` and opt-in `plane` on `en-color-picker`. HSV is derived in the active encoded sRGB or Display-P3 space. Pointer gestures preview with `en-input`, then propose one cancelable `en-change` on release; Escape, pointer cancellation and authoritative writes reconcile the draft. Equivalent Hue, Saturation, Value and optional Alpha sliders retain exact small numeric fields. Wide layouts place the plane beside its controls; narrow layouts stack them. The shared editor session commits one undoable token edit on Apply. The independent Progress Report holds current browser, SSR, unit and publication evidence; actual touch/VoiceOver and wide-gamut display review remain manual.

## Standalone hue wheel — approved implementation slice

Add independently imported `en-color-wheel`: opaque hue ring, shared immutable color model, preserved sRGB/P3/alpha, scalar keyboard semantics, exact hue input, preview/commit/cancel transactions and CSS Parts. Compose with the plane in documentation; leave picker defaults and dependencies unchanged. A filled hue/saturation disk is outside this slice. Verify gesture cancellation, veto/author writes, achromatic hue, SSR, responsive/forced-colors/RTL and Chromium/Firefox/WebKit before publication.
