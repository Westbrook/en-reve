# Cross-cutting API tooling audit

**Current disposition:** All tracked API-10 findings are implemented or explicitly retained as documented boundaries. See [the finding-by-finding completion record](../api-10-completion.md). Original audit evidence follows.

Read-only audit of `the repository`, 2026-09-18. No repository files changed or builds run. Ran `node tooling/metadata/generate-elements.ts --check`: PASS, 364 production source files, 77 element tags, digest `sha256:72250c387896d139c8d59f43f5bf618fe0db4366dc5e9ec732efd195c4b2eda4`. The package and docs-public CEM bytes currently match. Read-only `snapshotCem()` inspection and in-memory JSON comparisons were also used.

The receipt records 44 event entries without a type, 411 undocumented public-member occurrences (including inherited/platform members), 161 undescribed attribute occurrences, and four attributes missing types. Those counts are scope indicators, **not independent defects**. Confirmed comparisons follow. Paths below are relative to the repository root; line numbers refer to the audited source.

## T1 — Internal coordination is advertised as a consumer event

**Confirmed extraction drift; medium priority.** `packages/elements/src/toast/element.ts:84–88` emits `en-internal-toast-focus-return` solely for composed-region focus recovery; `toast-region/element.ts:116–117` consumes and stops it. The CEM advertises it as an Event at `packages/elements/custom-elements.json:55713`. Docs accept all non-private event entries at `apps/docs/src/api-reference/model.ts:85–87`, and the metadata correction pass only marks member declarations `@internal` at `tooling/metadata/lit-contract.ts:38–40,78–81`; it does not classify events. Thus an implementation channel becomes a public Events row and a release surface.

**Proposal:** add a source-authored event visibility annotation/registry and have one normalizer apply it before docs/release extraction. Validate direct dispatch plus controller dispatch against explicitly public/private events. Do not silently blacklist arbitrary event names. The same review should decide whether rich editor `en-toolbar-request` (CEM `:41621`, emitter `rich-text-editor/element.ts:349`, listener `editor-toolbar.ts:46,67`) is intentionally a supported integration event or private coordination. Its current lack of a description is a confirmed omission; its intended visibility needs owner judgment.

## T2 — Shared event behavior has inconsistent and incomplete published type contracts

**Confirmed documentation/type completeness drift; medium priority.** `packages/primitives/src/interactions/events.ts:120–127` defines `DraftInputDetail` and a single `en-input` dispatcher. `interactions/editing-controller.ts:54–57` uses it; `packages/elements/src/forms-private/editable-field.ts:19–24` and `packages/elements/src/text-field/element.ts:42` share that bridge. Yet text field declares untyped `@fires en-input` and `@fires en-change` at `text-field/element.ts:39–40`, while slider explicitly declares the same draft event type and numeric change type at `slider/index.ts:34–35`. CEM consequently retains no event type for the text field. Bare `CustomEvent` declarations (e.g. carousel `carousel.ts:50`) also escape the receipt's `!event.type?.text` completeness check (`tooling/metadata/generate-elements.ts:94`), despite omitting the payload type.

**Proposal:** author typed event contracts once per semantic family; project the contract into CEM and component-specific listener types. Check event name, detail type, bubbles/composed/cancelable, stage visibility, rollback, and authoritative-write precedence. Prefer a shared draft-input schema and generic `ChangeDetail<T,Reason>` instead of manually copying detail shapes. Do not put a single conflicting `en-change` payload into a global DOM event map; element-specific event maps/overloads or exported event types are appropriate. Native `en-toggle` notifications intentionally describe already-completed native disclosure (`navigation-group.ts:41–45`); they should be explicitly categorized rather than forced into cancelable transactions.

## T3 — Public interfaces/type aliases are outside the release diff's semantic coverage

**Implementation update (2026-09-19):** Supplemental source-generated type snapshots and shared docs/release consumption are implemented locally. The CLI requires type evidence by default; historical CEM-only mode is explicit. See [the implementation and coverage limits](../api-10-type-snapshot.md). The original audit evidence follows.

