import { html, css, type PropertyValues } from 'lit';
import { isCollectionKey } from '@en-reve/primitives/state/collection.js';
import { EnElement } from '../internal/en-element.js';
import { foundationStyles, blockHostStyles } from '@en-reve/styles/foundations.js';
import { tableStyles } from '@en-reve/styles/table.js';
import { TableModel, type TableSort, type TableMode } from '@en-reve/primitives/state/table.js';
import { TableController } from '@en-reve/primitives/interactions/table.js';
import { tableColgroup, tableHeader, tableRows, type TableColumn } from '@en-reve/primitives/templates/table.js';
import { dispatchChange, type PageChangeEvent, type ChangeEvent } from '@en-reve/primitives/interactions/events.js';
import type { ScrollToKeyOptions } from '@en-reve/primitives/interactions/virtual-collection.js';
import type { EnTable } from '../table.js';
export type { TableColumn, TableSort, TableMode };
interface TableState { selectedKeys: readonly string[]; sort: TableSort | undefined; page: number }

export type DataTablePageChangeEvent = PageChangeEvent;
export type DataTableSortEvent = ChangeEvent<TableSort | undefined, 'sort'>;
export type DataTableSelectionChangeEvent = ChangeEvent<readonly string[], 'checkbox'>;
export interface DataTableEventMap {
  'en-page-change': DataTablePageChangeEvent;
  'en-sort': DataTableSortEvent;
  'en-selection-change': DataTableSelectionChangeEvent;
}

/**
 * Optional records-and-columns facade over the same native table helpers used by en-table.
 * Supply JavaScript items, columns and stable getKey; no HTML strings are evaluated.
 * @tagname en-data-table
 * @slot before - Application-owned content before the table.
 * @slot after - Application-owned content after the pager.
 * @csspart table-surface - Forwarded bordered table box; surface remains the host.
 * @csspart pagination-control - Forwarded pagination button controls.
 * @csspart pagination-previous - Forwarded previous-page control.
 * @csspart pagination-page - Forwarded numbered page controls.
 * @csspart pagination-next - Forwarded next-page control.
 * @csspart surface - Inner en-table host.
 * @csspart viewport - Exported table scrollport.
 * @csspart table - Native table.
 * @csspart caption - Table caption.
 * @csspart header - Native thead.
 * @csspart body - Native tbody.
 * @csspart empty - Empty message cell.
 * @csspart pagination - en-pagination host.
 * @cssprop --en-table-row-selected-background - Persistent selected row fill.
 * @cssprop --en-table-row-selected-color - Selected row text.
 * @cssprop --en-table-row-selected-indicator-color - Logical-start selected row marker.
 * @cssprop --en-data-table-min-inline-size - Minimum native table width; defaults to 32rem.
 * @cssprop --en-data-table-selection-width - Checkbox column width; defaults to 3.25rem, with a theme hit-target minimum.
 * @cssprop --en-data-table-viewport-size - Maximum scrollport block size; defaults to 24rem.
 * @fires {DataTableSelectionChangeEvent} en-selection-change - Cancelable selected-key array transaction; reason is checkbox.
 * @fires {DataTableSortEvent} en-sort - Cancelable sort transaction; reason is sort.
 * @fires {DataTablePageChangeEvent} en-page-change - Cancelable one-based page transaction; reason is pagination.
 */
