import '@lit-labs/ssr/lib/install-global-dom-shim.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFragment } from 'parse5';

const { html, LitElement, nothing } = await import('lit');
const { LitElementRenderer } = await import('@lit-labs/ssr/lib/lit-element-renderer.js');
const { renderToString, createBreadcrumbsSsrAdapter } = await import('@en-reve/ssr');
const { EnBreadcrumbsProbe, registerProbeElements } = await import('./component.mjs');
registerProbeElements();

const attr = (node, name) => node.attrs?.find(item => item.name === name)?.value;
const text = node => node.nodeName === '#text'
	? node.value
	: (node.childNodes ?? []).map(text).join('');
const directElements = node => (node.childNodes ?? []).filter(child => child.tagName);
const isShadowTemplate = node => node.tagName === 'template' && attr(node, 'shadowrootmode') !== undefined;
const authoredChildren = host => directElements(host).filter(node => !isShadowTemplate(node));

function all(root, predicate) {
	const result = [];
	function visit(node) {
		if (predicate(node)) result.push(node);
		for (const child of node.childNodes ?? []) visit(child);
		if (node.content) visit(node.content);
	}
	visit(root);
	return result;
}

const elements = (root, tag) => all(root, node => node.tagName === tag);
const hostById = (root, id) => all(root, node => node.tagName === 'en-breadcrumbs-probe' && attr(node, 'id') === id)[0];

function newAdapter() {
	return createBreadcrumbsSsrAdapter({
		tagName: 'en-breadcrumbs-probe',
		elementClass: EnBreadcrumbsProbe,
		capture: element => ({ label: element.label }),
		prepare: (element, keys, snapshot, { hiddenKeys }) => {
			element.setSSRPlan(keys, hiddenKeys);
			element.label = snapshot.label;
		},
	});
}

async function adapted(value, options = {}) {
	const adapter = newAdapter();
	const raw = await renderToString(value, {
		...options,
		elementRenderers: [adapter.Renderer, ...(options.elementRenderers ?? [])],
	});
	const source = await adapter.finalize(raw);
	return { source, document: parseFragment(source, { sourceCodeLocationInfo: true }) };
}

function projection(host) {
	assert.ok(host, 'the authored host is present');
	const shadow = directElements(host).find(isShadowTemplate);
	assert.ok(shadow, 'the host has declarative shadow content');
	assert.equal(attr(shadow, 'shadowrootmode'), 'open');
	assert.notEqual(attr(shadow, 'shadowrootslotassignment'), 'manual', 'SSR content projects before JavaScript');
	const nav = elements(shadow.content, 'nav')[0];
	assert.ok(nav, 'breadcrumb has a native navigation landmark');
	const list = directElements(nav).find(node => node.tagName === 'ol');
	assert.ok(list, 'navigation contains a native ordered list');
	const items = directElements(list).filter(node => node.tagName === 'li');
	const children = authoredChildren(host);
	assert.equal(items.length, children.length, 'each original direct child has one list item');
	const names = items.map(item => {
		const slots = elements(item, 'slot');
		assert.equal(slots.length, 1, 'each list item owns one projection slot');
		assert.equal(directElements(item).includes(slots[0]), true, 'the slot is inside its native list item');
		return attr(slots[0], 'name');
	});
	assert.equal(new Set(names).size, names.length, 'slot names are unique within the host');
	assert.deepEqual(children.map(child => attr(child, 'slot')), names, 'original children map to wrappers in document order');
	return { shadow, nav, list, items, children, names };
}

function lightShape(node) {
	if (isShadowTemplate(node)) return undefined;
	const result = { name: node.nodeName };
	if (node.value !== undefined) result.value = node.value;
	if (node.data !== undefined) result.data = node.data;
	if (node.attrs) result.attrs = node.attrs
		.filter(item => item.name !== 'slot' && !item.name.startsWith('data-en-breadcrumbs-'))
		.map(item => [item.name, item.value]);
	if (node.childNodes) result.children = node.childNodes.map(lightShape).filter(Boolean);
	if (node.content) result.content = lightShape(node.content);
	return result;
}