**Confirmed extraction gap; high audit priority.** `packages/elements/src/index.ts:3,62,76` exports `ToastOptions`, `DateRange`, and `ColorFormat`. Their source bodies exist at `toast-region/element.ts:7`, `internal/date-range.ts:4–5`, and `color-picker/element.ts:12`. CEM has export pointers but no interface/type-alias declaration bodies. `tooling/metadata/generate.ts:52–65` supplements only directly authored string-union aliases in the receipt. The release diff accepts only two CEM inputs (`tooling/releases/cem-diff.ts:236–238`) and never consumes this receipt, so narrowing `ColorFormat` or changing a required DateRange/ToastOptions field can leave these export facts unchanged if consumers still refer to the same named type.

**Observed:** `snapshotCem` yields pointer-only entries for `src/color-picker.ts#ColorFormat`, `src/index.ts#DateRange`, `src/index.ts#ToastOptions`, and `src/combobox.ts#ComboboxItem`; there is no declaration shape attached. This is acknowledged at `tooling/metadata/README.md:59–64`, but it remains consequential for release review.

**Proposal:** use a supplemental TypeScript API snapshot (including reachable aliases, interfaces, generics, and type-only exports) alongside CEM. Let docs and release tooling consume the same record. Alternative: an established declaration/API extraction tool at the package export boundary. Avoid inventing nonstandard CEM declaration kinds. Preserve explicit human compatibility decisions for behavior that types cannot encode.

## T4 — Getter/setter types disappear despite a typed setter and a capable source resolver

**Confirmed extraction drift; medium priority.** `color-plane.ts:47–48` declares an inferred getter and explicit `set value(value:string)`. `token-editor/element.ts:61–62` similarly exposes a string value. Their retained CEM property and attribute entries contain no `type`. The same occurs for rich editor and color wheel; the receipt reports the four `value` attributes (`custom-elements.json.receipt.json:1539` and corresponding element records). `lit-contract.ts:41` already collects setter parameter types, but applies source types only to concrete inherited overrides (`:83–86`), so ordinary accessor pairs remain uncorrected. Docs faithfully display the missing CEM type (`api-reference/model.ts:48`), whereas interactive controls independently recover the type with TypeScript's checker (`scripts/api-control-metadata.mjs:47–65`).

**Proposal:** normalize accessor pair contracts centrally: prefer explicit getter/setter type, verify disagreement, and use the checker where inference is required. Feed the normalized type to docs, controls, and release records. A smaller alternative is explicit getter return annotations in source; that is easy but leaves the duplicated extraction paths. Add one focused fixture covering inferred getter + typed setter, not a snapshot of every property.

## T5 — Three local-reference resolvers implement different rules

**Confirmed tooling inconsistency; medium priority.** `apps/docs/scripts/generate-api-reference.mjs:9–26` follows barrel exports, handles `./x.js` -> `src/x.ts`, and detects cycles. `tooling/metadata/lit-contract.ts:60–66` separately resolves local inheritance and rewrites only superclass/mixin/member/attribute provenance (`:100`). `tooling/releases/cem-diff.ts:105–111` resolves direct and relative paths but neither normalizes `.js` to `.ts` nor follows a barrel chain. Ordinary export targets that fail resolution are accepted without a gap (`:180–185`), unlike custom-element-definition exports (`:176–179`). Read-only snapshot inspection found **zero export-resolution gaps** while the real root type exports listed in T3 were unresolved.

**Impact:** release records can retain shallow export pointers and omit the declaration behind the package entry; docs have stricter resolution than release tooling. Origin-module facts may still detect many implementation signature changes, so this is not a claim that all such changes are invisible.

**Proposal:** share a cycle-safe source module/reference resolver plus public-entry graph. Record unresolved local ordinary exports as explicit gaps, distinguish external dependencies, and cover barrel aliases/type-only exports. Do not treat unresolved external Lit/platform inheritance as a fabricated local contract.

## T6 — Freshness authenticates component bytes, not the extraction policy

