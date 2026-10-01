import { afterAcceptedChange } from '../../change-consumption.js';
import type { TemplateResult } from 'lit';
import type { EnTextField } from '@en-reve/elements/text-field.js';
import type { EnRadioGroup } from '@en-reve/elements/radio-group.js';
import type { WorkflowOptions } from '../shared/workflow.js';
import { createSSOModel, type AccountField, type FieldProblem } from './model.js';
import { providers, type Scenario, type Timing } from './service.js';
import { ssoTemplate, type SSOActions } from './template.js';
import { ssoStyles } from './styles.js';

export { ssoStyles } from './styles.js';

type Field = EnTextField | EnRadioGroup;
type FocusIntent = 'heading' | 'summary' | 'continue';

/**
 * Consuming application recipe. Register en-text-field, en-radio-group, en-radio,
 * en-button, en-card and en-select before client rendering. No global registration
 * or DOM access occurs here; the documentation host owns selective registration.
 */
export function createSSOWorkflow(options: WorkflowOptions) {
	let root: HTMLElement | undefined;
	let disposed = false;
	let focusIntent: FocusIntent | undefined;
	let focusRevision = 0;
	let submitting = false;
	let problems: FieldProblem[] | undefined;
	const composing = new WeakSet<EventTarget>();
	const focusNext = (intent: FocusIntent): void => { focusIntent = intent; ++focusRevision; };
	const model = createSSOModel(options.requestUpdate, () => focusNext('heading'));

	const showProblems = (): void => {
		const current = problems ?? [];
		problems = undefined;
		if (!current.length || disposed) return;
		focusNext('summary');
		model.showValidation(current);
	};

	const requestForm = async (form: HTMLFormElement | null): Promise<void> => {
		if (!form || disposed || submitting || model.read().status === 'pending') return;
		submitting = true;
		try {
			// Let public field constraints/accepted FormData settle before native validation.
			await Promise.all([...form.querySelectorAll<Field>('en-text-field,en-radio-group')].map(field => field.updateComplete));
			if (disposed || !form.isConnected) return;
			problems = [];
			form.requestSubmit();
			showProblems();
		} finally { submitting = false; }
	};

	const actions: SSOActions = {
		attach(element) {
			if (!element) return;
			root = element as HTMLElement;
			const intent = focusIntent;
			if (!intent) return;
			focusIntent = undefined;
			const revision = focusRevision;
			const mounted = root;
			// ref runs during Lit's commit; await child updates before using public focus().
			queueMicrotask(async () => {
				await Promise.all([...mounted.querySelectorAll<Field>('en-text-field,en-radio-group,en-button')].map(field => field.updateComplete));
				if (disposed || revision !== focusRevision || !mounted.isConnected) return;
				const selector = intent === 'summary' ? '[data-sso-validation]' : intent === 'continue' ? '[data-sso-continue]' : '[data-sso-heading]';
				mounted.querySelector<HTMLElement>(selector)?.focus();
			});
		},
		requestSubmit(event) {
			if (event.defaultPrevented) return;
			void requestForm((event.currentTarget as HTMLElement).closest('form'));
		},
		invalid(event) {
			// Cancel presentation, not validation: requestSubmit still blocks the invalid form.
			event.preventDefault();
			const field = event.currentTarget as Field;
			if (!field.closest('form[data-sso-form]')) return;
			const name = field.name as AccountField | 'provider';
			const problem = { field: name, label: field.label, message: field.validationMessage };
			if (!problems) {
				problems = [];
				// Also support an application's direct call to the native form.requestSubmit().
				queueMicrotask(showProblems);
			}
			if (!problems.some(error => error.field === name)) problems.push(problem);
		},
		fieldKeydown(event) {
			// Only explicitly named single-line editors get this bridge. Native button
			// Enter/Space and radio navigation keep their own semantics and are not intercepted.
			if (event.key !== 'Enter' || event.defaultPrevented || event.isComposing || event.repeat
				|| event.keyCode === 229 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey
				|| !event.currentTarget || composing.has(event.currentTarget)) return;
			event.preventDefault();
			void requestForm((event.currentTarget as HTMLElement).closest('form'));
		},
		compositionStart(event) { if (event.currentTarget) composing.add(event.currentTarget); },
		compositionEnd(event) { if (event.currentTarget) composing.delete(event.currentTarget); },
		accountChange(event) {
			afterAcceptedChange(event, (field: EnTextField) => field.value, (value, field) => {
				if (!disposed && (field.name === 'workspace' || field.name === 'email')) model.editAccount(field.name, value);
			});
		},
		providerChange(event) {
			afterAcceptedChange(event, (field: EnRadioGroup) => field.value, value => {
				const provider = providers.find(provider => provider.value === value);
				if (!disposed && provider) model.chooseProvider(provider.value);
			});
		},
		submitAccount(event) {
			event.preventDefault();
			const form = event.currentTarget as HTMLFormElement;
			const data = new FormData(form);
			model.advanceAccount(String(data.get('workspace') ?? ''), String(data.get('email') ?? ''));
		},
		submitProvider(event) { event.preventDefault(); void model.continue(); },
		focusField(event) {
			event.preventDefault();
			const name = (event.currentTarget as HTMLElement).dataset.field;
			if (name === 'workspace' || name === 'email' || name === 'provider') root?.querySelector<Field>(`#sso-${name}`)?.focus();
		},
		back() { model.back(); },
		cancel() { if (model.read().status !== 'pending') return; focusNext('continue'); model.cancel(); },
		reset() { problems = undefined; model.reset(); },
		setScenario(event) {
			afterAcceptedChange(event, (field: HTMLElement & { value: string }) => field.value, value => {
				if (!disposed && ['success', 'reject-once', 'denied', 'expired'].includes(value)) model.setScenario(value as Scenario);
			});
		},
		setTiming(event) {
			afterAcceptedChange(event, (field: HTMLElement & { value: string }) => field.value, value => {
				if (!disposed && ['immediate', 'delayed', 'held'].includes(value)) model.setTiming(value as Timing);
			});
		},
		release(id) { model.release(id); },
	};

	return {
		styles: ssoStyles,
		render(): TemplateResult { return ssoTemplate({ ...model.read(), fixtures: model.pendingFixtures, attempts: model.attempts }, actions); },
		reset: actions.reset,
		dispose(): void { disposed = true; ++focusRevision; root = undefined; model.dispose(); },
	};
}
