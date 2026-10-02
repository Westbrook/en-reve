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
