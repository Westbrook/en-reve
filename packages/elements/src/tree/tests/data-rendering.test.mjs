import test from 'node:test';
import assert from 'node:assert/strict';
import { render } from '@lit-labs/ssr';
import { parse } from 'parse5';
import { normalizeTreeData, deriveTreeDataRows, treeSnapshot } from '@en-reve/primitives/interactions/tree.js';
import { VirtualCollection } from '@en-reve/primitives/state/virtual-collection.js';
import { treeDataTemplate } from '../../../dist/tree/data-template.js';
const nodes = node => [node, ...(node.childNodes ?? []).flatMap(nodes)];
const attr = (node, name) => node.attrs?.find(value => value.name === name)?.value;
const items = normalizeTreeData(Array.from({ length: 8 }, (_, branch) => ({ value: `folder-${branch}`, label: `Folder ${branch}`, children: Array.from({ length: 100 }, (_, index) => ({ value: `${branch}-${index}`, label: `Asset ${branch}-${index}` })) })));

test('sparse tree retains real ancestor groups, exact gap extent and logical order across distant pins', () => {
  const rows = deriveTreeDataRows(items, treeSnapshot('0-0', items.map(item => item.value)));
  const byKey = new Map(rows.map(row => [row.item.value, row]));
  const model = new VirtualCollection({ items: rows, key: row => row.item.value, estimateSize: 48, initialCount: 20 });
  model.setViewport(48 * 400, 400);
  model.pin('0-0'); model.pin('7-99');
  const output = [...render(treeDataTemplate({ multiple: false, reorderable: false, branchState: () => ({status: 'idle', requestId: 0}), label: 'Files', error: '', virtualize: true, current: '0-0', rows, byKey, model }))].join('');
  const all = nodes(parse(output));
  const semantic = all.filter(node => attr(node, 'role') === 'treeitem');
  const keys = semantic.map(node => attr(node, 'data-en-tree-key'));
  const indices = keys.map(key => byKey.get(key).index);
  assert.deepEqual(indices, [...indices].sort((a, b) => a - b));
  assert.equal(keys.length, new Set(keys).size);
  assert.ok(keys.includes('folder-0') && keys.includes('folder-7') && keys.includes('0-0') && keys.includes('7-99'));
  for (const node of semantic) {
    const row = byKey.get(attr(node, 'data-en-tree-key'));
    if (row.parentValue) {
      assert.equal(attr(node.parentNode, 'role'), 'group');
      assert.equal(attr(node.parentNode.parentNode, 'data-en-tree-key'), row.parentValue);
    }
  }
  const measured = all.filter(node => attr(node, 'data-en-virtual-key') !== undefined);
  const gaps = all.filter(node => attr(node, 'data-en-virtual-gap') !== undefined);
  const gapSize = gaps.reduce((sum, node) => sum + Number(/block-size:([\d.]+)px/.exec(attr(node, 'style'))[1]), 0);
  assert.equal(measured.length * 48 + gapSize, model.totalSize);
  assert.ok(gaps.every(node => attr(node, 'aria-hidden') === 'true' && attr(node, 'role') === 'presentation'));
});
