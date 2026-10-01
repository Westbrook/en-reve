# Rich text editor and shared editing extensions

> Current planning status (2026-09-16): the [accepted follow-up backlog](component-follow-up-backlog.md) supersedes historical next-phase ordering below. Baseline exclusions describe the original pass; newly committed follow-ups are identified in that backlog. Clipboard interoperability and caret-relative controls are now implemented for review; see [clipboard follow-up](editor-clipboard.md). Physical-device qualification remains pending.

Status: architecture and implementation sequence agreed in conversation, 2026-09-16.
First implementation is published: shared contracts, ProseMirror-backed rich editing, persistent/contextual toolbars and a shared-provider demo. Automated qualification passed, and the user positively reviewed the current presentation. Physical IME/mobile/VoiceOver acceptance remains separate. See [backend decision](rich-text-backend.md). Carousel is published and visually accepted;
physical-device/assistive-technology acceptance remains separately tracked.

## Scope and ownership

Implement an optional `en-rich-text-editor` with paragraphs, headings, bold,
italic, links and ordered/unordered lists; structured input/output, undo/redo,
read-only/disabled states, paste handling and accessible formatting controls.
Build on the composer's editor integration and extension concepts. Neither the
composer nor the base rich text editor assigns built-in meaning to `@`, `/` or
`#`. Applications install reference/tool/color providers and token renderers.

Include a contextual toolbar for selected content in the first formatting slice,
not as an unspecified future enhancement. Keep a persistent toolbar alternative.
Collaboration, tables, embeds and advanced document layout are later slices.

## Existing seams and coupling found in the source audit

- `packages/primitives/src/interactions/chat-editor.ts` supplies explicit editor
  registration, immutable JSON snapshots and composer focus/validation/state.
  Reuse this integration; keep existing imports and textarea behavior compatible.
- `packages/primitives/src/state/token-document.ts` models flat text/token runs
  and numeric offsets. Do not treat this schema as a rich block document, subclass
  its model for formatting, or silently reinterpret saved version-1 drafts.
- `packages/elements/src/token-editor/extensions.ts` supplies providers, custom
  matchers, selection handlers, option rendering and external/rendered pickers.
  `EditorChoice.insert` currently accepts flat runs; adapt these insertions into
  rich inline content while preserving marks and token identity deliberately.
- `packages/elements/src/token-editor/element.ts` currently owns matching,
  async session coordination, selection, geometry and popup presentation together.
  Extract reusable behavior incrementally with both editors as consumers.
- `packages/elements/src/editor-trigger/element.ts` currently types its target as
  `EnTokenEditor` and calls registerExtension. Replace this concrete dependency
  with an explicit shared extension-host capability, preserving `for`, cross-root
  element association, dynamic retargeting, disposers and one registration path.

## Sharing boundaries

1. Framework-independent primitives: validated detached snapshot data, extension
   registration/disposal, matching and session arbitration, async abort/staleness,
   and command metadata/state. Keep these free of Lit, toolbar markup and domains.
2. Editor adapters own document schema, transactions/history, logical selection,
   composition, clipboard policy and DOM reconciliation. Offer capability-based
   integration; a formatting backend is loaded only by a rich editor consumer.
3. Selection/bookmark contract: opaque editor-owned target with document revision,
   validity checks, restore/replace operations and current geometry. Do not make a
   live DOM Range or globally numbered flat offset a shared persistent identity.
   Distinguish document updates from selection-only updates; invalidate stale
   targets unless an adapter explicitly supports safe transaction mapping.
4. Shared extension coordinator: one active session per editor; query/provider
   cancellation, stale commit rejection, native synchronous picker handoff,
   action-only completion and token insertion/editing. Match block-local text
   around the caret without crossing atomic tokens or block boundaries.
5. Shared presentation layer: reuse compatible list/picker behavior, theme tokens,
   CSS Parts, anchoring and focus restoration. Lit rendering remains outside the
   document primitives. Do not force listbox and interactive-dialog pickers into
   one focus model.
6. Commands drive persistent and contextual toolbars alike: availability,
   enabled/disabled and active/mixed state plus execution against a valid target.
   Host applications can supply, omit, reorder and group commands using composed
   `en-toolbar` content. Public names beyond existing APIs remain provisional.

Keep current token-editor exports as compatibility facades when moving contracts.
A new generic registry must not duplicate composer registration or cause existing
providers to run twice. Avoid a universal editor framework: extract only seams
required by these two concrete consumers, backed by shared contract tests.

