# Table ergonomics and virtualization implementation

> Current planning status (2026-09-16): the [accepted follow-up backlog](component-follow-up-backlog.md) supersedes historical next-phase ordering below. Baseline exclusions describe the original pass; newly committed follow-ups are identified in that backlog. Implementation of those follow-ups has not started.

Status: the composed table state, native rendering helpers and controller are now
implemented alongside the lower-level virtual collection. The large-collection
lab and Asset Browser exercise them. Verification and publication receipts belong
to the current Progress Report checkpoint; this document does not imply manual
screen-reader or physical-device approval.

## Implemented boundary

The first delivery separates three reusable layers in `@en-reve/primitives`:

- `state/virtual-collection.js`: `VirtualCollection` owns stable-keyed records,
  estimated/measured vertical geometry, the visible range, overscan, disjoint
  retained rows and stable-key scroll anchoring. Signals expose changes. Its
  constructor does not access browser globals. Indexed geometry supports
  logarithmic measurement updates and offset lookup; replacing the record order
  rebuilds that index. Measurements are applied as a batch before restoring the
  anchor, so an intermediate shrink does not displace it before another row grows.
- `interactions/virtual-collection.js`: `VirtualCollectionController` connects
  that model to an explicit scrolling surface and native row container after
  rendering. It owns mounted-row measurement, observer cleanup, change-driven
  animation frames, focused-row retention and counted explicit pins for editing
  or overlays. It also provides `scrollToKey`, `refresh` and
  `invalidateMeasurements` integration points.
- `templates/virtual-collection.js`: `virtualTableRows` renders native rows/cells
  with hidden spacer rows and logical row indices; `virtualListRows` renders
  native list items with logical positions and total-set size. Both share keyed
  range entries without introducing invalid table markup. A retained distant row
  does not require mounting all intervening records.

`en-table` remains the native-table scroll shell. Its public `scrollElement`
getter lets a controller bind the scrolling surface without querying private
shadow markup. Its `sticky` property defaults to `header`; `footer`, `both` and
`none` support persistent summary rows or ordinary scrolling. `sticky-caption` is
independent and opt-in to preserve reading space on small screens. The authored
table still owns its caption, header/footer content, column geometry and total-row
metadata. The shell measures sticky sections and exposes readonly
`scrollInsets.blockStart` and `scrollInsets.blockEnd`. Consumers connect those
public values to the virtual controller’s `occludedBlockStart` and
`occludedBlockEnd` callbacks; header and footer space then participate in visible
range and reveal calculations instead of hiding requested records. The consumer supplies cell content to the row
adapter, rather than creating the spacer and measurement machinery itself.

The documentation-owned `en-virtual-collection-demo` compares table and list
presentations of 10,000 locally generated records, with wrapped descriptions,
keyed checkbox selection, sorting, prepending/removal, reveal-by-key and a
20-record paginated reading mode. Each instance creates its own model; browser
geometry is not shared across SSR requests. The initial range is deterministic
and useful before measured windowing begins. The lab is not a public component,
and its generated record count is a test scenario, not a recommended activation
threshold or measured performance budget.

## Table API reassessment after integration

**The original separation still applies, but a sort control alone would not make
this table sufficiently easy to consume.** Virtualization belongs below table
interaction policy; it does not replace sorting, selection or native semantics.

The current `en-table` is a native-table scroll foundation, not a complete reusable
table interaction pattern. Native authored markup preserves parsing, SSR, header
relationships, spans and framework ownership. It does not justify requiring each
consumer to repeat sort-button semantics, icons, direction transitions, selection
appearance and focus-retention logic.

Keep records, keys, column meaning, business comparisons, remote requests and
application decisions consumer-owned. The implemented shared header template puts
an `en-button` and official icon inside a native `th`, supplies a localized
next-action name, and derives the enclosing header's accepted `aria-sort` during
rendering. Its callback lets the application accept or reject sorting without
adding another control-event pattern. The earlier standalone `en-table-sort`
element remains a possible later extraction, not part of this delivery. No helper
secretly reorders framework-owned DOM or mutates a framework-owned ancestor.

Sorting must transform the **complete ordered records before window selection**.
Sorting only mounted rows would present an incorrect result. Selection and drafts
remain keyed outside the mounted window. The lab already reuses the existing
`createSelectionModel`; this does not require a second selection model tied to
tables. Remote sorting/filtering continues to be an application decision.

