import '@lit-labs/ssr/lib/install-global-dom-shim.js';
import test from 'node:test';import assert from 'node:assert/strict';
const {html}=await import('lit');const {renderToString}=await import('../dist/index.js');await import('@en-reve/elements/define/token-editor.js');await import('@en-reve/elements/define/editor-trigger.js');
test('token editor initial HTML has readable escaped text and atomic fallback',async()=>{
 const document={version:1,runs:[{kind:'text',text:'Review <script>plain</script> '},{kind:'token',id:'t',type:'unknown',text:'@Mira',label:'Mira reference',data:{referenceId:'mira'}}]};const output=await renderToString(html`<en-token-editor label="Message" .document=${document}></en-token-editor>`);assert.match(output,/Review &lt;script&gt;plain&lt;\/script&gt;/);assert.match(output,/@Mira/);assert.match(output,/contenteditable="false"/);assert.match(output,/aria-label="Message"/);assert.doesNotMatch(output,/<script>plain/);
});
test('extension registration does not call providers during SSR',async()=>{
 let queries=0;await renderToString(html`<en-token-editor id="draft"></en-token-editor><en-editor-trigger for="draft" .extension=${{id:'a',trigger:'@',label:'References',provide:()=>{queries++;return [];}}}></en-editor-trigger>`);assert.equal(queries,0);
});

test('native picker hooks are not invoked during SSR',async()=>{
 let opened=0;await renderToString(html`<en-token-editor id="draft"></en-token-editor><en-editor-trigger for="draft" .extension=${{id:'colors',trigger:'#',label:'Color',open:()=>{opened++;}}}></en-editor-trigger>`);assert.equal(opened,0);
});
