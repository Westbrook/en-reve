# Layout and content recipes

These recipes arrange readable content and application controls without turning a
content collection into an ARIA grid or listbox. They cover reusable list/grid
presentation, file metadata, content surfaces and empty/no-results messages. The
asset browser is a consuming example; it does not add a library transfer service,
router, data source, or specialized `en-asset-browser` element.

## Imports and a complete content example

```js
import { html, render } from 'lit';
import {
	contentCollectionTemplate,
	fileCardTemplate,
	metadataListTemplate,
} from '@en-reve/primitives/templates/content.js';

const files = [
	{ id: 'brief', name: 'Campaign brief', format: 'Text document', modified: '10 September 2026' },
	{ id: 'checklist', name: 'Review checklist', format: 'Text document', modified: '9 September 2026' },
];

render(contentCollectionTemplate({
	label: 'Project documents',
	layout: 'grid',
	items: files,
	key: file => file.id,
	renderItem: file => fileCardTemplate({
		name: html`<h3>${file.name}</h3>`,
		metadata: metadataListTemplate({ items: [
			{ label: 'Format', value: file.format },
			{ label: 'Modified', value: file.modified },
		] }),
	}),
}), document.querySelector('#documents'));
```

For native HTML, link the resolved public CSS file explicitly:

```html
<link rel="stylesheet" href="/vendor/@en-reve/styles/foundations.css">
<link rel="stylesheet" href="/vendor/@en-reve/styles/content.css">
<div id="documents" class="en-foundation"></div>
```

The URL above is an application-served copy of the exported package file, not a
browser-resolvable bare module specifier. In a Lit component, instead import
`foundationStyles` from `@en-reve/styles/foundations.js` and `contentStyles` from
`@en-reve/styles/content.js`, then use `static styles = [foundationStyles, contentStyles]`.
Do not import a raw CSS file as a JavaScript module. Load the application theme as
usual; the stylesheet also supplies the library's generated token fallbacks.

Native HTML uses the same classes without Lit or custom elements:

```html
<ul class="en-foundation en-content-collection" data-layout="list" aria-label="Project documents" role="list">
	<li class="en-content-collection__item">
		<article class="en-card en-file-card">
			<div class="en-file-card__body">
				<div class="en-file-card__content">
					<h3 class="en-file-card__name">Campaign brief</h3>
					<dl class="en-content-metadata">
						<div class="en-content-metadata__item"><dt>Format</dt><dd>Text document</dd></div>
					</dl>
				</div>
			</div>
		</article>
	</li>
</ul>
```

`renderItem` may also supply a registered `en-card` with its existing header/body/
footer slots. The collection styles stretch its public `base` Part where needed;
no private card markup is inspected. A plain native article/div remains equally
valid. Use the semantic element and heading level appropriate to the document.

## Template API

All helpers return Lit `TemplateResult`. `Content` accepts `TemplateResult`, string,
number, `nothing`, `null` or `undefined`; strings/numbers are escaped by Lit. Supply
trusted authored templates for rich content. There is no raw-HTML string option.

| Export | Options | Ownership |
| --- | --- | --- |
| `contentCollectionTemplate<Item>` | `label: string`, `items: readonly Item[]`, `key(item): string`, `renderItem(item): Content`, `layout?: 'grid' \| 'list'`, `type?: 'unordered' \| 'ordered'`, `start?: number`, `reversed?: boolean` | Native `ul`/`li` or `ol`/`li`; layout defaults to grid. Stable unique nonempty keys preserve retained list-item identity. Invalid layout or duplicate/empty keys throw before rendering. |
| `fileCardTemplate` | `name: Content`, optional `description`, `media`, `mediaFallback`, `availability`, `metadata`, `selection`, `actions`, `selected: boolean` | Native content surface. `selected` changes paint only; it does not add selection semantics. |
| `metadataListTemplate` | `items: readonly { label: Content; value: Content }[]` | Native grouped `dl`/`dt`/`dd`. Values and localization remain authored. |
| `emptyStateTemplate` | `title: Content`, optional `description`, `media`, `actions`, `kind: 'empty' \| 'no-results' \| 'unavailable'` | Ordinary in-flow content; no automatic alert/live role, focus movement or recovery handler. |

The corresponding exported types are `Content`, `CollectionLayout`,
`ContentListType`, `EmptyStateKind`, `ContentCollectionOptions<Item>`, `FileCardOptions`, `MetadataItem`,
`MetadataListOptions` and `EmptyStateOptions`.

Optional absent/empty content uses Lit's `nothing`, avoiding phantom empty bindings
and empty layout rows. A supplied zero remains visible. Changing grid/list reuses
the same keyed list nodes. Filtering/removal can remove nodes: the consumer owns
selection retention and any necessary focus continuation.

## Ordered and description lists

