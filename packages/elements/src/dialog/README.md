# Overlay implementation and review

The four class-only entries are `dialog/index.ts`, `drawer/index.ts`, `popover/index.ts`, and `tooltip/index.ts`. They do not register names. Native layers remain inside their component's themed tree; no portal or style cloning is used.

```html
<button id="review-changes" type="button">Review changes</button>
<en-dialog for="review-changes" label="Review changes" closedby="closerequest" presentation="responsive">
  <p>Review the proposed token changes before adopting them.</p>
  <div slot="footer"><button type="button">Adopt changes</button></div>
</en-dialog>

<button id="theme-options" type="button">Theme options</button>
<en-drawer for="theme-options" label="Theme options" placement="end">
  <p>Settings and contextual actions go here.</p>
</en-drawer>

<button id="share-options" type="button">Share options</button>
<en-popover for="share-options" label="Share settings">
  <p>Nonmodal settings or supplementary actions.</p>
</en-popover>

<button id="history-help" type="button">History</button>
<en-tooltip for="history-help">
  <span slot="content">View previous revisions</span>
</en-tooltip>
```

All four expose `open`, with `show()` and `hide()` methods. These methods and user interactions dispatch one bubbling, composed, cancelable `en-change`, carrying `{previous, proposed, reason}`. During that event, `open` exposes the proposed state. Calling `preventDefault()` restores the previous state unless the application writes `open` during dispatch, including a same-value write. Direct property assignments emit no event and remain authoritative. The native top layer, modality, focus, and trigger ARIA updates wait until the proposal settles; a rejected proposal never briefly opens or closes a native surface. Cancel synchronously before awaiting application approval, then assign `open` when the application has decided. There is no `controlled` attribute or separate request event.

Dialog and drawer accept optional `for` (also the `.for` property): one literal ID identifying a native `button` or `en-button` in the same Document or ShadowRoot. The connection follows late insertion, removal, ID replacement, and root moves. Activation requests opening with `en-change` reason `trigger`; it does not toggle an already-open dialog or drawer. The associated button receives `aria-haspopup="dialog"` and accepted `aria-expanded` state. Detaching restores attributes only while the controller still owns their values. No cross-shadow `aria-controls` is fabricated.

Disabled, loading, detached, rebound, or already-canceled click triggers do not open the modal. A valid associated activation prevents the button's native form-submit default. To cancel opening reliably regardless of click-listener registration order, cancel `en-change`; direct application writes to `open` remain authoritative. Trigger IDs are revalidated after event handlers run. Association installs browser listeners after connection and is safe during SSR; server content does not require an opener to render.

An accepted trigger opening restores focus to that actual opener, including Safari pointer clicks that do not first focus the button. `show()` and direct `open` assignments retain the previous-focus behavior without requiring `for`. Removed, hidden, disabled, or inert openers are skipped. Rejected or author-superseded proposals do not retain an explicit opener.

