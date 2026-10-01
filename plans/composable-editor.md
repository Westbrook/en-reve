# Composable editor and trigger extensions

> Current planning status (2026-09-16): the [accepted follow-up backlog](component-follow-up-backlog.md) supersedes historical next-phase ordering below. Baseline exclusions describe the original pass; newly committed follow-ups are identified in that backlog. Implementation of those follow-ups has not started.

Status: optional editor and extension implementation, 2026-09-15. The initial
text/token slice is implemented and undergoing final cross-browser review. The
existing inexpensive textarea delivery remains available.

## Direction

The user requested Tagarea-like editing with application-composed references,
tools, color chips and trigger interactions. Build an optional editor child
and optional extensions. Keep `en-chat-composer` responsible for layout and
explicit send requests. A textarea remains a supported, inexpensive editor.
Neither references nor `/`, `@`, or `#` have built-in meaning in the base editor.

This work precedes presence/activity. It establishes text plus inline tokens;
it does not complete the separately retained rich-text editor pattern.

## Reference findings

Authenticated GitHub source was read at commit
`820d9ce8a30c72b76505d2b3d4ef6e5a935fb7e0`:

- [Tagarea](https://github.com/reve-ai/reve-core/blob/820d9ce8a30c72b76505d2b3d4ef6e5a935fb7e0/webapp/components/src/tagarea/rv-tagcontent.ts)
  owns editable text, noneditable atoms, logical selection, replacement
  transactions, caret geometry and browser repairs. `value` includes each
  atom's text; it is not a structured identity-preserving document.
- [Composer](https://github.com/reve-ai/reve-core/blob/820d9ce8a30c72b76505d2b3d4ef6e5a935fb7e0/webapp/components/src/chat/chat-composer/rv-chat-composer.ts)
  interprets triggers, owns domain selection and integrates color/reference
  controllers. Selecting a tool can remove trigger text and change application
  state instead of inserting a token. Preserve this distinction.
- The source explicitly handles IME, WebKit anchors and insertion repairs,
  retained selection while a picker owns focus, repeated identical triggers,
  and multiple mounted composers. These are required behavioral cases here.
- Tagarea funnels structural edits through `execCommand` to preserve native
  undo, with a direct-mutation fallback that is not undoable. Do not expose that
  implementation as our public API or silently promise equivalent history.
  [MDN documents both deprecation and the remaining undo use case](https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand).
- Existing source tests are useful case inventory, not evidence that our future
  implementation passes them. No external application dependencies or telemetry
  are to be imported into this library.

## Implemented API layers

1. **Composer/editor adapter.** Replace the composer’s hardcoded textarea tag
   check with an explicit adapter contract. Native textarea and `en-textarea`
   retain existing behavior. An optional structured editor supplies current
   text, disabled/readonly/composition state, validation, focus and a synchronous
   immutable send snapshot. Unknown custom elements opt in through an adapter;
   a random element with a `value` property is not automatically an editor.
2. **`en-token-editor`.** Own text, inline token boundaries,
   selection, transactions, history, clipboard and accessible editing. Allow
   use without a chat composer. Expose `value` as plain text and a versioned
   `document` as text/token runs. Setting `value` deliberately replaces the
   document with plain text. Never use labels or rendered HTML as token identity.
3. **Token definitions.** Register arbitrary namespaced token types with stable
   occurrence IDs, application data, a plain-text fallback, accessible text and
   a renderer. A reference, color or tool token is a definition supplied by the
   application, not a base dependency. Unknown types remain readable through
   their fallback and retain their data on round-trip.
4. **Trigger extensions.** `en-editor-trigger` associates using
   `for` in the same tree scope, with an element property for cross-root use.
   An equivalent JS registration API returns a disposer. Both use one local
   registry; declarative and imperative paths must not cause duplicate handling.
   Add/remove/reconfigure extensions over time and close their active sessions
   when disabled, retargeted or disconnected.
5. **Picker adapters.** A trigger can compose application-authored option lists,
   custom elements or an interactive picker. It owns matching/provider/presentation
   policy; the coordinator owns exclusive sessions and editor insertion ranges.
   List selection and a multi-control color picker have different focus contracts.

Composition uses a declarative association with an application-provided extension
object; `editor.registerExtension(extension)` is the equivalent imperative path.
The initial picker contract is `provide({query, signal})` for list choices or
`render(session)` for interactive popup content or synchronous `open(session)`
for an application-owned/native picker. Arbitrary child picker adapters remain
a possible future addition, not an implemented contract.

```html
<en-chat-composer>
  <en-token-editor id="draft" slot="editor" label="Message"></en-token-editor>
</en-chat-composer>
<en-editor-trigger for="draft"></en-editor-trigger>
```

```ts
trigger.extension = {
  id: 'references', trigger: '@', label: 'References',
  provide: async ({query, signal}) => findReferences(query, signal),
};
// Choices contain id, label, optional description, and insert runs or action/data.
// Interactive pickers call session.commit(choice) or session.cancel().
```

`document` is `{version: 1, runs}`. Each run is plain text or an atomic token with
`id`, `type`, `text`, `label`, and JSON-compatible `data`. Toolbar buttons open the
same registered extension via `openExtension(id)` without inserting a trigger.

Limit persisted token data to a validated JSON-compatible subset; renderers and
DOM nodes belong to the local registry. An occurrence ID is distinct from a
reference/entity ID inside `data`. One document operation inserts, updates or
removes a token. Tokens cannot contain an independently editable region.

Custom renderers may supply richer visuals, including custom elements, but the
editor owns their atomic wrapper and edit boundaries. Do not promise retained
DOM identity/listeners across paste or undo; re-materialize through the registry.
Interactive token editing uses a named action/picker rather than introducing
uncontrolled Tab stops inside each token. Color conveys a textual value too.

## Session and transaction requirements

- Match text around the caret after input, not just keydown; account for mobile
  input, composition commit, paste and selection movement. Default boundary
  matching avoids email addresses and URL slashes; custom matchers opt into other
  rules. Define deterministic priority for overlapping matches.
- A session includes an ID, document revision, logical target range, query and
  AbortSignal. New queries abort old work. Results must still match the session,
  query and revision when selected; reject stale insertion rather than replacing
  unrelated text. Initial implementation may cancel on unrelated edits instead
  of attempting unsafe rebasing. Offset snapshots alone do not track edits.
- Completion supports replacement text, a typed token, or an application action.
  A tool action does not automatically insert a chip. Remove trigger text only
  as part of accepted completion; cancellation preserves the draft.
- List pickers retain editor focus and coordinate Arrow/Enter/Escape behavior.
  A color picker that needs actual focus saves/restores a valid editor selection.
  Popup roles and relationships must be valid across Shadow DOM. Do not assume
  the existing input-owning combobox can simply be nested inside the editor.
  Use [APG popup focus guidance](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)
  as a baseline and verify this multiline/token context separately.
- Escape closes the current session without sending or canceling an ancestor
  dialog. A later deliberate trigger can reopen it. Plain Enter remains newline;
  an active picker consumes its selection keys before composer send shortcuts.
- Color previews do not create a history entry per slider movement. Commit is
  one edit; cancel restores the prior token/draft. Send must either synchronously
  settle an explicitly committable preview or be unavailable, never capture stale
  state or silently select an unresolved suggestion.
- `en-input` describes draft editing; use the library’s single cancelable
  `en-change` for committed document changes. Do not add `controlled` or a paired
  request-change event. A canceled semantic commit restores document and selection
  without overwriting a newer author write. Native composition must not be torn
  down to force rollback on every composing keystroke.
- Keep `en-action` for send and application commands. Preserve existing
  `data.value`; optional structured snapshot data must be detached from live
  editor/token objects. Draft restore and failed-message Retry use that snapshot.

## Editing, delivery and performance boundaries

The implemented editor uses immutable model transactions and a bounded 100-edit
history. Native undo remains only in the source experiment. `beforeinput` alone is not proof of complete
IME/undo support. No silent non-undoable user-edit fallback is acceptable.

Use plain text for unknown/untrusted paste by default. Opt-in structured
clipboard data needs schema/version validation and readable plain-text fallback;
never import clipboard HTML as executable application markup. Initial server
HTML exposes readable text/tokens; hydration must not replace edits made before
upgrade or run optional providers. Live arbitrary editable-DOM mutation is not
the document API; authored extension children remain reactive.

Only the optional editor loads the editing backend. Only installed extensions
perform matching. Observe selection while the relevant editor/session is active;
abort and disconnect on teardown. Avoid whole-document DOM replacement on each
keystroke. Popup geometry updates only while open, including nested scroll, resize and the
visual viewport on mobile. This slice anchors to the editor surface; precise
caret anchoring remains a follow-up for long multiline drafts.

## Implementation sequence and acceptance

1. Editor adapter plus editing-model spike: text/token transactions, selection,
   atomic deletion, Unicode, native composition and reliable undo/redo. Keep the
   existing textarea path covered. Do not publish an incomplete editing contract.
2. Optional editor, token registry and trigger coordinator with provider add/remove,
   abort/stale handling, command-vs-insertion completion and picker adapters.
3. Rich isolated example: `@` references, `/` tools and `#` color chips, all supplied
   externally; toolbar equivalents and structured send/retry snapshots. Include
   plain editor comparison, child-authored and JS registration code samples.
4. Cross-browser/SSR coverage and themed narrow layouts; integrate API docs,
   Sticker sheet and Chat workflow, refresh theme artifacts and publish for review.

Required cases: neighboring/first/last tokens; forward/backward selection;
Backspace/Delete; wrap boundaries; emoji/combining text; paste/cut/copy; undo/redo
after typing/insertion/removal/canceled changes; IME; disabled/readonly; multiple
composers; provider removal; repeated identical triggers; async result races;
Escape/Tab/focus return; nested dialogs; mobile keyboard/viewport scrolling;
structured draft restoration and retry; SSR/hydration and safe unknown types.
Use Chromium/Firefox/WebKit automation and accessibility snapshots, with actual
VoiceOver/iOS and Android editing acceptance tracked separately.

Formatting commands, collaborative editing, recording and network transport
remain separate scope. This foundation should support later rich-text work,
without presenting that larger pattern as completed.

## Implementation and review checkpoint

`en-token-editor` and `en-editor-trigger` are registered optional elements. The
standalone `/api-examples/composable-chat` page includes async references, tool
tokens, a native color chooser, toolbar entry points, undo/redo and structured
draft restoration. All three concepts are authored in the demo. The full sample
is below it; the sticker sheet, Chat workflow and API guide link to this delivery.

Browser qualification covers native typing, token insertion/deletion, cancellation,
stale providers, multiline plain-text paste, bounded history, disabled/readonly,
custom picker focus and Tab order, and SSR/hydration. Composition tests verify
transaction guards and deferred author writes; they do not simulate a real IME.

Still required for broader editor acceptance: actual iOS/Android keyboard and
IME sessions, VoiceOver token navigation, long-draft caret anchoring, and richer
clipboard interoperability. Current copy/paste intentionally exports/imports
plain text; it does not promise cross-application structured token transfer.
Formatting, collaborative editing, arbitrary child picker adapters and a full
rich-text editor remain separately tracked scope. Presence/activity is next
once this initial editing delivery is reviewed.

## Tool keyboard follow-up

Toolbar entry now restores editor focus and preserves the selected replacement
range, so Arrow/Enter handling works immediately. The live demo inserts tool
tokens, including their tool IDs in the structured snapshot. Action-only choices
remain supported for consuming applications that want commands without chips.

## Native color and token editing follow-up

The color extension opens the browser-native chooser synchronously on `#`, with
native input activation as the fallback for absent/rejected `showPicker()`.
Its matcher only opens on a bare trigger, so continuing a canceled `#draft`
does not reopen the chooser for every letter. A swatch has an accessible color
label and plain-text hex fallback, without visible hex text.

`registerToken(type, renderer, {extension})` opts into an editor-owned native
button wrapper. Clicking or keyboard-activating it opens that extension with
`session.token`; preserving the token's occurrence ID replaces that exact chip.
`openExtension(id, {tokenId})` provides the equivalent application entry point.
Insertion/update is one undoable, cancelable transaction. Cancel preserves the
trigger or existing token, and focus returns to the editor or edited chip.

`open(session)` preserves transient activation for native APIs and also permits
an application-owned picker. It owns focus/dismissal and calls commit/cancel;
session.signal ends listeners and invalidates stale completion. The existing
`render(session)` contract provides a custom themed dialog with editor-managed
focus/escape handling. Neither installs a color concept in the base editor.

The demo commits on native change, not every preview input event. Native chooser
cancellation is inconsistent between platforms; the next page interaction also
cancels any uncompleted session. Browser tests stub showPicker and exercise real
DOM/input/session transitions; actual OS chooser appearance and mobile keyboard
behavior require manual review. See the platform contracts for
[showPicker](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/showPicker)
and [color inputs](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/color).

## Token styling and edit-to-trigger review

All tokens now share inline-flex geometry, wrapping, a subtle surface and a
visible boundary. Interactive types add hover/pressed, protected touch targets
and the button focus family. Focused chips paint above adjacent chips.
`token`, `token-interactive`, `token-content`, and an optional registered Part
provide a deliberate customization surface without exposing editing mechanics.
Ten `component.editor-token.*` managed settings cover paint and geometry and
round-trip through paired theme JSON/CSS. See [the theme audit](token-theme-review.md).

`editToken(id, {query})` converts a token to registered trigger plus query and
opens its picker. Per-type `deleteBehavior: 'edit'` opts collapsed adjacent
Backspace/Delete and focused-chip deletion into trigger restoration. Default
behavior still removes an atom; selected ranges always remove normally. A
canceled conversion preserves the atom. Escape preserves restored editable
text and Undo restores the atom. Re-picking creates application-supplied token
data; no hidden live mutation of a reference's identity is implied.

This deliberately stops short of nested contenteditable token contents, which
would require new validation, selection, history and IME contracts. Existing
click-to-picker editing retains occurrence IDs when the application supplies
them. Reference, tool and color demos enable trigger restoration for review.

### Picker layout follow-up

Suggestion keyboard guidance is described by the editing surface without adding an in-flow line when a session opens. External pickers receive `session.getAnchorRect()` for the edited occurrence or caret, falling back to the editor. The native color fixture positions its input at this rectangle synchronously before opening; native window placement remains browser-owned.

### Color typeahead and custom option contents

The application color extension can use native-first (default) or typeahead-first delivery. Typeahead includes named palette entries, three/six-digit hex previews and up to five recent accepted colors. A native-picker choice retains the active query replacement range and cancellation lifecycle. Generic `renderOption`, `select` and `session.openPicker` support this composition without color semantics in the editor. Rendered option contents must be noninteractive; the editor owns names, roles, active state and keyboard behavior.

Application color renderers expose `color-swatch` and `color-option-swatch` Parts. Geometry, borders and layout use application CSS; only the selected background is inline. Consumers can override the Parts or replace the renderer through registerToken/renderOption.

### Narrow review selectors

The theme selector gets a larger wrapping flex basis so typical theme names fit on mobile. Library selects use a native button/selectedcontent child for base-select's shrinkable, single-line label with ellipsis and a separate caret. Native fallback and accessible option names are preserved; open customizable pickers can wrap long labels. selected-button and selected-content Parts expose this anatomy.

Option labels use escaped static text so native selectedcontent cloning cannot duplicate Lit SSR markers. Cross-browser tests cover hydration, live label updates, one Tab stop, LTR/RTL truncation, and native picker/fallback behavior.

### Reusable color picker (authorized September 15)

Implement en-color-picker for opaque sRGB with hex and native RGB range controls,
shared input/range/focus theme styling, geometry properties and per-channel Parts.
One cancelable en-change exposes provisional value; authoritative writes supersede
rollback. Invalid draft hex does not change the accepted color. The picker is inline,
with application-owned palette/recent slots, form integration and popup/commit policy.

The editor demo now defaults to render(session) with this picker. Typed hex and exact
palette names update the preview; matching/recent choices sit within the picker. Enter
or ArrowDown delegates focus to the custom picker via data-picker-focus. Apply inserts
one undoable token; Escape/Cancel preserve the original chip or typed query. Native
and menu typeahead modes remain explicit alternatives. Picker changes do not bubble
as composer document changes; Apply commits through the editor session.

Deferred: alpha, wider color spaces, two-dimensional color area, and additional visual
color models. Native keyboard controls provide an initial portable touch/AT baseline;
physical mobile keyboard, OS picker and screen reader review remain manual.

### Color channels and tabbed choices — September 15, 2026

The color editing slice now includes `en-color-slider`, HEX/RGB/HSL input presentation, and optional alpha editing. Public values remain canonical sRGB hex (six digits, or eight with nonopaque alpha). Switching presentation never rewrites the accepted color; hiding alpha preserves transparency. HSL retains powerless hue while editing gray/black/white. Each channel gradient varies only that channel; alpha and transparent previews use checkerboard tiles.

The composer extension presents Picker and Chips tabs with shared Apply/Cancel actions. Switching tabs preserves pending edits. Apply validates the picker and commits one undoable token edit; dismissal retains the query or original token. The native alternative preserves existing alpha while choosing RGB. The editor now prioritizes an explicit `data-picker-focus` target over earlier tab stops when Enter/Arrow Down enters a custom picker.

All slider behavior remains reusable independently: native keyboard handling, exact numeric input, form association, cancelable changes, RTL/vertical direction, safe hex gradient stops, CSS Parts and managed geometry/checker tokens. Wider color spaces and two-dimensional color areas remain separate follow-ups. Physical iOS/Android, VoiceOver and native OS picker behavior remain manual review items.

#### Small composed color fields

HEX and exact channel inputs now compose `en-text-field size="small"`. Range handles retain their independent target sizing. Numeric channel text remains a draft until Enter/blur and validates finite numeric syntax, bounds and steps before changing the color; the nested string events stay local. `hex-field` and `channel-field` Parts expose the hosts, while existing input Parts are forwarded through the added shadow boundary. `en-slider` retains its existing native number editor through an internal template hook.

#### Chat color picker arrangement

The chat extension applies its layout using forwarded CSS Parts in the application's shared Lit stylesheet. At 40rem of available picker content width, the summary and formats occupy the left column and channels the right; narrower containers stack summary, format controls and channels. The color preview stretches alongside the summary. Cancel precedes Apply, aligned at the end of the footer. DOM order follows summary → formats → channels so keyboard order agrees with the visible reading order. The standalone picker retains its single-column layout. `preview-frame` is a reusable Part for the checkerboard backing.

## Rich text continuation

The [rich text editor plan](rich-text-editor.md) now schedules shared extension-host,
selection/bookmark and command contracts across the token editor, rich editor and
composer. The first formatting slice includes both persistent and selection-contextual
toolbars. Existing text/token documents and public provider APIs remain compatible;
block-document editing does not change the version-1 token schema.
