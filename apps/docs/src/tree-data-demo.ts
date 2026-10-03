import { treeDataKey } from '@en-reve/primitives/interactions/tree.js';
import { html } from 'lit';
import { AsyncDirective, directive } from 'lit/async-directive.js';
import { guard } from 'lit/directives/guard.js';
import { ref } from 'lit/directives/ref.js';
import type { TreeLoadContext, TreeDataItem } from '@en-reve/elements/tree.js';

function collectionItems(): readonly TreeDataItem[] {
	return Array.from({ length: 20 }, (_, folderIndex) => {
		const folder = String(folderIndex + 1).padStart(2, '0');
		return {
			key: `folder-${folder}`,
			label: `Collection ${folder}`,
			children: Array.from({ length: 50 }, (_, assetIndex) => {
				const asset = String(assetIndex + 1).padStart(3, '0');
				return { key: `asset-${folder}-${asset}`, label: `Asset ${folder} · ${asset}` };
			}),
		};
	});
}

type TreeElement = HTMLElement & {
	selectedKey: string;
  selectedKeys: readonly string[];
	expandedKeys: readonly string[];
	items: readonly TreeDataItem[];
	virtualize: boolean;
	updateComplete: Promise<unknown>;
	scrollToKey(key: string, options?: ScrollIntoViewOptions): boolean;
};

