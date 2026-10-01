import '../dist/install.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFragment } from 'parse5';
import { LitElementRenderer } from '@lit-labs/ssr/lib/lit-element-renderer.js';

const { html, LitElement } = await import('lit');
const { registerAll } = await import('@en-reve/elements/catalog.js');
const { renderToString, renderRequest } = await import('../dist/index.js');
const { createTreeSsrAdapter } = await import('../dist/tree-adapter.js');
registerAll();

function all(root, tag) {
  const found = [];
  function visit(node) {
    if (node.tagName === tag) found.push(node);
    for (const child of node.childNodes ?? []) visit(child);
    if (node.content) visit(node.content);
  }
  visit(root);
  return found;
}
const attr = (node, name) => node.attrs?.find(item => item.name === name)?.value;
const shadow = host => host.childNodes.find(node => node.tagName === 'template' && attr(node, 'shadowrootmode') === 'open');
const plan = host => JSON.parse(attr(host, 'data-en-tree-presentation'));
const base = host => all(shadow(host).content, 'div').find(node => attr(node, 'role') === 'treeitem');
const byValue = document => new Map(all(document, 'en-tree-item').map(item => [attr(item, 'value'), item]));
const parse = markup => parseFragment(markup, { sourceCodeLocationInfo: true });

test('finite authored hierarchy has correct first-paint semantics from parent state alone', async () => {
  const markup = await renderToString(html`<en-tree label="Files" value="readme" .expanded=${['src', 'later']}>
    <en-tree-item value="src" label="Source">
      <strong slot="label">Rich source</strong>
      <en-tree-item slot="children" value="readme" label="Readme"></en-tree-item>
      <en-tree-item slot="children" value="tests" label="Tests" disabled></en-tree-item>
    </en-tree-item>
    <en-tree-item value="archive" label="Archive"><en-tree-item slot="children" value="old" label="Old"></en-tree-item></en-tree-item>
  </en-tree>`);
  const document = parse(markup);
  const items = byValue(document);
  assert.equal(attr(all(shadow(all(document, 'en-tree')[0]).content, 'div').find(node => attr(node, 'role') === 'tree'), 'tabindex'), '-1');
  assert.equal([...items.values()].filter(item => attr(base(item), 'tabindex') === '0').length, 1);
  assert.deepEqual(plan(items.get('src')), { version: 1, branch: true, expanded: true, selected: false, level: 1, posInSet: 1, setSize: 2, tabStop: -1 });
  assert.deepEqual(plan(items.get('readme')), { version: 1, branch: false, expanded: false, selected: true, level: 2, posInSet: 1, setSize: 2, tabStop: 0 });
  assert.equal(attr(base(items.get('src')), 'aria-expanded'), 'true');
  assert.equal(attr(base(items.get('readme')), 'aria-expanded'), undefined);
  assert.equal(attr(base(items.get('readme')), 'aria-selected'), 'true');
  assert.equal(attr(base(items.get('readme')), 'tabindex'), '0');
  assert.equal(attr(base(items.get('tests')), 'aria-disabled'), 'true');
  assert.equal(attr(all(shadow(items.get('archive')).content, 'div').find(node => attr(node, 'role') === 'group'), 'hidden'), '');
  assert.equal(all(document, 'strong').length, 1);
  assert.deepEqual(JSON.parse(attr(all(document, 'en-tree')[0], 'data-en-tree-snapshot')), { value: 'readme', expanded: ['src', 'later'] });
  assert.doesNotMatch(markup, /en-tree-ssr:/);
});

test('collapsed selection remains selected with a visible entry and hidden sibling counts are derived', async () => {
  const document = parse(await renderToString(html`<en-tree value="child">
    <en-tree-item value="hidden" hidden></en-tree-item>
    <en-tree-item value="parent"><en-tree-item slot="children" value="child"></en-tree-item></en-tree-item>
    <en-tree-item value="disabled" disabled></en-tree-item>
  </en-tree>`));
  const items = byValue(document);
  assert.equal(plan(items.get('child')).selected, true);
  assert.equal(plan(items.get('child')).tabStop, -1);
  assert.equal(plan(items.get('parent')).tabStop, 0);
  assert.equal(plan(items.get('parent')).posInSet, 1);
  assert.equal(plan(items.get('parent')).setSize, 2);
});

