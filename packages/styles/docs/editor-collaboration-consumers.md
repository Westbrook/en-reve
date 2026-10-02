# Application-owned editor and collaboration consumers

The [packed fixture](../../../probes/editor-collaboration-recipes/README.md) uses
public primitives and stylesheet fragments without importing delivered elements.
It is an alternate composition with explicit application ownership, not an API
into the shadow markup of `en-token-editor`, `en-rich-text-editor` or chat elements.

## Structured draft and native editing

`EditorDocument` owns immutable text/token runs, grapheme and token selection
boundaries, reversible edits, authoritative resets and bounded undo/redo. Its
`en-change` event is synchronous and cancelable while tentative state is visible.
The fixture bridges that event to an application event; canceling restores the
model and reconciles its native textarea. A listener's authoritative reset wins.
No property binding competes with the textarea's live value.

This example deliberately presents a text draft and a separate structured token
preview. Clicking a preview token selects its complete fallback text in the
textarea. Backspace/Delete use document boundaries; edits inside token text can
replace the whole occurrence. It is not an inline rich-token editor backend.
The application converts the changed native range to a document transaction,
restores the returned selection, and retains the same textarea. Composition
acceptance is deferred until compositionend. Synthetic guard checks do not prove
physical IME behavior or all browser editing histories.

`tokenEditorStyles` paints the isolated application's `.editor`, `.label`,
`[data-token]`, token-content part, `.popup` and `.option` template. It is JS-only;
its internal generic class names must stay in the matched shadow root. Token and
input custom properties remain scoped. The native rich-notes example adds
`richTextEditorStyles` after it to style native editable headings, paragraphs,
lists, emphasis and links. Native editing owns that DOM; the fixture does not
provide a ProseMirror backend, rich-document persistence or rich formatted-paste
sanitization. Those owning-editor tests remain separate.

## Extensions, queries and selection

`EditorExtensionRegistry` stores application providers. Default trigger matching
requires an appropriate boundary; `createEditorCommandMatcher` accepts known
multiword aliases while leaving paths and URLs as literal text. Dispose the exact
registration on teardown. An obsolete disposer cannot remove a newer registration.

`EditorQueryTask` aborts the prior query and ignores late fulfillment/rejection.
The application owns results, candidates, popup rendering, accessible IDs and
keyboard handling. Escape cancels the task and preserves literal input.
`EditorBookmarks` holds opaque revision-bound selection data. Resolve against the
current document revision before inserting; an authoritative reset invalidates
old picker targets. This finite example anchors its popup to the textarea box;
it does not qualify caret-relative collision placement or remote provider policy.

## Clipboard and composer adapters

Copy writes mandatory plain text and best-effort versioned custom MIME. Cut edits
only after writing succeeds, with semantic cancellation preserving the document.
Paste validates structured input, remints occurrence IDs and flattens unsupported
token types to their readable text. Malformed payloads fall back to plain text.
This textarea consumer never interprets HTML; it makes no formatted-paste claim.
Tests populate the actual ClipboardEvent clipboardData channel, because Firefox
does not reuse the DataTransfer supplied to the constructor. They dispatch native
ClipboardEvent/DataTransfer objects with explicit synthetic payloads;
OS clipboard transport and cross-application paste are not inferred from them.

`registerChatEditor` is explicit opt-in on the actual editor host. The composer
resolves only that registration, checks composition/disabled/read-only/validity,
captures synchronously using `snapshotChatEditor`, and dispatches a cancelable
application send action. Snapshots are detached and deeply frozen. Sending does
not silently clear a draft. Disposal removes only its own registration and a
reconnect registers again. Applications own network submission and retry policy.

## Chat and presence surfaces

`chatStyles` (or `chat.css`) expects native `.en-chat-composer`, editor/actions/send
regions and `.en-chat-message` header/author/metadata/content. Compose it with
foundation, button and control styles in one application root. It supplies paint
and spacing, not send, message lifecycle, attachment or slot semantics.

`collaborationStyles` (or `collaboration.css`) expects `.presence`, identity/name/
status/dot and members surfaces, plus feed/list/item/author/body/time structures.
A navigable identity is a real anchor, with textual status alongside a decorative
dot. Native list/listitem semantics and a stable live status remain application
responsibilities. The fixture keeps existing history visible while loading and
prepends older entries only when its explicit simulation completes. It does not
qualify virtualization, large paging, focus pinning or network races.

Both portable stylesheet deliveries run within their matching application shadow
roots. No classes here are new customization APIs for delivered elements; use
those elements' documented CSS Parts and custom properties instead.
