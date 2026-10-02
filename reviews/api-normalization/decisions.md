# Decision register

The decision rationale remains **proposed / awaiting discussion**, except where separately authorized work is noted. Status tracks implementation of each decision group, including overlapping theme work; it does not imply approval of the full proposal. Related evidence across family reports is grouped here to avoid counting the same problem repeatedly.

**Status:** Not started means implementation has not begun. Active means some implementation or verification is underway, with remaining scope noted. Ready locally means implementation and local verification are complete but unpublished. Partially published means a subset is on the review site while broader work remains. Published means the full tracked scope is available for review, not user approval. Last reconciled September 19, 2026; the findings below retain their original audit context.

| ID | Priority | Status | Decision | Preferred direction | Alternatives to weigh | Primary evidence |
| --- | --- | --- | --- | --- | --- | --- |
| API-01 | P1 — High | Published | Event phase, detail and lifecycle vocabulary | Preserve tentative `ChangeDetail` proposals; separate application requests from noncancelable async status. Require documented terminal paths. | Keep family-specific request APIs with typed adapters; add no presentation notifications unless consumers need them. | [C05](#C05), [C06](#C06), [OVL-05](#OVL-05), [OVL-11](#OVL-11), [OVL-12](#OVL-12), [E9](#E9), [N3](#N3), [T1](#T1), [T2](#T2) |
| API-02 | P1 — High | Published | Consistent transaction and interruption guarantees | Use shared author-write/nested-acceptance precedence, callback cleanup and post-callback eligibility checks. Reproduce each suspect edge first. | Explicitly reject unsupported reentrancy rather than silently overwriting, but that is less composable. | [E3](#E3), [E4](#E4), [FORMS-06](#FORMS-06), [FORMS-13](#FORMS-13), [OVL-01](#OVL-01), [OVL-02](#OVL-02), [OVL-03](#OVL-03), [OVL-04](#OVL-04), [OVL-09](#OVL-09), [N2](#N2) |
| API-03 | P1 — High | Published | Form live state, defaults and validation facade | Explicit default/live separation; shared form introspection; application `error` distinct from localized constraint messages. | Initial-render defaults everywhere; current-attribute defaults everywhere; documented limited validation subset. | [FORMS-01](#FORMS-01), [FORMS-02](#FORMS-02) |
| API-04 | P2 — Medium | Published — [contract and migration notes](../api-04-collections.md) | Collection keys, authored sentinel and delivery modes | Key/getKey vocabulary, `undefined` authored mode, explicit all/paginated/virtual glossary; preserve semantic reading mode separately. | Keep tree value/values compatibility vocabulary; choose windowed instead of virtual; allow stricter keys only at component layer. | [C01](#C01), [C02](#C02), [C03](#C03), [C04](#C04), [N1](#N1) |
| API-05 | P2 — Medium | Published — [contract and migration notes](../api-05-outcomes.md) | Common editor/focus/navigation results and payload ownership | Preserve focus options; accepted-document projection plus explicit drafts; distinguish reveal, navigation, request acceptance and completion. | Keep found-only Boolean results or borrowed action data with explicit types/documentation; readiness can remain separate. | [E1](#E1), [E2](#E2), [E10](#E10), [C07](#C07), [OVL-06](#OVL-06) |
| API-06 | P2 — Medium | Published — canonical prerelease implementation verified and integrated into main. | Semantic Parts, slots and nested customization reach | One canonical name per equivalent role; scoped forwarding and host/native distinctions. Slots retained and authoritative over attribute/property fallbacks. | Accepted prerelease direction supersedes compatibility-only aliases. | [Contract and migration](../api-06-customization.md); CSS-08–10, E6, OVL-10, FORMS-04–05, C09, C12, N4. |
| API-07 | P1 — High | Published — The cited CSS-01–CSS-07 repairs are implemented through THEME-01–06 or explicitly retained specialized contracts. No additional sizing defect was confirmed; new capabilities require a separate proposal. | Shared themes, sizing, option paint and target floors | Carry established foundation/field/option/size contracts to late components; make registry reset coverage source-checkable. | Deliberate family exceptions with a precedence table. Preserve reviewed calendar ranges and intentional broad pins. | [CSS-01](#CSS-01), [CSS-02](#CSS-02), [CSS-03](#CSS-03), [CSS-04](#CSS-04), [CSS-05](#CSS-05), [CSS-06](#CSS-06), [CSS-07](#CSS-07) |
| API-08 | P2 — Medium | Published — [contract and examples](../api-08-localization.md); localization and description contracts verified | Localization, descriptions and accessible content ownership | Consistent simple label attributes and slots; typed message groups for complex editors; associated option descriptions. | Individual attributes per string; documented slot-only content where rich ownership matters. | [FORMS-04](#FORMS-04), [FORMS-08](#FORMS-08), [FORMS-12](#FORMS-12), [E7](#E7), [E8](#E8), [OVL-09](#OVL-09), [C10](#C10) |
| API-09 | P2 — Medium | Published — [composition contract and finding closure](../api-09-context.md); all original API-09 implementation work complete, user review remains separate | Cross-component composition and authoring parity | Capability-based associations, owning-registry upgrade handling, equivalent validation for authored/data paths, one dependency graph. | Keep native-anchor-only navigation and plain tree data as documented boundaries; do not inspect private shadow DOM. | [E5](#E5), [N1](#N1), [C08](#C08), [OVL-03](#OVL-03), [OVL-14](#OVL-14), [T10](#T10), [T11](#T11) |
| API-10 | P1 — High | Published — [full contract and finding closure](../api-10-completion.md); supplemental types, unified graph, event enforcement, catalog Parts and supported-entry policy are complete. Human review remains separate. | Which surfaces are public and how they are checked | One source-backed API graph plus supplemental type snapshot, reachable Parts, typed events, truthful docs and declared exceptions. | A smaller annotation cleanup first; source checksum alone remains insufficient as an extraction-policy check. | [T1](#T1), [T2](#T2), [T3](#T3), [T4](#T4), [T5](#T5), [T6](#T6), [T7](#T7), [T8](#T8), [T9](#T9), [T10](#T10), [T11](#T11), [T12](#T12), [FORMS-03](#FORMS-03), [FORMS-07](#FORMS-07), [FORMS-09](#FORMS-09), [FORMS-10](#FORMS-10), [FORMS-11](#FORMS-11), [FORMS-14](#FORMS-14), [FORMS-15](#FORMS-15), [E9](#E9), [OVL-13](#OVL-13), [C11](#C11) |

**Priority is a proposed review order, not defect severity, implementation scheduling or approval:** P1 — High covers foundational contracts and existing shared promises; P2 — Medium covers the next normalization decisions. Equal priorities retain API-ID order. In the web review, activate the ID heading to switch between ascending and descending API-ID order, or the Priority heading to switch between highest and lowest priority first. Each evidence link opens its related finding.

## Duplicate evidence and ownership

- Lost color-slider editor-label/error exposure is one underlying issue: **FORMS-05** describes the promise, **CSS-08** covers composed styling/aliases, **T9** describes the missing reachability check. THEME-06 repaired error reach; the September 19 follow-up repaired label reach and added focused rendered regression coverage.
- Missing event types are a shared metadata problem: **T2** owns enforcement; **FORMS-03/07/09/14** and **E9** enumerate affected contracts. Do not rename correctly dispatched events to fix missing annotation types.
- Editor size/field/token customization is split across **CSS-02/03** (actual shared styling), **E6** (token renderer and discovered Parts) and **T4** (accessor extraction). These need coordinated acceptance, not duplicate blanket CSS fixes.
- The authored/data progress validity mismatch in **N1** is separate from the collection key-policy choice in **C02**, but both should use the chosen validity vocabulary.
- Tree initial authored reorder markup in **T10** is an SSR parity concern, not evidence that the data or hydrated reordering API is missing.

## Candidate low-ambiguity corrections

All original API-01–API-10 implementation groups are delivered. THEME-06/API-06 cover nested customization and canonical roles; API-08 supplies choice descriptions; API-10 supplies typed events, Parts enforcement and the public contract graph. The focused [implementation follow-up](/reviews/api-normalization/api-normalization-followup.md?progress-report) extends API-02 eligibility checks and reconciles regression coverage. User review remains separate.

API-10 defines supported package entries while preserving exposed implementation imports. The [combined API/theme migration record](/reviews/api-normalization/api-next-release.md?progress-report) carries delivered compatibility changes into the next package release. Manual qualification and optional additional capabilities remain separately tracked; they are not unfinished original normalization groups.

## API-01 authorized implementation

Implementation and regression verification are complete; this work is published for review. See [the contract and migration notes](../api-01-events.md). Data events retain CustomEvent; load requests add a typed response method, and TypeScript consumers use explicit handler signatures. Other API groups retain their recorded scope/status.

## API-02 authorized implementation

Transaction and interruption normalization is implemented, verified, integrated into main and published for review. See [the contract and migration notes](../api-02-transactions.md). User review remains separate.

## API-03 authorized implementation

Native-aligned form defaults and validation are implemented, verified, integrated into main and published for review. User review remains separate. See [the contract and migration notes](../api-03-forms.md).

## API-04 authorized implementation

Collection identity and selection aliases, canonical authored sentinel, shared delivery vocabulary, explicit component key validity and progress-data parity are implemented, verified, integrated into main and published for review. See [contract and migration notes](../api-04-collections.md) for compatibility and release boundaries. User review remains separate.

## API-05 authorized implementation

Editor focus/drafts/action snapshots and additive navigation/disclosure requests are implemented and published for review. The isolated full build and focused verification passed. See [contract and migration notes](../api-05-outcomes.md). User review remains separate.

## API-06 authorized implementation

Canonical prerelease Parts, slot ownership and renderer consistency are authorized. Existing slots remain public; assigned slot content always takes precedence over added attribute/property fallbacks. Compatibility-only aliases are removed instead of retained. See [contract and migration notes](../api-06-customization.md). Original family findings describe the pre-implementation audit and do not override these accepted decisions.

## API-09 implementation closure

The original E5, N1, C08, OVL-03, OVL-14, T10 and T11 scope is implemented or
explicitly retained with documentation. This includes the Context Protocol slice,
77 reusable definitions, static metadata/docs integration, and shared internal
SSR projection helpers. N1 and OVL-03 reuse the delivered API-04/API-02 fixes.
See [composition, registration and migration notes](../api-09-context.md) for the
finding-by-finding closure and verification record. Additional owner-family and
tooltip Context adoption, and the less-direct research backlog, remain separate
improvements. This publication completes delivery of the original implementation scope; user review remains separate.
