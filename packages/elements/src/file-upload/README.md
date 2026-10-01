# File selection

`EnFileUpload` is a form-associated native file picker with drag and drop, a removable selection list, and local constraints. It does not upload, preview, persist, authenticate, or inspect file contents. The application owns those operations and can compose progress, retry and cancel actions outside the element.

```html
<en-file-upload name="assets" accept="image/*,.pdf" multiple max-file-size="10485760">
	<span slot="label">Project assets</span>
	<span slot="description">Choose images or PDFs, up to 10 MB each.</span>
</en-file-upload>
```

Import the class from `@en-reve/elements/file-upload.js` or register it and its `en-button`/`en-icon` dependencies through `@en-reve/elements/define/file-upload.js`. The class-only entry does not modify a registry.

## Selection and control

`.files` returns a stable, frozen `readonly File[]` snapshot. It is property-only; never serialize files into an attribute. Application assignments are silent and authoritative, including equal-value assignments. The setter creates a frozen copy and deduplicates identical File object references. Assign `[]` to clear. Different File objects with the same name remain distinct.

A native selection or file drop **replaces** the current selection. `multiple` allows a batch of files, rather than turning each gesture into an append operation. A removal changes only the chosen file. All three use the single synchronous, cancelable, bubbling and composed `en-change` event:

```ts
fileUpload.addEventListener('en-change', (event) => {
	// detail: { previous: readonly File[], proposed: readonly File[], reason }
	// reason is "select", "drop", or "remove".
	// fileUpload.files and native FormData already expose the proposed files.
	if (!applicationAllows(event.detail.proposed)) event.preventDefault();
});
```

Canceling restores the previous selection and form data. A synchronous application assignment, even an equal-value assignment, or a nested accepted transaction supersedes an older rollback. For asynchronous approval, cancel immediately, await the application decision, then assign `.files`. Upload side effects should run after the synchronous event resolves, checking that the proposal was accepted and still current.

Picker cancellation preserves the selection. Selecting the same file again remains possible. The real native input owns keyboard activation; dropping is optional. Removing a focused file moves focus to the next removal action, or the previous one, or the picker when empty. Application-directed focus changes take precedence. File names are rendered as text and long names wrap without widening the page.

The component accepts finite individual file batches. Directory drops and unsupported drops with no File entries are ignored and preserve the current selection. It does not traverse folders, ingest clipboard content, or fetch dropped links.

## Constraints and feedback

`accept` recognizes case-insensitive extensions (including compound extensions such as `.tar.gz`), exact MIME types and MIME families such as `image/*`. Empty MIME metadata does not magically establish a file type. Invalid accept tokens are ignored; an empty valid token set is unconstrained, consistent with this being an input hint. `max-file-size` sets the maximum bytes **per file**. Its default is unlimited; zero permits empty files, while negative or nonfinite values leave size unconstrained. `multiple` defaults to false.

The entire invalid batch is rejected. No partial selection silently replaces the existing files. A visible status message accompanies noncancelable `en-reject`:

```ts
fileUpload.addEventListener('en-reject', (event) => {
	// detail.files: rejected batch
	// detail.rejections: { file, reason }[]
	// reason: "accept", "max-file-size", or "multiple"
});
```

Rejected replacement attempts retain the validity of the already accepted form value. The picker is temporarily marked `aria-invalid` to associate the rejection feedback with that interaction; this does not make a previously valid file batch fail form submission. A later accepted selection or authoritative assignment clears that feedback. Application-authored files are not silently discarded if constraints change; their form validity instead reports the mismatch.

These checks improve selection feedback only. File names, extensions and MIME metadata do not establish trust. Applications must validate uploads on the receiving server.

## Forms and server rendering

Each selected file is submitted as a real File under `name`, giving repeated entries for multiple files. Empty or unnamed selections submit no entries. Disabled elements and disabled fieldsets omit the field from submission and prevent selection/removal. `required` requires a nonempty selection. `checkValidity()`, `reportValidity()`, `.form`, `.labels`, `.willValidate`, `.validity` and `.validationMessage` follow the shared form adapter. Containing-form validation also reveals the localized error. `focus()` and `blur()` delegate to the native picker. Reset restores an empty selection; applications may cancel the form reset and manage their own default. Restoration accepts a browser-provided File or FormData state, without assuming every browser persists File objects across sessions.

The native file input is present in initial HTML and stays the same node during hydration. A user selection made before hydration is adopted silently, provided the application has not explicitly assigned `.files`. An early selection failing the client constraints produces visible feedback and is not adopted. New user interactions after hydration use `en-change`. No File constructor is evaluated on the server and no local files are embedded in server HTML.

A constructible DataTransfer keeps the native FileList aligned with the model, including programmatic assignments. Older embedded WebViews without a writable FileList may show an empty native picker value; the selected list and form-associated File data remain authoritative. The current desktop/mobile browser matrix is covered by browser tests; real OS pickers and assistive-technology announcements still require device review.

## Labels, localization and themes

Named `label` and `description` slots replace their matching attribute fallbacks. The same-shadow native input references the rendered label and description. To omit a visible label while preserving its accessible name, visually hide `::part(label)` using the same recipe as other fields; do not remove the label text. Description links remain independently usable.

Localize `choose-label`, `drop-label`, `validation-text`, and `constraints-text`, plus the property-only `removeLabel(file)` and `rejectionText(rejections)` formatters. Browser-native picker wording follows the OS language. `drop-label=""` omits the visual drop hint.

The default size is medium without a size attribute; small, large and explicit inherit use shared sizing tokens. Parts expose `field`, `label`, `dropzone`, `control`, `choose-label`, `drop-label`, `description`, `list`, `file`, `file-name`, `remove-button`, forwarded `remove`, and `error`. Surface, input focus, field spacing and shared size tokens supply the design language. The native input remains fully operable in forced colors and the dropzone displays its focus contour without clipping it.

## Larger drop targets

`for="surface-id"` adds a drop surface in the uploader's own document/shadow root.
The native picker and local dropzone remain available. For cross-root composition,
assign `upload.dropTarget = element`; that reference takes precedence over `for`.
Set it to `null` to resume ID lookup. Targets must be connected in the same document.
Changing the reference/ID, replacing the target or disconnecting the uploader
releases old listeners and drag state. ID lookup observes later target insertion.

The nearest associated surface in the event's composed path owns file drags. A
disabled inner uploader rejects its drop rather than passing it to an ancestor.
Two uploaders associated with the same surface reject external drops until the
ambiguity is removed. Non-file drags and events canceled by the application are
left alone. No target becomes a button or keyboard focus stop: the native picker
is the accessible equivalent. Files use the same `en-change`/`en-reject` selection
transaction and constraints whether picked or dropped. File drops replace the
current batch; they do not start a transfer.

Read-only `dragging` reflects on the uploader for application styling. For an
ancestor target, CSS such as `.surface:has(en-file-upload[dragging])` can highlight
its boundary. No classes or inline styles are injected into application targets.
The live example accepts drops over its whole surface and simulates a ten-second
determinate transfer. Cancel, fail, reset and disconnect stop its timer; retry
starts at zero. This simulation is application-owned and sends no files.

Application `error` / `error="…"` invalidates the host and displays associated error feedback independently of rejected-file messages. Clearing it preserves required/file-constraint failures; reset clears files but leaves application errors until explicitly cleared. `name`, `required` and `disabled` reflect. Files have no writable default selection.