The original authored table required record/cell meaning, keyed rendering, sort
state and labels, selection wiring, native headers and styling. This first
virtualized integration removes hand-written range mathematics, spacer rendering,
row measurement, observer cleanup and ordinary focus pinning, and exposes
eight responsibilities in its lower-level API:

1. Construct the model with keys, estimates and initial/overscan counts.
2. Bind the runtime to the scrolling surface and native row container.
3. Provide bounded scrolling and stable column geometry.
4. Select the native table or list row adapter.
5. Coordinate total table row count and header row indices with the body adapter.
6. Invalidate measurements when presentation changes affect unseen rows.
7. Supply paginated reading and reveal navigation alongside windowing.
8. Connect the table’s public sticky-section insets to the virtual runtime.

The sticky shell removes consumer-owned positioning, multi-row header offsets,
background/layering rules and section-size observation. The composed TableController now also owns the inset connection, so it is not
another required copy-and-paste recipe in the higher-level API.

These are responsibility categories, not a lines-of-code benchmark. The lab's
data generation and prepend/remove stress buttons are QA fixtures; they are not
mandatory consumer boilerplate. Business-specific cell content and comparisons
also remain legitimate application code.

Implemented reduction in ownership:

- `state/table.js` provides `TableModel<T>` with typed column comparisons, complete
  filtering/stable sorting, immutable ordered records, pagination and native row
  count metadata. Invalid record/filter updates preserve prior accepted state.
- `templates/table.js` provides `TableColumn<T>`, `tableColgroup`, `tableHeader` and
  `tableRows`. Columns pair metadata with custom cell callbacks. The templates own
  native wrapper repetition, row headers, accessible next-sort action names and
  accepted `aria-sort` metadata. Sort accepts an application callback; no second
  control-event pattern or hidden ancestor mutation is introduced.
- `interactions/table.js` provides `TableController<T>` over the existing runtime.
  It binds public scroll roots/sticky insets, waits for child upgrade, coordinates
  reading mode, delegates reveal/pin/measurement APIs, and observes inherited theme
  boundaries plus font loading. CSSOM changes use explicit invalidation.
- Selection remains collection/application-owned. Native checkbox/radio controls
  carry semantics; visual row selection uses `data-selected`, not `aria-selected`
  on native table rows. Active overlay trigger pin leases and focused-record
  removal recovery remain explicit application decisions.

The native authored `en-table` route remains unchanged. A records-plus-columns
custom element is a later possibility after these composed helpers receive review;
this delivery does not settle grid editing, remote loading, horizontal windowing
or spanning virtual cells. See `packages/primitives/docs/table.md` for the concrete
contract and live lab source for a complete host integration.

Do not add custom row/cell tags between native table layers: HTML parsing repairs
those invalid structures. Do not infer sort values from visible cell text or move
consumer-owned rows. A native table containing checkboxes and buttons also does
not become an ARIA grid merely because its body is windowed.

## Reviewed signal-list baseline

Existing authenticated GitHub access successfully read the requested package at
main revision `5e79ecdee91303e35e04b676b2afcefdaa95f4f8` (2026-09-11).
This was static review of its 23 package/source/test files, not a fresh execution
or performance benchmark of the private package. No implementation was imported
into this repository.

Useful starting points:

- Strategy interfaces separate range calculation, layout, rendering and cleanup.
- Signals and keyed Lit rendering limit mounted content to the calculated window.
- Natural layout measures border boxes, batches measurements, estimates unknown
  dimensions and searches cumulative geometry.
- Browser test scenarios cover 10,000 items, near/distant scrolling, dynamic size
  measurement, multiple layout strategies and cleanup.

Adaptation requirements:

- Require stable application keys. The provided default serialized-item-plus-index
  key is unsuitable for identity across sorting and editing.
- Separate browser initialization from deterministic SSR. The directive currently
  initializes its strategy in `update()` while `render()` reads that instance field;
  SSR calls `render()` without `update()`. Constructors also use browser APIs.
- Use a native-table renderer. Existing grid display, span spacers and div scrolling
  targets are not suitable inside native `tbody` content.
- Preserve a stable visible key and pixel offset when measurements, prepends,
  typography, density, width or content change.
- Retain focused/editing rows and active overlay triggers outside the ordinary
  overscan window; do not recycle one record's focused node into another record.
- Bound ResizeObserver targets and event listeners. Evaluate dirty-frame scheduling
  instead of a perpetual idle RAF, avoid one `scrollend` listener per scroll event,
  and measure the cost of cumulative-geometry rebuilding. These are code audit
  concerns, not proven performance failures.
