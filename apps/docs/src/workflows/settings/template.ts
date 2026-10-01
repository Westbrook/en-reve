import { html, nothing } from 'lit';
import { ref, type Ref } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';
import { guard } from 'lit/directives/guard.js';
import type { PendingFixtureRequest } from '../shared/fixture-scheduler.js';
import { sameSettings, settingsSummary, type SettingsState } from './model.js';
import { settingsCommands } from './commands.js';
import { getSettingsScenario, type SettingsScenario } from './scenarios.js';

export interface ValueField extends HTMLElement { value: string | number; checked: boolean; reportValidity(): boolean; }
export interface CommandSurface extends HTMLElement { open: boolean; updateComplete: Promise<unknown>; }
export interface SettingsRefs {
	root: Ref<HTMLElement>;
	menu: Ref<CommandSurface>;
	palette: Ref<CommandSurface>;
	commandTrigger: Ref<HTMLElement>;
	commandStatus: Ref<HTMLElement>;
	form: Ref<HTMLFormElement>;
	save: Ref<HTMLElement>;
	heading: Ref<HTMLHeadingElement>;
	incomingHeading: Ref<HTMLHeadingElement>;
	opacity: Ref<ValueField>;
	format: Ref<ValueField>;
	layout: Ref<ValueField>;
	background: Ref<ValueField>;
}
export interface SettingsActions {
	openCommands(): void;
	preloadCommands(event: Event): void;
	opacity(event: Event): void;
	format(event: Event): void;
	layout(event: Event): void;
	background(event: Event): void;
	menuLayout(event: Event): void;
	submit(event: SubmitEvent): void;
	save(event: Event): void;
	cancelSave(event: Event): void;
	keepLocal(event: Event): void;
	useIncoming(event: Event): void;
	reset(): void;
	restoreOpacity(event: Event): void;
	restoreOutput(): void;
	surfaceCommand(event: Event): void;
	shortcut(event: Event): void;
	saveOutcome(event: Event): void;
	delivery(event: Event): void;
	queueIncoming(): void;
	release(): void;
}
const outcomeItems = [{ value: 'success', label: 'Succeed' }, { value: 'failure', label: 'Fail next save' }];
const deliveryItems = [{ value: 'delayed', label: 'After 1.2 seconds' }, { value: 'held', label: 'Hold until delivered' }];

function shortcutControl(state: SettingsState, actions: SettingsActions) {
	return html`<en-checkbox .checked=${state.shortcutEnabled} @en-change=${actions.shortcut}>
		Enable Ctrl/⌘+K command shortcut
		<span slot="description">Optional for this settings workflow only, including while editing a field. Reset or leaving this page disables it. The visible Search commands button is always available.</span>
	</en-checkbox>`;
}
function saveResultControl(state: SettingsState, actions: SettingsActions) {
	return html`<en-select label="Settings save result" .items=${outcomeItems} .value=${state.saveOutcome} @en-change=${actions.saveOutcome}></en-select>`;
}
function deliveryControl(state: SettingsState, actions: SettingsActions) {
	return html`<en-select label="Settings response delivery" .items=${deliveryItems} .value=${state.delivery} @en-change=${actions.delivery}></en-select>`;
}
function queueIncomingControl(actions: SettingsActions) {
	return html`<en-button variant="secondary" @click=${actions.queueIncoming}>Queue collaborator update</en-button>`;
}
function deliverControl(actions: SettingsActions, pending: readonly PendingFixtureRequest[]) {
	return html`<en-button variant="secondary" ?disabled=${!pending.some(request => request.delivery === 'held')} @click=${actions.release}>Deliver held response</en-button>`;
}
function pendingSummary(state: SettingsState, pending: readonly PendingFixtureRequest[]) {
	return html`<p class="settings-note">${state.incomingPending ? 'Incoming update queued. ' : ''}${pending.length ? `${pending.length} response${pending.length === 1 ? '' : 's'} pending.` : 'No responses pending.'} Held responses are delivered in request order.</p>`;
}

