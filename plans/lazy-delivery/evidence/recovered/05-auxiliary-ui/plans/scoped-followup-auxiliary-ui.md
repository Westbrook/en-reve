# Optional editor and media auxiliary UI audit

Base: `66386af7daac295cb2e178236d45289a9ebced4f` (latest local main at checkout).
Verified ancestor: Phase 6 seal `220d2dd3e4f55c6f2557d7e7fc593d5d16099bba`.
Branch: `codex/scoped-followup-auxiliary-ui`; isolated worktree `/private/tmp/design-system-scoped-followup-auxiliary-ui`.

## Decision protocol, before measurement

Inventory both families; promote at most one independently owned optional surface. Retain eager compatibility. Audit may conclude that no safe beneficial boundary is established. This task owns this plan and `artifacts/scoped-followup-auxiliary-ui/` only. Runtime, shared editor/color contracts, immutable Phase 0–6 evidence, unrelated work, report checkpoints and open feedback remain outside the edit scope until evidence justifies a candidate.

Read canonical handoff and unresolved feedback through the original checkout's ignored locator. Reuse the report at http://127.0.0.1:4177. Update only `scopedFollowupAuxiliaryUI` and task-prefixed records under the canonical lock. Color task confirms existing session, synchronous native-picker and application Apply/Cancel ownership; its completed audit changes no runtime.

The predeclared protocol is `artifacts/scoped-followup-auxiliary-ui/protocol.json`: require a concrete optional workload and at least 100 removable connected nodes or 4,096 marginal startup gzip bytes, with safety gates and full qualification before promotion. Limits: +16 ms startup p95; immediate action-to-usable p95 ≤300 ms; repeat ≤100 ms; added settled gzip ≤4,096 bytes; additional heap growth from cycles 10→100 ≤262,144 bytes; zero node/listener growth. Promoted runtime requires ≥30 successful samples per configuration and five separate retention repetitions. These are prospective gates, not evidence of an improvement. Preserve failed attempts. Separate native/global fallback, cold/warm, first/repeat, desktop/constrained, unused and prepared-unused visits. Count preparation bytes and lead time. Historical Phase 0–6 workloads are not a matched control.

## Audit basis

Read adoption/Phase 6 plans, public scope/loader/activation contracts, backend/session ownership, definitions and actual rich-text/composer/media examples. Measure exact production output from npm-packed base packages, with module hashes. Rank actual connected structure separately from emitted code. Authored source occurrence counts are a reproducible availability proxy, never observed end-user activation rates.

Initial source findings: contextual toolbar controls are rendered while its popover is closed; rich/token extension bodies already require an active session; neutral editor trigger has no editor-backend dependency; media viewer is an image viewer, not an audio/video playback engine. Keep rich editor mounted, its native selection/composition/undo history, provider signal and accepted/draft transactions eager. Keep file input/native-picker invocation and application pending operations eager.

## Final choice: retain current runtime; no pilot promoted

The **four-command contextual toolbar** is the one leading editor surface. Its 135 connected nodes (46 elements, ten shadow roots) per closed instance pass the predeclared DOM inventory gate. That gate is necessary, not sufficient. The actual rich-text example already supplies persistent formatting and opens contextual formatting on ordinary selection. Its library module set is identical to persistent-only. A policy adding an explicit “Show selection formatting” trigger changes that interaction; removing the toolbar during an active link draft/bookmark loses state. Neither is justified by an observed low-use workload or matched net-benefit result. No frequency telemetry exists, and inventing an unused route would not close that gap.

No runtime pilot is promoted. This is a decision against adoption now, not a claim that conditional toolbar construction is impossible. Keep the candidate available for a consumer that explicitly chooses that policy and can qualify it. Media systems were inventoried but not modified in parallel.

### Measured inventory

Counts include host, element/text/comment nodes and open shadow roots. Fixtures use two instances of unchanged base packages. Whole-component figures are not removable auxiliary costs.

| Rank | Auxiliary surface | Idle nodes / elements per instance | Code and usage evidence | Decision |
| --- | --- | --- | --- | --- |
| 1 | Contextual toolbar, four commands | 135 / 46 | No additional library modules over persistent toolbar; selection-driven in the actual demo | Clears DOM gate only; retain pending a concrete optional consumer and qualification |
| 2 | Image viewer zoom/pan/original tools | 33 / 10 | Inline viewer code; tools offered on each opening | Below DOM gate; keyboard/native alternatives remain eager while viewing |
| 3 | Idle rich/token popup shell | 2 / 1 | Session/geometry code belongs to active editor; body already absent | Keep existing session-conditional rendering |
| 4 | Neutral editor trigger | 4 / 1 | No rich backend or toolbar graph; registration precedes typed-trigger recognition | Keep backend-neutral capability registration eager |

Persistent ten-command toolbar: 312 nodes / 109 elements. It is primary formatting UI, not established unused content. Two-item image viewer: 262 / 91 including dialog/carousel/slides/tools; delaying the entire viewer is an application disclosure decision beyond its 33-node auxiliary strip. File selection: 38 / 13; composer fallback: 38 / 19. Both own essential input/actions. This media viewer displays images; no audio/video playback migration was tested.