test('property-only item inputs and concurrent parent snapshots remain request-local', async () => {
  const template = state => html`<en-tree .value=${state.value} .expanded=${['branch']}>
    <en-tree-item .value=${'branch'} .label=${state.label} .size=${'small'}>
      <en-tree-item slot="children" .value=${state.value} .label=${'Selected child'}></en-tree-item>
    </en-tree-item>
  </en-tree>`;
  const states = ['one', 'two', 'three'].map(value => ({ value, label: `Label ${value}` }));
  const results = await Promise.all(states.map(state => renderRequest(state, template)));
  results.forEach((markup, index) => {
    const document = parse(markup);
    const items = all(document, 'en-tree-item');
    assert.equal(plan(items[1]).selected, true);
    assert.equal(plan(items[1]).tabStop, 0);
    assert.equal(attr(items[0], 'size'), 'small');
    assert.match(markup, new RegExp(states[index].label));
    assert.equal(JSON.parse(attr(all(document, 'en-tree')[0], 'data-en-tree-snapshot')).value, states[index].value);
  });
  assert.equal(await renderRequest(states[0], template), results[0]);
});

test('invalid structural authoring rejects without guessing tree ownership', async () => {
  const invalid = [
    html`<en-tree><en-tree-item></en-tree-item></en-tree>`,
    html`<en-tree><en-tree-item value="a"><en-tree-item slot="children" value="a"></en-tree-item></en-tree-item></en-tree>`,
    html`<en-tree><div><en-tree-item value="a"></en-tree-item></div></en-tree>`,
    html`<en-tree><slot></slot></en-tree>`,
    html`<en-tree><en-tree-item value="a"><slot slot="children"></slot></en-tree-item></en-tree>`,
    html`<en-tree><en-tree-item value="a"><en-tree-item value="b"></en-tree-item></en-tree-item></en-tree>`,
    html`<en-tree><en-tree-item value="a" expanded></en-tree-item></en-tree>`,
    html`<en-tree><en-tree-item value="a" selected></en-tree-item></en-tree>`,
    html`<en-tree><en-tree-item value="a" hidden="until-found"></en-tree-item></en-tree>`,
    html`<en-tree>Invalid text<en-tree-item value="a"></en-tree-item></en-tree>`,
    html`<en-tree><en-tree-item value="a"><span slot="label"><button>Interactive label</button></span></en-tree-item></en-tree>`,
    html`<en-tree><en-tree-item value="a"><en-button slot="prefix">Interactive prefix</en-button></en-tree-item></en-tree>`,
    html`<en-tree data-en-tree-snapshot="{}"></en-tree>`,
    html`<en-tree><en-tree-item value="a" data-en-tree-presentation="{}"></en-tree-item></en-tree>`,
  ];
  for (const value of invalid) await assert.rejects(renderToString(value));
  assert.match(await renderToString(html`<en-tree><en-tree-item value="valid" label="After failure"></en-tree-item></en-tree>`), /After failure/);
});

class TreeFrame extends LitElement {
  render() { return html`<en-tree value="a"><en-tree-item value="a" label="Nested tree"></en-tree-item></en-tree>`; }
}
customElements.define('en-ssr-tree-frame', TreeFrame);
test('tree finalization coexists with other adapters and ordinary custom shadow roots', async () => {
  const document = parse(await renderToString(html`<en-card><h2 slot="header">Heading</h2>
    <en-ssr-tree-frame></en-ssr-tree-frame>
    <en-select value="a"><en-select-option value="a">Choice</en-select-option></en-select>
    <en-breadcrumbs><a href="/">Home</a><span>Here</span></en-breadcrumbs>
    <en-textarea value="Text"></en-textarea>
  </en-card>`));
  assert.equal(plan(all(document, 'en-tree-item')[0]).selected, true);
  assert.equal(all(document, 'option').length, 1);
  assert.equal(all(document, 'ol').length, 1);
  assert.equal(all(document, 'textarea').length, 1);
  assert.equal(JSON.parse(attr(all(document, 'en-card')[0], 'data-en-optional-slots')).slots.header, true);
});