function originalInnerSource(source, node) {
	assert.ok(node.sourceCodeLocation?.startTag && node.sourceCodeLocation?.endTag);
	return source.slice(node.sourceCodeLocation.startTag.endOffset, node.sourceCodeLocation.endTag.startOffset);
}

test('ordinary direct children produce visible named SSR slots with the property-only label', async () => {
	const label = 'Studio & project path';
	const { document } = await adapted(html`
		<en-breadcrumbs-probe id="primary" .label=${label}>
			<a href="/projects">Projects</a>
			<a href="/projects/studio">Studio</a>
			<span aria-current="page">Overview</span>
		</en-breadcrumbs-probe>
	`);
	const host = hostById(document, 'primary');
	const { nav, children } = projection(host);
	assert.equal(attr(host, 'label'), undefined, 'property binding was not reflected into an attribute');
	assert.equal(attr(nav, 'aria-label'), label, 'adapter captured actual instance properties');
	assert.deepEqual(children.map(child => [child.tagName, text(child), attr(child, 'href'), attr(child, 'aria-current')]), [
		['a', 'Projects', '/projects', undefined],
		['a', 'Studio', '/projects/studio', undefined],
		['span', 'Overview', undefined, 'page'],
	]);
});

test('rich labels, native attributes, entity source and surrounding hydration markers survive the adapter', async () => {
	const label = 'A < B & C';
	const value = html`
		<section data-context="before &amp; after">
			${html`<p>Before ${label}</p>`}
			<en-breadcrumbs-probe id="rich" .label=${'Detailed path'}>
				<!-- authored spacing and comments belong to the consumer -->
				<a id="source-link" href="/projects?q=a&amp;b=c" data-note='a &quot;quote&quot;' target="_blank" rel="noopener">Tools &amp; <strong title="a&nbsp;b">${label}</strong><!-- label note --><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M 0 0 L 16 16"></path></svg></a>
				<span aria-current="page"><em>Overview</em> &copy;</span>
			</en-breadcrumbs-probe>
			${html`<p>After ${'tail'}</p>`}
		</section>
	`;
	const baseline = await renderToString(value);
	const baselineDocument = parseFragment(baseline, { sourceCodeLocationInfo: true });
	const { source, document } = await adapted(value);
	const { children } = projection(hostById(document, 'rich'));
	const originalChildren = authoredChildren(hostById(baselineDocument, 'rich'));
	assert.deepEqual(lightShape(document), lightShape(baselineDocument), 'authored DOM and all non-shadow Lit comment markers are preserved');
	children.forEach((child, index) => {
		assert.equal(originalInnerSource(source, child), originalInnerSource(baseline, originalChildren[index]), 'rich authored label source is not reserialized');
	});
	assert.equal(attr(children[0], 'href'), '/projects?q=a&b=c');
	assert.equal(attr(children[0], 'data-note'), 'a "quote"');
	assert.equal(text(elements(children[0], 'strong')[0]), label);
	assert.equal(elements(children[0], 'svg').length, 1);
	assert.equal(elements(children[0], 'path').length, 1);
});

test('dynamic arrays and empty Lit parts map only the actual authored direct elements', async () => {
	const links = [{ label: 'Projects', href: '/projects' }, { label: 'Studio', href: '/projects/studio' }];
	const value = html`
		<en-breadcrumbs-probe id="dynamic" .label=${'Dynamic path'}>
			${nothing}
			${links.map(link => html`<a href=${link.href}>${link.label}</a>`)}
			${false ? html`<a href="/absent">Absent</a>` : nothing}
			<span aria-current="page">${'Overview'}</span>
		</en-breadcrumbs-probe>
	`;
	const baseline = parseFragment(await renderToString(value));
	const { document } = await adapted(value);
	const { children } = projection(hostById(document, 'dynamic'));
	assert.deepEqual(children.map(child => text(child)), ['Projects', 'Studio', 'Overview']);
	assert.deepEqual(lightShape(document), lightShape(baseline), 'array and empty-part hydration boundaries survive unchanged');
});

