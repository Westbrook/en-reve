# Rich editing backend decision

2026-09-16 — first implementation, pending manual editing/assistive-technology acceptance.

Use the focused ProseMirror model, state, view, transform, commands, history,
keymap and schema-list packages, installed as direct dependencies of the optional
rich editor. Import `prosemirror-view` only when the browser mounts the editor;
its browser feature detection cannot run against Lit's minimal SSR document shim.
Server rendering emits escaped semantic content from the validated schema instead.
Selective token-editor/composer imports do not load this backend. The all-elements
catalog intentionally includes all component models; applications sensitive to
bundle size should retain selective definition imports.

The choice was checked against the installed upstream TypeScript source:
`prosemirror-view/src/index.ts` supports a Document or ShadowRoot root;
`prosemirror-state` owns selections and transactions; `prosemirror-history` owns
undo/redo. The independent `en-rich-text` v1 envelope prevents accidental reuse of
the flat token-editor v1 schema. The wrapper exposes no backend View/Transaction
objects as a stable public API. It provides opaque revision-bound bookmarks,
commands and JSON snapshots. Backend-native selection mapping remains internal.

Alternatives considered: extending the current flat-run model would make block
boundaries, mark ranges, native selection reconciliation and history a new editor
engine to maintain. Browser `execCommand` would leave commands/history dependent
on differing native editing behavior and would not supply the transaction and
schema boundaries required by the existing cancelable-change contract. A larger
editor UI framework would bring extra presentation and integration assumptions;
the focused packages let `en-*` controls own that surface.

Shared code is extracted only where both backends now use it: trigger registry,
boundary matching, provider cancellation/stale result guards and opaque bookmark
ownership. Shared extension types live at `@en-reve/elements/editor-extensions.js`;
the old token-editor exports remain compatibility facades. Popup rendering and
backend transactions stay in their respective wrappers for this first pass.
A later presentation extraction should follow evidence from these working
consumers instead of forcing their selection or composition models together.

External clipboard input is deliberately plain text in this slice. HTML is never
assigned through innerHTML from clipboard or stored documents. Explicit document
writes validate the schema and allowed link protocols, copy data and reset history.
Token renderers are trusted application code, not remotely discovered plugins.
Dragging content into the editor is currently disabled. Advanced rich clipboard,
collaboration, table/embedded content and backend transaction plugins are deferred.

The contextual and persistent toolbar use the same commands and selection
bookmarks. They do not autofocus on selection. Alt+F10 enters formatting controls;
Escape restores focus/selection and suppresses the same contextual selection.
Auto placement docks near the editor's visible bottom on narrow/coarse-pointer
layouts. Physical touch handles, virtual keyboards, real IME and VoiceOver still
require human acceptance; browser automation alone cannot establish those outcomes.
