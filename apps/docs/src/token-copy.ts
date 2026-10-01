/** Application-owned copy behavior for a token sample and its sibling feedback. */
type TokenSample = HTMLElement & { token: string; disabled: boolean };
type CopyOperation = { token: string; reference: string; swatch: TokenSample; status: HTMLElement };
const operations = new WeakMap<HTMLElement, CopyOperation>();

/** Keep the native clipboard call inside the synchronous activation handler. */
export function copyTokenReference(event: Event): void {
	if (event.defaultPrevented) return;
	const swatch = event.currentTarget as TokenSample;
	const group = swatch.closest<HTMLElement>('[data-token-sample]');
	const status = group?.querySelector<HTMLElement>('[role="status"]');
	if (!group || !status || !swatch.isConnected || swatch.disabled || !/^--en-[A-Za-z0-9_-]+$/u.test(swatch.token)) return;
	const reference = `var(${swatch.token})`;
	event.preventDefault();
	const pending = operations.get(group);
	if (pending?.reference === reference && pending.token === swatch.token
		&& pending.swatch === swatch && pending.status === status) return;
	const operation = { token: swatch.token, reference, swatch, status };
	operations.set(group, operation);
	status.textContent = '';
	group.dataset.copyState = 'copying';
	group.setAttribute('aria-busy', 'true');
	const view = swatch.ownerDocument.defaultView;
	let result: Promise<boolean>;
	try {
		const clipboard = view?.navigator.clipboard;
		result = clipboard?.writeText ? clipboard.writeText(reference).then(() => true, () => false) : Promise.resolve(false);
	} catch {
		result = Promise.resolve(false);
	}
	void finish();

	async function finish() {
		// Separate repeated live-region messages while the write proceeds independently.
		await new Promise<void>(resolve => view?.requestAnimationFrame
			? view.requestAnimationFrame(() => view.requestAnimationFrame(() => resolve()))
			: setTimeout(resolve, 0));
		const copied = await result;
		if (operations.get(group!) !== operation) return;
		operations.delete(group!);
		group!.removeAttribute('aria-busy');
		if (!swatch.isConnected || !group!.contains(swatch) || !group!.contains(status!) || swatch.disabled
			|| swatch.token !== operation.token) {
			group!.dataset.copyState = 'idle';
			return;
		}
		group!.dataset.copyState = copied ? 'success' : 'failure';
		status!.textContent = copied ? 'CSS reference copied.' : 'Could not copy. Select and copy the CSS reference.';
	}
}
