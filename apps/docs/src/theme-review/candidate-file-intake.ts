export const MAX_CANDIDATE_FILE_BYTES = 8_000_000;

interface CandidateFileIntakeOptions<Context, Result> {
	context(): Context | undefined;
	isCurrent(context: Context): boolean;
	parse(text: string, context: Context): Result;
	accept(result: Result): void;
	reject(error: unknown): void;
	dragging(active: boolean): void;
}

/** Docs-owned file transport. Parsing, draft history and preview policy stay with the caller. */
export function createCandidateFileIntake<Context, Result>(options: CandidateFileIntakeOptions<Context, Result>) {
	let generation = 0;
	let dragging = false;
	const setDragging = (active: boolean): void => {
		if (dragging === active) return;
		dragging = active;
		options.dragging(active);
	};
	const clearDrag = (): void => { setDragging(false); };
	const enabled = (): boolean => options.context() !== undefined;
	const fileDrag = (event: DragEvent): boolean => Array.from(event.dataTransfer?.types ?? []).includes('Files');
	const allowDrop = (event: DragEvent): void => {
		event.preventDefault();
		if (event.dataTransfer) event.dataTransfer.dropEffect = enabled() ? 'copy' : 'none';
	};

	const open = async (files: readonly File[]): Promise<void> => {
		const revision = ++generation;
		const context = options.context();
		if (context === undefined) return;
		const current = (): boolean => revision === generation && options.isCurrent(context);
		try {
			if (files.length !== 1) throw new Error('Choose or drop exactly one theme review JSON file.');
			const file = files[0]!;
			if (file.size > MAX_CANDIDATE_FILE_BYTES) throw new Error('Choose a theme review JSON file of 8 MB or smaller.');
			const text = await file.text();
			if (!current()) return;
			const result = options.parse(text, context);
			if (current()) options.accept(result);
		} catch (error) {
			// A late rejection is just as stale as a late successful read.
			if (current()) options.reject(error);
		}
	};

	return {
		open,
		invalidate(): void { ++generation; },
		clearDrag,
		change(event: Event): void {
			const input = event.currentTarget as HTMLInputElement;
			const files = Array.from(input.files ?? []);
			// Clear this selection now so an older completion cannot clear a newer pick.
			input.value = '';
			if (files.length) void open(files);
		},
		dragenter(event: DragEvent): void {
			if (!fileDrag(event)) return;
			allowDrop(event); setDragging(enabled());
		},
		dragover(event: DragEvent): void {
			if (!fileDrag(event)) return;
			allowDrop(event); setDragging(enabled());
		},
		dragleave(event: DragEvent): void {
			const zone = event.currentTarget as HTMLElement;
			const related = event.relatedTarget;
			if (related && 'nodeType' in related && zone.contains(related as Node)) return;
			// Some engines omit relatedTarget between descendants. Preserve the
			// highlight while the pointer is still inside the actual drop zone.
			if (!related) {
				const rect = zone.getBoundingClientRect();
				if (event.clientX >= rect.left && event.clientX < rect.right && event.clientY >= rect.top && event.clientY < rect.bottom) return;
			}
			clearDrag();
		},
		drop(event: DragEvent): void {
			const transfer = event.dataTransfer;
			if (!transfer || !fileDrag(event)) { clearDrag(); return; }
			// Never let an accepted file drop navigate the review document.
			allowDrop(event);
			const files = Array.from(transfer.files);
			clearDrag();
			void open(files);
		},
		dragend(): void { clearDrag(); },
	};
}