**Confirmed guard gap; lower priority.** The receipt includes analyzer/parser versions and source digests at `tooling/metadata/generate.ts:66–76`. `verifyGeneratedElements()` checks manifest digest, source selection, catalog tags/classes, and source bytes (`generate-elements.ts:164–175`), but does not compare the installed analyzer/parser or fingerprint `generate.ts`, `lit-contract.ts`, and catalog/extraction logic. `generateAPIReference()` treats this verification as sufficient freshness (`apps/docs/scripts/generate-api-reference.mjs:91–94`). A corrected extractor or analyzer upgrade can therefore leave `--check` passing against a previously generated interpretation of unchanged components.

**Proposal:** include a generator contract/version fingerprint and relevant dependency identity in the receipt, validate it in `--check`, and keep the existing human review after analyzer upgrades (`tooling/metadata/README.md:24–28`). Alternative: regenerate in memory and compare canonical output in CI; that is slower but simpler. Current retained files **are** byte-fresh; no stale output is alleged here.

## T7 — Popup measurement lifecycle and empirical viewport correction are copied

**Concrete shared-workflow opportunity; medium priority.** `menu/position-controller.ts:21–22` explicitly says it is adapted from combobox. Both maintain connected/anchor/popup/observer/abort/frame/generation/origin/presentation state (combobox `:16–28`, menu `:24–36`), subscribe to window, shadow-root and visualViewport changes (combobox `:43–61`, menu `:59–75`), coalesce work by frame/generation (combobox `:66–73`, menu `:80–87`), and duplicate fixed-surface origin calibration and 0.5px stability rules (combobox `:86–104`, menu `:105–123`). Fit/minimum-row/pending calculations are likewise parallel (combobox `:108–142`, menu `:126–160`).

**Proposal:** extract small shared observer/scheduler, origin-calibration, viewport-bounds, and fit-state helpers. Keep placement policy and focus ownership in each controller. **Intentional differences:** combobox keeps DOM focus in its input; menu keeps focus in the popup, retains visibility during measurement, supports submenu/replacement placement, and may keep a constrained surface visible (`menu/position-controller.ts:139–174`). A universal position controller with many mode flags would likely be worse. Existing native/visualViewport tests should be parameterized around the shared geometry invariants, with dedicated policy tests retained.

## T8 — Browser fixture transport and settling helpers are copied across suites

**Concrete shared-workflow opportunity; lower priority.** `packages/elements/src/combobox/tests/server.mjs:1–53` and `commands/tests/server.mjs:1–53` are the same server algorithm: only environment key, default port, and error label differ. Both copy the entire import map, roots allowlist, MIME table, fixture injection, path validation, and shutdown flow. `commands/tests/helpers.ts:18–19` and `combobox/tests/mobile-helpers.ts:53–56` also reimplement frame settling. This is avoidable repeated setup, and new runtime dependencies require synchronized import-map edits.

**Proposal:** one dist-consumer fixture server factory accepting root, fixture routes, port/env name, and deliberate package additions; one frame/stable-rectangle helper. Keep test scenarios and component-specific locators in each suite. **Intentional exception:** dialog's Vite server (`dialog/tests/server.mjs:1–20`) exercises a different source-serving path and theme middleware; don't replace dist-consumer testing with Vite just to unify code. Avoid changing behavioral waits into arbitrary sleeps.

## Cross-reference: transaction engines

The custom rich-text editor commit path (`rich-text-editor/element.ts:279–293`) duplicates part of the shared transaction machinery and lacks accepted-nested-transaction ownership checks present in `primitives/interactions/events.ts:65–95`. The editor audit owner is covering the concrete behavior and reproduction; do not count it again here. This supports a shared **contract test harness** even where ProseMirror requires a specialized transaction implementation.

## Sustainable audit workflow (proposal only)

