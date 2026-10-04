# Spectrum 2 theme deep review — 2026-10-03

## Verdict and evidence boundary

The Spectrum-inspired theme already embodies typography, geometry, elevation, motion, independent component states and variant recipes. It is substantially more than a palette. It does **not** yet reproduce the source as fully as the available APIs allow: field stroke width, choice size and selected-tab weight are concrete correctable mismatches. Switch and radio anatomy, neutral versus emphasized choices, size-specific typography and the action emphasis vocabulary remain meaningful gaps.

This review checked clean main `df59c9e8` at `/private/tmp/en-reve-inspired-review-20261003`, including its AGENTS instructions, token/style contracts, canonical recipes and component implementations. The Spectrum object in `tooling/theme-candidates/definitions.json` and both Spectrum recipes are identical to the earlier working checkout. Installed upstream source was inspected read-only from that checkout's `showcases/spectrum-react/node_modules/@react-spectrum/s2`; main's manifest pins the same **1.7.1**. Upstream commit URLs below identify the already-recorded **4dd44e0f400636a87a9ad4390903e78c5ae6113c** snapshot; fresh browser retrieval of those GitHub files returned cache misses. Official website pages were read live on October 3. No new builds or browser suites were run by this audit; root owns validation.

The theme's design-data authority remains **@adobe/spectrum-tokens 15.4.1**, commit **05c64ff95a62826179e8e0921d3934f636f27** as recorded in the definition (the full canonical value is `05c64ff95a62826179e8e0921d3934f636346f27`). React S2 and design data can disagree. The supplementary WC comparison is **@adobe/spectrum-wc 2.0.0-beta.3**, with some controls retained from Gen1 **1.12.2**. Do not treat that mixed showcase as one uniform Gen2 authority or claim these pinned versions are newly verified npm latest releases.

