# Toast

A message surface with default and `actions` slots. Persistent by default.
Use inside `en-toast-region` for announcements and dismissal focus recovery.
`variant` controls paint; `priority` independently selects polite/assertive/off
announcement delivery. `announcement` provides explicit plain localized text
when default-slot content is richer than light-DOM text.

`dismiss()` proposes `open=false` using one cancelable `en-change`, with reason
`dismiss`, `escape`, `swipe` or `timeout`. The tentative property is readable during the
handler; preventDefault restores it, while explicit author writes win. Direct
`open` writes are silent. Dismissal hides content without removing authored DOM.

`duration=0` persists. Positive milliseconds opt into expiry. Read-only `effectiveDuration` is the
longest of the request, 5,000 ms, or 2,000 ms plus the larger of 350 ms per
whitespace-separated word and 60 ms per non-space Unicode code point in
`messageText`. For example, 20 four-letter words receive 9 seconds. A longer
requested duration wins; nonpositive/nonfinite values persist. `announcement`
can supply an explicit text equivalent for rich content; actions/icons are excluded.
This is a reading allowance, not a guarantee for every reader. Applications
should provide persistent/user-adjustable notifications or recoverable history.
Hover, focus and document inactivity pause the current budget. An assigned action prevents timeout. Canceled
expiry does not loop: reopening, changing duration/message text, or returning from the waiting stack
starts a fresh full budget. Waiting time never consumes it.
Disconnection pauses timers. Consumers own essential information, retry/undo,
notifications across pages and focus following their own direct state changes.

Close uses `en-button` and `en-icon`; slots retain application ownership.
CSS Parts and shared theme surface/focus/motion tokens govern presentation.
Initial content is visible with SSR. Announcement enhancement is client-side.

## Application-provided action buttons

Place one or more buttons in `slot="actions"`. The application owns their click
handlers; activating an action does not automatically dismiss the toast.

```html
<en-toast-region label="Notifications">
  <en-toast id="upload-toast" variant="danger">
    Upload failed. Your file is still available.
    <en-button slot="actions" type="button" id="retry-upload">Retry upload</en-button>
    <en-button slot="actions" type="button" variant="secondary" id="upload-details">View details</en-button>
  </en-toast>
</en-toast-region>
<p id="upload-activity" role="status"></p>
```

After registering the elements, wire the application's behavior:

```js
const toast = document.querySelector('#upload-toast');
const activity = document.querySelector('#upload-activity');
document.querySelector('#upload-details').addEventListener('click', () => {
  activity.textContent = 'The connection was interrupted. Your file is retained.';
  // Leave the notification and its retry action available.
});
document.querySelector('#retry-upload').addEventListener('click', () => {
  // This example simulates success; perform the real retry here.
  activity.textContent = 'Upload retry succeeded locally.';
  toast.dismiss();
});
```

`dismiss()` honors cancelable `en-change` and region focus recovery. For a real
asynchronous retry, dismiss after success and keep the message available on
failure. If the application instead writes `toast.open = false`, it owns focus
recovery and bypasses the dismissal event.

For a toast returned by `region.notify()`, create the buttons, set each button's
`slot` to `actions`, attach click handlers, and append them to the returned toast.
Use explicit `type="button"` to avoid submitting a surrounding form. Native
buttons and links can also occupy the slot. Multiple actions wrap below the
message in authored order; their labels are excluded from announcement text.
While actions are assigned, the toast persists even with a positive `duration`.

The documentation's **Simulate failed upload** example implements both buttons,
including an action that leaves the toast open and one that closes it.

## Appearance

The documentation's second **Inline action with CSS Parts** instance uses
consumer CSS, not an additional toast property. Above a 26rem container width,
`.compact-notification[open]::part(base)` switches to flex layout, `content`
grows to fill available space, and `actions` keeps its intrinsic width. The
application removes the top margin on its own slotted button. Below that width,
the default grid places actions beneath the message. Restrict the `display`
override to `[open]` so it does not override the component's closed state.
The `close` Part styles the inner button control, not its layout host; this
recipe preserves the close button's position through the existing DOM order.

The optional decorative `icon` slot replaces the status glyph and is excluded from
announcements. Keep the status in the message text. `::part(icon)` customizes its
layout; `::part(close)` still reaches the shared button. Managed
`component.toast.*` roles and corresponding `--en-toast-*` properties support
surface, ink, border, icon, padding, radius and shadow. Prefix a paint role with
`info-`, `success-`, `warning-` or `danger-` to refine that status. Specific status
paint wins over general paint. Paired themes keep light/dark values independently.

See [the source comparison](../../../../plans/toast-theme-review.md) for fidelity
limits; visual themes do not change timeout, focus or announcement policy.


The status icon, message and close control share a vertically centered message
row. Wrapped text is centered as a block; assigned actions occupy a separate row
under the message. Empty actions introduce no extra row spacing. This keeps the
shared close-button target intact across theme densities and touch delivery.

## Optional swipe

Set `swipe` (off by default) to enable horizontal pointer dismissal. The gesture
requires at least 12px with a 1.5:1 horizontal intent ratio, then a travel threshold
of 25% of the toast width, bounded to 64–120px. Vertical intent cancels the gesture;
`touch-action: pan-y` preserves vertical scrolling. Pointer cancellation does not
dismiss. The surface follows pointer displacement directly; cancellation resets it without an animation, including under reduced motion.

Gestures cannot begin on buttons, links, fields, editable content or a toast with
keyboard focus; gesture completion also checks focus. Close and Escape remain the
reliable alternatives. Gesture lifetime pauses the timeout. Accepted swipes use
`dismiss('swipe')` and the same cancelable `en-change` policy as other dismissals.