test('adding projection attributes preserves native unquoted attribute values', async () => {
	const value = html`<en-breadcrumbs-probe id=unquoted><a href=/projects?first=one&amp;second=two data-note=authored>Projects</a><span aria-current=page>Current</span></en-breadcrumbs-probe>`;
	const baseline = parseFragment(await renderToString(value));
	const { document } = await adapted(value);
	const { children } = projection(hostById(document, 'unquoted'));
	assert.equal(attr(children[0], 'href'), '/projects?first=one&second=two');
	assert.equal(attr(children[0], 'data-note'), 'authored');
	assert.equal(attr(children[1], 'aria-current'), 'page');
	assert.deepEqual(lightShape(document), lightShape(baseline));
});

class AdapterTestFrame extends LitElement {
	static properties = { label: {}, leaf: {} };
	constructor() {
		super();
		this.label = 'Frame default';
		this.leaf = 'Frame leaf';
	}
	render() {
		return html`
			<section>
				<en-breadcrumbs-probe id="nested-path" .label=${this.label}>
					<a href="/nested">Nested root</a>
					<span aria-current="page">${this.leaf}</span>
				</en-breadcrumbs-probe>
				<slot></slot>
			</section>
		`;
	}
}
customElements.define('en-adapter-test-frame', AdapterTestFrame);

test('adjacent and shadow-nested hosts retain request-local labels, custom renderers and renderer callbacks', async () => {
	const customRendererLabels = [];
	class FrameRenderer extends LitElementRenderer {
		static matchesClass(_constructor, tagName) { return tagName === 'en-adapter-test-frame'; }
		renderShadow(info) {
			customRendererLabels.push(this.element.label);
			return super.renderShadow(info);
		}
	}
	const rendered = [];
	const { document } = await adapted(html`
		<en-breadcrumbs-probe id="first" .label=${'First path'}><a href="/first">First</a></en-breadcrumbs-probe>
		<en-adapter-test-frame .label=${'Nested path'} .leaf=${'Nested & current'}>
			<p>Frame-owned light content</p>
		</en-adapter-test-frame>
		<en-breadcrumbs-probe id="last" .label=${'Last path'}><span aria-current="page">Last</span></en-breadcrumbs-probe>
	`, { elementRenderers: [FrameRenderer], onCustomElementRendered: tag => rendered.push(tag) });
	for (const [id, label] of [['first', 'First path'], ['nested-path', 'Nested path'], ['last', 'Last path']]) {
		assert.equal(attr(projection(hostById(document, id)).nav, 'aria-label'), label);
	}
	assert.equal(text(projection(hostById(document, 'nested-path')).children[1]), 'Nested & current');
	assert.deepEqual(customRendererLabels, ['Nested path'], 'the additional renderer executes exactly once');
	assert.deepEqual(rendered.toSorted(), ['en-adapter-test-frame', 'en-breadcrumbs-probe', 'en-breadcrumbs-probe', 'en-breadcrumbs-probe'].toSorted());
	const frame = elements(document, 'en-adapter-test-frame')[0];
	assert.equal(elements(directElements(frame).find(isShadowTemplate).content, 'en-breadcrumbs-probe').length, 1);
	assert.equal(text(authoredChildren(frame)[0]), 'Frame-owned light content');
});

test('empty and comment-only authored content produce an empty native list without invented items', async () => {
	const { document } = await adapted(html`
		<en-breadcrumbs-probe id="empty"></en-breadcrumbs-probe>
		<en-breadcrumbs-probe id="comments"> \n\t<!-- no breadcrumb items yet --> </en-breadcrumbs-probe>
	`);
	for (const id of ['empty', 'comments']) assert.equal(projection(hostById(document, id)).items.length, 0);
});

