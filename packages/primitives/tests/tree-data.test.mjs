import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTreeData, deriveTreeDataRows, treeSnapshot } from '../dist/interactions/tree.js';

test('data hierarchy snapshots immutable schema fields and rejects invalid identities without mutating input', () => {
  const input = [{ value: 'folder', label: 'Folder', extra: 'discard', children: [{ value: 'leaf', label: 'Leaf' }] }];
  const items = normalizeTreeData(input);
  input[0].children[0].label = 'Changed outside';
  assert.equal(items[0].children[0].label, 'Leaf');
  assert.equal(items[0].extra, undefined);
  assert.ok(Object.isFrozen(items) && Object.isFrozen(items[0]) && Object.isFrozen(items[0].children));
  assert.throws(() => normalizeTreeData([{ value: 'same', label: 'A', children: [{ value: 'same', label: 'B' }] }]), /unique/);
  assert.throws(() => normalizeTreeData([{ value: '', label: 'A' }]), /nonblank/);
  assert.throws(() => normalizeTreeData([{ value: 'one', label: 123 }]), /labels/);
  assert.throws(() => normalizeTreeData([{ value: 'one', label: 'One', children: 'children' }]), /arrays/);
});

test('visible hierarchy preserves full sibling metadata and subtree boundaries independently from selection', () => {
  const items = normalizeTreeData([{ value: 'a', label: 'A', children: [
    { value: 'a1', label: 'A1' }, { value: 'a2', label: 'A2', disabled: true, children: [{ value: 'a21', label: 'A21' }] },
  ] }, { value: 'b', label: 'B' }]);
  const rows = deriveTreeDataRows(items, treeSnapshot('a21', ['a', 'a2']));
  assert.deepEqual(rows.map(row => [row.item.value, row.parentValue, row.index, row.end]), [
    ['a', null, 0, 4], ['a1', 'a', 1, 2], ['a2', 'a', 2, 4], ['a21', 'a2', 3, 4], ['b', null, 4, 5],
  ]);
  assert.deepEqual(rows.map(row => [row.presentation.level, row.presentation.posInSet, row.presentation.setSize]), [[1,1,2],[2,1,2],[2,2,2],[3,1,1],[1,2,2]]);
  assert.equal(rows[3].presentation.selected, true);
  assert.equal(rows[2].presentation.expanded, true);
  assert.equal(rows[3].presentation.branch, false);
  const collapsed = deriveTreeDataRows(items, treeSnapshot('a21', []));
  assert.deepEqual(collapsed.map(row => row.item.value), ['a', 'b']);
  assert.ok(collapsed.every(row => !row.presentation.selected));
});

test('multiple selection keeps unknown keys and ranges/select-all use only available model keys', async () => {
  const { treeSelection, deriveTreePresentations } = await import('../dist/interactions/tree.js');
  const state = treeSnapshot('', ['folder'], ['unknown', 'hidden', 'a', 'a']);
  assert.deepEqual(state.values, ['unknown', 'hidden', 'a']);
  assert.ok(Object.isFrozen(state.values));
  assert.throws(() => treeSnapshot('', [], ['']), /nonblank/);
  const range = treeSelection(state, 'c', ['a','b','c'], 'a', 'range');
  assert.deepEqual(range.values, ['a','b','c']);
  assert.deepEqual(treeSelection(range, 'a', ['a','b','c'], '', 'all').values, []);
  assert.deepEqual(treeSelection(state, 'c', ['a','b','c'], 'missing', 'range').values, ['c']);
  const sources = ['a','b','c'].map(value => ({value,disabled:false,hidden:false,children:[]}));
  assert.deepEqual(deriveTreePresentations(sources, range).items.map(item => item.presentation.selected), [true,true,true]);
  assert.deepEqual(treeSelection(treeSnapshot('a', []), 'b', ['a','b'], '').value, 'b');
});

test('range anchor follows committed selection, not focus, and equal author echoes preserve shrinking ranges', async () => {
  const { treeSelection, TreeSelectionAnchor } = await import('../dist/interactions/tree.js');
  const anchor = new TreeSelectionAnchor(); const available=['a','b','c','d','e'];
  let state=treeSnapshot('',[],['b']);
  assert.equal(anchor.resolve(state,available),'b');
  const start=anchor.resolve(state,available);
  state=treeSelection(state,'e',available,start,'range');
  anchor.accept(state,'e','range',start,treeSnapshot('',[],state.values)); // synchronous author echo
  state=treeSnapshot('',[],state.values); // consumer echoes the selected values
  assert.equal(anchor.resolve(state,available),'b');
  state=treeSelection(state,'c',available,anchor.resolve(state,available),'range');
  assert.deepEqual(state.values,['b','c']);
  const replaced=treeSelection(state,'e',available,'b','replace');
  assert.deepEqual(replaced.values,['e']);
  assert.deepEqual(treeSelection(replaced,'a',available,'','toggle').values,['e','a']);
  assert.equal(anchor.resolve(treeSnapshot('',[],['d']),available),'d');
  anchor.accept(state,'c','range','b');
  anchor.accept(treeSnapshot('',[],['a']),'a','replace','',state); // rejected proposal
  assert.equal(anchor.resolve(state,available),'b');
});

test('lazy and empty branch identities survive normalization and expose expansion before children', () => {
  const items=normalizeTreeData([{value:'lazy',label:'Lazy',lazy:true},{value:'empty',label:'Empty',branch:true}]);
  const rows=deriveTreeDataRows(items,treeSnapshot('', ['lazy','empty']));
  assert.ok(rows.every(row=>row.presentation.branch && row.presentation.expanded));
  assert.throws(()=>normalizeTreeData([{value:'bad',label:'Bad',lazy:'yes'}]),/boolean/);
});

test('move proposals preserve preorder, subsume selected descendants, and reject cycles and unloaded targets', async () => {
  const {proposeTreeMove}=await import('../dist/interactions/tree-operations.js');
  const items=normalizeTreeData([{value:'a',label:'A',branch:true,children:[{value:'b',label:'B'},{value:'c',label:'C'}]}, {value:'d',label:'D',branch:true}, {value:'e',label:'E',lazy:true},{value:'locked',label:'Locked',disabled:true}]);
  const move=proposeTreeMove(items,['c','b'],'d','inside');
  assert.deepEqual(move.keys,['b','c']);assert.deepEqual(move.proposed[1].children.map(x=>x.value),['b','c']);
  assert.equal(items[0].children.length,2);assert.ok(Object.isFrozen(move.proposed));
  assert.deepEqual(proposeTreeMove(items,['a','b'],'d','inside').keys,['a']);
  for(const [keys,target,position] of [[['a'],'b','inside'],[['b'],'e','inside'],[['locked'],'d','before'],[['a'],'locked','after'],[['missing'],'d','inside'],[['b'],'c','before']]) assert.equal(proposeTreeMove(items,keys,target,position),undefined);
});
