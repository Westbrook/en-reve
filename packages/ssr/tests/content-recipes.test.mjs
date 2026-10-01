import '../dist/install.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFragment } from 'parse5';

const { html, nothing } = await import('lit');
const { renderToString } = await import('../dist/index.js');
const { contentCollectionTemplate, fileCardTemplate, metadataListTemplate, emptyStateTemplate } = await import('@en-reve/primitives/templates/content.js');

function all(root, tag) {
	const found = [];
	function visit(node) {
		if (node.tagName === tag) found.push(node);
		for (const child of node.childNodes ?? []) visit(child);
		if (node.content) visit(node.content);
	}
	visit(root); return found;
}
const attr = (node, name) => node.attrs?.find(item => item.name === name)?.value;
const text = node => node.nodeName === '#text' ? node.value : (node.childNodes ?? []).map(text).join('');
const parse = async template => parseFragment(await renderToString(template));

const assets = [{ id: 'brief', name: 'Campaign brief' }, { id: 'notes', name: 'Usage notes' }];
const collection = layout => contentCollectionTemplate({ label: 'Project documents', layout, items: assets, key: item => item.id,
	renderItem: item => fileCardTemplate({ name: html`<h3>${item.name}</h3>` }) });

test('both collection layouts render the same native ordered content without widget semantics', async () => {
	for (const layout of ['grid', 'list']) {
		const document = await parse(collection(layout));
		const list = all(document, 'ul')[0];
		assert.equal(attr(list, 'role'), 'list');
		assert.equal(attr(list, 'aria-label'), 'Project documents');
		assert.equal(attr(list, 'data-layout'), layout);
		assert.equal(all(list, 'li').length, 2);
		assert.deepEqual(all(list, 'h3').map(text), assets.map(item => item.name));
		assert.equal(all(list, 'input').length, 0);
		assert.equal(all(list, 'button').length, 0);
		assert.doesNotMatch(await renderToString(collection(layout)), /role="(?:grid|listbox|option)"|aria-selected|tabindex/);
	}
});

test('selection, meaningful native names and action controls remain independently authored', async () => {
	const document = await parse(fileCardTemplate({
		name: html`<h3><label for="asset-brief">Campaign brief</label></h3>`,
		selection: html`<input id="asset-brief" type="radio" name="asset" value="brief" checked>`,
		metadata: metadataListTemplate({ items: [{ label: 'Format', value: 'Text document' }] }),
		actions: html`<button type="button" aria-label="Preview Campaign brief">Preview</button>`,
		selected: true,
	}));
	const root = all(document, 'div')[0];
	assert.equal(attr(root, 'data-selected'), '');
	assert.equal(attr(root, 'aria-selected'), undefined);
	const label = all(document, 'label')[0];
	assert.equal(attr(label, 'for'), 'asset-brief');
	assert.equal(text(label), 'Campaign brief');
	assert.equal(all(label, 'button').length, 0);
	assert.equal(all(label, 'dl').length, 0);
	assert.equal(attr(all(document, 'input')[0], 'name'), 'asset');
	assert.equal(attr(all(document, 'button')[0], 'aria-label'), 'Preview Campaign brief');
});

test('names and metadata strings are escaped while trusted authored content keeps its native structure', async () => {
	const literal = '<script>not markup</script> & notes';
	const document = await parse(fileCardTemplate({ name: literal,
		metadata: metadataListTemplate({ items: [{ label: 'Type <unknown>', value: literal }, { label: 'Count', value: 0 }] }),
		media: html`<svg aria-hidden="true" viewBox="0 0 10 10"><path d="M0 0H10V10H0Z"></path></svg>`,
	}));
	assert.equal(all(document, 'script').length, 0);
	assert.ok(text(document).includes(literal));
	assert.deepEqual(all(document, 'dt').map(text), ['Type <unknown>', 'Count']);
	assert.deepEqual(all(document, 'dd').map(text), [literal, '0']);
	assert.equal(all(document, 'svg').length, 1);
});

test('empty content has no phantom rows, invented live state or recovery action', async () => {
	const document = await parse(fileCardTemplate({ name: 'Brief', description: '', metadata: null, media: nothing, actions: undefined }));
	assert.equal(all(document, 'div').some(node => ['en-file-card__description', 'en-file-card__metadata', 'en-file-card__media', 'en-file-card__actions'].includes(attr(node, 'class'))), false);
	const empty = await parse(emptyStateTemplate({ title: html`<h3>No matching documents</h3>`, description: 'Try another search.' }));
	assert.equal(all(empty, 'h3').length, 1);
	assert.equal(all(empty, 'button').length, 0);
	assert.equal(all(empty, 'div').some(node => attr(node, 'role') !== undefined || attr(node, 'aria-live') !== undefined || attr(node, 'tabindex') !== undefined), false);
});

test('invalid collection identities fail before rendering ambiguous keyed children', () => {
	for (const items of [[{ id: '' }], [{ id: 'same' }, { id: 'same' }]]) {
		assert.throws(() => contentCollectionTemplate({ label: 'Invalid', items, key: item => item.id, renderItem: () => 'Record' }), /unique nonempty/);
	}
	assert.throws(() => contentCollectionTemplate({ label: 'Invalid', items: [], key: item => item.id, renderItem: () => 'Record', layout: 'table' }), /grid or list/);
});
