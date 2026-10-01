# Rich editor and document scrolling migration

Implemented on an isolated branch from local main `6b625021e8542ab07f3f50f30ffd3bb54e8c39eb`.
Implementation commit: `28df0b53761573d9962d17253a09946e854d0a2b`.
Local-main source integration commit (fast-forward): `28df0b53761573d9962d17253a09946e854d0a2b`.
A documentation/evidence-only follow-up records this receipt; runtime source is unchanged.
The integration receipt in `artifacts/rich-editor-scroll/integration.json` records
exact implementation/integration commits and preservation checks.

- **Portable document import:** `@en-reve/elements/rich-document.js` exports
  `decodeRichDocument`, `richDocumentText`, `richDocumentFromRuns` and the public
  types. The version 1 format is unchanged. Results are detached and deeply frozen;
  Unicode is preserved exactly. Defaults: 1,000,000 serialized UTF-8 bytes, 10,000
  rich nodes, depth 32. Codec limits are configurable; editors use the defaults.
  Validation now rejects unknown fields and other non-JSON/non-schema input that
  the old ProseMirror-only boundary could ignore. Existing editor imports remain.
- **Ranges:** `@en-reve/elements/rich-text-editor.js` exports `RichRange`,
  `RichRangeDecoration` and `RichRangeReplacement`. Capture with `captureRange()`;
  validate, decorate, clear or replace with `validateRange`, `decorateRanges`,
  `clearRangeDecorations`, `replaceRanges`. Every range carries `revision` and exact
  `expectedText`. Readable coordinates use UTF-16, newline block boundaries and
  token fallback text; structured coordinates use node positions. Whole tokens
  are supported, partial tokens/graphemes are rejected. Multiple replacements
  share one cancelable undo step; nonempty replacements inherit the first selected
  inline node's formatting. Decorations leave focus, selection and history alone.
- **Commands:** import `createEditorCommandMatcher` from
  `@en-reve/elements/editor-command-matcher.js` and pass it to the existing
  `EditorExtension.match`. Exact prefixes of known multiword names are admitted;
  unrelated names, escaped triggers and path/URL continuations are excluded.
- **Clipboard:** `registerToken(type, renderer, {importToken(token, context)})`
  works in both editors. Hooks receive original source occurrences; the frozen
  `context.scope` is shared for one paste, suitable as a WeakMap key for repeated
  reference reconciliation. Return a valid token or `undefined` for original
  fallback text. Destination IDs are always editor-owned and fresh. Throwing or
  invalid hooks make the entire structured paste fall back to `text/plain` as one
  cancelable undo step. Application authorization and business identity stay outside
  En Reve. Callback side effects outside the editor are application-owned.
- **Document collections:** pass `document.scrollingElement` to the existing
  `VirtualCollectionController.viewport` option. Use `occludedBlockStart/End` for
  sticky surfaces. Preceding siblings/ancestors are observed for resize; pure
  transform/absolute-position changes require `refresh()`. Offscreen collections
  do not pull the page to their old anchor. `focusTarget` configures recovery;
  document mode defaults to the content. Disconnect restores temporary styles,
  tabindex and observer/listener ownership.

For a minimal public range edit after assigning a document:

```ts
import {richDocumentFromRuns} from '@en-reve/elements/rich-document.js';
import '@en-reve/elements/define/rich-text-editor.js';
const editor = document.querySelector('en-rich-text-editor')!;
editor.document = richDocumentFromRuns([{kind: 'text', text: 'Alpha'}]);
const range = {
  coordinate: 'text' as const, from: 0, to: 5,
  expectedText: 'Alpha', revision: editor.revision,
};
if (editor.validateRange(range)) {
  editor.decorateRanges([{id: 'proposal', range}]);
  editor.replaceRanges([{range, runs: [{kind: 'text', text: 'First'}]}]);
}
```

Full contracts and copyable examples are in
[`packages/elements/docs/rich-capabilities.md`](../packages/elements/docs/rich-capabilities.md)
and [`packages/primitives/docs/virtual-collection.md`](../packages/primitives/docs/virtual-collection.md).
Production documentation includes `/rich-capabilities.html` and
`/document-scroll.html` (`?element` selects the element-scrollport comparison).
Append `?progress-report` to expose the trusted Developer UI return link.

## Reuse and fixes

Ported only the audited codec, range resolver/methods, command helper, token import
plumbing and document-scroll changes. Retained the existing document format,
ProseMirror validation/history, extension matching hook, clipboard envelope,
virtual range model and document-aware reveal helper. Generated public metadata
was rebuilt from isolated source, never copied from the dirty checkout.

Fixed Select All capture, plain-to-bold replacement, source occurrence loss,
fixed-clock ID reuse, inconsistent hook exceptions, layout changes without scroll,
instant reveal anchoring, document focus recovery and teardown. The committed
range fixture has no external application override or dependency.

## Verification and limitations

See `artifacts/rich-editor-scroll/verification.json` for commands, counts, source
hashes, before/after evidence and qualification logs. Browser tests cover Chromium,
Firefox and WebKit, with desktop and 390px collection viewports and built package
consumption. The baseline clipboard formatting test included bold supporting
instructions in two selectors; it was reproduced on unchanged main and corrected
to inspect textbox content without changing the expected formatting.

Real-device/OS clipboard permissions, native IME sessions, touch gestures and
assistive-technology reading-cursor behavior remain manual checks. Synthetic
clipboard/composition events and Playwright DOM focus assertions do not establish
those results. Existing user review and accessibility feedback remains open.
Nothing was pushed or published.
