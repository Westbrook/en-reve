# Paired Astryx and shadcn dark recipes

These are complete Dark/Compact managed edit sequences for a fresh `createReviewDraft({})`, paired with canonical light recipes in `tooling/theme-candidates/inspired`, originally derived from `artifacts/theme-candidates/spectrum2-latest` and now carrying the bounded light danger-text corrections below. They are inspired En Rêve adaptations, not official themes or implementations of the reference components. They use explicit source dark branches, not inversion. All existing non-color edit operations and resolved geometry, typography and motion remain identical to the corresponding light recipe.

## Astryx branded website skin

The site's [theme source](https://github.com/facebook/astryx/blob/1e0c2acf27b7c0a1d56f64088aaa664cf15be6bc/apps/docsite/src/themes/astryxTheme.ts) provides dark primary ink, on-action ink and body color. Its [brand constant](https://raw.githubusercontent.com/facebook/astryx/main/apps/docsite/src/constants.ts) separately provides dark logo blue. This remains distinct from the Neutral component-preview theme. Relevant declarations were cross-checked against official current source on 2026-09-10.

| En Rêve paint | Dark value | Mapping |
| --- | --- | --- |
| `palette.accent` → brand | `#3D87FF` | Explicit dark brand constant; blue is not the action seed |
| `palette.text` / action / focus | `#DFE2E5` | Primary ink; existing action→text and focus→action aliases retained |
| `color.on-action` | `#15110C` | Explicit site on-accent dark branch; new pin |
| `palette.canvas` | `#111112` | Site body dark branch |
| Selected / accent-subtle | `#3A3A3D` | Primary at 14%, composited over `#1F1F22` |

The source has no foreground token for an arbitrary filled blue brand tile. `color.on-brand` therefore retains En Rêve's foreground derivation, rather than inventing an Astryx brand-text polarity.

