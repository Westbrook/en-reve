# Web Awesome 3.13 default overlays

This review corrects two default presentation omissions. The previous Web Awesome
mapping left tooltip anatomy at the generic raised 16px/1.2 plate, and left dialogs
at intrinsic width with generic outer spacing. Existing title type, dialog corners,
surface color and elevation were already mapped; these are not newly discovered
changes. Qualification evidence is recorded separately in
[`verification-20261003.json`](verification-20261003.json).

| Family | Pinned source default | Mapping |
| --- | --- | --- |
| Tooltip typography | Small font is `round(1rem / 1.125, 1px)`; normal leading is 1.6 | A typed font divisor retains the exact source rounding: 14/22.4px at the default root, 18/28.8px at 125%, and 28/44.8px at 200%. |
| Tooltip enclosure | Text-normal inverse plate, surface-default ink, same-color .0625rem border, .1875rem corners, no shadow | Light plate/ink `#1b1d26`/white; dark `#f1f2f3`/`#101219`. Source corners and border retain rem scaling. |
| Tooltip measure | .25em block/.5em inline inset and 30ch maximum | Typed numeric em/ch roles follow the actual tooltip font. Custom content and documented native helper content own padding once, including explicitly authored arrows. The local viewport cap remains in force. |
| Dialog size | Fixed 31rem width; maximum width/height subtracts 2.5rem | Centered custom and native dialogs use the source width and clearance. Public maximum-size inputs remain authoritative; responsive drawer geometry retains its local contract. |
| Dialog sections | Zero surface padding/gap/border; body 1.5rem all sides; footer 0/1.5rem/1.5rem with .5rem gap | Existing public surface, body and footer Parts express the source. Custom footers without a direct authored footer slot and literally empty native footer regions collapse. Owned overflow, focus clearance and scroll padding remain intact. |
| Dialog header | Start 1.5rem; top/end `1.5rem - .75em`; bottom zero; title `round(1rem × 1.125², 1px)`/1.2/600 | A bounded numeric close-padding compensation retains the source equation, with the arithmetic applied only to source defaults. Title rounding produces 20px at the default root and 41px at 200%. A 1.5rem title-to-action gap corresponds to the source header-actions leading inset. |

The source `--wa-color-surface-raised`, `.75rem` dialog corners and large shadow
already agree with the selected theme. Dialog content adopts the source body
role for the default application context; authored rich content can still provide
its own typography.

The finite `dialog/sectioned` and `tooltip/compact` presentations are extended;
theme data still contains only typed tokens and registered role names. No CSS
selectors or arbitrary CSS values are imported from recipes. The new viewport
role is accepted only by dialogs; optional modifier roles do not replace omitted
font or spacing values.

Override-only public hooks for tooltip paint, radius and maximum size are read as
fallbacks at the actual surface. Dialog width is also a surface fallback, so an
inherited `--en-overlay-max-inline-size` can replace its source default. The
semantic `--en-shadow-overlay` token retains the established component-local
source reset for compact tooltip shadow roles; local inline overrides and direct
Part styling remain available. Paint remains inside the forced-colors guard.

## Deliberate adaptations

- En Reve keeps its authored arrow API. WA enables the tooltip arrow by default;
  this mapping paints an authored arrow consistently without changing activation,
  placement, collision handling, focus, Escape, or trigger timing.
- Dialog headers retain wrapping and protected close targets. WA has a separate
  header-actions slot and a nowrap header. The local description, dismissible and
  responsive APIs remain intact; source `without-header` and header-actions APIs
  are not introduced by theme data.
- WA's narrow-screen 80vh cap is an older viewport-chrome workaround. This mapping
  keeps the existing dynamic-viewport maximum and owned responsive drawer behavior.
- Source pulse-on-denied-dismissal and overlay animation choreography are outside
  this geometry correction. Existing reduced-motion and cancelable close behavior
  remain authoritative.
- Theme data supplies presentation only. Native helper users still own their
  authored markup, dialog/popover activation and interaction handlers. Native footer collapse uses `:empty`; whitespace-only authored native markup remains consumer-owned.

## Source provenance

Read-only installed source: `showcases/web-awesome/node_modules/@awesome.me/webawesome`,
version **3.13.0**, in the preserved original checkout. Distributed files identify
upstream source names in their comments. No installed source was changed.

| Distributed file | Source identity / relevant lines | SHA-256 |
| --- | --- | --- |
| `dist/chunks/chunk.DJLBC7Q4.js` | `tooltip.styles.ts`: max measure 7; typography 14–16; body 46–55 | `134c2d237c4f324cd09e42c650bf5be7e3cf0a9a8d39b950f2628f8a32962ea2` |
| `dist/chunks/chunk.4HJPQ4O4.js` | Tooltip component and authored arrow default | `ee0239e95a7e5adf19eb32ccb668635e8151e71e9ee16c95bfd03fd1e846dd9b` |
| `dist/chunks/chunk.XTG2LNFG.js` | `dialog.styles.ts`: width 7,27–29; surface 30–35; header 75–85; sections 115–139 | `58c7dea193d00ab688af2e0e127c7166550b5153de0aa913758df32d443ad37e` |
| `dist/chunks/chunk.YSHBD3IU.js` | Dialog component: header/footer predicates 195–196; header/close 208–232; footer 239–241 | `c5d5e30685246da36c00e120d988e7d06436c049bab8ab925838183f8fec7b0b` |
| `dist/styles/themes/default.css` | Font 191–219; space 227–240; border/radius 246–256; control padding 335; tooltip tokens 355–364 | `e19fff39b8c90f37d39e76535313e6da23f02cf2ca3b0e67407e17022fa6da50` |

