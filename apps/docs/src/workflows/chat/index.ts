import { acceptValueChange, afterAcceptedChange } from '../../change-consumption.js';
import { Signal } from 'signal-polyfill';
import { createRef } from 'lit/directives/ref.js';
import { createRequestLane } from '../shared/request-lane.js';
import { createFixtureScheduler, type FixtureDelivery } from '../shared/fixture-scheduler.js';
import { failure, success } from '../shared/result.js';
import { initialChatState, initialDraft, validateAdjustment, refreshAdjustment, scriptedAdjustment,
	changeProposedValue, unresolved, type ChatState, type Problem, type Turn, type ReplyScenario, type DeliveryMode } from './model.js';
import { chatTemplate, type ChatActions, type ChatRefs, type Composer, type NumericField } from './template.js';
import { chatStyles } from './styles.js';

export { chatStyles } from './styles.js';

/** Pure construction. The consuming host registers components and owns render/dispose boundaries. */
export function createChatWorkflow({ requestUpdate }: { requestUpdate(): void }) {
	const signal = new Signal.State<ChatState>(initialChatState());
	const sendLane = createRequestLane();
	const applyLane = createRequestLane();
	const scheduler = createFixtureScheduler();
	const refs: ChatRefs = { root: createRef<HTMLElement>(), composer: createRef<Composer>(), heading: createRef<HTMLHeadingElement>(), slider: createRef<NumericField>() };
	let disposed = false;
	const read = () => signal.get();
	const write = (state: ChatState): void => { if (!disposed) { signal.set(state); requestUpdate(); } };
	const delivery = (): FixtureDelivery => read().delivery === 'delayed' ? { kind: 'delayed', milliseconds: 600 } : { kind: read().delivery as 'immediate' | 'held' };
	const transport = (message: string): Problem => ({ code: 'transport', message });
	const focusBeforeRemoval = (event: Event, target: HTMLElement | undefined): void => {
		// Public host focus ownership works across its private native control's shadow root.
		if ((event.currentTarget as HTMLElement | null)?.matches(':focus-within')) target?.focus({ preventScroll: true });
	};
	const sourceElement = (id: string): HTMLElement | undefined => {
		// IDs are authored by this finite recipe; no conversation text enters selectors.
		return [...(refs.root.value?.querySelectorAll<HTMLElement>('.chat-turn') ?? [])].find(element => element.id === id);
	};
	const resolveSource = (state: ChatState, sourceId: string, resolution: string): readonly Turn[] =>
		state.turns.map(turn => turn.id === sourceId ? { ...turn, resolution } : turn);
	const showProblem = (problem: Problem): void => {
		const state = read();
		if (!state.card) return;
		write({ ...state, card: { ...state.card, phase: problem.code === 'stale' ? 'stale' : problem.code === 'transport' ? 'failed' : 'blocked', problem }, status: problem.message });
	};
	const reset = (): void => {
		sendLane.cancel(); applyLane.cancel(); scheduler.reset();
		if (refs.composer.value) refs.composer.value.value = initialDraft;
		write(initialChatState());
	};

	const send = async (event: Event, retry?: Turn): Promise<void> => {
		const captured = read();
		if (disposed || captured.composing) return;
		if (!retry && !captured.draft.trim()) { write({ ...captured, status: 'Write a message before sending.' }); refs.composer.value?.focus(); return; }
		const request = sendLane.begin();
		if (!request) return;
		const turn: Turn = retry ? { ...retry, delivery: 'pending' } : {
			id: `chat-turn-${captured.nextTurn}`, speaker: 'You', text: captured.draft,
			delivery: 'pending', submittedDraftRevision: captured.draftRevision,
		};
		if (retry) focusBeforeRemoval(event, sourceElement(retry.id));
		const scenario = captured.nextReply;
		write({ ...captured, nextTurn: retry ? captured.nextTurn : captured.nextTurn + 1,
			turns: retry ? captured.turns.map(item => item.id === turn.id ? turn : item) : [...captured.turns, turn],
			nextReply: scenario === 'fail-once' ? 'success' : scenario, status: 'Sending your message. You can keep writing.' });
		try {
			const response = scheduler.respond(() => scenario === 'fail-once'
				? failure(transport('Your message could not be sent. Retry the message below; your draft is unchanged.'))
				: success(scriptedAdjustment(captured.scene, scenario)), { action: 'send', signal: request.signal, delivery: delivery() });
			requestUpdate();
			const result = await response;
			if (!request.isCurrent()) return;
			let state = read();
			const turns = state.turns.map(item => item.id === turn.id ? { ...item, delivery: result.ok ? 'sent' as const : 'failed' as const } : item);
			if (!result.ok) { write({ ...state, turns, status: result.problem.message }); return; }
			const sourceId = `chat-turn-${state.nextTurn}`;
			const alreadyPending = unresolved(state.card);
			const checked = validateAdjustment(result.value, state.scene);
			const card = alreadyPending ? state.card : { sourceId, payload: result.value,
				phase: checked.ok ? 'suggested' as const : checked.problem.code === 'stale' ? 'stale' as const : 'blocked' as const,
				...(!checked.ok ? { problem: checked.problem } : {}) };
			// This recipe has a single authored action card. Replies cannot silently replace it.
			const reply: Turn = { id: sourceId, speaker: 'Assistant', referencesAdjustment: alreadyPending ? state.card!.sourceId : sourceId,
				text: alreadyPending ? 'There is already an image adjustment waiting for your decision. Review, apply, or cancel it before starting a new adjustment.'
					: checked.ok ? 'Try increasing the Cover image opacity to 85%. Review the current image beside a preview, then decide whether to apply it.' : 'The proposed adjustment needs review. Open the adjustment to read the problem and available recovery.' };
			if (!state.composing && state.draftRevision === turn.submittedDraftRevision && state.draft === turn.text) {
				// Ordinary renders never write native drafts. A successful matching send explicitly clears one.
				if (refs.composer.value) refs.composer.value.value = '';
				state = { ...state, draft: '', draftRevision: state.draftRevision + 1 };
			}
			write({ ...state, turns: [...turns, reply], card, nextTurn: state.nextTurn + 1, unread: state.unread + 1,
				status: alreadyPending ? 'Reply ready. Your pending adjustment is unchanged.' : 'Reply ready. Use Review latest adjustment to reach the new controls.' });
		} catch {
			if (request.isCurrent()) {
				const state = read();
				write({ ...state, turns: state.turns.map(item => item.id === turn.id ? { ...item, delivery: 'failed' } : item), status: 'The reply is unavailable. Retry your message; your draft is unchanged.' });
			}
		} finally { request.finish(); if (!disposed) requestUpdate(); }
	};

	const preview = (event: Event, refresh: boolean): void => {
		const state = read();
		if (!state.card || !unresolved(state.card) || applyLane.pending) return;
		if (refs.slider.value && !refs.slider.value.reportValidity()) return;
		focusBeforeRemoval(event, refs.heading.value);
		const result = refresh ? refreshAdjustment(state.card.payload, state.scene) : validateAdjustment(state.card.payload, state.scene);
		if (!result.ok) { showProblem(result.problem); return; }
		write({ ...state, card: { ...state.card, payload: result.value, preview: result.value, phase: 'preview', problem: undefined },
			status: `Preview ready: ${result.value.value}% opacity, based on revision ${result.value.baseRevision}. Apply or cancel the adjustment.` });
	};

	const apply = async (event: Event): Promise<void> => {
		const state = read();
		const card = state.card;
		if (disposed || !card?.preview || !['preview', 'failed'].includes(card.phase)) return;
		if (refs.slider.value && !refs.slider.value.reportValidity()) return;
		const trigger = event.currentTarget as HTMLElement | null;
		const focusIfRemoved = (): void => { if (trigger?.matches(':focus-within')) refs.heading.value?.focus({ preventScroll: true }); };
		const checked = validateAdjustment(card.preview, state.scene);
		if (!checked.ok) { focusIfRemoved(); showProblem(checked.problem); return; }
		const request = applyLane.begin();
		if (!request) return;
		const previewSnapshot = card.preview;
		const failOnce = state.nextApply === 'fail-once';
		write({ ...state, nextApply: 'success', card: { ...card, phase: 'applying', problem: undefined }, status: 'Applying the reviewed adjustment…' });
		try {
			const response = scheduler.respond(() => failOnce ? failure(transport('The adjustment could not be applied. Your preview is retained; retry when ready.')) : success(previewSnapshot),
				{ action: 'apply', signal: request.signal, delivery: delivery() });
			requestUpdate();
			const result = await response;
			if (!request.isCurrent()) return;
			const current = read();
			if (!current.card || current.card.sourceId !== card.sourceId || current.card.preview !== previewSnapshot) return;
			if (!result.ok) { showProblem(result.problem); return; }
			// Validate at the actual mutation boundary, after any collaborator/access changes.
			const accepted = validateAdjustment(result.value, current.scene);
			if (!accepted.ok) { focusIfRemoved(); showProblem(accepted.problem); return; }
			focusIfRemoved();
			write({ ...current, scene: { ...current.scene, opacity: accepted.value.value, revision: current.scene.revision + 1 },
				card: { ...current.card, phase: 'applied', problem: undefined },
				turns: resolveSource(current, card.sourceId, `Applied ${accepted.value.value}% opacity.`),
				status: `Adjustment applied. Cover image opacity is ${accepted.value.value}%.` });
		} catch { if (request.isCurrent()) showProblem(transport('The adjustment is unavailable. Your preview is retained; retry when ready.')); }
		finally { request.finish(); if (!disposed) requestUpdate(); }
	};

	const actions: ChatActions = {
		draft(event) {
			const detail = (event as CustomEvent<{ value: string; isComposing: boolean }>).detail;
			if (!detail || typeof detail.value !== 'string') return;
			const state = read();
			write({ ...state, draft: detail.value, draftRevision: state.draftRevision + 1, composing: detail.isComposing });
		},
		compositionEnd() { queueMicrotask(() => { if (!disposed) write({ ...read(), composing: false }); }); },
		send(event) { void send(event); },
		retry(turn, event) { void send(event, turn); },
		propose(event) {
			acceptValueChange<number>(event, value => {
				const state = read();
				if (disposed || typeof value !== 'number' || !state.card || !unresolved(state.card) || applyLane.pending || !Number.isInteger(value) || value < 0 || value > 100) return;
				write({ ...state, card: { ...state.card, payload: changeProposedValue(state.card.payload, value), preview: undefined, problem: undefined, phase: 'suggested' }, status: 'Proposed opacity changed. Review a new preview before applying.' });
				return value;
			});
		},
		preview(event) { preview(event, false); },
		refresh(event) { preview(event, true); },
		apply(event) { void apply(event); },
		cancel(event) {
			const state = read();
			if (!state.card || !unresolved(state.card)) return;
			focusBeforeRemoval(event, refs.heading.value);
			applyLane.cancel();
			write({ ...state, card: { ...state.card, phase: 'canceled', preview: undefined, problem: undefined },
				turns: resolveSource(state, state.card.sourceId, 'Adjustment canceled. No image change was applied.'), status: 'Adjustment canceled. The image is unchanged.' });
		},
		showLatest() { const state = read(); sourceElement(state.turns[state.turns.length - 1]!.id)?.focus(); write({ ...state, unread: 0 }); },
		showAdjustment() { refs.heading.value?.focus(); },
		showSource() { const id = read().card?.sourceId; if (id) sourceElement(id)?.focus(); },
		replyScenario(event) {
			afterAcceptedChange(event, (field: Composer) => field.value, value => {
				if (['success', 'fail-once', 'invalid-action', 'invalid-target', 'invalid-value', 'invalid-capability'].includes(value)) write({ ...read(), nextReply: value as ReplyScenario });
			});
		},
		applyScenario(event) {
			afterAcceptedChange(event, (field: Composer) => field.value, value => {
				if (value === 'success' || value === 'fail-once') write({ ...read(), nextApply: value });
			});
		},
		timing(event) {
			afterAcceptedChange(event, (field: Composer) => field.value, value => {
				if (['immediate', 'delayed', 'held'].includes(value)) write({ ...read(), delivery: value as DeliveryMode });
			});
		},
		release() { scheduler.release(); requestUpdate(); },
		collaborator() {
			const state = read();
			const opacity = state.scene.opacity === 74 ? 68 : 74;
			write({ ...state, scene: { ...state.scene, opacity, revision: state.scene.revision + 1 },
				turns: [...state.turns, { id: `chat-turn-${state.nextTurn}`, speaker: 'Mira', text: `I adjusted the Cover image to ${opacity}% opacity. Please review against the updated image.` }],
				nextTurn: state.nextTurn + 1, unread: state.unread + 1, status: 'Mira updated the image. A new message is available; your draft is unchanged.' });
		},
		permission() { const state = read(); write({ ...state, scene: { ...state.scene, canEdit: !state.scene.canEdit }, status: state.scene.canEdit ? 'Editing access revoked.' : 'Editing access restored. Refresh a blocked preview before applying.' }); },
		target() { const state = read(); write({ ...state, scene: { ...state.scene, targetPresent: !state.scene.targetPresent, revision: state.scene.revision + 1 }, status: state.scene.targetPresent ? 'Cover image is unavailable.' : 'Cover image restored. Refresh the preview before applying.' }); },
		cancelPending(event) {
			focusBeforeRemoval(event, refs.composer.value);
			sendLane.cancel(); applyLane.cancel();
			const state = read();
			write({ ...state, turns: state.turns.map(turn => turn.delivery === 'pending' ? { ...turn, delivery: 'failed' } : turn),
				card: state.card?.phase === 'applying' ? { ...state.card, phase: 'preview' } : state.card,
				status: 'Pending requests canceled. Nothing was applied; your draft and preview are retained.' });
		},
		reset,
	};
	return {
		styles: chatStyles,
		render: () => chatTemplate(read(), refs, actions, { send: sendLane.pending, apply: applyLane.pending, fixtures: scheduler.pending }),
		reset,
		dispose() { disposed = true; sendLane.dispose(); applyLane.dispose(); scheduler.dispose(); },
	};
}
