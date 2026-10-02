import{t as e}from"./rolldown-runtime-B0lUwjiP.js";var t;function n(){return(n=e((()=>{t=`import '@en-reve/elements/define/button.js';
import '@en-reve/elements/define/checkbox.js';
import '@en-reve/elements/define/select.js';
import '@en-reve/elements/define/toast.js';
import '@en-reve/elements/define/toast-region.js';
import { html } from 'lit';
import { AsyncDirective, directive } from 'lit/async-directive.js';
import { ref } from 'lit/directives/ref.js';
import type { EnToastRegion } from '@en-reve/elements/toast-region.js';
import type { EnToast } from '@en-reve/elements/toast.js';

class ToastDemo extends AsyncDirective {
 private inlineLog='Changes saved. Undo is available in the notification.';
 private root?:HTMLElement;private key:unknown;private count=0;private max=3;private veto=false;private fixed=false;private placement='block-end-end';private swipe=true;private log='No notification action yet.';
 private get region(){return this.root?.querySelector<EnToastRegion>('en-toast-region');}
 private refresh(){this.setValue(this.render(this.key));}
 private add(kind:'saved'|'retry'|'timed'|'burst'|'variants'|'interrupt'|'long'){
  const region=this.region;if(!region)return;
  if(kind==='interrupt'){region.notify({swipe:this.swipe,message:'Your review session is about to end. Save your work now.',variant:'warning',interrupt:true});return;}
  if(kind==='variants'){for(const variant of ['info','success','warning','danger'] as const)region.notify({swipe:this.swipe,message:\`\${{info:'Information: a new preview is available.',success:'Success: your changes are saved.',warning:'Warning: your connection is unstable.',danger:'Error: the upload could not finish.'}[variant]}\`,variant});return;}
  if(kind==='burst'){for(let n=0;n<3;n++)region.notify({swipe:this.swipe,message:\`Export \${++this.count} is ready.\`,variant:'success'});return;}
  const toast=region.notify({swipe:this.swipe,message:kind==='retry'?'Upload failed. Your file is still available.':kind==='long'?'Your preview is ready. The updated layout includes the revised project title, the selected color palette, and all of your latest changes. This message is also retained in the activity below so you can read it again after the notification closes.':kind==='timed'?'Preview refreshed. This information remains in the activity below.':\`Settings snapshot \${++this.count} saved.\`,variant:kind==='retry'?'danger':'success',duration:kind==='timed'||kind==='long'?5000:0});
  if(kind==='retry'){
   const action=document.createElement('en-button');action.slot='actions';action.setAttribute('type','button');action.textContent='Retry upload';action.addEventListener('click',()=>{this.log='Upload retry succeeded locally.';region.focus();toast.open=false;this.refresh();region.notify({swipe:this.swipe,message:'Upload completed.',variant:'success'});});
   const details=document.createElement('en-button');details.slot='actions';details.setAttribute('type','button');details.setAttribute('variant','secondary');details.textContent='View details';details.addEventListener('click',()=>{this.log='Upload details: the simulated connection was interrupted. Your file is retained and ready to retry.';this.refresh();});
   toast.append(action,details);
  }
  this.log=kind==='timed'||kind==='long'?\`\${toast.messageText} Display budget: \${toast.effectiveDuration/1000} seconds each time it becomes visible; engagement pauses the countdown.\`:'Notification added. The simulated action changed no remote data.';this.refresh();
 }
 render(key:unknown=0){
  if(key!==this.key){this.key=key;this.count=0;this.max=3;this.veto=false;this.fixed=false;this.placement='block-end-end';this.swipe=true;this.region?.clearHistory();this.log='No notification action yet.';this.inlineLog='Changes saved. Undo is available in the notification.';const inline=this.root?.querySelector<EnToast>('#toast-inline-example');if(inline)inline.open=true;this.region?.querySelectorAll<EnToast>('en-toast').forEach(item=>{if(item.id==='toast-example')item.open=true;else item.remove();});}
  return html\`<section data-toast-demo \${ref(el=>{this.root=el as HTMLElement|undefined;})} style="display:grid;gap:var(--en-space-4);min-inline-size:0">
   <style>
    .toast-inline-demo { container:toast-inline / inline-size;min-inline-size:0;max-inline-size:40rem; }
    @container toast-inline (min-width:26rem) {
     /* Scope display to open toasts so the component still controls dismissal. */
     .toast-inline-demo .compact-notification[open]::part(base) { display:flex; }
     .toast-inline-demo .compact-notification::part(content) { flex:1 1 0; }
     .toast-inline-demo .compact-notification::part(actions) { flex:0 0 auto; }
     .toast-inline-demo .compact-notification > [slot="actions"] { margin-block-start:0; }
    }
   </style>
   <div style="display:flex;flex-wrap:wrap;gap:var(--en-space-actions)"><en-button @click=\${()=>this.add('saved')}>Save snapshot</en-button><en-button variant="secondary" @click=\${()=>this.add('retry')}>Simulate failed upload</en-button><en-button variant="secondary" @click=\${()=>this.add('timed')}>Timed update</en-button><en-button variant="secondary" @click=\${()=>this.add('long')}>Long timed update</en-button><en-button variant="secondary" @click=\${()=>this.add('variants')}>Show status variants</en-button><en-button variant="secondary" @click=\${()=>this.add('burst')}>Queue three updates</en-button><en-button variant="secondary" @click=\${()=>this.add('interrupt')}>Timely interruption</en-button><en-button variant="secondary" @click=\${()=>this.region?.focus()}>Focus notifications</en-button><en-button variant="secondary" @click=\${()=>this.region?.dismissAll()}>Dismiss all</en-button></div>
   <en-select label="Visible toast limit" .value=\${String(this.max)} .items=\${[{value:'0',label:'Unlimited'},{value:'1',label:'1 toast'},{value:'2',label:'2 toasts'},{value:'3',label:'3 toasts'},{value:'5',label:'5 toasts'}]} @en-change=\${(e:Event)=>{const target=e.currentTarget as HTMLSelectElement;queueMicrotask(()=>{if(!e.defaultPrevented){this.max=Number(target.value);this.refresh();}});}}></en-select>
   <en-toast-region .max=\${this.max} label="Demo notifications" history history-limit="5" placement=\${this.fixed?this.placement:'inline'} @en-change=\${(event:Event)=>{if((event.composedPath()[0] as Element)?.localName==='en-toast'&&this.veto)event.preventDefault();}}>
    <en-toast id="toast-example" variant="info" .swipe=\${this.swipe}>Notifications stay until dismissed by default. This initial message is readable before JavaScript starts.</en-toast>
   </en-toast-region>
   <details><summary>Initial HTML stack comparison</summary><en-toast-region label="Initial stack comparison" max="1"><en-toast>First server-rendered message.</en-toast><en-toast>Second server-rendered message.</en-toast><en-toast>Third server-rendered message.</en-toast></en-toast-region></details>
   <p>Simulate a failed upload to try two application-provided action buttons. View details updates the activity below and leaves the toast open; Retry upload completes the local simulation and closes it. Actions prevent timeout and keep their authored keyboard order.</p>
   <p>Notification history lists waiting messages and retains the five most recently closed messages as plain text. Clear recent history leaves open notifications untouched. Horizontal swipes are optional; buttons and Escape remain available.</p><p data-toast-log>\${this.log}</p>
   <section id="toast-inline-demo" class="toast-inline-demo" aria-labelledby="toast-inline-heading">
    <h4 id="toast-inline-heading">Inline action with CSS Parts</h4>
    <p>This second toast places Undo between its message and close button. In a narrow container, the action returns below the message.</p>
    <en-toast-region label="Inline action notifications">
     <en-toast id="toast-inline-example" class="compact-notification" variant="success" open>
      Changes saved.
      <en-button slot="actions" type="button" variant="secondary" @click=\${()=>{this.inlineLog='Changes undone locally.';this.root?.querySelector<EnToastRegion>('en-toast-region[label="Inline action notifications"]')?.focus();this.root?.querySelector<EnToast>('#toast-inline-example')?.dismiss();this.refresh();}}>Undo</en-button>
     </en-toast>
    </en-toast-region>
    <p data-toast-inline-log role="status">\${this.inlineLog}</p>
    <en-button variant="secondary" @click=\${()=>{const toast=this.root?.querySelector<EnToast>('#toast-inline-example');if(toast)toast.open=true;this.inlineLog='Changes saved. Undo is available in the notification.';this.refresh();}}>Show inline toast</en-button>
   </section>
   <details><summary>Review scenarios</summary><div style="display:grid;gap:var(--en-space-3);padding-block:var(--en-space-3)"><en-checkbox .checked=\${this.veto} @en-change=\${(e:Event)=>{const target=e.currentTarget as HTMLInputElement;queueMicrotask(()=>{if(!e.defaultPrevented)this.veto=target.checked;});}}>Application declines dismissal</en-checkbox><en-checkbox .checked=\${this.fixed} @en-change=\${(e:Event)=>{const target=e.currentTarget as HTMLInputElement;queueMicrotask(()=>{if(!e.defaultPrevented){this.fixed=target.checked;this.refresh();}});}}>Attach notifications to the window edge</en-checkbox><en-select label="Window placement" .value=\${this.placement} .items=\${['block-start-start','block-start-center','block-start-end','block-end-start','block-end-center','block-end-end'].map(value=>({value,label:value.replaceAll('-',' ')}))} @en-change=\${(e:Event)=>{const target=e.currentTarget as HTMLSelectElement;queueMicrotask(()=>{if(!e.defaultPrevented){this.placement=target.value;this.refresh();}});}}></en-select><en-checkbox .checked=\${this.swipe} @en-change=\${(e:Event)=>{const target=e.currentTarget as HTMLInputElement;queueMicrotask(()=>{if(!e.defaultPrevented){this.swipe=target.checked;this.region?.querySelectorAll<EnToast>('en-toast').forEach(toast=>toast.swipe=this.swipe);this.refresh();}});}}>Allow horizontal swipe dismissal</en-checkbox><p>Add messages while typing elsewhere. New messages announce without moving focus. Timed updates pause on hover, keyboard focus and page inactivity. Retry actions stay available. With a limit, waiting messages stack behind the last full toast and they do not count down until visible. Every return from the stack starts a full reading budget. Compare Timed update and Long timed update; the activity shows their calculated durations. Timely interruption bypasses ordinary waiting messages without hiding a focused toast. Escape dismisses only the focused notification. Turn on dismissal veto to compare controlled behavior.</p></div></details>
  </section>\`;
 }
}
const toastDemo=directive(ToastDemo);
export function toastExample(resetKey:unknown=0){return html\`\${toastDemo(resetKey)}\`;}`})))()}n();export{t as default};
//# sourceMappingURL=toast-source-BDFe_vYV.js.map