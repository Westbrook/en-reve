# en-data-table

An optional records-and-columns facade over `TableModel`, `TableController` and the
native table templates. `en-table` remains the authored-markup scroll shell. Both
paths use the same measured virtual collection, sorting rules and cell styles.

```ts
import {html} from 'lit';
import '@en-reve/elements/define/data-table.js';
import type {EnDataTable, TableColumn} from '@en-reve/elements/data-table.js';
type Study = {id:string; name:string; kind:string};
const columns: readonly TableColumn<Study>[] = [
  {key:'name',label:'Name',rowHeader:true,compare:(a,b)=>a.name.localeCompare(b.name),renderCell:row=>row.name},
  {key:'kind',label:'Kind',width:'25%',renderCell:row=>html`<strong>${row.kind}</strong>`},
];
const example=html`<en-data-table label="Studies" .items=${records}
  .columns=${columns} selection="multiple" page-size="20"></en-data-table>`;
```

`items`, `columns`, `getKey`, `rowLabel`, `filter`, `sort`, `selectedKeys` and
`sortLabel` are JavaScript properties, not serialized JSON attributes. The default
`getKey` reads `item.id`; alternatively supply a stable function returning unique
nonblank string keys (opaque; whitespace is not trimmed). Replace arrays rather than mutating them in place. Use the generic
`EnDataTable<Study>` type for imperative references. Cell renderers return text,
Lit templates or other Lit-renderable content; strings are escaped, never treated
as executable HTML. Use `en-table` when another framework must own native cells.

Columns retain the shared `TableColumn<T>` contract: stable key, label, renderCell,
optional comparator, sortable flag, rowHeader, width and className. Reserve
`_en_selection` for the generated selection column. Explicit widths and fixed table
layout keep widths independent of whichever rows are currently mounted. Row/column
spans, grouped headers, footers and editing-grid behavior use the authored route.

## State and transactions

- `mode`: `paginated` (default), `virtual` (legacy alias: `windowed`), or `all`. No automatic threshold.
- `page`: one-based and bounded. `page-size` / `pageSize`: positive integer, default
  20. Changing page size keeps the former first record within the selected page.
- `selection`: `none` (default) or `multiple`. Generated controls are `en-checkbox`.
- `selectedKeys`: readonly unique nonblank string array, default empty. Keys persist across
  filtering, paging and record replacement; the application decides when to prune
  removed keys. There is no inferred selection from mounted rows.
- `sort`: optional `{column, direction:'ascending'|'descending'}`. Comparators sort
  the complete filtered collection. Comparator-free `sortable:true` columns allow
  application/remote sort handling without deriving values from cell text.
- `filter`: optional predicate over source records. Sorting/filtering returns to
  the first page. Replacing records clamps the current page.

Generated actions dispatch independent bubbling, composed, cancelable events:
`en-selection-change` (selected-key arrays, reason `checkbox`), `en-sort` (sort
objects, reason `sort`), and `en-page-change` (page numbers, reason `pagination`).
Each detail is `{previous, proposed, reason}`. The corresponding getter exposes
staged state while listeners run. Rendering waits for acceptance. Cancel
synchronously; no follow-up committed event is emitted. Public state assignments,
including equal assignments, are silent and authoritative and supersede pending
transactions. Accepted nested transactions win over older work. Check event.target
when nesting this element inside application components.

```ts
table.addEventListener('en-sort', event => {
  if (event.target !== table) return;
  if (remoteSorting) {
    event.preventDefault();
    // Application owns request identity, loading/failure UI and stale results.
    // Apply accepted records and sort state together after the request completes.
  }
});
table.addEventListener('en-selection-change', event => {
  if (selectionLocked) event.preventDefault();
});
```

The internal checkbox/pager transactions are canceled and reconciled by the owner;
listen to the named table events for table decisions. Custom cell interactions
remain authored events. `disabled` disables generated interactions, leaving custom
cell behavior to the application. It does not prohibit authoritative writes.

## Geometry, focus and reading