`web-awesome-overlay-update.py` is a guarded, idempotent source updater. Its CLI
prints a preview; the coordinator imports `update(definition)` for serial
application. No other theme definitions or variants are changed.

The independent compiler fixture checks role typing, default values, scope
boundaries, optional-role compatibility and public fallback shape. The existing
source-fidelity browser owner gains light/dark custom/native measurements,
125% rounding, RTL/200% fit, public overrides, optional footer removal,
scrollport retention and real cancellation/focus behavior. Authored expectations
are distinct from execution results in
[`verification-20261003.json`](verification-20261003.json).


## Public overlay contracts

The shared presenter consumes `--en-overlay-background` as a `background`
shorthand. A color, gradient, or layered image with a color keeps its documented
CSS grammar. The separate SVG arrow still consumes its fill and stroke inputs;
source default arrow paint is unchanged.

`--en-overlay-padding` is a complete one-to-four-value `padding` shorthand on each
section/content padding owner. Source header compensation and body focus minima
occur only inside the fallback. An explicit public value replaces the complete
fallback; it is never inserted inside `calc()`, `max()`, or a single padding axis.
The source asymmetric header fallback swaps with RTL; explicit shorthand values
retain CSS's physical top/right/bottom/left ordering. Sparse tooltip roles preserve
the omitted axis's ordinary inset: zero for custom arrowless content and
`--en-space-2` for native surfaces and arrow content. Owned scroll padding and
scroll/focus controllers retain their existing rules.

Responsive dialog source widths use a library-owned surface-local default under
`--en-overlay-max-inline-size`. Every base overlay surface resets that private
default, so a nested different full theme cannot inherit an outer dialog's source
width. The core responsive controller still chooses centered dialog or full-width
bottom drawer, including an authored `responsive-query`. Centered Fluent and Radix
responsive dialogs retain the prior 600px maximum; the compact drawer keeps its
viewport width. The public width hook and direct Part styles remain authoritative.
The authored source is `packages/styles/src/overlays.ts`; this family is not one of
the generated adapter entries in `packages/styles/css-authoring.json`.

### Authored before/after CSS expectations

These examples explain the source correction. They are expected CSS behavior,
not captured browser output or a claim that a validation run passed. Source token
values are shown resolved for readability; qualification results belong in
[`verification-20261003.json`](verification-20261003.json).

```css
/* Before: a layered background becomes invalid as a background-color value. */
background-color: var(--en-overlay-background, rgb(27 29 38 / 1));
/* After: both a plain color and the following full background remain valid. */
background: var(--en-overlay-background, rgb(27 29 38 / 1));
--en-overlay-background: linear-gradient(transparent, transparent) rgb(20, 40, 60);
```

```css
/* Before: two/four values cannot participate in header length arithmetic. */
padding-block-start: max(0px, calc(var(--en-overlay-padding, 1.5rem) - .75 * 1em));
padding-inline-end: max(0px, calc(var(--en-overlay-padding, 1.5rem) - .75 * 1em));
/* After: the whole public shorthand replaces a valid source fallback. */
padding: var(--en-overlay-padding,
  max(0px, calc(1.5rem - .75 * 1em))
  max(0px, calc(1.5rem - .75 * 1em)) 0rem 1.5rem);
/* Tooltip content uses the same contract with its own source fallback. */
padding: var(--en-overlay-padding,
  calc(max(0, .25) * 1em) calc(max(0, .5) * 1em));
```

| Public input | Expected top / right / bottom / left |
| --- | --- |
| `8px` | `8 / 8 / 8 / 8px` |
| `8px 16px` | `8 / 16 / 8 / 16px` |
| `8px 16px 12px` | `8 / 16 / 12 / 16px` |
| `8px 16px 12px 20px` | `8 / 16 / 12 / 20px` |

```css
/* Before: responsive wide dialogs lost their source default after the host pin
   was removed; only the core form maximum (28rem) remained. */
max-inline-size: min(var(--en-overlay-max-inline-size, var(--en-layout-form-max)),
  calc(100% - var(--en-space-8)));
/* After: each base surface resets the private default, then its own source
   companion may set it to 600px at the documented surface. */
--_en-source-overlay-max-inline-size: initial;
max-inline-size: min(var(--en-overlay-max-inline-size,
  var(--_en-source-overlay-max-inline-size, var(--en-layout-form-max))),
  calc(100% - var(--en-space-8)));
/* Fluent/Radix source companion on the actual surface: */
--_en-source-overlay-max-inline-size: 600px;
/* Authored locally or inherited: replaces 600px in the centered computation. */
--en-overlay-max-inline-size: 347px;
/* Existing compact bottom drawer rules remain in force independently. */
max-inline-size: 100%;
inline-size: 100%;
```

At a 1024px viewport with default spacing and ample content, the responsive
centered maximum is 600px, or 347px with the illustrated public override. A compact
bottom drawer remains viewport-wide even with that override. A custom query can
select either presentation at the same viewport; the source fallback has no media
query and makes no presentation decision. Browser fixtures also exercise inherited
width input, native drawers, nested full-theme defaults, and direct typography
customization. Compiler assertions check emitted public-hook grammar and the
unguarded surface width default separately from browser geometry.
