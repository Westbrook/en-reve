# Collections and content API normalization audit

Read-only source audit. No runtime, documentation, report-state, git, or publishing mutations were made in the repository. Findings describe the current contract, not implemented changes. File paths below are repository-relative to `the repository`; line numbers were verified against the working tree.

## Coverage

Inspected: `en-table`, `en-data-table`, `en-tree` (the actual catalog name; there is no `en-tree-view`), `en-tree-item`, `en-carousel`, `en-carousel-slide`, `en-activity-feed`, and the exported `VirtualCollection`, `VirtualCollectionController`, `TableModel`, table templates and scroll-options helper. The related content subset covers `en-activity-item`, `en-presence`, `en-presence-group`, `en-card`, `en-alert`, `en-chat-message`, `en-progress-bar`, `en-progress-steps`, `en-progress-step`, `en-skeleton`, `en-avatar`, `en-badge`, `en-spinner`, and `en-stack`, plus native/Lit list and empty-state recipes. Catalog evidence: `packages/elements/src/catalog.ts:82–123` and `:102–103`; lists/empty states are recipe exports, not standalone custom elements (`packages/primitives/src/templates/content.ts:82`, `:128`). `VirtualCollection` is an exported helper, not a catalog element (`packages/primitives/src/state/virtual-collection.ts:70`).

Inspection included public properties and attribute mappings, key/selection vocabulary, authored/data content modes, render callbacks, events and async lifecycle, imperative navigation, Parts and CSS custom-property contracts. Tests were not run because this is a static documentation-only audit; no runtime defect is claimed solely from a naming difference.

## C01 — Collection identity and selection use several vocabularies

**Classification/confidence:** confirmed vocabulary inconsistency; high. **Decision priority:** medium; broad migration surface.

**Evidence on both sides:** `TreeDataItem.value` is the stable identity (`packages/primitives/src/interactions/tree.ts:138–146`); authored `en-tree-item.value` explicitly means a unique key (`packages/elements/src/tree-item/element.ts:41–49`). Tree selection uses `value`, `values`, and `expanded` (`packages/elements/src/tree/element.ts:160–186`). Data-table uses `getKey` defaulting to `item.id`, and `selectedKeys` (`packages/elements/src/data-table/element.ts:60–67`, `:94`, `:98–99`). Carousel/feed records instead require a literal `key` (`packages/elements/src/carousel.ts:10–14`; `packages/elements/src/activity-feed.ts:11–18`). Low-level collection options call their extraction callback `key` (`packages/primitives/src/state/virtual-collection.ts:3–6`).

**Assessment:** These all denote stable identity, but a consumer maps `value → key`, `values → selectedKeys`, and `key(callback) → getKey` when moving between collection APIs. Keep arbitrary-record extraction distinct from record fields; a callback is not a key string. Tree's first-selection `value` compatibility behavior must survive any aliasing.

**Preferred vocabulary:** `key` for record identity, `getKey(item)` for extraction, `selectedKey`/`selectedKeys` and `expandedKeys` for collection state. **Alternative:** retain tree's `value`/`values` to match value-oriented selection controls, but explicitly classify that as a compatibility vocabulary and document a collection mapping table.

**Migration impact:** High for tree data shapes, authored attributes, SSR snapshots and event snapshots; medium for helper options. Prefer additive aliases and explicit precedence rules over a direct rename. Documentation mapping is safe immediately; no evidence requires renaming form-style `value` APIs elsewhere.

## C02 — Stable-key validity is not portable across collections

**Classification/confidence:** confirmed validation-contract inconsistency; high. **Decision priority:** medium.

**Evidence on both sides:** Table records and the generic virtual collection reject non-string/duplicate keys but accept `''` (`packages/primitives/src/state/table.ts:46–51`; `packages/primitives/src/state/virtual-collection.ts:142–148`). Feed/carousel additionally reject empty strings (`packages/elements/src/activity-feed.ts:117`; `packages/elements/src/carousel.ts:95–98`). Tree rejects whitespace-only identities with `.trim()` (`packages/primitives/src/interactions/tree.ts:163–166`). Data-table selection likewise accepts empty-string members while tree multiple selection rejects them (`packages/elements/src/data-table/element.ts:98–99`; `packages/primitives/src/interactions/tree.ts:48–52`).

