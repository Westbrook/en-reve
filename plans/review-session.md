# Review-session plan update

## Shared modal close action — 2026-09-12

Dialog, Drawer and Command Palette now compose the official `en-button`
icon-only ghost action and `en-icon` close glyph in their shared header.
The localized `close-label` names the native control through the label slot;
`::part(close)` is forwarded to that control. Button and icon inherit the modal
size. Catalog and selective definition entries include both dependencies, with
no global registration side effects in class imports.

Verification covers 126 overlay browser cases, nine SSR/hydration cases, and
18 built Showcase journeys across the default and five inspired themes in
Chromium, Firefox and WebKit. Six fresh-process registration/SSR probes pass.
These checks preserve cancelable dismissal, focus restoration, square geometry,
Part customization and original hydrated node identity. Publication and user
review are tracked separately in the independent Progress Report.

## Composed showcase — 2026-09-11

The new `/showcase` page composes 16 interactive cards from 39 existing custom-element types and native content recipes. It is server-rendered and allows whole-page theme switching, paired Auto/Light/Dark, RTL, current-build JSON downloads, and validated file picker/drag-and-drop import. Theme changes preserve drafts, node identity, and open overlays. Card resets remain independent.

The [scope audit](showcase-scope-audit.md) separates unbuilt/unplanned chart and QR families from broader-catalog OTP/PIN, hover-preview and custom-scroll-area candidates. Already planned calendar, tables, uploads, navigation/menu expansion and richer chat remain distinct; the 72-pattern commitment is unchanged.

Local `3900e27be06a` passes 24 focused browser cases across Chromium, Firefox and WebKit, including light/dark accessibility scans, phone/tablet widths and 200% text in RTL. Five canonical theme recipes are rebound without changes. [Verification receipt](../artifacts/showcase/verification.json). User review and publication remain separate.

## Asset-card radio focus contour — 2026-09-11

The card radios still used browser widget paint: `border-radius: 50%` alone
left a square outline. They now use `.en-radio` and the small shared
`@en-reve/styles/radio.js` stylesheet. The element and composed native inputs
share circular paint, focus tokens, sizing and forced-color states. Native
inputs, labels, fieldset grouping and change events remain in place.

Local `9efd9d554e18` has 25 unique scoped browser passes: 13 library radio/choice
checks and 12 built Asset Browser checks. Two existing system-color assertion
cases are skipped on Firefox/WebKit because their normalization differs; this
is recorded separately. Actual focused screenshots show round contours in
Chromium, Firefox and WebKit, including the narrow dark view and forced-color
emulation. The [receipt](../artifacts/asset-radio-focus/verification.json) retains
the original square-rendering reproduction and test-harness corrections. Five
unchanged theme recipes are rebound. Only the asset radio review advances;
other acknowledgments and outstanding work remain unchanged.

## Select picker and popover entry motion — 2026-09-11

The user reported absent select motion and popovers that only fade out. Native
picker motion was missing; Popover used opaque shadow-only entry. Both now use
the shared fade recipe and timing/easing tokens. The helper supports native
picker pseudo-elements outside `:where()`. Positioning, focus, native selection,
dismissal and reduced-motion behavior retain their existing timing.

Local `ee4110a8d994` passes 90 scoped native motion cases and nine final built
demo checks. New regressions reproduce both gaps before the change and verify
actual opacity progression afterward, including native picker frame sampling
because its transitions are not exposed by `getAnimations()`. Chromium tests
animated behavior; Firefox/WebKit test the immediate fallback where native
overlay transition support is missing. The
[receipt](../artifacts/select-popover-motion/verification.json) retains those
boundaries and the original failures. Five unchanged inspired recipes are
rebound to the current build. Update the existing popup review for recheck;
preserve unrelated acknowledgments and leave publication/user acceptance open.

## Select caret consistency — 2026-09-11

The enhanced native `en-select` now uses the combobox's thin, rounded chevron
through `::picker-icon`, with shared `--en-size-icon` sizing. The existing
`control` Part allows local icon paint changes. Native selection, the platform
picker fallback and `--en-select-appearance: auto` remain intact. Forced colors
use system text colors, including disabled controls.

Local `f3e076707d88` passes three focused built-demo browser journeys: Chromium
and WebKit exercise enhanced keyboard/pointer selection, LTR/RTL, all sizes,
Part customization and forced colors; Firefox exercises native fallback
selection. The [receipt](../artifacts/select-chevron-review/verification.json)
includes screenshots and capability boundaries. Five unchanged theme recipes
are rebound to this build. No publication or user acceptance is inferred.

## Command palette centering correction — 2026-09-11

The palette's centering transform combined with individual scale around the
default origin introduced horizontal drift (11.2px for a 448px palette at .95).
Use a palette-specific `transform-origin: 0 0` so shared modal scale and vertical
travel keep its visual center stable. The viewport controller stays unchanged.
Local `9a3d308709aa` passes 84 native motion cases and 3 built-demo journeys;
the [receipt](../artifacts/palette-centering-review/verification.json) records
the pre-fix reproduction and measured animation centers. The existing popup
review is updated for recheck; unrelated acknowledgments remain preserved.

## Drawer distance correction — 2026-09-11

The user clarified that the attached edge determines the drawer's direction,
while its travel distance should match the dialog. Use the shared
`--en-motion-surface-offset` (0–8px) for both, including responsive bottom
drawers. Keep drawers unscaled. Zero offset removes translation; reduced motion
and native state/focus timing remain unchanged. The popup demo uses 4px for both.
This supersedes the earlier full-extent interpretation below. Verification and
the new local review checkpoint are recorded with the existing popup feedback.
Local `fdc55dc007c4` passes 72 native popup cases (21 drawer cases after test-only
measurement corrections) and three built-demo journeys across the installed
Chromium/Firefox/WebKit engines. The [receipt](../artifacts/drawer-distance-review/verification.json)
preserves initial outcomes and distinguishes enhanced motion from immediate
fallback. Five paired candidates are rebound; no publication or user acceptance
is inferred.

## Drawer and tooltip review follow-up — 2026-09-10

