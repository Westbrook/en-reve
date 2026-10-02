import{t as e}from"./rolldown-runtime-B0lUwjiP.js";var t;function n(){return(n=e((()=>{t=`import '@en-reve/elements/define/alert.js';
import '@en-reve/elements/define/button.js';
import '@en-reve/elements/define/checkbox.js';
import '@en-reve/elements/define/date-picker.js';
import '@en-reve/elements/define/progress-step.js';
import '@en-reve/elements/define/progress-steps.js';
import '@en-reve/elements/define/text-field.js';
import '@en-reve/elements/define/validation-summary.js';
import { parseDate } from '@en-reve/primitives/interactions/calendar.js';
import { html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { AsyncDirective, directive } from 'lit/async-directive.js';
import { ref } from 'lit/directives/ref.js';
import type { EnProgressSteps, ProgressStep } from '@en-reve/elements/progress-steps.js';
import type { ValidationIssue } from '@en-reve/elements/validation-summary.js';

type Field = HTMLElement & { value: string; checked: boolean; updateComplete: Promise<unknown> };
const stepKeys = ['details', 'delivery', 'review'] as const;
type Step = typeof stepKeys[number];
/** Consuming application owns drafts, validation, panel state, focus and simulated transport. */
class MultiStepDemo extends AsyncDirective {
	private root?: HTMLElement;
	private key: unknown;
	private step: Step = 'details';
	private visited = new Set<Step>(['details']);
	private completed = new Set<Step>();
	private values = { title: '', email: '', date: '2026-09-18' };
	private issues: ValidationIssue[] = [];
	private status: 'editing' | 'saving' | 'failed' | 'complete' = 'editing';
	private failSave = true;
	private decline = false;
	private childContent = true;
	private epoch = 0;
	private refresh() { this.setValue(this.render(this.key)); }
	private focus(selector: string) {
		const epoch = this.epoch;
		queueMicrotask(async () => {
			if (!this.isConnected || epoch !== this.epoch) return;
			const target = this.root?.querySelector<HTMLElement & { updateComplete?: Promise<unknown> }>(selector);
			await target?.updateComplete;
			if (this.isConnected && epoch === this.epoch && target?.isConnected) target.focus();
		});
	}
	private validate(step: Step): ValidationIssue[] {
		if (step === 'details') return [
			...(!this.values.title.trim() ? [{ target: 'brief-title', message: 'Enter a project name.' }] : []),
			...(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(this.values.email) ? [{ target: 'brief-email', message: 'Enter an email address with a domain, such as name@example.com.' }] : []),
		];
		if (step === 'delivery' && (!parseDate(this.values.date) || this.values.date < '2026-09-14' || this.values.date > '2026-10-30')) return [{ target: 'brief-date', message: 'Choose a review date from September 14 through October 30, 2026.' }];
		return [];
	}
	private error(id: string) { return this.issues.find(issue => issue.target === id)?.message ?? ''; }
	private changed(event: Event, name: keyof MultiStepDemo['values']) {
		const field = event.currentTarget as Field;
		queueMicrotask(() => { if (!this.isConnected || event.defaultPrevented) return; this.values[name] = field.value; this.completed.delete(this.step); if (this.issues.length) this.issues = this.validate(this.step); this.status = 'editing'; this.refresh(); });
	}
	private move(next: Step) { this.step = next; this.visited.add(next); this.issues = []; this.status = 'editing'; this.refresh(); this.focus('[data-step-heading]'); }
	private navigation = (event: Event) => {
		const steps = event.currentTarget as EnProgressSteps;
		if (event.composedPath()[0] !== steps) return;
		const next = steps.value as Step;
		const problems = stepKeys.indexOf(next) > stepKeys.indexOf(this.step) ? this.validate(this.step) : [];
		if (this.decline || problems.length) {
			event.preventDefault();
			if (problems.length) { this.issues = problems; this.refresh(); this.focus('en-validation-summary'); }
			return;
		}
		queueMicrotask(() => { if (this.isConnected && !event.defaultPrevented) this.move(steps.value as Step); });
	};
	private submit = (event: Event) => {
		event.preventDefault(); if (this.status === 'saving' || this.status === 'complete') return;
		this.issues = this.validate(this.step);
		if (this.issues.length) { this.refresh(); this.focus('en-validation-summary'); return; }
		if (this.step !== 'review') { this.completed.add(this.step); this.move(stepKeys[stepKeys.indexOf(this.step) + 1]); return; }
		// Revalidate earlier steps, including edits made after visiting Review.
		for (const previous of ['details', 'delivery'] as const) {
			const issues = this.validate(previous);
			if (issues.length) { this.step = previous; this.issues = issues; this.refresh(); this.focus('en-validation-summary'); return; }
		}
		this.status = 'saving'; this.refresh(); const epoch = ++this.epoch;
		setTimeout(() => { if (!this.isConnected || epoch !== this.epoch) return; this.status = this.failSave ? 'failed' : 'complete'; if (this.status === 'complete') this.completed.add('review'); this.refresh(); this.focus(this.status === 'failed' ? '[data-save-error]' : '[data-step-heading]'); }, 450);
	};
	override disconnected() { ++this.epoch; if (this.status === 'saving') this.status = 'editing'; }
	render(key: unknown = 0) {
		if (key !== this.key) { this.key = key; ++this.epoch; this.step = 'details'; this.visited = new Set(['details']); this.completed = new Set(); this.values = { title: '', email: '', date: '2026-09-18' }; this.issues = []; this.status = 'editing'; this.failSave = true; this.decline = false; }
		const items: ProgressStep[] = stepKeys.map((value, index) => ({ value, label: ['Project details', 'Review date', 'Confirm brief'][index], disabled: !this.visited.has(value), status: value === this.step && this.issues.length ? 'error' : this.completed.has(value) && !this.validate(value).length ? 'complete' : 'pending' }));
		return html\`
			<section \${ref(element => { this.root = element as HTMLElement | undefined; })} data-multi-step style="display:grid;gap:var(--en-space-4);min-inline-size:0">
				<en-progress-steps id="brief-progress" label="Create a project brief" .items=\${items} .value=\${this.step} ?disabled=\${this.status === 'saving' || this.status === 'complete'} @en-change=\${this.navigation}>
					\${this.childContent ? repeat(items, item => item.value, item => html\`<en-progress-step value=\${item.value} label=\${item.label} status=\${item.status ?? 'pending'} ?disabled=\${item.disabled}><span>\${item.label}</span></en-progress-step>\`) : nothing}
				</en-progress-steps>
				<form novalidate @keydown=\${(event: KeyboardEvent) => { if (event.key === 'Enter' && !event.isComposing && event.composedPath().some(node => (node as HTMLElement).localName === 'en-text-field')) { event.preventDefault(); this.root?.querySelector('form')?.requestSubmit(); } }} @submit=\${this.submit} style="display:grid;gap:var(--en-space-4);min-inline-size:0">
					<en-validation-summary id="brief-errors" .items=\${this.issues}>\${this.childContent ? repeat(this.issues, issue => issue.target, issue => html\`<a href=\${\`#\${encodeURIComponent(issue.target)}\`}><span>\${issue.message}</span></a>\`) : nothing}</en-validation-summary>
					<h3 data-step-heading tabindex="-1" style="margin:0">\${this.status === 'complete' ? 'Project brief created' : \`Step \${stepKeys.indexOf(this.step) + 1} of 3: \${items.find(item => item.value === this.step)!.label}\`}</h3>
					<div ?hidden=\${this.step !== 'details' || this.status === 'complete'} style=\${\`display:\${this.step !== 'details' || this.status === 'complete' ? 'none' : 'grid'};gap:var(--en-space-3)\`}>
						<en-text-field id="brief-title" label="Project name" name="title" required .value=\${this.values.title} .error=\${this.error('brief-title')} ?disabled=\${this.step !== 'details'} @en-change=\${(event: Event) => this.changed(event, 'title')}></en-text-field>
						<en-text-field id="brief-email" label="Work email" type="email" name="email" required .value=\${this.values.email} .error=\${this.error('brief-email')} ?disabled=\${this.step !== 'details'} @en-change=\${(event: Event) => this.changed(event, 'email')} description="Use an address with a full domain, such as name@example.com."></en-text-field>
					</div>
					<div ?hidden=\${this.step !== 'delivery' || this.status === 'complete'}>
						<en-date-picker id="brief-date" label="Review date" name="date" required min="2026-09-14" max="2026-10-30" today="2026-09-14" .value=\${this.values.date} .error=\${this.error('brief-date')} ?disabled=\${this.step !== 'delivery'} @en-change=\${(event: Event) => this.changed(event, 'date')}></en-date-picker>
					</div>
					<div ?hidden=\${this.step !== 'review' || this.status === 'complete'}>
						<dl><dt>Project name</dt><dd>\${this.values.title}</dd><dt>Work email</dt><dd>\${this.values.email}</dd><dt>Review date</dt><dd>\${this.values.date}</dd></dl>
						<p>Return to an earlier step to make changes. Your entries are preserved.</p>
					</div>
					<div ?hidden=\${this.status !== 'failed'} data-save-error tabindex="-1"><en-alert variant="danger"><strong>The brief could not be saved.</strong> Simulated service failure. Your entries are preserved. Turn off “Simulate save failure” below and try again.</en-alert></div>
					<p role="status" aria-atomic="true" style="margin:0">\${this.status === 'saving' ? 'Saving your brief…' : this.status === 'complete' ? 'Saved in this demo only. No information was sent.' : ''}</p>
					<div style=\${\`display:\${this.status === 'complete' ? 'none' : 'flex'};flex-wrap:wrap;gap:var(--en-space-actions)\`} ?hidden=\${this.status === 'complete'}>
						<en-button variant="secondary" ?disabled=\${this.step === 'details' || this.status === 'saving'} @click=\${() => this.move(stepKeys[stepKeys.indexOf(this.step) - 1])}>Back</en-button>
						<en-button ?disabled=\${this.status === 'saving'} @click=\${() => this.root?.querySelector('form')?.requestSubmit()}>\${this.step !== 'review' ? 'Continue' : this.status === 'failed' ? 'Try again' : 'Create brief'}</en-button>
					</div>
				</form>
				<details><summary>Review scenarios</summary>
					<div style="display:grid;gap:var(--en-space-3);padding-block:var(--en-space-3)">
						<en-checkbox .checked=\${this.childContent} @en-change=\${(event: Event) => { const field = event.currentTarget as Field; queueMicrotask(() => { if (!event.defaultPrevented) { this.childContent = field.checked; this.refresh(); } }); }}>Author steps and errors with child content</en-checkbox>
						<en-checkbox .checked=\${this.failSave} @en-change=\${(event: Event) => { const field = event.currentTarget as Field; queueMicrotask(() => { if (!event.defaultPrevented) this.failSave = field.checked; }); }}>Simulate save failure</en-checkbox>
						<en-checkbox .checked=\${this.decline} @en-change=\${(event: Event) => { const field = event.currentTarget as Field; queueMicrotask(() => { if (!event.defaultPrevented) this.decline = field.checked; }); }}>Application declines step navigation</en-checkbox>
						<p>Submit empty fields to focus the summary, then follow each error link. Reach Confirm brief, return to edit, and try the failed-save recovery. Step buttons use ordinary Tab, Enter and Space; this is navigation, not a tab widget. Reset the example to start again.</p>
					</div>
				</details>
			</section>
		\`;
	}
}
const multiStepDemo = directive(MultiStepDemo);
export function multiStepExample(resetKey: unknown = 0) { return html\`\${multiStepDemo(resetKey)}\`; }`})))()}export{t as n,n as t};
//# sourceMappingURL=multi-step-source-BNP344V1.js.map