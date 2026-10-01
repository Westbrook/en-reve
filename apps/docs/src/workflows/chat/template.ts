import { presenceActivityExample } from '../../presence-activity-demo.js';
import { html, nothing } from 'lit';
import { ref, type Ref } from 'lit/directives/ref.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import type { PendingFixtureRequest } from '../shared/fixture-scheduler.js';
import { initialDraft, previewValue, unresolved, type ChatState, type Turn } from './model.js';

export interface Composer extends HTMLElement { value: string; }
export interface NumericField extends HTMLElement { reportValidity(): boolean; }
export interface ChatRefs {
	root: Ref<HTMLElement>;
	composer: Ref<Composer>;
	heading: Ref<HTMLHeadingElement>;
	slider: Ref<NumericField>;
}
export interface ChatActions {
	draft(event: Event): void;
	compositionEnd(): void;
	send(event: Event): void;
	retry(turn: Turn, event: Event): void;
	propose(event: Event): void;
	preview(event: Event): void;
	refresh(event: Event): void;
	apply(event: Event): void;
	cancel(event: Event): void;
	showLatest(): void;
	showAdjustment(): void;
	showSource(): void;
	replyScenario(event: Event): void;
	applyScenario(event: Event): void;
	timing(event: Event): void;
	release(): void;
	collaborator(): void;
	permission(): void;
	target(): void;
	cancelPending(event: Event): void;
	reset(): void;
}
const replies = [
	{ value: 'success', label: 'Success' }, { value: 'fail-once', label: 'Fail once' },
	{ value: 'invalid-action', label: 'Unsupported action' }, { value: 'invalid-target', label: 'Wrong target' },
	{ value: 'invalid-value', label: 'Invalid value' }, { value: 'invalid-capability', label: 'Unsupported capability' },
];
const outcomes = [{ value: 'success', label: 'Success' }, { value: 'fail-once', label: 'Fail once' }];
const timings = [{ value: 'immediate', label: 'Immediate' }, { value: 'delayed', label: 'Delayed' }, { value: 'held', label: 'Held' }];
const artwork = (opacity: number) => html`<div class="chat-artboard"><div class="chat-artwork" aria-hidden="true" style=${styleMap({ '--chat-image-opacity': String(opacity / 100) })}></div><span>Make room for a new idea</span></div>`;