The live [Spectrum homepage](https://spectrum.adobe.com/) now organizes guidance under foundations and separate React/Web Component implementations. Its new routes should replace old `/page/*` links in current documentation; the old typography/motion routes failed direct retrieval. The [September refresh](../theme-refresh-spectrum-fluent.md) and [adoption report](../theme-inspired-adoption.md) remain useful history, but the latter supersedes earlier claims that separate family timing, state companions or field geometry hooks are unavailable.

## What is already embodied

| Dimension | Current implementation and assessment |
| --- | --- |
| Typographic hierarchy | Desktop M UI/input 14/18, body 16/24, metadata 14/18 at weight 500, strong labels 700, heading S/M/L 20/24, 22/26, 28/32 at weight 800. Adobe Clean and Source Code Pro stacks are named explicitly. These are distinct role choices, not one global font-size swap. Adobe's [typography system](https://spectrum.adobe.com/foundations/typography/typography-system) supports that hierarchy; actual font loading remains application-owned. |
| Shape and packing | Pill actions; 8px fields/options; 10px containers/toasts; 16px dialog; 16px button inset; 12px field/option inset; 8px popup padding; compact baseline. The source's [rounding system](https://spectrum.adobe.com/foundations/styles/object-styles/rounding) distinguishes small, medium, large, dialog and full radii; the local theme captures most default silhouettes. |
| Elevation | Flat ordinary cards/surfaces/buttons, source three-layer elevated popup/toast shadows, independent dark alphas, shadowless dialog. Elevation is assigned by family rather than a universal drop shadow. The design-data/React disagreement is disclosed in the earlier refresh. |
| Motion | 150ms control transitions with source easing; whole-button 0.94 held scale; separate popup 200/200ms, dialog 250/130ms and toast 400/200ms timing; immediate focus; reduced-motion removal. This meaningfully reflects [Spectrum motion guidance](https://spectrum.adobe.com/foundations/behavior/motion), which is still evolving. |
| State and variants | Companion recipes distinguish primary, secondary, ghost and danger rest/hover/pressed paint. Transparent selected tabs and neutral underline, inverted toast identity, independent semantic toast fills, neutral token-chip interactions, compact neutral badges and a 6px progress track are deliberate family-level work. |
| Delivery | Trusted companions travel with paired theme CSS and build-bound review JSON. Independent light/dark authoring, full-scope resets and nested-boundary isolation are part of delivery. The theme does not override selection, cancellation or focus semantics merely to imitate another library. |

## Prioritized findings

### P1 — Use available family hooks to correct fields and choices

**Fields still use a 1px frame despite the source's 2px frame.** The Spectrum baseline pins `component.input.border-width` to `{border.width}`, whose value is 1px. Source [Field.tsx](https://github.com/adobe/react-spectrum/blob/4dd44e0f400636a87a9ad4390903e78c5ae6113c/packages/%40react-spectrum/s2/src/Field.tsx) declares 2px, including rest/invalid/focus. The existing narrow field hook means this can be corrected without changing button, card or choice borders. Set `component.input.border-width` and invalid width to 2px in both appearances; verify text/placeholder alignment through invalid transitions and the compound number/combobox frames.

The same source changes its perimeter to neutral gray-900 on focus (negative-1000 when invalid), while our input hover goes directly to action blue and focus adds the independent contour. A neutral hover mapping to the existing accessible field boundary is a closer current-hook interpretation. Complete parity would additionally need a focused perimeter role; keep the immediate accessible focus contour. The stronger rest boundary is a deliberate contrast adaptation and should remain documented.

**Checkbox/radio visual size is 20px rather than desktop M 16px.** `component.choice.size` is fixed at 20px in both baseline branches. Source [style-utils.ts](https://github.com/adobe/react-spectrum/blob/4dd44e0f400636a87a9ad4390903e78c5ae6113c/packages/%40react-spectrum/s2/src/style-utils.ts) uses the small-control sequence S/M/L/XL = 14/16/18/20. Source Checkbox and Radio consume that sequence. Change the M visual silhouette to 16px while preserving the separate labeled target. Longer-term, introduce size-specific choice outputs rather than making every host size 16px. Checkbox 2px stroke and radio selected-ring anatomy need narrow family hooks; they cannot be achieved correctly by changing the global border.

### P1 — Remove the unsupported bold selected tab

`packages/styles/src/selection.ts` applies `font.label-strong.weight` to selected tabs, which resolves to 700 in Spectrum. [S2 Tabs](https://github.com/adobe/react-spectrum/blob/4dd44e0f400636a87a9ad4390903e78c5ae6113c/packages/%40react-spectrum/s2/src/Tabs.tsx) uses normal UI font weight through selection. This is visible typography and can cause labels to change width. Add an existing `tab` companion rule mapping `--en-font-label-strong-weight` to `font.ui.weight`; keep action labels bold. Verify selected/unselected computed weight and layout under keyboard navigation in both appearances.

### P1/P2 — Replace the generic switch silhouette; explicitly track the remaining state anatomy

Spectrum leaves switch dimensions unpinned, so the generic 40×24px track and 16px thumb remain. [S2 Switch](https://github.com/adobe/react-spectrum/blob/4dd44e0f400636a87a9ad4390903e78c5ae6113c/packages/%40react-spectrum/s2/src/Switch.tsx) uses a desktop M 26×16px track with 2px border; the thumb grows from 8px off to 10px on. Existing `size.switch-*` outputs or family dimensions can reproduce the resting silhouette without reducing the label target. Checked thumb size and family border width need public roles. Do not confuse the existing *pressed* thumb-width role with persistent checked geometry.

Radio also differs structurally: S2 selection produces a thick ring around a 4px empty center; local `radio-rules.ts` paints an 8px filled dot inside a thin ring. A source-like inner disc or checked-border role would be a small, worthwhile presentation extension with no radio behavior change.

### P2 — Restore Spectrum's attention hierarchy and variant vocabulary deliberately

Spectrum's [attention hierarchy](https://spectrum.adobe.com/foundations/attention-hierarchy) reserves strong emphasis for selected high-priority actions. S2 [Button](https://github.com/adobe/react-spectrum/blob/4dd44e0f400636a87a9ad4390903e78c5ae6113c/packages/%40react-spectrum/s2/src/Button.tsx) distinguishes neutral primary, secondary and accent, plus a separate fill/outline axis. En Reve primary currently maps to source accent; secondary maps to the low-emphasis neutral fill. That is an intentional vocabulary adaptation, but leaves no reusable strong neutral primary, or systematic outlined axis. Do not silently turn existing blue primary actions black. Add documented semantic recipe choices or an explicit appearance contract, keeping action importance separate from its color.

Source Checkbox, Radio and Switch also default to neutral selected paint with optional emphasis. The theme currently chooses action-colored selection globally, effectively resembling emphasized choices. Provide independent checkbox/switch selected roles (radio already has selected-color), then choose or expose a coherent neutral/emphasized policy. Preserve the selected text/indicator pairs and disabled/forced-color precedence. This improves Spectrum identity without spreading global accent changes to unrelated controls.

### P2 — Finish size, typography and icon mapping

The current role values establish good **desktop M** fidelity. The generic size recipe yields small UI/input 14px and large 15.75px; source S/L are 12px/16px with source-rounded line heights. Use exact output pins where the current API supports them; source line-height selection, locale-specific families and title/component typography need further scoped support. A selected-size line-height hook is preferable to changing all text or freezing every size at one ratio.

Source `page.css` switches to a 1.25 geometry scale and a 17px font base when hover+fine-pointer conditions are absent. Local coarse targets grow, but text does not adopt that source platform scale. This is a disclosed adaptation until an explicit environment recipe is available. The local shared text envelope can be at least 34px even when the baseline says 32px; protected targets plus frame reserves explain it. A 32px source claim must describe the source baseline, not misreport the local rendered box.

Adobe Clean named in CSS is not proof it is installed. The source notes that its metrics differ from common system fonts, so font-stack equality alone cannot certify appearance. Compare a clearly identified fallback rendering, or provision a licensed font asset separately. The [icon guidance](https://spectrum.adobe.com/foundations/icons-and-illustrations/using-icons) uses 20px workflow canvases with 1.5px strokes and distinct UI-icon scales. Local artwork uses a 24-unit viewBox; setting a 20px rendered size alone does not reproduce those strokes or glyph shapes. Provide an optional reviewed icon adapter/assets layer rather than altering shared icons for all themes.

### P2/P3 — Treat motion and component behavior limits as explicit scope

The fixed 0.94 button shrink approximates a 32px button. Source [pressScale](https://github.com/adobe/react-spectrum/blob/4dd44e0f400636a87a9ad4390903e78c5ae6113c/packages/%40react-spectrum/s2/src/pressScale.ts) calculates perspective from `max(height, width/3, 24)`, so wider buttons shrink less. Add a bounded optional formula only if this greater fidelity merits runtime/layout measurement; current behavior is a reasonable documented approximation.

Independent dialog timing is already shipped. Remaining differences are entrance delay/travel and toast choreography, not missing timing tokens: local modal travel is 4px and clamped to 8px, versus the recorded S2 20px entrance; anchored popups deliberately retain stable coordinates. Preserve those geometry/focus guarantees unless a separate validated motion design replaces them.

Tabs still wrap with small gaps and separate border indicators, while S2 has wider gaps, a shared animated rounded indicator and overflow-to-picker behavior. Those require anatomy/layout/interaction changes. They are not solved by a new selected color.

The September capability report counted 77 public elements. Main now has **96**, including `en-toggle-button`, `en-multiselect`, `en-range-slider`, `en-tag`, `en-selection-collection`, `en-context-menu` and `en-menubar`. Do not repeat its old missing-component list. Remaining examples must be checked against their specific current contracts: combobox remains single-value/local-filtered, and calendar/date-picker remain the documented ISO date/calendar model. A theme cannot manufacture remote filtering, extra calendar systems or source behavior absent from those contracts.

## Completion criteria for a defensible claim

Correct the available-hook mismatches first and retain a source-vs-local matrix for field, choice, switch, tab, button variants, typography, popup, dialog, toast and progress. Include small/medium/large, explicit light/dark, hover/held/selected/disabled/invalid/focus and coarse/reduced-motion cases. Assertions must include independent source expectations, not only “computed CSS equals our authored tokens”; the existing `theme-refresh.spec.ts` mostly proves the latter, which is useful delivery evidence but cannot catch a mistaken source mapping.

Use matched fixtures and viewport/font disclosure for visual comparison, then the supported cross-browser theme lane for export/reopen, nested scopes and state retention. Root should record the exact new commands/results separately. The honest current assessment is **strong inspired coverage with concrete remaining fidelity gaps**, rather than complete Spectrum parity or a fresh accessibility certification.


## Implementation handoff at this checkpoint

The findings above describe audited main `df59c9e8`, before this task's corrections. Root has applied `spectrum-update.py` in the isolated review clone: field width/hover, desktop 12/14/16px UI/input sizes, resting switch geometry, 16px choice baseline and normal selected-tab weight. Runtime qualification is still pending.

`packages/tokens/src/companion/spectrum.ts` supplies code-owned source-size line heights (including `size="inherit"`), the reusable `sized-choice` geometry, guarded neutral field focus and neutral checkbox selection. It addresses only public Parts/hosts/native recipes. Geometry keeps the existing labeled targets. Enabled/valid paint guards preserve disabled and error treatment; forced colors and immediate focus remain component-owned. The size helper is shared from `companion/astryx.ts`, keeping the existing host size reset/inheritance algebra.

The coordinator has registered the shared modules and applied the `spectrum-anatomy-update.py` mappings; the six Spectrum presentations are visible at committed source checkpoint `98bed824`: inherited size typography, choice geometry, neutral checkbox selection, field focus, stateful switch and filled radio. They consume the generic switch presenter owned by the Astryx review and filled-radio presenter owned by the shadcn review. The switch includes checked thumb growth; the radio uses a 4px empty center. At that checkpoint, focus used neutral text (gray-800); the default-state follow-up below replaces that mapping with the verified gray-900 source value. Source-specific action vocabulary, coarse platform scaling, licensed fonts/icons, animated tab overflow and dimension-dependent press remain open.

Both updater scripts were parsed with Python's AST parser successfully by the source reviewer; that reviewer did not execute them. The later coordinated registration/application is source evidence, not a browser or build receipt. Root owns semantic compilation, exported-CSS browser checks and final receipts.


### Static-review corrections before qualification

The source presenters now preserve the public `--en-choice-size` override, with
source S/M/L dimensions as its fallback. The Spectrum baseline's former fixed
choice pin is removed so it does not flatten that fallback. Native field focus
excludes explicit ARIA invalid/disabled states and reported `:user-invalid`, and
includes the native number-group perimeter.

Visible errors are represented by additive documented `control-invalid` Parts
on the existing native inputs, `stepper-invalid` on number-field's perimeter, and
`focus-frame-invalid` for adorned text fields. They follow the existing visible
feedback state, not raw constraint validity. Source checkbox presentation keeps
neutral paint before feedback and uses explicit negative fill/border/indicator
roles when feedback is shown. Those initial roles reused the reviewed negative foreground; the default-state
follow-up below separates source negative rest and interaction values. Focused
fields retain their invalid-border override. Author paint stays inside
`forced-colors: none`; protected targets and system-color behavior stay
component-owned.

This adds Parts metadata only, with no new property, attribute, event, validation
controller or node replacement. Root must regenerate the ordinary public API
artifacts after freshness evidence, reconcile any subsequent updater changes,
and qualify the new visible-feedback fixtures. Runtime results remain pending.

### Slider mapping proposal

`spectrum-slider-update.py` is a pure, idempotent `update(definition)` proposal
for the new `source-slider` / `filled` companion. It returns one copied theme
definition and performs no application or file I/O. The mapping was authored
from pinned S2 1.7.1 [Slider.tsx](https://github.com/adobe/react-spectrum/blob/4dd44e0f400636a87a9ad4390903e78c5ae6113c/packages/%40react-spectrum/s2/src/Slider.tsx)
and [RangeSlider.tsx](https://github.com/adobe/react-spectrum/blob/4dd44e0f400636a87a9ad4390903e78c5ae6113c/packages/%40react-spectrum/s2/src/RangeSlider.tsx),
with each color cross-checked against that installed package's emitted
`dist/private/Slider.mjs` state classes and `Slider.css` declarations.

The proposal maps the default thin neutral slider: 4px visual rail at every
size, 18/20/22px circular border-box thumbs at S/M/L, 2px thumb border, 10px
rail radius and no thumb/track elevation. The neutral fill is
`#505050`/`#afafaf` in light/dark, the rail `#dadada`/`#393939`, and the thumb
plate `#ffffff`/`#111111`. Thumb borders move from `#292929`/`#dbdbdb` at rest
to `#131313`/`#f2f2f2` on hover and drag. Disabled rail and fill become
`#e9e9e9`/`#2c2c2c`; the thumb retains its plate and uses the rail's resting
color for its border. Disabled opacity remains one because the source supplies
these dedicated colors. Source paint is immediate, with no added paint
transition; the existing accessible focus contour stays component-owned.

Single and interval sliders share this source geometry. Their protected local
targets are retained: the source's 24/32/40px layout rows are not claims about
En Reve's rendered hit targets. The S2 public API omits vertical orientation,
so the local vertical slider is an explicit host adaptation. Source thick
rails, precise thumbs, an emphasized fill variant and dimension-dependent
press shrink are not introduced by this mapping. Forced colors and public
local hook precedence remain owned by the common slider implementation.

The source reviewer has not applied this proposal or run builds/tests. Root
owns serial application and qualification; independent geometry/state-color
expectations have been handed to the browser fidelity reviewer.


### Default choice and regular-tab implementation

This follow-up to baseline `11edea37` uses the same pinned S2 1.7.1 package, not a different flavor or
new upstream version. Source `Checkbox.tsx` 155–185, `Switch.tsx` 142–177 and
`RadioGroup.tsx` 293–307 were cross-checked with their emitted state classes and
CSS. Their default neutral glyphs use `#292929`/`#dbdbdb` in light/dark, advancing
to `#131313`/`#f2f2f2` for hover, keyboard focus-visible and press. Checkbox mixed
state follows checked state. Invalid checkbox/radio rest is
`#d73220`/`#fc432e`, with interaction `#b72818`/`#ff6756`; pristine native invalidity
does not replace the existing visible-feedback contract. Switch has no invented
invalid source branch.

Disabled glyph paint uses `#c6c6c6`/`#444444`, with the source surface
`#ffffff`/`#111111` retained for unchecked plates and selected marks/thumbs.
Disabled source opacity is one. Dedicated checked/off switch roles prevent its
selected disabled thumb from inheriting the unchecked thumb color. Native and
custom label targets, grouped native hover specificity, actual disabled
fieldsets and ARIA-disabled presentation are covered explicitly. The source has
no held choice shadow; the three optional pressed-shadow defaults are therefore
`shadow.none`. Consumer pressed-color, selected-radio-color and pressed-shadow
hooks remain available. Matching fill-colored checkbox/radio borders reproduce
the source's painted silhouette while retaining the protected native geometry.

Source `Field.tsx` 215–219 and emitted `Field.css` 232–237 establish the focused
neutral perimeter as `#131313`/`#f2f2f2`. The previous gray-800 focus adaptation is
removed. Existing visible-invalid focus, focus contour and reviewed resting
boundary treatment remain distinct.

The source regular, visible-label tabs in `Tabs.tsx` 243–276 and 350–454 use a
2rem horizontal gap, zero vertical gap, a 3rem row and zero label inset. The
mapping uses a minimum row size so text can grow. The selected-only static marker
is 2px with fully rounded corners and no resting list baseline; held plates are
transparent. Vertical lists reserve .75rem at the leading edge and 1.25rem at the
trailing edge; the source marker offset is a fixed -12px, which must not be
converted to rem. Source neutral/subdued label states, distinct disabled label
and marker colors, RTL placement and local color/geometry hooks are included.
The moving indicator, collapsing overflow picker, compact density and hidden
label variant remain explicitly outside this default presentation.

The new browser assertions consume public Download CSS bytes and independent
source literals in both appearances and all configured engines. They check
native/custom states, invalid/disabled precedence, public overrides, full-theme
isolation, target geometry, composed ancestor opacity and absence of visible
source shadows. Compiler fixtures separately check typed optional roles and
scoped delivery. Qualification evidence is recorded in [verification-20261003.json](verification-20261003.json);
this implementation and coverage description does not establish a passing build,
metadata refresh or browser result.


The choice-label follow-up adds five optional semantic colors:
`component.choice.label-color`, `label-hover-color`, `label-focus-color`,
`label-pressed-color` and `label-disabled-color` (all under `component.choice`).
Their public CSS hooks are the corresponding `--en-choice-label-*` names. Shared
choice styles observe the actual native input's focus-visible and disabled state;
this includes disabled fieldsets and radio-group-owned inputs. No focus-state
attribute, JavaScript observer, additional Part or node replacement is required.
Descriptions and validation messages keep their own presentation, and a consumer's
explicit label Part paint keeps its normal precedence.

The source wrappers in `Checkbox.tsx` 121–136, `Switch.tsx` 106–121 and
`RadioGroup.tsx` 257–273 use neutral label ink at rest and the next neutral stop
for hover, keyboard focus-visible or press. Disabled label ink is
`#c6c6c6`/`#444444`; selection and invalidity do not turn label text into selection
or error colors. Ordinary pointer focus does not activate the keyboard label
state. The default En Reve fallback remains its existing `color.text` when these
optional hooks are absent. Full child themes reset the five pins; partial changes
preserve unspecified pins. Forced-color label behavior remains component-owned.
Independent browser cases cover input-owned focus, native/custom labels, disabled
groups, hook overrides, explicit Part precedence and full/partial theme behavior.
Qualification evidence is recorded in [verification-20261003.json](verification-20261003.json);
static review and authored cases remain separate from runtime results.

The same bounded choice presentation maps label weight to `font.ui.weight` (400)
for checkbox, radio and switch, using the existing finite `choice` companion
target. Other field labels retain their own weight, and explicit local typography
or label Part styles keep their ordinary cascade. The source `controlFont()`
appears in `Checkbox.tsx` 98, `Switch.tsx` 93 and `RadioGroup.tsx` 237; its compiled
`xb17` class explicitly sets weight 400 for every source size in `Checkbox.css`
60–62, `Switch.css` 56–58 and `RadioGroup.css` 131–133. Browser choice signatures
include this independent literal alongside source state colors and nested full
theme isolation. This mapping adds no hook or size axis. Qualification evidence
is recorded in [verification-20261003.json](verification-20261003.json); the mapping does not imply
a passing execution result.