**Assessment:** Reusing a collection identity provider can succeed in a table and fail in another collection. Whitespace-only identifiers form a third contract. This is not necessarily a runtime bug; generic primitives may intentionally support every string, but that boundary is undocumented as a cross-family policy.

**Preferred vocabulary/policy:** Describe component keys as “unique, nonempty strings”; if whitespace-only is invalid, say “nonblank” and apply that rule without silently trimming opaque keys. **Alternative:** permit every unique string in generic primitives while documenting the stricter component constraints explicitly.

**Migration impact:** Tightening existing table validation would reject previously valid data, so treat it as breaking or use a warning/deprecation period. Aligning documentation/validator descriptions first has no runtime cost.

## C03 — The authored-content sentinel differs, despite the same `items` property

**Classification/confidence:** confirmed normalization inconsistency; high. **Decision priority:** medium.

**Evidence on both sides:** Tree uses `items: readonly TreeDataItem[] | undefined`; `undefined` restores slots and every array selects data mode (`packages/elements/src/tree/element.ts:143–154`). Feed uses the same rule and rejects non-array non-undefined input (`packages/elements/src/activity-feed.ts:60–65`). Carousel accepts null and undefined, normalizes both to null, and returns null from its getter (`packages/elements/src/carousel.ts:91–100`, `:117`, `:145`). Data-table is intentionally data-only (`packages/elements/src/data-table/element.ts:15–19`, `:60–61`), with a separate `en-table` authored wrapper (`packages/elements/src/table/element.ts:9–13`).

**Assessment:** A generic wrapper cannot round-trip “authored mode” through all three hybrid components without special casing. Empty arrays consistently mean an empty data collection and should remain distinct from authored content. The separate table facade is deliberate and should not be collapsed merely for naming uniformity.

**Preferred vocabulary:** `items === undefined` means authored mode; `[]` means empty data mode. **Alternative:** use null consistently for all hybrid components. Document whichever sentinel is canonical, and accept the other as a compatibility input if desired.

**Migration impact:** Input acceptance can be additive, but changing carousel's getter from null to undefined affects equality checks and types. Preserve current getter until a breaking boundary or add an explicit content-mode API; avoid implicitly converting a data-only table into a hybrid.

## C04 — Delivery/rendering modes share semantics but not names

**Classification/confidence:** confirmed vocabulary inconsistency with intentional capability differences; high. **Decision priority:** medium.

**Evidence on both sides:** Table modes are `windowed | paginated | all` (`packages/primitives/src/state/table.ts:4`, `:45`), mapped through reflected `mode` and `page-size` (`packages/elements/src/data-table/element.ts:39–44`). Feed modes are `list | virtual | paged`, also reflected `mode` and `page-size` (`packages/elements/src/activity-feed.ts:58`, `:66–72`). Tree has a reflected Boolean `virtualize` (`packages/elements/src/tree/element.ts:49–58`, `:63–64`). Carousel distinguishes presentation using reflected `readingMode`/`reading-mode: carousel | list`; its list is paginated (`packages/elements/src/carousel.ts:53`, `:134–142`, `:601–609`).

**Assessment:** Feed `list` means all records, while carousel `list` means one page. `windowed` and `virtual` refer to the same broad omission strategy. Tree has no pagination capability; carousel's visual/list distinction is a different axis and should remain separate.

**Preferred vocabulary:** Use a shared rendering glossary `all`, `paginated`, `virtual` for delivery; reserve `readingMode` for a semantic presentation alternative. **Alternative:** adopt `all`, `paginated`, `windowed` if that matches the established primitive name, while documenting `virtualize` as the Boolean equivalent. Do not force unsupported enum members onto tree or merge carousel's reading mode into delivery mode.

**Migration impact:** Existing attribute values appear in markup, SSR, tests and saved app settings. Introduce accepted aliases before changing canonical reflection; a docs equivalence table is low risk.

## C05 — `en-page-change` has incompatible payload and transaction timing

