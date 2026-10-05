import{a as e,c as t,f as n,t as r}from"./lit-B8wTlSYy.js";import{n as i,t as a}from"./dist-gZqZ_ZdS.js";import{i as o,n as s,r as c,t as l}from"./workflows-app-CZZcNCr9.js";import{n as u}from"./change-consumption-C136yhHO.js";import{n as d,t as f}from"./keyed-C-o87CTE.js";import{i as p,t as m}from"./ref-Ds3XQudT.js";import{r as h,t as g}from"./fixture-scheduler-eTFnaOhr.js";import{r as _,t as v}from"./result-sdo9c9lA.js";import{t as y}from"./text-field-1kzE-n_W.js";import{t as b}from"./card--r4LNZ9L.js";import{t as x}from"./radio-X0ow06lQ.js";import{t as S}from"./radio-group-D293RUcc.js";import{t as C}from"./rolldown-runtime-B0lUwjiP.js";function w(){let e=g(),t=0;return{get pending(){return e.pending},get attempts(){return t},continue(n,r,i){let a=++t,o=i.scenario===`reject-once`?a===1?`denied`:`success`:i.scenario,s=i.timing===`delayed`?{kind:`delayed`,milliseconds:700}:{kind:i.timing},c=i.timing===`held`?new AbortController().signal:r.signal;return e.respond(()=>o===`denied`?v({kind:`denied`,message:`The example provider declined this attempt. Retry or choose the other provider.`}):o===`expired`?v({kind:`expired`,message:`The example sign-in window expired. Retry to begin a new attempt.`}):_({...n,attempt:a}),{action:`Sign-in attempt ${a} (request ${r.id})`,signal:c,delivery:s})},release(t){return e.release(t)},resetSequence(){t=0},dispose(){e.dispose()}}}var T;function E(){return(E=C((()=>{T=[{value:`studio`,label:`Studio identity`},{value:`partner`,label:`Partner identity`}]})))()}function D(e=0){return{step:`account`,workspace:``,email:``,provider:`studio`,status:`ready`,errors:[],announcement:``,scenario:`reject-once`,timing:`delayed`,run:e}}function O(e,t){let n=new a.State(D()),r=h(),i=w(),o=!1,s=t=>{o||(n.set({...n.get(),...t}),e())};return{read:()=>n.get(),get pendingFixtures(){return i.pending},get attempts(){return i.attempts},editAccount(e,t){n.get().step===`account`&&s({[e]:t,errors:n.get().errors.filter(t=>t.field!==e)})},chooseProvider(e){n.get().status!==`pending`&&s({provider:e,problem:void 0,status:`ready`,announcement:``,errors:[]})},showValidation(e){s({errors:e})},advanceAccount(e,r){n.get().step===`account`&&(t(),s({workspace:e,email:r,step:`provider`,errors:[],announcement:``}))},back(){r.cancel(),t(),s({step:`account`,status:`ready`,problem:void 0,errors:[],announcement:``,submitted:void 0})},cancel(){r.pending&&(r.cancel(),s({status:`ready`,submitted:void 0,announcement:`Sign-in canceled. Your account and provider are retained.`}))},async continue(){let e=n.get();if(o||e.step!==`provider`)return;let a=r.begin();if(!a)return;let c={workspace:e.workspace,email:e.email,provider:e.provider};s({status:`pending`,submitted:c,problem:void 0,errors:[],announcement:`Waiting for the example provider. You can cancel this attempt.`});try{let n=await i.continue(c,a,e);if(!a.isCurrent())return;n.ok?(t(),s({step:`complete`,status:`complete`,receipt:n.value,announcement:``})):s({status:`rejected`,problem:n.problem,announcement:n.problem.message})}catch{if(!a.isCurrent())return;let e=`The example could not complete this attempt. Your values are retained; try again.`;s({status:`rejected`,problem:{kind:`unexpected`,message:e},announcement:e})}finally{a.finish()}},setScenario(e){i.resetSequence(),s({scenario:e})},setTiming(e){s({timing:e})},release(t){i.release(t),e()},reset:()=>{o||(r.cancel(),i.resetSequence(),n.set(D(n.get().run+1)),t(),e())},dispose(){o=!0,r.dispose(),i.dispose()}}}function k(){return(k=C((()=>{i(),E()})))()}function A(e,r){return e.errors.length?n` <section class="sso-validation" tabindex="-1" aria-labelledby="sso-errors-title" data-sso-validation> <h4 id="sso-errors-title">Check your details</h4> <ul>${e.errors.map(e=>n`<li><a href=${`#sso-${e.field}`} data-field=${e.field} @click=${r.focusField}>${e.label}: ${e.message}</a></li>`)}</ul> </section>`:t}function j(e,t){return n` <h3 id="sso-step-title" tabindex="-1" data-sso-heading>Your account and workspace</h3> <p>Use a fictional email, such as <code>alex@example.test</code>, and a workspace such as Studio North.</p> ${A(e,t)} <form class="sso-form" data-sso-form="account" @submit=${t.submitAccount}> <en-text-field id="sso-workspace" name="workspace" label="Workspace" required pattern=".*\\S.*" description="Enter the name of your example workspace." autocomplete="organization" .value=${e.workspace} @en-change=${t.accountChange} @invalid=${t.invalid} @keydown=${t.fieldKeydown} @compositionstart=${t.compositionStart} @compositionend=${t.compositionEnd}></en-text-field> <en-text-field id="sso-email" name="email" label="Work email" type="email" required pattern=".+@.+[.].+" description="Use a complete email address, such as alex@example.test." autocomplete="username" .value=${e.email} @en-change=${t.accountChange} @invalid=${t.invalid} @keydown=${t.fieldKeydown} @compositionstart=${t.compositionStart} @compositionend=${t.compositionEnd}></en-text-field> <div class="sso-actions"><en-button @click=${t.requestSubmit}>Continue</en-button></div> </form>`}function M(e,t){let r=e.status===`pending`;return n` <h3 id="sso-step-title" tabindex="-1" data-sso-heading>Choose your sign-in provider</h3> <dl class="sso-context"><div><dt>Workspace</dt><dd>${e.workspace}</dd></div><div><dt>Account</dt><dd>${e.email}</dd></div></dl> ${A(e,t)} <form class="sso-form" data-sso-form="provider" @submit=${t.submitProvider}> <en-radio-group id="sso-provider" name="provider" label="Sign-in provider" required description="These providers are fictional." .value=${e.provider} ?disabled=${r} @en-change=${t.providerChange} @invalid=${t.invalid}> ${T.map(e=>n`<en-radio value=${e.value}>${e.label}</en-radio>`)} </en-radio-group> <div class="sso-actions"> <en-button variant="secondary" @click=${t.back}>Back</en-button> <en-button data-sso-continue @click=${t.requestSubmit}>${e.status===`rejected`?`Retry`:`Continue`}</en-button> <en-button variant="ghost" ?hidden=${!r} @click=${t.cancel}>Cancel sign-in</en-button> </div> </form>`}function N(e,t){let r=e.receipt;return n` <h3 id="sso-step-title" tabindex="-1" data-sso-heading>Example sign-in complete</h3> <p>You completed the example for <strong>${r?.workspace}</strong>.</p> <dl class="sso-context"><div><dt>Account</dt><dd>${r?.email}</dd></div> <div><dt>Provider</dt><dd>${T.find(e=>e.value===r?.provider)?.label}</dd></div></dl> <en-button @click=${t.reset}>Start again</en-button>`}function P(e,r){return n` <div class="sso-workflow" data-sso-workflow ${p(e=>r.attach(e))}> <p class="sso-disclosure">Simulation: this example uses local outcomes, sends no credentials, and creates no authenticated session.</p> <ol class="sso-steps" aria-label="Sign-in steps"> <li aria-current=${e.step===`account`?`step`:t}>1. Account</li> <li aria-current=${e.step===`provider`?`step`:t}>2. Provider</li> <li aria-current=${e.step===`complete`?`step`:t}>3. Complete</li> </ol> <en-card class="sso-task"> ${d(e.run,e.step===`account`?j(e,r):e.step===`provider`?M(e,r):N(e,r))} <p class="sso-status" data-state=${e.status} role="status" aria-live="polite" aria-atomic="true">${e.announcement}</p> </en-card> <details class="sso-scenarios"> <summary>Scenario controls for sign-in</summary> <p>Configure the next attempt. Held responses ignore cancellation to test late-result protection.</p> <div class="sso-fixture-fields"> <en-select label="Sign-in outcome" .value=${e.scenario} .items=${[{value:`reject-once`,label:`Reject once, then succeed`},{value:`success`,label:`Succeed`},{value:`denied`,label:`Always decline`},{value:`expired`,label:`Always expire`}]} @en-change=${r.setScenario}></en-select> <en-select label="Sign-in response timing" .value=${e.timing} .items=${[{value:`immediate`,label:`Immediate`},{value:`delayed`,label:`Delay 700 milliseconds`},{value:`held`,label:`Hold until released`}]} @en-change=${r.setTiming}></en-select> </div> <p>Attempts in this sequence: <output data-sso-attempts>${e.attempts}</output>.</p> <ul class="sso-pending-list">${e.fixtures.filter(e=>e.delivery===`held`).map(e=>n` <li><span>${e.action}</span><en-button variant="secondary" size="small" @click=${()=>r.release(e.id)}>Release response ${e.id}</en-button></li>`)} </ul> <en-button variant="secondary" @click=${r.reset}>Reset sign-in scenario</en-button> <p class="sso-review">Try invalid details and follow an error link; go Back; retry a rejection. Hold a result, Cancel or Reset, then release it: your current step and values should remain.</p> </details> </div>`}function F(){return(F=C((()=>{r(),f(),m(),E()})))()}var I;function L(){return(L=C((()=>{r(),I=e` .sso-workflow { display:grid; gap:var(--en-space-4); max-inline-size:var(--en-layout-article-max); min-inline-size:0; } .sso-workflow p { margin-block:0; } .sso-disclosure,.sso-review { color:var(--en-color-text-muted); font-size:var(--en-font-metadata-size); } .sso-steps { display:flex; flex-wrap:wrap; gap:var(--en-space-4); list-style:none; margin:0; padding:0; color:var(--en-color-text-muted); } .sso-steps [aria-current] { color:var(--en-color-text); font-weight:var(--en-font-label-strong-weight); } .sso-task { min-inline-size:0; } .sso-task h3 { margin-block:0 var(--en-space-3); } .sso-task p + .sso-form,.sso-context + .sso-form { margin-block-start:var(--en-space-5,var(--en-space-6)); } .sso-form { display:grid; gap:var(--en-space-4); } .sso-actions { display:flex; flex-wrap:wrap; align-items:center; gap:var(--en-space-3); } .sso-actions [hidden] { display:none; } .sso-context { display:grid; gap:var(--en-space-2); margin-block:var(--en-space-4); overflow-wrap:anywhere; } .sso-context > div { display:flex; flex-wrap:wrap; gap:var(--en-space-2) var(--en-space-4); } .sso-context dt { color:var(--en-color-text-muted); } .sso-context dd { margin:0; } .sso-status { min-block-size:2lh; margin-block-start:var(--en-space-4) !important; } .sso-status[data-state="rejected"] { color:var(--en-color-danger-text); } .sso-validation { border-inline-start:var(--en-focus-width) solid var(--en-color-danger-text); padding:var(--en-space-3); margin-block:var(--en-space-4); } .sso-validation h4 { margin:0; } .sso-validation ul { margin-block-end:0; padding-inline-start:var(--en-space-6); } .sso-validation a { color:var(--en-color-danger-text); } .sso-scenarios { border-block-start:var(--en-border-width) solid var(--en-color-line); padding-block-start:var(--en-space-4); } .sso-scenarios summary { cursor:pointer; font-weight:var(--en-font-label-strong-weight); } .sso-scenarios > :not(summary) { margin-block-start:var(--en-space-4); } .sso-fixture-fields { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,14rem),1fr)); gap:var(--en-space-4); } .sso-pending-list { display:grid; gap:var(--en-space-3); padding-inline-start:var(--en-space-5,var(--en-space-6)); } .sso-pending-list li { overflow-wrap:anywhere; } .sso-pending-list en-button { margin-inline-start:var(--en-space-2); } `})))()}function R(e){let t,n=!1,r,i=0,a=!1,o,s=new WeakSet,c=e=>{r=e,++i},l=O(e.requestUpdate,()=>c(`heading`)),d=()=>{let e=o??[];o=void 0,e.length&&!n&&(c(`summary`),l.showValidation(e))},f=async e=>{if(!(!e||n||a||l.read().status===`pending`)){a=!0;try{if(await Promise.all([...e.querySelectorAll(`en-text-field,en-radio-group`)].map(e=>e.updateComplete)),n||!e.isConnected)return;o=[],e.requestSubmit(),d()}finally{a=!1}}},p={attach(e){if(!e)return;t=e;let a=r;if(!a)return;r=void 0;let o=i,s=t;queueMicrotask(async()=>{if(await Promise.all([...s.querySelectorAll(`en-text-field,en-radio-group,en-button`)].map(e=>e.updateComplete)),n||o!==i||!s.isConnected)return;let e=a===`summary`?`[data-sso-validation]`:a===`continue`?`[data-sso-continue]`:`[data-sso-heading]`;s.querySelector(e)?.focus()})},requestSubmit(e){e.defaultPrevented||f(e.currentTarget.closest(`form`))},invalid(e){e.preventDefault();let t=e.currentTarget;if(!t.closest(`form[data-sso-form]`))return;let n=t.name,r={field:n,label:t.label,message:t.validationMessage};o||(o=[],queueMicrotask(d)),o.some(e=>e.field===n)||o.push(r)},fieldKeydown(e){e.key!==`Enter`||e.defaultPrevented||e.isComposing||e.repeat||e.keyCode===229||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||!e.currentTarget||s.has(e.currentTarget)||(e.preventDefault(),f(e.currentTarget.closest(`form`)))},compositionStart(e){e.currentTarget&&s.add(e.currentTarget)},compositionEnd(e){e.currentTarget&&s.delete(e.currentTarget)},accountChange(e){u(e,e=>e.value,(e,t)=>{!n&&(t.name===`workspace`||t.name===`email`)&&l.editAccount(t.name,e)})},providerChange(e){u(e,e=>e.value,e=>{let t=T.find(t=>t.value===e);!n&&t&&l.chooseProvider(t.value)})},submitAccount(e){e.preventDefault();let t=e.currentTarget,n=new FormData(t);l.advanceAccount(String(n.get(`workspace`)??``),String(n.get(`email`)??``))},submitProvider(e){e.preventDefault(),l.continue()},focusField(e){e.preventDefault();let n=e.currentTarget.dataset.field;(n===`workspace`||n===`email`||n===`provider`)&&t?.querySelector(`#sso-${n}`)?.focus()},back(){l.back()},cancel(){l.read().status===`pending`&&(c(`continue`),l.cancel())},reset(){o=void 0,l.reset()},setScenario(e){u(e,e=>e.value,e=>{!n&&[`success`,`reject-once`,`denied`,`expired`].includes(e)&&l.setScenario(e)})},setTiming(e){u(e,e=>e.value,e=>{!n&&[`immediate`,`delayed`,`held`].includes(e)&&l.setTiming(e)})},release(e){l.release(e)}};return{styles:I,render(){return P({...l.read(),fixtures:l.pendingFixtures,attempts:l.attempts},p)},reset:p.reset,dispose(){n=!0,++i,t=void 0,l.dispose()}}}function z(){return(z=C((()=>{k(),E(),F(),L()})))()}var B;function V(){return(V=C((()=>{B=`import { html, nothing, type TemplateResult } from 'lit';
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
	return view.errors.length ? html\`
		<section class="sso-validation" tabindex="-1" aria-labelledby="sso-errors-title" data-sso-validation>
			<h4 id="sso-errors-title">Check your details</h4>
			<ul>\${view.errors.map(error => html\`<li><a href=\${\`#sso-\${error.field}\`} data-field=\${error.field} @click=\${actions.focusField}>\${error.label}: \${error.message}</a></li>\`)}</ul>
		</section>\` : nothing;
}

function account(view: SSOView, actions: SSOActions) {
	return html\`
		<h3 id="sso-step-title" tabindex="-1" data-sso-heading>Your account and workspace</h3>
		<p>Use a fictional email, such as <code>alex@example.test</code>, and a workspace such as Studio North.</p>
		\${validationSummary(view, actions)}
		<form class="sso-form" data-sso-form="account" @submit=\${actions.submitAccount}>
			<en-text-field id="sso-workspace" name="workspace" label="Workspace" required
				pattern=".*\\\\S.*" description="Enter the name of your example workspace."
				autocomplete="organization" .value=\${view.workspace}
				@en-change=\${actions.accountChange} @invalid=\${actions.invalid}
				@keydown=\${actions.fieldKeydown} @compositionstart=\${actions.compositionStart} @compositionend=\${actions.compositionEnd}></en-text-field>
			<en-text-field id="sso-email" name="email" label="Work email" type="email" required
				pattern=".+@.+[.].+" description="Use a complete email address, such as alex@example.test."
				autocomplete="username" .value=\${view.email}
				@en-change=\${actions.accountChange} @invalid=\${actions.invalid}
				@keydown=\${actions.fieldKeydown} @compositionstart=\${actions.compositionStart} @compositionend=\${actions.compositionEnd}></en-text-field>
			<div class="sso-actions"><en-button @click=\${actions.requestSubmit}>Continue</en-button></div>
		</form>\`;
}

function provider(view: SSOView, actions: SSOActions) {
	const pending = view.status === 'pending';
	return html\`
		<h3 id="sso-step-title" tabindex="-1" data-sso-heading>Choose your sign-in provider</h3>
		<dl class="sso-context"><div><dt>Workspace</dt><dd>\${view.workspace}</dd></div><div><dt>Account</dt><dd>\${view.email}</dd></div></dl>
		\${validationSummary(view, actions)}
		<form class="sso-form" data-sso-form="provider" @submit=\${actions.submitProvider}>
			<en-radio-group id="sso-provider" name="provider" label="Sign-in provider" required
				description="These providers are fictional." .value=\${view.provider} ?disabled=\${pending}
				@en-change=\${actions.providerChange} @invalid=\${actions.invalid}>
				\${providers.map(provider => html\`<en-radio value=\${provider.value}>\${provider.label}</en-radio>\`)}
			</en-radio-group>
			<div class="sso-actions">
				<en-button variant="secondary" @click=\${actions.back}>Back</en-button>
				<en-button data-sso-continue @click=\${actions.requestSubmit}>\${view.status === 'rejected' ? 'Retry' : 'Continue'}</en-button>
				<en-button variant="ghost" ?hidden=\${!pending} @click=\${actions.cancel}>Cancel sign-in</en-button>
			</div>
		</form>\`;
}

function complete(view: SSOView, actions: SSOActions) {
	const receipt = view.receipt;
	return html\`
		<h3 id="sso-step-title" tabindex="-1" data-sso-heading>Example sign-in complete</h3>
		<p>You completed the example for <strong>\${receipt?.workspace}</strong>.</p>
		<dl class="sso-context"><div><dt>Account</dt><dd>\${receipt?.email}</dd></div>
			<div><dt>Provider</dt><dd>\${providers.find(provider => provider.value === receipt?.provider)?.label}</dd></div></dl>
		<en-button @click=\${actions.reset}>Start again</en-button>\`;
}

/** Pure markup: application behavior is supplied by index.ts and model.ts. */
export function ssoTemplate(view: SSOView, actions: SSOActions): TemplateResult {
	return html\`
		<div class="sso-workflow" data-sso-workflow \${ref(element => actions.attach(element))}>
			<p class="sso-disclosure">Simulation: this example uses local outcomes, sends no credentials, and creates no authenticated session.</p>
			<ol class="sso-steps" aria-label="Sign-in steps">
				<li aria-current=\${view.step === 'account' ? 'step' : nothing}>1. Account</li>
				<li aria-current=\${view.step === 'provider' ? 'step' : nothing}>2. Provider</li>
				<li aria-current=\${view.step === 'complete' ? 'step' : nothing}>3. Complete</li>
			</ol>
			<en-card class="sso-task">
				\${keyed(view.run, view.step === 'account' ? account(view, actions) : view.step === 'provider' ? provider(view, actions) : complete(view, actions))}
				<p class="sso-status" data-state=\${view.status} role="status" aria-live="polite" aria-atomic="true">\${view.announcement}</p>
			</en-card>
			<details class="sso-scenarios">
				<summary>Scenario controls for sign-in</summary>
				<p>Configure the next attempt. Held responses ignore cancellation to test late-result protection.</p>
				<div class="sso-fixture-fields">
					<en-select label="Sign-in outcome" .value=\${view.scenario} .items=\${[
						{ value: 'reject-once', label: 'Reject once, then succeed' }, { value: 'success', label: 'Succeed' },
						{ value: 'denied', label: 'Always decline' }, { value: 'expired', label: 'Always expire' },
					]} @en-change=\${actions.setScenario}></en-select>
					<en-select label="Sign-in response timing" .value=\${view.timing} .items=\${[
						{ value: 'immediate', label: 'Immediate' }, { value: 'delayed', label: 'Delay 700 milliseconds' }, { value: 'held', label: 'Hold until released' },
					]} @en-change=\${actions.setTiming}></en-select>
				</div>
				<p>Attempts in this sequence: <output data-sso-attempts>\${view.attempts}</output>.</p>
				<ul class="sso-pending-list">\${view.fixtures.filter(request => request.delivery === 'held').map(request => html\`
					<li><span>\${request.action}</span><en-button variant="secondary" size="small" @click=\${() => actions.release(request.id)}>Release response \${request.id}</en-button></li>\`)}
				</ul>
				<en-button variant="secondary" @click=\${actions.reset}>Reset sign-in scenario</en-button>
				<p class="sso-review">Try invalid details and follow an error link; go Back; retry a rejection. Hold a result, Cancel or Reset, then release it: your current step and values should remain.</p>
			</details>
		</div>\`;
}
`})))()}var H;function U(){return(U=C((()=>{s(),z(),V(),H=class extends l{static definition={id:`sso`,pageTitle:`Sign-in workflow`,heading:`Sign in to a workspace`,description:`Follow a multi-step sign-in flow with validation, waiting, cancellation, and recovery.`,sourceTitle:`SSO workflow`,fixtureNote:`Workspace lookup and sign-in use local fixtures in this tab. Use the review scenarios to explore waiting, cancellation, and recovery; reset the workflow to try again.`,styles:I,source:B,create:R}}})))()}function W(){return(W=C((async()=>{c(),b(),x(),S(),y(),U(),await o(H)})))()}await W();
//# sourceMappingURL=sso-entry-MF7xTAXC.js.map