test('anchors without href retain their authored native semantics', async () => {
	const { document } = await adapted(html`<en-breadcrumbs-probe id="anchor"><a aria-current="page">Current location</a></en-breadcrumbs-probe>`);
	const child = projection(hostById(document, 'anchor')).children[0];
	assert.equal(attr(child, 'href'), undefined);
	assert.equal(attr(child, 'role'), undefined);
	assert.equal(attr(child, 'tabindex'), undefined);
	assert.equal(attr(child, 'aria-current'), 'page');
});

test('hidden children retain their mapping while list visibility and separators follow visible items', async () => {
	const { document } = await adapted(html`
		<en-breadcrumbs-probe id="hidden-path">
			<a href="/hidden-first" hidden>Hidden first</a>
			<a href="/visible-first">Visible first</a>
			<a href="/hidden-middle" hidden>Hidden middle</a>
			<span aria-current="page">Visible current</span>
		</en-breadcrumbs-probe>
	`);
	const host = hostById(document, 'hidden-path');
	const { items, children } = projection(host);
	assert.deepEqual(items.map(item => attr(item, 'hidden') !== undefined), [true, false, true, false]);
	assert.deepEqual(children.map(child => attr(child, 'hidden') !== undefined), [true, false, true, false], 'the adapter preserves original child visibility attributes');
	const visibleItems = items.filter(item => attr(item, 'hidden') === undefined);
	assert.equal(elements(visibleItems[0], 'span').filter(span => attr(span, 'aria-hidden') === 'true').length, 0, 'the first visible item has no separator');
	assert.equal(elements(visibleItems[1], 'span').filter(span => attr(span, 'aria-hidden') === 'true').length, 1, 'later visible items receive one decorative separator');
	const plan = JSON.parse(attr(host, 'data-en-breadcrumbs-plan'));
	assert.deepEqual(plan.hiddenKeys, [plan.keys[0], plan.keys[2]]);
});

test('hidden until-found is explicitly rejected rather than made unreachable by a hidden wrapper', async () => {
	await assert.rejects(() => adapted(html`<en-breadcrumbs-probe><a href="/find" hidden="UNTIL-FOUND">Find this path</a></en-breadcrumbs-probe>`), error => {
		assert.equal(error instanceof Error, true);
		assert.ok(error.message.toLowerCase().includes('until-found'));
		return true;
	});
});

const unsupported = [
	['non-whitespace direct text', html`Unwrapped location`],
	['non-breaking-space direct text', html`&nbsp;`],
	['a wrapping div', html`<div><a href="/nested">Nested anchor</a></div>`],
	['a direct button', html`<button>Action</button>`],
	['an authored template', html`<template><a href="/hidden">Hidden anchor</a></template>`],
	['a direct custom element', html`<en-adapter-test-frame></en-adapter-test-frame>`],
];

for (const [name, children] of unsupported) {
	test(`unsupported ${name} fails instead of silently hiding authored content`, async () => {
		await assert.rejects(() => adapted(html`<en-breadcrumbs-probe>${children}</en-breadcrumbs-probe>`), error => {
			assert.equal(error instanceof Error, true);
			assert.ok(error.message.length > 0, 'rejection explains the unsupported content');
			return true;
		});
	});
}

for (const value of ['', 'author-owned']) {
	test(`an existing ${value ? 'named' : 'empty'} slot attribute fails rather than being overwritten`, async () => {
		await assert.rejects(() => adapted(html`<en-breadcrumbs-probe><a slot=${value} href="/projects">Projects</a></en-breadcrumbs-probe>`), error => {
			assert.equal(error instanceof Error, true);
			assert.ok(error.message.toLowerCase().includes('slot'), 'diagnostic identifies the conflicting slot attribute');
			return true;
		});
	});
}

test('a consumer-authored private SSR plan is rejected rather than trusted', async () => {
	await assert.rejects(() => adapted(html`<en-breadcrumbs-probe data-en-breadcrumbs-plan=${JSON.stringify({ version: 1, keys: ['author-key'] })}><a href="/projects">Projects</a></en-breadcrumbs-probe>`), error => {
		assert.equal(error instanceof Error, true);
		assert.ok(error.message.toLowerCase().includes('plan'), 'diagnostic identifies the reserved plan attribute');
		return true;
	});
});