**Classification/confidence:** confirmed event-contract inconsistency; high. **Decision priority:** high.

**Evidence on both sides:** Data-table calls `propose('page', ..., 'en-page-change', 'pagination')` (`packages/elements/src/data-table/element.ts:160–161`), which uses `dispatchChange` and stages page state before the event (`:118–124`; shared dispatcher `packages/primitives/src/interactions/events.ts:48–52`, `:75–81`). The shared detail is `{previous, proposed, reason}` (`packages/primitives/src/interactions/events.ts:1–5`). Feed's `goToPage()` dispatches the same event name with `{previous, page}` before assigning its page, and returns false for cancellation/supersession (`packages/elements/src/activity-feed.ts:183–184`). The docs describe this feed-specific shape (`apps/docs/src/api-reference/presence-activity.ts:55`).

**Assessment:** A shared page-change listener cannot read the proposed page or current property state consistently. Both APIs correctly allow synchronous vetoes and authoritative writes, but they implement different observable contracts. This is stronger than cosmetic event naming.

**Preferred vocabulary/contract:** `en-page-change` uses `ChangeDetail<number, 'pagination'>` everywhere, including tentative-state and authoritative-write rules. **Alternative:** retain a pre-mutation request event, give it an explicit request name, and preserve the old feed event as a compatibility alias.

**Migration impact:** Renaming `page` to `proposed` breaks listeners; adding `proposed`/`reason` as compatibility fields is additive, but staging timing still changes observable behavior and requires focused regression coverage when implemented. Dual event dispatch must not create two independent default actions.

## C06 — `en-load` means a request in activity-feed and a lifecycle notification in tree

**Classification/confidence:** confirmed event/async-lifecycle inconsistency; high. **Decision priority:** high.

**Evidence on both sides:** Feed defines `ActivityLoadDetail` with `cursor`, `signal`, `complete(page)` and `fail(message)` (`packages/elements/src/activity-feed.ts:21–27`) and dispatches cancelable `en-load` to initiate application work (`:165–179`); it also exposes `cancelLoad()` (`:181–182`). Tree accepts a `loadChildren(context)` callback returning data or a promise (`packages/primitives/src/interactions/tree-operations.ts:64–66`; `packages/elements/src/tree/element.ts:117–127`). Its `en-load` is a noncancelable `{key,status,requestId}` notification emitted for loading, success/empty, error and cancellation-to-idle (`packages/elements/src/tree/lazy-controller.ts:21–32`, `:43–61`).

**Assessment:** Canceling `en-load` prevents feed transport but cannot cancel tree loading. Feed has a start-request event without a corresponding result notification; tree has lifecycle notifications with a separately supplied loader. Tree's concurrent branch leases and feed's single older-page lease are meaningful domain differences and need not share identical loader signatures.

**Preferred vocabulary:** Separate `en-load-request` from `en-load-state-change`; document a common lifecycle vocabulary (`loading`, `loaded`, `empty`, `error`, `idle` after cancellation) and request ownership. **Alternative:** standardize property callbacks for transport and reserve `en-load` for notifications across both. Keep branch/page-specific context types.

**Migration impact:** Event-name and async adapter changes are substantial. Add typed aliases/compatibility adapters first, preserve abort/stale-result guarantees, and define whether programmatic cancellation emits a state event. Do not mistake callback acceptance for completed loading; tree `loadBranch()` resolves completion whereas feed `requestOlder()` returns request acceptance.

## C07 — Keyed reveal and navigation need distinct names, but Boolean results are ambiguous

**Classification/confidence:** intentional semantic distinction plus documentation gap; high. **Decision priority:** medium.

**Evidence on both sides:** Tree `scrollToKey` reveals expanded-visible data without changing selection, expansion or focus (`packages/elements/src/tree/element.ts:156–158`). Data-table exposes the same method/options and opens a containing page (`packages/elements/src/data-table/element.ts:107–111`), and feed likewise accepts shared `ScrollToKeyOptions` (`packages/elements/src/activity-feed.ts:185–191`). The option type extends platform `ScrollIntoViewOptions` (`packages/primitives/src/interactions/scroll-into-view.ts:1–4`). Carousel's `goToKey` instead invokes a cancelable index change, accepts no scroll-options bag, and returns true whenever the key exists—even if the transaction is canceled (`packages/elements/src/carousel.ts:486–505`). Feed's eventful `goToPage` returns false on cancellation (`packages/elements/src/activity-feed.ts:183–184`).

