# Application-owned notifications and feedback

`@en-reve/primitives/interactions/toast-stack.js` supplies admission helpers, not
a notification service. The [packed native consumer](../../../probes/notification-recipes/recipes.ts)
uses those helpers with native buttons, articles, details, progress and status
regions. It imports no owning custom elements. Toast, feedback and the independent
loading-activity stylesheet run in both Lit and portable CSS forms.

## Admission, ordering and focus

`normalizeToastMax` floors positive finite limits; zero, negative and nonfinite
values mean unbounded. `toastWindow` returns a Set of admitted object identities.
It prioritizes focused records, then interrupt records, then remaining records,
preserving order within each group and enforcing the cap. It does not reorder
the caller's array or the DOM. Duplicate object identities collapse; distinct
objects with equal application IDs do not. Applications must own stable keys.

The example appends ordinary arrivals and inserts interrupts at the front of its
array. It retains admitted focused controls even when an interrupt arrives,
recomputes admission after focus leaves, and hides queued articles and controls
from navigation and the accessibility tree. A count explains the remaining queue.
This finite example does not implement the owning element's stacked decoration.
The module's internal presentation-ownership attributes/functions are not needed
by this native contract and are not promoted as a new application API.

Applications own accessible naming, native buttons, DOM order and focus recovery.
The example returns focus to a surviving featured action or its launcher after
dismissing a focused message. Escape and click use the same application dismissal
path. Its cancelable `before-notice-dismiss` event is an application convention,
not a library `en-*` event or an asynchronous persistence guarantee.

## Timing and announcements

Admission priority is unrelated to live-region urgency. The example announces
newly featured content once in a separate polite status region. Visual articles
and expandable history are not themselves live regions; the history remains
readable after dismissal. Urgent timing does not automatically mean assertive
screen-reader interruption. Applications choose that policy from message meaning.

The helper has no timers. The example supplies persistent defaults, a five-second
minimum for explicitly timed notices, content-relative extension, and persistent
actionable messages. It pauses for focus/hover, resumes remaining time after those
interactions, and resets a displaced message's full budget when featured again.
Queued time consumes no budget. Disconnection cancels owned timers; reconnection
starts fresh. These policies are illustrative application code, not functionality
installed by `toastWindow`. Clock-driven browser tests establish sequencing, not
human reading speed or manual assistive-technology acceptance.

## Native surfaces and scoping

`toastStyles`/`toast.css` style `.en-toast` with icon, content and close control on
the first grid row; `.en-toast__actions` occupies the second. Native action content
needs application spacing because the component's `::slotted` rule does not style
ordinary children. `.en-toast-region`, its summary and history classes style the
finite container. Fixed logical placement uses host attributes: adopt this sheet
in a region-owned shadow root. An application must keep unrelated page controls
outside that fixed surface. Keyboard viewport handling, swipe recognition and
other interaction controllers are not provided by CSS.

`feedbackStyles` supplies alert/badge/progress appearance, including loading
activity styles. Appearance does not choose `alert`/`status` roles or event policy.
Use native `<progress>` with a label when possible; a custom visual track needs
its own `progressbar` value/name semantics. Decorative skeletons and spinners are
hidden from AT while the application supplies busy state and a meaningful status.
The leaf `activityStyles`/`activity.css` supplies only spinner/skeleton appearance;
it is not the activity-feed implementation. Reduced motion disables spinner and
toast animation. Forced-color assertions cover borders and native discoverability,
not physical display fidelity.

Portable `feedback.css` uses `swatchNativeStyles`: `.en-swatch` opts into swatch
dimensions and wraps `.en-swatch__sample` plus a decorative `.en-swatch__color`.
It no longer gives an unrelated shadow host swatch width. The existing
`swatchStyles` export preserves custom-element host sizing, so `en-swatch` and
current JS consumers retain their default square and authored host-width behavior.
Use `swatchNativeStyles` for a native recipe inside a larger rendering root.

The example checks local `--en-toast-*` pins and `--en-swatch-size` without changing
sibling consumers. Native class contracts do not authorize styling an owning
custom element's private shadow classes; use its documented Parts/properties.

## Evidence boundaries

Named journeys cover finite queues, application timers/announcements, feedback
semantics, standalone loading styles, native swatch scoping, logical placement
and the original swatch component's regression suite. Physical touch/swipe, native
AT speech, retail browsers, other OS/device conditions, full SSR/hydration,
notification persistence and separate-owner acceptance remain separate. Remaining
public-entry and platform obligations stay open in the maintained inventory.
