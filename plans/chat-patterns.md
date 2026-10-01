# Reusable chat composition

> Current planning status (2026-09-16): the [accepted follow-up backlog](component-follow-up-backlog.md) supersedes historical next-phase ordering below. Baseline exclusions describe the original pass; newly committed follow-ups are identified in that backlog. Implementation of those follow-ups has not started.

The next retained family is chat message, composer and contextual actions.
This pass adds `en-chat-message` and `en-chat-composer` as slotted compositions.
The application continues to own transcript order, announcements, history,
attachments, transport, pending/rejected state and draft clearing.

- Message: named author/avatar/metadata/attachments/actions/status slots and a
  rich default body, with shared theme paint and CSS Parts. No automatic live
  region, focus movement, Markdown parsing or transport.
- Composer: a slotted native textarea or en-textarea owns value, validation,
  forms and IME. The default en-button and Ctrl/Cmd+Enter request one cancelable
  `en-action` with action=send and data.value. Enter remains a newline.
  The composer never clears text. Sending blocks repeat sends while editing
  remains available. Attachments and tools are slotted application controls.
- Demonstration: retained drafts/files after failure, explicit completion,
  contextual reply action, no involuntary transcript scrolling, all inspired
  themes and an extracted source sample. Integrate into existing Chat workflow.
- Verification: native editing/IME, cancellation, pending, dynamic slots,
  SSR/hydration, keyboard focus, narrow RTL and themes. Actual assistive-technology
  conversation reading remains a manual review checkpoint.

Streaming transport, rich-text editing, recording, persistent chat storage and
transcript virtualization remain separate work; no AI service is connected.

The optional structured editor is implemented with application-owned
token types and trigger providers (`@` references, `/` tools, `#` color examples).
See [composable editor contracts](composable-editor.md). This source-reviewed
design precedes presence/activity; its first live implementation is at
`/api-examples/composable-chat`, with manual IME/mobile/AT acceptance still open.

## Attachment and retry follow-up

The live demo renders selected/sent attachments as image thumbnails or document
tiles with visible filename and size. Remove is composer-local; Preview opens a
local dialog, with file download and an image-error fallback. Object URLs are
released on removal when unreferenced, reset and disconnect.

Outgoing messages enter the transcript when send is accepted. Failure stays on
that same message with Not sent status and Retry in the existing slots. Retry
sends the original snapshot, retains its place in the transcript and does not
clear the current composer. Pending retry remains focusable but unavailable;
completion restores a focused retry control to its named message article.