Use `type: 'ordered'` when order is part of the meaning, such as handoff steps.
The helper renders native `ol`/`li` with visible decimal markers in both layouts.
`start` accepts a safe integer, including zero or negative numbering; `reversed`
uses the native reversed sequence. Omit `start` for the browser's reversed-list
starting number. Neither option affects unordered lists. Changing only layout or
item content retains keyed list items; changing list type replaces the native
list, so choose semantics when authoring rather than as a visual toggle.

```js
contentCollectionTemplate({
	label: 'Handoff steps',
	type: 'ordered',
	layout: 'list',
	start: 3,
	items: steps,
	key: step => step.id,
	renderItem: step => html`<a href=${step.href}>${step.title}</a>`,
});
```

`metadataListTemplate` provides native description-list groups for labels and
values. Both accept authored content, including `abbr`, `time`, links or formatted
numbers. Use meaningful labels such as Format, Size, Modified and Availability;
the library does not guess file types from extensions or format application data.
Native list semantics and normal Tab order remain intact. No content recipe adds
an implicit composite widget or arrow-key interaction.

## Missing previews and explicit absence states

`fileCardTemplate.mediaFallback` is shown only when `media` is absent. Supplying
neither produces no media region or reserved gap. The application handles image
load failures and updates `media` when it wants to reveal a fallback; the recipe
does not listen for resource events. A long filename remains fully readable,
including when a thumbnail is missing. A fallback can say “Preview unavailable”
while the separately authored metadata still explains the file type and size.

`availability` is optional visible content between description and metadata.
“Available offline”, “Access required” and “Temporarily unavailable” must describe
actual application state. This content does not turn the entire card into a
status/alert, imply a disabled selection, or disable Preview/Download. The
application authors appropriate buttons or native links with meaningful names
and owns their permissions, destinations, `download`, errors and retry behavior.
An absent availability message produces no element, before or after hydration.

`emptyStateTemplate.kind` identifies `empty` (default), `no-results` or
`unavailable` for explicit composition and CSS customization. It does not invent
copy or an icon: optional `media`, `title`, `description` and `actions` are authored.
Use a first-action invitation for an empty collection, Clear filters for no
results, and a contextual Retry action for unavailable data. Keep search and
navigation reachable in each state. The surrounding application may use a
separate restrained live status when appropriate; these messages are not
implicitly announced or focused. Visually distinguish unavailable data through
clear copy rather than assuming it is an empty collection.

## Selection and application actions

Wrap a selectable collection in a native `fieldset` with a visible `legend`.
Supply same-name native radios through each card's `selection` content. Associate
each radio with the asset name using a same-root label/ID or an enclosing label
containing only the radio/name. Keep metadata and Preview buttons outside that
label. Preview needs a distinct accessible name including its asset. The optional
`media` content owns meaningful alternative text, or marks a redundant icon as
decorative; a filename must remain understandable when no thumbnail is available.

The collection itself adds no roving focus, arrow handlers, `tabindex`,
`aria-selected` or `role="grid"`. Native radios retain their normal interaction.
Their native `change` is a noncancelable notification handled by the consuming
application; do not synthesize `en-change` around it. Existing custom search,
segmented and other library controls retain their documented `en-change` contract.

The application keeps its accepted selected ID when filtering removes that item.
Show the retained asset in a visible selection summary, with a real Clear selection
or Show selected action. Do not infer application selection from a hidden/disabled
radio's FormData. On insertion, capture the current selected ID and revalidate the
current asset catalog. Preview, pending work, success/failure, stale result guards
and insertion belong to the application.

Keep “no assets available” and “no matching assets” distinct. Supply useful actions
such as Clear filters only when they actually recover the task. Do not replace the
search field or surrounding navigation with the empty state. A restrained result
count/status is an application concern; the whole collection must not become a
live region. No automatic announcement or loading/error policy is built in.

## Layout, style and theme contract

Both layouts retain DOM order. Grid columns grow intrinsically from the existing
`layout.panel-preferred` fallback and collapse to the available width. List mode
uses compact rows with a leading media preview, content, and trailing actions when
space permits. Metadata sits beside the description in wide rows; narrower rows
keep it below the description and allow actions onto their own line. It does not
change content into a data table. Nothing
forces a fixed height, clips a filename, changes the reading order, or adds an
invisible interaction target. File actions wrap normally; radio/control geometry
comes from their own native or library styles.

File-card media has a centered, padded preview surface with a subtle semantic fill
and a visible boundary. Grid media has a minimum of three control units. List media
uses a square two-control-unit column; content can grow without cropping or clipping.
Default media corners follow the card's outer radius minus its padding and border.
`--en-media-radius` can override that relationship. The media class remains an
ordinary CSS customization surface, and forced colors preserve its boundary.

