export type AssetKind = 'icon' | 'document';
export type AssetLayout = 'grid' | 'list' | 'table';
export type AssetSortField = 'name' | 'type' | 'modified';
export type AssetSort = 'original' | `${AssetSortField}-${'ascending' | 'descending'}`;
export const assetSortChoices: readonly { value: AssetSort; label: string }[] = [
	{ value: 'original', label: 'Original order' },
	{ value: 'name-ascending', label: 'Name: A to Z' },
	{ value: 'name-descending', label: 'Name: Z to A' },
	{ value: 'type-ascending', label: 'Type: A to Z' },
	{ value: 'type-descending', label: 'Type: Z to A' },
	{ value: 'modified-descending', label: 'Updated: newest first' },
	{ value: 'modified-ascending', label: 'Updated: oldest first' },
];
export type AssetFilter = 'all' | AssetKind;
export type AssetDelivery = 'windowed' | 'paginated';
export interface Asset {
	readonly id: string;
	readonly name: string;
	readonly kind: AssetKind;
	readonly description: string;
	readonly format: string;
	readonly modified: string;
	readonly icon?: 'sparkles' | 'arrow-right' | 'check' | 'search' | 'info' | 'warning';
	readonly excerpt?: string;
}
/** These records contain only bundled library symbols and authored text, not remote media. */
export const assets: readonly Asset[] = [
	{ id: 'sparkle-mark', name: 'Sparkle mark', kind: 'icon', description: 'A small accent for a new idea.', format: 'Library SVG symbol', modified: '2026-09-08', icon: 'sparkles' },
	{ id: 'direction-arrow', name: 'Direction arrow', kind: 'icon', description: 'A directional symbol for a next action.', format: 'Library SVG symbol', modified: '2026-09-08', icon: 'arrow-right' },
	{ id: 'approval-check', name: 'Approval check', kind: 'icon', description: 'A check symbol for a completed review.', format: 'Library SVG symbol', modified: '2026-09-08', icon: 'check' },
	{ id: 'search-symbol', name: 'Search symbol', kind: 'icon', description: 'A magnifying glass for finding content.', format: 'Library SVG symbol', modified: '2026-09-07', icon: 'search' },
	{ id: 'information-symbol', name: 'Information symbol', kind: 'icon', description: 'A marker for supporting information.', format: 'Library SVG symbol', modified: '2026-09-07', icon: 'info' },
	{ id: 'warning-symbol', name: 'Warning symbol', kind: 'icon', description: 'A warning symbol with a clear text label.', format: 'Library SVG symbol', modified: '2026-09-07', icon: 'warning' },
	{ id: 'campaign-brief', name: 'Campaign brief', kind: 'document', description: 'A short brief for the next studio review.', format: 'Plain text excerpt', modified: '2026-09-09', excerpt: 'Create a small set of launch materials. Keep headings editable, describe image choices, and include a narrow-screen layout. Share a first study with the project team.' },
	{ id: 'review-checklist', name: 'Review checklist', kind: 'document', description: 'A reminder of what to check before sharing.', format: 'Plain text excerpt', modified: '2026-09-09', excerpt: 'Check the title and reading order. Try the primary task with a keyboard. Review text at a larger size. Confirm that changes can be recovered before sharing.' },
	{ id: 'usage-notes', name: 'Usage notes', kind: 'document', description: 'Guidance for using these local examples.', format: 'Plain text excerpt', modified: '2026-09-09', excerpt: 'These examples use bundled symbols and short text excerpts. The insertion receipt belongs to this page; it does not modify a project or upload a file.' },
];
/** Opt-in deterministic catalog; the original nine keys stay available in both sizes. */
export function largeAssets(): readonly Asset[] {
	return [...assets, ...Array.from({ length: 991 }, (_, index) => {
		const original = assets[index % assets.length]!;
		const number = String(index + 10).padStart(4, '0');
		return { ...original, id: `study-${number}`, name: `Study ${number} · ${original.name}` };
	})];
}
export interface AssetReceipt { readonly sequence: number; readonly assetId: string; readonly name: string; }
export interface AssetsState {
	readonly records: readonly Asset[];
	readonly catalog: 'sample' | 'large';
	readonly delivery: AssetDelivery;
	readonly query: string;
	readonly filter: AssetFilter;
	readonly layout: AssetLayout;
	readonly sort: AssetSort;
	readonly selectedId: string;
	readonly previewId: string;
	readonly pending: { readonly assetId: string; readonly name: string } | undefined;
	readonly receipt: AssetReceipt | undefined;
	readonly status: string;
}
export function createAssetsState(): AssetsState {
	return { records: assets, catalog: 'sample', delivery: 'windowed', query: '', filter: 'all', layout: 'grid', sort: 'original', selectedId: '', previewId: '', pending: undefined, receipt: undefined, status: '' };
}
export function visibleAssets(state: Pick<AssetsState, 'query' | 'filter' | 'sort'> & { readonly records?: readonly Asset[] }): readonly Asset[] {
	const words = state.query.trim().toLocaleLowerCase('en').split(/\s+/u).filter(Boolean);
	const visible = (state.records ?? assets).filter(asset => (state.filter === 'all' || asset.kind === state.filter)
		&& words.every(word => `${asset.name} ${asset.description} ${asset.format}`.toLocaleLowerCase('en').includes(word)));
	if (state.sort === 'original') return visible;
	const [field, direction] = state.sort.split('-');
	const key = (asset: Asset) => field === 'type' ? asset.kind : field === 'modified' ? asset.modified : asset.name;
	return visible.sort((a, b) => {
		const order = key(a).localeCompare(key(b), 'en', { sensitivity: 'base' });
		return (direction === 'descending' ? -order : order) || a.name.localeCompare(b.name, 'en') || a.id.localeCompare(b.id, 'en');
	});
}
