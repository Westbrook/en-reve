import { APIElementControlsController } from './element-controls.js';
import controlDefinitions from '../generated/api-element-controls.js';
import { acceptValueChange } from '../change-consumption.js';
import { html, nothing } from 'lit';
import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { API_EXAMPLE_VERSION, isRecord } from '../api-example/protocol.js';
import type { ExampleDensity, ExampleMode } from '../api-example/protocol.js';

interface DemoState {
	mode: ExampleMode; density: ExampleDensity; resetRevision: number;
	phase: 'loading' | 'ready' | 'error'; error: string;
	documentId?: string; sentKey?: string; requestId?: number;
}
const modes = [{ value: 'auto', label: 'Auto' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }];
const densities = [{ value: 'compact', label: 'Compact' }, { value: 'comfortable', label: 'Comfortable' }, { value: 'spacious', label: 'Spacious' }];

/** Parent-side controls contain no specimen classes, template evaluation, or theme compiler. */
export class APILiveDemoController implements ReactiveController {
	private host: ReactiveControllerHost & HTMLElement;
	private states = new Map<string, DemoState>();
	private frames = new WeakSet<HTMLIFrameElement>();
	private lifecycle?: AbortController;
	private sequence = 0;
	private elementControls: APIElementControlsController;
	constructor(host: ReactiveControllerHost & HTMLElement) { this.host = host; this.elementControls = new APIElementControlsController(host, tag => { this.send(tag); host.requestUpdate(); }, tag => { this.state(tag).sentKey = undefined; this.send(tag); }); host.addController(this); }
	hostConnected() {
		this.lifecycle?.abort(); this.lifecycle = new AbortController();
		this.host.ownerDocument.defaultView?.addEventListener('message', this.receive, { signal: this.lifecycle.signal });
	}
	hostDisconnected() { this.lifecycle?.abort(); this.frames = new WeakSet(); }
	hostUpdated() {
		for (const frame of this.host.querySelectorAll<HTMLIFrameElement>('.api-demo-frame')) {
			if (this.frames.has(frame)) continue;
			this.frames.add(frame); this.connect(frame);
		}
	}
	private state(id: string) {
		let state = this.states.get(id);
		if (!state) { state = { mode: 'auto', density: 'comfortable', resetRevision: 0, phase: 'loading', error: '' }; this.states.set(id, state); }
		return state;
	}
	private frame(id: string) { return [...this.host.querySelectorAll<HTMLIFrameElement>('.api-demo-frame')].find(frame => frame.dataset.componentTag === id); }
	private connect(frame: HTMLIFrameElement) {
		const id = frame.dataset.componentTag; const caseId = frame.dataset.exampleId; if (!id || !caseId) return;
		this.elementControls.reset(id);
		const state = this.state(id); state.phase = 'loading'; state.error = ''; state.sentKey = undefined; state.documentId = undefined;
		frame.removeAttribute('data-example-ready');
		frame.contentWindow?.postMessage({ type: 'en-api-example-connect', version: API_EXAMPLE_VERSION, caseId }, this.host.ownerDocument.location.origin);
		this.host.requestUpdate();
	}
	private send(id: string) {
		const frame = this.frame(id); const state = this.state(id);
		if (!frame?.contentWindow || !state.documentId) return;
		const control = this.elementControls.operation(id);
		const key = JSON.stringify([state.documentId, state.mode, state.density, state.resetRevision, control]);
		if (state.sentKey === key) return;
		state.sentKey = key; state.requestId = ++this.sequence;
		frame.removeAttribute('data-example-ready');
		frame.contentWindow.postMessage({ type: 'en-api-example-configure', version: API_EXAMPLE_VERSION, caseId: frame.dataset.exampleId, componentTag: id, targetId: controlDefinitions[id]?.target?.id ?? null, control,
			documentId: state.documentId, requestId: state.requestId, mode: state.mode, density: state.density, resetRevision: state.resetRevision }, this.host.ownerDocument.location.origin);
	}
	private receive = (event: MessageEvent) => {
		if (event.origin !== this.host.ownerDocument.location.origin || !isRecord(event.data) || event.data.version !== API_EXAMPLE_VERSION) return;
		const message = event.data;
		if (typeof message.caseId !== 'string' || typeof message.documentId !== 'string') return;
		const frame = [...this.host.querySelectorAll<HTMLIFrameElement>('.api-demo-frame')].find(frame => frame.contentWindow === event.source && frame.dataset.exampleId === message.caseId);
		if (!frame || frame.contentWindow !== event.source) return;
		// WindowProxy survives reloads. A reply from an old document cannot own the new frame.
		try { if (frame.contentDocument?.documentElement.dataset.enApiExampleDocument !== message.documentId) return; }
		catch { return; }
		const id = frame.dataset.componentTag; if (!id) return;
		const state = this.state(id);
		if (message.type === 'en-api-example-listening') {
			if (state.documentId !== message.documentId) state.sentKey = undefined;
			state.documentId = message.documentId; this.send(id);
		} else if (message.type === 'en-api-example-ready' && state.documentId === message.documentId && message.requestId === state.requestId
			&& message.componentTag === id && message.controlRevision === (this.elementControls.operation(id)?.revision ?? 0) && message.mode === state.mode && message.density === state.density && message.resetRevision === state.resetRevision) {
			state.phase = 'ready'; state.error = ''; frame.dataset.exampleReady = 'true'; this.elementControls.receive(id, message.controls); this.host.requestUpdate();
		} else if (message.type === 'en-api-example-controls-state' && message.componentTag === id && message.requestId === state.requestId) {
			this.elementControls.receive(id, message.controls);
		} else if (message.type === 'en-api-example-error') {
			state.phase = 'error'; state.error = 'The interactive example could not load. Reload the example to try again.'; this.host.requestUpdate();
		}
	};
	private appearance(id: string, event: CustomEvent<{ proposed: string }>) {
		acceptValueChange<string>(event, value => {
			if (value !== 'auto' && value !== 'light' && value !== 'dark') return;
			this.state(id).mode = value; this.send(id); this.host.requestUpdate();
			return this.state(id).mode;
		});
	}
	private density(id: string, event: CustomEvent<{ proposed: string }>) {
		acceptValueChange<string>(event, value => {
			if (!densities.some(item => item.value === value)) return;
			this.state(id).density = value as ExampleDensity; this.send(id); this.host.requestUpdate();
			return this.state(id).density;
		});
	}
	private reset(id: string) {
		const state = this.state(id);
		const frame = this.frame(id);
		this.elementControls.reset(id);
		let activeCase = false;
		try {
			const document = frame?.contentDocument;
			activeCase = Boolean(document && document.body.dataset.exampleId === frame?.dataset.exampleId
				&& document.querySelector('en-api-example-app')
				&& document.documentElement.dataset.enApiExampleDocument === state.documentId);
		} catch { /* Native links may leave this origin. */ }
		if (state.phase === 'error' || !activeCase) {
			if (frame) { this.connect(frame); frame.src = `/api-examples/${frame.dataset.exampleId}.html`; }
		} else { state.resetRevision++; this.send(id); }
		this.host.requestUpdate();
	}
	render(example: { id: string; title: string }, componentTag: string) {
		const id = componentTag; const state = this.state(id);
		return html`
			<section class="api-live-demo" aria-label=${`${example.title} live example controls`}>
				<div class="api-demo-tools">
					<en-segmented-control label="Example appearance" .items=${modes} .value=${state.mode} @en-change=${(event: CustomEvent<{ proposed: string }>) => this.appearance(id, event)}></en-segmented-control>
					<en-select label="Example density" .items=${densities} .value=${state.density} @en-change=${(event: CustomEvent<{ proposed: string }>) => this.density(id, event)}></en-select>
					<en-button variant="secondary" @click=${() => this.reset(id)}>${state.phase === 'error' ? 'Reload example' : 'Reset example'}</en-button>
				</div>
				<p class="api-demo-status" role="status" aria-live="polite">${state.phase === 'error' ? state.error : state.phase === 'loading' ? 'Loading interactive example…' : nothing}</p>
				<div class="api-demo-workbench">
					${this.elementControls.render(id)}
				<iframe class="api-demo-frame" data-example-id=${example.id} data-component-tag=${componentTag} title=${`${example.title} live example`}
					src=${`/api-examples/${example.id}.html`} loading="lazy" @load=${(event: Event) => this.connect(event.currentTarget as HTMLIFrameElement)}></iframe>
				</div>
			</section>
		`;
	}
}