/** Application-owned model, independent of the tree's mounted rows. */
class TreeDataDemo extends AsyncDirective {
	private tree?: TreeElement;
	private items = collectionItems();
	private expanded = this.items.map(item => treeDataKey(item));
	private virtualize = true;
	private selected = '';
  private values: readonly string[] = [];
  private multiple = false;
	private target = 'asset-10-025';
	private inserted = false;
	private status = '1,020 items in the model. All collections start expanded.';
	private resetKey: unknown;
	private refresh() { this.setValue(this.render(this.resetKey)); }
	private changed = (event: Event) => {
		const tree = event.currentTarget as TreeElement;
		if (event.composedPath()[0] !== tree) return;
		queueMicrotask(() => {
			if (!this.isConnected || this.tree !== tree) return;
			this.selected = tree.selectedKey; this.values = tree.selectedKeys;
			this.expanded = [...tree.expandedKeys];
			this.status = `${this.multiple ? `${this.values.length} items selected.` : this.selected ? `Selected ${this.selected}.` : 'No item selected.'} ${this.expanded.length} collections expanded.`;
			this.refresh();
		});
	};
	private toggle = (event: Event) => {
		const control = event.currentTarget as HTMLElement & { checked: boolean };
		queueMicrotask(() => {
			if (!this.isConnected || event.defaultPrevented) return;
			this.virtualize = control.checked;
			this.status = this.virtualize ? 'Windowed rendering enabled. The complete data model is retained.' : 'All expanded items are rendered. Use this mode to compare screen-reader traversal.';
			this.refresh();
		});
	};
	private jump = () => {
		if (!this.tree) return;
		const found = this.tree.scrollToKey(this.target, { behavior: 'auto', block: 'center', inline: 'nearest' });
		this.status = found ? `Scrolled to ${this.target}. Selection and focus are unchanged.` : `Cannot reveal ${this.target}. Use a known key and expand its collection first.`;
		this.refresh();
	};
	private mutate = () => {
		this.inserted = !this.inserted;
		this.items = this.items.map((item, index) => index ? item : {
			...item,
			children: this.inserted
				? [{ key: 'asset-added', label: 'New local asset' }, ...(item.children ?? [])]
				: (item.children ?? []).filter(child => treeDataKey(child) !== 'asset-added'),
		});
		if (!this.inserted) this.values = this.values.filter(key => key !== 'asset-added');
		if (!this.inserted && this.selected === 'asset-added') this.selected = '';
		this.status = this.inserted ? 'Added asset-added to Collection 01. Existing keys and selection are retained.' : 'Removed asset-added from the data model.';
		this.refresh();
	};
	render(resetKey: unknown = 0) {
		if (this.resetKey !== resetKey) {
			this.resetKey = resetKey;
			this.items = collectionItems(); this.expanded = this.items.map(item => treeDataKey(item));
			this.virtualize = true; this.multiple = false; this.values = []; this.selected = ''; this.target = 'asset-10-025'; this.inserted = false;
			this.status = '1,020 items in the model. All collections start expanded.';
		}
		return html`
			<style>
        .tree-data-demo { grid-template-columns:minmax(0,1fr); }
        .tree-data-demo > section { min-inline-size:0; grid-template-columns:minmax(0,1fr); }
        .tree-data-demo pre { min-inline-size:0; max-inline-size:100%; overflow:auto; }
      </style>
      <div class="tree-data-demo" style="display:grid;gap:var(--en-space-4);min-inline-size:0">
				<p style="margin:0">Twenty collections contain fifty assets each. Compare windowed rendering with the fully rendered expanded hierarchy; both use the same items, selection and expansion API.</p>
				<en-switch label="Virtualize expanded items" .checked=${this.virtualize} @en-change=${this.toggle}></en-switch>
				<en-switch label="Select multiple items" .checked=${this.multiple} @en-change=${(event: Event) => {
            const control = event.currentTarget as HTMLElement & { checked: boolean };
            queueMicrotask(() => { if (!this.isConnected || event.defaultPrevented) return; this.multiple = control.checked; this.values = this.selected ? [this.selected] : []; this.refresh(); });
          }}></en-switch>
          <en-tree id="specimen-tree-data" label="Large asset hierarchy" ${ref(element => { this.tree = element as TreeElement | undefined; })}
					.items=${this.items} .expandedKeys=${this.expanded} .multiple=${this.multiple} .selectedKeys=${this.values} ?virtualize=${this.virtualize}
					@en-change=${this.changed} style=${this.virtualize ? 'block-size:24rem' : ''}></en-tree>
				<p data-tree-data-status role="status" aria-atomic="true" style="margin:0">${this.status}</p>
				<div style="display:flex;flex-wrap:wrap;align-items:center;gap:var(--en-space-2)">
					<en-button variant="secondary" @click=${this.mutate}>${this.inserted ? 'Remove inserted child' : 'Insert child'}</en-button>
					<en-button variant="secondary" @click=${() => { this.expanded = this.items.map(item => treeDataKey(item)); this.status = 'All collections expanded.'; this.refresh(); }}>Expand all collections</en-button>
					<en-button variant="secondary" @click=${() => { this.expanded = []; this.status = 'All collections collapsed. Selected item identity is retained.'; this.refresh(); }}>Collapse all collections</en-button>
				</div>
				<details>
					<summary>Scroll to an item</summary>
					<div style="display:flex;flex-wrap:wrap;align-items:end;gap:var(--en-space-3);padding-block:var(--en-space-3)">
						<en-text-field label="Item key" .value=${this.target} @en-input=${(event: Event) => { this.target = (event.currentTarget as HTMLElement & { value: string }).value; }}></en-text-field>
						<en-button @click=${this.jump}>Scroll to item</en-button>
					</div>
					<p>For example, <code>asset-10-025</code> belongs to <code>folder-10</code>. Expand the ancestor before scrolling to a hidden descendant. Unknown or collapsed keys return <code>false</code>.</p>
				</details>
				<details>
					<summary>Keyboard and accessibility review</summary>
					<p>Tab enters the tree once. Up/Down, Home/End and typeahead move between expanded items. The forward arrow expands or enters a collection; the backward arrow collapses it or reaches its parent, following reading direction. Enter or Space selects. With multiple selection on, Plain click selects one item; Command/Ctrl+click, Space or Enter toggles one item. Shift+click, Shift+Space and Shift+Up/Down/Home/End select the exact inclusive enabled visible range. Control/Command+A toggles all enabled visible items, including those outside the mounted window. Collapsing branches retains selection; plain click and Shift ranges replace the selection. Scroll far from a focused row, then continue navigation to verify continuity.</p>
					<p>Virtualization limits the mounted accessibility tree. Compare both modes with your screen reader. Browser snapshots and keyboard checks do not establish that every assistive technology traverses a changing window correctly; a fully rendered hierarchy remains available.</p>
				</details>
          <section aria-labelledby="tree-multiple-title" style="display:grid;gap:var(--en-space-3)">
            <h3 id="tree-multiple-title">Multiple selection with authored children</h3>
            <p>Click to select one item, Command/Ctrl+click to toggle one, or Shift+click to select a range. Branch disclosure only expands or collapses; it does not select descendants.</p>
            <en-tree id="specimen-tree-multi" label="Deliverables" multiple .expandedKeys=${['design']} .selectedKeys=${['cover']}>
              <en-tree-item value="design" label="Design">
                <en-tree-item slot="children" value="cover" label="Cover"></en-tree-item>
                <en-tree-item slot="children" value="poster" label="Poster"></en-tree-item>
                <en-tree-item slot="children" value="locked" label="Locked original" disabled></en-tree-item>
              </en-tree-item>
              <en-tree-item value="notes" label="Notes"></en-tree-item>
            </en-tree>
            <pre dir="ltr"><code>${`<en-tree label="Deliverables" multiple>
  <en-tree-item value="cover" label="Cover"></en-tree-item>
  <en-tree-item value="poster" label="Poster"></en-tree-item>
</en-tree>

// The same state API works with .items and virtualize.
tree.values = ['cover', 'poster'];
tree.addEventListener('en-change', event => {
  // Synchronously preventDefault() to reject a proposal.
  queueMicrotask(() => console.log(tree.values));
});`}</code></pre>
          </section>
			</div>
		`;
	}
}
const treeDataDemo = directive(TreeDataDemo);
export function treeDataExample(resetKey: unknown = 0) { return html`${treeDataDemo(resetKey)}${treeOperationsDemo(resetKey)}`; }


