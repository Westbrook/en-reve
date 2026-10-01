# Presence groups and activity feeds

> Current planning status (2026-09-16): the [accepted follow-up backlog](component-follow-up-backlog.md) supersedes historical next-phase ordering below. Baseline exclusions describe the original pass; newly committed follow-ups are identified in that backlog. Implementation of those follow-ups has not started.

Approved next collaboration slice, following the chat/composable-editor work.

## Contracts

- `en-presence`: identity/status presentation with avatar, name and status
  slots. Optional href makes the whole identity a native link (target/rel supported);
  the actions slot is removed to avoid nested interactive content. Defaults to an existing en-avatar and visible status text. Status is
  supplied by the app; no network, inference or automatic live announcements.
- `en-presence-group`: direct slotted en-presence children, wrapping layout, `max`
  (default 4) and a +N disclosure. Expanded state has one cancelable en-change;
  authoritative writes supersede cancellation. Children retain identity when
  expanded/collapsed or reordered. Hidden authored children stay hidden. Before
  hydration all identities remain available; max is progressive enhancement.
- `en-activity-item`: author, timestamp, body, avatar, attachments and contextual
  actions, retaining authored DOM. A list item contains a named article.
- `en-activity-feed`: a labelled list with separate empty/loading slots, optional
  pending-update and load-more controls, and an explicit localized announcement.
  Requests use en-action; content, order, IDs, transport, buffering and focus
  decisions belong to the application. No inferred live announcements or timers.

Use stable keys and newest-first groups with explicit dates in the demo. Incoming
updates are buffered; the existing list and reading position do not move. Showing
updates is explicit; focus stays on its persistent button. Appending older items
retains focus on Load older. Demonstrate error/retry and empty/loading states.
This finite/manual-loading list intentionally does not use role=feed or promise
virtualization/automatic reading-mode loading. Follow W3C's separate feed contract
if that is added later: https://www.w3.org/WAI/ARIA/apg/patterns/feed/
Announce concise outcomes separately from the history:
https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html

## Delivery and verification

Provide a themed live example, extracted source sample, CEM/API guide and controls,
sticker-sheet specimen and contextual Chat workflow integration. Reuse shared
identity, surface, border, spacing and focus theme roles with optional family CSS
properties and Parts. Check five inspired themes, small widths, RTL and forced
colors. Verify SSR content, selective registration, hydration, dynamic children,
expansion cancellation, focus retention, buffered updates and accessibility tree.
Physical VoiceOver/mobile acceptance remains a separate review checkpoint.

Carousel and full rich-text editor remain subsequent families. Tree extensions,
framework/release work and outstanding manual checks remain in the broader plan.

## Implementation checkpoint

The four elements, selective definitions, styles and managed theme overrides are
implemented. `/api-examples/presence-activity` includes real authored source,
localizable overflow, dynamic membership, visible availability text, attachments,
contextual actions, buffered updates, named date groups, loading/error/retry and
empty recovery. The same composition is available on the sticker sheet, API
reference and Chat workflow disclosure. It is explicitly a local simulation.

Automated acceptance is maintained in `apps/docs/tests/presence-activity.spec.ts`:
SSR without scripts, three-engine hydration, cancel/author-write ownership,
node retention, dynamic insertion/removal/hidden changes, focus recovery,
update buffering, announced outcomes, loaded groups, Parts and API links.
The mobile theme pass checks all five inspired light/dark pairs, RTL, forced
colors and scoped axe rules. Publication evidence is kept in the independent
Progress Report; passing automation does not claim physical VoiceOver/iOS review.

Next: review collaboration behavior on mobile/VoiceOver, then plan the carousel
family. Full rich-text editing remains after that, with existing editor
composition/IME and virtual-collection manual follow-ups retained separately.

## Loading-shape follow-up

Older activity now previews its actual activity-item geometry in the destination
date group. The same item template supplies avatar, author/time, content and action
geometry; skeleton overlays are decorative and the placeholder is inert. Existing
entries remain mounted. Completion replaces that reserved shape at its append
position; retry retains the previously loaded history.

## Contextual loading status

Keep one persistent, initially empty polite status beside the older activity group.
Update it for loading, completion and failure without moving focus or exposing
placeholder entries. Resetting the demo clears/cancels the pending loading state.


## ACTIVITY-1 implementation (2026-09-17)

The feed now supports an optional keyed `items` API beside the original authored
slots. `renderItem` composes the slots of a managed activity item; an `embedded`
property avoids nested listitem semantics. Records have stable keys, application
formatted group/time labels and rich content without implicit sorting or transport.

Three explicit modes share records: full `list`, measured `virtual`, and `paged`.
The virtual adapter reuses the vertical VirtualCollection/Controller, including
anchor preservation, variable measurements, focus-and-neighbor pinning and
scrollToKey. Full pages retain every current-page entry while scrolling. Virtual
group context remains visible when a boundary heading is outside the window.
This is a regular named list, never role=feed. Screen-reader reading-cursor
continuity is not promised for a virtual DOM; paginated reading remains available.

`bufferItems` leaves the visible history untouched until `showUpdates`; newest-first
keyed batches deduplicate on reveal without discarding the current reading anchor.
`requestOlder` emits cancelable en-action/en-load with cursor, AbortSignal and
guarded complete/fail callbacks. Cancel, disconnect or author items replacement
invalidates the request. Errors retain history/cursor for retry, and duplicate keys
are rejected atomically. The application supplies transport and concise loading /
outcome announcements. Property writes win over interaction proposals.

The Large activity history demo adds virtual/paged/full reading, buffered arrivals,
explicit reveal, 160 initial entries, 40-entry older-page simulation, fail/retry/
cancel, a content-shaped inert skeleton and a source example. API documentation
covers ownership, SSR windows, keyboard focus, grouping, scroll options and Parts.
`apps/docs/tests/activity-history.spec.ts` covers these contracts across the three
configured engines, including ARIA snapshots and a mobile RTL theme pass. Build
and browser acceptance results belong to the parent integration report; physical
VoiceOver, mobile reading-cursor behavior and large-history review remain pending.
