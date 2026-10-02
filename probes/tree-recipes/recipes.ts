import {LitElement,html,css,nothing,type TemplateResult} from 'lit';
import {repeat} from 'lit/directives/repeat.js';
import {normalizeTreeData,treeDataKey,treeSnapshot,treeSelectedKeys,treeSelection,deriveTreeDataRows,type TreeDataItem,type TreeSnapshot} from '@en-reve/primitives/interactions/tree.js';
import {treeIndex,treeMoveTargets,proposeTreeMove,idleTreeBranch,type TreeLoadContext,type TreeLoadChildren,type TreeBranchState,type TreeMovePosition} from '@en-reve/primitives/interactions/tree-operations.js';
import {treeStyles,treeItemStyles,treeDataStyles} from '@en-reve/styles/tree.js';
import {foundationStyles} from '@en-reve/styles/foundations.js';
import {buttonStyles} from '@en-reve/styles/buttons.js';

const portable=new URL(location.href).searchParams.get('delivery')==='css';
const seed:readonly TreeDataItem[]=[{key:'projects',label:'Projects',children:[{key:'brief',label:'Brief'},{key:'draft',label:'Draft'},{key:'locked',label:'Locked',disabled:true},{key:'notes',label:'Notes'}]},{key:'archive',label:'Archive',branch:true},{key:'remote',label:'Remote files',lazy:true},{key:'final',label:'Final review'}];
type Pending={context:TreeLoadContext,resolve:(items:readonly TreeDataItem[])=>void,reject:(reason:Error)=>void};
class ConsumerTree extends LitElement{
 static override styles=[...(portable?[]:[foundationStyles,buttonStyles,treeStyles,treeItemStyles,treeDataStyles]),css`
 :host{display:block;min-inline-size:0}.en-foundation{padding:12px}.actions{display:flex;flex-wrap:wrap;gap:8px;margin-block:12px}.en-tree{max-block-size:32rem;overflow:auto}.en-tree-label{overflow-wrap:anywhere}.en-tree-drag{border:0;background:transparent;color:inherit;font:inherit}.en-tree-loading button{font:inherit}output{display:block;overflow-wrap:anywhere}.en-tree-drop-indicator{pointer-events:none}.en-tree-option{touch-action:pan-y}
 `];
 items=normalizeTreeData(seed);state:TreeSnapshot=treeSnapshot('',['projects'],[]);active='projects';anchor='';message='';submitted='';veto=false;
 private requestId=0;private requests=new Map<string,AbortController>();private pending=new Map<number,Pending>();private branches=new Map<string,TreeBranchState>();private dragging='';private drop?:{key:string,position:TreeMovePosition};private line?:{top:number,left:number,width:number};
 loadChildren:TreeLoadChildren=context=>new Promise((resolve,reject)=>this.pending.set(context.requestId,{context,resolve,reject}));
 get rows(){return deriveTreeDataRows(this.items,this.state);}
 private blocked(key:string){const index=treeIndex(this.items);for(let id:string|null=key;id;id=index.get(id)?.parent??null)if(index.get(id)?.item.disabled)return true;return false;}
 get available(){return this.rows.filter(row=>!this.blocked(row.item.key)).map(row=>row.item.key);}
 private node(key:string){return [...this.renderRoot.querySelectorAll<HTMLElement>('[role=treeitem]')].find(node=>node.dataset.key===key);}
 private async focusKey(key:string){if(!this.rows.some(row=>row.item.key===key))return;this.active=key;this.requestUpdate();await this.updateComplete;this.node(key)?.focus();}
 async configure(options:{items?:readonly TreeDataItem[],selected?:string[],expanded?:string[],veto?:boolean}){
  const items=options.items===undefined?this.items:normalizeTreeData(options.items);
  const state=treeSnapshot('',options.expanded??this.state.expanded,options.selected??treeSelectedKeys(this.state));
  if(options.items!==undefined){for(const c of this.requests.values())c.abort();this.requests.clear();this.branches.clear();}
  this.items=items;this.state=state;if(options.selected)this.anchor=options.selected.at(-1)??'';if(options.veto!==undefined)this.veto=options.veto;
  if(!this.rows.some(row=>row.item.key===this.active))this.active=this.rows[0]?.item.key??'';this.requestUpdate();await this.updateComplete;
 }
 private select(key:string,operation:'replace'|'toggle'|'range'|'all'){
  if(this.blocked(key))return;const anchor=this.available.includes(this.anchor)?this.anchor:key;
  this.state=treeSelection(this.state,key,this.available,anchor,operation);
  if(operation==='replace'||operation==='toggle')this.anchor=treeSelectedKeys(this.state).includes(key)?key:'';
  this.active=key;this.message=`Selected ${treeSelectedKeys(this.state).length} items.`;this.requestUpdate();
 }
 private async expand(key:string){if(this.blocked(key))return;const open=this.state.expanded.includes(key);const expanded=open?this.state.expanded.filter(k=>k!==key):[...this.state.expanded,key];
  this.state=treeSnapshot('',expanded,treeSelectedKeys(this.state));if(open){this.requests.get(key)?.abort();this.requests.delete(key);this.branches.delete(key);if(!this.rows.some(row=>row.item.key===this.active))await this.focusKey(key);}
  this.requestUpdate();if(!open&&treeIndex(this.items).get(key)?.item.lazy)void this.load(key);
 }
 private async load(key:string){const item=treeIndex(this.items).get(key)?.item;if(!item)return;this.requests.get(key)?.abort();const controller=new AbortController();this.requests.set(key,controller);const context={key,item,requestId:++this.requestId,signal:controller.signal};this.branches.set(key,{status:'loading',requestId:context.requestId});this.message=`Loading ${item.label}.`;this.requestUpdate();
  try{const children=await this.loadChildren(context);if(controller.signal.aborted||this.requests.get(key)!==controller)return;
   const replace=(items:readonly TreeDataItem[]):readonly TreeDataItem[]=>items.map(item=>treeDataKey(item)===key?{...item,lazy:false,branch:true,children}:{...item,children:replace(item.children??[])});
   const next=normalizeTreeData(replace(this.items));this.items=next;this.branches.set(key,{status:'loaded',requestId:context.requestId});this.message=`Loaded ${children.length} children.`;
  }catch(error){if(controller.signal.aborted||this.requests.get(key)!==controller)return;this.branches.set(key,{status:'error',requestId:context.requestId});this.message=error instanceof Error?error.message:'Loading failed.';}
  finally{if(this.requests.get(key)===controller){this.requests.delete(key);this.requestUpdate();}}
 }
 finish(id:number,items:readonly TreeDataItem[]=[{key:'remote-a',label:'Remote sketch'},{key:'remote-b',label:'Remote notes'}],fail=false){const request=this.pending.get(id);if(!request)throw Error('Unknown request');this.pending.delete(id);if(fail)request.reject(Error('Connection failed. Retry loading.'));else request.resolve(items);}
 get pendingRequests(){return [...this.pending].map(([id,p])=>({id,key:p.context.key,aborted:p.context.signal.aborted}));}
 move(keys:readonly string[],target:string,position:TreeMovePosition){const proposal=proposeTreeMove(this.items,keys,target,position);if(!proposal){this.message='Move rejected or unchanged.';this.requestUpdate();return false;}
  const event=new CustomEvent('before-tree-move',{detail:proposal,cancelable:true,bubbles:true,composed:true});if(this.veto)event.preventDefault();this.dispatchEvent(event);if(event.defaultPrevented){this.message='Move canceled.';this.requestUpdate();return false;}
  this.items=proposal.proposed as ReturnType<typeof normalizeTreeData>;this.message=`Moved ${proposal.keys.length} items.`;this.requestUpdate();return true;
 }
 private key(event:KeyboardEvent,key:string){if(event.target!==event.currentTarget)return;const row=this.rows.find(row=>row.item.key===key)!;const keys=this.rows.map(row=>row.item.key),index=keys.indexOf(key);const rtl=getComputedStyle(this).direction==='rtl';const forward=rtl?'ArrowLeft':'ArrowRight',back=rtl?'ArrowRight':'ArrowLeft';let next='';
  if(event.altKey&&(event.key==='ArrowUp'||event.key==='ArrowDown')){event.preventDefault();const siblings=this.rows.filter(r=>r.parentValue===row.parentValue);const at=siblings.findIndex(r=>r.item.key===key),target=siblings[at+(event.key==='ArrowUp'?-1:1)];if(target)this.move([key],target.item.key,event.key==='ArrowUp'?'before':'after');void this.focusKey(key);return;}
  if(event.key==='ArrowDown')next=keys[Math.min(keys.length-1,index+1)];else if(event.key==='ArrowUp')next=keys[Math.max(0,index-1)];else if(event.key==='Home')next=keys[0];else if(event.key==='End')next=keys.at(-1)!;
  else if(event.key===forward){if(row.presentation.branch&&!row.presentation.expanded)void this.expand(key);else if(row.presentation.expanded)next=this.rows.find(r=>r.parentValue===key)?.item.key??'';}
  else if(event.key===back){if(row.presentation.expanded)void this.expand(key);else next=row.parentValue??'';}
  else if(event.key===' '||event.key==='Enter')this.select(key,event.shiftKey?'range':event.ctrlKey||event.metaKey||event.key===' '?'toggle':'replace');
  else if((event.ctrlKey||event.metaKey)&&event.key==='a')this.select(key,'all');else return;
  event.preventDefault();if(next){if(event.shiftKey)this.select(next,'range');void this.focusKey(next);}
 }
 private over(event:DragEvent,key:string){event.preventDefault();event.stopPropagation();const rect=this.node(key)!.querySelector('.en-tree-option')!.getBoundingClientRect();const y=event.clientY-rect.top;const position:TreeMovePosition=y<rect.height*.25?'before':y>rect.height*.75?'after':'inside';
  if(!treeMoveTargets(this.items,[this.dragging],position).has(key)){this.drop=undefined;this.line=undefined;this.requestUpdate();return;}
  this.drop={key,position};this.line=position==='inside'?undefined:{top:position==='before'?rect.top:rect.bottom,left:rect.left,width:rect.width};this.requestUpdate();
 }
 private endDrag(){this.dragging='';this.drop=undefined;this.line=undefined;this.requestUpdate();}
 private renderItems(parent:string|null):TemplateResult{return html`${repeat(this.rows.filter(row=>row.parentValue===parent),row=>row.item.key,row=>{const {item,presentation:p}=row;const branch=this.branches.get(item.key)??idleTreeBranch;return html`<div class="en-tree-item" role="treeitem" data-key=${item.key} tabindex=${this.active===item.key?0:-1} aria-label=${item.label} aria-level=${p.level} aria-posinset=${p.posInSet} aria-setsize=${p.setSize} aria-expanded=${p.branch?String(p.expanded):nothing} aria-selected=${String(p.selected)} aria-disabled=${String(this.blocked(item.key))} @focus=${()=>{this.active=item.key;this.requestUpdate();}} @keydown=${(e:KeyboardEvent)=>this.key(e,item.key)}>
   <div class="en-tree-option" data-tree-drop=${this.drop?.key===item.key?this.drop.position:nothing} ?data-tree-dragging=${this.dragging===item.key} @click=${(e:MouseEvent)=>{e.stopPropagation();this.select(item.key,e.shiftKey?'range':e.metaKey||e.ctrlKey?'toggle':'replace');void this.focusKey(item.key);}} @dragover=${(e:DragEvent)=>this.over(e,item.key)} @drop=${(e:DragEvent)=>{e.preventDefault();e.stopPropagation();if(this.drop)this.move([this.dragging],this.drop.key,this.drop.position);this.endDrag();}}>
   <span class="en-tree-indicator" aria-hidden="true" @click=${(e:MouseEvent)=>{e.stopPropagation();if(p.branch)void this.expand(item.key);}}>${p.branch?p.expanded?'▾':'▸':''}</span><span class="en-tree-label">${item.label}</span><span class="en-tree-drag" aria-hidden="true" draggable=${String(!this.blocked(item.key))} @dragstart=${(e:DragEvent)=>{e.stopPropagation();this.dragging=item.key;e.dataTransfer?.setData('text/plain',item.key);this.requestUpdate();}} @dragend=${()=>this.endDrag()}>⠿</span></div>
   ${p.expanded?html`<div class="en-tree-group" role="group">${this.renderItems(item.key)}${branch.status==='loading'?html`<div class="en-tree-loading" aria-hidden="true">Loading children…</div>`:nothing}</div>`:nothing}</div>`;})}`;}
 override render(){return html`${portable?html`<link rel="stylesheet" href="/tree.css">`:nothing}<div class="en-foundation"><form @submit=${(e:SubmitEvent)=>{e.preventDefault();this.submitted=JSON.stringify(new FormData(e.currentTarget as HTMLFormElement).getAll('selection'));this.requestUpdate();}}><div class="en-tree en-tree-data" role="tree" aria-label="Project files" aria-multiselectable="true">${this.renderItems(null)}</div>${treeSelectedKeys(this.state).map(key=>html`<input type="hidden" name="selection" value=${key}>`)}<p role="status" aria-label="Tree feedback">${this.message}</p><div class="actions">${[...this.branches].filter(([,state])=>state.status==='error').map(([key])=>html`<button type="button" @click=${()=>this.load(key)}>Retry loading ${treeIndex(this.items).get(key)?.item.label}</button>`)}<button class="en-button" type="submit">Submit selection</button><button class="en-button" type="button" @click=${()=>this.configure({items:seed,selected:[],expanded:['projects']})}>Reset tree</button></div><output aria-label="Submitted selection">${this.submitted}</output></form>${this.line?html`<div class="en-tree-drop-indicator" aria-hidden="true" style=${`top:${this.line.top}px;left:${this.line.left}px;width:${this.line.width}px`}></div>`:nothing}</div>`;}
 override disconnectedCallback(){for(const c of this.requests.values())c.abort();super.disconnectedCallback();}
}
customElements.define('consumer-tree',ConsumerTree);
await Promise.all([...document.querySelectorAll<ConsumerTree>('consumer-tree')].map(host=>host.updateComplete));
if(portable)await Promise.all([...document.querySelectorAll<ConsumerTree>('consumer-tree')].map(host=>new Promise<void>(resolve=>{const link=host.shadowRoot!.querySelector('link')!;if(link.sheet)resolve();else link.addEventListener('load',()=>resolve(),{once:true});})));
document.body.dataset.ready='true';