const operationItems = (): readonly TreeDataItem[] => [
  {key:'library',label:'Library',branch:true,children:[{key:'cover',label:'Cover study'},{key:'poster',label:'Poster study'}]},
  {key:'drafts',label:'Drafts',lazy:true},
  {key:'references',label:'References',lazy:true},
  {key:'archive',label:'Empty archive',branch:true},
  {key:'locked',label:'Locked collection',branch:true,disabled:true},
];
class TreeOperationsDemo extends AsyncDirective {
  private initial = operationItems();
  private expanded = ['library'];
  private values = ['cover'];
  private virtual = true;
  private rejectMoves = false;
  private resetKey: unknown;
  private pending = new Map<string,{resolve:(children:readonly TreeDataItem[])=>void;reject:(error:Error)=>void;signal:AbortSignal}>();
  private refresh = () => { if(this.isConnected) this.setValue(this.render(this.resetKey)); };
  private load = ({key,signal}:TreeLoadContext) => new Promise<readonly TreeDataItem[]>((resolve,reject)=> {
    const request={resolve,reject,signal};this.pending.set(key,request);
    signal.addEventListener('abort',()=>{if(this.pending.get(key)===request)this.pending.delete(key);reject(new Error('Canceled'));this.refresh();},{once:true});
    this.refresh();
  });
  private finish(key:string, mode:'loaded'|'empty'|'error') {
    const request=this.pending.get(key);if(!request)return;this.pending.delete(key);
    if(mode==='error')request.reject(new Error('Simulated failure'));
    else request.resolve(mode==='empty'?[]:Array.from({length:80},(_,index)=>({key:`${key}-${index+1}`,label:`${key} item ${index+1}`})));
    this.refresh();
  }
  render(resetKey:unknown=0) {
    if(resetKey!==this.resetKey){
      this.resetKey=resetKey;this.initial=operationItems();this.expanded=['library'];this.values=['cover'];this.virtual=true;this.rejectMoves=false;
      this.pending.clear();
    }
    return html`<section id="tree-operations-example" style="display:grid;gap:var(--en-space-3);margin-block-start:var(--en-space-6)">
      <h3>Lazy branches and moving items</h3>
      <p>Expand Drafts and References to request children, then complete or fail each simulated request below. Collapse a folder while loading to cancel it. Retry appears when a failed row is focused. Files stay local; no network service is called.</p>
      <en-switch label="Virtualize loaded branches" .checked=${this.virtual} @en-change=${(event:Event)=>{const control=event.currentTarget as HTMLElement & {checked:boolean};queueMicrotask(()=>{if(!event.defaultPrevented){this.virtual=control.checked;this.refresh();}});}}></en-switch>
      <en-switch label="Reject proposed moves" .checked=${this.rejectMoves} @en-change=${(event:Event)=>{const control=event.currentTarget as HTMLElement & {checked:boolean};queueMicrotask(()=>{if(!event.defaultPrevented){this.rejectMoves=control.checked;this.refresh();}});}}></en-switch>
      <en-tree id="specimen-tree-operations" label="Working collections" multiple reorderable
        .items=${guard([this.resetKey],()=>this.initial)} .expandedKeys=${guard([this.resetKey],()=>this.expanded)} .selectedKeys=${guard([this.resetKey],()=>this.values)} .loadChildren=${this.load} ?virtualize=${this.virtual}
        style=${this.virtual?'block-size:32rem':''}
        @en-reorder=${(event:Event)=>{if(this.rejectMoves)event.preventDefault();}}></en-tree>
      <div role="group" aria-label="Simulated branch requests" style="display:grid;gap:var(--en-space-2)">
        ${[...this.pending].map(([key])=>html`<div style="display:flex;flex-wrap:wrap;align-items:center;gap:var(--en-space-2)"><span>${key}: waiting for application</span>
          <en-button @click=${()=>this.finish(key,'loaded')}>Complete ${key}</en-button>
          <en-button @click=${()=>this.finish(key,'empty')}>Empty ${key}</en-button>
          <en-button @click=${()=>this.finish(key,'error')}>Fail ${key}</en-button>
        </div>`)}
      </div>
      <p>Drag a row to reorder it. On touch, drag the grip on the right; swipe elsewhere to scroll. Selected rows move together. The preview names the destination: the middle of a folder means inside; its top/bottom quarters mean before/after. For files, the upper/lower halves mean before/after. Load an unknown folder before moving into it. Escape cancels. For keyboard or single-pointer operation without dragging, press Alt+M on a row. The Move interface can target known items outside the virtual window.</p>
      <details><summary>Lazy loading and move API example</summary><pre dir="ltr"><code>${`tree.items = [{ key: 'drafts', label: 'Drafts', lazy: true }];
tree.loadChildren = async ({ key, signal, requestId }) => {
  return app.loadChildren(key, { signal, requestId });
};
// Expand to load. Collapse aborts; stale results are ignored.
tree.expandedKeys = ['drafts'];
await tree.loadBranch('drafts'); // explicit retry/refresh
console.log(tree.getBranchState('drafts'));
tree.addEventListener('en-load-state-change', event => {
  // Loading, loaded, empty, error, or canceled (idle).
  console.log(event.detail);
});

tree.reorderable = true;
tree.addEventListener('en-reorder', event => {
  // Proposal is before mutation. Veto synchronously if disallowed.
  if (!app.canMove(event.detail)) event.preventDefault();
});
tree.openMove(['cover', 'poster']); // accessible chooser
// Or use the same transaction programmatically:
tree.moveItems(['cover', 'poster'], 'archive', 'inside');`}</code></pre></details>
      <h4>Move authored children</h4>
      <p>This tree preserves slotted label nodes when moving. Empty folders use the branch attribute. An app that loads authored content appends its own child elements.</p>
      <en-tree id="specimen-tree-authored-moves" label="Authored working collections" multiple reorderable .expandedKeys=${guard([this.resetKey],()=>this.expanded)} .selectedKeys=${guard([this.resetKey],()=>this.values)}>
        <en-tree-item value="library" label="Library" branch>
          <en-tree-item slot="children" value="cover"><span slot="label">Cover <strong>study</strong></span></en-tree-item>
          <en-tree-item slot="children" value="poster" label="Poster study"></en-tree-item>
        </en-tree-item>
        <en-tree-item value="archive" label="Empty archive" branch></en-tree-item>
      </en-tree>
    </section>`;
  }
}
const treeOperationsDemo=directive(TreeOperationsDemo);
