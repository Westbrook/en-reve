import { html } from 'lit';

/** Helper APIs are documented separately from the custom-element manifest. */
export function tableCompositionReference(href: (path: string) => string) {
	return html`
		<section class="api-section" id="api-table-composition" aria-labelledby="api-table-composition-title">
			<h3 id="api-table-composition-title">Choose a table API</h3>
            <p><code>en-data-table</code> accepts <code>items</code>, <code>columns</code> and <code>getKey</code> properties and owns the routine selection, sorting, pagination and virtual-row wiring. Start with its paginated default; opt into windowing and keep a reading alternative. Use <code>en-table</code> and the composed helpers below for application-owned markup, multi-row/spanning headers or framework-owned cells.</p>
            <p><a href=${href('/api-examples/data-table')}>Compare both APIs with shared data and custom cells</a> · <a href="/reviews/data-table-api.md">Facade transactions, SSR, styling and ownership guide</a></p>
			<p>Keep authored native markup when you need full control. For repeated data tables, share column definitions and let the table helpers coordinate headers, cells, stable keys, page metadata and virtual scrolling.</p>
			<pre dir="ltr"><code>import { TableModel } from '@en-reve/primitives/state/table.js';
import { TableController } from '@en-reve/primitives/interactions/table.js';
import { tableColgroup, tableHeader, tableRows } from '@en-reve/primitives/templates/table.js';</code></pre>
			<dl>
				<dt>Columns and cells</dt><dd>Supply stable column keys, labels, explicit widths, optional comparators and renderCell callbacks. rowHeader creates a native row header. Register en-button and en-icon for sortable headers, and include tableStyles in the root containing the native table.</dd>
				<dt>Sorting and filtering</dt><dd>TableModel transforms the complete collection before windowing. tableHeader names the next sort action and exposes the active direction through aria-sort. Its onSort callback lets your application accept the action; sortLabel provides localized wording. Remote data remains application-owned.</dd>
				<dt>Selection</dt><dd>Keep selection keyed separately from the mounted rows. Use the same selection state across filtering, paging and presentation changes. Cancel a control's en-change synchronously when the application rejects a selection.</dd>
				<dt>Delivery</dt><dd>TableController connects to en-table through its public scrollElement and sticky insets. TableModel supports virtual (legacy windowed), paginated and all rendering; the same cell callbacks apply to each. Use scrollToKey for keyed reveal and invalidateMeasurements after presentation changes that affect unseen rows.</dd>
			</dl>
			<p>Windowing omits records from the DOM. Row counts describe that omission; they do not make unmounted records available to screen-reader reading, browser Find or print. Offer a paginated reading path and application search.</p>
			<p><a href="/reviews/table-api.md">Concise setup example and helper API guide</a> · <a href=${href('/api-examples/virtual-collection.html')}>Try the composed table and view its complete source</a> · <a href=${href('/workflows/assets')}>Review the Asset Browser integration</a> · <a href="/reviews/table-accessibility.md">Screen-reader and device review checklist</a></p>
		</section>
	`;
}
