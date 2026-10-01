import test from 'node:test';
import assert from 'node:assert/strict';
import { VirtualCollection } from '../dist/state/virtual-collection.js';
import { TableModel } from '../dist/state/table.js';
import { normalizeTreeData, treeSnapshot, deriveTreeDataRows } from '../dist/interactions/tree.js';
import { proposeTreeMove, treeIndex } from '../dist/interactions/tree-operations.js';
import { normalizeFormChildren, normalizeProgressItems } from '../dist/interactions/form-children.js';

test('getKey wins over legacy key; generic primitives retain all unique string identities', () => {
  const items = [{ id: '' }, { id: ' ' }, { id: ' spaced ' }];
  const collection = new VirtualCollection({ items, getKey: row => row.id, key: () => 'wrong' });
  assert.equal(collection.indexOf(''), 0);
  assert.equal(collection.indexOf(' '), 1);
  assert.equal(collection.indexOf(' spaced '), 2);
  assert.throws(() => collection.setItems([{ id: '' }, { id: '' }]), /unique/);
  assert.equal(collection.indexOf(' spaced '), 2);
  assert.throws(() => new VirtualCollection({ items: [] }), /getKey/);
});
test('table virtual and windowed aliases share logical rows and paginated transitions', () => {
  const model = new TableModel({ items: [{id:'a'}, {id:'b'}, {id:'c'}], getKey: row => row.id,
    key: () => 'wrong', columns: [{key:'name', label:'Name'}], mode:'virtual', pageSize:1 });
  assert.equal(model.getKey(model.items[0]), 'a');
  assert.equal(model.key, model.getKey);
  assert.equal(model.pageItems.length, 3);
  model.setMode('paginated'); model.setPage(2);
  assert.equal(model.pageItems[0].id, 'c');
  model.setMode('windowed'); assert.equal(model.pageItems.length, 3);
  model.setMode('all'); assert.equal(model.pageItems.length, 3);
});
test('tree keys normalize recursively, keep opaque whitespace and resolve canonical precedence', () => {
  const input = [{key:' folder ', value:'ignored',label:'Folder',children:[{value:'old',label:'Old'},{key:'new',label:'New'}]}];
  const data = normalizeTreeData(input);
  assert.equal(data[0].key, ' folder '); assert.equal(data[0].value, ' folder ');
  assert.deepEqual(data[0].children.map(item => [item.key,item.value]), [['old','old'],['new','new']]);
  assert.ok(Object.isFrozen(data[0].children));
  assert.notEqual(normalizeTreeData(data), data, 'explicit source replacement retains its invalidation identity');
  for (const key of ['', '  ', 1, null]) assert.throws(() => normalizeTreeData([{key,value:'fallback',label:'Bad'}]), /key/);
  assert.throws(() => normalizeTreeData([{key:'x',label:'A'},{value:'x',label:'B'}]), /unique/);
  const rows = deriveTreeDataRows(input, treeSnapshot('new',[' folder ']));
  assert.equal(rows[2].item.key,'new'); assert.equal(rows[2].presentation.selected,true);
});
test('keyed moves preserve selection identities and reject structural no-ops', () => {
  const items = [{key:'a',label:'A'},{key:'b',label:'B'},{key:'folder',label:'Folder',branch:true}];
  assert.equal(proposeTreeMove(items,['a'],'b','before'),undefined);
  const move = proposeTreeMove(items,['a'],'folder','inside');
  assert.equal(move.proposed[1].children[0].key,'a');
  assert.equal(treeIndex(move.proposed).get('a').parent,'folder');
});
test('snapshot aliases describe the same immutable selection and expansion', () => {
  const snapshot = treeSnapshot('', ['branch'], ['b','a','b']);
  assert.equal(snapshot.selectedKey,'b'); assert.equal(snapshot.value,'b');
  assert.equal(snapshot.selectedKeys,snapshot.values); assert.equal(snapshot.expandedKeys,snapshot.expanded);
  assert.ok(Object.isFrozen(snapshot.selectedKeys));
  assert.deepEqual(treeSnapshot('',[]).selectedKeys,[]);
  assert.equal(treeSnapshot(null,[]).selectedKey,'', 'attribute removal clears selection');
  assert.throws(() => treeSnapshot('',[],[' ']), /nonblank/);
  assert.throws(() => treeSnapshot('', [' ']), /nonblank/);
});
test('progress data and descriptors reject the same invalid identities and statuses', () => {
  const authored = items => normalizeFormChildren('steps',items.map((item,index) => ({key:String(index),tagName:'en-progress-step',attributes:item,text:'Step'})));
  for (const items of [[{value:''}],[{value:' '}],[{value:'x'},{value:'x'}],[{value:'x',status:'bogus'}]]) {
    assert.throws(() => normalizeProgressItems(items)); assert.throws(() => authored(items));
  }
  assert.equal(normalizeProgressItems([{value:' x ',status:'complete'}])[0].value,' x ');
  assert.equal(authored([{value:' x ',status:'complete'}])[0].value,' x ');
});
