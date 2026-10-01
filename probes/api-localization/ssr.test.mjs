import test from 'node:test';
import assert from 'node:assert/strict';
await import('@lit-labs/ssr/lib/install-global-dom-shim.js');
const {html}=await import('lit');
const {render}=await import('@lit-labs/ssr');
const {collectResult}=await import('@lit-labs/ssr/lib/render-result.js');
await import('../../packages/elements/dist/define/date-picker.js');
await import('../../packages/elements/dist/define/validation-summary.js');
await import('../../packages/elements/dist/define/rich-text-editor.js');
await import('../../packages/elements/dist/define/editor-toolbar.js');
await import('../../packages/elements/dist/define/color-picker.js');
const ssr=value=>collectResult(render(value));

test('translated range actions and summary guidance are in initial HTML',async()=>{
  const markup=await ssr(html`<en-date-picker selection="range" clear-label="Borrar selección" apply-label="Aplicar" cancel-label="Cancelar"></en-date-picker><en-validation-summary description="Corrige los errores." .items=${[{target:'name',message:'Nombre obligatorio.'}]}></en-validation-summary>`);
  for(const text of ['Borrar selección','Aplicar','Cancelar','Corrige los errores.'])assert.ok(markup.includes(text));
  assert.doesNotMatch(markup,/>Clear range</);
});
test('typed partial message groups render in SSR with defaults and escaped text',async()=>{
  const markup=await ssr(html`<en-rich-text-editor .messages=${{instructions:{richText:'Editar <texto>'}}}></en-rich-text-editor><en-editor-toolbar .messages=${{commands:{bold:'Negrita'}}}></en-editor-toolbar>`);
  assert.match(markup,/Editar &lt;texto&gt;/);assert.match(markup,/Negrita/);assert.match(markup,/Italic/);
});
test('picker message categories preserve existing HEX override fallback',async()=>{
  const original=await ssr(html`<en-color-picker invalid-message="HEX personalizado"></en-color-picker>`);
  assert.match(original,/HEX personalizado/);
  const override=await ssr(html`<en-color-picker invalid-message="HEX personalizado" .messages=${{hexGuidance:'Guía HEX'}}></en-color-picker>`);
  assert.match(override,/Guía HEX/);
  const invalid=await ssr(html`<en-color-picker .value=${'invalid'} .messages=${{invalidColor:'Color no admitido.'}}></en-color-picker>`);
  assert.match(invalid,/Color no admitido\./);
});
test('message resolution retains empty strings, restores missing/nullish fields and does not mutate frozen inputs',async()=>{
  const {editorMessages}=await import('../../packages/elements/dist/editor/messages.js');
  const messages=Object.freeze({suggestions:Object.freeze({empty:'',loading:undefined,unavailable:null}),commands:Object.freeze({bold:'Negrita'})});
  const resolved=editorMessages(messages);
  assert.equal(resolved.suggestions.empty,'');assert.equal(resolved.suggestions.loading,'Loading…');
  assert.equal(resolved.suggestions.unavailable,'Suggestions unavailable.');assert.equal(resolved.commands.bold,'Negrita');
  assert.equal(editorMessages(null).commands.bold,'Bold');assert.equal(messages.suggestions.loading,undefined);
});
