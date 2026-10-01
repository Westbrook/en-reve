# Virtual collections

Virtualization is an opt-in rendering mode. It reduces mounted DOM, not the number
of application records. Selection, editing drafts, sorting and remote requests stay
keyed application state. A row leaving the viewport must not clear that state.

Import three independent layers:

```ts
import { VirtualCollection } from '@en-reve/primitives/state/virtual-collection.js';
import { VirtualCollectionController } from '@en-reve/primitives/interactions/virtual-collection.js';
import { virtualTableRows, virtualListRows } from '@en-reve/primitives/templates/virtual-collection.js';
```

The pure `VirtualCollection` model accepts `{ items, key, estimateSize, overscan,
initialCount }`. Keys must be unique, stable strings; do not derive them from row
position or mutable display content. Heights use CSS pixels. Overscan counts rows.
`initialCount` produces a deterministic initial window without browser APIs.

## Browser lifecycle

Register one controller with the Lit element that renders a collection:

```ts
readonly rows = new VirtualCollection({
	items: records,
	key: record => record.id,
	estimateSize: 48,
	initialCount: 20,
});
readonly viewport = new VirtualCollectionController(this, this.rows, {
	viewport: () => this.renderRoot.querySelector('en-table')?.scrollElement,
	content: () => this.renderRoot.querySelector('tbody'),
	enabled: () => this.mode === 'virtual',
	onFocusedItemRemoved: (_key, viewport) => viewport.focus({ preventScroll: true }),
});
```

`en-table.scrollElement` is a public browser-only reference. It is available after
the table renders; `refresh()` resolves it again if a child is created later.
For a list, return its explicit scrolling container instead. The content callback
returns the native `ul`, `ol` or `tbody` containing the adapter's direct rows.

For a list that scrolls with the page, return `this.ownerDocument.scrollingElement`
from `viewport` (cast to `HTMLElement | null` in TypeScript). Leave the collection
in normal document flow without a height cap or an inner `overflow: auto`. The
controller follows document scroll events and translates window scroll coordinates
into list-relative offsets while keeping mounted rows bounded. Its scroll and
anchor corrections use the window; ordinary element scrollports remain supported.
Use `occludedBlockStart` and `occludedBlockEnd` for sticky header/footer heights,
and call `refresh()` when those heights change. Focus recovery should target a
focusable collection region rather than the document root. Native focused controls
can use matching `scroll-margin-block` values; the measured row used by
`scrollToKey` already receives the controller's occlusion offsets.

Hierarchical adapters can provide `rows()` to enumerate the mounted measured
elements and `rowFor(active)` to associate a focused semantic wrapper with its
measured row. Each measured element must represent only one record's geometry,
excluding descendants, and carry `data-en-virtual-key`. Both must remain inside
the content surface. This allows a tree to retain nested `treeitem`/`group`
semantics without measuring an entire branch as a single row. Ordinary list and
table adapters keep the direct-child behavior without these options.

The controller subscribes to model revisions only while connected. It performs
its first viewport calculation after the initial Lit update, observes only mounted
rows plus the two explicit surfaces, and schedules animation frames only for dirty
work. Disconnecting removes listeners and observers. It temporarily disables
native scroll anchoring on its scrollport while managing the stable key anchor.

Use `rows.setItems(nextRecords)` for insertion, removal, filtering and sorting.
The model preserves measurements by key. Geometry corrections retain the visible
record and intra-row offset; if that record disappears, the model chooses a nearby
surviving record. The controller applies corrections after changed spacer geometry
has been committed to the DOM.

Width changes invalidate measurements automatically. After a theme, font, density
or other styling change that can affect offscreen row height, call
`viewport.invalidateMeasurements()`. This resets unseen estimates and remeasures
mounted rows. Native row sizes must include all vertical spacing: use padding and
borders rather than collapsing margins or a gap between rows.