Authored-source proxy: toolbar 4 occurrences in 2 files; trigger 5/2; rich editor 4/3; token editor 5/4; viewer 1/1; carousel 5/2; upload 2/2; composer 5/4. Exact locations/counting rules are in `source-audit.json`. Counts can include snippets or conditional branches. They rank repository exposure, not actual user activation rates. Persistent formatting and upload/native actions are primary; contextual formatting is selection-driven; extension/viewer tools are explicitly invoked. Relative frequency within the latter group is unknown. There is no basis for calling it rarely used.

### Exact packed code attribution

The reproducible build packs tokens/styles/primitives/elements, extracts an isolated consumer and resolves En Reve modules from packed dist only. Vite emits minified ES2022 with module/asset hashes. `packed-ssr.mjs` separately packs SSR. Archives and exact browser assets are retained. Environment: Node 24.16.0; other versions and OS are recorded in receipts.

| Fixture | Entry gzip bytes | All emitted chunks gzip bytes |
| --- | ---: | ---: |
| Neutral trigger | 10,837 | 10,837 |
| Rich editor | 44,981 | 101,681 |
| Rich + persistent toolbar | 70,042 | 126,742 |
| Rich + persistent + contextual toolbar | 70,044 | 126,744 |
| Token editor | 30,796 | 30,796 |
| Token + neutral trigger import | 31,765 | 31,765 |
| Image viewer | 54,596 | 54,596 |
| Native file selection | 34,299 | 34,299 |
| Composer fallback | 19,495 | 19,495 |

Lower bytes mean smaller emitted payload, not less wire traffic or faster use. Different functions cannot be subtracted as equivalent replacements. The rich view chunk is requested during mount, so it is not unused optional toolbar code. The 25,061-byte persistent-toolbar delta adds the button/icon/toolbar/text-field closure and changes functionality; it is not removable from the existing rich demo. The two-byte contextual delta is fixture/minifier encoding: library module sets are equal. Token + trigger is an extra-import graph case, intentionally without a trigger host; its DOM matches token-only. Hiding markup does not split imports.

Application color extension code is static in the composable demo: parsing, serialization, token rendering and custom/native modes share imports. Color controls are already session-conditional. A whole color-popup code split is unqualified here, not assigned zero savings. The coordinated color task at `8969cde3` changed no runtime and rejected its internal plane boundary; a future whole-popup experiment is distinct. Local reference/tool providers are small application functions, not heavy remotely loaded plugins.

## Eager state and optional absence

- **Active editor:** keep its exact editable node, backend, selection/caret, composition, history and draft. Rich `.document`/`.value` writes reset history; disconnect destroys the view. Neither is a preparation technique. Bookmarks are revision-bound and cannot replay arbitrary later edits. Author writes and accepted transactions invalidate stale targets. Token and rich document schemas remain independent.
- **Formatting:** persistent controls and command state stay ready. Contextual toolbar observes editor state and owns bookmarks/dismissal; an active link editor owns input/error state. Never remove it during a draft. Preserve Alt+F10 and Escape. A future absent closed body still needs eager selection observation, trigger/readiness and focus ownership.
- **Extensions:** keep matching, registration, current signal, revision/connected/editable guards and composer synchronous snapshots eager. Current rendering omits choices and custom controls when no session exists; idle census finds zero popup descendant elements. Six packed cases verify Escape abort/late-result suppression and disposal without replacing the active control. A provider error/reopen is not a failed module/retry test.
- **Neutral trigger:** its definition has no dependencies and its capability/context association only registers a supplied extension. It neither chooses a backend nor provides a visible named opening action. Retain application ownership.
- **Native/color/clipboard:** synchronous `EditorPickerSession.openPicker()` and native-first `#` must retain the initiating activation. Keep native input and clipboard handlers eager. Awaiting a module then replaying picker/clipboard input is invalid. Color Apply/Cancel, previews, accepted transactions, veto/authoritative writes and remembered hue stay with their current owners; see `coordination.md`.
- **Media:** preserve live viewer active key, zoom/pan and pointer capture. Author `activeKey` writes reset view; replaying them is not restoration. The cancelable selection transaction resets view only on commit. Native range and pan buttons are accessibility alternatives while open. Carousel thumbnail/window feedback stays open. A future playback consumer must keep its live media element, position/rate/play state, gated actions and pending promises; no such outcomes were exercised here.
- **Uploads:** file selection owns File objects, native chooser, constraints/form state; the component performs no uploads. The application owns pending operations/progress/retry/cancel. Do not recreate the input or apply canceled late results. No real upload or active user content was manipulated.

## Future activation contract (not implemented)

A consumer-specific contextual-formatting opt-in would need an eager named trigger, local persistent loading/error/status/retry route and eager rollback/default. Preparation must not focus, mutate selection, announce background loading or open UI. Count preparation on never-opened visits and report full route-entry/readiness plus preparation lead separately.

