# Spectrum 2 and Fluent paired dark recipes

**Historical checkpoint:** The Fluent mapping below is superseded by the [Fluent 2 website rework](../../../plans/theme-refresh-fluent2.md). The primary source is now [fluent2.microsoft.design](https://fluent2.microsoft.design/); canonical definitions and current validation use the website skin. Retained React-default values document earlier work, not the current Fluent recipe.

Prepared 2026-09-10 from the light inputs in `artifacts/theme-candidates/spectrum2-latest`. These are independently authored dark recipes, not inverted light colors and not a context-only switch. The Spectrum light recipe now also receives the source-backed text corrections documented below, following actual rendered tab/badge findings; other light inputs remain unchanged. Every explicit typography, spacing, radius, target, density and motion input is preserved in its corresponding dark recipe.

## Versioned source authority

**Spectrum 2:** live registry metadata reconfirms `@adobe/spectrum-tokens` **15.4.0**, published September10 at00:39:45Z. Dark values come from its previously integrity-verified JSON source, which corresponds to design-data commit [63daf55e40fe469dc1b30248e57df7664afa005a](https://github.com/adobe/spectrum-design-data/tree/63daf55e40fe469dc1b30248e57df7664afa005a/packages/tokens/src). Its [color aliases](https://github.com/adobe/spectrum-design-data/blob/63daf55e40fe469dc1b30248e57df7664afa005a/packages/tokens/src/color-aliases.json), [palette](https://github.com/adobe/spectrum-design-data/blob/63daf55e40fe469dc1b30248e57df7664afa005a/packages/tokens/src/color-palette.json), [menu](https://github.com/adobe/spectrum-design-data/blob/63daf55e40fe469dc1b30248e57df7664afa005a/packages/tokens/src/menu.json) and [popover](https://github.com/adobe/spectrum-design-data/blob/63daf55e40fe469dc1b30248e57df7664afa005a/packages/tokens/src/popover.json) explicitly define dark sets. React S2 stable **1.7.1**, source [4dd44e0f400636a87a9ad4390903e78c5ae6113c](https://github.com/adobe/react-spectrum/tree/4dd44e0f400636a87a9ad4390903e78c5ae6113c/packages/%40react-spectrum/s2), remains the separate component reference. Its filled accent Button uses white ink.

**Fluent:** latest stable `@fluentui/react-theme` **9.2.2**, published August11, pins `@fluentui/tokens` **1.0.0-alpha.24**. The latter is the internal package's version; it does not make React Theme9.2.2 an alpha. The published token archive was downloaded, SHA512 verified, and its pure `webDarkTheme` export read without installation/building. npm records source [2dd2a9a96210919c35b210a1aa8e873ab67dbada](https://github.com/microsoft/fluentui/tree/2dd2a9a96210919c35b210a1aa8e873ab67dbada). The [public color-token tables](https://fluent2.microsoft.design/color-tokens) corroborate the dark aliases. The inspected [Option implementation](https://github.com/microsoft/fluentui/blob/2dd2a9a96210919c35b210a1aa8e873ab67dbada/packages/react-components/react-combobox/library/src/components/Option/useOptionStyles.styles.ts) uses `colorNeutralBackground1Hover/Pressed`, and its [Listbox](https://github.com/microsoft/fluentui/blob/2dd2a9a96210919c35b210a1aa8e873ab67dbada/packages/react-components/react-combobox/library/src/components/Listbox/useListboxStyles.styles.ts) uses `colorNeutralBackground1`.

## Authored dark values

| en-reve role | Spectrum 2 dark | Fluent webDarkTheme |
|---|---|---|
| Canvas / base / raised | #1b1b1b / #111111 / #222222 | #1f1f1f / #292929 / #292929 |
| Subtle surface | #2c2c2c (`gray-100`) | #141414 (`colorNeutralBackground3`) |
| Text / subdued | #dbdbdb / #afafaf | #ffffff / #adadad |
| Decorative line / shared control boundary | #393939 / #8a8a8a | #666666 / #adadad |
| Brand identity seed | #5681ff (`accent-content-color-default`) | #479ef5 (`colorBrandForeground1`) |
| Filled action / hover / pressed | #4069fd / #345bf8 / #345bf8 | #115ea3 / #0f6cbd / #0c3b5e |
| Action foreground | White | White |
| Selection/accent subtle | #0c2175 | #082338 |
| Focus | #5681ff, source content-blue adaptation | White |
| Popup border | #444444 | Transparent |
| Row hover / pressed | #323232 / #323232 | #3d3d3d / #1f1f1f |
| Row active | #323232 plus focus contour | Transparent plus focus contour |
| Rest / selected row fill | Transparent / transparent | Transparent / transparent |
| Disabled row text | #444444 | #5c5c5c |
| Danger / warning / success text | #ff6756 / #e06400 / #099d59 | #eeacb2 / #fdcfb4 / #54b054 |

Spectrum keeps its source dark popup border rather than copying the light transparent border. Fluent keeps the established warning role `colorStatusWarningForeground2`, now the explicit dark tint. Fluent's scrim changes from40% to50% black from `colorBackgroundOverlay`; Spectrum retains its existing en-reve scrim adaptation.

`palette.accent` drives the identity/brand blue; an independent `palette.action` pin drives the darker filled action blue. The two source roles coincided in the light candidate but differ in dark. `color.on-action` explicitly aliases the white foreground candidate. `color.on-brand` stays derived: these references do not define the foreground for this library's use of a content-blue identity mark as a filled surface. The derived result is an en-reve adaptation, not a claimed source token.

Fluent's light option-hover alias previously used `{color.surface-subtle}` because both relevant source light values happened to equal#f5f5f5. Their dark meanings diverge: generic background3 is#141414 while option hover is#3d3d3d. The dark recipe replaces that accidental equality with the correct explicit option role. This is why retaining light aliases mechanically would be incorrect.

## Preserved rules and limitations

- Spectrum retains16/20 UI/input metrics,16px rhythmic pill-button inset,8px fields,10px popup with8px inset and8px rows. Fluent retains14/20 UI metrics,4px control/list/row corners,6px/8px row inset and2px gap. These are the current reviewed-input choices; the library's shared geometry/target envelope remains in force.
- Both retain the existing system font stack, responsive content growth, state precedence and native-picker fallback. Exact brand typography, richer menu structures, checkmark-specific color and separate input/picker state families remain outside this recipe.
- Shared boundaries intentionally retain the stronger accessible-control role rather than weakening every control to the source field stroke. The single-layer shadow is still an approximation: Fluent's real dark `shadow16` has stronger .24/.28 layers; Spectrum has its own layered elevation. The managed editor has no corresponding new preset, so no arbitrary compound value is introduced.
- Disabled row colors are source inactive-state values, not ordinary-text contrast promises. Forced-color/system behavior remains a component concern. Contrast diagnostics alone do not certify complete rendered accessibility.
- Pairing must compile each context independently. Switching only `mode` while keeping one recipe's pins is not equivalent. Full scopes still reset optional hooks; partial scopes preserve unspecified overrides.

## Delivered checks

`spectrum-dark-edits.json`: **57 operations /56 pins**. `fluent-dark-edits.json`: **73 operations /72 pins**. Added dark surface pins make Fluent's base and raised values explicit instead of inheriting en-reve's unrelated dark defaults. All non-color light inputs remain structurally identical.

The corrected dark recipes were applied to the current compiled pure `createReviewDraft` API after root added the semantic link role, then exported and reopened. Managed edits passed, compiler diagnostics were empty, and resolved token roundtrips were exact. Extra brand-text contrast on base/canvas measured5.38/4.90 for Spectrum and5.18/5.87 for Fluent. These numbers cover those declared pairs only. `draft-validation.json` contains the receipt; `recipe-source-maps.json` contains each changed value and source alias.

No checkout edit, dependency install, build, browser/physical-device run or Site operation was performed. Root owns paired-envelope generation, final rendered review, distribution and publication. `provenance.json` binds the upstream releases and current light recipe hashes.

## Focus, error and link review corrections

Léonie’s focused review identified declared pairings that the existing compiler diagnostic list does not check. The draft now uses:

- **Spectrum focus #5681ff**, the source `accent-content-color-default`, in place of source `focus-indicator-color`#4069fd. Against active option#323232 the ratio rises from2.843 to3.651:1. This is a documented adaptation of role placement for this library’s inset focus contour, not a claim that Adobe changed its focus token.
- **Fluent error text #eeacb2**, published `colorStatusDangerForeground2` (alsoForeground3), instead ofForeground1#dc626d. Against base#292929 the ratio rises from4.164 to7.745:1. This uses a supported source text tint rather than modifying the background.
- **Independent text ink:** Spectrum pins`color.action-text` to the brighter source interaction content blue#6995fe; links inherit that same ink through the default link alias. Fluent pins`color.action-text = {palette.accent}` (#479ef5), with links inheriting through the default link alias. Ordinary link text now provides6.592/5.180:1 on each base surface; the brighter Spectrum choice also covers its subtle and selected surfaces. Filled-action backgrounds remain#4069fd/#115ea3 with white foregrounds. The new shared semantic`color.action-text` defaults to`{color.action}`, and`color.link` defaults to`{color.action-text}`, so existing themes preserve their behavior; explicit dark pins provide independent ink. Normal and visited `.en-link` use that role, disabled and forced-color rules remain separate. Navigation already has independent muted/active ink and is unaffected.

These pairwise calculations do not certify complete focus visibility or rendered text contrast across arbitrary consumer surfaces. Root owns CSS emission and browser checks after integration. Replayed corrected drafts pass with zero diagnostics and exact token/re-export roundtrips; `draft-validation.json` is the current pure-model receipt and `contrast-review.json` records these specific corrected pairs.

The Spectrum action-text adaptation uses published`accent-content-color-hover/down/selected`#6995fe. It provides4.920:1 on the retained selected fill#0c2175,4.875:1 on subtle#2c2c2c and5.554:1 on raised#222222. The darker source link blue would fail on the first two surfaces. Active option fill#323232 has its own explicitly pinned neutral option text#dbdbdb; action-text must not override that state role. Likewise Fluent option text remains explicitly white when hovered. These separate contexts avoid claiming that any one ink color works on every background.

Final candidate policy: neither dark recipe pins`color.link` independently. Links inherit the new action-text ink so ordinary links on the library’s subtle and selected surfaces do not retain a known contrast failure. Spectrum’s brighter source state color is an explicit cross-context adaptation; the public link role still permits independent consumer customization. Focus stays#5681ff and brand identity stays#5681ff.

## Rendered tab and badge corrections — Spectrum light and dark

Root’s actual paint verifier (`artifacts/theme-candidates/paired-appearances/rendered/verification.json`) found three additional contexts. The current staged recipes now use the next documented S2 content states, keeping all filled-action backgrounds unchanged:

| Branch / token | Former ink | New source ink | Actual retained background | New ratio |
|---|---|---|---|---|
| Light `color.action-text` | #3b63fb | #274dea: `accent-content-color-hover/down/selected` | Selected tab/accent badge#e5f0fe |5.464:1|
| Light `palette.danger-text` | #d73220 | #b72818: `negative-content-color-hover/down/key-focus` | Danger badge#e9e9e9 |5.194:1|
| Dark `palette.danger-text` | #fc432e | #ff6756: `negative-content-color-hover/down/key-focus` | Danger badge#2c2c2c |4.872:1|

These are adaptations of source content state colors to en-reve’s actual component backgrounds, not changes to Adobe’s default source roles. The new `spectrum-light-edits.json` is the full corrected light recipe (55operations/54pins); the existing staged `spectrum-dark-edits.json` retains57operations/56pins. Geometry, typography, motion, action-fill/default/hover/pressed pins and non-Spectrum recipes are preserved. The light branch must be regenerated from this new file rather than the earlier unchanged-light assumption.

Both corrected Spectrum branches pass current compiled managed replay with no compiler diagnostics and exact token/re-export roundtrips. Their actual declared paint ratios are recorded in `draft-validation.json`; root must rerun the rendered verifier and regenerate paired artifacts. No new runtime token or API was needed for this correction.

## Fluent dark checked-radio correction

This is a bounded candidate correction and optional library styling hook. It does not adopt the inspired theme or change the default visual language.

The checked radio's dot is painted against its neutral interior `color.surface` (#292929), whereas a filled button has a white foreground over `color.action` (#115ea3). Reusing the button fill as the radio dot yields 2.185:1. The correct source distinction is compound-brand **foreground/stroke**, not filled-action background.

The published stable [`@fluentui/react-theme` 9.2.2](https://registry.npmjs.org/@fluentui/react-theme/9.2.2) depends on [`@fluentui/tokens` 1.0.0-alpha.24](https://registry.npmjs.org/@fluentui/tokens/1.0.0-alpha.24). Its version-pinned [Radio source](https://github.com/microsoft/fluentui/blob/2dd2a9a96210919c35b210a1aa8e873ab67dbada/packages/react-components/react-radio/library/src/components/Radio/useRadioStyles.styles.ts) uses `colorCompoundBrandStroke` for the checked rim and `colorCompoundBrandForeground1` for the checked indicator. The corresponding published dark theme resolves both to **#479ef5**. The source has separate hover #62abf5 and pressed #2886de roles. Those extra state variants are not introduced in this small correction. The [Checkbox source](https://github.com/microsoft/fluentui/blob/2dd2a9a96210919c35b210a1aa8e873ab67dbada/packages/react-components/react-checkbox/library/src/components/Checkbox/useCheckboxStyles.styles.ts) paints its check against a filled background; that is a different contrast pairing.

`component.radio.selected-color` maps to `--en-radio-selected-color`. Its default alias remains `{color.action}`. The optional CSS property is unset in unpinned full themes, preserving the stylesheet fallback. Only Fluent dark adds `{palette.accent}` (#479ef5), which matches the checked foreground/stroke source value while keeping a live alias. Other branches and filled actions are unchanged. This role affects only the checked radio rim and dot; unchecked borders, checkbox/switch/range/rating paint, disabled states and focus/system-color rules retain their existing roles. It does not implement every Fluent Radio state or replace en-reve's native radio behavior.

The proposed dot/rim color provides **5.180:1 against #292929** (actual interior/base/raised) and **5.869:1 against #1f1f1f** (canvas). These numeric calculations do not claim complete rendered accessibility. The browser regression samples actual native-input pseudo-element paint, compares the dot with its real interior, checks same-size geometry and action-fill independence, exercises keyboard/disabled transitions and nested scope behavior, and checks Chromium's system-color precedence. Root owns execution and the resulting evidence.


## Command-family surface reuse

The initial one-level action menu and command-palette results now consume the existing option-list/option state and geometry roles; their toolbar consumes the existing button styles and action spacing. No source colors, dimensions, typography, aliases or recipe operations are changed by this extension. The palette retains the library's native dialog shell with a borderless, separately themed result region; its active candidate is not a permanently selected command. Existing full/partial scopes and the Fluent dark radio correction remain independent.

All four pairs must be regenerated against the new build. The candidate verifier exercises Portrait/Landscape outcomes through the actual toolbar, menu and searchable palette in each light/dark branch, including disabled menu activation, empty results, Escape/focus return and settled state paint. It records Chromium screenshots plus three-engine geometry/contrast/use evidence. These are new-surface checks; earlier combo/select checks do not substitute for them.

The existing Spectrum2 15.4.0, Fluent9.2.2, Astryx branded and shadcn Rhea/Neutral source mappings remain authoritative. The wrapping toolbar and shared palette anatomy are en-reve adaptations, not claims of matching each upstream behavior or every rich-menu feature. Fluent's official toolbar guidance uses a single row with overflow. This first slice deliberately retains complete labels and natural wrapping and introduces no automatic overflow, checkable commands, destructive variant or submenu. No inspired theme is adopted by generation or verification.

## Focus recipes and bounded field motion

The four pairs now exercise shared focus anatomy without changing native open/close behavior. All retain an immediate solid contour. This is deliberately not a claim of full upstream focus or motion equivalence.

- **Spectrum 2:** tokens 15.4.0 at `63daf55e40fe469dc1b30248e57df7664afa005a` specify 2px indicator thickness and 2px gap. Both branches pin these dimensions. The established brighter dark contour remains the documented contrast adaptation. [Layout source](https://github.com/adobe/spectrum-design-data/blob/63daf55e40fe469dc1b30248e57df7664afa005a/packages/tokens/src/layout.json).
- **Fluent:** the retained component source at `2dd2a9a96210919c35b210a1aa8e873ab67dbada` animates a compound-brand 2px field bottom stroke from scaleX(0) to scaleX(1). Both branches now select that accent using `{palette.accent}`, 200ms entry and 50ms exit. Their easing uses the published decelerate-mid and accelerate-mid curves as actual timing functions; the retained Combobox source assigns those curve tokens to `transitionDelay`, so this is a deliberate correction rather than a claim of literal generated-CSS equivalence. The primary full outline is retained alongside the accent. [Combobox source](https://github.com/microsoft/fluentui/blob/2dd2a9a96210919c35b210a1aa8e873ab67dbada/packages/react-components/react-combobox/library/src/components/Combobox/useComboboxStyles.styles.ts).
- **Astryx:** the retained token source at `1e0c2acf27b7c0a1d56f64088aaa664cf15be6bc` declares a 2px solid contour with a 3px offset. Both branches use those values. No popup animation is inferred from its generic duration scale. [Token source](https://github.com/facebook/astryx/blob/1e0c2acf27b7c0a1d56f64088aaa664cf15be6bc/packages/core/src/theme/tokens.stylex.ts).
- **shadcn Rhea/Neutral:** the retained source at `3ba91b1cc83e1bbe4ab35a422ff2a694849c5048` specifies a 3px ring at 30% opacity on buttons/fields. The new supplementary halos use the explicit Neutral ring colors (`oklch(.708 0 0)` light and `oklch(.556 0 0)` dark), converted to sRGB. Inputs/selects explicitly use 200ms color/box-shadow transitions; this shared recipe also applies 200ms to the button halo as an adaptation. The easing is Tailwind's default cubic-bezier(.4,0,.2,1). The existing stronger solid contour remains, so this is a layered accessibility adaptation rather than removal of the contour in favor of a translucent ring. [Rhea styles](https://github.com/shadcn-ui/ui/blob/3ba91b1cc83e1bbe4ab35a422ff2a694849c5048/apps/v4/registry/styles/style-rhea.css), [Neutral colors](https://github.com/shadcn-ui/ui/blob/3ba91b1cc83e1bbe4ab35a422ff2a694849c5048/apps/v4/app/legacy-themes.css).

Halos use explicit entry/exit transition recipes while the contour appears at the first focused paint. Known button background/border transitions and overlay elevation are composed rather than replaced. Reduced motion removes only the optional focus animation; native focus remains.

Option rows retain the existing inset primary contour in these candidate recipes. The shared API can express signed offsets and reserves owned popup clearance, but Fluent's source external row contour is not silently claimed by this iteration. The current Spectrum and Rhea popup entry/exit movement remains unimplemented; it requires native-presence lifecycle work, not an unused duration pin. Normal-motion, reduced-motion, forced-color, first-painted-frame and complete-outline browser checks must accompany integration. No new generated evidence or inspired-theme adoption is implied by these source edits.