- Support explicit scroll roots, shadow roots, RTL and mobile viewport changes.
- Keep the Reve-specific reactivity, base-element and utility dependencies out of
  the design system by adapting the concepts to its existing Signals/Lit layers.

## Scope and verification boundaries

The implemented scope is vertical rows with explicit stable keys and opt-in
windowing, using list and native-table adapters. Headers stay mounted and table
column geometry stays constrained as different rows appear. Row/column spans,
horizontal virtualization, masonry, composite-grid editing, remote loading and
automatic activation thresholds remain outside this delivery.

SSR renders a useful deterministic initial page. Hydration retains those nodes
before measured windowing begins. Selection and drafts remain keyed application
state independent of mounting. Provide paginated/nonvirtualized reading and
printing paths, and application search that can reveal a matching record. The lab
provides Find/printing for the current nonvirtualized page, not full-collection
browser Find or full-collection printing. It does not claim to make unmounted
content searchable by the browser.

For partially mounted tables, set total `aria-rowcount` and consistent one-based
`aria-rowindex`, including headers and any rendered footer rows. These properties describe omitted content;
they do not make absent rows navigable. Actual screen-reader traversal is required
in addition to automated role and axe checks. Focus retention preserves the
focused DOM node; it does not make Tab or screen-reader traversal visit omitted
records. Native radio arrow navigation would likewise only see mounted radios;
the lab uses independent checkboxes and retains a paginated route rather than
claiming a virtualized full-collection radio group.

Verify fixed and wrapped variable-height records, insertion/removal/reordering,
selection, active editing and overlays, keyboard entry/exit, RTL, theme/density
changes, hidden-to-visible delivery and SSR hydration. Measure mounted-node and
observer bounds, idle work, scroll frame cost and anchor drift on representative
devices/data. Choose activation policy from those measurements, not an arbitrary
row-count threshold. Automated geometry, lifecycle and DOM assertions establish
only their stated cases. They do not establish fluent screen-reader navigation,
touch scrolling with a physical keyboard/virtual keyboard, or a frame-time budget
on a representative low-power device. Record those reviews separately.

Before promoting the higher-level table API, close any observed anchor drift,
focus loss, hydration replacement or unbounded observation defects; those are
implementation blockers rather than acceptable manual-QA caveats. Keep clear
manual review instructions for assistive technology and physical devices even
when the browser suite passes. For moderate collections, separately evaluate rendering
containment that retains the full DOM rather than removing offscreen records.

## Source references

