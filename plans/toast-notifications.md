# Toast and notification region

> Current planning status (2026-09-16): the [accepted follow-up backlog](component-follow-up-backlog.md) supersedes historical next-phase ordering below. Baseline exclusions describe the original pass; newly committed follow-ups are identified in that backlog. Implementation of those follow-ups has not started.

Implement the next retained feedback family; do not add pattern-count units or
bump packages. User accepted the form-navigation follow-up before this pass.

- `en-toast`: slotted message and optional actions; shared theme surface and
  official close button/icon; public `open`, variant, optional duration, localized
  dismiss label. One tentative cancelable `en-change` for dismissal/timeout.
  Author writes are silent and win cancellation rollback.
- `en-toast-region`: labelled scrollable notification collection with direct or
  forwarded toast children and a plain-text `notify()` convenience method. Serial
  polite announcements, explicit urgent messages, no automatic focus movement.
  Initial SSR content is readable and is not replayed on hydration. No visual
  queue eviction: messages stay inspectable in a bounded scrolling region.
- Persistent by default (`duration=0`). Optional timers apply only while visible
  and unengaged. Hover, focus and document inactivity pause; actions keep the
  message persistent. Applications retain essential information outside an
  expiring notification and own undo/retry operations.
- Dismissal preserves application focus and recovers focused toast controls into
  the collection. Escape applies only inside the notification, never globally.
  Reset/disconnect clears timers and pending announcements.
- Inline layout by default; opt-in fixed placement uses logical edges and safe
  areas. Shared surface/focus/motion tokens, CSS Parts and reduced motion.
- Sticker sheet, isolated themed demo and full source/API docs, plus settings
  workflow composition. Tests cover SSR, hydration, cancellation, actions,
  multiple messages, timer pause/disposal, keyboard, mobile/RTL and themes.

Manual device/assistive-technology announcement acceptance remains separate from
browser DOM/AX tests. Notification history/persistence across page loads and
service transports are application responsibilities. Avoid auto-expiry for
essential actions or information that cannot be recovered elsewhere.

References: [W3C status messages](https://www.w3.org/WAI/WCAG21/Understanding/status-messages)
and [timing adjustable](https://www.w3.org/WAI/WCAG21/Understanding/timing-adjustable).

Verification checkpoint: 54 browser checks passed across Chromium, Firefox and
WebKit, plus two SSR and 32 tooling checks. This includes all five inspired themes,
narrow RTL, reduced motion, forwarding, timeout pause and settings scenarios.
Manual announcement acceptance remains open. Next retained family: chat message,
composer and contextual actions.

## Inspired visual delivery

See [the toast theme audit](./toast-theme-review.md) for source comparisons,
managed paint/geometry refinements and explicit remaining behavioral differences.

## Bounded stack and timely admission

User clarified max=3 means three full messages with waiting toasts stacked behind
the third. Implemented `max` (default unlimited), `queuedCount`, localized
`stack-label`, themed stack offset, and an initial SSR cap through direct/forwarded
named slots. Waiting timers pause; admission announces without autofocus. DOM and
application-owned open/hidden state remain stable. Canceled dismissal retains the
window. Focused content survives cap changes and interrupt admission.

User requested explicit timely delivery in addition to ordinary FIFO. `interrupt`
on en-toast and notify options admits ahead of ordinary messages without changing
spoken urgency; already focused content is protected. Displaced timers retain
a fresh full reading budget when admitted again. Visible messages preserve DOM order; timeouts alone never reorder.
An interrupt can wait if all capacity is focused. `notify({interrupt:true})` now prepends the newest interruption ahead of the whole list, including earlier interruptions; ordinary messages still append FIFO. Authored toasts retain their consumer-chosen DOM ordering.
Expandable history, gestures and additional placement remain separate follow-ups.


## Reading budget follow-up

Timed toasts now have a five-second floor and content-relative extension:
`max(requested duration, 5000, 2000 + max(words × 350, non-space code points × 60))`.
`duration=0` stays persistent; actions prevent expiry. `effectiveDuration` exposes
the uninterrupted budget. Re-admission after stack displacement always resets it;
hover/focus/document pauses preserve time within that visible period. Changes to
message text also start a new reading budget. This heuristic does not establish
WCAG conformance: essential information needs persistent/recoverable delivery or
user-controlled timing. Cross-browser tests use virtual clocks at budget boundaries.