/** A guide and the relevant fixture controls; never a second settings application. */
function scenarioGuide(scenario: SettingsScenario, state: SettingsState, actions: SettingsActions, pending: readonly PendingFixtureRequest[]) {
	const has = (control: SettingsScenario['controls'][number]) => scenario.controls.includes(control);
	return html`
		<div class="settings-scenario-guide">
			<section id="scenario-steps" class="settings-scenario-section" aria-labelledby="scenario-steps-title" tabindex="-1">
				<h4 id="scenario-steps-title">Try this</h4>
				<ol>${scenario.steps.map(step => html`<li>${step}</li>`)}</ol>
			</section>
			<section id="scenario-expected" class="settings-scenario-section" aria-labelledby="scenario-expected-title" tabindex="-1">
				<h4 id="scenario-expected-title">Expected result</h4>
				<ul>${scenario.expected.map(result => html`<li>${result}</li>`)}</ul>
			</section>
		</div>
		<section id="scenario-controls" class="settings-scenario-controls" aria-labelledby="scenario-controls-title" tabindex="-1">
			<h4 id="scenario-controls-title">Scenario controls</h4>
			<p class="settings-note">${scenario.controlsDescription}</p>
			${has('shortcut') ? shortcutControl(state, actions) : nothing}
			${has('save-result') || has('delivery') ? html`<div class="settings-qa-fields">
				${has('save-result') ? saveResultControl(state, actions) : nothing}
				${has('delivery') ? deliveryControl(state, actions) : nothing}
			</div>` : nothing}
			<div class="settings-actions">
				${has('queue-incoming') ? queueIncomingControl(actions) : nothing}
				${has('deliver-held') ? deliverControl(actions, pending) : nothing}
				<en-button variant="secondary" @click=${actions.reset}>Reset settings demo</en-button>
			</div>
			${has('deliver-held') ? pendingSummary(state, pending) : nothing}
		</section>
	`;
}

// Seed each mounted outline once, independently of output-setting rerenders.
const outlineExpansion = Object.freeze(['study', 'layers']);
function projectOutline() {
	const details: Record<string, string> = {
		study: 'Studio study is this local project’s root.', layers: 'Layers group the editable artwork.',
		cover: 'Cover is the composition previewed below.', accent: 'Accent adds a highlight to the artwork.',
		notes: 'Notes record decisions for a future review.',
	};
	const selected = (event: Event) => {
		const tree = event.currentTarget as HTMLElement & { value: string };
		if (event.composedPath()[0] !== tree || !event.cancelable) return;
		const detail = (event as CustomEvent<{ proposed: { value: string }; reason: string }>).detail;
		if (detail.reason !== 'selection') return;
		queueMicrotask(() => {
			if (event.defaultPrevented || !tree.isConnected || tree.value !== detail.proposed.value) return;
			const summary = tree.closest('.settings-project-outline')?.querySelector('[data-outline-details]');
			if (summary) summary.textContent = details[tree.value] ?? 'No project item selected.';
		});
	};
	return html`
		<section class="settings-project-outline" aria-labelledby="settings-outline-title">
			<h4 id="settings-outline-title">Project outline</h4>
			<p class="settings-note">Browse this local hierarchy independently of output settings. Selecting a layer does not edit the form or save the project. <a href="/api-examples/tree-data?progress-report">Compare a large data hierarchy</a> with optional virtualization.</p>
			<div class="settings-outline-panels">
				<en-tree id="settings-project-tree" label="Settings project outline" value="cover" .expanded=${guard([], () => outlineExpansion)} @en-change=${selected}>
					<en-tree-item value="study" label="Studio study">
						<en-tree-item slot="children" value="layers" label="Layers">
							<en-tree-item slot="children" value="cover" label="Cover"></en-tree-item>
							<en-tree-item slot="children" value="accent" label="Accent"></en-tree-item>
						</en-tree-item>
						<en-tree-item slot="children" value="notes" label="Notes"></en-tree-item>
					</en-tree-item>
				</en-tree>
				<p data-outline-details role="status">Cover is the composition previewed below.</p>
			</div>
		</section>
	`;
}

