# API normalization follow-up review — September 19, 2026

**Conclusion:** API-01–API-10 have delivered their original tracked implementation scope. A second broad normalization pass is not justified by this review. Plan one focused transaction-eligibility repair, reconcile known regression/test debt and status documentation, and carry the delivered breaking changes into the existing release and manual-qualification work.

Historical review checkpoint: this document records the pre-implementation findings. The user subsequently authorized implementation, integration into main and publication. See [implementation and disposition](api-normalization-followup.md). This audit is not evidence of user acceptance.

## Review boundary

Compared the original audit at `4822ddcb82852fe4fac1094f7f720d7fd1e4bb50` with current `main` at `31da6249825e6fc5db3dfea1131f27787463e575` and the [published decision register](https://en-reve-docs.reve-ai-0869.chatgpt.site/reviews/api-normalization?progress-report#decisions), read in the authenticated browser. The report records publication as Site 213. The shared checkout also contains two pre-existing comment/documentation edits; those are distinct from the published commit.

Reviewed the decision and migration records, relevant source/test paths, verification receipts, and unresolved Progress Report feedback. Browser verification in this review is limited to the focused connected token-editor reproduction below; historical cross-browser counts retain their original evidence scope.

## Original scope disposition

| Groups | Recent implementation | Assessment |
| --- | --- | --- |
| API-01 | Typed proposals, request/status separation, load response protocol and lifecycle documentation | Original scope delivered; acceptance versus completion and family reason vocabularies remain deliberate. |
| API-02 | Nested transaction ownership, picker cleanup, post-callback admission, live selection membership and pending toast handling | Original enumerated repairs delivered; broader eligibility promise has the focused gap below. |
| API-03 | Explicit live/default state, reset behavior, form facade and application errors | Original scope delivered; property-only initialization is intentionally no longer a reset baseline. |
| API-04 | Collection key aliases, authored sentinel, delivery vocabulary and strict component/progress validation | Original scope delivered; migration/release obligation remains. |
| API-05 | Accepted editor value versus draft, focus options, immutable action data and explicit navigation/request outcomes | Original scope delivered; legacy Boolean methods and distinct completion semantics are intentional. |
| API-06 | Canonical Parts, forwarded surfaces, slot precedence and renderer behavior | Original scope delivered; prerelease canonical names supersede compatibility-only aliases. |
| API-07 | Shared theme/size contracts and remaining interaction target floors | Original scope delivered or explicitly retained specialized behavior; stale geometry tests need reconciliation. |
| API-08 | Localizable labels/messages, slot fallbacks and accessible choice descriptions | Original scope delivered; broader application/domain localization is separate. |
| API-09 | Capability association, Context slice, canonical definitions and authored/data SSR parity | Original scope delivered; wider Context adoption remains a separate backlog. |
| API-10 | Unified public graph, supplemental types, typed event checks, rendered Parts and supported-entry policy | Original scope delivered; source metadata and named-state fixtures do not replace behavioral or manual qualification. |

## Recommended follow-ups

### REC-1 — Repair listener-time token-editor eligibility (high priority)

A connected `en-token-editor` accepts and commits `replaceSelection()` after its synchronous `en-change` listener sets `disabled = true` or `readOnly = true`. This contradicts [API-02's post-listener eligibility contract](api-02-transactions.md#contract).

The public method checks editability before the proposal (`packages/elements/src/token-editor/element.ts:104–107`), but the forwarded event at line 90 only propagates explicit `preventDefault()`. The rich editor already performs an eligibility guard (`packages/elements/src/rich-text-editor/element.ts:347`).

| Connected-browser scenario | Return | Result |
| --- | --- | --- |
| Disabled before the call | `false` | Empty value; no proposal |
| Disabled during the proposal | `true` | **Proposed value committed** |
| Read-only during the proposal | `true` | **Proposed value committed** |
| Disabled plus explicit veto | `false` | Empty value |
| Disabled plus authoritative value assignment | `false` | Author value retained |

Reproduced in the Codex in-app Chromium browser using source modules, plus current built modules in Node. Fixture: `artifacts/api-normalization-followup-review/transaction-probe.html`. This extends the original API-02 coverage; it does not invalidate the delivered rich-editor nesting or picker cleanup fixes.

**Exit condition:** recheck eligibility after callbacks, preserve authoritative writes and accepted nested edits, and add browser cases for replacement, undo/redo, disable/read-only/disconnect, veto and nested outcomes where applicable. Source/private-method inspection identifies shared fields, choices and numeric choices as candidates for the same matrix; reproduce their public user paths before classifying or fixing them.

### REC-2 — Restore a useful regression gate (medium priority)

The [API-07 receipt](api-07-target-floors.md#verification) records 12 pre-existing family-geometry failures. Current `family-geometry.spec.ts` still uses exact Part selectors and superseded shared-padding/segmented-frame expectations (lines 25, 67, 81). Reconcile assertions against accepted theme contracts and rerun; do not change runtime behavior merely to restore obsolete expectations.

Separately, [API-10 verification](api-10-verification.json) records a Chromium native-dialog focus-after-Tab failure that reproduces on the unchanged baseline. Give that failure a focused diagnosis and resolution; baseline provenance means it was not introduced by API-10, not that it needs no owner.

Make graph freshness, catalog Parts, shared event/transaction suites and affected family checks an exit criterion of the existing release/verification milestone, tied to one candidate revision. `npm run test:api` currently covers freshness, tooling and catalog Parts/tree checks; it does **not** invoke `probes/api-events` or `probes/api-transactions`. That limit is already documented. No checked-in CI/release hook was found; operational automation belongs to the existing verification work.

### REC-3 — Assemble the API/theme migration release record (before the next package release)

Private-site publication is not package release completion. Carry the changes into one classified release draft, preserving matching CEM, public-types and public-api artifacts on each side:

- API-03 reset/default semantics and validation behavior.
- API-04 carousel authored sentinel, key validity, progress validation and tree payload shapes.
- API-05 token-editor IME value semantics and immutable action snapshots.
- API-06 canonical Part/token renames and forwarding boundaries.
- API-07 newly connected target floors and existing theme precedence migration.
- API-09 removal of editor-trigger's implicit editor-backend registration.
- API-01 event migrations and API-10 supported versus exposed implementation imports.

Use the existing [release policy](../tooling/releases/README.md) and [theme migration record](theme-next-release.md). Runtime changes need authored classifications even when CEM is unchanged. Preserve unsupported deep-import exposure as documented; narrowing exports requires a separate migration decision.

### REC-4 — Reconcile current review guidance (medium priority)

Historical family findings should remain intact and clearly dated, but current continuation guidance is contradictory:

- `api-normalization-audit/decisions.md:32` still says choice descriptions and event/Part types need scheduling, while API-08/API-10 are published.
- The next paragraph still treats deep-import boundaries as a remaining proposed decision, despite API-10's delivered support policy.
- `api-normalization-audit/styles.md:83` labels alias preservation as the current disposition, conflicting with accepted API-06 canonical names.
- The published HTML overview and low-ambiguity paragraphs lag the completed register; Markdown and rendered HTML are maintained separately.
- The independent report's older top-level handoff and API status snapshot lag its newer API-09/API-10 completion records. This review adds a current checkpoint without discarding that history or acknowledging user review.

**Exit condition:** one unambiguous current closure summary with links to the accepted contracts and these follow-ups, preserved original audit evidence, and consistent rendered/Markdown/report status. Reconcile on the next documentation update; no new publication was performed for this review.

### Existing acceptance work — retain, do not duplicate

Keep [native theme validation](theme-native-validation.md) and the [component backlog](component-follow-up-backlog.md) visible: VoiceOver/Safari output, virtual-table traversal, physical iOS interactions, native Windows high contrast, real IME and native clipboard behavior. Automated reflow/text-enlargement coverage already exists. Publication and passing automated checks do not close user feedback or manual qualification.

## Optional later work

CONTEXT-2 owner discovery and CONTEXT-3 tooltip warmup are already separate improvements. CONTEXT-R1/R2/R3 remain research. Broader date/application localization, additional theme-authoring capabilities and new rendering/SSR boundaries need a concrete consumer requirement; they are not residual original audit defects. Preserve native-anchor navigation, plain tree data versus rich authored labels, property/type distinctions and domain-specific lifecycle semantics.

## Verification performed for this review

- `npm run test:tooling`: **64/64 passed**.
- Shared event/token-document/form-metadata checks: **40/40 passed**.
- API-08 SSR/metadata checks: **5/5 passed**.
- `npm run check:api` in the existing clean publication checkout at `31da624`: **passed**, 77 components / 459 exposed entrypoints.
- Same command in the shared worktree: **stale source receipt for validation-summary**, explained by the pre-existing annotation-only edit. Read-only customization recomputation found zero contract failures; its freshness mismatch is the same source digest. Regenerate metadata if retaining that edit before the next build/release.
- Five connected-browser token-editor scenarios reproduced the two eligibility failures and three control outcomes above. This is not a full cross-browser rerun.

Original user feedback and review checkpoints remain unchanged. Proposed implementation work is not added as accepted project scope; the five weighted review units cover investigation and this recommendation only.