`scrollToKey(key, options)` accepts the platform
[`scrollIntoView` options](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView#parameters):

| Option | Values | Default |
| --- | --- | --- |
| `behavior` | `auto`, `instant`, `smooth` | `auto` |
| `block` | `start`, `center`, `end`, `nearest` | `start` |
| `inline` | `start`, `center`, `end`, `nearest` | `nearest` |
| `container` | `all`, `nearest` | `all` |

```ts
// Use the same stable key supplied to the model, even after sorting.
const found = this.viewport.scrollToKey('asset-09000', {
	behavior: 'auto',
	block: 'center',
	inline: 'nearest',
	container: 'nearest',
});
if (!found) {
	// The record is absent from the current collection (for example, filtered out).
}
```

`block` replaces the earlier `align` option. The return value still reports whether
the key exists, not completion of scrolling. The connected, enabled controller
mounts and measures the destination before scrolling, without selecting it or
moving focus. `smooth` animates toward the destination; `auto` uses each scroller's
CSS `scroll-behavior`. Use CSS and the reduced-motion media query when choosing
application motion defaults.

`container: 'all'` can also scroll the surrounding page. Choose `nearest` to keep
the operation within the closest scroll container; a fallback supports browsers
without the native container option. The API retains logical inline alignment,
including RTL, and native scroll padding and target scroll margins.
The initial collection layout is vertical. On browsers requiring the `nearest`
fallback, scroll padding supports pixel and percentage lengths plus browser-resolved CSS
math such as `calc()`, `min()`, `max()` and `clamp()`. A temporary hidden layout
probe resolves math against the scrollport extent and is removed synchronously.
The collection layout remains vertical; alternate writing-mode geometry is not supported.

If a sticky header obscures the top of the collection scrollport, supply
`occludedBlockStart` and optionally `occludedBlockEnd` for the footer. With
`en-table`, return `table.scrollInsets.blockStart` and `.blockEnd`; these
Signal-tracked getters update when its sticky surfaces change. The table also
applies scroll padding and reveals focused controls inside the unobscured region.

Expand **scrollToKey()** below the review collection to enter an **Asset key** and use
all four options beside **Show asset**. Its live call preview follows the controls,
and the result reports whether the key was found. Try an absent key to verify that
it returns false without scrolling. Paginated delivery instead opens the matching
page; it does not invoke the virtualizer.

The separate **View example code** disclosure below the demo contains its maintained
TypeScript source, including element registrations and shared styles. It is closed
by default, supports keyboard navigation, and offers syntax highlighting and **Copy
code**. The source is included in the initial HTML; highlighting loads on expansion.

Focused rows are retained along with their immediate neighbors for native Tab and
Shift+Tab continuity. Scrolling far away does not replace the focused control or
change its record. Native Tab continues through the authored controls in that row,
then the next tabbable authored control in collection order; it does not jump to the
distant visible window. As focus advances, the neighbor hold advances with it.
The library does not override operating-system keyboard-navigation preferences;
Safari may require Option+Tab or its full keyboard navigation setting to reach
native checkboxes and buttons.
Focus is traced through open shadow roots. When focus moves
into an overlay outside a row, retain the trigger with `viewport.pin(key)` until the
overlay closes, then call `viewport.unpin(key)`. Explicit holds are counted and do
not override the independent keyboard-focus hold. Applications decide where focus
goes after deleting a focused record through `onFocusedItemRemoved`.

## Native table rendering

The adapter owns valid `tr` wrappers, stable keyed rendering, omitted-range spacer
rows and one-based `aria-rowindex`. Supply native cells:

```ts
html`
	<table aria-rowcount=${rows.count + 1} style="table-layout:fixed;width:100%;border-spacing:0">
		<colgroup><col style="width:35%"><col></colgroup>
		<thead><tr aria-rowindex="1"><th>Name</th><th>Description</th></tr></thead>
		<tbody>${virtualTableRows(rows, {
			columns: 2,
			renderCells: record => html`<th scope="row">${record.name}</th><td>${record.description}</td>`,
		})}</tbody>
	</table>
`;
```

Keep headers mounted and give columns deterministic widths. Automatic column
measurement from whichever rows happen to be mounted causes horizontal shifts.
`headerRows` defaults to one; include all persistent headers in `aria-rowcount` and
index each header row. Optional `rowClass` and `rowSelected` callbacks describe
application-owned presentation/state. Native row/column spans, horizontal
virtualization and composite-grid editing are outside this initial adapter.

## Native list rendering

`virtualListRows(rows, { renderItem, rowClass? })` supplies native `li` wrappers with
`aria-posinset` and `aria-setsize`. Render it inside a zero-padding, zero-margin list
without row gaps. Put the row's visual spacing inside the row, where it can be
measured. Both adapters are pure Lit templates and can render on the server.

## Reading and hydration

Render the same initial records, keys and model options on the server and client.
Hydration retains the initial rows before the controller measures and windows them.
This does not make omitted records available to assistive technology, browser find
or print. Provide an explicitly navigable paginated or full-content alternative,
plus application search that can reveal a result. Announce data/filter actions at
the application level, not every scrolling range update.

Do not change a native table into an ARIA grid merely to reduce Tab stops. The
virtualizer owns mounting and geometry, not selection or keyboard navigation roles.
Verify real assistive-technology reading in addition to automated browser tests.

## Known VoiceOver traversal limitation under investigation

A user reported unpredictable table traversal in **both Safari and Chrome** after
scrolling several windows, selecting and deselecting a checkbox, and navigating
back through records with VoiceOver. Rows were skipped and both Left and Right
commands subsequently moved backwards. This is an open issue, not an ordinary
row-boundary explanation or an established WebKit-only defect. Exact affected
browser/OS versions and the root cause remain to be established.

The collection's logical order, row metadata and DOM-focus retention do not by
themselves guarantee retention of VoiceOver's separate reading cursor. Compare the
same sequence in Paginated delivery, which keeps the entire current page mounted;
record that result rather than assuming this alternate mode resolves the report.
Keep a paginated or complete-content reading path available.

The engineering comparison covers full mounted-table snapshots at initial load,
after scrolling, after `scrollToKey()`, and during retained-focus Tab/Shift+Tab
navigation, including select/deselect. Playwright ARIA snapshots are DOM-derived
semantic/name evidence, **not native operating-system accessibility-tree or
VoiceOver traversal captures**. Passing them must not close this issue. See the
[collection accessibility review](../../../plans/table-accessibility-review.md)
for the reproduction, evidence boundary and manual protocol; the current Progress
Report records executed checks and their build.

Revisit on relevant browser/OS updates, availability of native accessibility
inspection or a smaller reproducer, and changes to collection structure/focus
handling. Manual confirmation on the affected environments is required before
marking the reported traversal fixed. Do not intercept assistive-technology keys
or detect a screen reader to select a rendering mode.

## Sticky surfaces on small screens

`en-table` defaults to `sticky="header"` without requiring an attribute. Choose
`sticky="footer"`, `sticky="both"` or `sticky="none"` explicitly; add
`sticky-caption` to request a pinned top caption. The caption initially scrolls
until its browser-measured height can offset the header safely. Native headers
remain sticky in the default SSR delivery.

The table reserves at least half its measured scrollport for body content. If the
requested sticky surfaces exceed that budget, caption, footer, then header pinning
are released in that order. They remain in the table and scroll normally; the
author-requested properties stay unchanged. `scrollInsets` reports only effective
pinned surfaces. Print styles restore normal table flow.

### Document-scroll example and lifecycle

The authored [document-scroll example](../../../apps/docs/document-scroll.html)
uses `document.scrollingElement` with the same `VirtualCollection`,
`VirtualCollectionController` and `virtualListRows` imports as element scrollports.
It demonstrates a fixed 48px header, 24px footer, instant/smooth reveals, row-height
changes and growth of the preceding section. The `?element` variant retains an
ordinary element scrollport. The dedicated cross-browser fixture is
`probes/document-scroll/playwright.config.ts`.

Document mode observes preceding siblings and ancestors (including across shadow
hosts) for layout-size changes, so a preceding section can grow without a user
scroll or a manual `refresh()`. Changes to ancestor child lists refresh those
observations. For positional changes that do not resize any observed box (for
example transforms or application-controlled absolute positioning), call
`controller.refresh()` explicitly. There is no perpetual animation-frame loop.
Anchoring is active while the viewport's reading edge is inside the collection;
entering or leaving the collection does not pull the document back to a stale row.

`focusTarget: () => element` supplies a recovery destination. In document mode it
defaults to the content, with a temporary `tabindex="-1"` when needed. Removal of
a focused item focuses that target without scrolling; `onFocusedItemRemoved`
overrides recovery and receives that target. Existing element-mode callback
behavior is preserved. Disconnect restores the original `overflow-anchor` value
and priority, removes an added tabindex and releases listeners, observers and
scheduled work. Keep a paginated/full-content alternative for reading-cursor
accessibility; automated DOM focus tests do not establish VoiceOver behavior.