test('concurrent valid and rejected requests do not share labels, children or adapter state', async () => {
	const snapshots = Array.from({ length: 12 }, (_, index) => ({ index, label: `Path ${index}`, leaf: `Item ${index}`, invalid: index % 4 === 1 }));
	const results = await Promise.allSettled(snapshots.map(snapshot => adapted(html`
		<en-breadcrumbs-probe id="request" .label=${snapshot.label}>
			${snapshot.invalid ? html`<button>${snapshot.leaf}</button>` : html`<a href=${`/projects/${snapshot.index}`}>${snapshot.leaf}</a>`}
		</en-breadcrumbs-probe>
	`)));
	results.forEach((result, index) => {
		const snapshot = snapshots[index];
		assert.equal(result.status, snapshot.invalid ? 'rejected' : 'fulfilled');
		if (result.status === 'fulfilled') {
			const { nav, children } = projection(hostById(result.value.document, 'request'));
			assert.equal(attr(nav, 'aria-label'), snapshot.label);
			assert.deepEqual(children.map(child => [text(child), attr(child, 'href')]), [[snapshot.leaf, `/projects/${snapshot.index}`]]);
		}
	});
	const recovery = await adapted(html`<en-breadcrumbs-probe id="recovery" .label=${'Recovery'}><span aria-current="page">Fresh request</span></en-breadcrumbs-probe>`);
	assert.equal(attr(projection(hostById(recovery.document, 'recovery')).nav, 'aria-label'), 'Recovery');
});

class AdapterTestBadge extends LitElement {
	static properties = { label: {} };
	constructor() { super(); this.label = ''; }
	render() { return html`<strong>${this.label}</strong>`; }
}
customElements.define('en-adapter-test-badge', AdapterTestBadge);

test('asynchronous rich-label renderers can interleave requests without mixing their SSR mappings', { timeout: 5000 }, async () => {
	const gates = new Map(['first', 'second'].map(label => [label, { entered: Promise.withResolvers(), release: Promise.withResolvers() }]));
	const seen = [];
	class DelayedBadgeRenderer extends LitElementRenderer {
		static matchesClass(_constructor, tagName) { return tagName === 'en-adapter-test-badge'; }
		renderShadow(info) {
			const label = this.element.label;
			const gate = gates.get(label);
			return [async () => {
				gate.entered.resolve();
				await gate.release.promise;
				seen.push(label);
				return super.renderShadow(info);
			}];
		}
	}
	const callbacks = new Map(['first', 'second'].map(label => [label, []]));
	const request = label => adapted(html`
		<en-breadcrumbs-probe id="async" .label=${`Path ${label}`}>
			<a href=${`/${label}`}><en-adapter-test-badge .label=${label}></en-adapter-test-badge> ${label}</a>
			<span aria-current="page">Current ${label}</span>
		</en-breadcrumbs-probe>
	`, { elementRenderers: [DelayedBadgeRenderer], onCustomElementRendered: tag => callbacks.get(label).push(tag) });
	const first = request('first');
	const second = request('second');
	try {
		await Promise.race([
			Promise.all([...gates.values()].map(gate => gate.entered.promise)),
			Promise.all([first, second]).then(() => { throw new Error('Requests bypassed the asynchronous renderer gates.'); }),
		]);
		gates.get('second').release.resolve();
		const secondResult = await second;
		assert.deepEqual(seen, ['second'], 'second response finishes while the first is suspended');
		const ordinary = parseFragment(await renderToString(html`<en-adapter-test-frame .label=${'Ordinary renderer request'}></en-adapter-test-frame>`));
		const ordinaryNav = elements(ordinary, 'nav')[0];
		assert.equal(attr(ordinaryNav, 'aria-label'), 'Ordinary renderer request', 'a regular render proceeds while an adapted render is suspended');
		gates.get('first').release.resolve();
		const firstResult = await first;
		for (const [label, result] of [['first', firstResult], ['second', secondResult]]) {
			const { nav, children } = projection(hostById(result.document, 'async'));
			assert.equal(attr(nav, 'aria-label'), `Path ${label}`);
			assert.equal(attr(children[0], 'href'), `/${label}`);
			assert.equal(text(children[1]), `Current ${label}`);
			const badge = elements(children[0], 'en-adapter-test-badge')[0];
			assert.equal(text(elements(directElements(badge).find(isShadowTemplate).content, 'strong')[0]), label);
			assert.deepEqual(callbacks.get(label).toSorted(), ['en-breadcrumbs-probe', 'en-adapter-test-badge'].toSorted());
		}
	} finally {
		for (const gate of gates.values()) gate.release.resolve();
		await Promise.allSettled([first, second]);
	}
});

