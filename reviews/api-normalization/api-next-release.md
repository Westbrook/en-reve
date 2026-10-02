# Combined API and theme migration record

Status: prepared, unreleased. This record consolidates the delivered normalization
changes for the next coordinated package release. Packages remain at `0.1.0`
during private review. Under the accepted pre-1.0 policy, the breaking changes
below require the next minor train (`0.2.0` if the release base remains `0.1.0`).
Publishing the documentation site does not publish packages or approve adoption.

## Authored change classifications

| ID / classification | Before → after | Consumer migration / evidence |
| --- | --- | --- |
| API-01 / breaking + additive | Feed paging handlers read the old page → public page is tentative during the proposal. Explicit request/status events and typed response ownership are available. | To retain the previous page, assign `event.detail.previous`; use `preventDefault()` for a veto. Subscribe to one load-request protocol, synchronously claim `respondWith`, and distinguish request acceptance from completion. [Event migration](api-01-events.md). |
| API-02 / breaking + fix | Associated menu/popover buttons could submit a form → admitted activation consumes that native default. Transaction defaults now reject lost eligibility. | Use a separate submit action when needed. Do not rely on edits committing after a listener disables/removes the target. Authoritative writes and accepted nested edits remain authoritative. [Transactions](api-02-transactions.md), [follow-up](/reviews/api-normalization/api-normalization-followup.md?progress-report). |
| API-03 / breaking | Property-only current values could establish implicit reset baselines → explicit `defaultValue`/`defaultChecked` and reflected default attributes own reset behavior. | Set reset defaults separately from current values; inspect pristine versus edited behavior. Keep application `error` separate from localized constraint guidance. [Forms](api-03-forms.md). |
| API-04 / breaking + additive | Carousel `items` used `null` for authored mode; some invalid keys/progress records were tolerated → getter uses `undefined`, components require valid keys/statuses, tree records include canonical keys. | Update sentinel checks, replace blank keys, correct duplicate/invalid progress data, allow canonical tree fields, and edit `key` when spreading normalized records. Existing legacy tree aliases remain. [Collections](api-04-collections.md). |
| API-05 / breaking + additive | Token `value` included native IME drafts; action data could retain provider identity → accepted document projection and immutable action snapshots. | Read `draftValue`/`en-input` for live previews; compare stable IDs rather than object identity and do not mutate event data. Focus options and explicit request outcomes are additive; legacy Boolean methods remain. [Outcomes](api-05-outcomes.md). |
| API-06 / breaking | Duplicate/old Part and padding names → canonical semantic names with explicit host/native ownership. | Apply the complete Part/token mapping, including card `body`→`content`, disclosure controls and editor `control`; use `inline-padding`/`block-padding`. Update managed theme documents and CSS. Slots remain public and override fallback properties even when assigned content is empty. [Customization matrix](api-06-customization.md). |
| API-07 / breaking behavior | Some inherited hooks/target minima were disconnected → supported consumers honor shared size/theme/target contracts. | Inspect themes with large control/touch minima and bounded calendar/picker layouts. Do not shrink targets to fit; use contained scrolling. [Target floors](api-07-target-floors.md). |
| API-08 / feature + fix | Fixed labels/guidance and unassociated choice descriptions → typed messages/simple labels and associated descriptions. | Supply application translations through the documented properties; replace message objects to update. Keep rich slot content and application errors application-owned. [Localization](api-08-localization.md). |
| API-09 / breaking + additive | Editor-trigger import implicitly registered token editor → neutral trigger registration with explicit backend imports; reusable definitions and Context capability associations added. | Explicitly import `@en-reve/elements/define/token-editor.js` when used. Preserve explicit association precedence and supported authored/SSR boundaries. [Composition](api-09-context.md). |
| API-10 / tooling + reviewed type corrections | Fragmented metadata/exports → shared public graph, typed event/accessor/tag enforcement and supported-entry policy. | Use supported root/component/registration/definition/context/editor/event entries. Exposed implementation paths remain importable but unsupported; this release removes none. Review corrected public type facts with the same rigor as runtime changes. [Contract closure](api-10-completion.md). |
| THEME-02 / breaking | Broad shared pins could override narrower family pins; segmented inset affected unrelated controls → family refinements win and segmented geometry stays local. | Clear narrower pins to inherit shared defaults, or move overrides to the family/instance. Set a common group minimum explicitly when alignment is desired. [Precedence](/reviews/theme-customization/theme-02-cascade-migration.md?progress-report). |
| THEME-06 / breaking behavior + fix | Editor/color/table hooks and some nested Parts were disconnected → documented hooks reach their real surfaces. | Inspect inherited input/option/typography styles and selected/hover state refinements. Keep calendar range paint specialized; update color-slider exact-label styling intentionally. [Composition](/reviews/theme-customization/theme-06-composition.md?progress-report). |

