import { html } from 'lit';

/** Tree consumption guidance supplements the generated parent and item APIs. */
export function treeReference(href: (path: string) => string) {
	return html`
		<section class="api-section" id="api-tree-guide" tabindex="-1" aria-labelledby="api-tree-guide-title">
			<h3 id="api-tree-guide-title">Hierarchy and selection</h3>
			<p><a href=${href('/api-examples/tree-view')}>Review the project hierarchy</a> with dynamic children, selection vetoes and the six inspired themes. Use a tree when the hierarchy itself matters, such as a project outline or layer browser. Use navigation links or a flat list for simpler destinations.</p>
			<p>Canonical names are <code>key</code> for records/items, <code>selectedKey</code>/<code>selectedKeys</code> for selection, and <code>expandedKeys</code> for expansion. Legacy <code>value</code>/<code>values</code>/<code>expanded</code> aliases remain supported. For record input, <code>key</code> wins over <code>value</code>; authored <code>key</code> and parent <code>selected-key</code> attributes win over their legacy attributes. Sequential property writes use the last write. Event snapshots expose both vocabularies.</p>
      <p>Data records use validated plain-text labels with no <code>renderItem</code> or <code>renderLabel</code> callback. Authored items support rich noninteractive label slots. Both retain component-owned item semantics, selection and focus; Context Protocol discovery does not change those ownership boundaries.</p>
      <h4>Author the hierarchy as children</h4>
			<p>Place root <code>en-tree-item</code> elements in the tree’s default slot. Place each nested item directly inside its parent with <code>slot="children"</code>. Structural wrapper elements and forwarded slots for the hierarchy are not supported in this first pass; root and nested items must be direct children. Label content can use ordinary slot forwarding. Each item needs a stable, unique, nonblank <code>key</code>. A label attribute provides plain text; <code>slot="label"</code> supports authored text markup. Prefix and suffix content are decorative. Keep buttons, links and editable controls outside item labels.</p>
			<pre dir="ltr"><code>&lt;en-tree label="Project outline" selected-key="cover"&gt;
	&lt;en-tree-item key="artwork" label="Artwork"&gt;
		&lt;en-tree-item slot="children" key="cover" label="Cover"&gt;&lt;/en-tree-item&gt;
	&lt;/en-tree-item&gt;
&lt;/en-tree&gt;</code></pre>
			<p>Set the parent’s <code>expandedKeys</code> property to an array of branch keys, for example <code>tree.expandedKeys = ['artwork']</code>. In Lit, use <code>.expandedKeys=&#36;{['artwork']}</code>. Expansion is a property rather than a space-separated attribute, so identifiers are not parsed as token lists. Replace the array to change expansion; do not mutate a returned array. Selection belongs to the parent’s <code>selectedKey</code>; do not author selection or expansion state on child items.</p>
			<h4>Multiple selection</h4>
      <p>Add <code>multiple</code> and set <code>selectedKeys</code> to an array of selected keys. Plain click selects one item. Command/Ctrl+click, Enter or Space toggles one item. Shift+click/Space or Shift+Up/Down/Home/End replaces selection with the exact inclusive enabled visible range; Control/Command+A toggles all enabled visible items. Collapse, individual toggles and select-all preserve unavailable selections; plain click and Shift ranges replace the set. Selection never propagates to children automatically. The same behavior works with authored children and data, including unmounted virtual rows. <a href=${href('/api-examples/tree-data')}>Compare both live examples</a>.</p>
      <p>In multiple mode, <code>en-change</code> snapshots additionally contain immutable <code>selectedKeys</code>. <code>selectedKey</code> reads the first selected key; assigning it replaces the selection with that key. Set <code>multiple</code> before assigning several <code>selectedKeys</code>; switching back to single selection retains the first key. Author writes remain silent and authoritative, and cancellation restores the previous set.</p>
      <h4>Supply a data hierarchy</h4>
			<p><a href=${href('/api-examples/tree-data')}>Review a 1,020-item data tree</a>, switch virtualization on or off, add and remove a child, and scroll to a key. Assign a nested <code>items</code> array with stable <code>key</code>, plain-text <code>label</code>, optional <code>disabled</code> and optional <code>children</code>. An explicit array selects data mode, including an empty array; set <code>items = undefined</code> to return to authored children. Do not mix the two content sources.</p>
			<pre dir="ltr"><code>import { html } from 'lit';
import '@en-reve/elements/define/tree.js';

const items = [
	{ key: 'artwork', label: 'Artwork', children: [
		{ key: 'cover', label: 'Cover' },
		{ key: 'accent', label: 'Accent' },
	] },
];

export function projectTree() {
	return html\`
		&lt;en-tree label="Project outline" .items=&#36;{items}
			.expandedKeys=&#36;{['artwork']} virtualize&gt;&lt;/en-tree&gt;
	\`;
}</code></pre>
			<p>The data mode uses the same <code>selectedKey</code>, <code>expandedKeys</code> and cancelable <code>en-change</code> state contract. Replace the data array after edits; mutating an existing record or children array does not notify the component. Selection and expansion belong to stable keys, independently of mounted rows. The complete known hierarchy stays in application data; windowing is a rendering choice, not lazy loading.</p>
			<h4>Virtual rendering and keyed scrolling</h4>
			<p>Data trees render their expanded items by default. Add <code>virtualize</code> to mount a bounded window in a scrolling viewport. Size the host with <code>block-size</code> or a definite flex/grid allocation; the viewport follows automatically. An unsized host uses <code>--en-tree-viewport-size</code> as its fallback (24rem by default). A sized host takes precedence over that token. Navigation and typeahead use the complete expanded hierarchy; a focused item is retained while the rendered window changes. The tree remains one Tab stop rather than making every row a sequential Tab destination.</p>
			<pre dir="ltr"><code>tree.scrollToKey('cover', {
	behavior: 'auto',
	block: 'center',
	inline: 'nearest',
});</code></pre>
			<p><code>scrollToKey()</code> accepts the shared <code>scrollIntoView</code>-shaped options bag. It returns <code>false</code> for an unknown key or a descendant whose ancestors are collapsed; expand those ancestors first. Scrolling does not select the item or move keyboard focus. Keep identical initial data and expansion on the server and client so the bounded server window can hydrate consistently.</p>
			<p>Virtualized content is not all present in the accessibility tree at once. Explicit levels and sibling metadata describe rendered items, but this does not guarantee continuous reading in every screen reader. Offer fully rendered or smaller hierarchies when that better supports the task. The isolated demo provides both modes for comparison; physical screen-reader acceptance is separate from automated snapshots.</p>
			<h4>Lazy branches and reordering</h4>
      <p><a href=${href('/api-examples/tree-data#tree-operations-example')}>Try loading and moving items</a>. Data records accept <code>lazy: true</code> for unknown children and <code>branch: true</code> for empty folders. Supply <code>loadChildren({key,item,requestId,signal})</code>, returning children or a promise. <code>getBranchState(key)</code> exposes idle/loading/loaded/empty/error; <code>loadBranch(key)</code> retries or refreshes an expanded visible folder. The <code>en-load-state-change</code> notification carries key, status and requestId. Collapse, disconnect, loader changes and explicit items replacement abort pending requests; stale results cannot commit. Concurrent branches merge safely and child keys are validated atomically. Applications own transport, persistence and detailed errors. Authored folders use <code>branch</code> and application-owned child DOM instead.</p>
      <p>Add <code>reorderable</code> for direct mouse row dragging, touch drag grips and an on-demand alternative Move interface. A floating preview names the item (or selection count) and destination. Equivalent before/after targets share one straight insertion line and a between-neighbors label; dropping inside a folder uses its outline. No move form appears by default. Alt+M opens it for the focused row/selection. Choose a destination and before/after/inside; Escape or Cancel move exits. For folders, the top and bottom quarters mean before and after, and the center means inside. Files use their upper/lower halves for before/after. Disclosure icons and interactive label content do not initiate dragging. Touch scrolling remains available outside the grip. Virtual edge scrolling reveals further pointer targets; the Move interface lists the complete known hierarchy.</p>
      <p><code>openMove(keys)</code> opens the same interface; <code>moveItems(keys,target,position)</code> returns whether a move committed. Cancelable <code>en-reorder</code> precedes mutation with immutable keys, target, position, previous and proposed hierarchy snapshots. Veto synchronously or replace the hierarchy to retain app ownership. Selection’s tentative <code>en-change</code> remains separate. Moves retain selected identities, source order and authored label nodes, expand destination ancestors, restore focus to the first moved item and announce completion. Cycles, disabled paths, no-ops and inside-unloaded destinations are rejected; load the folder first. Cross-tree transfers are not included.</p>
      <p>Loading appears as an indented, noninteractive child placeholder; the parent retains its busy semantics and the live status announces progress. The placeholder does not add a selectable item or change item counts. Parts: <code>drop-indicator</code>, <code>branch-loading</code>, <code>drag-preview</code>, <code>drag-handle</code>, <code>move-controls</code>, <code>move-status</code>, <code>branch-status</code> and <code>branch-controls</code>. Authored grips use <code>en-tree-item::part(drag-handle)</code>. Native destination/position selects remain keyboard accessible; physical touch and spoken-output acceptance require manual review.</p>
      <h4>Focus is independent of selection</h4>
			<p>Tab enters the tree once. Up and Down move between visible items; Home and End reach the first and last visible item. The forward arrow expands a branch or enters its first child; the backward arrow collapses it or reaches its parent. These directions follow reading direction. Enter or Space selects the focused item. The branch disclosure changes expansion without selecting the item. Disabled items remain discoverable with focus but cannot be selected or expanded.</p>
			<h4>A single cancelable state change</h4>
			<p><code>en-change</code> includes immutable <code>previous</code> and <code>proposed</code> records with <code>selectedKey</code> and <code>expandedKeys</code>, plus a <code>reason</code> of <code>selection</code> or <code>expansion</code>. Public getters expose the proposal during synchronous dispatch. Call <code>preventDefault()</code> to reject the interaction; explicit public property writes take precedence over rollback. Silent property writes do not dispatch a second event. To update a details panel after acceptance, wait until synchronous dispatch finishes and read the current public state, as the live example does.</p>
			<h4>Dynamic content and server rendering</h4>
			<p>Adding, removing or moving child items updates the visible hierarchy without replacing authored items. Keep keys stable when reordering. If application data removes the selected value, update the associated details surface as part of that data operation; a DOM edit is not a fabricated user selection.</p>
			<p>The en-reve SSR adapter maps authored children into the initial hierarchy, including expansion and item relationships, before hydration. Keep the same keys, child order and initial expanded state on the server and client. Custom SSR integrations must include this adapter; rendering a parent tag alone does not serialize arbitrary descendants into the tree’s accessibility structure.</p>
			<h4>Customization and scope</h4>
			<p>Use the generated CSS Parts and custom property tables below to customize tree layout, row surfaces, indentation, disclosure and focus. The default medium size needs no attribute. Review selection and keyboard focus independently in light, dark and forced-color environments. The tree supports single or multiple selection through authored children or a data hierarchy, with optional data virtualization, lazy branches and drag reordering.</p>
			<p><a href="#api-events">State events</a> · <a href="#api-slots">Authored slots</a> · <a href="#api-cssParts">CSS Parts</a> · <a href="#api-cssProperties">Theme properties</a></p>
		</section>
	`;
}