test('an asynchronous renderer rejection does not poison a following adapter request', async () => {
	class RejectingBadgeRenderer extends LitElementRenderer {
		static matchesClass(_constructor, tagName) { return tagName === 'en-adapter-test-badge'; }
		renderShadow() {
			return [async () => { await Promise.resolve(); throw new Error('Request-owned badge failure'); }];
		}
	}
	await assert.rejects(() => adapted(html`
		<en-breadcrumbs-probe><a href="/failed"><en-adapter-test-badge></en-adapter-test-badge></a></en-breadcrumbs-probe>
	`, { elementRenderers: [RejectingBadgeRenderer] }), { message: 'Request-owned badge failure' });
	const { document } = await adapted(html`<en-breadcrumbs-probe id="after-failure" .label=${'After failure'}><a href="/fresh">Fresh</a></en-breadcrumbs-probe>`);
	const { nav, children } = projection(hostById(document, 'after-failure'));
	assert.equal(attr(nav, 'aria-label'), 'After failure');
	assert.equal(attr(children[0], 'href'), '/fresh');
});

test('documents without a breadcrumb pass through without reserializing unrelated content', async () => {
	const value = html`<main data-note='&quot;unchanged&quot;'><p>Native &amp; ${'dynamic'} content</p><!-- preserved --></main>`;
	const raw = await renderToString(value);
	const adapter = newAdapter();
	const actual = await adapter.finalize(raw);
	assert.equal(actual, raw);
	const document = parseFragment(actual);
	assert.equal(text(elements(document, 'p')[0]), 'Native & dynamic content');
});

test('a finalized adapter cannot finalize or render a second response', async () => {
	const adapter = newAdapter();
	const value = html`<en-breadcrumbs-probe><a href="/once">Once</a></en-breadcrumbs-probe>`;
	const raw = await renderToString(value, { elementRenderers: [adapter.Renderer] });
	const output = await adapter.finalize(raw);
	assert.equal(elements(parseFragment(output), 'a').length, 1);
	await assert.rejects(() => adapter.finalize(raw));
	await assert.rejects(() => renderToString(value, { elementRenderers: [adapter.Renderer] }));
});

test('an adapter rejects another request boundary without consuming that other request state', async () => {
	const first = newAdapter();
	const second = newAdapter();
	const value = html`<en-breadcrumbs-probe id="ownership" .label=${'Owned path'}><a href="/owned">Owned</a></en-breadcrumbs-probe>`;
	const [firstRaw, secondRaw] = await Promise.all([
		renderToString(value, { elementRenderers: [first.Renderer] }),
		renderToString(value, { elementRenderers: [second.Renderer] }),
	]);
	await assert.rejects(() => first.finalize(secondRaw), error => {
		assert.equal(error instanceof Error, true);
		assert.ok(error.message.length > 0);
		return true;
	});
	await assert.rejects(() => first.finalize(firstRaw), 'a failed finalization also consumes its one-use adapter');
	const document = parseFragment(await second.finalize(secondRaw));
	assert.equal(attr(projection(hostById(document, 'ownership')).nav, 'aria-label'), 'Owned path');
});
