import { LitElement, css, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { TableModel } from '@en-reve/primitives/state/table.js';
import { TableController } from '@en-reve/primitives/interactions/table.js';
import { tableColgroup, tableHeader, tableRows, type TableColumn } from '@en-reve/primitives/templates/table.js';
import { virtualListRows } from '@en-reve/primitives/templates/virtual-collection.js';
import { tableStyles } from '@en-reve/styles/table.js';
import { typographyStyles } from '@en-reve/styles/typography.js';
import { createSelectionModel } from '@en-reve/primitives/state/selection.js';

type TableSurface = HTMLElement & { scrollElement: HTMLElement | null; scrollInsets: Readonly<{ blockStart: number; blockEnd: number }>; updateComplete: Promise<boolean> };

type Asset = { key: string; number: number; name: string; description: string; type: string };
const makeAsset = (number: number): Asset => ({
	key: `asset-${String(number).padStart(5, '0')}`, number, name: `Asset ${String(number).padStart(5, '0')}`,
	description: number % 4 === 0 ? 'A collaborative study with longer notes that wrap as the available width, theme, or text size changes. Keep the same place while reviewing these details.' : 'A study ready for collaborative review.',
	type: number % 3 === 0 ? 'Document' : 'Image',
});

/** Documentation-owned integration lab; this is not a public library component. */
export class VirtualCollectionDemo extends LitElement {
	static styles = [tableStyles, typographyStyles, css`
		:host { display:block; min-inline-size:0; color:var(--en-color-text); font-family:var(--en-font-ui-family); }
		* { box-sizing:border-box; }
		.controls { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,12rem),1fr)); gap:var(--en-space-4); align-items:end; }
		.scroll-demo summary { cursor:pointer; }
		.scroll-demo { margin-block:var(--en-space-4); padding:var(--en-space-4); border:var(--en-border-width) solid var(--en-color-line); border-radius:var(--en-radius-container); }
		.reveal-controls { grid-template-columns:minmax(0,1fr) auto; margin-block:var(--en-space-4); }
		.scroll-call { margin-block:var(--en-space-4) 0; white-space:pre-wrap; overflow-wrap:anywhere; tab-size:2; font-family:var(--en-font-code-family); font-size:var(--en-font-metadata-size); line-height:var(--en-font-body-line-height); }
		@media (max-width:28rem) { .reveal-controls { grid-template-columns:minmax(0,1fr); } .reveal-controls en-button { justify-self:start; } }
		.table-options { display:flex; flex-wrap:wrap; align-items:center; gap:var(--en-space-4); margin-block:var(--en-space-4); }
		.table-options en-select { min-inline-size:min(100%,12rem); }
		.actions { display:flex; flex-wrap:wrap; align-items:center; gap:var(--en-space-actions,var(--en-space-2)); margin-block:var(--en-space-4); }
		p { margin-block:var(--en-space-3); line-height:1.5; }
		en-table::part(viewport), .list-viewport { block-size:24rem; max-block-size:65dvh; overflow:auto; overflow-anchor:none; }
		en-table table { table-layout:fixed; }
		.list-viewport { border:var(--en-border-width) solid var(--en-color-line); border-radius:var(--en-radius-container); padding-inline:var(--en-space-3); }
		ul { list-style:none; padding:0; margin:0; }
		li[data-en-virtual-key], li[data-record] { padding-block:var(--en-space-3); border-block-end:var(--en-border-width) solid var(--en-color-line); }
		.list-row { display:grid; grid-template-columns:auto minmax(0,1fr); gap:var(--en-space-3); align-items:start; }
		.description { color:var(--en-color-text-muted); font-weight:normal; overflow-wrap:anywhere; }
		.asset-selection { position:relative; }
		.asset-selection::part(label-text) { display:none; }
		th, td { overflow-wrap:anywhere; }
		.selection-column { inline-size:4.5rem; } .type-column { inline-size:20%; }
		@media print { en-table::part(viewport), .list-viewport { block-size:auto; max-block-size:none; overflow:visible; } .controls, .scroll-demo, .table-options, .actions, .paging { display:none; } }
		@media (prefers-reduced-motion:reduce) { * { scroll-behavior:auto; } }
	`];
	private records = Array.from({ length: 10_000 }, (_, index) => makeAsset(index + 1));
	private selected = createSelectionModel<string>([], { multiple: true });
	private presentation = 'table';
	private delivery = 'windowed';
	private sticky = 'header';
	private stickyCaption = false;
	private showSummary = false;
	private revealKey = 'asset-09000';
	private scrollResult = '';
	private scrollBehavior: ScrollBehavior = 'auto';
	private scrollBlock: ScrollLogicalPosition = 'start';
	private scrollInline: ScrollLogicalPosition = 'nearest';
	private scrollContainer: 'all' | 'nearest' = 'all';
	private descending = false;
	private page = 0;
	private readonly pageSize = 20;
	private prepended = 0;
	private message = '';
	private columns: readonly TableColumn<Asset>[] = [
		{ key: 'selection', label: 'Select', width: '4.5rem', renderCell: item => this.selection(item) },
		{ key: 'name', label: 'Name', rowHeader: true, compare: (a, b) => a.number - b.number,
			renderCell: item => html`${item.name}<p class="description">${item.description}</p>` },
		{ key: 'type', label: 'Type', width: '20%', renderCell: item => item.type },
	];
	private tableModel = new TableModel<Asset>({ items: this.records, columns: this.columns, key: item => item.key, estimateSize: 72, overscan: 3, initialCount: 20, pageSize: this.pageSize, sort: { column: 'name', direction: 'ascending' } });
	private get model() { return this.tableModel.collection; }
	private controller = new TableController(this, this.tableModel, {
		table: () => this.table,
		viewport: () => this.viewport,
		content: () => this.renderRoot.querySelector(this.presentation === 'table' ? 'tbody' : 'ul'),
		onFocusedItemRemoved: (key, viewport) => {
			viewport.focus({ preventScroll: true });
			this.message = `${key} was removed. Focus returned to the collection.`;
			this.requestUpdate();
		},
	});
	private get table(): TableSurface | null { return this.renderRoot.querySelector<TableSurface>('en-table'); }
	private get viewport(): HTMLElement | null {
		return this.presentation === 'table'
			? this.table?.scrollElement ?? null
			: this.renderRoot.querySelector<HTMLElement>('.list-viewport');
	}
	private change(event: Event, apply: (value: string) => void) {
		const field = event.currentTarget as HTMLElement & { value: string };
		if (event.composedPath()[0] !== field || !event.cancelable || event.defaultPrevented) return;
		const proposed = (event as CustomEvent<{ proposed: string }>).detail.proposed;
		queueMicrotask(() => { if (!event.defaultPrevented && field.isConnected && field.value === proposed) apply(proposed); });
	}
	private toggle(event: Event, apply: (checked: boolean) => void) {
		const field = event.currentTarget as HTMLElement & { checked: boolean };
		if (event.composedPath()[0] !== field || !event.cancelable || event.defaultPrevented) return;
		const proposed = (event as CustomEvent<{ proposed: boolean }>).detail.proposed;
		queueMicrotask(() => { if (!event.defaultPrevented && field.isConnected && field.checked === proposed) apply(proposed); });
	}
	private async refreshTable() {
		this.requestUpdate(); await this.updateComplete; await this.table?.updateComplete;
		this.controller.refresh();
	}
	private async setSticky(value: string) {
		if (!['header', 'footer', 'both', 'none'].includes(value)) return;
		this.sticky = value; await this.refreshTable();
	}
	private async setPresentation(value: string) {
		if (value !== 'table' && value !== 'list') return;
		this.presentation = value; this.requestUpdate(); await this.updateComplete;
		this.controller.invalidateMeasurements(); this.controller.refresh();
	}
	private async setDelivery(value: string) {
		if (value !== 'windowed' && value !== 'paginated') return;
		this.delivery = value; this.tableModel.setMode(value); this.page = 0; this.requestUpdate(); await this.updateComplete;
		if (this.viewport) this.viewport.scrollTop = 0;
		this.controller.refresh();
	}
	private select(item: Asset, event: Event) {
		this.toggle(event, checked => {
			if (checked !== this.selected.has(item.key)) this.selected.toggle(item.key);
			this.requestUpdate();
		});
	}
	private async reveal() {
		if (this.delivery === 'paginated') {
			const index = this.records.findIndex(item => item.key === this.revealKey);
			if (index < 0) { this.scrollResult = 'That asset is not in this collection.'; this.requestUpdate(); return; }
			this.page = Math.floor(index / this.pageSize); this.tableModel.setPage(this.page); this.requestUpdate(); await this.updateComplete;
			if (this.viewport) this.viewport.scrollTop = 0;
			this.scrollResult = `Opened page ${this.page + 1} for ${this.revealKey}.`;
		} else {
			const found = this.controller.scrollToKey(this.revealKey, this.revealOptions);
			this.scrollResult = found ? 'Returned true. Reveal requested; focus and selection are unchanged.' : 'Returned false. That key is not in this collection; the scroll position is unchanged.';
		}
		this.requestUpdate();
	}
	private get revealOptions() {
		return { behavior: this.scrollBehavior, block: this.scrollBlock, inline: this.scrollInline, container: this.scrollContainer };
	}
	private get revealCall() {
		return `controller.scrollToKey(${JSON.stringify(this.revealKey)}, {\n${Object.entries(this.revealOptions).map(([name, value]) => `\t${name}: ${JSON.stringify(value)},`).join('\n')}\n});`;
	}
	private async sort(direction?: 'ascending' | 'descending') {
		this.descending = direction ? direction === 'descending' : !this.descending;
		this.tableModel.setSort({ column: 'name', direction: this.descending ? 'descending' : 'ascending' });
		this.records = [...this.tableModel.items]; this.page = 0; this.message = `Sorted by name ${this.descending ? 'descending' : 'ascending'}.`;
		this.requestUpdate(); await this.updateComplete; this.controller.refresh();
	}
	private async prependAsset() {
		const item = makeAsset(--this.prepended);
		this.records = [item, ...this.records]; this.tableModel.setItems(this.records); this.records = [...this.tableModel.items];
		this.message = `${item.name} prepended; selection is preserved.`;
		this.requestUpdate(); await this.updateComplete; this.controller.refresh();
	}
	private async removeSelected() {
		const count = this.selected.selected.get().length;
		this.records = this.records.filter(item => !this.selected.has(item.key)); this.selected.clear();
		this.tableModel.setItems(this.records); this.records = [...this.tableModel.items]; this.page = this.tableModel.page;
		this.message = `${count} selected ${count === 1 ? 'asset' : 'assets'} removed.`;
		this.requestUpdate(); await this.updateComplete; this.controller.refresh();
	}
	private pageChanged(event: Event) {
		const pager = event.currentTarget as HTMLElement & { page: number };
		if (event.composedPath()[0] !== pager || !event.cancelable || event.defaultPrevented) return;
		const proposed = (event as CustomEvent<{ proposed: number }>).detail.proposed;
		queueMicrotask(() => {
			if (!event.defaultPrevented && pager.isConnected && pager.page === proposed) void this.turnPage(proposed - 1);
		});
	}
	private async turnPage(page: number) {
		this.tableModel.setPage(page); this.page = this.tableModel.page;
		this.message = `Page ${this.page + 1} of ${this.tableModel.pageCount}, assets ${this.records.length ? this.tableModel.firstIndex + 1 : 0}–${Math.min(this.records.length, this.tableModel.firstIndex + this.pageSize)}.`;
		this.requestUpdate(); await this.updateComplete; if (this.viewport) this.viewport.scrollTop = 0;
	}
	private selection(item: Asset) {
		return html`<en-checkbox class="asset-selection" label=${`Select ${item.name}`} .checked=${this.selected.has(item.key)} @en-change=${(event: Event) => this.select(item, event)}></en-checkbox>`;
	}
	private listItem = (item: Asset) => html`
		<div class="list-row">${this.selection(item)}<div><strong>${item.name}</strong><p class="description">${item.description}</p><span>${item.type}</span></div></div>
	`;
	protected render() {
		const paginated = this.delivery === 'paginated';
		const pageItems = this.tableModel.pageItems;
		return html`
			<div class="controls">
				<en-select label="Presentation" .value=${this.presentation} .items=${[{value:'table',label:'Table'},{value:'list',label:'List'}]} @en-change=${(event: Event) => this.change(event, value => { void this.setPresentation(value); })}></en-select>
				<en-select label="Delivery" .value=${this.delivery} .items=${[{value:'windowed',label:'Windowed'},{value:'paginated',label:'Paginated'}]} @en-change=${(event: Event) => this.change(event, value => { void this.setDelivery(value); })}></en-select>
			</div>

			${this.presentation === 'table' ? html`<div class="table-options">
				<en-select label="Sticky table sections" .value=${this.sticky} .items=${[{value:'header',label:'Header'}, {value:'footer',label:'Footer'}, {value:'both',label:'Header and footer'}, {value:'none',label:'None'}]} @en-change=${(event: Event) => this.change(event, value => { void this.setSticky(value); })}></en-select>
				<en-checkbox .checked=${this.stickyCaption} @en-change=${(event: Event) => this.toggle(event, checked => { this.stickyCaption = checked; void this.refreshTable(); })}>Keep caption visible</en-checkbox>
				<en-checkbox .checked=${this.showSummary} @en-change=${(event: Event) => this.toggle(event, checked => { this.showSummary = checked; void this.refreshTable(); })}>Show table summary</en-checkbox>
			</div>` : nothing}
			<p>10,000 stable-keyed records with variable-height descriptions. Windowed delivery mounts nearby rows and retains focused rows. Choose Paginated for sequential reading, browser Find and printing of the current page.</p>
			<div class="actions">
				<en-button variant="secondary" @click=${() => this.sort()}>Sort name ${this.descending ? 'ascending' : 'descending'}</en-button>
				<en-button variant="secondary" @click=${() => this.prependAsset()}>Prepend asset</en-button>
				<en-button variant="secondary" ?disabled=${!this.selected.selected.get().length} @click=${() => this.removeSelected()}>Remove selected</en-button>
				<span data-selection-status>${this.selected.selected.get().length} selected · ${this.records.length.toLocaleString('en-US')} records</span>
			</div>
			<p role="status" aria-atomic="true">${this.message}</p>
			${this.presentation === 'table' ? html`
				<en-table label="Large asset table" sticky=${this.sticky} ?sticky-caption=${this.stickyCaption}>
					<table aria-rowcount=${paginated ? nothing : this.tableModel.rowCount({ footerRows: this.showSummary ? 1 : 0 })}>
						<caption>${paginated ? `Assets, page ${this.page + 1}` : 'Windowed assets'}</caption>
						${tableColgroup(this.columns)}
						<thead>${tableHeader(this.columns, { sort: this.tableModel.sort, onSort: sort => { void this.sort(sort.direction); } })}</thead>
						<tbody>${tableRows(this.tableModel, this.columns)}</tbody>
						${this.showSummary ? html`<tfoot><tr aria-rowindex=${paginated ? nothing : this.records.length + 2}><td colspan="3">${this.selected.selected.get().length} selected across ${this.records.length.toLocaleString('en-US')} assets${paginated ? ` · ${pageItems.length} on this page` : nothing}</td></tr></tfoot>` : nothing}
					</table>
				</en-table>
			` : html`
				<div class="list-viewport" data-virtual-viewport tabindex="0" role="region" aria-label="Large asset list">
					<ul role="list">${paginated
						? repeat(pageItems, item => item.key, item => html`<li data-record=${item.key}>${this.listItem(item)}</li>`)
						: virtualListRows(this.model, { renderItem: this.listItem })}</ul>
				</div>
			`}
			${paginated ? html`<en-pagination class="paging" label="Asset pages" .page=${this.page + 1}
				.pageCount=${this.tableModel.pageCount} @en-change=${this.pageChanged}></en-pagination>` : nothing}
			<details class="scroll-demo">
				<summary id="scroll-demo-heading" class="en-heading-small">${paginated ? 'Find an asset' : 'scrollToKey()'}</summary>
				<div role="region" aria-labelledby="scroll-demo-heading">
					<p>${paginated ? 'Open the page containing a stable asset key.' : 'Reveal a stable asset key without selecting it or moving focus. Try asset-09000 or asset-00001.'}</p>
					<div class="controls reveal-controls">
						<en-text-field label="Asset key" .value=${this.revealKey} @en-change=${(event: Event) => this.change(event, value => { this.revealKey = value; this.scrollResult = ''; this.requestUpdate(); })}></en-text-field>
						<en-button variant="secondary" @click=${() => this.reveal()}>Show asset</en-button>
					</div>
					${!paginated ? html`
					<div class="controls">
						<en-select label="Scroll behavior" .value=${this.scrollBehavior} .items=${['auto','instant','smooth'].map(value => ({ value, label:value }))} @en-change=${(event: Event) => this.change(event, value => { this.scrollBehavior = value as ScrollBehavior; this.requestUpdate(); })}></en-select>
						<en-select label="Block alignment" .value=${this.scrollBlock} .items=${['start','center','end','nearest'].map(value => ({ value, label:value }))} @en-change=${(event: Event) => this.change(event, value => { this.scrollBlock = value as ScrollLogicalPosition; this.requestUpdate(); })}></en-select>
						<en-select label="Inline alignment" .value=${this.scrollInline} .items=${['start','center','end','nearest'].map(value => ({ value, label:value }))} @en-change=${(event: Event) => this.change(event, value => { this.scrollInline = value as ScrollLogicalPosition; this.requestUpdate(); })}></en-select>
						<en-select label="Scroll containers" .value=${this.scrollContainer} .items=${[{value:'all',label:'All ancestors'},{value:'nearest',label:'Nearest scroll container'}]} @en-change=${(event: Event) => this.change(event, value => { this.scrollContainer = value as 'all' | 'nearest'; this.requestUpdate(); })}></en-select>
					</div>
					<pre class="scroll-call" dir="ltr" aria-label="Current scrollToKey call"><code>${this.revealCall}</code></pre>` : nothing}
					<p role="status" aria-label="Scroll result" aria-atomic="true">${this.scrollResult}</p>
				</div>
			</details>
		`;
	}
}
