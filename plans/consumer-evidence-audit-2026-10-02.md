# Consumer evidence audit — 2 October 2026

Source reviewed: `dc53b83b41e912cbf3a88aeaff527c1f74e2fa2d`.
This is a source/evidence audit, **not a new test run**. It resolves the remaining
developer-integration requirements in [verification §7](verification.md#7-developer-and-delivery-integration).
It neither adds a new product requirement nor closes the platform/manual matrix.
The unavailable historical external CSS-authoring rerun is **retired from scope**
at the user's direction; its original evidence remains historical, not passed.

## Requirement and evidence boundaries

| Original requirement | Evidence found | What the evidence establishes | Remaining work |
| --- | --- | --- | --- |
| §7.1: native ESM, one and related/unrelated elements | [Packed registration runner](../tooling/registration/verify-packed.mjs), [October 2 receipt](../probes/consumer-contracts/verification-20261002.json) | 21 recorded cases across three pinned engines: published import maps, selective registration, actual requests, shared dependency identity, keyboard/pointer interactions. | Broader retail/physical coverage stays in the support ledger; do not turn this into an all-catalog fixture requirement. |
| §7.2: independently packed framework consumers | [Packed framework receipt](../probes/framework-consumption/verification-packed-20261002.json), [support ledger](support-coverage.md#framework-receipt-reconciliation) | Independent package consumers, public declarations and documented binding/transaction/remount behavior; later product receipts remain separately bounded. | Preserve release-line refresh and platform/manual obligations. |
| §7.3: selected server integration and adoption | [Consumer preparation](../probes/consumer-contracts/prepare.mjs), [browser assertions](../probes/consumer-contracts/contracts.spec.ts), October 2 receipt above | 53 recorded passes and one capability skip: actual packed SSR, request isolation, first paint, immediate/delayed adoption, early edits and failed hydration in the selected delivery modes. | No inference of every framework's SSR integration or library-owned no-JS form submission. |
| §7.4: supported reusable layers in alternate compositions | [Primitives contract](../packages/primitives/README.md), [styles contract](../packages/styles/README.md), maintained fixtures below | Real alternate compositions exist. Unit and owning-element tests provide additional, different evidence. | Establish an entry-by-entry supported contract inventory and qualify alternate compositions through packed public imports. Existing fixture imports do not establish this for every supported entry. |
| §7.5a: generated examples as consumer fixtures | [Example generator](../apps/docs/scripts/generate-api-examples.mjs), [example smoke runner](../apps/docs/tests/api-examples-smoke.mjs), [inline example suite](../apps/docs/tests/api-inline-examples.spec.ts) | Generated documentation routes are exercised before/after hydration, with registration and initial native-state checks. Interactive docs scenarios supplement them. | Qualify exported/copyable example modules outside the docs runtime with packed dependencies. A docs route or workspace typecheck alone is not that result. |
| §7.5b: schema and actual exposed contracts | [Metadata adapter](../tooling/metadata/generate-wc-toolkit.ts), [public-contract tests](../tooling/metadata/public-contract.test.ts), [rendered Parts](../probes/api-contracts/parts.spec.ts), [events](../probes/api-contracts/events.spec.ts) | Generation performs validation; freshness/provenance and public contract tests exist, alongside selected rendered behavior checks. | Retain exact provenance and assertion scope. Schema validity and source extraction do not replace consumer execution. |
| §7.5c: discovery → retrieve API → produce consumer → execute | [Chosen machine-access direction](architecture.md#release-unit-cem-and-evidence-data), [CEM contract](../tooling/metadata/README.md), [public policy](../tooling/metadata/public-policy.ts) | CEM plus complementary manifests is the selected interface; a new CLI or MCP product is not required. | Add one reproducible end-to-end consumer whose imports and configured API are derived from those artifacts, then execute its interaction against packed packages. The generation CLI and the manually authored packed consumers do not alone demonstrate that chain. |

## Reusable layers: existing alternate compositions

These are source observations, not transfers of old passing receipts to current
source. A package-style import can still resolve to a workspace installation;
only an isolated installation and resolution record establish packed consumption.

| Composition | Actual dependency boundary | Useful existing behavior | Qualification gap |
| --- | --- | --- | --- |
| [Editing/form/focus fixtures](../packages/primitives/tests/browser/fixture.ts), [assertions](../packages/primitives/tests/browser/primitives.spec.ts) | Direct relative `../../dist/` imports for draft/value models, Signals, editing, form, roving-focus and event helpers. | Real native typing, cancellation across shadow boundaries, composition guards, selection preservation, reconnect, forms and RTL focus. | Run the documented composition with supported package subpaths from fresh tarballs; preserve physical IME as separate evidence. |
| [Content recipe fixture](../packages/primitives/tests/content/fixture-template.ts), [client](../packages/primitives/tests/content/fixture.ts) | Templates import `../../src/`; the client explicitly imports the source skeleton definition. | Native content recipes and hydration have their own maintained suite. | Resolve both the reusable helpers and generated child dependency through the packed public surface. |
| [Navigation recipe](../packages/primitives/tests/navigation/fixture-template.ts), [client](../packages/primitives/tests/navigation/fixture.ts) | Public `@en-reve/primitives` spellings for navigation templates and anchor controller. | Authored native navigation, optional measured alignment and native interaction. | Record the actual resolver/install boundary; import spelling alone does not prove tarball isolation. |
| [Style composition suite](../packages/styles/tests/composition/composition.spec.ts) | Component specimens, native recipes, Parts and token overrides. | Shared customization behavior and selected native recipes. | Separate delivered-element customization from independently composing each supported style contract. Private template class names do not become public hooks. |
| [Content](../packages/primitives/docs/content.md), [navigation](../packages/primitives/docs/navigation.md), [table](../packages/primitives/docs/table.md), [virtual collection](../packages/primitives/docs/virtual-collection.md) guides | Documented lower-level compositions and ownership contracts. | These guides identify intended reusable behavior and meaningful assertions. | Include their supported entries in the inventory; type-only exports and internal coordination modules need explicit classification, not invented UI tests. |

The primitives package currently exposes three wildcard families and contains
45 source modules across state/templates/interactions. That is an **exposure
inventory**, not proof that all 45 have the same public support contract. The
elements package's `publicEntryPolicy` describes elements; it cannot silently
classify primitives or styles. Conversely, absence of a ready consumer fixture
is not grounds to declare a documented reusable entry unsupported.

## Generated examples: distinguish the artifacts

`generate-api-examples.mjs` produces route HTML, a selective definition loader,
the page inventory and selected displayed source modules. These artifacts serve
different purposes. Some route registrations intentionally use docs-owned demo
elements such as `../composable-chat-demo.js`; their success inside the docs
application is not evidence that this private import belongs in consumer code.

The existing smoke runner consumes the generated route inventory and checks
native SSR state, hydration and upgrade errors. It does not copy a generated
consumer into an independent installation. Keep that useful smoke coverage;
supplement it with independently runnable generated examples rather than
relabeling it or forcing docs-only scenario controls into the public package.

## Next bounded implementation

### Qualification added after the audit

The [metadata-consumer receipt](../tooling/metadata/verification/consumer-20261002.json)
now qualifies item 1 below: nine real browser cases across three pinned engines,
11 negative/discovery controls and 14 pathway controls passed. The fixture
discovers candidate APIs from the packed CEM, retrieves the selected checkbox's
matching graph/types, generates and strictly compiles the consumer, and exercises
its actual contract. [Reproduction and exact boundary](../tooling/metadata/README.md#metadata-to-consumer-qualification).
The table above preserves the original source audit; its §7.5c gap is resolved
within the agreed small-consumer scope by this later receipt. Items 2 and 3 remain
unfinished; no broader support or manual acceptance is inferred.

1. Add the §7.5c fixture using the existing CEM/manifests. Record discovery,
   selected declaration/definition, generated source, tarball identities, public
   declaration compilation and actual browser interaction. Fail if the described
   API or selective registration does not match the running consumer.
2. Inventory §7.4 supported entries against their owning contracts and reuse the
   existing alternate compositions. Qualify package resolution and behavior in
   batches; keep each entry's evidence explicit. Do not create tests that only
   check that an import exists.
3. Extend generated-example qualification using the same isolated consumer
   machinery. Retain docs-only specimens as docs scenarios with their own tests.

The native Firefox assertion-level comparison remains a separate unfinished
audit. This document does not claim it complete or substitute case counts for
assertion equivalence. Safari's visible desktop condition, other OS/device and
manual assistive-technology/input coverage, and separate-owner review gates
remain in [the support ledger](support-coverage.md).

### Reusable-layer batch added after the audit

The [packed reusable-layer fixture](../probes/reusable-layers/README.md) now runs the maintained core editing/form/focus composition from public package imports, plus a native-control/template/style recipe. All 48 browser cases pass. The source-observation table above describes the audit base; the core fixture no longer uses relative dist imports. The [exhaustive inventory](../probes/reusable-layers/inventory.json) records 12 primitive and three JavaScript style entries with bounded scenario qualification. Remaining entries, portable CSS and generated-example consumers stay open.

### Native content/navigation qualification

The [native-recipes batch](../probes/native-recipes/README.md) now qualifies maintained content/navigation recipes from isolated tarballs, using both Lit and portable CSS delivery.78 packed browser cases,39 original-owner cases and18 pathway/inventory controls pass. Content no longer imports source templates or source skeleton definitions; shared document shells keep both owners aligned. The source-observation table remains the historical audit baseline. Other inventory entries and independently generated examples remain open.

### Table and virtual-collection qualification

The [collection-recipes batch](../probes/collection-recipes/README.md) exercises the maintained table/list and document-scroll applications against isolated tarballs. Its 81-case matrix retains native SSR/hydration, transactional selection, keyed identity, measured anchoring, paging, native Tab continuity, reveal alignment and observer cleanup. Document scrolling runs at desktop and phone widths. Seven additional public entries receive bounded scenario qualification; portable table CSS, independently generated examples and manual/retail/physical coverage remain open. The known VoiceOver reading-cursor issue is unchanged.

### Copied-source qualification

The [existing specimen consumer](../apps/docs/tests/README.md#copied-examples-as-packed-consumers)
already supplied useful independent runtime coverage; the original audit did
not account for that test. Its TypeScript compilation nevertheless resolved the
workspace installation and it checked only one complete API copy. The new
[receipt](../apps/docs/tests/verification-generated-examples-20261002.json) records
all 48 displayed gallery samples and 11 complete API copies compiling against
packed declarations. Eight native source consumers execute in each of three
pinned engines, with packed JavaScript/CSS and no docs runtime. The newly added
tooltip consumer also exposed and fixed a duplicated helper/import prelude in
the API copy. Two separately authored scoped-color controls remain distinct.

This resolves the compiler boundary and expands §7.5a evidence; it does **not**
complete independent behavior coverage of all generated/copied examples.
Prioritize the remaining complete API modules (calendar, carousel, chat,
multi-step, presence/activity, rich text, toast, tree data and virtual collection),
reusing their owning interaction assertions where possible. Remaining gallery
samples, public-layer entries and platform/manual obligations stay open.

### Complete API journeys added after copied-source qualification

The [complete API consumer receipt](../apps/docs/tests/verification-complete-api-consumers-20261002.json)
now covers the nine complete modules listed above through their actual copied
handlers, using native packed modules. All eleven complete API copies have named
consumer journeys in Chromium, Firefox and WebKit. Together with the six gallery
copies this is 17 executed source consumers per engine; 59 modules compile.
The two scoped-color fixtures remain separately authored controls. The native
fixture now follows the locked dependency closure, fixing its missing
ProseMirror import map; no component implementation changed in this batch.

Six browser tests, strict core/docs types and 123 integrity checks pass. Exact
journeys and failed/intermediate/final runs are recorded in the receipt. This
resolves the complete-copy batch identified above, with bounded behavior evidence;
42 gallery copies, the remaining public layers, native Firefox assertion
comparison and platform/manual/separate-owner obligations remain open.

### Gallery form and application qualification

The [gallery consumer receipt](../apps/docs/tests/verification-gallery-consumers-20261002.json)
adds 21 independently executed gallery copies: form/control examples and the
gallery delivery of five complete applications. These use the actual copied
exports with explicit public registrations and packed modules. Fifteen browser
tests pass across three engines, with 38 copied consumers per engine: 27 gallery
copies and all eleven complete API copies. All 59 displayed modules compile;
strict core/docs types and 123 integrity checks pass.

Twenty-one gallery copies remain explicitly pending in the tested inventory.
This is named journey coverage, not every owning assertion. The reference-target
IDL/native-AX distinction and manual native-picker boundary remain explicit.
Remaining public layers, native Firefox assertion comparison and
platform/manual/separate-owner requirements are unchanged.

### Standalone presentation and theme qualification

The [presentation batch](../apps/docs/tests/README.md#standalone-presentation-and-theme-copies)
found and corrected real copy-delivery gaps: example-owned layout CSS and the
inverse child-theme generator were supplied only by the docs shell. Actual copied
modules now deliver them directly. Nine more named journeys check geometry,
responsive layout, theme isolation, keyboard focus and overlay draft recovery.
The final33 browser cases cover47 copied consumers per engine plus the existing
appearance matrix; three additional density/identity regressions pass;59 copies compile. Twelve gallery copies still need independent
runtime journeys. The original public-layer/platform/manual scope stays open.

### Displayed-copy inventory exhausted

The [remaining navigation/content batch](../apps/docs/tests/README.md#remaining-gallery-navigation-and-content-copies)
qualifies the final twelve displayed gallery copies. All48 gallery and11complete
API sources now compile and execute named journeys against native packed modules
in three pinned engines. All24 source tests, fresh SSR build, strict types and189
Node checks pass. Actual copies now own their action-row and hidden sorting-label
styles; the fixture resolves declared table/content/radio CSS from public packs.

This resolves the pending displayed-copy IDs recorded above, not every owning
assertion. The80 remaining §7.4 inventory entries, native Firefox assertion-level
comparison, platform/manual/Safari and separate-owner obligations remain open.

### Application-owned projection qualification

The [projection recipes](../probes/projection-recipes/README.md) independently
consume the breadcrumb controller/canonical template, default-slot navigation and
segmented selection-child controller.36 cases pass in three engines against
isolated tarballs and declarations. The application owns native links/radios,
selection transactions and validation recovery; no delivered elements are imported.
This brings named public-entry coverage to34/110, leaving76 entries pending.
SSR, other descriptor modes and the broader platform/manual/owner scope remain.

## Native form composition checkpoint

The [form recipes](../probes/form-recipes/README.md) qualify six further public
entries with72 cases across both stylesheet deliveries and three engines.
Rich step/validation projection and actual File/FormData interactions run in
application-owned consumers using only packed imports.40/110 entries now have
bounded scenario receipts;70 remain. Original projection receipt inputs are
retained byte-for-byte before additive pathway/inventory changes. OS file chooser
UI, physical drag/drop, SSR/hydration and platform/manual/owner acceptance are not
inferred from this result. No runtime implementation changed.

## State and explicit registration checkpoint

The [state recipes](../probes/state-recipes/README.md) qualify five further public
entries in native query, interval, responsive-action and lazy-panel compositions.
48 cases across three engines execute packed imports and actual split chunks.
45/110 entries now have bounded receipts;65 remain. Form qualification snapshots
preserve its exact earlier registry/inventory inputs. Pure helpers do not inherit
the application's evaluator, measurement or focus policy; the contract separates
them. Global-registry browser evidence does not replace scoped SSR/framework or
platform/manual acceptance.

## Presentation recipe checkpoint

The [packed presentation recipes](../probes/presentation-recipes/README.md) qualify
14 further entries in native pattern/chart compositions and both stylesheet forms.
114 cases pass across Chromium, Firefox and WebKit;32 original gallery cases and
33 Node checks pass with a fresh production docs build. A real choice-card defect
was fixed: explicit checked state now reconciles the native property after edits,
while omission preserves native selection. SSR retains correct boolean markup.
59/110 public entries have named-scenario receipts;51 remain, alongside all
platform/manual/owner obligations. Earlier run01/runtime and run02/SSR failures
remain evidence. Neither bounded journeys nor these counts imply full completion.

## Native calendar consumer checkpoint

The [calendar recipes](../probes/calendar-recipes/README.md) qualify three further
entries through a packed application-owned date/range grid in both style forms.
120 browser cases and39 Node checks pass.62/110 entries have named-scenario
receipts;48 remain, plus all platform/manual/owner scope. The native fractional
step observation and unsupported WebKit forced-color property are retained limits,
not waived helper assertions. No library runtime changed; the existing qualified
production build is reused only because its source/output hashes remain identical.

## Native tree consumer checkpoint

[Tree recipes](../probes/tree-recipes/README.md) qualify four further entries in
a finite application-owned native tree.120 browser cases and38 Node checks pass
across three engines and two style deliveries. Exact range selection, keyboard
focus, native desktop dragging, ordered move proposals, invalid moves, atomic
hierarchy replacement, loading/retry and stale-result guards are exercised.
The initial Control-click failures in macOS Chromium are retained; the corrected
journey uses the platform modifier, not a claim of Windows pointer validation.
66/110 entries have named-scenario receipts;44 and platform/manual/owner scope
remain. Product runtime unchanged; exact qualified build remains reusable.

## Native notification consumer checkpoint

[Notification recipes](../probes/notification-recipes/README.md) qualify seven more
public helper/style entries:138 browser cases and40 Node checks pass. Existing
swatch coverage passes25 cases with two declared non-Chromium forced-color skips.
Portable feedback now uses opt-in native swatch sizing instead of resizing every
shadow host; existing JS swatch styling stays compatible. Queue/focus/timer and
announcement ownership are documented separately. A fresh production build and
explicit metadata refresh include the change.73/110 public entries now have
bounded receipts;37 plus platform/manual/owner scope remain. Earlier fixture
failures and the preparation metadata-stability stop remain retained evidence.

## Native collection stylesheet qualification — October 2, 2026

The [packed collection-style consumers](../probes/collection-style-recipes/README.md)
qualify five additional entries: portable table CSS and both pagination/carousel
style deliveries. A new `.en-table-native` wrapper reuses table paint without
registering `en-table`; its existing selector contract remains intact. Dedicated
application shadow roots own the matching pager/carousel templates and behavior.

All144 packed cases (24 scenarios × two deliveries × three engines),21 existing
table cases and36 Node checks pass, with zero skipped/retried cases. All131 final
integrity checks pass. A fresh production build passes with1184 assets. The
[receipt](../probes/collection-style-recipes/verification-20261002.json) preserves
three earlier failed attempts and the explicit native Firefox scrollbar baseline,
WebKit Option+Tab policy and unsupported forced-color-adjust branch. These are
bounded engine assertions, not retail/manual acceptance.

The public-entry inventory is78/110 qualified,32 pending. All48 gallery and11
complete API copies retain their separate bounded journeys. Native Firefox
assertion comparison, physical/manual/retail and separate-owner obligations remain;
the historical external CSS-authoring rerun stays retired, never passed. Next are
consumer-owned choice, command and overlay compositions; editor/color/collaboration
and remaining helper/export surfaces retain their inventory rows.


## Native choice, command and overlay consumer qualification — 2026-10-02

The [packed choice/overlay consumers](../probes/choice-overlay-recipes/README.md)
qualify ten additional entries: JS and portable CSS for selection, surfaces,
combobox, commands and overlays. Native radios/checks, manual tabs, disclosure,
scoped cards, filtered editable selection, menu/toolbar/palette and responsive
modal/drawer compositions use public imports without owning elements.

All 180 browser cases (30 scenarios × two deliveries × three engines) and 38
Node controls pass without skips or retries. The narrow-palette check caught an
example import-order defect: generic overlays must precede palette styling.
The corrected order and application responsibilities are documented. No library
runtime changed; all inputs and assets of the last qualified production build
remain byte-identical. Failed attempts remain in the linked receipt.

The public-entry inventory is now 88/110 qualified, with 22 pending. This is
bounded scenario coverage; manual AT, retail/physical browser coverage, full
SSR/hydration and separate-owner obligations remain. Next are the remaining
editor, color, collaboration and helper compositions. Historical external
CSS-authoring rerun remains retired, never passed.


## Editor and collaboration consumer qualification — 2026-10-02

The [packed editor/collaboration consumers](../probes/editor-collaboration-recipes/README.md)
qualify ten additional public entries. A native draft with structured token preview
uses EditorDocument, explicit composer registration, revision-bound bookmarks,
cancelable provider tasks and versioned clipboard conversion. Native rich notes
and chat/presence/activity surfaces use isolated matching styles. Chat and
collaboration run in both stylesheet deliveries; editor styles are JS-only.

All 168 browser cases (28 scenarios × two compositions × three engines) and 40
Node controls pass with no skipped or retried cases. Firefox synthetic clipboard
payloads use the event's own clipboardData channel, not the constructor input.
Earlier failures and their corrections are retained in the receipt. This is not
OS clipboard transport, physical IME or a substitute for a rich-editor backend.
No library runtime changed; the qualified production app/build remain identical.

The public-entry inventory is 98/110 qualified, with 12 pending. Remaining entries
cover color styles, optional-slot/static-style/scroll helpers and style barrels/
metadata. Manual AT, physical/retail platforms, full SSR/hydration and separate-owner
obligations remain open. Historical external CSS-authoring rerun remains retired.


## Color style and discovery consumers — 2026-10-02

The [packed color consumers](../probes/color-recipes/README.md) qualify ten public
entries: the nine remaining style exports and a new independent color-plane.css.
The original portable picker concatenated plane selectors and incorrectly adopted
its two-column container layout. Picker and plane CSS now mirror their independent
JavaScript fragments. Portable plane users explicitly import color-plane.css.

144 browser cases pass in two deliveries across three engines, with41 initial
Node controls and a fresh1184-asset production build. Native input, validation,
alpha/checkerboard paint, pointer capture/cancel/clamping, keyboard, RTL, disabled
state, scoped customization, metadata and responsive geometry have bounded proof.
Earlier failures remain in the receipt, including fixture fixes and a one-degree
WebKit pointer cardinal tolerance. Exact keyboard and cancellation remain tested.

The inventory is108/111 qualified; optional-slot-presence, static-styles and
scroll-into-view helpers remain. Manual AT, physical/retail platforms, complete
SSR/hydration and separate-owner obligations are still distinct unfinished scope.
Historical external CSS-authoring rerun remains retired, never passed.

Final combined integrity and color pathway passes176 Node checks and144 browser
cases with no skips or retries. Historical exporter bytes are retained separately
from the new export generator; prior receipts are not relabeled as new results.
