# en-table

`en-table` provides a themed scroll surface around one authored native table.
Your caption, row groups, headers, cells, buttons and links remain ordinary DOM.
The component never copies content, reorders rows, changes header associations,
or turns the table into an interactive grid.

```html
<link rel="stylesheet" href="/styles/table.css">
<en-table label="Project assets">
	<table>
		<caption>Available assets</caption>
		<thead>
			<tr><th scope="col">Name</th><th scope="col">Type</th></tr>
		</thead>
		<tbody>
			<tr><th scope="row">Cover study</th><td>Image</td></tr>
		</tbody>
	</table>
</en-table>
<script type="module">
	import '@en-reve/elements/define/table.js';
</script>
```

Serve `@en-reve/styles/table.css` at the stylesheet URL used by your application.
The example's `/styles/table.css` is an application asset URL, not a package
specifier the browser must resolve. For explicit registration, import `EnTable`
from `@en-reve/elements/table.js`; this class import does not register the tag.

For a consuming Lit component, include `tableStyles` from
`@en-reve/styles/table.js` in that component's `static styles`. A stylesheet must
live in the same Document or ShadowRoot as the authored table. No bundler-only
CSS import or automatic document stylesheet injection is required.

## Native content and encapsulation

The shadow root encapsulates the border and overflow viewport. The complete
native table is intentionally consumer-owned light DOM, so cell styling is an
explicit opt-in at that boundary. The shared stylesheet scopes its rules to
`en-table > table` and its direct native row groups, rows and cells. Nested tables
and unrelated tables are not selected. Normal application selectors can customize
authored cells and their content; `::part()` customizes the private scroll shell.

This is a deliberate exception to fully private markup: HTML table parsing does
not support arbitrary custom elements or slots between the native table, row
and cell layers. Keeping a complete authored table preserves native semantics,
valid HTML parsing, framework ownership and SSR without a projection adapter.
Use the usual `scope`, `headers`, `rowspan` and `colspan` attributes as appropriate;
this component is not a table-structure validator.

Rows may be inserted, removed, reordered or edited over time. Resize observation
updates the viewport's keyboard reachability as content or the available space
changes. Original child elements and their event listeners remain intact.
Reconnecting the component observes its current children again.

## Keyboard access, sizing and sorting

Set `label` to a localized name for the scrolling region; it defaults to `Table`.
The native table's own accessible name comes from its authored caption or ARIA
naming. These names serve different elements and can be more specific than each
other. Only a viewport with horizontal or vertical overflow enters the Tab order
after client layout. Focus it and use the browser's native scrolling keys.
Buttons and links inside the table retain their normal Tab stops and key handling.
No cell or row is made focusable automatically.

The default `size` is medium with no attribute required. `small`, `large` and
explicit `inherit` select shared absolute data typography and row/cell spacing;
they do not shrink the minimum interaction targets of child controls. Set a
sensible application `min-inline-size` on the native table when its columns
must remain side by side. The component scrolls that table rather than discarding
columns or changing their semantic relationships at narrow widths.

For sortable columns, author an ordinary button (or `en-button`) inside each
sortable `<th scope="col">`. The consuming application sorts its own stable rows
and places `aria-sort="ascending"` or `"descending"` on the active header. Provide
a visible indication and accessible name for each action. The component supplies
no sort state, sort event or row-data API: comparison rules and application state
belong to the consumer. A sortable table is still a table, not an ARIA grid.

## Sticky regions and mobile space

Column headers stay visible inside the table's own scrollport by default. No
`sticky` attribute is needed for that default. The native `<thead>` sticks as a
complete row group, so multiple header rows keep their original relationships.
The component does not clone headers or move them outside the table.

| Attribute/property | Value | Requested behavior |
| --- | --- | --- |
| `sticky` | `header` (default) | Pin `<thead>` at the block start. |
| `sticky` | `footer` | Pin `<tfoot>` at the block end. |
| `sticky` | `both` | Pin both header and footer. |
| `sticky` | `none` | Let both row groups scroll normally. |
| `sticky-caption` / `stickyCaption` | Boolean, default `false` | Also pin a top caption above the header. |

