/** Docs-owned consumption helpers; no component state or event protocol lives here. */
type ValueHost<T> = HTMLElement & { value: T };

function source(event: Event): HTMLElement | undefined {
	// Only the cancelable semantic change can transfer accepted state to the app.
	if (event.type !== 'en-change' || !event.cancelable) return;
	const host = event.currentTarget as HTMLElement | null;
	// A slotted/nested control's bubbling change does not belong to this field.
	return host && event.composedPath()[0] === host ? host : undefined;
}

/** Decide synchronously, then authoritatively accept through the public setter. */
export function acceptValueChange<T>(event: Event, decide: (proposed: T) => T | undefined): void {
	const host = source(event) as ValueHost<T> | undefined;
	if (!host || event.defaultPrevented) return;
	event.preventDefault();
	const accepted = decide((event as CustomEvent<{ proposed: T }>).detail.proposed);
	// Undefined rejects the proposal. Equal writes still supersede rollback.
	if (accepted !== undefined) host.value = accepted;
}

/** Observe only an uncanceled proposal that remains the current accepted value. */
export function afterAcceptedChange<Host extends HTMLElement, T>(
	event: Event, read: (host: Host) => T, observe: (value: T, host: Host) => void,
): void {
	const host = source(event) as Host | undefined;
	if (!host || event.defaultPrevented) return;
	const proposed = (event as CustomEvent<{ proposed: T }>).detail.proposed;
	if (!Object.is(read(host), proposed)) return;
	// currentTarget is cleared after dispatch. Capture the host now; let all
	// synchronous listeners cancel or authoritatively supersede this proposal.
	queueMicrotask(() => {
		if (!event.defaultPrevented && host.isConnected && Object.is(read(host), proposed)) observe(proposed, host);
	});
}
