import { html } from 'lit';

/** Keyboard ownership guidance supplements the toolbar's generated API. */
export function toolbarReference(href: (path: string) => string) {
	return html`
		<section class="api-section" id="api-toolbar-guide" tabindex="-1" aria-labelledby="api-toolbar-guide-title">
			<h3 id="api-toolbar-guide-title">Toolbar keyboard ownership</h3>
			<p>The main live example above demonstrates command buttons. <a href=${href('/api-examples/mixed-toolbar')}>Try the mixed-control toolbar</a> in a complementary interactive example.</p>
			<dl>
				<dt><code>keyboard-navigation="auto"</code> (default)</dt>
				<dd>Direct native buttons and <code>en-button</code> children use a remembered Tab entry. Arrow keys follow <code>orientation</code>; Home and End reach the first and last available buttons. Horizontal navigation respects reading direction. Tab leaves the composite, and disabled or loading buttons are skipped.</dd>
				<dt><code>keyboard-navigation="tab"</code></dt>
				<dd>Fields, selects, sliders, nested composites and actions form a labelled group with ordinary sequential keyboard focus. The outer group does not intercept arrow keys, Home, End, text selection or popup interaction. Compound controls retain their own Tab stops; nested composites retain their own navigation. This mode uses group semantics instead of claiming an ARIA toolbar with a single roving entry.</dd>
			</dl>
			<pre dir="ltr"><code>&lt;en-toolbar label="Artwork settings" keyboard-navigation="tab"&gt;
	&lt;en-text-field label="Find a layer"&gt;&lt;/en-text-field&gt;
	&lt;en-select label="Layer type"&gt;&lt;/en-select&gt;
	&lt;en-button&gt;Apply&lt;/en-button&gt;
&lt;/en-toolbar&gt;</code></pre>
			<p>Register the slotted elements separately and configure each through its own public API. Label every control as well as the group. The toolbar manages navigation only: application code owns values, commands, loading and outcomes.</p>
			<h4>Choose mixed delivery explicitly for SSR</h4>
			<p>Use <code>keyboard-navigation="tab"</code> for known mixed content and opaque third-party shadow wrappers. The labelled group is then present in SSR and remains the same after hydration. Automatic mode conservatively falls back to Tab order when it discovers other interactive children, wrappers containing controls or unknown custom elements; it does not inspect private shadow trees. That discovery happens after connection and is a fallback, not a promise that the server inspects all children.</p>
			<p>Adding or removing controls updates automatic mode without replacing authored nodes. Switching to Tab delivery restores toolbar-owned button tab stops to their authored values. In a button-only toolbar, roving navigation starts after upgrade; before JavaScript, buttons retain their ordinary independent Tab stops. This implementation does not claim fully roving mixed-widget navigation.</p>
			<h4>Slots and layout</h4>
			<p>The default slot preserves your controls. <code>::part(base)</code> exposes group layout, and <code>--en-space-actions</code> sets the shared action gap. Horizontal groups wrap at narrow widths while preserving logical DOM order; they do not automatically create an overflow menu. <code>orientation</code> sets layout in either mode and the arrow-key axis only in button-only roving mode. Medium needs no <code>size</code> attribute; children can opt into a containing size with <code>size="inherit"</code>.</p>
			<p><a href="#api-attributes">Keyboard navigation attributes</a> · <a href="#api-slots">Slotted content reference</a> · <a href="#api-cssParts">Layout Parts reference</a></p>
		</section>
	`;
}