Create through the actual owner registry/factory or Lit creationScope. Moving global nodes does not rebind ownership. Definition availability is not usable focus. Readiness must await required controls, validate the current bookmark/session/signal, and perform only the current semantic action once. Bound readiness failure (prospective five-second error deadline; performance gates remain tighter). Escape, focus abandonment, view disposal, disabled/read-only and invalid revisions cancel pending opening; finishing imports must not open or steal focus. Restore focus only for current intent. Never substitute an old content snapshot for an invalid bookmark.

Native dormant roots may share a registry. Actual global fallback must hold optional markup in an inert template until use; definition still upgrades connected same-tag global hosts, cannot isolate versions and cannot undo registration. No per-editor registries or live drafts in templates. Cached import failures mean explicit retry may fail again; automatic reload/recreation may lose work. Two-instance/mixed eager and deferred/adoption/disposal, real import failure, SSR/hydration and changed accessibility paths require qualification before promotion.

## Verification and limits

- Build tokens/styles/primitives/elements and SSR: pass with no runtime diff. Nine packed fixture builds retain package hashes, per-module hashes, chunks and observed request paths.
- **54 structural cases:** nine fixtures × two registry requests × three engines, two instances each. Chromium 153.0.8010.12 and WebKit 26.6 auto use native scoped mode; Firefox 155.0 auto is actual global fallback. Explicit global remains separate. Import purity and top-level custom constructor ownership pass. Full nested/native-node isolation is not claimed; the color audit's WebKit native INPUT association observation remains open.
- **Six packed baseline session cases:** control identity, bookmark/selection restore, Alt+F10/Escape DOM focus, formatting undo/redo, unchanged second editor, pending-provider cancellation/late result, provider error/reopen and disposal. These test existing behavior, not a new activation boundary.
- **30 focused node tests:** extension/query/bookmark, clipboard/composer data, rich schema and SSR escaping/hooks. Packed SSR independently verifies import purity, escaped readable rich content, absent toolbar and no provider/native-picker invocation. No new hydration pass is claimed.
- Supplemental phone-width named-controls and toolbar activation are recorded in `targeted-input.json`; report sorting/layout/return link in `report-verification.json`. Touch is emulated; Firefox uses pointer fallback. DOM names/focus do not establish AT speech or physical-device acceptance.
- No promoted runtime: timing samples and retention runs are **unperformed**, not zero-cost measurements. No cold/warm, first/repeat latency, constrained CPU, preparation/unused traffic campaign or real optional-chunk failure/retry result. No speedup or zero retention growth claim. Predeclared promotion gates remain unchanged.
- Physical devices, real IME/system clipboard/OS picker, playback, pending uploads, mobile selection/virtual keyboards and AT speech review were not performed. Accepted historical manual review is not reopened because none of its interactions changed.

### Retained failed attempts

Attempt 1: sandbox denied Chromium Mach bootstrap. Attempt 2: 54 connection failures because the sandboxed server could not bind, retained in `dom-server-unavailable.json`. Attempt 3: shared browser lock correctly prevented concurrency. Attempt 4: all 54 structural snapshots succeeded but six session harness checks failed because macOS Home/Shift+End did not establish selection; retained in `dom-selection-harness-failure.json`. ControlOrMeta+A followed by waiting for actual backend selection fixes only the harness. Unchanged runtime passes attempt 5 (54 structural + six session). Raw logs remain; subsequent failures are also retained if any.

## Review/handoff

[Sortable local audit](http://127.0.0.1:4283/?progress-report); [canonical Progress Report](http://127.0.0.1:4177). The artifact is a focused result, not a duplicate progress report. Review the no-promotion recommendation, contextual-toolbar tradeoff and limits. Detailed receipts live under `artifacts/scoped-followup-auxiliary-ui/`.

Tool Enter, native color/typeahead/layout, token editing, rich token prefix, contextual-link dismissal, editor action reset, media prominence and carousel feedback remain open. Final handoff rereads canonical feedback; only task-prefixed records and `scopedFollowupAuxiliaryUI` are updated using locked atomic writes. No acceptance is inferred from automated checks.

No merge, push, publication or deployment. Runtime, shared contracts, unrelated work and Phase 0–6 archives are unchanged. Next action: review the audit; any consumer-specific opt-in requires its own matched workload and unchanged promotion gates.

Phone-width baseline observation: in six initial 390px fixtures, the open contextual toolbar intercepted the persistent Bold target. This is retained as `targeted-input-overlap.json/.log`, not relabeled a pass. The scoped follow-up targets the visible contextual toolbar. No CSS/positioning or library change was made; the minimal fixture does not establish the actual documentation-route overlap or resolve existing popup feedback.

Final supplemental disposition: six initial phone-width input attempts failed at the covered persistent-toolbar target. The visible-contextual-toolbar follow-up was stopped while queued behind a long serialized date timing campaign; it did not run and remains unqualified. This audit changes no interaction and promotes no runtime, so no touch pass is required to reject the candidate. Its failed result is preserved, not repaired by force-clicking or relabeled successful. Six report browser configurations passed before the final text-only disclosure; screenshots retain that earlier wording.
