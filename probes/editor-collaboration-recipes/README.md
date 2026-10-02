# Packed editor and collaboration consumers

These [application-owned contracts](../../packages/styles/docs/editor-collaboration-consumers.md)
exercise token documents, explicit chat adapters, query/selection helpers and
clipboard conversion with editor, chat and presence styles. They import public
packages from isolated tarballs, never owning elements or workspace source aliases.

```sh
EN_EXECUTION_OUTPUT=/absolute/new/run tooling/test-pipeline/with-toolchain.sh npm run test:union -- --pathways=editor-collaboration-recipes
```

Strict declarations and production bundle resolution are checked before native
browser actions in Chromium, Firefox and WebKit. Chat/collaboration styles run in
both CSSResult and portable CSS form; token/rich editor styles have JS exports
only and are not claimed to have a portable counterpart. Each fixture instance
owns its shadow root; the server and browsers are isolated under the pipeline.

The text draft plus separate structured preview is an intentional alternative to
inline token editing. Tests cover native typing/deletion/selection, transactional
veto and superseding writes, undo, synthetic composition guards, asynchronous
providers, stale bookmarks, versioned clipboard conversion, adapter lifecycle,
snapshots, native rich-text DOM, presence links, loading and scoped responsive
styles. ClipboardEvent/DataTransfer payload tests do not establish OS clipboard
transport. Native rich notes do not implement or qualify a rich-document backend.

Actual IME, AT speech, physical/retail platforms, rich formatted-paste transport,
caret popup placement, full SSR/hydration, virtualization and arbitrary theme
acceptance remain separate obligations. Application events are not new delivered
component APIs. No runtime component changes are implied by a passing recipe.