The user requested drawer motion from its attached edge, demonstrations of
all four physical edges, tooltip coverage in the popup-motion review, and shared
pointer warm-up across neighboring toolbar tooltips. The drawer and tooltip
paint corrections are locally verified on checkpoint `029a260cd306`: 69 scoped
native browser checks and three final-build demo checks pass. The
[receipt](../artifacts/popup-motion-review/verification.json) distinguishes
unchanged component evidence from the final docs-only layout correction.
Previous receipts below keep their original scope and build identity.
`@starting-style` supplies entry transitions. Native state, focus and dismissal
keep their immediate timing. Five paired themes were rebound to this build and
validated offline; no new whole-theme visual comparison is claimed.

The [shared tooltip warm-up plan](./tooltip-warmup.md) is now implemented and verified
after this correction. It separates scoped pointer-delay coordination from visual
motion; keyboard focus remains immediate. The new authored review case covers
shared and independent groups and is reused in the sticker sheet and API reference;
the settings toolbar supplies the workflow counterpart. The 87 isolated interaction, nine docs/workflow and 12 existing SSR/motion
checks pass; manual acceptance remains pending. Overall pattern scope and package versions stay unchanged.

## Current local review checkpoint — 2026-09-10

Build `edd09329014f90911e5b89d0f83cda22b9951c93546ea0a965d70411aec7776c`
contains **46 tagged elements, 36 sticker-sheet specimens, 31 isolated API
examples and five workflow kinds**, plus five Settings scenario pages. Scoped
asset-browser/layout/content, popup motion, SSR action-style decomposition and
five paired themes are delivered for local review. Broader list, file,
empty-state and asset patterns remain partial; the initial target is still72
patterns and the broader project remains27/83.

The [aggregate receipt](../artifacts/asset-browser-followups/verification.json)
records387 scoped browser passes and38 Node checks. Final-build docs42,
opposite-scheme3, theme30 and themed-assets10 pass. Other component, API and
mobile outcomes explicitly retain their unchanged-source scope rather than
claiming a complete final-build rerun. Docs69 unique combines66 initial passes
with3 exact-source-locator reruns; initial failures remain retained. The
[review guide](../artifacts/asset-browser-followups/README.md) supplies direct
asset, popup-motion and Holotable tasks.

Themed-asset checks on the intermediate bbb26 build caught a real cascade bug:
unlayered syntax-highlighter color-scheme overrode layered workflow inheritance.
The inherit rule now sits outside the layer; explicit opposite-OS and all ten
themed-asset cases pass on final edd. Historical bbb26 receipts/files remain
intermediate. Holotable dark follows the inspected reference and light is an
explicit adaptation; all five exact-build candidates remain review proposals.

Inline no-JS first paint and shared adopted sheets remain. Per owned raw style
block, button CSS falls41,111→15,450 bytes and link38,786→3,289; the offline
[SSR receipt](../artifacts/asset-browser-followups/ssr-css.json) records remaining
duplication and measurement limits. No latency/CPU/memory gain is inferred.
Site60 and package0.1.0 are unchanged. All52 acknowledgments remain in the
independent report; new review cards are not automatically accepted.

## Pre-slice baseline and authorization — 2026-09-10

Current generated/source inventory is **46 tagged elements, 34 sticker-sheet
specimens and 29 isolated API examples**, with four independent workflows and
five additional focused Settings scenario pages. These are implementation counts,
not accepted patterns or test totals; the initial target remains 72 patterns.
The latest verified local build is `d7b11e1d3cec`; hosted Site 60 and package
versions `0.1.0` are unchanged. Child authoring/live mutation, focus recipes and
shared post-hydration stylesheet adoption have their own scoped receipts below.
The five Settings scenarios have an explicit user review; other acknowledgments
and pending feedback remain in the independent report.

The user now authorizes the asset-browser/layout/content slice, SSR CSS
deduplication, popup entrance/exit motion, the existing [Holotable theme
plan](./holotable-theme.md), and current plan-status refresh. These new outcomes
are in progress, with no implementation, reference fidelity or verification
claimed yet. Preserve first paint, cascade, native state and reduced-motion
behavior; measure rather than infer performance gains. Historical counts and
receipts below keep their original build and scope.

## Focus, motion and child-authored choices — 2026-09-10

The user authorized both remaining follow-ups after reviewing all five Settings
scenarios. Keep those reviews attached to their delivered local versions.

- Add family-specific focus contours, supplementary halos and an animated field
  accent through shared styles and constrained theme controls. Retain an immediate
  visible focus cue, reduced-motion and forced-color behavior; separate selection
  artwork widths from focus width. Update the four inspired theme recipes using
  recorded component references. Popup entry/exit motion remains separate work.
- Add `en-select-option` and `en-segmented-item` child authoring. Direct recognized
  children take precedence; `.items` remains available when none are supplied.
  Parent `value` owns selection and reset defaults. Select keeps private native
  options and its platform picker; segmented controls project rich, noninteractive
  labels beside parent-owned native radios. Custom descriptor tags avoid invalid
  native option placement and misleading child `selected` semantics.
- Reuse the SSR mapping approach, preserve native controls through hydration,
  validate mutation/cancellation/form behavior, and provide focused sticker-sheet,
  API and workflow examples. Treat explicit early author writes as authoritative;
  investigate any hydration boundary that cannot distinguish them reliably.

Both follow-ups are implemented in local build `d73cc19c61c0`, with 46 tagged
elements, 34 sticker-sheet specimens and 29 isolated API examples. The new review
pages provide Auto/Light/Dark, density and Reset controls without replacing the
edited native controls. Settings now consumes the child-authored choices too.

The shared focus frame preserves native input identity and enhanced-select
layout. Browser review caught a frame display rule that stacked the select arrow;
the correction now has a real native-layout comparison in the focus suite.
Explicit public value writes remain authoritative during hydration, including
equal-value framework replays; this boundary is documented instead of guessed.

Final scoped evidence and review instructions are retained in the
[follow-up receipt](../artifacts/focus-motion-child-selection/verification.json)
and [review guide](../artifacts/focus-motion-child-selection/README.md). Browser
interaction checks cover the installed Chromium, Firefox and WebKit engines;
manual screen-reader and physical-device acceptance remain separate. The four
updated paired theme candidates still require human review, not automatic
adoption. Popup lifecycle animation and a broader SSR stylesheet duplication
audit remain future work. The hosted checkpoint and package version strings
are unchanged; Holotable remains queued.

## Settings scenario navigation — 2026-09-10

