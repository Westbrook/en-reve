# Custom-element API normalization audit

Original audit context: **findings and recommendations for discussion, before normalization work was implemented.** All original API-01–API-10 implementation groups are now delivered. The [decision register](decisions.md), [implementation follow-up](/reviews/api-normalization/api-normalization-followup.md?progress-report) and [combined migration record](/reviews/api-normalization/api-next-release.md?progress-report) describe current contracts. Original findings remain as evidence; implementation and publication do not imply user acceptance.

This is the final consistency pass before the next documentation and integration phase. Its goal is transferable knowledge: learning a capability on one element should teach a consumer how to use the same capability elsewhere. Uniform spelling is useful only when the behavior, ownership, timing and customization boundary also match.

## Audit boundary

The audited runtime source is `4822ddcb82852fe4fac1094f7f720d7fd1e4bb50` (2026-09-18), after numeric input typography. The source-bound metadata check passed for **77 catalog elements and 364 production TypeScript sources**. The [inventory](inventory.md) lists every element; the [machine-readable snapshot](inventory.json) includes attributes, properties, methods, defaults, reflection, event annotations, CSS properties, Parts, slots and declaring sources.

Six parallel source reviews cover form controls, overlays/navigation, collections/content, editors/workflows, customization styles and supporting tooling. Recommendations were reconciled against the existing tentative-change contract and the authored/data ownership boundaries. The family reports contain paired source evidence, migration effects, alternatives and confidence. A source-backed behavioral concern is not a reproduced browser failure unless explicitly identified as such.

This is a bounded source audit, not a claim that every possible runtime discrepancy has been eliminated. CEM annotations alone omit some real runtime surfaces and include some implementation helpers; those differences are findings, not an excuse to treat the manifest as the entire API.

## Read the findings

- [Forms, selection, dates and color controls](forms.md)
- [Overlays, navigation and layout controls](overlays.md)
- [Collections and content](collections.md)
- [Editors, chat, toasts and progress workflows](editors.md)
- [CSS customization and theme propagation](styles.md)
- [Metadata, documentation and shared tooling](tooling.md)

Each finding has a stable family ID for review. Closely related findings across families describe different layers of the same issue; the decision groups below are the units to settle, rather than treating each mention as a separate change.

The [decision register](decisions.md) maps the findings to ten proposed decisions and identifies duplicate evidence. Start there when choosing implementation batches.

## Decisions to settle first

| Decision group | Current discrepancy | Recommended direction to review | Compatibility consideration |
| --- | --- | --- | --- |
| Request, state proposal and lifecycle events | `en-load` is a cancelable application request in the feed and a noncancelable status notification in the tree. `en-page-change` also has incompatible payload/timing. | Reserve explicit request names for application work; use state notifications for async outcomes. Keep semantic value proposals on the existing `ChangeDetail` transaction contract. | Renames, dispatch timing and cancellation are observable API changes. Preserve abort and stale-result guarantees; aliases must not cause two default actions. |
| Shared transaction behavior | Some newer components hand-code the proposal/rollback workflow instead of using the shared controller. | Apply the existing author-write and accepted-nested-transaction precedence rules consistently. | Correctness work should be reproduced with focused cases before changing behavior. Do not introduce a second committed event implicitly. |
| Form defaults and validation | Reset baseline, reflected configuration, custom errors and form introspection vary across form families. | Agree on live state versus default state, a common form facade and the distinction between application errors and localized constraint messages. | Reset and reflection changes can break applications even without renaming a property. Prefer explicit defaults and additive coverage. |
| Collection identity and modes | `value`/`values`, `key`, `getKey`, `selectedKeys`; `windowed`/`virtual`, `paged`/`paginated`; null versus undefined authored mode. | Use `key` for identity, `getKey` for extraction and an explicit rendering-mode glossary. Review whether tree's value vocabulary should retain compatibility aliases. | Do not rename all form values to keys or collapse selection-neutral reveal into semantic navigation. Empty arrays must remain empty data, not authored mode. |
| Method outcomes and focus | Similar navigation/request methods report found, accepted, committed or complete through superficially similar return types; focus forwarding varies. | State the outcome for each operation, forward `FocusOptions` where focus is the same capability, and share an outcome type where needed. | A Boolean semantic change is breaking even when TypeScript signatures stay unchanged. Async completion remains distinct from accepted request. |
| Customization vocabulary and forwarding | Comparable labels, fields, action areas and nested controls expose different or incomplete Parts, slots and fallback tokens. | Adopt a small semantic role vocabulary, preserve useful role-specific Parts, and forward the supported child surfaces across composites. | Prefer additive Part aliases and slot fallback support. A native input, wrapper and semantic content area are different surfaces and should not be forced under one name. |
| Early/late theme parity | Some later editors and color controls bypass shared size, field, focus or target-size mechanisms; the theme reset registry is incomplete. | Carry established size, token precedence, focus and target-size contracts into every applicable component; derive/check the customization registry. | Verify all inspired themes and scoped overrides when implementing. Do not add every private variable to the supported theme surface. |
| Localization and labels | Some actions/errors have fixed English text while siblings expose labels or messages; slot-only and attribute-plus-slot fallbacks differ. | Distinguish visible labels, accessible names, localizable guidance and application errors; use consistent fallback precedence for comparable content. | Do not replace rich authored slots with strings or promise that an accessible label is visible content. |
| Authored and data-backed parity | Descriptor validation, duplicate-key behavior and supported authored content vary. | Reuse validators and reconciliation where ownership matches; document intentional content restrictions and wrapper ownership. | A tree's plain data label is not an invitation for arbitrary interactive content. Preserve parent-owned semantics. |
| Public API truth and repeatable workflows | CEM, hand-written API docs, dispatch sites, exportparts, theme registries and tests can drift independently. | Build a source-backed contract map, a scoped exception registry and shared contract checks after the decisions are approved. | Metadata-only corrections are separate from runtime capability additions. A zero annotation count is not automatically a missing feature. |

