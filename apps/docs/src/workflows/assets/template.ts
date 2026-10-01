import { fileUploadExample } from '../../file-upload-demo.js';
import { html, nothing } from 'lit';
import { tableColgroup, tableHeader, tableRows, type TableColumn } from '@en-reve/primitives/templates/table.js';
import type { TableModel } from '@en-reve/primitives/state/table.js';
import { ref, type Ref } from 'lit/directives/ref.js';
import { contentCollectionTemplate, emptyStateTemplate, fileCardTemplate, metadataListTemplate } from '@en-reve/primitives/templates/content.js';
import { assetSortChoices, type Asset, type AssetSortField, type AssetsState } from './model.js';

export interface AssetField extends HTMLElement { value: string; }
export interface AssetsRefs {
	root: Ref<HTMLElement>;
	search: Ref<AssetField>;
	collectionHeading: Ref<HTMLHeadingElement>;
}
export interface AssetsActions {
	connect(element: Element | undefined): void;
	catalog(event: Event): void;
	delivery(event: Event): void;
	page(event: Event): void;
	updateSelected(event: Event): void;
	query(event: Event): void;
	filter(event: Event): void;
	layout(event: Event): void;
	sort(event: Event): void;
	sortBy(event: Event, field: AssetSortField): void;
	collectionUpdated(element: Element | undefined): void;
	select(event: Event): void;
	clearFilters(event: Event): void;
	showSelected(event: Event): void;
	clearSelection(event: Event): void;
	preview(event: Event, asset: Asset): void;
	previewHeading(element: Element | undefined): void;
	closePreview(event: Event): void;
	insert(event: Event): void;
}

