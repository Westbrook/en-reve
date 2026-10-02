# Application-owned form navigation and file selection

The [packed form recipe](../../../probes/form-recipes/recipes.ts) composes shared
helpers into application-owned Lit elements without importing or registering
`@en-reve/elements`. It deliberately keeps native buttons, links, file inputs,
forms and application state visible in the consuming implementation.

## Authored steps and validation links

```ts
import { FormChildrenController, FORM_SLOT_PREFIX }
  from '@en-reve/primitives/interactions/form-children.js';
import { formNavigationStyles } from '@en-reve/styles/form-navigation.js';
```

Create one `FormChildrenController(host, 'steps' | 'errors')` for a Lit host.
Read `view` for rendering and `current()` for synchronous post-listener guards.
Render keyed wrappers from each item's `key`, with a named slot of
`FORM_SLOT_PREFIX + item.key`. Preserve the original authored child nodes; do not
clone rich labels or author reserved slot metadata. Disconnect releases owned
slot assignments; reconnection observes the current children. Cross-parent moves
transfer ownership without letting the old parent remove the new assignment.

`steps` consumes direct `en-progress-step` descriptors. These can be unregistered
custom-tag nodes; their fixed names are the helper's input vocabulary, not an
application-defined schema. Values must be unique nonblank strings. Status is
`pending`, `complete` or `error`; completion is never inferred. Hidden children
are excluded by the consuming renderer; disabled children need disabled native
controls. Rich labels must be noninteractive. The application owns current value,
`aria-current="step"`, navigation policy and panel visibility. Route user changes
through `dispatchChange`, with reversible staging and rollback plus a current
catalog eligibility check. Authoritative property writes are silent.

`errors` consumes direct native anchors with valid same-document fragments.
Render their original slots in a named section/list. The helper preserves link
identity, listeners and rich text; it does not validate or submit a form, intercept
navigation or move focus. The fixture uses native fragment navigation to document
inputs. Applications needing collapsed-panel reveal or cross-root focus must own
that behavior. Nested interactive labels, reserved slots and unsupported hidden
modes produce diagnostics instead of partially rendering a misleading list.

`normalizeProgressItems` also validates data-based steps, but this receipt covers
authored children. Internal SSR plan preparation is not an authoring API. These
client fixtures do not establish SSR or hydration of application-owned elements.

## File constraints and native form ownership

```ts
import { fileRejections } from '@en-reve/primitives/interactions/file-selection.js';
const rejected = fileRejections(files, {
  accept: '.txt,image/*', multiple: true, maxFileSize: 1024 * 1024,
});
```

The helper accepts `File` records and returns frozen rejection records. Extension
and MIME matching is case-insensitive; wildcard MIME families are supported.
Invalid accept tokens are ignored; no valid tokens means no accept restriction.
A file can have several reasons (`accept`, `multiple`, `max-file-size`). A batch
with any rejection should be rejected as a whole, not silently partially accepted.
These are selection-time UX checks, **not server validation or upload security**.

The fixture owns an immutable accepted-file array. Picker, drop and removal route
through one cancelable transaction. Its native `formdata` listener supplies the
accepted files so tentative FormData matches tentative state during dispatch and
rollback restores the previous accepted batch. The native file input is cleared
after selection, permitting reselection of the same file. Author writes and native
form reset reconcile state silently. A disabled consumer rejects user proposals
and contributes no files. Actual transfer, persistence, progress, retry and server
validation remain application responsibilities. An ordinary file input alone
still has native FileList semantics; the helper does not create a form adapter.

## Styling either delivery

Use `formNavigationStyles` and `fileUploadStyles` in Lit `static styles`, or load
`@en-reve/styles/form-navigation.css` and `@en-reve/styles/file-upload.css` into
the owning root. The packed fixture runs the same native journeys in both modes.
The public native recipe classes are explicit markup contracts, distinct from
private classes inside delivered elements.

- Progress: `.en-progress-steps`, `.en-progress-step`, number/text/status children;
  `aria-current="step"` and `data-status` express application-owned semantics.
- Summary: `.en-validation-summary`, title/list children. Override
  `--en-validation-summary-radius` and `--en-validation-summary-padding` in scope.
- Upload: `.en-file-drop` wraps a direct native `.en-file-input` with an associated
  visible label. Hint, error and list use `.en-file-hint`, `.en-file-error`,
  `.en-file-list`, `.en-file-item`, `.en-file-name`, `.en-file-remove`.
  `data-dragging`, `data-disabled` and `data-invalid` reflect actual application
  state; styling alone does not implement these behaviors.

Upload appearance inherits input/control theme properties; local
`--en-control-radius` changes stay within that consumer. The fixture verifies
native keyboard focus decoration, drag boundaries, enlarged narrow RTL wrapping
and forced-color boundary presence. It does not replace theme-wide visual/manual
acceptance or qualify every compact progress disclosure variant.
