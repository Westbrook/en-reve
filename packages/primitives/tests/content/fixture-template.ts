import { html } from 'lit';
import { contentCollectionTemplate, emptyStateTemplate, fileCardTemplate, metadataListTemplate, type CollectionLayout } from '../../src/templates/content.js';

export const initialState = () => ({ layout: 'list' as CollectionLayout, availability: '', media: false, filtered: false, selected: false, loading: false });
export function fixtureTemplate(state = initialState(), update: (patch: Partial<ReturnType<typeof initialState>>) => void = () => {}) {
	return html`
		<h1>Content recipe review</h1>
		<button @click=${() => update({ layout: state.layout === 'list' ? 'grid' : 'list' })}>Change layout</button>
		<section id="ordered">${contentCollectionTemplate({
			label: 'Handoff steps', type: 'ordered', start: 5, reversed: true, layout: state.layout,
			items: [{ id: 'review', label: 'Review draft' }, { id: 'approve', label: 'Approve content' }, { id: 'publish', label: 'Publish work' }],
			key: item => item.id, renderItem: item => html`<button data-key=${item.id}>${item.label}</button>`,
		})}</section>
		<section id="assets">${state.filtered ? emptyStateTemplate({
			kind: 'no-results', title: html`<h2>No matching files</h2>`, description: 'Clear filters to see the project files.',
			actions: html`<button @click=${() => update({ filtered: false })}>Clear filters</button>`,
		}) : contentCollectionTemplate({
			label: 'Project files', layout: state.layout, items: ['brief'], key: item => item,
			renderItem: () => fileCardTemplate({
				name: html`<h2>Überarbeiteter_Projektentwurf_ファイル_版本_verylongfilenamewithoutspacesforreview.pdf</h2>`,
				description: 'Final notes for the creative review.',
				media: state.media ? html`<svg aria-label="Page preview" role="img" viewBox="0 0 60 40"><rect width="60" height="40" fill="currentColor" /></svg>` : undefined,
				mediaFallback: 'No preview available', availability: state.availability,
				metadata: metadataListTemplate({ items: [
					{ label: 'Format', value: 'PDF document' }, { label: 'Size', value: '2.4 MB' },
					{ label: html`<abbr title="Revision">Rev.</abbr>`, value: 0 },
				] }),
				selection: html`<input type="checkbox" aria-label="Select project draft" .checked=${state.selected} @change=${(event: Event) => update({ selected: (event.target as HTMLInputElement).checked })}>`,
				selected: state.selected,
				actions: html`<button @click=${() => update({ availability: 'Available offline' })}>Check availability</button><a href="data:text/plain,Project%20draft" download="draft.txt">Download project draft</a>`,
			}),
		})}</section>
		<section id="minimal">${fileCardTemplate({ name: 'Notes.txt', metadata: metadataListTemplate({ items: [{ label: 'Size', value: '0 bytes' }] }) })}</section>
		<button @click=${() => update({ filtered: true })}>Find missing file</button>
		<section id="empty">${emptyStateTemplate({ kind: 'empty', title: html`<h2>No project files yet</h2>`, description: 'Add the first project file when it is ready.' })}</section>
		<section id="unavailable">${emptyStateTemplate({ kind: 'unavailable', title: html`<h2>Files are unavailable</h2>`, media: html`<span aria-hidden="true">!</span>`, description: 'The saved files are still part of your project.', actions: html`<button @click=${() => update({ availability: 'Available offline' })}>Retry connection</button>` })}</section>
		<button @click=${() => update({ loading: !state.loading })}>Toggle retained loading</button>
		<section id="retained" class="en-content-loading" aria-busy=${String(state.loading)}>
			<div ?inert=${state.loading}>${fileCardTemplate({ placeholders: true,
				name: 'Retained review file with a longer title', description: 'An authored description whose wrapping follows the available width and typography.',
				mediaFallback: 'Aa', metadata: metadataListTemplate({ placeholders: true, items: [{ label: 'Type', value: 'Text document' }] }),
				selection: html`<input type="checkbox" aria-label="Select retained file">`,
				actions: html`<button>Open retained file</button>`,
			})}</div>
		</section>

	`;
}
