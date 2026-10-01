import { html } from 'lit';
import { sourceCode } from '../specimen-source.js';

/** Authored recipe documentation is separate from the generated element manifest. */
export function contentRecipesReference(href: (path: string) => string, highlight: (event: Event) => void) {
	return html`
		<section class="api-section" id="api-content-recipes" aria-labelledby="api-content-recipes-title">
			<h2 id="api-content-recipes-title">Layout and content recipes</h2>
			<p>Compose native lists, file cards, metadata and empty states with the same theme tokens as the elements. These functions return Lit templates; they add no element registration, selection model or application service.</p>
			<pre><code>import { contentCollectionTemplate, fileCardTemplate, metadataListTemplate, emptyStateTemplate } from '@en-reve/primitives/templates/content.js';</code></pre>
			<p>For a Lit shadow root, include <code>contentStyles</code> from <code>@en-reve/styles/content.js</code> in its static styles. For document content, serve <code>@en-reve/styles/content.css</code> at your chosen URL and load it with an ordinary stylesheet link. Keep the surrounding theme tokens available in either case.</p>
			<dl>
				<dt><code>contentCollectionTemplate({ label, type, start, reversed, layout, items, key, renderItem })</code></dt>
				<dd>A named native list. Set <code>type="ordered"</code> for an ordered list; <code>start</code> and <code>reversed</code> follow native ordered-list numbering. <code>layout</code> is <code>grid</code> by default or <code>list</code>. The list layout compacts media, content, metadata and actions into responsive rows. Supply unique, stable string keys to retain item nodes across grid/list changes; selection and filtering belong to the application.</dd>
				<dt><code>fileCardTemplate({ name, description, media, mediaFallback, availability, metadata, selection, actions, selected })</code></dt>
				<dd>A content surface with authored regions. Only <code>name</code> is required. <code>mediaFallback</code> fills an absent media region. <code>availability</code> is visible text, not an implicit alert or disabled-state policy. <code>selected</code> changes appearance; a real input or other appropriate control must convey selection. Keep Preview and other actions outside selection labels.</dd>
				<dt><code>metadataListTemplate({ items })</code></dt>
				<dd>A native definition list of <code>{ label, value }</code> entries. Supply localized values and meaningful labels.</dd>
				<dt><code>emptyStateTemplate({ title, description, media, actions, kind })</code></dt>
				<dd>In-flow guidance. <code>kind</code> distinguishes <code>empty</code>, <code>no-results</code> and <code>unavailable</code>; it does not fetch data or change accessibility roles. Supply an appropriate heading and a real recovery action; this recipe adds no live announcement or focus movement.</dd>
			</dl>
			<p>Content values accept escaped text, numbers or authored Lit templates. The collection supports <code>--en-grid-gap</code> and <code>--en-grid-item-min</code>; card surfaces share <code>--en-surface-*</code> overrides. Reuse the exported classes with native HTML where a template function is unnecessary.</p>
			<p>For tabular comparisons, use <code>en-table</code> around one authored native <code>table</code>. Keep its caption, column headers and row headers in the author tree. Include <code>tableStyles</code> from <code>@en-reve/styles/table.js</code> in that tree's Lit static styles, or use a native link to the served <code>table.css</code>. The shell owns overflow; the application owns sorting, selection and any data updates. <a href=${href('/api-reference?component=en-table')}>Explore the table API and live example</a>.</p>
			<p>Use “Preview loading placeholders” in the example to compare loading with the current content, including empty and unavailable states. <code>en-skeleton</code> supplies decorative text and rectangle shapes; its size and color are themeable. The surrounding region owns <code>aria-busy</code>, status and interaction. These placeholders are static, so reduced-motion preferences need no animation override. This demonstration retains existing content dimensions and selection while loading; an initial fetch should reserve an estimated footprint before data exists.</p>
			<iframe class="api-content-demo" title="Layout and content recipes live example" src="/api-examples/content-recipes.html" loading="lazy"></iframe>
			<p><a href=${href('/api-examples/content-recipes.html')}>Open this example</a> · <a href="/reviews/content-recipes.md">Read the complete recipe guide</a> · <a href=${href('/workflows/assets')}>Review the asset-browser workflow</a></p>
			<details class="api-example" data-syntax-theme="github" @toggle=${highlight}><summary>View authored recipe example</summary><pre>${sourceCode('content-recipes')}</pre></details>
		</section>
	`;
}
