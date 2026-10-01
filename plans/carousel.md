# Carousel implementation and review

> Current planning status (2026-09-16): the [accepted follow-up backlog](component-follow-up-backlog.md) supersedes historical next-phase ordering below. Baseline exclusions describe the original pass; newly committed follow-ups are identified in that backlog. CAROUSEL-1 and CAROUSEL-2 are implemented for review; physical screen-reader and mobile validation remains an acceptance checkpoint.

Implement the next retained pattern as `en-carousel` with direct, slotted
`en-carousel-slide` children. Slide contents remain application-owned and are never
cloned, fetched or reconstructed. Before hydration, native horizontal scrolling
and all authored content remain available. The native scrollbar remains before hydration;
once controls are ready, scrollbar-width: none hides it while native scrolling stays enabled.
Consumers can restore it through en-carousel::part(viewport).

## Contract

- Named group and named slides, native en-button controls and visible position.
- Manual by default. Previous/next, viewport-only Arrow/Home/End navigation,
  native touch/trackpad scrolling, RTL and responsive one/multiple-slide layouts.
- Zero-based `index`, `next()`, `previous()`, `goTo(index)`; user/API navigation
  emits a cancellable `en-change`, silent property assignments remain authoritative.
  The index identifies the leading slide; it is clamped to the last full window.
  In authored mode, an explicit index write wins over child reordering in the same
  rendering turn. Later independent child mutations retain the selected slide.
- Direct child insertion/removal/reordering/hidden updates retain node identity and
  the current slide when possible. Resizes update navigation limits. Offscreen
  slide contents are inert/hidden to accessibility APIs after hydration; a focused
  slide is retained until focus leaves, and removal recovers focus to the viewport.
- Optional autoplay, minimum five-second interval, explicit start/stop control
  first in reading order. Focus entry and manual navigation stop it until explicitly
  restarted. Pointer hover and document visibility suspend timers. Reduced motion
  disables automatic playback and smooth scrolling. No automatic announcements.
- Previous/next slots customize decorative control content. Slide content and
  captions are ordinary slots; applications must not nest buttons in control slots.
- Themeable gap, radius, surface, boundary and visible-slide count; CSS Parts for
  base, viewport, controls, previous, next, rotation, position and slide content.
- Finite carousel only: no virtual slides, infinite clones, lazy loading, media
  playback ownership or built-in thumbnail/pagination picker in this pass.

## Evidence and review

Publish media and responsive card examples, complete source and API guidance.
Test SSR/hydration, dynamic slots, events/cancellation, author writes, boundaries,
RTL, scroll synchronization, focused slide retention, resize, touch, autoplay,
reduced motion, hidden documents, focus recovery and cleanup. Check themes,
accessible snapshots, axe, 390px layout and copyable source modules. Physical
VoiceOver and mobile swipe review remains an explicit user checkpoint.

Reference: https://www.w3.org/WAI/ARIA/apg/patterns/carousel/


## CAROUSEL-2: keyed collections (2026-09-17)

The optional data adapter is implemented alongside the original authored API:

- `items` accepts stable unique string keys, labels, thumbnail URLs and application
  fields. `renderItem(item, index)` owns content. `null`/`undefined` restores slots;
  an empty array is an empty collection. Invalid keys fail before replacing data.
- The horizontal adapter measures viewport width and gap, supports responsive
  visible counts, and renders a bounded window plus focused-key pin. A stable
  `--en-carousel-viewport-size` frame defaults to 22rem, with scrollable slide bodies.
  This deliberately does not reinterpret the shared vertical controller as horizontal.
- `currentKey` and `goToKey()` complement existing index navigation.
  Keyed reveal participates in cancelable changes; writes remain authoritative.
  Virtual jumps are immediate. Native gestures settle to their nearest leading slide.
- Item insertion/reorder preserves the leading key where a full final window permits;
  removal chooses the nearest valid index. Focused slide nodes remain mounted and
  preserve identity on reorder. Removing focused content recovers viewport focus.
- Thumbnail mounting is bounded independently from slide mounting. First/last and
  neighbors of current/focused windows remain available; arrow/Home/End navigation
  can address all positions without a thousand thumbnail nodes.
- `reading-mode="list"` is a paginated ordinary ordered-list alternative, with
  `page-size` defaulting to ten. Global list positions and page buttons allow sequential
  reading without a virtual accessibility tree. Data SSR exposes the first page.
- Existing direct authored slides retain their no-JS horizontal content, controls,
  thumbnail metadata, event cancellation, autoplay and focus policy unchanged.

The demo includes 1,000 keyed studies, distant reveal, reversal, removal, reading-mode
switching, and copyable source. Focused tests cover bounded mounting, key updates,
focus retention/removal, picker traversal, native scrolling, resize/RTL, list accessibility,
preconnection configuration and invalid/empty data. Integration evidence is recorded
in the shared Progress Report after the parent build and browser runs.

Consumer responsibilities remain explicit: data fetching, persistent form/media state
for unmounted slides, renderer side effects, and deciding when to offer the list mode.
This is a finite collection, with no infinite clones, playback service or network loader.
Physical VoiceOver and touch swipe testing remains part of review; a passing DOM/AX
snapshot does not establish physical assistive-technology behavior.


## Contiguous collection picker refinement

The data-backed picker uses one contiguous window of seven, five or three choices based on container width (44rem / 32rem), shifting at the boundaries to keep the count stable. Separate First/Last controls replace pinned endpoint thumbnails. Visible thumbnail positions and a range caption explain global order; themed hover/focus tooltips add names. Keyboard traversal advances that same window without selecting; pointer focus must not reposition a pressed target before click. Authored carousel pickers retain their existing full strip. New labels and CSS Parts are documented in the API reference.


## Explicit navigation delivery

Both controls and navigation default to none. controls=auto renders one row for multiple valid windows/pages; always retains it with disabled unavailable actions; none omits it. boundary-controls adds First/Last inside that enabled row. The picker remains independent with supporting range text; picker-navigation and its boundary Parts are replaced by controls and first/last. Native scrollbars remain available without either generated interface. Dynamic removal of focused controls recovers focus to the viewport. Existing demos explicitly opt in; API documentation records the default migration.
