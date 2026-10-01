import { html } from 'lit';
import type { TableColumnDefinition } from '@en-reve/primitives/state/table.js';
import type { TableColumn } from '@en-reve/primitives/templates/table.js';
import type { Asset, AssetsState } from './model.js';
import type { AssetsActions } from './template.js';

export const assetColumnDefinitions: readonly TableColumnDefinition<Asset>[] = [
	{ key: 'name', label: 'Name', compare: (a, b) => a.name.localeCompare(b.name, 'en') },
	{ key: 'type', label: 'Type', compare: (a, b) => a.kind.localeCompare(b.kind, 'en') },
	{ key: 'modified', label: 'Updated', compare: (a, b) => a.modified.localeCompare(b.modified, 'en') },
	{ key: 'actions', label: 'Actions' },
];

/** Application content stays outside the shared sorting, rows and browser lifecycle. */
export function assetColumns(state: AssetsState, actions: AssetsActions): TableColumn<Asset>[] {
	return [
		{
			...assetColumnDefinitions[0]!, rowHeader: true, width: '42%',
			renderCell: asset => html`
				<label class="assets-choice"><input class="en-radio" type="radio" name="asset" value=${asset.id}
					?checked=${state.selectedId === asset.id} @change=${actions.select}><span>${asset.name}</span></label>
				<p class="assets-note">${asset.description}</p>`,
		},
		{ ...assetColumnDefinitions[1]!, width: '18%', renderCell: asset => asset.kind === 'icon' ? 'Icon' : 'Document' },
		{ ...assetColumnDefinitions[2]!, width: '20%', renderCell: asset => html`<time datetime=${asset.modified}>${asset.modified}</time>` },
		{ ...assetColumnDefinitions[3]!, width: '20%', renderCell: asset => html`<en-button variant="secondary" data-asset-preview=${asset.id} @click=${(event: Event) => actions.preview(event, asset)}>Preview <span class="visually-hidden">${asset.name}</span></en-button>` },
	];
}
