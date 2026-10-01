import { failure, success, type Result } from '../shared/result.js';
import { createFixtureScheduler, type FixtureDelivery } from '../shared/fixture-scheduler.js';
import type { ServiceContext } from '../shared/workflow.js';

export const providers = [
	{ value: 'studio', label: 'Studio identity' },
	{ value: 'partner', label: 'Partner identity' },
] as const;
export type Provider = typeof providers[number]['value'];
export interface SignInInput { readonly workspace: string; readonly email: string; readonly provider: Provider; }
export interface SignInReceipt extends SignInInput { readonly attempt: number; }
export interface SignInProblem { readonly kind: 'denied' | 'expired' | 'unexpected'; readonly message: string; }
export type Scenario = 'success' | 'reject-once' | 'denied' | 'expired';
export type Timing = 'immediate' | 'delayed' | 'held';
export interface SignInFixture { readonly scenario: Scenario; readonly timing: Timing; }

/** A local fixture adapter, with no network, identity provider or authenticated session. */
export function createSSOService() {
	const scheduler = createFixtureScheduler();
	let attempts = 0;
	return {
		get pending() { return scheduler.pending; },
		get attempts() { return attempts; },
		continue(input: SignInInput, context: ServiceContext, fixture: SignInFixture): Promise<Result<SignInReceipt, SignInProblem>> {
			const attempt = ++attempts;
			// Capture the outcome now: changing QA controls cannot rewrite an issued response.
			const outcome = fixture.scenario === 'reject-once' ? (attempt === 1 ? 'denied' : 'success') : fixture.scenario;
			const delivery: FixtureDelivery = fixture.timing === 'delayed'
				? { kind: 'delayed', milliseconds: 700 } : { kind: fixture.timing };
			// Held fixtures deliberately ignore cancellation so Release can exercise a stale
			// completion after Cancel or Reset. The application's request identity is authoritative.
			const signal = fixture.timing === 'held' ? new AbortController().signal : context.signal;
			return scheduler.respond(() => {
				if (outcome === 'denied') return failure<SignInProblem>({ kind: 'denied', message: 'The example provider declined this attempt. Retry or choose the other provider.' });
				if (outcome === 'expired') return failure<SignInProblem>({ kind: 'expired', message: 'The example sign-in window expired. Retry to begin a new attempt.' });
				return success<SignInReceipt>({ ...input, attempt });
			}, { action: `Sign-in attempt ${attempt} (request ${context.id})`, signal, delivery });
		},
		release(id: number) { return scheduler.release(id); },
		// Retain held responses for the reset-then-release QA journey. dispose clears them.
		resetSequence() { attempts = 0; },
		dispose() { scheduler.dispose(); },
	};
}
