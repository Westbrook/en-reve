# Web Awesome avatar mapping — source handoff

Prepared October 3, 2026 from the installed `@awesome.me/webawesome@3.13.0`,
Default theme and palette. This source follow-up ran no builds or tests.
`web-awesome-avatar-update.py` exposes `update(definition)` for the coordinator's
serial application; its CLI only prints a preview.

The pinned distributed `dist/chunks/chunk.YUS4MAP3.js` identifies upstream
`src/components/avatar/avatar.styles.ts`; its SHA-256 is
`b3c7a00d73d694730fda57e87b1d11d10639e785c32b2ca1c6ee7110a1dc06bc`.
Lines 7–20 set a continuous `--size` default of `3rem`, neutral normal plate/ink,
and initials typography at `calc(var(--size) * .4)`. Lines 44–46 set unit leading
and uppercase. Default inherited body weight is 400. The component defines no
hover, held or disabled presentation; those are not missing theme state axes.

| Default signature | Light | Dark |
| --- | --- | --- |
| Diameter at 16px root | 48px | 48px |
| Initials type | 19.2px / 1 / 400 | 19.2px / 1 / 400 |
| Plate | `#e4e5e9` | `#2f323f` |
| Initials ink | `#424554` | `#abaeb9` |

The paint aliases are `neutral-fill-normal` and `neutral-on-normal` in
`dist/styles/themes/default.css:79–87,163–171`, resolved through the default
neutral/gray palette at `dist/styles/color/palettes/default.css:133–140`.
Circle is the default; source square and rounded variants remain explicit
application choices. The existing public `--en-avatar-radius` can express their
geometry without adding source props to En Reve.

The finite `avatar/avatar-subtle` presenter adds optional
`diameter-font-scale: number`. It follows the frame's actual `--en-avatar-size`,
then the library's selected avatar diameter and public avatar size role. The
older text-relative `font-scale` remains compatible when the new role is absent.
Source paint is gated out of forced colors. Both the custom `fallback` Part and
the documented native `.en-avatar > .en-avatar__fallback` receive the metrics;
a native child with its own full theme is excluded.

Local S/M/L diameters remain En Reve's 42/48/60px adaptation, producing initials
at 16.8/19.2/24px. An explicit 40px public size gives 16px initials. The source
offers continuous `--size`, not those three named avatar profiles. Image cover,
image failure, accessible identity, decorative naming and automatic initials
remain component-owned. Source user-icon fallback and prop vocabulary are not
introduced through theme data.

The isolated compiler regression is `packages/tokens/test/companion-avatar.test.mjs`.
Browser acceptance must cover light/dark paint, source ratio at default/inherited
and overridden sizes, image/name fallback, native helper delivery, nested full
themes, text growth and forced colors. Authored checks are not passing receipts.
