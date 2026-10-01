# Portable documents, ranges and clipboard imports

Import the portable codec without browser globals, custom-element registration or mounting an editor:

```ts
import {decodeRichDocument, richDocumentFromRuns, richDocumentText}
  from '@en-reve/elements/rich-document.js';
const document = decodeRichDocument(JSON.parse(savedJSON), {maxBytes: 500_000});
const readable = richDocumentText(document);
const draft = richDocumentFromRuns([{kind: 'text', text: 'Alpha\nBeta'}]);
```

The existing `en-rich-text` version 1 tree and `richDocumentFromRuns` imports from
`@en-reve/elements/rich-text-editor.js` remain supported. The portable entry point
exports `RichDocument`, `RichNode`, `RichDocumentLimits`, and `TokenRun`. Decoding
accepts a JSON value, not a JSON string. Invalid input throws. Paragraphs, headings
1–3, lists, hard breaks, strong/em/link marks and atomic tokens use the existing
schema. Executable/protocol-relative links and duplicate token occurrence IDs are
rejected. Token business identity stays in application-owned `data`.

The codec returns detached, recursively frozen data; it never freezes the caller's
input. To edit a snapshot, clone it and decode the proposed result. No Unicode
normalization is performed: combining marks and authored spelling are preserved.
Adjacent text runs are merged during run construction, as before. Editor decoding
uses the same codec defaults and then checks the ProseMirror tree. The public
codec does not require ProseMirror or DOM globals. Validation is now deliberately
stricter than the old ProseMirror-only boundary: unknown fields, sparse arrays,
repeated marks and documents beyond the default bounds are rejected instead of
being ignored or accepted. Clean stored input before assigning it to an editor;
custom codec limits do not change the editor defaults.

Defaults are 1,000,000 **UTF-8 bytes** of the serialized JSON envelope (including
payloads), 10,000 rich nodes (including the root), and 32 rich-node levels (root
at depth 1). All limits must be positive safe integers. As a secondary bound,
JSON data allows at most `maxNodes * 32` values and `max(128, maxDepth * 4)` object
levels, with the envelope at level 0. Cycles, accessors, sparse arrays, nonfinite
numbers and non-JSON values are rejected. `richDocumentText` and
`richDocumentFromRuns` accept the same optional limits as a second argument.
Clipboard envelope limits remain separate: 1,000,000 **UTF-16 code units**,
20,000 JSON values, depth 40, and 10,000 runs.

## Revision-bound ranges

```ts
import type {RichRange} from '@en-reve/elements/rich-text-editor.js';
import '@en-reve/elements/define/rich-text-editor.js';
const editor = document.querySelector('en-rich-text-editor')!;
const selected = editor.captureRange(); // caret, selection, or Select All
const range: RichRange = {
  coordinate: 'text', from: 0, to: 5,
  expectedText: 'Alpha', revision: editor.revision,
};
if (editor.validateRange(range)) {
  editor.decorateRanges([{id: 'suggestion-1', range}]);
  editor.replaceRanges([{range, runs: [{kind: 'text', text: 'First'}]}]);
}
editor.clearRangeDecorations();
```

Ranges use ordered, half-open endpoints and an exact editor revision. Readable
`text` coordinates count UTF-16 code units. Each textblock boundary contributes
one `\n`, including empty paragraphs; hard breaks contribute `\n`; tokens
contribute their full fallback `text`. Offsets inside a token or a grapheme are
invalid. Complete token occurrences may be selected, decorated or replaced;
partial-token edits never snap to a nearby boundary. A caret before or after an
atom is valid. Expected text must equal the exact readable substring.

`structured` coordinates count text code units, one position per token/hard break,
and opening/closing positions for each non-leaf container. The root has no extra
wrapper positions. For `Alpha\nBeta`, paragraph interiors are `1..6` and `8..12`;
Select All is `0..13`, while the readable range is `0..10`. The end of one paragraph
and beginning of the next bracket the readable newline. Internal container-only
positions outside textblock interiors are unsupported, except root endpoints
`0` and `doc.content.size` for whole-document selections and boundary carets.
Consumers may use captured structured ranges without inspecting editor state.

