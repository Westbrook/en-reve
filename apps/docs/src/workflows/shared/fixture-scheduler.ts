/** Deterministic application-fixture timing, configured in the separate QA controls. */
export type FixtureDelivery =
	| { readonly kind: 'immediate' }
	| { readonly kind: 'delayed'; readonly milliseconds: number }
	| { readonly kind: 'held' };

export interface FixtureRequestOptions {
	/** A stable action name for the QA request list, not a user-facing status message. */
	readonly action: string;
	readonly signal: AbortSignal;
	readonly delivery?: FixtureDelivery;
}

export interface PendingFixtureRequest {
	readonly id: number;
	readonly action: string;
	readonly delivery: FixtureDelivery['kind'];
}

export interface FixtureScheduler {
	readonly pending: readonly PendingFixtureRequest[];
	/** Produce a fresh response at delivery; do not mutate a workflow from this callback. */
	respond<Value>(produce: () => Value, options: FixtureRequestOptions): Promise<Value>;
	/** Deliver one held response. An ID allows out-of-order completion across lanes. */
	release(id?: number): boolean;
	/** Cancel outstanding fixture work while preserving this scheduler for reset. */
	reset(): void;
	dispose(): void;
}

function abortError(): Error {
	const error = new Error('The fixture request was canceled.');
	error.name = 'AbortError';
	return error;
}

/** Timers and response queues are per instance and start only after a user action. */
export function createFixtureScheduler(): FixtureScheduler {
	type Pending = PendingFixtureRequest & { deliver(): void; cancel(): void };
	const requests = new Map<number, Pending>();
	let sequence = 0;
	let disposed = false;
	const reset = (): void => {
		for (const request of [...requests.values()]) request.cancel();
	};

	return {
		get pending() {
			return [...requests.values()].map(({ id, action, delivery }) => ({ id, action, delivery }));
		},
		respond<Value>(produce: () => Value, options: FixtureRequestOptions): Promise<Value> {
			if (disposed || options.signal.aborted) return Promise.reject(abortError());
			const delivery = options.delivery ?? { kind: 'immediate' };
			if (delivery.kind === 'delayed' && (!Number.isFinite(delivery.milliseconds) || delivery.milliseconds < 0)) {
				return Promise.reject(new RangeError('Fixture delay must be a finite, nonnegative number.'));
			}
			return new Promise<Value>((resolve, reject) => {
				const id = ++sequence;
				let settled = false;
				let timer: ReturnType<typeof setTimeout> | undefined;
				const cleanup = (): boolean => {
					if (settled) return false;
					settled = true;
					if (timer !== undefined) clearTimeout(timer);
					options.signal.removeEventListener('abort', cancel);
					requests.delete(id);
					return true;
				};
				const cancel = (): void => { if (cleanup()) reject(abortError()); };
				const deliver = (): void => {
					if (!cleanup()) return;
					if (disposed || options.signal.aborted) { reject(abortError()); return; }
					try { resolve(produce()); } catch (error) { reject(error); }
				};
				requests.set(id, { id, action: options.action, delivery: delivery.kind, deliver, cancel });
				options.signal.addEventListener('abort', cancel, { once: true });
				if (delivery.kind === 'immediate') queueMicrotask(deliver);
				else if (delivery.kind === 'delayed') timer = setTimeout(deliver, delivery.milliseconds);
			});
		},
		release(id) {
			const request = id === undefined
				? [...requests.values()].find((candidate) => candidate.delivery === 'held')
				: requests.get(id);
			if (!request || request.delivery !== 'held') return false;
			request.deliver();
			return true;
		},
		reset,
		dispose() { disposed = true; reset(); },
	};
}
