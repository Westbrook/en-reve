# Command palette

`en-command-palette` searches a finite catalog and proposes an application command. It uses one native modal dialog with a search input and listbox in the same shadow root. The highlighted candidate is temporary; the palette has no form value or persistent selected command.

```html
<button id="search-commands" type="button">Search commands</button>
<en-command-palette for="search-commands" label="Project commands"></en-command-palette>
<script type="module">
  import '@en-reve/elements/define/command-palette.js';

  const palette = document.querySelector('en-command-palette');
  palette.commands = [
    { action: 'project.save', label: 'Save project', keywords: ['write'], shortcut: '⌘S' },
    { action: 'project.export', label: 'Export project' },
    { action: 'project.publish', label: 'Publish project', disabled: true },
  ];
</script>
```

The registration entry defines the palette and its declared generated close-control dependencies (`en-button` and `en-icon`). The class-only `@en-reve/elements/command-palette.js` exports `EnCommandPalette` and the TypeScript `CommandPaletteCommand` type without registration. An authored `en-button` trigger needs its own registration. `for` resolves one literal ID in the palette's Document or ShadowRoot. It supports a native button or `en-button`, follows ID replacement, and restores the ARIA attributes it still owns on detachment. The palette inherits the dialog's shared modal trigger controller, including disabled/loading checks, form-submit suppression, cancellation through `en-change`, and explicit opener focus restoration. Its existing trigger-toggle behavior is retained. Programmatic `show()` does not require a trigger. No cross-shadow `aria-controls` is fabricated.

## Searching and executing

Opening focuses the native search input. Search matches all whitespace-separated query terms against each command's label and keywords, without case sensitivity. The first enabled match becomes the candidate; Arrow Up/Down move among enabled results without wrapping. Home/End, selection, editing shortcuts, Tab and Shift+Tab retain native editing/modal behavior. Browsers can include browser chrome at modal Tab boundaries; background page controls remain inert. Native Tab returns to the dialog without changing its open state. Enter or a deliberate result click proposes a command. Filtering, focus, blur and closing never execute one. IME Enter cannot execute; Escape during composition cannot dismiss the modal. Touch scrolling does not activate a row.

Escape and the visible close button propose closing through `en-change`. A canceled action or close retains the current query and candidate. An accepted close clears the filter for next time, deferring native text reconciliation until composition ends if needed. Catalog replacement preserves the query and any still-eligible active action, then chooses the first enabled match if that action disappeared. Removed or disabled commands cannot activate. Empty results have persistent polite text outside the listbox.

`commands` contains unique nonempty `action` IDs, nonempty string `label`s and optional `keywords: readonly string[]`, `disabled: boolean` and `shortcut: string`. Assignment validates and copies the whole array atomically. Reassign to update it. The visible shortcut hint remains part of the option’s accessible name. Shortcuts are display hints; the component does not register them or infer platform bindings. There are no callbacks, HTML labels, routes, network requests, or arbitrary record payloads in this API.

## Application ownership

`en-change` is the single cancelable state-control event. Its `{previous, proposed, reason}` describes boolean `open`; the property is tentative during dispatch. Cancellation restores owned staging, and silent author writes—including equal `.open` assignments—or accepted nested transitions supersede the outer default. Ordinary `show()`/`hide()` return the existing `ChangeOutcome`. Constructors, hydration and authoritative property assignment emit no state event. Direct native dialog closure is terminal, as for `en-dialog`; use `hide()` for a cancelable request.

`en-action` is a separate cancelable command intent, with `{action, data: undefined}`. It bubbles and is composed. It does not mean a save succeeded or an application command has completed. After its full synchronous dispatch, an allowed action requests closing with the `action` reason. Action-handler author writes or accepted nested open transitions suppress that default close. A removed/disabled command after dispatch also blocks default close. Cancellation of the subsequent close leaves the palette open.

A consumer that requires successful dismissal before executing should use one application boundary:

```js
palette.addEventListener('en-action', event => {
  if (event.composedPath()[0] !== palette) return;
  const action = event.detail.action;
  queueMicrotask(async () => {
    if (event.defaultPrevented || !palette.isConnected) return;
    await palette.updateComplete;
    if (event.defaultPrevented || palette.open || !palette.isConnected) return;
    // Resolve authorization and current context again, then execute the app command.
    // A command's destination focus now follows native close/focus restoration.
    executeCurrentCommand(action);
  });
});
```

