# THEME-05 — Theme authoring surfaces

Implementation: twelve connected CSS hooks gain optional typed tokens and finite
managed choices. Existing component styles, state precedence and CSS grammars do
not change. Review at `/theme-authoring.html?progress-report` and use the ordinary
Theme Review token search to edit the promoted tokens.

## Choose an authoring route

| Surface | Supported values | Boundary |
| --- | --- | --- |
| Typed code | px/rem dimensions, sRGB/alpha colors, custom font stacks, weights 1–1000, multi-layer and inset shadows | Structured schema validation remains strict. |
| Managed editor | Curated literal choices, compatible token references, baseline font/shadow choices | A finite subset of compiler capability; unchanged exceptional values remain exact. |
| CSS and Parts | Consumer-supported gradients, responsive expressions, compound corners and local effects | Separate stylesheet; not represented in typed export, graph derivation or token diagnostics. |

Display-P3 requires a future coordinated schema/serialization/recipe/diagnostic
change. The color picker accepting a P3 literal does not establish compiler
round-trip support. Raw CSS colors depend on the consuming property, browser and
registration policy. Applications load fonts separately; font names in a token do
not download them.

## Promoted existing hooks

Prefix every token below with `component.`; each maps to `--en-` plus its dotted
path replaced with hyphens.

| Token | Type | Authoring default reference |
| --- | --- | --- |
| control.radius | dimension | radius.control |
| control.inline-padding | dimension | space.control-inline |
| control.min-size | dimension | size.control-min |
| control.background | color | color.surface |
| control.color | color | color.text |
| control.border-color | color | color.boundary |
| button.border-color | color | color.action |
| surface.radius | dimension | radius.container |
| surface.padding | dimension | space.panel |
| surface.background | color | color.surface |
| surface.color | color | color.text |
| surface.border-color | color | color.line |

All are optional aliases. An unpinned full theme continues to emit `initial`,
so contextual size, variant and family fallbacks remain active. The editor labels
these values **Authoring default (unpinned)**. It does not call them measured
rendered values. Explicit pins emit values; Restore removes the customization.
Full children reset inherited pins; partial output leaves unrelated properties
alone. THEME-04's explicit clear operation owns partial releases.

The shared minimum remains constrained by content and target floors. An explicit
radius/padding pin is fixed across sizes. A reference can follow a semantic role;
that does not make it follow each component's private selected-size output.
Surface hooks cover panel/card recipes; they are not universal container hooks.
Button border pins preserve existing variant and forced-color behavior.

Input-specific radius/border hooks do not currently have a connected contract;
this task does not invent them. THEME-03 owns its six new state hooks, and
THEME-06 owns composition/forwarding and dead-hook fixes. No family elevation hook
is added: the example intentionally applies an existing semantic shadow via a
card Part. Alpha editing for promoted color controls remains opaque by default;
code can author typed alpha values, with existing preservation rules.

## Same corners through typed authoring

```ts
import { resolveTheme, emitThemeCSS } from '@en-reve/tokens';
const theme = resolveTheme({
  pins: {
    'component.control.radius': {value:12,unit:'px'},
    'component.button.radius': {value:8,unit:'px'},
  },
});
const css = emitThemeCSS(theme, {selector:'.brand-theme'});
```

The shared 12px control radius supplies a default; the 8px button refinement wins.
The full theme also redeclares semantic roles and resets unrelated optional hooks.
For an exact partial assignment, explicitly select those two token IDs; do not
expect that partial operation to clear a pin merely because it was removed from
an authoring object.

## Code-authored baseline and managed review

`apps/docs/src/theme-authoring-baseline.ts` is the runnable baseline. It seeds a
Georgia/serif UI stack, weight 450, and a structured two-layer shadow. The demo uses
`createReviewDraft(baseline)`, `draft.exportJSON(metadata)`, then
`reopenReviewDraft(json, {baseOptions:baseline})`. It checks integrity and the
expected baseline before replacing the current draft. Font values and both shadow
layers remain exact. Reset baseline restores the supplied code-authored baseline;
Restore default rule in the main editor removes an individual customization.

This demo exports the token package's review envelope. It is not the documentation
app's build-bound candidate wrapper. Reopen it in this demo or with the token
package API. CSS Part decorations remain separate and are never claimed as
serialized candidate content.

## Compatibility and verification

The token inventory/source hash grows; stale review candidates still fail the
existing identity checks rather than being silently migrated. No token type,
registration default, CSS consumer or precedence changes. Existing CSS consumers
continue working. Code-authored overlays at these same token paths can continue
to override defaults.

Verify the new controls through actual editor Apply/Restore/export/reopen; compare
CSS and token routes on rendered components across browsers; verify fresh full
boundaries and selected sizes; preserve fonts/layers through review JSON; and run
registry/source coverage so managed metadata follows THEME-01. Integrate
THEME-03/04 sequentially, then rerun the relevant combined checks.
