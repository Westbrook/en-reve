# Description API publication

The initial publication was prepared from an isolated `main` checkout based on
`6d09b31cf43523ac8c75352208ab9697b62e2673`, following the user's explicit
instruction to commit the description work to main and publish it.

Only the description runtime, tests, documentation, generated contracts and
migration notes are included. Existing uncommitted range-decoration, clipboard,
theme, showcase and performance work remains in the original working tree.
The main baseline already loads ProseMirror lazily, so the compatibility repair
for the other checkout's uncommitted decorations is not needed or included here.
The earlier implementation receipt describes that broader working-tree test
context; this publication uses independently rebuilt metadata and assets.

The release retains the existing private documentation-site audience and package
versions. Publishing the documentation does not publish npm packages.

Validation of the isolated source:

- Full workspace build, including all packages and production SSR documentation.
- 69 tooling tests and 71 SSR Node tests.
- 54 description, hydration, production-minification and modal-close browser cases.
- 15 existing field-description browser cases.
- 18 focused production docs cases covering the common guide, initial HTML,
  rich/token/composer interoperability, draft preservation and themed layout.
- API graph, TypeScript snapshot and customization freshness checks.

Browser cases run across Chromium, Firefox and WebKit. Evidence and the final
publication receipt are retained in the original workspace under
`artifacts/description-content/publication/`; deployment identity is recorded in
the independent Progress Report after publication. Real screen-reader and IME
checks were open at initial publication; the 25 September manual closeout below
records the subsequent results. The previously documented stale API-reference
test expectations are addressed in the closeout below. See [implementation details](description-content-implementation.md)
and [next-release migration notes](api-next-release.md#supporting-descriptions).


## Publication receipt

The description implementation is committed to local main as
`6b625021e8542ab07f3f50f30ffd3bb54e8c39eb` and was published privately as
version 227. The hosting service rejected large benchmark archive objects in
main history, so the pushed source snapshot is
`9731ef135a7c82fc3a66bf030be897c7cb7eb8b8`. It omits only
`showcases/performance/baselines/`; application source is identical. Local main
and the benchmark archives are preserved. The build fingerprint, deployment
identity, source mapping and live verification are now tracked in
`artifacts/description-content/publication/`.

## Closeout

The 24 September follow-up starts from main
`28305070013d13a91e5ff0c7dd87a9b0b4fd76d0`, retaining the subsequently integrated
rich-editor and document-scrolling work. It corrects three obsolete API-reference
expectations: searching `EnNavigation` returns both navigation components,
combobox events have `DraftInputEvent` and `FieldChangeEvent` types, and pagination
exports `base` rather than `navigation`. The formerly blocked assertions also
now target the current navigation/sidebar demo and distinguish the manifest
digest from the subsequently added TypeScript snapshot digest. These assertions verify actual published
contracts; runtime semantics are unchanged.

The original checkout remains on its existing branch with unrelated work and
copies of changes already committed to main. It must not be reset or bulk-staged
to make its status clean. Raw logs and temporary build artifacts are local
evidence; the compact publication and verification receipts are tracked.

Manual screen-reader description/instruction ordering, help-link activation,
and real IME composition checks were still open at this 24 September closeout;
see the subsequent manual closeout below. Color-slider exact-value guidance,
date-picker modal endpoint instructions, and range-slider error association
retain the separately documented scopes and limitations. Speculative description
APIs for calendars and color pickers remain future work, not unfinished editor
implementation. A new cross-root relationship needs a focused accessibility
change with native browser, SSR and assistive-technology evidence.

Closeout verification: full workspace build passed; all 27 API-reference tests
and all 39 description tests passed across Chromium, Firefox and WebKit with
zero failures, flaky cases or skips. The original publication's 40 source hashes
match the implementation commit. See the tracked compact receipt at
`artifacts/description-content/closeout/verification.json`.

## Manual closeout — 25 September 2026

The user completed the guided description checklist in Safari with VoiceOver on
macOS and a native Japanese input source, using the published documentation.
All guided cases passed by user report:

- Field, textarea, rich-editor and token-editor name/description announcements,
  including the rich editor’s built-in instruction order.
- Reading and activating the authored field-description help link, with focus
  moving to its destination on the full documentation page.
- String and slotted guidance updates during native composition in both editors:
  composition stayed active, confirming inserted `日本` once with the caret
  afterward, and one Command–Z restored the previous draft.
- Separate cancellation checks for all four editor/description combinations,
  preserving the original content and caret position.
- Updated guidance retrieval through VoiceOver’s additional-content command.
  The user reported a hint that more content was available; automatic reading
  of the full changed guidance was not observed.

See the [manual results](description-content-implementation.md#manual-results--25-september-2026)
for fixture details and the independent Progress Report’s `descriptionManualReview`
handoff for individual observations. Exact browser/OS versions, Japanese typing
method and Live Conversion setting were not recorded. Other browser,
screen-reader and IME combinations remain untested. The separate composite
accessibility task’s manual acceptance is not covered by these results.

This closes the description task’s guided manual checklist. It updates the
repository evidence without changing component code, package versions or the
historical deployment receipts; it does not record a new Production deployment.

## Composite accessibility follow-up

The focused [composite accessibility implementation](composite-accessibility.md)
addresses the previously retained color exact-input description, range-slider
error, and date-picker endpoint instruction/error gaps. It preserves the public
description API and documents the cross-root SSR/browser limitation. Native
browser checks remain distinct from pending actual screen-reader and real IME
acceptance. Its compact evidence is in `artifacts/composite-accessibility/verification.json`.