test('standalone tree items retain a visible inert canonical baseline', async () => {
  const document = parse(await renderToString(html`<en-tree-item label="Standalone"></en-tree-item>`));
  const item = all(document, 'en-tree-item')[0];
  assert.equal(plan(item).tabStop, -1);
  assert.equal(plan(item).selected, false);
  assert.equal(plan(item).branch, false);
});

test('consumer renderers retain precedence and must own replaced tree coordination', async () => {
  class ConsumerTreeRenderer extends LitElementRenderer {
    static matchesClass(_ctor, tag) { return tag === 'en-tree'; }
    renderShadow() { return ['<div data-consumer-tree><slot></slot></div>']; }
  }
  const document = parse(await renderToString(html`<en-tree value="a"><en-tree-item value="a"></en-tree-item></en-tree>`, {
    elementRenderers: [ConsumerTreeRenderer],
  }));
  assert.equal(attr(all(document, 'en-tree')[0], 'data-en-tree-snapshot'), undefined);
  assert.equal(plan(all(document, 'en-tree-item')[0]).selected, false);
  class ConsumerItemRenderer extends LitElementRenderer {
    static matchesClass(_ctor, tag) { return tag === 'en-tree-item'; }
    renderShadow() { return ['<div data-consumer-item></div>']; }
  }
  await assert.rejects(renderToString(html`<en-tree><en-tree-item value="a"></en-tree-item></en-tree>`, {
    elementRenderers: [ConsumerItemRenderer],
  }), /library renderer/);
});

test('request markers diagnose incomplete/foreign output and finalization consumes failed adapters', async () => {
  const template = html`<en-tree><en-tree-item value="a"></en-tree-item></en-tree>`;
  const incomplete = createTreeSsrAdapter();
  const markup = await renderToString(template, { elementRenderers: [incomplete.Renderer] });
  await assert.rejects(incomplete.finalize(markup.replace(/<!--en-tree-ssr:[^>]+-->/, '')), /incomplete/);
  await assert.rejects(incomplete.finalize(markup), /single-use/);

  const first = createTreeSsrAdapter();
  const other = createTreeSsrAdapter();
  const firstMarkup = await renderToString(template, { elementRenderers: [first.Renderer] });
  const otherMarkup = await renderToString(template, { elementRenderers: [other.Renderer] });
  await assert.rejects(first.finalize(firstMarkup + otherMarkup), /another response/);
  assert.doesNotMatch(await other.finalize(otherMarkup), /en-tree-ssr:/);
});

test('data hierarchy is rendered from items and preserves a schema-only standalone hydration baseline', async () => {
  const items = [{ value: 'source', label: 'Source <&"', secretPayload: 'Do not serialize this payload', children: [
    { value: 'readme', label: 'Readme' }, { value: 'tests', label: 'Tests', disabled: true },
  ] }, { value: 'archive', label: 'Archive', children: [{ value: 'old', label: 'Old notes' }] }];
  const template = html`<en-tree label="Data files" .items=${items} .expanded=${['source']} value="readme"></en-tree>`;
  const markup = await renderToString(template);
  const document = parse(markup);
  const tree = all(document, 'en-tree')[0];
  const rows = all(shadow(tree).content, 'div').filter(node => attr(node, 'role') === 'treeitem');
  const readme = rows.find(node => attr(node, 'aria-selected') === 'true');
  assert.equal(rows.length, 4);
  assert.equal(attr(readme, 'aria-level'), '2');
  assert.equal(attr(readme, 'aria-posinset'), '1');
  assert.equal(attr(readme, 'aria-setsize'), '2');
  assert.equal(attr(readme, 'aria-expanded'), undefined);
  assert.equal(rows.filter(node => attr(node, 'tabindex') === '0').length, 1);
  let group = readme.parentNode;
  while (group && attr(group, 'role') !== 'group') group = group.parentNode;
  assert.ok(group, 'A nested item is owned by its parent group.');
  let parent = group.parentNode;
  while (parent && attr(parent, 'role') !== 'treeitem') parent = parent.parentNode;
  assert.equal(attr(parent, 'aria-expanded'), 'true');
  assert.equal(attr(parent, 'aria-level'), '1');
  const baseline = JSON.parse(attr(tree, 'data-en-tree-data'));
  assert.equal(baseline[0].label, items[0].label);
  assert.equal(baseline[0].children[1].disabled, true);
  assert.equal(baseline[0].secretPayload, undefined);
  assert.doesNotMatch(markup, /Do not serialize this payload|en-tree-ssr:/);
  assert.equal(await renderToString(template), markup);
});

