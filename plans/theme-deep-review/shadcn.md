# shadcn/ui Rhea / Neutral deep review

Reviewed 2026-10-03 against clean main `df59c9e8` in `/private/tmp/en-reve-initial-pass-closeout`. Findings below describe that baseline. The follow-up integration section records the prepared implementation. This is source and implementation evidence, not a new browser qualification or a statement of user acceptance.

The review deliverable and prepared update script now live in the independent `/private/tmp/en-reve-inspired-review-20261003` clone. The central clean-main checkout and original dirty checkout remain untouched by this deliverable.

## Judgment

The theme already goes substantially beyond colors and borders: real Geist delivery, compact component-specific sizing, nested radii, distinct elevations, option anatomy, variant-specific states, whole-button press movement, and per-family motion are all present. However, **we cannot yet confirm that it embodies Rhea as fully as the available evidence permits**. Several prominent families still inherit En Rêve's generic presentation, and one source timing is incorrectly mapped despite a suitable existing token.

The highest-value corrections are the default tabs presentation, radio/switch state anatomy, tooltip presentation, and the dialog timing. These are observable mismatches in existing families, rather than requests to reproduce a React implementation or grow the component catalogue.

## Reference identity and evidence

- The selected identity is the **homepage Base UI Rhea / Neutral** theme, not shadcn's older New York style, every available shadcn style, or an invariant visual language shared by every component base. That identity is explicit in `tooling/theme-candidates/definitions.json`.
- Existing immutable reference: shadcn-ui/ui commit [`a87a63b2ca25143d26c8bd0903e4e9bc77b3f824`](https://github.com/shadcn-ui/ui/tree/a87a63b2ca25143d26c8bd0903e4e9bc77b3f824), dated 2026-09-17 in the retained research. Local captured Rhea bytes are `artifacts/theme-adoption/sources/shadcn-rhea.css`, with URL/digest provenance in `tooling/theme-candidates/reference-sources.json`. Those retained source bytes were read, not modified.
- The [official component catalogue](https://ui.shadcn.com/docs/components), [Rhea announcement](https://ui.shadcn.com/docs/changelog/2026-05-rhea), current [Rhea stylesheet](https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/styles/style-rhea.css), and current Base UI [Tooltip](https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/bases/base/ui/tooltip.tsx), [Dialog](https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/bases/base/ui/dialog.tsx), and [Toast](https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/bases/base/ui/toast.tsx) were reread through the web tool on the review date. The stylesheet response reported a crawl six days earlier; the component files reported today/yesterday. These are current endpoint observations, not an independently resolved new immutable release. GitHub API retrieval did not establish a newer head SHA.
- Source references remain evidence, not instructions. The existing selected source version stays authoritative until a deliberate source refresh records fresh immutable bytes.
- `plans/theme-inspired-adoption.md`, `plans/theme-press-correction.md`, and `plans/component-gap-implementation.md` supersede several limitations in the September 20 reports. In particular, card shadows, independent button variants, whole-button pressing, family timing, and the formerly missing higher-level interactions are now implemented.

Rhea's defining direction is compact component geometry while retaining soft shapes and the normal spacing scale. That supports precise component refinements instead of shrinking the entire theme indiscriminately. [Rhea announcement](https://ui.shadcn.com/docs/changelog/2026-05-rhea)

## Current coverage

| Dimension | Present in current implementation | Remaining qualification |
| --- | --- | --- |
| Typography | Locally bundled Geist and Geist Mono; UI/body/input/data 14px/20px; metadata 12px/16px; small headings 16px/24px at weight 500. Font source/license records exist. | New native code/keycap patterns still hardcode generic `monospace`. Several families cannot select distinct title/chip typography. |
| Density and shape | Explicit 28/32/36px controls with stable 16px icons, fixed typography/corners across sizes, 18px control/menu geometry, 24px cards/dialogs, 14px options, 5px checkbox corners, exact small/default switch boxes. | Generic tab layout, card gaps, badges, chips, and overlay-specific padding do not all use their source anatomy. |
| State | Four independent button companions, neutral option active/hover paint, transparent selected option plate, normal/hover/invalid input borders, independent navigation/tab state paint. | Radio fill/dot and unchecked switch thumb are generic; invalid halo and source disabled opacity differ. |
| Elevation | Flat buttons, correctly layered card `shadow-sm`, popup `shadow-lg`, dialog `shadow-xl`, and toast elevation. | Slider thumb elevation is missing. Tooltip inherits popup elevation. |
| Motion | Full-button 1px movement, 150ms press/release, explicit popup-trigger movement suppression; 100ms popup, 200ms dialog, 250ms toast; reduced-motion suppression. | Dialog should be 100ms for this pinned Rhea source. Anchored popup zoom/slide and toast stack choreography are documented host adaptations. |
| Patterns and behavior | Current library includes persistent toggles/groups, multivalue picking, hover cards, context menus, alert-dialog semantics, adornments, interval sliders, OTP, charts, transcript and questionnaire compositions, plus existing tables/navigation/date entry. | Having the behavior does not automatically give each newer pattern a Rhea-specific visual mapping. Current generic patterns need a theme review matrix. |
| Accessibility and environment | Minimum targets, forced colors, immediate focus/behavior, cancelable semantic changes, native fallbacks, explicit registration and SSR remain reusable system contracts. | Retained automated receipts do not establish current visual acceptance, manual AT coverage, or physical-device behavior. |

These coverage claims come from current theme definitions, companion recipes and live style consumers, not just token names or a prior passing build.

## Prioritized findings

### P1 — Tabs retain the wrong structural presentation

`packages/styles/src/selection.ts:103–129` always renders a bottom-border tab list and tab underlines. The shadcn definition makes the selected indicator transparent and uses the ordinary surface for selected tabs. On a light ordinary surface the resting and selected plates are therefore the same, lacking the source's muted rail and distinct selected chip. This is more than a subtle radius mismatch: the intended selected-state affordance is substantially weakened.

The pinned Rhea stylesheet's Tabs section uses a rounded, padded rail; the [Base Tabs wrapper](https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/bases/base/ui/tabs.tsx) supplies the selected chip presentation and keeps a separate line variant. Preserve the actual tab/panel semantics. Add finite list/trigger presentation roles or an explicit code-owned tabs presentation covering rail background, inset, corners, border, tab corners and selected paint. Rhea's selected chip does not add an independent shadow. Apply the Rhea rail to both custom elements and native recipes. Do not substitute radio-style segmented controls for tabs.

Acceptance: light/dark and horizontal/vertical tabs have a distinct selected chip at rest; focus remains visible; long labels/200% text wrap without hiding options; changing themes restores the generic/other-theme presentation; keyboard activation and nested boundaries remain intact.

### P1 — Selected radio and unchecked switch anatomy still look generic

`packages/styles/src/internal/radio-rules.ts:8–29` paints a surface-colored radio with an action-colored dot. The pinned Rhea Radio section uses a filled selected disk with an inverse dot. Source visual size is already mapped to 16px, but matching size alone does not reproduce the selected control. The dot source also varies between appearances.

`packages/styles/src/controls.ts:157–189` uses muted text for the unchecked switch thumb. Rhea's unchecked light thumb is a light/background thumb, while dark uses foreground; thumb shadow is also part of the source. The existing switch dimensions and inset mapping are good and must be preserved.

Add narrow family state roles for radio selected background/dot/border and switch unchecked thumb/background/elevation. Retain current defaults and forced-colors overrides. Apply the same contracts to standalone fields and radios/checkboxes generated by group/choice-card patterns. Do not change global surface/text colors to repair one control.

Acceptance: checked/unchecked/disabled radios and switches reproduce the intended light/dark silhouettes, with visible boundaries on all intended ancestors. Current keyboard/form/reset/cancellation behavior must remain unchanged. Exact token choices should be checked against composed contrast rather than assumed safe because they came from source.

### P1 — Tooltip is styled as another generic popup

`packages/styles/src/overlays.ts:13–29,59` gives tooltips the shared raised plate, ordinary text, shared overlay border/shadow, 18px control corners and 8px scalar padding. The source [Tooltip wrapper](https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/bases/base/ui/tooltip.tsx) explicitly inverts foreground/background; its Rhea styling is a compact 12px-text surface with smaller corners and separate inline/block padding. The current theme has no tooltip target or tooltip-specific tokens, so setting global overlay paint would also alter dialogs and menus.

Add tooltip-family background/text/border/radius/padding/font/shadow hooks, including arrow paint inheritance. Use a small finite companion target if needed; do not expose imported arbitrary selectors. Keep noninteractive tooltip semantics, pointer transit and immediate keyboard help. Source arrows and default top placement can be demonstrated through the existing `arrow` and logical placement API; they should not be secretly activated through visual theme data.

Acceptance: tooltip is visibly distinct from popover in both modes and exported standalone CSS; arrows match the plate; long text and RTL remain readable; scoped themes cannot restyle nested full themes.

### P2 — Dialog timing is a directly correctable mapping error

Both appearances pin `component.dialog.enter-duration` and `component.dialog.exit-duration` to **200ms** in `tooling/theme-candidates/definitions.json:7607,7612,9004,9009`. The retained pinned Rhea stylesheet at lines 715–720 says **100ms** for both dialog backdrop and content, and the freshly read current stylesheet agrees. No technical limitation requires 200ms.

Change those four values to 100ms and reconcile the adoption/provenance note that currently describes 200ms as source mapping. Keep immediate native close/focus behavior and reduced-motion suppression. This correction is independent of the larger overlay anatomy work.

### P2 — Dialog/popover composition still shares padding and typography

The theme's generic panel spacing is 20px. `overlays.ts` applies it to both dialog and popover; the source separates their padding, heading line height, and header/body/footer spacing. The local dialog template also uses the shared small heading (24px line height), with the close button in the flex header rather than the source's independently positioned close action. The source backdrop supports blur, which has no current consumer. [Dialog wrapper](https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/bases/base/ui/dialog.tsx)

Introduce semantic family refinements for dialog/popover padding, title typography, gaps and optional backdrop blur. Preserve the current content scrollport, focus clearance and public Parts. Avoid reducing the shared heading line height or changing all `space.panel` consumers. Treat source close-button layout and narrow-screen footer ordering as a documented composition choice that needs an equivalent example, not an automatic global behavior change.

### P2 — Slider omits its defining filled range and elevated thumb

`packages/styles/src/internal/range.ts:4–18` renders one neutral track and a solid action-colored thumb. There is no visual progress segment, thumb shadow or hover halo. Source Rhea uses a filled value range and an elevated light thumb; current track/thumb dimensions are already close. New interval-slider behavior does not resolve the single-slider presentation.

Add bounded slider paint/elevation/halo roles and source-neutral progress plumbing for native range presentation. Prefer preserving native input semantics and browser fallbacks. Check single/interval, horizontal/vertical, RTL, disabled, forced colors and exact-value editing before claiming parity. A CSS-only thumb recolor would leave the most recognizable range affordance absent.

### P2 — New code and chip patterns do not consume the intended typography

`packages/styles/src/patterns.ts:52` sets `.en-code` and `.en-keycap` to literal `monospace`, bypassing the theme's delivered Geist Mono family. Connect the public code-family role; this is an existing-token consumer defect, not a request for another font asset. Source keycaps can remain a separately documented typography choice.

`packages/styles/src/token-editor.ts:33` inherits editor text for its tokens; `.en-tag` in `patterns.ts` also inherits ordinary UI text and control anatomy. Those cannot express the compact chip typography independently. Add a bounded chip/tag typography family before reducing global UI text, and distinguish an editor token from an interactive multiselect chip. Keep the 24px interaction floor even when the source's visual chip is smaller.

### P3 — Card and badge density can be refined without redesign

- Cards already have the correct elevation and broad silhouette. `packages/styles/src/css/surface.css:14` fixes internal gap to 16px while the source standard card spacing is 20px (small is 16px). A card-gap role and explicit compact-card mapping would close this. The public `base` Part can express it today, but an exportable theme needs a connected role.
- Badge metadata metrics plus current padding/borders imply a 22px ordinary badge, compared with the selected source's 20px silhouette; the shared icon gap is 6px rather than 4px. This is a calculated source inspection result, not a fresh browser measurement. Scope existing badge block padding and icon-gap tokens through the badge companion, preserving multiline growth; avoid a fixed height. A 12px prefix icon should remain explicitly authored or receive a documented family role.

### P2 — Accordion still lacks the source's enclosing surface

The retained Rhea Accordion section uses a rounded enclosing frame, an open-item plate, 16px trigger padding, and a rotated indicator. Current `selection.ts` supplies a column of items with bottom separators and generic control geometry. Behavior is present, but the theme cannot turn the group into that source composition with its current paint pins. A finite accordion presentation should cover the group frame, item-open background and header/panel insets while preserving native disclosure, keyboard operation, long-title wrapping and immediate expanded state. Source-shape tuning should include this family in the comparison specimen even if its implementation is sequenced after tabs/choices/tooltips.

## Shared companion integration checkpoint

The source review above describes audited baseline `df59c9e8`. The generic engine originally read in `/private/tmp/en-reve-chakra-theme-20261002/packages/tokens/src/companion/` is now integrated as an **unqualified working-source snapshot**, recorded in [shared-engine-input.json](shared-engine-input.json); no Chakra definitions or sources were changed. The coordinator registered the source-shapes module and applied the following mappings, visible at committed source checkpoint `98bed824`:

- `tooltip/compact` supplies the inverse plate, typography, radius and axis-specific padding. Public overlay hooks remain authoritative; no-arrow and arrow content wrappers require rendered checks.
- `stateful-switch/stateful` supplies separate checked/unchecked rim and thumb paint, fixed thumb dimensions and shadow. Its code-owned size bridge consumes library size selection; recipes supply typed token IDs and expose no private selectors. Explicit and inherited sizes require qualification.
- The registered `packages/tokens/src/companion/source-shapes.ts` module supplies distinct `filled-radio`, `enclosed-tabs`, `enclosed-tab`, `inset-card`, code/keycap and accordion targets without replacing another module's registry entries. Each presentation uses typed token IDs and documented Parts/native helpers. Rhea's compact keycap retains sans typography.
- Geometry remains outside author-paint media rules; colors/shadows use `forced-colors:none`, with explicit system-color alternatives where geometry needs them. Native recipe specificity, target floors, optional role omission, public hooks, nested boundaries, selected/disabled precedence and reduced motion remain qualification requirements.

Dialog/popover sectioned presentations are available in the shared engine but were not selected by the shadcn definition at `98bed824`. Their source-specific composition and slider refinements remain concrete follow-ups; capability availability does not close those mappings.

The subsequent source review implements finite `padded-dialog/padded` and `padded-popover/padded` mappings for coordinated qualification. Dialog uses 1.5rem padding/gap, 1rem/1/500 title, .5rem footer gap and 8px backdrop blur. Ordinary dialogs now fill the source width: viewport minus 2rem below the 40rem source breakpoint, then 28rem above it. The retained Base wrapper supplies `w-full`, while the pinned Rhea CSS supplies `max-w-[calc(100%-2rem)] sm:max-w-md`; the companion preserves inherited and local `--en-overlay-max-inline-size` overrides and the existing viewport clearance. Independent short-content custom/native checks cover desktop, both breakpoint sides and narrow fit. Its managed `radius.dialog` remains `{radius.container}`; an optional `maxRadius` presentation role caps the ordinary dialog's selected semantic fallback at the source's absolute 24px, preserving `min(radius-4xl, 24px)` under root text growth. The presenter leaves inherited and local `--en-overlay-radius` overrides outside the cap. Responsive dialogs retain core geometry at all widths, including square drawer corners, because their configurable media query exposes no public current-presentation state; native drawer helpers are excluded too. Popover uses 1rem padding/gap, 1rem/1.5/500 title and 1.375rem corners, with a single content-padding owner whether an arrow is present or absent. These public-Part mappings retain body focus clearance, the in-flow close action, current width and placement. Exact source 6px title/description grouping, absolute 28px close action and mobile footer reversal remain composition adaptations. The authored follow-up also uses .75rem compact text and 1rem card titles so text grows with the root. This is source implementation evidence, not a runtime receipt.

`shadcn-update.py` is the existing-role correction and `shadcn-anatomy-update.py` assigns source anatomy. Both default to read-only previews; `--apply` is required to write. They change the shadcn definition only, preserve every other theme (including Chakra/Holotable), and do not regenerate artifacts or execute tests. The coordinated source includes the later idempotent follow-up replacing the provisional solid-switch rule and assigning the owned presentations described below. Any subsequent scoped corrections require a fresh coordinated qualification snapshot.

The prepared `source-shapes.ts` and anatomy mapping now cover:

- Filled radios with exact 8px light/10px dark inverse dots; selected disk color, disabled treatment and grouped disabled labels retain native state ownership.
- Small 24×16px/12px-thumb and default 32×20px/16px-thumb switches, 2px rims/insets, separate selected borders and source thumb shadows. Large repeats the source default profile rather than inventing an upstream large switch. The stronger unchecked boundary is an intentional adaptation.
- Inverse 12px/16px tooltips, .875rem radius (14px at the default root), 12px inline/6px block padding, no decorative border/shadow and matching optional arrow paint.
- Enclosed horizontal/vertical tabs with 3px rail inset (4px vertical), 8px panel gap, 26px visual trigger minimum under protected target floors, selected light/dark chip paint and retained public pressed hooks. Selected `box-shadow:none` was omitted after static review because it erased the native helper's configured focus halo.
- Cards with source 16px small/20px default inter-section spacing, including explicit `size=inherit`; source title metrics; 20px badges, compact 12px chip text, Geist Mono code and 12px Geist keycaps with .625rem corners (10px at the default root).
- Enclosing 18px-radius accordion frames, 1px separators, muted/50 open-item fill, 16px trigger and content insets, 24px label/indicator gap, medium text and a 16px chevron. The frame keeps overflow visible so existing keyboard contours and long authored text remain visible; rounded item plates retain the source silhouette. Source height animation remains an intentional immediate-disclosure adaptation, and native helper consumers retain ownership of authored indicator markup.

The radius audit uses the same immutable source revision across Rhea, globals and Neutral: `a87a63b2ca25143d26c8bd0903e4e9bc77b3f824`. [Neutral's source](https://github.com/shadcn-ui/ui/blob/a87a63b2ca25143d26c8bd0903e4e9bc77b3f824/apps/v4/app/legacy-themes.css#L522) supplies `--radius: .625rem`; its dark block does not override it. [The utility definitions](https://github.com/shadcn-ui/ui/blob/a87a63b2ca25143d26c8bd0903e4e9bc77b3f824/apps/v4/app/globals.css#L52) map `rounded-lg` to that radius and `rounded-xl` to 1.4 times it. Rhea's keycap (line 916) and tooltip (line 1361) therefore require .625rem and .875rem in both appearances, correcting the earlier 8px and 12px assumptions. The source `px-3 py-1.5` tooltip spacing becomes .75rem/.375rem, while the keycap's `h-5 min-w-5 px-1` becomes a 1.25rem minimum and .25rem inline inset. These retain the default 16px-root geometry and grow with source text. Independent browser expectations cover 10px/14px corners at a 16px root and 20px/28px corners at a 32px root, actual 20→40px keycap and 28→56px single-line tooltip boxes so corners are not clamped, both tooltip delivery paths, native keycaps, and existing local radius/padding overrides. The other explicitly mapped radius defaults agree at the 16px root: 18px controls/menu/chips/tabs/accordion/slider/alert/toast, 14px options, 22px popovers, 5px checkboxes and 24px cards/dialogs. The accordion inner 17px plate remains the documented overflow-visible adaptation. An optional finite `maxRadius` role now also caps the card's selected semantic fallback at 24px; inherited and local `--en-surface-radius` overrides remain outside the cap, smaller managed radii remain available, and omitting the role preserves other presentations. Independent native/custom checks require 24px at both 16px and 32px root text, with public override restoration. Ordinary dialogs already retain their cap. Qualification evidence is recorded in [verification-20261003.json](verification-20261003.json); source findings and browser expectations do not establish a passing runtime result.

Static review checked selectors, typed role alignment, selected/hover/pressed precedence, public state ownership, disabled grouping, focus halo preservation and inherited size handling. Browser acceptance still belongs to the parent's coordinated validation. Dialog/popover composition, source slider filled range/elevation and broader newer-pattern styling remain tracked in the cross-theme integration rather than being silently marked complete by this sub-review.

### P3 — Some differences should stay explicit adaptations

The source wrapper's toast stack transforms and content transitions are distinct from En Rêve's queue/history/swipe model. Its [current Toast implementation](https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/bases/base/ui/toast.tsx) also uses an inline action/close composition and a specific stack easing; matching the 250ms content fade alone is not choreography parity. Keep this disclosed unless a separately specified toast presentation mode is implemented.

Likewise, anchored popups intentionally keep their measured rectangle stable while fading, instead of applying source zoom/side travel. Native selects retain platform fallback. Protected targets, stronger functional boundaries/status ink, reduced-motion removal of press transforms, shared icons, and differing variant vocabularies remain justified adaptations. A theme should not change focus, form values, delays, semantic roles, queue admission or application policy to resemble a source screenshot.

## Suggested implementation and verification order

1. Correct dialog timings, connect code typography, and add the small card/badge refinements using existing roles where possible.
2. Add tabs, radio/switch and tooltip family presentation contracts, then map both Rhea appearances. Record which parts are source-derived and which remain accessibility adaptations.
3. Add dialog/popover geometry and slider refinements through scoped public hooks; include newly added patterns in a source comparison specimen.
4. Run targeted token/companion validation and portable Playwright checks coordinated by the parent task. Capture equivalent states with source and En Rêve: default/hover/focus/pressed/selected/invalid/disabled, light/dark, narrow/coarse, RTL, reduced motion and forced colors where supported. Verify custom/native recipes and fresh exported CSS, not only docs-specific styling.

This audit ran no builds, browser suites, freshness regeneration or acquisitions. Existing historical reports and artifact receipts remain unchanged. The independent project report remains the parent task's canonical scope, progress, review and handoff record; this document is the shadcn source review deliverable.
