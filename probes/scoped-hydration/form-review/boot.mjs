import {createHydrationIsland} from '@en-reve/ssr/client.js';
const manifest = JSON.parse(document.querySelector('#manifest').textContent);
const host = document.querySelector('#managed'), root = host.shadowRoot ?? host;
const managedForm = root.querySelector('form'), nativeForm = document.querySelector('#native-form');
const status = document.querySelector('#status');
const nowButton = document.querySelector('#hydrate'), delayButton = document.querySelector('#delay');
const fields = () => [...root.querySelectorAll('en-text-field')].map(host => ({host, input:host.shadowRoot.querySelector('input')}));
function deepestFocus() { let el=document.activeElement; while (el?.shadowRoot?.activeElement) el=el.shadowRoot.activeElement; return el; }
function navigation() {
  const event=window.reviewPageShow;
  if (!event) return;
  document.querySelector('#navigation').textContent = event.persisted
    ? `Return path: BFCache — existing document resumed. Hydration state: ${island.state}.`
    : `Page show: new document; navigation type: ${event.type}. Hydration state: ${island.state}.`;
}
function inspect(form, output, managed=false) {
  if (managed && island.state !== 'ready') { output.textContent='Hydrate first: the SSR custom-element hosts are not form-associated until upgrade.'; return; }
  const data = Object.fromEntries(new FormData(form));
  const inputs = managed ? fields().map(x=>x.input) : [...form.querySelectorAll('input')];
  const mismatches = inputs.filter(input=>data[input.name]!==input.value).map(input=>input.name);
  output.textContent = `${mismatches.length ? 'Mismatch for: '+mismatches.join(', ') : 'Form entries match all visible input values.'}\n${JSON.stringify(data,null,2)}\n(Local display only; nothing submitted.)`;
}
nativeForm.addEventListener('submit', event=>{event.preventDefault();inspect(nativeForm,document.querySelector('#native-result'));});
managedForm.addEventListener('submit', event=>{event.preventDefault();inspect(managedForm,document.querySelector('#managed-result'),true);});
const island = createHydrationIsland({root,manifest,snapshot:{},loaders:{form:()=>import('./form.mjs')}});
document.querySelector('#registry').textContent=island.mode;
let timer;
async function hydrate() {
  clearTimeout(timer); nowButton.disabled=delayButton.disabled=true;
  // Capture immediately before activation. Observations never assign field values.
  const focus=deepestFocus();
  const before=fields().map(({host,input})=>({host,input,value:input.value,start:input.selectionStart,end:input.selectionEnd}));
  status.textContent='Hydrating managed fields…';
  try {
    await island.activate();
    const checks=before.map(({host,input,value,start,end})=>({field:input.name,sameInput:host.shadowRoot.querySelector('input')===input,valuePreserved:input.value===value,selectionPreserved:input.selectionStart===start&&input.selectionEnd===end}));
    window.formReview.lastPreservation={checks,focusPreserved:deepestFocus()===focus};
    document.querySelector('#preservation').textContent=JSON.stringify(window.formReview.lastPreservation,null,2);
    status.textContent='Hydration complete. Check the managed form values, or continue the history test.';
    navigation();
  } catch(error) {status.textContent=`Hydration failed: ${error.message}. Reload a fresh copy to retry.`;}
}
nowButton.addEventListener('click',hydrate);
delayButton.addEventListener('click',()=>{
  nowButton.disabled=delayButton.disabled=true;
  status.textContent='Hydration scheduled in 5 seconds. Return to a field to keep editing or select text.';
  timer=setTimeout(hydrate,5000);
});
window.formReview={island,root,fields,hydrate,lastPreservation:null};
nowButton.disabled=delayButton.disabled=false;
status.textContent='Dormant: managed fields are editable; hydration has not started.';
window.addEventListener('review-pageshow',navigation);
// Cancel only the optional timer on departure; do not dispose BFCache-preserved islands.
window.addEventListener('pagehide',()=>{if(timer){clearTimeout(timer);timer=undefined;if(island.state==='dormant'){nowButton.disabled=delayButton.disabled=false;status.textContent='Dormant: scheduled hydration canceled on navigation.';}}});
navigation();
