# API review: feedback-session planning sync

> Historical checkpoint. The current 77-element consistency review is the
> [API normalization audit](api-normalization-audit/README.md), including the
> complete surface inventory, discrepancies and proposed decisions. Counts and
> implementation-state statements below retain their original checkpoint scope.

This note separates the **current 37-element implementation and retained evidence**
from proposed API work. It supersedes the earlier 36-element/20-label-slot review
summary. This planning pass reads existing source and records; it does not rebuild,
run tests, generate a CEM, adopt a baseline, publish, or increment package versions.

## Current contracts

The retained CEM and receipt describe **37 tagged classes from 187 production
sources**, with **37 inherited size contracts and 21 named label slots**. Tests,
fixtures and generated output are excluded from the recorded source selection.

| Surface | Current contract and review implications |
| --- | --- |
| Shared size | `EnElement.size` defaults to `medium` without adding an attribute. `size="inherit"` is an explicit opt-in; `small`, `medium` and `large` establish absolute scopes. Explicit property writes reflect; invalid values or attribute removal restore medium. The getter reports the requested mode, while CSS resolves inherited size. The receipt records this documented property/attribute contract across all 37 elements; browser evidence owns actual reflection and nested-scope behavior. |
| Named labels | The 21 named `label` slots cover accordion item, badge, button, checkbox, color field, date input, dialog, drawer, number field, popover, radio, radio group, rating, search input, segmented control, select, slider, swatch, switch, text field and textarea. Number field also exposes decrement/increment action-label slots; editable slider exposes `editor-label`. Existing default/legacy label content is supported only where documented. |
| Swatch | `en-swatch` is a raw-color or token sample button: a nonempty `token` takes precedence over `color`, `label`/the named label slot names the action, and `disabled` prevents activation. The preview and semantic control stay separate. `en-action` reports cancelable activation; copying, picker behavior and application effects are consumer-owned. The swatch is not a general color editor or a promise to round-trip every CSS color through a native picker. |
| Relationships | `en-popover` and `en-tooltip` use `for` to identify an external native button or `en-button` in the same Document or ShadowRoot. **There is no trigger slot.** Tooltip retains its noninteractive `content` slot; popover retains body and label content. The old trigger-slot composition is replaced, so its migration must appear in future release records rather than being described as a purely additive change. ID rebinding, removal/reconnection, shared-trigger behavior and shadow boundaries belong in the interaction contract and evidence. |
| Color field | `en-color-field` retains a named native six-digit sRGB color field. Its `for` relationship accepts a supported external native button, `en-button` or `en-swatch`; `showPicker()` requests the platform picker during user activation. Native field fallback remains available when picker invocation is absent or rejected. A returned call does not establish an open picker or successful selection, and this does not establish physical iOS/native-picker parity. |
| Password entry | Password usage remains `en-text-field type="password"` with normal labeling, form/name and autocomplete configuration. It does not add a separate password element or promise credential-manager parity. Masked presentation, editing, selection, paste, browser assistance and complete SSO flows need their own evidence. |
| Editable slider | `editable` adds an exact-value native number editor to the range control. `editorLabel`/`editor-label`, `validationText`, the editor slot/Parts, and `en-input` describe that surface. Native number text remains a draft until its documented completion boundary; accepted values obey range bounds/step. Range movement, Enter/change/blur, Escape, invalid/composing drafts, reset/restoration and synchronous cancellation need distinct tests. |
| Overlays and button semantics | Dialog/drawer retain `closedBy`/`closedby`, default `closerequest`, responsive `presentation`/`responsiveQuery`, and the documented dismissal aliases. Tooltip retains transit timing and hover/focus dismissal. Button bridges `aria-haspopup`, `aria-expanded` and `aria-describedby` to its native control; internal fields stay private. These metadata surfaces do not establish arbitrary-trigger or assistive-technology interoperability. |

## State ownership migration — implemented

