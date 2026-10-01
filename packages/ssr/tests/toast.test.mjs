import '@lit-labs/ssr/lib/install-global-dom-shim.js';
import test from 'node:test';
import assert from 'node:assert/strict';
const {html}=await import('lit');
const {renderToString}=await import('../dist/index.js');
await import('@en-reve/elements/define/toast-region.js');
import {parseFragment} from 'parse5';
function nodes(root,p){const result=[];function walk(n){if(p(n))result.push(n);for(const child of n.childNodes??[])walk(child);if(n.content)walk(n.content);}walk(root);return result;}
const attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value;
const text=n=>n.nodeName==='#text'?n.value:(n.childNodes??[]).map(text).join('');
test('SSR preserves slotted message and actions with empty persistent announcement channels',async()=>{
 const dom=parseFragment(await renderToString(html`<en-toast-region label="Updates"><en-toast variant="warning">Upload paused.<en-button slot="actions">Retry upload</en-button></en-toast></en-toast-region>`));
 const channels=nodes(dom,n=>['status','alert'].includes(attr(n,'role')));assert.equal(channels.length,2);assert.ok(channels.every(n=>text(n)===''));
 assert.equal(nodes(dom,n=>n.tagName==='article').length,1);assert.equal(nodes(dom,n=>n.tagName==='en-button').length,2);
 assert.equal(nodes(dom,n=>n.tagName==='slot'&&attr(n,'name')==='actions').length,1);assert.equal(nodes(dom,n=>n.tagName==='en-icon'&&attr(n,'name')==='close').length,1);
});
test('SSR closed messages remain hidden and parallel requests do not share announcements',async()=>{
 const outputs=await Promise.all(['Alpha','Beta'].map(message=>renderToString(html`<en-toast-region><en-toast .open=${false}>${message}</en-toast></en-toast-region>`)));
 for(const [index,out] of outputs.entries()){const dom=parseFragment(out);assert.notEqual(attr(nodes(dom,n=>n.tagName==='article')[0],'hidden'),undefined);assert.ok(out.includes(index?'Beta':'Alpha'));assert.ok(!out.includes(index?'Alpha':'Beta'));}
});

test('SSR caps direct children before hydration without changing application state',async()=>{
 const dom=parseFragment(await renderToString(html`<en-toast-region .max=${2}><en-toast>One</en-toast><en-toast .open=${false}>Closed</en-toast><en-toast hidden>Hidden</en-toast><en-toast>Two</en-toast><en-toast>Three</en-toast></en-toast-region>`));
 const toasts=nodes(dom,n=>n.tagName==='en-toast');assert.equal(attr(toasts[4],'data-en-toast-queued'),'');assert.equal(attr(toasts[3],'data-en-toast-stack'),'1');assert.equal(attr(toasts[4],'hidden'),undefined);
 const region=nodes(dom,n=>n.tagName==='en-toast-region')[0];assert.equal(attr(region,'data-en-toast-count'),'1');assert.equal(attr(nodes(dom,n=>attr(n,'part')==='stack-summary')[0],'hidden'),undefined);
});

test('SSR honors interrupt admission through forwarded named slots and isolates parallel responses',async()=>{
 const {LitElement}=await import('lit');
 class ToastForwardTest extends LitElement{render(){return html`<en-toast-region .max=${1}><slot name="messages"></slot></en-toast-region>`;}}
 if(!customElements.get('toast-forward-test'))customElements.define('toast-forward-test',ToastForwardTest);
 const outputs=await Promise.all([true,false].map(interrupt=>renderToString(html`<toast-forward-test><en-toast slot="messages">First</en-toast><en-toast slot="messages" .interrupt=${interrupt}>Second</en-toast></toast-forward-test>`)));
 for(const [index,output] of outputs.entries()){const toasts=nodes(parseFragment(output),n=>n.tagName==='en-toast');assert.equal(attr(toasts[index===0?0:1],'data-en-toast-queued'),'');assert.equal(attr(toasts[index===0?1:0],'data-en-toast-queued'),undefined);assert.ok(!output.includes('en-toast-stack-ssr:'));}
});
