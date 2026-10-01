# API normalization implementation follow-up

Authorized September 19, 2026: implement the focused review recommendations,
integrate into `main` and publish the existing private documentation site.
Original API-01–API-10 scope remains delivered. User review is separate.

## Transaction eligibility

Token-editor proposals now recheck disabled/read-only state and loss of a live
connection after synchronous listeners. The same guard covers replacement,
undo/redo and model-originated edits. The model retains rollback/history ownership;
explicit author writes and accepted nested transactions still supersede outer work.
Before-connection programmatic initialization remains supported.

Public browser interactions also reproduced the gap in text fields, checkboxes and
sliders. Their shared field, choice and numeric-choice bases now reject pending
defaults after disabling or disconnecting. Editable fields also recheck read-only
state; native fieldset disabling participates in the form adapter's effective state.
No event name, payload, return type or extra committed notification is introduced.

Focused tests first reproduced 16 failures in Chromium. The initial repaired matrix
passed 69 cases in Chromium, Firefox and WebKit. The final suite adds native fieldset
disabling and runs with the complete shared transaction suite in the gate below.

## Regression reconciliation

The 12 family-geometry cases now inspect Part token membership, preserve family
padding precedence, and assert segmented insets leave unrelated controls unchanged.
They continue checking native target floors, inner radii, invalid-field stability,
full scoped reset and partial-theme retention. All 12 pass in the three engines.

The command-palette focus failure was a stale shadow-root assertion: the dialog's
active element is now an `en-button` host, while its native close control lives in
a nested shadow root. The test checks the actual focused accessible control and
retains Tab, Shift+Tab, dismissal, query clearing and focus-return assertions.
The focused regression passes all three engines; no dialog runtime change was needed.

The broader theme gate also exposed a surface-CSS snapshot that predated API-07's
shared and coarse-pointer splitter target floors. The reviewed snapshot now records
that intentional change and its source commit; the typography migration baseline
remains unchanged.

## Repeatable verification and release record

`npm run test:api` now includes shared API event and transaction browser suites in
addition to graph freshness, tooling and all 77 catalog Parts. `npm run test:release`
builds and runs that aggregate plus event/token/form units, customization freshness,
all control geometry and command/menu tests. Its receipt records one source digest,
artifact hashes and per-step logs, and rejects source changes during verification.
It does not publish or approve anything. `npm run test:theme` remains the broader
theme migration gate.

The [combined API/theme migration record](api-next-release.md) classifies all
breaking and additive normalization changes, provides consumer actions, and records
historical artifact limits. Packages remain `0.1.0`; site publication is not a package
release. Final comparison uses the actual distribution baseline, with unavailable
historical type metadata retained as an explicit evidence gap.

## Current review guidance

The decision register and rendered review now agree that all original groups are
delivered. Completed localization, typed events, Parts and supported import policy
are no longer described as unscheduled. CSS-08's current disposition points to the
canonical API-06 roles rather than obsolete aliases. Original audit evidence remains
dated and preserved. The independent report retains historical checkpoints and
unresolved user feedback while adding the current implementation/publication state.

Manual platform/assistive-technology acceptance and optional Context/theme/localization
capabilities stay in their existing backlog. This follow-up does not silently close them.