## Existing contracts to preserve

- `en-change` is a synchronous, tentative, cancelable semantic proposal with readonly `{ previous, proposed, reason }`. Application writes and accepted nested transactions take authority. This is not a post-commit notification.
- `en-input` describes an editable draft/preview, and `en-action` requests an application-owned command. A request being accepted does not mean an upload, send or load completed.
- Programmatic authoritative assignments are generally silent. Do not mechanically add start/end events to assignments, or to every animation, merely to make event lists symmetric.
- A real asynchronous or gesture lifecycle should describe every observable terminal path: success, empty result where relevant, failure, cancellation, supersession and disconnection. Whether these are distinct events or typed states is a decision; balanced coverage matters more than an identical event count.
- Native `click` for links/buttons, string drafts for text-entry number fields, numeric values for scalar sliders, and submitted checkbox values separate from checked state are legitimate differences.
- Shared attributes should retain native HTML spelling where intentionally matching a platform API. Do not turn `readonly`, `inputmode` or `closedby` into arbitrary kebab-case alternatives just to match custom configuration attributes.
- A missing customization capability is different from a missing annotation, a differently named alias or an intentionally inaccessible internal detail. Each needs a different migration.

## Suggested review and implementation sequence

1. **Resolve contract ambiguity first:** load/request lifecycle, paging detail/timing, live/default form values, method outcomes and collection terminology.
2. **Repair promises that already exist:** transaction precedence, missing forwarded Parts, size/theme propagation, omitted metadata and incorrect documentation. Reproduce behavioral concerns before classifying the change as a fix.
3. **Add consistent capabilities:** validation/localization/label fallbacks, customization aliases and lifecycle observability where agreed.
4. **Migrate vocabulary:** add documented aliases or a deliberate breaking change, define precedence if old and new names coexist, and cover SSR, property writes, authored attributes and events together.
5. **Make consistency repeatable:** shared helpers only where behavior is equivalent, source/manifest/Part/token checks, and contract tests with an explicit exception list. Then resume the broader documentation and integration phase.

This ordering is a recommendation, not an implementation commitment. No feature has been renamed, deprecated, removed or added by this audit.

## Evidence and limitations

The retained manifest contains 667 attribute entries, 825 candidate public property entries, 238 candidate public method entries, 84 event annotations, 160 slot annotations, 502 Part annotations and 673 CSS-property annotations. These are occurrences including inheritance, not counts of unique contracts or defects.

The current receipt flags 44 untyped event entries, 411 undocumented public-member occurrences, 161 undescribed attributes and four attributes without extracted types. They are triage signals: lifecycle helpers may need a private/internal classification rather than new consumer documentation. Thirteen tags lack CSS-property annotations, which alone proves nothing about runtime styling support.

Checks for this phase: exact-source metadata freshness, full catalog inventory, paired source inspection, cross-family reconciliation, artifact/source-reference integrity and publication of the review document. This audit does not establish new browser, assistive-technology, physical-device, performance or release qualification. Existing user approvals and unresolved feedback remain attached to their original work in the independent Progress Report.
