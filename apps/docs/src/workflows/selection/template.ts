import { html } from 'lit';
import { ref, type Ref } from 'lit/directives/ref.js';
import { projectItems, type SelectionState } from './model.js';

export interface ProjectField extends HTMLElement {
	value: string;
	readonly updateComplete: Promise<boolean>;
	readonly validity: ValidityState | undefined;
	reportValidity(): boolean;
}
export interface SelectionRefs { form: Ref<HTMLFormElement>; project: Ref<ProjectField>; }
export interface SelectionActions {
	invalid(event: Event): void;
	change(event: Event): void;
	requestSubmit(): void;
	submit(event: SubmitEvent): void;
}

/** The application observes accepted IDs. Query text stays in the combobox's native editor. */
export function selectionTemplate(state: SelectionState, refs: SelectionRefs, actions: SelectionActions) {
	const accepted = projectItems.find(item => item.value === state.acceptedId);
	return html`
		<section class="selection-workflow" data-workflow="selection" aria-label="Project selection workflow">
			<header class="selection-intro">
				<h3>Assign a campaign brief</h3>
				<p>Review the brief, choose its project, then confirm the assignment.</p>
				<p class="selection-note">Scroll inside the brief to reach the project field. The catalog contains 40 projects, including three unavailable projects.</p>
			</header>
			<section class="selection-scrollport" aria-label="Campaign brief and project assignment" tabindex="0">
				<form ${ref(refs.form)} class="selection-form" aria-label="Assign campaign brief" @submit=${actions.submit}>
					<div class="selection-brief">
						<header><p class="selection-note">Campaign brief</p><h4>Autumn campaign</h4></header>
						<p>Create a small collection of editorial images and launch materials that can be adapted by each studio. Keep the visual direction consistent while leaving room for local stories.</p>
						<dl class="selection-brief-facts">
							<div><dt>Audience</dt><dd>New and returning community members</dd></div>
							<div><dt>Deliverables</dt><dd>Cover artwork, an editorial layout, and social templates</dd></div>
							<div><dt>Review</dt><dd>Share a first study with the project team</dd></div>
						</dl>
						<div><h4>Before the first review</h4><p>Keep text editable, describe image choices, and include a narrow-screen layout. The selected project will collect the brief with its related work.</p></div>
					</div>
					<div class="selection-fields">
						<en-combobox ${ref(refs.project)} name="project" label="Project" required
							.items=${projectItems} .value=${state.acceptedId}
							description="Type to filter, then choose a project. Typing alone does not change the assignment."
							@en-change=${actions.change} @invalid=${actions.invalid}></en-combobox>
						<div class="selection-actions"><en-button @click=${actions.requestSubmit}>Assign brief</en-button></div>
					</div>
				</form>
			</section>
			<div class="selection-receipt">
				<h4>Accepted project</h4>
				<p data-selection-accepted>${accepted?.label ?? 'No project selected'} · <code>${state.acceptedId || 'No accepted ID'}</code></p>
				<h4>Last submitted assignment</h4>
				<p data-selection-submission>${state.submission
					? html`Submission ${state.submission.sequence}: ${state.submission.label} · <code>project=${state.submission.id}</code>`
					: 'No assignment submitted.'}</p>
				<p class="selection-note">This local receipt reads the native form data. No project or server is changed.</p>
			</div>
			<p class="selection-status" role="status" aria-atomic="true" data-selection-status>${state.status}</p>
			<details class="selection-qa">
				<summary>Phone and tablet review</summary>
				<ol>
					<li>Scroll to Project, open the full list, and swipe through the results with the software keyboard visible. Choose Willow · Year in review near the end, then Assign brief. The receipt should contain <code>project-40</code>.</li>
					<li>Type <q>Studio</q>. Scroll the brief or page with the keyboard open, then try portrait and landscape. Your query and accepted project should survive a temporary lack of popup space; restoring space must not select a project.</li>
					<li>With the Project field focused and the keyboard open, scroll the main page, then delete a character. Repeat after scrolling inside Campaign brief. Results should stay beside the field, never cover it or become detached. If space temporarily disappears, tapping Show options should preserve your text and retry.</li>
					<li>Dismiss the list with its trigger, Escape, Tab, or an outside action. If results temporarily disappear for lack of space, also try Escape before restoring space. The dismissed list should stay closed; no floating selection marker should remain. Reopen it when you want to continue.</li>
					<li>Try an unavailable project, a search with no matches, and the long Lumen label. Dismiss the unfinished search and confirm that the accepted project is restored. Reset below should restore the initial project and clear the receipt.</li>
					<li>Repeat with your usual screen reader or hardware keyboard. Can you find the field, distinguish the active result from the accepted project, choose a result, and tell what was submitted?</li>
				</ol>
				<p class="selection-note">Use Reading direction, Density, and Theme above for alternate layouts. For device feedback, record device/OS, browser, keyboard or assistive technology, the action, expected and observed result, and its impact. Browser emulation does not establish physical iPhone, iPad, Android, VoiceOver, or TalkBack behavior.</p>
			</details>
		</section>
	`;
}
