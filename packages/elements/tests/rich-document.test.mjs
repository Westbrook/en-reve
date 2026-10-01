import {test} from 'node:test';
import assert from 'node:assert/strict';
import {decodeRichDocument,richDocumentFromRuns,richDocumentText} from '@en-reve/elements/rich-document.js';
import {validateRichDocument,richText} from '../dist/rich-text-editor/document.js';
import {createEditorCommandMatcher} from '@en-reve/elements/editor-command-matcher.js';
const token={kind:'token',id:'a',type:'reference',text:'@A',label:'A',data:{reference:'shared'}};
const wrap=content=>({type:'en-rich-text',version:1,doc:{type:'doc',content}});
const paragraph=text=>({type:'paragraph',content:text?[{type:'text',text}]:[]});
test('public codec and command imports need no browser globals or registration',()=>{
 assert.equal(typeof window,'undefined');assert.equal(typeof document,'undefined');assert.equal(typeof customElements,'undefined');
 assert.equal(richDocumentText(richDocumentFromRuns([{kind:'text',text:'e\u0301 👩🏽‍💻\n'},token])),'e\u0301 👩🏽‍💻\n@A');
 assert.ok(createEditorCommandMatcher(['multi word'])('/multi w'));
});
test('detached deeply frozen JSON preserves authored Unicode and marks',()=>{
 const input=wrap([{...paragraph('e\u0301'),content:[{type:'text',text:'e\u0301',marks:[{type:'strong'},{type:'em'},{type:'link',attrs:{href:'/safe'}}]},{type:'token',attrs:{run:token}}]}]);
 const result=decodeRichDocument(input);input.doc.content[0].content[0].text='changed';assert.equal(richDocumentText(result),'e\u0301@A');assert.equal(Object.isFrozen(input),false);assert.throws(()=>result.doc.content.push(paragraph('x')));assert.throws(()=>{result.doc.content[0].content[1].attrs.run.data.reference='changed';});assert.equal(richText(validateRichDocument(result)),richDocumentText(result));
});
test('UTF-8 JSON byte limits and root-inclusive node/depth limits have exact boundaries',()=>{
 const input=wrap([paragraph('é')]),bytes=Buffer.byteLength(JSON.stringify(input),'utf8');
 assert.ok(decodeRichDocument(input,{maxBytes:bytes,maxDepth:3,maxNodes:3}));
 for(const limits of [{maxBytes:bytes-1},{maxDepth:2},{maxNodes:2},{maxBytes:0},{maxDepth:NaN},{maxNodes:1.2}])assert.throws(()=>decodeRichDocument(input,limits));
 assert.throws(()=>decodeRichDocument(wrap([paragraph('a'.repeat(1_000_000))])));
});
test('codec and editor reject the same invalid schemas, links and token identities',()=>{
 const invalid=[{},wrap([]),wrap([{type:'text',text:'bad'}]),wrap([{type:'paragraph',content:[{type:'heading'}]}]),wrap([{type:'heading',attrs:{level:4}}]),wrap([{type:'ordered_list',attrs:{order:0},content:[]}]),wrap([{type:'paragraph',content:[{type:'text',text:''}]}]),wrap([{type:'paragraph',marks:[{type:'strong'}]}]),wrap([{type:'paragraph',content:[{type:'token',attrs:{run:token}},{type:'token',attrs:{run:token}}]}])];
 for(const href of ['javascript:alert(1)','data:hi','//host','a\\b','java\nscript:x'])invalid.push(wrap([{type:'paragraph',content:[{type:'text',text:'a',marks:[{type:'link',attrs:{href}}]}]}]));
 for(const input of invalid){assert.throws(()=>decodeRichDocument(input));assert.throws(()=>validateRichDocument(input));}
 for(const href of ['/relative','#anchor','https://example.test','mailto:a@example.test'])assert.ok(validateRichDocument(decodeRichDocument(wrap([{type:'paragraph',content:[{type:'text',text:'a',marks:[{type:'link',attrs:{href}}]}]}]))));
});
test('lists, empty blocks, hard breaks and token fallback project consistently',()=>{
 const input=wrap([paragraph(''),{type:'bullet_list',content:[{type:'list_item',content:[paragraph('A')]},{type:'list_item',content:[{type:'paragraph',content:[{type:'hard_break'},{type:'token',attrs:{run:token}}]}]}]},paragraph('')]);
 assert.equal(richDocumentText(input),'\nA\n\n@A\n');assert.equal(richText(validateRichDocument(input)),richDocumentText(input));
});
test('JSON data rejects cycles, accessors and non-JSON objects without executing getters',()=>{
 const input=wrap([paragraph('A')]);input.doc.content.push(input.doc);assert.throws(()=>decodeRichDocument(input));
 let invoked=false;const getter=Object.defineProperty({},'type',{enumerable:true,get(){invoked=true;return 'doc';}});assert.throws(()=>decodeRichDocument({...input,doc:getter}));assert.equal(invoked,false);
 for(const data of [undefined,Infinity,new Date(),()=>{}])assert.throws(()=>richDocumentFromRuns([{...token,data}]));
});

test('array payloads cannot hide holes behind named properties',()=>{
 const data=['a'];data.length=2;data.extra='b';assert.throws(()=>richDocumentFromRuns([{...token,data}]));
 const input=wrap([paragraph('x')]);assert.equal(richDocumentText(decodeRichDocument(input,{maxBytes:10000}),{maxBytes:10000}),'x');
});
