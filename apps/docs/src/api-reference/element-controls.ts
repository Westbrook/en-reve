import { html, nothing } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import type { ReactiveControllerHost } from 'lit';
import definitions from '../generated/api-element-controls.js';
import { acceptValueChange } from '../change-consumption.js';
import { acceptsControlValue, isControlValue, type APIControlDescriptor, type APIControlOperation, type APIControlReadback, type APIControlsSnapshot, type APIControlValue } from '../api-example/controls.js';

interface EditorState {
	available: boolean; revision: number; operation?: APIControlOperation;
	values: Record<string, APIControlReadback>; seeds: Record<string, APIControlValue>;
	drafts: Record<string, APIControlValue>; dirty: Set<string>; composing: Set<string>;
	errors: Record<string, string>; status: string;
}
type Host = ReactiveControllerHost & HTMLElement;
const display = (value: APIControlReadback | undefined) => value?.defined ? JSON.stringify(value.value) : 'undefined / unavailable';
const primaryProperties = ['value', 'checked', 'open', 'disabled', 'size', 'variant', 'type', 'orientation'];
const rank = (property: string) => { const index = primaryProperties.indexOf(property); return index < 0 ? primaryProperties.length : index; };

/** Parent editors never instantiate or reach into the demonstrated component. */
export class APIElementControlsController {
	private states = new Map<string, EditorState>();
	constructor(private host: Host, private changed: (tag: string) => void, private refresh: (tag: string) => void) {}
	private state(tag: string) {
		let state = this.states.get(tag);
		if (!state) {
			state = { available: false, revision: 0, values: {}, seeds: {}, drafts: {}, dirty: new Set(), composing: new Set(), errors: {}, status: '' };
			this.states.set(tag, state);
		}
		return state;
	}
	operation(tag: string) { return this.state(tag).operation; }
	reset(tag: string) {
		const state = this.state(tag);
		state.available = false; state.revision++; state.operation = undefined;
		state.values = {}; state.seeds = {}; state.drafts = {}; state.errors = {};
		state.dirty.clear(); state.composing.clear(); state.status = '';
	}
	receive(tag: string, raw: unknown) {
		const definition = definitions[tag];
		if (!definition || !raw || typeof raw !== 'object' || Array.isArray(raw)) return;
		const snapshot = raw as APIControlsSnapshot;
		if (snapshot.targetId !== (definition.target?.id ?? null) || typeof snapshot.available !== 'boolean' || typeof snapshot.message !== 'string'
			|| !snapshot.values || typeof snapshot.values !== 'object' || Array.isArray(snapshot.values)) return;
		const values: Record<string, APIControlReadback> = {};
		for (const control of definition.controls) {
			const value = snapshot.values[control.property];
			if (!value || typeof value !== 'object' || typeof value.defined !== 'boolean' || value.defined && !isControlValue(value.value)) return;
			values[control.property] = value.defined ? { defined: true, value: value.value } : { defined: false };
		}
		const state = this.state(tag); state.available = snapshot.available; state.values = values;
		for (const control of definition.controls) if (!state.dirty.has(control.property)) {
			const value = values[control.property];
			state.seeds[control.property] = value?.defined ? value.value : control.kind === 'boolean' ? false : '';
		}
		if (snapshot.message) state.status = snapshot.message;
		this.host.requestUpdate();
	}
	private draft(tag: string, property: string, value: APIControlValue, composing = false) {
		const state = this.state(tag); state.drafts[property] = value; state.dirty.add(property);
		if (composing) state.composing.add(property); else state.composing.delete(property);
		if (state.errors[property]) { delete state.errors[property]; this.host.requestUpdate(); }
	}
	private textInput(tag: string, property: string, event: Event) {
		if (event.composedPath()[0] !== event.currentTarget) return;
		const detail = (event as CustomEvent<{ value: string; isComposing: boolean }>).detail;
		this.draft(tag, property, detail.value, detail.isComposing);
	}
	private checkbox(tag: string, property: string, event: Event) {
		const host = event.currentTarget as HTMLElement & { checked: boolean };
		if (event.composedPath()[0] !== host || event.defaultPrevented) return;
		event.preventDefault(); const value = (event as CustomEvent<{ proposed: boolean }>).detail.proposed;
		host.checked = value; this.draft(tag, property, value);
	}
	private submit(tag: string, control: APIControlDescriptor, event: Event) {
		event.preventDefault(); const state = this.state(tag);
		if (!state.available || state.composing.has(control.property)) return;
		const raw = state.dirty.has(control.property) ? state.drafts[control.property] : state.seeds[control.property];
		let value: unknown = raw;
		if (control.kind === 'number') value = typeof raw === 'number' ? raw : typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : undefined;
		if (control.kind === 'enum' && state.dirty.has(control.property)) value = typeof raw === 'string' && raw !== '' ? control.options?.[Number(raw)] : undefined;
		if (!acceptsControlValue(control, value)) {
			state.errors[control.property] = control.kind === 'number' ? 'Enter a finite number using a period for decimals.' : 'Choose a supported value.';
			state.status = `${control.property}: ${state.errors[control.property]}`;
			this.host.requestUpdate(); return;
		}
		delete state.errors[control.property];
		state.operation = { revision: ++state.revision, property: control.property, value };
		state.status = `Applying ${control.property}…`; this.changed(tag); this.host.requestUpdate();
	}
	private enter(tag: string, control: APIControlDescriptor, event: KeyboardEvent) {
		if (event.key !== 'Enter' || event.defaultPrevented || event.isComposing || event.keyCode === 229 || event.repeat
			|| event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || this.state(tag).composing.has(control.property)) return;
		event.preventDefault(); (event.currentTarget as HTMLElement).closest('form')?.requestSubmit();
	}
	private row(tag: string, control: APIControlDescriptor) {
		const state = this.state(tag), property = control.property;
		const seed = state.seeds[property] ?? (control.kind === 'boolean' ? false : '');
		const options = control.options?.map((value, index) => ({ value: String(index), label: String(value) })) ?? [];
		const selected = options.find((_, index) => Object.is(control.options?.[index], seed))?.value ?? '';
		const description = html`<span slot="description">${control.description ?? 'Public component property.'}
			${control.attribute ? html` Attribute: <code>${control.attribute}</code>.` : html` JavaScript property.`}
			${control.kind === 'number' ? ' Finite number; use a period for decimals. No bounds or step are inferred.' : nothing}</span>`;
		return html`<form class="api-control-form" data-control=${property}
			@submit=${(event: Event) => this.submit(tag, control, event)}>
			${control.kind === 'boolean' ? html`<en-checkbox .checked=${Boolean(seed)} .disabled=${!state.available}
				@en-change=${(event: Event) => this.checkbox(tag, property, event)}>${property}${description}</en-checkbox>`
			: control.kind === 'enum' ? html`<en-select label=${property} .items=${selected === '' ? [{ value: '', label: 'Choose a value' }, ...options] : options}
				.value=${selected} .disabled=${!state.available} .error=${state.errors[property] ?? ''}
				@en-change=${(event: Event) => acceptValueChange<string>(event, value => { this.draft(tag, property, value); return value; })}>${description}</en-select>`
			: html`<en-text-field label=${property} .value=${String(seed)} .disabled=${!state.available}
				inputmode=${control.kind === 'number' ? 'decimal' : 'text'} .error=${state.errors[property] ?? ''}
				@en-input=${(event: Event) => this.textInput(tag, property, event)}
				@en-change=${(event: Event) => acceptValueChange<string>(event, value => { this.draft(tag, property, value); return value; })}
				@keydown=${(event: KeyboardEvent) => this.enter(tag, control, event)}>${description}</en-text-field>`}
			<p class="api-control-current">Current: <code>${display(state.values[property])}</code></p>
			<en-button variant="secondary" .disabled=${!state.available} @click=${(event: Event) => (event.currentTarget as HTMLElement).closest('form')?.requestSubmit()}>Apply ${property}</en-button>
		</form>`;
	}
	render(tag: string) {
		const definition = definitions[tag], state = this.state(tag);
		const ordered = [...(definition?.controls ?? [])].sort((a, b) => rank(a.property) - rank(b.property) || a.property.localeCompare(b.property, 'en'));
		return html`<details class="api-element-controls" open>
			<summary>Element controls · ${tag}</summary>
			<div class="api-controls-scroll" role="region" aria-label=${`${tag} property editors`} tabindex="0">
			${definition?.target ? html`<p>Target: ${definition.target.title}. Apply writes a public property; it does not simulate a user event. Reset example restores the authored scene and these editors.</p>
				<en-button variant="ghost" .disabled=${!state.available} @click=${() => this.refresh(tag)}>Refresh values</en-button>
				<div class="api-controls-rows">${keyed(state.revision && !state.available ? state.revision : 0, ordered.map(control => this.row(tag, control)))}</div>`
				: html`<p>No exact authored target is available for this component. Its API and example remain below.</p>`}
			${definition?.excluded.length ? html`<details class="api-controls-excluded"><summary>Properties without a scalar editor (${definition.excluded.length})</summary><ul>${definition.excluded.map(item => html`<li><code>${item.property}</code>: ${item.reason}</li>`)}</ul></details>` : nothing}
			</div>
			<p class="api-controls-status" role="status">${state.status || nothing}</p>
		</details>`;
	}
}
