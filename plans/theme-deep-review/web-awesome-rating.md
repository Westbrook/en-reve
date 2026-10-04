# Web Awesome rating source mapping

October 3, 2026. Source-only review of the pinned **Web Awesome 3.13.0, Default theme, Default palette** and the prepared En Reve candidate in `/private/tmp/en-reve-inspired-review-20261003`. Implementation is prepared; this document supplies no build, browser, accessibility or manual acceptance receipt.

## Source evidence

Primary files are under `showcases/web-awesome/node_modules/@awesome.me/webawesome/` in the original checkout. `package.json` identifies version 3.13.0. The distributed source chunks retain their original TypeScript source labels.

| Source | Independent finding |
| --- | --- |
| `dist-cdn/chunks/chunk.QG644JIK.js`, lines 8–16 and 33–45 (`rating.styles.ts`) | Inactive `--wa-color-neutral-on-quiet`; active `--wa-color-yellow-70`; symbol padding `.125em` on every side; a separate row gap `.125em`; host radius `--wa-border-radius-m`. |
| `dist-cdn/chunks/chunk.JB5Y2AN3.js`, lines 8–28; `dist/styles/themes/default.css`, lines 194–198 | Source xs/s/m/l/xl font sizes are 12/14/16/20/25px at root 16px and font scale 1. En Reve maps its small/medium/large choices to source s/m/l. |
| `dist-cdn/chunks/chunk.WLKYECLX.js`, lines 24–30 and 58–64 (`icon.styles.ts`) | The default icon canvas is **1.25em wide by 1em high**. SVG height is 1em, width auto, overflow visible. Rating does not opt into another canvas. |
| `dist-cdn/chunks/chunk.RU3YLNR2.js`, lines 67–70 and 238–299 (`rating.ts`); `chunk.J63DRE3X.js`, lines 54 and 76 | The default symbol changes between Font Awesome solid and regular star paths in a `0 0 576 512` viewBox. These are separate artwork paths, not the Unicode stars used by En Reve. Fractional values use clipped regular/solid overlays. |
| `dist/styles/color/palettes/default.css`, lines 37, 136 and 138; `dist/styles/color/variants/neutral.css`, lines 8–10; `dist/styles/themes/default.css`, lines 85 and 169 | Active `#ef9d00` in both modes; inactive `#545868` light and `#9194a2` dark. |
| `dist-cdn/chunks/chunk.QG644JIK.js`, lines 23–25 and 62–92; `dist/styles/themes/default.css`, lines 255, 265–267 and 300–302 | Terminal hovered star scales 1.2 over 150ms ease; the enabled rating previews the cumulative hovered value. Disabled host opacity is .5, retaining source selected hue. Host focus outline is 3px with 1px offset and 6px radius. Readonly/disabled suppress hover enlargement; forced colors changes active ink to SelectedItem. |

These source dimensions follow independently from the font size, icon canvas and padding; they are not measurements inferred from the En Reve output:

| Metric, px | Small / source s | Medium / source m | Large / source l |
| --- | ---: | ---: | ---: |
| Glyph font / SVG height | 14 | 16 | 20 |
| Icon canvas width × height | 17.5 × 14 | 20 × 16 | 25 × 20 |
| Symbol padding per side | 1.75 | 2 | 2.5 |
| Gap between padded symbols | 1.75 | 2 | 2.5 |
| Source padded symbol width × height | 21 × 17.5 | 24 × 20 | 30 × 25 |
| Source five-symbol row width × height | 112 × 17.5 | 128 × 20 | 160 × 25 |

## Prepared mapping

Before this correction the candidate had no rating companion rule or rating-specific pins: selected stars inherited blue `color.action-text` (`#0053c0` light / `#6eb3ff` dark). Its empty gray already matched the source.

`web-awesome-rating-update.py` exposes `update(definition)` for the coordinator's serial mutation of the canonical definition; its CLI only previews. The new rating rule selects the existing `compact` presentation, independent source color tokens, optional small/medium/large glyph, canvas, padding, gap and target roles, and scoped positive-target press defaults. Existing compact recipes without those roles preserve their existing dimensions and zero gap.

The compiler addresses `en-rating::part(star-options)`, `::part(star-option)`, `::part(star)` and the additive semantic `::part(star-filled)`. The latter identifies all stars included in the current actual score in initial server rendering and live updates, including while disabled. The native counterpart is the authored `.en-rating > .en-rating-values > .en-rating-item > .en-rating-star` recipe and its public `data-filled` marker; each item contains its native `.en-rating-input` radio. The `.en-rating-clear` choice remains separate from the positive-value row. Each addressed native child excludes a new `data-en-theme` boundary. These selectors never cross into custom-element shadow ancestry. Glyph paint defaults live on the glyph; customization applies to the corresponding public Part or native helper, rather than an inherited host value that cannot replace a child declaration. Held-state defaults use private compiler fallbacks consumed only after the public `--en-rating-pressed-*` hooks, preserving inherited author overrides.

The source size values use the established absolute size-selection bridge, so omitted size selects medium and explicit `size="inherit"` follows its context. Positive targets retain a square side of at least 24px: the prepared small/medium/large sides are **24/24/30px**, with the normal **44px coarse-pointer floor**. Glyph canvases, padding and gaps retain the source values above. At the default floors the corresponding five-choice rows are 127/128/160px wide, before any wrapping required by the available container.

Filled ink is the source yellow in both modes and empty ink is the source neutral gray. Only positive targets receive transparent held background, scale 1, offset 0 and no pressed shadow defaults. The no-rating choice retains its ordinary selected, pressed and disabled behavior. Disabled positive rows fade once to .5 while the semantic filled-star Part preserves source yellow on the included stars and source neutral on empty stars. Author paint is guarded by `forced-colors: none`; native system-color styling remains authoritative.

## Deliberate adaptations and limits

- Native radio selection, explicit no-rating choice, integer values, transactional changes, visible label/description, target floors, wrapping, immediate per-choice focus and reduced-motion behavior remain En Reve contracts. This mapping does not introduce source slider semantics, fractional values, readonly behavior or hover-preview value changes.
- Unicode filled/empty stars remain the component artwork. The public Parts expose decoration and semantic filled state, but this mapping does not replace the component's glyphs with Font Awesome artwork. Source icon canvas dimensions do not claim source path fidelity.
- The source has one host focus contour and non-square padded symbol cells; En Reve keeps per-choice contours and protected square targets. Existing theme focus width and offset remain in force.
- The ordinary disabled recipe remains muted when no companion refines it. This source profile uses the semantic filled-star Part and native `data-filled` marker to preserve selected yellow under one .5 row fade without changing selection or disabled behavior.
- Source yellow `#ef9d00` has a calculated 2.21:1 contrast against white. This correction intentionally records the requested source color rather than treating it as the previous blue contrast adaptation. Source correspondence does not establish accessibility equivalence on every adjacent surface.
- Native markup authors continue to synchronize their own radio state, `data-filled` markers and Unicode symbols. The companion adds presentation, not native application behavior.

## Qualification handoff

The isolated compiler regression uses independently authored source constants and covers both public deliveries, source sizes, optional-role compatibility, protected floors, scoped state paint and forced-color guards. Focused CSR and SSR tests cover the additive filled-star Part. These are prepared but have not been executed by this owner. Coordinated runtime checks should cover light/dark, small/medium/large/inherit, both deliveries, real radio selection, clear choice, held state, disabled and fieldset-disabled state, coarse targets, RTL, forced colors and local public overrides. Full Font Awesome artwork, fractional/read-only interaction and source hover previews are expressly outside this prepared mapping.
