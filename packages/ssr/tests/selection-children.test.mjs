import '../dist/install.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFragment } from 'parse5';

const { html, LitElement } = await import('lit');
const { registerAll } = await import('@en-reve/elements/catalog.js');
const { renderToString, renderRequest } = await import('../dist/index.js');
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
const text = node => node.nodeName === '#text' ? node.value : (node.childNodes ?? []).map(text).join('');
const direct = (node, tag) => (node.childNodes ?? []).filter(child => child.tagName === tag);
const shadow = host => direct(host, 'template').find(node => attr(node, 'shadowrootmode') === 'open');
const plan = host => JSON.parse(attr(host, 'data-en-selection-children'));
const parse = markup => parseFragment(markup, { sourceCodeLocationInfo: true });

// These tests use ordinary package rendering, without caller-written plans or an adapter import.
test('child select produces native labeled options and the parent selection before JavaScript', async () => {
	const markup = await renderToString(html`<en-select label="Workspace" name="workspace" value="studio" required>
		<en-select-option value="studio"><strong>Studio</strong> &amp; tools</en-select-option>
		<en-select-option value="archive" disabled>Archive</en-select-option>
		<en-select-option value="hidden" hidden>Hidden</en-select-option>
	</en-select>`);
	const host = all(parse(markup), 'en-select')[0];
	const root = shadow(host);
	const control = all(root.content, 'select')[0];
	const options = all(control, 'option');
	assert.equal(attr(control, 'name'), 'workspace');
	assert.equal(attr(control, 'required'), '');
	assert.notEqual(attr(control, 'aria-invalid'), 'true');
	assert.deepEqual(options.map(option => [attr(option, 'value'), text(option)]), [
		['studio', 'Studio & tools'], ['archive', 'Archive'], ['hidden', 'Hidden'],
	]);
	assert.equal(attr(options[0], 'selected'), '');
	assert.equal(attr(options[1], 'disabled'), '');
	assert.equal(attr(options[2], 'hidden'), '');
	assert.equal(plan(host).value, 'studio');
	assert.equal(direct(host, 'en-select-option').every(child => attr(child, 'slot') === undefined), true);
	assert.doesNotMatch(markup, /en-selection-ssr:/);
});

test('actual property-only snapshot, authored label priority and empty choice survive the buffered boundary', async () => {
	const document = parse(await renderToString(html`<en-select .label=${'Property label'} .description=${'Property help'}
		.name=${'workspace-id'} .value=${''} .placeholder=${''} .size=${'small'}>
		<en-select-option value="" label="Fallback label"> \t </en-select-option>
		<en-select-option value="a" label="Ignored fallback">Authored\n label</en-select-option>
	</en-select>`));
	const host = all(document, 'en-select')[0];
	const root = shadow(host);
	const options = all(root.content, 'option');
	assert.equal(attr(host, 'size'), 'small');
	assert.match(text(root.content), /Property label/);
	assert.match(text(root.content), /Property help/);
	assert.equal(attr(all(root.content, 'select')[0], 'name'), 'workspace-id');
	assert.deepEqual(options.map(text), ['Fallback label', 'Authored label']);
	assert.equal(attr(options[0], 'selected'), '');
	assert.equal(plan(host).value, '');
});

test('segmented rich label remains original while native radios and slots share the parent root', async () => {
	const content = html`<strong>${'Grid & detail'}</strong><!-- label marker --><span> view</span>`;
	const bare = await renderToString(html`<en-segmented-item value="grid">${content}</en-segmented-item>`);
	const markup = await renderToString(html`<en-segmented-control .label=${'View mode'} value="grid">
		<en-segmented-item value="grid">${content}</en-segmented-item>
		<en-segmented-item value="list" hidden>List</en-segmented-item>
	</en-segmented-control>`);
	const host = all(parse(markup), 'en-segmented-control')[0];
	const root = shadow(host);
	const radios = all(root.content, 'input').filter(node => attr(node, 'type') === 'radio');
	const children = direct(host, 'en-segmented-item');
	assert.equal(radios.length, 2);
	assert.equal(attr(radios[0], 'checked'), '');
	assert.equal(attr(radios[1], 'checked'), undefined);
	assert.equal(attr(root, 'shadowrootslotassignment'), undefined);
	for (const child of children) {
		const name = attr(child, 'slot');
		assert.ok(name.startsWith('en-selection-'));
		assert.equal(all(root.content, 'slot').filter(slot => attr(slot, 'name') === name).length, 1);
	}
	assert.equal(plan(host).items[1].hidden, true);
	const original = all(parse(bare), 'en-segmented-item')[0];
	const inside = (source, node) => source.slice(node.sourceCodeLocation.startTag.endOffset, node.sourceCodeLocation.endTag.startOffset);
	assert.equal(inside(markup, children[0]), inside(bare, original));
});