The review feedback calls for directly navigable, isolated Settings scenarios.
Keep the existing Explore page and shared settings controller; add separate SSR
documents for command access, validation, save/retry, pending saves and incoming
updates. Each scene supplies visible steps, expected results, relevant fixture
controls and a reset to its declared preset. Scenario links preserve preview
preferences and the Progress Report return flag. Focused scenario review cards
will link to the exact delivered scene and retain feedback independently.
The five focused pages and Explore are implemented in the local review build.
The [scenario receipt](../artifacts/settings-scenarios/verification.json) records
24 passing scenario checks across Chromium, Firefox and WebKit, the existing
workflow regression (64 passes, two skips), and 66 passing slider checks. New
early-edit coverage found and fixed an invalid slider draft changing its first
hydration template; the native input, draft and focus now survive that boundary.
On 2026-09-10, the user reviewed all five local scenarios and reported: “All five
of these scenarios work well.” Record that checkpoint against this local build;
it does not establish broader device/assistive-technology coverage or authorize
publication. The previous command-family receipt remains
historical; the hosted checkpoint is unchanged by this local delivery.
At this earlier checkpoint, focus/motion and child-authored selection APIs were
separate proposals; their subsequent implementation is recorded above.
Holotable remains queued.

## Queued Holotable-inspired theme — 2026-09-10

Track [Holotable theme delivery and maintenance](./holotable-theme.md) as a fifth
inspired theme: reference audit, reusable paired recipe, managed candidate
export/reopen, cross-surface review and refresh when relevant library surfaces
change. This is queued work; no Holotable candidate or fidelity assessment is
claimed. Existing command-family delivery and its review checkpoint remain intact.

## Authorized command family implementation — 2026-09-10

**The command family is implemented for focused review.** The existing `dropdown-menu`, `button-group` and `command-palette`
entries now have `en-menu`, `en-menu-item`, `en-toolbar` and `en-command-palette`
source, public entries and generated metadata. At this command-family checkpoint,
the source snapshot had 44 tagged elements, 234 files scanned for CEM metadata, 32 sticker-sheet specimens
and 27 isolated API example documents. These are source/delivery counts, not test
passes or accepted patterns. This dated checkpoint supersedes the earlier
proposed/unstarted slice. The target remains 72 named patterns, delivery kinds
stay unchanged, and package versions stay `0.1.0`.

The [command-family receipt](../artifacts/command-family/verification.json) records
exact source/build identity, installed-engine verification and publication. It
keeps mobile emulation, native browser differences and manual acceptance separate.
Prior receipts and source counts are not new test results. Public contracts are recorded in the [menu](../packages/elements/src/menu/README.md),
[menu item](../packages/elements/src/menu-item/README.md), [toolbar](../packages/elements/src/toolbar/README.md)
and [command palette](../packages/elements/src/command-palette/README.md) guides.

The bounded menu is a one-level action menu with same-tree external `for`,
cancelable `open` state, default-slotted `en-menu-item` children and separators.
Menu items expose a named native action control; disabled commands stay
arrow-focusable and discoverable but cannot activate. Separators are outside
navigation. The button-only toolbar has one composite Tab entry, axis-aware arrow
movement, Home/End and RTL handling; it skips disabled/loading buttons. Ordinary
button groups may still use `en-stack`; no extra grouping wrapper is required.
Do not reuse the combobox's disabled-option or selected-value policy as an action
menu policy.

The palette composes a native modal dialog with a native editable combobox and
same-shadow listbox. Its finite `.commands` records carry unique nonempty action
IDs, labels, optional search keywords, disabled state and display-only shortcut
hints. Query and active candidate are internal; no persistent selected command,
form value, callback/HTML schema or service adapter is introduced. A visible
Search commands affordance remains available; any optional shortcut belongs to
the application and must respect editable text and browser commands.

Command intent uses one existing synchronous cancelable `en-action`, with
`{action, data: undefined}`. It is stateless and does not mean the application
completed or permitted the command. A menu item's event bubbles through its menu
without cancellation/redispatch; the palette emits its own action once. Toolbar
children keep their native click handling. Public boolean opening/dismissal uses
one cancelable `en-change`, with the existing tentative state, equal-author-write
and rollback rules. No `controlled`, request-change or second completion event is
added. Canceled action or canceled closure must remain meaningful. Application
execution rechecks current eligibility and orders destination focus after the
actual public close/update boundary, never by assuming one microtask completes
modal dismissal.

The integrated creative-settings registry shares Save settings/Retry save,
Restore opacity, Cancel save and Review incoming change across toolbar, menu and
palette. The application owns pending, cancellation, conflict and result state,
rechecks command eligibility, and waits for allowed dismissal before execution
and destination focus. Operable sticker-sheet specimens, exact authored source
disclosures and resets, CEM-driven API pages with isolated examples and the settings
workflow are integrated. The four inspired light/dark pairs use the existing
option-list, option, input and overlay hooks; this family adds no new theme token
or package version. Their refreshed build-bound review and scoped evidence are recorded
in the command-family receipt. Object catalogs remain authored examples, not a claim
that the bounded scalar API editor can edit arbitrary data.

Scoped verification covers command/close cancellation, current-context rejection,
focus return and deliberate destination focus, disabled discoverability, keyboard,
touch, RTL, IME, dynamic slots/catalogs/triggers, non-submitting native buttons,
selective imports, SSR/hydration identity, narrow popup bounds and theme changes
without losing the current task. Previous menu-paint, combobox, workflow and theme
receipts keep their original build and environment scope. The source/build provenance in the following completed checkpoint and the outer
inventory snapshot remains historical; the command-family receipt supplies this
new family’s separate evidence.
Manual AT, physical devices, current-minus-one coverage and actual user review
remain separate.

Submenus, checkable/radio menu modes, rich result rendering, remote search,
virtualization, automatic toolbar overflow and a global shortcut registry are
outside this first implementation. They remain broader delivery requirements
where applicable, rather than being treated as solved by shared styles.

## Completed bounded follow-ups and API controls

The earlier baseline was source `2ddf799abb0510d90ff351ce7e871e724bb1a23b`,
privately delivered as Site58. The subsequent scoped implementation is verified
against build `sha256:063835913c1e90f8aa777b4ce8bf3d979670c066589b5f922c8d9c76a9513237`.
The [follow-up receipt](../artifacts/review-followups-controls/verification.json)
records exact source, environments and results; no new hosted identity is inferred
here. This checkpoint changes no package versions, broad acceptance states or
historical test identities. That checkpoint catalog had **40
tags** within the unchanged **72-pattern** target; sign-in, settings, chat and
project selection are four independently rendered reference workflows.

