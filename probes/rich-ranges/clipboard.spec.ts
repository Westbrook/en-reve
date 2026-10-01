import {test,expect} from '@playwright/test';
for(const tag of ['en-rich-text-editor','en-token-editor']){
 test(`${tag}: source scope, transformations, fallback and single-step undo`,async({page})=>{
  await page.goto('/probes/rich-ranges/fixture.html');const editor=page.locator(tag);await expect(editor.getByRole('textbox')).toHaveAttribute('contenteditable','true');
  const result=await editor.evaluate((el:any)=>{
   el.value='';const seen:any[]=[],cache=new WeakMap();let allocated=0;
   el.registerToken('ref',(token:any)=>document.createTextNode(token.text),{importToken:(token:any,context:any)=>{seen.push({id:token.id,source:context.sourceId,scope:context.scope});let values=cache.get(context.scope);if(!values)cache.set(context.scope,values=new Map());if(!values.has(token.data.key))values.set(token.data.key,++allocated);return {...token,id:'ignored',text:'@New',data:{key:values.get(token.data.key)}};}});
   const tokens=[1,2].map(i=>({kind:'token',id:'source-'+i,type:'ref',text:'@Old',label:'Old',data:{key:'same'}}));
   const paste=()=>{const dt={values:{} as Record<string,string>,setData(k:string,v:string){this.values[k]=v;},getData(k:string){return this.values[k]??'';}};dt.setData('text/plain','@Old@Old');dt.setData('application/x-en-editor+json',JSON.stringify({type:'en-editor-clipboard',version:1,runs:tokens,...(el.tagName==='EN-RICH-TEXT-EDITOR'?{rich:{content:[{type:'paragraph',content:tokens.map(run=>({type:'token',attrs:{run}}))}],openStart:1,openEnd:1}}:{})}));(()=>{const event=new Event('paste',{bubbles:true,cancelable:true});Object.defineProperty(event,'clipboardData',{value:dt});el.shadowRoot.querySelector('[role=textbox]').dispatchEvent(event);})();};
   el.focus();paste();const first=JSON.stringify(el.document),value=el.value;const sameScope=seen[0].scope===seen[1].scope,original=seen.slice(0,2).map(x=>[x.id,x.source]);const undo=el.undo(),empty=el.value,extraUndo=el.undo(),redo=el.redo();paste();return {first,value,sameScope,original,undo,empty,extraUndo,redo,freshScope:seen[2].scope!==seen[0].scope,allocated,final:JSON.stringify(el.document)};
  });expect(result).toMatchObject({value:'@New@New',sameScope:true,original:[['source-1','source-1'],['source-2','source-2']],undo:true,empty:'',extraUndo:false,redo:true,freshScope:true,allocated:2});
  const tokens=(json:string)=>{const all:any[]=[];const visit=(v:any)=>{if(v&&typeof v==='object'){if(v.kind==='token')all.push(v);else Object.values(v).forEach(visit);}};visit(JSON.parse(json));return all;};
  expect(tokens(result.first).map(t=>t.data.key)).toEqual([1,1]);const ids=tokens(result.final).map(t=>t.id);expect(new Set(ids).size).toBe(4);expect(ids.every(id=>!['source-1','source-2','ignored'].includes(id))).toBe(true);
 });
 test(`${tag}: hook failures and malformed payload fall back atomically; cancellation retains redo`,async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/probes/rich-ranges/fixture.html');const editor=page.locator(tag);await expect(editor.getByRole('textbox')).toHaveAttribute('contenteditable','true');
  const result=await editor.evaluate((el:any)=>{
   const outcomes=[];for(const mode of ['throw','invalid','text','malformed','accept']){
    el.value='';let calls=0;el.registerToken('ref',(t:any)=>document.createTextNode(t.text),{importToken:(t:any)=>{if(mode==='throw'&&++calls===2)throw Error('hook failed');if(mode==='invalid')return {...t,label:9};if(mode==='text')return undefined;return t;}});
    const dt={values:{} as Record<string,string>,setData(k:string,v:string){this.values[k]=v;},getData(k:string){return this.values[k]??'';}};dt.setData('text/plain','readable');dt.setData('application/x-en-editor+json',mode==='malformed'?'{':JSON.stringify({type:'en-editor-clipboard',version:1,runs:[1,2].map(i=>({kind:'token',id:'s'+i,type:'ref',text:'@R',label:'R',data:null}))}));
    const paste=()=>(()=>{const event=new Event('paste',{bubbles:true,cancelable:true});Object.defineProperty(event,'clipboardData',{value:dt});el.shadowRoot.querySelector('[role=textbox]').dispatchEvent(event);})();el.focus();paste();const value=el.value,undo=el.undo(),empty=el.value;
    const cancel=(e:Event)=>e.preventDefault();el.addEventListener('en-change',cancel);paste();el.removeEventListener('en-change',cancel);const cancelledValue=el.value,extraUndo=el.undo(),redo=el.redo();outcomes.push({mode,value,undo,empty,cancelledValue,extraUndo,redo,final:el.value});
   }return outcomes;
  });for(const r of result){const value=r.mode==='text'||r.mode==='accept'?'@R@R':'readable';expect(r).toEqual({mode:r.mode,value,undo:true,empty:'',cancelledValue:'',extraUndo:false,redo:true,final:value});}expect(errors).toEqual([]);
 });
}
for(const tag of ['en-rich-text-editor','en-token-editor'])test(`${tag}: fixed-clock freshness and disabled/read-only/composition guards`,async({page})=>{
 await page.goto('/probes/rich-ranges/fixture.html');const editor=page.locator(tag);await expect(editor.getByRole('textbox')).toHaveAttribute('contenteditable','true');
 const result=await editor.evaluate((el:any)=>{
  const token={kind:'token',id:'paste-rs-2',type:'ref',text:'@R',label:'R',data:null};
  el.document=el.tagName==='EN-RICH-TEXT-EDITOR'?{type:'en-rich-text',version:1,doc:{type:'doc',content:[{type:'paragraph',content:[{type:'token',attrs:{run:token}}]}]}}:{version:1,runs:[token]};
  let calls=0;el.registerToken('ref',(t:any)=>document.createTextNode(t.text),{importToken:(t:any)=>{calls++;return {...t,id:'paste-rs-3'};}});
  const paste=()=>{const event=new Event('paste',{bubbles:true,cancelable:true});Object.defineProperty(event,'clipboardData',{value:{getData:(type:string)=>type==='text/plain'?'@R':type==='application/x-en-editor+json'?JSON.stringify({type:'en-editor-clipboard',version:1,runs:[{...token,id:'paste-rs-1'}]}):''}});el.shadowRoot.querySelector('[role=textbox]').dispatchEvent(event);};
  el.disabled=true;paste();el.disabled=false;el.readOnly=true;paste();el.readOnly=false;el.shadowRoot.querySelector('[role=textbox]').dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}));paste();el.shadowRoot.querySelector('[role=textbox]').dispatchEvent(new CompositionEvent('compositionend',{bubbles:true}));const guarded={calls,value:el.value};
  const old=Date.now;Date.now=()=>1000;try{paste();}finally{Date.now=old;}
  return {guarded,calls,document:JSON.stringify(el.document)};
 });expect(result.guarded).toEqual({calls:0,value:'@R'});expect(result.calls).toBe(1);const ids=[...result.document.matchAll(/"id":"([^"]+)"/g)].map(m=>m[1]);expect(ids).toHaveLength(2);expect(ids).toContain('paste-rs-2');expect(ids).not.toContain('paste-rs-1');expect(ids).not.toContain('paste-rs-3');
});
