/** A request's identity remains valid only while it owns its application lane. */
export interface WorkflowRequest {
	readonly id: number;
	readonly signal: AbortSignal;
	isCurrent(): boolean;
	/** Release this request without disturbing a newer one. Call from finally. */
	finish(): void;
}

export interface RequestLane {
	readonly pending: boolean;
	/** Duplicate activation while pending does not begin another service request. */
	begin(): WorkflowRequest | undefined;
	/** Invalidate first, then abort. Even an adapter that ignores abort becomes stale. */
	cancel(): void;
	/** Permanently invalidate a removed workflow; reset uses cancel instead. */
	dispose(): void;
}

/** No process-global state; create one lane per independent operation in a workflow. */
export function createRequestLane(): RequestLane {
	let sequence = 0;
	let disposed = false;
	let active: { id: number; controller: AbortController } | undefined;

	const cancel = (): void => {
		const previous = active;
		active = undefined;
		previous?.controller.abort();
	};

	return {
		get pending() { return active !== undefined; },
		begin() {
			if (disposed || active) return undefined;
			const current = { id: ++sequence, controller: new AbortController() };
			active = current;
			return {
				id: current.id,
				signal: current.controller.signal,
				isCurrent: () => !disposed && active === current && !current.controller.signal.aborted,
				finish() { if (active === current) active = undefined; },
			};
		},
		cancel,
		dispose() { disposed = true; cancel(); },
	};
}
