import { EnElementRenderer } from './en-element-renderer.js';
import type { ElementRendererConstructor } from '@lit-labs/ssr/lib/element-renderer.js';
import type { ThunkedRenderResult } from '@lit-labs/ssr/lib/render-result.js';
import type { RenderInfo } from '@lit-labs/ssr/lib/render.js';
import { parseFragment, type DefaultTreeAdapterMap } from 'parse5';
import { EnToastRegion } from '@en-reve/elements/toast-region.js';
import { toastWindow, toastQueuedAttribute, toastStackAttribute, toastCountAttribute } from '@en-reve/primitives/interactions/toast-stack.js';
import { createSlotAssignmentReader } from './slot-presence-reader.js';
type Node=DefaultTreeAdapterMap['node'];type Element=DefaultTreeAdapterMap['element'];
const isElement=(node:Node):node is Element=>'tagName' in node;
const attr=(node:Element,name:string)=>node.attrs.find(a=>a.name===name)?.value;
const walk=(node:Node,visit:(node:Node)=>void)=>{visit(node);if('childNodes' in node)for(const child of node.childNodes)walk(child,visit);if('content' in node)walk(node.content,visit);};
/** Request-local presentation annotation; authored open and hidden are never modified. */
export function createToastStackSsrAdapter():{Renderer:ElementRendererConstructor;finalize(markup:string):string}{
 const records=new Map<string,number>();const nonce=globalThis.crypto.randomUUID();let finished=false;
 class Renderer extends EnElementRenderer {
  static override matchesClass(ctor:typeof HTMLElement,tagName?:string){return ctor===EnToastRegion&&tagName==='en-toast-region';}
  override renderShadow(info:RenderInfo):ThunkedRenderResult|undefined{
   if(finished)throw new Error('Toast SSR adapter is single-use.');
   const result=super.renderShadow(info);if(!result)return result;
   const marker=`en-toast-stack-ssr:${nonce}:${records.size}`;records.set(marker,(this.element as EnToastRegion).max);
   return [`<!--${marker}-->`,...result];
  }
 }
 return {Renderer,finalize(markup){
  if(finished)throw new Error('Toast SSR adapter is single-use.');finished=true;if(!records.size)return markup;
  const dom=parseFragment(markup,{sourceCodeLocationInfo:true});const assigned=createSlotAssignmentReader(dom);
  const edits:{start:number;end:number;text:string}[]=[];
  const insert=(el:Element,name:string,value='')=>{if(attr(el,name)!==undefined)throw new Error(`Toast SSR reserves ${name}.`);const tag=el.sourceCodeLocation?.startTag;if(!tag)throw new Error('Missing toast source location.');const start=tag.startOffset+1+el.tagName.length;edits.push({start,end:start,text:` ${name}="${value}"`});};
  walk(dom,node=>{
   if(!isElement(node)||node.tagName!=='en-toast-region')return;
   const template=node.childNodes.find((c):c is DefaultTreeAdapterMap['template']=>isElement(c)&&c.tagName==='template'&&'content' in c&&attr(c,'shadowrootmode')==='open');
   const marker=template?.content.childNodes[0];if(!marker||!('data' in marker)||!records.has(marker.data))return;
   const max=records.get(marker.data)!;records.delete(marker.data);const loc=marker.sourceCodeLocation!;edits.push({start:loc.startOffset,end:loc.endOffset,text:''});
   const toasts=assigned(node,'',template!).filter((c):c is Element=>isElement(c)&&c.tagName==='en-toast');
   const active=toasts.filter(toast=>{
    if(attr(toast,'hidden')!==undefined)return false;
    const shadow=toast.childNodes.find((c):c is DefaultTreeAdapterMap['template']=>isElement(c)&&c.tagName==='template'&&'content' in c&&attr(c,'shadowrootmode')==='open');
    const article=shadow?.content.childNodes.find(c=>isElement(c)&&c.tagName==='article');
    return !article||!isElement(article)||attr(article,'hidden')===undefined;
   });
   const visible=toastWindow(active,max,toast=>attr(toast,'interrupt')!==undefined);const waiting=active.length-visible.size;
   for(const toast of active)if(!visible.has(toast))insert(toast,toastQueuedAttribute);
   if(waiting){
    insert(node,toastCountAttribute,String(waiting));insert(active.filter(t=>visible.has(t)).at(-1)!,toastStackAttribute,String(Math.min(waiting,2)));
    walk(template!.content,c=>{if(!isElement(c)||attr(c,'part')!=='stack-summary')return;const hidden=c.sourceCodeLocation?.attrs?.hidden;if(hidden)edits.push({start:hidden.startOffset,end:hidden.endOffset,text:''});});
   }
  });
  if(records.size)throw new Error('Incomplete toast SSR response.');
  edits.sort((a,b)=>b.start-a.start);let end=markup.length;let out='';
  for(const edit of edits){if(edit.end>end)throw new Error('Overlapping toast SSR edits.');out=edit.text+markup.slice(edit.end,end)+out;end=edit.start;}
  return markup.slice(0,end)+out;
 }};
}
