import { Signal } from 'signal-polyfill';
import { VirtualCollection, type VirtualCollectionOptions } from './virtual-collection.js';

import { collectionGetKey, type CollectionMode } from './collection.js';

/** windowed is the compatibility spelling of virtual. */
export type TableMode = CollectionMode | 'windowed';
export interface TableSort { readonly column: string; readonly direction: 'ascending' | 'descending' }
export interface TableColumnDefinition<T> {
	readonly key: string;
	readonly label: string;
	/** Compare the complete records, never only the mounted window. Omit for application/remote sorting. */
	readonly compare?: (a: T, b: T) => number;
}
export type TableModelOptions<T> = VirtualCollectionOptions<T> & {
	columns: readonly TableColumnDefinition<T>[];
	mode?: TableMode;
	pageSize?: number;
	sort?: TableSort;
}

/** Application-invoked table state. Selection remains an independent stable-keyed model. */
export class TableModel<T> {
	readonly collection: VirtualCollection<T>;
	readonly revision = new Signal.State(0);
	private columnDefinitions: readonly TableColumnDefinition<T>[];
	/** @deprecated Use getKey. */
	readonly key: (item: T) => string;
	get getKey(): (item: T) => string { return this.key; }
	private rowsPerPage: number;
	#source: readonly T[];
	#items: readonly T[] = [];
	#sort?: TableSort;
	#filter?: (item: T) => boolean;
	#mode: TableMode;
	#page = 0;
	constructor(options: TableModelOptions<T>) {
		this.columnDefinitions = Object.freeze([...options.columns]);
		if (!this.columns.length || new Set(this.columns.map(column => column.key)).size !== this.columns.length) throw new RangeError('Table columns require unique keys and at least one column.');
		this.key = collectionGetKey(options);
		this.rowsPerPage = options.pageSize ?? 20;
		if (!Number.isInteger(this.pageSize) || this.pageSize < 1) throw new RangeError('Table pageSize must be a positive integer.');
		this.#mode = options.mode ?? 'windowed';
		this.#validateMode(this.#mode);
		this.#source = [...options.items];
		this.collection = new VirtualCollection(options);
		this.setSort(options.sort);
	}
	#changed() { this.revision.set(this.revision.get() + 1); }
	#validateMode(mode: TableMode) { if (!['virtual', 'windowed', 'paginated', 'all'].includes(mode)) throw new RangeError('Unknown table delivery mode.'); }
	#refresh(source: readonly T[], sort: TableSort | undefined, filter: ((item: T) => boolean) | undefined, page: number) {
		const keys = new Set<string>();
		for (const item of source) {
			const key = this.key(item);
			if (typeof key !== 'string' || keys.has(key)) throw new TypeError('Table records require unique string keys.');
			keys.add(key);
		}
		let items = filter ? source.filter(filter) : [...source];
		const compare = this.columns.find(column => column.key === sort?.column)?.compare;
		if (compare && sort) {
			const sign = sort.direction === 'ascending' ? 1 : -1;
			items = items.map((item, index) => ({ item, index })).sort((a, b) => sign * compare(a.item, b.item) || a.index - b.index).map(entry => entry.item);
		}
		this.collection.setItems(items);
		this.#source = source;
		this.#sort = sort;
		this.#filter = filter;
		this.#items = Object.freeze(items);
		this.#page = Math.min(page, this.pageCount - 1);
		this.#changed();
	}
	get items(): readonly T[] { this.revision.get(); return this.#items; }
	get columns(): readonly TableColumnDefinition<T>[] { this.revision.get(); return this.columnDefinitions; }
	get pageSize(): number { this.revision.get(); return this.rowsPerPage; }
	setColumns(columns: readonly TableColumnDefinition<T>[]): void {
		if (!columns.length || new Set(columns.map(column => column.key)).size !== columns.length) throw new RangeError('Table columns require unique keys and at least one column.');
		const previous = this.columnDefinitions;
		this.columnDefinitions = Object.freeze([...columns]);
		try { this.#refresh(this.#source, columns.some(column => column.key === this.#sort?.column) ? this.#sort : undefined, this.#filter, this.#page); }
		catch (error) { this.columnDefinitions = previous; throw error; }
	}
	setPageSize(size: number): void {
		if (!Number.isInteger(size) || size < 1) throw new RangeError('Table pageSize must be a positive integer.');
		if (size === this.rowsPerPage) return;
		const first = this.firstIndex; this.rowsPerPage = size;
		this.#page = Math.min(Math.floor(first / size), this.pageCount - 1); this.#changed();
	}
	get sort(): TableSort | undefined { this.revision.get(); return this.#sort; }
	get mode(): TableMode { this.revision.get(); return this.#mode; }
	get page(): number { this.revision.get(); return this.#page; }
	get pageCount(): number { this.revision.get(); return Math.max(1, Math.ceil(this.#items.length / this.pageSize)); }
	get firstIndex(): number { return this.mode === 'paginated' ? this.page * this.pageSize : 0; }
	get pageItems(): readonly T[] { return this.mode === 'paginated' ? this.items.slice(this.firstIndex, this.firstIndex + this.pageSize) : this.items; }
	setItems(items: readonly T[]): void { this.#refresh([...items], this.#sort, this.#filter, this.#page); }
	setFilter(filter?: (item: T) => boolean): void { this.#refresh(this.#source, this.#sort, filter, 0); }
	setSort(sort?: TableSort): void {
		if (sort && (!this.columns.some(column => column.key === sort.column) || !['ascending', 'descending'].includes(sort.direction))) throw new RangeError('Unknown table sort column or direction.');
		this.#refresh(this.#source, sort ? Object.freeze({ ...sort }) : undefined, this.#filter, 0);
	}
	setMode(mode: TableMode): void { this.#validateMode(mode); if (this.#mode === mode) return; this.#mode = mode; this.#page = 0; this.#changed(); }
	setPage(page: number): void {
		if (!Number.isFinite(page)) throw new RangeError('Table page must be finite.');
		const next = Math.max(0, Math.min(this.pageCount - 1, Math.floor(page)));
		if (next !== this.#page) { this.#page = next; this.#changed(); }
	}
	indexOf(key: string): number { return this.collection.indexOf(key); }
	/** A paginated table exposes only its current page to native table traversal. */
	rowCount({ headerRows = 1, footerRows = 0 }: { headerRows?: number; footerRows?: number } = {}): number {
		if (![headerRows, footerRows].every(value => Number.isInteger(value) && value >= 0)) throw new RangeError('Table header/footer counts must be non-negative integers.');
		return (this.mode === 'paginated' ? this.pageItems.length : this.items.length) + headerRows + footerRows;
	}
}