test('recognized children override item data and item-only SSR retains its native choices without metadata', async () => {
	const items = [{ value: 'data', label: 'Array fallback' }];
	const document = parse(await renderToString(html`
		<en-select .items=${items} value="child"><en-select-option value="child">Child source</en-select-option></en-select>
		<en-select .items=${items} value="data"><span slot="label">Named label</span></en-select>
		<en-segmented-control .items=${items} value="data"></en-segmented-control>
	`));
	const selects = all(document, 'en-select');
	assert.deepEqual(all(shadow(selects[0]).content, 'option').map(text), ['Child source']);
	assert.deepEqual(all(shadow(selects[1]).content, 'option').map(text), ['Array fallback']);
	assert.equal(attr(selects[1], 'data-en-selection-children'), undefined);
	const segmented = all(document, 'en-segmented-control')[0];
	assert.equal(attr(segmented, 'data-en-selection-children'), undefined);
	assert.equal(all(shadow(segmented).content, 'input').length, 1);
});

test('default medium is not reflected by deferred preparation', async () => {
	const document = parse(await renderToString(html`
		<en-select><en-select-option value="a">A</en-select-option></en-select>
		<en-select .size=${'medium'}><en-select-option value="a">A</en-select-option></en-select>
		<en-segmented-control><en-segmented-item value="a">A</en-segmented-item></en-segmented-control>
	`));
	assert.deepEqual(all(document, 'en-select').map(host => attr(host, 'size')), [undefined, 'medium']);
	assert.equal(attr(all(document, 'en-segmented-control')[0], 'size'), undefined);
});

test('invalid recognized descriptors reject instead of rendering stale item data', async () => {
	const invalid = [
		html`<en-select .items=${[{value: 'a', label: 'Stale'}]}><en-select-option>Missing value</en-select-option></en-select>`,
		html`<en-select><en-select-option value="a"></en-select-option><en-select-option value="a"></en-select-option></en-select>`,
		html`<en-select><en-select-option value="a" selected>A</en-select-option></en-select>`,
		html`<en-select><en-select-option value="a" slot="">A</en-select-option></en-select>`,
		html`<en-select><en-select-option value="a" hidden="UNTIL-FOUND">A</en-select-option></en-select>`,
		html`<en-select data-en-selection-children="{}"><en-select-option value="a">A</en-select-option></en-select>`,
		html`<en-segmented-control><en-segmented-item value="">Empty</en-segmented-item></en-segmented-control>`,
		html`<en-segmented-control><en-segmented-item value="a" checked>A</en-segmented-item></en-segmented-control>`,
		html`<en-segmented-control><en-segmented-item value="a"><button>Nested action</button></en-segmented-item></en-segmented-control>`,
	];
	for (const template of invalid) await assert.rejects(renderToString(template));
	const valid = await renderToString(html`<en-select value="a"><en-select-option value="a">After failure</en-select-option></en-select>`);
	assert.match(valid, /After failure/);
});

class SelectionFrame extends LitElement {
	static properties = { choice: {} };
	constructor() { super(); this.choice = ''; }
	render() { return html`<en-select .value=${this.choice} label="Nested choice"><en-select-option value=${this.choice}>${this.choice}</en-select-option></en-select><slot></slot>`; }
}
customElements.define('en-ssr-selection-frame', SelectionFrame);

