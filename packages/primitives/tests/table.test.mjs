import test from 'node:test';
import assert from 'node:assert/strict';
import { html } from 'lit';
import { render } from '@lit-labs/ssr';
import { parse } from 'parse5';
import { TableModel } from '../dist/state/table.js';
import { createSelectionModel } from '../dist/state/selection.js';
import { tableHeader, tableRows } from '../dist/templates/table.js';

const items = Array.from({ length: 100 }, (_, index) => ({ key: `item-${index}`, amount: 100 - index }));
const columns = [{ key: 'amount', label: 'Amount', compare: (a, b) => a.amount - b.amount, rowHeader: true, renderCell: item => item.amount }];
const make = (options = {}) => new TableModel({ items, key: item => item.key, columns, initialCount: 5, pageSize: 10, ...options });
const descendants = node => [node, ...(node.childNodes ?? []).flatMap(descendants)];
const attr = (node, name) => node.attrs?.find(attribute => attribute.name === name)?.value;

test('complete filtering and stable sorting precede window selection without mutating records', () => {
	const table = make();
	table.setSort({ column: 'amount', direction: 'ascending' });
	assert.equal(table.items[0].key, 'item-99');
	assert.equal(table.collection.entries.find(entry => entry.kind === 'item').key, 'item-99');
	assert.equal(items[0].amount, 100);
	table.setFilter(item => item.amount % 2 === 0);
	assert.equal(table.collection.count, 50);
	assert.equal(table.items[0].amount, 2);
	table.setFilter();
	assert.equal(table.collection.count, 100);
});

test('key selection survives unmounting, sorting, filtering and page changes independently', () => {
	const table = make();
	const selection = createSelectionModel(['item-80'], { multiple: true });
	table.setSort({ column: 'amount', direction: 'ascending' });
	table.setFilter(item => item.amount > 50);
	table.setMode('paginated'); table.setPage(3);
	assert.ok(selection.has('item-80'));
	table.setFilter();
	assert.ok(table.items.some(item => selection.has(item.key)));
});

test('pagination clamps after removal and resets explicitly for sort/filter/delivery', () => {
	const table = make({ mode: 'paginated' });
	table.setPage(9);
	assert.equal(table.firstIndex, 90);
	assert.equal(table.rowCount({ footerRows: 1 }), 12);
	table.setItems(items.slice(0, 12));
	assert.equal(table.page, 1); assert.equal(table.pageItems.length, 2);
	assert.equal(table.rowCount(), 3);
	table.setSort({ column: 'amount', direction: 'descending' });
	assert.equal(table.page, 0);
	table.setItems([]);
	assert.equal(table.pageCount, 1); assert.equal(table.rowCount(), 1);
	assert.throws(() => table.setPage(Infinity), RangeError);
});

test('ties retain source order and application sorted columns need no inferred comparator', () => {
	const ties = make({ items: [{key:'a',amount:1},{key:'b',amount:1},{key:'c',amount:2}] });
	ties.setSort({column:'amount',direction:'descending'});
	assert.deepEqual(ties.items.map(item => item.key), ['c','a','b']);
	const remote = make({ columns: [{ key: 'amount', label: 'Amount' }] });
	remote.setSort({column:'amount',direction:'ascending'});
	assert.equal(remote.items[0].key, 'item-0');
	assert.throws(() => remote.setSort({column:'unknown',direction:'ascending'}), RangeError);
});

test('shared renderer produces valid native SSR table and independent pagination indices', () => {
	const model = make({ mode: 'paginated' }); model.setPage(2);
	const doc = parse([...render(html`<table aria-rowcount=${model.rowCount()}><thead>${tableHeader(columns, {sort:{column:'amount',direction:'ascending'},onSort:()=>{},sortLabel:(name, direction)=>`${name}: ${direction}`})}</thead><tbody>${tableRows(model, columns, {rowSelected: item => item.key === 'item-20'})}</tbody></table>`)].join(''));
	const nodes = descendants(doc);
	const rows = nodes.filter(node => node.tagName === 'tr');
	assert.equal(rows.length, 11);
	assert.equal(attr(rows[1], 'aria-rowindex'), '2');
	assert.equal(attr(rows.at(-1), 'aria-rowindex'), '11');
	assert.equal(attr(rows[1], 'data-selected'), '');
	assert.equal(attr(rows[1], 'aria-selected'), undefined);
	assert.equal(attr(nodes.find(node => node.tagName === 'th'), 'aria-sort'), 'ascending');
	assert.ok(rows.every(row => row.childNodes.filter(node => node.tagName).every(node => ['td','th'].includes(node.tagName))));
	assert.ok(nodes.some(node => node.tagName === 'en-button'));
	assert.ok(nodes.some(node => node.nodeName === '#text' && node.value === 'Amount: descending'));
});

test('invalid column geometry and page sizes reject before rendering', () => {
	assert.throws(() => make({ pageSize: 0 }), RangeError);
	assert.throws(() => make({ columns: [...columns, ...columns] }), RangeError);
	assert.throws(() => tableRows(make(), []), RangeError);
});

test('rejected record/filter updates leave the preceding source and table usable', () => {
	const table = make();
	table.setFilter(item => item.amount > 50);
	const snapshot = table.items;
	assert.throws(() => table.setItems([{key:'duplicate',amount:1},{key:'duplicate',amount:2}]), TypeError);
	assert.equal(table.items, snapshot);
	assert.throws(() => table.setItems(new Array(2)), TypeError);
	assert.throws(() => table.setFilter(() => { throw new Error('filter failed'); }), /filter failed/);
	assert.equal(table.items, snapshot);
	table.setFilter();
	assert.equal(table.items.length, 100);
	table.setSort({ column: 'amount', direction: 'ascending' });
	assert.equal(table.items[0].amount, 1);
});

test('column changes reconcile sorting and page size keeps the current first record in range', () => {
  const table=make({mode:'paginated',pageSize:10});table.setPage(4);table.setPageSize(15);
  assert.equal(table.page,2);assert.equal(table.firstIndex,30);assert.equal(table.pageItems.length,15);
  table.setSort({column:'amount',direction:'descending'});
  table.setColumns([{key:'other',label:'Other'}]);assert.equal(table.sort,undefined);
  const previous=table.columns;assert.throws(()=>table.setColumns([]),RangeError);assert.equal(table.columns,previous);
  assert.throws(()=>table.setPageSize(0),RangeError);assert.equal(table.pageSize,15);
});
