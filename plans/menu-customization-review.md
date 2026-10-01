# Menu and selection customization review

The four reference systems need independent popup geometry, row geometry and state
paint. The earlier candidates could approximate their page palettes, but native
enhanced select ignored existing popup hooks, and a broad row background override
could flatten interaction feedback. This review addresses those bounded styling
gaps in the delivered `en-select` and `en-combobox`.

## Reference scope

| Candidate | Reference basis | Popup / row direction | Remaining adaptation |
| --- | --- | --- | --- |
| Spectrum 2 | Adobe token release 15.4.0 and a separately pinned React Spectrum S2 source snapshot | 10px popup, 8px inset, 8px rows; neutral highlighted rows, transparent selected fill and medium weight | System fonts; 16px/20px shared metrics use the S2 200 typography step; target envelope and field borders retain en-reve behavior |
| Fluent | React v9 webLightTheme and Microsoft component source | 4px popup and rows, 4px inset, 2px row gap; 6px/8px row padding; selection check without bold/blue selected fill | Trailing check, protected target envelope, single-layer managed elevation |
| Astryx | Branded website light theme, distinct from Neutral previews | 16px popup, 12px rows, 4px inset; translucent neutral hover/press and medium selected weight | No rich option descriptions or content columns; system fonts and managed elevation |
| shadcn/ui | Homepage Rhea / Neutral component demo, not a universal shadcn default | 18px popup, 14px rows, 4px inset; neutral highlight and ordinary selected weight | Opaque material choice; other styles and translucent/inverted menu modes remain separate choices |

Dimensions describe the reference-oriented candidate pins at a 16px root, not
fixed rendered heights. Content, wrapping, size selection and target minima can
grow controls. These four comparison candidates remain light-only; the shared
library hooks also work with default dark themes. No dark reference candidate or
pixel-equivalence acceptance is implied.