**Assessment:** Do not rename carousel navigation to `scrollToKey`: it changes semantic current position and participates in a cancelable event, whereas reveal is selection/focus neutral. However, `goToKey(): boolean` and `goToPage(): boolean` report different notions of success. A consumer can infer the wrong outcome from a true carousel result.

**Preferred vocabulary:** Preserve `scrollToKey` for reveal and `goToKey`/`goToPage` for semantic navigation; define eventful Boolean results as accepted/committed, or expose an explicit `ChangeOutcome`. **Alternative:** retain carousel's Boolean as “key found,” document that clearly, and provide a separate outcome-bearing method when needed.

**Migration impact:** Documentation clarification is safe. Changing the existing Boolean meaning can break application flow despite leaving types unchanged; expose an additive outcome method or schedule the behavior change explicitly. Do not promise synchronous scroll completion from reveal methods.

## C08 — Authored/data render contracts deliberately preserve different ownership boundaries

**Classification/confidence:** intentional difference; high. **Decision priority:** document and retain.

**Evidence on both sides:** Tree data is a validated plain-text schema (`packages/primitives/src/interactions/tree.ts:138–146`, `:163–170`), rendered as text into the label span (`packages/elements/src/tree/data-template.ts:56–67`). Authored tree items offer `label`, `prefix`, `suffix`, and `children` slots with noninteractive-content restrictions (`packages/elements/src/tree-item/element.ts:13–19`). Feed `renderItem(item,index)` supplies content within the managed `en-activity-item`, including that item's slots (`packages/elements/src/activity-feed.ts:65`, `:202–204`). Carousel's callback supplies content but must not return an `en-carousel-slide` wrapper (`packages/elements/src/carousel.ts:134–135`, `:627–634`). Table's `renderCell(item,index)` supplies content inside generated native `th`/`td` (`packages/primitives/src/templates/table.ts:8–9`, `:46–49`).

**Assessment:** All callbacks follow “application content, component semantic wrapper,” but the tree data path intentionally has no rich renderer. Adding one solely for parity could introduce interactive descendants and compromise tree keyboard semantics. The content the callback is allowed to own should be stated alongside its name, not inferred from `unknown` return types.

**Preferred vocabulary:** Retain `renderItem` and `renderCell` according to granularity; document the wrapper and allowed slots for each. Label the tree APIs “plain data labels” versus “authored rich noninteractive labels.” **Alternative:** add an explicitly constrained `renderLabel` to tree only if there is an independently justified product requirement.

**Migration impact:** Documentation-only normalization is safe. A generic “renderItem everywhere” migration would be inappropriate; keep tree schema validation, SSR guarantees and authored-content accessibility restrictions.

## C09 — `metadata` promises generic content but activity owns a timestamp wrapper

**Classification/confidence:** confirmed content-contract mismatch with a documentation ambiguity; high on source behavior, medium on preferred structural change. **Decision priority:** medium.

**Evidence on both sides:** Chat declares `metadata` as authored time and other message context, and places it in a generic span (`packages/elements/src/chat-message/element.ts:11`, `:41`); the chat guide authors `<time slot="metadata">` (`apps/docs/src/api-reference/chat.ts:4–8`). Activity declares the same slot as “Time label or other metadata” (`packages/elements/src/activity-item.ts:11`), but always projects it inside its own `<time part="time" datetime=...>` (`:39`), alongside `datetime` and `timeLabel` convenience properties (`:28`, `:33–34`).

**Assessment:** Moving a chat metadata fragment to activity places an authored `<time>` within the component's time wrapper; moving arbitrary context gives it timestamp-wrapper semantics. The common slot name and broad description obscure the ownership difference. A convenience timestamp is useful, but it should not imply that all metadata is time.

