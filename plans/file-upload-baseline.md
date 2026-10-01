# File selection and application-owned upload

> Current planning status (2026-09-16): the [accepted follow-up backlog](component-follow-up-backlog.md) supersedes historical next-phase ordering below. Baseline exclusions describe the original pass; newly committed follow-ups are identified in that backlog. Implementation of those follow-ups has not started.

The user approved tooltip behavior and requested the next planned implementation
while reviewing the finite tree. This pass takes the remaining file-upload entry
from the form-pattern workstream. It does not add a new inventory item or mark
tree review complete.

`en-file-upload` keeps native file selection available to keyboard and touch
users, with an optional drop surface. Selected files, removal, type/size rejection
and application-owned pending/error/retry states form the first review scenario.
The application owns transfer, storage, credentials and remote validation.

Selection uses the existing single cancelable `en-change` contract: provisional
files are available during dispatch, cancellation restores only state still
owned by that transaction, and consumer assignments take precedence. File
objects are property data, never serialized as HTML attributes or persisted in
theme candidates. Native picker hints and local rejection checks are not a
server validation policy.

Styles, selection validation, templates and interaction behavior should remain
separable where useful. Reuse theme, focus, sizing and field-label conventions;
expose Parts for local presentation. SSR delivers the empty chooser and its
label/help truthfully, with native selection available after hydration.

Share a resettable specimen between sticker sheet and API reference, provide an
isolated review page and a workflow composition demonstrating simulated transfer
and recovery. Include source-derived metadata, clean code samples, themed and
narrow-screen delivery. Browser checks cover choosing without dragging, drops,
rejection, removal, cancellation/author ownership, reset, accessibility names,
initial HTML and hydration. Physical native picker and assistive-technology
review remain separate.

Directories, chunked/resumable transfer, network services and persistence of
local file handles are outside this baseline. They must not be implied by the
component name or simulated workflow.

References: [native file input](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/file),
[file selection and drop](https://developer.mozilla.org/en-US/docs/Web/API/File_API/Using_files_from_web_applications).
