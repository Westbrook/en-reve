import { html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import type { VirtualCollection } from '../state/virtual-collection.js';

interface VirtualRowOptions<T> {
	/** Optional author-owned presentation and state; stable DOM identity comes from the model key. */
	rowClass?: (item: T, index: number) => string;
}

export interface VirtualListRowsOptions<T> extends VirtualRowOptions<T> {
	renderItem: (item: T, index: number) => unknown;
}

export interface VirtualTableRowsOptions<T> extends VirtualRowOptions<T> {
	rowSelected?: (item: T, index: number) => boolean | undefined;
	/** Number of native columns; virtual rows with row/column spans are not supported. */
	columns: number;
	/** Return native td/th cells, not a second tr wrapper. */
	renderCells: (item: T, index: number) => unknown;
	/** Include every persistent header row in the table's aria-rowcount and index those rows too. */
	headerRows?: number;
}

/** Native list adapter. Use a margin/padding-free list with no row gaps or collapsing margins. */
export function virtualListRows<T>(model: VirtualCollection<T>, options: VirtualListRowsOptions<T>): unknown {
	return repeat(model.entries, entry => `${entry.kind}:${entry.key}`, entry => entry.kind === 'gap'
		? html`<li data-en-virtual-gap aria-hidden="true" role="presentation" style=${`block-size:${entry.size}px;min-block-size:0;margin:0;padding:0;border:0;list-style:none;pointer-events:none`}></li>`
		: html`
			<li data-en-virtual-key=${entry.key} aria-posinset=${entry.index + 1} aria-setsize=${model.count}
				class=${ifDefined(options.rowClass?.(entry.item, entry.index))}
				style="margin-block:0"
			>${options.renderItem(entry.item, entry.index)}</li>
		`);
}

/** Native tbody adapter. The containing table owns aria-rowcount and fixed column geometry. */
export function virtualTableRows<T>(model: VirtualCollection<T>, options: VirtualTableRowsOptions<T>): unknown {
	if (!Number.isInteger(options.columns) || options.columns < 1) throw new RangeError('Virtual table columns must be a positive integer.');
	const headerRows = options.headerRows ?? 1;
	if (!Number.isInteger(headerRows) || headerRows < 0) throw new RangeError('Virtual table headerRows must be a non-negative integer.');
	return repeat(model.entries, entry => `${entry.kind}:${entry.key}`, entry => entry.kind === 'gap'
		? html`<tr data-en-virtual-gap aria-hidden="true" style="border:0;pointer-events:none"><td colspan=${options.columns} style=${`height:${entry.size}px;min-height:0;padding:0;border:0;font-size:0;line-height:0`}>${nothing}</td></tr>`
		: html`
			<tr data-en-virtual-key=${entry.key} aria-rowindex=${entry.index + headerRows + 1}
				data-selected=${ifDefined(options.rowSelected?.(entry.item, entry.index) ? '' : undefined)}
				class=${ifDefined(options.rowClass?.(entry.item, entry.index))}
			>${options.renderCells(entry.item, entry.index)}</tr>
		`);
}