The single tentative cancelable `en-change` contract is implemented, with public
`controlled` and `en-request-change` removed. Managed Theme Review, independent
light/dark candidate branches and exact-build pair export/reopen are delivered.
The default stylesheet follows system appearance before JavaScript; docs controls
offer Auto/Light/Dark without discarding active interactions. Explicit single
themes and pure light-mode resolver fallbacks retain their own contracts. The
four inspired pairs remain proposals, not adopted official themes. See the
[token guide](../packages/tokens/README.md), [Theme Review guide](../apps/docs/src/theme-review/README.md)
and [system-appearance candidate receipt](../artifacts/theme-candidates/system-appearance-default/rendered/verification.json).

**The three bounded deliverables are implemented with scoped verification.**
The Fluent correction uses `component.radio.selected-color` /
`--en-radio-selected-color` for the checked rim and dot, keeping selection ink
independent of filled-control color. The combobox explains continuous measured
lack of room through a stable polite status outside its hidden popup after a
700 ms quiet period. Brief layout transitions and offscreen inputs do not start
that feedback; new feedback waits for composition to finish. The existing popup
positioning behavior is preserved. The earlier iPhone positioning feedback stays
user-confirmed resolved, without implying broad physical-device acceptance.

The API reference now provides **249 scalar/enum descriptors for 39 explicitly
authored targets**, within its **26 isolated example documents**. All 39 targets
passed the target sweep; 54 unique existing API cases and all 15 new controls
cases passed, including the final three-engine cancellation checks. These counts
remain separate processes/scopes in the receipt, not a full-library or manual-AT
result. Public writable boolean, string, finite-number and source-resolved enum
metadata drives the editor for its named authored example target. It uses silent public property
writes, settled readback and the existing specimen reset; it does not infer APIs
from prose or private markup. Repeated tags, parent-owned child state and linked
preview handlers require explicit target/exclusion metadata. Rich objects/arrays,
slot HTML, event-handler editing and generic method invocation remain outside
this slice. Original example source stays distinct from applied overrides.