Decorations expose `::part(range-decoration)`. They do not change focus, selection,
revision or history; a content revision makes old decorations inactive. Replacement
validates all ranges and the complete resulting document before committing one
cancelable `en-change` transaction and one undo entry. Overlap and duplicate-start
ranges are rejected. Selection maps through the transaction. Stale/invalid input,
disabled/read-only/composing editors, duplicate resulting IDs and canceled events
leave content and history unchanged. Capture during composition is unavailable.

Nonempty replacements inherit marks from the **first selected inline node**,
including when it begins immediately after differently formatted text. A mixed
selection uses those first marks for all inserted runs. A caret follows existing
ProseMirror insertion marks (normally its left neighbor at an inline boundary,
with noninclusive link behavior). Newlines in replacement text are hard breaks;
existing block structure outside the replacement remains. Authoritative document
assignment, undo and redo also invalidate previous ranges.

## Known command prefixes

```ts
import {createEditorCommandMatcher}
  from '@en-reve/elements/editor-command-matcher.js';
editor.registerExtension({
  id: 'commands', trigger: '/', label: 'Commands',
  match: createEditorCommandMatcher(['insert table', 'insert image']),
  provide: async ({query}) => applicationCommands(query),
});
```

The matcher snapshots aliases and accepts case-insensitive exact prefixes of a
known full name: `/`, `/ins`, `/insert ` and `/insert t` may match; `/insert toast`
does not. Comparison uses locale-independent lowercasing, with no normalization
or whitespace folding. A trigger must be at the start or after whitespace.
Escaped triggers, URL/path continuations and unknown names stay ordinary text.
Aliases must be nonempty trimmed single-line strings; trigger must be a nonempty
non-word, non-whitespace string. Command definitions, suggestions and meaning
belong to the application; both editor backends reuse `EditorExtension.match()`.

## Importing token occurrences

```ts
import type {TokenImportContext} from '@en-reve/elements/editor-extensions.js';
const reconciliation = new WeakMap<object, Map<string, string>>();
editor.registerToken('reference', token => document.createTextNode(token.text), {
  importToken(token, context: TokenImportContext) {
    let references = reconciliation.get(context.scope);
    if (!references) reconciliation.set(context.scope, references = new Map());
    // Resolve your application identity once per paste; undefined keeps fallback text.
    return mayImport(token.data) ? {...token, data: reconcile(token.data, references)} : undefined;
  },
});
```

The same options work on rich and token editors. Hooks receive a detached frozen
source token with its **original** occurrence ID. `context.sourceId` repeats that
ID; `context.sourceTokens` lists original token occurrences; `sourceIndex` is its
index in the validated run sequence (rich slices supply their token sequence).
Every callback within one paste shares an opaque frozen `context.scope`; later
pastes receive different scopes. A WeakMap keyed by this scope allows repeated
business references to reconcile consistently without a global cache. En Reve
makes no authorization or project-boundary decisions.

Return a valid token to accept/transform it, or `undefined` to keep its original
readable fallback. Returned token types must be registered in the destination;
otherwise only original text is retained. Returned IDs are ignored. Destination
IDs are fresh relative to all source occurrences, destination tokens, transformed
IDs and other occurrences created by the paste.

A throwing hook or malformed transformed result aborts the entire structured
import in both editors and pastes `text/plain` as one normal cancelable transaction.
No partial structured tokens or history commit survives. Malformed envelopes use
the same readable fallback. This does not roll back external side effects inside
application hooks: keep hooks synchronous and use the scope for local reconciliation.
Browser/OS clipboard permissions, real IME input and assistive-technology reading
remain manual verification areas.
