import '@lit-labs/ssr-client/lit-element-hydrate-support.js';
import { hydrate } from '@lit-labs/ssr-client';
import { render } from 'lit';
import { registerProbeElements } from './component.mjs';
import { createFixtureState, fixtureTemplate } from './template.mjs';

let started;

export function start(options = {}) {
	return started ??= initialize(options);
}

async function initialize(options) {
	const root = document.getElementById('fixture');
	if (!root) throw new Error('Missing breadcrumb fixture root.');
	let state = createFixtureState({ case: document.body.dataset.case ?? 'default', hidden: document.body.dataset.hidden === 'true', ...options });
	const clicks = [];
	const handlers = {
		onLinkClick(event) {
			clicks.push({ id: event.currentTarget.id, href: event.currentTarget.getAttribute('href') });
		},
	};
	registerProbeElements();
	if (document.body.dataset.mode === 'client') render(fixtureTemplate(state, handlers), root);
	else hydrate(fixtureTemplate(state, handlers), root);

	const elements = (scope = root) => [...scope.querySelectorAll('en-breadcrumbs-probe, en-breadcrumbs-probe-frame')]
		.flatMap(element => [element, ...(element.shadowRoot ? elements(element.shadowRoot) : [])]);
	const host = (id = 'path') => elements().find(element => element.id === id);
	const settle = async () => {
		for (let pass = 0; pass < 4; pass++) {
			await Promise.resolve();
			await Promise.all(elements()
				.map(element => element.updateComplete));
		}
	};
	const update = async patch => {
		state = { ...state, ...patch, order: [...(patch.order ?? state.order)] };
		render(fixtureTemplate(state, handlers), root);
		await settle();
	};
	let detached;
	const harness = {
		get state() { return state; },
		clicks, host, settle, update,
		reorder: order => update({ order }),
		add: () => update({ extra: true }),
		remove: id => update({ order: state.order.filter(item => item !== id), ...(id === 'extra' ? { extra: false } : {}) }),
		async disconnect() {
			const element = host();
			if (!element) return;
			detached = { element, parent: element.parentNode, next: element.nextSibling };
			element.remove();
			await Promise.resolve();
		},
		async reconnect() {
			if (!detached) return;
			detached.parent.insertBefore(detached.element, detached.next);
			detached = undefined;
			await settle();
		},
	};
	window.breadcrumbsProbe = harness;
	await settle();
	document.body.dataset.ready = 'true';
	return harness;
}