- [Pinned strategy interface](https://github.com/reve-ai/reve-core/blob/5e79ecdee91303e35e04b676b2afcefdaa95f4f8/webapp/component/signal-list/src/types.ts#L39)
- [Pinned directive and lifecycle](https://github.com/reve-ai/reve-core/blob/5e79ecdee91303e35e04b676b2afcefdaa95f4f8/webapp/component/signal-list/src/signal-list.ts)
- [Pinned Natural measurement strategy](https://github.com/reve-ai/reve-core/blob/5e79ecdee91303e35e04b676b2afcefdaa95f4f8/webapp/component/signal-list/src/StrategyNatural.ts)
- [Lit directive SSR lifecycle](https://lit.dev/docs/templates/custom-directives/#differences-between-update-and-render)
- [WAI sortable table](https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/)
- [WAI table counts and indices](https://www.w3.org/WAI/ARIA/apg/practices/grid-and-table-properties/)
- [WAI native table and contained controls](https://www.w3.org/WAI/ARIA/apg/patterns/table/)
- [WAI radio-group keyboard model](https://www.w3.org/WAI/ARIA/apg/patterns/radio/)
- [HTML table parsing](https://html.spec.whatwg.org/multipage/parsing.html#parsing-main-intable)

## Verified checkpoint

The implementation passed 36 browser checks across Chromium, Firefox and WebKit,
including SSR node retention, focused reorder, density/header-origin changes,
pagination, narrow RTL, distant scrolling and stable idle state. The existing
table/workflow/copyable-source regression suite passed 33 checks. Primitive model
and structural SSR tests pass. Actual screen-reader and physical mobile-device
review remain outstanding; the composed helper delivery has separate verification recorded in the Progress Report. Sticky table headers are now the default, with optional footer
and caption pinning. The sticky-section revision has its own browser verification
and publication receipt in the Progress Report; the preceding counts describe the
initial virtual-collection checkpoint.

## Sticky-section review

In the virtual-collection lab, scroll the table with its default Header setting;
column labels should remain visible while the caption scrolls away. Enable Show
table summary and choose Header and footer to review both boundaries. Keep caption
visible is a separate opt-in. None returns all sections to ordinary flow. Repeat
in Paginated mode to compare identical sticky behavior without virtual gaps.

On a phone or tablet, review portrait and landscape at normal and enlarged text,
including RTL and the inspired densities. Reveal an asset near either end, change
the sticky settings after scrolling, select a row, and resize or rotate while it
has focus. Labels and the summary should remain readable without covering the
revealed row or intercepting its controls. Caption and summary pinning are optional
because their combined height can consume a large fraction of a short viewport.
Automated mobile emulation covers measured geometry; physical touch scrolling and
assistive-technology navigation still require review on actual devices.

Sticky revision verification: 59 browser checks pass (23 sticky/mobile and 36
virtual-collection regressions), alongside 33 existing table/workflow/source checks.
Four Firefox mobile-emulation cases are explicitly skipped because that engine
does not support Playwright mobile mode; its desktop cases pass. Chromium touch
gestures and WebKit touch-context scrolling/tapping are automated evidence, not
physical iPhone, iPad or Android verification. The suite caught and verified fixes
for pre-upgrade inset reads, final-row reveal after measurement, and density
changes during a pending reveal.

## Platform scroll options follow-up

The public reveal method adopts the scrollIntoView options dictionary: behavior,
block, inline and container. The earlier align property is replaced by block.
Defaults follow the platform, including container all; callers that intend only
collection scrolling should request nearest. Destinations are mounted and measured
before native scrolling so smooth behavior does not begin with an instant jump.
Focus and selection remain independent. Verify nested scrollers, native/CSS smooth
behavior, RTL inline geometry, sticky padding, interruption and retained focus.
The virtual collection review exposes these options in an initially collapsed
scrollToKey() disclosure below the collection, alongside raw stable-key input,
a live call preview and found/missing result.

Keep the initial layout scope vertical. The native path preserves authored scroll
padding expressions; the nearest-container fallback currently resolves pixel and
percentage padding. Extend that fallback for complex CSS math and evaluate vertical
writing modes separately. Native mobile and assistive-technology review remains
distinct from automated engine coverage.

Verified this revision with95 passing browser checks across Chromium, Firefox and
WebKit, plus4 intentional Firefox mobile-mode skips. Coverage includes24 new
scroll-options cases, existing focus/Tab continuity and sticky-table behavior,
and density changes that retain a partly visible row through estimate reset and
remeasurement. All56 primitive tests and the TypeScript consumer contract pass.

## Table fragment build follow-up

The composed table integration exposed a template-minifier context issue: a
standalone `col` literal was wrapped in an extra `colgroup`, producing nested
native groups and a phantom column after HTML parsing. The already compact leaf
literal now uses the existing preservation escape; the outer group remains
minified. Built-browser tests compare direct column structure and actual cell
widths both without JavaScript and after hydration. A broader tooling review of
context-sensitive native table fragments remains a separate follow-up.

## Current review checkpoint

The full integration pass adds a direct Inspired theme selector to the collection
lab, keeping appearance, density, selection and scroll controls independently
reviewable. The API reference links to the concise helper guide and the complete
source-powered lab. The Asset Browser offers an explicit 1,000-record catalog,
windowed/paginated table delivery, record updates and persistent single selection.
Native radio arrow navigation remains limited to mounted records; the visible
reading-mode explanation and paginated route make that boundary explicit.

The WebKit long-jump investigation reproduced an extra-frame visible-range delay.
Publishing the bounded range in the native scroll event removes the observed empty
windows during 9,000-record smooth travel, without raising the mounted-row budget.
Interruption between compositor movement and scroll-event delivery now retains a
logical key and pixel offset when its row has not mounted yet. Pending layout
invalidation also preserves a reveal that is still preparing, instead of silently
discarding a request made after the presentation change.
Physical-device frame performance and real assistive-technology acceptance remain
separate review results, recorded in table-accessibility-review.md.

Next engineering follow-ups are contextual HTML-fragment minifier hardening,
CSSOM-only theme invalidation guidance, and further evaluation of a records-plus-
columns element using these composable helpers. Those are queued refinements;
none establishes approval of the pending real screen-reader/device matrix.
