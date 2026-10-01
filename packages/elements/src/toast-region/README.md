# Notification region

Slot `en-toast` children directly or via forwarding slots. Native region semantics
provide a named collection; `.focus()` reaches it without a global shortcut.
`notify({message,variant?,duration?,priority?,dismissLabel?,interrupt?,swipe?})` immediately returns a
plain-text toast; insertion waits until the persistent live regions are mounted.
Pending additions participate in `dismissAll()` and keep their individual vetoes.
Calling `notify()` before first connection queues insertion for that connection;
disconnecting cancels pending insertions, including across reconnection. The returned
element remains application-owned and usable even if insertion is canceled. For rich content,
author a toast and slotted action buttons. No HTML-string API is used.

Initial SSR messages remain readable and are not replayed on hydration. Newly
opened messages queue into persistent polite or explicit assertive channels.
Announcement text excludes actions. `priority=off` avoids duplicate announcements
when another status channel already describes the outcome. Visual messages are
not evicted: the region scrolls at its configurable maximum height.

`.dismissAll()` proposes dismissal independently for each toast. Escape is scoped
to the engaged toast. Focus recovers to the next available message’s close control
or the region unless the application has already moved focus. Direct application
state writes and action-button consequences remain application-owned.

Inline by default. Optional `placement=block-start|block-end` fixes the region at
the logical inline end using safe areas. Place fixed regions near the document
root, outside transformed containing blocks. They are not modal or top-layer.
Shared tokens and `base` Part allow alternative layout. Reduced motion is
respected. Manual spoken-announcement testing remains necessary beyond DOM/AX.

## Bounded delivery

`max="3"` presents three full toasts. Additional open messages wait behind the
last visible toast, represented by decorative stack layers. Zero or omitted max
is unlimited. The read-only `queuedCount` exposes the waiting count; `stack-label`
localizes the waiting explanation and `::part(stack-summary)` styles it.

Waiting toasts remain in authored DOM order with `open=true`. They are excluded
from the accessibility tree and Tab order, their timers stop and restart with a fresh full reading budget on admission, and they
announce when admitted. Accepted dismissals promote waiting messages; vetoes do
not. Changing max and adding/removing/hiding children updates the window. Focused
content retains a visible slot. `dismissAll()` includes waiting messages.

`notify({message, interrupt:true})` (or `<en-toast interrupt>`) bypasses ordinary
waiting messages and can displace an ordinary visible toast, pausing its timer.
It never displaces focus. `notify({interrupt:true})` prepends the new message to
the entire list, ahead of earlier interruptions. Ordinary notifications append
in arrival order. Visual, reading and Tab order match the actual DOM order.
Authored slotted toasts retain consumer-chosen order; their `interrupt` attribute
grants admission priority. Author them first when they should lead the list. Timeout does not grant priority. Announcement urgency
is still independently selected with `priority`.

The library SSR adapter maps the initial cap across direct and forwarded named
slots before hydration. Without that adapter, client enhancement applies it.
## Optional history

Set `history` to add a native, keyboard-accessible disclosure containing plain-text
waiting messages and recently closed messages. History is off by default. It never
replays announcements, actions or interactive message DOM. Waiting entries are
previews only: inspecting them neither promotes the toast nor starts its timer.

`history-limit="20"` bounds recent snapshots; values round down and clamp to 0–1000.
Zero disables recent retention, invalid values use 20. Recent entries are newest
closure first; accepted user dismissals, timeouts and observed application
`open=false` changes are captured, but vetoed dismissals and DOM removal are not.
Retention starts when history is enabled; disabling history clears snapshots.
`historyItems` returns copies of `{message, variant}` records. `clearHistory()` and
the clear button erase recent snapshots without dismissing waiting/open messages.
History lives only in this region instance; consumers own durable persistence,
message DOM cleanup and any richer inbox. Avoid enabling retention for secrets.

Localize with `history-label`, `waiting-label`, `recent-label`, and
`clear-history-label`. Parts `history`, `history-summary`, and `history-list`
customize the disclosure. Clearing keeps focus on the clear button.

## Logical placement

The six fixed variants are `block-start-start`, `block-start-center`,
`block-start-end`, `block-end-start`, `block-end-center`, and `block-end-end`.
The first edge is vertical; the final edge is logical inline placement. Existing
`block-start` and `block-end` remain aliases of their inline-end variants. Inline
placement stays the default. DOM/reading order remains arrival order from top to
bottom at every placement; bottom placement does not reverse the list or Tab order.
Safe areas and a scrollable maximum size constrain the surface. Visual viewport
changes lift bottom regions above a software keyboard where supported. Position
root-level regions outside transformed ancestors. Test keyboard occlusion on the
actual target mobile browsers; OS keyboards are not fully covered by emulation.

Pass `swipe:true` to `notify()` or set `swipe` on authored toast children for optional
horizontal gesture dismissal; close buttons and keyboard Escape remain available.