The remaining neutral colors come from [Astryx core tokens](https://github.com/facebook/astryx/blob/1e0c2acf27b7c0a1d56f64088aaa664cf15be6bc/packages/core/src/theme/tokens.stylex.ts): surface `#1F1F22`, popover/raised surface `#28292C`, secondary text `#AAAFB5`, emphasized border `#494D53`, and shared control boundary mapped from dark gray border `#748695`. The ordinary border `#F2F4F619` becomes opaque `#343437` over the surface. Muted `#1111127F` similarly becomes `#18181A`.

White hover/pressed overlays retain alpha `12/255` and `25/255` on option rows. On opaque action ink they resolve to `#E1E3E6` / `#E2E5E8`. The scrim is source `#11111299`. Transparent selected rows and the existing medium selected weight remain. Status **text** uses the actual dark text ramps: red `#FFB2B8`, yellow `#FBCE03`, green `#A5F690`. This semantic role mapping deliberately avoids treating the darker error/success fills as ordinary text. It was reviewed with the token specialist.

## shadcn homepage Rhea / Neutral

Use the [Neutral theme's own dark branch](https://github.com/shadcn-ui/ui/blob/3ba91b1cc83e1bbe4ab35a422ff2a694849c5048/apps/v4/app/legacy-themes.css), not the surrounding site's generic `.dark` accent. Retained homepage source confirms `.theme-neutral` and `base-rhea` imports. Relevant colors match [official current Neutral source](https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/app/legacy-themes.css).

| Source role | En Rêve paint | Dark sRGB |
| --- | --- | --- |
| Background | Canvas | `#0A0A0A` |
| Card / popover | Surface / raised | `#171717` |
| Foreground | Text | `#FAFAFA` |
| Primary | Brand / action seed | `#E5E5E5` |
| Primary foreground | On-brand / on-action | `#171717` |
| Secondary / muted / accent | Subtle / selected / highlighted rows | `#262626` |
| Muted foreground | Secondary text | `#A1A1A1` |
| Ring | Focus / protected shared boundary | `#737373` |
| Destructive | Danger text | `#FF6467` |

These values are the declared OKLCH colors converted with the repository's CSS Color 4 matrices and rounded to 8-bit sRGB, consistent with the light candidate's encoding. They are not a claim of exact wide-gamut numerical identity. Warning and success retain the En Rêve dark defaults because this Neutral theme does not supply corresponding general semantic roles.

[Rhea's component stylesheet](https://github.com/shadcn-ui/ui/blob/3ba91b1cc83e1bbe4ab35a422ff2a694849c5048/apps/v4/registry/styles/style-rhea.css) defines the remaining paint relationships:

- Primary hover is 80% primary; over the card surface it becomes `#BCBCBC`. Pressed retains that paint; the source's translation is not reproduced by tokens.
- Ordinary line/accent-border is 10% white over the card, `#2E2E2E`.
- Input fill is half of the 15%-white input token: 7.5% white over the card, `#282828`. The managed field role is opaque-only, so this is an explicit card-context approximation.
- Popup border keeps foreground at 10% alpha. Highlighted rows use `#262626`; selected rows keep transparent paint, ordinary weight and their checkmark.
- Dialog/drawer scrim is black at 30%, added explicitly. Backdrop blur remains outside this recipe.

## Light danger-text correction after rendered review

The rendered light danger badge exposed a contrast gap on its actual neutral surface. The correction changes only `palette.danger-text`; filled action paint, dark recipes, geometry, typography and motion remain unchanged.

| Candidate | Previous text | Corrected text | Rendered badge background | Calculated contrast before → after | Basis |
| --- | --- | --- | --- | --- | --- |
| Astryx | `#E3193B` | `#D31130` | `#F3F6F7` | 4.3274 → 4.9674 | Existing source light `--color-icon-red`, mapped to our danger-text role |
| shadcn | `#E40014` | `#E20014` | `#F5F5F5` | 4.4703 → 4.5388 | Two-step sRGB red-channel reduction from the rounded Neutral destructive token |

Astryx's [core source](https://github.com/facebook/astryx/blob/1e0c2acf27b7c0a1d56f64088aaa664cf15be6bc/packages/core/src/theme/tokens.stylex.ts) explicitly defines `--color-icon-red: light-dark(#D31130, #E3193B)`. This is a source-backed role adaptation, not a claim that it is the next step of a semantic error-text ramp. Its separate light text-red value is darker still; the selected icon red supplies the requested bounded correction.

The [Neutral light branch](https://github.com/shadcn-ui/ui/blob/3ba91b1cc83e1bbe4ab35a422ff2a694849c5048/apps/v4/app/legacy-themes.css) defines destructive `oklch(0.577 0.245 27.325)` but no separate stronger danger-text ramp. The corrected `#E20014` is an En Rêve accessibility adaptation, not an official shadcn token: its red channel is 226 instead of 228, while green remains 0 and blue 20.

Both corrected light recipes pass in-memory managed replay with no diagnostics and byte-identical export/reopen/reexport. Calculations use the parent-reported rendered backgrounds; regenerated candidate browser verification remains the parent's next check. No runtime model or component behavior changes.

## Shared boundaries and validation

Opaque composites match their stated background, not every arbitrary nested surface. Geometry, responsive text differences, font assets, native-picker fallbacks, protected interaction targets, focus behavior and the existing single-layer shadow adaptations are unchanged. Mode-specific default shadow paint can resolve through the retained aliases; its geometry is unchanged. The canonical light recipes change only their danger-text pin as documented below; their other previously accepted approximations remain. The historical light artifacts retain their original evidence identity.

`astryx-dark-edits.json` contains 75 operations; `shadcn-dark-edits.json` contains 70. Both passed in-memory managed replay, export/reopen and byte-identical reexport with the existing built token package and no compiler diagnostics. All authored non-color operations and all resolved non-color/non-shadow values compare identically to the corresponding light candidate. No build, browser or Sites operation ran.

`additional-provenance.json` retains source snapshots/hashes, recipe hashes, changed paint, conversion/compositing policy and declared-pair measurements. The pinned source files were available in the earlier review cache and their hashes match its manifest; relevant declarations were cross-checked against official current source. The brand constant was freshly read at the official mutable `main` URL because the pinned fetch returned a cache miss; no commit or byte hash is invented for that read.

Compiler diagnostics and calculated contrast are distinct from fidelity and accessibility acceptance. Rendered default/hover/active/selected/disabled/focus states, nested backgrounds, forced colors, native controls and physical input still need the parent's candidate review. There is no unresolved source-mapping product question, publication claim, or automatic adoption.

## Rating target shape adaptation

Astryx- and shadcn-inspired light/dark recipes now pin `component.rating.star-radius` to `{radius.pill}`. Together with En Rêve's square star targets, this produces circular focus contours instead of the earlier rounded rectangles. This is a local review-driven adaptation, not a claim about an official source rating component. The independent “No rating” action and every other family retain their existing radius rules. A consumer can select zero or an intermediate managed radius to obtain rectangular or softly rounded targets.
