import type { LitElement } from 'lit';
import { TableModel } from '@en-reve/primitives/state/table.js';
import { TableController, type TableSurface } from '@en-reve/primitives/interactions/table.js';
import { assetColumns, assetColumnDefinitions } from './table.js';
import { createRef } from 'lit/directives/ref.js';
import { afterAcceptedChange } from '../../change-consumption.js';
import { createRequestLane } from '../shared/request-lane.js';
import type { WorkflowOptions } from '../shared/workflow.js';
import { assets, largeAssets, visibleAssets, assetSortChoices, createAssetsState, type Asset, type AssetFilter, type AssetLayout, type AssetSort } from './model.js';
import { createAssetService } from './service.js';
import { assetsTemplate, type AssetField, type AssetsActions, type AssetsRefs } from './template.js';
export { assetsStyles } from './styles.js';

/** Construction is pure; timers, DOM reads and focus occur only after user interaction. */
export function createAssetsWorkflow({ requestUpdate }: WorkflowOptions) {
	let state = createAssetsState();
	let uploadReset = 0;
	let disposed = false;
	let previewOrigin: HTMLElement | undefined;
	let previewOriginId = '';
	let pendingCollectionFocus: { original: HTMLElement; id: string; action: 'preview' | 'selection' } | undefined;
	let focusRequest = 0;
	let pendingPreviewFocus = '';
	let initialSelectionRead = false;
	const lane = createRequestLane();
	const service = createAssetService();
	const refs: AssetsRefs = { root: createRef(), search: createRef(), collectionHeading: createRef() };
	let tableHost: LitElement | undefined;
	let tableController: TableController<Asset> | undefined;
	const table = new TableModel<Asset>({ items: state.records, key: asset => asset.id, columns: assetColumnDefinitions, mode: 'all', pageSize: 20, initialCount: 20, estimateSize: 100 });
	let previousRecords = state.records;
	let previousQuery = state.query;
	let previousFilter = state.filter;
	let previousSort = state.sort;
	const syncTable = () => {
		if (previousRecords !== state.records || previousQuery !== state.query || previousFilter !== state.filter) {
			table.setItems(visibleAssets({ ...state, sort: 'original' }));
			if (previousQuery !== state.query || previousFilter !== state.filter) table.setPage(0);
			previousRecords = state.records; previousQuery = state.query; previousFilter = state.filter;
		}
		if (previousSort !== state.sort) {
			const [column, direction] = state.sort.split('-');
			table.setSort(state.sort === 'original' ? undefined : { column: column!, direction: direction as 'ascending' | 'descending' });
			previousSort = state.sort;
		}
		table.setMode(state.catalog === 'sample' ? 'all' : state.layout === 'table' ? state.delivery : 'paginated');
	};
	const update = () => { if (!disposed) { syncTable(); requestUpdate(); } };
	const usable = (element: HTMLElement | null | undefined): element is HTMLElement => Boolean(element?.isConnected
		&& element.getClientRects().length && !element.closest('[hidden],[inert]')
		&& !element.matches(':disabled,[disabled],[aria-disabled="true"]'));
	const restorePreviewFocus = () => {
		if (usable(previewOrigin)) previewOrigin.focus();
		else {
			const replacement = refs.root.value?.querySelector<HTMLElement>(`[data-asset-preview="${previewOriginId}"]`);
			if (usable(replacement)) replacement.focus();
			else refs.collectionHeading.value?.focus();
		}
	};
	const afterClick = (event: Event, operation: () => void) => {
		queueMicrotask(() => { if (!disposed && !event.defaultPrevented) operation(); });
	};
	const clearNativeSelection = () => {
		for (const radio of refs.root.value?.querySelectorAll<HTMLInputElement>('input[type=radio][name=asset]') ?? []) radio.checked = false;
	};
	const reset = () => {
		if (disposed) return;
		lane.cancel(); service.reset(); ++uploadReset; ++focusRequest; pendingPreviewFocus = '';
		const active = refs.root.value?.ownerDocument.activeElement;
		if (active instanceof Element && active.closest('.assets-preview')) restorePreviewFocus();
		previewOrigin = undefined; previewOriginId = ''; pendingCollectionFocus = undefined;
		state = { ...createAssetsState(), status: 'Asset browser reset. Filters, selection, preview and the insertion receipt are clear.' };
		// A same-value author write reconciles an unfinished native field draft too.
		if (refs.search.value) refs.search.value.value = '';
		clearNativeSelection();
		update();
	};
	const insert = async () => {
		if (disposed) return;
		if (lane.pending) { state = { ...state, status: `Already inserting ${state.pending?.name ?? 'the selected asset'}.` }; update(); return; }
		const asset = state.records.find(asset => asset.id === state.selectedId);
		if (!asset) { state = { ...state, status: 'Choose an asset before inserting.' }; update(); return; }
		const request = lane.begin();
		if (!request) return;
		state = { ...state, pending: { assetId: asset.id, name: asset.name }, status: `Inserting ${asset.name} locally.` }; update();
		try {
			const receipt = await service.insert(asset, request);
			if (!request.isCurrent()) return;
			state = { ...state, pending: undefined, receipt, status: `${receipt.name} inserted locally. Insertion ${receipt.sequence}.` };
			update();
		} catch {
			if (!request.isCurrent()) return;
			state = { ...state, pending: undefined, status: `The local insertion of ${asset.name} did not complete. Try Insert selected asset again.` };
			update();
		} finally { request.finish(); }
	};
	const actions: AssetsActions = {
		catalog(event) { afterAcceptedChange<AssetField, string>(event, field => field.value, catalog => {
			if (disposed || (catalog !== 'sample' && catalog !== 'large')) return;
			const records = catalog === 'large' ? largeAssets() : assets;
			state = { ...state, catalog, records, layout: catalog === 'large' ? 'table' : state.layout,
				selectedId: records.some(asset => asset.id === state.selectedId) ? state.selectedId : '',
				previewId: records.some(asset => asset.id === state.previewId) ? state.previewId : '',
				status: `${records.length} local assets loaded. Selection remains a single asset.` };
			table.setPage(0); update();
		}); },
		delivery(event) { afterAcceptedChange<AssetField, string>(event, field => field.value, delivery => {
			if (disposed || (delivery !== 'windowed' && delivery !== 'paginated')) return;
			state = { ...state, delivery, status: delivery === 'paginated' ? 'Paginated delivery. The whole current page is available for reading and browser Find.' : 'Windowed delivery. Only nearby rows and focused rows are mounted.' };
			table.setPage(0); update();
		}); },
		page(event) { afterAcceptedChange<HTMLElement & { page: number }, number>(event, pager => pager.page, page => {
			if (disposed) return;
			table.setPage(page - 1);
			state = { ...state, status: `Page ${table.page + 1} of ${table.pageCount}. Selection is unchanged.` }; update();
		}); },
		updateSelected(event) { afterClick(event, () => {
			if (!state.selectedId) { state = { ...state, status: 'Select an asset before updating its record.' }; update(); return; }
			state = { ...state, records: state.records.map(asset => asset.id === state.selectedId ? { ...asset, description: 'Updated during this review. Its stable key and selection are preserved.', modified: '2026-09-12' } : asset), status: 'Selected record updated. Its stable key and selection are preserved.' }; update();
		}); },
		connect(element) {
			if (!element) return;
			if (!tableController) {
				const host = element.closest<LitElement>('en-workflows-app') ?? (element.getRootNode() as ShadowRoot).host as LitElement | undefined;
				if (host?.addController) {
					tableHost = host;
					tableController = new TableController(host, table, {
						table: () => refs.root.value?.querySelector<TableSurface>('en-table'),
					});
				}
			}
			if (initialSelectionRead) return;
			initialSelectionRead = true;
			// Native checked attributes are hydrated without overwriting an early
			// user selection. Adopt that DOM state once after the initial render.
			queueMicrotask(() => {
				if (disposed || !element.isConnected || state.selectedId) return;
				const checked = element.querySelector<HTMLInputElement>('input[type=radio][name=asset]:checked');
				if (checked && state.records.some(asset => asset.id === checked.value)) {
					state = { ...state, selectedId: checked.value }; update();
				}
			});
		},
		query(event) { afterAcceptedChange<AssetField, string>(event, field => field.value, query => {
			if (!disposed) { state = { ...state, query }; update(); }
		}); },
		filter(event) { afterAcceptedChange<AssetField, string>(event, field => field.value, filter => {
			if (!disposed && (filter === 'all' || filter === 'icon' || filter === 'document')) {
				state = { ...state, filter: filter as AssetFilter }; update();
			}
		}); },
		layout(event) { afterAcceptedChange<AssetField, string>(event, field => field.value, layout => {
			if (!disposed && (layout === 'grid' || layout === 'list' || layout === 'table')) {
				const root = refs.root.value?.getRootNode() as Document | ShadowRoot | undefined;
				const active = root?.activeElement;
				if (active instanceof HTMLElement && active.closest('.assets-choices')) {
					const id = active.dataset.assetPreview || (active instanceof HTMLInputElement ? active.value : '');
					if (state.records.some(asset => asset.id === id)) pendingCollectionFocus = { original: active, id, action: active.dataset.assetPreview ? 'preview' : 'selection' };
				}
				state = { ...state, layout: layout as AssetLayout }; update();
			}
		}); },
		sort(event) { afterAcceptedChange<AssetField, string>(event, field => field.value, sort => {
			if (!disposed && assetSortChoices.some(choice => choice.value === sort)) {
				state = { ...state, sort: sort as AssetSort }; update();
			}
		}); },
		sortBy(event, field) { afterClick(event, () => {
			const sort: AssetSort = state.sort === `${field}-ascending` ? `${field}-descending` : `${field}-ascending`;
			state = { ...state, sort, status: `Assets sorted by ${field === 'modified' ? 'updated date' : field}, ${sort.endsWith('ascending') ? 'ascending' : 'descending'}.` }; update();
		}); },
		collectionUpdated(element) {
			const pending = pendingCollectionFocus;
			if (!element || !pending) return;
			pendingCollectionFocus = undefined;
			queueMicrotask(() => {
				if (disposed || pending.original.isConnected) return;
				const root = element.getRootNode() as Document | ShadowRoot;
				// Preserve an explicit focus move that happened while rendering.
				if (root.activeElement && root.activeElement !== element.ownerDocument.body) return;
				const selector = pending.action === 'preview' ? `[data-asset-preview="${pending.id}"]` : `input[name="asset"][value="${pending.id}"]`;
				const replacement = element.querySelector<HTMLElement>(selector);
				if (usable(replacement)) replacement.focus();
			});
		},
		select(event) {
			const field = event.currentTarget as HTMLInputElement;
			if (!disposed && field.checked && state.records.some(asset => asset.id === field.value)) {
				state = { ...state, selectedId: field.value }; update();
			}
		},
		clearFilters(event) { afterClick(event, () => {
			state = { ...state, query: '', filter: 'all' };
			if (refs.search.value) refs.search.value.value = '';
			update();
		}); },
		showSelected(event) { afterClick(event, () => {
			const asset = state.records.find(asset => asset.id === state.selectedId);
			if (!asset) { state = { ...state, status: 'Choose an asset to show.' }; update(); return; }
			state = { ...state, query: asset.name, filter: 'all' };
			if (refs.search.value) refs.search.value.value = asset.name;
			update();
		}); },
		clearSelection(event) { afterClick(event, () => {
			state = { ...state, selectedId: '', status: 'Selection cleared.' };
			clearNativeSelection(); update();
		}); },
		preview(event, asset: Asset) {
			const origin = event.currentTarget as HTMLElement;
			afterClick(event, () => {
				if (!state.records.some(candidate => candidate.id === asset.id)) return;
				previewOrigin = origin; previewOriginId = asset.id; ++focusRequest; pendingPreviewFocus = asset.id;
				state = { ...state, previewId: asset.id }; update();
			});
		},
		previewHeading(element) {
			if (!element || !pendingPreviewFocus) return;
			const request = focusRequest;
			const id = pendingPreviewFocus;
			// The ref is notified during rendering. Focus only after its visibility
			// binding settles, and only for this explicit preview activation.
			queueMicrotask(() => {
				if (!disposed && request === focusRequest && state.previewId === id
					&& pendingPreviewFocus === id && usable(element as HTMLElement)) {
					pendingPreviewFocus = ''; (element as HTMLElement).focus();
				}
			});
		},
		closePreview(event) { afterClick(event, () => {
			++focusRequest; pendingPreviewFocus = ''; restorePreviewFocus();
			state = { ...state, previewId: '' }; update();
		}); },
		insert(event) { afterClick(event, () => { void insert(); }); },
	};
	return {
		render: () => assetsTemplate(state, refs, actions, table, assetColumns(state, actions), uploadReset), reset,
		dispose() { tableController?.hostDisconnected(); tableController?.virtual.hostDisconnected(); if (tableController) { tableHost?.removeController(tableController); tableHost?.removeController(tableController.virtual); } disposed = true; ++focusRequest; pendingPreviewFocus = ''; lane.dispose(); service.dispose(); },
	};
}