| Existing hook | Effect |
| --- | --- |
| `--en-grid-item-min` | Grid item preferred minimum; bounded by 100% of available width. |
| `--en-grid-gap` | Gap between collection items. |
| `--en-surface-padding` | Shared file-card and empty-state inset. |
| `--en-surface-background`, `--en-card-background` | Existing surface/card fill precedence. |
| `--en-surface-color` | Card text color. |
| `--en-surface-border-color`, `--en-surface-radius` | Card boundary and corners. Selected card paint uses the semantic action color while its actual radio conveys selection. |
| `--en-media-radius` | File-card preview corners; defaults to the concentric inset of the card. |
| `--en-file-list-gap` | Gap within compact list cards; defaults to `space.3`. |
| `--en-file-list-padding` | Compact list card inset; defaults to `space.3`. |
| `--en-file-list-media-size` | Leading media width; defaults to twice `size.control-min`. |
| `--en-file-list-metadata-gap` | Wide-row gap before metadata; defaults to `space.5`. |

Existing spacing, body/metadata/strong-label typography and action/focus colors
remain theme-driven. Forced colors retain a visible selected boundary. Parent
`.en-foundation` scopes provide the existing size behavior for native recipes;
registered custom elements keep their normal size rules. No new theme token IDs or
material-specific branches are introduced here.

## Complete interactive consumers

The maintained [asset workflow template](../../../apps/docs/src/workflows/assets/template.ts)
composes these exact helpers; its [application controller](../../../apps/docs/src/workflows/assets/index.ts)
owns selection, preview, insertion and reset. The isolated `content-recipes` example
provides the smaller synchronous selection and layout demonstration. The API reference
lists these recipe exports separately from custom-element metadata and links the live
example and this guide; no nonexistent component tag is manufactured for discovery.

## Review and evidence boundaries

The live asset example should exercise search, a retained selection hidden by a
filter, grid/list changes, Preview/Close, and an application-owned insertion
receipt. Review long names, no thumbnail, narrow width, enlarged text, RTL,
forced colors and all inspired appearance pairs. Native SSR output, same-node
hydration and public import/CSS delivery require their own checks.

This guide describes source contracts, not completed browser or human acceptance.
For authored sortable tables, use the separate [en-table pattern](../../elements/src/table/README.md).
Virtualization, remote search, transfer, tree navigation, drag/drop,
multi-selection, and rich editing are separate work. Pure recipe exports are
listed separately from CEM custom-element APIs; documentation must not invent tags
or count recipes as additional accepted elements.


## Retained-content loading

`fileCardTemplate`, `metadataListTemplate`, and `emptyStateTemplate` accept an
optional `placeholders: true`. It prepares each authored field for loading; it
**does not start loading**. Omit it to retain the existing recipe markup.
`contentPlaceholderTemplate(content, 'text' | 'rectangle')` offers the same
composition for ordered steps or other flow content. It is a block wrapper; do
not place it inside a paragraph or other phrasing-only container.

Register `@en-reve/elements/define/skeleton.js` in the consuming application and
include `contentStyles` as usual. Primitives do not register custom elements.

```typescript
import { html } from 'lit';
import { fileCardTemplate, metadataListTemplate } from '@en-reve/primitives/templates/content.js';
import '@en-reve/elements/define/skeleton.js';

const view = (loading: boolean) => html`
	<div class="en-content-loading" aria-busy=${String(loading)}>
		<div ?inert=${loading}>
			${fileCardTemplate({
				placeholders: true,
				name: 'Campaign brief',
				description: 'A short brief for the next studio review.',
				mediaFallback: 'Aa',
				metadata: metadataListTemplate({ placeholders: true, items: [{ label: 'Format', value: 'Markdown' }] }),
			})}
		</div>
	</div>
`;
```

The original authored nodes remain in flow. Each name, description, availability,
metadata label/value and action envelope receives its own decorative skeleton.
Media fills the existing media box; card borders, padding, list columns and gaps
remain visible. Text bars follow inherited line height across wrapped fields.
For typography supplied inside a custom heading, apply matching typography to
its containing field or put the helper at the text's own typography boundary.
Metadata is independently authored: enable its own `placeholders` rather than
covering the whole definition list with a single rectangle.

The enclosing region owns `aria-busy`, `inert`, any concise status message, and
focus policy. Keep the loading control outside it. Before starting a refresh
from inside the region, deliberately move focus to a persistent meaningful
control; do not make a focused descendant inert without a recovery destination.
Skeletons are decorative and stationary, including reduced-motion settings.
There is no focus movement, announcement, cloned content, DOM measurement or
animation in these helpers.

This is **known-content refresh geometry**, not a way to predict unknown initial
data. Where useful, leave already readable content visible during a background
refresh instead. For first loads, authors can supply representative non-sensitive
content to establish expected media ratios, line counts and actions, with the
region busy and inert in the server response. Unknown lengths still require an
application decision; no placeholder can guarantee dimensions for arbitrary
future content. The same authored structure is hydrated in place; changing only
the region state preserves node identity and selection.
