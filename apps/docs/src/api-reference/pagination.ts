import { html } from 'lit';

/** Consumption guidance complements the generated pagination API tables. */
export function paginationReference(href: (path: string) => string) {
	return html`
		<section class="api-section" id="api-pagination-guide" tabindex="-1" aria-labelledby="api-pagination-guide-title">
			<h3 id="api-pagination-guide-title">Pagination layout and consumption</h3>
			<p>The live example above includes wide, intermediate and mobile-width containers, independent page controls, alignment and icon customization, and an unknown total. The component owns page navigation; your application owns records, filtering, loading, request ordering, errors and result announcements. It does not fetch records, scroll the collection or turn page buttons into URL links.</p>
			<p><a href=${href('/api-examples/pagination.html')}>Compare all pagination layouts in the isolated example</a> · <a href="#api-cssParts">CSS Parts reference</a> · <a href="#api-cssProperties">Theme token reference</a> · <a href="#api-slots">Content slots reference</a></p>

			<h4>Three container layouts</h4>
			<dl>
				<dt>Wide: at least 44em</dt>
				<dd>The <code>actions</code> region fills its host while the buttons form a centered group. Seven equal-width numbered positions reserve space for the known total; small totals show every page. Previous and Next retain their natural button widths. Current-page status sits below the row.</dd>
				<dt>Intermediate: 28em to below 44em</dt>
				<dd>The same centered group reserves five numbered positions for first, current and last pages, with omitted-page indicators between them. Duplicate endpoints are omitted without collapsing their reserved cells; totals up to five show every page. Status remains below the row.</dd>
				<dt>Compact: below 28em</dt>
				<dd>Previous and Next sit at the logical edges in equal side tracks. The <code>middle</code> group centers current-page status and its chooser. Buttons keep their natural widths; the status can wrap when needed. This responds to the component's container, so a narrow sidebar can use compact delivery on a desktop screen.</dd>
			</dl>
			<p>Large totals, translations, theme geometry and a retained focused number window can require scrolling inside the action row. Resizing keeps focused actions and an active chooser invoker reachable. Preserve that overflow and focus clearance when changing the layout.</p>

			<h4>Choose alignment or distribute the controls</h4>
			<p><code>--en-pagination-align</code> accepts <code>start</code>, <code>center</code> (default) or <code>end</code>. It aligns expanded controls and their status together; compact delivery deliberately keeps its edge controls. Shared theme control sizes and focus targets remain in force. Medium is the default size and needs no attribute.</p>
			<pre dir="ltr"><code>en-pagination.results {
	--en-pagination-align: start;
}
en-pagination.distributed::part(previous) {
	margin-inline-end: auto;
}
en-pagination.distributed::part(next) {
	margin-inline-start: auto;
}</code></pre>
			<dl>
				<dt><code>base</code> and <code>actions</code></dt>
				<dd>The labelled navigation shell and its full-width action region. <code>actions</code> owns gap, justification and scrollable overflow. Its default display is flex in wide/intermediate layouts and grid in compact layout.</dd>
				<dt><code>pages</code> and <code>middle</code></dt>
				<dd>The numbered-cell group and compact status/chooser group. Use these for group distribution. Changing <code>justify-content</code> alone does not distribute compact grid children: use grid alignment on <code>previous</code>, <code>middle</code> and <code>next</code>, or deliberately replace the layout model.</dd>
				<dt><code>previous</code>, <code>next</code>, <code>page</code>, <code>control</code> and <code>gap</code></dt>
				<dd>Outer navigation buttons, individual numbered buttons, all native action buttons, and decorative omitted-page indicators. <code>page</code> retains native current-page semantics. Use logical margins for direction-aware distribution without reordering buttons.</dd>
				<dt><code>direct-summary</code>, <code>direct</code>, <code>jump</code>, <code>page-input</code>, <code>go</code> and <code>cancel</code></dt>
				<dd>Chooser triggers in every layout, the top-layer popover, its field/action group, numeric field, submission and dismissal buttons. The chooser trigger can be inside a numbered gap or the compact middle group.</dd>
				<dt><code>status</code>, <code>compact-status</code> and <code>expanded-status</code></dt>
				<dd>Both status presentations, or either presentation individually. Status intentionally is not a live region: announce completed result changes in your application's persistent status.</dd>
			</dl>
			<p>Use <code>--en-pagination-gap</code>, <code>--en-pagination-status-gap</code> and <code>--en-pagination-page-min-inline-size</code> for spacing and numbered-cell geometry. CSS Parts are the public customization surface; internal classes and markup remain private. Preserve visual/keyboard order and target sizes. Do not unconditionally reveal hidden page groups or hide a focused chooser trigger.</p>

			<h4>Page entry, keyboard and focus</h4>
			<p>In both expanded layouts, the right ellipsis opens the page chooser until the final four pages, when the left ellipsis takes over. Compact delivery places its chooser beside the status. When a wide layout shows every page, a separate chooser remains available. Ellipses use direct numeric entry rather than a menu containing a potentially huge omitted range.</p>
			<p>Go to page or Enter accepts a whole number from one through the known total. An accepted change, including the current page, closes the chooser and returns focus to its invoker. Invalid input, a canceled change or a transaction superseded by an application write keeps it open. Cancel and Escape dismiss without changing pages and return focus; clicking outside also dismisses. Ordinary Tab order applies to the numbered buttons. Pagination does not use a roving tabindex.</p>

			<h4>One controlled change event</h4>
			<p><code>en-change</code> is the single cancelable page event. During dispatch, <code>page</code> already contains the proposed value and detail is <code>{ previous, proposed, reason }</code>, where reason is <code>previous</code>, <code>next</code> or <code>page</code>. Cancel synchronously to restore the previous value. Explicit application property writes are silent and take precedence over rollback; no <code>controlled</code> attribute is needed.</p>
			<pre dir="ltr"><code>const pagination = document.querySelector('en-pagination');
let navigationAllowed = false;
pagination.addEventListener('en-change', event => {
	if (!navigationAllowed) event.preventDefault();
});
// Once the application's review is complete:
navigationAllowed = true;</code></pre>
			<p>For asynchronous approval or loading, cancel before awaiting, then assign <code>pagination.page</code> only when the application accepts the result. Discard stale requests before committing. Set <code>disabled</code> when your application requires navigation to pause; loading and recovery policy remain yours.</p>

			<h4>Totals, slots and initial delivery</h4>
			<p><code>page</code> is one-based. Known <code>page-count</code> values bound it; update page and total together before the next render when replacing a dataset. <code>page-count="0"</code> explicitly means unknown. Supply <code>has-next</code> while another batch exists: unknown totals show only Previous, current-page text and Next, with no invented last page or direct-page chooser.</p>
			<p>The <code>previous</code> and <code>next</code> slots accept noninteractive icons or text inside component-owned buttons. Built-in decorative chevrons require no extra registration and mirror with inherited reading direction. Register <code>en-icon</code> if you slot it, and handle custom icon direction in your own styles. Never nest buttons or links in these slots.</p>
			<pre dir="ltr"><code>&lt;en-pagination page="6" page-count="40"
	previous-label="Previous page" next-label="Next page"&gt;
	&lt;span slot="previous"&gt;Previous&lt;/span&gt;
	&lt;span slot="next"&gt;Next&lt;/span&gt;
&lt;/en-pagination&gt;</code></pre>
			<p>Localize <code>previous-label</code> and <code>next-label</code> independently of their visuals, including visible words in the accessible name for speech input. The label, page/status templates, chooser, input, Go and Cancel text also have localizable attributes and properties in the tables below. RTL changes logical placement and built-in icon direction, not the meaning of Previous and Next.</p>
			<p>Render matching values on the server and client. Native labels, boundaries, current-page semantics and container-responsive CSS are present in SSR; actions require JavaScript. Hydration shares constructible stylesheets. The pagination element does not need client-side breakpoint detection to choose its layout.</p>
		</section>
	`;
}
