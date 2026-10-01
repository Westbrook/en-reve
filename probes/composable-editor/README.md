# Composable editor foundation experiment

This is research code, outside package exports and the published documentation
bundle. It does not define `en-token-editor` or trigger providers.

Run `node probes/composable-editor/server.mjs` and open
`http://127.0.0.1:4497/probes/composable-editor/index.html`.
Run browser checks with
`npx playwright test --config probes/composable-editor/playwright.config.ts`.
Build primitives first, then run model checks with
`node --test probes/composable-editor/document.test.ts`.

## Findings

The shipped composer adapter works with an explicitly registered shadow-root
editor without importing its editing implementation. It preserves plain text
and captures detached, deeply frozen structured data. Native textareas retain
existing behavior. Invalid snapshots do not emit send events; registration,
editor replacement, composition and reentrancy guards protect capture.

`document.ts` experiments with a model-owned transaction/history backend. It
normalizes adjacent text, preserves occurrence IDs and unknown token data,
protects grapheme/token boundaries, supports directional selections and one
cancelable en-change, and rejects stale document revisions. Undo/redo includes
selection; authoritative resets supersede older transactions. This model does
not yet reconcile native DOM/IME input and has no persistence/history size policy.

`fixture.ts` experiments independently with native undo. It registers an editor
adapter and keeps token metadata in a local registry while native commands edit
the DOM. Initial browser checks pass for insertion, adjacent-token typing and
undo/redo in Chromium, Firefox and WebKit. WebKit initially failed with
Selection.addRange in the shadow root; setBaseAndExtent corrected that case.

These are alternative history experiments, not two combined history stacks.
The native candidate remains worth pursuing behind private transaction methods;
its use of deprecated execCommand is deliberately not a public contract.
The fixture is NOT a general-purpose serializer: multiline DOM normalization,
clipboard, selection direction, IME, custom renderers, history bounds and real
mobile/assistive-technology behavior still require implementation and review.
Its token metadata map is experiment-lifetime storage, not production retention.
Do not copy this fixture as a production editor.

## Verified scope

- 12 Node checks across the registration/snapshot utility and document model.
- 21 browser checks (seven per engine) for adapter guards, focus, structured send
  snapshots and initial native undo/insertion cases.
- Existing chat suite: 45 browser checks. Chat SSR: two checks.

Next: qualify the editing backend under the remaining cases in
`plans/composable-editor.md`, then implement the optional editor/token registry
and composable trigger coordinator. No provider defaults have been introduced.
