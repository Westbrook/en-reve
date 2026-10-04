# Web Awesome slider mapping — source handoff

Prepared on October 3, 2026 for the coordinator's serial application. The new
`web-awesome-slider-update.py` exposes idempotent `update(definition)` and a
read-only preview command. It has not been applied or executed, and no builds or
tests were run for this handoff. The existing independent Progress Report remains
the coordinator's canonical task record; this note records the narrow mapping.

The source is the installed `@awesome.me/webawesome@3.13.0`, Default theme,
Default palette, blue brand at
`/Users/westbrook/Documents/repos/design-system/showcases/web-awesome/node_modules/@awesome.me/webawesome`.
The source installation was read only. Its distributed files identify the
upstream TypeScript styles in comments.

| Source size mapped to host size | Font at default root/scale | Track | Square thumb | Thumb border |
| --- | ---: | ---: | ---: | ---: |
| s → Small | 14px | 7px | 19.6px | 1.75px |
| m → Medium | 16px | 8px | 22.4px | 2px |
| l → Large | 20px | 10px | 28px | 2.5px |

`dist/chunks/chunk.WKHSZB7X.js:7–9` specifies track `0.5em` and thumb `1.4em`.
Lines 55–60 give the track its `9999px` radius and neutral normal fill. Lines
109–120 give the thumb a `0.125em` surface-colored solid border, `50%` radius,
activated fill and no shadow. The inherited border-box rule is in
`dist/chunks/chunk.AOKMSJXD.js:12–19`. Source size attributes use the font roles
in `dist/chunks/chunk.G5ZZIGWB.js:6–26`; the default sizes are defined in
`dist/styles/themes/default.css:192–198`.

| Paint | Light | Dark |
| --- | --- | --- |
| Track | `#e4e5e9` | `#2f323f` |
| Thumb and value fill | `#0071ec` | `#0071ec` |
| Thumb rim | `#ffffff` | `#101219` |
| Source focus outline | `#3e96ff` | `#3e96ff` |

The updater aliases the activated color to the theme's existing
`theme.button.primary.rest-background`, which already contains source blue in
both modes. Exact neutral track/rim values are new theme-local source tokens;
the existing theme identity and semantic contrast adaptations remain intact.
Color provenance is `dist/styles/themes/default.css:17,34,41,80,101,118,125,164,315`,
`dist/styles/color/variants/brand.css:8–9`,
`dist/styles/color/variants/neutral.css:5,12,14`, and
`dist/styles/color/palettes/default.css:80–81,133,140,142`.

The source has no hover, active, dragging or transition paint override. The
mapping therefore uses `shadow.none` for track/thumb/rest/hover/focus/disabled
shadow and zero paint duration. Disabled applies `opacity: 0.5` to the source
track subtree, including the fill, thumb and rim
(`chunk.WKHSZB7X.js:74–77,122–126`). The new companion uses `disabledOpacity: 0.5`
and `disabledThumbOpacity: 1` / `disabledFillOpacity: 1` to preserve one fade
through the native control or interval track. Disabled and interaction paint
roles retain the resting colors.

The source focus rule is a solid `0.1875rem` thumb outline with intentionally no
offset (`chunk.WKHSZB7X.js:47–52,153–157` and
`dist/styles/themes/default.css:264–267`). En Reve's focus treatment remains a
host adaptation. The source reverses horizontal thumb anchoring and fill insets
in RTL (`chunk.WKHSZB7X.js:85–93,128–141`); the existing host owns value and RTL
semantics. No native behavior is reimplemented by this mapping.

Scope limits: the source's five sizes map to three host sizes, and the fixed
metrics reproduce the source at root 16px/font scale 1. A finite `9999px` thumb
radius matches the circular source geometry. Fractional border widths may be
quantized by browser engines and require tolerance in rendered measurements.
Protected interaction targets, value ownership, cancellation, public local
hooks, forced colors and visible focus remain host requirements.

Next action: the coordinator applies the updater after the final slider
companion contract includes sized `thumbBorderWidthSmall/Medium/Large`,
`disabledOpacity`, `disabledThumbOpacity` and `disabledFillOpacity`, then runs
the coordinated checks.
Source inspection and prepared mappings do not establish rendered fidelity or
user acceptance.
