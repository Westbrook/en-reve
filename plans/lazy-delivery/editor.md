# Contextual toolbar construction qualification

Status: predeclared design and qualification protocol; no runtime edit, browser result, or promotion. Source base `fba5ec19b58606cf1776df44862a38a3898f4c72` in the rollout integration checkout. The exact nine-file SHA256 index is retained with the editor lane handoff. Current editor popup scrolling fixes are present; they do not change `EnEditorToolbar.position()`.

## Consumer and scope

Use the existing `/api-examples/rich-text.html` production route and its `#selection-toolbar`, authored at `apps/docs/src/rich-text-demo.ts:42`. It is a real secondary formatting surface alongside the persistent project formatting toolbar. Contextual controls are used when a selection is made; the route also supports typing, reference/tool actions, persistent formatting and composer work without using them. This is an occasional-formatting **scenario**, not measured visitor behavior. Assume 25% of visits use contextual selection formatting for the expected-cost table; show 0%, 25%, 50% and 100% sensitivity. Do not claim telemetry or general adoption. Never alter the route to increase the measured percentage or introduce an unrelated production route.

Compare three exact variants: unchanged eager baseline; same-code opt-in delayed construction; eager rollback of the candidate implementation. There is no optional code chunk: the actual consumer already includes persistent formatting and therefore the same button/icon/toolbar/text-field modules. `load()` preparation cannot save toolbar construction or register anything by itself. A separate synthetic packed fixture may establish component/registry ownership but does not establish route benefit.

The old investigation (`1033a1e87fbf3294dd3e5417d2899ee076d1f9b7:plans/scoped-followup-auxiliary-ui.md`) counted 135 connected nodes for four contextual commands and zero unique library modules. It rejected promotion without a concrete qualified consumer. Those counts are historical, not current measurements. The old failed phone attempt targeted persistent Bold while an open contextual popover intercepted it; no forced-click replacement constitutes a pass.

## Proposed minimal construction boundary

Subject to the common contract naming freeze, add a per-instance `content-rendering="on-demand"` (`contentRendering`) opt-in with eager default. It affects generated default controls only when `mode="contextual"`. Keep the class, definition/dependency closure, host, base/slot, association, selection observation, bookmark ownership and automatic selection-opening policy unchanged. Do not add a second asynchronous controller or import cache for a synchronous template boundary.

The first eligible selection causes the same Lit update to construct the default command subtree before opening and positioning the popover. Keep it connected after first construction; later dismissals hide it as today. Never detach/recreate an active link editor. Persistent mode always constructs immediately, and changing to persistent must synchronously schedule eager construction. Returning to contextual does not remove constructed UI. Late opt-in assignment does not reclaim already constructed DOM. The default slot stays present and authored children stay authored/allocated; no claim of authored-content savings. An SSR opt-in renders the empty closed base/slot and readable editor; matching client policy avoids hydration mismatch.

This is proposed code, not an established API. If the common metadata names construction differently, follow the frozen contract without widening feature semantics.

## Gates frozen before runtime edits

The component gate reuses the inherited minimum of 100 removed connected nodes and adds a 60% reduction in the contextual toolbar's before-first-use nodes. Both are required. A tiny additive option should remove most of the generated four-command surface; requiring both prevents a percentage claim on a tiny shell or a raw count claim on a large unrelated fixture.

The route gate requires at least 5% fewer initial connected nodes on the unchanged whole production route. This is independent of the component gate and means the opt-in must remove a material share of actual page allocation. No JavaScript saving is expected; entry and settled gzip increases must each be no more than 4,096 bytes, with no new external request. Do not attribute server-produced text/CSS bytes to client code.

Performance cells use at least 100 successful timing samples each because the inherited gates use p95; retain every failed/aborted sample and do not pool reruns. Report n, median, p75, p95, range and bootstrap uncertainty. Measure desktop 1280×900 and phone 390×844 in Chromium, Firefox and WebKit, auto and explicit-global registry requests, cold first use and same-instance repeat. Native support skips stay distinct from Firefox's actual global fallback. Add constrained Chromium (4× CPU throttling) as a distinct cell with no transplanted desktop claim.

