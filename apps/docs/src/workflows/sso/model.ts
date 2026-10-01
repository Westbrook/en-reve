import { Signal } from 'signal-polyfill';
import { createRequestLane } from '../shared/request-lane.js';
import { createSSOService, type Provider, type Scenario, type Timing, type SignInInput, type SignInReceipt, type SignInProblem } from './service.js';

export type AccountField = 'workspace' | 'email';
export interface FieldProblem { readonly field: AccountField | 'provider'; readonly label: string; readonly message: string; }
export interface SSOState {
	readonly step: 'account' | 'provider' | 'complete';
	readonly workspace: string;
	readonly email: string;
	readonly provider: Provider;
	readonly status: 'ready' | 'pending' | 'rejected' | 'complete';
	readonly submitted?: SignInInput;
	readonly problem?: SignInProblem;
	readonly receipt?: SignInReceipt;
	readonly errors: readonly FieldProblem[];
	readonly announcement: string;
	readonly scenario: Scenario;
	readonly timing: Timing;
	readonly run: number;
}

function initialState(run = 0): SSOState {
	return { step: 'account', workspace: '', email: '', provider: 'studio', status: 'ready', errors: [], announcement: '', scenario: 'reject-once', timing: 'delayed', run };
}

/** Domain state is independent of DOM nodes and component event names. */
export function createSSOModel(changed: () => void, focusStep: () => void) {
	const state = new Signal.State<SSOState>(initialState());
	const lane = createRequestLane();
	const service = createSSOService();
	let disposed = false;
	const update = (patch: Partial<SSOState>): void => {
		if (disposed) return;
		state.set({ ...state.get(), ...patch });
		changed();
	};
	const reset = (): void => {
		if (disposed) return;
		lane.cancel();
		service.resetSequence();
		state.set(initialState(state.get().run + 1));
		focusStep();
		changed();
	};
	return {
		read: () => state.get(),
		get pendingFixtures() { return service.pending; },
		get attempts() { return service.attempts; },
		editAccount(field: AccountField, value: string): void {
			if (state.get().step !== 'account') return;
			update({ [field]: value, errors: state.get().errors.filter(error => error.field !== field) });
		},
		chooseProvider(provider: Provider): void {
			if (state.get().status === 'pending') return;
			update({ provider, problem: undefined, status: 'ready', announcement: '', errors: [] });
		},
		showValidation(errors: readonly FieldProblem[]): void { update({ errors }); },
		advanceAccount(workspace: string, email: string): void {
			if (state.get().step !== 'account') return;
			focusStep();
			update({ workspace, email, step: 'provider', errors: [], announcement: '' });
		},
		back(): void {
			lane.cancel();
			focusStep();
			update({ step: 'account', status: 'ready', problem: undefined, errors: [], announcement: '', submitted: undefined });
		},
		cancel(): void {
			if (!lane.pending) return;
			lane.cancel();
			update({ status: 'ready', submitted: undefined, announcement: 'Sign-in canceled. Your account and provider are retained.' });
		},
		async continue(): Promise<void> {
			const current = state.get();
			if (disposed || current.step !== 'provider') return;
			const request = lane.begin();
			if (!request) return;
			const input: SignInInput = { workspace: current.workspace, email: current.email, provider: current.provider };
			update({ status: 'pending', submitted: input, problem: undefined, errors: [], announcement: 'Waiting for the example provider. You can cancel this attempt.' });
			try {
				const result = await service.continue(input, request, current);
				if (!request.isCurrent()) return;
				if (result.ok) {
					focusStep();
					update({ step: 'complete', status: 'complete', receipt: result.value, announcement: '' });
				} else update({ status: 'rejected', problem: result.problem, announcement: result.problem.message });
			} catch {
				if (!request.isCurrent()) return;
				const message = 'The example could not complete this attempt. Your values are retained; try again.';
				update({ status: 'rejected', problem: { kind: 'unexpected', message }, announcement: message });
			} finally { request.finish(); }
		},
		setScenario(scenario: Scenario): void {
			service.resetSequence();
			update({ scenario });
		},
		setTiming(timing: Timing): void { update({ timing }); },
		release(id: number): void { service.release(id); changed(); },
		reset,
		dispose(): void { disposed = true; lane.dispose(); service.dispose(); },
	};
}
export type SSOModel = ReturnType<typeof createSSOModel>;