export class EnDataTable<T = {id: string}> extends EnElement<DataTableEventMap> {
  static override properties = {
    items:{attribute:false}, columns:{attribute:false}, getKey:{attribute:false}, rowLabel:{attribute:false}, filter:{attribute:false},
    selectedKeys:{attribute:false,noAccessor:true}, sort:{attribute:false,noAccessor:true}, page:{type:Number,noAccessor:true},
    pageSize:{type:Number,attribute:'page-size'}, mode:{type:String,reflect:true}, selection:{type:String},
    label:{type:String}, caption:{type:String}, emptyLabel:{attribute:'empty-label'}, selectionLabel:{attribute:'selection-label'}, selectionColumnLabel:{attribute:'selection-column-label'}, stickySelection:{attribute:'sticky-selection'},
    pageLabel:{attribute:'page-label'}, sortLabel:{attribute:false}, sticky:{type:String}, disabled:{type:Boolean,reflect:true},
  };
  static override styles = [foundationStyles,blockHostStyles,tableStyles,css`
    :host{display:block;min-inline-size:0;--_en-selection-target:max(var(--en-control-min-size,0px),var(--en-size-target-min,24px));--_en-selection-width:max(var(--en-data-table-selection-width,3.25rem),calc(var(--_en-selection-target) + .5rem))}
    table{table-layout:fixed;min-inline-size:var(--en-data-table-min-inline-size,32rem)}
    th,td{overflow-wrap:anywhere}
    en-table::part(viewport){max-block-size:var(--en-data-table-viewport-size,24rem)}
    en-table[data-en-sticky-selection]::part(viewport){scroll-padding-inline-start:calc(var(--_en-selection-width) + var(--en-focus-scroll-margin-block,1rem))}
    .en-table-selection{padding-inline:.25rem}
    en-checkbox::part(label){justify-content:center;min-inline-size:var(--_en-selection-target)}
    @media (any-pointer:coarse){:host{--_en-selection-target:max(var(--en-control-min-size,0px),var(--en-size-target-min,24px),var(--en-size-target-touch,44px))}}
    en-pagination{margin-block-start:var(--en-space-3,.75rem)}
    en-checkbox::part(label-text){display:none}
    [hidden]{display:none!important}
    @media print{en-table::part(viewport){max-block-size:none;overflow:visible}en-pagination{display:none}}
  `];
  /** Replace the array to update records; duplicate or blank string keys are rejected. */
  declare items: readonly T[];
  /** Native cell renderers, labels, widths and optional local sort comparators. */
  declare columns: readonly TableColumn<T>[];
  /** Defaults to item.id. Stable keys must not derive from row position. */
  declare getKey: (item:T)=>string;
  /** Localized record name for the checkbox; defaults to the stable key. */
  declare rowLabel: (item:T)=>string;
  /** Optional local filter; filtering precedes sorting and windowing. */
  declare filter: ((item:T)=>boolean)|undefined;
  declare pageSize: number;
  /** Paginated by default. virtual (legacy: windowed) omits records; keep a full-content reading alternative. */
  declare mode: TableMode;
  declare selection: 'none'|'multiple';
  declare label: string;
  declare caption: string;
  declare emptyLabel: string;
  /** Localized template; {row} is replaced with rowLabel(item). */
  declare selectionLabel: string;
  /** Localized, visually hidden selection-column heading. */
  declare selectionColumnLabel: string;
  /** Keep selection at logical inline-start while scrolling; use none to opt out. */
  declare stickySelection: 'start'|'none';
  declare pageLabel: string;
  declare sortLabel: ((label:string,direction:TableSort['direction'])=>string)|undefined;
  declare sticky: 'header'|'footer'|'both'|'none';
  /** Disables generated selection, sorting and page actions, not custom cell content. */
  declare disabled: boolean;
  private state: TableState = {selectedKeys:Object.freeze([]),sort:undefined,page:1};
  private presented: TableState = this.state;
  private authorRevision=0;
  private readonly model = new TableModel<T>({items:[],columns:[{key:'_empty',label:''}],getKey:item=>{const key=this.getKey(item);if(!isCollectionKey(key))throw new TypeError('Data-table records require unique, nonblank string keys.');return key;},mode:'paginated',pageSize:20,estimateSize:56,initialCount:12,overscan:3});
  private readonly controller = new TableController(this,this.model,{table:()=>this.surface,
    onFocusedItemRemoved:(_key,viewport)=>viewport.focus({preventScroll:true})});
  constructor(){super();this.items=[];this.columns=[];this.getKey=item=>(item as {id:string}).id;this.rowLabel=item=>this.getKey(item);this.pageSize=20;this.mode='paginated';this.selection='none';this.label='Data table';this.caption='';this.emptyLabel='No records.';this.selectionLabel='Select {row}';this.selectionColumnLabel='Selection';this.stickySelection='start';this.pageLabel='Table pages';this.sticky='header';this.disabled=false;}
  private write<K extends keyof TableState>(key:K,value:TableState[K]){
    this.authorRevision++;const previous=this.presented[key];this.state={...this.presented,[key]:value};this.presented=this.state;this.requestUpdate(key,previous);
  }
  get selectedKeys():readonly string[]{return this.state.selectedKeys;}
  set selectedKeys(keys:readonly string[]){if(!Array.isArray(keys)||keys.some(key=>!isCollectionKey(key)))throw new TypeError('Selection requires nonblank string keys.');this.write('selectedKeys',Object.freeze([...new Set(keys)]));}
  get sort():TableSort|undefined{return this.state.sort;}
  set sort(value:TableSort|undefined){if(value&&(!['ascending','descending'].includes(value.direction)||typeof value.column!=='string'))throw new TypeError('Invalid table sort.');this.write('sort',value?Object.freeze({...value}):undefined);}
  get page():number{return this.state.page;}
  set page(value:number){if(!Number.isFinite(value))throw new TypeError('Page must be finite.');this.write('page',Math.max(1,Math.floor(value)));}
  private get surface(){return this.renderRoot.querySelector<EnTable>('en-table');}
  /** Browser-only scrolling element, null before rendering. */
  get scrollElement():HTMLElement|null{return this.surface?.scrollElement??null;}
  /** Request a keyed reveal without changing selection or focus. In paginated mode, opens the containing page. */
  scrollToKey(key:string,options:ScrollToKeyOptions={}):boolean{
    const found=this.controller.scrollToKey(key,options);
    if(found&&this.mode==='paginated'){this.page=this.model.page+1;}
    return found;
  }
  /** Call after CSSOM/adopted stylesheet changes that can affect unseen rows. */
  invalidateMeasurements():void{this.controller.invalidateMeasurements();}
  /** Retain a row while an application-owned overlay is open. Holds are counted. */
  pin(key:string):void{this.controller.pin(key);}
  unpin(key:string):void{this.controller.unpin(key);}
  private propose<K extends keyof TableState>(key:K,value:TableState[K],eventName:string,reason:string){
    if(this.disabled)return;
    dispatchChange(this,{previous:this.state[key],proposed:value,reason,getRevision:()=>this.authorRevision,
      stage:next=>{this.state={...this.state,[key]:next};},rollback:prior=>{this.state={...this.state,[key]:prior};},
      canCommit:()=>!this.disabled,
      commit:next=>{const previous=this.presented[key];this.presented={...this.presented,[key]:next};this.state=this.presented;this.requestUpdate(key,previous);},
    },{eventName});
  }
  private choose(item:T,event:CustomEvent<{proposed:boolean}>){
    // The generated checkbox is an implementation detail; the owner proposes the
    // keyed selection. Cancel its local default and reconcile after settlement.
    event.stopPropagation();event.preventDefault();
    const key=this.getKey(item), next=new Set(this.presented.selectedKeys);
    if(event.detail.proposed)next.add(key);else next.delete(key);
    this.propose('selectedKeys',Object.freeze([...next]),'en-selection-change','checkbox');
  }
  private get renderedColumns():readonly TableColumn<T>[] {
    return this.selection!=='multiple'?this.columns:[{key:'_en_selection',label:this.selectionColumnLabel,headerLabelHidden:true,className:'en-table-selection',width:'var(--_en-selection-width)',renderCell:item=>html`<en-checkbox size="inherit" .disabled=${this.disabled} label=${this.selectionLabel.replaceAll('{row}',this.rowLabel(item))} .checked=${this.presented.selectedKeys.includes(this.getKey(item))} @en-change=${(e:CustomEvent<{proposed:boolean}>)=>this.choose(item,e)}></en-checkbox>`},...this.columns];
  }
  protected override willUpdate(changed:PropertyValues){
    const columns=this.renderedColumns;
    if(changed.has('columns')||changed.has('selection'))this.model.setColumns(columns.length?columns:[{key:'_empty',label:''}]);
    if(changed.has('items')||changed.has('getKey'))this.model.setItems(this.items);
    if(changed.has('filter'))this.model.setFilter(this.filter);
    if(changed.has('pageSize'))this.model.setPageSize(this.pageSize);
    if(changed.has('mode'))this.model.setMode(this.mode);
    if(changed.has('sort'))this.model.setSort(this.presented.sort);
    if(changed.has('page'))this.model.setPage(this.presented.page-1);
    this.presented={...this.presented,page:this.model.page+1,sort:this.model.sort};this.state=this.presented;
    if(changed.has('columns')||changed.has('selection'))this.controller.invalidateMeasurements();
  }
  protected override render(){
    const columns=this.columns.length?this.renderedColumns:[{key:'_empty',label:this.label,renderCell:()=>''}];
    return html`<slot name="before"></slot>
      <en-table part="surface" exportparts="viewport,base:table-surface" label=${this.label} sticky=${this.sticky} ?data-en-sticky-selection=${this.selection==='multiple'&&this.stickySelection==='start'}>
        <table part="table" aria-rowcount=${!this.model.items.length||!this.columns.length?2:this.model.rowCount()}>
          <caption part="caption">${this.caption||this.label}</caption>
          ${tableColgroup(columns)}
          <thead part="header">${tableHeader(columns,{sort:this.presented.sort,sortLabel:this.sortLabel,onSort:this.disabled?undefined:sort=>this.propose('sort',Object.freeze(sort),'en-sort','sort')})}</thead>
          <tbody part="body">${!this.model.items.length||!this.columns.length?html`<tr><td part="empty" colspan=${Math.max(1,columns.length)}>${this.emptyLabel}</td></tr>`:tableRows(this.model,columns,{rowSelected:item=>this.presented.selectedKeys.includes(this.getKey(item))})}</tbody>
        </table>
      </en-table>
      <en-pagination part="pagination" exportparts="control:pagination-control,previous:pagination-previous,page:pagination-page,next:pagination-next" ?hidden=${this.mode!=='paginated'||this.model.pageCount<2} label=${this.pageLabel} .page=${this.presented.page} .pageCount=${this.model.pageCount} .disabled=${this.disabled}
        @en-change=${(event:CustomEvent<{proposed:number}>)=>{event.stopPropagation();event.preventDefault();this.propose('page',event.detail.proposed,'en-page-change','pagination');}}></en-pagination>
      <slot name="after"></slot>`;
  }
}

declare global { interface HTMLElementTagNameMap { 'en-data-table': EnDataTable; } }