**Preferred vocabulary/contract:** `metadata` means generic authored context; activity uses a generic metadata wrapper with a component-owned native `<time>` as fallback for `datetime`/`timeLabel`. Preserve the `time` Part on that fallback and expose a `metadata` Part if useful. **Alternative:** explicitly narrow activity's existing slot to visible timestamp text and document the difference; add a generic metadata region later.

**Migration impact:** Changing the wrapper affects semantics and styling, so retain Part compatibility where possible. Documentation clarification is nonbreaking. Consumers relying on activity's datetime wrapper must keep its timestamp fallback or author their own time element.

## C10 — “Decorative” slot descriptions imply inconsistent accessibility ownership

**Classification/confidence:** documentation gap with a confirmed rendered difference; high on behavior, medium on whether to change badge. **Decision priority:** medium.

**Evidence on both sides:** Badge describes `prefix` as a decorative indicator (`packages/elements/src/badge/element.ts:12–14`) but projects it without `aria-hidden` (`packages/elements/src/badge/template.ts:5`). Alert describes a decorative icon and hides that entire region (`packages/elements/src/alert/element.ts:19`; `packages/elements/src/alert/template.ts:15`). Activity's decorative avatar is also component-hidden (`packages/elements/src/activity-item.ts:10`, `:39`), as is presence's avatar (`packages/elements/src/presence.ts:8`, `:42`). Chat deliberately allows a decorative **or labeled** avatar and does not hide it (`packages/elements/src/chat-message/element.ts:10`, `:41`).

**Assessment:** Consumers cannot tell whether “decorative” is a guarantee implemented by the component or an obligation they must implement in their slotted markup. Badge prefix text or a named image remains exposed. Do not turn this into blanket avatar suppression: chat's broader authored contract is intentional.

**Preferred vocabulary/contract:** Use “decorative” for component-hidden content; otherwise state that authored alternatives are application-owned. Resolve badge by either hiding its prefix or clarifying its responsibility contract. **Alternative:** transfer hiding responsibility to authors everywhere, but this is broader and less predictable.

**Migration impact:** Hiding badge prefix could remove meaningful prefix-only announcements, so verify that the badge's text carries its status before changing behavior. Clarifying the existing responsibility in docs is nonbreaking.

## C11 — An alert example relies on a nonexistent title slot

**Classification/confidence:** confirmed documentation/example defect; high. **Decision priority:** high, small scope.

**Evidence on both sides:** The multi-step demo authors `<span slot="title">The brief could not be saved</span>` inside `en-alert` (`apps/docs/src/multi-step-demo.ts:98`). Alert declares only default message and icon slots (`packages/elements/src/alert/element.ts:18–19`), and its template provides only those slots (`packages/elements/src/alert/template.ts:15–16`).

**Assessment:** The named title is unassigned and omitted from the rendered alert message. This is an API-use/documentation error, not justification to invent a new component slot. The remaining default text still renders, making the missing title easy to overlook.

**Preferred vocabulary/contract:** Keep alert's existing default body contract and author the heading in that default content. **Alternative:** design and document an explicit title slot if a separate title region is a real product requirement.

**Migration impact:** Correcting the example is nonbreaking and restores its intended text; adding a new slot would require separate design and accessibility review. No runtime change is needed to address the current example defect.

## C12 — Default content Parts use `body` and `content`; retain compatibility if aligning

**Classification/confidence:** confirmed vocabulary difference; intentional/low priority rather than a functional defect. High confidence. **Decision priority:** low.

**Evidence on both sides:** Card wraps its default slot in `part="body"` (`packages/elements/src/card/template.ts:14`; public annotation `packages/elements/src/card/element.ts:21`). Chat, activity and alert use `part="content"` for their default body/message slots (`packages/elements/src/chat-message/element.ts:42`; `packages/elements/src/activity-item.ts:40`; `packages/elements/src/alert/template.ts:16`). Table's `body` means native tbody instead (`packages/elements/src/data-table/element.ts:25`, `:157`).

**Assessment:** Styling adapters need a card-specific selector for the same broad default-content region. However, table's body is structurally specific and should retain its native vocabulary. A breaking rename delivers little value.