test('nested shadow rendering cooperates with breadcrumb and textarea finalizers', async () => {
	const observed = [];
	const document = parse(await renderToString(html`
		<en-ssr-selection-frame .choice=${'nested'}></en-ssr-selection-frame>
		<en-breadcrumbs><a href="/home">Home</a><span>Current</span></en-breadcrumbs>
		<en-textarea .value=${'Line one\nLine two'}></en-textarea>
	`, { onCustomElementRendered: tag => observed.push(tag) }));
	const frame = all(document, 'en-ssr-selection-frame')[0];
	const select = all(shadow(frame).content, 'en-select')[0];
	assert.equal(plan(select).value, 'nested');
	assert.equal(text(all(shadow(select).content, 'option')[0]), 'nested');
	assert.equal(all(document, 'ol').length, 1);
	assert.equal(text(all(document, 'textarea')[0]), 'Line one\nLine two');
	assert.ok(observed.includes('en-select'));
});

test('parallel requests have independent catalog snapshots and repeatable final bytes', async () => {
	const template = snapshot => html`<en-select .value=${snapshot.value}><en-select-option value=${snapshot.value}>${snapshot.label}</en-select-option></en-select>`;
	const requests = await Promise.all(['first', 'second', 'third'].map(value => renderRequest({ value, label: `Label ${value}` }, template)));
	requests.forEach((markup, index) => {
		const host = all(parse(markup), 'en-select')[0];
		assert.equal(plan(host).value, ['first', 'second', 'third'][index]);
		assert.equal(all(shadow(host).content, 'option').length, 1);
	});
	assert.equal(await renderRequest({ value: 'first', label: 'Label first' }, template), requests[0]);
});


test('missing initial select choices have a private blank native default, never an implicit first selection', async () => {
	for (const value of ['', 'missing']) {
		const document = parse(await renderToString(html`<en-select .value=${value} required>
			<en-select-option value="a">A</en-select-option>
			<en-select-option value="b">B</en-select-option>
		</en-select>`));
		const host = all(document, 'en-select')[0];
		const options = all(shadow(host).content, 'option');
		assert.equal(options.length, 3);
		assert.deepEqual(options.filter(option => attr(option, 'selected') !== undefined).map(option => attr(option, 'value')), ['']);
		assert.equal(attr(options[0], 'disabled'), '');
		assert.equal(attr(options[0], 'hidden'), '');
		assert.equal(attr(options[0], 'part'), undefined);
		assert.equal(text(options[0]), '');
		assert.equal(plan(host).value, value);
		assert.deepEqual(plan(host).items.map(item => item.value), ['a', 'b']);
	}
});


test('pasted generated segmented slots receive fresh per-response identities without duplicate attributes', async () => {
	const markup = await renderToString(html`<en-segmented-control value="grid">
		<en-segmented-item value="grid" slot="en-selection-ssr-7"><strong>${'Grid & detail'}</strong><!-- preserved --> view</en-segmented-item>
		<en-segmented-item value="list" slot="en-selection-ssr-7">List</en-segmented-item>
		<en-segmented-item value="cards" slot="en-selection-client-9">Cards</en-segmented-item>
	</en-segmented-control>`);
	const parseErrors = [];
	const document = parseFragment(markup, { sourceCodeLocationInfo: true, onParseError: error => parseErrors.push(error.code) });
	assert.ok(!parseErrors.includes('duplicate-attribute'), 'replace existing slot rather than append a duplicate');
	const host = all(document, 'en-segmented-control')[0];
	const children = direct(host, 'en-segmented-item');
	const names = children.map(child => attr(child, 'slot'));
	assert.deepEqual(names, ['en-selection-ssr-0', 'en-selection-ssr-1', 'en-selection-ssr-2']);
	assert.deepEqual(plan(host).items.map(item => item.key), ['ssr-0', 'ssr-1', 'ssr-2']);
	assert.deepEqual(children.map(child => attr(child, 'value')), ['grid', 'list', 'cards']);
	assert.equal(text(all(children[0], 'strong')[0]), 'Grid & detail');
	assert.ok(children[0].childNodes.some(node => node.nodeName === '#comment' && node.data === ' preserved '));
	for (const child of children) {
		assert.equal(all(shadow(host).content, 'slot').filter(slot => attr(slot, 'name') === attr(child, 'slot')).length, 1);
	}
});

