import { failure, success, type Result } from '../shared/result.js';

export interface Scene {
	readonly targetPresent: boolean;
	readonly canEdit: boolean;
	readonly opacity: number;
	readonly revision: number;
}

export interface Adjustment {
	readonly capability: 'image.opacity.write';
	readonly action: 'set-image-opacity';
	readonly target: { readonly kind: 'image'; readonly id: 'cover-image' };
	readonly value: number;
	readonly baseRevision: number;
}

export interface Problem {
	readonly code: 'capability' | 'action' | 'target' | 'value' | 'revision' | 'permission' | 'stale' | 'transport';
	readonly message: string;
}

export type ReplyScenario = 'success' | 'fail-once' | 'invalid-action' | 'invalid-target' | 'invalid-value' | 'invalid-capability';
export type DeliveryMode = 'immediate' | 'delayed' | 'held';
export type AdjustmentPhase = 'suggested' | 'preview' | 'applying' | 'failed' | 'stale' | 'blocked' | 'applied' | 'canceled';
export interface ContextCard {
	readonly sourceId: string;
	readonly payload: unknown;
	readonly phase: AdjustmentPhase;
	readonly preview?: Adjustment;
	readonly problem?: Problem;
}

export interface Turn {
	readonly id: string;
	readonly speaker: 'You' | 'Assistant' | 'Mira';
	readonly text: string;
	readonly delivery?: 'pending' | 'sent' | 'failed';
	readonly submittedDraftRevision?: number;
	readonly resolution?: string;
	readonly referencesAdjustment?: string;
}

export interface ChatState {
	readonly draft: string;
	readonly draftRevision: number;
	readonly composing: boolean;
	readonly scene: Scene;
	readonly turns: readonly Turn[];
	readonly card?: ContextCard;
	readonly nextTurn: number;
	readonly status: string;
	readonly unread: number;
	readonly nextReply: ReplyScenario;
	readonly nextApply: 'success' | 'fail-once';
	readonly delivery: DeliveryMode;
}

export const initialDraft = 'Make the cover image a little stronger.\nKeep the text easy to read.';
export function initialChatState(): ChatState {
	return {
		draft: initialDraft, draftRevision: 0, composing: false,
		scene: { targetPresent: true, canEdit: true, opacity: 68, revision: 7 },
		turns: [
			{ id: 'chat-turn-1', speaker: 'Mira', text: 'The cover image is ready for review. I kept the headline above the image layer.' },
			{ id: 'chat-turn-2', speaker: 'Assistant', text: 'Ask for an image adjustment. I will offer a local preview before anything changes.' },
		],
		nextTurn: 3, status: '', unread: 0, nextReply: 'success', nextApply: 'success', delivery: 'delayed',
	};
}

function record(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Finite fixture capability schema. No generated HTML, executable actions, or arbitrary targets. */
export function validateAdjustment(payload: unknown, scene: Scene): Result<Adjustment, Problem> {
	if (!record(payload) || payload.capability !== 'image.opacity.write') {
		return failure({ code: 'capability', message: 'This reply does not request a supported editing capability. Nothing changed.' });
	}
	if (payload.action !== 'set-image-opacity') {
		return failure({ code: 'action', message: 'This reply proposes an unsupported action. Only image opacity can be adjusted here.' });
	}
	if (!record(payload.target) || payload.target.kind !== 'image' || payload.target.id !== 'cover-image' || !scene.targetPresent) {
		return failure({ code: 'target', message: 'The proposed image is unavailable or is not the selected Cover image. Nothing changed.' });
	}
	if (typeof payload.value !== 'number' || !Number.isFinite(payload.value) || !Number.isInteger(payload.value) || payload.value < 0 || payload.value > 100) {
		return failure({ code: 'value', message: 'Image opacity must be a whole number from 0 to 100. This proposal was not applied.' });
	}
	if (typeof payload.baseRevision !== 'number' || !Number.isSafeInteger(payload.baseRevision) || payload.baseRevision < 1) {
		return failure({ code: 'revision', message: 'This proposal has no valid document revision. Request a new adjustment.' });
	}
	if (!scene.canEdit) {
		return failure({ code: 'permission', message: 'Editing access changed. You can review the proposal, but you cannot apply it now.' });
	}
	if (payload.baseRevision !== scene.revision) {
		return failure({ code: 'stale', message: `The image changed after revision ${payload.baseRevision}; it is now revision ${scene.revision}. Refresh the preview before applying your adjustment.` });
	}
	return success({ capability: 'image.opacity.write', action: 'set-image-opacity', target: { kind: 'image', id: 'cover-image' }, value: payload.value, baseRevision: payload.baseRevision });
}

export function scriptedAdjustment(scene: Scene, scenario: ReplyScenario): unknown {
	const proposal: Record<string, unknown> = {
		capability: 'image.opacity.write', action: 'set-image-opacity',
		target: { kind: 'image', id: 'cover-image' }, value: 85, baseRevision: scene.revision,
	};
	if (scenario === 'invalid-action') proposal.action = 'delete-project';
	if (scenario === 'invalid-target') proposal.target = { kind: 'image', id: 'another-project-image' };
	if (scenario === 'invalid-value') proposal.value = 140;
	if (scenario === 'invalid-capability') proposal.capability = 'project.admin';
	return proposal;
}

/** Refresh preserves the proposed value; it does not weaken action, target, or capability checks. */
export function refreshAdjustment(payload: unknown, scene: Scene): Result<Adjustment, Problem> {
	return validateAdjustment(record(payload) ? { ...payload, baseRevision: scene.revision } : payload, scene);
}

export function changeProposedValue(payload: unknown, value: number): unknown {
	return record(payload) ? { ...payload, value } : payload;
}

export function unresolved(card: ContextCard | undefined): boolean {
	return Boolean(card && card.phase !== 'applied' && card.phase !== 'canceled');
}

export function previewValue(card: ContextCard | undefined): number | undefined {
	if (!card) return undefined;
	const payload = card.preview ?? card.payload;
	return record(payload) && typeof payload.value === 'number' && Number.isInteger(payload.value)
		&& payload.value >= 0 && payload.value <= 100 ? payload.value : undefined;
}