The user has adopted removal of the public `controlled` property/attribute and `en-request-change`. The [canonical event contract](./architecture.md#cancelable-state-changes-and-application-authority) replaces the older ownership proposal: one synchronous cancelable `en-change` exposes coherently staged public property, Signals and FormData before finalization, with readonly `{ previous, proposed, reason }` detail. It is not a post-commit notification. `en-input` continues to observe native drafts; `en-action` remains the separate documented command channel.

Synchronous cancellation restores only still-owned staging. Silent application writes, including equal assignments, and accepted nested transactions take authority; a canceled inner transaction alone does not. Native drafts and composition are preserved according to their existing field contract. Defer destructive focus, group, draft and overlay effects until acceptance. Already-completed unexpected native close/hide reconciles silently. Native form reset follows its default baseline unless the application cancels the outer form's native reset event; restoration and automatic initialization defaults are authoritative and silent. Existing hydration native-edit adoption is unchanged.

Component adapters, consumers, metadata and examples now implement the contract. The full build, regenerated 40-tag CEM and focused component/core/SSR checks pass at the [current checkpoint](./review-session.md#current-event-api-migration-checkpoint); production documentation verification also passed; delivery identity is tracked in the verification receipt and independent Progress Report. Older controlled-mode receipts below remain historical. Async consumers cancel before awaiting and guard stale results. Install handlers early where documented native-edit adoption requires interception. No ownership mode is inferred and no replacement mode, async settlement API, second committed event or version bump is introduced.

## Release planning: CEM plus supplementary contracts

CEM-driven diff/classification and draft changelog tooling exists, but CEM alone
cannot detect token derivation, CSS recipe, interaction, accessibility or performance
changes. A prose-only diff does not prove a behavior-preserving fix; unchanged CEM
does not prove an unaffected component. Extend the review packet with:

- Token source/alias/derivation graphs, resolved theme outputs, scoped overrides,
  contrast/state dependencies and affected component closure.
- Public CSS properties/Parts/recipes plus style behavior: typography, size,
  density/rhythm, nested scopes, inheritance, output pins and platform preferences.
- Authored interaction/form/ownership contracts and migration notes, including
  same-tree `for` relationships, native editing, focus and event/lifecycle timing.
- Exact-source interactive old/new demonstrations and affected consumer journeys.
  Scoped-registry version review needs its own verified nested-definition and
  dependency isolation; ordinary single-version SSR is not that proof.
- Full candidate sticker sheets and candidate documentation for token/theme changes,
  plus component-state/workflow Playwright visual comparisons. Preserve candidate,
  compared, reviewed and adopted-baseline states separately. Capture/comparison
  caches may reuse matching evidence; they may not infer a human review decision.

Apply the accepted initial `0.x.y` and stable semver policies when a release is
actually selected. This iteration makes **no package-version increment**; package
versions remain `0.1.0`. A review-preview label and CEM `schemaVersion` are separate
identities, not component release versions. No automated publishing, approved
baseline, complete release pipeline, or coverage of all 72 planned patterns is
claimed by the existence of these tools.

## Exact retained records and evidence limits

- Latest registration/author-write metadata audit compares the
  [retained CEM](../packages/elements/custom-elements.json) with baseline commit
  `134e6672d98e7f2d9f033b6ca2f7ef94a2a963f2`. Its current digest is
  `sha256:5ca635390db7b4908b7a6638eba854e0c2b4b9a3cae66ef3daa6e2daac2e30ca`.
  Read-only `generate-elements.ts --check` verified the matching
  [receipt](../packages/elements/custom-elements.json.receipt.json), all 187 source
  digests and 37 catalog tags. The receipt's source-map digest is
  `sha256:cb04e902a408bf41f46387d2e4409206a97c5d35df34d731245656447cdff591`.
  No per-element public API facts changed. The single package-export fact records
  `definitions` adding `en-split-view`'s `en-splitter` dependency and remains subject
  to an authored compatibility decision. Five new author-revision fields are private;
  all 24 `controlled` tags/48 property-and-attribute surfaces remained unchanged at that pre-migration checkpoint. These historical facts do not describe the adopted removal.
  All seven root/workspace versions and workspace lockfile versions remain `0.1.0`.
  Generation and browser tests were not rerun by this audit; retained identity does
  not independently establish regeneration determinism or runtime behavior.
- Prior typography-review source commit:
  `0d0b4265701b9102d1530bee63330ce879de327d`. Its historical CEM digest is
  `sha256:1175dac779d90d0e8f77b62669c2851aae0891de6d70663c82178782e497eacb`,
  also retained in the `134e667` baseline. The 37 shared-size checks, 21 label-slot
  tags and source-derived string-union aliases are unchanged in the current receipt.
- Current [control-typography verification record](/Users/westbrook/.codex/visualizations/2026/09/08/01a0819f-e5d6-71a3-802e-6390c2c90ad3/design-system-progress/evidence/control-typography/verification.json)
  identifies docs HTML
  `0712fe49c62eaaf5da9ee53301c758ba48183deb62cb77e1d6037e0b1f90e60b`
  and report UI
  `12136386896edeb21c11bd9fac3c034d4adabfc77f7cd92dcc9a122700195318`.
  It records 32 token Node tests, 39 token browser checks, 27 sizing regressions and
  432 typography configurations across three Playwright engines. These are named
  family/fixture results, not fresh release-tool tests or full-library coverage.
- Earlier 32-test release/metadata-tool results and `fecd44ee…` performance samples
  retain their original artifact identities. They are not relabeled as current
  runtime evidence. Current-engine automation is not the accepted current-minus-one
  browser/framework/device matrix, physical picker coverage or manual AT approval.
- Read-only recomputation over the current 37-element CEM confirms 39 untyped event
  entries, 233 undocumented
  public-member occurrences (including inherited/platform callbacks), 81 undescribed
  attributes and nine elements without CSS-property annotations. No attribute types
  are missing in that record. Source owners still decide which undocumented members
  are supported public API; a zero CSS-property count alone is not a failure.
- External Lit metadata, source-to-package entry mapping and custom-registration
  definition exports remain explicit metadata/release integration gaps. No accepted
  VRT baseline or manual screen-reader conformance claim is supplied here.

Before any future release, regenerate source-bound metadata and the semantic diff
against the exact selected baseline, add the supplementary changes above, and attach
only matching evidence. The old 36-element diff counts are historical and cannot
classify the later `for`/trigger-slot migration or the adopted ownership/event migration.