/** Pure rendering: state is local accepted settings, not a replacement for native input drafts. */
export function settingsTemplate(state: SettingsState, refs: SettingsRefs, actions: SettingsActions, pending: readonly PendingFixtureRequest[], scenario: SettingsScenario = getSettingsScenario('explore')) {
	const dirty = !sameSettings(state.local, state.saved.settings);
	const commands = settingsCommands(state);
	const explore = scenario.id === 'explore';
	return html`
		<section ${ref(refs.root)} class="settings-workflow" data-workflow="settings" data-settings-scenario=${scenario.id} aria-label="Creative settings workflow">
			<header class="settings-intro">
				<h3 ${ref(refs.heading)} tabindex="-1">Creative output settings</h3>
				<p>Adjust the artwork, compare your changes, and save when ready.</p>
				<p class="settings-note">Interactive simulation: settings stay in this page. No file is generated and no real collaborator or server is connected.</p>
				${explore ? nothing : html`<nav class="settings-review-jumps" aria-label="In this scenario">
					<a href="#settings-demo">Demo</a>
					<a href="#scenario-steps">Steps</a>
					<a href="#scenario-controls">Scenario controls</a>
				</nav>`}
			</header>
			<div class="settings-review-layout" ?data-guided=${!explore}>
			${explore ? nothing : html`<div class="settings-review-instructions">${scenarioGuide(scenario, state, actions, pending)}</div>`}
			<div class="settings-review-demo" id="settings-demo" tabindex="-1">
			${explore ? projectOutline() : nothing}
			<div class="settings-workbench">
				<form ${ref(refs.form)} class="settings-fields" aria-label="Creative output settings" @submit=${actions.submit}>
					<en-slider ${ref(refs.opacity)} name="opacity" label="Layer opacity" min="0" max="100" step="1"
						.value=${state.local.opacity} editable
						description="Use the range or enter an exact percentage. Enter or leave the editor to apply; Escape restores the accepted value."
						@en-change=${actions.opacity}></en-slider>
					<en-toolbar id="settings-output-controls" label="Output controls" keyboard-navigation="tab">
						<en-select ${ref(refs.format)} name="format" label="Output format"
							.value=${state.local.format} @en-change=${actions.format}>
							<en-select-option value="png">PNG</en-select-option>
							<en-select-option value="svg">SVG</en-select-option>
						</en-select>
						<en-checkbox ${ref(refs.background)} name="background" .checked=${state.local.background}
							@en-change=${actions.background}>Include background</en-checkbox>
						<en-button variant="secondary" @click=${actions.restoreOutput}>Restore saved output</en-button>
					</en-toolbar>
					<en-segmented-control ${ref(refs.layout)} name="layout" label="Preview layout"
						.value=${state.local.layout} @en-change=${actions.layout}>
						<en-segmented-item value="portrait">Portrait</en-segmented-item>
						<en-segmented-item value="landscape">Landscape</en-segmented-item>
					</en-segmented-control>
					<div class="settings-command-area">
						<div class="settings-command-guidance">
							<en-toolbar id="settings-command-toolbar" label="Settings actions">
								<en-button id="settings-save-trigger" ${ref(refs.save)} data-action="settings-save" @click=${actions.save}>${state.phase === 'saving' ? 'Saving settings…' : state.phase === 'failed' ? 'Retry save' : 'Save settings'}</en-button>
								<en-button id="settings-restore-trigger" variant="secondary" @click=${actions.restoreOpacity}>Restore saved opacity</en-button>
							</en-toolbar>
							<en-tooltip for="settings-save-trigger" warmup-group="settings-command-toolbar">
								<span slot="content">Save the current preview settings in this local simulation.</span>
							</en-tooltip>
							<en-tooltip for="settings-restore-trigger" warmup-group="settings-command-toolbar">
								<span slot="content">Restore saved opacity while keeping your other local changes.</span>
							</en-tooltip>
						</div>
						<div class="settings-actions">
							<en-button id="settings-menu-trigger" variant="secondary">More settings actions<en-icon slot="suffix" name="chevron-down" size="inherit"></en-icon></en-button>
							<en-button ${ref(refs.commandTrigger)} id="settings-command-trigger" variant="secondary" @click=${actions.openCommands} @pointerenter=${actions.preloadCommands} @focusin=${actions.preloadCommands} aria-busy="false" aria-describedby="settings-command-status">Search commands</en-button>
							${state.phase === 'saving' ? html`<en-button variant="secondary" @click=${actions.cancelSave}>Cancel save</en-button>` : nothing}
						</div>
						<p class="settings-note">${state.incoming ? 'Review the incoming opacity before saving.' : state.phase === 'saving' ? 'A save is pending. Keep editing or use Cancel save to stop waiting.' : 'The menu offers preview choices and the same actions as command search.'}</p>
						<en-menu ${ref(refs.menu)} id="settings-command-menu" for="settings-menu-trigger" label="Settings actions" @en-action=${actions.surfaceCommand}>
							<en-menu-item type="checkbox" .checked=${state.local.background} @en-change=${actions.background}>Include background</en-menu-item>
							<hr role="separator">
							<en-menu-item id="settings-layout-menu-trigger">Preview layout</en-menu-item>
							<en-menu for="settings-layout-menu-trigger" label="Preview layout">
								<en-menu-item type="radio" name="settings-menu-layout" data-layout="portrait" .checked=${state.local.layout === 'portrait'} @en-change=${actions.menuLayout}>Portrait</en-menu-item>
								<en-menu-item type="radio" name="settings-menu-layout" data-layout="landscape" .checked=${state.local.layout === 'landscape'} @en-change=${actions.menuLayout}>Landscape</en-menu-item>
							</en-menu>
							<hr role="separator">
							${commands.map(command => html`<en-menu-item action=${command.action} .disabled=${command.disabled}>${command.label}</en-menu-item>`)}
						</en-menu>
						<p ${ref(refs.commandStatus)} id="settings-command-status" role="status" aria-atomic="true"></p>
						<en-command-palette ${ref(refs.palette)} id="settings-command-palette" for="settings-command-trigger" label="Settings commands"
							.searchLabel=${'Find a settings command'} placeholder="Try save, opacity or collaborator"
							.emptyText=${'No matching settings commands.'} .closeLabel=${'Close settings commands'}
							.commands=${guard([state.phase === 'failed', state.phase === 'saving', Boolean(state.incoming)], () => commands)} @en-action=${actions.surfaceCommand}></en-command-palette>
					</div>
					${explore ? html`<div class="settings-actions"><en-button variant="secondary" @click=${actions.reset}>Reset settings demo</en-button></div>` : nothing}
					<p class="settings-state" data-settings-dirty>${dirty ? 'Unsaved local changes' : 'Preview matches saved settings'}</p>
				</form>
				<div class="settings-preview-column">
					<figure class="settings-preview">
						<div class="settings-artboard" data-layout=${state.local.layout} data-background=${String(state.local.background)}>
							<div class="settings-artwork" aria-hidden="true" style=${styleMap({ opacity: String(state.local.opacity / 100) })}>
								<span class="settings-orbit"></span><span class="settings-tile"></span><span class="settings-stripe"></span>
							</div>
						</div>
						<figcaption><strong>Studio study</strong><span>${state.local.format.toUpperCase()} settings preview</span></figcaption>
					</figure>
					<div class="settings-snapshot"><h4>Current local settings</h4><p data-settings-current>${settingsSummary(state.local)}</p></div>
					<div class="settings-snapshot"><h4>Saved snapshot · revision ${state.saved.revision}</h4><p data-settings-saved>${settingsSummary(state.saved.settings)}</p></div>
				</div>
			</div>
			<en-toast-region data-settings-notifications label="Settings notifications"></en-toast-region>
			${state.incoming ? html`<section class="settings-incoming" aria-label="Incoming opacity change">
				<h4 ${ref(refs.incomingHeading)} tabindex="-1">A collaborator changed opacity</h4>
				<p>Incoming revision ${state.incoming.revision}: ${state.incoming.settings.opacity}% opacity. Your current preview opacity is ${state.local.opacity}%. Your other local settings stay as they are.</p>
				<p class="settings-note">Keep preserves any unfinished opacity entry. Use replaces that entry with the incoming value.</p>
				<div class="settings-actions">
					<en-button variant="secondary" @click=${actions.keepLocal}>Keep my opacity</en-button>
					<en-button @click=${actions.useIncoming}>Use updated opacity</en-button>
				</div>
			</section>` : nothing}
			<p class="settings-status" role="status" aria-atomic="true" data-settings-status>${state.status}</p>
			</div>
			</div>
			${explore ? html`<details class="settings-command-help">
				<summary>Command access and keyboard shortcut</summary>
				<p>Use the toolbar for frequent actions, More settings actions to browse, or Search commands to find the same action by name. Escape closes a command surface without running an action.</p>
				${shortcutControl(state, actions)}
			</details>
			<details class="settings-qa">
				<summary>Settings simulation controls</summary>
				<p>Choose a response, make a change, then save. Queue an incoming opacity update to review collaboration without replacing your draft.</p>
				<div class="settings-qa-fields">
					${saveResultControl(state, actions)}
					${deliveryControl(state, actions)}
				</div>
				<div class="settings-actions">
					${queueIncomingControl(actions)}
					${deliverControl(actions, pending)}
				</div>
				${pendingSummary(state, pending)}
				<ol class="settings-checklist">
					<li>Change opacity and format. Use Restore saved opacity from the toolbar, menu and command search in turn: each restores only opacity.</li>
					<li>Search for an unknown command, clear it, then Escape. Discovery must preserve your settings and unfinished entry.</li>
					<li>Enter 101, search for Save settings and activate it. After the palette closes, the exact editor receives the error and focus; no save starts.</li>
					<li>Choose Fail next save, save, then Retry save. Your changes survive the failure.</li>
					<li>Hold a save and change another setting. Deliver saves only the captured snapshot; Cancel save keeps your local work.</li>
					<li>Choose After 1.2 seconds, queue an update and open command search. Arrival preserves search focus and changes command availability. Review incoming change reaches the existing review; Keep preserves an unfinished opacity entry.</li>
					<li>Try the visible menu and search buttons at phone width, then enable and disable the optional shortcut. Reset closes surfaces, removes the shortcut and cancels pending responses.</li>
				</ol>
			</details>` : nothing}
		</section>
	`;
}
