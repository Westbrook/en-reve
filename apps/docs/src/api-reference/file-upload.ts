import { html } from 'lit';

export function fileUploadReference(href: (path: string) => string) {
	return html`
		<section class="api-section" id="api-file-upload-guide" tabindex="-1" aria-labelledby="api-file-upload-guide-title">
			<h3 id="api-file-upload-guide-title">File intake and transfer ownership</h3>
			<p><a href=${href('/api-examples/file-upload')}>Try file selection and transfer recovery</a>, including picker selection, dropping files, removal and a local transfer simulation. The same recipe is available in <a href=${href('/workflows/assets#assets-file-intake')}>Bring your own study files in the Asset browser</a>.</p>
			<h4>For people choosing files</h4>
			<p>Use the file chooser with a keyboard or touch, or drop files onto the control. Dropping is an additional input path; it is never required. Choosing again replaces the entire selection. With multiple selection enabled, choose the desired files together. Remove an individual file with its named Remove button. Canceling the chooser keeps the existing selection.</p>
			<p>A rejected batch leaves the previous selection intact and explains what needs to change. This demo accepts PNG, JPEG and PDF files up to 5 MB each. File selection alone does not upload anything. The simulation controls explicitly move between pending, failed, retried and completed states without reading or sending file contents.</p>
			<h4>For application developers</h4>
			<pre dir="ltr"><code>&lt;en-file-upload name="attachments" multiple
	accept="image/png,image/jpeg,application/pdf" max-file-size="5000000"&gt;
	&lt;span slot="label"&gt;Study files&lt;/span&gt;
	&lt;span slot="description"&gt;PNG, JPEG or PDF, up to 5 MB each.&lt;/span&gt;
&lt;/en-file-upload&gt;</code></pre>
			<p>The <code>files</code> property contains a readonly array of browser File objects. Assign a replacement array to control selection; assign <code>[]</code> to clear it. There is no files attribute. Selected files participate in native form data under repeated entries for <code>name</code>; a native form reset clears selection. <code>required</code>, <code>disabled</code> and the element’s validity methods follow the field family.</p>
			<p>Selection, dropping and removal use one cancelable <code>en-change</code> event. The proposed <code>files</code> value is available during the handler. Cancel synchronously to retain the prior selection. For asynchronous approval, cancel first and write the accepted files later; an asynchronous call to <code>preventDefault()</code> is too late. Silent property writes do not emit another user-change event.</p>
			<p><code>accept</code>, <code>multiple</code> and <code>max-file-size</code> apply to picker and drop candidates. A failing batch is rejected atomically, emits <code>en-reject</code> with file-specific reasons, and preserves the old files. MIME types and file extensions are local hints, not proof of the file’s contents. A real upload service must perform its own validation and authorization. This component does not implement transfer, progress, retries, scanning, directories or resumable uploads.</p>
			<h4>For designers and theme authors</h4>
			<p>The intake surface inherits field typography, sizing, borders, focus and spacing tokens. Use the generated Parts and custom property tables below for focused changes. Keep the chooser visible, preserve readable rejection text, and give removal actions enough space in narrow layouts. Label and description accept attributes or slots. Localize removal and rejection messages through the documented properties. Transfer progress and receipts are composed from surrounding patterns so their appearance can match the application.</p>
			<h4>For agents and generated applications</h4>
			<p>Use the generated component manifest for exact property, event, method and Part names. Render the label and description in the initial HTML with an empty file selection; browser File objects are not serialized into SSR markup. Preserve any native files chosen before hydration; the element adopts that early selection without synthesizing a user-change event. Read its files property after the initial update to synchronize application state. Use the application’s own transfer service after accepted selection and expose pending, failure, cancellation and retry explicitly. Never infer successful transfer from the selection event.</p>
      <h4>Associate a larger drop surface</h4>
      <p>Use <code>for="surface-id"</code> to associate an additional element in the same document or shadow root. Assign <code>dropTarget</code> to an element reference for cross-root composition; it takes precedence over <code>for</code>. The nearest associated surface owns a drop, including when disabled. Conflicting associations reject files rather than selecting an arbitrary uploader. Non-file drags remain available to the application. Read-only <code>dragging</code> reflects for styling; the native picker remains the keyboard alternative.</p>
      <pre dir="ltr"><code>&lt;section id="upload-area"&gt;
  &lt;h3&gt;Project attachments&lt;/h3&gt;
  &lt;en-file-upload for="upload-area" label="Choose attachments" multiple&gt;&lt;/en-file-upload&gt;
&lt;/section&gt;</code></pre>
      <p>The live example has determinate, application-owned progress. Start, fail, retry, cancel and complete update the simulation; retry begins at zero and stale timers cannot revive canceled work. No file contents are read or transmitted. These are demo actions, not transport methods or events on the selection element.</p>

		</section>
	`;
}