At this completed follow-up checkpoint, `dropdown-menu` and `button-group`
were proposed next, while menus, toolbars and command-palette search were not
implemented by that pass. The [2026-09-10 command-family checkpoint](#authorized-command-family-implementation--2026-09-10)
supersedes that planning status: all three inventory entries are now authorized
and implementation is underway, with new evidence still required. The completed
follow-up receipt remains scoped to its original work.

Four-audience documentation, remaining component/composition breadth, complete
impact/visual comparison, offline review/adoption, framework/current-minus-one,
manual AT and physical-device evidence remain open. Earlier receipts below keep
their original build, contract and environment scope.

## Current event API migration checkpoint

The single cancelable `en-change` migration is implemented across shared primitives, component adapters and consuming documentation. The full build passes, and the regenerated 40-tag CEM contains neither `controlled` nor `en-request-change`. Package versions remain `0.1.0`. Exact artifact, environment and result identities are recorded in [event API migration verification](../artifacts/event-api-migration/verification.json).

Completed focused checks: **43 core, 36 primitives browser, 107 forms with one intentional skip, 45 structures, 102 overlays plus six native-close cases, 54 choices, 66 slider, 120 desktop combobox, 76 mobile combobox, 36 SSR browser, 32 tooling, and 19 SSR/workflow-core cases**. These results establish the recorded scenarios, including tentative state, cancellation and authority; earlier receipts below retain their own identities.

Production documentation passed 178 browser cases with two retained layout skips; the scroll/edit workflow passed all 16 mobile-emulation cases. All four refreshed theme candidates passed 12 browser/candidate combinations. Exact delivery identity is recorded in the verification receipt and independent Progress Report. This checkpoint does not claim publication, physical iPhone/software-keyboard confirmation, manual AT acceptance or completion of the current-minus-one matrix. The four independent reference workflows are sign-in, creative settings, chat and project selection; their availability does not close broader workflow acceptance.

## Earlier review checkpoints

Historical update of 2026-09-09 through shared-correction commit `5bd6459efff35c2aa8ea8dca3cc7ef4316292d9d`. The three deterministic reference workflows now have independent SSR review pages. Their initial combined-page run passed 58 executions; current per-page verification is recorded separately, with manual review next. Package versions remain `0.1.0`. Earlier review and evidence identities below retain their original scope.

The preceding navigation checkpoint passed 24 standalone element cases, 21 shared primitive cases, 12 documentation cases and 4 focused workflow cases across Chromium, Firefox and WebKit. Two pre-existing narrow RTL workflow cases remained scoped skips in Firefox and WebKit; that layout case ran in Chromium. The full sticker sheet passed three engines and five viewport profiles per engine. Those results describe the earlier array-based breadcrumb wrapper/recipe integration and are not relabelled as verification of the native-child migration below.

The completed native-child breadcrumb checkpoint passed 42 standalone component cases, 45 production-backed adapter cases and 15 built-documentation navigation/copied-sample cases. Eleven SSR Node checks, 24 generic-adapter checks plus strict TypeScript, and nine minification checks also passed. At that checkpoint, the full sticker sheet passed three installed engines at five viewport profiles each with zero axe violations. These are scoped implementation results, not current-minus-one, physical-device or manual screen-reader acceptance. Earlier receipts retain their original identities.

At that breadcrumb checkpoint, the hashless hydration identity/focus check passed all three engines. The earlier focus failure was diagnosed as native initial-fragment timing; separate fragment checks remain, and no runtime focus workaround was added.

The subsequent default-slotted navigation checkpoint passed 51 standalone browser cases (17 per installed engine), 18 built-documentation/navigation and executed copied-source cases, and seven focused workflow cases with two retained narrow Firefox/WebKit skips. The full build, 39-tag CEM generation/check and strict test typechecking passed. The full sticker sheet passed three engines at five viewport profiles each with zero runtime errors or axe violations. This focused iteration did not rerun the full 64-case workflow suite; current-minus-one, physical-device and manual AT acceptance remain open.

At the initial managed-editor checkpoint, Theme Review added: descriptor-backed editing for every resolved token, coordinated controls, appearance/density context, explicit Apply/restore, accepted undo/redo/reset, isolated default/candidate previews of the full sheet and three workflows, and exact-build JSON export/reopen. The editor keeps the default theme; full preview pairs load explicitly and candidate styles apply after their default SSR hydration. New checks remain separate from all earlier receipts below. This local JSON flow does not include an offline site copy, complete impact mapping, visual comparison evidence or adoption. [Current scope](../apps/docs/src/theme-review/README.md).

The [four-theme customization review](./customization-review.md) records the seven specialist scorecards, bounded paint/geometry/authoring/portability improvements, new candidates, and remaining options. Paired appearance and bounded family geometry now have implementations with later receipts. General state recipes, broader component materials, responsive typography/assets and further decorative geometry remain separate discussion or delivery work. The reference candidates remain review proposals, not adopted official themes, and package versions remain unchanged.

The direction remains a customizable Lit/Signals system for creative collaboration. The 72-pattern inventory, four documentation audiences, four reference workflows, managed theme review, and current-minus-one support targets remain in scope. Element counts describe implementation inventory, not fully accepted patterns; the current generated catalog contains 46 custom-element tags. Earlier 40/44-tag counts above belong to their dated receipts.

## Changes carried into the plans

| Area | Current guidance | Remaining work |
| --- | --- | --- |
| Shared sizing and typography | Missing `size` means medium, even in a differently sized parent; `inherit` is explicit. UI/input metrics share the default `1rem / 1.5`; small controls retain their base text while geometry changes, and large text scales up. Density, rhythm, size, and target geometry have separate responsibilities. | Preserve semantic/output overrides, wrapping, and text growth in each new family; review the resulting visual balance. |
| Visual consistency | Comparable control heights share text, border, padding, and target calculations. Segmented/select outer radii align; inner radii derive concentrically. Brand and action roles share a seed but can diverge. | Extend the same contracts across remaining patterns; changes to shared tokens require affected-consumer evidence even when the CEM is unchanged. |
| Composition and relationships | Internal markup stays private. Popover, tooltip, and color-field triggers use same-tree `for` references. Slots expose supported content roles, including labels. A swatch is the reusable color sample and can accept a token or raw color; surrounding labels and token metadata belong to consumers. | Keep naming, focus, dynamic rebinding, and scope limits explicit. Reference Target and broader cross-root behavior remain separate verification work. |
| Interaction and accessibility | Compound number controls, editable slider values, password fields, single-entry segmented navigation, complete focus outlines, responsive overlays, and dismissal fallbacks form reusable family guidance. | Use the implemented reference journeys for manual assistive-technology/device review and broaden their supported-environment evidence. Existing browser findings are retained rather than silently excluded. |
| Navigation | `en-navigation` now takes default-slotted native anchors with consumer-owned rich content, URLs/current state and listeners; it keeps label/sticky/size and only the `base` Part. Ordinary named-slot SSR needs no mapping adapter. Breadcrumbs retain their private projected list and established Parts. Both pure data recipes and native skip links remain available. | Scoped native-child navigation, SSR/hydration and copied-source checks now pass independently of the historical breadcrumb and array/recipe receipts. Nested groups, responsive disclosure, current-minus-one and manual AT acceptance remain open. |
| Documentation and review | The sticker sheet uses library controls, executable source disclosures, resets, sticky navigation and SSR. The separate local Theme Review page provides all-token editing, accepted history, explicitly loaded full-page comparisons and exact-build single/paired JSON export/reopen. The independent Progress Report keeps its separately bundled, now adaptive library snapshot. | Preserve the editor’s scoped receipts while completing four-audience documentation, offline review material, evidence comparison and adoption; local rendered previews do not establish those outcomes. |
| Verification and releases | Scope evidence to exact source/build/environment. Use meaningful family and consumer operations; promote reusable review probes into durable fixtures. CEM facts must be supplemented by authored visual, behavioral, token, accessibility, SSR, and performance changes. | Integrate real dependency selection, visual comparison/cache review, interactive old/new versions, packed consumers, and the supported version matrix. Existing utility modules alone do not complete those workflows. |

The detailed contracts live in [architecture](architecture.md), [tokens](tokens.md), [visual language](visual-language.md), [interaction review](interaction-review.md), [accessibility](accessibility.md), [platform](platform.md), [experience](experience.md), [verification](verification.md), and [API review](api-review.md).

## Implemented state ownership contract

The user has adopted removal of public `controlled` and `en-request-change`. The [canonical contract](./architecture.md#cancelable-state-changes-and-application-authority) uses one synchronous cancelable `en-change` after coherent tentative property/Signals/FormData staging and before destructive finalization. Owned cancellation restores prior staging; silent author writes including equality and accepted nested transactions take authority. A canceled inner transaction alone does not supersede outer rollback. `en-input` remains native-draft observation; no post-commit event or async settlement API is added.

Native form reset uses its existing baseline by default and is canceled at the outer form’s native reset event. Restoration and automatic initialization defaults are authoritative and silent; existing hydration native-edit adoption is unchanged. Ordinary overlay user changes cancel before effects; unexpected already-completed native close/hide reconciles silently. Consumer examples cancel before awaiting, guard stale responses and explicitly supply accepted properties.

The shared helper, adapters, consumers, metadata and documentation now implement this contract. The current checkpoint above records completed component/SSR/core checks; production documentation verification also passed; delivery identity is tracked in the verification receipt and independent Progress Report. All earlier receipts below retain their artifact identities and old-contract scope. Package versions remain unchanged; physical iPhone/software-keyboard confirmation, manual AT and current-minus-one acceptance remain open.

## Recommended next work

The current integrated slice above implements scoped asset-browser/layout/content, SSR action-style decomposition and popup motion; the [Holotable-inspired theme](./holotable-theme.md) and four existing motion recipes await final paired-candidate checks. The command family is already delivered with its own evidence. The established review and preservation work below remains in scope.

1. **Review the completed contrast, no-room and API-controls outcomes against their scoped receipt.** Exercise the named target, public-property editing/readback and reset, the persistent no-room explanation and the Fluent radio selection state. Keep the command family’s separately verified receipt distinct from these earlier outcomes. Review the implemented event migration in the private API reference and workflows. Retain the completed tentative-state, rollback, nested/equal-write, native editing/lifecycle and deferred-effect checks as component and consumer coverage expands. Preserve selective split-view registration and maintained vertical coverage; the earlier shared-correction receipt does not prove the new event contract.
2. **Review the complete reference tasks.** The independent sign-in (`workflows.html`), settings (`workflows/settings.html`) chat (`workflows/chat.html`) and project selection (`workflows/selection.html`) SSR pages provide deterministic services, scenario controls, resets and actual template source. Only the selected workflow is loaded and rendered. Run the manual prompts before broadening usability claims; individual page receipts retain exact verification scope.
3. **Turn review-session discoveries into focused regression coverage.** Retain the durable token/size tests; promote useful production-sheet probes with complete provenance. Extend the maintained top/bottom and packed selective-import checks as new compositions require them. Keep manual AT, physical devices, supported prior versions, and measured network/performance work explicit.
4. **Preserve verified default-slotted native navigation.** The `en-navigation` element removes `.items` and element item-type exports in favor of authored native anchors, normal default-slot CSR/SSR and app-owned attributes/listeners/styles. The scoped navigation checkpoint now verifies component behavior, built documentation and executed copied examples independently of the earlier breadcrumb results. Preserve the verified breadcrumb mapping contract and the pure `sectionNavigationTemplate`/`breadcrumbTemplate` data recipes as coverage expands. [Public consumption guide](../packages/primitives/docs/navigation.md).
5. **Preserve local Theme Review while continuing broader delivery when authorized.** Retain coverage for all-token Apply/restore/history, invalid-input recovery, isolated full-sheet/workflow previews and exact-build JSON export/reopen. Preserve source/output identity and distinguish rendered coverage from passed tests. Full offline bundles, component impact mapping, visual comparison/cache evidence and explicit adoption remain work alongside remaining component breadth, nested navigation and responsive disclosure.

These steps refine the existing scope; they do not add a second product roadmap or retire unfinished requirements.

## Current bounded breadth slice: Combobox

The earlier delivered component slice is `en-combobox`: a searchable single-select
project/workspace picker. This expands the existing combobox inventory entry;
child helpers and new test cases do not increase the 72-pattern target. Source,
consumer examples and focused verification are integrated. Earlier field, theme,
navigation and workflow receipts are not relabelled as combobox evidence.

The bounded API takes a complete finite `.items` catalog of unique string values
and plain-text labels, an accepted `.value`, the established field/slot/form
surfaces, and supplied `loading`/`loadError` state. Filtering is local. There is no
fetcher, remote-filter mode, public query/open state, rich option renderer or
standalone `en-option` tag. An optional empty-value item supplies an explicit
clear choice; deleting filter text does not clear selection.

Keep accepted ID and last known label separate from native query/composition,
active option and popup visibility. Query editing emits `en-input`; explicit
selection uses the single cancelable `en-change` contract above. Escape, Tab
and whole-control blur close and restore the accepted label without committing.
Canceled selection retains the focused filter; author writes, including a
same-value write, reconcile it. Defer reconciliation during native composition.
A dirty query must not silently submit the old ID as though it selected a new
record. A removed/disabled nonempty accepted ID retains its value and label and becomes
invalid; no alternative is inferred. Empty remains an optional no-selection value,
while required empty selections are invalid. Native form reset follows its documented
baseline unless the outer form reset event is canceled; restoration is authoritative
and silent. The earlier combobox receipt predates the adopted event migration.

The implementation separates local collection state, native editing, interaction,
popup placement, templates and token-backed styles. The native input and listbox
options share a shadow root. Reuse form/editing foundations without treating query
text as the accepted ID. SSR starts from matching server/client item/value
snapshots; pre-hydration edits must survive as queries rather than become IDs.

New focused evidence covers explicit keyboard/pointer selection; cancellation and
same-value supersession; empty/disabled/removed item recovery; loading/failure
and no-results; form validation/reset/fieldset disabling; synthetic composition
and native editing retention; popup scrolling/placement; shared geometry and
shared field/placeholder roles and candidate option/active-state contrast; narrow RTL;
SSR/hydration identity; and actual bare-ESM copied-source consumption. Record the
exact build and installed-engine scope with those checks. Enlarged/spaced text, physical IME, manual
screen readers, current-minus-one and full framework acceptance remain separate.
[Component guide](../packages/elements/src/combobox/README.md).

The checkpoint renders 40 custom element tags and 31 specimens. Its CEM is generated from the component source, package versions stay `0.1.0`, and all 32 metadata/release/evidence tooling checks pass. The four refreshed candidate bundles exercise the new combobox through real selection in each installed engine and preserve candidate source identity. A separate 200-option Chromium probe confirms filtering, replacement, acceptance, caret retention and cleanup after close/disconnect. Native-module workflows remain isolated; Theme Review now uses page-specific registration as described in the continuation below.

Exact receipts are kept in `artifacts/combobox/verification.json` and `artifacts/theme-candidates/combobox/verification.json`; the Progress Report records source, build and private publication identity. No screen-reader, physical IME or user-review approval is inferred from these automated checks.

## Mobile and documentation continuation

The combobox now preserves native editor focus while accepting completed touch
clicks: its mouse focus guard no longer cancels touch pointer events. The popup
tracks visible viewport offsets, waits for wrapped-row measurement, and suspends
when the input is offscreen or a complete result cannot fit, including authored
height ceilings. Query and accepted value survive; hidden results cannot be
accepted. Explicit dismissal prevents viewport changes from reopening the list. Persistent no-room feedback now waits for a 700 ms quiet period and safe composition completion; it adds explanation outside the hidden popup without changing the positioning algorithm. The new receipt covers that behavior separately from earlier positioning evidence.
Phone/tablet touch profiles and focused viewport/controller tests are maintained
beside the component. Physical keyboards, devices and assistive technologies
remain distinct manual checkpoints.

The fourth independently rendered workflow, Project selection, supplies a long
catalog, scrollable brief, native submission receipts and phone/tablet review
steps. It is a consuming composition within the existing 72-pattern scope; it
does not increase the library tag count. All four workflows can be previewed with
theme candidates.

The new API reference is generated from verified current CEM metadata and actual
package exports. It presents public attributes, properties, methods, events,
slots, Parts and CSS properties, links to authored examples and downloads the
manifest and receipt. Missing source documentation remains explicit. This
advances developer/agent documentation; complete end-user/designer guidance and
framework/current-minus-one acceptance remain open.

Theme Review now registers its ten required controls through dedicated entries.
Its preview frames keep independent registries. The measured import-only pair
reduces its initial gzip JavaScript by about 34%; it does not establish hosted
latency or a performance budget. The Progress Report retains the exact pair and
the small shared-bundle costs on other pages. No package versions are bumped.

The implemented API-reference increment embeds the existing authored specimens directly
in isolated, server-rendered example documents. Each live demo has independent
Auto/Light/Dark appearance, three density choices, and reset; native IDs, forms and
top-layer overlays stay inside that demo. Selective registration and precompiled
theme CSS keep the reference page independent of the component catalog and theme
compiler. Bounded scalar/enum element editors now use public code metadata and
explicit specimen targets, with scoped readback/reset/cancellation checks. Richer
controls and additional named demo themes remain follow-up work.

The iPhone 12 Pro/iOS 18.7.7 feedback adds a focused regression sequence: focus the
Project combobox, scroll the page or Campaign brief, then delete text. Coverage
now distinguishes client/fixed coordinate origins, every presented resize frame,
suspended-trigger retries, and subpixel measurement stability. The production
workflow runs that scroll/edit/submit sequence in the shared eight-profile mobile
matrix. Emulation cannot establish the reported software keyboard's behavior;
physical-device confirmation remains a separate review checkpoint.

## Earlier shared audit findings

The first three audit findings are now resolved at shared-correction commit `5bd6459efff35c2aa8ea8dca3cc7ef4316292d9d`:

- The split-view definition entry and its catalog descriptor include `en-splitter`. A fresh packed native-ESM consumer verifies the selective closure without full-catalog registration, compatible definitions and parent/child conflict preflight. [Consumer contract](../tooling/registration/README.md).
- Author-write revisions are separate from value-change revisions in accordion, accordion item, tabs, split view and splitter. Real reentrant interactions verified that a same-value write superseded the pending default, subsequent unhandled requests still worked, and `controlled` remained available at that pre-migration checkpoint. This receipt does not verify the new event contract.
- The maintained structure suite now covers top/bottom keyboard and pointer resizing in LTR and RTL, bounds and pointer-axis behavior. The historical both-axis probe at source `59e9e89042ea2d41ed1aadb18f7447dd5efb462c` retains its own evidence identity. [Maintained tests](../packages/elements/src/accordion/tests/structures.spec.ts).

The checkpoint passed **42 structure cases and 15 packed-consumer cases** across the tested Chromium, Firefox and WebKit engines. This establishes those scoped corrections, not every component's registration, scoped-registry/SSR behavior, the current-minus-one matrix or manual assistive-technology acceptance. Per-entry public definition metadata and broader consumer coverage remain work.

Separately, the documentation workflow request/scheduler core passed **8 Node cases**, including duplicate activation, abort-ignoring late completion, reset/disposal and held-result delivery. That evidence covers the shared async utility, not any complete workflow UI. [Core contract](../apps/docs/src/workflows/shared/README.md), [core tests](../apps/docs/tests/workflow-core.test.ts).

## Evidence and review boundary

Native module consumption is required: authored code must not depend on CSS
side-effect imports, raw-text query imports, or virtual module specifiers.
Document styles use native stylesheet links to explicit application asset URLs;
Lit shadow roots use the existing JavaScript CSSResult exports. Source-text
catalogs are generated as ordinary JavaScript modules before compilation.
Consumer checks compile copied samples and execute them with an import map and
a plain static server, independently of the documentation bundler.

The earlier typography build has 32 token Node passes, 39 token browser passes, 27 shared-size browser passes, and 432 focused typography configurations across the three tested current engines. The report snapshot has six read-only browser profiles. Earlier family, SSR, and performance evidence keeps its original artifact identity; it has not all been rerun on this build.

No plan revision establishes manual screen-reader acceptance, physical-device coverage, prior-browser/framework support, accepted visual baselines, or a performance budget. Firefox native select computed leading, WebKit fixed-host root-rem behavior, and Firefox slotted emulated-touch behavior have distinct recorded limits; they must not become a blanket browser exclusion. The initial workflow-delivery checkpoint added 58 workflow browser executions, eight async-core tests, 57 shared structure/registration cases, and six read-only report profiles. Earlier evidence is not silently refreshed.

The independent Progress Report retains decisions, feedback, exact review checkpoints, artifact histories, and detailed evidence. Its repository locator is `.progress-report/project.json`; local evidence paths are not production assets. Reviewing a card acknowledges its displayed content and does not approve adoption.

The API reference now builds 29 isolated example documents from the current authored specimens; the original 26-document receipt remains historical. Each demo offers Auto/Light/Dark, three densities and Reset without mutating the surrounding reference page. Bounded scalar/enum property controls are implemented with the scoped receipt above; richer slot/object/event editors and adopted named theme presets remain follow-up work. New browser processes cover actual interaction, selective registration, original SSR input/root/focus/selection, and recovery after native link navigation. The client build preserves module execution order because shared hydration/runtime chunks must install Lit hydration support before LitElement evaluates; no library bootstrap or public component API changes.

## Live child-choice mutation correction

Pasting an `en-segmented-item` copied from rendered markup retained its generated
slot and incorrectly invalidated the group. Generated slots are now disposable
metadata: newly pasted, cloned, or transferred descriptors receive a local
assignment. Per-node ownership prevents the old group from clearing a new
assignment. SSR replaces copied generated attributes structurally, and hydration
matches both slot and value before adopting original node identity. Unique values
and the existing descriptor validation rules remain required.

The isolated child-choice example now offers Add/Remove controls for PDF and
Square, also shared by the sticker sheet and inline API demo. Catalog edits keep
the accepted parent value, omit unavailable choices from FormData, and never emit
a selection event on their own. Re-adding an accepted choice restores its
availability; Reset restores the authored example.

The local checkpoint has 117 selection browser passes (114 plus three focused
pre-hydration cases), 22 SSR Node passes, 30 scoped documentation passes, and
87 isolated API SSR/hydration passes. Phone/desktop layout probes are recorded
separately. The docs test initially targeted the visually hidden native radio;
its corrected process clicks the actual projected label. Four unchanged inspired
recipes are rebound to the new build; their previous visual evidence is retained
without claiming a new theme visual run. Exact artifacts and source/build
identity: `artifacts/child-selection-live-mutation/verification.json`.

## Shared styles after SSR hydration

Client-created Lit elements already shared constructible stylesheets. The installed
Lit hydration support skipped adoption for existing declarative shadow roots,
leaving a concatenated static style node per rendered component. The En Rêve SSR
renderer now marks that owned block; an internal controller adopts Lit's cached
CSSResult sheets after the first successful update, then removes the marked node.
First paint retains CSS, native node/focus/value identity stays intact, and
additional DOM styles, unsupported APIs, or adoption failures preserve an inline
fallback. Existing consumer-adopted sheets keep their cascade order. Cross-document
reconnection restores static fallback; ordinary reconnects do not duplicate sheets.

The built/minified child-choice demo drops from 14 shadow style nodes to zero and
shares 10 sheet objects. The sticker sheet drops from 213 to zero and shares 30
objects across 804 adoptions. Observed control geometry and computed typography,
paint, padding and borders are unchanged in the before/after Chromium comparison.
The scoped three-engine suite passes 33 stylesheet cases; SSR/minification Node
tests pass 31, and isolated API SSR/hydration passes 87. Exact source/build and
documentation checks belong to `artifacts/adopted-styles/verification.json`.

Initial-response CSS duplication remains separate work. This handoff does not
reduce initial HTML CSS bytes or establish a latency/memory improvement; engines
can already share parsed contents for some identical inline styles. Retain
historical performance and theme visual evidence with its original build identity.

## Showcase mobile composition review

The iOS portrait review now has a focused five-profile browser suite: iPhone
portrait/landscape, Pixel portrait, and iPad portrait/landscape. The default and
five inspired themes share checks for compact full touch targets, field text
alignment, and bounded layouts. At 320px the five rating stars remain on one
line; enlarged text can reflow them while preserving their full targets and
native radio behavior. The clear option occupies its own row.

Shared input and textarea block padding now derives from the same control
envelope. A one-row textarea aligns with the input, and invalid borders retain
the text inset. Browsers without customizable select get a themed closed native
select with a noninteractive chevron and reserved logical padding; the operating
system still owns the open picker. This fallback is exercised in Firefox because
the installed WebKit supports customizable select. Physical iOS 18 picker
appearance remains a separate review checkpoint.

The Showcase reduces Reset height and checklist gaps without shrinking touch
targets, bounds Review date width, and uses a tappable information popover.
Its drawer opts into responsive bottom placement. This is an application choice,
not a global requirement for all drawers. Responsive observation now begins after
hydration so the first client placement reaches the existing native dialog.
The drawer retains only its exposed separator; viewport edges have no border,
and focus indicators remain intact.

The local correction checkpoint passes 15 mobile, 24 existing Showcase, 12
focused field/select, and 21 drawer motion browser checks. Exact build identity,
receipts, discovered regressions and limitations are recorded in
`artifacts/showcase-mobile/verification.json`. These checks do not establish
physical-device or manual assistive-technology acceptance. The independent
Progress Report keeps the eight feedback items open for user recheck and retains
Site 61 as the hosted baseline; the new corrections have not been published.

## Authored table and compact asset lists

The next approved slice adds `en-table`, a shadow-root scrolling shell around one authored native table, and a visibly compact list arrangement for the existing keyed content collection. Native `caption`, `thead`, `tbody`, `tr`, `th` and `td` stay together in the author's tree, so the HTML parser preserves their relationships in SSR. The shell does not turn the table into an ARIA grid or create a parallel item API. Shared table rules are explicitly adopted in the author root through a Lit static stylesheet or a native stylesheet link.

The resettable Authored asset table specimen is shared by the sticker sheet and API reference; the Asset Browser combines sorting and Grid/List/Table choices while retaining single selection. Inspired themes consume the shared color, spacing, typography and focus rules and can override table-specific surface, header, hover and cell-spacing properties. Sorting is an application action, with `aria-sort` on the currently sorted header. Compact lists preserve the existing keyed native list/card nodes.

This is an implementation checkpoint, not a completed acceptance claim. Browser review must cover initial SSR, hydration, header association, sorting, stable selection, keyboard overflow, focus return, narrow layouts and RTL. Manual screen-reader table navigation remains separate evidence. Multi-selection, cell-navigation grids, pagination, virtualization and remote asset services remain deferred; none is implied by the new view.

The table/list checkpoint passes 87 focused browser checks across Chromium, Firefox and WebKit, plus 94 token and 32 metadata/evidence/release-tooling tests. This includes the new isolated table/API inspector, copied example compilation, SSR/hydration identity, five inspired appearance pairs, optional sorting, native selection and preview recovery. Regression checks cover enlarged-text list reflow and positioned labels inside the native table scrollport. Evidence is recorded in `artifacts/table-list/verification.json`; manual screen-reader and physical-device review remain open.


## Reusable pagination after collection review

The next breadth slice implements the existing pagination inventory entry as
`en-pagination`. One-based pages, bounded numbered actions and explicit unknown
totals share the single cancelable `en-change` contract. Applications continue to
own data loading, URL navigation and result announcements. The collection lab
and Asset Browser replace duplicated previous/next controls with this element;
the sticker sheet and API reference share a resettable example, a canceled change
and an unknown-total example. Shared button tokens provide inspired-theme and
size behavior without a separate theme palette.

The virtual-table VoiceOver reversal remains a known issue reported in Safari
and Chrome. The passing full-table snapshot baseline does not close it. See
[the manual review protocol](./table-accessibility-review.md) for revisit triggers.
Pagination's complete-page DOM is a comparison path, not an assumed VoiceOver fix.

Build, browser and publication outcomes for this slice belong to the current
Progress Report. Broader component, framework, release and manual-review scope
remains unfinished; completing this slice does not complete those workstreams.


## Content, menu and consumption breadth

The [bounded breadth pass](./breadth-and-consumption.md) adds ordered native lists,
file availability/media fallbacks and distinct empty-state recipes; checkable,
radio and explicitly opened nested menus; isolated HTML/React/Vue/Svelte client
and SSR ownership fixtures; and stable responsive pagination. Sticker examples,
API controls, Settings and Asset Browser consumers, and five inspired theme
comparisons accompany these changes. Exact browser and publication receipts live
in the independent Progress Report.

The framework fixtures establish representative client property/event handling
and an explicit SSR island adapter, not arbitrary framework-template DSD or
metaframework support. Vue 2 is recorded as an end-of-life compatibility line.
The subsequent review authorizes protected hover opening, touch replacement
panels, consistent menu carets and selection-group dividers, inline page entry
and skeleton loading recipes. Mixed-control toolbar breadth and full
framework/current-minus-one browser acceptance remain unfinished. No existing
manual VoiceOver finding or user review checkpoint is closed by this pass.