Caption pinning is independent of `sticky`. Bottom captions continue to scroll
normally. Footers are useful for totals and persistent actions; author their
native cells and controls just as you would for an ordinary table.

Constrain the viewport to create an internal vertical scrolling region:

```html
<style>
	en-table::part(viewport) {
		max-block-size: min(30rem, 65dvh);
	}
</style>
<en-table label="Project assets" sticky="both">
	<!-- A complete native table, including thead, tbody and optional tfoot. -->
</en-table>
```

At small viewport heights or enlarged text sizes, the measured sticky regions
may consume too much room. The component reserves at least half the scrollport
for body content: it first lets the caption scroll, then the footer, and finally
the header if necessary. Content and controls remain in the DOM and remain
reachable. Requested properties stay unchanged; pinning resumes when sufficient
space becomes available. This behavior depends on the table's own available
height, not a device-name breakpoint.

Resize observation updates the reserved space when headers, captions, footers,
fonts or the viewport change size. Replacing a direct row group also reconnects
measurement. Virtualized row insertion inside `<tbody>` does not trigger a
whole-table mutation scan.

The scrollport includes sticky-region clearance in its scroll padding, plus
`--en-focus-scroll-margin-block`. When focus enters a body control, the component
scrolls enough to reveal it between the sticky surfaces, respecting that
control's scroll margins. It preserves the focused element and its normal key
handling. Horizontal scrolling remains native. Printing removes sticky
positioning and the viewport's overflow clipping; a virtualized application must
still supply its full or paginated printable content.

## Scroll and virtualization integration

`scrollElement` exposes the native scrollport after rendering. It is `null`
before the first browser render and during SSR. `scrollInsets` is a read-only
`{ blockStart, blockEnd }` object in CSS pixels. These are measured **effective
reserved heights**, including the small-scrollport fallback, rather than
transient overlaps that change as the user scrolls. Both start at zero before
measurement. Reads participate in Signals tracking, so a reactive consumer can
respond when theme, content or viewport changes alter the insets.

Connect a `VirtualCollectionController` using its callbacks:

```typescript
const scrolling = {
	viewport: () => table.scrollElement,
	occludedBlockStart: () => table.scrollInsets.blockStart,
	occludedBlockEnd: () => table.scrollInsets.blockEnd,
};
```

Pass these options alongside the controller's content and application callbacks.
The library's virtual collection controller tracks inset changes, keeps its
visible range clear of both sticky edges, and uses them when revealing a record.
Do not cache an inset snapshot permanently or duplicate the header height in an
application constant. Internal `--_en-*` properties and `data-en-*` attributes
are implementation details, not customization APIs.

## Customization

The `base` Part is the bordered surface; `viewport` is its scroll container.
Theme properties are `--en-table-background`, `--en-table-color`,
`--en-table-border-color`, `--en-table-header-background`,
`--en-table-header-color`, `--en-table-footer-background`,
`--en-table-footer-color`, `--en-table-row-hover-background`,
`--en-table-cell-block-padding`, `--en-table-cell-inline-padding`, and
`--en-table-radius`. All fall back to shared semantic tokens. Preserve enough
cell padding for focus outlines around embedded controls. Sticky surfaces use
opaque theme fills and separate stacking levels to cover scrolling body content.
Footer colors fall back to the table surface and text; the caption uses the table
surface. Forced colors uses
system surface/text/border colors; the component adds no motion.

## Server rendering

Ordinary `@en-reve/ssr` rendering preserves the authored native table and delivers
its declarative shadow scroll shell. Include the authored-cell stylesheet in the
initial HTML (or the consuming component's server-rendered static styles) to
avoid a delayed table style change. Hydrate the same authored content.

The initial authored-cell CSS already pins the default header and requested
footer. An opted-in caption scrolls normally until its height is measured in the
browser, avoiding an estimated offset or overlap with the header during SSR.
The small-scrollport fallback and measured scroll clearance also activate in the
browser.

The server cannot measure overflow. Its viewport is conservatively keyboard
focusable; the browser removes that additional Tab stop when content fits.
With JavaScript disabled, native table semantics and native scrolling remain
available, including that conservative viewport Tab stop. Browser-engine checks
are not a substitute for manual screen-reader and physical-device review.