- Whole-route startup p95 regression: no more than 16 ms, preserving the inherited ceiling.
- First eligible selection to visible, positioned, enabled controls: desktop p95 ≤50 ms; phone p95 ≤100 ms; constrained Chromium p95 ≤100 ms. In every matched cell regression ≤10 ms. Selection-only activation must not focus a toolbar.
- Explicit Alt+F10 or native focus action to the intended usable control: same first-use ceilings, with regression ≤10 ms. Existing toolbar priority is preserved.
- Repeat action-to-usable p95 ≤100 ms, with regression ≤10 ms. Already-constructed candidate and eager rollback must use the same retained subtree.
- No optional preparation traffic: not applicable because no new code fetch occurs. The never-used cell still counts entry code and all persistent observers/listeners.
- Separate retention: five fresh-context repetitions per selected arm, 100 lifecycle cycles each; zero positive nodes/listeners growth from cycle 10→100 and additional heap growth ≤262,144 bytes, preserving inherited limits. Record unsupported heap data as unsupported. Retained command nodes after first use are intentional one-time allocation, not a disappearing cost.
- No failed interaction/ownership/SSR gate may be traded for performance. Failed route gate means no route adoption, even if component construction savings pass.

A deterministic early failure can reject the candidate without the full timing campaign. In that case preserve baseline/candidate census, exact source/build identity and the failed gate; no latency or retention claim follows.

## Phone interception investigation and bounded design

First reproduce with the unchanged packed build and unchanged production route at 390×844 in all three engines. Test initially absent selection (persistent toolbar controls remain reachable), select-forward and select-backward, visible contextual Bold/Link, then persistent controls both while contextual is visible and after supported Escape/dismissal. Use normal Playwright click/tap hit testing; inspect bounding rectangles and `elementsFromPoint`, never force-click. Distinguish source rectangle overlap from a failed actionable user target. Keep the original old fixture result unchanged.

Current source chooses below the editor if it fits, then above the editor, then a viewport edge (`editor-toolbar.ts:88-98`). The above-editor branch can coincide with the preceding persistent toolbar. The new construction policy must not conceal or relabel that failure. Geometry must be measured after controls render; a previously empty base is not a valid final-size measurement.

If actual unchanged-route interception is reproduced, qualify a narrow positioning correction before attributing construction savings: keep the contextual base within the viewport and clear of the editor's active selection and the associated persistent formatting surface. Prefer an existing clear below-editor rectangle; reject an above-editor rectangle intersecting associated persistent controls, then use a clear visible-editor/viewport edge rectangle. This requires a bounded way to obtain peer toolbar geometry from existing association ownership, not a global tag scanner or crossing unrelated editor roots. If no clear rectangle exists, retain the explicit geometry failure for review rather than hiding meaningful UI. Root must approve the exact correction after reproduction; the draft does not authorize an untested geometry heuristic.

## Ownership and regression matrix

| Transition | Existing owner / preserved result | Required evidence |
| --- | --- | --- |
| Initial empty selection | Toolbar association observes eagerly; default commands may be absent only under opt-in | Native editor and persistent toolbar usable; no focus/open/announcement, no optional children |
| Forward/backward/multiline selection | Editor owns live selection; toolbar captures opaque revision bookmark | Same automatic visibility/position and selected range; first render creates only selected instance |
| Open Link | Toolbar bookmark and `linkSelection` own target; native text field owns live URL draft | Type/backspace/composition without replacement; no competing `.value`; first child update completes before focus |
| Invalid Apply | `execute('link')` rejects unsafe URL or stale bookmark | Draft retained for retry; error announced once through existing alert; document unchanged |
| Valid Apply / veto | Editor synchronous cancelable transaction remains sole document owner | One accepted undoable change; veto leaves document and field draft; author writes win |
| Escape / Cancel | Toolbar cancels link state and asks editor to restore valid bookmark | Current range/focus restored; contextual dismissed key prevents immediate reopen; no queued stale focus |
| Outside pointer / editor deselection | Toolbar dismisses without restoring old selection | Nonfocusable outside target, editor click, ArrowRight and focus departure close link UI; no link commit |
| Author write / accepted mutation | Editor revision invalidates old bookmark; toolbar resets link | No applying to unrelated text; history/reset semantics preserved |
| Disabled / readonly / composition / extension open | Editor eligibility and toolbar visibility gates stay authoritative | No unavailable command runs or native selection mutation; link dismissed as existing behavior |
| Toolbar remove/reconnect | Association releases listeners and dismisses stale state | No deferred focus/mount after remove; reconnection binds current owner and captures current selection |
| Editor remove/replace or `for`/`.editor` retarget | `EditorAssociation` resolves explicit editor, same-tree ID, then context | Old listeners/bookmark/draft released; no old target focus; explicit unresolved reference does not fall back |
| Commands / mode / opt-in mutation | Toolbar owns generated command projection; eager behavior remains default | Persistent always available; no active link draft destruction; late opt-in does not claim recovered cost |
| Authored custom toolbar | Consumer owns authored controls and native semantics | Slot retains identity/discovery; optional default generation cannot hide or reparent authored children |
| Scoped ordinary / shadow / nested roots | Existing registry and Lit creation scope own child constructors | Actual owner definitions, sibling containment, shared registry no sibling construction, no global retry |
| Another document / adoption | Owner document supplies listeners/viewport; association refreshes | No leaked original-document listener, stale frame or focus; current-document geometry |
| SSR / hydrate / delayed definition | Request-local editor snapshot and matching opt-in policy | Readable no-JS semantic content; identical hydrated editor node/content, no optional focus; profile mismatch rejected by common contract |
| Native color / clipboard | Editor session and application synchronous native handler | No import await before trusted `openPicker`, `showPicker`, click or clipboard handling; selection stays with active editor |

