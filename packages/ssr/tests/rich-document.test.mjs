import {test} from 'node:test';
import assert from 'node:assert/strict';
import {richDocumentFromRuns,validateRichDocument,richSnapshot,richHTML,richText} from '../../elements/dist/rich-text-editor/document.js';
test('rich schema detaches input and rejects token drafts, unsafe URLs and invalid nodes',()=>{
 const input={type:'en-rich-text',version:1,doc:{type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'Original'}]}]}};
 const node=validateRichDocument(input);input.doc.content[0].content[0].text='Changed';assert.equal(richText(node),'Original');assert.equal(Object.isFrozen(input),false);
 assert.throws(()=>validateRichDocument({version:1,runs:[]}));
 for(const href of ['javascript:alert(1)','data:text/html,hi','//example.com','java\nscript:alert(1)']) assert.throws(()=>validateRichDocument({type:'en-rich-text',version:1,doc:{type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'link',marks:[{type:'link',attrs:{href}}]}]}]}}));
 const snapshot=richSnapshot(node);assert.ok(Object.isFrozen(snapshot.doc.content[0]));
});
test('explicit conversion preserves text, unique tokens and safe semantic HTML without DOM',()=>{
 const document=richDocumentFromRuns([{kind:'text',text:'<Hello>\n'},{kind:'token',id:'ref-1',type:'reference',text:'@Ref',label:'A & B',data:{id:1}}]);
 const node=validateRichDocument(document);assert.equal(richText(node),'<Hello>\n@Ref');assert.match(richHTML(node),/&lt;Hello&gt;/);assert.match(richHTML(node),/A &amp; B/);assert.equal(document.doc.content.length,2);
 assert.throws(()=>richDocumentFromRuns([{kind:'token',id:'same',type:'ref',text:'a',label:'A',data:null},{kind:'token',id:'same',type:'ref',text:'b',label:'B',data:null}]));
});

test('rich SSR token fallback preserves text, name and canonical content Part',()=>{
 const document=richDocumentFromRuns([{kind:'token',id:'ref-1',type:'reference',text:'@<Mira>',label:'Mira reference',data:{id:1}}]);
 const html=richHTML(validateRichDocument(document));
 assert.match(html,/aria-label="Mira reference"/);
 assert.match(html,/<span part="token-content">@&lt;Mira&gt;<\/span>/);
 assert.doesNotMatch(html,/<Mira>/);
});