`scrollToKey(key, options)` accepts the platform `scrollIntoView` options dictionary
including `container:'nearest'`. It returns key existence, not animation completion;
selection/focus remain unchanged. Paginated mode opens the containing page.
`pin(key)` / `unpin(key)` hold an overlay trigger's row (counted leases).
`scrollElement` is browser-only and null before initial rendering.

`invalidateMeasurements()` resets unseen geometry after CSSOM-only changes, such
as `CSSStyleSheet.replaceSync`, `insertRule` or replacing `adoptedStyleSheets`.
Attribute/style-element changes, font completion, row sizes and viewport width
are observed automatically. CSSOM changes do not emit DOM mutations: explicitly
invalidate after applying them. The comparison demo includes this exact scenario.
The visible key/intra-row position and focused row survive geometry updates.

Virtual mode retains the focused row and adjacent Tab destinations but does not
make every omitted row available to screen-reader traversal, Find or printing.
Keep an application-visible paginated/full route. The known VoiceOver row traversal
issue remains under investigation. This element does not claim to fix it, and it
does not change native table semantics to an ARIA grid. Vertical windowing only;
no spanning virtual cells or horizontal virtualization.

## Styling, names and initial delivery

The element includes table cell styles in its own shadow root. Shared table tokens
apply; `--en-data-table-viewport-size` defaults to `24rem`.
`--en-data-table-min-inline-size` defaults to `32rem`: narrow layouts scroll
horizontally rather than squeezing labels into unreadable fragments. Override it
for your column count and content, or use `0` for a table designed to fit. `sticky` forwards to
`en-table` (header by default). Parts: `surface`, exported `viewport`, `table`,
`caption`, `header`, `body`, `empty`, `pagination`. A custom cell renderer can assign
additional Parts within this shadow root, including exported child Parts. Cell
class names are useful only inside this root; ancestor styles do not pierce it.
`before` and `after` slots accept application-owned tools/status outside the table.

Use contextual `label`/`caption`, localized `empty-label`, `page-label` (pager
navigation name), `selection-label` with `{row}`, `rowLabel(item)`, and
`sortLabel(label,nextDirection)`. The default selection label is `Select {row}`.
For complete custom/localized pager content, use the composed route; this facade
currently uses the pagination component's default action labels.

Pass the same initial records, columns, keys and state on server and client.
Paginated SSR delivers its native current page; windowed SSR delivers a deterministic
initial slice before measurement. Reading native cells/links works without JS;
selection/sorting/paging need JS. Native relationships and keyed DOM survive
hydration. Physical mobile and actual screen-reader results remain manual checks.

## Selection presentation

Selected rows retain the checkbox's checked state and gain a persistent fill and
logical-start inset marker without changing dimensions. Shared styling also
applies to authored-helper rows with `data-selected`. Override
`--en-table-row-selected-background`, `--en-table-row-selected-color` and
`--en-table-row-selected-indicator-color`; defaults use the theme's selected,
text and action colors. Hover cannot erase selection, and forced colors use
system highlight colors. Keyboard focus remains a separate control state.

`sticky-selection="start"` (default) keeps the generated checkbox column at
inline-start: left in LTR, right in RTL. It works whenever the table overflows;
it does not reorder columns at a mobile breakpoint. Use `sticky-selection="none"`
to opt out. Sticky cells have opaque row-state backgrounds and a separator;
the sticky column header remains above them. Printing removes sticky positioning.

The generated selection column centers the checkbox in a compact `3.25rem`
column with `.25rem` padding on each side. Set
`--en-data-table-selection-width` to customize its width; the same resolved width
sets sticky-column keyboard scroll clearance. The width cannot shrink below the
theme's minimum hit target plus padding, including its touch target on devices
with a coarse pointer. The hidden label retains the checkbox's accessible name.
This sizing only applies to the generated table selection controls.

`selection-column-label="Selection"` supplies the visually hidden native
`th scope="col"` heading. Localize it separately from the individual
`selection-label="Select {row}"` checkbox names. Authored helpers can use
`{label:'Selection', headerLabelHidden:true, ...}` for the same header treatment.
The hidden heading does not introduce a select-all control or change its scope.