Source tests already cover backward selection/history, URL validity, authoritative writes/veto, disabled/composition/reconnect, docking bounds, dismissal and demo action reset (`apps/docs/tests/rich-text.spec.ts`). They do not establish newly deferred children, removal while focus is queued, actual phone interception or physical AT acceptance. Add focused cases only where behavior changes; preserve existing suite assertions. Current popup scrolling test (`editor-geometry.spec.ts`) exercises extension placement, not contextual toolbar non-interception.

## Other editor feature dispositions

- `en-rich-text-editor` view import is already conditional on connected mount (`rich-text-editor/element.ts:342-351`). It is immediately needed to make the rich textbox editable; initial SSR markup is read-only. Its document/model/history machinery remains essential. No claim of optional formatting code savings.
- Rich and token extension popup bodies are already session-conditional (`rich-text-editor/element.ts:505-507`; `token-editor/element.ts:355-357`). An idle two-node shell does not meet the inherited gate. Provider cancellation/loading is data/state ownership, not optional code loading.
- `en-editor-trigger` renders no UI and has no editor-backend dependency. Its supplied extension registration must precede typed-trigger recognition; historical four-node host does not justify another boundary.
- Link editing is already conditionally constructed. Deferring its code would not remove the actual route's shared text-field/button modules and must not delay native URL draft ownership.
- Native color and clipboard actions stay synchronous; no replay after import. Editor-hosted custom color rendering already requires an active session and is owned by the application extension.

Open user feedback remains open: contextual link dismissal, tool Enter, native color chip, token styling/editing, composer picker layout, rich token prefix and editor action reset. Existing fixes/tests are obligations, not inferred user acceptance. Any changed phone/link interaction needs a focused human review card and physical/AT evidence explicitly separated from emulated browser checks.

## Resources requested

Root owns shared machine leases, common API freeze and final source integration. Before browser work allocate the pinned installed engines, one production fixture port, a fresh execution output root and serialized build/browser lease. Reuse the supported docs runner for unchanged-route baseline checks; use a separately packed fixture for registry/component ownership. No timed acquisition runs alongside builds or correctness browsers. If the deterministic route census misses 5%, stop promotion and record rejection before spending on timing/retention.

## Current baseline checkpoint — 28 September 2026

The unchanged production source at `fba5ec19b58606cf1776df44862a38a3898f4c72` is frozen in `artifacts/lazy-delivery/baseline-qualification/baseline-docs-fba5ec19.tar.gz` (1,172 assets, including source maps; archive readback verified by the validation owner). The exact executed probe, source/build hashes, raw result, log and six screenshots are at `artifacts/lazy-delivery/editor-baseline-census/`.

All six configurations (Chromium 153.0.8010.12, Firefox 155.0, WebKit 26.6 × 1280×900 and 390×844) passed the initial persistent hit test, forward/backward contextual command, persistent command with contextual controls visible, Escape, and contextual Link dismissal/commit cases. No page errors occurred. Source and built route hashes stayed unchanged. The old minimal-fixture phone interception does not reproduce on this current real route; no positioning change is proposed. This is phone-width desktop pointer evidence, not physical touch/keyboard or AT acceptance.

Current initial node counts are 1,716 whole-route nodes in Chromium/WebKit and 1,712 in Firefox; the contextual host contains 179 nodes, with 166 inside the generated toolbar. Thus the generated subtree represents 92.74% of the toolbar and 9.67–9.70% of the entire route. These are necessary benefit bounds, not achieved opt-in savings: the candidate must still earn its matched census and all applicable performance, ownership, SSR, packaging, retention and manual gates. The historical 135-node count remains historical; current shadow/text/comment allocation differs.