Mixed rows identify separately additive APIs and breaking behavior; the maximum
classification governs the coordinated train. Correctness fixes do not justify
downgrading a removed name, changed reset baseline or changed event timing.

## Artifact and verification handoff

The original audit baseline is `4822ddcb82852fe4fac1094f7f720d7fd1e4bb50`.
Its source-bound `packages/elements/custom-elements.json` remains recoverable from
Git. It predates the supplemental type snapshot/public graph; do not manufacture
those historical artifacts or treat CEM-only evidence as full type compatibility.
The follow-up's integration baseline is
`31da6249825e6fc5db3dfea1131f27787463e575`, which retains all three matching artifacts.

For the actual package release, identify the previously distributed source and
retain its CEM, `public-types.json` and `public-api.json` together with the candidate
set. The candidate verification receipt records exact hashes for all three plus
the CEM source receipt and the source digest. Use the release CLI's normal graph
comparison for pairs that have matching graphs; historical `--cem-only` comparisons
must stay labeled limited, with missing type coverage left as a review gap.

Run `npm run test:release` and `npm run test:theme`; attach their immutable receipts
and the authored classifications above to the final release draft. The first
command now runs graph freshness, Parts, shared event/transaction checks, geometry,
command/menu and focused unit checks against one source identity. The theme command
retains its broader paint/scoping/reflow coverage. Both stop on failures.

Review [native qualification](/reviews/theme-customization/theme-native-validation.md?progress-report) and retained device,
VoiceOver, real-IME and clipboard items in the [component backlog](component-follow-up-backlog.md).
Unexecuted manual checks remain open; automated passing results do not imply acceptance.
The package-release decision, final API fact classifications against the distribution
baseline, version bump and registry publication remain part of package release.

## Supporting descriptions

Carry the description-content implementation into the next package release draft:
new string/slot/Part support for rich/token editors and range-slider is additive;
selection groups and all five modal variants now accept the same named content.
Empty/hidden assigned choice descriptions now suppress their string fallback in
browser and SSR projection. Modal description Parts now identify a stable
`display: contents` region: inherited text styling still applies, while box
margins/padding/backgrounds should move to the authored description wrapper.
Treat this modal box-ownership change as breaking and retain the coordinated
pre-1.0 minor train above. Newly recognized description slots can expose previously
unrendered children. See [implementation and migration notes](description-content-implementation.md).
Documentation-site publication does not publish the npm packages. Real screen-reader
and IME verification remain explicitly outstanding.

### Composite accessibility follow-ups

Color-slider's nested exact-value input now shares visible description content
with the range after hydration. Range-slider associates application errors with
both thumbs and both exact inputs, preserving description links and uncommitted
drafts during help/error changes. Date-picker's range trigger reports field
errors; its modal endpoints associate their visible edit instruction and current
range rejection. Single-date field guidance and calendar-owned instructions stay
separate. The public description attribute/property, slot and Part are unchanged.
Cross-root element references require browser support and hydration; initial SSR
retains visible guidance and all same-root relationships.