The reference application deliberately blocks execution when closing is vetoed. Other applications can own their own acceptance policy by canceling the action and using the public surface API. Avoid moving destination focus synchronously before the palette's default close completes.

## Presentation and public surfaces

`label` defaults to `Commands`; optional noninteractive `slot="label"` phrasing supplies the heading. `search-label` defaults to `Search commands`; `placeholder` is empty; `empty-text` defaults to `No matching commands.`; inherited `close-label` defaults to `Close`. The default slot supplies optional supporting flow content after the results; `slot="footer"` supplies optional actions after the body. These authored controls participate in the native modal Tab order. They are separate from the command records; rich result templates are not supported.

The inherited dialog API remains available: `open`, `label`, `closeLabel`, `closedBy`, `dismissible`, `backdropDismiss`, `presentation`, `responsiveQuery`, `show()` and `hide()`. Defaults retain native modal close-request behavior. An absent `size` remains medium without an added attribute; use `size="inherit"` to follow a surrounding size scope.

CSS Parts are `surface` (the native dialog), `header`, `heading`, `close`, `body`, `footer`, `control`, `listbox`, `option` and `status`. The modal shell uses existing overlay hooks. Search uses input/control hooks. The borderless result region uses option-list background, color, radius, padding, gap and height; it does not add a second popup shadow or border. Rows reuse option rest, hover, active, pressed and disabled hooks and their shared target minima. `aria-selected` marks the transient candidate, while paint uses the active hooks; it does not imply execution or persistent selection. Visual-viewport geometry variables are private implementation details.

## Generated content and retained editing

The search input, listbox, result rows and status render eagerly, including while
the palette is closed. Opening uses the current validated catalog. Close/reopen
and removal/reconnection retain the native editor and generated body; accepted
closing resets the query under the existing editing/composition contract.

Removing and reconnecting an already open palette keeps the native input and its
query. Reopening uses native `dialog.showModal()` focus steps, which can reset the
caret range even when the input is retained. The palette does not replay a saved
selection over native focus handling or an application focus handler.

Use the same initial `open` and commands snapshot on server and client. Closed and
initially open SSR both include the search body. An already rendered native editor
retains pre-hydration text and selection under the existing hydration contract.
The surrounding route must supply usable no-JavaScript actions.

Application-owned root code loading remains separate. Loading a definition does
not register it or open a palette. Once registered and updated, each instance
renders its eager body; actual opening still belongs to its native modal lifecycle.

## Server rendering and scope

Render the same finite commands snapshot on server and client using normal Lit property binding and the package SSR integration. Query text has no competing template property writer, and keyed command rows preserve identity across matching catalog changes. The module and initial rendering perform no document queries, ID generation from time, modality changes, fetching or scheduling. The closed SSR surface gains native modality only after client connection and an authored/user open state.

This is a flat, locally filtered command composition. Multi-level menus, command groups, rich result composition, asynchronous providers, virtualization and global shortcuts require separate contracts. A plain-data palette is a deliberate same-root composition choice, not a claim that accessible slotted alternatives are impossible.

Scoped automated results are recorded in the command-family verification artifacts: native editing and modality, composition/reconnect, current catalogs, cancellation, SSR/hydration and emulated touch. Physical-device and manual screen-reader checks remain separate evidence.

### Optional surface motion

`--en-duration-enter` and `--en-duration-exit` default to `0ms`. Pin either independently (managed range 0–500ms in 10ms steps); `--en-ease-enter` and `--en-ease-exit` select their easing. Supporting browsers retain only visual exit paint through native `display`/`overlay` transitions. Accepted state, native modality, focus restoration and the single cancelable `en-change` keep their existing timing. A closed surface is inert; a canceled close stays usable. Reduced motion and engines without the required discrete-transition support dismiss immediately.

Modal surfaces can additionally use `--en-motion-surface-offset` (0, 2, 4 or 8px) and `--en-motion-surface-scale` (.95, .98 or 1). Entry keeps the newly focused content opaque. Drawer placement determines its travel direction; palette centering remains independent.

The palette shares the dialog's vertical travel and centered scale. Its viewport
position uses a centering transform with `transform-origin: 0 0`, so scaling does
not add sideways travel or shift the visual center. Visual-viewport updates keep
their existing positioning and do not measure the animated rectangle.

These hooks animate paint, not application transactions. Do not wait for an animation event to accept a value or execute a command. Reopen, disconnect and a changed reduced-motion preference require no delayed completion callback.