/** The same keyed native list owns both layouts; app actions own selection and insertion. */
export function assetsTemplate(state: AssetsState, refs: AssetsRefs, actions: AssetsActions, table: TableModel<Asset>, columns: TableColumn<Asset>[], uploadReset: number) {
	const visible = table.items;
	const displayed = table.mode === 'paginated' ? table.pageItems : visible;
	const selected = state.records.find(asset => asset.id === state.selectedId);
	const preview = state.records.find(asset => asset.id === state.previewId);
	const previewMedia = (asset: Asset) => asset.icon
		? html`<en-icon name=${asset.icon} size="large"></en-icon>`
		: html`<span class="assets-text-symbol" aria-hidden="true">Aa</span>`;
	return html`
		<section ${ref(refs.root)} ${ref(actions.connect)} class="assets-workflow" data-workflow="assets" aria-label="Asset browser workflow">
			<div class="assets-guide">
				<h3>Find something for your study</h3>
				<p>Find <q>Campaign brief</q>, select it, switch between Grid, List and Table, inspect its preview, then insert it.</p>
				<p class="assets-note">The nine local examples contain six bundled symbols and three text excerpts. No file is uploaded or downloaded.</p>
			</div>
			<details id="assets-large-review" class="assets-large-review">
				<summary>Review a larger collection</summary>
				<div class="assets-review-controls">
					<en-select label="Library size" .value=${state.catalog} .items=${[{ value: 'sample', label: 'Sample · 9 assets' }, { value: 'large', label: 'Large · 1,000 assets' }]} @en-change=${actions.catalog}></en-select>
					<en-select label="Delivery" .value=${state.delivery} .items=${[{ value: 'windowed', label: 'Windowed' }, { value: 'paginated', label: 'Paginated' }]} @en-change=${actions.delivery}></en-select>
					<en-button variant="secondary" @click=${actions.updateSelected}>Update selected record</en-button>
				</div>
				<p class="assets-note">Large loads a deterministic local catalog and opens Table. Windowed delivery mounts nearby and focused rows; Paginated keeps each 20-record page in the DOM. Grid and List use pages for the large catalog. Browser Find and printing cover the current page in Paginated delivery. Selection always means one asset to insert.</p>
			</details>
			<details id="assets-file-intake" class="assets-large-review">
				<summary>Bring your own study files</summary>
				<div style="display:grid;gap:var(--en-space-4);padding-block-start:var(--en-space-4)">
					<p>Try file intake alongside the asset browser. This transfer rehearsal produces a local receipt; it does not add files to the catalog.</p>
					${fileUploadExample(uploadReset)}
				</div>
			</details>
			<div class="assets-filters">
				<en-search-input ${ref(refs.search)} label="Find assets" .value=${state.query}
					description="Search names and descriptions." @en-change=${actions.query}></en-search-input>
				<en-select label="Asset type" .value=${state.filter}
					.items=${[{ value: 'all', label: 'All assets' }, { value: 'icon', label: 'Icons' }, { value: 'document', label: 'Documents' }]}
					@en-change=${actions.filter}></en-select>
				<en-segmented-control label="View" .value=${state.layout}
					.items=${[{ value: 'grid', label: 'Grid' }, { value: 'list', label: 'List' }, { value: 'table', label: 'Table' }]}
					@en-change=${actions.layout}></en-segmented-control>
				<en-button variant="ghost" @click=${actions.clearFilters}>Clear filters</en-button>
			</div>
			<div class="assets-results-heading">
				<h3 ${ref(refs.collectionHeading)} id="assets-results-heading" tabindex="-1">Assets</h3>
				<p data-assets-count>${visible.length} of ${state.records.length} assets</p>
				<en-select label="Sort assets" .value=${state.sort} .items=${assetSortChoices} @en-change=${actions.sort}></en-select>
			</div>
			${state.catalog === 'large' ? html`<p class="assets-note">${table.mode === 'windowed'
				? 'Windowed selection: native radio arrow keys visit mounted rows only; Tab visits Preview actions. Choose Paginated for complete current-page keyboard and screen-reader table navigation. Neither mode traverses all 1,000 records at once.'
				: 'Paginated selection: all current-page rows are mounted for radio arrow keys, screen-reader table navigation and browser Find. Use Previous page and Next page to continue; your one selected asset is retained.'}</p>` : nothing}
			<fieldset class="assets-choices" ${ref(element => actions.collectionUpdated(element))}>
				<legend class="visually-hidden">Choose one asset</legend>
				${visible.length ? state.layout === 'table' ? html`
					<en-table label="Assets" sticky="header" class=${state.catalog === 'large' ? 'assets-table-surface assets-table-large' : 'assets-table-surface'}>
						<table class="assets-table" aria-rowcount=${state.catalog === 'large' ? table.rowCount() : nothing}>
							<caption>Available assets</caption>
							${tableColgroup(columns)}
							<thead>${tableHeader(columns, { sort: table.sort, onSort: (sort, event) => actions.sortBy(event, sort.column as AssetSortField) })}</thead>
							<tbody>${tableRows(table, columns, { rowSelected: asset => state.selectedId === asset.id })}</tbody>
						</table>
					</en-table>
				` : contentCollectionTemplate({
					label: 'Available assets', layout: state.layout, items: displayed, key: asset => asset.id,
					renderItem: asset => fileCardTemplate({
						name: html`<label class="assets-choice"><input class="en-radio" type="radio" name="asset" value=${asset.id}
							?checked=${state.selectedId === asset.id} @change=${actions.select}><span>${asset.name}</span></label>`,
						description: asset.description,
						media: html`<div class="assets-card-symbol" aria-hidden="true">${asset.icon ? html`<en-icon name=${asset.icon} size="large"></en-icon>` : html`<span class="assets-text-symbol">Aa</span>`}</div>`,
						metadata: metadataListTemplate({ items: [{ label: 'Type', value: asset.kind === 'icon' ? 'Icon' : 'Document' }, { label: 'Updated', value: asset.modified }] }),
						selected: state.selectedId === asset.id,
						actions: html`<en-button variant="secondary" data-asset-preview=${asset.id} @click=${(event: Event) => actions.preview(event, asset)}>Preview <span class="visually-hidden">${asset.name}</span></en-button>`,
					}),
				}) : emptyStateTemplate({ kind: 'no-results', title: 'No matching assets', description: 'Try another name or asset type. Your selection remains available below.',
					actions: html`<en-button variant="secondary" @click=${actions.clearFilters}>Restore current catalog</en-button>` })}
			</fieldset>
			${table.mode === 'paginated' && visible.length ? html`
				<en-pagination label="Asset pages" .page=${table.page + 1} .pageCount=${table.pageCount} @en-change=${actions.page}></en-pagination>` : nothing}
			<div class="assets-selection">
				<h3>Selected asset</h3>
				<p data-assets-selected>${selected ? html`${selected.name} · <code>${selected.id}</code>` : 'Choose an asset to insert.'}</p>
				${selected && !visible.some(asset => asset.id === selected.id) ? html`<p class="assets-note">Your selected asset is outside the current results. It is still selected and can be inserted.</p>` : nothing}
				<div class="assets-actions">
					<en-button @click=${actions.insert}>Insert selected asset</en-button>
					<en-button variant="secondary" @click=${actions.showSelected}>Show selected</en-button>
					<en-button variant="ghost" @click=${actions.clearSelection}>Clear selection</en-button>
				</div>
				${state.pending ? html`<p data-assets-pending>Inserting ${state.pending.name}. You can continue browsing.</p>` : nothing}
			</div>
			<p><a href="/api-examples/virtual-collection.html?progress-report">Review large collections with shared list and table virtualization</a></p>
			<aside class="assets-preview" ?hidden=${!preview} aria-labelledby="asset-preview-heading">
				<h3 id="asset-preview-heading" tabindex="-1" ${ref(element => actions.previewHeading(element))}>${preview ? `Preview: ${preview.name}` : 'Asset preview'}</h3>
				${preview ? html`
					<div class="assets-preview-content">${preview.icon ? previewMedia(preview) : html`<p class="assets-excerpt">${preview.excerpt}</p>`}</div>
					<p>${preview.description}</p>
					${metadataListTemplate({ items: [{ label: 'Format', value: preview.format }, { label: 'Updated', value: preview.modified }, { label: 'Asset ID', value: preview.id }] })}
				` : nothing}
				<en-button variant="secondary" @click=${actions.closePreview}>Close preview</en-button>
			</aside>
			<div class="assets-receipt">
				<h3>Last insertion</h3>
				<p data-assets-receipt>${state.receipt ? html`Insertion ${state.receipt.sequence}: ${state.receipt.name} · <code>${state.receipt.assetId}</code>` : 'No asset inserted.'}</p>
				<p class="assets-note">This receipt is a local simulation. It does not change a project.</p>
			</div>
			<p class="assets-status" role="status" aria-atomic="true" data-assets-status>${state.status}</p>
			<details class="assets-qa">
				<summary>Review this workflow</summary>
				<ol>
					<li>Find Campaign brief, select it, sort the results and switch between Grid, List and Table. The selected ID should remain <code>campaign-brief</code>.</li>
					<li>Open its preview and close it. Focus should return to the Preview control. Filtering does not move focus or select a different asset.</li>
					<li>Search for <q>no matching asset</q>. The empty result explains recovery; the previous selection remains named. Show selected restores its result, Clear filters restores the catalog, and Clear selection removes only the selection.</li>
					<li>Insert an asset, then select another while the request is pending. The receipt must name the original request. Repeated activation while pending must not create another insertion.</li>
					<li>Open Review a larger collection, choose Large and select Sparkle mark. Scroll well past it, sort and filter the catalog, and confirm Selected asset still names its key. Show selected recovers the record without replacing the selection.</li>
					<li>Switch Delivery to Paginated. Use Next page, select a record, then change page. Update selected record changes its details without changing its key; Show selected reveals the updated record. Try a query with no matches and Clear filters to recover. Use screen-reader table commands on the complete current page, and compare with Windowed delivery.</li>
					<li>Start an insertion and use Reset below. No late receipt should appear. Try the same flow with your keyboard, touch, larger text and Reading direction above.</li>
				</ol>
			</details>
		</section>
	`;
}