test('copied-slot tolerance does not allow arbitrary slots or generated slots on select descriptors', async () => {
	for (const slot of ['', 'custom', 'en-selection-custom-1', 'en-selection-ssr-01']) {
		await assert.rejects(renderToString(html`<en-segmented-control><en-segmented-item value="a" slot=${slot}>A</en-segmented-item></en-segmented-control>`));
	}
	await assert.rejects(renderToString(html`<en-select><en-select-option value="a" slot="en-selection-ssr-1">A</en-select-option></en-select>`));
});

test('select option labels are escaped static text without clonable hydration markers', async () => {
 const label='<img src=x onerror=alert(1)> & "literal"';
 const markup=await renderToString(html`<en-select label="Format" value="a" .items=${[{value:'a',label}]}></en-select>`);
 const root=shadow(all(parse(markup),'en-select')[0]);const control=all(root.content,'select')[0];const option=all(control,'option')[0];
 assert.equal(text(option),label);assert.equal(all(option,'img').length,0);assert.equal(option.childNodes.some(node=>node.nodeName==='#comment'),false);
 // This parse5 release predates customizable-select parsing; inspect the emitted markup here.
 assert.match(markup, /<selectedcontent part="selected-content"><\/selectedcontent>/);
});

test('checkbox rich labels preserve authored markup with separate names and descriptions in SSR', async () => {
 const markup=await renderToString(html`<en-checkbox-group cards name="teams" value='["a"]'><en-choice-option value="a"><span aria-hidden="true">★</span><strong>Alpha</strong><span slot="description"><em>First</em> team</span></en-choice-option><en-choice-option value="b" label="Beta" description="Second team"></en-choice-option></en-checkbox-group>`);
 const host=all(parse(markup),'en-checkbox-group')[0],children=direct(host,'en-choice-option'),inputs=all(shadow(host).content,'input');
 assert.equal(plan(host).kind,'checkbox');assert.equal(attr(inputs[0],'aria-label'),'Alpha');assert.equal(attr(inputs[0],'aria-description'),'First team');assert.equal(attr(inputs[0],'checked'),'');
 assert.equal(attr(inputs[1],'aria-description'),'Second team');assert.equal(attr(children[0],'slot'),'en-selection-ssr-0');
 assert.equal(all(children[0],'strong').length,1);assert.equal(all(children[0],'em').length,1);
 assert.ok(all(shadow(host).content,'slot').some(s=>attr(s,'name')==='en-selection-ssr-0'));
});
test('checkbox SSR rejects interactive projected labels and unsupported content slots', async () => {
 for(const content of [html`<button>Action</button>`,html`<span tabindex="0">Focus</span>`,html`<span slot="other">Other</span>`])
  await assert.rejects(()=>renderToString(html`<en-checkbox-group><en-choice-option value="a">${content}</en-choice-option></en-checkbox-group>`));
});

test('assigned empty and hidden checkbox descriptions suppress attribute fallback in SSR projection', async () => {
 const markup=await renderToString(html`<en-checkbox-group><en-choice-option value="empty" label="Empty" description="Fallback"><span slot="description"></span></en-choice-option><en-choice-option value="hidden" label="Hidden" description="Fallback"><span slot="description" hidden>Hidden text</span></en-choice-option><en-choice-option value="plain" label="Plain" description="Fallback"></en-choice-option></en-checkbox-group>`);
 const host=all(parse(markup),'en-checkbox-group')[0],inputs=all(shadow(host).content,'input');
 assert.deepEqual(inputs.map(input=>attr(input,'aria-description')),[undefined,undefined,'Fallback']);
 assert.deepEqual(plan(host).items.map(item=>item.description),['','','Fallback']);
});