test('virtual data mode emits a bounded deterministic initial window with full sibling metadata', async () => {
  const items = Array.from({ length: 1000 }, (_, index) => ({ value: `asset-${index}`, label: `Asset ${index}` }));
  const template = html`<en-tree label="Large files" virtualize .items=${items}></en-tree>`;
  const markup = await renderToString(template);
  const tree = all(parse(markup), 'en-tree')[0];
  const rows = all(shadow(tree).content, 'div').filter(node => attr(node, 'role') === 'treeitem');
  assert.ok(rows.length > 0 && rows.length < 100, `Expected bounded first window, received ${rows.length} rows.`);
  assert.equal(attr(rows[0], 'aria-posinset'), '1');
  assert.equal(attr(rows[0], 'aria-setsize'), '1000');
  assert.equal(JSON.parse(attr(tree, 'data-en-tree-data')).length, 1000);
  assert.equal(await renderToString(template), markup);
});

test('empty data mode stays distinct from slotted mode and rejects mixed ownership or forged metadata', async () => {
  const tree = all(parse(await renderToString(html`<en-tree .items=${[]}></en-tree>`)), 'en-tree')[0];
  assert.deepEqual(JSON.parse(attr(tree, 'data-en-tree-data')), []);
  await assert.rejects(renderToString(html`<en-tree .items=${[]}><en-tree-item value="a"></en-tree-item></en-tree>`), /data mode/);
  await assert.rejects(renderToString(html`<en-tree .items=${[]} data-en-tree-data="[]"></en-tree>`), /reserves/);
  await assert.rejects(renderToString(html`<en-tree .items=${[{ value: 'a', label: 'A' }, { value: 'a', label: 'Again' }]}></en-tree>`));
});

test('a selected item beyond the initial virtual window remains a reachable SSR entry with its ancestors', async () => {
  const items = [{ value: 'assets', label: 'Assets', children:
    Array.from({ length: 1000 }, (_, index) => ({ value: `asset-${index}`, label: `Asset ${index}` })),
  }];
  const tree = all(parse(await renderToString(html`<en-tree virtualize .items=${items} .expanded=${['assets']} value="asset-900"></en-tree>`)), 'en-tree')[0];
  const rows = all(shadow(tree).content, 'div').filter(node => attr(node, 'role') === 'treeitem');
  const selected = rows.find(node => attr(node, 'aria-selected') === 'true');
  assert.ok(selected, 'Selected item is retained outside the initial viewport range.');
  assert.equal(attr(selected, 'tabindex'), '0');
  assert.equal(attr(selected, 'aria-level'), '2');
  assert.equal(attr(selected, 'aria-posinset'), '901');
  assert.equal(rows.filter(node => attr(node, 'tabindex') === '0').length, 1);
  assert.ok(rows.length < 100);
});

