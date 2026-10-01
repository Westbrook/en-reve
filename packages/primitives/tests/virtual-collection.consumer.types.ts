import type { VirtualCollectionController } from '../dist/interactions/virtual-collection.js';

declare const controller: VirtualCollectionController<{ id: string }>;
const platformOptions: ScrollIntoViewOptions = {
	behavior: 'smooth',
	block: 'center',
	inline: 'nearest',
};
const found: boolean = controller.scrollToKey('record', platformOptions);
controller.scrollToKey('record');
controller.scrollToKey('record', {});
controller.scrollToKey('record', { container: 'nearest', behavior: 'instant', block: 'end', inline: 'start' });
controller.scrollToKey('record', { container: 'all', behavior: 'auto', block: 'nearest', inline: 'end' });
void found;

// @ts-expect-error The custom align option is replaced by the platform's block option.
controller.scrollToKey('record', { align: 'center' });
// @ts-expect-error Unsupported behavior values must not enter the public contract.
controller.scrollToKey('record', { behavior: 'animated' });
// @ts-expect-error Ancestor scope uses the standard container enum.
controller.scrollToKey('record', { container: 'viewport' });

import { TableModel } from '../dist/state/table.js';
import { TableController } from '../dist/interactions/table.js';
import { tableHeader, tableRows, type TableColumn } from '../dist/templates/table.js';
type Asset = { id: string; name: string };
const columns: readonly TableColumn<Asset>[] = [{ key: 'name', label: 'Name', rowHeader: true, compare: (a, b) => a.name.localeCompare(b.name), renderCell: item => item.name }];
const table = new TableModel<Asset>({ items: [], key: item => item.id, columns, pageSize: 20 });
table.setSort({ column: 'name', direction: 'ascending' });
table.setFilter(item => item.name.startsWith('A'));
tableHeader(columns, { sort: table.sort, onSort: sort => table.setSort(sort), sortLabel: (label, direction) => `${label} ${direction}` });
tableRows(table, columns, { rowSelected: item => item.id === 'selected' });
declare const tableController: TableController<Asset>;
const tableFound: boolean = tableController.scrollToKey('record', platformOptions);
void tableFound;
// @ts-expect-error Column render callback receives an Asset.
const wrongColumn: TableColumn<Asset> = { key: 'name', label: 'Name', renderCell: (item: number) => item };
void wrongColumn;
// @ts-expect-error Delivery is explicit and bounded.
table.setMode('automatic');

import { VirtualCollection } from '../dist/state/virtual-collection.js';
import { normalizeTreeData, type TreeDataItem } from '../dist/interactions/tree.js';
const keyed: readonly TreeDataItem[] = [{ key: 'folder', label: 'Folder', children: [{ value: 'legacy', label: 'Legacy' }] }];
const normalizedKey: string = normalizeTreeData(keyed)[0]!.key;
const canonical = new VirtualCollection<Asset>({ items: [], getKey: item => item.id });
new TableModel<Asset>({ items: [], getKey: item => item.id, columns, mode: 'virtual' });
void normalizedKey; void canonical;
// @ts-expect-error A stable identity extractor remains mandatory.
new VirtualCollection<Asset>({ items: [] });
// @ts-expect-error A tree record requires canonical key or legacy value.
const missingKey: TreeDataItem = { label: 'Invalid' };
void missingKey;