## Implementation slices

### 1. Shared contracts and editing-model proof — implemented

- Define the editor capability and revision-aware bookmark contracts; extract the
  domain-independent extension lifecycle and preserve current public APIs.
- Prove the same externally authored `@` reference and `/` tool providers work
  with a standalone token editor, composer editor and rich-document prototype.
  Include action-only completion as well as insertion and editable tokens.
- Evaluate the rich editing backend against block/inline schemas, Shadow DOM,
  selection mapping, composition, undo/redo, SSR/hydration and dependency cost.
  Record the chosen backend and tradeoffs before exposing its model as stable API.
- Version the rich document independently; explicitly define plain-text projection
  and conversion from existing text/token snapshots. No implicit data migration.
- Preserve cancellation and authoritative author writes. One backend owns history
  per editor; shared provider commits and formatting become ordinary transactions.

Exit evidence: compatible current-composer tests; two-editor extension contract
proof; stale async/selection rejection; prototype block editing and undo/redo;
written backend decision and remaining real-device/IME risks.

### 2. Rich editing and both formatting toolbar presentations — implemented

- Deliver the baseline block/inline features, structured snapshots, semantic HTML
  rendering, safe URL policy for links and conservative paste behavior. Define
  supported rich paste and plain-text fallback explicitly; never trust raw HTML.
- Persistent toolbar and optional selection-contextual toolbar share commands,
  active/mixed/disabled state and undoable transactions.
- Contextual toolbar appears for an eligible selection in its associated editor.
  Opening it must not move focus automatically, collapse the selection, or disrupt
  native selection handles. Keyboard entry must have a discoverable documented
  path, and keyboard users retain the persistent equivalent.
- Save a valid selection bookmark while a toolbar or link editor owns focus.
  Apply commands only to that bookmark; cancel if a newer author write or unrelated
  edit invalidates it. Escape dismisses and restores editor focus/selection without
  changing content; a dismissed selection must not immediately reopen the toolbar.
- Anchor using selection rectangles and direction, including wrapped/backward and
  cross-block selections. Flip/clamp around container clipping and available space;
  update only while visible on selection, scroll, resize and visual-viewport changes.
- Offer a compact docked editor-toolbar placement when a floating toolbar would
  obstruct content or mobile selection handles. Preserve logical reading order,
  minimum targets and usable keyboard/zoom layouts. Allow consumer policy overrides.
- A trigger picker, token editor dialog and contextual toolbar coordinate through
  the shared session system. Do not stack competing popups, steal focus, intercept
  IME keys, or consume Escape twice in an ancestor dialog.
- Reuse `en-toolbar` semantics and existing theme/focus/motion rules. Provide CSS
  Parts and composable controls; keep supported commands separate from presentation.

Exit evidence: standalone and composer examples with both toolbar placements;
selection retained through formatting/link interaction; keyboard and mobile layout
coverage; formatting, token insertion/editing and undo/redo compose correctly.

### 3. Qualification, integration and published review

- Publish themed standalone and composer demos with `@` references, `/` tools,
  optional color support and persistent/contextual toolbar comparisons. Include
  complete maintained source and API documentation with ownership boundaries.
- Test Chromium, Firefox and WebKit: forward/backward/wrapped/cross-block selection,
  empty selections, emoji/graphemes, atomic tokens, mixed marks, lists, undo/redo,
  paste, canceled commits, newer author writes, multiple editors, provider removal,
  async races, focus restoration, nested dialogs, scroll/zoom/viewport changes,
  SSR/hydration, read-only/disabled and cleanup. Reuse current composer regressions.
- Separate DOM/accessibility-tree checks from actual VoiceOver and physical
  iOS/Android selection, keyboard and IME acceptance. Keep unresolved existing
  composer/manual findings attached to their original versions.
- Update inventory and focused Progress Report review cards, refresh matching theme
  exports, and publish each coherent reviewable slice under the standing instruction.

## Deferred abstraction and scope

Only defer geometry/clipboard/history generalization where the two editor backends
have demonstrably different needs; record the concrete follow-up and dependency.
Shared extension support and the contextual toolbar are committed scope for this
pass. Plugin discovery/download, sandboxing arbitrary executable plugins,
collaborative transport, tables, embeds and advanced layout are not included.
