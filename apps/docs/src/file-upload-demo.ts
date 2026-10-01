import { html, nothing } from 'lit';
import { AsyncDirective, directive } from 'lit/async-directive.js';
import { ref } from 'lit/directives/ref.js';

/** This application-owned fixture never reads file contents or starts a network request. */
class FileUploadDemo extends AsyncDirective {
	private field?: HTMLElement & { files: readonly File[]; updateComplete: Promise<unknown> };
	private files: readonly File[] = [];
	private phase: 'idle' | 'ready' | 'pending' | 'failed' | 'complete' = 'idle';
	private status = 'Choose files to prepare a local transfer simulation.';
	private resetKey: unknown;
  private progress = 0;
  private timer?: ReturnType<typeof setInterval>;
  private stop() { clearInterval(this.timer); this.timer = undefined; }
  protected override disconnected() { this.stop(); if (this.phase === 'pending') { this.phase = 'ready'; this.status = 'Simulation paused. Start again to retry.'; } }
  private start() {
    this.stop(); this.progress = 0;
    this.timer = setInterval(() => {
      if (!this.isConnected || this.phase !== 'pending') { this.stop(); return; }
      this.progress = Math.min(100, this.progress + 5);
      if (this.progress === 100) this.transition('complete');
      else this.setValue(this.render(this.resetKey));
    }, 500);
  }
	private connect = (element: Element | undefined) => {
		this.field = element as typeof this.field;
		const field = this.field;
		if (!field) return;
		// The docs shell hydrates before loading the specimen's element definitions.
		// Wait for that upgrade, then read any native selection adopted during hydration.
		void field.ownerDocument.defaultView?.customElements.whenDefined('en-file-upload').then(async () => {
			await field.updateComplete;
			if (!this.isConnected || this.field !== field || !field.files.length || this.files === field.files) return;
			this.files = field.files; this.phase = 'ready';
			this.status = `${this.files.length} file(s) ready. Nothing has been transferred.`;
			this.setValue(this.render(this.resetKey));
		});
	};
	private changed = (event: Event) => {
		const field = event.currentTarget as NonNullable<typeof this.field>;
		if (event.composedPath()[0] !== field || !event.cancelable) return;
		// Selection is provisional during en-change; consume only the accepted transaction.
		const proposed = field.files;
		queueMicrotask(() => {
			if (!this.isConnected || event.defaultPrevented || this.field !== field || field.files !== proposed) return;
			this.stop(); this.progress = 0;
			this.files = proposed;
			this.phase = proposed.length ? 'ready' : 'idle';
			this.status = proposed.length ? `${proposed.length} file(s) ready. Nothing has been transferred.` : 'No files selected.';
			this.setValue(this.render(this.resetKey));
		});
	};
	private transition(phase: 'pending' | 'failed' | 'complete' | 'ready') {
		if (!this.files.length) return;
		this.stop();
		this.phase = phase;
		if (phase === 'pending') this.start();
		if (phase === 'complete') this.progress = 100;
		this.status = phase === 'pending' ? 'Simulated transfer in progress. It will finish automatically; you can also complete, fail or cancel it.'
			: phase === 'failed' ? 'Simulated connection failure. Your files are retained; retry when ready.'
			: phase === 'complete' ? `Simulation complete for ${this.files.length} file(s). No files were sent or added to a server.`
			: 'Simulated transfer canceled. Your files are retained.';
		this.setValue(this.render(this.resetKey));
	}
	private reset = () => {
		this.stop(); this.progress = 0;
		if (this.field) this.field.files = [];
		this.files = []; this.phase = 'idle'; this.status = 'Files and transfer simulation reset.';
		this.setValue(this.render(this.resetKey));
	};
	render(resetKey: unknown = 0) {
		if (this.resetKey !== resetKey) {
			this.stop(); this.progress = 0;
			this.resetKey = resetKey;
			if (this.field) this.field.files = [];
			this.files = []; this.phase = 'idle'; this.status = 'Choose files to prepare a local transfer simulation.';
		}
		const pending = this.phase === 'pending';
		return html`
			<style>.file-upload-demo:has(en-file-upload[dragging]) { outline: var(--en-input-focus-width, 2px) dashed var(--en-input-focus-color, currentColor); outline-offset: var(--en-space-2); }</style>
      <div id="file-upload-surface" class="file-upload-demo" style="display:grid;gap:var(--en-space-4);min-inline-size:0;overflow-wrap:anywhere">
				<p style="margin:0">Drop files anywhere in this example, or use Choose files. Then try a successful transfer, a connection failure and retry. This fixture keeps file references in this page; it does not read or send their contents.</p>
				<en-file-upload id="file-upload-choice" for="file-upload-surface" ${ref(this.connect)} name="study-files" multiple accept="image/png,image/jpeg,application/pdf" max-file-size="5000000" ?disabled=${pending} @en-change=${this.changed}>
					<span slot="label">Study files</span>
					<span slot="description">PNG, JPEG or PDF, up to 5 MB per file. A new choice replaces the current selection.</span>
				</en-file-upload>
				<div style="display:flex;flex-wrap:wrap;gap:var(--en-space-2);align-items:center">
					<en-button ?disabled=${this.phase !== 'ready'} @click=${() => this.transition('pending')}>Start simulated transfer</en-button>
					<en-button variant="secondary" ?disabled=${!pending} @click=${() => this.transition('complete')}>Complete transfer</en-button>
					<en-button variant="secondary" ?disabled=${!pending} @click=${() => this.transition('failed')}>Fail transfer</en-button>
					<en-button variant="secondary" ?disabled=${this.phase !== 'failed'} @click=${() => this.transition('pending')}>Retry transfer</en-button>
					<en-button variant="secondary" ?disabled=${!pending} @click=${() => this.transition('ready')}>Cancel transfer</en-button>
					<en-button variant="ghost" @click=${this.reset}>Reset files</en-button>
				</div>
				${pending ? html`<en-progress-bar label="Simulated transfer" .value=${this.progress}></en-progress-bar><p data-upload-progress style="margin:0">${this.progress}% · Local simulation</p>` : nothing}
				<p data-upload-status role="status" aria-atomic="true" style="margin:0">${this.status}</p>
				${this.phase === 'complete' ? html`<p data-upload-receipt style="margin:0">Local receipt: ${this.files.map(file => file.name).join(', ')}.</p>` : nothing}
			</div>
		`;
	}
}
const fileUploadDemo = directive(FileUploadDemo);
export function fileUploadExample(resetKey: unknown = 0) { return html`${fileUploadDemo(resetKey)}`; }
