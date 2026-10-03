# Chakra UI-inspired paired theme

This independent En Reve interpretation uses **Chakra UI 3.37.0 with the teal
`colorPalette`** in light and dark appearances. Chakra's default palette is gray;
teal is an intentional collection choice. It adds no Chakra runtime, font download
or public component API.

## Pinned reference

The [official site](https://chakra-ui.com/) and
[palette guide](https://chakra-ui.com/guides/theming-change-default-color-palette)
were inspected on October 2, 2026. The verified release tag is
[`@chakra-ui/react@3.37.0`](https://github.com/chakra-ui/chakra-ui/releases/tag/%40chakra-ui%2Freact%403.37.0),
resolving to commit `2e7517745cff2fcde0b8012f136cf99611ff262a`.
Source files were retrieved at that exact commit, including:

- [Color values](https://github.com/chakra-ui/chakra-ui/blob/2e7517745cff2fcde0b8012f136cf99611ff262a/packages/react/src/theme/tokens/colors.ts),
  [semantic colors](https://github.com/chakra-ui/chakra-ui/blob/2e7517745cff2fcde0b8012f136cf99611ff262a/packages/react/src/theme/semantic-tokens/colors.ts),
  [fonts](https://github.com/chakra-ui/chakra-ui/blob/2e7517745cff2fcde0b8012f136cf99611ff262a/packages/react/src/theme/tokens/fonts.ts)
  and [text styles](https://github.com/chakra-ui/chakra-ui/blob/2e7517745cff2fcde0b8012f136cf99611ff262a/packages/react/src/theme/text-styles.ts).
- [Button](https://github.com/chakra-ui/chakra-ui/blob/2e7517745cff2fcde0b8012f136cf99611ff262a/packages/react/src/theme/recipes/button.ts),
  [input](https://github.com/chakra-ui/chakra-ui/blob/2e7517745cff2fcde0b8012f136cf99611ff262a/packages/react/src/theme/recipes/input.ts),
  [checkmark](https://github.com/chakra-ui/chakra-ui/blob/2e7517745cff2fcde0b8012f136cf99611ff262a/packages/react/src/theme/recipes/checkmark.ts)
  and [switch](https://github.com/chakra-ui/chakra-ui/blob/2e7517745cff2fcde0b8012f136cf99611ff262a/packages/react/src/theme/recipes/switch.ts) recipes.
- [Radii](https://github.com/chakra-ui/chakra-ui/blob/2e7517745cff2fcde0b8012f136cf99611ff262a/packages/react/src/theme/tokens/radius.ts),
  [semantic radii](https://github.com/chakra-ui/chakra-ui/blob/2e7517745cff2fcde0b8012f136cf99611ff262a/packages/react/src/theme/semantic-tokens/radii.ts),
  [shadows](https://github.com/chakra-ui/chakra-ui/blob/2e7517745cff2fcde0b8012f136cf99611ff262a/packages/react/src/theme/semantic-tokens/shadows.ts)
  and [focus implementation](https://github.com/chakra-ui/chakra-ui/blob/2e7517745cff2fcde0b8012f136cf99611ff262a/packages/react/src/preset-base.ts).

## Mapping and adaptations

| Role | Light | Dark |
| --- | --- | --- |
| Canvas / panel | `#ffffff` / `#ffffff` | `#09090b` / `#111111` |
| Subtle surface | `#f4f4f5` | `#18181b` |
| Main / muted text | `#09090b` / `#52525b` | `#fafafa` / `#a1a1aa` |
| Decorative line / functional boundary | `#e4e4e7` / `#71717a` | `#27272a` / `#a1a1aa` |
| Solid action | `#0c5d56` | `#0b7e74` |
| Solid hover / pressed | `#114240` / `#032726` | `#0c8177` / `#0a756c` |
| Action ink / focus | `#0c5d56` | `#5eead4` |
| Selected / emphasized fill | `#ccfbf1` / `#99f6e4` | `#032726` / `#114240` |

Chakra's teal 600 solid has only about **3.74:1** contrast with white ordinary
text. Light actions use teal 700 (**7.73:1** with white). Teal 700 is only
**2.44:1** against the dark panel, so dark actions use independently adapted
`#0b7e74`: **4.94:1** with white and **3.82:1** against the panel. Dark hover and
pressed retain **4.75:1** and **5.56:1** with white. Opaque state colors substitute
for Chakra's opacity-based solid hover.

Stronger functional boundaries achieve approximately **4.83:1** light and
**7.37:1** dark against panels. Mode-specific focus achieves **7.73:1** and
**12.77:1**; muted text remains above **4.5:1** on mapped neutral surfaces.
Decorative lines remain subtle. These calculations do not establish contrast on
arbitrary application backgrounds or certify brand artwork.

The pair retains a **40px minimum control envelope**, **4px control corners**,
**6px panels/dialogs**, **2px checkbox corners**, **20px choices**, and a
**40×20px switch with a 16px thumb**. Comfortable density and content-driven height
preserve En Reve's target floors and text growth. The font stack starts with Inter
and platform fallbacks, without downloading or assuming a font. Body is 16/24px,
UI/input/data 14/20px, metadata 12/16px; UI/labels use 500 and inputs use 400.

The trusted baseline supplies fonts, layered shadows and source extension tokens;
independent managed edits supply both palettes. Existing companion variants map
primary to solid teal, secondary to a teal outline, ghost to teal text and subtle
interaction fills, and danger to red 600 with white labels and deeper red states.
Secondary outlines use readable action ink instead of the source's fainter border.

Fields use an opaque panel fill for predictable nested composition. The source's
1px inside input focus becomes a **2px solid inset contour**; buttons and choices
keep a **2px solid contour with 2px offset**. Radio indicators use readable action
ink. Selection, navigation and tabs share the teal semantics. Native switch
anatomy retains its muted unchecked thumb and bordered track; it does not reproduce
Chakra's white elevated unchecked thumb. Cards/popups/dialogs use Chakra's small,
medium and large layered shadows, including dark inset edges. Shared interaction
timing uses 150ms, regular paint 200ms, and the source easing; press displacement
and scaling remain neutral. No popup animation is added.

## Verification limits

The catalogue replay, diagnostics, paired CSS/JSON roundtrips, focused state
contrast assertions and maintained browser journeys apply to this pair. Execution
receipts belong to the current progress report. This mapping makes no claim of
pixel equivalence, all-background accessibility or manual assistive-technology
coverage. Existing native semantics, theme resets, partial inheritance, forced
colors and reduced-motion behavior remain authoritative.