test('multiple authored and virtual trees preserve selected keys and semantics in first delivery', async () => {
  for (const data of [false, true]) {
    const markup = await renderToString(data
      ? html`<en-tree label="Multi" multiple .values=${['a','b','later']} .items=${[{value:'a',label:'A'},{value:'b',label:'B'}]} virtualize></en-tree>`
      : html`<en-tree label="Multi" multiple .values=${['a','b','later']}><en-tree-item value="a" label="A"></en-tree-item><en-tree-item value="b" label="B"></en-tree-item></en-tree>`);
    const document = parse(markup);
    const host = all(document,'en-tree')[0];
    assert.deepEqual(JSON.parse(attr(host,'data-en-tree-snapshot')), {value:'a',expanded:[],values:['a','b','later']});
    const tree = all(shadow(host).content,'div').find(node => attr(node,'role') === 'tree');
    assert.equal(attr(tree,'aria-multiselectable'),'true');
    const selected = all(document,'div').filter(node => attr(node,'role') === 'treeitem');
    assert.equal(selected.length,2);
    assert.ok(selected.every(node => attr(node,'aria-selected') === 'true'));
  }
});

test('empty authored folders and lazy data preserve first-paint branches without starting loaders', async () => {
  const authored=parse(await renderToString(html`<en-tree label="Folders" .expanded=${['folder']}><en-tree-item value="folder" label="Folder" branch></en-tree-item></en-tree>`));
  assert.equal(attr(base(byValue(authored).get('folder')),'aria-expanded'),'true');
  let calls=0;
  const markup=await renderToString(html`<en-tree label="Lazy" .items=${[{value:'lazy',label:'Lazy',lazy:true}]} .expanded=${['lazy']} .loadChildren=${()=>{calls++;return [];}}></en-tree>`);
  assert.equal(calls,0);assert.match(markup,/aria-expanded="true"/);assert.match(markup,/Not loaded/);
});

for (const attributes of ['canonical-first', 'legacy-first']) test(`canonical authored key precedence survives SSR (${attributes})`, async () => {
  const content = attributes === 'canonical-first'
    ? html`<en-tree selected-key="child" value="wrong" .expandedKeys=${['folder']}><en-tree-item key="folder" value="wrong-folder"><en-tree-item slot="children" key="child" value="wrong-child"></en-tree-item></en-tree-item></en-tree>`
    : html`<en-tree value="wrong" selected-key="child" .expandedKeys=${['folder']}><en-tree-item value="wrong-folder" key="folder"><en-tree-item slot="children" value="wrong-child" key="child"></en-tree-item></en-tree-item></en-tree>`;
  const document = parse(await renderToString(content));
  const items = all(document,'en-tree-item');
  assert.equal(plan(items[0]).expanded,true);
  assert.equal(plan(items[1]).selected,true);
  assert.equal(plan(items[1]).tabStop,0);
});
test('canonical property data and selection serialize an equivalent hydration baseline', async () => {
  const document = parse(await renderToString(html`<en-tree .items=${[{key:'folder',label:'Folder',children:[{key:'child',label:'Child'}]}]} .expandedKeys=${['folder']} .selectedKey=${'child'}></en-tree>`));
  const host = all(document,'en-tree')[0];
  assert.equal(JSON.parse(attr(host,'data-en-tree-data'))[0].key,'folder');
  assert.equal(JSON.parse(attr(host,'data-en-tree-snapshot')).value,'child');
  assert.match(await renderToString(html`<en-progress-steps .items=${[{value:'x',label:'First'},{value:'x',label:'Duplicate'}]}></en-progress-steps>`), /unique nonblank/);
});

test('component key validity is nonblank while opaque surrounding whitespace is preserved', async () => {
  const column = [{key:'name',label:'Name',renderCell:item=>item.id}];
  for (const id of ['', '  ']) {
    await assert.rejects(() => renderToString(html`<en-data-table .items=${[{id}]} .columns=${column}></en-data-table>`), /nonblank/);
    await assert.rejects(() => renderToString(html`<en-activity-feed .items=${[{key:id,body:'Invalid'}]}></en-activity-feed>`), /nonblank/);
    await assert.rejects(() => renderToString(html`<en-carousel .items=${[{key:id,label:'Invalid'}]}></en-carousel>`), /nonblank/);
  }
  const markup = await renderToString(html`<en-data-table .items=${[{id:' a '},{id:'a'}]} .columns=${column}></en-data-table>`);
  assert.match(markup,/ a /);
});
