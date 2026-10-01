/** Root-owned host integration; supplied only when the docs application creates a workflow. */
export interface WorkflowOptions {
	requestUpdate(): void;
}

/** Rendered is Lit TemplateResult in these consuming applications; the core needs no Lit import. */
export interface WorkflowController<Rendered> {
	render(): Rendered;
	reset(): void;
	dispose(): void;
}

/**
 * Small application composition boundary. Snapshots contain domain state, not DOM nodes;
 * actions own validation, service calls and accepted writes. Templates stay separate.
 */
export interface WorkflowModel<Snapshot, Actions extends object> {
	/** Read instance-local signal state so the host can subscribe through SignalController. */
	read(): Readonly<Snapshot>;
	readonly actions: Actions;
	/** Cancel pending work and recreate the declared initial state, retaining the instance. */
	reset(): void;
	/** Cancel work when permanently removed. Do not dispose on a theme update. */
	dispose(): void;
}

/** Application adapters receive identity and cancellation, never component event objects. */
export interface ServiceContext {
	readonly id: number;
	readonly signal: AbortSignal;
}