Sources: [Adobe tokens at the pinned source commit](https://github.com/adobe/spectrum-design-data/tree/63daf55e40fe469dc1b30248e57df7664afa005a/packages/tokens/src),
[Spectrum 2 Menu](https://github.com/adobe/react-spectrum/blob/4693fcc844a341107e7dd26fe456edb1e269e44c/packages/%40react-spectrum/s2/src/Menu.tsx),
[Fluent Option styles](https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-combobox/library/src/components/Option/useOptionStyles.styles.ts),
[Fluent Select guidance](https://fluent2.microsoft.design/components/web/react/core/select/usage),
[Astryx Selector](https://github.com/facebook/astryx/blob/1e0c2acf27b7c0a1d56f64088aaa664cf15be6bc/packages/core/src/Selector/Selector.tsx),
[shadcn Rhea styles](https://github.com/shadcn-ui/ui/blob/3ba91b1cc83e1bbe4ab35a422ff2a694849c5048/apps/v4/registry/styles/style-rhea.css).
Fluent source was inspected on 2026-09-10; its linked branch is not a frozen release.

## Implemented boundary

`component.option-list.*` tokens specialize list fill, text, boundary, corners,
inset, gap, height ceiling and shadow without changing unrelated dialog styles.
`component.option.*` tokens specialize row spacing, corners, weights and rest,
selected, active, hover, pressed and disabled paint. Their CSS properties retain
the existing broader hooks as fallbacks; full theme scopes reset unpinned values.
The managed editor supports alpha only for the relevant background/border roles,
with anchored spacing/radius choices and compatible aliases.

The native enhanced picker and combobox consume one internal paint helper.
Their semantic adapters remain separate. Native option focus-visible uses its
highlight paint; a combobox's keyboard candidate retains its own active contour.
Combined paint priority is disabled, pressed, hover, active, selected, rest.
Selection checks remain independent of color and weight, and disabled native
options no longer receive enabled hover paint.

Combobox rows add selected/active/disabled Parts plus label and indicator Parts.
Consumers can style these surfaces without querying private shadow attributes.
Native options expose an option Part; OS picker styling remains browser-dependent.
The implementation retains native input identity, SSR, form/events, positioning,
coarse targets, forced colors and no-attribute medium sizing.

See the [styling contract](../packages/styles/README.md#option-lists-and-result-rows),
[combobox guide](../packages/elements/src/combobox/README.md), and
[select guide](../packages/elements/src/select/README.md).

## Work requiring discussion or its own implementation slice

1. **Action menus and submenus.** Add real command, checkable/radio-command and
   native-link semantics, disabled-item discovery, focus navigation, dismissal
   and trigger return behavior. The current `en-popover` is a nonmodal dialog;
   it must not be advertised as a menu. Reuse paint rather than relabeling it.
2. **Rich/grouped collections.** Define descriptions, icons, shortcuts, indicator
   placement and named groups, including filtering and empty-group behavior.
   Do not fake group headings as disabled options or nest interactive links
   inside a listbox option.
3. **Trigger variants.** S2 distinguishes a filled Picker from an editable bordered
   ComboBox. Quiet/filled/open trigger treatments and a custom noneditable
   dropdown need their own coherent family/API proposal.
4. **Materials and elevation presets.** Code already supports multilayer shadows;
   the managed editor needs curated source presets for exact reference elevation.
   Translucent/inverted menus additionally need backdrop/contrast review. No
   generalized freeform material editor is required to make that next step.

Native selectors intentionally remain native where customizable select is absent
or explicitly disabled. No CSS API can guarantee pixel-identical platform menus.
The separate physical iPhone combobox positioning feedback remains open; themed
desktop/emulated checks cannot close it.

## Verification

Focused checks cover real keyboard/pointer selection, simultaneous selected,
active and hovered rows, explicit versus broad overrides, disabled interactions,
system colors, native picker/fallback, live editing through theme changes,
scoped reset/inheritance and managed export/reopen. Candidate evidence must name
the actual build and file identities. Test receipts, refreshed candidates and
remaining manual acceptance are recorded in the independent Progress Report.

## Spectrum 2 release follow-up — 2026-09-10

The Spectrum candidate is pinned to the latest stable token release,
[@adobe/spectrum-tokens 15.4.0](https://www.npmjs.com/package/@adobe/spectrum-tokens/v/15.4.0),
and the latest stable component implementation,
[@react-spectrum/s2 1.7.1](https://github.com/adobe/react-spectrum/tree/4dd44e0f400636a87a9ad4390903e78c5ae6113c/packages/%40react-spectrum/s2).
The previous candidate already used these S2 tokens; this follow-up replaces its
development-source reference with the stable source and separates pill-button
inline padding (16px at the default rhythm) from field/option padding (12px).
The [versioned Button guidelines](https://github.com/adobe/spectrum-design-data/blob/63daf55e40fe469dc1b30248e57df7664afa005a/docs/s2-docs/components/actions/button.md)
support the retained pill family. This finite token mapping does not implement a
dynamic half-rendered-height padding formula.

`en-button` now exposes explicit `icon-only` / `iconOnly` geometry. Its equal-sided
box shares the single-line control minimum and grows for content and touch
targets. The full action label remains accessible; text-button inline-padding
customizations no longer stretch icon-only actions. Existing button radius
customization remains valid, so the Spectrum pill becomes circular within its
square bounds. The sticker-sheet example uses this API instead of hiding its
label with application CSS.

Focused browser verification covers all three engines, sizes/densities, enlarged
text/icons, loading, keyboard activation, native-node identity and coarse-pointer
targets. Built Spectrum SSR and hydration preserve the same native button and
34×34 desktop geometry (formerly 44×34). Four exact-build candidate files reopen,
retain isolated previews and reexport with the same source hashes in all three
engines. The refreshed candidates and source provenance live in
`artifacts/theme-candidates/spectrum2-latest` and the independent report's
downloads. Manual AT and physical-device acceptance remain separate.
