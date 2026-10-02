# API-05 — Editor state, payload ownership and request outcomes

Status: implemented and published for review. User review remains separate.

## Editor text and focus

Both editors expose `value` as the plain-text projection of `document`, readonly
`composing`, and readonly `draftValue` for the current native text. Before rendering
or mounting, `draftValue` falls back to `value`. `en-input.detail.value` carries the
native draft, with `isComposing` and `inputType`. An unfinished native composition
no longer makes token-editor `value` disagree with its document. During a tentative
`en-change`, both document and value still expose the proposal; a veto rolls it back.
These reads do not override the existing API-01/API-02 transaction rules.

```ts
// Before: token-editor value could include an unaccepted IME draft.
const preview = editor.value;

// After: choose the state your application needs.
const acceptedText = editor.value;
const livePreview = editor.draftValue;
editor.addEventListener('en-input', event => {
  renderPreview(event.detail.value, event.detail.isComposing);
});
```

Editor, toolbar and composer focus APIs retain the DOM-compatible
`focus(options?: FocusOptions): void` signature. Toolbar forwards the options to
its first eligible control after `updateComplete`. Token editor focuses its textbox
synchronously once rendered and does nothing beforehand. Rich editor does nothing
until its asynchronous backend mounts; once mounted it forwards supplied options
and restores the model selection. `updateComplete` alone does not promise that the
rich backend has mounted. No new readiness promise or implicit queued editor focus
is introduced. Readiness is distinct from the return value of `focus()`.

## Immutable editor action data

Both editors detach and deeply freeze `EditorChoice.data` before dispatching
`en-action`, matching composer send snapshots. Providers retain ownership of their
input object; listeners can retain the event snapshot for asynchronous work without
later provider mutations changing it. The shared `snapshotEditorData` primitive
copies JSON values and rejects invalid/cyclic data with `TypeError` before dispatch.
An omitted payload remains `undefined`; `null` remains `null`. No general-purpose
cloning is applied to unrelated events or application objects.

```ts
editor.addEventListener('en-action', event => {
  // Stable, detached JSON snapshot. It is safe to retain but cannot be mutated.
  const requestData = event.detail.data;
  queueMicrotask(() => handleAction(requestData));
});
```

Cancellation and post-callback session checks remain in force. An accepted action
request does not promise application work, transport, or message delivery completed.

## Navigation outcomes and reveal

| API | Result |
| --- | --- |
| `carousel.requestGoToKey(key)` | `committed`, `unchanged`, `canceled`, `superseded`, or `not-found` |
| `feed.requestGoToPage(page)` | `committed`, `unchanged`, `canceled`, `superseded`, or `unavailable` |
| Existing `carousel.goToKey(key)` | Preserved: true means the key exists, including when navigation is vetoed |
| Existing `feed.goToPage(page)` | Preserved: true only for `committed`; false for no-op, veto, supersession or unavailable input |
| Tree/table/feed `scrollToKey(key, options)` | Preserved reveal contract; not a semantic selection or focus command and not a scroll-completion promise |

`ChangeOutcome` retains its existing meaning: committed is an accepted semantic
change, unchanged needs no proposal, canceled was vetoed or became ineligible, and
superseded yielded to an authoritative write or accepted nested change. Carousel
missing keys do not dispatch. Feed unavailable means authored mode/no data array or
a nonfinite page; finite pages retain existing clamping to the loaded page range.
A valid empty feed remains page 1. A carousel with several visible slides or paged
reading navigates to its existing normalized leading position, so a requested key
may be visible without becoming the leading key. Connect and await the initial
render before navigation requests so the carousel has established its layout.

```ts
const outcome = carousel.requestGoToKey('slide-3');
if (outcome === 'committed') updateNavigationStatus();
if (outcome === 'not-found') showMissingSlide();
```

Rendering and smooth scrolling can continue after `committed`. Reveal methods may
switch to a containing page, but do not select records, expand tree ancestors, or
move focus. `composer.requestSend()` still reports request acceptance;
`feed.requestOlder()` still reports load-request acceptance. Use the established
load status protocol for loading completion, and application transport state for
message delivery. No Boolean changes meaning silently.

## Vetoable disclosure requests

`en-accordion-item`, `en-navigation` and `en-navigation-group` now expose
`requestOpen(open: boolean): ChangeOutcome`. Existing `open` assignments remain
silent authoritative writes. The new method proposes `en-change` with reason `api`.
Unchanged requests emit no event. Navigation retains terminal `en-toggle` after an
accepted change; it does not signal animation completion. Navigation's `open` is
retained compact state even while its wide layout remains expanded.

```ts
item.open = true;                    // Authoritative, silent assignment.
const outcome = item.requestOpen(true); // Vetoable request with an outcome.
```

Grouped accordion items delegate to their owner: one group event carries the
proposed open-key array, with no duplicate child Boolean event. Single/multiple
selection policy, disabled items, removal during dispatch, author writes and nested
requests retain their transaction guarantees. Disabled item requests are canceled.
Call after connection and the group's initial render/slot reconciliation. Existing
overlay show/hide and split-pane collapse/restore methods are unchanged.

## Compatibility and next release

Keep package versions at `0.1.0` for the private review iteration. The next package
release must explicitly record the token-editor IME `value` semantic change and
editor-action payload identity/immutability change as breaking behavior under the
pre-1.0 minor-train policy. Use `draftValue` or `en-input` for live previews; stop
mutating event data or comparing its object identity with provider data. Compare
stable application IDs instead. The new methods/getters and focus-option forwarding
are additive; existing Boolean navigation remains available.

## Verification

The focused cross-browser suite covers composition draft separation, focus options,
action snapshot ownership and recovery, all navigation outcome paths, grouped
accordion ownership and navigation disclosure notifications. Synthetic composition
checks do not establish physical IME or assistive-technology acceptance.

Run `npx playwright test --config probes/api-outcomes/playwright.config.ts`.
Build, metadata, type-consumption and integration results are retained under
`artifacts/api-05/` in the implementation workspace.

Verification receipt: 75 API-05 browser cases, 126 existing transaction cases,
63 existing editor cases, and 237 built-demo cases passed across Chromium, Firefox
and WebKit. Two WebKit theme cases exceeded the 25-second total timeout in the
parallel run and passed on a single-worker rerun. All 100 primitive tests, 3 editor
SSR checks and 40 tooling tests pass. Primitive/element/SSR builds, TypeScript
consumer checks, metadata freshness and the documentation build pass.

Publication verification used an isolated checkout containing only API-05 over
main. Its full workspace build and customization checks pass. The earlier shared
checkout failures belonged to concurrent sizing changes and are excluded from
this release. The isolated release also repeats API-05 browser, primitive, type
and tooling checks.
