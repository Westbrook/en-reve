import { html } from 'lit';
import { repeat } from 'lit/directives/repeat.js';

export function createFixtureState(options = {}) {
	return {
		case: options.case ?? 'default',
		label: options.label ?? 'Project path',
		revision: options.revision ?? 0,
		order: [...(options.order ?? ['home', 'projects', 'current'])],
		extra: options.extra ?? false,
		hidden: options.hidden ?? false,
	};
}

export function pathTemplate(state, handlers, id = 'path') {
	const order = [...state.order];
	if (state.extra && !order.includes('extra')) order.splice(Math.max(0, order.indexOf('current')), 0, 'extra');
	const click = event => handlers.onLinkClick?.(event);
	return html`
		<en-breadcrumbs-probe id=${id} .label=${id === 'path' ? state.label : 'Secondary path'}>
			<!-- Authored whitespace and comments are not breadcrumb entries. -->
			${repeat(order, item => item, item => item === 'current' ? html`
				<span id=${`${id}-current`} aria-current="page">Document <em>${state.revision ? 'revised' : 'draft'}</em></span>
			` : item === 'home' ? html`
				<a id=${`${id}-home`} href="#home" @click=${click}><strong>Home</strong><span aria-hidden="true"> ↗</span></a>
			` : item === 'projects' ? html`
				<a id=${`${id}-projects`} ?hidden=${state.hidden} href=${state.revision ? '#updated' : '#projects'} @click=${click}><span>Projects</span> <em>${state.revision ? 'updated' : 'workspace'}</em></a>
			` : html`
				<a id=${`${id}-extra`} href="#extra" @click=${click}><span>Shared</span> library</a>
			`)}
		</en-breadcrumbs-probe>
	`;
}

/** Authored content has no slot assignments, projection plans, counts or duplicate link source. */
export function fixtureTemplate(state = createFixtureState(), handlers = {}) {
	if (state.case === 'adjacent') return html`
		${pathTemplate(state, handlers)}
		<p id="between-paths">Between independent paths</p>
		${pathTemplate(state, handlers, 'secondary')}
	`;
	if (state.case === 'nested') return html`
		<en-breadcrumbs-probe-frame .label=${'Authored nested frame'} .state=${{ ...state, order: [...state.order] }} .handlers=${handlers}></en-breadcrumbs-probe-frame>
		<p id="after-frame">After the nested frame</p>
	`;
	return pathTemplate(state, handlers);
}
