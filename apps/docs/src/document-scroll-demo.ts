import {LitElement,html,css} from 'lit';
import {VirtualCollection} from '@en-reve/primitives/state/virtual-collection.js';
import {VirtualCollectionController} from '@en-reve/primitives/interactions/virtual-collection.js';
import {virtualListRows} from '@en-reve/primitives/templates/virtual-collection.js';

/** Authored public-API example shared with the document-scroll regression fixture. */
export class DocumentScrollDemo extends LitElement {
 static properties={elementMode:{type:Boolean,attribute:'element-mode'},large:{type:Boolean},sticky:{type:Number}};
 static styles=css`:host{display:block} ul{list-style:none;margin:0;padding:0}li[data-en-virtual-key]{box-sizing:border-box;border-bottom:1px solid #ddd;min-height:48px;padding:8px}button{font:inherit;min-height:30px}.viewport{height:auto}.viewport.element{height:420px;overflow:auto} .large li[data-en-virtual-key]{min-height:80px} :focus-visible{outline:2px solid Highlight}`;
 declare elementMode:boolean;declare large:boolean;declare sticky:number;
 records=Array.from({length:500},(_,i)=>({key:`row-${i}`,label:`Record ${i}`}));
 model=new VirtualCollection({items:this.records,getKey:item=>item.key,estimateSize:48,overscan:4});
 controller=new VirtualCollectionController(this,this.model,{
  viewport:()=>this.elementMode?this.renderRoot.querySelector<HTMLElement>('.viewport'):this.ownerDocument.scrollingElement as HTMLElement,
  content:()=>this.renderRoot.querySelector('ul'),
  occludedBlockStart:()=>this.sticky,
  occludedBlockEnd:()=>this.sticky/2,
 });
 constructor(){super();this.elementMode=false;this.large=false;this.sticky=48;}
 removeRecord(key:string){this.records=this.records.filter(item=>item.key!==key);this.model.setItems(this.records);}
 render(){return html`<div class=${`viewport ${this.elementMode?'element':''} ${this.large?'large':''}`}><ul aria-label="Records">${virtualListRows(this.model,{renderItem:item=>html`<button>${item.label}</button>`})}</ul></div>`;}
}
customElements.define('document-scroll-demo',DocumentScrollDemo);
