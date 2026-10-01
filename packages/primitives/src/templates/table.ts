import { html } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { styleMap } from 'lit/directives/style-map.js';
import type { TableColumnDefinition, TableModel, TableSort } from '../state/table.js';
import { virtualTableRows } from './virtual-collection.js';

export interface TableColumn<T> extends TableColumnDefinition<T> {
	/** Content inside the component-owned native th/td; never return a cell or row wrapper. */
	renderCell: (item: T, index: number) => unknown;
	rowHeader?: boolean;
	/** Explicit widths preserve geometry when different records enter the window. */
	width?: string;
	className?: string;
	/** Keep a non-sortable column label available to table navigation without visible text. */
	headerLabelHidden?: boolean;
	/** Allow application/remote sorting without a local comparator. */
	sortable?: boolean;
}
export interface TableHeaderOptions {
	sort?: TableSort;
	/** The application accepts/rejects the next sort; rendering never changes records on its own. */
	onSort?: (sort: TableSort, event: MouseEvent) => void;
	/** Localize the next action, not just the current direction. */
	sortLabel?: (label: string, nextDirection: TableSort['direction']) => string;
	rowIndex?: number;
}
export interface TableRowsOptions<T> {
	rowClass?: (item: T, index: number) => string;
	rowSelected?: (item: T, index: number) => boolean | undefined;
	headerRows?: number;
}
export function tableColgroup<T>(columns: readonly TableColumn<T>[]): unknown {
	return html`<colgroup>${columns.map(column => html`<col class=${ifDefined(column.className)} style=${styleMap({ inlineSize: column.width })}>`)}</colgroup>`;
}
/** Native header markup remains framework-owned. No ancestor mutation or extra control event. */
export function tableHeader<T>(columns: readonly TableColumn<T>[], options: TableHeaderOptions = {}): unknown {
	return html`<tr aria-rowindex=${options.rowIndex ?? 1}>${columns.map(column => {
		const sortable = (column.sortable ?? !!column.compare) && !!options.onSort;
		const direction = options.sort?.column === column.key ? options.sort.direction : undefined;
		const next = direction === 'ascending' ? 'descending' : 'ascending';
		return html`<th scope="col" class=${ifDefined(column.className)} aria-sort=${ifDefined(direction)}>${sortable
			? html`<en-button variant="ghost" @click=${(event: MouseEvent) => options.onSort?.({ column: column.key, direction: next }, event)}><span aria-hidden="true">${column.label}</span><span style="position:absolute;inline-size:1px;block-size:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap">${options.sortLabel?.(column.label, next) ?? `Sort ${column.label} ${next}`}</span><en-icon slot="suffix" name="chevron-down" style=${styleMap({ transform: direction === 'ascending' ? 'rotate(180deg)' : undefined })}></en-icon></en-button>`
			: column.headerLabelHidden ? html`<span style="position:absolute;inline-size:1px;block-size:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap">${column.label}</span>` : column.label}</th>`;
	})}</tr>`;
}
export function tableCells<T>(item: T, index: number, columns: readonly TableColumn<T>[]): unknown {
	return columns.map(column => column.rowHeader
		? html`<th scope="row" class=${ifDefined(column.className)}>${column.renderCell(item, index)}</th>`
		: html`<td class=${ifDefined(column.className)}>${column.renderCell(item, index)}</td>`);
}
/** The same keyed native cells for windowed, paginated and complete delivery. */
export function tableRows<T>(model: TableModel<T>, columns: readonly TableColumn<T>[], options: TableRowsOptions<T> = {}): unknown {
	if (columns.length !== model.columns.length || columns.some((column, index) => column.key !== model.columns[index]?.key)) throw new RangeError('Rendered columns must match the table model columns in order.');
	const renderCells = (item: T, index: number) => tableCells(item, index, columns);
	if (model.mode === 'windowed' || model.mode === 'virtual') return virtualTableRows(model.collection, { ...options, columns: columns.length, renderCells });
	return repeat(model.pageItems, model.key, (item, pageIndex) => {
		const index = model.firstIndex + pageIndex;
		return html`<tr data-record=${model.key(item)} aria-rowindex=${pageIndex + (options.headerRows ?? 1) + 1} class=${ifDefined(options.rowClass?.(item, index))} data-selected=${ifDefined(options.rowSelected?.(item, index) ? '' : undefined)}>${renderCells(item, index)}</tr>`;
	});
}