**Preferred vocabulary:** `content` for a generic default content region; if adopted, add it as a second card Part token while retaining `body`. **Alternative:** keep card `body` as a domain term and document the Part mapping. Do not normalize every occurrence of `body` across the library.

**Migration impact:** An additive Part alias is compatible; deleting `body` would break consumer CSS and should be avoided absent a major version plan. Documentation alignment alone is safe.

## Cross-family verification and intentional differences

- Attribute/property mappings were checked: public multiword labels/settings generally have explicit kebab-case attributes (`pageSize/page-size`, `readingMode/reading-mode`, `hasMore/has-more`, `timeLabel/time-label`); callback/array APIs are property-only. No additional attribute-mapping defect was established in this subset.
- All documented Parts in the content subset were found in their rendered templates. Full-theme reset registry omissions for `--en-chat-*` and `--en-progress-steps-gap` are cross-references to the styles audit, not additional findings here. Supporting evidence: `packages/elements/src/chat-message/element.ts:21–26`, `packages/elements/src/progress-steps/element.ts:32`, finite registry `packages/tokens/src/overrides.ts:2–53`, reset emitter `packages/tokens/src/css.ts:17–19`.
- Progress-steps invalid-array filtering versus strict authored-child validation is cross-referenced to the editors audit, which owns that family: `packages/elements/src/progress-steps/element.ts:71–74` versus `packages/primitives/src/interactions/form-children.ts:51–60`, `:191–193`. The content-list recipe independently rejects duplicate/empty keys (`packages/primitives/src/templates/content.ts:86–90`).
- Preserve deliberate status differences: numeric task progress is not a live region (`packages/elements/src/progress-bar/element.ts:7–8`; `packages/elements/src/progress-bar/template.ts:11–17`); skeleton is decorative (`packages/elements/src/skeleton/element.ts:7`; template `:4`); spinner's label enables status (`packages/elements/src/spinner/element.ts:7–8`, `:16`; template `:4–5`); alert's persistent message is polite status (`packages/elements/src/alert/template.ts:16`). These do not warrant a universal `status` or `loading` API.
- Preserve contextual naming: standalone avatar uses `name` for identity and becomes decorative without it (`packages/elements/src/avatar/element.ts:25–26`; template `:17–23`); chat article label falls back to author (`packages/elements/src/chat-message/element.ts:33–40`), while activity label is an optional action summary (`packages/elements/src/activity-item.ts:32`, `:38`). `en-stack` is layout rather than a list abstraction (`packages/elements/src/stack/element.ts:7–11`; template `:11–20`).
- Virtualization control parity remains a documentation consideration, not a proven defect: data-table exposes `invalidateMeasurements`, `pin`, and `unpin` (`packages/elements/src/data-table/element.ts:113–117`); feed forwards only measurement invalidation (`packages/elements/src/activity-feed.ts:193–194`); tree encapsulates the controller (`packages/elements/src/tree/element.ts:72`; `packages/elements/src/tree/data-controller.ts:18–40`). Do not expose every primitive method solely for symmetry; evaluate actual overlay/geometry requirements.

## Suggested documentation-phase ordering

1. Resolve shared event semantics (C05/C06) and the alert example defect (C11).
2. Record canonical identity, authored sentinel and delivery glossary decisions before proposing aliases (C01–C04).
3. Clarify navigation results and slot ownership (C07/C09/C10).
4. Preserve authored/data semantic boundaries (C08); treat Parts aliases as optional compatibility work (C12).

Detailed delegated content notes are preserved at `/private/tmp/api-audit-content-subset.md` for supporting evidence and coverage.

## Supplemental icon coverage

The root review also inspected `en-icon` (`packages/elements/src/icon/element.ts:8`, `packages/elements/src/icon/template.ts:31`). Its optional `label` supplies an accessible image name; absent label is decorative, consistent with the explicit ownership approach described in C10. `en-avatar.name` also feeds initials, so it is intentionally more than an accessible-label synonym (`packages/elements/src/avatar/template.ts:13`). Both expose `base` and use shared media sizing hooks (`packages/styles/src/feedback.ts:45–50`). No icon-specific normalization change is proposed. Missing slots or interaction events on this noninteractive icon are not defects.