Dialog and drawer use native `showModal()`, background inertness, and modal focus behavior. `closedBy` / `closedby` accepts `any` (outside pointer and platform close requests), `closerequest` (platform close requests), or `none` (explicit developer actions only). The default is `closerequest`. Native `cancel` is prevented synchronously before the tentative library change is dispatched. Where native `closedBy` is unavailable, the adapter checks pointer down/up on the backdrop and guards native Escape cancellation against the selected policy. Dragging from content to the backdrop does not dismiss. The compatibility alias `backdropDismiss` / `backdrop-dismiss` selects `any`; setting it false selects `closerequest`. These semantics follow the [native closed-by contract](https://html.spec.whatwg.org/multipage/interactive-elements.html#attr-dialog-closedby) and [light-dismiss algorithm](https://html.spec.whatwg.org/multipage/interactive-elements.html#dialog-light-dismiss).

A native `close` notification has already removed modality and restored native focus. Calls to the private dialog's `close()` and native `method="dialog"` form submission therefore reconcile the host to closed without emitting a cancelable event or reopening the modal. Use the host's `hide()` to request an interceptable close; cancel a native form's `submit` if that application flow needs approval.

`closedBy='none'` retains the visible close action, since that is an explicit developer-provided mechanism. The legacy `.dismissible = false` switch disables that visible action as well as platform/backdrop requests; supply another accessible completion path. `close-label` is application-localizable. A meaningful visible title is required. Dialog, drawer, and popover accept noninteractive phrasing in `slot="label"`; when unassigned, the slot falls back to the `label` attribute. The actual same-tree heading names the surface, including after slot content changes.

The drawer reuses dialog behavior and markup. `placement` accepts `start`, `end`, `left`, `right`, `top`, or `bottom`; start/end follow writing direction, while physical edges stay fixed. Dialog close restores the accepted associated opener, or the previously focused element for imperative opening, when still available. Browser chrome remains accessible according to native dialog and platform keyboard behavior.

Dialog presentation stays centered by default. Opt in with `presentation="responsive"` to use a bottom drawer when the media query matches. `responsive-query` accepts a media query override; its published default is generated from the `layout.dialog-collapse` token. This changes geometry on the same native dialog, preserving focus, edits, modality, and dismissal policy without emitting an open-state event. The query listener is installed only in a connected browser instance, and is removed on disconnection.

The same opt-in works on `en-drawer`: narrow views use bottom placement, while
wider views retain the authored `placement`. The public placement value does not
change during resizing. With the default presentation, the chosen edge stays in
effect at every viewport size. Choose responsive presentation for short mobile
tasks; long inspectors can retain a side or full-height presentation.

Drawer surfaces have no inset perimeter border. A token-colored outside separator
is visible only where the surface meets the page; the viewport clips it at attached
edges, including full-width drawers. It remains visible in forced colors. This
decoration does not replace the immediate focus indicator or descendant focus
clearance. `--en-overlay-border-color` controls its color and `::part(surface)`
remains available for a different surface treatment.

Popover uses deliberate nonmodal dialog semantics and requires a meaningful `label`. It uses the manual native Popover API, with explicit Escape and outside-pointer requests before committing close. An external native `hidePopover()` is likewise a completed native transition: the host silently reconciles to closed and releases its observers without moving focus. Native button triggers receive `aria-haspopup="dialog"` and `aria-expanded`. Connect an external native `button` or `en-button` by setting `for` to its ID; there is no trigger slot. `en-button` forwards these public host ARIA attributes to its native semantic control; the overlay uses only host events, geometry, attributes, and the public focus method. Opening from that trigger restores it after an in-surface dismissal when it remains connected and usable; outside pointer dismissal does not steal focus back.

`for` is a literal ID, also available as the JavaScript `.for` property. It resolves only in the overlay's own `Document` or `ShadowRoot`, independently of nesting or sibling order. Keep IDs unique in that root. It does not search through other shadow roots or fall back to the outer document. A root-scoped resolver handles late insertion, replacement, ID changes, and reconnection; changing `for` releases the old trigger's listeners and component-owned accessibility attributes. A popover and tooltip can refer to the same button. The button stays in the application's layout, and each overlay's content inherits the theme where the overlay is placed.

For a popover, an initial `open` with no valid trigger waits for one. Dialogs and drawers can open without a trigger. An already visible popover whose trigger disappears keeps its content and focus at the last valid position until dismissed or rebound. Rebinding repositions the same surface without moving focus or committing a new open state. The original opener remains the focus-return target when it is still usable; a removed opener is never focused. Keep application-specific focus recovery with the application when that opener no longer exists.

Tooltip also uses the manual native Popover API, without moving focus. It uses the same external `for` relationship and accepts one noninteractive phrasing element in `slot="content"`. The actual light-DOM content receives an ID and `role="tooltip"`; the button's `aria-describedby` refers to that real same-tree element. For `en-button`, the button forwards those resolved elements to its native semantic control with `ariaDescribedByElements`, keeping the relationship real across the enclosing shadow boundary. Existing description references are preserved. On disconnect, attributes added by the component are removed. Keyboard focus opens immediately. Hover uses `show-delay` (300 ms by default), `hide-delay` (150 ms), and a geometric pointer corridor in either direction across the gap. The corridor follows the exit point, destination bounds, and movement toward that destination; it never intercepts underlying pointer actions. `transit-duration` bounds time in the gap (1000 ms by default, normalized to 0–5000 ms). Trigger/content hover and trigger focus remain persistent independently of that timer. Touch does not start a hover corridor. Escape dismisses without moving focus until the hover/focus interaction is restarted. Rebinding clears stale trigger interaction and proposes dismissal unless the new trigger or tooltip surface is active; canceling that change or assigning authoritative open state retains the visible surface. Essential instructions must also be available in persistent content; interactive actions belong in a popover.

Server rendering preserves the external buttons, `for` values, and overlay content in Declarative Shadow DOM. Trigger listeners and accessibility relationships attach during browser hydration; they do not require DOM work on the server. JavaScript is required for overlay interaction. Application code supplies any fallback experience.

Styles come from the shared foundation, typography, controls, and overlay modules as needed. Floating placement uses measured anchor geometry, token-derived gaps, and resize/scroll observation only while open. Inner markup stays private. Slots, documented Parts, CSS properties, and public state are the supported contracts.

## Focused evidence

Run `npx playwright test --config packages/elements/src/dialog/tests/playwright.config.mjs`. Set `PLAYWRIGHT_BROWSERS_PATH` when using a nondefault browser cache.

The suite exercises Chromium, Firefox, and WebKit, including external native/component triggers, same-root ID isolation, late insertion/replacement, rebinding and cleanup, shared popover/tooltip buttons, missing anchors, disabled triggers, naming/focus restoration, canceled/native and forced-fallback dismissal, drag-out protection, responsive node/focus/edit preservation, label slot fallback, safe bidirectional pointer transit, transit expiry, and Escape. `tests/results/browser.json` records the most recently saved results and native versus compatibility path. These are browser-engine checks, not physical-device, screen-reader, complete current-minus-one, or WCAG conformance claims. For `en-button` descriptions, the suite verifies actual reflected element identities in all engines and the native Chromium accessibility tree. Playwright 1.63’s synthesized accessible-description matcher does not read element-reference properties. Firefox/WebKit assistive output and native tooltip screen-reader behavior still need the planned manual review.

### Optional surface motion

`--en-duration-enter` and `--en-duration-exit` default to `0ms`. Pin either independently (managed range 0–500ms in 10ms steps); `--en-ease-enter` and `--en-ease-exit` select their easing. Supporting browsers retain only visual exit paint through native `display`/`overlay` transitions. Accepted state, native modality, focus restoration and the single cancelable `en-change` keep their existing timing. A closed surface is inert; a canceled close stays usable. Reduced motion and engines without the required discrete-transition support dismiss immediately.

Modal surfaces can additionally use `--en-motion-surface-offset` (0, 2, 4 or 8px) and `--en-motion-surface-scale` (.95, .98 or 1). Entry keeps the newly focused content opaque. Dialogs and drawers share the offset distance; drawers choose the axis and sign from their attached edge and stay unscaled.

These hooks animate paint, not application transactions. Do not wait for an animation event to accept a value or execute a command. Reopen, disconnect and a changed reduced-motion preference require no delayed completion callback.

### Drawer edges

`en-drawer` accepts `placement="left"`, `"right"`, `"top"` and `"bottom"`. Its default `"end"` stays logical: right in LTR and left in RTL. `"start"` is the opposite edge. Physical left/right stay fixed when direction changes.

With nonzero `--en-duration-enter` or `--en-duration-exit`, the drawer translates by `--en-motion-surface-offset` from/to that attached edge: the same short distance as a dialog, constrained to 0–8px. A zero offset disables translation. CSS `@starting-style` supplies entry; native `display`/`overlay` transitions retain only exit paint. Entry stays opaque and unscaled; `--en-motion-surface-scale` only affects centered modals. The same offset policy applies when a responsive dialog presents as a bottom drawer.

Native focus and open state settle immediately. Closing immediately removes modal/keyboard participation and preserves the existing focus-return policy. Reduced motion and unsupported native-transition engines use the final geometry immediately. Reopening reverses the current transition without a delayed focus callback.

```html
<en-drawer placement="left" label="Project details"
  style="--en-duration-enter:200ms;--en-duration-exit:150ms;--en-motion-surface-offset:4px">
  <en-text-field label="Project name" value="Studio studies"></en-text-field>
</en-drawer>
```

### Event phase and typed consumption

`OverlayChangeEvent` describes tentative boolean open intent with `OverlayReason`.
Type the handler argument; no runtime event-class check is required. A committed
show/hide outcome is not a presentation or animation-completion notification:
floating surfaces may still await their associated trigger. Author open writes
are silent, and native terminal closure reconciles state without an after-the-fact
cancelable proposal. No separate presentation-complete event is supplied.

Menu Back buttons and reverse submenu navigation now report `back`, not `escape`.
Update exhaustive reason switches; actual Escape retains `escape`. Existing
reason literals remain for compatibility: trigger, close-button, backdrop,
outside, action and back describe semantic causes; hover/focus/tab/layout and
programmatic describe initiating conditions. Pointer/keyboard telemetry is not
inferred from reason, and no optional origin metadata is promised.

## Supporting summary

`description="…"` supplies plain summary text; directly authored `slot="description"` content replaces it, including empty or hidden assignments. Removing the assignment restores the current fallback. This contract also applies to drawer, sheet, media viewer and command palette. Keep the summary short; put structured long content in the body. The native dialog references a stable same-shadow target. Empty fallback adds no layout gap. `::part(description)` supports inherited text styling; style authored description roots for margins and other box geometry.