/** Real consumer markup: public components, authored semantics, and plain-text conversation content. */
export function chatTemplate(state: ChatState, refs: ChatRefs, actions: ChatActions,
	pending: { send: boolean; apply: boolean; fixtures: readonly PendingFixtureRequest[] }) {
	const card = state.card;
	const value = previewValue(card);
	const editable = card && unresolved(card) && value !== undefined && card.phase !== 'blocked';
	return html`
		<section ${ref(refs.root)} data-workflow="chat" aria-label="Contextual chat workflow">
		<header><h3>From conversation to creative control</h3><p>Ask for an adjustment, review a local preview, and decide what changes.</p>
			<p class="chat-muted">Interactive simulation: this conversation and its controls are scripted locally. No LLM, chat service, or real collaborator is connected.</p></header>
		<div class="chat-product">
			<section class="chat-transcript" role="region" aria-label="Project conversation" tabindex="0" data-testid="chat-transcript">
				<ol>${repeat(state.turns, turn => turn.id, turn => html`<li><en-chat-message class="chat-turn" id=${turn.id} tabindex="-1" .author=${turn.speaker} .label=${`${turn.speaker} message`} ?outgoing=${turn.speaker === 'You'}>
					<p>${turn.text}</p>
					${turn.delivery === 'pending' ? html`<p class="chat-muted">Sending this message…</p>` : nothing}
					${turn.delivery === 'failed' ? html`<p>This message was not sent. Retry sends this message and keeps any newer draft.</p><div class="chat-actions"><en-button variant="secondary" ?disabled=${pending.send} @click=${(event: Event) => actions.retry(turn, event)}>Retry message</en-button></div>` : nothing}
					${turn.referencesAdjustment === card?.sourceId && unresolved(card) ? html`<p>The pending adjustment is available below the conversation.</p><div class="chat-actions"><en-button variant="ghost" @click=${actions.showAdjustment}>Review pending adjustment</en-button></div>` : nothing}
					${turn.resolution ? html`<p>${turn.resolution}</p>` : nothing}
				</en-chat-message></li>`)}</ol>
			</section>
			<div class="chat-actions">
				<en-button variant="secondary" ?disabled=${state.unread === 0} @click=${actions.showLatest}>Show new message${state.unread ? ` (${state.unread})` : ''}</en-button>
				<en-button variant="secondary" ?disabled=${!card} @click=${actions.showAdjustment}>Review latest adjustment</en-button>
			</div>
			<en-chat-composer class="chat-composer" .sending=${pending.send} @en-action=${(event: CustomEvent) => { if (event.detail.action === 'send') queueMicrotask(() => { if (!event.defaultPrevented) actions.send(event); }); }}>
				<en-textarea slot="editor" ${ref(refs.composer)} data-testid="chat-composer" label="Message" rows="3" .value=${initialDraft}
					description="Enter adds a new line. Send when your message is ready; you can keep writing while a reply is pending."
					@en-input=${actions.draft} @compositionend=${actions.compositionEnd}></en-textarea>
				<en-button slot="send" data-testid="chat-send" data-pending=${String(pending.send)} aria-disabled=${String(pending.send)}>Send message</en-button>
			</en-chat-composer>
			<p class="chat-status" role="status" aria-live="polite" aria-atomic="true" data-testid="chat-status">${state.status}</p>
			<en-card>
				<h4 slot="header">Cover image</h4>
				<div class="chat-comparison"><figure>${artwork(state.scene.opacity)}<figcaption data-testid="chat-current">Current: ${state.scene.opacity}% opacity · revision ${state.scene.revision}${state.scene.targetPresent ? '' : ' · image unavailable'}</figcaption></figure>
					${card?.preview && unresolved(card) ? html`<figure>${artwork(card.preview.value)}<figcaption>Preview: ${card.preview.value}% opacity · based on revision ${card.preview.baseRevision}</figcaption></figure>` : nothing}</div>
			</en-card>
			${card ? html`<en-card data-testid="chat-adjustment">
				<h4 slot="header" ${ref(refs.heading)} class="chat-context-heading" tabindex="-1">Cover image adjustment</h4>
				<div class="chat-context">
					<p>From an assistant reply in this conversation. ${card.phase === 'applied' ? 'This adjustment is applied.' : card.phase === 'canceled' ? 'This adjustment was canceled.' : 'Your image changes only after you apply a reviewed preview.'}</p>
					<div class="chat-actions"><en-button variant="ghost" @click=${actions.showSource}>Show source message</en-button></div>
					${card.problem ? html`<p class="chat-problem" data-testid="chat-problem">${card.problem.message}</p>` : nothing}
					${editable ? html`<en-slider ${ref(refs.slider)} label="Proposed opacity" min="0" max="100" step="1" editable show-value .value=${value} .valueText=${`${value}%`} ?disabled=${pending.apply}
						description="Changing this value discards the previous preview. Review the new preview before applying."
						@en-change=${actions.propose}></en-slider>` : nothing}
					${unresolved(card) ? html`<div class="chat-actions">
						${card.phase === 'stale' || card.phase === 'blocked' ? html`<en-button @click=${actions.refresh}>Refresh preview</en-button>`
							: card.preview ? html`<en-button data-pending=${String(pending.apply)} @click=${actions.apply}>${card.phase === 'failed' ? 'Retry adjustment' : 'Apply adjustment'}</en-button>`
							: html`<en-button @click=${actions.preview}>Preview adjustment</en-button>`}
						<en-button variant="secondary" @click=${actions.cancel}>Cancel adjustment</en-button>
					</div>` : nothing}
				</div>
			</en-card>` : nothing}
		</div>
		<details class="chat-qa" data-testid="chat-qa">
			<summary>Chat simulation controls</summary>
			<p>These controls exercise a finite local fixture. Nothing is sent or saved outside this page. Attachments and real model responses are not exercised.</p>
			<div class="chat-qa-grid">
				<en-select label="Next reply" .items=${replies} .value=${state.nextReply} @en-change=${actions.replyScenario}></en-select>
				<en-select label="Apply result" .items=${outcomes} .value=${state.nextApply} @en-change=${actions.applyScenario}></en-select>
				<en-select label="Response timing" .items=${timings} .value=${state.delivery} @en-change=${actions.timing}></en-select>
			</div>
			<div class="chat-actions">
				<en-button variant="secondary" ?disabled=${!pending.fixtures.some(item => item.delivery === 'held')} @click=${actions.release}>Release pending response</en-button>
				<en-button variant="secondary" ?disabled=${!pending.send && !pending.apply} @click=${actions.cancelPending}>Cancel pending requests</en-button>
				<en-button variant="secondary" @click=${actions.collaborator}>Add collaborator turn</en-button>
				<en-button variant="secondary" @click=${actions.permission}>${state.scene.canEdit ? 'Revoke editing access' : 'Restore editing access'}</en-button>
				<en-button variant="secondary" @click=${actions.target}>${state.scene.targetPresent ? 'Remove image target' : 'Restore image target'}</en-button>
				<en-button variant="secondary" @click=${actions.reset}>Reset chat</en-button>
			</div>
			<p>${pending.fixtures.length ? `${pending.fixtures.length} fixture response(s) pending.` : 'No fixture responses pending.'} Held responses are released in request order.</p>
			<ol><li>Send, edit the next draft while waiting, and review the reply. Preview then apply or cancel.</li>
				<li>Choose Fail once, send, and retry that message. Keep writing a different draft during the retry.</li>
				<li>Preview, choose Held, and Apply. Add a collaborator turn before releasing: nothing applies until you refresh and review the new revision.</li>
				<li>Revoke editing access or remove the image while Apply is held. Release and read the recovery explanation.</li>
				<li>Read an earlier message, then add a collaborator turn. Your position and composer stay unchanged; Show new message moves only when requested.</li></ol>
		</details>
		<details><summary>Collaborators and project activity</summary>${presenceActivityExample()} </details>
		<details><summary>Composable message editor</summary><en-composable-chat-demo></en-composable-chat-demo></details></section>
	`;
}