1. Build one source-backed public contract graph: explicit package exports/registrations, reachable TS declarations, CEM fields/attributes/methods/slots/parts/events, and deliberately authored behavioral metadata. Keep the existing receipt's source provenance and add generator identity. Do not turn every source declaration into promised public API.
2. Add fast read-only checks: freshness; public class/tag/definition parity; dependency closure; public/internal event classification; emitted event schemas vs declared detail types; accessor type completeness; unresolved local export references; part/exportparts reachability; canonical attribute/property mapping. Emit source locations, not just counts.
3. Use explicit, reviewed exception entries with reasons for native notifications, child-owned state, forwarded events, dynamic/application-defined parts, external types, and examples with intentionally unavailable controls. `api-control-targets.mjs:1–15` is already a good narrow exception model, and `api-control-metadata.mjs:118–119` rejects stale exclusions. It must remain fixture metadata rather than become a second API inventory.
4. Share a semantic browser contract harness across eligible families: one event, tentative property/form reads, late veto, silent equal-value author write, accepted/canceled nested work, constraint mutation, grouping ownership, disabled/read-only behavior, and hydration. Use family adapters for interaction/values. Preserve custom composition/ProseMirror/native-disclosure tests instead of flattening them into one base class.
5. Diff a canonical public API snapshot in PRs, supplemented with CEM + type API changes. Mark unresolved evidence as requiring review; don't auto-classify type-only or event-description-only edits as behaviorally harmless without scope-specific evidence. Use targeted browser/SSR/consumer tests selected by the public/dependency graph.

The following registration/SSR/Parts findings were independently traced by the registration subaudit. Its isolated Node probes used existing dist, with source inspection confirming the relevant implementation; no build or browser suite was run.


## T9 — Validate Parts reachability, including subclass replacements and forwarded parts (confirmed drift)

**Current disposition — fixed for this case: color-slider label and error reach are repaired. The reusable rendered Part helper and conditional/subclass/multiple-boundary fixtures detect this drift. API-10 now adds all 77 catalog components in three browser engines; see the completion record. Original evidence follows.**

`en-color-slider` advertises inherited `editor-label` and `error` Parts in its generated public metadata: `packages/elements/custom-elements.json:11409` and `:11441`. Neither is exposed by its exact-value editor:

- `packages/elements/src/slider/template.ts:40–47` places `editor-label` only in the default editor branch; supplying a replacement removes that entire branch.
- `packages/elements/src/color-slider.ts:85–101` supplies a replacement `en-text-field`; line 87 forwards only `control:editor`, while line 89 passes error text into that child.
- `packages/elements/src/slider/index.ts:204–209` explicitly empties `editorError` when the replacement exists, suppressing the base `part="error"` branch at `slider/template.ts:51`.
- A read-only render of `<en-color-slider editable>` found zero `part="editor-label"` and only `exportparts="control:editor"`.

Practical effect: consumer `en-color-slider::part(editor-label)` and `::part(error)` styles cannot reach the advertised surfaces. This is a metadata/template contract gap, not a reason to assume all inherited surfaces should be copied. The private child also renders its own label/error, but they are beyond another shadow boundary.

Repeated-workflow opportunity: a Parts contract checker should resolve inherited/substituted templates and `exportparts` edges, then exercise explicit fixtures for conditional states. Static literal inventory alone is insufficient. Either intentionally forward/alias these two surfaces or allow explicit metadata inheritance exclusions; enforce the chosen contract.

## T10 — Add SSR/client presentation parity fixtures for coordinated children (confirmed first-paint drift)

**API-09 resolution, 2026-09-19:** Initial authored/data reorder presentation and hydration parity are implemented. Form/selection adapters now share internal buffered-projection utilities while retaining their validation and slot rules. See [completion record](../api-09-context.md). Original audit evidence follows.

A child-authored reorderable tree loses its reorderable presentation at SSR first paint, while an equivalent data-backed tree includes it.

- `packages/ssr/src/tree-adapter.ts:60–63` snapshots tree selection/expansion but omits `reorderable`.
- `packages/ssr/src/tree-adapter.ts:67–74` captures item value/label/disabled/branch/size and prepares only `TreeItemPresentation`.
- Browser coordination propagates parent reorderability at `packages/elements/src/tree/interaction-controller.ts:149`.
- `packages/elements/src/tree-item/template.ts:16` gates `aria-keyshortcuts="Alt+M"`; line 26 gates `part="drag-handle"` on that state.

Reproduction using registered existing packages and `renderToString`:

```
<en-tree reorderable><en-tree-item value="one" label="One"></en-tree-item></en-tree>
=> drag handles 0, Alt+M shortcuts 0

<en-tree reorderable .items=${[{value:'one',label:'One'}]}></en-tree>
=> drag handles 1, Alt+M shortcuts 1
```

Scope: initial visible/accessibility/Parts markup parity; this does not claim reorder interactions work without JavaScript. The SSR README documents JavaScript-dependent interaction, but does not declare omission of child reorderable markup. A shared small state-matrix fixture can compare equivalent authored/data modes before hydration and after coordination; it should retain documented unsupported cases.

The adapter code itself also has repeated scaffolding: `packages/ssr/src/form-children-adapter.ts:128` and `selection-children-adapter.ts:129` begin effectively identical restore/context-copy/traversal/text/existing-slot/escaping/edit helpers. A small internal buffered-projection utility could centralize these without merging component-specific validation/capture contracts.

## T11 — Make component definitions a single reusable graph (confirmed repetition, no current missing registration)

**API-09 resolution, 2026-09-19:** All 77 roots now live in `src/definitions/*.ts`; the catalog and individual registration wrappers consume those same objects. Static metadata/docs readers and graph validation cover the new structure, and existing selective dependency closures are preserved. See [completion record](../api-09-context.md). Original audit evidence follows.

`packages/elements/src/catalog.ts:81–158` and all 77 `src/define/*.ts` independently encode tag/constructor/dependency definitions. Deep graphs are manually repeated: compare `catalog.ts:153–156`, `define/color-plane.ts:5`, `define/color-picker.ts:10`, and `define/color-slider.ts:4`. Adding a nested dependency currently requires maintaining several copies.

Read-only normalization found 77 catalog roots and 77 define files. Constructor/tag mappings agree. Dependencies agree except:

- Color picker ordering differs but dependency closure is equivalent; not a bug.
- `catalog.ts:107` includes menu-item while `define/menu.ts:3` does not. This is intentional: `src/menu/README.md:21–22` imports both define modules; line 105 explicitly requires registering both tags.

Static inspection of owned `<en-*>` tags across component source and templates found no missing dependency in catalog closures. All catalog constructors are represented in `src/index.ts`.

Recommendation: independent per-component definition modules composed into catalog and define wrappers, or generation from one graph, plus a read-only parity check. Preserve explicit authored-child policy (menu) rather than enforcing blanket identical dependency closures. Keep the side-effect-only define wrappers; do not make the normal class barrel register global elements.

Inventory correction: this checkout has no `register/*.ts`, `exports/index.ts`, or Parts constant modules. Actual surfaces are `src/catalog.ts`, `src/define/*.ts`, `src/index.ts`, `@csspart` annotations, and literal/dynamic `part` / `exportparts` attributes.

## T12 — Decide package export boundaries before enforcing an API inventory (confirmed exposed paths; release policy decision)

`packages/elements/package.json:19–22` maps `./*.js` to `./dist/*.js`; wildcard matches nested segments. These real imports succeeded in a read-only Node probe after the SSR shim:

```
@en-reve/elements/internal/en-element.js -> EnElement
@en-reve/elements/forms-private/editable-field.js -> EditableFieldElement
```

This makes documented-private implementation paths importable even though `tooling/metadata/README.md:80–83` warns that source paths are not a promise to expose internal paths. Package remains `private: true` at `package.json:4`, so classify this as an explicit staging/release decision, not a published breaking defect.

A public-entrypoint allowlist can drive package exports/API checks and preserve documented component/define/catalog entrypoints. First resolve whether unrestricted deep imports are intentionally supported; mechanically narrowing them now could break existing local consumers. CEM source-module names alone should not be used as the package API inventory.

## Intentional exceptions checked

SSR docs explicitly exclude scoped custom-element registries, streaming, unsupported authored projection metadata, forwarded structural tree slots, recursive breadcrumb finalization, and full ElementInternals form submission before upgrade. Ordinary slotted tabs/radios/accordions rely on authored initial child state rather than a missing generic adapter. Those are not findings. Current selection/form adapter capture fields inspected align with their canonical rendering inputs.
