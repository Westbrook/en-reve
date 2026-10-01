# Composed native tables

The higher-level helpers reduce repeated table markup and virtualization setup
without replacing `en-table` or the native authored-table route. State, cell
rendering, browser geometry and application decisions remain separate.

- `state/table.js`: `TableModel<T>` validates stable keys and applies filtering and
  stable sorting to the complete record collection before virtual windowing. It
  supplies page bounds, page records, row counts and its lower-level `collection`.
- `templates/table.js`: `TableColumn<T>` supplies a key, label, optional comparator,
  cell renderer, optional row-header semantics and explicit width.
  `tableColgroup`, `tableHeader` and `tableRows` render native table descendants.
- `interactions/table.js`: `TableController<T>` binds the public `en-table`
  scrolling surface, native body and sticky-section insets. It delegates focus
  retention, measurement, pin leases and standard-options `scrollToKey` to the
  existing virtual controller.

```ts
import { html } from 'lit';
import { TableModel } from '@en-reve/primitives/state/table.js';
import { TableController } from '@en-reve/primitives/interactions/table.js';
import { tableColgroup, tableHeader, tableRows, type TableColumn } from '@en-reve/primitives/templates/table.js';

type Asset = { id: string; name: string; kind: string };
const columns: readonly TableColumn<Asset>[] = [
	{ key: 'name', label: 'Name', rowHeader: true,
		compare: (a, b) => a.name.localeCompare(b.name),
		renderCell: item => item.name },
	{ key: 'kind', label: 'Kind', width: '25%', renderCell: item => item.kind },
];
const model = new TableModel({ items, columns, key: item => item.id, pageSize: 20 });
new TableController(host, model, {
	table: () => host.renderRoot.querySelector('en-table'),
});
const renderTable = () => html`
	<en-table label="Assets">
		<table aria-rowcount=${model.rowCount()}>
			<caption>Assets</caption>
			${tableColgroup(columns)}
			<thead>${tableHeader(columns, {
				sort: model.sort,
				onSort: sort => model.setSort(sort),
			})}</thead>
			<tbody>${tableRows(model, columns)}</tbody>
		</table>
	</en-table>
`;
```

This excerpt belongs in a Lit host that renders the returned template; `items`
and `host` are application inputs. Register `en-table`, `en-button` and `en-icon`.
Apply `tableStyles` from `@en-reve/styles/table.js` in the host's static styles,
and constrain the viewport height and table column geometry. The complete working
lab source is available with its live example.

## Application control

`onSort` receives the proposed `{column, direction}` and the originating click.
The helper does not reorder records itself or dispatch a second control event.
The application may accept with `model.setSort`, reject, or perform a remote
request and then call `setItems`. Mark a comparator-free column `sortable: true`
for remote sorting; no values are inferred from cell text. `sortLabel` localizes
the full next-action label. `aria-sort` describes the currently accepted state.

Keep selection in the existing `createSelectionModel` or application store,
independent of the rendered window and active filter. Render `en-checkbox` in a
column and consume its single cancelable `en-change` event. Do not translate it
into a request/change pair. The application decides whether removed or filtered
keys remain selected. `rowSelected` only emits visual `data-selected`; the native
checkbox/radio supplies selection semantics. These tables are not ARIA grids.

## Reading modes and metadata

`setMode('windowed' | 'paginated' | 'all')` selects explicit delivery; there is no
automatic record-count threshold. `setPage` clamps to available pages. Filtering
and sorting reset to the first page; record removal clamps the current page.
Paginated native row indices/counts describe the mounted page. Windowed indices
and counts describe the full filtered collection. `rowCount({headerRows,
footerRows})` includes persistent sections; when supplying additional header rows,
pass the same `headerRows` to `tableRows` and author every header/footer index.

`scrollToKey(key, options)` returns whether the key exists. In paginated delivery
it opens the containing page, then reveals the mounted row. In complete delivery
it reveals the existing row. In all modes it preserves focus and selection; the
boolean does not indicate completed scrolling. Options use the same `behavior`,
`block`, `inline` and `container` dictionary as the underlying virtual controller.

The composed controller observes inherited boundary attributes, head stylesheet
changes and font loading, without observing every row subtree. Use explicit
`invalidateMeasurements()` after changing adopted stylesheets via CSSOM or other
presentation changes outside those observable boundaries. `refresh()` rebinds
changed roots. `onFocusedItemRemoved` supplies application-owned focus recovery;
use a persistent control or the viewport and explain the removal in a status
message. Keep each controller paired with its host lifecycle.

Provide a paginated reading route for browser Find and printing of the mounted
page. Virtual counts do not make absent rows navigable. Actual screen-reader and
physical-device review remains separate from automated DOM/engine checks.

## Optional element facade

`en-data-table` assembles these same layers for records-and-columns consumers.
Use it for conventional native data tables and keep the authored route for grouped
headers, spans, custom sections and framework-owned markup. The comparison demo
uses the same records, custom cells, sorting and keyed selection in both paths.
`TableModel.setColumns(columns)` replaces column metadata atomically and removes a
sort whose column disappeared. `setPageSize(size)` retains the prior first record
within the newly selected page; both validate inputs before publishing a change.

Selected helper rows use `rowSelected` to emit `data-selected`; shared table styles
apply a stable fill and inset start marker. Customize the selected background,
text and indicator with `--en-table-row-selected-background`,
`--en-table-row-selected-color` and `--en-table-row-selected-indicator-color`.
A non-sortable selection column can use `label:'Selection', headerLabelHidden:true`
to retain its native column heading without visible text. Each checkbox still
needs its own record-specific accessible name.
