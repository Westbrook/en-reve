# Component follow-up implementation backlog

## Context Protocol follow-ups

Original API-09 implementation is complete, including the reusable
registration graph and documented composition boundaries. CONTEXT-2/3 are
independent improvements; CONTEXT-R1/R2/R3 remain research only.

Authorized initial adoption: 2026-09-19. See [API-09 implementation](api-09-context.md).
The initial slice implements editor capability association, scoped editor/color
messages, carousel presentation subscriptions and reorderable-tree SSR parity.

| ID | Status | Work and exit condition |
| --- | --- | --- |
| CONTEXT-1 | Published | Explicit-target precedence, owning-registry upgrade, late-provider replay, cleanup, message overrides, carousel membership and tree hydration verified. User review remains separate. |
| CONTEXT-2 | Evaluation complete; retain current ownership | [Source review and reopening conditions](context-composition-review.md#context-2--keep-structural-ownership-explicit). Structural collectors remain necessary; an ancestor subscription would add lifecycle work without replacing membership/order/transaction checks. |
| CONTEXT-3 | Follow-up implementation | Optional contextual tooltip warmup service. Resolve from the trigger's ancestry, preserve explicit group IDs and current focus/hover handoff. Test remote tooltip hosts and nested groups before changing behavior. |
| CONTEXT-R1 | Research complete; no migration | [Adapter recommendation and test costs](context-composition-review.md#context-r1--chat-editor-adapters). Retain explicit host registration; record the module-local cross-bundle limitation and qualify a concrete consumer before changing protocols. |
| CONTEXT-R2 | Research complete; no migration | [Focus recommendation and test costs](context-composition-review.md#context-r2--focus-participants). Keep participant membership and exclusive tab-stop ownership; contextual discovery cannot replace the lease contract. |
| CONTEXT-R3 | Research complete; retain boundaries | [CSS, explicit references, definitions and SSR boundaries](context-composition-review.md#context-r3--keep-the-existing-boundaries). No new JavaScript authority or discovery fallback is introduced. |

Research acceptance means a source-backed recommendation and migration/test costs,
not an automatic implementation commitment. API-09's reusable definition graph
is implemented; it remains separate from Context Protocol runtime data exchange.

Accepted planning scope: 2026-09-16. The user requested that every follow-up in
our component-family summary become planned work, with implementation handled
separately. Tree, upload, navigation, split-view, table, editor, toast and carousel
follow-up slices have been implemented, with approval and remaining manual review
tracked in the Progress Report. Activity history/paging/virtualization is available
for review. COLOR-1 and the DATE-3 adapter/modern Buddhist foundation are now
implemented for review; COLOR-2 and DATE-1 are implemented for review; DATE-2 is implemented for review. Priority is sequencing,
not a delivery date. API names beyond existing contracts are design proposals.

This is the authoritative continuation queue. Earlier family plans describe their
implemented baselines and historical checkpoints; their old “next family” wording
must not be used to schedule work. The standalone-family first pass is implemented;
that does not establish complete accessibility or supported-environment acceptance.

## Order and ownership

| Order | Family / stable backlog prefix | Progress Report workstream | Scope accounting |
| --- | --- | --- | --- |
| 1 | Tree View — TREE | elements-selection | Existing retained scope |
| 2 | File upload — UPLOAD | elements-form | Existing retained scope |
| 3 | Navigation / sidebar — NAV | elements-selection | Existing retained scope |
| 4 | Split view / splitter — SPLIT | elements-basic | Existing retained scope |
| 5 | Tables / virtual collections — TABLE | elements-selection, browser-qa | Existing retained scope |
| 6 | Composer / token / rich editors — EDIT | elements-creative | Existing retained scope |
| 7 | Toast / notification region — TOAST | extensions-toast | Newly committed extension scope, weight 3 |
| 8 | Color picker — COLOR | extensions-color | Newly committed extension scope, weight 3 |
| 9 | Calendar / date picker — DATE | extensions-date | Newly committed extension scope, weight 4 |
| 10 | Carousel — CAROUSEL | extensions-carousel | Newly committed extension scope, weight 3 |
| 11 | Activity feed — ACTIVITY | extensions-activity | Newly committed extension scope, weight 3 |
| Throughout | Cross-family acceptance — ACCEPT | Existing QA/docs/manual workstreams | Existing retained scope |

Weights are coarse relative workstream estimates, not dates or component counts.
The five newly committed workstreams add 16 units: full scope moves from 83 to 99,
verified weight remains 27, remaining weight moves from 56 to 72. Completion is
27.3% under the existing all-or-nothing workstream metric. Previous history stays
unchanged. Existing retained refinements are not counted again. The 72-pattern
inventory still counts named patterns, not extension passes or child controls.

Each numbered family may be delivered in the smaller slices below. Independent
slices may be reordered at implementation kickoff if their stated dependencies
are met. Acceptance work accompanies each slice rather than accumulating at the end.

## Current implementation pass

TREE-1: implemented shared keyed multiple selection for authored, data and virtual trees, with SSR/hydration, range and visible select-all policies. UPLOAD-1/2: implemented `for`/`dropTarget` associations, nearest-surface ownership, cleanup and application-owned determinate simulation. Automated verification (222 browser checks and 16 model/SSR checks) and publication are tracked in the Progress Report; user approval of this batch is complete; environment-specific acceptance remains separate. TREE-2/3 are now implemented with loading lifecycle, cancelable structural moves, pointer/touch grips and the keyboard Move interface: see `plans/tree-lazy-reorder.md` for the API and interaction contract.

## 1. Tree View

- **TREE-1 — Multiple selection.** Stable keyed selection independent of focus;
  toggle, range and select-all behavior with explicit collapsed/hidden/disabled
  item policy. Preserve single-selection defaults. Keep authored and data APIs
  consistent; support virtualization without deriving selection from mounted DOM.
  Exit: keyboard/pointer/RTL, author writes/cancellation, filter/collapse and
  virtual-window transitions preserve the documented selection set.
- **TREE-2 — Lazy branches.** Application-owned async children with explicit
  loading, empty, failed and retry states; cancellation, request identity and stale
  response rejection. Preserve expansion and selected identities while reconciling
  refreshed children. No built-in network service. Depends on TREE-1's key contract.
  Exit: concurrent branches, collapse during load, retries and late results behave
  deterministically in finite and virtual renderers.
- **TREE-3 — Reordering.** Single/multiple-item moves using pointer/touch drag and
  an equivalent keyboard Move interface. Define before/after/inside targets,
  prevent cycles and invalid destinations, preserve sibling order and focus,
  announce outcomes, and keep the application authoritative over the move.
  Depends on TREE-1/2. Exit: virtualized and unloaded targets have explicit policies;
  cancel, rejected moves, RTL and keyboard-only operation are covered.

## 2. File upload

- **UPLOAD-1 — External drop surfaces.** Associate a larger same-root surface with
  `for`; design an explicit element-reference property for cross-root composition.
  Handle retargeting, disconnected targets, nested/competing zones, disabled state,
  drag enter/leave and non-file drops without hijacking unrelated drags. Reuse the
  native picker, rejection rules and selection transaction. Exit: external drops
  and picker selection share outcomes; cleanup and keyboard alternatives work.
- **UPLOAD-2 — Transfer simulation and integration.** Application-owned determinate
  progress with cancel, failure, retry and completion; prevent late progress from
  reviving canceled attempts. Document selection events versus application transfer
  events/state rather than implying the element owns transport. Exit: a resettable
  demo exposes observable state transitions and truthful accessible progress.
  Depends on UPLOAD-1 for the shared demo. Actual upload services, resumable
  protocols, directories and persisted file handles are not added by this plan.

## 3. Navigation / sidebar

- **NAV-1 — Nested groups.** Authored native links and independent disclosure
  controls, localized group names, current-location semantics and dynamic content.
  Retain router independence and avoid turning site navigation into an ARIA menu.
- **NAV-2 — Responsive composition.** Wide sidebar and narrow drawer/disclosure
  delivery with a coherent active branch, focus restoration and predictable
  behavior across resize/rotation. Depends on NAV-1. Exit: keyboard, deep links,
  RTL, long labels, hidden-current-link recovery and SSR/hydration are covered.

Implementation: NAV-1/2 are implemented in [navigation-sidebar.md](navigation-sidebar.md),
with nested native disclosure groups and the narrow inline-disclosure option.
Desktop/mobile review remains open; the Drawer comparison and SPLIT-1 workspace are available for review.

## 4. Split view / splitter

- **SPLIT-1 — Collapse and restore.** Configurable collapsible panes, remembered
  expanded size, bounds and authoritative controlled values. Provide discoverable
  keyboard/pointer controls and a reachable restore action when collapsed. Define
  focus recovery and narrow-layout behavior without losing authored pane content.
  Exit: resize/collapse/restore, canceled changes, orientation/RTL and focused
  descendants remain usable, including in the NAV-2 inspector/sidebar composition.

Implementation: SPLIT-1 adds independent visibility, retained bounded size, cancelable transactions, focus recovery and a responsive navigation/content/inspector demo. See [split-collapse.md](split-collapse.md). The user approved the split-view delivery on 2026-09-17; environment-specific acceptance remains separate.

## 5. Tables / virtual collections

- **TABLE-1 — Consumer API evaluation and delivery.** Compare a records-plus-columns
  element with the current composed helpers against real selection/sorting/rendering
  use cases. Produce a working comparative demo and API decision; ship the smaller
  reusable abstraction that reduces consumer ownership while preserving native
  table semantics, stable keys and custom cell composition. A particular new tag
  name is not preapproved. Keep the full/paginated reading route available.
- **TABLE-2 — Rendering and invalidation hardening.** Context-sensitive HTML fragment
  minification, CSSOM-only theme/geometry invalidation guidance and supported
  scroll-padding math in the nearest-container fallback. Preserve row measurements,
  logical scroll anchors, focused DOM and sticky boundaries through theme changes.
  Exit: built SSR/hydration structure, density changes and distant reveal work
  across three engines, narrow layouts and RTL.
- **TABLE-3 — Known VoiceOver traversal investigation.** Revisit the recorded row
  skipping/reversal issue with real macOS/browser versions, native accessibility
  evidence and a minimal fixed-versus-moving-window comparison. This is tracked in
  browser-qa/manual-review, not assumed solved by snapshots or attributed to a
  vendor without evidence. Exit: a reproducible diagnosis/fix or documented,
  bounded compatibility issue with a usable reading alternative and revisit trigger.

Implementation: TABLE-1/2 add the optional `en-data-table` records/columns facade and
a working authored-helper comparison, contextual table-fragment minification and
CSS-math scroll-padding fallback. See [table-followup.md](table-followup.md).
Verification and publication receipts are maintained in the Progress Report. TABLE-3 remains open.

## 6. Composer / token / rich editors

- **EDIT-1 — Clipboard interoperability.** Versioned structured copy/cut/paste
  within compatible editors plus readable plain text elsewhere. Validate imported
  schemas, unknown tokens, URLs and allowed formatting; never trust clipboard HTML
  as application markup. Decide and document a bounded sanitized rich-paste subset.
  Preserve marks, selection and one undo history across token/formatting operations.
- **EDIT-2 — Long-draft geometry and device qualification.** Anchor suggestion menus
  to the actual caret where supported, with an explicit fallback; coordinate nested
  scrolling, virtual keyboards, selection handles, dialogs and contextual toolbars.
  Separate browser checks from physical iOS/Android, real IME and VoiceOver sessions.
  Exit: typing, replacement, cancel, token editing and undo remain coherent in long
  drafts and both editor backends. Shared geometry is extracted only where proven.
  Collaborative transport, rich tables/embeds and arbitrary executable plugins are
  not introduced by this follow-up.

Implementation checkpoint (2026-09-17): EDIT-1 and caret-relative popup positioning are implemented for review. See [clipboard contract](editor-clipboard.md). Native OS clipboard, physical mobile/IME and VoiceOver qualification remain manual; no claim of device acceptance follows from browser tests.

## 7. Toast / notification region — newly committed

- **TOAST-1 — Expandable history.** Inspect waiting/recent messages through a named,
  keyboard-accessible disclosure with explicit retention/clear policies. Keep
  durable persistence application-owned and avoid replaying old announcements.
- **TOAST-2 — Dismissal gestures.** Optional touch/pointer swipe with reliable intent
  thresholds and cancellation. Preserve scrolling and always retain a button and
  keyboard alternative. Respect focused content and reduced motion.
- **TOAST-3 — Placement variants.** Logical start/center/end and top/bottom layouts,
  safe areas, RTL, stacking direction and keyboard occlusion. Test these against
  bounded stacks, interruptions and reading-budget reset rules. Exit for the family:
  no duplicated announcements, lost focus or prematurely expired queued messages.

Implementation checkpoint (2026-09-17): TOAST-1/2/3 are implemented for review: opt-in bounded history, swipe and logical placements. Device gestures, software keyboard and spoken announcement review remain separate.

## 8. Color picker — newly committed

- **COLOR-1 — Wider color spaces.** Preserve and edit sRGB and Display-P3 through an
  explicit space-aware value contract; define parsing, serialization, conversion,
  alpha, gamut warnings and fallback rendering. Additional spaces require separate
  scope. Existing hex/RGB/HSL values and theme-token constraints stay compatible;
  unsupported wide-gamut token storage must be explained rather than silently clipped.
- **COLOR-2 — Two-dimensional color controls.** Saturation/value or saturation/lightness
  area with paired hue/alpha controls; define the model explicitly per mode. Provide
  equivalent labeled numeric/slider controls, keyboard operation, touch targets and
  forced-colors alternatives. Depends on COLOR-1's model boundary. Exit: picker,
  chips and composer commits agree, with one undoable edit and consistent cancellation.

Implementation checkpoint (2026-09-17): COLOR-1 preserves sRGB/Display-P3, provides explicit conversion/fallback and integrates validated editor tokens. COLOR-2 adds the opt-in encoded-HSV plane, equivalent precise controls and shared editor sessions. See [color value and plane contract](color-picker-followup.md); physical wide-gamut display and assistive-technology review remain manual.

## 9. Calendar / date picker — newly committed

- **DATE-1 — Date ranges.** Start/end values, incomplete range state, bounds, keyboard
  selection, preview, validation and clear/cancel behavior. Preserve existing single
  date defaults and form semantics. Disabled interior dates have a documented policy.
- **DATE-2 — Time selection.** Accessible time entry/picker composition, locale display,
  precision/step, bounds and form values. Distinguish local wall time from instants;
  the application supplies timezone/DST policy when combining dates and times.
- **DATE-3 — Alternate calendars.** Establish an explicit supported-calendar matrix
  and implement at least one non-Gregorian calendar alongside Gregorian. Decide the
  initial alternate system from conversion/Intl support evidence before coding it;
  define stable serialization, month arithmetic, bounds and locale labels. No promise
  of every calendar system. Exit: round-trip values, boundary navigation and native
  form integration are verified for every declared calendar, with manual review.
  Remote availability and appointment scheduling services remain out of scope.

Implementation checkpoint (2026-09-17): the private adapter and modern Buddhist single-date presentation are implemented under DATE-3, preserving ISO storage and an explicit Gregorian native entry route. DATE-1 now adds atomic ranges, preview, unavailable-interior validation, Apply/Cancel and separate ISO form entries. DATE-2 local time selection is implemented for review. See [calendar, ranges and local-time contract](date-followup.md); competent Thai and assistive-technology review remain manual.

## 10. Carousel — newly committed

- **CAROUSEL-1 — Richer navigation.** Optional thumbnail/position picker with selected
  state, accessible names, keyboard behavior, RTL and responsive overflow. Preserve
  existing controls and application-owned slide/media content.
- **CAROUSEL-2 — Large and virtualized collections.** Optional keyed data/rendering
  contract in addition to authored slides; bounded mounting, measured geometry,
  focus pinning, reveal and reading-order policy. Integrate CAROUSEL-1 and shared
  collection primitives without cloning interactive content. Exit: resize, rapid
  navigation, updates and hidden/focused slides remain stable; provide a full/list
  reading alternative where virtualization cannot satisfy assistive technology.
  Infinite looping via clones and media playback services are not implied.

Implementation checkpoint (2026-09-17): CAROUSEL-1 optional thumbnails/positions are accepted. CAROUSEL-2 and ACTIVITY-1 add keyed rendering, bounded mounting, stable identity and paginated reading alternatives under the [large collection integration plan](large-collections.md). Their final build, verification and publication evidence is recorded in the independent Progress Report; actual VoiceOver and physical touch review remains separate.

## 11. Activity feed — newly committed

- **ACTIVITY-1 — Large / virtualized history.** Stable keys, grouped dates, async paging,
  buffered arrivals, scroll anchoring, cancellation/error/retry and focused-item
  retention. Preserve the finite/manual-loading API and an accessible paginated
  alternative. Evaluate a separate ARIA feed reading contract before assigning
  `role=feed`; do not relabel a virtual list and assume reading-cursor continuity.
  Build on TABLE-3 evidence and collection helpers; coordinate with CAROUSEL-2 only
  where their actual requirements match. Exit: older/newer navigation, reading order,
  dynamic group boundaries and loading announcements pass automated and manual review.

## Cross-family acceptance and delivery

**ACCEPT-1 — Integrations:** calendar/date picker, form navigation, presence/activity,
carousel, menus, overlays, content recipes and editors each retain their outstanding
state, cancellation, focus/dismissal and responsive workflow checks. Audit recorded
feedback against its original artifact; do not mark unresolved notes fixed merely
because code exists. Preserve already accepted pagination and toolbar work.

**ACCEPT-2 — Environments:** scoped themes, RTL, long/localized text, forced colors,
reduced motion, zoom, current/prior supported browsers, physical mobile/tablet input,
VoiceOver and real IME where applicable. Track environment and exact result. DOM/ARIA
snapshots and emulated viewports do not count as physical or spoken-output acceptance.

**ACCEPT-3 — Consumer delivery:** source/API/Parts/token docs, maintained demo code,
selective definitions, SSR/hydration and packed-package/import-map/framework usage.
Publish each implemented slice for review under the standing policy; keep manual
approval distinct from tests and implementation completion. Framework/release tooling,
managed theme adoption and visual-regression baselines remain their existing
workstreams, with no duplicate scope units here.

Each slice's implementation kickoff records API decisions, supported boundaries,
focused tests and one review scenario before coding. Each handoff names remaining
limitations, refreshes build-bound theme artifacts, and updates the independent
Progress Report. The original planning-only turn requested no runtime changes. The subsequent implementation requests authorize TREE-1/UPLOAD-1/2 and TREE-2/3, with publication for review.

Charts, QR codes, OTP/PIN entry, hover-preview cards and custom scroll areas were
not in the follow-up list being accepted and remain discussion candidates.
