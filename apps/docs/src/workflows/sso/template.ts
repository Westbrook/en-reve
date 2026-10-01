import { html, nothing, type TemplateResult } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import { ref } from 'lit/directives/ref.js';
import type { PendingFixtureRequest } from '../shared/fixture-scheduler.js';
import type { SSOState } from './model.js';
import { providers } from './service.js';

export interface SSOActions {
	attach(element?: Element): void;
	submitAccount(event: SubmitEvent): void;
	submitProvider(event: SubmitEvent): void;
	requestSubmit(event: Event): void;
	invalid(event: Event): void;
	fieldKeydown(event: KeyboardEvent): void;
	compositionStart(event: CompositionEvent): void;
	compositionEnd(event: CompositionEvent): void;
	accountChange(event: Event): void;
	providerChange(event: Event): void;
	focusField(event: Event): void;
	back(): void;
	cancel(): void;
	reset(): void;
	setScenario(event: Event): void;
	setTiming(event: Event): void;
	release(id: number): void;
}
export interface SSOView extends SSOState {
	readonly fixtures: readonly PendingFixtureRequest[];
	readonly attempts: number;
}

function validationSummary(view: SSOView, actions: SSOActions) {
	return view.errors.length ? html`
		<section class="sso-validation" tabindex="-1" aria-labelledby="sso-errors-title" data-sso-validation>
			<h4 id="sso-errors-title">Check your details</h4>
			<ul>${view.errors.map(error => html`<li><a href=${`#sso-${error.field}`} data-field=${error.field} @click=${actions.focusField}>${error.label}: ${error.message}</a></li>`)}</ul>
		</section>` : nothing;
}

function account(view: SSOView, actions: SSOActions) {
	return html`
		<h3 id="sso-step-title" tabindex="-1" data-sso-heading>Your account and workspace</h3>
		<p>Use a fictional email, such as <code>alex@example.test</code>, and a workspace such as Studio North.</p>
		${validationSummary(view, actions)}
		<form class="sso-form" data-sso-form="account" @submit=${actions.submitAccount}>
			<en-text-field id="sso-workspace" name="workspace" label="Workspace" required
				pattern=".*\\S.*" description="Enter the name of your example workspace."
				autocomplete="organization" .value=${view.workspace}
				@en-change=${actions.accountChange} @invalid=${actions.invalid}
				@keydown=${actions.fieldKeydown} @compositionstart=${actions.compositionStart} @compositionend=${actions.compositionEnd}></en-text-field>
			<en-text-field id="sso-email" name="email" label="Work email" type="email" required
				pattern=".+@.+[.].+" description="Use a complete email address, such as alex@example.test."
				autocomplete="username" .value=${view.email}
				@en-change=${actions.accountChange} @invalid=${actions.invalid}
				@keydown=${actions.fieldKeydown} @compositionstart=${actions.compositionStart} @compositionend=${actions.compositionEnd}></en-text-field>
			<div class="sso-actions"><en-button @click=${actions.requestSubmit}>Continue</en-button></div>
		</form>`;
}

function provider(view: SSOView, actions: SSOActions) {
	const pending = view.status === 'pending';
	return html`
		<h3 id="sso-step-title" tabindex="-1" data-sso-heading>Choose your sign-in provider</h3>
		<dl class="sso-context"><div><dt>Workspace</dt><dd>${view.workspace}</dd></div><div><dt>Account</dt><dd>${view.email}</dd></div></dl>
		${validationSummary(view, actions)}
		<form class="sso-form" data-sso-form="provider" @submit=${actions.submitProvider}>
			<en-radio-group id="sso-provider" name="provider" label="Sign-in provider" required
				description="These providers are fictional." .value=${view.provider} ?disabled=${pending}
				@en-change=${actions.providerChange} @invalid=${actions.invalid}>
				${providers.map(provider => html`<en-radio value=${provider.value}>${provider.label}</en-radio>`)}
			</en-radio-group>
			<div class="sso-actions">
				<en-button variant="secondary" @click=${actions.back}>Back</en-button>
				<en-button data-sso-continue @click=${actions.requestSubmit}>${view.status === 'rejected' ? 'Retry' : 'Continue'}</en-button>
				<en-button variant="ghost" ?hidden=${!pending} @click=${actions.cancel}>Cancel sign-in</en-button>
			</div>
		</form>`;
}

function complete(view: SSOView, actions: SSOActions) {
	const receipt = view.receipt;
	return html`
		<h3 id="sso-step-title" tabindex="-1" data-sso-heading>Example sign-in complete</h3>
		<p>You completed the example for <strong>${receipt?.workspace}</strong>.</p>
		<dl class="sso-context"><div><dt>Account</dt><dd>${receipt?.email}</dd></div>
			<div><dt>Provider</dt><dd>${providers.find(provider => provider.value === receipt?.provider)?.label}</dd></div></dl>
		<en-button @click=${actions.reset}>Start again</en-button>`;
}

/** Pure markup: application behavior is supplied by index.ts and model.ts. */
export function ssoTemplate(view: SSOView, actions: SSOActions): TemplateResult {
	return html`
		<div class="sso-workflow" data-sso-workflow ${ref(element => actions.attach(element))}>
			<p class="sso-disclosure">Simulation: this example uses local outcomes, sends no credentials, and creates no authenticated session.</p>
			<ol class="sso-steps" aria-label="Sign-in steps">
				<li aria-current=${view.step === 'account' ? 'step' : nothing}>1. Account</li>
				<li aria-current=${view.step === 'provider' ? 'step' : nothing}>2. Provider</li>
				<li aria-current=${view.step === 'complete' ? 'step' : nothing}>3. Complete</li>
			</ol>
			<en-card class="sso-task">
				${keyed(view.run, view.step === 'account' ? account(view, actions) : view.step === 'provider' ? provider(view, actions) : complete(view, actions))}
				<p class="sso-status" data-state=${view.status} role="status" aria-live="polite" aria-atomic="true">${view.announcement}</p>
			</en-card>
			<details class="sso-scenarios">
				<summary>Scenario controls for sign-in</summary>
				<p>Configure the next attempt. Held responses ignore cancellation to test late-result protection.</p>
				<div class="sso-fixture-fields">
					<en-select label="Sign-in outcome" .value=${view.scenario} .items=${[
						{ value: 'reject-once', label: 'Reject once, then succeed' }, { value: 'success', label: 'Succeed' },
						{ value: 'denied', label: 'Always decline' }, { value: 'expired', label: 'Always expire' },
					]} @en-change=${actions.setScenario}></en-select>
					<en-select label="Sign-in response timing" .value=${view.timing} .items=${[
						{ value: 'immediate', label: 'Immediate' }, { value: 'delayed', label: 'Delay 700 milliseconds' }, { value: 'held', label: 'Hold until released' },
					]} @en-change=${actions.setTiming}></en-select>
				</div>
				<p>Attempts in this sequence: <output data-sso-attempts>${view.attempts}</output>.</p>
				<ul class="sso-pending-list">${view.fixtures.filter(request => request.delivery === 'held').map(request => html`
					<li><span>${request.action}</span><en-button variant="secondary" size="small" @click=${() => actions.release(request.id)}>Release response ${request.id}</en-button></li>`)}
				</ul>
				<en-button variant="secondary" @click=${actions.reset}>Reset sign-in scenario</en-button>
				<p class="sso-review">Try invalid details and follow an error link; go Back; retry a rejection. Hold a result, Cancel or Reset, then release it: your current step and values should remain.</p>
			</details>
		</div>`;
}
