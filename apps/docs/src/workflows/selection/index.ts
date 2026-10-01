import { afterAcceptedChange } from '../../change-consumption.js';
import { createRef } from 'lit/directives/ref.js';
import type { WorkflowOptions } from '../shared/workflow.js';
import { createSelectionState, projectItems } from './model.js';
import { selectionTemplate, type SelectionActions, type SelectionRefs, type ProjectField } from './template.js';
export { selectionStyles } from './styles.js';

/** SSR-safe construction; form reads happen only after an explicit submit. */
export function createSelectionWorkflow({ requestUpdate }: WorkflowOptions) {
	let state = createSelectionState();
	let disposed = false;
	let validationGeneration = 0;
	const refs: SelectionRefs = { form: createRef<HTMLFormElement>(), project: createRef<ProjectField>() };
	const update = (): void => { if (!disposed) requestUpdate(); };
	const reset = (): void => {
		if (disposed) return;
		++validationGeneration;
		state = { ...createSelectionState(), status: 'Selection reset. The initial project is selected and the submission receipt is clear.' };
		// An explicit same-value author write also clears an unfinished native query.
		if (refs.project.value) refs.project.value.value = state.acceptedId;
		update();
	};
	const actions: SelectionActions = {
		invalid(event) {
			const field = event.currentTarget as ProjectField;
			if (event.target !== field) return;
			// Keep native validity and submission blocking, while presenting the existing
			// associated inline error and using the component's public focus API.
			// Firefox cannot reliably focus a FACE host from its native reporting path.
			event.preventDefault();
			const generation = ++validationGeneration;
			void field.updateComplete.then(() => {
				if (!disposed && generation === validationGeneration && refs.project.value === field
					&& field.isConnected && field.validity?.valid === false) field.focus();
			});
		},
		change(event) {
			afterAcceptedChange(event, (field: ProjectField) => field.value, acceptedId => {
				if (disposed) return;
				state = { ...state, acceptedId, status: '' };
				update();
			});
		},
		requestSubmit() {
			if (disposed || !refs.project.value?.reportValidity()) return;
			// en-button has type=button. Keep real native form validation/submission explicit.
			refs.form.value?.requestSubmit();
		},
		submit(event) {
			event.preventDefault();
			if (disposed || !refs.project.value?.reportValidity()) return;
			const form = event.currentTarget as HTMLFormElement;
			const id = new FormData(form).get('project');
			const item = projectItems.find(project => project.value === id);
			if (!item || ('disabled' in item && item.disabled)) return;
			const sequence = (state.submission?.sequence ?? 0) + 1;
			state = { ...state, submission: { sequence, id: item.value, label: item.label },
				status: `Assignment ${sequence} recorded locally for ${item.label}.` };
			update();
		},
	};
	return {
		render: () => selectionTemplate(state, refs, actions),
		reset,
		dispose() { disposed = true; ++validationGeneration; },
	};
}
