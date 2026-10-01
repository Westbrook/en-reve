import test from 'node:test';
import assert from 'node:assert/strict';
import { html } from 'lit';
import { render } from '@lit-labs/ssr';
import { parse } from 'parse5';
import { VirtualCollection } from '../dist/state/virtual-collection.js';
import { virtualListRows, virtualTableRows } from '../dist/templates/virtual-collection.js';

const items = Array.from({ length: 10000 }, (_, index) => ({ id: `item-${index}`, name: `Asset ${index}` }));
const model = () => new VirtualCollection({ items, key: item => item.id, initialCount: 20 });
const descendants = node => [node, ...(node.childNodes ?? []).flatMap(descendants)];
const attr = (node, name) => node.attrs?.find(attribute => attribute.name === name)?.value;
const documentFor = template => parse([...render(template)].join(''));

test('table renderer produces a deterministic useful native SSR page without browser initialization', () => {
	const source = () => html`<table aria-rowcount="10001"><thead><tr><th>Asset</th></tr></thead><tbody>${virtualTableRows(model(), { columns: 1, renderCells: item => html`<td>${item.name}</td>` })}</tbody></table>`;
	assert.equal([...render(source())].join(''), [...render(source())].join(''));
	const nodes = descendants(documentFor(source()));
	const tbody = nodes.find(node => node.tagName === 'tbody');
	const rows = tbody.childNodes.filter(node => node.tagName === 'tr');
	const dataRows = rows.filter(node => attr(node, 'data-en-virtual-key') !== undefined);
	assert.equal(dataRows.length, 20);
	assert.equal(attr(dataRows[0], 'data-en-virtual-key'), 'item-0');
	assert.equal(attr(dataRows[19], 'aria-rowindex'), '21');
	assert.equal(rows.filter(row => attr(row, 'aria-hidden') === 'true').length, 1);
	assert.ok(rows.every(row => row.childNodes.filter(node => node.tagName).every(node => ['td', 'th'].includes(node.tagName))));
	assert.equal(nodes.filter(node => node.tagName === 'div').length, 0);
});

test('list renderer keeps native list items and separates offscreen geometry from readable content', () => {
	const collection = model();
	const doc = documentFor(html`<ul>${virtualListRows(collection, { renderItem: item => html`<span>${item.name}</span>` })}</ul>`);
	const list = descendants(doc).find(node => node.tagName === 'ul');
	const children = list.childNodes.filter(node => node.tagName);
	assert.ok(children.every(node => node.tagName === 'li'));
	assert.equal(children.filter(node => attr(node, 'data-en-virtual-key') !== undefined).length, 20);
	assert.equal(children.filter(node => attr(node, 'aria-hidden') === 'true').length, 1);
});
